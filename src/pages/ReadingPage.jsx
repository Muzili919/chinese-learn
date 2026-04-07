import { useState, useMemo, useRef, useEffect } from 'react'
import { storage, updateStreak } from '../utils/storage'
import { updateSRS, toQuality } from '../utils/srs'
import { syncAfterSession } from '../utils/sync'
import ReadingAnswerInput from '../components/ReadingAnswerInput'
import tips from '../data/reading_tips.json'
import readingQuestions from '../data/questions_reading.json'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function shuffleOptions(q) {
  if (!q.options || q.options.length === 0) return q
  const opts = shuffle(q.options)
  return { ...q, options: opts }
}

// ── 开放性题目组件（阅读理解，智能批改）──────────────────────────
function OpenEndedCard({ question, onCorrect, onWrong }) {
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(correct, answer) {
    setSubmitted(true)
    if (correct) {
      onCorrect(answer)
    } else {
      onWrong()
    }
  }

  if (submitted) {
    return null
  }

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 mb-4">
      <div className="flex gap-2 mb-2">
        <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full">阅读理解</span>
        <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">开放作答</span>
      </div>
      
      {/* 题目内容 */}
      <div className="text-gray-800 mb-4 whitespace-pre-line">
        {question.question}
      </div>

      {/* 智能批改答题组件 */}
      <ReadingAnswerInput
        question={question}
        onAnswerSubmit={handleSubmit}
      />
    </div>
  )
}

// ── 阅读练习页面主组件 ────────────────────────────────
export default function ReadingPage() {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [session, setSession] = useState([])
  const [showTip, setShowTip] = useState(false)
  const tipTimer = useRef(null)

  // 初始化题目会话
  useEffect(() => {
    const shuffled = shuffle(readingQuestions).map(shuffleOptions)
    setSession(shuffled.slice(0, 5))
  }, [])

  const currentQ = session[currentIdx]

  function handleCorrect(answer) {
    const quality = toQuality('easy')
    updateSRS(currentQ.id, quality, Date.now())
    storage.saveAnswer(currentQ.id, { answer, correct: true, time: Date.now() })
    nextQuestion()
  }

  function handleWrong() {
    const quality = toQuality('hard')
    updateSRS(currentQ.id, quality, Date.now())
    storage.saveAnswer(currentQ.id, { answer: '', correct: false, time: Date.now() })
    nextQuestion()
  }

  function nextQuestion() {
    if (currentIdx < session.length - 1) {
      setCurrentIdx(i => i + 1)
    } else {
      // 结束会话
      updateStreak('reading')
      syncAfterSession()
      window.location.href = '/?tab=reading'
    }
  }

  if (!currentQ) return null

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24 pt-4">
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => window.history.back()}
          className="text-blue-600 font-medium"
        >
          ← 返回
        </button>
        <span className="text-sm text-gray-500">
          {currentIdx + 1} / {session.length}
        </span>
      </div>

      {/* 当前题目卡片 */}
      <OpenEndedCard 
        question={currentQ} 
        onCorrect={handleCorrect}
        onWrong={handleWrong}
      />

      {/* 小贴士（随机显示） */}
      {Math.random() < 0.3 && !showTip && (
        <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
          <div className="flex items-start gap-2">
            <span className="text-yellow-600">💡</span>
            <p className="text-yellow-800 text-sm">
              {tips[Math.floor(Math.random() * tips.length)]}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}