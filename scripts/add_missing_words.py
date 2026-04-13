#!/usr/bin/env python3
"""
Add 43 missing PEP core words to words_network.json
词汇补充脚本 — 补充PEP人教版三至六年级缺失的四会核心词
"""

import json
import sys

INPUT = 'src/data/words_network.json'
OUTPUT = 'src/data/words_network.json'

new_words = {
    # ===== CLOTHES (5) =====
    "cap": {
        "word": "cap",
        "meaning": "鸭舌帽",
        "category": "clothes",
        "tier": 1,
        "frequency": "high",
        "associations": ["hat", "wear", "boy"],
        "confusables": ["cup", "cat"],
        "example": "He has a red cap.",
        "memory_tip": "cap是鸭舌帽，遮阳戴头上"
    },
    "coat": {
        "word": "coat",
        "meaning": "外套",
        "category": "clothes",
        "tier": 1,
        "frequency": "high",
        "associations": ["jacket", "cold", "winter"],
        "confusables": ["boat", "coat"],
        "example": "Put on your coat, please.",
        "memory_tip": "外套coat天冷穿"
    },
    "hat": {
        "word": "hat",
        "meaning": "帽子",
        "category": "clothes",
        "tier": 1,
        "frequency": "high",
        "associations": ["cap", "wear", "sun"],
        "confusables": ["hat", "hot"],
        "example": "The hat is too big.",
        "memory_tip": "帽子hat戴头顶"
    },
    "glove": {
        "word": "glove",
        "meaning": "手套（单只）",
        "category": "clothes",
        "tier": 1,
        "frequency": "medium",
        "associations": ["gloves", "hand", "cold"],
        "confusables": ["glove", "love"],
        "example": "I lost one glove.",
        "memory_tip": "手套glove，glove里面有love"
    },
    "shoe": {
        "word": "shoe",
        "meaning": "鞋子",
        "category": "clothes",
        "tier": 1,
        "frequency": "high",
        "associations": ["foot", "socks", "wear"],
        "confusables": ["shoe", "shy"],
        "example": "Tie your shoes, please.",
        "memory_tip": "鞋子shoe穿脚上"
    },
    # ===== HOME (6) =====
    "table": {
        "word": "table",
        "meaning": "桌子",
        "category": "home",
        "tier": 1,
        "frequency": "high",
        "associations": ["chair", "dish", "desk"],
        "confusables": ["table", "vegetable"],
        "example": "The book is on the table.",
        "memory_tip": "桌子table吃饭放dish"
    },
    "clock": {
        "word": "clock",
        "meaning": "时钟",
        "category": "home",
        "tier": 1,
        "frequency": "high",
        "associations": ["time", "wall", "watch"],
        "confusables": ["clock", "chicken"],
        "example": "What time is it on the clock?",
        "memory_tip": "时钟clock看时间"
    },
    "fridge": {
        "word": "fridge",
        "meaning": "冰箱",
        "category": "home",
        "tier": 1,
        "frequency": "high",
        "associations": ["refrigerator", "cold", "eat"],
        "confusables": ["fridge", "bridge"],
        "example": "The juice is in the fridge.",
        "memory_tip": "fridge是refrigerator的简称"
    },
    "fan": {
        "word": "fan",
        "meaning": "风扇；粉丝",
        "category": "home",
        "tier": 1,
        "frequency": "medium",
        "associations": ["wind", "hot", "summer"],
        "confusables": ["fan", "fun"],
        "example": "Turn on the fan, please.",
        "memory_tip": "风扇fan吹风fun"
    },
    "floor": {
        "word": "floor",
        "meaning": "地板",
        "category": "home",
        "tier": 1,
        "frequency": "high",
        "associations": ["door", "carpet", "wall"],
        "confusables": ["floor", "door"],
        "example": "The ball is on the floor.",
        "memory_tip": "地板floor进门door"
    },
    "key": {
        "word": "key",
        "meaning": "钥匙；关键",
        "category": "home",
        "tier": 1,
        "frequency": "high",
        "associations": ["door", "bag", "open"],
        "confusables": ["key", "knee"],
        "example": "I lost my key.",
        "memory_tip": "钥匙key开门的钥匙"
    },
    # ===== STATIONERY (2) =====
    "schoolbag": {
        "word": "schoolbag",
        "meaning": "书包",
        "category": "stationery",
        "tier": 1,
        "frequency": "high",
        "associations": ["school", "book", "bag"],
        "confusables": ["schoolbag", "school bus"],
        "example": "My schoolbag is heavy.",
        "memory_tip": "书包schoolbag去school用的bag"
    },
    "crayon": {
        "word": "crayon",
        "meaning": "蜡笔",
        "category": "stationery",
        "tier": 1,
        "frequency": "medium",
        "associations": ["draw", "colour", "art"],
        "confusables": ["crayon", "crayon"],
        "example": "I like drawing with crayons.",
        "memory_tip": "蜡笔crayon画画用"
    },
    # ===== NATURE (4) =====
    "garden": {
        "word": "garden",
        "meaning": "花园",
        "category": "nature",
        "tier": 1,
        "frequency": "high",
        "associations": ["flower", "tree", "grass"],
        "confusables": ["garden", "garlic"],
        "example": "There are many flowers in the garden.",
        "memory_tip": "花园garden种花种树"
    },
    "hill": {
        "word": "hill",
        "meaning": "小山丘",
        "category": "nature",
        "tier": 1,
        "frequency": "medium",
        "associations": ["mountain", "green", "walk"],
        "confusables": ["hill", "village"],
        "example": "The house is on the hill.",
        "memory_tip": "小山丘hill比mountain矮"
    },
    "sea": {
        "word": "sea",
        "meaning": "大海",
        "category": "nature",
        "tier": 1,
        "frequency": "high",
        "associations": ["ocean", "beach", "fish"],
        "confusables": ["sea", "see"],
        "example": "I love swimming in the sea.",
        "memory_tip": "大海sea去beach看see"
    },
    "shadow": {
        "word": "shadow",
        "meaning": "影子",
        "category": "nature",
        "tier": 1,
        "frequency": "medium",
        "associations": ["sun", "light", "dark"],
        "confusables": ["shadow", "share"],
        "example": "My shadow is long in the evening.",
        "memory_tip": "影子shadow太阳下"
    },
    # ===== ANIMAL (3) =====
    "hen": {
        "word": "hen",
        "meaning": "母鸡",
        "category": "animal",
        "tier": 1,
        "frequency": "medium",
        "associations": ["chicken", "egg", "farm"],
        "confusables": ["hen", "pen"],
        "example": "The hen has five eggs.",
        "memory_tip": "母鸡hen下蛋"
    },
    "dinosaur": {
        "word": "dinosaur",
        "meaning": "恐龙",
        "category": "animal",
        "tier": 1,
        "frequency": "medium",
        "associations": ["big", "earth", "bone"],
        "confusables": ["dinosaur", "doctor"],
        "example": "Dinosaurs lived long ago.",
        "memory_tip": "恐龙dinosaur很久以前就灭绝了"
    },
    "cheetah": {
        "word": "cheetah",
        "meaning": "猎豹",
        "category": "animal",
        "tier": 1,
        "frequency": "low",
        "associations": ["fast", "run", "cat"],
        "confusables": ["cheetah", "china"],
        "example": "The cheetah is the fastest animal.",
        "memory_tip": "猎豹cheetah跑得fast"
    },
    # ===== PEOPLE (2) =====
    "pupil": {
        "word": "pupil",
        "meaning": "小学生",
        "category": "people",
        "tier": 1,
        "frequency": "medium",
        "associations": ["student", "school", "class"],
        "confusables": ["pupil", "people"],
        "example": "There are 40 pupils in our class.",
        "memory_tip": "小学生pupil就是student"
    },
    "worker": {
        "word": "worker",
        "meaning": "工人",
        "category": "people",
        "tier": 1,
        "frequency": "high",
        "associations": ["factory", "build", "busy"],
        "confusables": ["worker", "waiter"],
        "example": "My father is a worker.",
        "memory_tip": "工人worker在工厂work"
    },
    # ===== PLACE (2) =====
    "bookstore": {
        "word": "bookstore",
        "meaning": "书店",
        "category": "place",
        "tier": 1,
        "frequency": "medium",
        "associations": ["book", "buy", "shop"],
        "confusables": ["bookstore", "book"],
        "example": "I want to go to the bookstore.",
        "memory_tip": "书店bookstore卖book"
    },
    "building": {
        "word": "building",
        "meaning": "建筑物；楼房",
        "category": "place",
        "tier": 1,
        "frequency": "medium",
        "associations": ["city", "tall", "build"],
        "confusables": ["building", "building"],
        "example": "That is a tall building.",
        "memory_tip": "建筑物building是build出来的"
    },
    # ===== TECHNOLOGY (1) =====
    "spaceship": {
        "word": "spaceship",
        "meaning": "宇宙飞船",
        "category": "technology",
        "tier": 1,
        "frequency": "low",
        "associations": ["space", "star", "fly"],
        "confusables": ["spaceship", "ship"],
        "example": "The spaceship flies to the moon.",
        "memory_tip": "宇宙飞船spaceship飞向space"
    },
    # ===== MISC (4) =====
    "chopsticks": {
        "word": "chopsticks",
        "meaning": "筷子",
        "category": "misc",
        "tier": 1,
        "frequency": "medium",
        "associations": ["eat", "chinese", "dish"],
        "confusables": ["chopsticks", "chocolate"],
        "example": "I can use chopsticks.",
        "memory_tip": "筷子chopsticks中国人吃饭用"
    },
    "nature": {
        "word": "nature",
        "meaning": "大自然",
        "category": "misc",
        "tier": 1,
        "frequency": "high",
        "associations": ["flower", "tree", "earth"],
        "confusables": ["nature", "culture"],
        "example": "I love nature.",
        "memory_tip": "大自然nature有花有树"
    },
    "hobby": {
        "word": "hobby",
        "meaning": "爱好",
        "category": "misc",
        "tier": 1,
        "frequency": "high",
        "associations": ["like", "play", "enjoy"],
        "confusables": ["hobby", "happy"],
        "example": "What is your hobby?",
        "memory_tip": "爱好hobby让人happy"
    },
    # ===== FAMILY (1) =====
    "mom": {
        "word": "mom",
        "meaning": "妈妈（口语）",
        "category": "family",
        "tier": 1,
        "frequency": "high",
        "associations": ["dad", "family", "love"],
        "confusables": ["mom", "map"],
        "example": "Mom, I am hungry.",
        "memory_tip": "妈妈mom和dad是一家人"
    },
    # ===== ADJECTIVES (8) =====
    "cool": {
        "word": "cool",
        "meaning": "凉爽的；酷的",
        "category": "adjective",
        "tier": 1,
        "frequency": "high",
        "associations": ["cold", "fan", "good"],
        "confusables": ["cool", "cold"],
        "example": "It is cool in the evening.",
        "memory_tip": "cool比cold温和一点"
    },
    "fat": {
        "word": "fat",
        "meaning": "胖的",
        "category": "adjective",
        "tier": 1,
        "frequency": "high",
        "associations": ["thin", "big", "eat"],
        "confusables": ["fat", "cat"],
        "example": "The cat is very fat.",
        "memory_tip": "胖fat对应thin瘦"
    },
    "fresh": {
        "word": "fresh",
        "meaning": "新鲜的",
        "category": "adjective",
        "tier": 1,
        "frequency": "medium",
        "associations": ["fruit", "delicious", "vegetable"],
        "confusables": ["fresh", "free"],
        "example": "The fruit is fresh.",
        "memory_tip": "新鲜fresh的fruit最好吃"
    },
    "friendly": {
        "word": "friendly",
        "meaning": "友好的",
        "category": "adjective",
        "tier": 1,
        "frequency": "high",
        "associations": ["friend", "kind", "nice"],
        "confusables": ["friendly", "friend"],
        "example": "She is very friendly.",
        "memory_tip": "友好friendly像朋友friend"
    },
    "helpful": {
        "word": "helpful",
        "meaning": "乐于助人的",
        "category": "adjective",
        "tier": 1,
        "frequency": "medium",
        "associations": ["help", "good", "kind"],
        "confusables": ["helpful", "help"],
        "example": "He is very helpful.",
        "memory_tip": "乐于助人helpful就是喜欢help"
    },
    "pretty": {
        "word": "pretty",
        "meaning": "漂亮的",
        "category": "adjective",
        "tier": 1,
        "frequency": "high",
        "associations": ["beautiful", "girl", "flower"],
        "confusables": ["pretty", "price"],
        "example": "The dress is pretty.",
        "memory_tip": "漂亮pretty和beautiful意思近"
    },
    "strict": {
        "word": "strict",
        "meaning": "严格的",
        "category": "adjective",
        "tier": 1,
        "frequency": "medium",
        "associations": ["teacher", "serious"],
        "confusables": ["strict", "street"],
        "example": "Our teacher is strict.",
        "memory_tip": "严格strict的老师很serious"
    },
    "sweet": {
        "word": "sweet",
        "meaning": "甜的",
        "category": "adjective",
        "tier": 1,
        "frequency": "high",
        "associations": ["candy", "delicious", "fruit"],
        "confusables": ["sweet", "swim"],
        "example": "The cake is sweet.",
        "memory_tip": "甜sweet像candy糖"
    },
    # ===== VERBS (6) =====
    "become": {
        "word": "become",
        "meaning": "变成",
        "category": "verb",
        "tier": 1,
        "frequency": "high",
        "associations": ["change", "dream", "big"],
        "confusables": ["become", "come"],
        "example": "I want to become a teacher.",
        "memory_tip": "变成become注意come"
    },
    "can": {
        "word": "can",
        "meaning": "能；会",
        "category": "verb",
        "tier": 1,
        "frequency": "high",
        "associations": ["try", "learn", "read"],
        "confusables": ["can", "cap"],
        "example": "I can swim.",
        "memory_tip": "can就是能会"
    },
    "dream": {
        "word": "dream",
        "meaning": "做梦；梦想",
        "category": "verb",
        "tier": 1,
        "frequency": "high",
        "associations": ["sleep", "night", "wish"],
        "confusables": ["dream", "ice cream"],
        "example": "I have a dream.",
        "memory_tip": "梦想dream像cream一样美好"
    },
    "hike": {
        "word": "hike",
        "meaning": "远足；徒步旅行",
        "category": "verb",
        "tier": 1,
        "frequency": "medium",
        "associations": ["walk", "mountain", "nature"],
        "confusables": ["hike", "bike"],
        "example": "Let's go hiking this weekend.",
        "memory_tip": "远足hike靠walk"
    },
    "stay": {
        "word": "stay",
        "meaning": "停留；待在",
        "category": "verb",
        "tier": 1,
        "frequency": "high",
        "associations": ["home", "wait", "sit"],
        "confusables": ["stay", "say"],
        "example": "Stay at home, please.",
        "memory_tip": "待stay在家里home"
    },
    "shine": {
        "word": "shine",
        "meaning": "发光；照耀",
        "category": "verb",
        "tier": 1,
        "frequency": "medium",
        "associations": ["sun", "bright", "star"],
        "confusables": ["shine", "shy"],
        "example": "The sun shines bright.",
        "memory_tip": "太阳shine发光bright"
    },
}


def main():
    # Load existing
    with open(INPUT, 'r', encoding='utf-8') as f:
        data = json.load(f)

    existing = set(data['words'].keys())

    # Check for duplicates
    duplicates = [w for w in new_words if w in existing]
    if duplicates:
        print(f"WARNING: These words already exist and will be skipped: {duplicates}")
        for w in duplicates:
            del new_words[w]

    if not new_words:
        print("No new words to add.")
        return

    # Add new words
    for w, obj in new_words.items():
        data['words'][w] = obj

    # Validate: all associations/confusables must exist in the final dictionary
    all_words = set(data['words'].keys())
    errors = []
    for w, obj in new_words.items():
        for ref in obj.get('associations', []):
            if ref not in all_words:
                errors.append(f"  {w}.associations: '{ref}' NOT FOUND")
        for ref in obj.get('confusables', []):
            if ref not in all_words:
                errors.append(f"  {w}.confusables: '{ref}' NOT FOUND")

    if errors:
        print(f"VALIDATION FAILED - {len(errors)} broken references:")
        for e in errors:
            print(e)
        # Revert
        with open(INPUT, 'r', encoding='utf-8') as f:
            f.read()  # already modified in memory but not written
        print("\nFix the references above and re-run.")
        sys.exit(1)

    # Write back
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"SUCCESS: Added {len(new_words)} words")
    print(f"Total words: {len(data['words'])} (was {len(existing)})")

    # Summary by category
    cats = {}
    for w, obj in new_words.items():
        cats.setdefault(obj['category'], []).append(w)
    print("\nAdded by category:")
    for cat, words in sorted(cats.items()):
        print(f"  {cat} ({len(words)}): {', '.join(words)}")


if __name__ == '__main__':
    main()
