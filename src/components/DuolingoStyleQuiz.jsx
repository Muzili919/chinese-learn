import { useState } from 'react'
import { generateVariant } from '../utils/ai'

// ─── 工具函数 ─────────────────────────────────────────────

function normalize(s) {
  return (s || '').trim()
    .replace(/（[0-9]）/g, ' ')
    .replace(/[，。！？、；：""''《》（）\s]/g, '')
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
  return [...text.matchAll(/（([1-9])）\s*([^（\n]+?)\s*（　）/g)]
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

function parseOrderOptions(text) {
  return [...text.matchAll(/([①②③④⑤⑥⑦⑧⑨])\s*([^\s①②③④⑤⑥⑦⑧⑨→\n　]+)/g)]
    .map(m => ({ symbol: m[1], text: m[2].trim() }))
}

function parseOrderAnswer(answer) {
  return [...answer.matchAll(/([①②③④⑤⑥⑦⑧⑨])/g)].map(m => m[1])
}

// ─── 底部反馈面板 ─────────────────────────────────────────

function FeedbackPanel({ correct, analysis, answer, onContinue, variantBtn }) {
  return (
    <div className={`fixed bottom-0 left-0 right-0 z-30 rounded-t-3xl shadow-2xl px-5 pt-5 pb-8 ${
      correct ? 'bg-green-50 border-t-4 border-green-400' : 'bg-red-50 border-t-4 border-red-400'
    }`}>
      <div className="max-w-md mx-auto">
        <p className={`text-xl font-bold mb-1 ${correct ? 'text-green-600' : 'text-red-500'}`}>
          {correct ? '✓ 正确！' : '✗ 答错了'}
        </p>
        {!correct && answer && (
          <div className="mb-2">
            <span className="text-xs text-gray-500">正确答案：</span>
            <span className="text-sm font-semibold text-gray-800 ml-1">{answer}</span>
          </div>
        )}
        {analysis && (
          <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-3">{analysis}</p>
        )}
        <div className="flex gap-3">
          {variantBtn}
          <button onClick={onContinue}
            className={`flex-1 py-3 rounded-2xl font-bold text-white text-base active:scale-95 transition-all ${
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

// ─── 判断题 ──────────────────────────────────────────────

function JudgmentQuestion({ question, onDone }) {
  const correctAnswers = parseJudgmentAnswers(question.answer)
  const statements = parseJudgmentStatements(question.question)
  const [picks, setPicks] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const allPicked = statements.every((_, i) => picks[i] !== undefined)

  function handleSubmit() {
    const correct = correctAnswers.every((ans, i) => picks[i] === ans)
    setSubmitted(true)
    onDone(correct ? question.answer : '答错', correct)
  }

  return (
    <div className="flex flex-col gap-3">
      {statements.map((stmt, i) => {
        const picked = picks[i]
        return (
          <div key={i} className={`rounded-2xl p-4 border-2 ${
            submitted
              ? picks[i] === correctAnswers[i] ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
              : 'bg-white border-gray-200'
          }`}>
            <p className="text-sm text-gray-800 leading-relaxed mb-3">
              <span className="font-bold text-indigo-500">（{i + 1}）</span>{stmt}
            </p>
            <div className="flex gap-2">
              {['√', '×'].map(val => {
                let cls = 'border-gray-200 text-gray-400 bg-white'
                if (!submitted && picked === val) cls = 'border-indigo-400 bg-indigo-50 text-indigo-700'
                if (submitted && val === correctAnswers[i]) cls = 'border-green-400 bg-green-100 text-green-700'
                if (submitted && picked === val && val !== correctAnswers[i]) cls = 'border-red-400 bg-red-100 text-red-700'
                return (
                  <button key={val} onClick={() => !submitted && setPicks(p => ({ ...p, [i]: val }))}
                    disabled={submitted}
                    className={`flex-1 py-2.5 rounded-xl border-2 font-bold text-xl transition-all ${cls}`}>
                    {val}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
      {!submitted && (
        <button onClick={handleSubmit} disabled={!allPicked}
          className="w-full bg-indigo-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-2xl text-base mt-1">
          提交
        </button>
      )}
    </div>
  )
}

// ─── 错别字题 ─────────────────────────────────────────────

function TypoQuestion({ question, onDone }) {
  const items = parseTypoItems(question.question)
  const corrections = parseTypoCorrections(question.answer)
  const [inputs, setInputs] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const allFilled = items.every(item =>
    corrections[item.num] === '__ok__' || (inputs[item.num] || '').trim() !== ''
  )

  function handleSubmit() {
    let correct = true
    for (const item of items) {
      const expected = corrections[item.num]
      if (expected === '__ok__') continue
      if ((inputs[item.num] || '').trim() !== expected) { correct = false; break }
    }
    setSubmitted(true)
    onDone(correct ? question.answer : '答错', correct)
  }

  const instruction = question.question.split('\n')[0] || ''

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-gray-500 bg-white rounded-2xl px-4 py-3 border border-gray-100">{instruction}</p>
      {items.map(item => {
        const expected = corrections[item.num]
        const isOk = expected === '__ok__'
        const val = (inputs[item.num] || '').trim()
        const itemCorrect = isOk || val === expected
        return (
          <div key={item.num} className={`rounded-2xl px-4 py-3 border-2 flex items-center gap-3 ${
            !submitted ? 'bg-white border-gray-200' :
            itemCorrect ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
          }`}>
            <span className="text-indigo-500 font-bold shrink-0">（{item.num}）</span>
            <span className="text-gray-800 flex-1">{item.word}</span>
            {isOk ? (
              <span className={`text-sm font-semibold px-3 py-1 rounded-xl ${submitted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>无错</span>
            ) : (
              <div className="flex flex-col items-end">
                <input type="text" value={inputs[item.num] || ''}
                  onChange={e => setInputs(p => ({ ...p, [item.num]: e.target.value }))}
                  disabled={submitted} placeholder="改正" maxLength={6}
                  className="w-20 border-2 border-gray-300 rounded-xl px-2 py-1.5 text-center text-base focus:outline-none focus:border-indigo-400 disabled:bg-transparent"
                />
                {submitted && !itemCorrect && (
                  <span className="text-xs text-green-600 mt-1">→ {expected}</span>
                )}
              </div>
            )}
          </div>
        )
      })}
      {!submitted && (
        <button onClick={handleSubmit} disabled={!allFilled}
          className="w-full bg-indigo-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-2xl text-base mt-1">
          提交
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

export default function DuolingoStyleQuiz({ question, onAnswerSubmit, showVariantButton }) {
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
    : 'plain'
    : null

  // 判断/错别字/排序题内部已有提交逻辑，答完后只需底部继续条
  const hasInternalSubmit = fillType === 'judgment' || fillType === 'typo' || fillType === 'order'
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

      {/* 答题区 */}
      {question.type === 'single_choice'  && <ChoiceQuestion        question={question} onDone={handleDone} />}
      {question.type === 'multi_meaning'  && <MultiMeaningQuestion   question={question} onDone={handleDone} />}
      {question.type === 'matching'       && <MatchingQuestion       question={question} onDone={handleDone} />}
      {isFill && fillType === 'judgment'  && <JudgmentQuestion       question={question} onDone={handleDone} />}
      {isFill && fillType === 'typo'      && <TypoQuestion           question={question} onDone={handleDone} />}
      {isFill && fillType === 'order'     && <OrderQuestion          question={question} onDone={handleDone} />}
      {isFill && fillType === 'plain'     && <FillQuestion           question={question} onDone={handleDone} />}

      {/* 变种题区域（错题模式+答错后） */}
      {answered && showVariantButton && variantPhase === 'answering' && variantQ && (
        <div className="bg-violet-50 border-2 border-violet-200 rounded-3xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-violet-600 text-sm font-bold">🔀 举一反三</span>
            <span className="bg-violet-100 text-violet-600 text-xs px-2 py-0.5 rounded-full">AI 出题</span>
          </div>
          <p className="text-base text-gray-800 font-medium mb-3 leading-relaxed">{variantQ.question}</p>
          <div className="flex flex-col gap-2">
            {variantQ.options.map(opt => {
              let cls = 'bg-white border-2 border-gray-200 text-gray-700'
              if (variantSel) {
                if (opt === variantQ.answer) cls = 'bg-green-100 border-green-400 text-green-800'
                else if (opt === variantSel) cls = 'bg-red-100 border-red-400 text-red-700'
                else cls = 'bg-white border-gray-100 text-gray-300'
              }
              return (
                <button key={opt}
                  onClick={() => { if (!variantSel) { setVariantSel(opt); setVariantPhase('done') } }}
                  disabled={!!variantSel}
                  className={`${cls} rounded-2xl px-4 py-3 text-left text-sm font-medium transition-all`}>
                  {opt}
                </button>
              )
            })}
          </div>
          {variantSel && (
            <p className={`text-xs mt-3 font-semibold ${variantSel === variantQ.answer ? 'text-green-600' : 'text-red-500'}`}>
              {variantSel === variantQ.answer ? '✓ 变种题答对了！🎉' : `✗ 正确答案：${variantQ.answer}`}
            </p>
          )}
        </div>
      )}

      {/* 底部反馈面板：选择题 & 普通填空 */}
      {answered && !hasInternalSubmit && (
        <FeedbackPanel
          correct={phase === 'correct'}
          analysis={question.analysis}
          answer={phase === 'wrong' ? question.answer : null}
          onContinue={handleContinue}
          variantBtn={
            showVariantButton && phase === 'wrong' && variantPhase === 'idle' ? (
              <button onClick={handleVariant}
                className="flex-1 py-3 rounded-2xl font-bold text-violet-600 bg-white border-2 border-violet-300 text-sm active:scale-95">
                🔀 举一反三
              </button>
            ) : showVariantButton && variantPhase === 'loading' ? (
              <button disabled className="flex-1 py-3 rounded-2xl text-gray-400 bg-gray-100 text-sm">生成中…</button>
            ) : null
          }
        />
      )}

      {/* 底部继续条：判断/错别字/排序（内部自带提交，答完后只需继续） */}
      {answered && hasInternalSubmit && (
        <div className={`fixed bottom-0 left-0 right-0 z-30 rounded-t-3xl shadow-2xl px-5 pt-5 pb-8 ${
          phase === 'correct' ? 'bg-green-50 border-t-4 border-green-400' : 'bg-red-50 border-t-4 border-red-400'
        }`}>
          <div className="max-w-md mx-auto">
            <p className={`font-bold text-xl mb-1 ${phase === 'correct' ? 'text-green-600' : 'text-red-500'}`}>
              {phase === 'correct' ? '✓ 全对！' : '✗ 有错误'}
            </p>
            {question.analysis && (
              <p className="text-xs text-gray-500 mb-4 leading-relaxed line-clamp-2">{question.analysis}</p>
            )}
            <button onClick={handleContinue}
              className={`w-full py-3 rounded-2xl font-bold text-white text-base active:scale-95 transition-all ${
                phase === 'correct' ? 'bg-green-500' : 'bg-red-500'
              }`}>
              继续
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
