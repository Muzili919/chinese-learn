/**
 * 知识依赖图谱
 * 用于"高级诊断报告"中的根因分析和学习路径推荐
 */

// 知识点依赖关系：tag → { roots: 上游依赖, suggests: 推荐练习入口 }
export const KNOWLEDGE_DEPS = {
  // ── 小学语文 ──

  // 基础层（无上游依赖）
  '字音辨析': { roots: [], suggests: '字词星球 → 多音字辨析专项' },
  '字形辨析': { roots: [], suggests: '字词星球 → 形近字辨析专项' },
  '拼音写词': { roots: ['字音辨析', '字形辨析'], suggests: '字词星球 → 拼音写词' },
  '字词': { roots: [], suggests: '字词星球基础练习' },

  // 应用层
  '词语运用': { roots: ['字音辨析', '字形辨析'], suggests: '字词星球 → 词语运用' },
  '词义理解': { roots: ['字词'], suggests: '字词星球 → 词义理解' },
  '病句辨析': { roots: ['词语运用'], suggests: '句子星球 → 病句辨析' },
  '语句排序': { roots: ['词语运用'], suggests: '句子星球 → 语句排序' },
  '关联词': { roots: ['词语运用'], suggests: '句子星球 → 关联词' },
  '句式转换': { roots: ['词语运用'], suggests: '句子星球 → 句式转换' },
  '修辞手法': { roots: ['词语运用'], suggests: '句子星球 → 修辞手法' },
  '句子': { roots: ['词语运用'], suggests: '句子星球基础练习' },

  // 古诗词链
  '诗句默写': { roots: [], suggests: '诗词星球 → 默写练习' },
  '古诗词': { roots: [], suggests: '诗词星球基础练习' },
  '古诗运用': { roots: ['古诗词'], suggests: '诗词星球 → 古诗运用' },
  '古诗鉴赏': { roots: ['古诗词', '修辞手法'], suggests: '诗词星球 → 鉴赏专项' },

  // 成语链
  '成语': { roots: ['词义理解'], suggests: '成语星球基础练习' },
  '成语理解': { roots: ['成语'], suggests: '成语星球 → 含义理解' },
  '成语运用': { roots: ['成语理解'], suggests: '成语星球 → 用法练习' },

  // 文学常识链
  '文学常识': { roots: [], suggests: '文学星球基础练习' },
  '四大名著': { roots: ['文学常识'], suggests: '文学星球 → 名著专项' },
  '名著阅读拓展': { roots: ['四大名著'], suggests: '文学星球 → 名著阅读' },
  '体裁文体': { roots: ['文学常识'], suggests: '文学星球 → 文体知识' },
  '古代作家': { roots: ['文学常识'], suggests: '文学星球 → 作家作品' },
  '现当代作家': { roots: ['文学常识'], suggests: '文学星球 → 作家作品' },
  '文化常识': { roots: ['文学常识'], suggests: '文学星球 → 文化常识' },
  '标点符号': { roots: ['句子'], suggests: '句子星球 → 标点练习' },

  // ── 初中语文 ──

  // 基础
  '字音字形综合': { roots: ['字音辨析', '字形辨析'], suggests: '基础知识星球 → 字音字形' },
  '词语综合运用': { roots: ['词语运用'], suggests: '基础知识星球 → 词语运用' },
  '病句综合辨析': { roots: ['病句辨析'], suggests: '基础知识星球 → 病句辨析' },

  // 古诗文链
  '古诗文默写': { roots: [], suggests: '古诗文星球 → 默写练习' },
  '古诗文常识': { roots: ['古诗文默写'], suggests: '古诗文星球 → 文学常识' },
  '古诗词赏析': { roots: ['古诗文默写', '修辞手法'], suggests: '古诗文星球 → 赏析专项' },

  // 文言文链
  '实词解释': { roots: [], suggests: '文言文星球 → 实词积累' },
  '虚词用法': { roots: [], suggests: '文言文星球 → 虚词归纳' },
  '句式翻译': { roots: ['实词解释', '虚词用法'], suggests: '文言文星球 → 句式翻译' },
  '文言文翻译': { roots: ['实词解释', '虚词用法'], suggests: '文言文星球 → 翻译练习' },
  '文言文阅读': { roots: ['文言文翻译'], suggests: '文言文星球 → 阅读理解' },

  // 表达运用链
  '仿写句子': { roots: ['词语运用', '修辞手法'], suggests: '表达运用星球 → 仿写专项' },
  '语言得体': { roots: ['词语运用'], suggests: '表达运用星球 → 语言得体' },
  '信息概括': { roots: ['词语综合运用'], suggests: '表达运用星球 → 信息概括' },
  '图文转换': { roots: ['信息概括'], suggests: '表达运用星球 → 图文转换' },
  '综合性学习': { roots: ['信息概括', '语言得体'], suggests: '表达运用星球 → 综合学习' },
  '语言综合运用': { roots: ['仿写句子', '语言得体'], suggests: '表达运用星球综合练习' },

  // 阅读链
  '现代文阅读': { roots: ['信息概括', '修辞手法'], suggests: '阅读理解星球 → 现代文阅读' },
  '名著阅读': { roots: ['文学常识'], suggests: '名著星球 → 阅读理解' },

  // ── 英语 ──
  '词汇': { roots: [], suggests: '词汇星球 → 单词记忆' },
  '语法': { roots: ['词汇'], suggests: '语法星球 → 语法练习' },
  '听力': { roots: ['词汇'], suggests: '听力星球 → 听力训练' },
  '阅读理解': { roots: ['词汇', '语法'], suggests: '阅读星球 → 阅读理解' },
  '完形填空': { roots: ['词汇', '语法'], suggests: '阅读星球 → 完形填空' },
  '写作': { roots: ['词汇', '语法'], suggests: '写作星球 → 作文练习' },

  // ── 数学 ──
  '数与代数': { roots: [], suggests: '数学星球 → 数与代数' },
  '图形与几何': { roots: [], suggests: '数学星球 → 几何专项' },
  '方程与不等式': { roots: ['数与代数'], suggests: '数学星球 → 方程专项' },
  '函数': { roots: ['方程与不等式'], suggests: '数学星球 → 函数专项' },
  '奥数思维': { roots: ['数与代数'], suggests: '数学星球 → 奥数挑战' },
}

// 错误归因类型的颜色和标签
export const ERROR_TYPES = {
  concept: { label: '概念误解', color: 'red', icon: '❌', desc: '核心概念没理解，需要换角度讲解' },
  memory: { label: '记忆模糊', color: 'amber', icon: '🟡', desc: '学过但记不牢，需要反复巩固' },
  careless: { label: '粗心失误', color: 'gray', icon: '⚪', desc: '理解到位但审题/计算出错' },
}

// 风险等级
export const RISK_LEVELS = {
  high: { label: '高风险', color: 'red', icon: '🔴' },
  medium: { label: '需关注', color: 'amber', icon: '🟡' },
  low: { label: '低风险', color: 'green', icon: '🟢' },
}
