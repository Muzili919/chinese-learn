import { useState, useMemo } from 'react'
import { storage } from '../utils/storage'

const MATH_TOPICS = [
  {
    id: 'math_basic',
    topic: '数与运算',
    label: '数与运算',
    emoji: '🔢',
    color: 'from-blue-400 to-blue-600',
    desc: '分数·小数·百分数·比例·运算顺序',
    questionCount: 40,
  },
  {
    id: 'math_geometry',
    topic: '图形与空间',
    label: '图形与空间',
    emoji: '📐',
    color: 'from-green-400 to-teal-600',
    desc: '平面图形·立体图形·面积·体积·单位换算',
    questionCount: 35,
  },
  {
    id: 'math_olympiad',
    topic: '奥数专题',
    label: '奥数专题',
    emoji: '🏆',
    color: 'from-orange-400 to-red-500',
    desc: '行程追及·工程问题·鸡兔同笼·植树·年龄',
    questionCount: 35,
  },
]

export default function MathHomePage({ user, onStartQuiz, onStartFormula }) {
  const records = useMemo(() => storage.getRecords(user.id), [user.id])

  const mathRecords = useMemo(
    () => records.filter(r => r.subject === 'math'),
    [records]
  )

  const todayCorrect = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const todayR = mathRecords.filter(r => r.timestamp?.startsWith(today))
    if (!todayR.length) return null
    return Math.round(todayR.filter(r => r.correct).length / todayR.length * 100)
  }, [mathRecords])

  const totalAnswered = mathRecords.length
  const totalCorrect = mathRecords.filter(r => r.correct).length
  const totalAccuracy = totalAnswered > 0 ? Math.round(totalCorrect / totalAnswered * 100) : null

  // 每个专题的答题情况
  const topicStats = useMemo(() => {
    const map = {}
    for (const r of mathRecords) {
      const topic = r.knowledge_tag || '其他'
      if (!map[topic]) map[topic] = { total: 0, correct: 0 }
      map[topic].total++
      if (r.correct) map[topic].correct++
    }
    return map
  }, [mathRecords])

  return (
    <div className="flex flex-col pb-24">

      {/* 标题区 */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">🔢</span>
          <h2 className="text-xl font-bold text-gray-800">数学星图</h2>
        </div>
        <p className="text-xs text-gray-400">小学 5-6 年级 · 110道题 · 50个公式</p>
      </div>

      {/* 快速统计卡片 */}
      {totalAnswered > 0 && (
        <div className="mx-4 mb-4 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-4 flex gap-3">
          <div className="text-center flex-1">
            <div className="text-2xl font-extrabold text-indigo-600">{totalAnswered}</div>
            <div className="text-[10px] text-indigo-400 mt-0.5 font-medium">已答题数</div>
          </div>
          <div className="w-px bg-indigo-100" />
          <div className="text-center flex-1">
            <div className="text-2xl font-extrabold text-green-600">
              {todayCorrect !== null ? `${todayCorrect}%` : (totalAccuracy !== null ? `${totalAccuracy}%` : '—')}
            </div>
            <div className="text-[10px] text-green-400 mt-0.5 font-medium">
              {todayCorrect !== null ? '今日正确率' : '总正确率'}
            </div>
          </div>
          <div className="w-px bg-indigo-100" />
          <div className="text-center flex-1">
            <div className="text-2xl font-extrabold text-orange-500">
              {Object.keys(topicStats).length}
            </div>
            <div className="text-[10px] text-orange-400 mt-0.5 font-medium">已涉及知识点</div>
          </div>
        </div>
      )}

      {/* 三大专题 */}
      <div className="px-4 flex flex-col gap-3">
        {MATH_TOPICS.map(topic => {
          // 统计该专题的答题数
          const topicRecords = mathRecords.filter(r => r.topic === topic.topic)
          const topicTotal = topicRecords.length
          const topicAcc = topicTotal > 0
            ? Math.round(topicRecords.filter(r => r.correct).length / topicTotal * 100)
            : null

          return (
            <button
              key={topic.id}
              onClick={() => onStartQuiz({ mathTopic: topic.topic })}
              className={`bg-gradient-to-br ${topic.color} text-white rounded-2xl p-4 flex items-center gap-4 shadow-sm active:scale-95 transition-transform text-left`}
            >
              <span className="text-4xl leading-none">{topic.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base">{topic.label}</span>
                  <span className="text-[10px] bg-white/25 text-white px-1.5 py-0.5 rounded-full font-medium">
                    {topic.questionCount}题
                  </span>
                </div>
                <div className="text-xs text-white/80 mt-0.5 truncate">{topic.desc}</div>
                {topicTotal > 0 && (
                  <div className="text-[10px] text-white/60 mt-1">
                    已练 {topicTotal} 题 · 正确率 {topicAcc}%
                  </div>
                )}
              </div>
              <span className="text-white/60 text-xl flex-shrink-0">›</span>
            </button>
          )
        })}

        {/* 公式速记卡片 */}
        <button
          onClick={onStartFormula}
          className="bg-gradient-to-br from-violet-400 to-purple-600 text-white rounded-2xl p-4 flex items-center gap-4 shadow-sm active:scale-95 transition-transform text-left"
        >
          <span className="text-4xl leading-none">📋</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base">公式速记</span>
              <span className="text-[10px] bg-white/25 text-white px-1.5 py-0.5 rounded-full font-medium">
                50张
              </span>
            </div>
            <div className="text-xs text-white/80 mt-0.5">SRS 闪卡 · 面积·体积·运算定律·分数法则</div>
          </div>
          <span className="text-white/60 text-xl flex-shrink-0">›</span>
        </button>

        {/* AI自测入口 */}
        <button
          onClick={() => onStartQuiz({ selfTest: true, selfTestSubject: 'math' })}
          className="bg-gradient-to-br from-amber-400 to-orange-500 text-white rounded-2xl p-4 flex items-center gap-4 shadow-sm active:scale-95 transition-transform text-left"
        >
          <span className="text-4xl leading-none">🧪</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base">AI 模拟测试</span>
              <span className="text-[10px] bg-white/25 text-white px-1.5 py-0.5 rounded-full font-medium">
                AI出卷
              </span>
            </div>
            <div className="text-xs text-white/80 mt-0.5">智能组题 · 查漏补缺 · 应用题解析</div>
          </div>
          <span className="text-white/60 text-xl flex-shrink-0">›</span>
        </button>
      </div>

      {/* 学习建议 */}
      {totalAnswered === 0 && (
        <div className="mx-4 mt-4 bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <p className="text-sm font-bold text-amber-700 mb-1">💡 新手建议</p>
          <p className="text-xs text-amber-600">
            先从「数与运算」开始，打好基础！每天练习 10 题，配合公式速记效果更佳。
          </p>
        </div>
      )}
    </div>
  )
}
