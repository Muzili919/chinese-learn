import { useState, useMemo, useCallback } from 'react'
import { evaluateEssay } from '../utils/ai'
import { storage } from '../utils/storage'
import { syncAfterSession } from '../utils/sync'
import prompts from '../data/essay_prompts.json'

// ─── 常量 ────────────────────────────────────────────────────────────────
const XP_REWARD = 200 // 完成一篇作文奖励的经验值
const CATEGORIES = ['全部', '写人', '写事', '写景', '写物', '想象']
const CATEGORY_COLORS = {
  写人: 'from-pink-400 to-rose-500',
  写事: 'from-blue-400 to-indigo-500',
  写景: 'from-green-400 to-teal-500',
  写物: 'from-yellow-400 to-orange-500',
  想象: 'from-purple-400 to-violet-500',
}

function ScoreBar({ label, score, max, color }) {
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{label}</span>
        <span className="font-semibold">{score}/{max}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div
          className={`h-2 rounded-full bg-gradient-to-r ${color} transition-all`}
          style={{ width: `${(score / max) * 100}%` }}
        />
      </div>
    </div>
  )
}

function ScoreBadge({ score }) {
  const clampedScore = Math.max(0, Math.min(10, score || 0))
  const color = clampedScore >= 9 ? 'bg-green-500' : clampedScore >= 7 ? 'bg-blue-500' : 'bg-orange-500'
  return (
    <div className={`px-3 py-1 rounded-full text-white font-bold text-sm ${color}`}>
      {clampedScore.toFixed(1)}分
    </div>
  )
}

export default function EssayPage({ user, onBack, onFinish }) {
  // 切换账号/刷新时user可能为null，显示加载状态防止白屏
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-3">⏳</div>
          <p className="text-gray-500 text-sm">正在加载...</p>
        </div>
      </div>
    )
  }

  const [activeCategory, setActiveCategory] = useState('全部')
  const [currentPrompt, setCurrentPrompt] = useState(null)
  const [userEssay, setUserEssay] = useState('')
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [evaluation, setEvaluation] = useState(null)

  // 每日限制：检查今天是否已练过作文
  const practicedToday = useMemo(() => {
    if (!user?.id) return false
    const completed = storage.getCompletedPlanetsToday(user.id)
    return completed.includes('essay') || completed.includes('作文星球')
  }, [user?.id])

  const filteredPrompts = activeCategory === '全部' 
    ? prompts 
    : prompts.filter(p => p.category === activeCategory)

  const startNewEssay = () => {
    if (filteredPrompts.length === 0) return
    const randomIndex = Math.floor(Math.random() * filteredPrompts.length)
    setCurrentPrompt(filteredPrompts[randomIndex])
    setUserEssay('')
    setEvaluation(null)
  }

  const handleSubmit = async () => {
    if (!userEssay.trim()) return
    
    setIsEvaluating(true)
    try {
      const raw = await evaluateEssay(currentPrompt.title, userEssay)
      // evaluateEssay returns { total, structure, content, language, summary, suggestion, ... }
      // Normalize to component's expected format, clamp scores to 0-10
      const result = {
        overall: Math.max(0, Math.min(10, Math.round((raw.total || 0) / 10))), // convert 0-100 to 0-10 scale
        content: Math.max(0, Math.min(10, Math.round((raw.content || 0) / 4))), // 0-40 -> 0-10
        language: Math.max(0, Math.min(10, Math.round((raw.language || 0) / 3))), // 0-30 -> 0-10
        structure: Math.max(0, Math.min(10, Math.round((raw.structure || 0) / 3))), // 0-30 -> 0-10
        feedback: raw.summary || raw.suggestion || '作文已评分，继续加油！',
        ...raw,
      }
      setEvaluation(result)
      
      // Update user stats
      const userData = storage.getUser()
      if (userData) {
        userData.essaysSubmitted = (userData.essaysSubmitted || 0) + 1
        userData.totalScore = (userData.totalScore || 0) + result.overall
        userData.averageScore = userData.totalScore / userData.essaysSubmitted
        storage.setUser(userData)
        
        // Save essay history
        storage.addEssay(userData.id, {
          prompt: currentPrompt.title,
          content: userEssay,
          score: result.overall,
          feedback: result.feedback,
          category: currentPrompt.category,
        })
        
        // Sync to cloud - pass userId, not 'essay'
        if (userData.id) {
          syncAfterSession(userData.id)

          // < 80分 → 判错，写入records进入错题集
          if (result.overall < 80) {
            storage.addRecord(userData.id, {
              card_id: `essay_${Date.now()}`,
              correct: false,
              time_spent: 0,
              selected_answer: userEssay.slice(0, 100),
              ability_tag: '写作表达',
              knowledge_tag: currentPrompt?.category || '作文',
              subject: 'chinese',
              timestamp: new Date().toISOString(),
              source: 'essay',
              question_data: { title: currentPrompt?.title, score: result.overall },
            })
          }
        }

        // 标记今日已完成（每日1次限制）
        storage.markPlanetComplete(user.id, 'essay')
        storage.markPlanetComplete(user.id, '作文星球')

        // 奖励经验（根据评分高低乘以系数）
        if (user?.id) {
          const score = result.overall || 0
          let multiplier = 0.5 // <6分: 基础50%
          if (score >= 9) multiplier = 1.5 // 优秀: 150%
          else if (score >= 7) multiplier = 1.0 // 良好: 100%
          else if (score >= 6) multiplier = 0.8 // 及格: 80%
          storage.addXP(user.id, Math.round(XP_REWARD * multiplier))
        }
      }
    } catch (error) {
      console.error('评分失败:', error)
      // Show error to user instead of silently failing
      setEvaluation({
        overall: 0, content: 0, language: 0, structure: 0,
        feedback: `评分出错：${error.message}。请检查网络连接后重试。`,
        isError: true,
      })
    } finally {
      setIsEvaluating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={onBack}
            className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回
          </button>
          <h1 className="text-xl font-bold text-gray-800">作文星球</h1>
          <div className="w-5"></div>
        </div>

        {!currentPrompt ? (
          /* Topic Selection */
          <div className="bg-white rounded-2xl shadow-lg p-6">
            {practicedToday ? (
              <div className="text-center py-8">
                <div className="text-5xl mb-3">✅</div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">今日作文练习已完成</h2>
                <p className="text-sm text-gray-500 mb-4">每天限写1篇，明天再来吧！</p>
              </div>
            ) : (
            <>
            <h2 className="text-lg font-bold text-gray-800 mb-4">选择作文类型</h2>

            {/* Category Tabs */}
            <div className="flex-wrap gap-2 mb-6">
              {CATEGORIES.map(category => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                    activeCategory === category
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* Prompt List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredPrompts.map(prompt => (
                <div
                  key={prompt.id}
                  className="p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors cursor-pointer"
                  onClick={() => setCurrentPrompt(prompt)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-800">{prompt.title}</h3>
                    <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                      {prompt.minWords}字
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{prompt.requirements}</p>
                </div>
              ))}
            </div>

            {filteredPrompts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                该分类暂无题目
              </div>
            )}

            <button
              onClick={startNewEssay}
              className="w-full mt-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
            >
              随机选题
            </button>
            </>
            )}
          </div>
        ): evaluation ? (
          /* Evaluation Result */
          <div className="bg-white rounded-2xl shadow-lg p-6">
            {evaluation.isError ? (
              <>
                <div className="text-center mb-6">
                  <div className="text-4xl mb-2">😞</div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">评分遇到问题</h2>
                </div>
                <div className="bg-red-50 rounded-xl p-4 mb-6">
                  <p className="text-red-700 text-sm leading-relaxed">{evaluation.feedback}</p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setEvaluation(null)}
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    重新评分
                  </button>
                  <button
                    onClick={() => { setCurrentPrompt(null); setEvaluation(null) }}
                    className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                  >
                    返回选题
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-2">作文评分完成！</h2>
                  <ScoreBadge score={evaluation.overall} />
                </div>

                <div className="space-y-4 mb-6">
                  <ScoreBar 
                    label="内容完整度" 
                    score={evaluation.content} 
                    max={10} 
                    color={CATEGORY_COLORS[currentPrompt?.category] || 'from-gray-400 to-gray-500'}
                  />
                  <ScoreBar 
                    label="语言表达" 
                    score={evaluation.language} 
                    max={10} 
                    color={CATEGORY_COLORS[currentPrompt?.category] || 'from-gray-400 to-gray-500'}
                  />
                  <ScoreBar 
                    label="结构逻辑" 
                    score={evaluation.structure} 
                    max={10} 
                    color={CATEGORY_COLORS[currentPrompt?.category] || 'from-gray-400 to-gray-500'}
                  />
                </div>

                <div className="bg-blue-50 rounded-xl p-4 mb-6">
                  <h3 className="font-semibold text-blue-800 mb-2">AI点评：</h3>
                  <p className="text-blue-700 text-sm leading-relaxed">{evaluation.feedback}</p>
                  {evaluation.improvements && Array.isArray(evaluation.improvements) && (
                    <div className="mt-3 space-y-2">
                      <h4 className="font-semibold text-blue-800 text-sm">修改建议：</h4>
                      {evaluation.improvements.map((imp, i) => (
                        <div key={i} className="text-xs text-blue-600 bg-blue-100 rounded-lg p-2">
                          <span className="line-through">{imp.original}</span>
                          {' → '}
                          <span className="font-medium">{imp.revised}</span>
                          <span className="text-blue-400 ml-1">({imp.reason})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setCurrentPrompt(null)
                      setEvaluation(null)
                    }}
                    className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                  >
                    重新选题
                  </button>
                  <button
                    onClick={onBack}
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    返回首页
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          /* Writing Interface */
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-gray-800">{currentPrompt.title}</h2>
                <span className="text-sm bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                  {currentPrompt.minWords}字
                </span>
              </div>
              <p className="text-gray-600 text-sm">{currentPrompt.requirements}</p>
            </div>

            {currentPrompt.tips && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4 rounded">
                <h3 className="font-semibold text-yellow-800 mb-1">写作小贴士：</h3>
                <ul className="text-yellow-700 text-xs space-y-1">
                  {currentPrompt.tips.map((tip, index) => (
                    <li key={index}>• {tip}</li>
                  ))}
                </ul>
              </div>
            )}

            <textarea
              value={userEssay}
              onChange={(e) => setUserEssay(e.target.value)}
              placeholder="开始你的创作吧..."
              className="w-full h-64 p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none mb-4"
              style={{ fontSize: '16px', lineHeight: '1.6' }}
            />

            <div className="flex justify-between items-center mb-4">
              <span className="text-sm text-gray-500">
                {userEssay.length} 字
                {userEssay.length < currentPrompt.minWords && (
                  <span className="text-red-500 ml-2">
                    (还需 {currentPrompt.minWords - userEssay.length} 字)
                  </span>
                )}
              </span>
              <span className="text-sm text-gray-500">
                AI智能评分
              </span>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setCurrentPrompt(null)}
                className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                换个题目
              </button>
              <button
                onClick={handleSubmit}
                disabled={isEvaluating || userEssay.length < currentPrompt.minWords}
                className={`flex-1 py-3 rounded-xl font-semibold text-white transition-all ${
                  isEvaluating || userEssay.length < currentPrompt.minWords
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {isEvaluating ? '评分中...' : '提交评分'}
              </button>
            </div>
          </div>
        )}

        {/* Progress Info */}
        {user && (
          <div className="mt-6 bg-white rounded-2xl shadow-lg p-4 text-center">
            <div className="text-sm text-gray-600">
              已完成 {(user.essaysSubmitted || 0)} 篇作文 • 
              平均分 {user.averageScore ? user.averageScore.toFixed(1) : '-'}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}