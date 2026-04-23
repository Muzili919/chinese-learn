import { useState, useEffect, useRef } from 'react'
import { generateVariants } from '../utils/ai_v2'
import SocraticDialogue from '../components/SocraticDialogue'

// ─── 通用答案匹配 ──
function isAnswerCorrect(userAnswer, correctAnswer, options) {
  if (!userAnswer || !correctAnswer) return false
  const normalize = (str) => String(str).trim()
    .replace(/^[a-d]\.\s*/i, '')
    .replace(/[①-⑩]/g, m => String.fromCharCode(m.charCodeAt(0) - 0x2460 + 0x31))
    .replace(/（([0-9]+)）/g, '$1')
    .replace(/\(([0-9]+)\)/g, '$1')
    .toLowerCase()
  const ua = normalize(userAnswer)
  const ca = normalize(correctAnswer)
  if (ua === ca) return true
  if (/^[a-d]$/i.test(correctAnswer.trim()) && options?.length) {
    const idx = correctAnswer.trim().toUpperCase().charCodeAt(0) - 65
    if (idx >= 0 && idx < options.length) return ua === normalize(options[idx])
  }
  return false
}

// ─── 变式题卡片（内含苏格拉底+费曼） ──
function VariantCard({ variant, index, total, subject, onDone }) {
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [showSocratic, setShowSocratic] = useState(false)
  const [socraticComplete, setSocraticComplete] = useState(false)
  const [socraticResult, setSocraticResult] = useState(null)

  const isChoice = Array.isArray(variant.options) && variant.options.length >= 2

  function handleSelect(opt) {
    if (submitted) return
    setSelected(opt)
  }

  async function handleSubmit() {
    if (!selected && !isChoice) return
    const correct = isChoice
      ? isAnswerCorrect(selected, variant.answer, variant.options)
      : selected?.trim().toLowerCase() === (variant.answer || '').trim().toLowerCase()
    setIsCorrect(correct)
    setSubmitted(true)
  }

  function handleSocraticComplete(result) {
    setSocraticResult(result)
    setSocraticComplete(true)
  }

  function handleFinish() {
    onDone({
      correct: isCorrect,
      socraticRounds: socraticResult?.rounds || 0,
      feynmanPassed: socraticResult?.feynmanPassed ?? false,
      feynmanScore: socraticResult?.score ?? 0,
    })
  }

  // ── 答题阶段 ──
  if (!submitted) {
    return (
      <div className="flex flex-col gap-4 animate-fadeIn">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
            <div className="h-1.5 rounded-full bg-gradient-to-r from-violet-400 to-purple-500 transition-all duration-500"
              style={{ width: `${((index + 1) / total) * 100}%` }} />
          </div>
          <span className="text-xs text-gray-400 font-medium whitespace-nowrap">{index + 1} / {total}</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-violet-100 text-violet-700 text-xs px-3 py-1 rounded-full font-semibold">🔀 变式题 {index + 1}</span>
          {variant.knowledge_tag && (
            <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full">{variant.knowledge_tag}</span>
          )}
        </div>

        <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100">
          <p className="text-base text-gray-800 leading-relaxed font-medium">{variant.question}</p>
        </div>

        {isChoice && (
          <div className="flex flex-col gap-2">
            {variant.options.map((opt, i) => {
              let cls = 'bg-white border-2 border-gray-200 text-gray-700'
              if (opt === selected) cls = 'bg-violet-50 border-2 border-violet-400 text-violet-700'
              return (
                <button key={i} onClick={() => handleSelect(opt)}
                  className={`${cls} rounded-2xl px-4 py-3 text-left text-sm font-medium transition-all active:scale-[0.98] shadow-sm`}>
                  <span className="mr-2 text-xs font-bold text-gray-400">{['A','B','C','D'][i]}.</span>
                  {opt.replace(/^[A-D]\.\s*/i, '')}
                </button>
              )
            })}
          </div>
        )}

        {!isChoice && (
          <input type="text" value={selected || ''}
            onChange={e => setSelected(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && selected?.trim() && handleSubmit()}
            placeholder="输入答案..."
            className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-base text-gray-800 focus:outline-none focus:border-violet-400 bg-white"
            style={{ fontSize: '16px' }}
          />
        )}

        <button onClick={handleSubmit}
          disabled={isChoice ? !selected : !selected?.trim()}
          className="w-full py-3.5 rounded-2xl font-bold text-white text-base active:scale-95 transition-all disabled:bg-gray-200 disabled:text-gray-400 bg-gradient-to-r from-violet-500 to-purple-500">
          确认答案
        </button>
      </div>
    )
  }

  // ── 答题反馈 ──
  if (!showSocratic && !socraticComplete) {
    return (
      <div className="flex flex-col gap-4 animate-fadeIn">
        {/* 答题结果 */}
        <div className={`rounded-2xl px-4 py-4 border ${
          isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className={`font-bold text-lg ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
            {isCorrect ? '✅ 答对了！' : '❌ 答错了'}
          </div>
          {!isCorrect && variant.answer && (
            <div className="text-sm text-gray-700 mt-1">
              正确答案：<span className="font-semibold text-green-700">{variant.answer}</span>
            </div>
          )}
          {variant.analysis && (
            <div className="text-xs text-gray-500 mt-2 leading-relaxed">{variant.analysis}</div>
          )}
        </div>

        {/* 深度理解入口 */}
        <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">🧠</span>
            <span className="text-sm font-bold text-indigo-700">深度理解模式</span>
          </div>
          <p className="text-xs text-gray-600 mb-3">
            {isCorrect
              ? '答对了！让AI用苏格拉底提问法确认你是否真正理解了这个知识点'
              : '答错了没关系！AI会用追问引导你一步步理解正确思路'}
          </p>
          <button onClick={() => setShowSocratic(true)}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 text-white font-bold text-sm active:scale-95 transition-transform shadow-md">
            开始深度理解
          </button>
          <button onClick={handleFinish}
            className="w-full py-2.5 mt-2 rounded-xl text-gray-400 text-xs font-medium">
            跳过，下一题 →
          </button>
        </div>
      </div>
    )
  }

  // ── 苏格拉底+费曼对话阶段 ──
  if (showSocratic && !socraticComplete) {
    return (
      <div className="fixed inset-0 z-40 bg-gradient-to-b from-violet-50 to-purple-50 flex flex-col">
        <div className="bg-white px-4 pt-10 pb-3 shadow-sm flex items-center gap-3">
          <button onClick={() => { setShowSocratic(false) }}
            className="text-gray-400 p-1">✕</button>
          <div>
            <h2 className="text-sm font-bold text-gray-800">🧠 苏格拉底式提问</h2>
            <p className="text-[10px] text-gray-400">通过追问帮助你真正理解</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <SocraticDialogue
            question={variant}
            studentAnswer={selected || ''}
            subject={subject}
            onComplete={handleSocraticComplete}
            onSkip={() => {
              setSocraticComplete(true)
              setSocraticResult({ rounds: 0, feynmanPassed: false, score: 0 })
            }}
          />
        </div>
      </div>
    )
  }

  // ── 苏格拉底完成，显示总结 ──
  return (
    <div className="flex flex-col gap-4 animate-fadeIn">
      <div className={`rounded-2xl p-4 border ${
        isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
      }`}>
        <div className={`font-bold text-base ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
          {isCorrect ? '✅ 答对了' : '❌ 答错了'}
        </div>
        {!isCorrect && variant.answer && (
          <div className="text-sm text-gray-700 mt-1">
            正确答案：<span className="font-semibold text-green-700">{variant.answer}</span>
          </div>
        )}
      </div>

      {/* 理解度评估 */}
      {socraticResult && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <span>🧠</span>
            <span className="text-sm font-bold text-indigo-700">理解度评估</span>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">追问轮数</span>
              <span className="font-bold text-indigo-600">{socraticResult.rounds} 轮</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">费曼验证</span>
              <span className={`font-bold ${socraticResult.feynmanPassed ? 'text-green-600' : 'text-amber-600'}`}>
                {socraticResult.feynmanPassed ? '✓ 通过' : '未通过'}
              </span>
            </div>
            {socraticResult.score !== undefined && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">理解评分</span>
                <span className={`font-bold ${
                  socraticResult.score >= 80 ? 'text-green-600' :
                  socraticResult.score >= 50 ? 'text-amber-600' : 'text-red-500'
                }`}>
                  {socraticResult.score}/100
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <button onClick={handleFinish}
        className="w-full py-3.5 rounded-2xl font-bold text-white text-base active:scale-95 transition-all bg-gradient-to-r from-violet-500 to-purple-600">
        {index + 1 < total ? '下一题 →' : '查看总结'}
      </button>
    </div>
  )
}

// ─── 主页面 ──
export default function VariantTrainingPage({ question, user, onBack }) {
  const [variants, setVariants] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [results, setResults] = useState([])
  const [showSummary, setShowSummary] = useState(false)
  const touchStartX = useRef(0)

  const subject = question?.knowledge_tag?.includes('英') ? 'english'
    : question?.knowledge_tag?.includes('数') || question?.topic ? 'math' : 'chinese'

  useEffect(() => {
    async function loadVariants() {
      if (!question) { setError('缺少原始题目信息'); setLoading(false); return }
      try {
        const result = await generateVariants(question, 1, subject)
        setVariants(result.variants)
        setLoading(false)
      } catch (err) {
        console.error('Generate variants error:', err)
        setError('AI 出题失败，请稍后重试')
        setLoading(false)
      }
    }
    loadVariants()
  }, [question])

  function handleVariantDone(result) {
    const newResults = [...results, result]
    setResults(newResults)
    setTimeout(() => {
      if (currentIndex + 1 >= variants.length) {
        setShowSummary(true)
      } else {
        setCurrentIndex(i => i + 1)
      }
    }, 300)
  }

  function handleTouchStart(e) { touchStartX.current = e.touches[0].clientX }
  function handleTouchEnd(e) {
    const diff = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(diff) < 50) return
    if (diff < 0 && currentIndex + 1 < variants.length && results.length > currentIndex) setCurrentIndex(i => i + 1)
    else if (diff > 0 && currentIndex > 0) setCurrentIndex(i => i - 1)
  }

  // ── 加载中 ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-violet-50 to-purple-50 px-6">
        <div className="w-12 h-12 border-4 border-violet-300 border-t-violet-600 rounded-full animate-spin mb-6" />
        <p className="text-base font-bold text-violet-600">AI 正在出变式题...</p>
        <p className="text-sm text-gray-400 mt-2">基于原题知识点，生成同类练习</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-violet-50 to-purple-50 px-6">
        <div className="text-5xl mb-4">😵</div>
        <p className="text-lg font-bold text-gray-700 mb-2">出题失败</p>
        <p className="text-sm text-gray-400 mb-6">{error}</p>
        <button onClick={onBack}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold active:scale-95 transition-transform">
          返回错题集
        </button>
      </div>
    )
  }

  // ── 总结页 ──
  if (showSummary) {
    const correctCount = results.filter(r => r.correct).length
    const avgScore = results.filter(r => r.feynmanScore > 0).length > 0
      ? Math.round(results.filter(r => r.feynmanScore > 0).reduce((s, r) => s + r.feynmanScore, 0) / results.filter(r => r.feynmanScore > 0).length)
      : null
    const feynmanPassed = results.filter(r => r.feynmanPassed).length

    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-violet-50 to-purple-50 px-6 py-10">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{correctCount === results.length ? '🎉' : correctCount > 0 ? '👍' : '💪'}</div>
          <h2 className="text-xl font-extrabold text-gray-800 mb-1">举一反三完成</h2>
          <p className="text-sm text-gray-500">
            {correctCount === results.length ? '全部答对，掌握得不错！' : '继续练习，这个知识点会越来越熟的'}
          </p>
        </div>

        {/* 答题结果 */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-4">
          <h3 className="text-sm font-bold text-gray-800 mb-3">答题结果</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-gray-50 rounded-xl py-2">
              <div className="text-lg font-extrabold text-gray-800">{results.length}</div>
              <div className="text-[10px] text-gray-400">变式题</div>
            </div>
            <div className="bg-green-50 rounded-xl py-2">
              <div className="text-lg font-extrabold text-green-600">{correctCount}</div>
              <div className="text-[10px] text-gray-400">答对</div>
            </div>
            <div className="bg-red-50 rounded-xl py-2">
              <div className="text-lg font-extrabold text-red-500">{results.length - correctCount}</div>
              <div className="text-[10px] text-gray-400">答错</div>
            </div>
          </div>
        </div>

        {/* 理解度评估 */}
        {(avgScore !== null || feynmanPassed > 0) && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-4">
            <h3 className="text-sm font-bold text-gray-800 mb-3">🧠 理解度评估</h3>
            <div className="space-y-2">
              {results.map((r, i) => (
                <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white ${
                    r.correct ? 'bg-green-500' : 'bg-red-400'
                  }`}>
                    {r.correct ? '✓' : '✗'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-700">变式题 {i + 1}</span>
                      {r.feynmanPassed && <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full font-bold">费曼通过</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-400">追问 {r.socraticRounds} 轮</span>
                      {r.feynmanScore > 0 && (
                        <span className={`text-[10px] font-bold ${
                          r.feynmanScore >= 80 ? 'text-green-600' :
                          r.feynmanScore >= 50 ? 'text-amber-600' : 'text-red-500'
                        }`}>
                          理解 {r.feynmanScore}分
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {avgScore !== null && (
              <div className="mt-3 pt-3 border-t border-gray-100 text-center">
                <span className="text-xs text-gray-400">平均理解评分</span>
                <div className={`text-2xl font-extrabold ${
                  avgScore >= 80 ? 'text-green-600' : avgScore >= 50 ? 'text-amber-600' : 'text-red-500'
                }`}>
                  {avgScore}<span className="text-sm font-normal text-gray-400">/100</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 学习建议 */}
        <div className="bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200 rounded-2xl p-4 mb-6">
          <h3 className="text-sm font-bold text-indigo-700 mb-2">💡 学习建议</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            {avgScore !== null && avgScore >= 80
              ? '理解度很好！这个知识点已经掌握扎实了。建议隔几天再做一道类似的题巩固记忆。'
              : avgScore !== null && avgScore >= 50
              ? '有一定理解，但还不够深入。建议回顾苏格拉底追问中的关键概念，过两天再练习一次。'
              : avgScore !== null
              ? '这个知识点还需要多花时间。建议先回到基础知识，把概念弄清楚后再来做变式题。'
              : correctCount === results.length
              ? '变式题全部答对！建议以后做题时也用"讲给别人听"的方式检验自己是否真正理解。'
              : '部分变式题答错了。建议回到错题集重新复习原题，弄懂后再来练习变式题。'
            }
          </p>
        </div>

        <button onClick={onBack}
          className="w-full max-w-xs mx-auto py-3.5 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-base shadow-md active:scale-95 transition-transform">
          返回错题集
        </button>
      </div>
    )
  }

  const currentVariant = variants[currentIndex]

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-violet-50 to-purple-50">
      <div className="bg-white px-4 pt-10 pb-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-gray-400 text-xl p-1">✕</button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-800">🔀 举一反三</h1>
            <p className="text-xs text-gray-400">变式题 + 苏格拉底追问 · 深度掌握</p>
          </div>
        </div>
      </div>

      {/* 原题回顾 */}
      <div className="px-4 pt-4">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="text-xs font-bold text-amber-600 mb-2">📖 原题回顾</div>
          <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{question?.question}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-green-600 font-medium">
              正确答案：{question?.answer?.length > 20 ? question.answer.slice(0, 20) + '…' : question?.answer}
            </span>
          </div>
        </div>
      </div>

      {/* 变式题区 */}
      <div className="flex-1 px-4 py-4" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        {currentVariant && (
          <VariantCard
            key={currentVariant.id}
            variant={currentVariant}
            index={currentIndex}
            total={variants.length}
            subject={subject}
            onDone={handleVariantDone}
          />
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease; }
      `}</style>
    </div>
  )
}
