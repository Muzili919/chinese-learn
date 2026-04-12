// ═══════════════════════════════════════════════════════════════
// TTS 引擎 — Web Speech API（优化版）
// 解决手机浏览器 voices 加载慢的问题
// ═══════════════════════════════════════════════════════════════

let _voices = []
let _voicesPromise = null

function ensureVoices() {
  if (_voicesPromise) return _voicesPromise

  _voicesPromise = new Promise((resolve) => {
    const synth = window.speechSynthesis
    if (!synth) {
      _voices = []
      resolve([])
      return
    }

    // 立即尝试获取
    _voices = synth.getVoices()
    if (_voices.length > 0) {
      resolve(_voices)
      return
    }

    // 监听 voiceschanged 事件
    const handler = () => {
      _voices = synth.getVoices()
      if (_voices.length > 0) {
        synth.removeEventListener('voiceschanged', handler)
        resolve(_voices)
      }
    }
    synth.addEventListener('voiceschanged', handler)

    // 超时兜底
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
    const preferred = [
      'Samantha', 'Karen', 'Moira', 'Tessa', 'Fiona',
      'Microsoft Zira', 'Microsoft Hazel', 'Microsoft Susan',
      'Google US English', 'Google UK English Female',
    ]
    for (const hint of preferred) {
      const v = all.find(v => v.name.includes(hint) && v.lang.startsWith('en'))
      if (v) return v
    }
    return all.find(v => v.lang.startsWith('en')) || null
  }

  if (lang.startsWith('zh')) {
    const preferred = [
      'Google 普通话', 'Google 粤語',
      'Microsoft Kangkang', 'Microsoft Yaoyao', 'Microsoft Huihui',
      'Ting-Ting', 'Mei-Jia',
    ]
    for (const hint of preferred) {
      const v = all.find(v => v.name.includes(hint) && v.lang.startsWith('zh'))
      if (v) return v
    }
    return all.find(v => v.lang.startsWith('zh')) || null
  }

  return all.find(v => v.lang.startsWith(lang)) || null
}

/**
 * 使用 Web Speech API 播放
 */
function webSpeechTTS(text, lang, rate) {
  return new Promise((resolve, reject) => {
    const synth = window.speechSynthesis
    if (!synth) {
      reject(new Error('speechSynthesis not available'))
      return
    }

    // Chrome bug: 长时间不使用后 speechSynthesis 会暂停
    // 需要先 cancel 再 speak
    synth.cancel()

    const utter = new SpeechSynthesisUtterance(text)
    utter.lang = lang
    utter.rate = rate
    utter.pitch = 1
    utter.volume = 1

    const voice = pickVoice(lang)
    if (voice) utter.voice = voice

    // Chrome bug workaround: resume if paused
    if (synth.paused) {
      synth.resume()
    }

    utter.onend = () => resolve()
    utter.onerror = (e) => {
      if (e.error === 'interrupted' || e.error === 'canceled') {
        resolve()
      } else {
        console.error('TTS error:', e.error)
        reject(new Error(`Speech error: ${e.error}`))
      }
    }

    synth.speak(utter)
  })
}

// ─── 统一接口 ─────────────────────────────────────────────

/**
 * 通用朗读
 * @param {string} text - 要朗读的文本
 * @param {object} opts - 配置项
 * @param {string} opts.lang - 语言代码，默认 'en-US'
 * @param {number} opts.rate - 语速 0.1-2，默认 0.85
 * @param {number} opts.pitch - 音调 0-2，默认 1
 * @param {Function} opts.onEnd - 播放结束回调
 * @param {Function} opts.onStart - 开始播放回调
 */
export function speak(text, opts = {}) {
  if (!text) return

  const lang = opts.lang || 'en-US'
  const rate = opts.rate ?? 0.85

  if (opts.onStart) opts.onStart()

  // 确保 voices 已加载
  ensureVoices().then(() => {
    return webSpeechTTS(text, lang, rate)
  }).then(() => {
    if (opts.onEnd) opts.onEnd()
  }).catch((err) => {
    console.warn('TTS failed:', err)
    if (opts.onEnd) opts.onEnd()
  })
}

/** 英语朗读（默认美式，语速0.85） */
export function speakEnglish(text, opts = {}) {
  return speak(text, { lang: 'en-US', rate: 0.85, ...opts })
}

/** 中文朗读（默认普通话，语速0.75） */
export function speakChinese(text, opts = {}) {
  return speak(text, { lang: 'zh-CN', rate: 0.75, ...opts })
}

/** 停止播放 */
export function stop() {
  const synth = window.speechSynthesis
  if (synth) {
    synth.cancel()
    if (synth.paused) synth.resume()
  }
}

/** 初始化 TTS（预加载 voices） */
export async function initTTS() {
  await ensureVoices()
}

/** 获取已加载的 voices */
export function getVoices() {
  return _voices
}
