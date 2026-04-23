import { useState, useEffect, useRef } from 'react'
import { socraticFollowUp, feynmanVerify } from '../utils/ai_v2'

const MAX_ROUNDS = 3

/**
 * 苏格拉底提问 + 费曼验证 对话组件
 *
 * Props:
 * - question: 原题对象
 * - studentAnswer: 学生的错误答案
 * - subject: 学科 (chinese/english/math/politics)
 * - onComplete(result): { understood, feynmanPassed, rounds }
 * - onSkip(): 跳过回调
 */
export default function SocraticDialogue({ question, studentAnswer, subject = 'chinese', onComplete, onSkip }) {
  const [phase, setPhase] = useState('loading')   // loading → questioning → feynman → done
  const [aiQuestion, setAiQuestion] = useState('')
  const [aiHint, setAiHint] = useState('')
  const [evaluation, setEvaluation] = useState('')
  const [input, setInput] = useState('')
  const [round, setRound] = useState(0)
  const [history, setHistory] = useState([])
  const [showHint, setShowHint] = useState(false)
  const [feynmanResult, setFeynmanResult] = useState(null)
  const [error, setError] = useState(null)
  const chatRef = useRef(null)

  // 第一轮：生成初始苏格拉底问题
  useEffect(() => {
    if (phase !== 'loading') return
    async function init() {
      try {
        const r = await socraticFollowUp(question, studentAnswer, [], subject)
        setAiQuestion(r.question || '')
        setAiHint(r.hint || '')
        setEvaluation(r.evaluation || '')
        setPhase('questioning')
        setRound(1)
      } catch (e) {
        setError('AI 提问失败：' + e.message)
        setPhase('questioning')
      }
    }
    init()
  }, [phase, question, studentAnswer, subject])

  // 自动滚到底部
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [history, aiQuestion, phase])

  async function handleSubmitAnswer() {
    if (!input.trim()) return
    const studentMsg = input.trim()
    setInput('')
    const newHistory = [...history, { role: 'assistant', content: aiQuestion }, { role: 'user', content: studentMsg }]
    setHistory(newHistory)

    if (round >= MAX_ROUNDS) {
      enterFeynman(newHistory)
      return
    }

    try {
      const r = await socraticFollowUp(question, studentAnswer, newHistory, subject)
      setAiQuestion(r.question || '')
      setAiHint(r.hint || '')
      setEvaluation(r.evaluation || '')
      setShowHint(false)

      if (r.isFinal || round + 1 >= MAX_ROUNDS) {
        enterFeynman(newHistory)
      } else {
        setRound(prev => prev + 1)
      }
    } catch (e) {
      setError('AI 提问失败，直接进入验证环节')
      enterFeynman(newHistory)
    }
  }

  function enterFeynman(h) {
    setPhase('feynman')
    setHistory(h || history)
  }

  async function handleFeynmanSubmit() {
    if (!input.trim()) return
    const explanation = input.trim()
    setInput('')

    try {
      const r = await feynmanVerify(question, explanation, subject)
      setFeynmanResult(r)
      setPhase('done')
      onComplete?.({
        understood: r.passed,
        feynmanPassed: r.passed,
        rounds: round,
        score: r.score,
      })
    } catch (e) {
      setFeynmanResult({ passed: true, score: 60, feedback: '验证失败，默认通过', misunderstanding: '' })
      setPhase('done')
      onComplete?.({ understood: true, feynmanPassed: true, rounds: round, score: 60 })
    }
  }

  return (
    <div className="flex flex-col bg-gradient-to-b from-blue-50 to-indigo-50 rounded-2xl overflow-hidden"
      style={{ minHeight: 320 }}>

      {/* 头部 */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-3 flex items-center gap-2">
        <span className="text-lg">🧠</span>
        <span className="font-bold text-sm">苏格拉底提问法</span>
        {phase === 'questioning' && (
          <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">
            第 {round}/{MAX_ROUNDS} 轮
          </span>
        )}
        {phase === 'feynman' && (
          <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">
            费曼验证
          </span>
        )}
      </div>

      {/* 对话区 */}
      <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ maxHeight: 240 }}>
        {error && (
          <div className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-xl">{error}</div>
        )}

        {/* 历史消息 */}
        {history.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-indigo-500 text-white rounded-br-sm'
                : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {/* 当前 AI 问题 */}
        {phase === 'questioning' && aiQuestion && (
          <div className="flex justify-start">
            <div className="max-w-[85%] bg-white text-gray-800 px-3 py-2 rounded-2xl rounded-bl-sm shadow-sm border border-gray-100 text-sm leading-relaxed">
              {aiQuestion}
              {aiHint && (
                <button onClick={() => setShowHint(!showHint)}
                  className="block mt-2 text-xs text-amber-600 font-medium">
                  {showHint ? '💡 收起提示' : '💡 需要提示？'}
                </button>
              )}
              {showHint && aiHint && (
                <div className="mt-1 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">
                  {aiHint}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 费曼验证提问 */}
        {phase === 'feynman' && (
          <div className="flex justify-start">
            <div className="max-w-[85%] bg-green-50 text-green-800 px-3 py-2 rounded-2xl rounded-bl-sm border border-green-200 text-sm leading-relaxed">
              <div className="font-bold text-xs mb-1">🎓 费曼验证</div>
              用你自己的话说说：为什么正确答案「{question?.answer?.length > 20 ? question.answer.slice(0, 20) + '…' : question?.answer}」是对的？
            </div>
          </div>
        )}

        {/* 完成结果 */}
        {phase === 'done' && feynmanResult && (
          <div className={`rounded-2xl p-4 ${
            feynmanResult.passed ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'
          }`}>
            <div className={`text-base font-bold ${feynmanResult.passed ? 'text-green-600' : 'text-amber-600'}`}>
              {feynmanResult.passed ? '✅ 真正理解了！' : '⚠️ 还需要再练习'}
            </div>
            {feynmanResult.feedback && (
              <p className="text-sm text-gray-700 mt-1">{feynmanResult.feedback}</p>
            )}
            {feynmanResult.misunderstanding && (
              <p className="text-xs text-amber-700 mt-1">理解偏差：{feynmanResult.misunderstanding}</p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              苏格拉底 {round} 轮 · 费曼 {feynmanResult.score} 分
            </p>
          </div>
        )}
      </div>

      {/* 输入区 */}
      {phase === 'questioning' && (
        <div className="bg-white border-t border-gray-100 px-4 py-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && input.trim() && handleSubmitAnswer()}
              placeholder="输入你的想法..."
              className="flex-1 border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-400"
              style={{ fontSize: '16px' }}
            />
            <button
              onClick={handleSubmitAnswer}
              disabled={!input.trim()}
              className="bg-indigo-500 text-white rounded-full px-4 py-2.5 text-sm font-bold disabled:bg-gray-200 disabled:text-gray-400 active:scale-95 transition-transform"
            >
              发送
            </button>
          </div>
        </div>
      )}

      {phase === 'feynman' && (
        <div className="bg-white border-t border-gray-100 px-4 py-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && input.trim() && handleFeynmanSubmit()}
              placeholder="用自己的话解释..."
              className="flex-1 border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-green-400"
              style={{ fontSize: '16px' }}
            />
            <button
              onClick={handleFeynmanSubmit}
              disabled={!input.trim()}
              className="bg-green-500 text-white rounded-full px-4 py-2.5 text-sm font-bold disabled:bg-gray-200 disabled:text-gray-400 active:scale-95 transition-transform"
            >
              提交
            </button>
          </div>
        </div>
      )}

      {phase === 'loading' && (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mr-3" />
          <span className="text-sm text-gray-500">AI 正在思考如何引导你...</span>
        </div>
      )}

      {/* 跳过按钮 */}
      {phase !== 'done' && phase !== 'loading' && onSkip && (
        <div className="px-4 pb-2">
          <button onClick={onSkip} className="text-xs text-gray-400 underline w-full text-center">
            跳过，直接看答案
          </button>
        </div>
      )}
    </div>
  )
}
