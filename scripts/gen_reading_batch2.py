#!/usr/bin/env python3
"""
生成初中英语阅读理解题库 Batch 2 (第6-10篇)
ID: en_j2_read_006 到 en_j2_read_010
主题: 旅行与文化体验 / 动物保护与自然 / 中外节日对比 / 科技改变生活 / 环境保护行动
"""

import json

articles = [
    # ===== 第6篇：旅行与文化体验 (Travel & Culture) =====
    {
        "id": "en_j2_read_006",
        "type": "choice",
        "subject": "english",
        "grade": 8,
        "difficulty": "medium",
        "question": """阅读下面短文。

A Special Trip to a Foreign Country

Last summer, Li Ming had the chance to visit Australia as an exchange student for two weeks. It was his first time traveling abroad, and the experience changed how he sees the world.

Li Ming stayed with a host family in Sydney. The Smiths have two children, Tom and Amy, who are around Li Ming's age. At first, Li Ming felt nervous about speaking English all the time. But Tom and Amy were very friendly. They took him to their school, introduced him to their friends, and even taught him some Australian slang words like "G'day" (hello) and "arvo" (afternoon).

One thing that surprised Li Ming was the food. He tried vegemite — a dark spread that Australians love putting on toast. "It tasted very salty and strange at first," Li Ming laughed, "but after trying it a few times, I started to enjoy it." Mrs. Smith also cooked traditional Chinese dishes for him when he missed home cooking.

On weekends, the family went to the beach together. Li Ming learned to surf, though he fell into the water many times. He also visited the Sydney Opera House and climbed the Harbour Bridge. The view from the top was amazing.

Before leaving, Li Ming gave the family a Chinese painting as a gift. They promised to visit China someday. "This trip taught me that people from different cultures can become good friends if we open our hearts," Li Ming said. He now writes emails to Tom every week to practice his English.

(1) How did Li Ming feel at the beginning of his stay?
A. Excited about making new friends immediately
B. Nervous about using English every day
C. Bored because there was nothing to do
D. Angry that he had to leave home

(2) What did Tom and Amy NOT do for Li Ming?
A. Take him to their local school
B. Teach him Australian slang words
C. Help him find a part-time job
D. Introduce him to their friends

(3) What does Li Ming think of vegemite now?
A. He still hates the taste completely
B. He enjoys it after trying several times
C. He thinks it is too sweet to eat
D. He never wants to try it again

(4) Which place did Li Ming NOT visit during the trip?
A. The famous Sydney Opera House
B. The large Harbour Bridge in Sydney
C. The beautiful Great Barrier Reef
D. A sunny beach near his host family's home

(5) What is the main idea of this passage?
A. How to prepare food for foreign guests
B. Why Chinese students should go abroad
C. A boy's exchange trip to Australia
D. Top tourist spots in Sydney city""",
        "options": [],
        "answer": "(1) B (2) C (3) B (4) C (5) C",
        "analysis": "(1) B【细节理解】第二段At first, Li Ming felt nervous about speaking English all the time——起初因全程说英语而紧张；A立刻交到朋友兴奋与nervous矛盾；C无聊和D生气都没有依据\n(2) C【细节判断】第二段提到took him to school、taught slang、introduced to friends，但未提及help find a part-time job；A、B、D都是Tom和Amy做过的事\n(3) B【细节理解】第三段after trying it a few times, I started to enjoy it——试了几次后开始喜欢了；A仍然讨厌与started to enjoy矛盾；C太甜不对（文中说salty）；D再也不想试也不对\n(4) C【推理判断】第四段提到了Sydney Opera House、Harbour Bridge和beach，但没提Great Barrier Reef（大堡礁）；A、B、D都明确提到了\n(5) C【主旨大意】全文围绕Li Ming在澳洲的交换生经历展开——住家生活/食物/游览/感悟；A如何做澳餐只是小部分；B为什么出国不是重点；D悉尼景点只是其中一个方面"
    },

    # ===== 第7篇：动物保护与自然 (Animals & Nature) =====
    {
        "id": "en_j2_read_007",
        "type": "choice",
        "subject": "english",
        "grade": 8,
        "difficulty": "medium",
        "question": """阅读下面短文。

Saving the Giant Pandas

The giant panda is one of the most beloved animals in the world. With its black-and-white fur and round body, it has become a symbol of wildlife protection globally. However, pandas were once in great danger.

Fifty years ago, there were only about 1,100 giant pandas left in the wild. Their bamboo forests were being cut down for farming and building. Without enough bamboo to eat, many pandas struggled to survive. Some were even caught by poachers who wanted to sell their valuable fur.

Things began to change in the 1980s. The Chinese government set up nature reserves where hunting and cutting trees were strictly banned. Scientists also started breeding programs to help pandas reproduce in captivity. Today, thanks to these efforts, the wild panda population has grown to over 1,800.

Pandas are still facing challenges. Climate change is pushing bamboo forests to higher areas, which means pandas must climb higher mountains to find food. Also, roads and railways are dividing panda habitats into smaller pieces, making it hard for pandas to meet and produce young.

Conservation workers are now creating "green corridors" — strips of forest that connect separated habitats. This allows pandas to move between areas safely. Zoos around the world also help by raising money and educating visitors about why protecting pandas matters.

Everyone can make a difference. Using less paper saves bamboo forests. Supporting environmental groups helps fund protection work. Even sharing what you learn about pandas with friends spreads awareness. Small actions add up to big changes!

(1) About how many wild pandas remained fifty years ago?
A. Over 1,800 pandas lived freely then
B. Around 1,100 pandas survived in nature
C. Fewer than 500 pandas could be found
D. Exactly 2,000 pandas were counted

(2) Why did pandas struggle to survive in the past?
A. They refused to eat anything except meat
B. Diseases killed most of the baby pandas
C. Bamboo forests were destroyed by humans
D. The weather became too cold for them

(3) What helped increase the panda population since the 1980s?
A. Setting up reserves and breeding programs
B. Moving all pandas to foreign country zoos
C. Feeding pandas with artificial bamboo
D. Building more hotels for tourists nearby

(4) What problem are green corridors meant to solve?
A. Pandas cannot find enough water sources
B. Roads split panda homes into small parts
C. Poachers are hiding in deep forests
D. Baby pandas are too weak to climb hills

(5) What is the writer's purpose in writing this passage?
A. To explain why pandas only eat bamboo
B. To describe the daily life of a panda keeper
C. To show how humans saved pandas and why we must keep going
D. To compare Chinese pandas with other bears worldwide""",
        "options": [],
        "answer": "(1) B (2) C (3) A (4) B (5) C",
        "analysis": "(1) B【细节理解】第二段there were only about 1,100 giant pandas left in the wild——约1100只；A超过1800只现在的数字；C不到500只太少了；D正好2000只没有依据\n(2) C【细节理解】第二段bamboo forests were being cut down——竹林被砍伐导致生存困难；A不吃肉（熊猫本来就不吃肉）不是原因；B疾病杀死了大部分幼崽和D天气太冷都没有根据\n(3) A【细节理解】第三段set up nature reserves和breeding programs两个措施使数量增长；B全搬到国外动物园不对；C人工竹子和D建酒店都不是保护措施\n(4) B【细节理解】第四段roads and railways are dividing panda habitats...creating green corridors connect separated habitats——绿色廊道连接被道路分割的栖息地；A水源不够、C偷猎者躲藏、D幼崽太弱爬不了山都不对\n(5) C【主旨大意】全文讲述熊猫从濒危到恢复的过程及仍面临的挑战，强调人类保护工作的作用和持续性需求；A解释为何只吃竹子只是一个细节；B饲养员日常生活和D与其他熊类比较都不是文章主旨"
    },

    # ===== 第8篇：中外节日对比 (Festivals Around the World) =====
    {
        "id": "en_j2_read_008",
        "type": "choice",
        "subject": "english",
        "grade": 8,
        "difficulty": "medium",
        "question": """阅读下面短文。

Holidays That Bring People Together

Every culture has special days when families and friends come together. Although the customs differ, the feelings of joy and love are the same everywhere.

In China, the Spring Festival is the most important holiday of the year. Families travel long distances to reunite. On New Year's Eve, everyone gathers for a big dinner. Dumplings are a must-have dish because they look like gold ingots (金元宝), symbolizing wealth. Children receive red envelopes with money inside and stay up late to welcome the new year. Fireworks light up the sky as people wish each other good luck.

In the United States, Thanksgiving is a similar family holiday. It falls on the fourth Thursday in November. Families enjoy a large meal featuring roast turkey, pumpkin pie, and cranberry sauce. Before eating, many families take turns saying what they are thankful for. It is a time to appreciate food, health, family, and friendship.

India's Diwali, known as the Festival of Lights, usually takes place in October or November. People clean and decorate their homes with oil lamps called diyas. These lamps are lit to honor the victory of light over darkness. Sweets are shared among neighbors, and children wear new clothes and set off fireworks. Like the Spring Festival, Diwali is also a time for giving gifts to loved ones.

In Mexico, Day of the Dead (Dia de los Muertos) is celebrated on November 1st and 2nd. Unlike festivals that focus only on happiness, this holiday includes remembering family members who have passed away. Families build colorful altars with photos, favorite foods, and flowers for those who died. It may sound sad, but Mexicans see it as a joyful celebration of life and memory.

What do these holidays teach us? No matter where we live, taking time to be with the people we love is what truly matters.

(1) What do dumplings symbolize during the Spring Festival?
A. Good health and long life for everyone
B. Family reunion after a long time apart
C. Wealth and good fortune in the new year
D. Success in exams and future studies

(2) When is Thanksgiving celebrated in America?
A. On the first day of every November
B. During the fourth week of November
C. Right after Christmas Day each year
D. Between January and February like Lunar NY

(3) What do people do before the Thanksgiving meal in many families?
A. They exchange expensive gifts with each other
B. Everyone shares something they are grateful for
C. Children perform songs and dances on stage
D. They watch a parade on television together

(4) How is Diwali similar to the Spring Festival?
A. Both are celebrated only by rich families
B. Neither festival involves any fireworks
C. Both include giving gifts to family members
D. People eat turkey during both holidays

(5) What makes Mexico's Day of the Dead unique among these festivals?
A. It is the oldest festival in the world history
B. It combines celebrating and remembering the dead
C. It lasts longer than any other holiday listed
D. Only adults are allowed to join the celebration""",
        "options": [],
        "answer": "(1) C (2) B (3) B (4) C (5) B",
        "analysis": "(1) C【细节理解】第二段look like gold ingots, symbolizing wealth——像金元宝象征财富；A健康长寿和B团圆虽然也是春节的含义，但dumplings specifically对应的是wealth；D考试成功不是饺子的象征\n(2) B【细节理解】第三段falls on the fourth Thursday in November——十一月的第四个星期四；A第一天和C圣诞节后以及D一月二月之间都不对\n(3) B【细节理解】第三段take turns saying what they are thankful for——轮流说感谢的事；A交换贵重礼物是圣诞节的习俗；C孩子唱歌跳舞和D看游行电视都没在Thanksgiving部分提到\n(4) C【细节理解】第四段Like the Spring Festival, Diwali is also a time for giving gifts——两者都会送礼物给亲人；A只有富人才庆祝不对；B不放烟花错，Diwali也放fireworks；D火鸡是Thanksgiving的食物\n(5) B【细节理解】第五段remembering family members who have passed away...joyful celebration of life and memory——同时庆祝和纪念逝者；A最古老节日没有比较依据；C持续时间最长和D只有成年人参加都不对"
    },

    # ===== 第9篇：科技改变生活 (Technology in Daily Life) =====
    {
        "id": "en_j2_read_009",
        "type": "choice",
        "subject": "english",
        "grade": 8,
        "difficulty": "medium",
        "question": """阅读下面短文。

How Smartphones Changed Everything

Ten years ago, smartphones were not as common as they are today. Now, almost every middle school student owns one. These small devices have transformed how we learn, communicate, and live our daily lives.

In education, smartphones have become powerful learning tools. Students can look up unfamiliar words instantly instead of carrying heavy dictionaries. Educational apps help with math problems, language learning, and science experiments. During the pandemic, online classes through phone apps allowed millions of students to continue studying at home. However, teachers also worry that phones can distract students in class. Many schools now require students to put their phones away during lessons.

Communication has changed dramatically. Before smartphones, people wrote letters or used landline telephones to keep in touch with distant relatives. Today, video calls let us see and talk to anyone anywhere in the world for free Apps like WeChat allow us to send messages, share photos, and even pay for things without cash. Grandparents who live far away can now watch their grandchildren grow up through daily video updates.

Smartphones also affect our shopping habits. Online shopping apps make it possible to buy almost anything without leaving home. You can compare prices, read reviews from other buyers, and get packages delivered to your door. This convenience saves time but also creates new problems. Some people buy things they do not really need just because ads make products look attractive.

Health experts point out another concern: spending too much time staring at screens can hurt our eyes and necks. Also, always checking social media can lead to anxiety when we compare ourselves with others online. Doctors suggest taking breaks every 30 minutes and limiting screen time before bed.

Like any tool, smartphones are neither good nor bad by themselves. What matters is how wisely we choose to use them.

(1) According to the passage, what can smartphones help students do in class?
A. Play games secretly when the teacher is not looking
B. Look up words and access educational apps quickly
C. Copy answers from classmates during exams
D. Chat with friends in different classrooms easily

(2) How did communication change compared to ten years ago?
A. Letters and landlines are cheaper than before
B. People no longer talk to their grandparents
C. Video calls now connect people across distances
D. International calls are still very expensive today

(3) What problem does online shopping create according to the writer?
A. Products bought online are often poor quality
B. Delivery services are too slow and unreliable
C. People may buy unnecessary things due to ads
D. Cash payments are no longer accepted anywhere

(4) What health concern do doctors mention about smartphone overuse?
A. It causes serious hearing damage in teens
B. Screen time leads to eye and neck problems
C. Phone batteries give off harmful radiation
D. Using phones makes people gain weight fast

(5) What is the writer's attitude toward smartphones?
A. They should be banned for all students forever
B. Smartphones bring only harm to society
C. They are useful tools depending on how we use them
D. Everyone should own at least three smartphones""",
        "options": [],
        "answer": "(1) B (2) C (3) C (4) B (5) C",
        "analysis": "(1) B【细节理解】第二段look up unfamiliar words instantly和Educational apps help with math/language/science——查单词和学习辅助应用；A偷玩游戏是negative side不是help；C考试作弊和D跨教室聊天都不是smartphone帮助学习的功能\n(2) C【细节理解】第三段video calls let us see and talk to anyone anywhere——视频通话连接世界各地的人；A信件和座机更便宜不对，文中说free video calls；B不再跟祖父母说话相反，文中说watch grandchildren grow up；D国际电话很贵也不对，现在免费\n(3) C【细节理解】第四段buy things they do not really need just because ads make products look attractive——因为广告诱惑买不需要的东西；A质量差、B送货慢和D不再收现金都没有依据\n(4) B【细节理解】第五段hurt our eyes and necks——伤害眼睛和脖子；A听力损害、C电池辐射和D快速增胖都没有在文中出现\n(5) C【观点态度】最后一段neither good nor bad...what matters is how wisely we choose to use them——好坏取决于怎么用；A永远禁止学生使用和B只带来危害都太极端；D每人至少三部手机荒谬"
    },

    # ===== 第10篇：环境保护行动 (Environmental Protection) =====
    {
        "id": "en_j2_read_010",
        "type": "choice",
        "subject": "english",
        "grade": 8,
        "difficulty": "medium",
        "question": """阅读下面短文。

Teenagers Who Are Making a Difference

When it comes to protecting the environment, you are never too young to take action. Around the world, teenagers are leading creative projects that inspire their communities and beyond.

In Shanghai, a group of Grade 8 students started a "Zero-Waste Lunch" project at their school. They noticed that hundreds of plastic bags, disposable chopsticks, and half-eaten food were thrown away every day in the school cafeteria. The team designed a simple plan: students bring their own reusable containers and chopsticks. Those who forget can borrow clean ones from a sharing station. After six months, the school's lunchtime waste dropped by 70%. The students even made a short video about their project that got thousands of views online.

Halfway across the globe in Kenya, a 14-year-old boy named Richard Turere invented a clever way to protect his village's cattle from lions. Lions often attacked cows at night, causing huge losses for Richard's community. Instead of killing the lions, Richard noticed that they were afraid of moving lights. He connected old solar-powered flashlight parts to a fence around the cowshed. When the lions approached, lights flashed on and off, scaring them away. His invention worked perfectly — no more lion attacks! Now farmers in neighboring villages are using Richard's design too.

In Sweden, Greta Thunberg started a solo protest outside her parliament building in 2018. She held a sign reading "School Strike for Climate" and refused to go to classes until the government took stronger action on climate change. Her brave act inspired millions of students in over 150 countries to join climate strikes. Greta showed the world that one person's voice can indeed start a global movement.

These stories share a common message: you do not need to wait until you grow up to change the world. Start small. Start now. Your actions today matter more than you might think.

(1) What did the Shanghai students' project target?
A. Reducing waste produced during school lunches
B. Saving money on school cafeteria food costs
C. Stopping students from eating meat at school
D. Teaching parents how to cook healthy meals

(2) How much did the school's lunchtime waste drop after the project?
A. By about 20 percent overall
B. By nearly seven out of every ten units
C. By exactly 50 percent in six months
D. By over 90 percent in one year alone

(3) Why did Richard invent the flashing light system?
A. To catch lions and sell them to zoos
B. To stop lions from attacking village cattle
C. To help lions find food at night safely
D. To make his village famous for inventions

(4) What made Greta's protest spread worldwide?
A. She was invited to speak on national TV
B. The government paid students to join her
C. One brave act inspired millions to follow
D. Her school organized the event for her

(5) What does the writer want young readers to understand?
A. Only adults can solve environmental problems
B. Teenagers are too young to lead any project
C. Young people can take meaningful action right now
D. Environmental issues will fix themselves soon""",
        "options": [],
        "answer": "(1) A (2) B (3) B (4) C (5) C",
        "analysis": "(1) A【细节理解】第二段Zero-Waste Lunch project...hundreds of plastic bags, chopsticks, half-eaten food thrown away——针对午餐垃圾减量问题；B省钱不是主要目标；C不吃肉和D教父母做饭健康餐都没有依据\n(2) B【细节理解】dropped by 70% = 七成 = nearly seven out of ten；A约20%太低；C恰好50%不对；D超过90%一年内也没有根据\n(3) B【细节理解】第三段protect his village's cattle from lions...lions often attacked cows——防止狮子袭击牛群；A抓狮子卖动物园和C帮狮子安全找食物都错了，Richard是要保护牛不是狮子；D让村庄出名不是目的\n(4) C【细节推理】第四段Her brave act inspired millions...one person's voice can start a global movement——一个人的勇敢行动激励了全球数百万人；A上全国电视和B政府付钱给学生加入她以及D学校组织活动都没有依据\n(5) C【主旨大意】最后一段you do not need to wait until you grow up...Start small. Start now——年轻人现在就能采取有意义的行动；A只有成年人能解决和B青少年太小不能领导项目都与文章意思相反；D环境问题会自行解决更不对"
    },
]

def validate_articles(data):
    """验证每篇文章的完整性"""
    errors = []
    answer_dist = {"A": 0, "B": 0, "C": 0, "D": 0}
    
    for art in data:
        aid = art["id"]
        
        # 检查必填字段
        for field in ["id", "type", "subject", "grade", "difficulty", "question", "options", "answer", "analysis"]:
            if field not in art:
                errors.append(f"{aid}: 缺少字段 {field}")
        
        # 检查options为空数组
        if art.get("options") != []:
            errors.append(f"{aid}: options应为空数组[]")
        
        # 检查答案格式并统计分布
        ans = art.get("answer", "")
        import re
        letters = re.findall(r'\(([1-9])\) ([ABCD])', ans)
        if len(letters) != 5:
            errors.append(f"{aid}: 答案应包含5个小题，当前: {ans}")
        else:
            for _, letter in letters:
                answer_dist[letter] += 1
        
        # 检查每道题的选项是否完整（格式为 (n) Q?\nA. ... B. ... C. ... D. ...）
        q = art.get("question", "")
        for i in range(1, 6):
            # 找到第i题的位置
            q_pattern = re.compile(r'\(' + str(i) + r'\)\s+')
            m = q_pattern.search(q)
            if not m:
                errors.append(f"{aid}: 找不到第{i}题")
                continue
            start = m.start()
            # 找到下一题或文章结尾作为边界
            next_q = re.compile(r'\(' + str(i+1) + r'\)\s+')
            end_m = next_q.search(q)
            end = end_m.start() if end_m else len(q)
            section = q[start:end]
            
            opts_found = re.findall(r'^[A-D]\.', section, re.MULTILINE)
            if len(opts_found) < 4:
                errors.append(f"{aid}: 第{i}题选项不完整(找到{len(opts_found)}个: {opts_found})")
        
        # 检查每个问题的四个选项长度是否接近
        for i in range(1, 6):
            q_pattern = re.compile(r'\(' + str(i) + r'\)\s+')
            m = q_pattern.search(q)
            if not m:
                continue
            start = m.start()
            next_q = re.compile(r'\(' + str(i+1) + r'\)\s+')
            end_m = next_q.search(q)
            end = end_m.start() if end_m else len(q)
            section = q[start:end]
            
            opts_len = []
            for opt in ["A", "B", "C", "D"]:
                om = re.search(rf'^{opt}\.\s*(.+?)(?:\n^[A-D]\.|$)', section, re.MULTILINE | re.DOTALL)
                if om:
                    text = om.group(1).strip()
                    opts_len.append(len(text))
                    
            if opts_len and min(opts_len) > 0 and max(opts_len) / min(opts_len) > 1.5:
                errors.append(f"{aid} Q{i}: 选项长度差距过大 {opts_len}")
    
    return errors, answer_dist


if __name__ == "__main__":
    output_path = "/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/reading_batch2.json"
    
    # 验证
    errs, dist = validate_articles(articles)
    print("=" * 60)
    print("验证结果")
    print("=" * 60)
    if errs:
        print(f"⚠️ 发现 {len(errs)} 个问题:")
        for e in errs:
            print(f"  - {e}")
    else:
        print("✅ 所有文章通过验证！")
    
    print(f"\n答案分布: {dist}")
    total = sum(dist.values())
    print(f"总计: {total} 个小题")
    
    # 写入JSON
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(articles, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ 已写入 {output_path}")
    print(f"共生成 {len(articles)} 篇阅读理解文章")
