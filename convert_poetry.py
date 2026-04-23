#!/usr/bin/env python3
"""Convert 25 fill_blank poetry questions (poetry_124-148) to single_choice."""

import json
import random

# 手工为每道题精心设计干扰项，确保干扰项质量高
# key = question id, value = [correct_answer, distractor1, distractor2, distractor3]
MC_OPTIONS = {
    "poetry_124": {
        "correct": "疑是地上霜",
        "distractors": [
            "低头思故乡",       # 同一首诗的下一联，常见混淆
            "举头望明月",       # 同一首诗，顺序搞混
            "露似真珠月似弓",   # 月亮相关诗句
        ]
    },
    "poetry_125": {
        "correct": "黄河入海流",
        "distractors": [
            "欲穷千里目",       # 同一首诗下一联
            "春风又绿江南岸",   # 著名写景句
            "白发三千丈",       # 李白名句，干扰
        ]
    },
    "poetry_126": {
        "correct": "万条垂下绿丝绦",
        "distractors": [
            "二月春风似剪刀",       # 同一首诗下一句
            "不知细叶谁裁出",       # 同一首诗，顺序混淆
            "草色遥看近却无",       # 早春相关
        ]
    },
    "poetry_127": {
        "correct": "遥看瀑布挂前川",
        "distractors": [
            "飞流直下三千尺",       # 同一首诗下一句
            "疑是银河落九天",       # 同一首诗，容易记混
            "黄河之水天上来",       # 李白另一首，气势类似
        ]
    },
    "poetry_128": {
        "correct": "一岁一枯荣",
        "distractors": [
            "野火烧不尽",       # 同一首诗下一联
            "春风吹又生",       # 同一首诗，最常混淆
            "风吹草低见牛羊",   # 草相关名句
        ]
    },
    "poetry_129": {
        "correct": "一枝红杏出墙来",
        "distractors": [
            "千树万树梨花开",       # 花/树相关，常见干扰
            "映日荷花别样红",       # 花相关
            "竹外桃花三两枝",       # 春天植物相关
        ]
    },
    "poetry_130": {
        "correct": "要留清白在人间",
        "distractors": [
            "烈火焚烧若等闲",       # 同一首诗上一句，容易搞混
            "化作春泥更护花",       # 奉献主题，常混淆
            "留取丹心照汗青",       # 文天祥，气节主题类似
        ]
    },
    "poetry_131": {
        "correct": "万马齐喑究可哀",
        "distractors": [
            "我劝天公重抖擞",       # 同一首诗下一句
            "不拘一格降人才",       # 同一首诗末句
            "化作春泥更护花",       # 龚自珍另一首，诗人相同
        ]
    },
    "poetry_132": {
        "correct": "西湖歌舞几时休",
        "distractors": [
            "暖风熏得游人醉",       # 同一首诗下一句
            "直把杭州作汴州",       # 同一首诗末句
            "水村山郭酒旗风",       # 写景名句，干扰
        ]
    },
    "poetry_133": {
        "correct": "水村山郭酒旗风",
        "distractors": [
            "南朝四百八十寺",       # 同一首诗下一句
            "多少楼台烟雨中",       # 同一首诗末句
            "千里莺啼绿映红",       # 同一首诗上句，容易搞混
        ]
    },
    "poetry_134": {
        "correct": "早有蜻蜓立上头",
        "distractors": [
            "树阴照水爱晴柔",       # 同一首诗上一句
            "小荷才露尖尖角",       # 同一首诗上句，容易选错
            "接天莲叶无穷碧",       # 荷花相关
        ]
    },
    "poetry_135": {
        "correct": "化作春泥更护花",
        "distractors": [
            "零落成泥碾作尘",       # 陆游咏梅，相似意象
            "要留清白在人间",       # 于谦，奉献主题
            "只缘身在此山中",       # 哲理诗干扰
        ]
    },
    "poetry_136": {
        "correct": "立根原在破岩中",
        "distractors": [
            "千磨万击还坚劲",       # 同一首诗下一句
            "任尔东西南北风",       # 同一首诗末句
            "要留清白在人间",       # 坚守主题类似
        ]
    },
    "poetry_137": {
        "correct": "天光云影共徘徊",
        "distractors": [
            "问渠那得清如许",       # 同一首诗下一句
            "为有源头活水来",       # 同一首诗末句
            "万紫千红总是春",       # 朱熹另一首，诗人相同
        ]
    },
    "poetry_138": {
        "correct": "万紫千红总是春",
        "distractors": [
            "天光云影共徘徊",       # 朱熹另一首
            "春色满园关不住",       # 春天主题
            "等闲识得东风面",       # 同一首诗上句，容易搞混
        ]
    },
    "poetry_139": {
        "correct": "谁言寸草心，报得三春晖",
        "distractors": [
            "独在异乡为异客，每逢佳节倍思亲",     # 思亲主题
            "海内存知己，天涯若比邻",             # 友情名句
            "洛阳亲友如相问，一片冰心在玉壶",     # 亲情/友情相关
        ]
    },
    "poetry_140": {
        "correct": "欲穷千里目，更上一层楼",
        "distractors": [
            "会当凌绝顶，一览众山小",       # 登高主题类似，杜甫
            "不畏浮云遮望眼，自缘身在最高层",  # 王安石登高
            "白日依山尽，黄河入海流",         # 同一首诗上联
        ]
    },
    "poetry_141": {
        "correct": "海内存知己，天涯若比邻",
        "distractors": [
            "劝君更尽一杯酒，西出阳关无故人",   # 送别名句王维
            "莫愁前路无知己，天下谁人不识君",   # 送别名句高适
            "桃花潭水深千尺，不及汪伦送我情",   # 友情名句李白
        ]
    },
    "poetry_142": {
        "correct": "春色满园关不住，一枝红杏出墙来",
        "distractors": [
            "不知细叶谁裁出，二月春风似剪刀",   # 春天名句
            "等闲识得东风面，万紫千红总是春",   # 春天名句朱熹
            "竹外桃花三两枝，春江水暖鸭先知",   # 春天名句苏轼
        ]
    },
    "poetry_143": {
        "correct": "随风潜入夜，润物细无声",
        "distractors": [
            "好雨知时节，当春乃发生",       # 同一首诗上一联
            "夜来风雨声，花落知多少",       # 春雨相关
            "渭城朝雨浥轻尘，客舍青青柳色新",  # 雨景名句
        ]
    },
    "poetry_144": {
        "correct": "问渠那得清如许？为有源头活水来",
        "distractors": [
            "半亩方塘一鉴开，天光云影共徘徊",   # 同一首诗上联
            "纸上得来终觉浅，绝知此事要躬行",   # 读书哲理陆游
            "读书破万卷，下笔如有神",           # 读书名句杜甫
        ]
    },
    "poetry_145": {
        "correct": "不识庐山真面目，只缘身在此山中",
        "distractors": [
            "横看成岭侧成峰，远近高低各不同",   # 同一首诗上联
            "欲穷千里目，更上一层楼",           # 哲理诗王之涣
            "山重水复疑无路，柳暗花明又一村",   # 哲理诗陆游
        ]
    },
    "poetry_146": {
        "correct": "会当凌绝顶，一览众山小",
        "distractors": [
            "欲穷千里目，更上一层楼",           # 登高哲理王之涣
            "不畏浮云遮望眼，自缘身在最高层",   # 登高哲理王安石
            "造化钟神秀，阴阳割昏晓",           # 同一首诗，杜甫《望岳》
        ]
    },
    "poetry_147": {
        "correct": "千磨万击还坚劲，任尔东西南北风",
        "distractors": [
            "粉骨碎身浑不怕，要留清白在人间",   # 坚守品格，于谦
            "咬定青山不放松，立根原在破岩中",   # 同一首诗上联
            "人生自古谁无死，留取丹心照汗青",   # 坚贞不屈文天祥
        ]
    },
    "poetry_148": {
        "correct": "粉骨碎身浑不怕，要留清白在人间",
        "distractors": [
            "人生自古谁无死，留取丹心照汗青",   # 文天祥，气节主题
            "千磨万击还坚劲，任尔东西南北风",   # 郑燮，坚守主题
            "不要人夸好颜色，只留清气满乾坤",   # 王冕，高洁品格主题
        ]
    },
}


def convert():
    filepath = "/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/questions_poetry.json"

    with open(filepath, "r", encoding="utf-8") as f:
        questions = json.load(f)

    target_ids = {f"poetry_{i}" for i in range(124, 149)}
    modified = 0

    for q in questions:
        if q["id"] not in target_ids:
            continue

        qid = q["id"]
        if qid not in MC_OPTIONS:
            print(f"WARNING: No options defined for {qid}, skipping")
            continue

        if q["type"] == "single_choice":
            print(f"  Skip {qid} (already converted)")
            continue
        if q["answer"] != MC_OPTIONS[qid]["correct"]:
            print(f"WARNING: {qid} answer mismatch: '{q['answer']}' vs '{MC_OPTIONS[qid]['correct']}'")
            continue

        correct = MC_OPTIONS[qid]["correct"]
        distractors = MC_OPTIONS[qid]["distractors"]

        # 用确定性映射确保均匀分布：每4题A/B/C/D各出现一次
        qnum = int(qid.split("_")[1])
        correct_pos = (qnum - 124) % 4  # 0,1,2,3 循环

        options_list = distractors + [correct]
        # 把正确答案放到目标位置
        options_list.remove(correct)
        options_list.insert(correct_pos, correct)

        # 找到正确答案的位置
        letters = ["A", "B", "C", "D"]
        formatted_options = []
        correct_answer = ""
        for i, opt in enumerate(options_list):
            formatted = f"{letters[i]}. {opt}"
            formatted_options.append(formatted)
            if opt == correct:
                correct_answer = formatted

        # 清理question中的填空标记
        question_text = q["question"]
        question_text = question_text.replace("________", "").rstrip("：:")
        # 如果末尾是冒号或没有标点，加上冒号
        if not question_text.endswith(("：", "？", "?", "。")):
            question_text += "："

        q["type"] = "single_choice"
        q["question"] = question_text
        q["options"] = formatted_options
        q["answer"] = correct_answer

        modified += 1
        print(f"✓ {qid}: correct={correct_answer}")

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)

    print(f"\nDone! Modified {modified} questions.")


if __name__ == "__main__":
    convert()
