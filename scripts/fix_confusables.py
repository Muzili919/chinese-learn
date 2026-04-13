#!/usr/bin/env python3
"""
修复易混词(confusables)与关联词(associations)重叠问题
策略：
  1. 检测所有重复项
  2. 对有手工规则的，按规则替换
  3. 对没有规则（主要是动物类），自动寻找形似词作为新易混词
"""

import json
from difflib import SequenceMatcher

INPUT = 'src/data/words_network.json'
OUTPUT = 'src/data/words_network.json'

# === 手工精确替换表：针对已分析的词条 ===
MANUAL_RULES = {
    # school
    ('classroom', 'class'):     'glass',
    ('school bus', 'school'):   'fool',
    ('school bus', 'bus'):      'but',
    ('pencil case', 'pencil'): 'picnic',

    # numbers 整十
    ('fifty', 'fifteen'):       'fifty',      # 后面会特殊处理
    ('sixty', 'sixteen'):       'safety',
    ('seventy', 'seventeen'):   'serpent',
    ('eighty', 'eighteen'):     'entry',
    ('ninety', 'nineteen'):     'nighty',    # nighty不在库?后面验证
    ('thousand', 'Thursday'):   'thunder',

    # 序数词
    ('first', 'fast'):          'feast',
    ('second', 'secret'):       'sector',
    ('second', 'send'):         'sand',
    ('third', 'bird'):          'turd',       # 可能不在库
    ('third', 'thirsty'):       'thirty',
    ('fourth', 'forty'):        'fourteenth',
    ('fourth', 'forth'):        'forty',
    ('fifth', 'fifty'):         'fifteenth',
    ('fifth', 'fit'):           'first',
    ('sixth', 'sixty'):         'sixteenth',
    ('sixth', 'sixten'):        'six',
    ('seventh', 'seventy'):     'seventeenth',
    ('seventh', 'seventeen'):   'seven',
    ('eighth', 'eighty'):       'eighteenth',
    ('eighth', 'eighteen'):     'eight',
    ('ninth', 'ninety'):        'nineteenth',
    ('ninth', 'nineteen'):      'nine',
    ('tenth', 'ten'):           'test',
    ('tenth', 'tent'):          'text',

    # family
    ('dad', 'bad'):             'pad',
    ('dad', 'sad'):             'mad',
    ('mother', 'brother'):      'bother',
    ('mum', 'gum'):             'bum',
    ('mum', 'yum'):             'hum',

    # school科目
    ('subject', 'object'):      'reject',
    ('math', 'path'):           'match',
    ('science', 'since'):       'silence',
    ('art', 'cart'):            'ant',
    ('pe', 'pen'):              'pet',
    ('history', 'story'):       'mystery',
    ('geography', 'graph'):     'giraffe',

    # nature
    ('waterfall', 'water'):     'war',
    ('rainbow', 'rain'):        'brain',

    # verb
    ('bake', 'cake'):           'lake',
    ('sing', 'song'):           'ring',
    
    # 新增词
    ('floor', 'door'):          'poor',
    ('bookstore', 'book'):      'cook',
    ('cool', 'cold'):           'pool',
    ('friendly', 'friend'):     'fly',
    ('helpful', 'help'):        'yelp',
}


def find_similar_words(target, all_words, exclude_set, min_similarity=0.4):
    """找形似但语义无关的词"""
    candidates = []
    target_lower = target.lower()
    target_len = len(target_lower)
    
    for w in all_words:
        if w.lower() in exclude_set or w.lower() == target_lower:
            continue
        
        # 长度差异不超过3
        if abs(len(w) - target_len) > 3:
            continue
            
        sim = SequenceMatcher(None, target_lower, w.lower()).ratio()
        if sim >= min_similarity:
            candidates.append((w, sim))
    
    candidates.sort(key=lambda x: -x[1])
    return [c[0] for c in candidates]


def main():
    with open(INPUT) as f:
        data = json.load(f)
    
    words = data['words']
    all_word_keys = set(words.keys())
    
    print('=== 第一步：验证手工替换目标是否存在词库中 ===')
    valid_rules = {}
    invalid_rules = []
    
    for (w, old), new in MANUAL_RULES.items():
        if w not in words:
            invalid_rules.append((w, old, new, f'源词{w}不存在'))
        elif new not in all_word_keys:
            invalid_rules.append((w, old, new, f'目标词{new}不在词库'))
        else:
            valid_rules[(w, old)] = new
    
    print(f'  有效规则: {len(valid_rules)}')
    if invalid_rules:
        print(f'\n  ⚠️ 无效规则 ({len(invalid_rules)}):')
        for w, old, new, reason in invalid_rules:
            print(f'    {w}: {old} → {new} [{reason}]')

    print(f'\n=== 第二步：执行替换 ===\n')
    fixed_count = 0
    auto_fixed = []
    still_broken = []

    for w, obj in sorted(words.items()):
        assocs = set(obj.get('associations', []))
        confs = list(obj.get('confusables', []))
        
        new_confs = []
        changed = False
        auto_replaced = []

        for c in confs:
            if c in assocs:
                if (w, c) in valid_rules:
                    new_confs.append(valid_rules[(w, c)])
                    changed = True
                    print(f'✅ {w:20s} | {c:15s} → {valid_rules[(w,c)]}')
                else:
                    # 自动找形似词
                    sims = find_similar_words(c, all_word_keys, assocs | {w}, 0.35)
                    if sims:
                        new_confs.append(sims[0])
                        changed = True
                        auto_replaced.append(f'{c}→{sims[0]}')
                        print(f'🔧 {w:20s} | {c:15s} → {sims[0]} (自动)')
                    else:
                        new_confs.append(c)
                        still_broken.append((w, c))
                        print(f'❌ {w:20s} | {c:15s} 无法找到替代')
            else:
                new_confs.append(c)

        if changed:
            obj['confusables'] = new_confs
            fixed_count += 1
            if auto_replaced:
                auto_fixed.append((w, auto_replaced))

    print(f'\n{"="*60}')
    print(f'修复统计:')
    print(f'  手工替换: {sum(1 for (a,b) in valid_rules)} 处')
    print(f'  自动替换: {len(auto_fixed)} 处')
    print(f'  仍需处理: {len(still_broken)} 处')
    print(f'  总修改词条: {fixed_count}')

    if still_broken:
        print(f'\n⚠️ 以下 {len(still_broken)} 处未能自动修复:')
        for w, c in sorted(still_broken):
            print(f'  {w}: "{c}" 与关联词重复且无替代')

    # 最终校验：检查是否还有残留重复
    remaining = 0
    for w, obj in words.items():
        assocs = set(obj.get('associations', []))
        confs = set(obj.get('confusables', []))
        dups = assocs & confs
        if dups:
            remaining += 1
    
    if remaining > 0:
        print(f'\n⚠️ 警告: 仍有 {remaining} 个词条存在重叠!')
    else:
        print(f'\n✅ 完美! 所有重叠已消除!')

    with open(OUTPUT, 'w') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f'\n💾 已写入 {OUTPUT}')

if __name__ == '__main__':
    main()
