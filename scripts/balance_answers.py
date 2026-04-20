#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
后处理脚本：平衡答案分布 + 验证所有题目
"""

import json
import random
random.seed(2024)

with open("/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/questions_math_junior_equation.json", 'r', encoding='utf-8') as f:
    questions = json.load(f)

print(f"原始: {len(questions)} 题")

# 统计初始状态
from collections import Counter
initial_ans = Counter(q["answer"][0] for q in questions)
print(f"初始答案分布: {dict(initial_ans)}")

# 目标：A≈16, B≈16, C≈17, D≈16 (总计65)
target = {'A': 16, 'B': 17, 'C': 16, 'D': 16}  # 总和65

# 计算需要调整的量
current = dict(initial_ans)
adjust = {}
for letter in "ABCD":
    adjust[letter] = target[letter] - current.get(letter, 0)

print(f"目标分布: {target}")
print(f"调整量: {adjust}")

# 需要减少A（当前太多），增加BCD
# 策略：对选中的A类题目，将正确答案交换到目标位置

def rebalance_one(q, target_letter):
    """将一道题的正确答案从当前位置移到target_letter位置"""
    opts = list(q["options"])
    old_letter = q["answer"][0]
    
    if old_letter == target_letter:
        return False  # 已经是目标
    
    old_idx = ord(old_letter) - ord('A')
    target_idx = ord(target_letter) - ord('A')
    
    # 交换选项
    correct_text = opts[old_idx]
    target_text = opts[target_idx]
    opts[old_idx] = target_text
    opts[target_idx] = correct_text
    
    q["options"] = opts
    old_full_answer = q["answer"]
    # 保留正确答案文本，只改变字母前缀
    q["answer"] = f"{target_letter}. {correct_text}"
    return True

# 按需调整
changes = 0
# 遍历需要减少的选项
to_decrease = [l for l in "ABCD" if adjust[l] < 0]
to_increase = [l for l in "ABCD" if adjust[l] > 0]

# 建立待处理队列：按需减少的来源
source_pool = []
for l in to_decrease:
    for _ in range(-adjust[l]):
        source_pool.append(l)

target_pool = []
for l in to_increase:
    for _ in range(adjust[l]):
        target_pool.append(l)

random.shuffle(source_pool)
random.shuffle(target_pool)

# 对每个来源找一道对应题目并改为目标
used_indices = set()
for i, (src_letter, tgt_letter) in enumerate(zip(source_pool, target_pool)):
    found = False
    for j, q in enumerate(questions):
        if j in used_indices:
            continue
        if q["answer"][0] == src_letter:
            if rebalance_one(q, tgt_letter):
                used_indices.add(j)
                changes += 1
                found = True
                break
    if not found:
        print(f"⚠️ 无法找到 {src_letter}→{tgt_letter} 的可调题目")

print(f"\n调整了 {changes} 道题")

# 最终统计
final_ans = Counter(q["answer"][0] for q in questions)
final_diff = Counter(q["difficulty"] for q in questions)
final_tag = Counter(q["knowledge_tag"] for q in questions)

print(f"\n{'='*50}")
print(f"最终答案分布:")
for l in "ABCD":
    c = final_ans.get(l, 0)
    bar = "█"*c
    print(f"  {l}: {c:2d} {bar}")

print(f"\n最终难度分布:")
for d in sorted(final_diff.keys()):
    print(f"  难度{d}: {final_diff[d]}")

print(f"\n知识点分布:")
for t in sorted(final_tag.keys()):
    print(f"  {t}: {final_tag[t]}")

# 验证ID连续性
ids = [q["id"] for q in questions]
expected = [f"math_je{i:03d}" for i in range(1, len(questions)+1)]
if ids == expected:
    print(f"\n✅ ID完整: math_je001 ~ math_je{len(questions):03d}")

# 抽样验证几道题
print("\n🔍 抽样验证:")
sample_ids = ["math_je001", "math_je020", "math_je040", "math_je065"]
for sid in sample_ids:
    for q in questions:
        if q["id"] == sid:
            ans_letter = q["answer"][0]
            ans_idx = ord(ans_letter) - ord('A')
            ans_opt = q["options"][ans_idx][3:]  # 去掉"A. "前缀
            print(f"  {q['id']}: 答案={ans_letter}, 选项内容=\"{ans_opt[:30]}...\"")
            break

# 写回
out = "/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/questions_math_junior_equation.json"
with open(out, 'w', encoding='utf-8') as f:
    json.dump(questions, f, ensure_ascii=False, indent=2)
print(f"\n✅ 已保存: {out}")
