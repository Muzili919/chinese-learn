import { useState, useEffect, useRef, useMemo } from 'react'
import { storage, updateStreak } from '../utils/storage'
import { updateSRS, toQuality } from '../utils/srs'
import { scheduleSession } from '../utils/scheduler'
import { syncAfterSession } from '../utils/sync'
import { generateVariant } from '../utils/ai'
import MultiMeaningCard from '../components/MultiMeaningCard'
import MatchingCard from '../components/MatchingCard'
import vocabQ from '../data/questions_vocab.json'
import poetryQ from '../data/questions_poetry.json'
import idiomQ from '../data/questions_idiom.json'
import sentenceQ from '../data/questions_sentence.json'
import litQ from '../data/questions_literature.json'

const ALL_QUESTIONS = [...vocabQ, ...poetryQ, ...idiomQ, ...sentenceQ, ...litQ]
const SESSION_SIZE = 20

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function shuffleOptions(question) {
  if (question.type === 'fill_blank') return question
  const opts = [...(question.options || [])]
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]]
  }
  return { ...question, options: opts }
}

function normalize(s) {
  return (s || '').trim()
    .replace(/（[0-9]）/g, ' ')   // 去掉 （1）（2） 编号
    .replace(/[，。！？、；：""''《》（）\s]/g, '')
}

// 检测是否为 √/× 判断题
function isJudgmentQ(q) {
  return q.type === 'fill_blank' &&
    /打.*[√×]|[√×].*打/.test(q.question) &&
    /（[1-9]）[√×]/.test(q.answer)
}

// 解析判断题各小题的正确答案：['√','×','√','×']
function parseJudgmentAnswers(answer) {
  return [...answer.matchAll(/（[1-9]）([√×])/g)].map(m => m[1])
}

// 从题目中提取各小句（去掉末尾的（　））
function parseJudgmentStatements(questionText) {
  return questionText.split('\n')
    .map(l => l.trim())
    .filter(l => /^（[1-9]）/.test(l))
    .map(l => l.replace(/（　）\s*$/, '').replace(/^（[1-9]）/, '').trim())
}

// ── 判断题组件（每句话点 √ / × 作答）─────────────────────
function JudgmentQuestion({ question, onAnswer, onAdvance, selected }) {
  const correctAnswers = parseJudgmentAnswers(question.answer)
  const statements = parseJudgmentStatements(question.question)
  const [picks, setPicks] = useState({}) // { 0: '√', 1: '×', ... }
  const [submitted, setSubmitted] = useState(false)

  // 已从上层 recordAnswer 处理过，selected !== null 时同步 submitted
  const isDone = selected !== null || submitted

  const allPicked = statements.length > 0 &&
    statements.every((_, i) => picks[i] !== undefined)

  function handlePick(idx, val) {
    if (isDone) return
    setPicks(prev => ({ ...prev, [idx]: val }))
  }

  function handleSubmit() {
    if (!allPicked || isDone) return
    const correct = correctAnswers.every((ans, i) => picks[i] === ans)
    setSubmitted(true)
    onAnswer(correct)
  }

  // 指令行（第一段，去掉各小题后的剩余内容）
  const instruction = question.question.split(/\n\n/)[0] || ''

  return (
    <div className="flex flex-col gap-3">
      {/* 指令 */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100">
        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{instruction}</p>
      </div>

      {/* 各小题 */}
      {statements.map((stmt, i) => {
        const userPick = picks[i]
        const correct = correctAnswers[i]
        const isRight = userPick === correct
        return (
          <div key={i} className={`rounded-2xl p-4 border-2 ${
            !isDone ? 'bg-white border-gray-200' :
            isRight ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
          }`}>
            <p className="text-sm text-gray-800 leading-relaxed mb-3">
              <span className="font-semibold text-indigo-600">（{i + 1}）</span>{stmt}
            </p>
            <div className="flex gap-2">
              {['√', '×'].map(val => {
                let style = 'border-gray-200 text-gray-500 bg-white'
                if (!isDone && userPick === val) style = 'border-indigo-400 text-indigo-700 bg-indigo-50'
                if (isDone && val === correct) style = 'border-green-400 text-green-700 bg-green-50'
                if (isDone && userPick === val && val !== correct) style = 'border-red-400 text-red-700 bg-red-50'
                return (
                  <button
                    key={val}
                    onClick={() => handlePick(i, val)}
                    disabled={isDone}
                    className={`flex-1 py-2 rounded-xl border-2 font-bold text-lg transition-all ${style}`}
                  >
                    {val}
                  </button>
                )
              })}
            </div>
            {isDone && !isRight && (
              <p className="text-xs text-green-600 mt-2">正确：{correct}</p>
            )}
          </div>
        )
      })}

      {!isDone && (
        <button
          onClick={handleSubmit}
          disabled={!allPicked}
          className="w-full bg-indigo-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          提交答案
        </button>
      )}

      {isDone && (
        <>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-xs font-semibold text-amber-700 mb-1">💡 解析</p>
            <p className="text-xs text-amber-900 leading-relaxed">{question.analysis}</p>
          </div>
          <button
            onClick={onAdvance}
            className="w-full bg-amber-500 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            继续 →
          </button>
        </>
      )}
    </div>
  )
}

export default function QuizPage({ user, options = {}, onFinish, onBack }) {
  const { focusTag = null, knowledgeTag = null, wrongCardIds = null } = options

  const srsStates = useRef(storage.getSrsState(user.id))
  const startTime = useRef(Date.now())
  const questionStartTime = useRef(Date.now())

  const questions = useMemo(() => {
    if (wrongCardIds?.length) {
      const idSet = new Set(wrongCardIds)
      const pool = ALL_QUESTIONS.filter(q => idSet.has(q.id))
      return shuffle(pool).slice(0, SESSION_SIZE).map(shuffleOptions)
    }
    let pool = ALL_QUESTIONS
    if (knowledgeTag) pool = pool.filter((q) => q.knowledge_tag === knowledgeTag)
    return scheduleSession(pool, srsStates.current, SESSION_SIZE, focusTag).map(shuffleOptions)
  }, [focusTag, knowledgeTag, wrongCardIds])

  const isWrongReview = !!(wrongCardIds?.length)

  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [fillInput, setFillInput] = useState('')
  const [showAnalysis, setShowAnalysis] = useState(false)
  const [sessionRecords, setSessionRecords] = useState([])
  const [xpGained, setXpGained] = useState(0)

  const [variantLoading, setVariantLoading] = useState(false)
  const [variantQ, setVariantQ] = useState(null)
  const [variantSel, setVariantSel] = useState(null)
  const [variantError, setVariantError] = useState('')

  const current = questions[index]

  useEffect(() => {
    questionStartTime.current = Date.now()
  }, [index])

  function recordAnswer(chosenAnswer, correct) {
    if (selected !== null) return
    setSelected(chosenAnswer)

    const timeSec = (Date.now() - questionStartTime.current) / 1000
    const quality = toQuality(correct, timeSec)

    const newCardState = updateSRS(srsStates.current[current.id], quality)
    storage.updateCardSrs(user.id, current.id, newCardState)
    srsStates.current[current.id] = newCardState

    const xp = correct ? 5 : 1
    setXpGained((prev) => prev + xp)
    storage.addXP(user.id, xp)

    const record = {
      card_id: current.id,
      correct,
      time_spent: Math.round(timeSec * 10) / 10,
      selected_answer: chosenAnswer,
      ability_tag: current.ability_tag,
      knowledge_tag: current.knowledge_tag,
      timestamp: new Date().toISOString(),
    }
    storage.addRecord(user.id, record)
    setSessionRecords((prev) => [...prev, record])

    if (correct) {
      setTimeout(() => advance(record), 900)
    } else {
      setShowAnalysis(true)
    }
  }

  function handleSelect(option) {
    recordAnswer(option, option === current.answer)
  }

  function handleFillSubmit() {
    if (!fillInput.trim() || selected !== null) return
    const correct = normalize(fillInput) === normalize(current.answer)
    recordAnswer(fillInput, correct)
  }

  async function handleGenerateVariant() {
    setVariantLoading(true)
    setVariantError('')
    try {
      const v = await generateVariant(current)
      setVariantQ(v)
    } catch {
      setVariantError('AI出题失败，请点击继续')
    }
    setVariantLoading(false)
  }

  function handleVariantSelect(option) {
    if (variantSel !== null) return
    setVariantSel(option)
    const correct = option === variantQ.answer
    storage.addXP(user.id, correct ? 5 : 1)
    storage.addRecord(user.id, {
      card_id: variantQ.id,
      correct,
      time_spent: 0,
      selected_answer: option,
      ability_tag: variantQ.ability_tag,
      knowledge_tag: variantQ.knowledge_tag,
      timestamp: new Date().toISOString(),
    })
  }

  function advance(lastRecord) {
    setShowAnalysis(false)
    setSelected(null)
    setFillInput('')
    setVariantQ(null)
    setVariantSel(null)
    setVariantError('')

    if (index + 1 >= questions.length) {
      const totalSec = Math.round((Date.now() - startTime.current) / 1000)
      const allRecords = [...sessionRecords, lastRecord].filter(Boolean)
      const correctCount = allRecords.filter((r) => r.correct).length

      const session = {
        date: new Date().toISOString(),
        total: allRecords.length,
        correct: correctCount,
        xpEarned: xpGained + (lastRecord?.correct ? 5 : 1),
        durationSec: totalSec,
      }
      storage.addSession(user.id, session)
      updateStreak(user.id)
      syncAfterSession(user.id)

      onFinish({ session, records: allRecords })
    } else {
      setIndex((i) => i + 1)
    }
  }

  if (!current) return null

  const isFillBlank = current.type === 'fill_blank'
  const progress = (index / questions.length) * 100
  const fillCorrect = selected !== null && normalize(selected) === normalize(current.answer)

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top bar */}
      <div className="bg-white px-4 pt-8 pb-4 flex items-center gap-3">
        <button onClick={onBack} className="text-gray-400 p-1 text-xl">✕</button>
        <div className="flex-1 bg-gray-100 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-indigo-400 to-purple-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm text-gray-400 font-medium min-w-[40px] text-right">
          {index + 1}/{questions.length}
        </span>
      </div>

      {/* Question card */}
      <div className="flex-1 flex flex-col px-4 py-4">
        {/* Tags */}
        <div className="flex gap-2 mb-4">
          <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded-full font-medium">
            {current.knowledge_tag}
          </span>
          <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full">
            {current.ability_tag}
          </span>
          <span className="bg-gray-100 text-gray-400 text-xs px-2 py-1 rounded-full">
            {'⭐'.repeat(current.difficulty)}
          </span>
        </div>

        {/* 多义字题 */}
        {current.type === 'multi_meaning' && (
          <MultiMeaningCard
            question={current}
            onCorrect={() => recordAnswer(current.answer, true)}
            onWrong={() => recordAnswer('wrong', false)}
          />
        )}

        {/* 连线题 */}
        {current.type === 'matching' && (
          <MatchingCard
            question={current}
            onCorrect={() => recordAnswer(current.answer, true)}
            onWrong={() => recordAnswer('wrong', false)}
          />
        )}

        {/* 填空题：判断题（√/×）特殊 UI */}
        {isFillBlank && isJudgmentQ(current) && (
          <JudgmentQuestion
            question={current}
            onAnswer={(correct) => recordAnswer(correct ? current.answer : '答错', correct)}
            onAdvance={() => advance(null)}
            selected={selected}
          />
        )}

        {/* 填空题：普通填空 */}
        {isFillBlank && !isJudgmentQ(current) && (
          <div className="flex flex-col gap-3">
            <div className="bg-white rounded-2xl p-4 border border-gray-100 mb-2">
              <p className="text-base text-gray-800 leading-relaxed whitespace-pre-wrap">{current.question}</p>
            </div>

            <input
              type="text"
              value={fillInput}
              onChange={(e) => setFillInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFillSubmit()}
              disabled={selected !== null}
              placeholder={
                current.question.includes('近义词') || current.question.includes('反义词')
                  ? '请写出答案…'
                  : '在这里输入答案…'
              }
              className="w-full border-2 border-gray-200 rounded-2xl px-4 py-4 text-base text-gray-800 focus:outline-none focus:border-indigo-400 disabled:bg-gray-50"
            />
            {selected === null && (
              <button
                onClick={handleFillSubmit}
                disabled={!fillInput.trim()}
                className="w-full bg-indigo-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                提交答案
              </button>
            )}
            {selected !== null && (
              <div className={`rounded-2xl p-4 border-2 ${fillCorrect ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
                <p className={`text-sm font-semibold mb-1 ${fillCorrect ? 'text-green-700' : 'text-red-700'}`}>
                  {fillCorrect ? '✓ 正确！' : '✗ 答错了'}
                </p>
                {!fillCorrect && (
                  <p className="text-sm text-gray-700 mb-1">
                    正确答案：<span className="font-bold text-green-700">{current.answer}</span>
                  </p>
                )}
                <p className="text-sm text-gray-600">{current.analysis}</p>
              </div>
            )}
            {selected !== null && !fillCorrect && (
              <button
                onClick={() => advance(null)}
                className="w-full bg-amber-500 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                继续 →
              </button>
            )}
          </div>
        )}

        {/* 普通选择题 */}
        {!isFillBlank && current.type !== 'multi_meaning' && current.type !== 'matching' && (
          <div className="flex flex-col gap-3">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-4">
              <p className="text-lg text-gray-800 leading-relaxed font-medium">{current.question}</p>
            </div>
            {current.options.map((option) => {
              let style = 'bg-white border-2 border-gray-200 text-gray-700'
              if (selected !== null) {
                if (option === current.answer) style = 'bg-green-50 border-2 border-green-400 text-green-700'
                else if (option === selected) style = 'bg-red-50 border-2 border-red-400 text-red-700'
                else style = 'bg-white border-2 border-gray-100 text-gray-400'
              }
              return (
                <button
                  key={option}
                  onClick={() => handleSelect(option)}
                  disabled={selected !== null}
                  className={`${style} rounded-2xl px-4 py-4 text-left text-base leading-snug transition-all active:scale-95 shadow-sm`}
                >
                  {option}
                </button>
              )
            })}
          </div>
        )}

        {/* 解析面板（错题/答错后） */}
        {!isFillBlank && showAnalysis && (
          <div className="mt-4 space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <p className="text-sm font-semibold text-amber-700 mb-1">💡 解析</p>
              <p className="text-sm text-amber-900 leading-relaxed">{current.analysis}</p>
            </div>

            {isWrongReview && !variantQ && (
              <div className="flex gap-2">
                <button
                  onClick={handleGenerateVariant}
                  disabled={variantLoading}
                  className="flex-1 bg-violet-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl text-sm"
                >
                  {variantLoading ? '🤖 AI出变种题中…' : '🔀 举一反三（换语境再练）'}
                </button>
                <button
                  onClick={() => advance(null)}
                  className="px-4 bg-gray-100 text-gray-500 font-medium py-3 rounded-xl text-sm"
                >
                  跳过
                </button>
              </div>
            )}
            {variantError && <p className="text-xs text-red-400 text-center">{variantError}</p>}

            {variantQ && (
              <div className="bg-violet-50 border-2 border-violet-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-violet-600 text-sm font-bold">🔀 变种练习</span>
                  <span className="bg-violet-100 text-violet-600 text-xs px-2 py-0.5 rounded-full">
                    {variantQ.ability_tag} · AI出题
                  </span>
                </div>
                <p className="text-base text-gray-800 font-medium mb-3 leading-relaxed">{variantQ.question}</p>
                <div className="flex flex-col gap-2">
                  {variantQ.options.map(opt => {
                    let style = 'bg-white border-2 border-gray-200 text-gray-700'
                    if (variantSel !== null) {
                      if (opt === variantQ.answer) style = 'bg-green-50 border-2 border-green-400 text-green-700'
                      else if (opt === variantSel) style = 'bg-red-50 border-2 border-red-400 text-red-700'
                      else style = 'bg-white border-2 border-gray-100 text-gray-400'
                    }
                    return (
                      <button
                        key={opt}
                        onClick={() => handleVariantSelect(opt)}
                        disabled={variantSel !== null}
                        className={`${style} rounded-xl px-4 py-3 text-left text-sm leading-snug transition-all`}
                      >
                        {opt}
                      </button>
                    )
                  })}
                </div>
                {variantSel !== null && (
                  <div className={`mt-3 rounded-xl p-3 text-xs ${variantSel === variantQ.answer ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {variantSel === variantQ.answer ? '✓ 变种题答对了！说明真的理解了 🎉' : `✗ 正确答案：${variantQ.answer}`}
                    {variantQ.analysis && <p className="text-gray-500 mt-1">{variantQ.analysis}</p>}
                  </div>
                )}
                {variantSel !== null && (
                  <button
                    onClick={() => advance(null)}
                    className="mt-3 w-full bg-violet-500 text-white font-semibold py-3 rounded-xl text-sm"
                  >
                    继续 →
                  </button>
                )}
              </div>
            )}

            {(!isWrongReview || variantError) && !variantQ && (
              <button
                onClick={() => advance(null)}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                继续 →
              </button>
            )}
          </div>
        )}

        {/* 选择题答对反馈 */}
        {!isFillBlank && selected !== null && selected === current.answer && !showAnalysis && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-2xl p-3 text-center animate-pulse">
            <span className="text-green-600 font-semibold">✓ 正确！+5 XP</span>
          </div>
        )}
      </div>
    </div>
  )
}
