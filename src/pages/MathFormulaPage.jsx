import { useState, useMemo, useEffect } from 'react'
import { storage } from '../utils/storage'
import formulasRaw from '../data/questions_math_formulas.json'

// 内置兜底公式（data 文件为空时使用）
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

const CATEGORIES = ['全部', '平面图形', '立体图形', '分数法则', '运算定律', '单位换算']

export default function MathFormulaPage({ user, onBack }) {
  const FORMULAS = formulasRaw.length > 0 ? formulasRaw : FALLBACK_FORMULAS

  const [activeCategory, setActiveCategory] = useState('全部')
  const [cardIndex, setCardIndex]   = useState(0)
  const [flipped, setFlipped]       = useState(false)
  const [mode, setMode]             = useState('browse') // browse | quiz
  const [quizResult, setQuizResult] = useState(null)     // 'know' | 'forgot'
  const [stats, setStats]           = useState({ know: 0, forgot: 0 })
  const [session, setSession]       = useState([])       // 本次卡片序列
  const [showExample, setShowExample] = useState(false)

  const allCategories = useMemo(() => {
    const cats = [...new Set(FORMULAS.map(f => f.category).filter(Boolean))]
    return ['全部', ...cats]
  }, [])

  const filtered = useMemo(() => {
    if (activeCategory === '全部') return FORMULAS
    return FORMULAS.filter(f => f.category === activeCategory)
  }, [activeCategory])

  // 每次切换分类 or 模式 reset 到第一张
  useEffect(() => {
    setCardIndex(0)
    setFlipped(false)
    setQuizResult(null)
    setShowExample(false)
    if (mode === 'quiz') {
      // 打乱顺序开始闯关
      const shuffled = [...filtered].sort(() => Math.random() - 0.5)
      setSession(shuffled)
    }
  }, [activeCategory, mode])

  const cards = mode === 'quiz' ? session : filtered
  const card  = cards[cardIndex]
  const total = cards.length

  function handleFlip() {
    setFlipped(f => !f)
    setShowExample(false)
  }

  function handlePrev() {
    if (cardIndex > 0) {
      setCardIndex(i => i - 1)
      setFlipped(false)
      setQuizResult(null)
      setShowExample(false)
    }
  }

  function handleNext() {
    if (cardIndex < total - 1) {
      setCardIndex(i => i + 1)
      setFlipped(false)
      setQuizResult(null)
      setShowExample(false)
    }
  }

  function handleKnow() {
    setQuizResult('know')
    setStats(s => ({ ...s, know: s.know + 1 }))
    setTimeout(() => {
      if (cardIndex < total - 1) {
        setCardIndex(i => i + 1)
        setFlipped(false)
        setQuizResult(null)
        setShowExample(false)
      }
    }, 600)
  }

  function handleForgot() {
    setQuizResult('forgot')
    setStats(s => ({ ...s, forgot: s.forgot + 1 }))
    setTimeout(() => {
      if (cardIndex < total - 1) {
        setCardIndex(i => i + 1)
        setFlipped(false)
        setQuizResult(null)
        setShowExample(false)
      }
    }, 600)
  }

  const isFinished = mode === 'quiz' && cardIndex >= total - 1 && quizResult !== null

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-purple-50 flex flex-col"
      style={{ paddingTop: 'env(safe-area-inset-top, 20px)' }}>

      {/* 顶部栏 */}
      <div className="bg-white shadow-sm px-4 pt-3 pb-3 flex items-center gap-3">
        <button onClick={onBack}
          className="w-9 h-9 flex items-center justify-center bg-gray-100 rounded-xl text-lg font-bold text-gray-500 active:bg-gray-200">
          ←
        </button>
        <h1 className="text-xl font-bold text-gray-800 flex-1">📋 公式速记</h1>
        <div className="flex bg-gray-100 rounded-xl p-0.5">
          {['browse', 'quiz'].map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                mode === m ? 'bg-violet-600 text-white shadow-sm' : 'text-gray-500'
              }`}>
              {m === 'browse' ? '📖 浏览' : '🎯 闯关'}
            </button>
          ))}
        </div>
      </div>

      {/* 分类 Tab */}
      <div className="overflow-x-auto px-4 pt-3 pb-1 flex gap-2 scrollbar-hide">
        {allCategories.map(cat => (
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

      {/* 进度 */}
      <div className="px-4 pt-2 pb-1 flex items-center gap-3">
        <span className="text-xs text-gray-400">{cardIndex + 1} / {total}</span>
        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
          <div className="bg-violet-500 h-1.5 rounded-full transition-all"
            style={{ width: `${((cardIndex + 1) / total) * 100}%` }} />
        </div>
        {mode === 'quiz' && (
          <span className="text-xs text-gray-400">
            ✅{stats.know} ❌{stats.forgot}
          </span>
        )}
      </div>

      {/* 闯关完成页 */}
      {isFinished ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
          <span className="text-6xl">🎉</span>
          <h2 className="text-2xl font-extrabold text-violet-700">全部完成！</h2>
          <div className="flex gap-6">
            <div className="text-center">
              <div className="text-3xl font-extrabold text-green-500">{stats.know}</div>
              <div className="text-sm text-gray-500">记住了</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-extrabold text-red-400">{stats.forgot}</div>
              <div className="text-sm text-gray-500">需复习</div>
            </div>
          </div>
          <button onClick={() => { setMode('quiz'); setStats({ know: 0, forgot: 0 }) }}
            className="mt-2 bg-violet-600 text-white font-bold px-8 py-3 rounded-2xl active:scale-95 transition-transform">
            再来一遍 🔄
          </button>
          <button onClick={onBack} className="text-gray-400 text-sm py-2">返回</button>
        </div>
      ) : card ? (
        /* ── 主卡片 ── */
        <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4">

          {/* 翻转卡片 */}
          <div
            onClick={handleFlip}
            className="w-full max-w-sm cursor-pointer"
            style={{ perspective: 1000 }}
          >
            <div style={{
              position: 'relative',
              width: '100%',
              paddingBottom: '56%',
              transformStyle: 'preserve-3d',
              transition: 'transform 0.5s ease',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}>
              {/* 正面 */}
              <div style={{
                position: 'absolute', inset: 0,
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
                className="bg-white rounded-3xl shadow-lg flex flex-col items-center justify-center p-6 border-2 border-violet-100"
              >
                <div className="text-xs text-violet-400 font-semibold mb-3 uppercase tracking-wider">
                  {card.category}
                </div>
                <div className="text-xl font-extrabold text-gray-800 text-center">{card.front}</div>
                <div className="text-xs text-gray-400 mt-4">点击翻转查看公式</div>
              </div>

              {/* 背面 */}
              <div style={{
                position: 'absolute', inset: 0,
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
                className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl shadow-lg flex flex-col items-center justify-center p-6"
              >
                <div className="text-xs text-violet-200 font-semibold mb-2 uppercase tracking-wider">
                  公式
                </div>
                <pre className="text-xl font-extrabold text-white text-center whitespace-pre-wrap leading-relaxed font-mono">
                  {card.back}
                </pre>
                {card.memory_tips && (
                  <div className="mt-3 bg-white/20 rounded-xl px-3 py-1.5 text-xs text-violet-100 text-center">
                    💡 {card.memory_tips}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 例题（可展开） */}
          {card.example && (
            <button onClick={() => setShowExample(e => !e)}
              className="text-xs text-violet-600 bg-violet-50 px-4 py-2 rounded-xl border border-violet-100 w-full max-w-sm text-left">
              <span className="font-semibold">📝 例题：</span>
              {showExample ? card.example : `${card.example.slice(0, 20)}... 点击展开`}
            </button>
          )}

          {/* 操作按钮 */}
          {mode === 'quiz' && flipped && !quizResult && (
            <div className="flex gap-3 w-full max-w-sm">
              <button onClick={handleForgot}
                className="flex-1 bg-red-100 text-red-600 font-bold py-3 rounded-2xl active:scale-95 transition-transform text-sm">
                ❌ 没记住
              </button>
              <button onClick={handleKnow}
                className="flex-1 bg-green-100 text-green-700 font-bold py-3 rounded-2xl active:scale-95 transition-transform text-sm">
                ✅ 记住了
              </button>
            </div>
          )}

          {quizResult && (
            <div className={`w-full max-w-sm text-center py-3 rounded-2xl font-bold text-sm ${
              quizResult === 'know' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
            }`}>
              {quizResult === 'know' ? '✅ 太棒了！继续加油！' : '❌ 没关系，多复习几遍！'}
            </div>
          )}

          {mode === 'browse' && (
            <div className="flex items-center gap-4 w-full max-w-sm">
              <button onClick={handlePrev} disabled={cardIndex === 0}
                className="flex-1 bg-white border border-gray-200 text-gray-600 font-semibold py-3 rounded-2xl active:scale-95 transition-all disabled:opacity-30 text-sm">
                ← 上一张
              </button>
              <button onClick={handleNext} disabled={cardIndex >= total - 1}
                className="flex-1 bg-violet-600 text-white font-semibold py-3 rounded-2xl active:scale-95 transition-all disabled:opacity-30 text-sm">
                下一张 →
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
