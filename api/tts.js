// ═══════════════════════════════════════════════════════════════
// Vercel Serverless Function — Edge TTS 代理
// 接收 text, lang, rate 参数，返回 MP3 音频流
// ═══════════════════════════════════════════════════════════════
import { MsEdgeTTS, OUTPUT_FORMAT } from 'edge-tts-node'

// 语音映射
const VOICES = {
  'en-US': 'en-US-AriaNeural',      // 美式英语（女）
  'en-GB': 'en-GB-SoniaNeural',     // 英式英语（女）
  'zh-CN': 'zh-CN-XiaoxiaoNeural',  // 普通话（女）
  'zh-TW': 'zh-TW-HsiaoChenNeural', // 台湾腔
}

export default async function handler(req, res) {
  // 只允许 POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { text, lang = 'en-US', rate = 1.0 } = req.body

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'Text is required' })
  }

  // 限制文本长度
  if (text.length > 500) {
    return res.status(400).json({ error: 'Text too long (max 500 chars)' })
  }

  try {
    const voice = VOICES[lang] || VOICES['en-US']
    const tts = new MsEdgeTTS()

    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3)

    // edge-tts-node ProsodyOptions.rate 期望数值（1.0=正常速度），直接传入
    const readable = tts.toStream(text, { rate: rate || 1.0 })

    // 收集所有 chunk 为 Buffer
    const chunks = []
    for await (const chunk of readable) {
      chunks.push(chunk)
    }

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
