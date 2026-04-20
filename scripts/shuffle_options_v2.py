#!/usr/bin/env python3
"""
正确的选项洗牌脚本 — 平衡答案ABCD分布
关键改进：
1. 不破坏answer字段
2. 正确处理options的letter前缀
3. 洗牌后同步更新answer
"""

import json
import random

INPUT_FILE = 'src/data/questions_math_junior_equation.json'
OUTPUT_FILE = 'src/data/questions_math_junior_equation.json'

random.seed(42)

def parse_option(opt):
    """解析 'A. xxx' -> ('A', 'xxx')"""
    s = opt.strip()
    if len(s) >= 2 and s[0] in 'ABCD' and s[1] in '.：:':
        return s[0], s[2:].strip()
    return None, s  # 无前缀

def make_option(letter, body):
    """构造 'A. xxx'"""
    return f'{letter}. {body}'

def main():
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f'加载 {len(data)} 道题')
    
    # Step 1: 提取每道题的正确答案内容（去除字母前缀）
    for q in data:
        # 解析当前答案，找到正确答案的body
        ans_letter, ans_body = parse_option(q['answer'])
        
        if ans_letter is None:
            # answer没有标准前缀，尝试在options中找匹配
            for opt in q['options']:
                _, body = parse_option(opt)
                if body == q['answer'].strip() or q['answer'].strip() in opt:
                    ans_body = body
                    break
        
        q['_correct_body'] = ans_body
    
        # 解析所有options为body列表
        bodies = []
        for opt in q['options']:
            _, body = parse_option(opt)
            bodies.append(body)
        q['_bodies'] = bodies
    
    # Step 2: 目标分布 - 尽量均匀
    target_counts = {'A': 17, 'B': 16, 'C': 16, 'D': 16}  # 65题
    current_counts = {'A': 0, 'B': 0, 'C': 0, 'D': 0}
    
    # 为每道题分配一个目标答案位置
    assignments = []  # list of target letters
    remaining = dict(target_counts)
    
    for i, q in enumerate(data):
        # 找到还有剩余名额的最优先字母
        best_letter = max(remaining.keys(), key=lambda k: remaining[k])
        assignments.append(best_letter)
        remaining[best_letter] -= 1
    
    random.shuffle(assignments)  # 打乱分配顺序避免规律性
    
    # Step 3: 执行洗牌
    from collections import Counter
    final_counter = Counter()
    
    for i, q in enumerate(data):
        target_letter = assignments[i]
        correct_body = q['_correct_body']
        bodies = q['_bodies']
        
        # 构建新的options：把correct_body放到target_letter位置
        new_opts_bodies = [None] * 4
        
        # 先放正确答案到目标位置
        new_opts_bodies[ord(target_letter) - ord('A')] = correct_body
        
        # 放其他三个选项到剩余位置
        other_bodies = [b for b in bodies if b != correct_body]
        
        positions = [j for j in range(4) if j != ord(target_letter) - ord('A')]
        random.shuffle(other_bodies)
        for pos, body in zip(positions, other_bodies):
            new_opts_bodies[pos] = body
        
        # 构建最终options
        letters = ['A', 'B', 'C', 'D']
        new_options = [make_option(letters[j], new_opts_bodies[j]) for j in range(4)]
        new_answer = make_option(target_letter, correct_body)
        
        q['options'] = new_options
        q['answer'] = new_answer
        
        final_counter[target_letter] += 1
        
        # 清理临时字段
        del q['_correct_body']
        del q['_bodies']
    
    print(f'\n洗牌后答案分布: {dict(final_counter)}')
    
    # 最终验证
    errors = []
    for q in data:
        if q['answer'] not in q['options']:
            errors.append(f'{q["id"]}: "{q["answer"]}" not in options')
    
    if errors:
        print(f'\n❌ 验证错误 ({len(errors)}题):')
        for e in errors[:10]:
            print(f'  {e}')
    else:
        print('✅ 所有答案均在选项中!')
    
    # 写回
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f'\n✅ 已写入 {OUTPUT_FILE}')

if __name__ == '__main__':
    main()
