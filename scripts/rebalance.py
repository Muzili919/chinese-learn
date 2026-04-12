#!/usr/bin/env python3
"""正确方式平衡答案分布：交换选项文字内容而非位置"""
import json
from collections import Counter

with open('src/data/questions_en_j2_grammar.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 统计当前分布
answers = Counter()
for q in data:
    if q['type'] == 'multiple_choice':
        answers[q['answer']] += 1
total_mc = sum(answers.values())

print("修复前分布:")
for k in ['A', 'B', 'C', 'D']:
    v = answers.get(k, 0)
    print(f"  {k}: {v} ({v/total_mc*100:.1f}%)")

# 目标: 各约25%
# B太多(40), 需要将一些B答案题改为D答案题
# D太少(6), 需要增加
# A(22)和C(27)基本OK

# 策略：对于B答案的题，将B选项(正确答案)的文字与D选项(错误答案)的文字交换
# 这样正确答案就变成了D

def swap_option_content(q, letter1, letter2):
    """交换两个选项的文字内容，但保持前缀字母不变"""
    new_opts = []
    for opt in q['options']:
        if not opt:
            new_opts.append(opt)
            continue
        prefix = opt[0]
        text = opt[2:].strip()
        
        if prefix == letter1:
            # 找到letter2的文本
            for other_opt in q['options']:
                if other_opt and other_opt[0] == letter2:
                    other_text = other_opt[2:].strip()
                    new_opts.append(f"{prefix}. {other_text}")
                    break
            else:
                new_opts.append(opt)
        elif prefix == letter2:
            # 找到letter1的文本
            for other_opt in q['options']:
                if other_opt and other_opt[0] == letter1:
                    other_text = other_opt[2:].strip()
                    new_opts.append(f"{prefix}. {other_text}")
                    break
            else:
                new_opts.append(opt)
        else:
            new_opts.append(opt)
    
    q['options'] = new_opts
    # 同时交换答案字母
    if q['answer'] == letter1:
        q['answer'] = letter2
    elif q['answer'] == letter2:
        q['answer'] = letter1

# 找出B答案的题，将其中一些改为D答案
b_answer_qs = []
for q in data:
    if q['type'] == 'multiple_choice' and q['answer'] == 'B':
        b_answer_qs.append(q['id'])

print(f"\nB答案题目: {len(b_answer_qs)}道")
print(f"需要将约{40 - 24}道B改为D")

# 将14道B答案题改为D答案题（B→D交换内容）
to_change = b_answer_qs[:14]
for qid in to_change:
    q = next(q for q in data if q['id'] == qid)
    swap_option_content(q, 'B', 'D')
    print(f"  {qid}: B→D")

# 再找一些B答案改为A答案（如果B仍然偏多）
# 先检查
answers2 = Counter()
for q in data:
    if q['type'] == 'multiple_choice':
        answers2[q['answer']] += 1
print(f"\n第一轮后分布:")
for k in ['A', 'B', 'C', 'D']:
    v = answers2.get(k, 0)
    print(f"  {k}: {v} ({v/total_mc*100:.1f}%)")

# 如果B仍然>30，再从B改到A
remaining_b = [q['id'] for q in data if q['type'] == 'multiple_choice' and q['answer'] == 'B']
b_to_a_count = max(0, len(remaining_b) - 28)  # 目标B不超过28
print(f"还需要将{b_to_a_count}道B改为A")

for qid in remaining_b[:b_to_a_count]:
    q = next(q for q in data if q['id'] == qid)
    swap_option_content(q, 'B', 'A')
    print(f"  {qid}: B→A")

# 最终统计
answers3 = Counter()
for q in data:
    if q['type'] == 'multiple_choice':
        answers3[q['answer']] += 1

print(f"\n最终分布:")
for k in ['A', 'B', 'C', 'D']:
    v = answers3.get(k, 0)
    pct = v / total_mc * 100
    status = "✅" if 20 <= pct <= 30 else "⚠️"
    print(f"  {k}: {v} ({pct:.1f}%) {status}")

# 保存
with open('src/data/questions_en_j2_grammar.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("\n已保存")
