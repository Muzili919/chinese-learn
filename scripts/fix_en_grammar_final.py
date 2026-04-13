#!/usr/bin/env python3
"""
Fix all issues in the English grammar question bank.
Strategy:
1. The file has 99 entries. IDs 071-080 each appear twice (entry+1 = duplicate).
2. Keep original 001-070, 071(first), 081-100 (they already have unique IDs).
3. Renumber the second occurrence of 071-080 as new 081-090.
4. Renumber original 081-100 as 091-110.
5. Add missing 003, 031-040.
"""

import json
from collections import Counter

with open('/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/questions_en_grammar.json', 'r', encoding='utf-8') as f:
    raw = json.load(f)

# ── Step 1: Split file at the second occurrence of 071 ──
first_071_idx = None
second_071_idx = None
for i, q in enumerate(raw):
    if q['id'] == 'en_grammar_071':
        if first_071_idx is None:
            first_071_idx = i
        elif second_071_idx is None:
            second_071_idx = i
            break

print(f"First 071 at index {first_071_idx}")
print(f"Second 071 at index {second_071_idx}")

# Part A: everything before second 071 (indices 0..second_071_idx-1)
part_a = raw[:second_071_idx]
# Part B: second 071 to end (indices second_071_idx..end)
part_b = raw[second_071_idx:]

print(f"Part A: {len(part_a)} questions")
print(f"Part B: {len(part_b)} questions")
print(f"Part A last ID: {part_a[-1]['id']}")
print(f"Part B first ID: {part_b[0]['id']}, last ID: {part_b[-1]['id']}")

# Verify Part A has all unique IDs
a_ids = [q['id'] for q in part_a]
a_dupes = [item for item, count in Counter(a_ids).items() if count > 1]
print(f"Part A duplicates: {a_dupes}")

# ── Step 2: Renumber Part B ──
# Part B has: 071(dup),072(dup),...,080(dup),081,082,...,100
# Renumber: 071->081, 072->082, ..., 100->110 (all +10)
for q in part_b:
    old_num = int(q['id'].split('_')[-1])
    new_num = old_num + 10
    new_id = f"en_grammar_{new_num:03d}"
    q['id'] = new_id

# Verify Part B IDs
b_ids = [q['id'] for q in part_b]
b_dupes = [item for item, count in Counter(b_ids).items() if count > 1]
print(f"Part B duplicates after renumbering: {b_dupes}")

# ── Step 3: Merge ──
all_questions = part_a + part_b
all_ids = [q['id'] for q in all_questions]
all_dupes = [item for item, count in Counter(all_ids).items() if count > 1]
print(f"\nMerged total: {len(all_questions)}")
print(f"Final duplicates: {all_dupes}")
id_nums = sorted([int(q['id'].split('_')[-1]) for q in all_questions])
print(f"ID range: {id_nums[0]}-{id_nums[-1]}")

expected = set(range(id_nums[0], id_nums[-1]+1))
actual = set(id_nums)
gaps = sorted(expected - actual)
print(f"Gaps: {gaps}")

# ── Step 4: Fix all issues ──

# Build a lookup dict
qmap = {q['id']: q for q in all_questions}

# --- 4a: Fix en_grammar_024 (ambiguous answer) ---
q = qmap['en_grammar_024']
q['question'] = "选择正确的答案填空。\n\nI asked my sister to eat apples, ______ she chose bananas instead."
q['answer'] = "B"
q['analysis'] = "【考点】本题考查并列连词but表示转折。\n【解题思路】前半句\"我让妹妹吃苹果\"，后半句\"她却选择了香蕉\"，两者有明显的转折对比关系，用but。\n【总结】连词：and（和，而且），but（但是，表示转折），or（或者，否则），so（所以）。"

# --- 4b: Fix en_grammar_025 (wrong type label) ---
q = qmap['en_grammar_025']
q['type'] = 'multiple_choice'
q['ability_tag'] = '语法选择'
q['question'] = "选择正确的答案填空。\n\nWhat ______ interesting story it is!"
q['options'] = ["A. a", "B. an", "C. the", "D. /"]
q['answer'] = "B"
q['analysis'] = "【考点】本题考查不定冠词a和an的用法。\n【解题思路】interesting以元音音素开头，用an。\n【总结】a用于辅音音素开头的单词前，an用于元音音素开头的单词前。注意看音素不是看字母，如an hour, a university。"

# --- 4c: Fix en_grammar_049 (illogical scenario) ---
q = qmap['en_grammar_049']
q['question'] = "选择正确的应答句。\n\n—I didn't catch what you said. ______\n—Sure. I said the station is on the left."
q['options'] = [
    "A. Could you say that again?",
    "B. Thank you.",
    "C. I'm sorry.",
    "D. That's OK."
]
q['answer'] = "A"
q['analysis'] = "【考点】本题考查请求对方重复的用语。\n【解题思路】\"I didn't catch what you said.\"表示没听清，应请求对方再说一遍。\n【总结】请求重复：Pardon? / Excuse me? / Could you say that again? / I didn't catch that."

# --- 4d: Fix en_grammar_065 (wrong type label) ---
q = qmap['en_grammar_065']
q['type'] = 'multiple_choice'
q['ability_tag'] = '语法选择'
q['question'] = "选择正确的答案填空。\n\n______ you please pass me the salt?"
q['options'] = ["A. Can", "B. Could", "C. Will", "D. Must"]
q['answer'] = "B"
q['analysis'] = "【考点】本题考查情态动词表示礼貌请求。\n【解题思路】Could you please...? 比Can you please...? 更礼貌，\"please\"提示需要选择更委婉的表达。\n【总结】请求常用：Could you...? (最礼貌) / Can you...? / Would you please...?"

# --- 4e: Fix en_grammar_006 (poor distractor) ---
q = qmap['en_grammar_006']
q['options'] = [
    "A. That's right.",
    "B. Not at all.",
    "C. You're welcome.",
    "D. All right."
]
q['analysis'] = "【考点】本题考查致谢的应答。\n【解题思路】\"Thank you\"的常见回答是\"You're welcome.\"。注意\"Not at all\"也是致谢应答，表示\"一点也不/别客气\"。\n【总结】致谢应答：You're welcome. / That's OK. / Not at all. / My pleasure."

# --- 4f: Fix en_grammar_012 (answer separator) ---
q = qmap['en_grammar_012']
q['answer'] = "will visit|are going to visit"

# --- 4g: Fix en_grammar_015 (unclear instruction) ---
q = qmap['en_grammar_015']
q['question'] = "用所给单词的适当时态填空。\n\n______ (Can) you swim when you were five?"

# --- 4h: Fix en_grammar_096 (now 106 after renumber: ambiguous comfort answer) ---
q = qmap['en_grammar_106']  # was en_grammar_086
q['options'] = [
    "A. Don't worry.",
    "B. That's great!",
    "C. You're welcome.",
    "D. Congratulations!"
]
q['answer'] = "A"
q['analysis'] = "【考点】本题考查安慰与鼓励的表达。\n【解题思路】对方考试失利，应安慰并鼓励。\"Don't worry.\"表示\"别担心\"，后接鼓励性话语。\n【总结】安慰鼓励：Don't worry. / Never mind. / You can do it. / Cheer up!"

# --- 4i: Fix en_grammar_088 (was 078 second batch: wrong type label) ---
q = qmap['en_grammar_088']
q['type'] = 'multiple_choice'
q['ability_tag'] = '语法选择'
q['question'] = "选择正确的答案填空。\n\nI'm interested ______ collecting stamps."
q['options'] = ["A. in", "B. on", "C. at", "D. for"]
q['answer'] = "A"
q['analysis'] = "【考点】本题考查be interested in固定搭配。\n【解题思路】be interested in 对...感兴趣，是固定搭配。\n【总结】常见形容词+介词：be good at, be afraid of, be proud of, be famous for, be interested in。"

# --- 4j: Fix en_grammar_085 (was 075 second batch: answer separator) ---
q = qmap['en_grammar_085']
q['answer'] = "will be|is going to be"

# --- 4k: Handle duplicate 043≈103 (was 093, renumbered to 103) ---
q = qmap['en_grammar_103']
q['question'] = "选择正确的应答句。\n\n—I'm sorry I can't go to your birthday party.\n—______"
q['options'] = [
    "A. That's all right.",
    "B. You're welcome.",
    "C. Thank you.",
    "D. Good idea."
]
q['answer'] = "A"
q['analysis'] = "【考点】本题考查委婉拒绝道歉的应答。\n【解题思路】对方因不能参加聚会而道歉，应表示没关系。\n【总结】对方道歉时：That's all right. / It doesn't matter. / Never mind."

# --- 4l: Handle duplicate 077≈101 (was 091, renumbered to 101) ---
q = qmap['en_grammar_101']
q['question'] = "选择正确的答案填空。\n\nThe girl ______ father is a doctor studies very hard."
q['options'] = [
    "A. who",
    "B. which",
    "C. whose",
    "D. whom"
]
q['answer'] = "C"
q['analysis'] = "【考点】本题考查定语从句关系代词whose的用法。\n【解题思路】先行词the girl指人，关系代词在从句中作father的定语，用whose。\n【总结】whose表示所属关系，可指人也可指物。"

# --- 4m: Handle duplicate 026≈099 (was 089, renumbered to 099) - differentiate ---
q = qmap['en_grammar_099']
q['question'] = "选择正确的句子补全对话。\n\n—Hello, may I speak to Mr. Wang?\n—______\n—OK. Please tell him Tom called.\n—Sure. I'll let him know."
q['options'] = [
    "A. This is Mr. Wang.",
    "B. Hold on, please.",
    "C. Sorry, he's not in. Can I take a message?",
    "D. Who are you?"
]
q['answer'] = "C"
q['analysis'] = "【考点】本题考查电话中对方不在时的应答。\n【解题思路】后文说\"请告诉他Tom打来电话\"，说明Mr. Wang不在。\n【总结】电话找人不在：Sorry, he/she is not in. Can I take a message?"

# ── Step 5: Add missing questions (003, 031-040) ──
missing = [
    {
        "id": "en_grammar_003",
        "subject": "english",
        "knowledge_tag": "英语语法",
        "ability_tag": "语法选择",
        "type": "multiple_choice",
        "question": "选择正确的答案填空。\n\nThese are my books. ______ are on the desk.",
        "options": ["A. They", "B. Their", "C. Them", "D. Theirs"],
        "answer": "A",
        "analysis": "【考点】本题考查人称代词主格的用法。\n【解题思路】空格处作主语，应使用主格They（指代books）。\n【总结】人称代词主格作主语：I, you, he, she, it, we, they。宾格作宾语：me, you, him, her, it, us, them。",
        "difficulty": 0.3
    },
    {
        "id": "en_grammar_031",
        "subject": "english",
        "knowledge_tag": "英语语法",
        "ability_tag": "语法选择",
        "type": "multiple_choice",
        "question": "选择正确的答案填空。\n\nLook! The children ______ in the playground.",
        "options": ["A. play", "B. plays", "C. are playing", "D. played"],
        "answer": "C",
        "analysis": "【考点】本题考查现在进行时。\n【解题思路】\"Look!\"提示动作正在发生，用现在进行时are playing。主语children是复数。\n【总结】现在进行时：be + doing。标志词：look, listen, now, at the moment。",
        "difficulty": 0.3
    },
    {
        "id": "en_grammar_032",
        "subject": "english",
        "knowledge_tag": "英语语法",
        "ability_tag": "词形变换",
        "type": "fill_blank",
        "question": "用所给单词的适当形式填空。\n\nThere are many ______ (child) in the park.",
        "options": [],
        "answer": "children",
        "analysis": "【考点】本题考查不规则名词复数。\n【解题思路】many后接可数名词复数，child的复数是children。\n【总结】常见不规则复数：man→men, woman→women, child→children, foot→feet, tooth→teeth。",
        "difficulty": 0.3
    },
    {
        "id": "en_grammar_033",
        "subject": "english",
        "knowledge_tag": "英语语法",
        "ability_tag": "语法选择",
        "type": "multiple_choice",
        "question": "选择正确的答案填空。\n\nWe don't have ______ classes on Sunday.",
        "options": ["A. some", "B. any", "C. a", "D. much"],
        "answer": "B",
        "analysis": "【考点】本题考查不定代词在否定句中的用法。\n【解题思路】否定句中用any代替some。classes是可数名词复数，不用much。\n【总结】some用于肯定句，any用于否定句和疑问句。",
        "difficulty": 0.3
    },
    {
        "id": "en_grammar_034",
        "subject": "english",
        "knowledge_tag": "英语语法",
        "ability_tag": "情景交际",
        "type": "multiple_choice",
        "question": "选择正确的应答句。\n\n—What's your favorite season?\n—______",
        "options": ["A. I like summer.", "B. Yes, I do.", "C. It's hot.", "D. I'm fine."],
        "answer": "A",
        "analysis": "【考点】本题考查询问喜好的回答。\n【解题思路】What's your favorite...? 询问最喜欢的，应直接回答喜欢的事物。\n【总结】询问喜好：What's your favorite...? 回答直接说出喜欢的事物。",
        "difficulty": 0.3
    },
    {
        "id": "en_grammar_035",
        "subject": "english",
        "knowledge_tag": "英语语法",
        "ability_tag": "语法选择",
        "type": "multiple_choice",
        "question": "选择正确的答案填空。\n\nShe often ______ shopping with her mother on weekends.",
        "options": ["A. go", "B. goes", "C. going", "D. went"],
        "answer": "B",
        "analysis": "【考点】本题考查一般现在时第三人称单数。\n【解题思路】often提示一般现在时，主语She是第三人称单数，go→goes。\n【总结】三单动词变化：一般加s；以s,x,sh,ch,o结尾加es；辅音+y变y为i加es。",
        "difficulty": 0.4
    },
    {
        "id": "en_grammar_036",
        "subject": "english",
        "knowledge_tag": "英语语法",
        "ability_tag": "词形变换",
        "type": "fill_blank",
        "question": "用所给单词的适当形式填空。\n\nShe ______ (not watch) TV on school nights.",
        "options": [],
        "answer": "doesn't watch",
        "analysis": "【考点】本题考查一般现在时否定句。\n【解题思路】主语She三单，否定用doesn't + 动词原形。\n【总结】三单否定：doesn't + 动词原形；其他主语：don't + 动词原形。",
        "difficulty": 0.4
    },
    {
        "id": "en_grammar_037",
        "subject": "english",
        "knowledge_tag": "英语语法",
        "ability_tag": "语法选择",
        "type": "multiple_choice",
        "question": "选择正确的答案填空。\n\nMy aunt works ______ a nurse in the hospital.",
        "options": ["A. as", "B. like", "C. for", "D. with"],
        "answer": "A",
        "analysis": "【考点】本题考查work as的固定搭配。\n【解题思路】work as表示\"担任...职务\"。\n【总结】work as + 职业（担任...），work for + 公司/人，work with + 人（与...一起工作）。",
        "difficulty": 0.4
    },
    {
        "id": "en_grammar_038",
        "subject": "english",
        "knowledge_tag": "英语语法",
        "ability_tag": "情景交际",
        "type": "multiple_choice",
        "question": "选择正确的句子补全对话。\n\n—How do you go to school?\n—______",
        "options": ["A. By bike.", "B. At seven.", "C. It's far.", "D. I like school."],
        "answer": "A",
        "analysis": "【考点】本题考查询问交通方式的回答。\n【解题思路】How问方式，用\"By + 交通工具\"回答。\n【总结】How问方式→By bus/bike/car。What time问时间→At + 时间。",
        "difficulty": 0.3
    },
    {
        "id": "en_grammar_039",
        "subject": "english",
        "knowledge_tag": "英语语法",
        "ability_tag": "语法选择",
        "type": "multiple_choice",
        "question": "选择正确的答案填空。\n\nHe runs ______ faster than his classmates.",
        "options": ["A. very", "B. much", "C. more", "D. most"],
        "answer": "B",
        "analysis": "【考点】本题考查比较级的修饰语。\n【解题思路】much可以修饰比较级，表示\"...得多\"。very不能修饰比较级。\n【总结】修饰比较级：much, a lot, a little, even, far。修饰原级：very, quite, really。",
        "difficulty": 0.6
    },
    {
        "id": "en_grammar_040",
        "subject": "english",
        "knowledge_tag": "英语语法",
        "ability_tag": "词形变换",
        "type": "fill_blank",
        "question": "用所给单词的适当形式填空。\n\nLet me ______ (help) you with your bags.",
        "options": [],
        "answer": "help",
        "analysis": "【考点】本题考查let sb. do sth. 句型。\n【解题思路】let后面接动词原形作宾语补足语。\n【总结】使役动词后接动词原形：let sb. do, make sb. do, have sb. do。",
        "difficulty": 0.4
    }
]

# ── Step 6: Assign difficulty to all questions ──
# The renumbering scheme:
# Original Part B: 071(dup)->081, 072(dup)->082, ..., 080(dup)->090, 081->091, ..., 100->110
# So we map original IDs to new IDs for Part B questions
part_b_remap = {f"en_grammar_{n:03d}": f"en_grammar_{n+10:03d}" for n in range(71, 101)}

difficulty_map = {
    # Basic (0.3)
    'en_grammar_001': 0.3, 'en_grammar_002': 0.3, 'en_grammar_003': 0.3,
    'en_grammar_004': 0.3, 'en_grammar_005': 0.3, 'en_grammar_006': 0.3,
    'en_grammar_009': 0.3, 'en_grammar_013': 0.3, 'en_grammar_016': 0.3,
    'en_grammar_017': 0.3, 'en_grammar_019': 0.3, 'en_grammar_023': 0.3,
    'en_grammar_029': 0.3, 'en_grammar_031': 0.3, 'en_grammar_032': 0.3,
    'en_grammar_033': 0.3, 'en_grammar_034': 0.3, 'en_grammar_038': 0.3,
    'en_grammar_043': 0.3, 'en_grammar_046': 0.3, 'en_grammar_053': 0.3,
    'en_grammar_056': 0.3, 'en_grammar_059': 0.3, 'en_grammar_063': 0.3,
    'en_grammar_066': 0.3, 'en_grammar_069': 0.3, 'en_grammar_073': 0.3,
    'en_grammar_076': 0.3,
    # Part B basic (0.3)
    'en_grammar_083': 0.3, 'en_grammar_086': 0.3,  # was 073, 076
    # Medium-low (0.4)
    'en_grammar_007': 0.4, 'en_grammar_008': 0.4, 'en_grammar_011': 0.4,
    'en_grammar_012': 0.4, 'en_grammar_014': 0.4, 'en_grammar_015': 0.4,
    'en_grammar_021': 0.4, 'en_grammar_022': 0.4, 'en_grammar_025': 0.4,
    'en_grammar_026': 0.4, 'en_grammar_027': 0.4, 'en_grammar_035': 0.4,
    'en_grammar_036': 0.4, 'en_grammar_037': 0.4, 'en_grammar_040': 0.4,
    'en_grammar_041': 0.4, 'en_grammar_047': 0.4, 'en_grammar_051': 0.4,
    'en_grammar_052': 0.4, 'en_grammar_054': 0.4, 'en_grammar_057': 0.4,
    'en_grammar_065': 0.4, 'en_grammar_067': 0.4, 'en_grammar_068': 0.4,
    'en_grammar_071': 0.4, 'en_grammar_072': 0.4, 'en_grammar_088': 0.4,
    # Part B medium-low (0.4)
    'en_grammar_082': 0.4, 'en_grammar_092': 0.4, 'en_grammar_099': 0.4,
    'en_grammar_102': 0.4, 'en_grammar_106': 0.4, 'en_grammar_112': 0.4,
    # Medium (0.5)
    'en_grammar_010': 0.5, 'en_grammar_018': 0.5, 'en_grammar_020': 0.5,
    'en_grammar_024': 0.5, 'en_grammar_028': 0.5, 'en_grammar_030': 0.5,
    'en_grammar_042': 0.5, 'en_grammar_045': 0.5, 'en_grammar_049': 0.5,
    'en_grammar_050': 0.5, 'en_grammar_055': 0.5, 'en_grammar_058': 0.5,
    'en_grammar_060': 0.5, 'en_grammar_061': 0.5, 'en_grammar_062': 0.5,
    'en_grammar_070': 0.5, 'en_grammar_075': 0.5, 'en_grammar_080': 0.5,
    # Part B medium (0.5)
    'en_grammar_081': 0.5, 'en_grammar_085': 0.5, 'en_grammar_087': 0.5,
    'en_grammar_090': 0.5, 'en_grammar_095': 0.5, 'en_grammar_098': 0.5,
    'en_grammar_105': 0.5, 'en_grammar_108': 0.5, 'en_grammar_110': 0.5,
    # Medium-high (0.6)
    'en_grammar_039': 0.6, 'en_grammar_044': 0.6, 'en_grammar_064': 0.6,
    'en_grammar_078': 0.6, 'en_grammar_084': 0.6, 'en_grammar_091': 0.6,
    'en_grammar_094': 0.6, 'en_grammar_101': 0.6, 'en_grammar_104': 0.6,
    # Hard (0.7)
    'en_grammar_048': 0.7, 'en_grammar_074': 0.7, 'en_grammar_089': 0.7,
    'en_grammar_097': 0.7, 'en_grammar_114': 0.7,
}

# Apply difficulty
for q in all_questions:
    qid = q['id']
    if qid in difficulty_map:
        q['difficulty'] = difficulty_map[qid]
    else:
        q['difficulty'] = 0.5  # default

for q in missing:
    if q['id'] in difficulty_map:
        q['difficulty'] = difficulty_map[q['id']]

# ── Step 7: Insert missing questions into correct positions ──
# Insert 003 after 002, 031-040 after 030

final = []
for q in all_questions:
    num = int(q['id'].split('_')[-1])
    final.append(q)
    if num == 2:
        final.append(missing[0])  # 003
    elif num == 30:
        for mq in missing[1:]:  # 031-040
            final.append(mq)

# ── Step 8: Final verification ──
print(f"\n{'='*60}")
print(f"FINAL VERIFICATION")
print(f"{'='*60}")
print(f"Total questions: {len(final)}")

ids = [q['id'] for q in final]
unique_ids = set(ids)
print(f"Unique IDs: {len(unique_ids)}")
dupes = [item for item, count in Counter(ids).items() if count > 1]
print(f"Duplicates: {dupes if dupes else 'None'}")

id_nums = [int(q['id'].split('_')[-1]) for q in final]
print(f"ID range: {min(id_nums)}-{max(id_nums)}")

expected = set(range(1, max(id_nums)+1))
actual = set(id_nums)
gaps = sorted(expected - actual)
print(f"Gaps: {gaps if gaps else 'None'}")

# Type distribution
from collections import Counter as C
types = C(q['type'] for q in final)
print(f"Type distribution: {dict(types)}")

tags = C(q['ability_tag'] for q in final)
print(f"Tag distribution: {dict(tags)}")

diffs = C(str(q['difficulty']) for q in final)
print(f"Difficulty distribution: {dict(diffs)}")

# Answer distribution for MC
mc_answers = C(q['answer'].strip() for q in final if q['type'] == 'multiple_choice')
print(f"MC answer distribution: {dict(mc_answers)}")

# ── Step 9: Write output ──
with open('/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/questions_en_grammar.json', 'w', encoding='utf-8') as f:
    json.dump(final, f, ensure_ascii=False, indent=2)

print(f"\nOutput written to src/data/questions_en_grammar.json")
