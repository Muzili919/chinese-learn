// ============================================================
//  汉字星球 - 宠物养成系统 (v4 - 精简双宠版)
// ============================================================

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ---- 宠物池（3只：N级小橘猫 + N级紫柴犬 + SR级无牙仔）----
const PET_POOL = [
  // === N级 普通 ===
  {
    poolId: 'pet_kitten', name: '小橘猫', emoji: '🐱', rarity: 'N', personality: 'lazy',
    spritePrefix: 'kitten',
    desc: '额头有"王"字的大橘猫，懒洋洋躺满你整张课桌，但关键时刻从不缺席',
    stages: ['橙色条纹椭圆蛋，有小爪印，摸起来热乎乎的', '巴掌大的橘猫崽，肚皮白白软软，一动就喵一声', '耳朵竖起来了！尾巴高高翘，老爱钻进书包里睡觉', '毛发蓬松，脖子有虎纹，专门坐在课本上挡你看书', '额头浮现"王"字，威严大橘猫，懒洋洋却无处不在'],
  },
  {
    poolId: 'pet_shiba', name: '紫电柴犬', emoji: '🐶', rarity: 'N', personality: 'loyal',
    spritePrefix: 'shiba',
    desc: '右耳和左前腿是银色机械义肢、蓝光闪烁的赛博柴犬，忠诚可靠永远守护在你身边',
    stages: ['银蓝色机械蛋壳，偶尔发出轻微电流嗡嗡声', '橙色毛皮的柴犬幼崽，右耳和左前腿是金属义体，走路时蓝光一闪一闪', '四肢开始出现装甲，蓝紫色光带在关节处流动，尾巴末端带电磁光环', '深灰色机械装甲覆盖四肢和脊柱，黑色强化皮革躯干，眼神坚定', '全身透明机械装甲，胸腔内红蓝双色能量核心，四肢悬浮带电磁光环，终极形态'],
  },
  // === SR级 超稀 ===
  {
    poolId: 'pet_toothless', name: '无牙仔', emoji: '🐉', rarity: 'SR', personality: 'tsundere',
    desc: '月光下鳞片泛出幽蓝光芒的夜翼龙，嘴里终于长出四颗小牙，脸上还带着得意的笑',
    stages: ['哑光黑色龙蛋，细小鳞片纹路，摸起来暖暖的，偶尔轻轻震动', '小小黑龙崽，耳朵像两片大叶子，没有牙却爱冲你龇嘴', '能扑腾翅膀飞一小段了，总是摔到地上拍拍翅膀假装没事', '暗黑鳞片，翠绿眼睛，翅膀完全展开，嘴里还是没有牙…', '月光下鳞片泛出幽蓝光芒，终于长出四颗小牙，得意地笑着'],
  },
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

// ============================================================
//  🧙 上帝模式 — 满级全宠物测试账号
// ============================================================
const ALL_PET_IDS = PET_POOL.map(p => p.poolId);
// 所有配饰ID（25件）
const ALL_ACCESSORIES = [
  'acc_scarf','acc_bell','acc_ribbon','acc_crown','acc_flower',
  'acc_glasses','acc_hat','acc_antenna','acc_halo','acc_horn',
  'acc_necklace','acc_bowtie','acc_tie','acc_cape','acc_wings',
  'acc_backpack','acc_umbrella','acc_shield','acc_flag','acc_instrument',
];

export function initGodModeState() {
  return {
    level: 50,
    exp: 99999,
    totalStars: 9999,
    coins: 99999,
    petPool: PET_POOL,
    ownedPets: ['pet_kitten', 'pet_shiba', 'pet_toothless'],  // 3只全解锁
    currentPet: {
      poolId: 'pet_kitten',   // 默认小橘猫（有精美PNG）
      level: 35,
      exp: 50000,
      mood: 'happy',
      tapCount: 99,
      stats: { hunger: 100, cleanliness: 100, energy: 100, intimacy: 100 },
      equippedAccessories: { head: 'acc_crown', neck: 'acc_cape', back: 'acc_wings' },
      lastAction: null,
      lastFeedTime: Date.now(),
    },
    dailyTasks: initDailyTasks(),
    dailyLastResetDate: new Date().toDateString(),
    taskCounters: {
      learnCount: 999,
      feedCount: 99,
      interactCount: 99,
      streakCount: 99,
    },
    achievements: [],
    inventory: {
      foods: { basic: 99, advanced: 99, gourmet: 99, superGourmet: 99 },
      cleanItems: 99,
      energyItems: 99,
      giftItems: 99,
      cards: 99,
      accessories: ALL_ACCESSORIES,
    },
    settings: { soundEnabled: true, notificationsEnabled: true },
    totalLearnQuestions: 9999,
    totalCorrectAnswers: 8888,
    daysActive: 365,
    lastActiveDate: new Date().toDateString(),
    friends: [],
    pendingEncouragements: [],
    weeklyQuestions: 9999,
    weeklyResetDate: new Date().toISOString().slice(0, 10),
    _isGodMode: true,
  };
}

export function initGamificationState() {
  return {
    level: 1,
    exp: 100,
    totalStars: 1,
    coins: 0,
    petPool: PET_POOL,
    ownedPets: [],           // 🥚 新用户没有宠物！需要抽卡孵化
    currentPet: null,        // 🥚 null = 蛋态，显示 PetEgg 组件
    hasReceivedFreeCard: true, // 🎴 首次登录送1张免费抽卡券
    freeCardUsed: false,     // 免费券是否已使用
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
// 抽卡权重配置（8只宠物，根据等级调整稀有度概率）
const DRAW_WEIGHTS = {
  // Lv 1-9: 小橘猫为主，紫柴犬+无牙仔低概率
  early: [
    { poolId: 'pet_kitten',    weight: 55 },   // N
    { poolId: 'pet_shiba',     weight: 30 },   // N
    { poolId: 'pet_toothless', weight: 15 },   // SR
  ],
  // Lv 10-19: 紫柴犬和无牙仔比例提升
  mid: [
    { poolId: 'pet_kitten',    weight: 40 },   // N
    { poolId: 'pet_shiba',     weight: 30 },   // N
    { poolId: 'pet_toothless', weight: 30 },   // SR
  ],
  // Lv 20+: 无牙仔概率最高
  late: [
    { poolId: 'pet_kitten',    weight: 25 },   // N
    { poolId: 'pet_shiba',     weight: 25 },   // N
    { poolId: 'pet_toothless', weight: 50 },   // SR
  ],
};

/**
 * 抽卡
 * @returns {{ state, pet }} state=新状态, pet=抽到的宠物信息(供动画用)
 */
// ---- 是否在蛋态（无宠物）----
export function isEggState(state) {
  return !state || !state.currentPet || !state.currentPet.poolId;
}

// ---- 是否有免费抽卡券可用 ----
export function hasFreeCard(state) {
  return state && state.hasReceivedFreeCard && !state.freeCardUsed;
}

function drawCard(state) {
  // 免费券 → 不消耗经验
  const isFree = !state.freeCardUsed && state.hasReceivedFreeCard
  
  if (!isFree && (state.exp || 0) < 500) 
    return { state, pet: null }; // 经验不足

  const lvl = state.level || 1;
  let w = lvl < 10 ? DRAW_WEIGHTS.early : lvl < 20 ? DRAW_WEIGHTS.mid : DRAW_WEIGHTS.late;
  
  const total = w.reduce((a, it) => a + it.weight, 0) || 1;
  let r = Math.random() * total;
  let chosen = w[0].poolId;
  for (const it of w) { if (r < it.weight) { chosen = it.poolId; break; } r -= it.weight; }
  
  const owned = Array.isArray(state.ownedPets) ? [...state.ownedPets] : [];
  if (!owned.includes(chosen)) owned.push(chosen);
  
  // 获取宠物详细信息
  const petInfo = PET_POOL.find(p => p.poolId === chosen) || { poolId: chosen, name: '未知', emoji: '❓', rarity: 'N' };
  
  const newState = {
    ...state,
    exp: isFree ? state.exp : state.exp - 500,
    ownedPets: owned,
    currentPet: { poolId: chosen, level: 1, exp: 0, mood: 'neutral', tapCount: 0, stats: defaultStats(), equippedAccessories: {} },
    freeCardUsed: true,   // 标记免费券已使用
  };

  return { state: newState, pet: petInfo };
}

/**
 * 卖掉一只重复宠物 → 获得0.5张抽卡券
 * 
 * 规则：
 * - 不能卖当前出战的宠物（currentPet）
 * - 只能卖重复的宠物（同类型有2只以上）
 * - 卖后获得 0.5 cardFragments，累积到1张完整抽卡券
 * - cardFragments 为整数时自动转为 cards + 1
 */
function sellPet(state, petPoolId) {
  const owned = state.ownedPets || [];
  
  // 安全检查：不能卖当前出战宠物
  if (state.currentPet?.poolId === petPoolId) {
    return { state, success: false, error: '不能卖出战中宠物' };
  }
  
  // 检查是否拥有且是重复的
  if (!owned.includes(petPoolId)) {
    return { state, success: false, error: '未拥有该宠物' };
  }
  
  const count = owned.filter(id => id === petPoolId).length;
  if (count <= 1) {
    return { state, success: false, error: '这是最后一只，不能卖掉' };
  }

  // 移除一只
  const newOwned = owned.filter(id => id !== petPoolId);
  
  // 增加0.5抽卡券碎片
  let fragments = (state.cardFragments || 0) + 0.5;
  let newCards = state.inventory?.cards || 0;
  
  // 累积到整数则转为整卡
  if (fragments >= 1) {
    newCards += Math.floor(fragments);
    fragments = fragments - Math.floor(fragments);
  }

  return {
    state: {
      ...state,
      ownedPets: newOwned,
      cardFragments: fragments,
      inventory: { ...(state.inventory || {}), cards: newCards },
    },
    success: true,
  };
}
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
  sellPet,  // 卖宠物 → 0.5抽卡券
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
  isEggState,
  hasFreeCard,
};