#!/usr/bin/env python3
"""
语法题库120题 全面修复脚本
- P0: 修复049/081/086硬伤
- P2: 修复015/090
- P1: 替换15道模板题为高难度题(0.65-0.8)
- P1: 调整B选项占比从42.7%降至~26%
"""

import json

with open('src/data/questions_en_j2_grammar.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

q_by_num = {q['id'].split('_')[-1]: q for q in data}

# ============================================================
# PART 1: P0 硬伤修复
# ============================================================

# --- 049: ever用法改为疑问句 ---
q49 = q_by_num['049']
q49['question'] = "- Have you _____ been to Shanghai?\n- Yes, I have. It's a beautiful city."
q49['analysis'] = "【考点】考查ever在现在完成时疑问句中的用法\n【解题思路】Have you ever been to...? 是现在完成时的经典疑问句型，ever意为「曾经」，用于疑问句询问是否有过某种经历\n【干扰项分析】A的never表示「从不」，用于否定句，与Yes矛盾；C的already通常用于肯定句中间；D的yet用于否定句或疑问句末尾\n【解题口诀】👉 ever用于疑问句 = 「曾经」，Have you ever...? = 你曾经...过吗？"
q49['core_trap'] = "学生在肯定句中用ever不自然，ever主要用于疑问句和否定句"
q49['mnemonic'] = "Have you ever...? = 你曾经...吗？（标准疑问句型）"

# --- 081: 去掉括号里的should提示 ---
q81 = q_by_num['081']
q81['question'] = "You _____ (listen) to the teacher carefully in class."
q81['answer'] = "should listen"
q81['analysis'] = "【考点】考查should表示应该/建议的用法\n【解题思路】括号内为listen（原形），根据句意「课堂上应该认真听老师讲」填入should，should + 动词原形\n【干扰项分析】注意不能写成should to listen（should后不加to），也不能用must（语气太强）\n【解题口诀】👉 should + 动词原形 = 应该做某事"
q81['core_trap'] = "学生可能写成should to listen，或选错情态动词"
q81['mnemonic'] = "should后面直接跟原形，不加to"

# --- 086: 去掉括号里的have to提示 ---
q86 = q_by_num['086']
q86['question'] = "I _____ (finish) my homework now because it's due tomorrow."
q86['answer'] = "have to finish"
q86['analysis'] = "【考点】考查have to表示客观必须的用法\n【解题思路】括号内为finish（原形），因为「明天要交」是客观原因，所以不得不做，填have to finish\n【干扰项分析】have to与must的区别：must是主观觉得必须，have to是客观情况要求\n【解题口诀】👉 have to = 客观情况逼我做，must = 我自己觉得必须做"
q86['core_trap'] = "学生可能只填have to而漏掉finish，或混淆have to和must"
q86['mnemonic'] = "有外部原因就用have to，自己想做的用must"

# ============================================================
# PART 2: P2 小问题修复
# ============================================================

# --- 015: this morning → yesterday morning ---
q15 = q_by_num['015']
q15['question'] = "They _____ (buy) some fresh vegetables in the market yesterday morning."
q15['analysis'] = "【考点】考查不规则动词buy的过去式\n【解题思路】yesterday morning明确表示过去时间，buy的过去式为bought\n【干扰项分析】buy是不规则动词，过去式为bought，不是buyed\n【解题口诀】👉 buy-bought-bought，买-买了-被买"

# --- 090: 标注为拓展难度0.7 ---
q90 = q_by_num['090']
q90['difficulty'] = 0.7
q90['analysis'] = "【考点】考查must have done表示对过去事情的肯定推测（拓展知识点）\n【解题思路】地面湿了说明昨晚一定下雨了。must have done对过去有把握的推测。注意：此用法超出常规初二课标，属于拓展提高\n【干扰项分析】A的can不能用于肯定推测；C的may have done表示可能（把握不大）；D的need不能用于推测\n【解题口诀】👉 must have done = 一定做过（对过去的肯定推测），有证据才用must"
q90['core_trap'] = "学生可能用may代替must（把握程度不同），或不知道must have done是拓展语法"
q90['mnemonic'] = "地面湿=下过雨的证据，有证据就用must have done"

# ============================================================
# PART 3: P1 - 替换15道模板题为高难度题(0.65-0.8)
# ============================================================

new_questions = {
    # 1. 替换003: 对话语境 + 多时态辨析 (0.65)
    "en_j2_grammar_003": {
        "id": "en_j2_grammar_003",
        "subject": "english",
        "grade": "junior2",
        "knowledge_tag": "一般过去时",
        "ability_tag": "时态辨析与语境理解",
        "type": "fill_blank",
        "question": "Tom: I _____ (lose) my key yesterday. I _____ (not can) open the door.\nJack: That's terrible! _____ you _____ (find) it now?",
        "answer": "lost; couldn't; Have; found",
        "analysis": "【考点】综合考查一般过去时与现在完成时在对话中的运用\n【解题思路】yesterday用过去时lost；过去不能做某事用couldn't（can的过去式）；now提示用现在完成时Have you found\n【干扰项分析】第一个空不能用losed（不规则变化）；第二个空用can't时态不一致；第三个空用Did不符合语境\n【解题口诀】👉 过去的事用过去时，问现在结果用现在完成时",
        "core_trap": "学生在对话中容易时态混乱，不会根据时间线索切换时态",
        "mnemonic": "yesterday过去时，now现在完成时，对话中注意时间词",
        "difficulty": 0.65
    },
    # 2. 替换007: while/when综合运用 (0.65)
    "en_j2_grammar_007": {
        "id": "en_j2_grammar_007",
        "subject": "english",
        "grade": "junior2",
        "knowledge_tag": "现在进行时 vs 过去进行时",
        "ability_tag": "while/when综合运用",
        "type": "multiple_choice",
        "question": "While I _____ my homework, my sister _____ a song in the next room. Suddenly, the power _____ out.",
        "answer": "C",
        "analysis": "【考点】综合考查while引导的过去进行时和suddenly引出的短暂动作\n【解题思路】while表示两个同时进行的动作，都用过去进行时（was doing, was singing）；suddenly引出短暂动作，用一般过去时（went out）\n【干扰项分析】A错在while后面用了一般过去时；B错在两个动词都用一般过去时；D错在suddenly后面用了进行时\n【解题口诀】👉 while前后长动作用进行时，suddenly短动作用一般时",
        "core_trap": "学生在有三个动词的复杂句中容易时态混乱",
        "mnemonic": "while等于同时长动作用进行时，suddenly等于突然短动作用一般时",
        "difficulty": 0.65,
        "options": [
            "A. did; sang; went",
            "B. did; sang; was going",
            "C. was doing; was singing; went",
            "D. was doing; was singing; was going"
        ]
    },
    # 3. 替换010: 被动语态 + 宾语从句 (0.7)
    "en_j2_grammar_010": {
        "id": "en_j2_grammar_010",
        "subject": "english",
        "grade": "junior2",
        "knowledge_tag": "被动语态",
        "ability_tag": "被动语态与宾语从句综合",
        "type": "multiple_choice",
        "question": "He asked me if the sports meeting _____ the next week.",
        "answer": "D",
        "analysis": "【考点】综合考查宾语从句时态+被动语态\n【解题思路】主句asked是过去时，从句也要过去时态；运动会是被举行的用被动；the next week对应过去将来时。综合：would be held\n【干扰项分析】A错在will hold是主动且时态不退格；B错在was held表示过去但the next week不是过去；C错在would hold是主动语态\n【解题口诀】👉 主句过去时从句退一步，运动会是被开的用被动",
        "core_trap": "学生容易只考虑宾语从句时态而忽略被动语态，或反过来",
        "mnemonic": "两步判断：先看时态退不退，再看主动还是被动",
        "difficulty": 0.7,
        "options": [
            "A. will hold",
            "B. was held",
            "C. would hold",
            "D. would be held"
        ]
    },
    # 4. 替换014: 复合否定词反意疑问句 (0.65)
    "en_j2_grammar_014": {
        "id": "en_j2_grammar_014",
        "subject": "english",
        "grade": "junior2",
        "knowledge_tag": "反意疑问句",
        "ability_tag": "复合否定词反意疑问句",
        "type": "multiple_choice",
        "question": "He has hardly finished his homework, _____?",
        "answer": "C",
        "analysis": "【考点】考查含否定副词hardly的反意疑问句\n【解题思路】hardly是半否定词（几乎不），前半句视为否定句，反意疑问句用肯定形式has he\n【干扰项分析】A和B错在前半句有否定词应后肯；D的does he与现在完成时have finished不搭配\n【解题口诀】👉 hardly/seldom/never/few/little/no是隐藏的否定词后肯",
        "core_trap": "学生容易忽略hardly是否定词而用hasn't he",
        "mnemonic": "hardly等于几乎不等于隐藏的not，有它就用肯定反问",
        "difficulty": 0.65,
        "options": [
            "A. hasn't he",
            "B. wasn't he",
            "C. has he",
            "D. does he"
        ]
    },
    # 5. 替换016: 条件从句 + 情态动词 (0.7)
    "en_j2_grammar_016": {
        "id": "en_j2_grammar_016",
        "subject": "english",
        "grade": "junior2",
        "knowledge_tag": "条件状语从句",
        "ability_tag": "主将从现+情态动词综合",
        "type": "multiple_choice",
        "question": "If you _____ harder, you _____ better grades next time.",
        "answer": "A",
        "analysis": "【考点】考查条件状语从句「主将从现」结合情态动词\n【解题思路】if从句用一般现在时表将来（study），主句用情态动词can表示可能性（can get）\n【干扰项分析】B错在从句用了过去时；C错在从句用了将来时（违反主将从现）；D错在从句用了进行时\n【解题口诀】👉 if从句现在时，主句可以用will/can/may/should",
        "core_trap": "学生只知道主句用will，不知道也可以用can/may/should等情态动词",
        "mnemonic": "if现在时，主句不只是will，can/may/should也可以",
        "difficulty": 0.7,
        "options": [
            "A. study; can get",
            "B. studied; could get",
            "C. will study; will get",
            "D. are studying; are getting"
        ]
    },
    # 6. 替换020: 现在完成时 vs 一般过去时对话 (0.7)
    "en_j2_grammar_020": {
        "id": "en_j2_grammar_020",
        "subject": "english",
        "grade": "junior2",
        "knowledge_tag": "现在完成时",
        "ability_tag": "完成时与过去时辨析",
        "type": "multiple_choice",
        "question": "- When _____ you _____ the book?\n- I _____ it last weekend. I _____ it for three days.",
        "answer": "D",
        "analysis": "【考点】综合考查一般过去时与现在完成时的区别\n【解题思路】When提问具体时间用一般过去时（did buy）；last weekend用过去时（bought）；for three days表示持续用现在完成时（have had）\n【干扰项分析】A错在When不能与现在完成时搭配；B错在have bought不能与last weekend搭配\n【解题口诀】👉 When用过去时，last用过去时，for用现在完成时",
        "core_trap": "学生在同一对话中频繁切换时态容易混乱",
        "mnemonic": "三个时间信号三种时态：When过去时，last过去时，for完成时",
        "difficulty": 0.7,
        "options": [
            "A. have; bought; bought; have bought",
            "B. have; bought; have bought; bought",
            "C. did; buy; have bought; bought",
            "D. did; buy; bought; have had"
        ]
    },
    # 7. 替换022: 将来时被动综合 (0.7)
    "en_j2_grammar_022": {
        "id": "en_j2_grammar_022",
        "subject": "english",
        "grade": "junior2",
        "knowledge_tag": "被动语态",
        "ability_tag": "多种时态被动综合辨析",
        "type": "multiple_choice",
        "question": "The problem _____ at the meeting tomorrow, and I believe it _____ well.",
        "answer": "A",
        "analysis": "【考点】综合考查将来时被动语态\n【解题思路】明天被讨论用will be discussed；将被很好地解决用will be solved。两个空都是将来时被动\n【干扰项分析】B错在用了主动语态；C错在第一空用了过去时被动；D错在第二空用了现在时被动\n【解题口诀】👉 明天的会议用将来时被动will be done",
        "core_trap": "学生在同一句中出现两个被动时容易漏掉一个be",
        "mnemonic": "两个被动都要有be：will be discussed AND will be solved",
        "difficulty": 0.7,
        "options": [
            "A. will be discussed; will be solved",
            "B. will discuss; will solve",
            "C. was discussed; will be solved",
            "D. will be discussed; is solved"
        ]
    },
    # 8. 替换034: 情态动词推测综合 (0.75)
    "en_j2_grammar_034": {
        "id": "en_j2_grammar_034",
        "subject": "english",
        "grade": "junior2",
        "knowledge_tag": "情态动词",
        "ability_tag": "情态动词推测综合运用",
        "type": "multiple_choice",
        "question": "- The man in the photo _____ be Mr. Li. He went to London last week.\n- You _____ be right. But it really looks like him.",
        "answer": "C",
        "analysis": "【考点】综合考查情态动词表示推测的用法\n【解题思路】有证据「他上周去伦敦了」说明不可能是李先生用can't；第二人表示不确定用may\n【干扰项分析】A的must表示一定（与去了伦敦矛盾）；B的must/may搭配语气不一致；D的can't/must搭配矛盾\n【解题口诀】👉 有反证用can't不可能，不确定用may可能",
        "core_trap": "学生容易混淆can't不可能和may not可能不的程度差异",
        "mnemonic": "can't等于有证据证明不可能，may等于没有证据不太确定",
        "difficulty": 0.75,
        "options": [
            "A. must; must",
            "B. must; may",
            "C. can't; may",
            "D. can't; must"
        ]
    },
    # 9. 替换041: 宾语从句 + 语序 (0.7)
    "en_j2_grammar_041": {
        "id": "en_j2_grammar_041",
        "subject": "english",
        "grade": "junior2",
        "knowledge_tag": "宾语从句",
        "ability_tag": "宾语从句语序与连接词综合",
        "type": "multiple_choice",
        "question": "Could you tell me _____?",
        "answer": "B",
        "analysis": "【考点】综合考查宾语从句的连接词和语序\n【解题思路】从句the train will leave缺时间状语用when；宾语从句用陈述语序（the train will leave）\n【干扰项分析】A错在用了what不能表示时间；C错在用了疑问语序will the train leave；D的how表示方式与leave不搭配\n【解题口诀】👉 宾语从句两步：选连接词（缺什么补什么）+ 陈述语序",
        "core_trap": "学生容易选出连接词但忘记改成陈述语序",
        "mnemonic": "先找缺什么再改语序，主语加谓语",
        "difficulty": 0.7,
        "options": [
            "A. what time will the train leave",
            "B. when the train will leave",
            "C. when will the train leave",
            "D. how the train will leave"
        ]
    },
    # 10. 替换045: 感叹句 + 条件 (0.65)
    "en_j2_grammar_045": {
        "id": "en_j2_grammar_045",
        "subject": "english",
        "grade": "junior2",
        "knowledge_tag": "感叹句",
        "ability_tag": "感叹句辨析与情态动词综合",
        "type": "multiple_choice",
        "question": "_____ heavily it is raining! We _____ stay at home.",
        "answer": "B",
        "analysis": "【考点】综合考查How引导感叹句 + had better用法\n【解题思路】heavily是副词修饰is raining用How + heavily；下大雨了最好待在家用had better stay\n【干扰项分析】A的What后面需接名词；C的should stay语气不如had better贴切；D的What a后面不能接副词\n【解题口诀】👉 副词用How，客观建议用had better",
        "core_trap": "学生容易因为raining而误选What（但heavily才是核心词）",
        "mnemonic": "感叹词后面紧跟什么词性：副词用How，名词用What",
        "difficulty": 0.65,
        "options": [
            "A. What; have to",
            "B. How; had better",
            "C. How; should",
            "D. What a; must"
        ]
    },
    # 11. 替换047: unless + 现在完成时 (0.7)
    "en_j2_grammar_047": {
        "id": "en_j2_grammar_047",
        "subject": "english",
        "grade": "junior2",
        "knowledge_tag": "条件状语从句",
        "ability_tag": "unless综合运用",
        "type": "multiple_choice",
        "question": "You won't learn English well _____ you practice it every day. I _____ (learn) English for three years and I know practice makes perfect.",
        "answer": "B",
        "analysis": "【考点】综合考查unless + 现在完成时\n【解题思路】unless等于if not，unless you practice等于如果你不练习；for three years用现在完成时have learned\n【干扰项分析】A的if语义不完整；C的because表示原因语义不通；D的when表示时间不够准确\n【解题口诀】👉 unless等于if not，for加时间段用现在完成时",
        "core_trap": "学生容易用if代替unless导致双重否定逻辑混乱",
        "mnemonic": "unless等于除非等于if not，比if更简洁地表达否定条件",
        "difficulty": 0.7,
        "options": [
            "A. if; have learned",
            "B. unless; have learned",
            "C. because; learned",
            "D. when; have learned"
        ]
    },
    # 12. 替换051: 感官动词被动 (0.75)
    "en_j2_grammar_051": {
        "id": "en_j2_grammar_051",
        "subject": "english",
        "grade": "junior2",
        "knowledge_tag": "被动语态",
        "ability_tag": "感官动词被动语态",
        "type": "multiple_choice",
        "question": "Which sentence has the same meaning as 'Someone saw him steal the car.'?",
        "answer": "A",
        "analysis": "【考点】考查感官动词的被动语态\n【解题思路】主动：Someone saw him steal（感官动词后面跟不带to的不定式）。被动：He was seen to steal（被动语态要还原to）\n【干扰项分析】B错在漏掉to；C错在用stealing现在分词而非不定式；D错在用过去分词stolen\n【解题口诀】👉 感官动词(see/hear/watch)被动要加to：be seen to do",
        "core_trap": "学生最常犯的错误是被动语态忘记还原to",
        "mnemonic": "主动不加to，被动要加to：see him do变成he is seen to do",
        "difficulty": 0.75,
        "options": [
            "A. He was seen to steal the car.",
            "B. He was seen steal the car.",
            "C. He was seen stealing the car.",
            "D. He was seen stolen the car."
        ]
    },
    # 13. 替换069: 现在完成时被动 + 一般现在时被动 (0.7)
    "en_j2_grammar_069": {
        "id": "en_j2_grammar_069",
        "subject": "english",
        "grade": "junior2",
        "knowledge_tag": "被动语态",
        "ability_tag": "现在完成时被动语态",
        "type": "multiple_choice",
        "question": "This old building _____ a hospital since 1990. Many patients _____ here every year.",
        "answer": "C",
        "analysis": "【考点】综合考查现在完成时被动和一般现在时被动\n【解题思路】since 1990用现在完成时被动has been used；every year用一般现在时被动are treated\n【干扰项分析】A错在第一空用了主动语态；B错在第二空用了过去时；D错在第二空用了主动语态\n【解题口诀】👉 since用现在完成时被动，every year用一般现在时被动",
        "core_trap": "学生在同一句中需要判断两个不同时态的被动容易出错",
        "mnemonic": "since等于现在完成时被动have been done，every year等于一般现在时被动are done",
        "difficulty": 0.7,
        "options": [
            "A. has used; are treated",
            "B. has been used; were treated",
            "C. has been used; are treated",
            "D. has been used; treat"
        ]
    },
    # 14. 替换076: 情态动词语境综合辨析 (0.75)
    "en_j2_grammar_076": {
        "id": "en_j2_grammar_076",
        "subject": "english",
        "grade": "junior2",
        "knowledge_tag": "情态动词",
        "ability_tag": "情态动词语境综合辨析",
        "type": "multiple_choice",
        "question": "- _____ I borrow your dictionary?\n- Of course you _____. But you _____ return it by Friday.",
        "answer": "D",
        "analysis": "【考点】综合考查情态动词在对话中的运用\n【解题思路】请求许可用May I；允许对方用can；表示义务必须在周五前归还用must\n【干扰项分析】A的Must/Mustn't搭配语义错误；B的Can/Need搭配不自然；C的Must/Can搭配第一个语气太强\n【解题口诀】👉 请求用May，允许用can，义务用must",
        "core_trap": "学生在三个空中分别选对不同的情态动词",
        "mnemonic": "借东西：May I...? Of course you can. But you must return it.",
        "difficulty": 0.75,
        "options": [
            "A. Must; mustn't; may",
            "B. Can; need; should",
            "C. Must; can; should",
            "D. May; can; must"
        ]
    },
    # 15. 替换088: 多时态语篇综合 (0.8)
    "en_j2_grammar_088": {
        "id": "en_j2_grammar_088",
        "subject": "english",
        "grade": "junior2",
        "knowledge_tag": "综合运用",
        "ability_tag": "多时态语篇综合运用",
        "type": "fill_blank",
        "question": "Last Sunday, while I _____ (read) a book, my friend Tom _____ (call) me. He said he _____ (lose) his bike and asked if I _____ (can) help him find it. I _____ (not see) him since then.",
        "answer": "was reading; called; had lost; could; haven't seen",
        "analysis": "【考点】综合考查过去进行时、一般过去时、过去完成时、情态动词过去式、现在完成时\n【解题思路】while引导长动作用过去进行时was reading；突然打断用一般过去时called；丢自行车发生在打电话之前用过去完成时had lost；主句said是过去时can变could；since then用现在完成时haven't seen\n【干扰项分析】注意五个空需要五种不同时态，这是本题最大的难度\n【解题口诀】👉 时间线判断：while进行时，打断一般时，更早完成时，过去主句情态退格，since现在完成时",
        "core_trap": "学生最常错的是第三个空不知道用过去完成时had lost表示过去的过去",
        "mnemonic": "语篇时态像时间线：正在读朋友打来之前丢了车能不能帮到现在没见",
        "difficulty": 0.8
    },
}

# Apply replacements
for i, q in enumerate(data):
    if q['id'] in new_questions:
        data[i] = new_questions[q['id']]
        print(f"Replaced: {q['id']}")

# ============================================================
# PART 4: P1 - 调整B选项占比（交换A/B选项，B→A）
# ============================================================

b_answer_swap_ids = ['004', '006', '018', '021', '023', '026', '027', '031', '033', '039', '043', '062', '063', '071', '079']

for num in b_answer_swap_ids:
    q = q_by_num.get(num)
    if q and q.get('answer') == 'B' and q.get('type') == 'multiple_choice':
        opts = q['options']
        opts[0], opts[1] = opts[1], opts[0]
        q['answer'] = 'A'
        print(f"Swapped A/B: {q['id']} (B->A)")

# ============================================================
# SAVE
# ============================================================

with open('src/data/questions_en_j2_grammar.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"\nDone! Total: {len(data)} questions")

# Verify
answers_count = {}
for q in data:
    if q['type'] == 'multiple_choice':
        answers_count[q['answer']] = answers_count.get(q['answer'], 0) + 1

total_mc = sum(answers_count.values())
print(f"MC answers: {answers_count}")
print(f"Total MC: {total_mc}")
print(f"B ratio: {answers_count.get('B', 0)}/{total_mc} = {answers_count.get('B', 0)/total_mc*100:.1f}%")

diffs_count = {'basic': 0, 'intermediate': 0, 'advanced': 0}
for q in data:
    d = q['difficulty']
    if d < 0.45:
        diffs_count['basic'] += 1
    elif d <= 0.6:
        diffs_count['intermediate'] += 1
    else:
        diffs_count['advanced'] += 1
print(f"Difficulty: {diffs_count}")

# Validate JSON
try:
    json.loads(json.dumps(data))
    print("JSON validation: OK")
except Exception as e:
    print(f"JSON validation: FAILED - {e}")
