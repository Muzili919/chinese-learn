/**
 * ReportPage — 家长分析报告（重构版）
 *
 * Tab 结构：总览 | 语文 | 英语 | 数学 | 考试
 *
 * 核心修复：
 * - 每科独立分析，互不干扰
 * - 语文按 ability_tag 分析（精细）
 * - 英语/数学/道法按 knowledge_tag 分析（因为这些科目的 ability_tag 为空或无意义）
 * - 家长建议说人话，精准具体
 */

import { useState, useMemo, useRef } from 'react'
import { storage, exportAll } from '../utils/storage'
import { FULL_Q_MAP } from '../utils/questionMap'
import { getActivityHeatmap } from '../utils/diagnosis'
import {
  getUpcomingExams, getAllExams, addExam, removeExam, getDaysUntil,
  addExamResult, getExamResults, removeExamResult, updateExamErrorTags,
  getTaskCompletionHistory,
} from '../utils/examCalendar'
import { getWeeklySubjectBalance } from '../utils/recommendation'
import PremiumDiagnosis from '../components/PremiumDiagnosis'
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, Tooltip,
} from 'recharts'

// ── 学科配置 ─────────────────────────────────────────────────
const GRADE_SUBJECTS = {
  primary: [
    { id: 'overview', label: '总览',  emoji: '📊' },
    { id: 'chinese',  label: '语文',  emoji: '📖' },
    { id: 'english', label: '英语',  emoji: '🌎' },
    { id: 'math',     label: '数学',  emoji: '🔢' },
    { id: 'exams',    label: '考试',  emoji: '📋' },
  ],
  junior2: [
    { id: 'overview', label: '总览',  emoji: '📊' },
    { id: 'chinese',  label: '语文',  emoji: '📖' },
    { id: 'english', label: '英语',  emoji: '🌎' },
    { id: 'politics', label: '道法',  emoji: '⚖︁' },
    { id: 'math',     label: '数学',  emoji: '🔢' },
    { id: 'exams',    label: '考试',  emoji: '📋' },
  ],
}

// 语文：knowledge_tag → 图标
const CHINESE_KNOWLEDGE_ICON = {
  '字词': '🔤', '古诗词': '🎋', '成语': '🏮',
  '句子': '✏️', '文学常识': '📚', '阅读理解': '📖', '写作': '✍️',
  // 初中语文
  '字音辨析': '🔤', '字形辨析': '🔤', '词语运用': '📝', '病句辨析': '✏️',
  '标点符号': '✏️', '句子排序': '✏️',
  '古诗文默写': '🎋', '古诗词赏析': '🎋', '古诗文常识': '🎋', '文言文翻译': '📜',
  '实词解释': '📜', '虚词用法': '📜', '句式翻译': '📜', '文言文阅读': '📜',
  '名著阅读': '📚', '仿写句子': '💬', '语言得体': '💬', '信息概括': '💬',
  '图文转换': '💬', '综合性学习': '💬',
}
// 语文：ability_tag → knowledge_tag（用于精细诊断 → 知识点跳转）
const ABILITY_TO_KNOWLEDGE = {
  '字音辨析': '字词', '字形辨析': '字词', '词语含义': '字词', '近反义词': '字词',
  '词语搭配': '字词', '多音字': '字词', '看拼音写字': '字词',
  '诗句默写': '古诗词', '作者朝代': '古诗词', '诗句含义': '古诗词', '诗歌赏析': '古诗词',
  '成语含义': '成语', '成语用法': '成语', '成语辨析': '成语', '成语故事': '成语', '近义成语': '成语',
  '修辞手法': '句子', '句式转换': '句子', '病句辨析': '句子', '关联词': '句子',
  '四大名著': '文学常识', '标点符号': '文学常识', '体裁文体': '文学常识', '作家作品': '文学常识',
  // 初中语文 ability_tag → knowledge_tag
  '语言基础': '字音辨析', '古诗文': '古诗文默写', '文言文': '实词解释', '语言运用': '仿写句子',
}
// 英语：knowledge_tag 显示名
const ENGLISH_KNOWLEDGE_LABEL = {
  '英语词汇': '词汇', '英语语法': '语法', '英语听力': '听力',
  '英语阅读': '阅读', '英语写作': '写作', '英语综合': '综合',
  '构词法': '构词法', '词汇辨析': '词汇辨析', '语境选词': '语境选词',
  '一般将来时': '将来时', '一般过去时': '过去时', '反意疑问句': '反意疑问句',
  '宾语从句': '宾语从句', '情态动词': '情态动词', '感叹句': '感叹句',
  '现在完成时': '完成时',
}
// 数学：knowledge_tag 图标
const MATH_KNOWLEDGE_ICON = {
  '分数运算': '➗', '小数运算': '🔢', '数的认识': '🔢', '比和比例': '⚖️',
  '百分数': '%', '运算定律': '🧮', '平面图形': '📐', '立体图形': '📦',
  '单位换算': '🔄', '对称与变换': '🔁', '工程问题': '🏗️', '行程问题': '🚗',
}
// 道法：knowledge_tag 图标
const POLITICS_ICON = '⚖️'

const STATUS_COLOR = { good: '#22c55e', slow: '#f59e0b', weak: '#ef4444' }
const STATUS_LABEL = { good: '掌握良好', slow: '需提速', weak: '需加强' }

const API_URL = '/api/ai'
async function callAI(sysPrompt, userPrompt) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'system', content: sysPrompt }, { role: 'user', content: userPrompt }],
      temperature: 0.5,
    }),
  })
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content || ''
  try { const m = text.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : null } catch { return null }
}

// ── 按 key 分组诊断（可指定用 ability_tag 或 knowledge_tag）─────
function diagnoseByKey(records, key = 'ability_tag') {
  const groups = {}
  for (const r of records) {
    const tag = r[key]
    if (!tag) continue
    if (!groups[tag]) groups[tag] = { correct: 0, total: 0, times: [] }
    groups[tag].total++
    if (r.correct) groups[tag].correct++
    if (r.time_spent) groups[tag].times.push(r.time_spent)
  }
  const result = {}
  for (const [tag, d] of Object.entries(groups)) {
    const acc = d.total > 0 ? d.correct / d.total : 0
    const avgTime = d.times.length > 0 ? d.times.reduce((a, b) => a + b, 0) / d.times.length : 0
    let status = 'good'
    if (acc < 0.6) status = 'weak'
    else if (acc >= 0.8 && avgTime > 15) status = 'slow'
    result[tag] = { accuracy: Math.round(acc * 100), avgTime: Math.round(avgTime), total: d.total, status }
  }
  return result
}

// 家长建议文案（说人话）
function genParentAdvice(subject, weakItems) {
  if (!weakItems.length) return '目前各知识点掌握较好，继续保持每日练习！'
  const top = weakItems[0]
  const subjectLabel = subject === 'chinese' || subject === 'chinese_junior' ? '语文' : subject === 'english' ? '英语' : subject === 'math' ? '数学' : '道法'
  const acc = top.accuracy
  if (acc < 40) return `「${top.tag}」模块得分率仅 ${acc}%，属于严重薄弱。建议家长每天陪孩子专项练习 5 分钟，优先攻克这一块。`
  if (acc < 60) return `「${top.tag}」掌握不扎实，正确率 ${acc}%。建议本周在 App 里多练 ${subjectLabel}「${top.tag}」专项，每天 10 分钟可见效。`
  if (weakItems.length > 1) {
    const tags = weakItems.slice(0, 2).map(w => `「${w.tag}」`).join('和')
    return `整体表现不错，但 ${tags} 还需加强，可以利用零散时间多刷相关题目。`
  }
  return `「${top.tag}」稍显薄弱，建议多做专项练习，争取提到 80% 以上。`
}

// ── 主组件 ────────────────────────────────────────────────────
export default function ReportPage({ user, onBack, onStartQuiz, grade = 'primary' }) {
  const [pinInput, setPinInput] = useState('')
  const [unlocked, setUnlocked] = useState(false)
  const [pinError, setPinError] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [showPinModal, setShowPinModal] = useState(false)
  const [pinForm, setPinForm] = useState({ old: '', new1: '', new2: '' })
  const [pinMsg, setPinMsg] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showExportMenu, setShowExportMenu] = useState(false)

  function downloadFile(content, filename, type = 'text/plain') {
    const blob = new Blob(['﻿' + content], { type: `${type};charset=utf-8` })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportJSON() {
    const data = exportAll(user.id)
    downloadFile(JSON.stringify(data, null, 2), `${user.name}_学习数据_${new Date().toISOString().slice(0, 10)}.json`, 'application/json')
    setShowExportMenu(false)
  }

  function exportCSV() {
    const records = storage.getRecords(user.id)
    if (!records.length) { alert('暂无答题记录'); return }
    const headers = ['日期', '题目ID', '学科', '正确', '用时(秒)', '知识点', '能力标签', '用户答案']
    const rows = records.map(r => [
      r.timestamp?.slice(0, 19) || '', r.card_id || '', r.subject || '',
      r.correct ? '是' : '否', r.time_spent || '',
      r.knowledge_tag || '', r.ability_tag || '',
      `"${(r.selected_answer || '').replace(/"/g, '""')}"`,
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    downloadFile(csv, `${user.name}_答题记录_${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv')
    setShowExportMenu(false)
  }

  // ★ 按学段过滤学科Tab
  const subjects = GRADE_SUBJECTS[grade] || GRADE_SUBJECTS.primary

  // 考试日历
  const [examCalRefresh, setExamCalRefresh] = useState(0)
  const [showAddExam, setShowAddExam] = useState(false)
  const [newExam, setNewExam] = useState({ subject: 'chinese', name: '', date: '' })
  const [expandedExam, setExpandedExam] = useState(null)
  const [showScoreEntry, setShowScoreEntry] = useState(false)
  const [scoreEntry, setScoreEntry] = useState({
    examId: null, examName: '', subject: 'chinese',
    date: new Date().toISOString().slice(0, 10), score: '', totalScore: '100',
  })
  const [pendingErrorTags, setPendingErrorTags] = useState(null)
  const [selectedErrorTags, setSelectedErrorTags] = useState([])
  const [examResultRefresh, setExamResultRefresh] = useState(0)
  const fileRef = useRef(null)

  const allRecords = storage.getRecords(user.id)
  const sessions = storage.getSessions(user.id)
  const streak = storage.getStreak(user.id)

  const upcomingExams = useMemo(() => getUpcomingExams(user.id), [user.id, examCalRefresh])
  const allExams      = useMemo(() => getAllExams(user.id), [user.id, examCalRefresh])
  const examResults   = useMemo(() => getExamResults(user.id), [user.id, examResultRefresh])
  const taskCompletion = useMemo(() => getTaskCompletionHistory(user.id, 14), [user.id, activeTab])
  const heatmap        = useMemo(() => getActivityHeatmap(sessions), [sessions])
  const weeklyBalance  = useMemo(() => getWeeklySubjectBalance(user.id), [user.id])
  const examHistory    = useMemo(() => {
    try { return JSON.parse(localStorage.getItem(`exam_history_${user.id}`) || '[]') } catch { return [] }
  }, [user.id, activeTab])

  // 各科记录
  const chineseRecords  = useMemo(() => allRecords.filter(r => !r.subject || r.subject === 'chinese' || r.subject === 'chinese_junior'), [allRecords])
  const englishRecords  = useMemo(() => allRecords.filter(r => r.subject === 'english'), [allRecords])
  const mathRecords     = useMemo(() => allRecords.filter(r => r.subject === 'math'), [allRecords])
  const politicsRecords = useMemo(() => allRecords.filter(r => r.subject === 'politics'), [allRecords])

  // 判断哪些学科有足够数据
  const hasMath     = mathRecords.length >= 5
  const hasPolitics = politicsRecords.length >= 5

  // 各科诊断（按正确的分组键）
  const chineseDiagnosis  = useMemo(() => diagnoseByKey(chineseRecords, 'ability_tag'), [chineseRecords])
  const englishDiagnosis  = useMemo(() => diagnoseByKey(englishRecords, 'knowledge_tag'), [englishRecords])
  const mathDiagnosis     = useMemo(() => diagnoseByKey(mathRecords, 'knowledge_tag'), [mathRecords])
  const politicsDiagnosis = useMemo(() => diagnoseByKey(politicsRecords, 'knowledge_tag'), [politicsRecords])

  // 各科弱点（accuracy 从低到高）
  function getWeaks(diag) {
    return Object.entries(diag)
      .filter(([, d]) => d.status === 'weak' || d.status === 'slow')
      .sort((a, b) => a[1].accuracy - b[1].accuracy)
      .map(([tag, d]) => ({ tag, ...d }))
  }
  const chineseWeaks  = useMemo(() => getWeaks(chineseDiagnosis), [chineseDiagnosis])
  const englishWeaks  = useMemo(() => getWeaks(englishDiagnosis), [englishDiagnosis])
  const mathWeaks     = useMemo(() => getWeaks(mathDiagnosis), [mathDiagnosis])
  const politicsWeaks = useMemo(() => getWeaks(politicsDiagnosis), [politicsDiagnosis])

  const totalCorrect = allRecords.filter(r => r.correct).length
  const overallAcc   = allRecords.length > 0 ? Math.round((totalCorrect / allRecords.length) * 100) : 0
  const totalMin     = Math.round(sessions.reduce((s, ss) => s + (ss.durationSec || 0), 0) / 60)

  function handleUnlock(e) {
    e.preventDefault()
    const savedPin = storage.getParentPin()
    if (pinInput === (savedPin || user.pin || '1234')) { setUnlocked(true) }
    else { setPinError(true); setTimeout(() => setPinError(false), 1500) }
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-xl font-bold text-gray-800 mb-1">家长报告</h1>
        <p className="text-gray-400 text-sm mb-6">请输入家长密码查看</p>
        <form onSubmit={handleUnlock} className="w-full max-w-xs">
          <input autoFocus type="number" value={pinInput}
            onChange={e => setPinInput(e.target.value.slice(0, 4))} placeholder="4位密码"
            className={`w-full border-2 rounded-xl px-4 py-3 text-lg text-center mb-3 focus:outline-none transition-colors
              ${pinError ? 'border-red-400 bg-red-50' : 'border-indigo-200 focus:border-indigo-500'}`}
          />
          {pinError && <p className="text-red-500 text-sm text-center mb-2">密码错误</p>}
          <button type="submit" className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-xl">查看报告</button>
          <button type="button" onClick={onBack} className="mt-2 w-full text-gray-400 py-2 text-sm">← 返回</button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── 头部 ── */}
      <div className="bg-gradient-to-br from-indigo-700 to-purple-800 text-white px-5 pt-10 pb-6">
        <div className="flex items-center justify-between mb-3">
          <button onClick={onBack} className="text-indigo-200 text-sm">← 返回</button>
          <button onClick={() => setShowPinModal(true)} className="text-indigo-200 text-sm" title="修改密码">⚙️ 设置</button>
          <div className="relative">
            <button onClick={() => setShowExportMenu(!showExportMenu)} className="text-indigo-200 text-sm" title="导出数据">📥 导出</button>
            {showExportMenu && (
              <div className="absolute right-0 top-8 z-30 bg-white rounded-xl shadow-lg border border-gray-200 py-1 w-40">
                <button onClick={exportJSON} className="w-full text-left text-sm px-4 py-2.5 hover:bg-indigo-50 text-gray-700 flex items-center gap-2">
                  <span>📦</span> 全量数据 (JSON)
                </button>
                <button onClick={exportCSV} className="w-full text-left text-sm px-4 py-2.5 hover:bg-indigo-50 text-gray-700 flex items-center gap-2">
                  <span>📊</span> 答题记录 (CSV)
                </button>
              </div>
            )}
          </div>
        </div>
        <h1 className="text-2xl font-bold">{user.name} 的学习报告</h1>
        <p className="text-indigo-200 text-sm mt-1">共答 {allRecords.length} 题 · 累计 {totalMin} 分钟</p>
        <div className="flex gap-3 mt-4">
          {[
            { label: '综合正确率', value: `${overallAcc}%` },
            { label: '连续打卡',   value: `${streak.count}天` },
            { label: '学习次数',   value: `${sessions.length}次` },
          ].map(({ label, value }) => (
            <div key={label} className="flex-1 bg-white/10 rounded-xl p-3 text-center">
              <div className="text-xl font-bold">{value}</div>
              <div className="text-indigo-200 text-xs mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab 栏（横向滚动）── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm overflow-x-auto">
        <div className="flex min-w-max px-1">
          {subjects.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'text-indigo-600 border-indigo-500'
                  : 'text-gray-400 border-transparent'
              }`}
            >
              {tab.emoji} {tab.label}
              {tab.id === 'math' && mathRecords.length > 0 && (
                <span className="ml-1 text-xs text-gray-300">({mathRecords.length})</span>
              )}
            </button>
          ))}
          {hasPolitics && (
            <button onClick={() => setActiveTab('politics')}
              className={`px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
                activeTab === 'politics'
                  ? 'text-indigo-600 border-indigo-500'
                  : 'text-gray-400 border-transparent'
              }`}
            >
              ⚖️ 道法
            </button>
          )}
          <button onClick={() => setActiveTab('diagnosis')}
            className={`px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 flex items-center gap-1 ${
              activeTab === 'diagnosis'
                ? 'text-purple-600 border-purple-500'
                : 'text-gray-400 border-transparent'
            }`}
          >
            <span>🧬</span> 诊断
          </button>
        </div>
      </div>

      {/* ══ 诊断 Tab ══ */}
      {activeTab === 'diagnosis' && (
        <div className="px-4 pt-5 pb-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🧬</span>
            <div>
              <h2 className="text-base font-bold text-gray-800">深度学习诊断</h2>
              <p className="text-xs text-gray-400">错误归因 · 伪掌握检测 · 知识根因链</p>
            </div>
          </div>
          <PremiumDiagnosis user={user} />
        </div>
      )}

      {/* ══ 总览 Tab ══ */}
      {activeTab === 'overview' && (
        <div className="px-4 pt-5 space-y-4 pb-10">
          {/* 14天热力图 */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold text-gray-600 mb-3">近14天答题量</h2>
            <div className="flex gap-1.5 items-end">
              {heatmap.map(({ date, count }) => {
                const h = count > 0 ? Math.max(8, Math.min(48, count * 2)) : 4
                return (
                  <div key={date} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`w-full rounded-sm ${
                      count === 0 ? 'bg-gray-100' : count < 10 ? 'bg-indigo-200' : count < 20 ? 'bg-indigo-400' : 'bg-indigo-600'
                    }`} style={{ height: h }} />
                    <span className="text-gray-300 text-[9px]">{date.slice(8)}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 各科本周练习量 */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold text-gray-600 mb-3">本周各科练习量</h2>
            <div className="space-y-2.5">
              {[
                { id: 'chinese',  label: '语文', emoji: '📖', total: chineseRecords.length  },
                { id: 'english',  label: '英语', emoji: '🌎', total: englishRecords.length  },
                { id: 'math',     label: '数学', emoji: '🔢', total: mathRecords.length     },
                { id: 'politics', label: '道法', emoji: '⚖️', total: politicsRecords.length },
              ].map(({ id, label, emoji, total }) => {
                const w = weeklyBalance[id] || { count: 0 }
                const maxWeekly = Math.max(50, ...Object.values(weeklyBalance).map(v => v.count))
                const pct = maxWeekly > 0 ? Math.min(100, (w.count / maxWeekly) * 100) : 0
                if (total === 0 && w.count === 0) return null
                return (
                  <div key={id}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 font-medium">{emoji} {label}</span>
                      <span className={`font-bold ${w.count === 0 ? 'text-gray-300' : 'text-indigo-600'}`}>
                        {w.count === 0 ? '本周未练习' : `本周 ${w.count} 题`}
                        <span className="text-gray-400 font-normal ml-1">（共 {total} 题）</span>
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-indigo-400 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 今日任务完成 14天 */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold text-gray-600 mb-3">任务完成情况（近14天）</h2>
            <div className="flex gap-1 items-end">
              {taskCompletion.map(({ date, done }) => {
                const count = done.length
                const isToday = date === new Date().toISOString().slice(0, 10)
                return (
                  <div key={date} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`w-full rounded-sm ${
                      count === 0 ? 'bg-gray-100' : count === 1 ? 'bg-indigo-200' : count === 2 ? 'bg-indigo-400' : 'bg-indigo-600'
                    } ${isToday ? 'ring-2 ring-offset-1 ring-indigo-400' : ''}`}
                      style={{ height: count === 0 ? 4 : count * 10 + 4 }} />
                    <span className="text-[9px] text-gray-300">{date.slice(8)}</span>
                  </div>
                )
              })}
            </div>
            <div className="flex gap-3 mt-2 text-xs text-gray-400">
              <span className="text-indigo-500 font-medium">
                本周完成率 {Math.round(taskCompletion.slice(-7).filter(d => d.done.length >= 1).length / 7 * 100)}%
              </span>
              <span>·</span>
              <span>两周内全完成 {taskCompletion.filter(d => d.done.length >= 3).length} 天</span>
            </div>
          </div>

          {/* 全科弱点快速预览 */}
          {(chineseWeaks.length > 0 || englishWeaks.length > 0 || mathWeaks.length > 0) && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <h2 className="text-sm font-bold text-amber-800 mb-3">🎯 重点提升方向</h2>
              <div className="space-y-3">
                {chineseWeaks.length > 0 && (
                  <SubjectWeakSummary
                    emoji="📖" subject="语文" subjectId="chinese"
                    weaks={chineseWeaks.slice(0, 2)} onTabSwitch={setActiveTab}
                  />
                )}
                {englishWeaks.length > 0 && (
                  <SubjectWeakSummary
                    emoji="🌎" subject="英语" subjectId="english"
                    weaks={englishWeaks.slice(0, 2)} onTabSwitch={setActiveTab}
                  />
                )}
                {mathWeaks.length > 0 && (
                  <SubjectWeakSummary
                    emoji="🔢" subject="数学" subjectId="math"
                    weaks={mathWeaks.slice(0, 2)} onTabSwitch={setActiveTab}
                  />
                )}
              </div>
            </div>
          )}

          {/* 板块完成详情 */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold text-gray-600 mb-3">📋 各板块完成详情</h2>
            {(() => {
              // 按 knowledge_tag 分组统计
              const tagMap = {}
              for (const r of allRecords) {
                const tag = r.knowledge_tag || r.topic || '其他'
                if (!tagMap[tag]) tagMap[tag] = { total: 0, correct: 0, totalTime: 0 }
                tagMap[tag].total++
                if (r.correct) tagMap[tag].correct++
                tagMap[tag].totalTime += (r.time_spent || 0)
              }
              const tags = Object.entries(tagMap).sort((a, b) => b[1].total - a[1].total)
              if (tags.length === 0) return <p className="text-xs text-gray-400">暂无数据</p>
              return (
                <div className="space-y-2.5">
                  {tags.map(([tag, d]) => {
                    const acc = d.total > 0 ? Math.round(d.correct / d.total * 100) : 0
                    const avgTime = d.total > 0 ? (d.totalTime / d.total).toFixed(1) : 0
                    let seriousness, seriousColor
                    if (avgTime < 5) { seriousness = '⚡ 太快了'; seriousColor = 'text-red-500' }
                    else if (avgTime < 20) { seriousness = '✅ 认真'; seriousColor = 'text-green-600' }
                    else { seriousness = '🤔 很仔细'; seriousColor = 'text-blue-600' }
                    return (
                      <div key={tag} className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-semibold text-gray-800">{tag}</span>
                          <span className={`text-xs font-bold ${seriousColor}`}>{seriousness}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1 text-center text-xs">
                          <div><span className="font-bold text-gray-700">{d.total}</span><br/><span className="text-gray-400">总题数</span></div>
                          <div><span className="font-bold text-green-600">{d.correct}</span><br/><span className="text-gray-400">答对</span></div>
                          <div><span className={`font-bold ${acc >= 80 ? 'text-green-600' : acc >= 60 ? 'text-amber-500' : 'text-red-500'}`}>{acc}%</span><br/><span className="text-gray-400">正确率</span></div>
                          <div><span className="font-bold text-indigo-600">{avgTime}s</span><br/><span className="text-gray-400">平均用时</span></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* ══ 语文 Tab ══ */}
      {activeTab === 'chinese' && (
        <SubjectReport
          subject="chinese"
          records={chineseRecords}
          diagnosis={chineseDiagnosis}
          weaks={chineseWeaks}
          diagnosisKey="ability_tag"
          knowledgeMap={ABILITY_TO_KNOWLEDGE}
          iconMap={CHINESE_KNOWLEDGE_ICON}
          onStartQuiz={onStartQuiz}
          onBack={onBack}
          userId={user.id}
          onDeleteRecord={() => setRefreshKey(k => k + 1)}
        />
      )}

      {/* ══ 英语 Tab ══ */}
      {activeTab === 'english' && (
        <SubjectReport
          subject="english"
          records={englishRecords}
          diagnosis={englishDiagnosis}
          weaks={englishWeaks}
          diagnosisKey="knowledge_tag"
          labelMap={ENGLISH_KNOWLEDGE_LABEL}
          onStartQuiz={onStartQuiz}
          onBack={onBack}
          userId={user.id}
          onDeleteRecord={() => setRefreshKey(k => k + 1)}
        />
      )}

      {/* ══ 数学 Tab ══ */}
      {activeTab === 'math' && (
        <SubjectReport
          subject="math"
          records={mathRecords}
          diagnosis={mathDiagnosis}
          weaks={mathWeaks}
          diagnosisKey="knowledge_tag"
          iconMap={MATH_KNOWLEDGE_ICON}
          onStartQuiz={onStartQuiz}
          onBack={onBack}
          userId={user.id}
          onDeleteRecord={() => setRefreshKey(k => k + 1)}
        />
      )}

      {/* ══ 道法 Tab ══ */}
      {activeTab === 'politics' && (
        <SubjectReport
          subject="politics"
          records={politicsRecords}
          diagnosis={politicsDiagnosis}
          weaks={politicsWeaks}
          diagnosisKey="knowledge_tag"
          defaultIcon={POLITICS_ICON}
          onStartQuiz={onStartQuiz}
          onBack={onBack}
          userId={user.id}
          onDeleteRecord={() => setRefreshKey(k => k + 1)}
        />
      )}

      {/* ══ 考试 Tab ══ */}
      {activeTab === 'exams' && (
        <ExamsTab
          user={user}
          upcomingExams={upcomingExams}
          allExams={allExams}
          examResults={examResults}
          examHistory={examHistory}
          expandedExam={expandedExam}
          setExpandedExam={setExpandedExam}
          showAddExam={showAddExam}
          setShowAddExam={setShowAddExam}
          newExam={newExam}
          setNewExam={setNewExam}
          showScoreEntry={showScoreEntry}
          setShowScoreEntry={setShowScoreEntry}
          scoreEntry={scoreEntry}
          setScoreEntry={setScoreEntry}
          pendingErrorTags={pendingErrorTags}
          setPendingErrorTags={setPendingErrorTags}
          selectedErrorTags={selectedErrorTags}
          setSelectedErrorTags={setSelectedErrorTags}
          examCalRefresh={examCalRefresh}
          setExamCalRefresh={setExamCalRefresh}
          examResultRefresh={examResultRefresh}
          setExamResultRefresh={setExamResultRefresh}
        />
      )}

      {/* PIN 修改 Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-6" onClick={() => setShowPinModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-800 mb-4">⚙️ 修改家长密码</h2>
            <div className="space-y-3">
              <input type="number" maxLength={4} placeholder="输入旧密码"
                value={pinForm.old} onChange={e => setPinForm({ ...pinForm, old: e.target.value.slice(0, 4) })}
                className="w-full border rounded-xl px-4 py-2.5 text-center text-lg focus:outline-none focus:border-indigo-500" />
              <input type="number" maxLength={4} placeholder="输入新密码（4位）"
                value={pinForm.new1} onChange={e => setPinForm({ ...pinForm, new1: e.target.value.slice(0, 4) })}
                className="w-full border rounded-xl px-4 py-2.5 text-center text-lg focus:outline-none focus:border-indigo-500" />
              <input type="number" maxLength={4} placeholder="确认新密码"
                value={pinForm.new2} onChange={e => setPinForm({ ...pinForm, new2: e.target.value.slice(0, 4) })}
                className="w-full border rounded-xl px-4 py-2.5 text-center text-lg focus:outline-none focus:border-indigo-500" />
            </div>
            {pinMsg && <p className={`text-sm text-center mt-2 ${pinMsg.ok ? 'text-green-600' : 'text-red-500'}`}>{pinMsg.text}</p>}
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setShowPinModal(false); setPinForm({ old: '', new1: '', new2: '' }); setPinMsg(null) }}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-medium">取消</button>
              <button onClick={() => {
                const savedPin = storage.getParentPin()
                if (pinForm.old !== (savedPin || user.pin || '1234')) { setPinMsg({ ok: false, text: '旧密码错误' }); return }
                if (pinForm.new1.length !== 4) { setPinMsg({ ok: false, text: '新密码必须4位' }); return }
                if (pinForm.new1 !== pinForm.new2) { setPinMsg({ ok: false, text: '两次输入不一致' }); return }
                storage.setParentPin(pinForm.new1)
                storage.setUser({ ...user, pin: pinForm.new1 })
                setPinMsg({ ok: true, text: '修改成功！' })
                setTimeout(() => { setShowPinModal(false); setPinForm({ old: '', new1: '', new2: '' }); setPinMsg(null) }, 1200)
              }}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-medium">确认修改</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── 各科报告子组件 ──────────────────────────────────────────
function SubjectReport({
  subject, records, diagnosis, weaks,
  diagnosisKey, knowledgeMap, labelMap, iconMap, defaultIcon,
  onStartQuiz, onBack, userId, onDeleteRecord,
}) {
  const [deletingId, setDeletingId] = useState(null)
  const subjectLabel = { chinese: '语文', english: '英语', math: '数学', politics: '道法' }[subject]

  if (records.length < 5) {
    return (
      <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="text-5xl mb-4">📊</div>
        <h2 className="text-lg font-bold text-gray-700 mb-2">数据不足</h2>
        <p className="text-gray-400 text-sm">至少答 5 道{subjectLabel}题后才能生成分析</p>
        <p className="text-gray-300 text-sm mt-1">当前：{records.length} 题</p>
      </div>
    )
  }

  const correctCount = records.filter(r => r.correct).length
  const accuracy = Math.round((correctCount / records.length) * 100)

  // 按分组 key 汇总（用于进度条）
  const domainSummary = Object.entries(diagnosis)
    .sort((a, b) => a[1].accuracy - b[1].accuracy)

  // 雷达图数据（最多8个标签）
  const radarData = domainSummary.slice(0, 8).map(([tag, d]) => ({
    subject: labelMap?.[tag] || tag,
    value: d.accuracy,
    fullMark: 100,
  }))

  const parentAdvice = genParentAdvice(subject, weaks)

  return (
    <div className="px-4 pt-5 space-y-4 pb-10">
      {/* 本科概况 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-600">{subjectLabel}整体情况</h2>
          <span className={`text-lg font-bold ${accuracy >= 80 ? 'text-green-600' : accuracy >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
            {accuracy}%
          </span>
        </div>
        <div className="flex gap-3">
          {[
            { label: '已答题目', value: records.length + '题' },
            { label: '答对题目', value: correctCount + '题' },
            { label: '正确率',   value: accuracy + '%' },
          ].map(({ label, value }) => (
            <div key={label} className="flex-1 text-center bg-gray-50 rounded-xl py-2">
              <div className="font-bold text-gray-800">{value}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 知识点掌握度 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h2 className="text-sm font-semibold text-gray-600 mb-3">各知识点掌握度</h2>
        <div className="space-y-3">
          {domainSummary.map(([tag, { accuracy: acc, total, status }]) => {
            const icon = iconMap?.[tag] || defaultIcon || '•'
            const label = labelMap?.[tag] || tag
            return (
              <div key={tag}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-700 font-medium flex items-center gap-1.5">
                    <span>{icon}</span>{label}
                    <span className="text-xs text-gray-300 font-normal">({total}题)</span>
                  </span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full`}
                    style={{ color: STATUS_COLOR[status], background: STATUS_COLOR[status] + '18' }}>
                    {acc}% · {STATUS_LABEL[status]}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className="h-2 rounded-full transition-all"
                    style={{ width: `${acc}%`, background: STATUS_COLOR[status] }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 雷达图（≥3个知识点才显示） */}
      {radarData.length >= 3 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-600 mb-1">能力雷达图</h2>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
              <Radar dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
              <Tooltip formatter={v => `${v}%`} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 家长建议 */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4">
        <h2 className="text-sm font-bold text-amber-800 mb-2">👨‍👩‍👧 家长建议</h2>
        <p className="text-sm text-amber-900 leading-relaxed">{parentAdvice}</p>

        {weaks.length > 0 && (
          <div className="mt-3 space-y-2">
            {weaks.slice(0, 3).map(({ tag, accuracy: acc, status, total }, i) => {
              const label = labelMap?.[tag] || tag
              const knowledgeTag = knowledgeMap ? (knowledgeMap[tag] || tag) : tag
              return (
                <div key={tag} className="flex items-start gap-2.5 bg-white rounded-xl p-3">
                  <span className={`flex-shrink-0 w-5 h-5 rounded-full text-white text-xs flex items-center justify-center font-bold
                    ${i === 0 ? 'bg-red-500' : i === 1 ? 'bg-orange-400' : 'bg-amber-400'}`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-800">{label}</span>
                      <span className="text-xs font-bold" style={{ color: STATUS_COLOR[status] }}>
                        {acc}%（{total}题）
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {status === 'weak'
                        ? acc < 50 ? '掌握较差，建议优先突破' : '尚未达标，需要专项强化'
                        : '答对但反应慢，需提升熟练度'}
                    </p>
                    {/* 语文专项练习快捷入口 */}
                    {onStartQuiz && subject === 'chinese' && (
                      <button
                        onClick={() => { onStartQuiz({ knowledgeTag, focusTag: tag }); onBack() }}
                        className="mt-1.5 text-xs bg-indigo-50 text-indigo-600 font-bold px-3 py-1 rounded-lg"
                      >
                        🎯 专项练习 →
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 🚩 孩子标记的题目（有问题） */}
      {(() => {
        const flagged = storage.getFlaggedQuestions(userId)
        const subjectFlagged = Object.entries(flagged).filter(([, v]) => {
          if (subject === 'english') return v.subject === 'english'
          if (subject === 'math') return v.subject === 'math'
          if (subject === 'politics') return v.subject === 'politics'
          return !v.subject || v.subject === 'chinese'
        })
        if (subjectFlagged.length === 0) return null
        return (
          <div className="bg-amber-50 rounded-2xl p-4 shadow-sm border border-amber-200">
            <h2 className="text-sm font-semibold text-amber-700 mb-3">
              🚩 孩子标记的题目（{subjectFlagged.length}）
              <span className="text-xs text-amber-500 font-normal ml-1">— 孩子觉得这些题有问题，请审核</span>
            </h2>
            <div className="space-y-2">
              {subjectFlagged.map(([cardId, info]) => (
                <div key={cardId} className="bg-white rounded-xl p-3 border border-amber-100">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 line-clamp-2">{info.question_preview || FULL_Q_MAP[cardId]?.question?.split('\n')[0] || cardId}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full">{info.reason}</span>
                        <span className="text-[10px] text-gray-400">{info.timestamp?.slice(0, 10)}</span>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => {
                          storage.deleteRecordsByCardId(userId, cardId)
                          storage.unflagQuestion(userId, cardId)
                          onDeleteRecord?.()
                        }}
                        className="text-[10px] px-2 py-1.5 rounded-lg bg-red-100 text-red-500 font-bold active:scale-95 hover:bg-red-200"
                      >
                        🗑️ 删错题
                      </button>
                      <button
                        onClick={() => {
                          storage.unflagQuestion(userId, cardId)
                          onDeleteRecord?.()
                        }}
                        className="text-[10px] px-2 py-1.5 rounded-lg bg-gray-100 text-gray-500 font-bold active:scale-95 hover:bg-gray-200"
                      >
                        取消标记
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* 错题管理 */}
      {(() => {
        const latestMap = {}
        for (const r of records) {
          if (!latestMap[r.card_id] || r.timestamp > latestMap[r.card_id].timestamp) {
            latestMap[r.card_id] = r
          }
        }
        const wrongItems = Object.entries(latestMap)
          .filter(([, r]) => !r.correct)
          .sort((a, b) => b[1].timestamp?.localeCompare?.(a[1].timestamp))
          .slice(0, 20)
        if (wrongItems.length === 0) return null
        return (
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <h2 className="text-sm font-semibold text-gray-600 mb-3">
              ❌ 错题记录
              <span className="text-xs text-gray-400 font-normal ml-1">（共 {wrongItems.length} 题，点击🗑️删除）</span>
            </h2>
            <div className="space-y-2">
              {wrongItems.map(([cardId, r]) => (
                <div key={cardId} className="flex items-start gap-2 bg-red-50 rounded-xl p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 line-clamp-2">{r.question_data?.stem || FULL_Q_MAP[cardId]?.question?.split('\n')[0] || cardId}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {r.knowledge_tag && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">{r.knowledge_tag}</span>}
                      <span className="text-[10px] text-gray-400">{r.timestamp?.slice(0, 10)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (deletingId === cardId) {
                        storage.deleteRecordsByCardId(userId, cardId)
                        setDeletingId(null)
                        onDeleteRecord?.()
                      } else {
                        setDeletingId(cardId)
                        setTimeout(() => setDeletingId(null), 3000)
                      }
                    }}
                    className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors ${
                      deletingId === cardId ? 'bg-red-500 text-white' : 'bg-red-100 text-red-400 hover:bg-red-200'
                    }`}
                  >
                    {deletingId === cardId ? '确认' : '🗑️'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      })()}
    </div>
  )
}

// ── 总览-弱点摘要行 ──────────────────────────────────────────
function SubjectWeakSummary({ emoji, subject, subjectId, weaks, onTabSwitch }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-base">{emoji}</span>
        <span className="text-sm font-semibold text-gray-700">{subject}</span>
        <button onClick={() => onTabSwitch(subjectId)}
          className="ml-auto text-xs text-indigo-500 font-medium">查看详情 →</button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {weaks.map(w => (
          <span key={w.tag} className="text-xs px-2.5 py-1 rounded-lg font-medium text-white"
            style={{ background: STATUS_COLOR[w.status] }}>
            {w.tag} {w.accuracy}%
          </span>
        ))}
      </div>
    </div>
  )
}

// ── 考试 Tab ────────────────────────────────────────────────
function ExamsTab({
  user, upcomingExams, allExams, examResults, examHistory,
  expandedExam, setExpandedExam,
  showAddExam, setShowAddExam, newExam, setNewExam,
  showScoreEntry, setShowScoreEntry, scoreEntry, setScoreEntry,
  pendingErrorTags, setPendingErrorTags, selectedErrorTags, setSelectedErrorTags,
  examCalRefresh, setExamCalRefresh, examResultRefresh, setExamResultRefresh,
}) {
  const SUBJECT_TAGS = {
    chinese:  ['字词', '古诗词', '成语', '句子', '文学常识', '阅读理解', '写作',
               '字音辨析', '字形辨析', '词语运用', '病句辨析', '标点符号', '句子排序',
               '古诗文默写', '古诗词赏析', '古诗文常识', '文言文翻译',
               '实词解释', '虚词用法', '句式翻译', '文言文阅读',
               '名著阅读', '仿写句子', '语言得体', '信息概括', '图文转换', '综合性学习'],
    english:  ['词汇', '语法', '听力', '阅读', '写作'],
    math:     ['计算', '应用题', '几何图形', '数据分析'],
    politics: ['法律法规', '公民权利', '国家制度', '时事政治'],
  }

  // AI 自测记录详情渲染
  function renderExamQuestion(q, idx, answers, aiScores, earnedScores) {
    if (!q || q.type === 'listenPassage' || q.type === 'passage') {
      return (
        <div key={idx} className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 my-2">
          <span className="text-xs font-bold text-indigo-600">{q?.type === 'listenPassage' ? '🎧 听力材料' : '📖 阅读材料'}</span>
          <p className="text-sm text-gray-700 mt-1">{q?.text}</p>
        </div>
      )
    }
    const userAns = answers?.[q.id]
    const correct = q.answer
    const earned  = earnedScores?.[q.id]
    const isCorrect = earned !== undefined
      ? earned >= (q.score || 0)
      : (userAns !== undefined && (
          (q.type === 'choice' || q.type === 'listen') ? Number(userAns) === Number(correct)
          : q.type === 'truefalse' ? String(userAns) === String(correct) : null))
    return (
      <div key={q.id || idx} className={`rounded-xl p-3 mb-2 border ${
        isCorrect === true ? 'bg-green-50 border-green-200' :
        isCorrect === false ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <p className="text-sm text-gray-800 leading-relaxed">{q.stem}</p>
            {(q.type === 'choice' || q.type === 'listen') && q.options && (
              <div className="mt-2 space-y-1">
                {q.options.map((opt, oi) => {
                  const isUser  = Number(userAns) === oi
                  const isRight = Number(correct) === oi
                  return (
                    <div key={oi} className={`flex items-center gap-2 rounded-lg px-2 py-1 text-xs ${
                      isRight ? 'bg-green-100 text-green-800 font-semibold' :
                      isUser && !isRight ? 'bg-red-100 text-red-700 line-through' : 'text-gray-600'}`}>
                      <span className="font-bold w-4">{['A','B','C','D'][oi]}.</span>
                      <span>{opt}</span>
                      {isRight && <span className="ml-auto text-green-600">✓正确</span>}
                      {isUser && !isRight && <span className="ml-auto text-red-500">✗我选</span>}
                    </div>
                  )
                })}
              </div>
            )}
            {q.analysis && (
              <p className="mt-1.5 text-xs text-indigo-600 bg-indigo-50 rounded px-2 py-1">💡 {q.analysis}</p>
            )}
          </div>
          <div className="text-xs flex-shrink-0 text-right">
            {earned !== undefined ? (
              <span className={earned >= (q.score || 0) ? 'text-green-600 font-bold' : earned > 0 ? 'text-amber-600 font-bold' : 'text-red-500 font-bold'}>
                {earned}/{q.score}
              </span>
            ) : <span className="text-gray-400">{q.score}分</span>}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 space-y-4 pb-10">
      {/* 考试日历 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">📅 考试日历</h2>
          <button onClick={() => setShowAddExam(v => !v)}
            className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-semibold">
            + 添加考试
          </button>
        </div>
        {showAddExam && (
          <div className="bg-indigo-50 rounded-xl p-3 mb-3 space-y-2">
            <select value={newExam.subject} onChange={e => setNewExam(v => ({ ...v, subject: e.target.value }))}
              className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700">
              <option value="chinese">📖 语文</option>
              <option value="english">🌎 英语</option>
              <option value="math">🔢 数学</option>
              <option value="all">📚 全科</option>
            </select>
            <input type="text" placeholder="考试名称（如：期中语文考试）" value={newExam.name}
              onChange={e => setNewExam(v => ({ ...v, name: e.target.value }))}
              className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700" />
            <input type="date" value={newExam.date}
              onChange={e => setNewExam(v => ({ ...v, date: e.target.value }))}
              className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700" />
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
                className="flex-1 bg-indigo-600 disabled:bg-gray-300 text-white text-sm font-bold py-2 rounded-lg">
                保存
              </button>
              <button onClick={() => setShowAddExam(false)}
                className="px-4 bg-gray-100 text-gray-500 text-sm py-2 rounded-lg">取消</button>
            </div>
          </div>
        )}
        {upcomingExams.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-4">
            录入考试日期后，系统会自动生成倒计时提醒。
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
                    <span className="text-[9px] opacity-80">天后</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{exam.name}</p>
                    <p className="text-xs text-gray-400">{exam.date}</p>
                  </div>
                  <button onClick={() => { removeExam(user.id, exam.id); setExamCalRefresh(k => k + 1) }}
                    className="text-gray-300 hover:text-red-400 text-lg">×</button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 真实成绩录入 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">🏫 真实考试成绩</h2>
          <button onClick={() => { setShowScoreEntry(v => !v); setPendingErrorTags(null); setSelectedErrorTags([]) }}
            className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-semibold">
            + 录入成绩
          </button>
        </div>
        {showScoreEntry && !pendingErrorTags && (
          <div className="bg-indigo-50 rounded-xl p-3 mb-3 space-y-2">
            <select value={scoreEntry.examId || ''}
              onChange={e => {
                const exam = allExams.find(x => x.id === e.target.value)
                setScoreEntry(v => ({ ...v, examId: e.target.value || null, examName: exam?.name || v.examName, subject: exam?.subject || v.subject, date: exam?.date || v.date }))
              }}
              className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700">
              <option value="">📅 选择已有考试（可选）</option>
              {allExams.map(e => <option key={e.id} value={e.id}>{e.name} · {e.date}</option>)}
            </select>
            <input type="text" placeholder="考试名称" value={scoreEntry.examName}
              onChange={e => setScoreEntry(v => ({ ...v, examName: e.target.value }))}
              className="w-full border border-indigo-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700" />
            <div className="flex gap-2">
              <select value={scoreEntry.subject} onChange={e => setScoreEntry(v => ({ ...v, subject: e.target.value }))}
                className="flex-1 border border-indigo-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700">
                <option value="chinese">📖 语文</option>
                <option value="english">🌎 英语</option>
                <option value="math">🔢 数学</option>
              </select>
              <input type="date" value={scoreEntry.date}
                onChange={e => setScoreEntry(v => ({ ...v, date: e.target.value }))}
                className="flex-1 border border-indigo-200 rounded-lg px-2 py-2 text-sm bg-white text-gray-700" />
            </div>
            <div className="flex gap-2 items-center">
              <input type="number" placeholder="得分" value={scoreEntry.score}
                onChange={e => setScoreEntry(v => ({ ...v, score: e.target.value }))}
                className="flex-1 border border-indigo-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700" />
              <span className="text-gray-400">/</span>
              <input type="number" placeholder="满分" value={scoreEntry.totalScore}
                onChange={e => setScoreEntry(v => ({ ...v, totalScore: e.target.value }))}
                className="flex-1 border border-indigo-200 rounded-lg px-3 py-2 text-sm bg-white text-gray-700" />
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
                className="flex-1 bg-indigo-600 disabled:bg-gray-300 text-white text-sm font-bold py-2 rounded-lg">
                保存 → 标记错题知识点
              </button>
              <button onClick={() => setShowScoreEntry(false)}
                className="px-4 bg-gray-100 text-gray-500 text-sm py-2 rounded-lg">取消</button>
            </div>
          </div>
        )}
        {pendingErrorTags && (() => {
          const subjectTags = SUBJECT_TAGS[scoreEntry.subject] || SUBJECT_TAGS.chinese
          return (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-3">
              <p className="text-sm font-bold text-orange-700 mb-1">✏️ 哪些知识点这次考试答错了？</p>
              <p className="text-xs text-gray-400 mb-3">标记后会加权到今日任务推荐</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {subjectTags.map(tag => {
                  const sel = selectedErrorTags.includes(tag)
                  return (
                    <button key={tag} onClick={() => setSelectedErrorTags(prev => sel ? prev.filter(t => t !== tag) : [...prev, tag])}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        sel ? 'bg-orange-500 text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200'}`}>
                      {sel ? '✓ ' : ''}{tag}
                    </button>
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
                    setScoreEntry({ examId: null, examName: '', subject: 'chinese', date: new Date().toISOString().slice(0, 10), score: '', totalScore: '100' })
                  }}
                  className="flex-1 bg-orange-500 text-white text-sm font-bold py-2 rounded-lg">
                  完成（{selectedErrorTags.length}个知识点）
                </button>
                <button onClick={() => { setPendingErrorTags(null); setShowScoreEntry(false) }}
                  className="px-4 bg-gray-100 text-gray-500 text-sm py-2 rounded-lg">跳过</button>
              </div>
            </div>
          )
        })()}
        {examResults.length === 0 && !showScoreEntry ? (
          <p className="text-xs text-gray-400 text-center py-4">点击「录入成绩」添加孩子的真实考试成绩</p>
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
                          <span key={t} className="text-[10px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <button onClick={() => { removeExamResult(user.id, r.id); setExamResultRefresh(k => k + 1) }}
                    className="text-gray-300 hover:text-red-400 text-lg flex-shrink-0">×</button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* AI 自测记录 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <h2 className="text-sm font-semibold text-gray-600 mb-3">🤖 AI 自测记录</h2>
        {expandedExam ? (
          <div>
            <button onClick={() => setExpandedExam(null)}
              className="flex items-center gap-1 text-indigo-600 text-sm font-medium mb-4">← 返回列表</button>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-bold text-gray-800">{expandedExam.title || 'AI 自测'}</h2>
                <span className={`text-lg font-bold ${
                  expandedExam.score >= 80 ? 'text-green-600' : expandedExam.score >= 60 ? 'text-amber-500' : 'text-red-500'}`}>
                  {expandedExam.score}分
                </span>
              </div>
              <p className="text-xs text-gray-400">
                {expandedExam.date?.slice(0, 10)} ·{' '}
                {expandedExam.subject === 'english' ? '英语' : expandedExam.subject === 'politics' ? '道法' : '语文'}
              </p>
            </div>
            {(expandedExam.examData?.sections || []).map((sec, si) => {
              const secQs = sec.subsections
                ? sec.subsections.flatMap(sub => sub.questions || [])
                : (sec.questions || [])
              return (
                <div key={si} className="mb-4">
                  <div className="bg-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-xl mb-2">{sec.title}</div>
                  {secQs.map((q, qi) =>
                    renderExamQuestion(q, qi, expandedExam.answers, expandedExam.aiScores, expandedExam.earnedScores)
                  )}
                </div>
              )
            })}
          </div>
        ) : examHistory.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">完成 AI 自测后，成绩会自动保存到这里</p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-gray-400 mb-1">共 {examHistory.length} 次</p>
            {examHistory.map(exam => (
              <button key={exam.id} onClick={() => setExpandedExam(exam)}
                className="w-full bg-gray-50 rounded-xl p-3 flex items-center gap-3 active:bg-gray-100 text-left">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                  exam.score >= 80 ? 'bg-green-100 text-green-700' :
                  exam.score >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
                  {exam.score}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{exam.title || 'AI 自测'}</p>
                  <p className="text-xs text-gray-400">
                    {exam.date?.slice(0, 10)} · {exam.subject === 'english' ? '英语' : exam.subject === 'politics' ? '道法' : '语文'}
                  </p>
                </div>
                <div className="text-gray-300 text-lg">›</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
