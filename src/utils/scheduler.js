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
 * 从单个题目池中按 SRS 优先级选出 n 道题
 */
function pickFromPool(pool, srsStates, n) {
  if (n <= 0 || pool.length === 0) return [];
  const due = pool.filter((q) => isDue(srsStates[q.id]));
  const newCards = pool.filter((q) => !srsStates[q.id]);
  const reviewed = pool.filter((q) => srsStates[q.id] && !isDue(srsStates[q.id]));
  const selected = new Set();
  shuffle(due).slice(0, Math.min(due.length, Math.ceil(n * 0.5))).forEach((q) => selected.add(q));
  shuffle(newCards).filter((q) => !selected.has(q)).slice(0, n - selected.size).forEach((q) => selected.add(q));
  if (selected.size < n) {
    shuffle(reviewed).filter((q) => !selected.has(q)).slice(0, n - selected.size).forEach((q) => selected.add(q));
  }
  return shuffle([...selected]).slice(0, n);
}

/**
 * Pick questions for a session.
 * Priority: due SRS cards → new cards → random fill
 * 全部混合模式（knowledgeTag=null, focusTag=null）：从每个星球各抽 1-3 题，保证全覆盖
 * @param {Array} allQuestions - full question pool
 * @param {Object} srsStates   - { [cardId]: srsState }
 * @param {number} sessionSize - target number of questions
 * @param {string|null} focusTag - ability_tag to focus on (强化模式), or null
 * @param {boolean} mixedMode  - true 表示全部混合模式
 */
export function scheduleSession(allQuestions, srsStates, sessionSize = 20, focusTag = null, mixedMode = false) {
  if (focusTag) {
    // 强化模式：70% from focus tag, 30% mixed
    const focus = allQuestions.filter((q) => q.ability_tag === focusTag);
    const others = allQuestions.filter((q) => q.ability_tag !== focusTag);
    const focusCount = Math.min(focus.length, Math.ceil(sessionSize * 0.7));
    const otherCount = sessionSize - focusCount;
    return [
      ...shuffle(focus).slice(0, focusCount),
      ...shuffle(others).slice(0, otherCount),
    ].slice(0, sessionSize);
  }

  if (mixedMode) {
    // 全部混合模式：每个星球各抽 1-3 题（随机），总量约 5-15 题
    const perGalaxy = 1 + Math.floor(Math.random() * 3) // 1, 2, 或 3
    const result = []
    for (const tag of GALAXY_TAGS) {
      const tagPool = allQuestions.filter((q) => q.knowledge_tag === tag)
      result.push(...pickFromPool(tagPool, srsStates, perGalaxy))
    }
    return shuffle(result)
  }

  // 筛查模式（单个星球）
  return pickFromPool(allQuestions, srsStates, sessionSize);
}
