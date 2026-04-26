import { useState, useEffect, useCallback, useMemo } from 'react'
import { storage, updateStreak } from '../utils/storage'
import { syncAfterSession } from '../utils/sync'
import { updateSRS, toQuality, isDue } from '../utils/srs'
import { speakEnglish } from '../utils/tts'
import { shuffle } from '../utils/common'
import wordsNetworkPrimary from '../data/words_network.json'
import wordsNetworkJunior from '../data/words_network_j2.json'

// ─── 常量 ───────────────────────────────────────────────────────
const QUIZ_COUNT = 10
const XP_CORRECT = 12
const XP_STREAK_BONUS = 20


// ─── 题型生成（3种纯回忆题型） ──────────────────────────────────
const QUESTION_MODES = ['en_to_cn', 'cn_to_en', 'spelling']

/**
 * 构建一道闪电测验题目
 * 纯回忆！不给任何提示（无词树、无助记、无例句）
 */
function buildLightningQuestion(wordObj, mode) {
  switch (mode) {
    case 'en_to_cn':
      // 英文 → 选中文意思
      const wrongMeanings = shuffle(
        allWords
          .filter(w => w.word !== wordObj.word)
          .map(w => w.meaning)
      ).slice(0, 3)
      const optionsEn = shuffle([wordObj.meaning, ...wrongMeanings])
      return {
        type: 'en_to_cn',
        label: '英译中',
        prompt: wordObj.word,
        speakText: wordObj.word,
        options: optionsEn,
        answer: wordObj.meaning,
        wordObj,
      }

    case 'cn_to_en':
      // 中文意思 → 选英文单词
      const wrongWords = shuffle(
        allWords
          .filter(w => w.word !== wordObj.word)
          .map(w => w.word)
      ).slice(0, 3)
      const optionsCn = shuffle([wordObj.word, ...wrongWords])
      return {
        type: 'cn_to_en',
        label: '中译英',
        prompt: `"${wordObj.meaning}" 是哪个词？`,
        speakText: null,
        options: optionsCn,
        answer: wordObj.word,
        wordObj,
      }

    case 'spelling':
      // 根据中文意思拼写英文（输入题）
      return {
        type: 'spelling',
        label: '拼写',
        prompt: `请拼写："${wordObj.meaning}"`,
        speakText: null,
        options: null,
        answer: wordObj.word.toLowerCase(),
        wordObj,
      }

    default:
      return buildLightningQuestion(wordObj, 'en_to_cn')
  }
}

// ─── 主页面 ──────────────────────────────────────────────────────
export default function LightningQuizPage({ user, onFinish, onBack }) {
  const [phase, setPhase] = useState('intro') // intro | quiz | result

  // 按年级加载词库
  const isJunior = user?.grade === 'junior2' || user?.grade === 'junior'
  const wordsNetwork = isJunior ? wordsNetworkJunior : wordsNetworkPrimary
  const allWords = Object.values(wordsNetwork.words)
  const allWordsMap = wordsNetwork.words
  const [questions, setQuestions] = useState([])
  const [qIndex, setQIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [results, setResults] = useState([])
  const [streak, setStreak] = useState(0)

  // SRS 状态（用于筛选已学过的词）
  const [srsMap, setSrsMap] = useState(() => {
    if (!user?.id) return {}
    try {
      const saved = localStorage.getItem(`srs_${user.id}`)
      return saved ? JSON.parse(saved) : {}
    } catch { return {} }
  })

  const currentQ = questions[qIndex]
  const answeredCount = results.length
  const correctCount = results.filter(r => r.correct).length

  // ─── 初始化：从已学过的词中抽5题 ──────────────────────────────
  const initQuiz = useCallback(() => {
    // 筛选条件：有SRS记录（至少学过一次）或 tier=1 高频词
    const learnedWords = allWords.filter(w => {
      const cardId = `j2_${w.word}`
      return srsMap[cardId] // 有SRS记录 = 学过
    })

    // 如果学过的词不够5个，补充高频词
    let pool = learnedWords.length >= QUIZ_COUNT
      ? learnedWords
      : [
          ...learnedWords,
          ...shuffle(allWords.filter(w => w.tier === 1 && !srsMap[`j2_${w.word}`]))
            .slice(0, QUIZ_COUNT - learnedWords.length),
        ]

    pool = shuffle(pool).slice(0, QUIZ_COUNT)

    const qs = pool.map((w, i) =>
      buildLightningQuestion(w, QUESTION_MODES[i % QUESTION_MODES.length])
    )

    setQuestions(qs)
    setQIndex(0)
    setResults([])
    setSelected(null)
    setSubmitted(false)
    setInputValue('')
    setPhase('quiz')
  }, [srsMap])

  // ─── 答题处理 ────────────────────────────────────────────────
  function handleSelect(opt) {
    if (selected !== null) return
    setSelected(opt)
  }

  function handleSubmitSpelling() {
    if (!inputValue.trim() || submitted) return
    setSubmitted(true)
    const correct = inputValue.trim().toLowerCase() === currentQ.answer
    recordAnswer(correct)
  }

  function handleSubmitChoice() {
    if (selected === null || submitted) return
    setSubmitted(true)
    const correct = selected === currentQ.answer
    recordAnswer(correct)
  }

  function recordAnswer(correct) {
    const newResults = [...results, { correct, word: currentQ.wordObj.word }]
    setResults(newResults)

    // SRS 更新
    if (user?.id && currentQ?.wordObj) {
      try {
        const cardId = `j2_${currentQ.wordObj.word}`
        const quality = correct ? toQuality(true, 3) : toQuality(false, 5)
        const oldState = srsMap[cardId] || null
        const newState = updateSRS(oldState, quality)
        setSrsMap(prev => ({ ...prev, [cardId]: newState }))
        try {
          localStorage.setItem(`srs_${user.id}`, JSON.stringify({ ...srsMap, [cardId]: newState }))
        } catch {}
        storage.addRecord(user.id, {
          ability_tag: currentQ.wordObj.category || 'misc',
          knowledge_tag: '闪电测验',
          subject: 'english',
          correct: correct ? 1 : 0,
          total: 1,
        })
      } catch {}
    }

    // 延迟进入下一题
    setTimeout(() => {
      if (newResults.length >= QUIZ_COUNT) {
        setPhase('result')
      } else {
        setQIndex(i => i + 1)
        setSelected(null)
        setSubmitted(false)
        setInputValue('')
      }
    }, correct ? 800 : 1400)
  }

  // ─── 结果页处理 ────────────────────────────────────────────────
  function handleFinish() {
    const accuracy = Math.round((correctCount / QUIZ_COUNT) * 100)
    let xpGained = correctCount * XP_CORRECT

    // 连击奖励：全对额外奖
    if (correctCount === QUIZ_COUNT) {
      xpGained += XP_STREAK_BONUS
    }

    if (xpGained > 0 && user?.id) {
      storage.addXP(user.id, xpGained)
    }

    // Streak
    if (correctCount > 0 && user?.id) {
      // 标记星球完成（闪电测验做完才算打卡）
      storage.markPlanetComplete(user.id, '闪电测验')
      updateStreak(user.id)
    }

    // 云端同步（跨设备学习数据同步）
    if (user?.id) syncAfterSession(user.id)

    onFinish({
      correct: correctCount,
      total: QUIZ_COUNT,
      xpGained,
      source: 'lightning_quiz',
    })
  }

  // ─── 计时器 ────────────────────────────────────────────────────
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    if (phase !== 'quiz') return
    const timer = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(timer)
  }, [phase])

  // ══════════════════════════════════════════════════════════════════
  // Phase 1: 介绍页
  // ══════════════════════════════════════════════════════════════════
  if (phase === 'intro') {
    const learnedCount = Object.keys(srsMap).length
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>

        {/* 动画装饰 */}
        <div className="text-7xl mb-6" style={{ animation: 'float 3s ease-in-out infinite' }}>⚡</div>

        <h1 className="text-2xl font-extrabold text-white text-center mb-2">
          每日闪电测验
        </h1>
        <p className="text-sm text-white/80 text-center mb-8">
          {QUIZ_COUNT} 题 · 纯回忆挑战
        </p>

        <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-5 py-4 mb-8 w-full max-w-xs">
          <div className="flex items-center gap-3 text-white/90 text-sm">
            <span className="text-lg">📝</span>
            <span>从 <b>{learnedCount}</b> 个已学词汇中随机出题</span>
          </div>
          <div className="flex items-center gap-3 text-white/90 text-sm mt-2">
            <span className="text-lg">🎯</span>
            <span>不给任何提示，考验真实记忆</span>
          </div>
          <div className="flex items-center gap-3 text-white/90 text-sm mt-2">
            <span className="text-lg">🎁</span>
            <span>全对额外 +{XP_STREAK_BONUS} XP 奖励</span>
          </div>
        </div>

        <button
          onClick={initQuiz}
          className="w-full max-w-xs py-4 rounded-2xl bg-white text-purple-700 font-bold text-base shadow-lg active:scale-95 transition-transform"
        >
          开始挑战 ⚡
        </button>

        <button
          onClick={onBack}
          className="mt-4 text-white/60 text-sm"
        >
          返回
        </button>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
        `}</style>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════
  // Phase 3: 结果页
  // ══════════════════════════════════════════════════════════════════
  if (phase === 'result') {
    const accuracy = Math.round((correctCount / QUIZ_COUNT) * 100)
    const perfect = correctCount === QUIZ_COUNT
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>

        <div className="text-7xl mb-4">
          {perfect ? '🏆' : accuracy >= 60 ? '👍' : '💪'}
        </div>

        <h1 className="text-2xl font-extrabold text-white text-center mb-2">
          {perfect ? '完美通关!' : accuracy >= 60 ? '不错哦!' : '继续加油!'}
        </h1>
        <p className="text-sm text-white/80 mb-6">
          {correctCount}/{QUIZ_COUNT} 正确 · 用时 {elapsed}秒
        </p>

        {/* 分数卡片 */}
        <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-5 w-full max-w-xs mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-extrabold text-white">{correctCount}/{QUIZ_COUNT}</div>
              <div className="text-[10px] text-white/70">正确率</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-yellow-300">+{correctCount * XP_CORRECT + (perfect ? XP_STREAK_BONUS : 0)}</div>
              <div className="text-[10px] text-white/70">获得XP</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white">{elapsed}s</div>
              <div className="text-[10px] text-white/70">用时</div>
            </div>
          </div>
        </div>

        {/* 每题详情 */}
        <div className="bg-white rounded-2xl px-4 py-3 w-full max-w-xs mb-6 max-h-40 overflow-y-auto">
          <div className="text-xs font-bold text-gray-500 mb-2">答题详情</div>
          {results.map((r, i) => (
            <div key={i} className={`flex items-center gap-2 py-1.5 text-sm ${r.correct ? '' : 'opacity-60'}`}>
              <span>{r.correct ? '✅' : '❌'}</span>
              <span className="font-mono font-bold text-gray-700">{r.word}</span>
              {!r.correct && <span className="text-xs text-red-500">需要复习</span>}
            </div>
          ))}
        </div>

        <button
          onClick={handleFinish}
          className="w-full max-w-xs py-3.5 rounded-2xl bg-white text-purple-700 font-bold text-base shadow-lg active:scale-95 transition-transform"
        >
          完成 ✓
        </button>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════
  // Phase 2: 答题页（核心交互）
  // ══════════════════════════════════════════════════════════════════
  const choiceCorrect = submitted && selected === currentQ?.answer
  const choiceWrong = submitted && selected !== null && selected !== currentQ?.answer
  const spellingCorrect = submitted && inputValue.trim().toLowerCase() === currentQ?.answer
  const spellingWrong = submitted && inputValue.trim().toLowerCase() !== currentQ?.answer

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      {/* 顶部栏 */}
      <div className="sticky top-0 z-10" style={{ paddingTop: 'env(safe-area-inset-top, 36px)' }}>
        <div className="flex items-center gap-3 px-4 pt-3 pb-2">
          <button
            onClick={() => { if (confirm('确定退出吗？当前进度会丢失')) onBack() }}
            className="w-9 h-9 flex items-center justify-center bg-white/20 rounded-xl text-white text-lg font-bold"
          >
            ✕
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {[...Array(QUIZ_COUNT)].map((_, i) => (
                <div key={i}
                  className={`flex-1 h-1.5 rounded-full transition-all ${
                    i < answeredCount
                      ? (results[i]?.correct ? 'bg-green-300' : 'bg-red-300')
                      : i === qIndex ? 'bg-white' : 'bg-white/30'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="text-white/90 text-xs font-bold px-2 py-1 bg-white/20 rounded-lg">
            ⏱ {elapsed}s
          </div>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
        {/* 题号 + 题型 */}
        <div className="mb-4 text-center">
          <span className="text-xs font-bold px-3 py-1 bg-white/20 text-white rounded-full">
            第 {qIndex + 1}/{QUIZ_COUNT} 题 · {currentQ?.label}
          </span>
        </div>

        {/* 题目主体 */}
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden">
          {/* 问题区域 */}
          <div className="px-6 pt-8 pb-6 text-center">
            {/* 英文单词大字显示（en_to_cn模式） */}
            {currentQ?.type === 'en_to_cn' && (
              <>
                <div className="text-4xl font-extrabold text-gray-800 tracking-wide mb-3">
                  {currentQ.prompt}
                </div>
                <button
                  onClick={() => speakEnglish(currentQ.speakText)}
                  className="inline-flex items-center gap-1 text-sm text-purple-500 font-medium"
                >
                  🔊 听发音
                </button>
              </>
            )}

            {/* 中文问题（cn_to_en / spelling） */}
            {(currentQ?.type === 'cn_to_en' || currentQ?.type === 'spelling') && (
              <div className="text-xl font-bold text-gray-800 leading-relaxed">
                {currentQ.prompt}
              </div>
            )}
          </div>

          {/* 选择题选项 */}
          {currentQ?.options && (
            <div className="px-5 pb-6 grid grid-cols-2 gap-3">
              {currentQ.options.map((opt, i) => {
                let style = 'border-gray-200 bg-gray-50 text-gray-700'
                if (submitted) {
                  if (opt === currentQ.answer) style = 'border-green-400 bg-green-50 text-green-700'
                  else if (opt === selected) style = 'border-red-400 bg-red-50 text-red-600'
                  else style = 'border-gray-200 bg-gray-50 text-gray-400'
                }
                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(opt)}
                    disabled={submitted}
                    className={`rounded-2xl border-2 px-4 py-3.5 text-sm font-medium transition-all active:scale-95 ${style}`}
                  >
                    {['A', 'B', 'C', 'D'][i]}. {opt}
                  </button>
                )
              })}
            </div>
          )}

          {/* 拼写输入 */}
          {currentQ?.type === 'spelling' && (
            <div className="px-5 pb-6">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmitSpelling()}
                  placeholder="输入英文拼写..."
                  disabled={submitted}
                  autoFocus
                  className="flex-1 px-4 py-3.5 rounded-2xl border-2 text-center font-mono text-lg font-bold
                    ${spellingWrong ? 'border-red-400 bg-red-50 text-red-700' : spellingCorrect ? 'border-green-400 bg-green-50 text-green-700' : 'border-purple-200 bg-purple-50 text-gray-800 focus:border-purple-400'}
                    outline-none transition-all"
                />
                {!submitted && (
                  <button
                    onClick={handleSubmitSpelling}
                    disabled={!inputValue.trim()}
                    className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white font-bold text-sm active:scale-95 transition-transform disabled:opacity-40"
                  >
                    确定
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 反馈区域 */}
          {submitted && (
            <div className={`mx-5 mb-5 rounded-2xl px-4 py-3 text-sm ${
              (choiceCorrect || spellingCorrect)
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {(choiceCorrect || spellingCorrect) ? (
                <div className="font-bold">✅ 正确！+{XP_CORRECT} XP</div>
              ) : (
                <div>
                  <div className="font-bold mb-1">❌ 答错了</div>
                  <div className="text-xs">
                    正确答案：<span className="font-bold underline">{currentQ.answer}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 提交按钮（选择题） */}
          {currentQ?.options && !submitted && (
            <div className="px-5 pb-6">
              <button
                onClick={handleSubmitChoice}
                disabled={selected === null}
                className={`w-full py-3.5 rounded-2xl font-bold text-base transition-all active:scale-95 ${
                  selected !== null
                    ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                确认答案
              </button>
            </div>
          )}
        </div>

        {/* 底部提示 */}
        <div className="mt-4 text-center">
          <span className="text-xs text-white/60">
            {submitted ? (
              <>{choiceCorrect || spellingCorrect ? '🎉 太棒了！' : '📖 加油，下次一定行！'}</>
            ) : (
              <>纯回忆测试 · 不给任何提示</>
            )}
          </span>
        </div>
      </div>
    </div>
  )
}
