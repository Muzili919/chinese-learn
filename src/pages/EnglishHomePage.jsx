import { useMemo, useState, useEffect } from 'react'
import { storage, calcLevel, calcLevelProgress } from '../utils/storage'
import { diagnose, getWeakPoints } from '../utils/diagnosis'
import { getRecommendedTask, clearAnchor } from '../utils/recommendation'
import TodayTaskCard from '../components/TodayTaskCard'

const EN_PLANETS = [
  // ★ 核心8个学习星球（含完形填空+闪电自测）
  { id: 'en_association', label: '联想星球', emoji: '🌐', color: 'from-emerald-400 to-teal-600',   desc: '词根树·联想记忆·举一反三' },
  { id: 'en_vocab',   label: '词汇星球', emoji: '📝', color: 'from-sky-400 to-blue-600',     desc: '拼写·翻译·辨音' },
  { id: 'en_listen',  label: '听力星球', emoji: '🎧', color: 'from-violet-400 to-purple-600', desc: 'TTS听音·判断·选择' },
  { id: 'en_grammar', label: '语法星球', emoji: '📐', color: 'from-green-400 to-teal-600',    desc: '时态·句型·主谓一致' },
  { id: 'en_reading', label: '阅读星球', emoji: '📚', color: 'from-orange-400 to-amber-500',  desc: '短文阅读·信息提取' },
  { id: 'en_writing', label: '写作星球', emoji: '✏️', color: 'from-pink-400 to-rose-600',    desc: 'AI批改·句子作文' },
  { id: 'en_cloze',   label: '完形填空', emoji: '📝', color: 'from-indigo-400 to-blue-600',  desc: '10空选择·上下文推理·语法综合' },
  { id: 'en_lightning',label: '闪电测验', emoji: '⚡', color: 'from-yellow-400 to-orange-500', desc: '5题快测·纯回忆·约30秒', isLightning: true },
  // 更多功能（听写、自测等）
  { id: 'en_dictation', label: '听写星球', emoji: '✍️', color: 'from-cyan-400 to-blue-500', desc: 'TTS听写·拍照批改·词库管理', isDictation: true },
  { id: 'en_self_test', label: '自测星球', emoji: '📝', color: 'from-blue-500 to-indigo-600', desc: 'AI出卷·小升初难度·查漏补缺', isSelfTest: true },
]

// 英语弱项 tag -> englishTag 映射
const EN_WEAK_TAG_MAP = {
  '英语词汇': { englishTag: 'en_vocab' },
  '英语语法': { englishTag: 'en_grammar' },
  '英语阅读': { englishTag: 'en_reading' },
  '英语写作': { englishTag: 'en_writing' },
  '完形填空': { englishTag: 'en_cloze' },
  '英语听力': { englishTag: 'en_listen' },
}

export default function EnglishHomePage({ user, grade = 'primary', onStartQuiz, onBack, hideHeader }) {
  const xp = storage.getXP(user.id)
  const level = calcLevel(xp)
  const levelProgress = calcLevelProgress(xp)
  const streak = storage.getStreak(user.id)
  const records = storage.getRecords(user.id)

  const xpPct = Math.min(100, (levelProgress.currentExp / levelProgress.requiredExp) * 100)

  const [taskRefresh, setTaskRefresh] = useState(0)
  const [sprintMode, setSprintMode] = useState(false)

  const todayTask = useMemo(() => {
    return getRecommendedTask(user.id, 'english')
  }, [user.id, records, taskRefresh])

  const wrongCount = useMemo(() => {
    const allWrong = storage.getWrongCardIds(user.id)
    const enRecords = records.filter(r => r.subject === 'english')
    let count = 0
    for (const id of allWrong) {
      if (enRecords.some(r => r.card_id === id)) count++
    }
    return count
  }, [user.id, records])

  const EN_TAG_TO_QUIZ = {
    // knowledge_tag 级
    '英语词汇': { englishTag: 'en_vocab' },
    '英语语法': { englishTag: 'en_grammar' },
    '英语阅读': { englishTag: 'en_reading' },
    '英语写作': { englishTag: 'en_writing' },
    '完形填空': { englishTag: 'en_cloze' },
    '英语听力': { englishTag: 'en_listen' },
    '英语联想': { englishTag: 'en_association' },
    // ability_tag 级（diagnose 返回的弱项标签）
    '语音辨析': { englishTag: 'en_vocab' },
    '词汇翻译': { englishTag: 'en_vocab' },
    '单词拼写': { englishTag: 'en_vocab' },
    '词汇运用': { englishTag: 'en_vocab' },
    '词组搭配': { englishTag: 'en_vocab' },
    '语法选择': { englishTag: 'en_grammar' },
    '词形变换': { englishTag: 'en_grammar' },
    '情景交际': { englishTag: 'en_grammar' },
    '阅读理解': { englishTag: 'en_reading' },
    '句子重组': { englishTag: 'en_writing' },
    '听力辨识': { englishTag: 'en_listen' },
    '听力判断': { englishTag: 'en_listen' },
    '听力排序': { englishTag: 'en_listen' },
    '听短文填空': { englishTag: 'en_listen' },
    '听对话选择回答': { englishTag: 'en_listen' },
    '听音判断正误': { englishTag: 'en_listen' },
    '听短文排序': { englishTag: 'en_listen' },
  }

  const handleStartTask = ({ type, tag, knowledge, maxQuestions }) => {
    const opts = EN_TAG_TO_QUIZ[tag] || (knowledge ? EN_TAG_TO_QUIZ[knowledge] : {})
    switch (type) {
      case 'srs':
        onStartQuiz({ englishTag: 'en_vocab', srsFirst: true, maxQuestions: maxQuestions || 3, grade })
        break
      case 'anchor': case 'optional':
        onStartQuiz({ ...opts, grade, maxQuestions: maxQuestions || 3 })
        break
      case 'quick': case 'full': {
        const anchorOpts = EN_TAG_TO_QUIZ[todayTask.anchor?.tag] || { englishTag: 'en_vocab' }
        onStartQuiz({ ...anchorOpts, grade, maxQuestions })
        break
      }
      case 'wrong_review':
        onStartQuiz({ wrongReview: true, subject: 'english' })
        break
      default:
        onStartQuiz({ englishTag: 'en_vocab', grade })
    }
  }

  const handleClearAnchor = () => {
    clearAnchor(user.id)
    setTaskRefresh(k => k + 1)
  }

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

  // 今日已练哪些英语星球（只有完成整轮练习才算，答1题不算）
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

  // knowledge_tag -> planet id 映射（与各答题页 markPlanetComplete 的 tag 对齐）
  const TAG_TO_PLANET = {
    '英语联想': 'en_association',
    '联想星球': 'en_association',
    '英语词汇': 'en_vocab',
    '初中单词星球': 'en_vocab',       // WordPlanetPage 写入的 tag
    '英语听力': 'en_listen',
    '英语语法': 'en_grammar',
    '英语阅读': 'en_reading',
    '英语写作': 'en_writing',
    '完形填空': 'en_cloze',
    '闪电测验': 'en_lightning',         // LightningQuizPage 写入的 tag
    '英语听写': 'en_dictation',         // DictationPage(english) 写入的 tag
    '自测星球': 'en_self_test',          // SelfTestPage(english) 写入的 tag
  }

  function isPracticed(planet) {
    return Object.entries(TAG_TO_PLANET).some(([tag, pid]) => pid === planet.id && practicedToday.has(tag))
  }

  // 英语弱项建议（筛选 subject === 'english' 的记录）
  const enWeakPoints = useMemo(() => {
    const enRecords = records.filter(r => r.subject === 'english')
    if (enRecords.length < 3) return []
    const d = diagnose(enRecords)
    return getWeakPoints(d).filter(w => EN_WEAK_TAG_MAP[w.tag])
  }, [records])

  // ★ 核心8个学习星球 + 更多功能
  const corePlanets = EN_PLANETS.slice(0, 8)
  const specialPlanets = EN_PLANETS.slice(8)

  return (
    <div className="min-h-screen flex flex-col">
      {/* ===== 顶部栏 ====== */}
      {!hideHeader && (
        <div className="bg-white shadow-sm" style={{ paddingTop: 'env(safe-area-inset-top, 36px)' }}>
          <div className="flex items-center gap-3 px-4 pt-3 pb-3">
            <button
              onClick={onBack}
              className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-xl text-lg font-bold text-gray-500 active:bg-gray-200 transition-colors"
            >
              ←
            </button>
            <h1 className="text-xl font-bold text-gray-800">英语学习中心 🌎</h1>
          </div>
        </div>
      )}

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

      {/* ===== 今日任务卡片 ===== */}
      <TodayTaskCard
        task={todayTask}
        userId={user.id}
        onStartTask={handleStartTask}
        onClearAnchor={handleClearAnchor}
        sprintMode={sprintMode}
        wrongCount={wrongCount}
        accentColor="emerald"
      />

      {/* ===== 星球卡片区 ===== */}
      <div className="flex-1 px-4 pt-4 pb-8">
        {/* 标题 */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-600">🌟 英语学习星球</h2>
          <span className="text-xs text-gray-400">
            今日已练 {corePlanets.filter(p => isPracticed(p)).length}/{corePlanets.length} 个星球
          </span>
        </div>

        {/* 核心8个 - 4×2 网格布局 */}
        <div className="grid grid-cols-4 gap-2 mb-3">
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
                    else if (planet.isLightning) onStartQuiz({ lightningQuiz: true })
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
