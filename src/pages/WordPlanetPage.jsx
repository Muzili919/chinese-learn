import { useState, useMemo, useRef } from 'react'
import { storage } from '../utils/storage'
import { speakEnglish as _speakEnglish } from '../utils/tts'
import wordsNetwork from '../data/words_network.json'

// ─── 常量 ───────────────────────────────────────────────────────────────
const SESSION_SIZE = 15
const XP_CORRECT = 8
const XP_WRONG = 2

const CATEGORY_NAMES = {
  colour: '🎨 颜色',
  school: '🏫 学校',
  stationery: '✏️ 文具',
  numbers: '🔢 数字',
  family: '👨‍👩‍👧 家庭',
  body: '💪 身体',
  home: '🏠 家',
  clothes: '👕 衣物',
  time: '⏰ 时间',
  days: '📅 星期',
  months: '📆 月份',
  seasons: '🌸 季节',
  people: '👥 人物',
  shapes: '🔷 形状',
  food: '🍎 食物',
  fruit: '🍊 水果',
  nature: '🌿 自然',
  place: '📍 地点',
  animal: '🐾 动物',
  transport: '🚗 交通',
  sports: '⚽ 运动',
  verb: '🏃 动词',
  adjective: '⭐ 形容词',
  adverb: '💨 副词',
  weather: '🌤 天气',
  preposition: '📐 介词',
  direction: '🧭 方向',
  misc: '📦 其他',
  greeting: '👋 问候',
  response: '💬 回应',
}

// ─── TTS ──────────────────────────────────────────────────────────────────
function speakEnglish(text) {
  if (!text) return
  _speakEnglish(text)
}

// ─── 工具函数 ────────────────────────────────────────────────────────────
const allWords = Object.values(wordsNetwork.words)
const tier1Words = allWords.filter(w => w.tier === 1)

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function randomFrom(arr, count, exclude = []) {
  const pool = arr.filter(x => !exclude.includes(x))
  return shuffle(pool).slice(0, count)
}

// ─── 题目生成 ─────────────────────────────────────────────────────────────
const QUESTION_TYPES = ['meaning_choice', 'trap_choice', 'association_fill', 'sentence_fill']

function buildQuestion(wordObj, idx) {
  const type = QUESTION_TYPES[Math.floor(idx / 5) % QUESTION_TYPES.length]
  const wordsMap = wordsNetwork.words

  if (type === 'meaning_choice') {
    // 答案：meaning；错误选项：confusables 的 meaning
    const confusableMeanings = (wordObj.confusables || [])
      .map(w => wordsMap[w]?.meaning)
      .filter(Boolean)
    const sameCatMeanings = allWords
      .filter(w => w.category === wordObj.category && w.word !== wordObj.word)
      .map(w => w.meaning)
    const distractors = randomFrom(
      [...new Set([...confusableMeanings, ...sameCatMeanings])],
      3,
      [wordObj.meaning]
    )
    const options = shuffle([wordObj.meaning, ...distractors.slice(0, 3)])
    return {
      type,
      label: '认意思',
      question: `"${wordObj.word}" 是什么意思？`,
      speakText: wordObj.word,
      options,
      answer: wordObj.meaning,
      wordObj,
    }
  }

  if (type === 'trap_choice') {
    // 答案：该词本身；错误选项：confusables
    const confusables = (wordObj.confusables || []).filter(w => wordsMap[w])
    const extraWords = randomFrom(
      allWords.filter(w => w.word !== wordObj.word && !(wordObj.confusables || []).includes(w.word)),
      3 - confusables.length
    ).map(w => w.word)
    const distractors = shuffle([...confusables, ...extraWords]).slice(0, 3)
    const options = shuffle([wordObj.word, ...distractors])
    return {
      type,
      label: '找陷阱',
      question: `哪个单词的意思是"${wordObj.meaning}"？`,
      speakText: null,
      options,
      answer: wordObj.word,
      wordObj,
    }
  }

  if (type === 'association_fill') {
    // 答案：associations[0]；错误选项：随机无关词
    const correctAssoc = (wordObj.associations || [])[0] || wordObj.word
    const allOtherWords = allWords
      .filter(w => !(wordObj.associations || []).includes(w.word) && w.word !== wordObj.word)
      .map(w => w.word)
    const distractors = randomFrom(allOtherWords, 3, [correctAssoc])
    const options = shuffle([correctAssoc, ...distractors.slice(0, 3)])
    return {
      type,
      label: '联想填词',
      question: `"${wordObj.word}" 可以联想到哪个词？`,
      speakText: wordObj.word,
      options,
      answer: correctAssoc,
      wordObj,
    }
  }

  // sentence_fill
  const blank = (wordObj.example || '').replace(
    new RegExp(`\\b${wordObj.word}\\b`, 'i'),
    '_____'
  )
  const confusables = (wordObj.confusables || []).filter(w => wordsMap[w])
  const extraWords = randomFrom(
    allWords.filter(w => w.word !== wordObj.word && !(wordObj.confusables || []).includes(w.word)),
    3 - confusables.length
  ).map(w => w.word)
  const distractors = shuffle([...confusables, ...extraWords]).slice(0, 3)
  const options = shuffle([wordObj.word, ...distractors])
  return {
    type,
    label: '例句填空',
    question: blank || `根据意思"${wordObj.meaning}"，选出正确单词：`,
    speakText: wordObj.example || null,
    options,
    answer: wordObj.word,
    wordObj,
  }
}

function generateSession() {
  const pool = shuffle(tier1Words).slice(0, SESSION_SIZE)
  return pool.map((w, i) => buildQuestion(w, i))
}

// ═══════════════════════════════════════════════════════════════════════════
// 探索模式 — 词卡
// ═══════════════════════════════════════════════════════════════════════════
function WordCard({ wordObj, allWordsMap, onJump }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className={`rounded-2xl border transition-all overflow-hidden ${open ? 'border-sky-300 shadow-md' : 'border-gray-200 shadow-sm'}`}
      style={{ background: open ? 'linear-gradient(135deg,#f0f9ff,#e0f2fe)' : '#fff' }}
    >
      {/* 折叠头部 */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-sky-50 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <button
          className="text-xl flex-shrink-0"
          onClick={e => { e.stopPropagation(); speakEnglish(wordObj.word) }}
          title="朗读"
        >🔊</button>
        <div className="flex-1 min-w-0">
          <span className="font-bold text-gray-800 text-base">{wordObj.word}</span>
          <span className="text-gray-400 text-xs ml-2">{wordObj.meaning}</span>
        </div>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-semibold"
          style={{ background: '#bae6fd', color: '#0369a1' }}
        >
          tier {wordObj.tier}
        </span>
        <span className="text-gray-400 text-sm ml-1">{open ? '▲' : '▼'}</span>
      </button>

      {/* 展开内容 */}
      {open && (
        <div className="px-4 pb-4 pt-1 space-y-3">
          {/* 例句 */}
          {wordObj.example && (
            <div className="text-sm text-gray-600 italic border-l-4 border-sky-300 pl-3">
              <button
                className="mr-1 text-base"
                onClick={() => speakEnglish(wordObj.example)}
                title="朗读例句"
              >🔊</button>
              "{wordObj.example}"
            </div>
          )}

          {/* 记忆口诀 */}
          {wordObj.memory_tip && (
            <div className="text-sm text-indigo-700 bg-indigo-50 rounded-xl px-3 py-2">
              💡 记忆口诀：{wordObj.memory_tip}
            </div>
          )}

          {/* 联想词 */}
          {(wordObj.associations || []).length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-1.5">🔗 联想词</div>
              <div className="flex flex-wrap gap-1.5">
                {(wordObj.associations || []).map(w => {
                  const wObj = allWordsMap[w]
                  return (
                    <button
                      key={w}
                      onClick={() => wObj && onJump(w)}
                      className="text-xs px-2.5 py-1 rounded-full font-medium transition-colors active:scale-95"
                      style={{ background: '#dbeafe', color: '#1d4ed8' }}
                    >
                      {w}{wObj ? ` ${wObj.meaning}` : ''}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* 易混词 */}
          {(wordObj.confusables || []).length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-1.5">⚠️ 易混词（别认错！）</div>
              <div className="flex flex-wrap gap-1.5">
                {(wordObj.confusables || []).map(w => {
                  const wObj = allWordsMap[w]
                  return (
                    <button
                      key={w}
                      onClick={() => wObj && onJump(w)}
                      className="text-xs px-2.5 py-1 rounded-full font-medium transition-colors active:scale-95"
                      style={{ background: '#fee2e2', color: '#b91c1c' }}
                    >
                      {w}{wObj ? ` ${wObj.meaning}` : ''}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// 探索模式
// ═══════════════════════════════════════════════════════════════════════════
function ExploreMode({ onSwitchQuiz }) {
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [expandedCats, setExpandedCats] = useState({})
  const cardRefs = useRef({})

  const allWordsMap = wordsNetwork.words

  const displayWords = useMemo(() => {
    const pool = showAll ? allWords : tier1Words
    if (!search.trim()) return pool
    const q = search.trim().toLowerCase()
    return pool.filter(
      w => w.word.toLowerCase().includes(q) || w.meaning.includes(q)
    )
  }, [search, showAll])

  // 按 category 分组
  const grouped = useMemo(() => {
    const map = {}
    for (const w of displayWords) {
      const cat = w.category || 'misc'
      if (!map[cat]) map[cat] = []
      map[cat].push(w)
    }
    return map
  }, [displayWords])

  const categories = Object.keys(grouped).sort()

  function handleJump(word) {
    setSearch(word)
    setTimeout(() => {
      const el = cardRefs.current[word]
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  function toggleCat(cat) {
    setExpandedCats(prev => ({ ...prev, [cat]: !prev[cat] }))
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      {/* 搜索框 */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">🔍</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜索单词或中文意思..."
          className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
        {search && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
            onClick={() => setSearch('')}
          >✕</button>
        )}
      </div>

      {/* 开关：显示全部词 */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          共 {displayWords.length} 个词
          {!showAll && <span className="text-gray-400">（仅高频词）</span>}
        </span>
        <button
          onClick={() => setShowAll(v => !v)}
          className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${showAll ? 'bg-sky-500 text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          {showAll ? '显示全部 ✓' : '显示全部词'}
        </button>
      </div>

      {/* 搜索结果直接列表 */}
      {search.trim() ? (
        <div className="space-y-2">
          {displayWords.length === 0 && (
            <div className="text-center text-gray-400 py-8 text-sm">未找到相关单词</div>
          )}
          {displayWords.map(w => (
            <div key={w.word} ref={el => { cardRefs.current[w.word] = el }}>
              <WordCard wordObj={w} allWordsMap={allWordsMap} onJump={handleJump} />
            </div>
          ))}
        </div>
      ) : (
        /* 按类别分组 */
        <div className="space-y-3">
          {categories.map(cat => {
            const words = grouped[cat]
            const catLabel = CATEGORY_NAMES[cat] || cat
            const isExpanded = expandedCats[cat]
            const shown = isExpanded ? words : words.slice(0, 5)
            return (
              <div key={cat} className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                {/* 分类头 */}
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-left bg-gray-50 active:bg-gray-100 transition-colors"
                  onClick={() => toggleCat(cat)}
                >
                  <span className="font-semibold text-sm text-gray-700">{catLabel}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{words.length} 个词</span>
                    <span className="text-gray-400 text-xs">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </button>

                {/* 词卡列表 */}
                <div className="p-2 space-y-2">
                  {shown.map(w => (
                    <div key={w.word} ref={el => { cardRefs.current[w.word] = el }}>
                      <WordCard wordObj={w} allWordsMap={allWordsMap} onJump={handleJump} />
                    </div>
                  ))}
                  {words.length > 5 && (
                    <button
                      onClick={() => toggleCat(cat)}
                      className="w-full text-xs text-sky-500 py-2 font-medium active:text-sky-700 transition-colors"
                    >
                      {isExpanded ? '收起' : `查看全部 ${words.length} 个 →`}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// 答题模式
// ═══════════════════════════════════════════════════════════════════════════
function QuizMode({ user, onFinish }) {
  const [questions] = useState(() => generateSession())
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [results, setResults] = useState([]) // { correct: bool }
  const [totalXP, setTotalXP] = useState(0)
  const [done, setDone] = useState(false)

  const q = questions[current]
  const answered = selected !== null

  function handleSelect(opt) {
    if (answered) return
    const correct = opt === q.answer
    setSelected(opt)
    const xp = correct ? XP_CORRECT : XP_WRONG
    storage.addXP(user.id, xp)
    setTotalXP(prev => prev + xp)
    setResults(prev => [...prev, { correct }])
  }

  function handleNext() {
    if (current + 1 >= questions.length) {
      setDone(true)
    } else {
      setCurrent(c => c + 1)
      setSelected(null)
    }
  }

  function handleFinish() {
    const correct = results.filter(r => r.correct).length
    onFinish({ correct, total: questions.length, xpGained: totalXP })
  }

  if (done) {
    const correct = results.filter(r => r.correct).length
    const pct = Math.round((correct / questions.length) * 100)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 py-10 gap-5">
        <div className="text-6xl">{pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '💪'}</div>
        <div className="text-2xl font-extrabold text-gray-800">本次答题完成！</div>
        <div className="flex gap-4 mt-1">
          <div className="text-center">
            <div className="text-3xl font-extrabold text-sky-600">{pct}%</div>
            <div className="text-xs text-gray-500 mt-0.5">正确率</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-extrabold text-indigo-600">+{totalXP}</div>
            <div className="text-xs text-gray-500 mt-0.5">XP 奖励</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-extrabold text-green-600">{correct}/{questions.length}</div>
            <div className="text-xs text-gray-500 mt-0.5">答对题数</div>
          </div>
        </div>
        <button
          onClick={handleFinish}
          className="mt-4 w-full max-w-xs py-3 rounded-2xl bg-gradient-to-r from-sky-400 to-indigo-600 text-white font-bold text-base shadow-md active:scale-95 transition-transform"
        >
          查看结果 →
        </button>
      </div>
    )
  }

  const isCorrect = selected !== null && selected === q.answer

  return (
    <div className="flex flex-col px-4 py-4 gap-4">
      {/* 进度条 */}
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-sky-400 to-indigo-500 transition-all"
            style={{ width: `${((current) / questions.length) * 100}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 font-medium whitespace-nowrap">
          {current + 1} / {questions.length}
        </span>
      </div>

      {/* 题型标签 */}
      <div className="flex items-center gap-2">
        <span
          className="text-xs font-bold px-3 py-1 rounded-full"
          style={{ background: '#e0f2fe', color: '#0369a1' }}
        >
          {q.label}
        </span>
        {q.speakText && (
          <button
            onClick={() => speakEnglish(q.speakText)}
            className="text-base"
            title="朗读"
          >🔊</button>
        )}
      </div>

      {/* 题目 */}
      <div
        className="rounded-2xl px-5 py-4 text-base font-semibold text-gray-800 leading-relaxed"
        style={{ background: 'linear-gradient(135deg,#f0f9ff,#e0f2fe)' }}
      >
        {q.question}
      </div>

      {/* 选项 */}
      <div className="grid grid-cols-2 gap-3">
        {q.options.map((opt, i) => {
          let style = 'border-gray-200 bg-white text-gray-700'
          if (answered) {
            if (opt === q.answer) style = 'border-green-400 bg-green-50 text-green-700'
            else if (opt === selected) style = 'border-red-400 bg-red-50 text-red-600'
            else style = 'border-gray-200 bg-white text-gray-400'
          }
          return (
            <button
              key={i}
              onClick={() => handleSelect(opt)}
              disabled={answered}
              className={`rounded-2xl border-2 px-3 py-3 text-sm font-medium text-left transition-all active:scale-95 ${style}`}
            >
              <span className="mr-1.5 text-xs font-bold text-gray-400">
                {['A','B','C','D'][i]}.
              </span>
              {opt}
            </button>
          )
        })}
      </div>

      {/* 答题反馈 */}
      {answered && (
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${isCorrect ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}
        >
          {isCorrect ? (
            <>
              <div className="font-bold mb-1">✅ 答对了！+{XP_CORRECT} XP</div>
              {q.wordObj.memory_tip && (
                <div className="text-xs text-green-700">💡 {q.wordObj.memory_tip}</div>
              )}
            </>
          ) : (
            <>
              <div className="font-bold mb-1">❌ 答错了 +{XP_WRONG} XP（继续加油）</div>
              <div className="text-xs">
                正确答案：<span className="font-bold">{q.answer}</span>
                {(q.wordObj.confusables || []).length > 0 && (
                  <span className="ml-1 text-red-600">
                    ⚠️ 易混词：{q.wordObj.confusables.join('、')}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* 下一题按钮 */}
      {answered && (
        <button
          onClick={handleNext}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-400 to-indigo-600 text-white font-bold text-base shadow-md active:scale-95 transition-transform"
        >
          {current + 1 >= questions.length ? '查看结果 →' : '下一题 →'}
        </button>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// 主页面
// ═══════════════════════════════════════════════════════════════════════════
export default function WordPlanetPage({ user, onFinish, onBack }) {
  const [mode, setMode] = useState('explore') // 'explore' | 'quiz'

  return (
    <div className="min-h-screen flex flex-col">
      {/* 顶部栏 */}
      <div
        className="sticky top-0 z-10 bg-white shadow-sm"
        style={{ paddingTop: 'env(safe-area-inset-top, 36px)' }}
      >
        <div className="flex items-center gap-3 px-4 pt-3 pb-3">
          <button
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-xl text-lg font-bold text-gray-500 active:bg-gray-200 transition-colors"
          >
            ←
          </button>
          <h1 className="flex-1 text-xl font-bold text-gray-800">单词星球 🔤</h1>
          <button
            onClick={() => setMode(m => m === 'explore' ? 'quiz' : 'explore')}
            className={`text-sm font-bold px-4 py-2 rounded-xl transition-colors active:scale-95 ${mode === 'quiz' ? 'bg-gray-100 text-gray-600' : 'bg-gradient-to-r from-sky-400 to-indigo-600 text-white shadow-sm'}`}
          >
            {mode === 'explore' ? '答题模式 →' : '探索模式 →'}
          </button>
        </div>

        {/* Tab 指示 */}
        <div className="flex border-t border-gray-100">
          {[
            { key: 'explore', label: '🌐 探索' },
            { key: 'quiz', label: '✍️ 答题' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setMode(tab.key)}
              className={`flex-1 text-sm py-2 font-semibold transition-colors ${mode === tab.key ? 'text-sky-600 border-b-2 border-sky-500' : 'text-gray-400'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto pb-8">
        {mode === 'explore' ? (
          <ExploreMode onSwitchQuiz={() => setMode('quiz')} />
        ) : (
          <QuizMode
            key={Date.now()} /* 每次进入答题模式重新生成题目 */
            user={user}
            onFinish={onFinish}
          />
        )}
      </div>
    </div>
  )
}
