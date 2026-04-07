/**
 * 题库加载器使用示例
 * 展示如何使用新的结构化题库系统
 */

import {
  loadQuestions,
  loadMultiKnowledge,
  loadByAbility,
  getKnowledgeTree,
  getKnowledgeStats,
  listAllKnowledge
} from './questionLoader';

// ============ 示例 1: 加载单个知识点 ============
async function example1() {
  console.log('=== 示例 1: 加载多音字题目 ===');
  
  const result = await loadQuestions('vocab.pinyin.polyphone', {
    difficulty: 2,      // 难度2
    count: 5,           // 5道题
    shuffle: true       // 打乱顺序
  });
  
  if (result.success) {
    console.log(`成功加载 ${result.returned} 道题`);
    console.log('题目示例:', result.questions[0]?.question);
  }
}

// ============ 示例 2: 批量加载多个知识点 ============
async function example2() {
  console.log('\n=== 示例 2: 批量加载多个知识点 ===');
  
  const knowledgeList = [
    { knowledge: 'vocab.pinyin.polyphone', count: 3 },
    { knowledge: 'idiom.story.origin', count: 3 },
    { knowledge: 'poetry.recite.fill_blank', count: 2 }
  ];
  
  const result = await loadMultiKnowledge(knowledgeList, {
    shuffle: true
  });
  
  if (result.success) {
    console.log(`成功加载 ${result.total_questions} 道题`);
    result.questions.forEach((q, i) => {
      console.log(`${i + 1}. [${q.knowledge_tag}] ${q.question.substring(0, 30)}...`);
    });
  }
}

// ============ 示例 3: 按能力标签加载 ============
async function example3() {
  console.log('\n=== 示例 3: 按能力标签加载 ===');
  
  // 加载所有"字音辨析"相关的题目
  const result = await loadByAbility('字音辨析', {
    count: 10
  });
  
  if (result.success) {
    console.log(`找到 ${result.sources} 个相关文件`);
    console.log(`加载了 ${result.total_questions} 道题`);
  }
}

// ============ 示例 4: 获取知识点信息 ============
function example4() {
  console.log('\n=== 示例 4: 获取知识点信息 ===');
  
  // 获取知识点树
  const tree = getKnowledgeTree();
  console.log('可用模块:', Object.keys(tree).join(', '));
  
  // 获取特定知识点统计
  const stats = getKnowledgeStats('vocab.pinyin');
  console.log('字音辨析模块:', stats);
  
  // 列出所有知识点
  const allKnowledge = listAllKnowledge();
  console.log(`\n总共有 ${allKnowledge.length} 个知识点`);
  console.log('前5个:', allKnowledge.slice(0, 5).map(k => k.path));
}

// ============ 示例 5: 针对薄弱项出题 ============
async function example5() {
  console.log('\n=== 示例 5: 针对薄弱项出题 ===');
  
  // 假设用户薄弱项分析结果
  const weakPoints = [
    { knowledge: 'vocab.pinyin.polyphone', error_rate: 0.6 },
    { knowledge: 'idiom.story.origin', error_rate: 0.4 },
    { knowledge: 'sentence.error.identify', error_rate: 0.7 }
  ];
  
  // 按错误率排序，优先练习错误率高的
  weakPoints.sort((a, b) => b.error_rate - a.error_rate);
  
  const practicePlan = weakPoints.map(wp => ({
    knowledge: wp.knowledge,
    count: wp.error_rate > 0.5 ? 10 : 5  // 错误率高就多练
  }));
  
  const result = await loadMultiKnowledge(practicePlan);
  
  if (result.success) {
    console.log(`针对薄弱项生成 ${result.total_questions} 道练习题`);
  }
}

// ============ 示例 6: 按年级筛选 ============
async function example6() {
  console.log('\n=== 示例 6: 按年级筛选 ===');
  
  // 5年级重点
  const grade5Focus = [
    'vocab.pinyin.polyphone',
    'vocab.meaning.context',
    'idiom.meaning.meaning',
    'poetry.recite.fill_blank',
    'poetry.author.author'
  ];
  
  const practicePlan = grade5Focus.map(k => ({
    knowledge: k,
    count: 2,
    difficulty: 2  // 5年级用难度2
  }));
  
  const result = await loadMultiKnowledge(practicePlan);
  console.log(`5年级练习题: ${result.total_questions} 道`);
}

// ============ 运行所有示例 ============
async function runExamples() {
  try {
    example4();  // 同步示例
    
    await example1();
    await example2();
    await example3();
    await example5();
    await example6();
    
    console.log('\n✅ 所有示例运行完成！');
  } catch (error) {
    console.error('❌ 运行失败:', error);
  }
}

// 导出示例函数供调用
export {
  example1,
  example2,
  example3,
  example4,
  example5,
  example6,
  runExamples
};

// 如果直接运行此文件
if (import.meta.main) {
  runExamples();
}
