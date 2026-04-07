/**
 * 🎯 模板驱动出题引擎 - Demo演示
 * 直接运行: node demo_question_generator.js
 */

// 模拟变量库（实际项目中会从JSON文件读取）
const VARIABLES = {
  // ====== 多音字库 ======
  polyphone_words: [
    {
      word: "强",
      variants: [
        { pinyin: "qiáng", meaning: "健壮有力", contexts: ["身体强壮", "坚强", "强国"] },
        { pinyin: "qiǎng", meaning: "勉强", contexts: ["强迫", "强求", "强人所难"] },
        { pinyin: "jiàng", meaning: "强硬固执", contexts: ["倔强"] }
      ],
      common_error: "qiáng"
    },
    {
      word: "处",
      variants: [
        { pinyin: "chǔ", meaning: "处理、相处", contexts: ["相处", "处理", "处分"] },
        { pinyin: "chù", meaning: "地方、方面", contexts: ["好处", "到处", "深处"] }
      ],
      common_error: "chù"
    },
    {
      word: "参",
      variants: [
        { pinyin: "cān", meaning: "加入", contexts: ["参加", "参考", "参军"] },
        { pinyin: "shēn", meaning: "人参", contexts: ["人参", "党参"] },
        { pinyin: "cēn", meaning: "参差不齐", contexts: ["参差"] }
      ],
      common_error: "cān"
    },
    {
      word: "降",
      variants: [
        { pinyin: "jiàng", meaning: "落下", contexts: ["降落", "降温", "下降"] },
        { pinyin: "xiáng", meaning: "投降", contexts: ["投降", "降服", "招降"] }
      ],
      common_error: "jiàng"
    },
    {
      word: "折",
      variants: [
        { pinyin: "zhé", meaning: "断、弯曲", contexts: ["折断", "曲折", "折旧"] },
        { pinyin: "shé", meaning: "亏损", contexts: ["折本", "亏折"] },
        { pinyin: "zhē", meaning: "翻转", contexts: ["折腾", "折跟头"] }
      ],
      common_error: "zhé"
    }
  ],

  // ====== 成语库 ======
  idiom_library: [
    {
      idiom: "胸有成竹",
      meaning: "比喻做事之前已经有全面的考虑和把握",
      origin: "出自宋代苏轼《文与可画筼筜谷偃竹记》",
      example: "小明胸有成竹地走进了考场。",
      wrong_explanations: [
        "形容竹子长得很高",
        "比喻心里有很多竹子",
        "形容非常爱吃竹子"
      ]
    },
    {
      idiom: "画蛇添足",
      meaning: "比喻多此一举，反而坏事",
      origin: "出自《战国策·齐策二》",
      example: "这篇文章已经写得很好了，你再修改就是画蛇添足了。",
      wrong_explanations: [
        "形容画得很好",
        "比喻画画技术高超",
        "形容脚很会画画"
      ]
    },
    {
      idiom: "守株待兔",
      meaning: "比喻不主动努力，只想得到意外收获",
      origin: "出自《韩非子·五蠹》",
      example: "有的人整天守株待兔，等着好运来临。",
      wrong_explanations: [
        "形容很有耐心",
        "比喻保护动物",
        "形容住在树下"
      ]
    },
    {
      idiom: "滥竽充数",
      meaning: "比喻以次充好，不懂装懂",
      origin: "出自《韩非子·内储说上》",
      example: "他不会弹琴 却在那里��竽充数。",
      wrong_explanations: [
        "形容音乐很好听",
        "比喻喜欢吹竽",
        "形容种类很多"
      ]
    },
    {
      idiom: "井底之蛙",
      meaning: "比喻见识短浅的人",
      origin: "出自《庄子·外物》",
      example: "我们不要做井底之蛙，要多了解外面的世界。",
      wrong_explanations: [
        "形容住在井里",
        "比喻喜欢跳水",
        "形容井水很干净"
      ]
    }
  ],

  // ====== 病句库 ======
  error_sentences: [
    {
      sentence: "通过这次活动，使我明白了团结的重要性。",
      error_type: "成分残缺",
      cause: "滥用「通过」导致主语缺失",
      fix: "删除「通过」或「使」",
      correct: "通过这次活动，我明白了团结的重要性。"
    },
    {
      sentence: "我们要继承和发扬老一辈的革命事业。",
      error_type: "搭配不当",
      cause: "「继承」和「事业」搭配不当",
      fix: "「继承」改为「发扬」或「事业」改为「精神」",
      correct: "我们要继承和发扬老一辈的革命精神。"
    },
    {
      sentence: "同学们讨论并听取了他的建议。",
      error_type: "语序不当",
      cause: "「讨论」和「听取」顺序颠倒",
      fix: "调整顺序为「听取并讨论」",
      correct: "同学们听取并讨论了他的建议。"
    },
    {
      sentence: "这本书的内容和插图都很精致。",
      error_type: "搭配不当",
      cause: "「内容」不能用「精致」形容",
      fix: "改为「很丰富」",
      correct: "这本书的内容很丰富，插图都很精致。"
    },
    {
      sentence: "是否努力学习是成功的关键。",
      error_type: "两面对一面",
      cause: "「是否」是两面，「成功」是一面",
      fix: "删除「是否」或改为「能否」",
      correct: "努力学习是成功的关键。"
    }
  ]
};

// ====== 工具函数 ======
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function getOptionLetter(index) {
  return ['A', 'B', 'C', 'D'][index];
}

// ====== 题目生成器 ======

/**
 * 生成字音辨析题（多音字）
 */
function generatePinyinQuestion() {
  const words = VARIABLES.polyphone_words;
  const selected = words[Math.floor(Math.random() * words.length)];
  
  // 打乱变体顺序
  const shuffledVariants = shuffleArray([...selected.variants]);
  const correctVariant = shuffledVariants[0];
  const wrongVariants = shuffledVariants.slice(1, 4);
  
  // 生成选项
  const allOptions = [correctVariant, ...wrongVariants];
  const optionLabels = shuffleArray([0, 1, 2, 3]);
  
  let options = [];
  let answerIndex = -1;
  
  allOptions.forEach((opt, i) => {
    const label = getOptionLetter(i);
    options.push(`${label}. ${opt.pinyin}（${opt.meaning}）`);
    if (opt === correctVariant) {
      answerIndex = i;
    }
  });
  
  // 生成题干
  const question = `
【字音辨析】下列加点字读音正确的一项是

「` + selected.word + `」在句子 "` + correctVariant.contexts[0] + `" 中的读音是

` + options.join('\n') + `
`;
  
  // 生成解析
  const analysis = `
【考点】多音字辨析
【解析】` + selected.word + `是多音字，在 "` + correctVariant.contexts[0] + `"中表示"` + correctVariant.meaning + `"，应读【` + correctVariant.pinyin + `】。
【易错警示】注意：` + selected.word + `的另一个读音是 ` + selected.variants.map(v => v.pinyin).join('、') + `，含义不同。
【知识拓展】
` + selected.variants.map(v => `  • ` + v.pinyin + ` → ` + v.meaning).join('\n') + `
`.trim();

  return {
    id: `pinyin_${Date.now()}`,
    knowledge: 'vocab.pinyin',
    type: 'single_choice',
    question: question.trim(),
    options: allOptions.map((opt, i) => `${getOptionLetter(i)}. ${opt.pinyin}`),
    answer: getOptionLetter(answerIndex),
    analysis: analysis.replace('${correctPane}', correctVariant.pinyin)
  };
}

/**
 * 生成成语题
 */
function generateIdiomQuestion() {
  const idioms = VARIABLES.idiom_library;
  const selected = idioms[Math.floor(Math.random() * idioms.length)];
  
  // 生成选项：正确答案 + 3个错误解释
  const allMeanings = [
    selected.meaning,
    ...selected.wrong_explanations.slice(0, 3)
  ];
  const shuffled = shuffleArray(allMeanings);
  
  let options = [];
  let answerIndex = -1;
  
  shuffled.forEach((meaning, i) => {
    options.push(`${getOptionLetter(i)}. ${meaning}`);
    if (meaning === selected.meaning) {
      answerIndex = i;
    }
  });
  
  const question = `
【成语理解】下列成语解释正确的一项是

「` + selected.idiom + `」的正确解释是

` + options.join('\n') + `
`;
  
  const analysis = `
【考点】成语含义理解
【解析】` + selected.idiom + `出自` + selected.origin + `。
  原意为：` + selected.meaning + `
  例句：` + selected.example + `
【易错警示】注意区分成语的字面意思和实际含义！
`.trim();

  return {
    id: `idiom_${Date.now()}`,
    knowledge: 'idiom.meaning',
    type: 'single_choice',
    question: question.trim(),
    options: shuffled.map((m, i) => `${getOptionLetter(i)}. ${m}`),
    answer: getOptionLetter(answerIndex),
    analysis: analysis
  };
}

/**
 * 生成病句题
 */
function generateErrorSentenceQuestion() {
  const sentences = VARIABLES.error_sentences;
  const selected = sentences[Math.floor(Math.random() * sentences.length)];
  
  // 固定选项
  const options = [
    'A. 没有语病',
    'B. 语序不当',
    'C. 成分残缺/搭配不当',
    'D. 表述不明/两面对一面'
  ];
  
  const typeToLetter = {
    '成分残缺': 'C',
    '搭配不当': 'C',
    '语序不当': 'B',
    '表述不明': 'D',
    '两面对一面': 'D',
    '没有语病': 'A'
  };
  
  const question = `
【病句辨析】下列句子有语病的一项是

「` + selected.sentence + `」

` + options.join('\n') + `
`;
  
  const analysis = `
【考点】病句辨析
【解析】这句话的问题是「` + selected.error_type + `」。
  病因：` + selected.cause + `
  修改：` + selected.fix + `
  正确句子：` + selected.correct + `
【方法总结】用"主干法"找主谓宾，用"关键词法"判断搭配是否得当。
`.trim();

  return {
    id: `error_${Date.now()}`,
    knowledge: 'sentence.error',
    type: 'single_choice',
    question: question.trim(),
    options: options,
    answer: typeToLetter[selected.error_type] || 'A',
    analysis: analysis
  };
}

// ====== 主生成函数 ======

/**
 * 生成题目
 * @param {string} knowledge - 知识点
 * @param {number} count - 数量
 */
function generateQuestions(knowledge, count = 3) {
  const questions = [];
  
  for (let i = 0; i < count; i++) {
    let question;
    switch (knowledge) {
      case 'vocab.pinyin':
        question = generatePinyinQuestion();
        break;
      case 'idiom.meaning':
        question = generateIdiomQuestion();
        break;
      case 'sentence.error':
        question = generateErrorSentenceQuestion();
        break;
      default:
        question = generatePinyinQuestion();
    }
    questions.push(question);
  }
  
  return questions;
}

// ====== 弱点驱动逻辑 ======

/**
 * 根据错误率��成��练计划
 */
function getTrainingStrategy(errorRate) {
  if (errorRate > 0.5) {
    return {
      type: 'intensive',
      description: '🔴 强化训练：同知识点连续出10题',
      questionCount: 10,
      newRatio: 0.8
    };
  } else if (errorRate > 0.3) {
    return {
      type: 'mixed',
      description: '🟡 混合训练：错题复习 + 新题练习',
      questionCount: 5,
      newRatio: 0.5
    };
  } else {
    return {
      type: 'normal',
      description: '🟢 正常训练：保持学习节奏',
      questionCount: 3,
      newRatio: 0.3
    };
  }
}

// ====== Demo演示 ======

function runDemo() {
  console.log('\n' + '='.repeat(60));
  console.log('🎯 模板驱动出题引擎 - Demo演示');
  console.log('='.repeat(60));
  
  // 1. 生成字音辨析题
  console.log('\n📖 示例1: 字音辨析题（多音字）\n');
  const pinyinQ = generatePinyinQuestion();
  console.log(pinyinQ.question);
  console.log(`\n✅ 正确答案: ${pinyinQ.answer}`);
  console.log(`\n📝 解析:\n${pinyinQ.analysis}`);
  
  // 2. 生成成语题
  console.log('\n' + '-'.repeat(60));
  console.log('\n📖 示例2: 成语含义理解题\n');
  const idiomQ = generateIdiomQuestion();
  console.log(idiomQ.question);
  console.log(`\n✅ 正确答案: ${idiomQ.answer}`);
  console.log(`\n📝 解析:\n${idiomQ.analysis}`);
  
  // 3. 生成病句题
  console.log('\n' + '-'.repeat(60));
  console.log('\n📖 示例3: 病句辨析题\n');
  const errorQ = generateErrorSentenceQuestion();
  console.log(errorQ.question);
  console.log(`\n✅ 正确答案: ${errorQ.answer}`);
  console.log(`\n📝 解析:\n${errorQ.analysis}`);
  
  // 4. 弱点驱动演示
  console.log('\n' + '='.repeat(60));
  console.log('🎯 弱点驱动训练策略演示');
  console.log('='.repeat(60));
  
  const testErrorRates = [0.65, 0.35, 0.15];
  testErrorRates.forEach(rate => {
    const strategy = getTrainingStrategy(rate);
    console.log(`\n错误率 ${(rate * 100).toFixed(0)}%: ${strategy.description}`);
    console.log(`  → 生成 ${strategy.questionCount} 道题，新题比例 ${(strategy.newRatio * 100).toFixed(0)}%`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Demo运行完成！\n');
}

// 运行Demo
runDemo();