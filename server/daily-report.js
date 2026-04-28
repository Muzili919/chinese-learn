/**
 * 每日学习报告邮件发送（v3）
 *
 * 核心匹配逻辑：card_id前缀 > topic > knowledge_tag
 * card_id前缀最可靠（由题库文件名决定），topic是宏观分类，knowledge_tag是微观分类
 *
 * 用法: node daily-report.js [userId]
 */

const { Pool } = require('pg')
const nodemailer = require('nodemailer')

// ========== 配置（敏感值必须通过环境变量提供） ==========
const required = ['DB_PASS', 'SMTP_PASS', 'DEEPSEEK_API_KEY']
for (const k of required) {
  if (!process.env[k]) { console.error(`Missing env: ${k}`); process.exit(1) }
}

const DB_HOST = process.env.DB_HOST || '127.0.0.1'
const DB_PORT = process.env.DB_PORT || 5432
const DB_NAME = process.env.DB_NAME || 'chinese_learn'
const DB_USER = process.env.DB_USER || 'admin'
const DB_PASS = process.env.DB_PASS

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.qq.com'
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465')
const SMTP_USER = process.env.SMTP_USER || '386323992@qq.com'
const SMTP_PASS = process.env.SMTP_PASS
const MAIL_FROM = process.env.MAIL_FROM || SMTP_USER

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com'

const pool = new Pool({
  host: DB_HOST, port: DB_PORT, database: DB_NAME,
  user: DB_USER, password: DB_PASS,
})

function today() { return new Date().toISOString().split('T')[0] }
function yesterday() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}

// 用户学段映射（从 localStorage 读取但服务端不可用，硬编码主要账号）
function getUserGrade(userId) {
  const JUNIOR_IDS = ['李雨_mo2t5zxm']
  return JUNIOR_IDS.includes(userId) ? 'junior' : 'primary'
}

// 每个学段应做的学科（和星球体系严格绑定）
const GRADE_SUBJECTS = {
  primary: {
    chinese: '语文',      // 小学语文
    english: '英语',
    math: '数学',         // 只含运算/图形/奥数
  },
  junior: {
    chinese_junior: '语文', // 初中语文
    english: '英语',
    math: '数学',          // 含方程/函数/整式/几何
    politics: '政治',
  },
}

// ========== 学科定义 ==========
// 每个学科定义：所有星球（allPlanets）以及 card_id 前缀到星球的映射
const SUBJECTS = {
  chinese: {
    label: '语文',
    allPlanets: ['字词星球', '诗词星球', '成语星球', '句子星球', '阅读星球', '文学星球', '造句星球', '作文星球'],
    // card_id 前缀 → 星球名（优先长前缀）
    prefixMap: {
      vocab: '字词星球', poetry: '诗词星球', idiom: '成语星球', sentence: '句子星球',
      literature: '文学星球', lit: '文学星球', reading: '阅读星球', dictation: '听写星球',
      essay: '作文星球', ch: '字词星球', sw_sw: '听写星球', q: '综合星球',
    },
    // topic → 星球
    topicMap: {
      '字词': '字词星球', '古诗词': '诗词星球', '成语': '成语星球',
      '句子': '句子星球', '文学常识': '文学星球', '阅读理解': '阅读星球',
      '听写': '听写星球', '写作': '作文星球',
    },
    // knowledge_tag → 星球（兜底）
    tagMap: {
      '字词': '字词星球', '词汇': '字词星球', '古诗词': '诗词星球', '古诗': '诗词星球',
      '成语': '成语星球', '句子': '句子星球', '仿写': '句子星球',
      '文学常识': '文学星球', '文学': '文学星球',
      '阅读理解': '阅读星球', '阅读': '阅读星球',
      '听写': '听写星球', '默写': '听写星球',
      '写作': '作文星球', '作文': '作文星球', '写作表达': '作文星球',
      '综合理解': '阅读星球', '自测': '阅读星球', '测试': '阅读星球',
    },
  },
  chinese_junior: {
    label: '初中语文',
    allPlanets: ['基础星球', '古诗文星球', '文言文星球', '阅读星球', '名著星球', '表达星球', '作文星球'],
    prefixMap: {
      jc_basic: '基础星球', jc_poetry: '古诗文星球', jc_cl: '文言文星球',
      jc_novel: '名著星球', jc_expr: '表达星球', jc_reading: '阅读星球',
      jcr: '阅读星球', j2ch: '古诗文星球',
    },
    topicMap: {
      '字音辨析': '基础星球', '字形辨析': '基础星球', '古诗文默写': '古诗文星球',
      '实词解释': '文言文星球', '名著阅读': '名著星球', '仿写句子': '表达星球',
      '现代文阅读': '阅读星球',
    },
    tagMap: {
      '字音辨析': '基础星球', '字形辨析': '基础星球', '词语运用': '基础星球',
      '病句辨析': '基础星球', '标点符号': '基础星球', '句子排序': '基础星球',
      '文学常识': '基础星球', '字音字形综合': '基础星球', '词语综合运用': '基础星球',
      '病句综合辨析': '基础星球', '语言综合运用': '基础星球',
      '古诗文默写': '古诗文星球', '古诗词赏析': '古诗文星球', '古诗文常识': '古诗文星球',
      '文言文翻译': '古诗文星球',
      '实词解释': '文言文星球', '虚词用法': '文言文星球', '句式翻译': '文言文星球', '文言文阅读': '文言文星球',
      '名著阅读': '名著星球',
      '仿写句子': '表达星球', '语言得体': '表达星球', '信息概括': '表达星球',
      '图文转换': '表达星球', '综合性学习': '表达星球',
      '现代文阅读': '阅读星球',
      '综合理解': '阅读星球', '自测': '阅读星球', '写作': '作文星球', '作文': '作文星球',
    },
  },
  math: {
    label: '数学',
    allPlanets: ['运算星球', '图形星球', '奥数星球', '公式速记星球'],  // 小学默认
    allPlanets_junior: ['方程星球', '函数星球', '整式星球', '几何星球', '公式速记星球'],  // 初中追加
    prefixMap: {
      math_b: '运算星球', math_g: '图形星球', math_o: '奥数星球',
      math_calc: '运算星球', math_geom: '图形星球', math_olympiad: '奥数星球',
      formula: '公式速记星球',
      math_je: '方程星球', math_jf: '函数星球', math_ja: '整式星球',
      math_jgeo: '几何星球', math_jg: '几何星球',
    },
    topicMap: {
      '数与运算': '运算星球', '图形与空间': '图形星球', '奥数专题': '奥数星球',
      '方程与不等式': '方程星球', '函数与图像': '函数星球', '整式运算': '整式星球', '几何证明': '几何星球',
    },
    tagMap: {
      '分数运算': '运算星球', '小数运算': '运算星球', '百分数': '运算星球', '比和比例': '运算星球',
      '运算定律': '运算星球', '数的认识': '运算星球', '公式': '运算星球',
      '平面图形': '图形星球', '立体图形': '图形星球', '单位换算': '图形星球',
      '对称与变换': '图形星球', '三角形面积': '图形星球', '四边形面积': '图形星球',
      '圆的周长面积': '图形星球', '组合图形': '图形星球', '角度计算': '图形星球',
      '行程问题': '奥数星球', '工程问题': '奥数星球', '鸡兔同笼': '奥数星球',
      '植树问题': '奥数星球', '年龄问题': '奥数星球', '数论基础': '奥数星球',
      '计数原理': '奥数星球', '巧算速算': '奥数星球', '逻辑推理': '奥数星球',
      '容斥原理': '奥数星球', '抽屉原理': '奥数星球', '最优化': '奥数星球',
      '面积模型': '奥数星球', '牛吃草': '奥数星球', '浓度配比': '奥数星球',
      '一元一次方程': '方程星球', '二元一次方程组': '方程星球', '一元一次不等式': '方程星球',
      '等式性质': '方程星球',
      '一次函数': '函数星球', '反比例函数': '函数星球', '二次函数基础': '函数星球',
      '平面直角坐标系': '函数星球', '函数概念': '函数星球',
      '整式加减': '整式星球', '幂的运算': '整式星球', '整式乘法': '整式星球',
      '乘法公式': '整式星球', '因式分解': '整式星球', '整式除法': '整式星球',
      '相交线与平行线': '几何星球', '三角形全等': '几何星球', '等腰三角形': '几何星球',
      '特殊四边形': '几何星球', '相似三角形': '几何星球', '勾股定理': '几何星球',
      '圆的基本性质': '几何星球', '几何综合': '几何星球',
    },
  },
  english: {
    label: '英语',
    allPlanets: ['联想星球', '词汇星球', '听力星球', '语法星球', '阅读星球', '写作星球', '完形星球', '闪电星球'],
    prefixMap: {
      en_vocab: '词汇星球', en_listen: '听力星球', en_grammar: '语法星球',
      en_reading: '阅读星球', en_writing: '写作星球', en_cloze: '完形星球',
      en_j2_vocab: '词汇星球', en_j2_listen: '听力星球', en_j2_grammar: '语法星球',
      en_j2_reading: '阅读星球', en_j2_writing: '写作星球', en_j2_cloze: '完形星球',
      j2_read: '阅读星球', j2_vocab: '词汇星球',
      wordnet: '联想星球', wordnet_j2: '联想星球',
      en: '词汇星球',
    },
    topicMap: {
      '英语词汇': '词汇星球', '英语听力': '听力星球', '英语语法': '语法星球',
      '英语阅读': '阅读星球', '英语写作': '写作星球', '完形填空': '完形星球',
    },
    tagMap: {
      '英语词汇': '词汇星球', '词汇辨析': '词汇星球', '语境选词': '词汇星球',
      '英语听力': '听力星球', '听力理解': '听力星球',
      '英语语法': '语法星球', '语法': '语法星球',
      '英语阅读': '阅读星球', '阅读理解': '阅读星球', '英语综合': '语法星球',
      '英语写作': '写作星球', '话题写作': '写作星球', '自我介绍': '写作星球',
      '日记写作': '写作星球', '书信写作': '写作星球',
      '完形填空': '完形星球',
    },
  },
  politics: {
    label: '道法',
    allPlanets: ['基石星球', '思辨星球', '洞察星球', '行动星球'],
    prefixMap: {
      politics_choice: '基石星球',    // 选择题 → 基础知识
      politics_analysis: '思辨星球',  // 分析题 → 批判思维
      politics_sa: '洞察星球',         // 简答题 → 社会理解
    },
    topicMap: {},
    tagMap: (() => {
      const base = {
        // 基石：法律知识基础
        '宪法地位': '基石星球', '宪法最高效力': '基石星球', '宪法修改程序': '基石星球',
        '宪法修改意义': '基石星球', '宪法基本精神': '基石星球', '宪法宣誓制度': '基石星球',
        '宪法核心价值': '基石星球', '宪法监督': '基石星球', '宪法与人权保障': '基石星球',
        '宪法与人治法治': '基石星球', '宪法与社会变迁': '基石星球', '宪法意识': '基石星球',
        '宪法权威': '基石星球', '宪法学习': '基石星球', '宪法宣传': '基石星球',
        '法律的特征': '基石星球', '法律特征': '基石星球', '法律知识': '基石星球',
        '法律面前人人平等': '基石星球', '法律溯及力': '基石星球', '法律与道德': '基石星球',
        '法律实践': '基石星球', '违法与犯罪': '基石星球', '法治与自由': '基石星球',
        '法治建设': '基石星球', '依法治国': '基石星球', '依法维权': '基石星球',
        '违宪审查比较': '基石星球',
        '公民基本权利': '基石星球', '公民基本义务': '基石星球', '权利义务统一': '基石星球',
        '权利意识': '基石星球', '权利与义务': '基石星球', '权利救济': '基石星球',
        '权利边界与公共利益': '基石星球',
        '选举权与被选举权': '基石星球', '选举权': '基石星球', '监督权': '基石星球',
        '通信自由和秘密': '基石星球',
        '人身自由权': '基石星球', '人格尊严权': '基石星球', '人格尊严': '基石星球',
        '劳动权': '基石星球', '劳动权益': '基石星球', '受教育权保障': '基石星球',
        '财产权': '基石星球', '肖像权': '基石星球', '知识产权': '基石星球',
        '隐私权': '基石星球', '隐私权保护': '基石星球', '住宅不受侵犯': '基石星球',
        '正当防卫': '基石星球', '行政诉讼': '基石星球', '法律援助': '基石星球',
        '人民当家作主': '基石星球', '人民代表大会制度': '基石星球', '国家机构': '基石星球',
        // 思辨：分析能力与价值判断
        '批判性思维': '思辨星球', '价值冲突': '思辨星球', '道德两难': '思辨星球',
        '公平正义': '思辨星球', '社会公平正义': '思辨星球', '公平意识': '思辨星球',
        '法治与德治关系': '思辨星球', '竞争与合作': '思辨星球', '合作与竞争': '思辨星球',
        '认识自我': '思辨星球', '自我价值': '思辨星球', '自尊自信': '思辨星球',
        '情绪与认知': '思辨星球', '情绪调控': '思辨星球', '情绪管理': '思辨星球',
        '心理健康': '思辨星球', '心理调适': '思辨星球', '挫折应对': '思辨星球',
        '人生价值': '思辨星球', '理想与现实': '思辨星球', '理性消费与价值观': '思辨星球',
        // 洞察：社会理解与国家制度
        '习近平新时代中国特色社会主义思想': '洞察星球', '基本国情': '洞察星球',
        '基本路线': '洞察星球', '科学发展观': '洞察星球',
        '改革开放': '洞察星球', '共同富裕': '洞察星球',
        '科技创新': '洞察星球', '科技发展': '洞察星球',
        '民族区域自治': '洞察星球', '民族团结': '洞察星球', '一国两制': '洞察星球',
        '特别行政区': '洞察星球', '基层群众自治': '洞察星球', '公民政治参与': '洞察星球',
        '国家安全': '洞察星球', '共享经济': '洞察星球', '社会公德': '洞察星球',
        '文化自信': '洞察星球', '文化传承': '洞察星球', '传统文化': '洞察星球',
        '体育精神': '洞察星球', '爱国主义': '洞察星球', '粮食安全': '洞察星球',
        '文明旅游': '洞察星球',
        // 行动：生活实践
        '网络生活': '行动星球', '网络素养': '行动星球', '网络交友安全': '行动星球',
        '网络暴力与媒介素养': '行动星球', '网络法律意识': '行动星球',
        '网络侵权与隐私权': '行动星球', '网络文明': '行动星球', '网络治理': '行动星球',
        '消费者权益': '行动星球', '消费者权益保护': '行动星球', '合理消费': '行动星球',
        '公益服务': '行动星球', '志愿服务': '行动星球', '社区参与': '行动星球',
        '社会责任': '行动星球', '责任担当': '行动星球', '责任与担当': '行动星球',
        '服务社会': '行动星球',
        '未成年人保护': '行动星球', '预防未成年人犯罪': '行动星球',
        '同学交往': '行动星球', '师生交往': '行动星球', '尊师重教': '行动星球',
        '异性交往': '行动星球', '孝敬父母': '行动星球', '亲子关系': '行动星球',
        '亲子关系与沟通': '行动星球', '友谊与原则': '行动星球', '尊重与平等': '行动星球',
        '珍爱生命': '行动星球', '敬畏生命': '行动星球', '生命教育与自我保护': '行动星球',
        '安全演练': '行动星球',
        '诚信': '行动星球', '诚信做人': '行动星球', '诚信社会': '行动星球',
        '诚信考试': '行动星球', '诚信与道德选择': '行动星球',
        '规则意识': '行动星球', '规则意识深化': '行动星球', '维护秩序': '行动星球',
        '遵守交规': '行动星球',
        '环保意识': '行动星球', '环保实践': '行动星球', '生态文明': '行动星球',
        '坚强意志': '行动星球', '磨砺意志': '行动星球', '审美情趣': '行动星球',
        '学会学习': '行动星球', '教育惩戒': '行动星球', '教育评价': '行动星球',
        '个人与集体': '行动星球', '个人信息保护': '行动星球', '自我保护': '行动星球',
        '校园欺凌': '行动星球', '青春期保护': '行动星球',
        'AI伦理与隐私保护': '行动星球',
        '道法': '基石星球',  // 通用兜底（DB记录可能只有这个tag）
      }
      return base
    })(),
  },
}

// ========== 匹配逻辑 ==========
// 优先级：card_id前缀 > topic > knowledge_tag > 学科兜底

function inferSubject(subject, cardId) {
  if (subject && subject !== 'chinese') return subject
  if (!cardId) return subject || 'chinese'
  if (/^(en_|en-vocab|en-grammar|english|enlisten|j2_read|j2_vocab|ai_english)/.test(cardId)) return 'english'
  if (/^(math_|math-|calc|geometry|algebra|formula|ai_math)/.test(cardId)) return 'math'
  if (/^(politics|pol_)/.test(cardId)) return 'politics'
  if (/^(jc_|j2ch|junior|jcr)/.test(cardId)) return 'chinese_junior'
  return subject || 'chinese'
}

function getPlanet(subject, knowledgeTag, cardId, topic) {
  const realSubject = inferSubject(subject, cardId)
  const config = SUBJECTS[realSubject]
  if (!config) return '其他'

  // 1. card_id 前缀匹配（最可靠，由题库文件名决定）
  if (cardId) {
    const parts = cardId.split('_')
    for (let len = Math.min(parts.length - 1, 3); len >= 1; len--) {
      const prefix = parts.slice(0, len).join('_')
      const planet = config.prefixMap[prefix]
      if (planet) return planet
    }
    if (cardId.startsWith('selftest_')) return '自测'
  }

  // 2. topic 匹配（宏观分类）
  if (topic) {
    const planet = config.topicMap[topic]
    if (planet) return planet
  }

  // 3. knowledge_tag 匹配（微观分类，兜底）
  if (knowledgeTag) {
    const planet = config.tagMap[knowledgeTag]
    if (planet) return planet
    // 模糊匹配
    for (const [tag, planet] of Object.entries(config.tagMap)) {
      if (knowledgeTag.includes(tag) || tag.includes(knowledgeTag)) return planet
    }
  }

  return '其他'
}

// ========== 数据查询 ==========

async function getDayRecords(userId, date) {
  const r = await pool.query(
    `SELECT card_id, subject, correct, timestamp, knowledge_tag, topic, time_spent, score, selected_answer
     FROM answer_records WHERE user_id = $1 AND timestamp::text LIKE $2`,
    [userId, date + '%']
  )
  return r.rows
}

async function getUsersWithEmail() {
  const r = await pool.query('SELECT id, name, parent_email FROM users ORDER BY created_at DESC')
  return r.rows
}

async function getUserWithEmail(userId) {
  const r = await pool.query('SELECT id, name, parent_email FROM users WHERE id = $1', [userId])
  return r.rows
}

// ========== 报告生成 ==========

function buildReport(todayRecords, yesterdayRecords, grade) {
  const isJunior = grade === 'junior'
  const gradeSubjects = GRADE_SUBJECTS[grade] || GRADE_SUBJECTS.primary

  // 按学段过滤：小学生过滤掉初中数学题，初中生过滤掉小学语文题
  const juniorMathPrefixes = ['math_je', 'math_jf', 'math_ja', 'math_jgeo', 'math_jg']
  const primaryChinesePrefixes = ['vocab_', 'poetry_', 'idiom_', 'sentence_', 'lit_', 'literature_', 'dictation_']

  const filteredRecords = todayRecords.filter(r => {
    const subj = inferSubject(r.subject, r.card_id)
    const cid = r.card_id || ''

    // 小学生：只保留小学内容
    if (!isJunior) {
      // 去掉初中数学题（函数/方程/整式/几何证明）
      if (subj === 'math' && juniorMathPrefixes.some(p => cid.startsWith(p))) return false
      // 去掉初中语文题（jc_* 前缀）
      if (subj === 'chinese_junior') return false
      // 去掉政治题
      if (subj === 'politics') return false
    }

    // 初中生：只保留初中内容
    if (isJunior) {
      // 去掉小学语文题（vocab/poetry/idiom 等前缀）
      if (subj === 'chinese' && primaryChinesePrefixes.some(p => cid.startsWith(p))) return false
      // 去掉小学数学题（math_b/math_g/math_o 前缀）
      const primaryMathPrefixes = ['math_b', 'math_g', 'math_o', 'math_calc', 'math_geom', 'math_olympiad', 'formula']
      if (subj === 'math' && primaryMathPrefixes.some(p => cid.startsWith(p))) return false
    }

    return true
  })

  // 按学科分组（用 inferSubject 修正）
  const subjectData = {}
  for (const r of filteredRecords) {
    let subj = inferSubject(r.subject, r.card_id)
    // 初中生：所有 'chinese' 记录归入 chinese_junior（过滤已去掉明确的小学语文题）
    if (isJunior && subj === 'chinese') subj = 'chinese_junior'
    if (!subjectData[subj]) subjectData[subj] = { records: [], planetBuckets: {} }
    subjectData[subj].records.push(r)

    const planet = getPlanet(subj, r.knowledge_tag, r.card_id, r.topic)
    if (!subjectData[subj].planetBuckets[planet]) {
      subjectData[subj].planetBuckets[planet] = { total: 0, correct: 0, totalTime: 0, wrongs: [] }
    }
    const b = subjectData[subj].planetBuckets[planet]
    b.total++
    if (r.correct) b.correct++
    else b.wrongs.push(r)
    b.totalTime += (r.time_spent || 0)
  }

  // 遍历学段定义的所有学科（包括今天没做的也生成）
  const report = {}
  for (const [subjKey, subjLabel] of Object.entries(gradeSubjects)) {
    const config = SUBJECTS[subjKey]
    if (!config) continue

    const data = subjectData[subjKey] || { records: [], planetBuckets: {} }
    const total = data.records.length
    const hasData = total > 0

    // 星球列表
    let allPlanetNames
    if (subjKey === 'math' && isJunior && config.allPlanets_junior) {
      allPlanetNames = [...config.allPlanets_junior]  // 初中数学只用初中星球
    } else {
      allPlanetNames = [...(config.allPlanets || [])]
    }

    // 无数据学科：全星球标记未练习
    if (!hasData) {
      report[subjKey] = {
        label: subjLabel,
        total: 0, correct: 0, accuracy: 0, accChange: null,
        totalTime: 0, avgTime: '0',
        effort: '未练习', effortColor: '#9ca3af',
        planets: allPlanetNames.map(name => ({ name, total: 0, correct: 0, accuracy: 0, avgTime: 0, done: false })),
        diagnosis: '今日未练习此科目',
      }
      continue
    }

    const correct = data.records.filter(r => r.correct).length
    const accuracy = Math.round(correct / total * 100)
    const totalTime = data.records.reduce((s, r) => s + (r.time_spent || 0), 0)
    const avgTime = (totalTime / total).toFixed(1)

    let effort = '正常', effortColor = '#2563eb'
    if (avgTime < 3 && accuracy < 50) { effort = '敷衍'; effortColor = '#dc2626' }
    else if (avgTime < 3 && accuracy >= 50) { effort = '过快'; effortColor = '#f59e0b' }
    else if (accuracy >= 80 && avgTime >= 5) { effort = '认真'; effortColor = '#16a34a' }
    else if (accuracy < 40) { effort = '需关注'; effortColor = '#f59e0b' }

    const yRecs = yesterdayRecords.filter(r => {
      let ys = inferSubject(r.subject, r.card_id)
      if (isJunior && ys === 'chinese') ys = 'chinese_junior'
      return ys === subjKey
    })
    const yAcc = yRecs.length > 0 ? Math.round(yRecs.filter(r => r.correct).length / yRecs.length * 100) : null
    const accChange = yAcc !== null ? accuracy - yAcc : null

    const planets = allPlanetNames.map(name => {
      const b = data.planetBuckets[name]
      if (!b) return { name, total: 0, correct: 0, accuracy: 0, avgTime: 0, done: false }
      const pAcc = Math.round(b.correct / b.total * 100)
      const pAvgTime = (b.totalTime / b.total).toFixed(1)
      const wrongCount = b.total - b.correct

      let errorType = null, errorDesc = ''
      if (wrongCount > 0) {
        const fastWrongs = b.wrongs.filter(r => (r.time_spent || 0) < 3).length
        if (pAcc < 40) { errorType = 'concept'; errorDesc = `正确率仅${pAcc}%，基础没掌握` }
        else if (fastWrongs >= wrongCount * 0.6) { errorType = 'careless'; errorDesc = `${fastWrongs}/${wrongCount}题过快` }
        else { errorType = 'partial'; errorDesc = `${wrongCount}题出错，不够熟练` }
      }

      let speedLabel = ''
      if (parseFloat(pAvgTime) < 3 && b.total >= 2) speedLabel = '过快'

      return { name, total: b.total, correct: b.correct, accuracy: pAcc, avgTime: pAvgTime, wrongCount, errorType, errorDesc, speedLabel, done: true }
    })

    const weakPlanets = planets.filter(p => p.done && p.accuracy < 60 && p.total >= 2)
    const fastPlanets = planets.filter(p => p.done && parseFloat(p.avgTime) < 3 && p.total >= 2)
    const unDonePlanets = planets.filter(p => !p.done)
    let diagnosis = ''
    if (accuracy >= 90) diagnosis = '表现优秀！'
    else if (accuracy >= 70) diagnosis = `整体不错${weakPlanets.length ? '，' + weakPlanets.map(p => p.name).join('、') + '需加强' : ''}`
    else if (accuracy >= 50) diagnosis = `正确率${accuracy}%${weakPlanets.length ? '，薄弱在' + weakPlanets.map(p => `${p.name}(${p.accuracy}%)`).join('、') : ''}`
    else diagnosis = `正确率${accuracy}%${weakPlanets.length ? '，需攻克' + weakPlanets.map(p => p.name).join('、') : ''}`
    if (fastPlanets.length) diagnosis += `。${fastPlanets.map(p => p.name).join('、')}过快`
    if (unDonePlanets.length) diagnosis += `。${unDonePlanets.map(p => p.name).join('、')}未练习`

    report[subjKey] = {
      label: subjLabel,
      total, correct, accuracy, accChange,
      totalTime: Math.round(totalTime), avgTime,
      effort, effortColor,
      planets, diagnosis,
    }
  }
  return report
}

async function generateAIAdvice(userName, report) {
  if (!DEEPSEEK_API_KEY) return '（AI 建议暂时不可用）'

  const details = Object.entries(report).map(([, s]) => {
    const pLines = s.planets.filter(p => p.done).map(p =>
      `${p.name}：${p.total}题 对${p.correct}题(${p.accuracy}%) 均耗时${p.avgTime}s${p.errorType ? ' | ' + p.errorDesc : ''}${p.speedLabel ? ' ⚡' + p.speedLabel : ''}`
    ).join('\n')
    const unDone = s.planets.filter(p => !p.done).map(p => p.name).join('、')
    return `【${s.label}】${s.total}题 正确率${s.accuracy}% ${s.effort}
${pLines}${unDone ? '\n未练习：' + unDone : ''}
诊断：${s.diagnosis}`
  }).join('\n\n')

  const prompt = `你是经验丰富的家教老师，给家长写今日学习反馈。简短、口语化、说人话。

学生：${userName}
今日详情：
${details}

写4段反馈（每段不超过50字）：
1. 今天做了什么，整体如何
2. 哪些星球好，哪些弱（带正确率）
3. 错误归因：概念不懂/粗心/不熟
4. 明天建议：哪个星球怎么练

不要套话，要有具体内容。`

  try {
    const resp = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${DEEPSEEK_API_KEY}` },
      body: JSON.stringify({ model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }], max_tokens: 600, temperature: 0.7 }),
    })
    const data = await resp.json()
    return data.choices?.[0]?.message?.content || '（AI 建议生成失败）'
  } catch (e) {
    console.error('AI 生成失败:', e.message)
    return '（AI 建议暂时不可用）'
  }
}

// ========== 邮件 HTML ==========

function buildEmailHTML(userName, report, aiAdvice, todayDate) {
  const totalQ = Object.values(report).reduce((s, d) => s + d.total, 0)
  const totalCorrect = Object.values(report).reduce((s, d) => s + d.correct, 0)
  const totalAcc = totalQ > 0 ? Math.round(totalCorrect / totalQ * 100) : 0
  const totalTimeMin = Math.round(Object.values(report).reduce((s, d) => s + d.totalTime, 0) / 60)
  const subjectCount = Object.keys(report).length

  // 已完成星球总数 / 应完成星球总数
  const allPlanets = Object.values(report).reduce((s, d) => s + d.planets.length, 0)
  const donePlanets = Object.values(report).reduce((s, d) => s + d.planets.filter(p => p.done).length, 0)

  const ERROR_ICONS = {
    concept: { icon: '🔴', label: '概念薄弱' },
    careless: { icon: '🟡', label: '粗心马虎' },
    partial: { icon: '🔵', label: '部分不熟' },
  }

  // 每个学科的 HTML
  const subjectBlocks = Object.entries(report).map(([, s]) => {
    const effortBg = s.effort === '认真' ? '#f0fdf4' : s.effort === '敷衍' ? '#fef2f2' : s.effort === '过快' ? '#fff7ed' : s.effort === '需关注' ? '#fff7ed' : '#eff6ff'
    const accColor = s.accuracy >= 80 ? '#16a34a' : s.accuracy >= 60 ? '#2563eb' : '#dc2626'
    const change = s.accChange !== null
      ? (s.accChange >= 0 ? `<span style="color:#16a34a;font-size:13px"> ↑${s.accChange}%</span>` : `<span style="color:#dc2626;font-size:13px"> ↓${Math.abs(s.accChange)}%</span>`)
      : ''

    const planetRows = s.planets.map(p => {
      if (!p.done) {
        return `<tr>
          <td style="padding:6px 10px;font-size:13px;color:#d1d5db">⬜ ${p.name}</td>
          <td style="padding:6px;font-size:13px;text-align:center;color:#e5e7eb">—</td>
          <td style="padding:6px 10px;text-align:right;font-size:12px;color:#d1d5db">未练习</td>
        </tr>`
      }
      const pAccColor = p.accuracy >= 80 ? '#16a34a' : p.accuracy >= 60 ? '#2563eb' : '#dc2626'
      const barW = Math.max(p.accuracy, 5)
      const barColor = p.accuracy >= 80 ? '#22c55e' : p.accuracy >= 60 ? '#3b82f6' : '#ef4444'
      const timeWarning = parseFloat(p.avgTime) < 3 ? ' <span style="color:#f59e0b;font-size:11px">⚡</span>' : ''
      let errorTag = ''
      if (p.errorType) {
        const ei = ERROR_ICONS[p.errorType]
        errorTag = `<div style="margin-top:3px;padding:2px 8px;border-radius:5px;background:#fef3c7;font-size:10px;color:#92400e">${ei.icon} ${p.errorDesc}</div>`
      }
      return `<tr>
        <td style="padding:6px 10px;font-size:14px;color:#374151">${p.name}</td>
        <td style="padding:6px;font-size:14px;text-align:center;color:#6b7280">${p.total}</td>
        <td style="padding:6px 10px;text-align:right">
          <span style="font-size:15px;font-weight:700;color:${pAccColor}">${p.accuracy}%</span>${timeWarning}
        </td>
      </tr>
      <tr><td colspan="3" style="padding:0 10px 4px">
        <div style="background:#f3f4f6;border-radius:3px;height:4px;overflow:hidden">
          <div style="width:${barW}%;height:100%;background:${barColor};border-radius:3px"></div>
        </div>
        ${errorTag}
      </td></tr>`
    }).join('')

    const diagHtml = s.diagnosis ? `
      <div style="padding:8px 16px;background:#f8fafc;border-top:1px solid #f3f4f6;font-size:12px;color:#475569;line-height:1.5">
        📋 ${s.diagnosis}
      </div>` : ''

    return `
    <div style="background:white;border-radius:14px;border:1px solid #e5e7eb;margin-bottom:12px;overflow:hidden">
      <div style="padding:12px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #f3f4f6">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          <span style="font-size:16px;font-weight:700;color:#1f2937">${s.label}</span>
          <span style="font-size:13px;color:#9ca3af">${s.total}题</span>
          <span style="font-size:16px;font-weight:800;color:${accColor}">${s.accuracy}%${change}</span>
        </div>
        <span style="font-size:11px;padding:3px 10px;border-radius:12px;background:${effortBg};color:${s.effortColor};font-weight:700">${s.effort}</span>
      </div>
      <table style="width:100%;border-collapse:collapse">
        <tr style="background:#f9fafb"><td style="padding:4px 10px;font-size:10px;color:#9ca3af">星球</td><td style="padding:4px;font-size:10px;color:#9ca3af;text-align:center">题数</td><td style="padding:4px 10px;font-size:10px;color:#9ca3af;text-align:right">正确率</td></tr>
        ${planetRows}
      </table>
      ${diagHtml}
    </div>`
  }).join('')

  // 错误归因总结
  const errors = []
  for (const [, s] of Object.entries(report)) {
    for (const p of s.planets) {
      if (p.done && p.errorType) errors.push({ subject: s.label, planet: p.name, type: p.errorType, desc: p.errorDesc })
    }
  }
  const errorHtml = errors.length > 0 ? `
    <div style="background:white;border-radius:14px;border:1px solid #e5e7eb;margin-bottom:12px;padding:14px">
      <div style="font-size:14px;font-weight:700;color:#1f2937;margin-bottom:8px">🔍 错误归因</div>
      ${errors.map(e => {
        const ei = ERROR_ICONS[e.type]
        return `<div style="padding:6px 10px;border-radius:8px;background:#fefce8;border:1px solid #fde68a;margin-bottom:4px">
          <span style="font-size:12px;font-weight:600;color:#1f2937">${ei.icon} ${e.subject} · ${e.planet}</span>
          <div style="font-size:11px;color:#92400e;margin-top:1px">${e.desc}</div>
        </div>`
      }).join('')}
    </div>` : ''

  // 打卡清单
  const checklistHtml = `
    <div style="background:white;border-radius:14px;border:1px solid #e5e7eb;margin-bottom:12px;padding:14px">
      <div style="font-size:14px;font-weight:700;color:#1f2937;margin-bottom:8px">📋 今日打卡清单</div>
      <div style="display:flex;flex-direction:column;gap:4px">
        ${Object.entries(report).map(([, s]) => {
          const done = s.planets.filter(p => p.done).length
          const total = s.planets.length
          const icon = done === total ? '✅' : done > 0 ? '🔶' : '⬜'
          return `<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 10px;border-radius:8px;background:${done === total ? '#f0fdf4' : done > 0 ? '#fffbeb' : '#f9fafb'}">
            <span style="font-size:13px;font-weight:600;color:#1f2937">${icon} ${s.label}</span>
            <span style="font-size:12px;color:${done === total ? '#16a34a' : '#6b7280'}">${done}/${total} 星球完成 · ${s.total}题 · ${s.accuracy}%</span>
          </div>`
        }).join('')}
      </div>
    </div>`

  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:100%;margin:0 auto;overflow:hidden">

  <div style="background:linear-gradient(135deg,#1e40af,#7c3aed);padding:28px 20px 20px;color:white">
    <div style="font-size:22px;font-weight:800;margin-bottom:4px">📊 ${userName} 的学习日报</div>
    <div style="opacity:0.75;font-size:14px;margin-bottom:16px">${todayDate}</div>
    <div style="display:flex;gap:0;background:rgba(255,255,255,0.12);border-radius:14px;overflow:hidden">
      <div style="flex:1;text-align:center;padding:14px 0"><div style="font-size:26px;font-weight:800">${totalQ}</div><div style="opacity:0.7;font-size:12px;margin-top:2px">总题数</div></div>
      <div style="flex:1;text-align:center;padding:14px 0;border-left:1px solid rgba(255,255,255,0.15)"><div style="font-size:26px;font-weight:800">${totalAcc}%</div><div style="opacity:0.7;font-size:12px;margin-top:2px">正确率</div></div>
      <div style="flex:1;text-align:center;padding:14px 0;border-left:1px solid rgba(255,255,255,0.15)"><div style="font-size:26px;font-weight:800">${donePlanets}/${allPlanets}</div><div style="opacity:0.7;font-size:12px;margin-top:2px">星球</div></div>
      <div style="flex:1;text-align:center;padding:14px 0;border-left:1px solid rgba(255,255,255,0.15)"><div style="font-size:26px;font-weight:800">${totalTimeMin || '<1'}分</div><div style="opacity:0.7;font-size:12px;margin-top:2px">总用时</div></div>
    </div>
  </div>

  <div style="padding:16px">
    ${checklistHtml}
    ${subjectBlocks}
    ${errorHtml}

    <div style="font-size:14px;font-weight:700;color:#1f2937;margin-bottom:8px">🤖 老师点评</div>
    <div style="background:linear-gradient(135deg,#eff6ff,#f5f3ff);border-radius:14px;padding:14px;font-size:13px;line-height:1.8;color:#374151;white-space:pre-line">${aiAdvice}</div>
  </div>

  <div style="padding:14px 20px;text-align:center;color:#9ca3af;font-size:11px;border-top:1px solid #e5e7eb">
    知识星球 · 每日学习报告 · 自动发送
  </div>
</div>
</body></html>`
}

async function sendMail(to, subject, html) {
  if (!SMTP_USER || !SMTP_PASS) { console.log('⚠️ SMTP 未配置'); return false }
  const transporter = nodemailer.createTransport({ host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_PORT === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } })
  await transporter.sendMail({ from: `"知识星球" <${MAIL_FROM}>`, to, subject, html })
  return true
}

// ========== 主流程 ==========

async function generateAndSendForUser(user) {
  const todayDate = today()
  const todayRecords = await getDayRecords(user.id, todayDate)
  if (todayRecords.length === 0) { console.log(`  ${user.name}: 今日无答题，跳过`); return null }

  const yesterdayRecords = await getDayRecords(user.id, yesterday())
  const grade = getUserGrade(user.id)
  const report = buildReport(todayRecords, yesterdayRecords, grade)

  for (const [, s] of Object.entries(report)) {
    const done = s.planets.filter(p => p.done).length
    console.log(`  ${s.label}: ${s.total}题 ${s.accuracy}% ${s.effort} | ${done}/${s.planets.length}星球 | ${s.planets.filter(p=>p.done).map(p=>`${p.name}(${p.accuracy}%)`).join(', ')}`)
  }

  const aiAdvice = await generateAIAdvice(user.name, report)
  const html = buildEmailHTML(user.name, report, aiAdvice, todayDate)

  const recipients = user.parent_email ? user.parent_email.split(',').map(s => s.trim()).filter(Boolean) : []
  if (!recipients.length) { console.log(`  ${user.name}: 未设邮箱`); return { html, report, sent: false } }

  const subject = `📊 ${user.name}的学习日报 | ${todayDate} | ${todayRecords.length}题`
  for (const email of recipients) {
    try { await sendMail(email, subject, html); console.log(`  ✅ → ${email}`) }
    catch (e) { console.error(`  ❌ ${email}: ${e.message}`) }
  }
  return { html, report, sent: true }
}

async function main() {
  const userId = process.argv[2]
  console.log(`📅 每日学习报告 v3 - ${today()}`)
  const users = userId ? await getUserWithEmail(userId) : await getUsersWithEmail()
  if (!users.length) { console.log('没找到用户'); return }
  for (const user of users) {
    console.log(`\n${user.name} (${user.id})`)
    await generateAndSendForUser(user)
  }
  await pool.end()
}

main().catch(e => { console.error('❌', e); process.exit(1) })
