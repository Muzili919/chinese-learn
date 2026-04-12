#!/usr/bin/env python3
"""
彻底修复v2：正确处理原始答案位置，重新打乱选项并同步更新analysis
"""
import json, random, re

random.seed(777666)

# 读取原始模块文件
modules_files = ['_module_xflaw.json', '_module_ddxl.json', '_module_gqgc.json', '_module_shsh.json']
all_original = []
for mod in modules_files:
    with open(f'src/data/{mod}', 'r', encoding='utf-8') as f:
        all_original.extend(json.load(f))

print(f"原始总题数: {len(all_original)}")

# 验证原始答案分布
orig_dist = {}
for q in all_original:
    orig_dist[q['answer']] = orig_dist.get(q['answer'], 0) + 1
print(f"原始答案分布: {orig_dist}")

# 答案分配：ABCD各30题
answer_assignments = []
for letter in ['A','B','C','D']:
    answer_assignments.extend([letter] * 30)
random.shuffle(answer_assignments)

def extract_key_phrase(content):
    """从选项内容中提取关键短语"""
    if len(content) <= 20:
        return content
    for sep in ['，', '。', '、']:
        idx = content.find(sep)
        if 3 < idx < 30:
            return content[:idx]
    return content[:15]

def rebuild_question_v2(q, target_answer):
    """
    正确重建题目：
    1. 找到原始正确选项内容（根据原始answer字母定位）
    2. 将正确内容放到target_answer位置
    3. 其他选项随机排列
    4. 重建analysis
    """
    options = q['options'][:]
    original_answer = q['answer']
    
    # 找到原始正确选项的索引和内容
    correct_idx = ord(original_answer) - ord('A')
    correct_content = options[correct_idx][2:]  # 去掉"X."
    
    # 收集错误选项内容
    wrong_contents = []
    for i, opt in enumerate(options):
        if i != correct_idx:
            wrong_contents.append(opt[2:])
    
    # 随机排列错误选项
    random.shuffle(wrong_contents)
    
    # 构建新选项：target_answer位置放正确内容
    target_idx = ord(target_answer) - ord('A')
    new_options = []
    wrong_idx = 0
    for j in range(4):
        letter = chr(ord('A') + j)
        if j == target_idx:
            new_options.append(f"{letter}.{correct_content}")
        else:
            new_options.append(f"{letter}.{wrong_contents[wrong_idx]}")
            wrong_idx += 1
    
    # 建立映射：原始选项内容 -> 新字母
    content_to_new_letter = {}
    for new_opt in new_options:
        letter = new_opt[0]
        content = new_opt[2:]
        content_to_new_letter[content] = letter
    
    # 重建analysis
    analysis = q['analysis']
    
    # 替换正确答案引用
    analysis = re.sub(rf'{original_answer}正确', f'{target_answer}正确', analysis)
    
    # 重建干扰项分析部分
    if '【干扰项分析】' in analysis:
        before_trap = analysis.split('【干扰项分析】')[0]
        original_trap = analysis.split('【干扰项分析】')[1]
        
        # 解析原始干扰项分析中的引用
        # 格式: X"内容"属于谬误类型
        original_refs = re.findall(r'([A-D])[\u201c"]([^"\u201d]+)[\u201d"]属于(\S+)', original_trap)
        
        # 将原始引用映射到新字母
        # 原始字母 -> 原始选项内容 -> 新字母
        orig_letter_to_content = {}
        for i, opt in enumerate(options):
            orig_letter_to_content[chr(ord('A')+i)] = opt[2:]
        
        new_trap_parts = []
        for orig_letter, content_snippet, fallacy in original_refs:
            # 跳过对原始正确答案的引用（如果有的话，属于原始bug）
            if orig_letter == original_answer:
                continue
            
            # 找到原始选项的完整内容
            orig_content = orig_letter_to_content.get(orig_letter, '')
            if not orig_content:
                continue
            
            # 找到这个内容在新选项中的新字母
            new_letter = content_to_new_letter.get(orig_content)
            if not new_letter:
                continue
            
            # 用原始内容的关键短语（因为内容可能被简化引用）
            key_phrase = extract_key_phrase(orig_content)
            new_trap_parts.append(f'{new_letter}\u201c{key_phrase}\u201d属于{fallacy}')
        
        # 如果原始干扰项分析无法解析，则生成新的
        if not new_trap_parts:
            fallacy_types = ['以偏概全', '偷换概念', '概念混淆', '无中生有', '极端推论']
            for j in range(3):
                wrong_letter = chr(ord('A') + j) if j < target_idx else chr(ord('A') + j + 1)
                wrong_content = content_to_new_letter.get(
                    [opt for opt in new_options if opt[0] == wrong_letter][0][2:] if 
                    any(opt[0] == wrong_letter for opt in new_options) else '', ''
                )
                for new_opt in new_options:
                    if new_opt[0] == wrong_letter:
                        key = extract_key_phrase(new_opt[2:])
                        fallacy = fallacy_types[j % len(fallacy_types)]
                        new_trap_parts.append(f'{wrong_letter}\u201c{key}\u201d属于{fallacy}')
                        break
        
        # 去重（同一字母可能出现多次引用）
        seen_letters = set()
        unique_parts = []
        for part in new_trap_parts:
            letter = part[0]
            if letter not in seen_letters:
                seen_letters.add(letter)
                unique_parts.append(part)
        
        new_trap = '；'.join(unique_parts) + '。'
        analysis = before_trap + '【干扰项分析】' + new_trap
    
    new_q = q.copy()
    new_q['options'] = new_options
    new_q['answer'] = target_answer
    new_q['analysis'] = analysis
    
    return new_q

# 处理所有题目
result = []
for i, q in enumerate(all_original):
    target = answer_assignments[i]
    new_q = rebuild_question_v2(q, target)
    result.append(new_q)

# 全面验证
print("\n=== 验证 ===")

# 1. 答案分布
dist = {}
for q in result:
    dist[q['answer']] = dist.get(q['answer'], 0) + 1
print(f"答案分布: {dist}")

# 2. 正确性验证：检查答案指向的选项内容是否合理
correctness_issues = 0
for q in result:
    ans = q['answer']
    correct_opt = None
    for opt in q['options']:
        if opt[0] == ans:
            correct_opt = opt[2:]
            break
    if not correct_opt:
        correctness_issues += 1
        continue
    
    # 基本检查：正确选项不应该包含明显的错误关键词
    wrong_keywords = ['不需要', '没关系', '无所谓', '只要不被发现', '不重要', '完全独立于中央', '不是中国的']
    for kw in wrong_keywords:
        if kw in correct_opt:
            # 排除一些合理的使用
            if '不是所有' not in correct_opt and '完全独立' not in correct_opt:
                correctness_issues += 1
                break

print(f"正确性检查: {correctness_issues}处潜在问题")

# 3. 干扰项分析引用检查
ref_issues = 0
for q in result:
    ans = q['answer']
    analysis = q['analysis']
    options = {opt[0]: opt[2:] for opt in q['options']}
    
    if '【干扰项分析】' not in analysis:
        ref_issues += 1
        continue
    trap = analysis.split('【干扰项分析】')[1]
    
    refs = re.findall(r'([A-D])\u201c([^\u201d]+)\u201d', trap)
    for ref_letter, ref_content in refs:
        if ref_letter == ans:
            ref_issues += 1
        else:
            actual = options.get(ref_letter, '')
            if actual and ref_content[:5] not in actual:
                ref_issues += 1

print(f"干扰项引用问题: {ref_issues}处")

# 4. 其他统计
diff = {}
for q in result:
    d = q['difficulty']
    k = '基础' if d <= 0.4 else ('提升' if d <= 0.6 else '拓展')
    diff[k] = diff.get(k, 0) + 1
print(f"难度分布: {diff}")

mod = {}
for q in result:
    m = q['module']
    mod[m] = mod.get(m, 0) + 1
print(f"模块分布: {mod}")

sit = sum(1 for q in result if '情境' in q['question'])
print(f"情境题: {sit}/120")

trap = sum(1 for q in result if '干扰项分析' in q['analysis'])
print(f"干扰项分析: {trap}/120")

ids = [q['id'] for q in result]
expected = [f"politics_choice_{str(i).zfill(3)}" for i in range(1, 121)]
print(f"ID连续性: {'✅' if ids == expected else '❌'}")

opt_ok = all(len(q['options']) == 4 for q in result)
print(f"选项数: {'✅' if opt_ok else '❌'}")

# 抽样展示
print("\n=== 抽样展示 ===")
for q in random.sample(result, 5):
    print(f"\n{q['id']}: answer={q['answer']}, ktag={q['knowledge_tag']}")
    for opt in q['options']:
        print(f"  {opt}")
    if '【干扰项分析】' in q['analysis']:
        trap = q['analysis'].split('【干扰项分析】')[1]
        print(f"  干扰项: {trap[:200]}")

# 保存
with open('src/data/questions_politics_choice.json', 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print(f"\n✅ 修复完成!")
