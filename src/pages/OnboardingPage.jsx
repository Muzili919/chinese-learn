import { useState } from 'react'
import { storage } from '../utils/storage'
import { isSyncEnabled, findUserByName, pullFromCloud, syncUserToCloud, validateInviteCode } from '../utils/sync'

export default function OnboardingPage({ onDone }) {
  const [step, setStep] = useState('code') // 'code' | 'name' | 'pin'
  const [inviteCode, setInviteCode] = useState('')
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [restoring, setRestoring] = useState(false)
  const [restoreResult, setRestoreResult] = useState(null)

  // ========== Step 1: 邀请码验证 ==========
  async function handleCodeSubmit(e) {
    e.preventDefault()
    const code = inviteCode.trim().toUpperCase()
    if (!code) return setError('请输入邀请码')
    setLoading(true)
    setError('')

    // 本地缓存已验证的码（避免每次联网）
    try {
      const cachedCodes = JSON.parse(localStorage.getItem('cl_valid_codes') || '[]')
      if (cachedCodes.includes(code)) {
        setLoading(false)
        setStep('name')
        return
      }
    } catch (_) {}

    // 联网验证
    if (isSyncEnabled()) {
      try {
        const result = await validateInviteCode(code)
        setLoading(false)
        if (result.valid) {
          // 缓存到本地
          try {
            const cachedCodes = JSON.parse(localStorage.getItem('cl_valid_codes') || '[]')
            if (!cachedCodes.includes(code)) {
              cachedCodes.push(code)
              localStorage.setItem('cl_valid_codes', JSON.stringify(cachedCodes))
            }
          } catch (_) {}
          setStep('name')
          return
        } else {
          return setError(result.reason || '邀请码无效或已过期')
        }
      } catch (err) {
        setLoading(false)
        return setError('网络错误，请检查连接后重试')
      }
    }

    // 无Supabase：离线模式，允许任意码通过（开发环境）
    setLoading(false)
    setStep('name')
  }

  // ========== Step 2: 输入名字 ==========
  async function handleNameSubmit(e) {
    e.preventDefault()
    if (name.trim().length < 1) return setError('请输入名字')
    setError('')
    setLoading(true)

    // 1. 先查本设备本地目录
    const localUser = storage.getUsersDir().find(u => u.name === name.trim())
    if (localUser) {
      storage.setUser(localUser)
      onDone(localUser)
      return
    }

    // 2. 本地没有时，查云端（换设备登录）
    if (isSyncEnabled()) {
      setRestoring(true)
      const found = await findUserByName(name.trim())
      setRestoring(false)
      if (found) {
        setRestoreResult('found')
        await pullFromCloud(found.id)
        const restoredUser = { id: found.id, name: found.name, pin: '1234', createdAt: found.created_at }
        storage.saveToUsersDir(restoredUser)
        onDone(restoredUser)
        return
      }
      setRestoreResult('notfound')
    }

    setLoading(false)
    setStep('pin')
  }

  // ========== Step 3: 新用户设置PIN ==========
  async function handlePinSubmit(e) {
    e.preventDefault()
    const userId = name.trim() + '_' + Date.now().toString(36)
    const user = { id: userId, name: name.trim(), pin: pin || '1234', createdAt: new Date().toISOString() }
    
    // 记录邀请码关联
    try {
      const usedCodes = JSON.parse(sessionStorage.getItem('cl_session_code') || '[]')
      if (usedCodes.length > 0) {
        user.inviteCode = usedCodes[usedCodes.length - 1]
      }
    } catch (_) {}
    
    await syncUserToCloud(user)
    onDone(user)
  }

  // 记录本次会话使用的邀请码（用于新注册时记录关联）
  function recordSessionCode(code) {
    try {
      const usedCodes = JSON.parse(sessionStorage.getItem('cl_session_code') || '[]')
      if (!usedCodes.includes(code)) {
        usedCodes.push(code)
        sessionStorage.setItem('cl_session_code', JSON.stringify(usedCodes))
      }
    } catch (_) {}
  }

  // ========== UI 渲染 ==========
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      
      {/* 品牌头部 */}
      <div className="mb-8 text-center">
        <div className="text-6xl mb-3">🌍</div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          知识星球
        </h1>
        <p className="text-gray-500 mt-2 text-sm tracking-wide">碎片时间 · 每天进步一点点</p>
      </div>

      {/* ===== Step 1: 邀请码 ===== */}
      {step === 'code' && (
        <form onSubmit={handleCodeSubmit} className="w-full max-w-xs">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-indigo-100">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🎫</span>
              <h2 className="text-lg font-semibold text-gray-800">输入邀请码</h2>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              请输入你的专属邀请码以继续
            </p>
            <input
              autoFocus
              type="text"
              value={inviteCode}
              onChange={(e) => { setInviteCode(e.target.value); setError('') }}
              placeholder="例如：LOVE1234"
              maxLength={16}
              autoComplete="off"
              autoCapitalize="characters"
              className="w-full border-2 border-indigo-200 rounded-xl px-4 py-3 text-lg text-center font-mono tracking-widest uppercase focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
            {error && (
              <p className="mt-3 text-red-500 text-sm text-center animate-pulse">{error}</p>
            )}
            <button
              type="submit"
              disabled={inviteCode.trim().length === 0 || loading}
              className="mt-5 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl text-lg transition-all shadow-md hover:shadow-lg disabled:shadow-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  验证中…
                </span>
              ) : '进入学习 →'}
            </button>
          </div>
        </form>
      )}

      {/* ===== Step 2: 输入名字 ===== */}
      {step === 'name' && (
        <form onSubmit={handleNameSubmit} className="w-full max-w-xs">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-indigo-100">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">👋</span>
              <h2 className="text-lg font-semibold text-gray-800">你叫什么名字？</h2>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              {isSyncEnabled() ? '如果之前用过，数据会自动恢复' : '输入你的名字开始探险'}
            </p>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setRestoreResult(null); setError('') }}
              placeholder="例如：小明"
              maxLength={10}
              className="w-full border-2 border-indigo-200 rounded-xl px-4 py-3 text-lg text-center focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
            {restoreResult === 'notfound' && (
              <p className="text-xs text-gray-400 mt-2 text-center">未找到记录，将创建新账号</p>
            )}
            {error && (
              <p className="mt-2 text-red-500 text-sm text-center">{error}</p>
            )}
            <button
              type="submit"
              disabled={name.trim().length === 0 || restoring || loading}
              className="mt-4 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl text-lg transition-all"
            >
              {restoring ? '恢复数据中…' : loading ? '处理中…' : '继续 →'}
            </button>

            {/* 返回重新输邀请码 */}
            {!restoring && !loading && (
              <button
                type="button"
                onClick={() => { setStep('code'); setInviteCode(''); setError(''); }}
                className="mt-2 w-full text-gray-400 hover:text-gray-600 py-2 text-sm transition-colors"
              >
                ← 换一个账号 / 邀请码
              </button>
            )}
          </div>
        </form>
      )}

      {/* ===== Step 3: 新用户设置家长密码 ===== */}
      {step === 'pin' && (
        <form onSubmit={handlePinSubmit} className="w-full max-w-xs">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-indigo-100">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🔐</span>
              <h2 className="text-lg font-semibold text-gray-800">设置家长密码</h2>
            </div>
            <p className="text-sm text-gray-400 mb-4">
              4位数字，用于查看学习报告（可跳过，默认 1234）
            </p>
            <input
              autoFocus
              type="number"
              value={pin}
              onChange={(e) => setPin(e.target.value.slice(0, 4))}
              placeholder="4位数字"
              className="w-full border-2 border-indigo-200 rounded-xl px-4 py-3 text-lg text-center focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
            />
            <button
              type="submit"
              className="mt-4 w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl text-lg transition-all"
            >
              开始探险 🚀
            </button>
            <button
              type="button"
              onClick={() => setStep('name')}
              className="mt-2 w-full text-gray-400 hover:text-gray-600 py-2 text-sm transition-colors"
            >
              ← 返回修改名字
            </button>
          </div>
        </form>
      )}

      {/* 底部装饰文字 */}
      <p className="mt-8 text-xs text-gray-300 text-center">
        知识星球 · 让学习更有趣 ✨
      </p>
    </div>
  )
}
