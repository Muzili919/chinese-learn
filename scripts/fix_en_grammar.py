#!/usr/bin/env python3
"""Fix all issues in the English grammar question bank."""

import json
import copy

# Read original data
with open('/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/questions_en_grammar.json', 'r', encoding='utf-8') as f:
    raw = json.load(f)

# ============================================================
# STEP 1: Separate the two batches of duplicate IDs
# ============================================================
# First 80 questions: 001-002, 004-030, 041-100 (but 071-100 have duplicates)
# Actually the structure is:
#   - 001-002, 004-030 (no 003, no 031-040)
#   - 041-100
#   - Then another set of 071-080 (duplicates, should become 081-090)
#   - Then 081-100 (these should become 091-110 after renumbering)

first_batch_071_to_100 = []
second_batch_071_to_100 = []

found_first_batch = False
found_second_batch = False

for i, q in enumerate(raw):
    if q['id'] == 'en_grammar_071':
        if not found_first_batch:
            found_first_batch = True
            first_batch_start = i
        elif not found_second_batch:
            found_second_batch = True
            second_batch_start = i

# First batch: indices [first_batch_start .. second_batch_start-1]
first_batch = raw[first_batch_start:second_batch_start]
# Second batch: indices [second_batch_start .. end]
second_batch = raw[second_batch_start:]

# Questions before first batch: 001-002, 004-030, 041-070
before_first_batch = raw[:first_batch_start]

# ============================================================
# STEP 2: Renumber the second batch (original 071-080 -> 081-090)
# ============================================================
id_remap = {}
for q in second_batch:
    old_id = q['id']
    old_num = int(old_id.split('_')[-1])
    new_num = old_num + 10  # 071->081, 072->082, ..., 100->110
    new_id = f"en_grammar_{new_num:03d}"
    id_remap[old_id] = new_id
    q['id'] = new_id

print(f"Renumbered {len(second_batch)} questions in second batch")
print(f"ID mapping: {id_remap}")

# ============================================================
# STEP 3: Handle duplicate question pairs
# ============================================================
# Duplicate 1: 043 ≈ 093 (both about "Thank you for helping me with my English/homework")
# Keep 043 (English), modify 093 (now 103 after renumbering) to a different scenario
duplicate_093_id = id_remap.get('en_grammar_093', 'en_grammar_093')
for q in second_batch:
    if q['id'] == duplicate_093_id:
        q['question'] = "选择正确的应答句。\n\n—I'm sorry I can't go to your birthday party.\n—______"
        q['options'] = [
            "A. That's all right.",
            "B. You're welcome.",
            "C. Thank you.",
            "D. Good idea."
        ]
        q['answer'] = "A"
        q['analysis'] = "【考点】本题考查委婉拒绝道歉的应答。\n【解题思路】对方因不能参加聚会而道歉，应表示没关系。That's all right. 表示\"没关系\"，是标准的安慰应答。\n【总结】对方道歉时常用：That's all right. / It doesn't matter. / Never mind. / No problem."
        break

# Duplicate 2: 077 ≈ 091 (both about relative clause with who, just man vs boy)
# Keep 077 (man), modify 091 (now 101) to use 'whose'
duplicate_091_id = id_remap.get('en_grammar_091', 'en_grammar_091')
for q in second_batch:
    if q['id'] == duplicate_091_id:
        q['question'] = "选择正确的答案填空。\n\nThe girl ______ father is a doctor studies very hard."
        q['options'] = [
            "A. who",
            "B. which",
            "C. whose",
            "D. whom"
        ]
        q['answer'] = "C"
        q['analysis'] = "【考点】本题考查定语从句关系代词whose的用法。\n【解题思路】先行词the girl指人，关系代词在从句中作father的定语，表示\"她的父亲\"，用whose。\n【总结】whose表示所属关系，可指人也可指物，在从句中作定语。"
        break

# Duplicate 3: 026 ≈ 089 (both telephone conversations)
# 026: person IS there (Hold on, please)
# 089 (now 099): person NOT there (Can I take a message?)
# These are actually different enough in context - keep both but differentiate more clearly
duplicate_089_id = id_remap.get('en_grammar_089', 'en_grammar_089')
for q in second_batch:
    if q['id'] == duplicate_089_id:
        # Keep as is - the contexts are different (person available vs not available)
        # Just ensure the dialogue flow is clear
        q['question'] = "选择正确的句子补全对话。\n\n—Hello, may I speak to Mr. Wang?\n—______\n—OK. Please tell him Tom called.\n—Sure. I'll let him know."
        q['options'] = [
            "A. This is Mr. Wang.",
            "B. Hold on, please.",
            "C. Sorry, he's not in. Can I take a message?",
            "D. Who are you?"
        ]
        q['answer'] = "C"
        q['analysis'] = "【考点】本题考查电话中对方不在时的应答。\n【解题思路】后文说\"请告诉他Tom打来电话\"，说明Mr. Wang不在，需要留言。\n【总结】电话找人不在：Sorry, he/she is not in/here. Can I take a message? / Would you like to leave a message?"
        break

# ============================================================
# STEP 4: Fix answer ambiguity in en_grammar_024
# ============================================================
for q in raw:
    if q['id'] == 'en_grammar_024':
        # Rewrite question stem to make the contrast clearer
        q['question'] = "选择正确的答案填空。\n\nI asked my sister to eat apples, ______ she chose bananas instead."
        q['answer'] = "B"
        q['analysis'] = "【考点】本题考查并列连词but表示转折。\n【解题思路】前半句\"我让妹妹吃苹果\"，后半句\"她却选择了香蕉\"，两者有明显的转折对比关系，用but。\n【总结】连词：and（和，而且），but（但是，表示转折），or（或者，否则），so（所以）。"
        break

# ============================================================
# STEP 5: Fix question type misclassification (025, 065, 078 second batch)
# ============================================================
# en_grammar_025: "用所给单词的适当形式填空" but (a/an) is a choice
for q in raw:
    if q['id'] == 'en_grammar_025':
        q['type'] = 'multiple_choice'
        q['ability_tag'] = '语法选择'
        q['question'] = "选择正确的答案填空。\n\nWhat ______ interesting story it is!"
        q['options'] = ["A. a", "B. an", "C. the", "D. /"]
        q['answer'] = "B"
        q['analysis'] = "【考点】本题考查不定冠词a和an的用法。\n【解题思路】interesting以元音音素开头，用an。\n【总结】a用于辅音音素开头的单词前，an用于元音音素开头的单词前。注意看音素，不是看字母，如an hour, a university。"
        break

# en_grammar_065: "用所给单词的适当形式填空" but (Can/Could) is a choice
for q in raw:
    if q['id'] == 'en_grammar_065':
        q['type'] = 'multiple_choice'
        q['ability_tag'] = '语法选择'
        q['question'] = "选择正确的答案填空。\n\n______ you please pass me the salt?"
        q['options'] = ["A. Can", "B. Could", "C. Will", "D. Must"]
        q['answer'] = "B"
        q['analysis'] = "【考点】本题考查情态动词表示礼貌请求。\n【解题思路】Could you please...? 比Can you please...? 更礼貌，\"please\"提示需要选择更委婉的表达。\n【总结】请求常用：Could you...? (最礼貌) / Can you...? / Would you please...? / Would you mind...?"
        break

# en_grammar_078 (second batch, now 088): "用所给单词的适当形式填空" but (in/on/at) is a choice
for q in second_batch:
    if q['id'] == 'en_grammar_088':
        q['type'] = 'multiple_choice'
        q['ability_tag'] = '语法选择'
        q['question'] = "选择正确的答案填空。\n\nI'm interested ______ collecting stamps."
        q['options'] = ["A. in", "B. on", "C. at", "D. for"]
        q['answer'] = "A"
        q['analysis'] = "【考点】本题考查be interested in固定搭配。\n【解题思路】be interested in 对...感兴趣，是固定搭配。\n【总结】常见形容词+介词：be good at, be afraid of, be proud of, be famous for, be interested in, be different from。"
        break

# ============================================================
# STEP 6: Fix other design issues
# ============================================================
# en_grammar_006: Replace B option with better distractor
for q in raw:
    if q['id'] == 'en_grammar_006':
        q['options'] = [
            "A. That's right.",
            "B. Not at all.",
            "C. You're welcome.",
            "D. All right."
        ]
        q['analysis'] = "【考点】本题考查致谢的应答。\n【解题思路】\"Thank you\"的常见回答是\"You're welcome.\"。\n【总结】致谢应答：You're welcome. / That's OK. / Not at all. / My pleasure. 注意\"Not at all\"也是致谢应答，与\"No, thanks\"（拒绝提议）不同。"
        break

# en_grammar_012: Fix answer separator / -> |
for q in raw:
    if q['id'] == 'en_grammar_012':
        q['answer'] = "will visit|are going to visit"
        q['analysis'] = "【考点】本题考查一般将来时的两种表达。\n【解题思路】时间状语next week表示将来，可用will + 动词原形或be going to + 动词原形。主语They（复数），be动词用are。\n【总结】一般将来时标志词：tomorrow, next week/month/year, in the future, soon。will do和be going to do均表示将来。"
        break

# en_grammar_015: Improve instruction clarity
for q in raw:
    if q['id'] == 'en_grammar_015':
        q['question'] = "用所给单词的适当时态填空。\n\n______ (Can) you swim when you were five?"
        q['analysis'] = "【考点】本题考查情态动词can的过去式。\n【解题思路】when you were five表示过去的时间，can的过去式是could。\n【总结】can表能力，过去式是could；could语气也更委婉。注意句首大写。"
        break

# en_grammar_049: Rewrite illogical question
for q in raw:
    if q['id'] == 'en_grammar_049':
        q['question'] = "选择正确的应答句。\n\n—I didn't catch what you said. ______\n—Sure. I said the station is on the left."
        q['options'] = [
            "A. Could you say that again?",
            "B. Thank you.",
            "C. I'm sorry.",
            "D. That's OK."
        ]
        q['answer'] = "A"
        q['analysis'] = "【考点】本题考查请求对方重复的用语。\n【解题思路】\"I didn't catch what you said.\"表示没听清，应请求对方再说一遍。\"Could you say that again?\"是礼貌的请求重复表达。\n【总结】请求重复：Pardon? / Excuse me? / Could you say that again? / I didn't catch that. / Could you repeat that?"
        break

# en_grammar_086: Fix ambiguous answer
for q in raw:
    if q['id'] == 'en_grammar_086':
        q['options'] = [
            "A. Don't worry.",
            "B. That's great!",
            "C. You're welcome.",
            "D. Congratulations!"
        ]
        q['answer'] = "A"
        q['analysis'] = "【考点】本题考查安慰与鼓励的表达。\n【解题思路】对方考试失利，应安慰并鼓励。\"Don't worry.\"表示\"别担心\"，是标准的安慰用语，后接鼓励性话语。\n【总结】安慰鼓励：Don't worry. / Never mind. / You can do it. / Cheer up!"
        break

# Also fix 075 second batch (now 085) answer separator
for q in second_batch:
    if q['id'] == 'en_grammar_085':
        q['answer'] = "will be|is going to be"
        q['analysis'] = "【考点】本题考查there be句型的一般将来时。\n【解题思路】tomorrow afternoon将来时间，there be的将来时为there will be或there is going to be。\n【总结】there be将来时：There will be + 名词 / There is/are going to be + 名词。"
        break

# ============================================================
# STEP 7: Add missing questions (003 and 031-040)
# ============================================================

missing_questions = [
    {
        "id": "en_grammar_003",
        "subject": "english",
        "knowledge_tag": "英语语法",
        "ability_tag": "语法选择",
        "type": "multiple_choice",
        "question": "选择正确的答案填空。\n\nThese are my books. ______ are on the desk.",
        "options": [
            "A. They",
            "B. Their",
            "C. Them",
            "D. Theirs"
        ],
        "answer": "A",
        "analysis": "【考点】本题考查人称代词主格的用法。\n【解题思路】空格处作主语，应使用主格人称代词They（指代books）。\n【总结】人称代词主格作主语：I, you, he, she, it, we, you, they。宾格作宾语：me, you, him, her, it, us, you, them。",
        "difficulty": 0.3
    },
    {
        "id": "en_grammar_031",
        "subject": "english",
        "knowledge_tag": "英语语法",
        "ability_tag": "语法选择",
        "type": "multiple_choice",
        "question": "选择正确的答案填空。\n\nLook! The children ______ in the playground.",
        "options": [
            "A. play",
            "B. plays",
            "C. are playing",
            "D. played"
        ],
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
        "question": "用所给单词的适当形式填空。\n\nThe ______ (child) are playing games happily.",
        "options": [],
        "answer": "children",
        "analysis": "【考点】本题考查名词复数的不规则变化。\n【解题思路】The后接复数名词，child的复数是children。\n【总结】常见不规则复数：man→men, woman→women, child→children, foot→feet, tooth→teeth, mouse→mice。",
        "difficulty": 0.3
    },
    {
        "id": "en_grammar_033",
        "subject": "english",
        "knowledge_tag": "英语语法",
        "ability_tag": "语法选择",
        "type": "multiple_choice",
        "question": "选择正确的答案填空。\n\nWe don't have ______ classes on Sunday.",
        "options": [
            "A. some",
            "B. any",
            "C. a",
            "D. much"
        ],
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
        "options": [
            "A. I like summer.",
            "B. Yes, I do.",
            "C. It's hot.",
            "D. I'm fine."
        ],
        "answer": "A",
        "analysis": "【考点】本题考查询问喜好的回答。\n【解题思路】What's your favorite...? 询问最喜欢的...，应直接回答喜欢的选项。\n【总结】询问喜好：What's your favorite...? / Which do you like better? 回答直接说出喜欢的事物。",
        "difficulty": 0.3
    },
    {
        "id": "en_grammar_035",
        "subject": "english",
        "knowledge_tag": "英语语法",
        "ability_tag": "语法选择",
        "type": "multiple_choice",
        "question": "选择正确的答案填空。\n\nShe often ______ shopping with her mother on weekends.",
        "options": [
            "A. go",
            "B. goes",
            "C. going",
            "D. went"
        ],
        "answer": "B",
        "analysis": "【考点】本题考查一般现在时第三人称单数。\n【解题思路】often提示一般现在时，主语She是第三人称单数，动词加es。go→goes。\n【总结】三单动词变化规则：一般加s；以s,x,sh,ch,o结尾加es；辅音+y变y为i加es。",
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
        "analysis": "【考点】本题考查一般现在时否定句。\n【解题思路】主语She三单，否定用doesn't + 动词原形。\n【总结】三单否定：doesn't + 动词原形；其他主语否定：don't + 动词原形。注意doesn't后动词用原形。",
        "difficulty": 0.4
    },
    {
        "id": "en_grammar_037",
        "subject": "english",
        "knowledge_tag": "英语语法",
        "ability_tag": "语法选择",
        "type": "multiple_choice",
        "question": "选择正确的答案填空。\n\nMy aunt works ______ a nurse in the hospital.",
        "options": [
            "A. as",
            "B. like",
            "C. for",
            "D. with"
        ],
        "answer": "A",
        "analysis": "【考点】本题考查work as的固定搭配。\n【解题思路】work as表示\"担任...职务\"，work as a nurse表示\"做护士工作\"。\n【总结】work as + 职业（担任...），work for + 公司/人（为...工作），work with + 人（与...一起工作）。",
        "difficulty": 0.4
    },
    {
        "id": "en_grammar_038",
        "subject": "english",
        "knowledge_tag": "英语语法",
        "ability_tag": "情景交际",
        "type": "multiple_choice",
        "question": "选择正确的句子补全对话。\n\n—How do you go to school?\n—______",
        "options": [
            "A. By bike.",
            "B. At seven.",
            "C. It's far.",
            "D. I like school."
        ],
        "answer": "A",
        "analysis": "【考点】本题考查询问交通方式的回答。\n【解题思路】How问交通方式，用\"By + 交通工具\"回答。\n【总结】How do you go to...? → By bus/bike/car/on foot。What time问时间 → At + 时间。",
        "difficulty": 0.3
    },
    {
        "id": "en_grammar_039",
        "subject": "english",
        "knowledge_tag": "英语语法",
        "ability_tag": "语法选择",
        "type": "multiple_choice",
        "question": "选择正确的答案填空。\n\nHe runs ______ faster than his classmates.",
        "options": [
            "A. very",
            "B. much",
            "C. more",
            "D. most"
        ],
        "answer": "B",
        "analysis": "【考点】本题考查比较级的修饰语。\n【解题思路】much可以修饰比较级，表示\"...得多\"。very不能修饰比较级（very修饰原级）。\n【总结】修饰比较级：much, a lot, a little, even, far。修饰原级：very, quite, really, too。",
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
        "analysis": "【考点】本题考查let sb. do sth. 句型。\n【解题思路】let后面接动词原形作宾语补足语，结构为let sb. do sth。\n【总结】使役动词后接动词原形：let sb. do, make sb. do, have sb. do。",
        "difficulty": 0.4
    }
]

# ============================================================
# STEP 8: Adjust difficulty ratings for all questions
# ============================================================

def assign_difficulty(q):
    """Assign difficulty based on question content."""
    tag = q.get('ability_tag', '')
    question = q.get('question', '').lower()
    answer = q.get('answer', '')
    
    # Basic level: be verbs, simple present, basic greetings
    if tag == '语法选择':
        if any(kw in question for kw in ['is', 'are', 'am', 'be verb']):
            return 0.3
        if any(kw in question for kw in ['goes', 'every day', 'every morning', 'often']):
            return 0.3
        if 'how much' in question or 'how many' in question:
            return 0.4
        if any(kw in question for kw in ['there be', 'there is', 'there are']):
            return 0.4
        if any(kw in question for kw in ['comparative', 'than']):
            return 0.4
        if 'present perfect' in question or 'have been' in question or 'have gone' in question:
            return 0.6
        if 'passive' in question or 'will be' in question or 'was built' in question:
            return 0.7
        if 'relative clause' in answer.lower() or 'who' in answer.lower() or 'whose' in answer.lower():
            return 0.6
        if 'although' in question or 'unless' in question:
            return 0.7
        if ' subjunctive' in question or 'if' in question and 'will' in question:
            return 0.6
    
    if tag == '词形变换':
        if any(kw in question for kw in ['child', 'foot', 'tooth', 'man', 'woman', 'mouse']):
            return 0.3
        if any(kw in question for kw in ['(sing)', '(run)', '(swim)', '(eat)']):
            return 0.4
        if any(kw in question for kw in ['-ing', 'ing']):
            return 0.4
        if any(kw in question for kw in ['比较级', '最高级', '(tall)', '(good)', '(bad)']):
            return 0.5
        if any(kw in question for kw in ['过去式', '(go)', '(eat)', '(take)', '(see)']):
            return 0.4
        if any(kw in question for kw in ['被动', '(build)']):
            return 0.7
        if any(kw in question for kw in ['反身', '(he)', '(she)']):
            return 0.5
    
    if tag == '情景交际':
        return 0.3
    
    if '完形填空' in tag:
        return 0.5
    
    return 0.5

# Apply difficulty to all existing questions
for q in before_first_batch:
    q['difficulty'] = assign_difficulty(q)
for q in first_batch:
    q['difficulty'] = assign_difficulty(q)
for q in second_batch:
    q['difficulty'] = assign_difficulty(q)

# Apply specific difficulty overrides based on question content
difficulty_overrides = {
    # Basic
    'en_grammar_001': 0.3, 'en_grammar_002': 0.3, 'en_grammar_003': 0.3,
    'en_grammar_004': 0.3, 'en_grammar_005': 0.3, 'en_grammar_006': 0.3,
    'en_grammar_008': 0.4, 'en_grammar_009': 0.3, 'en_grammar_010': 0.5,
    'en_grammar_011': 0.4, 'en_grammar_014': 0.4, 'en_grammar_016': 0.3,
    'en_grammar_017': 0.3, 'en_grammar_019': 0.3, 'en_grammar_021': 0.4,
    'en_grammar_022': 0.4, 'en_grammar_023': 0.3, 'en_grammar_026': 0.4,
    'en_grammar_027': 0.4, 'en_grammar_029': 0.3, 'en_grammar_031': 0.3,
    'en_grammar_032': 0.3, 'en_grammar_033': 0.3, 'en_grammar_034': 0.3,
    'en_grammar_035': 0.4, 'en_grammar_036': 0.4, 'en_grammar_037': 0.4,
    'en_grammar_038': 0.3, 'en_grammar_040': 0.4,
    # Medium
    'en_grammar_007': 0.4, 'en_grammar_012': 0.4, 'en_grammar_013': 0.3,
    'en_grammar_015': 0.4, 'en_grammar_018': 0.5, 'en_grammar_020': 0.5,
    'en_grammar_025': 0.4, 'en_grammar_028': 0.5, 'en_grammar_030': 0.5,
    'en_grammar_039': 0.6, 'en_grammar_041': 0.4, 'en_grammar_042': 0.5,
    'en_grammar_043': 0.3, 'en_grammar_045': 0.5, 'en_grammar_046': 0.3,
    'en_grammar_047': 0.4, 'en_grammar_050': 0.5, 'en_grammar_051': 0.4,
    'en_grammar_052': 0.4, 'en_grammar_053': 0.3, 'en_grammar_054': 0.4,
    'en_grammar_055': 0.5, 'en_grammar_056': 0.3, 'en_grammar_057': 0.4,
    'en_grammar_058': 0.5, 'en_grammar_059': 0.3, 'en_grammar_060': 0.5,
    'en_grammar_061': 0.4, 'en_grammar_062': 0.5, 'en_grammar_063': 0.3,
    'en_grammar_065': 0.4, 'en_grammar_066': 0.3, 'en_grammar_067': 0.4,
    'en_grammar_068': 0.4, 'en_grammar_069': 0.3, 'en_grammar_070': 0.5,
    'en_grammar_071': 0.4, 'en_grammar_072': 0.4, 'en_grammar_073': 0.3,
    'en_grammar_075': 0.5, 'en_grammar_076': 0.3, 'en_grammar_077': 0.3,
    'en_grammar_078': 0.6, 'en_grammar_079': 0.3, 'en_grammar_080': 0.5,
    'en_grammar_081': 0.4, 'en_grammar_082': 0.5, 'en_grammar_083': 0.3,
    'en_grammar_085': 0.5, 'en_grammar_086': 0.3, 'en_grammar_088': 0.5,
    'en_grammar_089': 0.3, 'en_grammar_092': 0.4, 'en_grammar_095': 0.5,
    'en_grammar_098': 0.5, 'en_grammar_099': 0.4,
    # Hard
    'en_grammar_024': 0.5, 'en_grammar_044': 0.6, 'en_grammar_048': 0.7,
    'en_grammar_049': 0.4, 'en_grammar_064': 0.7, 'en_grammar_074': 0.7,
    'en_grammar_084': 0.7, 'en_grammar_087': 0.5, 'en_grammar_090': 0.6,
    'en_grammar_091': 0.6, 'en_grammar_094': 0.7, 'en_grammar_096': 0.4,
    'en_grammar_097': 0.7, 'en_grammar_100': 0.5,
}

# Now renumbered second batch has new IDs, need to create override map for new IDs
for old_id, new_id in id_remap.items():
    if old_id in difficulty_overrides:
        difficulty_overrides[new_id] = difficulty_overrides[old_id]

# Apply overrides
for q in before_first_batch:
    if q['id'] in difficulty_overrides:
        q['difficulty'] = difficulty_overrides[q['id']]
for q in first_batch:
    if q['id'] in difficulty_overrides:
        q['difficulty'] = difficulty_overrides[q['id']]
for q in second_batch:
    if q['id'] in difficulty_overrides:
        q['difficulty'] = difficulty_overrides[q['id']]

# ============================================================
# STEP 9: Assemble final question list
# ============================================================

# Insert missing questions in proper positions
# 003 should go between 002 and 004
# 031-040 should go between 030 and 041

q_before_003 = []
q_after_003 = []
for q in before_first_batch:
    num = int(q['id'].split('_')[-1])
    if num < 3:
        q_before_003.append(q)
    elif num == 4:
        q_after_003.append(q)
    # 005-030 go here too
    elif num >= 5 and num <= 30:
        q_after_003.append(q)

# Find where 041 starts in first_batch
q_004_to_030 = []
for q in before_first_batch:
    num = int(q['id'].split('_')[-1])
    if 4 <= num <= 30:
        q_004_to_030.append(q)
q_004_to_030.sort(key=lambda x: int(x['id'].split('_')[-1]))

# Assemble:
# 001, 002, [003], 004-030, [031-040], 041-070, 071-080, 081-110
q_001_002 = [q for q in before_first_batch if int(q['id'].split('_')[-1]) <= 2]

final_list = []
final_list.extend(q_001_002)  # 001, 002
final_list.append(missing_questions[0])  # 003
final_list.extend(q_004_to_030)  # 004-030
final_list.extend(missing_questions[1:])  # 031-040

# Add first_batch (041-080)
final_list.extend(first_batch)

# Add second_batch (now 081-110)
final_list.extend(second_batch)

# ============================================================
# STEP 10: Final verification
# ============================================================
print(f"\nTotal questions: {len(final_list)}")

# Check all IDs are unique
ids = [q['id'] for q in final_list]
unique_ids = set(ids)
if len(ids) != len(unique_ids):
    from collections import Counter
    dupes = [item for item, count in Counter(ids).items() if count > 1]
    print(f"WARNING: Duplicate IDs found: {dupes}")
else:
    print("All IDs are unique.")

# Check ID range
id_nums = sorted([int(q['id'].split('_')[-1]) for q in final_list])
print(f"ID range: {id_nums[0]} to {id_nums[-1]}")

# Check for gaps
expected = list(range(1, id_nums[-1] + 1))
gaps = [n for n in expected if n not in id_nums]
if gaps:
    print(f"WARNING: Missing IDs: {gaps}")
else:
    print("No gaps in ID sequence.")

# Count by type
type_counts = {}
for q in final_list:
    t = q['type']
    type_counts[t] = type_counts.get(t, 0) + 1
print(f"Type distribution: {type_counts}")

# Count by ability_tag
tag_counts = {}
for q in final_list:
    t = q['ability_tag']
    tag_counts[t] = tag_counts.get(t, 0) + 1
print(f"Ability tag distribution: {tag_counts}")

# Difficulty distribution
diff_counts = {'0.3': 0, '0.4': 0, '0.5': 0, '0.6': 0, '0.7': 0}
for q in final_list:
    d = str(q['difficulty'])
    if d in diff_counts:
        diff_counts[d] += 1
    else:
        diff_counts[d] = diff_counts.get(d, 0) + 1
print(f"Difficulty distribution: {diff_counts}")

# Answer distribution for multiple choice
answer_counts = {'A': 0, 'B': 0, 'C': 0, 'D': 0}
for q in final_list:
    if q['type'] == 'multiple_choice':
        a = q['answer'].strip()
        if a in answer_counts:
            answer_counts[a] += 1
print(f"Answer distribution (MC): {answer_counts}")

# Write output
with open('/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/questions_en_grammar.json', 'w', encoding='utf-8') as f:
    json.dump(final_list, f, ensure_ascii=False, indent=2)

print("\nFixed file written successfully!")
