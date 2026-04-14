import { isDue } from './srs';

// 全部混合星球：每次从各星球各抽的知识标签
const GALAXY_TAGS = ['字词', '古诗词', '成语', '句子', '文学常识'];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * 从单个题目池中按优先级选出 n 道题
 *
 * 优先级（高→低）：
 *   1. 近期答错（lastQuality < 3）且今日未见
 *   2. 到期复习（isDue = true）且今日未见
 *   3. 新题（从未做过）且今日未见
 *   4. 未到期但今日未见（兜底）
 *   5. 今日已见（最后手段，pool 太小时才用）
 */
function pickFromPool(pool, srsStates, n, seenTodaySet = new Set()) {
  if (n <= 0 || pool.length === 0) return [];

  const unseen = pool.filter(q => !seenTodaySet.has(q.id));
  const seenFallback = pool.filter(q => seenTodaySet.has(q.id));

  // 分层
  const wrong   = unseen.filter(q => srsStates[q.id] && srsStates[q.id].lastQuality < 3);
  const due     = unseen.filter(q => !srsStates[q.id]?.lastQuality || (isDue(srsStates[q.id]) && srsStates[q.id].lastQuality >= 3));
  const newCards = unseen.filter(q => !srsStates[q.id]);
  const notDue  = unseen.filter(q => srsStates[q.id] && !isDue(srsStates[q.id]) && srsStates[q.id].lastQuality >= 3);

  // due 层包含 wrong（错题也可能 isDue）——去重
  const dueOnly = due.filter(q => !wrong.find(w => w.id === q.id));
  const newOnly = newCards.filter(q => !wrong.find(w => w.id === q.id) && !dueOnly.find(d => d.id === q.id));

  const selected = new Set();

  // 1. 错题优先（最多 40%）
  shuffle(wrong).slice(0, Math.ceil(n * 0.4)).forEach(q => selected.add(q));
  // 2. 到期复习（填到 70%）
  shuffle(dueOnly).filter(q => !selected.has(q)).slice(0, n - selected.size).forEach(q => selected.add(q));
  // 3. 新题（填到 90%）
  shuffle(newOnly).filter(q => !selected.has(q)).slice(0, n - selected.size).forEach(q => selected.add(q));
  // 4. 未到期兜底
  shuffle(notDue).filter(q => !selected.has(q)).slice(0, n - selected.size).forEach(q => selected.add(q));
  // 5. 今日已见（万不得已）
  if (selected.size < n) {
    shuffle(seenFallback).filter(q => !selected.has(q)).slice(0, n - selected.size).forEach(q => selected.add(q));
  }

  return shuffle([...selected]).slice(0, n);
}

/**
 * 为一次答题 session 选题
 *
 * @param {Array}  allQuestions  - 完整题目池
 * @param {Object} srsStates     - { [cardId]: srsState }
 * @param {number} sessionSize   - 目标题数
 * @param {string|null} focusTag - 强化模式 ability_tag，null = 正常
 * @param {boolean} mixedMode   - true = 全部混合星球
 * @param {Set}    seenToday     - 今日已见 cardId 集合
 */
export function scheduleSession(
  allQuestions,
  srsStates,
  sessionSize = 20,
  focusTag = null,
  mixedMode = false,
  seenToday = new Set(),
) {
  if (focusTag) {
    // 强化模式：70% 专项 + 30% 混合
    const focus  = allQuestions.filter(q => q.ability_tag === focusTag);
    const others = allQuestions.filter(q => q.ability_tag !== focusTag);
    const focusCount = Math.min(focus.length, Math.ceil(sessionSize * 0.7));
    const otherCount = sessionSize - focusCount;
    return [
      ...pickFromPool(focus, srsStates, focusCount, seenToday),
      ...pickFromPool(others, srsStates, otherCount, seenToday),
    ].slice(0, sessionSize);
  }

  if (mixedMode) {
    // 全部混合：每个星球各抽 1-3 题
    const perGalaxy = 1 + Math.floor(Math.random() * 3);
    const result = [];
    for (const tag of GALAXY_TAGS) {
      const tagPool = allQuestions.filter(q => q.knowledge_tag === tag);
      result.push(...pickFromPool(tagPool, srsStates, perGalaxy, seenToday));
    }
    return shuffle(result);
  }

  // 单星球（普通模式）
  return pickFromPool(allQuestions, srsStates, sessionSize, seenToday);
}
