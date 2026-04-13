#!/usr/bin/env python3
"""Fix all issues in en_reading, en_listen, and en_writing question banks."""
import json

BASE = "/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data"

with open(f"{BASE}/questions_en_reading.json", "r", encoding="utf-8") as f:
    reading = json.load(f)

with open(f"{BASE}/questions_en_listen.json", "r", encoding="utf-8") as f:
    listen = json.load(f)

with open(f"{BASE}/questions_en_writing.json", "r", encoding="utf-8") as f:
    writing = json.load(f)


# ============================================================
# PART 1: Fix questions_en_reading.json
# ============================================================
print("=== Fixing reading questions ===")

# Build lookup
rd = {q["id"]: q for q in reading}

# en_reading_001: answer format -> array, add sub_questions field
q = rd["en_reading_001"]
q["answer"] = ["F", "T", "T", "F", "T"]
q["sub_answers"] = ["F", "T", "T", "F", "T"]
q["sub_count"] = 5
print(f"  Fixed {q['id']}: answer -> array format")

# en_reading_002: add sub_questions structure
q = rd["en_reading_002"]
q["answer"] = ["B", "B", "C", "C"]
q["sub_answers"] = ["B", "B", "C", "C"]
q["sub_count"] = 4
print(f"  Fixed {q['id']}: answer -> array format")

# en_reading_003: type -> open_ended
q = rd["en_reading_003"]
q["type"] = "open_ended"
q["answer"] = "(1) He lives in Chongqing.\n(2) He went to the zoo with his parents.\n(3) The pandas ate bamboo.\n(4) They stayed there for three hours.\n(5) He ate noodles."
print(f"  Fixed {q['id']}: type -> open_ended")

# en_reading_004: type -> sort_order
q = rd["en_reading_004"]
q["type"] = "sort_order"
print(f"  Fixed {q['id']}: type -> sort_order")

# en_reading_005: mixed type, split into sub_questions
q = rd["en_reading_005"]
q["type"] = "multiple_choice"
q["answer"] = ["D", "A", "T", "F"]
q["sub_answers"] = ["D", "A", "T", "F"]
q["sub_count"] = 4
q["options"] = []
print(f"  Fixed {q['id']}: answer -> array, options cleared (sub-questions in text)")

# en_reading_006: standard, answer format
q = rd["en_reading_006"]
q["answer"] = ["B", "A", "B", "C", "C"]
q["sub_answers"] = ["B", "A", "B", "C", "C"]
q["sub_count"] = 5
print(f"  Fixed {q['id']}: answer -> array format")

# en_reading_007: answer format -> array
q = rd["en_reading_007"]
q["answer"] = ["F", "T", "T", "F", "F"]
q["sub_answers"] = ["F", "T", "T", "F", "F"]
q["sub_count"] = 5
print(f"  Fixed {q['id']}: answer -> array format")

# en_reading_008: type -> open_ended
q = rd["en_reading_008"]
q["type"] = "open_ended"
print(f"  Fixed {q['id']}: type -> open_ended")

# en_reading_009: type -> sort_order
q = rd["en_reading_009"]
q["type"] = "sort_order"
print(f"  Fixed {q['id']}: type -> sort_order")

# en_reading_010: standard, answer format
q = rd["en_reading_010"]
q["answer"] = ["C", "C", "C", "C"]
q["sub_answers"] = ["C", "C", "C", "C"]
q["sub_count"] = 4
print(f"  Fixed {q['id']}: answer -> array format")

# en_reading_011: answer format -> array
q = rd["en_reading_011"]
q["answer"] = ["F", "T", "F", "F", "T"]
q["sub_answers"] = ["F", "T", "F", "F", "T"]
q["sub_count"] = 5
print(f"  Fixed {q['id']}: answer -> array format")

# en_reading_012: standard, answer format
q = rd["en_reading_012"]
q["answer"] = ["B", "C", "C", "B", "C"]
q["sub_answers"] = ["B", "C", "C", "B", "C"]
q["sub_count"] = 5
print(f"  Fixed {q['id']}: answer -> array format")

# en_reading_013: type -> open_ended
q = rd["en_reading_013"]
q["type"] = "open_ended"
print(f"  Fixed {q['id']}: type -> open_ended")

# en_reading_014: type -> sort_order
q = rd["en_reading_014"]
q["type"] = "sort_order"
print(f"  Fixed {q['id']}: type -> sort_order")

# en_reading_015: standard, answer format
q = rd["en_reading_015"]
q["answer"] = ["C", "D", "B", "B", "C"]
q["sub_answers"] = ["C", "D", "B", "B", "C"]
q["sub_count"] = 5
print(f"  Fixed {q['id']}: answer -> array format")

# en_reading_016: answer format -> array
q = rd["en_reading_016"]
q["answer"] = ["T", "F", "F", "T", "F"]
q["sub_answers"] = ["T", "F", "F", "T", "F"]
q["sub_count"] = 5
print(f"  Fixed {q['id']}: answer -> array format")

# en_reading_017: standard, answer format
q = rd["en_reading_017"]
q["answer"] = ["C", "B", "C", "C", "B"]
q["sub_answers"] = ["C", "B", "C", "C", "B"]
q["sub_count"] = 5
print(f"  Fixed {q['id']}: answer -> array format")

# en_reading_018: type -> open_ended
q = rd["en_reading_018"]
q["type"] = "open_ended"
print(f"  Fixed {q['id']}: type -> open_ended")

# en_reading_019: type -> sort_order
q = rd["en_reading_019"]
q["type"] = "sort_order"
print(f"  Fixed {q['id']}: type -> sort_order")

# en_reading_020: fix options and answer
q = rd["en_reading_020"]
q["options"] = []
q["answer"] = ["B", "D", "B", "C", "C"]
q["sub_answers"] = ["B", "D", "B", "C", "C"]
q["sub_count"] = 5
print(f"  Fixed {q['id']}: options cleared, answer -> array")

# Save reading
with open(f"{BASE}/questions_en_reading.json", "w", encoding="utf-8") as f:
    json.dump(reading, f, ensure_ascii=False, indent=2)
print("  Saved questions_en_reading.json")

# ============================================================
# PART 2: Fix questions_en_listen.json
# ============================================================
print("\n=== Fixing listening questions ===")

ld = {q["id"]: q for q in listen}

# Fix all "听录音选图" questions (no real images)
IMAGE_Q_IDS = ["en_listen_001", "en_listen_006", "en_listen_011", "en_listen_016",
               "en_listen_021", "en_listen_026", "en_listen_031", "en_listen_036",
               "en_listen_041", "en_listen_046"]

IMAGE_FIXES = {
    "en_listen_001": {
        "new_question": "阅读下面内容，选择正确的描述。",
        "new_options": [
            "A. A red schoolbag",
            "B. A blue and white schoolbag",
            "C. A green schoolbag",
            "D. A yellow schoolbag"
        ]
    },
    "en_listen_006": {
        "new_question": "阅读下面内容，选择正确的描述。",
        "new_options": [
            "A. The dog is sleeping on the sofa.",
            "B. The dog is sleeping under the tree.",
            "C. The dog is sleeping on the chair.",
            "D. The dog is sleeping on the table."
        ]
    },
    "en_listen_011": {
        "new_question": "阅读下面内容，选择正确的描述。",
        "new_options": [
            "A. A policeman in a police station.",
            "B. A doctor in a hospital.",
            "C. A teacher in a classroom.",
            "D. A farmer on a farm."
        ]
    },
    "en_listen_016": {
        "new_question": "阅读下面内容，选择正确的描述。",
        "new_options": [
            "A. A boy is running in the park.",
            "B. A boy is riding a bike in the park.",
            "C. A boy is swimming in the park.",
            "D. A boy is skating in the park."
        ]
    },
    "en_listen_021": {
        "new_question": "阅读下面内容，选择正确的描述。",
        "new_options": [
            "A. The cat is under the bed.",
            "B. The cat is on the sofa.",
            "C. The cat is on the chair.",
            "D. The cat is on the table."
        ]
    },
    "en_listen_026": {
        "new_question": "阅读下面内容，选择正确的描述。",
        "new_options": [
            "A. By bike",
            "B. By bus",
            "C. On foot",
            "D. By subway"
        ]
    },
    "en_listen_031": {
        "new_question": "阅读下面内容，选择正确的描述。",
        "new_options": [
            "A. Wearing a green T-shirt and black pants.",
            "B. Wearing a red T-shirt and blue jeans.",
            "C. Wearing a yellow T-shirt and gray shorts.",
            "D. Wearing a white shirt and brown pants."
        ]
    },
    "en_listen_036": {
        "new_question": "阅读下面内容，选择正确的描述。",
        "new_options": [
            "A. The park is between the cinema and the school.",
            "B. The school is between the park and the cinema.",
            "C. The cinema is between the park and the school.",
            "D. The park is between the school and the cinema."
        ]
    },
    "en_listen_041": {
        "new_question": "阅读下面内容，选择正确的描述。",
        "new_options": [
            "A. A bowl of noodles with beef.",
            "B. A bowl of noodles with vegetables.",
            "C. A bowl of rice with chicken.",
            "D. A bowl of rice with fish."
        ]
    },
    "en_listen_046": {
        "new_question": "阅读下面内容，选择正确的描述。",
        "new_options": [
            "A. Go straight. The bank is on the left.",
            "B. Turn right. The bank is on the right.",
            "C. Turn left. The bank is on the right.",
            "D. Turn left. The bank is on the left."
        ]
    }
}

for qid in IMAGE_Q_IDS:
    q = ld[qid]
    fix = IMAGE_FIXES[qid]
    q["question"] = fix["new_question"]
    q["options"] = fix["new_options"]
    q["ability_tag"] = "阅读理解"
    print(f"  Fixed {qid}: question and options updated for no-image scenario")

# Fix en_listen_009/019/029/039/049: extract options from listening_text to options field
LISTEN_OPT_Q = {
    "en_listen_009": {
        "new_options": ["A. read", "B. reads", "C. reading", "D. to read"],
        "new_listening_text": "I often ______ books on the weekend."
    },
    "en_listen_019": {
        "new_options": ["A. is", "B. are", "C. am", "D. be"],
        "new_listening_text": "There ______ a pen and two pencils on the desk."
    },
    "en_listen_029": {
        "new_options": ["A. play", "B. plays", "C. is playing", "D. are playing"],
        "new_listening_text": "Look! The boys ______ football on the playground."
    },
    "en_listen_039": {
        "new_options": ["A. a", "B. an", "C. the", "D. /"],
        "new_listening_text": "This is ______ umbrella. It's new."
    },
    "en_listen_049": {
        "new_options": ["A. is", "B. are", "C. am", "D. be"],
        "new_listening_text": "There ______ a pen and two books on the desk."
    }
}

for qid, fix in LISTEN_OPT_Q.items():
    q = ld[qid]
    q["options"] = fix["new_options"]
    q["listening_text"] = fix["new_listening_text"]
    q["type"] = "multiple_choice"
    print(f"  Fixed {qid}: extracted options from listening_text, type -> multiple_choice")

# Fix en_listen_015: improve uniqueness of answer
q = ld["en_listen_015"]
q["listening_text"] = "I have a pet cat. Its name is Mimi. It is white and ______. It looks like a little panda. It likes to play with a ball."
q["analysis"] = "【考点】本题考查听辨颜色形容词。\n【解题思路】文本中提到\"像一只小熊猫\"，熊猫是黑白相间的，所以填black。\n【总结】注意语境线索（like a panda）可以帮助确定答案。"
print(f"  Fixed en_listen_015: added clue 'looks like a little panda' for uniqueness")

# Fix en_listen_025: answer bookshelf -> bookcase
q = ld["en_listen_025"]
q["answer"] = "bookcase"
q["listening_text"] = "There is a ______ in my room. It is big and tall. I put my books in it. My toys are on the shelves too."
q["analysis"] = "【考点】本题考查听辨家具名词及功能。\n【解题思路】\"put my books in it\"和\"big and tall\"提示是书柜（bookcase）。\n【总结】根据物品用途推断单词。"
print(f"  Fixed en_listen_025: answer -> bookcase, improved clues")

# Fix en_listen_045: improve uniqueness of answer
q = ld["en_listen_045"]
q["listening_text"] = "I live in a small ______. There are many trees and flowers around it. There are no tall buildings here, only small houses."
q["analysis"] = "【考点】本题考查听辨居住地名词。\n【解题思路】\"small\"、\"many trees and flowers\"、\"no tall buildings\"、\"small houses\"提示是村庄（village）。\n【总结】居住地名词：city, town, village, countryside。"
print(f"  Fixed en_listen_045: added clues 'no tall buildings, only small houses' for uniqueness")

# Fix en_listen_003/008/013/018/023/028/033/038/043/048: extract judge sentence to question field
JUDGE_Q_IDS = ["en_listen_003", "en_listen_008", "en_listen_013", "en_listen_018",
               "en_listen_023", "en_listen_028", "en_listen_033", "en_listen_038",
               "en_listen_043", "en_listen_048"]

for qid in JUDGE_Q_IDS:
    q = ld[qid]
    lt = q["listening_text"]
    # Split at "\n\n句子：" or "\n\n句子：" pattern
    if "\n\n" in lt:
        parts = lt.split("\n\n")
        # The last part after \n\n contains the judge sentence
        judge_part = parts[-1]
        for prefix in ["\u53e5\u5b50\uff1a", "\u53e5\u5b50:"]:
            if judge_part.startswith(prefix):
                judge_sentence = judge_part[len(prefix):].strip()
                q["listening_text"] = "\n\n".join(parts[:-1])
                q["judge_statement"] = judge_sentence
                break
    print(f"  Fixed {qid}: extracted judge_statement from listening_text")

# Save listening
with open(f"{BASE}/questions_en_listen.json", "w", encoding="utf-8") as f:
    json.dump(listen, f, ensure_ascii=False, indent=2)
print("  Saved questions_en_listen.json")


# ============================================================
# PART 3: Fix questions_en_writing.json
# ============================================================
print("\n=== Fixing writing questions ===")

wd = {q["id"]: q for q in writing}

# Fix en_writing_001: type -> reorder
q = wd["en_writing_001"]
q["type"] = "reorder"
print(f"  Fixed en_writing_001: type -> reorder")

# Fix en_writing_002: type -> reorder
q = wd["en_writing_002"]
q["type"] = "reorder"
print(f"  Fixed en_writing_002: type -> reorder")

# Fix en_writing_003: type -> reorder
q = wd["en_writing_003"]
q["type"] = "reorder"
print(f"  Fixed en_writing_003: type -> reorder")

# Fix en_writing_004: type -> reorder
q = wd["en_writing_004"]
q["type"] = "reorder"
print(f"  Fixed en_writing_004: type -> reorder")

# Fix en_writing_005: type -> reorder
q = wd["en_writing_005"]
q["type"] = "reorder"
print(f"  Fixed en_writing_005: type -> reorder")

# Fix en_writing_011: type -> reorder
q = wd["en_writing_011"]
q["type"] = "reorder"
print(f"  Fixed en_writing_011: type -> reorder")

# Fix en_writing_012: type -> reorder
q = wd["en_writing_012"]
q["type"] = "reorder"
print(f"  Fixed en_writing_012: type -> reorder")

# Fix en_writing_006/007/008/013: "看图写话" -> "根据以下描述写话"
q = wd["en_writing_006"]
q["question"] = "根据以下描述，用3-5句话写一段短文。\n\n描述内容：一个高个子男孩，戴着眼镜，穿着蓝色T恤和黑色裤子，手里拿着一本书，脸上带着微笑。"
q["type"] = "open_ended"
q["ability_tag"] = "看描述写话：描述人物外貌"
print(f"  Fixed en_writing_006: 看图写话 -> 根据描述写话")

q = wd["en_writing_007"]
q["question"] = "根据以下描述，用3-5句话写一段短文。\n\n描述内容：公园里，一个小女孩在放风筝，一个小男孩在踢足球，天空中飘着几朵白云，阳光很明亮。"
q["type"] = "open_ended"
q["answer"] = "It is a sunny day in the park. A girl is flying a kite. A boy is playing football. The sun is bright. There are white clouds in the sky."
q["analysis"] = "【考点】本题考查描述场景和活动的能力。\n【解题思路】先写天气和地点，再写人物和正在进行的动作，最后补充环境细节。\n【总结】描述场景常用现在进行时，先总体后具体。"
q["ability_tag"] = "看描述写话：描述场景活动"
print(f"  Fixed en_writing_007: 看图写话 -> 根据描述写话, fixed '太阳在微笑'")

q = wd["en_writing_008"]
q["question"] = "根据以下描述，用3-5句话写一段短文。\n\n描述内容：一只大熊猫，黑白相间，正在吃竹子，旁边有几棵绿色的竹子，看起来很开心。"
q["type"] = "open_ended"
q["ability_tag"] = "看描述写话：动物描述"
print(f"  Fixed en_writing_008: 看图写话 -> 根据描述写话")

q = wd["en_writing_013"]
q["question"] = "根据以下描述，用3-5句话写一段短文。\n\n描述内容：一张书桌，上面有一盏台灯、一本书和一个铅笔盒。台灯在左边，书在中间，铅笔盒在右边。椅子在桌子下面。"
q["type"] = "open_ended"
q["ability_tag"] = "看描述写话：描述位置关系"
print(f"  Fixed en_writing_013: 看图写话 -> 根据描述写话")

# Fix en_writing_009/010/014/015/016/017/018/019/020: type -> open_ended
ESSAY_IDS = ["en_writing_009", "en_writing_010", "en_writing_014", "en_writing_015",
             "en_writing_016", "en_writing_017", "en_writing_018", "en_writing_019",
             "en_writing_020"]
for eid in ESSAY_IDS:
    q = wd[eid]
    q["type"] = "open_ended"
    print(f"  Fixed {eid}: type -> open_ended")

# Fix en_writing_010: tense consistency
q = wd["en_writing_010"]
q["answer"] = "My Weekend\nLast weekend, I was very happy. On Saturday morning, I did my homework. In the afternoon, I played football with my friends. On Sunday, I visited my grandparents. We had a big dinner together. I had a wonderful weekend."
print(f"  Fixed en_writing_010: tense consistency ('I love' -> 'I had a wonderful')")

# Fix en_writing_003: add alternate form
q = wd["en_writing_003"]
q["answer"] = "He does not like playing basketball."
q["alt_answers"] = ["He doesn't like playing basketball."]
print(f"  Fixed en_writing_003: added alt_answers with doesn't form")

# Fix en_writing_018: add date to leave note
q = wd["en_writing_018"]
q["answer"] = "Monday, April 13th\n\nDear Miss Zhang,\nI am sorry to tell you that I have a cold today. I have a headache. I cannot go to school. Could you please give me one day off? Thank you.\nYours,\nZhang Ming"
print(f"  Fixed en_writing_018: added date to leave note")

# Save writing
with open(f"{BASE}/questions_en_writing.json", "w", encoding="utf-8") as f:
    json.dump(writing, f, ensure_ascii=False, indent=2)
print("  Saved questions_en_writing.json")

print("\n=== All fixes completed! ===")
