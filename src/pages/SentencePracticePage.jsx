import { useState, useMemo } from 'react'
import { evaluateSentence } from '../utils/ai'
import { storage } from '../utils/storage'
import { syncAfterSession } from '../utils/sync'
import allWords from '../data/sentence_words.json'

const SESSION_SIZE = 10

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function SentencePracticePage({ user, onBack }) {
  // 随机选10个词（不分年级）
  const sessionWords = useMemo(() => shuffle(allWords).slice(0, SESSION_SIZE), [])

  const [index, setIndex] = useState(0)
  const [sentence, setSentence] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)   // 当前题批改结果
  const [error, setError] = useState('')
  const [sessionResults, setSessionResults] = useState([])  // 所有题结果
  const [step, setStep] = useState('quiz')  // quiz | summary | history

  // 历史记录
  const [showHistory, setShowHistory] = useState(false)
  const history = storage.getSentenceHistory(user.id)

  const current = sessionWords[index]
  const isLast = index === sessionWords.length - 1
  const progress = ((index) / sessionWords.length) * 100

  async function handleSubmit() {
    if (!sentence.trim() || sentence.trim().length < 4) {
      setError('句子太短了，多写几个字吧～')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await evaluateSentence(current.word, sentence)
      setResult(res)
      // 存历史
      storage.addSentenceHistory(user.id, {
        word: current.word,
        sentence,
        score: res.score,
        correct: res.correct,
        feedback: res.usage,
        suggestion: res.suggestion,
      })
      // 存答题记录（进入统计）
      storage.addRecord(user.id, {
        card_id: `sw_${current.id}_${Date.now()}`,
        correct: res.correct,
        time_spent: 0,
        selected_answer: sentence,
        ability_tag: '造句练习',
        knowledge_tag: '造句',
        timestamp: new Date().toISOString(),
      })
      storage.addXP(user.id, res.correct ? 10 : 3)
    } catch {
      setError('AI批改出错了，请检查网络后重试')
    }
    setLoading(false)
  }

  function handleNext() {
    setSessionResults(prev => [...prev, { word: current.word, sentence, score: result?.score || 0, correct: result?.correct || false }])
    if (isLast) {
      setStep('summary')
      syncAfterSession(user.id)
    } else {
      setIndex(i => i + 1)
      setSentence('')
      setResult(null)
      setError('')
    }
  }

  // 历史记录页
  if (showHistory) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
        <div className="bg-white px-4 pt-10 pb-4 flex items-center gap-3 shadow-sm">
          <button onClick={() => setShowHistory(false)} className="text-gray-400 text-xl p-1">✕</button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">造句历史记录</h1>
            <p className="text-xs text-gray-400">共 {history.length} 条</p>
          </div>
        </div>
        <div className="flex-1 px-4 py-4 space-y-3">
          {history.length === 0 ? (
            <div className="text-center text-gray-400 mt-20">还没有练习记录</div>
          ) : (
            history.map(h => (
              <div key={h.id} className="bg-white rounded-2xl p-4 shadow-sm border border-amber-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-amber-700 text-lg">「{h.word}」</span>
                  <span className={`text-sm font-bold ${h.correct ? 'text-green-600' : 'text-orange-500'}`}>
                    {h.score}分
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-1">{h.sentence}</p>
                <p className="text-xs text-gray-400">{h.feedback}</p>
                {h.suggestion && (
                  <p className="text-xs text-amber-600 mt-1">建议：{h.suggestion}</p>
                )}
                <p className="text-xs text-gray-300 mt-2">{h.createdAt?.split('T')[0]}</p>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  // 本次汇总
  if (step === 'summary') {
    const avgScore = Math.round(sessionResults.reduce((s, r) => s + r.score, 0) / sessionResults.length)
    const correctCount = sessionResults.filter(r => r.correct).length
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
        <div className="bg-white px-4 pt-10 pb-4 flex items-center gap-3 shadow-sm">
          <button onClick={onBack} className="text-gray-400 text-xl p-1">✕</button>
          <h1 className="text-xl font-bold text-gray-800">✍️ 本次造句总结</h1>
        </div>
        <div className="flex-1 px-4 py-5 space-y-4">
          {/* 总体成绩 */}
          <div className="bg-white rounded-2xl p-5 text-center shadow-sm border border-amber-100">
            <div className="text-5xl font-bold text-amber-500 mb-1">{avgScore}</div>
            <div className="text-sm text-gray-400">平均分（满分100）</div>
            <div className="text-sm text-gray-600 mt-2">
              {correctCount}/{sessionResults.length} 道用词正确 · +{correctCount * 10 + (sessionResults.length - correctCount) * 3} XP
            </div>
          </div>
          {/* 逐题结果 */}
          <div className="space-y-2">
            {sessionResults.map((r, i) => (
              <div key={i} className={`bg-white rounded-xl p-3 border-l-4 shadow-sm ${r.correct ? 'border-green-400' : 'border-orange-400'}`}>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">「{r.word}」</span>
                  <span className={`text-sm font-bold ${r.correct ? 'text-green-600' : 'text-orange-500'}`}>{r.score}分</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{r.sentence}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowHistory(true)}
              className="flex-1 border-2 border-amber-400 text-amber-600 font-semibold py-3 rounded-xl"
            >
              查看历史
            </button>
            <button
              onClick={onBack}
              className="flex-1 bg-amber-500 text-white font-semibold py-3 rounded-xl"
            >
              返回首页
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 答题界面
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      {/* Header */}
      <div className="bg-white px-4 pt-8 pb-4 flex items-center gap-3">
        <button onClick={onBack} className="text-gray-400 text-xl p-1">✕</button>
        <div className="flex-1 bg-gray-100 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-amber-400 to-orange-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm text-gray-400 font-medium min-w-[40px] text-right">
          {index + 1}/{sessionWords.length}
        </span>
        <button onClick={() => setShowHistory(true)} className="text-gray-400 text-sm">📋</button>
      </div>

      <div className="flex-1 px-4 py-5 flex flex-col gap-4">
        {/* 当前词语 */}
        <div className="bg-amber-100 rounded-2xl p-5 text-center">
          <p className="text-xs text-amber-500 mb-1">用这个词语造句</p>
          <div className="text-4xl font-bold text-amber-800 mb-1">{current.word}</div>
          <div className="text-sm text-amber-600">{current.hint}</div>
        </div>

        {/* 例句提示（折叠） */}
        <details className="bg-blue-50 rounded-xl px-4 py-3">
          <summary className="text-xs text-blue-500 font-medium cursor-pointer">💡 点击查看例句参考</summary>
          <p className="text-sm text-blue-700 mt-2">{current.example}</p>
        </details>

        {/* 输入区 */}
        <div>
          <textarea
            value={sentence}
            onChange={e => setSentence(e.target.value)}
            disabled={result !== null}
            placeholder="在这里写你的句子…"
            rows={4}
            className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-base text-gray-800 focus:outline-none focus:border-amber-400 resize-none disabled:bg-gray-50"
          />
          <div className="text-right text-xs text-gray-400 mt-1">{sentence.length} 字</div>
        </div>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        {/* 批改结果 */}
        {result && (
          <div className={`rounded-2xl p-4 border-2 ${result.correct ? 'bg-green-50 border-green-300' : 'bg-orange-50 border-orange-300'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className={`font-bold text-base ${result.correct ? 'text-green-700' : 'text-orange-700'}`}>
                {result.correct ? '✓ 用法正确！' : '✗ 用法需改进'}
              </span>
              <span className="text-2xl font-bold text-gray-700">{result.score}<span className="text-sm text-gray-400">分</span></span>
            </div>
            <p className="text-sm text-gray-600 mb-1">📝 {result.usage}</p>
            <p className="text-sm text-gray-500 mb-1">流畅度：{result.fluency}</p>
            {result.highlight && result.highlight !== '继续加油' && (
              <p className="text-sm text-amber-600">✨ {result.highlight}</p>
            )}
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500">💡 建议：{result.suggestion}</p>
            </div>
          </div>
        )}

        {/* 按钮区 */}
        {result === null ? (
          <button
            onClick={handleSubmit}
            disabled={loading || !sentence.trim()}
            className="w-full bg-amber-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-2xl text-base"
          >
            {loading ? '🤖 AI批改中…' : '提交批改 →'}
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="w-full bg-amber-500 text-white font-bold py-4 rounded-2xl text-base"
          >
            {isLast ? '查看本次汇总 →' : `下一个词 →`}
          </button>
        )}
      </div>
    </div>
  )
}
