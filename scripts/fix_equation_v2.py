#!/usr/bin/env python3
"""
修复 questions_math_junior_equation.json 的三大问题：
1. balance_answers脚本搞乱了options顺序和answer字段
2. 中文引号可能导致JSON解析问题（替换为安全符号）
3. 手机适配性检查和修正

策略：
- 从被污染的answer字段中提取原始正确答案内容
- 在打乱的options中找到匹配项作为新答案
- 将options重新排序为ABCD标准格式
- 替换中文引号为书名号或其他安全符号
"""

import json
import re
import random

INPUT_FILE = 'src/data/questions_math_junior_equation.json'
OUTPUT_FILE = 'src/data/questions_math_junior_equation.json'

def clean_chinese_quotes(text):
    """将中文引号替换为安全符号"""
    if not isinstance(text, str):
        return text
    # 中文双引号 -> 书名号或单引号
    text = text.replace('"', '「')
    text = text.replace('"', '」')
    # 中文单引号
    text = text.replace(''', '『')
    text = text.replace(''', '』')
    return text

def extract_correct_answer(corrupted_answer, options):
    """
    从被污染的answer中提取正确的选项。
    
    污染模式分析：
    - 正常: "B. x=3" → 直接在options中找
    - 污染: "C. A. x=3" → 后半部分"A. x=3"是原始答案内容，在options中找匹配
    - 污染: "B. A. 30人" → 后半部分是原始答案
    """
    parts = corrupted_answer.split('. ', 1)
    
    if len(parts) == 2 and len(parts[0]) == 1 and parts[0] in 'ABCD':
        # 模式: "X. 原始答案内容"
        original_content = parts[1]
        # 去掉可能的 "A." "B." 等前缀
        content_parts = original_content.split('. ', 1)
        if len(content_parts) == 2 and content_parts[0] in 'ABCD':
            search_text = content_parts[1].strip()
        else:
            search_text = original_content.strip()
    else:
        # 可能是正常格式或只有前缀
        search_text = corrupted_answer.strip()
        # 去掉前缀字母
        if len(search_text) >= 2 and search_text[1] == '. ' and search_text[0] in 'ABCD':
            search_text = search_text[2:].strip()
    
    # 在options中搜索匹配项
    for i, opt in enumerate(options):
        opt_clean = opt.strip()
        if opt_clean.startswith(search_text) or search_text.startswith(opt_clean.lstrip('ABCD. ').lstrip()):
            return opt, i
        # 也尝试去掉opt的前缀后比较
        opt_body = opt_clean
        if len(opt_clean) >= 2 and opt_clean[1] in '.：: ' and opt_clean[0] in 'ABCD':
            opt_body = opt_clean[2:].strip()
        if opt_body == search_text or search_text == opt_body:
            return opt, i
    
    # 模糊匹配：看search_text是否包含在某个option中（去除前缀后）
    for i, opt in enumerate(options):
        opt_body = opt.strip()
        if len(opt_body) >= 2 and opt_body[1] in '.：: ' and opt_body[0] in 'ABCD':
            opt_body = opt_body[2:].strip()
        # 去掉单位后比较
        for suffix in ['元', '人', '本', '天', '小时', 'h', 'km/h', '分钟', '年']:
            if (search_text.rstrip() == opt_body.rstrip().rstrip(suffix) or
                opt_body.rstrip() == search_text.rstrip().rstrip(suffix)):
                return opt, i
    
    return None, -1


def main():
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f'加载 {len(data)} 道题\n')
    
    fixed_count = 0
    failed_fixes = []
    quote_replaced = 0
    long_questions = []
    
    for idx, q in enumerate(data):
        qid = q['id']
        
        # === Step 1: 清理中文引号 ===
        q['question'] = clean_chinese_quotes(q.get('question', ''))
        q['analysis'] = clean_chinese_quotes(q.get('analysis', ''))
        
        # 也清理options中的中文引号
        new_options = [clean_chinese_quotes(o) for o in q['options']]
        
        # === Step 2: 修复答案 ===
        old_answer = q['answer']
        matched_opt, match_idx = extract_correct_answer(old_answer, new_options)
        
        if matched_opt is not None:
            q['answer'] = matched_opt
            
            # === Step 3: 重新排序options为ABCD顺序 ===
            # 把正确答案放到它该在的位置，其他按原逻辑排列
            # 策略：构建 {letter: option} 映射，重新排序
            opt_map = {}
            remaining_opts = []
            
            for opt in new_options:
                o = opt.strip()
                if len(o) >= 2 and o[0] in 'ABCD' and o[1] in '.：:':
                    letter = o[0]
                    body = o[2:].strip()
                    opt_map[letter] = f'{letter}. {body}'
                else:
                    remaining_opts.append(opt)
            
            # 如果能解析出4个字母映射，直接用映射重建
            if len(opt_map) == 4:
                sorted_options = [opt_map['A'], opt_map['B'], opt_map['C'], opt_map['D']]
            else:
                # 无法完美解析时保持现有顺序但确保答案在其中
                sorted_options = new_options
            
            q['options'] = sorted_options
            fixed_count += 1
        else:
            failed_fixes.append({
                'id': qid,
                'old_answer': old_answer,
                'options': new_options[:2]  # 只存前两个方便查看
            })
        
        # === Step 4: 手机适配检查 ===
        qlen = len(q['question'])
        if qlen > 140:
            long_questions.append((qid, qlen))
        
        # 检查analysis长度
        analysis = q.get('analysis', '')
        if len(analysis) < 20:
            print(f'⚠️ {qid}: analysis过短 ({len(analysis)}字)')
    
    # === 最终验证 ===
    print(f'\n=== 修复结果 ===')
    print(f'成功修复: {fixed_count}/{len(data)} 题')
    
    if failed_fixes:
        print(f'\n❌ 未能自动修复 {len(failed_fixes)} 题:')
        for fail in failed_fixes:
            print(f'  {fail["id"]}: answer="{fail["old_answer"]}" options={fail["options"]}')
    
    if long_questions:
        print(f'\n⚠️ 题目过长(>{140}字)可能影响手机显示:')
        for qid, length in long_questions:
            print(f'  {qid}: {length}字')
    
    # 验证所有答案都在options中
    validation_errors = []
    from collections import Counter
    ans_counter = Counter()
    
    for q in data:
        ans = q['answer']
        opts = q['options']
        if ans not in opts:
            validation_errors.append(f'{q["id"]}: "{ans}" 不在 {opts} 中')
        else:
            ans_counter[ans[0]] += 1
    
    if validation_errors:
        print(f'\n❌ 答案验证失败 ({len(validation_errors)}题):')
        for err in validation_errors[:10]:
            print(f'  {err}')
    else:
        print(f'\n✅ 所有答案均在选项中!')
    
    print(f'\n最终答案分布: {dict(ans_counter)}')
    
    # 统计知识点
    tag_counter = Counter(q['knowledge_tag'] for q in data)
    print(f'知识点分布 ({sum(tag_counter.values())}题):')
    for tag, cnt in sorted(tag_counter.items()):
        print(f'  {tag}: {cnt}')
    
    diff_counter = Counter(q['difficulty'] for q in data)
    print(f'难度分布: {dict(diff_counter)}')
    
    # 写回文件
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f'\n✅ 已写入 {OUTPUT_FILE}')


if __name__ == '__main__':
    main()
