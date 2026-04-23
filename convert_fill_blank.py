#!/usr/bin/env python3
"""将80道拼音填空题拆分为320道选择题（带拼音）"""

import json, re, random, subprocess

random.seed(42)

# 从 git 获取原始 fill_blank 数据
result = subprocess.run(['git', 'show', 'HEAD:src/data/questions_vocab.json'], 
                       capture_output=True, text=True)
original_data = json.loads(result.stdout)
fills = [q for q in original_data if q.get('type') == 'fill_blank']
print(f'Original fill_blank questions: {len(fills)}')

# 当前数据（已转换，需要替换回去）
current = json.load(open('src/data/questions_vocab.json', encoding='utf-8'))
# 保留非 fill_blank 的题目 + 删除之前生成的 vocab_fill_*/idiom_fill_* 题目
non_fills = [q for q in current if not q['id'].startswith('vocab_fill_') and not q['id'].startswith('idiom_fill_')]
print(f'Original non-fill questions: {len(non_fills)}')

# 解析拼音
tones = 'āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ'
pinyin_re = re.compile(r'[（(]\d+[）)]\s*([' + tones + r'a-zü\s]+?)\s*[（(]\s*[）)]', re.IGNORECASE)

all_pairs = []  # [(pinyin, word, q_id, is_idiom, knowledge_tag, ability_tag, difficulty)]
parse_failures = 0

for q in fills:
    text = q['question']
    matches = pinyin_re.findall(text)
    answer_parts = q['answer'].split('、')
    
    is_idiom = '成语' in text
    
    if len(matches) != len(answer_parts):
        print(f'  WARNING {q["id"]}: {len(matches)} pinyin vs {len(answer_parts)} answers')
        parse_failures += 1
        # Try to salvage what we can
        pairs = list(zip(matches[:len(answer_parts)], answer_parts[:len(matches)]))
    else:
        pairs = list(zip(matches, answer_parts))
    
    for pinyin, word in pairs:
        all_pairs.append({
            'pinyin': pinyin.strip(),
            'word': word.strip(),
            'q_id': q['id'],
            'is_idiom': is_idiom,
            'knowledge_tag': q.get('knowledge_tag', '字音辨析' if not is_idiom else '成语运用'),
            'ability_tag': q.get('ability_tag', '字音字形' if not is_idiom else '成语理解'),
            'difficulty': q.get('difficulty', 1),
        })

print(f'Parsed pairs: {len(all_pairs)}, failures: {parse_failures}')

# 收集所有词语/成语作为干扰项池
all_words = list(set(p['word'] for p in all_pairs))
all_idioms = [p['word'] for p in all_pairs if p['is_idiom']]
all_vocab = [p['word'] for p in all_pairs if not p['is_idiom']]
print(f'Word pool: {len(all_words)} unique ({len(all_vocab)} vocab + {len(all_idioms)} idioms)')

# 生成选择题
new_questions = []
for i, pair in enumerate(all_pairs):
    word = pair['word']
    is_idiom = pair['is_idiom']
    pool = all_idioms if is_idiom else all_vocab
    
    # 选3个干扰项（同长度优先，同首字次之）
    candidates = [w for w in pool if w != word]
    # 优先选同长度的
    same_len = [w for w in candidates if len(w) == len(word)]
    if len(same_len) >= 3:
        distractors = random.sample(same_len, 3)
    else:
        # 补充其他长度的
        others = [w for w in candidates if len(w) != len(word)]
        random.shuffle(others)
        distractors = same_len + others[:3 - len(same_len)]
    
    options = [word] + distractors[:3]
    random.shuffle(options)
    
    correct_idx = options.index(word)
    labels = ['A', 'B', 'C', 'D']
    
    label = '成语' if is_idiom else '词语'
    question_text = f'拼音 "{pair["pinyin"]}" 对应的正确{label}是哪个？'
    
    new_q = {
        'id': f'vocab_sc_{i + 1:03d}',
        'type': 'single_choice',
        'question': question_text,
        'options': [f'{labels[j]}. {options[j]}' for j in range(4)],
        'answer': f'{labels[correct_idx]}. {word}',
        'analysis': f'"{" ".join(pair["pinyin"])}" 对应的正确{label}是"{word}"。注意区分同音字和形近字。',
        'difficulty': pair['difficulty'],
        'knowledge_tag': pair['knowledge_tag'],
        'ability_tag': pair['ability_tag'],
    }
    new_questions.append(new_q)

print(f'\nGenerated {len(new_questions)} single_choice questions')

# 合并
result = non_fills + new_questions
print(f'Total: {len(result)} ({len(non_fills)} original + {len(new_questions)} new)')

# 保存
with open('src/data/questions_vocab.json', 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)
print('Saved!')

# 验证
verify = json.load(open('src/data/questions_vocab.json', encoding='utf-8'))
types = {}
for q in verify:
    t = q.get('type', '?')
    types[t] = types.get(t, 0) + 1
print(f'Types: {types}')

# 抽查几道
for q in new_questions[:3]:
    print(f'\n{q["id"]}: {q["question"]}')
    for o in q['options']:
        print(f'  {o}')
    print(f'  Answer: {q["answer"]}')

# 抽查成语题
idiom_qs = [q for q in new_questions if '成语' in q['question']]
if idiom_qs:
    print(f'\n--- 成语示例 ---')
    for q in idiom_qs[:3]:
        print(f'\n{q["id"]}: {q["question"]}')
        for o in q['options']:
            print(f'  {o}')
        print(f'  Answer: {q["answer"]}')

