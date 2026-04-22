#!/usr/bin/env python3
"""
Add 25 new 古诗文默写 fill_blank questions to the poetry question bank.
- Format 1 (上句接下句): 15 questions
- Format 2 (根据意思/情境写诗句): 10 questions
- Difficulty: 10 at level 1, 12 at level 2, 3 at level 3
- IDs: poetry_124 ~ poetry_148
"""

import json
from pathlib import Path

DATA_FILE = Path(__file__).parent / "src/data/questions_poetry.json"

# Load existing data
with open(DATA_FILE, "r", encoding="utf-8") as f:
    questions = json.load(f)

existing_ids = {q["id"] for q in questions}
print(f"Existing questions: {len(questions)}, last ID: {questions[-1]['id']}")

new_questions = [
    # ============================================================
    # Format 1: 上句接下句 (15 questions)
    # ============================================================

    # --- Difficulty 1 (6 questions) ---
    {
        "id": "poetry_124",
        "knowledge_tag": "古诗词",
        "ability_tag": "古诗文默写",
        "type": "fill_blank",
        "question": "\"床前明月光\"的下一句是：________",
        "options": [],
        "answer": "疑是地上霜",
        "analysis": "出自李白《静夜思》。诗人看到床前的月光，以为是地上结了一层霜，写出了客居他乡的孤独感。",
        "difficulty": 1
    },
    {
        "id": "poetry_125",
        "knowledge_tag": "古诗词",
        "ability_tag": "古诗文默写",
        "type": "fill_blank",
        "question": "\"白日依山尽\"的下一句是：________",
        "options": [],
        "answer": "黄河入海流",
        "analysis": "出自王之涣《登鹳雀楼》。描写了夕阳西下、黄河奔流入海的壮阔景象。",
        "difficulty": 1
    },
    {
        "id": "poetry_126",
        "knowledge_tag": "古诗词",
        "ability_tag": "古诗文默写",
        "type": "fill_blank",
        "question": "\"碧玉妆成一树高\"的下一句是：________",
        "options": [],
        "answer": "万条垂下绿丝绦",
        "analysis": "出自贺知章《咏柳》。用碧玉比喻柳树，用绿丝绦比喻柳枝，生动写出了早春柳树的婀娜多姿。",
        "difficulty": 1
    },
    {
        "id": "poetry_127",
        "knowledge_tag": "古诗词",
        "ability_tag": "古诗文默写",
        "type": "fill_blank",
        "question": "\"日照香炉生紫烟\"的下一句是：________",
        "options": [],
        "answer": "遥看瀑布挂前川",
        "analysis": "出自李白《望庐山瀑布》。\"生\"和\"挂\"两个动词把云烟和瀑布写活了，画面感极强。",
        "difficulty": 1
    },
    {
        "id": "poetry_128",
        "knowledge_tag": "古诗词",
        "ability_tag": "古诗文默写",
        "type": "fill_blank",
        "question": "\"离离原上草\"的下一句是：________",
        "options": [],
        "answer": "一岁一枯荣",
        "analysis": "出自白居易《赋得古原草送别》。\"一岁一枯荣\"概括了草木一年一循环的生长规律，蕴含着生命的哲理。",
        "difficulty": 1
    },
    {
        "id": "poetry_129",
        "knowledge_tag": "古诗词",
        "ability_tag": "古诗文默写",
        "type": "fill_blank",
        "question": "\"春色满园关不住\"的下一句是：________",
        "options": [],
        "answer": "一枝红杏出墙来",
        "analysis": "出自叶绍翁《游园不值》。春色是关不住的，一枝红杏探出墙头，写出了春天旺盛的生命力。",
        "difficulty": 1
    },

    # --- Difficulty 2 (9 questions) ---
    {
        "id": "poetry_130",
        "knowledge_tag": "古诗词",
        "ability_tag": "古诗文默写",
        "type": "fill_blank",
        "question": "\"粉骨碎身浑不怕\"的下一句是：________",
        "options": [],
        "answer": "要留清白在人间",
        "analysis": "出于谦《石灰吟》。\"清白\"双关，既指石灰洁白的颜色，也指高尚清廉的品格。全诗借石灰自喻，表达坚贞不屈的气节。",
        "difficulty": 2
    },
    {
        "id": "poetry_131",
        "knowledge_tag": "古诗词",
        "ability_tag": "古诗文默写",
        "type": "fill_blank",
        "question": "\"九州生气恃风雷\"的下一句是：________",
        "options": [],
        "answer": "万马齐喑究可哀",
        "analysis": "出自龚自珍《己亥杂诗》。\"万马齐喑\"比喻当时社会沉闷压抑，人们不敢发声，表达诗人对现状的痛心。",
        "difficulty": 2
    },
    {
        "id": "poetry_132",
        "knowledge_tag": "古诗词",
        "ability_tag": "古诗文默写",
        "type": "fill_blank",
        "question": "\"山外青山楼外楼\"的下一句是：________",
        "options": [],
        "answer": "西湖歌舞几时休",
        "analysis": "出自林升《题临安邸》。表面写西湖美景，实际讽刺南宋统治者沉迷享乐、不思收复失地。",
        "difficulty": 2
    },
    {
        "id": "poetry_133",
        "knowledge_tag": "古诗词",
        "ability_tag": "古诗文默写",
        "type": "fill_blank",
        "question": "\"千里莺啼绿映红\"的下一句是：________",
        "options": [],
        "answer": "水村山郭酒旗风",
        "analysis": "出自杜牧《江南春》。有声（莺啼）有色（绿映红），有村庄有酒旗，描绘了辽阔而生动的江南春景。",
        "difficulty": 2
    },
    {
        "id": "poetry_134",
        "knowledge_tag": "古诗词",
        "ability_tag": "古诗文默写",
        "type": "fill_blank",
        "question": "\"小荷才露尖尖角\"的下一句是：________",
        "options": [],
        "answer": "早有蜻蜓立上头",
        "analysis": "出自杨万里《小池》。荷叶刚露出水面尖尖的一角，蜻蜓就已停在上面。观察细腻，画面灵动，常用来比喻新事物刚露头角。",
        "difficulty": 2
    },
    {
        "id": "poetry_135",
        "knowledge_tag": "古诗词",
        "ability_tag": "古诗文默写",
        "type": "fill_blank",
        "question": "\"落红不是无情物\"的下一句是：________",
        "options": [],
        "answer": "化作春泥更护花",
        "analysis": "出自龚自珍《己亥杂诗》（其五）。诗人以落花自喻，虽辞官离京，仍愿为国家贡献力量，表达无私奉献的精神。",
        "difficulty": 2
    },
    {
        "id": "poetry_136",
        "knowledge_tag": "古诗词",
        "ability_tag": "古诗文默写",
        "type": "fill_blank",
        "question": "\"咬定青山不放松\"的下一句是：________",
        "options": [],
        "answer": "立根原在破岩中",
        "analysis": "出自郑燮《竹石》。\"咬定\"用拟人手法写竹根扎得牢固，\"破岩\"写出环境的艰苦。全诗借竹喻人，赞美坚贞不屈的品格。",
        "difficulty": 2
    },
    {
        "id": "poetry_137",
        "knowledge_tag": "古诗词",
        "ability_tag": "古诗文默写",
        "type": "fill_blank",
        "question": "\"半亩方塘一鉴开\"的下一句是：________",
        "options": [],
        "answer": "天光云影共徘徊",
        "analysis": "出自朱熹《观书有感》。半亩大的方形池塘像一面打开的镜子，天光和云影倒映在水中不停晃动。以景喻理，写读书使心灵澄澈。",
        "difficulty": 2
    },
    {
        "id": "poetry_138",
        "knowledge_tag": "古诗词",
        "ability_tag": "古诗文默写",
        "type": "fill_blank",
        "question": "\"等闲识得东风面\"的下一句是：________",
        "options": [],
        "answer": "万紫千红总是春",
        "analysis": "出自朱熹《春日》。万紫千红的百花都是春风带来的，用色彩写出春天的生机勃勃。\"等闲\"意为\"轻易、随便\"。",
        "difficulty": 2
    },

    # ============================================================
    # Format 2: 根据意思/情境写诗句 (10 questions)
    # ============================================================

    # --- Difficulty 1 (4 questions) ---
    {
        "id": "poetry_139",
        "knowledge_tag": "古诗词",
        "ability_tag": "古诗文默写",
        "type": "fill_blank",
        "question": "表达\"母亲的恩情深重，子女难以回报\"的意思，可以用孟郊的哪句诗？",
        "options": [],
        "answer": "谁言寸草心，报得三春晖",
        "analysis": "出自孟郊《游子吟》。用\"寸草\"比喻子女微薄的心意，用\"三春晖\"比喻母亲深厚的恩情。反问句式强调了母爱的伟大。",
        "difficulty": 1
    },
    {
        "id": "poetry_140",
        "knowledge_tag": "古诗词",
        "ability_tag": "古诗文默写",
        "type": "fill_blank",
        "question": "表达\"站得高才能看得远\"的人生哲理，可以用王之涣的哪句诗？",
        "options": [],
        "answer": "欲穷千里目，更上一层楼",
        "analysis": "出自王之涣《登鹳雀楼》。想要看到更远的风景，就要再登上一层楼。常用来鼓励人不断进取、追求更高的目标。",
        "difficulty": 1
    },
    {
        "id": "poetry_141",
        "knowledge_tag": "古诗词",
        "ability_tag": "古诗文默写",
        "type": "fill_blank",
        "question": "表达\"虽然远离家乡，但朋友之间的深厚情谊不会因为距离而改变\"的意思，可以用王勃的哪句诗？",
        "options": [],
        "answer": "海内存知己，天涯若比邻",
        "analysis": "出自王勃《送杜少府之任蜀州》。四海之内有知心朋友，即使远在天边也像近邻一样。一扫送别诗的悲伤，显得豁达乐观。",
        "difficulty": 1
    },
    {
        "id": "poetry_142",
        "knowledge_tag": "古诗词",
        "ability_tag": "古诗文默写",
        "type": "fill_blank",
        "question": "表达\"春天的生机无法阻挡\"的意思，可以用叶绍翁的哪句诗？",
        "options": [],
        "answer": "春色满园关不住，一枝红杏出墙来",
        "analysis": "出自叶绍翁《游园不值》。春天的景色是关不住的，一枝红杏伸出墙来，写出了自然界旺盛的生命力。",
        "difficulty": 1
    },

    # --- Difficulty 2 (3 questions) ---
    {
        "id": "poetry_143",
        "knowledge_tag": "古诗词",
        "ability_tag": "古诗文默写",
        "type": "fill_blank",
        "question": "表达\"春雨默默滋润万物\"的意思，可以用杜甫的哪句诗？",
        "options": [],
        "answer": "随风潜入夜，润物细无声",
        "analysis": "出自杜甫《春夜喜雨》。\"潜\"和\"细无声\"写出了春雨的轻柔与默默奉献。这两句也常用来形容教育者默默付出、润物无声的精神。",
        "difficulty": 2
    },
    {
        "id": "poetry_144",
        "knowledge_tag": "古诗词",
        "ability_tag": "古诗文默写",
        "type": "fill_blank",
        "question": "表达\"不断学习才能保持思想的活力\"的意思，可以用朱熹的哪句诗？",
        "options": [],
        "answer": "问渠那得清如许？为有源头活水来",
        "analysis": "出自朱熹《观书有感》。以方塘清澈是因为有源头活水，比喻人的心灵清明是因为不断读书学习。",
        "difficulty": 2
    },
    {
        "id": "poetry_145",
        "knowledge_tag": "古诗词",
        "ability_tag": "古诗文默写",
        "type": "fill_blank",
        "question": "表达\"身处事物之中往往难以看清全貌\"的道理，可以用苏轼的哪句诗？",
        "options": [],
        "answer": "不识庐山真面目，只缘身在此山中",
        "analysis": "出自苏轼《题西林壁》。\"缘\"是因为的意思。看不清庐山的真正面目，只因为自己身在庐山之中。蕴含\"当局者迷，旁观者清\"的哲理。",
        "difficulty": 2
    },

    # --- Difficulty 3 (3 questions) ---
    {
        "id": "poetry_146",
        "knowledge_tag": "古诗词",
        "ability_tag": "古诗文默写",
        "type": "fill_blank",
        "question": "表达\"志向远大、勇攀高峰\"的意思，可以用杜甫的哪句诗？",
        "options": [],
        "answer": "会当凌绝顶，一览众山小",
        "analysis": "出自杜甫《望岳》。\"会当\"是\"一定要\"的意思。表达了诗人不畏困难、敢于攀登绝顶、俯视一切的雄心壮志。",
        "difficulty": 3
    },
    {
        "id": "poetry_147",
        "knowledge_tag": "古诗词",
        "ability_tag": "古诗文默写",
        "type": "fill_blank",
        "question": "表达\"虽然身处逆境，依然坚持操守、永不屈服\"的意思，可以用郑燮的哪句诗？",
        "options": [],
        "answer": "千磨万击还坚劲，任尔东西南北风",
        "analysis": "出自郑燮《竹石》。无论来自哪个方向的风雨打击，竹子依然坚韧挺拔。比喻人在困境中依然保持坚强的品格。",
        "difficulty": 3
    },
    {
        "id": "poetry_148",
        "knowledge_tag": "古诗词",
        "ability_tag": "古诗文默写",
        "type": "fill_blank",
        "question": "表达\"愿意牺牲自己、奉献一切以保持高洁品格\"的意思，可以用于谦的哪句诗？",
        "options": [],
        "answer": "粉骨碎身浑不怕，要留清白在人间",
        "analysis": "出于谦《石灰吟》。石灰经过千锤万凿、烈火焚烧、粉身碎骨，依然要留下洁白。于谦以石灰自喻，表达宁死不屈、坚守清廉的决心。",
        "difficulty": 3
    },
]

# Validate IDs are unique
for q in new_questions:
    if q["id"] in existing_ids:
        raise ValueError(f"Duplicate ID: {q['id']}")

# Validate counts
format1_count = sum(1 for q in new_questions if "的下一句是" in q["question"])
format2_count = len(new_questions) - format1_count
diff1_count = sum(1 for q in new_questions if q["difficulty"] == 1)
diff2_count = sum(1 for q in new_questions if q["difficulty"] == 2)
diff3_count = sum(1 for q in new_questions if q["difficulty"] == 3)

print(f"\nNew questions to add: {len(new_questions)}")
print(f"  Format 1 (上句接下句): {format1_count}")
print(f"  Format 2 (情境写诗句): {format2_count}")
print(f"  Difficulty 1: {diff1_count}")
print(f"  Difficulty 2: {diff2_count}")
print(f"  Difficulty 3: {diff3_count}")
print(f"  ID range: {new_questions[0]['id']} ~ {new_questions[-1]['id']}")

assert len(new_questions) == 25, f"Expected 25 questions, got {len(new_questions)}"
assert format1_count == 15, f"Expected 15 format-1, got {format1_count}"
assert format2_count == 10, f"Expected 10 format-2, got {format2_count}"
assert diff1_count == 10, f"Expected 10 difficulty-1, got {diff1_count}"
assert diff2_count == 12, f"Expected 12 difficulty-2, got {diff2_count}"
assert diff3_count == 3, f"Expected 3 difficulty-3, got {diff3_count}"

# Check poets coverage
poets_mentioned = set()
poet_map = {
    "李白": ["李白", "静夜思", "望庐山瀑布", "早发白帝城", "黄鹤楼送"],
    "杜甫": ["杜甫", "春夜喜雨", "望岳"],
    "白居易": ["白居易", "赋得古原草"],
    "王维": ["王维"],
    "苏轼": ["苏轼", "题西林壁"],
    "孟浩然": ["孟浩然"],
    "王之涣": ["王之涣", "登鹳雀楼"],
    "杜牧": ["杜牧", "江南春"],
    "杨万里": ["杨万里", "小池"],
    "陆游": ["陆游"],
    "辛弃疾": ["辛弃疾"],
    "贺知章": ["贺知章", "咏柳"],
    "龚自珍": ["龚自珍", "己亥杂诗"],
    "叶绍翁": ["叶绍翁", "游园不值"],
    "朱熹": ["朱熹", "观书有感", "春日"],
    "于谦": ["于谦", "石灰吟"],
    "郑燮": ["郑燮", "竹石"],
    "孟郊": ["孟郊", "游子吟"],
    "王勃": ["王勃", "送杜少府"],
    "林升": ["林升", "题临安邸"],
}
for q in new_questions:
    text = q["question"] + q["answer"] + q["analysis"]
    for poet, keywords in poet_map.items():
        if any(kw in text for kw in keywords):
            poets_mentioned.add(poet)

print(f"\nPoets covered ({len(poets_mentioned)}): {sorted(poets_mentioned)}")

# Append and write back
questions.extend(new_questions)

with open(DATA_FILE, "w", encoding="utf-8") as f:
    json.dump(questions, f, ensure_ascii=False, indent=2)

print(f"\nDone! Total questions now: {len(questions)}")
print(f"File written to: {DATA_FILE}")
