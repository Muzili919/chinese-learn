import { useState, useEffect, useRef } from 'react'
import { generateVariants, evaluateQuestion } from '../utils/ai_v2'

// ─── 翻页卡片组件 ───────────────────────────────────────────────

function VariantCard({ variant, index, total, onDone }) {
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [analysisExpanded, setAnalysisExpanded] = useState(false)

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

    // 如果答错，调用 AI 做深度分析
    if (!correct) {
      try {
        const analysis = await evaluateQuestion(variant, selected, 'chinese')
        setAiAnalysis(analysis)
      } catch {
        setAiAnalysis(null)
      }
    }

    onDone(correct)
  }

  // 下一题动画
  return (
    <div className="flex flex-col gap-4 animate-fadeIn">
      {/* 进度 */}
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
          <div
            className="h-1.5 rounded-full bg-gradient-to-r from-violet-400 to-purple-500 transition-all duration-500"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
        <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
          {index + 1} / {total}
        </span>
      </div>

      {/* 题型标签 + 易错点 */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="bg-violet-100 text-violet-700 text-xs px-3 py-1 rounded-full font-semibold">
          🔀 变式题 {index + 1}
        </span>
        {variant.knowledge_tag && (
          <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full">
            {variant.knowledge_tag}
          </span>
        )}
        {variant.commonMistake && (
          <span className="bg-amber-50 text-amber-600 text-xs px-2 py-0.5 rounded-full">
            ⚠️ {variant.commonMistake}
          </span>
        )}
      </div>

      {/* 题干 */}
      <div className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-gray-100">
        <p className="text-base text-gray-800 leading-relaxed font-medium">{variant.question}</p>
      </div>

      {/* 选择题选项 */}
      {isChoice && (
        <div className="flex flex-col gap-2">
          {variant.options.map((opt, i) => {
            let cls = 'bg-white border-2 border-gray-200 text-gray-700'
            if (submitted) {
              const optText = opt.replace(/^[A-D]\.\s*/i, '')
              const answerText = (variant.answer || '').replace(/^[A-D]\.\s*/i, '')
              const isThisCorrect = opt === variant.answer || optText === answerText || 
                (variant.answer && opt.startsWith(variant.answer.charAt(0) + '.'))
              if (isThisCorrect) cls = 'bg-green-50 border-2 border-green-400 text-green-700'
              else if (opt === selected) cls = 'bg-red-50 border-2 border-red-400 text-red-600'
              else cls = 'bg-white border-2 border-gray-100 text-gray-300'
            } else if (opt === selected) {
              cls = 'bg-violet-50 border-2 border-violet-400 text-violet-700'
            }
            return (
              <button key={i} onClick={() => handleSelect(opt)} disabled={submitted}
                className={`${cls} rounded-2xl px-4 py-3 text-left text-sm font-medium transition-all active:scale-[0.98] shadow-sm`}>
                <span className="mr-2 text-xs font-bold text-gray-400">{['A','B','C','D'][i]}.</span>
                {opt.replace(/^[A-D]\.\s*/i, '')}
              </button>
            )
          })}
        </div>
      )}

      {/* 填空题输入 */}
      {!isChoice && !submitted && (
        <input type="text" value={selected || ''}
          onChange={e => setSelected(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && selected?.trim() && handleSubmit()}
          placeholder="输入答案..."
          className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-base text-gray-800 focus:outline-none focus:border-violet-400 bg-white"
          style={{ fontSize: '16px' }}
        />
      )}

      {/* 提交按钮 */}
      {!submitted && (
        <button onClick={handleSubmit}
          disabled={isChoice ? !selected : !selected?.trim()}
          className="w-full py-3.5 rounded-2xl font-bold text-white text-base active:scale-95 transition-all disabled:bg-gray-200 disabled:text-gray-400 bg-gradient-to-r from-violet-500 to-purple-500">
          确认答案
        </button>
      )}

      {/* 答题反馈 - 分栏布局：答案 + 分析 */}
      {submitted && (
        <div className="flex flex-col gap-3">
          {/* 正确/错误反馈 */}
          <div className={`rounded-2xl px-4 py-3 border ${
            isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <div className={`font-bold text-base ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
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

          {/* AI 深度分析面板（答错时显示，可展开收起） */}
          {!isCorrect && aiAnalysis && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl overflow-hidden">
              <button
                onClick={() => setAnalysisExpanded(!analysisExpanded)}
                className="w-full flex items-center justify-between px-4 py-3 text-left"
              >
                <span className="text-sm font-bold text-blue-700">🧠 AI 教学分析</span>
                <span className="text-blue-400 text-xs">{analysisExpanded ? '收起 ▲' : '展开 ▼'}</span>
              </button>
              {analysisExpanded && (
                <div className="px-4 pb-4 space-y-3">
                  {/* 错误归因 */}
                  {aiAnalysis.errorType && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                        {aiAnalysis.errorType}
                      </span>
                    </div>
                  )}
                  {/* 教学提示 */}
                  {aiAnalysis.teachingTip && (
                    <div className="bg-white rounded-xl px-3 py-2 border border-blue-100">
                      <div className="text-xs font-semibold text-blue-600 mb-1">📚 教学讲解</div>
                      <div className="text-xs text-gray-700 leading-relaxed">{aiAnalysis.teachingTip}</div>
                    </div>
                  )}
                  {/* 关键技巧 */}
                  {aiAnalysis.keyTechnique && (
                    <div className="bg-amber-50 rounded-xl px-3 py-2 border border-amber-200">
                      <div className="text-xs font-semibold text-amber-600 mb-1">💡 关键技巧</div>
                      <div className="text-xs text-amber-800">{aiAnalysis.keyTechnique}</div>
                    </div>
                  )}
                  {/* 易错点 */}
                  {aiAnalysis.commonMistake && (
                    <div className="bg-red-50 rounded-xl px-3 py-2 border border-red-200">
                      <div className="text-xs font-semibold text-red-600 mb-1">⚠️ 易错点</div>
                      <div className="text-xs text-red-700">{aiAnalysis.commonMistake}</div>
                    </div>
                  )}
                  {/* 满分答案 */}
                  {aiAnalysis.fullAnswer && (
                    <div className="bg-green-50 rounded-xl px-3 py-2 border border-green-200">
                      <div className="text-xs font-semibold text-green-600 mb-1">✨ 满分答案</div>
                      <div className="text-xs text-green-800 leading-relaxed">{aiAnalysis.fullAnswer}</div>
                    </div>
                  )}
                  {/* 强化建议 */}
                  {aiAnalysis.reinforceSuggestion && (
                    <div className="text-xs text-gray-500 italic">
                      🎯 {aiAnalysis.reinforceSuggestion}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── 通用答案匹配 ──────────────────────────────────────
function isAnswerCorrect(userAnswer, correctAnswer, options) {
  if (!userAnswer || !correctAnswer) return false
  const ua = String(userAnswer).trim().toLowerCase().replace(/^[a-d]\.\s*/i, '')
  const ca = String(correctAnswer).trim().toLowerCase().replace(/^[a-d]\.\s*/i, '')
  if (ua === ca) return true
  // 字母匹配
  if (/^[a-d]$/i.test(correctAnswer.trim()) && options?.length) {
    const idx = correctAnswer.trim().toUpperCase().charCodeAt(0) - 65
    if (idx >= 0 && idx < options.length) {
      return ua === options[idx].replace(/^[A-D]\.\s*/i, '').trim().toLowerCase()
    }
  }
  return false
}

// ─── 主页面 ───────────────────────────────────────────────

export default function VariantTrainingPage({ question, user, onBack }) {
  const [variants, setVariants] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [results, setResults] = useState([])
  const [showSummary, setShowSummary] = useState(false)
  const touchStartX = useRef(0)
  const containerRef = useRef(null)

  // 生成变式题
  useEffect(() => {
    async function loadVariants() {
      if (!question) {
        setError('缺少原始题目信息')
        setLoading(false)
        return
      }
      try {
        const result = await generateVariants(question, 3, 'chinese')
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

  function handleVariantDone(correct) {
    const newResults = [...results, correct]
    setResults(newResults)

    // 短暂延迟后翻到下一页或显示总结
    setTimeout(() => {
      if (currentIndex + 1 >= variants.length) {
        setShowSummary(true)
      } else {
        setCurrentIndex(i => i + 1)
      }
    }, correct ? 800 : 1500)
  }

  // 手势翻页
  function handleTouchStart(e) {
    touchStartX.current = e.touches[0].clientX
  }

  function handleTouchEnd(e) {
    const diff = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(diff) < 50) return
    if (diff < 0 && currentIndex + 1 < variants.length && results.length > currentIndex) {
      // 左滑 → 下一题
      setCurrentIndex(i => i + 1)
    } else if (diff > 0 && currentIndex > 0) {
      // 右滑 → 上一题
      setCurrentIndex(i => i - 1)
    }
  }

  // 加载中
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-violet-50 to-purple-50 px-6">
        <div className="w-12 h-12 border-4 border-violet-300 border-t-violet-600 rounded-full animate-spin mb-6" />
        <p className="text-base font-bold text-violet-600">AI 正在为你出变式题...</p>
        <p className="text-sm text-gray-400 mt-2">根据原题知识点，生成3道举一反三练习</p>
      </div>
    )
  }

  // 出错
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

  // 总结页
  if (showSummary) {
    const correctCount = results.filter(Boolean).length
    const pct = Math.round((correctCount / results.length) * 100)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-violet-50 to-purple-50 px-6 py-12">
        <div className="text-7xl mb-6">{pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪'}</div>
        <h2 className="text-2xl font-extrabold text-gray-800 mb-2">举一反三完成！</h2>
        <p className="text-sm text-gray-500 mb-8">
          {pct >= 80 ? '掌握得不错！' : pct >= 50 ? '继续加油，多做几遍就熟了' : '这个知识点还需要加强练习'}
        </p>

        {/* 结果统计 */}
        <div className="flex gap-6 mb-8">
          <div className="text-center">
            <div className="text-3xl font-extrabold text-violet-600">{pct}%</div>
            <div className="text-xs text-gray-400 mt-1">正确率</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-extrabold text-green-600">{correctCount}</div>
            <div className="text-xs text-gray-400 mt-1">答对</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-extrabold text-red-500">{results.length - correctCount}</div>
            <div className="text-xs text-gray-400 mt-1">答错</div>
          </div>
        </div>

        {/* 各题结果 */}
        <div className="flex gap-2 mb-8">
          {results.map((correct, i) => (
            <div key={i} className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white ${
              correct ? 'bg-green-400' : 'bg-red-400'
            }`}>
              {correct ? '✓' : '✗'}
            </div>
          ))}
        </div>

        <button onClick={onBack}
          className="w-full max-w-xs py-3.5 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold text-base shadow-md active:scale-95 transition-transform">
          返回错题集
        </button>
      </div>
    )
  }

  const currentVariant = variants[currentIndex]

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-violet-50 to-purple-50">
      {/* 顶部栏 */}
      <div className="bg-white px-4 pt-10 pb-4 shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-gray-400 text-xl p-1">✕</button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-800">🔀 举一反三</h1>
            <p className="text-xs text-gray-400">同类知识点 · 不同题目 · 深度掌握</p>
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
              正确答案：{question?.answer?.length > 15 ? question.answer.slice(0, 15) + '…' : question?.answer}
            </span>
          </div>
        </div>
      </div>

      {/* 变式题翻页区 */}
      <div
        ref={containerRef}
        className="flex-1 px-4 py-4"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {currentVariant && (
          <VariantCard
            key={currentVariant.id}
            variant={currentVariant}
            index={currentIndex}
            total={variants.length}
            onDone={handleVariantDone}
          />
        )}
      </div>

      {/* 底部翻页控制 */}
      <div className="bg-white px-4 py-4 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between max-w-md mx-auto">
          <button
            onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="w-12 h-12 rounded-xl bg-gray-100 text-gray-400 font-bold text-lg disabled:opacity-30 active:scale-95 transition-all"
          >
            ←
          </button>

          {/* 页面指示器 */}
          <div className="flex gap-2">
            {variants.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  // 只能跳到已答过的题
                  if (i <= results.length) setCurrentIndex(i)
                }}
                className={`w-3 h-3 rounded-full transition-all ${
                  i === currentIndex ? 'bg-violet-500 w-6' :
                  i < results.length ? (results[i] ? 'bg-green-400' : 'bg-red-400') :
                  'bg-gray-200'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => {
              if (currentIndex + 1 < variants.length && results.length > currentIndex) {
                setCurrentIndex(i => i + 1)
              }
            }}
            disabled={currentIndex + 1 >= variants.length || results.length <= currentIndex}
            className="w-12 h-12 rounded-xl bg-gray-100 text-gray-400 font-bold text-lg disabled:opacity-30 active:scale-95 transition-all"
          >
            →
          </button>
        </div>
      </div>

      {/* 动画 */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease;
        }
      `}</style>
    </div>
  )
}
