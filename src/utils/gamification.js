// ============================================================
//  汉字星球 - 宠物养成系统 (P0 + P1 完整版 v2 - 18宠版)
// ============================================================

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ---- 宠物池（18只，N=5 / R=6 / SR=5 / SSR=2）----
const PET_POOL = [
  // === N级 普通 (5只) ===
  { poolId: 'pet_kitten',   name: '小橘猫', emoji: '🐱', rarity: 'N',  desc: '橙色小猫咪，爱吃爱睡', personality: 'lazy', spritePrefix: 'kitten' },
  { poolId: 'pet_puppy',    name: '小柴犬', emoji: '🐶', rarity: 'N',  desc: '忠诚小柴犬，摇尾巴狂魔', personality: 'loyal', spritePrefix: 'puppy' },
  { poolId: 'pet_bunny',    name: '兔丸子', emoji: '🐰', rarity: 'N',  desc: '圆滚滚的垂耳兔', personality: 'shy', spritePrefix: 'bunny' },
  { poolId: 'pet_hamster', name: '团子',   emoji: '🐹', rarity: 'N',  desc: '金仓鼠，腮帮子鼓鼓的', personality: 'active', spritePrefix: 'hamster' },
  { poolId: 'pet_chick',    name: '喳喳',   emoji: '🐥', rarity: 'N',  desc: '小黄鸡，永远充满活力', personality: 'curious', spritePrefix: 'chick' },
  // === R级 稀有 (6只) ===
  { poolId: 'pet_fox',      name: '灵狐',   emoji: '🦊', rarity: 'R',  desc: '九尾小火狐（只有一条大尾巴）', personality: 'smart', spritePrefix: 'fox' },
  { poolId: 'pet_panda',    name: '滚滚',   emoji: '🐼', rarity: 'R',  desc: '圆乎乎的大熊猫', personality: 'clumsy', spritePrefix: 'panda' },
  { poolId: 'pet_penguin',  name: '波波',   emoji: '🐧', rarity: 'R',  desc: '戴领结的小企鹅', personality: 'gentleman', spritePrefix: 'penguin' },
  { poolId: 'pet_shiba',    name: '柴柴',   emoji: '🐕', rarity: 'R',  desc: '表情包大师柴犬', personality: 'funny', spritePrefix: 'shiba' },
  { poolId: 'pet_squirrel', name: '松松',   emoji: '🐿️', rarity: 'R',  desc: '抱松果的小松鼠', personality: 'diligent', spritePrefix: 'squirrel' },
  { poolId: 'pet_duck',     name: '嘎嘎',   emoji: '🦆', rarity: 'R',  desc: '戴墨镜的酷鸭子', personality: 'cool', spritePrefix: 'duck' },
  // === SR级 超稀 (5只) ===
  { poolId: 'pet_toothless',name: '无牙仔', emoji: '🐉', rarity: 'SR', desc: '没牙的小黑龙，最爱吃鱼', personality: 'tsundere', spritePrefix: '' }, // 空前缀=使用默认dragon图
  { poolId: 'pet_phoenix',  name: '小凤凰', emoji: '🔥', rarity: 'SR', desc: '金色小火凤凰，羽翼绚烂', personality: 'noble', spritePrefix: 'phoenix' },
  { poolId: 'pet_unicorn',  name: '梦角',   emoji: '🦄', rarity: 'SR', desc: '月光独角兽，角会发光', personality: 'dreamy', spritePrefix: 'unicorn' },
  { poolId: 'pet_kirin',    name: '小麒麟', emoji: '🦌', rarity: 'SR', desc: '云端踏步的小麒麟', personality: 'righteous', spritePrefix: 'kirin' },
  { poolId: 'pet_fairy',    name: '萤萤',   emoji: '🧚', rarity: 'SR', desc: '星光小仙子，翅膀透明', personality: 'healing', spritePrefix: 'fairy' },
  // === SSR级 传说 (2只) ===
  { poolId: 'pet_dragon',   name: '龙王',   emoji: '🐲', rarity: 'SSR',desc: '东方神龙幼崽，鳞片闪耀', personality: 'majestic', spritePrefix: 'dragon_ss' },
  { poolId: 'pet_star',     name: '星灵',   emoji: '⭐', rarity: 'SSR',desc: '宇宙诞生的小星星', personality: 'mystic', spritePrefix: 'star' },
];

// ---- 阶段计算 ----
function stageFromLevel(level) {
  if (level < 2) return '蛋';
  if (level < 10) return '幼年';
  if (level < 20) return '成长期';
  if (level < 30) return '成熟体';
  return '完全体';
}
function getPetStage(level) { return stageFromLevel(level); }

// ============================================================
//  P0-1: 四维状态系统
// ============================================================
const PET_STATS_MAX = {
  hunger: 100,    // 饱食度
  cleanliness: 100, // 清洁度
  energy: 100,    // 活力值
  intimacy: 0,    // 亲密度 (0→100, 越高越好)
};

const STAT_DECAY_RATE = {
  // 每分钟衰减量（游戏内时间）
  // [2026-04-15 优化] 调整为更友好的衰减速度，减少用户焦虑感
  hunger: 0.2,       // 约8.3小时从满饿到0（原3.3h → 更合理）
  cleanliness: 0.28,  // 约6小时变脏（原2h → 更友好）
  energy: 0.15,       // 活力衰减更慢（原0.3 → 降低一半）
  intimacy: -0.02,    // 自然缓慢下降（原-0.05 → 亲密度更持久）
};

// 状态对应的文案标签和颜色
export const STAT_CONFIG = {
  hunger:     { icon: '🍖', label: '饱食度', color: '#f59e0b', bgColor: '#fef3c7', lowColor: '#ef4444' },
  cleanliness:{ icon: '✨', label: '清洁度', color: '#3b82f6', bgColor: '#dbeafe', lowColor: '#ef4444' },
  energy:     { icon: '⚡', label: '活力值', color: '#10b981', bgColor: '#d1fae5', lowColor: '#ef4444' },
  intimacy:   { icon: '❤️', label: '亲密度', color: '#ec4899', bgColor: '#fce7f3', lowColor: '#9ca3af' },
};

// ============================================================
//  P0-2: 气泡对话库
// ============================================================
export const PET_DIALOGUES = {
  // 根据状态触发的对话
  hungry: [
    '肚子咕咕叫...🐟',
    '想吃鱼！有吃的吗？',
    '饿了饿了...主人~',
    '饭点到了吗？',
    '我的肚子在唱歌...',
  ],
  dirty: [
    '身上好痒...想洗澡🛁',
    '我是不是变脏了？',
    '能不能帮我洗洗？',
    '嗯...有点不舒服...',
  ],
  tired: [
    '哈欠...想睡了💤',
    '眼睛睁不开了...',
    '让我休息一会儿吧...',
    'Zzz...',
  ],
  sad: [  // 亲密度低
    '你去哪了...我想你😢',
    '好久没人理我了...',
    '一个人好无聊...',
    '主人...你在吗？',
  ],
  happy: [  // 亲密度高
    '今天也要加油哦~✨',
    '你最棒啦！',
    '和你在一起最开心！',
    '嘿嘿，继续加油！',
    '我爱你主人！💕',
  ],
  levelUp: [
    '哇！我感觉更强了！🔥',
    '进化成功！太酷了！',
    '我升级啦！！',
    '新的力量涌上来了！⭐',
  ],
  fed: [
    '好好吃！谢谢！😋',
    '味道棒极了！',
    '吃饱饱~满足！',
    '再来一份也可以~🍖',
  ],
  cleaned: [
    '香喷喷~✨',
    '好舒服！干净多了！',
    '像新的一样！',
    '我爱洗澡~🛁',
  ],
  rested: [
    '精神满满！⚡',
    '睡得好香！',
    '充满电了！',
    '准备好玩了！🎮',
  ],
  tapped: [
    '嘿嘿，痒~😆',
    '再摸一下？',
    '舒服~~',
    '哈哈，别闹~',
    '摸头杀！喜欢！',
  ],
  correctAnswer: [
    '太厉害了！答对了！🎉',
    '主人真聪明！',
    '又学到了！',
    '满分答案！⭐',
  ],
  wrongAnswer: [
    '没关系，下次一定行！💪',
    '别灰心哦~',
    '失败是成功之母！',
    '我们一起加油！',
  ],
  idle: [  // 随机待机
    '今天天气真好~☀️',
    '在干嘛呢？',
    '无聊...陪我玩嘛~',
    '★～(￣▽￣～)*~',
    '(o゜▽゜)o☆',
    '哼着歌~🎵',
    '发呆中...',
  ],
  morning: [
    '早上好呀！☀️',
    '新的一天开始啦！',
    '早安早安~',
  ],
  night: [
    '晚安...做个好梦🌙',
    '月亮出来了...',
    '该休息啦主人~',
  ],
};

// 获取当前应该显示的对话类型
export function getDialogueType(stats, lastAction) {
  const { hunger, cleanliness, energy, intimacy } = stats;
  
  // 优先级：紧急状态 > 上次动作 > 心情 > 随机
  if (hunger < 25) return 'hungry';
  if (cleanliness < 25) return 'dirty';
  if (energy < 20) return 'tired';
  if (intimacy < 20 && lastAction !== 'tapped') return 'sad';
  
  if (lastAction) return lastAction;
  if (intimacy > 70) return pick(['happy', 'idle']);
  return 'idle';
}

export function getDialogue(type) {
  return pick(PET_DIALOGUES[type] || PET_DIALOGUES.idle);
}

// ============================================================
//  P1-4: 每日任务系统（简化版）
// ============================================================
// 修复：任务设计更合理，避免重复劳动和难度过高
export const DAILY_TASK_TEMPLATES = [
  {
    id: 'daily_learn',
    type: 'learn',
    icon: '📖',
    title: '每日学习',
    desc: '完成10道答题',
    target: 10,
    reward: { exp: 30, item: 'snack', itemCount: 1 },
    statReward: { intimacy: 5 },
  },
  {
    id: 'daily_feed',
    type: 'care',
    icon: '🍖',
    title: '每日喂养',
    desc: '喂宠物1次',
    target: 1,
    reward: { exp: 20 },
    statReward: { intimacy: 3 },
  },
  {
    id: 'daily_interact',
    type: 'interact',
    icon: '👋',
    title: '每日互动',
    desc: '抚摸宠物3次',
    target: 3,
    reward: { exp: 15, intimacy: 5 },
    statReward: {},
  },
  {
    id: 'daily_streak',
    type: 'challenge',
    icon: '🎯',
    title: '连续挑战',
    desc: '连续答对5道题',
    target: 5,
    reward: { exp: 50, item: 'rare_snack', itemCount: 1 },
    statReward: { intimacy: 10 },
  },
];

// 初始化每日任务状态
export function initDailyTasks(lastResetDate) {
  const today = new Date().toDateString();
  // 如果日期变了，重置任务
  if (lastResetDate && lastResetDate === today) {
    return null; // 已初始化过
  }
  return DAILY_TASK_TEMPLATES.map(t => ({
    ...t,
    progress: 0,
    completed: false,
    claimed: false,
  }));
}

// 更新任务进度
export function updateTaskProgress(tasks, taskId, amount = 1) {
  if (!tasks) return tasks;
  return tasks.map(t => {
    if (t.id !== taskId || t.completed) return t;
    const newProgress = Math.min(t.progress + amount, t.target);
    return { ...t, progress: newProgress, completed: newProgress >= t.target };
  });
}

// 按任务类型批量更新进度（传入完整 state，按 type 字段匹配）
export function updateTaskByType(state, type, amount = 1) {
  if (!state.dailyTasks) return state;
  const newTasks = state.dailyTasks.map(t => {
    if (t.type !== type || t.completed || t.claimed) return t;
    const newProgress = Math.min((t.progress || 0) + amount, t.target);
    return { ...t, progress: newProgress, completed: newProgress >= t.target };
  });
  return { ...state, dailyTasks: newTasks };
}

// 领取任务奖励
export function claimTaskReward(state, taskId) {
  const task = state.dailyTasks?.find(t => t.id === taskId);
  if (!task || !task.completed || task.claimed) return state;
  
  let s = { ...state };
  s.exp = (s.exp || 0) + (task.reward.exp || 0);
  
  // 更新宠物亲密度
  if (task.statReward?.intimacy && s.currentPet?.stats) {
    s.currentPet = {
      ...s.currentPet,
      stats: {
        ...s.currentPet.stats,
        intimacy: clamp(s.currentPet.stats.intimacy + task.statReward.intimacy, 0, 100),
      }
    };
  }
  
  // 发放道具奖励
  if (task.reward.item) {
    s.inventory = { ...s.inventory };
    if (task.reward.item === 'snack') {
      s.inventory.foods = { ...s.inventory.foods, basic: (s.inventory.foods?.basic || 0) + (task.reward.itemCount || 1) };
    } else if (task.reward.item === 'rare_snack') {
      s.inventory.foods = { ...s.inventory.foods, advanced: (s.inventory.foods?.advanced || 0) + (task.reward.itemCount || 1) };
    }
  }
  
  // 标记已领取
  s.dailyTasks = s.dailyTasks.map(t =>
    t.id === taskId ? { ...t, claimed: true } : t
  );
  
  return s;
}

// ============================================================
//  P1-5: 配饰/装扮系统
// ============================================================
export const ACCESSORY_SLOTS = ['head', 'neck', 'back'];

export const ACCESSORY_SHOP = [
  // ===== 头部配饰（10件）=====
  { id: 'acc_crown', slot: 'head', name: '小皇冠', icon: '👑', price: 200, rarity: 'SR', emoji: '👑', desc: '皇家风范' },
  { id: 'acc_glasses', slot: 'head', name: '学霸眼镜', icon: '🤓', price: 100, rarity: 'R', emoji: '🤓', desc: '看起来很聪明' },
  { id: 'acc_cat_ears', slot: 'head', name: '猫耳发带', icon: '🐱', price: 150, rarity: 'R', emoji: '🐱', desc: '喵~ 可爱加倍' },
  { id: 'acc_antler', slot: 'head', name: '小鹿角', icon: '🦌', price: 180, rarity: 'R', emoji: '🦌', desc: '森林气息' },
  { id: 'acc_star_hat', slot: 'head', name: '星星帽', icon: '🌟', price: 300, rarity: 'SSR', emoji: '🌟', desc: '闪闪发光!' },
  { id: 'acc_santa', slot: 'head', name: '圣诞帽', icon: '🎅', price: 250, rarity: 'SR', emoji: '🎅', desc: '圣诞快乐~' },
  { id: 'acc_flower_head', slot: 'head', name: '花环', icon: '💐', price: 160, rarity: 'R', emoji: '💐', desc: '春天的气息' },
  { id: 'acc_headphones', slot: 'head', name: '耳机', icon: '🎧', price: 220, rarity: 'SR', emoji: '🎧', desc: '听歌中...' },
  { id: 'acc_wizard_hat', slot: 'head', name: '巫师帽', icon: '🎩', price: 350, rarity: 'SSR', emoji: '🎩', desc: '魔法满点' },
  { id: 'acc_antenna', slot: 'head', name: '天线触角', icon: '📡', price: 180, rarity: 'R', emoji: '📡', desc: '信号满格' },

  // ===== 颈部配饰（8件）=====
  { id: 'acc_scarf', slot: 'neck', name: '围巾', icon: '🧣', price: 80, rarity: 'N', emoji: '🧣', desc: '暖暖的' },
  { id: 'acc_bowtie', slot: 'neck', name: '领结', icon: '🎀', price: 120, rarity: 'R', emoji: '🎀', desc: '绅士风度' },
  { id: 'acc_necklace', slot: 'neck', name: '宝石项链', icon: '💎', price: 400, rarity: 'SSR', emoji: '💎', desc: '超级珍贵!' },
  { id: 'acc_bell', slot: 'neck', name: '铃铛项圈', icon: '🔔', price: 90, rarity: 'N', emoji: '🔔', desc: '叮铃叮铃~' },
  { id: 'acc_bowtie_red', slot: 'neck', name: '红领结', icon: '❤️', price: 100, rarity: 'N', emoji: '❤️', desc: '经典红' },
  { id: 'acc_neck_ruby', slot: 'neck', name: '红宝石项圈', icon: '📿', price: 450, rarity: 'SSR', emoji: '📿', desc: '奢华之选' },
  { id: 'acc_scarf_winter', slot: 'neck', name: '冬季围巾', icon: '🧣', price: 120, rarity: 'R', emoji: '🧣', desc: '温暖过冬' },
  { id: 'acc_medal', slot: 'neck', name: '勋章', icon: '🏅', price: 280, rarity: 'SR', emoji: '🏅', desc: '荣誉象征' },

  // ===== 背部配饰（7件）=====
  { id: 'acc_wings', slot: 'back', name: '小翅膀', icon: '🧚', price: 280, rarity: 'SR', emoji: '🧚', desc: '可以飞咯!' },
  { id: 'acc_cape', slot: 'back', name: '披风', icon: '🦸', price: 200, rarity: 'R', emoji: '🦸', desc: '超级英雄风' },
  { id: 'acc_backpack', slot: 'back', name: '小书包', icon: '🎒', price: 130, rarity: 'R', emoji: '🎒', desc: '上学去!' },
  { id: 'acc_halo', slot: 'back', name: '光环', icon: '😇', price: 500, rarity: 'SSR', emoji: '😇', desc: '神圣之光' },
  { id: 'acc_jetpack', slot: 'back', name: '喷气背包', icon: '🚀', price: 400, rarity: 'SSR', emoji: '🚀', desc: '起飞!' },
  { id: 'acc_cape_hero', slot: 'back', name: '英雄披风', icon: '🦸', price: 250, rarity: 'SR', emoji: '🦸', desc: '正义降临' },
  { id: 'acc_wings_fairy', slot: 'back', name: '仙子翅膀', icon: '👼', price: 320, rarity: 'SR', emoji: '👼', desc: '梦幻羽翼' },
];

// 获取某个槽位已装备的配饰
export function getEquippedAccessory(pet, slot) {
  const equipped = pet?.equippedAccessories || {};
  const accId = equipped[slot];
  if (!accId) return null;
  return ACCESSORY_SHOP.find(a => a.id === accId) || null;
}

// 装备配饰
export function equipAccessory(state, accessoryId) {
  const acc = ACCESSORY_SHOP.find(a => a.id === accessoryId);
  if (!acc) return state;
  
  const owned = state.inventory?.accessories || [];
  if (!owned.includes(accessoryId)) return state; // 未拥有
  
  const pet = { ...state.currentPet };
  const equipped = { ...(pet.equippedAccessories || {}) };
  equipped[acc.slot] = accessoryId; // 替换该槽位
  
  return {
    ...state,
    currentPet: { ...pet, equippedAccessories: equipped },
  };
}

// 卸下配饰
export function unequipAccessory(state, slot) {
  const pet = { ...state.currentPet };
  const equipped = { ...(pet.equippedAccessories || {}) };
  delete equipped[slot];
  return {
    ...state,
    currentPet: { ...pet, equippedAccessories: equipped },
  };
}

// 购买配饰
export function buyAccessory(state, accessoryId) {
  const acc = ACCESSORY_SHOP.find(a => a.id === accessoryId);
  if (!acc) return state;
  if ((state.exp || 0) < acc.price) return state;
  
  const owned = [...(state.inventory?.accessories || [])];
  if (owned.includes(accessoryId)) return state; // 已拥有
  
  owned.push(accessoryId);
  return {
    ...state,
    exp: state.exp - acc.price,
    inventory: { ...state.inventory, accessories: owned },
  };
}

// ============================================================
//  商店商品（整合旧版 + 新版图片商品）
// ============================================================
export const SHOP_ITEMS = [
  // ---- 食物类 ----
  { id: 'food_basic', name: '普通鱼干', icon: '🐟', price: 30, kind: 'food', amount: 1,
    rarity: 'N', desc: '+15饱食度', effect: { hunger: 15 }, image: null },
  { id: 'food_advanced', name: '烤全鱼', icon: '🐠', price: 80, kind: 'food', amount: 1,
    rarity: 'R', desc: '+40饱食度 +5亲密度', effect: { hunger: 40, intimacy: 5 }, image: null },
  { id: 'food_premium', name: '至尊海鲜拼盘', icon: '🦐', price: 200, kind: 'food', amount: 1,
    rarity: 'SR', desc: '全属性提升!', effect: { hunger: 60, cleanliness: 20, energy: 30, intimacy: 10 }, image: null },
  
  // ---- 清洁类 ----
  { id: 'clean_basic', name: '沐浴露', icon: '🧴', price: 25, kind: 'clean', amount: 1,
    rarity: 'N', desc: '+30清洁度', effect: { cleanliness: 30 }, image: null },
  { id: 'clean_premium', name: 'SPA套餐', icon: '💆', price: 120, kind: 'clean', amount: 1,
    rarity: 'SR', desc: '+80清洁度 +活力', effect: { cleanliness: 80, energy: 20 }, image: null },

  // ---- 活力类 ----
  { id: 'energy_drink', name: '能量饮料', icon: '🥤', price: 35, kind: 'energy', amount: 1,
    rarity: 'N', desc: '+35活力', effect: { energy: 35 }, image: null },
  { id: 'energy_bed', name: '舒适小窝', icon: '🛏️', price: 300, kind: 'energy', amount: 1,
    rarity: 'SR', desc: '自动恢复活力', effect: { energy: 80, intimacy: 5 }, image: null },

  // ---- 亲密度道具 ----
  { id: 'gift_toy', name: '小玩具', icon: '🧸', price: 50, kind: 'gift', amount: 1,
    rarity: 'N', desc: '+15亲密度', effect: { intimacy: 15 }, image: null },
  { id: 'gift_rare', name: '神秘礼盒', icon: '🎁', price: 150, kind: 'gift', amount: 1,
    rarity: 'SR', desc: '+40亲密度', effect: { intimacy: 40 }, image: null },

  // ---- 功能类 ----
  { id: 'card_draw', name: '抽卡券', icon: '🃏', price: 500, kind: 'card', amount: 1,
    rarity: 'R', desc: '抽一次宠物卡', effect: {}, image: null },
];

// 使用物品（对宠物生效）—— 库存由调用方预先扣减，这里只应用效果
export function useItemOnPet(state, itemId) {
  const item = SHOP_ITEMS.find(i => i.id === itemId);
  if (!item) return state;

  // 应用效果到宠物属性
  const pet = { ...state.currentPet };
  const stats = { ...(pet.stats || defaultStats()) };

  if (item.effect) {
    for (const [key, val] of Object.entries(item.effect)) {
      if (key in stats) {
        stats[key] = clamp(stats[key] + val, 0, 100);
      }
    }
  }

  pet.stats = stats;
  pet.lastAction = item.kind === 'food' ? 'fed' : item.kind === 'clean' ? 'cleaned'
                    : item.kind === 'energy' ? 'rested' : item.kind === 'gift' ? 'happy' : null;

  return { ...state, currentPet: pet };
}

// 兼容旧版 buyItem
export function buyItem(state, itemId) {
  const item = SHOP_ITEMS.find(i => i.id === itemId);
  if (!item) return state;
  if ((state.exp || 0) < item.price) return state;
  
  const inv = { ...state.inventory };
  // 加入对应库存分类
  if (item.kind === 'food') inv.foods = { ...inv.foods, basic: (inv.foods?.basic || 0) + 1 };
  else if (item.kind === 'clean') inv.cleanItems = (inv.cleanItems || 0) + 1;
  else if (item.kind === 'energy') inv.energyItems = (inv.energyItems || 0) + 1;
  else if (item.kind === 'gift') inv.giftItems = (inv.giftItems || 0) + 1;
  else if (item.kind === 'card') inv.cards = (inv.cards || 0) + 1;
  
  return { ...state, exp: state.exp - item.price, inventory: inv };
}

// ============================================================
//  初始化状态（含四维状态）
// ============================================================
function defaultStats() {
  return {
    hunger: 80,
    cleanliness: 80,
    energy: 90,
    intimacy: 30,
  };
}

export function initGamificationState() {
  return {
    level: 1,
    exp: 100,
    totalStars: 1,
    coins: 0,
    petPool: PET_POOL,
    ownedPets: ['pet_kitten'],  // 默认从N级宠物开始
    currentPet: {
      poolId: 'pet_kitten',   // 默认小橘猫
      level: 1,
      exp: 0,
      mood: 'neutral',
      tapCount: 0,
      stats: defaultStats(),
      equippedAccessories: {},  // { head: 'acc_xxx', neck: 'acc_yyy', back: 'acc_zzz' }
      lastAction: null,
      lastFeedTime: Date.now(),
    },
    dailyTasks: initDailyTasks(),
    dailyLastResetDate: new Date().toDateString(),
    // 任务计数器
    taskCounters: {
      learnCount: 0,
      feedCount: 0,
      interactCount: 0,
      streakCount: 0,
    },
    // 成就系统（P2预留）
    achievements: [],
    // 库存（重构）
    inventory: {
      foods: { basic: 3, advanced: 1 },   // 送新手礼包
      cleanItems: 2,
      energyItems: 2,
      giftItems: 1,
      cards: 1,
      accessories: ['acc_scarf', 'acc_bell'],  // 送新手配饰
    },
    // 设置
    settings: {
      soundEnabled: true,
      notificationsEnabled: true,
    },
    // 统计
    totalLearnQuestions: 0,
    totalCorrectAnswers: 0,
    daysActive: 1,
    lastActiveDate: new Date().toDateString(),
    // 好友系统
    friends: [],
    pendingEncouragements: [],
    weeklyQuestions: 0,
    weeklyResetDate: new Date().toISOString().slice(0, 10),
  };
}

// ============================================================
//  经验与等级 - 🔧 修复版本
// ============================================================
// 计算升级所需经验
function getExpNeededForLevel(level) {
  if (level <= 1) return 100;
  let exp = 100;
  for (let i = 2; i <= level; i++) {
    exp = Math.round(exp * 1.2);
  }
  return exp;
}

// 获取当前等级的升级经验阈值
function getCurrentLevelThreshold(currentLevel) {
  return getExpNeededForLevel(currentLevel);
}

function calcLearnExp(accuracy) {
  const a = clamp(accuracy, 0, 1);
  let bonus = 0;
  if (a < 0.7) bonus = 0;
  else if (a < 0.8) bonus = 0.1;
  else if (a < 0.9) bonus = 0.2;
  else if (a < 1.0) bonus = 0.3;
  else bonus = 0.5;
  return Math.round(20 * (1 + bonus));
}

function gainExpForLearning(state, accuracy, multiplier = 1) {
  const gain = calcLearnExp(accuracy) * multiplier;
  let newExp = state.exp + gain;
  let newLevel = state.level;
  
  // 🔧 修复：使用新的经验计算方式，但不自动升级
  // 用户需要手动点击升级按钮
  
  const s = { ...state, exp: newExp };
  s.totalLearnQuestions = (s.totalLearnQuestions || 0) + 1;
  if (accuracy >= 0.8) s.totalCorrectAnswers = (s.totalCorrectAnswers || 0) + 1;
  
  // 更新学习任务计数
  s.taskCounters = { ...(s.taskCounters || {}) };
  s.taskCounters.learnCount = (s.taskCounters.learnCount || 0) + 1;
  if (accuracy >= 1.0) {
    s.taskCounters.streakCount = (s.taskCounters.streakCount || 0) + 1;
  } else {
    s.taskCounters.streakCount = 0;
  }
  s.dailyTasks = updateTaskProgress(s.dailyTasks, 'daily_learn', 1);
  s.dailyTasks = updateTaskProgress(s.dailyTasks, 'daily_streak', accuracy >= 1.0 ? 1 : 0);
  
  // 答题影响宠物属性
  if (s.currentPet?.stats) {
    const stats = { ...s.currentPet.stats };
    stats.energy = clamp(stats.energy - 2, 0, 100); // 答题消耗活力
    if (accuracy >= 0.8) {
      stats.intimacy = clamp(stats.intimacy + 2, 0, 100); // 答对加亲密
      s.currentPet = { ...s.currentPet, stats, lastAction: 'correctAnswer' };
    } else {
      s.currentPet = { ...s.currentPet, stats, lastAction: 'wrongAnswer' };
    }
  }
  
  return s;
}

// 🔧 新增：手动升级函数
export function manualLevelUp(state) {
  const currentThreshold = getCurrentLevelThreshold(state.level);
  if (state.exp < currentThreshold) {
    return state; // 经验不足，无法升级
  }
  
  const newLevel = state.level + 1;
  const newExp = state.exp - currentThreshold;
  
  // 升级后宠物等级也同步
  const updatedPet = {
    ...state.currentPet,
    level: newLevel,
    stage: stageFromLevel(newLevel),
    lastAction: 'levelUp'
  };
  
  return {
    ...state,
    level: newLevel,
    exp: newExp,
    totalStars: newLevel,
    currentPet: updatedPet
  };
}

// ============================================================
//  宠物操作（新版 - 带状态变化）
// ============================================================
function feedPet(state, amount = 10) {
  const pet = { ...state.currentPet };
  let petExp = (pet.exp || 0) + amount;
  let petLevel = pet.level || 1;
  while (petExp >= 100) { petExp -= 100; petLevel += 1; }
  
  const stats = { ...(pet.stats || defaultStats()) };
  stats.hunger = clamp(stats.hunger + 15, 0, 100); // 喂养增加饱食度
  
  pet.exp = petExp;
  pet.level = petLevel;
  pet.stage = stageFromLevel(petLevel);
  pet.mood = 'neutral';
  pet.tapCount = 0;
  pet.stats = stats;
  pet.lastAction = 'fed';
  pet.lastFeedTime = Date.now();
  
  const s = { ...state, currentPet: pet };
  // 更新喂养任务
  s.taskCounters = { ...(s.taskCounters || {}) };
  s.taskCounters.feedCount = (s.taskCounters.feedCount || 0) + 1;
  s.dailyTasks = updateTaskProgress(s.dailyTasks, 'daily_feed', 1);
  
  return s;
}

function tapPet(state) {
  const pet = { ...state.currentPet };
  const taps = (pet.tapCount || 0) + 1;
  pet.tapCount = taps;
  pet.mood = taps >= 3 ? 'angry' : 'happy';
  pet.showHeart = true;
  pet.lastAction = 'tapped';
  
  // 抚摸增加亲密度
  const stats = { ...(pet.stats || defaultStats()) };
  stats.intimacy = clamp(stats.intimacy + 1, 0, 100);
  pet.stats = stats;
  
  const s = { ...state, currentPet: pet };
  s.taskCounters = { ...(s.taskCounters || {}) };
  s.taskCounters.interactCount = (s.taskCounters.interactCount || 0) + 1;
  s.dailyTasks = updateTaskProgress(s.dailyTasks, 'daily_interact', 1);
  
  return s;
}

function resetPetMood(state) {
  const pet = { ...state.currentPet, mood: 'neutral', showHeart: false, tapCount: 0 };
  return { ...state, currentPet: pet };
}

// 清洗宠物
export function cleanPet(state) {
  const pet = { ...state.currentPet };
  const stats = { ...(pet.stats || defaultStats()) };
  stats.cleanliness = clamp(stats.cleanliness + 40, 0, 100);
  pet.stats = stats;
  pet.lastAction = 'cleaned';
  return { ...state, currentPet: pet };
}

// 让宠物休息/睡觉
export function restPet(state) {
  const pet = { ...state.currentPet };
  const stats = { ...(pet.stats || defaultStats()) };
  stats.energy = clamp(stats.energy + 50, 0, 100);
  // 睡觉稍微降低饱食度
  stats.hunger = clamp(stats.hunger - 5, 0, 100);
  pet.stats = stats;
  pet.lastAction = 'rested';
  return { ...state, currentPet: pet };
}

// 时间流逝 - 状态衰减（每调用一次模拟一段时间）
export function tickPetStats(state, minutes = 1) {
  if (!state.currentPet?.stats) return state;
  const pet = { ...state.currentPet };
  const stats = { ...pet.stats };
  
  stats.hunger = clamp(stats.hunger - STAT_DECAY_RATE.hunger * minutes, 0, 100);
  stats.cleanliness = clamp(stats.cleanliness - STAT_DECAY_RATE.cleanliness * minutes, 0, 100);
  // 活力自然缓慢恢复
  stats.energy = clamp(stats.energy + STAT_DECAY_RATE.energy * minutes * 0.5, 0, 100);
  // 亲密度缓慢下降
  stats.intimacy = clamp(stats.intimacy + STAT_DECAY_RATE.intimacy * minutes, 0, 100);
  
  pet.stats = stats;
  return { ...state, currentPet: pet };
}

// ============================================================
//  抽卡（保持原有逻辑）- 🔧 修复：改为500经验值
// ============================================================
// 抽卡权重配置（根据等级调整稀有度概率）
const DRAW_WEIGHTS = {
  // Lv 1-9: N级为主
  early: [
    { poolId: 'pet_kitten',   weight: 14 },
    { poolId: 'pet_puppy',    weight: 13 },
    { poolId: 'pet_bunny',    weight: 12 },
    { poolId: 'pet_hamster',  weight: 11 },
    { poolId: 'pet_chick',    weight: 10 },
    { poolId: 'pet_fox',      weight: 8 },
    { poolId: 'pet_panda',    weight: 7 },
    { poolId: 'pet_penguin',  weight: 6 },
    { poolId: 'pet_shiba',    weight: 5 },
    { poolId: 'pet_squirrel', weight: 4 },
    { poolId: 'pet_duck',     weight: 3 },
    { poolId: 'pet_toothless',weight: 2.5 },
    { poolId: 'pet_phoenix',  weight: 1.5 },
    { poolId: 'pet_unicorn',  weight: 1.2 },
    { poolId: 'pet_kirin',    weight: 0.9 },
    { poolId: 'pet_fairy',    weight: 0.6 },
    { poolId: 'pet_dragon',   weight: 0.2 },
    { poolId: 'pet_star',     weight: 0.1 },
  ],
  // Lv 10-19: R级比例提升
  mid: [
    { poolId: 'pet_kitten',   weight: 10 },
    { poolId: 'pet_puppy',    weight: 9 },
    { poolId: 'pet_bunny',    weight: 8 },
    { poolId: 'pet_hamster',  weight: 7 },
    { poolId: 'pet_chick',    weight: 6 },
    { poolId: 'pet_fox',      weight: 10 },
    { poolId: 'pet_panda',    weight: 9 },
    { poolId: 'pet_penguin',  weight: 8 },
    { poolId: 'pet_shiba',    weight: 7 },
    { poolId: 'pet_squirrel', weight: 6 },
    { poolId: 'pet_duck',     weight: 5 },
    { poolId: 'pet_toothless',weight: 4.5 },
    { poolId: 'pet_phoenix',  weight: 3 },
    { poolId: 'pet_unicorn',  weight: 2.5 },
    { poolId: 'pet_kirin',    weight: 2 },
    { poolId: 'pet_fairy',    weight: 1.5 },
    { poolId: 'pet_dragon',   weight: 0.7 },
    { poolId: 'pet_star',     weight: 0.3 },
  ],
  // Lv20+: SSR可抽到
  late: [
    { poolId: 'pet_kitten',   weight: 7 },
    { poolId: 'pet_puppy',    weight: 6.5 },
    { poolId: 'pet_bunny',    weight: 6 },
    { poolId: 'pet_hamster',  weight: 5.5 },
    { poolId: 'pet_chick',    weight: 5 },
    { poolId: 'pet_fox',      weight: 8 },
    { poolId: 'pet_panda',    weight: 7.5 },
    { poolId: 'pet_penguin',  weight: 7 },
    { poolId: 'pet_shiba',    weight: 6.5 },
    { poolId: 'pet_squirrel', weight: 6 },
    { poolId: 'pet_duck',     weight: 5.5 },
    { poolId: 'pet_toothless',weight: 5 },
    { poolId: 'pet_phoenix',  weight: 4 },
    { poolId: 'pet_unicorn',  weight: 3.5 },
    { poolId: 'pet_kirin',    weight: 3 },
    { poolId: 'pet_fairy',    weight: 2.5 },
    { poolId: 'pet_dragon',   weight: 2 },
    { poolId: 'pet_star',     weight: 1.5 },
  ],
};

function drawCard(state) {
  // 抽卡消耗500经验
  if ((state.exp || 0) < 500) return state;

  const lvl = state.level || 1;
  let w = lvl < 10 ? DRAW_WEIGHTS.early : lvl < 20 ? DRAW_WEIGHTS.mid : DRAW_WEIGHTS.late;
  
  const total = w.reduce((a, it) => a + it.weight, 0) || 1;
  let r = Math.random() * total;
  let chosen = w[0].poolId;
  for (const it of w) { if (r < it.weight) { chosen = it.poolId; break; } r -= it.weight; }
  
  const owned = Array.isArray(state.ownedPets) ? [...state.ownedPets] : [];
  if (!owned.includes(chosen)) owned.push(chosen);
  
  return {
    ...state,
    exp: state.exp - 500,  // 🔧 修复：抽卡消耗500经验
    ownedPets: owned,
    currentPet: { poolId: chosen, level: 1, exp: 0, mood: 'neutral', tapCount: 0, stats: defaultStats(), equippedAccessories: {} }
  };
}

// ============================================================
//  Helpers
// ============================================================
function getCurrentPet(state) { return state.currentPet; }
function getPetPool(state) { return state.petPool; }

// ============================================================
//  导出
// ============================================================
export {
  gainExpForLearning,
  feedPet,
  tapPet,
  resetPetMood,
  drawCard,
  getCurrentPet,
  getPetPool,
  getPetStage,
  // 以下已通过 export function 直接导出:
  // initGamificationState, cleanPet, restPet, tickPetStats, claimTaskReward, updateTaskProgress
  // equipAccessory, unequipAccessory, buyAccessory, useItemOnPet
  // getDialogueType, getDialogue, initDailyTasks, getEquippedAccessory
};

// 以下已通过 export const 导出，不需要重复导出:
// SHOP_ITEMS, PET_POOL, PET_STATS_MAX, ACCESSORY_SLOTS, ACCESSORY_SHOP
// DAILY_TASK_TEMPLATES, STAT_CONFIG, PET_DIALOGUES, getDialogueType, getDialogue
// initDailyTasks, getEquippedAccessory, RARITY_COLORS

export default {
  initGamificationState,
  gainExpForLearning,
  manualLevelUp,
  feedPet,
  tapPet,
  resetPetMood,
  drawCard,
  getCurrentPet,
  getPetPool,
  getPetStage,
};