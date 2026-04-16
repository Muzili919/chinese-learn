#!/usr/bin/env python3
"""
生成初中英语（7/8/9年级）听写词库，追加到 dictation_en_words.json
基于人教版 Go for It! / 新目标英语 教材核心词汇表
"""

import json

# ========== 七年级上册 (100词) ==========
# 问候、颜色、数字、家庭、学校物品、食物、身体部位、基础形容词等
g7s1_words = [
    # 问候与介绍 (10)
    ("hello", "你好；喂", "/həˈləʊ/", "Hello, my name is Tom."),
    ("hi", "嗨；你好", "/haɪ/", "Hi, nice to meet you."),
    ("goodbye", "再见", "/ˌɡʊdˈbaɪ/", "Goodbye, see you tomorrow."),
    ("name", "名字；名称", "/neɪm/", "What is your name?"),
    ("nice", "令人愉快的", "/naɪs/", "Nice to meet you, too."),
    ("meet", "遇见；相逢", "/miːt/", "Nice to meet you."),
    ("too", "也；太", "/tuː/", "I like apples, too."),
    ("your", "你的；你们的", "/jɔːr/", "What is your name?"),
    ("my", "我的", "/maɪ/", "This is my friend."),
    ("his", "他的", "/hɪz/", "His name is Jack."),
    # 颜色 (8)
    ("red", "红色的；红色", "/red/", "The apple is red."),
    ("green", "绿色的；绿色", "/ɡriːn/", "The grass is green."),
    ("blue", "蓝色的；蓝色", "/bluː/", "The sky is blue."),
    ("yellow", "黄色的；黄色", "/ˈjeləʊ/", "The banana is yellow."),
    ("orange", "橙色的；橙色", "/ˈɒrɪndʒ/", "I have an orange pen."),
    ("black", "黑色的；黑色", "/blæk/", "His cat is black."),
    ("white", "白色的；白色", "/waɪt/", "The snow is white."),
    ("purple", "紫色的；紫色", "/ˈpɜːpl/", "She likes purple dresses."),
    # 数字与数量 (8)
    ("one", "一", "/wʌn/", "I have one book."),
    ("two", "二", "/tuː/", "There are two cats."),
    ("three", "三", "/θriː/", "I can see three birds."),
    ("four", "四", "/fɔːr/", "There are four seasons."),
    ("five", "五", "/faɪv/", "Give me five apples."),
    ("six", "六", "/sɪks/", "He is six years old."),
    ("seven", "七", "/ˈsevn/", "There are seven days in a week."),
    ("eight", "八", "/eɪt/", "I have eight pencils."),
    # 家庭成员 (8)
    ("mother", "母亲；妈妈", "/ˈmʌðər/", "My mother is a teacher."),
    ("father", "父亲；爸爸", "/ˈfɑːðər/", "My father works in a hospital."),
    ("parent", "父（母）亲", "/ˈperənt/", "My parents love me very much."),
    ("sister", "姐；妹", "/ˈsɪstər/", "My sister is ten years old."),
    ("brother", "兄；弟", "/ˈbrʌðər/", "I have a younger brother."),
    ("grandmother", "祖母；外祖母", "/ˈɡrʌnmʌðər/", "My grandmother is very kind."),
    ("grandfather", "祖父；外祖父", "/ˈɡrɑːnfɑːðər/", "My grandfather tells great stories."),
    ("family", "家庭；家人", "/ˈfæməli/", "I love my family."),
    # 学校用品 (10)
    ("pen", "钢笔；笔", "/pen/", "Please lend me a pen."),
    ("pencil", "铅笔", "/ˈpensl/", "Use a pencil to do the homework."),
    ("eraser", "橡皮擦", "/ɪˈreɪzər/", "May I use your eraser?"),
    ("ruler", "尺子", "/ˈruːlər/", "I need a ruler for math class."),
    ("book", "书", "/bʊk/", "This is my English book."),
    ("bag", "包；书包", "/bæɡ/", "Put your books in the bag."),
    ("desk", "书桌；课桌", "/desk/", "Sit at your desk, please."),
    ("chair", "椅子", "/tʃer/", "Take a seat on the chair."),
    ("notebook", "笔记本", "/ˈnəʊtbʊk/", "Write it down in your notebook."),
    ("dictionary", "字典；词典", "/ˈdɪkʃəneri/", "Look up the word in the dictionary."),
    # 身体部位 (8)
    ("head", "头", "/hed/", "Shake your head."),
    ("face", "脸", "/feɪs/", "Wash your face every morning."),
    ("eye", "眼睛", "/aɪ/", "Keep your eyes open."),
    ("ear", "耳朵", "/ɪr/", "Listen with your ears carefully."),
    ("nose", "鼻子", "/noʊz/", "The dog has a big nose."),
    ("mouth", "嘴巴", "/maʊθ/", "Open your mouth and say 'ah'."),
    ("hand", "手", "/hænd/", "Raise your hand if you know."),
    ("arm", "手臂；胳膊", "/ɑːrm/", "He broke his arm playing soccer."),
    # 食物与饮料 (10)
    ("apple", "苹果", "/ˈæpl/", "An apple a day keeps the doctor away."),
    ("banana", "香蕉", "/bəˈnænə/", "Monkeys love bananas."),
    ("bread", "面包", "/bred/", "I eat bread for breakfast."),
    ("milk", "牛奶", "/mɪlk/", "Drink milk every day."),
    ("egg", "蛋；鸡蛋", "/eɡ/", "I have an egg for breakfast."),
    ("rice", "米饭；大米", "/raɪs/", "Chinese people eat rice every day."),
    ("chicken", "鸡肉；鸡", "/ˈtʃɪkɪn/", "Do you like chicken?"),
    ("water", "水", "/ˈwɔːtər/", "Drink more water, please."),
    ("food", "食物", "/fuːd/", "The food here is delicious."),
    ("fruit", "水果", "/fruːt/", "Eat more fruit for health."),
    # 服装 (6)
    ("shirt", "衬衫", "/ʃɜːrt/", "Put on your clean shirt."),
    ("skirt", "裙子", "/skɜːrt/", "She looks pretty in that skirt."),
    ("shoe", "鞋", "/ʃuː/", "Buy a new pair of shoes."),
    ("sock", "短袜", "/sɒk/", "Where is my other sock?"),
    ("clothes", "衣服", "/kləʊðz/", "Put on warm clothes today."),
    ("trousers", "裤子", "/ˈtraʊzərz/", "These trousers are too long."),
    # 形容词与副词 (10)
    ("good", "好的", "/ɡʊd/", "She is a good student."),
    ("bad", "坏的；糟的", "/bæd/", "That was a bad idea."),
    ("big", "大的", "/bɪɡ/", "Elephants are big animals."),
    ("small", "小的；小号的", "/smɔːl/", "The cat is very small."),
    ("long", "长的", "/lɒŋ/", "The river is very long."),
    ("short", "短的；矮的", "/ʃɔːrt/", "He has short hair."),
    ("happy", "快乐的", "/ˈhæpi/", "I am happy today."),
    ("sad", "悲伤的；难过的", "/sæd/", "Don't be sad, my friend."),
    ("beautiful", "美丽的", "/ˈbjuːtɪfl/", "The flower is beautiful."),
    ("easy", "容易的", "/ˈiːzi/", "This test is easy."),
    # 动词 (12)
    ("have", "有；吃", "/hæv/", "I have a new bike."),
    ("like", "喜欢", "/laɪk/", "I like playing basketball."),
    ("want", "想要", "/wɒnt/", "I want some water, please."),
    ("need", "需要", "/niːd/", "We need more time."),
    ("know", "知道；认识", "/noʊ/", "I don't know the answer."),
    ("think", "认为；想", "/θɪŋk/", "I think you are right."),
    ("see", "看见；看到", "/siː/", "Can you see the bird?"),
    ("look", "看；瞧", "/lʊk/", "Look at the blackboard."),
    ("come", "来", "/kʌm/", "Come here, please."),
    ("go", "去；走", "/ɡoʊ/", "Let's go to school."),
    ("eat", "吃", "/iːt/", "Eat your vegetables."),
    ("drink", "喝", "/drɪŋk/", "Drink some juice."),
]

# ========== 七年级下册 (100词) ==========
# 日常活动、爱好、天气、交通方向、问路、购物等
g7s2_words = [
    # 日常活动 (10)
    ("get up", "起床", "/ɡet ʌp/", "I get up at seven every day."),
    ("brush", "刷", "/brʌʃ/", "Brush your teeth after meals."),
    ("shower", "淋浴；沐浴", "/ˈʃaʊər/", "I take a shower every morning."),
    ("breakfast", "早餐", "/ˈbrekfəst/", "Have some bread for breakfast."),
    ("lunch", "午餐", "/lʌntʃ/", "What did you have for lunch?"),
    ("dinner", "晚餐；正餐", "/ˈdɪnər/", "Dinner is ready."),
    ("exercise", "锻炼；练习", "/ˈeksəsaɪz/", "Exercise is good for health."),
    ("homework", "作业", "/ˈhoʊmwɜːrk/", "Finish your homework first."),
    ("run", "跑；奔跑", "/rʌn/", "I run in the park every morning."),
    ("walk", "步行；走", "/wɔːk/", "I walk to school."),
    # 爱好与兴趣 (10)
    ("dance", "跳舞", "/dɑːns/", "She likes to dance."),
    ("sing", "唱歌", "/sɪŋ/", "Can you sing this song?"),
    ("draw", "画；绘制", "/drɔː/", "I can draw a picture of you."),
    ("swim", "游泳", "/swɪm/", "Let's go swimming this weekend."),
    ("play", "玩耍；演奏", "/pleɪ/", "Play soccer with us after school."),
    ("chess", "国际象棋", "/tʃes/", "Do you know how to play chess?"),
    ("guitar", "吉他", "/ɡɪˈtɑːr/", "He plays guitar very well."),
    ("piano", "钢琴", "/piˈænəʊ/", "She practices piano every day."),
    ("interest", "兴趣；趣味", "/ˈɪntrəst/", "Reading is my greatest interest."),
    ("hobby", "业余爱好", "/ˈhɒbi/", "Collecting stamps is my hobby."),
    # 天气 (10)
    ("weather", "天气", "/ˈweðər/", "How is the weather today?"),
    ("sunny", "晴朗的", "/ˈsʌni/", "It is sunny outside."),
    ("cloudy", "多云的；阴天的", "/ˈklaʊdi/", "It looks cloudy today."),
    ("rainy", "下雨的；多雨的", "/ˈreɪni/", "It was rainy yesterday."),
    ("snowy", "下雪的；多雪的", "/ˈsnəʊi/", "I love snowy days."),
    ("windy", "有风的；多风的", "/ˈwɪndi/", "It is too windy to play outside."),
    ("hot", "热的", "/hɒt/", "It is very hot in summer."),
    ("cold", "冷的；寒冷的", "/koʊld/", "Put on a coat. It is cold outside."),
    ("warm", "温暖的；暖和的", "/wɔːrm/", "Spring days are warm and pleasant."),
    ("cool", "凉爽的", "/kuːl/", "The weather is cool in autumn."),
    # 交通与出行 (10)
    ("train", "火车", "/treɪn/", "We go to Beijing by train."),
    ("bus", "公共汽车", "/bʌs/", "Take bus number 5 to school."),
    ("bike", "自行车", "/baɪk/", "Ride a bike to work."),
    ("car", "汽车；小汽车", "/kɑːr/", "My father drives a car."),
    ("subway", "地铁", "/ˈsʌbweɪ/", "The subway is fast and convenient."),
    ("station", "车站；站", "/ˈsteɪʃn/", "Meet me at the train station."),
    ("stop", "车站；停止", "/stɒp/", "Get off at the next stop."),
    ("ride", "骑；乘坐", "/raɪd/", "I ride my bike to school every day."),
    ("drive", "开车；驾驶", "/draɪv/", "Can you drive a car?"),
    ("fly", "飞行；乘飞机", "/flaɪ/", "We fly to Shanghai tomorrow."),
    # 方位与地点 (10)
    ("street", "街道", "/striːt/", "Turn right at the next street."),
    ("road", "路；道路", "/roʊd/", "Cross the road carefully."),
    ("bridge", "桥", "/brɪdʒ/", "Walk across the bridge."),
    ("park", "公园", "/pɑːrk/", "Let's play in the park."),
    ("hospital", "医院", "/ˈhɒspɪtl/", "Go to the hospital when sick."),
    ("hotel", "旅馆；酒店", "/hoʊˈtel/", "We stay at this hotel tonight."),
    ("restaurant", "餐馆", "/ˈrestərɒnt/", "That restaurant serves great food."),
    ("bank", "银行", "/bæŋk/", "I need to go to the bank."),
    ("library", "图书馆", "/ˈlaɪbreri/", "Read quietly in the library."),
    ("market", "市场", "/ˈmɑːrkɪt/", "Go shopping in the market."),
    # 购物 (10)
    ("buy", "购买；买", "/baɪ/", "I want to buy a gift."),
    ("sell", "卖；销售", "/sel/", "They sell fresh fruit here."),
    ("cheap", "便宜的", "/tʃiːp/", "This shirt is very cheap."),
    ("expensive", "昂贵的", "/ɪkˈspensɪv/", "That watch is too expensive."),
    ("price", "价格", "/praɪs/", "What is the price of this bag?"),
    ("money", "钱；金钱", "/ˈmʌni/", "Save money for future needs."),
    ("shop", "商店；购物", "/ʃɒp/", "I went shopping yesterday."),
    ("supermarket", "超市", "/ˈsuːpərmɑːrkɪt/", "Get milk from the supermarket."),
    ("pay", "支付；付款", "/peɪ/", "Pay by cash or card?"),
    ("change", "零钱；改变", "/tʃeɪndʒ/", "Here is your change."),
    # 时间表达 (8)
    ("morning", "早晨；上午", "/ˈmɔːrnɪŋ/", "Good morning, everyone."),
    ("afternoon", "下午", "/ˌɑːftərˈnuːn/", "See you in the afternoon."),
    ("evening", "晚上；傍晚", "/ˈiːvnɪŋ/", "Good evening, sir."),
    ("night", "夜晚；晚上", "/naɪt/", "Good night, sleep well."),
    ("today", "今天", "/təˈdeɪ/", "What day is today?"),
    ("tomorrow", "明天", "/təˈmɒroʊ/", "See you tomorrow."),
    ("yesterday", "昨天", "/ˈjestədeɪ/", "I finished my homework yesterday."),
    ("week", "周；星期", "/wiːk/", "There are seven days in a week."),
    # 其他常用词 (12)
    ("people", "人；人们", "/ˈpiːpl/", "Many people visit the park."),
    ("friend", "朋友", "/frend/", "He is my best friend."),
    ("student", "学生", "/ˈstuːdnt/", "She is a top student."),
    ("teacher", "教师；老师", "/ˈtiːtʃər/", "Our teacher is very patient."),
    ("country", "国家；乡村", "/ˈkʌntri/", "China is a great country."),
    ("language", "语言", "/ˈlæŋɡwɪdʒ/", "English is a global language."),
    ("letter", "信；字母", "/ˈletər/", "Write a letter to your friend."),
    ("email", "电子邮件", "/ˈiːmeɪl/", "Send me an email, please."),
    ("phone", "电话；手机", "/foʊn/", "Call me on my phone."),
    ("number", "数字；号码", "/ˈnʌmbər/", "What is your phone number?"),
    ("question", "问题", "/ˈkwestʃən/", "Do you have any questions?"),
    ("answer", "回答；答案", "/ˈænsər/", "Answer the question, please."),
]

# ========== 八年级上册 (100词) ==========
# 假期活动、健康、计划安排、世界地理文化、如何做事等
g8s1_words = [
    # 假期活动与旅行 (10)
    ("vacation", "假期；假期", "/veɪˈkeɪʃn/", "Where did you go on vacation?"),
    ("camp", "露营；营地", "/kæmp/", "We camp near the lake."),
    ("beach", "海滩；沙滩", "/biːtʃ/", "Let's go to the beach."),
    ("mountain", "山；山脉", "/ˈmaʊntən/", "Climb to the top of the mountain."),
    ("trip", "旅行；旅游", "/trɪp/", "Plan a trip for the holiday."),
    ("visit", "参观；访问", "/ˈvɪzɪt/", "Visit the museum this weekend."),
    ("wonderful", "精彩的；极好的", "/ˈwʌndərfl/", "The show was wonderful."),
    ("boring", "无聊的；令人厌烦的", "/ˈbɔːrɪŋ/", "The movie was so boring."),
    ("exciting", "令人兴奋的", "/ɪkˈsaɪtɪŋ/", "The game was really exciting."),
    ("activity", "活动", "/ækˈtɪvəti/", "Outdoor activities are healthy."),
    # 健康与生活方式 (10)
    ("healthy", "健康的", "/ˈhelθi/", "Eat well and stay healthy."),
    ("health", "健康；卫生", "/helθ/", "Health is more important than wealth."),
    ("habit", "习惯", "/ˈhæbɪt/", "Develop good study habits."),
    ("junk", "垃圾；无用的东西", "/dʒʌŋk/", "Avoid junk food as much as possible."),
    ("coffee", "咖啡", "/ˈkɒfi/", "Would you like some coffee?"),
    ("tea", "茶；茶叶", "/tiː/", "Drink tea after meals."),
    ("vegetable", "蔬菜", "/ˈvedʒtəbl/", "Eat plenty of vegetables every day."),
    ("result", "结果；后果", "/rɪˈzʌlt/", "Hard work brings good results."),
    ("although", "虽然；尽管", "/ɔːlˈðəʊ/", "Although tired, he kept working."),
    ("through", "穿过；通过", "/θruː/", "Walk through the door."),
    # 计划与安排 (10)
    ("plan", "计划；打算", "/plæn/", "Make a plan for the weekend."),
    ("prepare", "准备", "/prɪˈper/", "Prepare for the exam early."),
    ("invite", "邀请", "/ɪnˈvaɪt/", "Invite friends to your party."),
    ("accept", "接受；承认", "/əkˈsept/", "Accept my invitation, please."),
    ("refuse", "拒绝", "/rɪˈfjuːz/", "He refused to give up."),
    ("promise", "承诺；许诺", "/ˈprɒmɪs/", "Promise me you'll be careful."),
    ("calendar", "日历；日程表", "/ˈkæləndər/", "Check the calendar before planning."),
    ("schedule", "时间表；日程", "/ˈʃedjuːl/", "Follow the daily schedule strictly."),
    ("organize", "组织", "/ˈɔːrɡənaɪz/", "Organize your desk and notes."),
    ("discuss", "讨论", "/dɪˈskʌs/", "Discuss the problem together."),
    # 世界地理与文化 (10)
    ("world", "世界", "/wɜːrld/", "Travel around the world."),
    ("culture", "文化", "/ˈkʌltʃər/", "Learn about different cultures."),
    ("foreign", "外国的", "/ˈfɔːrən/", "Learn a foreign language."),
    ("traditional", "传统的", "/trəˈdɪʃənl/", "This is a traditional festival."),
    ("famous", "著名的；出名的", "/ˈfeɪməs/", "Beijing is famous for the Great Wall."),
    ("capital", "首都；省会", "/ˈkæpɪtl/", "Beijing is the capital of China."),
    ("population", "人口", "/ˌpɒpjuˈleɪʃn/", "China has a large population."),
    ("nature", "自然；自然界", "/ˈneɪtʃər/", "Protect nature and wildlife."),
    ("environment", "环境", "/ɪnˈvaɪrənmənt/", "We should protect our environment."),
    ("tourist", "游客；观光者", "/ˈtʊrɪst/", "Many tourists visit here each year."),
    # 做事方式与方法 (10)
    ("method", "方法；办法", "/ˈmeθəd/", "Find a better method to solve this."),
    ("step", "步骤；脚步", "/step/", "Follow these steps carefully."),
    ("mix", "混合；搅拌", "/mɪks/", "Mix the flour and eggs."),
    ("add", "增加；添加", "/æd/", "Add some sugar to the coffee."),
    ("fill", "装满；填充", "/fɪl/", "Fill the cup with water."),
    ("cover", "覆盖；遮盖", "/ˈkʌvər/", "Cover the pot with a lid."),
    ("peel", "剥皮；削皮", "/piːl/", "Peel the banana first."),
    ("cut", "切；割；剪", "/kʌt/", "Cut the paper into pieces."),
    ("pour", "倒；倾倒", "/pɔːr/", "Pour some milk into the bowl."),
    ("boil", "煮沸；烧开", "/bɔɪl/", "Boil the water before drinking."),
    # 感觉与情绪 (10)
    ("feel", "感觉；觉得", "/fiːl/", "I feel happy today."),
    ("feelings", "感情；感觉", "/ˈfiːlɪŋz/", "Share your true feelings with friends."),
    ("worried", "担心的；担忧的", "/ˈwɜrid/", "Don't be worried about me."),
    ("nervous", "紧张的；焦虑的", "/ˈnɜːrvəs/", "I feel nervous before the exam."),
    ("surprised", "感到惊讶的", "/sərˈpraɪzd/", "I was surprised by the news."),
    ("angry", "生气的；愤怒的", "/ˈæŋɡri/", "Why are you so angry?"),
    ("afraid", "害怕的；担心的", "/əˈfreɪd/", "Are you afraid of dogs?"),
    ("tired", "累的；疲倦的", "/taɪərd/", "I am so tired after work."),
    ("excited", "兴奋的；激动的", "/ɪkˈsaɪtɪd/", "I am excited about the trip."),
    ("relaxed", "放松的；轻松的", "/rɪˈlækst/", "Feel relaxed after a hot bath."),
    # 学校生活进阶 (10)
    ("subject", "学科；科目", "/ˈsʌbdʒɪkt/", "Math is my favorite subject."),
    ("science", "科学", "/ˈsaɪəns/", "Science helps us understand the world."),
    ("physics", "物理；物理学", "/ˈfɪzɪks/", "Physics is difficult but interesting."),
    ("chemistry", "化学", "/ˈkemɪstri/", "Chemistry experiments are fun."),
    ("history", "历史", "/ˈhɪstri/", "History teaches us about the past."),
    ("geography", "地理；地理学", "/dʒiˈɒɡrəfi/", "Geography shows where countries are."),
    ("grade", "成绩；等级；年级", "/ɡreɪd/", "I got a good grade on the test."),
    ("exam", "考试", "/ɪɡˈzæm/", "Prepare well for the final exam."),
    ("test", "测验；测试", "/test/", "We have a math test tomorrow."),
    ("project", "项目；课题", "/ˈprɒdʒekt/", "Work on your group project."),
    # 电视与娱乐 (5)
    ("television", "电视", "/ˈtelɪvɪʒn/", "Watch less television."),
    ("program", "节目；项目", "/ˈproʊɡræm/", "This TV program is educational."),
    ("comedy", "喜剧；滑稽", "/ˈkɒmədi/", "I enjoy watching comedies."),
    ("action", "动作；行动", "/ˈækʃn/", "Action movies are exciting."),
    ("cartoon", "动画片；卡通", "/kɑːrˈtuːn/", "Kids love watching cartoons."),
    # 其他常用词 (5)
    ("enough", "足够的；充足的", "/ɪˈnʌf/", "Do we have enough food?"),
    ("almost", "几乎；差不多", "/ˈɔːlmoʊst/", "Almost everyone came to the party."),
    ("together", "在一起；共同", "/təˈɡeðər/", "Let's work together on this."),
    ("maybe", "也许；大概", "/ˈmeɪbi/", "Maybe I can help you."),
    ("everyone", "每个人；人人", "/ˈevriwʌn/", "Everyone should follow the rules."),
]

# ========== 八年级下册 (100词) ==========
# 过去经历、建议、比较级最高级、科技发明、故事叙述等
g8s2_words = [
    # 过去经历与描述 (10)
    ("experience", "经历；经验", "/ɪkˈspɪriəns/", "Traveling is a great experience."),
    ("memory", "记忆；回忆", "/ˈmeməri/", "I have fond memories of childhood."),
    ("past", "过去的；过去", "/pɑːst/", "In the past, people lived differently."),
    ("recent", "最近的；近来的", "/ˈriːsnt/", "Any recent news from him?"),
    ("already", "已经；早已", "/ɔːlˈredi/", "I have already finished my homework."),
    ("yet", "还；仍然", "/jet/", "Have you finished yet?"),
    ("just", "刚刚；正好", "/dʒʌst/", "He just left five minutes ago."),
    ("ever", "曾经；在任何时候", "/ˈevər/", "Have you ever been abroad?"),
    ("never", "从不；绝不", "/ˈnevər/", "I never tell lies."),
    ("ago", "以前", "/əˈɡoʊ/", "I met him two years ago."),
    # 建议与意见 (10)
    ("suggest", "建议；提议", "/səˈdʒest/", "I suggest taking a break."),
    ("advice", "建议；忠告", "/ədˈvaɪs/", "Let me give you some advice."),
    ("opinion", "意见；看法", "/əˈpɪnjən/", "What is your opinion on this?"),
    ("agree", "同意；赞同", "/əˈɡriː/", "I agree with your idea."),
    ("disagree", "不同意", "/ˌdɪsəˈɡriː/", "Sorry, I disagree with that."),
    ("should", "应该；应当", "/ʃʊd/", "You should study harder."),
    ("could", "可以；能够", "/kʊd/", "Could you help me, please?"),
    ("might", "可能；也许", "/maɪt/", "It might rain later today."),
    ("perhaps", "可能；或许", "/pərˈhæps/", "Perhaps we should leave early."),
    ("certainly", "当然；无疑", "/ˈsɜːrtnli/", "Certainly, I will help you."),
    # 比较级相关 (10)
    ("compare", "比较", "/kəmˈper/", "Compare the two pictures carefully."),
    ("difference", "不同；差异", "/ˈdɪfrəns/", "Find the differences between them."),
    ("similar", "类似的；相似的", "/ˈsɪmələr/", "Our ideas are quite similar."),
    ("same", "相同的；同样的", "/seɪm/", "We are in the same class."),
    ("different", "不同的；有差别的", "/ˈdɪfrənt/", "We have different hobbies."),
    ("better", "更好的", "/ˈbetər/", "Practice makes you better."),
    ("worse", "更差的；更糟的", "/wɜːrs/", "The weather is getting worse."),
    ("best", "最好的", "/best/", "She is the best student in class."),
    ("worst", "最差的；最糟的", "/wɜːrst/", "That was the worst day ever."),
    ("than", "比；超过", "/ðæn/", "He is taller than me."),
    # 科技与发明 (10)
    ("invention", "发明；创造", "/ɪnˈvenʃn/", "The computer is a great invention."),
    ("inventor", "发明者", "/ɪnˈventər/", "Edison was a famous inventor."),
    ("technology", "技术；科技", "/tekˈnɒlədʒi/", "Technology changes our lives."),
    ("machine", "机器；机械", "/məˈʃiːn/", "This machine washes clothes automatically."),
    ("robot", "机器人", "/ˈroʊbɒt/", "Robots can do many tasks now."),
    ("internet", "互联网；因特网", "/ˈɪntərnet/", "Search information on the internet."),
    ("computer", "电脑；计算机", "/kəmˈpjuːtər/", "Use the computer to finish your report."),
    ("phone", "电话；手机", "/foʊn/", "Smartphones are very popular now."),
    ("modern", "现代的；近代的", "/ˈmɒdərn/", "We live in a modern city."),
    ("digital", "数码的；数字的", "/ˈdɪdʒɪtl/", "Digital cameras take clear photos."),
    # 故事叙述 (10)
    ("story", "故事；小说", "/ˈstɔːri/", "Tell us a story, please."),
    ("character", "角色；人物；性格", "/ˈkærəktər/", "Who is your favorite character?"),
    ("beginning", "开始；开端", "/bɪˈɡɪnɪŋ/", "At the beginning of the story..."),
    ("end", "结束；末端", "/end/", "The story has a happy end."),
    ("main", "主要的；最重要的", "/meɪn/", "What is the main idea?"),
    ("part", "部分；零件", "/pɑːrt/", "Read the second part of the text."),
    ("scene", "场面；场景", "/siːn/", "The opening scene was amazing."),
    ("plot", "情节；图表", "/plɒt/", "The plot of this movie is complex."),
    ("hero", "英雄；男主角", "/ˈhɪroʊ/", "He is the hero of the story."),
    ("fairytale", "童话故事", "/ˈferiteɪl/", "Children love fairy tales."),
    # 自然现象与环境 (10)
    ("earthquake", "地震", "/ˈɜːrθkweɪk/", "Earthquakes can be very dangerous."),
    ("storm", "暴风雨", "/stɔːrm/", "A heavy storm hit the city last night."),
    ("rain", "雨；下雨", "/reɪn/", "Don't forget your umbrella; it might rain."),
    ("wind", "风", "/wɪnd/", "The wind blew strongly all night."),
    ("sun", "太阳；阳光", "/sʌn/", "The sun rises in the east."),
    ("moon", "月亮；月球", "/muːn/", "The moon is full tonight."),
    ("star", "星；星星", "/stɑːr/", "Look at those bright stars."),
    ("sky", "天空", "/skaɪ/", "The sky is clear and blue."),
    ("air", "空气；大气", "/er/", "Fresh air is good for health."),
    ("pollution", "污染", "/pəˈluːʃn/", "Air pollution is a serious problem."),
    # 社会与社区 (10)
    ("community", "社区；社会", "/kəˈmjuːnəti/", "Help build a better community."),
    ("neighbor", "邻居", "/ˈneɪbər/", "My neighbor is very friendly."),
    ("volunteer", "志愿者", "/ˌvɒlənˈtɪr/", "Work as a volunteer on weekends."),
    ("service", "服务", "/ˈsɜːrvɪs/", "Thank you for your excellent service."),
    ("public", "公众的；公共的", "/ˈpʌblɪk/", "Keep public places clean."),
    ("society", "社会", "/səˈsaɪəti/", "Everyone contributes to society."),
    ("government", "政府", "/ˈɡʌvərnmənt/", "The government builds schools and hospitals."),
    ("law", "法律；法规", "/lɔː/", "Everyone must follow the law."),
    ("rule", "规则；规章", "/ruːl/", "Obey the school rules."),
    ("safe", "安全的", "/seɪf/", "Stay safe on your way home."),
    # 情感与态度 (10)
    ("hope", "希望", "/hoʊp/", "Hope everything goes well."),
    ("wish", "愿望；希望", "/wɪʃ/", "Make a wish on your birthday."),
    ("dream", "梦想；做梦", "/driːm/", "Follow your dreams."),
    ("believe", "相信；认为", "/bɪˈliːv/", "Believe in yourself."),
    ("expect", "期待；预期", "/ɪkˈspekt/", "I expect to see you soon."),
    ("prefer", "更喜欢；偏爱", "/prɪˈfɜːr/", "I prefer tea to coffee."),
    ("mind", "介意；头脑", "/maɪnd/", "Do you mind if I open the window?"),
    ("care", "关心；在意", "/ker/", "I truly care about you."),
    ("trust", "信任；信赖", "/trʌst/", "Trust takes time to build."),
    ("regret", "后悔；遗憾", "/rɪˈɡret/", "I regret not studying harder."),
]

# ========== 九年级全册 (200词) ==========
# 中考重点词汇、情态动词、被动语态、定语从句相关词汇
g9_words = [
    # ===== 上册部分 (100词) =====

    # 情态动词与助动词 (10)
    ("can", "能；会；可以", "/kæn/", "I can swim very well."),
    ("could", "能；能够（can的过去式）", "/kʊd/", "Could you open the window?"),
    ("may", "可以；可能", "/meɪ/", "May I come in?"),
    ("might", "可能；也许", "/maɪt/", "It might rain this afternoon."),
    ("must", "必须；一定", "/mʌst/", "You must finish homework on time."),
    ("shall", "将要；应该", "/ʃæl/", "Shall we go out for dinner?"),
    ("should", "应该；应当", "/ʃʊd/", "You should exercise more often."),
    ("would", "将；愿意；会", "/wʊd/", "Would you like some tea?"),
    ("will", "将要；将会", "/wɪl/", "I will help you with English."),
    ("need", "需要", "/niːd/", "You need to rest more."),

    # 被动语态相关 (10)
    ("make", "制作；使", "/meɪk/", "The table is made of wood."),
    ("produce", "生产；制造", "/prəˈdjuːs/", "Cars are produced in factories."),
    ("build", "建造；建立", "/bɪld/", "This bridge was built in 1990."),
    ("create", "创造；创作", "/kriˈeɪt/", "Artists create beautiful paintings."),
    ("design", "设计", "/dɪˈzaɪn/", "Who designed this building?"),
    ("use", "使用；利用", "/juːz/", "English is used around the world."),
    ("write", "写；写作", "/raɪt/", "This book was written by Lu Xun."),
    ("speak", "说；讲", "/spiːk/", "English is spoken in many countries."),
    ("discover", "发现；发觉", "/dɪˈskʌvər/", "America was discovered in 1492."),
    ("invent", "发明；创造", "/ɪnˈvent/", "Paper was invented in China."),

    # 定语从句关系词 (8)
    ("who", "谁（指人）", "/huː/", "The man who helped me is a teacher."),
    ("which", "哪一个（指物）", "/wɪtʃ/", "The book which I bought is interesting."),
    ("that", "那个；那（指人或物）", "/ðæt/", "This is the pen that I lost."),
    ("whose", "谁的", "/huːz/", "The boy whose bike was stolen called police."),
    ("where", "在哪里（指地点）", "/wer/", "This is the place where I grew up."),
    ("when", "什么时候（指时间）", "/wen/", "I remember the day when we first met."),
    ("why", "为什么（指原因）", "/waɪ/", "That is the reason why he refused."),
    ("whom", "谁（宾格）", "/huːm/", "The girl whom I met is my classmate."),

    # 中考重点名词 (15)
    ("success", "成功；成就", "/səkˈses/", "Hard work leads to success."),
    ("failure", "失败；衰竭", "/ˈfeɪljər/", "Failure is the mother of success."),
    ("chance", "机会；可能性", "/tʃæns/", "Give yourself another chance."),
    ("choice", "选择", "/tʃɔɪs/", "Making choices is part of growing up."),
    ("decision", "决定；决心", "/dɪˈsɪʒn/", "Make a wise decision."),
    ("progress", "进步；进展", "/ˈprɒɡres/", "You have made great progress."),
    ("problem", "问题；难题", "/ˈprɒbləm/", "Face problems with courage."),
    ("solution", "解决方案", "/səˈluːʃn/", "Find a solution to this issue."),
    ("information", "信息；消息", "/ˌɪnfərˈmeɪʃn/", "Get information online quickly."),
    ("knowledge", "知识；学问", "/ˈnɒlɪdʒ/", "Knowledge is power."),
    ("ability", "能力；才能", "/əˈbɪləti/", "Everyone has special abilities."),
    ("attention", "注意；关注", "/əˈtenʃn/", "Pay attention to what I say."),
    ("importance", "重要性", "/ɪmˈpɔːrtns/", "Education is of great importance."),
    ("difference", "差别；差异", "/ˈdɪfrəns/", "Respect our differences."),
    ("influence", "影响；作用", "/ˈɪnfluəns/", "Parents have great influence on children."),

    # 中考重点动词 (15)
    ("achieve", "实现；达到", "/əˈtʃiːv/", "Achieve your goals through effort."),
    ("improve", "改进；改善", "/ɪmˈpruːv/", "Try to improve your English."),
    ("develop", "发展；培养", "/dɪˈveləp/", "Develop good reading habits."),
    ("realize", "意识到；实现", "/ˈriːəlaɪz/", "I realized my mistake."),
    ("consider", "考虑；认为", "/kənˈsɪdər/", "Consider all possibilities."),
    ("encourage", "鼓励；激励", "/ɪnˈkʌrɪdʒ/", "Teachers encourage us to learn."),
    ("express", "表达；表示", "/ɪkˈspres/", "Express yourself clearly."),
    ("prevent", "防止；预防", "/prɪˈvent/", "Wash hands to prevent disease."),
    ("protect", "保护；防护", "/prəˈtekt/", "We should protect the environment."),
    ("provide", "提供；供应", "/prəˈvaɪd/", "Schools provide free education."),
    ("require", "需要；要求", "/rɪˈwaɪər/", "The job requires patience."),
    ("suggest", "建议；暗示", "/səˈdʒest/", "I suggest leaving early."),
    ("support", "支持；支撑", "/səˈpɔːrt/", "Family supports us through hard times."),
    ("mention", "提到；提及", "/ˈmenʃn/", "Did she mention the meeting?"),
    ("explain", "解释；说明", "/ɪkˈspleɪn/", "Let me explain the rules."),

    # 中考重点形容词 (12)
    ("necessary", "必要的；必需的", "/ˈnesəseri/", "Sleep is necessary for health."),
    ("possible", "可能的", "/ˈpɒsəbl/", "Anything is possible if you try."),
    ("important", "重要的", "/ɪmˈpɔːrtant/", "Time is important to everyone."),
    ("difficult", "困难的；艰难的", "/ˈdɪfɪkəlt/", "Nothing is impossible or too difficult."),
    ("comfortable", "舒适的", "/ˈkʌmftəbl/", "The seat is very comfortable."),
    ("convenient", "方便的；便利的", "/kənˈviːniənt/", "Online shopping is convenient."),
    ("popular", "流行的；受欢迎的", "/ˈpɒpjələr/", "Basketball is popular among teens."),
    ("valuable", "宝贵的；贵重的", "/ˈvæljuəbl/", "Time is valuable; don't waste it."),
    ("excellent", "优秀的；杰出的", "/ˈeksələnt/", "She is an excellent student."),
    ("perfect", "完美的", "/ˈpɜːrfɪkt/", "Nobody is perfect."),
    ("strange", "奇怪的；陌生的", "/streɪndʒ/", "I heard a strange noise."),
    ("silent", "沉默的；无声的", "/ˈsaɪlənt/", "Please keep silent in the library."),

    # 副词与连接词 (10)
    ("however", "然而；可是", "/haʊˈevər/", "However, things changed later."),
    ("therefore", "因此；所以", "/ˈðerfɔːr/", "Therefore, we decided to stay."),
    ("besides", "此外；而且", "/bɪˈsaɪdz/", "Besides English, I also learn French."),
    ("instead", "代替；反而", "/ɪnˈsted/", "Let's walk instead of driving."),
    ("especially", "尤其；特别", "/ɪˈspeʃəli/", "I love fruit, especially apples."),
    ("probably", "很可能；大概", "/ˈprɒbəbli/", "He will probably come late."),
    ("actually", "实际上；事实上", "/ˈæktʃuəli/", "Actually, I disagree with that."),
    ("suddenly", "突然地", "/ˈsʌdnli/", "Suddenly, it started to rain."),
    ("finally", "最后；终于", "/ˈfaɪnəli/", "Finally, we reached the top."),
    ("recently", "最近", "/ˈriːsntli/", "I recently moved to a new city."),

    # 社会话题词汇 (10)
    ("environmental", "环境的", "/ɪnˌvaɪrənˈmentl/", "Environmental protection matters."),
    ("pollution", "污染", "/pəˈluːʃn/", "Air pollution harms our lungs."),
    ("recycle", "回收利用", "/ˌriːˈsaɪkl/", "Recycle bottles and cans."),
    ("energy", "能源；能量", "/ˈenərdʒi/", "Save energy whenever possible."),
    ("resource", "资源", "/ˈriːsɔːrs/", "Water is a precious resource."),
    ("global", "全球的", "/ˈɡloʊbl/", "Global warming concerns us all."),
    ("communication", "交流；沟通", "/kəˌmjuːnɪˈkeɪʃn/", "Communication is key in relationships."),
    ("education", "教育", "/ˌedʒuˈkeɪʃn/", "Education changes lives."),
    ("development", "发展；发育", "/dɪˈveləpmənt/", "Economic development brings opportunities."),
    ("international", "国际的", "/ˌɪntərˈnæʃnəl/", "Learn about international cultures."),

    # ===== 下册部分 (100词) =====

    # 生活与成长 (10)
    ("teenager", "青少年", "/ˈtiːneɪdʒər/", "Teenagers face many challenges."),
    ("adult", "成年人；成人", "/ˈædʌlt/", "When you become an adult, you have more duties."),
    ("childhood", "童年；幼年", "/ˈtʃaɪldhʊd/", "I miss my childhood days."),
    ("growth", "生长；增长", "/ɡroʊθ/", "Personal growth requires patience."),
    ("responsibility", "责任；职责", "/rɪˌspɒnsəˈbɪləti/", "Take responsibility for your actions."),
    ("independence", "独立；自主", "/ˌɪndɪˈpendəns/", "Learning independence is important."),
    ("confidence", "信心；自信", "/ˈkɒnfɪdəns/", "Build confidence through practice."),
    ("patience", "耐心；忍耐", "/ˈpeɪʃns/", "Patience is a virtue."),
    ("courage", "勇气；胆量", "/ˈkʌrɪdʒ/", "It takes courage to admit mistakes."),
    ("wisdom", "智慧；才智", "/ˈwɪzdəm/", "Wisdom comes with experience."),

    # 学习与方法 (10)
    ("pronunciation", "发音；读音", "/prəˌnʌnsiˈeɪʃn/", "Practice pronunciation every day."),
    ("grammar", "语法", "/ˈɡræmər/", "Grammar rules help us write correctly."),
    ("vocabulary", "词汇；词汇量", "/vəˈkæbjəleri/", "Expand your vocabulary by reading."),
    ("review", "复习；回顾", "/rɪˈvjuː/", "Review lessons before exams."),
    ("memorize", "记忆；记住", "/ˈeməraɪz/", "Memorize new words every day."),
    ("understand", "理解；明白", "/ˌʌndərˈstænd/", "I understand what you mean."),
    ("practice", "练习；实践", "/ˈpræktɪs/", "Practice speaking English aloud."),
    ("research", "研究；调查", "/rɪˈsɜːrtʃ/", "Research the topic before writing."),
    ("note", "笔记；笔记", "/noʊt/", "Take notes during class."),
    ("summary", "摘要；总结", "/ˈsʌməri/", "Write a summary of the article."),

    # 人际关系 (10)
    ("relationship", "关系；联系", "/rɪˈleɪʃnʃɪp/", "A good relationship requires trust."),
    ("friendship", "友谊；友情", "/ˈfrendʃɪp/", "True friendship lasts forever."),
    ("respect", "尊重；尊敬", "/rɪˈspekt/", "Respect your elders and teachers."),
    ("honest", "诚实的；正直的", "/ˈɒnɪst/", "Be honest in everything you do."),
    ("kind", "善良的；友好的", "/kaɪnd/", "She is kind to everyone."),
    ("polite", "有礼貌的", "/pəˈlaɪt/", "Always be polite to others."),
    ("helpful", "有帮助的；乐于助人的", "/ˈhelpfl/", "Thank you for being helpful."),
    ("generous", "慷慨的；大方的", "/ˈdʒenərəs/", "He is generous with his time."),
    ("patient", "有耐心的", "/ˈpeɪʃnt/", "Be patient when learning something new."),
    ("strict", "严格的；严厉的", "/strɪkt/", "Our teacher is strict but fair."),

    # 物体与材料 (8)
    ("material", "材料；原料", "/məˈtɪriəl/", "This dress is made of soft material."),
    ("wood", "木材；木头", "/wʊd/", "The table is made of wood."),
    ("metal", "金属", "/metl/", "Iron is a common metal."),
    ("plastic", "塑料的", "/ˈplæstɪc/", "Reduce plastic waste."),
    ("glass", "玻璃；玻璃杯", "/ɡlæs/", "Be careful not to break the glass."),
    ("paper", "纸；纸张", "/ˈpeɪpər/", "Write your answers on paper."),
    ("stone", "石头；石块", "/stoʊn/", "The wall is made of stone."),
    ("cotton", "棉花；棉布", "/ˈkɒtn/", "This shirt is 100% cotton."),

    # 动物与植物 (8)
    ("animal", "动物", "/ˈænɪml/", "The panda is a cute animal."),
    ("plant", "植物；种植", "/plænt/", "Water the plants every day."),
    ("insect", "昆虫", "/ˈɪnsekt/", "Bees are useful insects."),
    ("bird", "鸟；鸟类", "/bɜːrd/", "The bird sings beautifully."),
    ("fish", "鱼；鱼肉", "/fɪʃ/", "Fish live in water."),
    ("flower", "花；花朵", "/ˈflaʊər/", "The flower smells sweet."),
    ("tree", "树；树木", "/triː/", "Plant more trees for clean air."),
    ("grass", "草；草地", "/ɡræs/", "Don't walk on the grass."),

    # 抽象概念 (10)
    ("truth", "真相；事实", "/truːθ/", "Always tell the truth."),
    ("peace", "和平；平静", "/piːs/", "World peace is everyone's hope."),
    ("freedom", "自由", "/ˈfriːdəm/", "Freedom comes with responsibility."),
    ("love", "爱；热爱", "/lʌv/", "Love your family and friends."),
    ("power", "力量；权力", "/paʊər/", "Knowledge gives you power."),
    ("time", "时间；次数", "/taɪm/", "Time waits for no one."),
    ("space", "空间；太空", "/speɪs/", "Humans explore space for knowledge."),
    ("life", "生命；生活", "/laɪf/", "Life is full of surprises."),
    ("death", "死；死亡", "/deθ/", "Death is a natural part of life."),
    ("future", "未来；将来", "/ˈfjuːtʃər/", "Work hard for a bright future."),

    # 运动与竞技 (8)
    ("sport", "运动；体育", "/spɔːrt/", "Doing sports keeps you fit."),
    ("match", "比赛；火柴", "/mætʃ/", "The football match starts at 3pm."),
    ("team", "队；组", "/tiːm/", "Our team won the game."),
    ("win", "赢；获胜", "/wɪn/", "Try your best to win."),
    ("lose", "输；丢失", "/luːz/", "It doesn't matter if you lose."),
    ("score", "得分；分数", "/skɔːr/", "What is the score now?"),
    ("practice", "练习；训练", "/ˈpræktis/", "Soccer practice starts at 4pm."),
    ("coach", "教练", "/koʊtʃ/", "Our coach is very experienced."),

    # 饮食与健康 (8)
    ("breakfast", "早餐", "/ˈbrekfəst/", "Never skip breakfast."),
    ("lunch", "午餐", "/lʌntʃ/", "I have lunch at school."),
    ("dinner", "晚餐", "/ˈdɪnər/", "Family dinner is important."),
    ("meal", "一餐；一顿饭", "/miːl/", "Three meals a day is healthy."),
    ("diet", "饮食；日常饮食", "/ˈdaɪət/", "A balanced diet is essential."),
    ("medicine", "药；医学", "/ˈmedsn/", "Take medicine as prescribed."),
    ("fever", "发烧；发热", "/ˈfiːvər/", "She has a fever today."),
    ("cough", "咳嗽", "/kɒf/", "Drink warm water if you cough."),

    # 其他中考高频词 (8)
    ("accident", "事故；意外", "/ˈæksɪdənt/", "Drive safely to avoid accidents."),
    ("situation", "情况；形势", "/ˌsɪtʃuˈeɪʃn/", "Assess the situation before acting."),
    ("condition", "条件；状况", "/kənˈdɪʃn/", "The living condition here is good."),
    ("example", "例子；范例", "/ɪɡˈzæmpl/", "For example, you can say this."),
    ("reason", "原因；理由", "/ˈriːzn/", "Give me a reason for being late."),
    ("result", "结果；后果", "/rɪˈzʌlt/", "The result exceeded expectations."),
    ("advantage", "优点；优势", "/ədˈvæntɪdʒ/", "Every advantage has a disadvantage."),
    ("disadvantage", "缺点；劣势", "/ˌdɪsədˈvæntɪdʒ/", "Know both advantages and disadvantages."),
]


def make_entries(words, grade, semester, start_id):
    """Convert word tuples into entry dicts with proper IDs."""
    entries = []
    for i, item in enumerate(words):
        if isinstance(item, tuple) and len(item) == 4:
            word, meaning, phonetic, example = item
        else:
            continue  # skip malformed entries
        entry = {
            "id": f"en_g{grade}_{start_id + i:03d}",
            "word": word,
            "meaning": meaning,
            "grade": grade,
            "semester": semester,
            "phonetic": phonetic,
            "example": example,
        }
        entries.append(entry)
    return entries


def main():
    input_file = "/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/dictation_en_words.json"
    output_file = input_file

    # Read existing data
    with open(input_file, "r", encoding="utf-8") as f:
        existing_data = json.load(f)

    print(f"Existing words: {len(existing_data)}")
    print(f"Last ID: {existing_data[-1]['id']}")

    # Generate new entries
    new_entries = []

    # Grade 7 Semester 1 (starts at 001)
    g7s1 = make_entries(g7s1_words, 7, "上册", 1)
    new_entries.extend(g7s1)

    # Grade 7 Semester 2 (starts at 101)
    g7s2 = make_entries(g7s2_words, 7, "下册", 101)
    new_entries.extend(g7s2)

    # Grade 8 Semester 1 (starts at 001)
    g8s1 = make_entries(g8s1_words, 8, "上册", 1)
    new_entries.extend(g8s1)

    # Grade 8 Semester 2 (starts at 101)
    g8s2 = make_entries(g8s2_words, 8, "下册", 101)
    new_entries.extend(g8s2)

    # Grade 9 - treat as single volume (starts at 001)
    g9 = make_entries(g9_words, 9, "全册", 1)
    new_entries.extend(g9)

    # Append new data to existing
    combined = existing_data + new_entries

    # Write back
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(combined, f, ensure_ascii=False, indent=2)

    print(f"\n=== Generation Complete ===")
    print(f"New words added: {len(new_entries)}")
    print(f"Total words in file: {len(combined)}")

    # Summary by grade
    grade_counts = {}
    for entry in combined:
        g = entry["grade"]
        grade_counts[g] = grade_counts.get(g, 0) + 1
    print(f"\nGrade distribution: {dict(sorted(grade_counts.items()))}")

    # Verify JSON validity
    with open(output_file, "r", encoding="utf-8") as f:
        verify = json.load(f)
    print(f"JSON validation: OK ({len(verify)} entries)")


if __name__ == "__main__":
    main()
