// ═══════════════════════════════════════════════════════════════
// Vercel Edge Function — TTS 中转层（二进制流）
// 架构：浏览器 → Vercel Edge → 阿里云后端 → 豆包 TTS → 返回 MP3
// ═══════════════════════════════════════════════════════════════

const BACKEND = 'http://47.108.174.249:3000/api/tts'
const TIMEOUT_MS = 10000

export const config = {
  runtime: 'edge',
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  try {
    const body = await req.text()

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const upstream = await fetch(BACKEND, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: controller.signal,
    })

    clearTimeout(timer)

    // ★ 关键：TTS 返回二进制 MP3 数据，不能用 .json()！
    if (!upstream.ok) {
      const errText = await upstream.text()
      return new Response(JSON.stringify({ error: 'TTS_FAILED', detail: errText.slice(0, 200) }), {
        status: upstream.status,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const buffer = await upstream.arrayBuffer()

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.byteLength,
        'Cache-Control': 'public, max-age=31536000',
      },
    })
  } catch (err) {
    clearTimeout(timer)
    if (err.name === 'AbortError') {
      return new Response(JSON.stringify({ error: 'TTS_TIMEOUT', message: '语音生成超时，请稍后重试' }), {
        status: 504,
        headers: { 'Content-Type': 'application/json' },
      })
    }
    return new Response(JSON.stringify({ error: 'TTS_ERROR', detail: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
