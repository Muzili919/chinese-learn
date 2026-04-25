import { useState, useRef, useEffect, useMemo } from 'react'
import { evaluateClassicalTranslation } from '../utils/ai'
import { generateVariantsStream } from '../utils/ai_v2'
import { checkAiUsage, getAiUsage } from '../hooks/usePlan'
import { storage } from '../utils/storage'
import SocraticDialogue from './SocraticDialogue'
import {
  normalize, normalizeAnswer, isAnswerCorrect,
  isWordBankQ, isMatchingStyleQ, isJudgmentQ, isTypoQ, isOrderQ,
  isMultiSubQ, isSelfEvalFillQ,
  extractMatchingPairs, parseJudgmentAnswers, parseJudgmentStatements,
  parseTypoItems, parseTypoCorrections, parseWordBankSubAnswers,
  extractBlankLine, segmentToChips, parseOrderOptions, parseOrderAnswer,
  extractCharBankFromText, removeCharBankMarkers, parseSubQStems,
  parseExpectedAnswers, smartCheck,
} from '../utils/quizUtils'

// ─── 富文本渲染：把 <u>xxx</u> 转为 React 下划线元素 ──
function renderRichText(text) {
  if (!text || !text.includes('<u>')) return text
  const parts = text.split(/(<u>.*?<\/u>)/g)
  return parts.map((part, i) => {
    if (part.startsWith('<u>') && part.endsWith('</u>')) {
      return <u key={i} className="underline decoration-2 decoration-red-500 underline-offset-4 font-bold">{part.slice(3, -4)}</u>
    }
    return part
  })
}

// ─── 底部反馈面板 ─────────────────────────────────────────

function FeedbackPanel({ correct, analysis, answer, onContinue, variantState, onSocratic, wrongChoice, questionOpts }) {
  // variantState = { phase, question, selected, onSelect, onGenerate, showButton, remaining }
  const vs = variantState || {}
  const [aiExplaining, setAiExplaining] = useState(false)
  const [aiExplanation, setAiExplanation] = useState(null)

  // AI 错因解析：解释为什么选错了
  async function explainWrongChoice() {
    if (aiExplanation || aiExplaining) return
    setAiExplaining(true)
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: '你是一位耐心的小学老师。用一句话解释为什么学生选的答案错了，再一句话说正确答案为什么对。语气亲切，50字以内。只返回解释文字，不要JSON。' },
            { role: 'user', content: `题目：${analysis ? '' : answer}\n学生选了：${wrongChoice || '错误答案'}\n正确答案：${answer}\n${analysis ? '参考解析：' + analysis : ''}` },
          ],
          temperature: 0.5,
          max_tokens: 100,
        }),
      })
      const data = await res.json()
      setAiExplanation(data.choices?.[0]?.message?.content || '解析暂不可用')
    } catch {
      setAiExplanation('网络异常，请稍后再试')
    } finally {
      setAiExplaining(false)
    }
  }

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-30 rounded-t-3xl shadow-2xl max-h-[80vh] flex flex-col ${
      correct ? 'bg-green-50 border-t-4 border-green-400' : 'bg-red-50 border-t-4 border-red-400'
    }`}>
      <div className="flex-1 overflow-y-auto px-5 pt-5 pb-2">
        <div className="max-w-md mx-auto">
          <p className={`text-xl font-bold mb-3 ${correct ? 'text-green-600' : 'text-red-500'}`}>
            {correct ? '✓ 正确！' : '✗ 答错了'}
          </p>
          {!correct && wrongChoice && (
            <div className="mb-2 bg-red-100/60 rounded-2xl px-4 py-2.5 border border-red-200">
              <p className="text-xs text-red-400 mb-0.5 font-medium">你的答案</p>
              <p className="text-sm font-semibold text-red-600 line-through">{wrongChoice}</p>
            </div>
          )}
          {!correct && answer && (
            <div className="mb-3 bg-white rounded-2xl px-4 py-3 border border-gray-200">
              <p className="text-xs text-gray-400 mb-1 font-medium">正确答案</p>
              <p className="text-sm font-semibold text-gray-800 whitespace-pre-wrap leading-relaxed">{answer}</p>
            </div>
          )}
          {/* AI 错因解析 */}
          {!correct && !aiExplanation && !aiExplaining && (
            <button onClick={explainWrongChoice}
              className="w-full mb-3 py-2.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-amber-400 to-orange-500 text-white active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow">
              <span>🤔</span><span>为什么错了？</span>
            </button>
          )}
          {aiExplaining && (
            <div className="mb-3 bg-amber-50 rounded-2xl px-4 py-3 border border-amber-200">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-amber-300 border-t-amber-500 rounded-full animate-spin" />
                <span className="text-xs text-amber-600 font-medium">AI 正在分析错因…</span>
              </div>
            </div>
          )}
          {aiExplanation && (
            <div className="mb-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl px-4 py-3 border border-amber-200">
              <p className="text-xs text-amber-400 mb-1 font-medium">🤖 AI 解析</p>
              <p className="text-xs text-gray-700 leading-relaxed">{aiExplanation}</p>
            </div>
          )}
          {analysis && (
            <div className="mb-3 bg-white/60 rounded-2xl px-4 py-3 border border-gray-100">
              <p className="text-xs text-gray-400 mb-1 font-medium">解析</p>
              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{analysis}</p>
            </div>
          )}

          {/* 举一反三区域 - 答错时显示（用户看完解析后手动触发） */}
          {/* Socratic deep understanding button */}
          {!correct && onSocratic && (
            <button onClick={onSocratic}
              className="w-full mb-3 py-3 rounded-2xl font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg">
              <span className="text-base">🧠</span>
              <span>深度理解（AI引导）</span>
            </button>
          )}

          {vs.showButton && !correct && vs.phase === 'idle' && (
            <button onClick={vs.onGenerate}
              className="w-full mb-3 py-3.5 rounded-2xl font-bold text-white bg-gradient-to-r from-violet-500 to-purple-600 text-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg">
              <span className="text-base">🔀</span>
              <span>举一反三（AI出同类题）</span>
              {vs.remaining !== null && vs.remaining !== 9999 && (
                <span className="text-xs font-normal text-violet-200">今日剩余 {vs.remaining} 次</span>
              )}
            </button>
          )}
          {vs.showButton && vs.phase === 'loading' && (
            <div className="w-full mb-3 rounded-2xl bg-violet-50 border-2 border-violet-100 px-4 py-3">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-3 h-3 border-2 border-violet-300 border-t-violet-500 rounded-full animate-spin flex-shrink-0" />
                <span className="text-xs text-violet-500 font-medium">AI 正在出同类题…</span>
              </div>
              {vs.streamText ? (
                <p className="text-sm text-violet-700 font-medium leading-snug">
                  {vs.streamText}<span className="inline-block w-0.5 h-4 bg-violet-400 ml-0.5 animate-pulse align-middle" />
                </p>
              ) : (
                <div className="flex gap-1">
                  {[0,1,2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 bg-violet-300 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              )}
            </div>
          )}
          {/* 次数用完：升级提示 */}
          {vs.showButton && !correct && vs.phase === 'blocked' && (
            <div className="w-full mb-3 rounded-2xl bg-amber-50 border-2 border-amber-200 px-4 py-3">
              <p className="text-sm font-bold text-amber-700 mb-1">今日 AI 出题次数已用完 😮‍💨</p>
              <p className="text-xs text-amber-600">升级 Premium 可每日无限使用举一反三</p>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('cl_show_premium'))}
                className="mt-2 text-xs font-bold text-violet-600 underline">
                查看 Premium 权益 →
              </button>
            </div>
          )}
          {vs.showButton && (vs.phase === 'answering' || vs.phase === 'done') && vs.question && (
            <div className="mb-3 bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-200 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-violet-600 text-sm font-bold">🔀 举一反三</span>
                  <span className="bg-violet-100 text-violet-600 text-xs px-2 py-0.5 rounded-full">AI 出题</span>
                  {vs.question.isListeningVariant && (
                    <span className="bg-amber-100 text-amber-600 text-xs px-2 py-0.5 rounded-full">听力题</span>
                  )}
                </div>
                {/* 变式题完成后：显示"再出一题"按钮 */}
                {vs.phase === 'done' && vs.onRegenerate && (
                  <button onClick={vs.onRegenerate}
                    className="text-xs font-bold text-violet-500 underline flex-shrink-0 active:text-violet-700">
                    🔄 再出一题
                  </button>
                )}
              </div>
              {/* ★ 听力变体题：隐藏文字题目，用TTS播放 + 选项作答 */}
              {vs.question.isListeningVariant ? (
                <>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 flex items-center gap-3">
                    <span className="text-lg">🎧</span>
                    <p className="text-sm text-amber-700 font-medium flex-1">请听音频后选择正确答案（听力题不显示文字）</p>
                  </div>
                  {/* TTS 播放按钮 - 通过 onSpeak 回调播放变体题的 listening_text */}
                  {vs.onSpeakVariant && (
                    <button onClick={vs.onSpeakVariant}
                      className="w-full mb-3 py-2.5 rounded-xl bg-violet-500 text-white font-bold text-sm active:bg-violet-600 transition-all flex items-center justify-center gap-2">
                      🔊 播放听力原文
                    </button>
                  )}
                </>
              ) : (
                <p className="text-base text-gray-800 font-medium mb-3 leading-relaxed">{vs.question.question}</p>
              )}
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

  // ★ 自动剥离内联选项：question 文本里包含 A. xxx B. xxx... 时，只保留题干，选项用 options 数组
  const resolved = useMemo(() => {
    const rawOpts = question.options || []
    const isBareLetter = rawOpts.length >= 2 && rawOpts.every(o => /^[A-Da-d]{1,2}$/.test(String(o).trim()))

    // 检测 question 文本中是否有内联选项块（A. xxx B. xxx 格式）
    const lineOptRe = /^([A-D])[.、．]\s*(.+)$/gm
    const extracted = []
    let m
    while ((m = lineOptRe.exec(question.question)) !== null) {
      extracted.push({ letter: m[1], text: m[2].trim(), index: m.index })
    }
    const hasInlineOpts = extracted.length >= 2

    if (!hasInlineOpts && !isBareLetter) return { options: rawOpts, displayQuestion: question.question }

    if (isBareLetter && hasInlineOpts) {
      // 裸字母选项 → 用内联文本替换
      const fullOpts = extracted.map(e => `${e.letter}. ${e.text}`)
      const displayQ = question.question.slice(0, extracted[0].index).trimEnd()
      return { options: fullOpts, displayQuestion: displayQ }
    }

    if (hasInlineOpts && !isBareLetter) {
      // options 已有完整文本，只需从题干中剥离内联选项
      const displayQ = question.question.slice(0, extracted[0].index).trimEnd()
      return { options: rawOpts, displayQuestion: displayQ }
    }

    return { options: rawOpts, displayQuestion: question.question }
  }, [question.options, question.question])

  // 找出正确选项的全文（兼容 answer="B" 或 answer="B. bag" 或选项全文）
  function getCorrectOption() {
    const opts = resolved.options
    for (const opt of opts) {
      if (isAnswerCorrect(opt, question.answer, opts)) return opt
    }
    return question.answer
  }

  function handleSelect(opt) {
    if (selected) return
    setSelected(opt)
    const correct = isAnswerCorrect(opt, question.answer, resolved.options)
    console.log('[答案判定]', {
      questionId: question.id,
      questionType: question.type,
      userAnswer: opt,
      correctAnswer: question.answer,
      isCorrect: correct
    })
    onDone(opt, correct)
  }

  const correctOpt = getCorrectOption()

  // 防护：选项为空时显示提示
  if (!resolved.options || resolved.options.length === 0) {
    return (
      <div className="bg-red-50 border-2 border-dashed border-red-300 rounded-2xl px-5 py-6 text-center">
        <p className="text-sm text-red-600 font-medium">⚠️ 此题选项为空</p>
        <p className="text-xs text-gray-400 mt-1">ID: {question.id}</p>
      </div>
    )
  }

  // 解析选项：检测 "A. " / "A、" 前缀，分离字母和正文
  const LETTER_RE = /^([A-Da-d])[.、．\s]\s*/
  const hasLetterPrefix = resolved.options.some(o => LETTER_RE.test(String(o)))
  const maxOptLen = Math.max(...resolved.options.map(o => String(o).length))
  // 4选项且都很短（≤6字）→ 2×2 网格布局
  const use2Col = resolved.options.length === 4 && maxOptLen <= 8 && !hasLetterPrefix
  // 超长选项（>30字）使用更小字号
  const useSmallOptText = maxOptLen > 30

  function parseOpt(opt) {
    const s = String(opt)
    const m = s.match(LETTER_RE)
    if (m) return { letter: m[1].toUpperCase(), text: s.slice(m[0].length) }
    return { letter: null, text: s }
  }

  return (
    <div className={use2Col ? 'grid grid-cols-2 gap-2.5' : 'flex flex-col gap-2.5'}>
      {resolved.options.map(opt => {
        let border = 'border-gray-200'
        let bg = 'bg-white'
        let textColor = 'text-gray-800'
        if (selected) {
          if (isAnswerCorrect(opt, question.answer, resolved.options)) {
            border = 'border-green-500'; bg = 'bg-green-100'; textColor = 'text-green-800'
          } else if (opt === selected) {
            border = 'border-red-400'; bg = 'bg-red-100'; textColor = 'text-red-700'
          } else {
            border = 'border-gray-100'; bg = 'bg-white'; textColor = 'text-gray-300'
          }
        }
        const { letter, text } = parseOpt(opt)
        const isLong = text.length > 20
        return (
          <button key={opt} onClick={() => handleSelect(opt)} disabled={!!selected}
            className={`${bg} border-2 ${border} ${textColor} rounded-2xl text-left leading-snug font-medium transition-all active:scale-[0.98] shadow-sm ${
              use2Col ? 'px-3 py-4 flex flex-col items-center justify-center text-center' :
              letter ? 'px-3 py-3 flex items-start gap-2.5' :
              isLong ? 'px-4 py-3' : 'px-5 py-4'
            }`}>
            {letter && (
              <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                selected && isAnswerCorrect(opt, question.answer, resolved.options) ? 'bg-green-500 text-white' :
                selected && opt === selected ? 'bg-red-400 text-white' :
                'bg-indigo-100 text-indigo-700'
              }`}>{letter}</span>
            )}
            <span className={letter ? 'flex-1' : ''}
              style={{ fontSize: (isLong && !letter) || useSmallOptText ? '0.82rem' : undefined }}>
              {text}
            </span>
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

  if (!current) return <div className="text-center text-gray-400 py-8">⏳ 加载中...</div>
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
  if (!current) return <div className="text-center text-gray-400 py-8">⏳ 加载中...</div>

  const expected = corrections[current.num]
  const isOk = expected === '__ok__'
  const thisResult = results[subIndex]
  const canSubmit = isOk ? input.trim() === '正确' : input.trim() !== ''

  function handleSubmit() {
    const isCorrect = isOk ? (input.trim() === '正确') : (input.trim() === expected)
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
          <div className="text-center text-gray-500 text-sm py-2">
            如认为此项无错别字，请输入"正确"后确认
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

  // 防护：选项为空时显示提示
  if (!options || options.length === 0) {
    return (
      <div className="bg-red-50 border-2 border-dashed border-red-300 rounded-2xl px-5 py-6 text-center">
        <p className="text-sm text-red-600 font-medium">⚠️ 排序选项为空</p>
        <p className="text-xs text-gray-400 mt-1">ID: {question.id}</p>
      </div>
    )
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

// ─── 普通填空（数学数值增强版）───────────────────────────

function isMathQuestion(q) {
  const t = (q.topic || '') + (q.knowledge_tag || '')
  return /math|数与|图形|几何|奥数|公式|单位换算|计算/.test(t)
}

function FillQuestion({ question, onDone }) {
  const [input, setInput] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const isMath = isMathQuestion(question)
  // ★ 使用带归一化的匹配
  const correct = submitted && isAnswerCorrect(input, question.answer, null)

  function handleSubmit() {
    if (!input.trim() || submitted) return
    setSubmitted(true)
    const isCorrect = isAnswerCorrect(input, question.answer, null)
    console.log('[答案判定]', {
      questionId: question.id,
      questionType: question.type,
      userAnswer: input,
      correctAnswer: question.answer,
      normalizedUser: normalizeAnswer(input),
      normalizedCorrect: normalizeAnswer(question.answer),
      isCorrect
    })
    onDone(input, isCorrect)
  }

  // 数学数值答案的增强归一化：处理 π、分数、单位等
  function normalizedForDisplay(ans) {
    let s = String(ans || '').trim()
    // 常见数学符号美化显示
    s = s.replace(/pi/gi, 'π').replace(/cm2|cm²/gi, 'cm²').replace(/cm3|cm³/gi, 'cm³')
    s = s.replace(/m2|m²/gi, 'm²').replace(/m3|m³/gi, 'm³')
    return s
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-white rounded-3xl px-5 py-5 shadow-sm border border-gray-100">
        <p className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap">{renderRichText(question.question)}</p>
        {/* 配图渲染 */}
        {question.image && (
          <div className="mt-4 flex justify-center">
            {question.image.startsWith('<svg') ? (
              <div className="quiz-svg-container"
                dangerouslySetInnerHTML={{ __html: question.image }} />
            ) : (
              <img src={question.image} alt="题目配图"
                className="max-w-full h-auto rounded-xl shadow-sm" loading="lazy" />
            )}
          </div>
        )}
      </div>
      {isMath ? (
        // ── 数学数值输入模式（数字键盘 + 分数支持）─
        <>
          <input type="text" value={input}
            onChange={e => setInput(e.target.value.replace(/[^0-9./π÷×\-\s]/g, ''))}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            disabled={submitted}
            placeholder="输入数字/分数（如：78.5 或 3/4）"
            inputMode="decimal"
            autoFocus
            className={`w-full border-2 rounded-2xl px-5 py-4 text-lg text-center font-mono font-bold tracking-wider focus:outline-none transition-colors ${
              submitted
                ? correct ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'
                : 'border-indigo-300 focus:border-indigo-500 bg-indigo-50/30'
            }`}
          />
          {/* 快捷分数提示 */}
          {!submitted && !input && (
            <p className="text-xs text-center text-gray-400">💡 支持分数格式（如 1/3）、小数、π</p>
          )}
        </>
      ) : (
        // ── 通用文本输入模式（语文/英语等）─
        <input type="text" value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          disabled={submitted}
          placeholder="请输入答案（数字可用①②③或123）"
          autoFocus
          className={`w-full border-2 rounded-2xl px-5 py-4 text-base text-gray-800 focus:outline-none transition-colors ${
            submitted
              ? correct ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'
              : 'border-gray-200 focus:border-indigo-400 bg-white'
          }`}
        />
      )}
      {!submitted && (
        <button onClick={handleSubmit} disabled={!input.trim()}
          className="w-full bg-indigo-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-2xl text-base active:scale-95 transition-transform">
          提交
        </button>
      )}
      {submitted && !correct && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-2xl px-4 py-3">
          <p className="text-sm text-gray-700">正确答案：<b className="text-indigo-700">{isMath ? normalizedForDisplay(question.answer) : question.answer}</b></p>
          {question.analysis && (
            <details className="mt-2">
              <summary className="text-xs text-gray-500 cursor-pointer">📖 查看解析</summary>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed whitespace-pre-wrap">{question.analysis}</p>
            </details>
          )}
        </div>
      )}
      {submitted && correct && (
        <div className="bg-green-50 border border-green-300 rounded-2xl px-4 py-3 text-center">
          <p className="text-sm font-bold text-green-700">✅ 回答正确！</p>
        </div>
      )}
    </div>
  )
}

// ─── 自评填空题（标点/箭头变形题，先看答案再自评对错）────
function SelfEvalFillQuestion({ question, onDone }) {
  const [revealed, setRevealed] = useState(false)
  const [done, setDone] = useState(false)

  function handleEval(correct) {
    setDone(true)
    onDone(correct ? question.answer : '', correct)
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 题干 */}
      <div className="bg-white rounded-3xl px-5 py-5 shadow-sm border border-gray-100">
        <p className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap">{renderRichText(question.question)}</p>
      </div>

      {/* 未查看时：显示"查看答案"按钮 */}
      {!revealed && !done && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-center text-gray-400">先思考，做完后点击查看答案并自评</p>
          <button onClick={() => setRevealed(true)}
            className="w-full bg-amber-400 text-white font-bold py-4 rounded-2xl text-base active:scale-95 transition-transform">
            查看答案 👁️
          </button>
        </div>
      )}

      {/* 查看后：显示答案 + 自评按钮 */}
      {(revealed || done) && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl px-4 py-3">
          <p className="text-xs text-amber-600 font-semibold mb-1">✏️ 参考答案</p>
          <p className="text-base font-bold text-gray-800 whitespace-pre-wrap leading-relaxed">{question.answer}</p>
        </div>
      )}

      {revealed && !done && (
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => handleEval(true)}
            className="py-4 rounded-2xl border-2 border-green-400 bg-green-50 text-green-700 font-bold text-lg active:scale-95">
            ✓ 我做对了
          </button>
          <button onClick={() => handleEval(false)}
            className="py-4 rounded-2xl border-2 border-red-400 bg-red-50 text-red-600 font-bold text-lg active:scale-95">
            ✗ 我做错了
          </button>
        </div>
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

  if (!current) return <div className="text-center text-gray-400 py-8">⏳ 加载中...</div>
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
  const [charInput, setCharInput] = useState([])   // 选字填空：已点击的字块
  const [phase, setPhase] = useState('input') // 'input' | 'grading' | 'feedback'
  const [results, setResults] = useState([])
  const [aiFeedback, setAiFeedback] = useState(null)
  const resultsRef = useRef([])

  // 检测是否为文言文翻译题（严格匹配，排除古诗词默写/填空类）
  const isTranslation = /翻译[成为到]|把.{1,15}译|文言.{0,8}翻译|翻译成现代汉语/.test(question.question)
    && !/默写|填写|写出.{0,5}(诗|句)|补充.{0,10}(诗|句)|根据.{0,10}(诗|词|意思).{0,10}写/.test(question.question)

  const current = stems[subIndex]
  const expected = expectedMap[current?.num] || ''
  // 翻译题或长答案用 textarea
  const isLong = isTranslation || expected.replace(/[^\u4e00-\u9fff]/g, '').length > 5

  // 选字填空：从子题文本中提取 【辨 辩 辫】 类型字库
  const currentCharBank = useMemo(() => {
    if (!current) return []
    return extractCharBankFromText(current.text)
  }, [current]) // eslint-disable-line
  const hasCharBank = currentCharBank.length > 0

  // 从子题文本中提取文言文原句（去掉"翻译：____"等填空提示）
  function extractClassicalText(text) {
    return text
      .split('\n')
      .filter(line => !/翻译[:：]|意思[:：]|______/.test(line))
      .join('').trim()
  }

  async function handleSubmit() {
    // 选字填空：用已选字块拼成答案；普通填空：用文本输入
    const actualInput = hasCharBank ? charInput.join('') : input
    if (!actualInput.trim()) return
    if (isTranslation) {
      setPhase('grading')
      setAiFeedback(null)
      try {
        const classicalText = extractClassicalText(current.text)
        const result = await evaluateClassicalTranslation(classicalText, actualInput.trim(), expected)
        const correct = result.correct ?? (result.score >= 60)
        setAiFeedback(result)
        const newResults = [...resultsRef.current, { correct }]
        resultsRef.current = newResults
        setResults(newResults)
        setPhase('feedback')
      } catch {
        // AI 失败时降级为精确匹配
        const correct = smartCheck(actualInput, expected)
        setAiFeedback(null)
        const newResults = [...resultsRef.current, { correct }]
        resultsRef.current = newResults
        setResults(newResults)
        setPhase('feedback')
      }
    } else {
      const correct = smartCheck(actualInput, expected)
      const newResults = [...resultsRef.current, { correct }]
      resultsRef.current = newResults
      setResults(newResults)
      setPhase('feedback')
    }
  }

  function handleNext() {
    const nextIdx = subIndex + 1
    if (nextIdx >= stems.length) {
      const allCorrect = resultsRef.current.every(r => r.correct)
      onDone(allCorrect ? question.answer : '答错', allCorrect)
    } else {
      setSubIndex(nextIdx)
      setInput('')
      setCharInput([])
      setAiFeedback(null)
      setPhase('input')
    }
  }

  if (!current) return <div className="text-center text-gray-400 py-8">⏳ 加载中...</div>
  const thisResult = results[subIndex]
  // 用于展示"你的答案"
  const displayedInput = hasCharBank ? charInput.join('') : input

  return (
    <div className="flex flex-col gap-4">
      {/* 题目指令 */}
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
        {/* 选字填空：去除【xxx】标记后展示题干 */}
        <p className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap">
          {hasCharBank ? removeCharBankMarkers(current.text) : current.text}
        </p>
        {/* 选字填空：展示字库来源 */}
        {hasCharBank && (
          <p className="text-xs text-indigo-400 mt-1 font-medium">
            可选字：{currentCharBank.join('  ')}
          </p>
        )}

        {/* 反馈 —— 普通题 */}
        {phase === 'feedback' && !isTranslation && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className={`text-sm font-bold mb-1 ${thisResult?.correct ? 'text-green-600' : 'text-red-500'}`}>
              {thisResult?.correct ? '✓ 正确！' : '✗ 答错了'}
            </p>
            <p className="text-sm text-gray-600">你的答案：<span className="font-medium">{displayedInput}</span></p>
            {!thisResult?.correct && (
              <p className="text-sm text-gray-800 mt-1 font-semibold whitespace-pre-wrap">
                正确答案：{expected}
              </p>
            )}
          </div>
        )}

        {/* 反馈 —— 翻译题 AI 批改结果 */}
        {phase === 'feedback' && isTranslation && (
          <div className="mt-3 pt-3 border-t border-gray-200 flex flex-col gap-2">
            <div className={`flex items-center gap-2 font-bold text-sm ${thisResult?.correct ? 'text-green-600' : 'text-amber-600'}`}>
              {thisResult?.correct ? '✅ 翻译正确！' : '📝 翻译需改进'}
              {aiFeedback?.score !== undefined && (
                <span className="ml-auto text-xs font-normal text-gray-500">得分 {aiFeedback.score}/100</span>
              )}
            </div>
            {aiFeedback ? (
              <>
                <p className="text-sm text-gray-700">{aiFeedback.feedback}</p>
                {aiFeedback.keyWords?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {aiFeedback.keyWords.map((kw, i) => (
                      <span key={i} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full border border-indigo-100">{kw}</span>
                    ))}
                  </div>
                )}
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mt-1">
                  <span className="text-xs text-amber-600 font-semibold">参考译文：</span>
                  <span className="text-xs text-gray-700">{aiFeedback.suggestion || expected}</span>
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-600">
                <p>你的答案：<span className="font-medium">{input}</span></p>
                <p className="mt-1 font-semibold text-gray-800">参考答案：{expected}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI 批改中加载状态 */}
      {phase === 'grading' && (
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="w-8 h-8 border-4 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm text-indigo-500 font-medium">AI 正在批改翻译…</p>
        </div>
      )}

      {/* 输入区 —— 选字填空：点击字块 */}
      {phase === 'input' && hasCharBank && (
        <div className="flex flex-col gap-3">
          {/* 已选字展示区 */}
          <div className={`min-h-[52px] rounded-2xl border-2 px-4 py-3 flex flex-wrap items-center gap-1 ${
            charInput.length ? 'bg-indigo-50 border-indigo-300' : 'bg-gray-50 border-dashed border-gray-200'
          }`}>
            {charInput.length === 0
              ? <p className="text-xs text-gray-300 w-full text-center">点击下方字块选择答案</p>
              : charInput.map((c, i) => (
                <span key={i} className="text-lg font-bold text-indigo-700 w-8 text-center">{c}</span>
              ))
            }
          </div>
          {/* 字块按钮 */}
          <div className="flex flex-wrap gap-2">
            {currentCharBank.map((char, i) => (
              <button key={i} onClick={() => setCharInput(p => [...p, char])}
                className="w-12 h-12 rounded-xl border-2 border-gray-200 bg-white text-xl font-bold text-gray-800 active:scale-95 shadow-sm transition-all">
                {char}
              </button>
            ))}
            {charInput.length > 0 && (
              <button onClick={() => setCharInput(p => p.slice(0, -1))}
                className="px-3 h-12 bg-gray-100 text-gray-500 rounded-xl text-sm border border-gray-200">
                ← 撤销
              </button>
            )}
          </div>
          <button onClick={handleSubmit} disabled={charInput.length === 0}
            className="w-full bg-indigo-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-2xl text-base">
            确认
          </button>
        </div>
      )}

      {/* 输入区 —— 普通填空：文字输入 */}
      {phase === 'input' && !hasCharBank && (
        isLong ? (
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-base text-gray-800 focus:outline-none focus:border-indigo-400 resize-none"
            rows={isTranslation ? 4 : 3}
            placeholder={isTranslation ? "把文言文翻译成现代汉语…" : "在这里写下答案…"}
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
      {phase === 'input' && !hasCharBank && (
        <button onClick={handleSubmit} disabled={!input.trim()}
          className="w-full bg-indigo-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-2xl text-base">
          {isTranslation ? 'AI 批改翻译 ✨' : '确认'}
        </button>
      )}
      {phase === 'feedback' && (
        <button onClick={handleNext}
          className={`w-full font-bold py-4 rounded-2xl text-base text-white ${
            thisResult?.correct ? 'bg-green-500' : 'bg-indigo-500'
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

  // 防护：选项为空时显示提示
  if (!options || options.length === 0) {
    return (
      <div className="bg-red-50 border-2 border-dashed border-red-300 rounded-2xl px-5 py-6 text-center">
        <p className="text-sm text-red-600 font-medium">⚠️ 多义选项为空</p>
        <p className="text-xs text-gray-400 mt-1">ID: {question.id}</p>
      </div>
    )
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
  // 打乱右列时保留原始索引（用于内容匹配）
  const [shuffledRight] = useState(() =>
    [...pairs.map((p, i) => ({ text: p.right, origIdx: i }))].sort(() => Math.random() - 0.5)
  )
  const [leftSel, setLeftSel] = useState(null)
  // matched: {leftIdx: rightShuffledIndex}
  const [matched, setMatched] = useState({})
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
    // ★ 内容匹配而非索引匹配：即使右列有重复项也能正确判断
    const expectedRightText = pairs[leftSel].right
    const correct = item.text === expectedRightText
    setMatched(p => ({ ...p, [leftSel]: ri }))
    if (!correct) setErrors(p => ({ ...p, [leftSel]: true }))
    setLeftSel(null)
  }

  function handleSubmit() {
    // ★ 用内容匹配重新校验所有配对
    let allCorrect = true
    for (const [leftIdx, riStr] of Object.entries(matched)) {
      const ri = Number(riStr)
      const actualRightText = shuffledRight[ri]?.text
      const expectedRightText = pairs[leftIdx]?.right
      if (actualRightText !== expectedRightText) {
        allCorrect = false
        break
      }
    }
    setSubmitted(true)
    onDone(allCorrect ? question.answer : '答错', allCorrect)
  }

  // 防护：配对数据为空时显示提示
  if (!pairs || pairs.length === 0) {
    return (
      <div className="bg-red-50 border-2 border-dashed border-red-300 rounded-2xl px-5 py-6 text-center">
        <p className="text-sm text-red-600 font-medium">⚠️ 配对数据为空</p>
        <p className="text-xs text-gray-400 mt-1">ID: {question.id}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-3xl px-5 py-4 shadow-sm border border-gray-100">
        <p className="text-base text-gray-800 font-medium">{renderRichText(question.question)}</p>
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
  const [variantPhase, setVariantPhase] = useState('idle') // 'idle'|'loading'|'answering'|'done'|'blocked'
  const [variantSel, setVariantSel] = useState(null)
  const [variantStreamText, setVariantStreamText] = useState('') // 流式生成时的实时文本
  // AI 使用次数（今日剩余）
  const [variantRemaining, setVariantRemaining] = useState(null)  // null=未知, 数字=已知
  const [showSocratic, setShowSocratic] = useState(false)
  const [socraticResult, setSocraticResult] = useState(null)

  // 组件挂载/题目切换时查一次剩余次数（不消费，仅展示）
  useEffect(() => {
    if (!showVariantButton) return
    const userId = storage.getUser()?.id
    if (!userId) return
    getAiUsage(userId, 'ai_variant').then(({ remaining }) => {
      setVariantRemaining(remaining)
    }).catch(() => {})
  }, [question?.id, showVariantButton])

  function handleDone(answer, correct) {
    setChosenAnswer(answer)
    setPhase(correct ? 'correct' : 'wrong')
    // ★ 答错自动触发举一反三（配额用完则静默跳过）
    if (!correct) {
      setTimeout(() => handleVariant(true), 600)
    }
  }

  function handleContinue() {
    // 补写 socratic/feynman 数据到最近一条 record
    if (socraticResult && question?.id) {
      const userId = storage.getUser()?.id
      if (userId) {
        const records = storage.getRecords(userId)
        const lastIdx = records.findLastIndex(r => r.card_id === question.id)
        if (lastIdx >= 0) {
          records[lastIdx].socratic_rounds = socraticResult.rounds
          records[lastIdx].feynman_passed = socraticResult.feynmanPassed ?? socraticResult.understood
          records[lastIdx].feynman_score = socraticResult.score
          try { localStorage.setItem('cl_records_' + userId, JSON.stringify(records)) } catch {}
        }
      }
    }
    onAnswerSubmit(chosenAnswer, phase === 'correct')
    setPhase('answering')
    setChosenAnswer(null)
    setVariantQ(null)
    setVariantPhase('idle')
    setVariantSel(null)
    setVariantStreamText('')
    setShowSocratic(false)
    setSocraticResult(null)
  }

  async function handleVariant(isAuto = false) {
    const userId = storage.getUser()?.id
    if (userId) {
      const check = await checkAiUsage(userId, 'ai_variant')
      if (!check.ok) {
        // 自动触发时静默跳过；手动点击时才显示"配额已用完"提示
        if (!isAuto) {
          setVariantPhase('blocked')
        }
        setVariantRemaining(0)
        return
      }
      setVariantRemaining(check.remaining)
    }
    setVariantPhase('loading')
    setVariantStreamText('')
    try {
      // 使用流式 API：用户看到文字逐渐出现，体感速度提升 10 倍
      const subject = question.knowledge_tag?.includes('英') ? 'english' : 'chinese'
      const result = await generateVariantsStream(question, 1, subject, (delta, fullText) => {
        // 从流式 JSON 中实时提取题目文字（让用户看到题目在"打字"）
        const m = fullText.match(/"question"\s*:\s*"([^"]{4,})"?/)
        if (m) setVariantStreamText(m[1])
      })
      if (result.variants?.length > 0) {
        const v = result.variants[0]
        // ★ 检测原题是否为听力题，若是则标记变体为听力变体（隐藏文字）
        const isOriginalListening = !!question.listening_text
        setVariantQ({
          id: `variant_${question.id}`,
          type: 'single_choice',
          question: isOriginalListening ? '🎧 请听音频后选择正确答案' : v.question,
          listeningText: isOriginalListening ? (v.listeningText || v.question) : undefined,
          options: v.options,
          answer: v.answer,
          analysis: v.analysis,
          knowledge_tag: question.knowledge_tag,
          ability_tag: question.ability_tag,
          difficulty: question.difficulty,
          isVariant: true,
          isListeningVariant: isOriginalListening,
        })
        setVariantStreamText('')
        setVariantPhase('answering')
      } else {
        setVariantPhase('idle')
      }
    } catch (e) {
      console.warn('[Variant] 生成失败:', e.message)
      setVariantPhase('idle')
      setVariantStreamText('')
    }
  }

  const isFill = question.type === 'fill_blank'

  // ★ 剥离内联选项：选择题题干中包含 A. xxx B. xxx... 时，只保留题干文本
  const cleanQuestion = useMemo(() => {
    if (question.type !== 'single_choice' && question.type !== 'multiple_choice') return question.question
    const q = question.question || ''
    const opts = question.options || []
    if (opts.length === 0) return q
    // 检测内联选项块
    const inlineOptRe = /^[A-D][.、．]\s*.+$/gm
    const firstMatch = inlineOptRe.exec(q)
    if (!firstMatch) return q
    // 从第一个内联选项之前截断
    return q.slice(0, firstMatch.index).trimEnd()
  }, [question.type, question.question, question.options])

  // ★ 防护：选择题必须有 options，填空题必须有 answer，否则显示提示
  if (isFill && !question.answer && !question.question) {
    return (
      <div className="bg-red-50 border-2 border-dashed border-red-300 rounded-2xl px-5 py-6 text-center">
        <p className="text-sm text-red-600 font-medium">⚠️ 题目数据缺失</p>
        <p className="text-xs text-gray-400 mt-1">ID: {question.id}（可能来自旧版本）</p>
      </div>
    )
  }
  if (!isFill && (!question.options || !Array.isArray(question.options))) {
    return (
      <div className="bg-red-50 border-2 border-dashed border-red-300 rounded-2xl px-5 py-6 text-center">
        <p className="text-sm text-red-600 font-medium">⚠️ 选项数据缺失</p>
        <p className="text-xs text-gray-400 mt-1">ID: {question.id}（可能来自旧版本）</p>
      </div>
    )
  }
  const answered = phase !== 'answering'

  const fillType = isFill
    ? isJudgmentQ(question) ? 'judgment'
    : isTypoQ(question) ? 'typo'
    : isOrderQ(question) ? 'order'
    : isWordBankQ(question) ? 'wordbank'
    : isMatchingStyleQ(question) ? 'matching_fill'
    : isMultiSubQ(question) ? 'multi_sub'
    : isSelfEvalFillQ(question) ? 'self_eval'
    : 'plain'
    : null

  // 动态连线题：从题目文本中解析 pairs
  const matchingFillPairs = fillType === 'matching_fill'
    ? extractMatchingPairs(question) : null

  // 以下题型内部有提交逻辑，答完后只展示底部继续条（含解析）
  const hasInternalSubmit = fillType === 'judgment' || fillType === 'typo' || fillType === 'order'
    || fillType === 'wordbank' || fillType === 'matching_fill' || fillType === 'multi_sub'
    || fillType === 'self_eval'
    || question.type === 'matching' || question.type === 'multi_meaning'

  return (
    <div className="flex flex-col gap-4 pb-44">
      {/* 题目为空时的防护 */}
      {!question || (!question.type && !question.question) ? (
        <div className="bg-orange-50 border-2 border-dashed border-orange-300 rounded-3xl px-6 py-10 text-center">
          <p className="text-lg font-bold text-orange-700 mb-1">⏳ 题目加载中...</p>
          <p className="text-sm text-gray-400">如果持续显示此页面，请返回重试</p>
          <button onClick={() => window.history.back()} className="mt-3 text-xs text-indigo-500 underline">← 返回</button>
        </div>
      ) : (
      <>
      {/* 标签 */}
      <div className="flex gap-2 flex-wrap">
        <span className="bg-indigo-100 text-indigo-700 text-xs px-3 py-1 rounded-full font-semibold">{question.knowledge_tag || '未分类'}</span>
        <span className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">{question.ability_tag || '-'}</span>
        <span className="text-gray-300 text-xs px-2 py-1">{'⭐'.repeat(question.difficulty || 1)}</span>
      </div>

      {/* 题干（选择题单独显示，填空题由子组件内部显示） */}
      {question.type === 'single_choice' && (
        <div className="bg-white rounded-3xl px-5 py-5 shadow-sm border border-gray-100">
          <p className={`leading-relaxed font-medium text-gray-800 ${
            (cleanQuestion || '').length > 120 ? 'text-sm' :
            (cleanQuestion || '').length > 60  ? 'text-base' : 'text-lg'
          }`}>{renderRichText(cleanQuestion || '')}</p>
          {/* 配图渲染：支持 SVG 字符串 / 图片 URL / base64 */}
          {question.image && (
            <div className="mt-4 flex justify-center">
              {question.image.startsWith('<svg') ? (
                <div
                  className="quiz-svg-container"
                  dangerouslySetInnerHTML={{ __html: question.image }}
                />
              ) : (
                <img
                  src={question.image}
                  alt="题目配图"
                  className="max-w-full h-auto rounded-xl shadow-sm"
                  loading="lazy"
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* multiple_choice 题干（英语题使用） */}
      {question.type === 'multiple_choice' && (
        <div className="bg-white rounded-3xl px-5 py-5 shadow-sm border border-gray-100">
          <div className="flex items-start gap-2">
            <p className={`leading-relaxed font-medium flex-1 whitespace-pre-wrap text-gray-800 ${
              (cleanQuestion || '').length > 120 ? 'text-sm' :
              (cleanQuestion || '').length > 60  ? 'text-base' : 'text-lg'
            }`}>{renderRichText(cleanQuestion || '')}</p>
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
      {isFill && fillType === 'self_eval'  && <SelfEvalFillQuestion   question={question} onDone={handleDone} />}
      {isFill && fillType === 'plain'      && <FillQuestion           question={question} onDone={handleDone} />}

      {/* 兜底：未知题型 → 用最通用的填空组件兜底，而不是显示"暂不支持" */}
      {!((question.type === 'single_choice' || question.type === 'multiple_choice') ||
         question.type === 'multi_meaning' || question.type === 'matching' ||
         (isFill && ['judgment','typo','order','wordbank','matching_fill','multi_sub','self_eval','plain'].includes(fillType))) && (
        <FillQuestion question={question} onDone={handleDone} />
      )}

      {/* 底部反馈面板：选择题 & 普通填空 */}
      {answered && !hasInternalSubmit && (
        <FeedbackPanel
          correct={phase === 'correct'}
          analysis={question.analysis}
          answer={phase === 'wrong' ? question.answer : null}
          wrongChoice={phase === 'wrong' ? chosenAnswer : null}
          questionOpts={question.options}
          onContinue={handleContinue}
          onSocratic={phase === 'wrong' ? () => setShowSocratic(true) : null}
          variantState={{
            showButton: showVariantButton,
            phase: variantPhase,
            question: variantQ,
            selected: variantSel,
            remaining: variantRemaining,
            streamText: variantStreamText,
            onSelect: (opt) => { setVariantSel(opt); setVariantPhase('done') },
            // ★ 再出一题：重置当前变式题状态，重新生成
            onRegenerate: () => {
              setVariantSel(null)
              setVariantPhase('idle')
              setVariantQ(null)
              setVariantStreamText('')
              // 延迟一帧触发生成
              setTimeout(() => handleVariant(false), 50)
            },
            onGenerate: () => handleVariant(false),
            // ★ 听力变体题：TTS播放回调
            onSpeakVariant: variantQ?.isListeningVariant ? () => {
              if (variantQ.listeningText && window.speakEnglish) {
                window._speakEnglish?.(variantQ.listeningText)
              }
            } : undefined,
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
      </>
      )}

      {/* Socratic deep understanding modal */}
      {showSocratic && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end justify-center"
          onClick={(e) => { if (e.target === e.currentTarget) setShowSocratic(false) }}>
          <div className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-t-3xl">
            <SocraticDialogue
              question={question}
              studentAnswer={chosenAnswer}
              subject={question.knowledge_tag?.includes('英') ? 'english' : 'chinese'}
              onComplete={(result) => { setSocraticResult(result); setShowSocratic(false) }}
              onSkip={() => setShowSocratic(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
