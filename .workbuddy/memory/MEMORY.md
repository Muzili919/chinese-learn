# 项目记忆

## chinese-learn 项目
- 初中学习辅助Web应用，包含选择题练习功能
- 技术栈：React + Vite + Tailwind
- 部署在 Vercel

## 题库文件
- `src/data/questions_politics_choice.json` — 初中政治选择题120题
- 模块分布：宪法与法律48题 / 道德与心理30题 / 国情国策24题 / 社会生活18题
- 答案分布：ABCD各30题（完美均匀）
- 难度分布：基础72 / 提升34 / 拓展14
- 所有题目均情境化出题、含干扰项谬误分析

## 题库生成注意事项
- 生成脚本用Python json.dump输出，避免中文引号导致JSON解析失败
- 选项打乱后必须同步更新analysis中的干扰项引用
- 原始题目答案不都是B，需要根据实际answer字段定位正确选项
- 生成脚本存放于 `scripts/` 目录

## 关键日期
- 2026-04-12: 政治选择题120题库完成生成、修复和审校
- 2026-04-15: 英语题库全面修复（听力question+完形options+前端inline_choice兜底）
- 2026-04-15: 宠物系统P0+P1升级（3→18只宠物池+动态图片+衰减优化+配饰25件）commit 7cd251f

## 宠物系统架构（重要！）
- **Pet.jsx** 核心渲染组件：PET_SPRITE_MAP映射18只宠物图片，fallback到dragon图
- **type参数传递链**: MV1Demo(currentPet.poolId) → Pet(type) → getPetSprites(type) → 图片URL
- **图片命名规范**: {prefix}-level-{range}.png (3等级) + {prefix}-emotion-{key}.png (9情绪)
- **gamification.js** PET_POOL定义18只宠物(poolId/name/emoji/rarity/spritePrefix/personality)
- **抽卡权重**: DRAW_WEIGHTS对象 early/mid/late三档
- **衰减**: hunger 0.2(8h) / cleanliness 0.28(6h) / energy 0.15 / intimacy -0.02
- **配饰**: ACCESSORY_SHOP共25件（10头+8颈+7背），PetSwitchPanel显示总数
- **默认宠物**: pet_kitten（小橘猫，N级）
- **⚠️ 新宠物精灵图尚未生成**：17只新宠暂时共享dragon fallback图

## 前端渲染模式（EnglishQuizPage）
- `detectMode(q)` 决定每道题走哪个渲染路径
- 优先级：open_ended → multi_sub → true_false → matching → ordering **→ choice → inline_choice(兜底)** → text_fill → writing
- **关键**：`q.options.length >= 2` 才判定为choice模式，否则降级
- 多子题格式：answer含`(1)(2)` → `isMultiPartAnswer()` 检测 → `MultiSubQuiz` 组件自动从子题文本提取选项
- 完形填空cloze：答案格式`1.B 2.C...`，需从analysis提取选项

## 英语题库数据规范
- 听力题：question必须写具体问题（不能是通用模板），listening_text存原文
- 阅读理解多子题：options可空（前端MultiSubQuiz处理），但question末尾必须含完整子题`(n) Q? A..B..C..D..`
- 完形填空cloze：必须有options数组，每个空一行 `(1) A.xxx B.yyy C.zzz D.www`
- 填空题fill_blank：options可为空（前端text_fill文字输入模式）
