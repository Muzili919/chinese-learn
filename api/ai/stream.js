// ═══════════════════════════════════════════════════════════════
// Vercel Edge Function — AI 流式中转层（SSE Pass-through）
// 路径: /api/ai/stream
// 作用: 把阿里云后端的 SSE 流式响应直接透传给浏览器
//       浏览器看到文字逐字出现，体感响应时间从 ~5s 降到 ~0.3s
// ═══════════════════════════════════════════════════════════════

const RELAY_STREAM_URL = 'http://47.108.174.249/api/ai/stream'
const RELAY_TIMEOUT_MS = 25000

export const config = {
  runtime: 'edge',
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const body = await req.text()

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), RELAY_TIMEOUT_MS)

  try {
    const relayRes = await fetch(RELAY_STREAM_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    if (!relayRes.ok) {
      const errText = await relayRes.text().catch(() => '')
      return new Response(
        JSON.stringify({ error: `Stream relay failed (${relayRes.status})`, detail: errText }),
        { status: relayRes.status, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 直接透传 SSE 流，不缓冲
    return new Response(relayRes.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (err) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      return new Response(
        JSON.stringify({ error: 'STREAM_TIMEOUT', message: 'AI流式响应超时' }),
        { status: 504, headers: { 'Content-Type': 'application/json' } }
      )
    }
    return new Response(
      JSON.stringify({ error: 'Stream proxy error', detail: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
