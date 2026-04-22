import { useState, useMemo, useEffect } from 'react'
import { storage } from '../utils/storage'
import { getRecommendedTask, clearAnchor } from '../utils/recommendation'
import TodayTaskCard from '../components/TodayTaskCard'

const MATH_TOPICS = {
  primary: [
    {
      id: 'math_basic',
      topic: '数与运算',
      label: '数与运算',
      emoji: '🔢',
      color: 'from-blue-400 to-blue-600',
      desc: '分数·小数·百分数·比例·运算顺序',
      questionCount: 90,
    },
    {
      id: 'math_geometry',
      topic: '图形与空间',
      label: '图形与空间',
      emoji: '📐',
      color: 'from-green-400 to-teal-600',
      desc: '平面图形·立体图形·面积·体积·单位换算',
      questionCount: 80,
    },
    {
      id: 'math_olympiad',
      topic: '奥数专题',
      label: '奥数专题',
      emoji: '🏆',
      color: 'from-orange-400 to-red-500',
      desc: '行程追及·工程问题·鸡兔同笼·植树·年龄',
      questionCount: 90,
    },
  ],
  junior: [
    {
      id: 'math_junior_equation',
      topic: '方程与不等式',
      label: '方程与不等式',
      emoji: '🔧',
      color: 'from-indigo-400 to-purple-600',
      desc: '一元一次方程·方程组·不等式·应用题',
      questionCount: 65,
    },
    {
      id: 'math_junior_function',
      topic: '函数与图像',
      label: '函数与图像',
      emoji: '📈',
      color: 'from-pink-400 to-rose-500',
      desc: '坐标系·一次函数·反比例·二次函数基础',
      questionCount: 65,
    },
    {
      id: 'math_junior_algebra',
      topic: '整式运算',
      label: '整式运算',
      emoji: '✖️',
      color: 'from-teal-400 to-cyan-500',
      desc: '整式加减乘除·乘法公式·因式分解',
      questionCount: 60,
    },
    {
      id: 'math_junior_geo',
      topic: '几何证明',
      label: '几何证明',
      emoji: '📐',
      color: 'from-amber-400 to-orange-600',
      desc: '全等三角形·勾股定理·四边形·相似·圆',
      questionCount: 84,
    },
  ],
}

const GRADE_CONFIG = {
  primary: { label: '小学', range: '5-6年级', color: 'from-blue-50 to-indigo-50', aiLabel: '小升初', aiDesc: '小升初真题难度 · 18题100分 · 计算＋应用＋综合' },
  junior:  { label: '初中', range: '7-9年级', color: 'from-purple-50 to-indigo-50', aiLabel: '中考', aiDesc: '中考真题难度 · 18题100分 · 代数＋几何＋函数' },
}

function isJunior(grade) {
  return grade === 'junior2' || grade === 'junior' || grade?.startsWith?.('junior')
}

export default function MathHomePage({ user, grade, onStartQuiz, onStartFormula }) {
  const junior = isJunior(grade)
  const level = junior ? 'junior' : 'primary'
  const config = GRADE_CONFIG[level]
  const topics = MATH_TOPICS[level]
  const totalQuestions = topics.reduce((s, t) => s + t.questionCount, 0)

  const records = useMemo(() => storage.getRecords(user.id), [user.id])

  const [taskRefresh, setTaskRefresh] = useState(0)
  const [sprintMode, setSprintMode] = useState(false)

  const todayTask = useMemo(() => {
    return getRecommendedTask(user.id, 'math')
  }, [user.id, records, taskRefresh])

  const wrongCount = useMemo(() => {
    const allWrong = storage.getWrongCardIds(user.id)
    const mathRecords = records.filter(r => r.subject === 'math')
    let count = 0
    for (const id of allWrong) {
      if (mathRecords.some(r => r.card_id === id)) count++
    }
    return count
  }, [user.id, records])

  const MATH_TAG_TO_QUIZ = {
    '数与运算': { mathTopic: '数与运算' },
    '图形与空间': { mathTopic: '图形与空间' },
    '奥数专题': { mathTopic: '奥数专题' },
    '方程与不等式': { mathTopic: '方程与不等式' },
    '函数与图像': { mathTopic: '函数与图像' },
    '整式运算': { mathTopic: '整式运算' },
    '几何证明': { mathTopic: '几何证明' },
  }

  // knowledge_tag → topic 反向映射（让 diagnose 返回的 knowledge_tag 也能找到对应 quiz）
  const KTAG_TO_TOPIC = {
    '分数运算':'数与运算','小数运算':'数与运算','百分数':'数与运算','比和比例':'数与运算',
    '运算定律':'数与运算','数的认识':'数与运算','分数加法':'数与运算','分数减法':'数与运算',
    '分数乘法':'数与运算','分数除法':'数与运算','分数混合运算':'数与运算','百分数应用':'数与运算',
    '比的应用':'数与运算','比例':'数与运算',
    '平面图形':'图形与空间','立体图形':'图形与空间','单位换算':'图形与空间','对称与变换':'图形与空间',
    '三角形面积':'图形与空间','四边形面积':'图形与空间','圆的周长面积':'图形与空间','组合图形':'图形与空间','角度计算':'图形与空间',
    '行程问题':'奥数专题','工程问题':'奥数专题','鸡兔同笼':'奥数专题','植树问题':'奥数专题',
    '年龄问题':'奥数专题','数论基础':'奥数专题','盈亏问题':'奥数专题','容斥原理':'奥数专题',
    '抽屉原理':'奥数专题','逻辑推理':'奥数专题','最优化':'奥数专题','数列规律':'奥数专题',
    '面积模型':'奥数专题','牛吃草':'奥数专题','行程进阶':'奥数专题','工程进阶':'奥数专题','浓度配比':'奥数专题',
    '等式性质':'方程与不等式','方程应用-分配':'方程与不等式','一元一次方程':'方程与不等式',
    '方程应用-行程':'方程与不等式','方程应用-工程':'方程与不等式','方程应用-利润':'方程与不等式',
    '二元一次方程组':'方程与不等式','方程组应用':'方程与不等式','一元一次不等式':'方程与不等式',
    '不等式应用':'方程与不等式','不等式组':'方程与不等式',
    '平面直角坐标系':'函数与图像','点的坐标':'函数与图像','函数概念':'函数与图像',
    '一次函数':'函数与图像','一次函数解析式':'函数与图像','一次函数应用':'函数与图像',
    '正比例函数':'函数与图像','反比例函数':'函数与图像','反比例应用':'函数与图像',
    '函数图像':'函数与图像','二次函数基础':'函数与图像',
    '用字母表示数':'整式运算','代数式求值':'整式运算','整式加减':'整式运算',
    '去括号法则':'整式运算','幂的运算':'整式运算','幂的乘方':'整式运算',
    '整式乘法':'整式运算','乘法公式':'整式运算','因式分解':'整式运算','整式除法':'整式运算',
    '相交线与平行线':'几何证明','三角形基础':'几何证明','三角形全等':'几何证明',
    '等腰三角形':'几何证明','特殊四边形':'几何证明','相似三角形':'几何证明',
    '圆的基本性质':'几何证明','几何综合':'几何证明','勾股定理':'几何证明',
  }

  function resolveMathQuiz(tag) {
    return { mathTopic: KTAG_TO_TOPIC[tag] || tag }
  }

  const handleStartTask = ({ type, tag, knowledge, maxQuestions }) => {
    const opts = resolveMathQuiz(tag)
    switch (type) {
      case 'srs':
        onStartQuiz({ mathTopic: '数与运算', grade: level, srsFirst: true, maxQuestions: maxQuestions || 3 })
        break
      case 'anchor': case 'optional':
        onStartQuiz({ ...opts, grade: level, maxQuestions: maxQuestions || 3 })
        break
      case 'quick': case 'full': {
        const anchorOpts = resolveMathQuiz(todayTask.anchor?.tag)
        onStartQuiz({ ...anchorOpts, grade: level, maxQuestions })
        break
      }
      case 'wrong_review':
        onStartQuiz({ wrongReview: true, subject: 'math' })
        break
      default:
        onStartQuiz({ mathTopic: topics[0]?.topic, grade: level })
    }
  }

  const handleClearAnchor = () => {
    clearAnchor(user.id)
    setTaskRefresh(k => k + 1)
  }

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

  // 打卡追踪
  const [refreshKey, setRefreshKey] = useState(0)
  useEffect(() => {
    const handleVisible = () => {
      if (document.visibilityState === 'visible') setRefreshKey(k => k + 1)
    }
    document.addEventListener('visibilitychange', handleVisible)
    return () => document.removeEventListener('visibilitychange', handleVisible)
  }, [])

  const practicedToday = useMemo(() => {
    return new Set(storage.getCompletedPlanetsToday(user?.id))
  }, [user?.id, records, refreshKey])

  function isTopicDone(topicName) {
    return practicedToday.has('🔢 ' + topicName)
  }

  const doneCount = topics.filter(t => isTopicDone(t.topic)).length

  return (
    <div className="flex flex-col pb-24">

      {/* 标题区 */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">🔢</span>
          <h2 className="text-xl font-bold text-gray-800">数学星图</h2>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${junior ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
            {config.label} {config.range}
          </span>
        </div>
        <p className="text-xs text-gray-400">{config.label} {config.range} · {totalQuestions}道题 · 今日已练 {doneCount}/{topics.length} 个专题</p>
      </div>

      {/* 今日任务卡片 */}
      <TodayTaskCard
        task={todayTask}
        userId={user.id}
        onStartTask={handleStartTask}
        onClearAnchor={handleClearAnchor}
        sprintMode={sprintMode}
        wrongCount={wrongCount}
        accentColor="orange"
      />

      {/* 快速统计卡片 */}
      {totalAnswered > 0 && (
        <div className={`mx-4 mb-4 bg-gradient-to-br ${config.color} border border-indigo-100 rounded-2xl p-4 flex gap-3`}>
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

      {/* 专题列表 */}
      <div className="px-4 flex flex-col gap-3">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1 mb-1">
          {junior ? '🎓 初中专题' : '📚 小学专题'}
        </div>

        {topics.map(topic => {
          const topicRecords = mathRecords.filter(r => r.topic === topic.topic)
          const topicTotal = topicRecords.length
          const topicAcc = topicTotal > 0
            ? Math.round(topicRecords.filter(r => r.correct).length / topicTotal * 100)
            : null
          const done = isTopicDone(topic.topic)

          return (
            <button
              key={topic.id}
              onClick={() => onStartQuiz({ mathTopic: topic.topic, grade: level })}
              className={`bg-gradient-to-br ${topic.color} text-white rounded-2xl p-4 flex items-center gap-4 shadow-sm active:scale-95 transition-transform text-left relative ${done ? 'ring-2 ring-green-300 ring-offset-1' : ''}`}
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
              {done && (
                <span className="absolute top-2 right-2 text-[10px] bg-white/30 text-white font-semibold px-1.5 py-0.5 rounded-full">✓</span>
              )}
            </button>
          )
        })}

        {/* 公式速记卡片 — 小学专属 */}
        {!junior && (
          <button
            onClick={onStartFormula}
            className="bg-gradient-to-br from-violet-400 to-purple-600 text-white rounded-2xl p-4 flex items-center gap-4 shadow-sm active:scale-95 transition-transform text-left"
          >
            <span className="text-4xl leading-none">📋</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base">公式速记</span>
                <span className="text-[10px] bg-white/25 text-white px-1.5 py-0.5 rounded-full font-medium">
                  50张 · 10题/次
                </span>
              </div>
              <div className="text-xs text-white/80 mt-0.5">SRS 闪卡 · 面积·体积·运算定律·分数法则</div>
            </div>
            <span className="text-white/60 text-xl flex-shrink-0">›</span>
          </button>
        )}

        {/* AI模拟测试 */}
        <button
          onClick={() => onStartQuiz({ selfTest: true, selfTestSubject: 'math', grade: level })}
          className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl p-4 flex items-center gap-4 shadow-sm active:scale-95 transition-transform text-left"
        >
          <span className="text-4xl leading-none">🧪</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base">AI 模拟测试</span>
              <span className="text-[10px] bg-white/25 text-white px-1.5 py-0.5 rounded-full font-medium">
                {config.aiLabel}
              </span>
            </div>
            <div className="text-xs text-white/80 mt-0.5">{config.aiDesc}</div>
          </div>
          <span className="text-white/60 text-xl flex-shrink-0">›</span>
        </button>

        {/* 挑战模式 */}
        <button
          onClick={() => onStartQuiz({
            mathTopic: junior ? '几何证明' : '奥数专题',
            minDifficulty: 4,
            grade: level,
          })}
          className="bg-gradient-to-br from-red-500 to-rose-700 text-white rounded-2xl p-4 flex items-center gap-4 shadow-sm active:scale-95 transition-transform text-left"
        >
          <span className="text-4xl leading-none">🔥</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-base">挑战模式</span>
              <span className="text-[10px] bg-yellow-300/30 text-yellow-100 px-1.5 py-0.5 rounded-full font-medium animate-pulse">
                HARD
              </span>
            </div>
            <div className="text-xs text-white/80 mt-0.5">
              {junior ? '竞赛级难题 · 几何证明·函数综合·方程应用' : '竞赛级难题 · 数论·行程·几何·逻辑推理'}
            </div>
          </div>
          <span className="text-white/60 text-xl flex-shrink-0">›</span>
        </button>
      </div>

      {/* 学习建议 */}
      {totalAnswered === 0 && (
        <div className="mx-4 mt-4 bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <p className="text-sm font-bold text-amber-700 mb-1">💡 新手建议</p>
          <p className="text-xs text-amber-600">
            {junior
              ? '先从「整式运算」开始，打好代数基础！每天练习 10 题，循序渐进。'
              : '先从「数与运算」开始，打好基础！每天练习 10 题，配合公式速记效果更佳。'
            }
          </p>
        </div>
      )}
    </div>
  )
}
