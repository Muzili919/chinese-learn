// 多模型AI调用工具 v3
// 支持DeepSeek和千问模型切换

const API_URL = '/api/ai'
const CLIENT_TIMEOUT_MS = 50000  // 阿里云国内直连，支持长请求

// 可用模型配置
export const AI_MODELS = {
  DEEPSEEK_CHAT: 'deepseek-chat',
  DEEPSEEK_REASONER: 'deepseek-reasoner',
  QWEN_MAX: 'qwen-max',
  QWEN_PLUS: 'qwen-plus',
  QWEN_TURBO: 'qwen-turbo',
}

// 默认模型
const DEFAULT_MODEL = AI_MODELS.DEEPSEEK_CHAT

/**
 * 调用AI API（支持多模型）
 * @param {string} systemPrompt - 系统提示
 * @param {string} userPrompt - 用户提示
 * @param {object} options - 选项
 * @param {string} options.model - 模型名称
 * @param {number} options.timeout - 超时时间
 * @param {number} options.temperature - 温度
 * @param {number} options.max_tokens - 最大token数
 * @param {boolean} options.requireJson - 是否要求返回JSON
 * @returns {Promise<any>}
 */
export async function callAI(systemPrompt, userPrompt, options = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), options.timeout || CLIENT_TIMEOUT_MS)

  try {
    const requestBody = {
      model: options.model || DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens || 400,
    }

    // 如果需要JSON格式，添加response_format
    if (options.requireJson !== false) {
      requestBody.response_format = { type: 'json_object' }
    }

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    })
    clearTimeout(timer)
    
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      if (res.status === 504 || errData.error === 'AI_TIMEOUT') {
        throw new Error('AI响应超时，请稍后重试')
      }
      if (res.status === 429) throw new Error('AI服务繁忙，请等待几秒后重试')
      throw new Error(errData.error || errData.message || `AI请求失败 (${res.status})`)
    }
    
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    
    if (!content) throw new Error('AI返回了空内容，请重试')
    
    // 如果要求JSON格式，尝试解析
    if (options.requireJson !== false) {
      try {
        return JSON.parse(content)
      } catch (e) {
        console.warn('AI返回内容不是有效的JSON，返回原始内容:', content.slice(0, 100))
        return content
      }
    }
    
    return content
  } catch (e) {
    clearTimeout(timer)
    if (e.name === 'AbortError') throw new Error('AI响应超时，请检查网络后重试')
    throw e
  }
}

/**
 * 评估造句是否正确（兼容旧接口）
 * @param {string} word - 要造句的词语
 * @param {string} sentence - 学生写的句子
 * @param {string} model - 使用的模型
 * @returns {{ score: number, correct: boolean, feedback: string, suggestion: string }}
 */
export async function evaluateSentence(word, sentence, model = DEFAULT_MODEL) {
  const system = `你是一位小学语文老师，负责批改学生的造句作业。
请用JSON格式返回评价结果，包含以下字段：
- score: 总分（0-100）
- correct: 布尔值，词语用法是否基本正确
- usage: 字符串，词语使用是否准确（20字以内）
- fluency: 字符串，句子是否通顺（20字以内）
- highlight: 字符串，句子的亮点（没有就写"继续加油"，20字以内）
- suggestion: 字符串，改进建议或示范句（40字以内）
评分标准：词语用法正确50分，句子通顺30分，有亮点额外20分。`

  const user = `词语：「${word}」
学生造句：「${sentence}」
请批改。`

  return callAI(system, user, { model })
}

/**
 * 生成错题变种题（举一反三）
 * @param {object} question - 原题（含 question, answer, analysis, ability_tag, knowledge_tag）
 * @param {string} model - 使用的模型
 * @returns {{ question: string, options: string[], answer: string, analysis: string }}
 */
export async function generateVariant(question, model = DEFAULT_MODEL) {
  const system = `你是一位经验丰富的语文出题老师。学生刚才做错了一道题，请为这道题生成一道"变种练习题"。
要求：
1. 考查完全相同的知识点（${question.ability_tag}）
2. 必须更换句子、语境或选项，让学生无法靠记忆直接作答
3. 难度与原题相当，保留4个选项ABCD
4. 返回合法JSON，字段固定为：question（题目）、options（数组，格式["A. 内容","B. 内容","C. 内容","D. 内容"]）、answer（正确选项全文，如"A. 内容"）、analysis（50字以内解析）`

  const user = `原题信息：
题目：${question.question}
正确答案：${question.answer}
知识点：${question.ability_tag}
解析：${question.analysis || ''}

请生成一道变种题，考查同样知识点但换不同语境，让学生真正理解而非死记答案。`

  const raw = await callAI(system, user, { model })
  
  // 确保 options 是数组
  if (!Array.isArray(raw.options)) {
    raw.options = Object.entries(raw.options).map(([k, v]) => `${k}. ${v}`)
  }
  
  return {
    id: `variant_${question.id}`,
    type: 'single_choice',
    question: raw.question,
    options: raw.options,
    answer: raw.answer,
    analysis: raw.analysis,
    knowledge_tag: question.knowledge_tag,
    ability_tag: question.ability_tag,
    difficulty: question.difficulty,
    isVariant: true,
  }
}

/**
 * 评估作文
 * @param {string} prompt - 作文题目
 * @param {string} essay - 学生写的作文
 * @param {string} model - 使用的模型
 * @returns {{ total: number, structure: number, content: number, language: number, structureFeedback: string, contentFeedback: string, languageFeedback: string, summary: string, suggestion: string }}
 */
export async function evaluateEssay(prompt, essay, model = DEFAULT_MODEL) {
  const system = `你是一位小学语文老师，负责批改5年级学生的作文。
请用JSON格式返回评价，包含以下字段：
- total: 总分（0-100）
- structure: 结构分（0-30），评判开头结尾是否完整、段落是否清晰
- content: 内容分（0-40），评判是否扣题、内容是否具体、有没有细节描写
- language: 语言分（0-30），评判用词是否准确、有没有好词好句、有没有错别字或病句
- structureFeedback: 结构评语（30字以内）
- contentFeedback: 内容评语（30字以内）
- languageFeedback: 语言评语（30字以内）
- summary: 总体评价（50字以内，要鼓励为主）
- suggestion: 最重要的一条改进建议（40字以内）
- improvements: 数组，包含2-3条具体的句子级修改建议，每条格式为 { original: "原文中某句话（15字以内）", revised: "修改后的示范（20字以内）", reason: "修改原因（15字以内）" }
请根据小学5年级水平来评判，不要太严苛，多鼓励。`

  const user = `作文题目：「${prompt}」
学生作文：
${essay}`

  return callAI(system, user, { model })
}

/**
 * 测试模型连接
 * @param {string} model - 要测试的模型
 * @returns {Promise<{success: boolean, model: string, responseTime: number, error?: string}>}
 */
export async function testModelConnection(model = DEFAULT_MODEL) {
  const startTime = Date.now()
  
  try {
    const system = '你是一个测试助手，请回复"OK"表示连接正常。'
    const user = '请回复"OK"'
    
    const result = await callAI(system, user, { 
      model, 
      requireJson: false,
      max_tokens: 10 
    })
    
    const responseTime = Date.now() - startTime
    
    return {
      success: true,
      model,
      responseTime,
      message: result
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    
    return {
      success: false,
      model,
      responseTime,
      error: error.message
    }
  }
}

/**
 * 获取可用的模型列表
 * @returns {Array<{id: string, name: string, provider: string, description: string}>}
 */
export function getAvailableModels() {
  return [
    {
      id: AI_MODELS.DEEPSEEK_CHAT,
      name: 'DeepSeek Chat',
      provider: 'DeepSeek',
      description: '通用对话模型，性价比高'
    },
    {
      id: AI_MODELS.DEEPSEEK_REASONER,
      name: 'DeepSeek Reasoner',
      provider: 'DeepSeek',
      description: '推理增强模型，适合复杂任务'
    },
    {
      id: AI_MODELS.QWEN_MAX,
      name: '通义千问 Max',
      provider: '阿里云',
      description: '千问最强模型，性能最优'
    },
    {
      id: AI_MODELS.QWEN_PLUS,
      name: '通义千问 Plus',
      provider: '阿里云',
      description: '平衡性能与成本'
    },
    {
      id: AI_MODELS.QWEN_TURBO,
      name: '通义千问 Turbo',
      provider: '阿里云',
      description: '快速响应，成本最低'
    }
  ]
}