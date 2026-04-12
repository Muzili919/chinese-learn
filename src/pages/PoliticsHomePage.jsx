import { useMemo } from 'react'
import { storage, calcLevel, calcLevelProgress } from '../utils/storage'

const POLITICS_PLANETS = [
  { id: 'pol_choice',   label: '基石星球', emoji: '🏛️', color: 'from-blue-400 to-blue-600',    desc: '选择题·基础概念·法律条文' },
  { id: 'pol_answer',   label: '思辨星球', emoji: '💬', color: 'from-violet-400 to-purple-600', desc: '简答题·原因意义·理解归纳' },
  { id: 'pol_analysis', label: '洞察星球', emoji: '📰', color: 'from-amber-400 to-orange-600',  desc: '材料分析·多子问·知识迁移' },
  { id: 'pol_explore',  label: '行动星球', emoji: '🔬', color: 'from-emerald-400 to-teal-600',  desc: '实践探究·倡议书·辩论稿' },
  { id: 'pol_self_test',label: '模拟考场', emoji: '🎯', color: 'from-red-500 to-rose-600',       desc: 'AI组卷·中考比例·能力诊断', isSelfTest: true },
]

export default function PoliticsHomePage({ user, onStartQuiz, onBack }) {
  const xp = storage.getXP(user.id)
  const level = calcLevel(xp)
  const levelProgress = calcLevelProgress(xp)
  const streak = storage.getStreak(user.id)
  const records = storage.getRecords(user.id)

  const xpPct = Math.min(100, (levelProgress.currentExp / levelProgress.requiredExp) * 100)

  const todayCorrect = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const todayR = records.filter(r => r.timestamp?.startsWith(today) && r.subject === 'politics')
    if (todayR.length === 0) return null
    return Math.round(todayR.filter(r => r.correct).length / todayR.length * 100)
  }, [records])

  const totalAccuracy = useMemo(() => {
    const polR = records.filter(r => r.subject === 'politics')
    return polR.length > 0 ? Math.round(polR.filter(r => r.correct).length / polR.length * 100) : 0
  }, [records])

  // 今日已练哪些星球
  const practicedToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const set = new Set()
    records
      .filter(r => r.timestamp?.startsWith(today) && r.subject === 'politics')
      .forEach(r => { if (r.ability_tag) set.add(r.ability_tag) })
    return set
  }, [records])

  const TAG_TO_PLANET = {
    '选择题': 'pol_choice', '简答题': 'pol_answer',
    '材料分析题': 'pol_analysis', '实践探究题': 'pol_explore',
  }

  function isPracticed(planet) {
    return [...practicedToday].some(tag => TAG_TO_PLANET[tag] === planet.id)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* 顶部栏 */}
      <div className="bg-white shadow-sm" style={{ paddingTop: 'env(safe-area-inset-top, 36px)' }}>
        <div className="flex items-center gap-3 px-4 pt-3 pb-2">
          <button
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-xl text-lg font-bold text-gray-500 active:bg-gray-200 transition-colors"
          >←</button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-800">道德与法治 ⚖️</h1>
            <p className="text-xs text-gray-400">
              {streak.count > 0 ? `已连续学习 ${streak.count} 天 🔥` : '今天开始第一天打卡吧！'}
            </p>
          </div>
        </div>

        {/* 数据卡片 */}
        <div className="flex gap-2 px-4 pb-3 mt-1">
          <div className="flex-1 rounded-2xl p-3"
            style={{ background: 'linear-gradient(135deg, #f5f3ff, #ddd6fe)' }}>
            <div className="flex items-baseline gap-1 justify-center">
              <span className="text-2xl font-extrabold text-violet-600">Lv.{level}</span>
            </div>
            <div className="w-full bg-violet-100 rounded-full h-1.5 mt-1.5">
              <div
                className="bg-gradient-to-r from-violet-400 to-purple-500 h-1.5 rounded-full transition-all"
                style={{ width: `${xpPct}%` }}
              />
            </div>
            <div className="text-[9px] text-violet-400 text-center mt-0.5">
              {levelProgress.currentExp}/{levelProgress.requiredExp} XP
            </div>
          </div>

          <div className="flex-1 rounded-2xl p-3 text-center"
            style={{ background: 'linear-gradient(135deg, #fff7ed, #fed7aa)' }}>
            <div className="text-2xl font-extrabold text-orange-500">{streak.count}</div>
            <div className="text-[10px] text-orange-400 font-medium mt-0.5">连续天数 🔥</div>
          </div>

          <div className="flex-1 rounded-2xl p-3 text-center"
            style={{ background: 'linear-gradient(135deg, #f0fdf4, #bbf7d0)' }}>
            <div className="text-2xl font-extrabold text-green-600">
              {todayCorrect !== null ? `${todayCorrect}%` : `${totalAccuracy}%`}
            </div>
            <div className="text-[10px] text-green-500 font-medium mt-0.5">
              {todayCorrect !== null ? '今日正确率' : '总正确率'} ✅
            </div>
          </div>
        </div>
      </div>

      {/* 知识模块分布 */}
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

      {/* 星球卡片列表 */}
      <div className="flex-1 px-4 pt-3 pb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-600">选择星球开始闯关</h2>
          <span className="text-xs text-gray-400">
            今日已练 {POLITICS_PLANETS.filter(p => isPracticed(p)).length}/{POLITICS_PLANETS.length} 个星球
          </span>
        </div>
        <div className="flex flex-col gap-3">
          {POLITICS_PLANETS.map((planet) => {
            const done = isPracticed(planet)
            return (
              <button
                key={planet.id}
                onClick={() => {
                  if (planet.isSelfTest) onStartQuiz({ selfTest: true, selfTestSubject: 'politics' })
                  else onStartQuiz({ politicsTag: planet.id })
                }}
                className={`w-full bg-gradient-to-r ${planet.color} text-white rounded-2xl p-4 flex items-center gap-4 shadow-sm active:scale-95 transition-transform`}
              >
                <span className="text-4xl">{planet.emoji}</span>
                <div className="text-left flex-1">
                  <div className="font-bold text-base flex items-center gap-2">
                    {planet.label}
                    {done && (
                      <span className="text-xs bg-white/30 text-white font-semibold px-2 py-0.5 rounded-full">
                        ✓今日已练
                      </span>
                    )}
                  </div>
                  <div className="text-sm opacity-80">{planet.desc}</div>
                </div>
                <span className="text-2xl opacity-60">→</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
