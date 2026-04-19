/**
 * 考试日历模块 v2
 * 管理考试日期 + 成绩录入 + 错题知识点标记
 *
 * 数据结构：
 *   cl_exams_${uid}         — 考试列表 (Exam[])
 *   cl_exam_results_${uid}  — 成绩列表 (ExamResult[])
 *
 * Exam       = { id, subject, name, date, createdAt }
 * ExamResult = { id, examId, examName, subject, date,
 *                score, totalScore, errorTags: string[] }
 *   errorTags: 本次考试考察并答错的知识点
 *   e.g. ['字词', '成语', '阅读理解']
 */

const KEY         = (uid) => `cl_exams_${uid}`
const RESULT_KEY  = (uid) => `cl_exam_results_${uid}`
const DONE_KEY    = (uid) => `cl_task_done_${uid}`   // 今日任务完成打卡

// ── 考试日历基础 CRUD ──────────────────────────────────────

export function getExamCalendar(userId) {
  try { return JSON.parse(localStorage.getItem(KEY(userId)) || '[]') }
  catch { return [] }
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

// ── 考试查询 ───────────────────────────────────────────────

/** 返回未过期的考试，按日期升序 */
export function getUpcomingExams(userId) {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return getExamCalendar(userId)
    .filter(e => new Date(e.date) >= now)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
}

/** 返回所有考试（包括已过期），按日期降序（最新在前）*/
export function getAllExams(userId) {
  return getExamCalendar(userId)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
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

// ── 成绩录入 ───────────────────────────────────────────────

export function getExamResults(userId) {
  try { return JSON.parse(localStorage.getItem(RESULT_KEY(userId)) || '[]') }
  catch { return [] }
}

/**
 * 录入一次考试成绩
 * @param {string} userId
 * @param {object} result
 *   { examId?, examName, subject, date, score, totalScore, errorTags: string[] }
 * @returns ExamResult
 */
export function addExamResult(userId, result) {
  const results = getExamResults(userId)
  const entry = {
    id:         `result_${Date.now()}`,
    examId:     result.examId || null,
    examName:   result.examName || '考试',
    subject:    result.subject || 'chinese',
    date:       result.date || new Date().toISOString().slice(0, 10),
    score:      Number(result.score) || 0,
    totalScore: Number(result.totalScore) || 100,
    errorTags:  Array.isArray(result.errorTags) ? result.errorTags : [],
    createdAt:  new Date().toISOString(),
  }
  localStorage.setItem(RESULT_KEY(userId), JSON.stringify([entry, ...results]))
  return entry
}

export function removeExamResult(userId, resultId) {
  const results = getExamResults(userId)
  localStorage.setItem(RESULT_KEY(userId), JSON.stringify(results.filter(r => r.id !== resultId)))
}

/**
 * 更新某次成绩的错题知识点（用于事后补标）
 */
export function updateExamErrorTags(userId, resultId, errorTags) {
  const results = getExamResults(userId)
  const updated = results.map(r =>
    r.id === resultId ? { ...r, errorTags } : r
  )
  localStorage.setItem(RESULT_KEY(userId), JSON.stringify(updated))
}

/**
 * 返回最近 N 次考试结果中频繁出现的错误知识点
 * 用于推荐引擎的薄弱点权重加成
 * @returns {{ [tag]: count }} 知识点出现次数
 */
export function getFrequentErrorTags(userId, recentN = 5) {
  const results = getExamResults(userId).slice(0, recentN)
  const counts = {}
  for (const r of results) {
    for (const tag of (r.errorTags || [])) {
      counts[tag] = (counts[tag] || 0) + 1
    }
  }
  return counts
}

// ── 今日任务完成打卡（C - 验证推荐系统）─────────────────────

/**
 * 标记今日任务已完成
 * @param {string} userId
 * @param {'srs'|'anchor'|'optional'|'all'} taskType
 */
export function markTaskDone(userId, taskType) {
  const today = new Date().toISOString().slice(0, 10)
  try {
    const raw = JSON.parse(localStorage.getItem(DONE_KEY(userId)) || '{}')
    if (!raw[today]) raw[today] = []
    if (!raw[today].includes(taskType)) raw[today].push(taskType)
    // 只保留最近 30 天
    const keys = Object.keys(raw).sort().slice(-30)
    const trimmed = {}
    for (const k of keys) trimmed[k] = raw[k]
    localStorage.setItem(DONE_KEY(userId), JSON.stringify(trimmed))
  } catch { /* ignore */ }
}

/** 返回今日哪些任务已完成 */
export function getTodayDoneTasks(userId) {
  const today = new Date().toISOString().slice(0, 10)
  try {
    const raw = JSON.parse(localStorage.getItem(DONE_KEY(userId)) || '{}')
    return raw[today] || []
  } catch { return [] }
}

/**
 * 返回最近 N 天任务完成统计
 * @returns {{ date: string, done: string[], total: number }[]}
 */
export function getTaskCompletionHistory(userId, days = 14) {
  try {
    const raw = JSON.parse(localStorage.getItem(DONE_KEY(userId)) || '{}')
    const result = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toISOString().slice(0, 10)
      result.push({
        date:  dateStr,
        done:  raw[dateStr] || [],
        total: 3,  // 必做+主攻+可选
      })
    }
    return result
  } catch { return [] }
}
