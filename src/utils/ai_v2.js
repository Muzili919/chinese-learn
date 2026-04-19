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

// ★ 客户端超时要比服务端（8.5s）稍长，让服务端先返回可读错误而不是网络中断
const CLIENT_TIMEOUT_MS = 50000  // 阿里云国内直连，支持长请求

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
async function callDeepSeekWithRetry(systemPrompt, userPrompt, options = {}) {
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
 * 通用 AI 评分
 * @param {object} question - 题目对象
 * @param {string} studentAnswer - 学生答案
 * @param {'chinese'|'english'|'politics'} subject - 学科
 * @returns {object} v2.0 评分结果
 */
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
export async function generateVariants(question, count = 1, subject = 'chinese') {
  const subjectInstruction = SUBJECT_INSTRUCTIONS[subject] || ''
  // 安全上限：单次最多生成 1 道（避免超时）
  const safeCount = 1

  const system = `你是${subject === 'english' ? '英语' : '语文'}出题老师。针对学生做错的题生成1道变式练习题。
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
