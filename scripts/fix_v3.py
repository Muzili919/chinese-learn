#!/usr/bin/env python3
"""
最终修复v3：为每道题完全重新生成干扰项分析，不依赖原始引用
"""
import json, random, re

random.seed(333444)

# 读取原始模块文件
modules_files = ['_module_xflaw.json', '_module_ddxl.json', '_module_gqgc.json', '_module_shsh.json']
all_original = []
for mod in modules_files:
    with open(f'src/data/{mod}', 'r', encoding='utf-8') as f:
        all_original.extend(json.load(f))

# 谬误类型池（按优先级排列）
FALLACY_POOL = [
    '以偏概全', '偷换概念', '概念混淆', '无中生有', '极端推论', 
    '道德绑架', '因果倒置', '归因错误'
]

def extract_key_phrase(content):
    """从选项内容中提取关键短语"""
    if len(content) <= 25:
        return content
    for sep in ['，', '。']:
        idx = content.find(sep)
        if 4 < idx < 30:
            return content[:idx]
    return content[:20]

def generate_fresh_trap(q, new_options, correct_answer):
    """完全重新生成干扰项分析"""
    wrong_opts = [(opt[0], opt[2:]) for opt in new_options if opt[0] != correct_answer]
    
    parts = []
    used_fallacies = set()
    
    for letter, content in wrong_opts:
        key = extract_key_phrase(content)
        
        # 根据内容特征智能分配谬误类型
        if '只要' in content and ('就' in content or '都' in content):
            fallacy = '极端推论'
        elif '应该' in content and ('完全' in content or '全部' in content):
            fallacy = '以偏概全'
        elif '都是' in content or '全部' in content or '所有' in content:
            fallacy = '以偏概全'
        elif '不影响' in content or '没关系' in content or '不重要' in content:
            fallacy = '偷换概念'
        elif '不可能' in content or '永远' in content or '绝对' in content:
            fallacy = '极端推论'
        elif '只有' in content and ('才' in content or '就' in content):
            fallacy = '以偏概全'
        elif '就是' in content and ('等于' in content or '意味着' in content):
            fallacy = '概念混淆'
        else:
            # 选择一个未使用的谬误类型
            available = [f for f in FALLACY_POOL if f not in used_fallacies]
            fallacy = available[0] if available else random.choice(FALLACY_POOL)
        
        used_fallacies.add(fallacy)
        parts.append(f'{letter}\u201c{key}\u201d属于{fallacy}')
    
    return '；'.join(parts) + '。'

# 答案分配
answer_assignments = []
for letter in ['A','B','C','D']:
    answer_assignments.extend([letter] * 30)
random.shuffle(answer_assignments)

result = []

for i, q in enumerate(all_original):
    target = answer_assignments[i]
    original_answer = q['answer']
    options = q['options'][:]
    
    # 找到原始正确选项
    correct_idx = ord(original_answer) - ord('A')
    correct_content = options[correct_idx][2:]
    
    # 收集错误选项
    wrong_contents = []
    for j, opt in enumerate(options):
        if j != correct_idx:
            wrong_contents.append(opt[2:])
    
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
    
    # 重建analysis：保留考点和解题思路，替换答案引用，重新生成干扰项分析
    analysis = q['analysis']
    
    # 分割考点/思路和干扰项分析
    if '【干扰项分析】' in analysis:
        before_trap = analysis.split('【干扰项分析】')[0].rstrip()
        # 清理末尾的分号
        while before_trap.endswith('；') or before_trap.endswith(';'):
            before_trap = before_trap[:-1]
    else:
        before_trap = analysis.rstrip()
    
    # 替换答案引用
    before_trap = re.sub(rf'{original_answer}正确', f'{target}正确', before_trap)
    
    # 生成全新干扰项分析
    new_trap = generate_fresh_trap(q, new_options, target)
    
    new_analysis = f"{before_trap}\n【干扰项分析】{new_trap}"
    
    new_q = q.copy()
    new_q['options'] = new_options
    new_q['answer'] = target
    new_q['analysis'] = new_analysis
    
    result.append(new_q)

# === 全面验证 ===
print("="*50)
print("全面验证")
print("="*50)

# 1. 答案分布
dist = {}
for q in result: dist[q['answer']] = dist.get(q['answer'], 0) + 1
print(f"答案分布: {dist}")

# 2. 正确答案内容验证
wrong_ans = 0
for q in result:
    ans = q['answer']
    for opt in q['options']:
        if opt[0] == ans:
            content = opt[2:]
            # 正确答案不应包含明显错误关键词
            bad = ['不属于', '不是', '不应该', '不需要', '不正确', '不享有']
            if any(b in content for b in bad):
                # 排除合理否定
                if '不等于' not in content and '不同于' not in content and '不是所有' not in content:
                    wrong_ans += 1
            break
print(f"正确答案内容检查: {wrong_ans}处可疑")

# 3. 干扰项分析引用验证（最重要）
ref_issues = 0
for q in result:
    ans = q['answer']
    analysis = q['analysis']
    options = {opt[0]: opt[2:] for opt in q['options']}
    
    if '【干扰项分析】' not in analysis:
        ref_issues += 1
        continue
    trap = analysis.split('【干扰项分析】')[1]
    
    # 找所有引用
    refs = re.findall(r'([A-D])\u201c([^\u201d]+)\u201d', trap)
    
    # 检查：不能引用正确答案
    for ref_letter, ref_content in refs:
        if ref_letter == ans:
            ref_issues += 1
            continue
        # 检查引用内容是否在实际选项中
        actual = options.get(ref_letter, '')
        if actual and ref_content[:5] not in actual:
            ref_issues += 1
    
    # 检查：所有3个错误选项都应该被引用
    wrong_letters = set(chr(ord('A')+i) for i in range(4)) - {ans}
    referenced_letters = set(r[0] for r in refs)
    if not wrong_letters.issubset(referenced_letters):
        ref_issues += 1

print(f"干扰项引用问题: {ref_issues}处")

# 4. 难度分布
diff = {}
for q in result:
    d = q['difficulty']
    k = '基础' if d <= 0.4 else ('提升' if d <= 0.6 else '拓展')
    diff[k] = diff.get(k, 0) + 1
print(f"难度分布: {diff}")

# 5. 模块分布
mod = {}
for q in result: mod[q['module']] = mod.get(q['module'], 0) + 1
print(f"模块分布: {mod}")

# 6. 情境题
sit = sum(1 for q in result if '情境' in q['question'])
print(f"情境题: {sit}/120")

# 7. 干扰项分析覆盖
trap = sum(1 for q in result if '干扰项分析' in q['analysis'])
print(f"干扰项分析: {trap}/120")

# 8. ID连续性
ids = [q['id'] for q in result]
expected = [f"politics_choice_{str(i).zfill(3)}" for i in range(1, 121)]
print(f"ID连续性: {'✅' if ids == expected else '❌'}")

# 9. 选项数
print(f"选项数: {'✅' if all(len(q['options']) == 4 for q in result) else '❌'}")

# 10. 重复
qs_set = set(q['question'].replace(' ','') for q in result)
print(f"无重复: {'✅' if len(qs_set) == 120 else '❌'}")

# 11. 必填字段
required = ['id','subject','grade','module','knowledge_tag','ability_tag','type','question','options','answer','analysis','core_trap','mnemonic','difficulty']
missing = sum(1 for q in result for f in required if f not in q or not q[f])
print(f"必填字段: {'✅ 无缺失' if missing == 0 else f'❌ {missing}处缺失'}")

# 最终抽样
print("\n=== 最终抽样 ===")
samples = random.sample(result, 5)
for q in samples:
    print(f"\n{q['id']}: answer={q['answer']}")
    for opt in q['options']:
        print(f"  {opt}")
    if '【干扰项分析】' in q['analysis']:
        print(f"  {q['analysis'].split('【干扰项分析】')[1][:150]}")

# 保存
with open('src/data/questions_politics_choice.json', 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)
print(f"\n✅ 最终文件已保存!")
