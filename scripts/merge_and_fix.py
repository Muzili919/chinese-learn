#!/usr/bin/env python3
"""合并4个模块并做答案分布后处理"""
import json, random

random.seed(12345)

# 读取4个模块
modules = ['_module_xflaw.json', '_module_ddxl.json', '_module_gqgc.json', '_module_shsh.json']
all_q = []
for mod in modules:
    with open(f'src/data/{mod}', 'r', encoding='utf-8') as f:
        qs = json.load(f)
    all_q.extend(qs)
    print(f"{mod}: {len(qs)}题")

print(f"\n合并后总题数: {len(all_q)}")

# 策略：通过重新排列选项顺序来改变正确答案的字母
# 目标：ABCD各约30题
target_dist = {'A': 30, 'B': 30, 'C': 30, 'D': 30}
current_dist = {}
for q in all_q:
    a = q['answer']
    current_dist[a] = current_dist.get(a, 0) + 1
print(f"当前答案分布: {current_dist}")

# 对每道题随机打乱选项顺序
# 但要保持analysis中的干扰项分析对应正确
# 简化方案：只改变选项排列，同步更新answer和analysis

def shuffle_question(q, target_answer):
    """将题目选项打乱，使正确答案变为target_answer"""
    options = q['options'][:]  # 复制
    
    # 找到当前正确选项的索引
    correct_idx = None
    for i, opt in enumerate(options):
        if opt.startswith(f"{q['answer']}."):
            correct_idx = i
            break
    if correct_idx is None:
        return q  # 找不到就跳过
    
    # 找到目标字母对应的索引 (A=0, B=1, C=2, D=3)
    target_idx = ord(target_answer) - ord('A')
    
    # 如果已经在目标位置就不变
    if correct_idx == target_idx:
        return q
    
    # 交换选项位置
    options[correct_idx], options[target_idx] = options[target_idx], options[correct_idx]
    
    # 更新选项字母前缀
    new_options = []
    for i, opt in enumerate(options):
        # 去掉原字母前缀
        content = opt[2:]  # 去掉 "X."
        new_options.append(f"{chr(ord('A')+i)}.{content}")
    
    # 更新题目
    new_q = q.copy()
    new_q['options'] = new_options
    new_q['answer'] = target_answer
    
    # analysis中的答案引用也需要更新
    # 主要是 "X正确" 这样的引用
    analysis = q['analysis']
    analysis = analysis.replace(f"{q['answer']}正确", f"{target_answer}正确")
    new_q['analysis'] = analysis
    
    return new_q

# 计算需要的分布
total = len(all_q)
per_letter = total // 4  # 30

# 将所有题的目标答案分配好
# 简单方案：按顺序循环分配ABCD
answer_queue = ['A'] * per_letter + ['B'] * per_letter + ['C'] * per_letter + ['D'] * per_letter
# 如果有余数，分配给前面的字母
remainder = total - len(answer_queue)
for i in range(remainder):
    answer_queue.append(chr(ord('A') + i))

random.shuffle(answer_queue)

# 应用打乱
result = []
for i, q in enumerate(all_q):
    target = answer_queue[i]
    new_q = shuffle_question(q, target)
    result.append(new_q)

# 验证最终分布
final_dist = {}
for q in result:
    a = q['answer']
    final_dist[a] = final_dist.get(a, 0) + 1
print(f"处理后答案分布: {final_dist}")

# 验证难度分布
diff_dist = {}
for q in result:
    d = q['difficulty']
    if d <= 0.4: k = '基础(0.3-0.4)'
    elif d <= 0.6: k = '提升(0.5-0.6)'
    else: k = '拓展(0.7+)'
    diff_dist[k] = diff_dist.get(k, 0) + 1
print(f"难度分布: {diff_dist}")

# 验证模块分布
mod_dist = {}
for q in result:
    m = q['module']
    mod_dist[m] = mod_dist.get(m, 0) + 1
print(f"模块分布: {mod_dist}")

# 验证情境题
sit_count = sum(1 for q in result if '情境' in q['question'])
print(f"情境题数: {sit_count}/{len(result)}")

# 验证干扰项分析
trap_count = sum(1 for q in result if '干扰项分析' in q['analysis'])
print(f"含干扰项分析: {trap_count}/{len(result)}")

# 验证必填字段
required = ['id','subject','grade','module','knowledge_tag','ability_tag','type','question','options','answer','analysis','core_trap','mnemonic','difficulty']
missing = 0
for q in result:
    for f2 in required:
        if f2 not in q or q[f2] is None or q[f2] == '':
            missing += 1
print(f"缺失字段: {missing}处")

# 验证ID连续性
ids = [q['id'] for q in result]
expected = [f"politics_choice_{str(i).zfill(3)}" for i in range(1, 121)]
if ids == expected:
    print("ID连续性: ✅")
else:
    print(f"ID不连续! 期望{expected[0]}~{expected[-1]}")
    # 找出缺失
    id_set = set(ids)
    for eid in expected:
        if eid not in id_set:
            print(f"  缺失: {eid}")

# 验证选项数
opt_issues = [q['id'] for q in result if len(q['options']) != 4]
if opt_issues:
    print(f"选项数异常: {opt_issues[:5]}")
else:
    print("选项数: 全部4个 ✅")

# 保存
with open('src/data/questions_politics_choice.json', 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print(f"\n✅ 最终文件已保存: src/data/questions_politics_choice.json")
