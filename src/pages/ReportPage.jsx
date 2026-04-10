import { useState, useMemo } from 'react'
import { storage } from '../utils/storage'
import { diagnose, getWeakPoints, getKnowledgeSummary, getActivityHeatmap } from '../utils/diagnosis'
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip,
} from 'recharts'

const STATUS_COLOR = { good: '#22c55e', slow: '#f59e0b', weak: '#ef4444' }
const STATUS_LABEL = { good: '良好', slow: '需提速', weak: '需加强' }

export default function ReportPage({ user, onBack }) {
  const [pinInput, setPinInput] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [pinError, setPinError] = useState(false)
  const [reportSubject, setReportSubject] = useState('chinese') // 'chinese' | 'english'

  const allRecords = storage.getRecords(user.id)
  const sessions = storage.getSessions(user.id)

  // 按科目分组
  const chineseRecords = useMemo(() =>
    allRecords.filter(r => !r.subject || r.subject === 'chinese'), [allRecords])
  const englishRecords = useMemo(() =>
    allRecords.filter(r => r.subject === 'english'), [allRecords])

  const records = reportSubject === 'english' ? englishRecords : chineseRecords

  const diagnosisResult = useMemo(() => {
    if (!records.length) return {}
    return diagnose(records)
  }, [records])

  const weakPoints = useMemo(() => getWeakPoints(diagnosisResult), [diagnosisResult])
  const knowledgeSummary = useMemo(() => getKnowledgeSummary(diagnosisResult), [diagnosisResult])
  const heatmap = useMemo(() => getActivityHeatmap(sessions), [sessions])

  const radarData = useMemo(() =>
    Object.entries(diagnosisResult).map(([tag, d]) => ({
      subject: tag,
      value: d.accuracy,
      fullMark: 100,
    })), [diagnosisResult])

  function handleUnlock(e) {
    e.preventDefault()
    const saved = user.pin || '1234'
    if (pinInput === saved) {
      setUnlocked(true)
    } else {
      setPinError(true)
      setTimeout(() => setPinError(false), 1500)
    }
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-xl font-bold text-gray-800 mb-1">家长报告</h1>
        <p className="text-gray-400 text-sm mb-6">请输入家长密码查看</p>
        <form onSubmit={handleUnlock} className="w-full max-w-xs">
          <input
            autoFocus
            type="number"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.slice(0, 4))}
            placeholder="4位密码"
            className={`w-full border-2 rounded-xl px-4 py-3 text-lg text-center mb-3 focus:outline-none transition-colors ${
              pinError ? 'border-red-400 bg-red-50' : 'border-indigo-200 focus:border-indigo-500'
            }`}
          />
          {pinError && <p className="text-red-500 text-sm text-center mb-2">密码错误</p>}
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl"
          >
            查看报告
          </button>
          <button
            type="button"
            onClick={onBack}
            className="mt-2 w-full text-gray-400 py-2 text-sm"
          >
            ← 返回
          </button>
        </form>
      </div>
    )
  }

  const totalCorrect = records.filter((r) => r.correct).length
  const overallAcc = records.length > 0 ? Math.round((totalCorrect / records.length) * 100) : 0
  const totalMinutes = Math.round(sessions.reduce((s, ses) => s + (ses.durationSec || 0), 0) / 60)
  const streak = storage.getStreak(user.id)

  const SUBJECT_TABS = [
    { id: 'chinese', label: '语文 📖', count: chineseRecords.length },
    { id: 'english', label: '英语 🌎', count: englishRecords.length },
  ]

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-700 to-purple-800 text-white px-5 pt-10 pb-6">
        <button onClick={onBack} className="text-indigo-200 text-sm mb-3">← 返回</button>
        <h1 className="text-2xl font-bold">{user.name} 的学习报告</h1>
        <p className="text-indigo-200 text-sm mt-1">
          共答 {allRecords.length} 题 · 累计 {totalMinutes} 分钟
        </p>

        <div className="flex gap-3 mt-4">
          {[
            { label: '总正确率', value: `${overallAcc}%` },
            { label: '连续打卡', value: `${streak.count}天` },
            { label: '学习天数', value: `${sessions.length}次` },
          ].map(({ label, value }) => (
            <div key={label} className="flex-1 bg-white/10 rounded-xl p-3 text-center">
              <div className="text-xl font-bold">{value}</div>
              <div className="text-indigo-200 text-xs mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 科目切换 Tab */}
      <div className="flex border-b border-gray-200 bg-white">
        {SUBJECT_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setReportSubject(tab.id)}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              reportSubject === tab.id
                ? 'text-indigo-600 border-b-2 border-indigo-500'
                : 'text-gray-400'
            }`}
          >
            {tab.label}
            <span className="ml-1 text-xs opacity-60">({tab.count}题)</span>
          </button>
        ))}
      </div>

      {/* 题数不足提示 */}
      {records.length < 5 && (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="text-5xl mb-4">📊</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">
            {reportSubject === 'english' ? '英语' : '语文'}数据还不够
          </h1>
          <p className="text-gray-500 text-sm">至少答 5 道题后才能生成报告</p>
          <p className="text-gray-400 text-sm mt-1">当前：{records.length} 题</p>
        </div>
      )}

      {records.length >= 5 && <div className="px-4 pt-5 space-y-5">
        {/* 14-day heatmap */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-500 mb-3">近14天答题量</h2>
          <div className="flex gap-1.5 items-end">
            {heatmap.map(({ date, count }) => {
              const dateLabel = date.slice(5) // MM-DD
              const height = count > 0 ? Math.max(8, Math.min(48, count * 2)) : 4
              return (
                <div key={date} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-sm transition-all ${
                      count === 0 ? 'bg-gray-100' : count < 10 ? 'bg-indigo-200' : count < 20 ? 'bg-indigo-400' : 'bg-indigo-600'
                    }`}
                    style={{ height: `${height}px` }}
                  />
                  <span className="text-gray-300 text-[9px] leading-none">{dateLabel.slice(3)}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Knowledge summary */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-500 mb-3">知识领域掌握度</h2>
          {knowledgeSummary.map(({ name, accuracy, total }) => (
            <div key={name} className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">{name}</span>
                <span className={`font-bold ${accuracy >= 80 ? 'text-green-600' : accuracy >= 60 ? 'text-amber-600' : 'text-red-500'}`}>
                  {accuracy}% <span className="text-gray-400 font-normal text-xs">({total}题)</span>
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${accuracy >= 80 ? 'bg-green-400' : accuracy >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
                  style={{ width: `${accuracy}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Radar chart */}
        {radarData.length >= 3 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold text-gray-500 mb-3">能力雷达图</h2>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <Radar name="掌握度" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
                <Tooltip formatter={(v) => `${v}%`} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Weak points detail */}
        {weakPoints.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold text-gray-500 mb-3">⚠️ 重点关注</h2>
            <div className="space-y-3">
              {weakPoints.map(({ tag, accuracy: acc, avgTime, total, status }) => (
                <div key={tag} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div
                    className="w-2 h-10 rounded-full flex-shrink-0"
                    style={{ backgroundColor: STATUS_COLOR[status] }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800 text-sm">{tag}</span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          color: STATUS_COLOR[status],
                          backgroundColor: STATUS_COLOR[status] + '20',
                        }}
                      >
                        {STATUS_LABEL[status]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      正确率 {acc}% · 平均用时 {avgTime}秒 · 共{total}题
                    </p>
                    {status === 'weak' && (
                      <p className="text-xs text-red-500 mt-0.5">建议多做强化练习</p>
                    )}
                    {status === 'slow' && (
                      <p className="text-xs text-amber-500 mt-0.5">答对但反应慢，需要熟练度练习</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All ability tags */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-500 mb-3">所有能力点</h2>
          <div className="space-y-2">
            {Object.entries(diagnosisResult)
              .sort((a, b) => b[1].accuracy - a[1].accuracy)
              .map(([tag, { accuracy: acc, total, status }]) => (
                <div key={tag} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-24 flex-shrink-0">{tag}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${acc}%`,
                        backgroundColor: STATUS_COLOR[status],
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-600 w-10 text-right">{acc}%</span>
                  <span className="text-xs text-gray-300 w-8 text-right">{total}题</span>
                </div>
              ))}
          </div>
        </div>
      </div>}
    </div>
  )
}
