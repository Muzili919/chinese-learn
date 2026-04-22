import { useState, useEffect } from 'react'
import { getTodayDoneTasks, markTaskDone } from '../utils/examCalendar'

export default function TodayTaskCard({ task, userId, onStartTask, onClearAnchor, sprintMode, wrongCount, accentColor }) {
  const { mandatory, anchor, optional, exam, isEmpty, modes } = task

  const handleDone = (e, taskType) => {
    e.stopPropagation()
    markTaskDone(userId, taskType)
    window.dispatchEvent(new Event('cl_task_done'))
  }

  const [doneRefresh, setDoneRefresh] = useState(0)
  useEffect(() => {
    const handler = () => setDoneRefresh(k => k + 1)
    window.addEventListener('cl_task_done', handler)
    return () => window.removeEventListener('cl_task_done', handler)
  }, [])
  const done = getTodayDoneTasks(userId)
  void doneRefresh

  // 主题色：不同科目不同色调
  const color = accentColor || 'indigo'
  const colorMap = {
    indigo:  { bg: 'from-indigo-50 to-blue-50',  border: 'border-indigo-100', header: 'from-indigo-600 to-purple-600', btn: 'bg-indigo-500', empty: 'text-indigo-700' },
    emerald: { bg: 'from-emerald-50 to-teal-50',  border: 'border-emerald-100', header: 'from-emerald-600 to-teal-600', btn: 'bg-emerald-500', empty: 'text-emerald-700' },
    sky:     { bg: 'from-sky-50 to-blue-50',      border: 'border-sky-100',     header: 'from-sky-600 to-blue-600',     btn: 'bg-sky-500',     empty: 'text-sky-700' },
    purple:  { bg: 'from-purple-50 to-indigo-50', border: 'border-purple-100',  header: 'from-purple-600 to-indigo-600', btn: 'bg-purple-500',  empty: 'text-purple-700' },
    violet:  { bg: 'from-violet-50 to-purple-50', border: 'border-violet-100',  header: 'from-violet-600 to-purple-600', btn: 'bg-violet-500',  empty: 'text-violet-700' },
    orange:  { bg: 'from-orange-50 to-amber-50',  border: 'border-orange-100',  header: 'from-orange-600 to-amber-600',  btn: 'bg-orange-500',  empty: 'text-orange-700' },
  }
  const c = colorMap[color] || colorMap.indigo

  if (isEmpty) {
    return (
      <div className={`mx-4 mt-4 bg-gradient-to-br ${c.bg} ${c.border} border rounded-2xl p-4`}>
        <p className={`text-sm font-bold ${c.empty} mb-1`}>📌 今日任务</p>
        <p className="text-xs text-gray-500">先做几道题，我会帮你分析薄弱点，生成专属任务！</p>
        <button
          onClick={() => onStartTask({ type: 'free' })}
          className={`mt-3 w-full ${c.btn} text-white text-sm font-bold py-2.5 rounded-xl active:scale-95 transition-transform`}
        >开始随机练习</button>
      </div>
    )
  }

  const headerBg = sprintMode
    ? 'bg-gradient-to-r from-red-500 to-orange-500'
    : `bg-gradient-to-r ${c.header}`
  const sprintModes = sprintMode
    ? { quick: modes.quick + 2, normal: modes.normal + 3 }
    : modes

  return (
    <div className="mx-4 mt-4 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      <div className={`${headerBg} px-4 py-3 flex items-center justify-between`}>
        <div>
          <p className="text-white font-bold text-sm">
            {sprintMode ? '🔥 冲刺模式' : '📌 今日任务'}
          </p>
          {exam && (
            <p className="text-white/70 text-[11px] mt-0.5">{exam.label}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onStartTask({ type: 'quick', maxQuestions: sprintModes.quick })}
            className="bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
          >
            ⚡ {sprintModes.quick}题
          </button>
          <button
            onClick={() => onStartTask({ type: 'full', maxQuestions: sprintModes.normal })}
            className="bg-white text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
          >
            全部 {sprintModes.normal}题
          </button>
        </div>
      </div>

      <div className="bg-white divide-y divide-gray-50">
        {wrongCount > 0 && (
          <button
            onClick={() => onStartTask({ type: 'wrong_review' })}
            className="w-full flex items-center gap-3 px-4 py-3 bg-red-50 active:bg-red-100 transition-colors text-left"
          >
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold animate-pulse">⚠</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-red-700">错题待消灭！</p>
              <p className="text-xs text-red-400">{wrongCount} 道错题还没攻克，趁热打铁！</p>
            </div>
            <span className="text-xs font-bold text-white bg-red-500 px-2.5 py-1 rounded-full flex-shrink-0">立即练习 →</span>
          </button>
        )}

        <button
          onClick={() => onStartTask({ type: 'srs' })}
          className="w-full flex items-center gap-3 px-4 py-3 active:bg-gray-50 transition-colors text-left"
        >
          <span className={`flex-shrink-0 w-6 h-6 rounded-full ${done.includes('srs') ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'} text-xs flex items-center justify-center font-bold`}>
            {done.includes('srs') ? '✓' : '必'}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800">SRS 复习</p>
            <p className="text-xs text-gray-400">
              {mandatory.overdueCount > 0 ? `${mandatory.overdueCount} 个词/题到期待复习` : '暂无到期，做几道新题'}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-300 font-medium">{mandatory.count || 3}题 →</span>
            {!done.includes('srs') && (
              <button onClick={e => handleDone(e, 'srs')} className="text-[10px] text-gray-300 border border-gray-200 rounded px-1 py-0.5 hover:text-green-500 hover:border-green-300 transition-colors">完成</button>
            )}
          </div>
        </button>

        {anchor && (
          <button
            onClick={() => onStartTask({ type: 'anchor', tag: anchor.tag, knowledge: anchor.knowledge })}
            className="w-full flex items-center gap-3 px-4 py-3 active:bg-gray-50 transition-colors text-left"
          >
            <span className={`flex-shrink-0 w-6 h-6 rounded-full ${done.includes('anchor') ? 'bg-green-100 text-green-500' : 'bg-orange-100 text-orange-500'} text-xs flex items-center justify-center font-bold`}>
              {done.includes('anchor') ? '✓' : '攻'}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-gray-800 truncate">{anchor.tag}</p>
                <span className="flex-shrink-0 text-[10px] bg-orange-100 text-orange-500 px-1.5 py-0.5 rounded-full font-medium">第{anchor.dayNum}天</span>
                {anchor.examErrorCount > 0 && (
                  <span className="flex-shrink-0 text-[10px] bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full font-medium">考试错过{anchor.examErrorCount}次</span>
                )}
              </div>
              <p className="text-xs text-gray-400">
                {anchor.accuracy !== undefined ? `当前正确率 ${anchor.accuracy}%，专项强化` : '本周主攻知识点'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-300 font-medium">{anchor.count}题 →</span>
              {!done.includes('anchor') && (
                <button onClick={e => handleDone(e, 'anchor')} className="text-[10px] text-gray-300 border border-gray-200 rounded px-1 py-0.5 hover:text-green-500 hover:border-green-300 transition-colors">完成</button>
              )}
              <button onClick={e => { e.stopPropagation(); onClearAnchor() }} className="text-gray-300 hover:text-gray-400 text-sm ml-0.5" title="切换主攻目标">⟳</button>
            </div>
          </button>
        )}

        {optional && (
          <button
            onClick={() => onStartTask({ type: 'optional', tag: optional.tag, knowledge: optional.knowledge })}
            className="w-full flex items-center gap-3 px-4 py-3 active:bg-gray-50 transition-colors text-left"
          >
            <span className={`flex-shrink-0 w-6 h-6 rounded-full ${done.includes('optional') ? 'bg-green-100 text-green-500' : 'bg-green-100 text-green-500'} text-xs flex items-center justify-center font-bold`}>
              {done.includes('optional') ? '✓' : '选'}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800 truncate">{optional.tag}</p>
              <p className="text-xs text-gray-400">{optional.accuracy !== undefined ? `正确率 ${optional.accuracy}%` : '额外挑战'}·可选做</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-300 font-medium">{optional.count}题 →</span>
              {!done.includes('optional') && (
                <button onClick={e => handleDone(e, 'optional')} className="text-[10px] text-gray-300 border border-gray-200 rounded px-1 py-0.5 hover:text-green-500 hover:border-green-300 transition-colors">完成</button>
              )}
            </div>
          </button>
        )}
      </div>
    </div>
  )
}
