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
