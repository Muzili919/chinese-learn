import { useState } from 'react'
import { evaluateEssay } from '../utils/ai'
import { storage } from '../utils/storage'
import { syncAfterSession } from '../utils/sync'
import prompts from '../data/essay_prompts.json'

const CATEGORIES = ['全部', '写人', '写事', '写景', '想象']
const CATEGORY_COLORS = {
  写人: 'from-pink-400 to-rose-500',
  写事: 'from-blue-400 to-indigo-500',
  写景: 'from-green-400 to-teal-500',
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
  const color = score >= 85 ? 'text-green-600' : score >= 70 ? 'text-amber-600' : 'text-red-500'
  return <span className={`text-2xl font-bold ${color}`}>{score}</span>
}

export default function EssayPage({ user, onBack }) {
  const [tab, setTab] = useState('write')   // write | history
  const [catFilter, setCatFilter] = useState('全部')
  const [selectedPrompt, setSelectedPrompt] = useState(null)
  const [step, setStep] = useState('pick')  // pick | write | result
  const [essay, setEssay] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  // 历史
  const [historyDetail, setHistoryDetail] = useState(null)  // 查看某篇历史详情
  const essays = storage.getEssays(user.id)

  const filtered = catFilter === '全部' ? prompts : prompts.filter(p => p.category === catFilter)
  const wordCount = essay.trim().length

  async function handleSubmit() {
    if (wordCount < 100) {
      setError(`还需要再多写一些，当前${wordCount}字，至少写100字哦`)
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await evaluateEssay(selectedPrompt.title, essay)
      // ⚠️ 必须先存储再触发 re-render，否则历史列表读不到最新数据
      storage.addEssay(user.id, {
        prompt: selectedPrompt.title,
        category: selectedPrompt.category,
        content: essay,
        score: res.total,
        feedback: res,
      })
      storage.addRecord(user.id, {
        card_id: `essay_${Date.now()}`,
        correct: res.total >= 60,
        time_spent: 0,
        selected_answer: essay.slice(0, 50),
        ability_tag: '作文写作',
        knowledge_tag: '作文',
        timestamp: new Date().toISOString(),
      })
      storage.addXP(user.id, 300 + Math.round(res.total * 3))
      // 作文经验 = 基础300 + 评分比例奖励（满分100额外+300，即最高600exp）
      // 触发 re-render
      setResult(res)
      setStep('result')
      // 后台同步到云端
      syncAfterSession(user.id)
    } catch {
      setError('AI批改出错了，请检查网络后重试')
    }
    setLoading(false)
  }

  function handleRevise() {
    setResult(null)
    setStep('write')
    setError('')
  }

  function handleNew() {
    setSelectedPrompt(null)
    setEssay('')
    setResult(null)
    setStep('pick')
    setError('')
  }

  // -------- 历史详情 --------
  if (historyDetail) {
    const fb = historyDetail.feedback
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-pink-50 to-rose-50">
        <div className="bg-white px-4 pt-10 pb-4 flex items-center gap-3 shadow-sm">
          <button onClick={() => setHistoryDetail(null)} className="text-gray-400 text-xl p-1">✕</button>
          <div>
            <h1 className="text-base font-bold text-gray-800">{historyDetail.prompt}</h1>
            <p className="text-xs text-gray-400">{historyDetail.createdAt?.split('T')[0]}</p>
          </div>
        </div>
        <div className="flex-1 px-4 py-4 space-y-4">
          {/* 评分 */}
          <div className="bg-white rounded-2xl p-4 text-center border border-rose-100 shadow-sm">
            <div className="text-5xl font-bold text-rose-500 mb-1">{historyDetail.score}</div>
            <div className="text-xs text-gray-400">总分（满分100）</div>
            {fb && (
              <div className="mt-3 space-y-2">
                <ScoreBar label="📐 结构" score={fb.structure} max={30} color="from-blue-400 to-indigo-500" />
                <ScoreBar label="💡 内容" score={fb.content} max={40} color="from-green-400 to-teal-500" />
                <ScoreBar label="✨ 语言" score={fb.language} max={30} color="from-purple-400 to-violet-500" />
              </div>
            )}
          </div>

          {/* 作文内容 */}
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-400 mb-2">作文内容（{historyDetail.content?.length}字）</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{historyDetail.content}</p>
          </div>

          {/* 老师评语 */}
          {fb && (
            <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3">
              <h3 className="text-sm font-semibold text-gray-600">老师评语</h3>
              <p className="text-sm text-gray-700">{fb.summary}</p>
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <p className="text-xs text-blue-500 font-medium">📐 结构：{fb.structureFeedback}</p>
                <p className="text-xs text-green-500 font-medium">💡 内容：{fb.contentFeedback}</p>
                <p className="text-xs text-purple-500 font-medium">✨ 语言：{fb.languageFeedback}</p>
              </div>
            </div>
          )}

          {/* 具体修改建议 */}
          {fb?.improvements?.length > 0 && (
            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 shadow-sm">
              <h3 className="text-sm font-semibold text-amber-700 mb-3">✏️ 具体修改建议</h3>
              <div className="space-y-3">
                {fb.improvements.map((item, i) => (
                  <div key={i} className="bg-white rounded-xl p-3 border border-amber-100">
                    <p className="text-xs text-red-500 mb-1">原文：「{item.original}」</p>
                    <p className="text-xs text-green-600 mb-1">改为：「{item.revised}」</p>
                    <p className="text-xs text-gray-400">原因：{item.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {fb?.suggestion && (
            <div className="bg-rose-50 rounded-xl p-3 border border-rose-200">
              <p className="text-xs font-medium text-rose-600 mb-1">🎯 最重要的改进</p>
              <p className="text-sm text-rose-800">{fb.suggestion}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-pink-50 to-rose-50">
      {/* Header */}
      <div className="bg-white px-4 pt-10 pb-0 shadow-sm">
        <div className="flex items-center gap-3 pb-3">
          <button onClick={onBack} className="text-gray-400 text-xl p-1">✕</button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">📝 作文星球</h1>
            <p className="text-xs text-gray-400">选题目 → 写作文 → AI三维评分</p>
          </div>
        </div>
        {/* Tab */}
        <div className="flex border-b border-gray-100">
          {['write', 'history'].map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); if (t === 'write') handleNew() }}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                tab === t ? 'text-rose-600 border-b-2 border-rose-500' : 'text-gray-400'
              }`}
            >
              {t === 'write' ? '写作文' : `历史记录 (${essays.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 py-4">

        {/* 历史记录 tab */}
        {tab === 'history' && (
          <div className="space-y-3">
            {essays.length === 0 ? (
              <div className="text-center text-gray-400 mt-20">还没有提交过作文</div>
            ) : (
              essays.map(e => (
                <button
                  key={e.id}
                  onClick={() => setHistoryDetail(e)}
                  className="w-full bg-white rounded-2xl p-4 text-left shadow-sm border border-pink-100 active:scale-95 transition-transform"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className={`text-xs px-2 py-0.5 rounded-full text-white bg-gradient-to-r ${CATEGORY_COLORS[e.category] || 'from-gray-400 to-gray-500'} mr-2`}>
                        {e.category}
                      </span>
                    </div>
                    <ScoreBadge score={e.score} />
                  </div>
                  <p className="text-base font-semibold text-gray-800 mb-1">{e.prompt}</p>
                  <p className="text-xs text-gray-400 line-clamp-2">{e.content}</p>
                  <p className="text-xs text-gray-300 mt-2">{e.createdAt?.split('T')[0]} · {e.content?.length}字 → 查看详情</p>
                </button>
              ))
            )}
          </div>
        )}

        {/* 写作 tab */}
        {tab === 'write' && (
          <>
            {/* 选题 */}
            {step === 'pick' && (
              <>
                <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setCatFilter(cat)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
                        catFilter === cat ? 'bg-rose-500 text-white' : 'bg-white text-gray-500 border border-gray-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-3">
                  {filtered.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { setSelectedPrompt(p); setStep('write') }}
                      className="bg-white rounded-2xl p-4 text-left shadow-sm border border-pink-100 active:scale-95 transition-transform"
                    >
                      <span className={`text-xs px-2 py-0.5 rounded-full text-white bg-gradient-to-r ${CATEGORY_COLORS[p.category]}`}>
                        {p.category}
                      </span>
                      <div className="text-base font-bold text-gray-800 mt-2">{p.title}</div>
                      <div className="text-xs text-gray-400 mt-1">{p.requirements.slice(0, 35)}…</div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* 写作 */}
            {step === 'write' && selectedPrompt && (
              <div className="flex flex-col gap-4">
                <div className="bg-white rounded-2xl p-4 border border-pink-100">
                  <span className={`text-xs px-2 py-0.5 rounded-full text-white bg-gradient-to-r ${CATEGORY_COLORS[selectedPrompt.category]}`}>
                    {selectedPrompt.category}
                  </span>
                  <h2 className="text-xl font-bold text-gray-800 mt-2 mb-2">{selectedPrompt.title}</h2>
                  <p className="text-sm text-gray-500 mb-3">{selectedPrompt.requirements}</p>
                  <div className="bg-amber-50 rounded-xl p-3">
                    <p className="text-xs font-medium text-amber-600 mb-1">💡 写作提示</p>
                    <ul className="space-y-1">
                      {selectedPrompt.tips.map((tip, i) => (
                        <li key={i} className="text-xs text-amber-700">• {tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-600">开始写作：</label>
                    <span className={`text-xs font-medium ${wordCount >= selectedPrompt.minWords ? 'text-green-600' : 'text-gray-400'}`}>
                      {wordCount} / {selectedPrompt.minWords}字
                    </span>
                  </div>
                  <textarea
                    value={essay}
                    onChange={e => setEssay(e.target.value)}
                    placeholder={`以「${selectedPrompt.title}」为题…`}
                    rows={14}
                    className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-base text-gray-800 focus:outline-none focus:border-rose-400 resize-none leading-relaxed"
                  />
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-rose-400 to-pink-500 transition-all"
                      style={{ width: `${Math.min(100, (wordCount / selectedPrompt.minWords) * 100)}%` }}
                    />
                  </div>
                </div>

                {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                <button
                  onClick={handleSubmit}
                  disabled={loading || wordCount < 50}
                  className="w-full bg-rose-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-2xl"
                >
                  {loading ? '🤖 AI评分中，请稍候…' : '提交给AI批改 →'}
                </button>
                <button onClick={handleNew} className="text-center text-sm text-gray-400">换一个题目</button>
              </div>
            )}

            {/* 结果 */}
            {step === 'result' && result && (
              <div className="flex flex-col gap-4">
                <div className="bg-white rounded-2xl p-5 text-center border-2 border-rose-200">
                  <div className="text-xs text-gray-400 mb-1">{selectedPrompt.title}</div>
                  <div className="text-6xl font-bold text-rose-500 mb-1">{result.total}</div>
                  <div className="text-sm text-gray-400">满分 100 分</div>
                  <div className="mt-3 text-sm text-gray-600 leading-relaxed">{result.summary}</div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-600 mb-4">三维评分</h3>
                  <div className="space-y-4">
                    <ScoreBar label="📐 结构" score={result.structure} max={30} color="from-blue-400 to-indigo-500" />
                    <ScoreBar label="💡 内容" score={result.content} max={40} color="from-green-400 to-teal-500" />
                    <ScoreBar label="✨ 语言" score={result.language} max={30} color="from-purple-400 to-violet-500" />
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-3">
                  <p className="text-xs text-blue-500 font-medium">📐 结构：{result.structureFeedback}</p>
                  <div className="border-t border-gray-100 pt-2">
                    <p className="text-xs text-green-500 font-medium">💡 内容：{result.contentFeedback}</p>
                  </div>
                  <div className="border-t border-gray-100 pt-2">
                    <p className="text-xs text-purple-500 font-medium">✨ 语言：{result.languageFeedback}</p>
                  </div>
                </div>

                {/* 具体修改建议 */}
                {result.improvements?.length > 0 && (
                  <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
                    <h3 className="text-sm font-semibold text-amber-700 mb-3">✏️ 具体修改建议（对照修改）</h3>
                    <div className="space-y-3">
                      {result.improvements.map((item, i) => (
                        <div key={i} className="bg-white rounded-xl p-3 border border-amber-100">
                          <p className="text-xs text-red-500 mb-1">❌ 原文：「{item.original}」</p>
                          <p className="text-xs text-green-600 mb-1">✅ 改为：「{item.revised}」</p>
                          <p className="text-xs text-gray-400">💬 {item.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-rose-50 rounded-xl p-4 border border-rose-200">
                  <p className="text-xs font-medium text-rose-600 mb-1">🎯 最重要的改进建议</p>
                  <p className="text-sm text-rose-800">{result.suggestion}</p>
                </div>

                <div className="flex gap-3">
                  <button onClick={handleRevise} className="flex-1 border-2 border-rose-400 text-rose-600 font-semibold py-3 rounded-xl">
                    修改重写
                  </button>
                  <button onClick={handleNew} className="flex-1 bg-rose-500 text-white font-semibold py-3 rounded-xl">
                    写新作文
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
