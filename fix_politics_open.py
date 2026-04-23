#!/usr/bin/env python3
"""将政治 open_ended 题转为 single_choice"""

import json, re, random

random.seed(42)
DATA = 'src/data'

def load(name):
    with open(f'{DATA}/{name}', encoding='utf-8') as f:
        return json.load(f)

def save(name, data):
    with open(f'{DATA}/{name}', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f'  ✓ {name}: {len(data)}题')

# ═══════════════════════════════════════════════════════════════
# politics_analysis: 20道材料分析 → 选择题
# ═══════════════════════════════════════════════════════════════
print('=== politics_analysis ===')
pa = load('questions_politics_analysis.json')
new_pa = []
sc = 0

# 通用干扰项池（政治学科常见错误表述）
WRONG_STATEMENTS = [
    '这种做法侵犯了公民的隐私权',
    '只要不违法就可以随意行使权利',
    '未成年人不需要承担法律责任',
    '公民的基本权利是绝对不受限制的',
    '这种说法违反了社会主义核心价值观',
    '公民在法律面前人人平等但可以有例外',
    '只要出发点是好的就不需要遵守法律程序',
    '个人的自由权利不受任何约束',
    '这种行为属于正当防卫不需要承担责任',
    '未成年人的违法行为不需要受到处罚',
]

RIGHT_STATEMENTS = [
    '公民在法律面前一律平等',
    '任何公民享有宪法和法律规定的权利同时必须履行义务',
    '未成年人同样受法律保护和约束',
    '宪法是国家的根本法具有最高法律效力',
    '公民行使权利不得损害其他公民的合法权利',
    '法律面前人人平等是宪法的基本原则',
    '权利和义务是相互依存不可分割的',
    '公民的合法权利受法律保护',
    '遵守法律是每个公民的基本义务',
    '受教育既是权利也是义务',
]

for q in pa:
    ans_text = q.get('answer', '')
    qtext = q.get('question', '')
    
    # 从答案中提取【参考答案】和【踩分点】
    ref_answers = re.findall(r'【参考答案】(.+?)(?=【|$)', ans_text, re.DOTALL)
    key_points = re.findall(r'【踩分点】(.+?)(?=【|$)', ans_text, re.DOTALL)
    
    # 提取每小题
    sub_qs = re.findall(r'[（(](\d+)[）)]\s*(.+?)(?=[（(]\d+[）)]|$)', qtext, re.DOTALL)
    sub_as = re.findall(r'[（(](\d+)[）)]\s*(.+?)(?=[（(]\d+[）)]|$)', ans_text, re.DOTALL)
    
    if not sub_qs:
        sub_qs = [('1', qtext)]
    if not sub_as:
        sub_as = [('1', ans_text)]
    
    for num, sq_text in sub_qs:
        # 找对应答案
        sa_text = ''
        for an, at in sub_as:
            if an == num:
                sa_text = at
                break
        if not sa_text:
            sa_text = ans_text
        
        # 清理答案文本
        sa_clean = sa_text.replace('【参考答案】', '').replace('【踩分点】', '').strip()
        # 提取第一句话作为正确选项
        sentences = re.split(r'[。；]', sa_clean)
        correct = sentences[0].strip().lstrip('①②③④')
        if len(correct) > 60:
            correct = correct[:60] + '...'
        if not correct:
            correct = sa_clean[:60]
        
        # 生成干扰项
        dists = []
        pool = RIGHT_STATEMENTS + WRONG_STATEMENTS
        random.shuffle(pool)
        for s in pool:
            if s != correct and len(dists) < 3:
                dists.append(s)
        
        # 简化题面（只取前100字作为情境）
        q_short = sq_text.strip()[:150]
        if len(sq_text) > 150:
            q_short += '...'
        
        options = [correct] + dists
        random.shuffle(options)
        idx = options.index(correct)
        labels = ['A', 'B', 'C', 'D']
        
        new_q = {
            'id': f'{q["id"]}_sub{num}',
            'type': 'single_choice',
            'question': f'根据以下情境，选择最正确的说法：\n{q_short}',
            'options': [f'{labels[i]}. {options[i]}' for i in range(4)],
            'answer': f'{labels[idx]}. {correct}',
            'analysis': sa_clean[:300],
            'difficulty': q.get('difficulty', 2),
            'knowledge_tag': q.get('knowledge_tag', '道德与法治'),
            'ability_tag': q.get('ability_tag', '材料分析'),
        }
        new_pa.append(new_q)
        sc += 1

print(f'  removed {len(pa)} open_ended, added {sc} single_choice')
save('questions_politics_analysis.json', new_pa)

# ═══════════════════════════════════════════════════════════════
# politics_answer: 80道情境简答 → 选择题
# ═══════════════════════════════════════════════════════════════
print('\n=== politics_answer ===')
psa = load('questions_politics_answer.json')
new_psa = []
sc2 = 0

for q in psa:
    ans_text = q.get('answer', '')
    qtext = q.get('question', '')
    
    # 提取答案中的要点
    points = re.findall(r'[（(](\d+)[）)]\s*(.+?)(?=[（(]\d+[）)]|$)', ans_text, re.DOTALL)
    if not points:
        # 用句号分
        points = [(str(i+1), s.strip()) for i, s in enumerate(ans_text.split('。')) if s.strip()]
    
    if not points:
        continue
    
    # 取第一个要点作为正确答案
    correct = points[0][1].strip()
    if len(correct) > 60:
        correct = correct[:60] + '...'
    
    # 干扰项
    dists = []
    pool = RIGHT_STATEMENTS + WRONG_STATEMENTS
    random.shuffle(pool)
    for s in pool:
        if s != correct and len(dists) < 3:
            dists.append(s)
    
    # 简化题面
    q_short = qtext.strip()[:150]
    if len(qtext) > 150:
        q_short += '...'
    
    options = [correct] + dists
    random.shuffle(options)
    idx = options.index(correct)
    labels = ['A', 'B', 'C', 'D']
    
    new_q = {
        'id': f'{q["id"]}_sc',
        'type': 'single_choice',
        'question': f'根据以下情境，选择最正确的说法：\n{q_short}',
        'options': [f'{labels[i]}. {options[i]}' for i in range(4)],
        'answer': f'{labels[idx]}. {correct}',
        'analysis': ans_text[:300],
        'difficulty': q.get('difficulty', 2),
        'knowledge_tag': q.get('knowledge_tag', '道德与法治'),
        'ability_tag': q.get('ability_tag', '情境分析'),
    }
    new_psa.append(new_q)
    sc2 += 1

print(f'  removed {len(psa)} open_ended, added {sc2} single_choice')
save('questions_politics_answer.json', new_psa)

# ═══════════════════════════════════════════════════════════════
# 验证
# ═══════════════════════════════════════════════════════════════
print('\n=== 验证 ===')
for f in ['questions_politics_analysis.json', 'questions_politics_answer.json']:
    data = load(f)
    types = {}
    bad = 0
    for q in data:
        t = q.get('type', '?')
        types[t] = types.get(t, 0) + 1
        if t == 'single_choice':
            ans = q.get('answer', '')
            opts = q.get('options', [])
            if ans not in opts:
                bad += 1
                if bad <= 3:
                    print(f'  ⚠️ {f} | {q["id"]}: ans not in opts')
    print(f'  {f}: {types}, bad answers: {bad}')

# 全局验证初中 open_ended
print('\n=== 全局初中 open_ended 检查 ===')
import glob
total_oe = 0
for f in sorted(glob.glob(f'{DATA}/questions_*.json')):
    name = f.split('/')[-1]
    is_junior = any(k in name for k in ['junior', 'math_junior', 'politics'])
    if not is_junior:
        continue
    data = json.load(open(f, encoding='utf-8'))
    oe = [q for q in data if q.get('type') == 'open_ended']
    if oe:
        print(f'  ⚠️ {name}: {len(oe)} open_ended')
        total_oe += len(oe)
print(f'总剩余 open_ended: {total_oe}')

