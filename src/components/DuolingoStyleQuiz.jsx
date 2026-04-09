import { useState, useRef, useEffect, useMemo } from 'react'
import { generateVariant } from '../utils/ai'

// ─── 工具函数 ─────────────────────────────────────────────

function normalize(s) {
  return (s || '').trim()
    .replace(/（[0-9]）/g, ' ')
    .replace(/[，。！？、；：""''《》（）\s]/g, '')
}

function isWordBankQ(q) {
  if (q.type !== 'fill_blank') return false
  if (isJudgmentQ(q) || isTypoQ(q) || isOrderQ(q)) return false
  if (!/（[1-9]）/.test(q.answer)) return false
  if (!/__{4,}/.test(q.question)) return false
  // 每个子答案 ≤ 15 字，过滤掉翻译/赏析类长答案
  const subs = parseWordBankSubAnswers(q.answer)
  return subs.length > 0 && subs.every(a => a.text.length <= 15)
}

function isMatchingStyleQ(q) {
  return q.type === 'fill_blank'
    && !q.pairs
    && (q.question.includes('左列') || q.question.includes('连一连') || q.question.includes('连起来'))
    && /^[1-9]\./m.test(q.question)
    && /^[A-F]\./m.test(q.question)
    && !isJudgmentQ(q) && !isTypoQ(q) && !isOrderQ(q)
}

function extractMatchingPairs(q) {
  const leftItems = [...q.question.matchAll(/^([1-9])\.\s*(.+)$/gm)]
    .map(m => ({ num: parseInt(m[1]), text: m[2].trim() }))
  const rightItems = {}
  for (const m of q.question.matchAll(/^([A-F])\.\s*(.+)$/gm)) {
    rightItems[m[1]] = m[2].trim()
  }
  const answerMap = {}
  for (const m of q.answer.matchAll(/([1-9])[—-]([A-F])/g)) {
    answerMap[parseInt(m[1])] = m[2]
  }
  return leftItems.map(item => ({
    left: item.text,
    right: rightItems[answerMap[item.num]] || ''
  }))
}

function isJudgmentQ(q) {
  return /打.*[√×]|[√×].*打/.test(q.question) &&
    /（[1-9]）[√×]/.test(q.answer)
}

function isTypoQ(q) {
  return q.question.includes('错别字') &&
    q.answer.includes('→') &&
    !/[①②③④⑤⑥]/.test(q.answer)
}

function isOrderQ(q) {
  return /[①②③④⑤⑥]/.test(q.answer) && q.answer.includes('→')
}

function parseJudgmentAnswers(answer) {
  return [...answer.matchAll(/（[1-9]）([√×])/g)].map(m => m[1])
}

function parseJudgmentStatements(text) {
  return text.split('\n').map(l => l.trim())
    .filter(l => /^（[1-9]）/.test(l))
    .map(l => l.replace(/（　）\s*$/, '').replace(/^（[1-9]）/, '').trim())
}

function parseTypoItems(text) {
  return [...text.matchAll(/（([1-9])）\s*([^→\n]+?)\s*（　）/g)]
    .map(m => ({ num: parseInt(m[1]), word: m[2].trim() }))
}

function parseTypoCorrections(answer) {
  const result = {}
  for (const m of answer.matchAll(/（([1-9])）[^→（\s]*?([^\s（→]+)→([^\s（\n]+)/g)) {
    result[parseInt(m[1])] = m[3].trim()
  }
  for (const m of answer.matchAll(/（([1-9])）[^→\n]*（正确/g)) {
    result[parseInt(m[1])] = '__ok__'
  }
  return result
}

// 解析词库子题答案 （1）死去元知万事空 → [{num,text}]
function parseWordBankSubAnswers(answer) {
  const results = []
  for (const m of answer.matchAll(/（([1-9])）([^（\n]+)/g)) {
    results.push({ num: parseInt(m[1]), text: m[2].trim() })
  }
  return results
}

// 提取题目里第 n 项的原句（含空格行）
function extractBlankLine(questionText, num) {
  const lines = questionText.split('\n')
  const line = lines.find(l => l.includes(`（${num}）`))
  return line ? line.trim() : ''
}

// 把答案文本切成2字词块
function segmentToChips(text) {
  const cleaned = text.replace(/[，。！？、；：""''《》（）\s]/g, '')
  const chips = []
  for (let i = 0; i < cleaned.length; i += 2) {
    chips.push(cleaned.slice(i, Math.min(i + 2, cleaned.length)))
  }
  return chips
}

function parseOrderOptions(text) {
  return [...text.matchAll(/([①②③④⑤⑥⑦⑧⑨])\s*([^\s①②③④⑤⑥⑦⑧⑨→\n　]+)/g)]
    .map(m => ({ symbol: m[1], text: m[2].trim() }))
}

function parseOrderAnswer(answer) {
  return [...answer.matchAll(/([①②③④⑤⑥⑦⑧⑨])/g)].map(m => m[1])
}

// ── 多子题解析（通用） ──────────────────────────────────────
// 把 "指令\n（1）xxx\n（2）yyy" 拆成 instruction + stems[]
function parseSubQStems(questionText) {
  const firstSubIdx = questionText.search(/（[1-9]）/)
  if (firstSubIdx < 0) return { instruction: questionText.trim(), stems: [] }
  const instruction = questionText.slice(0, firstSubIdx).trim()
  const rest = questionText.slice(firstSubIdx)
  const stems = []
  const matches = [...rest.matchAll(/（([1-9])）([\s\S]*?)(?=（[1-9]）|$)/g)]
  for (const m of matches) {
    stems.push({ num: parseInt(m[1]), text: m[2].trim() })
  }
  return { instruction, stems }
}

// "（1）吩咐 （2）爱慕" → {1:'吩咐', 2:'爱慕'}
function parseExpectedAnswers(answerText) {
  const map = {}
  for (const m of (answerText || '').matchAll(/（([1-9])）([\s\S]*?)(?=（[1-9]）|$)/g)) {
    map[parseInt(m[1])] = m[2].trim()
  }
  return map
}

// 智能评分：短答案精确匹配，长答案关键词匹配
function smartCheck(input, expected) {
  const n = normalize(input)
  const ne = normalize(expected)
  if (n === ne) return true
  // 长答案：去中文标点后字数 > 5，用关键词匹配
  const cjkLen = expected.replace(/[^\u4e00-\u9fff]/g, '').length
  if (cjkLen <= 5) return false
  const keywords = expected.split(/[，。！？、；：""''《》（）\s]+/).filter(w => w.length >= 2)
  if (keywords.length === 0) return n.length > 0
  const matched = keywords.filter(kw => n.includes(kw)).length
  return matched / keywords.length >= 0.6
}

// 判断是否为普通多子题（需要翻页作答）
function isMultiSubQ(q) {
  if (q.type !== 'fill_blank') return false
  if (isJudgmentQ(q) || isTypoQ(q) || isOrderQ(q) || isWordBankQ(q) || isMatchingStyleQ(q)) return false
  return /（[2-9]）/.test(q.question) || /（[2-9]）/.test(q.answer)
}

// ─── 底部反馈面板 ─────────────────────────────────────────

function FeedbackPanel({ correct, analysis, answer, onContinue, variantState }) {
  // variantState = { phase, question, selected, onSelect, onGenerate, showButton }
  const vs = variantState || {}

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-30 rounded-t-3xl shadow-2xl max-h-[80vh] flex flex-col ${
      correct ? 'bg-green-50 border-t-4 border-green-400' : 'bg-red-50 border-t-4 border-red-400'
    }`}>
      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-2">
        <div className="max-w-md mx-auto">
          <p className={`text-xl font-bold mb-3 ${correct ? 'text-green-600' : 'text-red-500'}`}>
            {correct ? '✓ 正确！' : '✗ 答错了'}
          </p>
          {!correct && answer && (
            <div className="mb-3 bg-white rounded-2xl px-4 py-3 border border-gray-200">
              <p className="text-xs text-gray-400 mb-1 font-medium">正确答案</p>
              <p className="text-sm font-semibold text-gray-800 whitespace-pre-wrap leading-relaxed">{answer}</p>
            </div>
          )}
          {analysis && (
            <div className="mb-3 bg-white/60 rounded-2xl px-4 py-3 border border-gray-100">
              <p className="text-xs text-gray-400 mb-1 font-medium">解析</p>
              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{analysis}</p>
            </div>
          )}

          {/* 举一反三区域 - 在面板内部 */}
          {vs.showButton && !correct && vs.phase === 'idle' && (
            <button onClick={vs.onGenerate}
              className="w-full mb-3 py-3 rounded-2xl font-bold text-violet-600 bg-white border-2 border-violet-300 text-sm active:scale-95">
              🔀 举一反三（AI出题）
            </button>
          )}
          {vs.showButton && vs.phase === 'loading' && (
            <div className="w-full mb-3 py-3 rounded-2xl bg-violet-50 border-2 border-violet-100 text-center text-sm text-violet-400">
              AI 正在出题...
            </div>
          )}
          {vs.showButton && (vs.phase === 'answering' || vs.phase === 'done') && vs.question && (
            <div className="mb-3 bg-violet-50 border-2 border-violet-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-violet-600 text-sm font-bold">🔀 举一反三</span>
                <span className="bg-violet-100 text-violet-600 text-xs px-2 py-0.5 rounded-full">AI 出题</span>
              </div>
              <p className="text-base text-gray-800 font-medium mb-3 leading-relaxed">{vs.question.question}</p>
              <div className="flex flex-col gap-2">
                {vs.question.options?.map(opt => {
                  let cls = 'bg-white border-2 border-gray-200 text-gray-700'
                  if (vs.selected) {
                    if (opt === vs.question.answer) cls = 'bg-green-100 border-green-400 text-green-800'
                    else if (opt === vs.selected) cls = 'bg-red-100 border-red-400 text-red-700'
                    else cls = 'bg-white border-gray-100 text-gray-300'
                  }
                  return (
                    <button key={opt}
                      onClick={() => !vs.selected && vs.onSelect(opt)}
                      disabled={!!vs.selected}
                      className={`${cls} rounded-xl px-4 py-3 text-left text-sm font-medium transition-all`}>
                      {opt}
                    </button>
                  )
                })}
              </div>
              {vs.selected && (
                <p className={`text-xs mt-2 font-semibold ${vs.selected === vs.question.answer ? 'text-green-600' : 'text-red-500'}`}>
                  {vs.selected === vs.question.answer ? '✓ 答对了！🎉' : `✗ 正确答案：${vs.question.answer}`}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="px-5 pt-3 pb-8">
        <div className="max-w-md mx-auto">
          <button onClick={onContinue}
            className={`w-full py-3 rounded-2xl font-bold text-white text-base active:scale-95 transition-all ${
              correct ? 'bg-green-500' : 'bg-red-500'
            }`}>
            继续
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── 单选题 ──────────────────────────────────────────────

function ChoiceQuestion({ question, onDone }) {
  const [selected, setSelected] = useState(null)

  function handleSelect(opt) {
    if (selected) return
    setSelected(opt)
    onDone(opt, opt === question.answer)
  }

  return (
    <div className="flex flex-col gap-3">
      {question.options.map(opt => {
        let cls = 'bg-white border-2 border-gray-200 text-gray-800'
        if (selected) {
          if (opt === question.answer) cls = 'bg-green-100 border-2 border-green-500 text-green-800'
          else if (opt === selected) cls = 'bg-red-100 border-2 border-red-400 text-red-700'
          else cls = 'bg-white border-2 border-gray-100 text-gray-300'
        }
        return (
          <button key={opt} onClick={() => handleSelect(opt)} disabled={!!selected}
            className={`${cls} rounded-2xl px-5 py-4 text-left text-base leading-snug font-medium transition-all active:scale-[0.98] shadow-sm`}>
            {opt}
          </button>
        )
      })}
    </div>
  )
}

// ─── 判断题（翻页逐题作答）────────────────────────────────

function JudgmentQuestion({ question, onDone }) {
  const correctAnswers = parseJudgmentAnswers(question.answer)
  const statements = parseJudgmentStatements(question.question)
  const instruction = question.question.split('\n').filter(l => l.trim() && !/^（[1-9]）/.test(l.trim()))[0] || ''
  const [subIndex, setSubIndex] = useState(0)
  const [pick, setPick] = useState(null)
  const [phase, setPhase] = useState('input') // 'input' | 'feedback'
  const resultsRef = useRef([])
  const [results, setResults] = useState([])

  const current = statements[subIndex]
  const correctAns = correctAnswers[subIndex]

  function handleSubmit() {
    const isCorrect = pick === correctAns
    const newResults = [...resultsRef.current, { correct: isCorrect }]
    resultsRef.current = newResults
    setResults(newResults)
    setPhase('feedback')
  }

  function handleNext() {
    const nextIdx = subIndex + 1
    if (nextIdx >= statements.length) {
      const allCorrect = resultsRef.current.every(r => r.correct)
      onDone(allCorrect ? question.answer : '答错', allCorrect)
    } else {
      setSubIndex(nextIdx)
      setPick(null)
      setPhase('input')
    }
  }

  if (!current) return null
  const thisResult = results[subIndex]

  return (
    <div className="flex flex-col gap-4">
      {/* 题目指令 */}
      {instruction && (
        <div className="bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-600">{instruction}</p>
        </div>
      )}

      {/* 进度点 */}
      {statements.length > 1 && (
        <div className="flex gap-1.5 justify-center">
          {statements.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all ${
              i < subIndex ? 'w-5 bg-indigo-400' :
              i === subIndex ? 'w-5 bg-indigo-600' :
              'w-2 bg-gray-200'
            }`} />
          ))}
        </div>
      )}

      {/* 当前题干 */}
      <div className={`rounded-2xl px-4 py-4 border-2 shadow-sm ${
        phase === 'feedback'
          ? thisResult?.correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          : 'bg-white border-gray-100'
      }`}>
        <p className="text-xs text-indigo-500 font-semibold mb-2">
          第 {subIndex + 1} 题（共 {statements.length} 题）
        </p>
        <p className="text-base text-gray-800 leading-relaxed">{current}</p>
        {phase === 'feedback' && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className={`text-sm font-bold mb-1 ${thisResult?.correct ? 'text-green-600' : 'text-red-500'}`}>
              {thisResult?.correct ? '✓ 正确！' : '✗ 答错了'}
            </p>
            {!thisResult?.correct && (
              <p className="text-sm text-gray-700">正确答案：<span className="font-semibold">{correctAns === '√' ? '对（√）' : '错（×）'}</span></p>
            )}
          </div>
        )}
      </div>

      {/* 对/错 按钮 */}
      {phase === 'input' && (
        <div className="flex gap-3">
          {[{ label: '对', value: '√' }, { label: '错', value: '×' }].map(({ label, value }) => (
            <button key={value} onClick={() => setPick(value)}
              className={`flex-1 py-4 rounded-2xl border-2 font-bold text-xl transition-all ${
                pick === value
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 bg-white text-gray-500'
              }`}>
              {label}
            </button>
          ))}
        </div>
      )}

      {phase === 'input' && (
        <button onClick={handleSubmit} disabled={!pick}
          className="w-full bg-indigo-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-2xl text-base">
          确认
        </button>
      )}
      {phase === 'feedback' && (
        <button onClick={handleNext}
          className={`w-full font-bold py-4 rounded-2xl text-base text-white ${
            thisResult?.correct ? 'bg-green-500' : 'bg-red-500'
          }`}>
          {subIndex + 1 >= statements.length ? '完成 ✓' : `下一题 → (${subIndex + 2}/${statements.length})`}
        </button>
      )}
    </div>
  )
}

// ─── 错别字题（翻页逐项作答）────────────────────────────────

function TypoQuestion({ question, onDone }) {
  const items = parseTypoItems(question.question)
  const corrections = parseTypoCorrections(question.answer)
  const instruction = question.question.split('\n')[0] || ''
  const [subIndex, setSubIndex] = useState(0)
  const [input, setInput] = useState('')
  const [phase, setPhase] = useState('input') // 'input' | 'feedback'
  const resultsRef = useRef([])
  const [results, setResults] = useState([])

  const current = items[subIndex]
  if (!current) return null

  const expected = corrections[current.num]
  const isOk = expected === '__ok__'
  const thisResult = results[subIndex]
  const canSubmit = isOk || input.trim() !== ''

  function handleSubmit() {
    const isCorrect = isOk ? true : (input.trim() === expected)
    const newResults = [...resultsRef.current, { correct: isCorrect }]
    resultsRef.current = newResults
    setResults(newResults)
    setPhase('feedback')
  }

  function handleNext() {
    const nextIdx = subIndex + 1
    if (nextIdx >= items.length) {
      const allCorrect = resultsRef.current.every(r => r.correct)
      onDone(allCorrect ? question.answer : '答错', allCorrect)
    } else {
      setSubIndex(nextIdx)
      setInput('')
      setPhase('input')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 题目指令 */}
      <div className="bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm">
        <p className="text-sm text-gray-600">{instruction}</p>
      </div>

      {/* 进度点 */}
      {items.length > 1 && (
        <div className="flex gap-1.5 justify-center">
          {items.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all ${
              i < subIndex ? 'w-5 bg-indigo-400' :
              i === subIndex ? 'w-5 bg-indigo-600' :
              'w-2 bg-gray-200'
            }`} />
          ))}
        </div>
      )}

      {/* 当前题干 */}
      <div className={`rounded-2xl px-4 py-4 border-2 shadow-sm ${
        phase === 'feedback'
          ? thisResult?.correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          : 'bg-white border-gray-100'
      }`}>
        <p className="text-xs text-indigo-500 font-semibold mb-2">
          第 {subIndex + 1} 题（共 {items.length} 题）
        </p>
        <p className="text-base text-gray-800 leading-relaxed">{current.word}</p>
        {phase === 'feedback' && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className={`text-sm font-bold mb-1 ${thisResult?.correct ? 'text-green-600' : 'text-red-500'}`}>
              {thisResult?.correct ? (isOk ? '✓ 无错别字' : '✓ 正确！') : '✗ 答错了'}
            </p>
            {!thisResult?.correct && (
              <p className="text-sm text-gray-700">正确改法：<span className="font-semibold text-green-700">{expected}</span></p>
            )}
            {thisResult?.correct && isOk && (
              <p className="text-sm text-gray-500">此句没有错别字 ✓</p>
            )}
          </div>
        )}
      </div>

      {/* 输入区 */}
      {phase === 'input' && (
        isOk ? (
          <div className="bg-blue-50 rounded-2xl px-4 py-3 border border-blue-200 text-center text-blue-600 text-sm font-medium">
            此项无错别字，直接点"确认"
          </div>
        ) : (
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && canSubmit && handleSubmit()}
            className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-base text-gray-800 focus:outline-none focus:border-indigo-400"
            placeholder="写出改正后的字"
            maxLength={6}
            style={{ fontSize: '16px' }}
          />
        )
      )}

      {phase === 'input' && (
        <button onClick={handleSubmit} disabled={!canSubmit}
          className="w-full bg-indigo-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-2xl text-base">
          确认
        </button>
      )}
      {phase === 'feedback' && (
        <button onClick={handleNext}
          className={`w-full font-bold py-4 rounded-2xl text-base text-white ${
            thisResult?.correct ? 'bg-green-500' : 'bg-red-500'
          }`}>
          {subIndex + 1 >= items.length ? '完成 ✓' : `下一题 → (${subIndex + 2}/${items.length})`}
        </button>
      )}
    </div>
  )
}

// ─── 排序题 ──────────────────────────────────────────────

function OrderQuestion({ question, onDone }) {
  const options = parseOrderOptions(question.question)
  const correctOrder = parseOrderAnswer(question.answer)
  const [sequence, setSequence] = useState([])
  const [submitted, setSubmitted] = useState(false)
  const remaining = options.filter(o => !sequence.includes(o.symbol))
  const instruction = question.question.split('\n').filter(l => l.trim())[0] || ''

  function handleSubmit() {
    const correct = sequence.length === correctOrder.length &&
      sequence.every((s, i) => s === correctOrder[i])
    setSubmitted(true)
    onDone(correct ? question.answer : '答错', correct)
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-gray-500 bg-white rounded-2xl px-4 py-3 border border-gray-100">{instruction}</p>
      <div className="bg-indigo-50 border-2 border-indigo-200 rounded-2xl p-4 min-h-[64px] flex flex-wrap items-center gap-2">
        {sequence.length === 0
          ? <p className="text-xs text-indigo-300 w-full text-center">点击下方按钮依次排列</p>
          : sequence.map((sym, i) => {
              const opt = options.find(o => o.symbol === sym)
              const isRight = submitted && sym === correctOrder[i]
              const isWrong = submitted && sym !== correctOrder[i]
              return (
                <span key={i} className={`flex items-center gap-1 text-sm font-bold px-3 py-1.5 rounded-xl ${
                  isRight ? 'bg-green-100 text-green-700 border border-green-300' :
                  isWrong ? 'bg-red-100 text-red-600 border border-red-300' :
                  'bg-indigo-100 text-indigo-700'
                }`}>
                  {sym} {opt?.text}
                  {i < sequence.length - 1 && <span className="text-gray-400 ml-1 font-normal">→</span>}
                </span>
              )
            })
        }
      </div>
      {!submitted && (
        <div className="flex flex-wrap gap-2">
          {remaining.map(opt => (
            <button key={opt.symbol} onClick={() => setSequence(p => [...p, opt.symbol])}
              className="bg-white border-2 border-gray-200 text-gray-800 px-4 py-2.5 rounded-xl text-sm font-semibold active:scale-95 transition-all shadow-sm">
              {opt.symbol} {opt.text}
            </button>
          ))}
          {sequence.length > 0 && (
            <button onClick={() => setSequence(p => p.slice(0, -1))}
              className="px-3 py-2.5 bg-gray-100 text-gray-500 rounded-xl text-sm">撤销</button>
          )}
        </div>
      )}
      {submitted && !sequence.every((s, i) => s === correctOrder[i]) && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-4 py-3">
          <p className="text-xs text-blue-500 font-semibold mb-1">正确顺序</p>
          <div className="flex flex-wrap gap-1 text-sm text-blue-800">
            {correctOrder.map((sym, i) => {
              const opt = options.find(o => o.symbol === sym)
              return <span key={i}>{sym} {opt?.text}{i < correctOrder.length - 1 ? ' → ' : ''}</span>
            })}
          </div>
        </div>
      )}
      {!submitted && remaining.length === 0 && (
        <button onClick={handleSubmit}
          className="w-full bg-indigo-500 text-white font-bold py-4 rounded-2xl text-base">提交</button>
      )}
    </div>
  )
}

// ─── 普通填空 ─────────────────────────────────────────────

function FillQuestion({ question, onDone }) {
  const [input, setInput] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const correct = submitted && normalize(input) === normalize(question.answer)

  function handleSubmit() {
    if (!input.trim() || submitted) return
    setSubmitted(true)
    onDone(input, normalize(input) === normalize(question.answer))
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-white rounded-3xl px-5 py-5 shadow-sm border border-gray-100">
        <p className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap">{question.question}</p>
      </div>
      <input type="text" value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
        disabled={submitted} placeholder="在这里输入答案…"
        className={`w-full border-2 rounded-2xl px-5 py-4 text-base text-gray-800 focus:outline-none transition-colors ${
          submitted
            ? correct ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'
            : 'border-gray-200 focus:border-indigo-400 bg-white'
        }`}
      />
      {!submitted && (
        <button onClick={handleSubmit} disabled={!input.trim()}
          className="w-full bg-indigo-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-2xl text-base">
          提交
        </button>
      )}
    </div>
  )
}

// ─── 词库填空题（诗句/多项填空，点击词块拼答案）──────────
function WordBankQuestion({ question, onDone }) {
  const subAnswers = useMemo(() => parseWordBankSubAnswers(question.answer), [question.answer])
  const [subIndex, setSubIndex] = useState(0)
  const [assembled, setAssembled] = useState([]) // 已点的词块
  const [subPhase, setSubPhase] = useState('input') // 'input' | 'feedback'
  const [results, setResults] = useState([])
  const resultsRef = useRef([])

  const current = subAnswers[subIndex]

  // 每换子题时重置词块
  const wordBank = useMemo(() => {
    if (!current) return []
    const correctChips = segmentToChips(current.text)
    const otherChips = subAnswers
      .filter((_, i) => i !== subIndex)
      .flatMap(a => segmentToChips(a.text))
    const distractors = [...otherChips].sort(() => Math.random() - 0.5).slice(0, 2)
    // 给每个词块加唯一key（因可能有重复词）
    return [...correctChips, ...distractors]
      .sort(() => Math.random() - 0.5)
      .map((text, i) => ({ id: i, text }))
  }, [subIndex]) // eslint-disable-line

  const usedIds = assembled.map(c => c.id)
  const assembledText = assembled.map(c => c.text).join('')
  const correctChips = current ? segmentToChips(current.text) : []
  const canSubmit = subPhase === 'input' && assembled.length >= correctChips.length

  function handleChipClick(chip) {
    if (subPhase !== 'input' || usedIds.includes(chip.id)) return
    setAssembled(prev => [...prev, chip])
  }

  function handleUndo() {
    if (subPhase !== 'input') return
    setAssembled(prev => prev.slice(0, -1))
  }

  function handleSubmit() {
    if (!canSubmit) return
    const isCorrect = normalize(assembledText) === normalize(current.text)
    const newResults = [...resultsRef.current, { correct: isCorrect }]
    resultsRef.current = newResults
    setResults(newResults)
    setSubPhase('feedback')
  }

  function handleNext() {
    const nextIdx = subIndex + 1
    if (nextIdx >= subAnswers.length) {
      const allCorrect = resultsRef.current.every(r => r.correct)
      onDone(allCorrect ? question.answer : '答错', allCorrect)
    } else {
      setSubIndex(nextIdx)
      setSubPhase('input')
      setAssembled([])
    }
  }

  if (!current) return null
  const thisResult = results[subIndex]
  const blankLine = extractBlankLine(question.question, current.num)
  // 第一行作为题目指令（如"补充下列诗句。"）
  const instruction = question.question.split('\n').filter(l => l.trim() && !/^（[1-9]）/.test(l.trim()))[0] || ''

  return (
    <div className="flex flex-col gap-4">
      {/* 题目指令 */}
      {instruction && (
        <div className="bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-600">{instruction}</p>
        </div>
      )}

      {/* 进度点 */}
      {subAnswers.length > 1 && (
        <div className="flex gap-1.5 justify-center">
          {subAnswers.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all ${
              i < subIndex ? 'w-5 bg-indigo-400' :
              i === subIndex ? 'w-5 bg-indigo-600' :
              'w-2 bg-gray-200'
            }`} />
          ))}
        </div>
      )}

      {/* 当前空格所在的诗句/题干 */}
      {blankLine && (
        <div className="bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm">
          <p className="text-xs text-indigo-500 font-semibold mb-1">第 {subIndex + 1} 空（共 {subAnswers.length} 空）</p>
          <p className="text-base text-gray-700 leading-relaxed font-medium">
            {blankLine.replace(/________________/g, '＿＿＿＿')}
          </p>
        </div>
      )}

      {/* 已拼区域 */}
      <div className={`min-h-[60px] rounded-2xl border-2 px-4 py-3 flex flex-wrap items-center gap-1 transition-all ${
        subPhase === 'feedback'
          ? thisResult?.correct ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'
          : assembled.length ? 'bg-indigo-50 border-indigo-300' : 'bg-gray-50 border-dashed border-gray-200'
      }`}>
        {assembled.length === 0
          ? <p className="text-xs text-gray-300 w-full text-center">点击下方词块拼出答案</p>
          : assembled.map((c, i) => (
            <span key={i} className="text-base font-semibold text-indigo-700">{c.text}</span>
          ))
        }
        {subPhase === 'feedback' && !thisResult?.correct && (
          <p className="text-xs text-green-600 font-bold w-full mt-1">正确答案：{current.text}</p>
        )}
      </div>

      {/* 词块 + 撤销 */}
      {subPhase === 'input' && (
        <div className="flex flex-wrap gap-2">
          {wordBank.map(chip => {
            const used = usedIds.includes(chip.id)
            return (
              <button key={chip.id} onClick={() => handleChipClick(chip)}
                disabled={used}
                className={`px-4 py-2.5 rounded-xl border-2 text-base font-semibold transition-all ${
                  used
                    ? 'bg-gray-50 border-gray-100 text-gray-200 cursor-not-allowed'
                    : 'bg-white border-gray-200 text-gray-800 active:scale-95 shadow-sm'
                }`}>
                {chip.text}
              </button>
            )
          })}
          {assembled.length > 0 && (
            <button onClick={handleUndo}
              className="px-3 py-2.5 bg-gray-100 text-gray-500 rounded-xl text-sm border border-gray-200">
              ← 撤销
            </button>
          )}
        </div>
      )}

      {/* 确认按钮 / 继续按钮 */}
      {subPhase === 'input' && (
        <button onClick={handleSubmit} disabled={!canSubmit}
          className="w-full bg-indigo-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-2xl text-base">
          确认
        </button>
      )}
      {subPhase === 'feedback' && (
        <button onClick={handleNext}
          className={`w-full font-bold py-4 rounded-2xl text-base text-white ${
            results[subIndex]?.correct ? 'bg-green-500' : 'bg-red-500'
          }`}>
          {subIndex + 1 >= subAnswers.length
            ? '完成 ✓'
            : `下一空 → (${subIndex + 2}/${subAnswers.length})`}
        </button>
      )}
    </div>
  )
}

// ─── 普通多子题翻页组件（所有星球里 fill_blank 多子题通用）─
function PlainMultiSubQuestion({ question, onDone }) {
  const { instruction, stems } = useMemo(() => parseSubQStems(question.question), [question.question])
  const expectedMap = useMemo(() => parseExpectedAnswers(question.answer), [question.answer])
  const [subIndex, setSubIndex] = useState(0)
  const [input, setInput] = useState('')
  const [phase, setPhase] = useState('input') // 'input' | 'feedback'
  const [results, setResults] = useState([])
  const resultsRef = useRef([])

  const current = stems[subIndex]
  const expected = expectedMap[current?.num] || ''
  // 超过5个汉字的答案用 textarea，否则用 input
  const isLong = expected.replace(/[^\u4e00-\u9fff]/g, '').length > 5

  function handleSubmit() {
    if (!input.trim()) return
    const correct = smartCheck(input, expected)
    const newResults = [...resultsRef.current, { correct }]
    resultsRef.current = newResults
    setResults(newResults)
    setPhase('feedback')
  }

  function handleNext() {
    const nextIdx = subIndex + 1
    if (nextIdx >= stems.length) {
      const allCorrect = resultsRef.current.every(r => r.correct)
      onDone(allCorrect ? question.answer : '答错', allCorrect)
    } else {
      setSubIndex(nextIdx)
      setInput('')
      setPhase('input')
    }
  }

  if (!current) return null
  const thisResult = results[subIndex]

  return (
    <div className="flex flex-col gap-4">
      {/* 题目指令（空格前内容） */}
      {instruction && (
        <div className="bg-white rounded-2xl px-4 py-3 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{instruction}</p>
        </div>
      )}

      {/* 进度点 */}
      {stems.length > 1 && (
        <div className="flex gap-1.5 justify-center">
          {stems.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all ${
              i < subIndex ? 'w-5 bg-indigo-400' :
              i === subIndex ? 'w-5 bg-indigo-600' :
              'w-2 bg-gray-200'
            }`} />
          ))}
        </div>
      )}

      {/* 当前子题题干 */}
      <div className={`rounded-2xl px-4 py-4 border-2 shadow-sm ${
        phase === 'feedback'
          ? thisResult?.correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          : 'bg-white border-gray-100'
      }`}>
        <p className="text-xs text-indigo-500 font-semibold mb-2">
          第 {subIndex + 1} 题（共 {stems.length} 题）
        </p>
        <p className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap">{current.text}</p>
        {/* 反馈内联显示 */}
        {phase === 'feedback' && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className={`text-sm font-bold mb-1 ${thisResult?.correct ? 'text-green-600' : 'text-red-500'}`}>
              {thisResult?.correct ? '✓ 正确！' : '✗ 答错了'}
            </p>
            <p className="text-sm text-gray-600">你的答案：<span className="font-medium">{input}</span></p>
            {!thisResult?.correct && (
              <p className="text-sm text-gray-800 mt-1 font-semibold whitespace-pre-wrap">
                正确答案：{expected}
              </p>
            )}
          </div>
        )}
      </div>

      {/* 输入区 */}
      {phase === 'input' && (
        isLong ? (
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-base text-gray-800 focus:outline-none focus:border-indigo-400 resize-none"
            rows={3}
            placeholder="在这里写下答案…"
            style={{ fontSize: '16px' }}
          />
        ) : (
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-base text-gray-800 focus:outline-none focus:border-indigo-400"
            placeholder="在这里写下答案…"
            style={{ fontSize: '16px' }}
          />
        )
      )}

      {/* 按钮 */}
      {phase === 'input' && (
        <button onClick={handleSubmit} disabled={!input.trim()}
          className="w-full bg-indigo-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-2xl text-base">
          确认
        </button>
      )}
      {phase === 'feedback' && (
        <button onClick={handleNext}
          className={`w-full font-bold py-4 rounded-2xl text-base text-white ${
            thisResult?.correct ? 'bg-green-500' : 'bg-red-500'
          }`}>
          {subIndex + 1 >= stems.length
            ? '完成 ✓'
            : `下一题 → (${subIndex + 2}/${stems.length})`}
        </button>
      )}
    </div>
  )
}

// ─── 多义字题（从题目文本里解析①②③④选项）────────────────

function MultiMeaningQuestion({ question, onDone }) {
  const [selected, setSelected] = useState(null)
  const options = [...question.question.matchAll(/([①②③④⑤⑥⑦⑧⑨])\s*([^①②③④⑤⑥⑦⑧⑨\n]+)/g)]
    .map(m => ({ symbol: m[1], text: m[2].trim() }))
  const stem = question.question.split('\n')
    .filter(l => !/^[①②③④⑤⑥]/.test(l.trim())).join('\n').trim()

  function handleSelect(symbol) {
    if (selected) return
    setSelected(symbol)
    const correct = question.answer.includes(symbol)
    onDone(symbol, correct)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-white rounded-3xl px-5 py-5 shadow-sm border border-gray-100">
        <p className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap font-medium">{stem}</p>
      </div>
      {options.map(opt => {
        let cls = 'bg-white border-2 border-gray-200 text-gray-800'
        if (selected) {
          if (question.answer.includes(opt.symbol)) cls = 'bg-green-100 border-2 border-green-500 text-green-800'
          else if (opt.symbol === selected) cls = 'bg-red-100 border-2 border-red-400 text-red-700'
          else cls = 'bg-white border-2 border-gray-100 text-gray-300'
        }
        return (
          <button key={opt.symbol} onClick={() => handleSelect(opt.symbol)} disabled={!!selected}
            className={`${cls} rounded-2xl px-5 py-4 text-left text-base font-medium transition-all active:scale-[0.98] shadow-sm`}>
            <span className="font-bold mr-2">{opt.symbol}</span>{opt.text}
          </button>
        )
      })}
    </div>
  )
}

// ─── 连线题（左右各一列，点左再点右配对）──────────────────

function MatchingQuestion({ question, onDone }) {
  const pairs = question.pairs || []
  const [shuffledRight] = useState(() =>
    [...pairs.map((p, i) => ({ text: p.right, idx: i }))].sort(() => Math.random() - 0.5)
  )
  const [leftSel, setLeftSel] = useState(null)
  const [matched, setMatched] = useState({})  // {leftIdx: rightShuffledIdx}
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const allMatched = Object.keys(matched).length === pairs.length

  function handleLeft(i) {
    if (submitted || matched[i] !== undefined) return
    setLeftSel(prev => prev === i ? null : i)
  }

  function handleRight(item, ri) {
    if (submitted || leftSel === null) return
    if (Object.values(matched).includes(ri)) return
    const correct = item.idx === leftSel
    setMatched(p => ({ ...p, [leftSel]: ri }))
    if (!correct) setErrors(p => ({ ...p, [leftSel]: true }))
    setLeftSel(null)
  }

  function handleSubmit() {
    const correct = pairs.every((_, i) => !errors[i])
    setSubmitted(true)
    onDone(correct ? question.answer : '答错', correct)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-3xl px-5 py-4 shadow-sm border border-gray-100">
        <p className="text-base text-gray-800 font-medium">{question.question}</p>
      </div>
      <div className="flex gap-2">
        <div className="flex-1 flex flex-col gap-2">
          {pairs.map((p, i) => {
            const isMatched = matched[i] !== undefined
            return (
              <button key={i} onClick={() => handleLeft(i)} disabled={isMatched || submitted}
                className={`py-3 px-3 rounded-2xl border-2 text-sm font-semibold text-center transition-all ${
                  errors[i] ? 'bg-red-100 border-red-400 text-red-700' :
                  isMatched ? 'bg-green-100 border-green-400 text-green-700' :
                  leftSel === i ? 'bg-indigo-100 border-indigo-500 text-indigo-700' :
                  'bg-white border-gray-200 text-gray-800'
                }`}>{p.left}</button>
            )
          })}
        </div>
        <div className="flex flex-col gap-2 justify-around py-1">
          {pairs.map((_, i) => <span key={i} className="text-gray-300 text-base">→</span>)}
        </div>
        <div className="flex-1 flex flex-col gap-2">
          {shuffledRight.map((item, ri) => {
            const matchedLeftIdx = parseInt(Object.entries(matched).find(([, r]) => r === ri)?.[0] ?? '-1')
            const isMatched = matchedLeftIdx >= 0
            const isError = isMatched && errors[matchedLeftIdx]
            return (
              <button key={ri} onClick={() => handleRight(item, ri)}
                disabled={isMatched || submitted || leftSel === null}
                className={`py-3 px-3 rounded-2xl border-2 text-sm font-semibold text-center transition-all ${
                  isError ? 'bg-red-100 border-red-400 text-red-700' :
                  isMatched ? 'bg-green-100 border-green-400 text-green-700' :
                  leftSel !== null ? 'bg-yellow-50 border-yellow-300 text-gray-800 active:scale-95' :
                  'bg-white border-gray-200 text-gray-400'
                }`}>{item.text}</button>
            )
          })}
        </div>
      </div>
      {leftSel !== null && <p className="text-xs text-indigo-500 text-center">请点击右侧对应项完成配对</p>}
      {!submitted && allMatched && (
        <button onClick={handleSubmit} className="w-full bg-indigo-500 text-white font-bold py-4 rounded-2xl text-base">提交</button>
      )}
    </div>
  )
}

// ─── 主组件 ──────────────────────────────────────────────

export default function DuolingoStyleQuiz({ question, onAnswerSubmit, showVariantButton, onSpeak }) {
  const [phase, setPhase] = useState('answering') // 'answering'|'correct'|'wrong'
  const [chosenAnswer, setChosenAnswer] = useState(null)
  const [variantQ, setVariantQ] = useState(null)
  const [variantPhase, setVariantPhase] = useState('idle') // 'idle'|'loading'|'answering'|'done'
  const [variantSel, setVariantSel] = useState(null)

  function handleDone(answer, correct) {
    setChosenAnswer(answer)
    setPhase(correct ? 'correct' : 'wrong')
  }

  function handleContinue() {
    onAnswerSubmit(chosenAnswer, phase === 'correct')
    setPhase('answering')
    setChosenAnswer(null)
    setVariantQ(null)
    setVariantPhase('idle')
    setVariantSel(null)
  }

  async function handleVariant() {
    setVariantPhase('loading')
    try {
      const v = await generateVariant(question)
      setVariantQ(v)
      setVariantPhase('answering')
    } catch {
      setVariantPhase('idle')
    }
  }

  const isFill = question.type === 'fill_blank'
  const answered = phase !== 'answering'

  const fillType = isFill
    ? isJudgmentQ(question) ? 'judgment'
    : isTypoQ(question) ? 'typo'
    : isOrderQ(question) ? 'order'
    : isWordBankQ(question) ? 'wordbank'
    : isMatchingStyleQ(question) ? 'matching_fill'
    : isMultiSubQ(question) ? 'multi_sub'
    : 'plain'
    : null

  // 动态连线题：从题目文本中解析 pairs
  const matchingFillPairs = fillType === 'matching_fill'
    ? extractMatchingPairs(question) : null

  // 以下题型内部有提交逻辑，答完后只展示底部继续条（含解析）
  const hasInternalSubmit = fillType === 'judgment' || fillType === 'typo' || fillType === 'order'
    || fillType === 'wordbank' || fillType === 'matching_fill' || fillType === 'multi_sub'
    || question.type === 'matching' || question.type === 'multi_meaning'

  return (
    <div className="flex flex-col gap-4 pb-44">
      {/* 标签 */}
      <div className="flex gap-2 flex-wrap">
        <span className="bg-indigo-100 text-indigo-700 text-xs px-3 py-1 rounded-full font-semibold">{question.knowledge_tag}</span>
        <span className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">{question.ability_tag}</span>
        <span className="text-gray-300 text-xs px-2 py-1">{'⭐'.repeat(question.difficulty || 1)}</span>
      </div>

      {/* 题干（选择题单独显示，填空题由子组件内部显示） */}
      {question.type === 'single_choice' && (
        <div className="bg-white rounded-3xl px-5 py-5 shadow-sm border border-gray-100">
          <p className="text-lg text-gray-800 leading-relaxed font-medium">{question.question}</p>
        </div>
      )}

      {/* multiple_choice 题干（英语题使用） */}
      {question.type === 'multiple_choice' && (
        <div className="bg-white rounded-3xl px-5 py-5 shadow-sm border border-gray-100">
          <div className="flex items-start gap-2">
            <p className="text-lg text-gray-800 leading-relaxed font-medium flex-1 whitespace-pre-wrap">{question.question}</p>
            {onSpeak && (
              <button
                onClick={() => onSpeak(question.question)}
                className="inline-flex items-center justify-center w-8 h-8 bg-sky-100 text-sky-500 rounded-full text-lg ml-2 flex-shrink-0 active:bg-sky-200 transition-colors"
                title="朗读题目"
              >🔊</button>
            )}
          </div>
        </div>
      )}

      {/* 答题区 */}
      {(question.type === 'single_choice' || question.type === 'multiple_choice') && <ChoiceQuestion question={question} onDone={handleDone} />}
      {question.type === 'multi_meaning'  && <MultiMeaningQuestion   question={question} onDone={handleDone} />}
      {question.type === 'matching'       && <MatchingQuestion       question={question} onDone={handleDone} />}
      {isFill && fillType === 'judgment'  && <JudgmentQuestion       question={question} onDone={handleDone} />}
      {isFill && fillType === 'typo'      && <TypoQuestion           question={question} onDone={handleDone} />}
      {isFill && fillType === 'order'     && <OrderQuestion          question={question} onDone={handleDone} />}
      {isFill && fillType === 'wordbank'  && <WordBankQuestion       question={question} onDone={handleDone} />}
      {isFill && fillType === 'matching_fill' && <MatchingQuestion      question={{ ...question, pairs: matchingFillPairs }} onDone={handleDone} />}
      {isFill && fillType === 'multi_sub'  && <PlainMultiSubQuestion  question={question} onDone={handleDone} />}
      {isFill && fillType === 'plain'      && <FillQuestion           question={question} onDone={handleDone} />}

      {/* 底部反馈面板：选择题 & 普通填空 */}
      {answered && !hasInternalSubmit && (
        <FeedbackPanel
          correct={phase === 'correct'}
          analysis={question.analysis}
          answer={phase === 'wrong' ? question.answer : null}
          onContinue={handleContinue}
          variantState={{
            showButton: showVariantButton,
            phase: variantPhase,
            question: variantQ,
            selected: variantSel,
            onSelect: (opt) => { setVariantSel(opt); setVariantPhase('done') },
            onGenerate: handleVariant,
          }}
        />
      )}

      {/* 底部继续条：内部自带提交的题型，答完后展示总结+完整答案+解析 */}
      {answered && hasInternalSubmit && (
        <div className={`fixed bottom-0 left-0 right-0 z-30 rounded-t-3xl shadow-2xl max-h-[75vh] flex flex-col ${
          phase === 'correct' ? 'bg-green-50 border-t-4 border-green-400' : 'bg-red-50 border-t-4 border-red-400'
        }`}>
          <div className="flex-1 overflow-y-auto px-5 pt-5 pb-2">
            <div className="max-w-md mx-auto">
              <p className={`font-bold text-xl mb-3 ${phase === 'correct' ? 'text-green-600' : 'text-red-500'}`}>
                {phase === 'correct' ? '✓ 全对！' : '✗ 有错误'}
              </p>
              {phase === 'wrong' && question.answer && (
                <div className="mb-3 bg-white rounded-2xl px-4 py-3 border border-gray-200">
                  <p className="text-xs text-gray-400 mb-1 font-medium">完整正确答案</p>
                  <p className="text-sm text-gray-800 font-semibold whitespace-pre-wrap leading-relaxed">{question.answer}</p>
                </div>
              )}
              {question.analysis && (
                <div className="bg-white/60 rounded-2xl px-4 py-3 border border-gray-100">
                  <p className="text-xs text-gray-400 mb-1 font-medium">解析</p>
                  <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{question.analysis}</p>
                </div>
              )}
            </div>
          </div>
          <div className="px-5 pt-3 pb-8">
            <div className="max-w-md mx-auto">
              <button onClick={handleContinue}
                className={`w-full py-3 rounded-2xl font-bold text-white text-base active:scale-95 transition-all ${
                  phase === 'correct' ? 'bg-green-500' : 'bg-red-500'
                }`}>
                继续
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
