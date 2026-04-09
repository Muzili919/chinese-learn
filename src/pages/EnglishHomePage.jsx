import { useMemo } from 'react'
import { storage, calcLevel, calcLevelProgress } from '../utils/storage'

const EN_PLANETS = [
  { id: 'en_vocab',   label: '词汇星球', emoji: '🔤', color: 'from-sky-400 to-blue-600',     desc: '拼写·翻译·辨音' },
  { id: 'en_listen',  label: '听力星球', emoji: '🎧', color: 'from-violet-400 to-purple-600', desc: 'TTS听音·判断·选择' },
  { id: 'en_grammar', label: '语法星球', emoji: '📐', color: 'from-green-400 to-teal-600',    desc: '时态·句型·主谓一致' },
  { id: 'en_reading', label: '阅读星球', emoji: '📚', color: 'from-orange-400 to-amber-500',  desc: '短文阅读·信息提取' },
  { id: 'en_writing', label: '写作星球', emoji: '✏️', color: 'from-pink-400 to-rose-600',    desc: 'AI批改·句子作文' },
]

export default function EnglishHomePage({ user, onStartQuiz, onBack }) {
  const xp = storage.getXP(user.id)
  const level = calcLevel(xp)
  const levelProgress = calcLevelProgress(xp)
  const streak = storage.getStreak(user.id)
  const records = storage.getRecords(user.id)

  const xpPct = Math.min(100, (levelProgress.currentExp / levelProgress.requiredExp) * 100)

  const todayCorrect = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const todayR = records.filter(r => r.timestamp?.startsWith(today))
    if (todayR.length === 0) return null
    return Math.round(todayR.filter(r => r.correct).length / todayR.length * 100)
  }, [records])

  const totalAccuracy = records.length > 0
    ? Math.round(records.filter(r => r.correct).length / records.length * 100)
    : 0

  // 今日已练哪些英语星球
  const practicedToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const set = new Set()
    records
      .filter(r => r.timestamp?.startsWith(today) && r.subject === 'english')
      .forEach(r => { if (r.knowledge_tag) set.add(r.knowledge_tag) })
    return set
  }, [records])

  // knowledge_tag -> planet id 映射
  const TAG_TO_PLANET = {
    '英语词汇': 'en_vocab',
    '英语听力': 'en_listen',
    '英语语法': 'en_grammar',
    '英语阅读': 'en_reading',
    '英语写作': 'en_writing',
  }

  function isPracticed(planet) {
    const tag = Object.entries(TAG_TO_PLANET).find(([, pid]) => pid === planet.id)?.[0]
    return tag ? practicedToday.has(tag) : false
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* 顶部栏 */}
      <div className="bg-white shadow-sm" style={{ paddingTop: 'env(safe-area-inset-top, 36px)' }}>
        {/* 返回 + 标题 */}
        <div className="flex items-center gap-3 px-4 pt-3 pb-2">
          <button
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-xl text-lg font-bold text-gray-500 active:bg-gray-200 transition-colors"
          >
            ←
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-800">英语 🌎</h1>
            <p className="text-xs text-gray-400">
              {streak.count > 0 ? `已连续学习 ${streak.count} 天 🔥` : '今天开始第一天打卡吧！'}
            </p>
          </div>
        </div>

        {/* 数据卡片 */}
        <div className="flex gap-2 px-4 pb-3 mt-1">
          {/* 等级+经验 */}
          <div className="flex-1 rounded-2xl p-3"
            style={{ background: 'linear-gradient(135deg, #f0f9ff, #bae6fd)' }}>
            <div className="flex items-baseline gap-1 justify-center">
              <span className="text-2xl font-extrabold text-sky-600">Lv.{level}</span>
            </div>
            <div className="w-full bg-sky-100 rounded-full h-1.5 mt-1.5">
              <div
                className="bg-gradient-to-r from-sky-400 to-blue-500 h-1.5 rounded-full transition-all"
                style={{ width: `${xpPct}%` }}
              />
            </div>
            <div className="text-[9px] text-sky-400 text-center mt-0.5">
              {levelProgress.currentExp}/{levelProgress.requiredExp} XP
            </div>
          </div>

          {/* 连续天数 */}
          <div className="flex-1 rounded-2xl p-3 text-center"
            style={{ background: 'linear-gradient(135deg, #fff7ed, #fed7aa)' }}>
            <div className="text-2xl font-extrabold text-orange-500">{streak.count}</div>
            <div className="text-[10px] text-orange-400 font-medium mt-0.5">连续天数 🔥</div>
          </div>

          {/* 正确率 */}
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

      {/* 星球卡片列表 */}
      <div className="flex-1 px-4 pt-4 pb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-600">选择星球开始闯关</h2>
          <span className="text-xs text-gray-400">
            今日已练 {EN_PLANETS.filter(p => isPracticed(p)).length}/{EN_PLANETS.length} 个星球
          </span>
        </div>
        <div className="flex flex-col gap-3">
          {EN_PLANETS.map((planet) => {
            const done = isPracticed(planet)
            return (
              <button
                key={planet.id}
                onClick={() => onStartQuiz({ englishTag: planet.id })}
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
