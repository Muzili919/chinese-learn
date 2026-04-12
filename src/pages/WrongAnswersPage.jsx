import { useMemo, useState, useRef } from 'react'
import { storage } from '../utils/storage'
import { getPhotoQuestions, recognizePhotoQuestion, savePhotoQuestionToWrongBook } from '../utils/ai_v2'
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

const ALL_QUESTIONS = [...vocabQ, ...poetryQ, ...idiomQ, ...sentenceQ, ...litQ]
const Q_MAP = Object.fromEntries(ALL_QUESTIONS.map(q => [q.id, q]))

const EN_ALL_QUESTIONS = [...enVocabQ, ...enListenQ, ...enGrammarQ, ...enReadingQ, ...enWritingQ]
const EN_Q_MAP = Object.fromEntries(EN_ALL_QUESTIONS.map(q => [q.id, q]))

// 合并拍照上传的题目
function getAllQMap(subject) {
  const photoQs = getPhotoQuestions()
  const photoFiltered = Object.fromEntries(
    Object.entries(photoQs).filter(([, q]) => {
      if (subject === 'english') return q.subject === 'english'
      return !q.subject || q.subject === 'chinese'
    })
  )
  return { ...photoFiltered, ...(subject === 'english' ? EN_Q_MAP : Q_MAP) }
}

const TAG_COLORS = {
  字词: 'bg-blue-100 text-blue-700',
  古诗词: 'bg-green-100 text-green-700',
  成语: 'bg-orange-100 text-orange-700',
  句子: 'bg-violet-100 text-violet-700',
  文学常识: 'bg-rose-100 text-rose-700',
}

function daysDiff(dateStr) {
  if (!dateStr) return 999
  const diff = Math.floor(
    (new Date().setHours(0, 0, 0, 0) - new Date(dateStr).setHours(0, 0, 0, 0))
    / 86400000
  )
  return diff
}

export default function WrongAnswersPage({ user, subject = 'chinese', onStartWrongQuiz, onVariantTraining, onBack }) {
  const [filter, setFilter] = useState('all')  // all | overdue | pending
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)
  const fileInputRef = useRef(null)
  const allQMap = useMemo(() => getAllQMap(subject), [subject])

  const { wrongCards, overdueCount } = useMemo(() => {
    const allRecords = storage.getRecords(user.id)
    // 按科目过滤：英语题有 subject==='english'，语文题没有 subject 或 subject==='chinese'
    const records = allRecords.filter(r => {
      if (subject === 'english') return r.subject === 'english'
      return !r.subject || r.subject === 'chinese'
    })
    const srsStates = storage.getSrsState(user.id)

    // 每张卡最新一条记录
    const latest = {}
    const wrongCount = {}
    for (const r of records) {
      if (!latest[r.card_id] || r.timestamp > latest[r.card_id].timestamp) {
        latest[r.card_id] = r
      }
      if (!r.correct) wrongCount[r.card_id] = (wrongCount[r.card_id] || 0) + 1
    }

    const today = new Date().toISOString().split('T')[0]
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - 3)
    const cutoffStr = cutoff.toISOString().split('T')[0]

    const cards = []
    let overdueCount = 0

    for (const [cardId, rec] of Object.entries(latest)) {
      if (rec.correct) continue  // 最近一次答对了，不算错题
      const q = allQMap[cardId]
      if (!q) continue

      const srs = srsStates[cardId]
      const nextReview = srs?.nextReview || today
      const isOverdue = nextReview <= cutoffStr
      const isDueToday = nextReview <= today

      if (isOverdue) overdueCount++

      cards.push({
        id: cardId,
        question: q,
        lastWrongDate: rec.timestamp?.split('T')[0] || today,
        wrongTimes: wrongCount[cardId] || 1,
        nextReview,
        isOverdue,
        isDueToday,
        daysSinceDue: daysDiff(nextReview),
      })
    }

    // 按积压程度排序：积压最久的排最前
    cards.sort((a, b) => b.daysSinceDue - a.daysSinceDue)

    return { wrongCards: cards, overdueCount }
  }, [user.id])

  const filtered = filter === 'overdue'
    ? wrongCards.filter(c => c.isOverdue)
    : filter === 'pending'
    ? wrongCards.filter(c => !c.isOverdue)
    : wrongCards

  const dueIds = wrongCards.filter(c => c.isDueToday).map(c => c.id)

  // 选择操作
  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const selectAll = () => setSelectedIds(new Set(filtered.map(c => c.id)))
  const clearSelection = () => setSelectedIds(new Set())

  // 拍照上传
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      // 读取图片为 base64
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.readAsDataURL(file)
      })
      // 使用 AI 识别题目
      const result = await recognizePhotoQuestion(base64)
      if (result.success && result.questions?.length > 0) {
        for (const q of result.questions) {
          savePhotoQuestionToWrongBook(user.id, q, storage)
        }
        alert(`✅ 成功识别 ${result.questions.length} 道题目，已加入错题本！`)
      } else {
        alert('⚠️ 未能成功识别题目，请确保照片清晰或手动输入。')
      }
    } catch (err) {
      console.error('Photo upload error:', err)
      alert('❌ 识别失败，请重试。')
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-red-50 to-orange-50">
      {/* Header */}
      <div className="bg-white px-4 pt-10 pb-4 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="text-gray-400 text-xl p-1">✕</button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-800">💥 错题本{subject === 'english' ? '（英语）' : '（语文）'}</h1>
            <p className="text-xs text-gray-400">错误 → 复盘 → 攻克，共 {wrongCards.length} 道错题</p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-9 h-9 flex items-center justify-center bg-indigo-50 rounded-xl text-base active:scale-95 transition-all"
            title="📷 拍照上传错题"
          >
            📷
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={handlePhotoUpload}
          />
        </div>

        {/* 积压警告 */}
        {overdueCount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-red-700">🚨 {overdueCount} 道错题积压超过3天！</p>
              <p className="text-xs text-red-500">快来消灭它们吧</p>
            </div>
            <button
              onClick={() => onStartWrongQuiz(wrongCards.filter(c => c.isOverdue).map(c => c.id))}
              className="bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-xl"
            >
              立刻攻克
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 px-4 py-4">
        {wrongCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <p className="text-lg font-bold text-gray-700">错题本是空的！</p>
            <p className="text-sm text-gray-400 mt-1">继续保持，所有题都答对了</p>
          </div>
        ) : (
          <>
            {/* 筛选 + 选择操作 */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-2">
                {[
                  { key: 'all', label: `全部 ${wrongCards.length}` },
                  { key: 'overdue', label: `积压 ${overdueCount}` },
                  { key: 'pending', label: `待复习 ${wrongCards.length - overdueCount}` },
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => { setFilter(f.key); setSelectedIds(new Set()) }}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      filter === f.key
                        ? 'bg-red-500 text-white'
                        : 'bg-white text-gray-500 border border-gray-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                <button onClick={selectAll} className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-500 active:scale-95">全选</button>
                <button onClick={clearSelection} className="text-xs px-2 py-1 rounded-lg bg-gray-100 text-gray-500 active:scale-95">清除</button>
              </div>
            </div>

            {/* 已选择操作栏 */}
            {selectedIds.size > 0 && (
              <div className="bg-violet-50 border border-violet-200 rounded-2xl p-3 mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold text-violet-700">已选 {selectedIds.size} 道题</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => onStartWrongQuiz([...selectedIds])}
                    className="text-xs px-3 py-1.5 rounded-xl bg-red-500 text-white font-bold active:scale-95"
                  >
                    练习选中
                  </button>
                  <button
                    onClick={() => {
                      const q = allQMap[[...selectedIds][0]]
                      if (q && onVariantTraining) onVariantTraining(q)
                    }}
                    className="text-xs px-3 py-1.5 rounded-xl bg-violet-500 text-white font-bold active:scale-95"
                    disabled={selectedIds.size !== 1}
                  >
                    🔀 举一反三
                  </button>
                </div>
              </div>
            )}

            {/* 一键攻克按钮 */}
            {dueIds.length > 0 && (
              <button
                onClick={() => onStartWrongQuiz(dueIds)}
                className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold py-4 rounded-2xl mb-4 text-base shadow-sm active:scale-95 transition-transform"
              >
                💥 开始攻克今日错题（{dueIds.length} 道）
              </button>
            )}

            {/* 错题列表 */}
            <div className="flex flex-col gap-3">
              {filtered.map(card => (
                <div
                  key={card.id}
                  className={`bg-white rounded-2xl p-4 border-l-4 shadow-sm ${
                    selectedIds.has(card.id) ? 'border-l-violet-400 ring-2 ring-violet-200' :
                    card.isOverdue ? 'border-l-red-400' : 'border-l-orange-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex gap-2 flex-wrap items-center">
                      {/* 选择复选框 */}
                      <button
                        onClick={() => toggleSelect(card.id)}
                        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          selectedIds.has(card.id)
                            ? 'bg-violet-500 border-violet-500 text-white'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {selectedIds.has(card.id) && <span className="text-xs">✓</span>}
                      </button>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TAG_COLORS[card.question.knowledge_tag] || 'bg-gray-100 text-gray-600'}`}>
                        {card.question.knowledge_tag}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                        {card.question.ability_tag}
                      </span>
                    </div>
                    <div className="text-right flex-shrink-0 flex items-center gap-1">
                      {/* 举一反三按钮 */}
                      {onVariantTraining && (
                        <button
                          onClick={() => onVariantTraining(card.question)}
                          className="text-[10px] px-2 py-1 rounded-lg bg-violet-50 text-violet-600 font-bold active:scale-95 transition-all whitespace-nowrap"
                          title="AI 举一反三"
                        >
                          🔀 举一反三
                        </button>
                      )}
                      <div className="text-right">
                        {card.isOverdue ? (
                          <span className="text-xs font-bold text-red-500">
                            积压{card.daysSinceDue}天 🚨
                          </span>
                        ) : card.isDueToday ? (
                          <span className="text-xs font-bold text-orange-500">今日待练 ⚡</span>
                        ) : (
                          <span className="text-xs text-gray-400">
                            {new Date(card.nextReview) > new Date()
                              ? `${Math.abs(card.daysSinceDue)}天后复习`
                              : '待复习'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 leading-relaxed mb-2 line-clamp-2">
                    {card.question.question}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400">
                        ✗ 已错 {card.wrongTimes} 次
                      </span>
                      <span className="text-xs text-gray-400">
                        上次：{card.lastWrongDate}
                      </span>
                    </div>
                    <div className="text-xs text-green-600 font-medium">
                      正确答案：{card.question.answer?.length > 10
                        ? card.question.answer.slice(0, 10) + '…'
                        : card.question.answer}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
