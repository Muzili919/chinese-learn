#!/usr/bin/env python3
"""修复八年级阅读理解的全局优化问题：
1. 调整难度梯度（增加较难题目）
2. 确保每篇文章的答案分布合理（不超3题同选一选项）
3. 丰富analysis字段
"""

import json

with open('src/data/questions_en_j2_reading.json', 'r') as f:
    data = json.load(f)

# =============================================
# 1. 调整难度梯度
# =============================================
# 当前: 简单(<0.4)=8, 中等(0.4-0.55)=31, 较难(≥0.55)=1
# 目标: 简单(0.25-0.35)≈12, 中等(0.4-0.5)≈20, 较难(0.55-0.7)≈8

# 为需要提高难度的题目设置新值
# 策略：推断题、主旨题、推理判断题 → 较难
#        细节题、数字题 → 简单或中等
#        理解题、词义题 → 中等

difficulty_map = {
    # 推断题/推理题 → 较难
    'en_j2_reading_003': 0.55,  # 主旨+推断
    'en_j2_reading_006': 0.6,   # 涉及习语理解
    'en_j2_reading_013': 0.55,  # 习语理解+推断
    'en_j2_reading_017': 0.58,  # 推断题较多
    'en_j2_reading_019': 0.6,   # 习语+推断
    'en_j2_reading_021': 0.55,  # 主旨+判断
    'en_j2_reading_023': 0.6,   # 推理+判断
    'en_j2_reading_025': 0.58,  # 推断+比较
    'en_j2_reading_027': 0.55,  # 习语理解
    'en_j2_reading_028': 0.6,   # 综合推断
    
    # 完形填空中较难的
    'en_j2_cloze_002': 0.55,  # 情感推断
    'en_j2_cloze_004': 0.6,   # 逻辑衔接
    'en_j2_cloze_006': 0.55,  # 语境推断
    'en_j2_cloze_008': 0.58,  # 语篇理解
    'en_j2_cloze_010': 0.55,  # 情感推断
    'en_j2_cloze_012': 0.6,   # 综合理解
    
    # 部分从0.4提到0.45-0.5，增加区分度
    'en_j2_reading_008': 0.45,
    'en_j2_reading_011': 0.45,
    'en_j2_reading_014': 0.5,
    'en_j2_reading_016': 0.5,
    'en_j2_reading_018': 0.5,
    'en_j2_reading_020': 0.45,
    'en_j2_reading_022': 0.5,
    'en_j2_reading_024': 0.5,
    'en_j2_reading_026': 0.45,
    
    'en_j2_cloze_001': 0.45,
    'en_j2_cloze_003': 0.45,
    'en_j2_cloze_005': 0.5,
    'en_j2_cloze_007': 0.45,
    'en_j2_cloze_009': 0.5,
    'en_j2_cloze_011': 0.5,
}

for item in data:
    if item['id'] in difficulty_map:
        old_diff = item['difficulty']
        new_diff = difficulty_map[item['id']]
        if old_diff != new_diff:
            item['difficulty'] = new_diff
            print(f"  难度调整: {item['id']}: {old_diff} → {new_diff}")

# =============================================
# 2. 检查并修复每篇文章答案分布
# =============================================
from collections import Counter

# Group reading questions by article
articles = {}
for q in data:
    if q['id'].startswith('en_j2_reading_'):
        art_id = '_'.join(q['id'].split('_')[:-1])
        articles.setdefault(art_id, []).append(q)

# For cloze, each article has multiple blanks
cloze_articles = {}
for q in data:
    if q['id'].startswith('en_j2_cloze_'):
        art_id = '_'.join(q['id'].split('_')[:-1])
        cloze_articles.setdefault(art_id, []).append(q)

print("\n=== 阅读文章答案分布 ===")
issues_found = False
for aid, qs in sorted(articles.items()):
    answers = [q['answer'] for q in qs]
    c = Counter(answers)
    if max(c.values()) >= 4:
        most = c.most_common(1)[0]
        print(f"  ⚠️ {aid}: {most[0]}出现{most[1]}次/共{len(qs)}题")
        issues_found = True

if not issues_found:
    print("  ✅ 所有文章答案分布合理")

# =============================================
# 3. 丰富过于简短的analysis
# =============================================
analysis_upgrades = {
    'en_j2_reading_001': '细节理解题。文章第一段明确提到Tom给了一个蓝色封面的小笔记本，这不是昂贵的手表或漂亮的玩具，所以B正确。',
    'en_j2_reading_002': '细节理解题。文章第二段提到Li Ming注意到很多孩子每天要走一个多小时危险的山路去上学，所以B正确。',
}

improved_count = 0
for item in data:
    if item['id'] in analysis_upgrades:
        if len(item['analysis']) < 20:
            item['analysis'] = analysis_upgrades[item['id']]
            improved_count += 1

if improved_count:
    print(f"\n  丰富了 {improved_count} 个过于简短的analysis字段")
else:
    print(f"\n  ✅ analysis字段均足够详细")

# =============================================
# 保存
# =============================================
with open('src/data/questions_en_j2_reading.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

# =============================================
# 验证
# =============================================
print("\n=== 验证结果 ===")
diffs = [q['difficulty'] for q in data]
easy = sum(1 for d in diffs if d < 0.4)
mid = sum(1 for d in diffs if 0.4 <= d < 0.55)
hard = sum(1 for d in diffs if d >= 0.55)
print(f"简单(<0.4): {easy} (目标≈12)")
print(f"中等(0.4-0.55): {mid} (目标≈20)")
print(f"较难(≥0.55): {hard} (目标≈8)")
print(f"\n难度值分布: {sorted(diffs)}")

# Check JSON valid
import json
try:
    with open('src/data/questions_en_j2_reading.json', 'r') as f:
        json.load(f)
    print("\n✅ JSON格式验证通过")
except Exception as e:
    print(f"\n❌ JSON格式错误: {e}")
