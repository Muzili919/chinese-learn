#!/usr/bin/env python3
"""Adjust tier distribution and trim to exactly 800 words"""
import json

with open('/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/words_network_j2.json','r') as f:
    data = json.load(f)
words = data['words']

# Step 1: Remove exact 101 words - prioritize removing:
# 1. Tier 3 low frequency (lowest value)
# 2. Tier 2 low frequency
# 3. Tier 3 medium frequency
# 4. Words that are clearly not Grade 8 level

# First, mark words for potential removal
removal_priority = []
for w, info in words.items():
    tier = info['tier']
    freq = info['frequency']
    # Priority score: higher = more likely to remove
    score = 0
    if tier == 3 and freq == 'low':
        score = 100
    elif tier == 3 and freq == 'medium':
        score = 90
    elif tier == 2 and freq == 'low':
        score = 80
    elif tier == 2 and freq == 'medium':
        score = 50
    elif tier == 1 and freq == 'low':
        score = 30
    elif tier == 1 and freq == 'medium':
        score = 10
    else:
        score = 0
    removal_priority.append((w, score, tier, freq))

# Sort by priority (highest first = remove first)
removal_priority.sort(key=lambda x: -x[1])

# Remove top 101
to_remove = removal_priority[:101]
for w, score, tier, freq in to_remove:
    del words[w]

print(f"Removed 101 words. Total now: {len(words)}")

# Step 2: Reassign tiers to match target: T1=500, T2=220, T3=80
# First, sort remaining words by "importance score"
word_scores = []
for w, info in words.items():
    freq = info['frequency']
    score = 0
    if freq == 'high':
        score = 100
    elif freq == 'medium':
        score = 50
    else:
        score = 20
    # Boost for common word categories
    if info['category'] in ['verb','adjective','noun']:
        score += 10
    word_scores.append((w, score, info['category'], freq))

word_scores.sort(key=lambda x: -x[1])

# Assign tiers
target_t1, target_t2, target_t3 = 500, 220, 80
for i, (w, score, cat, freq) in enumerate(word_scores):
    if i < target_t1:
        words[w]['tier'] = 1
    elif i < target_t1 + target_t2:
        words[w]['tier'] = 2
    else:
        words[w]['tier'] = 3

# Verify
tc = {}
for w, info in words.items():
    tc[info['tier']] = tc.get(info['tier'], 0) + 1
print(f"Tier distribution: {tc}")
print(f"Total: {len(words)}")

data['meta']['total'] = len(words)

with open('/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/words_network_j2.json','w',encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print("Saved!")
