#!/usr/bin/env python3
"""
修复英语听力题库的question字段。
根据每道题的options和listening_text反推生成有意义的question。
"""

import json

# ========== 初中听力题库 question 修复映射 ==========
# 格式: id -> 新的question值
j2_listen_questions = {
    "en_j2_listen_001": 
        "根据录音内容，对方请求做什么？\n\nAccording to the recording, what does the speaker ask the other person to do?",
    
    "en_j2_listen_002":
        "根据对话内容，说话人通常如何去上学？\n\nAccording to the conversation, how does the speaker usually go to school?",
    
    "en_j2_listen_003":
        "根据录音内容，他们打算明天做什么？\n\nAccording to the recording, what are they going to do tomorrow?",
    
    "en_j2_listen_004":
        "根据录音内容，关于她去北京的情况，哪个说法正确？\n\nAccording to the recording, which statement about her trip to Beijing is correct?",
    
    "en_j2_listen_005":
        "根据录音内容，天气正在发生什么变化？\n\nAccording to the recording, what is happening to the weather?",
    
    "en_j2_listen_006":
        "根据录音内容，妈妈要求说话人做什么？\n\nAccording to the recording, what did mother ask the speaker not to do?",
    
    "en_j2_listen_007":
        "根据录音内容，如果明天下雨会怎样？\n\nAccording to the recording, what will happen if it rains tomorrow?",
    
    "en_j2_listen_008":
        "根据录音内容，关于那个男孩和苹果，哪个说法正确？\n\nAccording to the recording, which statement about the boy and the apple is correct?",
    
    "en_j2_listen_009":
        "根据录音内容，英语和数学相比怎么样？\n\nAccording to the recording, how does English compare with math?",
    
    "en_j2_listen_010":
        "根据录音内容，老师告诉了我们什么客观事实？\n\nAccording to the recording, what fact did the teacher tell us?",
    
    "en_j2_listen_011":
        "根据对话内容，Lucy将怎么去奶奶家？\n\nAccording to the conversation, how will Lucy go to visit her grandma?",
    
    "en_j2_listen_012":
        "根据对话内容，邮局在哪里？\n\nAccording to the conversation, where is the post office?",
    
    "en_j2_listen_013":
        "根据对话内容，课程将在什么时候开始？\n\nAccording to the conversation, when will the class begin?",
    
    "en_j2_listen_014":
        "根据对话内容，Mike哪门考试没通过？\n\nAccording to the conversation, which exam did Mike fail?",
    
    "en_j2_listen_015":
        "根据对话内容，Anna最喜欢什么运动？\n\nAccording to the conversation, what sport does Anna like best?",
    
    "en_j2_listen_016":
        "根据对话内容，较便宜的那件T恤多少钱？\n\nAccording to the conversation, how much is the cheaper T-shirt?",
    
    "en_j2_listen_017":
        "根据对话内容，Lily借了什么样的书？\n\nAccording to the conversation, what kind of books did Lily borrow?",
    
    "en_j2_listen_018":
        "根据对话内容，班上有多少名女生？\n\nAccording to the conversation, how many girls are there in the class?",
    
    "en_j2_listen_019":
        "根据对话内容，Tom读的书是关于什么的？\n\nAccording to the conversation, what is Tom's book about?",
    
    "en_j2_listen_020":
        "根据对话内容，Jane为什么看起来很累？\n\nAccording to the conversation, why does Jane look tired?",
    
    "en_j2_listen_021":
        "根据对话内容，他们决定周末去做什么？\n\nAccording to the conversation, what have they decided to do this weekend?",
    
    "en_j2_listen_022":
        "根据对话内容，Mr. Green现在在哪里？\n\nAccording to the conversation, where is Mr. Green now?",
    
    "en_j2_listen_023":
        "根据对话内容，Peter在澳大利亚待了多久？\n\nAccording to the conversation, how long did Peter stay in Australia?",
    
    "en_j2_listen_024":
        "根据对话内容，Mary想喝什么？\n\nAccording to the conversation, what would Mary like to drink?",
    
    "en_j2_listen_025":
        "根据对话内容，Jack长大后想成为什么？\n\nAccording to the conversation, what does Jack want to be when he grows up?",
    
    "en_j2_listen_026":
        "根据对话内容，去医院应该怎么走？\n\nAccording to the conversation, how can we get to the nearest hospital?",
    
    "en_j2_listen_027":
        "根据对话内容，那位女士看过这部电影几次了？\n\nAccording to the conversation, how many times has the lady watched the movie?",
    
    "en_j2_listen_028":
        "根据对话内容，Lisa的生日是什么时候？\n\nAccording to the conversation, when is Lisa's birthday?",
    
    "en_j2_listen_029":
        "根据对话内容，Bob上周末做了什么？\n\nAccording to the conversation, what did Bob do last weekend?",
    
    "en_j2_listen_030":
        "根据对话内容，Amy为什么没参加昨晚的聚会？\n\nAccording to the conversation, why didn't Amy come to the party last night?",
    
    # 判断题 - 已有具体statement，优化question使其更有意义
    "en_j2_listen_031":
        "根据短文内容，李明住在中国的南方还是北方？\n\nAccording to the passage, does Li Ming live in the south or north of China?",
    
    "en_j2_listen_032":
        "根据短文内容，李明最喜欢哪个季节？\n\nAccording to the passage, which season does Li Ming like best?",
    
    "en_j2_listen_033":
        "根据短文内容，李明的妹妹多大？\n\nAccording to the passage, how old is Li Ming's sister?",
    
    "en_j2_listen_034":
        "根据短文内容，Tom什么时候去了公园？\n\nAccording to the passage, when did Tom go to the park?",
    
    "en_j2_listen_035":
        "根据短文内容，他们踢了多长时间足球？\n\nAccording to the passage, how long did they play football?",
    
    "en_j2_listen_036":
        "根据短文内容，步行上学是最受欢迎的方式吗？\n\nAccording to the passage, is walking the most popular way to go to school?",
    
    "en_j2_listen_037":
        "根据短文内容，有些学生为什么骑自行车上学？\n\nAccording to the passage, why do some students ride bicycles to school?",
    
    "en_j2_listen_038":
        "根据短文内容，每个人最多可以参加几项活动？\n\nAccording to the passage, how many events can each person take part in at most?",
    
    "en_j2_listen_039":
        "根据短文内容，运动会将在哪里举行？\n\nAccording to the passage, where will the sports meet be held?",
    
    "en_j2_listen_040":
        "根据短文内容，大熊猫只生活在四川省吗？\n\nAccording to the passage, do pandas only live in Sichuan Province?",
    
    "en_j2_listen_041":
        "根据短文内容，王伟最擅长什么科目？\n\nAccording to the passage, what subject is Wang Wei best at?",
    
    "en_j2_listen_042":
        "根据短文内容，过度使用手机会导致什么问题？\n\nAccording to the passage, what problem can using mobile phones too much cause?",
    
    "en_j2_listen_043":
        "根据短文内容，作者一家在海南待了多久？\n\nAccording to the passage, how long did the family stay in Hainan?",
    
    "en_j2_listen_044":
        "根据短文内容，美术社团每周几开放？\n\nAccording to the passage, on which day is the art club open?",
    
    "en_j2_listen_045":
        "根据短文内容，青少年每晚至少需要多少小时睡眠？\n\nAccording to the passage, how many hours of sleep do teenagers need at least per night?",
    
    "en_j2_listen_046":
        "根据短文内容，西湖以什么而闻名？\n\nAccording to the passage, what is the West Lake known for?",
    
    "en_j2_listen_047":
        "根据短文内容，这篇短文主要讲的是什么？\n\nAccording to the passage, what is the main idea of this text?",
    
    "en_j2_listen_048":
        "根据短文内容，Emma学中文多久了？\n\nAccording to the passage, how long has Emma been learning Chinese?",
    
    "en_j2_listen_049":
        "根据短文内容，学生们看望老人后感觉如何？\n\nAccording to the passage, how did the students feel after visiting the old people?",
    
    "en_j2_listen_050":
        "根据短文内容，学生早上必须在几点前到达学校？\n\nAccording to the passage, before what time must students arrive at school in the morning?",
    
    # 词汇运用题
    "en_j2_listen_051":
        "根据录音内容，说话人早餐通常吃什么？\n\nAccording to the recording, what does the speaker usually have for breakfast?",
    
    "en_j2_listen_052":
        "根据录音内容，我们应该做什么？\n\nAccording to the recording, what should we do?",
    
    "en_j2_listen_053":
        "根据录音内容，那部电影怎么样？\n\nAccording to the recording, how was the film?",
    
    "en_j2_listen_054":
        "根据录音内容，爸爸经常怎样送说话人去学校？\n\nAccording to the recording, how does father often take the speaker to school?",
    
    "en_j2_listen_055":
        "根据录音内容，明天天气将会怎样？\n\nAccording to the recording, what will the weather be like tomorrow?",
    
    "en_j2_listen_056":
        "根据录音内容，对方要求说话人怎样做？\n\nAccording to the recording, how does the other person ask the speaker to speak?",
    
    "en_j2_listen_057":
        "根据录音内容，说话人去过长城吗？\n\nAccording to the recording, has the speaker been to the Great Wall?",
    
    "en_j2_listen_058":
        "根据录音内容，外面天气如何？\n\nAccording to the recording, how is the weather outside?",
    
    "en_j2_listen_059":
        "根据录音内容，我们应该怎么做来保护地球？\n\nAccording to the recording, what should we do to protect the earth?",
    
    "en_j2_listen_060":
        "根据录音内容，老师要求学生对课文做什么？\n\nAccording to the recording, what did the teacher ask the students to do in the text?",
}

# ========== 小学听力题库 question 修复映射 ==========
# 小学的题目很多已经有比较具体的question（听音选图、听单词等），
# 但有些仍需优化使其更具体
listen_questions = {
    # 听音选题 - 已有基本格式，优化为更具体的问题
    "en_listen_001":
        "根据录音内容，说话人的书包是什么颜色的？\n\nAccording to the recording, what color is the speaker's schoolbag?",
    
    "en_listen_002":
        "根据录音内容，数学老师是什么样的人？\n\nAccording to the recording, what is the math teacher like?",
    
    # 判断题 - 已有格式但可更具体
    "en_listen_003":
        "根据对话内容，她们星期三有美术课吗？\n\nAccording to the conversation, do they have art class on Wednesdays?",
    
    # 排序/填空题 - 保持原有合理描述
    "en_listen_004": None,  # 排序题，原question已合适
    
    "en_listen_005":
        "根据短文内容，Amy最喜欢的季节是什么？\n\nAccording to the passage, what is Amy's favorite season?",
    
    "en_listen_006":
        "根据录音内容，狗在什么地方睡觉？\n\nAccording to the recording, where is the dog sleeping?",
    
    "en_listen_007":
        "根据对话内容，对于对方的邀请，应该如何回答？\n\nAccording to the conversation, how should you respond to the invitation?",
    
    "en_listen_008":
        "根据录音内容，说话人家里有几口人？\n\nAccording to the recording, how many people are there in the speaker's family?",
    
    "en_listen_009": None,  # 填空题语法题，原格式合适
    
    "en_listen_010": None,  # 排序题
    
    "en_listen_011":
        "根据录音内容，说话人的叔叔是做什么工作的？在哪里工作？\n\nAccording to the recording, what is the speaker's uncle? Where does he work?",
    
    "en_listen_012":
        "根据录音内容，今天天气如何？\n\nAccording to the recording, how is the weather today?",
    
    "en_listen_013":
        "根据对话内容，Lily会游泳吗？\n\nAccording to the conversation, can Lily swim?",
    
    "en_listen_014": None,  # 排序题
    
    "en_listen_015":
        "根据短文内容，猫是什么颜色的？\n\nAccording to the passage, what color is the cat?",
    
    "en_listen_016":
        "根据录音内容，男孩在公园里做什么？\n\nAccording to the recording, what is the boy doing in the park?",
    
    "en_listen_017":
        "根据对话内容，说话人怎样去上学？\n\nAccording to the conversation, how does the speaker go to school?",
    
    "en_listen_018":
        "根据录音内容，今天为什么起得比平时晚？\n\nAccording to the recording, why did the speaker get up later than usual today?",
    
    "en_listen_019": None,  # 填空语法题
    
    "en_listen_020": None,  # 排序题
    
    "en_listen_021":
        "根据录音内容，猫睡在哪里？\n\nAccording to the recording, where is the cat sleeping?",
    
    "en_listen_022":
        "根据录音内容，说话人的叔叔是什么职业？\n\nAccording to the recording, what is the speaker's uncle's job?",
    
    "en_listen_023":
        "根据对话内容，Amy最喜欢哪个季节？\n\nAccording to the conversation, which season does Amy like best?",
    
    "en_listen_024": None,  # 排序题
    
    "en_listen_025":
        "根据短文内容，房间里有一个什么样的大家具用来放书和玩具？\n\nAccording to the passage, what big piece of furniture is in the room for books and toys?",
    
    "en_listen_026":
        "根据录音内容，说话人通常怎样去动物园？\n\nAccording to the recording, how does the speaker usually go to the zoo?",
    
    "en_listen_027":
        "根据对话内容，对方问的是什么？应如何回答？\n\nAccording to the conversation, what question was asked? How to respond?",
    
    "en_listen_028":
        "根据录音内容，博物馆周末开放吗？\n\nAccording to the recording, is the museum open on weekends?",
    
    "en_listen_029": None,  # 填空语法题
    
    "en_listen_030": None,  # 排序题
    
    "en_listen_031":
        "根据录音内容，男孩穿着什么样的衣服？\n\nAccording to the recording, what clothes is the boy wearing?",
    
    "en_listen_032":
        "根据录音内容，说话人哪里不舒服？\n\nAccording to the recording, what's wrong with the speaker?",
    
    "en_listen_033":
        "根据对话内容，说话人周末几点起床？\n\nAccording to the conversation, what time does the speaker get up on weekends?",
    
    "en_listen_034": None,  # 排序题
    
    "en_listen_035":
        "根据短文内容，说话人的生日在哪个月？\n\nAccording to the passage, which month is the speaker's birthday in?",
    
    "en_listen_036":
        "根据录音内容，电影院的位置在哪里？\n\nAccording to the recording, where is the cinema located?",
    
    "en_listen_037":
        "根据对话内容，对方问的是妈妈的什么？应如何回答？\n\nAccording to the conversation, what was asked about mother? How to respond?",
    
    "en_listen_038":
        "根据录音内容，公园里的河上可以划船吗？\n\nAccording to the recording, can you go boating on the river in the park?",
    
    "en_listen_039": None,  # 填空语法题
    
    "en_listen_040": None,  # 排序题
    
    "en_listen_041":
        "根据录音内容，说话人想吃什么？\n\nAccording to the recording, what would the speaker like to eat?",
    
    "en_listen_042":
        "根据录音内容，英语老师是个什么样的人？\n\nAccording to the recording, what is the English teacher like?",
    
    "en_listen_043":
        "根据对话内容，说话人会弹钢琴吗？\n\nAccording to the conversation, can the speaker play the piano?",
    
    "en_listen_044": None,  # 排序题
    
    "en_listen_045":
        "根据短文内容，说话人住在什么地方？\n\nAccording to the passage, where does the speaker live?",
    
    "en_listen_046":
        "根据录音内容，银行在哪里？\n\nAccording to the recording, where is the bank?",
    
    "en_listen_047":
        "根据对话内容，对方问的是什么？应如何回答？\n\nAccording to the conversation, what was asked? How to respond?",
    
    "en_listen_048":
        "根据录音内容，Sarah比她姐姐高还是矮？\n\nAccording to the recording, is Sarah taller or shorter than her sister?",
    
    "en_listen_049": None,  # 填空语法题
    
    "en_listen_050":
        "根据短文内容，明天的天气将会怎样？\n\nAccording to the passage, what will the weather be like tomorrow?",
}


def fix_questions(filepath, questions_map, file_label):
    """修复指定文件的question字段"""
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    count = 0
    for item in data:
        qid = item.get('id', '')
        if qid in questions_map and questions_map[qid] is not None:
            old_q = item['question']
            item['question'] = questions_map[qid]
            count += 1
            print(f"  [{file_label}] {qid}: FIXED")
        elif qid not in questions_map:
            print(f"  [{file_label}] {qid}: SKIPPED (no mapping, question='{item.get('question', '')[:30]}...')")
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    return count


# 处理初中听力题库
print("=== 处理初中听力题库 ===")
j2_count = fix_questions(
    '/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/questions_en_j2_listen.json',
    j2_listen_questions,
    'J2'
)
print(f"\n初中听力共修复 {j2_count} 题\n")

# 处理小学听力题库
print("=== 处理小学听力题库 ===")
ps_count = fix_questions(
    '/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/questions_en_listen.json',
    listen_questions,
    'PS'
)
print(f"\n小学听力共修复 {ps_count} 题\n")

# 验证JSON合法性
print("=== 验证JSON合法性 ===")
for label, path in [
    ('初中听力', '/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/questions_en_j2_listen.json'),
    ('小学听力', '/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/questions_en_listen.json')
]:
    try:
        with open(path, 'r', encoding='utf-8') as f:
            d = json.load(f)
        print(f"{label} ({path.split('/')[-1]}): OK - 共{len(d)}道题")
    except Exception as e:
        print(f"{label}: ERROR - {e}")

print(f"\n总计修复: {j2_count + ps_count} 道题")
