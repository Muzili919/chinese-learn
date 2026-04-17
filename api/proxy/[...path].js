// Vercel catch-all 代理 → 阿里云 Express 后端
// /api/proxy/user/create  →  http://47.108.174.249:3001/api/user/create
// /api/proxy/pet-state/123 → http://47.108.174.249:3001/api/pet-state/123

const BACKEND = 'http://47.108.174.249:3000'
const TIMEOUT_MS = 9000

export default async function handler(req, res) {
  const pathParts = req.query.path // Vercel 会把 [...path] 解析为数组
  const subPath = Array.isArray(pathParts) ? pathParts.join('/') : (pathParts || '')
  const targetUrl = `${BACKEND}/api/${subPath}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const fetchOpts = {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      fetchOpts.body = JSON.stringify(req.body)
    }

    const upstream = await fetch(targetUrl, fetchOpts)
    clearTimeout(timer)
    const data = await upstream.json().catch(() => ({}))
    return res.status(upstream.status).json(data)
  } catch (e) {
    clearTimeout(timer)
    if (e.name === 'AbortError') return res.status(504).json({ error: 'PROXY_TIMEOUT' })
    return res.status(502).json({ error: e.message })
  }
}

export const config = { api: { bodyParser: { sizeLimit: '4mb' } } }
