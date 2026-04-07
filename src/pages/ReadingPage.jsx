import { useState, useMemo, useRef, useEffect } from 'react'
import { storage, updateStreak } from '../utils/storage'
import { updateSRS, toQuality } from '../utils/srs'
import { syncAfterSession } from '../utils/sync'
import tips from '../data/reading_tips.json'
import passages from '../data/reading_passages.json'
import readingQuestions from '../data/questions_reading.json'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function shuffleOptions(q) {
  if (!q.options || q.options.length === 0) return q
  const opts = shuffle(q.options)
  return { ...q, options: opts }
}

// ── 开放性题目组件（阅读理解，自报对错）──────────────────────────
function OpenEndedCard({ question, onCorrect, onWrong }) {
  const [revealed, setRevealed] = useState(false)
  return (
    <div className="flex flex-col gap-3">
      <div className="bg-white rounded-2xl p-4 border border-gray-100">
        <div className="flex gap-2 mb-2">
          <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full">{question.ability_tag}</span>
        </div>
        <p className="text-base font-medium text-gray-800 leading-relaxed whitespace-pre-wrap">{question.question}</p>
      </div>

      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="w-full bg-emerald-500 text-white font-semibold py-4 rounded-2xl text-base"
        >
          查看参考答案
        </button>
      ) : (
        <>
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
            <p className="text-xs font-semibold text-emerald-700 mb-1">✓ 参考答案</p>
            <p className="text-sm text-emerald-900 leading-relaxed">{question.answer}</p>
          </div>
          {question.analysis && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-xs font-semibold text-amber-700 mb-1">💡 解题思路</p>
              <p className="text-sm text-amber-900 leading-relaxed">{question.analysis}</p>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={onWrong}
              className="flex-1 bg-red-50 border-2 border-red-300 text-red-600 font-semibold py-3 rounded-xl"
            >
              ✗ 答错了
            </button>
            <button
              onClick={onCorrect}
              className="flex-1 bg-green-500 text-white font-semibold py-3 rounded-xl"
            >
              ✓ 答对了
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ── 阅读答题模式（与其他星球一致）────────────────────────────────
function ReadingQuiz({ user, onFinish, onBack }) {
  // 从题库中随机选择15道题
  const questions = useMemo(() => {
    const shuffled = shuffle(readingQuestions)
    return shuffled.slice(0, 15).map(shuffleOptions)
  }, [])

  const [qIndex, setQIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [records, setRecords] = useState([])
  const startTime = useRef(Date.now())
  const qStartTime = useRef(Date.now())

  const current = questions[qIndex]

  function recordAnswer(correct, selectedAnswer) {
    const timeSec = (Date.now() - qStartTime.current) / 1000
    const quality = toQuality(correct, timeSec)
    const srsStates = storage.getSrsState(user.id)
    const newState = updateSRS(srsStates[current.id], quality)
    storage.updateCardSrs(user.id, current.id, newState)
    storage.addXP(user.id, correct ? 5 : 1)
    const record = {
      card_id: current.id,
      correct,
      time_spent: Math.round(timeSec * 10) / 10,
      selected_answer: selectedAnswer,
      ability_tag: current.ability_tag,
      knowledge_tag: '阅读理解',
      timestamp: new Date().toISOString(),
    }
    storage.addRecord(user.id, record)
    setRecords(prev => [...prev, record])
    return record
  }

  function handleSelect(option) {
    if (selected !== null) return
    setSelected(option)
    const correct = option === current.answer
    const record = recordAnswer(correct, option)
    if (correct) {
      setTimeout(() => advance(record), 900)
    } else {
      setShowAnalysis(true)
    }
  }

  function advance(lastRecord) {
    setShowAnalysis(false)
    setSelected(null)
    qStartTime.current = Date.now()

    if (qIndex + 1 >= questions.length) {
      const allRecords = [...records, lastRecord].filter(Boolean)
      const session = {
        date: new Date().toISOString(),
        total: allRecords.length,
        correct: allRecords.filter(r => r.correct).length,
        xpEarned: allRecords.reduce((s, r) => s + (r.correct ? 5 : 1), 0),
        durationSec: Math.round((Date.now() - startTime.current) / 1000),
      }
      storage.addSession(user.id, session)
      updateStreak(user.id)
      syncAfterSession(user.id)
      onFinish({ session, records: allRecords })
    } else {
      setQIndex(i => i + 1)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-emerald-50 to-teal-50">
      {/* Header */}
      <div className="bg-white px-4 pt-8 pb-3 flex items-center gap-3 shadow-sm">
        <button onClick={onBack} className="text-gray-400 text-xl">✕</button>
        <div className="flex-1 bg-gray-100 rounded-full h-2.5">
          <div
            className="bg-gradient-to-r from-emerald-400 to-teal-500 h-2.5 rounded-full transition-all"
            style={{ width: `${((qIndex + 1) / questions.length) * 100}%` }}
          />
        </div>
        <span className="text-sm text-gray-400">{qIndex + 1}/{questions.length}</span>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4 overflow-y-auto">
        {current.type === 'open_ended' ? (
          <OpenEndedCard
            key={current.id}
            question={current}
            onCorrect={() => advance(recordAnswer(true, '自评正确'))}
            onWrong={() => advance(recordAnswer(false, '自评错误'))}
          />
        ) : (
          <>
            {/* 题目 */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100 mb-3">
              <div className="flex gap-2 mb-2">
                <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full">{current.ability_tag}</span>
                <span className="bg-gray-100 text-gray-400 text-xs px-2 py-0.5 rounded-full">{'⭐'.repeat(current.difficulty || 2)}</span>
              </div>
              <p className="text-base font-medium text-gray-800 leading-relaxed">{current.question}</p>
            </div>

            {/* 选项 */}
            <div className="flex flex-col gap-2.5">
              {current.options.map(option => {
                let style = 'bg-white border-2 border-gray-200 text-gray-700'
                if (selected !== null) {
                  if (option === current.answer) style = 'bg-green-50 border-2 border-green-400 text-green-700'
                  else if (option === selected) style = 'bg-red-50 border-2 border-red-400 text-red-700'
                  else style = 'bg-white border-2 border-gray-100 text-gray-400'
                }
                return (
                  <button
                    key={option}
                    onClick={() => handleSelect(option)}
                    disabled={selected !== null}
                    className={`${style} rounded-2xl px-4 py-3.5 text-left text-sm leading-snug transition-all shadow-sm`}
                  >
                    {option}
                  </button>
                )
              })}
            </div>

            {/* 解析 */}
            {showAnalysis && (
              <div className="mt-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-sm font-semibold text-amber-700 mb-1">💡 答题思路</p>
                <p className="text-sm text-amber-900 leading-relaxed">{current.analysis}</p>
                <button onClick={() => advance(null)} className="mt-3 w-full bg-amber-500 text-white font-semibold py-3 rounded-xl">
                  继续 →
                </button>
              </div>
            )}

            {/* 正确提示 */}
            {selected !== null && selected === current.answer && !showAnalysis && (
              <div className="mt-3 bg-green-50 border border-green-200 rounded-2xl p-3 text-center">
                <span className="text-green-600 font-semibold text-sm">✓ 正确！+5 XP</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── 口诀学习卡片 ──────────────────────────────────────────────
function TipCard({ tip, onNext, onBack }) {
  const [step, setStep] = useState(0)

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-emerald-50 to-teal-50">
      <div className="bg-white px-5 pt-10 pb-4 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <button onClick={onBack} className="text-gray-400 text-xl mr-2">←</button>
          <span className="text-2xl">{tip.emoji}</span>
          <h1 className="text-lg font-bold text-gray-800">{tip.title}</h1>
        </div>
        <div className="flex gap-1 mt-3">
          {['口诀', '步骤', '示例'].map((label, i) => (
            <button
              key={label}
              onClick={() => setStep(i)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                step === i ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 py-5">
        {step === 0 && (
          <div className="space-y-4">
            <div className="bg-emerald-600 text-white rounded-2xl p-5 text-center">
              <p className="text-xs opacity-75 mb-2">答题口诀</p>
              <p className="text-xl font-bold leading-relaxed">{tip.formula}</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-emerald-100">
              <p className="text-sm text-gray-600 leading-relaxed">{tip.explanation}</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-xs font-semibold text-amber-700 mb-1">⚠️ 常见错误</p>
              <p className="text-sm text-amber-800">{tip.wrong_tip}</p>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-500 mb-2">答题步骤</p>
            {tip.steps.map((s, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 flex gap-3 items-start">
                <span className="w-7 h-7 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {i + 1}
                </span>
                <p className="text-sm text-gray-700 leading-relaxed pt-0.5">{s}</p>
              </div>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <p className="text-xs font-semibold text-gray-400 mb-2">题目示例</p>
              <p className="text-sm text-gray-800 font-medium">{tip.example_q}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
              <p className="text-xs font-semibold text-emerald-700 mb-2">✓ 标准答法</p>
              <p className="text-sm text-emerald-900 leading-relaxed">{tip.example_a}</p>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pb-8">
        <button
          onClick={onNext}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 rounded-2xl text-base transition-colors"
        >
          开始练习 →
        </button>
      </div>
    </div>
  )
}

// ── 主组件 ───────────────────────────────────────────────────
export default function ReadingPage({ user, onFinish, onBack }) {
  const [mode, setMode] = useState('menu') // menu | tip | quiz
  const [selectedTip, setSelectedTip] = useState(null)

  if (mode === 'tip' && selectedTip) {
    return (
      <TipCard
        tip={selectedTip}
        onNext={() => setMode('quiz')}
        onBack={() => setMode('menu')}
      />
    )
  }

  if (mode === 'quiz') {
    return (
      <ReadingQuiz
        user={user}
        onFinish={onFinish}
        onBack={() => setMode('menu')}
      />
    )
  }

  // 菜单
  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white px-5 pt-10 pb-8">
        <button onClick={onBack} className="text-emerald-200 text-sm mb-4">← 返回</button>
        <div className="text-4xl mb-2">📖</div>
        <h1 className="text-2xl font-bold">阅读星球</h1>
        <p className="text-emerald-200 text-sm mt-1">先学口诀，再练阅读</p>
      </div>

      <div className="flex-1 px-4 py-5">
        {/* 答题口诀 */}
        <h2 className="text-sm font-semibold text-gray-500 mb-3">答题口诀学习</h2>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {tips.map(tip => (
            <button
              key={tip.id}
              onClick={() => { setSelectedTip(tip); setMode('tip') }}
              className="bg-white border border-gray-100 rounded-2xl p-4 text-left shadow-sm active:scale-95 transition-transform"
            >
              <div className="text-2xl mb-2">{tip.emoji}</div>
              <div className="text-sm font-semibold text-gray-800">{tip.ability_tag}</div>
              <div className="text-xs text-gray-400 mt-1 line-clamp-1">{tip.formula}</div>
            </button>
          ))}
        </div>

        {/* 开始练习 */}
        <h2 className="text-sm font-semibold text-gray-500 mb-3">阅读练习</h2>
        <button
          onClick={() => setMode('quiz')}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl p-4 text-left shadow-lg active:scale-95 transition-transform"
        >
          <div className="flex items-center gap-3">
            <span className="text-3xl">📚</span>
            <div>
              <div className="text-base font-semibold">开始阅读练习</div>
              <div className="text-xs text-emerald-100 mt-0.5">15道题 · 随机抽取</div>
            </div>
            <span className="ml-auto text-white/70 text-xl">→</span>
          </div>
        </button>

        {/* 阅读文章库 */}
        <h2 className="text-sm font-semibold text-gray-500 mb-3 mt-6">阅读文章库</h2>
        <div className="flex flex-col gap-3">
          {passages.slice(0, 5).map(p => (
            <div
              key={p.id}
              className="bg-white border border-gray-100 rounded-2xl px-4 py-3.5 text-left shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📄</span>
                <div>
                  <div className="text-sm font-semibold text-gray-800">{p.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{p.questions.length}道题 · {p.grade}年级</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
