import { isDue } from './srs';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Pick questions for a session.
 * Priority: due SRS cards → new cards → random fill
 * @param {Array} allQuestions - full question pool
 * @param {Object} srsStates   - { [cardId]: srsState }
 * @param {number} sessionSize - target number of questions
 * @param {string|null} focusTag - ability_tag to focus on (强化模式), or null
 */
export function scheduleSession(allQuestions, srsStates, sessionSize = 20, focusTag = null) {
  let pool = allQuestions;

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

  // 筛查模式
  const due = pool.filter((q) => isDue(srsStates[q.id]));
  const newCards = pool.filter((q) => !srsStates[q.id]);
  const reviewed = pool.filter((q) => srsStates[q.id] && !isDue(srsStates[q.id]));

  const selected = new Set();

  // 1. Due cards (up to 50% of session)
  const dueSlots = Math.min(due.length, Math.floor(sessionSize * 0.5));
  shuffle(due).slice(0, dueSlots).forEach((q) => selected.add(q));

  // 2. New cards to fill remaining
  shuffle(newCards)
    .filter((q) => !selected.has(q))
    .slice(0, sessionSize - selected.size)
    .forEach((q) => selected.add(q));

  // 3. If still short, use reviewed cards
  if (selected.size < sessionSize) {
    shuffle(reviewed)
      .filter((q) => !selected.has(q))
      .slice(0, sessionSize - selected.size)
      .forEach((q) => selected.add(q));
  }

  return shuffle([...selected]).slice(0, sessionSize);
}
