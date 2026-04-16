// ═══════════════════════════════════════════════════════════════
// TTS 引擎 v3 — iOS Safari 深度兼容
//
// iOS 限制：
//   1. AudioContext 必须在用户手势后 resume()
//   2. fetch() 是异步的，await 之后已脱离手势窗口
//   3. audio.play() 在 async 回调中会被 iOS 拒绝
//
// 解决方案：
//   - 缓存 ArrayBuffer（不是 ObjectURL），避免二次 fetch
//   - AudioContext 在手势中 resume()，后续 source.start() 自动有效
//   - 缓存已解码的 AudioBuffer，避免重复解码
//   - 提供 unlockAudio() 供 UI 按钮直接调用
// ═══════════════════════════════════════════════════════════════

// ─── 全局 AudioContext 单例 ──────────────────────────────────────

let _ctx = null
let _unlockPromise = null   // ctx.resume() 的 Promise，用于等待解锁完成
let _currentSource = null

export function getAudioCtxState() {
  return _ctx?.state || 'not-created'
}

function getCtx() {
  if (!_ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    _ctx = new AC()
  }
  return _ctx
}

/**
 * 解锁音频 — 必须在用户手势（click / touchend）回调中同步调用
 * 返回 Promise，resolve 后 AudioContext 已可用
 *
 * ⚠️ iOS 陷阱：_unlockPromise 不能永久缓存！
 * 当用户切换 App 再返回时，iOS 会将 AudioContext 重新 suspend，
 * 此时必须重新发起 resume()，否则后续播放会静默失败。
 */
export function unlockAudio() {
  const ctx = getCtx()
  if (!ctx) return Promise.resolve()

  if (ctx.state === 'running') {
    return Promise.resolve()
  }

  // 每次 state 不是 running 时都重新发起 resume()（修复 iOS 后台切换后再次 suspend 的问题）
  _unlockPromise = ctx.resume().then(() => {
    console.log('[TTS] AudioContext 解锁成功 ✓ state:', ctx.state)
  }).catch(e => {
    console.warn('[TTS] AudioContext resume 失败:', e)
    _unlockPromise = null  // 允许重试
  })

  return _unlockPromise
}

// ─── 双层缓存：ArrayBuffer（原始）+ AudioBuffer（已解码）──────────
const _rawCache = new Map()    // cacheKey → ArrayBuffer
const _decodedCache = new Map() // cacheKey → AudioBuffer

// ─── 用 Web Audio API 播放 ArrayBuffer ──────────────────────────
async function playWithWebAudio(arrayBuffer, cacheKey, rate = 1) {
  const ctx = getCtx()
  if (!ctx) throw new Error('Web Audio API 不支持')

  // 等待 unlock 完成（由 speak() 在手势上下文中提前发起）
  if (_unlockPromise) await _unlockPromise

  // 此处已在 async 上下文中，ctx.resume() 无法获得 iOS 手势权限，
  // 所以仅做兜底检查，真正的 resume 应在 speak() 同步路径中发起
  if (ctx.state !== 'running') {
    throw new Error(`AudioContext 未运行 (state: ${ctx.state})，请先点击页面`)
  }

  // 解码（复用已解码的 AudioBuffer，decodeAudioData 会消耗 ArrayBuffer 所以要 slice）
  let audioBuffer = _decodedCache.get(cacheKey)
  if (!audioBuffer) {
    audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0))
    _decodedCache.set(cacheKey, audioBuffer)
  }

  return new Promise((resolve, reject) => {
    // 停止上一个
    if (_currentSource) {
      try { _currentSource.stop() } catch (_) {}
      _currentSource = null
    }

    const source = ctx.createBufferSource()
    source.buffer = audioBuffer
    source.playbackRate.value = Math.max(0.5, Math.min(2, rate))
    source.connect(ctx.destination)
    source.onended = () => { _currentSource = null; resolve() }
    source.onerror = reject
    source.start(0)
    _currentSource = source
  })
}

// ─── Edge TTS（通过 Vercel Serverless 代理） ────────────────────
async function edgeTTS(text, lang, rate) {
  const cacheKey = `${text}||${lang}`

  // 取缓存的原始 ArrayBuffer（不是 ObjectURL，避免二次 fetch）
  let raw = _rawCache.get(cacheKey)
  if (!raw) {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, lang, rate }),
    })
    if (!res.ok) throw new Error(`TTS API ${res.status}`)
    raw = await res.arrayBuffer()
    _rawCache.set(cacheKey, raw)
  }

  // 优先 Web Audio API（已修复 iOS 问题）
  if (window.AudioContext || window.webkitAudioContext) {
    return playWithWebAudio(raw, cacheKey, rate)
  }

  // 降级：HTMLAudioElement（不支持 Web Audio 的浏览器）
  const blob = new Blob([raw], { type: 'audio/mpeg' })
  const url = URL.createObjectURL(blob)
  return new Promise((resolve, reject) => {
    const audio = new Audio(url)
    audio.playbackRate = Math.max(0.5, Math.min(2, rate))
    audio.onended = () => { URL.revokeObjectURL(url); resolve() }
    audio.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Audio error')) }
    audio.play().catch(reject)
  })
}

// ─── Web Speech API（离线降级） ─────────────────────────────────

let _voices = []
let _voicesPromise = null

function ensureVoices() {
  if (_voicesPromise) return _voicesPromise
  _voicesPromise = new Promise((resolve) => {
    const synth = window.speechSynthesis
    if (!synth) { resolve([]); return }
    _voices = synth.getVoices()
    if (_voices.length > 0) { resolve(_voices); return }
    const h = () => {
      _voices = synth.getVoices()
      if (_voices.length > 0) { synth.removeEventListener('voiceschanged', h); resolve(_voices) }
    }
    synth.addEventListener('voiceschanged', h)
    setTimeout(() => { _voices = synth.getVoices(); synth.removeEventListener('voiceschanged', h); resolve(_voices) }, 3000)
  })
  return _voicesPromise
}

function pickVoice(lang) {
  if (!_voices.length) return null
  if (lang.startsWith('en')) {
    const hints = ['Samantha','Karen','Moira','Tessa','Fiona','Microsoft Zira','Google US English']
    for (const h of hints) {
      const v = _voices.find(v => v.name.includes(h) && v.lang.startsWith('en'))
      if (v) return v
    }
    return _voices.find(v => v.lang.startsWith('en')) || null
  }
  if (lang.startsWith('zh')) {
    const hints = ['Google 普通话','Microsoft Kangkang','Microsoft Yaoyao','Ting-Ting']
    for (const h of hints) {
      const v = _voices.find(v => v.name.includes(h) && v.lang.startsWith('zh'))
      if (v) return v
    }
    return _voices.find(v => v.lang.startsWith('zh')) || null
  }
  return _voices.find(v => v.lang.startsWith(lang)) || null
}

function webSpeechTTS(text, lang, rate) {
  return new Promise((resolve, reject) => {
    const synth = window.speechSynthesis
    if (!synth) { reject(new Error('no speechSynthesis')); return }
    synth.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = lang; u.rate = rate; u.pitch = 1; u.volume = 1
    const v = pickVoice(lang)
    if (v) u.voice = v
    if (synth.paused) synth.resume()
    u.onend = resolve
    u.onerror = (e) => {
      if (e.error === 'interrupted' || e.error === 'canceled') resolve()
      else reject(new Error(`speech: ${e.error}`))
    }
    synth.speak(u)
  })
}

// ─── iOS Web Speech 解锁 ─────────────────────────────────────
// iOS Safari 要求 speechSynthesis.speak() 也必须在手势上下文中首次调用
// 通过发一个静音空 utterance 来"激活"Web Speech，后续 async 调用才有效
let _speechUnlocked = false
function unlockSpeech() {
  if (_speechUnlocked) return
  const synth = window.speechSynthesis
  if (!synth) return
  try {
    const u = new SpeechSynthesisUtterance('')
    u.volume = 0
    synth.speak(u)
    // 立刻取消，避免真的发出任何声音
    setTimeout(() => { try { synth.cancel() } catch (_) {} }, 50)
    _speechUnlocked = true
    console.log('[TTS] Web Speech 解锁 ✓')
  } catch (_) {}
}

// ─── 统一接口 ───────────────────────────────────────────────────

export function speak(text, opts = {}) {
  if (!text) return
  const lang = opts.lang || 'en-US'
  const rate = opts.rate ?? 0.85
  if (opts.onStart) opts.onStart()

  // ⚡ iOS 双重解锁（必须在手势同步调用栈内）：
  //   1. AudioContext.resume() — 解锁 Web Audio API（用于 Edge TTS 播放）
  //   2. speechSynthesis.speak('') — 解锁 Web Speech API（用于 fallback）
  // speak() 必须从 onClick 直接调用，不能经过 async/await，否则 iOS 拒绝
  unlockAudio()
  unlockSpeech()

  edgeTTS(text, lang, rate)
    .then(() => { if (opts.onEnd) opts.onEnd() })
    .catch((err) => {
      console.warn('[TTS] Edge 失败，降级 WebSpeech:', err.message)
      ensureVoices()
        .then(() => webSpeechTTS(text, lang, rate))
        .then(() => { if (opts.onEnd) opts.onEnd() })
        .catch(() => { if (opts.onEnd) opts.onEnd() })
    })
}

export function speakEnglish(text, opts = {}) {
  return speak(text, { lang: 'en-US', rate: 0.85, ...opts })
}

export function speakChinese(text, opts = {}) {
  return speak(text, { lang: 'zh-CN', rate: 0.8, ...opts })
}

export function stop() {
  if (_currentSource) {
    try { _currentSource.stop() } catch (_) {}
    _currentSource = null
  }
  const synth = window.speechSynthesis
  if (synth) { synth.cancel(); if (synth.paused) synth.resume() }
}

export async function initTTS() {
  await ensureVoices()
}

export function getVoices() { return _voices }
