import { useState, useMemo, useRef } from 'react'
import { storage } from '../utils/storage'
import { diagnose, getWeakPoints, getKnowledgeSummary, getActivityHeatmap } from '../utils/diagnosis'
import {
  getUpcomingExams, getAllExams, addExam, removeExam, getDaysUntil,
  addExamResult, getExamResults, removeExamResult, updateExamErrorTags,
  getTaskCompletionHistory,
} from '../utils/examCalendar'
import { getWeeklySubjectBalance } from '../utils/recommendation'
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip,
} from 'recharts'

const STATUS_COLOR = { good: '#22c55e', slow: '#f59e0b', weak: '#ef4444' }
const STATUS_LABEL = { good: '良好', slow: '需提速', weak: '需加强' }

const API_URL = '/api/ai'

async function callAI(systemPrompt, userPrompt) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.5,
    }),
  })
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content || ''
  try {
    const m = text.match(/\{[\s\S]*\}/)
    return m ? JSON.parse(m[0]) : null
  } catch { return null }
}

// 能力标签 → 知识领域（星球）映射
const ABILITY_TO_KNOWLEDGE = {
  '字音辨析': '字词', '字形辨析': '字词', '词语含义': '字词', '近反义词': '字词',
  '词语搭配': '字词', '多音字': '字词', '看拼音写字': '字词',
  '诗句默写': '古诗词', '作者朝代': '古诗词', '诗句含义': '古诗词', '诗歌赏析': '古诗词',
  '成语含义': '成语', '成语用法': '成语', '成语辨析': '成语', '成语故事': '成语', '近义成语': '成语',
  '修辞手法': '句子', '句式转换': '句子', '病句辨析': '句子', '关联词': '句子',
  '四大名著': '文学常识', '标点符号': '文学常识', '体裁文体': '文学常识', '作家作品': '文学常识',
}

export default function ReportPage({ user, onBack, onStartQuiz }) {
  const [pinInput, setPinInput] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [pinError, setPinError] = useState(false)
  const [reportTab, setReportTab] = useState('stats') // 'stats' | 'exams' | 'upload'
  // ── 考试日历状态 ──
  const [examCalRefresh, setExamCalRefresh] = useState(0)
  const [showAddExam, setShowAddExam] = useState(false)
  const [newExam, setNewExam] = useState({ subject: 'chinese', name: '', date: '' })
  const [reportSubject, setReportSubject] = useState('chinese')
  const [expandedExam, setExpandedExam] = useState(null)
  const [showScoreEntry, setShowScoreEntry] = useState(false)
  const [scoreEntry, setScoreEntry] = useState({ examId: null, examName: '', subject: 'chinese', date: new Date().toISOString().slice(0,10), score: '', totalScore: '100' })
  const [pendingErrorTags, setPendingErrorTags] = useState(null) // resultId after score save
  const [selectedErrorTags, setSelectedErrorTags] = useState([])
  const [examResultRefresh, setExamResultRefresh] = useState(0)
  const [uploadImg, setUploadImg] = useState(null)
  const [uploadSubject, setUploadSubject] = useState('chinese')
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)
  const [sectionScores, setSectionScores] = useState([
    { name: '选择题', score: '', total: 32 },
    { name: '填空题', score: '', total: 20 },
    { name: '阅读理解', score: '', total: 20 },
    { name: '写作', score: '', total: 28 },
  ])
  const fileRef = useRef(null)

  const allRecords = storage.getRecords(user.id)
  const sessions = storage.getSessions(user.id)

  const upcomingExams = useMemo(
    () => getUpcomingExams(user.id),
    [user.id, examCalRefresh]
  )
  const allExams = useMemo(
    () => getAllExams(user.id),
    [user.id, examCalRefresh]
  )
  const examResults = useMemo(
    () => getExamResults(user.id),
    [user.id, examResultRefresh]
  )
  const taskCompletion = useMemo(
    () => getTaskCompletionHistory(user.id, 14),
    [user.id, reportTab]
  )
  const weeklyBalance = useMemo(
    () => getWeeklySubjectBalance(user.id),
    [user.id, allRecords]
  )

  // 考试历史（SelfTestPage 完成后保存到 localStorage）
  const examHistory = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem(`exam_history_${user.id}`) || '[]')
    } catch { return [] }
  }, [user.id, reportTab])

  // 上传试卷并AI分析
  async function handleUploadAnalysis() {
    setUploading(true)
    setUploadResult(null)
    try {
      const scores = sectionScores.filter(s => s.score !== '')
      const scoreText = scores.map(s => `${s.name}：${s.score}/${s.total}分`).join('，')
      const prompt = `学生${uploadSubject === 'english' ? '英语' : uploadSubject === 'politics' ? '政治' : '语文'}考试成绩如下：${scoreText}。${uploadImg ? '(已上传试卷照片)' : ''}
请分析薄弱点并给出具体建议。返回JSON：{"totalScore":${scores.reduce((s,i)=>s+(+i.score||0),0)},"analysis":"综合评价(30字内)","weakPoints":["薄弱点1","薄弱点2"],"suggestions":["建议1","建议2","建议3"],"encouragement":"激励话语(20字内)"}`
      const result = await callAI('你是一位经验丰富的老师，请分析学生的考试成绩并给出专业建议。', prompt)
      setUploadResult(result)
    } catch (e) {
      setUploadResult({ error: '分析失败，请重试' })
    }
    setUploading(false)
  }

  // 按科目分组
  const chineseRecords = useMemo(() =>
    allRecords.filter(r => !r.subject || r.subject === 'chinese'), [allRecords])
  const englishRecords = useMemo(() =>
    allRecords.filter(r => r.subject === 'english'), [allRecords])
  const politicsRecords = useMemo(() =>
    allRecords.filter(r => r.subject === 'politics'), [allRecords])

  const records = reportSubject === 'english' ? englishRecords
    : reportSubject === 'politics' ? politicsRecords
    : chineseRecords

  const diagnosisResult = useMemo(() => {
    if (!records.length) return {}
    return diagnose(records)
  }, [records])

  const weakPoints = useMemo(() => getWeakPoints(diagnosisResult), [diagnosisResult])
  const knowledgeSummary = useMemo(() => getKnowledgeSummary(diagnosisResult), [diagnosisResult])
  const heatmap = useMemo(() => getActivityHeatmap(sessions), [sessions])

  const radarData = useMemo(() =>
    Object.entries(diagnosisResult).map(([tag, d]) => ({
      subject: tag,
      value: d.accuracy,
      fullMark: 100,
    })), [diagnosisResult])

  function handleUnlock(e) {
    e.preventDefault()
    const saved = user.pin || '1234'
    if (pinInput === saved) {
      setUnlocked(true)
    } else {
      setPinError(true)
      setTimeout(() => setPinError(false), 1500)
    }
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-xl font-bold text-gray-800 mb-1">家长报告</h1>
        <p className="text-gray-400 text-sm mb-6">请输入家长密码查看</p>
        <form onSubmit={handleUnlock} className="w-full max-w-xs">
          <input
            autoFocus
            type="number"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.slice(0, 4))}
            placeholder="4位密码"
            className={`w-full border-2 rounded-xl px-4 py-3 text-lg text-center mb-3 focus:outline-none transition-colors ${
              pinError ? 'border-red-400 bg-red-50' : 'border-indigo-200 focus:border-indigo-500'
            }`}
          />
          {pinError && <p className="text-red-500 text-sm text-center mb-2">密码错误</p>}
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl"
          >
            查看报告
          </button>
          <button
            type="button"
            onClick={onBack}
            className="mt-2 w-full text-gray-400 py-2 text-sm"
          >
            ← 返回
          </button>
        </form>
      </div>
    )
  }

  const totalCorrect = allRecords.filter((r) => r.correct).length
  const overallAcc = allRecords.length > 0 ? Math.round((totalCorrect / allRecords.length) * 100) : 0
  const totalMinutes = Math.round(sessions.reduce((s, ses) => s + (ses.durationSec || 0), 0) / 60)
  const streak = storage.getStreak(user.id)

  const SUBJECT_TABS = [
    { id: 'chinese', label: '语文 📖', count: chineseRecords.length },
    { id: 'english', label: '英语 🌎', count: englishRecords.length },
    ...(politicsRecords.length > 0 ? [{ id: 'politics', label: '政治 🏛️', count: politicsRecords.length }] : []),
  ]

  const SUBJECT_SECTIONS = {
    chinese: [
      { name: '选择题', score: '', total: 32 },
      { name: '填空题', score: '', total: 20 },
      { name: '阅读理解', score: '', total: 20 },
      { name: '写作', score: '', total: 28 },
    ],
    english: [
      { name: '听力', score: '', total: 20 },
      { name: '选择题', score: '', total: 30 },
      { name: '完形填空', score: '', total: 20 },
      { name: '阅读理解', score: '', total: 20 },
      { name: '写作', score: '', total: 10 },
    ],
    politics: [
      { name: '选择题', score: '', total: 50 },
      { name: '简答题', score: '', total: 30 },
      { name: '分析题', score: '', total: 20 },
    ],
  }

  // 渲染 AI 试卷的单道题
  function renderExamQuestion(q, idx, answers, aiScores, earnedScores) {
    if (!q || q.type === 'listenPassage' || q.type === 'passage') {
      return (
        <div key={idx} className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 my-2">
          <span className="text-xs font-bold text-indigo-600">
            {q?.type === 'listenPassage' ? '🎧 听力材料' : '📖 阅读材料'}
          </span>
          <p className="text-sm text-gray-700 mt-1 leading-relaxed">{q?.text}</p>
        </div>
      )
    }
    const userAns = answers?.[q.id]
    const correct = q.answer
    // 用 earnedScores 判断对错（最准确）
    const earned = earnedScores?.[q.id]
    const isAutoScored = q.type === 'choice' || q.type === 'listen' || q.type === 'truefalse' || q.type === 'fill'
    const isCorrect = earned !== undefined
      ? earned >= (q.score || 0)
      : (userAns !== undefined && userAns !== null && userAns !== '' && (
          q.type === 'choice' || q.type === 'listen'
            ? Number(userAns) === Number(correct)
            : q.type === 'truefalse'
              ? String(userAns) === String(correct)
              : null
        ))
    const aiScore = aiScores?.[q.id]  // comment string
    return (
      <div key={q.id || idx} className={`rounded-xl p-3 mb-2 border ${
        isCorrect === true ? 'bg-green-50 border-green-200' :
        isCorrect === false ? 'bg-red-50 border-red-200' :
        'bg-gray-50 border-gray-100'
      }`}>
        <div className="flex items-start gap-2">
          <span className="text-xs text-gray-400 font-medium mt-0.5 flex-shrink-0">
            {q.type === 'listen' ? '🎧' : q.type === 'fill' ? '📝' : q.type === 'write' ? '✏️' : '●'}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-800 leading-relaxed">{q.stem}</p>
            {/* 选择题选项 */}
            {(q.type === 'choice' || q.type === 'listen') && q.options && (
              <div className="mt-2 space-y-1">
                {q.options.map((opt, oi) => {
                  const letter = ['A','B','C','D'][oi]
                  const isUser = Number(userAns) === oi
                  const isRight = Number(correct) === oi
                  return (
                    <div key={oi} className={`flex items-center gap-2 rounded-lg px-2 py-1 text-xs ${
                      isRight ? 'bg-green-100 text-green-800 font-semibold' :
                      isUser && !isRight ? 'bg-red-100 text-red-700 line-through' :
                      'text-gray-600'
                    }`}>
                      <span className="font-bold w-4">{letter}.</span>
                      <span>{opt}</span>
                      {isRight && <span className="ml-auto text-green-600">✓正确</span>}
                      {isUser && !isRight && <span className="ml-auto text-red-500">✗我选</span>}
                    </div>
                  )
                })}
              </div>
            )}
            {/* 判断题 */}
            {q.type === 'truefalse' && (
              <div className="mt-1 flex gap-3 text-xs">
                <span className={`px-2 py-0.5 rounded ${correct === true || correct === 'true' ? 'bg-green-100 text-green-700 font-bold' : 'text-gray-400'}`}>✓ 正确</span>
                <span className={`px-2 py-0.5 rounded ${correct === false || correct === 'false' ? 'bg-green-100 text-green-700 font-bold' : 'text-gray-400'}`}>✗ 错误</span>
                {userAns !== undefined && String(userAns) !== String(correct) && (
                  <span className="text-red-500">（你选了{String(userAns) === 'true' ? '正确' : '错误'}）</span>
                )}
              </div>
            )}
            {/* 填空题答案 */}
            {q.type === 'fill' && (
              <div className="mt-1 text-xs">
                <span className="text-green-700">参考答案：{Array.isArray(q.answer) ? q.answer.join(' / ') : q.answer}</span>
                {userAns && <span className="ml-2 text-gray-500">（作答：{userAns}）</span>}
                {aiScore !== undefined && <span className="ml-2 text-indigo-600 font-bold">AI得分：{aiScore}分</span>}
              </div>
            )}
            {/* 写作题 */}
            {q.type === 'write' && (
              <div className="mt-1 text-xs text-gray-500">
                {userAns && <p className="bg-white rounded p-2 border border-gray-200 text-gray-700">{userAns}</p>}
                {aiScore !== undefined && <p className="mt-1 text-indigo-600 font-bold">AI得分：{aiScore}分</p>}
              </div>
            )}
            {/* 解析 */}
            {q.analysis && (
              <p className="mt-1.5 text-xs text-indigo-600 bg-indigo-50 rounded px-2 py-1">
                💡 {q.analysis}
              </p>
            )}
          </div>
          <div className="text-xs flex-shrink-0 text-right">
            {earned !== undefined ? (
              <span className={earned >= (q.score || 0) ? 'text-green-600 font-bold' : earned > 0 ? 'text-amber-600 font-bold' : 'text-red-500 font-bold'}>
                {earned}/{q.score}
              </span>
            ) : (
              <span className="text-gray-400">{q.score}分</span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-8 bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-700 to-purple-800 text-white px-5 pt-10 pb-6">
        <button onClick={onBack} className="text-indigo-200 text-sm mb-3">← 返回</button>
        <h1 className="text-2xl font-bold">{user.name} 的学习报告</h1>
        <p className="text-indigo-200 text-sm mt-1">
          共答 {allRecords.length} 题 · 累计 {totalMinutes} 分钟
        </p>
        <div className="flex gap-3 mt-4">
          {[
            { label: '总正确率', value: `${overallAcc}%` },
            { label: '连续打卡', value: `${streak.count}天` },
            { label: '学习天数', value: `${sessions.length}次` },
          ].map(({ label, value }) => (
            <div key={label} className="flex-1 bg-white/10 rounded-xl p-3 text-center">
              <div className="text-xl font-bold">{value}</div>
              <div className="text-indigo-200 text-xs mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 一级 Tab：数据报告 / 考试记录 / 试卷分析 */}
      <div className="flex bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        {[
          { id: 'stats', label: '📊 数据报告' },
          { id: 'exams', label: '📋 考试记录' },
          { id: 'upload', label: '📸 试卷分析' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => { setReportTab(t.id); setExpandedExam(null) }}
            className={`flex-1 py-3 text-sm font-semibold transition-colors ${
              reportTab === t.id ? 'text-indigo-600 border-b-2 border-indigo-500' : 'text-gray-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ===== 数据报告 Tab ===== */}
      {reportTab === 'stats' && (
        <>
          {/* 科目切换 Tab */}
          <div className="flex border-b border-gray-200 bg-white">
            {SUBJECT_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setReportSubject(tab.id)}
                className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                  reportSubject === tab.id
                    ? 'text-indigo-600 border-b-2 border-indigo-500'
                    : 'text-gray-400'
                }`}
              >
                {tab.label}
                <span className="ml-1 opacity-60">({tab.count})</span>
              </button>
            ))}
          </div>

          {records.length < 5 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="text-5xl mb-4">📊</div>
              <h1 className="text-xl font-bold text-gray-800 mb-2">数据还不够</h1>
              <p className="text-gray-500 text-sm">至少答 5 道题后才能生成报告</p>
              <p className="text-gray-400 text-sm mt-1">当前：{records.length} 题</p>
            </div>
          ) : (
            <div className="px-4 pt-5 space-y-5">
              {/* 14-day heatmap */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <h2 className="text-sm font-semibold text-gray-500 mb-3">近14天答题量</h2>
                <div className="flex gap-1.5 items-end">
                  {heatmap.map(({ date, count }) => {
                    const dateLabel = date.slice(5)
                    const height = count > 0 ? Math.max(8, Math.min(48, count * 2)) : 4
                    return (
                      <div key={date} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className={`w-full rounded-sm transition-all ${
                            count === 0 ? 'bg-gray-100' : count < 10 ? 'bg-indigo-200' : count < 20 ? 'bg-indigo-400' : 'bg-indigo-600'
                          }`}
                          style={{ height: `${height}px` }}
                        />
                        <span className="text-gray-300 text-[9px] leading-none">{dateLabel.slice(3)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Knowledge summary */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <h2 className="text-sm font-semibold text-gray-500 mb-3">知识领域掌握度</h2>
                {knowledgeSummary.map(({ name, accuracy, total }) => (
                  <div key={name} className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{name}</span>
                      <span className={`font-bold ${accuracy >= 80 ? 'text-green-600' : accuracy >= 60 ? 'text-amber-600' : 'text-red-500'}`}>
                        {accuracy}% <span className="text-gray-400 font-normal text-xs">({total}题)</span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${accuracy >= 80 ? 'bg-green-400' : accuracy >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
                        style={{ width: `${accuracy}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Radar chart */}
              {radarData.length >= 3 && (
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-500 mb-3">能力雷达图</h2>
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
                      <Radar name="掌握度" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
                      <Tooltip formatter={(v) => `${v}%`} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Weak points */}
              {weakPoints.length > 0 && (
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-500 mb-3">⚠️ 重点关注</h2>
                  <div className="space-y-3">
                    {weakPoints.map(({ tag, accuracy: acc, avgTime, total, status }) => {
                      const knowledgeTag = ABILITY_TO_KNOWLEDGE[tag]
                      return (
                        <div key={tag} className="p-3 bg-gray-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: STATUS_COLOR[status] }} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-800 text-sm">{tag}</span>
                                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                  style={{ color: STATUS_COLOR[status], backgroundColor: STATUS_COLOR[status] + '20' }}>
                                  {STATUS_LABEL[status]}
                                </span>
                              </div>
                              <p className="text-xs text-gray-400 mt-0.5">正确率 {acc}% · 平均用时 {avgTime}秒 · 共{total}题</p>
                              {status === 'weak' && <p className="text-xs text-red-500 mt-0.5">建议多做强化练习</p>}
                              {status === 'slow' && <p className="text-xs text-amber-500 mt-0.5">答对但反应慢，需要熟练度练习</p>}
                            </div>
                          </div>
                          {/* 专项练习快捷入口 */}
                          {onStartQuiz && knowledgeTag && (
                            <button
                              onClick={() => { onStartQuiz({ knowledgeTag, focusTag: tag }); onBack() }}
                              className="mt-2 w-full flex items-center justify-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-xs font-bold py-2 rounded-lg transition-colors active:scale-95"
                            >
                              🎯 专项练习 · {knowledgeTag}
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ── 家长诊断摘要 ── */}
              {weakPoints.length > 0 && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4">
                  <h2 className="text-sm font-bold text-amber-800 mb-3">👨‍👩‍👧 家长建议</h2>
                  <div className="space-y-2 mb-4">
                    {weakPoints.slice(0, 3).map(({ tag, accuracy: acc, status }, i) => (
                      <div key={tag} className="flex items-start gap-2">
                        <span className={`flex-shrink-0 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold mt-0.5
                          ${i === 0 ? 'bg-red-500' : i === 1 ? 'bg-orange-400' : 'bg-amber-400'}`}>
                          {i + 1}
                        </span>
                        <div className="flex-1">
                          <span className="text-sm font-semibold text-gray-800">{tag}</span>
                          <span className="text-xs text-gray-500 ml-1.5">正确率 {acc}%</span>
                          <p className="text-xs text-amber-700 mt-0.5">
                            {status === 'weak'
                              ? acc < 50
                                ? '严重薄弱，建议每天专项练习 3 分钟'
                                : '一般薄弱，建议连续 3 天集中强化'
                              : '答对但较慢，建议提升熟练度'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 本周各科投入时间 */}
                  {Object.keys(weeklyBalance).length > 0 && (
                    <div className="border-t border-amber-200 pt-3 mt-3">
                      <p className="text-xs font-semibold text-amber-700 mb-2">📊 本周各科练习量</p>
                      <div className="flex gap-3 flex-wrap">
                        {[
                          { id: 'chinese', label: '语文', emoji: '📖' },
                          { id: 'english', label: '英语', emoji: '🌎' },
                        ].map(({ id, label, emoji }) => {
                          const d = weeklyBalance[id] || { count: 0 }
                          return (
                            <div key={id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium
                              ${d.count === 0 ? 'bg-gray-100 text-gray-400' : 'bg-white text-gray-700 border border-amber-200'}`}>
                              <span>{emoji}</span>
                              <span>{label}</span>
                              <span className={`font-bold ${d.count === 0 ? 'text-gray-400' : 'text-indigo-600'}`}>
                                {d.count === 0 ? '未练习' : `${d.count}题`}
                              </span>
                            </div>
                          )
                        })}
                        {Object.keys(weeklyBalance).filter(k => !['chinese','english'].includes(k)).map(k => (
                          <div key={k} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white text-gray-700 border border-amber-200">
                            <span>📚</span><span>{k}</span>
                            <span className="font-bold text-indigo-600">{weeklyBalance[k].count}题</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── 考试日历管理 ── */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-700">📅 考试日历</h2>
                  <button
                    onClick={() => setShowAddExam(v => !v)}
                    className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-semibold"
                  >+ 添加考试</button>
                </div>

                {/* 添加表单 */}
                {showAddExam && (
                  <div className="bg-indigo-50 rounded-xl p-3 mb-3 space-y-2">
                    <select
                      value={newExam.subject}
                      onChange={e => setNewExam(v => ({ ...v, subject: e.target.value }))}
                      className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700"
                    >
                      <option value="chinese">📖 语文</option>
                      <option value="english">🌎 英语</option>
                      <option value="math">🔢 数学</option>
                      <option value="all">📚 全科</option>
                    </select>
                    <input
                      type="text"
                      placeholder="考试名称（如：期中语文考试）"
                      value={newExam.name}
                      onChange={e => setNewExam(v => ({ ...v, name: e.target.value }))}
                      className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700"
                    />
                    <input
                      type="date"
                      value={newExam.date}
                      onChange={e => setNewExam(v => ({ ...v, date: e.target.value }))}
                      className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (!newExam.name || !newExam.date) return
                          addExam(user.id, newExam)
                          setNewExam({ subject: 'chinese', name: '', date: '' })
                          setShowAddExam(false)
                          setExamCalRefresh(k => k + 1)
                        }}
                        disabled={!newExam.name || !newExam.date}
                        className="flex-1 bg-indigo-600 disabled:bg-gray-300 text-white text-sm font-bold py-2 rounded-lg"
                      >保存</button>
                      <button
                        onClick={() => setShowAddExam(false)}
                        className="px-4 bg-gray-100 text-gray-500 text-sm py-2 rounded-lg"
                      >取消</button>
                    </div>
                  </div>
                )}

                {/* 考试列表 */}
                {upcomingExams.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">
                    暂无考试计划。录入考试日期后，<br />系统会自动生成倒计时和冲刺建议。
                  </p>
                ) : (
                  <div className="space-y-2">
                    {upcomingExams.map(exam => {
                      const days = getDaysUntil(exam)
                      return (
                        <div key={exam.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex flex-col items-center justify-center text-white text-xs font-bold
                            ${days <= 3 ? 'bg-red-500' : days <= 7 ? 'bg-orange-500' : days <= 14 ? 'bg-amber-400' : 'bg-indigo-400'}`}>
                            <span className="text-lg leading-none font-extrabold">{days}</span>
                            <span className="text-[9px] leading-none opacity-80">天后</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">{exam.name}</p>
                            <p className="text-xs text-gray-400">{exam.date}</p>
                          </div>
                          <button
                            onClick={() => { removeExam(user.id, exam.id); setExamCalRefresh(k => k + 1) }}
                            className="text-gray-300 hover:text-red-400 text-lg"
                          >×</button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* All ability tags */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <h2 className="text-sm font-semibold text-gray-500 mb-3">所有能力点</h2>
                <div className="space-y-2">
                  {Object.entries(diagnosisResult)
                    .sort((a, b) => b[1].accuracy - a[1].accuracy)
                    .map(([tag, { accuracy: acc, total, status }]) => (
                      <div key={tag} className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-24 flex-shrink-0">{tag}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div className="h-2 rounded-full" style={{ width: `${acc}%`, backgroundColor: STATUS_COLOR[status] }} />
                        </div>
                        <span className="text-xs font-bold text-gray-600 w-10 text-right">{acc}%</span>
                        <span className="text-xs text-gray-300 w-8 text-right">{total}题</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ===== 考试记录 Tab ===== */}
      {reportTab === 'exams' && (
        <div className="px-4 pt-4 space-y-4 pb-8">

          {/* ── C验证：14天任务完成热力图 ── */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold text-gray-600 mb-3">📌 今日任务完成情况（近14天）</h2>
            <div className="flex gap-1 items-end">
              {taskCompletion.map(({ date, done }) => {
                const count = done.length
                const isToday = date === new Date().toISOString().slice(0,10)
                return (
                  <div key={date} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`w-full rounded-sm transition-all ${
                      count === 0 ? 'bg-gray-100' :
                      count === 1 ? 'bg-indigo-200' :
                      count === 2 ? 'bg-indigo-400' : 'bg-indigo-600'
                    } ${isToday ? 'ring-2 ring-offset-1 ring-indigo-400' : ''}`}
                      style={{ height: count === 0 ? 4 : count * 10 + 4 }}
                    />
                    <span className="text-[9px] text-gray-300">{date.slice(8)}</span>
                  </div>
                )
              })}
            </div>
            <div className="flex gap-3 mt-2 text-xs text-gray-400">
              <span>完成 {taskCompletion.filter(d => d.done.length >= 2).length} 天</span>
              <span>·</span>
              <span>全完成 {taskCompletion.filter(d => d.done.length >= 3).length} 天</span>
              <span>·</span>
              <span className="text-indigo-500 font-medium">
                本周完成率 {Math.round(taskCompletion.slice(-7).filter(d => d.done.length >= 1).length / 7 * 100)}%
              </span>
            </div>
          </div>

          {/* ── B：真实考试成绩录入 ── */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">🏫 真实考试成绩</h2>
              <button
                onClick={() => { setShowScoreEntry(v => !v); setPendingErrorTags(null); setSelectedErrorTags([]) }}
                className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-semibold"
              >+ 录入成绩</button>
            </div>

            {/* 成绩录入表单 */}
            {showScoreEntry && !pendingErrorTags && (
              <div className="bg-indigo-50 rounded-xl p-3 mb-3 space-y-2">
                {/* 关联考试（可选） */}
                <select
                  value={scoreEntry.examId || ''}
                  onChange={e => {
                    const exam = allExams.find(x => x.id === e.target.value)
                    setScoreEntry(v => ({
                      ...v,
                      examId: e.target.value || null,
                      examName: exam?.name || v.examName,
                      subject: exam?.subject || v.subject,
                      date: exam?.date || v.date,
                    }))
                  }}
                  className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700"
                >
                  <option value="">📅 选择已有考试（可选）</option>
                  {allExams.map(e => (
                    <option key={e.id} value={e.id}>{e.name} · {e.date}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="考试名称"
                  value={scoreEntry.examName}
                  onChange={e => setScoreEntry(v => ({ ...v, examName: e.target.value }))}
                  className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700"
                />
                <div className="flex gap-2">
                  <select
                    value={scoreEntry.subject}
                    onChange={e => setScoreEntry(v => ({ ...v, subject: e.target.value }))}
                    className="flex-1 border border-indigo-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700"
                  >
                    <option value="chinese">📖 语文</option>
                    <option value="english">🌎 英语</option>
                    <option value="math">🔢 数学</option>
                  </select>
                  <input
                    type="date"
                    value={scoreEntry.date}
                    onChange={e => setScoreEntry(v => ({ ...v, date: e.target.value }))}
                    className="flex-1 border border-indigo-200 rounded-lg px-2 py-2 text-sm bg-white text-gray-700"
                  />
                </div>
                <div className="flex gap-2 items-center">
                  <div className="flex-1 relative">
                    <input
                      type="number"
                      placeholder="得分"
                      value={scoreEntry.score}
                      onChange={e => setScoreEntry(v => ({ ...v, score: e.target.value }))}
                      className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700"
                    />
                  </div>
                  <span className="text-gray-400 text-sm">/</span>
                  <div className="flex-1">
                    <input
                      type="number"
                      placeholder="满分"
                      value={scoreEntry.totalScore}
                      onChange={e => setScoreEntry(v => ({ ...v, totalScore: e.target.value }))}
                      className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!scoreEntry.examName || !scoreEntry.score) return
                      const result = addExamResult(user.id, scoreEntry)
                      setPendingErrorTags(result.id)
                      setSelectedErrorTags([])
                      setExamResultRefresh(k => k + 1)
                    }}
                    disabled={!scoreEntry.examName || !scoreEntry.score}
                    className="flex-1 bg-indigo-600 disabled:bg-gray-300 text-white text-sm font-bold py-2 rounded-lg"
                  >保存 → 标记错题知识点</button>
                  <button onClick={() => setShowScoreEntry(false)}
                    className="px-4 bg-gray-100 text-gray-500 text-sm py-2 rounded-lg">取消</button>
                </div>
              </div>
            )}

            {/* 错题知识点标记（成绩保存后显示） */}
            {pendingErrorTags && (() => {
              const subjectTags = scoreEntry.subject === 'english'
                ? ['词汇', '语法', '听力', '阅读', '写作']
                : scoreEntry.subject === 'math'
                  ? ['计算', '应用题', '图形', '数据', '奥数']
                  : ['字词', '古诗词', '成语', '句子', '文学常识', '阅读理解', '写作']
              return (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-3">
                  <p className="text-sm font-bold text-orange-700 mb-1">✏️ 哪些知识点这次考试答错了？</p>
                  <p className="text-xs text-gray-400 mb-3">标记后会加权到今日任务推荐，帮孩子重点补强</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {subjectTags.map(tag => {
                      const sel = selectedErrorTags.includes(tag)
                      return (
                        <button
                          key={tag}
                          onClick={() => setSelectedErrorTags(prev =>
                            sel ? prev.filter(t => t !== tag) : [...prev, tag]
                          )}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            sel
                              ? 'bg-orange-500 text-white shadow-sm'
                              : 'bg-white text-gray-600 border border-gray-200'
                          }`}
                        >{sel ? '✓ ' : ''}{tag}</button>
                      )
                    })}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        updateExamErrorTags(user.id, pendingErrorTags, selectedErrorTags)
                        setExamResultRefresh(k => k + 1)
                        setPendingErrorTags(null)
                        setShowScoreEntry(false)
                        setScoreEntry({ examId: null, examName: '', subject: 'chinese', date: new Date().toISOString().slice(0,10), score: '', totalScore: '100' })
                      }}
                      className="flex-1 bg-orange-500 text-white text-sm font-bold py-2 rounded-lg"
                    >完成（{selectedErrorTags.length}个知识点）</button>
                    <button
                      onClick={() => { setPendingErrorTags(null); setShowScoreEntry(false) }}
                      className="px-4 bg-gray-100 text-gray-500 text-sm py-2 rounded-lg"
                    >跳过</button>
                  </div>
                </div>
              )
            })()}

            {/* 已录入的真实成绩列表 */}
            {examResults.length === 0 && !showScoreEntry ? (
              <p className="text-xs text-gray-400 text-center py-4">
                点击「录入成绩」添加孩子的真实考试成绩<br/>系统会分析薄弱点并加强推荐
              </p>
            ) : (
              <div className="space-y-2">
                {examResults.map(r => {
                  const pct = Math.round(r.score / r.totalScore * 100)
                  return (
                    <div key={r.id} className="flex items-start gap-3 bg-gray-50 rounded-xl px-3 py-2.5">
                      <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex flex-col items-center justify-center text-white text-xs font-bold
                        ${pct >= 80 ? 'bg-green-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}>
                        <span className="text-base font-extrabold leading-none">{pct}</span>
                        <span className="text-[9px] opacity-80">分</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{r.examName}</p>
                        <p className="text-xs text-gray-400">{r.date} · {r.score}/{r.totalScore}</p>
                        {r.errorTags?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {r.errorTags.map(t => (
                              <span key={t} className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full font-medium">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => { removeExamResult(user.id, r.id); setExamResultRefresh(k => k + 1) }}
                        className="text-gray-300 hover:text-red-400 text-lg flex-shrink-0"
                      >×</button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ── AI 自测记录（原有功能）── */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold text-gray-600 mb-3">🤖 AI 自测记录</h2>
            {expandedExam ? (
              <div>
                <button onClick={() => setExpandedExam(null)}
                  className="flex items-center gap-1 text-indigo-600 text-sm font-medium mb-4">
                  ← 返回列表
                </button>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
                  <div className="flex items-center justify-between mb-1">
                    <h2 className="font-bold text-gray-800">{expandedExam.title || 'AI 自测'}</h2>
                    <span className={`text-lg font-bold ${
                      expandedExam.score >= 80 ? 'text-green-600' :
                      expandedExam.score >= 60 ? 'text-amber-500' : 'text-red-500'
                    }`}>{expandedExam.score}分</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {expandedExam.date ? expandedExam.date.slice(0,10) : ''} ·{' '}
                    {expandedExam.subject === 'english' ? '英语' : expandedExam.subject === 'politics' ? '政治' : '语文'}
                  </p>
                </div>
                {(expandedExam.examData?.sections || []).map((sec, si) => {
                  const secQs = sec.subsections
                    ? sec.subsections.flatMap(sub => sub.questions || [])
                    : (sec.questions || [])
                  return (
                    <div key={si} className="mb-4">
                      <div className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl mb-2">{sec.title}</div>
                      <div className="space-y-1">
                        {secQs.map((q, qi) =>
                          renderExamQuestion(q, qi, expandedExam.answers, expandedExam.aiScores, expandedExam.earnedScores)
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : examHistory.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-6">
                完成 AI 自测后，成绩会自动保存到这里
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-gray-400 mb-1">共 {examHistory.length} 次（最近20次）</p>
                {examHistory.map((exam) => (
                  <button
                    key={exam.id}
                    onClick={() => setExpandedExam(exam)}
                    className="w-full bg-gray-50 rounded-xl p-3 flex items-center gap-3 active:bg-gray-100 transition-colors text-left"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                      exam.score >= 80 ? 'bg-green-100 text-green-700' :
                      exam.score >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'
                    }`}>{exam.score}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">{exam.title || 'AI 自测'}</p>
                      <p className="text-xs text-gray-400">{exam.date ? exam.date.slice(0,10) : ''} · {
                        exam.subject === 'english' ? '英语' : exam.subject === 'politics' ? '政治' : '语文'
                      }</p>
                    </div>
                    <div className="text-gray-300 text-lg">›</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== 试卷分析 Tab ===== */}
      {reportTab === 'upload' && (
        <div className="px-4 pt-5 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">📸 上传纸质试卷 + AI 分析薄弱点</h2>

            {/* 科目选择 */}
            <div className="flex gap-2 mb-4">
              {['chinese', 'english', 'politics'].map(s => (
                <button
                  key={s}
                  onClick={() => {
                    setUploadSubject(s)
                    setSectionScores((SUBJECT_SECTIONS[s] || SUBJECT_SECTIONS.chinese).map(x => ({ ...x, score: '' })))
                    setUploadResult(null)
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    uploadSubject === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {s === 'english' ? '英语' : s === 'politics' ? '政治' : '语文'}
                </button>
              ))}
            </div>

            {/* 照片上传 */}
            <div
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer mb-4 transition-colors ${
                uploadImg ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'
              }`}
            >
              {uploadImg ? (
                <div>
                  <img src={uploadImg} alt="试卷" className="max-h-40 mx-auto rounded-lg object-contain" />
                  <p className="text-xs text-indigo-600 mt-2">已上传（仅作记录，AI分析基于下方分数）</p>
                </div>
              ) : (
                <div>
                  <div className="text-3xl mb-2">📷</div>
                  <p className="text-sm text-gray-500">点击上传试卷照片（可选）</p>
                  <p className="text-xs text-gray-400 mt-1">照片仅作记录，请在下方输入各题型分数</p>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  const reader = new FileReader()
                  reader.onload = ev => setUploadImg(ev.target.result)
                  reader.readAsDataURL(f)
                }}
              />
            </div>

            {/* 各题型分数输入 */}
            <p className="text-xs font-semibold text-gray-600 mb-2">输入各题型得分：</p>
            <div className="space-y-2 mb-4">
              {sectionScores.map((s, i) => (
                <div key={s.name} className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 w-20 flex-shrink-0">{s.name}</span>
                  <input
                    type="number"
                    min="0"
                    max={s.total}
                    value={s.score}
                    onChange={e => setSectionScores(prev => prev.map((x, xi) =>
                      xi === i ? { ...x, score: e.target.value } : x
                    ))}
                    placeholder="得分"
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm text-center focus:outline-none focus:border-indigo-400"
                  />
                  <span className="text-xs text-gray-400 w-14 flex-shrink-0">/ {s.total} 分</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-xl">
              <span className="text-sm text-gray-600">合计得分</span>
              <span className="font-bold text-lg text-indigo-600">
                {sectionScores.reduce((sum, s) => sum + (+s.score || 0), 0)} /
                {sectionScores.reduce((sum, s) => sum + s.total, 0)} 分
              </span>
            </div>

            <button
              onClick={handleUploadAnalysis}
              disabled={uploading || sectionScores.every(s => s.score === '')}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                uploading || sectionScores.every(s => s.score === '')
                  ? 'bg-gray-200 text-gray-400'
                  : 'bg-indigo-600 text-white active:bg-indigo-700'
              }`}
            >
              {uploading ? '🤖 AI分析中...' : '🤖 AI 分析薄弱点'}
            </button>
          </div>

          {/* AI 分析结果 */}
          {uploadResult && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
              {uploadResult.error ? (
                <p className="text-red-500 text-sm text-center">{uploadResult.error}</p>
              ) : (
                <>
                  {/* 总分 + 评价 */}
                  <div className="text-center">
                    <div className={`text-5xl font-bold mb-1 ${
                      uploadResult.totalScore >= 80 ? 'text-green-600' :
                      uploadResult.totalScore >= 60 ? 'text-amber-500' : 'text-red-500'
                    }`}>{uploadResult.totalScore}</div>
                    <p className="text-sm text-gray-600">{uploadResult.analysis}</p>
                    {uploadResult.encouragement && (
                      <p className="text-sm font-semibold text-indigo-600 mt-2">"{uploadResult.encouragement}"</p>
                    )}
                  </div>

                  {/* 薄弱点 */}
                  {uploadResult.weakPoints?.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-gray-500 mb-2">⚠️ 薄弱点</h3>
                      <div className="flex flex-wrap gap-2">
                        {uploadResult.weakPoints.map((w, i) => (
                          <span key={i} className="bg-red-50 text-red-700 text-xs px-3 py-1 rounded-full">{w}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 建议 */}
                  {uploadResult.suggestions?.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-gray-500 mb-2">💡 改进建议</h3>
                      <div className="space-y-2">
                        {uploadResult.suggestions.map((sug, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-indigo-500 font-bold flex-shrink-0">{i + 1}.</span>
                            <span>{sug}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
