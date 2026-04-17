// ═══════════════════════════════════════════════════════════════
// Vercel Serverless Function — DeepSeek AI 代理
// ⚠️ 注意：Vercel Hobby 免费版函数最多只能跑 10 秒
//    复杂请求（出题/作文批改）请升级 Pro 或迁移到 Cloudflare Workers
// ═══════════════════════════════════════════════════════════════

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || process.env.VITE_DEEPSEEK_API_KEY

// Vercel Hobby 上限 10s，留 1s 给网络开销，实际给 DeepSeek 8s
// Vercel Pro 上限 60s，给 DeepSeek 55s
const SERVER_TIMEOUT_MS = 8500

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (!DEEPSEEK_API_KEY) {
    console.error('DEEPSEEK_API_KEY not configured in Vercel environment')
    return res.status(500).json({ error: 'AI service not configured' })
  }

  const { model, messages, response_format, temperature, max_tokens } = req.body

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array is required' })
  }

  // 强制 max_tokens 上限：避免 DeepSeek 输出过多内容拖慢速度
  // 评分类：512 足够；出题类：调用方自行传入更大值（但要考虑超时风险）
  const effectiveMaxTokens = Math.min(max_tokens || 512, 1200)

  const body = {
    model: model || 'deepseek-chat',
    messages,
    max_tokens: effectiveMaxTokens,
  }
  if (response_format) body.response_format = response_format
  if (temperature !== undefined) body.temperature = temperature

  // ★ 服务端超时保护：在 Vercel 强制杀死函数之前主动返回可读错误
  const controller = new AbortController()
  const timeoutId = setTimeout(() => {
    controller.abort()
  }, SERVER_TIMEOUT_MS)

  try {
    const apiRes = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!apiRes.ok) {
      const errText = await apiRes.text()
      console.error('DeepSeek API error:', apiRes.status, errText)
      // 429 = 限流，503 = 服务不可用，给前端有意义的提示
      if (apiRes.status === 429) {
        return res.status(429).json({ error: 'AI服务繁忙，请稍后重试（限流）' })
      }
      return res.status(apiRes.status).json({
        error: `DeepSeek API error: ${apiRes.status}`,
        detail: errText,
      })
    }

    const data = await apiRes.json()
    return res.status(200).json(data)
  } catch (err) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      console.warn('DeepSeek request timed out after', SERVER_TIMEOUT_MS, 'ms')
      return res.status(504).json({
        error: 'AI_TIMEOUT',
        message: 'AI响应超时，请减少题目数量或稍后重试',
        timeoutMs: SERVER_TIMEOUT_MS,
      })
    }
    console.error('AI proxy error:', err)
    return res.status(500).json({ error: 'AI request failed', detail: err.message })
  }
}

export const config = {
  api: {
    bodyParser: { sizeLimit: '4mb' },
  },
}
