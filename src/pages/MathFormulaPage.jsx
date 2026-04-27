import { useState, useMemo, useEffect, useCallback } from 'react'
import { storage } from '../utils/storage'
import formulasRaw from '../data/questions_math_formulas.json'

const FALLBACK_FORMULAS = [
  { id: 'f_sq', front: '正方形面积', back: 'S = a²\na = 边长', category: '平面图形', example: '边长4cm → S = 16cm²', memory_tips: '边长×边长' },
  { id: 'f_rect', front: '长方形面积', back: 'S = l × w\nl = 长，w = 宽', category: '平面图形', example: '3×5 = 15cm²', memory_tips: '长乘宽' },
  { id: 'f_tri', front: '三角形面积', back: 'S = ½ × b × h\nb = 底，h = 高', category: '平面图形', example: '底4cm高6cm → S = 12cm²', memory_tips: '底×高÷2，需要对应的底和高' },
  { id: 'f_para', front: '平行四边形面积', back: 'S = b × h\nb = 底，h = 高', category: '平面图形', example: '底5cm高3cm → S = 15cm²', memory_tips: '底×高，注意高要垂直于底' },
  { id: 'f_trap', front: '梯形面积', back: 'S = (a+b)/2 × h\na = 上底，b = 下底，h = 高', category: '平面图形', example: '上3下5高4 → S = (3+5)÷2×4 = 16cm²', memory_tips: '上底加下底，除以2再乘高' },
  { id: 'f_cir', front: '圆的面积', back: 'S = π r²\nr = 半径', category: '平面图形', example: 'r=3cm → S = 9π ≈ 28.26cm²', memory_tips: '圆周率乘半径的平方' },
  { id: 'f_cir_c', front: '圆的周长', back: 'C = 2πr = πd\nr = 半径，d = 直径', category: '平面图形', example: 'r=5cm → C = 10π ≈ 31.4cm', memory_tips: '直径乘圆周率，或2乘半径乘圆周率' },
  { id: 'f_cube', front: '正方体体积', back: 'V = a³\na = 棱长', category: '立体图形', example: '棱长3cm → V = 27cm³', memory_tips: '棱长的三次方' },
  { id: 'f_box', front: '长方体体积', back: 'V = l × w × h\nl = 长，w = 宽，h = 高', category: '立体图形', example: '2×3×4 = 24cm³', memory_tips: '长×宽×高' },
  { id: 'f_cyl', front: '圆柱体积', back: 'V = π r² h\nr = 底面半径，h = 高', category: '立体图形', example: 'r=2,h=5 → V = 20π ≈ 62.8cm³', memory_tips: '底面积×高' },
  { id: 'f_cone', front: '圆锥体积', back: 'V = ⅓ π r² h\nr = 底面半径，h = 高', category: '立体图形', example: 'r=3,h=4 → V = 12π ≈ 37.7cm³', memory_tips: '等底等高圆柱体积的三分之一' },
  { id: 'f_frac_add', front: '同分母分数加减', back: '分母不变，分子相加减\na/c ± b/c = (a±b)/c', category: '分数法则', example: '3/7 + 2/7 = 5/7', memory_tips: '同分母直接加减分子' },
  { id: 'f_frac_mul', front: '分数乘法', back: '分子相乘作分子\n分母相乘作分母\n(a/b)×(c/d) = ac/bd', category: '分数法则', example: '2/3 × 3/4 = 6/12 = 1/2', memory_tips: '分子分子相乘，分母分母相乘，约分' },
  { id: 'f_frac_div', front: '分数除法', back: '除以一个数 = 乘以它的倒数\n(a/b)÷(c/d) = (a/b)×(d/c)', category: '分数法则', example: '2/3 ÷ 4/5 = 2/3 × 5/4 = 10/12 = 5/6', memory_tips: '除以谁就乘以谁的倒数' },
  { id: 'f_comm', front: '加法交换律', back: 'a + b = b + a', category: '运算定律', example: '45+78 = 78+45', memory_tips: '交换加数位置，和不变' },
  { id: 'f_assoc_add', front: '加法结合律', back: '(a+b)+c = a+(b+c)', category: '运算定律', example: '(25+47)+53 = 25+(47+53)', memory_tips: '凑整数，找好朋友' },
  { id: 'f_comm_mul', front: '乘法交换律', back: 'a × b = b × a', category: '运算定律', example: '25×4 = 4×25', memory_tips: '交换因数位置，积不变' },
  { id: 'f_assoc_mul', front: '乘法结合律', back: '(a×b)×c = a×(b×c)', category: '运算定律', example: '(25×4)×8 = 25×(4×8)', memory_tips: '凑整数乘，如25×4=100' },
  { id: 'f_dist', front: '乘法分配律', back: '(a+b)×c = a×c + b×c', category: '运算定律', example: '(20+3)×5 = 100+15 = 115', memory_tips: '括号内每个数都要乘括号外的数' },
]

const FORMULA_SESSION_SIZE = 10

const SRS_INTERVALS = [1, 2, 4, 7, 15, 30]

function getNextReview(intervalIndex) {
  const days = SRS_INTERVALS[Math.min(intervalIndex, SRS_INTERVALS.length - 1)]
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

function pickSRSCards(formulas, srsState, count) {
  const now = Date.now()
  const overdue = []
  const due = []
  const unseen = []

  for (const f of formulas) {
    const state = srsState[f.id]
    if (!state || !state.nextReview) {
      unseen.push(f)
    } else {
      const reviewAt = new Date(state.nextReview).getTime()
      if (reviewAt <= now - 86400000) {
        overdue.push({ formula: f, state })
      } else if (reviewAt <= now) {
        due.push({ formula: f, state })
      }
    }
  }

  const result = []
  for (const item of overdue.sort((a, b) => new Date(a.state.nextReview) - new Date(b.state.nextReview))) {
    if (result.length >= count) break
    result.push(item.formula)
  }
  for (const item of due) {
    if (result.length >= count) break
    result.push(item.formula)
  }
  for (const f of unseen) {
    if (result.length >= count) break
    result.push(f)
  }
  return result
}

const CATEGORIES = ['全部', '平面图形', '立体图形', '分数法则', '运算定律', '单位换算']

const JUNIOR_FORMULAS = [
  { id: 'jf_sq_sum', front: '完全平方和', back: '(a+b)² = a²+2ab+b²', category: '代数公式', example: '(x+3)² = x²+6x+9', memory_tips: '首平方，尾平方，首尾两倍在中央' },
  { id: 'jf_sq_diff', front: '完全平方差', back: '(a-b)² = a²-2ab+b²', category: '代数公式', example: '(x-5)² = x²-10x+25', memory_tips: '首平方，尾平方，首尾两倍减中央' },
  { id: 'jf_diff_sq', front: '平方差公式', back: 'a²-b² = (a+b)(a-b)', category: '代数公式', example: 'x²-9 = (x+3)(x-3)', memory_tips: '两数平方差等于两数和乘两数差' },
  { id: 'jf_factor_common', front: '提公因式法', back: 'ma+mb = m(a+b)', category: '代数公式', example: '2x+4 = 2(x+2)', memory_tips: '找最大公因数提出来' },
  { id: 'jf_factor_x2', front: 'x²+(p+q)x+pq型', back: 'x²+(p+q)x+pq = (x+p)(x+q)', category: '代数公式', example: 'x²+5x+6 = (x+2)(x+3)', memory_tips: '十字相乘：找两数之和=p+q，之积=pq' },
  { id: 'jf_power_mul', front: '幂的乘法', back: 'aᵐ·aⁿ = aᵐ⁺ⁿ\n(am)ⁿ = aᵐⁿ\n(ab)ⁿ = aⁿbⁿ', category: '代数公式', example: 'x³·x⁴=x⁷', memory_tips: '同底数幂相乘，底数不变指数相加' },
  { id: 'jf_power_div', front: '幂的除法', back: 'aᵐ÷aⁿ = aᵐ⁻ⁿ\na⁰ = 1\na⁻ⁿ = 1/aⁿ', category: '代数公式', example: 'x⁸÷x³=x⁵', memory_tips: '同底数幂相除，底数不变指数相减' },
  { id: 'jf_abs', front: '绝对值性质', back: '|a| ≥ 0\n|a| = a (a≥0)\n|a| = -a (a<0)', category: '代数公式', example: '|−3|=3', memory_tips: '绝对值就是到原点的距离，永远非负' },
  { id: 'jf_pythagoras', front: '勾股定理', back: 'a² + b² = c²\n（直角三角形两直角边为a,b，斜边为c）', category: '几何公式', example: 'a=3,b=4 → c=5', memory_tips: '勾三股四弦五，经典3-4-5直角三角形' },
  { id: 'jf_tri_area', front: '三角形面积(坐标)', back: 'S = ½|x₁(y₂-y₃)+x₂(y₃-y₁)+x₃(y₁-y₂)|', category: '几何公式', example: '三顶点坐标代入即可', memory_tips: '行列式公式取绝对值的一半' },
  { id: 'jf_circle_area', front: '圆的面积', back: 'S = πr²', category: '几何公式', example: 'r=5 → S=25π≈78.54', memory_tips: 'π乘半径的平方' },
  { id: 'jf_circle_circ', front: '圆的周长', back: 'C = 2πr = πd', category: '几何公式', example: 'd=10 → C=10π≈31.42', memory_tips: '直径乘π或2乘半径乘π' },
  { id: 'jf_arc', front: '弧长公式', back: 'l = nπr/180\n（n为圆心角度数）', category: '几何公式', example: 'n=60,r=3 → l=π≈3.14', memory_tips: '圆心角除以360再乘周长' },
  { id: 'jf_sector', front: '扇形面积', back: 'S = nπr²/360 = ½lr\n（n为圆心角，l为弧长）', category: '几何公式', example: 'n=90,r=4 → S=4π', memory_tips: '圆心角占360的比例乘圆面积' },
  { id: 'jf_poly_exterior', front: '多边形外角和', back: '外角和 = 360°\n（任意凸多边形）', category: '几何公式', example: '正六边形每个外角=60°', memory_tips: '不管几边形，外角和永远是360°' },
  { id: 'jf_poly_interior', front: '多边形内角和', back: '内角和 = (n-2)×180°\n（n为边数）', category: '几何公式', example: '三角形(n=3)→180°', memory_tips: '边数减2乘180' },
  { id: 'jf_similar', front: '相似比与面积比', back: '相似比=k →\n周长比=k\n面积比=k²\n体积比=k³', category: '几何公式', example: '相似比1:2 → 面积比1:4', memory_tips: '线段一次方，面积二次方，体积三次方' },
  { id: 'jf_linear', front: '一次函数', back: 'y = kx + b\nk>0递增，k<0递减\nb为y轴截距', category: '函数公式', example: 'y=2x+1 → 过(0,1)和(1,3)', memory_tips: 'k决定方向和陡度，b决定上下平移' },
  { id: 'jf_inverse', front: '反比例函数', back: 'y = k/x (k≠0)\n图象为双曲线\nk>0在一三象限', category: '函数公式', example: 'y=6/x → 过(2,3)', memory_tips: 'x增大y减小，xy=k恒定' },
  { id: 'jf_quadratic', front: '二次函数一般式', back: 'y = ax²+bx+c\na>0开口向上，a<0开口向下', category: '函数公式', example: 'y=x²-4x+3', memory_tips: 'a决定开口方向，c决定y轴截距' },
  { id: 'jf_quadratic_v', front: '二次函数顶点式', back: 'y = a(x-h)²+k\n顶点(h, k)\n对称轴x=h', category: '函数公式', example: 'y=2(x-1)²+3 → 顶点(1,3)', memory_tips: 'h是左右平移，k是上下平移' },
  { id: 'jf_quadratic_axis', front: '对称轴公式', back: 'x = -b/(2a)\n（由y=ax²+bx+c求对称轴）', category: '函数公式', example: 'y=x²-4x+3 → x=2', memory_tips: '负b除以2a' },
  { id: 'jf_delta', front: '判别式Δ', back: 'Δ = b²-4ac\nΔ>0: 两个不等实根\nΔ=0: 两个相等实根\nΔ<0: 无实根', category: '函数公式', example: 'x²-5x+6 → Δ=1>0', memory_tips: 'Δ判断根的情况，大于零有两根，等于零重根，小于零无根' },
  { id: 'jf_viete', front: '韦达定理', back: 'x₁+x₂ = -b/a\nx₁·x₂ = c/a\n（ax²+bx+c=0的两根）', category: '函数公式', example: 'x²-5x+6=0 → x₁+x₂=5, x₁x₂=6', memory_tips: '两根之和=-b/a，两根之积=c/a' },
  { id: 'jf_mean', front: '平均数', back: 'x̄ = (x₁+x₂+...+xₙ)/n', category: '统计公式', example: '2,4,6 → x̄=4', memory_tips: '总和除以个数' },
  { id: 'jf_median', front: '中位数', back: '数据从小到大排列：\n奇数个取中间值\n偶数个取中间两数平均', category: '统计公式', example: '1,3,5,7,9 → 中位数=5', memory_tips: '先排序再找中间' },
  { id: 'jf_mode', front: '众数', back: '出现次数最多的数据\n可能不止一个', category: '统计公式', example: '1,2,2,3,3,3 → 众数=3', memory_tips: '谁出现最多就是众数' },
  { id: 'jf_variance', front: '方差', back: 's² = [(x₁-x̄)²+(x₂-x̄)²+...+(xₙ-x̄)²]/n', category: '统计公式', example: '数据越集中方差越小', memory_tips: '每个数据与平均值的差的平方的平均' },
  { id: 'jf_freq_mean', front: '加权平均数', back: 'x̄ = (f₁x₁+f₂x₂+...+fₙxₙ)/(f₁+f₂+...+fₙ)\nf为各数据权重', category: '统计公式', example: '成绩:80×3+90×2 / 5 = 84', memory_tips: '每个值乘以权重再求和，除以总权重' },
]

// 手工定义易混淆干扰项：每个公式的错误选项
const CONFUSORS = {
  'jf_sq_sum':    ['a²+b²', 'a²-2ab+b²', '(a-b)² = a²-2ab+b²'],
  'jf_sq_diff':   ['a²+2ab+b²', 'a²-b²', '(a+b)² = a²+2ab+b²'],
  'jf_diff_sq':   ['(a+b)²', 'a²+2ab+b²', 'a²+b²'],
  'jf_factor_common': ['ma-mb = m(a-b)', 'ma+mb = m(a-b)', 'm(a+b) = ma-mb'],
  'jf_factor_x2': ['(x+p)(x-q)', '(x-p)(x+q)', 'x²+(p-q)x+pq'],
  'jf_power_mul': ['aᵐ·aⁿ = aᵐⁿ', '(aᵐ)ⁿ = aᵐ⁺ⁿ', 'aᵐ·aⁿ = aᵐ⁻ⁿ'],
  'jf_power_div': ['aᵐ÷aⁿ = aᵐⁿ', 'a⁰ = 0', 'aᵐ÷aⁿ = aᵐ⁺ⁿ'],
  'jf_abs':       ['|a| = a', '|a| = ±a', '|a| = -a'],
  'jf_pythagoras': ['a+b = c', 'a²-b² = c²', '2a+2b = c²'],
  'jf_tri_area':  ['S = b×h', 'S = ½bh/2', 'S = (a+b)×h'],
  'jf_circle_area': ['S = 2πr', 'S = πd', 'S = πr'],
  'jf_circle_circ': ['C = πr²', 'C = πr', 'C = 2πd'],
  'jf_arc':       ['l = nπr/360', 'l = 2πr/n', 'l = nπr²/360'],
  'jf_sector':    ['S = nπr/360', 'S = πr²', 'S = ½r²'],
  'jf_poly_exterior': ['外角和 = (n-2)×180°', '外角和 = 180°', '外角和 = n×180°'],
  'jf_poly_interior': ['内角和 = 360°', '内角和 = n×180°', '内角和 = (n-1)×180°'],
  'jf_similar':   ['面积比=k', '周长比=k²', '体积比=k²'],
  'jf_linear':    ['y = k/x', 'y = ax²+bx', 'y = kx² + b'],
  'jf_inverse':   ['y = kx+b', 'y = kx²', 'y = k/(x+h)'],
  'jf_quadratic': ['y = ax+b', 'y = k/x', 'y = a(x-h)²+k'],
  'jf_quadratic_v': ['y = ax²+bx+c', 'y = a(x+h)²-k', 'y = kx+b'],
  'jf_quadratic_axis': ['x = b/(2a)', 'x = -a/(2b)', 'x = b²/(4ac)'],
  'jf_delta':     ['Δ = b²+4ac', 'Δ = b²-2ac', 'Δ = 4ac-b²'],
  'jf_viete':     ['x₁+x₂ = b/a', 'x₁·x₂ = b/a', 'x₁+x₂ = -c/a'],
  'jf_mean':      ['总和×个数', '最大值+最小值)/2', '中位数'],
  'jf_median':    ['出现最多的数', '(最大值+最小值)/2', '总和/个数'],
  'jf_mode':      ['中间的数', '(最大值+最小值)/2', '总和/个数'],
  'jf_variance':  ['s² = (x̄-x₁)²/n', 's = 平均数×n', 's² = 最大值-最小值'],
  'jf_freq_mean': ['x̄ = (x₁+x₂)/2', 'x̄ = (f₁+f₂)/n', 'x̄ = 最大值+最小值)/2'],
}

const JUNIOR_CATEGORIES = ['全部', '代数公式', '几何公式', '函数公式', '统计公式']

function generateOptions(formula, allFormulas) {
  const correctBack = formula.back.split('\n')[0]
  const predefined = CONFUSORS[formula.id]
  if (predefined) {
    const options = [correctBack, ...predefined]
    return shuffle(options)
  }
  // fallback: 从同类公式中随机选干扰项
  const sameCategory = allFormulas.filter(f => f.id !== formula.id && f.category === formula.category)
  const distractors = shuffle(sameCategory).slice(0, 3).map(f => f.back.split('\n')[0])
  while (distractors.length < 3) distractors.push('???')
  return shuffle([correctBack, ...distractors])
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function MathFormulaPage({ user, onBack, grade }) {
  const isJunior = grade === 'junior'
  const baseFormulas = isJunior ? JUNIOR_FORMULAS : (formulasRaw.length > 0 ? formulasRaw : FALLBACK_FORMULAS)
  const allCats = isJunior ? JUNIOR_CATEGORIES : CATEGORIES
  const userId = user.id

  const [activeCategory, setActiveCategory] = useState('全部')
  const [phase, setPhase] = useState('memorize') // 'memorize' | 'quiz' | 'done'
  const [cardIndex, setCardIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [quizAnswer, setQuizAnswer] = useState(null) // null | 'correct' | 'wrong'
  const [selectedOption, setSelectedOption] = useState(null)
  const [stats, setStats] = useState({ know: 0, forgot: 0 })
  const [session, setSession] = useState([])
  const [quizOptions, setQuizOptions] = useState([])
  const [refreshKey, setRefreshKey] = useState(0)

  const srsState = useMemo(() => storage.getSrsState(userId), [userId, refreshKey])
  const FORMULAS = baseFormulas

  const filtered = useMemo(() => {
    if (activeCategory === '全部') return FORMULAS
    return FORMULAS.filter(f => f.category === activeCategory)
  }, [activeCategory])

  const srsStats = useMemo(() => {
    const now = Date.now()
    let overdue = 0, due = 0, mastered = 0, unseen = 0
    for (const f of filtered) {
      const s = srsState[f.id]
      if (!s || !s.nextReview) { unseen++; continue }
      const t = new Date(s.nextReview).getTime()
      if (t <= now - 86400000) overdue++
      else if (t <= now) due++
      if (s.intervalIndex >= SRS_INTERVALS.length) mastered++
    }
    return { overdue, due, mastered, unseen, total: filtered.length }
  }, [filtered, srsState])

  // 初始化速记会话
  useEffect(() => {
    const picked = pickSRSCards(filtered, srsState, FORMULA_SESSION_SIZE)
    const s = picked.length > 0 ? picked : [...filtered].sort(() => Math.random() - 0.5).slice(0, FORMULA_SESSION_SIZE)
    setSession(s)
    setCardIndex(0)
    setFlipped(false)
    setPhase('memorize')
    setStats({ know: 0, forgot: 0 })
    setQuizAnswer(null)
    setSelectedOption(null)
    setQuizOptions([])
  }, [activeCategory])

  const card = session[cardIndex]
  const total = session.length

  // 速记阶段翻看
  function handleFlip() {
    setFlipped(f => !f)
  }

  function handleMemorizeNext() {
    if (cardIndex < total - 1) {
      setCardIndex(i => i + 1)
      setFlipped(false)
    } else {
      // 速记完成，进入闯关
      setPhase('quiz')
      setCardIndex(0)
      setFlipped(false)
      setQuizAnswer(null)
      setSelectedOption(null)
      const opts = generateOptions(session[0], FORMULAS)
      setQuizOptions(opts)
    }
  }

  function handleMemorizePrev() {
    if (cardIndex > 0) {
      setCardIndex(i => i - 1)
      setFlipped(false)
    }
  }

  // 闯关阶段选题
  function handleOptionClick(option) {
    if (quizAnswer !== null) return
    setSelectedOption(option)
    const correctBack = card.back.split('\n')[0]
    const isCorrect = option === correctBack
    setQuizAnswer(isCorrect ? 'correct' : 'wrong')

    if (isCorrect) {
      setStats(s => ({ ...s, know: s.know + 1 }))
      updateCardSRS(card.id, true)
      storage.addRecord(userId, {
        card_id: card.id,
        correct: true,
        ability_tag: card.category,
        knowledge_tag: card.category,
        subject: isJunior ? 'math_junior' : 'math',
        topic: '公式速记',
        timestamp: new Date().toISOString(),
      })
    } else {
      setStats(s => ({ ...s, forgot: s.forgot + 1 }))
      updateCardSRS(card.id, false)
      storage.addRecord(userId, {
        card_id: card.id,
        correct: false,
        ability_tag: card.category,
        knowledge_tag: card.category,
        subject: isJunior ? 'math_junior' : 'math',
        topic: '公式速记',
        question_data: {
          stem: card.front,
          answer: card.back,
          analysis: card.memory_tips || '',
          type: 'formula_choice',
        },
        timestamp: new Date().toISOString(),
      })
    }
  }

  function handleQuizNext() {
    if (cardIndex < total - 1) {
      const nextIdx = cardIndex + 1
      setCardIndex(nextIdx)
      setFlipped(false)
      setQuizAnswer(null)
      setSelectedOption(null)
      setQuizOptions(generateOptions(session[nextIdx], FORMULAS))
    } else {
      setPhase('done')
      handleFinish()
    }
  }

  function updateCardSRS(cardId, remembered) {
    const current = srsState[cardId] || { intervalIndex: 0, correctCount: 0, wrongCount: 0 }
    if (remembered) {
      current.intervalIndex = Math.min((current.intervalIndex || 0) + 1, SRS_INTERVALS.length - 1)
      current.correctCount = (current.correctCount || 0) + 1
    } else {
      current.intervalIndex = 0
      current.wrongCount = (current.wrongCount || 0) + 1
    }
    current.nextReview = getNextReview(current.intervalIndex)
    current.subject = 'math'
    storage.updateCardSrs(userId, cardId, current)
  }

  const handleFinish = useCallback(() => {
    const subject = isJunior ? 'math_junior' : 'math'
    const tag = isJunior ? '🔢 公式速记(初中)' : '🔢 公式速记'
    storage.markPlanetComplete(userId, tag)
    storage.addXP(userId, 10 + stats.know * 2)
    const streak = storage.getStreak(userId)
    const today = new Date().toISOString().split('T')[0]
    if (streak.lastDate !== today) {
      streak.count = (streak.count || 0) + 1
      streak.lastDate = today
      storage.setStreak(userId, streak)
    }
    setRefreshKey(k => k + 1)
  }, [userId, stats, isJunior, activeCategory])

  function handleRestart() {
    const picked = pickSRSCards(filtered, srsState, FORMULA_SESSION_SIZE)
    const s = picked.length > 0 ? picked : [...filtered].sort(() => Math.random() - 0.5).slice(0, FORMULA_SESSION_SIZE)
    setSession(s)
    setCardIndex(0)
    setFlipped(false)
    setPhase('memorize')
    setStats({ know: 0, forgot: 0 })
    setQuizAnswer(null)
    setSelectedOption(null)
    setQuizOptions([])
  }

  // 题号与进度
  const displayIndex = phase === 'quiz' ? cardIndex + 1 : cardIndex + 1
  const displayTotal = total

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-purple-50 flex flex-col"
      style={{ paddingTop: 'env(safe-area-inset-top, 20px)' }}>

      {/* 顶部栏 */}
      <div className="bg-white shadow-sm px-4 pt-3 pb-3 flex items-center gap-3">
        <button onClick={onBack}
          className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-xl text-lg font-bold text-gray-500 active:bg-gray-200">
          ←
        </button>
        <h1 className="text-xl font-bold text-gray-800 flex-1">📋 公式速记{isJunior ? '·初中' : ''}</h1>
        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
          phase === 'memorize' ? 'bg-blue-100 text-blue-600' :
          phase === 'quiz' ? 'bg-orange-100 text-orange-600' :
          'bg-green-100 text-green-600'
        }`}>
          {phase === 'memorize' ? '📖 速记中' : phase === 'quiz' ? '🎯 闯关中' : '✅ 完成'}
        </span>
      </div>

      {/* 分类 Tab */}
      <div className="overflow-x-auto px-4 pt-3 pb-1 flex gap-2 scrollbar-hide">
        {allCats.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeCategory === cat
                ? 'bg-violet-600 text-white shadow-sm'
                : 'bg-white text-gray-500 border border-gray-200'
            }`}>
            {cat}
          </button>
        ))}
      </div>

      {/* SRS 提示 */}
      {srsStats.overdue > 0 && (
        <div className="mx-4 mt-2 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2 flex items-center gap-2">
          <span className="text-xs text-orange-600 font-semibold">📚 {srsStats.overdue} 张待复习</span>
          <span className="text-[10px] text-orange-400">已掌握 {srsStats.mastered}/{srsStats.total}</span>
        </div>
      )}

      {/* 进度条 */}
      {phase !== 'done' && (
        <div className="px-4 pt-2 pb-1 flex items-center gap-3">
          <span className="text-xs text-gray-400">
            {phase === 'memorize' ? '速记' : '闯关'} {displayIndex}/{displayTotal}
          </span>
          <div className="flex-1 bg-gray-200 rounded-full h-1.5">
            <div className={`h-1.5 rounded-full transition-all ${
              phase === 'memorize' ? 'bg-blue-500' : 'bg-orange-500'
            }`}
              style={{ width: `${(displayIndex / displayTotal) * 100}%` }} />
          </div>
          <span className="text-xs text-gray-400">✅{stats.know} ❌{stats.forgot}</span>
        </div>
      )}

      {/* ========== 完成页 ========== */}
      {phase === 'done' ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
          <span className="text-6xl">🎉</span>
          <h2 className="text-2xl font-extrabold text-violet-700">闯关完成！</h2>
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-3xl font-extrabold text-green-500">{stats.know}</div>
              <div className="text-sm text-gray-500">答对了</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-extrabold text-red-400">{stats.forgot}</div>
              <div className="text-sm text-gray-500">答错了</div>
            </div>
          </div>
          <div className="bg-violet-50 border border-violet-100 rounded-xl px-4 py-2 text-sm text-violet-600 font-medium">
            +{10 + stats.know * 2} XP · 打卡成功 ✓
          </div>
          <button onClick={handleRestart}
            className="mt-2 bg-violet-600 text-white font-bold px-8 py-3 rounded-2xl active:scale-95 transition-transform">
            再来一轮 🔄
          </button>
          <button onClick={onBack} className="text-gray-400 text-sm py-2">返回</button>
        </div>

      /* ========== 速记阶段 ========== */
      ) : phase === 'memorize' && card ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4">
          <div className="text-xs text-blue-500 font-semibold bg-blue-50 px-3 py-1 rounded-full">
            速记模式 · 先认识这些公式
          </div>

          {/* 翻转卡片 */}
          <div onClick={handleFlip} className="w-full max-w-sm cursor-pointer" style={{ perspective: 1000 }}>
            <div style={{
              position: 'relative', width: '100%', paddingBottom: '56%',
              transformStyle: 'preserve-3d', transition: 'transform 0.5s ease',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}>
              {/* 正面 */}
              <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                className="bg-white rounded-3xl shadow-lg flex flex-col items-center justify-center p-6 border-2 border-blue-100">
                <div className="text-xs text-blue-400 font-semibold mb-3 uppercase tracking-wider">{card.category}</div>
                <div className="text-xl font-extrabold text-gray-800 text-center">{card.front}</div>
                <div className="text-xs text-gray-400 mt-4">点击翻转查看公式</div>
              </div>
              {/* 背面 */}
              <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl shadow-lg flex flex-col items-center justify-center p-6">
                <div className="text-xs text-blue-200 font-semibold mb-2 uppercase tracking-wider">公式</div>
                <pre className="text-xl font-extrabold text-white text-center whitespace-pre-wrap leading-relaxed font-mono">{card.back}</pre>
                {card.memory_tips && (
                  <div className="mt-3 bg-white/20 rounded-xl px-3 py-1.5 text-xs text-blue-100 text-center">
                    💡 {card.memory_tips}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 例题提示 */}
          {card.example && flipped && (
            <div className="text-xs text-blue-600 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 w-full max-w-sm text-center">
              📝 例题：{card.example}
            </div>
          )}

          {/* 速记导航 */}
          <div className="flex items-center gap-4 w-full max-w-sm">
            <button onClick={handleMemorizePrev} disabled={cardIndex === 0}
              className="flex-1 bg-white border border-gray-200 text-gray-600 font-semibold py-3 rounded-2xl active:scale-95 transition-all disabled:opacity-30 text-sm">
              ← 上一张
            </button>
            <button onClick={handleMemorizeNext}
              className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-2xl active:scale-95 transition-all text-sm">
              {cardIndex < total - 1 ? '下一张 →' : '开始闯关 🎯'}
            </button>
          </div>
        </div>

      /* ========== 闯关选择题 ========== */
      ) : phase === 'quiz' && card ? (
        <div className="flex-1 flex flex-col items-center px-4 gap-4 pt-4">
          {/* 题目 */}
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-md p-5 border-2 border-orange-100">
            <div className="text-xs text-orange-400 font-semibold mb-2">{card.category}</div>
            <div className="text-lg font-extrabold text-gray-800 text-center mb-1">{card.front}</div>
            <div className="text-xs text-gray-400 text-center">选出正确的公式</div>
          </div>

          {/* 选项 */}
          <div className="w-full max-w-sm flex flex-col gap-2.5">
            {quizOptions.map((opt, i) => {
              const correctBack = card.back.split('\n')[0]
              const isCorrect = opt === correctBack
              let bgClass = 'bg-white border-gray-200 active:bg-gray-50'
              if (quizAnswer !== null) {
                if (isCorrect) bgClass = 'bg-green-50 border-green-400 text-green-700'
                else if (opt === selectedOption && !isCorrect) bgClass = 'bg-red-50 border-red-400 text-red-700'
                else bgClass = 'bg-gray-50 border-gray-100 text-gray-300'
              }
              return (
                <button key={i}
                  onClick={() => handleOptionClick(opt)}
                  disabled={quizAnswer !== null}
                  className={`w-full text-left px-4 py-3 rounded-2xl border-2 transition-all font-mono text-sm ${bgClass}`}>
                  <span className="font-bold text-gray-400 mr-2">{String.fromCharCode(65 + i)}.</span>
                  {opt}
                </button>
              )
            })}
          </div>

          {/* 答题反馈 + 解析 */}
          {quizAnswer !== null && (
            <div className="w-full max-w-sm">
              <div className={`text-center py-3 rounded-2xl font-bold text-sm mb-2 ${
                quizAnswer === 'correct' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
              }`}>
                {quizAnswer === 'correct' ? '✅ 正确！' : `❌ 正确答案是：${card.back.split('\n')[0]}`}
              </div>
              {card.memory_tips && (
                <div className="bg-violet-50 border border-violet-100 rounded-xl px-4 py-2 text-xs text-violet-600 text-center">
                  💡 {card.memory_tips}
                </div>
              )}
              <button onClick={handleQuizNext}
                className="w-full mt-3 bg-orange-600 text-white font-bold py-3 rounded-2xl active:scale-95 transition-transform text-sm">
                {cardIndex < total - 1 ? '下一题 →' : '查看结果 🎉'}
              </button>
            </div>
          )}
        </div>

      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
          该分类暂无公式卡片
        </div>
      )}

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}
