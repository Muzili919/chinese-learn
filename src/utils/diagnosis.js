import { KNOWLEDGE_DEPS } from '../data/knowledge_graph'

/**
 * Analyze records to find weak points.
 * Returns { [ability_tag]: { accuracy, avgTime, total, status } }
 */
export function diagnose(records) {
  const groups = {};

  records.forEach((r) => {
    const tag = r.ability_tag || r.knowledge_tag || '其他';
    if (!groups[tag]) groups[tag] = { correct: 0, total: 0, times: [], knowledge: r.knowledge_tag };
    groups[tag].total++;
    if (r.correct) groups[tag].correct++;
    if (r.time_spent) groups[tag].times.push(r.time_spent);
  });

  const results = {};
  Object.entries(groups).forEach(([tag, data]) => {
    const accuracy = data.total > 0 ? data.correct / data.total : 0;
    const avgTime =
      data.times.length > 0
        ? data.times.reduce((a, b) => a + b, 0) / data.times.length
        : 0;

    let status = 'good';
    if (accuracy < 0.6) status = 'weak';
    else if (accuracy >= 0.8 && avgTime > 15) status = 'slow';

    results[tag] = {
      accuracy: Math.round(accuracy * 100),
      avgTime: Math.round(avgTime),
      total: data.total,
      knowledge: data.knowledge,
      status,
    };
  });

  return results;
}

export function getWeakPoints(diagnosisResult) {
  return Object.entries(diagnosisResult)
    .filter(([, d]) => d.status === 'weak' || d.status === 'slow')
    .sort((a, b) => a[1].accuracy - b[1].accuracy)
    .slice(0, 5)
    .map(([tag, data]) => ({ tag, ...data }));
}

export function getKnowledgeSummary(diagnosisResult) {
  const kGroups = {};
  Object.entries(diagnosisResult).forEach(([, data]) => {
    const k = data.knowledge;
    if (!kGroups[k]) kGroups[k] = { total: 0, weightedAcc: 0 };
    kGroups[k].total += data.total;
    kGroups[k].weightedAcc += data.accuracy * data.total;
  });
  return Object.entries(kGroups).map(([name, d]) => ({
    name,
    accuracy: d.total > 0 ? Math.round(d.weightedAcc / d.total) : 0,
    total: d.total,
  }));
}

// ── 认真度分析 ──────────────────────────────────────────────

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)) }

function calcSeriousScore(avgTime, accuracy, rushCount) {
  let score = 50
  // 用时评分
  if (avgTime >= 5 && avgTime <= 30) score += 25
  else if (avgTime < 3) score -= 20
  else if (avgTime < 5) score += 5
  else score += 15
  // 正确率评分
  if (accuracy >= 80) score += 25
  else if (accuracy >= 60) score += 15
  else if (accuracy >= 40) score += 0
  else score -= 20
  // 连续快答惩罚
  score -= rushCount * 5
  return clamp(Math.round(score), 0, 100)
}

function seriousLabel(score) {
  if (score >= 80) return '非常认真'
  if (score >= 60) return '比较认真'
  if (score >= 40) return '有些敷衍'
  return '明显乱点'
}

function seriousColor(score) {
  if (score >= 80) return '#22c55e'
  if (score >= 60) return '#3b82f6'
  if (score >= 40) return '#f59e0b'
  return '#ef4444'
}

/** 统计连续快答次数（连续 3+ 题 < 3 秒） */
function countRushStreaks(records) {
  if (!records.length) return 0
  let streaks = 0, run = 0
  for (const r of records) {
    if ((r.time_spent || 0) < 3) { run++ }
    else { if (run >= 3) streaks++; run = 0 }
  }
  if (run >= 3) streaks++
  return streaks
}

/**
 * 近 N 天每日认真度
 * @returns [{ date, score, label, avgTime, accuracy, rushCount, totalQuestions }]
 */
export function analyzeSeriousness(records, days = 7) {
  const byDay = {}
  for (const r of records) {
    const d = (r.timestamp || '').slice(0, 10)
    if (!d) continue
    if (!byDay[d]) byDay[d] = []
    byDay[d].push(r)
  }
  const result = []
  for (let i = days - 1; i >= 0; i--) {
    const dt = new Date(); dt.setDate(dt.getDate() - i)
    const date = dt.toISOString().slice(0, 10)
    const dayRecords = byDay[date] || []
    const total = dayRecords.length
    if (total === 0) { result.push({ date, score: -1, label: '未练习', avgTime: 0, accuracy: 0, rushCount: 0, totalQuestions: 0 }); continue }
    const correct = dayRecords.filter(r => r.correct).length
    const acc = Math.round(correct / total * 100)
    const avgT = dayRecords.reduce((s, r) => s + (r.time_spent || 0), 0) / total
    const sorted = [...dayRecords].sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''))
    const rush = countRushStreaks(sorted)
    const score = calcSeriousScore(avgT, acc, rush)
    result.push({ date, score, label: seriousLabel(score), avgTime: Math.round(avgT * 10) / 10, accuracy: acc, rushCount: rush, totalQuestions: total })
  }
  return result
}

/**
 * 检测连续乱点段
 * @returns [{ startIndex, length, allWrong }]
 */
export function detectRushStreaks(records) {
  const sorted = [...records].sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''))
  const streaks = []
  let i = 0
  while (i < sorted.length) {
    if ((sorted[i].time_spent || 0) < 3) {
      const start = i
      while (i < sorted.length && (sorted[i].time_spent || 0) < 3) i++
      const len = i - start
      if (len >= 3) {
        const seg = sorted.slice(start, i)
        streaks.push({ startIndex: start, length: len, allWrong: seg.every(r => !r.correct) })
      }
    } else { i++ }
  }
  return streaks
}

/** 科目显示名 */
function subjectName(s) {
  if (!s || s === 'chinese' || s === 'chinese_junior') return '语文'
  if (s === 'english') return '英语'
  if (s === 'math') return '数学'
  if (s === 'politics') return '道法'
  return s
}

/**
 * 今日学习流水（自动分段）
 * @returns [{ startTime, endTime, subject, knowledgeTag, total, correct, avgTime, durationMin, seriousScore, flags }]
 */
export function analyzeTodaySessions(records) {
  const today = new Date().toISOString().slice(0, 10)
  const todayRecords = records
    .filter(r => (r.timestamp || '').startsWith(today))
    .sort((a, b) => (a.timestamp || '').localeCompare(b.timestamp || ''))
  if (!todayRecords.length) return []

  const sessions = []
  let seg = [todayRecords[0]]
  for (let i = 1; i < todayRecords.length; i++) {
    const prev = new Date(todayRecords[i - 1].timestamp).getTime()
    const curr = new Date(todayRecords[i].timestamp).getTime()
    if (curr - prev > 120000) {
      sessions.push(buildSession(seg))
      seg = [todayRecords[i]]
    } else {
      seg.push(todayRecords[i])
    }
  }
  sessions.push(buildSession(seg))
  return sessions
}

function buildSession(records) {
  const total = records.length
  const correct = records.filter(r => r.correct).length
  const acc = total > 0 ? Math.round(correct / total * 100) : 0
  const avgTime = total > 0 ? records.reduce((s, r) => s + (r.time_spent || 0), 0) / total : 0
  const rush = countRushStreaks(records)
  const score = calcSeriousScore(avgTime, acc, rush)

  // 科目和知识点取众数
  const subjCounts = {}
  const tagCounts = {}
  for (const r of records) {
    const s = r.subject || 'chinese'
    subjCounts[s] = (subjCounts[s] || 0) + 1
    const t = r.knowledge_tag || r.topic || ''
    if (t) tagCounts[t] = (tagCounts[t] || 0) + 1
  }
  const subj = Object.entries(subjCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'chinese'
  const tag = Object.entries(tagCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || ''

  const firstTs = new Date(records[0].timestamp)
  const lastTs = new Date(records[records.length - 1].timestamp)
  const durationMin = Math.round((lastTs - firstTs) / 60000 + avgTime / 60)
  const fmt = d => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

  const flags = []
  if (rush > 0) flags.push('连续3题<3秒')
  if (acc < 30 && total >= 3) flags.push('正确率低于30%')
  if (correct === 0 && total >= 3) flags.push('全部答错')

  return {
    startTime: fmt(firstTs),
    endTime: fmt(lastTs),
    subject: subjectName(subj),
    knowledgeTag: tag,
    total, correct, avgTime: Math.round(avgTime * 10) / 10,
    durationMin: Math.max(1, durationMin),
    seriousScore: score,
    seriousLabel: seriousLabel(score),
    flags,
  }
}

export { seriousLabel, seriousColor }

/** Last 14 days activity: [{ date, count }] */
export function getActivityHeatmap(sessions) {
  const map = {};
  sessions.forEach((s) => {
    const date = s.date?.split('T')[0] || s.date;
    map[date] = (map[date] || 0) + (s.total || 0);
  });

  const result = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    result.push({ date: key, count: map[key] || 0 });
  }
  return result;
}

// ── 高级诊断引擎 ─────────────────────────────────────────

/**
 * 错误归因：把每道错题分类为 概念误解/记忆模糊/粗心失误
 * @param {Array} records - 答题记录
 * @returns {Object} { [tag]: { type, count, evidence[] } }
 */
export function attributeErrors(records) {
  const wrong = records.filter(r => !r.correct)
  if (wrong.length === 0) return {}

  // 按 tag 分组统计
  const byTag = {}
  for (const r of records) {
    const tag = r.knowledge_tag || r.ability_tag || r.topic || '其他'
    if (!byTag[tag]) byTag[tag] = { correct: 0, wrong: 0, fastWrong: 0, socraticHigh: 0, feynmanFail: 0 }
    if (r.correct) {
      byTag[tag].correct++
    } else {
      byTag[tag].wrong++
      if (r.time_spent < 3) byTag[tag].fastWrong++
      if (r.socratic_rounds > 2) byTag[tag].socraticHigh++
      if (r.feynman_passed === false) byTag[tag].feynmanFail++
    }
  }

  const result = {}
  for (const r of wrong) {
    const tag = r.knowledge_tag || r.ability_tag || r.topic || '其他'
    if (result[tag]) continue  // 每个 tag 只归因一次

    const stats = byTag[tag]
    const total = stats.correct + stats.wrong
    const accuracy = total > 0 ? stats.correct / total : 0

    let type, evidence

    if (stats.feynmanFail > 0 || stats.socraticHigh > 0 || stats.wrong >= 3) {
      type = 'concept'
      evidence = []
      if (stats.wrong >= 3) evidence.push(`该知识点累计错${stats.wrong}次`)
      if (stats.socraticHigh > 0) evidence.push(`AI追问${stats.socraticHigh}轮仍未理解`)
      if (stats.feynmanFail > 0) evidence.push(`费曼验证未通过`)
    } else if (accuracy >= 0.5 && stats.wrong < 3) {
      type = 'memory'
      evidence = [`正确率${Math.round(accuracy * 100)}%，有印象但不牢固`]
      if (stats.correct > 0) evidence.push(`同类题对过${stats.correct}次`)
    } else {
      type = 'careless'
      evidence = []
      if (r.time_spent < 3) evidence.push(`仅用${r.time_spent}s作答`)
      if (stats.fastWrong > 0) evidence.push(`${stats.fastWrong}次快速作答(<3s)`)
      if (evidence.length === 0) evidence.push('偶发错误，整体掌握尚可')
    }

    result[tag] = { type, count: stats.wrong, evidence }
  }

  return result
}

/**
 * 伪掌握检测：找出答对但可能没真懂的题
 * @param {Array} records - 答题记录
 * @returns {Object} { [tag]: { riskLevel, flags[], confidence } }
 */
export function detectPseudoMastery(records) {
  const byTag = {}
  for (const r of records) {
    const tag = r.knowledge_tag || r.ability_tag || r.topic || '其他'
    if (!byTag[tag]) byTag[tag] = { correct: [], wrong: [], feynmanLow: 0 }
    if (r.correct) {
      byTag[tag].correct.push(r)
    } else {
      byTag[tag].wrong.push(r)
    }
    if (r.feynman_score !== undefined && r.feynman_score < 70) {
      byTag[tag].feynmanLow++
    }
  }

  const result = {}
  for (const [tag, data] of Object.entries(byTag)) {
    const flags = []
    let riskScore = 0

    // 费曼低分
    if (data.feynmanLow > 0) {
      flags.push(`费曼验证${data.feynmanLow}次未达70分`)
      riskScore += 40
    }

    // 快速答对高难度题（可能猜的）
    const fastHard = data.correct.filter(r => r.time_spent < 2 && (r.difficulty || 1) >= 3)
    if (fastHard.length > 0) {
      flags.push(`${fastHard.length}道高难度题秒答（可能猜对）`)
      riskScore += 20
    }

    // 不一致：高难度对了但低难度错了
    const hardCorrect = data.correct.filter(r => (r.difficulty || 1) >= 3).length
    const easyWrong = data.wrong.filter(r => (r.difficulty || 1) <= 2).length
    if (hardCorrect > 0 && easyWrong > 0) {
      flags.push('高难度答对但低难度出错，理解不扎实')
      riskScore += 25
    }

    if (flags.length === 0) continue

    const riskLevel = riskScore >= 40 ? 'high' : riskScore >= 20 ? 'medium' : 'low'
    result[tag] = { riskLevel, flags, confidence: Math.min(riskScore, 100) }
  }

  return result
}

/**
 * 知识根因链：从弱项追溯到根本原因
 * @param {string} weakTag - 弱项知识点
 * @returns {Object} { chain[], rootCause, suggestion }
 */
export function traceRootCause(weakTag) {
  const deps = KNOWLEDGE_DEPS[weakTag]
  if (!deps || !deps.roots || deps.roots.length === 0) {
    return {
      chain: [weakTag],
      rootCause: weakTag,
      suggestion: deps?.suggests || `重点复习${weakTag}`,
    }
  }

  // BFS 找到根节点
  const visited = new Set([weakTag])
  const queue = [...deps.roots]
  const parentMap = {}
  for (const r of deps.roots) {
    parentMap[r] = weakTag
  }

  let root = deps.roots[0]
  while (queue.length > 0) {
    const current = queue.shift()
    if (visited.has(current)) continue
    visited.add(current)

    const currentDeps = KNOWLEDGE_DEPS[current]
    if (!currentDeps || currentDeps.roots.length === 0) {
      root = current
      break
    }
    for (const r of currentDeps.roots) {
      if (!visited.has(r)) {
        parentMap[r] = current
        queue.push(r)
      }
    }
  }

  // 重建链路
  const chain = [root]
  let cur = root
  while (cur !== weakTag) {
    // 找到 cur 的下游（在 parentMap 中 value === cur 的 key）
    let found = false
    for (const [child, parent] of Object.entries(parentMap)) {
      if (parent === cur && !chain.includes(child)) {
        chain.push(child)
        cur = child
        found = true
        break
      }
    }
    if (!found) break
  }
  if (chain[chain.length - 1] !== weakTag) chain.push(weakTag)

  const rootDeps = KNOWLEDGE_DEPS[root]
  return {
    chain,
    rootCause: root,
    suggestion: rootDeps?.suggests || `重点复习${root}`,
  }
}

/**
 * 生成完整的高级诊断报告
 * @param {Array} records - 答题记录
 * @param {Array} sessions - 学习会话
 * @returns {Object} 完整报告
 */
export function generatePremiumReport(records, sessions) {
  // 最近30天的数据
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)
  const recent = records.filter(r => r.timestamp && new Date(r.timestamp) >= cutoff)

  const wrongRecords = recent.filter(r => !r.correct)
  const correctRecords = recent.filter(r => r.correct)

  // 基础统计
  const totalQuestions = recent.length
  const accuracy = totalQuestions > 0 ? Math.round((correctRecords.length / totalQuestions) * 100) : 0
  const totalTime = recent.reduce((sum, r) => sum + (r.time_spent || 0), 0)
  const avgTime = totalQuestions > 0 ? Math.round(totalTime / totalQuestions * 10) / 10 : 0

  // 错误归因
  const errorAttribution = attributeErrors(recent)

  // 伪掌握检测
  const pseudoMastery = detectPseudoMastery(recent)

  // 弱项 + 根因链
  const weakTags = Object.keys(errorAttribution)
    .sort((a, b) => (errorAttribution[b].count || 0) - (errorAttribution[a].count || 0))
    .slice(0, 5)

  const rootCauses = weakTags.map(tag => ({
    tag,
    ...traceRootCause(tag),
    errorType: errorAttribution[tag]?.type,
    errorCount: errorAttribution[tag]?.count,
  }))

  // 认真度分析
  const seriousData = analyzeSeriousness(recent, 30)

  return {
    generatedAt: new Date().toISOString(),
    recordCount: totalQuestions,
    summary: {
      totalQuestions,
      correctCount: correctRecords.length,
      wrongCount: wrongRecords.length,
      accuracy,
      avgTime,
      practiceDays: new Set(recent.map(r => r.timestamp?.split('T')[0])).size,
    },
    errorAttribution,
    pseudoMastery,
    rootCauses,
    seriousData,
    weakTags,
  }
}
