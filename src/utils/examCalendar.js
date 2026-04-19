/**
 * 考试日历模块
 * 管理即将到来的考试日期，为推荐引擎提供紧迫度信号
 */

const KEY = (uid) => `cl_exams_${uid}`

// ── 基础 CRUD ──────────────────────────────────────────────

export function getExamCalendar(userId) {
  try {
    return JSON.parse(localStorage.getItem(KEY(userId)) || '[]')
  } catch { return [] }
}

export function setExamCalendar(userId, calendar) {
  localStorage.setItem(KEY(userId), JSON.stringify(calendar))
}

export function addExam(userId, { subject, name, date }) {
  const cal = getExamCalendar(userId)
  const exam = {
    id: `exam_${Date.now()}`,
    subject,   // 'chinese' | 'english' | 'math' | 'all'
    name,      // '语文期中考试'
    date,      // '2026-05-15'（ISO date string）
    createdAt: new Date().toISOString(),
  }
  setExamCalendar(userId, [...cal, exam])
  return exam
}

export function removeExam(userId, examId) {
  const cal = getExamCalendar(userId)
  setExamCalendar(userId, cal.filter(e => e.id !== examId))
}

// ── 查询 ──────────────────────────────────────────────────

/** 返回未过期的考试，按日期升序 */
export function getUpcomingExams(userId) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return getExamCalendar(userId)
    .filter(e => new Date(e.date) >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
}

/** 返回指定科目（或全科）最近一次考试 */
export function getNextExam(userId, subject) {
  return getUpcomingExams(userId)
    .find(e => !subject || e.subject === subject || e.subject === 'all') || null
}

/** 返回距考试还有几天（今天=0，明天=1，已过=-N） */
export function getDaysUntil(exam) {
  if (!exam) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const examDay = new Date(exam.date)
  examDay.setHours(0, 0, 0, 0)
  return Math.round((examDay - today) / 86400000)
}

/** 返回 0-1 紧迫度，距考试越近越高 */
export function getExamUrgency(exam) {
  const days = getDaysUntil(exam)
  if (days === null || days < 0) return 0
  if (days === 0) return 1.0
  if (days <= 3)  return 0.95
  if (days <= 7)  return 0.80
  if (days <= 14) return 0.50
  if (days <= 30) return 0.20
  return 0.05
}

/** 返回倒计时文字描述 */
export function getCountdownLabel(exam) {
  const days = getDaysUntil(exam)
  if (days === null) return null
  if (days === 0)  return `今天就是${exam.name}！`
  if (days === 1)  return `明天就是${exam.name}`
  if (days < 0)   return null
  return `距${exam.name}还有 ${days} 天`
}
