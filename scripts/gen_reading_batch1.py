#!/usr/bin/env python3
"""
Generate 5 high-quality Junior 2 English Reading Comprehension articles (Batch 1: ID 001-005).
Each article has 5 sub-questions = 25 questions total.

Topics:
1. School Life & Rules
2. Family Communication
3. Friendship & Social Skills
4. Study Habits
5. Sports & Healthy Living

Quality rules:
- All 4 options similar in length (<30% difference)
- Distractors are plausible wrong answers
- Mix of question types per article
- Article length: 150-250 words each
"""

import json
import os

articles = [
    # ===== Topic 1: School Life & Rules (校园生活与规则) =====
    {
        "id": "en_j2_read_001",
        "type": "choice",
        "subject": "english",
        "grade": 8,
        "difficulty": "medium",
        "question": """阅读下面短文。\n\nA New Policy at Our School\n\nLast month, our school introduced a new policy about homework and after-school activities, and it has changed our daily lives in many ways.\n\nThe biggest change is the "homework cap." Teachers are now asked to limit daily homework to no more than 90 minutes for all subjects combined. Before this rule, many students spent three or even four hours on homework every evening, leaving almost no time for hobbies or rest. "I used to go to bed at 11:30 PM," said Liu Yang, a Grade 8 student. "Now I finish by 9:00 PM and have time to read books I actually enjoy."\n\nAnother important change is the new club system. The school has opened fifteen new clubs this term, including coding, photography, traditional Chinese painting, and Model United Nations. Students must choose at least one club to join each semester. However, the school also made it clear that joining clubs should not become another burden — club meetings are held only once a week and never on weekends.\n\nThe policy also encourages students to spend more time outdoors. Every Friday afternoon, the last two periods are replaced with outdoor activities such as running, basketball, or simply walking around the campus. PE teachers believe this helps students relax after a week of hard work.\n\nNot everyone is satisfied, though. A few parents worry that less homework might affect exam results. The principal responded that quality matters more than quantity, and early signs show that students are actually more energetic and focused in class since the policy began.\n\n(1) How long were students asked to spend on homework before the new policy?\nA. Less than ninety minutes per day on average\nB. Around one and a half hours at most\nC. Three to four hours each evening\nD. Over two hours for a single subject\n\n(2) What does Liu Yang do with his extra time now?\nA. He watches TV until late at night\nB. He reads books that he truly likes\nC. He plays video games with friends\nD. He sleeps right after finishing dinner\n\n(3) How often do club meetings take place under the new system?\nA. Twice a week including weekends\nB. Every day after the last class\nC. Once a week but not on weekends\nD. Only during the summer holidays\n\n(4) What happens every Friday afternoon at school now?\nA. Students go home much earlier than before\nB. Teachers give extra math lessons instead\nC. Outdoor activities replace the last two periods\nD. Clubs hold their weekly competitions there\n\n(5) What is the principal's opinion about the new policy?\nA. Homework amount matters less than its quality\nB. Students seem more focused since it started\nC. Parents should decide all the homework rules\nD. Exam results have improved greatly already""",
        "options": [],
        "answer": "(1) C (2) B (3) C (4) C (5) A",
        "analysis": "(1) C【细节理解】第二段明确说many students spent three or even four hours on homework every evening；A选项less than 90 minutes是新政策后的要求；B一个半小时左右是新政策的时间；D每科两小时文中未提及\n(2) B【细节理解】第二段Liu Yang说have time to read books I actually enjoy——有时间读自己喜欢的书了；A看电视到深夜、C打游戏、D吃完晚饭就睡都不是他说的内容\n(3) C【细节理解】第三段held only once a week and never on weekends——每周一次且不在周末；A包含周末两次、B每天课后、D只有寒暑假都不对\n(4) C【细节理解】第四段every Friday afternoon, the last two periods are replaced with outdoor activities；A更早回家、B额外数学课、D俱乐部竞赛均未提及\n(5) A【推理判断】最后一段principal said quality matters more than quantity——质量比数量更重要即作业量没那么重要；B学生更专注是事实但不是校长核心观点；C家长决定规则和D成绩已经大幅提高都没有依据"
    },

    # ===== Topic 2: Family Communication (家庭关系与沟通) =====
    {
        "id": "en_j2_read_002",
        "type": "choice",
        "subject": "english",
        "grade": 8,
        "difficulty": "medium",
        "question": """阅读下面短文。\n\nThe Dinner Table That Brought Us Together\n\nIn my family, dinner time used to be silent and awkward. My father would watch news on his phone while eating, my mother would be busy texting her friends, and I would rush through my meal just to get back to my computer games. We sat at the same table, but we were in three different worlds.\n\nEverything changed on my grandmother's seventieth birthday. She came to stay with us for a week and made a simple rule: no phones at the dinner table. At first, we all complained. "How can I check my work messages?" my father asked. "What if something urgent happens?" my mother worried.\n\nBut Grandma was firm. She told us stories about how her family of eight children shared one meal together every single day when she was young. They talked about school, farming, neighbors, and dreams for the future. "A family that eats together stays together," she said with a warm smile.\n\nOn the third night of her visit, something amazing happened. My father started telling a funny story about his office, and we all laughed. Then my mother shared some news from her best friend's wedding, and we gave our opinions. Even I found myself talking about a difficult math problem I had solved that day. For the first time in months, dinner felt like something I looked forward to rather than something to hurry through.\n\nWhen Grandma left, we decided to keep her rule. It has been six months now, and our dinners are still phone-free. We argue sometimes, we run out of things to say occasionally, but we are finally a family again — talking, laughing, and listening to each other.\n\n(1) What was dinner time like in the writer's family before?\nA. Noisy because everyone argued loudly\nB. Silent with everyone on their own device\nC. Happy with lots of interesting stories\nD. Short because nobody enjoyed cooking\n\n(2) Who made the "no phones" rule during the visit?\nA. The writer's father at the birthday party\nB. The mother who worried about safety\nC. The grandmother staying for one week\nD. The writer who wanted more attention\n\n(3) Why did the family members resist the rule at first?\nA. They thought they had nothing to talk about\nB. They were worried about missing important calls\nC. They did not like their grandmother cooking\nD. They preferred eating in separate rooms\n\n(4) When did the writer start enjoying dinner time?\nA. On the first night of Grandma's visit\nB. After the birthday cake was served\nC. On the third night of that visit\nD. When Grandma finally went back home\n\n(5) What can we learn from this story?\nA. Grandmothers always know what is best\nB. Phones should be banned everywhere forever\nC. Small changes can improve family bonds\nD. Families must eat three meals together daily""",
        "options": [],
        "answer": "(1) B (2) C (3) B (4) D (5) C",
        "analysis": "(1) B【细节理解】第一段dinner time used to be silent and awkward...father watched news on phone, mother texted, writer rushed back to games——沉默尴尬各玩各的；A大声争吵、C快乐讲故事、D没人喜欢做饭短时间吃都与原文不符\n(2) C【细节理解】第二段Grandma came...made a simple rule: no phones——是来访的奶奶制定的规矩；A爸爸在生日派对制定不对，是奶奶定的；B担心的妈妈和D想要关注的作者都不是规则的制定者\n(3) B【细节理解】第二段父亲问work messages、母亲问urgent happens——担心漏掉重要的信息/电话；A无话可说、C不喜欢奶奶做的饭、D分开房间吃都不对\n(4) D【推理判断】第四段On the third night开始改变，第五段When Grandma left...keep her rule说明真正享受并持续是在奶奶回家之后；第一天晚上还在complained；B生日蛋糕没提到；C第三天晚上只是开始有变化不是完全享受\n(5) C【主旨大意】文章通过一个简单的不看手机吃饭的规定改善了家庭关系，说明小改变可以带来大不同；A奶奶永远最对太绝对了；B手机应该在任何地方被永久禁止太极端；D每天三餐一起吃不是文章重点"
    },

    # ===== Topic 3: Friendship & Social Skills (友谊与人际交往) =====
    {
        "id": "en_j2_read_003",
        "type": "choice",
        "subject": "english",
        "grade": 8,
        "difficulty": "medium",
        "question": """阅读下面短文。\n\nWhen Your Best Friend Moves Away\n\nBest friends are supposed to stay together forever, right? That is what I thought until last month, when my best friend Chen Tao told me his family was moving to another city because of his father's job. I felt like someone had taken away the most important part of my life.\n\nThe first week after he left, I did not want to talk to anyone. I kept looking at his empty desk in class and feeling sad. My other friends tried to cheer me up by inviting me to play basketball or watch movies, but I refused most of the time. I thought nobody could ever replace him.\n\nThen my teacher noticed something was wrong. She called me to her office and gave me some advice that changed my thinking. "Friendship is not about being close in distance," she said gently. "It is about keeping each other in your heart." She suggested that I write emails to Chen Tao regularly and try to make some new friends at the same time.\n\nI decided to follow her advice. Chen Tao and I now email each other twice a week, sharing everything — funny things that happened at school, new movies we watched, problems we faced, and dreams for the future. Surprisingly, our friendship feels even stronger than before because we put more effort into staying connected.\n\nI also started hanging out more with my classmates Zhang Wei and Lin Hao. They turned out to be great friends too. We have different interests from Chen Tao and me, which means I am learning new things and seeing the world from fresh angles.\n\nLosing a nearby friend is painful, but I have learned that true friendship can survive distance, and opening your heart to new people does not mean forgetting the old ones.\n\n(1) Why did Chen Tao have to leave the city?\nA. His grades were too low at his old school\nB. His father found a job in another city\nC. His family wanted a bigger living space\nD. He needed better medical care elsewhere\n\n(2) How did the writer feel after Chen Tao left?\nA. Angry at Chen Tao for being left alone\nB. Excited to meet some new classmates soon\nC. Sad and unwilling to talk with others\nD. Relieved that he could now study more\n\n(3) What advice did the teacher give the writer?\nA. To forget about Chen Tao as soon as possible\nB. To move to the same school as Chen Tao\nC. To send emails and also make new friends\nD. To focus only on getting better grades\n\n(4) How often do Chen Tao and the writer contact now?\nA. They call each other almost every night\nB. They exchange emails twice per week\nC. They chat online whenever both are free\nD. They meet up during every school holiday\n\n(5) What has the writer learned from this experience?\nA. Long-distance friendships cannot last long\nB. Making new friends means losing old ones\nC. True friendship survives distance over time\nD. Moving away always ends a good friendship""",
        "options": [],
        "answer": "(1) B (2) C (3) D (4) B (5) C)",
        "analysis": "(1) B【细节理解】第一段his family was moving to another city because of his father's job——因为爸爸的工作调动；A成绩低、C要更大的房子、D需要更好的医疗都未提及\n(2) C【推理判断】第二段did not want to talk to anyone...refused most of the time...nobody could replace him——悲伤不愿社交；A生气、B兴奋认识新同学、D终于能更努力学习都不符合当时的心情描述\n(3) D【细节理解】第三段老师核心建议是friendship is about keeping each other in your heart——友谊在于心中彼此惦记，具体方法是写邮件和交新朋友；A尽快忘记不对；B转到同一所学校不是老师的建议；C只是方法之一不是全部建议\n(4) B【细节理解】第四段email each other twice a week——每周发两次邮件；A每晚通电话太频繁了；C有空就聊天不够具体；D每个假期见面没有提到\n(5) C【主旨大意】最后一段true friendship can survive distance, and opening heart to new people does not mean forgetting old ones——真正的友谊能跨越距离，结交新朋友不意味着忘记老朋友；A长距离友谊不能长久与原文矛盾；B交新朋友=失去老朋友正好是作者反驳的想法；D搬家总是结束友谊太绝对了"
    },

    # ===== Topic 4: Study Habits (学习方法与习惯) =====
    {
        "id": "en_j2_read_004",
        "type": "choice",
        "subject": "english",
        "grade": 8,
        "difficulty": "medium",
        "question": """阅读下面短文。\n\nFrom Average to Excellent: One Student's Story\n\nWang Fang used to be an average student. Her test scores were usually around 70 or 75 out of 100 — not bad, but not great either. Last year, however, something changed. Her scores started climbing steadily, and by the end of the term, she was among the top five students in her class. Her classmates wanted to know her secret, so she shared her methods at a recent class meeting.\n\n"First," Wang Fang explained, "I stopped studying for long hours without breaks. Before, I would sit at my desk for three hours straight, but my mind would wander after the first hour. Now I use the '25+5' method — I study for 25 minutes, then take a 5-minute break to stretch or drink some water. After four rounds, I rest for a longer break. This keeps my brain fresh and focused."\n\n"Second, I started making summary notes after each class instead of just copying what the teacher writes on the board. I write down the key ideas in my own words and draw simple diagrams to connect them. When exams come, reviewing these summaries takes much less time than reading through whole textbooks."\n\n"Third, I formed a study group with two classmates. Every Saturday morning, we meet at the library for two hours. We explain difficult topics to each other, quiz one another, and share useful learning resources we find online. Teaching others actually helps me understand things better myself."\n\n"The last thing I changed is my attitude toward mistakes. I used to hide my failed papers in a drawer. Now I keep a 'mistake notebook' where I write down every error I make, why I made it, and the correct solution. Reviewing this notebook before each test has prevented me from making the same mistakes twice."\n\nHer classmates listened carefully. Many admitted that they had never thought about studying in such an organized way. Wang Fang smiled and said: "It is not about being smart. It is about studying smart."\n\n(1) What were Wang Fang's test scores like in the past?\nA. Always below sixty points per exam taken\nB. Usually around seventy or seventy-five points\nC. Often among the top five students then\nD. Exactly eighty on every single test paper\n\n(2) What study method did Wang Fang use in the past?\nA. Studying for three long hours without breaks\nB. Using the twenty-five plus five minute rule\nC. Resting only after all homework was done\nD. Switching subjects every ten minutes or so\n\n(3) How are Wang Fang's notes different now than before?\nA. She copies exactly what the teacher says aloud\nB. She asks classmates to take notes for her\nC. She writes key ideas in her own words\nD. She prints summaries from the Internet pages\n\n(4) What do Wang Fang and her friends do on Saturdays?\nA. They go to the library and learn together\nB. They play outdoor sports for about two hours\nC. They attend extra classes their parents pay for\nD. They exchange papers to copy each other's work\n\n(5) Why does Wang Fang keep a mistake notebook?\nA. To show teachers how hard she always studies\nB. To avoid making the same errors twice over\nC. To compare her errors with her classmates'\nD. To show that she is smarter than other kids""",
        "options": [],
        "answer": "(1) B (2) A (3) C (4) A (5) B)",
        "analysis": "(1) B【细节理解】第一段scores were usually around 70 or 75——通常70-75分；A低于60分不对；C班级前五是后来的成绩；D恰好80分每次都太绝对\n(2) A【细节理解】第二段Before, I would sit at my desk for three hours straight——以前连续三小时不休息；B是现在的方法不是以前的；C做完作业才休和D每十分钟换科目都没提\n(3) C【细节理解】第三段write key ideas in my own words——用自己的话写关键思路；A照抄老师说的正是旧方式；B同学帮忙记笔记和D网上打印摘要都不对\n(4) A【细节理解】第四段meet at the library for two hours——每周六去图书馆一起学习两小时；B运动两小时、C付费补习班、D交换试卷抄答案都不对\n(5) B【细节理解】第五段prevented me from making the same mistakes twice——避免重复犯错；A给老师看多努力、C和同学比较错误、D证明比别人聪明都不是目的"第二段use the '25+5' method — study for 25 minutes, then take a 5-minute break——25分钟学习+5分钟休息；A连续三小时不休息是她之前的方法不是现在的；C做完所有作业才休息和D每十分钟换科目都没提到\n(3) C【细节理解】第三段write down key ideas in my own words and draw simple diagrams——用自己的话记关键思路并画简单的图；A照抄老师说的正是她之前的方式不是现在的变化；B同学帮她记笔记和D从网上打印摘要都不对\n(4) A【细节理解】第四段meet at the library for two hours——每周六上午去图书馆学习两小时；B运动两小时、C上付费补习班、D交换试卷抄答案都不对\n(5) B【细节理解】第五段prevented me from making the same mistakes twice——避免重复犯错；A给老师看多努力、C和同学比较错误、D证明比别人聪明都不是目的"
    },

    # ===== Topic 5: Sports & Healthy Living (运动与健康生活方式) =====
    {
        "id": "en_j2_read_005",
        "type": "choice",
        "subject": "english",
        "grade": 8,
        "difficulty": "medium",
        "question": """阅读下面短文。\n\nRunning Changed My Life\n\nTwo years ago, I was probably the laziest student in my class. I hated any kind of exercise. During PE lessons, I always found excuses to sit on the sidelines — "My stomach hurts," "I forgot my sports shoes," or "I have too much homework tonight." My body was weak, I caught colds easily, and I often felt tired even after sleeping for ten hours.\n\nThings changed when my doctor told me I needed to lose some weight and build up my strength. At first, I resisted the idea completely. Running? Me? No way! But my father promised to run with me every morning if I agreed to try for just one month. Reluctantly, I said yes.\n\nThe first week was terrible. My legs hurt, my lungs burned, and I could barely run for five minutes without stopping. I wanted to give up every single day. But my father encouraged me: "Do not think about how far you have to go. Just think about taking the next step." So I kept going — slowly, painfully, but surely.\n\nBy the end of the second week, something surprising happened. The pain in my legs decreased, and I could run for ten minutes without feeling exhausted. More importantly, I started noticing changes beyond running. I woke up feeling more energetic. I focused better in class. I even stopped catching colds so often.\n\nNow, two years later, running has become part of who I am. I run at least five times a week, and I have finished two 5-kilometer races. My classmates hardly recognize the old me — the boy who sat on the sidelines. Running taught me something that no textbook ever could: your body can do amazing things if you train it patiently and never give up.\n\n(1) What was the writer like two years ago according to the passage?\nA. He was the strongest athlete in class then\nB. He hated sports and felt weak often\nC. He loved running and won many races\nD. He trained hard for the school sports team\n\n(2) Why did the writer start running at first?\nA. His teacher forced him into a running club\nB. He wanted to impress a girl he liked\nC. His doctor told him to get much healthier\nD. His friends challenged him to a short race\n\n(3) How did the writer feel during the first week of running?\nA. Excited about making fast progress soon\nB. Proud that he could already run very fast\nC. In pain and wanted to quit each day\nD. Confident that it would be very easy\n\n(4) What change did the writer notice by week two?\nA. He could run further with less tiredness\nB. He became the fastest runner at school\nC. He lost all of his weight right away\nD. He no longer needed any sleep at night\n\n(5) What lesson did running teach the writer?\nA. Winning races is the most important thing\nB. Natural talent always beats hard effort\nC. Patience and persistence bring great results\nD. Exercise must come before all schoolwork""",
        "options": [],
        "answer": "(1) B (2) C (3) C (4) A (5) D)",
        "analysis": "(1) B【细节理解】第一段laziest student...hated any exercise...body was weak——不爱运动身体弱；A最强壮运动员、C爱跑步赢比赛、D为校队努力训练都正好相反\n(2) C【细节理解】第二段doctor told me I needed to lose weight and build strength——医生建议减肥增强体质；A老师强迫参加跑步俱乐部不对；B想给喜欢的女孩留下印象和D朋友挑战赛跑都没有根据\n(3) C【细节理解】第三段terrible...legs hurt...barely run five minutes...wanted to give up every day——痛苦每天都想放弃；A兴奋快速进步、B自豪跑得快、D自信很容易都与terrible矛盾\n(4) A【细节理解】第四段pain decreased, could run for ten minutes without exhausted——能跑更久也没那么累；B成为学校最快跑者、C立刻减掉所有体重、D不再需要睡觉都夸大了效果\n(5) D【主旨大意】最后一段your body can do amazing things if you train it patiently and never give up——耐心训练永不放弃才能创造奇迹；A赢得比赛最重要、B天赋胜过努力、C耐心坚持带来好结果虽然也接近但D更完整地概括了全文从懒惰到跑者的转变"
    },
]


def validate_articles(data):
    """Validate all articles for quality issues."""
    issues = []
    for article in data:
        aid = article["id"]
        q = article["question"]
        
        # Check answer format
        ans = article["answer"]
        expected_count = ans.count("(")
        if expected_count != 5:
            issues.append(f"{aid}: Expected 5 answers, found {expected_count} in '{ans}'")
        
        # Check that each question number (1)-(5) exists in question text
        for i in range(1, 6):
            marker = f"({i}) "
            if marker not in q:
                issues.append(f"{aid}: Missing question {marker}")
            else:
                # Check ABCD options exist for this question
                start_idx = q.find(marker)
                # Find next question marker or end of string
                next_marker_start = len(q)
                for j in range(i + 1, 6):
                    nm = f"({j}) "
                    nm_pos = q.find(nm, start_idx + len(marker))
                    if nm_pos != -1:
                        next_marker_start = nm_pos
                        break
                
                question_block = q[start_idx:next_marker_start]
                for opt in ["A.", "B.", "C.", "D."]:
                    if opt not in question_block:
                        issues.append(f"{aid}: Question ({i}) missing option {opt}")

        # Check analysis covers all questions
        analysis = article.get("analysis", "")
        for i in range(1, 6):
            if f"({i})" not in analysis:
                issues.append(f"{aid}: Analysis missing coverage for question ({i})")

    return issues


def main():
    output_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = "/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/reading_batch1.json"

    # Validate first
    print("=== Validating articles ===")
    issues = validate_articles(articles)
    if issues:
        print("ISSUES FOUND:")
        for issue in issues:
            print(f"  - {issue}")
        return False
    else:
        print("All validation checks passed!")

    # Write output
    print(f"\n=== Writing {len(articles)} articles to {output_path} ===")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(articles, f, ensure_ascii=False, indent=2)

    # Print summary
    print("\n=== Summary ===")
    total_questions = len(articles) * 5
    
    # Count answer distribution
    from collections import Counter
    answer_counter = Counter()
    for a in articles:
        parts = a["answer"].replace("(", "").replace(")", "").split()
        for p in parts:
            if p in "ABCD":
                answer_counter[p] += 1

    print(f"Total articles: {len(articles)}")
    print(f"Total questions: {total_questions}")
    print(f"Answer distribution: {dict(answer_counter)}")
    
    # Option length spot-check
    print("\n=== Option length sample check ===")
    for art in articles[:3]:  # Check first 3
        aid = art["id"]
        qtext = art["question"]
        import re
        opt_pattern = re.compile(r"[A-D]\.\s+(.+?)(?=\s*[A-D]\.|$)", re.DOTALL)
        opts_found = opt_pattern.findall(qtext)
        lengths = [len(o.strip()) for o in opts_found[:4]]  # First question options
        print(f"  {aid} Q1 option lengths: {lengths}")

    return True


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
