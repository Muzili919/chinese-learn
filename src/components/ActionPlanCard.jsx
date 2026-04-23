import { useState } from 'react'

/**
 * AI 7天行动计划展示组件
 * 每天可展开/收起
 */
export default function ActionPlanCard({ plan, loading, onGenerate }) {
  const [expandedDay, setExpandedDay] = useState(0)

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
          <span className="text-sm font-bold text-indigo-600">AI 正在生成学习计划...</span>
        </div>
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1.5 h-1.5 bg-indigo-300 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    )
  }

  if (!plan || !plan.days) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 p-4 text-center">
        <p className="text-sm text-gray-600 mb-3">基于你的学习数据生成个性化7天学习计划</p>
        <button onClick={onGenerate}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-2.5 px-6 rounded-xl text-sm active:scale-95 transition-transform">
          生成学习计划
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {plan.summary && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2 mb-2">
          <p className="text-xs text-indigo-700 font-medium">{plan.summary}</p>
        </div>
      )}

      {plan.days.map((day) => (
        <div key={day.day}
          className={`border rounded-xl overflow-hidden transition-all ${
            expandedDay === day.day ? 'border-indigo-300 shadow-sm' : 'border-gray-200'
          }`}>
          <button
            onClick={() => setExpandedDay(expandedDay === day.day ? -1 : day.day)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-left bg-white"
          >
            <span className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
              {day.day}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{day.focus}</p>
            </div>
            <span className="text-xs text-gray-400 flex-shrink-0">{day.duration}</span>
            <span className="text-gray-300 text-xs">{expandedDay === day.day ? '▲' : '▼'}</span>
          </button>

          {expandedDay === day.day && day.tasks && (
            <div className="px-3 pb-3 pt-1 bg-gray-50">
              {day.tasks.map((task, i) => (
                <div key={i} className="flex items-start gap-2 py-1">
                  <span className="text-indigo-400 text-xs mt-0.5 flex-shrink-0">•</span>
                  <p className="text-xs text-gray-700">{task}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
