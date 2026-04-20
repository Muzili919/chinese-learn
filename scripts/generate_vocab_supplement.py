#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
字词题库补充生成脚本 - 为字词星球生成高质量新题目（v2 修正版）
重点补充：词义理解类 + 字形辨析 + 字音多音字
标准：手机友好(题目≤50字/选项≤15字) / 干扰项专业级 / 答案均匀分布
"""

import json
import os

NEW_QUESTIONS = [
    # ========== 词义-近义词辨析（8题）==========
    {
        "id": "vocab_126",
        "type": "single_choice",
        "question": "他做事一向（　　），从不马虎。老师对他的表现十分（　　）。",
        "options": [
            "A. 仔细／细致",
            "B. 严谨／严密",
            "C. 认真／仔细",
            "D. 细心／详细"
        ],
        "answer": "C. 认真／仔细",
        "analysis": "「认真」指态度端正不敷衍，形容做事恰当；「仔细」指细心不粗心，与不马虎形成呼应。「细致」偏重精细周到；「严谨」偏重严肃谨慎；「详细」偏重内容详尽。第一空强调态度端正用「认真」，第二空强调细心检查用「仔细」最合适。",
        "knowledge_tag": "字词",
        "ability_tag": "词义理解",
        "difficulty": 2,
        "grade": 6,
        "topic": "词义-近义词辨析"
    },
    {
        "id": "vocab_127",
        "type": "single_choice",
        "question": "「宁静」和「安静」意思相近但用法不同。下列使用正确的一项是（　）。",
        "options": [
            "A. 湖面十分宁静，连一丝波纹都没有",
            "B. 教室里很安静，同学们都在专心看书",
            "C. 他性格安静，不爱说话",
            "D. 夜深了，乡村变得安静下来"
        ],
        "answer": "B. 教室里很安静，同学们都在专心看书",
        "analysis": "「安静」指没有声音、不吵闹；「宁静」侧重平和安宁的氛围。A湖面无波应用「平静」；C性格不用「安静」应用「文静」或「内向」；D夜晚乡村用「宁静」更有文学色彩。B教室没有声音，用「安静」最标准。",
        "knowledge_tag": "字词",
        "ability_tag": "词义理解",
        "difficulty": 2,
        "grade": 5,
        "topic": "词义-近义词辨析"
    },
    {
        "id": "vocab_128",
        "type": "single_choice",
        "question": "「既然」和「即使」易混。下列使用正确的一项是（　）。",
        "options": [
            "A. 既然下雨了，我们就不去了吧",
            "B. 即使下雨了，我们还是去吧",
            "C. 既然你不来，我也要去",
            "D. 即使你已经知道了，我就不说了"
        ],
        "answer": "A. 既然下雨了，我们就不去了吧",
        "analysis": "「既然」表示先提出前提后推出结论（因果），常和「就」搭配；「即使」表示让步假设（就算…也），常和「也」搭配。A已知下雨→不去，因果关系正确。B应改为「即使…也」；C前半句是既成事实不该用「即使」；D「已经知道」是事实该用「既然」。",
        "knowledge_tag": "字词",
        "ability_tag": "词义理解",
        "difficulty": 2,
        "grade": 6,
        "topic": "词义-近义词辨析"
    },
    {
        "id": "vocab_129",
        "type": "single_choice",
        "question": "选择恰当词语填空：这种花（　　）地散发着清香。",
        "options": [
            "A. 隐隐约约",
            "B. 若隐若现",
            "C. 断断续续",
            "D. 时有时无"
        ],
        "answer": "A. 隐隐约约",
        "analysis": "「隐隐约约」形容不明显，用于气味/声音/光线都合适。「若隐若现」只能用于视觉；「断断续续」「时有时无」侧重时断时续的状态。花香用「隐隐约约」最能体现淡淡的若有若无的感觉。",
        "knowledge_tag": "字词",
        "ability_tag": "词义理解",
        "difficulty": 2,
        "grade": 5,
        "topic": "词义-近义词辨析"
    },
    {
        "id": "vocab_130",
        "type": "single_choice",
        "question": "「推重」（重视尊重某人）和「推崇」（敬仰）。下列正确的是（　）。",
        "options": [
            "A. 这位老教授深受学生的推重",
            "B. 大家都推崇他的为人正直",
            "C. 他的作品被推重为经典之作",
            "D. 我们要推崇科学精神"
        ],
        "answer": "A. 这位老教授深受学生的推重",
        "analysis": "「推重」对象通常是人；「推崇」可以是人也可以是精神事物。A学生尊重老师，用「推重」最准确。B「推崇为人正直」应为「敬佩」更自然；C「推重作品」应为「推崇」；D虽然也正确但不如A典型。本题考查「推重」专用于人这一细微区别。",
        "knowledge_tag": "字词",
        "ability_tag": "词义理解",
        "difficulty": 3,
        "grade": 6,
        "topic": "词义-近义词辨析"
    },
    {
        "id": "vocab_131",
        "type": "single_choice",
        "question": "下列句子中，括号内应填入「激烈」的一项是（　）。",
        "options": [
            "A. 两队之间的比赛非常（激烈）",
            "B. 他的内心斗争十分（剧烈）",
            "C. 这场辩论非常（猛烈）",
            "D. 病情发作得很（强烈）"
        ],
        "answer": "A. 两队之间的比赛非常（激烈）",
        "analysis": "「激烈」用于竞争对抗场景（比赛、辩论）；「剧烈」程度更深（疼痛、震动）；「猛烈」气势大力量大；「强烈」程度高（愿望、反应）。比赛用「激烈」是最标准的搭配。",
        "knowledge_tag": "字词",
        "ability_tag": "词义理解",
        "difficulty": 2,
        "grade": 5,
        "topic": "词义-近义词辨析"
    },
    {
        "id": "vocab_132",
        "type": "single_choice",
        "question": "关于「美丽」和「漂亮」，下列说法错误的是（　）。",
        "options": [
            "A. 「美丽」比「漂亮」更正式",
            "B. 「漂亮」可以形容人也可形容物品",
            "C. 「美丽」不能用来形容景色",
            "D. 「美丽」常与心灵、风景等搭配"
        ],
        "answer": "C. 「美丽」不能用来形容景色",
        "analysis": "此题选错误说法。「美丽」完全可以而且常用于形容景色！C说「不能」明显错误。A正确——「美丽」确实比「漂亮」正式；B正确——「漂亮」适用范围广；D正确——「美丽的心灵」「美丽的梦想」都很常见。答案为C。",
        "knowledge_tag": "字词",
        "ability_tag": "词义理解",
        "difficulty": 1,
        "grade": 4,
        "topic": "词义-近义词辨析"
    },
    {
        "id": "vocab_133",
        "type": "single_choice",
        "question": "鲁迅先生的文章语言（　　），含义深刻值得反复阅读。",
        "options": [
            "A. 简洁",
            "B. 简陋",
            "C. 简单",
            "D. 简略"
        ],
        "answer": "A. 简洁",
        "analysis": "四词都有「简」，含义不同：「简洁」（干净利落不啰嗦）含褒义，适合形容文章语言；「简陋」（设施不完备）含贬义；「简单」（结构单纯）中性但鲁迅文章并不简单；「简略」（内容不详细）有省略之意。形容文章语言精炼深刻，「简洁」最佳。",
        "knowledge_tag": "字词",
        "ability_tag": "词义理解",
        "difficulty": 2,
        "grade": 6,
        "topic": "词义-近义词辨析"
    },

    # ========== 词义-反义词辨析（5题）==========
    {
        "id": "vocab_134",
        "type": "single_choice",
        "question": "「宽阔」的反义词是（　）。",
        "options": [
            "A. 宽广",
            "B. 狭窄",
            "C. 辽阔",
            "D. 广阔"
        ],
        "answer": "B. 狭窄",
        "analysis": "「宽阔」指面积大范围广，反义词是「狭窄」（宽度小范围小）。A「宽广」C「辽阔」D「广阔」都是近义词。做题时要看清题目要求的是反义词还是近义词。",
        "knowledge_tag": "字词",
        "ability_tag": "词义理解",
        "difficulty": 1,
        "grade": 4,
        "topic": "词义-反义词辨析"
    },
    {
        "id": "vocab_135",
        "type": "single_choice",
        "question": "下列各组中互为反义词的一组是（　）。",
        "options": [
            "A. 坚强—坚强",
            "B. 谦虚—骄傲",
            "C. 快乐—欢乐",
            "D. 认真—仔细"
        ],
        "answer": "B. 谦虚—骄傲",
        "analysis": "A相同词语；B「谦虚」（虚心不自满）与「骄傲」（自以为了不起）互为反义词；C近义词（都表示高兴）；D近义词（都表示用心）。常见反义词对：谦虚/骄傲、勇敢/懦弱、诚实/虚伪、善良/邪恶。",
        "knowledge_tag": "字词",
        "ability_tag": "词义理解",
        "difficulty": 1,
        "grade": 3,
        "topic": "词义-反义词辨析"
    },
    {
        "id": "vocab_136",
        "type": "single_choice",
        "question": "「冷漠」的反义词最恰当的是（　）。",
        "options": [
            "A. 冷淡",
            "B. 热情",
            "C. 冷静",
            "D. 冷酷"
        ],
        "answer": "B. 热情",
        "analysis": "「冷漠」指冷淡不关心，反义词是「热情」（热心充满激情）。A「冷淡」D「冷酷」都是近义词；C「冷静」指沉着不冲动，与「冷漠」无关。注意：「冷静」（头脑清醒）≠「冷漠」（漠不关心），两者都有「冷」字但意思完全不同。",
        "knowledge_tag": "字词",
        "ability_tag": "词义理解",
        "difficulty": 1,
        "grade": 4,
        "topic": "词义-反义词辨析"
    },
    {
        "id": "vocab_137",
        "type": "single_choice",
        "question": "与「粗糙」构成反义关系的词是（　）。",
        "options": [
            "A. 粗壮",
            "B. 光滑",
            "C. 粗心",
            "D. 细腻"
        ],
        "answer": "D. 细腻",
        "analysis": "「粗糙」指质料不精细不光滑，反义词是「细腻」（细密光滑精细）。A「粗壮」指粗大强壮，与「瘦弱」相对；B「光滑」虽有一定反义关系但不完全精确——只强调平；C「粗心」指马虎。D是最精准的反义词。",
        "knowledge_tag": "字词",
        "ability_tag": "词义理解",
        "difficulty": 2,
        "grade": 5,
        "topic": "词义-反义词辨析"
    },
    {
        "id": "vocab_138",
        "type": "single_choice",
        "question": "下列成语中与其他三项意思相反的一项是（　）。",
        "options": [
            "A. 视死如归",
            "B. 大义凛然",
            "C. 奋不顾身",
            "D. 苟且偷生"
        ],
        "answer": "D. 苟且偷生",
        "analysis": "ABC都是褒义，描写英勇无畏的精神（不怕牺牲、坚持正义、奋勇向前）。D「苟且偷生」（得过且过勉强活着）含贬义，描写贪生怕死。D与其他三项意思相反。本题同时考查词义理解和感情色彩两个维度。",
        "knowledge_tag": "字词",
        "ability_tag": "词义理解",
        "difficulty": 2,
        "grade": 6,
        "topic": "词义-反义词辨析"
    },

    # ========== 词义-一词多义（6题）==========
    {
        "id": "vocab_139",
        "type": "single_choice",
        "question": "「这本书的内容很深。」中的「深」意思是（　）。",
        "options": [
            "A. 从表面到底的距离大",
            "B. 深度大",
            "C. 深奥难懂",
            "D. 感情深厚"
        ],
        "answer": "C. 深奥难懂",
        "analysis": "形容书的内容「深」指的是内容不容易理解道理深奥，选C。①②用于物理空间（深井深水）；④用于人际关系（深情深交）；⑤用于颜色（深红）；⑥用于时间（深夜）。同一个「深」字在不同语境中有多种义项，这就是一词多义现象。",
        "knowledge_tag": "字词",
        "ability_tag": "词义理解",
        "difficulty": 2,
        "grade": 5,
        "topic": "词义-一词多义"
    },
    {
        "id": "vocab_140",
        "type": "single_choice",
        "question": "下列「熟」字意思相同的一项是（　）。",
        "options": [
            "A. 米饭煮熟了／他很熟悉这条路",
            "B. 果树熟了／课文背得很熟",
            "C. 我和他很熟／瓜熟透了",
            "D. 技术很熟练／稻子成熟了"
        ],
        "answer": "B. 果树熟了／课文背得很熟",
        "analysis": "分析各选项中「熟」的含义：A①食物加热到可食用 vs ②了解清楚（不同）；B①果实长成 vs ②背诵流利（都含达到完善程度之义，最为接近）；C①人际关系亲密 vs ②果实长成（不同）；D①工作精通 vs ②谷物长成（不同）。B项相对最接近，都表达达到了某种完善程度。",
        "knowledge_tag": "字词",
        "ability_tag": "词义理解",
        "difficulty": 3,
        "grade": 6,
        "topic": "词义-一词多义"
    },
    {
        "id": "vocab_141",
        "type": "single_choice",
        "question": "「包袱」意思是「思想负担」的一项是（　）。",
        "options": [
            "A. 旅行时不要带太多包袱太沉了",
            "B. 你别有包袱大胆地去尝试吧",
            "C. 奶奶用包袱皮把苹果包起来",
            "D. 这个包袱太大了我提不动"
        ],
        "answer": "B. 你别有包袱大胆地去尝试吧",
        "analysis": "「包袱」本义是用布包成的包裹（ACD都是这个意思）。引申义指思想上的负担或顾虑（B项）。「放下包袱」是常用比喻，意为丢掉思想负担轻装上阵。一词多义的引申义往往是考查重点。",
        "knowledge_tag": "字词",
        "ability_tag": "词义理解",
        "difficulty": 2,
        "grade": 5,
        "topic": "词义-一词多义"
    },
    {
        "id": "vocab_142",
        "type": "single_choice",
        "question": "「通道」中的「道」意思是（　）。",
        "options": [
            "A. 道路",
            "B. 说话",
            "C. 方法",
            "D. 方向"
        ],
        "answer": "A. 道路",
        "analysis": "「通道」指通行的道路，「道」在这里是「路」的意思。「道」的其他常见义项：说（道谢道歉）、方法（门道）、方向（河道国道）、道德（道义）、线条（画一道线）。一个简单的「道」字就有十几种常用义项，需结合具体词语判断。",
        "knowledge_tag": "字词",
        "ability_tag": "词义理解",
        "difficulty": 1,
        "grade": 4,
        "topic": "词义-一词多义"
    },
    {
        "id": "vocab_143",
        "type": "single_choice",
        "question": "下列「光」的意思与其他三项不同的是（　）。",
        "options": [
            "A. 太阳光很强",
            "B. 月光洒在地上",
            "C. 头发梳得光光的",
            "D. 电灯发出的光很刺眼"
        ],
        "answer": "C. 头发梳得光光的",
        "analysis": "ABD中的「光」都指光源发出的光线（名词）；C中的「光」是光滑洁净的意思（形容词）。四个句子只有一个用的是形容词义其他三个用的都是名词义。做一词多义题的关键是逐个判断加点词的词性和含义。",
        "knowledge_tag": "字词",
        "ability_tag": "词义理解",
        "difficulty": 2,
        "grade": 5,
        "topic": "词义-一词多义"
    },
    {
        "id": "vocab_144",
        "type": "single_choice",
        "question": "「不管…都…」和「尽管…还…」的区别在于（　）。",
        "options": [
            "A. 没有区别可互换",
            "B. 前者表条件后者表转折",
            "C. 前者表因果后者表并列",
            "D. 前者用于疑问句后者用于陈述句"
        ],
        "answer": "B. 前者表条件后者表转折",
        "analysis": "「不管…都…」是无条件条件复句（无论什么条件结果都不变）；「尽管…还…」是转折复句（先承认事实再转到相反方向）。前者逻辑：任何条件→同一结果；后者：虽有A但仍然B。",
        "knowledge_tag": "字词",
        "ability_tag": "词义理解",
        "difficulty": 3,
        "grade": 6,
        "topic": "词义-一词多义"
    },

    # ========== 词义-感情色彩（5题）==========
    {
        "id": "vocab_145",
        "type": "single_choice",
        "question": "下列属于贬义词的是（　）。",
        "options": [
            "A. 呕心沥血",
            "B. 孜孜不倦",
            "C. 锲而不舍",
            "D. 趋炎附势"
        ],
        "answer": "D. 趋炎附势",
        "analysis": "A「呕心沥血」费尽心血（褒义）；B「孜孜不倦」勤奋努力不知疲倦（褒义）；C「锲而不舍」坚持不懈（褒义）；D「趋炎附势」奉承依附有权势的人（贬义）。只有D是贬义词。记忆技巧：看是否包含巴结奉承投机等负面含义。",
        "knowledge_tag": "字词",
        "ability_tag": "词义理解",
        "difficulty": 1,
        "grade": 4,
        "topic": "词义-感情色彩"
    },
    {
        "id": "vocab_146",
        "type": "single_choice",
        "question": "加点词语感情色彩使用不当的一项是（　）。",
        "options": [
            "A. 科学家一生呕心沥血取得重大成果",
            "B. 小明学习很狡猾总能找到答题技巧",
            "C. 老师谆谆教导让我们受益匪浅",
            "D. 抗日英雄视死如归令人敬佩"
        ],
        "answer": "B. 小明学习很狡猾总能找到答题技巧",
        "analysis": "「狡猾」是贬义词（诡计多端耍小聪明），不能用在正面描述上。应改用「聪明」「机灵」或「善于动脑」。A「呕心沥血」（褒义）正确；C「谆谆教导」（褒义）正确；D「视死如归」（褒义）正确。使用词语要注意感情色彩与语境匹配。",
        "knowledge_tag": "字词",
        "ability_tag": "词义理解",
        "difficulty": 2,
        "grade": 5,
        "topic": "词义-感情色彩"
    },
    {
        "id": "vocab_147",
        "type": "single_choice",
        "question": "感情色彩完全相同的一组是（　）。",
        "options": [
            "A. 骄傲 自豪 乐观",
            "B. 顽强 固执 顽固",
            "C. 保护 庇护 维护",
            "D. 果断 武断 独断"
        ],
        "answer": "A. 骄傲 自豪 乐观",
        "analysis": "A组全部褒义（此处「骄傲」取自豪之义）；B混合——「顽强」褒义，「固执」「顽固」贬义；C混合——「保护」褒义/中性，「庇护」贬义（包庇）；D混合——「果断」褒义，「武断」「独断」贬义。只有A组全为褒义。",
        "knowledge_tag": "字词",
        "ability_tag": "词义理解",
        "difficulty": 2,
        "grade": 5,
        "topic": "词义-感情色彩"
    },
    {
        "id": "vocab_148",
        "type": "single_choice",
        "question": "「标新立异」的感情色彩是（　）。",
        "options": [
            "A. 只能作褒义",
            "B. 只能作贬义",
            "C. 根据语境可褒可贬",
            "D. 只能作中性"
        ],
        "answer": "C. 根据语境可褒可贬",
        "analysis": "褒义语境表示创新精神（他在艺术上标新立异独树一帜）；贬义语境表示故意显示与众不同哗众取宠（他总喜欢标新立异吸引眼球）。很多词语的感情色彩取决于上下文，即「语境决定褒贬」。类似的还有「骄傲」「固执」「折腾」等。",
        "knowledge_tag": "字词",
        "ability_tag": "词义理解",
        "difficulty": 3,
        "grade": 6,
        "topic": "词义-感情色彩"
    },
    {
        "id": "vocab_149",
        "type": "single_choice",
        "question": "与其他三项感情色彩不同的是（　）。",
        "options": [
            "A. 见义勇为",
            "B. 舍己救人",
            "C. 大公无私",
            "D. 明哲保身"
        ],
        "answer": "D. 明哲保身",
        "analysis": "ABC都是褒义（见义勇为、舍己救人、大公无私）；D「明哲保身」原指明智的人不参与危险之事现多含贬义指怕惹是非回避矛盾。D是唯一贬义词。做感情色彩题先判断每项褒贬属性再找出不同的那个。",
        "knowledge_tag": "字词",
        "ability_tag": "词义理解",
        "difficulty": 2,
        "grade": 5,
        "topic": "词义-感情色彩"
    },

    # ========== 词义-语境运用（7题）==========
    {
        "id": "vocab_150",
        "type": "single_choice",
        "question": "加点词语使用恰当的一项是（　）。",
        "options": [
            "A. 这次春游大家玩得津津乐道",
            "B. 老师的话让他恍然大悟豁然开朗",
            "C. 他做事斤斤计较大家都很佩服他",
            "D. 这部电影让人忍俊不禁"
        ],
        "answer": "B. 老师的话让他恍然大悟豁然开朗",
        "analysis": "A「津津乐道」本身已包含说的意思不能再接动作，语义重复/搭配不当；B正确——「恍然大悟」形容突然明白过来；C「斤斤计较」是贬义词（过分计较个人得失），与佩服矛盾；D「忍俊不禁」指忍不住笑用于情节曲折不合适。",
        "knowledge_tag": "字词",
        "ability_tag": "词义理解",
        "difficulty": 2,
        "grade": 5,
        "topic": "词义-语境运用"
    },
    {
        "id": "vocab_151",
        "type": "single_choice",
        "question": "加点词语使用不恰当的一项是（　）。",
        "options": [
            "A. 故宫宏伟壮观令人叹为观止",
            "B. 他刻苦成绩一直名列前茅",
            "C. 老师的关怀无所不至",
            "D. 菜好吃极了让人狼吞虎咽"
        ],
        "answer": "C. 老师的关怀无所不至",
        "analysis": "「无所不至」指什么坏事都做尽了（贬义），这里想表达的应该是「无微不至」（关怀照顾细致周到褒义）。两者一字之差感情截然相反！这是初中考试高频陷阱。A「叹为观止」正确；B「名列前茅」正确；D「狼吞虎咽」可用。",
        "knowledge_tag": "字词",
        "ability_tag": "词义理解",
        "difficulty": 2,
        "grade": 5,
        "topic": "词义-语境运用"
    },
    {
        "id": "vocab_152",
        "type": "single_choice",
        "question": "成语使用正确的一项是（　）。",
        "options": [
            "A. 他做事随波逐流很有主见",
            "B. 文章写得错落有致层次分明",
            "C. 同学们对活动漠不关心没人报名",
            "D. 教诲让我刻骨铭心终生难忘"
        ],
        "answer": "D. 教诲让我刻骨铭心终生难忘",
        "analysis": "A「随波逐流」比喻没有主见跟着别人走，与很有主见矛盾；B「错落有致」多用于建筑园林装饰，用于文章不合适；C「漠不关心」是不及物动词不能带宾语；D「刻骨铭心」形容感受深切难忘用于教诲恰当且正确。",
        "knowledge_tag": "字词",
        "ability_tag": "词义理解",
        "difficulty": 2,
        "grade": 6,
        "topic": "词义-语境运用"
    },
    {
        "id": "vocab_153",
        "type": "single_choice",
        "question": "面对困难我们应（　　）向上而不是（　　）退缩。",
        "options": [
            "A. 奋发／畏缩",
            "B. 发奋／畏惧",
            "C. 振奋／害怕",
            "D. 兴奋／恐惧"
        ],
        "answer": "A. 奋发／畏缩",
        "analysis": "「奋发」指精神振作努力向上，与向上完美搭配；「畏缩」指因害怕不敢向前，与退缩形成对应。B「发奋」侧重下定决心学习工作；C「振奋」是瞬间状态；D「兴奋」是情绪激动。A不仅词义最准而且形成了工整的正反对比。",
        "knowledge_tag": "字词",
        "ability_tag": "词义理解",
        "difficulty": 2,
        "grade": 5,
        "topic": "词义-语境运用"
    },
    {
        "id": "vocab_154",
        "type": "single_choice",
        "question": "《背影》中父亲「蹒跚」地走到铁道边买橘子。「蹒跚」意指（　）。",
        "options": [
            "A. 迅速奔跑",
            "B. 缓慢行走脚步不稳",
            "C. 大步流星",
            "D. 健步如飞"
        ],
        "answer": "B. 缓慢行走脚步不稳",
        "analysis": "「蹒跚」指腿脚不灵便走路缓慢摇摆的样子。《背影》中朱自清用它来形容父亲年老体胖行动不便却仍为儿子买橘子的感人形象。ACD都与蹒跚意思相反。理解课文关键词要联系上下文。",
        "knowledge_tag": "字词",
        "ability_tag": "词义理解",
        "difficulty": 1,
        "grade": 7,
        "topic": "词义-语境运用"
    },
    {
        "id": "vocab_155",
        "type": "single_choice",
        "question": "加点词语使用不当的一项是（　）。",
        "options": [
            "A. 字龙飞凤舞让人难以辨认",
            "B. 这事他耿耿于怀无法释怀",
            "C. 批评让我如沐春风心里暖暖的",
            "D. 公园百花齐放美不胜收"
        ],
        "answer": "C. 批评让我如沐春风心里暖暖的",
        "analysis": "「如沐春风」比喻同品德高尚且有学识的人相处受到熏陶舒服愉快，是褒义词。但C说的是老师的批评——批评不会让人如沐春风！应改为「幡然醒悟」「深受启发」等。A「龙飞凤舞」此处含贬义（潦草难认）正确；B正确；D正确。",
        "knowledge_tag": "字词",
        "ability_tag": "词义理解",
        "difficulty": 2,
        "grade": 6,
        "topic": "词义-语境运用"
    },
    {
        "id": "vocab_156",
        "type": "single_choice",
        "question": "「滔滔不绝」使用恰当的一项是（　）。",
        "options": [
            "A. 下雨河水滔滔不绝向东流去",
            "B. 他讲起经历滔滔不绝说了两小时",
            "C. 瀑布从悬崖滔滔不绝地落下来",
            "D. 时间滔滔不绝流逝一去不复返"
        ],
        "answer": "B. 他讲起经历滔滔不绝说了两小时",
        "analysis": "「滔滔不绝」形容说话连续不断像河水一样，专门用于人说话议论的场景。A河水应用「奔流不息」；C瀑布应用「飞流直下」；D时间应用「匆匆流逝」。B用于讲经历正是标准用法。注意它只能用于言语不能用于水流或时间。",
        "knowledge_tag": "字词",
        "ability_tag": "词义理解",
        "difficulty": 2,
        "grade": 5,
        "topic": "词义-语境运用"
    },

    # ========== 字形-形近字辨析（8题）==========
    {
        "id": "vocab_157",
        "type": "single_choice",
        "question": "书写完全正确的一项是（　）。",
        "options": [
            "A. 悲衰 摧伤 分岐 鬼计",
            "B. 悲哀 摧伤 分歧 诡计",
            "C. 悲衷 催伤 分岐 鬼计",
            "D. 悲哀 摧伤 分歧 诡计"
        ],
        "answer": "B. 悲哀 摧伤 分歧 诡计",
        "analysis": "四组易错字辨析：①「悲哀」（伤心）口字旁哀叹不是衰（衰落）也不是衷（内心）；②「摧残」用手破坏不是催（催促）；③「分歧」意见不一致山旁岔路不是岐（山名）；④「诡计」言字旁欺诈不是鬼。B全部正确。",
        "knowledge_tag": "字词",
        "ability_tag": "字形辨析",
        "difficulty": 2,
        "grade": 6,
        "topic": "字形-形近字辨析"
    },
    {
        "id": "vocab_158",
        "type": "single_choice",
        "question": "只要我们（　　）就能战胜困难。",
        "options": [
            "A. 坚持",
            "B. 坚侍",
            "C. 坚持待",
            "D. 侍持"
        ],
        "answer": "A. 坚持",
        "analysis": "「坚持」的「持」是手字旁握住不放持久不变。「侍」是单人旁侍奉服侍与坚持无关。口诀：「坚持」用手抓住不放（提手旁）；「侍候」是人服侍人（单人旁）。",
        "knowledge_tag": "字词",
        "ability_tag": "字形辨析",
        "difficulty": 1,
        "grade": 4,
        "topic": "字形-形近字辨析"
    },
    {
        "id": "vocab_159",
        "type": "single_choice",
        "question": "有错别字的一项是（　）。",
        "options": [
            "A. 即使 既然 忌讳 桅杆",
            "B. 已经 祭祀 伟大 诡辩",
            "C. 即将 记录 气氛 汽水",
            "D. 既然 即然 即位 即刻"
        ],
        "answer": "D. 既然 即然 即位 即刻",
        "analysis": "D中「即然」错误应是「既然」（既表示已经发生）。「即」表示当下靠近（即将即使即刻即位），「既」表示已经完成（既然既定既往不咎）。其他三项全部正确。",
        "knowledge_tag": "字词",
        "ability_tag": "字形辨析",
        "difficulty": 2,
        "grade": 5,
        "topic": "字形-形近字辨析"
    },
    {
        "id": "vocab_160",
        "type": "single_choice",
        "question": "没有错别字的一项是（　）。",
        "options": [
            "A. 赏赐 勘测 峻工 疏浚",
            "B. 赏赐 勒察 竣工 疏浚",
            "C. 尝赐 堪查 俊工 疏俊",
            "D. 赏赐 勘察 峻工 疏浚"
        ],
        "answer": "B. 赏赐 勒察 竣工 疏浚",
        "analysis": "①「赏赐」（赏给财物）赏是欣赏奖赏不是尝（品尝）；②「勘察」（实地调查）勘查也对但堪（能够）不对；③「竣工」（工程完成）竣是完毕不是峻（严峻高大）也不是俊（俊秀）；④「疏浚」（疏通水道）浚是疏通不是俊。B全部正确。",
        "knowledge_tag": "字词",
        "ability_tag": "字形辨析",
        "difficulty": 2,
        "grade": 6,
        "topic": "字形-形近字辨析"
    },
    {
        "id": "vocab_161",
        "type": "single_choice",
        "question": "「捺」和「奈」使用正确的一项是（　）。",
        "options": [
            "A. 按捺不住 无可耐何",
            "B. 按奈不住 无可奈何",
            "C. 按捺不住 无可奈何",
            "D. 按奈不耐 无可奈何"
        ],
        "answer": "C. 按捺不住 无可奈何",
        "analysis": "①「按捺不住」——捺是提手旁按压情绪。奈是奈何没有按压之意。②「无可奈何」——奈何是怎么办没有办法。耐是忍耐承受。A错第二个词（耐何→奈何）；B错第一个词（按奈→按捺）；D两处都错。C全部正确。口诀：手压情绪用捺（提手旁），没有办法用奈（奈何）。",
        "knowledge_tag": "字词",
        "ability_tag": "字形辨析",
        "difficulty": 2,
        "grade": 5,
        "topic": "字形-形近字辨析"
    },
    {
        "id": "vocab_162",
        "type": "single_choice",
        "question": "没有错别字的一项是（　）。",
        "options": [
            "A. 这种病的徵状很明显不难诊断",
            "B. 他做事总是慢条斯理从不慌张",
            "C. 老师的教悔让我明白做人道理",
            "D. 桥的结构件固耐用经得起考验"
        ],
        "answer": "B. 他做事总是慢条斯理从不慌张",
        "analysis": "A「徵症」应为「症状」（症是病症徵是征召）；C「教悔」应为「教诲」（诲是言字旁教导悔是后悔）；D「件固」应为「坚固」。B「慢条斯理」形容动作缓慢不慌忙书写完全正确。",
        "knowledge_tag": "字词",
        "ability_tag": "字形辨析",
        "difficulty": 2,
        "grade": 5,
        "topic": "字形-形近字辨析"
    },
    {
        "id": "vocab_163",
        "type": "single_choice",
        "question": "「躁」「燥」「噪」「澡」使用正确的一项是（　）。",
        "options": [
            "A. 性急浮燥 口舌之争吵噪",
            "B. 性急浮躁 洗澡之后不吵不噪",
            "C. 干燥气候 洗操干净 不骄不燥",
            "D. 心浮气躁 天气干燥 减少噪音"
        ],
        "answer": "D. 心浮气躁 天气干燥 减少噪音",
        "analysis": "四字辨析口诀——有足就急躁（急躁暴躁烦躁）；有火就干燥（干燥燥热）；有口就叫噪（噪音聒噪喧噪）；有水就是澡（洗澡澡堂）。D分别用了正确的字。A两处错误；B吵噪应为吵闹或喧嚣；C三处错误。",
        "knowledge_tag": "字词",
        "ability_tag": "字形辨析",
        "difficulty": 2,
        "grade": 5,
        "topic": "字形-形近字辨析"
    },
    {
        "id": "vocab_164",
        "type": "single_choice",
        "question": "「璧」「壁」「碧」使用正确的一项是（　）。",
        "options": [
            "A. 完壁归赵 墙壁 璧玉",
            "B. 完璧归赵 墙壁 碧玉",
            "C. 完璧归赵 墙璧 璧玉",
            "D. 完壁归赵 壁墙 碧玉"
        ],
        "answer": "B. 完璧归赵 墙壁 碧玉",
        "analysis": "三个字区分：「璧」（底部是玉）= 玉器（完璧归赵璧玉）；「壁」（底部是土）= 墙壁（墙壁壁炉峭壁）；「碧」（底部是石）= 青绿色（碧绿碧玉石字底）。注意「碧玉」是青绿色的玉用石字底的碧。B全部正确。",
        "knowledge_tag": "字词",
        "ability_tag": "字形辨析",
        "difficulty": 2,
        "grade": 5,
        "topic": "字形-形近字辨析"
    },

    # ========== 字形-书写规范（2题）==========
    {
        "id": "vocab_167",
        "type": "single_choice",
        "question": "广告用语中没有使用谐音错别字的是（　）。",
        "options": [
            "A. 衣衣不舍（洗衣店）",
            "B. 食全食美（餐厅）",
            "C. 品质保证（电器厂）",
            "D. 咳不容缓（止咳药）"
        ],
        "answer": "C. 品质保证（电器厂）",
        "analysis": "A「衣衣不舍」利用依依不舍谐音（依依→衣衣）不规范；B「食全食美」利用十全十美谐音不规范；D「咳不容缓」利用刻不容缓谐音（刻→咳）不规范；C「品质保证」使用规范汉字。考试注意创意广告≠规范书写。",
        "knowledge_tag": "字词",
        "ability_tag": "字形辨析",
        "difficulty": 1,
        "grade": 4,
        "topic": "字形-书写规范"
    },
    {
        "id": "vocab_168",
        "type": "single_choice",
        "question": "使用了规范汉字的一项是（　）。",
        "options": [
            "A. 咳不容缓（止咳药）",
            "B. 码上到账（转账提示）",
            "C. 精心设计（装修宣传）",
            "D. 随心所浴（热水器）"
        ],
        "answer": "C. 精心设计（装修宣传）",
        "analysis": "A利用刻不容缓谐音不规范；B利用马上谐音不规范；C精心设计全部使用规范汉字；D利用随心所欲谐音不规范。C作为普通用语最典型。注意银行App中「码上到账」虽常见但仍属谐音梗非规范汉字。",
        "knowledge_tag": "字词",
        "ability_tag": "字形辨析",
        "difficulty": 1,
        "grade": 4,
        "topic": "字形-书写规范"
    },

    # ========== 字音-多音字辨析（5题）==========
    {
        "id": "vocab_169",
        "type": "single_choice",
        "question": "「模」读音与其他三项不同的是（　）。",
        "options": [
            "A. 模(mó)型",
            "B. 模(mó)范",
            "C. 模(mú)样",
            "D. 模(mó)仿"
        ],
        "answer": "C. 模(mú)样",
        "analysis": "「模」两个读音：mó（模型模范模式模仿模糊）和mú（模样模具模子）。ABD都读mó只有C读mú。规律——表示标准规范效法读mó；表示样子人的模样读mú。",
        "knowledge_tag": "字词",
        "ability_tag": "字音辨析",
        "difficulty": 2,
        "grade": 5,
        "topic": "字音-多音字辨析"
    },
    {
        "id": "vocab_170",
        "type": "single_choice",
        "question": "读音完全相同的一项是（　）。",
        "options": [
            "A. 降落(jiàng) 投降(xiáng) 降伏(xiáng)",
            "B. 方便(biàn) 便利(biàn) 便于(biàn)",
            "C. 音乐(yuè) 快乐(lè) 乐章(yuè)",
            "D. 朝(cháo)向 朝(zhāo)阳 朝(zhāo)气"
        ],
        "answer": "B. 方便(biàn) 便利(biàn) 便于(biàn)",
        "analysis": "A不完全相同（jiàng/xiáng/xiáng/fu）；B方便便利便于中的便都读biàn（方便之义）全部相同；C不相同（yuè/lè/yuè）；D不相同（cháo/zhāo/zhāo）。答案为B。「便」读biàn表示方便读pián表示便宜。",
        "knowledge_tag": "字词",
        "ability_tag": "字音辨析",
        "difficulty": 2,
        "grade": 5,
        "topic": "字音-多音字辨析"
    },
    {
        "id": "vocab_171",
        "type": "single_choice",
        "question": "「载」读zǎi的是（　）。",
        "options": [
            "A. 载重 装载",
            "B. 记载 三年五载",
            "C. 下载 载货",
            "D. 载歌载舞"
        ],
        "answer": "B. 记载 三年五载",
        "analysis": "载读音规则：①zài——装载运载充满（载重装载下载载货负载）；②zǎi——记录或年（记载刊载转载三年五载千载难逢）；③zài特殊——载歌载舞（一边…一边…）。ABD读zài；B读zǎi。",
        "knowledge_tag": "字词",
        "ability_tag": "字音辨析",
        "difficulty": 2,
        "grade": 5,
        "topic": "字音-多音字辨析"
    },
    {
        "id": "vocab_172",
        "type": "single_choice",
        "question": "注音完全正确的一项是（　）。（字：劲角壳血）",
        "options": [
            "A. 干劲(jìn) 角色(jiǎo) 蛋壳(ké) 鲜血(xuè)",
            "B. 干劲(jìng) 主角(jiǎo) 地壳(qiào) 血液(xuě)",
            "C. 干劲(jìn) 角斗(jué) 贝壳(ké) 流血(xuè)",
            "D. 干劲(jìng) 角度(jiǎo) 躯壳(ké) 血压(xuē)"
        ],
        "answer": "A. 干劲(jìn) 角色(jiǎo) 蛋壳(ké) 鲜血(xuè)",
        "analysis": "①干劲jìn（力气）不是jìng（劲敌）；②角色jiǎo（人物）角斗主角读jué；③蛋壳贝壳ké口语地壳躯壳qiào书面语；④鲜血血液血压——口语复合词xuě双音节词xuè。A全部正确。",
        "knowledge_tag": "字词",
        "ability_tag": "字音辨析",
        "difficulty": 3,
        "grade": 6,
        "topic": "字音-多音字辨析"
    },
    {
        "id": "vocab_173",
        "type": "single_choice",
        "question": "「薄」读báo的是（　）。",
        "options": [
            "A. 薄弱 单薄",
            "B. 薄饼 薄纸",
            "C. 刻薄 鄙薄",
            "D. 薄荷"
        ],
        "answer": "B. 薄饼 薄纸",
        "analysis": "薄三种读音：①báo——厚度小口语（薄饼薄纸薄片）；②bó——轻微少不厚道书面语（薄弱单薄刻薄鄙薄薄礼日薄西山）；③bò——薄荷（植物固定读音）。A读bó；B读báo；C读bó；D读bò。规律——口语中说东西薄读báo书面语读bó。",
        "knowledge_tag": "字词",
        "ability_tag": "字音辨析",
        "difficulty": 2,
        "grade": 5,
        "topic": "字音-多音字辨析"
    }
]


def main():
    input_file = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "..", "src", "data", "questions_vocab.json"
    )
    
    print(f"读取文件: {input_file}")
    
    with open(input_file, "r", encoding="utf-8") as f:
        content = f.read()
        existing_data = json.loads(content)
    
    print(f"现有题目数: {len(existing_data)}")
    
    existing_ids = {q["id"] for q in existing_data}
    
    new_ids = {q["id"] for q in NEW_QUESTIONS}
    conflicts = existing_ids & new_ids
    if conflicts:
        print(f"ID冲突! 已存在: {conflicts}")
        return
    
    existing_data.extend(NEW_QUESTIONS)
    
    total = len(existing_data)
    print(f"追加新题: {len(NEW_QUESTIONS)} 道")
    print(f"最终总题数: {total} 道")
    
    with open(input_file, "w", encoding="utf-8") as f:
        json.dump(existing_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n已写入文件: {input_file}")
    
    # 统计各类别分布
    print("\n" + "=" * 50)
    print("最终题型分布统计")
    print("=" * 50)
    
    stats = {}
    difficulty_stats = {}
    topic_stats = {}
    
    for q in existing_data:
        tag = q.get("ability_tag", "未知")
        stats[tag] = stats.get(tag, 0) + 1
        
        diff = q.get("difficulty", 0)
        if diff == 1:
            diff_label = "基础"
        elif diff == 2:
            diff_label = "提升"
        elif diff >= 3:
            diff_label = "拓展"
        else:
            diff_label = "未标注"
        difficulty_stats[diff_label] = difficulty_stats.get(diff_label, 0) + 1
        
        topic = q.get("topic", "")
        if topic:
            topic_stats[topic] = topic_stats.get(topic, 0) + 1
    
    print("\n【按 ability_tag 分类】")
    for tag, count in sorted(stats.items(), key=lambda x: -x[1]):
        pct = count / total * 100
        print(f"  {tag}: {count} 题 ({pct:.1f}%)")
    
    print("\n【按难度分类】")
    for diff, count in sorted(difficulty_stats.items()):
        pct = count / total * 100
        print(f"  {diff}: {count} 题 ({pct:.1f}%)")
    
    if topic_stats:
        print("\n【按 topic 细分类】")
        for topic, count in sorted(topic_stats.items(), key=lambda x: -x[1]):
            pct = count / total * 100
            print(f"  {topic}: {count} 题 ({pct:.1f}%)")
    
    print("\n【答案分布】(ABCD)")
    answer_count = {"A": 0, "B": 0, "C": 0, "D": 0}
    for q in existing_data:
        ans = q.get("answer", "")
        for letter in ["A", "B", "C", "D"]:
            if ans.startswith(letter):
                answer_count[letter] += 1
                break
    
    for letter, count in answer_count.items():
        pct = count / total * 100
        print(f"  {letter}: {count} 题 ({pct:.1f}%)")


if __name__ == "__main__":
    main()
