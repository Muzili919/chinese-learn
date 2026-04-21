import { useMemo, useState, useEffect } from 'react'
import { storage, calcLevel, calcLevelProgress } from '../utils/storage'
import { diagnose, getWeakPoints } from '../utils/diagnosis'

const POLITICS_PLANETS = [
  { id: 'pol_choice',   label: '基石星球', emoji: '🏛️', color: 'from-blue-400 to-blue-600',    desc: '选择题·基础概念·法律条文' },
  { id: 'pol_answer',   label: '思辨星球', emoji: '💬', color: 'from-violet-400 to-purple-600', desc: '简答题·原因意义·理解归纳' },
  { id: 'pol_analysis', label: '洞察星球', emoji: '📰', color: 'from-amber-400 to-orange-600',  desc: '材料分析·多子问·知识迁移' },
  { id: 'pol_explore',  label: '行动星球', emoji: '🔬', color: 'from-emerald-400 to-teal-600',  desc: '实践探究·倡议书·辩论稿' },
  { id: 'pol_self_test',label: '模拟考场', emoji: '🎯', color: 'from-red-500 to-rose-600',       desc: 'AI组卷·中考比例·能力诊断', isSelfTest: true },
]

// 弱项标签 → politicsTag 映射
const WEAK_TAG_MAP = {
  '选择题': 'pol_choice',
  '简答题': 'pol_answer',
  '材料分析题': 'pol_analysis',
  '实践探究题': 'pol_explore',
}

export default function PoliticsHomePage({ user, onStartQuiz, onBack, hideHeader, onWrongAnswers }) {
  const xp = storage.getXP(user.id)
  const level = calcLevel(xp)
  const levelProgress = calcLevelProgress(xp)
  const streak = storage.getStreak(user.id)
  const records = storage.getRecords(user.id)

  const xpPct = Math.min(100, (levelProgress.currentExp / levelProgress.requiredExp) * 100)

  // 今日正确率
  const todayCorrect = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const todayR = records.filter(r => r.timestamp?.startsWith(today) && r.subject === 'politics')
    if (todayR.length === 0) return null
    return Math.round(todayR.filter(r => r.correct).length / todayR.length * 100)
  }, [records])

  // 总正确率
  const totalAccuracy = useMemo(() => {
    const polR = records.filter(r => r.subject === 'politics')
    return polR.length > 0 ? Math.round(polR.filter(r => r.correct).length / polR.length * 100) : 0
  }, [records])

  // 今日已练哪些星球（只有完成整轮练习才算，答1题不算）
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

  // 道法弱项诊断
  const polWeakPoints = useMemo(() => {
    const polRecords = records.filter(r => r.subject === 'politics')
    if (polRecords.length < 3) return []
    const diagResult = diagnose(polRecords)
    return getWeakPoints(diagResult).filter(wp => wp.tag && WEAK_TAG_MAP[wp.tag])
  }, [records])

  const TAG_TO_PLANET = {
    '选择题': 'pol_choice', '简答题': 'pol_answer',
    '材料分析题': 'pol_analysis', '实践探究题': 'pol_explore',
    '模拟考场': 'pol_self_test',          // SelfTestPage(politics) 写入的 tag
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
      {/* ====== 顶部栏 ====== */}
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

      {/* ====== 弱项建议区域（紫罗兰色调） ====== */}
      {polWeakPoints.length > 0 && (
        <div className="mx-4 mt-3 p-3 bg-violet-50 border border-violet-100 rounded-xl">
          <div className="text-xs font-semibold text-violet-700 mb-2 flex items-center gap-1">
            💡 道法弱项建议
          </div>
          <div className="flex flex-wrap gap-1.5">
            {polWeakPoints.map((wp) => (
              <button
                key={wp.tag}
                onClick={() => handleWeakTagClick(wp.tag)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
                  bg-gradient-to-r from-violet-100 to-violet-200 text-violet-800
                  hover:from-violet-200 hover:to-violet-300 active:scale-95 transition-all"
              >
                {wp.tag}
                <span className="text-violet-500 font-bold">{wp.accuracy}%</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ====== 知识模块分布（保留道法特有功能） ====== */}
      <div className="px-4 pt-3 pb-1">
        <div className="flex gap-2 flex-wrap">
          {[
            { label: '宪法与法律', pct: 40, color: '#6366f1' },
            { label: '道德与心理', pct: 25, color: '#8b5cf6' },
            { label: '国情国策', pct: 20, color: '#f59e0b' },
            { label: '社会生活', pct: 10, color: '#10b981' },
            { label: '时事政治', pct: 10, color: '#ef4444' },
          ].map(m => (
            <div key={m.label} className="flex items-center gap-1 text-[10px] text-gray-500">
              <span style={{ width: 6, height: 6, borderRadius: 3, background: m.color, display: 'inline-block' }} />
              {m.label} {m.pct}%
            </div>
          ))}
        </div>
      </div>

      {/* ====== 星球区 - 网格布局 ====== */}
      <div className="flex-1 px-4 pt-3 pb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-700">⚖️ 道法学习星球</h2>
          <span className="text-xs text-gray-400">
            今日已练 {POLITICS_PLANETS.filter(p => isPracticed(p)).length}/{POLITICS_PLANETS.length}
          </span>
        </div>
        {/* grid-cols-3：前4个占满两行，第5个模拟考场在第三行居中 */}
        <div className="grid grid-cols-3 gap-2.5 justify-items-center">
          {POLITICS_PLANETS.map((planet) => {
            const done = isPracticed(planet)
            return (
              <button
                key={planet.id}
                onClick={() => {
                  if (planet.isSelfTest) onStartQuiz({ selfTest: true, selfTestSubject: 'politics' })
                  else onStartQuiz({ politicsTag: planet.id })
                }}
                className={`bg-gradient-to-br ${planet.color} text-white rounded-xl p-3 flex flex-col items-center justify-center gap-1 shadow-sm active:scale-95 transition-transform w-full min-w-0 ${done ? 'ring-2 ring-green-300 opacity-80' : ''}`}
              >
                <span className="text-3xl">{planet.emoji}</span>
                <span className="text-xs font-bold text-center leading-tight truncate w-full px-1">{planet.label.replace('星球', '')}</span>
                {done && <span className="text-[9px] bg-white/30 px-1.5 py-0.5 rounded-full">✓</span>}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
