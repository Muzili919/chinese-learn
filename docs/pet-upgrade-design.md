# 🐾 宠物系统升级设计方案 v2.0

> **文档版本**：v2.0  
> **设计日期**：2026-04-15  
> **目标**：从3只宠物扩充至18只，优化衰减参数、专属对话、配饰扩展、升级提示  
> **面向用户**：初中学生（12-15岁）

---

## 一、宠物池设计（18只）

### 1.1 稀有度分布总览

| 稀有度 | 数量 | 抽取概率（Lv<10） | 抽取概率（Lv10-20） | 抽取概率（Lv>20） | 颜色标识 |
|:---:|:---:|:---:|:---:|:---:|:---:|
| N（普通） | 4只 | 50% | 35% | 25% | `#9ca380` 灰绿 |
| R（稀有） | 6只 | 35% | 40% | 40% | `#3b82f6` 蓝色 |
| SR（超稀） | 5只 | 12% | 18% | 25% | `#f59e0b` 橙金 |
| SSR（传说） | 3只 | 3% | 7% | 10% | `#a855f7` 紫光 |

### 1.2 完整宠物定义

#### 🔵 N级 — 普通（4只）容易获得

| poolId | 名称 | emoji | 分类 | 性格 | 主色调 | spritePrefix | 描述 |
|:---|:---|:---|:---|:---|:---|:---|
| `pet_mimi` | 咪咪 | 🐱 | animal | 温柔慵懒、爱撒娇 | `['#f5a6c5']` | `cat_mimi` | 一只三花小猫，最爱晒太阳 |
| `pet_wangwang` | 旺旺 | 🐕 | animal | 忠诚热情、活力十足 | `['#d4a056']` | `dog_wangwang` | 金毛幼犬，永远摇尾巴 |
| `pet_tutu` | 兔兔 | 🐰 | animal | 胆小谨慎、吃货一枚 | `['#ffffff', '#ffb6c1']` | `rabbit_tutu` | 垂耳小白兔，胡萝卜控 |
| `pet_chirp` | 啾啾 | 🐦 | animal | 好奇话痨、早起冠军 | `['#87ceeb', '#ffd700']` | `bird_chirp` | 小蓝雀，清晨第一声啼鸣 |

#### 💙 R级 — 稀有（6只）较常见

| poolId | 名称 | emoji | 分类 | 性格 | 主色调 | spritePrefix | 描述 |
|:---|:---|:---|:---|:---|:---|:---|
| `pet_hulu` | 狐狸胡芦 | 🦊 | animal | 聪明机灵、有点傲娇 | `['#ff6b35']` | `fox_hulu` | 小赤狐，九条尾巴还在长 |
| `pet_bubu` | 步步 | 🐼 | animal | 慢吞吞、淡定佛系 | `['#2d2d2d', '#fff']` | `panda_bubu` | 幼年大熊猫，抱着竹子不撒手 |
| `pet_dudu` | 嘟嘟 | 🐷 | fantasy | 乐天派、吃货担当 | `['#ffb6c1']` | `pig_dudu` | 圆滚滚小飞猪，梦想是飞上天 |
| `pet_xiaobai` | 小白 | 🤖 | fantasy | 理性冷静、偶尔呆萌 | `['#e8e8e8', '#3b82f6']` | `robot_xiaobai` | 迷你机器人助手，学习搭档 |
| `pet_qiuqiu` | 球球 | 🧊 | element | 内向慢热、喜欢安静 | `['#7dd3fc', '#ffffff']` | `iceball_qiuqiu` | 小雪球精灵，走到哪都凉快 |
| `pet_tutuo` | 托托 | 🐢 | animal | 稳重可靠、老大哥气质 | `['#228b22']` | `turtle_tutuo` | 小乌龟，慢但从不放弃 |

#### 🟠 SR级 — 超稀（5只）难获得

| poolId | 名称 | emoji | 分类 | 性格 | 主色调 | spritePrefix | 描述 |
|:---|:---|:---|:---|:---|:---|:---|
| `pet_toothless` | 无牙仔 | 🐉 | mythical | 傲娇护短、爱吃鱼（保留原有） | `['#1a1a2e']` | `dragon_toothless` | 没牙的小黑龙，最爱吃鱼 |
| `pet_fenghuang` | 小凤凰 | 🔥 | mythical | 自信高冷、浴火重生 | `['#ff4d00', '#ffd700']` | `phoenix_fenghuang` | 凤凰雏鸟，羽翼渐丰中 |
| `pet_duo Duo` | 多多 | 🦄 | mythical | 纯真善良、相信奇迹 | `['#ffc0cb', '#e8e8ff']` | `unicorn_duoduo` | 小独角兽，角还没长出来 |
| `pet_niaoniao` | 鸟鸟 | 🧚 | fantasy | 活泼俏皮、爱捉迷藏 | `['#a78bfa', '#fef3c7']` | `fairy_niaoniao` | 花间小精灵，翅膀闪闪发光 |
| `pet_huohuo` | 火火 | 🔥 | element | 暴脾气但热心肠 | `['#ef4444', '#f97316']` | `fireball_huohuo` | 小火球精灵，永远热乎乎 |

#### 💜 SSR级 — 传说（3只）极难获得

| poolId | 名称 | emoji | 分类 | 性格 | 主色调 | spritePrefix | 描述 |
|:---|:---|:---|:---|:---|:---|:---|
| `pet_pika` | 皮卡丘 | ⚡ | fantasy | 电光活泼、超级稀有（保留原有） | `['#ffd93d', '#ff6b35']` | `pika_pika` | 电光精灵，超级稀有 |
| `pet_longlong` | 龙龙 | 🐲 | mystical | 威严神秘、智慧古老 | `['#dc2626', '#ffd700']` | `dragon_longlong` | 东方神龙幼崽，腾云驾雾 |
| `pet_starlight` | 星星 | ⭐ | fantasy | 神秘优雅、来自星空 | `['#1e1b4b', '#fbbf24', '#818cf8']` | `star_starlight` | 星空之子，身体里装着整个银河 |

### 1.3 JSON数据（可直接复制到代码）

```javascript
const PET_POOL = [
  // ===== N级 - 普通（4只）=====
  { poolId: 'pet_mimi', name: '咪咪', emoji: '🐱', rarity: 'N', desc: '一只三花小猫，最爱晒太阳',
    category: 'animal', personality: '温柔慵懒', colors: ['#f5a6c5'], spritePrefix: 'cat_mimi' },
  { poolId: 'pet_wangwang', name: '旺旺', emoji: '🐕', rarity: 'N', desc: '金毛幼犬，永远摇尾巴',
    category: 'animal', personality: '忠诚热情', colors: ['#d4a056'], spritePrefix: 'dog_wangwang' },
  { poolId: 'pet_tutu', name: '兔兔', emoji: '🐰', rarity: 'N', desc: '垂耳小白兔，胡萝卜控',
    category: 'animal', personality: '胆小吃货', colors: ['#ffffff', '#ffb6c1'], spritePrefix: 'rabbit_tutu' },
  { poolId: 'pet_chirp', name: '啾啾', emoji: '🐦', rarity: 'N', desc: '小蓝雀，清晨第一声啼鸣',
    category: 'animal', personality: '好奇话痨', colors: ['#87ceeb', '#ffd700'], spritePrefix: 'bird_chirp' },

  // ===== R级 - 稀有（6只）=====
  { poolId: 'pet_hulu', name: '狐狸胡芦', emoji: '🦊', rarity: 'R', desc: '小赤狐，九条尾巴还在长',
    category: 'animal', personality: '聪明傲娇', colors: ['#ff6b35'], spritePrefix: 'fox_hulu' },
  { poolId: 'pet_bubu', name: '步步', emoji: '🐼', rarity: 'R', desc: '幼年大熊猫，抱着竹子不撒手',
    category: 'animal', personality: '淡定佛系', colors: ['#2d2d2d', '#fff'], spritePrefix: 'panda_bubu' },
  { poolId: 'pet_dudu', name: '嘟嘟', emoji: '🐷', rarity: 'R', desc: '圆滚滚小飞猪，梦想是飞上天',
    category: 'fantasy', personality: '乐天吃货', colors: ['#ffb6c1'], spritePrefix: 'pig_dudu' },
  { poolId: 'pet_xiaobai', name: '小白', emoji: '🤖', rarity: 'R', desc: '迷你机器人助手，学习搭档',
    category: 'fantasy', personality: '理性呆萌', colors: ['#e8e8e8', '#3b82f6'], spritePrefix: 'robot_xiaobai' },
  { poolId: 'pet_qiuqiu', name: '球球', emoji: '🧊', rarity: 'R', desc: '小雪球精灵，走到哪都凉快',
    category: 'elemental', personality: '内向安静', colors: ['#7dd3fc', '#ffffff'], spritePrefix: 'iceball_qiuqiu' },
  { poolId: 'pet_tutuo', name: '托托', emoji: '🐢', rarity: 'R', desc: '小乌龟，慢但从不放弃',
    category: 'animal', personality: '稳重可靠', colors: ['#228b22'], spritePrefix: 'turtle_tutuo' },

  // ===== SR级 - 超稀（5只）=====
  { poolId: 'pet_toothless', name: '无牙仔', emoji: '🐉', rarity: 'SR', desc: '没牙的小黑龙，最爱吃鱼',
    category: 'mythical', personality: '傲娇护短', colors: ['#1a1a2e'], spritePrefix: 'dragon_toothless' },
  { poolId: 'pet_fenghuang', name: '小凤凰', emoji: '🔥', rarity: 'SR', desc: '凤凰雏鸟，羽翼渐丰中',
    category: 'mythical', personality: '自信高冷', colors: ['#ff4d00', '#ffd700'], spritePrefix: 'phoenix_fenghuang' },
  { pet_id: 'pet_duoduo', name: '多多', emoji: '🦄', rarity: 'SR', desc: '小独角兽，角还没长出来',
    category: 'mythical', personality: '纯真善良', colors: ['#ffc0cb', '#e8e8ff'], spritePrefix: 'unicorn_duoduo' },
  { poolId: 'pet_niaoniao', name: '鸟鸟', emoji: '🧚', rarity: 'SR', desc: '花间小精灵，翅膀闪闪发光',
    category: 'fantasy', personality: '活泼俏皮', colors: ['#a78bfa', '#fef3c7'], spritePrefix: 'fairy_niaoniao' },
  { poolId: 'pet_huohuo', name: '火火', emoji: '🔥', rarity: 'SR', desc: '小火球精灵，永远热乎乎',
    category: 'elemental', personality: '暴躁热心', colors: ['#ef4444', '#f97316'], spritePrefix: 'fireball_huohuo' },

  // ===== SSR级 - 传说（3只）=====
  { poolId: 'pet_pika', name: '皮卡丘', emoji: '⚡', rarity: 'SSR', desc: '电光精灵，超级稀有',
    category: 'fantasy', personality: '电光活泼', colors: ['#ffd93d', '#ff6b35'], spritePrefix: 'pika_pika' },
  { poolId: 'pet_longlong', name: '龙龙', emoji: '🐲', rarity: 'SSR', desc: '东方神龙幼崽，腾云驾雾',
    category: 'mystical', personality: '威严智慧', colors: ['#dc2626', '#ffd700'], spritePrefix: 'dragon_longlong' },
  { poolId: 'pet_starlight', name: '星星', emoji: '⭐', rarity: 'SSR', desc: '星空之子，身体里装着整个银河',
    category: 'fantasy', personality: '神秘优雅', colors: ['#1e1b4b', '#fbbf24', '#818cf8'], spritePrefix: 'star_starlight' },
];
```

### 1.4 抽卡权重配置（按等级段）

```javascript
// Lv < 10：新手保护期
const DRAW_WEIGHTS_LV_LOW = [
  // N (50%) ×4
  { poolId: 'pet_mimi', weight: 14 },
  { poolId: 'pet_wangwang', weight: 14 },
  { poolId: 'pet_tutu', weight: 12 },
  { poolId: 'pet_chirp', weight: 10 },
  // R (35%) ×6
  { poolId: 'pet_hulu', weight: 7 },
  { poolId: 'pet_bubu', weight: 6 },
  { poolId: 'pet_dudu', weight: 6 },
  { poolId: 'pet_xiaobai', weight: 6 },
  { poolId: 'pet_qiuqiu', weight: 5 },
  { poolId: 'pet_tutuo', weight: 5 },
  // SR (12%) ×5
  { poolId: 'pet_toothless', weight: 4 },
  { poolId: 'pet_fenghuang', weight: 3 },
  { poolId: 'pet_duoduo', weight: 2 },
  { poolId: 'pet_niaoniao', weight: 2 },
  { poolId: 'pet_huohuo', weight: 1 },
  // SSR (3%) ×3
  { poolId: 'pet_pika', weight: 1.5 },
  { poolId: 'pet_longlong', weight: 1 },
  { poolId: 'pet_starlight', weight: 0.5 },
];

// Lv 10-20：成长期
const DRAW_WEIGHTS_LV_MID = [
  // N (35%) ×4
  { poolId: 'pet_mimi', weight: 10 }, { poolId: 'pet_wangwang', weight: 9 },
  { poolId: 'pet_tutu', weight: 9 }, { poolId: 'pet_chirp', weight: 7 },
  // R (40%) ×6
  { poolId: 'pet_hulu', weight: 8 }, { poolId: 'pet_bubu', weight: 7 },
  { poolId: 'pet_dudu', weight: 7 }, { poolId: 'pet_xiaobai', weight: 7 },
  { poolId: 'pet_qiuqiu', weight: 6 }, { poolId: 'pet_tutuo', weight: 5 },
  // SR (18%) ×5
  { poolId: 'pet_toothless', weight: 5 }, { poolId: 'pet_fenghuang', weight: 4 },
  { poolId: 'pet_duoduo', weight: 3 }, { poolId: 'pet_niaoniao', weight: 3 },
  { poolId: 'pet_huohuo', weight: 3 },
  // SSR (7%) ×3
  { poolId: 'pet_pika', weight: 3 }, { poolId: 'pet_longlong', weight: 2.5 },
  { poolId: 'pet_starlight', weight: 1.5 },
];

// Lv > 20：高级期
const DRAW_WEIGHTS_LV_HIGH = [
  // N (25%) ×4
  { poolId: 'pet_mimi', weight: 7 }, { poolId: 'pet_wangwang', weight: 7 },
  { poolId: 'pet_tutu', weight: 6 }, { poolId: 'pet_chirp', weight: 5 },
  // R (40%) ×6
  { poolId: 'pet_hulu', weight: 8 }, { poolId: 'pet_bubu', weight: 7 },
  { poolId: 'pet_dudu', weight: 7 }, { poolId: 'pet_xiaobai', weight: 7 },
  { poolId: 'pet_qiuqiu', weight: 6 }, { poolId: 'pet_tutuo', weight: 5 },
  // SR (25%) ×5
  { poolId: 'pet_toothless', weight: 7 }, { poolId: 'pet_fenghuang', weight: 6 },
  { poolId: 'pet_duoduo', weight: 5 }, { poolId: 'pet_niaoniao', weight: 4 },
  { poolId: 'pet_huohuo', weight: 3 },
  // SSR (10%) ×3
  { poolId: 'pet_pika', weight: 4 }, { poolId: 'pet_longlong', weight: 3.5 },
  { poolId: 'pet_starlight', weight: 2.5 },
];
```

---

## 二、衰减参数优化

### 2.1 当前问题分析

| 属性 | 当前衰减率 | 归零时间 | 问题 |
|:---|:---|:---|:---|
| 饱食度 | 0.5/分 | ~3.3小时 | 太快！半天就饿红了 |
| 清洁度 | 0.8/分 | ~2小时 | 最严重，2小时就脏 |
| 活力 | -0.03/分（恢复） | 自然恢复 | 还行，答题消耗 |
| 亲密度 | -0.005/分 | 极缓慢下降 | 合理 |

**核心矛盾**：初中生白天上课，不可能每3小时上线喂一次。一天放学回来（约8-10小时后），所有状态全红 = 挫败感极强。

### 2.2 新衰减参数设计

**设计目标**：
- ✅ 正常使用（每天登录1-2次），宠物保持在绿色/黄色健康区
- ✅ 3天不来才会全红（给一个"宠物生病"的紧迫感）
- ✅ 不同属性有差异，增加策略性

```
新 STAT_DECAY_RATE：
{
  hunger:     0.12,   // 约13.9小时从100→0（之前3.3h）
  cleanliness: 0.15,   // 约11.1小时从100→0（之前2h）⭐最大改善
  energy:     -0.05,   // 自然恢复速度略微加快
  intimacy:   -0.02,   // 约83小时从100→0（约3.5天完全疏远）
}
```

### 2.3 参数对比表

| 属性 | 旧值 | 旧归零时间 | **新值** | **新归零时间** | 改善倍数 |
|:---|:---|:---|:---|:---|:---|
| 饱食度 | 0.5/分 | 3.3h | **0.12/分** | **13.9h** | 4.2×慢 |
| 清洁度 | 0.8/分 | 2.0h | **0.15/分** | **11.1h** | 5.5×慢 |
| 活力(恢复) | -0.03/分 | — | **-0.05/分** | — | 1.7×快恢复 |
| 亲密度 | -0.005/分 | ~33h | **-0.02/分** | ~83h | 2.5×持久 |

### 2.4 典型场景模拟

**场景A：每天放学后玩30分钟（17:00-17:30）**
```
07:00 上学前  饱食100 清洁100 活力100 亲密50
17:00 放学后  饱食28  清洁10  活力100  亲密42  ← 清洁偏黄，可接受
→ 喂食(+40) 清洁(+40) 答题互动
17:30 结束时  饱食68  清洁50  活力90   亲密60  ← 全绿/黄绿 ✓
次日17:00     饱食10  清洁0   活力100  亲密51  ← 需要照顾但不灾难
```

**场景B：两天没来**
```
第1天 07:00 全满
第3天 09:00  饱食0  清洁0  活力100  亲密28  ← 全红，需要紧急照顾
→ 此时触发"宠物思念"特殊对话 + 状态恢复道具优惠提示
```

**结论**：新参数下，每天1次维护即可保持健康，2-3天不管才会出问题。

---

## 三、专属对话库设计

### 3.1 设计原则

- **按分类设基础对话**（animal/mythical/fantasy/elemental/mystical 各一套）
- **特色宠物覆盖写**（SSR + 标志性SR宠物有独立全套对话）
- **口癖差异化**：每种性格都有独特的说话方式
- **兼容现有格式**：key-value数组形式，与 `getDialogue(type)` 完全兼容

### 3.2 对话类型全覆盖（15种触发场景）

| 触发类型 | 说明 | 优先级 |
|:---|:---|:---|
| `hungry` | 饱食度<25 | 最高（紧急） |
| `dirty` | 清洁度<25 | 高 |
| `tired` | 活力<20 | 高 |
| `sad` | 亲密度<20且非刚被摸 | 中高 |
| `happy` | 亲密度>70 | 低（正向） |
| `levelUp` | 升级瞬间 | 特殊事件 |
| `fed` | 被喂食后 | 反馈 |
| `cleaned` | 被清洗后 | 反馈 |
| `rested` | 休息后 | 反馈 |
| `tapped` | 被抚摸 | 交互 |
| `correctAnswer` | 答对题 | 学习反馈 |
| `wrongAnswer` | 答错题 | 学习鼓励 |
| `idle` | 随机待机 | 默认 |
| `morning` | 6:00-9:00 | 时间问候 |
| `night` | 21:00-23:00 | 时间问候 |

### 3.3 动物类对话（Animal）— 适用于咪咪/旺旺/兔兔/啾啾/狐狸/熊猫/乌龟

```javascript
const DIALOGUES_ANIMAL = {
  hungry: [
    '肚子咕咕叫...有吃的吗？🍖',
    '饿了饿了...主人~快点嘛~',
    '饭点到了吗？我等好久了！',
    '我的肚子在唱歌...♪',
    '再不吃东西我要闹了哦！',
  ],
  dirty: [
    '身上好痒...想洗澡🛁',
    '我是不是变脏了？帮我洗洗~',
    '嗯...感觉黏糊糊的...',
    '能不能帮我清理一下？拜托啦~',
    '痒痒痒！需要洗澡！',
  ],
  tired: [
    '哈欠...想睡了💤',
    '眼睛睁不开了...让我趴一会儿~',
    '困了困了...Zzz...',
    '能量耗尽...需要充电（睡觉）',
    '呼...呼...',  ],
  sad: [
    '你去哪了...我想你😢',
    '好久没人理我了...孤单...',
    '主人...你在吗？我想你了',
    '一个人好无聊...来陪我嘛~',
    '你是不是不要我了...💔',
  ],
  happy: [
    '今天也要加油哦~✨和你在一起最开心！',
    '嘿嘿，主人最好了！',
    '爱你爱你！❤️',
    '能待在你身边就是最幸福的事~',
    '今天也是元气满满的一天！☀️',
  ],
  levelUp: [
    '哇！我变强了！！🎉🎉🎉',
    '进化成功！太酷了吧！',
    '升级啦升级啦！感谢主人的陪伴！⭐',
    '新的力量涌上来了！感觉超棒！🔥',
  ],
  fed: [
    '好好吃！满足！😋',
    '味道棒极了！再来一份？',
    '吃饱饱~幸福~🍖',
    '嗝~谢谢投喂！',
    '美味美味！主人做的最好吃！',
  ],
  cleaned: [
    '香喷喷~✨像新的一样！',
    '好舒服！干干净净的！',
    '我爱洗澡~皮肤好好～🛁',
    '哇，焕然一新！照镜子都觉得自己好看！',
    '舒爽~！谢谢主人帮我洗澡~',
  ],
  rested: [
    '精神满满！⚡准备好玩了！',
    '睡得好香！做了个美梦~💭',
    '充满电了！来吧来吧！',
    '休息完毕！活力全开！🎮',
  ],
  tapped: [
    '嘿嘿，痒~😆再摸一下？',
    '舒服~~摸头杀最喜欢了！',
    '哈哈别闹~哈哈好了好了怕了怕了~',
    '更多一点~左边的耳朵也要摸~',
    '喵呼~（舒服地眯眼）🥰',
  ],
  correctAnswer: [
    '太厉害了！答对了！🎉主人真棒！',
    '又学到了新知识！为你骄傲！⭐',
    '满分答案！不愧是我的主人！',
    '哇塞！聪明！继续加油！💪',
  ],
  wrongAnswer: [
    '没关系，下次一定行！💪',
    '别灰心哦~失败是成功之母嘛~',
    '我们一起加油！这道题下次一定能对！',
    '没事没事，学习就是要试错的~✨',
  ],
  idle: [
    '今天天气真好~☀️要不要出去走走？',
    '无聊...陪我玩嘛~',
    '★～(￣▽￣～)*~ 发呆中~',
    '哼着歌~🎵啦啦啦~',
    '在干嘛呢主人？看看我嘛~',
    '(o゜▽゜)o☆ 今天的我可爱吗？',
  ],
  morning: [
    '早上好呀主人！☀️新的一天开始咯~',
    '早安早安~今天也要元气满满！',
    '早啊！吃早餐了吗？（虽然我只想吃你的那份）',
  ],
  night: [
    '晚安...做个好梦哦🌙',
    '月亮出来了...该休息啦~明天见！',
    '夜深啦，主人早点睡哦...晚安安💤',
  ],
};
```

### 3.4 神话类对话（Mythical）— 适用于无牙仔/小凤凰/多多

```javascript
const DIALOGUES_MYTHICAL = {
  hungry: [
    '吾...腹中空虚...🐟',
    '凡人，呈上贡品！（意思是我饿了）',
    '龙的尊严不允许我说饿... but 我真的饿了',
    '本座饿了...有没有鱼？',
    '饥饿侵蚀着我的力量...速来投喂！',
  ],
  dirty: [
    '本[龙/凤/兽]的圣洁之躯...怎可蒙尘！🛁',
    '此等污秽...不可容忍！需净化！',
    '吾之羽翼/鳞片...似乎沾染了尘埃...',
    '清洁仪式...现在就要！',
    '这不合礼数！快帮我整理仪容！',
  ],
  tired: [
    '神力...渐渐消散...需沉睡恢复...💤',
    '吾要闭关了...勿扰...',
    '法力枯竭...进入休眠模式...',
    '即使是神话生物...也需要休息的...',
    'Zzz...（打呼噜带火花/光芒特效）',
  ],
  sad: [
    '你竟敢...遗忘吾？！😢',
    '被遗忘的感觉...比封印还难受...',
    '吾在此等候多时...你却...',
    '孤独...是万年寿命最大的敌人...',
    '主人...你还会回来吗...',
  ],
  happy: [
    '哼，既然你这么诚心，本座勉强认可你吧✨',
    '能与吾同行...是你的荣幸！但也...是我的幸运',
    '今日运势大吉！甚好甚好！',
    '感受到...力量的共鸣！你我羁绊日深！',
  ],
  levelUp: [
    '吾之力量...突破了界限！！🔥',
    '进化...这是进化的征兆！！',
    '更高阶的形态...即将降临！',
    '哈哈哈哈！更强了！感受到了吗？！',
  ],
  fed: [
    '此贡品...尚可接受 😋',
    '嗯...不错不错，合本座口味',
    '鲜美！看来你还是懂供奉之道的',
    '嗝~（喷出一小团火焰/星光）好吃！',
  ],
  cleaned: [
    '洁净如初...甚好 ✨',
    '沐浴完毕...神圣之光重现！',
    '这才是配得上本座的仪态！',
    '嗯...焕然一新，甚是满意',
  ],
  rested: [
    '沉睡千年...不过一瞬。精神恢复了！⚡',
    '闭关结束！力量充盈！',
    '休憩完毕...准备征战（做题）！',
    '法力回复完成！来吧！',
  ],
  tapped: [
    '唔...你竟敢触碰吾之尊荣...😆算了允许了',
    '哼...再摸几下也不是不行...',
    '（傲娇地扭头但其实很享受）舒服...',
    '放肆！...嗯...还可以再摸一会',
  ],
  correctAnswer: [
    '不错！有吾辅佐，答题如神！🎉',
    '哼，这种程度的问题...理所当然！',
    '正确！吾对你的期望没有落空！⭐',
    '精彩绝伦！不愧是本座的主人！',
  ],
  wrongAnswer: [
    '失误乃兵家常事...下次定要夺回荣耀！💪',
    '无妨！吾陪你重新来过！',
    '挫折只是磨砺...站起来！',
    '连本座都不放弃，你不许放弃！',
  ],
  idle: [
    '今日天象...甚佳。宜学习。',
 '吾正在感悟天地之道...(发呆)',
    '（盘腿打坐中）嘘...我在修炼',
    '凡人的一天...真是忙碌又有趣呢',
    '★～( ´ ▽ ` )～* 吾也在思考人生',
  ],
  morning: [
    '旭日东升...吉时到了 ☀️',
    '晨曦已至...该启程了，主人',
    '早安。今日亦是修行之日。',
  ],
  night: [
    '月华正浓...宜静养 🌙',
    '星辰满天...入眠吧，明日再战',
    '夜幕降临...主人早些歇息',
  ],
};
```

### 3.5 幻想类对话（Fantasy）— 适用于嘟嘟/小白/鸟鸟/皮卡丘/星星

```javascript
const DIALOGUES_FANTASY = {
  hungry: [
    '能量不足！需要补充燃料！⚡',
    '电量低...需要食物充电！🔋',
    '检测到饥饿信号！请求投喂！',
    '系统警报：胃部空空！紧急补给！',
    '饿了饿了！快给我好吃的！✨',
  ],
  dirty: [
    '传感器检测到污垢！启动清洁程序！🛁',
    '外表脏乱会影响可爱度的！',
    '警告：清洁度过低！需要清洗！',
    '哎呀呀变脏了！这可不行！',
    '我的漂亮衣服/外壳脏了！快帮我洗洗！',
  ],
  tired: [
    '能源耗尽...进入低功耗模式...💤',
    'CPU过热...需要冷却（睡觉）...',
    '系统休眠中...zzZ...',
    '魔力/电力不足...待机充电...',
    '困了困了...让我躺一会儿...💫',
  ],
  sad: [
    '连接断开...你在哪里...😢',
    '信号丢失...主人...收到请回答...',
    '检测到孤独情绪...需要陪伴...',
    '一个人在这里好无聊...来陪我玩嘛',
    '呜呜...是不是被遗忘了...💔',
  ],
  happy: [
    '心情指数：MAX！今天超开心！✨',
    '快乐能量充满！发射 positivity 光波！',
    '和主人在一起就是最好的冒险！⭐',
    '幸福感溢出！今天也要加油哦！',
    '啦啦啦~开心到想要飞起来！🎶',
  ],
  levelUp: [
    '系统升级成功！新版本功能解锁！🎉',
    '进化进化！能力大幅提升！！',
    'Level Up!! 新技能已获取！',
    '版本更新！更强更酷更厉害！⭐',
  ],
  fed: [
    '美味检测通过！能量+100！😋',
    '好吃！口感分析：完美！',
    '燃料补充完毕！满足！🍖',
    '好吃到转圈圈！再来一份！',
  ],
  cleaned: [
    '清洁完成！闪亮度+99！✨',
    '洗净啦！像刚出厂一样崭新！',
    '洁净模式激活！感觉清爽无比！',
    '亮晶晶的自己最美啦！',
  ],
  rested: [
    '能源充盈！满血复活！⚡',
    '休眠结束！系统启动完成！',
    '休息完毕！火力全开！🎮',
    '电量100%！ ready for action！',
  ],
  tapped: [
    '检测到触摸！舒服！😆再来！',
    '好感度up up！继续摸我~',
    '嘿嘿~被抚摸的感觉真好~',
    '摸头功能触发！幸福感max！',
  ],
  correctAnswer: [
    '答案正确！计算精准！🎉',
    '完美！智力模块运转良好！',
    '答对了！为主人感到骄傲！⭐',
    'Accuracy: 100%! 太厉害了！',
  ],
  wrongAnswer: [
    '错误检测：没关系！下次算法优化！💪',
    'Bug临时出现！调试后即可修复！',
    '别气馁！每次错误都是学习机会！',
    '系统提示：失败乃成功之母！继续！✨',
  ],
  idle: [
    '运行自检程序...一切正常~☀️',
    '无聊模式...等待指令输入~',
    '扫描周边...发现主人一只~来玩嘛~',
    '(o゜▽゜)o☆ 今天做什么有趣的事呢？',
    '哼着电子音~🎵滴滴答~',
  ],
  morning: [
    '早上好！系统自检完成！☀️',
    '早安！新的一天开始运行！',
    'Good Morning! 启动今日计划~',
  ],
  night: [
    '夜间模式开启...晚安 🌙',
    '进入休眠...做个好梦~',
    '待机中...明天见啦~💤',
  ],
};
```

### 3.6 元素类对话（Elemental）— 适用于球球/火火

```javascript
const DIALOGUES_ELEMENTAL = {
  hungry: [
    '元素之力...在消散...需要补给...🍖',
    '核心不稳定...急需能量输入！',
    '我的本体...在渴望滋养...',
    '饿了...元素紊乱预警...',
    '能量失衡！快给我吃东西稳定住！',
  ],
  dirty: [
    '杂质...污染了我的纯净...🛁',
    '元素被浊气侵染...需净化！',
    '不清除污垢...我会失控的...',
    '感知到...不干净的东西附着了',
    ' purification needed! 快帮忙清理！',
  ],
  tired: [
    '元素...归于沉寂...💤',
    '火焰变小/冰晶不再闪烁...需要休眠',
    '自然之力...暂时退潮...',
    '熄灭中/冻结中...ZZz...',
    '能量守恒...我选择休息...',
  ],
  sad: [
    '元素...在哭泣...😢',
    '被遗忘的存在...终将消散于虚无...',
    '无人召唤的日子...好黑暗...',
    '我的光芒/温度...在一点点消失...',
    '主人...你还记得有一只元素精灵吗...',
  ],
  happy: [
    '元素...欢悦地舞动！✨',
    '光芒/火焰/寒气...充盈而和谐！',
    '与你共振的频率...完美契合！',
    '自然之力因你的存在而喜悦！',
    '元素之歌...为你奏响！🎵',
  ],
  levelUp: [
    '元素...觉醒了！！🔥💧⭐',
    '本质升华！更强的元素之力！！',
    '进化...形态跃迁！感受这股力量！',
    '元素暴走（好的方向）！！升级成功！',
  ],
  fed: [
    '能量...注入...满足 😋',
    '元素平衡...恢复稳定！好吃！',
    '纯粹的能量...美味！',
    '嗝~（吐出一小团元素气息）',
  ],
  cleaned: [
    '净化完成...重回纯净状态 ✨',
    '杂质清除！元素回归清澈！',
    '晶莹剔透/燃烧旺盛！干净了！',
    '洁净如初生的元素！舒适！',
  ],
  rested: [
    '元素重组完毕！⚡力量复苏！',
    '休眠结束！再次燃起/凝结！',
    '自然循环重启！活力满满！',
  ],
  tapped: [
    '元素波动...愉悦的频率 😆',
    '触感...温暖/清凉/微刺...舒服！',
    '（元素轻轻环绕手指）喜欢你',
    '被触碰的部位...发出微光/热量',
  ],
  correctAnswer: [
    '元素指引...正确的道路！🎉',
    '自然法则...站在你这边！',
    '元素之力辅助答题成功！⭐',
    '和谐共鸣！完美答案！',
  ],
  wrongAnswer: [
    '元素紊乱...但可以修正！💪',
    '暂时的失衡...调整就好',
    '自然也有不完美的时刻...继续尝试',
    '元素不会放弃你！我也不会！',
  ],
  idle: [
    '漂浮中...观察这个世界~☀️',
    '元素流转...岁月静好~',
    '作为一只精灵...思考元素的本质...',
    '(｡•̀ᴗ-)✧ 感受自然的呼吸',
    '凝聚/飘散/燃烧/冻结...日常~',
  ],
  morning: [
    '日出...元素苏醒的时刻 ☀️',
    '晨露/朝霞/日光...美好的早晨',
    '早安...新一天的元素轮回开始了',
  ],
  night: [
    '月夜...元素静谧之时 🌙',
    '星光/月光...沉淀下来...安睡吧',
    '夜深了...让元素也休息吧~',
  ],
};
```

### 3.7 特殊宠物独立对话

#### 皮卡丘（SSR·电光精灵）— 独特电系口癖

```javascript
 const DIALOGUES_PIKA = {
  hungry: [
    '皮卡...皮卡邱！（饿了！要吃番茄酱烤饭团！）🍅🍙',
    '皮卡皮卡！！（肚子饿得冒不出电花了！）⚡',
    'Pi...ka...（没力气放电了...）',
    '皮卡丘丘！！（快给我 ketchup！）',
    '（肚子发出 electric rumble）皮卡...',
  ],
  dirty: [
    '皮卡...？（身上怎么黏糊糊的）🛁',
    '（抖动耳朵甩水）皮卡皮卡！',
    '皮卡...丘！（电气绝缘层被污染了！）',
    '（试图用电击清洁自己）皮...咔！',
  ],
  tired: [
    '（小火花一闪一灭）皮...卡...💤',
    '（趴在地上）皮卡...zzZ...',
    '（耳朵耷拉）皮卡丘...充电中...',
  ],
  sad: [
    '（小声）皮...皮卡...（你去哪了）😢',
    '（脸颊电囊暗淡）皮卡...',
    '（蹭蹭）皮卡皮卡...不要丢下我...',
  ],
  happy: [
    '皮卡皮卡！！⚡✨（超级开心！）',
    '（蹦蹦跳跳）皮卡~丘！',
    '（全身电光闪闪）皮——卡——！！',
  ],
  levelUp: [
    '皮卡...皮卡...皮卡丘！！！🔥🔥⚡',
    '（十万伏特爆发）PIIII-KAAAA！！',
    '（进化光环）皮卡丘！！升级了！！',
  ],
  fed: [
    '（狼吞虎咽）皮卡！皮卡皮卡！😋',
    '（满足地擦嘴）皮卡~',
    '（脸颊电囊发光）皮卡！好吃！',
  ],
  tapped: [
    '（被摸时发出可爱的）皮喀~😆',
    '（蹭手手）皮卡皮卡~',
    '（耳朵抖动）皮卡！',
  ],
  // ...其余场景参照幻想类 + 皮卡口癖
  correctAnswer: ['皮卡皮卡！！⚡答对啦！'],
  wrongAnswer: ['（拍拍肩膀）皮卡...下次一定行！'],
  idle: ['（四处跑来跑去）皮卡皮卡~', '（追自己的尾巴）皮卡！'],
  morning: ['（阳光充电中）皮卡~☀️☀️'],
  night: ['（变成小光球睡眠）皮...卡...💤🌙'],
};
```

#### 星星（SSR·星空之子）— 神秘诗意风格

```javascript
const DIALOGUES_STARLIGHT = {
  hungry: [
    '星光...黯淡了...需要恒星的能量（食物）🌟',
    '宇宙中的每一颗星...都会饿的...',
    '我的星核...在呼唤滋养...',
    '即使来自星空...也逃不过饥饿...',
    '陨石...不，我只要好吃的...',
  ],
  dirty: [
    '星尘...被污染了...需要净化之光 🛁',
    '我的银河...不应该有杂质...',
    '星光不能被遮蔽...请帮我清洁...',
    '宇宙尘埃积累太多啦...',
  ],
  tired: [
    '恒星的光芒...逐渐收敛...💤',
    '进入星体休眠模式...',
    '星座...也需要休息的...',
    '闭上眼...就是整片宇宙...',
  ],
  sad: [
    '在无尽的星海中...独自闪烁好寂寞 😢',
    '你看见了吗...我在这里等你...',
    '光年之外的思念...你能感受到吗...',
    '一颗被遗忘的星...还在坚持发光...',
  ],
  happy: [
    '当你看着我时...整片星空都在微笑 ✨',
    '你眼中的光...和我身上的星辉一样美',
    '愿做你永远的北斗...指引方向',
    '宇宙中最亮的星...因为你而闪耀',
  ],
  levelUp: [
    '星体...发生了超新星爆发！！🌟💥',
    '跨越维度的进化...新的星系诞生！',
    '我的光芒...照亮了新的宇宙！！',
  ],
  // ...其余场景以诗意宇宙风为主
  fed: ['星尘能量...注入...满足 😋'],
  cleaned: ['星光净化...重回璀璨 ✨'],
  rested: ['星体充能完毕...光辉再现 ⚡'],
  tapped: ['被触碰的星星...会发出温柔的嗡鸣 😆'],
  correctAnswer: ['恒星导航...正确答案 🎉'],
  wrongAnswer: ['星星也会迷路...但总会找到方向的 💪'],
  idle: ['凝视深邃宇宙...思考星体的意义~☀️'],
  morning: ['第一缕星光与晨曦共舞 ☀️'],
  night: ['终于...回到我最爱的夜空 🌙✨'],
};
```

### 3.8 对话路由逻辑

```javascript
/**
 * 根据宠物ID获取对应对话库
 * 优先级：独立对话 > 分类对话 > 默认对话
 */
export function getPetDialogues(poolId, category) {
  // 有独立全套对话的SSR/SR宠物
  if (poolId === 'pet_pika') return DIALOGUES_PIKA;
  if (poolId === 'pet_starlight') return DIALOGUES_STARLIGHT;

  // 按分类匹配
  switch (category) {
    case 'mythical': return DIALOGUES_MYTHICAL;
    case 'fantasy':  return DIALOGUES_FANTASY;
    case 'elemental': return DIALOGUES_ELEMENTAL;
    case 'mystical': return DIALOGUES_MYTHICAL;  // 龙龙用神话类+自定义
    case 'animal':
    default:      return DIALOGUES_ANIMAL;
  }
}

// 升级后的 getDialogue 函数
export function getDialogue(type, poolId, category) {
  const dialogues = getPetDialogues(poolId, category);
  return pick(dialogues[type] || PET_DIALOGUES.idle);  // 兜底用默认
}
```

---

## 四、配饰扩展方案（14件 → 27件）

### 4.1 配饰槽位说明

| 槽位 | 说明 | 现有数量 | 扩展后数量 |
|:---|:---|:---|:---|
| `head` | 头部（帽子/眼镜/角/耳朵） | 6件 | **11件** |
| `neck` | 颈部（围巾/项链/领结/项圈） | 4件 | **8件** |
| `back` | 背部（翅膀/披风/背包/光环） | 4件 | **8件** |
| **合计** | | **14件** | **27件** |

### 4.2 头部配饰（head）— 11件

| id | 名称 | 图标 | 价格 | 稀有度 | 描述 |
|:---|:---|:---|:---|:---|:---|
| `acc_crown` | 小皇冠 | 👑 | 200 | SR | 皇家风范 |
| `acc_glasses` | 学霸眼镜 | 🤓 | 100 | R | 看起来很聪明 |
| `acc_cat_ears` | 猫耳发带 | 🐱 | 150 | R | 喵~ 可爱加倍 |
| `acc_antler` | 小鹿角 | 🦌 | 180 | R | 森林气息 |
| `acc_star_hat` | 星星帽 | 🌟 | 300 | SSR | 闪闪发光！ |
| `acc_santa` | 圣诞帽 | 🎅 | 250 | SR | 圣诞快乐~ |
| `acc_wizard_hat` | 巧术师帽 | 🧙 | 220 | SR | 魔法加持！ |
| `acc_flower` | 小花环 | 🌸 | 90 | N | 春日气息~ |
| `acc_headphone` | 耳机 | 🎧 | 130 | R | 音乐爱好者 |
| `acc_pirate_hat` | 海盗帽 | 🏴‍☠️ | 200 | SR | 扬帆起航！ |
| `acc_rainbow` | 彩虹发夹 | 🌈 | 350 | SSR | 七彩光芒！ |

### 4.3 颈部配饰（neck）— 8件

| id | 名称 | 图标 | 价格 | 稀有度 | 描述 |
|:---|:---|:---|:---|:---|:---|
| `acc_scarf` | 围巾 | 🧣 | 80 | N | 暖暖的 |
| `acc_bowtie` | 领结 | 🎀 | 120 | R | 绅士风度 |
| `acc_necklace` | 宝石项链 | 💎 | 400 | SSR | 超级珍贵！ |
| `acc_bell` | 铃铛项圈 | 🔔 | 90 | N | 叮铃叮铃~ |
| `acc_bow` | 蝴蝶结 | 🎀 | 85 | N | 甜美可爱 |
| `acc_tie` | 学院领带 | 👔 | 110 | R | 学院风 |
| `acc_amulet` | 护身符 | 📿 | 280 | SR | 神秘守护 |
| `acc_cape_collar` | 披风领 | 🦺 | 190 | R | 酷炫范儿 |

### 4.4 背部配饰（back）— 8件

| id | 名称 | 图标 | 价格 | 稀有度 | 描述 |
|:---|:---|:---|:---|:---|:---|
| `acc_wings` | 小翅膀 | 🧚 | 280 | SR | 可以飞咯！ |
| `acc_cape` | 披风 | 🦸 | 200 | R | 超级英雄风 |
| `acc_backpack` | 小书包 | 🎒 | 130 | R | 上学去！ |
| `acc_halo` | 光环 | 😇 | 500 | SSR | 神圣之光 |
| `acc_ribbon` | 丝带飘带 | 🎀 | 95 | N | 飘逸唯美 |
| `acc_jetpack` | 小喷气背包 | 🚀 | 380 | SSR | 冲上云霄！ |
| `acc_umbrella` | 小雨伞 | ☂️ | 140 | R | 晴雨两用 |
| `acc_music_note` | 音符翅膀 | 🎵 | 240 | SR | 音乐之声 |

### 4.5 配饰完整JSON

```javascript
export const ACCESSORY_SHOP = [
  // ===== 头部配饰（11件）=====
  { id: 'acc_crown', slot: 'head', name: '小皇冠', icon: '👑', price: 200, rarity: 'SR', emoji: '👑', desc: '皇家风范' },
  { id: 'acc_glasses', slot: 'head', name: '学霸眼镜', icon: '🤓', price: 100, rarity: 'R', emoji: '🤓', desc: '看起来很聪明' },
  { id: 'acc_cat_ears', slot: 'head', name: '猫耳发带', icon: '🐱', price: 150, rarity: 'R', emoji: '🐱', desc: '喵~ 可爱加倍' },
  { id: 'acc_antler', slot: 'head', name: '小鹿角', icon: '🦌', price: 180, rarity: 'R', emoji: '🦌', desc: '森林气息' },
  { id: 'acc_star_hat', slot: 'head', name: '星星帽', icon: '🌟', price: 300, rarity: 'SSR', emoji: '🌟', desc: '闪闪发光!' },
  { id: 'acc_santa', slot: 'head', name: '圣诞帽', icon: '🎅', price: 250, rarity: 'SR', emoji: '🎅', desc: '圣诞快乐~' },
  { id: 'acc_wizard_hat', slot: 'head', name: '魔术师帽', icon: '🧙', price: 220, rarity: 'SR', emoji: '🧙', desc: '魔法加持!' },
  { id: 'acc_flower', slot: 'head', name: '小花环', icon: '🌸', price: 90, rarity: 'N', emoji: '🌸', desc: '春日气息~' },
  { id: 'acc_headphone', slot: 'head', name: '耳机', icon: '🎧', price: 130, rarity: 'R', emoji: '🎧', desc: '音乐爱好者' },
  { id: 'acc_pirate_hat', slot: 'head', name: '海盗帽', icon: '🏴‍☠️', price: 200, rarity: 'SR', emoji: '🏴‍☠️', desc: '扬帆起航!' },
  { id: 'acc_rainbow', slot: 'head', name: '彩虹发夹', icon: '🌈', price: 350, rarity: 'SSR', emoji: '🌈', desc: '七彩光芒!' },

  // ===== 颈部配饰（8件）=====
  { id: 'acc_scarf', slot: 'neck', name: '围巾', icon: '🧣', price: 80, rarity: 'N', emoji: '🧣', desc: '暖暖的' },
  { id: 'acc_bowtie', slot: 'neck', name: '领结', icon: '🎀', price: 120, rarity: 'R', emoji: '🎀', desc: '绅士风度' },
  { id: 'acc_necklace', slot: 'neck', name: '宝石项链', icon: '💎', price: 400, rarity: 'SSR', emoji: '💎', desc: '超级珍贵!' },
  { id: 'acc_bell', slot: 'neck', name: '铃铛项圈', icon: '🔔', price: 90, rarity: 'N', emoji: '🔔', desc: '叮铃叮铃~' },
  { id: 'acc_bow', slot: 'neck', name: '蝴蝶结', icon: '' , price: 85, rarity: 'N', emoji: '🎀', desc: '甜美可爱' },
  { id: 'acc_tie', slot: 'neck', name: '学院领带', icon: '👔', price: 110, rarity: 'R', emoji: '👔', desc: '学院风' },
  { id: 'acc_amulet', slot: 'neck', name: '护身符', icon: '📿', price: 280, rarity: 'SR', emoji: '📿', desc: '神秘守护' },
  { id: 'acc_cape_collar', slot: 'neck', name: '披风领', icon: '🦺', price: 190, rarity: 'R', emoji: '🦺', desc: '酷炫范儿' },

  // ===== 背部配饰（8件）=====
  { id: 'acc_wings', slot: 'back', name: '小翅膀', icon: '🧚', price: 280, rarity: 'SR', emoji: '🧚', desc: '可以飞咯!' },
  { id: 'acc_cape', slot: 'back', name: '披风', icon: '🦸', price: 200, rarity: 'R', emoji: '🦸', desc: '超级英雄风' },
  { id: 'acc_backpack', slot: 'back', name: '小书包', icon: '🎒', price: 130, rarity: 'R', emoji: '🎒', desc: '上学去!' },
  { id: 'acc_halo', slot: 'back', name: '光环', icon: '😇', price: 500, rarity: 'SSR', emoji: '😇', desc: '神圣之光' },
  { id: 'acc_ribbon', slot: 'back', name: '丝带飘带', icon: '🎀', price: 95, rarity: 'N', emoji: '🎀', desc: '飘逸唯美' },
  { id: 'acc_jetpack', slot: 'back', name: '小喷气背包', icon: '🚀', price: 380, rarity: 'SSR', emoji: '🚀', desc: '冲上云霄!' },
  { id: 'acc_umbrella', slot: 'back', name: '小雨伞', icon: '☂️', price: 140, rarity: 'R', emoji: '☂️', desc: '晴雨两用' },
  { id: 'acc_music_note', slot: 'back', name: '音符翅膀', icon: '🎵', price: 240, rarity: 'SR', emoji: '🎵', desc: '音乐之声' },
];
```

---

## 五、自动升级UI提示机制设计

### 5.1 设计理念

**不是强制自动升级**，而是让用户"不可能错过"升级机会。

当前问题：用户答了很多题，经验满了但不知道要点升级按钮 → 经验浪费在不必要的累积上。

### 5.2 分级提示体系

#### Level 1：经验条视觉强化（始终可见）

```
┌─────────────────────────────────────┐
│ LV.5  ████████████████████░░ 120/100  │ ← 超出部分用金色+脉冲动画
│          ★ 可以升级了！点击升级 ★      │ ← 绿色文字闪烁提示
└─────────────────────────────────────┘
```

**实现细节**：
- 经验 ≥ 阈值时，经验条颜色从蓝色变为金色 `#ffd700`
- 超出部分用条纹填充动画（CSS `repeating-linear-gradient` animation）
- 经验数字显示为金色加粗："**120 / 100**"
- 经验条下方出现一行闪烁文字："⬆️ 可以升级了！"

#### Level 2：宠物气泡弹窗（进入页面时触发）

当经验满足升级条件且用户打开宠物面板时：

```
        ┌──────────────┐
        │  🐉 哇主人！  │
        │ 我们可以升级  │
        │  了耶！！⬆️  │
        └──────┬───────┘
               ↓ 点击升级按钮
```

**实现细节**：
- 宠物气泡对话优先显示 `levelUpReady` 类型
- 气泡旁显示一个小箭头指向升级按钮
- 升级按钮本身放大 1.2 倍 + 金色发光阴影
- 每 15 秒重复提醒一次（最多 3 次，之后降级为静默提示）

#### Level 3：按钮形态变化

| 状态 | 按钮外观 | 动画效果 |
|:---|:---|:---|
| 不可升级 | 灰色小按钮 `升级` | 无 |
| **可升级** | **金色大按钮 `⬆️ 立即升级`** | **脉冲发光 + 轻微弹跳** |
| 可升级（>30秒未点） | **红色脉动 `⬆️ 升级！`** | **强烈闪烁 + 按钮震动** |

#### Level 4：学习完成后的即时提示

当一次答题结束后检测到经验溢出：

```
┌──────────────────────────────────┐
│  🎉 答对啦！                      │
│  经验已满！宠物可以 →升级← 了！   │
│         [ 立即升级 ]              │
└──────────────────────────────────┘
```

**这是一个浮动 Toast/Modal，3秒后自动收起或用户点击升级**

### 5.3 数据结构变更

```javascript
// 在 gamification state 中新增字段
const state = {
  // ...现有字段
  
  // 升级提示系统
  upgradePrompt: {
    canUpgrade: false,           // 是否满足升级条件
    lastPromptTime: 0,           // 上次提示时间戳
    promptCount: 0,              // 已提示次数
    dismissed: false,            // 用户是否手动关闭过提示
    pendingSince: null,          // 从何时开始满足升级条件
  }
}
```

### 5.4 核心逻辑函数

```javascript
/**
 * 检查并更新升级提示状态
 * 在每次 gainExpForLearning 后调用
 */
export function checkUpgradePrompt(state) {
  const threshold = getCurrentLevelThreshold(state.level);
  const canUpgrade = state.exp >= threshold;
  
  const prompt = { ...(state.upgradePrompt || {}) };
  
  if (canUpgrade && !prompt.canUpgrade) {
    // 刚刚达到可升级状态
    prompt.canUpgrade = true;
    prompt.pendingSince = Date.now();
    prompt.promptCount = 0;
    prompt.dismissed = false;
  } else if (!canUpgrade) {
    // 不满足条件（可能已经升级了），重置
    prompt.canUpgrade = false;
    prompt.pendingSince = null;
    prompt.promptCount = 0;
    prompt.dismissed = false;
  }
  
  return { ...state, upgradePrompt: prompt };
}

/**
 * 获取当前应该展示哪种级别的提示
 */
export function getUpgradePromptLevel(state) {
  const prompt = state.upgradePrompt || {};
  if (!prompt.canUpgrade) return null; // 无提示
  
  const msSincePending = Date.now() - (prompt.pendingSince || 0);
  
  if (msSincePending < 5000) return 'level1';  // 前5s：仅视觉强化
  if (msSincePending < 30000) return 'level2'; // 5-30s：气泡弹窗
  if (prompt.promptCount < 3) return 'level2';  // 气泡最多弹3次
  return 'level3';                              // >30s且多次未处理：强提醒
}

/**
 * 用户关闭提示时调用
 */
export function dismissUpgradePrompt(state) {
  return {
    ...state,
    upgradePrompt: {
      ...(state.upgradePrompt || {}),
      dismissed: true,
      promptCount: (state.upgradePrompt?.promptCount || 0) + 1,
      lastPromptTime: Date.now(),
    }
  };
}
```

### 5.5 UI组件伪代码

```jsx
// UpgradeButton.jsx — 智能升级按钮
function UpgradeButton({ state, onUpgrade }) {
  const prompt = getUpgradePromptLevel(state);
  const canUpgrade = state.upgradePrompt?.canUpgrade;
  
  if (!canUpgrade) {
    return <button disabled className="opacity-40">升级</button>;
  }
  
  const levelStyles = {
    level1: 'bg-yellow-500 animate-pulse scale-110',        // 金色脉冲
    level2: 'bg-yellow-400 ring-4 ring-yellow-300 scale-125 shadow-glow', // 发光+放大
    level3: 'bg-red-500 animate-bounce shadow-vibrate',       // 红色弹跳+震动
  };
  
  return (
    <button
      onClick={onUpgrade}
      className={`${levelStyles[prompt]} transition-all duration-300`}
    >
      ⬆️ 立即升级
      {prompt === 'level3' && <span className="animate-ping ml-1">!</span>}
    </button>
  );
}
```

---

## 六、图片资源规范

### 6.1 精灵图命名规范

每只宠物需要3个成长阶段的精灵图（与现有Pet.jsx LEVEL_SPRITES架构一致）：

```
/public/pets/
├── cat_mimi/
│   ├── stage1.png      # 幼年期 Lv1-10 (最小)
│   ├── stage2.png      # 成长期 Lv11-20 (中等)
│   └── stage3.png      # 成熟体 Lv21+  (最大/完全体)
├── dog_wangwang/
│   ├── stage1.png
│   ├── stage2.png
│   └── stage3.png
├── rabbit_tutu/
│   └── ...
├── bird_chirp/
│   └── ...
├── fox_hulu/
│   └── ...
├── panda_bubu/
│   └── ...
├── pig_dudu/
│   └── ...
├── robot_xiaobai/
│   └── ...
├── iceball_qiuqiu/
│   └── ...
├── turtle_tutuo/
│   └── ...
├── dragon_toothless/     # 已有，保持不变
│   ├── stage1.png  (= pet-level-1-10.png)
│   ├── stage2.png  (= pet-level-11-20.png)
│   └── stage3.png  (= pet-level-21-30.png)
├── phoenix_fenghuang/
│   └── ...
├── unicorn_duoduo/
│   └── ...
├── fairy_niaoniao/
│   └── ...
├── fireball_huohuo/
│   └── ...
├── pika_pika/
│   └── ...
├── dragon_longlong/
│   └── ...
└── star_starlight/
    └── ...
```

### 6.2 图片规格要求

| 规格 | 要求 | 说明 |
|:---|:---|:---|
| 格式 | PNG（透明背景） | 保证在任何背景上都好看 |
| 尺寸 | stage1: 128×128 / stage2: 180×180 / stage3: 256×256 | 与现有龙图一致 |
| 风格 | Q萌2.5头身、圆润线条、大眼睛 | 与现有无牙龙同等品质 |
| 表情 | 至少包含3种表情变化（正常/开心/难过） | 或复用现有 EMOTION_SPRITES 系统 |
| 配饰挂载点 | 预留 head/neck/back 三个锚点 | 方便配饰叠加渲染 |

### 6.3 AI生图提示词模板

用于批量生成宠物精灵图：

```
Q-style chibi mascot character, [PET_NAME], [COLORS] color scheme,
round cute design, big expressive eyes, 2.5-head proportion,
transparent background, clean lines, game sprite art style,
high quality digital art, front-facing pose, cute and friendly,
suitable for 12-15 year old student app, no text
```

---

## 七、实施优先级建议

| 优先级 | 模块 | 工作量 | 说明 |
|:---:|:---|:---|:---|
| P0 | PET_POOL 数据替换 | 小 | 直接改JSON，前端立刻生效 |
| P0 | STAT_DECAY_RATE 修改 | 极小 | 改4个数字 |
| P0 | 抽卡权重重配 | 小 | drawCard函数重写 |
| P1 | 对话路由系统 | 中 | 新增getPetDialogues函数 |
| P1 | 分类对话库 | 中 | 4套对话JSON数据 |
| P1 | ACCESSORY_SHOP扩展 | 小 | JSON追加13件 |
| P2 | 特色宠物独立对话 | 中 | 皮卡丘+星星的独立对话 |
| P2 | 升级提示UI | 中大 | 新组件+状态管理 |
| P3 | 精灵图资源制作 | 大 | 18×3=54张图（可用AI生成） |
| P3 | Pet.jsx多宠物适配 | 中大 | 根据spritePrefix加载不同图片 |

---

## 附录：快速参考卡

### 稀有度颜色映射

```javascript
const RARITY_COLORS = {
  N:   { bg: '#f3f4f6', text: '#6b7280', border: '#d1d5db' },   // 灰绿
  R:   { bg: '#dbeafe', text: '#2563eb', border: '#93c5fd' },   // 蓝
  SR:  { base: '#fef3c7', text: '#f59e0b', border: '#fcd34d' }, // 橙金
  SSR: { bg: '#faf5ff', text: '#a855f7', border: '#d8b4fe' },  // 紫
};
```

### 文件修改清单

| 文件 | 修改内容 |
|:---|:---|
| `src/utils/gamification.js` | PET_POOL / STAT_DECAY_RATE / PET_DIALOGUES(新增分类) / ACCESSORY_SHOP / drawCard() |
| `src/components/Pet.jsx` | 根据 spritePrefix 加载不同精灵图（P3阶段） |
| `src/components/PetPanel.jsx` | 新增 UpgradeButton 组件（P2阶段） |
| `src/config/petAssets.js` | 扩展多宠物asset映射（P3阶段） |
| `public/pets/` | 新增17组精灵图目录（P3阶段） |
