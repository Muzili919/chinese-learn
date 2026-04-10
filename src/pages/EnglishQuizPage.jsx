import { useState, useEffect, useRef, useMemo } from 'react'
import { storage, updateStreak } from '../utils/storage'
import { updateSRS, toQuality } from '../utils/srs'
import { syncAfterSession } from '../utils/sync'
import enVocabQ from '../data/questions_en_vocab.json'
import enListenQ from '../data/questions_en_listen.json'
import enGrammarQ from '../data/questions_en_grammar.json'
import enReadingQ from '../data/questions_en_reading.json'
import enWritingQ from '../data/questions_en_writing.json'

const SESSION_SIZE = 15

// 题库映射
const EN_QUESTION_MAP = {
  en_vocab:   enVocabQ,
  en_listen:  enListenQ,
  en_grammar: enGrammarQ,
  en_reading: enReadingQ,
  en_writing: enWritingQ,
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// TTS 朗读英文
function speakEnglish(text, onEnd) {
  if (!text || !window.speechSynthesis) return null
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = 'en-US'
  utter.rate = 0.85
  if (onEnd) {
    utter.onend = () => onEnd()
    utter.onerror = () => onEnd()
  }
  window.speechSynthesis.speak(utter)
  return utter
}

// ─── 题目模式检测 ──────────────────────────────────────────────────────────

function isMultiPartAnswer(q) {
  // 答案包含 (1) 或 （1） 格式的多子题
  return /\(1\)|\（1\）/.test(q.answer || '')
}

function detectMode(q) {
  if (q.type === 'open_ended') return 'open_ended'
  if (isMultiPartAnswer(q)) return 'open_ended'
  // 有 options 且数量 >= 2 → 选择题
  if (Array.isArray(q.options) && q.options.length >= 2) return 'choice'
  // fill_blank 且答案简短（< 40字）→ 文字填空
  if (q.type === 'fill_blank' && (q.answer || '').length < 40) return 'text_fill'
  // 其余（multiple_choice 但没有 options、复杂答案）→ 展示参考答案
  return 'open_ended'
}

// ─── 选择题正确答案检测 ─────────────────────────────────────────────────────
function isChoiceCorrect(selected, q) {
  const ans = (q.answer || '').trim()
  // answer 是字母 A/B/C/D → 取对应 option
  if (/^[A-D]$/i.test(ans)) {
    const idx = ans.toUpperCase().charCodeAt(0) - 65
    return selected === q.options[idx]
  }
  // answer 是选项全文 或带前缀 "A. xxx"
  const strip = (s) => String(s || '').trim().toLowerCase().replace(/^[a-d]\.\s*/i, '')
  return strip(selected) === strip(ans)
}

// ─── 英语题目通用组件 ─────────────────────────────────────────────────────

const TYPE_LABEL = {
  multiple_choice: '选择题',
  fill_blank: '填空题',
  open_ended: '写作题',
}
const TYPE_COLOR = {
  multiple_choice: { bg: '#e0f2fe', text: '#0369a1' },
  fill_blank:      { bg: '#f0fdf4', text: '#15803d' },
  open_ended:      { bg: '#fdf4ff', text: '#7e22ce' },
}

function EnglishQuestion({ question: q, onSubmit }) {
  const mode = detectMode(q)
  const [selected, setSelected] = useState(null)      // choice 模式
  const [textInput, setTextInput] = useState('')       // text_fill 模式
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  const labelColor = TYPE_COLOR[q.type] || TYPE_COLOR.multiple_choice

  // ── 选择题 ──
  function handleSelect(opt) {
    if (submitted) return
    const correct = isChoiceCorrect(opt, q)
    setSelected(opt)
    setIsCorrect(correct)
    setSubmitted(true)
  }

  // ── 填空题 ──
  function handleTextSubmit() {
    if (!textInput.trim()) return
    const correct = textInput.trim().toLowerCase() === (q.answer || '').trim().toLowerCase()
    setIsCorrect(correct)
    setSubmitted(true)
  }

  // ── 开放题 ──
  function handleOpenSubmit() {
    setIsCorrect(true) // 开放题只要有输入就算参与
    setSubmitted(true)
  }

  function handleContinue() {
    // open_ended 始终视为 correct（计 XP），让学生自行对照
    onSubmit(selected || textInput || '', mode === 'open_ended' ? true : isCorrect)
  }

  // ── 反馈面板 ──
  const feedbackBg = mode === 'open_ended'
    ? 'bg-sky-50 border-sky-200'
    : isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'

  const feedbackPanel = submitted && (
    <div className={`rounded-2xl p-4 border ${feedbackBg}`}>
      {mode !== 'open_ended' && (
        <div className={`font-bold text-base mb-2 ${isCorrect ? 'text-green-700' : 'text-red-600'}`}>
          {isCorrect ? '✅ 回答正确！' : `❌ 正确答案：${q.answer}`}
        </div>
      )}
      {mode === 'open_ended' && (
        <>
          <div className="font-semibold text-sky-700 text-sm mb-1">📖 参考答案</div>
          <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap mb-2">{q.answer}</div>
        </>
      )}
      {/* 解析 / 句子翻译 */}
      {q.analysis && (
        <div className={`mt-2 pt-2 ${mode === 'open_ended' ? 'border-t border-sky-200' : isCorrect ? 'border-t border-green-200' : 'border-t border-red-200'}`}>
          <div className="text-xs font-semibold text-gray-500 mb-1">💡 解析 &amp; 翻译</div>
          <div className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{q.analysis}</div>
        </div>
      )}
    </div>
  )

  return (
    <div className="flex flex-col gap-4">
      {/* 题目卡片 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: labelColor.bg, color: labelColor.text }}
          >
            {TYPE_LABEL[q.type] || '题目'}
          </span>
          <button
            onClick={() => speakEnglish(q.question)}
            className="ml-auto w-7 h-7 flex items-center justify-center bg-sky-100 text-sky-500 rounded-full text-sm"
            title="朗读题目"
          >🔊</button>
        </div>
        <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{q.question}</p>
      </div>

      {/* ── 选择题选项 ── */}
      {mode === 'choice' && (
        <div className="flex flex-col gap-2">
          {q.options.map((opt, i) => {
            const correctIdx = /^[A-D]$/i.test((q.answer || '').trim())
              ? q.answer.toUpperCase().charCodeAt(0) - 65 : -1
            const isThisCorrect = correctIdx >= 0 ? i === correctIdx : isChoiceCorrect(opt, q)
            let cls = 'bg-white border-gray-200 text-gray-700'
            if (submitted) {
              if (isThisCorrect) cls = 'bg-green-50 border-green-400 text-green-700'
              else if (opt === selected && !isThisCorrect) cls = 'bg-red-50 border-red-400 text-red-600'
              else cls = 'bg-white border-gray-200 text-gray-400'
            }
            return (
              <button
                key={i}
                onClick={() => handleSelect(opt)}
                disabled={submitted}
                className={`rounded-2xl border-2 px-4 py-3 text-sm font-medium text-left transition-all active:scale-95 ${cls}`}
              >
                <span className="mr-2 text-xs font-bold opacity-50">{['A','B','C','D'][i]}.</span>
                {opt.replace(/^[A-D]\.\s*/i, '')}
              </button>
            )
          })}
        </div>
      )}

      {/* ── 填空题输入 ── */}
      {mode === 'text_fill' && !submitted && (
        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && textInput.trim() && handleTextSubmit()}
            placeholder="在此输入答案..."
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-base font-mono focus:border-sky-400 outline-none"
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            spellCheck="false"
          />
          <button
            onClick={handleTextSubmit}
            disabled={!textInput.trim()}
            className="w-full bg-sky-500 disabled:bg-gray-200 text-white font-bold py-3 rounded-xl active:scale-95 transition-all"
          >
            确认答案
          </button>
        </div>
      )}

      {/* ── 开放/写作题输入 ── */}
      {mode === 'open_ended' && !submitted && (
        <OpenEndedInput q={q} onSubmit={handleOpenSubmit} />
      )}

      {/* ── 反馈 ── */}
      {feedbackPanel}

      {/* ── 继续按钮 ── */}
      {submitted && (
        <button
          onClick={handleContinue}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 text-white font-bold text-base active:scale-95 transition-transform shadow-md"
        >
          继续下一题 →
        </button>
      )}
    </div>
  )
}

// 开放/写作题输入子组件
function OpenEndedInput({ q, onSubmit }) {
  const [input, setInput] = useState('')
  const isWriting = q.type === 'open_ended'
  return (
    <div className="flex flex-col gap-3">
      <textarea
        value={input}
        onChange={e => setInput(e.target.value)}
        placeholder={isWriting ? '请在这里写下你的答案...' : '写出你的答案（多个答案用换行分隔）...'}
        className="w-full h-28 rounded-2xl border border-gray-200 p-4 text-gray-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white"
      />
      <button
        onClick={onSubmit}
        disabled={!input.trim()}
        className={`w-full py-3 rounded-2xl font-bold text-white transition-all ${
          input.trim() ? 'bg-gradient-to-r from-sky-400 to-blue-500 active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        提交并查看答案
      </button>
    </div>
  )
}

// ─── 主页面 ──────────────────────────────────────────────────────────────────

export default function EnglishQuizPage({ user, options = {}, onFinish, onBack }) {
  const { englishTag = 'en_vocab' } = options

  const srsStates = useRef(storage.getSrsState(user.id))
  const startTime = useRef(Date.now())
  const questionStartTime = useRef(Date.now())

  const questions = useMemo(() => {
    const pool = EN_QUESTION_MAP[englishTag] || enVocabQ
    return shuffle(pool).slice(0, SESSION_SIZE)
  }, [englishTag])

  const [index, setIndex] = useState(0)
  const [sessionRecords, setSessionRecords] = useState([])
  const [xpGained, setXpGained] = useState(0)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)

  const current = questions[index]

  useEffect(() => {
    questionStartTime.current = Date.now()
  }, [index])

  // 听力题：自动播放
  useEffect(() => {
    if (current?.listening_text) {
      setIsPlayingAudio(true)
      speakEnglish(current.listening_text, () => setIsPlayingAudio(false))
    } else {
      setIsPlayingAudio(false)
    }
    return () => {
      window.speechSynthesis?.cancel()
      setIsPlayingAudio(false)
    }
  }, [index, current?.id])

  function handleAnswerSubmit(chosenAnswer, correct) {
    const timeSec = (Date.now() - questionStartTime.current) / 1000
    const quality = toQuality(correct, timeSec)

    const newCardState = updateSRS(srsStates.current[current.id], quality)
    storage.updateCardSrs(user.id, current.id, newCardState)
    srsStates.current[current.id] = newCardState

    const xp = correct ? 5 : 1
    setXpGained((prev) => prev + xp)
    storage.addXP(user.id, xp)

    const record = {
      card_id: current.id,
      correct,
      time_spent: Math.round(timeSec * 10) / 10,
      selected_answer: chosenAnswer,
      ability_tag: current.ability_tag,
      knowledge_tag: current.knowledge_tag,
      subject: 'english',
      timestamp: new Date().toISOString(),
    }
    storage.addRecord(user.id, record)
    setSessionRecords((prev) => [...prev, record])

    if (index + 1 >= questions.length) {
      const totalSec = Math.round((Date.now() - startTime.current) / 1000)
      const allRecords = [...sessionRecords, record].filter(Boolean)
      const correctCount = allRecords.filter((r) => r.correct).length

      const session = {
        date: new Date().toISOString(),
        total: allRecords.length,
        correct: correctCount,
        xpEarned: xpGained + (correct ? 5 : 1),
        durationSec: totalSec,
      }
      storage.addSession(user.id, session)
      updateStreak(user.id)
      syncAfterSession(user.id)

      onFinish({ session, records: allRecords })
    } else {
      setIndex((i) => i + 1)
    }
  }

  if (!current) return null

  const progress = (index / questions.length) * 100

  const PLANET_LABELS = {
    en_vocab:   '词汇星球 🔤',
    en_listen:  '听力星球 🎧',
    en_grammar: '语法星球 📐',
    en_reading: '阅读星球 📚',
    en_writing: '写作星球 ✏️',
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-sky-50 to-blue-50">
      {/* 顶部进度栏 */}
      <div className="bg-white px-4 pt-8 pb-4 flex items-center gap-3 shadow-sm">
        <button onClick={onBack} className="text-gray-400 p-1 text-xl">✕</button>
        <div className="flex-1 bg-gray-100 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-sky-400 to-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm text-gray-500 font-medium min-w-[40px] text-right">
          {index + 1}/{questions.length}
        </span>
      </div>

      {/* 星球标签 */}
      <div className="px-4 pt-2 pb-1">
        <span className="text-xs text-sky-500 font-medium bg-sky-50 px-3 py-1 rounded-full">
          {PLANET_LABELS[englishTag] || '英语练习'}
        </span>
      </div>

      {/* 听力题提示区 */}
      {current.listening_text && (
        <div className="mx-4 mt-2 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">{isPlayingAudio ? '🔊' : '🎧'}</span>
          <span className="text-sm text-violet-600 font-medium flex-1">
            {isPlayingAudio ? '正在播放听力...' : '听力已播放完毕'}
          </span>
          <button
            onClick={() => {
              if (isPlayingAudio) return
              setIsPlayingAudio(true)
              speakEnglish(current.listening_text, () => setIsPlayingAudio(false))
            }}
            disabled={isPlayingAudio}
            className={`text-sm px-4 py-2 rounded-full font-bold transition-colors ${
              isPlayingAudio
                ? 'bg-violet-200 text-violet-400 cursor-not-allowed'
                : 'bg-violet-500 text-white active:bg-violet-600'
            }`}
          >
            {isPlayingAudio ? '播放中...' : '重新播放'}
          </button>
        </div>
      )}

      {/* 答题区 */}
      <div className="flex-1 flex flex-col px-4 py-4">
        <EnglishQuestion
          key={current.id}
          question={current}
          onSubmit={handleAnswerSubmit}
        />
      </div>
    </div>
  )
}
