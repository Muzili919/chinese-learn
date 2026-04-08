import { useState, useRef, useEffect, useMemo } from 'react'
import { storage, updateStreak } from '../utils/storage'
import { updateSRS, toQuality } from '../utils/srs'
import { syncAfterSession } from '../utils/sync'
import tips from '../data/reading_tips.json'
import readingQ from '../data/questions_reading.json'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function shuffleOptions(q) {
  if (!q.options?.length) return q
  const opts = shuffle(q.options)
  return { ...q, options: opts }
}

// 关键词匹配评分
function smartGrade(userAnswer, correctAnswer) {
  if (!userAnswer?.trim()) return { correct: false, score: 0 }
  const ua = userAnswer.trim()
  const ca = correctAnswer.trim()
  if (ua === ca) return { correct: true, score: 100 }

  const keywords = ca.split(/[，。、；：\s]+/).filter(w => w.length > 1)
  if (keywords.length === 0) return { correct: ua.length > 0, score: 60 }

  const matched = keywords.filter(kw => ua.includes(kw)).length
  const rate = matched / keywords.length
  return { correct: rate >= 0.6, score: Math.round(rate * 100) }
}

export default function ReadingPage({ user, onFinish, onBack }) {
  const questions = useMemo(() => shuffle(readingQ).slice(0, 5).map(shuffleOptions), [])

  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState('answering') // 'answering' | 'result'
  const [userAnswer, setUserAnswer] = useState('')
  const [gradeResult, setGradeResult] = useState(null)
  const [selected, setSelected] = useState(null) // 选择题用
  const [sessionRecords, setSessionRecords] = useState([])
  const startTime = useRef(Date.now())
  const xpRef = useRef(0)

  const current = questions[index]
  const isChoice = current?.options?.length > 0 && current?.type !== 'open_ended'
  const randomTip = useMemo(() => tips[Math.floor(Math.random() * tips.length)], [index])

  function recordAndAdvance(correct, answer) {
    const xp = correct ? 5 : 1
    xpRef.current += xp
    storage.addXP(user.id, xp)

    const srsState = storage.getSrsState(user.id)
    const quality = toQuality(correct, 10)
    const newCardState = updateSRS(srsState[current.id], quality)
    storage.updateCardSrs(user.id, current.id, newCardState)

    const record = {
      card_id: current.id,
      correct,
      time_spent: 0,
      selected_answer: answer,
      ability_tag: current.ability_tag,
      knowledge_tag: current.knowledge_tag,
      timestamp: new Date().toISOString(),
    }
    storage.addRecord(user.id, record)
    setSessionRecords(prev => [...prev, record])
  }

  function handleChoiceSelect(option) {
    if (selected !== null) return
    const correct = option === current.answer
    setSelected(option)
    recordAndAdvance(correct, option)
    setPhase('result')
    setGradeResult({ correct, score: correct ? 100 : 0 })
  }

  function handleOpenSubmit() {
    if (!userAnswer.trim()) return
    const result = smartGrade(userAnswer, current.answer)
    recordAndAdvance(result.correct, userAnswer)
    setGradeResult(result)
    setPhase('result')
  }

  function handleContinue() {
    if (index + 1 >= questions.length) {
      const totalSec = Math.round((Date.now() - startTime.current) / 1000)
      const allRecords = [...sessionRecords]
      const session = {
        date: new Date().toISOString(),
        total: allRecords.length,
        correct: allRecords.filter(r => r.correct).length,
        xpEarned: xpRef.current,
        durationSec: totalSec,
      }
      storage.addSession(user.id, session)
      updateStreak(user.id)
      syncAfterSession(user.id)
      onFinish({ session, records: allRecords })
    } else {
      setIndex(i => i + 1)
      setPhase('answering')
      setUserAnswer('')
      setSelected(null)
      setGradeResult(null)
    }
  }

  if (!current) return null

  const progress = (index / questions.length) * 100

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top bar */}
      <div className="bg-white px-4 pt-8 pb-4 flex items-center gap-3">
        <button onClick={onBack} className="text-gray-400 p-1 text-xl">✕</button>
        <div className="flex-1 bg-gray-100 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-emerald-400 to-teal-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm text-gray-400 font-medium min-w-[40px] text-right">
          {index + 1}/{questions.length}
        </span>
      </div>

      <div className="flex-1 flex flex-col px-4 py-4">
        {/* Tags */}
        <div className="flex gap-2 mb-4">
          <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-medium">
            {current.knowledge_tag || '阅读理解'}
          </span>
          {current.ability_tag && (
            <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full">
              {current.ability_tag}
            </span>
          )}
        </div>

        {/* 题目 */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
          <p className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap">{current.question}</p>
        </div>

        {/* ── 选择题 ── */}
        {isChoice && phase === 'answering' && (
          <div className="flex flex-col gap-3">
            {current.options.map(option => (
              <button
                key={option}
                onClick={() => handleChoiceSelect(option)}
                className="bg-white border-2 border-gray-200 text-gray-700 rounded-2xl px-4 py-4 text-left text-base leading-snug transition-all active:scale-95 shadow-sm"
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {/* ── 开放题答题区 ── */}
        {!isChoice && phase === 'answering' && (
          <div className="flex flex-col gap-3">
            <textarea
              value={userAnswer}
              onChange={e => setUserAnswer(e.target.value)}
              placeholder="请写下你的答案…"
              rows={4}
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-base text-gray-800 focus:outline-none focus:border-emerald-400 resize-none"
              style={{ fontSize: '16px' }}
            />
            <button
              onClick={handleOpenSubmit}
              disabled={!userAnswer.trim()}
              className="w-full bg-emerald-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              提交答案
            </button>
          </div>
        )}

        {/* ── 结果展示 ── */}
        {phase === 'result' && (
          <div className="flex flex-col gap-3">
            {/* 选择题结果 */}
            {isChoice && (
              <div className="flex flex-col gap-3">
                {current.options.map(option => {
                  let style = 'bg-white border-2 border-gray-100 text-gray-400'
                  if (option === current.answer) style = 'bg-green-50 border-2 border-green-400 text-green-700'
                  else if (option === selected) style = 'bg-red-50 border-2 border-red-400 text-red-700'
                  return (
                    <div key={option} className={`${style} rounded-2xl px-4 py-4 text-left text-base leading-snug`}>
                      {option}
                    </div>
                  )
                })}
              </div>
            )}

            {/* 开放题：你的答案 */}
            {!isChoice && (
              <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                <p className="text-xs text-gray-400 mb-1">你的答案</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{userAnswer}</p>
              </div>
            )}

            {/* 对错标识 */}
            <div className={`rounded-2xl p-3 text-center font-semibold ${gradeResult?.correct ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {gradeResult?.correct ? '✓ 回答正确！+5 XP' : '✗ 答错了，+1 XP'}
            </div>

            {/* 参考答案 */}
            {!gradeResult?.correct && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <p className="text-xs text-blue-500 font-semibold mb-1">参考答案</p>
                <p className="text-sm text-blue-800 whitespace-pre-wrap">{current.answer}</p>
              </div>
            )}

            {/* 解析 */}
            {current.analysis && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-xs text-amber-600 font-semibold mb-1">💡 解析</p>
                <p className="text-sm text-amber-900 leading-relaxed">{current.analysis}</p>
              </div>
            )}

            <button
              onClick={handleContinue}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {index + 1 >= questions.length ? '完成练习 🎉' : '继续 →'}
            </button>
          </div>
        )}

        {/* 随机小贴士 */}
        {phase === 'answering' && index % 3 === 0 && randomTip && (
          <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <p className="text-yellow-800 text-xs font-semibold mb-1">💡 {randomTip.title}</p>
            {randomTip.formula && <p className="text-yellow-700 text-xs">{randomTip.formula}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
