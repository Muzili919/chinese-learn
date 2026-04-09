import { useState, useRef, useMemo } from 'react'
import { storage, updateStreak } from '../utils/storage'
import { updateSRS, toQuality } from '../utils/srs'
import { syncAfterSession } from '../utils/sync'
import { evaluateReadingAnswer } from '../utils/ai'
import tips from '../data/reading_tips.json'
import readingQ from '../data/questions_reading.json'
import DuolingoStyleQuiz from '../components/DuolingoStyleQuiz'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// 关键词快速评分（AI调用前的初步判断）
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

function parsePassageAndSubQs(questionText) {
  const firstSubIdx = questionText.search(/（[1-9]）/)
  if (firstSubIdx < 0) return { passage: questionText, subQs: [] }
  const passage = questionText.slice(0, firstSubIdx).trim()
  const rest = questionText.slice(firstSubIdx)
  const subQs = []
  const matches = [...rest.matchAll(/（([1-9])）([\s\S]*?)(?=（[1-9]）|$)/g)]
  for (const m of matches) {
    subQs.push({ num: parseInt(m[1]), text: m[2].trim() })
  }
  return { passage, subQs }
}

function parseSubAnswers(answerText) {
  if (!answerText) return []
  const results = []
  const matches = [...answerText.matchAll(/（([1-9])）([\s\S]*?)(?=（[1-9]）|$)/g)]
  if (matches.length === 0) return [{ num: 1, text: answerText.trim() }]
  for (const m of matches) {
    results.push({ num: parseInt(m[1]), text: m[2].trim() })
  }
  return results
}

// ─── AI批改反馈面板 ───────────────────────────────────────────
function AIFeedbackPanel({ aiLoading, aiResult, fallbackResult, answer, analysis, onContinue, label }) {
  const [showAnswer, setShowAnswer] = useState(false)
  const [showAnalysis, setShowAnalysis] = useState(false)

  // 加载中
  if (aiLoading) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-30 rounded-t-3xl shadow-2xl bg-white border-t-4 border-emerald-400">
        <div className="px-5 py-8 text-center">
          <div className="text-4xl mb-3" style={{ animation: 'spin 1.5s linear infinite', display: 'inline-block' }}>🤖</div>
          <p className="text-base font-semibold text-gray-700">AI 正在批改你的答案…</p>
          <p className="text-xs text-gray-400 mt-1">分析关键要点，给你专属反馈</p>
          <div className="mt-4 flex justify-center gap-1">
            {[0,1,2].map(i => (
              <div key={i} className="w-2 h-2 rounded-full bg-emerald-400"
                style={{ animation: `bounce 1s ease-in-out ${i * 0.2}s infinite` }} />
            ))}
          </div>
        </div>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        `}</style>
      </div>
    )
  }

  // 没有AI结果，降级为普通反馈
  if (!aiResult) {
    const correct = fallbackResult?.correct
    return (
      <div className={`fixed bottom-0 left-0 right-0 z-30 rounded-t-3xl shadow-2xl max-h-[75vh] flex flex-col ${
        correct ? 'bg-green-50 border-t-4 border-green-400' : 'bg-red-50 border-t-4 border-red-400'
      }`}>
        <div className="flex-1 overflow-y-auto px-5 pt-5 pb-2">
          <p className={`text-xl font-bold mb-3 ${correct ? 'text-green-600' : 'text-red-500'}`}>
            {correct ? '✓ 答对了！' : '✗ 答错了'}
          </p>
          {answer && !correct && (
            <div className="mb-3 bg-white rounded-2xl px-4 py-3 border border-gray-200">
              <p className="text-xs text-gray-400 mb-1">参考答案</p>
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed font-medium">{answer}</p>
            </div>
          )}
          {analysis && <p className="text-xs text-gray-500 leading-relaxed">{analysis}</p>}
        </div>
        <div className="px-5 pt-3 pb-8">
          <button onClick={onContinue}
            className={`w-full py-3 rounded-2xl font-bold text-white text-base ${correct ? 'bg-green-500' : 'bg-red-500'}`}>
            {label || '继续'}
          </button>
        </div>
      </div>
    )
  }

  // AI批改结果面板
  const score = aiResult.score ?? 0
  const correct = aiResult.correct
  const scoreColor = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'
  const scoreBg = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500'
  const borderColor = score >= 80 ? 'border-green-400' : score >= 60 ? 'border-amber-400' : 'border-red-400'

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-30 rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col bg-white border-t-4 ${borderColor}`}>
      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-2">
        {/* 评分头部 */}
        <div className="flex items-center gap-4 mb-4">
          {/* 圆形评分圈 */}
          <div className="relative shrink-0" style={{ width: 64, height: 64 }}>
            <svg width="64" height="64" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="32" cy="32" r="26" fill="none" stroke="#f3f4f6" strokeWidth="6" />
              <circle cx="32" cy="32" r="26" fill="none" stroke={scoreColor} strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 26}`}
                strokeDashoffset={`${2 * Math.PI * 26 * (1 - score / 100)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span style={{ fontSize: 14, fontWeight: 800, color: scoreColor }}>{score}</span>
            </div>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-800">
              {score >= 80 ? '✓ 答得很好！' : score >= 60 ? '⚡ 基本正确' : '✗ 继续努力'}
            </p>
            <p className="text-xs text-emerald-500 font-medium flex items-center gap-1">
              <span>🤖</span> AI 智能批改
            </p>
          </div>
        </div>

        {/* 答对的要点 */}
        {aiResult.hitPoints?.length > 0 && (
          <div className="mb-3 bg-green-50 rounded-2xl px-4 py-3 border border-green-100">
            <p className="text-xs font-semibold text-green-600 mb-2 flex items-center gap-1">
              <span>✅</span> 答对的要点
            </p>
            <div className="flex flex-col gap-1">
              {aiResult.hitPoints.map((p, i) => (
                <p key={i} className="text-sm text-gray-700 leading-relaxed">• {p}</p>
              ))}
            </div>
          </div>
        )}

        {/* 遗漏的要点 */}
        {aiResult.missedPoints?.length > 0 && (
          <div className="mb-3 bg-amber-50 rounded-2xl px-4 py-3 border border-amber-100">
            <p className="text-xs font-semibold text-amber-600 mb-2 flex items-center gap-1">
              <span>⚠️</span> 还可以补充
            </p>
            <div className="flex flex-col gap-1">
              {aiResult.missedPoints.map((p, i) => (
                <p key={i} className="text-sm text-gray-700 leading-relaxed">• {p}</p>
              ))}
            </div>
          </div>
        )}

        {/* 老师批语 */}
        {aiResult.teacherComment && (
          <div className="mb-3 bg-blue-50 rounded-2xl px-4 py-3 border border-blue-100">
            <p className="text-xs font-semibold text-blue-600 mb-1 flex items-center gap-1">
              <span>👩‍🏫</span> 老师批语
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">{aiResult.teacherComment}</p>
          </div>
        )}

        {/* 提升方向 */}
        {aiResult.improvement && (
          <div className="mb-3 bg-violet-50 rounded-2xl px-4 py-3 border border-violet-100">
            <p className="text-xs font-semibold text-violet-600 mb-1 flex items-center gap-1">
              <span>💡</span> 提升方向
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">{aiResult.improvement}</p>
          </div>
        )}

        {/* 参考答案（折叠） */}
        {answer && (
          <button
            onClick={() => setShowAnswer(v => !v)}
            className="w-full text-left mb-2"
          >
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-100">
              <span className="text-xs text-gray-500 font-medium">📄 参考答案</span>
              <span className="text-gray-400 text-xs">{showAnswer ? '收起' : '查看'}</span>
            </div>
            {showAnswer && (
              <div className="bg-gray-50 rounded-b-xl px-4 pb-3 -mt-1 border-x border-b border-gray-100">
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{answer}</p>
              </div>
            )}
          </button>
        )}

        {/* 题目解析（折叠） */}
        {analysis && (
          <button
            onClick={() => setShowAnalysis(v => !v)}
            className="w-full text-left mb-2"
          >
            <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5 border border-gray-100">
              <span className="text-xs text-gray-500 font-medium">📝 题目解析</span>
              <span className="text-gray-400 text-xs">{showAnalysis ? '收起' : '查看'}</span>
            </div>
            {showAnalysis && (
              <div className="bg-gray-50 rounded-b-xl px-4 pb-3 -mt-1 border-x border-b border-gray-100">
                <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-wrap">{analysis}</p>
              </div>
            )}
          </button>
        )}
      </div>

      <div className="px-5 pt-3 pb-8">
        <button onClick={onContinue}
          className={`w-full py-3 rounded-2xl font-bold text-white text-base active:scale-95 transition-all ${scoreBg}`}>
          {label || '继续'}
        </button>
      </div>
    </div>
  )
}

// ─── 普通底部反馈面板（选择题用）─────────────────────────────
function FeedbackPanel({ correct, analysis, answer, onContinue, label }) {
  return (
    <div className={`fixed bottom-0 left-0 right-0 z-30 rounded-t-3xl shadow-2xl max-h-[72vh] flex flex-col ${
      correct ? 'bg-green-50 border-t-4 border-green-400' : 'bg-red-50 border-t-4 border-red-400'
    }`}>
      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-2">
        <div className="max-w-md mx-auto">
          <p className={`text-xl font-bold mb-2 ${correct ? 'text-green-600' : 'text-red-500'}`}>
            {correct ? '✓ 正确！' : '✗ 答错了'}
          </p>
          {!correct && answer && (
            <div className="mb-3 bg-white rounded-2xl px-4 py-3 border border-gray-200">
              <p className="text-xs text-gray-400 mb-1 font-medium">参考答案</p>
              <p className="text-sm font-semibold text-gray-800 whitespace-pre-wrap leading-relaxed">{answer}</p>
            </div>
          )}
          {analysis && (
            <div className="bg-white/60 rounded-2xl px-4 py-3 border border-gray-100">
              <p className="text-xs text-gray-400 mb-1 font-medium">解析</p>
              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{analysis}</p>
            </div>
          )}
        </div>
      </div>
      <div className="px-5 pt-3 pb-8">
        <div className="max-w-md mx-auto">
          <button onClick={onContinue}
            className={`w-full py-3 rounded-2xl font-bold text-white text-base active:scale-95 transition-all ${
              correct ? 'bg-green-500' : 'bg-red-500'
            }`}>
            {label || '继续'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── 多子题问答组件（带AI批改）──────────────────────────────
function MultiSubQuestion({ question, onDone }) {
  const { passage, subQs } = useMemo(
    () => parsePassageAndSubQs(question.question), [question.question]
  )
  const subAnswers = useMemo(() => parseSubAnswers(question.answer), [question.answer])

  const [subIndex, setSubIndex] = useState(0)
  const [subPhase, setSubPhase] = useState('answering') // 'answering' | 'ai_loading' | 'result'
  const [userInput, setUserInput] = useState('')
  const [fallbackResult, setFallbackResult] = useState(null)
  const [aiResult, setAiResult] = useState(null)
  const [passageOpen, setPassageOpen] = useState(false)
  const [results, setResults] = useState([])
  const resultsRef = useRef([])

  const current = subQs[subIndex]
  const currentAns = subAnswers.find(a => a.num === (current?.num ?? subIndex + 1))

  async function handleSubmit() {
    if (!userInput.trim()) return
    const fb = smartGrade(userInput, currentAns?.text || '')
    setFallbackResult(fb)
    setAiResult(null)
    setSubPhase('ai_loading')

    const newResults = [...resultsRef.current, { correct: fb.correct }]
    resultsRef.current = newResults
    setResults(newResults)

    try {
      const result = await evaluateReadingAnswer(current.text, userInput, currentAns?.text || '')
      setAiResult(result)
      // 用AI结果更新正确性
      const updatedResults = [...resultsRef.current]
      updatedResults[updatedResults.length - 1] = { correct: result.correct }
      resultsRef.current = updatedResults
      setResults(updatedResults)
    } catch (e) {
      // 降级到关键词评分
    }
    setSubPhase('result')
  }

  function handleContinue() {
    const nextIdx = subIndex + 1
    if (nextIdx >= subQs.length) {
      const allCorrect = resultsRef.current.every(r => r.correct)
      onDone(allCorrect)
    } else {
      setSubIndex(nextIdx)
      setSubPhase('answering')
      setUserInput('')
      setFallbackResult(null)
      setAiResult(null)
    }
  }

  if (!current) return null

  return (
    <div className="flex flex-col gap-4 pb-48">
      {/* 原文折叠框 */}
      {passage && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
          <button
            onClick={() => setPassageOpen(v => !v)}
            className="w-full px-4 py-3 flex items-center justify-between text-left"
          >
            <span className="text-sm font-semibold text-amber-700">📖 查看原文 / 材料</span>
            <span className="text-amber-500 text-lg">{passageOpen ? '∧' : '∨'}</span>
          </button>
          {passageOpen && (
            <div className="px-4 pb-4">
              <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">{passage}</p>
            </div>
          )}
        </div>
      )}

      {/* 子题进度 */}
      {subQs.length > 1 && (
        <div className="flex gap-1.5 justify-center">
          {subQs.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all ${
              i < subIndex ? 'w-5 bg-emerald-400' :
              i === subIndex ? 'w-5 bg-emerald-600' :
              'w-2 bg-gray-200'
            }`} />
          ))}
        </div>
      )}

      {/* 当前子题 */}
      <div className="bg-white rounded-3xl px-5 py-5 shadow-sm border border-gray-100">
        <p className="text-xs text-emerald-500 font-semibold mb-2">
          第 {subIndex + 1} 题（共 {subQs.length} 题）
        </p>
        <p className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap">{current.text}</p>
      </div>

      {/* 答题框 */}
      {subPhase === 'answering' && (
        <>
          <textarea
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            placeholder="请写下你的答案…"
            rows={3}
            style={{ fontSize: '16px' }}
            className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-base text-gray-800 focus:outline-none focus:border-emerald-400 resize-none"
          />
          <button
            onClick={handleSubmit}
            disabled={!userInput.trim()}
            className="w-full bg-emerald-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-2xl"
          >
            提交 · AI 批改
          </button>
        </>
      )}

      {/* AI反馈面板 */}
      {(subPhase === 'ai_loading' || subPhase === 'result') && (
        <AIFeedbackPanel
          aiLoading={subPhase === 'ai_loading'}
          aiResult={aiResult}
          fallbackResult={fallbackResult}
          answer={currentAns?.text}
          analysis={subIndex === subQs.length - 1 ? question.analysis : null}
          onContinue={handleContinue}
          label={subIndex + 1 >= subQs.length ? '完成本题 ✓' : `继续第 ${subIndex + 2} 题 →`}
        />
      )}
    </div>
  )
}

// ─── 主页面 ──────────────────────────────────────────────
export default function ReadingPage({ user, onFinish, onBack }) {
  const questions = useMemo(() => shuffle(readingQ).slice(0, 5), [])
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState('answering') // 'answering' | 'ai_loading' | 'result'
  const [userAnswer, setUserAnswer] = useState('')
  const [fallbackResult, setFallbackResult] = useState(null)
  const [aiResult, setAiResult] = useState(null)
  const [selected, setSelected] = useState(null)
  const [sessionRecords, setSessionRecords] = useState([])
  const startTime = useRef(Date.now())
  const xpRef = useRef(0)
  const randomTip = useMemo(() => tips[Math.floor(Math.random() * tips.length)], [index])

  const current = questions[index]
  const usesDuolingo = current && current.type !== 'open_ended'
  const { subQs } = useMemo(
    () => current ? parsePassageAndSubQs(current.question) : { subQs: [] },
    [current]
  )
  const hasSubQs = current?.type === 'open_ended' && subQs.length >= 2

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

  function finishSession(records) {
    const totalSec = Math.round((Date.now() - startTime.current) / 1000)
    const session = {
      date: new Date().toISOString(),
      total: records.length,
      correct: records.filter(r => r.correct).length,
      xpEarned: xpRef.current,
      durationSec: totalSec,
    }
    storage.addSession(user.id, session)
    updateStreak(user.id)
    syncAfterSession(user.id)
    onFinish({ session, records })
  }

  function handleChoiceSelect(option) {
    if (selected !== null) return
    const correct = option === current.answer
    setSelected(option)
    recordAndAdvance(correct, option)
    setFallbackResult({ correct })
    setPhase('result')
  }

  async function handleOpenSubmit() {
    if (!userAnswer.trim()) return
    const fb = smartGrade(userAnswer, current.answer)
    setFallbackResult(fb)
    setAiResult(null)
    setPhase('ai_loading')
    recordAndAdvance(fb.correct, userAnswer)

    try {
      const result = await evaluateReadingAnswer(current.question, userAnswer, current.answer)
      setAiResult(result)
    } catch (e) {
      // 降级到关键词评分
    }
    setPhase('result')
  }

  function handleDuolingoAnswer(chosenAnswer, correct) {
    recordAndAdvance(correct, chosenAnswer)
    advanceOrFinish(correct)
  }

  function handleMultiSubDone(allCorrect) {
    recordAndAdvance(allCorrect, '多子题')
    advanceOrFinish(allCorrect)
  }

  function advanceOrFinish(correct) {
    const newRecords = [...sessionRecords, {
      card_id: current.id, correct,
      knowledge_tag: current.knowledge_tag,
      timestamp: new Date().toISOString(),
    }]
    if (index + 1 >= questions.length) {
      finishSession(newRecords)
    } else {
      setIndex(i => i + 1)
      setPhase('answering')
      setUserAnswer('')
      setSelected(null)
      setFallbackResult(null)
      setAiResult(null)
    }
  }

  function handleContinue() {
    const correct = aiResult ? aiResult.correct : fallbackResult?.correct ?? false
    const newRecords = [...sessionRecords]
    if (index + 1 >= questions.length) {
      finishSession(newRecords)
    } else {
      setIndex(i => i + 1)
      setPhase('answering')
      setUserAnswer('')
      setSelected(null)
      setFallbackResult(null)
      setAiResult(null)
    }
  }

  if (!current) return null

  const progress = (index / questions.length) * 100

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-emerald-50 to-teal-50">
      {/* Top bar */}
      <div className="bg-white px-4 pt-8 pb-4 flex items-center gap-3 shadow-sm">
        <button onClick={onBack} className="text-gray-400 p-1 text-xl">✕</button>
        <div className="flex-1 bg-gray-100 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-emerald-400 to-teal-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm text-gray-400 font-medium min-w-[40px] text-right">
          {index + 1}/{questions.length}
        </span>
        {/* AI批改标识 */}
        <span className="text-xs bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-full font-medium">
          🤖 AI批改
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

        {/* DuolingoStyleQuiz 题（fill_blank / matching） */}
        {usesDuolingo && (
          <DuolingoStyleQuiz
            key={current.id}
            question={current}
            onAnswerSubmit={handleDuolingoAnswer}
          />
        )}

        {/* 多子题问答 */}
        {hasSubQs && (
          <MultiSubQuestion
            key={current.id}
            question={current}
            onDone={handleMultiSubDone}
          />
        )}

        {/* 普通 open_ended / 选择题 */}
        {!usesDuolingo && !hasSubQs && (
          <>
            {/* 题目 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
              <p className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap">{current.question}</p>
            </div>

            {/* 选择题 answering */}
            {current.type === 'single_choice' && phase === 'answering' && (
              <div className="flex flex-col gap-3">
                {current.options.map(option => (
                  <button
                    key={option}
                    onClick={() => handleChoiceSelect(option)}
                    className="bg-white border-2 border-gray-200 text-gray-700 rounded-2xl px-4 py-4 text-left text-base leading-snug transition-all active:scale-95 shadow-sm"
                  >{option}</button>
                ))}
              </div>
            )}

            {/* 选择题结果 */}
            {current.type === 'single_choice' && phase === 'result' && (
              <div className="flex flex-col gap-3 mb-4">
                {current.options.map(option => {
                  let cls = 'bg-white border-2 border-gray-100 text-gray-400'
                  if (option === current.answer) cls = 'bg-green-50 border-2 border-green-400 text-green-700'
                  else if (option === selected) cls = 'bg-red-50 border-2 border-red-400 text-red-700'
                  return (
                    <div key={option} className={`${cls} rounded-2xl px-4 py-4 text-left text-base`}>{option}</div>
                  )
                })}
              </div>
            )}

            {/* 开放题答题区 */}
            {current.type === 'open_ended' && phase === 'answering' && (
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
                  className="w-full bg-emerald-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-xl"
                >
                  提交 · AI 批改 🤖
                </button>
              </div>
            )}

            {/* AI反馈面板（开放题）*/}
            {current.type === 'open_ended' && (phase === 'ai_loading' || phase === 'result') && (
              <AIFeedbackPanel
                aiLoading={phase === 'ai_loading'}
                aiResult={aiResult}
                fallbackResult={fallbackResult}
                answer={current.answer}
                analysis={current.analysis}
                onContinue={handleContinue}
                label={index + 1 >= questions.length ? '完成练习 🎉' : '继续'}
              />
            )}

            {/* 普通选择题反馈面板 */}
            {current.type === 'single_choice' && phase === 'result' && (
              <FeedbackPanel
                correct={fallbackResult?.correct}
                answer={!fallbackResult?.correct ? current.answer : null}
                analysis={current.analysis}
                onContinue={handleContinue}
                label={index + 1 >= questions.length ? '完成练习 🎉' : '继续'}
              />
            )}

            {/* 随机小贴士 */}
            {phase === 'answering' && index % 3 === 0 && randomTip && (
              <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <p className="text-yellow-800 text-xs font-semibold mb-1">💡 {randomTip.title}</p>
                {randomTip.formula && <p className="text-yellow-700 text-xs">{randomTip.formula}</p>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
