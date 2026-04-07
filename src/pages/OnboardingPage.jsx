import { useState } from 'react'
import { isSyncEnabled, findUserByName, pullFromCloud, syncUserToCloud } from '../utils/sync'

export default function OnboardingPage({ onDone }) {
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [step, setStep] = useState(1) // 1=name, 2=pin
  const [restoring, setRestoring] = useState(false)
  const [restoreResult, setRestoreResult] = useState(null) // null | 'found' | 'notfound'

  async function handleNameSubmit(e) {
    e.preventDefault()
    if (name.trim().length < 1) return

    // If sync enabled, try to find existing user
    if (isSyncEnabled()) {
      setRestoring(true)
      const found = await findUserByName(name.trim())
      setRestoring(false)
      if (found) {
        setRestoreResult('found')
        // Pull their data from cloud
        await pullFromCloud(found.id)
        // Restore user with their saved pin (we don't store pin in cloud, use default)
        onDone({ id: found.id, name: found.name, pin: '1234', createdAt: found.created_at })
        return
      }
      setRestoreResult('notfound')
    }

    setStep(2)
  }

  async function handlePinSubmit(e) {
    e.preventDefault()
    const userId = name.trim() + '_' + Date.now().toString(36)
    const user = { id: userId, name: name.trim(), pin: pin || '1234', createdAt: new Date().toISOString() }
    await syncUserToCloud(user)
    onDone(user)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12">
      <div className="mb-8 text-center">
        <div className="text-6xl mb-3">🌟</div>
        <h1 className="text-3xl font-bold text-indigo-700">汉字星球</h1>
        <p className="text-gray-500 mt-2 text-sm">语文闯关 · 每天进步一点点</p>
      </div>

      {step === 1 ? (
        <form onSubmit={handleNameSubmit} className="w-full max-w-xs">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-indigo-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">你叫什么名字？</h2>
            <p className="text-sm text-gray-400 mb-4">
              {isSyncEnabled() ? '如果之前用过，数据会自动恢复' : '输入你的名字开始探险'}
            </p>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setRestoreResult(null) }}
              placeholder="例如：小明"
              maxLength={10}
              className="w-full border-2 border-indigo-200 rounded-xl px-4 py-3 text-lg text-center focus:outline-none focus:border-indigo-500 transition-colors"
            />
            {restoreResult === 'notfound' && (
              <p className="text-xs text-gray-400 mt-2 text-center">未找到记录，将创建新账号</p>
            )}
            <button
              type="submit"
              disabled={name.trim().length === 0 || restoring}
              className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-semibold py-3 rounded-xl text-lg transition-colors"
            >
              {restoring ? '查找中…' : '继续 →'}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={handlePinSubmit} className="w-full max-w-xs">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-indigo-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-1">设置家长密码</h2>
            <p className="text-sm text-gray-400 mb-4">
              4位数字，用于查看学习报告（可跳过，默认 1234）
            </p>
            <input
              autoFocus
              type="number"
              value={pin}
              onChange={(e) => setPin(e.target.value.slice(0, 4))}
              placeholder="4位数字"
              className="w-full border-2 border-indigo-200 rounded-xl px-4 py-3 text-lg text-center focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <button
              type="submit"
              className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl text-lg transition-colors"
            >
              开始探险 🚀
            </button>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="mt-2 w-full text-gray-400 py-2 text-sm"
            >
              ← 返回
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
