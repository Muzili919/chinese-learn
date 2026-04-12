#!/usr/bin/env python3
"""
第二轮答案分散优化 - 强力版
直接用字符串替换交换选项，处理跨行和同行的情况
"""

import json, re

FILE = 'src/data/questions_en_j2_reading.json'

with open(FILE, 'r', encoding='utf-8') as f:
    data = json.load(f)

def get_ans_list(article):
    return [(int(m.group(1)), m.group(2)) for m in re.finditer(r'\(([1-5])\)\s*([A-D])', article['answer'])]

def set_ans(article, qnum, new_ans):
    article['answer'] = re.sub(rf'\({qnum}\)\s*[A-D]', f'({qnum}) {new_ans}', article['answer'])

def find_option_text(q_text, qnum, letter):
    """
    Find the text of option 'letter' for question 'qnum'.
    Returns the full option string including "X. text"
    """
    # Find the section of text for this question
    # Pattern: after (qnum) question text, find X. option_text
    # until next (qnum+1) or end
    
    q_marker = f'({qnum})'
    next_q_marker = f'({qnum + 1})' if qnum < 5 else None
    
    q_pos = q_text.find(q_marker)
    if q_pos == -1:
        return None, None
    
    # Find end of this question's section
    if next_q_marker:
        end_pos = q_text.find(next_q_marker, q_pos)
        if end_pos == -1:
            end_pos = len(q_text)
    else:
        end_pos = len(q_text)
    
    section = q_text[q_pos:end_pos]
    
    # Find option: look for "letter. " followed by text until next option or end
    # Options are: A. xxx B. yyy C. zzz D. www
    # They can be on same line or different lines
    
    # Find all option positions
    opt_pattern = re.compile(r'([A-D])\.\s*')
    
    opts_in_section = []
    for m in opt_pattern.finditer(section):
        opts_in_section.append((m.group(1), m.start(), m.end()))
    
    # Find our target option
    target_idx = None
    for i, (l, start, end) in enumerate(opts_in_section):
        if l == letter:
            target_idx = i
            break
    
    if target_idx is None:
        return None, None
    
    # Extract text from this option to the next option (or end)
    _, opt_start, text_start = opts_in_section[target_idx]
    
    if target_idx + 1 < len(opts_in_section):
        _, _, next_text_start = opts_in_section[target_idx + 1]
        # Text goes from text_start to next_text_start (with some whitespace before)
        opt_text = section[text_start:next_text_start].strip()
    else:
        opt_text = section[text_start:].strip()
    
    # Clean up the option text (remove trailing whitespace)
    opt_text = opt_text.rstrip()
    
    return f"{letter}. {opt_text}", opt_text

def do_swap(q_text, qnum, letter1, letter2):
    """Swap the text of two options. Returns modified q_text."""
    full1, _ = find_option_text(q_text, qnum, letter1)
    full2, _ = find_option_text(q_text, qnum, letter2)
    
    if full1 is None or full2 is None:
        return q_text, False
    
    # Extract just the text part
    text1 = full1[3:].strip()  # After "X. "
    text2 = full2[3:].strip()  # After "X. "
    
    # Replace: first replace letter1's text with a placeholder, then replace letter2's, then put letter1's back
    placeholder = "___PLACEHOLDER___"
    
    result = q_text.replace(f"{letter1}. {text1}", f"{letter1}. {placeholder}")
    result = result.replace(f"{letter2}. {text2}", f"{letter2}. {text1}")
    result = result.replace(f"{letter1}. {placeholder}", f"{letter1}. {text2}")
    
    return result, True

print("=== 第二轮答案分散优化（强力版）===\n")

changes = []

# Plan: for articles with only 2 answer types, swap one question
targets = [
    ('en_j2_reading_002', 2, 'B', 'A'),   # C B C B B -> C A C B B
    ('en_j2_reading_004', 3, 'B', 'A'),   # B C B C C -> B C A C C
    ('en_j2_reading_005', 1, 'B', 'A'),   # B C B C C -> A C B C C
    ('en_j2_reading_006', 5, 'B', 'D'),   # C C B B B -> C C B B D
    ('en_j2_reading_011', 1, 'B', 'A'),   # B C B C B -> A C B C B
    ('en_j2_reading_015', 1, 'B', 'D'),   # B B B C C -> D B B C C
    ('en_j2_reading_020', 1, 'B', 'D'),   # B C B B C -> D C B B C
    ('en_j2_reading_021', 2, 'C', 'A'),   # B C B C B -> B A B C B
    ('en_j2_reading_022', 5, 'B', 'D'),   # B C B B B -> B C B B D
    ('en_j2_reading_024', 2, 'C', 'A'),   # C C B C C -> C A B C C
    ('en_j2_reading_026', 2, 'C', 'A'),   # B C C C B -> B A C C B
]

for item in data:
    if item['type'] != 'multiple_choice':
        continue
    item_id = item['id']
    
    for target_id, qnum, current_correct, swap_with in targets:
        if item_id != target_id:
            continue
        
        answers = get_ans_list(item)
        current_map = dict(answers)
        
        if current_map.get(qnum) != current_correct:
            continue
        
        # Test: can we find both options?
        full1, text1 = find_option_text(item['question'], qnum, current_correct)
        full2, text2 = find_option_text(item['question'], qnum, swap_with)
        
        if full1 is None or full2 is None:
            print(f"  ⚠️ {item_id} Q{qnum}: 找不到选项 {current_correct}={full1} 或 {swap_with}={full2}")
            continue
        
        # Do the swap
        new_q, success = do_swap(item['question'], qnum, current_correct, swap_with)
        
        if success:
            item['question'] = new_q
            set_ans(item, qnum, swap_with)
            
            # Update analysis
            old_a = f"({qnum}) {current_correct}【"
            new_a = f"({qnum}) {swap_with}【"
            item['analysis'] = item['analysis'].replace(old_a, new_a)
            
            new_ans_list = [a[1] for a in get_ans_list(item)]
            changes.append(f"  ✅ {item_id} Q{qnum}: {current_correct}<->{swap_with} | {new_ans_list}")
        else:
            print(f"  ⚠️ {item_id} Q{qnum}: 替换失败")
        
        break

# SAVE
with open(FILE, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"\n✅ 第二轮修复完成！共 {len(changes)} 项修改：")
for c in changes:
    print(c)

# VERIFY
print("\n=== 最终验证 ===\n")
problem_count = 0
for item in data:
    if item['type'] != 'multiple_choice':
        continue
    answers = get_ans_list(item)
    ans_letters = [a[1] for a in answers]
    unique = len(set(ans_letters))
    if unique <= 2:
        problem_count += 1
        print(f"  ⚠️ {item['id']}: {ans_letters} ({unique}种)")

if problem_count == 0:
    print("  ✅ 所有28篇阅读理解答案分布良好")

all_answers = []
for item in data:
    if item['type'] == 'multiple_choice':
        for _, a in get_ans_list(item):
            all_answers.append(a)

from collections import Counter
counts = Counter(all_answers)
total = len(all_answers)
print(f"\n📊 全局选项分布（{total}题）：")
for letter in ['A', 'B', 'C', 'D']:
    cnt = counts.get(letter, 0)
    pct = cnt / total * 100
    bar = '█' * int(pct / 2)
    print(f"  {letter}: {cnt:3d} ({pct:.0f}%) {bar}")

print("\n🎉 完成！")
