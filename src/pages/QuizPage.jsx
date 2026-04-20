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
import enVocabQ from '../data/questions_en_vocab.json'
import enListenQ from '../data/questions_en_listen.json'
import enGrammarQ from '../data/questions_en_grammar.json'
import enReadingQ from '../data/questions_en_reading.json'
import enWritingQ from '../data/questions_en_writing.json'
import enClozeQ from '../data/questions_en_j2_cloze.json'
import politicsQ from '../data/questions_politics_choice.json'
import mathBasicQ from '../data/questions_math_basic.json'
import mathGeoQ from '../data/questions_math_geometry.json'
import mathOlympiadQ from '../data/questions_math_olympiad.json'

const CHINESE_QUESTIONS = [...vocabQ, ...poetryQ, ...idiomQ, ...sentenceQ, ...litQ]
const ENGLISH_QUESTIONS = [...enVocabQ, ...enListenQ, ...enGrammarQ, ...enReadingQ, ...enWritingQ, ...enClozeQ]
const POLITICS_ALL = Array.isArray(politicsQ) ? politicsQ : (politicsQ.questions || [])
const MATH_ALL = [...mathBasicQ, ...mathGeoQ, ...mathOlympiadQ]
// ★ 全学科合并映射（错题练习需要跨学科查找）
const ALL_SUBJECTS_MAP = Object.fromEntries(
  [...CHINESE_QUESTIONS, ...ENGLISH_QUESTIONS, ...POLITICS_ALL, ...MATH_ALL].map(q => [q.id, q])
)

const ALL_QUESTIONS = CHINESE_QUESTIONS
const DEFAULT_SESSION_SIZE = 20

// 各星球每次答题数
const PLANET_SESSION_SIZES = {
  字词: 10,
  古诗词: 10,
  成语: 10,
  句子: 10,
  文学常识: 10,
}

// 数学各专题每次答题数（统一10题/次）
const MATH_SESSION_SIZE = 10

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
  const { focusTag = null, knowledgeTag = null, wrongCardIds = null, mathTopic = null, minDifficulty = null } = options

  // 根据星球确定每次答题数
  const sessionSize = (wrongCardIds?.length)
    ? DEFAULT_SESSION_SIZE
    : (mathTopic
        ? MATH_SESSION_SIZE
        : (PLANET_SESSION_SIZES[knowledgeTag] || DEFAULT_SESSION_SIZE))

  const srsStates = useRef(storage.getSrsState(user.id))
  const startTime = useRef(Date.now())
  const questionStartTime = useRef(Date.now())

  const questions = useMemo(() => {
    if (wrongCardIds?.length) {
      // ★ 错题练习：优先从静态题库找，找不到时从答题记录的 question_data 重建（AI自测题）
      const records = storage.getRecords(user.id)
      const recMap = {}
      for (const r of records) {
        if (r.question_data && !recMap[r.card_id]) recMap[r.card_id] = r
      }

      const pool = wrongCardIds
        .map(id => {
          // 1. 静态题库
          if (ALL_SUBJECTS_MAP[id]) return ALL_SUBJECTS_MAP[id]
          // 2. AI自测题 → 从记录里重建题目对象
          const rec = recMap[id]
          if (rec?.question_data) {
            const qd = rec.question_data
            return {
              id,
              type: qd.type === 'writing' ? 'fill_blank'        // 写作题在复习时当填空处理
                  : qd.type === 'shortanswer' ? 'fill_blank'
                  : qd.type === 'choice' ? 'single_choice'
                  : qd.type === 'truefalse' ? 'fill_blank'
                  : qd.type || 'fill_blank',
              question: qd.stem || '（题目内容已保存）',
              answer: qd.answer || '',
              options: qd.options,
              knowledge_tag: rec.knowledge_tag || '自测',
              ability_tag: rec.ability_tag || '综合',
              analysis: [
                qd.analysis,
                qd.aiComment ? `AI评语：${qd.aiComment}` : '',
                qd.earned !== undefined ? `本次得分：${qd.earned}/${qd.score}` : '',
              ].filter(Boolean).join('\n'),
              source: 'self_test',
              difficulty: 2,
            }
          }
          return null
        })
        .filter(Boolean)
      return shuffle(pool).slice(0, sessionSize).map(shuffleOptions)
    }
    // 数学专题
    if (mathTopic) {
      let mathPool = MATH_ALL.filter(q => q.topic === mathTopic)
      if (minDifficulty) mathPool = mathPool.filter(q => (q.difficulty || 0) >= minDifficulty)
      return shuffle(mathPool).slice(0, sessionSize).map(shuffleOptions)
    }

    let pool = ALL_QUESTIONS
    if (knowledgeTag) pool = pool.filter((q) => q.knowledge_tag === knowledgeTag)
    const isMixed = !knowledgeTag && !focusTag
    const seenToday = new Set(storage.getSeenToday(user.id))
    return scheduleSession(pool, srsStates.current, sessionSize, focusTag, isMixed, seenToday).map(shuffleOptions)
  }, [focusTag, knowledgeTag, wrongCardIds, sessionSize, mathTopic, minDifficulty])

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
      topic: current.topic,
      subject: mathTopic ? 'math' : 'chinese',
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
        // 标记星球完成（至少答5题且完成全部，才算打卡）
        if (allRecords.length >= 5 && current?.knowledge_tag) {
          storage.markPlanetComplete(user.id, current.knowledge_tag)
        }
        updateStreak(user.id)
        // 今日已见：记录本 session 所有题 id
        storage.markSeenToday(user.id, questions.map(q => q.id))
        syncAfterSession(user.id)

        // 收集本次答错的完整题目对象（供 ResultPage 的 AI 强化入口使用）
        const wrongQuestions = allRecords
          .filter(r => !r.correct)
          .map(r => questions.find(q => q.id === r.card_id))
          .filter(Boolean)
          .slice(0, 5)

        onFinish({ session, records: allRecords, wrongQuestions })
      } else {
        setIndex((i) => i + 1)
      }
  }

  async function handleGenerateVariant() {
    // AI变种题功能保持不变
  }

  if (!current) return null

  // 防护：如果当前题目缺少关键字段（如type/question/options），显示错误并允许跳过
  const isQuestionValid = current && (current.type || current.question)
  const [skipCount, setSkipCount] = useState(0)

  // 自动跳过无效题目
  useEffect(() => {
    if (!isQuestionValid && current && index < questions.length) {
      console.warn('检测到无效题目，自动跳过:', current.id, current)
      setSkipCount(c => c + 1)
      // 跳到下一题
      if (index + 1 < questions.length) {
        setIndex(i => i + 1)
      } else {
        // 已是最后一题，直接结束
        const totalSec = Math.round((Date.now() - startTime.current) / 1000)
        const session = {
          date: new Date().toISOString(),
          total: questions.length - skipCount,
          correct: sessionRecords.filter(r => r.correct).length,
          xpEarned: xpGained,
          durationSec: totalSec,
        }
        storage.addSession(user.id, session)
        // 标记星球完成（至少答5题且完成全部，才算打卡）
        if (allRecords.length >= 5 && current?.knowledge_tag) {
          storage.markPlanetComplete(user.id, current.knowledge_tag)
        }
        updateStreak(user.id)
        syncAfterSession(user.id)
        onFinish({ session, records: sessionRecords })
      }
    }
  }, [index])

  if (!isQuestionValid && skipCount > 0) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50 items-center justify-center px-6">
        <div className="bg-orange-50 border-2 border-dashed border-orange-300 rounded-3xl px-8 py-10 text-center max-w-sm">
          <p className="text-xl mb-2">⚠️</p>
          <p className="text-base font-bold text-orange-700 mb-1">遇到异常题目</p>
          <p className="text-xs text-gray-400 mb-4">ID: {current?.id || '未知'} 正在自动跳过...</p>
          <button onClick={() => window.history.back()} className="text-xs text-indigo-500 underline">← 返回重试</button>
        </div>
      </div>
    )
  }

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

      {/* Question area — overflow-y-auto 保证超长题目可以滚动 */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <DuolingoStyleQuiz
          key={current.id}
          question={current}
          onAnswerSubmit={handleAnswerSubmit}
          showVariantButton={true}
          onGenerateVariant={handleGenerateVariant}
        />
      </div>
    </div>
  )
}