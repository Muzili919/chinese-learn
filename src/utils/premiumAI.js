/**
 * 高级诊断报告 AI 行动计划生成器
 * 基于真实学习数据，生成个性化7天学习计划
 */

import { storage } from './storage'
import { callDeepSeekWithRetry } from './ai_v2'

/**
 * 生成个性化7天学习计划
 * @param {Object} report - generatePremiumReport 的输出
 * @param {Object} userProfile - { grade, name }
 * @returns {Object} { days: [{ day, focus, tasks[], duration }], summary }
 */
export async function generateActionPlan(report, userProfile = {}) {
  const systemPrompt = `你是一位资深初中语文老师，正在为学生制定个性化学习计划。
规则：
1. 每条建议必须引用学生数据中出现的具体知识点名称
2. 任务必须可操作（如"做3道XX练习"而不是"多练习"）
3. 前2天优先解决根因问题（底层基础），后几天逐步提升
4. 每天总时长控制在15-20分钟
5. 不要给泛泛建议，要有针对性
返回JSON: {"days":[{"day":1,"focus":"重点","tasks":["任务1","任务2"],"duration":"15分钟"}],"summary":"一句话总结"}`

  // 构建数据摘要（不传原始数据，保护隐私+节省token）
  const errorSummary = Object.entries(report.errorAttribution || {})
    .map(([tag, info]) => `${tag}: ${info.type === 'concept' ? '概念误解' : info.type === 'memory' ? '记忆模糊' : '粗心失误'}，错${info.count}次`)
    .join('\n')

  const pseudoSummary = Object.entries(report.pseudoMastery || {})
    .filter(([, v]) => v.riskLevel !== 'low')
    .map(([tag, v]) => `${tag}: ${v.riskLevel === 'high' ? '高风险' : '需关注'}（${v.flags.join('；')}）`)
    .join('\n')

  const rootSummary = (report.rootCauses || [])
    .map(rc => `${rc.tag} ← 根因：${rc.rootCause}，建议：${rc.suggestion}`)
    .join('\n')

  const userPrompt = `学生等级：${userProfile.grade || '未知'}
最近30天：共${report.summary?.totalQuestions || 0}题，正确率${report.summary?.accuracy || 0}%，平均用时${report.summary?.avgTime || 0}秒

错误归因：
${errorSummary || '无'}

伪掌握风险：
${pseudoSummary || '无'}

根因链：
${rootSummary || '无'}

请生成7天个性化学习计划。`

  return callDeepSeekWithRetry(systemPrompt, userPrompt, { max_tokens: 600, temperature: 0.7 })
}

/**
 * 获取缓存的行动计划（如果有效）
 */
export function getCachedActionPlan(userId) {
  const cached = storage.getActionPlan(userId)
  if (!cached) return null

  // 3天过期
  const age = Date.now() - new Date(cached.generatedAt).getTime()
  if (age > 3 * 24 * 60 * 60 * 1000) return null

  return cached
}

/**
 * 判断是否需要重新生成报告
 */
export function shouldRegenerateReport(userId, currentRecordCount) {
  const cached = storage.getPremiumReport(userId)
  if (!cached) return true

  const age = Date.now() - new Date(cached.generatedAt).getTime()
  const newRecords = currentRecordCount - (cached.recordCount || 0)

  // 7天以上 或 新增10题以上 → 重新生成
  return age > 7 * 24 * 60 * 60 * 1000 || newRecords >= 10
}
