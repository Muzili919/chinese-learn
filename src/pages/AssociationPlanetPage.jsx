import { useState, useEffect, useCallback, useRef } from 'react'
import { storage } from '../utils/storage'
import wordsNetwork from '../data/words_network.json'

// ─── 常量 ───────────────────────────────────────────────────────────────
const SESSION_SIZE = 15
const XP_CORRECT = 10

// ─── TTS ──────────────────────────────────────────────────────────────────
function speakEnglish(text) {
  if (!text || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.lang = 'en-US'
  utter.rate = 0.85
  window.speechSynthesis.speak(utter)
}

// ─── 工具函数 ────────────────────────────────────────────────────────────
const allWords = Object.values(wordsNetwork.words)
const allWordsMap = wordsNetwork.words
const tier1Words = allWords.filter(w => w.tier === 1)

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pickSessionWords() {
  return shuffle(tier1Words).slice(0, SESSION_SIZE)
}

// ─── 生成 2 道题（联想题 + 辨析题） ──────────────────────────────────────
function buildQuestions(wordObj) {
  const questions = []

  // 联想题：word 可以联想到哪个词？
  const assocs = wordObj.associations || []
  if (assocs.length > 0) {
    const correct = assocs[0]
    const distractors = shuffle(
      allWords
        .filter(w => !assocs.includes(w.word) && w.word !== wordObj.word)
        .map(w => w.word)
    ).slice(0, 3)
    const options = shuffle([correct, ...distractors])
    questions.push({
      type: 'association',
      label: '联想题',
      question: `"${wordObj.word}" 可以联想到哪个词？`,
      options,
      answer: correct,
    })
  }

  // 辨析题：从 confusables 里选一个作为正确答案，考查区分
  const confusables = (wordObj.confusables || []).filter(w => allWordsMap[w])
  if (confusables.length > 0) {
    const targetWord = confusables[0]
    const targetObj = allWordsMap[targetWord]
    const distractors = shuffle(
      allWords
        .filter(w => w.word !== targetWord)
        .map(w => w.word)
    ).slice(0, 3)
    const options = shuffle([targetWord, ...distractors])
    questions.push({
      type: 'confusable',
      label: '辨析题',
      question: `"${targetObj.meaning}"用英语怎么说？（注意别和 ${wordObj.word} 搞混！）`,
      options,
      answer: targetWord,
      hint: `${wordObj.word}(${wordObj.meaning}) vs ${targetWord}(${targetObj.meaning})`,
    })
  }

  // 拼写题
  questions.push({
    type: 'spelling',
    prompt: '根据中文意思，拼写出英文单词：',
    hint: wordObj.meaning,
    phonetic: wordObj.phonetic || '',
    answer: wordObj.word,
    feedback: `正确拼写：${wordObj.word}（${wordObj.meaning}）`,
  })

  return questions
}

// ─── 音节分割 ─────────────────────────────────────────────────────────────
function splitSyllables(word) {
  const w = word.toLowerCase()
  const dict = {
    basketball: ['bas','ket','ball'], football: ['foot','ball'],
    volleyball: ['vol','ley','ball'], bedroom: ['bed','room'],
    classroom: ['class','room'], blackboard: ['black','board'],
    breakfast: ['break','fast'], watermelon: ['wa','ter','me','lon'],
    elephant: ['el','e','phant'], beautiful: ['beau','ti','ful'],
    computer: ['com','pu','ter'], umbrella: ['um','brel','la'],
    butterfly: ['but','ter','fly'], interesting: ['in','ter','est','ing'],
    different: ['dif','fer','ent'], important: ['im','por','tant'],
    remember: ['re','mem','ber'], together: ['to','geth','er'],
    understand: ['un','der','stand'], chocolate: ['choc','o','late'],
    strawberry: ['straw','ber','ry'], dictionary: ['dic','tion','ar','y'],
    september: ['sep','tem','ber'], november: ['no','vem','ber'],
    december: ['de','cem','ber'], february: ['feb','ru','ar','y'],
    morning: ['mor','ning'], evening: ['eve','ning'], afternoon: ['af','ter','noon'],
    birthday: ['birth','day'], garden: ['gar','den'], window: ['win','dow'],
    family: ['fam','i','ly'], animal: ['an','i','mal'], student: ['stu','dent'],
    teacher: ['teach','er'], mother: ['moth','er'], father: ['fa','ther'],
    brother: ['broth','er'], sister: ['sis','ter'], rabbit: ['rab','bit'],
    monkey: ['mon','key'], tiger: ['ti','ger'], table: ['ta','ble'],
    purple: ['pur','ple'], circle: ['cir','cle'], people: ['peo','ple'],
    little: ['lit','tle'], bottle: ['bot','tle'], apple: ['ap','ple'],
  }
  if (dict[w]) return dict[w]
  if (w.length <= 4) return [word]
  return [word]
}

const SYLLABLE_COLORS = ['text-blue-600', 'text-emerald-600', 'text-purple-600', 'text-orange-500']

function SyllableDisplay({ word }) {
  const syllables = splitSyllables(word)
  if (syllables.length <= 1) {
    return <span className="font-mono text-3xl font-extrabold text-gray-800">{word}</span>
  }
  return (
    <span className="font-mono text-3xl font-extrabold">
      {syllables.map((syl, i) => (
        <span key={i} className={SYLLABLE_COLORS[i % SYLLABLE_COLORS.length]}>
          {syl}{i < syllables.length - 1 ? <span className="text-gray-300">·</span> : ''}
        </span>
      ))}
    </span>
  )
}

// ─── 对比弹窗 ──────────────────────────────────────────────────────────────
function ConfusableModal({ wordA, wordB, onClose }) {
  const objA = allWordsMap[wordA] || {}
  const objB = allWordsMap[wordB] || {}

  // 找出字母差异
  function getDiff() {
    if (!wordA || !wordB) return ''
    const la = wordA.toLowerCase()
    const lb = wordB.toLowerCase()
    const diffs = []
    const minLen = Math.min(la.length, lb.length)
    for (let i = 0; i < minLen; i++) {
      if (la[i] !== lb[i]) diffs.push(`第${i + 1}个字母：${la[i]} → ${lb[i]}`)
    }
    if (la.length !== lb.length) diffs.push(`长度不同：${la.length} vs ${lb.length} 个字母`)
    return diffs.length > 0 ? diffs.join('，') : '拼写不同'
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'modalIn 0.25s ease' }}
      >
        <div className="text-center mb-4">
          <div className="text-base font-bold text-gray-700 mb-1">易混词对比</div>
          <div className="text-xs text-gray-400">别搞混了！仔细看区别</div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          {/* 词 A */}
          <div className="flex-1 rounded-2xl p-3 text-center" style={{ background: 'linear-gradient(135deg,#eff6ff,#bfdbfe)' }}>
            <button
              className="text-lg font-extrabold text-blue-700"
              onClick={() => speakEnglish(wordA)}
            >
              {wordA} 🔊
            </button>
            <div className="text-sm text-blue-600 mt-1">{objA.meaning || ''}</div>
          </div>

          <div className="text-2xl font-bold text-gray-300">vs</div>

          {/* 词 B */}
          <div className="flex-1 rounded-2xl p-3 text-center" style={{ background: 'linear-gradient(135deg,#fff7ed,#fed7aa)' }}>
            <button
              className="text-lg font-extrabold text-orange-700"
              onClick={() => speakEnglish(wordB)}
            >
              {wordB} 🔊
            </button>
            <div className="text-sm text-orange-600 mt-1">{objB.meaning || ''}</div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2.5 text-xs text-amber-800 mb-4">
          <span className="font-bold">区别：</span>{getDiff()}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-bold text-sm active:scale-95 transition-transform"
        >
          明白了 ✓
        </button>
      </div>
    </div>
  )
}

// ─── 词根树主视图 ──────────────────────────────────────────────────────────
function WordTree({ wordObj, visible, onNodeClick, onConfusableClick }) {
  const associations = wordObj.associations || []
  const confusables = (wordObj.confusables || []).filter(w => allWordsMap[w])

  return (
    <div
      className="flex flex-col items-center gap-5 px-4"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.35s ease, transform 0.35s ease',
      }}
    >
      {/* 联想词区（上方，蓝色） */}
      {associations.length > 0 && (
        <div className="w-full">
          <div className="text-xs font-semibold text-blue-500 text-center mb-2">
            🔗 联想词 — 点击跳转
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {associations.map((w, i) => {
              const obj = allWordsMap[w]
              return (
                <button
                  key={w}
                  onClick={() => obj && onNodeClick(w)}
                  className="flex flex-col items-center px-4 py-2 rounded-2xl active:scale-95 transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                    color: '#1e40af',
                    minWidth: 64,
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateY(0)' : 'translateY(-12px)',
                    transition: `opacity 0.35s ${i * 0.07}s ease, transform 0.35s ${i * 0.07}s ease`,
                    boxShadow: obj ? '0 2px 8px rgba(59,130,246,0.2)' : 'none',
                    cursor: obj ? 'pointer' : 'default',
                  }}
                >
                  <span className="font-bold text-sm">{w}</span>
                  {obj && <span className="text-[10px] opacity-80">{obj.meaning}</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 连线装饰 */}
      {associations.length > 0 && (
        <div className="flex flex-col items-center gap-0.5">
          <div className="w-0.5 h-4 bg-gradient-to-b from-blue-300 to-gray-300 rounded-full" />
        </div>
      )}

      {/* 核心词卡 */}
      <div
        className="w-full rounded-3xl overflow-hidden shadow-lg"
        style={{
          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
          border: '2px solid #86efac',
        }}
      >
        {/* 单词行 */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-2">
          <button
            onClick={() => speakEnglish(wordObj.word)}
            className="text-2xl active:scale-90 transition-transform"
            title="朗读"
          >
            🔊
          </button>
          <div className="flex-1">
            <SyllableDisplay word={wordObj.word} />
            <div className="text-base text-emerald-700 font-semibold mt-0.5">
              {wordObj.meaning}
            </div>
          </div>
          <div
            className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: '#bbf7d0', color: '#166534' }}
          >
            tier {wordObj.tier}
          </div>
        </div>

        {/* 记忆口诀 */}
        {wordObj.memory_tip && (
          <div className="mx-4 mb-2 px-3 py-2 bg-white/60 rounded-xl">
            <span className="text-xs text-indigo-700">
              <span className="mr-1">💡</span>记忆：{wordObj.memory_tip}
            </span>
          </div>
        )}

        {/* 例句 */}
        {wordObj.example && (
          <div className="mx-4 mb-2 px-3 py-2 bg-white/60 rounded-xl flex items-start gap-2">
            <button
              onClick={() => speakEnglish(wordObj.example)}
              className="text-base flex-shrink-0 mt-0.5 active:scale-90 transition-transform"
            >
              🔊
            </button>
            <span className="text-xs text-gray-600 italic leading-relaxed">
              "{wordObj.example}"
            </span>
          </div>
        )}

        {/* 用法区别 */}
        {wordObj.usage_note && (
          <div className="mx-4 mb-4 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <div className="text-xs font-bold text-amber-600 mb-1">💡 用法区别</div>
            <div className="text-sm text-amber-800">{wordObj.usage_note}</div>
          </div>
        )}
        {!wordObj.usage_note && <div className="mb-4" />}
      </div>

      {/* 连线装饰 */}
      {confusables.length > 0 && (
        <div className="flex flex-col items-center gap-0.5">
          <div className="w-0.5 h-4 bg-gradient-to-b from-gray-300 to-orange-300 rounded-full" />
        </div>
      )}

      {/* 易混词区（下方，橙色） */}
      {confusables.length > 0 && (
        <div className="w-full">
          <div className="text-xs font-semibold text-orange-500 text-center mb-2">
            ⚠️ 易混词 — 点击对比
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {confusables.map((w, i) => {
              const obj = allWordsMap[w]
              return (
                <button
                  key={w}
                  onClick={() => onConfusableClick(wordObj.word, w)}
                  className="flex flex-col items-center px-4 py-2 rounded-2xl active:scale-95 transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #fff7ed, #fed7aa)',
                    color: '#9a3412',
                    minWidth: 64,
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateY(0)' : 'translateY(12px)',
                    transition: `opacity 0.35s ${i * 0.07}s ease, transform 0.35s ${i * 0.07}s ease`,
                    boxShadow: '0 2px 8px rgba(249,115,22,0.2)',
                  }}
                >
                  <span className="font-bold text-sm">{w}</span>
                  {obj && <span className="text-[10px] opacity-80">{obj.meaning}</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── 拼写判分 ────────────────────────────────────────────────────────────
function checkSpelling(input, answer) {
  return input.trim().toLowerCase() === answer.toLowerCase()
}

// ─── 答题区 ──────────────────────────────────────────────────────────────
function QuizSection({ wordObj, onWordDone }) {
  const [questions] = useState(() => buildQuestions(wordObj))
  const [qIndex, setQIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [userInput, setUserInput] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [results, setResults] = useState([])
  const [done, setDone] = useState(false)

  const q = questions[qIndex]

  function handleSelect(opt) {
    if (selected !== null) return
    const correct = opt === q.answer
    setSelected(opt)
    setResults(prev => [...prev, { correct }])
  }

  function handleSubmit() {
    if (q.type === 'spelling') {
      const correct = checkSpelling(userInput, q.answer)
      setIsCorrect(correct)
      setSubmitted(true)
      setResults(prev => [...prev, { correct }])
    }
  }

  function handleNext() {
    if (qIndex + 1 >= questions.length) {
      setDone(true)
    } else {
      setQIndex(i => i + 1)
      setSelected(null)
      setUserInput('')
      setSubmitted(false)
      setIsCorrect(false)
    }
  }

  function handleContinue() {
    const correct = results.filter(r => r.correct).length
    onWordDone(correct, questions.length)
  }

  if (questions.length === 0) {
    return (
      <div className="px-4 mt-4">
        <button
          onClick={() => onWordDone(0, 0)}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-bold text-base active:scale-95 transition-transform shadow-md"
        >
          继续下一个词 →
        </button>
      </div>
    )
  }

  if (done) {
    const correct = results.filter(r => r.correct).length
    const allRight = correct === results.length
    return (
      <div className="px-4 mt-4">
        <div
          className={`rounded-2xl px-4 py-4 mb-4 ${allRight ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}
        >
          <div className={`font-bold text-base mb-1 ${allRight ? 'text-green-700' : 'text-blue-700'}`}>
            {allRight ? '🎉 全对！+' + (correct * XP_CORRECT) + ' XP' : `👍 答对 ${correct}/${results.length} 题 +${correct * XP_CORRECT} XP`}
          </div>
          <div className="text-xs text-gray-500">继续探索下一个词吧！</div>
        </div>
        <button
          onClick={handleContinue}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-bold text-base active:scale-95 transition-transform shadow-md"
        >
          继续下一个词 →
        </button>
      </div>
    )
  }

  const choiceAnswered = selected !== null
  const choiceCorrect = choiceAnswered && selected === q.answer

  // 拼写题渲染
  if (q.type === 'spelling') {
    return (
      <div className="px-4 mt-4 pb-8">
        {/* 题型标签 + 进度 */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: '#f3e8ff', color: '#6b21a8' }}>
            ✏️ 拼写挑战
          </span>
          <span className="text-xs text-gray-400">{qIndex + 1} / {questions.length}</span>
        </div>

        <div>
          <p className="text-lg font-bold text-gray-800 mb-1">{q.prompt}</p>
          <div className="text-3xl font-bold text-center my-4 text-indigo-600">{q.hint}</div>
          {q.phonetic && (
            <div className="text-center text-gray-400 text-sm mb-4">{q.phonetic}</div>
          )}
          {!submitted ? (
            <div>
              <input
                type="text"
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && userInput.trim() && handleSubmit()}
                placeholder="输入英文单词..."
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-lg text-center font-mono tracking-widest focus:border-purple-400 outline-none"
                autoFocus
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
              />
              <button
                onClick={handleSubmit}
                disabled={!userInput.trim()}
                className="w-full mt-3 bg-purple-500 disabled:bg-gray-200 text-white font-bold py-3 rounded-xl active:scale-95 transition-all"
              >
                提交拼写
              </button>
            </div>
          ) : (
            <div>
              <div className={`rounded-xl p-4 text-center mb-3 ${isCorrect ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
                <div className="text-3xl mb-2">{isCorrect ? '✅' : '❌'}</div>
                <div className="font-bold text-lg">{isCorrect ? '拼写正确！+' + XP_CORRECT + ' XP' : `正确拼写：${q.answer}`}</div>
                {!isCorrect && <div className="text-sm text-gray-500 mt-1">你的答案：{userInput}</div>}
              </div>
              <button
                onClick={handleNext}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-bold text-base active:scale-95 transition-transform shadow-md"
              >
                {qIndex + 1 >= questions.length ? '查看本词结果 →' : '下一题 →'}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 mt-4 pb-8">
      {/* 题型标签 + 进度 */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-xs font-bold px-3 py-1 rounded-full"
          style={
            q.type === 'association'
              ? { background: '#dbeafe', color: '#1e40af' }
              : { background: '#fff7ed', color: '#9a3412' }
          }
        >
          {q.label}
        </span>
        <span className="text-xs text-gray-400">{qIndex + 1} / {questions.length}</span>
      </div>

      {/* 题目 */}
      <div
        className="rounded-2xl px-4 py-4 text-sm font-semibold text-gray-800 leading-relaxed mb-4"
        style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)' }}
      >
        {q.question}
      </div>

      {/* 选项 */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {q.options.map((opt, i) => {
          let style = 'border-gray-200 bg-white text-gray-700'
          if (choiceAnswered) {
            if (opt === q.answer) style = 'border-green-400 bg-green-50 text-green-700'
            else if (opt === selected) style = 'border-red-400 bg-red-50 text-red-600'
            else style = 'border-gray-200 bg-white text-gray-400'
          }
          return (
            <button
              key={i}
              onClick={() => handleSelect(opt)}
              disabled={choiceAnswered}
              className={`rounded-2xl border-2 px-3 py-3 text-sm font-medium text-left transition-all active:scale-95 ${style}`}
            >
              <span className="mr-1.5 text-xs font-bold text-gray-400">
                {['A', 'B', 'C', 'D'][i]}.
              </span>
              {opt}
            </button>
          )
        })}
      </div>

      {/* 反馈 */}
      {choiceAnswered && (
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed mb-3 ${choiceCorrect ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}
        >
          {choiceCorrect ? (
            <div className="font-bold">✅ 答对了！+{XP_CORRECT} XP</div>
          ) : (
            <>
              <div className="font-bold mb-1">❌ 答错了，别灰心！</div>
              <div className="text-xs">
                正确答案：<span className="font-bold">{q.answer}</span>
                {q.hint && <span className="ml-1 text-orange-600 block mt-0.5">⚠️ {q.hint}</span>}
              </div>
            </>
          )}
        </div>
      )}

      {/* 下一题 */}
      {choiceAnswered && (
        <button
          onClick={handleNext}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-bold text-base active:scale-95 transition-transform shadow-md"
        >
          {qIndex + 1 >= questions.length ? '查看本词结果 →' : '下一题 →'}
        </button>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// 主页面
// ═══════════════════════════════════════════════════════════════════════════
export default function AssociationPlanetPage({ user, onFinish, onBack }) {
  const [sessionWords] = useState(() => pickSessionWords())
  const [currentIdx, setCurrentIdx] = useState(0)
  const [treeVisible, setTreeVisible] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [modal, setModal] = useState(null) // { wordA, wordB }
  const [sessionResults, setSessionResults] = useState([]) // { correct, total }
  const [totalXP, setTotalXP] = useState(0)
  const [done, setDone] = useState(false)
  const scrollContainerRef = useRef(null)

  const currentWord = sessionWords[currentIdx]
  const xp = storage.getXP(user?.id)

  // 词切换时：滚回顶部 → fade out → 换词 → fade in + TTS
  const switchWord = useCallback((newIdx) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
    setTreeVisible(false)
    setShowQuiz(false)
    setTimeout(() => {
      setCurrentIdx(newIdx)
      setTreeVisible(true)
    }, 300)
  }, [])

  // 初始显示
  useEffect(() => {
    const t = setTimeout(() => setTreeVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  // 词切换时自动朗读
  useEffect(() => {
    if (treeVisible && currentWord) {
      speakEnglish(currentWord.word)
    }
  }, [treeVisible, currentWord])

  function handleRandomWord() {
    const newIdx = Math.floor(Math.random() * sessionWords.length)
    switchWord(newIdx)
  }

  function handleNodeClick(wordKey) {
    const idx = sessionWords.findIndex(w => w.word === wordKey)
    if (idx !== -1) {
      switchWord(idx)
    } else {
      // 词在 session 外，动态切换（仅展示，不计入 session）
      // 找到该词的 index 或直接替换当前展示
      // 这里简单地显示弹窗或忽略，保持 session 稳定
    }
  }

  function handleConfusableClick(wordA, wordB) {
    setModal({ wordA, wordB })
  }

  function handleWordDone(correct, total) {
    const xpGained = correct * XP_CORRECT
    if (xpGained > 0 && user?.id) {
      storage.addXP(user.id, xpGained)
    }
    setTotalXP(prev => prev + xpGained)
    const newResults = [...sessionResults, { correct, total }]
    setSessionResults(newResults)

    if (currentIdx + 1 >= sessionWords.length) {
      // session 结束
      setDone(true)
    } else {
      switchWord(currentIdx + 1)
    }
  }

  // Session 结束页
  if (done) {
    const totalCorrect = sessionResults.reduce((s, r) => s + r.correct, 0)
    const totalQs = sessionResults.reduce((s, r) => s + r.total, 0)
    const accuracy = totalQs > 0 ? Math.round((totalCorrect / totalQs) * 100) : 100
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 gap-6">
        <div className="text-7xl">{accuracy >= 80 ? '🎉' : accuracy >= 50 ? '👍' : '💪'}</div>
        <div className="text-2xl font-extrabold text-gray-800 text-center">
          联想探索完成！
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <div className="text-3xl font-extrabold text-emerald-600">{sessionWords.length}</div>
            <div className="text-xs text-gray-500 mt-0.5">探索词数</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-extrabold text-indigo-600">+{totalXP}</div>
            <div className="text-xs text-gray-500 mt-0.5">XP 奖励</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-extrabold text-sky-600">{accuracy}%</div>
            <div className="text-xs text-gray-500 mt-0.5">正确率</div>
          </div>
        </div>
        <button
          onClick={() => onFinish({
            correct: totalCorrect,
            total: totalQs,
            xpGained: totalXP,
          })}
          className="mt-2 w-full max-w-xs py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-600 text-white font-bold text-base shadow-md active:scale-95 transition-transform"
        >
          查看结果 →
        </button>
      </div>
    )
  }

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
          <h1 className="flex-1 text-xl font-bold text-gray-800">联想星球 🌐</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-600 font-bold px-2 py-1 bg-emerald-50 rounded-full">
              {xp + totalXP} XP
            </span>
            <button
              onClick={handleRandomWord}
              className="text-xs px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-bold active:scale-95 transition-transform shadow-sm"
            >
              换一个词
            </button>
          </div>
        </div>

        {/* 进度条 */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500"
                style={{ width: `${(currentIdx / sessionWords.length) * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 whitespace-nowrap font-medium">
              {currentIdx + 1} / {sessionWords.length}
            </span>
          </div>
        </div>
      </div>

      {/* 内容区 */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pb-10">
        <div className="pt-5 pb-4">
          {/* 词根树 */}
          <div style={{ minHeight: 400 }}>
            <WordTree
              wordObj={currentWord}
              visible={treeVisible}
              onNodeClick={handleNodeClick}
              onConfusableClick={handleConfusableClick}
            />
          </div>

          {/* 分割线 + 闯关按钮 */}
          {!showQuiz && treeVisible && (
            <div
              className="px-4 mt-6"
              style={{
                opacity: treeVisible ? 1 : 0,
                transition: 'opacity 0.5s 0.4s ease',
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">准备好了吗？</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <button
                onClick={() => setShowQuiz(true)}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-600 text-white font-bold text-base active:scale-95 transition-transform shadow-md"
              >
                开始闯关 ✍️ （3 道题）
              </button>
            </div>
          )}

          {/* 答题区 */}
          {showQuiz && (
            <div className="mt-2">
              <div className="flex items-center gap-3 px-4 mb-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs font-bold text-emerald-600">✍️ 闯关答题</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <QuizSection
                key={currentWord.word}
                wordObj={currentWord}
                onWordDone={handleWordDone}
              />
            </div>
          )}
        </div>
      </div>

      {/* 易混词对比弹窗 */}
      {modal && (
        <ConfusableModal
          wordA={modal.wordA}
          wordB={modal.wordB}
          onClose={() => setModal(null)}
        />
      )}

      {/* 弹窗动画样式 */}
      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.92) translateY(16px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}
