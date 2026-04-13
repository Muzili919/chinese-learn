#!/usr/bin/env python3
"""Fix Chinese reading comprehension question bank - using actual Chinese text."""

import json, copy

with open('src/data/questions_reading.json', 'r', encoding='utf-8') as f:
    questions = json.load(f)

q_map = {q['id']: q for q in questions}
print(f"Total: {len(questions)}")

# ============================================
# 1. Fix reading_025: 3 traits not 2
# ============================================
q = q_map['reading_025']
q['answer'] = '（1）写了猫三个特点：老实、贪玩、尽职。\n（2）中心句：猫的性格实在有些古怪。'
q['question'] = q['question'].replace(
    '（2）第2自然段写了猫的两个特点：一是__________，二是__________。',
    '（2）这段话的中心句是哪一句？\n________________________________________'
)
q['analysis'] = '考点：概括段落大意和提取关键信息\n\n解题思路：这段文字以"古怪"为总起，分别写了"老实""贪玩""尽职"三个特点。抓住中心句就能整体把握。\n\n总结：概括段意可以先找中心句，没有中心句就自己归纳。注意段内层次的完整划分。'
q['keywords'] = ['老实', '贪玩', '尽职', '三个特点']
print("OK reading_025")

# ============================================
# 2. Fix reading_028: matching -> single_choice
# ============================================
q = q_map['reading_028']
q['type'] = 'single_choice'
q['question'] = '阅读下面短文，回答问题。\n\n阅读方法有不同的作用，请根据你的理解选择正确答案。\n\n下列阅读方法与作用的对应，正确的一项是（　）。'
q['options'] = [
    'A. 浏览——快速查找特定信息；精读——了解文章大意',
    'B. 浏览——了解文章大意；精读——深入理解文章内容和情感',
    'C. 跳读——深入理解文章内容和情感；批注——边读边写',
    'D. 批注——快速查找特定信息；跳读——边读边写下理解'
]
q['answer'] = 'B'
q['analysis'] = '考点：阅读方法的匹配\n\n解题思路：浏览=快速了解大意；精读=深入理解内容和情感；跳读=快速查找特定信息；批注=边读边写下理解和疑问。\n\n总结：不同的阅读目的要用不同的阅读方法：略读知大意，精读悟细节，跳读查信息，批注助思考。'
print("OK reading_028")

# ============================================
# 3. Fix reading_029: fill_blank -> ordering
# ============================================
q = q_map['reading_029']
q['type'] = 'ordering'
q['answer'] = '2,3,4,1'
q['question'] = q['question'].replace(
    '（只写序号）',
    '将下列事件按文中发生的先后顺序排列，将正确顺序的序号依次排列（如1,2,3,4）：'
)
q['analysis'] = '考点：对记叙文事件顺序的理解\n\n解题思路：按文中事件发生先后排序：先妒忌②，再商议③，再问十天④，最后诸葛亮说三天①。\n\n总结：排序题要抓住时间词和事件发展的逻辑顺序。正确顺序：②→③→④→①'
print("OK reading_029")

# ============================================
# 4. Fix "加点字" -> "<u>underline</u>" for wenyanwen
# ============================================
wenyanwen_questions = ['reading_013', 'reading_016', 'reading_019', 'reading_022',
                        'reading_030', 'reading_034', 'reading_036', 'reading_038',
                        'reading_039', 'reading_040']

for qid in wenyanwen_questions:
    q = q_map[qid]
    q['question'] = q['question'].replace('加点字', '带下划线的')
    # For questions that have specific target characters, wrap them in <u> tags
    if qid == 'reading_013':
        q['question'] = q['question'].replace('①虎求百兽而食之（求：', '①虎<u>求</u>百兽而食之（求：')
        q['question'] = q['question'].replace('②天帝使我长百兽（长：', '②天帝使我<u>长</u>百兽（长：')
        q['question'] = q['question'].replace('③兽见之皆走（走：', '③兽见之皆<u>走</u>（走：')
    elif qid == 'reading_016':
        q['question'] = q['question'].replace('"众皆弃去"中的"弃"', '"众皆<u>弃</u>去"中的<u>弃</u>')
    elif qid == 'reading_019':
        q['question'] = q['question'].replace('①株（', '①<u>株</u>（')
        q['question'] = q['question'].replace('②走（', '②<u>走</u>（')
        q['question'] = q['question'].replace('③释（', '③<u>释</u>（')
        q['question'] = q['question'].replace('④冀（', '④<u>冀</u>（')
    elif qid == 'reading_022':
        q['question'] = q['question'].replace('①辄（', '①<u>辄</u>（')
        q['question'] = q['question'].replace('②故（', '②<u>故</u>（')
        q['question'] = q['question'].replace('③法（', '③<u>法</u>（')
    elif qid == 'reading_030':
        q['question'] = q['question'].replace('①好（', '①<u>好</u>（')
        q['question'] = q['question'].replace('②窥（', '②<u>窥</u>（')
        q['question'] = q['question'].replace('③牖（', '③<u>牖</u>（')
        q['question'] = q['question'].replace('④还（', '④<u>还</u>（')
    elif qid == 'reading_034':
        q['question'] = q['question'].replace('①弃（', '①<u>弃</u>（')
        q['question'] = q['question'].replace('②逢（', '②<u>逢</u>（')
        q['question'] = q['question'].replace('③妪（', '③<u>妪</u>（')
        q['question'] = q['question'].replace('④卒（', '④<u>卒</u>（')
    elif qid == 'reading_036':
        q['question'] = q['question'].replace('①齐宣王使人吹竽（使：', '①齐宣王<u>使</u>人吹竽（使：')
        q['question'] = q['question'].replace('②宣王说之（说：', '②宣王<u>说</u>之（说：')
        q['question'] = q['question'].replace('③好一一听之（好：', '③<u>好</u>一一听之（好：')
    elif qid == 'reading_038':
        q['question'] = q['question'].replace('①先自度其足（度：', '①先自<u>度</u>其足（度：')
        q['question'] = q['question'].replace('②而忘操之（操：', '②而忘<u>操</u>之（操：')
        q['question'] = q['question'].replace('③反归取之（反：', '③<u>反</u>归取之（反：')
        q['question'] = q['question'].replace('④宁信度（度：', '④宁信<u>度</u>（度：')
    elif qid == 'reading_039':
        q['question'] = q['question'].replace('①欲负而走（负：', '①欲<u>负</u>而<u>走</u>（负：')
        q['question'] = q['question'].replace('走：________）\n②以椎毁之（以：', '走：________）\n②<u>以</u>椎毁之（以：')
        q['question'] = q['question'].replace('③遽掩其耳（遽：', '③<u>遽</u>掩其耳（遽：')
        q['question'] = q['question'].replace('④悖矣（悖：', '④<u>悖</u>矣（悖：')
    elif qid == 'reading_040':
        q['question'] = q['question'].replace('①引酒且饮之（引：', '①<u>引</u>酒且饮之（引：')
        q['question'] = q['question'].replace('②蛇固无足（固：', '②蛇<u>固</u>无足（固：')
        q['question'] = q['question'].replace('③子安能为之足（安：', '③子<u>安</u>能为之足（安：')
        q['question'] = q['question'].replace('④终亡其酒（亡：', '④终<u>亡</u>其酒（亡：')
    print(f"OK {qid} (wenyanwen)")

# Fix difficulty
q_map['reading_030']['difficulty'] = 3
q_map['reading_038']['difficulty'] = 3
q_map['reading_040']['difficulty'] = 3

# ============================================
# 5. Convert open_ended to single_choice
# ============================================

def make_choice(q, new_question, options, answer_letter, analysis):
    q['type'] = 'single_choice'
    q['question'] = new_question
    q['options'] = options
    q['answer'] = answer_letter
    q['analysis'] = analysis

# reading_001
make_choice(q_map['reading_001'],
    '阅读短文，完成题目。\n\n下雨了，小路变得泥泞不堪，小明的鞋子上沾满了泥巴。他本来想回家换鞋，但想到今天要去看望生病的同学，他还是继续向前走去。\n\n这段话主要说明了什么？',
    ['A. 小明喜欢在下雨天走路。', 'B. 小明不怕困难，坚持去看望生病的同学。', 'C. 小明忘记带伞了。', 'D. 小明的鞋子很不好。'],
    'B', '考点：概括段落主旨（排除表面信息干扰）\n\n解题思路：先找出事件核心，再判断作者重点强调的内容。文中既有"下雨泥泞"，也有"坚持前行"，要抓住行为背后的品质。\n\n总结：主旨题常设陷阱：用环境描写干扰你，必须抓"人物行为+态度"。')
print("OK reading_001")

# reading_002
make_choice(q_map['reading_002'],
    '阅读句子，完成题目。\n\n听到比赛失败的消息，他反而笑了，说："这次让我看清了自己的不足。"\n\n句中"反而"的作用是什么？',
    ['A. 递进关系，进一步说明他很难过。', 'B. 表示转折和出乎意料，说明他的反应与常人不同。', 'C. 因果关系，因为失败所以他笑了。', 'D. 并列关系，同时表达两种情绪。'],
    'B', '考点：词语作用理解（转折关系）\n\n解题思路：先判断常规情况（失败应难过），再看实际表现（却笑了），分析词语作用。\n\n总结：词语作用题要看"预期"和"实际"是否相反。')
print("OK reading_002")

# reading_003
make_choice(q_map['reading_003'],
    '阅读短文，完成题目。\n\n小华早上七点起床，吃完早饭后七点半出门，八点准时到校。放学后他先写作业，再去打篮球。\n\n问题：小华是几点出门的？',
    ['A. 七点', 'B. 七点半', 'C. 八点', 'D. 放学后'],
    'B', '考点：信息提取（时间顺序）\n\n解题思路：按时间顺序逐条提取信息，注意不要被其他时间干扰。\n\n总结：细节题常用多个时间干扰，必须精准定位关键词。')
q_map['reading_003']['difficulty'] = 1
print("OK reading_003")

# reading_004
make_choice(q_map['reading_004'],
    '阅读短文，完成题目。\n\n妈妈下班回家，看到桌子上已经摆好了热腾腾的饭菜，厨房也收拾得干干净净。她笑着说："今天真轻松。"\n\n关于这些饭菜是谁做的，下列推断最合理的是？',
    ['A. 一定是爸爸做的，因为妈妈在上班。', 'B. 最有可能是家里其他人（孩子、长辈等）做的。', 'C. 一定是外卖送来的。', 'D. 妈妈自己出门前做的。'],
    'B', '考点：根据情境进行合理推断\n\n解题思路：结合人物身份和时间顺序进行判断，排除不合理可能。妈妈刚下班看到已做好的饭菜，说明是家里其他人做的。\n\n总结：推断题必须"有依据"，不能凭感觉。')
print("OK reading_004")

# reading_005
make_choice(q_map['reading_005'],
    '阅读句子，完成题目。\n\n他默默地把地上的垃圾捡起来，什么也没说。\n\n这句话表现了人物什么品质？',
    ['A. 勤劳能干，不怕脏。', 'B. 身体强壮，力气很大。', 'C. 有公德心，默默做好事、不张扬。', 'D. 喜欢运动，热爱锻炼。'],
    'C', '考点：人物品质分析\n\n解题思路：从动作和语言入手，"默默""什么也没说"是关键。\n\n总结：人物题一定抓"动作+态度词"。')
print("OK reading_005")

# reading_006
make_choice(q_map['reading_006'],
    '阅读句子，完成题目。\n\n他说话声音不大，但每个人都听得很认真。\n\n这句话主要说明了什么？',
    ['A. 大家听力都很好。', 'B. 教室很安静。', 'C. 他说的话很有吸引力或很有分量。', 'D. 他的声音其实很大。'],
    'C', '考点：句意理解（对比关系）\n\n解题思路：抓"声音不大"和"认真听"的对比，分析原因。\n\n总结：出现"但"字，重点往往在后面。')
print("OK reading_006")

# reading_007
make_choice(q_map['reading_007'],
    '阅读古诗，完成题目。\n\n"白日依山尽，黄河入海流。"（王之涣《登鹳雀楼》）\n\n下列对这两句诗描写的景象特点概括最准确的是？',
    ['A. 描写了山上的白日和海边的黄河。', 'B. 描写了夕阳西下、江河奔流的壮阔景象。', 'C. 描写了诗人站在山顶看海的景象。', 'D. 描写了安静祥和的山水画面。'],
    'B', '考点：古诗画面理解\n\n解题思路：逐句分析意象："白日""山""黄河""海"。"依山尽"写夕阳西沉，"入海流"写黄河奔腾入海，合起来是壮阔景象。\n\n总结：古诗题必须"意象+整体画面"。')
print("OK reading_007")

# reading_008
make_choice(q_map['reading_008'],
    '阅读短文，完成题目。\n\n小刚平时成绩一般，但这次考试却取得了很好的成绩。他说："我只是把该做的都认真做了一遍。"\n\n这段话主要说明了什么道理？',
    ['A. 考试成绩好是因为运气好。', 'B. 只要认真对待学习，就能取得进步。', 'C. 小刚其实很聪明。', 'D. 不认真也能考好。'],
    'B', '考点：归纳道理\n\n解题思路：从结果反推原因，抓住"认真"这一关键词。\n\n总结：道理题优先看人物"总结句"。')
print("OK reading_008")

# reading_009
make_choice(q_map['reading_009'],
    '阅读短文，完成题目。\n\n今天是星期三，小明要参加学校的足球比赛。比赛在下午三点开始，他中午一点就到学校做准备。\n\n问题：比赛几点开始？',
    ['A. 中午一点', 'B. 下午三点', 'C. 星期三', 'D. 不确定'],
    'B', '考点：关键信息提取\n\n解题思路：直接定位"比赛开始"相关信息。\n\n总结：题目问什么，就找什么，不要被时间干扰。')
q_map['reading_009']['difficulty'] = 1
print("OK reading_009")

# reading_010
make_choice(q_map['reading_010'],
    '阅读短文，完成题目。\n\n小雨看到一只受伤的小鸟，她把小鸟带回家，细心照顾，直到小鸟康复后才把它放回大自然。\n\n请选择对小雨品质概括最准确的一项。',
    ['A. 小雨是一个喜欢动物、但胆子很小的人。', 'B. 小雨是一个善良、有爱心的人。', 'C. 小雨是一个活泼好动的人。', 'D. 小雨是一个贪玩的人。'],
    'B', '考点：人物评价+理由表达\n\n解题思路：先总结品质，再用具体行为作为依据。救助并照顾受伤小鸟体现了善良和爱心。\n\n总结：人物题标准答案结构：品质+具体行为。')
print("OK reading_010")

# reading_011
make_choice(q_map['reading_011'],
    '阅读短文时，我们常用"三读法"来帮助理解。下列对"三读法"的顺序和内容概括正确的是？',
    ['A. 一读浏览知大意，二读细读解词句，三读品读悟情理。', 'B. 一读精读知大意，二读浏览解词句，三读朗读悟情理。', 'C. 一读浏览知大意，二读朗读解词句，三读精读悟情理。', 'D. 一读细读知大意，二读浏览解词句，三读品读悟情理。'],
    'A', '考点：阅读方法的基本步骤\n\n解题思路：第一遍快速读了解大意（浏览），第二遍仔细读理解词句（细读），第三遍品味读感悟情感道理（品读）。\n\n总结："三读法"是有效的阅读策略：浏览（粗读）→细读（精读）→品读（赏析）。')
print("OK reading_011")

# reading_014
make_choice(q_map['reading_014'],
    '阅读时概括段落大意，可以用"摘句法"和"合并法"。下列说法正确的是？',
    ['A. 摘句法是摘取开头句，合并法是把段落合在一起。', 'B. 摘句法是找中心句，合并法是把几个意思归纳在一起。', 'C. 摘句法是找重点词，合并法是把段落拆分开来。', 'D. 摘句法和合并法是完全相同的方法。'],
    'B', '考点：概括段落大意的方法\n\n解题思路：摘句法就是直接摘取段落中的中心句；合并法就是把几个层次的意思合并起来。\n\n总结：概括段意的常用方法：摘句法（找中心句）、合并法（归纳各层意思）、串联法（串联关键词语）。')
print("OK reading_014")

# reading_017
make_choice(q_map['reading_017'],
    '阅读中遇到不理解的词语，以下哪种方法是不正确的？',
    ['A. 联系上下文猜词义。', 'B. 拆字再组合理解词义。', 'C. 找近义词来替换验证。', 'D. 直接跳过，不思考词义。'],
    'D', '考点：理解词语含义的方法\n\n解题思路：常用方法包括联系上下文、拆字法、近义词替换、联系生活实际等。直接跳过不思考是不正确的。\n\n总结：阅读时遇到生词不要慌，先上下文找线索，再拆字组合，或想想近义词，一般能猜出大概意思。')
print("OK reading_017")

# reading_020
make_choice(q_map['reading_020'],
    '阅读时划分段落层次，按事情发展顺序应该找什么？',
    ['A. 找时间词、找方位词、找原因和结果。', 'B. 找中心句、找过渡段、找修辞手法。', 'C. 找起因→经过→结果。', 'D. 找人物、找地点、找事件。'],
    'C', '考点：划分段落层次的方法\n\n解题思路：按事情发展顺序找起因、经过、结果。按时间顺序找时间词；按空间顺序找方位词。\n\n总结：划分段落层次是阅读理解的基础，要根据文章的写作顺序来分段。')
print("OK reading_020")

# reading_021
make_choice(q_map['reading_021'],
    '阅读说明文时，"三看"法中正确的一项是？',
    ['A. 一看标题明对象，二看结构理顺序，三看语言抓方法。', 'B. 一看开头明主旨，二看结尾理顺序，三看修辞抓方法。', 'C. 一看标题明对象，二看语言理顺序，三看结构抓方法。', 'D. 一看结构明对象，二看标题理顺序，三看语言抓方法。'],
    'A', '考点：说明文的阅读方法\n\n解题思路：说明文阅读要关注标题（明确说明对象）、文章结构（顺序）、语言特点（说明方法）。\n\n总结：阅读说明文，先看标题知道写什么，再看段落结构了解写作顺序，最后分析说明方法。')
print("OK reading_021")

# reading_023
make_choice(q_map['reading_023'],
    '阅读下面短文，回答问题。\n\n《赵州桥》节选\n赵州桥非常雄伟。桥长五十多米，有九米多宽，中间行车马，两旁走人。这么长的桥，全部用石头砌成，下面没有桥墩，只有一个拱形的大桥洞，横跨在三十七米多宽的河面上。大桥洞顶上的左右两边，还各有两个拱形的小桥洞。\n\n关于赵州桥的设计特点，下列说法正确的是？',
    ['A. 桥长五十多米，只有一个拱形大桥洞，左右各有两个小桥洞。', 'B. 桥长五十多米，有桥墩支撑，设计简单。', 'C. 桥宽九米，只有一个大桥洞，没有小桥洞。', 'D. 桥长三十多米，下面有多个桥墩。'],
    'A', '考点：说明文信息的提取和概括\n\n解题思路：从文中直接找出数字和关键信息。桥长五十多米，一个拱形大桥洞，左右各有两个小桥洞。\n\n总结：阅读说明文时，要关注数字、形状、功能等关键信息。')
q_map['reading_023']['difficulty'] = 1
print("OK reading_023")

# reading_024
make_choice(q_map['reading_024'],
    '阅读下面短文，回答问题。\n\n《富饶的西沙群岛》节选\n西沙群岛一带海水五光十色，瑰丽无比：有深蓝的，淡青的，浅绿的，杏黄的。因为海底高低不平，有山崖，有峡谷，海水有深有浅，从海面看，色彩就不同了。\n\n下列说法中正确的是？',
    ['A. 西沙群岛的海水只有深蓝和淡青两种颜色。', 'B. 海水颜色不同的原因是海底高低不平。', 'C. "五光十色"形容颜色很少。', 'D. 海水颜色是人工染色的。'],
    'B', '考点：对短文细节的理解和判断\n\n解题思路：逐项与原文比对。A错在"只有"；B正确；C错在"很少"；D无依据。\n\n总结：判断题要在原文中找到依据，不能凭感觉。注意绝对化词语。')
print("OK reading_024")

# reading_027
make_choice(q_map['reading_027'],
    '阅读下面短文，回答问题。\n\n《鲸》节选\n鲸的种类很多，总的来说可以分为两大类：一类是须鲸，没有牙齿；一类是齿鲸，有锋利的牙齿。须鲸主要吃虾和小鱼。齿鲸主要吃大鱼和海兽。\n\n下列关于鲸的分类说法正确的是？',
    ['A. 须鲸有锋利的牙齿，齿鲸没有牙齿。', 'B. 须鲸没有牙齿，吃虾和小鱼；齿鲸有锋利的牙齿，吃大鱼和海兽。', 'C. 须鲸和齿鲸都吃大鱼。', 'D. 齿鲸没有牙齿。'],
    'B', '考点：信息提取和分类概括能力\n\n解题思路：从文中找出两类鲸的名称、特征和食物的对应关系。\n\n总结：阅读说明文时，可以用表格或思维导图帮助理清事物分类和特征。')
print("OK reading_027")

# reading_031
make_choice(q_map['reading_031'],
    '阅读下面短文，回答问题。\n\n《威尼斯的小艇》节选\n威尼斯的小艇有二三十英尺长，又窄又深，有点像独木舟。船头和船艄向上翘起，像挂在天边的新月，行动轻快灵活，仿佛田沟里的水蛇。\n\n关于文中的比喻，下列说法正确的是？',
    ['A. 把小艇比作新月，写出了小艇行动轻快灵活的特点。', 'B. 把小艇比作水蛇，写出了小艇两头翘起、形状弯曲的特点。', 'C. 把小艇比作新月，写出了两头翘起、形状弯曲的特点；比作水蛇，写出了行动轻快灵活。', 'D. 小艇没有使用任何比喻手法。'],
    'C', '考点：比喻修辞手法的识别和作用分析\n\n解题思路：找出比喻句的本体和喻体，分析喻体突出本体的什么特征。\n\n总结：比喻能使描写更生动形象。分析比喻时要思考：把什么比作什么？突出了什么特点？')
print("OK reading_031")

# reading_032
make_choice(q_map['reading_032'],
    '阅读下面短文，回答问题。\n\n《松鼠》节选 布封\n松鼠是一种漂亮的小动物，乖巧，驯良，很讨人喜欢。它们面容清秀，眼睛闪闪发光，身体矫健，四肢轻快，非常敏捷，非常机警。玲珑的小面孔，衬上一条帽缨形的美丽尾巴，显得格外漂亮。\n\n根据短文内容，下列说法正确的是？',
    ['A. 松鼠的尾巴像一把扇子。', 'B. 松鼠是一种凶猛的大型动物。', 'C. 松鼠面容清秀，眼睛闪闪发光。', 'D. 松鼠的眼睛黯淡无光。'],
    'C', '考点：对短文细节的提取和判断\n\n解题思路：逐句与原文比对。A错在"扇子"（原文是帽缨形）；B错在"凶猛大型"；C正确；D错在"黯淡无光"。\n\n总结：判断题要关注修饰词和比喻的准确性，不能张冠李戴。')
print("OK reading_032")

# reading_033
make_choice(q_map['reading_033'],
    '阅读下面短文，回答问题。\n\n《小英雄雨来》节选\n雨来刚到堂屋，见十几把雪亮的刺刀从前门进来。他撒腿就往后院跑。背后咔啦一声枪栓响，有人大声叫道："站住！"雨来没理他，脚下像踩着风，一直朝后院跑去。\n\n这段文字体现了雨来什么品质？',
    ['A. 胆小怕事。', 'B. 机智、勇敢、不屈服。', 'C. 调皮捣蛋。', 'D. 力气很大。'],
    'B', '考点：对记叙文情节的提取和人物品质分析\n\n解题思路：从文中找出雨来的动作和反应（撒腿跑、没理敌人），推断品质。\n\n总结：分析人物品质要依据人物的言行。雨来面对敌人不慌张、想方设法逃跑，体现了机智勇敢。')
print("OK reading_033")

# reading_035
make_choice(q_map['reading_035'],
    '阅读下面短文，回答问题。\n\n《落花生》节选 许地山\n父亲说："花生的好处很多，有一样最可贵：它的果实埋在地里，不像桃子、石榴、苹果那样，把鲜红嫩绿的果实高高地挂在枝头上。"我说："那么，人要做有用的人，不要做只讲体面，而对别人没有好处的人。"\n\n这篇短文的中心思想是？',
    ['A. 花生比桃子、石榴、苹果更好吃。', 'B. 人要做朴实无华、默默奉献、对社会有用的人。', 'C. 果实应该都埋在地里。', 'D. 只讲体面的人也能成功。'],
    'B', '考点：对散文中心思想的概括\n\n解题思路：抓住父亲的话和"我"的感悟。花生果实埋在地里=朴实无华默默奉献；"做有用的人"=对社会有用。\n\n总结：概括中心思想要包括：主要内容+表达的情感/说明的道理。')
print("OK reading_035")

# reading_037 -> single_choice (phonetics only)
q37 = q_map['reading_037']
q37['type'] = 'single_choice'
# Keep original question text but just the phonetics part
orig_q = q37['question']
# Extract just the phonetics question part
phonetics_q = orig_q.split('（1）')[0] if '（1）' in orig_q else orig_q
phonetics_q = phonetics_q.replace('加点字', '加粗字')
q37['question'] = phonetics_q.rstrip() + '\n\n下列加粗字的读音完全正确的一项是（　）。'
q37['options'] = [
    'A. 鬻（yú）　誉（yù）　弗（fó）',
    'B. 鬻（yù）　誉（yù）　弗（fú）',
    'C. 鬻（yù）　誉（yú）　弗（fú）',
    'D. 鬻（yú）　誉（yú）　弗（fó）'
]
q37['answer'] = 'B'
q37['analysis'] = '考点：文言文字音辨析\n\n解题思路：鬻（yù）卖；誉（yù）夸耀；弗（fú）不。注意"弗"是二声fú，不是三声fó。\n\n总结："自相矛盾"比喻说话或做事前后抵触，不能自圆其说。注意"鬻"是卖，"誉"是夸耀，"弗"是不。'
print("OK reading_037")

# ============================================
# 6. Add keywords to remaining open_ended
# ============================================
kw_map = {
    'reading_013': ['寻找', '做首领', '管理', '长百兽', '跑', '倚仗', '威势', '没有真本事', '欺压'],
    'reading_016': ['抛弃', '离开', '砸', '破', '石头', '水瓮', '沉着', '冷静', '机智', '勇敢'],
    'reading_019': ['树桩', '跑', '放下', '希望', '不劳而获', '死守', '经验', '不知变通', '妄想'],
    'reading_022': ['就', '原因', '按照道理', '理应', '谦让', '尊敬', '不争'],
    'reading_025': ['老实', '贪玩', '尽职', '三个特点', '古怪', '中心句'],
    'reading_026': ['环境', '影响', '成长', '教育', '近朱者赤', '近墨者黑', '墓地', '市场', '学宫'],
    'reading_030': ['喜欢', '偷看', '窗户', '转身', '逃跑', '害怕', '表面', '假装', '不是真正'],
    'reading_034': ['放弃', '遇见', '老妇人', '完成', '功夫', '毅力', '成功', '感动'],
    'reading_036': ['派', '让', '同悦', '喜欢', '混', '假装', '没有真才实学', '诚实', '真本领'],
    'reading_038': ['量', '拿', '返回', '同返', '尺码', '忘记', '墨守成规', '死板', '变通'],
    'reading_039': ['背', '跑', '用', '急忙', '荒谬', '糊涂', '自欺欺人', '愚蠢', '掩耳'],
    'reading_040': ['拿', '取', '本来', '怎么', '失去', '多此一举', '弄巧成拙', '恰到好处'],
}

for qid, kws in kw_map.items():
    if qid in q_map and q_map[qid]['type'] == 'open_ended':
        q_map[qid]['keywords'] = kws

print("OK keywords")

# ============================================
# 7. Update ability_tag
# ============================================
tag_map = {
    'reading_001': '主旨概括', 'reading_002': '词句理解', 'reading_003': '信息提取',
    'reading_004': '推断想象', 'reading_005': '人物品质', 'reading_006': '词句理解',
    'reading_007': '古诗理解', 'reading_008': '道理归纳', 'reading_009': '信息提取',
    'reading_010': '人物品质', 'reading_011': '阅读方法', 'reading_012': '信息提取',
    'reading_013': '词句理解', 'reading_014': '主旨概括', 'reading_015': '信息提取',
    'reading_016': '词句理解', 'reading_017': '阅读方法', 'reading_018': '主旨概括',
    'reading_019': '词句理解', 'reading_020': '阅读方法', 'reading_021': '阅读方法',
    'reading_022': '词句理解', 'reading_023': '信息提取', 'reading_024': '信息提取',
    'reading_025': '主旨概括', 'reading_026': '内容理解', 'reading_027': '信息提取',
    'reading_028': '阅读方法', 'reading_029': '事件排序', 'reading_030': '词句理解',
    'reading_031': '修辞理解', 'reading_032': '信息提取', 'reading_033': '人物品质',
    'reading_034': '词句理解', 'reading_035': '主旨概括', 'reading_036': '词句理解',
    'reading_037': '字音辨析', 'reading_038': '词句理解', 'reading_039': '词句理解',
    'reading_040': '词句理解',
}
for qid, tag in tag_map.items():
    if qid in q_map:
        q_map[qid]['ability_tag'] = tag
print("OK ability_tags")

# ============================================
# 8. Normalize single_choice answers
# ============================================
for q in questions:
    if q['type'] == 'single_choice':
        ans = str(q['answer']).strip()
        if len(ans) == 1 and ans.upper() in 'ABCD':
            q['answer'] = ans.upper()
        elif len(ans) > 1 and ans[0].upper() in 'ABCD':
            q['answer'] = ans[0].upper()
print("OK answer normalization")

# ============================================
# Write output
# ============================================
with open('src/data/questions_reading.json', 'w', encoding='utf-8') as f:
    json.dump(questions, f, ensure_ascii=False, indent=2)
print(f"\nWritten: {len(questions)} questions")

# ============================================
# Verification
# ============================================
type_counts = {}
diff_counts = {}
issues = []

for q in questions:
    t = q['type']
    type_counts[t] = type_counts.get(t, 0) + 1
    d = q.get('difficulty', 0)
    diff_counts[d] = diff_counts.get(d, 0) + 1

    if '加点字' in q.get('question', ''):
        issues.append(f"{q['id']}: still has 加点字")
    if '直线连起来' in q.get('question', ''):
        issues.append(f"{q['id']}: still has 直线连起来")
    if t == 'single_choice' and q['answer'] not in 'ABCD':
        issues.append(f"{q['id']}: bad answer '{q['answer']}'")
    if t == 'single_choice' and len(q.get('options', [])) < 4:
        issues.append(f"{q['id']}: <4 options")
    if t == 'open_ended' and 'keywords' not in q:
        issues.append(f"{q['id']}: open_ended missing keywords")

print(f"\nType distribution: {json.dumps(type_counts, ensure_ascii=False)}")
print(f"Difficulty: {json.dumps(diff_counts, ensure_ascii=False)}")
print(f"Issues: {len(issues)}")
for i in issues:
    print(f"  ! {i}")

# Write verification report
verify = {
    'module': '语文阅读理解',
    'total_questions': len(questions),
    'fix_date': '2026-04-13',
    'type_distribution': type_counts,
    'difficulty_distribution': diff_counts,
    'issues_found': len(issues),
    'issues': issues,
    'fixes_applied': [
        'reading_001~010: open_ended -> single_choice',
        'reading_011/014/017/020/021: method mnemonics -> single_choice',
        'reading_023: info extraction -> single_choice, difficulty 2->1',
        'reading_024/032: judge fill_blank -> single_choice',
        'reading_025: answer fixed (2 traits -> 3 traits)',
        'reading_027: mind map -> single_choice',
        'reading_028: matching -> single_choice, removed 直线连起来',
        'reading_029: fill_blank -> ordering, answer format 2,3,4,1',
        'reading_031/033: open_ended -> single_choice',
        'reading_035: central idea -> single_choice',
        'reading_037: mixed type -> pure single_choice (phonetics)',
        'reading_013/016/019/022/026/030/034/036/038/039/040: 加点字 -> <u>underline</u>',
        'reading_030/038/040: difficulty 2->3 (超纲标注)',
        'reading_003/009/023: difficulty 2->1 (过于简单)',
        'All open_ended: added keywords for fuzzy matching',
        'All questions: ability_tag refined'
    ],
    'per_question_verification': []
}

for q in questions:
    status = 'pass'
    notes = []
    if '加点字' in q.get('question', ''):
        status = 'fail'; notes.append('仍有加点字')
    if '直线连起来' in q.get('question', ''):
        status = 'fail'; notes.append('仍有直线连起来')
    if q['type'] == 'single_choice':
        if q['answer'] not in 'ABCD':
            status = 'fail'; notes.append(f"answer错误: {q['answer']}")
    if q['type'] == 'open_ended' and 'keywords' not in q:
        status = 'fail'; notes.append('缺少keywords')
    if not notes:
        notes.append('验证通过')
    verify['per_question_verification'].append({
        'id': q['id'], 'type': q['type'], 'difficulty': q.get('difficulty'),
        'ability_tag': q.get('ability_tag'), 'status': status, 'notes': notes
    })

with open('docs/reviews/verify_cn_reading.json', 'w', encoding='utf-8') as f:
    json.dump(verify, f, ensure_ascii=False, indent=2)
print("\nVerification report: docs/reviews/verify_cn_reading.json")
print("DONE")
