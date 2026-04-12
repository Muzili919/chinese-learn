#!/usr/bin/env python3
"""修复干扰项分析中的选项引用问题
策略：重新从原始模块文件开始，逐题智能分配选项位置并同步更新analysis
"""
import json, random, re

random.seed(54321)

# 读取原始模块文件（答案都是B，analysis也是基于B正确来写的）
modules = ['_module_xflaw.json', '_module_ddxl.json', '_module_gqgc.json', '_module_shsh.json']
all_original = []
for mod in modules:
    with open(f'src/data/{mod}', 'r', encoding='utf-8') as f:
        all_original.extend(json.load(f))

print(f"原始总题数: {len(all_original)}")

# 目标答案分布：ABCD各30题
# 生成答案分配序列
answer_assignments = []
for letter in ['A','B','C','D']:
    answer_assignments.extend([letter] * 30)
random.shuffle(answer_assignments)

# 核心修复函数
def rebuild_question(q, target_answer):
    """
    重建题目：将正确答案从B改为target_answer
    同时更新analysis中的所有引用
    """
    options = q['options'][:]
    analysis = q['analysis']
    original_answer = q['answer']  # 原来都是B
    
    # 原始选项结构：A=错误, B=正确, C=错误, D=错误
    # 找到原始正确选项内容
    correct_content = options[1][2:]  # 去掉"B."
    
    # 错误选项内容
    wrong_contents = [options[0][2:], options[2][2:], options[3][2:]]  # A., C., D.
    
    # 目标：target_answer位置放正确答案，其他位置放错误选项
    target_idx = ord(target_answer) - ord('A')
    
    # 随机排列错误选项
    random.shuffle(wrong_contents)
    
    # 构建新选项
    new_options = []
    wrong_idx = 0
    for i in range(4):
        if i == target_idx:
            new_options.append(f"{target_answer}.{correct_content}")
        else:
            letter = chr(ord('A') + i)
            new_options.append(f"{letter}.{wrong_contents[wrong_idx]}")
            wrong_idx += 1
    
    # 建立字母映射：原始字母 -> 新字母
    # 原始：A=options[0], B=options[1](正确), C=options[2], D=options[3]
    original_map = {0: 'A', 1: 'B', 2: 'C', 3: 'D'}
    
    # 新选项中哪个位置放了原来的哪个选项
    # 新选项内容 -> 原始字母
    new_letter_for_original = {}
    for new_i, new_opt in enumerate(new_options):
        new_letter = chr(ord('A') + new_i)
        content = new_opt[2:]
        if content == options[0][2:]:
            new_letter_for_original['A'] = new_letter
        elif content == options[1][2:]:  # 正确答案
            new_letter_for_original['B'] = new_letter
        elif content == options[2][2:]:
            new_letter_for_original['C'] = new_letter
        elif content == options[3][2:]:
            new_letter_for_original['D'] = new_letter
    
    # 更新analysis中的引用
    # 1. "B正确" -> "{target_answer}正确"
    new_analysis = analysis
    
    # 替换 "B正确" 和 "B.正确" 等引用
    # 使用中文引号和普通引号的组合
    for orig_l in ['A','B','C','D']:
        new_l = new_letter_for_original.get(orig_l, orig_l)
        if orig_l == new_l:
            continue
        # 替换analysis中独立出现的选项字母引用
        # 但要小心不要替换掉内容中的字母
        # 只替换干扰项分析部分的引用
        patterns = [
            # "A"xxx" -> "新字母"xxx"
            (f'{orig_l}\u201c', f'{new_l}\u201c'),
            (f'{orig_l}"', f'{new_l}"'),
        ]
        # 只在干扰项分析部分替换
        if '【干扰项分析】' in new_analysis:
            trap_start = new_analysis.index('【干扰项分析】')
            before = new_analysis[:trap_start]
            after = new_analysis[trap_start:]
            for old, new in patterns:
                after = after.replace(old, new)
            new_analysis = before + after
        
        # 替换正确答案引用 "X正确"
        if orig_l == 'B':
            new_analysis = new_analysis.replace(f'{orig_l}正确', f'{target_answer}正确')
    
    # 构建新题目
    new_q = q.copy()
    new_q['options'] = new_options
    new_q['answer'] = target_answer
    new_q['analysis'] = new_analysis
    
    return new_q

# 处理所有题目
result = []
for i, q in enumerate(all_original):
    target = answer_assignments[i]
    new_q = rebuild_question(q, target)
    result.append(new_q)

# 验证
print("\n=== 验证 ===")

# 1. 答案分布
dist = {}
for q in result:
    dist[q['answer']] = dist.get(q['answer'], 0) + 1
print(f"答案分布: {dist}")

# 2. 检查干扰项分析引用问题
issues = 0
for q in result:
    answer = q['answer']
    analysis = q['analysis']
    options = {opt[0]: opt[2:] for opt in q['options']}
    
    if '【干扰项分析】' not in analysis:
        continue
    trap_section = analysis.split('【干扰项分析】')[1]
    
    refs = re.findall(r'([A-D])[\u201c"]([^"\u201d]+)[\u201d"]', trap_section)
    for ref_letter, ref_content in refs:
        if ref_letter == answer:
            issues += 1
        else:
            actual = options.get(ref_letter, '')
            if actual and ref_content[:8] not in actual:
                issues += 1

print(f"干扰项引用问题: {issues}处 (目标: 0)")

# 3. 难度分布
diff = {}
for q in result:
    d = q['difficulty']
    k = '基础' if d <= 0.4 else ('提升' if d <= 0.6 else '拓展')
    diff[k] = diff.get(k, 0) + 1
print(f"难度分布: {diff}")

# 4. 模块分布
mod = {}
for q in result:
    m = q['module']
    mod[m] = mod.get(m, 0) + 1
print(f"模块分布: {mod}")

# 5. 情境题
sit = sum(1 for q in result if '情境' in q['question'])
print(f"情境题: {sit}/120")

# 6. 干扰项分析
trap = sum(1 for q in result if '干扰项分析' in q['analysis'])
print(f"干扰项分析: {trap}/120")

# 7. ID连续性
ids = [q['id'] for q in result]
expected = [f"politics_choice_{str(i).zfill(3)}" for i in range(1, 121)]
print(f"ID连续性: {'✅' if ids == expected else '❌'}")

# 8. 选项数
opt_ok = all(len(q['options']) == 4 for q in result)
print(f"选项数: {'✅' if opt_ok else '❌'}")

# 保存
with open('src/data/questions_politics_choice.json', 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print(f"\n✅ 修复完成并保存!")
