import { useState, useRef, useMemo } from 'react'
import { storage, updateStreak } from '../utils/storage'
import { updateSRS, toQuality } from '../utils/srs'
import { syncAfterSession } from '../utils/sync'
import tips from '../data/reading_tips.json'
import readingQ from '../data/questions_reading.json'
import DuolingoStyleQuiz from '../components/DuolingoStyleQuiz'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// 关键词评分
function smartGrade(userAnswer, correctAnswer) {
  if (!userAnswer?.trim()) return { correct: false, score: 0 }
  const ua = userAnswer.trim()
  const ca = correctAnswer.trim()
  if (ua === ca) return { correct: true, score: 100 }
  const keywords = ca.split(/[，。、；：\s]+/).filter(w => w.length > 1)
  if (keywords.length === 0) return { correct: ua.length > 0, score: 60 }
  const matched = keywords.filter(kw => ua.includes(kw)).length
  const rate = matched / keywords.length
  return { correct: rate >= 0.6, score: Math.round(rate * 100) }
}

// 从题目文本分离"原文段落"和"子题列表"
function parsePassageAndSubQs(questionText) {
  const firstSubIdx = questionText.search(/（[1-9]）/)
  if (firstSubIdx < 0) return { passage: questionText, subQs: [] }
  const passage = questionText.slice(0, firstSubIdx).trim()
  const rest = questionText.slice(firstSubIdx)
  const subQs = []
  const matches = [...rest.matchAll(/（([1-9])）([\s\S]*?)(?=（[1-9]）|$)/g)]
  for (const m of matches) {
    subQs.push({ num: parseInt(m[1]), text: m[2].trim() })
  }
  return { passage, subQs }
}

// 从答案文本解析子题答案 （1）xxx\n（2）xxx → [{num, text}]
function parseSubAnswers(answerText) {
  if (!answerText) return []
  const results = []
  const matches = [...answerText.matchAll(/（([1-9])）([\s\S]*?)(?=（[1-9]）|$)/g)]
  if (matches.length === 0) return [{ num: 1, text: answerText.trim() }]
  for (const m of matches) {
    results.push({ num: parseInt(m[1]), text: m[2].trim() })
  }
  return results
}

// 检测子题是否为词义填空格式（如 "①度：___" 或 "度：____"）
function isVocabFill(subQText) {
  return /：\s*_{2,}|：\s*（\s*　?\s*）/.test(subQText)
}

// 从子题答案中提取词义选项 "度：量（动词）；操：拿；" → [{word:'度', meaning:'量（动词）'}, ...]
function parseVocabItems(subAnsText) {
  const items = []
  for (const m of subAnsText.matchAll(/([①-⑨]?)([^；：\n①-⑨]+)：([^；\n]+)/g)) {
    items.push({ word: m[2].trim(), meaning: m[3].trim() })
  }
  return items
}

// ─── 底部反馈面板 ─────────────────────────────────────────
function FeedbackPanel({ correct, analysis, answer, onContinue, label }) {
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
            <span className="text-xs text-gray-500">参考答案：</span>
            <span className="text-sm font-semibold text-gray-800 ml-1 whitespace-pre-wrap">{answer}</span>
          </div>
        )}
        {analysis && (
          <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-3">{analysis}</p>
        )}
        <button onClick={onContinue}
          className={`w-full py-3 rounded-2xl font-bold text-white text-base active:scale-95 transition-all ${
            correct ? 'bg-green-500' : 'bg-red-500'
          }`}>
          {label || '继续'}
        </button>
      </div>
    </div>
  )
}

// ─── 多子题问答组件 ─────────────────────────────────────
function MultiSubQuestion({ question, onDone }) {
  const { passage, subQs } = useMemo(
    () => parsePassageAndSubQs(question.question), [question.question]
  )
  const subAnswers = useMemo(() => parseSubAnswers(question.answer), [question.answer])

  const [subIndex, setSubIndex] = useState(0)
  const [subPhase, setSubPhase] = useState('answering') // 'answering' | 'result'
  const [userInput, setUserInput] = useState('')
  const [gradeResult, setGradeResult] = useState(null)
  const [passageOpen, setPassageOpen] = useState(false)
  const [results, setResults] = useState([]) // {correct}

  const current = subQs[subIndex]
  const currentAns = subAnswers.find(a => a.num === (current?.num ?? subIndex + 1))

  function handleSubmit() {
    if (!userInput.trim()) return
    const result = smartGrade(userInput, currentAns?.text || '')
    setGradeResult(result)
    setSubPhase('result')
    setResults(prev => [...prev, { correct: result.correct }])
  }

  function handleContinue() {
    const nextIdx = subIndex + 1
    if (nextIdx >= subQs.length) {
      const allResults = [...results]
      const allCorrect = allResults.every(r => r.correct)
      onDone(allCorrect)
    } else {
      setSubIndex(nextIdx)
      setSubPhase('answering')
      setUserInput('')
      setGradeResult(null)
    }
  }

  if (!current) return null

  return (
    <div className="flex flex-col gap-4 pb-44">
      {/* 原文折叠框 */}
      {passage && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
          <button
            onClick={() => setPassageOpen(v => !v)}
            className="w-full px-4 py-3 flex items-center justify-between text-left"
          >
            <span className="text-sm font-semibold text-amber-700">📖 查看原文 / 材料</span>
            <span className="text-amber-500 text-lg">{passageOpen ? '∧' : '∨'}</span>
          </button>
          {passageOpen && (
            <div className="px-4 pb-4">
              <p className="text-sm text-amber-900 leading-relaxed whitespace-pre-wrap">{passage}</p>
            </div>
          )}
        </div>
      )}

      {/* 子题进度点 */}
      {subQs.length > 1 && (
        <div className="flex gap-1.5 justify-center">
          {subQs.map((_, i) => (
            <div key={i} className={`h-2 rounded-full transition-all ${
              i < subIndex ? 'w-5 bg-emerald-400' :
              i === subIndex ? 'w-5 bg-emerald-600' :
              'w-2 bg-gray-200'
            }`} />
          ))}
        </div>
      )}

      {/* 当前子题 */}
      <div className="bg-white rounded-3xl px-5 py-5 shadow-sm border border-gray-100">
        <p className="text-xs text-emerald-500 font-semibold mb-2">
          第 {subIndex + 1} 题（共 {subQs.length} 题）
        </p>
        <p className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap">{current.text}</p>
      </div>

      {/* 答题框 */}
      {subPhase === 'answering' && (
        <>
          <textarea
            value={userInput}
            onChange={e => setUserInput(e.target.value)}
            placeholder="请写下你的答案…"
            rows={3}
            style={{ fontSize: '16px' }}
            className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-base text-gray-800 focus:outline-none focus:border-emerald-400 resize-none"
          />
          <button
            onClick={handleSubmit}
            disabled={!userInput.trim()}
            className="w-full bg-emerald-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-2xl"
          >
            提交
          </button>
        </>
      )}

      {/* 反馈面板 */}
      {subPhase === 'result' && (
        <FeedbackPanel
          correct={gradeResult?.correct}
          answer={!gradeResult?.correct ? currentAns?.text : null}
          analysis={subIndex === subQs.length - 1 ? question.analysis : null}
          onContinue={handleContinue}
          label={subIndex + 1 >= subQs.length ? '完成本题' : `继续第 ${subIndex + 2} 题`}
        />
      )}
    </div>
  )
}

// ─── 主页面 ──────────────────────────────────────────────
export default function ReadingPage({ user, onFinish, onBack }) {
  const questions = useMemo(() => shuffle(readingQ).slice(0, 5), [])
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState('answering') // 'answering' | 'result'
  const [userAnswer, setUserAnswer] = useState('')
  const [gradeResult, setGradeResult] = useState(null)
  const [selected, setSelected] = useState(null)
  const [sessionRecords, setSessionRecords] = useState([])
  const startTime = useRef(Date.now())
  const xpRef = useRef(0)
  const randomTip = useMemo(() => tips[Math.floor(Math.random() * tips.length)], [index])

  const current = questions[index]
  const isChoice = current?.type === 'single_choice'
  // 非 open_ended（fill_blank / matching）→ 用 DuolingoStyleQuiz 渲染
  const usesDuolingo = current && current.type !== 'open_ended'
  // open_ended 但有子题结构
  const { subQs } = useMemo(() =>
    current ? parsePassageAndSubQs(current.question) : { subQs: [] },
    [current]
  )
  const hasSubQs = current?.type === 'open_ended' && subQs.length >= 2

  function recordAndAdvance(correct, answer) {
    const xp = correct ? 5 : 1
    xpRef.current += xp
    storage.addXP(user.id, xp)
    const srsState = storage.getSrsState(user.id)
    const quality = toQuality(correct, 10)
    const newCardState = updateSRS(srsState[current.id], quality)
    storage.updateCardSrs(user.id, current.id, newCardState)
    const record = {
      card_id: current.id,
      correct,
      time_spent: 0,
      selected_answer: answer,
      ability_tag: current.ability_tag,
      knowledge_tag: current.knowledge_tag,
      timestamp: new Date().toISOString(),
    }
    storage.addRecord(user.id, record)
    setSessionRecords(prev => [...prev, record])
  }

  function finishSession(records) {
    const totalSec = Math.round((Date.now() - startTime.current) / 1000)
    const session = {
      date: new Date().toISOString(),
      total: records.length,
      correct: records.filter(r => r.correct).length,
      xpEarned: xpRef.current,
      durationSec: totalSec,
    }
    storage.addSession(user.id, session)
    updateStreak(user.id)
    syncAfterSession(user.id)
    onFinish({ session, records })
  }

  function handleChoiceSelect(option) {
    if (selected !== null) return
    const correct = option === current.answer
    setSelected(option)
    recordAndAdvance(correct, option)
    setGradeResult({ correct })
    setPhase('result')
  }

  function handleOpenSubmit() {
    if (!userAnswer.trim()) return
    const result = smartGrade(userAnswer, current.answer)
    recordAndAdvance(result.correct, userAnswer)
    setGradeResult(result)
    setPhase('result')
  }

  // DuolingoStyleQuiz / MultiSubQuestion 答完回调
  function handleDuolingoAnswer(chosenAnswer, correct) {
    recordAndAdvance(correct, chosenAnswer)
    advanceOrFinish(correct)
  }

  function handleMultiSubDone(allCorrect) {
    recordAndAdvance(allCorrect, '多子题')
    advanceOrFinish(allCorrect)
  }

  function advanceOrFinish(correct) {
    const newRecords = [...sessionRecords, {
      card_id: current.id, correct,
      knowledge_tag: current.knowledge_tag,
      timestamp: new Date().toISOString(),
    }]
    if (index + 1 >= questions.length) {
      finishSession(newRecords)
    } else {
      setIndex(i => i + 1)
      setPhase('answering')
      setUserAnswer('')
      setSelected(null)
      setGradeResult(null)
    }
  }

  function handleContinue() {
    const newRecords = [...sessionRecords]
    if (index + 1 >= questions.length) {
      finishSession(newRecords)
    } else {
      setIndex(i => i + 1)
      setPhase('answering')
      setUserAnswer('')
      setSelected(null)
      setGradeResult(null)
    }
  }

  if (!current) return null

  const progress = (index / questions.length) * 100

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-emerald-50 to-teal-50">
      {/* Top bar */}
      <div className="bg-white px-4 pt-8 pb-4 flex items-center gap-3 shadow-sm">
        <button onClick={onBack} className="text-gray-400 p-1 text-xl">✕</button>
        <div className="flex-1 bg-gray-100 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-emerald-400 to-teal-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm text-gray-400 font-medium min-w-[40px] text-right">
          {index + 1}/{questions.length}
        </span>
      </div>

      <div className="flex-1 flex flex-col px-4 py-4">
        {/* Tags */}
        <div className="flex gap-2 mb-4">
          <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-1 rounded-full font-medium">
            {current.knowledge_tag || '阅读理解'}
          </span>
          {current.ability_tag && (
            <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full">
              {current.ability_tag}
            </span>
          )}
        </div>

        {/* ── 专用 UI 题（fill_blank / matching）→ DuolingoStyleQuiz ── */}
        {usesDuolingo && (
          <DuolingoStyleQuiz
            key={current.id}
            question={current}
            onAnswerSubmit={handleDuolingoAnswer}
          />
        )}

        {/* ── 多子题问答（文言文/短文+多问）── */}
        {hasSubQs && (
          <MultiSubQuestion
            key={current.id}
            question={current}
            onDone={handleMultiSubDone}
          />
        )}

        {/* ── 普通 open_ended / 选择题 ── */}
        {!usesDuolingo && !hasSubQs && (
          <>
            {/* 题目 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
              <p className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap">{current.question}</p>
            </div>

            {/* 选择题 */}
            {isChoice && phase === 'answering' && (
              <div className="flex flex-col gap-3">
                {current.options.map(option => (
                  <button
                    key={option}
                    onClick={() => handleChoiceSelect(option)}
                    className="bg-white border-2 border-gray-200 text-gray-700 rounded-2xl px-4 py-4 text-left text-base leading-snug transition-all active:scale-95 shadow-sm"
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}

            {/* 选择题结果 */}
            {isChoice && phase === 'result' && (
              <div className="flex flex-col gap-3">
                {current.options.map(option => {
                  let style = 'bg-white border-2 border-gray-100 text-gray-400'
                  if (option === current.answer) style = 'bg-green-50 border-2 border-green-400 text-green-700'
                  else if (option === selected) style = 'bg-red-50 border-2 border-red-400 text-red-700'
                  return (
                    <div key={option} className={`${style} rounded-2xl px-4 py-4 text-left text-base leading-snug`}>
                      {option}
                    </div>
                  )
                })}
              </div>
            )}

            {/* 开放题答题区 */}
            {!isChoice && phase === 'answering' && (
              <div className="flex flex-col gap-3">
                <textarea
                  value={userAnswer}
                  onChange={e => setUserAnswer(e.target.value)}
                  placeholder="请写下你的答案…"
                  rows={4}
                  className="w-full border-2 border-gray-200 rounded-2xl px-4 py-3 text-base text-gray-800 focus:outline-none focus:border-emerald-400 resize-none"
                  style={{ fontSize: '16px' }}
                />
                <button
                  onClick={handleOpenSubmit}
                  disabled={!userAnswer.trim()}
                  className="w-full bg-emerald-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-xl"
                >
                  提交答案
                </button>
              </div>
            )}

            {/* 多邻国底部面板 */}
            {phase === 'result' && (
              <FeedbackPanel
                correct={gradeResult?.correct}
                answer={!gradeResult?.correct ? current.answer : null}
                analysis={current.analysis}
                onContinue={handleContinue}
                label={index + 1 >= questions.length ? '完成练习 🎉' : '继续'}
              />
            )}

            {/* 随机小贴士 */}
            {phase === 'answering' && index % 3 === 0 && randomTip && (
              <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <p className="text-yellow-800 text-xs font-semibold mb-1">💡 {randomTip.title}</p>
                {randomTip.formula && <p className="text-yellow-700 text-xs">{randomTip.formula}</p>}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
