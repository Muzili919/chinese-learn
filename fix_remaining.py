#!/usr/bin/env python3
"""修复剩余 open_ended 和缺失 type 的题目"""

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
# 1. en_writing: 7道连词成句 → 选择题
# ═══════════════════════════════════════════════════════════════
print('=== en_writing (小学) ===')
enw = load('questions_en_writing.json')
new_enw = []

for q in enw:
    ans = q.get('answer', '').strip().rstrip('.')
    qtext = q.get('question', '')
    
    # 生成干扰项（语序打乱）
    words = re.findall(r'[a-zA-Z]+', qtext.split('\n')[0] if '\n' in qtext else qtext)
    
    distractors = []
    if words and len(words) >= 3:
        # 打乱语序
        shuffled = words.copy()
        for _ in range(3):
            random.shuffle(shuffled)
            d = ' '.join(shuffled).capitalize() + '.'
            if d != ans and d not in distractors:
                distractors.append(d)
    
    # 补充通用干扰项
    generic = [
        'The words are in wrong order.',
        'This cannot form a sentence.',
        'Please rearrange the words.',
    ]
    while len(distractors) < 3:
        g = generic[len(distractors)]
        if g != ans:
            distractors.append(g)
    
    options = [ans] + distractors[:3]
    random.shuffle(options)
    idx = options.index(ans)
    labels = ['A', 'B', 'C', 'D']
    
    new_q = {
        'id': q['id'],
        'type': 'single_choice',
        'question': qtext,
        'options': [f'{labels[i]}. {options[i]}' for i in range(4)],
        'answer': f'{labels[idx]}. {ans}',
        'analysis': f'正确语序：{ans}',
        'difficulty': q.get('difficulty', 0.3),
        'knowledge_tag': q.get('knowledge_tag', '连词成句'),
        'ability_tag': q.get('ability_tag', '句子重组'),
    }
    new_enw.append(new_q)

print(f'  converted {len(enw)} open_ended → {len(new_enw)} single_choice')
save('questions_en_writing.json', new_enw)

# ═══════════════════════════════════════════════════════════════
# 2. en_j2_writing: 30道连词成句/翻译 → 选择题
# ═══════════════════════════════════════════════════════════════
print('\n=== en_j2_writing (初中) ===')
enj2w = load('questions_en_j2_writing.json')
new_enj2w = []

for q in enj2w:
    ans = q.get('answer', '').strip()
    qtext = q.get('question', '')
    
    if '连词成句' in qtext:
        # 连词成句：打乱语序作为干扰项
        words_line = [l for l in qtext.split('\n') if l.strip() and not l.strip().startswith('连词') and not l.strip().startswith('_')]
        words = []
        for line in words_line:
            words.extend(re.findall(r'[a-zA-Z]+', line))
        
        distractors = []
        if words and len(words) >= 3:
            shuffled = words.copy()
            for _ in range(5):
                random.shuffle(shuffled)
                d = ' '.join(shuffled)
                # 首字母大写
                if d:
                    d = d[0].upper() + d[1:]
                if not d.endswith('.'):
                    d += '.'
                if d != ans and d not in distractors:
                    distractors.append(d)
        
        while len(distractors) < 3:
            distractors.append(f'Wrong order {len(distractors)+1}.')
    
    elif '翻译' in qtext or 'Translate' in qtext.lower():
        # 翻译题：用相似的翻译做干扰项
        distractors = [
            'This translation is not accurate.',
            'The meaning is completely different.',
            'The grammar structure is wrong.',
        ]
    else:
        # 其他写作题
        distractors = [
            'The sentence structure is incorrect.',
            'This is not a complete sentence.',
            'The word order is wrong.',
        ]
    
    options = [ans] + distractors[:3]
    while len(options) < 4:
        options.append(f'干扰项{len(options)}')
    random.shuffle(options)
    idx = options.index(ans)
    labels = ['A', 'B', 'C', 'D']
    
    new_q = {
        'id': q['id'],
        'type': 'single_choice',
        'question': qtext,
        'options': [f'{labels[i]}. {options[i]}' for i in range(4)],
        'answer': f'{labels[idx]}. {ans}',
        'analysis': f'正确答案：{ans}',
        'difficulty': q.get('difficulty', 0.5),
        'knowledge_tag': q.get('knowledge_tag', '写作'),
        'ability_tag': q.get('ability_tag', '句子重组'),
    }
    new_enj2w.append(new_q)

print(f'  converted {len(enj2w)} open_ended → {len(new_enj2w)} single_choice')
save('questions_en_j2_writing.json', new_enj2w)

# ═══════════════════════════════════════════════════════════════
# 3. reading: 32道阅读理解 → 选择题
# ═══════════════════════════════════════════════════════════════
print('\n=== reading (小学阅读) ===')
reading = load('questions_reading.json')
new_reading = []
rsc = 0

for q in reading:
    if q.get('type') != 'open_ended':
        new_reading.append(q)
        continue
    
    ans = q.get('answer', '').strip()
    qtext = q.get('question', '')
    
    # 生成干扰项
    distractors = []
    
    # 策略1：反转意思
    if '不' in ans:
        d = ans.replace('不', '')
        if d != ans:
            distractors.append(d)
    elif '没有' in ans:
        d = ans.replace('没有', '有')
        if d != ans:
            distractors.append(d)
    
    # 策略2：加"不是"/"并没有"
    if len(distractors) < 3:
        if '是' in ans and '不是' not in ans:
            d = ans.replace('是', '不是', 1)
            if d != ans:
                distractors.append(d)
        elif '了' in ans:
            d = ans.replace('了', '没', 1)
            if d != ans:
                distractors.append(d)
    
    # 策略3：通用干扰项
    generic = [
        '这段话主要描写了自然景物',
        '作者表达了悲伤的情感',
        '文章的标题应该是"我的梦想"',
    ]
    for g in generic:
        if len(distractors) < 3 and g != ans:
            distractors.append(g)
    
    options = [ans] + distractors[:3]
    while len(options) < 4:
        options.append(f'其他答案{len(options)}')
    random.shuffle(options)
    idx = options.index(ans)
    labels = ['A', 'B', 'C', 'D']
    
    new_q = {
        'id': q['id'],
        'type': 'single_choice',
        'question': qtext,
        'options': [f'{labels[i]}. {options[i]}' for i in range(4)],
        'answer': f'{labels[idx]}. {ans}',
        'analysis': f'正确答案：{ans}',
        'difficulty': q.get('difficulty', 2),
        'knowledge_tag': q.get('knowledge_tag', '现代文阅读'),
        'ability_tag': q.get('ability_tag', '阅读理解'),
    }
    new_reading.append(new_q)
    rsc += 1

print(f'  converted {rsc} open_ended → single_choice')
save('questions_reading.json', new_reading)

# ═══════════════════════════════════════════════════════════════
# 4. math_formulas: 50道 → 加 type 字段
# ═══════════════════════════════════════════════════════════════
print('\n=== math_formulas ===')
mf = load('questions_math_formulas.json')
for q in mf:
    if 'type' not in q:
        q['type'] = 'single_choice'
        # 用 front 作为题面，back 作为答案
        if 'question' not in q:
            q['question'] = f'公式"{q.get("front", "")}"的含义是什么？'
        if 'answer' not in q:
            q['answer'] = q.get('back', '')
        if 'options' not in q:
            # 生成选项
            backs = [x.get('back', '') for x in mf if x.get('back') and x.get('back') != q.get('back')]
            random.shuffle(backs)
            dists = backs[:3]
            while len(dists) < 3:
                dists.append(f'干扰{len(dists)}')
            options = [q['answer']] + dists
            random.shuffle(options)
            idx = options.index(q['answer'])
            labels = ['A', 'B', 'C', 'D']
            q['options'] = [f'{labels[i]}. {options[i]}' for i in range(4)]
            q['answer'] = f'{labels[idx]}. {q["answer"]}'

print(f'  added type to {len(mf)} formulas')
save('questions_math_formulas.json', mf)

# ═══════════════════════════════════════════════════════════════
# 最终验证
# ═══════════════════════════════════════════════════════════════
print('\n=== 最终验证 ===')
import glob

total = 0
fill_count = 0
open_count = 0
missing_type = 0

for f in sorted(glob.glob(f'{DATA}/questions_*.json')):
    data = json.load(open(f, encoding='utf-8'))
    if isinstance(data, dict):
        data = data.get('questions', [])
    for q in data:
        total += 1
        t = q.get('type', '')
        if t == 'fill_blank': fill_count += 1
        if t == 'open_ended': open_count += 1
        if not t: missing_type += 1

print(f'总题数: {total}')
print(f'fill_blank: {fill_count}')
print(f'open_ended: {open_count}')
print(f'缺失type: {missing_type}')

if fill_count == 0 and open_count == 0 and missing_type == 0:
    print('\n✅ 全部清理完毕！')
else:
    if fill_count: print(f'⚠️ 还有 {fill_count} 道 fill_blank')
    if open_count: print(f'⚠️ 还有 {open_count} 道 open_ended')
    if missing_type: print(f'⚠️ 还有 {missing_type} 道缺失 type')

