// ═══════════════════════════════════════════════════════════════
// TTS 引擎
// 优先：/api/tts（Microsoft Edge Neural TTS，音质接近多邻国）
// 降级：Web Speech API（离线 / API 失败时兜底）
//
// ★ 移动端适配：
//   iOS/Android 要求音频必须在用户手势上下文内启动。
//   async fetch 会破坏该上下文，导致 audio.play() 被浏览器拒绝。
//   解决方案：首次用户交互时用 AudioContext 解锁，后续改用
//   Web Audio API（ctx.createBufferSource().start()），
//   该 API 在 AudioContext 解锁后即使在 async 回调里也可正常播放。
// ═══════════════════════════════════════════════════════════════

// ─── Web Audio Context（全局单例） ───────────────────────────────

let _webAudioCtx = null
let _audioUnlocked = false
let _currentSource = null  // 当前正在播放的 AudioBufferSourceNode

function getWebAudioCtx() {
  if (!_webAudioCtx) {
    _webAudioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return _webAudioCtx
}

/**
 * 解锁音频系统（必须在用户手势回调里调用）
 * 在 App.jsx 注册 touchstart/click 监听，首次交互时触发
 */
export function unlockAudio() {
  if (_audioUnlocked) return
  try {
    const ctx = getWebAudioCtx()
    // resume 挂起的 context（iOS Safari 常见）
    if (ctx.state === 'suspended') ctx.resume()
    // 播放1个采样的无声 buffer，"激活"音频会话
    const buf = ctx.createBuffer(1, 1, 22050)
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.connect(ctx.destination)
    src.start(0)
    _audioUnlocked = true
    console.log('[TTS] 音频已解锁 ✓')
  } catch (e) {
    // 忽略：部分浏览器不支持 Web Audio API
  }
}

// ─── 内存缓存：key = `${text}||${lang}` → ObjectURL ─────────────
const _audioCache = new Map()

// ─── 用 Web Audio API 播放 ObjectURL（移动端兼容核心） ───────────
async function playWithWebAudio(blobUrl, rate = 1) {
  const ctx = getWebAudioCtx()
  // 如果 context 被挂起（后台切换后），先恢复
  if (ctx.state === 'suspended') await ctx.resume()

  // fetch ObjectURL → ArrayBuffer → AudioBuffer
  const response = await fetch(blobUrl)
  const arrayBuffer = await response.arrayBuffer()
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer)

  return new Promise((resolve) => {
    // 停掉上一个
    if (_currentSource) {
      try { _currentSource.stop() } catch (_) {}
      _currentSource = null
    }

    const source = ctx.createBufferSource()
    source.buffer = audioBuffer
    source.playbackRate.value = Math.max(0.5, Math.min(2, rate))
    source.connect(ctx.destination)
    source.onended = () => {
      _currentSource = null
      resolve()
    }
    source.start(0)
    _currentSource = source
  })
}

// ─── Edge TTS（通过 Vercel Serverless 代理） ───────────────────
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

  // 优先用 Web Audio API（移动端友好）
  if (window.AudioContext || window.webkitAudioContext) {
    return playWithWebAudio(url, rate)
  }

  // 降级：HTMLAudioElement（桌面浏览器兜底）
  return new Promise((resolve, reject) => {
    const audio = new Audio(url)
    audio.playbackRate = Math.max(0.5, Math.min(2, rate))
    audio.onended = resolve
    audio.onerror = () => reject(new Error('Audio play error'))
    audio.play().catch(reject)
  })
}

// ─── Web Speech API（离线 / Edge TTS 失败时降级） ─────────────────

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
 * 通用朗读（优先 Edge TTS + Web Audio → 降级 Web Speech）
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
  // 停止 Web Audio
  if (_currentSource) {
    try { _currentSource.stop() } catch (_) {}
    _currentSource = null
  }
  // 停止 Web Speech
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
