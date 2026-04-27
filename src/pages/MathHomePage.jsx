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
      desc: '分数·小数·百分数·比例',
    },
    {
      id: 'math_geometry',
      topic: '图形与空间',
      label: '图形与空间',
      emoji: '📐',
      color: 'from-green-400 to-teal-600',
      desc: '平面图形·立体图形·面积·体积',
    },
    {
      id: 'math_olympiad',
      topic: '奥数专题',
      label: '奥数专题',
      emoji: '🏆',
      color: 'from-orange-400 to-red-500',
      desc: '行程·工程·鸡兔同笼·植树',
    },
    {
      id: 'math_formula_p',
      topic: '公式速记',
      label: '公式速记',
      emoji: '📋',
      color: 'from-violet-400 to-purple-600',
      desc: '面积·体积·运算定律·分数法则',
      isFormula: true,
    },
  ],
  junior: [
    {
      id: 'math_junior_equation',
      topic: '方程与不等式',
      label: '方程',
      emoji: '🔧',
      color: 'from-indigo-400 to-purple-600',
      desc: '一元一次方程·方程组·不等式',
    },
    {
      id: 'math_junior_function',
      topic: '函数与图像',
      label: '函数',
      emoji: '📈',
      color: 'from-pink-400 to-rose-500',
      desc: '一次函数·反比例·二次函数',
    },
    {
      id: 'math_junior_algebra',
      topic: '整式运算',
      label: '整式',
      emoji: '✖️',
      color: 'from-teal-400 to-cyan-500',
      desc: '整式加减·乘法公式·因式分解',
    },
    {
      id: 'math_junior_geo',
      topic: '几何证明',
      label: '几何',
      emoji: '📐',
      color: 'from-amber-400 to-orange-600',
      desc: '全等·勾股定理·四边形·圆',
    },
    {
      id: 'math_formula_j',
      topic: '公式速记(初中)',
      label: '公式',
      emoji: '📋',
      color: 'from-violet-400 to-purple-600',
      desc: '代数公式·几何定理·函数公式',
      isFormula: true,
    },
  ],
}

const MATH_SPECIAL = [
  { id: 'math_ai', label: 'AI模拟', emoji: '🧪', color: 'from-indigo-500 to-purple-600', desc: 'AI组卷·真题难度·能力诊断', isSelfTest: true },
  { id: 'math_challenge', label: '挑战模式', emoji: '🔥', color: 'from-red-500 to-rose-700', desc: '竞赛级难题·综合应用', isChallenge: true },
]

const GRADE_CONFIG = {
  primary: { label: '小学', range: '5-6年级', color: 'from-blue-50 to-indigo-50', aiLabel: '小升初', aiDesc: '小升初真题难度 · 18题100分' },
  junior:  { label: '初中', range: '7-9年级', color: 'from-purple-50 to-indigo-50', aiLabel: '中考', aiDesc: '中考真题难度 · 18题100分' },
}

function isJunior(grade) {
  return grade === 'junior2' || grade === 'junior' || grade?.startsWith?.('junior')
}

export default function MathHomePage({ user, grade, onStartQuiz, onStartFormula }) {
  const junior = isJunior(grade)
  const level = junior ? 'junior' : 'primary'
  const config = GRADE_CONFIG[level]
  const topics = MATH_TOPICS[level]

  const records = useMemo(() => storage.getRecords(user.id), [user.id])

  const [taskRefresh, setTaskRefresh] = useState(0)
  const [sprintMode, setSprintMode] = useState(false)

  const todayTask = useMemo(() => {
    return getRecommendedTask(user.id, 'math')
  }, [user.id, records, taskRefresh])

  const wrongCount = useMemo(() => {
    const allWrong = storage.getWrongCardIds(user.id)
    const mathRecs = records.filter(r => r.subject === 'math' || r.subject === 'math_junior')
    let count = 0
    for (const id of allWrong) {
      if (mathRecs.some(r => r.card_id === id)) count++
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

  const KTAG_TO_TOPIC = {
    '分数运算':'数与运算','小数运算':'数与运算','百分数':'数与运算','比和比例':'数与运算',
    '运算定律':'数与运算','数的认识':'数与运算',
    '平面图形':'图形与空间','立体图形':'图形与空间','单位换算':'图形与空间','对称与变换':'图形与空间',
    '三角形面积':'图形与空间','四边形面积':'图形与空间','圆的周长面积':'图形与空间','组合图形':'图形与空间','角度计算':'图形与空间',
    '行程问题':'奥数专题','工程问题':'奥数专题','鸡兔同笼':'奥数专题','植树问题':'奥数专题',
    '年龄问题':'奥数专题','数论基础':'奥数专题','容斥原理':'奥数专题',
    '抽屉原理':'奥数专题','逻辑推理':'奥数专题','最优化':'奥数专题','面积模型':'奥数专题','牛吃草':'奥数专题','浓度配比':'奥数专题',
    '等式性质':'方程与不等式','一元一次方程':'方程与不等式',
    '二元一次方程组':'方程与不等式','一元一次不等式':'方程与不等式',
    '平面直角坐标系':'函数与图像','函数概念':'函数与图像',
    '一次函数':'函数与图像','反比例函数':'函数与图像','二次函数基础':'函数与图像',
    '整式加减':'整式运算','幂的运算':'整式运算',
    '整式乘法':'整式运算','乘法公式':'整式运算','因式分解':'整式运算','整式除法':'整式运算',
    '相交线与平行线':'几何证明','三角形全等':'几何证明',
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
        const anchorTag = todayTask.anchor?.tag || todayTask.optional?.tag || topics[0]?.topic
        const anchorOpts = resolveMathQuiz(anchorTag)
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
    clearAnchor(user.id, "math")
    setTaskRefresh(k => k + 1)
  }

  const mathRecords = useMemo(
    () => records.filter(r => r.subject === 'math' || r.subject === 'math_junior'),
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

  function handleTopicClick(topic) {
    if (topic.isFormula) {
      onStartFormula({ grade: level })
    } else {
      onStartQuiz({ mathTopic: topic.topic, grade: level })
    }
  }

  function handleSpecialClick(special) {
    if (special.isSelfTest) {
      onStartQuiz({ selfTest: true, selfTestSubject: 'math', grade: level })
    } else if (special.isChallenge) {
      onStartQuiz({
        mathTopic: junior ? '几何证明' : '奥数专题',
        minDifficulty: 4,
        grade: level,
      })
    }
  }

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
        <p className="text-xs text-gray-400">今日已练 {doneCount}/{topics.length} 个专题</p>
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
              {doneCount}/{topics.length}
            </div>
            <div className="text-[10px] text-orange-400 mt-0.5 font-medium">今日完成</div>
          </div>
        </div>
      )}

      {/* 核心星球 */}
      <div className="flex-1 px-4 pb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-700">
            {junior ? '🎓 初中专题' : '📚 小学专题'}
          </h2>
        </div>

        {/* 小学: grid-cols-2 (2×2), 初中: grid-cols-3 (前3+后2居中) */}
        <div className={`grid ${junior ? 'grid-cols-3' : 'grid-cols-2'} gap-2.5 mb-4`}>
          {topics.map(topic => {
            const done = isTopicDone(topic.topic)
            return (
              <button
                key={topic.id}
                onClick={() => handleTopicClick(topic)}
                className={`bg-gradient-to-br ${topic.color} text-white rounded-xl p-3 flex flex-col items-center justify-center gap-1 shadow-sm active:scale-95 transition-transform relative min-h-[90px] ${done ? 'ring-2 ring-green-300 opacity-80' : ''}`}
              >
                <span className="text-3xl leading-none">{topic.emoji}</span>
                <span className="text-xs font-bold text-center leading-tight">{topic.label}</span>
                {done && (
                  <span className="absolute top-1 right-1 text-[9px] bg-white/30 text-white font-semibold px-1.5 py-0.5 rounded-full">✓</span>
                )}
              </button>
            )
          })}
        </div>

        {/* 更多功能 - 横向滚动 */}
        <div>
          <p className="text-[11px] text-gray-400 mb-1.5 font-medium">✨ 更多功能</p>
          <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
            {MATH_SPECIAL.map(special => (
              <button
                key={special.id}
                onClick={() => handleSpecialClick(special)}
                className={`flex-shrink-0 w-28 bg-gradient-to-br ${special.color} text-white rounded-xl p-2.5 flex flex-col items-center justify-center gap-1 shadow-sm active:scale-95 transition-transform`}
              >
                <span className="text-2xl leading-none">{special.emoji}</span>
                <span className="text-xs font-bold leading-tight">{special.label}</span>
                <span className="text-[9px] text-white/70 leading-tight text-center">{special.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 学习建议 */}
        {totalAnswered === 0 && (
          <div className="mt-4 bg-amber-50 border border-amber-100 rounded-2xl p-4">
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

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
