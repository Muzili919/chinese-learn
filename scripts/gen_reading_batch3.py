#!/usr/bin/env python3
"""
生成初中英语阅读理解 Batch3 (第11-15篇)
主题: 11.名人励志  12.安全急救  13.志愿者活动  14.中国传统文化  15.未来职业规划
"""

import json

OUTPUT_FILE = "/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/reading_batch3.json"

# ============================================================
# 第11篇: 名人励志故事 - Thomas Edison
# ============================================================
article_11 = {
    "id": "en_j2_read_011",
    "type": "choice",
    "subject": "english",
    "grade": 8,
    "difficulty": "medium",
    "question": """阅读下面短文。

The Boy Who Never Gave Up

Thomas Edison is one of the most famous inventors in history. He held over 1,000 patents (专利) for inventions such as the light bulb, the phonograph (留声机), and the movie camera. However, few people know that Edison was not a good student at school.

As a young boy, Edison had trouble following lessons in class. His teachers thought he was not clever enough to learn. His mother, however, believed in him. She decided to teach him at home. She read books to him, encouraged him to ask questions, and let him do experiments in the basement.

One day, when Edison was working on his light bulb experiment, he failed for the thousandth time. His assistant felt discouraged and said, "We have wasted so much time and money. We should give up." Edison smiled and replied, "We have not failed. We have just found 1,000 ways that don't work. Success is just around the corner."

After many more attempts, Edison finally created a practical light bulb that could burn for over 1,200 hours. When people asked him about the secret of his success, he said simply: "Genius is one percent inspiration and ninety-nine percent perspiration."

Edison worked until he was over 80 years old. Even on his last days, he was still thinking about new ideas. Today, his inventions continue to change our lives. The next time you turn on a light or watch a movie, remember the boy who never gave up.

(1) What was Edison like as a student at school?
A. He was the top student in his class
B. He had difficulty keeping up with lessons
C. He got along well with all his teachers
D. He never missed a single school day

(2) Who helped Edison continue learning after he left school?
A. His father who was a rich businessman
B. A kind teacher from another school
C. His mother who taught him at home
D. An older brother who loved science

(3) How did Edison respond after failing 1,000 times?
A. He felt sad and wanted to quit trying
B. He blamed his assistant for the failure
C. He saw each failure as a useful lesson
D. He asked other scientists for immediate help

(4) What does Edison mean by "ninety-nine percent perspiration"?
A. Being smart is more important than working hard
B. Most of success comes from hard work and effort
C. Sweating helps you think of better ideas
D. Ninety-nine inventors fail before one succeeds

(5) What can we learn from Edison's story?
A. Only geniuses can become great inventors
B. Giving up early saves time and energy
C. Never stop trying when you face difficulties
D. Working alone is better than with others""",
    "options": [],
    "answer": "(1) B (2) C (3) C (4) B (5) C",
    "analysis": "(1) B【细节理解】第二段Edison had trouble following lessons in class——他在课堂上跟不上课程；A是优等生与原文矛盾；C和老师相处好、D从不缺席均未提及\n(2) C【细节理解】第三段His mother...decided to teach him at home——母亲决定在家教他；A富商父亲、B另一个学校的老师、D爱科学的哥哥都没有依据\n(3) C【推理判断】第四段Edison说We have not failed. We have just found 1,000 ways that don't work——他把每次失败当作排除一种错误方法的经验；A想放弃正好相反；B责怪助手和D求助其他科学家都不是他的反应\n(4) B【词义猜测】perspiration意为汗水，这里比喻辛勤努力；整句话意思是天才=1%灵感+99%汗水，强调努力的重要性；A聪明更重要与原意相反；C流汗帮助思考和D99个发明家失败都不对\n(5) C【主旨大意】全文围绕Edison从被老师认为不聪明到成为伟大发明家的历程，核心精神是永不放弃；A只有天才才能成为发明家和B早放弃省时间都与主旨相反；D单独工作更好文中并未比较"
}

# ============================================================
# 第12篇: 安全知识与急救
# ============================================================
article_12 = {
    "id": "en_j2_read_012",
    "type": "choice",
    "subject": "english",
    "grade": 8,
    "difficulty": "medium",
    "question": """阅读下面短文。

Stay Safe: What Every Teenager Should Know

Accidents happen every day, but knowing what to do can make a big difference between a small problem and a serious danger. Here are some basic safety tips that every teenager should learn.

**Fire Safety**
If you smell smoke or see fire, stay calm. Do NOT use the elevator — always take the stairs. Cover your mouth and nose with a wet cloth if possible, and get out of the building quickly. Once outside, call 119 (the fire emergency number in China) immediately. Never go back inside a burning building for your belongings. Things can be replaced; your life cannot.

**Water Safety**
Never swim alone, even if you are a strong swimmer. Always swim where there are lifeguards present. If you see someone struggling in the water, do NOT jump in to save them unless you have been trained. Instead, throw them a floating object like a life ring or a long stick. Many drownings happen because untrained helpers also get into trouble.

**First Aid Basics**
Learn simple first aid skills. If someone gets a small cut, wash it with clean water and press a clean cloth on it to stop the bleeding. For burns, cool the area under running water for at least 10 minutes. Do NOT put ice, butter, or toothpaste on a burn — these old methods can make it worse. If someone faints (晕倒), lay them flat and lift their legs slightly. Call for help if they do not wake up within a few minutes.

**Road Safety**
Always wear a helmet when riding a bike or electric scooter. Follow traffic lights and cross roads at zebra crossings. Put away your phone while walking near traffic. Looking at your screen for just two seconds means walking blind for about 10 meters at normal speed.

(1) What should you do if there is a fire?
A. Take the elevator to escape faster than others
B. Go back inside to fetch your favorite things
C. Use stairs and cover your nose with a wet cloth
D. Wait for firefighters before doing anything

(2) Why should you avoid jumping into water to save someone?
A. The person in trouble can swim out by themselves
B. Untrained rescuers may also be in danger
C. Jumping into cold water makes you sick easily
D. Lifeguards will get angry at you for helping

(3) Which is the RIGHT way to treat a small cut?
A. Put some butter on it to stop the pain
B. Wash it and press a cloth to stop bleeding
C. Cover it with ice to reduce swelling quickly
D. Leave it open so the air can dry it naturally

(4) What does the writer say about using phones near traffic?
A. It is fine if you walk very slowly and carefully
B. You should only check messages at green lights
C. Looking at your phone makes you walk dangerously
D. Phones help you find safe places to cross

(5) What is the main purpose of this passage?
A. To tell scary stories about accidents
B. To explain why teenagers often get hurt
C. To provide basic safety knowledge for teens
D. To describe how doctors treat injuries""",
    "options": [],
    "answer": "(1) C (2) B (3) B (4) C (5) C",
    "analysis": "(1) C【细节理解】第一部分always take the stairs和cover mouth and nose with a wet cloth——走楼梯+湿布捂口鼻；A乘电梯明确禁止（Do NOT use elevator）；B回去拿东西也禁止（Never go back inside）；D等消防员什么都不做不对，应先自救撤离\n(2) B【细节理解】第二部分do NOT jump in...unless trained和untrained helpers also get into trouble——未经训练的人下水救人自己也会有危险；A溺水者能自己游出太理想化；C冷水让人生病不是原因；D救生员会生气毫无根据\n(3) B【细节理解】第三部分wash it with clean water and press a clean cloth on it——清洗+按压止血；A黄油止痛用于烧伤不对（且文章说butter使伤情更重）；C冰块消肿不是割伤的处理方式；D自然风干不处理不是正确做法\n(4) C【细节理解】第四部分looking at your screen for just two seconds means walking blind for about 10 meters——看手机等于盲目行走很危险；A只要慢一点就行的说法被具体数字否定；B绿灯才看消息不是建议；D手机帮找安全过街地点未提及\n(5) C【主旨大意】文章分四个板块介绍安全知识（火/水/急救/交通），目的是提供基础安全常识；A讲恐怖故事和B解释为什么青少年受伤都不是目的；D描述医生如何治疗受伤只涉及很小一部分"
}

# ============================================================
# 第13篇: 志愿者活动
# ============================================================
article_13 = {
    "id": "en_j2_read_013",
    "type": "choice",
    "subject": "english",
    "grade": 8,
    "difficulty": "medium",
    "question": """阅读下面短文。

A Weekend That Changed Me

Last month, my teacher asked our class to do at least four hours of volunteer work during the weekend. At first, I was not excited about it. I had planned to play video games and sleep late. But what happened that weekend surprised me.

I chose to volunteer at Sunshine Nursing Home (养老院). My job was to spend time with elderly people who did not have many visitors. When I arrived, I felt nervous. What would I say to strangers who were much older than me?

The first person I met was Grandma Wang, an 82-year-old woman who used to be a Chinese teacher. She told me stories about her students from 50 years ago. Some became doctors, others became engineers, and one even wrote books that I had read! I was amazed that this gentle old lady had influenced so many lives.

Then I met Grandpa Li, who loved playing chess. He had no one to play with because his children lived in another city. We played three games, and he beat me every time. But he patiently taught me some strategies and laughed at my mistakes instead of making fun of me. "Losing is how we learn," he said wisely.

I also helped serve lunch and sang songs with a group of elders. Their smiles made me feel warmer than any video game ever could. Before leaving, Grandma Wang held my hand and said, "Thank you for coming. You made my day."

On the bus ride home, I realized something important. I had gone there thinking I was doing them a favor. But actually, they had given me far more — their wisdom, their stories, and their kindness. Since then, I have returned every Saturday. Volunteering is not about giving; it is about sharing and growing together.

(1) How did the writer feel about volunteering at first?
A. Excited and eager to start right away
B. Nervous but ready for new experiences
C. unwilling and preferred his own plans
D. Curious about what nursing homes were like

(2) What did Grandma Wang use to do for a living?
A. She was a doctor in a big city hospital
B. She worked as a writer publishing books
C. She taught Chinese at a school
D. She managed a large engineering company

(3) What did the writer learn from Grandpa Li through chess?
A. Winning is the only thing that matters
B. Older people are too slow to play well
C. Losing can be a valuable way to learn
D. Chess is easier than video games

(4) What changed the writer's mind about volunteering?
A. The teacher promised extra credit points
B. Elders shared wisdom and showed kindness
C. He needed service hours for his college application
D. His parents forced him to keep going back

(5) Which is the best title for this passage?
A. How to Play Chess with Old People
B. My Busy Weekend Playing Video Games
C. A Volunteer Experience That Taught Me a Lesson
D. Why Nursing Homes Need More Workers""",
    "options": [],
    "answer": "(1) C (2) C (3) C (4) B (5) C",
    "analysis": "(1) C【细节理解】第一段at first, I was not excited和had planned to play games and sleep late——一开始不情愿，只想打游戏睡懒觉；A兴奋 eager 正好相反；B紧张但准备好面对新体验是到了养老院之后的感觉；D好奇养老院是什么样的也不是初始感受\n(2) C【细节理解】第三段an 82-year-old woman who used to be a Chinese teacher——她曾经是语文老师；A医生、B作家、D工程公司经理都是她的学生后来从事的职业\n(3) C【细节理解】第四段Grandpa Li说Losing is how we learn——输是学习的方式；A赢是唯一重要的事与原文矛盾；B老人太慢下不好不符合patently taught me的描述；D象棋比电子游戏简单没有提到\n(4) B【推理判断】最后一段they had given me far more—their wisdom, their stories, and their kindness——老人的智慧和善良改变了他对志愿者的看法；A额外学分、C大学申请用时、D父母强迫都未提及\n(5) C【主旨大意】全文讲述一次志愿者经历如何改变了作者的观念，核心在于从中获得的感悟；A怎么跟老人下棋只是一个细节；B玩电子游戏的周末与实际内容不符；D养老院需要更多工人并非文章讨论的主题"
}

# ============================================================
# 第14篇: 中国传统文化 - 中国茶文化
# ============================================================
article_14 = {
    "id": "en_j2_read_014",
    "type": "choice",
    "subject": "english",
    "grade": 8,
    "difficulty": "medium",
    "question": """阅读下面短文。

The Art of Chinese Tea

Tea is one of China's most important gifts to the world. It has been part of Chinese culture for thousands of years. Today, tea is enjoyed by people in almost every country, but its story began in ancient China.

According to legend, tea was discovered by Shen Nong, an ancient Chinese ruler, around 2737 BC. One day, while boiling water outdoors, some leaves from a wild tree fell into his pot. The water turned a brownish color and gave off a pleasant smell. Shen Nong tasted it and found it refreshing. This accidental discovery marked the beginning of tea drinking.

There are six main types of Chinese tea: green tea (绿茶), black tea (called red tea in China), oolong tea (乌龙茶), white tea, dark tea (普洱茶), and yellow tea. Each type goes through different processing methods. Green tea keeps the natural color of leaves because it is not fermented (发酵). Oolong tea is partly fermented, giving it a taste between green and black tea.

In traditional Chinese culture, serving tea shows respect and politeness. Younger people offer tea to elders to show honor. At weddings, the bride and groom serve tea to their parents to thank them for raising them. In business meetings, offering tea is a way of welcoming guests and building trust. There is even a Chinese saying: "Better three days without food than one day without tea."

China has many famous tea-growing areas. Longjing (Dragon Well) tea from Hangzhou is probably the most well-known abroad. Tieguanyin (Iron Goddess of Mercy) from Fujian is loved for its rich floral aroma (花香). Pu'er tea from Yunnan is special because it gets better with age, much like fine wine.

Today, Chinese tea culture is spreading around the world. More young people are learning the art of tea ceremony and appreciating this healthy, meaningful tradition.

(1) According to legend, how was tea first discovered?
A. Shen Nong found it during a scientific experiment
B. Wild leaves accidentally fell into boiling water
C. An emperor ordered farmers to grow tea plants
D. Travelers brought it from a foreign country

(2) What makes green tea different from black tea in processing?
A. Green tea comes from different kinds of trees
B. Black tea needs more sugar than green tea
C. Green tea is not fermented during production
D. Black tea can only grow in southern China

(3) In which situation do Chinese people traditionally serve tea?
A. When they want to refuse a guest's request
B. When they need to finish a meal very quickly
C. To show respect, welcome guests, or give thanks
D. Only during formal ceremonies in palaces

(4) What is special about Pu'er tea mentioned in the passage?
A. It must be drunk within one week of buying
B. It tastes best when mixed with milk and sugar
C. Its quality improves as it grows older
D. It is the only tea grown in Yunnan Province

(5) What is the writer's attitude toward Chinese tea culture?
A. It is an outdated habit that young people reject
B. It is only popular among elderly Chinese people
C. It is a valuable tradition spreading worldwide
D. It is less interesting than coffee culture""",
    "options": [],
    "answer": "(1) B (2) C (3) C (4) C (5) C",
    "analysis": "(1) B【细节理解】第二段some leaves from a wild tree fell into his pot——野树叶偶然掉进开水壶；A神农科学实验发现不对，是意外发现；C皇帝命令农民种茶和D旅行者从外国带来都不符合传说\n(2) C【细节理解】第三段green tea is not fermented——绿茶不发酵是其加工特点；A来自不同的树不对，同种茶树不同工艺；B黑茶加更多糖和D只在华南种植均未提及\n(3) C【细节理解】第四段serving tea shows respect、offer tea to elders show honor、weddings serve to thank parents、welcoming guests——总结为表达尊重/欢迎/感谢等多种场合；A拒绝客人请求和D只用于皇宫典礼都错；B快速吃完饭也不对\n(4) C【细节理解】第五段Pu'er tea...gets better with age——普洱越陈越香；A一周内喝完反了；B加奶加糖是西式喝茶方式不是普洱的特点；D云南唯一的茶也不对，云南还有其他茶\n(5) C【观点态度】最后一段spreading around the world、young people are learning、appreciating this healthy meaningful tradition——作者持积极肯定态度，认为这是有价值的正在全球传播的传统；A年轻人排斥的旧习和B只有老年人才喜欢都与最后一段矛盾；D不如咖啡有趣属于主观比较文中没有"
}

# ============================================================
# 第15篇: 未来职业规划
# ============================================================
article_15 = {
    "id": "en_j2_read_015",
    "type": "choice",
    "subject": "english",
    "grade": 8,
    "difficulty": "medium",
    "question": """阅读下面短文。

Designing Your Future Career

"What do you want to be when you grow up?" This question can seem stressful for many middle school students. With so many choices available, how do you pick the right path? Here is some advice from career experts.

First, know yourself. Think about what subjects you enjoy and what you are good at. Do you love solving math problems? You might enjoy engineering or finance. Are you interested in reading and writing? Journalism, teaching, or law could suit you. Do you like helping people? Consider medicine, psychology, or social work. Your strengths and interests are the best starting point.

Second, explore different jobs. Don't limit yourself to jobs you already know about. New careers appear every year due to technology. Ten years ago, nobody had heard of jobs like social media manager, app developer, or data analyst. Talk to adults about their work, watch documentaries about different professions, or try part-time and volunteer experiences to see what feels right for you.

Third, develop useful skills now. No matter what job you choose in the future, certain skills will always matter. Communication skills help you express ideas clearly. Teamwork skills allow you to work well with others. Problem-solving skills help you deal with challenges. Learning English and basic computer skills opens doors to more opportunities. These skills take years to build, so start practicing today.

Fourth, be flexible. The world is changing fast. Some jobs that exist today may disappear in 20 years, and jobs we cannot imagine today will likely appear. Experts predict that today's students will change careers five to seven times during their working lives. So do not worry too much about making one perfect choice now. Focus on learning and growing, and trust that opportunities will come.

Remember: choosing a career is not a one-time decision. It is a journey of discovering who you are and what you can contribute to the world.

(1) What is advised as the first step in career planning?
A. Asking parents to decide your future job
B. Following whatever friends are choosing
C. Understanding your own interests and strengths
D. Picking the highest-paying profession

(2) Why does the writer suggest exploring unfamiliar jobs?
A. Because technology creates new careers regularly
B. Because traditional jobs will disappear soon
C. Because familiar jobs are usually poorly paid
D. Because new jobs are always easier than old ones

(3) Which skill does the text mention as always important?
A. The ability to speak several foreign languages
B. Knowing how to cook healthy meals
C. Being able to communicate and solve problems
D. Having experience driving different vehicles

(4) What do experts say about future careers?
A. Everyone will have only one lifelong job
B. People are likely to change jobs many times
C. Choosing a career is easier than before
D. Technology will replace all human workers soon

(5) What is the main message of this passage?
A. Students should focus only on getting high grades
B. Career planning is about knowing and developing yourself
C. Making money is the most important goal in life
D. Parents should choose careers for their children""",
    "options": [],
    "answer": "(1) C (2) A (3) C (4) B (5) B",
    "analysis": "(1) C【细节理解】第二段know yourself和Your strengths and interests are the best starting point——了解自己的兴趣和特长是起点；A让父母决定和D选最高薪职业都不是建议；B跟随朋友的选择更不是第一步\n(2) A【细节理解】第三段New careers appear every year due to technology和十年前没人听说的新工作——因为技术发展不断产生新职业所以要去探索不熟悉的领域；B传统工作很快消失太绝对；C熟悉的工作通常低薪和D新工作总是更容易都不准确\n(3) C【细节理解】第四段Communication skills、Teamwork skills、Problem-solving skills——沟通/团队协作/解决问题的能力始终重要；A会多种外语虽然有用但文中说的是learning English（一门外语）而非几种语言；B做饭和D开各种车都没提到\n(4) B【细节理解】第五段experts predict...change careers five to seven times during working lives——专家预测一生中可能换五到七次职业；A只有一个终生工作和C比以前容易选择都与原文矛盾；D技术很快取代所有人类工人过于极端\n(5) B【主旨大意】围绕职业规划给出四条建议：认识自我/探索职业/培养技能/保持灵活——核心是认识和发展自己来规划职业生涯；A只关注高分、C赚钱最重要、D父母为孩子选职业都与文章传达的理念相悖"
}

# 汇总所有文章
all_articles = [article_11, article_12, article_13, article_14, article_15]

def validate_article(a):
    """验证单篇文章的数据完整性"""
    errors = []
    
    # 检查必填字段
    required_fields = ["id", "type", "subject", "grade", "difficulty", "question", "answer", "analysis"]
    for f in required_fields:
        if f not in a:
            errors.append(f"{a.get('id','?')}: 缺少字段 {f}")
    
    # 检查answer格式
    ans = a["answer"]
    import re
    expected_pattern = r"\((\d)\s+[A-D]\)"
    matches = re.findall(expected_pattern, ans)
    if len(matches) != 5:
        errors.append(f"{a['id']}: answer应有5个小题答案，实际找到{len(matches)}个")
    
    # 提取各题答案字母
    answer_letters = re.findall(r"\(\d+\s+([A-D])\)", ans)
    
    # 统计ABCD分布
    from collections import Counter
    dist = Counter(answer_letters)
    
    return errors, dist, len(answer_letters)

if __name__ == "__main__":
    print("=" * 60)
    print("初中英语阅读理解 Batch3 生成器 (第11-15篇)")
    print("=" * 60)
    
    total_errors = []
    
    for i, art in enumerate(all_articles):
        errs, dist, count = validate_article(art)
        prefix = f"[第{i+1}篇] {art['id']} ({art['question'].split(chr(10))[1][:30]}...)"
        
        if errs:
            total_errors.extend(errs)
            print(f"❌ {prefix}")
            for e in errs:
                print(f"   ⚠️  {e}")
        else:
            print(f"✅ {prefix}")
            print(f"   答案分布: {dict(dist)} | 小题数: {count}")
    
    print("\n" + "=" * 60)
    
    if total_errors:
        print(f"⚠️ 发现 {len(total_errors)} 个问题，请检查！")
        for e in total_errors:
            print(f"  - {e}")
    else:
        print("✅ 所有5篇文章验证通过！")
    
    # 输出JSON
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_articles, f, ensure_ascii=False, indent=2)
    
    print(f"\n📄 已写入: {OUTPUT_FILE}")
    print(f"   文件大小: {len(json.dumps(all_articles, ensure_ascii=False))} 字符")
