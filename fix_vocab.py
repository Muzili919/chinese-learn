#!/usr/bin/env python3
"""
Convert fill-in-blank English vocabulary questions to 4-option multiple choice.

For each fill_blank question with empty options:
- Split multi-part questions into separate single_choice questions
- Generate plausible distractors based on question type
- Create A/B/C/D options with randomized correct position
- Update answer field to letter format

Already-converted single_choice questions are left unchanged.
"""

import json
import re
import random
import copy

INPUT_FILE = "/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/questions_en_vocab.json"

# ─── Distractor pools ─────────────────────────────────────────────────────

TRANSLATION_DISTRACTORS = {
    "interesting": ["感兴趣的", "无聊的", "兴奋的"],
    "weekend": ["工作日", "假期", "周日"],
    "delicious": ["危险的", "困难的", "不同的"],
    "grandparents": ["父母", "孙子孙女", "亲戚"],
    "science": ["社会", "数学", "自然"],
    "umbrella": ["雨衣", "太阳镜", "帽子"],
    "library": ["教室", "实验室", "操场"],
    "strawberry": ["蓝莓", "葡萄", "柠檬"],
    "expensive": ["便宜的", "漂亮的", "方便的"],
    "different": ["困难的", "相同的", "重要的"],
    "exciting": ["兴奋的", "无聊的", "害怕的"],
    "together": ["单独", "分离", "永远"],
    "favorite": ["重要的", "普通的", "困难的"],
    "important": ["不可能的", "有趣的", "便宜的"],
    "vegetable": ["水果", "肉类", "饮料"],
    "weekday": ["周末", "假期", "节日"],
    "famous": ["陌生的", "普通的", "安静的"],
    "careful": ["粗心的", "有用的", "漂亮的"],
    "useful": ["无聊的", "困难的", "粗心的"],
    "helpful": ["无助的", "美丽的", "勇敢的"],
    "beautiful": ["丑陋的", "有用的", "小心的"],
    "museum": ["图书馆", "医院", "超市"],
    "restaurant": ["银行", "邮局", "学校"],
    "supermarket": ["书店", "体育馆", "动物园"],
    "hospital": ["学校", "工厂", "博物馆"],
    "creative": ["懒惰的", "普通的", "安静的"],
    "patient": ["急躁的", "勇敢的", "诚实的"],
    "honest": ["勇敢的", "聪明的", "懒惰的"],
    "brave": ["胆小的", "聪明的", "懒惰的"],
    "difficult": ["容易的", "有趣的", "安全的"],
    "comfortable": ["不舒服的", "困难的", "危险的"],
    "dangerous": ["安全的", "有趣的", "容易的"],
    "village": ["城市", "小镇", "国家"],
    "mountain": ["河流", "海洋", "沙漠"],
    "forest": ["沙漠", "草原", "花园"],
    "lake": ["河流", "海洋", "池塘"],
    "scientist": ["老师", "医生", "司机"],
    "engineer": ["护士", "厨师", "画家"],
    "musician": ["科学家", "运动员", "医生"],
    "artist": ["音乐家", "作家", "教师"],
}

GENERIC_CN_POOL = [
    "美丽的", "困难的", "简单的", "有趣的", "无聊的",
    "重要的", "危险的", "便宜的", "昂贵的", "干净的",
    "脏的", "安静的", "吵闹的", "安全的", "聪明的",
    "懒惰的", "勇敢的", "害羞的", "友好的", "有用的",
    "高兴的", "伤心的", "生气的", "害怕的", "饥饿的",
    "渴的", "累的", "生病的", "健康的", "富有的",
    "贫穷的", "年轻的", "年老的", "大的", "小的",
    "长的", "短的", "快的", "慢的", "新的", "旧的",
]

SPELLING_DISTRACTORS = {
    "Wednesday": ["Wensday", "Wednsday", "Wednessday"],
    "February": ["Febuary", "Febrary", "Feburary"],
    "heavier": ["heaver", "heaviar", "heavyer"],
    "clever": ["cliver", "clevor", "cleever"],
    "hungry": ["hangry", "hunggry", "hunry"],
    "sunny": ["sanie", "suny", "sunney"],
    "doctor": ["docter", "doctar", "doctur"],
    "worry": ["wory", "worrie", "worre"],
    "apples": ["apple", "aples", "appls"],
    "rainy": ["rany", "rainey", "rainni"],
    "wake": ["wak", "waik", "wack"],
    "children": ["childrin", "childern", "childrenn"],
    "delicious": ["delicius", "dilicious", "deliceous"],
    "exercise": ["exersize", "exercize", "exersise"],
    "Monday": ["Munday", "Mondey", "Mondai"],
    "China": ["Chine", "Chyna", "Chiner"],
    "friend": ["frend", "freind", "frend"],
    "math": ["meth", "maths", "muth"],
    "quiet": ["qiet", "quiat", "quit"],
    "teacher": ["teecher", "techer", "teachar"],
    "thirsty": ["thursty", "thirstey", "thirsy"],
    "window": ["windo", "windou", "windaw"],
    "Friday": ["Fryday", "Fridey", "Firday"],
    "between": ["betwean", "betwin", "betwein"],
    "full": ["foll", "ful", "fuul"],
    "library": ["libary", "liberry", "librery"],
    "expensive": ["expensiv", "expansive", "expensave"],
    "fruit": ["frute", "fruiet", "froot"],
    "boring": ["boreing", "borring", "borig"],
    "pilot": ["pilat", "piloet", "pilit"],
    "turn": ["tern", "tourn", "tirn"],
    "salty": ["salte", "salti", "sawty"],
    "student": ["studant", "studint", "stewdent"],
    "train": ["trane", "trin", "trein"],
    "return": ["retourn", "retern", "riturn"],
    "heavy": ["hevy", "haevy", "heavey"],
    "builder": ["bildr", "bildar", "buildeer"],
    "toothache": ["toothack", "tuthake", "toothak"],
    "crowded": ["crowed", "crowdid", "croweded"],
    "dirty": ["dirti", "derty", "durty"],
    "policeman": ["poliseman", "policmen", "policeeman"],
    "piece": ["peice", "piexe", "pece"],
    "forget": ["forgete", "forgit", "forgett"],
    "large": ["lardge", "larje", "largs"],
    "nurse": ["nirse", "nurs", "nerse"],
    "careful": ["carefull", "carefil", "carful"],
    "fever": ["fevur", "fevar", "fevre"],
    "sun": ["sonn", "sunn", "sone"],
    "healthy": ["helthy", "healthey", "healthe"],
    "lie": ["lye", "ley", "li"],
    "famous": ["famouse", "famos", "famus"],
    "headache": ["headake", "hedake", "headach"],
    "strict": ["strickt", "strekt", "strikt"],
    "tidy": ["tidi", "tydi", "taydy"],
    "travel": ["traval", "travle", "travil"],
    "country": ["countrie", "countrey", "cuntree"],
    "beautiful": ["beautful", "beautifull", "beutiful"],
    "bread": ["bred", "brede", "breaed"],
    "wet": ["wett", "wat", "whet"],
    "childhood": ["childhud", "childhoode", "childhod"],
    "language": ["languige", "langwage", "languge"],
    "eleven": ["eleavin", "elevin", "eliven"],
    "friendship": ["frendship", "freindship", "friendshipp"],
    "accident": ["accidant", "axident", "accidint"],
    "excitement": ["excitment", "exitemant", "excitemint"],
    "usually": ["usally", "usuly", "usualy"],
    "environment": ["envierment", "envirement", "enviroment"],
    "vegetable": ["vegitable", "vejtabel", "vegatable"],
    "carrot": ["carot", "carrote", "kerrot"],
    "chocolate": ["chocolat", "choclate", "chocolatte"],
    "vacation": ["vacasion", "vacashun", "vacatian"],
    "particular": ["perticular", "particuler", "particlar"],
    "promise": ["promis", "promize", "promiss"],
    "celebrate": ["celeprate", "celebreit", "celabrate"],
    "education": ["edjucation", "educasion", "eduction"],
    "scientific": ["scienntific", "scientiffic", "sciencetific"],
    "confidence": ["confidance", "confidense", "confedence"],
    "resolution": ["resolusion", "resolutian", "resalution"],
    "eleventh": ["eleventhe", "elevent", "elventh"],
    "twelfth": ["twelvth", "twelf", "twellfth"],
    "twentieth": ["twentieth", "twentyth", "twenteeth"],
    "hundredth": ["hundreth", "hundreder", "hundredeth"],
    "excellent": ["exelent", "excellant", "exsellent"],
    "possible": ["possable", "posible", "possibul"],
    "popular": ["populer", "populare", "popularr"],
    # Months and days (commonly tested)
    "April": ["Apirl", "Aperil", "Aprill"],
    "May": ["Maye", "Mai", "Mey"],
    "June": ["Junn", "Junne", "Jume"],
    "July": ["Jully", "Juley", "Julie"],
    "August": ["Augest", "Agust", "Augest"],
    "September": ["Septemper", "Septmber", "Setpember"],
    "October": ["Octobor", "Octerber", "Octaber"],
    "November": ["Novemver", "Novmber", "Novermber"],
    "December": ["Decmber", "Decemper", "Deceber"],
    "January": ["Januray", "Janary", "Januery"],
    "March": ["Marc", "Marchh", "Morch"],
    "Sunday": ["Sundey", "Sundai", "Sonday"],
    "Monday": ["Munday", "Mondey", "Mondai"],
    "Tuesday": ["Tusday", "Teusday", "Tewsday"],
    "Wednesday": ["Wensday", "Wednsday", "Wednessday"],
    "Thursday": ["Thirsday", "Thersday", "Thurseday"],
    "Friday": ["Fryday", "Fridey", "Firday"],
    "Saturday": ["Saterday", "Satuday", "Saterdey"],
    # More common words
    "breakfast": ["breakfst", "breakfist", "brekfast"],
    "dinner": ["diner", "dinnder", "dynner"],
    "supper": ["supor", "supper", "supir"],
    "lunch": ["lunc", "lunsh", "lunche"],
    "shy": ["shye", "shigh", "shai"],
    "polite": ["polight", "poleit", "poliete"],
    "friendly": ["frendly", "frendley", "friendley"],
    "hard-working": ["hard-workeng", "hard-workin", "hard-werking"],
    "active": ["acteve", "activ", "actieve"],
    "clever": ["cliver", "clevor", "cleever"],
    "tidy": ["tidi", "tydi", "taydy"],
    "quiet": ["qiet", "quiat", "quit"],
    "strict": ["strickt", "strekt", "strikt"],
    "honest": ["honist", "hounest", "honnest"],
    "interesting": ["intresting", "interisting", "intteresting"],
    "expensive": ["expensiv", "expansive", "expensave"],
    "famous": ["famouse", "famos", "famus"],
    "different": ["diffrent", "difrent", "differnt"],
    "together": ["togheter", "togehter", "togather"],
    "umbrella": ["umbrela", "umberella", "umbrealla"],
    "restaurant": ["restarant", "restuarant", "restrant"],
    "supermarket": ["supermaket", "supermarcet", "supermrket"],
}

PHRASE_EN_TO_CN = {
    "do morning exercises": ["吃早饭", "做作业", "上早课"],
    "go swimming": ["去钓鱼", "去购物", "去跑步"],
    "watch TV": ["看书", "听音乐", "画画"],
    "play the piano": ["弹吉他", "拉小提琴", "打篮球"],
    "do homework": ["做运动", "做家务", "做游戏"],
    "listen to music": ["看电视", "看电影", "看书"],
    "have a cold": ["发烧了", "头痛了", "肚子疼了"],
    "next to": ["在后面", "在上面", "在下面"],
    "get together": ["分开", "吵架", "比赛"],
    "put on": ["脱下", "扔掉", "捡起"],
    "turn on": ["关掉", "调低", "扔掉"],
    "wait for": ["寻找", "照顾", "放弃"],
    "get up": ["坐下", "躺下", "站起"],
    "look after": ["寻找", "看着", "忽视"],
    "sweep the floor": ["擦窗户", "洗碗", "打扫桌子"],
    "run away": ["走过来", "跑回来", "站起来"],
    "fall down": ["站起来", "爬上去", "跳起来"],
    "wake up": ["睡着", "做梦", "熬夜"],
    "belong to": ["远离", "靠近", "离开"],
    "take part in": ["退出", "取消", "忽略"],
    "be proud of": ["为…羞愧", "为…担心", "为…难过"],
    "in front of": ["在后面", "在上面", "在旁边"],
    "as soon as": ["直到", "除非", "虽然"],
    "depend on": ["独立于", "无关", "反对"],
    "get along with": ["吵架", "分手", "竞争"],
    "deal with": ["忽略", "逃避", "放弃"],
    "look forward to": ["回顾", "忽略", "害怕"],
    "break into": ["闯出", "走出来", "跳进去"],
    "run into": ["跑出", "跳过", "跑过"],
    "come across": ["走过", "错过", "穿过"],
    "get over": ["陷入", "放弃", "逃避"],
    "come true": ["失败", "消失", "破碎"],
    "fall asleep": ["醒来", "做梦", "失眠"],
    "make a decision": ["改变主意", "放弃计划", "推迟行动"],
    "make up": ["拆开", "放弃", "取消"],
    "give up": ["开始", "继续", "接受"],
    "put up": ["取下", "收起", "拆掉"],
    "take up": ["放弃", "结束", "放下"],
    "keep on": ["停止", "放弃", "中断"],
    "carry on": ["停止", "放弃", "取消"],
    "go on": ["停止", "返回", "结束"],
    "hold on": ["放弃", "挂断", "松手"],
    "cut up": ["粘合", "组合", "整理"],
    "clean up": ["弄脏", "打乱", "破坏"],
    "pick up": ["放下", "扔掉", "推倒"],
    "stay up": ["早睡", "小睡", "午休"],
    "set up": ["拆除", "关闭", "取消"],
    "give away": ["收下", "购买", "保存"],
    "put away": ["拿出", "扔掉", "展示"],
    "take off": ["穿上", "戴上", "系上"],
    "look out": ["忽视", "不注意", "忘记"],
    "come up with": ["放弃", "忘记", "拒绝"],
    "run out of": ["充满", "积累", "获得"],
    "point out": ["隐藏", "忽略", "遮盖"],
    "find out": ["隐藏", "忘记", "忽略"],
    "work out": ["放弃", "忽略", "制造"],
    "put out": ["点燃", "生火", "燃烧"],
    "be late for": ["准时到达", "提前到达", "缺席"],
    "be good at": ["不擅长", "害怕", "讨厌"],
    "be afraid of": ["喜欢", "勇敢面对", "亲近"],
    "be interested in": ["厌烦", "害怕", "讨厌"],
    "get off": ["上车", "停车", "启动"],
    "get on": ["下车", "离开", "停下"],
    "take care of": ["忽视", "伤害", "丢弃"],
    "come back": ["离开", "出发", "消失"],
    "look for": ["找到", "放弃", "忽略"],
    "come in": ["出去", "离开", "通过"],
    "turn off": ["打开", "调高", "启动"],
    "hurry up": ["慢下来", "停下来", "等待"],
    "have a look": ["闭眼", "转身", "忽略"],
    "do housework": ["做作业", "做运动", "做游戏"],
    "go fishing": ["去游泳", "去购物", "去爬山"],
    "wash the dishes": ["洗衣服", "扫地", "擦桌子"],
    "play the violin": ["弹钢琴", "打鼓", "吹笛"],
    "fly a kite": ["放气球", "放烟花", "打羽毛球"],
    "ride a bike": ["开汽车", "坐公交", "走路"],
    "take photos": ["画画", "写日记", "唱歌"],
    "make a snowman": ["堆沙堡", "折纸", "画雪景"],
    "look down upon": ["尊敬", "羡慕", "崇拜"],
    "get used to": ["讨厌", "害怕", "不习惯"],
    "listen to": ["忽略", "拒绝", "反对"],
    "talk to": ["不理", "躲避", "远离"],
    "write to": ["打电话", "拜访", "见面"],
    "turn down": ["调高", "打开", "调亮"],
    "turn up": ["调低", "关掉", "调暗"],
}

# ─── Key mapping: expand 2-option pairs to 4 options ──────────────────────
# For vocabulary usage questions that only have 2 inline choices,
# we need to add 2 more plausible distractors to make a proper 4-option MC.
# We map (choice1, choice2) -> 2 additional distractors

OPTION_PAIR_EXPANSION = {
    ("have", "has"): ["had", "having"],
    ("like", "likes"): ["liked", "liking"],
    ("go", "goes"): ["went", "going"],
    ("is", "are"): ["am", "was"],
    ("my", "I"): ["mine", "me"],
    ("Who's", "Whose"): ["Who", "Whom"],
    ("we", "us"): ["our", "ours"],
    ("in", "on"): ["at", "under"],
    ("shop", "shopping"): ["shopped", "shops"],
    ("a", "an"): ["the", "some"],
    ("tall", "taller"): ["tallest", "short"],
    ("dance", "dances"): ["danced", "dancing"],
    ("to go", "go"): ["going", "went"],
    ("for", "to"): ["at", "with"],
    ("my", "mine"): ["I", "me"],
    ("do", "does"): ["did", "doing"],
    ("young", "younger"): ["youngest", "old"],
    ("swim", "swimming"): ["swam", "swims"],
    ("don't", "doesn't"): ["didn't", "won't"],
    ("Do", "Does"): ["Did", "Will"],
    ("many", "much"): ["some", "few"],
    ("want", "wants"): ["wanted", "wanting"],
    ("am", "is"): ["are", "was"],
    ("Who", "Whom"): ["Whose", "Which"],
    ("Who", "Whose"): ["Whom", "Which"],
    ("to meet", "meet"): ["meeting", "met"],
    ("sleep", "sleeping"): ["slept", "sleeps"],
    ("What", "How"): ["Which", "Where"],
    ("teach", "teaches"): ["taught", "teaching"],
    ("better", "best"): ["good", "well"],
    ("some", "any"): ["many", "much"],
    ("go", "went"): ["goes", "going"],
    ("good", "well"): ["better", "best"],
    ("to play", "play"): ["playing", "played"],
    ("interested", "interesting"): ["interest", "interests"],
    ("more", "most"): ["much", "many"],
    ("apple", "apples"): ["banana", "oranges"],
    ("knife", "knives"): ["forks", "spoons"],
    ("to sing", "sing"): ["singing", "sang"],
    ("fast", "faster"): ["fastest", "slow"],
    ("see", "seeing"): ["saw", "seen"],
    ("clean", "to clean"): ["cleaning", "cleaned"],
    ("watch", "watching"): ["watched", "watches"],
    ("to have", "have"): ["having", "had"],
    ("speak", "speaks"): ["spoke", "speaking"],
    ("spend", "spends"): ["spent", "spending"],
    ("study", "studies"): ["studied", "studying"],
    ("a little", "a few"): ["some", "many"],
    ("exciting", "excited"): ["excite", "excites"],
    ("is", "am"): ["are", "was"],
    ("much", "many"): ["some", "few"],
}


def expand_two_options(choices, correct, context=""):
    """Given 2 choices, return 4 total options (2 original + 2 distractors)."""
    # Normalize: create a sorted key
    key = tuple(sorted(choices, key=lambda x: x.lower()))
    key_rev = tuple(sorted(choices, key=lambda x: x.lower(), reverse=True))

    if key in OPTION_PAIR_EXPANSION:
        extras = OPTION_PAIR_EXPANSION[key]
    elif key_rev in OPTION_PAIR_EXPANSION:
        extras = OPTION_PAIR_EXPANSION[key_rev]
    else:
        # Try case-insensitive match
        found = False
        for k, v in OPTION_PAIR_EXPANSION.items():
            if (k[0].lower() == choices[0].lower() and k[1].lower() == choices[1].lower()) or \
               (k[0].lower() == choices[1].lower() and k[1].lower() == choices[0].lower()):
                extras = v
                found = True
                break
        if not found:
            # Last resort: generate form variants
            base = choices[0] if len(choices[0]) <= len(choices[1]) else choices[1]
            extras = []
            if base.endswith('e'):
                extras = [base + 'd', base + 's']
            elif base.endswith('y'):
                extras = [base[:-1] + 'ied', base + 'ing']
            else:
                extras = [base + 'ed', base + 'ing']

    # Make sure extras don't duplicate correct answer
    extras = [e for e in extras if e != correct and e not in choices]
    result = choices + extras[:2]

    # If still < 4, add generic ones
    while len(result) < 4:
        result.append(f"[{len(result)+1}]")

    return result[:4]


# ─── Parsing helpers ──────────────────────────────────────────────────────

def parse_sub_items(text):
    """Parse '（1）xxx （2）yyy' into [(num, text), ...]"""
    return [(m[0], m[1].strip()) for m in re.findall(r'（(\d+)）(.+?)(?=（\d+）|$)', text, re.DOTALL)]


def parse_inline_choices(question_text):
    """Parse '（1）I ______ (have / has) a pen.' -> {num: {'context': str, 'choices': [str]}}"""
    results = {}
    for num, text in parse_sub_items(question_text):
        choice_match = re.search(r'\(([^)]+)\)', text)
        if choice_match:
            choices = [c.strip() for c in choice_match.group(1).split('/')]
            results[num] = {'context': text, 'choices': choices}
    return results


# ─── Distractor generators ────────────────────────────────────────────────

def distractors_translation(correct_cn, context=""):
    for eng, dists in TRANSLATION_DISTRACTORS.items():
        if eng.lower() in context.lower() and correct_cn not in dists:
            return dists[:3]
    pool = [d for d in GENERIC_CN_POOL if d != correct_cn]
    random.shuffle(pool)
    return pool[:3]


def distractors_spelling(correct):
    if correct in SPELLING_DISTRACTORS:
        return SPELLING_DISTRACTORS[correct][:3]
    dists = []
    for i, c in enumerate(correct):
        if c in 'aeiou' and i > 0:
            d = correct[:i] + c + c + correct[i+1:]
            if d != correct:
                dists.append(d); break
    for i in range(len(correct) - 1):
        d = correct[:i] + correct[i+1] + correct[i] + correct[i+2:]
        if d != correct and d not in dists:
            dists.append(d); break
    for i, c in enumerate(correct):
        if c in 'aeiou' and 0 < i < len(correct)-1:
            d = correct[:i] + correct[i+1:]
            if d != correct and d not in dists:
                dists.append(d); break
    attempts = 0
    while len(dists) < 3 and attempts < 50:
        attempts += 1
        idx = random.randint(0, len(correct)-1)
        if correct[idx] in 'aeiouAEIOU':
            rep = random.choice([c for c in 'aeiou' if c != correct[idx].lower()])
            d = correct[:idx] + rep + correct[idx+1:]
            if d != correct and d not in dists:
                dists.append(d)
        elif len(correct) > 2:
            # Try doubling a consonant or removing a letter
            method = random.choice(['double', 'remove', 'swap'])
            if method == 'double' and idx > 0:
                d = correct[:idx] + correct[idx] + correct[idx:]
                if d != correct and d not in dists:
                    dists.append(d)
            elif method == 'remove' and 0 < idx < len(correct)-1:
                d = correct[:idx] + correct[idx+1:]
                if d != correct and d not in dists:
                    dists.append(d)
            elif method == 'swap' and idx < len(correct)-1:
                d = correct[:idx] + correct[idx+1] + correct[idx] + correct[idx+2:]
                if d != correct and d not in dists:
                    dists.append(d)

    # Final fallback: add generic misspelling patterns
    while len(dists) < 3:
        i = len(dists)
        d = correct + chr(ord('a') + i)  # Just append a letter
        if d != correct and d not in dists:
            dists.append(d)
    return dists[:3]


def distractors_phrase_cn(phrase_en, correct_cn):
    if phrase_en in PHRASE_EN_TO_CN:
        d = [x for x in PHRASE_EN_TO_CN[phrase_en] if x != correct_cn]
        if len(d) >= 3:
            return d[:3]
    pool = ["打开", "关闭", "开始", "结束", "拿起", "放下", "穿上", "脱下",
            "找到", "丢失", "记住", "忘记", "打扫", "整理", "保护", "破坏"]
    pool = [p for p in pool if p != correct_cn]
    random.shuffle(pool)
    return pool[:3]


def distractors_phrase_en(correct_en):
    pool = [p for p in PHRASE_EN_TO_CN.keys() if p != correct_en]
    random.shuffle(pool)
    return pool[:3]


# ─── Core converter ───────────────────────────────────────────────────────

def make_mc(options, correct):
    """Shuffle options, return (shuffled, letter)."""
    assert correct in options, f"'{correct}' not in {options}"
    s = options[:]
    random.shuffle(s)
    return s, chr(ord('A') + s.index(correct))


def fmt_opts(opts):
    return f"\n\nA. {opts[0]}\nB. {opts[1]}\nC. {opts[2]}\nD. {opts[3]}"


def process_vocab_usage(q):
    """Handle 词汇运用 (inline_choices) questions."""
    results = []
    answers = dict(parse_sub_items(q["answer"]))

    # For each sub-question, parse inline choices manually
    for sub_num, sub_text in parse_sub_items(q["question"]):
        correct = answers.get(sub_num, "").strip()
        if not correct:
            continue

        # Skip multi-blank answers (containing ';')
        if ';' in correct:
            # Split into two separate questions
            blanks = re.findall(r'\(([^)]+)\)', sub_text)
            correct_parts = [c.strip() for c in correct.split(';')]
            # Split the sentence at the second blank
            # Just skip these - they're too complex for single MC
            continue

        # Find all parenthetical choice groups
        choice_groups = re.findall(r'\(([^)]+)\)', sub_text)
        if not choice_groups:
            continue

        # Use the first choice group (typically the only one)
        choices = [c.strip() for c in choice_groups[0].split('/')]

        # If correct answer is not in choices, add it
        if correct not in choices:
            choices = choices + [correct]

        # Expand to 4 options if needed
        if len(choices) < 4:
            choices = expand_two_options(choices, correct, sub_text)

        choices = choices[:4]
        shuffled, letter = make_mc(choices, correct)

        sq = copy.deepcopy(q)
        sq["id"] = f"{q['id']}_{sub_num}"
        sq["type"] = "single_choice"
        # Remove the inline choice parentheses from the question text
        clean_context = re.sub(r'\(([^)]+)\)', '______', sub_text)
        sq["question"] = clean_context + fmt_opts(shuffled)
        sq["options"] = shuffled
        sq["answer"] = letter
        sq.pop("inline_choices", None)
        results.append(sq)

    return results or [q]


def process_translation(q):
    """Handle 词汇翻译 questions."""
    results = []
    subs = parse_sub_items(q["question"])
    answers = dict(parse_sub_items(q["answer"]))

    for num, sq_text in subs:
        correct = answers.get(num, "").strip()
        if not correct:
            continue
        eng_part = sq_text.replace("__________", "").strip()

        if "写出" in q["question"] and "中文" in q["question"]:
            dists = distractors_translation(correct, eng_part)
            opts = [correct] + dists
            shuffled, letter = make_mc(opts, correct)
            question = f"{eng_part} 的中文意思是？" + fmt_opts(shuffled)
        elif "根据汉语提示" in q["question"]:
            dists = distractors_spelling(correct)
            opts = [correct] + dists
            shuffled, letter = make_mc(opts, correct)
            question = f"{eng_part}的英文是？" + fmt_opts(shuffled)
        else:
            dists = distractors_translation(correct, eng_part)
            opts = [correct] + dists
            shuffled, letter = make_mc(opts, correct)
            question = sq_text + fmt_opts(shuffled)

        sq = copy.deepcopy(q)
        sq["id"] = f"{q['id']}_{num}"
        sq["type"] = "single_choice"
        sq["question"] = question
        sq["options"] = shuffled
        sq["answer"] = letter
        results.append(sq)

    return results or [q]


def process_spelling(q):
    """Handle 单词拼写 questions."""
    results = []
    subs = parse_sub_items(q["question"])
    answers = dict(parse_sub_items(q["answer"]))

    for num, sq_text in subs:
        correct = answers.get(num, "").strip()
        if not correct:
            continue
        dists = distractors_spelling(correct)
        opts = [correct] + dists
        shuffled, letter = make_mc(opts, correct)

        if "音标" in q["question"]:
            phonetic = re.search(r'/[^/]+/', sq_text)
            phonetic_str = phonetic.group(0) if phonetic else ""
            question = f"音标 {phonetic_str} 对应的单词是？" + fmt_opts(shuffled)
        else:
            question = sq_text + fmt_opts(shuffled)

        sq = copy.deepcopy(q)
        sq["id"] = f"{q['id']}_{num}"
        sq["type"] = "single_choice"
        sq["question"] = question
        sq["options"] = shuffled
        sq["answer"] = letter
        results.append(sq)

    return results or [q]


def process_phrase(q):
    """Handle 词组搭配 questions."""
    results = []
    subs = parse_sub_items(q["question"])
    answers = dict(parse_sub_items(q["answer"]))

    if "写出" in q["question"] and "中文意思" in q["question"]:
        for num, sq_text in subs:
            correct = answers.get(num, "").strip()
            if not correct:
                continue
            eng = sq_text.replace("__________", "").strip()
            dists = distractors_phrase_cn(eng, correct)
            opts = [correct] + dists
            shuffled, letter = make_mc(opts, correct)
            sq = copy.deepcopy(q)
            sq["id"] = f"{q['id']}_{num}"
            sq["type"] = "single_choice"
            sq["question"] = f"{eng} 的中文意思是？" + fmt_opts(shuffled)
            sq["options"] = shuffled
            sq["answer"] = letter
            results.append(sq)

    elif "将" in q["question"] and "连线" in q["question"]:
        left = dict(re.findall(r'(\d+)\.\s*(.+?)(?=\n\d+\.|\n\n|$)', q["question"], re.DOTALL))
        right = dict(re.findall(r'([A-D])\.\s*(.+?)(?=\n[A-D]\.|\n\n|$)', q["question"], re.DOTALL))
        mapping = dict(re.findall(r'(\d+)[—\-–]\s*([A-D])', q["answer"]))
        right_values = [v.strip() for v in right.values()]

        for lnum, eng in left.items():
            rletter = mapping.get(lnum, "")
            if not rletter or rletter not in right:
                continue
            correct_cn = right[rletter].strip()
            if len(right_values) == 4:
                shuffled, letter = make_mc(right_values[:], correct_cn)
            else:
                dists = distractors_phrase_cn(eng.strip(), correct_cn)
                opts = [correct_cn] + dists
                shuffled, letter = make_mc(opts, correct_cn)

            sq = copy.deepcopy(q)
            sq["id"] = f"{q['id']}_{lnum}"
            sq["type"] = "single_choice"
            sq["question"] = f"{eng.strip()} 的中文意思是？" + fmt_opts(shuffled)
            sq["options"] = shuffled
            sq["answer"] = letter
            results.append(sq)

    elif "根据汉语提示" in q["question"] and "短语" in q["question"]:
        for num, sq_text in subs:
            correct = answers.get(num, "").strip()
            if not correct:
                continue
            dists = distractors_phrase_en(correct)
            opts = [correct] + dists
            shuffled, letter = make_mc(opts, correct)
            cn = sq_text.replace("__________", "").strip()
            sq = copy.deepcopy(q)
            sq["id"] = f"{q['id']}_{num}"
            sq["type"] = "single_choice"
            sq["question"] = f"{cn}的英文短语是？" + fmt_opts(shuffled)
            sq["options"] = shuffled
            sq["answer"] = letter
            results.append(sq)

    elif "用适当的介词" in q["question"]:
        for num, sq_text in subs:
            correct = answers.get(num, "").strip()
            if not correct:
                continue
            prep_pool = ["at", "in", "on", "for", "to", "with", "from", "by", "of", "about"]
            dists = [p for p in prep_pool if p != correct]
            random.shuffle(dists)
            opts = [correct] + dists[:3]
            shuffled, letter = make_mc(opts, correct)
            sq = copy.deepcopy(q)
            sq["id"] = f"{q['id']}_{num}"
            sq["type"] = "single_choice"
            sq["question"] = sq_text + fmt_opts(shuffled)
            sq["options"] = shuffled
            sq["answer"] = letter
            results.append(sq)

    elif "选择正确的词组" in q["question"]:
        header = re.search(r'A\.\s*(.+?)\s+B\.\s*(.+?)\s+C\.\s*(.+?)\s+D\.\s*(.+)', q["question"])
        if header:
            all_opts = [header.group(i).strip() for i in range(1, 5)]
            for num, sq_text in subs:
                correct_letter = answers.get(num, "").strip()
                if not correct_letter or correct_letter not in "ABCD":
                    continue
                correct = all_opts[ord(correct_letter) - ord('A')]
                shuffled, letter = make_mc(all_opts[:], correct)
                sq = copy.deepcopy(q)
                sq["id"] = f"{q['id']}_{num}"
                sq["type"] = "single_choice"
                sq["question"] = sq_text + fmt_opts(shuffled)
                sq["options"] = shuffled
                sq["answer"] = letter
                results.append(sq)

    return results or [q]


def process_question(q):
    """Route a question to the appropriate handler."""
    if q.get("type") == "single_choice" and q.get("options"):
        return [q]
    if q.get("type") != "fill_blank":
        return [q]

    ability = q.get("ability_tag", "")
    if ability == "词汇运用":
        return process_vocab_usage(q)
    elif ability == "词汇翻译":
        return process_translation(q)
    elif ability == "单词拼写":
        return process_spelling(q)
    elif ability == "词组搭配":
        return process_phrase(q)
    return [q]


def main():
    random.seed(42)

    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        questions = json.load(f)

    print(f"Loaded {len(questions)} questions")

    new_questions = []
    for q in questions:
        new_questions.extend(process_question(q))

    # Re-number IDs sequentially
    for i, q in enumerate(new_questions):
        q["id"] = f"en_vocab_{i+1:03d}"

    print(f"Generated {len(new_questions)} questions total")

    # Stats
    type_counts, ability_counts = {}, {}
    for q in new_questions:
        type_counts[q.get("type", "?")] = type_counts.get(q.get("type", "?"), 0) + 1
        ability_counts[q.get("ability_tag", "?")] = ability_counts.get(q.get("ability_tag", "?"), 0) + 1
    print("\nBy type:")
    for t, c in sorted(type_counts.items()):
        print(f"  {t}: {c}")
    print("\nBy ability:")
    for a, c in sorted(ability_counts.items()):
        print(f"  {a}: {c}")

    # Validation
    issues = []
    for q in new_questions:
        if q.get("type") != "single_choice":
            issues.append(f"{q['id']}: not single_choice")
            continue
        opts = q.get("options", [])
        ans = q.get("answer", "")
        if len(opts) != 4:
            issues.append(f"{q['id']}: {len(opts)} options")
        if ans not in ("A", "B", "C", "D"):
            issues.append(f"{q['id']}: answer='{ans}'")
        for o in opts:
            if o.startswith("—") or o.startswith("[") or o.strip() == "":
                issues.append(f"{q['id']}: bad option '{o}'")

    if issues:
        print(f"\nIssues ({len(issues)}):")
        for i in issues[:30]:
            print(f"  {i}")
        if len(issues) > 30:
            print(f"  ... and {len(issues)-30} more")
    else:
        print("\nAll questions validated OK - no issues found!")

    with open(INPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(new_questions, f, ensure_ascii=False, indent=2)
    print(f"\nWritten to {INPUT_FILE}")


if __name__ == "__main__":
    main()
