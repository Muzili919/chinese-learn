#!/usr/bin/env python3
"""
修复政治选择题干扰项 — 让四个选项长度接近、迷惑性增强
核心策略：
1. 干扰项长度向正确答案靠拢（目标差值≤5字）
2. 干扰项去掉绝对化表述，替换为"容易混淆"的表述
3. 每题至少2个干扰项长度≥正确答案长度的80%
"""

import json
import re
import sys

def load_data():
    with open('src/data/questions_politics_choice.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def save_data(data):
    with open('src/data/questions_politics_choice.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def clean_prefix(opt):
    return re.sub(r'^[A-D][.．、]\s*', '', str(opt).strip())

def opt_len(opt):
    return len(clean_prefix(opt))

def fix_absolutes(text):
    """替换绝对化表述为更合理的说法"""
    replacements = [
        ('只有成年人才需要了解宪法', '未成年人可以暂时不了解宪法'),
        ('宪法确实主要规范国家大事，对个人生活影响不大', '宪法主要规范国家大事，日常生活中较少涉及'),
        ('宪法与其他法律地位相同', '其他法律与宪法互不隶属，各自独立'),
        ('与我们的日常生活无关', '只在特定场合才会用到'),
        ('不需要遵守', '可以选择性遵守'),
        ('没有任何关系', '关系不大'),
        ('完全可以', '一般可以'),
        ('一定是', '通常是'),
        ('只有...才', '主要通过...来'),
        ('绝对不会', '一般不会'),
        ('都不需要', '大多数不需要'),
        ('全部', '大部分'),
        ('根本不', '不太'),
        ('一定能够', '有可能'),
        ('所有', '多数'),
        ('必须', '应当'),
        ('只能', '主要'),
        ('完全', '基本'),
        ('绝对', '相对'),
    ]
    for old, new in replacements:
        text = text.replace(old, new)
    return text

def enhance_distractor(distractor_text, correct_text, question_text):
    """增强干扰项：让它更长、更像正确答案"""
    clean_d = clean_prefix(distractor_text)
    clean_c = clean_prefix(correct_text)
    
    # 如果干扰项太短（< 正确答案长度的60%），需要扩展
    target_ratio = 0.75  # 干扰项至少达到正确答案75%的长度
    target_len = int(len(clean_c) * target_ratio)
    
    if len(clean_d) < target_len:
        # 策略1：从正确答案中提取可用短语来扩展干扰项
        # 提取正确答案中的关键词组（4-8字的短语）
        phrases = re.findall(r'[\u4e00-\u9fff]{4,8}', clean_c)
        
        # 策略2：给干扰项加合理的修饰语
        add_ons = {
            '不': '在某些特定情况下不',
            '无关': '在日常生活中关联不大',
            '错误': '存在一定偏差',
            '不对': '这种说法不够准确',
            '可以不做': '应当根据实际情况选择',
            '不需要': '一般情况下不强制要求',
            '没有': '在特定条件下才有',
            '不受': '在一定程度上受',
        }
        
        new_d = clean_d
        for short, long in add_ons.items():
            if short in new_d:
                new_d = new_d.replace(short, long)
                break
        
        # 如果还是太短，尝试加一个前缀
        if len(new_d) < target_len and len(new_d) < 15:
            prefixes = [
                '从一定角度看，',
                '在某些情况下，',
                '这种说法',
            ]
            for p in prefixes:
                if len(new_d + p) <= len(clean_c) + 3:
                    new_d = p + new_d
                    break
        
        clean_d = new_d
    
    # 去掉绝对化表述
    clean_d = fix_absolutes(clean_d)
    
    return clean_d

def fix_question(q):
    """修复单题的干扰项"""
    options = q.get('options', [])
    if len(options) < 4:
        return q
    
    correct_letter = q['answer'].strip().upper()
    correct_idx = ord(correct_letter) - ord('A')
    if correct_idx >= len(options):
        return q
    
    correct_clean = clean_prefix(options[correct_idx])
    correct_len = len(correct_clean)
    
    # 修复每个干扰项
    new_options = []
    for i, opt in enumerate(options):
        prefix = opt[:2] if len(opt) >= 2 and opt[0] in 'ABCDabcd' and opt[1] in '.．、' else f'{chr(ord("A")+i)}.'
        clean = clean_prefix(opt)
        
        if i == correct_idx:
            # 正确答案不动
            new_options.append(opt)
            continue
        
        # 修复干扰项
        fixed = enhance_distractor(clean, correct_clean, q['question'])
        new_options.append(f'{prefix}{fixed}')
    
    q['options'] = new_options
    
    # 更新解析中的干扰项分析
    if q.get('analysis'):
        # 保持原样，干扰项分析已写好
        pass
    
    return q

def verify_quality(data):
    """验证修复效果"""
    longest_correct = 0
    total = 0
    diffs = []
    
    for q in data:
        options = q.get('options', [])
        if len(options) < 4:
            continue
        correct_idx = ord(q['answer'].strip().upper()) - ord('A')
        if correct_idx >= len(options):
            continue
        
        lengths = [opt_len(opt) for opt in options]
        total += 1
        if lengths[correct_idx] == max(lengths):
            longest_correct += 1
        diffs.append(max(lengths) - min(lengths))
    
    pct = longest_correct / total * 100 if total else 0
    avg_diff = sum(diffs) / len(diffs) if diffs else 0
    return pct, avg_diff, total

if __name__ == '__main__':
    data = load_data()
    
    print("修复前:")
    pct_before, avg_before, total = verify_quality(data)
    print(f"  最长=正确: {pct_before:.1f}%, 平均长度差: {avg_before:.0f}字")
    
    # 修复所有题
    fixed_data = [fix_question(q) for q in data]
    
    print("\n修复后:")
    pct_after, avg_after, total = verify_quality(fixed_data)
    print(f"  最长=正确: {pct_after:.1f}%, 平均长度差: {avg_after:.0f}字")
    
    print(f"\n改善: {pct_before:.1f}% → {pct_after:.1f}%")
    
    if pct_after < 35:
        print("\n✅ 质量达标，保存修复结果")
        save_data(fixed_data)
    else:
        print(f"\n⚠️ 仍需进一步优化 ({pct_after:.1f}% > 35%)")
        save_data(fixed_data)  # 先保存，后续再优化
