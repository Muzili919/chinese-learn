import { useMemo } from 'react'
import { storage, calcLevel, calcLevelProgress } from '../utils/storage'
import { diagnose, getWeakPoints } from '../utils/diagnosis'

const EN_PLANETS = [
  { id: 'en_association', label: '联想星球', emoji: '🌐', color: 'from-emerald-400 to-teal-600',   desc: '词根树·联想记忆·举一反三' },
  { id: 'en_vocab',   label: '词汇星球', emoji: '📝', color: 'from-sky-400 to-blue-600',     desc: '拼写·翻译·辨音' },
  { id: 'en_listen',  label: '听力星球', emoji: '🎧', color: 'from-violet-400 to-purple-600', desc: 'TTS听音·判断·选择' },
  { id: 'en_grammar', label: '语法星球', emoji: '📐', color: 'from-green-400 to-teal-600',    desc: '时态·句型·主谓一致' },
  { id: 'en_reading', label: '阅读星球', emoji: '📚', color: 'from-orange-400 to-amber-500',  desc: '短文阅读·信息提取' },
  { id: 'en_writing', label: '写作星球', emoji: '✏️', color: 'from-pink-400 to-rose-600',    desc: 'AI批改·句子作文' },
  { id: 'en_dictation', label: '听写星球', emoji: '✍️', color: 'from-cyan-400 to-blue-500', desc: 'TTS听写·拍照批改·词库管理', isDictation: true },
  { id: 'en_self_test', label: '自测星球', emoji: '📝', color: 'from-blue-500 to-indigo-600', desc: 'AI出卷·小升初难度·查漏补缺', isSelfTest: true },
]

// 英语弱项 tag -> englishTag 映射
const EN_WEAK_TAG_MAP = {
  '英语词汇': { englishTag: 'en_vocab' },
  '英语语法': { englishTag: 'en_grammar' },
  '英语阅读': { englishTag: 'en_reading' },
  '英语写作': { englishTag: 'en_writing' },
  '英语听力': { englishTag: 'en_listen' },
}

export default function EnglishHomePage({ user, grade = 'primary', onStartQuiz, onBack }) {
  const xp = storage.getXP(user.id)
  const level = calcLevel(xp)
  const levelProgress = calcLevelProgress(xp)
  const streak = storage.getStreak(user.id)
  const records = storage.getRecords(user.id)

  const xpPct = Math.min(100, (levelProgress.currentExp / levelProgress.requiredExp) * 100)

  // 今日正确率
  const todayCorrect = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const todayR = records.filter(r => r.timestamp?.startsWith(today))
    if (todayR.length === 0) return null
    return Math.round(todayR.filter(r => r.correct).length / todayR.length * 100)
  }, [records])

  // 总正确率
  const totalAccuracy = records.length > 0
    ? Math.round(records.filter(r => r.correct).length / records.length * 100)
    : 0

  // 今日已练哪些英语星球（用于标记已练状态）
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

  // 英语弱项建议（筛选 subject === 'english' 的记录）
  const enWeakPoints = useMemo(() => {
    const enRecords = records.filter(r => r.subject === 'english')
    if (enRecords.length < 3) return []
    const d = diagnose(enRecords)
    return getWeakPoints(d).filter(w => EN_WEAK_TAG_MAP[w.tag])
  }, [records])

  // 核心闯关6个 + 特殊功能2个
  const corePlanets = EN_PLANETS.slice(0, 6)
  const specialPlanets = EN_PLANETS.slice(6)

  return (
    <div className="min-h-screen flex flex-col">
      {/* ===== 顶部栏 ===== */}
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
            <h1 className="text-xl font-bold text-gray-800">英语学习中心 🌎</h1>
            <p className="text-xs text-gray-400">
              {streak.count > 0 ? `已连续学习 ${streak.count} 天 🔥` : '今天开始第一天打卡吧！'}
            </p>
          </div>
        </div>

        {/* 三个核心数据卡：连胜(橙) / 等级(靛蓝) / 正确率(绿) — 与语文统一 */}
        <div className="flex gap-2 px-4 pb-3 mt-2">
          {/* 连胜卡 */}
          <div className="flex-1 rounded-2xl p-3 text-center"
            style={{ background: 'linear-gradient(135deg, #fff7ed, #fed7aa)' }}>
            <div className="text-2xl font-extrabold text-orange-500">{streak.count}</div>
            <div className="text-[10px] text-orange-400 font-medium mt-0.5">连续天数 🔥</div>
          </div>

          {/* 等级+经验卡 */}
          <div className="flex-1 rounded-2xl p-3"
            style={{ background: 'linear-gradient(135deg, #f5f3ff, #ddd6fe)' }}>
            <div className="flex items-baseline gap-1 justify-center">
              <span className="text-2xl font-extrabold text-indigo-600">Lv.{level}</span>
            </div>
            <div className="w-full bg-indigo-100 rounded-full h-1.5 mt-1.5">
              <div
                className="bg-gradient-to-r from-indigo-400 to-purple-500 h-1.5 rounded-full transition-all"
                style={{ width: `${xpPct}%` }}
              />
            </div>
            <div className="text-[9px] text-indigo-400 text-center mt-0.5">
              {levelProgress.currentExp}/{levelProgress.requiredExp} XP
            </div>
          </div>

          {/* 正确率卡 */}
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

      {/* ===== 弱项建议区域（天蓝色调，与语文琥珀色区分）===== */}
      {enWeakPoints.length > 0 ? (
        <div className="mx-4 mt-4 bg-sky-50 border border-sky-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-sky-700 mb-2">💡 建议重点练习（点击直接进入）</p>
          <div className="flex flex-wrap gap-2">
            {enWeakPoints.map((w) => {
              const opts = EN_WEAK_TAG_MAP[w.tag] || {}
              return (
                <button
                  key={w.tag}
                  onClick={() => onStartQuiz({ englishTag: opts.englishTag, grade })}
                  className="bg-sky-100 hover:bg-sky-200 text-sky-800 text-xs px-3 py-1.5 rounded-full transition-colors"
                >
                  {w.tag} <span className="text-sky-600">{w.accuracy}%</span> →
                </button>
              )
            })}
          </div>
        </div>
      ) : records.filter(r => r.subject === 'english').length === 0 ? (
        <div className="mx-4 mt-4 bg-sky-50 border border-sky-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-sky-700 mb-1">💡 还没有英语练习数据</p>
          <p className="text-xs text-sky-500">先做几道英语题，我会分析你的弱项哦！</p>
        </div>
      ) : null}

      {/* ===== 星球卡片区 ===== */}
      <div className="flex-1 px-4 pt-4 pb-8">
        {/* 标题 */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-600">🌟 英语学习星球</h2>
          <span className="text-xs text-gray-400">
            今日已练 {corePlanets.filter(p => isPracticed(p)).length}/{corePlanets.length} 个星球
          </span>
        </div>

        {/* 核心6个 - 2×3 网格布局 */}
        <div className="grid grid-cols-3 gap-2.5 mb-3">
          {corePlanets.map((planet) => {
            const done = isPracticed(planet)
            return (
              <button
                key={planet.id}
                onClick={() => onStartQuiz({ englishTag: planet.id, grade })}
                className={`bg-gradient-to-br ${planet.color} text-white rounded-xl p-3 flex flex-col items-center justify-center gap-1 shadow-sm active:scale-95 transition-transform relative ${done ? 'ring-2 ring-green-300 opacity-80' : ''}`}
              >
                <span className="text-3xl leading-none">{planet.emoji}</span>
                <span className="text-xs font-bold leading-tight">{planet.label.replace('星球', '')}</span>
                {done && (
                  <span className="absolute top-1 right-1 text-[9px] bg-white/30 text-white font-semibold px-1.5 py-0.5 rounded-full">
                    ✓
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* 特殊功能2个 - 横向滚动 */}
        <div>
          <p className="text-[11px] text-gray-400 mb-1.5 font-medium">✨ 更多功能</p>
          <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
            {specialPlanets.map((planet) => {
              const done = isPracticed(planet)
              return (
                <button
                  key={planet.id}
                  onClick={() => {
                    if (planet.isDictation) onStartQuiz({ dictation: true, dictationSubject: 'english' })
                    else if (planet.isSelfTest) onStartQuiz({ selfTest: true, selfTestSubject: 'english' })
                    else onStartQuiz({ englishTag: planet.id, grade })
                  }}
                  className={`flex-shrink-0 w-28 bg-gradient-to-br ${planet.color} text-white rounded-xl p-2.5 flex flex-col items-center justify-center gap-1 shadow-sm active:scale-95 transition-transform relative ${done ? 'ring-2 ring-green-300 opacity-80' : ''}`}
                >
                  <span className="text-2xl leading-none">{planet.emoji}</span>
                  <span className="text-xs font-bold leading-tight">{planet.label.replace('星球', '')}</span>
                  {done && (
                    <span className="absolute top-1 right-1 text-[8px] bg-white/30 text-white font-semibold px-1 py-0.5 rounded-full">
                      ✓
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* 隐藏滚动条样式 */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
