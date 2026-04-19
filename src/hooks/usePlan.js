/**
 * usePlan — 读取当前用户 plan，提供 can/limit/isPremium
 *
 * 用法：
 *   const { plan, isPremium, can, limit } = usePlan(user)
 *   can('WXPUSHER_REPORT')       → true/false
 *   limit('AI_VARIANT_QUESTION') → 3 (free) | Infinity (premium)
 *
 * 调试覆盖：
 *   localStorage.setItem('cl_plan_override', 'premium')  // 强制 premium
 *   localStorage.removeItem('cl_plan_override')           // 恢复真实值
 */

import { useMemo } from 'react'
import { FEATURES } from '../utils/featureFlags'

const PROXY_BASE = import.meta.env.VITE_API_BASE || 'https://chinese-learn.vercel.app'

/** 从服务端拉取 plan 并写入 user 对象（在 App.jsx 的 login effect 里调用一次） */
export async function fetchAndMergePlan(user) {
  if (!user?.id) return user
  try {
    const override = localStorage.getItem('cl_plan_override')
    if (override) return { ...user, plan: override }

    const res = await fetch(`${PROXY_BASE}/api/proxy/user/plan/${user.id}`)
    const data = await res.json()
    return { ...user, plan: data.plan || 'free' }
  } catch {
    return { ...user, plan: user.plan || 'free' }
  }
}

/** 检查并消费一次 AI 使用（调用后端，返回 { ok, remaining, upgradeHint? }） */
export async function checkAiUsage(userId, feature) {
  try {
    const override = localStorage.getItem('cl_plan_override')
    if (override === 'premium') return { ok: true, remaining: 9999 }

    const res = await fetch(`${PROXY_BASE}/api/proxy/ai/usage/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, feature }),
    })
    const data = await res.json()
    if (res.status === 429) return { ok: false, remaining: 0, upgradeHint: data.upgradeHint }
    return { ok: true, remaining: data.remaining ?? 0 }
  } catch {
    // 网络出错时放行
    return { ok: true, remaining: 99 }
  }
}

/** 查询今日某功能已用/剩余（不消费，用于 UI 展示） */
export async function getAiUsage(userId, feature) {
  try {
    const override = localStorage.getItem('cl_plan_override')
    if (override === 'premium') return { used: 0, limit: 9999, remaining: 9999, plan: 'premium' }

    const res = await fetch(
      `${PROXY_BASE}/api/proxy/ai/usage?userId=${encodeURIComponent(userId)}&feature=${encodeURIComponent(feature)}`
    )
    return await res.json()
  } catch {
    return { used: 0, limit: 3, remaining: 3, plan: 'free' }
  }
}

/** React Hook：同步读取 plan，计算 can/limit */
export function usePlan(user) {
  const plan = useMemo(() => {
    const override = typeof localStorage !== 'undefined'
      ? localStorage.getItem('cl_plan_override') : null
    return override || user?.plan || 'free'
  }, [user?.plan])

  return useMemo(() => ({
    plan,
    isPremium: plan === 'premium',

    /** 某功能是否可用（boolean，适用于付费专属功能） */
    can(feature) {
      const f = FEATURES[feature]
      if (!f) return true  // 未定义的功能默认开放
      const result = f(plan)
      return typeof result === 'boolean' ? result : (result > 0)
    },

    /** 某功能的每日上限（数字，Infinity=无限，适用于限额功能） */
    limit(feature) {
      const f = FEATURES[feature]
      if (!f) return Infinity
      const result = f(plan)
      return typeof result === 'number' ? result : (result ? Infinity : 0)
    },
  }), [plan])
}
