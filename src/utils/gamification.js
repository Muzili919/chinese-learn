// ============================================================
//  汉字星球 - 宠物养成系统 (v4 - 精简双宠版)
// ============================================================

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ---- 宠物池（11只）----
export const PET_POOL = [
  // === N级 普通 ===
  {
    poolId: 'pet_kitten', name: '小黄猫', emoji: '🐱', rarity: 'N', personality: 'lazy',
    spritePrefix: 'kitten',
    desc: '额头有"王"字的大橘猫，懒洋洋躺满你整张课桌，但关键时刻从不缺席',
    stages: ['橙色条纹椭圆蛋，有小爪印，摸起来热乎乎的', '巴掌大的橘猫崽，肚皮白白软软，一动就喵一声', '耳朵竖起来了！尾巴高高翘，老爱钻进书包里睡觉', '毛发蓬松，脖子有虎纹，专门坐在课本上挡你看书', '额头浮现"王"字，威严大橘猫，懒洋洋却无处不在'],
  },
  {
    poolId: 'pet_shiba', name: '紫电柴犬', emoji: '🐕', rarity: 'N', personality: 'loyal',
    spritePrefix: 'shiba',
    desc: '右耳和左前腿是银色机械义肢、蓝光闪烁的赛博柴犬，忠诚可靠永远守护在你身边',
    stages: ['银蓝色机械蛋壳，偶尔发出轻微电流嗡嗡声', '橙色毛皮的柴犬幼崽，右耳和左前腿是金属义体，走路时蓝光一闪一闪', '四肢开始出现装甲，蓝紫色光带在关节处流动，尾巴末端带电磁光环', '深灰色机械装甲覆盖四肢和脊柱，黑色强化皮革躯干，眼神坚定', '全身透明机械装甲，胸腔内红蓝双色能量核心，四肢悬浮带电磁光环，终极形态'],
  },
  {
    poolId: 'pet_hamster', name: '小仓鼠', emoji: '🐹', rarity: 'N', personality: 'cheerful',
    spritePrefix: 'hamster',
    desc: '圆滚滚的金丝熊仓鼠，腮帮子永远鼓鼓的，三阶段进化为骑士仓鼠再到皇冠圣皇',
    stages: ['毛茸茸的圆形蛋，上面有小爪子印', '胖嘟嘟的小仓鼠，两颊永远塞着瓜子，呆萌可爱', '穿上了银色骑士盔甲的小勇士，手握小盾牌，萌帅萌帅的', '戴上金色皇冠的皇家仓鼠，周身环绕神圣光辉，威严又可爱', '圣皇仓鼠形态！金冠闪耀，脚踏光轮，真正的仓鼠王者降临！'],
  },
  {
    poolId: 'pet_corgi', name: '小柯基', emoji: '🐶', rarity: 'N', personality: 'energetic',
    spritePrefix: 'corgi',
    desc: '屁股扭扭的小短腿柯基，活力满满永远跑在你前面，三阶段从奶基进化到皇家护卫犬',
    stages: ['一颗圆滚滚的白棕色蛋，像个小土豆', '奶萌奶萌的柯基幼崽，小短腿哒哒跑，耳朵立得像雷达', '穿上红色披风的帅气柯基，眼神坚毅，随时准备守护主人', '身披金色铠甲的皇家护卫柯基，短腿也能走出王者步伐！', '传奇柯基王！全身金甲加冕，屁股扭出王者风范！'],
  },
  // === R级 稀有 ===
  {
    poolId: 'pet_fox', name: '银月狐', emoji: '🦊', rarity: 'R', personality: 'wise',
    spritePrefix: 'fox',
    desc: '月夜中毛发泛着银色微光、九条尾巴如星河般流转的灵狐，智慧与神秘并存',
    stages: ['月白色的蛋，表面有星点银光在缓缓移动', '白狐幼崽，额生月印记，蓝银色尾光', '月纹灵狐，六尾舒展流淌银辉', '蓝银九尾天狐，周身环绕月华光环', '银月天狐，九尾化作银河长卷，眼中映出整个星空'],
  },
  {
    poolId: 'pet_butterfly', name: '冰晶灵蝶', emoji: '🦋', rarity: 'R', personality: 'mystic',
    spritePrefix: 'butterfly',
    desc: '由万年寒冰凝结而成的灵蝶，翅膀上的冰晶花纹蕴含着上古魔法，美丽而神秘',
    stages: ['一颗晶莹剔透的冰蓝色茧，内部隐约有光芒脉动', '破茧而出的冰晶小蝶，翅膀还微微透明，飞行时洒落细碎冰屑', '双翼完全展开，冰晶花纹流转，周围空气都因它而降温', '灵蝶完全体！六翼冰晶绽放，所过之处霜花盛开，美得令人屏息', '传说级的冰皇灵蝶！双翼覆盖整个天空，每一片冰晶都是一道魔法符文！'],
  },
  {
    poolId: 'pet_mantis', name: '战镰螳螂', emoji: '🦗', rarity: 'R', personality: 'fierce',
    spritePrefix: 'mantis',
    desc: '身披银色战甲的机械螳螂，双镰锋利无比，是战场上的收割者',
    stages: ['银色的卵鞘，表面有金属光泽和精密纹路', '初生的小螳螂，镰刀还很稚嫩但已露出凶悍气质', '战甲覆盖上半身的少年螳螂，双镰开始泛起冷光', '全副武装的战镰螳螂！银色甲壳流光溢彩，双镰可断钢铁', '终极猎杀者！全身纳米甲壳，双镰融合量子利刃，战场之王！'],
  },
  {
    poolId: 'pet_squirrel', name: '机械松鼠', emoji: '🐿️', rarity: 'R', personality: 'playful',
    spritePrefix: 'squirrel',
    desc: '半生物半机械的赛博松鼠，大大的眼睛闪烁着LED光芒，尾巴是螺旋推进器',
    stages: ['一个带有齿轮图案的小巧金属球', '毛茸茸的小松鼠，但耳朵尖和尾巴梢已经变成了金属部件', '半机械化的敏捷松鼠，尾巴可以当螺旋桨飞起来', '全机械改造完成！身体大部分被高科技甲壳覆盖，眼睛是HUD显示屏', '超级机械松鼠王！全身纳米科技，尾巴是等离子推进器，能以超音速穿梭！'],
  },
  {
    poolId: 'pet_kungfu', name: '功夫滚滚', emoji: '🐼', rarity: 'R', personality: 'calm',
    spritePrefix: 'kungfu',
    desc: '来自云巅武学的功夫熊猫，手持竹棍，气定神闲间蕴含着毁天灭地的力量',
    stages: ['一个画着太极图的竹笋状蛋', '戴着红色腰带的小熊猫宝宝，抱着比它还大的竹棍', '黑衣武者形态，手持青竹棍，眼神中透着武术家的沉稳', '脚踏祥云的大宗师，掌心凝聚着蓝色气劲，一招一式皆是绝学', '传说中的武神熊猫！周身环绕雷电与八卦阵，举手投足可开山裂石！'],
  },
  // === SR级 超稀有 ===
  {
    poolId: 'pet_toothless', name: '无牙仔', emoji: '🐉', rarity: 'SR', personality: 'tsundere',
    desc: '月光下鳞片泛出幽蓝光芒的夜翼龙，嘴里终于长出四颗小牙，脸上还带着得意的笑',
    stages: ['哑光黑色龙蛋，细小鳞片纹路，摸起来暖暖的，偶尔轻轻震动', '小小黑龙崽，耳朵像两片大叶子，没有牙却爱冲你龇嘴', '能扑腾翅膀飞一小段了，总是摔到地上拍拍翅膀假装没事', '暗黑鳞片，翠绿眼睛，翅膀完全展开，嘴里还是没有牙…', '月光下鳞片泛出幽蓝光芒，终于长出四颗小牙，得意地笑着'],
  },
  {
    poolId: 'pet_petal_fairy', name: '花瓣精灵', emoji: '🌸', rarity: 'SR', personality: 'gentle',
    spritePrefix: 'petal_fairy',
    desc: '由花瓣凝结而成的小精灵，头顶永远绽放着一朵温柔的花，所到之处花香四溢',
    stages: ['一颗半透明的花苞状蛋，表面有粉色光晕流转', '花瓣精灵幼崽，头戴花冠、身披花瓣裙，小翅膀扑闪扑闪', '裙摆绽放为多层花瓣，散发柔和光芒，周围飘落花瓣雨', '完全体！全身被金色花瓣铠甲包裹，头顶绽放巨大花冠'],
  },
  {
    poolId: 'pet_mecha_dragon', name: '机械翼龙', emoji: '🤖', rarity: 'SR', personality: 'tech',
    spritePrefix: 'mecha_dragon',
    desc: '来自未来的机械翼龙幼崽，银蓝色装甲上流淌着数据流光，胸口能量核永不熄灭',
    stages: ['一枚银蓝色的金属龙蛋，表面有发光的能量纹路', '机械翼龙幼崽，小翅膀是半透明的能量翼膜，眼睛是LED显示屏', '四肢覆盖精密机械甲壳，尾部带电磁尾翼，能短距离悬浮飞行', '终极形态！全覆式量子装甲，双翼展开呈全息投影状态，胸口核心爆发蓝色等离子光芒'],
  },
  {
    poolId: 'pet_abyssal_raven', name: '七彩乌鹊', emoji: '🦅', rarity: 'SR', personality: 'mysterious',
    spritePrefix: 'abyssal_raven',
    desc: '七彩羽毛闪耀如宝石的灵鹊，传说中带来好运的神鸟',
    stages: ['七彩光华闪烁的灵蛋，表面流转着虹彩纹路', '小灵鹊雏鸟，羽毛已透出七彩光泽，眼睛是两颗闪亮的紫宝石', '羽翼渐丰，七彩羽毛绚丽夺目，展翅时彩虹流光环绕', '七彩乌鹊成年！双翼展开如同彩虹瀑布，每片羽毛都折射出不同色彩'],
  },
  {
    poolId: 'pet_starpony', name: '星光小马', emoji: '🦄', rarity: 'SR', personality: 'dreamy',
    spritePrefix: 'starpony',
    desc: '梦幻紫粉渐变的小马驹，鬃毛和尾巴是星空般的蓝紫渐变，额头的星星印记蕴含着宇宙之力',
    stages: ['一颗淡紫色的小马蛋，表面有星点微光闪烁', '星光小马宝宝，紫粉色毛发配蓝紫渐变鬃毛，额头有一颗小星星印记', '毛发更加蓬松柔软，鬃毛开始泛出银河般的光泽，走路时蹄下有星尘', '完全体！周身环绕星云光环，额头的星星变成闪耀的星座印记，每一步踏出都是一道流星'],
  },
  // === SSR级 传说 ===
  {
    poolId: 'pet_lunar_king', name: '月相神王体', emoji: '🌕', rarity: 'SSR', personality: 'majestic',
    spritePrefix: 'lunar_king',
    desc: '以月光为躯、星辰为甲的远古神王，掌控月相盈亏之力，每一次现身都伴随天地变色',
    stages: ['一颗散发着银白月光的球形蛋，表面有月相纹路缓缓流转', '月相幼体，半透明银白身躯中可见星辰运转，目光所及之处月华倾泻', '月相成长体！银甲覆身，身后浮现残月虚影，举手投足间引力波动', '月相神王完全体！全身化为流动月华，脚踏虚空，月相轮转于身后'],
  },
  {
    poolId: 'pet_star_beast', name: '星光影海兽', emoji: '✨', rarity: 'SSR', personality: 'enigmatic',
    spritePrefix: 'star_beast',
    desc: '游弋于星际影海之间的远古巨兽，身体由凝固的星光构成，可以穿梭于不同维度',
    stages: ['一颗内部有微缩星系旋转的透明蛋，散发着柔和的星云光芒', '星光幼兽，半流体身躯中星光闪烁，尾巴划过空气留下星尘轨迹', '影海成长体！身躯更加凝实，可以短暂隐入影子空间再从另一处现身', '星光影海完全体！身躯化为璀璨银河，可自由穿梭维度之间'],
  },
  {
    poolId: 'pet_ghost_cat', name: '幽灵月夜猫', emoji: '👻', rarity: 'SSR', personality: 'ethereal',
    spritePrefix: 'ghost_cat',
    desc: '只在月圆之夜现世的幽灵猫咪，半透明的身体飘浮在空中，能看见常人看不到的东西',
    stages: ['一颗飘浮在半空中的淡紫色蛋，透过外壳可以看到内部有幽灵般的微光在游动', '幽灵小猫，半透明紫色身体，大眼睛发出幽光，走路时脚下有小灵魂飘动', '月夜猫成长体！尾巴分裂为三条幽灵尾，可以穿过任何物体', '幽灵月夜猫完全体！全身化为紫色幽光，三尾如灵魂丝带飘舞，可以召唤月之结界'],
  },
  {
    poolId: 'pet_lunala_beast', name: '露奈雅来兽', emoji: '🌙', rarity: 'SSR', personality: 'cosmic',
    spritePrefix: 'lunala_beast',
    desc: '来自平行宇宙的月之使者，翅膀展开时如同新月，吸收月光转化为毁灭性的能量',
    stages: ['一颗散发暗紫色新月光芒的蛋，内部隐约有翅膀形状的影子在旋转', '露奈雅来幼体，暗紫色身躯配新月形翅膀，眼睛是两颗旋转的小星星', '月之使者成长体！翅膀完全展开如同弯月，可以释放月之射线', '露奈雅来完全体！全身被宇宙能量包裹，双翼展开如同满月降临'],
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
  // 每分钟衰减量（1:1现实时速，关网页不掉）
  // 学生每天最多用1小时，4-5天不管才哭，正常用无压力
  hunger: 0.3,       // 每小时掉18，5天不管到哭泣线
  cleanliness: 0.35,  // 每小时掉21，4天不管到哭泣线
  energy: 0.15,       // 活力自然恢复（答题消耗-2，恢复0.075/min）
  intimacy: -0.02,    // 缓慢下降，答题加亲密可覆盖
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
// ============================================================
//  每只宠物专属对话（不同性格、不同说话风格）
//  getDialogue(type, petType) — petType决定用哪只宠物的对话
// ============================================================
const PET_DIALOGUE_TEMPLATES = {
  // === 🐱 小橘猫（活泼可爱、吃货属性） ===
  pet_kitten: {
    hungry: ['喵喵~肚子饿扁了！🐟', '小鱼干在哪里？快给我找！', '喵呜...再不喂我就咬你了哦~😼', '饭点到了吗？本喵的胃等不及了！'],
    dirty: ['毛毛打结了...好难受喵...', '我是不是变脏脏了？不想当脏猫！🛁', '帮我梳梳毛嘛主人~', '嗯...身上痒痒的...要洗澡澡！'],
    tired: ['喵...哈欠...眼皮打架了💤', '让橘猫大人睡一会儿...', 'Zzz...梦见小鱼干了...', '困了困了，趴一会儿~'],
    sad: ['你都不理我...坏蛋！😿', '一个人玩好无聊...来陪我嘛', '你今天是不是不爱我了？😢', '喵呜...好想被抱抱'],
    happy: ['嘿嘿！今天也是元气满满的一天喵！✨', '主人最棒啦！奖励你一个蹭蹭！💕', '和主人在一起就是最幸福的时光喵~', '喵哈哈！开心得想转圈圈！'],
    levelUp: ['哇！本喵进化了！更可爱了有木有！🔥', '升级啦！以后可以吃更多小鱼干了！', '喵喵喵！我变强了耶！！⭐'],
    fed: ['好吃好吃！再来一条鱼！😋', '唔~满足！橘猫大人满意了！', '味道棒极了！是最新鲜的吗？🐟', '嗝~吃饱了，谢谢投喂！'],
    cleaned: ['香喷喷的小猫咪~✨', '毛毛顺滑滑的好舒服！像丝绸一样！', '洗澡后感觉轻了5斤喵！', '现在是最干净最漂亮的橘猫！🧡'],
    rested: ['伸个大懒腰~精神满满！⚡', '睡得好香！尾巴都翘起来了！', '充满电了！准备好捣乱了喵~🎮', '醒啦醒啦！活力全开！'],
    tapped: ['喵？摸哪里呢~嘿嘿😆', '再挠一下下巴！对对就是那里！舒服~~', '呼噜呼噜~喜欢被摸头！', '喵~别停继续摸！'],
    correctAnswer: ['太棒了喵！主人答对了！🎉', '聪明的主人！奖励小鱼干一枚！', '又学到了新知识！本喵佩服！', '满分！主人果然是最厉害的！⭐'],
    wrongAnswer: ['没关系喵，失败乃成功之母！💪', '下次一定行！我相信主人！', '别灰心~我陪你一起加油喵！', '这道题有点难...我们一起想想？'],
    idle: ['今天的阳光真好~适合晒肚皮☀️', '在干嘛呢？快来陪我玩~', '喵~无聊...追个逗猫棒吧？', '(=￣ω￣=) 发呆中...', '哼着小曲儿~🎵 喵~♪'],
    morning: ['早上好呀喵！该起床晒太阳了！☀️', '早安~新的一天从撸猫开始！', '喵呜~早上的空气真好闻！'],
    night: ['晚安喵...做个有鱼的梦🌙', '月亮出来了...该钻被窝了~', '夜深了...主人早点休息哦💤'],
  },

  // === 🐶 紫电柴犬（赛博机械风、酷帅忠诚） ===
  pet_shiba: {
    hungry: ['能量不足...需要补充燃料⚡', '电池低电量模式...请求补给', '系统提示：饥饿指数超标', '汪！给点吃的！赛博狗也要吃饭！'],
    dirty: ['外壳积灰...清洁程序启动中🔧', '传感器灵敏度下降...需要维护', '装甲表面污损...影响美观', '检测到灰尘附着...请求清理'],
    tired: ['核心过热...进入休眠模式💤', '能量耗尽...待机充电中...', 'Zzz...系统休眠中...', '冷却系统启动...让我躺会儿'],
    sad: ['连接断开...孤独感上升😢', '检测不到主人在附近...不安', '信号微弱...请靠近我一点', '汪呜...没人陪的话就自动关机了'],
    happy: ['系统状态：超级开心！✨', '与主人同步率100%！最佳状态！', '任务完成！获得快乐值+999💕', '所有模块运转正常！心情绝佳！'],
    levelUp: ['系统升级完成！性能提升50%！🔥', '装甲强化完毕！进入新阶段！', '进化成功！新功能已解锁！⭐', '硬件升级！战斗力MAX！'],
    fed: ['燃料补充完毕！能量满格！😋', '美味数据已录入！感谢投喂！', '消化系统高效运转！味道不错！🍖', '能量块接收成功！'],
    cleaned: ['自洁程序执行完毕✨', '表面抛光完成！焕然一新！', '装甲光泽度恢复100%！', '清洁度优化！完美状态！🛁'],
    rested: ['休眠结束！满血复活！⚡', '充电完成！准备执行任务！', '系统重启完毕！一切正常！🎮', '冷却完毕！随时待命！'],
    tapped: ['触觉传感器激活！舒服~😆', '头部抚摸模式...运行中...', '汪！再来一下！检测到愉悦信号！', '好感度上升！请继续操作！'],
    correctAnswer: ['分析结果：完全正确！🎉', '逻辑判定：主人智商超高！', '数据处理：优秀答案！⭐', '评估通过！完美解答！'],
    wrongAnswer: ['错误检测：但可修正！💪', '重试建议：下次一定能行！', '系统提示：不要放弃！继续尝试！', '调试模式：一起找到正确答案！'],
    idle: ['扫描周围环境...安全✓', '待机中...等待指令输入', '自检程序运行中...一切正常', '环境监测：天气晴朗☀️', '后台任务：思考狗狗的人生意义...'],
    morning: ['晨间唤醒序列启动！☀️', '早安！今日任务：开心度过每一天！', '系统自检完毕！新的一天开始！'],
    night: ['夜间节能模式启动🌙', '进入低功耗待机...晚安汪', '休眠倒计时...明天见主人~'],
  },

  // === 🦊 银月狐（神秘优雅、灵性智慧） ===
  pet_fox: {
    hungry: ['月影渐淡...需要补充灵力🌙', '三尾之力在减弱...请赐予食物', '灵狐饿了...连月光都看不清晰了', '咕噜...不是我在叫，是肚子在念咒'],
    dirty: ['银色毛发蒙尘...灵力受阻🌫️', '月之光辉无法照耀...需净化', '我的尾巴...不再闪闪发光了', '这身银装...不该染上尘埃'],
    tired: ['灵力耗尽...需沉入月之梦💤', '三尾垂下...让我小憩片刻', '月光之下...最适合安眠', '眼皮沉重如山...'],
    sad: ['月蚀之日...心绪黯淡😢', '孤月独照...无人共语', '灵狐之泪...化作露珠', '你在远方...我能感知到你的寂寞'],
    happy: ['月圆之夜...喜悦满溢✨', '银辉洒落...与你共享此情', '三尾摇曳...幸福如潮汐💕', '月之祝福...今日大吉！'],
    levelUp: ['月华淬炼...灵力觉醒！🔥', '九尾之路...更进一步！', '月神庇佑...进化成功！⭐', '灵力涌动...突破境界！'],
    fed: ['灵食入腹...温润如玉😋', '月光般的美味...感激不尽', '力量在体内流淌...多谢款待', '此味...唯有月下可尝'],
    cleaned: ['月之洗礼...洁净如初✨', '银发重光...清冽如泉', '净化完成...灵力通畅', '沐浴月光...身心皆净🛁'],
    rested: ['月之梦醒...灵台清明⚡', '沉眠于星辉之中...精神饱满', '三尾舒展...蓄势待发', '灵力充盈...准备施展幻术🎮'],
    tapped: ['嗯~灵狐之耳敏感异常😆', '轻抚吾首...甚悦', '三尾轻摆...表达欢喜', '此触感...如沐月光'],
    correctAnswer: ['慧眼识真...答得漂亮！🎉', '灵犀相通...主人才华横溢', '月之智慧...与你同在⭐', '妙答！不愧是我选择的主人！'],
    wrongAnswer: ['莫愁...月有阴晴圆缺💪', '暂时的迷雾...终会散去', '灵狐指引...下次定能破局', '不必气馁...月会再次圆满'],
    idle: ['静观星象...预测今日运势☀️', '月下独思...人生如梦', '摆弄尾尖...打发时间~', '(◕‿◕) 月色真美...', '吟唱古老歌谣...🎵'],
    morning: ['晨曦破晓...月隐星藏☀️', '早安...愿今日月华常伴', '黎明之狐...向主人问安'],
    night: ['月升东方...是狐的时辰🌙', '入夜了...让我为你守夜', '晚安...愿你梦中有月相伴'],
  },

  // === 🐉 无牙仔（呆萌小龙、憨厚可爱） ===
  pet_toothless: {
   饥饿: ['咕...肚子在叫龙吟了！🐟', '没有牙也要吃东西！快给我！', '饿龙出洞！目标：食物！', '嗷...我想吃烤肉...'],
    dirty: ['身上黏糊糊的...不舒服🛁', '鳞片都粘住了...要洗白白', '我是干净的龙！不能这么脏！', '呃...有点臭臭的...'],
    tired: ['嗷...眼睛睁不开...💤', '小龙需要冬眠了...', '让我趴一会儿...就一会儿...', '哈欠打得下巴都要掉了...'],
    sad: ['嗷呜...你不爱无牙仔了吗😢', '没有牙齿就已经很惨了...还不理我', '一个人在洞穴里好孤单...', '主人...回来陪我玩嘛'],
    happy: ['嗷嗷嗷！今天超开心的！✨', '虽然没有牙但我笑得很灿烂！💕', '主人对我最好了！爱你哟！', '开心得想喷火！但是没有火...'],
    levelUp: ['哇啊啊！我长牙了吗？！🔥', '进化了进化了！虽然还是没牙...', '升级啦！我现在是大龙了！！⭐', '变强了！可以保护主人了！'],
    fed: ['好好吃！啊呜一口吞！😋', '虽然没有牙但嚼得很快！', '满足！再来一份！', '嗝~龙式饱腹感！'],
    cleaned: ['洗白白啦！ shiny shiny! ✨', '鳞片都在发光！亮瞎眼！', '现在是最帅的龙！虽然没牙', '好清爽！感觉能飞起来！🛁'],
    rested: ['睡得好香！流口水了都⚡', '充满龙力了！嗷嗷嗷！', '醒啦！准备大闹一场！🎮', '休息好了！满血复活！'],
    tapped: ['嘿！摸头的时候小心我的角！😆', '再摸一下！这里这里！舒服~', '嗷呵呵~好痒但也好玩', '龙的逆鳞被摸到了...但是很开心'],
    correctAnswer: ['嗷嗷嗷！主人答对了！厉害！🎉', '太牛了！不愧是我的主人！', '正确答案！给你龙之吻！💋', '满分！无牙仔为你骄傲！⭐'],
    wrongAnswer: ['没关系的嗷...下次一定能对！💪', '别难过...无牙仔陪你重新来！', '失败只是暂时的！龙不怕失败！', '我们一起想办法嗷~'],
    idle: ['嗷...今天干点啥呢☀️', '无聊...数数我有几颗牙...0颗', '发呆中...想象自己长了牙', '翻个身...嗷~', '哼着龙族歌谣~🎵'],
    morning: ['早上好嗷！太阳出来了我醒了☀️', '早安！今天也要开开心心的！', '嗷~起床啦！新的一天！'],
    night: ['晚安嗷...做个有牙的梦🌙', '月亮出来了...龙也要睡觉了', '夜深了...主人晚安哦~💤'],
  },
};

// 默认对话（兜底，用于未知宠物类型）
export const PET_DIALOGUES = PET_DIALOGUE_TEMPLATES.pet_kitten;

/**
 * 获取宠物对话 — 支持每只宠物独特风格
 * @param {string} type - 对话类型 (hungry/happy/tapped/...)
 * @param {string} petType - 宠物poolId (pet_kitten/pet_shiba/pet_fox/pet_toothless)
 */
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

export function getDialogue(type, petType = null) {
  const dialogues = petType ? (PET_DIALOGUE_TEMPLATES[petType] || PET_DIALOGUES) : PET_DIALOGUES
  return pick(dialogues[type] || dialogues.idle)
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
  // ★ 上帝模式跳过价格检查
  if (!state._isGodMode && (state.exp || 0) < acc.price) return state;
  
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

// buyItem: 价格检查由调用方（handleShopAction）负责，这里只管入库
export function buyItem(state, itemId) {
  const item = SHOP_ITEMS.find(i => i.id === itemId);
  if (!item) return state;

  const inv = { ...state.inventory };
  if (item.kind === 'food') inv.foods = { ...inv.foods, basic: (inv.foods?.basic || 0) + 1 };
  else if (item.kind === 'clean') inv.cleanItems = (inv.cleanItems || 0) + 1;
  else if (item.kind === 'energy') inv.energyItems = (inv.energyItems || 0) + 1;
  else if (item.kind === 'gift') inv.giftItems = (inv.giftItems || 0) + 1;
  else if (item.kind === 'card') inv.cards = (inv.cards || 0) + 1;

  return { ...state, inventory: inv };
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
    level: 999,              // ★ 人物经验满级
    exp: 999999,            // ★ 经验≈无限（花钱用不完）
    totalStars: 9999,
    coins: 99999,
    petPool: PET_POOL,
    ownedPets: ['pet_kitten', 'pet_shiba', 'pet_hamster', 'pet_corgi', 'pet_fox', 'pet_butterfly', 'pet_mantis', 'pet_squirrel', 'pet_kungfu', 'pet_toothless', 'pet_petal_fairy', 'pet_mecha_dragon', 'pet_abyssal_raven', 'pet_starpony', 'pet_lunar_king', 'pet_star_beast', 'pet_ghost_cat', 'pet_lunala_beast'],  // 17只全解锁
    currentPet: {
      poolId: 'pet_kitten',   // 默认小橘猫
      level: 3,               // ★ 宠物初始低级（你可以用无限经验自己升级，观察每个阶段状态）
      exp: 0,                 // ★ 宠物经验从0开始
      mood: 'happy',
      tapCount: 0,
      stats: { hunger: 100, cleanliness: 100, energy: 100, intimacy: 100 },
      equippedAccessories: {},  // ★ 不预装备配饰（你自己去装备/卸下测试）
      lastAction: null,
      lastFeedTime: Date.now(),
    },
    dailyTasks: initDailyTasks(),
    dailyLastResetDate: new Date().toDateString(),
    taskCounters: {
      learnCount: 0,
      feedCount: 0,
      interactCount: 0,
      streakCount: 0,
    },
    achievements: [],
    inventory: {
      foods: { basic: 999, advanced: 999, gourmet: 999, superGourmet: 999 },  // ★ 道具无限
      cleanItems: 999,
      energyItems: 999,
      giftItems: 999,
      cards: 999,             // ★ 抽卡券无限
      accessories: ALL_ACCESSORIES,
    },
    settings: { soundEnabled: true, notificationsEnabled: true },
    totalLearnQuestions: 0,   // ★ 从0开始（真实体验）
    totalCorrectAnswers: 0,
    daysActive: 365,
    lastActiveDate: new Date().toDateString(),
    friends: [],
    pendingEncouragements: [],
    weeklyQuestions: 0,
    weeklyResetDate: new Date().toISOString().slice(0, 10),
    // 游戏系统 — ★ 次数无限
    gameState: {
      dailyAttempts: 999999,
      dailyGameDate: new Date().toDateString(),
      wordCannonHighScore: 0,
      totalBubblesCleared: 0,
      maxCombo: 0,
    },
    titles: ['beginner','hundred_q','vocab_star','grammar_master','cannon_newbie','cannon_elite','combo_king','week_warrior'],
    activeTitle: 'cannon_elite',
    
    // 小屋系统
    roomTheme: 'aurora',
    ownedRoomThemes: ['starlight','forest','city','aurora','volcano'],
    
    // 游戏背包 — 无限道具
    ownedFurniture: FURNITURE_ITEMS.map(f => f.id),
    gameInventory: {
      time_freeze: 999,
      shield_potion: 999,
    },

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
    totalDraws: 0,           // 累计抽卡次数（方案B驱动）
    pityCount: 0,            // 保底计数（连续未出SR次数）
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

    // 游戏系统
    gameState: {
      dailyAttempts: 3,
      dailyGameDate: new Date().toDateString(),
      wordCannonHighScore: 0,
      totalBubblesCleared: 0,
      maxCombo: 0,
    },
    titles: ['beginner'],
    activeTitle: 'beginner',
    roomTheme: null,
    ownedRoomThemes: [],
    gameInventory: {},
    ownedFurniture: [],
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

  // 使用新的经验计算方式，但不自动升级
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

  // 答题影响宠物属性（活力消耗+亲密度变化）
  // 注意：宠物成长经验通过共享池模式统一管理（totalXP - petExpConsumed）
  // 不在此处单独维护 currentPet.exp 字段，避免双轨制混乱
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
  // ★ 上帝模式跳过经验阈值检查
  if (!state._isGodMode && state.exp < currentThreshold) {
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
function feedPet(state) {
  const pet = { ...state.currentPet };
  // 喂食不加宠物经验！宠物经验只来源于每日任务和每日答题
  
  const stats = { ...(pet.stats || defaultStats()) };
  stats.hunger = clamp(stats.hunger + 15, 0, 100); // 喂养增加饱食度
  
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
//  抽卡系统 v2 - 三档保底 + 等级加成
// ============================================================
// 稀有度等级：N < R < SR < SSR < XR
// 保底阈值：SR保底20抽，SSR保底50抽，XR保底100抽
// 基础概率（极低概率，体现稀有性）：
//   XR: 0.01%  SSR: 0.1%  SR: 1%  R: 27%  N: ~71.89%
// 等级加成（每10级）：SR+0.1%  SSR+0.02%  XR+0.005%

const PITY_SR  = 20;   // 20抽未出SR+ → 必出SR
const PITY_SSR = 50;   // 50抽未出SSR+ → 必出SSR
const PITY_XR  = 100;  // 100抽未出XR → 必出XR

// 按稀有度分桶（方便随机抽取）
const POOL_BY_RARITY = {
  N:   PET_POOL.filter(p => p.rarity === 'N'),
  R:   PET_POOL.filter(p => p.rarity === 'R'),
  SR:  PET_POOL.filter(p => p.rarity === 'SR'),
  SSR: PET_POOL.filter(p => p.rarity === 'SSR'),
  XR:  PET_POOL.filter(p => p.rarity === 'XR'),
};

/**
 * 根据玩家等级计算本次抽卡各稀有度的概率
 * @param {number} level - 宠物当前等级（等级越高概率略高）
 */
function getRarityProbs(level = 1) {
  const lvBonus = Math.floor((level - 1) / 10);
  const xr  = 0.0001 + lvBonus * 0.00005;   // XR 基础0.01%，每10级+0.005%
  const ssr = 0.001 + lvBonus * 0.0002;     // SSR 基础0.1%，每10级+0.02%
  const sr  = 0.01 + lvBonus * 0.001;       // SR 基础1%，每10级+0.1%
  const r   = 0.27;
  const n   = Math.max(0, 1 - xr - ssr - sr - r);
  return { xr, ssr, sr, r, n };
}

/**
 * 根据概率随机选一个稀有度
 */
function rollRarity(probs) {
  const rand = Math.random();
  if (rand < probs.xr)  return 'XR';
  if (rand < probs.xr + probs.ssr) return 'SSR';
  if (rand < probs.xr + probs.ssr + probs.sr) return 'SR';
  if (rand < probs.xr + probs.ssr + probs.sr + probs.r) return 'R';
  return 'N';
}

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
  // ★ 上帝模式：永远有"免费券"
  if (state?._isGodMode) return true;
  return state && state.hasReceivedFreeCard && !state.freeCardUsed;
}

function drawCard(state, opts = {}) {
  // 免费券（首次赠送）或 背包卡券（已花钱买，不扣经验）
  const isFree = opts.fromTicket || (!state.freeCardUsed && state.hasReceivedFreeCard);

  // ★ 上帝模式：始终免费
  if (!isFree && !state._isGodMode && (state.exp || 0) < 500)
    return { state, pet: null }; // 经验不足

  const totalDraws = (state.totalDraws || 0) + 1;
  const curLevel   = state.currentPet?.level || 1;

  // ── 三档保底计数（各自独立）──
  const pitySR  = (state.pitySR  || 0) + 1; // 距上次 SR+ 的抽数
  const pitySSR = (state.pitySSR || 0) + 1; // 距上次 SSR+ 的抽数
  const pityXR  = (state.pityXR  || 0) + 1; // 距上次 XR 的抽数

  // ── 决定本次稀有度 ──
  let rarity;
  if (pityXR >= PITY_XR) {
    rarity = 'XR';                          // 100抽保底 XR
  } else if (pitySSR >= PITY_SSR) {
    rarity = 'SSR';                         // 50抽保底 SSR
  } else if (pitySR >= PITY_SR) {
    rarity = 'SR';                          // 20抽保底 SR
  } else {
    const probs = getRarityProbs(curLevel);
    rarity = rollRarity(probs);
  }

  // ── 从对应稀有度随机选一只宠物 ──
  const bucket = POOL_BY_RARITY[rarity] || POOL_BY_RARITY['N'];
  const petInfo = bucket[Math.floor(Math.random() * bucket.length)];
  const finalChosen = petInfo.poolId;

  // ── 更新保底计数（出了高稀有度，低档保底同时重置）──
  const rarityRank = { N: 0, R: 0, SR: 1, SSR: 2, XR: 3 };
  const rank = rarityRank[rarity] || 0;
  const newPitySR  = rank >= 1 ? 0 : pitySR;   // SR+ 出了就重置SR保底
  const newPitySSR = rank >= 2 ? 0 : pitySSR;  // SSR+ 出了就重置SSR保底
  const newPityXR  = rank >= 3 ? 0 : pityXR;   // XR 出了就重置XR保底

  const owned = Array.isArray(state.ownedPets) ? [...state.ownedPets] : [];
  if (!owned.includes(finalChosen)) owned.push(finalChosen);

  const newState = {
    ...state,
    // ★ 上帝模式/背包卡券/首次赠送：不扣经验
    exp: (isFree || state._isGodMode) ? state.exp : state.exp - 500,
    ownedPets: owned,
    currentPet: { poolId: finalChosen, level: 1, exp: 0, mood: 'neutral', tapCount: 0, stats: defaultStats(), equippedAccessories: {} },
    freeCardUsed: true,
    totalDraws,
    // 旧字段兼容（部分界面读 pityCount 显示进度）
    pityCount: newPitySR,
    pitySR: newPitySR,
    pitySSR: newPitySSR,
    pityXR: newPityXR,
  };

  return { state: newState, pet: petInfo };
}

/**
 * 卖掉一只重复宠物 → 获得250宠物成长经验
 *
 * 规则：
 * - 不能卖当前出战的宠物（currentPet）
 * - 只能卖重复的宠物（同类型有2只以上）
 * - 卖后获得 250 宠物成长经验（petExp）
 * - 经验直接加到宠物可支配经验池中
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

  // 奖励：250宠物成长经验
  const currentPetExp = state.petExp || 0;

  return {
    state: {
      ...state,
      ownedPets: newOwned,
      petExp: currentPetExp + 250,  // 直接加到宠物经验池
    },
    success: true,
    reward: 250,  // 返回奖励数量供UI显示
  };
}
function getCurrentPet(state) { return state.currentPet; }
function getPetPool(state) { return state.petPool; }

// ============================================================
//  🏠 宠物小屋系统
// ============================================================
export const ROOM_THEMES = [
  { id: 'starlight', name: '✨ 星空小屋', price: 200, rarity: 'N',
    desc: '深邃星空背景，萤火虫飞舞',
    bg: 'linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    floor: '#1a1a2e',
    accentColor: '#ffd700' },
  { id: 'forest', name: '🌲 森林小屋', price: 300, rarity: 'R',
    desc: '阳光穿过树叶的自然空间',
    bg: 'linear-gradient(180deg, #134e5e 0%, #71b280 100%)',
    floor: '#5d4037',
    accentColor: '#81c784' },
  { id: 'city', name: '🌆 赛博城市', price: 400, rarity: 'R',
    desc: '霓虹灯闪烁的未来都市',
    bg: 'linear-gradient(180deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
    floor: '#2d132c',
    accentColor: '#00fff5' },
  { id: 'aurora', name: '🌌 极光幻境', price: 600, rarity: 'SR',
    desc: '北极光照耀的冰原世界',
    bg: 'linear-gradient(180deg, #00c9ff 0%, #92fe9d 100%)',
    floor: '#e0f7fa',
    accentColor: '#e040fb' },
  { id: 'volcano', name: '🌋 火山熔岩', price: 800, rarity: 'SR',
    desc: '炽热岩浆流淌的地下城',
    bg: 'linear-gradient(180deg, #1f0000 0%, #4a0404 50%, #8b0000 100%)',
    floor: '#2d1010',
    accentColor: '#ff5722' },
];

// ============================================================
//  🛋️ 小屋家具数据
// ============================================================
export const FURNITURE_ITEMS = [
  // 墙面装饰（挂在上方）
  { id: 'wall_window',    name: '小窗户', icon: '🪟', price: 80,  kind: 'furniture', zone: 'wall', pos: { top: '14%', left: '8%'  }, fontSize: 28 },
  { id: 'wall_bookshelf', name: '小书架', icon: '📚', price: 120, kind: 'furniture', zone: 'wall', pos: { top: '10%', right: '8%' }, fontSize: 28 },
  { id: 'wall_clock',     name: '挂钟',   icon: '🕐', price: 100, kind: 'furniture', zone: 'wall', pos: { top: '8%',  left: '42%' }, fontSize: 24 },
  { id: 'wall_trophy',    name: '奖杯',   icon: '🏆', price: 150, kind: 'furniture', zone: 'wall', pos: { top: '14%', right: '20%'}, fontSize: 24 },
  // 地板装饰（放在地板上）
  { id: 'floor_plant',    name: '小绿植', icon: '🌿', price: 60,  kind: 'furniture', zone: 'floor', pos: { bottom: '30px', left: '6%'  }, fontSize: 30 },
  { id: 'floor_ball',     name: '玩具球', icon: '⚽', price: 50,  kind: 'furniture', zone: 'floor', pos: { bottom: '30px', left: '24%' }, fontSize: 24 },
  { id: 'floor_chair',    name: '小椅子', icon: '🪑', price: 90,  kind: 'furniture', zone: 'floor', pos: { bottom: '30px', right: '6%' }, fontSize: 28 },
  { id: 'floor_teddy',    name: '玩具熊', icon: '🧸', price: 70,  kind: 'furniture', zone: 'floor', pos: { bottom: '30px', right: '22%'}, fontSize: 26 },
  { id: 'floor_rug',      name: '小地毯', icon: '🟤', price: 110, kind: 'furniture', zone: 'floor', pos: { bottom: '28px', left: '38%' }, fontSize: 22 },
];

// 游戏相关商店物品
export const GAME_SHOP_ITEMS = [
  { id: 'extra_play', name: '额外游戏次数', icon: '🎮', price: 50,
    desc: '+1次炮台游戏机会', kind: 'game_item' },
  { id: 'time_freeze', name: '时间冻结', icon: '❄️', price: 100,
    desc: '游戏中冻结所有气泡5秒', kind: 'game_consumable', maxStack: 5 },
  { id: 'shield_potion', name: '护盾药水', icon: '🛡️', price: 120,
    desc: '下次答错不扣血', kind: 'game_consumable', maxStack: 5 },
];

// ============================================================
//  🏅 称号系统（自动解锁，不可购买）
// ============================================================
export const TITLE_DEFINITIONS = [
  { id: 'beginner', name: '初学者 🌱', condition: (s) => true, hidden: false, desc: '欢迎来到汉字星球！' },
  { id: 'hundred_q', name: '百题达人 📚', condition: (s) => (s.totalLearnQuestions || 0) >= 100, hidden: false, desc: '答题超过100道' },
  { id: 'vocab_star', name: '词汇新星 ⭐', condition: (s) => (s.totalCorrectAnswers || 0) >= 100, hidden: false, desc: '英语词汇量突破100' },
  { id: 'grammar_master', name: '语法高手 🔷', condition: (s) => {
    const total = s.totalLearnQuestions || 0;
    const correct = s.totalCorrectAnswers || 0;
    return total >= 20 && (correct / total) > 0.8;
  }, hidden: false, desc: '语法正确率超过80%' },
  { id: 'cannon_newbie', name: '炮台新手 🎯', condition: (s) => (s.gameState?.wordCannonHighScore || 0) > 0, hidden: false, desc: '首次完成炮台游戏' },
  { id: 'cannon_elite', name: '炮台精英 🏆', condition: (s) => (s.gameState?.wordCannonHighScore || 0) >= 500, hidden: false, desc: '炮台游戏高分破500' },
  { id: 'combo_king', name: '连击王者 🔥', condition: (s) => (s.gameState?.maxCombo || 0) >= 5, hidden: false, desc: '单局达成5连击' },
  { id: 'week_warrior', name: '坚持一周 📅', condition: (s) => (s.daysActive || 0) >= 7, hidden: false, desc: '连续活跃7天' },
  { id: 'lucky_one', name: '欧皇附体 🎰', condition: (s) => s._gotLuckyDraw === true, hidden: true, desc: '单次抽卡直接出SR以上！（隐藏称号）' },
];

// 计算已解锁的称号列表
export function computeUnlockedTitles(state) {
  return TITLE_DEFINITIONS.filter(t => t.condition(state)).map(t => t.id);
}

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