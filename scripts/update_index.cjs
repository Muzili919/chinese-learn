#!/usr/bin/env node
/**
 * 更新题库索引
 * 统计各知识点题目数量并更新索引文件
 */

const fs = require('fs');
const path = require('path');

const INDEX_PATH = 'src/data/meta/index.json';
const KNOWLEDGE_TREE_PATH = 'src/data/meta/knowledge_tree.json';

/**
 * 统计题目数量
 */
function countQuestions(filePath) {
  try {
    const fullPath = path.resolve(filePath);
    if (!fs.existsSync(fullPath)) {
      return 0;
    }
    const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    return Array.isArray(data) ? data.length : 0;
  } catch (error) {
    console.warn(`⚠️ 读取失败: ${filePath}`, error.message);
    return 0;
  }
}

/**
 * 更新索引
 */
function updateIndex() {
  console.log('📝 正在更新索引...\n');
  
  const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
  let totalCount = 0;
  let updatedCount = 0;
  
  Object.entries(index.index).forEach(([module, subModules]) => {
    console.log(`📁 ${module}`);
    
    Object.entries(subModules).forEach(([subModule, files]) => {
      Object.entries(files).forEach(([fileKey, fileInfo]) => {
        const count = countQuestions(fileInfo.path);
        const oldCount = fileInfo.count || 0;
        
        if (count !== oldCount) {
          console.log(`  ✏️  ${fileInfo.path}: ${oldCount} → ${count}`);
          updatedCount++;
        } else if (count > 0) {
          console.log(`  ✅  ${fileInfo.path}: ${count}`);
        }
        
        fileInfo.count = count;
        totalCount += count;
      });
    });
    
    console.log('');
  });
  
  // 更新时间戳
  index.last_updated = new Date().toISOString().split('T')[0];
  
  // 保存索引
  fs.writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2));
  
  console.log(`📊 总计: ${totalCount} 道题`);
  console.log(`🔄 更新: ${updatedCount} 个文件`);
  console.log('✅ 索引更新完成！\n');
  
  return totalCount;
}

/**
 * 更新知识点树统计
 */
function updateKnowledgeTree(totalCount) {
  console.log('🌳 正在更新知识点树...\n');
  
  const tree = JSON.parse(fs.readFileSync(KNOWLEDGE_TREE_PATH, 'utf8'));
  
  // 更新总计
  Object.entries(tree.knowledge_tree).forEach(([moduleKey, module]) => {
    if (module.sub_modules) {
      Object.entries(module.sub_modules).forEach(([subKey, subModule]) => {
        // 计算该子模块的题目数
        let subTotal = 0;
        
        // 从索引中查找
        const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
        if (index.index[moduleKey] && index.index[moduleKey][subKey]) {
          Object.values(index.index[moduleKey][subKey]).forEach(fileInfo => {
            subTotal += fileInfo.count || 0;
          });
        }
        
        subModule.total_questions = subTotal;
        console.log(`  ${module.name} > ${subModule.name}: ${subTotal} 题`);
      });
    }
  });
  
  tree.last_updated = new Date().toISOString().split('T')[0];
  
  fs.writeFileSync(KNOWLEDGE_TREE_PATH, JSON.stringify(tree, null, 2));
  console.log('\n✅ 知识点树更新完成！\n');
}

/**
 * 生成统计报告
 */
function generateReport() {
  console.log('📈 生成统计报告...\n');
  
  const index = JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
  const report = {
    generated_at: new Date().toISOString(),
    summary: {},
    details: []
  };
  
  Object.entries(index.index).forEach(([module, subModules]) => {
    report.summary[module] = 0;
    
    Object.entries(subModules).forEach(([subModule, files]) => {
      Object.entries(files).forEach(([fileKey, fileInfo]) => {
        const count = fileInfo.count || 0;
        report.summary[module] += count;
        
        report.details.push({
          path: `${module}.${subModule}.${fileKey}`,
          file: fileInfo.path,
          count: count,
          tags: fileInfo.tags || [],
          ability_tags: fileInfo.ability_tags || []
        });
      });
    });
  });
  
  // 计算总计
  report.total = Object.values(report.summary).reduce((a, b) => a + b, 0);
  
  // 保存报告
  const reportPath = 'src/data/meta/report.json';
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('模块统计:');
  Object.entries(report.summary).forEach(([module, count]) => {
    console.log(`  ${module}: ${count} 题`);
  });
  console.log(`\n总计: ${report.total} 题`);
  console.log(`\n✅ 报告已保存: ${reportPath}\n`);
}

/**
 * 主函数
 */
function main() {
  console.log('🚀 题库索引更新工具\n');
  console.log('=' .repeat(50) + '\n');
  
  // 检查文件是否存在
  if (!fs.existsSync(INDEX_PATH)) {
    console.error(`❌ 索引文件不存在: ${INDEX_PATH}`);
    process.exit(1);
  }
  
  // 更新索引
  const totalCount = updateIndex();
  
  // 更新知识点树
  updateKnowledgeTree(totalCount);
  
  // 生成报告
  generateReport();
  
  console.log('✨ 全部完成！');
}

// 运行
main();
