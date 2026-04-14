// ═══════════════════════════════════════════════════════════════
// TTS 引擎
// 优先：/api/tts（Microsoft Edge Neural TTS，音质接近多邻国）
// 降级：Web Speech API（离线 / API 失败时兜底）
// ═══════════════════════════════════════════════════════════════

// ─── Edge TTS（通过 Vercel Serverless 代理） ───────────────────

// 内存缓存：key = `${text}||${lang}` → ObjectURL
const _audioCache = new Map()

// 当前正在播放的 Audio 元素，用于 stop()
let _currentAudio = null

async function edgeTTS(text, lang, rate) {
  const cacheKey = `${text}||${lang}`
  let url = _audioCache.get(cacheKey)

  if (!url) {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang, rate }),
    })
    if (!res.ok) throw new Error(`TTS API ${res.status}`)
    const blob = await res.blob()
    url = URL.createObjectURL(blob)
    _audioCache.set(cacheKey, url)
  }

  return new Promise((resolve, reject) => {
    const audio = new Audio(url)
    audio.playbackRate = Math.max(0.5, Math.min(2, rate))
    _currentAudio = audio
    audio.onended = () => { _currentAudio = null; resolve() }
    audio.onerror = () => reject(new Error('Audio play error'))
    audio.play().catch(reject)
  })
}

// ─── Web Speech API（降级兜底） ────────────────────────────────

let _voices = []
let _voicesPromise = null

function ensureVoices() {
  if (_voicesPromise) return _voicesPromise
  _voicesPromise = new Promise((resolve) => {
    const synth = window.speechSynthesis
    if (!synth) { _voices = []; resolve([]); return }
    _voices = synth.getVoices()
    if (_voices.length > 0) { resolve(_voices); return }
    const handler = () => {
      _voices = synth.getVoices()
      if (_voices.length > 0) {
        synth.removeEventListener('voiceschanged', handler)
        resolve(_voices)
      }
    }
    synth.addEventListener('voiceschanged', handler)
    setTimeout(() => {
      _voices = synth.getVoices()
      synth.removeEventListener('voiceschanged', handler)
      resolve(_voices)
    }, 3000)
  })
  return _voicesPromise
}

function pickVoice(lang) {
  const all = _voices
  if (all.length === 0) return null
  if (lang.startsWith('en')) {
    const preferred = ['Samantha','Karen','Moira','Tessa','Fiona',
      'Microsoft Zira','Microsoft Hazel','Google US English','Google UK English Female']
    for (const hint of preferred) {
      const v = all.find(v => v.name.includes(hint) && v.lang.startsWith('en'))
      if (v) return v
    }
    return all.find(v => v.lang.startsWith('en')) || null
  }
  if (lang.startsWith('zh')) {
    const preferred = ['Google 普通话','Microsoft Kangkang','Microsoft Yaoyao',
      'Microsoft Huihui','Ting-Ting','Mei-Jia']
    for (const hint of preferred) {
      const v = all.find(v => v.name.includes(hint) && v.lang.startsWith('zh'))
      if (v) return v
    }
    return all.find(v => v.lang.startsWith('zh')) || null
  }
  return all.find(v => v.lang.startsWith(lang)) || null
}

function webSpeechTTS(text, lang, rate) {
  return new Promise((resolve, reject) => {
    const synth = window.speechSynthesis
    if (!synth) { reject(new Error('speechSynthesis not available')); return }
    synth.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = lang
    utter.rate = rate
    utter.pitch = 1
    utter.volume = 1
    const voice = pickVoice(lang)
    if (voice) utter.voice = voice
    if (synth.paused) synth.resume()
    utter.onend = () => resolve()
    utter.onerror = (e) => {
      if (e.error === 'interrupted' || e.error === 'canceled') resolve()
      else reject(new Error(`Speech error: ${e.error}`))
    }
    synth.speak(utter)
  })
}

// ─── 统一接口 ──────────────────────────────────────────────────

/**
 * 通用朗读（优先 Edge TTS → 降级 Web Speech）
 * @param {string} text
 * @param {object} opts
 * @param {string} opts.lang    - 语言代码，默认 'en-US'
 * @param {number} opts.rate    - 语速 0.1-2，默认 0.85
 * @param {Function} opts.onEnd
 * @param {Function} opts.onStart
 */
export function speak(text, opts = {}) {
  if (!text) return
  const lang = opts.lang || 'en-US'
  const rate = opts.rate ?? 0.85
  if (opts.onStart) opts.onStart()

  edgeTTS(text, lang, rate)
    .then(() => { if (opts.onEnd) opts.onEnd() })
    .catch((err) => {
      console.warn('Edge TTS failed, fallback to Web Speech:', err.message)
      ensureVoices()
        .then(() => webSpeechTTS(text, lang, rate))
        .then(() => { if (opts.onEnd) opts.onEnd() })
        .catch((err2) => {
          console.warn('Web Speech also failed:', err2)
          if (opts.onEnd) opts.onEnd()
        })
    })
}

/** 英语朗读（美式，语速 0.85） */
export function speakEnglish(text, opts = {}) {
  return speak(text, { lang: 'en-US', rate: 0.85, ...opts })
}

/** 中文朗读（普通话，语速 0.8） */
export function speakChinese(text, opts = {}) {
  return speak(text, { lang: 'zh-CN', rate: 0.8, ...opts })
}

/** 停止播放 */
export function stop() {
  if (_currentAudio) {
    _currentAudio.pause()
    _currentAudio.currentTime = 0
    _currentAudio = null
  }
  const synth = window.speechSynthesis
  if (synth) { synth.cancel(); if (synth.paused) synth.resume() }
}

/** 初始化 TTS（预加载 Web Speech voices 作为备用） */
export async function initTTS() {
  await ensureVoices()
}

/** 获取已加载的 voices */
export function getVoices() {
  return _voices
}
