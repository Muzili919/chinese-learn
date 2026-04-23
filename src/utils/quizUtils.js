/**
 * 题目类型检测、解析和答案匹配的纯函数
 * 从 DuolingoStyleQuiz.jsx 抽取，全项目答题逻辑共用
 */

// ─── 基础工具 ─────────────────────────────────────────────

export function normalize(s) {
  return (s || '').trim()
    .replace(/（[0-9]）/g, ' ')
    .replace(/[，。！？、；：""''《》（）\s]/g, '')
}

export function normalizeAnswer(str) {
  if (!str) return ''
  return String(str).trim()
    .replace(/^[a-d]\.\s*/i, '')
    .replace(/[①-⑩]/g, m => String.fromCharCode(m.charCodeAt(0) - 0x2460 + 0x31))
    .replace(/（([0-9]+)）/g, '$1')
    .replace(/\(([0-9]+)\)/g, '$1')
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

// ─── 答案匹配 ─────────────────────────────────────────────

export function isAnswerCorrect(userAnswer, correctAnswer, options) {
  const ua = normalizeAnswer(userAnswer)
  const ca = normalizeAnswer(correctAnswer)
  const uStr = String(userAnswer || '').trim()
  const cStr = String(correctAnswer || '').trim()

  if (ua === ca) return true

  if (/^[a-d]$/i.test(uStr)) {
    const letter = uStr.toUpperCase()
    if (new RegExp(`^${letter}[.、．\\s]`, 'i').test(cStr)) return true
    if (options && options.length) {
      const matchedOpt = options.find(o => new RegExp(`^${letter}[.、．\\s]`, 'i').test(String(o).trim()))
      if (matchedOpt !== undefined) {
        return ua === normalizeAnswer(matchedOpt)
      }
    }
  }

  if (/^[a-d]$/i.test(cStr) && options && options.length) {
    const targetLetter = cStr.toUpperCase()
    const matchedOpt = options.find(o => new RegExp(`^${targetLetter}[.、．\\s]`, 'i').test(String(o).trim()))
    if (matchedOpt !== undefined) {
      return ua === normalizeAnswer(matchedOpt)
    }
  }

  if (/^[a-d]$/i.test(uStr) && options && options.length) {
    const userLetter = uStr.toUpperCase()
    const matchedUserOpt = options.find(o => new RegExp(`^${userLetter}[.、．\\s]`, 'i').test(String(o).trim()))
    if (matchedUserOpt !== undefined) {
      return normalizeAnswer(matchedUserOpt) === ca
    }
  }

  if (ua && ca) {
    const stripCore = s => s.replace(/[^a-z0-9.一-鿿]/g, '')
    if (stripCore(ua) === stripCore(ca)) return true
  }

  return false
}

// ─── 题型检测 ─────────────────────────────────────────────

export function isWordBankQ(q) {
  if (q.type !== 'fill_blank') return false
  if (isJudgmentQ(q) || isTypoQ(q) || isOrderQ(q)) return false
  if (!/（[1-9]）/.test(q.answer)) return false
  if (!/__{4,}/.test(q.question)) return false
  const subs = parseWordBankSubAnswers(q.answer)
  return subs.length > 0 && subs.every(a => a.text.length <= 15)
}

export function isMatchingStyleQ(q) {
  return q.type === 'fill_blank'
    && !q.pairs
    && (q.question.includes('左列') || q.question.includes('连一连') || q.question.includes('连起来'))
    && /^[1-9]\./m.test(q.question)
    && /^[A-F]\./m.test(q.question)
    && !isJudgmentQ(q) && !isTypoQ(q) && !isOrderQ(q)
}

export function isJudgmentQ(q) {
  return /打.*[√×]|[√×].*打/.test(q.question) &&
    /（[1-9]）[√×]/.test(q.answer)
}

export function isTypoQ(q) {
  return q.question.includes('错别字') &&
    q.answer.includes('→') &&
    !/[①②③④⑤⑥]/.test(q.answer) &&
    /（[1-9]）[\s　]*[一-鿿]{2}/.test(q.question)
}

export function isOrderQ(q) {
  return /[①②③④⑤⑥]/.test(q.answer) && q.answer.includes('→')
}

export function isMultiSubQ(q) {
  if (q.type !== 'fill_blank') return false
  if (isJudgmentQ(q) || isTypoQ(q) || isOrderQ(q) || isWordBankQ(q) || isMatchingStyleQ(q)) return false
  return /（[2-9]）/.test(q.question) || /（[2-9]）/.test(q.answer)
}

export function isSelfEvalFillQ(q) {
  if (q.type !== 'fill_blank') return false
  if (isJudgmentQ(q) || isTypoQ(q) || isOrderQ(q) || isWordBankQ(q) || isMatchingStyleQ(q) || isMultiSubQ(q)) return false
  if (q.answer && /→|—→/.test(q.answer)) return true
  if (/标点符号|加上.*标点|填.*标点/.test(q.question)) return true
  return false
}

// ─── 解析器 ─────────────────────────────────────────────

export function extractMatchingPairs(q) {
  const leftItems = [...q.question.matchAll(/^([1-9])\.\s*(.+)$/gm)]
    .map(m => ({ num: parseInt(m[1]), text: m[2].trim() }))
  const rightItems = {}
  for (const m of q.question.matchAll(/^([A-F])\.\s*(.+)$/gm)) {
    rightItems[m[1]] = m[2].trim()
  }
  const answerMap = {}
  for (const m of q.answer.matchAll(/([1-9])[—-]([A-F])/g)) {
    answerMap[parseInt(m[1])] = m[2]
  }
  return leftItems.map(item => ({
    left: item.text,
    right: rightItems[answerMap[item.num]] || ''
  }))
}

export function parseJudgmentAnswers(answer) {
  return [...answer.matchAll(/（[1-9]）([√×])/g)].map(m => m[1])
}

export function parseJudgmentStatements(text) {
  return text.split('\n').map(l => l.trim())
    .filter(l => /^（[1-9]）/.test(l))
    .map(l => l.replace(/（　）\s*$/, '').replace(/^（[1-9]）/, '').trim())
}

export function parseTypoItems(text) {
  return [...text.matchAll(/（([1-9])）\s*([^→\n]+?)\s*（　）/g)]
    .map(m => ({ num: parseInt(m[1]), word: m[2].trim() }))
}

export function parseTypoCorrections(answer) {
  const result = {}
  for (const m of answer.matchAll(/（([1-9])）[^→（\s]*?([^\s（→]+)→([^\s（\n]+)/g)) {
    result[parseInt(m[1])] = m[3].trim()
  }
  for (const m of answer.matchAll(/（([1-9])）[^→\n]*（正确/g)) {
    result[parseInt(m[1])] = '__ok__'
  }
  return result
}

export function parseWordBankSubAnswers(answer) {
  const results = []
  for (const m of answer.matchAll(/（([1-9])）([^（\n]+)/g)) {
    results.push({ num: parseInt(m[1]), text: m[2].trim() })
  }
  return results
}

export function extractBlankLine(questionText, num) {
  const lines = questionText.split('\n')
  const line = lines.find(l => l.includes(`（${num}）`))
  return line ? line.trim() : ''
}

export function segmentToChips(text) {
  const cleaned = text.replace(/[，。！？、；：""''《》（）\s]/g, '')
  const chips = []
  for (let i = 0; i < cleaned.length; i += 2) {
    chips.push(cleaned.slice(i, Math.min(i + 2, cleaned.length)))
  }
  return chips
}

export function parseOrderOptions(text) {
  return [...text.matchAll(/([①②③④⑤⑥⑦⑧⑨])\s*([^\s①②③④⑤⑥⑦⑧⑨→\n　]+)/g)]
    .map(m => ({ symbol: m[1], text: m[2].trim() }))
}

export function parseOrderAnswer(answer) {
  return [...answer.matchAll(/([①②③④⑤⑥⑦⑧⑨])/g)].map(m => m[1])
}

export function extractCharBankFromText(text) {
  const chars = []
  const regex = /【([^】]+)】/g
  let m
  while ((m = regex.exec(text)) !== null) {
    m[1].trim().split(/\s+/).filter(Boolean).forEach(c => chars.push(c))
  }
  return chars
}

export function removeCharBankMarkers(text) {
  return text.replace(/【[^】]*】/g, '').replace(/^\s*\n/, '').trim()
}

export function parseSubQStems(questionText) {
  const firstSubIdx = questionText.search(/（[1-9]）/)
  if (firstSubIdx < 0) return { instruction: questionText.trim(), stems: [] }
  const instruction = questionText.slice(0, firstSubIdx).trim()
  const rest = questionText.slice(firstSubIdx)
  const stems = []
  const matches = [...rest.matchAll(/（([1-9])）([\s\S]*?)(?=（[1-9]）|$)/g)]
  for (const m of matches) {
    stems.push({ num: parseInt(m[1]), text: m[2].trim() })
  }
  return { instruction, stems }
}

export function parseExpectedAnswers(answerText) {
  const map = {}
  for (const m of (answerText || '').matchAll(/（([1-9])）([\s\S]*?)(?=（[1-9]）|$)/g)) {
    map[parseInt(m[1])] = m[2].trim()
  }
  return map
}

export function smartCheck(input, expected) {
  const ideaIdx = expected.search(/；\s*(意思|解释|含义)[：:]/)
  if (ideaIdx > 0) {
    expected = expected.slice(0, ideaIdx).trim()
  }

  const n = normalize(input)
  const ne = normalize(expected)

  if (n.toLowerCase() === ne.toLowerCase()) return true

  const alts = ne.split(/\//)
  if (alts.length > 1) {
    if (alts.some(alt => n.toLowerCase() === alt.trim().toLowerCase())) return true
  }

  const cjkLen = expected.replace(/[^一-鿿]/g, '').length
  if (cjkLen <= 2) return false

  if (cjkLen <= 8) {
    const cjkN = n.replace(/[^一-鿿]/g, '')
    const cjkNe = ne.replace(/[^一-鿿]/g, '')
    if (cjkNe.length > 0) {
      const matchLen = [...cjkNe].filter(c => cjkN.includes(c)).length
      if (matchLen / cjkNe.length >= 0.75) return true
    }
  }

  const keywords = expected.split(/[，。！？、；：""''《》（）\s]+/).filter(w => w.length >= 2)
  if (keywords.length === 0) return n.length > 0
  const matched = keywords.filter(kw => n.includes(kw)).length
  return matched / keywords.length >= 0.6
}
