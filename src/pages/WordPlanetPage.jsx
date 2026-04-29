import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { storage, updateStreak } from '../utils/storage'
import { updateSRS, toQuality, isDue } from '../utils/srs'
import { syncAfterSession } from '../utils/sync'
import { speakEnglish as _speakEnglish } from '../utils/tts'
import wordsNetwork from '../data/words_network_j2.json'
import { shuffle } from '../utils/common'

// ─── 常量 ───────────────────────────────────────────────────────────────
const SESSION_SIZE = 10
const XP_CORRECT = 10

const CATEGORY_NAMES = {
  colour: '🎨 颜色',
  school: '🏫 学校',
  stationery: '✏️ 文具',
  numbers: '🔢 数字',
  family: '👨‍👩‍👧 家庭',
  body: '💪 身体',
  home: '🏠 家',
  clothes: '👕 衣物',
  time: '⏰ 时间',
  days: '📅 星期',
  months: '📆 月份',
  seasons: '🌸 季节',
  people: '👥 人物',
  shapes: '🔷 形状',
  food: '🍎 食物',
  fruit: '🍊 水果',
  nature: '🌿 自然',
  place: '📍 地点',
  animal: '🐾 动物',
  transport: '🚗 交通',
  sports: '⚽ 运动',
  verb: '🏃 动词',
  adjective: '⭐ 形容词',
  adverb: '💨 副词',
  weather: '🌤 天气',
  preposition: '📐 介词',
  direction: '🧭 方向',
  misc: '📦 其他',
  greeting: '👋 问候',
  response: '💬 回应',
}

// ─── TTS ──────────────────────────────────────────────────────────────────
function speakEnglish(text) {
  if (!text) return
  _speakEnglish(text)
}

// ─── 工具函数 ────────────────────────────────────────────────────────────
const allWords = Object.values(wordsNetwork.words)
const allWordsMap = wordsNetwork.words
const tier1Words = allWords.filter(w => w.tier === 1)


function randomFrom(arr, count, exclude = []) {
  const pool = arr.filter(x => !exclude.includes(x))
  return shuffle(pool).slice(0, count)
}

// ─── SRS 智能调度 ──────────────────────────────────────────────────────
function scheduleSessionWords(srsMap) {
  const pool = allWords

  // 分池：到期 / 新词 / 已复习未到期
  const due = pool.filter(wo => srsMap && isDue(srsMap[`j2_${wo.word}`]))
  const newCards = pool.filter(wo => !srsMap || !srsMap[`j2_${wo.word}`])
  const reviewed = pool.filter(wo => srsMap && srsMap[`j2_${wo.word}`] && !isDue(srsMap[`j2_${wo.word}`]))

  let selected = []
  const half = Math.ceil(SESSION_SIZE / 2)

  // 优先选到期词（最多一半）
  if (due.length > 0) {
    selected = selected.concat(shuffle(due).slice(0, half))
  }
  // 剩余从新词补
  if (selected.length < SESSION_SIZE && newCards.length > 0) {
    const need = SESSION_SIZE - selected.length
    selected = selected.concat(shuffle(newCards).slice(0, need))
  }
  // 还不够就从已复习的补
  if (selected.length < SESSION_SIZE && reviewed.length > 0) {
    const need = SESSION_SIZE - selected.length
    selected = selected.concat(shuffle(reviewed).slice(0, need))
  }

  // 按 category 分组（同类词聚在一起）
  const groups = {}
  for (const wo of selected) {
    const cat = wo.category || 'misc'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(wo)
  }
  return Object.values(groups).flat()
}

// ─── 去重工具：确保选项列表中无重复 ──────────────────────────────────
function dedupeOptions(answer, wrongPool, totalNeeded) {
  const seen = new Set([answer])
  const wrongs = []
  for (const opt of wrongPool) {
    if (wrongs.length >= totalNeeded - 1) break
    if (!seen.has(opt)) {
      seen.add(opt)
      wrongs.push(opt)
    }
  }
  return shuffle([answer, ...wrongs])
}

// ─── 题目生成 ─────────────────────────────────────────────────────────────
const QUESTION_TYPES = ['meaning_choice', 'trap_choice', 'association_fill', 'sentence_fill']

function buildQuestion(wordObj, idx) {
  const type = QUESTION_TYPES[Math.floor(idx / 5) % QUESTION_TYPES.length]

  if (type === 'meaning_choice') {
    // 答案：meaning；错误选项：confusables 的 meaning
    const confusableMeanings = (wordObj.confusables || [])
      .map(w => allWordsMap[w]?.meaning)
      .filter(Boolean)
    const sameCatMeanings = allWords
      .filter(w => w.category === wordObj.category && w.word !== wordObj.word)
      .map(w => w.meaning)
    const distractorPool = shuffle([...new Set([...confusableMeanings, ...sameCatMeanings])])
    const options = dedupeOptions(wordObj.meaning, distractorPool, 4)
    return {
      type,
      label: '认意思',
      question: `"${wordObj.word}" 是什么意思？`,
      speakText: wordObj.word,
      options,
      answer: wordObj.meaning,
      wordObj,
    }
  }

  if (type === 'trap_choice') {
    // 答案：该词本身；错误选项：confusables
    const confusables = (wordObj.confusables || []).filter(w => allWordsMap[w])
    const extraWords = randomFrom(
      allWords.filter(w => w.word !== wordObj.word && !(wordObj.confusables || []).includes(w.word)),
      Math.max(3 - confusables.length, 3)  // 多取一些，去重后可能不够
    ).map(w => w.word)
    const distractorPool = shuffle([...confusables, ...extraWords])
    const options = dedupeOptions(wordObj.word, distractorPool, 4)
    return {
      type,
      label: '找陷阱',
      question: `哪个单词的意思是"${wordObj.meaning}"？`,
      speakText: null,
      options,
      answer: wordObj.word,
      wordObj,
    }
  }

  if (type === 'association_fill') {
    // 答案：associations[0]；错误选项：随机无关词
    const correctAssoc = (wordObj.associations || [])[0] || wordObj.word
    const allOtherWords = shuffle(
      allWords
        .filter(w => !(wordObj.associations || []).includes(w.word) && w.word !== wordObj.word)
        .map(w => w.word)
    )
    const options = dedupeOptions(correctAssoc, allOtherWords, 4)
    return {
      type,
      label: '联想填词',
      question: `"${wordObj.word}" 可以联想到哪个词？`,
      speakText: wordObj.word,
      options,
      answer: correctAssoc,
      wordObj,
    }
  }

  // sentence_fill
  const blank = (wordObj.example || '').replace(
    new RegExp(`\\b${wordObj.word}\\b`, 'i'),
    '_____'
  )
  const sConfusables = (wordObj.confusables || []).filter(w => allWordsMap[w])
  const sExtraWords = randomFrom(
    allWords.filter(w => w.word !== wordObj.word && !(wordObj.confusables || []).includes(w.word)),
    Math.max(3 - sConfusables.length, 3)  // 多取一些，去重后可能不够
  ).map(w => w.word)
  const sDistractorPool = shuffle([...sConfusables, ...sExtraWords])
  const options = dedupeOptions(wordObj.word, sDistractorPool, 4)
  return {
    type,
    label: '例句填空',
    question: blank || `根据意思"${wordObj.meaning}"，选出正确单词：`,
    speakText: wordObj.example || null,
    options,
    answer: wordObj.word,
    wordObj,
  }
}

function buildQuestions(wordObj) {
  const questions = []
  // 根据索引生成不同类型题目
  for (let i = 0; i < 3; i++) {
    questions.push(buildQuestion(wordObj, i))
  }
  return questions
}

// ─── 音节分割 ─────────────────────────────────────────────────────────────
function splitSyllables(word) {
  const w = word.toLowerCase()
  const dict = {
    basketball: ['bas','ket','ball'], football: ['foot','ball'],
    volleyball: ['vol','ley','ball'], bedroom: ['bed','room'],
    classroom: ['class','room'], blackboard: ['black','board'],
    breakfast: ['break','fast'], watermelon: ['wa','ter','me','lon'],
    elephant: ['el','e','phant'], beautiful: ['beau','ti','ful'],
    computer: ['com','pu','ter'], umbrella: ['um','brel','la'],
    butterfly: ['but','ter','fly'], interesting: ['in','ter','est','ing'],
    different: ['dif','fer','ent'], important: ['im','por','tant'],
    remember: ['re','mem','ber'], together: ['to','geth','er'],
    understand: ['un','der','stand'], chocolate: ['choc','o','late'],
    strawberry: ['straw','ber','ry'], dictionary: ['dic','tion','ar','y'],
    september: ['sep','tem','ber'], november: ['no','vem','ber'],
    december: ['de','cem','ber'], february: ['feb','ru','ar','y'],
    morning: ['mor','ning'], evening: ['eve','ning'], afternoon: ['af','ter','noon'],
    birthday: ['birth','day'], garden: ['gar','den'], window: ['win','dow'],
    family: ['fam','i','ly'], animal: ['an','i','mal'], student: ['stu','dent'],
    teacher: ['teach','er'], mother: ['moth','er'], father: ['fa','ther'],
    brother: ['broth','er'], sister: ['sis','ter'], rabbit: ['rab','bit'],
    monkey: ['mon','key'], tiger: ['ti','ger'], table: ['ta','ble'],
    purple: ['pur','ple'], circle: ['cir','cle'], people: ['peo','ple'],
    little: ['lit','tle'], bottle: ['bot','tle'], apple: ['ap','ple'],
    environment: ['en','vi','ron','ment'], government: ['gov','ern','ment'],
    temperature: ['tem','per','a','ture'], experience: ['ex','pe','ri','ence'],
    comfortable: ['com','for','ta','ble'], vegetable: ['veg','e','ta','ble'],
    favorite: ['fav','or','ite'], yesterday: ['yes','ter','day'],
    tomorrow: ['to','mor','row'], together: ['to','geth','er'],
    afternoon: ['af','ter','noon'], everybody: ['ev','ery','body'],
    something: ['some','thing'], anything: ['any','thing'],
  }
  if (dict[w]) return dict[w]
  if (w.length <= 4) return [word]
  return [word]
}

const SYLLABLE_COLORS = ['text-blue-600', 'text-emerald-600', 'text-purple-600', 'text-orange-500']

function SyllableDisplay({ word }) {
  const syllables = splitSyllables(word)
  if (syllables.length <= 1) {
    return <span className="font-mono text-3xl font-extrabold text-gray-800">{word}</span>
  }
  return (
    <span className="font-mono text-3xl font-extrabold">
      {syllables.map((syl, i) => (
        <span key={i} className={SYLLABLE_COLORS[i % SYLLABLE_COLORS.length]}>
          {syl}{i < syllables.length - 1 ? <span className="text-gray-300">·</span> : ''}
        </span>
      ))}
    </span>
  )
}

// 带断词记忆法的显示（优先用 segmentation 字段）
function SegmentedDisplay({ word, segmentation }) {
  const seg = segmentation || ''
  if (!seg || seg === word) {
    return <SyllableDisplay word={word} />
  }
  const parts = seg.split('·')
  return (
    <span className="font-mono text-3xl font-extrabold">
      {parts.map((part, i) => (
        <span key={i} className={SYLLABLE_COLORS[i % SYLLABLE_COLORS.length]}>
          {part}{i < parts.length - 1 ? <span className="text-gray-300">·</span> : ''}
        </span>
      ))}
    </span>
  )
}

// ─── 外部词词典（关联词/易混词中引用但无完整词条的词） ───────────────
const EXTERNAL_WORD_MEANINGS = {
  // === 时间/日期 ===
  'sunset': '日落', 'sunrise': '日出', 'morning': '早晨', 'noon': '中午',
  'afternoon': '下午', 'midnight': '午夜', 'today': '今天', 'tomorrow': '明天',
  'yesterday': '昨天', 'weekend': '周末', 'weekday': '工作日',
  'January': '一月', 'February': '二月', 'March': '三月', 'April': '四月',
  'May': '五月', 'June': '六月', 'July': '七月', 'August': '八月',
  'September': '九月', 'October': '十月', 'November': '十一月', 'December': '十二月',
  'Monday': '星期一', 'Tuesday': '星期二', 'Wednesday': '星期三', 'Thursday': '星期四',
  'Friday': '星期五', 'Saturday': '星期六', 'Sunday': '星期日',
  'New Year': '新年', 'Christmas': '圣诞节', 'Easter': '复活节', 'Halloween': '万圣节',
  'Thanksgiving': '感恩节',
  // === 方位/地理 ===
  'west': '西', 'east': '东', 'north': '北', 'south': '南', 'center': '中心',
  'left': '左', 'right': '右', 'up': '上', 'down': '下', 'front': '前', 'back': '后',
  'inside': '里面', 'outside': '外面', 'nearby': '附近', 'farther': '更远',
  'China': '中国', 'English': '英语', 'Australia': '澳大利亚', 'Africa': '非洲',
  'Earth': '地球', 'Saturn': '土星', 'equator': '赤道', 'polar': '极地的',
  // === 人物/动物（非主词条） ===
  'cowboy': '牛仔', 'hero': '英雄', 'princess': '公主', 'king': '国王', 'angel': '天使',
  'fireman': '消防员', 'postman': '邮递员', 'dentist': '牙医', 'scientist': '科学家',
  'bunny': '兔子', 'hippo': '河马', 'kitten': '小猫', 'kitty': '猫咪', 'goat': '山羊',
  'donkey': '驴子', 'bull': '公牛', 'calf': '小牛', 'cub': '幼兽', 'crow': '乌鸦',
  // === 食物/饮料 ===
  'bananas': '香蕉(复)', 'cherries': '樱桃(复)', 'apples': '苹果(复)',
  'blueberry': '蓝莓', 'eggplant': '茄子', 'mangoes': '芒果(复)', 'tuna': '金枪鱼',
  'turkey': '火鸡', 'beer': '啤酒', 'cocoa': '可可', 'tea': '茶',
  'dessert': '甜点', 'dinner': '晚餐', 'breakfast': '早餐', 'lunch': '午餐',
  // === 服装/物品 ===
  'boot': '靴子', 'shoes': '鞋子(复)', 'sock': '袜子', 'sandal': '凉鞋',
  'cloths': '布料', 'mittens': '连指手套', 'costume': '戏服', 'gadget': '小器具',
  'coin': '硬币', 'doll': '洋娃娃', 'gem': '宝石', 'diamonds': '钻石(复)',
  // === 动词变形/相关 ===
  'act': '表演', 'beat': '打', 'blow': '吹', 'boil': '煮', 'borrow': '借入',
  'burn': '燃烧', 'bend': '弯曲', 'breathe': '呼吸', 'build': '建造',
  'carry': '搬运', 'carve': '雕刻', 'celebrate': '庆祝', 'charge': '收费',
  'cheat': '作弊', 'cheer': '欢呼', 'chose': '选择(过去式)', 'churn': '搅拌',
  'click': '点击', 'close': '关闭', 'collect': '收集', 'connect': '连接',
  'cook': '做饭', 'cooks': '烹饪(三单)', 'create': '创造', 'cross': '穿过',
  'crush': '压碎', 'discover': '发现', 'dive': '跳水', 'drive': '开车',
  'drink': '喝', 'earn': '赚取', 'enjoyed': '享受(过去式)', 'erase': '擦除',
  'excite': '使兴奋', 'feed': '喂养', 'feel': '感觉', 'fill': '填充',
  'find': '发现', 'finish': '完成', 'fit': '适合', 'fry': '油炸',
  'forgot': '忘记(过去式)', 'found': '找到(过去式)', 'fried': '油炸的',
  'give': '给', 'gave': '给(过去式)', 'greet': '问候', 'growl': '低吼',
  'hide': '隐藏', 'hunt': '狩猎', 'hiss': '发出嘶声', 'invent': '发明',
  'jingle': '叮当响', 'joke': '开玩笑', 'keep': '保持', 'kiss': '亲吻',
  'knew': '知道(过去式)', 'laugh': '笑', 'lead': '领导', 'lean': '倾斜',
  'leak': '泄漏', 'lift': '举起', 'live': '居住', 'load': '装载',
  'lose': '丢失', 'lost': '丢失(过去式)', 'move': '移动', 'moved': '移动(过去式)',
  'pick': '挑选', 'play': '玩', 'press': '按', 'protect': '保护',
  'pray': '祈祷', 'push': '推', 'pull': '拉', 'reach': '到达', 'read': '读',
  'repeat': '重复', 'retire': '退休', 'ride': '骑', 'roar': '咆哮',
  'rush': '冲', 'said': '说(过去式)', 'scale': '攀爬', 'scare': '吓唬',
  'scream': '尖叫', 'serve': '服务', 'set': '设置', 'show': '展示',
  'sing': '唱', 'skip': '跳过', 'solve': '解决', 'spell': '拼写',
  'spot': '发现', 'start': '开始', 'stay': '停留', 'stick': '粘住',
  'store': '存储', 'take away': '拿走', 'think': '想', 'thought': '想(过去式)',
  'travel': '旅行', 'treasure': '珍视', 'trick': '欺骗', 'tried': '尝试(过去式)',
  'use': '使用', 'want': '想要', 'went': '去(过去式)', 'whisper': '耳语',
  'widen': '变宽', 'worry': '担心', 'work': '工作', 'would': '会(过去式)',
  // === 形容词/副词 ===
  'abstract': '抽象的', 'adult': '成年的', 'alone': '单独的', 'certain': '确定的',
  'careful': '小心的', 'clear': '清楚的', 'close': '近的', 'colourful': '多彩的',
  'delicate': '精致的', 'difficult': '困难的', 'excellent': '优秀的',
  'excited': '兴奋的', 'experienced': '有经验的', 'extensive': '广泛的',
  'famous': '著名的', 'favorite': '最喜欢的', 'final': '最终的', 'fine': '好的',
  'finely': '精细地', 'finished': '完成的', 'glorious': '光荣的',
  'holy': '神圣的', 'ill': '生病的', 'likely': '可能的', 'lively': '活泼的',
  'lonely': '孤独的', 'loving': '充满爱的', 'mad': '疯狂的', 'medical': '医疗的',
  'medium': '中等的', 'messy': '凌乱的', 'middle': '中间的', 'multiple': '多个的',
  'nervous': '紧张的', 'noisy': '吵闹的', 'older': '更老的', 'oral': '口头的',
  'outdoor': '户外的', 'over': '结束/超过', 'poor': '贫穷的', 'ready': '准备好的',
  'social': '社会的', 'smart': '聪明的', 'some': '一些', 'spatial': '空间的',
  'steady': '稳定的', 'steep': '陡峭的', 'straight': '直的', 'strong': '强壮的',
  'such': '这样的', 'tough': '艰难的', 'true': '真实的', 'various': '各种的',
  'warm': '温暖的', 'wealthy': '富裕的', 'wide': '宽的', 'wild': '野生的',
  'grey': '灰色的', 'pink': '粉色的', 'violet': '紫色的',
  // === 名词（非主词条） ===
  'abstract': '抽象概念', 'addition': '增加', 'agriculture': '农业',
  'arena': '竞技场', 'arrow': '箭头', 'avenue': '大道', 'baggage': '行李',
  'bamboo': '竹子', 'bar': '酒吧', 'bath': '洗澡', 'battle': '战役',
  'bedtime': '睡前', 'birth': '出生', 'birthday': '生日', 'blank': '空白',
  'board': '木板', 'books': '书本(复)', 'born': '出生', 'bother': '麻烦',
  'bow': '鞠躬/弓', 'brain': '大脑', 'brake': '刹车', 'brass': '黄铜',
  'broom': '扫帚', 'brow': '眉毛', 'bucket': '水桶', 'bud': '花苞',
  'bush': '灌木丛', 'cab': '出租车', 'cabin': '小屋', 'cage': '笼子',
  'calendar': '日历', 'camp': '营地', 'candle': '蜡烛', 'case': '情况/箱子',
  'chance': '机会', 'charge': '收费', 'circus': '马戏团', 'citrus': '柑橘',
  'coach': '教练', 'coal': '煤炭', 'collar': '领圈', 'column': '柱子',
  'commuter': '通勤者', 'compute': '计算', 'cooker': '炊具',
  'cart': '手推车', 'carton': '纸箱', 'choice': '选择', 'cloth': '布',
  'clover': '三叶草', 'crush': '粉碎', 'cumber': '负担', 'date': '日期',
  'dear': '亲爱的', 'delivery': '递送', 'demand': '要求', 'demon': '恶魔',
  'dice': '骰子', 'diction': '措辞', 'dirt': '泥土', 'disk': '磁盘',
  'diver': '潜水员', 'drawer': '抽屉', 'drip': '滴落', 'eager': '渴望的',
  'easier': '更容易的', 'end': '末端', 'enemy': '敌人', 'entry': '入口',
  'envy': '嫉妒', 'error': '错误', 'ever': '曾经', 'every': '每个',
  'excuse': '借口', 'exited': '已退出', 'experience': '经验',
  'factor': '因素', 'feather': '羽毛', 'feeling': '感觉', 'feet': '脚(复)',
  'fellow': '家伙', 'fewer': '更少的', 'film': '电影', 'fin': '鳍',
  'flavour': '味道', 'food': '食物', 'forever': '永远', 'forth': '向前',
  'friends': '朋友(复)', 'from': '来自', 'front': '前面', 'fry': '炸薯条',
  'future': '未来', 'garlicky': '大蒜味的', 'glisten': '闪耀',
  'gold': '黄金', 'golf': '高尔夫', 'graph': '图表', 'grave': '坟墓',
  'greeting': '问候', 'growl': '低吼声', 'gum': '口香糖', 'gun': '枪',
  'habit': '习惯', 'ham': '火腿', 'hands': '手(复)', 'hanger': '衣架',
  'harpy': '鹰身女妖', 'hazy': '朦胧的', 'health': '健康', 'heap': '堆',
  'heartache': '心痛', 'heat': '热量', 'heaven': '天堂', 'here': '这里',
  'hide': '躲藏处', 'him': '他', 'his': '他的', 'hole': '洞',
  'hollow': '空洞', 'holy day': '假日', 'honor': '荣誉', 'hose': '软管',
  'host': '主人', 'hostel': '旅舍', 'housework': '家务', 'how': '如何',
  'howl': '嚎叫', 'hump': '驼峰', 'husband': '丈夫', 'ink': '墨水',
  'inland': '内陆', 'insect': '昆虫', 'instant': '瞬间', 'jack': '千斤顶',
  'joint': '关节', 'lab': '实验室', 'lady': '女士', 'large': '大的',
  'laughter': '笑声', 'law': '法律', 'leather': '皮革', 'leg': '腿',
  'legs': '腿(复)', 'lengthen': '加长', 'let': '让', 'lever': '杠杆',
  'lid': '盖子', 'life': '生活', 'lighter': '打火机', 'likelihood': '可能性',
  'litter': '垃圾', 'load': '负荷', 'log': '原木', 'loin': '腰部',
  'machine': '机器', 'mail': '邮件', 'maker': '制造者', 'mark': '标记',
  'married': '已婚的', 'master': '大师', 'me': '我', 'medium': '媒体',
  'men': '男人(复)', 'meow': '喵喵叫', 'mess': '混乱', 'mind': '头脑',
  'mister': '先生', 'misunderstand': '误解', 'money': '钱', 'monster': '怪物',
  'month': '月份', 'moo': '哞叫', 'mosaic': '马赛克', 'mourning': '哀悼',
  'mover': '搬运工', 'muscle': '肌肉', 'muse': '缪斯', 'mush': '糊状物',
  'nation': '国家', 'neck': '脖子', 'neighbour': '邻居', 'nerve': '神经',
  'nerves': '神经(复)', 'net': '网', 'newspaper': '报纸', 'nights': '夜晚(复)',
  'not': '不', 'note': '笔记', 'nothing': '没有东西', 'now': '现在',
  'object': '物体', 'off': '关闭', 'often': '经常', 'oh': '哦',
  'oink': '猪叫声', 'okay': '好的', 'on': '在...上面', 'oral': '口头',
  'other': '其他的', 'ouch': '哎哟', 'ounce': '盎司', 'our': '我们的',
  'out': '出去', 'oven': '烤箱', 'ox': '公牛', 'pack': '包装',
  'packet': '包裹', 'pair': '一对', 'pajama': '睡衣', 'papa': '爸爸',
  'passage': '通道', 'past': '过去的', 'path': '路径', 'peak': '顶峰',
  'perhaps': '也许', 'pet': '宠物', 'picket': '尖桩', 'picnic': '野餐',
  'piece': '片', 'pillage': '掠夺', 'pin': '大头针', 'pipe': '管子',
  'pitcher': '投手', 'place': '地方', 'plane': '飞机', 'pleasure': '快乐',
  'plus': '加上', 'pocket': '口袋', 'point': '点', 'pool': '水池',
  'pop': '流行', 'port': '港口', 'postbox': '邮箱', 'pound': '磅',
  'prayer': '祷告', 'present': '礼物', 'prize': '奖品', 'purse': '钱包',
  'quack': '鸭叫', 'quarrel': '争吵', 'quart': '夸脱', 'quilt': '被子',
  'racket': '球拍', 'rail': '铁轨', 'rant': '咆哮', 'ready': '准备好的',
  'retain': '保留', 'rider': '骑手', 'ring': '戒指', 'rise': '升起',
  'role': '角色', 'roof': '屋顶', 'rope': '绳子', 'sandal': '凉鞋',
  'scale': '规模', 'scar': '伤疤', 'sealing': '密封', 'seat': '座位',
  'secret': '秘密', 'self': '自己', 'series': '系列', 'shall': '将要',
  'she': '她', 'shell': '贝壳', 'shore': '岸边', 'should': '应该',
  'since': '自从', 'single': '单个的', 'skeleton': '骨架',
  'snowbank': '雪堆', 'snowfall': '降雪', 'snowmen': '雪人(复)',
  'snowplow': '除雪机', 'soap': '肥皂', 'sock': '袜子', 'sort': '种类',
  'sour': '酸的', 'spear': '长矛', 'spot': '地点', 'state': '状态',
  'stencil': '模板', 'step': '步骤', 'stone': '石头', 'straight': '笔直的',
  'strength': '力量', 'string': '绳子', 'stripes': '条纹', 'stuff': '东西',
  'suit': '西装', 'sum': '总和', 'supplies': '供应品', 'supposed': '应该的',
  'swam': '游泳(过去式)', 'sweat': '汗水', 'tank': '坦克', 'tape': '胶带',
  'taper': '锥形', 'tax': '税收', 'tear': '眼泪', 'teen': '青少年',
  'temperate': '温和的', 'tent': '帐篷', 'terrific': '很棒的',
  'text': '文本', 'than': '比', 'thank': '感谢', 'them': '他们',
  'thicket': '灌木丛', 'things': '东西(复)', 'throat': '喉咙', 'tidy': '整洁的',
  'tie': '领带', 'tigger': '跳跳虎', 'times': '次数', 'tire': '轮胎',
  'to': '到', 'tool': '工具', 'tooth': '牙齿', 'tower': '塔',
  'track': '轨道', 'trap': '陷阱', 'trick': '诡计', 'tube': '管子',
  'twentieth': '第二十', 'two wheels': '两轮车', 'um': '嗯',
  'underground': '地下', 'union': '联盟', 'us': '我们', 'value': '价值',
  'villa': '别墅', 'viola': '中提琴', 'vision': '视力', 'wagon': '马车',
  'waist': '腰', 'wan': '苍白的', 'warmer': '取暖器', 'wife': '妻子',
  'willow': '柳树', 'with': '和...一起', 'women': '女人(复)', 'wood': '木头',
  'wool': '羊毛', 'yoghurt': '酸奶', 'your': '你的', 'youth': '青春',
  'yum': '好吃',
  // === 初中特有补充 ===
  'subject': '学科', 'homework': '家庭作业', 'exam': '考试', 'grade': '年级/成绩',
  'semester': '学期', 'library': '图书馆', 'laboratory': '实验室',
  'experiment': '实验', 'project': '项目', 'report': '报告',
  'dictionary': '词典', 'notebook': '笔记本', 'textbook': '教科书',
  'uniform': '校服', 'headmaster': '校长', 'classmate': '同学',
  'neighborhood': '社区', 'downtown': '市中心', 'suburb': '郊区',
  'village': '村庄', 'country': '国家/乡村', 'continent': '大陆',
  'ocean': '海洋', 'island': '岛屿', 'mountain': '山脉', 'river': '河流',
  'forest': '森林', 'desert': '沙漠', 'beach': '海滩', 'bridge': '桥',
  'tower': '塔楼', 'museum': '博物馆', 'hospital': '医院', 'airport': '机场',
  'station': '车站', 'restaurant': '餐厅', 'hotel': '酒店',
  'internet': '互联网', 'website': '网站', 'email': '电子邮件',
  'message': '信息', 'conversation': '对话', 'opinion': '观点',
  'advice': '建议', 'decision': '决定', 'suggestion': '建议',
  'problem': '问题', 'solution': '解决方案', 'reason': '原因',
  'result': '结果', 'progress': '进步', 'success': '成功',
  'failure': '失败', 'mistake': '错误', 'chance': '机会',
  'effort': '努力', 'habit': '习惯', 'ability': '能力',
  'knowledge': '知识', 'experience': '经验', 'memory': '记忆',
  'attention': '注意', 'patience': '耐心', 'confidence': '信心',
  'courage': '勇气', 'wisdom': '智慧', 'health': '健康',
  'environment': '环境', 'pollution': '污染', 'population': '人口',
  'temperature': '温度', 'weather': '天气', 'climate': '气候',
  'nature': '自然', 'energy': '能量', 'electricity': '电力',
  'technology': '技术', 'science': '科学', 'history': '历史',
  'geography': '地理', 'physics': '物理', 'chemistry': '化学',
  'mathematics': '数学', 'language': '语言', 'literature': '文学',
  'culture': '文化', 'society': '社会', 'economy': '经济',
  'politics': '政治', 'law': '法律', 'government': '政府',
  'education': '教育', 'business': '商业', 'industry': '工业',
  'agriculture': '农业', 'medicine': '医学', 'engineering': '工程',
  'transportation': '交通', 'communication': '通讯',
  'information': '信息', 'competition': '竞争', 'cooperation': '合作',
  'relationship': '关系', 'friendship': '友谊', 'membership': '成员资格',
  'leadership': '领导力', 'responsibility': '责任',
  'development': '发展', 'improvement': '改善', 'achievement': '成就',
  'difference': '区别', 'similarity': '相似性', 'advantage': '优势',
  'disadvantage': '劣势', 'possibility': '可能性', 'necessity': '必要性',
  'importance': '重要性', 'difficulty': '困难', 'danger': '危险',
  'safety': '安全', 'freedom': '自由', 'peace': '和平',
  'war': '战争', 'violence': '暴力', 'crime': '犯罪',
  'punishment': '惩罚', 'reward': '奖励', 'prize': '奖品',
  'gift': '礼物', 'surprise': '惊喜', 'worry': '担忧',
  'fear': '恐惧', 'anger': '愤怒', 'joy': '快乐',
  'sadness': '悲伤', 'hope': '希望', 'dream': '梦想',
  'goal': '目标', 'plan': '计划', 'method': '方法',
  'way': '方式', 'style': '风格', 'form': '形式',
  'shape': '形状', 'size': '大小', 'color': '颜色',
  'weight': '重量', 'length': '长度', 'width': '宽度',
  'height': '高度', 'depth': '深度', 'distance': '距离',
  'speed': '速度', 'price': '价格', 'cost': '成本',
  'value': '价值', 'quality': '质量', 'quantity': '数量',
  'number': '数字', 'amount': '数量', 'total': '总计',
  'average': '平均', 'percentage': '百分比', 'degree': '度数',
  'level': '水平', 'standard': '标准', 'condition': '条件',
  'situation': '情况', 'event': '事件', 'activity': '活动',
  'action': '行动', 'movement': '运动', 'process': '过程',
  'period': '时期', 'moment': '时刻', 'second': '秒',
  'minute': '分钟', 'hour': '小时', 'week': '周',
  'month': '月', 'year': '年', 'century': '世纪',
  // === 短语/复合词 ===
  'all ways': '总是', 'big cat': '大猫', 'big eyes': '大眼睛',
  'big room': '大房间', 'black and white': '黑白', 'many people': '许多人',
  'birth day': '出生日', 'holy day': '假日', 'take away': '拿走',
  'to day': '今天', "when's day": '哪一天', 'T-shirt': 'T恤', 'TV': '电视',
  'PE': '体育课', 'Finnish': '芬兰语', 'Chinese': '中文/中国的',
  // === 补充（覆盖剩余引用） ===
  'about': '关于', 'africa': '非洲', 'agree': '同意', 'all': '所有的',
  'and': '和', 'animal': '动物', 'another': '另一个', 'ants': '蚂蚁',
  'any': '任何', 'apply': '申请', 'are': '是', "aren't": '不是',
  'around': '周围', 'as': '作为', 'at': '在', 'attract': '吸引',
  'auntie': '阿姨', 'australia': '澳大利亚', 'autumn': '秋天',
  'away': '离开', 'baa': '羊叫', 'balance': '平衡', 'bark': '狗叫',
  'bat': '蝙蝠', 'be': '是', 'beagle': '比格犬', 'because': '因为',
  'berry': '浆果', 'besides': '此外', 'beverage': '饮料', 'bowel': '肠道',
  'built': '建造', 'but': '但是', 'by': '被/在...旁', 'came': '来(come过去式)',
  'carried': '搬运(carry过去式)', 'children': '孩子们', 'christ': '基督',
  'cit': '西柚', 'crown': '皇冠', 'dad': '爸爸', 'decide': '决定',
  'deserted': '荒废的', 'dish': '盘子', 'do': '做', 'does': '做(第三人称单数)',
  "don't": '不做', 'down': '向下', 'each': '每个', 'east': '东方',
  'eat': '吃', 'egg': '鸡蛋', 'end': '结束', 'enough': '足够的',
  'every': '每个', 'everyone': '每个人', 'everything': '一切事物',
  'exactly': '确切地', 'exciting': '令人兴奋的', 'exercise': '锻炼',
  'dollar': '美元', 'dot': '点', 'favor': '恩惠', 'feb': '二月(缩写)',
  'fingers': '手指(复数)', 'finnish': '芬兰语/芬兰人', 'god': '上帝',
  'in': '在...里面', 'jan': '一月(缩写)', 'luck': '运气',
  'mitten': '连指手套', 'pole': '杆子', 'saturn': '土星',
  'sometime': '某时', 'somewhere': '某处', 'tune': '曲调',
  'tv': '电视', 'weep': '哭泣', "when's day": '哪天', 'whether': '是否',
  'while': '当...时', 'why': '为什么', 'will': '将要/会',
}

/** 检查一个词是否有外部词条 */
function hasExternalWord(key) {
  return !!EXTERNAL_WORD_MEANINGS[key]
}
/** 获取外部词条信息 */
function getExternalWordInfo(key) {
  const meaning = EXTERNAL_WORD_MEANINGS[key]
  if (!meaning) return null
  return { word: key, meaning, isExternal: true }
}

// ─── 外部词提示卡片（点击未收录的关联/易混词时显示） ──────────────────
function ExternalWordCard({ word, meaning, onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-2xl p-5 w-full max-w-xs shadow-xl"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'modalIn 0.2s ease' }}
      >
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-semibold text-violet-500 bg-violet-50 px-2 py-0.5 rounded-full">📖 拓展词</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
        </div>

        <div className="text-center mb-3">
          <div className="text-2xl font-bold text-gray-800">{word}</div>
          <div className="text-base text-indigo-600 mt-1 font-medium">{meaning}</div>
        </div>

        <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-500 text-center">
          这是关联词，暂不在主学习库中<br/>
          <span className="text-xs text-gray-400">了解即可，无需记忆</span>
        </div>
      </div>
    </div>
  )
}

// ─── 对比弹窗 ──────────────────────────────────────────────────────────────
function ConfusableModal({ wordA, wordB, onClose }) {
  const objA = allWordsMap[wordA] || getExternalWordInfo(wordA) || { word: wordA, meaning: wordA }
  const objB = allWordsMap[wordB] || getExternalWordInfo(wordB) || { word: wordB, meaning: wordB }

  // 找出字母差异
  function getDiff() {
    if (!wordA || !wordB) return ''
    const la = wordA.toLowerCase()
    const lb = wordB.toLowerCase()
    const diffs = []
    const minLen = Math.min(la.length, lb.length)
    for (let i = 0; i < minLen; i++) {
      if (la[i] !== lb[i]) diffs.push(`第${i + 1}个字母：${la[i]} → ${lb[i]}`)
    }
    if (la.length !== lb.length) diffs.push(`长度不同：${la.length} vs ${lb.length} 个字母`)
    return diffs.length > 0 ? diffs.join('，') : '拼写不同'
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'modalIn 0.25s ease' }}
      >
        <div className="text-center mb-4">
          <div className="text-base font-bold text-gray-700 mb-1">易混词对比</div>
          <div className="text-xs text-gray-400">别搞混了！仔细看区别</div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          {/* 词 A */}
          <div className="flex-1 rounded-2xl p-3 text-center" style={{ background: 'linear-gradient(135deg,#eff6ff,#bfdbfe)' }}>
            <button
              className="text-lg font-extrabold text-blue-700"
              onClick={() => speakEnglish(wordA)}
            >
              {wordA} 🔊
            </button>
            <div className="text-sm text-blue-600 mt-1">{objA.meaning || ''}</div>
          </div>

          <div className="text-2xl font-bold text-gray-300">vs</div>

          {/* 词 B */}
          <div className="flex-1 rounded-2xl p-3 text-center" style={{ background: 'linear-gradient(135deg,#fff7ed,#fed7aa)' }}>
            <button
              className="text-lg font-extrabold text-orange-700"
              onClick={() => speakEnglish(wordB)}
            >
              {wordB} 🔊
            </button>
            <div className="text-sm text-orange-600 mt-1">{objB.meaning || ''}</div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2.5 text-xs text-amber-800 mb-4">
          <span className="font-bold">区别：</span>{getDiff()}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-bold text-sm active:scale-95 transition-transform"
        >
          明白了 ✓
        </button>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// 探索模式 — 词卡（保留用于浏览全部词汇）
// ═══════════════════════════════════════════════════════════════════════════
function WordCard({ wordObj, onJump }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className={`rounded-2xl border transition-all overflow-hidden ${open ? 'border-sky-300 shadow-md' : 'border-gray-200 shadow-sm'}`}
      style={{ background: open ? 'linear-gradient(135deg,#f0f9ff,#e0f2fe)' : '#fff' }}
    >
      {/* 折叠头部 */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-sky-50 transition-colors"
        onClick={() => setOpen(v => !v)}
      >
        <button
          className="text-xl flex-shrink-0"
          onClick={e => { e.stopPropagation(); speakEnglish(wordObj.word) }}
          title="朗读"
        >🔊</button>
        <div className="flex-1 min-w-0">
          <span className="font-bold text-gray-800 text-base">{wordObj.word}</span>
          <span className="text-gray-400 text-xs ml-2">{wordObj.meaning}</span>
        </div>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-semibold"
          style={{ background: '#bae6fd', color: '#0369a1' }}
        >
          tier {wordObj.tier}
        </span>
        <span className="text-gray-400 text-sm ml-1">{open ? '▲' : '▼'}</span>
      </button>

      {/* 展开内容 */}
      {open && (
        <div className="px-4 pb-4 pt-1 space-y-3">
          {/* 例句 */}
          {wordObj.example && (
            <div className="text-sm text-gray-600 italic border-l-4 border-sky-300 pl-3">
              <button
                className="mr-1 text-base"
                onClick={() => speakEnglish(wordObj.example)}
                title="朗读例句"
              >🔊</button>
              "{wordObj.example}"
            </div>
          )}

          {/* 记忆口诀 */}
          {wordObj.memory_tip && (
            <div className="text-sm text-indigo-700 bg-indigo-50 rounded-xl px-3 py-2">
              💡 记忆口诀：{wordObj.memory_tip}
            </div>
          )}

          {/* 联想词 */}
          {(wordObj.associations || []).length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-1.5">🔗 联想词</div>
              <div className="flex flex-wrap gap-1.5">
                {(wordObj.associations || []).map(w => {
                  const wObj = allWordsMap[w]
                  return (
                    <button
                      key={w}
                      onClick={() => wObj && onJump(w)}
                      className="text-xs px-2.5 py-1 rounded-full font-medium transition-colors active:scale-95"
                      style={{ background: '#dbeafe', color: '#1d4ed8' }}
                    >
                      {w}{wObj ? ` ${wObj.meaning}` : ''}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* 易混词 */}
          {(wordObj.confusables || []).length > 0 && (
            <div>
              <div className="text-xs font-semibold text-gray-500 mb-1.5">⚠️ 易混词（别认错！）</div>
              <div className="flex flex-wrap gap-1.5">
                {(wordObj.confusables || []).map(w => {
                  const wObj = allWordsMap[w]
                  return (
                    <button
                      key={w}
                      onClick={() => wObj && onJump(w)}
                      className="text-xs px-2.5 py-1 rounded-full font-medium transition-colors active:scale-95"
                      style={{ background: '#fee2e2', color: '#b91c1c' }}
                    >
                      {w}{wObj ? ` ${wObj.meaning}` : ''}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// 词根树主视图（学习模式核心组件）
// ═══════════════════════════════════════════════════════════════════════════
function WordTree({ wordObj, visible, onNodeClick, onConfusableClick, masteryStatus }) {
  const associations = wordObj.associations || []
  // 易混词：保留所有（即使不在主词库），显示时fallback到EXTERNAL_WORD_MEANINGS
  const confusablesRaw = wordObj.confusables || []
  // 过滤仅用于显示主词库词的版本（保持原有逻辑兼容）
  const confusables = confusablesRaw

  // 掌握状态
  const MASTERY = {
    new: { emoji: '⚪', label: '新词', cls: 'bg-gray-50 text-gray-500' },
    due: { emoji: '🟡', label: '待复习', cls: 'bg-amber-50 text-amber-600' },
    mastered: { emoji: '🟢', label: '已掌握', cls: 'bg-emerald-50 text-emerald-600' },
    reviewed: { emoji: '🔵', label: '复习中', cls: 'bg-blue-50 text-blue-600' },
  }
  const ms = MASTERY[masteryStatus] || MASTERY.new

  return (
    <div
      className="flex flex-col items-center gap-5 px-4"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.35s ease, transform 0.35s ease',
      }}
    >
      {/* 联想词区（上方，蓝色） */}
      {associations.length > 0 && (
        <div className="w-full">
          <div className="text-xs font-semibold text-blue-500 text-center mb-2">
            🔗 联想词 — 点击跳转
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {associations.map((w, i) => {
              const obj = allWordsMap[w] || allWordsMap[w.toLowerCase()]
              const extMeaning = (!obj) ? (EXTERNAL_WORD_MEANINGS[w] || EXTERNAL_WORD_MEANINGS[w.toLowerCase()] || null) : null
              return (
                <button
                  key={w}
                  onClick={() => onNodeClick(w)}
                  className="flex flex-col items-center px-4 py-2 rounded-2xl active:scale-95 transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                    color: '#1e40af',
                    minWidth: 64,
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateY(0)' : 'translateY(-12px)',
                    transition: `opacity 0.35s ${i * 0.07}s ease, transform 0.35s ${i * 0.07}s ease`,
                    boxShadow: '0 2px 8px rgba(59,130,246,0.2)',
                    cursor: 'pointer',
                  }}
                >
                  <span className="font-bold text-sm">{w}</span>
                  {obj
                    ? <span className="text-[10px] opacity-80">{obj.meaning}</span>
                    : extMeaning
                      ? <span className="text-[10px] opacity-70">{extMeaning}</span>
                      : <span className="text-[10px] opacity-50">查看 →</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 连线装饰 */}
      {associations.length > 0 && (
        <div className="flex flex-col items-center gap-0.5">
          <div className="w-0.5 h-4 bg-gradient-to-b from-blue-300 to-gray-300 rounded-full" />
        </div>
      )}

      {/* 核心词卡 */}
      <div
        className="w-full rounded-3xl overflow-hidden shadow-lg"
        style={{
          background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
          border: '2px solid #86efac',
        }}
      >
        {/* 单词行 */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-2">
          <button
            onClick={() => speakEnglish(wordObj.word)}
            className="text-2xl active:scale-90 transition-transform"
            title="朗读"
          >
            🔊
          </button>
          <div className="flex-1">
            <div className="flex items-baseline gap-2">
              <SegmentedDisplay word={wordObj.word} segmentation={wordObj.segmentation} />
              {wordObj.phonetic && (
                <span className="text-sm text-emerald-600 font-mono">{wordObj.phonetic}</span>
              )}
            </div>
            <div className="text-base text-emerald-700 font-semibold mt-0.5">
              {wordObj.meaning}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: '#bbf7d0', color: '#166534' }}
            >
              tier {wordObj.tier}
            </div>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${ms.cls}`}
              title={ms.label}
            >
              {ms.emoji}
            </span>
          </div>
        </div>

        {/* 记忆口诀 */}
        {wordObj.memory_tip && (
          <div className="mx-4 mb-2 px-3 py-2 bg-white/60 rounded-xl">
            <span className="text-xs text-indigo-700">
              <span className="mr-1">💡</span>记忆：{wordObj.memory_tip}
            </span>
          </div>
        )}

        {/* 例句 */}
        {wordObj.example && (
          <div className="mx-4 mb-2 px-3 py-2 bg-white/60 rounded-xl flex items-start gap-2">
            <button
              onClick={() => speakEnglish(wordObj.example)}
              className="text-base flex-shrink-0 mt-0.5 active:scale-90 transition-transform"
            >
              🔊
            </button>
            <span className="text-xs text-gray-600 italic leading-relaxed">
              "{wordObj.example}"
            </span>
          </div>
        )}

        {/* 用法区别 */}
        {wordObj.usage_note && (
          <div className="mx-4 mb-4 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <div className="text-xs font-bold text-amber-600 mb-1">💡 用法区别</div>
            <div className="text-sm text-amber-800">{wordObj.usage_note}</div>
          </div>
        )}
        {!wordObj.usage_note && <div className="mb-4" />}
      </div>

      {/* 连线装饰 */}
      {confusables.length > 0 && (
        <div className="flex flex-col items-center gap-0.5">
          <div className="w-0.5 h-4 bg-gradient-to-b from-gray-300 to-orange-300 rounded-full" />
        </div>
      )}

      {/* 易混词区（下方，橙色） */}
      {confusables.length > 0 && (
        <div className="w-full">
          <div className="text-xs font-semibold text-orange-500 text-center mb-2">
            ⚠️ 易混词 — 点击对比
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {confusables.map((w, i) => {
              const obj = allWordsMap[w]
              const extMeaning = (!obj) ? (EXTERNAL_WORD_MEANINGS[w] || EXTERNAL_WORD_MEANINGS[w.toLowerCase()] || null) : null
              return (
                <button
                  key={w}
                  onClick={() => onConfusableClick(wordObj.word, w)}
                  className="flex flex-col items-center px-4 py-2 rounded-2xl active:scale-95 transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #fff7ed, #fed7aa)',
                    color: '#9a3412',
                    minWidth: 64,
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateY(0)' : 'translateY(12px)',
                    transition: `opacity 0.35s ${i * 0.07}s ease, transform 0.35s ${i * 0.07}s ease`,
                    boxShadow: '0 2px 8px rgba(249,115,22,0.2)',
                  }}
                >
                  <span className="font-bold text-sm">{w}</span>
                  {obj
                    ? <span className="text-[10px] opacity-80">{obj.meaning}</span>
                    : extMeaning
                      ? <span className="text-[10px] opacity-70">{extMeaning}</span>
                      : null}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// 答题区
// ═══════════════════════════════════════════════════════════════════════════
function QuizSection({ wordObj, onWordDone }) {
  const [questions] = useState(() => buildQuestions(wordObj))
  const [qIndex, setQIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [results, setResults] = useState([])
  const [done, setDone] = useState(false)

  const q = questions[qIndex]

  function handleSelect(opt) {
    if (selected !== null) return
    const correct = opt === q.answer
    setSelected(opt)
    setResults(prev => [...prev, { correct }])
  }

  function handleSubmit() {
    // QuizSection 目前只处理选择题，不需要 handleSubmit
    // 保留以备扩展拼写题
  }

  function handleNext() {
    if (qIndex + 1 >= questions.length) {
      setDone(true)
    } else {
      setQIndex(i => i + 1)
      setSelected(null)
      setSubmitted(false)
      setIsCorrect(false)
    }
  }

  function handleContinue() {
    const correct = results.filter(r => r.correct).length
    onWordDone(correct, questions.length)
  }

  if (questions.length === 0) {
    return (
      <div className="px-4 mt-4">
        <button
          onClick={() => onWordDone(0, 0)}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-bold text-base active:scale-95 transition-transform shadow-md"
        >
          继续下一个词 →
        </button>
      </div>
    )
  }

  if (done) {
    const correct = results.filter(r => r.correct).length
    const allRight = correct === results.length
    return (
      <div className="px-4 mt-4">
        <div
          className={`rounded-2xl px-4 py-4 mb-4 ${allRight ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'}`}
        >
          <div className={`font-bold text-base mb-1 ${allRight ? 'text-green-700' : 'text-blue-700'}`}>
            {allRight ? '🎉 全对！+' + (correct * XP_CORRECT) + ' XP' : `👍 答对 ${correct}/${results.length} 题 +${correct * XP_CORRECT} XP`}
          </div>
          <div className="text-xs text-gray-500">继续探索下一个词吧！</div>
        </div>
        <button
          onClick={handleContinue}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-bold text-base active:scale-95 transition-transform shadow-md"
        >
          继续下一个词 →
        </button>
      </div>
    )
  }

  const choiceAnswered = selected !== null
  const choiceCorrect = choiceAnswered && selected === q.answer

  return (
    <div className="px-4 mt-4 pb-8">
      {/* 题型标签 + 进度 */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-xs font-bold px-3 py-1 rounded-full"
          style={
            q.type === 'association_fill'
              ? { background: '#dbeafe', color: '#1e40af' }
              : q.type === 'trap_choice'
              ? { background: '#fff7ed', color: '#9a3412' }
              : { background: '#f3e8ff', color: '#6b21a8' }
          }
        >
          {q.label}
        </span>
        <span className="text-xs text-gray-400">{qIndex + 1} / {questions.length}</span>
      </div>

      {/* 题目 */}
      <div
        className="rounded-2xl px-4 py-4 text-sm font-semibold text-gray-800 leading-relaxed mb-4"
        style={{ background: 'linear-gradient(135deg,#f0f9ff,#e0f2fe)' }}
      >
        {q.question}
      </div>

      {/* 朗读按钮 */}
      {q.speakText && (
        <div className="mb-3 text-center">
          <button
            onClick={() => speakEnglish(q.speakText)}
            className="inline-flex items-center gap-1 text-sm text-sky-600 font-medium active:scale-95 transition-transform"
          >
            🔊 朗读原文
          </button>
        </div>
      )}

      {/* 选项 */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {q.options.map((opt, i) => {
          let style = 'border-gray-200 bg-white text-gray-700'
          if (choiceAnswered) {
            if (opt === q.answer) style = 'border-green-400 bg-green-50 text-green-700'
            else if (opt === selected) style = 'border-red-400 bg-red-50 text-red-600'
            else style = 'border-gray-200 bg-white text-gray-400'
          }
          return (
            <button
              key={i}
              onClick={() => handleSelect(opt)}
              disabled={choiceAnswered}
              className={`rounded-2xl border-2 px-3 py-3 text-sm font-medium text-left transition-all active:scale-95 ${style}`}
            >
              <span className="mr-1.5 text-xs font-bold text-gray-400">
                {['A', 'B', 'C', 'D'][i]}.
              </span>
              {opt}
            </button>
          )
        })}
      </div>

      {/* 反馈 */}
      {choiceAnswered && (
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed mb-3 ${choiceCorrect ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}
        >
          {choiceCorrect ? (
            <div className="font-bold">✅ 答对了！+{XP_CORRECT} XP</div>
          ) : (
            <>
              <div className="font-bold mb-1">❌ 答错了，别灰心！</div>
              <div className="text-xs">
                正确答案：<span className="font-bold">{q.answer}</span>
                {(q.wordObj?.confusables || []).length > 0 && (
                  <span className="ml-1 text-orange-600">
                    ⚠️ 易混词：{q.wordObj.confusables.join('、')}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* 下一题 */}
      {choiceAnswered && (
        <button
          onClick={handleNext}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-bold text-base active:scale-95 transition-transform shadow-md"
        >
          {qIndex + 1 >= questions.length ? '查看本词结果 →' : '下一题 →'}
        </button>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// 探索模式（浏览全部词库）
// ═══════════════════════════════════════════════════════════════════════════
function ExploreMode({ onSwitchQuiz }) {
  const [search, setSearch] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [expandedCats, setExpandedCats] = useState({})
  const cardRefs = useRef({})

  const displayWords = useMemo(() => {
    const pool = showAll ? allWords : tier1Words
    if (!search.trim()) return pool
    const q = search.trim().toLowerCase()
    return pool.filter(
      w => w.word.toLowerCase().includes(q) || w.meaning.includes(q)
    )
  }, [search, showAll])

  // 按 category 分组
  const grouped = useMemo(() => {
    const map = {}
    for (const w of displayWords) {
      const cat = w.category || 'misc'
      if (!map[cat]) map[cat] = []
      map[cat].push(w)
    }
    return map
  }, [displayWords])

  const categories = Object.keys(grouped).sort()

  function handleJump(word) {
    setSearch(word)
    setTimeout(() => {
      const el = cardRefs.current[word]
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }

  function toggleCat(cat) {
    setExpandedCats(prev => ({ ...prev, [cat]: !prev[cat] }))
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      {/* 搜索框 */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">🔍</span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜索单词或中文意思..."
          className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        />
        {search && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
            onClick={() => setSearch('')}
          >✕</button>
        )}
      </div>

      {/* 开关：显示全部词 */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          共 {displayWords.length} 个词
          {!showAll && <span className="text-gray-400">（仅高频词）</span>}
        </span>
        <button
          onClick={() => setShowAll(v => !v)}
          className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${showAll ? 'bg-sky-500 text-white' : 'bg-gray-100 text-gray-600'}`}
        >
          {showAll ? '显示全部 ✓' : '显示全部词'}
        </button>
      </div>

      {/* 搜索结果直接列表 */}
      {search.trim() ? (
        <div className="space-y-2">
          {displayWords.length === 0 && (
            <div className="text-center text-gray-400 py-8 text-sm">未找到相关单词</div>
          )}
          {displayWords.map(w => (
            <div key={w.word} ref={el => { cardRefs.current[w.word] = el }}>
              <WordCard wordObj={w} onJump={handleJump} />
            </div>
          ))}
        </div>
      ) : (
        /* 按类别分组 */
        <div className="space-y-3">
          {categories.map(cat => {
            const words = grouped[cat]
            const catLabel = CATEGORY_NAMES[cat] || cat
            const isExpanded = expandedCats[cat]
            const shown = isExpanded ? words : words.slice(0, 5)
            return (
              <div key={cat} className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                {/* 分类头 */}
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-left bg-gray-50 active:bg-gray-100 transition-colors"
                  onClick={() => toggleCat(cat)}
                >
                  <span className="font-semibold text-sm text-gray-700">{catLabel}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{words.length} 个词</span>
                    <span className="text-gray-400 text-xs">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </button>

                {/* 词卡列表 */}
                <div className="p-2 space-y-2">
                  {shown.map(w => (
                    <div key={w.word} ref={el => { cardRefs.current[w.word] = el }}>
                      <WordCard wordObj={w} onJump={handleJump} />
                    </div>
                  ))}
                  {words.length > 5 && (
                    <button
                      onClick={() => toggleCat(cat)}
                      className="w-full text-xs text-sky-500 py-2 font-medium active:text-sky-700 transition-colors"
                    >
                      {isExpanded ? '收起' : `查看全部 ${words.length} 个 →`}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// 主页面 — SRS 驱动的初中英语单词星球
// ═══════════════════════════════════════════════════════════════════════════
export default function WordPlanetPage({ user, onFinish, onBack, onRetry }) {
  const [mode, setMode] = useState('learn') // 'learn'(SRS学习) | 'explore'(浏览) | 'quiz'(答题)
  const [sessionWords] = useState(() => scheduleSessionWords(null))
  const [currentIdx, setCurrentIdx] = useState(0)
  const [tempWord, setTempWord] = useState(null)
  const [treeVisible, setTreeVisible] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [modal, setModal] = useState(null)
  const [externalWord, setExternalWord] = useState(null)
  const [sessionResults, setSessionResults] = useState([])
  const [totalXP, setTotalXP] = useState(0)
  const [done, setDone] = useState(false)
  const [toast, setToast] = useState(null)
  const scrollContainerRef = useRef(null)

  // ─── SRS 状态 ──────────────────────────────────────────────
  const [srsStates, setSrsStates] = useState(() => {
    if (!user?.id) return {}
    try {
      const saved = localStorage.getItem(`srs_${user.id}`)
      return saved ? JSON.parse(saved) : {}
    } catch { return {} }
  })

  const currentWord = tempWord || sessionWords[currentIdx]
  const xp = storage.getXP(user?.id)

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2000)
  }

  // 词切换时：滚回顶部 → fade out → 换词 → fade in + TTS
  const switchWord = useCallback((newIdx) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0
    }
    setTreeVisible(false)
    setShowQuiz(false)
    setTempWord(null)
    setTimeout(() => {
      setCurrentIdx(newIdx)
      setTreeVisible(true)
    }, 300)
  }, [])

  // 初始显示
  useEffect(() => {
    const t = setTimeout(() => setTreeVisible(true), 100)
    return () => clearTimeout(t)
  }, [])

  // ─── SRS 状态加载（组件挂载时从 localStorage 读取） ──────
  useEffect(() => {
    if (!user?.id) return
    try {
      const saved = localStorage.getItem(`srs_${user.id}`)
      if (saved) setSrsStates(JSON.parse(saved))
    } catch {}
  }, [user?.id])

  // 当前词的掌握状态
  const currentSrsStatus = useMemo(() => {
    if (!currentWord || !user?.id) return 'new'
    const cardId = `j2_${currentWord.word}`
    const state = srsStates[cardId]
    if (!state) return 'new'
    if (isDue(state)) return 'due'
    if (state.reviewCount >= 3 && state.easeFactor >= 2.5) return 'mastered'
    return 'reviewed'
  }, [currentWord, srsStates, user?.id])

  // 词切换时自动朗读
  useEffect(() => {
    if (treeVisible && currentWord && mode === 'learn') {
      speakEnglish(currentWord.word)
    }
  }, [treeVisible, currentWord, mode])

  function handleRandomWord() {
    const newIdx = Math.floor(Math.random() * sessionWords.length)
    switchWord(newIdx)
  }

  function handleNodeClick(wordKey) {
    const key = wordKey.toLowerCase()
    // 先在 session 中查找
    const idx = sessionWords.findIndex(w => w.word.toLowerCase() === key)
    if (idx !== -1) {
      setExternalWord(null)
      switchWord(idx)
      return
    }
    // session 外，在完整词库中查找
    const networkWord = allWordsMap[key] || allWordsMap[wordKey]
    if (networkWord) {
      if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0
      setTreeVisible(false)
      setShowQuiz(false)
      setTimeout(() => {
        setTempWord(networkWord)
        setTreeVisible(true)
      }, 300)
    } else if (hasExternalWord(key)) {
      // 未收录但有外部词典 → 显示拓展词卡片
      const info = getExternalWordInfo(key)
      setExternalWord(info)
    } else {
      showToast(`"${wordKey}" 暂未收录`)
    }
  }

  function handleConfusableClick(wordA, wordB) {
    setModal({ wordA, wordB })
  }

  function handleWordDone(correct, total) {
    const xpGained = correct * XP_CORRECT
    if (xpGained > 0 && user?.id) {
      try { storage.addXP(user.id, xpGained) } catch {}
    }
    setTotalXP(prev => prev + xpGained)
    const newResults = [...sessionResults, { correct, total }]
    setSessionResults(newResults)

    // ─── SRS 记录 ──────────────────────────────
    if (user?.id && currentWord) {
      try {
        const cardId = `j2_${currentWord.word}`
        const passed = correct / total >= 0.6
        const quality = toQuality(passed, Math.round((correct / total) * 10))
        const oldState = srsStates[cardId] || null
        const newState = updateSRS(oldState, quality)
        setSrsStates(prev => ({ ...prev, [cardId]: newState }))
        try {
          localStorage.setItem(`srs_${user.id}`, JSON.stringify({ ...srsStates, [cardId]: newState }))
        } catch {}
        storage.addRecord(user.id, { ability_tag: currentWord.category || 'misc', knowledge_tag: '初中单词星球', subject: 'english', correct, total })
      } catch {}
    }

    // 切换到下一个词（始终执行）
    if (currentIdx + 1 >= sessionWords.length) {
      setDone(true)
    } else {
      switchWord(currentIdx + 1)
    }
  }

  // Session 结束页
  if (done) {
    const totalCorrect = sessionResults.reduce((s, r) => s + r.correct, 0)
    const totalQs = sessionResults.reduce((s, r) => s + r.total, 0)
    const accuracy = totalQs > 0 ? Math.round((totalCorrect / totalQs) * 100) : 100
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 gap-6">
        <div className="text-7xl">{accuracy >= 80 ? '🎉' : accuracy >= 50 ? '👍' : '💪'}</div>
        <div className="text-2xl font-extrabold text-gray-800 text-center">
          单词星球探索完成！
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <div className="text-3xl font-extrabold text-emerald-600">{sessionWords.length}</div>
            <div className="text-xs text-gray-500 mt-0.5">学习词数</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-extrabold text-indigo-600">+{totalXP}</div>
            <div className="text-xs text-gray-500 mt-0.5">XP 奖励</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-extrabold text-sky-600">{accuracy}%</div>
            <div className="text-xs text-gray-500 mt-0.5">正确率</div>
          </div>
        </div>
        <button
          onClick={() => {
            // 标记星球完成（做完session全部词才算打卡）
            if (user?.id) storage.markPlanetComplete(user.id, '英语词汇')
            // SRS 同步 + streak 更新
            if (user?.id) {
              updateStreak(user.id)
              syncAfterSession(user.id)
            }
            storage.addSession(user?.id, 'word_planet_j2', { correct: totalCorrect, total: totalQs, xpGained: totalXP })
            onFinish({
              correct: totalCorrect,
              total: totalQs,
              xpGained: totalXP,
            })
          }}
          className="mt-2 w-full max-w-xs py-3 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-600 text-white font-bold text-base shadow-md active:scale-95 transition-transform"
        >
          查看结果 →
        </button>
      </div>
    )
  }

  // ─── 学习模式渲染 ──────────────────────────────────────
  if (mode === 'learn') {
    return (
      <div className="min-h-screen flex flex-col">
        {/* 顶部栏 */}
        <div
          className="sticky top-0 z-10 bg-white shadow-sm"
          style={{ paddingTop: 'env(safe-area-inset-top, 36px)' }}
        >
          <div className="flex items-center gap-3 px-4 pt-3 pb-3">
            <button
              onClick={onBack}
              className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-xl text-lg font-bold text-gray-500 active:bg-gray-200 transition-colors"
            >
              ←
            </button>
            <h1 className="flex-1 text-xl font-bold text-gray-800">单词星球 🔤</h1>
            <div className="flex items-center gap-2">
              <span className="text-xs text-emerald-600 font-bold px-2 py-1 bg-emerald-50 rounded-full">
                {xp + totalXP} XP
              </span>
              <button
                onClick={handleRandomWord}
                className="text-xs px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-500 text-white font-bold active:scale-95 transition-transform shadow-sm"
              >
                换一个词
              </button>
            </div>
          </div>

          {/* 进度条 */}
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500"
                  style={{ width: `${(currentIdx / sessionWords.length) * 100}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 whitespacenowrap font-medium">
                {currentIdx + 1} / {sessionWords.length}
              </span>
            </div>
          </div>
        </div>

        {/* 内容区 */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pb-10">
          <div className="pt-5 pb-4">
            {/* 词根树 — 答题时隐藏，防止抄答案 */}
            <div style={{ minHeight: showQuiz ? 0 : 400, overflow: 'hidden' }}>
              {!showQuiz && (
                <WordTree
                  wordObj={currentWord}
                  visible={treeVisible}
                  onNodeClick={handleNodeClick}
                  onConfusableClick={handleConfusableClick}
                  masteryStatus={currentSrsStatus}
                />
              )}
            </div>

            {/* 分割线 + 闯关/返回按钮 */}
            {!showQuiz && treeVisible && (
              <div
                className="px-4 mt-6"
                style={{
                  opacity: treeVisible ? 1 : 0,
                  transition: 'opacity 0.5s 0.4s ease',
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 font-medium">
                    {tempWord ? '正在预览关联词' : '准备好了吗？'}
                  </span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                {tempWord ? (
                  <button
                    onClick={() => {
                      if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0
                      setTreeVisible(false)
                      setTimeout(() => { setTempWord(null); setTreeVisible(true) }, 300)
                    }}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-400 to-purple-500 text-white font-bold text-base active:scale-95 transition-transform shadow-md"
                  >
                    ← 返回当前学习词（{sessionWords[currentIdx]?.word}）
                  </button>
                ) : (
                  <button
                    onClick={() => setShowQuiz(true)}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-600 text-white font-bold text-base active:scale-95 transition-transform shadow-md"
                  >
                    开始闯关 ✍️ （3 道题）
                  </button>
                )}
              </div>
            )}

            {/* 答题区（始终对 session 词出题，忽略 tempWord） */}
            {showQuiz && (
              <div className="mt-2">
                <div className="flex items-center gap-3 px-4 mb-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs font-bold text-emerald-600">✍️ 闯关答题</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <QuizSection
                  key={sessionWords[currentIdx].word}
                  wordObj={sessionWords[currentIdx]}
                  onWordDone={handleWordDone}
                />
              </div>
            )}
          </div>
        </div>

        {/* 易混词对比弹窗 */}
        {modal && (
          <ConfusableModal
            wordA={modal.wordA}
            wordB={modal.wordB}
            onClose={() => setModal(null)}
          />
        )}

        {/* 外部词提示卡片 */}
        {externalWord && (
          <ExternalWordCard
            word={externalWord.word}
            meaning={externalWord.meaning}
            onClose={() => setExternalWord(null)}
          />
        )}

        {/* Toast 提示 */}
        {toast && (
          <div
            style={{
              position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(30,30,30,0.88)', color: '#fff', padding: '8px 20px',
              borderRadius: 20, fontSize: 13, fontWeight: 500, zIndex: 99,
              pointerEvents: 'none',
            }}
          >
            {toast}
          </div>
        )}

        {/* 弹窗动画样式 */}
        <style>{`
          @keyframes modalIn {
            from { opacity: 0; transform: scale(0.92) translateY(16px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}</style>
      </div>
    )
  }

  // ─── 探索模式渲染 ──────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col">
      {/* 顶部栏 */}
      <div
        className="sticky top-0 z-10 bg-white shadow-sm"
        style={{ paddingTop: 'env(safe-area-inset-top, 36px)' }}
      >
        <div className="flex items-center gap-3 px-4 pt-3 pb-3">
          <button
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-xl text-lg font-bold text-gray-500 active:bg-gray-200 transition-colors"
          >
            ←
          </button>
          <h1 className="flex-1 text-xl font-bold text-gray-800">单词星球 🔤</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs text-sky-600 font-bold px-2 py-1 bg-sky-50 rounded-full">
              {xp} XP
            </span>
            <button
              onClick={() => setMode('learn')}
              className="text-xs px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-400 to-indigo-600 text-white font-bold active:scale-95 transition-transform shadow-sm"
            >
              开始学习 →
            </button>
          </div>
        </div>

        {/* Tab 指示 */}
        <div className="flex border-t border-gray-100">
          {[
            { key: 'explore', label: '🌐 浏览词库' },
          ].map(tab => (
            <button
              key={tab.key}
              className="flex-1 text-sm py-2 font-semibold text-sky-600 border-b-2 border-sky-500"
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto pb-8">
        <ExploreMode onSwitchQuiz={() => setMode('learn')} />
      </div>
    </div>
  )
}
