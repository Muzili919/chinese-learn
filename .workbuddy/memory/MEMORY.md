# 项目记忆

## chinese-learn 项目
- 初中学习辅助Web应用，包含选择题练习功能
- 技术栈：React + Vite + Tailwind
- 部署在 Vercel

## 题库文件
- `src/data/questions_politics_choice.json` — 初中政治选择题120题
- 模块分布：宪法与法律48题 / 道德与心理30题 / 国情国策24题 / 社会生活18题
- 答案分布：ABCD各30题（完美均匀）
- 难度分布：基础72 / 提升34 / 拓展14
- 所有题目均情境化出题、含干扰项谬误分析

## 题库生成注意事项
- 生成脚本用Python json.dump输出，避免中文引号导致JSON解析失败
- 选项打乱后必须同步更新analysis中的干扰项引用
- 原始题目答案不都是B，需要根据实际answer字段定位正确选项
- 生成脚本存放于 `scripts/` 目录

## 关键日期
- 2026-04-12: 政治选择题120题库完成生成、修复和审校
- 2026-04-15: 英语题库全面修复（听力question+完形options+前端inline_choice兜底）
- 2026-04-15: 宠物系统P0+P1升级（3→18只宠物池+动态图片+衰减优化+配饰25件）commit 7cd251f

---

# 🐱 宠物系统完整架构文档

## 当前宠物池（11只）

| poolId | 中文名 | 稀有度 | spritePrefix | 阶段 | 特点 |
|--------|--------|--------|-------------|------|------|
| pet_kitten | 小橘猫 | N | kitten | 幼年→戴眼镜→魔法阵光环 | 默认新手宠物 |
| pet_shiba | 紫电柴犬 | N | shiba | 赛博机械幼崽→装甲→终极义体 | 2026-04-16升级PNG |
| pet_hamster | 小仓鼠 | N | hamster | 三阶段 | 呆萌吃货 |
| pet_corgi | 小柯基 | N | corgi | 三阶段 | 活力粘人 |
| pet_fox | 银月狐 | R | fox | 白狐幼崽→月纹灵狐→蓝银九尾天狐 | 3阶段PNG(已升级) |
| pet_butterfly | 冰晶灵蝶 | R | butterfly | 三阶段 | 神秘优雅高冷 |
| pet_mantis | 战镰螳螂 | R | mantis | 三阶段 | 冷酷凶悍战斗狂 |
| pet_squirrel | 机械松鼠 | R | squirrel | 三阶段 | 活泼机敏科技萌 |
| pet_kungfu | 功夫滚滚 | R | kungfu | 三阶段 | 沉稳睿智武学宗师 |
| pet_toothless | 无牙仔 | SR | toothless | 黑龙→成长→完全体 | 高稀有度，保底必出 |

### 宠物图片规格
- 存放路径: `public/pets/{spritePrefix}/{stage1,stage2,stage3}/`
- 每阶段9张PNG: reading / sleeping / happy / sad_cry / angry / eating / wave / excited / normal
- 尺寸: ~512-1024px RGBA透明背景
- **Stage1的9张是最低要求**（没有也行但会fallback到dragon图）

---

## 核心组件与数据流

### 渲染链路
```
MV1Demo(currentPet.poolId) → Pet(type=poolId) → PET_SPRITE_MAP查找 → 图片URL
```

**渲染优先级（Pet.jsx）**:
1. 精灵表(sheet) → 有sheet数据的走此路径
2. SVG组件(PetSprites) → 有SVG定义的走此路径
3. **PNG img标签** ← 当前所有宠物都走这条路
4. onError fallback → 同宠物的其他表情图（不是龙图了！）
5. 最终兜底 → dragon图

### 关键文件
| 文件 | 职责 |
|------|------|
| `src/components/Pet.jsx` | 核心渲染：PET_SPRITE_MAP映射 + emotionSprites + fallback逻辑 |
| `src/components/PetSprites.jsx` | SVG精灵表定义（旧系统，大部分已弃用） |
| `src/components/PetSpriteAvatar.jsx` | 头像组件，所有地方统一用这个显示宠物头像 |
| `src/pages/MV1Demo.jsx` | 宠物养成主页面：状态管理、抽卡、商店、互动、任务 |
| `src/utils/gamification.js` | 游戏逻辑核心：PET_POOL / DRAW_WEIGHTS / 抽卡/喂食/升级/商店 |
| `src/components/ShopPanel.jsx` | 商店UI面板 |

---

## 🎴 抽卡系统（方案B：累计次数驱动）

### 概率规则（按累计抽卡次数 totalDraws）

| 阶段 | 次数范围 | N(普通) | R(稀有) | SR(超稀) | SSR(传说) |
|------|---------|---------|---------|----------|-----------|
| base | 第1-3次 | 78% | 12% | 10% | 0% |
| warmup | 第4-10次 | 62% | 18% | 20% | 0% |
| boosted | 第11次+ | 45% | 20% | **35%** | 0% |

### 🔥 保底机制（Pity）
- **连续5次没出SR** → 第6次**必出无牙仔(SR)**
- 出了SR或SSR后自动重置 `pityCount = 0`
- 字段: `state.totalDraws`(累计) + `state.pityCount`(连续未出SR计数)

### 抽卡触发方式
1. 主界面"抽卡按钮"
2. 商店购买"抽卡券"(500经验) → 直接调用drawCard()
3. 上帝模式(?god=1)

---

## 📊 经验系统（重要！两套独立）

### 人物经验（学习等级）
- 来源：答题正确率（gainExpForLearning）
- 用途：人物学习等级显示（不影响宠物）
- 存储：state.exp / storage.getXP()

### 宠物经验（⚠️ 独立池）
- **来源只有两个**：
  - ✅ 每日任务完成奖励（claimTaskReward）
  - ✅ 答题获得（gainExpForLearning内同时加pet.exp）
- **不是来源**：
  - ❌ 喂食（feedPet只加饱食度，不加经验）
  - ❌ 自动升级（已移除while循环）
- 升级：只能用户**手动点升级按钮**（manualLevelUp）
- 可支配经验 = 总经验 - 已消费(petExpConsumed)
- **商店消费扣的是可支配经验，不影响人物学习等级**

### 经验阈值
- 每级需要 100 经验
- 手动检查：petExp >= petLevel * 100 → 可升级

---

## 🏪 商店系统

### 商品类型与消费
| 商品 | 价格(可支配经验) | 效果 |
|------|-----------------|------|
| 喂食(food) | 100 | 饱食度+15 |
| 清洁(cleaning) | 80 | 清洁度+20 |
| 玩具(toy) | 50 | 活力+10 |
| 抽卡券(card_draw) | 500 | **购买+1卡券到背包**，背包中使用触发drawCard() |

### 显示
- 顶部标题: **🐱 可支配经验**
- 数值来源: `totalXP - petExpConsumed`
- **totalXP用useMemo每3秒从storage.getXP刷新**（Fix #5经验同步）

---

## 🔄 切换账号机制（6层防护，已彻底修复）

**问题**: 用户A退出→登录B→看到蛋态→抽卡覆盖B的云端数据

**修复方案（commit 43623b9）**:

| 层 | 位置 | 措施 |
|----|------|------|
| 1 | App.jsx handleOnboarding/handleLogout | setGameState(null)，不传蛋态 |
| 2 | App.jsx `<MV1Demo>` | key={user.id}，强制重新挂载 |
| 3 | MV1Demo useState | 初始值null（不是initGamificationState()） |
| 4 | MV1Demo 渲染 | state===null时显示"正在连接云端..."加载spinner |
| 5 | MV1Demo 所有引用 | state.xxx → **state?.xxx**（可选链防崩溃） |
| 6 | MV1Demo handleDrawCard | state===null时return s（拒绝操作） |

**经验教训**: 切换账号问题必须App层+组件层全链路配合，单改一处永远不够。之前修了5次才成功。

---

## 🐾 宠物状态属性

### 四维属性（每8小时衰减）
| 属性 | 每小时衰减 | 恢复方式 |
|------|-----------|---------|
| hunger(饱食) | -2.0(8h归零) | 喂食+15 |
| cleanliness(清洁) | -2.8(6h归零) | 清洁+20 |
| energy(活力) | -1.5 | 玩具+10 |
| intimacy(亲密) | -0.02 | 答对(+2)/互动(+1) |

### 动作序列（点击宠物/Dock循环）
```
reading(答题默认) / sleeping(Dock默认) / happy / wave / excited / angry / sad_cry / eating / normal → 循环
```
- **答题模式锁定pose=reading**，不受点击影响

### 成长阶段
| 等级范围 | 阶段 | 说明 |
|---------|------|------|
| 1 | 蛋 | 尚未抽卡 |
| 2-9 | 幼年 | Stage1图片 |
| 10-19 | 成长期 | Stage2图片 |
| 20-29 | 成熟体 | Stage3图片 |
| 30+ | 完全体 | Stage3图片（满级） |

---

## 👔 配饰系统
- ACCESSORY_SHOP 共25件：头饰10件 + 颈饰8件 + 背饰7件
- 三个槽位：head / neck / back
- PetSwitchPanel 显示已拥有配饰总数

---

## 🐱 添加新宠物SOP

### 用户需提供
1. **图片**：3阶段×9动作=27张PNG（至少Stage1的9张也能用）
2. **属性**：中文名 / emoji / 稀有度(N/R/SR/SSR)

### 执行步骤
| # | 操作 | 文件 |
|---|------|------|
| 1 | 图片存入 `public/pets/{prefix}/{stage1,stage2,stage3}/` | 文件系统 |
| 2 | PET_POOL数组注册新宠物(poolId/name/emoji/rarity/spritePrefix/personality) | gamification.js |
| 3 | DRAW_WEIGHTS三档加权重（如果需要调整概率） | gamification.js |
| 4 | 新增 XXX_PNG_EMOTIONS 映射 + PET_SPRITE_MAP注册(hasPngEmotions:true + emotionSprites) | Pet.jsx |
| 5 | initGodModeState() ownedPets加入（上帝模式预拥有） | gamification.js |
| 6 | `vite build && git push` | 验证+部署 |

### ⚠️ 关键规则
- hasPngEmotions=true 走PNG路径，否则fallback旧SVG
- emotionSprites中的路径**不能用{stage}字面量**，要用makeXxxStage('stage1')动态生成
- levelSprites key是等级门槛(1/10/20)
- 卖宠物功能自动兼容（检测重复即显示卖掉按钮）
- 所有头像用PetSpriteAvatar组件

### ⚠️ 常见坑（血泪教训）
1. **emotionSprites路径写{stage}字面量** → URL变成%7Bstage%7D → 404 → 图空白
2. **const声明顺序错误**（TDZ） → "Cannot access before initialization"崩溃
3. **onError fallback到ALL_SPRITES** → 所有宠物变龙图
4. **handleLogout重置gameState为蛋态** → 切换账号重新抽卡
5. **spendableXP用了lp.currentExp(人物经验)** → 商店显示错误数值
6. **AI生成精灵图裁剪** → 必须用PIL去下半部分黑边
7. **vocab JSON中文引号** → 必须用逐字符解析器替换为「」
8. **pet_preview宠物信息全为默认值** → upsertMV1State用state.petPool查宠物，但PET_POOL是常量不在state里。必须直接import PET_POOL使用
9. **抽卡券背包使用无反应** → handleUseItem走useItemOnPet(只处理属性物品)，card_draw必须走handleShopAction触发抽卡逻辑
10. **resolveEmotion覆盖用户pose** → 四维状态判断在显式动作之前执行，导致点击切换的happy/excited等被覆盖为normal/sad_cry。必须让USER_CYCLING_POSES白名单直接透传
11. **抽卡券商店买不了** → handleShopAction('card_draw')原来走"使用已有卡券"逻辑（检查cards>0），不是"购买新卡券"。购买=花500经验加1张到背包，使用=消耗1张触发drawCard，两条路径要分开
12. **答题后宠物经验不动** → totalXP只在初始化读storage一次，后续storage.addXP不自动同步。需要定时刷新useEffect或用useMemo
13. **useMemo依赖数组缓存导致经验值卡住** → 即使3秒interval更新了state.exp，totalXP的useMemo可能因React渲染优化跳过重算。最终方案：改用useRef+每渲染直接读storage
14. **页面切换时经验不同步** → 需要监听visibilitychange事件，从答题页切回时立即刷新，不等定时器

---

## 听写词库系统（DictationPage）
- 英语词库 `dictation_en_words.json`：816条，覆盖4-9年级（小学316+初中500）
- 语文词库 `dictation_cn_words.json`：1098条，覆盖4-9年级（小学442+初中656）
- **年级范围按入口动态切换**：小学入口(HomePage)→显示4/5/6年级；初中入口(EnglishHomePage)→显示7(初一)/8(初二)/9(初三)
- DictationPage.jsx 的 `GRADE_OPTIONS` 常量控制可选年级
- 数据格式：en={id,word,meaning,grade,semester,phonetic,example}；cn={id,word,pinyin,grade,semester,example}
- 初中词汇来源：英语基于人教版Go for It!教材；语文基于部编版课文重点词语+成语
- 生成脚本：`scripts/gen_junior_cn_dictation.py`
- `detectMode(q)` 决定每道题走哪个渲染路径
- 优先级：open_ended → multi_sub → true_false → matching → ordering **→ choice → inline_choice(兜底)** → text_fill → writing
- **关键**：`q.options.length >= 2` 才判定为choice模式，否则降级
- 多子题格式：answer含`(1)(2)` → `isMultiPartAnswer()` 检测 → `MultiSubQuiz` 组件自动从子题文本提取选项
- 完形填空cloze：答案格式`1.B 2.C...`，需从analysis提取选项

## 英语题库数据规范
- 听力题：question必须写具体问题（不能是通用模板），listening_text存原文
- 阅读理解多子题：options可空（前端MultiSubQuiz处理），但question末尾必须含完整子题`(n) Q? A..B..C..D..`
- 完形填空cloze：必须有options数组，每个空一行 `(1) A.xxx B.yyy C.zzz D.www`
- 填空题fill_blank：options可为空（前端text_fill文字输入模式）
