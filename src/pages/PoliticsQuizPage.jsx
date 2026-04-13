import { useState, useEffect, useRef, useMemo } from 'react'
import { storage, updateStreak } from '../utils/storage'
import { updateSRS, toQuality } from '../utils/srs'
import { syncAfterSession } from '../utils/sync'
import { evaluateQuestion } from '../utils/ai_v2'
import polChoiceQ from '../data/questions_politics_choice.json'
import polAnswerQ from '../data/questions_politics_answer.json'
import polAnalysisQ from '../data/questions_politics_analysis.json'

// 不同星球每次答题数
const SESSION_SIZES = {
  pol_choice: 20,
  pol_answer: 10,
  pol_analysis: 5,
  pol_explore: 3,
}

const POL_QUESTION_MAP = {
  pol_choice:   polChoiceQ,
  pol_answer:   polAnswerQ,
  pol_analysis: polAnalysisQ,
  pol_explore:  polAnswerQ, // 实践探究和简答题在同一文件，通过 task_type 区分
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ─── 材料分析题专用组件 ──────────────────────────────────────────────────

function MaterialAnalysisQuiz({ question: q, onSubmit }) {
  const material = q.material || ''
  const subQuestions = q.sub_questions || []
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [aiResults, setAiResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [materialExpanded, setMaterialExpanded] = useState(true)

  const current = subQuestions[step]
  const currentAnswer = answers[step] || ''

  if (subQuestions.length === 0) {
    return <SimpleOpenEndedQuiz q={q} onSubmit={onSubmit} />
  }

  // 全部提交后 → AI批量评分
  async function handleFinalSubmit() {
    setLoading(true)
    try {
      const results = []
      for (let i = 0; i < subQuestions.length; i++) {
        const sub = subQuestions[i]
        const ans = answers[i] || ''
        if (ans.trim().length > 0) {
          try {
            const result = await evaluateQuestion(
              { ...q, question: sub.question, answer: q.answer, knowledge_tag: q.knowledge_tag, ability_tag: '材料分析题' },
              ans,
              'politics'
            )
            results.push({ ...result, userAnswer: ans, question: sub.question, maxScore: sub.max_score || 8 })
          } catch {
            results.push({ score: 0, correct: false, errorType: 'AI评分失败', userAnswer: ans, question: sub.question, maxScore: sub.max_score || 8 })
          }
        } else {
          results.push({ score: 0, correct: false, errorType: '未作答', userAnswer: '', question: sub.question, maxScore: sub.max_score || 8 })
        }
      }
      setAiResults(results)
      setSubmitted(true)
      setLoading(false)
    } catch (e) {
      console.error('AI评分失败', e)
      setLoading(false)
    }
  }

  // 结果页
  if (submitted) {
    const totalScore = aiResults.reduce((s, r) => s + r.score, 0)
    const maxTotal = aiResults.reduce((s, r) => s + (r.maxScore || 8), 0)
    const pct = maxTotal > 0 ? Math.round(totalScore / maxTotal * 100) : 0
    return (
      <div className="flex flex-col gap-4">
        <div className={`rounded-2xl p-5 border text-center ${pct >= 60 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="text-4xl mb-2">{pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '💪'}</div>
          <div className={`text-2xl font-extrabold ${pct >= 60 ? 'text-green-700' : 'text-amber-700'}`}>
            {totalScore} / {maxTotal} 分
          </div>
          <div className="text-sm text-gray-500 mt-1">得分率 {pct}%</div>
        </div>

        {/* 各子问详情 */}
        {aiResults.map((r, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-violet-600">第{i + 1}问</span>
              <span className={`text-sm font-bold ${r.score >= (r.maxScore || 8) * 0.6 ? 'text-green-600' : 'text-red-600'}`}>
                {r.score}/{r.maxScore || 8}分
              </span>
            </div>
            <p className="text-xs text-gray-600 mb-2">{r.question}</p>

            {/* AI评分详情 */}
            {r.scoringPoints && r.scoringPoints.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {r.scoringPoints.map((sp, si) => (
                  <span key={si} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${sp.matched ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {sp.matched ? '✓' : '✗'} {sp.point} ({sp.earned}/{sp.total})
                  </span>
                ))}
              </div>
            )}
            {r.teachingTip && (
              <div className="text-[11px] text-blue-600 bg-blue-50 rounded-lg p-2 mt-2">
                💡 {r.teachingTip}
              </div>
            )}
            {r.fullAnswer && (
              <details className="mt-2">
                <summary className="text-[11px] text-gray-500 cursor-pointer">📖 参考答案</summary>
                <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">{r.fullAnswer}</p>
              </details>
            )}
          </div>
        ))}

        <button onClick={() => onSubmit('', pct >= 50)}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-400 to-purple-500 text-white font-bold active:scale-95 transition-transform shadow-md">
          继续下一题 →
        </button>
      </div>
    )
  }

  const isLastStep = step >= subQuestions.length - 1
  const allAnswered = subQuestions.every((_, i) => (answers[i] || '').trim().length > 0)

  return (
    <div className="flex flex-col gap-3">
      {/* 材料展示 */}
      <div className="bg-white rounded-2xl px-4 py-3 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-violet-600">📰 阅读材料</span>
          <button onClick={() => setMaterialExpanded(!materialExpanded)}
            className="text-[10px] text-gray-400">
            {materialExpanded ? '收起 ▲' : '展开 ▼'}
          </button>
        </div>
        {materialExpanded && (
          <div className="max-h-40 overflow-y-auto">
            <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{material}</p>
          </div>
        )}
      </div>

      {/* 子问题导航 */}
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
          <div className="bg-violet-400 h-1.5 rounded-full transition-all"
            style={{ width: `${(step / subQuestions.length) * 100}%` }} />
        </div>
        <span className="text-xs text-gray-400 font-medium">第 {step + 1} / {subQuestions.length} 问</span>
      </div>

      {/* 当前子问题 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-gray-800 text-sm leading-relaxed">{current.question}</p>
        <span className="text-[10px] text-violet-400 mt-1 inline-block">（{current.max_score || 8}分）</span>
      </div>

      {/* 答案输入 */}
      <textarea
        value={currentAnswer}
        onChange={e => setAnswers({ ...answers, [step]: e.target.value })}
        placeholder="请在此写下你的答案..."
        className="w-full h-32 rounded-2xl border border-gray-200 p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
        autoFocus
      />

      {/* 导航按钮 */}
      <div className="flex gap-2">
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)}
            className="flex-1 py-3 rounded-2xl bg-gray-100 text-gray-600 font-bold active:scale-95">
            ← 上一问
          </button>
        )}
        {!isLastStep ? (
          <button onClick={() => setStep(s => s + 1)}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-violet-400 to-purple-500 text-white font-bold active:scale-95">
            下一问 →
          </button>
        ) : (
          <button onClick={handleFinalSubmit} disabled={loading}
            className={`flex-1 py-3 rounded-2xl font-bold active:scale-95 ${loading ? 'bg-gray-300 text-gray-500' : 'bg-gradient-to-r from-red-400 to-rose-500 text-white'}`}>
            {loading ? '🤖 AI评分中...' : '📝 提交全部批改'}
          </button>
        )}
      </div>
    </div>
  )
}

// ─── 简答题/实践探究题组件 ──────────────────────────────────────────────

function SimpleOpenEndedQuiz({ q, onSubmit }) {
  const [input, setInput] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [aiResult, setAiResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const isExplore = q.task_type === '倡议书' || q.task_type === '辩论稿' || q.task_type === '活动方案'

  async function handleSubmit() {
    if (!input.trim()) return
    setLoading(true)
    try {
      const result = await evaluateQuestion(q, input, 'politics')
      setAiResult(result)
      setSubmitted(true)
      setLoading(false)
    } catch (e) {
      console.error('AI评分失败', e)
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isExplore ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-100 text-violet-700'}`}>
            {isExplore ? `实践探究·${q.task_type || ''}` : '简答题'}
          </span>
        </div>
        <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{q.question}</p>
        {q.reference_points && (
          <div className="mt-2 flex flex-wrap gap-1">
            <span className="text-[10px] text-gray-400">参考角度：</span>
            {q.reference_points.map((rp, i) => (
              <span key={i} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{rp}</span>
            ))}
          </div>
        )}
      </div>

      {!submitted ? (
        <>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={isExplore ? '请在此写下你的倡议书/辩论稿/活动方案...' : '请在此写下你的答案...'}
            className="w-full h-36 rounded-2xl border border-gray-200 p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
            autoFocus
          />
          <button onClick={handleSubmit} disabled={loading || !input.trim()}
            className={`w-full py-3 rounded-2xl font-bold ${loading || !input.trim() ? 'bg-gray-200 text-gray-400' : 'bg-gradient-to-r from-violet-400 to-purple-500 text-white active:scale-95'}`}>
            {loading ? '🤖 AI批改中...' : '📝 提交批改'}
          </button>
        </>
      ) : aiResult && (
        <>
          {/* AI评分结果 */}
          <div className={`rounded-2xl p-4 border ${aiResult.score >= 60 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-lg font-extrabold ${aiResult.score >= 60 ? 'text-green-700' : 'text-red-600'}`}>
                {aiResult.score >= 80 ? '✅ 优秀' : aiResult.score >= 60 ? '👍 及格' : '💪 需努力'}
              </span>
              <span className="text-xl font-bold text-gray-700">{aiResult.score}分</span>
            </div>
            {aiResult.scoringPoints && aiResult.scoringPoints.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {aiResult.scoringPoints.map((sp, i) => (
                  <span key={i} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${sp.matched ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {sp.matched ? '✓' : '✗'} {sp.point}
                  </span>
                ))}
              </div>
            )}
            {aiResult.teachingTip && (
              <div className="text-xs text-blue-600 mt-2">💡 {aiResult.teachingTip}</div>
            )}
            {aiResult.commonMistake && (
              <div className="text-xs text-amber-600 mt-1">⚠️ {aiResult.commonMistake}</div>
            )}
          </div>
          {aiResult.fullAnswer && (
            <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4">
              <div className="text-sm font-semibold text-violet-700 mb-1">📖 参考答案</div>
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{aiResult.fullAnswer}</div>
            </div>
          )}
          <button onClick={() => onSubmit(input, aiResult.score >= 60)}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-400 to-purple-500 text-white font-bold active:scale-95 shadow-md">
            继续下一题 →
          </button>
        </>
      )}
    </div>
  )
}

// ─── 选择题组件 ──────────────────────────────────────────────────────────

function PoliticsChoiceQuiz({ q, onSubmit }) {
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  const ans = (q.answer || '').trim()
  const correctIdx = /^[A-D]$/i.test(ans) ? ans.toUpperCase().charCodeAt(0) - 65 : -1

  function handleSelect(idx) {
    if (submitted) return
    setSelected(idx)
    const correct = idx === correctIdx
    setIsCorrect(correct)
    setSubmitted(true)
  }

  const feedbackBg = isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'

  return (
    <div className="flex flex-col gap-4">
      {/* 题目 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
            {q.module || '选择题'}
          </span>
          <span className="text-[10px] text-gray-400">{q.knowledge_tag}</span>
        </div>
        <p className="text-gray-800 text-sm leading-relaxed">{q.question}</p>
      </div>

      {/* 选项 */}
      <div className="flex flex-col gap-2">
        {(q.options || []).map((opt, i) => {
          let cls = 'bg-white border-gray-200 text-gray-700'
          if (submitted) {
            if (i === correctIdx) cls = 'bg-green-50 border-green-400 text-green-700'
            else if (i === selected && !isCorrect) cls = 'bg-red-50 border-red-400 text-red-600'
            else cls = 'bg-white border-gray-100 text-gray-300'
          }
          return (
            <button key={i} onClick={() => handleSelect(i)} disabled={submitted}
              className={`rounded-2xl border-2 px-4 py-3 text-sm font-medium text-left transition-all active:scale-95 ${cls}`}>
              <span className="mr-2 text-xs font-bold opacity-40">{['A', 'B', 'C', 'D'][i]}.</span>
              {opt.replace(/^[A-D]\.\s*/i, '')}
            </button>
          )
        })}
      </div>

      {/* 反馈 */}
      {submitted && (
        <div className={`rounded-2xl p-4 border ${feedbackBg}`}>
          <div className={`font-bold text-base mb-2 ${isCorrect ? 'text-green-700' : 'text-red-600'}`}>
            {isCorrect ? '✅ 回答正确！' : `❌ 正确答案：${['A', 'B', 'C', 'D'][correctIdx]}`}
          </div>
          {q.analysis && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="text-xs text-gray-600 leading-relaxed">{q.analysis}</div>
            </div>
          )}
        </div>
      )}

      {submitted && (
        <button onClick={() => onSubmit(q.options?.[selected] || '', isCorrect)}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-400 to-purple-500 text-white font-bold active:scale-95 shadow-md">
          继续下一题 →
        </button>
      )}
    </div>
  )
}

// ─── 题目类型检测 ──────────────────────────────────────────────────────

function getQuizComponent(q) {
  if (q.type === 'open_ended' && q.sub_questions && q.sub_questions.length > 0 && q.material) {
    return 'material_analysis'
  }
  if (q.type === 'open_ended') return 'open_ended'
  if (q.type === 'multiple_choice' || Array.isArray(q.options)) return 'choice'
  return 'choice'
}

// ─── 主页面 ─────────────────────────────────────────────────────────────

const PLANET_LABELS = {
  pol_choice: '基石星球 🏛️', pol_answer: '思辨星球 💬',
  pol_analysis: '洞察星球 📰', pol_explore: '行动星球 🔬',
}

const TYPE_LABEL_MAP = {
  pol_choice: '选择题', pol_answer: '简答题',
  pol_analysis: '材料分析题', pol_explore: '实践探究题',
}

export default function PoliticsQuizPage({ user, options = {}, onFinish, onBack }) {
  const { politicsTag = 'pol_choice' } = options
  const srsStates = useRef(storage.getSrsState(user.id))
  const startTime = useRef(Date.now())
  const questionStartTime = useRef(Date.now())

  // 过滤实践探究题：按 task_type 值区分
  const sessionSize = SESSION_SIZES[politicsTag] || 15
  const EXPLORE_TYPES = ['倡议书', '辩论稿', '活动方案']
  const questions = useMemo(() => {
    let pool = POL_QUESTION_MAP[politicsTag] || polChoiceQ
    if (politicsTag === 'pol_explore') {
      pool = pool.filter(q => EXPLORE_TYPES.includes(q.task_type))
    } else if (politicsTag === 'pol_answer') {
      // 简答题 = 有 task_type 但不是实践探究类型（为什么/怎么做/区别联系/启示）
      pool = pool.filter(q => q.task_type && !EXPLORE_TYPES.includes(q.task_type))
    }
    return shuffle(pool).slice(0, sessionSize)
  }, [politicsTag, sessionSize])

  const [index, setIndex] = useState(0)
  const [sessionRecords, setSessionRecords] = useState([])
  const [xpGained, setXpGained] = useState(0)

  const current = questions[index]

  useEffect(() => { questionStartTime.current = Date.now() }, [index])

  function handleAnswerSubmit(chosenAnswer, correct) {
    const timeSec = (Date.now() - questionStartTime.current) / 1000
    const newCardState = updateSRS(srsStates.current[current.id], toQuality(correct, timeSec))
    storage.updateCardSrs(user.id, current.id, newCardState)
    srsStates.current[current.id] = newCardState

    const xp = correct ? 5 : 1
    setXpGained(p => p + xp)
    storage.addXP(user.id, xp)

    const record = {
      card_id: current.id, correct,
      time_spent: Math.round(timeSec * 10) / 10,
      selected_answer: chosenAnswer,
      ability_tag: TYPE_LABEL_MAP[politicsTag] || current.ability_tag || '选择题',
      knowledge_tag: current.knowledge_tag || current.module || '',
      subject: 'politics',
      timestamp: new Date().toISOString(),
    }
    storage.addRecord(user.id, record)

    // 错题归集
    if (!correct) {
      const wrongQ = {
        ...current,
        type: current.type || 'multiple_choice',
        question: current.question,
        options: current.options || [],
        answer: current.answer,
        analysis: current.analysis || '',
        knowledge_tag: current.knowledge_tag || current.module || '',
        ability_tag: TYPE_LABEL_MAP[politicsTag] || current.ability_tag || '选择题',
        subject: 'politics',
        source: 'politics_quiz',
      }
      const wrongBook = JSON.parse(localStorage.getItem('cl_wrong_book') || '{}')
      wrongBook[current.id] = { ...wrongQ, wrongAt: new Date().toISOString(), userId: user.id }
      localStorage.setItem('cl_wrong_book', JSON.stringify(wrongBook))
    }

    setSessionRecords(p => [...p, record])

    if (index + 1 >= questions.length) {
      const totalSec = Math.round((Date.now() - startTime.current) / 1000)
      const allRecords = [...sessionRecords, record]
      const correctCount = allRecords.filter(r => r.correct).length
      const session = {
        date: new Date().toISOString(),
        total: allRecords.length, correct: correctCount,
        xpEarned: xpGained + xp, durationSec: totalSec,
      }
      storage.addSession(user.id, session)
      // 标记星球完成（只有做完才算打卡）
      if (current?.ability_tag) storage.markPlanetComplete(user.id, current.ability_tag)
      updateStreak(user.id)
      syncAfterSession(user.id)
      onFinish({ session, records: allRecords })
    } else {
      setIndex(i => i + 1)
    }
  }

  if (!current) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-violet-50 to-purple-50 px-8">
        <div className="text-6xl mb-4">📚</div>
        <h2 className="text-xl font-bold text-gray-700 mb-2">题库建设中</h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          该星球题目正在生成中，敬请期待！
        </p>
        <button onClick={onBack}
          className="px-6 py-3 rounded-2xl bg-violet-500 text-white font-bold active:scale-95">
          ← 返回
        </button>
      </div>
    )
  }

  const quizType = getQuizComponent(current)

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-violet-50 to-purple-50">
      {/* 顶部进度栏 */}
      <div className="flex-shrink-0 bg-white px-4 pt-8 pb-4 flex items-center gap-3 shadow-sm">
        <button onClick={onBack} className="text-gray-400 p-1 text-xl">✕</button>
        <div className="flex-1 bg-gray-100 rounded-full h-2">
          <div className="bg-gradient-to-r from-violet-400 to-purple-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(index / questions.length) * 100}%` }} />
        </div>
        <span className="text-sm text-gray-500 font-medium min-w-[40px] text-right">
          {index + 1}/{questions.length}
        </span>
      </div>

      {/* 星球标签 */}
      <div className="flex-shrink-0 px-4 pt-2 pb-1">
        <span className="text-xs text-violet-500 font-medium bg-violet-50 px-3 py-1 rounded-full">
          {PLANET_LABELS[politicsTag] || '政治练习'}
        </span>
      </div>

      {/* 答题区 */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {quizType === 'material_analysis' && <MaterialAnalysisQuiz key={current.id} question={current} onSubmit={handleAnswerSubmit} />}
        {quizType === 'open_ended' && <SimpleOpenEndedQuiz key={current.id} q={current} onSubmit={handleAnswerSubmit} />}
        {quizType === 'choice' && <PoliticsChoiceQuiz key={current.id} q={current} onSubmit={handleAnswerSubmit} />}
      </div>
    </div>
  )
}
