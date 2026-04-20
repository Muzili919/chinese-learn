/**
 * DashboardPage — 智能主页
 * 登录后的统一入口，展示：
 *   ① 顶部状态栏（用户名 + 连续天数 + Lv. + XP进度）
 *   ② 智能卡片区（错题提醒 / 考试倒计时 / AI推荐 / 今日任务）
 *   ③ 学科入口区（按学段动态显示）
 */

import { useMemo, useState } from 'react'
import { storage, calcLevel, calcLevelProgress } from '../utils/storage'
import { diagnose, getWeakPoints } from '../utils/diagnosis'
import { getUpcomingExams, getDaysUntil, getCountdownLabel } from '../utils/examCalendar'

// 学科配置（按学段）
const SUBJECTS_CONFIG = {
  primary: [
    {
      id: 'chinese',
      label: '语文',
      emoji: '📖',
      color: '#6366f1',
      bg: 'linear-gradient(135deg, #eef2ff, #e0e7ff)',
      textColor: '#4338ca',
    },
    {
      id: 'english',
      label: '英语',
      emoji: '🌎',
      color: '#059669',
      bg: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
      textColor: '#065f46',
    },
    {
      id: 'math',
      label: '数学',
      emoji: '🔢',
      color: '#d97706',
      bg: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
      textColor: '#92400e',
    },
  ],
  junior2: [
    {
      id: 'english',
      label: '英语',
      emoji: '🌎',
      color: '#059669',
      bg: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
      textColor: '#065f46',
    },
    {
      id: 'politics',
      label: '道法',
      emoji: '⚖️',
      color: '#7c3aed',
      bg: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
      textColor: '#4c1d95',
    },
    {
      id: 'math',
      label: '数学',
      emoji: '🔢',
      color: '#d97706',
      bg: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
      textColor: '#92400e',
    },
  ],
}

// 知识点 → 学科映射（用于AI推荐卡跳转）
const TAG_TO_SUBJECT = {
  '字词': 'chinese', '古诗词': 'chinese', '成语': 'chinese',
  '句子': 'chinese', '文学常识': 'chinese', '阅读理解': 'chinese',
  '词汇': 'english', '语法': 'english', '听力': 'english',
  '写作': 'english', '完形填空': 'english',
  '道德与法治': 'politics', '思想品德': 'politics',
  '数学': 'math', '几何': 'math', '代数': 'math',
}

export default function DashboardPage({
  user,
  grade,
  overdueCount,
  onEnterSubject,
  onReport,
  onLogout,
  onGradeChange,
  onWrongReview,
  onStartQuiz,
  onAIPractice,
}) {
  const [showGradeSwitch, setShowGradeSwitch] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  // ── 基础数据 ────────────────────────────────────────────
  const xp = storage.getXP(user.id)
  const level = calcLevel(xp)
  const levelProgress = calcLevelProgress(xp)
  const xpPct = Math.min(100, (levelProgress.currentExp / levelProgress.requiredExp) * 100)
  const streak = storage.getStreak(user.id)

  const records = useMemo(() => storage.getRecords(user.id), [user.id])
  const upcomingExams = useMemo(() => getUpcomingExams(user.id), [user.id])
  const nextExam = upcomingExams[0] || null
  const daysUntilExam = getDaysUntil(nextExam)

  // 按科目分组的最近答题记录（用于弱项分析）
  const recentBySubject = useMemo(() => {
    const recent = records.slice(-200)
    const map = {}
    for (const r of recent) {
      const subj = r.subject || 'chinese'
      if (!map[subj]) map[subj] = []
      map[subj].push(r)
    }
    return map
  }, [records])

  // 各科弱点（按科目独立分析，用 knowledge_tag）
  const weaksBySubject = useMemo(() => {
    const result = {}
    for (const [subj, recs] of Object.entries(recentBySubject)) {
      if (recs.length < 5) continue
      const diag = diagnose(recs)
      const weaks = getWeakPoints(diag)
      if (weaks.length > 0) result[subj] = weaks
    }
    return result
  }, [recentBySubject])

  // 各科错题数
  const wrongBySubject = useMemo(() => {
    const map = {}
    const wrongIds = storage.getWrongCardIds(user.id)
    for (const id of wrongIds) {
      // 从最新记录里找对应科目
      const rec = records.slice().reverse().find(r => r.card_id === id)
      const subj = rec?.subject || 'chinese'
      map[subj] = (map[subj] || 0) + 1
    }
    return map
  }, [records, user.id])

  // 本周各科答题数
  const weeklyBySubject = useMemo(() => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekAgoStr = weekAgo.toISOString().slice(0, 10)
    const map = {}
    for (const r of records) {
      if (r.timestamp >= weekAgoStr) {
        const subj = r.subject || 'chinese'
        map[subj] = (map[subj] || 0) + 1
      }
    }
    return map
  }, [records])

  // 今日答题数
  const todayCount = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return records.filter(r => r.timestamp?.startsWith(today)).length
  }, [records])

  // 今日完成的星球
  const completedToday = useMemo(
    () => storage.getCompletedPlanetsToday(user.id),
    [user.id]
  )

  // 是否今日已打卡
  const hasCheckedInToday = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return streak.lastDate === today
  }, [streak])

  const subjects = SUBJECTS_CONFIG[grade] || SUBJECTS_CONFIG.primary

  // ── 智能卡片优先级排序 ──────────────────────────────────
  const cards = useMemo(() => {
    const list = []

    // 1. 错题积压卡（overdueCount > 0 时显示）
    if (overdueCount > 0) {
      list.push({
        id: 'wrong',
        priority: overdueCount > 5 ? 100 : 60,
        urgent: overdueCount > 5,
      })
    }

    // 2. 考试倒计时（有考试且 ≤30天）
    if (nextExam && daysUntilExam !== null && daysUntilExam >= 0 && daysUntilExam <= 30) {
      list.push({
        id: 'exam',
        priority: daysUntilExam <= 7 ? 90 : 50,
        urgent: daysUntilExam <= 3,
      })
    }

    // 3. AI针对练习（只显示当前学段的薄弱科目，初中不显示语文等）
    const currentGradeSubjects = (SUBJECTS_CONFIG[grade] || SUBJECTS_CONFIG.primary).map(s => s.id)
    const aiSubjects = Object.keys(weaksBySubject).filter(s => currentGradeSubjects.includes(s))
    if (aiSubjects.length > 0) {
      list.push({ id: 'ai_practice', priority: 45 })
    }

    // 4. 今日任务（永远显示）
    list.push({ id: 'today', priority: 30 })

    return list.sort((a, b) => b.priority - a.priority)
  }, [overdueCount, nextExam, daysUntilExam, weaksBySubject, records])

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: 'linear-gradient(160deg, #eef2ff 0%, #f5f3ff 50%, #fdf2f8 100%)' }}
    >
      {/* ── 顶部状态栏 ────────────────────────────────────── */}
      <div
        className="bg-white shadow-sm"
        style={{ paddingTop: 'env(safe-area-inset-top, 36px)' }}
      >
        <div className="px-4 pt-3 pb-4">
          {/* 用户行 */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-800">
                {user.name} 同学 👋
              </h1>
              <p className="text-xs text-gray-400 mt-0.5">
                {hasCheckedInToday
                  ? `连续打卡 ${streak.count} 天 🔥`
                  : streak.count > 0
                  ? `已连续 ${streak.count} 天，今天快来打卡！`
                  : '今天开始第一天打卡吧！'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* 报告按钮 */}
              <button
                onClick={onReport}
                className="w-9 h-9 flex items-center justify-center bg-indigo-50 rounded-xl text-base"
              >
                📊
              </button>
              {/* 设置/学段切换 */}
              <button
                onClick={() => setShowGradeSwitch(true)}
                className="w-9 h-9 flex items-center justify-center bg-gray-50 rounded-xl text-base"
              >
                ⚙️
              </button>
            </div>
          </div>

          {/* 等级 + XP进度条 */}
          <div className="flex items-center gap-3 mt-3">
            <span
              className="text-sm font-bold px-2.5 py-0.5 rounded-lg text-white"
              style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }}
            >
              Lv.{level}
            </span>
            <div className="flex-1">
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${xpPct}%`,
                    background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                  }}
                />
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">
                {levelProgress.currentExp} / {levelProgress.requiredExp} XP
              </div>
            </div>
            <span className="text-sm font-bold text-orange-500">
              🔥{streak.count}天
            </span>
          </div>
        </div>
      </div>

      {/* ── 主体内容区 ────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 80px)' }}
      >
        {/* 智能卡片 */}
        <div className="flex flex-col gap-3 mb-5">
          {cards.map(card => (
            <SmartCard
              key={card.id}
              cardId={card.id}
              urgent={card.urgent}
              overdueCount={overdueCount}
              wrongBySubject={wrongBySubject}
              nextExam={nextExam}
              daysUntilExam={daysUntilExam}
              weaksBySubject={weaksBySubject}
              subjects={subjects}
              todayCount={todayCount}
              completedToday={completedToday}
              hasCheckedInToday={hasCheckedInToday}
              onWrongReview={onWrongReview}
              onEnterSubject={onEnterSubject}
              onAIPractice={onAIPractice}
              onStartQuiz={onStartQuiz}
            />
          ))}
        </div>

        {/* 学科入口 */}
        <div className="mb-2">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            开始学习
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {subjects.map(subject => {
              const weekCount = weeklyBySubject[subject.id] || 0
              const wrongCnt = wrongBySubject[subject.id] || 0
              const hasRecentRecords = records.some(r => r.subject === subject.id)
              const subjectRecords = records.filter(r => r.subject === subject.id)
              const accuracy = subjectRecords.length > 0
                ? Math.round(subjectRecords.filter(r => r.correct).length / subjectRecords.length * 100)
                : null

              return (
                <button
                  key={subject.id}
                  onClick={() => onEnterSubject(subject.id)}
                  className="rounded-2xl p-4 flex flex-col items-center gap-2 active:scale-95 transition-all shadow-sm relative"
                  style={{ background: subject.bg }}
                >
                  <span className="text-3xl">{subject.emoji}</span>
                  <span
                    className="text-sm font-bold"
                    style={{ color: subject.textColor }}
                  >
                    {subject.label}
                  </span>
                  {wrongCnt > 0 && (
                    <span className="absolute top-2 right-2 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-1">
                      {wrongCnt}
                    </span>
                  )}
                  {weekCount === 0 && hasRecentRecords ? (
                    <span className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-medium">
                      本周未学
                    </span>
                  ) : accuracy !== null ? (
                    <span
                      className="text-[10px] font-medium"
                      style={{ color: subject.textColor, opacity: 0.7 }}
                    >
                      正确率 {accuracy}%
                    </span>
                  ) : (
                    <span
                      className="text-[10px] font-medium"
                      style={{ color: subject.textColor, opacity: 0.5 }}
                    >
                      开始学习
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── 学段切换弹窗 ──────────────────────────────────── */}
      {showGradeSwitch && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center"
          onClick={() => setShowGradeSwitch(false)}
        >
          <div
            className="bg-white rounded-t-3xl w-full max-w-md p-5"
            onClick={e => e.stopPropagation()}
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 20px)' }}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <h3 className="text-base font-bold text-gray-800 mb-4">学习阶段</h3>
            {[
              { id: 'primary', label: '小学', emoji: '🏫', desc: '语文 · 英语 · 数学' },
              { id: 'junior2', label: '初中', emoji: '📚', desc: '英语 · 道法 · 数学' },
            ].map(g => (
              <button
                key={g.id}
                onClick={() => { onGradeChange(g.id); setShowGradeSwitch(false) }}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl mb-2 border-2 transition-all ${
                  grade === g.id
                    ? 'border-indigo-400 bg-indigo-50'
                    : 'border-gray-100 bg-gray-50'
                }`}
              >
                <span className="text-3xl">{g.emoji}</span>
                <div className="text-left">
                  <div className="font-bold text-gray-800">{g.label}</div>
                  <div className="text-xs text-gray-400">{g.desc}</div>
                </div>
                {grade === g.id && (
                  <span className="ml-auto text-indigo-500 font-bold text-sm">当前</span>
                )}
              </button>
            ))}
            <button
              onClick={() => { setShowGradeSwitch(false); setShowLogoutConfirm(true) }}
              className="w-full text-red-400 text-sm py-3 mt-1 hover:text-red-500 transition-colors"
            >
              切换账号 / 退出
            </button>
          </div>
        </div>
      )}

      {/* ── 退出确认弹窗 ──────────────────────────────────── */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-xl">
            <h2 className="text-lg font-bold text-gray-800 mb-2">切换账号？</h2>
            <p className="text-sm text-gray-500 mb-5">
              退出后可重新输入昵称登录，本机数据不会丢失。
            </p>
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
    </div>
  )
}

// ── 单张智能卡片 ─────────────────────────────────────────────
function SmartCard({
  cardId,
  urgent,
  overdueCount,
  wrongBySubject,
  nextExam,
  daysUntilExam,
  weaksBySubject,
  subjects,
  todayCount,
  completedToday,
  hasCheckedInToday,
  onWrongReview,
  onEnterSubject,
  onAIPractice,
  onStartQuiz,
}) {
  // ── AI针对练习卡 ─────────────────────────────────────────
  if (cardId === 'ai_practice') {
    const currentGradeSubjects = (SUBJECTS_CONFIG[grade] || SUBJECTS_CONFIG.primary).map(s => s.id)
    const aiSubjects = Object.keys(weaksBySubject).filter(s => currentGradeSubjects.includes(s))
    const subjectConfigs = {
      chinese: { label: '语文', emoji: '📖', color: '#6366f1', bg: '#eef2ff' },
      english: { label: '英语', emoji: '🌎', color: '#059669', bg: '#ecfdf5' },
      math:    { label: '数学', emoji: '🔢', color: '#d97706', bg: '#fffbeb' },
      politics:{ label: '道法', emoji: '⚖️', color: '#7c3aed', bg: '#f5f3ff' },
    }
    return (
      <div className="rounded-2xl shadow-sm overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #f0f4ff, #faf5ff)', border: '1.5px solid #c7d2fe' }}>
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🤖</span>
            <span className="font-bold text-gray-800 text-sm">AI 针对练习</span>
            <span className="ml-auto text-[10px] text-indigo-400 bg-indigo-50 px-2 py-0.5 rounded-full">
              题库无限
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            根据你的薄弱点，AI实时出题，专项突破
          </p>
          <div className="flex flex-col gap-2">
            {aiSubjects.map(subj => {
              const cfg = subjectConfigs[subj] || subjectConfigs.chinese
              const weaks = weaksBySubject[subj] || []
              const topTag = weaks[0]?.tag || ''
              return (
                <button
                  key={subj}
                  onClick={() => onAIPractice && onAIPractice(subj, weaks.map(w => w.tag).slice(0, 3))}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 active:scale-95 transition-all"
                  style={{ background: cfg.bg, border: `1px solid ${cfg.color}30` }}
                >
                  <span className="text-xl">{cfg.emoji}</span>
                  <div className="flex-1 text-left">
                    <span className="text-sm font-semibold" style={{ color: cfg.color }}>
                      {cfg.label}专项
                    </span>
                    {topTag && (
                      <span className="ml-2 text-[10px] text-gray-400">
                        薄弱：{topTag}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold" style={{ color: cfg.color }}>
                    开始 →
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  if (cardId === 'wrong') {
    const subjectMap = { chinese:'语文', english:'英语', math:'数学', politics:'道法' }
    const subjectEmoji = { chinese:'📖', english:'🌎', math:'🔢', politics:'⚖️' }
    const wrongEntries = Object.entries(wrongBySubject || {}).filter(([, n]) => n > 0)
    return (
      <div
        className="rounded-2xl p-4 shadow-sm"
        style={{
          background: urgent ? 'linear-gradient(135deg, #fff1f2, #ffe4e6)' : 'linear-gradient(135deg, #fff7ed, #ffedd5)',
          border: urgent ? '1.5px solid #fca5a5' : '1.5px solid #fed7aa',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{urgent ? '🚨' : '⚠️'}</span>
            <span className="font-bold text-gray-800 text-sm">
              {urgent ? '错题积压严重！' : '错题待复习'}
            </span>
          </div>
          <span className="text-xs text-gray-400">共 {overdueCount} 道</span>
        </div>
        {/* 按科目显示 */}
        <div className="flex gap-2 flex-wrap mb-3">
          {wrongEntries.map(([subj, cnt]) => (
            <span key={subj} className="text-xs bg-white/60 rounded-lg px-2 py-1 font-medium text-gray-700">
              {subjectEmoji[subj]}{subjectMap[subj]} {cnt}题
            </span>
          ))}
        </div>
        <button
          onClick={onWrongReview}
          className="w-full text-sm font-semibold py-2.5 rounded-xl text-white active:scale-95 transition-all"
          style={{ background: urgent ? '#ef4444' : '#f97316' }}
        >
          立即复习 →
        </button>
      </div>
    )
  }

  if (cardId === 'exam') {
    const subjectLabel =
      nextExam?.subject === 'chinese' ? '语文' :
      nextExam?.subject === 'english' ? '英语' :
      nextExam?.subject === 'math'    ? '数学' :
      nextExam?.subject === 'politics'? '道法' : '全科'

    return (
      <div
        className="rounded-2xl p-4 shadow-sm"
        style={{
          background: urgent
            ? 'linear-gradient(135deg, #fdf4ff, #fae8ff)'
            : 'linear-gradient(135deg, #eff6ff, #dbeafe)',
          border: urgent ? '1.5px solid #d8b4fe' : '1.5px solid #93c5fd',
        }}
      >
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">⏰</span>
          <div>
            <div className="font-bold text-gray-800 text-sm">{nextExam.name}</div>
            <div className="text-xs text-gray-500 mt-0.5">
              {daysUntilExam === 0 ? '今天考试！' : `还剩 ${daysUntilExam} 天`}
            </div>
          </div>
          <span
            className="ml-auto text-xs font-bold px-2 py-0.5 rounded-lg"
            style={{
              background: urgent ? '#a855f7' : '#3b82f6',
              color: 'white',
            }}
          >
            {subjectLabel}
          </span>
        </div>
        {/* 薄弱点提示 */}
        {weakPoints.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-100">
            <div className="text-xs text-gray-500 mb-1.5">需要加强：</div>
            <div className="flex flex-wrap gap-1.5">
              {weakPoints.slice(0, 3).map(wp => (
                <button
                  key={wp.tag}
                  onClick={() => {
                    const subject = TAG_TO_SUBJECT[wp.tag]
                    if (subject) onEnterSubject(subject)
                  }}
                  className="text-xs px-2.5 py-1 rounded-lg font-medium text-white"
                  style={{ background: '#6366f1' }}
                >
                  {wp.tag} {wp.accuracy}%
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (cardId === 'ai') {
    const topWeak = weakPoints[0]
    const subject = topWeak ? (TAG_TO_SUBJECT[topWeak.tag] || 'chinese') : 'chinese'

    return (
      <button
        onClick={() => onEnterSubject(subject)}
        className="w-full text-left rounded-2xl p-4 shadow-sm active:scale-95 transition-all"
        style={{
          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
          border: '1.5px solid #86efac',
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🤖</span>
          <div className="flex-1">
            <div className="font-bold text-gray-800 text-sm">AI今日推荐</div>
            {topWeak ? (
              <div className="text-xs text-gray-500 mt-0.5">
                「{topWeak.tag}」正确率仅 {topWeak.accuracy}%，建议重点练习
              </div>
            ) : (
              <div className="text-xs text-gray-500 mt-0.5">继续保持，坚持每天练习！</div>
            )}
          </div>
          <div
            className="text-sm font-semibold px-3 py-1.5 rounded-xl text-white"
            style={{ background: '#22c55e' }}
          >
            去练习 →
          </div>
        </div>
      </button>
    )
  }

  if (cardId === 'today') {
    return (
      <div
        className="rounded-2xl p-4 shadow-sm"
        style={{
          background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
          border: '1.5px solid #e2e8f0',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">
              {hasCheckedInToday ? '✅' : '📋'}
            </span>
            <div>
              <div className="font-bold text-gray-700 text-sm">
                {hasCheckedInToday ? '今日已打卡' : '今日任务'}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                今天已答 {todayCount} 题
                {completedToday.length > 0 && ` · ${completedToday.length} 个星球已完成`}
              </div>
            </div>
          </div>
          {!hasCheckedInToday && (
            <span className="text-xs text-indigo-500 font-medium">去完成 →</span>
          )}
        </div>
      </div>
    )
  }

  return null
}
