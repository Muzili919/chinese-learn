import { useState, useEffect, useRef, useMemo } from 'react'
import { storage, updateStreak } from '../utils/storage'
import { updateSRS, toQuality } from '../utils/srs'
import { scheduleSession } from '../utils/scheduler'
import { syncAfterSession } from '../utils/sync'
import { generateVariant } from '../utils/ai'
import MultiMeaningCard from '../components/MultiMeaningCard'
import MatchingCard from '../components/MatchingCard'
import DuolingoStyleQuiz from '../components/DuolingoStyleQuiz'
import vocabQ from '../data/questions_vocab.json'
import poetryQ from '../data/questions_poetry.json'
import idiomQ from '../data/questions_idiom.json'
import sentenceQ from '../data/questions_sentence.json'
import litQ from '../data/questions_literature.json'

const ALL_QUESTIONS = [...vocabQ, ...poetryQ, ...idiomQ, ...sentenceQ, ...litQ]
const DEFAULT_SESSION_SIZE = 20

// 各星球每次答题数
const PLANET_SESSION_SIZES = {
  字词: 10,
  古诗词: 10,
  成语: 10,
  句子: 10,
  文学常识: 10,
}

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

export default function QuizPage({ user, options = {}, onFinish, onBack }) {
  const { focusTag = null, knowledgeTag = null, wrongCardIds = null } = options

  // 根据星球确定每次答题数
  const sessionSize = (wrongCardIds?.length)
    ? DEFAULT_SESSION_SIZE
    : (PLANET_SESSION_SIZES[knowledgeTag] || DEFAULT_SESSION_SIZE)

  const srsStates = useRef(storage.getSrsState(user.id))
  const startTime = useRef(Date.now())
  const questionStartTime = useRef(Date.now())

  const questions = useMemo(() => {
    if (wrongCardIds?.length) {
      const idSet = new Set(wrongCardIds)
      const pool = ALL_QUESTIONS.filter(q => idSet.has(q.id))
      return shuffle(pool).slice(0, sessionSize).map(shuffleOptions)
    }
    let pool = ALL_QUESTIONS
    if (knowledgeTag) pool = pool.filter((q) => q.knowledge_tag === knowledgeTag)
    // 全部混合模式：无 knowledgeTag 且无 focusTag 时，从各星球各抽题
    const isMixed = !knowledgeTag && !focusTag
    return scheduleSession(pool, srsStates.current, sessionSize, focusTag, isMixed).map(shuffleOptions)
  }, [focusTag, knowledgeTag, wrongCardIds, sessionSize])

  const isWrongReview = !!(wrongCardIds?.length)

  const [index, setIndex] = useState(0)
  const [sessionRecords, setSessionRecords] = useState([])
  const [xpGained, setXpGained] = useState(0)

  const current = questions[index]

  useEffect(() => {
    questionStartTime.current = Date.now()
  }, [index])

  function handleAnswerSubmit(chosenAnswer, correct) {
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

    if (index + 1 >= questions.length) {
        const totalSec = Math.round((Date.now() - startTime.current) / 1000)
        const allRecords = [...sessionRecords, record].filter(Boolean)
        const correctCount = allRecords.filter((r) => r.correct).length

        const session = {
          date: new Date().toISOString(),
          total: allRecords.length,
          correct: correctCount,
          xpEarned: xpGained + (correct ? 5 : 1),
          durationSec: totalSec,
        }
        storage.addSession(user.id, session)
        // 标记星球完成（只有做完才算打卡）
        if (current?.knowledge_tag) storage.markPlanetComplete(user.id, current.knowledge_tag)
        updateStreak(user.id)
        syncAfterSession(user.id)

        onFinish({ session, records: allRecords })
      } else {
        setIndex((i) => i + 1)
      }
  }

  async function handleGenerateVariant() {
    // AI变种题功能保持不变
  }

  if (!current) return null

  const progress = (index / questions.length) * 100

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50">
      {/* Top bar */}
      <div className="bg-white px-4 pt-8 pb-4 flex items-center gap-3 shadow-sm">
        <button onClick={onBack} className="text-gray-400 p-1 text-xl">✕</button>
        <div className="flex-1 bg-gray-100 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm text-gray-500 font-medium min-w-[40px] text-right">
          {index + 1}/{questions.length}
        </span>
      </div>

      {/* Question area */}
      <div className="flex-1 flex flex-col px-4 py-6">
        <DuolingoStyleQuiz
          key={current.id}
          question={current}
          onAnswerSubmit={handleAnswerSubmit}
          showVariantButton={isWrongReview}
          onGenerateVariant={handleGenerateVariant}
        />
      </div>
    </div>
  )
}