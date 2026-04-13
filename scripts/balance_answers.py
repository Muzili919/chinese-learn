#!/usr/bin/env python3
"""Balance MC answer distribution for English grammar questions."""

import json

with open('/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/questions_en_grammar.json') as f:
    data = json.load(f)

from collections import Counter

# Get MC questions
mc_questions = [q for q in data if q['type'] == 'multiple_choice']
print(f"Total MC questions: {len(mc_questions)}")

# Count answers
counts = Counter(q['answer'] for q in mc_questions)
print(f"Before: {dict(counts)}")

# Target: ~17-18 each (70 / 4)
# Need to move: A: 24->18 (move 6), B: 28->18 (move 10), C: 17->18 (move 1 to C), D: 1->18 (need 17 more)

# Strategy: Swap correct answer position for suitable questions
# For each question with answer A where swapping to D works cleanly:
#   - Swap options[0] and options[3], update answer to D
# Similar for other swaps

def swap_options_and_answer(q, old_pos, new_pos):
    """Swap two options and update answer accordingly."""
    options = list(q['options'])
    old_opt = options[old_pos]
    new_opt = options[new_pos]
    options[old_pos] = new_opt
    options[new_pos] = old_opt
    q['options'] = options
    
    old_letter = chr(65 + old_pos)
    new_letter = chr(65 + new_pos)
    if q['answer'] == old_letter:
        q['answer'] = new_letter

# Find questions where we can cleanly swap A<->D
# Criteria: the D option must be a plausible wrong answer (not just filler)
a_to_d_swaps = []
for q in mc_questions:
    if q['answer'] == 'A':
        a_opt = q['options'][0]  # A option
        d_opt = q['options'][3]  # D option
        # Check D option is not obviously wrong filler
        if d_opt not in ["D. All right.", "D. I'm fine.", "D. I like school.", "D. You're welcome."]:
            a_to_d_swaps.append(q)

print(f"\nA->D swap candidates (quality): {len(a_to_d_swaps)}")

# Find B->D swap candidates
b_to_d_swaps = []
for q in mc_questions:
    if q['answer'] == 'B':
        d_opt = q['options'][3]
        if d_opt not in ["D. All right.", "D. I'm fine.", "D. I like school.", "D. You're welcome."]:
            b_to_d_swaps.append(q)

print(f"B->D swap candidates (quality): {len(b_to_d_swaps)}")

# Execute swaps
# Target: A=18, B=18, C=18, D=16 (close enough, 70 total)
# Actually let's aim for A=18, B=18, C=17, D=17

swaps_done = 0

# Swap A->D: need to move ~6 from A to D
target_a_to_d = 6
for i, q in enumerate(a_to_d_swaps):
    if swaps_done >= target_a_to_d:
        break
    swap_options_and_answer(q, 0, 3)  # swap A and D
    swaps_done += 1
    print(f"  Swapped A->D: {q['id']} (now {q['answer']})")

print(f"\nSwapped {swaps_done} A->D")

# Swap B->D: need to move ~10 from B to D
target_b_to_d = 10
swaps_done_b = 0
for q in b_to_d_swaps:
    if swaps_done_b >= target_b_to_d:
        break
    swap_options_and_answer(q, 1, 3)  # swap B and D
    swaps_done_b += 1
    print(f"  Swapped B->D: {q['id']} (now {q['answer']})")

print(f"Swapped {swaps_done_b} B->D")

# Now also need some A->C (A has too many still after A->D swaps)
# Check current counts
new_counts = Counter(q['answer'] for q in mc_questions)
print(f"\nAfter swaps: {dict(new_counts)}")

# If still imbalanced, do more swaps
a_count = new_counts.get('A', 0)
c_count = new_counts.get('C', 0)
if a_count > c_count + 2:
    # Swap some A->C
    a_to_c_candidates = [q for q in mc_questions if q['answer'] == 'A']
    needed = (a_count - c_count) // 2
    for q in a_to_c_candidates[:needed]:
        swap_options_and_answer(q, 0, 2)  # swap A and C
        print(f"  Swapped A->C: {q['id']}")

b_count = new_counts.get('B', 0)
c_count_after = Counter(q['answer'] for q in mc_questions).get('C', 0)
if b_count > c_count_after + 2:
    b_to_c_candidates = [q for q in mc_questions if q['answer'] == 'B']
    needed = (b_count - c_count_after) // 2
    for q in b_to_c_candidates[:needed]:
        swap_options_and_answer(q, 1, 2)
        print(f"  Swapped B->C: {q['id']}")

# Final count
final_counts = Counter(q['answer'] for q in mc_questions)
print(f"\nFinal: {dict(final_counts)}")
total_mc = sum(final_counts.values())
print(f"Total MC: {total_mc}")
for letter in 'ABCD':
    pct = final_counts.get(letter, 0) / total_mc * 100
    print(f"  {letter}: {final_counts.get(letter, 0)} ({pct:.1f}%)")

# Write output
with open('/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/questions_en_grammar.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("\nOutput written successfully!")
