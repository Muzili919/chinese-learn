#!/usr/bin/env python3
"""
修复政治选择题干扰项质量：
1. 让四个选项长度接近（最大差值控制在20字以内）
2. 去掉绝对化表述（"只有""一定""完全"等）
3. 干扰项要有一定迷惑性（包含部分正确关键词）
"""

import json
import re
import random

def load_data():
    with open('src/data/questions_politics_choice.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def save_data(data):
    with open('src/data/questions_politics_choice.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def clean_option(opt):
    """去掉 A. B. C. D. 前缀"""
    return re.sub(r'^[A-D][.．、]\s*', '', str(opt).strip())

def option_length(opt):
    return len(clean_option(opt))

def has_absolutes(opt):
    """检测是否包含绝对化表述"""
    absolutes = ['只有', '一定', '完全', '绝对', '全部', '所有', '都', '根本不', '没有任何', '绝不会']
    clean = clean_option(opt)
    return any(a in clean for a in absolutes)

def is_too_negative(opt):
    """检测选项是否过于负面/错误"""
    clean = clean_option(opt)
    # 干扰项不应该一眼就能看出是错的
    negatives = ['不需要', '无关', '没用', '可以不做', '不用遵守', '没有关系']
    return any(n in clean for n in negatives)

def balance_option_lengths(options, answer_letter):
    """检查选项长度是否平衡"""
    lengths = [option_length(opt) for opt in options]
    max_len = max(lengths)
    min_len = min(lengths)
    return max_len - min_len

def improve_distractor(wrong_opt, correct_opt, question_text):
    """改善干扰项质量"""
    clean_correct = clean_option(correct_opt)
    clean_wrong = clean_option(wrong_opt)
    q_clean = question_text[:100]
    
    # 策略：让干扰项和正确答案长度接近，但内容上有微妙区别
    target_len = len(clean_correct)
    current_len = len(clean_wrong)
    
    # 如果干扰项太短，需要扩展
    if current_len < target_len - 5:
        # 基于正确答案创建干扰项，替换关键动词/修饰词
        # 这样干扰项看起来像正确答案但有本质区别
        pass
    
    # 如果干扰项有绝对化表述，去掉
    cleaned = clean_wrong
    cleaned = cleaned.replace('只有', '主要').replace('一定', '通常').replace('完全', '基本').replace('绝对', '基本').replace('全部', '大部分').replace('都', '多数')
    
    return cleaned

def analyze_quality(data):
    """分析题库质量"""
    stats = {
        'longest_is_correct': 0,
        'total': 0,
        'absolutes_in_distractors': 0,
        'too_short_distractors': 0,
        'max_diff': 0,
        'avg_diff': 0,
    }
    
    diffs = []
    bad_examples = []
    
    for q in data:
        options = q.get('options', [])
        if len(options) < 4:
            continue
        
        correct_letter = q['answer'].strip().upper()
        correct_idx = ord(correct_letter) - ord('A')
        if correct_idx >= len(options):
            continue
        
        lengths = [option_length(opt) for opt in options]
        correct_len = lengths[correct_idx]
        max_len = max(lengths)
        min_len = min(lengths)
        diff = max_len - min_len
        diffs.append(diff)
        
        stats['total'] += 1
        if correct_len == max_len:
            stats['longest_is_correct'] += 1
        
        for i, opt in enumerate(options):
            if i == correct_idx:
                continue
            if has_absolutes(opt):
                stats['absolutes_in_distractors'] += 1
            if option_length(opt) < 10:
                stats['too_short_distractors'] += 1
        
        if correct_len == max_len and diff > 15:
            if len(bad_examples) < 5:
                bad_examples.append((q['id'], diff, lengths, options, correct_letter))
    
    stats['max_diff'] = max(diffs) if diffs else 0
    stats['avg_diff'] = sum(diffs) / len(diffs) if diffs else 0
    
    return stats, bad_examples

if __name__ == '__main__':
    data = load_data()
    
    print("=" * 60)
    print("政治选择题干扰项质量分析")
    print("=" * 60)
    
    stats, bad_examples = analyze_quality(data)
    
    print(f"\n总题数: {stats['total']}")
    print(f"正确答案=最长选项: {stats['longest_is_correct']}/{stats['total']} = {stats['longest_is_correct']/stats['total']*100:.1f}%")
    print(f"干扰项含绝对化表述: {stats['absolutes_in_distractors']} 处")
    print(f"干扰项过短(<10字): {stats['too_short_distractors']} 处")
    print(f"选项最大长度差: {stats['max_diff']} 字")
    print(f"选项平均长度差: {stats['avg_diff']:.1f} 字")
    
    print(f"\n=== 最严重的题目（正确答案=最长且差值>15）===")
    for qid, diff, lengths, options, correct in bad_examples:
        print(f"\n[{qid}] 选项长度差={diff}")
        for i, opt in enumerate(options):
            marker = ' ← 答案' if chr(ord('A')+i) == correct else ''
            print(f"  {chr(ord('A')+i)}. {opt[:60]}{'...' if len(opt)>60 else ''} (len={lengths[i]}){marker}")
    
    print(f"\n\n{'=' * 60}")
    print(f"目标: 正确答案=最长选项 的比例从 {stats['longest_is_correct']/stats['total']*100:.1f}% 降到 25% 以下")
    print(f"{'=' * 60}")
