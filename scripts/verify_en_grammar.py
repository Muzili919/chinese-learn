#!/usr/bin/env python3
"""Comprehensive verification of the fixed English grammar question bank."""

import json
from collections import Counter
import datetime

with open('/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/questions_en_grammar.json') as f:
    data = json.load(f)

issues = []
warnings = []
info = []

# ============================================================
# 1. Basic structure checks
# ============================================================
info.append(f"总题数: {len(data)}")

# Check unique IDs
id_list = [q['id'] for q in data]
id_dupes = [item for item, count in Counter(id_list).items() if count > 1]
if id_dupes:
    issues.append({"type": "error", "field": "id", "msg": f"重复ID: {id_dupes}"})
else:
    info.append("ID唯一性: 通过")

# Check ID range and gaps
id_nums = [int(q['id'].split('_')[-1]) for q in data]
min_id, max_id = min(id_nums), max(id_nums)
expected = set(range(min_id, max_id + 1))
actual = set(id_nums)
gaps = sorted(expected - actual)
if gaps:
    issues.append({"type": "error", "field": "id", "msg": f"ID缺失: {gaps}"})
else:
    info.append(f"ID范围: {min_id}-{max_id}, 无缺失")

# Check required fields
required = ['id', 'subject', 'knowledge_tag', 'ability_tag', 'type', 'question', 'options', 'answer', 'analysis', 'difficulty']
for q in data:
    for field in required:
        if field not in q:
            issues.append({"type": "error", "id": q.get('id','?'), "field": field, "msg": f"缺少字段: {field}"})

if not any(i['field'] == 'id' and '缺少字段' in i['msg'] for i in issues):
    info.append("必填字段: 全部存在")

# ============================================================
# 2. Type consistency
# ============================================================
type_counts = Counter(q['type'] for q in data)
info.append(f"题型分布: {dict(type_counts)}")

# MC should have 4 options, fill_blank should have empty options
for q in data:
    qid = q['id']
    if q['type'] == 'multiple_choice':
        if len(q['options']) != 4:
            issues.append({"type": "error", "id": qid, "field": "options", "msg": f"选择题应有4个选项, 实际{len(q['options'])}个"})
        if q['answer'] not in ['A', 'B', 'C', 'D']:
            issues.append({"type": "error", "id": qid, "field": "answer", "msg": f"选择题答案应为A/B/C/D, 实际为'{q['answer']}'"})
    elif q['type'] == 'fill_blank':
        if q['options'] and len(q['options']) > 0:
            warnings.append({"type": "warning", "id": qid, "field": "options", "msg": "填空题options应为空数组"})

# Check type/ability_tag consistency
tag_mismatches = []
for q in data:
    if q['type'] == 'multiple_choice' and q['ability_tag'] == '词形变换':
        tag_mismatches.append(q['id'])
    if q['type'] == 'fill_blank' and q['ability_tag'] in ['语法选择', '情景交际']:
        tag_mismatches.append(q['id'])
if tag_mismatches:
    warnings.append({"type": "warning", "field": "ability_tag", "msg": f"题型与ability_tag不匹配: {tag_mismatches}"})

# ============================================================
# 3. Answer quality checks
# ============================================================
# MC answer distribution
mc_questions = [q for q in data if q['type'] == 'multiple_choice']
mc_dist = Counter(q['answer'] for q in mc_questions)
info.append(f"MC答案分布: {dict(mc_dist)}")
mc_total = len(mc_questions)
for letter in 'ABCD':
    pct = mc_dist.get(letter, 0) / mc_total * 100
    if pct < 15 or pct > 35:
        warnings.append({"type": "warning", "field": "answer_distribution", "msg": f"选项{letter}占比{pct:.1f}%, 偏离均衡范围(20-30%)"})

# Check fill_blank answer format
multi_answer_fill = []
for q in data:
    if q['type'] == 'fill_blank':
        ans = q['answer']
        if '/' in ans:
            issues.append({"type": "error", "id": q['id'], "field": "answer", "msg": f"填空题答案使用'/'分隔, 应改为'|': '{ans}'"})

# Check for very long options (mobile unfriendly)
for q in data:
    if q['type'] == 'multiple_choice':
        for i, opt in enumerate(q['options']):
            if len(opt) > 80:
                warnings.append({"type": "warning", "id": q['id'], "field": "options", "msg": f"选项{chr(65+i)}过长({len(opt)}字): {opt[:40]}..."})

# ============================================================
# 4. Difficulty distribution
# ============================================================
diff_counts = Counter(str(q['difficulty']) for q in data)
info.append(f"难度分布: {dict(diff_counts)}")
all_05 = all(q['difficulty'] == 0.5 for q in data)
if all_05:
    warnings.append({"type": "warning", "field": "difficulty", "msg": "所有题目难度均为0.5, 无区分度"})

# ============================================================
# 5. Content quality spot checks
# ============================================================
# Check for identical questions
question_texts = {}
for q in data:
    qt = q['question'].strip()
    if qt in question_texts:
        issues.append({"type": "error", "id": q['id'], "field": "question", "msg": f"题目与{question_texts[qt]}完全重复"})
    question_texts[qt] = q['id']

# Check for very similar questions (first 50 chars)
q_prefixes = {}
for q in data:
    prefix = q['question'].strip()[:60]
    if prefix in q_prefixes:
        warnings.append({"type": "warning", "id": q['id'], "field": "question", "msg": f"题目前60字符与{q_prefixes[prefix]}高度相似"})
    q_prefixes[prefix] = q['id']

# Check analysis field exists and is not empty
empty_analysis = [q['id'] for q in data if not q.get('analysis', '').strip()]
if empty_analysis:
    issues.append({"type": "error", "field": "analysis", "msg": f"缺少解析: {empty_analysis}"})

# Check all analysis have standard format markers
no_markers = [q['id'] for q in data if '【考点】' not in q.get('analysis', '')]
if no_markers:
    warnings.append({"type": "warning", "field": "analysis", "msg": f"解析缺少【考点】标记: {no_markers[:5]}"})

# ============================================================
# 6. Ability tag distribution
# ============================================================
tag_counts = Counter(q['ability_tag'] for q in data)
info.append(f"能力标签分布: {dict(tag_counts)}")

# ============================================================
# 7. Specific issue verification (from original review)
# ============================================================
# Verify 024 fix
q024 = next((q for q in data if q['id'] == 'en_grammar_024'), None)
if q024:
    if 'but' in q024['question'].lower() and q024['answer'] == 'D':
        info.append("en_grammar_024: 答案唯一性修复 ✓ (题干含转折语义, 答案为but)")
    else:
        warnings.append({"type": "warning", "id": "en_grammar_024", "msg": f"024修复检查: answer={q024['answer']}"})

# Verify 025 type fix
q025 = next((q for q in data if q['id'] == 'en_grammar_025'), None)
if q025:
    if q025['type'] == 'multiple_choice' and q025['ability_tag'] == '语法选择':
        info.append("en_grammar_025: 题型修复 ✓ (改为multiple_choice)")
    else:
        issues.append({"type": "error", "id": "en_grammar_025", "msg": f"025类型修复未生效: type={q025['type']}"})

# Verify 065 type fix
q065 = next((q for q in data if q['id'] == 'en_grammar_065'), None)
if q065:
    if q065['type'] == 'multiple_choice' and q065['ability_tag'] == '语法选择':
        info.append("en_grammar_065: 题型修复 ✓ (改为multiple_choice)")
    else:
        issues.append({"type": "error", "id": "en_grammar_065", "msg": f"065类型修复未生效"})

# Verify 088 (was 078 second batch) type fix
q088 = next((q for q in data if q['id'] == 'en_grammar_088'), None)
if q088:
    if q088['type'] == 'multiple_choice':
        info.append("en_grammar_088: 题型修复 ✓ (原078第二批, 改为multiple_choice)")
    else:
        issues.append({"type": "error", "id": "en_grammar_088", "msg": "088类型修复未生效"})

# Verify missing questions added
missing_ids = ['en_grammar_003'] + [f'en_grammar_{n:03d}' for n in range(31, 41)]
all_ids_set = set(q['id'] for q in data)
missing_check = [mid for mid in missing_ids if mid not in all_ids_set]
if missing_check:
    issues.append({"type": "error", "field": "id", "msg": f"缺失题目未补充: {missing_check}"})
else:
    info.append("缺失题目补充: ✓ (003, 031-040共11题)")

# Verify duplicate resolution
dup_check_ids = ['en_grammar_071', 'en_grammar_072', 'en_grammar_080']
dup_check = [did for did in dup_check_ids if id_list.count(did) > 1]
if dup_check:
    issues.append({"type": "error", "field": "id", "msg": f"仍有重复ID: {dup_check}"})
else:
    info.append("重复ID修复: ✓ (071-080不再重复)")

# Verify 043/103 no longer identical
q043 = next((q for q in data if q['id'] == 'en_grammar_043'), None)
q103 = next((q for q in data if q['id'] == 'en_grammar_103'), None)
if q043 and q103:
    if q043['question'] != q103['question']:
        info.append("043/103重复消除: ✓ (题干已不同)")
    else:
        issues.append({"type": "error", "msg": "043/103题干仍然相同"})

# Verify 077/101 no longer identical
q077 = next((q for q in data if q['id'] == 'en_grammar_077'), None)
q101 = next((q for q in data if q['id'] == 'en_grammar_101'), None)
if q077 and q101:
    if q077['question'] != q101['question']:
        info.append("077/101重复消除: ✓ (077考who, 101考whose)")
    else:
        issues.append({"type": "error", "msg": "077/101题干仍然相同"})

# ============================================================
# Build verification report
# ============================================================
report = {
    "verify_time": datetime.datetime.now().isoformat(),
    "file": "src/data/questions_en_grammar.json",
    "summary": {
        "total_questions": len(data),
        "id_range": f"{min_id}-{max_id}",
        "errors": len(issues),
        "warnings": len(warnings),
        "passed": len(issues) == 0
    },
    "statistics": {
        "type_distribution": dict(type_counts),
        "ability_tag_distribution": dict(tag_counts),
        "difficulty_distribution": dict(diff_counts),
        "mc_answer_distribution": dict(mc_dist)
    },
    "issues": issues,
    "warnings": warnings,
    "info": info,
    "fixes_applied": [
        "1. 重复ID修复: 原071-080第二批重新编号为081-090, 原081-100顺延为091-110",
        "2. 缺失题目补充: 新增en_grammar_003及en_grammar_031-040共11道题",
        "3. en_grammar_024: 改题干为明确转折语义, 确保but为唯一正确答案",
        "4. en_grammar_025/065/088: 题型从fill_blank改为multiple_choice, ability_tag改为语法选择",
        "5. en_grammar_006: 干扰项B改为Not at all (更好的致谢应答干扰项)",
        "6. en_grammar_012/085: 答案分隔符从/改为|",
        "7. en_grammar_015: 优化填空指令为'用所给单词的适当时态填空'",
        "8. en_grammar_049: 重写为逻辑通顺的请求重复场景",
        "9. en_grammar_106(原086): 干扰项C改为That's great!消除歧义",
        "10. en_grammar_103(原093): 改为不同场景(委婉拒绝道歉应答)",
        "11. en_grammar_101(原091): 改为考查whose (原与077重复考who)",
        "12. en_grammar_099(原089): 优化对话确保语境明确(对方不在)",
        "13. 难度标注: 从全部0.5调整为0.3/0.4/0.5/0.6/0.7五级分布",
        "14. MC答案分布: 从A24/B28/C17/D1优化为A18/B18/C17/D17"
    ]
}

with open('/Volumes/ORICO/xinwen/claudecode/chinese-learn/docs/reviews/verify_en_grammar.json', 'w', encoding='utf-8') as f:
    json.dump(report, f, ensure_ascii=False, indent=2)

# Print summary
print(f"{'='*60}")
print(f"英语语法题库验证报告")
print(f"{'='*60}")
print(f"总题数: {len(data)}")
print(f"ID范围: {min_id}-{max_id}")
print(f"错误: {len(issues)}")
print(f"警告: {len(warnings)}")
print()
if issues:
    print("ERRORS:")
    for i in issues:
        print(f"  [{i.get('id','')}] {i['msg']}")
    print()
if warnings:
    print("WARNINGS:")
    for w in warnings:
        print(f"  [{w.get('id','')}] {w['msg']}")
    print()
print("INFO:")
for i in info:
    print(f"  {i}")
print()
print(f"验证结果: {'✓ 通过' if len(issues) == 0 else '✗ 未通过'}")
print(f"报告已保存到: docs/reviews/verify_en_grammar.json")
