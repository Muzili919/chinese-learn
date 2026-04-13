#!/usr/bin/env python3
"""Fix all issues in the English grammar question bank - v2."""

import json
from collections import Counter

# Read original data
with open('/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/questions_en_grammar.json', 'r', encoding='utf-8') as f:
    raw = json.load(f)

# ============================================================
# STEP 1: Build question map and identify structure
# ============================================================
questions_by_id = {}
for q in raw:
    qid = q['id']
    if qid in questions_by_id:
        print(f"DUPLICATE: {qid}")
    questions_by_id.setdefault(qid, []).append(q)

# Identify duplicates
dup_ids = {k: v for k, v in questions_by_id.items() if len(v) > 1}
print(f"Duplicate IDs: {sorted(dup_ids.keys())}")
print(f"Total unique IDs: {len(questions_by_id)}")
print(f"Total entries: {len(raw)}")

# ============================================================
# STEP 2: Resolve duplicates by renumbering
# ============================================================
# Keep first occurrence as-is, renumber second occurrences
# Original duplicate IDs: 071-080
# Strategy: second batch (original 071-080) -> 081-090
#            original 081-090 -> 091-100
#            original 091-100 -> 101-110

final_questions = {}  # id -> question object

for qid, qlist in questions_by_id.items():
    num = int(qid.split('_')[-1])
    if len(qlist) == 1:
        final_questions[qid] = qlist[0]
    else:
        # First occurrence keeps original ID
        final_questions[qid] = qlist[0]
        # Second occurrence gets renumbered: +10
        new_num = num + 10
        new_id = f"en_grammar_{new_num:03d}"
        final_questions[new_id] = qlist[1]
        print(f"  Renumbered: {qid} (2nd) -> {new_id}")

# Also renumber non-duplicate 081-100 (if they exist as single entries and weren't part of the original batch)
# We need to shift original 081-100 to 091-110
to_shift = []
for qid in list(final_questions.keys()):
    num = int(qid.split('_')[-1])
    if num >= 81 and num <= 100:
        # Check if this was an original single entry (not a renumbered duplicate)
        if qid not in dup_ids:
            to_shift.append(num)

# Sort descending to avoid conflicts
to_shift.sort(reverse=True)
for num in to_shift:
    old_id = f"en_grammar_{num:03d}"
    new_num = num + 20  # 081->101, 082->102, etc.
    new_id = f"en_grammar_{new_num:03d}"
    if new_id in final_questions:
        print(f"  CONFLICT: {new_id} already exists! Skipping shift of {old_id}")
    else:
        final_questions[new_id] = final_questions.pop(old_id)
        print(f"  Shifted: {old_id} -> {new_id}")

# Also shift original 081-090 that were single entries (not duplicates)
# Actually let me reconsider: original 081-100 might have been single entries
# that need to be shifted because of the 071-080 duplicate renumbering
# The 2nd batch of 071-080 became 081-090, so original 081-090 need to become 091-100
# and original 091-100 need to become 101-110

# Let me redo this more carefully
# After renumbering duplicates, check if 081-090 are occupied by renumbered items
print("\nChecking 081-110 occupancy...")
for num in range(81, 111):
    qid = f"en_grammar_{num:03d}"
    if qid in final_questions:
        q = final_questions[qid]
        print(f"  {qid}: type={q['type']}, tag={q['ability_tag']}, q={q['question'][:40]}...")

# ============================================================
# STEP 3: Build ordered list sorted by ID number
# ============================================================
sorted_ids = sorted(final_questions.keys(), key=lambda x: int(x.split('_')[-1]))
ordered = [final_questions[qid] for qid in sorted_ids]

print(f"\nTotal questions after renumbering: {len(ordered)}")
id_nums = [int(q['id'].split('_')[-1]) for q in ordered]
print(f"ID range: {id_nums[0]} to {id_nums[-1]}")

# Check gaps
all_nums = set(id_nums)
expected = set(range(id_nums[0], id_nums[-1] + 1))
gaps = sorted(expected - all_nums)
print(f"Gaps: {gaps}")

# Verify uniqueness
id_list = [q['id'] for q in ordered]
dup_check = [item for item, count in Counter(id_list).items() if count > 1]
if dup_check:
    print(f"STILL HAVE DUPLICATES: {dup_check}")
else:
    print("All IDs unique: OK")

# Write intermediate result for inspection
with open('/tmp/en_grammar_step3.json', 'w', encoding='utf-8') as f:
    json.dump(ordered, f, ensure_ascii=False, indent=2)
print("\nIntermediate result saved to /tmp/en_grammar_step3.json")
