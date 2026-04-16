#!/usr/bin/env python3
"""
生成初中英语阅读理解题库 Batch4 (第16-20篇)
主题: 16.饮食健康 17.交通出行 18.网络安全 19.艺术与音乐 20.天气与气候
"""

import json
import re

articles = [
    # ==================== 第16篇：饮食健康 (Healthy Eating) ====================
    {
        "id": "en_j2_read_016",
        "type": "choice",
        "subject": "english",
        "grade": 8,
        "difficulty": "medium",
        "question": r"""阅读下面短文。

Healthy Eating Habits

Do you know that what you eat affects how you feel and learn? Many students today have unhealthy eating habits. They often skip breakfast because they are in a hurry to get to school. Some prefer fast food and sugary drinks instead of balanced meals.

Nutritionists suggest a simple rule for teenagers: eat a variety of foods every day. Your plate should include vegetables, fruits, grains, protein like meat or beans, and some dairy products. Breakfast is especially important because it gives you energy for the whole morning. Studies show that students who eat breakfast regularly do better in exams than those who don't.

Another important habit is drinking enough water. Most teenagers need about 8 glasses of water each day. Sugary drinks like cola can cause weight problems and tooth trouble. It's better to choose water, milk, or fresh juice.

Also, try not to eat too much at one time. Having three regular meals with healthy snacks between them is much better than eating one big meal and then feeling sleepy in class. Remember, good food helps you grow stronger and smarter!

(1) Why do many students skip breakfast according to the passage?
A. Because they don't like food in the morning
B. Because they are busy going to school
C. Because they want to lose weight
D. Because their parents don't cook for them

(2) What should a teenager's daily meal include?
A. Only meat and rice
B. Fast food and sweet drinks
C. Vegetables, fruits, grains, protein, and dairy
D. Whatever tastes delicious

(3) What do studies say about students who eat breakfast?
A. They usually get up earlier than others
B. They perform better in their tests
C. They need less sleep at night
D. They always feel hungry before lunch

(4) Which drink does the writer recommend most?
A. Cola and other sugary drinks
B. Fresh fruit juice only
C. Hot coffee in the morning
D. Water and milk

(5) What is the main idea of this passage?
A. How to cook delicious meals at home
B. Why fast food is bad for young people
C. The importance of healthy eating habits for students
D. Different types of food around the world""",
        "options": [],
        "answer": "(1) B (2) C (3) B (4) D (5) C",
        "analysis": """(1) B - 文章第二段明确提到"They often skip breakfast because they are in a hurry to get to school"，说明是因为赶时间上学。A选项"不喜欢早上吃的东西"、C选项"想减肥"、D选项"父母不做饭"在文中均未提及。
(2) C - 第二段提到"Your plate should include vegetables, fruits, grains, protein like meat or beans, and some dairy products"，即蔬菜、水果、谷物、蛋白质和乳制品都要有。A只提肉和米饭太片面，B是反面例子，D太笼统且不健康。
(3) B - 第二段末尾指出"students who eat breakfast regularly do better in exams than those who don't"，即常吃早餐的学生考试成绩更好。A起得更早、C需要更少睡眠、D午饭前总饿均未在文中出现。
(4) D - 第三段建议"It's better to choose water, milk, or fresh juice"，其中水和牛奶排在前面，是最推荐的。A可乐含糖饮料被反对，B只说果汁不够全面，C咖啡未提及。
(5) C - 全文从早餐的重要性、饮食多样性、饮水充足、规律用餐等方面论述了健康饮食习惯对学生的影响。A如何做饭未涉及，B快餐危害只是部分内容，D世界各地食物完全无关。"""
    },

    # ==================== 第17篇：交通出行 (Transportation & Safety) ====================
    {
        "id": "en_j2_read_017",
        "type": "choice",
        "subject": "english",
        "grade": 8,
        "difficulty": "medium",
        "question": r"""阅读下面短文。

How to Stay Safe on the Road

Every day, millions of people travel by bus, car, bike, or on foot. While transportation makes our lives easier, it also brings certain dangers. Learning traffic rules is necessary for everyone, no matter how old you are.

For walkers, the golden rule is simple: always use crosswalks. Never run across a busy street, even when you are late for school. Before crossing, look left, then right, and then left again. Make sure drivers can see you by making eye contact if possible. Don't play with your phone while walking near roads.

If you ride a bicycle, wearing a helmet is not just a rule — it can save your life. Always follow the same direction as cars and stop at red lights. Don't carry passengers or listen to music with earphones. Both hands should be on the handlebars so you can control your bike quickly when needed.

For passengers in cars, remember to wear your seatbelt every time. Even a slow-speed accident can cause serious injuries without it. Never distract the driver with loud games or sudden movements. When getting off a bus, wait until it stops completely, and watch out for passing bikes and motorcycles.

Road safety is everyone's responsibility. One small careless moment can change a life forever.

(1) What is the first thing walkers should do before crossing?
A. Wave to the driver to let them see you
B. Check both sides of the road carefully
C. Run as fast as possible to save time
D. Put away your mobile phone

(2) Why must bike riders keep both hands on the handlebars?
A. To show others they are experienced riders
B. To be able to control the bike in an emergency
C. Because it looks cool and professional
D. The police will give them fines otherwise

(3) What does the writer say about seatbelts?
A. Only children need to wear them
B. You can skip them on short trips
C. They prevent injuries even at low speeds
D. Drivers do not need them in city traffic

(4) Which behavior is considered dangerous according to the passage?
A. Waiting for the bus to fully stop
B. Making eye contact with drivers
C. Playing with phones near the road
D. Wearing a helmet while cycling

(5) What is the purpose of writing this passage?
A. To introduce new traffic laws in cities
B. To teach people how to stay safe while traveling
C. To explain why cars are dangerous machines
D. To compare different kinds of transportation""",
        "options": [],
        "answer": "(1) B (2) B (3) C (4) C (5) B",
        "analysis": """(1) B - 第二段提到"Before crossing, look left, then right, and then left again"，即过马路前要先仔细看两边。A挥手让司机看见不是首要动作，C跑步过马路是被禁止的，D收手机是在走路过程中不是第一步。
(2) B - 第三段说明"Both hands should be on the handlebars so you can control your bike quickly when needed"，双手扶把是为了紧急时能控制自行车。A展示经验、C看起来酷、D警察罚款文中均未提及。
(3) C - 第四段指出"Even a slow-speed accident can cause serious injuries without it"，即使低速事故安全带也能防止伤害。A只有孩子需要、B短途可跳过、D城市驾驶不需要都是错误的。
(4) C - 第二段明确禁止"Don't play with your phone while walking near roads"。A等车停稳、B与司机眼神交流、C骑车戴头盔都是推荐的安全行为，只有C是危险的。
(5) B - 文章围绕步行者、骑行者和乘车者的交通安全建议展开，目的是教导人们在出行中保持安全。A介绍新交法未提及，C解释汽车危险只是附带内容，D比较交通工具并非文章重点。"""
    },

    # ==================== 第18篇：网络安全 (Internet Safety) ====================
    {
        "id": "en_j2_read_018",
        "type": "choice",
        "subject": "english",
        "grade": 8,
        "difficulty": "medium",
        "question": r"""阅读下面短文。

Stay Smart Online

The Internet has become part of our daily life. We use it for homework, chatting with friends, watching videos, and shopping online. However, the online world also has risks that every teenager needs to understand.

First, protect your personal information. Never share your home address, phone number, or school name with strangers online. Some people pretend to be friendly but actually want to steal your information. Choose passwords that are hard to guess — mix letters, numbers, and symbols. And never use the same password for different accounts.

Second, be careful about what you post. Once something is on the Internet, it can be almost impossible to remove completely. Think twice before uploading photos or writing comments. Would you be okay if your parents or teachers saw it? If the answer is no, don't post it.

Third, watch out for cyberbullying. If someone sends you mean messages or spreads rumors about you, don't reply immediately. Save the evidence and tell a trusted adult. Blocking and reporting bullies are useful tools that platforms provide. Remember, being bullied online is not your fault.

Finally, balance your screen time. Spending too many hours on social media or games can affect your sleep, eyesight, and study results. Set a daily limit and stick to it. Real-life activities like sports and hobbies are just as important as online fun.

(1) What kind of password does the writer suggest using?
A. A short word that is easy to remember
B. Your birthday or phone number
C. A mix of letters, numbers, and symbols
D. The same one for all accounts

(2) Why should we think carefully before posting online?
A. Because posting costs too much money
B. Because posted content may stay forever
C. Because teachers will check it daily
D. Because friends might get jealous

(3) What should you do if you face cyberbullying?
A. Fight back with angry messages right away
B. Keep it secret and deal with it alone
C. Save proof and tell a trusted adult
D. Close all your social media accounts

(4) What problem can too much screen time cause?
A. Better skills at computer games
B. More online friendships
C. Problems with sleep and study
D. Improved knowledge of technology

(5) Which title best fits the passage?
A. How to Build a Personal Website
B. The History of Social Media Platforms
C. Tips for Staying Safe on the Internet
D. Why Teenagers Love Online Games""",
        "options": [],
        "answer": "(1) C (2) B (3) C (4) C (5) C",
        "analysis": """(1) C - 第二段明确说"Choose passwords that are hard to guess — mix letters, numbers, and symbols"，密码应混合字母数字和符号。A简短易记正好相反，B用生日电话号容易被猜出，D所有账户用同一密码也不安全。
(2) B - 第三段强调"Once something is on the Internet, it can be almost impossible to remove completely"，一旦发布就很难彻底删除。A花钱多不对，C老师每日检查未提及，D朋友嫉妒不是主要原因。
(3) C - 第四段建议"If someone sends you mean messages...don't reply immediately. Save the evidence and tell a trusted adult"，保存证据并告诉信任的大人。A立刻回击错误，B独自承受不对，D关闭账户过于极端。
(4) C - 最后一段指出"affect your sleep, eyesight, and study results"，影响睡眠和学业。A游戏技能更好、B更多网友、D科技知识提升都不是文中提到的负面影响。
(5) C - 文章从保护个人信息、谨慎发帖、应对网暴、控制上网时间四个方面给出网络安全的建议。A建个人网站、B社交媒体历史、D青少年为何爱玩游戏均偏离主题。"""
    },

    # ==================== 第19篇：艺术与音乐 (Art & Music) ====================
    {
        "id": "en_j2_read_019",
        "type": "choice",
        "subject": "english",
        "grade": 8,
        "difficulty": "medium",
        "question": r"""阅读下面短文。

The Power of Art and Music

Art and music are everywhere in our lives. From the songs we hear on the radio to the paintings we see in museums, they bring color and meaning to our world. But did you know that art and music also help us learn and grow?

Scientists have found interesting connections between music and the brain. Learning to play an instrument improves memory, attention, and even math skills. Students who join school bands or music clubs often get higher grades in other subjects. This is because reading music notes and keeping rhythm train the brain in special ways. Classical music, in particular, can help people feel calmer and think more clearly.

Visual arts like drawing and painting are equally valuable. When you create art, you express feelings that are hard to put into words. Many schools now use art therapy to help students who feel stressed or sad. Drawing allows the mind to relax while the hands stay busy. Research shows that spending time on creative activities can lower stress levels and increase happiness.

You don't need to be a talented artist or musician to enjoy these benefits. Singing in the shower, doodling in your notebook, or dancing to your favorite song all count. The key is to make art and music a regular part of your life, not just something you do in class.

(1) What effect does learning an instrument have on students?
A. It makes them tired from too much practice
B. It only helps them become famous musicians
C. It improves memory, attention, and math skills
D. It takes time away from other subjects

(2) Why can classical music help people according to the passage?
A. It has the fastest rhythm of all music types
B. It helps people feel calm and think clearly
C. It teaches history through beautiful songs
D. It is required in every school subject

(3) How does art help stressed students in many schools?
A. By letting them create art to reduce pressure
B. By giving them extra homework about painting
C. By asking them to visit museums more often
D. By replacing all sports classes with art lessons

(4) What does the writer say about enjoying art and music?
A. Only gifted people can truly enjoy them
B. You must take professional classes first
C. Simple everyday activities count too
D. They should only be done in art class

(5) What is the writer's attitude toward art and music?
A. Doubtful whether they are really useful
B. Surprised by how popular they have become
C. Positive about their benefits for people
D. Worried that students spend too much time on them""",
        "options": [],
        "answer": "(1) C (2) B (3) A (4) C (5) C",
        "analysis": """(1) C - 第二段指出"Learning to play an instrument improves memory, attention, and even math skills"，学乐器能改善记忆力、注意力和数学能力。A太累、B只为成名、D占用其他科目时间均与原文相反。
(2) B - 第二段提到"Classical music, in particular, can help people feel calmer and think more clearly"，古典音乐让人平静、思维更清晰。A节奏最快未提及，C教历史通过歌曲、D每科都需古典乐都不对。
(3) A - 第三段说明"Many schools now use art therapy to help students who feel stressed or sad"，学校用艺术疗法帮助压力大的学生，让他们创作艺术来减压。B额外作业、C常参观博物馆、D体育课换美术课均未提及。
(4) C - 最后一段说"Singing in the shower, doodling in your notebook, or dancing to your favorite song all count"，简单的日常活动也算数。A只有天才可以、B必须上专业班、D只能在美术课做都与原文矛盾。
(5) C - 全文列举了艺术和音乐的种种好处（提高学习能力、缓解压力、增加幸福感等），作者态度明显积极正面。A怀疑有用性、B惊讶于流行度、D担心花太多时间都不是作者的观点。"""
    },

    # ==================== 第20篇：天气与气候 (Weather & Climate) ====================
    {
        "id": "en_j2_read_020",
        "type": "choice",
        "subject": "english",
        "grade": 8,
        "difficulty": "medium",
        "question": r"""阅读下面短文。

Understanding Weather and Climate

People often confuse weather with climate, but they are quite different. Weather refers to the conditions outside right now — whether it's sunny, rainy, windy, or snowy. Weather changes quickly and can be different from one day to the next. Climate, however, describes the usual weather patterns in a place over many years. For example, a desert has a dry climate, but it might still rain there occasionally.

Meteorologists are scientists who study and predict weather. They use satellites, radar, and computers to collect information about temperature, humidity, wind speed, and air pressure. With this data, they make forecasts to help people plan their days. However, weather forecasts are not always perfect. Sudden changes can happen that even super computers cannot predict.

Climate change has become a serious global issue in recent decades. Earth's average temperature has been rising, which causes ice at the North and South Poles to melt. As a result, sea levels are going up, and some coastal cities face flooding risks. Extreme weather events like strong storms, long droughts, and heavy heatwaves are happening more often than before.

What can ordinary people do? Small actions matter. Saving electricity, riding bikes instead of driving, and planting trees can all help reduce the gases that cause climate change. Understanding the difference between weather and climate is the first step toward protecting our planet.

(1) What is the main difference between weather and climate?
A. Weather happens only in hot places
B. Climate changes faster than weather
C. Weather is short-term; climate is long-term patterns
D. Scientists can measure only climate

(2) What tools do meteorologists NOT use for forecasting?
A. Satellites in space
B. Radar systems on the ground
C. Magic stones or fortune-telling
D. Super computers for data analysis

(3) What problem is caused by rising temperatures?
A. More snow in tropical countries
B. Melting ice and rising sea levels
C. Fewer clouds in the sky everywhere
D. Stronger winds all year round

(4) What does the writer suggest ordinary people can do?
A. Move away from coastal cities
B. Become professional meteorologists
C. Take small actions like saving energy
D. Build shelters against extreme weather

(5) What can we infer from the last paragraph?
A. Individual efforts cannot make any difference
B. Climate change will solve itself over time
C. Everyone can contribute to solving the problem
D. Only governments need to worry about it""",
        "options": [],
        "answer": "(1) C (2) C (3) B (4) C (5) C",
        "analysis": """(1) C - 第一段对比说明"Weather refers to the conditions outside right now...Climate, however, describes the usual weather patterns...over many years"，天气是短期状况，气候是长期模式。A只在热的地方发生、B气候比天气变化快、D科学家只能测量气候都是错误的。
(2) C - 第二段列出气象学家使用的工具包括satellites（卫星）、radar（雷达）、computers（计算机），而magic stones或fortune-telling（魔法石头/算命）显然不在科学工具之列。
(3) B - 第三段指出"Earth's average temperature has been rising, which causes ice at the North and South Poles to melt. As a result, sea levels are going up"，温度上升导致冰融化和海平面上升。A热带更多雪、C各地云减少、D全年强风均未在文中出现。
(4) C - 最后一段建议"Saving electricity, riding bikes instead of driving, and planting trees can all help"，普通人可以通过节电、骑车、植树等小行动来帮忙。A搬离沿海城市、B成为气象学家、D建避难所都不是针对普通人的建议。
(5) C - 最后一句说"Small actions matter"和"Understanding...is the first step toward protecting our planet"，暗示每个人的努力都有贡献。A个人努力没用、B问题会自行解决、D只有政府需要操心都与原文相反。"""
    },
]


def validate_article(art):
    """验证一篇文章的质量"""
    errors = []
    warnings = []
    
    # 检查基本字段
    required_fields = ["id", "type", "subject", "grade", "difficulty", "question", "options", "answer", "analysis"]
    for f in required_fields:
        if f not in art:
            errors.append(f"缺少字段: {f}")
    
    # 检查答案格式
    ans = art.get("answer", "")
    expected_pattern = r"^\((\d)\s+[ABCD]\)(\s+\(\d+\s+[ABCD]\)){4}$"
    if not re.match(expected_pattern, ans.strip()):
        warnings.append(f"答案格式可能异常: {ans}")
    
    # 检查每道题的选项长度分布
    q = art.get("question", "")
    option_pattern = r"([ABCD])\.(.+?)(?=\n[ABCD]\.|\n\(\d+\)|$)"
    options_found = re.findall(option_pattern, q, re.DOTALL)
    
    if len(options_found) < 15:  # 5题 x 4选项 = 至少15个
        warnings.append(f"选项数量不足: 找到 {len(options_found)} 个")
    
    # 检查每个选项长度
    opt_lengths = []
    for label, text in options_found:
        clean_text = text.strip()
        opt_lengths.append((label, len(clean_text)))
    
    # 按题分组检查
    for q_num in range(1, 6):
        q_opts = [l for l in opt_lengths[:4]]  # 每组4个
        if len(opt_lengths) >= 4:
            opt_lengths = opt_lengths[4:]
        
        lengths = [t[1] for t in q_opts]
        if lengths:
            max_len = max(lengths)
            min_len = min(lengths)
            if max_len > 0 and min_len / max_len < 0.5:
                warnings.append(f"第{q_num}题选项长度差异过大: {dict(q_opts)}")
    
    return errors, warnings


def main():
    print(f"生成 Batch4 阅读理解题目: {len(articles)} 篇\n")
    
    total_errors = 0
    total_warnings = 0
    
    for i, art in enumerate(articles):
        errs, warns = validate_article(art)
        total_errors += len(errs)
        total_warnings += len(warns)
        
        status = "✅ OK" if not errs else f"❌ {len(errs)} 错误"
        if warns:
            status += f" ⚠️ {len(warns)} 警告"
        
        print(f"  [{i+1}/5] {art['id']}: {status}")
        for e in errs:
            print(f"      ERROR: {e}")
        for w in warns:
            print(f"      WARN:  {w}")
    
    print(f"\n总计: {total_errors} 错误, {total_warnings} 警告")
    
    # 输出JSON
    output_path = "/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/reading_batch4.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(articles, f, ensure_ascii=False, indent=2)
    
    print(f"\n已写入: {output_path}")
    return total_errors == 0


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
