#!/usr/bin/env node
/**
 * 题库迁移脚本
 * 将旧版题库按知识点拆分到新结构
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  sourceDir: 'src/data',
  targetDir: 'src/data/basic',
  backupDir: 'src/data/legacy'
};

// 分类规则
const CLASSIFICATION_RULES = {
  vocab: {
    pinyin: {
      polyphone: (q) => {
        const text = (q.question + ' ' + (q.analysis || '')).toLowerCase();
        const polyphoneChars = ['多音字', '薄', '参', '着', '模', '供', '差', '处', '强', '兴', '载', '泊', '宿', '禁', '降', '间', '分', '数', '重', '转', '倒', '折', '舍', '斗', '称', '曲', '少', '还', '量', '难', '便', '爪', '看', '长', '只', '觉', '空', '干', '种', '发', '结', '相', '背', '似', '好', '乐', '为', '都', '行', '作', '当', '更', '没', '将', '划', '宁', '朝', '传', '调', '角', '露', '省', '磨', '应', '塞', '弹', '累', '率', '卷', '扁', '削', '血', '殷', '咽', '劲', '吓', '恶', '哄', '混', '奇', '炮', '铺', '切', '扇', '盛', '识', '踏', '提', '挑', '瓦', '鲜', '纤', '旋', '压', '叶', '饮', '晕', '涨', '正', '中', '轴', '属', '著', '钻'];
        return text.includes('多音字') || 
               text.includes('读音正确') || 
               text.includes('注音') ||
               polyphoneChars.some(c => text.includes(c));
      },
      easy_error: (q) => {
        const text = (q.question + ' ' + (q.analysis || '')).toLowerCase();
        return text.includes('易错') || text.includes('习惯误读');
      },
      character_shape: (q) => {
        const text = (q.question + ' ' + (q.analysis || '')).toLowerCase();
        return text.includes('形近字') || text.includes('字形') || text.includes('错别字');
      }
    },
    meaning: {
      context: (q) => {
        const text = (q.question + ' ' + (q.analysis || '')).toLowerCase();
        return text.includes('语境') || text.includes('词义');
      },
      near_synonym: (q) => {
        const text = (q.question + ' ' + (q.analysis || '')).toLowerCase();
        return text.includes('近义词') || text.includes('词语辨析');
      }
    }
  },
  idiom: {
    meaning: {
      meaning: (q) => {
        const text = (q.question + ' ' + (q.analysis || '')).toLowerCase();
        return text.includes('意思是') && !text.includes('出自') && !text.includes('典故');
      },
      usage: (q) => {
        const text = (q.question + ' ' + (q.analysis || '')).toLowerCase();
        return text.includes('运用') || text.includes('使用') || text.includes('句子');
      }
    },
    story: {
      origin: (q) => {
        const text = (q.question + ' ' + (q.analysis || '')).toLowerCase();
        return text.includes('出自') || text.includes('典故') || text.includes('来源') || text.includes('历史');
      }
    }
  },
  poetry: {
    recite: {
      fill_blank: (q) => {
        const text = (q.question + ' ' + (q.ability_tag || '')).toLowerCase();
        return text.includes('默写') || text.includes('下一句') || text.includes('上一句') || text.includes('填空');
      }
    },
    author: {
      author: (q) => {
        const text = (q.question + ' ' + (q.ability_tag || '')).toLowerCase();
        return text.includes('作者') || text.includes('诗人') || text.includes('谁写的');
      },
      dynasty: (q) => {
        const text = (q.question + ' ' + (q.ability_tag || '')).toLowerCase();
        return text.includes('朝代');
      }
    }
  },
  sentence: {
    error: {
      identify: (q) => {
        const text = (q.question + ' ' + (q.ability_tag || '')).toLowerCase();
        return text.includes('病句') || text.includes('语病') || text.includes('没有语病');
      }
    },
    rhetoric: {
      identify: (q) => {
        const text = (q.question + ' ' + (q.ability_tag || '')).toLowerCase();
        return text.includes('修辞') || text.includes('比喻') || text.includes('拟人') || text.includes('排比');
      }
    }
  },
  literature: {
    novel: {
      characters: (q) => {
        const text = (q.question + ' ' + (q.ability_tag || '')).toLowerCase();
        const novelChars = ['四大名著', '西游记', '红楼梦', '水浒传', '三国演义', '孙悟空', '贾宝玉', '诸葛亮', '武松', '林黛玉', '唐僧', '宋江', '刘备', '关羽', '张飞', '曹操', '周瑜', '鲁智深', '李逵'];
        return text.includes('四大名著') || novelChars.some(c => text.includes(c));
      }
    }
  }
};

/**
 * 分类题目
 */
function classifyQuestions(questions, rules) {
  const result = {};
  
  // 初始化分类容器
  Object.entries(rules).forEach(([subModule, files]) => {
    result[subModule] = {};
    Object.keys(files).forEach(fileKey => {
      result[subModule][fileKey] = [];
    });
  });
  
  // 分类每道题
  questions.forEach(q => {
    let classified = false;
    
    Object.entries(rules).forEach(([subModule, files]) => {
      Object.entries(files).forEach(([fileKey, checkFn]) => {
        if (!classified && checkFn(q)) {
          result[subModule][fileKey].push(q);
          classified = true;
        }
      });
    });
    
    // 未分类的放入第一个分类
    if (!classified) {
      const firstSubModule = Object.keys(rules)[0];
      const firstFile = Object.keys(rules[firstSubModule])[0];
      result[firstSubModule][firstFile].push(q);
    }
  });
  
  return result;
}

/**
 * 保存分类后的题目
 */
function saveClassified(classified, module) {
  Object.entries(classified).forEach(([subModule, files]) => {
    Object.entries(files).forEach(([fileKey, questions]) => {
      if (questions.length > 0) {
        const dir = path.join(CONFIG.targetDir, module, subModule);
        const filePath = path.join(dir, `${fileKey}.json`);
        
        // 确保目录存在
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        
        // 保存文件
        fs.writeFileSync(filePath, JSON.stringify(questions, null, 2));
        console.log(`✅ 保存: ${filePath} (${questions.length} 题)`);
      }
    });
  });
}

/**
 * 迁移单个题库文件
 */
function migrateFile(sourceFile, module) {
  console.log(`\n📁 迁移: ${sourceFile}`);
  
  const sourcePath = path.join(CONFIG.sourceDir, sourceFile);
  
  if (!fs.existsSync(sourcePath)) {
    console.log(`⚠️ 文件不存在: ${sourcePath}`);
    return;
  }
  
  const questions = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  console.log(`📊 总计: ${questions.length} 题`);
  
  const rules = CLASSIFICATION_RULES[module];
  if (!rules) {
    console.log(`⚠️ 未找到分类规则: ${module}`);
    return;
  }
  
  const classified = classifyQuestions(questions, rules);
  saveClassified(classified, module);
}

/**
 * 更新索引
 */
function updateIndex() {
  console.log('\n📝 更新索引...');
  
  const indexPath = path.join(CONFIG.sourceDir, 'meta', 'index.json');
  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  
  Object.entries(index.index).forEach(([module, subModules]) => {
    Object.entries(subModules).forEach(([subModule, files]) => {
      Object.entries(files).forEach(([fileKey, fileInfo]) => {
        const filePath = path.join(fileInfo.path);
        if (fs.existsSync(filePath)) {
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          fileInfo.count = Array.isArray(data) ? data.length : 0;
        }
      });
    });
  });
  
  fs.writeFileSync(indexPath, JSON.stringify(index, null, 2));
  console.log('✅ 索引更新完成');
}

/**
 * 主函数
 */
function main() {
  console.log('🚀 开始题库迁移...\n');
  
  // 迁移各个题库
  migrateFile('questions_vocab.json', 'vocab');
  migrateFile('questions_idiom.json', 'idiom');
  migrateFile('questions_poetry.json', 'poetry');
  migrateFile('questions_sentence.json', 'sentence');
  migrateFile('questions_literature.json', 'literature');
  
  // 更新索引
  updateIndex();
  
  console.log('\n✨ 迁移完成！');
}

// 运行
main();
