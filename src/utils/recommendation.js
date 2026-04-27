/**
 * 智能推荐引擎
 * 结合 SRS到期量 + 薄弱点诊断 + 考试紧迫度，生成「今日任务」
 *
 * 任务三层结构：
 *   必做（mandatory）：SRS到期复习，每天都有
 *   主攻（anchor）：当前最大薄弱点，锁定3天不变
 *   可选（optional）：第二薄弱点或新内容，孩子自主决定
 */

import { storage } from './storage'
import { diagnose } from './diagnosis'
import { getNextExam, getExamUrgency, getDaysUntil, getCountdownLabel, getFrequentErrorTags } from './examCalendar'

const ANCHOR_KEY   = (uid) => `cl_anchor_${uid}`
const ANCHOR_DAYS  = 3   // 主攻锚定天数

// ── 锚点（主攻知识点，锁定3天）────────────────────────────

export function getAnchor(userId) {
  try {
    const raw = localStorage.getItem(ANCHOR_KEY(userId))
    if (!raw) return null
    const stored = JSON.parse(raw)
    const daysElapsed = Math.floor((Date.now() - stored.setAt) / 86400000)
    if (daysElapsed >= ANCHOR_DAYS) {
      localStorage.removeItem(ANCHOR_KEY(userId))
      return null
    }
    return { ...stored, dayNum: daysElapsed + 1 }
  } catch { return null }
}

export function setAnchor(userId, abilityTag, knowledgeTag) {
  localStorage.setItem(ANCHOR_KEY(userId), JSON.stringify({
    tag: abilityTag,
    knowledge: knowledgeTag,
    setAt: Date.now(),
  }))
}

export function clearAnchor(userId) {
  localStorage.removeItem(ANCHOR_KEY(userId))
}

// ── 科目 → subject 字段映射 ────────────────────────────────
const SUBJECT_FILTERS = {
  chinese:      ['chinese', 'chinese_junior'],
  english:      ['english'],
  math:         ['math', 'math_junior'],
  politics:     ['politics'],
}

function filterBySubject(records, subject) {
  if (!subject) return records
  const allowed = SUBJECT_FILTERS[subject]
  if (!allowed) return records
  return records.filter(r => allowed.includes(r.subject))
}

// ── 薄弱点分析 ────────────────────────────────────────────

/**
 * 返回按严重程度排序的薄弱 ability_tag 列表
 * @param {string} userId
 * @param {string} subject  可选，按科目过滤记录（'chinese'|'english'|'math'|'politics'）
 */
export function getWeakAbilityTags(userId, subject) {
  const allRecords = storage.getRecords(userId)
  const records = filterBySubject(allRecords, subject)
  if (records.length < 3) return []

  const diag = diagnose(records)
  // 考试错题知识点：{ '字词': 2, '成语': 1, ... }
  const examErrors = getFrequentErrorTags(userId, 5)

  return Object.entries(diag)
    .filter(([, d]) => d.total >= 3)
    .sort((a, b) => {
      const [tagA, da] = a; const [tagB, db] = b
      // 严重薄弱优先（0/1/2）
      const aScore = da.accuracy < 50 ? 0 : da.accuracy < 70 ? 1 : 2
      const bScore = db.accuracy < 50 ? 0 : db.accuracy < 70 ? 1 : 2
      // 考试错题加成：出现在错题中的扣1分（排得更前）
      const aExam = examErrors[tagA] ? -1 : 0
      const bExam = examErrors[tagB] ? -1 : 0
      const aFinal = aScore + aExam
      const bFinal = bScore + bExam
      if (aFinal !== bFinal) return aFinal - bFinal
      return da.accuracy - db.accuracy
    })
    .map(([tag, data]) => ({
      tag,
      ...data,
      examErrorCount: examErrors[tag] || 0,  // 透出给 UI 显示"考试错过X次"
    }))
}

/** 各科目最近7天题目数和时间，用于平衡提示 */
export function getWeeklySubjectBalance(userId) {
  const records = storage.getRecords(userId)
  const sevenDaysAgo = Date.now() - 7 * 86400000
  const recent = records.filter(r => new Date(r.timestamp).getTime() > sevenDaysAgo)

  const balance = {}
  recent.forEach(r => {
    const subj = r.subject || detectSubject(r.knowledge_tag)
    if (!balance[subj]) balance[subj] = { count: 0, correct: 0 }
    balance[subj].count++
    if (r.correct) balance[subj].correct++
  })
  return balance
}

function detectSubject(knowledgeTag) {
  if (!knowledgeTag) return 'other'
  const chinese = ['字词', '古诗词', '成语', '句子', '文学常识', '阅读理解']
  const english = ['词汇', '语法', '阅读', '写作']
  if (chinese.some(t => knowledgeTag.includes(t))) return 'chinese'
  if (english.some(t => knowledgeTag.includes(t))) return 'english'
  return 'other'
}

// ── SRS到期统计 ───────────────────────────────────────────

export function getOverdueSRSCount(userId, subject) {
  const srsState = storage.getSrsState(userId)
  const now = Date.now()
  const allowed = subject ? SUBJECT_FILTERS[subject] : null
  return Object.entries(srsState).filter(([cardId, card]) => {
    if (!card.nextReview) return false
    if (new Date(card.nextReview).getTime() > now) return false
    // 按 subject 过滤：从 card 的 subject 字段或 card_id 推断
    if (allowed) {
      const cardSubject = card.subject || inferSubjectFromCardId(cardId)
      if (!allowed.includes(cardSubject)) return false
    }
    return true
  }).length
}

function inferSubjectFromCardId(cardId) {
  if (!cardId) return 'other'
  if (cardId.startsWith('en_') || cardId.includes('_en_')) return 'english'
  if (cardId.startsWith('pol_') || cardId.includes('_pol_')) return 'politics'
  if (cardId.startsWith('math_') || cardId.startsWith('math_b') || cardId.startsWith('math_g') || cardId.startsWith('math_o') || cardId.includes('_math_')) return 'math'
  if (cardId.startsWith('jc_') || cardId.includes('junior')) return 'chinese_junior'
  return 'chinese'
}

// ── 核心：生成今日任务 ────────────────────────────────────

/**
 * @param {string} userId
 * @param {string} subject  当前科目（'chinese'|'english'|'math'）
 * @returns {TodayTask}
 *
 * TodayTask = {
 *   mandatory: { overdueCount, count, label }  // SRS到期
 *   anchor:    { tag, knowledge, dayNum, count } | null  // 3天主攻
 *   optional:  { tag, knowledge, count } | null  // 可选挑战
 *   exam:      { exam, daysLeft, urgency, label } | null
 *   isEmpty:   boolean  // 没有数据时为 true
 *   modes: { quick: N, normal: N }  // 题数
 * }
 */
export function getRecommendedTask(userId, subject = 'chinese') {
  const overdueCount = getOverdueSRSCount(userId, subject)
  const weakTags     = getWeakAbilityTags(userId, subject)
  const nextExam     = getNextExam(userId, subject)
  const daysLeft     = getDaysUntil(nextExam)
  const urgency      = getExamUrgency(nextExam)
  const examLabel    = getCountdownLabel(nextExam)

  // ── 必做：SRS复习 ──
  const mandatoryCount = Math.min(overdueCount, 3)

  // ── 主攻：3天锁定 ──
  let anchor = getAnchor(userId)
  if (!anchor && weakTags.length > 0) {
    const top = weakTags[0]
    setAnchor(userId, top.tag, top.knowledge)
    anchor = getAnchor(userId)
  }

  // ── 可选：第二薄弱点 ──
  const optionalSource = weakTags.find(w => !anchor || w.tag !== anchor.tag) || null

  const isEmpty = overdueCount === 0 && !anchor && weakTags.length === 0

  return {
    mandatory: {
      overdueCount,
      count: mandatoryCount,
      label: 'SRS复习到期词',
    },
    anchor: anchor ? {
      tag:      anchor.tag,
      knowledge: anchor.knowledge,
      dayNum:   anchor.dayNum,
      count:    3,
      accuracy: weakTags.find(w => w.tag === anchor.tag)?.accuracy,
    } : null,
    optional: optionalSource ? {
      tag:      optionalSource.tag,
      knowledge: optionalSource.knowledge,
      count:    2,
      accuracy: optionalSource.accuracy,
    } : null,
    exam: nextExam ? {
      exam: nextExam,
      daysLeft,
      urgency,
      label: examLabel,
    } : null,
    isEmpty,
    modes: {
      quick:  (mandatoryCount > 0 ? 2 : 0) + (anchor ? 3 : 2),
      normal: (mandatoryCount > 0 ? 3 : 0) + (anchor ? 3 : 3) + (optionalSource ? 2 : 0),
    },
  }
}
