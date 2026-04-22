#!/usr/bin/env python3
"""
Add 20 English writing questions (en_writing_021..040) and
30 English listening questions (en_listen_051..080) to the question banks.
"""

import json
from pathlib import Path

WRITING_PATH = Path("/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/questions_en_writing.json")
LISTENING_PATH = Path("/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/questions_en_listen.json")

# ── New Writing Questions ──────────────────────────────────────────────
new_writing = [
    # ──────── 1. Email writing (4) ────────
    {
        "id": "en_writing_021",
        "subject": "english",
        "knowledge_tag": "英语写作",
        "ability_tag": "邮件：给笔友写邮件",
        "type": "fill_blank",
        "question": "根据提示写一封40-60词的电子邮件。\n\n提示：你是Li Hua，你有一个英国笔友Tom。请给他写一封邮件，介绍你的学校生活。内容包括：学校名称、每天有几节课、最喜欢的课及原因、放学后的活动。",
        "options": [],
        "answer": "Dear Tom,\nHow are you? Let me tell you about my school life. I study at Sunshine Primary School. I have six classes every day. My favorite class is English because it is fun. After school, I often play table tennis with my friends.\nPlease write back soon.\nYours,\nLi Hua",
        "analysis": "【考点】本题考查邮件格式和介绍学校生活的写作。\n【解题思路】邮件格式：称呼（Dear...）+ 正文 + 结束语 + 签名。正文按提示要点逐一展开：学校名称、课程数量、最喜欢的课及原因、课后活动。\n【总结】写邮件要注意格式完整，正文覆盖所有提示要点，语言简洁自然。",
        "difficulty": 0.7
    },
    {
        "id": "en_writing_022",
        "subject": "english",
        "knowledge_tag": "英语写作",
        "ability_tag": "邮件：给老师写邮件",
        "type": "fill_blank",
        "question": "根据提示写一封30-50词的电子邮件。\n\n提示：你是Wang Ming，你明天要参加学校运动会，不能上英语课。请给英语老师Miss Li写邮件请假，并表示课后会补上作业。",
        "options": [],
        "answer": "Dear Miss Li,\nI am Wang Ming. I will take part in the school sports meeting tomorrow. So I cannot come to your English class. I am sorry about that. I will do the homework after the sports meeting. Thank you for understanding.\nYours,\nWang Ming",
        "analysis": "【考点】本题考查邮件格式和请假表达。\n【解题思路】先自我介绍，再说明缺席原因（参加运动会），最后表示歉意和补救措施（补作业）。\n【总结】给老师写邮件语气要礼貌，说明原因要清楚，态度要诚恳。常用句型：I cannot come to... I will do...",
        "difficulty": 0.7
    },
    {
        "id": "en_writing_023",
        "subject": "english",
        "knowledge_tag": "英语写作",
        "ability_tag": "邮件：给朋友写邮件介绍假期",
        "type": "fill_blank",
        "question": "根据提示写一封40-60词的电子邮件。\n\n提示：你是Chen Jie，暑假你去了北京旅行。给你的好朋友Lily写一封邮件，告诉她你去了哪些地方、吃了什么、感觉怎么样。",
        "options": [],
        "answer": "Dear Lily,\nHow was your summer vacation? I went to Beijing with my family. I visited the Great Wall and the Palace Museum. They were amazing! I also ate Peking duck. It was delicious. I had a wonderful time. I hope we can go together next time.\nWrite to me soon!\nYours,\nChen Jie",
        "analysis": "【考点】本题考查邮件格式和描述旅行经历。\n【解题思路】先问候对方假期情况，再用过去时描述旅行（去了哪里、看了什么、吃了什么），最后表达感受和期望。\n【总结】描述旅行经历用一般过去时，常用句型：I went to... I visited... I ate... It was delicious/amazing.",
        "difficulty": 0.7
    },
    {
        "id": "en_writing_024",
        "subject": "english",
        "knowledge_tag": "英语写作",
        "ability_tag": "邮件：给笔友回邮件介绍中国节日",
        "type": "fill_blank",
        "question": "根据提示写一封40-60词的电子邮件。\n\n提示：你的美国笔友Jack想了解中国的春节。请你给他写一封邮件，介绍春节的时间、人们吃什么、做什么活动。要求用简单易懂的英语。",
        "options": [],
        "answer": "Dear Jack,\nThe Spring Festival is the most important festival in China. It is usually in January or February. Before the festival, we clean our houses. On New Year's Eve, we have a big dinner. We eat dumplings and fish. Children get red packets with money. We watch fireworks at night. It is a happy time.\nYours,\nLi Hua",
        "analysis": "【考点】本题考查邮件格式和介绍中国传统节日。\n【解题思路】按要点写：节日名称和重要性、时间、节前准备、年夜饭、食物、活动、感受。\n【总结】介绍节日类作文结构：when + what to eat + what to do + feelings。注意面向外国读者，用简单语言。",
        "difficulty": 0.7
    },

    # ──────── 2. Picture description (4) ────────
    {
        "id": "en_writing_025",
        "subject": "english",
        "knowledge_tag": "英语写作",
        "ability_tag": "看图写话：描述教室场景",
        "type": "fill_blank",
        "question": "根据图片信息，用4-6句话写一段短文。\n\n图片描述：一间教室里，老师站在讲台前写板书，黑板上有英文单词。下面坐着十几个学生，有的在认真听讲，有的在举手。窗户开着，阳光照进来。",
        "options": [],
        "answer": "This is a classroom. The teacher is standing at the front. She is writing English words on the blackboard. The students are sitting at their desks. Some are listening carefully. Some are raising their hands. The sun is shining through the window. It looks like a good lesson.",
        "analysis": "【考点】本题考查描述室内场景和人物活动的能力。\n【解题思路】先写场景（教室），再写老师的动作，接着写学生的反应，最后补充环境细节。\n【总结】描述教室场景常用现在进行时，先整体后局部，注意人物动作的多样性表达。",
        "difficulty": 0.5
    },
    {
        "id": "en_writing_026",
        "subject": "english",
        "knowledge_tag": "英语写作",
        "ability_tag": "看图写话：描述家庭合照",
        "type": "fill_blank",
        "question": "根据图片信息，用4-6句话写一段短文。\n\n图片描述：一张家庭合照，客厅里，爸爸坐在沙发上看报纸，妈妈端着一盘水果，小男孩在逗一只小狗，小女孩在看图画书。",
        "options": [],
        "answer": "This is a family photo. They are in the living room. The father is reading a newspaper on the sofa. The mother is carrying a plate of fruit. The boy is playing with a little dog. The girl is reading a picture book. They look very happy.",
        "analysis": "【考点】本题考查描述家庭活动和人物动作的能力。\n【解题思路】先说明图片类型和地点，再逐一描述每个人的动作，最后写整体感受。\n【总结】描述照片常用现在进行时（is doing），表示照片中正在发生的场景。",
        "difficulty": 0.5
    },
    {
        "id": "en_writing_027",
        "subject": "english",
        "knowledge_tag": "英语写作",
        "ability_tag": "看图写话：描述操场活动",
        "type": "fill_blank",
        "question": "根据图片信息，用4-6句话写一段短文。\n\n图片描述：学校操场上，一群学生正在上体育课。两个男孩在打篮球，三个女孩在跳绳，一个男孩在跑步，远处有一栋教学楼。",
        "options": [],
        "answer": "The students are having a P.E. class on the playground. Two boys are playing basketball. Three girls are jumping rope. A boy is running. There is a teaching building in the background. Everyone is having fun.",
        "analysis": "【考点】本题考查描述操场活动和运动项目的能力。\n【解题思路】先写场景（体育课、操场），再分别描述不同运动，最后写感受。\n【总结】运动类词汇：play basketball, jump rope, run, play football。注意数字和复数的搭配。",
        "difficulty": 0.3
    },
    {
        "id": "en_writing_028",
        "subject": "english",
        "knowledge_tag": "英语写作",
        "ability_tag": "看图写话：描述超市购物",
        "type": "fill_blank",
        "question": "根据图片信息，用4-6句话写一段短文。\n\n图片描述：超市里，一位妈妈推着购物车，车里有一些牛奶、面包和苹果。旁边的小女孩指着货架上的巧克力。收银台前排着几个人。",
        "options": [],
        "answer": "A mother and her daughter are in the supermarket. The mother is pushing a shopping cart. There is milk, bread and apples in the cart. The little girl is pointing at some chocolate on the shelf. Some people are waiting at the checkout. They are doing some shopping.",
        "analysis": "【考点】本题考查描述购物场景的能力。\n【解题思路】先写场景（超市）和人物，再描述购物车的物品、小女孩的动作，最后写收银台。\n【总结】购物类词汇：shopping cart, shelf, checkout, push, point at。物品用there is/are表达。",
        "difficulty": 0.5
    },

    # ──────── 3. Diary entry (4) ────────
    {
        "id": "en_writing_029",
        "subject": "english",
        "knowledge_tag": "英语写作",
        "ability_tag": "日记：一次春游",
        "type": "fill_blank",
        "question": "根据提示写一篇40-60词的日记。\n\n提示：今天是4月15日，星期六，天气晴朗。学校组织去植物园春游。你看到了很多花和蝴蝶，和同学们一起野餐，拍了很多照片。你感到很开心。",
        "options": [],
        "answer": "April 15th  Saturday  Sunny\nToday we went to the Botanical Garden for a spring trip. The weather was warm and nice. I saw many beautiful flowers and butterflies. We had a picnic on the grass. I took a lot of photos with my classmates. It was a wonderful day. I felt very happy.",
        "analysis": "【考点】本题考查日记格式和描述户外活动。\n【解题思路】日记格式：日期 + 星期 + 天气。正文用过去时，按时间顺序描述：去了哪里、看到了什么、做了什么、感受。\n【总结】日记第一行写日期和天气，正文常用一般过去时。春游类词汇：spring trip, picnic, take photos, flowers, butterflies。",
        "difficulty": 0.5
    },
    {
        "id": "en_writing_030",
        "subject": "english",
        "knowledge_tag": "英语写作",
        "ability_tag": "日记：学骑自行车",
        "type": "fill_blank",
        "question": "根据提示写一篇40-60词的日记。\n\n提示：今天是5月3日，星期日，多云。今天爸爸教你学骑自行车。一开始你摔了好几次，很害怕。但爸爸鼓励你不要放弃。最后你终于学会了。你感到很自豪。",
        "options": [],
        "answer": "May 3rd  Sunday  Cloudy\nToday Dad taught me to ride a bike. At first, I fell down many times. I was afraid. But Dad said, 'Don't give up!' I tried again and again. Finally, I could ride by myself. I was so proud of myself. Thank you, Dad!",
        "analysis": "【考点】本题考查日记格式和描述学习经历。\n【解题思路】先写日期天气，再按过程描述：开始（摔倒）→ 中间（害怕、爸爸鼓励）→ 结果（学会）→ 感受（自豪）。\n【总结】描述学习过程要体现变化：at first → but → finally。情感词：afraid, proud, happy, excited。",
        "difficulty": 0.5
    },
    {
        "id": "en_writing_031",
        "subject": "english",
        "knowledge_tag": "英语写作",
        "ability_tag": "日记：一个特别的生日",
        "type": "fill_blank",
        "question": "根据提示写一篇40-60词的日记。\n\n提示：今天是9月10日，星期六，天气晴。今天是你11岁生日。妈妈做了一个大蛋糕，爸爸送了你一本故事书。朋友们来你家一起唱生日歌、吃蛋糕、玩 games。这是你最开心的生日。",
        "options": [],
        "answer": "September 10th  Saturday  Sunny\nToday is my 11th birthday! Mom made a big cake for me. Dad gave me a storybook as a gift. My friends came to my home in the afternoon. We sang the birthday song, ate cake and played games together. This is the happiest birthday I have ever had!",
        "analysis": "【考点】本题考查日记格式和描述生日活动。\n【解题思路】先写日期天气和生日信息，再描述收到的礼物、朋友来访和活动，最后表达感受。\n【总结】生日类词汇：birthday cake, gift/present, sing the birthday song, blow out candles。常用最高级表达最开心的感受。",
        "difficulty": 0.3
    },
    {
        "id": "en_writing_032",
        "subject": "english",
        "knowledge_tag": "英语写作",
        "ability_tag": "日记：帮助别人",
        "type": "fill_blank",
        "question": "根据提示写一篇40-60词的日记。\n\n提示：今天是3月5日，星期三，天气晴。放学路上，你看到一位老奶奶过马路很困难。你主动帮助她安全过了马路。老奶奶夸你是个好孩子。你感到帮助别人很快乐。",
        "options": [],
        "answer": "March 5th  Wednesday  Sunny\nOn my way home from school, I saw an old grandma. She had difficulty crossing the road. I went to help her. I held her hand and we crossed the road safely. She said I was a good child. I felt very happy. Helping others makes me happy.",
        "analysis": "【考点】本题考查日记格式和描述好人好事。\n【解题思路】先写日期天气，再描述经过（看到困难 → 主动帮助 → 对方感谢 → 个人感受）。\n【总结】好人好事类日记结构：场景 + 问题 + 行动 + 结果 + 感受。常用句型：I saw... I went to help... Helping others makes me happy.",
        "difficulty": 0.5
    },

    # ──────── 4. Invitation/card (4) ────────
    {
        "id": "en_writing_033",
        "subject": "english",
        "knowledge_tag": "英语写作",
        "ability_tag": "邀请函：新年派对",
        "type": "fill_blank",
        "question": "根据提示写一封40-50词的邀请函。\n\n提示：你是Liu Tao，下周五晚上6点在你家举办新年派对。邀请你的朋友Peter来参加。派对上有唱歌、游戏和美食。请他回复是否能来。",
        "options": [],
        "answer": "Dear Peter,\nI am going to have a New Year party at my home. It will start at 6:00 p.m. next Friday. We will sing songs, play games and eat delicious food. I hope you can come! Please tell me if you can make it.\nYours,\nLiu Tao",
        "analysis": "【考点】本题考查邀请函格式和新年派对表达。\n【解题思路】邀请函要素：称呼 + 活动名称 + 时间地点 + 活动内容 + 请求回复 + 签名。\n【总结】邀请函常用句型：I am going to have... It will start at... We will... I hope you can come! Please tell me if...",
        "difficulty": 0.5
    },
    {
        "id": "en_writing_034",
        "subject": "english",
        "knowledge_tag": "英语写作",
        "ability_tag": "贺卡：教师节贺卡",
        "type": "fill_blank",
        "question": "根据提示写一张20-40词的教师节贺卡。\n\n提示：写给你的英语老师Miss Wang，感谢她教你英语，祝她教师节快乐。",
        "options": [],
        "answer": "Dear Miss Wang,\nHappy Teacher's Day! Thank you for teaching me English. Your classes are always fun and interesting. You are kind and patient. I like you very much. I wish you health and happiness.\nYour student,\nLi Ming",
        "analysis": "【考点】本题考查贺卡格式和感恩表达。\n【解题思路】贺卡格式：称呼 + 祝福语 + 感谢内容 + 署名。语言要真诚简洁。\n【总结】贺卡常用表达：Happy Teacher's Day! / Thank you for... / I wish you... 注意贺卡语气要温馨。",
        "difficulty": 0.3
    },
    {
        "id": "en_writing_035",
        "subject": "english",
        "knowledge_tag": "英语写作",
        "ability_tag": "贺卡：圣诞节贺卡",
        "type": "fill_blank",
        "question": "根据提示写一张20-40词的圣诞贺卡。\n\n提示：写给你的好朋友Amy，祝她圣诞快乐、新年快乐，希望她假期玩得开心。",
        "options": [],
        "answer": "Dear Amy,\nMerry Christmas and Happy New Year! I hope you have a wonderful holiday. Let's play together after the holiday. Best wishes to you and your family.\nYour friend,\nLily",
        "analysis": "【考点】本题考查圣诞贺卡格式和节日祝福。\n【解题思路】贺卡格式：称呼 + 节日祝福 + 假期祝愿 + 结束语 + 署名。\n【总结】圣诞祝福常用：Merry Christmas! / Happy New Year! / Best wishes! / I hope you have a wonderful holiday!",
        "difficulty": 0.3
    },
    {
        "id": "en_writing_036",
        "subject": "english",
        "knowledge_tag": "英语写作",
        "ability_tag": "邀请函：英语角活动",
        "type": "fill_blank",
        "question": "根据提示写一封30-50词的邀请函。\n\n提示：学校英语角本周五下午4点在操场举行活动，主题是'My Hometown'。你是英语角的负责人Sun Yang，邀请同学们来参加，可以用英语演讲或唱歌。",
        "options": [],
        "answer": "Dear classmates,\nOur English Corner will have a special activity this Friday at 4:00 p.m. on the playground. The topic is 'My Hometown.' You can give a speech or sing a song in English. Everyone is welcome! Please come and join us.\nSun Yang",
        "analysis": "【考点】本题考查活动邀请函格式和表达。\n【解题思路】邀请函要素：活动名称 + 时间地点 + 主题 + 参与方式 + 欢迎语 + 发件人。\n【总结】活动邀请函常用句型：will have a special activity + 时间 + 地点 + 主题 + Everyone is welcome!",
        "difficulty": 0.5
    },

    # ──────── 5. Opinion paragraph (4) ────────
    {
        "id": "en_writing_037",
        "subject": "english",
        "knowledge_tag": "英语写作",
        "ability_tag": "表达观点：我最喜欢的食物",
        "type": "fill_blank",
        "question": "以\"My Favorite Food\"为题，写一篇40-60词的短文。内容包括：你最喜欢的食物是什么、它是什么样的、你为什么喜欢它、你通常什么时候吃。",
        "options": [],
        "answer": "My Favorite Food\nMy favorite food is dumplings. They look like small white boats. My mother often makes dumplings for me on weekends. I like dumplings because they are delicious. We can put different fillings inside, like meat and vegetables. I can eat a lot of dumplings at one time!",
        "analysis": "【考点】本题考查表达食物偏好的短文写作。\n【解题思路】按要点写：食物名称 + 外观描述 + 什么时候吃 + 为什么喜欢 + 补充细节。\n【总结】食物类词汇：delicious, taste, filling, cook, boil。表达偏好：My favorite food is... I like... because...",
        "difficulty": 0.3
    },
    {
        "id": "en_writing_038",
        "subject": "english",
        "knowledge_tag": "英语写作",
        "ability_tag": "表达观点：我最喜欢的运动",
        "type": "fill_blank",
        "question": "以\"My Favorite Sport\"为题，写一篇40-60词的短文。内容包括：你最喜欢的运动是什么、你多久做一次、和谁一起做、这项运动给你带来什么好处。",
        "options": [],
        "answer": "My Favorite Sport\nMy favorite sport is swimming. I go swimming twice a week. I usually go with my father. Swimming is good for my health. It makes me strong. I also feel relaxed after swimming. In summer, I go swimming more often because it is hot. I want to be a good swimmer one day.",
        "analysis": "【考点】本题考查表达运动偏好的短文写作。\n【解题思路】按要点写：运动名称 + 频率 + 伙伴 + 好处 + 愿望。\n【总结】运动类常用表达：good for health, make me strong, feel relaxed。频率表达：every day, twice a week, three times a month。",
        "difficulty": 0.5
    },
    {
        "id": "en_writing_039",
        "subject": "english",
        "knowledge_tag": "英语写作",
        "ability_tag": "表达观点：我最喜欢的动物",
        "type": "fill_blank",
        "question": "以\"My Favorite Animal\"为题，写一篇40-60词的短文。内容包括：你最喜欢的动物是什么、它的外貌特征、它的生活习性、你为什么喜欢它。",
        "options": [],
        "answer": "My Favorite Animal\nMy favorite animal is the dolphin. Dolphins are grey and very clever. They live in the sea. They can swim very fast and jump high out of the water. They like to play with each other. I like dolphins because they are friendly and cute. I hope I can see real dolphins one day.",
        "analysis": "【考点】本题考查描述动物和表达偏好的短文写作。\n【解题思路】按要点写：动物名称 + 外貌 + 生活习性（住哪里、能做什么）+ 喜欢的原因。\n【总结】动物描述常用：colour, clever/cute/friendly, live in, can do。表达原因用because。",
        "difficulty": 0.5
    },
    {
        "id": "en_writing_040",
        "subject": "english",
        "knowledge_tag": "英语写作",
        "ability_tag": "表达观点：电脑对小学生好不好",
        "type": "fill_blank",
        "question": "以\"Computers and Us\"为题，写一篇40-60词的短文。要求表达你的观点：电脑对小学生是好处多还是坏处多？给出至少一个理由。也可以写写你是怎么使用电脑的。",
        "options": [],
        "answer": "Computers and Us\nI think computers are very useful for us. We can use them to study and find information. I use the computer to learn English on weekends. But we should not spend too much time on computers. Playing computer games too much is bad for our eyes. We should use computers wisely.",
        "analysis": "【考点】本题考查表达观点和论证的短文写作。\n【解题思路】先表明观点（有用），再举例说明（学习、查资料），然后提出反面（不能玩太久），最后总结（明智使用）。\n【总结】表达观点类作文结构：I think... + 理由 + 反面考虑 + 总结。常用连接词：but, however, should。",
        "difficulty": 0.7
    },
]

# ── New Listening Questions ────────────────────────────────────────────
new_listening = [
    # ──────── 1. Short conversations (10) ────────
    {
        "id": "en_listen_051",
        "subject": "english",
        "knowledge_tag": "英语听力",
        "ability_tag": "听对话回答问题",
        "type": "multiple_choice",
        "question": "听对话，回答问题：男孩今天为什么迟到了？\n\nListen to the dialogue. Why was the boy late today?",
        "listening_text": "Girl: You're late today, Tom.\nBoy: I'm sorry. My bike was broken, so I walked to school.",
        "options": [
            "A. 他起晚了",
            "B. 他的自行车坏了",
            "C. 他错过了公交车",
            "D. 他路上堵车了"
        ],
        "answer": "B",
        "analysis": "【考点】本题考查听对话捕捉原因信息。\n【解题思路】男孩说 My bike was broken（自行车坏了），所以步行上学导致迟到。\n【总结】听对话找原因时注意 so, because 等连接词，后面的内容就是原因。",
        "difficulty": 0.3
    },
    {
        "id": "en_listen_052",
        "subject": "english",
        "knowledge_tag": "英语听力",
        "ability_tag": "听对话回答问题",
        "type": "multiple_choice",
        "question": "听对话，回答问题：女孩想买什么给妈妈？\n\nListen to the dialogue. What does the girl want to buy for her mother?",
        "listening_text": "Boy: What are you doing, Lily?\nGirl: I'm looking for a present for my mother. Tomorrow is Mother's Day.\nBoy: How about some flowers?\nGirl: Good idea! I'll buy some red roses.",
        "options": [
            "A. 一条围巾",
            "B. 一本书",
            "C. 一些玫瑰花",
            "D. 一个蛋糕"
        ],
        "answer": "C",
        "analysis": "【考点】本题考查听对话捕捉物品信息。\n【解题思路】女孩最终决定买 red roses（红玫瑰）作为母亲节礼物。\n【总结】听对话购物类题目，注意最终决定买什么，不要被中间的建议混淆。",
        "difficulty": 0.3
    },
    {
        "id": "en_listen_053",
        "subject": "english",
        "knowledge_tag": "英语听力",
        "ability_tag": "听对话回答问题",
        "type": "multiple_choice",
        "question": "听对话，回答问题：他们打算什么时候去图书馆？\n\nListen to the dialogue. When are they going to the library?",
        "listening_text": "Girl: Would you like to go to the library with me, Mike?\nBoy: Sure! When shall we go?\nGirl: How about Saturday morning?\nBoy: Sorry, I have a piano lesson on Saturday morning. Let's go on Sunday.\nGirl: OK. See you on Sunday.",
        "options": [
            "A. 周六上午",
            "B. 周六下午",
            "C. 周日上午",
            "D. 周日下午"
        ],
        "answer": "C",
        "analysis": "【考点】本题考查听对话捕捉时间变化。\n【解题思路】女孩先提议 Saturday morning，但男孩因为有钢琴课拒绝了，最终确定 Sunday。\n【总结】对话中时间可能改变，要听完整对话，注意最终确定的时间。",
        "difficulty": 0.5
    },
    {
        "id": "en_listen_054",
        "subject": "english",
        "knowledge_tag": "英语听力",
        "ability_tag": "听对话回答问题",
        "type": "multiple_choice",
        "question": "听对话，回答问题：男孩最喜欢的科目是什么？\n\nListen to the dialogue. What is the boy's favorite subject?",
        "listening_text": "Girl: What's your favorite subject, Peter?\nBoy: I like science best. We can do experiments in the lab. It's very interesting.\nGirl: I like math. I think it's fun to solve problems.",
        "options": [
            "A. 数学",
            "B. 英语",
            "C. 科学",
            "D. 音乐"
        ],
        "answer": "C",
        "analysis": "【考点】本题考查听对话分辨不同人的喜好。\n【解题思路】男孩说 I like science best，女孩说 I like math。题目问男孩，所以选 science。\n【总结】对话中可能出现两个不同的喜好，要注意题目问的是谁。",
        "difficulty": 0.3
    },
    {
        "id": "en_listen_055",
        "subject": "english",
        "knowledge_tag": "英语听力",
        "ability_tag": "听对话回答问题",
        "type": "multiple_choice",
        "question": "听对话，回答问题：女孩的爸爸在哪里工作？\n\nListen to the dialogue. Where does the girl's father work?",
        "listening_text": "Boy: What does your father do, Amy?\nGirl: He is a cook. He works in a big restaurant near our school.\nBoy: That's cool! He must be a great cook.",
        "options": [
            "A. 在学校里",
            "B. 在医院里",
            "C. 在餐厅里",
            "D. 在银行里"
        ],
        "answer": "C",
        "analysis": "【考点】本题考查听对话捕捉工作地点。\n【解题思路】女孩说 He works in a big restaurant（他在一家大餐厅工作）。\n【总结】听工作地点题要抓住 works in + 地点。注意区分不同工作场所的英文表达。",
        "difficulty": 0.3
    },
    {
        "id": "en_listen_056",
        "subject": "english",
        "knowledge_tag": "英语听力",
        "ability_tag": "听对话回答问题",
        "type": "multiple_choice",
        "question": "听对话，回答问题：他们下周要去哪里秋游？\n\nListen to the dialogue. Where are they going for the autumn trip next week?",
        "listening_text": "Girl: Where are we going for the autumn trip next week?\nBoy: Our teacher said we are going to the Science Museum.\nGirl: Great! I love science. I can't wait!\nBoy: Me too. Remember to bring your notebook.",
        "options": [
            "A. 去动物园",
            "B. 去科学博物馆",
            "C. 去植物园",
            "D. 去公园野餐"
        ],
        "answer": "B",
        "analysis": "【考点】本题考查听对话捕捉地点信息。\n【解题思路】男孩说 we are going to the Science Museum（我们要去科学博物馆）。\n【总结】听地点信息要注意专有名词，如 Science Museum, Botanical Garden 等。",
        "difficulty": 0.3
    },
    {
        "id": "en_listen_057",
        "subject": "english",
        "knowledge_tag": "英语听力",
        "ability_tag": "听对话回答问题",
        "type": "multiple_choice",
        "question": "听对话，回答问题：男孩周末做了什么？\n\nListen to the dialogue. What did the boy do last weekend?",
        "listening_text": "Girl: What did you do last weekend, Jack?\nBoy: I went to the park with my family. We had a picnic there.\nGirl: Did you fly a kite?\nBoy: No, it wasn't windy. But my sister and I played badminton.",
        "options": [
            "A. 他去了公园野餐并打羽毛球",
            "B. 他去了公园放风筝",
            "C. 他呆在家里做作业",
            "D. 他去了图书馆看书"
        ],
        "answer": "A",
        "analysis": "【考点】本题考查听对话捕捉过去活动信息。\n【解题思路】男孩说 went to the park, had a picnic, played badminton。否定放风筝。\n【总结】听过去活动用过去时态，注意否定信息（No, didn't）排除错误选项。",
        "difficulty": 0.5
    },
    {
        "id": "en_listen_058",
        "subject": "english",
        "knowledge_tag": "英语听力",
        "ability_tag": "听对话回答问题",
        "type": "multiple_choice",
        "question": "听对话，回答问题：女孩今天穿了什么颜色的外套？\n\nListen to the dialogue. What color coat is the girl wearing today?",
        "listening_text": "Boy: Hi, Lucy. You look nice today! Is that a new coat?\nGirl: Thank you! Yes, it's new. It's pink. My mom bought it for me.\nBoy: Pink looks good on you.",
        "options": [
            "A. 蓝色的",
            "B. 粉色的",
            "C. 绿色的",
            "D. 黄色的"
        ],
        "answer": "B",
        "analysis": "【考点】本题考查听对话捕捉颜色信息。\n【解题思路】女孩说 It's pink（粉色）。\n【总结】颜色类词汇要熟练：pink, blue, green, yellow, red, white, black, orange, purple。",
        "difficulty": 0.3
    },
    {
        "id": "en_listen_059",
        "subject": "english",
        "knowledge_tag": "英语听力",
        "ability_tag": "听对话回答问题",
        "type": "multiple_choice",
        "question": "听对话，回答问题：男孩要买几瓶果汁？\n\nListen to the dialogue. How many bottles of juice does the boy want to buy?",
        "listening_text": "Girl: Can I help you?\nBoy: Yes, please. I'd like three bottles of apple juice and two bottles of orange juice.\nGirl: Here you are. That's fifteen yuan.\nBoy: Thank you.",
        "options": [
            "A. 两瓶",
            "B. 三瓶",
            "C. 五瓶",
            "D. 十五瓶"
        ],
        "answer": "C",
        "analysis": "【考点】本题考查听对话捕捉数量信息并计算。\n【解题思路】三瓶苹果汁 + 两瓶橙汁 = 五瓶果汁。15元是价格不是数量。\n【总结】数量题需要听清楚所有数字并做简单计算，不要把价格当成数量。",
        "difficulty": 0.5
    },
    {
        "id": "en_listen_060",
        "subject": "english",
        "knowledge_tag": "英语听力",
        "ability_tag": "听对话回答问题",
        "type": "multiple_choice",
        "question": "听对话，回答问题：男孩和女孩约了在哪里见面？\n\nListen to the dialogue. Where did the boy and girl agree to meet?",
        "listening_text": "Boy: Let's meet at the school gate at 8:30 tomorrow morning.\nGirl: The school gate? How about the bus stop? It's easier to find.\nBoy: OK. The bus stop it is. See you there!",
        "options": [
            "A. 在学校门口",
            "B. 在公交车站",
            "C. 在图书馆",
            "D. 在公园门口"
        ],
        "answer": "B",
        "analysis": "【考点】本题考查听对话捕捉地点变化。\n【解题思路】男孩先提议 school gate，但女孩建议 bus stop，男孩同意了，最终是 bus stop。\n【总结】对话中的提议可能被修改，注意最终双方同意的地点。",
        "difficulty": 0.5
    },

    # ──────── 2. Number/time/date listening (5) ────────
    {
        "id": "en_listen_061",
        "subject": "english",
        "knowledge_tag": "英语听力",
        "ability_tag": "听数字信息",
        "type": "multiple_choice",
        "question": "听录音，写出电话号码。注意听清楚每个数字。\n\nListen and write down the phone number.",
        "listening_text": "Hi, I'm Sarah. My phone number is five eight three, two zero six, one seven nine four.",
        "options": [
            "A. 583-206-1749",
            "B. 583-260-1794",
            "C. 538-206-1794",
            "D. 583-206-1794"
        ],
        "answer": "D",
        "analysis": "【考点】本题考查听辨电话号码。\n【解题思路】号码逐位听：5-8-3, 2-0-6, 1-7-9-4。注意零读作 zero。\n【总结】电话号码逐位读，注意 0 读 zero，两个相同数字可能读 double。边听边记是关键。",
        "difficulty": 0.5
    },
    {
        "id": "en_listen_062",
        "subject": "english",
        "knowledge_tag": "英语听力",
        "ability_tag": "听价格信息",
        "type": "multiple_choice",
        "question": "听录音，回答问题：书包多少钱？\n\nListen and answer: How much is the schoolbag?",
        "listening_text": "Welcome to our shop. This red schoolbag is forty-five yuan. That blue one is thirty-eight yuan. And the green one is fifty-two yuan.",
        "options": [
            "A. 38元",
            "B. 45元",
            "C. 52元",
            "D. 58元"
        ],
        "answer": "B",
        "analysis": "【考点】本题考查听辨价格。\n【解题思路】题目问书包多少钱，但出现了三个价格。red schoolbag 是 45 元。注意对应颜色。\n【总结】价格题可能出现多个数字，要听清楚题目问的是哪个物品，对应哪个价格。",
        "difficulty": 0.5
    },
    {
        "id": "en_listen_063",
        "subject": "english",
        "knowledge_tag": "英语听力",
        "ability_tag": "听时间信息",
        "type": "multiple_choice",
        "question": "听录音，回答问题：电影几点开始？\n\nListen and answer: What time does the movie start?",
        "listening_text": "Boy: Mom, when does the movie start?\nMom: It starts at half past two. We should leave home at two o'clock.\nBoy: OK. It's one thirty now. We still have thirty minutes.",
        "options": [
            "A. 1:30",
            "B. 2:00",
            "C. 2:30",
            "D. 3:00"
        ],
        "answer": "C",
        "analysis": "【考点】本题考查听辨时间。\n【解题思路】电影 starts at half past two = 2:30。2:00 是出发时间，1:30 是当前时间。\n【总结】时间题可能出现多个时间点，要听清题目问的是什么时间。half past two = 2:30。",
        "difficulty": 0.5
    },
    {
        "id": "en_listen_064",
        "subject": "english",
        "knowledge_tag": "英语听力",
        "ability_tag": "听日期信息",
        "type": "multiple_choice",
        "question": "听录音，回答问题：学校运动会是哪一天？\n\nListen and answer: When is the school sports meeting?",
        "listening_text": "Attention, please. Our school sports meeting will be on Friday, October the eighteenth. All students should come to school by seven forty-five. Please wear your sports clothes.",
        "options": [
            "A. 10月8日",
            "B. 10月18日",
            "C. 10月28日",
            "D. 11月18日"
        ],
        "answer": "B",
        "analysis": "【考点】本题考查听辨日期。\n【解题思路】October the eighteenth = 10月18日。注意区分 eighteenth (18) 和 eighth (8), twenty-eighth (28)。\n【总结】日期听力要特别注意 -teen 和 -ty 的区别，如 eighteen vs eighty, fourteen vs forty。",
        "difficulty": 0.5
    },
    {
        "id": "en_listen_065",
        "subject": "english",
        "knowledge_tag": "英语听力",
        "ability_tag": "听数字信息",
        "type": "multiple_choice",
        "question": "听录音，回答问题：教室里一共有多少把椅子？\n\nListen and answer: How many chairs are there in the classroom?",
        "listening_text": "There are twelve desks in our classroom. Each desk has two chairs. But two chairs are broken, so we only use twenty-two chairs now.",
        "options": [
            "A. 12把",
            "B. 22把",
            "C. 24把",
            "D. 20把"
        ],
        "answer": "B",
        "analysis": "【考点】本题考查听数字并计算。\n【解题思路】12张桌子，每张2把椅子 = 24把。但坏了2把，所以现在只用 24 - 2 = 22 把。\n【总结】数字题可能需要计算。注意 but 等转折词后面的修正信息。",
        "difficulty": 0.7
    },

    # ──────── 3. Picture matching (5) ────────
    {
        "id": "en_listen_066",
        "subject": "english",
        "knowledge_tag": "英语听力",
        "ability_tag": "听描述选图片",
        "type": "multiple_choice",
        "question": "听录音，选出与描述相符的图片。\n\nListen and choose the picture that matches the description.",
        "listening_text": "In this picture, a girl is sitting under a big tree. She is reading a book. There are some birds in the tree. The sun is shining brightly.",
        "options": [
            "A. 女孩在树下读书，树上有鸟",
            "B. 女孩在树下吃苹果，旁边有条狗",
            "C. 女孩在房间里写作业",
            "D. 女孩在河边放风筝"
        ],
        "answer": "A",
        "analysis": "【考点】本题考查听描述匹配场景。\n【解题思路】关键信息：sitting under a tree（树下）+ reading a book（读书）+ birds in the tree（树上有鸟）。\n【总结】听描述选图要抓住所有关键信息，逐一比对排除。",
        "difficulty": 0.3
    },
    {
        "id": "en_listen_067",
        "subject": "english",
        "knowledge_tag": "英语听力",
        "ability_tag": "听描述选图片",
        "type": "multiple_choice",
        "question": "听录音，选出与描述相符的图片。\n\nListen and choose the picture that matches the description.",
        "listening_text": "Look at this picture. It is a snowy day. Two children are making a snowman in front of a house. The snowman has a carrot nose and a red hat. A dog is running nearby.",
        "options": [
            "A. 两个孩子在公园里踢足球",
            "B. 两个孩子在堆雪人，雪人戴着红帽子",
            "C. 两个孩子在海边游泳",
            "D. 两个孩子在雨中等公交车"
        ],
        "answer": "B",
        "analysis": "【考点】本题考查听描述匹配季节活动场景。\n【解题思路】关键信息：snowy day（下雪天）+ making a snowman（堆雪人）+ red hat（红帽子）。\n【总结】注意季节词和活动动词的搭配：snowy → make a snowman, sunny → swim, rainy → wait for bus。",
        "difficulty": 0.3
    },
    {
        "id": "en_listen_068",
        "subject": "english",
        "knowledge_tag": "英语听力",
        "ability_tag": "听描述选图片",
        "type": "multiple_choice",
        "question": "听录音，选出与描述相符的图片。\n\nListen and choose the picture that matches the description.",
        "listening_text": "This picture shows a kitchen. There is a fridge next to the door. A table is in the middle of the room. Some bowls and chopsticks are on the table. A cat is sleeping on the floor near the table.",
        "options": [
            "A. 卧室里有一张大床和一只猫",
            "B. 厨房里有冰箱、桌子和碗筷，猫在地板上睡觉",
            "C. 客厅里有沙发和电视",
            "D. 浴室里有浴缸和毛巾"
        ],
        "answer": "B",
        "analysis": "【考点】本题考查听描述匹配室内场景。\n【解题思路】关键信息：kitchen（厨房）+ fridge（冰箱）+ bowls and chopsticks（碗筷）+ cat sleeping on floor。\n【总结】房间类词汇：kitchen, bedroom, living room, bathroom。家具类：fridge, table, bed, sofa。",
        "difficulty": 0.5
    },
    {
        "id": "en_listen_069",
        "subject": "english",
        "knowledge_tag": "英语听力",
        "ability_tag": "听描述选图片",
        "type": "multiple_choice",
        "question": "听录音，选出与描述相符的图片。\n\nListen and choose the picture that matches the description.",
        "listening_text": "In the picture, you can see a bus stop. A woman is standing there, waiting for the bus. She is wearing a yellow dress and carrying a black bag. Behind her, there is a tall building.",
        "options": [
            "A. 女人穿黄色裙子在公交站等车，后面有高楼",
            "B. 女人穿红色裙子在出租车上",
            "C. 女人穿蓝色裙子在地铁里",
            "D. 女人穿绿色裙子在公园散步"
        ],
        "answer": "A",
        "analysis": "【考点】本题考查听描述匹配人物和场景。\n【解题思路】关键信息：bus stop（公交站）+ yellow dress（黄裙子）+ black bag（黑包）+ tall building（高楼）。\n【总结】描述人物要注意服装颜色和携带物品，场景要注意周围建筑。",
        "difficulty": 0.5
    },
    {
        "id": "en_listen_070",
        "subject": "english",
        "knowledge_tag": "英语听力",
        "ability_tag": "听描述选图片",
        "type": "multiple_choice",
        "question": "听录音，选出与描述相符的图片。\n\nListen and choose the picture that matches the description.",
        "listening_text": "Look at the picture. It is a birthday party. There are five children around a table. On the table, there is a big cake with eleven candles. Balloons are everywhere. Everyone is smiling.",
        "options": [
            "A. 五个孩子在教室里上课",
            "B. 五个孩子在生日派对上，桌上有一个大蛋糕",
            "C. 五个孩子在操场上跑步",
            "D. 五个孩子在图书馆里看书"
        ],
        "answer": "B",
        "analysis": "【考点】本题考查听描述匹配活动场景。\n【解题思路】关键信息：birthday party（生日派对）+ big cake with eleven candles（11根蜡烛的大蛋糕）+ balloons（气球）。\n【总结】派对类词汇：birthday party, cake, candles, balloons, smile。注意数字 eleven candles。",
        "difficulty": 0.3
    },

    # ──────── 4. Passage listening (5) ────────
    {
        "id": "en_listen_071",
        "subject": "english",
        "knowledge_tag": "英语听力",
        "ability_tag": "听短文回答问题",
        "type": "multiple_choice",
        "question": "听短文，回答问题：Tom每天怎样去上学？\n\nListen to the passage. How does Tom go to school every day?",
        "listening_text": "Tom is a student in Grade Five. He lives near his school. Every morning, he gets up at six forty-five. He has breakfast at seven o'clock. Then he walks to school. It takes him about ten minutes. He likes walking because it is good exercise.",
        "options": [
            "A. 骑自行车",
            "B. 坐公交车",
            "C. 步行",
            "D. 坐地铁"
        ],
        "answer": "C",
        "analysis": "【考点】本题考查听短文捕捉交通方式。\n【解题思路】短文明确说 he walks to school（步行上学），后面还说 walking is good exercise。\n【总结】听短文要先浏览题目，带着问题听，捕捉关键词。walk = on foot。",
        "difficulty": 0.3
    },
    {
        "id": "en_listen_072",
        "subject": "english",
        "knowledge_tag": "英语听力",
        "ability_tag": "听短文回答问题",
        "type": "multiple_choice",
        "question": "听短文，回答问题：Lisa的哥哥几岁了？\n\nListen to the passage. How old is Lisa's brother?",
        "listening_text": "Lisa is ten years old. She has a brother. His name is David. He is three years older than Lisa. David is tall and thin. He likes playing basketball. He is in Grade Eight now. Lisa and David often play together after school.",
        "options": [
            "A. 7岁",
            "B. 10岁",
            "C. 13岁",
            "D. 15岁"
        ],
        "answer": "C",
        "analysis": "【考点】本题考查听短文进行简单计算。\n【解题思路】Lisa 10岁，哥哥 David three years older than Lisa，所以哥哥 10 + 3 = 13岁。\n【总结】听力中年龄计算题要注意 older/younger than 的关系，做加减法。",
        "difficulty": 0.5
    },
    {
        "id": "en_listen_073",
        "subject": "english",
        "knowledge_tag": "英语听力",
        "ability_tag": "听短文回答问题",
        "type": "multiple_choice",
        "question": "听短文，回答问题：这家餐厅的特别菜是什么？\n\nListen to the passage. What is special about this restaurant?",
        "listening_text": "There is a new restaurant on Apple Street. It is called Happy Kitchen. The restaurant is open from eleven a.m. to nine p.m. every day. The most popular dish here is the chicken noodles. Many people come here for lunch. The prices are not high. A bowl of chicken noodles is only twelve yuan.",
        "options": [
            "A. 牛肉面特别好吃",
            "B. 鸡肉面最受欢迎",
            "C. 这家餐厅很贵",
            "D. 这家餐厅只在晚上营业"
        ],
        "answer": "B",
        "analysis": "【考点】本题考查听短文捕捉关键信息。\n【解题思路】短文说 The most popular dish here is the chicken noodles（最受欢迎的菜是鸡肉面）。价格不高（not high），所以C错。\n【总结】听短文要注意最高级和强调信息，如 most popular, only, special 等。",
        "difficulty": 0.5
    },
    {
        "id": "en_listen_074",
        "subject": "english",
        "knowledge_tag": "英语听力",
        "ability_tag": "听短文回答问题",
        "type": "multiple_choice",
        "question": "听短文，回答问题：公园里不能做什么？\n\nListen to the passage. What can't you do in the park?",
        "listening_text": "Welcome to Sunshine Park. The park is open from six a.m. to eight p.m. You can walk, run, and play in the park. You can have a picnic on the grass. You can ride a bike on the bike path. But please do not pick the flowers. And do not feed the animals. Thank you for following the rules.",
        "options": [
            "A. 不能骑自行车",
            "B. 不能在草地上野餐",
            "C. 不能摘花",
            "D. 不能在公园里跑步"
        ],
        "answer": "C",
        "analysis": "【考点】本题考查听短文捕捉否定/禁止信息。\n【解题思路】短文说 do not pick the flowers（不要摘花）和 do not feed the animals（不要喂动物）。骑车和野餐是允许的。\n【总结】注意 do not / don't / no + doing 表示禁止。听规则类短文要区分 can 和 cannot 的内容。",
        "difficulty": 0.5
    },
    {
        "id": "en_listen_075",
        "subject": "english",
        "knowledge_tag": "英语听力",
        "ability_tag": "听短文回答问题",
        "type": "multiple_choice",
        "question": "听短文，回答问题：这个周末天气怎么样？\n\nListen to the passage. What will the weather be like this weekend?",
        "listening_text": "Here is the weather report for this weekend. On Saturday, it will be cloudy in the morning and sunny in the afternoon. The temperature will be about twenty degrees. On Sunday, it will rain all day. The temperature will drop to fifteen degrees. Don't forget to bring your umbrella on Sunday!",
        "options": [
            "A. 周六整天有雨",
            "B. 周六上午多云，下午晴",
            "C. 周日天气晴朗",
            "D. 两天都是晴天"
        ],
        "answer": "B",
        "analysis": "【考点】本题考查听短文捕捉天气预报信息。\n【解题思路】周六 cloudy in the morning and sunny in the afternoon（上午多云下午晴），周日 rain all day（整天有雨）。\n【总结】天气预报类听力要注意不同日期、不同时段的天气变化，逐一记录。",
        "difficulty": 0.5
    },

    # ──────── 5. Fill-in-the-blank listening (5) ────────
    {
        "id": "en_listen_076",
        "subject": "english",
        "knowledge_tag": "英语听力",
        "ability_tag": "听录音填空",
        "type": "fill_blank",
        "question": "听录音，在空格处填入正确的单词。\n\nListen and fill in the blank with the correct word.",
        "listening_text": "I have a good friend. ______ name is Amy. She is from America. She can speak a little Chinese.",
        "options": [],
        "answer": "Her",
        "analysis": "【考点】本题考查听辨物主代词。\n【解题思路】Amy 是女孩名，所以用 Her（她的）。注意首字母大写。\n【总结】物主代词：my, your, his, her, its, our, their。要根据性别和人称选择。",
        "difficulty": 0.3
    },
    {
        "id": "en_listen_077",
        "subject": "english",
        "knowledge_tag": "英语听力",
        "ability_tag": "听录音填空",
        "type": "fill_blank",
        "question": "听录音，在空格处填入正确的单词。\n\nListen and fill in the blank with the correct word.",
        "listening_text": "There are four ______ in a year. They are spring, summer, autumn and winter.",
        "options": [],
        "answer": "seasons",
        "analysis": "【考点】本题考查听辨季节相关词汇。\n【解题思路】four 后面跟复数名词，spring, summer, autumn, winter 是四季，所以填 seasons。\n【总结】注意 four 后面要加复数 -s。seasons 是 season 的复数形式。",
        "difficulty": 0.3
    },
    {
        "id": "en_listen_078",
        "subject": "english",
        "knowledge_tag": "英语听力",
        "ability_tag": "听录音填空",
        "type": "fill_blank",
        "question": "听录音，在空格处填入正确的单词。\n\nListen and fill in the blank with the correct word.",
        "listening_text": "Look! The children are ______ games in the playground. They are having a lot of fun.",
        "options": [],
        "answer": "playing",
        "analysis": "【考点】本题考查听辨现在分词。\n【解题思路】Look! 提示现在进行时，are + doing，所以填 playing。\n【总结】现在进行时结构：am/is/are + 动词-ing。注意 play 的现在分词直接加 -ing。",
        "difficulty": 0.3
    },
    {
        "id": "en_listen_079",
        "subject": "english",
        "knowledge_tag": "英语听力",
        "ability_tag": "听录音填空",
        "type": "fill_blank",
        "question": "听录音，在空格处填入正确的单词。\n\nListen and fill in the blank with the correct word.",
        "listening_text": "I ______ to the park with my parents yesterday. We had a good time there.",
        "options": [],
        "answer": "went",
        "analysis": "【考点】本题考查听辨动词过去式。\n【解题思路】yesterday 提示一般过去时，go 的过去式是 went。\n【总结】不规则动词过去式：go → went, eat → ate, see → saw, do → did, have → had。要熟记常见不规则变化。",
        "difficulty": 0.5
    },
    {
        "id": "en_listen_080",
        "subject": "english",
        "knowledge_tag": "英语听力",
        "ability_tag": "听录音填空",
        "type": "fill_blank",
        "question": "听录音，在空格处填入正确的单词。\n\nListen and fill in the blank with the correct word.",
        "listening_text": "We should ______ our teeth every morning and every evening. It is a good habit.",
        "options": [],
        "answer": "brush",
        "analysis": "【考点】本题考查听辨日常行为动词。\n【解题思路】should 后面跟动词原形，brush teeth（刷牙）是固定搭配。\n【总结】should + 动词原形。日常行为词汇：brush teeth, wash face, take a shower, do homework。注意 should 后不加 -s 或 -ing。",
        "difficulty": 0.3
    },
]


def main():
    # ── Read existing files ──
    with open(WRITING_PATH, "r", encoding="utf-8") as f:
        writing_data = json.load(f)

    with open(LISTENING_PATH, "r", encoding="utf-8") as f:
        listening_data = json.load(f)

    # ── Verify IDs don't collide ──
    existing_writing_ids = {q["id"] for q in writing_data}
    existing_listening_ids = {q["id"] for q in listening_data}

    for q in new_writing:
        assert q["id"] not in existing_writing_ids, f"Duplicate writing ID: {q['id']}"
    for q in new_listening:
        assert q["id"] not in existing_listening_ids, f"Duplicate listening ID: {q['id']}"

    # ── Append and write ──
    writing_data.extend(new_writing)
    listening_data.extend(new_listening)

    with open(WRITING_PATH, "w", encoding="utf-8") as f:
        json.dump(writing_data, f, ensure_ascii=False, indent=2)

    with open(LISTENING_PATH, "w", encoding="utf-8") as f:
        json.dump(listening_data, f, ensure_ascii=False, indent=2)

    print(f"Writing: {len(existing_writing_ids)} existing + {len(new_writing)} new = {len(writing_data)} total")
    print(f"Listening: {len(existing_listening_ids)} existing + {len(new_listening)} new = {len(listening_data)} total")
    print("Done!")


if __name__ == "__main__":
    main()
