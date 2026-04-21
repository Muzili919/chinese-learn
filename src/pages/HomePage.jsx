import { useMemo, useState, useEffect } from 'react'
import { storage, calcLevel, calcLevelProgress } from '../utils/storage'
import { diagnose, getWeakPoints } from '../utils/diagnosis'
import { getRecommendedTask, getWeakAbilityTags, clearAnchor } from '../utils/recommendation'
import { getUpcomingExams, getDaysUntil, markTaskDone, getTodayDoneTasks } from '../utils/examCalendar'

// ── 静态配置 ────────────────────────────────────────────
const ABILITY_TO_QUIZ = {
  '字音辨析': { knowledgeTag: '字词' },
  '字形辨析': { knowledgeTag: '字词' },
  '词语含义': { knowledgeTag: '字词' },
  '近反义词': { knowledgeTag: '字词' },
  '词语搭配': { knowledgeTag: '字词' },
  '多音字':   { knowledgeTag: '字词' },
  '看拼音写字':{ knowledgeTag: '字词' },
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
  '关联词':   { knowledgeTag: '句子' },
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
  { id: '字词',    label: '字词星球',  emoji: '📚', color: 'from-blue-400 to-blue-600',     desc: '字音·字义·字形' },
  { id: '古诗词',  label: '诗词星球',  emoji: '🎋', color: 'from-green-400 to-teal-600',    desc: '古诗·填空·赏析' },
  { id: '成语',    label: '成语星球',  emoji: '🏮', color: 'from-orange-400 to-red-500',    desc: '含义·用法·辨析' },
  { id: '句子',    label: '句子星球',  emoji: '✏️', color: 'from-violet-400 to-purple-600',  desc: '修辞·句式·病句·关联词' },
  { id: 'reading', label: '阅读星球',  emoji: '📖', color: 'from-emerald-400 to-teal-600',  desc: 'AI评分·短文阅读理解', reading: true },
  { id: '文学常识',label: '文学星球',  emoji: '🎭', color: 'from-rose-400 to-pink-600',     desc: '四大名著·标点·文体' },
  { id: 'sentence_practice', label: '造句星球', emoji: '✍️', color: 'from-amber-400 to-orange-500', desc: 'AI即时批改·学会用词' },
  { id: 'essay',   label: '作文星球',  emoji: '📝', color: 'from-pink-500 to-rose-600',     desc: 'AI三维评分·提升写作' },
  { id: 'dictation', label: '听写星球', emoji: '🎧', color: 'from-cyan-400 to-blue-500',   desc: 'TTS听写·拍照批改·词库管理', dictation: true },
  { id: 'self_test',label: '自测星球', emoji: '🧪', color: 'from-amber-500 to-orange-600',  desc: 'AI出卷·小升初难度·查漏补缺', isSelfTest: true },
]

const QUIZ_PLANET_IDS = ['字词', '古诗词', '成语', '句子', '文学常识']

const SUBJECTS_BY_GRADE = {
  primary: [
    { id: 'chinese', label: '语文', emoji: '📖', available: true },
    { id: 'english', label: '英语', emoji: '🌎', available: true },
  ],
  junior2: [
    { id: 'english', label: '英语', emoji: '🌎', available: true },
    { id: 'politics', label: '道法', emoji: '⚖️', available: true },
    { id: 'math',    label: '数学', emoji: '🔢', available: false },
  ],
}

// 科目 → 倒计时标签颜色
const EXAM_URGENCY_STYLE = (days) => {
  if (days <= 3)  return 'bg-red-500 text-white'
  if (days <= 7)  return 'bg-orange-500 text-white'
  if (days <= 14) return 'bg-amber-400 text-white'
  return 'bg-indigo-100 text-indigo-700'
}

// ── 今日任务卡片 ────────────────────────────────────────
function TodayTaskCard({ task, userId, onStartTask, onClearAnchor, sprintMode, wrongCount }) {
  const { mandatory, anchor, optional, exam, isEmpty, modes } = task
  const doneTasks = getTodayDoneTasks(userId)

  const handleDone = (e, taskType) => {
    e.stopPropagation()
    markTaskDone(userId, taskType)
    // 强制重渲染（doneTasks 是 localStorage 读取，需要触发）
    window.dispatchEvent(new Event('cl_task_done'))
  }

  // 监听打卡事件强制刷新
  const [doneRefresh, setDoneRefresh] = useState(0)
  useEffect(() => {
    const handler = () => setDoneRefresh(k => k + 1)
    window.addEventListener('cl_task_done', handler)
    return () => window.removeEventListener('cl_task_done', handler)
  }, [])
  const done = getTodayDoneTasks(userId)  // 用 doneRefresh 保证最新
  void doneRefresh

  if (isEmpty) {
    return (
      <div className="mx-4 mt-4 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-4">
        <p className="text-sm font-bold text-indigo-700 mb-1">📌 今日任务</p>
        <p className="text-xs text-gray-500">先做几道题，我会帮你分析薄弱点，生成专属任务！</p>
        <button
          onClick={() => onStartTask({ type: 'free' })}
          className="mt-3 w-full bg-indigo-500 text-white text-sm font-bold py-2.5 rounded-xl active:scale-95 transition-transform"
        >开始随机练习</button>
      </div>
    )
  }

  // 冲刺模式：卡片头换色 + 题数加量
  const headerBg = sprintMode
    ? 'bg-gradient-to-r from-red-500 to-orange-500'
    : 'bg-gradient-to-r from-indigo-600 to-purple-600'
  const sprintModes = sprintMode
    ? { quick: modes.quick + 2, normal: modes.normal + 3 }
    : modes

  return (
    <div className="mx-4 mt-4 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      {/* 卡片头 */}
      <div className={`${headerBg} px-4 py-3 flex items-center justify-between`}>
        <div>
          <p className="text-white font-bold text-sm">
            {sprintMode ? '🔥 冲刺模式' : '📌 今日任务'}
          </p>
          {exam && (
            <p className="text-white/70 text-[11px] mt-0.5">{exam.label}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onStartTask({ type: 'quick', maxQuestions: sprintModes.quick })}
            className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
          >
            ⚡ {sprintModes.quick}题
          </button>
          <button
            onClick={() => onStartTask({ type: 'full', maxQuestions: sprintModes.normal })}
            className="bg-white text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
          >
            全部 {sprintModes.normal}题
          </button>
        </div>
      </div>

      {/* 任务列表 */}
      <div className="bg-white divide-y divide-gray-50">

        {/* 🔴 强提醒：积压错题 */}
        {wrongCount > 0 && (
          <button
            onClick={() => onStartTask({ type: 'wrong_review' })}
            className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 active:bg-red-100 transition-colors text-left"
          >
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold animate-pulse">
              ⚠
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-red-700">错题待消灭！</p>
              <p className="text-xs text-red-400">{wrongCount} 道错题还没攻克，趁热打铁！</p>
            </div>
            <span className="text-xs font-bold text-white bg-red-500 px-2.5 py-1 rounded-full flex-shrink-0">
              立即练习 →
            </span>
          </button>
        )}

        {/* 必做：SRS复习 */}
        <button
          onClick={() => onStartTask({ type: 'srs' })}
          className="w-full flex items-center gap-3 px-4 py-3 active:bg-gray-50 transition-colors text-left"
        >
          <span className={`flex-shrink-0 w-6 h-6 rounded-full ${done.includes('srs') ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'} text-xs flex items-center justify-center font-bold`}>
            {done.includes('srs') ? '✓' : '必'}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800">SRS 复习</p>
            <p className="text-xs text-gray-400">
              {mandatory.overdueCount > 0
                ? `${mandatory.overdueCount} 个词/题到期待复习`
                : '暂无到期，做几道新题'}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-300 font-medium">{mandatory.count || 3}题 →</span>
            {!done.includes('srs') && (
              <button
                onClick={e => handleDone(e, 'srs')}
                className="text-[10px] text-gray-300 border border-gray-200 rounded px-1 py-0.5 hover:text-green-500 hover:border-green-300 transition-colors"
                title="标记已完成"
              >完成</button>
            )}
          </div>
        </button>

        {/* 主攻：3天锁定弱点 */}
        {anchor && (
          <button
            onClick={() => onStartTask({ type: 'anchor', tag: anchor.tag, knowledge: anchor.knowledge })}
            className="w-full flex items-center gap-3 px-4 py-3 active:bg-gray-50 transition-colors text-left"
          >
            <span className={`flex-shrink-0 w-6 h-6 rounded-full ${done.includes('anchor') ? 'bg-green-100 text-green-500' : 'bg-orange-100 text-orange-500'} text-xs flex items-center justify-center font-bold`}>
              {done.includes('anchor') ? '✓' : '攻'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-gray-800 truncate">{anchor.tag}</p>
                <span className="flex-shrink-0 text-[10px] bg-orange-100 text-orange-500 px-1.5 py-0.5 rounded-full font-medium">
                  第{anchor.dayNum}天
                </span>
                {anchor.examErrorCount > 0 && (
                  <span className="flex-shrink-0 text-[10px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full font-medium">
                    考试错过{anchor.examErrorCount}次
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400">
                {anchor.accuracy !== undefined ? `当前正确率 ${anchor.accuracy}%，专项强化` : '本周主攻知识点'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-300 font-medium">{anchor.count}题 →</span>
              {!done.includes('anchor') && (
                <button
                  onClick={e => handleDone(e, 'anchor')}
                  className="text-[10px] text-gray-300 border border-gray-200 rounded px-1 py-0.5 hover:text-green-500 hover:border-green-300 transition-colors"
                >完成</button>
              )}
              <button
                onClick={e => { e.stopPropagation(); onClearAnchor() }}
                className="text-gray-300 hover:text-gray-400 text-sm ml-0.5"
                title="切换主攻目标"
              >⟳</button>
            </div>
          </button>
        )}

        {/* 可选：第二弱点 */}
        {optional && (
          <button
            onClick={() => onStartTask({ type: 'optional', tag: optional.tag, knowledge: optional.knowledge })}
            className="w-full flex items-center gap-3 px-4 py-3 active:bg-gray-50 transition-colors text-left"
          >
            <span className={`flex-shrink-0 w-6 h-6 rounded-full ${done.includes('optional') ? 'bg-green-100 text-green-500' : 'bg-green-100 text-green-500'} text-xs flex items-center justify-center font-bold`}>
              {done.includes('optional') ? '✓' : '选'}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{optional.tag}</p>
              <p className="text-xs text-gray-400">
                {optional.accuracy !== undefined ? `正确率 ${optional.accuracy}%` : '额外挑战'}·可选做
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-300 font-medium">{optional.count}题 →</span>
              {!done.includes('optional') && (
                <button
                  onClick={e => handleDone(e, 'optional')}
                  className="text-[10px] text-gray-300 border border-gray-200 rounded px-1 py-0.5 hover:text-green-500 hover:border-green-300 transition-colors"
                >完成</button>
              )}
            </div>
          </button>
        )}
      </div>
    </div>
  )
}

// ── 考试倒计时横幅 ───────────────────────────────────────
function ExamCountdownBanner({ exams, sprintMode, onToggleSprint }) {
  if (!exams.length) return null
  const next = exams[0]
  const days = getDaysUntil(next)
  if (days === null) return null

  const style = EXAM_URGENCY_STYLE(days)
  const emoji = days <= 3 ? '🚨' : days <= 7 ? '⚠️' : '📅'
  const canSprint = days !== null && days <= 7

  return (
    <button
      onClick={canSprint ? onToggleSprint : undefined}
      className={`w-full mx-0 mt-0 flex items-center gap-2 px-4 py-2.5 text-sm font-semibold ${style} ${canSprint ? 'active:opacity-80 transition-opacity' : ''}`}
      style={{ borderRadius: 0, display: 'flex' }}
    >
      <span>{emoji}</span>
      <span className="flex-1 text-left">
        {days === 0 ? `今天就是${next.name}！` :
         days === 1 ? `明天${next.name}，今天加油！` :
         `距${next.name}还有 ${days} 天`}
      </span>
      {canSprint && (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sprintMode ? 'bg-white text-orange-600' : 'bg-white/25 text-white'}`}>
          {sprintMode ? '🔥 冲刺中' : '开启冲刺 →'}
        </span>
      )}
    </button>
  )
}

// ── 主页组件 ─────────────────────────────────────────────
export default function HomePage({ user, onStartQuiz, hideHeader, activeSubject: activeSubjectProp, grade }) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [subjectToast, setSubjectToast]           = useState(null)
  const [refreshKey, setRefreshKey]               = useState(0)
  const [taskRefresh, setTaskRefresh]             = useState(0)
  const [sprintMode, setSprintMode]               = useState(false)

  const currentGrade = grade || 'primary'
  const SUBJECTS = SUBJECTS_BY_GRADE[currentGrade] || SUBJECTS_BY_GRADE.primary

  const [activeSubject, setActiveSubject] = useState(() => {
    const available = SUBJECTS_BY_GRADE[currentGrade].filter(s => s.available)
    return activeSubjectProp && available.find(s => s.id === activeSubjectProp)
      ? activeSubjectProp
      : available[0]?.id || 'chinese'
  })

  // 页面重新可见时刷新
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') setRefreshKey(k => k + 1)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  // 同步外部 activeSubject（hideHeader 模式）
  useEffect(() => {
    if (hideHeader && activeSubjectProp) setActiveSubject(activeSubjectProp)
  }, [activeSubjectProp, hideHeader])

  const handleSubjectClick = (subject) => {
    if (subject.available) {
      setActiveSubject(subject.id)
    } else {
      setSubjectToast(subject.label)
      setTimeout(() => setSubjectToast(null), 2500)
    }
  }

  // ── 数据计算 ──
  const xp            = storage.getXP(user.id)
  const level         = calcLevel(xp)
  const levelProgress = calcLevelProgress(xp)
  const streak        = storage.getStreak(user.id)
  const records       = storage.getRecords(user.id)
  const xpPct         = Math.min(100, (levelProgress.currentExp / levelProgress.requiredExp) * 100)

  const practicedToday = useMemo(() => {
    return new Set(storage.getCompletedPlanetsToday(user?.id))
  }, [user?.id, records, refreshKey])

  const todayCorrect = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const todayR = records.filter(r => r.timestamp?.startsWith(today))
    if (!todayR.length) return null
    return Math.round(todayR.filter(r => r.correct).length / todayR.length * 100)
  }, [records])

  const totalAccuracy = records.length > 0
    ? Math.round(records.filter(r => r.correct).length / records.length * 100) : 0

  // ── 错题数（用于强提醒）──
  const wrongCount = useMemo(() => {
    return storage.getWrongCardIds(user.id).size
  }, [user.id, records, refreshKey])

  // ── 今日任务（只在语文/英语时计算） ──
  const todayTask = useMemo(() => {
    return getRecommendedTask(user.id, activeSubject)
  }, [user.id, activeSubject, records, taskRefresh])

  // ── 考试倒计时 ──
  const upcomingExams = useMemo(() => {
    return getUpcomingExams(user.id)
  }, [user.id, taskRefresh])

  // ── 任务启动路由 ──
  const handleStartTask = ({ type, tag, knowledge, maxQuestions }) => {
    const opts = ABILITY_TO_QUIZ[tag] || (knowledge ? { knowledgeTag: knowledge } : {})
    switch (type) {
      case 'srs':
        onStartQuiz({ knowledgeTag: todayTask.anchor?.knowledge || '字词', srsFirst: true, maxQuestions: maxQuestions || 3 })
        break
      case 'anchor':
        onStartQuiz({ focusTag: tag, ...opts, maxQuestions: maxQuestions || 3 })
        break
      case 'optional':
        onStartQuiz({ focusTag: tag, ...opts, maxQuestions: maxQuestions || 2 })
        break
      case 'quick':
        onStartQuiz({
          focusTag: todayTask.anchor?.tag,
          ...(ABILITY_TO_QUIZ[todayTask.anchor?.tag] || { knowledgeTag: todayTask.anchor?.knowledge || '字词' }),
          maxQuestions,
        })
        break
      case 'full':
        onStartQuiz({
          focusTag: todayTask.anchor?.tag,
          ...(ABILITY_TO_QUIZ[todayTask.anchor?.tag] || { knowledgeTag: todayTask.anchor?.knowledge || '字词' }),
          maxQuestions,
        })
        break
      case 'wrong_review':
        onStartQuiz({ wrongReview: true })
        break
      default:
        onStartQuiz({ knowledgeTag: '字词' })
    }
  }

  const handleClearAnchor = () => {
    clearAnchor(user.id)
    setTaskRefresh(k => k + 1)
  }

  return (
    <div className="flex flex-col">

      {/* ── 顶部栏（hideHeader 模式由 App 层渲染）── */}
      {!hideHeader && (
        <div className="bg-white shadow-sm" style={{ paddingTop: 'env(safe-area-inset-top, 36px)' }}>

          {/* 学段切换 */}
          <div className="px-4 pt-3 flex items-center justify-between">
            <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>📚 学习阶段</span>
            <div className="flex bg-gray-100 rounded-xl p-0.5">
              {[{ id: 'primary', label: '小学', emoji: '🏫' }, { id: 'junior2', label: '初二', emoji: '🎓' }].map(g => (
                <button key={g.id}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    currentGrade === g.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-500'
                  }`}
                >{g.emoji} {g.label}</button>
              ))}
            </div>
          </div>

          {/* 科目切换 */}
          <div className="px-4 pt-3 pb-2 flex items-center gap-2">
            <div className="flex gap-2 flex-1">
              {SUBJECTS.map(s => (
                <button key={s.id} onClick={() => handleSubjectClick(s)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                    activeSubject === s.id ? 'bg-indigo-600 text-white shadow-sm'
                      : s.available ? 'bg-gray-100 text-gray-600' : 'bg-gray-50 text-gray-300'
                  }`}
                >
                  {s.emoji} {s.label}
                  {!s.available && <span className="text-[10px] opacity-60">🔒</span>}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <button className="w-8 h-8 flex items-center justify-center bg-indigo-50 rounded-xl text-base">📊</button>
              <button onClick={() => setShowLogoutConfirm(true)}
                className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-xl text-base">👤</button>
            </div>
          </div>

          {/* 打招呼 */}
          <div className="px-4 pb-1">
            <h1 className="text-xl font-bold text-gray-800">{user.name} 同学，加油！👋</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {streak.count > 0 ? `已连续学习 ${streak.count} 天 🔥` : '今天开始第一天打卡吧！'}
            </p>
          </div>

          {/* 三核心数据卡 */}
          <div className="flex gap-2 px-4 pb-3 mt-2">
            <div className="flex-1 rounded-2xl p-3 text-center"
              style={{ background: 'linear-gradient(135deg,#fff7ed,#fed7aa)' }}>
              <div className="text-2xl font-extrabold text-orange-500">{streak.count}</div>
              <div className="text-[10px] text-orange-400 font-medium mt-0.5">连续天数 🔥</div>
            </div>
            <div className="flex-1 rounded-2xl p-3"
              style={{ background: 'linear-gradient(135deg,#f5f3ff,#ddd6fe)' }}>
              <div className="flex items-baseline gap-1 justify-center">
                <span className="text-2xl font-extrabold text-indigo-600">Lv.{level}</span>
              </div>
              <div className="w-full bg-indigo-100 rounded-full h-1.5 mt-1.5">
                <div className="bg-gradient-to-r from-indigo-400 to-purple-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${xpPct}%` }} />
              </div>
              <div className="text-[9px] text-indigo-400 text-center mt-0.5">
                {levelProgress.currentExp}/{levelProgress.requiredExp} XP
              </div>
            </div>
            <div className="flex-1 rounded-2xl p-3 text-center"
              style={{ background: 'linear-gradient(135deg,#f0fdf4,#bbf7d0)' }}>
              <div className="text-2xl font-extrabold text-green-600">
                {todayCorrect !== null ? `${todayCorrect}%` : `${totalAccuracy}%`}
              </div>
              <div className="text-[10px] text-green-500 font-medium mt-0.5">
                {todayCorrect !== null ? '今日正确率' : '总正确率'} ✅
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      {!hideHeader && subjectToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white text-sm px-5 py-2.5 rounded-2xl shadow-xl"
          style={{ animation: 'fadeInDown 0.3s ease-out' }}>
          {subjectToast}即将开放，敬请期待 🚀
        </div>
      )}
      {!hideHeader && showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-xl">
            <h2 className="text-lg font-bold text-gray-800 mb-2">切换账号？</h2>
            <p className="text-sm text-gray-500 mb-5">退出后可以重新输入昵称登录，本机数据不会丢失。</p>
            <button onClick={() => setShowLogoutConfirm(false)}
              className="w-full bg-red-500 text-white font-semibold py-3 rounded-xl mb-2">确认退出</button>
            <button onClick={() => setShowLogoutConfirm(false)}
              className="w-full text-gray-400 py-2 text-sm">取消</button>
          </div>
        </div>
      )}

      {/* ── 考试倒计时横幅（≤7天时可点击开启冲刺模式）── */}
      <ExamCountdownBanner
        exams={upcomingExams}
        sprintMode={sprintMode}
        onToggleSprint={() => setSprintMode(m => !m)}
      />

      {/* ── 今日任务卡片（语文/英语模式下显示）── */}
      {(activeSubject === 'chinese' || activeSubject === 'english') && (
        <TodayTaskCard
          task={todayTask}
          userId={user.id}
          onStartTask={handleStartTask}
          onClearAnchor={handleClearAnchor}
          sprintMode={sprintMode}
          wrongCount={wrongCount}
        />
      )}

      {/* ── 星球网格 ── */}
      <div className="flex-1 px-4 pt-4 pb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <h2 className="text-base font-semibold text-gray-600">选择星球开始闯关</h2>
            <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-md font-medium">👆 核心闯关</span>
          </div>
          <span className="text-xs text-gray-400">
            今日已练 {PLANETS.slice(0, 8).filter(p => {
              const tagId = p.reading ? '阅读星球' : p.id
              return practicedToday.has(tagId)
            }).length}/8 个星球
          </span>
        </div>

        {(() => {
          const corePlanets = PLANETS.slice(0, 8)
          const toolPlanets = PLANETS.slice(8)

          const handlePlanetClick = (planet) => {
            if (planet.reading)                  onStartQuiz({ reading: true })
            else if (planet.id === 'essay')      onStartQuiz({ essay: true })
            else if (planet.id === 'sentence_practice') onStartQuiz({ sentencePractice: true })
            else if (planet.id === 'dictation')  onStartQuiz({ dictation: true, dictationSubject: 'chinese' })
            else if (planet.isSelfTest)           onStartQuiz({ selfTest: true, selfTestSubject: 'chinese' })
            else                                  onStartQuiz({ knowledgeTag: planet.id })
          }

          return (
            <>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {corePlanets.map((planet) => {
                  const tagId = planet.reading ? '阅读星球' : planet.id
                  const done  = practicedToday.has(tagId)
                  return (
                    <button key={planet.id} onClick={() => handlePlanetClick(planet)}
                      className={`bg-gradient-to-br ${planet.color} text-white rounded-xl p-3 flex flex-col justify-center items-center text-center gap-0.5 shadow-sm active:scale-95 transition-transform relative
                        ${done ? 'ring-2 ring-green-300 ring-offset-1' : ''}`}
                    >
                      <span className="text-2xl leading-none">{planet.emoji}</span>
                      <span className="text-xs font-bold leading-tight">{planet.label}</span>
                      {done && (
                        <span className="absolute top-1 right-1 text-[8px] bg-white/30 text-white font-semibold px-1 py-0.5 rounded-full">✓</span>
                      )}
                    </button>
                  )
                })}
                <div />
              </div>

              <div className="mb-1">
                <p className="text-[11px] text-gray-400 mb-1.5 font-medium">✨ 工具星球</p>
                <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
                  {toolPlanets.map((planet) => {
                    const done = practicedToday.has(planet.id)
                    return (
                      <button key={planet.id} onClick={() => handlePlanetClick(planet)}
                        className={`flex-shrink-0 w-28 bg-gradient-to-br ${planet.color} text-white rounded-xl p-2.5 flex flex-col items-center text-center gap-1 shadow-sm active:scale-95 transition-transform relative
                          ${done ? 'ring-2 ring-green-300 ring-offset-1' : ''}`}
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
            </>
          )
        })()}
      </div>

      <style>{`
        @keyframes fadeInDown {
          from { opacity:0; transform:translate(-50%,-8px); }
          to   { opacity:1; transform:translate(-50%,0); }
        }
        .scrollbar-hide::-webkit-scrollbar { display:none; }
        .scrollbar-hide { -ms-overflow-style:none; scrollbar-width:none; }
      `}</style>
    </div>
  )
}
