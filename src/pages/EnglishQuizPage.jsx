import { useState, useEffect, useRef, useMemo } from 'react'
import { storage, updateStreak } from '../utils/storage'
import { updateSRS, toQuality } from '../utils/srs'
import { syncAfterSession } from '../utils/sync'
import { speakEnglish as _speakEnglish, stop as stopTTS, initTTS } from '../utils/tts'
import { evaluateEnglishReading, evaluateEnglishWriting } from '../utils/ai'
import enVocabQ from '../data/questions_en_vocab.json'
import enListenQ from '../data/questions_en_listen.json'
import enGrammarQ from '../data/questions_en_grammar.json'
import enReadingQ from '../data/questions_en_reading.json'
import enWritingQ from '../data/questions_en_writing.json'
import j2VocabQ from '../data/questions_en_j2_vocab.json'
import j2GrammarQ from '../data/questions_en_j2_grammar.json'
import j2ListenQ from '../data/questions_en_j2_listen.json'
import j2ReadingQ from '../data/questions_en_j2_reading.json'
import j2WritingQ from '../data/questions_en_j2_writing.json'

const SESSION_SIZE = 15

const EN_QUESTION_MAP = {
  en_vocab:   enVocabQ,
  en_listen:  enListenQ,
  en_grammar: enGrammarQ,
  en_reading: enReadingQ,
  en_writing: enWritingQ,
}

// 初中二年级题库
const J2_QUESTION_MAP = {
  en_vocab:   j2VocabQ,
  en_listen:  j2ListenQ,
  en_grammar: j2GrammarQ,
  en_reading: j2ReadingQ,
  en_writing: j2WritingQ,
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// 使用统一 TTS 引擎（Edge TTS 优先 + Web Speech API 降级）
function speakEnglish(text, onEnd) {
  if (!text) return
  _speakEnglish(text, { onEnd })
}

// ─── 多子题解析 ────────────────────────────────────────────────────────────

function isMultiPartAnswer(q) {
  return /\(1\)|\（1\）/.test(q.answer || '')
}

// 将题目字符串按 (1)(2)... 分段
function splitAtNums(str) {
  const results = []
  // 匹配 ASCII (1) 或 中文 （1）
  const regex = /[（(](\d+)[）)]/g
  let match
  const positions = []
  while ((match = regex.exec(str)) !== null) {
    positions.push({ num: parseInt(match[1]), idx: match.index, len: match[0].length })
  }
  if (positions.length === 0) return { preamble: str, parts: [] }
  const preamble = str.slice(0, positions[0].idx)
  for (let i = 0; i < positions.length; i++) {
    const start = positions[i].idx + positions[i].len
    const end = i + 1 < positions.length ? positions[i + 1].idx : str.length
    results.push({ num: positions[i].num, text: str.slice(start, end).trim() })
  }
  return { preamble: preamble.trim(), parts: results }
}

// 从子题文字中提取 A/B/C/D 选项
function extractInlineOptions(text) {
  // "A. small B. large C. new D. old" 格式
  const matches = [...text.matchAll(/\b([A-D])\.\s*([^A-D\n]+?)(?=\s+[A-D]\.|$)/g)]
  if (matches.length >= 2) {
    return matches.map(m => ({ letter: m[1], text: m[2].trim().replace(/\s+$/, '') }))
  }
  return null
}

function parseSubParts(q) {
  const { preamble: passage, parts: qParts } = splitAtNums(q.question || '')
  const { parts: aParts } = splitAtNums(q.answer || '')
  const answerMap = Object.fromEntries(aParts.map(p => [p.num, p.text]))

  const subQuestions = qParts.map(part => {
    const rawAnswer = (answerMap[part.num] || '').trim()

    let type = 'text'
    let options = null
    let displayText = part.text

    if (/^[TtFf]$/.test(rawAnswer)) {
      type = 'tf'
      // 去掉判断括号 (　) (  )
      displayText = part.text.replace(/\s*[（(][　\s]*[）)]/g, '').trim()
    } else if (/^[A-Da-d]$/.test(rawAnswer)) {
      type = 'choice'
      options = extractInlineOptions(part.text)
      if (!options && q.options && q.options.length >= 2) {
        options = q.options.map((o, i) => ({
          letter: ['A','B','C','D'][i],
          text: o.replace(/^[A-D]\.\s*/i, '').trim(),
        }))
      }
      // 去掉选项行，只保留问题干
      displayText = part.text.replace(/\b[A-D]\.\s*[^\nA-D]+/g, '').trim()
    }

    return {
      num: part.num,
      displayText,
      rawAnswer,
      type,
      options,
    }
  })

  return { passage, subQuestions }
}

// ─── 多子题分页组件 ──────────────────────────────────────────────────────────

function MultiSubQuiz({ question: q, onSubmit, englishTag }) {
  const { passage, subQuestions } = useMemo(() => parseSubParts(q), [q])
  const [step, setStep] = useState(0)
  const [results, setResults] = useState([])        // { correct, answer }[]
  const [submitted, setSubmitted] = useState(false)
  const [currentCorrect, setCurrentCorrect] = useState(false)
  const [textInput, setTextInput] = useState('')

  const done = results.length >= subQuestions.length
  const current = subQuestions[step]

  // 若解析出0个子题，降级为写作题
  if (subQuestions.length === 0) {
    return <SimpleWritingInput q={q} onSubmit={onSubmit} englishTag={englishTag} passage={passage} />
  }

  function mark(correct) { setCurrentCorrect(correct); setSubmitted(true) }
  function handleTF(val) { if (!submitted) mark(val.toUpperCase() === current.rawAnswer.toUpperCase()) }
  function handleChoice(letter) { if (!submitted) mark(letter.toUpperCase() === current.rawAnswer.toUpperCase()) }
  function handleText() {
    if (!textInput.trim()) return
    mark(textInput.trim().toLowerCase() === current.rawAnswer.toLowerCase())
  }

  function advance() {
    const next = [...results, { correct: currentCorrect }]
    setResults(next)
    if (next.length < subQuestions.length) {
      setStep(s => s + 1)
      setTextInput('')
      setSubmitted(false)
      setCurrentCorrect(false)
    }
  }

  // 结果页
  if (done) {
    const correct = results.filter(r => r.correct).length
    const total = results.length
    const pct = Math.round(correct / total * 100)
    return (
      <div className="flex flex-col gap-4">
        {passage && (
          <div className="bg-white rounded-2xl px-4 py-3 shadow-sm max-h-36 overflow-y-auto">
            <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-wrap">{passage}</p>
          </div>
        )}
        <div className={`rounded-2xl p-5 border text-center ${pct >= 60 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="text-4xl mb-2">{pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '💪'}</div>
          <div className={`text-2xl font-extrabold ${pct >= 60 ? 'text-green-700' : 'text-amber-700'}`}>
            {correct} / {total}
          </div>
          <div className="text-sm text-gray-500 mt-1">正确率 {pct}%</div>
          <div className="flex gap-1 justify-center mt-3">
            {results.map((r, i) => (
              <span key={i} className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${r.correct ? 'bg-green-400' : 'bg-red-400'}`}>
                {r.correct ? '✓' : '✗'}
              </span>
            ))}
          </div>
        </div>
        {q.analysis && (
          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4">
            <div className="text-xs font-semibold text-sky-600 mb-1">💡 解析</div>
            <div className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">{q.analysis}</div>
          </div>
        )}
        <button
          onClick={() => onSubmit('', pct >= 50)}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 text-white font-bold active:scale-95 transition-transform shadow-md"
        >
          继续下一题 →
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 文章/题干（可滚动） */}
      {passage && (
        <div className="bg-white rounded-2xl px-4 py-3 shadow-sm max-h-40 overflow-y-auto">
          <div className="text-[10px] text-gray-400 font-semibold mb-1 uppercase tracking-wide">阅读材料</div>
          <p className="text-gray-700 text-xs leading-relaxed whitespace-pre-wrap">{passage}</p>
        </div>
      )}

      {/* 子题进度 */}
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
          <div
            className="bg-sky-400 h-1.5 rounded-full transition-all"
            style={{ width: `${step / subQuestions.length * 100}%` }}
          />
        </div>
        <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
          第 {step + 1} / {subQuestions.length} 题
        </span>
      </div>

      {/* 当前子题 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="text-xs font-bold text-sky-500 mb-2">（{current.num}）</div>
        <p className="text-gray-800 text-sm leading-relaxed">{current.displayText}</p>
      </div>

      {/* T/F 按钮（英语用 A/B 标签） */}
      {current.type === 'tf' && !submitted && (
        <div className="grid grid-cols-2 gap-3">
          {[['T','A  正确','text-green-700','border-green-200'], ['F','B  错误','text-red-600','border-red-200']].map(([val, label, tc, bc]) => (
            <button
              key={val}
              onClick={() => handleTF(val)}
              className={`py-4 rounded-2xl border-2 bg-white font-bold text-base active:scale-95 transition-all ${tc} ${bc}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* T/F 答后状态 */}
      {current.type === 'tf' && submitted && (
        <div className="grid grid-cols-2 gap-3">
          {['T','F'].map(val => {
            const isCorrectOpt = val === current.rawAnswer.toUpperCase()
            let cls = 'bg-white border-gray-200 text-gray-400'
            if (isCorrectOpt) cls = 'bg-green-50 border-green-400 text-green-700'
            else if (!currentCorrect && val !== current.rawAnswer.toUpperCase()) cls = 'bg-red-50 border-red-300 text-red-500'
            return (
              <div key={val} className={`py-4 rounded-2xl border-2 font-bold text-base text-center ${cls}`}>
                {val === 'T' ? 'A  正确' : 'B  错误'}
              </div>
            )
          })}
        </div>
      )}

      {/* ABCD 选项 */}
      {current.type === 'choice' && current.options && !submitted && (
        <div className="flex flex-col gap-2">
          {current.options.map(opt => (
            <button
              key={opt.letter}
              onClick={() => handleChoice(opt.letter)}
              className="rounded-2xl border-2 border-gray-200 bg-white px-4 py-3 text-sm text-left font-medium active:scale-95 transition-all"
            >
              <span className="mr-2 text-xs font-bold text-gray-400">{opt.letter}.</span>
              {opt.text}
            </button>
          ))}
        </div>
      )}

      {/* ABCD 答后状态 */}
      {current.type === 'choice' && current.options && submitted && (
        <div className="flex flex-col gap-2">
          {current.options.map(opt => {
            const isCorrectOpt = opt.letter === current.rawAnswer.toUpperCase()
            const wasWrong = !currentCorrect && !isCorrectOpt
            let cls = 'border-gray-200 bg-white text-gray-400'
            if (isCorrectOpt) cls = 'border-green-400 bg-green-50 text-green-700'
            else if (!currentCorrect && !isCorrectOpt) cls = 'border-gray-200 bg-white text-gray-300'
            return (
              <div key={opt.letter} className={`rounded-2xl border-2 px-4 py-3 text-sm font-medium ${cls}`}>
                <span className="mr-2 text-xs font-bold opacity-50">{opt.letter}.</span>
                {opt.text}
              </div>
            )
          })}
        </div>
      )}

      {/* 文本输入 */}
      {current.type === 'text' && !submitted && (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && textInput.trim() && handleText()}
            placeholder="输入答案..."
            className="border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-sky-400 outline-none bg-white"
            autoFocus
            autoComplete="off" autoCorrect="off" spellCheck="false"
          />
          <button
            onClick={handleText}
            disabled={!textInput.trim()}
            className="bg-sky-500 disabled:bg-gray-200 text-white font-bold py-3 rounded-xl active:scale-95"
          >
            确认
          </button>
        </div>
      )}

      {/* 答题反馈 + 下一题 */}
      {submitted && (
        <>
          <div className={`rounded-2xl px-4 py-3 border font-semibold text-sm ${currentCorrect ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
            {currentCorrect ? '✅ 正确！' : `❌ 正确答案：${current.rawAnswer}`}
          </div>
          <button
            onClick={advance}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-bold active:scale-95 transition-transform shadow-md"
          >
            {results.length + 1 >= subQuestions.length ? '查看得分 →' : '下一小题 →'}
          </button>
        </>
      )}
    </div>
  )
}

// ─── 写作/阅读题（AI评分版） ─────────────────────────────────────────────────

function SimpleWritingInput({ q, onSubmit, englishTag, passage }) {
  const [input, setInput] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [aiEvaluating, setAiEvaluating] = useState(false)
  const [aiResult, setAiResult] = useState(null)
  const isReading = englishTag === 'en_reading'
  const isWriting = englishTag === 'en_writing'

  async function handleSubmit() {
    if (!input.trim()) return
    setSubmitted(true)
    // 阅读和写作题调用AI评分
    if ((isReading || isWriting) && input.trim().length > 5) {
      setAiEvaluating(true)
      try {
        let result
        if (isReading) {
          result = await evaluateEnglishReading(passage || q.question, q.question, input, q.answer)
        } else {
          result = await evaluateEnglishWriting(q.question, input, q.answer)
        }
        setAiResult(result)
      } catch (e) {
        console.warn('AI评分失败:', e)
      }
      setAiEvaluating(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
            {isReading ? '阅读理解' : '写作题'}
          </span>
          {(isReading || isWriting) && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">AI 评分</span>
          )}
        </div>
        {passage && isReading && (
          <div className="bg-sky-50 rounded-xl p-3 mb-3 border border-sky-100">
            <div className="text-[10px] text-sky-500 font-semibold mb-1">阅读材料</div>
            <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{passage}</p>
          </div>
        )}
        <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{q.question}</p>
      </div>
      {!submitted ? (
        <>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={isReading ? "请在这里写下你的答案..." : "Please write your answer here..."}
            className="w-full h-28 rounded-2xl border border-gray-200 p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white"
          />
          <button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className={`w-full py-3 rounded-2xl font-bold text-white ${input.trim() ? 'bg-gradient-to-r from-sky-400 to-blue-500 active:scale-95' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
          >
            提交并查看答案
          </button>
        </>
      ) : (
        <>
          {/* AI评分结果 */}
          {aiEvaluating && (
            <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 text-center">
              <div className="text-2xl mb-2 animate-bounce">🤖</div>
              <div className="text-sm text-sky-600 font-medium">AI 正在评分中...</div>
            </div>
          )}
          {aiResult && !aiEvaluating && (
            <div className="bg-gradient-to-br from-sky-50 to-indigo-50 border border-sky-200 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-sky-700">🤖 AI 评分</span>
                <span className={`text-lg font-extrabold ${aiResult.score >= 70 ? 'text-green-600' : aiResult.score >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
                  {aiResult.score} 分
                </span>
              </div>
              {/* 写作题：三项分 */}
              {isWriting && aiResult.grammar !== undefined && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { label: '语法', score: aiResult.grammar, feedback: aiResult.grammarFeedback, color: 'from-violet-400 to-purple-500' },
                    { label: '词汇', score: aiResult.vocabulary, feedback: aiResult.vocabFeedback, color: 'from-sky-400 to-blue-500' },
                    { label: '结构', score: aiResult.structure, feedback: aiResult.structureFeedback, color: 'from-emerald-400 to-teal-500' },
                  ].map(item => (
                    <div key={item.label} className="bg-white rounded-xl p-2 text-center">
                      <div className="text-[10px] text-gray-500">{item.label}</div>
                      <div className={`text-base font-bold bg-gradient-to-r ${item.color} bg-clip-text text-transparent`}>{item.score}</div>
                      <div className="text-[9px] text-gray-400 mt-0.5">{item.feedback}</div>
                    </div>
                  ))}
                </div>
              )}
              {/* 阅读题：要点分析 */}
              {isReading && (
                <div className="mb-3">
                  {aiResult.hitPoints?.length > 0 && (
                    <div className="mb-2">
                      <div className="text-xs font-semibold text-green-600 mb-1">答对的要点</div>
                      {aiResult.hitPoints.map((p, i) => (
                        <div key={i} className="text-xs text-gray-600 pl-3">✅ {p}</div>
                      ))}
                    </div>
                  )}
                  {aiResult.missedPoints?.length > 0 && (
                    <div className="mb-2">
                      <div className="text-xs font-semibold text-amber-600 mb-1">遗漏的要点</div>
                      {aiResult.missedPoints.map((p, i) => (
                        <div key={i} className="text-xs text-gray-600 pl-3">⚠️ {p}</div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {/* 总评 */}
              {aiResult.teacherComment && (
                <div className="bg-white rounded-xl p-3 mb-2">
                  <div className="text-xs font-semibold text-gray-500 mb-1">老师评语</div>
                  <div className="text-xs text-gray-700">{aiResult.teacherComment}</div>
                </div>
              )}
              {aiResult.suggestion && (
                <div className="bg-white rounded-xl p-3">
                  <div className="text-xs font-semibold text-amber-600 mb-1">改进建议</div>
                  <div className="text-xs text-gray-700">{aiResult.suggestion}</div>
                </div>
              )}
            </div>
          )}
          {/* 参考答案 */}
          <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4">
            <div className="text-sm font-semibold text-sky-700 mb-1">📖 参考答案</div>
            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{q.answer}</div>
            {q.analysis && (
              <div className="mt-3 pt-3 border-t border-sky-200">
                <div className="text-xs font-semibold text-gray-500 mb-1">💡 解析</div>
                <div className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">{q.analysis}</div>
              </div>
            )}
          </div>
          <button
            onClick={() => onSubmit(input, aiResult ? aiResult.score >= 60 : true)}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 text-white font-bold active:scale-95 shadow-md"
          >
            继续下一题 →
          </button>
        </>
      )}
    </div>
  )
}

// ─── 模式检测 ──────────────────────────────────────────────────────────────

function detectMode(q) {
  if (q.type === 'open_ended') return 'writing'
  if (isMultiPartAnswer(q)) return 'multi_sub'
  if (Array.isArray(q.options) && q.options.length >= 2) return 'choice'
  if (q.type === 'fill_blank' && (q.answer || '').length < 40) return 'text_fill'
  return 'writing'
}

function isChoiceCorrect(selected, q) {
  const ans = (q.answer || '').trim()
  if (/^[A-D]$/i.test(ans)) {
    const idx = ans.toUpperCase().charCodeAt(0) - 65
    return selected === q.options[idx]
  }
  const strip = s => String(s || '').trim().toLowerCase().replace(/^[a-d]\.\s*/i, '')
  return strip(selected) === strip(ans)
}

// ─── 英语题目通用组件 ──────────────────────────────────────────────────────

const TYPE_LABEL = { multiple_choice: '选择题', fill_blank: '填空题', open_ended: '写作题' }
const TYPE_COLOR = {
  multiple_choice: { bg: '#e0f2fe', text: '#0369a1' },
  fill_blank:      { bg: '#f0fdf4', text: '#15803d' },
  open_ended:      { bg: '#fdf4ff', text: '#7e22ce' },
}

function EnglishQuestion({ question: q, onSubmit, englishTag }) {
  const mode = detectMode(q)

  // 多子题分页 → 独立组件
  if (mode === 'multi_sub') return <MultiSubQuiz question={q} onSubmit={onSubmit} englishTag={englishTag} />
  // 写作 → 独立组件
  if (mode === 'writing') return <SimpleWritingInput q={q} onSubmit={onSubmit} englishTag={englishTag} />

  // ── 选择题 / 填空题 ──
  const [selected, setSelected] = useState(null)
  const [textInput, setTextInput] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const labelColor = TYPE_COLOR[q.type] || TYPE_COLOR.multiple_choice

  function handleSelect(opt) {
    if (submitted) return
    const correct = isChoiceCorrect(opt, q)
    setSelected(opt); setIsCorrect(correct); setSubmitted(true)
  }
  function handleTextSubmit() {
    if (!textInput.trim()) return
    const correct = textInput.trim().toLowerCase() === (q.answer || '').trim().toLowerCase()
    setIsCorrect(correct); setSubmitted(true)
  }

  const feedbackBg = isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'

  return (
    <div className="flex flex-col gap-4">
      {/* 题目 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: labelColor.bg, color: labelColor.text }}>
            {TYPE_LABEL[q.type] || '题目'}
          </span>
          <button onClick={() => speakEnglish(q.question)}
            className="ml-auto w-7 h-7 flex items-center justify-center bg-sky-100 text-sky-500 rounded-full text-sm">🔊</button>
        </div>
        <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{q.question}</p>
      </div>

      {/* 选择题 */}
      {mode === 'choice' && (
        <div className="flex flex-col gap-2">
          {q.options.map((opt, i) => {
            const correctIdx = /^[A-D]$/i.test((q.answer||'').trim()) ? q.answer.toUpperCase().charCodeAt(0)-65 : -1
            const isThisCorrect = correctIdx >= 0 ? i === correctIdx : isChoiceCorrect(opt, q)
            let cls = 'bg-white border-gray-200 text-gray-700'
            if (submitted) {
              if (isThisCorrect) cls = 'bg-green-50 border-green-400 text-green-700'
              else if (opt === selected) cls = 'bg-red-50 border-red-400 text-red-600'
              else cls = 'bg-white border-gray-100 text-gray-300'
            }
            return (
              <button key={i} onClick={() => handleSelect(opt)} disabled={submitted}
                className={`rounded-2xl border-2 px-4 py-3 text-sm font-medium text-left transition-all active:scale-95 ${cls}`}>
                <span className="mr-2 text-xs font-bold opacity-40">{['A','B','C','D'][i]}.</span>
                {opt.replace(/^[A-D]\.\s*/i, '').replace(/^T$/, '正确').replace(/^F$/, '错误').replace(/的图片描述$/, '')}
              </button>
            )
          })}
        </div>
      )}

      {/* 填空题 */}
      {mode === 'text_fill' && !submitted && (
        <div className="flex flex-col gap-3">
          <input type="text" value={textInput} onChange={e => setTextInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && textInput.trim() && handleTextSubmit()}
            placeholder="在此输入答案..."
            className="border-2 border-gray-200 rounded-xl px-4 py-3 text-base font-mono focus:border-sky-400 outline-none bg-white"
            autoFocus autoComplete="off" autoCorrect="off" spellCheck="false" />
          <button onClick={handleTextSubmit} disabled={!textInput.trim()}
            className="bg-sky-500 disabled:bg-gray-200 text-white font-bold py-3 rounded-xl active:scale-95">
            确认答案
          </button>
        </div>
      )}

      {/* 反馈 */}
      {submitted && (
        <div className={`rounded-2xl p-4 border ${feedbackBg}`}>
          <div className={`font-bold text-base mb-2 ${isCorrect ? 'text-green-700' : 'text-red-600'}`}>
            {isCorrect ? '✅ 回答正确！' : `❌ 正确答案：${q.answer}`}
          </div>
          {q.analysis && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="text-xs font-semibold text-gray-500 mb-1">💡 解析 &amp; 翻译</div>
              <div className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{q.analysis}</div>
            </div>
          )}
        </div>
      )}

      {submitted && (
        <button onClick={() => onSubmit(selected || textInput, isCorrect)}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 text-white font-bold active:scale-95 shadow-md">
          继续下一题 →
        </button>
      )}
    </div>
  )
}

// ─── 主页面 ──────────────────────────────────────────────────────────────────

export default function EnglishQuizPage({ user, options = {}, onFinish, onBack }) {
  const { englishTag = 'en_vocab', grade = 'primary' } = options
  const srsStates = useRef(storage.getSrsState(user.id))
  const startTime = useRef(Date.now())
  const questionStartTime = useRef(Date.now())

  const questions = useMemo(() => {
    const questionMap = grade === 'junior2' ? J2_QUESTION_MAP : EN_QUESTION_MAP
    const pool = questionMap[englishTag] || enVocabQ
    return shuffle(pool).slice(0, SESSION_SIZE)
  }, [englishTag, grade])

  const [index, setIndex] = useState(0)
  const [sessionRecords, setSessionRecords] = useState([])
  const [xpGained, setXpGained] = useState(0)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)

  const current = questions[index]

  useEffect(() => { questionStartTime.current = Date.now() }, [index])

  useEffect(() => {
    if (current?.listening_text) {
      setIsPlayingAudio(true)
      speakEnglish(current.listening_text, () => setIsPlayingAudio(false))
    } else {
      setIsPlayingAudio(false)
    }
    return () => { stopTTS(); setIsPlayingAudio(false) }
  }, [index, current?.id])

  function handleAnswerSubmit(chosenAnswer, correct) {
    const timeSec = (Date.now() - questionStartTime.current) / 1000
    const newCardState = updateSRS(srsStates.current[current.id], toQuality(correct, timeSec))
    storage.updateCardSrs(user.id, current.id, newCardState)
    srsStates.current[current.id] = newCardState

    const xp = correct ? 5 : 1
    setXpGained(p => p + xp)
    storage.addXP(user.id, xp)

    const record = {
      card_id: current.id, correct,
      time_spent: Math.round(timeSec * 10) / 10,
      selected_answer: chosenAnswer,
      ability_tag: current.ability_tag,
      knowledge_tag: current.knowledge_tag,
      subject: 'english',
      timestamp: new Date().toISOString(),
    }
    storage.addRecord(user.id, record)
    setSessionRecords(p => [...p, record])

    if (index + 1 >= questions.length) {
      const totalSec = Math.round((Date.now() - startTime.current) / 1000)
      const allRecords = [...sessionRecords, record]
      const correctCount = allRecords.filter(r => r.correct).length
      const session = {
        date: new Date().toISOString(),
        total: allRecords.length, correct: correctCount,
        xpEarned: xpGained + xp, durationSec: totalSec,
      }
      storage.addSession(user.id, session)
      updateStreak(user.id)
      syncAfterSession(user.id)
      onFinish({ session, records: allRecords })
    } else {
      setIndex(i => i + 1)
    }
  }

  if (!current) return null

  const PLANET_LABELS = {
    en_vocab: '词汇星球 🔤', en_listen: '听力星球 🎧',
    en_grammar: '语法星球 📐', en_reading: '阅读星球 📚', en_writing: '写作星球 ✏️',
  }

  return (
    // h-screen + overflow-hidden 确保内容区可独立滚动，解决听力题遮挡问题
    <div className="flex flex-col h-screen bg-gradient-to-b from-sky-50 to-blue-50">
      {/* 顶部进度栏（固定不动） */}
      <div className="flex-shrink-0 bg-white px-4 pt-8 pb-4 flex items-center gap-3 shadow-sm">
        <button onClick={onBack} className="text-gray-400 p-1 text-xl">✕</button>
        <div className="flex-1 bg-gray-100 rounded-full h-2">
          <div className="bg-gradient-to-r from-sky-400 to-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${(index / questions.length) * 100}%` }} />
        </div>
        <span className="text-sm text-gray-500 font-medium min-w-[40px] text-right">
          {index + 1}/{questions.length}
        </span>
      </div>

      {/* 星球标签 */}
      <div className="flex-shrink-0 px-4 pt-2 pb-1">
        <span className="text-xs text-sky-500 font-medium bg-sky-50 px-3 py-1 rounded-full">
          {PLANET_LABELS[englishTag] || '英语练习'}
        </span>
      </div>

      {/* 听力提示区 */}
      {current.listening_text && (
        <div className="flex-shrink-0 mx-4 mt-2 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">{isPlayingAudio ? '🔊' : '🎧'}</span>
          <span className="text-sm text-violet-600 font-medium flex-1">
            {isPlayingAudio ? '正在播放听力...' : '听力已播放完毕'}
          </span>
          <button
            onClick={() => { if (isPlayingAudio) return; setIsPlayingAudio(true); speakEnglish(current.listening_text, () => setIsPlayingAudio(false)) }}
            disabled={isPlayingAudio}
            className={`text-sm px-4 py-2 rounded-full font-bold ${isPlayingAudio ? 'bg-violet-200 text-violet-400 cursor-not-allowed' : 'bg-violet-500 text-white active:bg-violet-600'}`}
          >
            {isPlayingAudio ? '播放中...' : '重新播放'}
          </button>
        </div>
      )}

      {/* 答题区（可独立滚动） */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <EnglishQuestion
          key={current.id}
          question={current}
          onSubmit={handleAnswerSubmit}
          englishTag={englishTag}
        />
      </div>
    </div>
  )
}
