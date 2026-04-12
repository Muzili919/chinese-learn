#!/usr/bin/env python3
"""修复选项交换导致的答案-选项不匹配问题"""
import json

with open('src/data/questions_en_j2_grammar.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

q_by_num = {q['id'].split('_')[-1]: q for q in data}

# 这23道题的正确答案文本（基于题目内容和语法规则推导）
fixes = {
    '002': 'sang',
    '004': 'stopped flying',
    '006': 'Did; did',
    '007': 'was doing; was singing; went',
    '009': 'finished',
    '014': 'has he',
    '016': 'study; can get',
    '017': 'Where',
    '018': 'got up; had',
    '021': 'will',
    '022': 'will be discussed; will be solved',
    '023': 'is going to',
    '026': "aren't",
    '027': 'will',
    '031': 'are going to',
    '033': 'will be held',
    '035': 'do',
    '039': "wasn't watching",
    '043': 'When',
    '062': 'was built',
    '063': 'was broken',
    '071': 'should be planted',
    '079': 'must',
}

fixed = 0
for num, correct_text in fixes.items():
    q = q_by_num[num]
    # 查找哪个选项字母包含正确答案文本
    found_letter = None
    for opt in q['options']:
        if opt and opt[0] in 'ABCD':
            text = opt[2:].strip()  # 去掉 "A. " 前缀
            if text == correct_text:
                found_letter = opt[0]
                break
    
    if found_letter:
        old_ans = q['answer']
        if old_ans != found_letter:
            print(f"[{num}] 修复: {old_ans} → {found_letter} (正确答案: {correct_text})")
            q['answer'] = found_letter
            fixed += 1
        else:
            print(f"[{num}] 已正确: {found_letter}")
    else:
        print(f"[{num}] ❌ 未找到正确答案 '{correct_text}' 在选项中!")
        print(f"    选项: {q['options']}")

with open('src/data/questions_en_j2_grammar.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"\n共修复 {fixed} 道")
