#!/usr/bin/env python3
"""语法题库120道完整校验脚本（修复后复查）"""
import json
from collections import Counter

with open('src/data/questions_en_j2_grammar.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

q_by_num = {q['id'].split('_')[-1]: q for q in data}

issues = []
warnings = []

# ============================================================
# 1. 字段完整性
# ============================================================
required = ['id', 'subject', 'grade', 'knowledge_tag', 'ability_tag', 'type',
            'question', 'answer', 'analysis', 'core_trap', 'mnemonic', 'difficulty']
for q in data:
    for field in required:
        if field not in q:
            issues.append(('P0', q['id'], f'缺少字段: {field}'))
    if q['type'] == 'multiple_choice' and 'options' not in q:
        issues.append(('P0', q['id'], '选择题缺少options字段'))
    if q['difficulty'] < 0.2 or q['difficulty'] > 1.0:
        warnings.append((q['id'], f'difficulty={q["difficulty"]} 超出合理范围'))

# ============================================================
# 2. 选项与答案一致性
# ============================================================
for q in data:
    if q['type'] != 'multiple_choice':
        continue
    opts = q.get('options', [])
    ans = q['answer']
    opt_prefixes = set()
    for opt in opts:
        if opt and opt[0] in 'ABCD':
            opt_prefixes.add(opt[0])
    if ans not in opt_prefixes and len(opt_prefixes) > 0:
        issues.append(('P0', q['id'], f'答案{ans}不在选项中, 选项前缀={opt_prefixes}'))
    if len(opts) != 4:
        issues.append(('P1', q['id'], f'选项数量={len(opts)}，应为4'))

# ============================================================
# 3. 逐题答案正确性验证
# ============================================================
def check_mc(num, expected_text):
    q = q_by_num[num]
    opts = {o[0]: o[2:].strip() for o in q['options']}
    actual = opts.get(q['answer'], '')
    if actual != expected_text:
        issues.append(('P0', num, f'答案错误: 期望"{expected_text}", 实际="{actual}"'))

def check_fill(num, expected_answer):
    q = q_by_num[num]
    if q['answer'] != expected_answer:
        issues.append(('P0', num, f'答案错误: 期望"{expected_answer}", 实际="{q["answer"]}"'))

# 一般过去时 (001-020)
check_mc('001', "didn't go")
check_mc('002', 'sang')
check_fill('003', 'lost; couldn\'t; Have; found')
check_mc('004', 'stopped flying')
check_fill('005', 'went')
check_mc('006', 'Did; did')
check_mc('007', 'was doing; was singing; went')
check_fill('008', 'Did; visit')
check_mc('009', 'finished')
check_mc('010', 'would be held')  # 宾语从句+被动综合
check_mc('011', 'were')
check_fill('012', "didn't do")
check_mc('013', 'fell')
check_mc('014', 'has he')  # hardly→前否后肯
check_fill('015', 'bought')  # yesterday morning已修
check_mc('016', 'study; can get')  # 主将从现+情态动词综合
check_mc('017', 'Where')
check_mc('018', 'got up; had')
check_fill('019', 'lived')
check_mc('020', 'did; buy; bought; have had')  # 完成时与过去时辨析

# 一般将来时 (021-035)
check_mc('021', 'will')
check_mc('022', 'will be discussed; will be solved')  # 将来时被动综合
check_mc('023', 'is going to')
check_fill('024', "won't come")
check_mc('025', 'Will')
check_mc('026', "aren't")
check_mc('027', 'will')
check_fill('028', 'will be')
check_mc('029', 'will get')
check_mc('030', 'will call')
check_mc('031', 'are going to')
check_fill('032', 'Is; going to go')
check_mc('033', 'will be held')
check_mc('034', "can't; may")  # 情态动词推测综合
check_mc('035', 'do')

# 现在进行时/过去进行时 (036-045)
check_mc('036', 'was doing')
check_mc('037', 'were watching')
check_fill('038', 'are playing')
check_mc('039', "wasn't watching")
check_mc('040', 'was cooking')
check_mc('041', 'when the train will leave')  # 宾语从句综合
check_fill('042', 'Were; studying')
check_mc('043', 'When')  # when+过去时came
check_mc('044', 'was reading; was')
check_mc('045', 'How; had better')  # 感叹句+情态动词综合

# 现在完成时 (046-060)
check_mc('046', 'since')
check_mc('047', 'unless; have learned')  # unless+完成时综合
check_mc('048', 'yet; already')
check_mc('049', 'ever')  # 已改为疑问句
check_mc('050', 'gone to')
check_mc('051', 'He was seen to steal the car.')  # 感官动词被动
check_fill('052', 'written')
check_mc('053', 'yet')
check_mc('054', 'lost')
check_mc('055', 'Have; tried')
check_mc('056', 'since')
check_fill('057', 'eaten')
check_mc('058', 'been in')
check_mc('059', 'bought; have read')
check_mc('060', 'never')

# 被动语态 (061-075)
check_mc('061', 'is spoken')
check_mc('062', 'was built')
check_mc('063', 'was broken')
check_fill('064', 'will be built')
check_mc('065', 'can be')
check_mc('066', 'has been cleaned')
check_mc('067', 'is not written')
check_fill('068', 'is spoken')
check_mc('069', 'has been used; are treated')  # 完成时被动+现在时被动
check_mc('070', 'is being built')
check_mc('071', 'should be planted')
check_mc('072', 'was written')
check_fill('073', 'Was; finished')
check_mc('074', 'was given to')
check_mc('075', 'clean')  # 主动make sb do

# 情态动词 (076-090)
check_mc('076', 'May; can; must')  # 三空综合
check_mc('077', 'must')
check_mc('078', 'May')
check_mc('079', 'must')  # 肯定推测
check_mc('080', "can't")  # 否定推测
check_fill('081', 'should listen')  # P0修复验证
check_mc('082', 'need')
check_mc('083', 'not eat')
check_mc('084', 'Could')
check_mc('085', 'might')
check_fill('086', 'have to finish')  # P0修复验证
check_mc('087', "needn't")
check_fill('088', 'was reading; called; had lost; could; haven\'t seen')  # 多时态综合0.8
check_mc('089', 'get')
check_mc('090', 'must')  # must have done 拓展0.7

# 宾语从句 (091-105)
check_mc('091', 'that')
check_mc('092', 'whether')
check_mc('093', 'where he lives')
check_fill('094', 'when')
check_mc('095', 'would go')
check_mc('096', 'what your name is')
check_mc('097', 'moves')  # 客观真理
check_mc('098', 'if')
check_fill('099', 'whose')
check_mc('100', 'has finished')
check_mc('101', 'can get')
check_mc('102', 'went')
check_fill('103', 'what')
check_mc('104', 'whether')
check_mc('105', 'there are')

# 条件/时间状语从句 (106-110)
check_mc('106', 'rains')
check_mc('107', 'arrive')
check_fill('108', 'studies')
check_mc('109', 'unless')
check_mc('110', 'comes')

# 感叹句 (111-115)
check_mc('111', 'What a')
check_mc('112', 'How')
check_mc('113', 'What')
check_fill('114', 'How')
check_mc('115', 'How')

# 反意疑问句 (116-120)
check_mc('116', "isn't he")
check_mc('117', 'does she')
check_mc('118', 'has he')
check_fill('119', 'shall we')
check_mc('120', "aren't I")

# ============================================================
# 4. P0修复专项验证
# ============================================================
# 049: ever疑问句
q49 = q_by_num['049']
if 'Have you' not in q49['question']:
    issues.append(('P0', '049', 'P0未修复: 题目未改为疑问句'))
if '肯定句' in q49['analysis'] and '疑问句' not in q49['analysis']:
    issues.append(('P1', '049', '解析中仍有肯定句相关内容'))

# 081: 去掉括号答案
q81 = q_by_num['081']
if '(should)' in q81['question']:
    issues.append(('P0', '081', 'P0未修复: 括号仍包含答案should'))

# 086: 去掉括号答案
q86 = q_by_num['086']
if '(have to)' in q86['question']:
    issues.append(('P0', '086', 'P0未修复: 括号仍包含答案have to'))

# 015: yesterday morning
q15 = q_by_num['015']
if 'yesterday morning' not in q15['question']:
    issues.append(('P2', '015', 'P2未修复: this morning未改为yesterday morning'))

# 090: 难度0.7
q90 = q_by_num['090']
if q90['difficulty'] < 0.65:
    issues.append(('P2', '090', f'P2未修复: must have done难度应为0.7, 实际={q90["difficulty"]}'))

# ============================================================
# 5. 答案分布
# ============================================================
answers = Counter()
for q in data:
    if q['type'] == 'multiple_choice':
        answers[q['answer']] += 1
total_mc = sum(answers.values())
print("=== 答案分布 ===")
for k in ['A', 'B', 'C', 'D']:
    v = answers.get(k, 0)
    pct = v / total_mc * 100
    status = "✅" if 20 <= pct <= 30 else "⚠️"
    print(f"  {k}: {v} ({pct:.1f}%) {status}")

# ============================================================
# 6. 难度分布
# ============================================================
diffs = {'基础(<0.45)': 0, '提升(0.45-0.64)': 0, '拓展(0.65+)': 0}
for q in data:
    d = q['difficulty']
    if d < 0.45:
        diffs['基础(<0.45)'] += 1
    elif d <= 0.64:
        diffs['提升(0.45-0.64)'] += 1
    else:
        diffs['拓展(0.65+)'] += 1
print("\n=== 难度分布 ===")
for k, v in diffs.items():
    print(f"  {k}: {v}")

# ============================================================
# 7. 知识点覆盖
# ============================================================
print("\n=== 知识点覆盖 ===")
tags = {}
for q in data:
    tag = q['knowledge_tag']
    tags[tag] = tags.get(tag, 0) + 1
for tag, count in sorted(tags.items()):
    print(f"  {tag}: {count}")

# ============================================================
# 8. ID连续性
# ============================================================
ids = sorted([int(q['id'].split('_')[-1]) for q in data])
expected = list(range(1, 121))
if ids != expected:
    missing = set(expected) - set(ids)
    extra = set(ids) - set(expected)
    if missing:
        issues.append(('P1', 'ID', f'缺失题号: {sorted(missing)}'))
    if extra:
        issues.append(('P1', 'ID', f'多余题号: {sorted(extra)}'))

# ============================================================
# 输出结果
# ============================================================
print(f"\n{'='*50}")
print(f"总题数: {len(data)}")

p0 = [i for i in issues if i[0] == 'P0']
p1 = [i for i in issues if i[0] == 'P1']
p2 = [i for i in issues if i[0] == 'P2']

print(f"\n🔴 P0 (必须修复): {len(p0)}个")
for sev, num, desc in p0:
    print(f"  [{num}] {desc}")

print(f"\n🟡 P1 (建议修复): {len(p1)}个")
for sev, num, desc in p1:
    print(f"  [{num}] {desc}")

print(f"\n🟢 P2 (小问题): {len(p2)}个")
for sev, num, desc in p2:
    print(f"  [{num}] {desc}")

print(f"\n⚠️ 警告: {len(warnings)}个")
for num, desc in warnings:
    print(f"  [{num}] {desc}")

if not issues and not warnings:
    print("\n✅ 全部120题通过校验，无任何问题！")
elif not p0:
    print(f"\n✅ 无P0级问题！共{len(p1)}个P1 + {len(p2)}个P2待考虑")
else:
    print(f"\n❌ 有{len(p0)}个P0级问题需要立即修复！")
