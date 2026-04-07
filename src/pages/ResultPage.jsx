import { useMemo } from 'react'
import { diagnose, getWeakPoints } from '../utils/diagnosis'
import { calcLevel } from '../utils/storage'
import { storage } from '../utils/storage'

const GRADE_EMOJI = { good: '🌟', slow: '⏰', weak: '💪' }
const GRADE_LABEL = { good: '掌握良好', slow: '知道但不熟', weak: '需要加强' }
const GRADE_COLOR = { good: 'text-green-600', slow: 'text-amber-600', weak: 'text-red-500' }

export default function ResultPage({ result, user, onHome, onRetry }) {
  const { session, records } = result
  const accuracy = session.total > 0 ? Math.round((session.correct / session.total) * 100) : 0

  const xpNow = storage.getXP(user.id)
  const level = calcLevel(xpNow)

  const abilityBreakdown = useMemo(() => {
    if (!records?.length) return []
    const d = diagnose(records)
    return Object.entries(d)
      .sort((a, b) => a[1].accuracy - b[1].accuracy)
      .map(([tag, data]) => ({ tag, ...data }))
  }, [records])

  const weakPoints = useMemo(() => getWeakPoints(diagnose(records || [])), [records])

  const durationMin = Math.round((session.durationSec || 0) / 60)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white px-5 pt-12 pb-8 text-center">
        <div className="text-5xl mb-2">
          {accuracy >= 80 ? '🎉' : accuracy >= 60 ? '👍' : '💪'}
        </div>
        <h1 className="text-2xl font-bold">
          {accuracy >= 80 ? '太棒了！' : accuracy >= 60 ? '继续加油！' : '再接再厉！'}
        </h1>
        <p className="text-indigo-200 text-sm mt-1">本次答题完成</p>

        {/* Big stats */}
        <div className="flex justify-center gap-8 mt-6">
          <div>
            <div className="text-4xl font-bold">{accuracy}%</div>
            <div className="text-indigo-200 text-xs mt-1">正确率</div>
          </div>
          <div>
            <div className="text-4xl font-bold">{session.total}</div>
            <div className="text-indigo-200 text-xs mt-1">答题数</div>
          </div>
          <div>
            <div className="text-4xl font-bold">+{session.xpEarned}</div>
            <div className="text-indigo-200 text-xs mt-1">获得 XP</div>
          </div>
        </div>

        <div className="mt-3 text-indigo-200 text-sm">
          Lv.{level} · 用时 {durationMin > 0 ? durationMin + '分钟' : session.durationSec + '秒'}
        </div>
      </div>

      {/* Breakdown */}
      <div className="flex-1 px-4 py-5">
        {abilityBreakdown.length > 0 && (
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">本次能力分析</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
              {abilityBreakdown.map(({ tag, accuracy: acc, total, status }) => (
                <div key={tag} className="flex items-center px-4 py-3 gap-3">
                  <span className="text-lg">{GRADE_EMOJI[status]}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{tag}</span>
                      <span className={`text-sm font-bold ${GRADE_COLOR[status]}`}>{acc}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                      <div
                        className={`h-1.5 rounded-full ${acc >= 80 ? 'bg-green-400' : acc >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
                        style={{ width: `${acc}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className={`text-xs ${GRADE_COLOR[status]}`}>{GRADE_LABEL[status]}</span>
                      <span className="text-xs text-gray-400">{total}题</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {weakPoints.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
            <p className="text-sm font-semibold text-amber-800 mb-2">🎯 建议重点练习</p>
            <div className="flex flex-wrap gap-2">
              {weakPoints.map((w) => (
                <span key={w.tag} className="bg-amber-100 text-amber-700 text-xs px-3 py-1 rounded-full">
                  {w.tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onRetry}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-2xl text-base transition-colors"
          >
            再来一轮 🔄
          </button>
          <button
            onClick={onHome}
            className="w-full bg-white border-2 border-gray-200 text-gray-700 font-semibold py-4 rounded-2xl text-base transition-colors"
          >
            回到星球地图 🌌
          </button>
        </div>
      </div>
    </div>
  )
}
