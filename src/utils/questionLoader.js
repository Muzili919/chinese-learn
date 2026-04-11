/**
 * 题库加载器
 * 支持按知识点、难度、数量快速加载题目
 * 避免全盘扫描，提高加载效率
 */

// Meta data files (knowledge_tree.json, index.json) are not yet available.
// When they exist, uncomment the imports below:
// import knowledgeTree from '../data/meta/knowledge_tree.json';
// import questionIndex from '../data/meta/index.json';

// Fallback: use empty structures so the module doesn't crash on import
const knowledgeTree = { knowledge_tree: {} };
const questionIndex = { index: {} };

// 缓存已加载的题目
const questionCache = {};

/**
 * 根据知识点路径加载题目
 * @param {string} knowledgePath - 知识点路径，如 "vocab.pinyin.polyphone"
 * @param {Object} options - 选项
 * @param {number} options.difficulty - 难度等级 (1-5)
 * @param {number} options.count - 题目数量
 * @param {boolean} options.shuffle - 是否打乱顺序
 * @param {Array} options.excludeIds - 排除的题目ID
 * @returns {Promise<Object>} 题目列表
 */
export async function loadQuestions(knowledgePath, options = {}) {
  const {
    difficulty = null,
    count = 10,
    shuffle = true,
    excludeIds = []
  } = options;

  try {
    // 1. 解析知识点路径
    const pathParts = knowledgePath.split('.');
    const [module, subModule, fileKey] = pathParts;

    // 2. 从索引中获取文件路径
    const fileInfo = getFileInfoFromIndex(module, subModule, fileKey);
    if (!fileInfo) {
      throw new Error(`未找到知识点: ${knowledgePath}`);
    }

    // 3. 检查缓存
    const cacheKey = `${knowledgePath}_${difficulty || 'all'}`;
    let questions = questionCache[cacheKey];

    // 4. 如果没有缓存，加载文件
    if (!questions) {
      questions = await loadQuestionFile(fileInfo.path);
      
      // 按难度过滤
      if (difficulty !== null) {
        questions = questions.filter(q => q.difficulty === difficulty);
      }
      
      // 存入缓存
      questionCache[cacheKey] = questions;
    }

    // 5. 排除指定ID
    if (excludeIds.length > 0) {
      questions = questions.filter(q => !excludeIds.includes(q.id));
    }

    // 6. 打乱顺序
    if (shuffle) {
      questions = shuffleArray(questions);
    }

    // 7. 截取数量
    const selectedQuestions = questions.slice(0, count);

    return {
      success: true,
      knowledge: knowledgePath,
      total_available: questions.length,
      returned: selectedQuestions.length,
      questions: selectedQuestions,
      metadata: {
        difficulty,
        file_path: fileInfo.path,
        tags: fileInfo.tags || [],
        ability_tags: fileInfo.ability_tags || []
      }
    };

  } catch (error) {
    console.error('加载题目失败:', error);
    return {
      success: false,
      error: error.message,
      knowledge: knowledgePath
    };
  }
}

/**
 * 批量加载多个知识点的题目
 * @param {Array} knowledgeList - 知识点列表 [{knowledge: 'vocab.pinyin', count: 5}, ...]
 * @param {Object} options - 全局选项
 * @returns {Promise<Object>} 合并后的题目列表
 */
export async function loadMultiKnowledge(knowledgeList, options = {}) {
  const results = [];
  const errors = [];

  for (const item of knowledgeList) {
    const result = await loadQuestions(item.knowledge, {
      ...options,
      count: item.count || 5,
      difficulty: item.difficulty || options.difficulty
    });

    if (result.success) {
      results.push(...result.questions);
    } else {
      errors.push({
        knowledge: item.knowledge,
        error: result.error
      });
    }
  }

  // 打乱顺序
  if (options.shuffle !== false) {
    results.sort(() => Math.random() - 0.5);
  }

  return {
    success: errors.length === 0,
    total_questions: results.length,
    questions: results,
    errors: errors.length > 0 ? errors : null
  };
}

/**
 * 根据能力标签加载题目（跨模块）
 * @param {string} abilityTag - 能力标签，如 "字音辨析"
 * @param {Object} options - 选项
 * @returns {Promise<Object>} 题目列表
 */
export async function loadByAbility(abilityTag, options = {}) {
  const { count = 10 } = options;
  
  // 从索引中查找所有包含该能力标签的文件
  const matchingFiles = [];
  
  Object.entries(questionIndex.index).forEach(([module, subModules]) => {
    Object.entries(subModules).forEach(([subModule, files]) => {
      Object.entries(files).forEach(([fileKey, fileInfo]) => {
        if (fileInfo.ability_tags?.includes(abilityTag)) {
          matchingFiles.push({
            knowledge: `${module}.${subModule}.${fileKey}`,
            ...fileInfo
          });
        }
      });
    });
  });

  // 从匹配的文件中随机选择
  const questionsPerFile = Math.ceil(count / matchingFiles.length);
  const allQuestions = [];

  for (const file of matchingFiles) {
    const result = await loadQuestions(file.knowledge, {
      ...options,
      count: questionsPerFile
    });
    if (result.success) {
      allQuestions.push(...result.questions);
    }
  }

  // 打乱并截取
  const shuffled = shuffleArray(allQuestions).slice(0, count);

  return {
    success: true,
    ability: abilityTag,
    sources: matchingFiles.length,
    total_questions: shuffled.length,
    questions: shuffled
  };
}

/**
 * 获取知识点树
 * @returns {Object} 知识点树形结构
 */
export function getKnowledgeTree() {
  return knowledgeTree.knowledge_tree;
}

/**
 * 获取知识点统计信息
 * @param {string} knowledgePath - 知识点路径
 * @returns {Object} 统计信息
 */
export function getKnowledgeStats(knowledgePath) {
  const pathParts = knowledgePath.split('.');
  let current = knowledgeTree.knowledge_tree;
  
  for (const part of pathParts) {
    if (current[part]) {
      current = current[part];
    } else if (current.sub_modules?.[part]) {
      current = current.sub_modules[part];
    } else {
      return null;
    }
  }

  return {
    name: current.name,
    description: current.description,
    difficulty_range: current.difficulty_range,
    total_questions: current.total_questions || 0,
    error_rate: current.error_rate || 0
  };
}

/**
 * 列出所有可用的知识点
 * @returns {Array} 知识点列表
 */
export function listAllKnowledge() {
  const list = [];
  
  Object.entries(knowledgeTree.knowledge_tree).forEach(([moduleKey, module]) => {
    if (module.sub_modules) {
      Object.entries(module.sub_modules).forEach(([subKey, subModule]) => {
        if (subModule.files) {
          subModule.files.forEach(file => {
            const fileKey = file.replace('.json', '');
            list.push({
              path: `${moduleKey}.${subKey}.${fileKey}`,
              name: subModule.name,
              module: module.name,
              difficulty: subModule.difficulty_range,
              description: subModule.description
            });
          });
        }
      });
    }
  });

  return list;
}

// ============ 私有方法 ============

/**
 * 从索引获取文件信息
 */
function getFileInfoFromIndex(module, subModule, fileKey) {
  try {
    return questionIndex.index[module][subModule][fileKey];
  } catch {
    return null;
  }
}

/**
 * 加载题目文件
 */
async function loadQuestionFile(filePath) {
  try {
    // 动态导入JSON文件
    const module = await import(`../${filePath}`);
    return module.default || module;
  } catch (error) {
    console.warn(`文件不存在或为空: ${filePath}`);
    return [];
  }
}

/**
 * 打乱数组
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * 清除缓存
 */
export function clearCache() {
  Object.keys(questionCache).forEach(key => {
    delete questionCache[key];
  });
}

export default {
  loadQuestions,
  loadMultiKnowledge,
  loadByAbility,
  getKnowledgeTree,
  getKnowledgeStats,
  listAllKnowledge,
  clearCache
};
