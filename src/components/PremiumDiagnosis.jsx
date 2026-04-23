import { useState, useEffect, useMemo } from 'react'
import { storage } from '../utils/storage'
import { generatePremiumReport } from '../utils/diagnosis'
import { generateActionPlan, getCachedActionPlan, shouldRegenerateReport } from '../utils/premiumAI'
import { ERROR_TYPES, RISK_LEVELS } from '../data/knowledge_graph'
import RootCauseChain from './RootCauseChain'
import ActionPlanCard from './ActionPlanCard'

export default function PremiumDiagnosis({ user }) {
  const [isPremium, setIsPremium] = useState(false)
  const [report, setReport] = useState(null)
  const [actionPlan, setActionPlan] = useState(null)
  const [planLoading, setPlanLoading] = useState(false)
  const [expandedSection, setExpandedSection] = useState(null)

  // 检查 premium 状态
  useEffect(() => {
    if (user?.id) {
      setIsPremium(storage.isPremiumActive(user.id))
    }
  }, [user?.id])

  // 生成/加载报告
  useEffect(() => {
    if (!user?.id) return
    const records = storage.getRecords(user.id)
    const sessions = storage.getSessions(user.id)

    // 检查缓存
    if (!shouldRegenerateReport(user.id, records.length)) {
      const cached = storage.getPremiumReport(user.id)
      if (cached) {
        setReport(cached)
        // 也加载缓存的行动计划
        const cachedPlan = getCachedActionPlan(user.id)
        if (cachedPlan) setActionPlan(cachedPlan)
        return
      }
    }

    // 生成新报告
    const newReport = generatePremiumReport(records, sessions)
    setReport(newReport)
    storage.setPremiumReport(user.id, newReport)
  }, [user?.id])

  function handleActivateTrial() {
    if (!user?.id) return
    storage.activatePremiumTrial(user.id)
    setIsPremium(true)
  }

  async function handleGeneratePlan() {
    if (!report || !user?.id) return
    setPlanLoading(true)
    try {
      const grade = storage.getGrade()
      const plan = await generateActionPlan(report, { grade })
      const planWithMeta = { ...plan, generatedAt: new Date().toISOString() }
      setActionPlan(planWithMeta)
      storage.setActionPlan(user.id, planWithMeta)
    } catch (e) {
      console.warn('Action plan generation failed:', e)
    } finally {
      setPlanLoading(false)
    }
  }

  if (!report) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
        <span className="ml-3 text-sm text-gray-500">分析学习数据中...</span>
      </div>
    )
  }

  const { summary, errorAttribution, pseudoMastery, rootCauses, weakTags } = report
  const hasData = summary.totalQuestions > 0

  return (
    <div className="space-y-4 pb-6">
      {/* 概要卡片 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <h3 className="text-base font-bold text-gray-800 mb-3">30天学习概要</h3>
        <div className="grid grid-cols-4 gap-2 text-center">
          <div>
            <div className="text-xl font-extrabold text-indigo-600">{summary.totalQuestions}</div>
            <div className="text-xs text-gray-400">答题</div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-green-600">{summary.accuracy}%</div>
            <div className="text-xs text-gray-400">正确率</div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-violet-600">{summary.practiceDays}</div>
            <div className="text-xs text-gray-400">练习天数</div>
          </div>
          <div>
            <div className="text-xl font-extrabold text-amber-600">{summary.avgTime}s</div>
            <div className="text-xs text-gray-400">平均用时</div>
          </div>
        </div>
      </div>

      {!hasData && (
        <div className="bg-gray-50 rounded-2xl p-6 text-center">
          <p className="text-sm text-gray-500">暂无足够的学习数据，做题后即可生成诊断报告</p>
        </div>
      )}

      {hasData && !isPremium && (
        <>
          {/* 免费预览：弱项概览 */}
          {weakTags.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-2">薄弱知识点</h3>
              <div className="flex flex-wrap gap-2">
                {weakTags.slice(0, 2).map(tag => (
                  <span key={tag} className="bg-red-50 text-red-600 text-xs px-3 py-1 rounded-full font-medium">
                    {tag}
                  </span>
                ))}
                {weakTags.length > 2 && (
                  <span className="text-xs text-gray-400 px-2 py-1">+{weakTags.length - 2}项</span>
                )}
              </div>
            </div>
          )}

          {/* 付费墙预览（模糊） */}
          <div className="relative">
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm blur-[3px] pointer-events-none select-none">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-2/3" />
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-5/6" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mt-3" />
                <div className="h-3 bg-gray-100 rounded w-full" />
                <div className="h-3 bg-gray-100 rounded w-3/4" />
              </div>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 rounded-2xl">
              <div className="text-3xl mb-2">🔒</div>
              <p className="text-sm font-bold text-gray-700 mb-1">解锁完整诊断</p>
              <p className="text-xs text-gray-500 mb-3">错误归因 · 伪掌握检测 · 根因链 · AI学习计划</p>
              <button onClick={handleActivateTrial}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold py-2.5 px-6 rounded-xl text-sm active:scale-95 transition-transform shadow-lg">
                免费试用30天
              </button>
            </div>
          </div>
        </>
      )}

      {hasData && isPremium && (
        <>
          {/* 错误归因 */}
          {Object.keys(errorAttribution).length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <button
                onClick={() => setExpandedSection(expandedSection === 'errors' ? null : 'errors')}
                className="w-full flex items-center justify-between px-4 py-3"
              >
                <span className="text-sm font-bold text-gray-800">错误归因分析</span>
                <span className="text-gray-400 text-xs">{expandedSection === 'errors' ? '收起 ▲' : '展开 ▼'}</span>
              </button>
              {(expandedSection === 'errors' || expandedSection === null) && (
                <div className="px-4 pb-4 space-y-2">
                  {Object.entries(errorAttribution).map(([tag, info]) => {
                    const typeInfo = ERROR_TYPES[info.type] || ERROR_TYPES.careless
                    const colorMap = {
                      red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
                      amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
                      gray: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600' },
                    }
                    const cm = colorMap[typeInfo.color] || colorMap.gray
                    return (
                      <div key={tag} className={`${cm.bg} border ${cm.border} rounded-xl px-3 py-2`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs">{typeInfo.icon}</span>
                          <span className={`text-xs font-bold ${cm.text}`}>{typeInfo.label}</span>
                          <span className="text-xs text-gray-500">{tag}</span>
                          <span className="text-xs text-gray-400 ml-auto">错{info.count}次</span>
                        </div>
                        {info.evidence?.length > 0 && (
                          <div className="ml-5 space-y-0.5">
                            {info.evidence.map((ev, i) => (
                              <p key={i} className="text-xs text-gray-600">{ev}</p>
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
          {Object.keys(pseudoMastery).length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <button
                onClick={() => setExpandedSection(expandedSection === 'pseudo' ? null : 'pseudo')}
                className="w-full flex items-center justify-between px-4 py-3"
              >
                <span className="text-sm font-bold text-gray-800">伪掌握检测</span>
                <span className="text-xs text-amber-500 font-medium">
                  {Object.values(pseudoMastery).filter(p => p.riskLevel !== 'low').length}项需关注
                </span>
              </button>
              {(expandedSection === 'pseudo' || expandedSection === null) && (
                <div className="px-4 pb-4 space-y-2">
                  {Object.entries(pseudoMastery).filter(([, v]) => v.riskLevel !== 'low').map(([tag, info]) => {
                    const risk = RISK_LEVELS[info.riskLevel] || RISK_LEVELS.low
                    const colorMap = {
                      red: { bg: 'bg-red-50', border: 'border-red-200' },
                      amber: { bg: 'bg-amber-50', border: 'border-amber-200' },
                      green: { bg: 'bg-green-50', border: 'border-green-200' },
                    }
                    const cm = colorMap[risk.color] || colorMap.amber
                    return (
                      <div key={tag} className={`${cm.bg} border ${cm.border} rounded-xl px-3 py-2`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs">{risk.icon}</span>
                          <span className="text-xs font-bold text-gray-800">{tag}</span>
                          <span className={`text-xs font-medium ${cm.border.replace('border-', 'text-')}`}>
                            {risk.label}
                          </span>
                        </div>
                        {info.flags?.map((f, i) => (
                          <p key={i} className="text-xs text-gray-600 ml-5">{f}</p>
                        ))}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* 根因链 */}
          {rootCauses.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-3">知识根因链</h3>
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
            <h3 className="text-sm font-bold text-gray-800 mb-3">AI 学习计划</h3>
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
