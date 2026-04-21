/**
 * 公共工具函数 — 全项目共用，消除重复
 */

// Fisher-Yates 洗牌
export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// 打乱题目选项（保留 fill_blank 类型不变）
export function shuffleOptions(question) {
  if (question.type === 'fill_blank') return question
  const opts = [...(question.options || [])]
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[opts[i], opts[j]] = [opts[j], opts[i]]
  }
  return { ...question, options: opts }
}

// XP 奖励常量
export const XP_REWARDS = {
  CORRECT: 10,
  DICTATION_CORRECT: 5,
  LIGHTNING_CORRECT: 12,
  STREAK_BONUS: 2,       // 连续答对额外奖励
  PERFECT_BONUS: 20,     // 全对额外奖励
}

// 计算单题 XP
export function calcXP(correct, streak = 0, mode = 'default') {
  if (!correct) return 0
  const base = XP_REWARDS[`${mode.toUpperCase()}_CORRECT`] || XP_REWARDS.CORRECT
  const streakBonus = streak > 2 ? XP_REWARDS.STREAK_BONUS : 0
  return base + streakBonus
}

// 安全 localStorage 操作
const LS = {
  get(key) {
    try { return localStorage.getItem(key) } catch { return null }
  },
  set(key, val) {
    try { localStorage.setItem(key, val); return true } catch { return false }
  },
  remove(key) {
    try { localStorage.removeItem(key) } catch {}
  },
  getJSON(key, fallback = null) {
    try {
      const raw = localStorage.getItem(key)
      return raw ? JSON.parse(raw) : fallback
    } catch { return fallback }
  },
  setJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true } catch { return false }
  },
}
export default LS
