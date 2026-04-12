#!/usr/bin/env python3
"""
全局优化修复脚本 - 处理以下问题：
1. 答案选项过于集中（同一文章5题全选B或高度偏向B）
2. 难度梯度不合理（较难题过少）
3. 提问句式重复（大量"What can we learn from"）
"""

import json

FILE = 'src/data/questions_en_j2_reading.json'

with open(FILE, 'r', encoding='utf-8') as f:
    data = json.load(f)

def get_answers(article):
    """解析答案字符串，返回答案列表"""
    ans_str = article['answer']
    answers = []
    import re
    for m in re.finditer(r'\(([1-5])\)\s*([A-D])', ans_str):
        answers.append((int(m.group(1)), m.group(2)))
    return answers

def set_answer(article, qnum, new_ans):
    """修改某一题的答案"""
    import re
    old_pattern = rf'\({qnum}\)\s*[A-D]'
    article['answer'] = re.sub(old_pattern, f'({qnum}) {new_ans}', article['answer'])

def swap_options_in_question(question_text, qnum, old_ans, new_ans):
    """在问题文本中交换选项，使new_ans位置的选项变成正确答案
    
    策略：重新排列选项，把原来的正确选项移到新答案位置
    """
    lines = question_text.split('\n')
    q_start = None
    options = {}
    
    for i, line in enumerate(lines):
        if f'({qnum})' in line:
            q_start = i
            options[qnum] = line  # question line
    
    # Find options after question - they span multiple lines until next question or end
    if q_start is None:
        return question_text
    
    # Find the block belonging to question qnum
    # Options start after the question line and end before next question or end of passage
    option_lines = {}
    current_opt = None
    for i in range(q_start + 1, len(lines)):
        line = lines[i].strip()
        # Check if this is the start of the next question
        if f'({qnum + 1})' in line:
            break
        # Check if this is the start of a new passage (完形填空 or 阅读下面)
        if line.startswith('完形填空') or line.startswith('阅读下面'):
            break
        # Check for option pattern
        import re
        opt_match = re.match(r'^([A-D])\.\s*(.*)', line)
        if opt_match:
            current_opt = opt_match.group(1)
            option_lines[current_opt] = line
        elif current_opt and line:
            # Continuation of previous option
            option_lines[current_opt] += ' ' + line
    
    return question_text  # Return unchanged for now, we'll handle this differently

def reorder_question_options(q_text, qnum, new_answer_letter):
    """
    Reorder options for a specific question so the correct answer is at new_answer_letter position.
    Returns modified question text.
    """
    lines = q_text.split('\n')
    
    # Find the question line and option lines
    q_line_idx = None
    opt_start_idx = None
    opt_end_idx = None
    option_texts = {}
    current_opt = None
    
    for i, line in enumerate(lines):
        stripped = line.strip()
        if f'({qnum})' in stripped and not stripped.startswith('(') == False:
            if stripped.startswith(f'({qnum})'):
                q_line_idx = i
        
        if q_line_idx is not None and opt_start_idx is None and i > q_line_idx:
            import re
            m = re.match(r'^([A-D])\.\s*', stripped)
            if m:
                opt_start_idx = i
                current_opt = m.group(1)
                option_texts[current_opt] = stripped
            # Also handle the question line itself if options are inline
            # e.g., "(3) What problem...?\nA. xxx B. yyy C. zzz D. www"
        
        if opt_start_idx is not None and current_opt:
            import re
            m = re.match(r'^([A-D])\.\s*', stripped)
            if m:
                new_opt = m.group(1)
                if new_opt != current_opt:
                    current_opt = new_opt
                    option_texts[current_opt] = stripped
            elif stripped and not stripped.startswith(f'({qnum+1})') and '阅读下面' not in stripped and '完形填空' not in stripped:
                # Continuation
                if current_opt:
                    option_texts[current_opt] += ' ' + stripped
    
    return q_text  # placeholder

print("=== 全局优化修复 ===\n")

changes = []

for item in data:
    if item['type'] != 'multiple_choice':
        continue
    
    answers = get_answers(item)
    ans_letters = [a[1] for a in answers]
    ans_counts = {}
    for a in ans_letters:
        ans_counts[a] = ans_counts.get(a, 0) + 1
    
    item_id = item['id']
    
    # ============================================================
    # FIX 1: Answer concentration - articles where all/most answers are the same
    # ============================================================
    
    if len(ans_letters) == 5 and len(set(ans_letters)) <= 2:
        # Need to diversify answers
        print(f"⚠️ {item_id}: 答案过于集中 {ans_letters} -> 需要调整")
        
        if item_id == 'en_j2_reading_003' and ans_letters == ['B', 'B', 'B', 'B', 'B']:
            # 当前: B B B B B, 目标: 至少3种不同答案
            # 调整策略: 交换某些题的选项顺序
            # (3) 原答案B"The oil splashed everywhere" -> 改为A
            # 需要在question文本中找到(3)的选项，把A和B交换
            old_q3 = "(3) What problem did the writer have when cooking?\nA. He cut his finger B. The oil splashed everywhere\nC. He forgot to turn on the stove D. The eggs were broken"
            new_q3 = "(3) What problem did the writer have when cooking?\nA. The oil splashed everywhere B. He cut his finger\nC. He forgot to turn on the stove D. The eggs were broken"
            item['question'] = item['question'].replace(old_q3, new_q3)
            set_answer(item, 3, 'A')
            
            # (5) 原答案B"Cooking is harder than it looks" -> 改为C
            old_q5 = "(5) What did the writer learn from this experience?\nA. Cooking is easy B. Cooking is harder than it looks\nC. He should never cook again D. Fried rice is the easiest dish"
            new_q5 = "(5) What did the writer learn from this experience?\nA. Cooking is easy B. He should never cook again\nC. Cooking is harder than it looks D. Fried rice is the easiest dish"
            item['question'] = item['question'].replace(old_q5, new_q5)
            set_answer(item, 5, 'C')
            
            # Update analysis
            old_a3 = "(3) B【考点】"
            new_a3 = "(3) A【考点】"
            item['analysis'] = item['analysis'].replace(old_a3, new_a3)
            old_a5 = "(5) B【考点】"
            new_a5 = "(5) C【考点】"
            item['analysis'] = item['analysis'].replace(old_a5, new_a5)
            
            changes.append(f"  {item_id}: BBBBB -> BA B C (调(3)为A, (5)为C)")
        
        elif item_id == 'en_j2_reading_017' and ans_letters.count('B') >= 4:
            # 当前约 B B C B B, 目标: 分散
            # (1) 原答案B -> 改为D: 交换选项
            old_q1 = "(1) When is the library open on Saturday?\nA. 8:00 AM to 6:00 PM B. 9:00 AM to 4:00 PM\nC. 8:00 AM to 4:00 PM D. 9:00 AM to 6:00 PM"
            new_q1 = "(1) When is the library open on Saturday?\nA. 9:00 AM to 6:00 PM B. 8:00 AM to 6:00 PM\nC. 8:00 AM to 4:00 PM D. 9:00 AM to 4:00 PM"
            item['question'] = item['question'].replace(old_q1, new_q1)
            set_answer(item, 1, 'A')
            
            # (5) 原答案B -> 改为D
            old_q5 = "(5) Where is the digital reading corner?\nA. On the first floor B. On the second floor\nC. On the third floor D. On the ground floor"
            new_q5 = "(5) Where is the digital reading corner?\nA. On the first floor B. On the ground floor\nC. On the third floor D. On the second floor"
            item['question'] = item['question'].replace(old_q5, new_q5)
            set_answer(item, 5, 'D')
            
            old_a1 = "(1) B【考点】"
            new_a1 = "(1) A【考点】"
            item['analysis'] = item['analysis'].replace(old_a1, new_a1)
            old_a5 = "(5) B【考点】"
            new_a5 = "(5) D【考点】"
            item['analysis'] = item['analysis'].replace(old_a5, new_a5)
            
            changes.append(f"  {item_id}: BB C B B -> A B C B D (调(1)为A, (5)为D)")
        
        elif item_id == 'en_j2_reading_024':
            # 当前约 B B B C C
            # (1) 原答案B -> 改为C
            old_q1 = '(1) What is the theme of the speech contest?\nA. "My School Life" B. "My Dream, My Future"\nC. "My Best Friend" D. "My Favorite Book"'
            new_q1 = '(1) What is the theme of the speech contest?\nA. "My School Life" B. "My Best Friend"\nC. "My Dream, My Future" D. "My Favorite Book"'
            item['question'] = item['question'].replace(old_q1, new_q1)
            set_answer(item, 1, 'C')
            
            # (2) 原答案B -> 改为D
            old_q2 = "(2) When is the registration deadline (截止日期)?\nA. April 10 B. May 1 C. May 15 D. May 20"
            new_q2 = "(2) When is the registration deadline (截止日期)?\nA. April 10 B. May 15 C. May 1 D. May 20"
            item['question'] = item['question'].replace(old_q2, new_q2)
            set_answer(item, 2, 'C')
            
            old_a1 = "(1) B【考点】"
            new_a1 = "(1) C【考点】"
            item['analysis'] = item['analysis'].replace(old_a1, new_a1)
            old_a2 = "(2) B【考点】"
            new_a2 = "(2) C【考点】"
            item['analysis'] = item['analysis'].replace(old_a2, new_a2)
            
            changes.append(f"  {item_id}: B B B C C -> C C B C C -> 再调: C B B C C (调(1)为C, (2)改选项)")
        
        elif item_id == 'en_j2_reading_028':
            # 当前约 B B B B C
            # (1) 原答案B -> 改为A
            old_q1 = "(1) What is the main purpose of this email?\nA. To inform parents about exam results B. To invite parents to a meeting\nC. To introduce new teachers D. To announce a school holiday"
            new_q1 = "(1) What is the main purpose of this email?\nA. To invite parents to a meeting B. To inform parents about exam results\nC. To introduce new teachers D. To announce a school holiday"
            item['question'] = item['question'].replace(old_q1, new_q1)
            set_answer(item, 1, 'A')
            
            # (3) 原答案B -> 改为D
            old_q3 = "(3) What should parents do if they cannot attend?\nA. Wait for the next meeting B. Contact the class teacher\nC. Send an email to the principal D. Nothing—they don't need to"
            new_q3 = "(3) What should parents do if they cannot attend?\nA. Wait for the next meeting B. Nothing—they don't need to\nC. Send an email to the principal D. Contact the class teacher"
            item['question'] = item['question'].replace(old_q3, new_q3)
            set_answer(item, 3, 'D')
            
            old_a1 = "(1) B【考点】"
            new_a1 = "(1) A【考点】"
            item['analysis'] = item['analysis'].replace(old_a1, new_a1)
            old_a3 = "(3) B【考点】"
            new_a3 = "(3) D【考点】"
            item['analysis'] = item['analysis'].replace(old_a3, new_a3)
            
            changes.append(f"  {item_id}: B B B B C -> A B D B C (调(1)为A, (3)为D)")
    
    # ============================================================
    # FIX 2: Diversify question phrasing (reduce "What can we learn from")
    # ============================================================
    
    if item_id == 'en_j2_reading_001':
        old = "(5) What can we learn from the story?"
        new = "(5) Which of the following best describes the main idea of this story?"
        if old in item['question']:
            item['question'] = item['question'].replace(old, new)
            changes.append(f"  {item_id}: (5)提问改为'Which of the following best describes...'")
    
    elif item_id == 'en_j2_reading_002':
        old = "(5) What can we learn from Li Ming's story?"
        new = "(5) What is the author's main purpose in writing this passage?"
        if old in item['question']:
            item['question'] = item['question'].replace(old, new)
            changes.append(f"  {item_id}: (5)提问改为'What is the author's main purpose...'")
    
    elif item_id == 'en_j2_reading_021':
        old = "(5) What can we learn from the passage?"
        new = "(5) What would be the best title for this passage?"
        if old in item['question']:
            item['question'] = item['question'].replace(old, new)
            changes.append(f"  {item_id}: (5)提问改为'What would be the best title...'")
    
    # ============================================================
    # FIX 3: Adjust difficulty levels
    # ============================================================
    
    difficulty_map = {
        'en_j2_reading_009': (0.4, 0.45),   # 科技馆有词义猜测题，稍难
        'en_j2_reading_013': (0.5, 0.55),   # 议论文需要更多推理
        'en_j2_reading_016': (0.5, 0.55),   # 社交媒体话题复杂
        'en_j2_reading_019': (0.5, 0.55),   # 中医有专业词汇
        'en_j2_reading_020': (0.5, 0.55),   # 气候话题有对比概念
        'en_j2_reading_027': (0.5, 0.55),   # 造纸历史有时间线
        'en_j2_cloze_005': (0.5, 0.55),    # 学习方法类，有比喻
        'en_j2_cloze_011': (0.5, 0.55),    # 教育故事有深度
    }
    
    if item_id in difficulty_map:
        old_diff, new_diff = difficulty_map[item_id]
        if item['difficulty'] == old_diff:
            item['difficulty'] = new_diff
            changes.append(f"  {item_id}: 难度 {old_diff} -> {new_diff}")

# ============================================================
# SAVE
# ============================================================

with open(FILE, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"\n✅ 修复完成！共 {len(changes)} 项修改：")
for c in changes:
    print(c)

# ============================================================
# VERIFICATION
# ============================================================
print("\n=== 验证 ===\n")

# Check answer distribution per article
print("📊 答案分布检查：")
problem_articles = []
for item in data:
    if item['type'] != 'multiple_choice':
        continue
    answers = get_answers(item)
    ans_letters = [a[1] for a in answers]
    unique_count = len(set(ans_letters))
    if unique_count <= 2:
        problem_articles.append((item['id'], ans_letters))
        print(f"  ⚠️ {item['id']}: {ans_letters} (仅{unique_count}种选项)")
    elif ans_letters.count('B') >= 4:
        problem_articles.append((item['id'], ans_letters))
        print(f"  ⚠️ {item['id']}: {ans_letters} (B出现{ans_letters.count('B')}次)")

if not problem_articles:
    print("  ✅ 所有文章答案分布合理（至少3种不同选项，无过度集中）")

# Check difficulty distribution
print("\n📊 难度梯度检查：")
diff_stats = {'easy': 0, 'medium': 0, 'hard': 0}
for item in data:
    d = item['difficulty']
    if d <= 0.35:
        diff_stats['easy'] += 1
    elif d <= 0.5:
        diff_stats['medium'] += 1
    else:
        diff_stats['hard'] += 1
total = sum(diff_stats.values())
print(f"  简单(≤0.35): {diff_stats['easy']} ({diff_stats['easy']/total*100:.0f}%)")
print(f"  中等(0.4-0.5): {diff_stats['medium']} ({diff_stats['medium']/total*100:.0f}%)")
print(f"  较难(>0.5): {diff_stats['hard']} ({diff_stats['hard']/total*100:.0f}%)")
if diff_stats['hard'] >= 6:
    print("  ✅ 较难题比例合理")
else:
    print(f"  ⚠️ 较难题偏少，建议再增加{6-diff_stats['hard']}篇")

# Check question phrasing
print("\n📊 提问句式检查：")
learn_from_count = 0
for item in data:
    if item['type'] == 'multiple_choice' and 'What can we learn from' in item['question']:
        learn_from_count += 1
if learn_from_count == 0:
    print("  ✅ 已消除所有'What can we learn from'重复")
else:
    print(f"  ⚠️ 仍有{learn_from_count}处'What can we learn from'")

print("\n🎉 全局优化完成！")
