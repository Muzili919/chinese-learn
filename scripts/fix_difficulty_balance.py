#!/usr/bin/env python3
"""重新调整难度分布到合理范围"""

import json

with open('src/data/questions_en_j2_reading.json', 'r') as f:
    data = json.load(f)

# 目标: 简单(0.25-0.38)≈12, 中等(0.4-0.52)≈18, 较难(0.55-0.68)≈10
# 当前: 简单1, 中等23, 较难16
# 需要把一些较难降到中等，一些中等降到简单

difficulty_map = {
    # 将部分较难(0.55-0.6)降回中等
    'en_j2_cloze_002': 0.5,   # 0.55 → 0.5
    'en_j2_cloze_006': 0.5,   # 0.55 → 0.5
    'en_j2_cloze_010': 0.5,   # 0.55 → 0.5
    'en_j2_reading_021': 0.5,  # 0.55 → 0.5
    'en_j2_reading_027': 0.5,  # 保持中等（习语但不算太难）
    'en_j2_cloze_008': 0.5,   # 0.58 → 0.5
    
    # 将部分中等(0.4-0.45)降到简单
    'en_j2_reading_011': 0.35, # 0.45 → 0.35
    'en_j2_reading_012': 0.35, # 0.4 → 0.35
    'en_j2_reading_015': 0.35, # 0.4 → 0.35
    'en_j2_reading_018': 0.38, # 0.5 → 0.38
    'en_j2_reading_026': 0.35, # 0.45 → 0.35
    'en_j2_cloze_003': 0.35,  # 0.45 → 0.35
    'en_j2_cloze_005': 0.38,  # 0.5 → 0.38
    'en_j2_cloze_007': 0.35,  # 0.45 → 0.35
    'en_j2_cloze_009': 0.38,  # 0.5 → 0.38
    'en_j2_cloze_011': 0.38,  # 0.5 → 0.38
    'en_j2_cloze_001': 0.35,  # 0.45 → 0.35
    
    # 微调部分保持较难但稍微降低
    'en_j2_cloze_012': 0.58,  # 0.6 → 0.58
    'en_j2_reading_028': 0.58, # 0.6 → 0.58
    'en_j2_reading_023': 0.58, # 0.6 → 0.58
    'en_j2_reading_025': 0.55, # 0.58 → 0.55
    'en_j2_reading_017': 0.55, # 0.58 → 0.55
    
    # 确保几个简单的保持简单
    'en_j2_reading_009': 0.3,  # 细节题
    'en_j2_reading_010': 0.3,  # 细节题
}

for item in data:
    if item['id'] in difficulty_map:
        old_diff = item['difficulty']
        new_diff = difficulty_map[item['id']]
        if old_diff != new_diff:
            item['difficulty'] = new_diff
            print(f"  {item['id']}: {old_diff} → {new_diff}")

with open('src/data/questions_en_j2_reading.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

# 验证
diffs = [q['difficulty'] for q in data]
easy = sum(1 for d in diffs if d < 0.4)
mid = sum(1 for d in diffs if 0.4 <= d < 0.55)
hard = sum(1 for d in diffs if d >= 0.55)
print(f"\n简单(<0.4): {easy} (目标≈12)")
print(f"中等(0.4-0.55): {mid} (目标≈18)")
print(f"较难(≥0.55): {hard} (目标≈10)")
print(f"总计: {easy+mid+hard}")
print(f"\n难度值: {sorted(diffs)}")
