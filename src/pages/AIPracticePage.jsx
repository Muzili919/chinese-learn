/**
 * AIPracticePage — AI 针对性练习
 *
 * 入口：Dashboard 的「AI针对练习」卡片
 * 流程：AI出题 → 逐题作答（DuolingoStyleQuiz）→ 结果 → 错题归入错题集
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { generateTargetedQuestions } from '../utils/ai'
import { storage } from '../utils/storage'
import DuolingoStyleQuiz from '../components/DuolingoStyleQuiz'

const SUBJECT_LABEL = { chinese: '语文', english: '英语', math: '数学', politics: '道法' }
const SUBJECT_EMOJI = { chinese: '📖', english: '🌎', math: '🔢', politics: '⚖️' }
const SUBJECT_COLOR = {
  chinese: { from: '#6366f1', to: '#8b5cf6', bg: '#eef2ff', light: '#e0e7ff' },
  english: { from: '#059669', to: '#10b981', bg: '#ecfdf5', light: '#d1fae5' },
  math:    { from: '#d97706', to: '#f59e0b', bg: '#fffbeb', light: '#fef3c7' },
  politics:{ from: '#7c3aed', to: '#a855f7', bg: '#f5f3ff', light: '#ede9fe' },
}

export default function AIPracticePage({ user, grade, subject, weakTags, onBack }) {
  const [phase, setPhase] = useState('loading') // loading | quiz | done | error
  const [questions, setQuestions] = useState([])
  const [qIndex, setQIndex]   = useState(0)
  const [results, setResults] = useState([])
  const [errorMsg, setErrorMsg] = useState('')
  const dots = useRef(0)
  const [dotStr, setDotStr] = useState('…')

  const color = SUBJECT_COLOR[subject] || SUBJECT_COLOR.chinese

  // 省略号动画
  useEffect(() => {
    const timer = setInterval(() => {
      dots.current = (dots.current + 1) % 4
      setDotStr('·'.repeat(dots.current + 1))
    }, 400)
    return () => clearInterval(timer)
  }, [])

  // 生成题目
  const loadQuestions = useCallback(async () => {
    setPhase('loading')
    setErrorMsg('')
    setResults([])
    setQIndex(0)
    try {
      const qs = await generateTargetedQuestions(subject, weakTags, grade, 8)
      if (!qs || qs.length === 0) throw new Error('AI没有生成有效题目，请重试')
      setQuestions(qs)
      setPhase('quiz')
    } catch (err) {
      setErrorMsg(err.message || 'AI出题失败，请检查网络后重试')
      setPhase('error')
    }
  }, [subject, weakTags, grade])

  useEffect(() => { loadQuestions() }, [loadQuestions])

  // 每题答完回调（DuolingoStyleQuiz 调用）
  function handleAnswer(userAnswer, correct) {
    const q = questions[qIndex]
    // 存入答题记录（和正常答题一样，错题系统自动识别）
    storage.addRecord(user.id, {
      card_id: q.id,
      subject: q.subject,
      correct,
      timestamp: new Date().toISOString(),
      knowledge_tag: q.knowledge_tag,
      ability_tag: q.ability_tag,
      time_spent: 0,
      isAIGenerated: true,
      // 保存题目原始数据，供错题复习时还原
      question_data: {
        type: q.type === 'single_choice' ? 'choice' : 'fill_blank',
        stem: q.question,
        options: q.options,
        answer: q.answer,
        analysis: q.analysis,
      },
    })

    const newResults = [...results, { question: q, userAnswer, correct }]
    setResults(newResults)

    const next = qIndex + 1
    if (next >= questions.length) {
      setPhase('done')
    } else {
      setQIndex(next)
    }
  }

  const correctCount = results.filter(r => r.correct).length
  const accuracy = results.length > 0 ? Math.round(correctCount / results.length * 100) : 0
  const wrongCount = results.length - correctCount

  // ── 加载中 ─────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6"
        style={{ background: color.bg }}>
        <div className="text-6xl mb-6" style={{ animation: 'bounce 1.2s infinite' }}>
          {SUBJECT_EMOJI[subject]}
        </div>
        <p className="text-xl font-bold text-gray-800 mb-1">AI 正在出题</p>
        <p className="text-sm text-gray-500 mb-4">
          针对「{weakTags.slice(0, 2).join('、')}」薄弱点
        </p>
        <div className="flex items-center gap-1.5 mb-2">
          {[0,1,2,3,4,5,6].map(i => (
            <div key={i}
              className="w-2 h-2 rounded-full"
              style={{
                background: color.from,
                animation: `fadeInOut 1.4s ${i*0.2}s infinite`,
                opacity: 0.3,
              }}
            />
          ))}
        </div>
        <p className="text-sm font-medium mt-2" style={{ color: color.from }}>
          生成中{dotStr}
        </p>
        <p className="text-xs text-gray-400 mt-6">通常需要 5-10 秒</p>
        <button onClick={onBack} className="mt-8 text-gray-400 text-sm py-2">← 返回</button>
        <style>{`
          @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
          @keyframes fadeInOut { 0%,100%{opacity:0.3;transform:scale(1)} 50%{opacity:1;transform:scale(1.4)} }
        `}</style>
      </div>
    )
  }

  // ── 出题失败 ────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="text-5xl mb-4">😓</div>
        <p className="text-lg font-bold text-gray-800 mb-2">出题失败</p>
        <p className="text-sm text-gray-500 text-center mb-6 max-w-xs">{errorMsg}</p>
        <button onClick={loadQuestions}
          className="w-full max-w-xs font-bold py-4 rounded-2xl text-white mb-3 active:scale-95 transition-all"
          style={{ background: `linear-gradient(135deg, ${color.from}, ${color.to})` }}>
          重新生成
        </button>
        <button onClick={onBack} className="text-gray-400 text-sm py-2">← 返回</button>
      </div>
    )
  }

  // ── 练习完成 ────────────────────────────────────────────
  if (phase === 'done') {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#f9fafb' }}>
        <div className="text-white px-5 pt-12 pb-8 text-center"
          style={{ background: `linear-gradient(135deg, ${color.from}, ${color.to})` }}>
          <div className="text-5xl mb-3">
            {accuracy >= 80 ? '🎉' : accuracy >= 60 ? '👍' : '💪'}
          </div>
          <h1 className="text-2xl font-bold">
            {accuracy >= 80 ? '太厉害了！' : accuracy >= 60 ? '继续加油！' : '再练一次！'}
          </h1>
          <p className="text-white/70 text-sm mt-1">AI 专项练习完成</p>
          <div className="flex justify-center gap-8 mt-5">
            {[
              { val: `${accuracy}%`, label: '正确率' },
              { val: questions.length, label: '答题数' },
              { val: wrongCount, label: '错题数', red: true },
            ].map(({ val, label, red }) => (
              <div key={label}>
                <div className={`text-4xl font-bold ${red && wrongCount > 0 ? 'text-red-300' : ''}`}>{val}</div>
                <div className="text-white/60 text-xs mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 px-4 py-5 overflow-y-auto">
          {wrongCount > 0 && (
            <div className="bg-white rounded-2xl p-4 mb-4 border-l-4 border-red-400 shadow-sm">
              <p className="text-sm font-semibold text-red-600">
                ⚠️ {wrongCount} 道错题已加入错题集
              </p>
              <p className="text-xs text-gray-400 mt-0.5">在「错题本」里可继续复习</p>
            </div>
          )}

          {/* 题目回顾 */}
          <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-50 mb-5">
            {results.map((r, i) => (
              <div key={i} className="flex items-start px-4 py-3 gap-3">
                <span className={`text-lg font-bold flex-shrink-0 ${r.correct ? 'text-green-500' : 'text-red-400'}`}>
                  {r.correct ? '✓' : '✗'}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 line-clamp-2">{r.question.question}</p>
                  {!r.correct && (
                    <p className="text-xs text-indigo-600 mt-0.5 font-medium">
                      正确：{r.question.answer}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom,0px), 16px)' }}>
            <button onClick={loadQuestions}
              className="w-full font-bold py-4 rounded-2xl text-white text-base active:scale-95 transition-all shadow-md"
              style={{ background: `linear-gradient(135deg, ${color.from}, ${color.to})` }}>
              再来一轮 🔄
            </button>
            <button onClick={onBack}
              className="w-full bg-white border-2 border-gray-200 text-gray-700 font-semibold py-4 rounded-2xl text-base active:scale-95">
              返回主页
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── 答题中 ──────────────────────────────────────────────
  const current = questions[qIndex]
  if (!current) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶栏 */}
      <div className="bg-white px-4 flex items-center gap-3 shadow-sm"
        style={{ paddingTop: 'env(safe-area-inset-top, 36px)', paddingBottom: 12 }}>
        <button onClick={onBack}
          className="text-sm font-semibold"
          style={{ color: color.from }}>
          ← 返回
        </button>
        <span className="text-sm font-bold text-gray-700">
          {SUBJECT_EMOJI[subject]} AI 专项练习
        </span>
        {/* 进度 */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-400">{qIndex + 1}/{questions.length}</span>
        </div>
      </div>

      {/* 进度条 */}
      <div className="h-1.5 bg-gray-100">
        <div className="h-full transition-all"
          style={{
            width: `${((qIndex) / questions.length) * 100}%`,
            background: `linear-gradient(90deg, ${color.from}, ${color.to})`,
          }}
        />
      </div>

      {/* 弱项标签提示 */}
      <div className="px-4 pt-3 pb-1 flex gap-2 flex-wrap">
        {weakTags.slice(0, 3).map(tag => (
          <span key={tag}
            className="text-xs px-2.5 py-0.5 rounded-full font-medium"
            style={{ background: color.light, color: color.from }}>
            {tag}
          </span>
        ))}
      </div>

      {/* 题目 */}
      <div className="px-4 py-2">
        <DuolingoStyleQuiz
          key={current.id}
          question={current}
          onAnswerSubmit={handleAnswer}
          showVariantButton={false}
          hideAiFeatures
        />
      </div>
    </div>
  )
}
