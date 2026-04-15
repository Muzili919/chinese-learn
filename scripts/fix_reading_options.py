#!/usr/bin/env python3
"""
修复英语阅读理解/完形填空题的options字段问题：
1. 清理所有PLACEHOLDER污染
2. 检查并报告options为空的情况（多子题格式不需要改数据）
3. 修复错误的options内容（如en_reading_020选择题却用了TF选项）
"""

import json
import re
import os

BASE_DIR = '/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data'

FILES_TO_FIX = [
    'questions_en_j2_reading.json',   # 初中阅读
    'questions_en_reading.json',       # 小学阅读
    'questions_en_grammar.json',       # 小学语法/完形
    'questions_en_j2_grammar.json',    # 初中语法
]

def clean_placeholder(text):
    """清理文本中的PLACEHOLDER"""
    if not isinstance(text, str):
        return text
    # 移除 ___PLACEHOLDER___ 及其前后可能的空格
    text = re.sub(r'\s*___PLACEHOLDER___\s*', ' ', text)
    # 清理可能产生的多余空格
    text = re.sub(r' +', ' ', text)
    return text.strip()

def has_inline_options(question_text):
    """检测question文本中是否内嵌了ABCD选项"""
    if not isinstance(question_text, str):
        return False
    # 检测是否有 A. xxx B. xxx C. xxx D. xxx 格式
    pattern = r'[A-D]\.\s+\S'
    matches = re.findall(pattern, question_text)
    return len(matches) >= 2

def is_multi_part_answer(answer):
    """检测是否是多子题答案格式 (1) ... (2) ..."""
    if not isinstance(answer, str):
        return False
    return bool(re.search(r'\(\d+\)', answer))

def check_tf_option_mismatch(q):
    """
    检查选项类型与题目类型不匹配的情况。
    例如：选择题（ABCD选项）但用了TF判断题的options
    """
    options = q.get('options', [])
    question = q.get('question', '')
    
    if not options or len(options) < 2:
        return None
    
    # 检查是否是TF选项但题目实际是ABCD选择题
    is_tf_options = any('T（正确）' in opt or 'F（错误）' in opt for opt in options)
    has_abcd_in_question = bool(re.search(r'[A-D]\.\s+', question))
    
    if is_tf_options and has_abcd_in_question:
        return "TF选项用于ABCD选择题"
    
    # 检查是否是ABCD选项但题目是判断题
    is_abcd_options = len(options) >= 4 and all(re.match(r'^[A-D]\.', opt) for opt in options)
    is_tf_question = bool(re.search(r'正确.*错误|T.*F|判断|正误', question)) and '(　)' in question
    
    if is_abcd_options and is_tf_question:
        return "ABCD选项用于判断题"
    
    return None

def process_file(filepath):
    """处理单个JSON文件，返回修复统计"""
    print(f"\n{'='*60}")
    print(f"处理文件: {os.path.basename(filepath)}")
    print('='*60)
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    stats = {
        'total': len(data),
        'placeholder_cleaned': 0,
        'empty_options_multi_part': 0,      # 多子题+空options（正常）
        'empty_options_non_multi_part': 0,   # 非多子题+空options（需关注）
        'option_mismatches': [],             # 选项类型不匹配
        'fill_blank_no_options': 0,          # 填空题无options（正常）
        'fixed_items': [],
    }
    
    for i, q in enumerate(data):
        qid = q.get('id', f'unknown_{i}')
        changes = []
        
        # 1. 清理question中的PLACEHOLDER
        if 'question' in q:
            orig_q = q['question']
            clean_q = clean_placeholder(orig_q)
            if '___PLACEHOLDER___' in orig_q:
                q['question'] = clean_q
                stats['placeholder_cleaned'] += 1
                changes.append("清理question中PLACEHOLDER")
        
        # 2. 清理analysis中的PLACEHOLDER
        if 'analysis' in q:
            orig_a = q['analysis']
            clean_a = clean_placeholder(orig_a)
            if '___PLACEHOLDER___' in orig_a:
                q['analysis'] = clean_a
                changes.append("清理analysis中PLACEHOLDER")
                # 确保计入统计
                if "清理question中PLACEHOLDER" not in changes:
                    stats['placeholder_cleaned'] += 1
        
        # 3. 检查options状态
        options = q.get('options', [])
        answer = q.get('answer', '')
        question = q.get('question', '')
        qtype = q.get('type', '')
        
        if len(options) == 0:
            if qtype == 'fill_blank':
                stats['fill_blank_no_options'] += 1
            elif is_multi_part_answer(answer) or has_inline_options(question):
                stats['empty_options_multi_part'] += 1
            else:
                stats['empty_options_non_multi_part'] += 1
                changes.append("⚠️ 非多子题且options为空")
        
        # 4. 检查选项类型不匹配
        mismatch = check_tf_option_mismatch(q)
        if mismatch:
            stats['option_mismatches'].append(f"{qid}: {mismatch}")
            changes.append(f"⚠️ 选项不匹配: {mismatch}")
        
        if changes:
            stats['fixed_items'].append(f"{qid}: {'; '.join(changes)}")
    
    # 写回文件
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    # 输出统计
    print(f"总题数: {stats['total']}")
    print(f"清理PLACEHOLDER: {stats['placeholder_cleaned']} 题")
    print(f"填空题(无options,正常): {stats['fill_blank_no_options']} 题")
    print(f"多子题(空options,正常): {stats['empty_options_multi_part']} 题")
    print(f"⚠️ 非多子题空options: {stats['empty_options_non_multi_part']} 题")
    print(f"⚠️ 选项类型不匹配: {len(stats['option_mismatches'])} 处")
    
    if stats['option_mismatches']:
        for m in stats['option_mismatches']:
            print(f"  - {m}")
    
    if stats['fixed_items']:
        print(f"\n修复详情:")
        for item in stats['fixed_items']:
            print(f"  - {item}")
    
    return stats

def main():
    total_stats = {}
    
    for filename in FILES_TO_FIX:
        filepath = os.path.join(BASE_DIR, filename)
        if os.path.exists(filepath):
            stats = process_file(filepath)
            total_stats[filename] = stats
        else:
            print(f"\n⚠️ 文件不存在: {filepath}")
            total_stats[filename] = None
    
    # 输出汇总
    print(f"\n{'='*60}")
    print("📊 修复汇总报告")
    print('='*60)
    
    total_placeholders = sum(s['placeholder_cleaned'] for s in total_stats.values() if s)
    total_mismatches = sum(len(s['option_mismatches']) for s in total_stats.values() if s)
    total_empty_concern = sum(s['empty_options_non_multi_part'] for s in total_stats.values() if s)
    
    print(f"PLACEHOLDER清理总数: {total_placeholders}")
    print(f"选项类型不匹配总数: {total_mismatches}")
    print(f"⚠️ 需关注(非多子题空options): {total_empty_concern}")
    
    if total_empty_concern > 0 or total_mismatches > 0:
        print(f"\n⚠️ 有需要手动处理的项，请查看上方详情")

if __name__ == '__main__':
    main()
