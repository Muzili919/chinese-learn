import { useState, useEffect, useRef, useMemo } from 'react'
import { storage, updateStreak } from '../utils/storage'
import { updateSRS, toQuality } from '../utils/srs'
import { syncAfterSession } from '../utils/sync'
import DuolingoStyleQuiz from '../components/DuolingoStyleQuiz'
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

function shuffleOptions(question) {
  if (question.type === 'fill_blank' || question.type === 'open_ended') return question
  const opts = [...(question.options || [])]
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]]
  }
  return { ...question, options: opts }
}

// TTS 朗读英文
function speakEnglish(text) {
  if (!text || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = 'en-US'
  utter.rate = 0.85
  window.speechSynthesis.speak(utter)
}

// 写作题组件（open_ended）
function WritingQuestion({ question, onSubmit }) {
  const [input, setInput] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit() {
    if (!input.trim()) return
    setSubmitted(true)
  }

  function handleContinue() {
    // 写作题始终算正确（只要有输入）
    onSubmit(input.trim(), true)
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 题目 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-start gap-2 mb-2">
          <span className="text-xs font-semibold text-pink-500 bg-pink-50 px-2 py-0.5 rounded-full">写作题</span>
          <button
            onClick={() => speakEnglish(question.question)}
            className="inline-flex items-center justify-center w-7 h-7 bg-sky-100 text-sky-500 rounded-full text-sm ml-auto"
            title="朗读题目"
          >🔊</button>
        </div>
        <p className="text-gray-800 text-base leading-relaxed whitespace-pre-wrap">{question.question}</p>
      </div>

      {/* 输入区 */}
      {!submitted ? (
        <div className="flex flex-col gap-3">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="请在这里写下你的答案..."
            className="w-full h-32 rounded-2xl border border-gray-200 p-4 text-gray-800 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white"
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className={`w-full py-3 rounded-2xl font-bold text-white transition-all ${
              input.trim()
                ? 'bg-gradient-to-r from-pink-400 to-rose-500 active:scale-95'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            提交答案
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {/* 参考答案 */}
          <div className="bg-green-50 border border-green-200 rounded-2xl p-4">
            <p className="text-xs font-semibold text-green-600 mb-2">参考答案</p>
            <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{question.answer}</p>
            {question.analysis && (
              <div className="mt-3 pt-3 border-t border-green-200">
                <p className="text-xs text-green-500 whitespace-pre-wrap">{question.analysis}</p>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 text-center">对比参考答案，评估自己的表达是否正确</p>
          <button
            onClick={handleContinue}
            className="w-full py-3 bg-gradient-to-r from-green-400 to-teal-500 text-white font-bold rounded-2xl active:scale-95 transition-all"
          >
            继续下一题 →
          </button>
        </div>
      )}
    </div>
  )
}

export default function EnglishQuizPage({ user, options = {}, onFinish, onBack }) {
  const { englishTag = 'en_vocab' } = options

  const srsStates = useRef(storage.getSrsState(user.id))
  const startTime = useRef(Date.now())
  const questionStartTime = useRef(Date.now())

  const questions = useMemo(() => {
    const pool = EN_QUESTION_MAP[englishTag] || enVocabQ
    return shuffle(pool).slice(0, SESSION_SIZE).map(shuffleOptions)
  }, [englishTag])

  const [index, setIndex] = useState(0)
  const [sessionRecords, setSessionRecords] = useState([])
  const [xpGained, setXpGained] = useState(0)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)

  const current = questions[index]

  // 题目切换时重置计时器
  useEffect(() => {
    questionStartTime.current = Date.now()
  }, [index])

  // 听力题：题目加载时自动播放
  useEffect(() => {
    if (current?.listening_text) {
      setIsPlayingAudio(true)
      speakEnglish(current.listening_text)
      // 估算播放时长（约 100ms/字 + 1秒缓冲）
      const duration = current.listening_text.split(' ').length * 400 + 1000
      const timer = setTimeout(() => setIsPlayingAudio(false), duration)
      return () => clearTimeout(timer)
    } else {
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

  // 获取星球标签显示
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
        <div className="mx-4 mt-2 bg-violet-50 border border-violet-200 rounded-xl px-4 py-2 flex items-center gap-3">
          <span className="text-lg">{isPlayingAudio ? '🔊' : '🎧'}</span>
          <span className="text-sm text-violet-600 font-medium flex-1">
            {isPlayingAudio ? '正在播放听力...' : '听力已播放完毕'}
          </span>
          <button
            onClick={() => {
              setIsPlayingAudio(true)
              speakEnglish(current.listening_text)
              const duration = current.listening_text.split(' ').length * 400 + 1000
              setTimeout(() => setIsPlayingAudio(false), duration)
            }}
            className="text-xs text-violet-500 bg-violet-100 px-3 py-1 rounded-full font-medium active:bg-violet-200 transition-colors"
          >
            重播 🔊
          </button>
        </div>
      )}

      {/* 答题区 */}
      <div className="flex-1 flex flex-col px-4 py-4">
        {current.type === 'open_ended' ? (
          <WritingQuestion
            key={current.id}
            question={current}
            onSubmit={handleAnswerSubmit}
          />
        ) : (
          <DuolingoStyleQuiz
            key={current.id}
            question={current}
            onAnswerSubmit={handleAnswerSubmit}
            showVariantButton={false}
            onSpeak={speakEnglish}
          />
        )}
      </div>
    </div>
  )
}
