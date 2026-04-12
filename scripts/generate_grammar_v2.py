#!/usr/bin/env python3
"""Generate 120 Junior 2 English Grammar Questions"""
import json

Q = []

def q(id, kt, at, typ, question, options, answer, analysis, core_trap, mnemonic, difficulty):
    entry = {
        "id": id, "subject": "english", "grade": "junior2",
        "knowledge_tag": kt, "ability_tag": at, "type": typ,
        "question": question, "answer": answer,
        "analysis": analysis, "core_trap": core_trap,
        "mnemonic": mnemonic, "difficulty": difficulty
    }
    if options is not None:
        entry["options"] = options
    Q.append(entry)

# ===== 1. 一般过去时 (20题) =====
q("en_j2_grammar_001","一般过去时","动词时态辨析","multiple_choice",
  "I _____ to school yesterday because I was sick.",
  ["A. don't go","B. didn't go","C. won't go","D. am not going"],"B",
  "【考点】考查一般过去时的否定形式\n【解题思路】时间状语yesterday明确表示过去的时间，主语I是第一人称，用didn't + 动词原形构成否定\n【干扰项分析】A错在用了一般现在时，与yesterday时间不匹配；C错在用了将来时，属于时态错误；D错在用了现在进行时，属于时态错误\n【解题口诀】👉 见yesterday就找过去时，否定用didn't加原形",
  "学生容易用don't代替didn't，忘记过去时的否定形式","见yesterday想过去，否定didn't加原形",0.3)

q("en_j2_grammar_002","一般过去时","不规则动词变化","multiple_choice",
  "She _____ a beautiful song at the party last night.",
  ["A. sing","B. sings","C. sang","D. singed"],"C",
  "【考点】考查不规则动词sing的过去式\n【解题思路】last night是过去时间标志，sing是不规则动词，过去式为sang（不是加-ed）\n【干扰项分析】A错在用了动词原形，没有体现过去时；B错在用了一般现在时第三人称单数；D错在把sing当作规则动词加了-ed，sing是不规则动词\n【解题口诀】👉 sing的过去式sang，bring的过去式brought，不是加-ed的",
  "学生容易将不规则动词sing误加-ed变成singed","sing-sang-sung，唱-唱了-被唱",0.35)

q("en_j2_grammar_003","一般过去时","规则动词-ed变化","multiple_choice",
  "They _____ football after school yesterday afternoon.",
  ["A. play","B. played","C. playing","D. plays"],"B",
  "【考点】考查规则动词play的过去式\n【解题思路】yesterday afternoon表示过去时间，play是规则动词，直接加-ed变成played\n【干扰项分析】A错在用了动词原形；C错在用了现在分词形式；D错在用了一般现在时第三人称单数\n【解题口诀】👉 一般动词直接加-ed，play-played",
  "学生容易忽略yesterday afternoon的时间标志而用现在时","时间词有yesterday/last/ago，动词就加-ed或变不规则",0.3)

q("en_j2_grammar_004","一般过去时","规则动词-ed变化（双写）","multiple_choice",
  "He _____ the kite in the park last Sunday.",
  ["A. stoped to fly","B. stopped flying","C. stoped flying","D. stopped to fly"],"B",
  "【考点】考查stop的过去式（双写末尾辅音字母加-ed）以及stop doing用法\n【解题思路】stop是重读闭音节结尾，双写p加-ed为stopped；stop doing sth.表示停止正在做的事\n【干扰项分析】A错在stoped拼写错误（应双写p），且stop to do表示停下来去做另一件事，不符合语义；C错在stoped拼写错误；D错在stopped to fly语义为「停下来去放风筝」，与语境不符\n【解题口诀】👉 重读闭音节双写末字母加-ed，stop-stopped",
  "学生容易忘记双写末尾辅音字母，写成stoped","一辅一元一辅，双写末字母加-ed",0.4)

q("en_j2_grammar_005","一般过去时","不规则动词变化","fill_blank",
  "We _____ (go) to the museum last weekend.",
  None,"went",
  "【考点】考查不规则动词go的过去式\n【解题思路】last weekend是过去时间标志，go的过去式为went（不规则变化）\n【干扰项分析】注意go是不规则动词，过去式为went，不是goed\n【解题口诀】👉 go的过去式是went，不是goed",
  "学生容易错误地将go加-ed变成goed","go-went-gone，去-去了-去过",0.3)

q("en_j2_grammar_006","一般过去时","时间状语识别","multiple_choice",
  "— _____ you watch TV last night?\n— Yes, I _____.",
  ["A. Do; do","B. Did; did","C. Were; were","D. Are; am"],"B",
  "【考点】考查一般过去时的一般疑问句及简略回答\n【解题思路】last night表明过去时间，一般过去时的疑问句用Did开头，肯定回答用Yes, I did.\n【干扰项分析】A错在用了一般现在时；C错在用了be动词的过去式were，watch是实义动词应用Did；D错在用了一般现在时be动词\n【解题口诀】👉 过去时的疑问句：Did + 主语 + 动词原形",
  "学生容易混淆实义动词和be动词的过去时疑问句形式","实义动词用Did提问，be动词用Was/Were提问",0.35)

q("en_j2_grammar_007","一般过去时","不规则动词变化","multiple_choice",
  "She _____ me a present on my birthday last year.",
  ["A. give","B. gives","C. gived","D. gave"],"D",
  "【考点】考查不规则动词give的过去式\n【解题思路】last year是过去时间标志，give的过去式为gave\n【干扰项分析】A错在用了动词原形；B错在用了一般现在时第三人称单数；C错在把give当规则动词加了-ed，give是不规则动词\n【解题口诀】👉 give的过去式是gave，不是gived",
  "学生容易将不规则动词give误加-ed","give-gave-given，给-给了-被给",0.3)

q("en_j2_grammar_008","一般过去时","过去时的疑问句","fill_blank",
  "_____ they _____ (visit) the Great Wall last summer?",
  None,"Did; visit",
  "【考点】考查一般过去时一般疑问句的构成\n【解题思路】last summer是过去时间，一般疑问句用Did开头，后面跟动词原形\n【干扰项分析】注意Did后面用动词原形visit，不是visited\n【解题口诀】👉 过去时疑问句：Did + 主语 + 动词原形？",
  "学生容易在Did后面用visited而不是动词原形visit","Did后面永远跟原形，时态已经由Did体现",0.35)

q("en_j2_grammar_009","一般过去时","不规则动词变化","multiple_choice",
  "Tom _____ his homework two hours ago.",
  ["A. finish","B. finishes","C. finished","D. finishs"],"C",
  "【考点】考查规则动词finish的过去式\n【解题思路】two hours ago表示过去时间，finish是规则动词，直接加-ed\n【干扰项分析】A错在用了动词原形；B错在用了一般现在时第三人称单数；D错在finishs拼写错误，sh结尾的动词在现在时加-es，但过去时统一加-ed\n【解题口诀】👉 ago标志过去时，常规动词加-ed",
  "学生可能将finish错误地加-s变成finishs","以sh/ch/x/s结尾现在时加-es，但过去时统一加-ed",0.3)

q("en_j2_grammar_010","一般过去时","不规则动词变化","multiple_choice",
  "My mother _____ a delicious cake for me yesterday.",
  ["A. make","B. maked","C. made","D. makes"],"C",
  "【考点】考查不规则动词make的过去式\n【解题思路】yesterday是过去时间标志，make的过去式为made\n【干扰项分析】A错在用了动词原形；B错在把make当规则动词加了-ed；D错在用了一般现在时\n【解题口诀】👉 make-made，不是maked",
  "学生容易将make误加-ed变成maked","make-made-made，做-做了-被做（过去式和过去分词同形）",0.3)

q("en_j2_grammar_011","一般过去时","be动词过去式","multiple_choice",
  "There _____ a lot of people in the park yesterday.",
  ["A. is","B. are","C. was","D. were"],"D",
  "【考点】考查There be句型的过去式\n【解题思路】There be句型中，be动词与后面的主语保持一致。a lot of people是复数，所以用were。yesterday表明过去时\n【干扰项分析】A错在用了一般现在时单数；B错在用了一般现在时复数；C错在用了过去时单数，但people是复数主语\n【解题口诀】👉 There be看主语，过去时用was/were，单数was复数were",
  "学生容易忽略people是复数而误用was","people/police/cattle看起来像单数其实是复数",0.35)

q("en_j2_grammar_012","一般过去时","过去时否定句","fill_blank",
  "He _____ (not do) his homework last night.",
  None,"didn't do",
  "【考点】考查一般过去时的否定形式\n【解题思路】实义动词的过去时否定形式：didn't + 动词原形\n【干扰项分析】注意不是didn't did也不是didn't done\n【解题口诀】👉 过去否定didn't加原形，不要写didn't did或didn't done",
  "学生容易在didn't后面用did或done而不是do","didn't后面动词打回原形——do, not did, not done",0.35)

q("en_j2_grammar_013","一般过去时","不规则动词变化","multiple_choice",
  "The boy _____ off his bike and hurt his leg last Monday.",
  ["A. fall","B. fell","C. falled","D. felt"],"B",
  "【考点】考查不规则动词fall的过去式\n【解题思路】last Monday是过去时间标志，fall的过去式为fell\n【干扰项分析】A错在用了动词原形；C错在把fall当规则动词加了-ed；D是feel（感觉）的过去式felt，意思完全不同\n【解题口诀】👉 fall-fell-fallen，跌倒-跌倒了-跌倒过",
  "学生容易混淆fall的过去式fell和feel的过去式felt","fall(跌倒)-fell，feel(感觉)-felt，一个l一个l的差别",0.4)

q("en_j2_grammar_014","一般过去时","不规则动词变化","multiple_choice",
  "She _____ a story to her little brother before bedtime yesterday.",
  ["A. tell","B. tells","C. telled","D. told"],"D",
  "【考点】考查不规则动词tell的过去式\n【解题思路】yesterday是过去时间标志，tell的过去式为told\n【干扰项分析】A错在用了动词原形；B错在用了一般现在时第三人称单数；C错在把tell当规则动词加了-ed\n【解题口诀】👉 tell-told-told，告诉-告诉了-被告诉",
  "学生容易将tell误加-ed变成telled","tell-told，sell-sold，send-sent，都有不规则变化",0.3)

q("en_j2_grammar_015","一般过去时","不规则动词变化","fill_blank",
  "They _____ (buy) some fresh vegetables in the market this morning.",
  None,"bought",
  "【考点】考查不规则动词buy的过去式\n【解题思路】this morning已过，表示过去时间，buy的过去式为bought\n【干扰项分析】buy是不规则动词，过去式为bought，不是buyed\n【解题口诀】👉 buy-bought-bought，买-买了-被买",
  "学生容易将buy误加-ed变成buyed","buy-bought，bring-brought，ought结尾是过去",0.35)

q("en_j2_grammar_016","一般过去时","不规则动词变化","multiple_choice",
  "We _____ a wonderful time at the summer camp last year.",
  ["A. have","B. has","C. haved","D. had"],"D",
  "【考点】考查不规则动词have的过去式\n【解题思路】last year是过去时间标志，have的过去式为had\n【干扰项分析】A错在用了一般现在时；B错在用了一般现在时第三人称单数；C错在把have当规则动词加了-ed\n【解题口诀】👉 have-had-had，有-有了-有过",
  "学生容易将have误加-ed变成haved","have/has统一变had，have的过去式和过去分词都是had",0.3)

q("en_j2_grammar_017","一般过去时","过去时的特殊疑问句","multiple_choice",
  "— _____ did you go last weekend?\n— I went to Beijing.",
  ["A. What","B. When","C. Where","D. How"],"C",
  "【考点】考查一般过去时的特殊疑问句\n【解题思路】回答是I went to Beijing（地点），所以问的是去哪里，用Where提问\n【干扰项分析】A问「什么」与回答不匹配；B问「什么时候」与回答不匹配；D问「怎么去」与回答不匹配\n【解题口诀】👉 看回答选疑问词：回答地点用Where，回答时间用When，回答方式用How",
  "学生容易不看回答内容而随意选择疑问词","疑问词看答语，地点Where时间When方式How",0.3)

q("en_j2_grammar_018","一般过去时","不规则动词变化","multiple_choice",
  "He _____ very early and _____ breakfast at 7:00 yesterday.",
  ["A. get up; have","B. got up; had","C. gets up; has","D. got up; have"],"B",
  "【考点】考查两个并列动词的过去时形式\n【解题思路】yesterday表明两个动作都发生在过去，get up过去式got up，have过去式had\n【干扰项分析】A错在两个动词都用原形；C错在两个动词都用现在时；D前一个用了过去式但后一个用原形，时态不一致\n【解题口诀】👉 同一时间状语下，并列动词时态一致",
  "学生在并列谓语中容易时态不一致","一个yesterday，所有动词都变过去",0.35)

q("en_j2_grammar_019","一般过去时","规则动词-ed变化（去e加ed）","fill_blank",
  "She _____ (live) in Shanghai two years ago.",
  None,"lived",
  "【考点】考查以e结尾的动词过去式\n【解题思路】live以e结尾，直接加-d变成lived。two years ago是过去时间\n【干扰项分析】注意不是livedd（多加一个d）\n【解题口诀】👉 以e结尾的动词只加-d：live-lived，like-liked",
  "学生可能写成livedd（多加一个d）","已经有e了，只需加d就够了",0.3)

q("en_j2_grammar_020","一般过去时","不规则动词综合","multiple_choice",
  "She _____ a cold last week, so she _____ at home.",
  ["A. has; stayed","B. had; stayed","C. has; stay","D. had; stay"],"B",
  "【考点】考查have的过去式had和stay的过去式stayed\n【解题思路】last week表明过去时间，have a cold过去式为had a cold，stay的过去式为stayed\n【干扰项分析】A前一个动词用了现在时；C两个动词都用了现在时形式；D后一个动词用了原形\n【解题口诀】👉 have-had，stay-stayed，last week全用过去",
  "学生在so后面的从句中容易忘记用过去时","so连接的前后两个分句，时态要一致",0.35)

# ===== 2. 一般将来时 will/be going to (15题) =====
q("en_j2_grammar_021","一般将来时","will的用法","multiple_choice",
  "I think it _____ rain tomorrow.",
  ["A. is","B. will","C. was","D. does"],"B",
  "【考点】考查will + 动词原形表示一般将来时\n【解题思路】tomorrow是将来时间标志，I think后面的从句用will + rain表示将来\n【干扰项分析】A错在用了一般现在时；C错在用了一般过去时；D错在用了一般现在时助动词\n【解题口诀】👉 见tomorrow就找will，will后面永远跟原形",
  "学生容易在will后面用rains而不是rain","will是将来时标志，后面动词穿原形",0.3)

q("en_j2_grammar_022","一般将来时","be going to的用法","multiple_choice",
  "We _____ going to have a picnic this weekend.",
  ["A. is","B. are","C. was","D. were"],"B",
  "【考点】考查be going to结构中be动词的人称变化\n【解题思路】主语We是第一人称复数，be going to中用are。this weekend是将来时间\n【干扰项分析】A错在用了单数is；C错在用了过去时was；D错在用了过去时were\n【解题口诀】👉 be going to看主语：I用am，you/we/they用are，he/she/it用is",
  "学生在be going to中容易用错be动词形式","be going to的be和主语看现在时一致：I am, you are, he is",0.3)

q("en_j2_grammar_023","一般将来时","will vs be going to辨析","multiple_choice",
  "Look at the dark clouds! It _____ rain soon.",
  ["A. will","B. is going to","C. shall","D. would"],"B",
  "【考点】考查will与be going to的区别\n【解题思路】有明显迹象（乌云）表明即将发生的事，用be going to表示「根据迹象预测即将发生」\n【干扰项分析】A的will表示一般性的将来预测，没有「根据现有迹象」的意味；C的shall多用于第一人称的征求意见；D的would是过去将来时\n【解题口诀】👉 有证据迹象用be going to，无证据预测用will",
  "学生容易混淆will和be going to的使用场景","Look! Listen! Hurry!后面跟be going to——有迹象才确定",0.5)

q("en_j2_grammar_024","一般将来时","will的否定句","fill_blank",
  "She _____ (not come) to the party tomorrow because she is busy.",
  None,"won't come",
  "【考点】考查will的否定形式\n【解题思路】will的否定形式是won't（will not的缩写），后面跟动词原形\n【干扰项分析】注意不是will not coming也不是doesn't come\n【解题口诀】👉 will not = won't，后面动词用原形",
  "学生可能写成will not coming或doesn't come","won't = will not，后面永远原形",0.35)

q("en_j2_grammar_025","一般将来时","will的一般疑问句","multiple_choice",
  "— _____ you go to the movies with us tonight?\n— Yes, I'd love to.",
  ["A. Do","B. Are","C. Will","D. Did"],"C",
  "【考点】考查will引导的一般疑问句\n【解题思路】tonight是将来时间，用Will you...? 提问将来动作\n【干扰项分析】A的Do用于一般现在时；B的Are用于现在进行时或be going to结构；D的Did用于一般过去时\n【解题口诀】👉 今晚/明天/下周用Will提问",
  "学生可能用Are you go（be动词和实义动词同时使用）","将来时间提问，Will you...? 最简单",0.35)

q("en_j2_grammar_026","一般将来时","be going to的否定句","multiple_choice",
  "They _____ going to play basketball this afternoon.",
  ["A. isn't","B. aren't","C. don't","D. won't"],"B",
  "【考点】考查be going to的否定形式\n【解题思路】They对应are，否定形式在be动词后加not，即aren't going to\n【干扰项分析】A错在isn't与They不搭配；C错在don't不能否定be going to结构；D的won't属于will的否定，不是be going to的否定\n【解题口诀】👉 be going to否定就在be后加not：isn't/aren't/wasn't/weren't going to",
  "学生可能用don't代替aren't来否定be going to","be going to的否定否定be动词，不是否定going",0.4)

q("en_j2_grammar_027","一般将来时","will vs be going to辨析","multiple_choice",
  "— I'm going to visit my grandma this Sunday.\n— Oh, really? I _____ go with you.",
  ["A. am","B. will","C. was","D. do"],"B",
  "【考点】考查will表示临时决定/意愿\n【解题思路】对方提到要去看奶奶，「我」临时决定一起去，用will表示临时做出的决定或意愿\n【干扰项分析】A的am需要搭配going to或现在分词；C的was是过去时；D的do是一般现在时\n【解题口诀】👉 临时决定、当场表态用will，已经计划好用be going to",
  "学生在临时决定时也容易用be going to","刚想到就用will，早就计划好就用be going to",0.5)

q("en_j2_grammar_028","一般将来时","will的用法","fill_blank",
  "There _____ (be) a school meeting next Monday.",
  None,"will be",
  "【考点】考查There be句型的将来时\n【解题思路】There be句型的将来时用There will be。next Monday是将来时间\n【干扰项分析】注意不能用There will have，There be永远用be\n【解题口诀】👉 There be的将来时：There will be，不能用There will have",
  "学生容易写成There will have，混淆be和have","There be永远用be，将来时就是There will be",0.4)

q("en_j2_grammar_029","一般将来时","will的用法","multiple_choice",
  "If you study hard, you _____ good grades.",
  ["A. get","B. got","C. will get","D. are getting"],"C",
  "【考点】考查if引导的条件状语从句中「主将从现」\n【解题思路】主句用一般将来时（will get），if从句用一般现在时（study hard）表将来\n【干扰项分析】A错在主句也用了现在时，应使用将来时；B错在用了一般过去时；D错在用了现在进行时\n【解题口诀】👉 主将从现：主句将来时，if从句现在时",
  "学生容易在主句也用现在时，或者从句也用将来时","if从句用现在时代替将来，主句照常用will",0.5)

q("en_j2_grammar_030","一般将来时","will的用法","multiple_choice",
  "I _____ you as soon as I arrive in Beijing.",
  ["A. call","B. called","C. will call","D. calling"],"C",
  "【考点】考查as soon as引导的时间状语从句中「主将从现」\n【解题思路】主句用一般将来时（will call），as soon as从句用一般现在时（arrive）表将来\n【干扰项分析】A错在主句也用了现在时；B错在用了一般过去时；D错在用了现在分词\n【解题口诀】👉 as soon as/when/before/after + 现在时，主句用将来时",
  "学生容易在as soon as后面也用will","时间条件从句用现在时表将来，will只在主句",0.5)

q("en_j2_grammar_031","一般将来时","will vs be going to辨析","multiple_choice",
  "We have planned to go hiking next week. We _____ go to the mountains.",
  ["A. will","B. are going to","C. shall","D. would"],"B",
  "【考点】考查be going to表示已计划的将来动作\n【解题思路】We have planned明确说明已经计划好了，用be going to表示经过计划打算做的事\n【干扰项分析】A的will表示临时决定或预测，不适合已计划的事；C的shall较少用于这种语境；D的would是过去将来时\n【解题口诀】👉 have planned/have decided后接be going to",
  "学生在有明确计划时仍容易用will","计划好的用be going to，没计划的用will",0.45)

q("en_j2_grammar_032","一般将来时","be going to的疑问句","fill_blank",
  "_____ she _____ (go) shopping this afternoon?",
  None,"Is; going to go",
  "【考点】考查be going to的一般疑问句\n【解题思路】She是第三人称单数，be动词用Is，be going to的疑问句把be提前\n【干扰项分析】注意不能写成Will she going to go（will和going to不能混用）\n【解题口诀】👉 be going to疑问句：Be动词提前",
  "学生可能写成Will she going to go（will和going to混用）","be going to提问就像be动词提问一样，把be提前",0.4)

q("en_j2_grammar_033","一般将来时","will的用法","multiple_choice",
  "The exam _____ next month, so we need to review our lessons.",
  ["A. will hold","B. will be held","C. is held","D. was held"],"B",
  "【考点】考查一般将来时的被动语态\n【解题思路】考试是被举行的，用被动语态。将来时被动：will be + 过去分词\n【干扰项分析】A错在用了主动语态，考试不能自己举行；C错在用了现在时被动；D错在用了过去时被动\n【解题口诀】👉 将来被动：will be done",
  "学生容易忽略被动语态而用主动形式","事件被举行、会议被召开都用被动语态",0.55)

q("en_j2_grammar_034","一般将来时","will的用法","multiple_choice",
  "I _____ thirteen years old next year.",
  ["A. am","B. was","C. will be","D. have been"],"C",
  "【考点】考查be动词的将来时\n【解题思路】next year是将来时间，用will be表示将来状态\n【干扰项分析】A错在用了一般现在时；B错在用了一般过去时；D错在用了现在完成时\n【解题口诀】👉 next year/tomorrow/soon用will be",
  "学生容易忽略next year的将来时含义","年龄变化用将来时：I will be 13 next year",0.3)

q("en_j2_grammar_035","一般将来时","be going to的用法","multiple_choice",
  "He is not going to _____ any homework tonight.",
  ["A. do","B. does","C. did","D. doing"],"A",
  "【考点】考查be going to后面动词的形式\n【解题思路】be going to后面跟动词原形\n【干扰项分析】B错在用了第三人称单数；C错在用了过去式；D错在用了现在分词\n【解题口诀】👉 be going to + 动词原形，就像will一样",
  "学生可能在be going to后面用doing","going是助动词的一部分，后面的动词用原形",0.35)

# ===== 3. 现在进行时 vs 过去进行时 (10题) =====
q("en_j2_grammar_036","现在进行时 vs 过去进行时","过去进行时结构","multiple_choice",
  "I _____ my homework at 8:00 last night.",
  ["A. do","B. did","C. was doing","D. am doing"],"C",
  "【考点】考查过去进行时的构成\n【解题思路】at 8:00 last night表示过去某一具体时刻正在做某事，用过去进行时：was/were + doing\n【干扰项分析】A错在用了一般现在时；B错在用了一般过去时，不能表示「正在做」；D错在用了现在进行时\n【解题口诀】👉 at + 过去具体时刻 + was/were doing",
  "学生容易用一般过去时did代替过去进行时was doing","具体时刻+过去就用过去进行时：was/were + doing",0.35)

q("en_j2_grammar_037","现在进行时 vs 过去进行时","过去进行时结构","multiple_choice",
  "They _____ a football game when it started to rain.",
  ["A. watch","B. watched","C. were watching","D. are watching"],"C",
  "【考点】考查when引导的时间状语从句中过去进行时的用法\n【解题思路】when表示「正在做某事时突然……」，主句用过去进行时，when从句用一般过去时\n【干扰项分析】A错在用了一般现在时；B错在用了一般过去时，不能表示「正在看」；D错在用了现在进行时\n【解题口诀】👉 主句进行时 + when + 一般过去时（表示正在进行时被打断）",
  "学生容易混淆when前后两句的时态","when前面用进行时（正在做），when后面用一般时（突然发生）",0.5)

q("en_j2_grammar_038","现在进行时 vs 过去进行时","现在进行时结构","fill_blank",
  "Look! The children _____ (play) in the playground.",
  None,"are playing",
  "【考点】考查现在进行时的构成\n【解题思路】Look!是现在进行时的标志词，The children是复数，用are playing\n【干扰项分析】注意不能用are play（漏掉-ing）\n【解题口诀】👉 Look!/Listen!后面跟现在进行时：be + doing",
  "学生可能用are play而漏掉-ing","Look! Listen! = 正在进行，be + 动词ing",0.3)

q("en_j2_grammar_039","现在进行时 vs 过去进行时","过去进行时否定句","multiple_choice",
  "She _____ TV at that time yesterday evening.",
  ["A. isn't watching","B. wasn't watching","C. doesn't watch","D. didn't watch"],"B",
  "【考点】考查过去进行时的否定形式\n【解题思路】at that time yesterday evening表示过去某个时刻，用过去进行时否定：wasn't + doing\n【干扰项分析】A错在用了现在进行时否定；C错在用了一般现在时否定；D错在用了一般过去时否定\n【解题口诀】👉 过去进行时否定：wasn't/weren't + doing",
  "学生容易用didn't watch来表示过去不在做某事","强调「那个时候不在做」用wasn't doing，不是didn't do",0.45)

q("en_j2_grammar_040","现在进行时 vs 过去进行时","while引导的过去进行时","multiple_choice",
  "While I _____ dinner, my mother came back home.",
  ["A. cook","B. cooked","C. was cooking","D. am cooking"],"C",
  "【考点】考查while引导的时间状语从句\n【解题思路】while表示「在……期间」，从句用过去进行时，主句用一般过去时\n【干扰项分析】A错在用了一般现在时；B错在用了一般过去时；D错在用了现在进行时\n【解题口诀】👉 while + 过去进行时，主句 + 一般过去时",
  "学生容易混淆while和when的用法区别","while像while一样长用进行时；when像when一样短用一般时",0.5)

q("en_j2_grammar_041","现在进行时 vs 过去进行时","现在进行时用法","multiple_choice",
  "— Where is your father?\n— He _____ in the garden.",
  ["A. works","B. worked","C. is working","D. was working"],"C",
  "【考点】考查现在进行时表示此刻正在做某事\n【解题思路】问「爸爸在哪里」，回答此刻正在花园工作，用现在进行时\n【干扰项分析】A错在用了一般现在时，表示经常性动作；B错在用了一般过去时；D错在用了过去进行时\n【解题口诀】👉 问Where is...? 回答用现在进行时",
  "学生容易用一般现在时works来回答","问「在哪儿」就是在问「正在做什么」用现在进行时",0.3)

q("en_j2_grammar_042","现在进行时 vs 过去进行时","过去进行时疑问句","fill_blank",
  "_____ you _____ (study) English at 9:00 last night?",
  None,"Were; studying",
  "【考点】考查过去进行时的一般疑问句\n【解题思路】主语you用Were，过去进行时疑问句把was/were提前\n【干扰项分析】注意不能写成Did you studying\n【解题口诀】👉 过去进行时疑问：Was/Were + 主语 + doing?",
  "学生可能写成Did you studying","过去进行时提问就像be动词过去时提问，把was/were提前",0.4)

q("en_j2_grammar_043","现在进行时 vs 过去进行时","while与when辨析","multiple_choice",
  "_____ the teacher came in, the students were talking loudly.",
  ["A. While","B. When","C. Because","D. So"],"B",
  "【考点】考查when与while的区别\n【解题思路】when从句用一般过去时（came），主句用过去进行时（were talking），表示「当老师进来的时候，学生们正在大声说话」\n【干扰项分析】A的while后面通常接进行时，这里came是一般过去时；C的because表示原因，语义不通；D的so表示结果，语义不通\n【解题口诀】👉 when + 一般过去时，while + 过去进行时",
  "学生在when后面容易用进行时","when像开关——短促的一瞬间；while像走廊——持续的期间",0.5)

q("en_j2_grammar_044","现在进行时 vs 过去进行时","双过去进行时","multiple_choice",
  "While my father _____ newspapers, my mother _____ cooking.",
  ["A. was reading; was","B. read; was","C. was reading; is","D. read; is"],"A",
  "【考点】考查while引导的两个同时进行的过去动作\n【解题思路】while连接两个同时进行的过去动作，都用过去进行时\n【干扰项分析】B错在第一个动词用了一般过去时；C错在第二个动词用了现在时；D两个动词时态都不对\n【解题口诀】👉 while连接两个长动作，都用过去进行时",
  "学生在while后面的从句容易用一般过去时","while前后都是长动作就用进行时",0.5)

q("en_j2_grammar_045","现在进行时 vs 过去进行时","现在进行时标志词","multiple_choice",
  "Be quiet! The baby _____ now.",
  ["A. sleeps","B. slept","C. is sleeping","D. was sleeping"],"C",
  "【考点】考查现在进行时的标志词now\n【解题思路】Be quiet!和now都是现在进行时的标志，用is sleeping\n【干扰项分析】A错在用了一般现在时；B错在用了一般过去时；D错在用了过去进行时\n【解题口诀】👉 now/Be quiet!/Look!/Listen!用现在进行时",
  "学生容易用一般现在时sleeps","Be quiet! = 别吵！说明正在发生用现在进行时",0.3)

# ===== 4. 现在完成时 (15题) =====
q("en_j2_grammar_046","现在完成时","since和for的用法","multiple_choice",
  "I have lived in this city _____ 2018.",
  ["A. in","B. for","C. since","D. at"],"C",
  "【考点】考查现在完成时中since的用法\n【解题思路】since后面接具体的时间点（2018年），表示「自从……以来」\n【干扰项分析】A的in表示在某年，不搭配完成时；B的for后面接时间段，不是时间点；D的at表示具体时刻\n【解题口诀】👉 since接时间点，for接时间段",
  "学生容易混淆since和for的用法","since后面是「点」（一个时刻），for后面是「段」（一段时间）",0.35)

q("en_j2_grammar_047","现在完成时","since和for的用法","fill_blank",
  "He has studied English _____ three years.",
  None,"for",
  "【考点】考查现在完成时中for的用法\n【解题思路】for后面接时间段（three years三年的时间），表示「持续了……」\n【干扰项分析】注意for不能接具体年份，since不能接数字+时间单位\n【解题口诀】👉 for + 时间段（数字 + 时间单位）",
  "学生容易用since代替for","看到数字+年/月/日用for，看到具体年份/日期用since",0.3)

q("en_j2_grammar_048","现在完成时","already和yet的用法","multiple_choice",
  "— Have you finished your homework _____?\n— Yes, I have _____ finished it.",
  ["A. already; yet","B. yet; already","C. already; already","D. yet; yet"],"B",
  "【考点】考查already和yet的用法区别\n【解题思路】疑问句中用yet（放在句末），肯定回答中用already（放在have/has之后）\n【干扰项分析】A错在疑问句中不用already；C错在疑问句中不用already；D错在肯定回答中不用yet\n【解题口诀】👉 疑问句/否定句末尾用yet，肯定句中间用already",
  "学生在疑问句中容易用already或在肯定句中用yet","already说「已经了」（肯定），yet问「还没？」（疑问/否定）",0.45)

q("en_j2_grammar_049","现在完成时","ever和never的用法","multiple_choice",
  "I have _____ been to Shanghai. It's a beautiful city.",
  ["A. ever","B. never","C. already","D. yet"],"A",
  "【考点】考查ever的用法\n【解题思路】后面说「它是一座美丽的城市」，说明去过上海，用ever表示「曾经」去过\n【干扰项分析】B的never表示从未去过，与后面赞美上海的语义矛盾；C的already表示已经，多用于具体动作；D的yet用于疑问句或否定句末尾\n【解题口诀】👉 肯定句中用ever表示「曾经」，never表示「从不」",
  "学生容易混淆ever和never的含义","ever=曾经（可能再去），never=从不（一次也没有）",0.4)

q("en_j2_grammar_050","现在完成时","have been to vs have gone to","multiple_choice",
  "— Where is Li Ming?\n— He has _____ the library.",
  ["A. been to","B. gone to","C. been in","D. went to"],"B",
  "【考点】考查have been to与have gone to的区别\n【解题思路】问「李明在哪里」，说明他去了还没回来，用has gone to（去了某地，还没回来）\n【干扰项分析】A的have been to表示去过已经回来了，与问「在哪」不匹配；C的have been in表示在某地待了多久；D错在went是一般过去时，不搭配has\n【解题口诀】👉 问「在哪」用have gone to（去了没回），问「去过吗」用have been to（去了已回）",
  "学生最容易混淆have been to和have gone to","been to=去过回来了，gone to=去了还没回来（人在那边）",0.5)

q("en_j2_grammar_051","现在完成时","have been to vs have gone to","multiple_choice",
  "My sister has _____ Beijing twice. She loves the food there.",
  ["A. been to","B. gone to","C. been in","D. went to"],"A",
  "【考点】考查have been to表示曾经去过某地\n【解题思路】twice说明去过两次了（已经回来），用have been to。后面说「她喜欢那儿的食物」说明人已经回来了\n【干扰项分析】B的have gone to表示去了没回来，不能搭配twice；C的have been in表示在某地持续待了多久；D错在时态不对\n【解题口诀】👉 去过几次+回来了就用have been to",
  "学生可能看到twice就想用gone to","twice/three times这些次数词说明已经回来了就用been to",0.45)

q("en_j2_grammar_052","现在完成时","现在完成时结构","fill_blank",
  "She has _____ (write) three letters since this morning.",
  None,"written",
  "【考点】考查不规则动词write的过去分词\n【解题思路】现在完成时：have/has + 过去分词。write的过去分词为written\n【干扰项分析】注意用written（过去分词）不是wrote（过去式）\n【解题口诀】👉 write-wrote-written，现在完成时用过去分词",
  "学生容易用wrote（过去式）代替written（过去分词）","现在完成时=have/has+过去分词（第三列），不是过去式（第二列）",0.4)

q("en_j2_grammar_053","现在完成时","现在完成时否定句","multiple_choice",
  "I haven't seen the movie _____.",
  ["A. already","B. yet","C. ever","D. never"],"B",
  "【考点】考查yet在否定句中的用法\n【解题思路】haven't是现在完成时否定，yet放在否定句末尾表示「还（没）」\n【干扰项分析】A的already用于肯定句；C的ever用于肯定句或疑问句；D的never本身就有否定含义，不能与haven't连用（语义重复）\n【解题口诀】👉 否定句末尾用yet，不能和never同时用",
  "学生在否定句中容易用never（与haven't重复）","haven't + yet = 还没有，hasn't + yet = 还没有",0.45)

q("en_j2_grammar_054","现在完成时","过去分词不规则变化","multiple_choice",
  "He has _____ his key. He can't find it anywhere.",
  ["A. lose","B. lost","C. losed","D. losing"],"B",
  "【考点】考查不规则动词lose的过去分词\n【解题思路】has + 过去分词。lose是不规则动词：lose-lost-lost\n【干扰项分析】A错在用了动词原形；C错在把lose当规则动词加了-ed；D错在用了现在分词\n【解题口诀】👉 lose-lost-lost，过去式和过去分词同形",
  "学生容易用losed而不是lost","lose/lost/lost，丢了钥匙就是lost",0.4)

q("en_j2_grammar_055","现在完成时","现在完成时一般疑问句","multiple_choice",
  "— _____ you ever _____ Chinese food?\n— Yes, I have.",
  ["A. Do; try","B. Did; try","C. Have; tried","D. Are; trying"],"C",
  "【考点】考查现在完成时的一般疑问句\n【解题思路】ever是现在完成时的标志词，疑问句把Have提前，后面跟过去分词tried\n【干扰项分析】A错在用了一般现在时；B错在用了一般过去时；D错在用了现在进行时\n【解题口诀】👉 ever提前用Have/Has + 主语 + 过去分词?",
  "学生容易用Did代替Have来提问","ever = 现在完成时信号弹，Have you ever...?",0.4)

q("en_j2_grammar_056","现在完成时","since引导的从句","multiple_choice",
  "I have known him _____ he was a little boy.",
  ["A. for","B. since","C. when","D. while"],"B",
  "【考点】考查since引导从句的用法\n【解题思路】since后面接从句（一般过去时），表示「自从……以来」，主句用现在完成时\n【干扰项分析】A的for后面接时间段，不接从句；C的when表示「当……时」；D的while表示「在……期间」\n【解题口诀】👉 since + 过去时的从句，主句用现在完成时",
  "学生可能用for代替since来引导从句","since后面可以是时间点也可以是从句，for后面只能数字+时间",0.5)

q("en_j2_grammar_057","现在完成时","过去分词不规则变化","fill_blank",
  "We have _____ (eat) lunch already.",
  None,"eaten",
  "【考点】考查不规则动词eat的过去分词\n【解题思路】eat是不规则动词：eat-ate-eaten。现在完成时用过去分词eaten\n【干扰项分析】注意用eaten不是ate\n【解题口诀】👉 eat-ate-eaten，吃-吃了-吃过",
  "学生容易用ate（过去式）代替eaten（过去分词）","eaten比ate多一个en，就像「已经吃完了」要强调",0.4)

q("en_j2_grammar_058","现在完成时","have been in的用法","multiple_choice",
  "Mr. Wang has _____ this school for ten years.",
  ["A. been to","B. gone to","C. been in","D. come to"],"C",
  "【考点】考查have been in表示在某地待了多久\n【解题思路】for ten years表示持续的时间段，用have been in表示「在某地待了……」\n【干扰项分析】A的have been to表示去过某地（已回来），不搭配时间段；B的have gone to表示去了没回来；D的come to是一般动作，不能表示持续状态\n【解题口诀】👉 for + 时间段 + have been in（在某地待了多久）",
  "学生容易混淆been to/gone to/been in","been to=去过回来，gone to=去了没回，been in=一直在那儿",0.5)

q("en_j2_grammar_059","现在完成时","现在完成时与一般过去时辨析","multiple_choice",
  "I _____ this book yesterday. I _____ it already.",
  ["A. bought; have read","B. have bought; read","C. buy; have read","D. bought; read"],"A",
  "【考点】考查现在完成时与一般过去时的区别\n【解题思路】yesterday用一般过去时bought；already用现在完成时have read\n【干扰项分析】B错在yesterday不能搭配现在完成时；C错在yesterday不能搭配一般现在时；D错在already不能搭配一般过去时\n【解题口诀】👉 具体过去时间用一般过去时；already/since/for用现在完成时",
  "学生在有yesterday的句子中也容易用现在完成时","yesterday是过去时的铁证，现在完成时绝不接受具体过去时间",0.55)

q("en_j2_grammar_060","现在完成时","现在完成时否定句","multiple_choice",
  "She has _____ heard from him since he left.",
  ["A. not","B. no","C. never","D. none"],"C",
  "【考点】考查现在完成时的否定表达\n【解题思路】since he left是现在完成时的标志，表示「自从他离开后就再也没有收到他的信」，用never\n【干扰项分析】A的not不能直接放在has后面再接过去分词，应说hasn't heard；B的no不修饰动词；D的none是代词，不修饰动词\n【解题口诀】👉 现在完成时否定：haven't/hasn't + done 或 have/has + never + done",
  "学生可能用hasn't heard或has not heard，但选项中没有这种形式","never本身含否定，放在has/have和过去分词之间",0.5)

# ===== 5. 被动语态 (15题) =====
q("en_j2_grammar_061","被动语态","一般现在时被动","multiple_choice",
  "English _____ in many countries around the world.",
  ["A. speaks","B. spoke","C. is spoken","D. is speaking"],"C",
  "【考点】考查一般现在时被动语态\n【解题思路】英语是被人们说的，主语English是动作的承受者，用被动语态：is + 过去分词\n【干扰项分析】A错在用了主动语态，英语不能自己说；B错在用了一般过去时；D错在用了现在进行时\n【解题口诀】👉 看主语是否能主动发出动作，不能就用被动",
  "学生容易忽略English是被动意义的动词","语言/故事/书都被说/被写，用被动语态",0.35)

q("en_j2_grammar_062","被动语态","一般过去时被动","multiple_choice",
  "The bridge _____ in 2010.",
  ["A. built","B. was built","C. is built","D. builds"],"B",
  "【考点】考查一般过去时被动语态\n【解题思路】桥是被建造的，主语bridge是动作承受者。2010是过去时间，用was + 过去分词\n【干扰项分析】A错在用了过去分词但没有be动词（被动不完整）；C错在用了现在时被动；D错在用了主动语态\n【解题口诀】👉 过去时间被动：was/were + done",
  "学生容易只用built而漏掉was","被动语态必须有be动词，被动=be+done，缺be不被动",0.4)

q("en_j2_grammar_063","被动语态","带有by短语的被动","multiple_choice",
  "The window _____ by the boy yesterday.",
  ["A. broke","B. was broken","C. is broken","D. broken"],"B",
  "【考点】考查带by短语的被动语态\n【解题思路】窗户是被男孩打破的，yesterday表明过去时，用was broken\n【干扰项分析】A错在用了主动语态过去式，窗户不能自己打破；C错在用了现在时被动；D错在没有be动词\n【解题口诀】👉 by + 执行者，前面一定用被动语态",
  "学生容易用主动语态broke","看到by someone就用被动语态：be + done",0.35)

q("en_j2_grammar_064","被动语态","一般将来时被动","fill_blank",
  "A new school _____ (build) in our town next year.",
  None,"will be built",
  "【考点】考查一般将来时被动语态\n【解题思路】next year是将来时间，学校是被建造的，用will be + 过去分词\n【干扰项分析】注意不能写成will build（主动语态）\n【解题口诀】👉 将来被动：will be + done",
  "学生可能写成will build（主动语态）","学校是被建的，不是自己建的就用will be built",0.4)

q("en_j2_grammar_065","被动语态","含情态动词的被动","multiple_choice",
  "The work _____ finished on time.",
  ["A. can be","B. can","C. must","D. should be"],"A",
  "【考点】考查含情态动词的被动语态\n【解题思路】工作是被完成的，情态动词的被动：情态动词 + be + 过去分词\n【干扰项分析】B错在can后面缺be动词；C错在must后面缺be动词；D的should be后面缺过去分词finished\n【解题口诀】👉 情态动词被动：can/must/should + be + done",
  "学生在情态动词后容易直接加过去分词而漏掉be","情态动词 + be + done，be是桥梁不能少",0.45)

q("en_j2_grammar_066","被动语态","现在完成时被动","multiple_choice",
  "The classroom _____ already by the students.",
  ["A. cleans","B. cleaned","C. has been cleaned","D. is cleaning"],"C",
  "【考点】考查现在完成时被动语态\n【解题思路】教室是被打扫的，already是现在完成时标志，用has/have been + 过去分词\n【干扰项分析】A错在用了主动现在时；B错在用了主动过去时；D错在用了主动进行时\n【解题口诀】👉 现在完成时被动：has/have been + done",
  "学生容易用has cleaned（主动完成时）代替has been cleaned（被动完成时）","被动完成时=have/has + been + done，多一个been",0.5)

q("en_j2_grammar_067","被动语态","被动语态否定句","multiple_choice",
  "The letter _____ in Chinese.",
  ["A. is not written","B. is not writing","C. doesn't write","D. didn't write"],"A",
  "【考点】考查被动语态的否定形式\n【解题思路】信是被写的，否定形式在be动词后加not：is not written\n【干扰项分析】B错在用了现在进行时否定；C错在用了一般现在时否定（主动）；D错在用了一般过去时否定（主动）\n【解题口诀】👉 被动否定：be + not + done",
  "学生容易用doesn't write来否定被动语态","被动否定否定be动词，不是加doesn't/didn't",0.45)

q("en_j2_grammar_068","被动语态","主动变被动转换","fill_blank",
  "People speak English in many countries. (改为被动语态)\nEnglish _____ in many countries.",
  None,"is spoken",
  "【考点】考查主动语态改为被动语态\n【解题思路】主动：People speak English改为被动：English is spoken (by people)。一般现在时被动：am/is/are + done\n【干扰项分析】注意不能写成is speaking（现在进行时）\n【解题口诀】👉 主动变被动：宾语变主语，谓语变be+done，主语变by宾语",
  "学生可能写成is speaking（现在进行时）","宾语变主语，动词加be变被动",0.4)

q("en_j2_grammar_069","被动语态","感官动词被动","multiple_choice",
  "The old man _____ often _____ by his neighbors.",
  ["A. is; helped","B. was; helped","C. is; helping","D. has; helped"],"A",
  "【考点】考查一般现在时被动语态\n【解题思路】often表明经常性动作，用一般现在时被动：is + 过去分词\n【干扰项分析】B错在用了一般过去时，与often不搭配；C错在用了现在进行时；D错在用了现在完成时\n【解题口诀】👉 often/usually/always + 被动就用一般现在时被动",
  "学生可能被often误导而选错时态","频度副词often/usually就用一般现在时被动",0.35)

q("en_j2_grammar_070","被动语态","现在进行时被动","multiple_choice",
  "Look! A new road _____ in our city.",
  ["A. is built","B. was built","C. is being built","D. will be built"],"C",
  "【考点】考查现在进行时被动语态\n【解题思路】Look!表示正在进行，路正在被修建，用is being + 过去分词\n【干扰项分析】A错在用了一般现在时被动；B错在用了一般过去时被动；D错在用了一般将来时被动\n【解题口诀】👉 现在进行时被动：am/is/are + being + done",
  "学生容易用is built（一般现在时被动）代替is being built（进行时被动）","正在被做=be + being + done，多一个being就是「正在」",0.6)

q("en_j2_grammar_071","被动语态","含情态动词的被动","multiple_choice",
  "Trees _____ in spring every year.",
  ["A. should plant","B. should be planted","C. should planting","D. should be planting"],"B",
  "【考点】考查情态动词的被动语态\n【解题思路】树是被种的，情态动词should + be + 过去分词\n【干扰项分析】A错在should后面直接加plant（缺be动词）；C错在用了-ing形式；D错在用了现在进行时\n【解题口诀】👉 情态动词被动：can/must/should/may + be + done",
  "学生容易漏掉be直接写should planted","情态动词和be是好朋友，有情态必有be",0.45)

q("en_j2_grammar_072","被动语态","主动变被动","multiple_choice",
  "Lu Xun wrote this book. This book _____ by Lu Xun.",
  ["A. writes","B. wrote","C. is written","D. was written"],"D",
  "【考点】考查一般过去时被动语态\n【解题思路】鲁迅写这本书是过去的事情，改为被动：This book was written by Lu Xun.\n【干扰项分析】A错在用了一般现在时主动；B错在用了一般过去时主动；C错在用了一般现在时被动\n【解题口诀】👉 原句过去时改为被动也要过去时：was/were + done",
  "学生容易改为is written而忽略了原句的过去时","主动什么时态，被动什么时态，时态不变",0.45)

q("en_j2_grammar_073","被动语态","被动语态疑问句","fill_blank",
  "_____ the homework _____ (finish) by you yesterday?",
  None,"Was; finished",
  "【考点】考查被动语态的一般疑问句\n【解题思路】yesterday是过去时，被动语态疑问句把be动词提前：Was + 主语 + done?\n【干扰项分析】注意不能写成Did the homework finished\n【解题口诀】👉 被动疑问句：Be动词提前",
  "学生可能写成Did the homework finished","被动疑问=be动词提前+主语+done，不是Did开头",0.45)

q("en_j2_grammar_074","被动语态","双宾语被动","multiple_choice",
  "My mother gave me a gift. A gift _____ me by my mother.",
  ["A. was given to","B. was given","C. gave to","D. is given to"],"A",
  "【考点】考查双宾语动词的被动语态\n【解题思路】give sb sth改为sth was given to sb。间接宾语前需要加to\n【干扰项分析】B错在没有to，give的双宾被动需要to；C错在用了主动语态；D错在用了现在时\n【解题口诀】👉 give sb sth改为sth was/were given to sb（间接宾语前加to）",
  "学生容易漏掉to，写成was given me","give/show/send/pass + to + 人，被动间接宾语前别忘了to",0.6)

q("en_j2_grammar_075","被动语态","使役动词被动","multiple_choice",
  "The teacher made the students _____ the classroom after school.",
  ["A. clean","B. to clean","C. cleaning","D. cleaned"],"A",
  "【考点】考查make sb do sth结构（主动语态）\n【解题思路】这是主动语态的make句型：make sb do sth（让某人做某事），后面用动词原形。注意本题不是被动\n【干扰项分析】B错在加了to（被动态才用to）；C错在用了-ing形式；D错在用了过去分词\n【解题口诀】👉 主动make sb do，被动be made to do（被动要加to）",
  "学生在被动语态中知道要加to，但在主动语态中也加to","make/let/have主动不加to，被动要加to",0.55)

# ===== 6. 情态动词 (15题) =====
q("en_j2_grammar_076","情态动词","can的用法","multiple_choice",
  "— _____ you swim?\n— Yes, I can.",
  ["A. Do","B. Are","C. Can","D. May"],"C",
  "【考点】考查can表示能力的用法\n【解题思路】回答Yes, I can.说明问的是能力，用Can提问\n【干扰项分析】A的Do用于一般现在时；B的Are用于be动词句型；D的May表示许可/请求\n【解题口诀】👉 问能力用Can，回答Yes, I can./No, I can't.",
  "学生可能用Do you swim来提问能力","can = 能力，「你会游泳吗」= Can you swim?",0.3)

q("en_j2_grammar_077","情态动词","must的用法","multiple_choice",
  "You _____ finish your homework before you go out to play.",
  ["A. can","B. may","C. must","D. could"],"C",
  "【考点】考查must表示必须的用法\n【解题思路】句意为「出去玩之前必须完成作业」，表示义务和必须，用must\n【干扰项分析】A的can表示能力或可以；B的may表示可以/可能；D的could表示能够（委婉）\n【解题口诀】👉 必须、一定要做的事就用must",
  "学生可能用should（应该）代替must（必须）","must = 必须，没有商量的余地；should = 应该，建议性的",0.35)

q("en_j2_grammar_078","情态动词","may的用法","multiple_choice",
  "— _____ I use your pen?\n— Sure, here you are.",
  ["A. Must","B. May","C. Need","D. Should"],"B",
  "【考点】考查may表示请求/许可的用法\n【解题思路】May I...?表示请求许可「我可以……吗？」，回答Sure表示同意\n【干扰项分析】A的Must表示必须，语气太强硬；C的Need表示需要；D的Should表示应该\n【解题口诀】👉 请求许可用May I...?",
  "学生可能用Can I代替May I（Can更口语化但考试中May更正式）","May I = 我可以吗？（礼貌请求）",0.3)

q("en_j2_grammar_079","情态动词","must否定推测","multiple_choice",
  "The light is on. Someone _____ be in the room.",
  ["A. can","B. must","C. may","D. need"],"B",
  "【考点】考查must表示肯定推测\n【解题思路】灯亮着说明有人一定在房间里。must表示有把握的肯定推测「一定」\n【干扰项分析】A的can表示能力；C的may表示可能（把握不大）；D的need表示需要\n【解题口诀】👉 must + be/do = 一定（肯定推测），把握很大",
  "学生容易用may（可能）代替must（一定）","must = 一定是，may = 可能是，can't = 不可能是",0.45)

q("en_j2_grammar_080","情态动词","can't否定推测","multiple_choice",
  "He _____ be at home. I just saw him at the supermarket.",
  ["A. must","B. can't","C. may","D. might"],"B",
  "【考点】考查can't表示否定推测\n【解题思路】「我刚在超市看到他」说明他不可能在家。can't表示有把握的否定推测「不可能」\n【干扰项分析】A的must表示一定，与语义矛盾；C的may表示可能；D的might表示可能（把握更小）\n【解题口诀】👉 can't = 不可能（否定推测），must = 一定（肯定推测）",
  "学生容易用mustn't（禁止）来表示不可能","不可能=can't，禁止=mustn't，不是一回事",0.5)

q("en_j2_grammar_081","情态动词","should的用法","fill_blank",
  "You _____ (should) listen to the teacher carefully in class.",
  None,"should",
  "【考点】考查should表示应该、建议\n【解题思路】should表示应该做某事，后面跟动词原形\n【干扰项分析】注意不能写成should to listen\n【解题口诀】👉 should + 动词原形 = 应该",
  "学生可能写成should to listen","should后面直接跟原形，不加to",0.3)

q("en_j2_grammar_082","情态动词","need的用法","multiple_choice",
  "You _____ not worry about him. He can take care of himself.",
  ["A. must","B. need","C. can","D. may"],"B",
  "【考点】考查need not（needn't）表示不必\n【解题思路】needn't = don't need to = don't have to，表示「不需要」「不必」\n【干扰项分析】A的must not表示禁止（不许）；C的can not表示不能；D的may not表示可能不\n【解题口诀】👉 needn't = 不必（不需要做某事）",
  "学生容易混淆needn't（不必）和mustn't（禁止）","needn't = 你不用做，mustn't = 你不许做",0.5)

q("en_j2_grammar_083","情态动词","had better的用法","multiple_choice",
  "You'd better _____ too much junk food.",
  ["A. not eat","B. not to eat","C. don't eat","D. not eating"],"A",
  "【考点】考查had better的否定形式\n【解题思路】had better的否定是had better not + 动词原形\n【干扰项分析】B错在加了to（had better后不加to）；C错在用了don't（had better否定不是加don't）；D错在用了-ing形式\n【解题口诀】👉 had better not + 动词原形（否定不加don't，不加to）",
  "学生容易写成had better not to eat或don't eat","had better简写'd better，否定是'd better not do",0.5)

q("en_j2_grammar_084","情态动词","could表示委婉请求","multiple_choice",
  "— _____ you please pass me the salt?\n— Of course.",
  ["A. Could","B. Must","C. Need","D. Should"],"A",
  "【考点】考查could表示委婉请求\n【解题思路】Could you please...?表示委婉地请求对方做某事，比Can you更礼貌\n【干扰项分析】B的Must太强硬；C的Need不用于请求；D的Should用于建议\n【解题口诀】👉 Could you please...? = 委婉请求",
  "学生可能因为could是过去式而选错","Could you...不是问你能不能（过去），而是礼貌地问你现在能不能",0.4)

q("en_j2_grammar_085","情态动词","might表示推测","multiple_choice",
  "Take an umbrella with you. It _____ rain later.",
  ["A. must","B. need","C. might","D. should"],"C",
  "【考点】考查might表示可能性不大的推测\n【解题思路】「带把伞吧，可能待会儿会下雨」——对将来的不确定推测，用might（可能）\n【干扰项分析】A的must表示一定（太确定）；B的need表示需要；D的should表示应该\n【解题口诀】👉 might = 可能（50%以下把握），may = 可能（50%把握），must = 一定（90%+把握）",
  "学生容易混淆might/may/must表示推测的程度差异","might < may < must，可能性的递增",0.45)

q("en_j2_grammar_086","情态动词","must与have to辨析","fill_blank",
  "I _____ (have to) finish my homework now because it's due tomorrow.",
  None,"have to",
  "【考点】考查have to表示客观必须\n【解题思路】因为明天要交（客观原因），所以不得不做，用have to\n【干扰项分析】have to与must的区别在于must是主观觉得必须，have to是客观情况要求\n【解题口诀】👉 must = 主观上觉得必须，have to = 客观情况要求必须",
  "学生容易混淆must和have to","must是我想做，have to是逼我做",0.45)

q("en_j2_grammar_087","情态动词","情态动词回答","multiple_choice",
  "— Must I hand in my homework today?\n— No, you _____.",
  ["A. mustn't","B. can't","C. needn't","D. won't"],"C",
  "【考点】考查Must I...?的否定回答\n【解题思路】Must I...?的否定回答用No, you needn't.（不必）。不能用mustn't（禁止）\n【干扰项分析】A的mustn't表示禁止（不许交），语义错误；B的can't表示不能；D的won't表示不会\n【解题口诀】👉 Must I...? 否定回答用No, you needn't.（不必）",
  "学生最容易犯的错误是用mustn't来回答Must I的否定","Must提问否定答：needn't不必，mustn't禁止",0.6)

q("en_j2_grammar_088","情态动词","can表示许可","multiple_choice",
  "You _____ play computer games after you finish your homework.",
  ["A. must","B. can","C. need","D. might"],"B",
  "【考点】考查can表示允许/可以\n【解题思路】「完成作业后可以玩电脑游戏」——can表示允许\n【干扰项分析】A的must表示必须；C的need表示需要；D的might表示可能\n【解题口诀】👉 can = 可以（表示允许），不只是能力",
  "学生可能只记住can表示能力而忽略can表示许可","can有两种意思：你能（能力）/ 你可以（许可）",0.35)

q("en_j2_grammar_089","情态动词","used to的用法","multiple_choice",
  "He used to _____ up late, but now he gets up early.",
  ["A. get","B. got","C. getting","D. gets"],"A",
  "【考点】考查used to do sth（过去常常做某事）\n【解题思路】used to + 动词原形，表示过去常常但现在不这样了\n【干扰项分析】B错在用了过去式；C错在用了-ing形式；D错在用了第三人称单数\n【解题口诀】👉 used to + 动词原形（过去常常）",
  "学生容易将used to do和be used to doing混淆","used to do = 过去常常做，be used to doing = 习惯于做",0.5)

q("en_j2_grammar_090","情态动词","情态动词综合","multiple_choice",
  "The ground is wet. It _____ have rained last night.",
  ["A. must","B. can","C. may","D. need"],"A",
  "【考点】考查must have done表示对过去事情的肯定推测\n【解题思路】地面湿了说明昨晚一定下雨了。must have done对过去有把握的推测\n【干扰项分析】B的can不能用于肯定推测；C的may have done表示可能（把握不大）；D的need不能用于推测\n【解题口诀】👉 must have done = 一定做过（对过去的肯定推测）",
  "学生可能用may代替must（把握程度不同）","地面湿=下过雨的「证据」，有证据就用must",0.6)

# ===== 7. 宾语从句 (15题) =====
q("en_j2_grammar_091","宾语从句","that引导的宾语从句","multiple_choice",
  "I think _____ he is a good student.",
  ["A. what","B. that","C. if","D. where"],"B",
  "【考点】考查that引导的宾语从句\n【解题思路】I think后面跟完整陈述句作宾语，用that引导（that在口语中可省略）\n【干扰项分析】A的what在从句中要充当成分；C的if表示是否（引导疑问句）；D的where在从句中充当地点状语\n【解题口诀】👉 宾语从句是完整陈述句就用that引导",
  "学生可能不知道that可以省略而觉得句子不完整","陈述句做宾语就用that引导（可省略）",0.35)

q("en_j2_grammar_092","宾语从句","if/whether引导的宾语从句","multiple_choice",
  "I don't know _____ he will come or not.",
  ["A. that","B. what","C. if","D. whether"],"D",
  "【考点】考查whether与if的区别\n【解题思路】whether...or not是固定搭配，if后面不能直接跟or not\n【干扰项分析】A的that引导陈述句；B的what在从句中要充当成分；C的if不能与or not连用\n【解题口诀】👉 whether...or not（whether可以，if不行）",
  "学生容易用if...or not","whether万能，if有限制：if不能跟or not",0.5)

q("en_j2_grammar_093","宾语从句","宾语从句语序","multiple_choice",
  "Could you tell me _____?",
  ["A. where does he live","B. where he lives","C. where he live","D. where did he live"],"B",
  "【考点】考查宾语从句的语序（陈述语序）\n【解题思路】宾语从句必须用陈述语序（主语+谓语），不能用疑问语序。he是第三人称单数，用lives\n【干扰项分析】A错在用了疑问语序does he live；C错在第三人称单数没有用lives；D错在用了疑问语序和过去时\n【解题口诀】👉 宾语从句永远是陈述语序：主语 + 谓语，不是疑问语序",
  "学生最容易犯的错误是把疑问词后面的语序写成疑问语序","不管问什么，宾语从句都是「他说什么」不是「什么他说」",0.5)

q("en_j2_grammar_094","宾语从句","wh-引导的宾语从句","fill_blank",
  "Do you know _____ the movie starts?",
  None,"when",
  "【考点】考查when引导的宾语从句\n【解题思路】从句the movie starts缺少时间状语，用when（什么时候）引导\n【干扰项分析】注意不能用what（what不能表示时间）\n【解题口诀】👉 缺什么问什么：缺时间用when，缺地点用where，缺原因用why",
  "学生可能用what代替when","电影start需要时间就用when",0.4)

q("en_j2_grammar_095","宾语从句","宾语从句时态","multiple_choice",
  "He said that he _____ to Beijing the next day.",
  ["A. will go","B. would go","C. goes","D. went"],"B",
  "【考点】考查宾语从句的时态一致原则\n【解题思路】主句said是过去时，宾语从句也要用过去的某种时态。the next day是过去将来时间，用would go\n【干扰项分析】A错在用了一般将来时（主句过去时，从句不能保留将来时）；C错在用了一般现在时；D错在用了一般过去时，但the next day表示「第二天」不是过去\n【解题口诀】👉 主句过去时，从句也要变过去：will变would，can变could",
  "学生在主句过去时的情况下从句仍容易用will","主句过去就从句跟着退一步：will变would，can变could",0.55)

q("en_j2_grammar_096","宾语从句","宾语从句语序","multiple_choice",
  "I want to know _____.",
  ["A. what is your name","B. what your name is","C. what your name was","D. what was your name"],"B",
  "【考点】考查宾语从句的陈述语序\n【解题思路】宾语从句用陈述语序：what + 主语(your name) + 谓语(is)\n【干扰项分析】A错在用了疑问语序；C错在用了过去时was，名字不会变过去；D错在用了疑问语序和过去时\n【解题口诀】👉 宾语从句陈述语序：引导词 + 主语 + 谓语",
  "学生容易受原问句What is your name?影响而写成疑问语序","间接问句不等于直接问句，语序要变成陈述",0.45)

q("en_j2_grammar_097","宾语从句","宾语从句时态","multiple_choice",
  "The teacher told us that the earth _____ around the sun.",
  ["A. moves","B. moved","C. has moved","D. will move"],"A",
  "【考点】考查宾语从句中客观真理的时态\n【解题思路】虽然told是过去时，但「地球绕太阳转」是客观真理，永远用一般现在时\n【干扰项分析】B错在用过去时（真理不因主句时态而改变）；C错在用了完成时；D错在用了将来时\n【解题口诀】👉 客观真理/自然规律永远用一般现在时，不管主句什么时态",
  "学生容易因主句过去时而从句也用过去时","真理不变时态——地球永远绕太阳转，永远是moves",0.55)

q("en_j2_grammar_098","宾语从句","if/whether引导的宾语从句","multiple_choice",
  "She asked me _____ I liked English.",
  ["A. that","B. if","C. what","D. which"],"B",
  "【考点】考查if引导一般疑问句做宾语从句\n【解题思路】「她问我是否喜欢英语」——一般疑问句做宾语从句用if/whether引导\n【干扰项分析】A的that引导陈述句；C的what在从句中要充当成分（这里从句完整不需要what）；D的which表示哪一个\n【解题口诀】👉 一般疑问句做宾语就用if/whether引导",
  "学生可能用that引导一般疑问句做宾语","一般疑问句（能用yes/no回答的）就用if/whether",0.4)

q("en_j2_grammar_099","宾语从句","宾语从句连接词","fill_blank",
  "Can you tell me _____ book this is?",
  None,"whose",
  "【考点】考查whose引导的宾语从句\n【解题思路】从句book this is中，book前面缺定语（谁的），用whose引导\n【干扰项分析】注意不能用who（人），whose是问「谁的」\n【解题口诀】👉 问「谁的」用whose，问「什么」用what，问「哪个」用which",
  "学生可能用who（人）代替whose（谁的）","whose = whose book（谁的），who = who is（谁）",0.45)

q("en_j2_grammar_100","宾语从句","宾语从句时态","multiple_choice",
  "Tom says he _____ his homework already.",
  ["A. finishes","B. finished","C. has finished","D. will finish"],"C",
  "【考点】考查宾语从句的时态\n【解题思路】主句says是一般现在时，从句可以用任意需要的时态。already是现在完成时标志\n【干扰项分析】A错在一般现在时与already不搭配；B错在一般过去时与already不搭配；D错在将来时与already不搭配\n【解题口诀】👉 主句现在时，从句时态根据需要选择",
  "学生可能因为主句是一般现在时就不知道从句该用什么时态","says/tells（现在时）就从句时态自由选择",0.5)

q("en_j2_grammar_101","宾语从句","宾语从句语序","multiple_choice",
  "Could you tell me how I _____ to the station?",
  ["A. can get","B. get","C. could get","D. got"],"A",
  "【考点】考查Could you tell me...中从句的时态\n【解题思路】Could you tell me是委婉请求（不是过去时含义），从句根据实际情况用现在时。can get表示「能到达」\n【干扰项分析】B的get缺少情态动词，「我怎么到」需要能力；C的could get是过去时；D的got是过去时\n【解题口诀】👉 Could you tell me...是委婉语气，从句用现在时",
  "学生容易因为Could而把从句也写成过去时","Could you tell me中的Could是礼貌，不是过去",0.55)

q("en_j2_grammar_102","宾语从句","宾语从句时态","multiple_choice",
  "She asked me where I _____ during the holiday.",
  ["A. go","B. went","C. will go","D. have gone"],"B",
  "【考点】考查宾语从句的时态一致\n【解题思路】主句asked是过去时，从句也用过去时。during the holiday已过，用went\n【干扰项分析】A错在用现在时（主句过去时，从句要退一步）；C错在用将来时；D错在用完成时\n【解题口诀】👉 主句过去时，从句也用过去时态",
  "学生容易忽略时态一致性","asked/said/told（过去时）就从句时态向后退一步",0.5)

q("en_j2_grammar_103","宾语从句","what引导的宾语从句","fill_blank",
  "I don't understand _____ he said.",
  None,"what",
  "【考点】考查what引导的宾语从句（what在从句中充当宾语）\n【解题思路】he said后面缺宾语（说了什么），用what引导，what = the thing that\n【干扰项分析】注意不能用that（that在从句中不充当成分）\n【解题口诀】👉 what在从句中充当主语/宾语/表语，不能省略",
  "学生可能用that（that在从句中不充当成分）","said后面缺东西就用what（说了什么）",0.4)

q("en_j2_grammar_104","宾语从句","宾语从句综合","multiple_choice",
  "He asked me _____ I would go with him or stay at home.",
  ["A. that","B. if","C. whether","D. what"],"C",
  "【考点】考查whether...or...结构\n【解题思路】「...or stay at home」是选择结构，whether...or表示「是……还是……」\n【干扰项分析】A的that不引导选择疑问；B的if不能与or搭配；D的what语义不通\n【解题口诀】👉 有or就用whether，不用if",
  "学生在有or的情况下仍容易用if","whether比if强大：能跟or, 能跟or not, 能放句首",0.5)

q("en_j2_grammar_105","宾语从句","宾语从句语序","multiple_choice",
  "Do you know how many students _____ in our class?",
  ["A. are there","B. there are","C. have there","D. there have"],"B",
  "【考点】考查There be句型在宾语从句中的语序\n【解题思路】There be句型做宾语从句时，用陈述语序：there are（不是are there）\n【干扰项分析】A错在用了疑问语序are there；C和D的结构不正确\n【解题口诀】👉 There be在宾语从句中保持there + be的陈述语序",
  "学生容易把There be写成疑问语序","宾语从句中There be = there are/were（不是are/were there）",0.5)

# ===== 8. 条件状语从句 if (5题) =====
q("en_j2_grammar_106","条件状语从句","主将从现","multiple_choice",
  "If it _____ tomorrow, we will stay at home.",
  ["A. rains","B. will rain","C. rained","D. is raining"],"A",
  "【考点】考查条件状语从句的「主将从现」\n【解题思路】if引导条件状语从句，主句用一般将来时（will stay），if从句用一般现在时表将来（rains）\n【干扰项分析】B错在if从句中用了will（违反主将从现）；C错在用了过去时；D错在用了现在进行时\n【解题口诀】👉 主将从现：if从句用现在时代替将来时",
  "学生最容易在if从句中用will","if后面不用will，now代替将来",0.5)

q("en_j2_grammar_107","条件状语从句","主将从现","multiple_choice",
  "I will call you as soon as I _____ in Shanghai.",
  ["A. arrive","B. will arrive","C. arrived","D. arriving"],"A",
  "【考点】考查as soon as引导的时间状语从句中「主将从现」\n【解题思路】主句will call是将来时，as soon as从句用一般现在时表将来\n【干扰项分析】B错在从句用了will；C错在用了过去时；D错在用了现在分词\n【解题口诀】👉 as soon as/when/before/after + 现在时，主句用将来时",
  "学生在as soon as后面容易用will arrive","时间条件从句统一规则：现在时代表将来",0.5)

q("en_j2_grammar_108","条件状语从句","主将从现","fill_blank",
  "If she _____ (study) hard, she will pass the exam.",
  None,"studies",
  "【考点】考查if从句中第三人称单数形式\n【解题思路】if从句用一般现在时表将来，she是第三人称单数，study加-es变为studies\n【干扰项分析】注意不能用will study也不能用study（忘记第三人称单数）\n【解题口诀】👉 if从句现在时就要注意第三人称单数",
  "学生可能用will study或study（忘记第三人称单数）","if she studies（现在时），she will pass（将来时）",0.45)

q("en_j2_grammar_109","条件状语从句","unless的用法","multiple_choice",
  "You won't pass the exam _____ you study hard.",
  ["A. if","B. unless","C. because","D. when"],"B",
  "【考点】考查unless（除非/如果不）的用法\n【解题思路】unless = if...not，「你不会通过考试除非你努力学习」即不努力就不通过\n【干扰项分析】A的if语义不够准确（用if需要双重否定才能表达）；C的because表示原因；D的when表示时间\n【解题口诀】👉 unless = if...not（除非=如果不）",
  "学生可能用if来代替unless导致语义不完整","unless就是if not的缩写版，用unless更简洁",0.55)

q("en_j2_grammar_110","条件状语从句","主将从现","multiple_choice",
  "I'll wait until he _____ back.",
  ["A. come","B. comes","C. will come","D. came"],"B",
  "【考点】考查until引导的时间状语从句中「主将从现」\n【解题思路】主句I'll wait是将来时，until从句用一般现在时表将来，he是第三人称单数用comes\n【干扰项分析】A错在第三人称单数没有加-s；C错在从句用了will；D错在用了过去时\n【解题口诀】👉 until + 一般现在时（主句将来时）",
  "学生在until后面容易用will come","until像if一样，从句用现在时表将来",0.5)

# ===== 9. 感叹句 (5题) =====
q("en_j2_grammar_111","感叹句","What引导的感叹句","multiple_choice",
  "_____ beautiful flower it is!",
  ["A. What","B. What a","C. How","D. How a"],"B",
  "【考点】考查What a + adj. + 单数可数名词\n【解题思路】flower是单数可数名词，用What a + beautiful + flower\n【干扰项分析】A的What后面不能直接加形容词+单数名词；C的How后面接形容词或副词，不接名词；D的How a不存在这种搭配\n【解题口诀】👉 What a/an + adj. + 单数名词！What + adj. + 复数/不可数名词！",
  "学生容易混淆What和How引导的感叹句","What + 名词词组，How + 形容词/副词",0.35)

q("en_j2_grammar_112","感叹句","How引导的感叹句","multiple_choice",
  "_____ fast the boy runs!",
  ["A. What","B. What a","C. How","D. How a"],"C",
  "【考点】考查How + adj./adv. + 主语 + 谓语\n【解题思路】fast是副词，修饰动词runs，用How + fast\n【干扰项分析】A的What后面接名词；B的What a后面接单数名词；D的How a不存在\n【解题口诀】👉 How + 形容词/副词 + 主语 + 谓语！",
  "学生容易用What修饰副词","How管形容词副词，What管名词",0.35)

q("en_j2_grammar_113","感叹句","What引导的感叹句（复数/不可数）","multiple_choice",
  "_____ good news it is!",
  ["A. What","B. What a","C. How","D. How a"],"A",
  "【考点】考查What + adj. + 不可数名词\n【解题思路】news是不可数名词，用What + good + news（不加a/an）\n【干扰项分析】B的What a后面不能接不可数名词；C的How后面接形容词不接名词；D的How a不存在\n【解题口诀】👉 不可数名词前不加a/an：What good news!",
  "学生在不可数名词news前容易加a","news/information/weather是不可数名词，不加a",0.45)

q("en_j2_grammar_114","感叹句","How引导的感叹句（形容词）","fill_blank",
  "_____ (what/how) lovely the cat is!",
  None,"How",
  "【考点】考查How + adj.引导感叹句\n【解题思路】lovely是形容词，后面the cat is（主语+谓语），用How引导\n【干扰项分析】注意不能用What（What后面要接名词）\n【解题口诀】👉 看到adj. + 主语 + 谓语结构就用How",
  "学生可能因为cat是名词而用What","先找核心词：核心是形容词就用How，核心是名词就用What",0.4)

q("en_j2_grammar_115","感叹句","感叹句综合","multiple_choice",
  "_____ interesting the movie is!",
  ["A. What","B. What an","C. How","D. What a"],"C",
  "【考点】考查How + adj.引导感叹句\n【解题思路】interesting是形容词，后面有主语the movie和谓语is，用How + interesting\n【干扰项分析】A的What后面需要名词；B的What an后面需要名词；D的What a后面需要名词\n【解题口诀】👉 判断感叹词：看紧跟在感叹词后面的是形容词还是名词",
  "学生容易因为movie是名词而选What","感叹词后面紧跟adj就用How，紧跟名词就用What",0.5)

# ===== 10. 反意疑问句 (5题) =====
q("en_j2_grammar_116","反意疑问句","前肯后否","multiple_choice",
  "He is a good student, _____?",
  ["A. is he","B. isn't he","C. does he","D. doesn't he"],"B",
  "【考点】考查反意疑问句「前肯后否」\n【解题思路】前半句He is a good student是肯定句，反意疑问句用否定形式isn't he\n【干扰项分析】A错在前肯后应该用否定；C的does he与be动词不搭配；D的doesn't he与be动词不搭配\n【解题口诀】👉 前肯后否，前否后肯，动词类型要一致",
  "学生容易忽略前后动词要一致（is对isn't，不是does对doesn't）","前面is后面isn't，前面does后面doesn't",0.35)

q("en_j2_grammar_117","反意疑问句","前否后肯","multiple_choice",
  "She doesn't like apples, _____?",
  ["A. does she","B. doesn't she","C. is she","D. isn't she"],"A",
  "【考点】考查反意疑问句「前否后肯」\n【解题思路】前半句doesn't like是否定句，反意疑问句用肯定形式does she\n【干扰项分析】B错在前否后应该用肯定；C的is she与实义动词不搭配；D的isn't she与实义动词不搭配\n【解题口诀】👉 前有否定词（not/never/hardly/few/little）就用后肯",
  "学生在前否时也容易用否定","前面有not后面就yes，前面没not后面就no",0.35)

q("en_j2_grammar_118","反意疑问句","含否定词的反意疑问句","multiple_choice",
  "He has never been to Japan, _____?",
  ["A. has he","B. hasn't he","C. does he","D. doesn't he"],"A",
  "【考点】考查含否定词never的反意疑问句\n【解题思路】never是否定词，前半句相当于否定句，反意疑问句用肯定形式has he\n【干扰项分析】B错在前有否定词应后肯；C的does he与现在完成时不搭配；D的doesn't he与现在完成时不搭配\n【解题口诀】👉 never/hardly/few/little/nothing/nobody是否定词就用后肯",
  "学生容易忽略never是否定词而用 hasn't he","never/hardly/few/little = 隐藏的not",0.5)

q("en_j2_grammar_119","反意疑问句","祈使句的反意疑问句","fill_blank",
  "Let's go swimming, _____?",
  None,"shall we",
  "【考点】考查Let's开头的祈使句的反意疑问句\n【解题思路】Let's开头的祈使句，反意疑问句用shall we\n【干扰项分析】注意Let's和Let us的反意疑问句不同\n【解题口诀】👉 Let's...用shall we? Let us...用will you?",
  "学生容易混淆Let's和Let us的反意疑问句","Let's = 包括听话人用shall we，Let us = 不包括听话人用will you",0.6)

q("en_j2_grammar_120","反意疑问句","I am的反意疑问句","multiple_choice",
  "I am right, _____?",
  ["A. am not I","B. aren't I","C. don't I","D. isn't it"],"B",
  "【考点】考查I am的反意疑问句\n【解题思路】I am的反意疑问句用aren't I（不是am not I，因为am not没有缩写形式amn't）\n【干扰项分析】A的am not I不存在这种说法；C的don't I与be动词不搭配；D的isn't it与I am不搭配\n【解题口诀】👉 I am就用aren't I?（特殊规则，只能用aren't）",
  "学生容易按常规规则写成am not I","I am特殊就用aren't I，这是英语中唯一不规则的",0.6)

# Write JSON file
output_path = "/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/questions_en_j2_grammar.json"
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(Q, f, ensure_ascii=False, indent=2)

print(f"Successfully generated {len(Q)} questions!")
print(f"File: {output_path}")
