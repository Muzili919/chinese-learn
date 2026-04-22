#!/usr/bin/env python3
"""重新分层所有小学题库的 difficulty 分布"""

import json, os, copy, hashlib

DATA = '/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data'

def load(name):
    with open(os.path.join(DATA, name), encoding='utf-8') as f:
        return json.load(f)

def save(name, data):
    with open(os.path.join(DATA, name), 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f'  ✓ {name}: {len(data)}题 saved')

def qhash(q, salt=''):
    """确定性哈希，用于分配difficulty（同一题每次结果一致）"""
    h = hashlib.md5((q.get('id','') + salt).encode()).hexdigest()
    v = int(h[:8], 16) / 0xFFFFFFFF  # 0~1
    return v

def redistribute(target_ratios, questions, salt=''):
    """
    target_ratios: [(value, ratio), ...] e.g. [(1, 0.3), (2, 0.5), (3, 0.2)]
    按确定性哈希分配，保证同一题总是得到相同结果
    """
    n = len(questions)
    # 计算每个难度级别的数量
    thresholds = []
    cumulative = 0
    for val, ratio in target_ratios:
        cumulative += ratio
        thresholds.append((val, cumulative))
    thresholds[-1] = (thresholds[-1][0], 1.0)  # 确保最后一个阈值是1.0

    for q in questions:
        v = qhash(q, salt)
        for val, threshold in thresholds:
            if v < threshold:
                q['difficulty'] = val
                break

    return questions

# ─── 语文题库：1/2/3 三级 ────────────────────────────────────────────

# 字词：用哈希做 30/50/20 分布，ability_tag 做微调
print('=== 语文题库 ===')
vocab = load('questions_vocab.json')
for q in vocab:
    v = qhash(q, 'vocab')
    base = 1 if v < 0.30 else (3 if v > 0.80 else 2)
    # 微调：字音/字形偏易，词语辨析偏难
    tag = q.get('ability_tag', '')
    if base == 2 and ('字音' in tag or '字形' in tag):
        base = 1
    if base == 2 and ('辨析' in tag or '综合' in tag):
        base = 3
    q['difficulty'] = base
save('questions_vocab.json', vocab)

# 古诗词：默写→易，鉴赏→中/难
poetry = load('questions_poetry.json')
for q in poetry:
    tag = q.get('ability_tag', '')
    if '默写' in tag or q.get('type') == 'fill_blank':
        q['difficulty'] = 1
    elif '鉴赏' in tag or '赏析' in tag:
        v = qhash(q, 'poetry')
        q['difficulty'] = 3 if v > 0.6 else 2
    else:
        q['difficulty'] = 2
save('questions_poetry.json', poetry)

# 成语：30/50/20 分布，ability_tag 微调
idiom = load('questions_idiom.json')
for q in idiom:
    v = qhash(q, 'idiom')
    base = 1 if v < 0.30 else (3 if v > 0.80 else 2)
    tag = q.get('ability_tag', '')
    if base == 2 and ('理解' in tag or '释义' in tag):
        base = 1
    if base == 1 and ('辨析' in tag or '近义' in tag):
        base = 2
    q['difficulty'] = base
save('questions_idiom.json', idiom)

# 句子：30/50/20 分布，ability_tag 微调
sentence = load('questions_sentence.json')
for q in sentence:
    v = qhash(q, 'sentence')
    base = 1 if v < 0.30 else (3 if v > 0.80 else 2)
    tag = q.get('ability_tag', '')
    if base == 3 and ('标点' in tag or '关联词' in tag):
        base = 2
    if base == 1 and ('病句' in tag or '仿写' in tag or '缩句' in tag):
        base = 2
    q['difficulty'] = base
save('questions_sentence.json', sentence)

# 文学常识：30/50/20 分布
lit = load('questions_literature.json')
for q in lit:
    v = qhash(q, 'lit')
    q['difficulty'] = 1 if v < 0.30 else (3 if v > 0.80 else 2)
save('questions_literature.json', lit)

# 语文阅读：30/50/20 分布（用哈希，避免全2）
reading = load('questions_reading.json')
for q in reading:
    v = qhash(q, 'cn_reading')
    q['difficulty'] = 1 if v < 0.30 else (3 if v > 0.80 else 2)
save('questions_reading.json', reading)

# 口算/口语
oral = load('questions_oral.json')
redistribute([(1, 0.4), (2, 0.4), (3, 0.2)], oral, 'oral')
save('questions_oral.json', oral)

# ─── 英语题库：0.3 / 0.5 / 0.7 三级 ──────────────────────────────────

print('\n=== 英语题库 ===')

# 语法：简单语法→0.3, 中等→0.5, 综合/完形→0.7
grammar = load('questions_en_grammar.json')
for q in grammar:
    tag = q.get('ability_tag', '')
    if 'be动词' in tag or '人称代词' in tag or '基础' in tag:
        q['difficulty'] = 0.3
    elif '完形' in tag or '综合' in tag or '语篇' in tag:
        q['difficulty'] = 0.7
    else:
        v = qhash(q, 'grammar')
        q['difficulty'] = 0.3 if v < 0.2 else (0.7 if v > 0.8 else 0.5)
save('questions_en_grammar.json', grammar)

# 听力：单词辨识→0.3, 对话理解→0.5, 短文→0.7
listen = load('questions_en_listen.json')
for q in listen:
    tag = q.get('ability_tag', '')
    if '单词' in tag or '字母' in tag or '辨识' in tag:
        q['difficulty'] = 0.3
    elif '短文' in tag or '长对话' in tag:
        q['difficulty'] = 0.7
    else:
        v = qhash(q, 'listen')
        q['difficulty'] = 0.3 if v < 0.2 else (0.7 if v > 0.75 else 0.5)
save('questions_en_listen.json', listen)

# 阅读：短文+T/F→0.3, 选择题→0.5, 推断/排序→0.7
eng_reading = load('questions_en_reading.json')
for q in eng_reading:
    qtext = q.get('question', '')
    if '判断' in qtext and len(qtext) < 500:
        q['difficulty'] = 0.3
    elif '推断' in qtext or '排序' in qtext or '主旨' in qtext or 'title' in qtext.lower():
        q['difficulty'] = 0.7
    elif '用完整的英语句子回答' in qtext or '回答问题' in qtext:
        q['difficulty'] = 0.7
    else:
        v = qhash(q, 'eng_reading')
        q['difficulty'] = 0.3 if v < 0.2 else (0.7 if v > 0.75 else 0.5)
save('questions_en_reading.json', eng_reading)

# 写作：30/50/20 分布
writing = load('questions_en_writing.json')
for q in writing:
    v = qhash(q, 'writing')
    tag = q.get('ability_tag', '')
    if '句子重组' in tag or '连词成句' in tag:
        q['difficulty'] = 0.3
    elif '小短文' in tag or '写话' in tag or '短文' in tag or '作文' in tag:
        q['difficulty'] = 0.5 if v < 0.5 else 0.7
    else:
        q['difficulty'] = 0.3 if v < 0.25 else (0.7 if v > 0.75 else 0.5)
save('questions_en_writing.json', writing)

# 单词（已经有 0.3/0.5/0.7 分布了，保持不动）
print('  - questions_en_vocab.json: 保持现有分布')

# ─── 数学题库：补缺失值 ──────────────────────────────────────────────

print('\n=== 数学题库 (补缺) ===')

# 基础：补10个缺失difficulty
mbasic = load('questions_math_basic.json')
for q in mbasic:
    if 'difficulty' not in q or q['difficulty'] is None:
        tag = q.get('knowledge_tag', '')
        if '认识' in tag or '基础' in tag:
            q['difficulty'] = 1
        elif '混合' in tag or '综合' in tag:
            q['difficulty'] = 3
        else:
            v = qhash(q, 'mbasic')
            q['difficulty'] = 1 if v < 0.3 else (3 if v > 0.7 else 2)
    else:
        q['difficulty'] = int(q['difficulty'])  # 确保 int
save('questions_math_basic.json', mbasic)

# 奥数：补15个缺失difficulty
moly = load('questions_math_olympiad.json')
for q in moly:
    if 'difficulty' not in q or q['difficulty'] is None:
        tag = q.get('knowledge_tag', '')
        if '方程应用' in tag:
            q['difficulty'] = 2
        elif '复合应用' in tag:
            q['difficulty'] = 3
        elif '统计' in tag:
            q['difficulty'] = 2
        else:
            v = qhash(q, 'moly')
            q['difficulty'] = 2 if v < 0.4 else (4 if v > 0.8 else 3)
    else:
        q['difficulty'] = int(q['difficulty'])
save('questions_math_olympiad.json', moly)

# 几何确保 int
mgeo = load('questions_math_geometry.json')
for q in mgeo:
    if 'difficulty' in q:
        q['difficulty'] = int(q['difficulty'])
save('questions_math_geometry.json', mgeo)

# ─── 验证 ────────────────────────────────────────────────────────────

print('\n=== 验证结果 ===')
check_files = [
    'questions_vocab.json', 'questions_poetry.json', 'questions_idiom.json',
    'questions_sentence.json', 'questions_literature.json', 'questions_reading.json',
    'questions_oral.json',
    'questions_math_basic.json', 'questions_math_geometry.json', 'questions_math_olympiad.json',
    'questions_en_vocab.json', 'questions_en_grammar.json', 'questions_en_listen.json',
    'questions_en_reading.json', 'questions_en_writing.json',
]
for f in check_files:
    data = load(f)
    diffs = {}
    missing = 0
    for q in data:
        d = q.get('difficulty', 'MISSING')
        if d == 'MISSING' or d is None:
            missing += 1
        else:
            diffs[d] = diffs.get(d, 0) + 1
    name = f.replace('questions_', '').replace('.json', '')
    print(f'  {name:20s} {len(data):3d}题 | 缺失{missing} | {dict(sorted(diffs.items(), key=lambda x: str(x[0])))}')
