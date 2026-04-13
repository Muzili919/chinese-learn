#!/usr/bin/env python3
"""修复 words_network_j2.json 数据质量问题"""

import json

J2_PATH = '/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/words_network_j2.json'
PRIMARY_PATH = '/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/words_network.json'

# 1. 读取文件
print("=" * 60)
print("步骤1: 读取词库文件")
print("=" * 60)

with open(J2_PATH, 'r', encoding='utf-8') as f:
    j2_data = json.load(f)

with open(PRIMARY_PATH, 'r', encoding='utf-8') as f:
    primary_data = json.load(f)

j2_words = j2_data['words']
primary_words = primary_data['words']

print(f"初二词库词条数: {len(j2_words)}")
print(f"小学词库词条数: {len(primary_words)}")

# 2. 清理自引用
# 以下20个词条的 associations 或 confusables 包含了自身，必须移除
SELF_REF_WORDS = [
    "actually", "among", "anyway", "bag", "between", "cruel",
    "delicious", "finally", "late", "mainly", "nearly", "normally",
    "possibly", "really", "so", "truly", "valuable", "whether",
    "while", "wide"
]

print("\n" + "=" * 60)
print("步骤2: 清理自引用（20个词条）")
print("=" * 60)

self_ref_fixed = 0
self_ref_details = []

for word in SELF_REF_WORDS:
    if word not in j2_words:
        print(f"  ⚠️  词条 '{word}' 不在词库中")
        continue
    
    entry = j2_words[word]
    fixed_in_assoc = False
    fixed_in_conf = False
    
    # 检查并清理 associations
    if 'associations' in entry and word in entry['associations']:
        entry['associations'] = [w for w in entry['associations'] if w != word]
        fixed_in_assoc = True
    
    # 检查并清理 confusables  
    if 'confusables' in entry and word in entry['confusables']:
        entry['confusables'] = [w for w in entry['confusables'] if w != word]
        fixed_in_conf = True
    
    if fixed_in_assoc or fixed_in_conf:
        self_ref_fixed += 1
        detail = f"  ✅ '{word}':"
        if fixed_in_assoc:
            detail += f" associations已清理"
        if fixed_in_conf:
            detail += f" confusables已清理"
        self_ref_details.append(detail)
        print(detail)
    else:
        print(f"  ℹ️  '{word}': 未发现自引用")

print(f"\n自引用修复总数: {self_ref_fixed}")

# 3. 处理与小学词库重叠的词
print("\n" + "=" * 60)
print("步骤3: 处理与小学词库重叠的词")
print("=" * 60)

overlap_count = 0
tier_changed_by_overlap = 0

for word in j2_words:
    if word in primary_words:
        overlap_count += 1
        entry = j2_words[word]
        
        # 添加 overlap 标记
        entry['overlap'] = 'primary'
        
        # tier 修正逻辑
        old_tier = entry.get('tier', None)
        if old_tier == 1:
            entry['tier'] = 2
            tier_changed_by_overlap += 1
        elif old_tier == 2:
            # tier=2 保持不变（因为tier只允许1和2）
            pass
        elif old_tier == 3:
            # tier=3 改为 2（这步会在第4步统一处理，这里也处理一下）
            entry['tier'] = 2
            tier_changed_by_overlap += 1

print(f"重叠词总数: {overlap_count}")
print(f"因重叠导致tier变更数: {tier_changed_by_overlap}")

# 4. 处理非法tier值 (tier=3 → tier=2)
print("\n" + "=" * 60)
print("步骤4: 处理非法tier值（tier=3 → tier=2）")
print("=" * 60)

tier3_fixed = 0
for word, entry in j2_words.items():
    if entry.get('tier') == 3:
        entry['tier'] = 2
        tier3_fixed += 1

print(f"tier=3 修正为 tier=2 的数量: {tier3_fixed}")

# 5. 验证输出
print("\n" + "=" * 60)
print("步骤5: 验证输出")
print("=" * 60)

# 5.1 自引用检查
self_ref_remaining = 0
for word, entry in j2_words.items():
    assoc = entry.get('associations', [])
    conf = entry.get('confusables', [])
    if word in assoc or word in conf:
        self_ref_remaining += 1
        print(f"  ❌ 仍有自引用: '{word}'")

if self_ref_remaining == 0:
    print(f"  ✅ 自引用检查通过: 0个词条包含自身")
else:
    print(f"  ❌ 自引用检查失败: {self_ref_remaining}个词条仍有自引用")

# 5.2 重叠检查
overlap_marked = sum(1 for w, e in j2_words.items() if e.get('overlap') == 'primary')
print(f"  ✅ overlap标记已添加: {overlap_marked}个词条")

# 5.3 tier检查
invalid_tiers = []
for word, entry in j2_words.items():
    t = entry.get('tier')
    if t not in [1, 2]:
        invalid_tiers.append((word, t))

if len(invalid_tiers) == 0:
    print(f"  ✅ tier值检查通过: 所有词条tier为1或2")
else:
    print(f"  ❌ tier值异常:")
    for w, t in invalid_tiers:
        print(f"      '{word}': tier={t}")

# 5.4 统计最终数据
final_word_count = len(j2_words)
tier1_count = sum(1 for e in j2_words.values() if e.get('tier') == 1)
tier2_count = sum(1 for e in j2_words.values() if e.get('tier') == 2)

print(f"\n{'=' * 60}")
print("修复统计汇总")
print(f"{'=' * 60}")
print(f"  最终词数: {final_word_count}")
print(f"  tier=1 词数: {tier1_count}")
print(f"  tier=2 词数: {tier2_count}")
print(f"  自引用修复: {self_ref_fixed}")
print(f"  重叠标记添加: {overlap_count}")
print(f"  tier=3→2 修正: {tier3_fixed}")

# 6. 写回文件
print(f"\n正在写回文件...")
with open(J2_PATH, 'w', encoding='utf-8') as f:
    json.dump(j2_data, f, ensure_ascii=False, indent=2)

print(f"✅ 文件已保存: {J2_PATH}")

# JSON合法性验证
print(f"\n验证JSON合法性...")
with open(J2_PATH, 'r', encoding='utf-8') as f:
    verify_data = json.load(f)
print(f"✅ JSON格式验证通过，词条数: {len(verify_data['words'])}")

print(f"\n🎉 所有修复任务完成！")
