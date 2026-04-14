// ═══════════════════════════════════════════════════════════════
// Vercel Serverless Function — DeepSeek AI 代理
// 将前端的 AI 请求代理到 DeepSeek API，保护 API Key 安全
// ═══════════════════════════════════════════════════════════════

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY

export default async function handler(req, res) {
  // 只允许 POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // 检查 API Key 配置
  if (!DEEPSEEK_API_KEY) {
    console.error('DEEPSEEK_API_KEY not configured in Vercel environment')
    return res.status(500).json({ error: 'AI service not configured' })
  }

  try {
    const { model, messages, response_format, temperature, max_tokens } = req.body

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' })
    }

    // 构建请求体给 DeepSeek
    const body = {
      model: model || 'deepseek-chat',
      messages,
    }

    // 可选参数（只在提供时才加）
    if (response_format) body.response_format = response_format
    if (temperature !== undefined) body.temperature = temperature
    if (max_tokens) body.max_tokens = max_tokens

    const apiRes = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify(body),
    })

    if (!apiRes.ok) {
      const errText = await apiRes.text()
      console.error('DeepSeek API error:', apiRes.status, errText)
      return res.status(apiRes.status).json({
        error: `DeepSeek API error: ${apiRes.status}`,
        detail: errText,
      })
    }

    const data = await apiRes.json()
    return res.status(200).json(data)
  } catch (err) {
    console.error('AI proxy error:', err)
    return res.status(500).json({ error: 'AI request failed', detail: err.message })
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50kb',
    },
  },
}
