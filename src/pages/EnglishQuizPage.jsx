import { useState, useEffect, useRef, useMemo } from 'react'
import { storage, updateStreak } from '../utils/storage'
import { updateSRS, toQuality } from '../utils/srs'
import { scheduleSession } from '../utils/scheduler'
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

const DEFAULT_SESSION_SIZE = 15

// 各星球每次答题数
const EN_SESSION_SIZES = {
  en_association: 10,
  en_vocab:       10,
  en_listen:      10,
  en_grammar:     10,
  en_reading:     5,
  en_writing:     10,
}

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

// 从 listening_text 中提取纯英文内容（去除中文行，避免英语 TTS 乱读中文）
function extractEnglishForTTS(text) {
  if (!text) return ''
  const chineseRe = /[\u4e00-\u9fff]/
  const lines = text.split('\n')
  const englishLines = lines.filter(line => {
    const stripped = line.trim()
    if (!stripped) return false
    if (chineseRe.test(stripped)) return false
    return true
  })
  return englishLines.join('\n').trim()
}

// 填空题 TTS：把 ______ 替换为实际答案再朗读（不让 TTS 读出"blank"）
function buildListeningTTSText(q) {
  let text = extractEnglishForTTS(q.listening_text || '')
  if (!text) return ''
  const answer = (q.answer || '').trim()
  if (answer) text = text.replace(/_{3,}/g, answer)
  return text
}

// ─── 多子题解析 ────────────────────────────────────────────────────────────

function isMultiPartAnswer(q) {
  const ans = q.answer || ''
  // 排序题（箭头格式）不算多子题，单独处理
  if (/^[A-D]\s*→\s*[A-D]/.test(ans)) return false
  return /\(1\)|\（1\）/.test(ans)
}

// 将题目字符串按 (1)(2)... 或 → 分段
function splitAtNums(str) {
  const results = []
  // 先检测箭头格式 "B → A → C → D"
  if (/→/.test(str)) {
    const items = str.split('→').map(s => s.trim()).filter(Boolean)
    return { preamble: '', parts: items.map((item, i) => ({ num: i + 1, text: item })) }
  }
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
  // "A. small B. large C. new D. old" 格式（选项同行排列）
  const matches = [...text.matchAll(/([A-D])\.\s*(.+?)(?=\s+[A-D]\.\s|$)/g)]
  if (matches.length >= 2) {
    return matches.map(m => ({ letter: m[1], text: m[2].trim() }))
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
      // 去掉选项行，只保留问题干（处理 "A. xxx B. xxx C. xxx D. xxx" 同行格式）
      const optionsLine = part.text.match(/^[A-D]\.\s*.+[A-D]\.\s*.+$/m)
      if (optionsLine) {
        displayText = part.text.replace(optionsLine[0], '').trim()
      } else {
        displayText = part.text.replace(/\b[A-D]\.\s*[^\n]+/g, '').trim()
      }
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

// ─── 连线题组件（左点→右点配对） ──────────────────────────────────────────────
function MatchingQuestion({ q, onSubmit }) {
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [selectedLeft, setSelectedLeft] = useState(null)  // 当前选中的左侧序号
  const [connections, setConnections] = useState({})      // { leftNum: rightLetter }

  // 解析左列（1. xxx  2. xxx）
  const leftItems = useMemo(() => {
    const m = (q.question || '').match(/左列[：:]\s*\n([\s\S]*?)(?=\n右列|$)/)
    if (!m) return []
    return m[1].split('\n')
      .map(l => l.trim())
      .filter(l => /^\d/.test(l))
      .map(l => {
        const idx = l.indexOf('.')
        return { num: l.slice(0, idx).trim(), text: l.slice(idx + 1).trim() }
      })
  }, [q.question])

  // 解析右列（A. xxx  B. xxx）
  const rightItems = useMemo(() => {
    const m = (q.question || '').match(/右列[：:]\s*\n([\s\S]*?)$/)
    if (!m) return []
    return m[1].split('\n')
      .map(l => l.trim())
      .filter(l => /^[A-D]\./.test(l))
      .map(l => {
        const idx = l.indexOf('.')
        return { letter: l.slice(0, idx).trim(), text: l.slice(idx + 1).trim() }
      })
  }, [q.question])

  // 解析正确答案 { '1': 'C', '2': 'D', ... }
  const correctMap = useMemo(() => {
    const map = {}
    const pairs = (q.answer || '').split(/\s+/)
    pairs.forEach(pair => {
      const m = pair.match(/(\d)\s*[-—→]\s*([A-D])/i)
      if (m) map[m[1]] = m[2].toUpperCase()
    })
    return map
  }, [q.answer])

  function handleLeftClick(num) {
    if (submitted) return
    setSelectedLeft(prev => prev === num ? null : num)
  }

  function handleRightClick(letter) {
    if (submitted || !selectedLeft) return
    if (Object.values(connections).includes(letter)) return  // 右项已被占用
    const newConn = { ...connections, [selectedLeft]: letter }
    setConnections(newConn)
    setSelectedLeft(null)
  }

  function handleRemoveConn(num) {
    if (submitted) return
    const newConn = { ...connections }
    delete newConn[num]
    setConnections(newConn)
  }

  function handleSubmit() {
    if (Object.keys(connections).length !== leftItems.length) return
    const correct = leftItems.every(item => connections[item.num] === correctMap[item.num])
    setIsCorrect(correct)
    setSubmitted(true)
  }

  const isConnected = (letter) => Object.values(connections).includes(letter)
  const allConnected = Object.keys(connections).length === leftItems.length

  return (
    <div className="flex flex-col gap-4">
      {/* 题目 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: '#fef3c7', color: '#92400e' }}>连线题</span>
          <button onClick={() => speakEnglish(q.question)}
            className="ml-auto w-7 h-7 flex items-center justify-center bg-sky-100 text-sky-500 rounded-full text-sm">🔊</button>
        </div>
        <p className="text-gray-800 text-sm">将左边词组与右边中文意思连线</p>
      </div>

      {/* 连线区域：左列 | 空白 | 右列 */}
      <div className="flex items-stretch gap-3">
        {/* 左列 */}
        <div className="flex-1 flex flex-col gap-2">
          {leftItems.map((item) => {
            const isSelected = selectedLeft === item.num
            const isDone = !!connections[item.num]
            const isRight = submitted && connections[item.num] === correctMap[item.num]
            const isWrong = submitted && connections[item.num] && connections[item.num] !== correctMap[item.num]
            let cls = 'bg-white border-2 border-gray-200 text-gray-700'
            if (isRight) cls = 'bg-green-50 border-2 border-green-400 text-green-700'
            else if (isWrong) cls = 'bg-red-50 border-2 border-red-400 text-red-600'
            else if (isSelected) cls = 'bg-sky-50 border-2 border-sky-400 text-sky-700'
            else if (isDone) cls = 'bg-indigo-50 border-2 border-indigo-300 text-indigo-700'
            return (
              <button key={item.num} onClick={() => isDone ? handleRemoveConn(item.num) : handleLeftClick(item.num)}
                className={`rounded-xl px-3 py-2.5 text-sm font-medium text-left transition-all active:scale-95 ${cls}`}>
                <span className="font-bold mr-2">{item.num}.</span>{item.text}
                {isDone && <span className="ml-2 text-xs opacity-60">→ {connections[item.num]}</span>}
              </button>
            )
          })}
        </div>

        {/* 中间连接区域 */}
        <div className="w-16 flex flex-col items-center justify-center gap-1 flex-shrink-0">
          {leftItems.map((item) => {
            if (!connections[item.num]) return <div key={item.num} className="h-10 w-4" />
            const rightIdx = rightItems.findIndex(r => r.letter === connections[item.num])
            const leftIdx = leftItems.findIndex(r => r.num === item.num)
            const isRight = submitted && connections[item.num] === correctMap[item.num]
            const isWrong = submitted && connections[item.num] && connections[item.num] !== correctMap[item.num]
            return (
              <div key={item.num} className="h-10 flex items-center">
                <div className={`w-16 h-0.5 ${isWrong ? 'bg-red-400' : isRight ? 'bg-green-400' : 'bg-indigo-300'}`} />
              </div>
            )
          })}
        </div>

        {/* 右列 */}
        <div className="flex-1 flex flex-col gap-2">
          {rightItems.map((item) => {
            const connected = isConnected(item.letter)
            const connectedLeft = Object.entries(connections).find(([,l]) => l === item.letter)?.[0]
            const isRight = submitted && connected && connections[connectedLeft] === correctMap[connectedLeft]
            const isWrong = submitted && connected && connections[connectedLeft] !== correctMap[connectedLeft]
            let cls = 'bg-white border-2 border-gray-200 text-gray-700'
            if (isRight) cls = 'bg-green-50 border-2 border-green-400 text-green-700'
            else if (isWrong) cls = 'bg-red-50 border-2 border-red-400 text-red-600'
            else if (connected) cls = 'bg-indigo-50 border-2 border-indigo-300 text-indigo-700'
            return (
              <button key={item.letter} onClick={() => !submitted && !selectedLeft ? null : selectedLeft ? handleRightClick(item.letter) : null}
                disabled={submitted || (connected && !submitted)}
                className={`rounded-xl px-3 py-2.5 text-sm font-medium text-left transition-all ${connected && !submitted ? 'opacity-60 cursor-not-allowed' : submitted ? 'cursor-default' : 'active:scale-95 cursor-pointer'} ${cls}`}>
                <span className="font-bold mr-2">{item.letter}.</span>{item.text}
                {connected && !submitted && <span className="ml-2 text-xs opacity-60">← {connectedLeft}</span>}
              </button>
            )
          })}
        </div>
      </div>

      {/* 提示 */}
      {!submitted && (
        <div className="text-xs text-gray-400 text-center">
          {selectedLeft ? `已选 ${selectedLeft}，请点击右边对应答案` : '请先点击左边词组，再点击右边中文意思配对'}
        </div>
      )}

      {/* 反馈 */}
      {submitted && (
        <div className={`rounded-2xl p-4 border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className={`font-bold text-base mb-2 ${isCorrect ? 'text-green-700' : 'text-amber-700'}`}>
            {isCorrect ? '✅ 连线全部正确！' : `❌ 连线有误，正确答案已标出`}
          </div>
          {!isCorrect && (
            <div className="space-y-1 mt-2">
              {leftItems.map(item => (
                <div key={item.num} className="text-xs text-gray-600 flex items-center gap-2">
                  <span className="font-semibold">{item.num}. {item.text}</span>
                  <span className="text-gray-400">→</span>
                  <span className={`font-semibold ${connections[item.num] === correctMap[item.num] ? 'text-green-600' : 'text-red-500'}`}>
                    {correctMap[item.num]}. {rightItems.find(r => r.letter === correctMap[item.num])?.text}
                  </span>
                  {connections[item.num] !== correctMap[item.num] && (
                    <span className="text-gray-400">（你的：{connections[item.num]}）</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!submitted && (
        <button onClick={handleSubmit} disabled={!allConnected}
          className={`w-full py-3 rounded-2xl font-bold text-white ${allConnected ? 'bg-gradient-to-r from-indigo-400 to-purple-500 active:scale-95 shadow-md' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
          {allConnected ? '提交答案' : `还需连 ${leftItems.length - Object.keys(connections).length} 条`}
        </button>
      )}

      {submitted && (
        <button onClick={() => onSubmit('matching', isCorrect)}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 text-white font-bold active:scale-95 shadow-md">
          继续下一题 →
        </button>
      )}
    </div>
  )
}

// ─── 模式检测 ──────────────────────────────────────────────────────────────

function detectMode(q) {
  if (q.type === 'open_ended') return 'writing'
  if (isMultiPartAnswer(q)) return 'multi_sub'
  if (q.type === 'true_false') return 'true_false'
  if (/^1-?[A-D]/.test((q.answer || '').replace(/\s/g, ''))) return 'matching'
  if (/^[A-D]\s*→\s*[A-D]/.test(q.answer || '')) return 'ordering'
  if (Array.isArray(q.options) && q.options.length >= 2) return 'choice'
  if (q.type === 'fill_blank' && (q.answer || '').length < 40) return 'text_fill'
  return 'writing'
}

// ─── 判断题（T/F）组件 ──────────────────────────────────────────────────────
function TrueFalseQuestion({ q, onSubmit }) {
  const [submitted, setSubmitted] = useState(false)
  const [selected, setSelected] = useState(null)
  const correctAnswer = (q.answer || '').trim().toUpperCase() // A/B or T/F
  // 将 A/B 映射为 T/F
  const correctTF = correctAnswer === 'A' || correctAnswer === 'T' ? 'T' : 'F'

  function handleTF(val) {
    if (submitted) return
    const isCorrect = val === correctTF
    setSelected(val)
    setIsCorrect(isCorrect)
    setSubmitted(true)
  }
  const [isCorrect, setIsCorrect] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      {/* 题目 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: '#fff7ed', color: '#c2410c' }}>判断题</span>
          <button onClick={() => speakEnglish(q.statement || q.question)}
            className="ml-auto w-7 h-7 flex items-center justify-center bg-sky-100 text-sky-500 rounded-full text-sm">🔊</button>
        </div>
        <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{q.question}</p>
        {/* 判断句子（statement 字段）——用于听力判断题 */}
        {q.statement && (
          <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200">
            <div className="text-[10px] text-amber-600 font-semibold uppercase tracking-wide mb-1">判断句子</div>
            <p className="text-gray-800 text-sm leading-relaxed font-medium">{q.statement}</p>
          </div>
        )}
      </div>

      {/* A/B 按钮（英语判断题用 A=正确 B=错误） */}
      {!submitted && (
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => handleTF('T')}
            className="py-4 rounded-2xl border-2 border-green-200 bg-white font-bold text-base text-green-700 active:scale-95 transition-all">
            A &nbsp; 正确
          </button>
          <button onClick={() => handleTF('F')}
            className="py-4 rounded-2xl border-2 border-red-200 bg-white font-bold text-base text-red-600 active:scale-95 transition-all">
            B &nbsp; 错误
          </button>
        </div>
      )}

      {/* 反馈 */}
      {submitted && (
        <div className={`rounded-2xl p-4 border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className={`font-bold text-base mb-2 ${isCorrect ? 'text-green-700' : 'text-red-600'}`}>
            {isCorrect ? '✅ 回答正确！' : `❌ 正确答案：${correctTF === 'T' ? 'A 正确' : 'B 错误'}`}
          </div>
          {q.analysis && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <div className="text-xs font-semibold text-gray-500 mb-1">💡 解析</div>
              <div className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{q.analysis}</div>
            </div>
          )}
        </div>
      )}

      {submitted && (
        <button onClick={() => onSubmit(selected, isCorrect)}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 text-white font-bold active:scale-95 shadow-md">
          继续下一题 →
        </button>
      )}
    </div>
  )
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

// ─── 排序题组件（听录音排序 A→B→C→D） ─────────────────────────────────────────
function OrderingQuestion({ q, onSubmit }) {
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const correctItems = (q.answer || '').split('→').map(s => s.trim()).filter(Boolean)

  // 从 listening_text 提取选项列表（"A. school  B. park  ..."）
  function extractListeningOptions() {
    const lt = q.listening_text || ''
    // 匹配 "A. xxx  B. xxx" 格式
    const m = lt.match(/([A-D])\.\s*(.+?)(?=\s+[A-D]\.\s|$)/g)
    if (m && m.length >= 2) {
      return m.map(item => {
        const parts = item.match(/([A-D])\.\s*(.+)/)
        return parts ? { letter: parts[1].toUpperCase(), text: parts[2].trim() } : null
      }).filter(Boolean)
    }
    // 匹配 "First, xxx. Then, xxx. After that, xxx." 格式
    const sentences = lt.split(/\.\s+(?=Then|After|Next|Finally|First)/i)
    if (sentences.length >= 2) {
      return sentences.map((s, i) => {
        const clean = s.replace(/^(First|Then|After that|Next|Finally)[,]?\s*/i, '').trim().replace(/\.$/, '')
        return { letter: ['A','B','C','D'][i], text: clean || `第${i+1}项` }
      }).filter(x => x.text && x.text !== `第${0}项`)
    }
    return null
  }

  const listeningOpts = extractListeningOptions()

  // 选项来源优先级：q.options > listening_text提取 > fallback
  let allOptions
  if (Array.isArray(q.options) && q.options.length > 0) {
    allOptions = q.options.map((o, i) => ({
      letter: ['A','B','C','D'][i],
      text: o.replace(/^[A-D]\.\s*/i, '').replace(/的图片描述$/, ''),
    }))
  } else if (listeningOpts && listeningOpts.length === correctItems.length) {
    allOptions = listeningOpts
  } else {
    allOptions = correctItems.map((item, i) => {
      const idx = ['A','B','C','D','a','b','c','d'].indexOf(item)
      return { letter: (idx >= 0 ? item : ['A','B','C','D'][i]).toUpperCase(), text: `选项 ${['A','B','C','D'][i]}` }
    })
  }

  const correctLabels = correctItems.map(item => {
    const found = allOptions.find(o => o.letter === item.toUpperCase())
    return found ? found : { label: item.toUpperCase(), text: item }
  })
  const [order, setOrder] = useState([])

  function handleSelectLabel(label) {
    if (submitted || order.includes(label)) return
    setOrder([...order, label])
  }

  function handleRemoveFromOrder(idx) {
    if (submitted) return
    setOrder(order.filter((_, i) => i !== idx))
  }

  function getLabelText(label) {
    const item = correctLabels.find(c => (c.letter || c.label) === label)
    return item ? (item.text || item.label) : label
  }

  // 统一使用 letter 字段
  const allLabels = allOptions.map(o => o.letter)

  function handleSubmit() {
    if (order.length !== correctLabels.length) return
    const correct = order.every((label, i) => label === (correctLabels[i].letter || correctLabels[i].label))
    setIsCorrect(correct)
    setSubmitted(true)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#ede9fe', color: '#7c3aed' }}>排序题</span>
          <button onClick={() => speakEnglish(q.question)} className="ml-auto w-7 h-7 flex items-center justify-center bg-sky-100 text-sky-500 rounded-full text-sm">🔊</button>
        </div>
        <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{q.question}</p>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="text-xs font-semibold text-gray-500 mb-2">你的排序（按顺序点击下方选项）：</div>
        <div className="flex gap-2 flex-wrap min-h-[40px]">
          {order.length === 0 && <span className="text-xs text-gray-400">点击下方选项开始排序...</span>}
          {order.map((label, i) => (
            <button key={label + '-' + i} onClick={() => handleRemoveFromOrder(i)}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-violet-100 text-violet-700 text-sm font-semibold active:scale-95">
              <span className="text-[10px] bg-violet-200 rounded px-1">{i + 1}</span>
              {label}. {getLabelText(label)}
            </button>
          ))}
        </div>
      </div>

      {!submitted && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="text-xs font-semibold text-gray-500 mb-2">请按听到的顺序选择：</div>
          <div className="grid grid-cols-2 gap-2">
            {allOptions.map(item => {
              const lbl = item.letter || item.label
              return (
              <button key={lbl} onClick={() => handleSelectLabel(lbl)}
                disabled={order.includes(lbl)}
                className={`py-3 px-3 rounded-xl border-2 text-sm font-medium text-left transition-all active:scale-95
                  ${order.includes(lbl) ? 'bg-gray-100 border-gray-200 text-gray-400 line-through' : 'bg-white border-gray-200 text-gray-700'}`}>
                {lbl}. {item.text}
              </button>
              )
            })}
          </div>
        </div>
      )}

      {!submitted && order.length === correctLabels.length && (
        <button onClick={handleSubmit}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold active:scale-95 shadow-md">
          提交排序
        </button>
      )}

      {submitted && (
        <div className={`rounded-2xl p-4 border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className={`font-bold text-base mb-2 ${isCorrect ? 'text-green-700' : 'text-red-600'}`}>
            {isCorrect ? '✅ 排序正确！' : `❌ 正确顺序：${correctLabels.map(c => c.letter || c.label).join(' → ')}`}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            正确顺序：{correctLabels.map((c, i) => <span key={c.letter || c.label} className="inline-flex items-center gap-1 mr-2">
              <span className="bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded font-bold">{i + 1}</span>
              {c.letter || c.label}. {c.text}
              {i < correctLabels.length - 1 && <span className="text-gray-400 ml-1">→</span>}
            </span>)}
          </div>
        </div>
      )}

      {submitted && (
        <button onClick={() => onSubmit(order.join(' → '), isCorrect)}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 text-white font-bold active:scale-95 shadow-md">
          继续下一题 →
        </button>
      )}
    </div>
  )
}

// ─── 英语题目通用组件 ──────────────────────────────────────────────────────

const TYPE_LABEL = { multiple_choice: '选择题', fill_blank: '填空题', open_ended: '写作题', true_false: '判断题' }
const TYPE_COLOR = {
  multiple_choice: { bg: '#e0f2fe', text: '#0369a1' },
  fill_blank:      { bg: '#f0fdf4', text: '#15803d' },
  open_ended:      { bg: '#fdf4ff', text: '#7e22ce' },
  true_false:      { bg: '#fff7ed', text: '#c2410c' },
}

function EnglishQuestion({ question: q, onSubmit, englishTag }) {
  const mode = detectMode(q)

  // 多子题分页 → 独立组件
  if (mode === 'multi_sub') return <MultiSubQuiz question={q} onSubmit={onSubmit} englishTag={englishTag} />
  // 连线题 → 独立组件
  if (mode === 'matching') return <MatchingQuestion q={q} onSubmit={onSubmit} />
  // 写作 → 独立组件
  if (mode === 'writing') return <SimpleWritingInput q={q} onSubmit={onSubmit} englishTag={englishTag} />
  // 排序题 → 独立组件
  if (mode === 'ordering') return <OrderingQuestion q={q} onSubmit={onSubmit} />

  // ── 判断题（T/F）──
  if (mode === 'true_false') {
    return <TrueFalseQuestion q={q} onSubmit={onSubmit} />
  }

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
        <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{
          __html: q.question.replace(/<u>(.*?)<\/u>/g, '<u style="text-decoration:underline;text-decoration-style:wavy;text-decoration-color:#ef4444;text-underline-offset:3px;font-weight:600">$1</u>')
        }}></p>
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
                {opt.replace(/^[A-D]\.\s*/i, '').replace(/的图片描述$/, '')}
              </button>
            )
          })}
        </div>
      )}

      {/* 填空题 */}
      {mode === 'text_fill' && !submitted && (
        <div className="flex flex-col gap-3">
          {/* 如果有 listening_text 且含 ______，显示上下文提示 */}
          {(q.listening_text || '').includes('______') && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 leading-relaxed">
              <div className="font-semibold text-amber-700 mb-1">📖 听力原文（听录音后填写空格）：</div>
              <div className="whitespace-pre-wrap font-mono" dangerouslySetInnerHTML={{
                __html: (q.listening_text || '')
                  .replace(/_{3,}/g, '<span class="inline-block min-w-[60px] border-b-2 border-dashed border-amber-400 mx-1 text-center text-amber-500 font-bold">______</span>')
              }}></div>
            </div>
          )}
          <input type="text" value={textInput} onChange={e => setTextInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && textInput.trim() && handleTextSubmit()}
            placeholder={q.analysis ? '在此输入答案...' : '听录音后在此输入答案...'}
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

  const sessionSize = EN_SESSION_SIZES[englishTag] || DEFAULT_SESSION_SIZE

  const questions = useMemo(() => {
    const questionMap = grade === 'junior2' ? J2_QUESTION_MAP : EN_QUESTION_MAP
    const pool = questionMap[englishTag] || enVocabQ
    const seenToday = new Set(storage.getSeenToday(user.id))
    return scheduleSession(pool, srsStates.current, sessionSize, null, false, seenToday)
  }, [englishTag, grade, sessionSize])

  const [index, setIndex] = useState(0)
  const [sessionRecords, setSessionRecords] = useState([])
  const [xpGained, setXpGained] = useState(0)
  const [isPlayingAudio, setIsPlayingAudio] = useState(false)

  const current = questions[index]

  useEffect(() => { questionStartTime.current = Date.now() }, [index])

  useEffect(() => {
    if (current?.listening_text) {
      const ttsText = buildListeningTTSText(current)
      if (ttsText) {
        setIsPlayingAudio(true)
        speakEnglish(ttsText, () => setIsPlayingAudio(false))
      } else {
        setIsPlayingAudio(false)
      }
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
        // 标记星球完成（只有做完才算打卡）
        if (current?.knowledge_tag) storage.markPlanetComplete(user.id, current.knowledge_tag)
        updateStreak(user.id)
        // 今日已见：记录本 session 所有题 id，下次选题自动排到最后
        storage.markSeenToday(user.id, questions.map(q => q.id))
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
            onClick={() => { if (isPlayingAudio) return; setIsPlayingAudio(true); speakEnglish(buildListeningTTSText(current), () => setIsPlayingAudio(false)) }}
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
