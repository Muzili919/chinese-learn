#!/usr/bin/env python3
"""
Fix all issues in questions_poetry.json based on review_cn_poetry.json
"""
import json
import copy

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(data, path):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

INPUT = '/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/questions_poetry.json'
OUTPUT = INPUT  # overwrite in place

questions = load_json(INPUT)

# Build lookup by id
q_map = {q['id']: q for q in questions}

# ============================================================
# 1. FIX WRONG ANSWERS
# ============================================================

# poetry_001: 人材 → 人才 (统编教材标准)
q = q_map['poetry_001']
q['answer'] = q['answer'].replace('人材', '人才')
q['analysis'] = q['analysis'].replace("'人材'不同于'人才'", "'人才'是统编教材标准写法")
q['analysis'] = q['analysis'].replace('降人材', '降人才')
q['knowledge_tag'] = '古诗文'
print("[FIX] poetry_001: 人材→人才, knowledge_tag→古诗文")

# poetry_005: 人材 → 人才
q = q_map['poetry_005']
q['answer'] = q['answer'].replace('人材', '人才')
print("[FIX] poetry_005: 人材→人才")

# poetry_018: 渠 答案错误 - 第(3)项应判×
q = q_map['poetry_018']
q['answer'] = '（1）√ （2）× （3）× （4）√'
q['analysis'] = q['analysis'].replace(
    "答案判断第（3）项'渠'指水渠为正确（√）",
    "答案判断第（3）项'渠'指水渠为错误（×）"
) if "答案判断第（3）项'渠'指水渠为正确（√）" in q['analysis'] else q['analysis']
print("[FIX] poetry_018: (3)√→×, 渠是代词不是水渠")

# poetry_051: 全√无区分度 - 修改第(3)项为错误
q = q_map['poetry_051']
q['question'] = q['question'].replace(
    '（3）"垂緌饮清露"说明蝉在喝露水时触角下垂。（　）',
    '（3）"垂緌饮清露"说明"垂緌"是指蝉在喝露水时低头的动作。（　）'
)
q['answer'] = '（1）√ （2）√ （3）× （4）√'
q['analysis'] = q['analysis'] + '\n\n注意：第（3）项已修正，"垂緌"是蝉触角的固定形态特征（像帽带），不是喝水的动作状态。'
print("[FIX] poetry_051: 第(3)项改为×, 增加区分度")

# poetry_027: analysis中"社会变革"不够准确
q = q_map['poetry_027']
q['analysis'] = q['analysis'].replace(
    "'社会变革'是本体，'风雷'是喻体",
    "'巨大的社会变革力量'是本体，'风雷'是喻体"
)
print("[FIX] poetry_027: analysis修正风雷喻体")

# poetry_016: analysis中B选项"动态描写"不准确
q = q_map['poetry_016']
q['analysis'] = q['analysis'].replace(
    "B选项引用的诗句'明月松间照，清泉石上流'实际上是'以动衬静'的写法，既有静态（月照松间）也有动态（泉流石上），不能简单说是'动态描写'。不过答案选D是正确的。",
    ""
)
# Add proper description
q['analysis'] = q['analysis'].replace(
    "总结：王维的山水诗",
    "B选项'明月松间照，清泉石上流'是'以动衬静、动静结合'的写法，不能简单说是'动态描写'。\n\n总结：王维的山水诗"
)
print("[FIX] poetry_016: analysis修正B选项描述")

# poetry_019: 排序题 ②④争议 → 改为选择题
q = q_map['poetry_019']
q['type'] = 'single_choice'
q['question'] = '下列诗句按作者朝代从早到晚排列正确的一项是（　）。'
q['options'] = [
    'A. ①→④→②→③',
    'B. ①→②→④→③',
    'C. ④→①→③→②',
    'D. ③→①→②→④'
]
q['answer'] = 'A. ①→④→②→③'
q['analysis'] = '考点：本题考查诗人朝代顺序。\n\n解题思路：确定每句诗的作者和朝代：①虞世南（初唐，558-638）→④张志和（唐代，约730-810）→②张继（唐代，约715-779）→③陆游（南宋，1125-1210）。张志和与张继同为唐代诗人，题中④在②前。\n\n总结：小学阶段需要掌握的诗人朝代顺序：唐（初唐→盛唐→中唐→晚唐）→宋（北宋→南宋）→清（纳兰性德、龚自珍）。'
print("[FIX] poetry_019: 排序题→选择题")

# poetry_066: 排序题争议 → 改为选择题
q = q_map['poetry_066']
q['type'] = 'single_choice'
q['question'] = '下列诗句的作者按生活年代从早到晚排列正确的一项是（　）。'
q['options'] = [
    'A. ①→②→③→④',
    'B. ①→③→②→④',
    'C. ③→①→②→④',
    'D. ②→④→①→③'
]
q['answer'] = 'A. ①→②→③→④'
q['analysis'] = '考点：本题考查诗人朝代顺序。\n\n解题思路：①虞世南（初唐）→②陆游（南宋，1125-1210）→③朱熹（南宋，1130-1200）→④林升（南宋）。注意陆游与朱熹几乎同时代，但陆游年长5岁；林升是南宋诗人。\n\n总结：排序为唐代→南宋→南宋→南宋。陆游和朱熹同为南宋，陆游略早于朱熹。'
print("[FIX] poetry_066: 排序题→选择题, 修正朝代排序")

# poetry_093: C选项不够准确
q = q_map['poetry_093']
q['options'][2] = 'C. 都表达了诗人对国家命运的深切关切和爱国情感。'
q['answer'] = 'C. 都表达了诗人对国家命运的深切关切和爱国情感。'
q['analysis'] = q['analysis'].replace(
    "核心都是盼望收复失地、祖国统一。",
    "核心都是对国家命运的关切。《示儿》直接表达渴望统一，《题临安邸》以讽刺表达对国家前途的忧虑，但爱国情怀是一致的。"
)
print("[FIX] poetry_093: C选项修正")

# poetry_007: knowledge_tag
q = q_map['poetry_007']
q['knowledge_tag'] = '古诗文'
q['ability_tag'] = '文言文翻译'
print("[FIX] poetry_007: knowledge_tag→古诗文, ability_tag→文言文翻译")

# poetry_009: knowledge_tag
q = q_map['poetry_009']
q['knowledge_tag'] = '古诗文'
print("[FIX] poetry_009: knowledge_tag→古诗文")

# poetry_010: ability_tag
q = q_map['poetry_010']
q['ability_tag'] = '字音辨析'
print("[FIX] poetry_010: ability_tag→字音辨析")

# ============================================================
# 2. FIX DIGITAL_UNFRIENDLY (加点字)
# ============================================================

# poetry_010: 去掉"加点字"
q = q_map['poetry_010']
q['question'] = '下列词语中读音完全正确的一项是（　）。'
print("[FIX] poetry_010: 去掉加点字用语")

# poetry_015: 去掉"加点字", 直接标注
q = q_map['poetry_015']
q['question'] = '写出下列诗句中画线字的意思。\n\n（1）死去元知万事「空」（　）\n（2）但悲不见九州「同」（　）\n（3）「聒」碎乡心梦不成（　）\n（4）「随意」春芳歇（　）'
print("[FIX] poetry_015: 去掉加点字, 用「」标注")

# poetry_049: 去掉"加点字"
q = q_map['poetry_049']
q['question'] = '下列词语中读音完全正确的一项是（　）。'
print("[FIX] poetry_049: 去掉加点字用语")

# poetry_056: 去掉"加点字", 用「」标注
q = q_map['poetry_056']
q['question'] = '写出下列文言文句子中画线字的意思。\n\n（1）「敏」而好学（　）\n（2）不「耻」下问（　）\n（3）学而不「厌」（　）\n（4）「诲」人不倦（　）'
print("[FIX] poetry_056: 去掉加点字, 用「」标注")

# poetry_068: 去掉"加点字"
q = q_map['poetry_068']
q['question'] = '下列词语中读音完全正确的一项是（　）。'
print("[FIX] poetry_068: 去掉加点字用语")

# poetry_081: 去掉"加点字", 用「」标注
q = q_map['poetry_081']
q['question'] = '写出下列诗句中画线字的意思。\n\n（1）「但」悲不见九州同（　）\n（2）王师「北」定中原日（　）\n（3）直把杭州「作」汴州（　）\n（4）随意春芳「歇」（　）'
print("[FIX] poetry_081: 去掉加点字, 用「」标注")

# ============================================================
# 3. CONVERT 连线题→选择题
# ============================================================

# poetry_004: 诗人与诗句连线→选择
q = q_map['poetry_004']
q['type'] = 'single_choice'
q['question'] = '下列诗人与对应诗句搭配正确的一项是（　）。'
q['options'] = [
    'A. 陆游——居高声自远，非是藉秋风',
    'B. 林升——王师北定中原日，家祭无忘告乃翁',
    'C. 龚自珍——我劝天公重抖擞，不拘一格降人才',
    'D. 虞世南——山外青山楼外楼，西湖歌舞几时休'
]
q['answer'] = 'C. 龚自珍——我劝天公重抖擞，不拘一格降人才'
q['analysis'] = '考点：本题考查诗人与其代表诗句的对应关系。\n\n解题思路：逐项验证。A项：虞世南，非陆游；B项：陆游，非林升；C项：龚自珍，正确；D项：林升，非虞世南。\n\n总结：五年级重点诗人及作品：陆游《示儿》、林升《题临安邸》、龚自珍《己亥杂诗》、虞世南《蝉》。'
print("[FIX] poetry_004: 连线题→选择题")

# poetry_014: 诗句与季节连线→选择
q = q_map['poetry_014']
q['type'] = 'single_choice'
q['question'] = '下列诗句与所描写的季节对应正确的一项是（　）。'
q['options'] = [
    'A. "月落乌啼霜满天"——春季',
    'B. "西塞山前白鹭飞，桃花流水鳜鱼肥"——秋季',
    'C. "风一更，雪一更"——冬季',
    'D. "随意春芳歇"——夏季'
]
q['answer'] = 'C. "风一更，雪一更"——冬季'
q['analysis'] = '考点：本题考查古诗中的季节意象。\n\n解题思路：A项"霜满天"是秋季景象；B项"桃花"是春季意象；C项"风一更，雪一更"写边塞风雪，是冬季；D项"春芳歇"写的是秋天春花已凋谢。\n\n总结：古诗中季节的判定：春天有桃花、杏花、燕子；夏天有荷花、蝉；秋天有霜、枫叶；冬天有雪、梅花。'
print("[FIX] poetry_014: 连线题→选择题")

# poetry_024: 诗句与情感连线→选择(删除重复右列)
q = q_map['poetry_024']
q['type'] = 'single_choice'
q['question'] = '下列诗句与其表达的主要情感对应正确的一项是（　）。'
q['options'] = [
    'A. "王师北定中原日"——讽刺统治者苟且偷安',
    'B. "暖风熏得游人醉"——渴望祖国统一',
    'C. "居高声自远"——品德高尚自然名扬',
    'D. "随意春芳歇"——托物言志'
]
q['answer'] = 'C. "居高声自远"——品德高尚自然名扬'
q['analysis'] = '考点：本题考查对诗歌思想感情的把握。\n\n解题思路：A项"王师北定中原日"表达的是渴望统一，不是讽刺；B项"暖风熏得游人醉"是讽刺统治者醉生梦死，不是渴望统一；C项正确，《蝉》托物言志，表达品德高尚不需要外力；D项"随意春芳歇"表达归隐意愿。\n\n总结：陆游《示儿》爱国统一；林升《题临安邸》讽刺；虞世南《蝉》托物言志；王维《山居秋暝》归隐。'
print("[FIX] poetry_024: 连线题→选择题, 删除重复右列")

# poetry_033: 文言文名句与出处连线→选择
q = q_map['poetry_033']
q['type'] = 'single_choice'
q['question'] = '下列文言文名句与出处对应正确的一项是（　）。'
q['options'] = [
    'A. "敏而好学，不耻下问"——《古人谈读书》',
    'B. "心到最急"——《少年中国说》',
    'C. "少年智则国智"——《论语》',
    'D. "知之为知之，不知为不知，是知也"——《论语》'
]
q['answer'] = 'D. "知之为知之，不知为不知，是知也"——《论语》'
q['analysis'] = '考点：本题考查文言文名句的出处。\n\n解题思路：A项"敏而好学，不耻下问"出自《论语》；B项"心到最急"出自朱熹《古人谈读书》；C项"少年智则国智"出自梁启超《少年中国说》；D项正确。\n\n总结：《论语》是孔子及其弟子言论的集合，朱熹《古人谈读书》强调读书方法，梁启超《少年中国说》强调少年责任。'
print("[FIX] poetry_033: 连线题→选择题")

# poetry_043: 文言文句子与主旨连线→选择
q = q_map['poetry_043']
q['type'] = 'single_choice'
q['question'] = '下列文言文句子与所表达的主旨对应正确的一项是（　）。'
q['options'] = [
    'A. "敏而好学，不耻下问"——读书要专心致志',
    'B. "心到最急"——学习要勤奋并且虚心',
    'C. "少年智则国智"——少年是国家未来的希望',
    'D. "知之为知之"——学习要谦虚好学'
]
q['answer'] = 'C. "少年智则国智"——少年是国家未来的希望'
q['analysis'] = '考点：本题考查文言文主旨的概括。\n\n解题思路：A项"敏而好学"讲勤奋虚心，不是专心致志；B项"心到最急"讲专心致志，不是勤奋虚心；C项正确；D项"知之为知之"讲诚实，不是谦虚好学。\n\n总结：《论语》中"敏而好学"讲勤奋，"不耻下问"讲虚心；"知之为知之"讲诚实。朱熹强调"心到"。梁启超强调少年责任。'
print("[FIX] poetry_043: 连线题→选择题")

# poetry_052: 诗句与哲理连线→选择
q = q_map['poetry_052']
q['type'] = 'single_choice'
q['question'] = '下列诗句与其蕴含的哲理对应正确的一项是（　）。'
q['options'] = [
    'A. "问渠那得清如许？为有源头活水来"——品德高尚，自然名扬',
    'B. "居高声自远，非是藉秋风"——不断学习新知识，才能保持思想活跃',
    'C. "知之为知之，不知为不知"——学习要诚实，不能不懂装懂',
    'D. "少年智则国智"——品德高尚，自然名扬'
]
q['answer'] = 'C. "知之为知之，不知为不知"——学习要诚实，不能不懂装懂'
q['analysis'] = '考点：本题考查对古诗文哲理的理解。\n\n解题思路：A项对应的是"不断学习新知识"；B项对应的是"品德高尚"；C项正确；D项对应的是"青少年是国家的未来"。\n\n总结：这些名句都有深刻哲理，复习时不仅要会背，还要能说出道理。'
print("[FIX] poetry_052: 连线题→选择题")

# poetry_061: 古诗与描写对象连线→选择
q = q_map['poetry_061']
q['type'] = 'single_choice'
q['question'] = '下列古诗与其描写的主要对象对应正确的一项是（　）。'
q['options'] = [
    'A. 《蝉》——渔翁',
    'B. 《渔歌子》——秋天山居',
    'C. 《山居秋暝》——秋天山居',
    'D. 《枫桥夜泊》——蝉'
]
q['answer'] = 'C. 《山居秋暝》——秋天山居'
q['analysis'] = '考点：本题考查古诗的题材和主要内容。\n\n解题思路：A项《蝉》描写对象是蝉；B项《渔歌子》描写对象是渔翁；C项正确；D项《枫桥夜泊》描写对象是夜泊客船。\n\n总结：《蝉》是咏物诗；《渔歌子》是渔隐词；《山居秋暝》是山水田园诗；《枫桥夜泊》是羁旅诗。'
print("[FIX] poetry_061: 连线题→选择题")

# poetry_080: 小古文句子与人物品质连线→选择
q = q_map['poetry_080']
q['type'] = 'single_choice'
q['question'] = '下列文言文句子与所体现的人物品质对应正确的一项是（　）。'
q['options'] = [
    'A. "一箪食，一瓢饮，在陋巷，人不堪其忧，回也不改其乐"——谦虚好学',
    'B. "敏而好学，不耻下问"——安贫乐道',
    'C. "知之为知之，不知为不知"——诚实不欺',
    'D. "学而不厌，诲人不倦"——安贫乐道'
]
q['answer'] = 'C. "知之为知之，不知为不知"——诚实不欺'
q['analysis'] = '考点：本题考查对文言文内容及人物品质的理解。\n\n解题思路：A项表现的是"安贫乐道"；B项表现的是"谦虚好学"；C项正确；D项表现的是"勤奋善教"。\n\n总结：《论语》中颜回"一箪食，一瓢饮"表现安贫乐道；孔子"学而不厌，诲人不倦"表现勤奋善教；"不耻下问"表现谦虚；"知之为知之"表现诚实。'
print("[FIX] poetry_080: 连线题→选择题")

# poetry_090: "风"含义连线→选择
q = q_map['poetry_090']
q['type'] = 'single_choice'
q['question'] = '下列诗句中的"风"与含义对应正确的一项是（　）。'
q['options'] = [
    'A. "九州生气恃风雷"——自然界的春风',
    'B. "暖风熏得游人醉"——巨大的社会变革力量',
    'C. "斜风细雨不须归"——自然界的春风',
    'D. "风一更，雪一更"——奢侈享乐的社会风气'
]
q['answer'] = 'C. "斜风细雨不须归"——自然界的春风'
q['analysis'] = '考点：本题考查古诗中词语的象征意义。\n\n解题思路：A项"风雷"比喻巨大的社会变革力量；B项"暖风"一语双关，比喻奢侈享乐的社会风气；C项正确，"斜风"是实写自然界的春风；D项"风一更"实写边塞寒风。\n\n总结：古诗中的"风"有时是实写，有时是比喻。"暖风"一语双关，"风雷"是比喻。'
print("[FIX] poetry_090: 连线题→选择题")

# ============================================================
# 4. FIX JUDGMENT TYPE: fill_blank → judgment
# ============================================================

judgment_ids = ['poetry_003', 'poetry_008', 'poetry_013', 'poetry_023', 
                'poetry_032', 'poetry_042', 'poetry_060', 'poetry_079', 'poetry_089']

for qid in judgment_ids:
    if qid in q_map:
        q = q_map[qid]
        if q['type'] == 'fill_blank':
            q['type'] = 'judgment'
            print(f"[FIX] {qid}: type fill_blank→judgment")

# ============================================================
# 5. DELETE DUPLICATE QUESTIONS (poetry_069-077)
# ============================================================

duplicates = ['poetry_069', 'poetry_070', 'poetry_071', 'poetry_072', 
              'poetry_073', 'poetry_074', 'poetry_075', 'poetry_076', 'poetry_077']

# Filter out duplicates
questions = [q for q in questions if q['id'] not in duplicates]
print(f"[FIX] Deleted {len(duplicates)} duplicate questions: {', '.join(duplicates)}")

# Rebuild q_map
q_map = {q['id']: q for q in questions}

# ============================================================
# 6. FIX FORMAT ISSUES: 长段答案→选择题
# ============================================================

# poetry_007: 文言文翻译→选择题
q = q_map['poetry_007']
q['type'] = 'single_choice'
q['question'] = '下列对文言文句子的翻译正确的一项是（　）。'
q['options'] = [
    'A. "敏而好学，不耻下问"——天资聪明而且好学，不认为向地位低的人请教是耻辱。',
    'B. "知之为知之，不知为不知，是知也"——知道的就说知道，不知道的就说不知道，这才是聪明。',
    'C. "心到最急"——心到最着急，要抓紧时间读书。',
    'D. "敏而好学，不耻下问"——聪明好学，不耻于向下级询问工作。'
]
q['answer'] = 'A. "敏而好学，不耻下问"——天资聪明而且好学，不认为向地位低的人请教是耻辱。'
q['analysis'] = '考点：本题考查文言文句子的翻译。\n\n解题思路：逐项判断。A项翻译正确；B项"是知也"的"知"通"智"（智慧），不只是"聪明"；C项"急"是重要，不是着急；D项表述不准确，"下问"指向不如自己的人请教。\n\n总结：翻译文言文要遵循"信、达、雅"原则。注意通假字："是知也"的"知"读zhì，通"智"。'
print("[FIX] poetry_007: 文言文翻译→选择题")

# poetry_026: 蝉赏析简答→选择题
q = q_map['poetry_026']
q['type'] = 'single_choice'
q['question'] = '下列对虞世南《蝉》的理解正确的一项是（　）。'
q['options'] = [
    'A. "垂緌"运用了拟人手法，写蝉像人一样戴着帽子。',
    'B. "垂緌"运用了比喻手法，把蝉的触角比作官员帽带下垂的部分，写出了蝉形态高雅的特点。',
    'C. 这首诗主要运用了借景抒情的手法，表达了诗人对蝉的喜爱。',
    'D. "居高声自远"说明蝉声音传得远是因为它站得高。'
]
q['answer'] = 'B. "垂緌"运用了比喻手法，把蝉的触角比作官员帽带下垂的部分，写出了蝉形态高雅的特点。'
q['analysis'] = '考点：本题考查古诗的修辞手法及主旨理解。\n\n解题思路：A项"垂緌"是比喻不是拟人；B项正确；C项主要手法是托物言志，不是借景抒情；D项是字面理解，未涉及深层含义。\n\n总结：咏物诗常用"托物言志"，表面写物实际写人。虞世南笔下的蝉是清高君子的象征。'
print("[FIX] poetry_026: 简答题→选择题")

# poetry_035: 示儿简答→选择题
q = q_map['poetry_035']
q['type'] = 'single_choice'
q['question'] = '下列对陆游《示儿》的理解正确的一项是（　）。'
q['options'] = [
    'A. 这首诗是陆游中年时期写的，表达了他对国家统一的渴望。',
    'B. 诗中"悲"字表现了诗人消极悲观的人生态度。',
    'C. 这首诗是陆游临终前写给儿子的遗嘱，表达至死不忘祖国统一的强烈爱国情感。',
    'D. "王师"指的是金国的军队。'
]
q['answer'] = 'C. 这首诗是陆游临终前写给儿子的遗嘱，表达至死不忘祖国统一的强烈爱国情感。'
q['analysis'] = '考点：本题考查对古诗背景和主旨的理解。\n\n解题思路：A项是临终前写的，不是中年；B项"悲"不是消极悲观，而是深沉的爱国之痛；C项正确；D项"王师"指南宋军队。\n\n总结：陆游一生主张抗金，临终前仍念念不忘收复失地。"悲"字是全诗诗眼。'
print("[FIX] poetry_035: 简答题→选择题")

# poetry_037: 文言文翻译→选择题
q = q_map['poetry_037']
q['type'] = 'single_choice'
q['question'] = '下列对《论语》句子翻译正确的一项是（　）。'
q['options'] = [
    'A. "学而不厌，诲人不倦"——学习而不讨厌，教导别人而不疲倦。',
    'B. "吾尝终日不食，终夜不寝"——我曾经整天不吃，整夜不睡。',
    'C. "以思，无益，不如学也"——用来思考，没有好处，不如去学习。',
    'D. "学而不厌"——学习而不满足，不断追求进步。'
]
q['answer'] = 'D. "学而不厌"——学习而不满足，不断追求进步。'
q['analysis'] = '考点：本题考查文言文翻译能力。\n\n解题思路：A项"厌"不是"讨厌"而是"满足"；B项翻译正确但不完整，缺少后半句的意思；C项"以"表示目的，"用来"思考；D项翻译正确。\n\n总结：注意古今异义："厌"是满足，"诲"是教导。'
print("[FIX] poetry_037: 文言文翻译→选择题")

# poetry_045: 长相思简答→选择题
q = q_map['poetry_045']
q['type'] = 'single_choice'
q['question'] = '下列对纳兰性德《长相思》的理解正确的一项是（　）。'
q['options'] = [
    'A. "山一程，水一程"和"风一更，雪一更"运用了反复和对称的句式，突出了路途的遥远艰辛和风雪夜的漫长难熬。',
    'B. "聒"字是比喻词，把风雪声比作嘈杂的人声。',
    'C. "聒碎乡心"说明诗人睡着了，梦被搅碎了。',
    'D. "故园无此声"指家乡也有风雪声。'
]
q['answer'] = 'A. "山一程，水一程"和"风一更，雪一更"运用了反复和对称的句式，突出了路途的遥远艰辛和风雪夜的漫长难熬。'
q['analysis'] = '考点：本题考查词的语言特色和炼字。\n\n解题思路：A项正确，反复和对称句式增强了节奏感和感染力；B项"聒"是拟声词，不是比喻词；C项"梦不成"说明没睡着；D项"故园无此声"指家乡没有这种风雪声。\n\n总结：《长相思》句式整齐，"聒"字既是声音描写，又是心理描写。'
print("[FIX] poetry_045: 简答题→选择题")

# poetry_054: 题临安邸简答→选择题
q = q_map['poetry_054']
q['type'] = 'single_choice'
q['question'] = '下列对林升《题临安邸》的理解正确的一项是（　）。'
q['options'] = [
    'A. "西湖歌舞"指杭州西湖的歌舞表演，是对民间文艺的赞美。',
    'B. "暖风"只指自然界的暖风，没有比喻义。',
    'C. "西湖歌舞"比喻南宋统治者的奢靡享乐，"暖风"一语双关，既指自然风也指享乐之风。',
    'D. "直把杭州作汴州"表达了诗人对杭州美景的喜爱。'
]
q['answer'] = 'C. "西湖歌舞"比喻南宋统治者的奢靡享乐，"暖风"一语双关，既指自然风也指享乐之风。'
q['analysis'] = '考点：本题考查对讽刺诗的理解和象征手法。\n\n解题思路：A项"西湖歌舞"是比喻，不是赞美；B项"暖风"一语双关；C项正确；D项这是讽刺，不是赞美。\n\n总结：《题临安邸》是讽刺诗代表作。"汴州"是北宋都城，已被金人占领。'
print("[FIX] poetry_054: 简答题→选择题")

# poetry_062: 文言文翻译→选择题
q = q_map['poetry_062']
q['type'] = 'single_choice'
q['question'] = '下列对《论语》句子翻译正确的一项是（　）。'
q['options'] = [
    'A. "三人行，必有我师焉"——三个人走路，其中一定有我的老师。',
    'B. "择其善者而从之"——选择好人来跟随他。',
    'C. "三人行，必有我师焉"——几个人一起走路，其中一定有可以当我的老师的人。',
    'D. "其不善者而改之"——他不好就改变他。'
]
q['answer'] = 'C. "三人行，必有我师焉"——几个人一起走路，其中一定有可以当我的老师的人。'
q['analysis'] = '考点：本题考查《论语》名句的翻译。\n\n解题思路：A项"三"是虚指，不是确指三个；B项"善者"是优点，不是好人；C项正确；D项"不善者"是别人的缺点，不是人不好。\n\n总结："三人行"的"三"是虚指。"择其善者而从之"意为选择别人的优点来学习。'
print("[FIX] poetry_062: 文言文翻译→选择题")

# poetry_065: 读书有三到简答→选择题
q = q_map['poetry_065']
q['type'] = 'single_choice'
q['question'] = '下列对朱熹《读书有三到》的理解正确的一项是（　）。'
q['options'] = [
    'A. "读书千遍，其义自见"中的"见"读jiàn，意思是看见。',
    'B. 朱熹认为读书最重要的是"口到"，因为要大声朗读。',
    'C. "其义自见"中的"见"同"现"，意思是显现、出现。',
    'D. 朱熹认为"心到"不重要，"眼到"和"口到"就够了。'
]
q['answer'] = 'C. "其义自见"中的"见"同"现"，意思是显现、出现。'
q['analysis'] = '考点：本题考查文言文通假字和内容理解。\n\n解题思路：A项"见"读xiàn，通"现"；B项朱熹认为"心到"最重要；C项正确；D项与原文相反。\n\n总结："见"通"现"是常见通假字。朱熹强调"心到"是三到之中最重要的。'
print("[FIX] poetry_065: 简答题→选择题")

# poetry_082: 己亥杂诗简答→选择题
q = q_map['poetry_082']
q['type'] = 'single_choice'
q['question'] = '下列对龚自珍《己亥杂诗》的理解正确的一项是（　）。'
q['options'] = [
    'A. "风雷"比喻自然界的风雨雷电。',
    'B. "万马齐喑"比喻战马众多，国家强盛。',
    'C. "风雷"比喻巨大的社会变革力量，"万马齐喑"比喻社会政治沉闷、人们不敢说话。',
    'D. 这首诗表达了对清朝盛世的赞美之情。'
]
q['answer'] = 'C. "风雷"比喻巨大的社会变革力量，"万马齐喑"比喻社会政治沉闷、人们不敢说话。'
q['analysis'] = '考点：本题考查对诗中比喻和主旨的理解。\n\n解题思路：A项"风雷"是比喻；B项"万马齐喑"形容死气沉沉；C项正确；D项这首诗是对社会沉闷的不满。\n\n总结：龚自珍面对社会压抑，大声疾呼改革。"不拘一格"指打破常规选拔人才。'
print("[FIX] poetry_082: 简答题→选择题")

# poetry_091: 文言文翻译→选择题
q = q_map['poetry_091']
q['type'] = 'single_choice'
q['question'] = '下列对文言文句子翻译正确的一项是（　）。'
q['options'] = [
    'A. "默而识之"——默默地认识它。',
    'B. "学而不厌，诲人不倦"——把所学的知识默默地记住，勤奋学习而不感到满足，教导别人而不感到疲倦。',
    'C. "心既到矣，眼口岂不到乎"——心既然到了，眼睛和嘴巴怎么会不到呢？',
    'D. "诲人不倦"——后悔教导别人。'
]
q['answer'] = 'C. "心既到矣，眼口岂不到乎"——心既然到了，眼睛和嘴巴怎么会不到呢？'
q['analysis'] = '考点：本题考查文言文翻译能力。\n\n解题思路：A项"识"读zhì，记住的意思；B项只翻译了后半句；C项正确；D项"诲"是教导，不是后悔。\n\n总结：注意通假字和古今异义："识"读zhì，"厌"是满足，"诲"是教导。'
print("[FIX] poetry_091: 文言文翻译→选择题")

# poetry_092: 论语简答→选择题
q = q_map['poetry_092']
q['type'] = 'single_choice'
q['question'] = '下列对《论语》选段"由，诲女知之乎！知之为知之，不知为不知，是知也"理解正确的一项是（　）。'
q['options'] = [
    'A. "由"指孔子的朋友，"女"指女子。',
    'B. 这段话告诉我们要诚实对待学习，知道就是知道，不知道就是不知道。',
    'C. "是知也"的"知"是"知道"的意思。',
    'D. 这段话是孔子对颜回说的。'
]
q['answer'] = 'B. 这段话告诉我们要诚实对待学习，知道就是知道，不知道就是不知道。'
q['analysis'] = '考点：本题考查《论语》选段的理解。\n\n解题思路：A项"由"指子路，"女"通"汝"（你）；B项正确；C项"知"通"智"（智慧）；D项是对子路说的，不是颜回。\n\n总结："女"通"汝"，"知"通"智"，都是通假字。'
print("[FIX] poetry_092: 简答题→选择题")

# poetry_096: 比较阅读简答→选择题
q = q_map['poetry_096']
q['type'] = 'single_choice'
q['question'] = '下列对《少年中国说》和《己亥杂诗》的比较理解正确的一项是（　）。'
q['options'] = [
    'A. 甲文运用了比喻的修辞手法，表现手法单一。',
    'B. "万马齐喑"形容社会死气沉沉的局面，甲文中的"少年"是打破这种局面的希望所在。',
    'C. 两篇作品表达的主题完全不同。',
    'D. 乙诗的作者比甲文的作者早约200年。'
]
q['answer'] = 'B. "万马齐喑"形容社会死气沉沉的局面，甲文中的"少年"是打破这种局面的希望所在。'
q['analysis'] = '考点：本题考查古诗文的综合理解和主题归纳。\n\n解题思路：A项甲文主要运用排比；B项正确；C项两篇都表达希望国家强盛的爱国主题；D项龚自珍（1792-1841）早于梁启超（1873-1929）约80年。\n\n总结：梁启超和龚自珍都是要求变革的思想家，核心都是希望国家走向强盛。'
print("[FIX] poetry_096: 简答题→选择题")

# ============================================================
# 7. MOBILE ADAPTATION & FORMAT STANDARDIZATION
# ============================================================

# Standardize fill_blank answer format for poetry_005
q = q_map['poetry_005']
q['answer'] = '（1）我劝天公重抖擞，不拘一格降人才。\n（2）但悲不见九州同。'
q['question'] = q['question'].replace(
    '（2）唯一使我痛心的是没有亲眼看到祖国的统一。\n诗句：________________，________________。',
    '（2）唯一使我痛心的是没有亲眼看到祖国的统一。\n诗句：________________。'
)
print("[FIX] poetry_005: (2)题改为只要求写一句")

# Standardize fill_blank answer format for poetry_094
q = q_map['poetry_094']
q['question'] = q['question'] + '\n\n（格式示例：身向榆关那畔行；纳兰性德）'
print("[FIX] poetry_094: 添加答案格式示例")

# Standardize fill_blank answer format for poetry_095
q = q_map['poetry_095']
q['question'] = q['question'].replace(
    '正确的顺序是：　　→　　→　　→　　',
    '正确的顺序是：____→____→____→____（示例：④→②→③→①）'
)
q['answer'] = '④ → ② → ③ → ①'
print("[FIX] poetry_095: 添加排序格式示例")

# Standardize fill_blank answer format for poetry_019 (already converted to single_choice)
# poetry_029: add format hint
q = q_map['poetry_029']
q['question'] = q['question'].replace(
    '正确的顺序是：　　→　　→　　→　　',
    '正确的顺序是：____→____→____→____（示例：②→④→①→③）'
)
print("[FIX] poetry_029: 添加排序格式示例")

# poetry_038: add format hint
q = q_map['poetry_038']
q['question'] = q['question'].replace(
    '正确的顺序是：　　→　　→　　→　　',
    '正确的顺序是：____→____→____→____（示例：②→④→①→③）'
)
print("[FIX] poetry_038: 添加排序格式示例")

# poetry_047: add format hint
q = q_map['poetry_047']
q['question'] = q['question'].replace(
    '正确的顺序是：　　→　　→　　→　　',
    '正确的顺序是：____→____→____→____（示例：①→②→③→④）'
)
print("[FIX] poetry_047: 添加排序格式示例")

# poetry_085: add format hint
q = q_map['poetry_085']
q['question'] = q['question'].replace(
    '正确的顺序是：　　→　　→　　→　　',
    '正确的顺序是：____→____→____→____（示例：③→①→④→②）'
)
print("[FIX] poetry_085: 添加排序格式示例")

# poetry_017: answer format note
q = q_map['poetry_017']
q['analysis'] = q['analysis'] + '\n\n注意：第（2）题为教材节选，不包含首尾的"贤哉，回也"。'
print("[FIX] poetry_017: 添加节选说明")

# Fill blank standardization: use ____ for blanks in fill_blank type
for q in questions:
    if q['type'] == 'fill_blank':
        # Replace long underlines with mobile-friendly format
        q['question'] = q['question'].replace('________________', '____')
        # Fix multiple consecutive underlines
        import re
        q['question'] = re.sub(r'_{4,}', '____', q['question'])

# Fix knowledge_tag for all remaining "古诗词" that contain 文言文 content
for q in questions:
    if q['knowledge_tag'] == '古诗词':
        q['knowledge_tag'] = '古诗文'

print("[FIX] All knowledge_tag: 古诗词→古诗文")

# Fix ability_tag for fill_blank questions that are actually 判断/默写/翻译
for q in questions:
    if q['type'] == 'judgment' and q.get('ability_tag') == '诗句默写':
        q['ability_tag'] = '古诗理解'
    if q['type'] == 'fill_blank':
        if '翻译' in q.get('question', '') or '翻译' in q.get('answer', ''):
            q['ability_tag'] = '文言文翻译'

print("[FIX] ability_tag standardization")

# ============================================================
# FINAL: Re-number IDs after deleting duplicates
# ============================================================

# Renumber remaining questions sequentially
for i, q in enumerate(questions):
    new_id = f"poetry_{i+1:03d}"
    old_id = q['id']
    q['id'] = new_id
    if old_id != new_id:
        print(f"[RENUM] {old_id} → {new_id}")

# ============================================================
# SAVE
# ============================================================

save_json(questions, OUTPUT)
print(f"\n[DONE] Saved {len(questions)} questions to {OUTPUT}")
