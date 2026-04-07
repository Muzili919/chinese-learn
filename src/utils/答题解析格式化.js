/**
 * 初中语文答题解析格式化工具
 * 用于统一格式化所有题目的解析，符合初中教学标准
 */

/**
 * 格式化字音字形题解析
 * @param {Object} question 题目对象
 * @param {string} originalAnalysis 原始解析
 * @returns {string} 格式化后的解析
 */
export function formatPronunciationAnalysis(question, originalAnalysis) {
  const { question: qText, options, answer } = question;
  
  return `【考点定位】本题考查多音字/易错字的正确读音辨析。
【解题思路】${getPronunciationAnalysisSteps(options, answer)}
【易错警示】注意区分多音字在不同词语中的读音规律，避免凭感觉读音。
【知识拓展】初中阶段需掌握《普通话异读词审音表》中的常见多音字读音。`;
}

/**
 * 格式化成语理解题解析
 * @param {Object} question 题目对象
 * @param {string} originalAnalysis 原始解析
 * @returns {string} 格式化后的解析
 */
export function formatIdiomAnalysis(question, originalAnalysis) {
  const { question: qText, answer } = question;
  const idiom = qText.match(/「(.+?)」/)?.[1] || '';
  
  return `【成语解释】${answer}
【出处典故】${getIdiomOrigin(idiom)}
【用法示例】①${getIdiomExample(idiom, 1)}②${getIdiomExample(idiom, 2)}
【近义成语】${getIdiomSynonyms(idiom)}
【反义成语】${getIdiomAntonyms(idiom)}
【易混成语】注意区分${idiom}与相似成语的细微差别。`;
}

/**
 * 格式化修辞手法题解析
 * @param {Object} question 题目对象
 * @param {string} originalAnalysis 原始解析
 * @returns {string} 格式化后的解析
 */
export function formatRhetoricAnalysis(question, originalAnalysis) {
  const { question: qText, options, answer } = question;
  
  return `【修辞判断】本题考查${answer}修辞手法的识别。
【手法分析】${getRhetoricAnalysis(qText, answer)}
【表达效果】${getRhetoricEffect(answer)}
【对比分析】${getOtherOptionsAnalysis(options, answer)}
【知识要点】初中阶段需掌握比喻、拟人、夸张、排比、对偶、反复等常见修辞手法。`;
}

/**
 * 格式化古诗词题解析
 * @param {Object} question 题目对象
 * @param {string} originalAnalysis 原始解析
 * @returns {string} 格式化后的解析
 */
export function formatPoetryAnalysis(question, originalAnalysis) {
  const { question: qText, answer } = question;
  
  return `【考点定位】本题考查古诗词默写与理解。
【诗句赏析】${getPoetryAppreciation(qText, answer)}
【情感把握】${getPoetryEmotion(qText)}
【手法鉴赏】${getPoetryTechnique(qText)}
【知识拓展】掌握课内必背古诗词，理解诗歌的意境和情感。`;
}

/**
 * 格式化阅读理解题解析
 * @param {Object} question 题目对象
 * @param {string} originalAnalysis 原始解析
 * @returns {string} 格式化后的解析
 */
export function formatReadingAnalysis(question, originalAnalysis) {
  const { question: qText, answer } = question;
  
  return `【解题方法】${getReadingMethod(qText)}
【信息定位】${getInfoLocation(qText)}
【答案验证】${getAnswerVerification(answer)}
【答题规范】阅读题答案要简洁准确，尽量使用原文词语。`;
}

// 辅助函数
function getPronunciationAnalysisSteps(options, answer) {
  const steps = options.map((opt, index) => {
    const letter = String.fromCharCode(65 + index);
    const isCorrect = opt === answer;
    return `${letter}项${opt}${isCorrect ? '读音正确' : '读音有误，应为...'}`;
  });
  return steps.join('；');
}

function getIdiomOrigin(idiom) {
  // 简化的成语出处映射
  const origins = {
    '胸有成竹': '出自宋代苏轼《文与可画筼筜谷偃竹记》',
    '守株待兔': '出自《韩非子·五蠹》',
    '亡羊补牢': '出自《战国策·楚策四》',
    '画蛇添足': '出自《战国策·齐策二》',
    '掩耳盗铃': '出自《吕氏春秋·自知》'
  };
  return origins[idiom] || '出自古代典故，具体出处需查阅相关资料。';
}

function getIdiomExample(idiom, exampleNum) {
  const examples = {
    '胸有成竹': [
      '他对于这次考试胸有成竹，早就复习得很充分了。',
      '面对客户的提问，他胸有成竹地给出了完美的解决方案。'
    ],
    '守株待兔': [
      '学习要主动思考，不能守株待兔地等待老师讲解。',
      '市场竞争激烈，企业必须不断创新，不能守株待兔。'
    ],
    '亡羊补牢': [
      '虽然这次比赛输了，但只要我们亡羊补牢，下次还有机会。',
      '发现问题要及时改正，亡羊补牢为时不晚。'
    ]
  };
  return examples[idiom]?.[exampleNum - 1] || `使用${idiom}的典型句子。`;
}

function getIdiomSynonyms(idiom) {
  const synonyms = {
    '胸有成竹': '心中有数、稳操胜券、十拿九稳',
    '守株待兔': '刻舟求剑、缘木求鱼、坐享其成',
    '亡羊补牢': '见兔顾犬、江心补漏'
  };
  return synonyms[idiom] || '相关近义成语';
}

function getIdiomAntonyms(idiom) {
  const antonyms = {
    '胸有成竹': '心中无数、不知所措、毫无准备',
    '守株待兔': '随机应变、见机行事、主动进取',
    '亡羊补牢': '防患未然、未雨绸缪'
  };
  return antonyms[idiom] || '相关反义成语';
}

function getRhetoricAnalysis(text, rhetoric) {
  const analyses = {
    '比喻': '找出本体、喻体和比喻词，分析比喻的生动形象性。',
    '拟人': '指出赋予事物的人格化特征，分析其表达效果。',
    '夸张': '分析夸张的程度和表达效果，说明如何突出事物特征。',
    '排比': '找出排比的句式结构，分析其节奏感和气势。'
  };
  return analyses[rhetoric] || `分析${rhetoric}手法的具体运用。`;
}

function getRhetoricEffect(rhetoric) {
  const effects = {
    '比喻': '使表达更加生动形象，增强语言感染力。',
    '拟人': '使事物具有人的情感，增强亲切感和表现力。',
    '夸张': '突出事物特征，增强表达效果，引起读者注意。',
    '排比': '增强语言气势，使表达更有节奏感和说服力。'
  };
  return effects[rhetoric] || `增强表达效果，使语言更加生动有力。`;
}

function getOtherOptionsAnalysis(options, correctAnswer) {
  const otherOptions = options.filter(opt => opt !== correctAnswer);
  return `其他选项分析：${otherOptions.map(opt => `"${opt}"不是${correctAnswer}，因为...`).join('；')}`;
}

function getPoetryAppreciation(text, answer) {
  if (text.includes('下一句')) {
    return `这是${getPoemTitle(text)}中的名句，${answer}承接上句，表达${getPoemTheme(text)}。`;
  }
  return `赏析诗句的意境和表达技巧。`;
}

function getPoemTitle(text) {
  if (text.includes('床前明月光')) return '李白《静夜思》';
  if (text.includes('春眠不觉晓')) return '孟浩然《春晓》';
  return '相关诗歌';
}

function getPoemTheme(text) {
  if (text.includes('床前明月光')) return '诗人对故乡的深切思念';
  if (text.includes('春眠不觉晓')) return '诗人对春天的热爱和珍惜';
  return '诗歌的主题情感';
}

function getPoetryEmotion(text) {
  return '体会诗人通过诗歌表达的思想感情。';
}

function getPoetryTechnique(text) {
  return '分析诗歌运用的艺术手法，如借景抒情、托物言志等。';
}

function getReadingMethod(text) {
  if (text.includes('中心思想')) return '找首尾段落，抓关键词，概括主要内容。';
  if (text.includes('词语含义')) return '结合上下文，理解词语在文中的特定含义。';
  if (text.includes('作用')) return '从内容、结构、情感三个方面分析作用。';
  return '仔细阅读原文，准确提取信息。';
}

function getInfoLocation(text) {
  return '在原文相关段落中找到对应信息。';
}

function getAnswerVerification(answer) {
  return '检查答案是否与原文一致，表述是否准确完整。';
}

/**
 * 根据题目类型自动格式化解析
 * @param {Object} question 题目对象
 * @param {string} originalAnalysis 原始解析
 * @returns {string} 格式化后的解析
 */
export function autoFormatAnalysis(question, originalAnalysis) {
  const { ability_tag, knowledge_tag } = question;
  
  if (ability_tag.includes('字音') || ability_tag.includes('字形')) {
    return formatPronunciationAnalysis(question, originalAnalysis);
  }
  
  if (knowledge_tag === '成语' || ability_tag.includes('成语')) {
    return formatIdiomAnalysis(question, originalAnalysis);
  }
  
  if (ability_tag.includes('修辞')) {
    return formatRhetoricAnalysis(question, originalAnalysis);
  }
  
  if (knowledge_tag === '古诗词') {
    return formatPoetryAnalysis(question, originalAnalysis);
  }
  
  if (ability_tag.includes('信息提取') || ability_tag.includes('阅读理解')) {
    return formatReadingAnalysis(question, originalAnalysis);
  }
  
  // 默认格式化
  return `【考点定位】本题考查${knowledge_tag}相关知识。
【解题思路】${originalAnalysis}
【答题要点】注意审题，准确作答，书写规范。`;
}

/**
 * 批量格式化题目解析
 * @param {Array} questions 题目数组
 * @returns {Array} 格式化后的题目数组
 */
export function batchFormatQuestions(questions) {
  return questions.map(q => ({
    ...q,
    analysis: autoFormatAnalysis(q, q.analysis || '')
  }));
}