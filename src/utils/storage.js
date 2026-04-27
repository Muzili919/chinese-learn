const P = 'cl_';

// Safe localStorage wrappers — 隐私模式/存储满时不崩溃
function lsGet(key) { try { return localStorage.getItem(key) } catch { return null } }
function lsSet(key, val) { try { localStorage.setItem(key, val); return true } catch { return false } }
function lsRemove(key) { try { localStorage.removeItem(key) } catch {} }
function lsParse(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback }
  catch { return fallback }
}

export const storage = {
  // User - 包含等级和经验信息
  getUser: () => {
    const user = lsParse(P + 'user', null);
    if (user && !user.level) {
      // 初始化用户等级和经验
      user.level = 1;
      user.experience = 0;
      user.totalExperience = 0;
      user.nextLevelExp = 100; // 1级升级需要100xp
      storage.setUser(user);
    }
    return user;
  },
  setUser: (user) => lsSet(P + 'user', JSON.stringify(user)),

  // Grade preference
  getGrade: () => lsGet(P + 'grade') || 'primary',
  setGrade: (grade) => lsSet(P + 'grade', grade),

  // SRS state: { [cardId]: { interval, easeFactor, reviewCount, nextReview } }
  getSrsState: (userId) =>
    lsParse(P + 'srs_' + userId, {}),
  setSrsState: (userId, state) =>
    lsSet(P + 'srs_' + userId, JSON.stringify(state)),
  updateCardSrs: (userId, cardId, cardState) => {
    const all = storage.getSrsState(userId);
    all[cardId] = cardState;
    storage.setSrsState(userId, all);
  },

  // Answer records: array of { card_id, correct, time_spent, selected_answer, ability_tag, knowledge_tag, timestamp }
  getRecords: (userId) =>
    lsParse(P + 'records_' + userId, []),
  addRecord: (userId, record) => {
    // ★ 防御性兜底：如果调用方忘记传 subject，自动推断
    // 这样即使未来新增答题页漏写了 subject，错题分类也不会出问题
    if (!record.subject) {
      const cid = record.card_id || ''
      if (cid.startsWith('en_') || cid.startsWith('j2_') || cid.startsWith('ep_')) {
        record.subject = 'english'
      } else if (cid.startsWith('pol_') || cid.startsWith('pp_')) {
        record.subject = 'politics'
      } else {
        record.subject = 'chinese'  // 默认归入语文
      }
    }
    const records = storage.getRecords(userId);
    records.push(record);
    lsSet(P + 'records_' + userId, JSON.stringify(records));
  },

  // Sessions: array of { date, total, correct, xpEarned, durationSec, knowledgeTag? }
  getSessions: (userId) =>
    lsParse(P + 'sessions_' + userId, []),
  addSession: (userId, session) => {
    const sessions = storage.getSessions(userId);
    sessions.push(session);
    lsSet(P + 'sessions_' + userId, JSON.stringify(sessions));
  },

  // 完成整轮练习的星球标记（只有做完所有题目才标记，不是答1题就算）
  // 结构: { "2026-04-13": ["语文选择题", "英语单词"], "2026-04-12": [...] }
  getCompletedPlanets: (userId) =>
    lsParse(P + 'completed_' + userId, {}),
  markPlanetComplete: (userId, planetTag) => {
    const today = new Date().toISOString().split('T')[0];
    const map = storage.getCompletedPlanets(userId);
    if (!map[today]) map[today] = [];
    if (!map[today].includes(planetTag)) map[today].push(planetTag);
    lsSet(P + 'completed_' + userId, JSON.stringify(map));
  },
  getCompletedPlanetsToday: (userId) => {
    const today = new Date().toISOString().split('T')[0];
    return storage.getCompletedPlanets(userId)[today] || [];
  },

  // 今日学习报告：按学科×星球聚合答题数据
  getTodayStudyReport: (userId, grade = 'primary') => {
    const records = storage.getRecords(userId)
    const today = new Date().toISOString().split('T')[0]
    const todayRecords = records.filter(r => r.timestamp?.startsWith(today))

    const SUBJECT_PLANETS = {
      chinese: {
        label: '语文', emoji: '📚', grade: 'primary',
        planets: [
          { tag: '字词', label: '字词星球' },
          { tag: '古诗词', label: '诗词星球' },
          { tag: '成语', label: '成语星球' },
          { tag: '句子', label: '句子星球' },
          { tag: '阅读', label: '阅读星球' },
          { tag: '文学常识', label: '文学星球' },
          { tag: '造句', label: '造句星球' },
          { tag: '作文', label: '作文星球' },
        ],
        matchRecord: (r) => r.subject === 'chinese',
        getPlanetTag: (r) => r.knowledge_tag,
      },
      math_primary: {
        label: '数学', emoji: '🔢', grade: 'primary',
        planets: [
          { tag: '数与运算', label: '运算星球' },
          { tag: '图形与空间', label: '图形星球' },
          { tag: '奥数专题', label: '奥数星球' },
          { tag: '公式速记', label: '公式速记星球' },
        ],
        matchRecord: (r) => r.subject === 'math',
        getPlanetTag: (r) => r.topic || '数与运算',
      },
      math_junior: {
        label: '数学', emoji: '🔢', grade: 'junior',
        planets: [
          { tag: '方程与不等式', label: '方程星球' },
          { tag: '函数与图像', label: '函数星球' },
          { tag: '整式运算', label: '整式星球' },
          { tag: '几何证明', label: '几何星球' },
          { tag: '公式速记', label: '公式速记星球' },
        ],
        matchRecord: (r) => r.subject === 'math_junior',
        getPlanetTag: (r) => r.topic,
      },
      english: {
        label: '英语', emoji: '🌍', grade: 'primary',
        planets: [
          { tag: '联想', label: '联想星球' },
          { tag: '英语词汇', label: '词汇星球' },
          { tag: '英语听力', label: '听力星球' },
          { tag: '英语语法', label: '语法星球' },
          { tag: '英语阅读', label: '阅读星球' },
          { tag: '英语写作', label: '写作星球' },
          { tag: '完形填空', label: '完形星球' },
          { tag: '闪电', label: '闪电星球' },
          { tag: '听写', label: '听写星球' },
        ],
        matchRecord: (r) => r.subject === 'english' && !r.card_id?.startsWith('en_j2_'),
        getPlanetTag: (r) => {
          const tag = r.knowledge_tag || ''
          if (tag === '联想星球' || tag === '英语联想') return '联想'
          if (tag === '初中单词星球') return '英语词汇'
          if (tag === '闪电测验') return '闪电'
          if (r.card_id?.includes('cloze')) return '完形填空'
          if (tag === 'dictation_english') return '听写'
          return tag
        },
      },
      english_junior: {
        label: '英语', emoji: '🌍', grade: 'junior',
        planets: [
          { tag: '联想', label: '联想星球' },
          { tag: '英语词汇', label: '词汇星球' },
          { tag: '英语听力', label: '听力星球' },
          { tag: '英语语法', label: '语法星球' },
          { tag: '英语阅读', label: '阅读星球' },
          { tag: '英语写作', label: '写作星球' },
          { tag: '完形填空', label: '完形星球' },
          { tag: '闪电', label: '闪电星球' },
          { tag: '听写', label: '听写星球' },
        ],
        matchRecord: (r) => r.subject === 'english' && r.card_id?.startsWith('en_j2_'),
        getPlanetTag: (r) => {
          const tag = r.knowledge_tag || ''
          if (tag === '联想星球' || tag === '英语联想') return '联想'
          if (tag === '初中单词星球') return '英语词汇'
          if (tag === '闪电测验') return '闪电'
          if (r.card_id?.includes('cloze')) return '完形填空'
          if (tag === 'dictation_english') return '听写'
          return tag
        },
      },
      chinese_junior: {
        label: '语文', emoji: '📖', grade: 'junior',
        planets: [
          { tag: '语言基础', label: '基础星球' },
          { tag: '古诗文', label: '古诗文星球' },
          { tag: '文言文', label: '文言文星球' },
          { tag: '现代文阅读', label: '阅读星球' },
          { tag: '名著阅读', label: '名著星球' },
          { tag: '语言运用', label: '表达星球' },
          { tag: '作文', label: '作文星球' },
        ],
        matchRecord: (r) => r.subject === 'chinese_junior',
        getPlanetTag: (r) => {
          const tag = r.knowledge_tag || ''
          const BASIC = ['字音辨析','字形辨析','字音字形综合','词语运用','词语综合运用','语言综合运用','病句辨析','病句综合辨析','标点符号','句子排序','文学常识']
          const POETRY = ['古诗文默写','古诗词赏析','古诗文常识']
          const CLASSICAL = ['实词解释','虚词用法','句式翻译','文言文翻译','文言文阅读']
          const EXPRESSION = ['仿写句子','语言得体','信息概括','图文转换','综合性学习']
          if (BASIC.includes(tag)) return '语言基础'
          if (POETRY.includes(tag)) return '古诗文'
          if (CLASSICAL.includes(tag)) return '文言文'
          if (EXPRESSION.includes(tag)) return '语言运用'
          return tag
        },
      },
      politics: {
        label: '道法', emoji: '🏛️', grade: 'junior',
        planets: [
          { tag: '基石', label: '基石星球' },
          { tag: '思辨', label: '思辨星球' },
          { tag: '洞察', label: '洞察星球' },
          { tag: '行动', label: '行动星球' },
        ],
        matchRecord: (r) => r.subject === 'politics',
        getPlanetTag: (r) => {
          const cid = r.card_id || ''
          if (cid.includes('analysis')) return '思辨'
          if (cid.includes('_sa_')) return '洞察'
          if (cid.includes('explore')) return '行动'
          if (cid.includes('combo')) return '思辨'
          return '基石'
        },
      },
    }

    const report = {}
    for (const [subjKey, subjDef] of Object.entries(SUBJECT_PLANETS)) {
      const subjRecords = todayRecords.filter(r => subjDef.matchRecord(r))
      if (subjRecords.length === 0) continue

      const planetStats = {}
      for (const planet of subjDef.planets) {
        const pRecords = subjRecords.filter(r => {
          const tag = subjDef.getPlanetTag(r) || ''
          return tag === planet.tag || tag.includes(planet.tag) || planet.tag.includes(tag)
        })
        if (pRecords.length === 0) continue
        const correct = pRecords.filter(r => r.correct).length
        const totalTime = pRecords.reduce((s, r) => s + (r.time_spent || 0), 0)
        planetStats[planet.tag] = {
          label: planet.label,
          total: pRecords.length,
          correct,
          accuracy: Math.round(correct / pRecords.length * 100),
          avgTime: Math.round(totalTime / pRecords.length * 10) / 10,
        }
      }

      const totalQ = subjRecords.length
      const totalCorrect = subjRecords.filter(r => r.correct).length
      const avgTime = subjRecords.reduce((s, r) => s + (r.time_spent || 0), 0) / totalQ
      const acc = totalCorrect / totalQ

      let effort = '正常'
      if (avgTime < 3 && acc < 0.5) effort = '敷衍'
      else if (acc >= 0.8 && avgTime >= 5) effort = '认真'
      else if (acc < 0.5) effort = '需关注'

      report[subjKey] = {
        label: subjDef.label,
        emoji: subjDef.emoji,
        grade: subjDef.grade || 'primary',
        totalQuestions: totalQ,
        totalCorrect,
        accuracy: Math.round(acc * 100),
        avgTime: Math.round(avgTime * 10) / 10,
        totalTime: Math.round(subjRecords.reduce((s, r) => s + (r.time_spent || 0), 0)),
        effort,
        planets: planetStats,
        allPlanets: subjDef.planets,
      }
    }
    return report
  },

  // Streak
  getStreak: (userId) =>
    lsParse(P + 'streak_' + userId, {"count":0,"lastDate":null}),
  setStreak: (userId, streak) =>
    lsSet(P + 'streak_' + userId, JSON.stringify(streak)),

  // XP
  getXP: (userId) => parseInt(lsGet(P + 'xp_' + userId) || '0'),
  addXP: (userId, amount) => {
    const xp = storage.getXP(userId) + amount;
    lsSet(P + 'xp_' + userId, String(xp));
    return xp;
  },

  // 今日已见题目（跨 session 去重，防止同一天反复刷到相同题）
  // 结构: { date: "2026-04-14", ids: ["en_001", "en_002", ...] }
  getSeenToday: (userId) => {
    const data = lsParse(P + 'seen_today_' + userId, {})
    const today = new Date().toISOString().split('T')[0]
    if (data.date !== today) return []   // 日期变了，视为空
    return data.ids || []
  },
  markSeenToday: (userId, ids) => {
    const today = new Date().toISOString().split('T')[0]
    const existing = storage.getSeenToday(userId)
    const merged = [...new Set([...existing, ...ids])]
    lsSet(P + 'seen_today_' + userId, JSON.stringify({ date: today, ids: merged }))
  },

  // Parent PIN
  getParentPin: () => lsGet(P + 'pin') || null,
  setParentPin: (pin) => lsSet(P + 'pin', pin),

  // Essay history: [{ id, prompt, content, score, feedback, createdAt }]
  getEssays: (userId) =>
    lsParse(P + 'essays_' + userId, []),
  addEssay: (userId, essay) => {
    const list = storage.getEssays(userId);
    list.unshift({ ...essay, id: Date.now().toString(), createdAt: new Date().toISOString() });
    // keep latest 30
    lsSet(P + 'essays_' + userId, JSON.stringify(list.slice(0, 30)));
  },

  // Sentence practice history: [{ id, word, sentence, score, result, createdAt }]
  getSentenceHistory: (userId) =>
    lsParse(P + 'sentences_' + userId, []),
  addSentenceHistory: (userId, item) => {
    const list = storage.getSentenceHistory(userId);
    list.unshift({ ...item, id: Date.now().toString(), createdAt: new Date().toISOString() });
    lsSet(P + 'sentences_' + userId, JSON.stringify(list.slice(0, 100)));
  },

  // MV1: Per-user/per-device simple gamification state persistence (localStorage)
  // Keyed as mv1_gamification_[userId] if userId available, else mv1_gamification_session
  getMV1State: (userId) => {
    const key = userId ? `mv1_gamification_${userId}` : 'mv1_gamification_session';
    return lsParse(P + key, null)
  },
  setMV1State: (userId, state) => {
    const key = userId ? `mv1_gamification_${userId}` : 'mv1_gamification_session';
    lsSet(P + key, JSON.stringify(state))
  },

  // 本地用户目录：保存曾在此设备登录过的所有用户（用于同设备重新登录时恢复 userId）
  getUsersDir: () =>
    lsParse(P + 'users_dir', []),
  saveToUsersDir: (user) => {
    const dir = lsParse(P + 'users_dir', []);
    const entry = { id: user.id, name: user.name, pin: user.pin, createdAt: user.createdAt };
    const idx = dir.findIndex(u => u.id === user.id);
    if (idx >= 0) dir[idx] = entry;
    else dir.push(entry);
    lsSet(P + 'users_dir', JSON.stringify(dir));
  },

  // 退出账号（保留用户目录，以便再次登录时恢复 userId）
  logout: () => {
    const user = storage.getUser();
    if (user) storage.saveToUsersDir(user);
    lsRemove(P + 'user');
  },

  // ★ 读取宠物状态（含旧 key 自动迁移）
  // 旧 key: 'mv1_pet_state'（无 userId，多用户会互相污染）
  // 新 key: 'mv1_pet_state_${userId}'（含 userId，安全隔离）
  // 首次使用新版本时，自动把旧 key 数据迁移到新 key
  readPetState: (userId) => {
    try {
      if (userId) {
        const newKey = `mv1_pet_state_${userId}`;
        const newVal = lsGet(newKey);
        if (newVal) return JSON.parse(newVal);
        // 新 key 没有，尝试旧 key（迁移场景）
        const oldVal = lsGet('mv1_pet_state');
        if (oldVal) {
          const parsed = JSON.parse(oldVal);
          // 迁移：把数据复制到新 key
          lsSet(newKey, oldVal);
          // 保留旧 key（不删，防止其他账号还在用）
          return parsed;
        }
      }
    } catch (_) {}
    return null;
  },

  // 错题集：最近一次答错的题目 card_id 集合
  getWrongCardIds: (userId) => {
    const records = storage.getRecords(userId);
    const flagged = storage.getFlaggedQuestions(userId);
    const srsStates = storage.getSrsState(userId);
    // 按 card_id 分组，取每张卡最新一条记录
    const latest = {};
    for (const r of records) {
      if (!latest[r.card_id] || r.timestamp > latest[r.card_id].timestamp) {
        latest[r.card_id] = r;
      }
    }
    // 返回最近一次答错的 card_id 集合（排除已标记有问题的题目 + 连续答对2次已"毕业"的）
    return new Set(
      Object.entries(latest)
        .filter(([, r]) => !r.correct)
        .map(([id]) => id)
        .filter(id => !flagged[id])
        .filter(id => {
          const srs = srsStates[id]
          // 连续答对2次以上 = 已掌握，从错题池移除
          if (srs && (srs.consecutiveCorrect || 0) >= 2) return false
          return true
        })
    );
  },

  // 删除指定 card_id 的所有答题记录（本地+云端）
  deleteRecordsByCardId: (userId, cardId) => {
    const records = storage.getRecords(userId);
    const filtered = records.filter(r => r.card_id !== cardId);
    lsSet(P + 'records_' + userId, JSON.stringify(filtered));
    // 同步清理 SRS 状态
    const srs = storage.getSrsState(userId);
    if (srs[cardId]) { delete srs[cardId]; storage.setSrsState(userId, srs); }
    // ★ 同步删除云端记录（防止刷新后拉回来）
    const cardIds = Array.isArray(cardId) ? cardId : [cardId]
    fetch('/api/records/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, cardIds }),
    }).catch(() => {})
    return filtered.length;
  },

  // 🚩 题目标记（孩子觉得题目有问题时标记，家长后台审核）
  // 结构: { [cardId]: { reason, timestamp, question_preview, subject } }
  getFlaggedQuestions: (userId) =>
    lsParse(P + 'flagged_' + userId, {}),
  flagQuestion: (userId, cardId, reason, preview, subject) => {
    const key = P + 'flagged_' + userId;
    const data = lsParse(key, {});
    data[cardId] = { reason, timestamp: new Date().toISOString(), question_preview: (preview || '').slice(0, 120), subject: subject || '' };
    lsSet(key, JSON.stringify(data));
  },
  unflagQuestion: (userId, cardId) => {
    const key = P + 'flagged_' + userId;
    const data = lsParse(key, {});
    delete data[cardId];
    lsSet(key, JSON.stringify(data));
  },

  // 今日到期错题数：nextReview <= today 的错题（不含未来复习的）
  getDueTodayWrongCount: (userId, grade) => {
    const wrongIds = storage.getWrongCardIds(userId);
    if (wrongIds.size === 0) return 0;
    const srsStates = storage.getSrsState(userId);
    const today = new Date().toISOString().split('T')[0];
    const records = storage.getRecords(userId);

    // 按学段过滤学科
    const gradeSubjects = (grade === 'junior2' || grade === 'junior')
      ? ['english', 'math', 'politics', 'chinese_junior']
      : ['chinese', 'english', 'math'];

    // 预构建：最近答错时间 + 今天是否答对过
    const lastWrongDate = {};
    const correctToday = new Set();
    for (const r of records) {
      const date = (r.timestamp || '').slice(0, 10);
      if (wrongIds.has(r.card_id)) {
        if (!r.correct) {
          if (!lastWrongDate[r.card_id] || date > lastWrongDate[r.card_id]) {
            lastWrongDate[r.card_id] = date;
          }
        } else if (date === today) {
          correctToday.add(r.card_id);
        }
      }
    }

    // 构建card_id到subject的映射（从记录中推断）
    const cardSubjects = {};
    for (const r of records) {
      if (!cardSubjects[r.card_id]) cardSubjects[r.card_id] = r.subject;
    }

    let count = 0;
    for (const id of wrongIds) {
      // 跳过今天已答对的卡片
      if (correctToday.has(id)) continue;
      // 跳过不在本学段学科的卡片
      const subj = cardSubjects[id];
      if (subj && !gradeSubjects.includes(subj)) continue;

      const state = srsStates[id];
      if (!state) {
        if (lastWrongDate[id] === today) continue;
        count++;
      } else if (state.nextReview <= today) {
        count++;
      }
    }
    return count;
  },

  // 积压错题数：SRS 到期日已过 3 天以上（还没答对过），按学段过滤
  getOverdueWrongCount: (userId, grade) => {
    const wrongIds = storage.getWrongCardIds(userId);
    if (wrongIds.size === 0) return 0;

    // 按学段确定允许的学科
    const gradeSubjects = grade === 'junior2'
      ? ['english', 'math', 'politics', 'chinese_junior']
      : ['chinese', 'english', 'math'];

    // 获取每张卡的 subject
    const records = storage.getRecords(userId);
    const cardSubjects = {};
    for (const r of records) {
      if (!cardSubjects[r.card_id]) cardSubjects[r.card_id] = r.subject || 'chinese';
    }

    const srsStates = storage.getSrsState(userId);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 3);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    let count = 0;
    for (const id of wrongIds) {
      const sub = cardSubjects[id];
      if (!gradeSubjects.includes(sub)) continue;
      const state = srsStates[id];
      if (!state || state.nextReview <= cutoffStr) count++;
    }
    return count;
  },

  // ── Premium 诊断报告 ──
  getPremiumStatus: (userId) =>
    lsParse(P + 'premium_' + userId, { isPremium: false, expiresAt: null }),

  setPremiumStatus: (userId, status) =>
    lsSet(P + 'premium_' + userId, JSON.stringify(status)),

  isPremiumActive: (userId) => {
    const s = storage.getPremiumStatus(userId)
    if (!s.isPremium) return false
    if (s.expiresAt && new Date(s.expiresAt) < new Date()) {
      storage.setPremiumStatus(userId, { isPremium: false, expiresAt: s.expiresAt })
      return false
    }
    return true
  },

  activatePremiumTrial: (userId) => {
    const expires = new Date()
    expires.setDate(expires.getDate() + 30)
    storage.setPremiumStatus(userId, { isPremium: true, expiresAt: expires.toISOString() })
  },

  getPremiumReport: (userId) =>
    lsParse(P + 'premium_report_' + userId, null),

  setPremiumReport: (userId, data) =>
    lsSet(P + 'premium_report_' + userId, JSON.stringify(data)),

  getActionPlan: (userId) =>
    lsParse(P + 'action_plan_' + userId, null),

  setActionPlan: (userId, plan) =>
    lsSet(P + 'action_plan_' + userId, JSON.stringify(plan)),
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

// 计算升级所需经验（按1.2倍递增）
export function getRequiredExpForLevel(level) {
  if (level <= 1) return 100;
  let exp = 100;
  for (let i = 2; i <= level; i++) {
    exp = Math.round(exp * 1.2);
  }
  return exp;
}

// 根据总经验计算当前等级
export function calcLevel(totalExperience) {
  let level = 1;
  let accumulatedExp = 0;
  let currentLevelExp = 100;
  
  while (accumulatedExp + currentLevelExp <= totalExperience) {
    accumulatedExp += currentLevelExp;
    level++;
    currentLevelExp = Math.round(currentLevelExp * 1.2);
    if (level >= 50) break; // 等级上限50
  }
  
  return Math.min(level, 50);
}

// 计算当前等级的经验进度
export function calcLevelProgress(totalExperience) {
  let accumulatedExp = 0;
  let currentLevelExp = 100;
  let level = 1;
  
  while (accumulatedExp + currentLevelExp <= totalExperience) {
    accumulatedExp += currentLevelExp;
    level++;
    currentLevelExp = Math.round(currentLevelExp * 1.2);
    if (level >= 50) break;
  }
  
  const currentExp = totalExperience - accumulatedExp;
  return { currentExp, requiredExp: currentLevelExp, level };
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

// 启动时检查连续天数是否已断，断了则重置为0
export function checkStreakOnLoad(userId) {
  const streak = storage.getStreak(userId);
  if (!streak.lastDate) return streak;
  const today = new Date().toISOString().split('T')[0];
  if (streak.lastDate === today) return streak;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yest = yesterday.toISOString().split('T')[0];
  if (streak.lastDate === yest) return streak;
  // 断了，重置为0
  const reset = { count: 0, lastDate: streak.lastDate };
  storage.setStreak(userId, reset);
  return reset;
}
