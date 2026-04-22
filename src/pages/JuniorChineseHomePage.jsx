import { useMemo, useState, useEffect } from 'react'
import { storage } from '../utils/storage'
import { diagnose, getWeakPoints } from '../utils/diagnosis'
import { getRecommendedTask, clearAnchor } from '../utils/recommendation'
import TodayTaskCard from '../components/TodayTaskCard'

const JC_PLANETS = [
  { id: 'jc_basic',     label: '基础',     emoji: '📚', color: 'from-blue-400 to-blue-600',   desc: '字音·字形·词语·病句·标点',     tag: '语言基础' },
  { id: 'jc_poetry',    label: '古诗文',   emoji: '🎋', color: 'from-emerald-400 to-teal-600', desc: '默写·赏析·常识',               tag: '古诗文' },
  { id: 'jc_classical', label: '文言文',   emoji: '🏛️', color: 'from-amber-400 to-orange-600', desc: '实词·虚词·翻译·阅读',          tag: '文言文' },
  { id: 'jc_reading',   label: '阅读',     emoji: '📖', color: 'from-violet-400 to-purple-600', desc: '记叙文·说明文·议论文',         tag: '现代文阅读' },
  { id: 'jc_novel',     label: '名著',     emoji: '📕', color: 'from-rose-400 to-pink-600',     desc: '12部必读名著·人物·情节',       tag: '名著阅读' },
  { id: 'jc_expression',label: '表达',     emoji: '✏️', color: 'from-cyan-400 to-sky-600',      desc: '仿写·得体·概括·图文',          tag: '语言运用' },
  { id: 'jc_writing',   label: '作文',     emoji: '✍️', color: 'from-indigo-400 to-purple-600',  desc: 'AI批改·记叙文·议论文',         tag: '写作' },
]

const JC_SPECIAL = [
  { id: 'jc_dictation', label: '听写', emoji: '🎧', color: 'from-teal-400 to-cyan-600', desc: 'TTS听写·古诗文默写', isDictation: true },
  { id: 'jc_self_test', label: '自测', emoji: '🧪', color: 'from-violet-500 to-indigo-700', desc: 'AI出卷·中考难度·查漏补缺', isSelfTest: true },
  { id: 'jc_lightning', label: '闪电', emoji: '⚡', color: 'from-yellow-400 to-orange-500', desc: '5题快测·约30秒', isLightning: true },
]

const JC_WEAK_TAG_MAP = {
  '字音辨析': { planetId: 'jc_basic' },
  '字形辨析': { planetId: 'jc_basic' },
  '词语运用': { planetId: 'jc_basic' },
  '病句辨析': { planetId: 'jc_basic' },
  '标点符号': { planetId: 'jc_basic' },
  '句子排序': { planetId: 'jc_basic' },
  '文学常识': { planetId: 'jc_basic' },
  '古诗文默写': { planetId: 'jc_poetry' },
  '古诗词赏析': { planetId: 'jc_poetry' },
  '文言文翻译': { planetId: 'jc_poetry' },
  '古诗文常识': { planetId: 'jc_poetry' },
  '实词解释': { planetId: 'jc_classical' },
  '虚词用法': { planetId: 'jc_classical' },
  '句式翻译': { planetId: 'jc_classical' },
  '文言文阅读': { planetId: 'jc_classical' },
  '名著阅读': { planetId: 'jc_novel' },
  '仿写句子': { planetId: 'jc_expression' },
  '语言得体': { planetId: 'jc_expression' },
  '信息概括': { planetId: 'jc_expression' },
  '图文转换': { planetId: 'jc_expression' },
  '综合性学习': { planetId: 'jc_expression' },
}

const TAG_TO_PLANET = {
  '语言基础': 'jc_basic',
  '字音辨析': 'jc_basic', '字形辨析': 'jc_basic', '词语运用': 'jc_basic',
  '病句辨析': 'jc_basic', '标点符号': 'jc_basic', '句子排序': 'jc_basic', '文学常识': 'jc_basic',
  '古诗文': 'jc_poetry',
  '古诗文默写': 'jc_poetry', '古诗词赏析': 'jc_poetry', '文言文翻译': 'jc_poetry', '古诗文常识': 'jc_poetry',
  '文言文': 'jc_classical',
  '实词解释': 'jc_classical', '虚词用法': 'jc_classical', '句式翻译': 'jc_classical', '文言文阅读': 'jc_classical',
  '现代文阅读': 'jc_reading',
  '名著阅读': 'jc_novel',
  '语言运用': 'jc_expression',
  '仿写句子': 'jc_expression', '语言得体': 'jc_expression', '信息概括': 'jc_expression',
  '图文转换': 'jc_expression', '综合性学习': 'jc_expression',
  '写作': 'jc_writing',
}

export default function JuniorChineseHomePage({ user, grade, onStartQuiz }) {
  const records = storage.getRecords(user.id)

  const [taskRefresh, setTaskRefresh] = useState(0)
  const [sprintMode, setSprintMode] = useState(false)

  const todayTask = useMemo(() => {
    return getRecommendedTask(user.id, 'chinese')
  }, [user.id, records, taskRefresh])

  const wrongCount = useMemo(() => {
    const allWrong = storage.getWrongCardIds(user.id)
    const jcRecords = records.filter(r => r.subject === 'chinese' || r.subject === 'chinese_junior')
    let count = 0
    for (const id of allWrong) {
      if (jcRecords.some(r => r.card_id === id)) count++
    }
    return count
  }, [user.id, records])

  const JC_TAG_TO_QUIZ = {
    '字音辨析': { juniorChineseTag: 'jc_basic' },
    '字形辨析': { juniorChineseTag: 'jc_basic' },
    '词语运用': { juniorChineseTag: 'jc_basic' },
    '病句辨析': { juniorChineseTag: 'jc_basic' },
    '标点符号': { juniorChineseTag: 'jc_basic' },
    '古诗文默写': { juniorChineseTag: 'jc_poetry' },
    '古诗词赏析': { juniorChineseTag: 'jc_poetry' },
    '实词解释': { juniorChineseTag: 'jc_classical' },
    '虚词用法': { juniorChineseTag: 'jc_classical' },
    '名著阅读': { juniorChineseTag: 'jc_novel' },
    '仿写句子': { juniorChineseTag: 'jc_expression' },
    '信息概括': { juniorChineseTag: 'jc_expression' },
  }

  const handleStartTask = ({ type, tag, knowledge, maxQuestions }) => {
    const opts = JC_TAG_TO_QUIZ[tag] || JC_TAG_TO_QUIZ[knowledge] || {}
    switch (type) {
      case 'srs':
        onStartQuiz({ juniorChineseTag: 'jc_basic', grade: 'junior', srsFirst: true, maxQuestions: maxQuestions || 3 })
        break
      case 'anchor': case 'optional':
        onStartQuiz({ ...opts, grade: 'junior', maxQuestions: maxQuestions || 3 })
        break
      case 'quick': case 'full': {
        const anchorOpts = JC_TAG_TO_QUIZ[todayTask.anchor?.tag] || { juniorChineseTag: 'jc_basic' }
        onStartQuiz({ ...anchorOpts, grade: 'junior', maxQuestions })
        break
      }
      case 'wrong_review':
        onStartQuiz({ wrongReview: true, subject: 'chinese_junior' })
        break
      default:
        onStartQuiz({ juniorChineseTag: 'jc_basic', grade: 'junior' })
    }
  }

  const handleClearAnchor = () => {
    clearAnchor(user.id)
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

  function isPracticed(planet) {
    return Object.entries(TAG_TO_PLANET).some(([tag, pid]) => pid === planet.id && practicedToday.has(tag))
  }

  const jcRecords = useMemo(
    () => records.filter(r => r.subject === 'chinese_junior'),
    [records]
  )

  const todayCorrect = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const todayR = jcRecords.filter(r => r.timestamp?.startsWith(today))
    if (!todayR.length) return null
    return Math.round(todayR.filter(r => r.correct).length / todayR.length * 100)
  }, [jcRecords])

  const totalAnswered = jcRecords.length
  const totalCorrect = jcRecords.filter(r => r.correct).length
  const totalAccuracy = totalAnswered > 0 ? Math.round(totalCorrect / totalAnswered * 100) : null

  const weakPoints = useMemo(() => {
    if (jcRecords.length < 3) return []
    const d = diagnose(jcRecords)
    return getWeakPoints(d).filter(w => JC_WEAK_TAG_MAP[w.tag])
  }, [jcRecords])

  function handlePlanetClick(planet) {
    if (planet.id === 'jc_reading') {
      onStartQuiz({ reading: true, subject: 'chinese_junior' })
    } else if (planet.id === 'jc_writing') {
      onStartQuiz({ essay: true, subject: 'chinese_junior' })
    } else {
      onStartQuiz({ juniorChineseTag: planet.id, grade: 'junior' })
    }
  }

  function handleSpecialClick(planet) {
    if (planet.isDictation) onStartQuiz({ dictation: true, dictationSubject: 'chinese' })
    else if (planet.isSelfTest) onStartQuiz({ selfTest: true, selfTestSubject: 'chinese' })
    else if (planet.isLightning) onStartQuiz({ lightningQuiz: true, juniorChineseTag: 'jc_lightning' })
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* 弱项建议 */}
      {weakPoints.length > 0 ? (
        <div className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-amber-700 mb-2">💡 建议重点练习（点击直接进入）</p>
          <div className="flex flex-wrap gap-2">
            {weakPoints.slice(0, 4).map((w) => {
              const map = JC_WEAK_TAG_MAP[w.tag] || {}
              return (
                <button
                  key={w.tag}
                  onClick={() => onStartQuiz({ juniorChineseTag: map.planetId, grade: 'junior' })}
                  className="bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs px-3 py-1.5 rounded-full transition-colors"
                >
                  {w.tag} <span className="text-amber-600">{w.accuracy}%</span> →
                </button>
              )
            })}
          </div>
        </div>
      ) : totalAnswered === 0 ? (
        <div className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-amber-700 mb-1">💡 初中语文 · 中考备考</p>
          <p className="text-xs text-amber-500">涵盖初一~初三核心考点，先做几道题试试吧！</p>
        </div>
      ) : null}

      {/* 今日任务卡片 */}
      <TodayTaskCard
        task={todayTask}
        userId={user.id}
        onStartTask={handleStartTask}
        onClearAnchor={handleClearAnchor}
        sprintMode={sprintMode}
        wrongCount={wrongCount}
        accentColor="purple"
      />

      {/* 星球卡片 */}
      <div className="flex-1 px-4 pt-4 pb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-600">📖 语文学习星球</h2>
          <span className="text-xs text-gray-400">
            今日已练 {JC_PLANETS.filter(p => isPracticed(p)).length}/{JC_PLANETS.length} 个星球
          </span>
        </div>

        {/* 核心7个星球 - 4+3 网格 */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {JC_PLANETS.map((planet) => {
            const done = isPracticed(planet)
            return (
              <button
                key={planet.id}
                onClick={() => handlePlanetClick(planet)}
                className={`bg-gradient-to-br ${planet.color} text-white rounded-xl p-3 flex flex-col items-center justify-center gap-1 shadow-sm active:scale-95 transition-transform relative ${done ? 'ring-2 ring-green-300 opacity-80' : ''}`}
              >
                <span className="text-3xl leading-none">{planet.emoji}</span>
                <span className="text-xs font-bold leading-tight">{planet.label}</span>
                {done && (
                  <span className="absolute top-1 right-1 text-[9px] bg-white/30 text-white font-semibold px-1.5 py-0.5 rounded-full">✓</span>
                )}
              </button>
            )
          })}
        </div>

        {/* 特殊功能 - 横向滚动 */}
        <div>
          <p className="text-[11px] text-gray-400 mb-1.5 font-medium">✨ 更多功能</p>
          <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
            {JC_SPECIAL.map((planet) => {
              const done = isPracticed(planet)
              return (
                <button
                  key={planet.id}
                  onClick={() => handleSpecialClick(planet)}
                  className={`flex-shrink-0 w-28 bg-gradient-to-br ${planet.color} text-white rounded-xl p-2.5 flex flex-col items-center justify-center gap-1 shadow-sm active:scale-95 transition-transform relative ${done ? 'ring-2 ring-green-300 opacity-80' : ''}`}
                >
                  <span className="text-2xl leading-none">{planet.emoji}</span>
                  <span className="text-xs font-bold leading-tight">{planet.label}</span>
                  {done && (
                    <span className="absolute top-1 right-1 text-[8px] bg-white/30 text-white font-semibold px-1 py-0.5 rounded-full">✓</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* 学习建议 */}
        {totalAnswered === 0 && (
          <div className="mt-4 bg-blue-50 border border-blue-100 rounded-2xl p-4">
            <p className="text-sm font-bold text-blue-700 mb-1">💡 备考建议</p>
            <p className="text-xs text-blue-600">
              先从「基础」星球开始，巩固字音字形和词语运用！每天练习 10 题，配合古诗文默写效果更佳。
            </p>
          </div>
        )}
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
