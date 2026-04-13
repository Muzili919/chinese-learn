#!/usr/bin/env python3
"""Fix option letter prefixes after balance swaps."""

import json

with open('/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/questions_en_grammar.json') as f:
    data = json.load(f)

fixed = 0
for q in data:
    if q['type'] == 'multiple_choice':
        new_options = []
        for i, opt in enumerate(q['options']):
            # Strip any existing letter prefix
            cleaned = opt.lstrip('ABCDEF. ')
            # Re-add correct letter prefix
            new_options.append(f"{chr(65+i)}. {cleaned}")
        if new_options != q['options']:
            q['options'] = new_options
            fixed += 1

print(f"Fixed option prefixes for {fixed} questions")

# Verify
bad = 0
for q in data:
    if q['type'] == 'multiple_choice':
        for i, opt in enumerate(q['options']):
            expected = chr(65 + i) + '.'
            if not opt.startswith(expected):
                bad += 1
                print(f"  STILL BAD: {q['id']} option {i}: {opt}")

if bad == 0:
    print("All options now in correct order ✓")

# Verify answer still matches
for q in data:
    if q['type'] == 'multiple_choice':
        ans = q['answer']
        if ans in ['A', 'B', 'C', 'D']:
            idx = ord(ans) - 65
            opt_text = q['options'][idx]
            if not opt_text.startswith(f"{ans}."):
                print(f"  MISMATCH: {q['id']} answer={ans} but option={opt_text[:30]}")

with open('/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/questions_en_grammar.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Output saved.")
