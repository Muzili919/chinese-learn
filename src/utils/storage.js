const P = 'cl_';

export const storage = {
  // User
  getUser: () => JSON.parse(localStorage.getItem(P + 'user') || 'null'),
  setUser: (user) => localStorage.setItem(P + 'user', JSON.stringify(user)),

  // SRS state: { [cardId]: { interval, easeFactor, reviewCount, nextReview } }
  getSrsState: (userId) =>
    JSON.parse(localStorage.getItem(P + 'srs_' + userId) || '{}'),
  setSrsState: (userId, state) =>
    localStorage.setItem(P + 'srs_' + userId, JSON.stringify(state)),
  updateCardSrs: (userId, cardId, cardState) => {
    const all = storage.getSrsState(userId);
    all[cardId] = cardState;
    storage.setSrsState(userId, all);
  },

  // Answer records: array of { card_id, correct, time_spent, selected_answer, ability_tag, knowledge_tag, timestamp }
  getRecords: (userId) =>
    JSON.parse(localStorage.getItem(P + 'records_' + userId) || '[]'),
  addRecord: (userId, record) => {
    const records = storage.getRecords(userId);
    records.push(record);
    localStorage.setItem(P + 'records_' + userId, JSON.stringify(records));
  },

  // Sessions: array of { date, total, correct, xpEarned, durationSec }
  getSessions: (userId) =>
    JSON.parse(localStorage.getItem(P + 'sessions_' + userId) || '[]'),
  addSession: (userId, session) => {
    const sessions = storage.getSessions(userId);
    sessions.push(session);
    localStorage.setItem(P + 'sessions_' + userId, JSON.stringify(sessions));
  },

  // Streak
  getStreak: (userId) =>
    JSON.parse(localStorage.getItem(P + 'streak_' + userId) || '{"count":0,"lastDate":null}'),
  setStreak: (userId, streak) =>
    localStorage.setItem(P + 'streak_' + userId, JSON.stringify(streak)),

  // XP
  getXP: (userId) => parseInt(localStorage.getItem(P + 'xp_' + userId) || '0'),
  addXP: (userId, amount) => {
    const xp = storage.getXP(userId) + amount;
    localStorage.setItem(P + 'xp_' + userId, String(xp));
    return xp;
  },

  // Parent PIN
  getParentPin: () => localStorage.getItem(P + 'pin') || null,
  setParentPin: (pin) => localStorage.setItem(P + 'pin', pin),

  // Essay history: [{ id, prompt, content, score, feedback, createdAt }]
  getEssays: (userId) =>
    JSON.parse(localStorage.getItem(P + 'essays_' + userId) || '[]'),
  addEssay: (userId, essay) => {
    const list = storage.getEssays(userId);
    list.unshift({ ...essay, id: Date.now().toString(), createdAt: new Date().toISOString() });
    // keep latest 30
    localStorage.setItem(P + 'essays_' + userId, JSON.stringify(list.slice(0, 30)));
  },

  // Sentence practice history: [{ id, word, sentence, score, result, createdAt }]
  getSentenceHistory: (userId) =>
    JSON.parse(localStorage.getItem(P + 'sentences_' + userId) || '[]'),
  addSentenceHistory: (userId, item) => {
    const list = storage.getSentenceHistory(userId);
    list.unshift({ ...item, id: Date.now().toString(), createdAt: new Date().toISOString() });
    localStorage.setItem(P + 'sentences_' + userId, JSON.stringify(list.slice(0, 100)));
  },

  // MV1: Per-user/per-device simple gamification state persistence (localStorage)
  // Keyed as mv1_gamification_[userId] if userId available, else mv1_gamification_session
  getMV1State: (userId) => {
    const key = userId ? `mv1_gamification_${userId}` : 'mv1_gamification_session';
    return JSON.parse(localStorage.getItem(P + key) || 'null')
  },
  setMV1State: (userId, state) => {
    const key = userId ? `mv1_gamification_${userId}` : 'mv1_gamification_session';
    localStorage.setItem(P + key, JSON.stringify(state))
  },

  // 退出账号
  logout: () => {
    localStorage.removeItem(P + 'user');
  },

  // 错题集：最近一次答错的题目 card_id 集合
  getWrongCardIds: (userId) => {
    const records = storage.getRecords(userId);
    // 按 card_id 分组，取每张卡最新一条记录
    const latest = {};
    for (const r of records) {
      if (!latest[r.card_id] || r.timestamp > latest[r.card_id].timestamp) {
        latest[r.card_id] = r;
      }
    }
    // 返回最近一次答错的 card_id 集合
    return new Set(
      Object.entries(latest)
        .filter(([, r]) => !r.correct)
        .map(([id]) => id)
    );
  },

  // 积压错题数：SRS 到期日已过 3 天以上（还没答对过）
  getOverdueWrongCount: (userId) => {
    const wrongIds = storage.getWrongCardIds(userId);
    if (wrongIds.size === 0) return 0;
    const srsStates = storage.getSrsState(userId);
    const today = new Date().toISOString().split('T')[0];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 3);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    let count = 0;
    for (const id of wrongIds) {
      const state = srsStates[id];
      // 没有 SRS 记录（从未正确过）或 nextReview 超过 3 天没复习
      if (!state || state.nextReview <= cutoffStr) count++;
    }
    return count;
  },
};

// 导出当前用户的完整本地数据快照，便于导出到外部备份/导入
export const exportAll = (userId) => {
  const user = storage.getUser();
  return {
    user,
    srsState: storage.getSrsState(userId),
    records: storage.getRecords(userId),
    sessions: storage.getSessions(userId),
    streak: storage.getStreak(userId),
    xp: storage.getXP(userId),
    essays: storage.getEssays(userId),
    sentenceHistory: storage.getSentenceHistory(userId),
    wrongIds: Array.from((storage.getWrongCardIds(userId) || new Set()).values()),
  };
};

export function calcLevel(xp) {
  // Level up every 200 XP, capped at 50
  const level = Math.floor(xp / 200) + 1;
  return Math.min(level, 50);
}

export function calcLevelProgress(xp) {
  return xp % 200;
}

export function updateStreak(userId) {
  const streak = storage.getStreak(userId);
  const today = new Date().toISOString().split('T')[0];
  if (streak.lastDate === today) return streak; // already done today

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yest = yesterday.toISOString().split('T')[0];

  const newStreak = {
    count: streak.lastDate === yest ? streak.count + 1 : 1,
    lastDate: today,
  };
  storage.setStreak(userId, newStreak);
  return newStreak;
}
