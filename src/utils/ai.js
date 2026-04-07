const API_URL = 'https://api.deepseek.com/v1/chat/completions'
const API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY

async function callDeepSeek(systemPrompt, userPrompt) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }),
  })
  if (!res.ok) throw new Error(`DeepSeek API error: ${res.status}`)
  const data = await res.json()
  return JSON.parse(data.choices[0].message.content)
}

/**
 * 评估造句是否正确
 * @param {string} word - 要造句的词语
 * @param {string} sentence - 学生写的句子
 * @returns {{ score: number, correct: boolean, feedback: string, suggestion: string }}
 */
export async function evaluateSentence(word, sentence) {
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

  return callDeepSeek(system, user)
}

/**
 * 评估作文
 * @param {string} prompt - 作文题目
 * @param {string} essay - 学生写的作文
 * @returns {{ total: number, structure: number, content: number, language: number, structureFeedback: string, contentFeedback: string, languageFeedback: string, summary: string, suggestion: string }}
 */
export async function evaluateEssay(prompt, essay) {
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

  return callDeepSeek(system, user)
}
