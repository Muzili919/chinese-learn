#!/usr/bin/env python3
"""Convert fill_blank questions to single_choice in Chinese question bank files."""

import json

# === File 1: Classical Chinese (文言文) ===
classical_file = "src/data/questions_junior_chinese_classical.json"

# Manually crafted options for the 4 fill_blank questions
classical_conversions = {
    "jc_classical_013": {
        "options": [
            "A. 庭院中的月光清澈透明，水中水草纵横交错，原来是竹柏的影子",
            "B. 庭院中积满了明亮的水，水中有藻类和荇菜交织生长，还有竹柏倒映",
            "C. 庭院下面像一潭空旷的水面，水中长满了水草，竹子和柏树遮住了光线",
            "D. 庭院地面月光如水般澄澈，仿佛水草交错浮动，其实是竹柏的投影"
        ],
        "answer": "D"
    },
    "jc_classical_016": {
        "options": [
            "A. 在草丛中种树，在虫蚁中养兽，用土块堆成山丘，挖出沟壑",
            "B. 把丛草当作树林，把虫蚁当作野兽，把土砾凸处当山丘，凹处当沟谷",
            "C. 草丛之中藏着树林，虫蚁之间藏着野兽，土堆凸起成山丘，凹陷成沟谷",
            "D. 以草为原料编成树林，以虫蚁为标本做成野兽，用土石堆出山丘和沟谷"
        ],
        "answer": "B"
    },
    "jc_classical_019": {
        "options": [
            "A. 这个人详细地说了自己的所见所闻，大家都叹息惋惜",
            "B. 渔人把自己听到的事一一详细地告诉了他们，（村中人）都感叹惋惜",
            "C. 这个人把所听到的全讲了出来，桃花源中人都感到惊讶不已",
            "D. 村中人一一向渔人讲述了自己的经历，渔人听了非常惋惜"
        ],
        "answer": "B"
    },
    "jc_classical_023": {
        "options": [
            "A. 政令通行各地，人口增加，上百种废品都被利用起来了",
            "B. 政事顺利，百姓和乐，各种荒废的事业都重新兴办起来了",
            "C. 政府机关畅通无阻，人民团结一致，百座废弃建筑都重新修建了",
            "D. 政治清明通达，人心和睦，百官都精神振奋地投入工作"
        ],
        "answer": "B"
    }
}

# === File 2: Novel/名著阅读 ===
novel_file = "src/data/questions_junior_chinese_novel.json"

novel_conversions = {
    "jc_novel_se_001": {
        "options": [
            "A. 粗俗迷信、唠叨但心地善良，买《山海经》体现其质朴热忱",
            "B. 优雅知性、文化修养高，是鲁迅童年最重要的启蒙老师",
            "C. 刻薄自私、对鲁迅冷漠无情，经常欺负年幼的他",
            "D. 温柔贤淑、沉默寡言，默默照顾鲁迅的日常起居"
        ],
        "answer": "A"
    },
    "jc_novel_se_002": {
        "options": [
            "A. 百草园代表童年欢乐自由，三味书屋代表封建教育束缚，形成鲜明对比",
            "B. 两部分都是快乐的回忆，百草园有自然之趣，三味书屋有读书之乐",
            "C. 百草园令人恐惧，三味书屋才是鲁迅真正喜爱的地方",
            "D. 两部分没有对比关系，只是按照时间先后顺序记录不同经历"
        ],
        "answer": "A"
    },
    "jc_novel_se_003": {
        "options": [
            "A. 早上的花傍晚采摘，比喻鲁迅晚年回忆童年往事，蕴含怀念与审视",
            "B. 早上开花傍晚凋谢，感叹青春短暂、时光易逝的伤感",
            "C. 早晨的花朵代表新书内容，傍晚拾起表示反复阅读品味",
            "D. 朝花比喻农民的劳动成果，夕拾代表知识分子对社会的研究"
        ],
        "answer": "A"
    },
    "jc_novel_se_004": {
        "options": [
            "A. 仅使用儿童视角叙述，突出天真烂漫的童趣",
            "B. 儿童视角与成人视角并存，使文章兼具趣味性与深刻批判性",
            "C. 完全采用成年人的理性视角审视过去，批判封建社会",
            "D. 以旁观者第三人称视角客观记录，不带个人情感"
        ],
        "answer": "B"
    },
    "jc_novel_se_005": {
        "options": [
            "A. 孙悟空性格始终如一，从大闹天宫到取经路上都桀骜不驯",
            "B. 从桀骜不驯、蔑视权威，逐渐成长为沉稳有担当、修成正果",
            "C. 从胆小懦弱、畏首畏尾，变得勇猛无畏、敢作敢当",
            "D. 孙悟空大闹天宫时是英雄，取经时被降服变成了胆小怕事的人"
        ],
        "answer": "B"
    },
    "jc_novel_se_006": {
        "options": [
            "A. 白骨精三次变化害人，孙悟空未能识破，唐僧只好请观音相助",
            "B. 孙悟空三打白骨精，唐僧不辨真伪、轻信八戒挑拨而驱逐悟空",
            "C. 唐僧故意驱逐孙悟空，因为他觉得孙悟空不服从管教、过于凶残",
            "D. 白骨精三次被悟空打死，唐僧理解了悟空的苦心但仍将其送走"
        ],
        "answer": "B"
    },
    "jc_novel_se_007": {
        "options": [
            "A. 猪八戒贪吃好色、偷懒耍滑，一无是处，纯粹是反面形象",
            "B. 猪八戒憨厚率真又好吃懒做，既有缺点又有关键时刻的勇气",
            "C. 猪八戒是取经团队中最聪明的人，经常帮孙悟空出主意",
            "D. 猪八戒意志坚定，从不动摇取经信念，是取经团队的中坚力量"
        ],
        "answer": "B"
    },
    "jc_novel_se_008": {
        "options": [
            "A. 《西游记》以写实手法记录唐代玄奘取经的真实历史经历",
            "B. 通过奇幻人物、瑰丽场景和离奇情节展现浪漫主义想象",
            "C. 主要运用象征手法，每个妖怪都代表一种社会阶级",
            "D. 以讽刺批判为主，揭露明代官场的黑暗腐败"
        ],
        "answer": "B"
    },
    "jc_novel_se_009": {
        "options": [
            "A. 车被大兵抢走、钱被孙侦探敲诈、虎妞死后被迫卖车，根源是旧社会制度",
            "B. 祥子赌博输车、被骗买假车、酒后撞车，原因是个人不努力",
            "C. 第一次被刘四爷没收、第二次车被偷、第三次车被烧，因运气不好",
            "D. 三次都是因为自然灾害导致车损坏，与个人和社会都无关"
        ],
        "answer": "A"
    },
    "jc_novel_se_010": {
        "options": [
            "A. 歌颂个人奋斗的力量，只要努力就一定能成功改变命运",
            "B. 揭露旧社会对底层人民的摧残，批判个人奋斗的虚幻性",
            "C. 主要讲述北京城的风土人情，描绘老北京的市井生活",
            "D. 赞美旧社会的制度优越性，鼓励青年人积极投身建设"
        ],
        "answer": "B"
    },
    "jc_novel_se_011": {
        "options": [
            "A. 刘四爷善良慷慨，帮助祥子实现买车梦想的好心人",
            "B. 自私冷酷的车行老板，是祥子的车主，后成为其岳父",
            "C. 刘四爷是祥子的亲叔叔，一直照顾祥子的生活",
            "D. 他是革命者，组织车夫罢工反抗压迫，被反动派杀害"
        ],
        "answer": "B"
    },
    "jc_novel_se_012": {
        "options": [
            "A. 语言典雅庄重，多用文言词汇，体现北京文人的学识修养",
            "B. 大量运用北京口语方言和短句，语言生动活泼，富有生活气息",
            "C. 以书面语为主，句式复杂严谨，注重修辞和排比",
            "D. 完全模仿外国小说的翻译腔，没有明显的地域特色"
        ],
        "answer": "B"
    },
    "jc_novel_se_013": {
        "options": [
            "A. 单纯善良的科学家，一心研究海洋生物，不问世事",
            "B. 冷酷无情的复仇者，仇视所有人类，只想毁灭世界",
            "C. 博学多才、勇敢追求自由、反抗殖民压迫的矛盾复杂人物",
            "D. 胆小懦弱的逃亡者，害怕陆地社会而躲到海底生活"
        ],
        "answer": "C"
    },
    "jc_novel_se_014": {
        "options": [
            "A. 他们在海底只遇到了鲨鱼一种危险，旅途相对平淡安全",
            "B. 经历了巨型章鱼袭击、南极冰层被困、与鲨鱼搏斗等冒险，表达探索精神",
            "C. 全书主要描写海底风光，没有真正的危险和冒险经历",
            "D. 他们被海盗追杀、遭遇海啸、在荒岛求生，主题是求生与冒险"
        ],
        "answer": "B"
    },
    "jc_novel_se_015": {
        "options": [
            "A. 小说完全凭空想象，没有任何科学依据，纯属娱乐读物",
            "B. 以科学知识为基础进行合理推测，想象丰富但不荒诞，许多预见后来成真",
            "C. 主要记录作者亲身经历的航海故事，属于纪实文学而非科幻",
            "D. 以魔法和超自然力量为核心，类似奇幻小说"
        ],
        "answer": "B"
    },
    "jc_novel_se_016": {
        "options": [
            "A. 法布尔的观察浮于表面，主要依靠想象来描写昆虫行为",
            "B. 观察细致入微，长期跟踪昆虫生活史，并设计实验验证猜想",
            "C. 法布尔主要在实验室中解剖昆虫，注重分类而非行为观察",
            "D. 他只关注昆虫的外形特征，从不观察昆虫的生活习性和行为"
        ],
        "answer": "B"
    },
    "jc_novel_se_017": {
        "options": [
            "A. 纯粹的科学记录，语言枯燥但数据精确，适合专业研究者",
            "B. 科学与文学融合，用诗意语言和拟人手法使枯燥知识生动有趣",
            "C. 以虚构故事为主，昆虫的行为和习性大部分是作者杜撰的",
            "D. 采用小说叙事手法，为每种昆虫创造了完整的故事情节"
        ],
        "answer": "B"
    },
    "jc_novel_se_018": {
        "options": [
            "A. 法布尔迷信权威，总是引用前人结论，缺乏独立见解",
            "B. 求真务实不盲从、长期不懈观察、严谨设计实验验证假设",
            "C. 他主要靠翻阅文献资料写作，并不亲自观察活体昆虫",
            "D. 追求速成，快速观察记录后就下结论，不求甚解"
        ],
        "answer": "B"
    },
    "jc_novel_se_019": {
        "options": [
            "A. 斯诺笔下的毛泽东高高在上、威严神秘，让人敬畏",
            "B. 毛泽东生活简朴、平易近人、学识渊博、意志坚定的真实形象",
            "C. 毛泽东是一个暴君式人物，专制独裁，不听他人意见",
            "D. 毛泽东在书中只是被简单提及，没有详细描写其个人特点"
        ],
        "answer": "B"
    },
    "jc_novel_se_020": {
        "options": [
            "A. 红星指苏联援助，书名意思是苏联帮助中国取得了革命胜利",
            "B. 红星象征中共和革命事业，预示革命将照亮中国未来；作品打破了国民党新闻封锁",
            "C. 红星指天上的星星，寓意在黑暗中寻找光明的人生哲理",
            "D. 红星是红军军旗上的标志，书名单纯记录红军的行军路线"
        ],
        "answer": "B"
    }
}


def convert_file(filepath, conversions):
    """Convert fill_blank questions to single_choice in a JSON file."""
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    converted_count = 0
    for q in data:
        qid = q["id"]
        if qid in conversions:
            if q["type"] != "fill_blank":
                print(f"  WARNING: {qid} is not fill_blank (type={q['type']}), skipping")
                continue

            conv = conversions[qid]
            original_answer = q.get("answer", "")
            original_analysis = q.get("analysis", "")

            # Update the question
            q["type"] = "single_choice"
            q["options"] = conv["options"]
            q["answer"] = conv["answer"]

            # Keep the original long answer as part of analysis reference
            if original_answer and original_answer not in original_analysis:
                q["analysis"] = f"【原参考答案】{original_answer}\n\n【解析】{original_analysis}"

            converted_count += 1
            print(f"  Converted: {qid}")

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    return converted_count


def main():
    print("=== Converting fill_blank to single_choice ===\n")

    print(f"File 1: {classical_file}")
    n1 = convert_file(classical_file, classical_conversions)
    print(f"  -> Converted {n1} questions\n")

    print(f"File 2: {novel_file}")
    n2 = convert_file(novel_file, novel_conversions)
    print(f"  -> Converted {n2} questions\n")

    print(f"=== Done. Total converted: {n1 + n2} ===")

    # Verification
    print("\n=== Verifying ===")
    for filepath, conv_ids, label in [
        (classical_file, classical_conversions, "Classical"),
        (novel_file, novel_conversions, "Novel")
    ]:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        for q in data:
            if q["id"] in conv_ids:
                assert q["type"] == "single_choice", f"{q['id']} type is {q['type']}, expected single_choice!"
                assert len(q["options"]) == 4, f"{q['id']} has {len(q['options'])} options, expected 4!"
                assert q["answer"] in ["A", "B", "C", "D"], f"{q['id']} answer is {q['answer']}, expected A/B/C/D!"

        # Also verify no fill_blank remain for these IDs
        fill_blank_remaining = [q["id"] for q in data if q["type"] == "fill_blank" and q["id"] in conv_ids]
        assert len(fill_blank_remaining) == 0, f"{label}: fill_blank remaining: {fill_blank_remaining}"

    # Count total fill_blank remaining
    for filepath, label in [(classical_file, "Classical"), (novel_file, "Novel")]:
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        remaining = [q["id"] for q in data if q["type"] == "fill_blank"]
        print(f"  {label}: {len(remaining)} fill_blank remaining: {remaining}")

    print("=== Verification PASSED ===")


if __name__ == "__main__":
    main()
