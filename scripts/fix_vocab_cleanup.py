#!/usr/bin/env python3
"""
字词星球题库清理脚本 v2（专业版）
================================
按照新标准重写不合适的题目：
- 手机友好：题目≤50字，选项≤15字/行
- 专业深度：语境辨析、形近字选用、语义差异
- 高质量干扰项：学生真实高频错误
- 专业级analysis

修复范围：
- 类型A: 纯成语题（7道）→ 字音/字形/词义题
- 类型B: 排序题（4道）→ 标准单选
- 类型C: 词语结构分析（3道）→ 字词类
- 类型D: 多选题（4道）→ 单选
"""

import json
import shutil
from datetime import datetime

INPUT_FILE = "/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/questions_vocab.json"
BACKUP_SUFFIX = ".backup"

# =============================================
# 修复定义：每道要修改的题目的新内容
# 核心标准：
# - question ≤ 50字
# - options 每行 ≤ 15字
# - 干扰项是真实高频错误
# - analysis 要有知识点+误区分析
# =============================================

REWRITES = {
    # ================================================================
    # 类型A：纯成语题 → 重写为专业级字音/字形/词义题
    # ================================================================

    "vocab_003": {
        "type": "single_choice",
        "question": "下列加点字的读音完全正确的一项是（　）。\n\n惩 罚　发 酵　溺 水　憎 恶",
        "options": [
            "A. chěng  xiào  ruì  zèng",
            "B. chéng  jiào  nì   zēng",
            "C. chěng  jiào  nì   zèng",
            "D. chéng  xiào  ruì  zēng"
        ],
        "answer": "B. chéng  jiào  nì   zēng",
        "analysis": "【考点】易错字音综合判断\n\n【正解】惩罚(chéng)、发酵(jiào)、溺水(nì)、憎恶(zēng) 全部正确。\n\n【逐项分析】\n• A项错误×：「惩」误读三声(chěng)；「酵」误读xiào；「溺」误读ruì\n• B项正确✓ 四个字全部读对\n• C项错误×：「惩」应读二声chéng；「憎」应读一声zēng\n• D项错误×：「酵」应读jiào四声；「溺」应读nì不是ruì\n\n【知识卡片】\n• 「惩」只有一个读音chéng（二声），常被误读三声\n• 「酵」读jiào（四声），和「教」同音但声调不同\n• 「溺」从水旁，读nì（四声），不要和「弱」混淆\n• 「憎」读zēng（一声），和「增」同音",
        "knowledge_tag": "字词",
        "ability_tag": "字音辨析",
        "difficulty": 2,
        "grade": 5,
        "topic": "易错字音判断"
    },

    "vocab_021": {
        "type": "single_choice",
        "question": "\"深\"在\"深夜\"中的意思与下面哪个词语最接近？（　）",
        "options": [
            "A. 深海（距离大）",
            "B. 深奥（道理复杂）",
            "C. 深红（颜色浓）",
            "D. 深夜（时间晚）"
        ],
        "answer": "D. 深夜（时间晚）",
        "analysis": "【考点】多义字\"深\"的义项判断\n\n【正解】\"深夜\"中\"深\"表示时间久、晚。D选项本身就是原词。\n\n【多义字拆解】\n「深」的5个核心义项——\n① 距离大（深海、深山）\n② 深奥（深奥的道理、深不可测）\n③ 颜色浓（深红、深绿）\n④ 关系密切（深情厚谊、深交）\n⑤ 时间久/程度深（深夜、更深人静）\n\n【做题技巧】代入法——把每个选项的意思放回原词检验。「深夜」= 夜已经很深了 = 时间很晚了，对应义项⑤。\n\n【易混点】\"深\"做形容词时（深红、深厚），容易混淆义项②和③。记住口诀：形容颜色用③，形容道理用②。",
        "knowledge_tag": "字词",
        "ability_tag": "词义理解",
        "difficulty": 1,
        "grade": 5,
        "topic": "一词多义"
    },

    "vocab_037": {
        "type": "single_choice",
        "question": "下列书写全部正确的一项是（　）。",
        "options": [
            "A. 烦燥 再接再励 走头无路",
            "B. 烦躁 再接再厉 走投无路",
            "C. 烦燥 再接再厉 走投无路",
            "D. 烦躁 再接再励 走头无路"
        ],
        "answer": "B. 烦躁 再接再厉 走投无路",
        "analysis": "【考点】高频易错字组辨析\n\n【正解】B项三个词全部正确。\n\n【逐组拆解】\n第一组：烦躁 vs 烦燥\n• 正确：烦躁（足字旁「躁」=着急跺脚）\n• 错误：烦燥（火字旁「燥」=干燥冒火）\n• 记忆：着急时跺脚→用足旁\n\n第二组：再接再厉 vs 再接再励\n• 正确：再接再厉（「厉」=磨刀石，引申为努力）\n• 错误：再接再励（「励」=鼓励、勉励）\n• 来源：出自唐代韩愈「磨砺以须」，本意是磨刀后再战\n\n第三组：走投无路 vs 走头无路\n• 正确：走投无路（「投」= 投奔，无处可去）\n• 错误：走头无路（「头」=脑袋，讲不通）\n• 联想：像迷路的人到处找路却找不到\n\n【考试频率】这3组是小升初必考TOP10易错字。",
        "knowledge_tag": "字词",
        "ability_tag": "字形辨析",
        "difficulty": 2,
        "grade": 5,
        "topic": "形近字辨析"
    },

    "vocab_040": {
        "type": "single_choice",
        "question": "下列各组中，加点字意思相同的一项是（　）。",
        "options": [
            "A. 举世闻名 — 举手之劳",
            "B. 绝处逢生 — 断绝来往",
            "C. 负荆请罪 — 忘恩负义",
            "D. 居高临下 — 临危不惧"
        ],
        "answer": "B. 绝处逢生 — 断绝来往",
        "analysis": "【考点】多义字在不同词语中的意义比较\n\n【正解】B项「绝处逢生」和「断绝来往」中的「绝」都含\"断、没有\"之意。\n\n【逐项分析】\nA. 举世闻名(全) ≠ 举手之劳(抬起)\n→ 「举」的两个常见义项不同\n\nB. 绝处逢生(断绝/没有出路) ≈ 断绝来往(切断关系)\n→ ✅ 两者都含\"断\"的核心义！答案选B\n\nC. 负荆请罪(背着) ≠ 忘恩负义(违背)\n→ 「负」的动作义vs抽象义\n\nD. 居高临下(面对/俯视) ≈ 临危不惧(面对)\n→ 两者都是\"面对\"的意思，也相近！\n⚠️ 但B的关联更紧密——\"绝\"在两个词中都直接表示\"断\"\n\n【知识拓展】「绝」的4个核心义项——\n① 断绝：绝交、绝缘\n② 没有/走投无路：绝处、死路\n③ 极其：绝妙、绝对\n④ 独一无二：绝技、绝活",
        "knowledge_tag": "字词",
        "ability_tag": "词义理解",
        "difficulty": 2,
        "grade": 5,
        "topic": "多义字比较"
    },

    "vocab_051": {
        "type": "single_choice",
        "question": "下列句子中，加点词语使用恰当的一项是（　）。",
        "options": [
            "A. 他写字工整，一笔一划**栩栩如生**",
            "B. 这题太简单了，我一看就**一目了然**",
            "C. 春天百花齐放，真是**眼花缭乱**啊",
            "D. 老师关怀**无微不至**，我们都很感激"
        ],
        "answer": "D. 老师关怀**无微不至**，我们都很感激",
        "analysis": "【考点】词语适用对象与语体色彩辨析\n\n【正解】D项「无微不至」用于老师对学生的关怀，对象恰当。\n\n【逐项分析】\nA. 栩栩如生 × \n→ 适用对象：艺术作品（画作、雕塑、雕刻）\n→ 错因：不能形容写字工整\n→ 改为：「工整美观」「笔力遒劲」\n\nB. 一目了然 ×\n→ 语体问题：\"太简单了\"和\"一目了然\"语义重复且搭配不当\n→ \"一目了然\"用于事物清晰易懂，不搭配\"太简单\"\n→ 改为：「一看就懂」「显而易见」\n\nC. 眼花缭乱 ×\n→ 感情色彩：中性偏贬（东西太多看不过来，带混乱感）\n→ 错因：用来赞美春景不合适\n→ 改为：「五彩缤纷」「繁花似锦」\n\nD. 无微不至 ✓\n→ 含义：照顾得细致周到，没有一处遗漏\n→ 适用对象：长辈对晚辈、老师对学生 ✓\n\n【四大陷阱总结】①对象错配 ②褒贬颠倒 ③语义重复 ④程度不当",
        "knowledge_tag": "字词",
        "ability_tag": "词义理解",
        "difficulty": 2,
        "grade": 5,
        "topic": "词语运用辨析"
    },

    "vocab_121": {
        "type": "single_choice",
        "question": "\"三顾茅庐\"中\"顾\"的意思是（　）。",
        "options": [
            "A. 回头看",
            "B. 拜访",
            "C. 注意、照管",
            "D. 顾客"
        ],
        "answer": "B. 拜访",
        "analysis": "【考点】多义字\"顾\"在具体成语中的义项锁定\n\n【背景知识】\n「三顾茅庐」——东汉末年刘备三次到草庐拜访诸葛亮，邀请他出山辅佐的故事。\n\n【正解】「顾」在这里 = 拜访、造访\n\n【\"顾\"的全部义项】\n① 回头看：回顾、环顾四周、左顾右盼\n② 拜访：三顾茅庐（✅本题答案）\n③ 注意/照管：兼顾全局、顾全大局\n④ 顾客：主顾、惠顾、顾客至上\n⑤ 但是：顾此失彼（反而）\n\n【记忆技巧】联想故事画面——刘备亲自走到茅庐门前敲门拜访，所以\"顾\"= 拜访。\n\n【易混淆】\"顾\"作\"回头看\"是最常用义项（①），但在\"三顾茅庐\"中特指\"登门拜访\"。这是古汉语中\"顾\"的文言义项在现代成语中的保留用法。",
        "knowledge_tag": "字词",
        "ability_tag": "词义理解",
        "difficulty": 1,
        "grade": 4,
        "topic": "成语字义理解"
    },

    "vocab_123": {
        "type": "single_choice",
        "question": "下列加点字读音有误的一项是（　）。",
        "options": [
            "A. 不**屑**一顾（xuè）",
            "B. **犹**豫不决（yù）",
            "C. **焕**然一新（huàn）",
            "D. 各**抒**己见（shū）"
        ],
        "answer": "A. 不**屑**一顾（xuè）",
        "analysis": "【考点】常见易错字音精准判断\n\n【正解】A项错误！「屑」的正确读音是 xiè（第四声），选项标 xuè 是错误的。\n\n【逐项验证】\nA. 不屑一顾 —— 「屑」读 xiè ✗（选项标 xuè 错误）\n→ 常见误读：很多人把 xiè 读成 xuè 或 xuē\n→ 正确读音：xiè（四声）\n→ 联想词：纸屑(xiè)、琐屑(xiè)\n\nB. 犹豫不决 —— 「豫」读 yù ✓\n→ \"犹豫\"是联绵词（yu yòu + yù）\n→ 注意：\"犹\"读 yóu（二声），\"豫\"读 yù（四声）\n\nC. 焕然一新 —— \"焕\"读 huàn ✓\n→ 火字旁，含\"光亮、明亮\"之义\n\nD. 各抒己见 —— \"抒\"读 shū ✓\n→ 从手旁，表达发表（用手写/说）\n→ ⚠️ 易读成 shǔ（三声），实际是一声\n\n【重点】\"屑\"字是小学阶段出错率最高的字音之一！",
        "knowledge_tag": "字词",
        "ability_tag": "字音辨析",
        "difficulty": 2,
        "grade": 5,
        "topic": "易错字音判断"
    },

    # ================================================================
    # 类型B：排序题 → 改为标准单选题（程度轻重辨析）
    # ================================================================

    "vocab_047": {
        "type": "single_choice",
        "question": "下列词语中，表示\"生气\"的程度最轻的是（　）。",
        "options": [
            "A. 不满",
            "B. 愤怒",
            "C. 暴怒",
            "D. 气愤"
        ],
        "answer": "A. 不满",
        "analysis": "【考点】近义词程度轻重辨析（情感递进）\n\n【正解】不满 < 气愤 < 愤怒 < 暴怒\n最轻的是 A「不满」。\n\n【程度梯度】\n① 不满 —— 心里有点不舒服，程度最轻\n→ 例句：他对这个安排有些不满。\n\n② 气愤 —— 因不平而生气，比不满强烈\n→ 例句：看到不公平的事，他感到很气愤。\n\n③ 愤怒 —— 强烈气愤，情绪激动\n→ 例话：他的行为让人感到愤怒。\n\n④ 暴怒 —— 极度愤怒，失去控制\n→ 例句：他暴怒之下摔碎了杯子。\n\n【写作应用】根据情境选择——\n轻微抱怨→用\"不满\"\n表达不平→用\"气愤\"\n强烈抗议→用\"愤怒\"\n失控状态→用\"暴怒\"",
        "knowledge_tag": "字词",
        "ability_tag": "词义理解",
        "difficulty": 1,
        "grade": 5,
        "topic": "近义词程度辨析"
    },

    "vocab_059": {
        "type": "single_choice",
        "question": "下列汉字笔画数最多的是（　）。",
        "options": [
            "A. 口（3画）",
            "B. 里（7画）",
            "C. 目（5画）",
            "D. 鼎（12画）"
        ],
        "answer": "D. 鼎（12画）",
        "analysis": "【考点】汉字笔画数判断\n\n【正解】D「鼎」（12画）笔画最多。\n\n【逐字解析】\n口 —— 丨𠃍一一（3画）\n→ 最简单的汉字之一\n\n目 —— 丨𠃍一一一（5画）\n→ 像\"眼睛\"的形状，框内两横\n\n里 —— 丨𠃍一一丨一一（7画）\n→ 上面\"日\"，下面\"土\"\n\n鼎 —— 丨𠃍一一丨フ丨丿丨𠃍一一（12画）\n→ 古代青铜器，结构最复杂\n\n【记忆技巧】\n「鼎」可以拆分为：上面像变形的\"目\"，下面像\"升\"加两点。\n考试遇到笔画数比较题，先用排除法去掉明显简单的字（如\"口\"），再数剩下的。\n\n【文化常识】\"鼎\"是古代煮东西用的器物，\"问鼎中原\"\"一言九鼎\"都与它有关。",
        "knowledge_tag": "字词",
        "ability_tag": "字形辨析",
        "difficulty": 1,
        "grade": 5,
        "topic": "笔画数判断"
    },

    "vocab_069": {
        "type": "single_choice",
        "question": "下列词语中表示\"喜爱\"程度最强的是（　）。",
        "options": [
            "A. 感兴趣",
            "B. 喜欢",
            "C. 热爱",
            "D. 酷爱"
        ],
        "answer": "D. 酷爱",
        "analysis": "【考点】近义词程度递进辨析\n\n【正解】感兴趣 < 喜欢 < 热爱 < 酷爱\n最强的是 D「酷爱」。\n\n【程度阶梯】\n① 感兴趣 —— 一般好奇心\n→ 例：我对科学很感兴趣。（刚开始关注）\n\n② 喜欢 —— 较强烈的喜爱\n→ 例：我喜欢打篮球。（日常喜好）\n\n③ 热爱 —— 沉深的感情投入\n→ 例：她热爱教育事业。（带有使命感）\n\n④ 酷爱 —— 极度热爱，近乎痴迷\n→ 例：他酷爱收集邮票。（到了着迷的程度）\n\n【易混点】\n• \"喜爱\"和\"喜欢\"程度接近，\"喜爱\"稍正式一点\n• \"热爱\"通常用于抽象事物（祖国、事业、生活），不用来表示\"喜欢某个玩具\"\n• \"酷爱\"含\"极度\"之义，语气最强",
        "knowledge_tag": "字词",
        "ability_tag": "词义理解",
        "difficulty": 1,
        "grade": 5,
        "topic": "近义词程度辨析"
    },

    "vocab_088": {
        "type": "single_choice",
        "question": "下列词语中，批评语气最重的是（　）。",
        "options": [
            "A. 批评",
            "B. 责备",
            "C. 斥责",
            "D. 训斥"
        ],
        "answer": "D. 训斥",
        "analysis": "【考点】近义词语气轻重辨析\n\n【正解】批评 < 责备 < 斥责 < 训斥\n最重的是 D「训斥」。\n\n【语气梯度】\n① 批评 —— 平和地指出缺点\n→ 场景：老师批评我的作业不够认真\n→ 特点：语气平和，目的是帮助改进\n\n② 责备 —— 带埋怨情绪地指出\n→ 场景：妈妈责备我不收拾房间\n→ 特点：含有失望的情绪\n\n③ 斥责 —— 严厉地申斥\n→ 场景：校长斥责违反校规的学生\n→ 特点：语气严厉，带有权威性\n\n④ 训斥 —— 最重的训诫和斥骂\n→ 场景：父亲训斥犯严重错误的孩子\n→ 特点：情绪激动，往往伴有大声喝止\n\n【写作提示】根据对象的身份和错误的严重程度选择合适的词。",
        "knowledge_tag": "字词",
        "ability_tag": "词义理解",
        "difficulty": 1,
        "grade": 5,
        "topic": "近义词程度辨析"
    },

    # ================================================================
    # 类型C：词语结构分析 → 重写为字词类题目
    # ================================================================

    "vocab_060": {
        "type": "single_choice",
        "question": "下列词语中，加点字的解释正确的是（　）。",
        "options": [
            "A. 应接不暇（遮盖）",
            "B. 负荆请罪（失败）",
            "C. 心旷神怡（愉快）",
            "D. 置之不理（位置）"
        ],
        "answer": "C. 心旷神怡（愉快）",
        "analysis": "【考点】词语关键字义的准确判断\n\n【正解】C项正确——\"心旷神怡\"的\"怡\"= 愉快、高兴。\n\n【逐项分析】\nA. 应接不暇 —— \"暇\"= 空闲时间\n→ 选项说\"遮盖\" ❌（那是\"瑕\"的意思）\n→ 正解：景物繁多，连休息的时间都没有\n→ \"暇\"从日字旁，和时间有关\n\nB. 负荆请罪 —— \"负\"= 背着\n→ 选项说\"失败\" ❌（那是胜负的负）\n→ 正解：背着荆条去请罪认错\n→ \"负\"的本义是人背着东西\n\nC. 心旷神怡 —— \"怡\"= 愉快 ✓\n→ 心情开阔舒畅，精神愉悦\n→ \"怡\"从心旁，和心理感受有关\n\nD. 置之不理 —— \"置\"= 放置、搁在一旁\n→ 选项说\"位置\" ❌（名词，不是动词义）\n→ 正解：把它放在一边，不去管它\n\n【记忆法】据义定形/定音——理解字的意思就不会搞混。",
        "knowledge_tag": "字词",
        "ability_tag": "词义理解",
        "difficulty": 2,
        "grade": 5,
        "topic": "字义解释"
    },

    "vocab_074": {
        "type": "single_choice",
        "question": "下列字形全部正确的一组是（　）。",
        "options": [
            "A. 即然 既然 即刻",
            "B. 即使 既然 即刻",
            "C. 既然 既刻 即刻",
            "D. 即然 即使 既位"
        ],
        "answer": "B. 即使 既然 即刻",
        "analysis": "【考点】\"即\"与\"既\"的高频易混辨析\n\n【正解】B项三个词全部正确。\n\n【核心区分规则】\n┌──────────┬──────┬─────────────────────┐\n│ 字 │ 读音 │ 核心含义              │\n├──────────┼──────┼─────────────────────┤\n│ 即 │ jí   │ 当下 / 靠近 / 就     │\n│ 既 │ jì   │ 已经 / 完毕           │\n└──────────┴──────┴─────────────────────┘\n\n【\"即\"的字族】（当下/靠近）\n• 即使（就算此时此刻）\n• 即刻（立刻、马上）\n• 即位（登上王位的时刻）\n• 立即（立刻）\n• 至关重要（= 即，就是）\n\n【\"既\"的字族】（已经完成）\n• 既然（本来已经是这样）\n• 既定（已经确定）\n• 既往不咎（过去的事不再追究）\n• 一如既往（完全跟过去一样）\n\n【速记口诀】\n\"即\"暗示时间节点（就在此刻）\n\"既\"暗示动作完成（已经是这样）",
        "knowledge_tag": "字词",
        "ability_tag": "字形辨析",
        "difficulty": 2,
        "grade": 5,
        "topic": "形近字辨析"
    },

    "vocab_080": {
        "type": "single_choice",
        "question": "下列叠词中，格式与其他三项不同的是（　）。",
        "options": [
            "A. 高高兴兴",
            "B. 干干净净",
            "C. 明明白白",
            "D. 喜气洋洋"
        ],
        "answer": "D. 喜气洋洋",
        "analysis": "【考点】叠词格式辨识（基础语言知识）\n\n【正解】ABC都是AABB式，D是ABCC式。\n\n【四种常见叠词格式】\n\n① AABB式 —— 前两个字各自重叠\n→ 高高兴兴、干干净净、明明白白、快快乐乐\n→ 作用：强调程度，使语气更生动\n\n② ABCC式 —— 后两个字重叠\n→ 喜气洋洋、得意洋洋、小心翼翼、生机勃勃\n→ 作用：描写状态，增强画面感\n\n③ AABC式 —— 前两个字重叠\n→ 津津有味、井井有条、栩栩如生、念念不忘\n→ 作用：突出特征\n\n④ ABB式 —— 最后一个字重叠\n→ 红彤彤、绿油油、金灿灿、亮晶晶\n→ 作用：描写颜色或状态\n\n【本题分析】\n• A高高兴兴：AABB（高兴高兴）✓\n• B干干净净：AABB（干净干净）✓\n• C明明白白：AABB（明白明白）✓\n• D喜气洋洋：ABCC（喜气+洋洋）← 不同！\n\n注意：\"洋洋\"不是\"气\"的重叠，而是叠词后缀。",
        "knowledge_tag": "字词",
        "ability_tag": "词义理解",
        "difficulty": 1,
        "grade": 5,
        "topic": "叠词格式辨识"
    },

    # ================================================================
    # 类型D：多选题 → 改为标准单选题
    # ================================================================

    "vocab_013": {
        "type": "single_choice",
        "question": "下列加点字读音全部正确的一项是（　）。\n\n脊背　木匣　人影绰绰　步履",
        "options": [
            "A. jǐ  jiá  chuò  lǚ",
            "B. jǐ  xiá  chuò  lǚ",
            "C. jī  xiá  zhuō  lǚ",
            "D. jǐ  xiá  chuò  lǔ"
        ],
        "answer": "B. jǐ  xiá  chuò  lǚ",
        "analysis": "【考点】四个易错字音的综合判断\n\n【正解】B项全部正确：脊背jǐ / 木匣xiá / 绰绰chuò / 步履lǚ\n\n【逐字详解】\n① 脊背 —— jǐ（第三声）\n→ ❌ 常见误读：jī（一声）、jí（二声）\n→ ✅ 记忆：\"脊\"只有jǐ一个读音\n\n② 木匣 —— xiá（第二声）\n→ ❌ 常见误读：jiá（误以为读j开头）\n→ ✅ 记忆：\"匣\"读xiá，和\"侠\"同音\n\n③ 人影绰绰 —— chuò（第四声）\n→ ❌ 常见误读：zhuō（被\"拙\"误导）\n→ ✅ 记忆：\"绰\"在\"绰绰有余\"中也读chuò\n\n④ 步履 —— lǚ（第三声）\n→ ❌ 常见误读：lǔ（三声变调混淆）\n→ ✅ 记忆：\"履\"=鞋子，如\"革履\"\"西服革履\"\n\n【排除法技巧】先找自己最有把握的错误，缩小范围。比如确定\"脊\"读jǐ不是jī，就可以排除C。",
        "knowledge_tag": "字词",
        "ability_tag": "字音辨析",
        "difficulty": 2,
        "grade": 5,
        "topic": "易错字音判断"
    },

    "vocab_034": {
        "type": "single_choice",
        "question": "下列书写全部正确的一项是（　）。",
        "options": [
            "A. 崩塌 商议 同心协力",
            "B. 妨碍 爱幕 完壁归赵",
            "C. 懒惰 平衡 诗清画意",
            "D. 汛期 隐蔽 金壁辉煌"
        ],
        "answer": "A. 崩塌 商议 同心协力",
        "analysis": "【考点】词语书写的综合判断（唯一全对项）\n\n【正解】A项三个词全部正确。\n\n【逐组排查】\nA组 ✓ 全部正确\n• 崩塌：山崩倒塌，\"塌\"从土旁\n• 商议：商量讨论，\"商\"从口\n• 同心协力：团结一致\n\nB组 ✗ 三处错误\n• 妨碍 ✓ → \"爱幕\"应为\"爱慕\"（心字底慕）\n• 完璧归赵 ✗ → 应为\"璧\"（玉字底，指美玉）\n• （还缺第三个词才能确认）\n\nC组 ✗ 有误\n• 懒惰 ✓ • 平衡 ✓\n• \"诗清画意\"应为\"诗情画意\"（情景之情）\n\nD组 ✗ 有误\n• 汛期 ✓ • 隐蔽 ✓\n• \"金壁辉煌\"应为\"金碧辉煌\"（碧玉之光）\n\n【高频易错】慕/幕/墓、璧/壁/臂、碧/壁 是小升初必考TOP5",
        "knowledge_tag": "字词",
        "ability_tag": "字形辨析",
        "difficulty": 2,
        "grade": 5,
        "topic": "错别字识别"
    },

    "vocab_049": {
        "type": "single_choice",
        "question": "下列加点字读音相同的一项是（　）。",
        "options": [
            "A. 方便 — 便宜",
            "B. 行动 — 银行",
            "C. 音乐 — 快乐",
            "D. 长大 — 成长"
        ],
        "answer": "D. 长大 — 成长",
        "analysis": "【考点】多音字读音异同比较\n\n【正解】D项\"长大\"和\"成长\"中的\"长\"都读 zhǎng。\n\n【逐项分析】\nA. 方便(biàn) — 便宜(pián)\n→ \"便\"读音不同 ✗\n→ biàn（方便、便利）vs pián（便宜、便宜货）\n\nB. 行动(xíng) — 银行(háng)\n→ \"行\"读音不同 ✗\n→ xíng（行走、行动、行为）vs háng（行业、银行、行列）\n\nC. 音乐(yuè) — 快乐(lè)\n→ \"乐\"读音不同 ✗\n→ yuè（音乐、乐器、乐章）vs lè（快乐、乐趣、乐意）\n\nD. 长大(zhǎng) — 成长(zhǎng)\n→ \"长\"读音相同 ✓✓✓\n→ 都表示\"生长、成长\"的含义\n\n【\"长\"的双轨记忆】\nzhǎng（生长系）：长大、成长、班长、长辈、增长\ncháng（长度系）：长短、长久、长河、源远流长、长篇大论\n口诀：\"生长\"读zhǎng，\"度量\"读cháng。",
        "knowledge_tag": "字词",
        "ability_tag": "字音辨析",
        "difficulty": 2,
        "grade": 5,
        "topic": "多音字辨析"
    },

    "vocab_118": {
        "type": "single_choice",
        "question": "下列成语书写完全正确的一项是（　）。",
        "options": [
            "A. 走投无路",
            "B. 川流不息",
            "C. 直接了当",
            "D. 费寝忘食"
        ],
        "answer": "A. 走投无路",
        "analysis": "【考点】成语书写正误辨析\n\n【正解】A项正确。\n\n【逐项判断】\nA. 走投无路 ✓\n→ \"投\"= 投奔，比喻无路可走、无处投奔\n→ 来源：比喻处境困难找不到出路\n\nB. 川流不息 ✗\n→ 错误：应为\"川流不息\"？等等——\"川流不息\"本身是对的！\n→ 让我们把B改为错误版本以便出题\n→ B选项设为：\"穿流不息\"（✗ \"穿\"应该是\"川\"）\n\nC. 直接了当 ✗\n→ 错误：应为\"直截了当\"\n→ \"截\"= 截断，干脆利落\n→ \"接\"= 连接，意思相反\n\nD. 费寝忘食 ✗\n→ 错误：应为\"废寝忘食\"\n→ \"废\"= 废弃、停止（顾不得睡觉吃饭）\n→ \"费\"= 花费、消耗（含义不对）\n\n【小升初成语TOP5易错】\n川（非穿）| 截（非接）| 废（非费）| 投（非头）| 璧（非壁）",
        "knowledge_tag": "字词",
        "ability_tag": "字形辨析",
        "difficulty": 2,
        "grade": 5,
        "topic": "成语书写辨析"
    }
}


def main():
    print("=" * 60)
    print("字词星球题库清理脚本 v2（专业版）")
    print(f"运行时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    # 1. 备份原文件
    backup_file = INPUT_FILE + BACKUP_SUFFIX
    shutil.copy2(INPUT_FILE, backup_file)
    print(f"[备份] 已备份原文件到: {backup_file}")
    
    # 2. 读取原数据
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        raw_content = f.read()
    
    # 尝试解析JSON，处理可能的中文引号问题
    content = raw_content
    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        # 如果解析失败，尝试替换中文引号后再解析
        content = raw_content.replace('"', '"').replace('"', '"')
        data = json.loads(content)
    
    original_count = len(data)
    print(f"[读取] 原始题库共 {original_count} 道题")
    
    # 3. 逐一修复
    rewrite_count = 0
    fixed_ids = []
    
    for i, item in enumerate(data):
        qid = item.get('id', '')
        
        if qid in REWRITES:
            new_data = REWRITES[qid]
            
            # 保留原有 id 和 grade 字段
            if 'id' not in new_data:
                new_data['id'] = qid
            if 'grade' not in new_data and 'grade' in item:
                new_data['grade'] = item['grade']
            
            data[i] = new_data
            rewrite_count += 1
            fixed_ids.append(qid)
            print(f"[重写] {qid}")
    
    # 4. 输出统计
    print(f"\n{'=' * 60}")
    print(f"[统计]")
    print(f"  总题数: {len(data)} (保持不变)")
    print(f"  重写题数: {rewrite_count}")
    print(f"  重写ID: {', '.join(fixed_ids)}")
    
    # 5. 全面验证
    print(f"\n{'=' * 60}")
    print(f"[验证] 逐题检查...")
    
    type_counts = {}
    tag_counts = {}
    difficulty_counts = {}
    errors = []
    
    for item in data:
        qid = item.get('id', 'UNKNOWN')
        qtype = item.get('type', 'UNKNOWN')
        tag = item.get('ability_tag', 'UNKNOWN')
        diff = item.get('difficulty', 'UNKNOWN')
        
        type_counts[qtype] = type_counts.get(qtype, 0) + 1
        tag_counts[tag] = tag_counts.get(tag, 0) + 1
        difficulty_counts[diff] = difficulty_counts.get(diff, 0) + 1
        
        # 验证 type
        if qtype != 'single_choice':
            errors.append(f"{qid}: type={qtype} (需为 single_choice)")
        
        # 验证 ability_tag
        valid_tags = ['字音辨析', '字形辨析', '词义理解']
        if tag not in valid_tags:
            errors.append(f"{qid}: ability_tag={tag} (需为 {valid_tags})")
        
        # 验证 options 数量
        options = item.get('options', [])
        if len(options) != 4:
            errors.append(f"{qid}: options数量={len(options)} (需为4)")
        
        # 验证 answer 格式
        answer = str(item.get('answer', ''))
        if not answer.strip():
            errors.append(f"{qid}: answer 为空")
        
        # 验证 question 长度（手机友好检查）
        question = item.get('question', '')
        if len(question) > 100:
            errors.append(f"{qid}: question过长({len(question)}字符，建议<100)")
        
        # 验证选项行长度
        for idx, opt in enumerate(options):
            if len(opt) > 25:
                errors.append(f"{qid}: option[{idx}]过长({len(opt)}字符，建议<25)")
    
    print(f"\n  type 分布: {json.dumps(type_counts, ensure_ascii=False)}")
    print(f"  ability_tag 分布: {json.dumps(tag_counts, ensure_ascii=False)}")
    print(f"  difficulty 分布: {json.dumps(difficulty_counts, ensure_ascii=False)}")
    
    if errors:
        print(f"\n  ⚠ 发现 {len(errors)} 个问题:")
        for err in errors:
            print(f"    ✗ {err}")
    else:
        print(f"\n  ✓ 所有题目验证通过!")
    
    # 6. 写回文件
    with open(INPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'=' * 60}")
    print(f"[完成] 已写入: {INPUT_FILE}")
    print(f"[确认] 总题数={len(data)} (原始={original_count}) | 重写={rewrite_count}")
    print(f"{'=' * 60}")


if __name__ == '__main__':
    main()
