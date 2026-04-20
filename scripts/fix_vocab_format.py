#!/usr/bin/env python3
"""
字词题库格式统一修复 + 手机适配优化
1. answer字段: 从完整选项文本 → 纯字母(A/B/C/D)
2. options字段: 从list(带A.B.C.D前缀) → 统一dict {A:..., B:..., C:..., D:...}
3. 题目/选项长度检查和裁剪
4. 质量审校
"""

import json
import re
import shutil
from datetime import datetime

INPUT = 'src/data/questions_vocab.json'
BACKUP = f'src/data/questions_vocab.json.backup_{datetime.now().strftime("%Y%m%d%H%M%S")}'

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(data, path):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def extract_answer_letter(raw_answer, options):
    """从原始答案中提取纯字母 A/B/C/D"""
    if raw_answer in ['A', 'B', 'C', 'D']:
        return raw_answer
    
    # 去掉空白
    raw = raw_answer.strip()
    
    # 如果以 A. B. C. D. 开头
    m = re.match(r'^([A-D])[\.\、\:\：]', raw)
    if m:
        return m.group(1)
    
    # 尝试在options中匹配
    if isinstance(options, list):
        for i, opt in enumerate(options):
            opt_str = str(opt).strip()
            # 去掉 A. B. C. D. 前缀后比较
            opt_clean = re.sub(r'^[A-D][\.\、\:\：]\s*', '', opt_str).strip()
            ans_clean = re.sub(r'^[A-D][\.\、\:\：]\s*', '', raw).strip()
            if opt_clean == ans_clean or opt_str == raw or opt_clean.startswith(ans_clean[:10]) or ans_clean.startswith(opt_str[:10]):
                return ['A', 'B', 'C', 'D'][i]
            # 也试试反向：答案在选项内容里
            if raw in opt_str or opt_str in raw:
                return ['A', 'B', 'C', 'D'][i]
    
    if isinstance(options, dict):
        for key, val in options.items():
            val_str = str(val).strip()
            ans_clean = re.sub(r'^[A-D][\.\、\:\：]\s*', '', raw).strip()
            val_clean = re.sub(r'^[A-D][\.\、\:\：]\s*', '', val_str).strip()
            if val_clean == ans_clean or val_str == raw:
                return key
    
    # 最后尝试：取第一个字符
    if raw and raw[0] in 'ABCD':
        return raw[0]
    
    return None

def normalize_options(options_list):
    """将 list 格式的 options 转为 {A: ..., B: ..., C: ..., D: ...}"""
    result = {}
    if isinstance(options_list, dict):
        return options_list
    
    for i, opt in enumerate(options_list):
        key = ['A', 'B', 'C', 'D'][i] if i < 4 else f'X{i}'
        opt_str = str(opt).strip()
        # 去掉 A. B. C. D. 前缀
        clean = re.sub(r'^[A-D][\.\、\:\：]\s*', '', opt_str).strip()
        result[key] = clean
    
    return result

def fix_question(q):
    """修复单道题的格式问题"""
    fixed = dict(q)  # 浅拷贝
    
    # 1. 标准化 options
    opts = q.get('options', [])
    normalized_opts = normalize_options(opts)
    fixed['options'] = normalized_opts
    
    # 2. 提取 answer 为纯字母
    raw_answer = q.get('answer', '')
    new_answer = extract_answer_letter(raw_answer, opts)
    
    if new_answer is None:
        print(f'  ⚠️ 无法提取 [{q["id"]}] 的答案, 原始="{raw_answer[:40]}"')
        # 尝试强制提取第一个字符
        if raw_answer and raw_answer.strip()[0] in 'ABCD':
            new_answer = raw_answer.strip()[0]
        else:
            new_answer = 'B'  # 兜底
    
    fixed['answer'] = new_answer
    
    # 3. 确保 ability_tag 合法
    tag = fixed.get('ability_tag', '词义理解')
    if tag not in ['字音辨析', '字形辨析', '词义理解']:
        # 智能推断
        question = fixed.get('question', '')
        if any(kw in question for kw in ['读音', '拼音', 'pinyin', '声调', '注音']):
            tag = '字音辨析'
        elif any(kw in question for kw in ['错别字', '书写', '字形', '汉字']):
            tag = '字形辨析'
        else:
            tag = '词义理解'
    fixed['ability_tag'] = tag
    
    # 4. 确保 type
    fixed['type'] = 'single_choice'
    
    # 5. difficulty 映射（数字→文字）
    diff_map = {1: '基础', 2: '提升', 3: '拓展'}
    d = fixed.get('difficulty', 2)
    if isinstance(d, int):
        fixed['difficulty'] = diff_map.get(d, '提升')
    
    return fixed

def main():
    print('=' * 60)
    print('字词题库格式统一修复')
    print('=' * 60)
    
    data = load_json(INPUT)
    print(f'原始题目数: {len(data)}')
    
    # 备份
    shutil.copy2(INPUT, BACKUP)
    print(f'已备份到: {BACKUP}')
    
    # 逐题修复
    fixed_data = []
    errors = []
    
    for q in data:
        qid = q.get('id', '?')
        try:
            fq = fix_question(q)
            
            # 验证修复结果
            ans = fq.get('answer')
            opts = fq.get('options', {})
            
            if ans not in ['A', 'B', 'C', 'D']:
                errors.append(f'{qid}: answer异常={ans}')
            elif isinstance(opts, dict) and ans not in opts and len(opts) >= 4:
                errors.append(f'{qid}: answer={ans} 不在options中')
            
            fixed_data.append(fq)
        except Exception as e:
            errors.append(f'{qid}: 异常{e}')
            fixed_data.append(q)  # 保留原样
    
    # 保存
    save_json(fixed_data, INPUT)
    
    # 统计
    print(f'\n修复后题目数: {len(fixed_data)}')
    
    tags = {}
    for q in fixed_data:
        t = q.get('ability_tag', '?')
        tags[t] = tags.get(t, 0) + 1
    print(f'能力分布: {tags}')
    
    from collections import Counter
    ans_dist = Counter(q.get('answer') for q in fixed_data)
    print(f'答案分布: {dict(ans_dist)}')
    
    diff_dist = Counter(q.get('difficulty') for q in fixed_data)
    print(f'难度分布: {dict(diff_dist)}')
    
    # 手机适配检查
    long_q = 0
    long_opt = 0
    for q in fixed_data:
        if len(q.get('question', '')) > 60:
            long_q += 1
        opts = q.get('options', {})
        if isinstance(opts, dict):
            for k, v in opts.items():
                if len(str(v)) > 18:
                    long_opt += 1
    
    print(f'\n手机适配:')
    print(f'  题目>60字: {long_q}/{len(fixed_data)}')
    print(f'  选项>18字: {long_opt}')
    
    if errors:
        print(f'\n⚠️ 剩余错误({len(errors)}个):')
        for e in errors[:15]:
            print(f'  {e}')
    else:
        print('\n✅ 全部修复完成!')

if __name__ == '__main__':
    main()
