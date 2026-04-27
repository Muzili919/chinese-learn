/**
 * AI v2.0 评分引擎 + 举一反三生成器
 * 
 * 核心能力：
 * 1. evaluateQuestion() - 通用 AI 评分，按 v2.0 JSON Schema 输出丰富评分信息
 * 2. generateVariants() - 举一反三，生成 3 道变式题 + 每题附带得分点/易错点
 * 3. recognizePhotoQuestion() - 拍照识别题目，返回结构化数据
 */

// 通过 Vercel Serverless Function 代理调用 DeepSeek API（保护 Key 安全）
const API_URL = '/api/ai'
const API_STREAM_URL = '/api/ai/stream'

// ★ 客户端超时要比服务端（8.5s）稍长，让服务端先返回可读错误而不是网络中断
const CLIENT_TIMEOUT_MS = 50000  // 阿里云国内直连，支持长请求

/**
 * SSE 流式调用 DeepSeek（体感更快，用户看到文字逐步出现）
 * 
 * @returns {AsyncGenerator<{delta: string, fullText: string}>} 异步生成器，每次 yield 一个 token 片段
 */
async function* callDeepSeekStream(systemPrompt, userPrompt, options = {}) {
  const res = await fetch(API_STREAM_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: options.model || 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens || 400,
    }),
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new Error(errData.error || `AI流式请求失败 (${res.status})`)
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let fullText = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) continue
      const data = trimmed.slice(5).trim()
      if (data === '[DONE]') return
      try {
        const parsed = JSON.parse(data)
        // DeepSeek 流式格式：choices[0].delta.content
        const delta = parsed.choices?.[0]?.delta?.content || ''
        if (delta) {
          fullText += delta
          yield { delta, fullText }
        }
      } catch (e) {
        // 忽略解析失败的行
      }
    }
  }

  // 最终返回完整文本供解析
  if (fullText) {
    try {
      yield { final: true, parsed: JSON.parse(fullText) }
    } catch (e) {
      throw new Error('AI返回的JSON不完整或格式错误')
    }
  }
}

async function callDeepSeek(systemPrompt, userPrompt, options = {}) {
  const controller = new AbortController()
  const timeoutMs = options.timeout || CLIENT_TIMEOUT_MS
  const timer = setTimeout(() => {
    console.warn(`⏰ AI请求客户端超时(${timeoutMs}ms)`)
    controller.abort()
  }, timeoutMs)

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options.model || 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        temperature: options.temperature ?? 0.7,
        // ★ 默认 400 token（评分够用），复杂任务调用方自行传 max_tokens
        max_tokens: options.max_tokens || 400,
      }),
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      // 超时错误给用户友好提示
      if (res.status === 504 || errData.error === 'AI_TIMEOUT') {
        throw new Error('AI响应超时，请稍后重试（建议减少题目数量）')
      }
      if (res.status === 429) {
        throw new Error('AI服务繁忙，请等待几秒后重试')
      }
      throw new Error(errData.error || errData.message || `AI请求失败 (${res.status})`)
    }

    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) throw new Error('AI返回了空内容，请重试')
    return JSON.parse(content)
  } catch (e) {
    clearTimeout(timer)
    if (e.name === 'AbortError') {
      throw new Error('AI响应超时，请检查网络后重试')
    }
    throw e
  }
}

// ★ 带一次自动重试的包装（网络抖动时自动恢复）
export async function callDeepSeekWithRetry(systemPrompt, userPrompt, options = {}) {
  try {
    return await callDeepSeek(systemPrompt, userPrompt, options)
  } catch (e) {
    // 超时或服务繁忙时等 2s 重试一次
    if (e.message.includes('超时') || e.message.includes('繁忙')) {
      console.warn('[AI] 第一次请求失败，2s 后自动重试...', e.message)
      await new Promise(r => setTimeout(r, 2000))
      return await callDeepSeek(systemPrompt, userPrompt, options)
    }
    throw e
  }
}

// ───────────────────────────────────────────────────────────────
// 1. 通用评分引擎
// ───────────────────────────────────────────────────────────────

const SUBJECT_INSTRUCTIONS = {
  chinese: `
## 语文学科专用规则
- 阅读理解题：使用口诀"先审题→找原文→定区间→筛信息→组答案"，提醒学生按步骤作答
- 文言文翻译：关键字词必须用【】标注，如"【安】怎么【求】追求"
- 作文/造句：评语控制在50字以内，不说废话
- 古诗词默写：错一个字即错，不得部分给分
`.trim(),

  english: `
## 英语学科专用规则
- 单词拼写：完全匹配才对，大小写不敏感
- 语法题：指出具体语法规则名称（如"现在完成时""第三人称单数"）
- 翻译题：关键词翻译正确给60%分，语序/搭配问题适当扣分
- 听力题：强调听力技巧（如"注意转折词but/however"）
`.trim(),

  politics: `
## 道德与法治学科专用规则
- 选择题：必须准确对应教材表述，关键术语不能有偏差
- 简答题：按踩分点给分，关键术语（如"人民代表大会""依法治国"）必须准确
- 材料分析题：必须体现"理论+材料"的结合，纯理论不联系材料扣分
- 实践探究题：格式分（称谓/正文/落款）占20%，内容分占60%，语言分占20%
- 时政题：注意区分"原因"和"意义"的答题角度
`.trim(),
}

/**
 * 通用 AI 评分（流式版，用户看到文字逐步出现）
 * @param {object} question - 题目对象
 * @param {string} studentAnswer - 学生答案
 * @param {'chinese'|'english'|'politics'} subject - 学科
 * @param {function} onChunk - 可选回调：(delta, fullText) => void，用于实时显示进度
 * @returns {object} v2.0 评分结果（完整返回，和同步版兼容）
 */
export async function evaluateQuestionStream(question, studentAnswer, subject = 'chinese', onChunk) {
  const subjectInstruction = SUBJECT_INSTRUCTIONS[subject] || ''
  const subjectName = { chinese: '语文', english: '英语', politics: '道德与法治' }[subject] || '语文'

  const system = `你是一位${subjectName}老师，批改学生答题。严格评分，不放水。
${subjectInstruction}

只返回JSON，字段：
{"score":0-100,"correct":bool,"errorType":"审题错误|知识缺失|理解偏差|表达不当|完全正确","teachingTip":"为什么这么答(40字内)","keyTechnique":"技巧口诀(20字内)","fullAnswer":"满分示范答案"}`

  const user = `题目：${question.question || question.question_text || ''}
答案：${question.answer || ''}
知识点：${question.knowledge_tag || ''}${question.ability_tag ? ' / ' + question.ability_tag : ''}
学生答：${studentAnswer}`

  // 使用流式调用
  let finalResult = null
  for await (const chunk of callDeepSeekStream(system, user, { max_tokens: 350 })) {
    if (chunk.final) {
      finalResult = chunk.parsed
    }
    if (onChunk && chunk.delta) onChunk(chunk.delta, chunk.fullText)
  }

  if (!finalResult) throw new Error('AI流式响应不完整')
  return finalResult
}

export async function evaluateQuestion(question, studentAnswer, subject = 'chinese') {
  const subjectInstruction = SUBJECT_INSTRUCTIONS[subject] || ''

  const subjectName = { chinese: '语文', english: '英语', politics: '道德与法治' }[subject] || '语文'

  // ★ 精简 schema：从 9 个字段减到 6 个核心字段，减少约 40% 输出 token
  const system = `你是一位${subjectName}老师，批改学生答题。严格评分，不放水。
${subjectInstruction}

只返回JSON，字段：
{"score":0-100,"correct":bool,"errorType":"审题错误|知识缺失|理解偏差|表达不当|完全正确","teachingTip":"为什么这么答(40字内)","keyTechnique":"技巧口诀(20字内)","fullAnswer":"满分示范答案"}`

  const user = `题目：${question.question || question.question_text || ''}
答案：${question.answer || ''}
知识点：${question.knowledge_tag || ''}${question.ability_tag ? ' / ' + question.ability_tag : ''}
学生答：${studentAnswer}`

  return callDeepSeekWithRetry(system, user, { max_tokens: 350 })
}

// ───────────────────────────────────────────────────────────────
// 2. 举一反三 - 生成 3 道变式题
// ───────────────────────────────────────────────────────────────

/**
 * 生成举一反三变式题
 * @param {object} question - 原题
 * @param {number} count - 生成数量，默认3
 * @param {'chinese'|'english'} subject - 学科
 * @returns {{ variants: Array<object> }}
 */
// ★ 优化策略：一次只生成 1 道题（原来最多3道），大幅降低 token 数量和响应时间
// 调用方如果需要多道，请循环调用本函数（逐道生成，每道单独显示，体验更好）
/**
 * 生成举一反三变式题（流式版）
 * @param {object} question - 原题
 * @param {number} count - 生成数量，默认1
 * @param {'chinese'|'english'} subject - 学科
 * @param {function} onChunk - 可选回调：(delta, fullText) => void
 * @returns {{ variants: Array<object> }}
 */
export async function generateVariantsStream(question, count = 1, subject = 'chinese', onChunk) {
  const subjectInstruction = SUBJECT_INSTRUCTIONS[subject] || ''
  const subjectLabel = { chinese: '语文', english: '英语', politics: '道德与法治', math: '数学' }[subject] || '语文'

  const system = `你是${subjectLabel}出题老师。针对学生做错的题生成1道变式练习题。
${subjectInstruction}
规则：考查相同知识点、换语境、选择题4个选项ABCD、answer必须与options某项完全一致。
只返回JSON：{"variants":[{"id":"v1","type":"single_choice","question":"题干","options":["A.","B.","C.","D."],"answer":"完整正确选项","analysis":"解析30字内","teachingTip":"提示20字内"}]}`

  const user = `原题：${question.question || question.question_text || ''}
答案：${question.answer || ''}  知识点：${question.knowledge_tag || ''}${question.ability_tag ? '/' + question.ability_tag : ''}${question.options ? '\n选项：' + JSON.stringify(question.options) : ''}
生成1道变式题。`

  let finalResult = null
  for await (const chunk of callDeepSeekStream(system, user, { max_tokens: 500 })) {
    if (chunk.final) finalResult = chunk.parsed
    if (onChunk && chunk.delta) onChunk(chunk.delta, chunk.fullText)
  }

  if (!finalResult || !finalResult.variants) throw new Error('AI流式返回格式错误')

  return {
    variants: finalResult.variants.map((v, i) => ({
      ...v,
      id: v.id || `variant_${question.id || 'q'}_${i + 1}`,
      knowledge_tag: question.knowledge_tag,
      ability_tag: question.ability_tag,
      isVariant: true,
    }))
  }
}

export async function generateVariants(question, count = 1, subject = 'chinese') {
  const subjectInstruction = SUBJECT_INSTRUCTIONS[subject] || ''
  const subjectLabel = { chinese: '语文', english: '英语', politics: '道德与法治', math: '数学' }[subject] || '语文'
  // 安全上限：单次最多生成 1 道（避免超时）
  const safeCount = 1

  const system = `你是${subjectLabel}出题老师。针对学生做错的题生成1道变式练习题。
${subjectInstruction}
规则：考查相同知识点、换语境、选择题4个选项ABCD、answer必须与options某项完全一致。
只返回JSON：{"variants":[{"id":"v1","type":"single_choice","question":"题干","options":["A.","B.","C.","D."],"answer":"完整正确选项","analysis":"解析30字内","teachingTip":"提示20字内"}]}`

  const user = `原题：${question.question || question.question_text || ''}
答案：${question.answer || ''}  知识点：${question.knowledge_tag || ''}${question.ability_tag ? '/' + question.ability_tag : ''}${question.options ? '\n选项：' + JSON.stringify(question.options) : ''}
生成1道变式题。`

  const result = await callDeepSeekWithRetry(system, user, { max_tokens: 500 })

  if (!result.variants || !Array.isArray(result.variants)) {
    throw new Error('AI 返回格式错误：缺少 variants 数组')
  }

  return {
    variants: result.variants.map((v, i) => ({
      ...v,
      id: v.id || `variant_${question.id || 'q'}_${i + 1}`,
      knowledge_tag: question.knowledge_tag,
      ability_tag: question.ability_tag,
      isVariant: true,
    }))
  }
}

// ───────────────────────────────────────────────────────────────
// 3. 拍照识别题目
// ───────────────────────────────────────────────────────────────

/**
 * 识别照片中的题目
 * @param {string} imageBase64 - 图片的 Base64 编码
 * @returns {object} 结构化题目数据
 */
export async function recognizePhotoQuestion(imageBase64) {
  // DeepSeek Chat API 不直接支持图片输入，使用文字描述模式
  // 实际实现中，先用 OCR 提取文字，再交给 AI 解析
  const system = `你是一位专业的题目识别助手。用户会给你一段从试卷/练习册上 OCR 识别出的文字，请将其解析为结构化的题目数据。

## 返回 JSON Schema
{
  "success": boolean,
  "questions": [
    {
      "type": "single_choice",          // 或 "fill_blank" 或 "open_ended"
      "question": "完整题干文本",
      "options": ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"],  // 选择题才有
      "answer": "正确答案（如果能识别出来的话，否则为空字符串）",
      "analysis": "解析（如果有，否则为空字符串）",
      "knowledge_tag": "知识点分类",
      "ability_tag": "能力分类",
      "difficulty": 2                   // 1-5
    }
  ],
  "ocrText": "原始OCR识别文本"
}

## 规则
1. 尽量完整保留题目文本，不要省略
2. 如果题目有多个子题(1)(2)(3)，拆分成多个 question
3. 知识点分类参考：字词/古诗词/成语/句子/文学常识
4. 能力分类参考：识记/理解/运用/分析
5. 如果 OCR 文本太乱无法识别，设置 success=false`

  const user = `以下是从试卷上 OCR 识别出的文字，请解析为结构化题目：

${imageBase64}`

  return callDeepSeek(system, user, { temperature: 0.3 })
}

/**
 * 将拍照识别的题目存入错题集
 * @param {string} userId - 用户ID
 * @param {object} recognizedQuestion - AI识别出的结构化题目
 * @param {object} storage - storage 工具
 */
export function savePhotoQuestionToWrongBook(userId, recognizedQuestion, storage) {
  // 生成唯一ID
  const id = `photo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  // 构造与现有错题相同格式的记录
  const record = {
    card_id: id,
    correct: false,
    time_spent: 0,
    selected_answer: '',
    ability_tag: recognizedQuestion.ability_tag || '识记',
    knowledge_tag: recognizedQuestion.knowledge_tag || '字词',
    subject: 'chinese',
    timestamp: new Date().toISOString(),
    source: 'photo',  // 标记来源
  }

  // 存入答题记录
  storage.addRecord(userId, record)

  // 同时存入题库映射（方便错题集查找）
  const photoQuestions = JSON.parse(localStorage.getItem('cl_photo_questions') || '{}')
  photoQuestions[id] = {
    ...recognizedQuestion,
    id,
    source: 'photo',
    createdAt: new Date().toISOString(),
  }
  localStorage.setItem('cl_photo_questions', JSON.stringify(photoQuestions))

  return id
}

/**
 * 获取拍照上传的题目（用于错题集显示）
 */
export function getPhotoQuestions() {
  return JSON.parse(localStorage.getItem('cl_photo_questions') || '{}')
}

/**
 * 根据 ID 获取题目（优先从拍照题库查找，再从内置题库查找）
 */
export function getQuestionById(id, builtInQMap = {}) {
  // 先查拍照题库
  const photoQuestions = getPhotoQuestions()
  if (photoQuestions[id]) return photoQuestions[id]
  // 再查内置题库
  return builtInQMap[id] || null
}


// ─── 苏格拉底式追问 ─────────────────────────────────────────
// ─── 苏格拉底追问：学科定制策略 ─────────────────────────────────

const SOCRATIC_STRATEGIES = {
  chinese: {
    role: '语文老师',
    rules: [
      '第一轮问"你觉得这道题在考什么知识点"',
      '引导学生回忆相关课文、古诗或文学常识',
      '如果考字词，追问"这个字/词在什么语境下见过"',
      '如果考古诗词，追问"这首诗的作者是谁？什么朝代？表达什么情感"',
      '如果考修辞手法，追问"这句话用了什么手法？换成普通说法效果有什么不同"',
    ],
  },
  english: {
    role: '英语老师',
    rules: [
      '第一轮用中文问"你觉得这道题在考哪个语法点或词汇"',
      '引导学生回忆语法规则名称（如"现在完成时""被动语态"）',
      '如果考词汇，问"这个词的词根/词缀是什么？和哪个词有关联"',
      '如果考听力/阅读，问"注意题目中的关键词，原文是怎么表达的"',
      '如果考写作，问"你觉得这个句型还可以怎么改写"',
      '可以适当用英文举例，但问题本身用中文问',
    ],
  },
  math: {
    role: '数学老师',
    rules: [
      '第一轮问"你觉得这道题要用什么方法/公式来解决"',
      '引导学生说清楚解题步骤，而不是只看答案',
      '如果学生说不出方法，问"你觉得已知条件和要求的结果之间有什么关系"',
      '如果计算错误，问"能再算一遍吗？注意运算顺序"',
      '如果是应用题，问"能不能画个图/列个方程帮助理解"',
      '如果是几何题，问"这里有什么隐藏条件？哪些角/边是相等的"',
      '绝不直接告诉公式，引导学生自己推导',
    ],
  },
  politics: {
    role: '道德与法治老师',
    rules: [
      '第一轮问"你觉得这道题考的是哪个知识板块"',
      '引导学生回忆教材中的核心概念和表述',
      '追问"教材上对这个概念是怎么表述的"',
      '如果考时政，问"这件事体现了课本上的什么原理"',
      '强调关键术语的准确性，不能似是而非',
    ],
  },
}

export async function socraticFollowUp(question, studentAnswer, history = [], subject = 'chinese') {
  const strategy = SOCRATIC_STRATEGIES[subject] || SOCRATIC_STRATEGIES.chinese
  const subjectRules = strategy.rules.map((r, i) => `${i + 3}. ${r}`).join('\n')

  const systemPrompt = `你是一位耐心的${strategy.role}，用苏格拉底提问法引导学生理解错题。
规则：
1. 绝不直接告诉答案
2. 每次只问一个问题，引导学生自己想
${subjectRules}
${strategy.rules.length + 3}. 根据学生的回答判断理解偏差，针对性追问
${strategy.rules.length + 4}. 如果学生连续2轮都答偏了，可以给一个具体线索
${strategy.rules.length + 5}. 最多3轮，之后标记 isFinal=true
${strategy.rules.length + 6}. 评价简短（15字以内），问题具体（30字以内）
返回JSON: {"question":"引导问题","hint":"提示(可选)","isFinal":bool,"evaluation":"评价"}`

  const historyText = history.length > 0
    ? history.map(m => `${m.role === 'user' ? '学生' : '老师'}：${m.content}`).join('\n')
    : ''

  const userPrompt = '原题：' + (question.question || '') + '\n'
    + '正确答案：' + (question.answer || '') + '\n'
    + '学生选的：' + (studentAnswer || '') + '\n'
    + (question.options ? '选项：' + question.options.join(' | ') + '\n' : '')
    + (historyText ? '对话历史：\n' + historyText : '这是第一轮提问。') + '\n'
    + '请生成下一轮苏格拉底式追问。'

  return callDeepSeekWithRetry(systemPrompt, userPrompt, { max_tokens: 300, temperature: 0.8 })
}

// ─── 费曼学习法验证：学科定制 ─────────────────────────────────

const FEYNSTRATEGIES = {
  chinese: {
    role: '语文老师',
    criteria: [
      '是否说出了关键知识点（如：修辞手法名称、古诗作者/朝代、字词本义）',
      '是否用自己的话复述了正确答案的逻辑',
      '如果只背了答案但说不清为什么，给 50-60 分',
    ],
  },
  english: {
    role: '英语老师',
    criteria: [
      '是否说出了语法规则名称（如"现在完成时：have/has + 过去分词"）',
      '是否解释了为什么这个选项对而其他选项错',
      '可以中英混合表述，但核心语法概念要准确',
      '如果只说"因为听起来对"而说不出规则，给 40-50 分',
    ],
  },
  math: {
    role: '数学老师',
    criteria: [
      '是否说清了解题思路（先求什么、再求什么）',
      '是否提到了关键公式或定理',
      '是否能用自己的话说出为什么这个方法管用',
      '如果只说了计算过程但不知道为什么这么算，给 50-60 分',
      '如果完全说不出思路只会背答案，给 30 分以下',
    ],
  },
  politics: {
    role: '道德与法治老师',
    criteria: [
      '是否准确说出了核心概念/术语（必须和教材表述基本一致）',
      '是否能把概念和题目情境联系起来',
      '如果只说了大概意思但术语不准确，给 50-60 分',
    ],
  },
}

export async function feynmanVerify(question, studentExplanation, subject = 'chinese') {
  const strategy = FEYNSTRATEGIES[subject] || FEYNSTRATEGIES.chinese
  const criteriaText = strategy.criteria.map((c, i) => `${i + 1}. ${c}`).join('\n')

  const systemPrompt = `你是一位${strategy.role}，用费曼学习法验证学生是否真正理解了这道题。
学生需要用自己的话解释为什么正确答案是对的。

评分标准：
${criteriaText}

通用规则：
- score >= 70 分算通过（passed=true）
- 未通过时，misunderstanding 必须具体指出学生哪个概念没理解
- feedback 以鼓励为主（30字以内），指出进步点
- 如果学生解释得很清楚，可以给 85-100 分
返回JSON: {"passed":bool,"score":0-100,"feedback":"反馈","misunderstanding":"理解偏差(未通过时)"}`

  const userPrompt = `原题：${question.question || ''}
正确答案：${question.answer || ''}
${question.analysis ? '参考解析：' + question.analysis : ''}
${question.options ? '选项：' + question.options.join(' | ') : ''}
学生的解释：${studentExplanation}
请评估学生是否真正理解了这道题的解题逻辑。`

  return callDeepSeekWithRetry(systemPrompt, userPrompt, { max_tokens: 300, temperature: 0.5 })
}
