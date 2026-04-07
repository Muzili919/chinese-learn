/**
 * 题库格式转换脚本
 * 把 /Users/xiaolongmu/Documents/题库资料/ 里的新题库
 * 转换为 App 期望的格式，输出到 src/data/
 */

const fs = require('fs')
const path = require('path')

const SRC_DIR = '/Users/xiaolongmu/Documents/题库资料'
const OUT_DIR = path.join(__dirname, '../src/data')

// ── 解析 Markdown+JSON 混合文件（支持 ```json 和裸 json\n{ 两种格式）────
function parseMarkdownJson(content) {
  const results = []
  // 找出所有以 { 开头的 JSON 块起始位置（紧跟在 ```json 或 json\n 之后）
  const startPositions = []
  const re = /(?:```json|(?:^|\n)json\r?\n)\s*(\{)/gm
  let m
  while ((m = re.exec(content)) !== null) {
    // m.index + m[0].length - 1 是 { 的位置
    startPositions.push(m.index + m[0].length - 1)
  }
  for (const start of startPositions) {
    // 用括号计数找到配对的 }
    let depth = 0, end = -1, inStr = false, escape = false
    for (let i = start; i < content.length; i++) {
      const ch = content[i]
      if (escape) { escape = false; continue }
      if (ch === '\\' && inStr) { escape = true; continue }
      if (ch === '"') { inStr = !inStr; continue }
      if (inStr) continue
      if (ch === '{') depth++
      else if (ch === '}') {
        depth--
        if (depth === 0) { end = i; break }
      }
    }
    if (end < 0) continue
    try {
      const obj = JSON.parse(content.slice(start, end + 1))
      if (obj.question !== undefined) results.push(obj)
    } catch (e) { /* skip */ }
  }
  return results
}

// ── 解析纯 JSON 数组文件 ─────────────────────────────────────────
function parsePureJson(content) {
  const arr = JSON.parse(content)
  return Array.isArray(arr) ? arr : []
}

// ── analysis 文本化 ──────────────────────────────────────────────
function buildAnalysis(exp) {
  if (!exp) return ''
  const parts = []
  if (exp['考点']) parts.push(`考点：${exp['考点']}`)
  if (exp['解题思路']) parts.push(`解题思路：${exp['解题思路']}`)
  if (exp['总结']) parts.push(`总结：${exp['总结']}`)
  return parts.join('\n\n')
}

// ── ability_tag 推断 ─────────────────────────────────────────────
function inferAbilityTag(question, knowledgeTag, hasOptions) {
  if (knowledgeTag === '字词') {
    if (/读音|字音|注音|拼音/.test(question)) return '字音辨析'
    if (/字形|错别字|书写/.test(question)) return '字形辨析'
    return '词义理解'
  }
  if (knowledgeTag === '古诗词') {
    if (!hasOptions) return '诗句默写'
    if (/作者|写于|朝代|谁写/.test(question)) return '诗词常识'
    return '古诗鉴赏'
  }
  if (knowledgeTag === '成语') {
    if (/使用|运用|恰当|正确/.test(question)) return '成语运用'
    return '成语理解'
  }
  if (knowledgeTag === '句子') {
    if (/病句/.test(question)) return '病句辨析'
    if (/修辞/.test(question)) return '修辞手法'
    if (/关联词/.test(question)) return '关联词'
    return '句式转换'
  }
  if (knowledgeTag === '文学常识') {
    if (/名著|水浒|红楼|三国|西游/.test(question)) return '四大名著'
    if (/作家|诗人|作者|谁/.test(question)) return '作家作品'
    if (/标点/.test(question)) return '标点符号'
    return '文学知识'
  }
  if (knowledgeTag === '阅读理解') {
    if (/概括|主要内容|主旨/.test(question)) return '主旨概括'
    if (/信息|找出|几点|多少/.test(question)) return '信息提取'
    if (/推断|推理|猜测|最有可能/.test(question)) return '推断想象'
    if (/词语|句子|作用|意思/.test(question)) return '词句理解'
    return '阅读理解'
  }
  return '综合'
}

// ── 核心转换函数 ─────────────────────────────────────────────────
function convertQuestion(raw, knowledgeTag, index, idPrefix) {
  const hasOptions = raw.options && Object.keys(raw.options).length > 0
  const isOpenEnded = !hasOptions

  // options 数组
  const optionsArr = hasOptions
    ? Object.entries(raw.options).map(([k, v]) => `${k}. ${v}`)
    : []

  // 判断类型
  let type
  if (isOpenEnded) {
    type = knowledgeTag === '阅读理解' ? 'open_ended' : 'fill_blank'
  } else {
    type = 'single_choice'
  }

  // answer
  let answer
  if (type === 'single_choice') {
    // raw.answer 可能是 "B" 或 "B. text"
    const letter = raw.answer.trim().charAt(0)
    answer = optionsArr.find(o => o.startsWith(letter + '.')) || raw.answer
  } else {
    answer = raw.answer
  }

  const analysis = buildAnalysis(raw.explanation)
  const ability = inferAbilityTag(raw.question, knowledgeTag, hasOptions)

  return {
    id: `${idPrefix}_${String(index + 1).padStart(3, '0')}`,
    type,
    question: raw.question,
    options: optionsArr,
    answer,
    analysis,
    knowledge_tag: knowledgeTag,
    ability_tag: ability,
    difficulty: 2,
    grade: 5,
  }
}

// ── 处理单个文件 ─────────────────────────────────────────────────
function processFile(filename, knowledgeTag, idPrefix, isPureJson = false) {
  const filepath = path.join(SRC_DIR, filename)
  const content = fs.readFileSync(filepath, 'utf-8')
  const raws = isPureJson ? parsePureJson(content) : parseMarkdownJson(content)
  const questions = raws.map((raw, i) => convertQuestion(raw, knowledgeTag, i, idPrefix))
  console.log(`  ${filename}: ${questions.length} 题`)
  return questions
}

// ── 主流程 ───────────────────────────────────────────────────────
console.log('开始转换题库...\n')

const jobs = [
  { file: '字词星球_完整.json',          tag: '字词',     prefix: 'vocab',    out: 'questions_vocab.json',       pure: false },
  { file: '诗词星球_100题.json',         tag: '古诗词',   prefix: 'poetry',   out: 'questions_poetry.json',      pure: false },
  { file: '成语星球_完整_clean.json',    tag: '成语',     prefix: 'idiom',    out: 'questions_idiom.json',       pure: false },
  { file: '句子星球_完整.json',          tag: '句子',     prefix: 'sentence', out: 'questions_sentence.json',    pure: false },
  { file: '文学星球_完整.json',          tag: '文学常识', prefix: 'lit',      out: 'questions_literature.json',  pure: false },
  { file: '阅读星球_完整_clean.json',    tag: '阅读理解', prefix: 'reading',  out: 'questions_reading.json',     pure: true  },
]

for (const job of jobs) {
  const questions = processFile(job.file, job.tag, job.prefix, job.pure)
  const outPath = path.join(OUT_DIR, job.out)
  fs.writeFileSync(outPath, JSON.stringify(questions, null, 2), 'utf-8')
  console.log(`  ✓ 写入 src/data/${job.out}\n`)
}

console.log('全部转换完成！')
