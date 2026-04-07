import { useState, useEffect, useRef, useMemo } from 'react'
import { storage, updateStreak } from '../utils/storage'
import { updateSRS, toQuality } from '../utils/srs'
import { scheduleSession } from '../utils/scheduler'
import { syncAfterSession } from '../utils/sync'
import { generateVariant } from '../utils/ai'
import MultiMeaningCard from '../components/MultiMeaningCard'
import MatchingCard from '../components/MatchingCard'
import FillBlankInput from '../components/FillBlankInput' // 添加填空题组件
import '../styles/fill-blank-mobile.css'
import vocabQ from '../data/questions_vocab.json'
import poetryQ from '../data/questions_poetry.json'
import idiomQ from '../data/questions_idiom.json'
import sentenceQ from '../data/questions_sentence.json'
import litQ from '../data/questions_literature.json'

const ALL_QUESTIONS = [...vocabQ, ...poetryQ, ...idiomQ, ...sentenceQ, ...litQ]
const SESSION_SIZE = 20

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

// ── 智能批改：关键词匹配算法 ───────────────────────────────
function smartGrade(userAnswer, referenceAnswer, keywords = []) {
  if (!userAnswer?.trim()) return { correct: false, score: 0, feedback: '答案不能为空' }

  const ua = userAnswer.trim().toLowerCase()
  const ra = referenceAnswer.toLowerCase()

  // 完全匹配
  if (ua === ra) return { correct: true, score: 100, feedback: '完全正确！' }

  // 关键词匹配
  const matchedKeywords = keywords.filter(kw => ua.includes(kw.toLowerCase()))
  const keywordScore = matchedKeywords.length / keywords.length * 80

  // 相似度计算（简化版）
  const similarity = calculateSimilarity(ua, ra)
  const similarityScore = similarity * 20

  const totalScore = Math.min(100, Math.round(keywordScore + similarityScore))
  const correct = totalScore >= 80

  let feedback = ''
  if (correct) {
    feedback = totalScore === 100 ? '完全正确！' : '基本正确，很棒！'
  } else if (totalScore >= 60) {
    feedback = '接近正确，再想想？'
  } else if (totalScore >= 40) {
    feedback = '思路对了，但表达不够准确'
  } else {
    feedback = '答案不太准确，参考标准答案'
  }

  return { correct, score: totalScore, feedback }
}

function calculateSimilarity(str1, str2) {
  if (str1 === str2) return 1
  if (str1.length === 0 || str2.length === 0) return 0
  
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  const longerLength = longer.length
  
  if (longerLength === 0) return 1.0
  
  const editDistance = levenshteinDistance(longer, shorter)
  return (longerLength - editDistance) / parseFloat(longerLength.toString())
}

function levenshteinDistance(str1, str2) {
  const matrix = Array(str2.length + 1).fill().map((_, i) => [i])
  matrix[0] = Array(str1.length + 1).fill().map((_, i) => i)
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2[i - 1] === str1[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        )
      }
    }
  }
  return matrix[str2.length][str1.length]
}

// ── 题目卡片组件 ───────────────────────────────────────
function QuestionCard({ current, onAnswer }) {
  const [selected, setSelected] = useState(null)
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [variantQ, setVariantQ] = useState(null)
  const [variantSel, setVariantSel] = useState(null)
  const [variantLoading, setVariantLoading] = useState(false)
  const [variantError, setVariantError] = useState(null)
  const [userAnswer, setUserAnswer] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isFillBlank = current.type === 'fill_blank'
  const isWrongReview = current.reviewMode === 'wrong'
  const hasVariants = !isFillBlank && isWrongReview && !variantQ && !variantError

  // 填空题提交处理
  const handleFillBlankSubmit = async (answer) => {
    setIsSubmitting(true)
    try {
      // 提取关键词（从参考答案中提取核心词汇）
      const keywords = extractKeywords(current.answer)
      const result = smartGrade(answer, current.answer, keywords)
      
      onAnswer({
        correct: result.correct,
        answer: answer,
        score: result.score,
        feedback: result.feedback
      })
    } catch (error) {
      console.error('填空题评分错误:', error)
      onAnswer({
        correct: false,
        answer: answer,
        score: 0,
        feedback: '评分出错，请重试'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 提取关键词的简单实现
  function extractKeywords(answer) {
    // 移除标点符号，按空格和常见分隔符分割
    const cleanAnswer = answer.replace(/[，。！？；：""''（）【】\[\]{}、]/g, ' ')
    const words = cleanAnswer.split(/\s+/).filter(word => word.length > 1)
    
    // 返回最重要的2-3个关键词
    return words.slice(0, 3)
  }

  function handleSelect(option) {
    if (selected !== null) return
    setSelected(option)
    setTimeout(() => {
      const correct = option === current.answer
      onAnswer({ correct, answer: option })
      setShowAnalysis(true)
    }, 300)
  }

  function handleGenerateVariant() {
    if (variantLoading) return
    setVariantLoading(true)
    setVariantError(null)
    
    generateVariant(current)
      .then(vq => {
        setVariantQ(vq)
        setVariantSel(null)
      })
      .catch(err => {
        console.error('变种题生成失败:', err)
        setVariantError('AI出题失败，请稍后重试')
      })
      .finally(() => setVariantLoading(false))
  }

  function handleVariantSelect(option) {
    if (variantSel !== null) return
    setVariantSel(option)
    setTimeout(() => {
      if (option !== variantQ.answer) return
      // 变种题答对后继续
    }, 500)
  }

  // 填空题渲染
  if (isFillBlank) {
    return (
      <FillBlankInput
        question={current.question}
        answer={userAnswer}
        onAnswerChange={setUserAnswer}
        onSubmit={handleFillBlankSubmit}
        isSubmitting={isSubmitting}
        referenceAnswer={current.answer}
        analysis={current.analysis}
      />
    )
  }

  // 多义字题目
  if (current.type === 'multi_meaning') {
    return (
      <MultiMeaningCard
        question={current}
        onAnswer={(correct, selectedMeaning) => {
          onAnswer({ correct, answer: selectedMeaning })
          setShowAnalysis(true)
        }}
      />
    )
  }

  // 连线题
  if (current.type === 'matching') {
    return (
      <MatchingCard
        question={current}
        onAnswer={(correct, userPairs) => {
          onAnswer({ correct, answer: userPairs })
          setShowAnalysis(true)
        }}
      />
    )
  }

  // 普通选择题
  return (
    <div className="space-y-6">
      {/* 题干 */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100">
        <p className="text-base text-gray-800 leading-relaxed whitespace-pre-line">
          {current.question}
        </p>
      </div>

      {/* 选项 */}
      <div className="flex flex-col gap-3">
        {current.options.map((option) => {
          let style = 'bg-white border-2 border-gray-200 text-gray-700'
          if (selected !== null) {
            if (option === current.answer) {
              style = 'bg-green-50 border-2 border-green-400 text-green-700'
            } else if (option === selected) {
              style = 'bg-red-50 border-2 border-red-400 text-red-700'
            } else {
              style = 'bg-white border-2 border-gray-100 text-gray-400'
            }
          }
          return (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              disabled={selected !== null}
              className={`${style} rounded-2xl px-4 py-4 text-left text-base leading-snug transition-all active:scale-95 shadow-sm`}
            >
              {option}
            </button>
          )
        })}
      </div>

      {/* 解析面板 */}
      {showAnalysis && (
        <div className="mt-4 space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-sm font-semibold text-amber-700 mb-1">💡 解析</p>
            <p className="text-sm text-amber-900 leading-relaxed">{current.analysis}</p>
          </div>

          {/* 错题模式：变种题区域 */}
          {isWrongReview && !variantQ && (
            <div className="flex gap-2">
              <button
                onClick={handleGenerateVariant}
                disabled={variantLoading}
                className="flex-1 bg-violet-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl text-sm"
              >
                {variantLoading ? '🤖 AI出变种题中…' : '🔀 举一反三（换语境再练）'}
              </button>
              <button
                onClick={() => onAnswer({ correct: null, skip: true })}
                className="px-4 bg-gray-100 text-gray-500 font-medium py-3 rounded-xl text-sm"
              >
                跳过
              </button>
            </div>
          )}
          {variantError && (
            <p className="text-xs text-red-400 text-center">{variantError}</p>
          )}

          {/* 变种题 */}
          {variantQ && (
            <div className="bg-violet-50 border-2 border-violet-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-violet-600 text-sm font-bold">🔀 变种练习</span>
                <span className="bg-violet-100 text-violet-600 text-xs px-2 py-0.5 rounded-full">
                  {variantQ.ability_tag} · AI出题
                </span>
              </div>
              <p className="text-base text-gray-800 font-medium mb-3 leading-relaxed">{variantQ.question}</p>
              <div className="flex flex-col gap-2">
                {variantQ.options.map(opt => {
                  let style = 'bg-white border-2 border-gray-200 text-gray-700'
                  if (variantSel !== null) {
                    if (opt === variantQ.answer) style = 'bg-green-50 border-2 border-green-400 text-green-700'
                    else if (opt === variantSel) style = 'bg-red-50 border-2 border-red-400 text-red-700'
                    else style = 'bg-white border-2 border-gray-100 text-gray-400'
                  }
                  return (
                    <button
                      key={opt}
                      onClick={() => handleVariantSelect(opt)}
                      disabled={variantSel !== null}
                      className={`${style} rounded-xl px-4 py-3 text-left text-sm leading-snug transition-all`}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
              {variantSel !== null && (
                <div className={`mt-3 rounded-xl p-3 text-xs ${variantSel === variantQ.answer ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {variantSel === variantQ.answer ? '✓ 变种题答对了！说明真的理解了 🎉' : `✗ 正确答案：${variantQ.answer}`}
                  {variantQ.analysis && <p className="text-gray-500 mt-1">{variantQ.analysis}</p>}
                </div>
              )}
              {variantSel !== null && (
                <button
                  onClick={() => onAnswer({ correct: null, skip: true })}
                  className="mt-3 w-full bg-violet-500 text-white font-semibold py-3 rounded-xl text-sm"
                >
                  继续 →
                </button>
              )}
            </div>
          )}

          {/* 无变种题时的继续按钮 */}
          {(!isWrongReview || variantError) && !variantQ && (
            <button
              onClick={() => onAnswer({ correct: null, skip: true })}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              继续 →
            </button>
          )}
        </div>
      )}

      {/* 正确反馈 */}
      {selected !== null && selected === current.answer && !showAnalysis && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-2xl p-3 text-center animate-pulse">
          <span className="text-green-600 font-semibold">✓ 正确！+5 XP</span>
        </div>
      )}
    </div>
  )
}

// ── 主页面组件 ─────────────────────────────────────────
export default function QuizPage() {
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [sessionXP, setSessionXP] = useState(0)
  const [streakDays, setStreakDays] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState(null)
  const startTimeRef = useRef(Date.now())

  // 初始化题目
  useEffect(() => {
    const shuffled = shuffle(ALL_QUESTIONS).slice(0, SESSION_SIZE)
    setQuestions(shuffled)
    
    // 恢复上次的学习记录（如果有的话）
    const lastSession = storage.get('last_quiz_session')
    if (lastSession && lastSession.questions) {
      setQuestions(lastSession.questions)
      setCurrentIndex(lastSession.currentIndex || 0)
      setSessionXP(lastSession.sessionXP || 0)
    }
  }, [])

  // 保存学习记录
  useEffect(() => {
    if (questions.length > 0) {
      storage.set('last_quiz_session', {
        questions,
        currentIndex,
        sessionXP,
        timestamp: Date.now()
      })
    }
  }, [questions, currentIndex, sessionXP])

  // 结束会话处理
  useEffect(() => {
    if (currentIndex >= questions.length && questions.length > 0) {
      const duration = (Date.now() - startTimeRef.current) / 1000 // 秒
      const xpEarned = sessionXP
      
      // 更新连续学习天数
      const newStreak = updateStreak()
      setStreakDays(newStreak)
      
      // 同步到云端
      if (!isSyncing) {
        setIsSyncing(true)
        syncAfterSession({ 
          type: 'quiz', 
          xp: xpEarned, 
          duration,
          streak: newStreak
        })
        .catch(err => {
          console.error('同步失败:', err)
          setSyncError('同步失败，请检查网络')
        })
        .finally(() => setIsSyncing(false))
      }
    }
  }, [currentIndex, questions.length, sessionXP, isSyncing])

  function handleAnswer(result) {
    const current = questions[currentIndex]
    const quality = toQuality(result.correct)
    
    // 更新SRS间隔
    updateSRS(current.id, quality)
    
    // 计算获得的XP
    let xp = 0
    if (result.correct) {
      xp = current.difficulty === 1 ? 3 : (current.difficulty === 2 ? 5 : 8)
    }
    
    setSessionXP(prev => prev + xp)
    setCurrentIndex(prev => prev + 1)
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-indigo-300 border-t-indigo-600 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">准备题目中...</p>
        </div>
      </div>
    )
  }

  if (currentIndex >= questions.length) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-emerald-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-lg border border-green-100">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎉</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">练习完成！</h2>
            <p className="text-gray-600 mb-4">
              本次获得 <span className="font-bold text-green-600">{sessionXP} XP</span>
              {streakDays > 0 && (
                <span> · 连续学习 <span className="font-bold text-amber-600">{streakDays} 天</span></span>
              )}
            </p>
            
            {syncError && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                <p className="text-red-600 text-sm">{syncError}</p>
              </div>
            )}
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.href = '/#/'}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                返回首页
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-white border border-gray-200 text-gray-700 font-medium py-3 rounded-xl transition-colors"
              >
                再练一组
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const current = questions[currentIndex]
  const progress = ((currentIndex + 1) / questions.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-50 pb-24">
      {/* 顶部进度条 */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="h-1 bg-gray-100">
          <div 
            className="h-full bg-indigo-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="px-4 py-3 flex justify-between items-center">
          <span className="text-sm text-gray-600">
            {currentIndex + 1} / {questions.length}
          </span>
          <span className="text-sm font-medium text-indigo-600">
            {sessionXP} XP
          </span>
        </div>
      </div>

      {/* 题目内容 */}
      <div className="p-4 max-w-2xl mx-auto">
        <QuestionCard 
          current={current} 
          onAnswer={handleAnswer}
        />
      </div>
    </div>
  )
}