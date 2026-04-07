import { useState, useEffect, useRef, useMemo } from 'react'
import { storage, updateStreak } from '../utils/storage'
import { updateSRS, toQuality } from '../utils/srs'
import { scheduleSession } from '../utils/scheduler'
import { syncAfterSession } from '../utils/sync'
import vocabQ from '../data/questions_vocab.json'
import poetryQ from '../data/questions_poetry.json'
import idiomQ from '../data/questions_idiom.json'
import sentenceQ from '../data/questions_sentence.json'
import litQ from '../data/questions_literature.json'

const ALL_QUESTIONS = [...vocabQ, ...poetryQ, ...idiomQ, ...sentenceQ, ...litQ]
const SESSION_SIZE = 20

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function shuffleOptions(question) {
  if (question.type === 'fill_blank') return question
  const opts = [...question.options]
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]]
  }
  return { ...question, options: opts }
}

// 去掉首尾空格和标点，用于填空题比对
function normalize(s) {
  return (s || '').trim().replace(/[，。！？、；：""''《》（）\s]/g, '')
}

export default function QuizPage({ user, options = {}, onFinish, onBack }) {
  const { focusTag = null, knowledgeTag = null, wrongCardIds = null } = options

  const srsStates = useRef(storage.getSrsState(user.id))
  const startTime = useRef(Date.now())
  const questionStartTime = useRef(Date.now())

  const questions = useMemo(() => {
    // 错题专练模式：只出指定 id 的题
    if (wrongCardIds?.length) {
      const idSet = new Set(wrongCardIds)
      const pool = ALL_QUESTIONS.filter(q => idSet.has(q.id))
      return shuffle(pool).slice(0, SESSION_SIZE).map(shuffleOptions)
    }
    let pool = ALL_QUESTIONS
    if (knowledgeTag) pool = pool.filter((q) => q.knowledge_tag === knowledgeTag)
    return scheduleSession(pool, srsStates.current, SESSION_SIZE, focusTag).map(shuffleOptions)
  }, [focusTag, knowledgeTag, wrongCardIds])

  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [fillInput, setFillInput] = useState('')
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [sessionRecords, setSessionRecords] = useState([])
  const [xpGained, setXpGained] = useState(0)

  const current = questions[index]

  useEffect(() => {
    questionStartTime.current = Date.now()
  }, [index])

  function recordAnswer(chosenAnswer, correct) {
    if (selected !== null) return
    setSelected(chosenAnswer)

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
      timestamp: new Date().toISOString(),
    }
    storage.addRecord(user.id, record)
    setSessionRecords((prev) => [...prev, record])

    if (correct) {
      setTimeout(() => advance(record), 900)
    } else {
      setShowAnalysis(true)
    }
  }

  // 选择题点击
  function handleSelect(option) {
    recordAnswer(option, option === current.answer)
  }

  // 填空题提交
  function handleFillSubmit() {
    if (!fillInput.trim() || selected !== null) return
    const correct = normalize(fillInput) === normalize(current.answer)
    recordAnswer(fillInput, correct)
  }

  function advance(lastRecord) {
    setShowAnalysis(false)
    setSelected(null)
    setFillInput('')

    if (index + 1 >= questions.length) {
      const totalSec = Math.round((Date.now() - startTime.current) / 1000)
      const allRecords = [...sessionRecords, lastRecord].filter(Boolean)
      const correctCount = allRecords.filter((r) => r.correct).length

      const session = {
        date: new Date().toISOString(),
        total: allRecords.length,
        correct: correctCount,
        xpEarned: xpGained + (lastRecord?.correct ? 5 : 1),
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

  const isFillBlank = current.type === 'fill_blank'
  const progress = (index / questions.length) * 100

  // 填空题答对时，高亮显示正确答案
  const fillCorrect = selected !== null && normalize(selected) === normalize(current.answer)

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top bar */}
      <div className="bg-white px-4 pt-8 pb-4 flex items-center gap-3">
        <button onClick={onBack} className="text-gray-400 p-1 text-xl">✕</button>
        <div className="flex-1 bg-gray-100 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-indigo-400 to-purple-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm text-gray-400 font-medium min-w-[40px] text-right">
          {index + 1}/{questions.length}
        </span>
      </div>

      {/* Question card */}
      <div className="flex-1 flex flex-col px-4 py-4">
        {/* Tags */}
        <div className="flex gap-2 mb-4">
          <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full font-medium">
            {current.knowledge_tag}
          </span>
          <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full">
            {current.ability_tag}
          </span>
          <span className="bg-gray-100 text-gray-400 text-xs px-2 py-1 rounded-full">
            {'⭐'.repeat(current.difficulty)}
          </span>
        </div>

        {/* Question */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <p className="text-lg text-gray-800 leading-relaxed font-medium">{current.question}</p>
        </div>

        {/* 填空题 */}
        {isFillBlank ? (
          <div className="flex flex-col gap-3">
            <input
              type="text"
              value={fillInput}
              onChange={(e) => setFillInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFillSubmit()}
              disabled={selected !== null}
              placeholder="在这里输入答案…"
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-4 text-base text-gray-800 focus:outline-none focus:border-indigo-400 disabled:bg-gray-50"
            />
            {selected === null && (
              <button
                onClick={handleFillSubmit}
                disabled={!fillInput.trim()}
                className="w-full bg-indigo-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                提交答案
              </button>
            )}
            {/* 填空反馈 */}
            {selected !== null && (
              <div className={`rounded-2xl p-4 border-2 ${fillCorrect ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                <p className={`text-sm font-semibold mb-1 ${fillCorrect ? 'text-green-700' : 'text-red-700'}`}>
                  {fillCorrect ? '✓ 正确！' : '✗ 答错了'}
                </p>
                {!fillCorrect && (
                  <p className="text-sm text-gray-700 mb-1">
                    正确答案：<span className="font-bold text-green-700">{current.answer}</span>
                  </p>
                )}
                <p className="text-sm text-gray-600">{current.analysis}</p>
              </div>
            )}
            {selected !== null && !fillCorrect && (
              <button
                onClick={() => advance(null)}
                className="w-full bg-amber-500 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                继续 →
              </button>
            )}
          </div>
        ) : (
          /* 选择题 */
          <div className="flex flex-col gap-3">
            {current.options.map((option) => {
              let style = 'bg-white border-2 border-gray-200 text-gray-700'
              if (selected !== null) {
                if (option === current.answer) {
                  style = 'bg-green-50 border-2 border-green-400 text-green-700'
                } else if (option === selected) {
                  style = 'bg-red-50 border-2 border-red-400 text-red-700'
                } else {
                  style = 'bg-white border-2 border-gray-100 text-gray-400'
                }
              }
              return (
                <button
                  key={option}
                  onClick={() => handleSelect(option)}
                  disabled={selected !== null}
                  className={`${style} rounded-2xl px-4 py-4 text-left text-base leading-snug transition-all active:scale-95 shadow-sm`}
                >
                  {option}
                </button>
              )
            })}
          </div>
        )}

        {/* 选择题解析面板 */}
        {!isFillBlank && showAnalysis && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-sm font-semibold text-amber-700 mb-1">💡 解析</p>
            <p className="text-sm text-amber-900 leading-relaxed">{current.analysis}</p>
            <button
              onClick={() => advance(null)}
              className="mt-3 w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              继续 →
            </button>
          </div>
        )}

        {/* 选择题正确反馈 */}
        {!isFillBlank && selected !== null && selected === current.answer && !showAnalysis && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-2xl p-3 text-center animate-pulse">
            <span className="text-green-600 font-semibold">✓ 正确！+5 XP</span>
          </div>
        )}
      </div>
    </div>
  )
}
