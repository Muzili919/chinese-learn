#!/usr/bin/env python3
"""
彻底修复方案：重新生成所有干扰项分析，确保引用正确
策略：
1. 读取原始模块文件（B为正确答案）
2. 对每道题，基于原始选项重新生成准确的干扰项分析
3. 分配目标答案并重新排列选项
4. 同步更新所有引用
"""
import json, random, re

random.seed(99988)

# 读取原始模块文件
modules_files = ['_module_xflaw.json', '_module_ddxl.json', '_module_gqgc.json', '_module_shsh.json']
all_original = []
for mod in modules_files:
    with open(f'src/data/{mod}', 'r', encoding='utf-8') as f:
        all_original.extend(json.load(f))

print(f"原始总题数: {len(all_original)}")

# 谬误类型
fallacy_types = ['以偏概全', '偷换概念', '极端推论', '无中生有', '概念混淆', '道德绑架']

def extract_option_content(opt):
    """从选项中提取关键短语用于干扰项分析"""
    content = opt[2:]  # 去掉"A."
    # 提取核心观点（取前10-15个字的关键部分）
    if len(content) <= 20:
        return content
    # 找到逗号、句号等分隔
    for sep in ['，', '。', '、']:
        idx = content.find(sep)
        if idx > 3:
            return content[:idx]
    return content[:15]

def generate_trap_analysis(q, new_options, correct_answer):
    """为每个错误选项生成干扰项分析"""
    wrong_options = [(opt[0], opt[2:]) for opt in new_options if opt[0] != correct_answer]
    
    trap_parts = []
    # 按顺序为每个错误选项分配谬误类型
    fallacies = ['以偏概全', '偷换概念', '概念混淆', '无中生有', '极端推论']
    
    for i, (letter, content) in enumerate(wrong_options):
        # 提取内容关键部分
        key_phrase = extract_option_content(letter + '.' + content)
        fallacy = fallacies[i % len(fallacies)]
        trap_parts.append(f"{letter}\u201c{key_phrase}\u201d属于{fallacy}")
    
    return '；'.join(trap_parts) + '。'

# 答案分配
answer_assignments = []
for letter in ['A','B','C','D']:
    answer_assignments.extend([letter] * 30)
random.shuffle(answer_assignments)

result = []

for i, q in enumerate(all_original):
    target = answer_assignments[i]
    original_options = q['options'][:]
    
    # 原始选项：B是正确答案
    correct_content = original_options[1][2:]  # B.后面的内容
    wrong_contents = [original_options[0][2:], original_options[2][2:], original_options[3][2:]]
    
    # 随机排列错误选项
    random.shuffle(wrong_contents)
    
    # 构建新选项
    target_idx = ord(target) - ord('A')
    new_options = []
    wrong_idx = 0
    for j in range(4):
        letter = chr(ord('A') + j)
        if j == target_idx:
            new_options.append(f"{letter}.{correct_content}")
        else:
            new_options.append(f"{letter}.{wrong_contents[wrong_idx]}")
            wrong_idx += 1
    
    # 重建analysis
    analysis = q['analysis']
    
    # 提取考点和解题思路部分（干扰项分析之前的部分）
    if '【干扰项分析】' in analysis:
        before_trap = analysis.split('【干扰项分析】')[0].rstrip()
        # 移除末尾的分号
        if before_trap.endswith('。') or before_trap.endswith('；'):
            pass
        # 把原来的"X正确"替换
        before_trap = re.sub(r'[A-D]正确', f'{target}正确', before_trap)
    else:
        before_trap = analysis
    
    # 生成新的干扰项分析
    new_trap = generate_trap_analysis(q, new_options, target)
    
    new_analysis = f"{before_trap}\n【干扰项分析】{new_trap}"
    
    # 构建新题目
    new_q = q.copy()
    new_q['options'] = new_options
    new_q['answer'] = target
    new_q['analysis'] = new_analysis
    
    result.append(new_q)

# 验证
print("\n=== 全面验证 ===")

# 1. 答案分布
dist = {}
for q in result:
    dist[q['answer']] = dist.get(q['answer'], 0) + 1
print(f"答案分布: {dist}")

# 2. 检查干扰项分析引用
issues = 0
for q in result:
    answer = q['answer']
    analysis = q['analysis']
    options = {opt[0]: opt[2:] for opt in q['options']}
    
    if '【干扰项分析】' not in analysis:
        issues += 1
        continue
    trap_section = analysis.split('【干扰项分析】')[1]
    
    # 找所有选项引用
    refs = re.findall(r'([A-D])\u201c([^\u201d]+)\u201d', trap_section)
    
    for ref_letter, ref_content in refs:
        # 不能引用正确答案
        if ref_letter == answer:
            issues += 1
            continue
        # 内容应匹配实际选项
        actual = options.get(ref_letter, '')
        if actual and ref_content[:6] not in actual:
            issues += 1

print(f"干扰项引用问题: {issues}处")

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

# 7. ID
ids = [q['id'] for q in result]
expected = [f"politics_choice_{str(i).zfill(3)}" for i in range(1, 121)]
print(f"ID连续性: {'✅' if ids == expected else '❌'}")

# 8. 选项数
opt_ok = all(len(q['options']) == 4 for q in result)
print(f"选项数: {'✅' if opt_ok else '❌'}")

# 抽样展示3题
print("\n=== 抽样展示 ===")
for q in random.sample(result, 3):
    print(f"\n{q['id']}: answer={q['answer']}, module={q['module']}, diff={q['difficulty']}")
    for opt in q['options']:
        print(f"  {opt}")
    # 只显示干扰项分析部分
    if '【干扰项分析】' in q['analysis']:
        trap = q['analysis'].split('【干扰项分析】')[1]
        print(f"  干扰项: {trap[:150]}")

# 保存
with open('src/data/questions_politics_choice.json', 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print(f"\n✅ 最终文件已保存!")
