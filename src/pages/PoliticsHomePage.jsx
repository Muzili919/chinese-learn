import { useMemo, useState, useEffect } from 'react'
import { storage, calcLevel, calcLevelProgress } from '../utils/storage'
import { diagnose, getWeakPoints } from '../utils/diagnosis'
import { getRecommendedTask, clearAnchor } from '../utils/recommendation'
import TodayTaskCard from '../components/TodayTaskCard'

const POLITICS_PLANETS = [
  { id: 'pol_choice',   label: '基石', emoji: '🏛️', color: 'from-blue-400 to-blue-600',    desc: '选择题·基础概念' },
  { id: 'pol_answer',   label: '思辨', emoji: '💬', color: 'from-violet-400 to-purple-600', desc: '简答题·理解归纳' },
  { id: 'pol_analysis', label: '洞察', emoji: '📰', color: 'from-amber-400 to-orange-600',  desc: '材料分析·知识迁移' },
  { id: 'pol_explore',  label: '行动', emoji: '🔬', color: 'from-emerald-400 to-teal-600',  desc: '实践探究·辩论稿' },
]

const POLITICS_SPECIAL = [
  { id: 'pol_ai', label: 'AI模拟', emoji: '🎯', color: 'from-red-500 to-rose-600', desc: 'AI组卷·中考比例', isSelfTest: true },
]

const WEAK_TAG_MAP = {
  '选择题': 'pol_choice',
  '简答题': 'pol_answer',
  '材料分析题': 'pol_analysis',
  '实践探究题': 'pol_explore',
}

export default function PoliticsHomePage({ user, onStartQuiz, onBack, hideHeader, onWrongAnswers }) {
  const records = storage.getRecords(user.id)

  const [taskRefresh, setTaskRefresh] = useState(0)
  const [sprintMode, setSprintMode] = useState(false)

  const todayTask = useMemo(() => {
    return getRecommendedTask(user.id, 'politics')
  }, [user.id, records, taskRefresh])

  const wrongCount = useMemo(() => {
    const allWrong = storage.getWrongCardIds(user.id)
    const polRecords = records.filter(r => r.subject === 'politics')
    let count = 0
    for (const id of allWrong) {
      if (polRecords.some(r => r.card_id === id)) count++
    }
    return count
  }, [user.id, records])

  const POL_TAG_TO_QUIZ = {
    '选择题': { politicsTag: 'pol_choice' },
    '简答题': { politicsTag: 'pol_answer' },
    '材料分析题': { politicsTag: 'pol_analysis' },
    '实践探究题': { politicsTag: 'pol_explore' },
  }

  const handleStartTask = ({ type, tag, knowledge, maxQuestions }) => {
    const opts = POL_TAG_TO_QUIZ[tag] || {}
    switch (type) {
      case 'srs':
        onStartQuiz({ politicsTag: 'pol_choice', srsFirst: true, maxQuestions: maxQuestions || 3 })
        break
      case 'anchor': case 'optional':
        onStartQuiz({ ...opts, maxQuestions: maxQuestions || 3 })
        break
      case 'quick': case 'full': {
        const anchorOpts = POL_TAG_TO_QUIZ[todayTask.anchor?.tag] || { politicsTag: 'pol_choice' }
        onStartQuiz({ ...anchorOpts, maxQuestions })
        break
      }
      case 'wrong_review':
        onStartQuiz({ wrongReview: true, subject: 'politics' })
        break
      default:
        onStartQuiz({ politicsTag: 'pol_choice' })
    }
  }

  const handleClearAnchor = () => {
    clearAnchor(user.id, "politics")
    setTaskRefresh(k => k + 1)
  }

  const [refreshKey, setRefreshKey] = useState(0)
  useEffect(() => {
    const handleVisible = () => {
      if (document.visibilityState === 'visible') setRefreshKey(k => k + 1)
    }
    document.addEventListener('visibilitychange', handleVisible)
    return () => document.removeEventListener('visibilitychange', handleVisible)
  }, [])

  const practicedToday = useMemo(() => {
    const completed = storage.getCompletedPlanetsToday(user?.id)
    return new Set(completed)
  }, [user?.id, records, refreshKey])

  const polWeakPoints = useMemo(() => {
    const polRecords = records.filter(r => r.subject === 'politics')
    if (polRecords.length < 3) return []
    const diagResult = diagnose(polRecords)
    return getWeakPoints(diagResult).filter(wp => wp.tag && WEAK_TAG_MAP[wp.tag])
  }, [records])

  const TAG_TO_PLANET = {
    '选择题': 'pol_choice', '简答题': 'pol_answer',
    '材料分析题': 'pol_analysis', '实践探究题': 'pol_explore',
  }

  function isPracticed(planet) {
    return [...practicedToday].some(tag => TAG_TO_PLANET[tag] === planet.id)
  }

  function handleWeakTagClick(tag) {
    const mapped = WEAK_TAG_MAP[tag]
    if (mapped) onStartQuiz({ politicsTag: mapped })
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* 顶部栏 */}
      {!hideHeader && (
        <div className="bg-white shadow-sm" style={{ paddingTop: 'env(safe-area-inset-top, 36px)' }}>
          <div className="px-4 pt-3 pb-3 flex items-center gap-3">
            <button onClick={onBack} className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-xl text-lg font-bold text-gray-500 active:bg-gray-200 transition-colors">←</button>
            <h1 className="text-xl font-bold text-gray-800 flex-1">道德与法治 ⚖️</h1>
            {onWrongAnswers && (
              <button
                onClick={onWrongAnswers}
                className="px-3 py-1.5 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-200 active:bg-red-100 active:scale-95 transition-all"
              >
                📝 错题
              </button>
            )}
          </div>
        </div>
      )}

      {/* 弱项建议 */}
      {polWeakPoints.length > 0 && (
        <div className="mx-4 mt-3 p-3 bg-violet-50 border border-violet-100 rounded-xl">
          <div className="text-xs font-semibold text-violet-700 mb-2">💡 道法弱项建议</div>
          <div className="flex flex-wrap gap-1.5">
            {polWeakPoints.map((wp) => (
              <button
                key={wp.tag}
                onClick={() => handleWeakTagClick(wp.tag)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-violet-100 to-violet-200 text-violet-800 active:scale-95 transition-all"
              >
                {wp.tag}
                <span className="text-violet-500 font-bold">{wp.accuracy}%</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 今日任务卡片 */}
      <TodayTaskCard
        task={todayTask}
        userId={user.id}
        onStartTask={handleStartTask}
        onClearAnchor={handleClearAnchor}
        sprintMode={sprintMode}
        wrongCount={wrongCount}
        accentColor="violet"
      />

      {/* 核心星球 — 4列一行排完（跟语文一样紧凑） */}
      <div className="px-4 pt-2 pb-2">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-semibold text-gray-600">⚖️ 学习星球</h2>
          <span className="text-xs text-gray-400">
            今日 {POLITICS_PLANETS.filter(p => isPracticed(p)).length}/{POLITICS_PLANETS.length}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {POLITICS_PLANETS.map((planet) => {
            const done = isPracticed(planet)
            return (
              <button
                key={planet.id}
                onClick={() => onStartQuiz({ politicsTag: planet.id })}
                className={`bg-gradient-to-br ${planet.color} text-white rounded-xl p-2.5 flex flex-col items-center justify-center gap-0.5 shadow-sm active:scale-95 transition-transform relative ${done ? 'ring-2 ring-green-300 opacity-80' : ''}`}
              >
                <span className="text-2xl leading-none">{planet.emoji}</span>
                <span className="text-[11px] font-bold leading-tight">{planet.label}</span>
                {done && <span className="absolute top-0.5 right-0.5 text-[8px] bg-white/30 px-1 py-0.5 rounded-full">✓</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* 更多功能 — 紧跟星球下方 */}
      <div className="px-4 pb-2">
        <p className="text-[11px] text-gray-400 mb-1.5 font-medium">✨ 更多功能</p>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {POLITICS_SPECIAL.map(special => (
            <button
              key={special.id}
              onClick={() => {
                if (special.isSelfTest) onStartQuiz({ selfTest: true, selfTestSubject: 'politics' })
              }}
              className={`flex-shrink-0 w-24 bg-gradient-to-br ${special.color} text-white rounded-xl p-2 flex flex-col items-center justify-center gap-0.5 shadow-sm active:scale-95 transition-transform`}
            >
              <span className="text-xl leading-none">{special.emoji}</span>
              <span className="text-[11px] font-bold leading-tight">{special.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 知识模块分布 — 放最底部不占主视觉 */}
      <div className="px-4 pb-4">
        <div className="flex gap-2 flex-wrap">
          {[
            { label: '宪法与法律', pct: 40, color: '#6366f1' },
            { label: '道德与心理', pct: 25, color: '#8b5cf6' },
            { label: '国情国策', pct: 20, color: '#f59e0b' },
            { label: '社会生活', pct: 10, color: '#10b981' },
            { label: '时事政治', pct: 10, color: '#ef4444' },
          ].map(m => (
            <div key={m.label} className="flex items-center gap-1 text-[10px] text-gray-400">
              <span style={{ width: 5, height: 5, borderRadius: 3, background: m.color, display: 'inline-block' }} />
              {m.label}
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
