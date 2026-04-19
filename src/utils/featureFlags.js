/**
 * 特性开关中心 — 付费功能门禁的唯一真相来源
 *
 * 使用方式：
 *   import { usePlan } from '../hooks/usePlan'
 *   const { can, limit, isPremium } = usePlan(user)
 *   can('WXPUSHER_REPORT')      // boolean
 *   limit('AI_VARIANT_QUESTION') // number (Infinity for premium)
 *
 * 上线/下线某功能：只改这里，UI 自动跟进。
 * 测试时可用 localStorage.setItem('cl_plan_override', 'premium') 强制切换。
 */

// ── 每日限额（free 用户），对应服务端 FREE_DAILY_LIMITS ──────
export const FREE_DAILY_LIMITS = {
  ai_variant:  3,   // 举一反三 AI 出题
  ai_analysis: 2,   // 错题 AI 分析
  ai_selftest: 2,   // AI 自测出题
}

// ── 功能开关定义 ─────────────────────────────────────────────
//   () => true/false            完全开放 / 完全关闭
//   (plan) => boolean           按 plan 决定
//   (plan) => number|Infinity   限额（返回每日可用次数）

export const FEATURES = {
  // ── 永远免费 ──────────────────────────────────────────────
  SRS_REVIEW:            () => true,
  QUESTION_BANK:         () => true,
  PET_SYSTEM:            () => true,
  WRONG_ANSWER_REVIEW:   () => true,
  EXAM_CALENDAR:         () => true,
  WORD_CANNON_GAME:      () => true,

  // ── 限额功能（free=N次/天, premium=无限）─────────────────���
  AI_VARIANT_QUESTION:   (plan) => plan === 'premium' ? Infinity : FREE_DAILY_LIMITS.ai_variant,
  AI_WRONG_ANALYSIS:     (plan) => plan === 'premium' ? Infinity : FREE_DAILY_LIMITS.ai_analysis,
  AI_SELFTEST:           (plan) => plan === 'premium' ? Infinity : FREE_DAILY_LIMITS.ai_selftest,

  // ── 付费专属（premium only）────────────────────────────────
  WXPUSHER_REPORT:       (plan) => plan === 'premium',   // 家长 WeChat 周报
  SPRINT_AI_EXPAND:      (plan) => plan === 'premium',   // 冲刺模式额外 AI 扩题
  PARENT_WEEKLY_PDF:     (plan) => plan === 'premium',   // 周报 PDF 导出（未来）
  UNLIMITED_AI_ESSAY:    (plan) => plan === 'premium',   // 作文 AI 批改不限次数
}

// ── 权益说明（用于升级卡片展示）─────────────────────────────
export const PREMIUM_PERKS = [
  { icon: '🤖', text: 'AI 举一反三无限次', key: 'AI_VARIANT_QUESTION' },
  { icon: '📊', text: '错题深度 AI 分析', key: 'AI_WRONG_ANALYSIS' },
  { icon: '📱', text: '家长微信周报推送', key: 'WXPUSHER_REPORT' },
  { icon: '🔥', text: '冲刺模式 AI 扩题', key: 'SPRINT_AI_EXPAND' },
  { icon: '✍️',  text: '作文 AI 批改不限', key: 'UNLIMITED_AI_ESSAY' },
]
