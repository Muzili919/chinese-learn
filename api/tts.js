// ═══════════════════════════════════════════════════════════════
// Vercel Serverless — TTS（微软 Edge Read Aloud，免费）
// 架构：浏览器 → Vercel Node Function → Microsoft Edge TTS → MP3
//
// 旧方案是阿里云中转 + 豆包（付费 + 后端不稳），换成 msedge-tts 直连。
// 完全免费，无 API Key。
// ═══════════════════════════════════════════════════════════════

import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts'

const VOICE_MAP = {
  'en-US': 'en-US-AriaNeural',
  'en-GB': 'en-GB-LibbyNeural',
  'zh-CN': 'zh-CN-XiaoxiaoNeural',
  'zh-HK': 'zh-HK-HiuMaanNeural',
  'zh-TW': 'zh-TW-HsiaoChenNeural',
}

function pickVoice(lang) {
  if (!lang) return VOICE_MAP['en-US']
  if (VOICE_MAP[lang]) return VOICE_MAP[lang]
  if (lang.startsWith('en')) return VOICE_MAP['en-US']
  if (lang.startsWith('zh')) return VOICE_MAP['zh-CN']
  return VOICE_MAP['en-US']
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { text, lang, rate } = req.body || {}
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'BAD_INPUT', message: 'text 必填' })
  }
  if (text.length > 2000) {
    return res.status(400).json({ error: 'TEXT_TOO_LONG', message: '文本超长（>2000）' })
  }

  const voice = pickVoice(lang)
  const safeRate = Math.max(0.5, Math.min(2, Number(rate) || 1))
  const safeText = escapeXml(text)

  const tts = new MsEdgeTTS()

  try {
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3)
    const { audioStream } = tts.toStream(safeText, { rate: safeRate })

    const chunks = []
    const buffer = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        try { tts.close() } catch (_) {}
        reject(new Error('TTS_TIMEOUT'))
      }, 12000)

      audioStream.on('data', (chunk) => chunks.push(chunk))
      audioStream.on('end', () => { clearTimeout(timer); resolve(Buffer.concat(chunks)) })
      audioStream.on('close', () => { clearTimeout(timer); resolve(Buffer.concat(chunks)) })
      audioStream.on('error', (err) => { clearTimeout(timer); reject(err) })
    })

    try { tts.close() } catch (_) {}

    if (!buffer.length) {
      return res.status(502).json({ error: 'TTS_EMPTY', message: '微软返回空音频' })
    }

    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Content-Length', buffer.length)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    return res.status(200).send(buffer)
  } catch (err) {
    try { tts.close() } catch (_) {}
    const isTimeout = err?.message === 'TTS_TIMEOUT'
    return res.status(isTimeout ? 504 : 500).json({
      error: isTimeout ? 'TTS_TIMEOUT' : 'TTS_ERROR',
      detail: String(err?.message || err).slice(0, 200),
    })
  }
}
