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
import j2ClozeQ from '../data/questions_en_j2_cloze.json'

const DEFAULT_SESSION_SIZE = 15

// 各星球每次答题数
const EN_SESSION_SIZES = {
  en_association: 10,
  en_vocab:       10,
  en_listen:      10,
  en_grammar:     10,
  en_reading:     5,
  en_writing:     10,
  en_cloze:       3,   // 完形填空：每篇10空，3篇=30小题
}

// 星球ID → 今日已练标记用的规范Tag（与 EnglishHomePage.TAG_TO_PLANET 对应）
const EN_PLANET_CANONICAL_TAG = {
  en_vocab:      '英语词汇',
  en_listen:     '英语听力',
  en_grammar:    '英语语法',
  en_reading:    '英语阅读',
  en_writing:    '英语写作',
  en_cloze:      '完形填空',
  en_association: '联想星球',       // 兜底（通常走AssociationPlanetPage单独路径）
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
  en_cloze:   j2ClozeQ,
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
// 同时过滤掉 ABCD 选项行和中文说明行，避免把答案选项读出来（Bug #1）
// 排序题特殊处理：只读引导语，不读暴露顺序的事件描述（Bug #4）
function buildListeningTTSText(q) {
  let text = extractEnglishForTTS(q.listening_text || '')
  if (!text) return ''
  
  // ★ 排序题检测：如果答案是箭头格式（B → A → C → D），说明是排序题
  const isOrdering = /^[A-D]\s*→\s*[A-D]/.test((q.answer || '').trim())
  if (isOrdering) {
    // 排序题只保留引导性短句，去掉暴露顺序的 First/Then/After 句子
    const lines = text.split('\n').filter(line => {
      const stripped = line.trim()
      if (!stripped) return false
      // 去掉 First/Then/After/Finally/Next 开头的句子（这些泄露顺序）
      if (/^(First|Then|After|Finally|Next)[,\s]/i.test(stripped)) return false
      // 去掉 A.B.C.D. 选项行
      if (/^[A-D]\.\s/.test(stripped)) return false
      return true
    }).join('\n').trim()
    // 如果过滤后没有内容了（整篇都是事件描述），返回提示语让用户听原文
    if (!lines) {
      return 'Listen to the recording and put the events in the correct order.'
    }
    return lines
  }
  
  // 非排序题：过滤 A.B.C.D. 选项行和中文说明行
  const filteredLines = text.split('\n').filter(line => {
    const stripped = line.trim()
    if (!stripped) return false
    // 去掉以 A. B. C. D. 开头的选项行
    if (/^[A-D]\.\s/.test(stripped)) return false
    return true
  }).join('\n').trim()
  
  const answer = (q.answer || '').trim()
  if (answer) text = filteredLines.replace(/_{3,}/g, answer)
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
  // 模式1: "A. small B. large C. new D. old" 格式（选项同行排列）
  const matches = [...text.matchAll(/([A-D])\.\s*(.+?)(?=\s+[A-D]\.\s|$)/g)]
  if (matches.length >= 2) {
    return matches.map(m => ({ letter: m[1], text: m[2].trim() }))
  }
  
  // 模式2: 多行选项（每行一个）
    // A. listen to
    // B. look at
    // ...
  const lineMatches = [...text.matchAll(/^([A-D])\.\s*(.+)$/gm)]
  if (lineMatches.length >= 2) {
    return lineMatches.map(m => ({ letter: m[1], text: m[2].trim() }))
  }
  
  return null
}

// 从题干(preamble)中提取前置选项（用于"先给选项再填空"的题型）
function extractPreambleOptions(preamble) {
  if (!preamble) return null
  // 检查 preamble 是否包含 A.B.C.D. 格式的选项列表
  const opts = extractInlineOptions(preamble)
  if (opts && opts.length >= 2) return opts
  
  // 检查括号内选项: (opt1 / opt2 / opt3 / opt4)
  const parenMatch = preamble.match(/\(([^)]+)\)/)
  if (parenMatch) {
    const items = parenMatch[1].split('/').map(s => s.trim()).filter(Boolean)
    if (items.length >= 2) {
      return items.slice(0, 4).map((t, i) => ({
        letter: ['A','B','C','D'][i],
        text: t
      }))
    }
  }
  
  return null
}

function parseSubParts(q) {
  const { preamble: passage, parts: qParts } = splitAtNums(q.question || '')
  const { parts: aParts } = splitAtNums(q.answer || '')
  const answerMap = Object.fromEntries(aParts.map(p => [p.num, p.text]))

  // 预先提取preamble中的选项（供所有子题复用）
  const preambleOptions = extractPreambleOptions(passage) || (q.options && q.options.length >= 2 ? 
    q.options.map((o, i) => ({ letter: ['A','B','C','D'][i], text: o.replace(/^[A-D]\.\s*/i, '').trim() })) : null)

  const subQuestions = qParts.map(part => {
    const rawAnswer = (answerMap[part.num] || '').trim()

    let type = 'text'
    let options = null
    let displayText = part.text

    // 清理答案：去掉可能的题号前缀如 "1-B" → "B"
    let cleanAnswer = rawAnswer.replace(/^[\d\s\-]+([A-Da-d]).*$/i, '$1').trim()

    if (/^[TtFf]$/.test(cleanAnswer)) {
      type = 'tf'
      displayText = part.text.replace(/\s*[（(][　\s]*[）)]/g, '').trim()
    } else if (/^[A-Da-d]$/.test(cleanAnswer)) {
      type = 'choice'
      options = extractInlineOptions(part.text)
      if (!options && preambleOptions) {
        options = preambleOptions
      }
      if (!options && q.options && q.options.length >= 2) {
        options = q.options.map((o, i) => ({
          letter: ['A','B','C','D'][i],
          text: o.replace(/^[A-D]\.\s*/i, '').trim(),
        }))
      }
      // 去掉所有选项行（统一处理单行/多行选项）
      displayText = part.text
        .split('\n')
        .filter(line => !/^[A-D]\.\s/.test(line.trim()))
        .join('\n')
        .trim()
    } else if (/^[A-Da-d]$/.test(rawAnswer.charAt(0)) && preambleOptions) {
      // 答案以字母开头且preamble有选项 → 当选择题处理
      type = 'choice'
      options = preambleOptions
      cleanAnswer = rawAnswer.charAt(0).toUpperCase()
    }

    // ★ 关键修复：text类型但有preamble选项 → 提升为选择题（截图#3的bug）
    if (type === 'text' && preambleOptions && preambleOptions.length >= 2) {
      // 检查答案是否匹配某个选项的字母或内容
      const answerUpper = rawAnswer.toUpperCase().trim()
      const matchedLetter = preambleOptions.find(o => o.letter === answerUpper || o.text.toUpperCase() === answerUpper)
      if (matchedLetter || /^[A-D]$/.test(answerUpper)) {
        type = 'choice'
        options = preambleOptions
        cleanAnswer = matchedLetter ? matchedLetter.letter : answerUpper
      }
    }

    return {
      num: part.num,
      displayText,
      rawAnswer: cleanAnswer || rawAnswer,
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
          <div className="bg-white rounded-2xl px-4 py-3 shadow-sm max-h-56 overflow-y-auto">
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
        <div className="bg-white rounded-2xl px-4 py-3 shadow-sm max-h-64 overflow-y-auto">
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
        <p 
          className="text-gray-800 text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: current.displayText }}
        />
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

      {/* 文本输入（单词填空 — 自动批改模式） */}
      {current.type === 'text' && !submitted && (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && textInput.trim() && handleText()}
            placeholder="输入答案..."
            className="border-2 border-gray-200 rounded-xl px-4 py-3 text-sm font-mono font-bold text-center focus:border-sky-400 outline-none bg-white"
            autoFocus
            autoComplete="off" autoCorrect="off" spellCheck="false"
            inputMode="text"
          />
          <button
            onClick={handleText}
            disabled={!textInput.trim()}
            className="bg-sky-500 disabled:bg-gray-200 text-white font-bold py-3 rounded-xl active:scale-95"
          >
            提交答案
          </button>
        </div>
      )}

      {/* 文本输入 — 答案反馈（自动批改结果） */}
      {current.type === 'text' && submitted && (
        <div className="flex flex-col gap-2">
          <div className={`rounded-xl p-3 border ${currentCorrect ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
            <div className={`text-xs font-semibold mb-1 ${currentCorrect ? 'text-green-600' : 'text-red-500'}`}>
              {currentCorrect ? '✅ 回答正确！' : '❌ 答错了'}
            </div>
            {!currentCorrect && (
              <>
                <div className="text-xs text-gray-400 mt-1">你的答案</div>
                <div className="text-sm font-medium text-gray-600 line-through">{textInput}</div>
                <div className="text-xs text-green-600 font-semibold mt-2">正确答案</div>
                <div className="text-sm font-bold text-green-700">{current.rawAnswer}</div>
              </>
            )}
          </div>
          <button
            onClick={advance}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-400 to-blue-500 text-white font-bold active:scale-95"
          >
            下一题 →
          </button>
        </div>
      )}

      {/* 答题反馈 + 下一题 */}
      {submitted && (current.type !== 'text' || currentCorrect) && (
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
  // 兼容多种格式：1-A、1—B、1-A（空格分隔）
  const correctMap = useMemo(() => {
    const map = {}
    // 先尝试按空格分割成 "1-C"、"2-D" 等独立配对
    const pairs = (q.answer || '').split(/\s+/).filter(Boolean)
    pairs.forEach(pair => {
      // 匹配 1-A / 1—B / 1→C / 1－C 等各种分隔符
      const m = pair.match(/(\d)\s*[-—→－]\s*([A-D])/i)
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

/**
 * 从 question 文本中提取内联的 ABCD 选项（兼容非标准题库数据）
 * 支持格式：
 *   "(1) Q? A.xxx B.xxx C.xxx D.xxx"  （多子题内联）
 *   "A. xxx B. xxx C. xxx D. xxx"        （同行排列）
 *   "A) xxx\nB) xxx\nC) xxx\nD) xxx"     （分行排列）
 */
function extractInlineChoices(text) {
  if (!text) return null
  // 格式1：同行 "A. xxx B. xxx C. xxx D. xxx"
  const inlineMatch = text.match(/([A-D])[.、)]\s*(.+?)\s+(?=[A-D][.、)]\s)/gs)
  if (inlineMatch && inlineMatch.length >= 2) {
    const opts = inlineMatch.map(m => {
      const p = m.match(/([A-D])[.、)]\s*(.+)/s)
      return p ? { letter: p[1].toUpperCase(), text: p[2].trim() } : null
    }).filter(Boolean)
    if (opts.length >= 2) return opts
  }
  // 格式2：每行一个选项
  const lineMatches = [...text.matchAll(/^([A-D])[.、)]\s*(.+)$/gm)]
  if (lineMatches.length >= 2) {
    return lineMatches.map(m => ({ letter: m[1].toUpperCase(), text: m[2].trim() }))
  }
  // 格式3：从多子题的每个子题中提取最后一段ABCD行
  // 如 "(1) Where is he?\nA. home B. office C. school D. park"
  const subMatches = [...text.matchAll(/\((\d+)\)[^A-D]*?\n\s*([A-D][.\s]*[^(\n]+\n?[A-D][.\s]*[^(\n]*\n?[A-D][.\s]*[^(\n]*\n?[A-D][.\s]*[^\n(]*)/g)]
  if (subMatches.length > 0) {
    // 这种情况由 MultiSubQuiz 内部的 extractInlineOptions 处理，这里不重复处理
  }
  return null
}

/** 从 question 中提取纯文章正文（去掉末尾所有子题+选项） */
function extractPassageOnly(questionText) {
  if (!questionText) return questionText
  // 去掉末尾的所有 (n)... 子题块（含其中的ABCD选项）
  const reBlock = /[\s\n]*\(\d+\)[^\n]*(?:[\s\n]+[A-D][.、)\]]+[^\n]*)*/g
  let cleaned = questionText.replace(reBlock, '').trim()
  // 去掉残留的多余空行
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim()
  return cleaned || questionText
}

function detectMode(q) {
  if (q.type === 'open_ended') return 'writing'
  // 完形填空 → 走专门的ClozeQuestion组件（有__(1)__空格+ABCD选项）
  if (q.type === 'cloze') return 'cloze'
  if (isMultiPartAnswer(q)) return 'multi_sub'
  if (q.type === 'true_false') return 'true_false'
  if (/^1[-—\s]+[A-D]/.test((q.answer || '').replace(/\s/g, ''))) return 'matching'
  // 兼容 "1-A 2-B" 和 "1—B 2—C" 等多种分隔符格式
  if (/^[1-9][-—\s]+[A-D]/.test(q.answer || '')) return 'matching'
  if (/^[A-E]\s*→\s*[A-E]/.test(q.answer || '')) return 'ordering'  // A-E 支持5项排序（阅读排序题）
  // 标准options数组存在 → 选择题
  if (Array.isArray(q.options) && q.options.length >= 2) return 'choice'
  // 兜底：options为空但question文本中含有可提取的ABCD选项 → 也走选择题模式
  if ((!q.options || q.options.length === 0) && extractInlineChoices(q.question)) {
    return 'inline_choice'  // 用特殊标记区分标准choice和内联提取
  }
  if (q.type === 'fill_blank' && (q.answer || '').length < 40) return 'text_fill'
  return 'writing'
}

// ─── 完形填空组件 ──────────────────────────────────────────────────────────
function ClozeQuestion({ q, onSubmit }) {
  const [step, setStep] = useState(0)
  const [results, setResults] = useState([])
  const [submitted, setSubmitted] = useState(false)
  const [currentCorrect, setCurrentCorrect] = useState(false)

  // 解析options: 每个格式为 "(1) A.xxx B.xxx C.xxx D.xxx"
  const clozeOptions = useMemo(() => {
    return (q.options || []).map((optStr, idx) => {
      const matches = [...optStr.matchAll(/([A-D])\.\s*(.+?)(?=\s*[A-D]\.\s|$)/g)]
      const opts = matches.map(m => ({ letter: m[1], text: m[2].trim() }))
      // Extract number from "(1)" prefix
      const numMatch = optStr.match(/\((\d+)\)/)
      return { num: numMatch ? parseInt(numMatch[1]) : idx + 1, opts }
    })
  }, [q.options])

  // Parse answer string "1.A 2.C 3.B..." → { 1:'A', 2:'C', ... }
  const answerMap = useMemo(() => {
    const map = {}
    ;(q.answer || '').split(/\s+/).forEach(pair => {
      const m = pair.match(/(\d+)\.([A-D])/i)
      if (m) map[m[1]] = m[2].toUpperCase()
    })
    return map
  }, [q.answer])

  // Show passage with highlighted current blank
  const passageHtml = useMemo(() => {
    let text = q.question || ''
    // Highlight current blank number
    if (clozeOptions.length > 0 && step < clozeOptions.length) {
      const curNum = clozeOptions[step].num
      text = text.replace(new RegExp(`__\\(${curNum}\\)__`, 'g'), `<span style="color:#0369a1;font-weight:bold;background:#e0f2fe;padding:0 4px;border-radius:4px">__(${curNum})__</span>`)
      // Dim other blanks
      text = text.replace(/__\((\d+)__/g, (match, n) => {
        if (parseInt(n) === curNum) return match
        return `<span style="color:#9ca3af">__(${n})__</span>`
      })
    }
    return text
  }, [q.question, step, clozeOptions])

  function handleSelect(letter) {
    if (submitted) return
    const correct = letter.toUpperCase() === (answerMap[clozeOptions[step]?.num] || '')
    setCurrentCorrect(correct)
    setSubmitted(true)
  }

  function advance() {
    const next = [...results, { correct: currentCorrect }]
    setResults(next)
    if (next.length < clozeOptions.length) {
      setStep(s => s + 1)
      setSubmitted(false)
      setCurrentCorrect(false)
    }
  }

  // Done - show results
  if (results.length >= clozeOptions.length && clozeOptions.length > 0) {
    const correct = results.filter(r => r.correct).length
    const total = clozeOptions.length
    const pct = Math.round(correct / total * 100)
    return (
      <div className="flex flex-col gap-4">
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
        <button onClick={() => onSubmit('', pct >= 60)}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 text-white font-bold active:scale-95 transition-transform shadow-md">
          继续下一题 →
        </button>
      </div>
    )
  }

  const currentOpts = clozeOptions[step]

  return (
    <div className="flex flex-col gap-3">
      {/* 文章（可滚动） */}
      <div className="bg-white rounded-2xl px-4 py-3 shadow-sm max-h-56 overflow-y-auto">
        <div className="text-[10px] text-gray-400 font-semibold mb-1 uppercase tracking-wide">阅读材料</div>
        <p className="text-gray-700 text-xs leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: passageHtml }} />
      </div>

      {/* 进度 */}
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
          <div className="bg-sky-400 h-1.5 rounded-full transition-all" style={{ width: `${step / clozeOptions.length * 100}%` }}/>
        </div>
        <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
          第 {step + 1} / {clozeOptions.length} 空
        </span>
      </div>

      {/* 当前空题号 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="text-xs font-bold text-sky-500 mb-2">（{currentOpts?.num}）选择正确选项填入文中</div>
      </div>

      {/* ABCD选项 */}
      {!submitted && currentOpts?.opts && (
        <div className="flex flex-col gap-2">
          {currentOpts.opts.map(opt => (
            <button key={opt.letter} onClick={() => handleSelect(opt.letter)}
              className="rounded-2xl border-2 border-gray-200 bg-white px-4 py-3 text-sm text-left font-medium active:scale-95 transition-all">
              <span className="mr-2 text-xs font-bold text-gray-400">{opt.letter}.</span>{opt.text}
            </button>
          ))}
        </div>
      )}

      {/* 答后状态 */}
      {submitted && currentOpts?.opts && (
        <>
          <div className="grid grid-cols-2 gap-2">
            {currentOpts.opts.map(opt => {
              const isCorrect = opt.letter.toUpperCase() === (answerMap[currentOpts?.num] || '')
              const wasWrong = !currentCorrect && opt.letter.toUpperCase() !== (answerMap[currentOpts?.num] || '')
              let cls = 'border-gray-200 bg-white text-gray-400'
              if (isCorrect) cls = 'border-green-400 bg-green-50 text-green-700'
              else if (!isCorrect && !wasWrong) cls = 'border-gray-200 bg-white text-gray-300'
              else cls = 'border-red-300 bg-red-50 text-red-500 opacity-40'
              return (
                <div key={opt.letter} className={`rounded-xl border-2 px-3 py-2.5 text-sm font-medium ${cls}`}>
                  <span className="mr-1 text-xs font-bold">{opt.letter}.</span>{opt.text}
                </div>
              )
            })}
          </div>
          <div className={`rounded-2xl px-4 py-3 border font-semibold text-sm ${currentCorrect ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
            {currentCorrect ? '✅ 正确！' : `❌ 正确答案：${answerMap[currentOpts?.num]}`}
          </div>
          <button onClick={advance}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-bold active:scale-95 transition-transform shadow-md">
            {results.length + 1 >= clozeOptions.length ? '查看得分 →' : '下一空 →'}
          </button>
        </>
      )}
    </div>
  )
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
    // 匹配 "First, xxx. Then, xxx. After that, xxx." 格式（句子级提取）
    const sentences = lt.split(/\.\s+(?=Then|After|Next|Finally|First|For\s\w+|In\s+(the\s)?(morning|afternoon|evening)|And\s)/i)
    if (sentences.length >= 2) {
      return sentences.map((s, i) => {
        const clean = s.replace(/^(First|Then|After that|Next|Finally)[,]?\s*/i, '').trim().replace(/\.$/, '')
        return { letter: ['A','B','C','D'][i], text: clean || `第${i+1}项` }
      }).filter(x => x.text && x.text !== `第${0}项`)
    }
    return null
  }

  const listeningOpts = extractListeningOptions()

  // ★ 增强版：从 listening_text 中逐句提取事件描述（用于没有显式ABCD选项的排序题）
  function extractEventDescriptionsFromText(text) {
    if (!text) return null
    // 按句号分割，过滤太短或太长的行
    const sentences = text.split('.').map(s => s.trim()).filter(s => s.length > 5 && s.length < 120)
    if (sentences.length >= 2) {
      return sentences.slice(0, 5).map((s, i) => ({
        letter: ['A', 'B', 'C', 'D', 'E'][i],
        text: s.replace(/^(First|Then|After that|Next|Finally|For\b|In the|In\s|And)[,\s]*/i, '').trim(),
      }))
    }
    return null
  }

  // 从 question 文本中提取多行选项（阅读排序题：每行一个 "A. xxx"，支持 A-E）
  function extractFromQuestionText(text) {
    const opts = []
    for (const line of (text || '').split('\n')) {
      const m = line.trim().match(/^([A-E])\.\s+(.+)/)
      if (m) opts.push({ letter: m[1].toUpperCase(), text: m[2].trim() })
    }
    return opts.length >= 2 ? opts : null
  }

  // 选项来源优先级：q.options > listening_text显式ABCD > listening_text句子提取 > question文本 > fallback
  const questionTextOpts = extractFromQuestionText(q.question)
  const eventDescOpts = extractEventDescriptionsFromText(q.listening_text || '')
  let allOptions
  if (Array.isArray(q.options) && q.options.length > 0) {
    allOptions = q.options.map((o, i) => ({
      letter: ['A','B','C','D','E'][i],
      text: o.replace(/^[A-E]\.\s*/i, '').replace(/的图片描述$/, ''),
    }))
  } else if (listeningOpts && listeningOpts.length === correctItems.length) {
    allOptions = listeningOpts
  } else if (eventDescOpts && eventDescOpts.length >= correctItems.length) {
    // ★ 新增：从听力原文中提取事件描述作为可读选项
    allOptions = eventDescOpts.slice(0, correctItems.length)
  } else if (questionTextOpts && questionTextOpts.length === correctItems.length) {
    allOptions = questionTextOpts
  } else {
    allOptions = correctItems.map((item) => {
      const found = questionTextOpts?.find(o => o.letter === item.toUpperCase())
      return found || { letter: item.toUpperCase(), text: `选项 ${item.toUpperCase()}` }
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

  // 将 question 文本分为「指令+文章」和「事件列表」两部分
  const passageText = (q.question || '').split('\n').filter(line => !/^[A-E]\.\s/.test(line.trim())).join('\n').trim()

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#ede9fe', color: '#7c3aed' }}>排序题</span>
          <button onClick={() => speakEnglish(passageText)} className="ml-auto w-7 h-7 flex items-center justify-center bg-sky-100 text-sky-500 rounded-full text-sm">🔊</button>
        </div>
        <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{passageText}</p>
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
          <div className="text-xs font-semibold text-gray-500 mb-2">按正确顺序点击下方选项（再次点击可撤销）：</div>
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
  // 完形填空 → 独立组件
  if (mode === 'cloze') return <ClozeQuestion q={q} onSubmit={onSubmit} />
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

  // ── 内联选择题（options为空但从question文本中提取出选项）──
  if (mode === 'inline_choice') {
    const [selected, setSelected] = useState(null)
    const [submitted, setSubmitted] = useState(false)
    const [isCorrect, setIsCorrect] = useState(false)
    // 提取文章正文（去掉末尾子题选项）和内联选项
    const passageText = useMemo(() => extractPassageOnly(q.question), [q.question])
    const inlineOpts = useMemo(() => extractInlineChoices(q.question), [q.question])
    
    function handleSelect(opt) {
      if (submitted) return
      const correct = opt.letter.toUpperCase() === (q.answer || '').trim().toUpperCase()
        || (/\(\d+\)\s*[A-D]/.test(q.answer || '') && false) // 多子题答案格式在此不适用
      // 对于多子题格式的单题显示，尝试从answer中找对应选项
      let isThisCorrect = false
      const ansStr = (q.answer || '').trim()
      if (/^[A-D]$/.test(ansStr)) {
        isThisCorrect = opt.letter.toUpperCase() === ansStr.toUpperCase()
      } else if (/\([A-D]\)/.test(ansStr)) {
        // "(B)" 格式
        isThisCorrect = opt.letter.toUpperCase() === ansStr.match(/\(([A-D])\)/)?.[1]?.toUpperCase()
      } else {
        // 尝试从 answer 字符串中查找该字母
        isThisCorrect = ansStr.toUpperCase().includes(opt.letter.toUpperCase())
      }
      setSelected(opt); setIsCorrect(isThisCorrect); setSubmitted(true)
    }

    const feedbackBg = isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'

    return (
      <div className="flex flex-col gap-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: '#eff6ff', color: '#1d4ed8' }}>阅读理解</span>
            <button onClick={() => speakEnglish(passageText)}
              className="ml-auto w-7 h-7 flex items-center justify-center bg-sky-100 text-sky-500 rounded-full text-sm">🔊</button>
          </div>
          <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{passageText}</p>
        </div>

        {/* 内联提取的选项 */}
        {inlineOpts && inlineOpts.length > 0 && (
          <div className="flex flex-col gap-2">
            {inlineOpts.map((opt) => {
              let cls = 'bg-white border-gray-200 text-gray-700'
              if (submitted) {
                // 从answer中判断正确性
                let optIsCorrect = false
                const ansStr = (q.answer || '').trim()
                if (/^[A-D]$/.test(ansStr)) {
                  optIsCorrect = opt.letter.toUpperCase() === ansStr.toUpperCase()
                } else {
                  optIsCorrect = ansStr.toUpperCase().includes(opt.letter.toUpperCase())
                }
                if (optIsCorrect) cls = 'bg-green-50 border-green-400 text-green-700'
                else if (opt === selected) cls = 'bg-red-50 border-red-400 text-red-600'
                else cls = 'bg-white border-gray-100 text-gray-300'
              }
              return (
                <button key={opt.letter} onClick={() => handleSelect(opt)} disabled={submitted}
                  className={`rounded-2xl border-2 px-4 py-3 text-sm font-medium text-left transition-all active:scale-95 ${cls}`}>
                  <span className="mr-2 text-xs font-bold opacity-40">{opt.letter}.</span>
                  {opt.text}
                </button>
              )
            })}
          </div>
        )}

        {submitted && (
          <div className={`rounded-2xl p-4 border ${feedbackBg}`}>
            <div className={`font-bold text-base mb-2 ${isCorrect ? 'text-green-700' : 'text-red-600'}`}>
              {isCorrect ? '✅ 回答正确！' : `❌ 正确答案：${(q.answer || '').trim()}`}
            </div>
            {q.analysis && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <div className="text-xs font-semibold text-gray-500 mb-1">💡 解析 &amp; 翻译</div>
                <div className="text-xs text-gray-600 whitespace-pre-wrap leading-relaxed">{q.analysis}</div>
              </div>
            )}
          </div>
        )}
        {submitted && (
          <button onClick={() => onSubmit(selected?.letter || '', isCorrect)}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 text-white font-bold active:scale-95 transition-transform shadow-md">
            继续下一题 →
          </button>
        )}
      </div>
    )
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
          __html: q.question.replace(/<u>(.*?)<\/u>/g, 
            '<span style="color:#dc2626;font-weight:bold;border-bottom:3px solid #ef4444;text-underline-offset:2px;position:relative;padding:0 1px;">$1</span>')
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
        // 标记星球完成（至少答5题且完成全部，才算打卡）
        const completedTag = EN_PLANET_CANONICAL_TAG[englishTag] || current?.knowledge_tag
        if (completedTag && allRecords.length >= 5) {
          storage.markPlanetComplete(user.id, completedTag)
        }
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
    en_cloze: '完形填空 📝',
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
