import { useMemo, useState } from 'react'
import { storage, calcLevel, calcLevelProgress, exportAll } from '../utils/storage'
import { diagnose, getWeakPoints } from '../utils/diagnosis'

// 能力标签 → 对应星球的 startQuiz 参数
const ABILITY_TO_QUIZ = {
  '字音辨析': { knowledgeTag: '字词' },
  '字形辨析': { knowledgeTag: '字词' },
  '词语含义': { knowledgeTag: '字词' },
  '近反义词': { knowledgeTag: '字词' },
  '词语搭配': { knowledgeTag: '字词' },
  '多音字': { knowledgeTag: '字词' },
  '看拼音写字': { knowledgeTag: '字词' },
  '诗句默写': { knowledgeTag: '古诗词' },
  '作者朝代': { knowledgeTag: '古诗词' },
  '诗句含义': { knowledgeTag: '古诗词' },
  '诗歌赏析': { knowledgeTag: '古诗词' },
  '成语含义': { knowledgeTag: '成语' },
  '成语用法': { knowledgeTag: '成语' },
  '成语辨析': { knowledgeTag: '成语' },
  '成语故事': { knowledgeTag: '成语' },
  '近义成语': { knowledgeTag: '成语' },
  '修辞手法': { knowledgeTag: '句子' },
  '句式转换': { knowledgeTag: '句子' },
  '病句辨析': { knowledgeTag: '句子' },
  '关联词': { knowledgeTag: '句子' },
  '四大名著': { knowledgeTag: '文学常识' },
  '标点符号': { knowledgeTag: '文学常识' },
  '体裁文体': { knowledgeTag: '文学常识' },
  '作家作品': { knowledgeTag: '文学常识' },
  '信息提取': { reading: true },
  '概括主旨': { reading: true },
  '修辞赏析': { reading: true },
  '写作手法': { reading: true },
  '理解感悟': { reading: true },
  '造句练习': { sentencePractice: true },
  '作文写作': { essay: true },
}

const PLANETS = [
  { id: 'all',    label: '全部混合', emoji: '🌌', color: 'from-indigo-500 to-purple-600', desc: '综合筛查·查漏补缺' },
  { id: '字词',   label: '字词星球', emoji: '📚', color: 'from-blue-400 to-blue-600',    desc: '字音·字义·字形' },
  { id: '古诗词', label: '诗词星球', emoji: '🎋', color: 'from-green-400 to-teal-600',   desc: '古诗·填空·赏析' },
  { id: '成语',   label: '成语星球', emoji: '🏮', color: 'from-orange-400 to-red-500',   desc: '含义·用法·辨析' },
  { id: '句子',   label: '句子星球', emoji: '✏️', color: 'from-violet-400 to-purple-600', desc: '修辞·句式·病句·关联词' },
  { id: 'reading',label: '阅读星球', emoji: '📖', color: 'from-emerald-400 to-teal-600', desc: '口诀+短文阅读理解', reading: true },
  { id: '文学常识',label: '文学星球', emoji: '🎭', color: 'from-rose-400 to-pink-600',   desc: '四大名著·标点·文体' },
  { id: 'sentence_practice', label: '造句星球', emoji: '✍️', color: 'from-amber-400 to-orange-500', desc: 'AI即时批改·学会用词' },
  { id: 'essay', label: '作文星球', emoji: '📝', color: 'from-pink-500 to-rose-600', desc: 'AI三维评分·提升写作' },
  { id: 'wrong_answers', label: '错题星球', emoji: '💥', color: 'from-red-500 to-orange-600', desc: '错误→复盘→攻克·闭环学习' },
]

export default function HomePage({ user, onStartQuiz, onReport, onLogout, onOpenMV1 }) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const xp = storage.getXP(user.id)
  const level = calcLevel(xp)
  const levelProgress = calcLevelProgress(xp)
  const streak = storage.getStreak(user.id)
  const records = storage.getRecords(user.id)
  const overdueCount = storage.getOverdueWrongCount(user.id)

  const handleExport = () => {
    // 导出当前用户的本地数据快照为 JSON 文件
    const data = exportAll(user.id)
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chinese-learn-export-${user.name}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const weakPoints = useMemo(() => {
    if (records.length < 5) return []
    const d = diagnose(records)
    return getWeakPoints(d)
  }, [records])

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white px-5 pt-10 pb-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-sm">欢迎回来</p>
            <h1 className="text-2xl font-bold text-gray-800">{user.name} 同学 👋</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onReport}
              className="flex flex-col items-center bg-indigo-50 rounded-xl px-3 py-2"
            >
              <span className="text-xs text-indigo-400 font-medium">报告</span>
              <span className="text-lg">📊</span>
            </button>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex flex-col items-center bg-gray-50 rounded-xl px-3 py-2"
            >
              <span className="text-xs text-gray-400 font-medium">切换</span>
              <span className="text-lg">👤</span>
            </button>
            <button
              onClick={handleExport}
              className="flex flex-col items-center bg-gray-50 rounded-xl px-3 py-2"
            >
              <span className="text-xs text-gray-400 font-medium">导出</span>
              <span className="text-lg">💾</span>
            </button>
          </div>
        </div>

      {/* 退出确认弹窗 */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-6">
            <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-xl">
              <h2 className="text-lg font-bold text-gray-800 mb-2">切换账号？</h2>
              <p className="text-sm text-gray-500 mb-5">退出后可以重新输入昵称登录，本机数据不会丢失。</p>
              <button
                onClick={() => { onLogout(); setShowLogoutConfirm(false) }}
                className="w-full bg-red-500 text-white font-semibold py-3 rounded-xl mb-2"
              >
                确认退出
              </button>
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="w-full text-gray-400 py-2 text-sm"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* XP bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>⭐ Lv.{level}</span>
            <span>{levelProgress.currentExp}/{levelProgress.requiredExp} XP</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-indigo-400 to-purple-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(100, (levelProgress.currentExp / levelProgress.requiredExp) * 100)}%` }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="flex gap-3 mt-4">
          <div className="flex-1 bg-orange-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-orange-500">{streak.count}</div>
            <div className="text-xs text-gray-400">连续天数 🔥</div>
          </div>
          <div className="flex-1 bg-blue-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-blue-500">{records.length}</div>
            <div className="text-xs text-gray-400">总答题数</div>
          </div>
          <div className="flex-1 bg-green-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-green-500">
              {records.length > 0
                ? Math.round((records.filter((r) => r.correct).length / records.length) * 100)
                : 0}%
            </div>
            <div className="text-xs text-gray-400">正确率</div>
          </div>
        </div>
      </div>

      {/* 积压错题提醒 */}
      {overdueCount > 0 && (
        <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-red-700">🚨 {overdueCount} 道错题积压超3天</p>
            <p className="text-xs text-red-400">快去消灭它们！</p>
          </div>
          <button
            onClick={() => onStartQuiz({ wrongReview: true })}
            className="bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-xl"
          >
            立刻攻克
          </button>
        </div>
      )}

      {/* Weak points hint */}
      {weakPoints.length > 0 && (
        <div className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-amber-700 mb-2">💡 建议重点练习（点击直接进入）</p>
          <div className="flex flex-wrap gap-2">
            {weakPoints.map((w) => {
              const opts = ABILITY_TO_QUIZ[w.tag] || {}
              return (
                <button
                  key={w.tag}
                  onClick={() => onStartQuiz({ focusTag: w.tag, ...opts })}
                  className="bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs px-3 py-1.5 rounded-full transition-colors"
                >
                  {w.tag} <span className="text-amber-600">{w.accuracy}%</span> →
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* MV1 演示入口 */}
      {typeof onOpenMV1 === 'function' && (
        <div className="px-4 py-2">
          <button onClick={onOpenMV1} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold py-3 rounded-xl shadow-sm">
            🐉 宠物互动
          </button>
        </div>
      )}
      {/* Planet cards */}
      <div className="flex-1 px-4 pt-5 pb-8">
        <h2 className="text-base font-semibold text-gray-600 mb-3">选择星球开始闯关</h2>
        <div className="flex flex-col gap-3">
          {PLANETS.map((planet) => (
            <button
              key={planet.id}
              onClick={() => {
                if (planet.reading) onStartQuiz({ reading: true })
                else if (planet.id === 'sentence_practice') onStartQuiz({ sentencePractice: true })
                else if (planet.id === 'essay') onStartQuiz({ essay: true })
                else if (planet.id === 'wrong_answers') onStartQuiz({ wrongReview: true })
                else onStartQuiz(planet.id === 'all' ? {} : { knowledgeTag: planet.id })
              }}
              className={`w-full bg-gradient-to-r ${planet.color} text-white rounded-2xl p-4 flex items-center gap-4 shadow-sm active:scale-95 transition-transform`}
            >
              <span className="text-4xl">{planet.emoji}</span>
              <div className="text-left">
                <div className="font-bold text-base">{planet.label}</div>
                <div className="text-sm opacity-80">{planet.desc}</div>
              </div>
              <span className="ml-auto text-2xl opacity-60">→</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
