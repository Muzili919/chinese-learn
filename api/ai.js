// ═══════════════════════════════════════════════════════════════
// Vercel Edge Function — AI 中转层
// Edge 函数超时 25s（远超普通函数 10s），适合作文评分等长请求
// 架构：浏览器 → Vercel Edge（HTTPS）→ 阿里云成都节点（HTTP）→ DeepSeek
// ═══════════════════════════════════════════════════════════════

const RELAY_URL = 'http://47.108.174.249:3000/api/ai'
const RELAY_TIMEOUT_MS = 23000  // 23s，留 2s 缓冲

export const config = {
  runtime: 'edge',
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const body = await req.text()

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), RELAY_TIMEOUT_MS)

  try {
    const relayRes = await fetch(RELAY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    const data = await relayRes.text()
    return new Response(data, {
      status: relayRes.status,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      return new Response(JSON.stringify({ error: 'AI_TIMEOUT', message: 'AI响应超时，请稍后重试' }), {
        status: 504,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return new Response(JSON.stringify({ error: 'AI request failed', detail: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
