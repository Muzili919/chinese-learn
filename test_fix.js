// 测试经验系统修复
function testExpSystem() {
  console.log("=== 测试经验系统 ===");
  
  // 测试升级所需经验
  const requiredExp = [100, 120, 144, 173, 208, 250, 300, 360, 432, 518];
  for (let level = 1; level <= 10; level++) {
    const exp = getRequiredExpForLevel(level);
    console.log(`等级 ${level} 升级需要: ${exp} XP (期望: ${requiredExp[level-1]})`);
    if (exp !== requiredExp[level-1]) {
      console.log("❌ 错误!");
    } else {
      console.log("✅ 正确!");
    }
  }
  
  // 测试等级计算
  const testCases = [
    { totalExp: 0, expectedLevel: 1 },
    { totalExp: 100, expectedLevel: 2 },
    { totalExp: 220, expectedLevel: 3 },
    { totalExp: 364, expectedLevel: 4 },
    { totalExp: 537, expectedLevel: 5 }
  ];
  
  console.log("\n=== 测试等级计算 ===");
  for (const testCase of testCases) {
    const level = calcLevel(testCase.totalExp);
    console.log(`总经验 ${testCase.totalExp} -> 等级 ${level} (期望: ${testCase.expectedLevel})`);
    if (level !== testCase.expectedLevel) {
      console.log("❌ 错误!");
    } else {
      console.log("✅ 正确!");
    }
  }
  
  // 测试进度计算
  console.log("\n=== 测试进度计算 ===");
  const progress = calcLevelProgress(250);
  console.log(`总经验 250 -> 等级 ${progress.level}, 当前经验 ${progress.currentExp}/${progress.requiredExp}`);
}

// 模拟函数
function getRequiredExpForLevel(level) {
  if (level <= 1) return 100;
  let exp = 100;
  for (let i = 2; i <= level; i++) {
    exp = Math.round(exp * 1.2);
  }
  return exp;
}

function calcLevel(totalExperience) {
  let level = 1;
  let accumulatedExp = 0;
  let currentLevelExp = 100;
  
  while (accumulatedExp + currentLevelExp <= totalExperience) {
    accumulatedExp += currentLevelExp;
    level++;
    currentLevelExp = Math.round(currentLevelExp * 1.2);
    if (level >= 50) break;
  }
  
  return Math.min(level, 50);
}

function calcLevelProgress(totalExperience) {
  let accumulatedExp = 0;
  let currentLevelExp = 100;
  let level = 1;
  
  while (accumulatedExp + currentLevelExp <= totalExperience) {
    accumulatedExp += currentLevelExp;
    level++;
    currentLevelExp = Math.round(currentLevelExp * 1.2);
    if (level >= 50) break;
  }
  
  const currentExp = totalExperience - accumulatedExp;
  return { currentExp, requiredExp: currentLevelExp, level };
}

testExpSystem();