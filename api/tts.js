// ═══════════════════════════════════════════════════════════════
// Vercel Serverless Function — Edge TTS 代理 v2
// 使用 msedge-tts（比 edge-tts-node 更稳定，API 兼容当前微软服务）
// ═══════════════════════════════════════════════════════════════
import { MsEdgeTTS, OUTPUT_FORMAT, ProsodyOptions } from 'msedge-tts'

// 语音映射 — 微软神经网络音色（自然、无机械感）
const VOICES = {
  'en-US': 'en-US-AriaNeural',      // 美式英语（女，自然）
  'en-GB': 'en-GB-SoniaNeural',     // 英式英语（女）
  'zh-CN': 'zh-CN-XiaoxiaoNeural',  // 普通话（女，自然）
  'zh-TW': 'zh-TW-HsiaoChenNeural', // 台湾腔
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { text, lang = 'en-US', rate = 1.0 } = req.body

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'Text is required' })
  }

  if (text.length > 500) {
    return res.status(400).json({ error: 'Text too long (max 500 chars)' })
  }

  try {
    const voice = VOICES[lang] || VOICES['en-US']
    const tts = new MsEdgeTTS()

    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3)

    // msedge-tts v2 的 toStream() 返回 { audioStream, metadataStream, requestId }
    // rate: 0.85 → "-15%"，1.0 → "+0%"，1.2 → "+20%"
    const numRate = parseFloat(rate) || 1.0
    const pct = Math.round((numRate - 1) * 100)
    const rateStr = pct >= 0 ? `+${pct}%` : `${pct}%`
    const prosody = new ProsodyOptions({ rate: rateStr })
    const { audioStream } = tts.toStream(text, prosody)

    // 收集所有 chunk
    const chunks = []
    await new Promise((resolve, reject) => {
      audioStream.on('data', chunk => chunks.push(chunk))
      audioStream.on('end', resolve)
      audioStream.on('error', reject)
    })

    const audioBuffer = Buffer.concat(chunks)

    res.setHeader('Content-Type', 'audio/mpeg')
    res.setHeader('Content-Length', audioBuffer.length)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    res.status(200).send(audioBuffer)
  } catch (err) {
    console.error('Edge TTS error:', err)
    res.status(500).json({ error: 'TTS generation failed', detail: err.message })
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1kb',
    },
  },
}
