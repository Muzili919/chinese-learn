// ═══════════════════════════════════════════════════════════════
// Vercel Serverless Function — AI 中转层
// 架构：浏览器 → Vercel（HTTPS）→ 阿里云成都节点（HTTP）→ DeepSeek
// 好处：阿里云→DeepSeek 全程国内网络，延迟 50-100ms，彻底解决超时
// ═══════════════════════════════════════════════════════════════

// 阿里云 AI 代理地址（国内节点直连 DeepSeek）
const RELAY_URL = 'http://47.108.174.249:3001/api/ai'

// Vercel Hobby 上限 10s，这里给 9s，留 1s 缓冲
const RELAY_TIMEOUT_MS = 9000

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), RELAY_TIMEOUT_MS)

  try {
    const relayRes = await fetch(RELAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    const data = await relayRes.json().catch(() => ({}))
    return res.status(relayRes.status).json(data)
  } catch (err) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      console.warn('Relay timeout after', RELAY_TIMEOUT_MS, 'ms')
      return res.status(504).json({
        error: 'AI_TIMEOUT',
        message: 'AI响应超时，请稍后重试',
      })
    }
    console.error('Relay error:', err.message)
    return res.status(500).json({ error: 'AI request failed', detail: err.message })
  }
}

export const config = {
  api: {
    bodyParser: { sizeLimit: '4mb' },
  },
}
