import { useState, useEffect, useMemo } from 'react'
import { storage } from '../utils/storage'
import { generatePremiumReport } from '../utils/diagnosis'
import { generateActionPlan, getCachedActionPlan, shouldRegenerateReport } from '../utils/premiumAI'
import { ERROR_TYPES, RISK_LEVELS } from '../data/knowledge_graph'
import RootCauseChain from './RootCauseChain'
import ActionPlanCard from './ActionPlanCard'

// 学科配置
const SUBJECT_TABS = {
  primary: [
    { id: 'all', label: '全科总览', emoji: '📊' },
    { id: 'chinese', label: '语文', emoji: '📖' },
    { id: 'english', label: '英语', emoji: '🌎' },
    { id: 'math', label: '数学', emoji: '🔢' },
  ],
  junior2: [
    { id: 'all', label: '全科总览', emoji: '📊' },
    { id: 'chinese', label: '语文', emoji: '📖' },
    { id: 'english', label: '英语', emoji: '🌎' },
    { id: 'math', label: '数学', emoji: '🔢' },
    { id: 'politics', label: '道法', emoji: '⚖️' },
  ],
}

function filterBySubject(records, subjectId) {
  if (subjectId === 'all') return records
  if (subjectId === 'chinese') return records.filter(r => !r.subject || r.subject === 'chinese' || r.subject === 'chinese_junior')
  if (subjectId === 'english') return records.filter(r => r.subject === 'english')
  if (subjectId === 'math') return records.filter(r => r.subject === 'math')
  if (subjectId === 'politics') return records.filter(r => r.subject === 'politics')
  return records
}

// 学科中文名
const SUBJECT_NAMES = { all: '全科', chinese: '语文', english: '英语', math: '数学', politics: '道法' }

// 错误类型色系
const TYPE_STYLE = {
  concept: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-500', ring: 'ring-red-200' },
  memory: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-500', ring: 'ring-amber-200' },
  careless: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600', badge: 'bg-slate-400', ring: 'ring-slate-200' },
}

export default function PremiumDiagnosis({ user, grade = 'primary' }) {
  const [isPremium, setIsPremium] = useState(false)
  const [subjectTab, setSubjectTab] = useState('all')
  const [expandedSection, setExpandedSection] = useState(null)
  const [showPaywall, setShowPaywall] = useState(false)

  const tabs = SUBJECT_TABS[grade] || SUBJECT_TABS.primary

  useEffect(() => {
    if (user?.id) setIsPremium(storage.isPremiumActive(user.id))
  }, [user?.id])

  const allRecords = useMemo(() => storage.getRecords(user.id), [user?.id])
  const sessions = useMemo(() => storage.getSessions(user.id), [user?.id])
  const filteredRecords = useMemo(() => filterBySubject(allRecords, subjectTab), [allRecords, subjectTab])

  const report = useMemo(() => {
    if (!filteredRecords.length) return null
    const cacheKey = `${user.id}_${subjectTab}`
    const cached = storage.getPremiumReport(cacheKey)
    if (cached && !shouldRegenerateReport(cacheKey, filteredRecords.length)) return cached
    const newReport = generatePremiumReport(filteredRecords, sessions)
    storage.setPremiumReport(cacheKey, newReport)
    return newReport
  }, [filteredRecords, sessions, user?.id, subjectTab])

  const [actionPlan, setActionPlan] = useState(null)
  const [planLoading, setPlanLoading] = useState(false)

  useEffect(() => {
    if (!user?.id || !report) { setActionPlan(null); return }
    const cacheKey = `${user.id}_${subjectTab}`
    setActionPlan(getCachedActionPlan(cacheKey))
  }, [user?.id, subjectTab, report])

  function handleActivateTrial() {
    if (!user?.id) return
    storage.activatePremiumTrial(user.id)
    setIsPremium(true)
  }

  async function handleGeneratePlan() {
    if (!report || !user?.id) return
    setPlanLoading(true)
    try {
      const g = storage.getGrade()
      const subjectLabel = SUBJECT_NAMES[subjectTab] || '全科'
      const plan = await generateActionPlan(report, { grade: g, subject: subjectLabel })
      const planWithMeta = { ...plan, generatedAt: new Date().toISOString() }
      setActionPlan(planWithMeta)
      const cacheKey = `${user.id}_${subjectTab}`
      storage.setActionPlan(cacheKey, planWithMeta)
    } catch (e) {
      console.warn('Action plan generation failed:', e)
    } finally {
      setPlanLoading(false)
    }
  }

  // ── 无数据状态 ──
  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <div className="text-4xl mb-3">📊</div>
        <p className="text-sm text-gray-500 text-center">
          {filteredRecords.length === 0 && subjectTab !== 'all'
            ? `${SUBJECT_NAMES[subjectTab]}暂无答题记录，做题后即可生成诊断报告`
            : '暂无学习数据，做题后即可生成诊断报告'}
        </p>
      </div>
    )
  }

  const { summary, errorAttribution, pseudoMastery, rootCauses, weakTags } = report
  const hasData = summary.totalQuestions > 0
  const subjectLabel = SUBJECT_NAMES[subjectTab] || '全科'
  const currentEmoji = tabs.find(t => t.id === subjectTab)?.emoji || '📊'

  // 计算风险评分（免费预览用的）
  const riskScore = useMemo(() => {
    if (!hasData) return 0
    let score = 0
    // 正确率权重
    score += Math.max(0, (100 - summary.accuracy) * 0.4)
    // 错误归因数量
    score += Object.keys(errorAttribution).length * 5
    // 伪掌握
    score += Object.values(pseudoMastery).filter(p => p.riskLevel === 'high').length * 10
    return Math.min(100, Math.round(score))
  }, [summary, errorAttribution, pseudoMastery, hasData])

  const riskLevel = riskScore >= 60 ? 'high' : riskScore >= 35 ? 'medium' : 'low'
  const riskConfig = {
    high: { color: '#ef4444', bg: 'bg-red-50', border: 'border-red-200', label: '需要重点关注', desc: '存在较明显的知识薄弱环节，建议尽快制定针对性提升计划' },
    medium: { color: '#f59e0b', bg: 'bg-amber-50', border: 'border-amber-200', label: '有提升空间', desc: '部分知识点掌握不牢固，及时巩固可以快速提分' },
    low: { color: '#22c55e', bg: 'bg-green-50', border: 'border-green-200', label: '基础扎实', desc: '各知识点掌握较好，继续保持，防止遗忘' },
  }
  const risk = riskConfig[riskLevel]

  return (
    <div className="space-y-4 pb-6">
      {/* 学科子Tab */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setSubjectTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
              subjectTab === tab.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'bg-white text-gray-500 border border-gray-200 active:bg-gray-50'
            }`}
          >
            <span>{tab.emoji}</span> {tab.label}
          </button>
        ))}
      </div>

      {/* ══ 报告头部：风险评分 + 概要 ══ */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* 风险评分横幅 */}
        <div className={`${risk.bg} px-5 py-4 border-b ${risk.border}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">{currentEmoji}</span>
                <span className="text-sm font-bold text-gray-800">{subjectLabel}学习诊断</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold text-white`}
                  style={{ background: risk.color }}>
                  {risk.label}
                </span>
              </div>
              <p className="text-xs text-gray-600">{risk.desc}</p>
            </div>
            <div className="flex-shrink-0 ml-4">
              <div className="relative w-16 h-16">
                <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke={risk.color} strokeWidth="3"
                    strokeDasharray={`${riskScore} ${100 - riskScore}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-lg font-extrabold" style={{ color: risk.color }}>{riskScore}</span>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-0.5">风险指数</p>
            </div>
          </div>
        </div>

        {/* 概要数据 */}
        <div className="grid grid-cols-4 divide-x divide-gray-100 py-3">
          {[
            { value: summary.totalQuestions, label: '答题量', color: 'text-indigo-600' },
            { value: `${summary.accuracy}%`, label: '正确率', color: summary.accuracy >= 70 ? 'text-green-600' : 'text-amber-600' },
            { value: summary.practiceDays, label: '练习天数', color: 'text-violet-600' },
            { value: `${summary.avgTime}s`, label: '平均用时', color: 'text-gray-700' },
          ].map(({ value, label, color }) => (
            <div key={label} className="text-center px-2">
              <div className={`text-lg font-extrabold ${color}`}>{value}</div>
              <div className="text-[10px] text-gray-400">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {!hasData && (
        <div className="bg-gray-50 rounded-2xl p-6 text-center">
          <p className="text-sm text-gray-500">暂无足够的学习数据，做题后即可生成诊断报告</p>
        </div>
      )}

      {/* ══ 免费用户看到的预览 ══ */}
      {hasData && !isPremium && (
        <>
          {/* 免费预览：前2个弱项 */}
          {weakTags.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-3">薄弱知识点</h3>
              <div className="space-y-2">
                {weakTags.slice(0, 2).map((tag, i) => {
                  const info = errorAttribution[tag]
                  const typeInfo = ERROR_TYPES[info?.type] || ERROR_TYPES.careless
                  return (
                    <div key={tag} className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                      <span className={`w-6 h-6 rounded-full ${TYPE_STYLE[info?.type]?.badge || 'bg-gray-400'} text-white text-xs font-bold flex items-center justify-center flex-shrink-0`}>
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800">{tag}</p>
                        <p className="text-xs text-gray-500">{typeInfo.label} · 错{info?.count || 0}次</p>
                      </div>
                      <span className="text-xs text-red-400 font-bold">-查看详情</span>
                    </div>
                  )
                })}
                {weakTags.length > 2 && (
                  <p className="text-xs text-gray-400 text-center py-1">还有 {weakTags.length - 2} 个薄弱项被隐藏</p>
                )}
              </div>
            </div>
          )}

          {/* 付费墙：用具体数据暗示报告价值 */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* 标题栏 */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 px-5 py-4 text-white">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">🔬</span>
                <span className="text-sm font-bold">深度诊断报告</span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">PRO</span>
              </div>
              <p className="text-xs text-indigo-100">解锁后查看完整错误归因、伪掌握检测、知识根因链</p>
            </div>

            {/* 报告预览（带遮罩的具体内容） */}
            <div className="relative">
              <div className="px-4 py-3 space-y-3 select-none" style={{ filter: 'blur(4px)', opacity: 0.6 }}>
                {/* 错误归因预览 */}
                <div>
                  <p className="text-xs font-bold text-gray-700 mb-1.5">错误归因分析</p>
                  {weakTags.slice(0, 2).map(tag => (
                    <div key={tag} className="bg-gray-50 rounded-lg px-3 py-2 mb-1.5">
                      <div className="h-3 bg-gray-200 rounded w-3/4 mb-1" />
                      <div className="h-2 bg-gray-100 rounded w-full" />
                      <div className="h-2 bg-gray-100 rounded w-2/3 mt-1" />
                    </div>
                  ))}
                </div>
                {/* 伪掌握预览 */}
                <div>
                  <p className="text-xs font-bold text-gray-700 mb-1.5">伪掌握检测</p>
                  <div className="bg-amber-50 rounded-lg px-3 py-2">
                    <div className="h-3 bg-amber-200 rounded w-1/2 mb-1" />
                    <div className="h-2 bg-amber-100 rounded w-full" />
                  </div>
                </div>
                {/* 根因链预览 */}
                <div>
                  <p className="text-xs font-bold text-gray-700 mb-1.5">知识根因链</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-gray-200" />
                    <div className="h-0.5 w-4 bg-gray-200" />
                    <div className="w-3 h-3 rounded-full bg-gray-200" />
                    <div className="h-0.5 w-4 bg-gray-200" />
                    <div className="w-3 h-3 rounded-full bg-gray-200" />
                  </div>
                </div>
              </div>
              {/* 遮罩层 + CTA */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/70 backdrop-blur-[1px]">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 px-6 py-5 text-center max-w-[280px]">
                  <div className="text-4xl mb-2">🔐</div>
                  <p className="text-base font-bold text-gray-800 mb-1">
                    发现 {weakTags.length} 个薄弱知识点
                  </p>
                  <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                    解锁深度诊断，查看每道错题背后的真正原因<br/>
                    并获得 AI 定制的 7 天提升计划
                  </p>
                  <button onClick={handleActivateTrial}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-3 px-6 rounded-xl text-sm active:scale-95 transition-transform shadow-lg shadow-indigo-200">
                    免费试用 30 天 PRO
                  </button>
                  <p className="text-[10px] text-gray-400 mt-2">Beta 期间免费 · 无需付款 · 自动激活</p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ══ 付费用户：完整诊断 ══ */}
      {hasData && isPremium && (
        <>
          {/* 错误归因 */}
          {Object.keys(errorAttribution).length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <button
                onClick={() => setExpandedSection(expandedSection === 'errors' ? null : 'errors')}
                className="w-full flex items-center justify-between px-4 py-3.5"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center text-xs">🔍</span>
                  <span className="text-sm font-bold text-gray-800">错误归因分析</span>
                  <span className="text-xs text-gray-400">({Object.keys(errorAttribution).length}项)</span>
                </div>
                <span className="text-gray-400 text-xs">{expandedSection === 'errors' ? '收起 ▲' : '展开 ▼'}</span>
              </button>
              {(expandedSection === 'errors' || expandedSection === null) && (
                <div className="px-4 pb-4 space-y-2.5">
                  {Object.entries(errorAttribution).map(([tag, info]) => {
                    const typeInfo = ERROR_TYPES[info.type] || ERROR_TYPES.careless
                    const ts = TYPE_STYLE[info.type] || TYPE_STYLE.careless
                    return (
                      <div key={tag} className={`${ts.bg} border ${ts.border} rounded-xl px-3.5 py-2.5`}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`w-5 h-5 rounded-md ${ts.badge} text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0`}>
                            {typeInfo.label?.charAt(0) || '?'}
                          </span>
                          <span className={`text-xs font-bold ${ts.text}`}>{typeInfo.label}</span>
                          <span className="text-xs text-gray-600 font-medium">{tag}</span>
                          <span className="text-[10px] text-gray-400 ml-auto bg-white/60 px-2 py-0.5 rounded-full">
                            错{info.count}次
                          </span>
                        </div>
                        {info.evidence?.length > 0 && (
                          <div className="ml-7 space-y-0.5">
                            {info.evidence.map((ev, i) => (
                              <p key={i} className="text-xs text-gray-600 leading-relaxed">{ev}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* 伪掌握 */}
          {Object.keys(pseudoMastery).length > 0 && (() => {
            const flagged = Object.entries(pseudoMastery).filter(([, v]) => v.riskLevel !== 'low')
            if (flagged.length === 0) return null
            return (
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                <button
                  onClick={() => setExpandedSection(expandedSection === 'pseudo' ? null : 'pseudo')}
                  className="w-full flex items-center justify-between px-4 py-3.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center text-xs">⚠️</span>
                    <span className="text-sm font-bold text-gray-800">伪掌握检测</span>
                    <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-bold">
                      {flagged.length}项需关注
                    </span>
                  </div>
                  <span className="text-gray-400 text-xs">{expandedSection === 'pseudo' ? '收起 ▲' : '展开 ▼'}</span>
                </button>
                {(expandedSection === 'pseudo' || expandedSection === null) && (
                  <div className="px-4 pb-4 space-y-2.5">
                    <p className="text-xs text-gray-500 mb-1">以下知识点虽然答对了，但可能并没有真正掌握</p>
                    {flagged.map(([tag, info]) => {
                      const risk = RISK_LEVELS[info.riskLevel] || RISK_LEVELS.low
                      return (
                        <div key={tag} className="bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs">{risk.icon}</span>
                            <span className="text-xs font-bold text-gray-800">{tag}</span>
                            <span className="text-xs font-medium text-amber-600">
                              {risk.label}
                            </span>
                          </div>
                          {info.flags?.map((f, i) => (
                            <p key={i} className="text-xs text-gray-600 ml-5 leading-relaxed">{f}</p>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })()}

          {/* 根因链 */}
          {rootCauses.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center text-xs">🔗</span>
                <span className="text-sm font-bold text-gray-800">知识根因链</span>
                <span className="text-xs text-gray-400">追溯薄弱根源</span>
              </div>
              <div className="space-y-4">
                {rootCauses.slice(0, 3).map((rc, i) => (
                  <div key={i}>
                    <RootCauseChain
                      chain={rc.chain}
                      rootCause={rc.rootCause}
                      suggestion={rc.suggestion}
                      errorType={rc.errorType}
                    />
                    {i < rootCauses.length - 1 && i < 2 && <div className="border-t border-gray-100 my-3" />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI 行动计划 */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-xs">🤖</span>
              <span className="text-sm font-bold text-gray-800">AI 学习计划</span>
              <span className="text-[10px] bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full font-bold">PRO</span>
            </div>
            <ActionPlanCard
              plan={actionPlan}
              loading={planLoading}
              onGenerate={handleGeneratePlan}
            />
          </div>
        </>
      )}
    </div>
  )
}
