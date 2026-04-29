/**
 * PremiumCard — 升级 Premium 的权益展示卡片
 *
 * 显示位置：
 *   1. 宠物页/设置区（常驻展示）
 *   2. 次数用完时的弹窗（通过 cl_show_premium 事件触发）
 *
 * props:
 *   user         - 当前用户（用于管理员面板）
 *   onUpgraded   - plan 变更后回调（刷新 user 对象）
 *   compact      - true = 紧凑模式（用于嵌入式展示）
 */

import { useState, useEffect } from 'react'
import { PREMIUM_PERKS } from '../utils/featureFlags'
import { validateInviteCode } from '../utils/sync'

const PROXY_BASE = import.meta.env.VITE_API_BASE || 'https://chinese-learn.vercel.app'
const ADMIN_KEY  = 'cl_admin_2026'

export default function PremiumCard({ user, onUpgraded, compact = false }) {
  const isPremium = user?.plan === 'premium'

  // ── 邀请码兑换 ──
  const [codeInput, setCodeInput] = useState('')
  const [codeMsg, setCodeMsg] = useState('')
  const [codeLoading, setCodeLoading] = useState(false)

  async function handleRedeemCode() {
    const code = codeInput.trim().toUpperCase()
    if (!code) return setCodeMsg('请输入邀请码')
    setCodeLoading(true)
    setCodeMsg('')
    try {
      const result = await validateInviteCode(code, user?.id)
      if (result.valid) {
        setCodeMsg('✅ 升级成功！')
        const stored = JSON.parse(localStorage.getItem('cl_user') || '{}')
        const updated = { ...stored, plan: 'premium' }
        localStorage.setItem('cl_user', JSON.stringify(updated))
        onUpgraded?.('premium')
        setCodeInput('')
      } else {
        setCodeMsg('❌ ' + (result.reason || '邀请码无效'))
      }
    } catch {
      setCodeMsg('❌ 网络错误')
    }
    setCodeLoading(false)
  }

  // ── 管理员面板（仅 plan='free' 时显示 toggle，管理员自己用）
  const [adminMode, setAdminMode] = useState(false)
  const [adminInput, setAdminInput] = useState('')
  const [adminMsg, setAdminMsg] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleAdminSetPlan(targetPlan) {
    if (!user?.id) return
    setSaving(true)
    setAdminMsg('')
    try {
      const res = await fetch(`${PROXY_BASE}/api/proxy/admin/set-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, plan: targetPlan, adminKey: ADMIN_KEY }),
      })
      const data = await res.json()
      if (data.ok) {
        setAdminMsg(`✅ 已更新为 ${targetPlan}`)
        onUpgraded?.(targetPlan)
        // 同步到 localStorage
        const stored = JSON.parse(localStorage.getItem('cl_user') || '{}')
        localStorage.setItem('cl_user', JSON.stringify({ ...stored, plan: targetPlan }))
      } else {
        setAdminMsg('❌ ' + (data.error || '更新失败'))
      }
    } catch {
      setAdminMsg('❌ 网络错误')
    }
    setSaving(false)
  }

  if (compact && isPremium) {
    return (
      <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl px-4 py-3">
        <span className="text-lg">👑</span>
        <div>
          <p className="text-sm font-bold text-amber-700">Premium 会员</p>
          <p className="text-xs text-amber-500">所有功能无限使用</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-3xl overflow-hidden shadow-sm ${
      isPremium
        ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-amber-200'
        : 'bg-gradient-to-br from-violet-50 to-indigo-50 border-2 border-violet-200'
    }`}>
      {/* 头部 */}
      <div className={`px-5 py-4 ${
        isPremium
          ? 'bg-gradient-to-r from-amber-400 to-yellow-400'
          : 'bg-gradient-to-r from-violet-500 to-indigo-500'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-black text-lg">
              {isPremium ? '👑 Premium 会员' : '✨ 升级 Premium'}
            </p>
            <p className="text-white/80 text-xs mt-0.5">
              {isPremium ? '所有 AI 功能无限使用' : '解锁全部 AI 学习能力'}
            </p>
          </div>
          {isPremium && <span className="text-3xl">🎉</span>}
        </div>
      </div>

      {/* 权益列表 */}
      <div className="px-5 py-4">
        <div className="flex flex-col gap-2.5">
          {PREMIUM_PERKS.map(perk => (
            <div key={perk.key} className="flex items-center gap-3">
              <span className="text-xl flex-shrink-0">{perk.icon}</span>
              <span className={`text-sm font-medium ${isPremium ? 'text-amber-800' : 'text-gray-700'}`}>
                {perk.text}
              </span>
              {isPremium && <span className="ml-auto text-green-500 text-xs font-bold">✓</span>}
            </div>
          ))}
        </div>

        {/* 未升级：邀请码兑换 */}
        {!isPremium && (
          <div className="mt-4 bg-white/70 rounded-2xl px-4 py-3 border border-violet-100">
            <p className="text-xs text-gray-500 leading-relaxed mb-3">
              输入邀请码升级 Premium，解锁全部 AI 功能
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={codeInput}
                onChange={(e) => { setCodeInput(e.target.value); setCodeMsg('') }}
                placeholder="输入邀请码"
                maxLength={16}
                className="flex-1 border border-violet-200 rounded-xl px-3 py-2 text-sm text-center font-mono uppercase focus:outline-none focus:border-violet-400"
              />
              <button
                onClick={handleRedeemCode}
                disabled={codeLoading || !codeInput.trim()}
                className="px-4 py-2 rounded-xl bg-violet-500 hover:bg-violet-600 disabled:bg-gray-200 text-white text-sm font-bold transition-colors"
              >
                {codeLoading ? '...' : '兑换'}
              </button>
            </div>
            {codeMsg && <p className="text-xs mt-2 text-center text-gray-600">{codeMsg}</p>}
            <p className="text-xs text-gray-400 mt-2 text-center">
              获取邀请码：微信 muzli919 或爱发电赞助
            </p>
          </div>
        )}

        {/* 管理员快速切换（调试用，触发方式：连点5次 Premium 标题）*/}
        <button
          className="mt-3 w-full text-xs text-gray-300 py-1"
          onClick={() => setAdminMode(v => !v)}>
          {adminMode ? '▲ 收起' : '···'}
        </button>
        {adminMode && (
          <div className="mt-2 bg-gray-50 rounded-2xl p-3 border border-gray-200">
            <p className="text-xs text-gray-500 mb-2 font-medium">🔧 管理员操作</p>
            <div className="flex gap-2">
              <button
                onClick={() => handleAdminSetPlan('premium')}
                disabled={saving || isPremium}
                className="flex-1 py-2 rounded-xl bg-violet-500 disabled:bg-gray-200 text-white text-xs font-bold">
                {saving ? '保存中...' : '开通 Premium'}
              </button>
              <button
                onClick={() => handleAdminSetPlan('free')}
                disabled={saving || !isPremium}
                className="flex-1 py-2 rounded-xl bg-gray-400 disabled:bg-gray-200 text-white text-xs font-bold">
                降回 Free
              </button>
            </div>
            {adminMsg && <p className="text-xs mt-2 text-center text-gray-600">{adminMsg}</p>}
            <p className="text-xs text-gray-400 mt-2 text-center">
              uid: {user?.id?.slice(0, 8)}...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
