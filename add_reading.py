#!/usr/bin/env python3
"""Add 30 new English reading comprehension passages (en_reading_021 to en_reading_050)."""

import json
import os

DATA_FILE = os.path.join(os.path.dirname(__file__), "src/data/questions_en_reading.json")

new_passages = [
    # ===== en_reading_021 — Hobbies (easy, T/F) =====
    {
        "id": "en_reading_021",
        "subject": "english",
        "knowledge_tag": "英语阅读",
        "ability_tag": "阅读理解",
        "type": "multiple_choice",
        "question": (
            "阅读下面短文，判断句子正误，正确的写T，错误的写F。\n\n"
            "My name is Lucy. I have many hobbies. I like drawing pictures. I draw every day after school. "
            "I also like playing the piano. I have piano lessons on Saturday mornings. My brother, Jack, likes "
            "playing football. He plays football with his friends every weekend. My mother likes cooking. She "
            "can make delicious cakes. My father likes reading newspapers. He reads them every evening. We all "
            "have different hobbies, and we enjoy them very much.\n\n"
            "(1) Lucy likes drawing pictures. (　)\n"
            "(2) Lucy has piano lessons on Sunday mornings. (　)\n"
            "(3) Jack is Lucy's brother. (　)\n"
            "(4) Lucy's mother likes reading newspapers. (　)\n"
            "(5) Lucy's father reads newspapers every evening. (　)"
        ),
        "options": [
            "A. T（正确）",
            "B. F（错误）"
        ],
        "answer": "(1) T (2) F (3) T (4) F (5) T",
        "analysis": (
            "【考点】本题考查家庭成员爱好的细节判断。\n"
            "【解题思路】逐句与原文比对，注意人物和活动的对应关系。\n"
            "【总结】判断正误题要注意张冠李戴的错误，如把妈妈的爱好说成爸爸的。"
        ),
        "difficulty": 0.3
    },

    # ===== en_reading_022 — Animals/Dolphins (easy, Multiple Choice) =====
    {
        "id": "en_reading_022",
        "subject": "english",
        "knowledge_tag": "英语阅读",
        "ability_tag": "阅读理解",
        "type": "multiple_choice",
        "question": (
            "阅读下面短文，选择正确答案。\n\n"
            "Dolphins are very smart animals. They live in the sea. They are not fish. They are mammals. "
            "Dolphins breathe air. They must come to the top of the water to breathe. Dolphins eat fish. "
            "They like to play and jump out of the water. They can swim very fast. Dolphins live in groups. "
            "They talk to each other with sounds. People like dolphins because they are friendly and cute.\n\n"
            "(1) Where do dolphins live?\n"
            "A. In the river B. In the sea C. In the lake D. On the land\n\n"
            "(2) Dolphins are ______.\n"
            "A. fish B. insects C. mammals D. birds\n\n"
            "(3) What do dolphins eat?\n"
            "A. Grass B. Meat C. Fish D. Fruit\n\n"
            "(4) Why do people like dolphins?\n"
            "A. Because they are big. B. Because they are friendly and cute.\n"
            "C. Because they are slow. D. Because they are dangerous.\n\n"
            "(5) How do dolphins talk to each other?\n"
            "A. With sounds B. With their tails C. With their eyes D. With colors"
        ),
        "options": [],
        "answer": "(1) B (2) C (3) C (4) B (5) A",
        "analysis": (
            "【考点】本题考查动物说明文的细节理解。\n"
            "【解题思路】在文中直接定位关键词（live, mammals, eat, friendly, sounds）。\n"
            "【总结】说明文选择题答案通常可直接在原文中找到，注意区分相似概念（如fish vs mammals）。"
        ),
        "difficulty": 0.3
    },

    # ===== en_reading_023 — Sports (easy, Short Answer) =====
    {
        "id": "en_reading_023",
        "subject": "english",
        "knowledge_tag": "英语阅读",
        "ability_tag": "阅读理解",
        "type": "multiple_choice",
        "question": (
            "阅读下面短文，用完整的英语句子回答问题。\n\n"
            "There are many kinds of sports. Some people like running. It is easy and cheap. You only need a pair "
            "of shoes. Some people like swimming. It is good for your health. Basketball and football are very "
            "popular in China. Many students play them after school. Table tennis is also popular. Chinese people "
            "are very good at it. My favorite sport is badminton. I play it with my father every Saturday.\n\n"
            "(1) What sport is easy and cheap?\n"
            "________________________________________\n"
            "(2) What is good for your health?\n"
            "________________________________________\n"
            "(3) What sports are popular in China?\n"
            "________________________________________\n"
            "(4) What are Chinese people very good at?\n"
            "________________________________________\n"
            "(5) What is the writer's favorite sport?\n"
            "________________________________________"
        ),
        "options": [],
        "answer": (
            "(1) Running is easy and cheap.\n"
            "(2) Swimming is good for your health.\n"
            "(3) Basketball and football are popular in China.\n"
            "(4) Chinese people are very good at table tennis.\n"
            "(5) The writer's favorite sport is badminton."
        ),
        "analysis": (
            "【考点】本题考查运动话题的信息提取和完整句回答。\n"
            "【解题思路】在文中找到对应句子，用完整句子作答。\n"
            "【总结】回答What问题时，主语+is/are+表语是最基本的句式结构。"
        ),
        "difficulty": 0.3
    },

    # ===== en_reading_024 — Food/Healthy Eating (easy, T/F + MC) =====
    {
        "id": "en_reading_024",
        "subject": "english",
        "knowledge_tag": "英语阅读",
        "ability_tag": "阅读理解",
        "type": "multiple_choice",
        "question": (
            "阅读下面短文，完成题目。\n\n"
            "We should eat healthy food every day. For breakfast, we can have bread, eggs, and milk. For lunch, "
            "we can have rice, vegetables, and some meat. For dinner, we can have noodles or soup. We should eat "
            "more fruit and vegetables. Apples, bananas, and oranges are good for us. We should not eat too much "
            "candy or fast food. They are not healthy. Drinking water is also important. We should drink about "
            "eight glasses of water every day.\n\n"
            "选择正确答案。\n"
            "(1) What can we have for breakfast?\n"
            "A. Rice and meat B. Bread, eggs, and milk C. Noodles D. Candy\n\n"
            "(2) How many glasses of water should we drink every day?\n"
            "A. Five B. Six C. Seven D. About eight\n\n"
            "判断正误。\n"
            "(3) We should eat more candy. (　)\n"
            "(4) Fruit and vegetables are good for us. (　)\n"
            "(5) Fast food is healthy food. (　)"
        ),
        "options": [],
        "answer": "(1) B (2) D (3) F (4) T (5) F",
        "analysis": (
            "【考点】本题考查健康饮食话题的混合题型。\n"
            "【解题思路】选择题在文中定位关键词，判断题比对原文细节。\n"
            "【总结】健康类文章常见表达：be good for, should/should not, too much。"
        ),
        "difficulty": 0.3
    },

    # ===== en_reading_025 — Daily Routine (easy, Sequencing) =====
    {
        "id": "en_reading_025",
        "subject": "english",
        "knowledge_tag": "英语阅读",
        "ability_tag": "阅读理解",
        "type": "multiple_choice",
        "question": (
            "阅读下面短文，将下列事件按文中发生的顺序排序（1-5）。\n\n"
            "It is Monday today. I got up at 6:30. Then I washed my face and brushed my teeth. After that, I had "
            "breakfast. I ate bread and drank a glass of milk. At 7:20, I went to school by bus. School started at "
            "8:00. I had four classes in the morning. At 12:00, I had lunch at school. In the afternoon, I had two "
            "more classes. After school, I went home and did my homework. Then I had dinner with my family at 6:00.\n\n"
            "事件：\n"
            "A. Had breakfast.\n"
            "B. Had dinner with family.\n"
            "C. Went to school by bus.\n"
            "D. Got up at 6:30.\n"
            "E. Did homework after school.\n\n"
            "正确的顺序是：____ → ____ → ____ → ____ → ____"
        ),
        "options": [],
        "answer": "D → A → C → E → B",
        "analysis": (
            "【考点】本题考查日常作息的时间排序。\n"
            "【解题思路】按时间线：起床→吃早餐→坐公交上学→放学做作业→和家人吃晚饭。\n"
            "【总结】排序题要抓住具体时间点和顺序词（then, after that, after school）。"
        ),
        "difficulty": 0.3
    },

    # ===== en_reading_026 — Family (easy, MC) =====
    {
        "id": "en_reading_026",
        "subject": "english",
        "knowledge_tag": "英语阅读",
        "ability_tag": "阅读理解",
        "type": "multiple_choice",
        "question": (
            "阅读下面短文，选择正确答案。\n\n"
            "Hello! My name is Wang Ming. I am eleven years old. There are four people in my family: my father, "
            "my mother, my sister and me. My father is a policeman. He is tall and strong. My mother is a nurse. "
            "She works in a hospital. She is kind and helpful. My sister is only five years old. She likes playing "
            "with dolls. I love my family.\n\n"
            "(1) How old is Wang Ming?\n"
            "A. Ten B. Eleven C. Twelve D. Thirteen\n\n"
            "(2) How many people are there in his family?\n"
            "A. Three B. Four C. Five D. Six\n\n"
            "(3) What does Wang Ming's father do?\n"
            "A. A teacher B. A doctor C. A policeman D. A driver\n\n"
            "(4) Where does his mother work?\n"
            "A. In a school B. In a hospital C. In a shop D. At home\n\n"
            "(5) What does his sister like playing with?\n"
            "A. Cars B. Balls C. Dolls D. Cards"
        ),
        "options": [],
        "answer": "(1) B (2) B (3) C (4) B (5) C",
        "analysis": (
            "【考点】本题考查家庭介绍类文章的细节提取。\n"
            "【解题思路】在文中逐一定位年龄、人数、职业、工作地点等信息。\n"
            "【总结】人物介绍类文章要分清每个人的特征，不要混淆。"
        ),
        "difficulty": 0.3
    },

    # ===== en_reading_027 — Weather (easy, T/F) =====
    {
        "id": "en_reading_027",
        "subject": "english",
        "knowledge_tag": "英语阅读",
        "ability_tag": "阅读理解",
        "type": "multiple_choice",
        "question": (
            "阅读下面短文，判断句子正误，正确的写T，错误的写F。\n\n"
            "It is spring now. The weather is getting warm. The trees are turning green. Flowers are coming out "
            "everywhere. Birds are singing in the trees. It often rains in spring. The rain helps plants grow. "
            "People like to go out for a walk. Children like flying kites in the park. Spring is a beautiful "
            "season. Many people say spring is their favorite season.\n\n"
            "(1) It is autumn now. (　)\n"
            "(2) The weather is getting warm. (　)\n"
            "(3) It often snows in spring. (　)\n"
            "(4) Children like flying kites in spring. (　)\n"
            "(5) The rain helps plants grow. (　)"
        ),
        "options": [
            "A. T（正确）",
            "B. F（错误）"
        ],
        "answer": "(1) F (2) T (3) F (4) T (5) T",
        "analysis": (
            "【考点】本题考查季节与天气的细节判断。\n"
            "【解题思路】与原文逐句比对，注意季节名称和天气现象的准确对应。\n"
            "【总结】季节类文章常考天气特征和活动，注意snow与rain的区别。"
        ),
        "difficulty": 0.3
    },

    # ===== en_reading_028 — Shopping (easy, Short Answer) =====
    {
        "id": "en_reading_028",
        "subject": "english",
        "knowledge_tag": "英语阅读",
        "ability_tag": "阅读理解",
        "type": "multiple_choice",
        "question": (
            "阅读下面短文，用完整的英语句子回答问题。\n\n"
            "Today is Saturday. Lisa and her mom went to the supermarket. They needed to buy some things for the "
            "week. First, they went to the fruit section. They bought some apples, bananas, and grapes. Then they "
            "went to the vegetable section. They bought tomatoes and potatoes. After that, they bought some milk "
            "and bread. Lisa wanted to buy some chocolate, but her mom said no. \"Too much chocolate is not good "
            "for you,\" her mom said. At last, they paid at the checkout and went home.\n\n"
            "(1) Where did Lisa and her mom go?\n"
            "________________________________________\n"
            "(2) What fruit did they buy?\n"
            "________________________________________\n"
            "(3) What vegetables did they buy?\n"
            "________________________________________\n"
            "(4) Did Lisa buy chocolate? Why or why not?\n"
            "________________________________________\n"
            "(5) What did they do at last?\n"
            "________________________________________"
        ),
        "options": [],
        "answer": (
            "(1) They went to the supermarket.\n"
            "(2) They bought apples, bananas, and grapes.\n"
            "(3) They bought tomatoes and potatoes.\n"
            "(4) No, she didn't. Because her mom said too much chocolate is not good for her.\n"
            "(5) They paid at the checkout and went home."
        ),
        "analysis": (
            "【考点】本题考查购物场景的细节提取和原因表达。\n"
            "【解题思路】在文中找到对应信息，注意Why问题要用because回答。\n"
            "【总结】回答Why/Why not问题必须给出原因，常用because连接。注意否定句的回答格式。"
        ),
        "difficulty": 0.3
    },

    # ===== en_reading_029 — Occupations (easy, MC) =====
    {
        "id": "en_reading_029",
        "subject": "english",
        "knowledge_tag": "英语阅读",
        "ability_tag": "阅读理解",
        "type": "multiple_choice",
        "question": (
            "阅读下面短文，选择正确答案。\n\n"
            "There are many jobs in the world. Teachers work in schools. They teach students. Doctors work in "
            "hospitals. They help sick people. Firefighters put out fires. They are very brave. Farmers grow "
            "vegetables and fruits on farms. Drivers drive buses, taxis, and trucks. Cooks make food in "
            "restaurants. Every job is important. We should respect all workers.\n\n"
            "(1) Where do teachers work?\n"
            "A. In hospitals B. In schools C. On farms D. In restaurants\n\n"
            "(2) Who helps sick people?\n"
            "A. Teachers B. Farmers C. Doctors D. Cooks\n\n"
            "(3) What do firefighters do?\n"
            "A. They teach students. B. They grow vegetables.\n"
            "C. They put out fires. D. They drive buses.\n\n"
            "(4) Where do farmers work?\n"
            "A. In schools B. In hospitals C. On farms D. In restaurants\n\n"
            "(5) What should we do according to the passage?\n"
            "A. Be brave B. Respect all workers C. Grow vegetables D. Cook food"
        ),
        "options": [],
        "answer": "(1) B (2) C (3) C (4) C (5) B",
        "analysis": (
            "【考点】本题考查职业和工作场所的匹配。\n"
            "【解题思路】在文中逐一定位每种职业的工作内容和地点。\n"
            "【总结】职业类文章要分清每种职业的对应场所和职责，最后一句常出主旨题。"
        ),
        "difficulty": 0.3
    },

    # ===== en_reading_030 — Transportation (easy, T/F + MC) =====
    {
        "id": "en_reading_030",
        "subject": "english",
        "knowledge_tag": "英语阅读",
        "ability_tag": "阅读理解",
        "type": "multiple_choice",
        "question": (
            "阅读下面短文，完成题目。\n\n"
            "People travel in many ways. Some people go to work by bus. It is cheap but sometimes slow. Some "
            "people go by car. It is fast but cars cost a lot of money. Some people ride bicycles. Riding a "
            "bicycle is good exercise and it is good for the environment. Many students walk to school if they "
            "live near the school. In big cities, many people take the subway. It is fast and not expensive. "
            "When people travel to far places, they go by plane. It is the fastest way to travel.\n\n"
            "选择正确答案。\n"
            "(1) Which is good for the environment?\n"
            "A. Going by car B. Riding a bicycle C. Going by bus D. Taking the subway\n\n"
            "(2) How do many people travel in big cities?\n"
            "A. By bike B. By bus C. By plane D. By subway\n\n"
            "(3) What is the fastest way to travel?\n"
            "A. By bus B. By car C. By train D. By plane\n\n"
            "判断正误。\n"
            "(4) Going by bus is fast and cheap. (　)\n"
            "(5) Walking to school is a choice for students who live near the school. (　)"
        ),
        "options": [],
        "answer": "(1) B (2) D (3) D (4) F (5) T",
        "analysis": (
            "【考点】本题考查交通方式的细节理解和判断。\n"
            "【解题思路】选择题定位关键词，判断题注意比较级和优缺点的对应。\n"
            "【总结】交通类文章注意每种方式的优缺点（cheap/expensive, fast/slow），不能张冠李戴。"
        ),
        "difficulty": 0.3
    },

    # ===== en_reading_031 — Environment (medium, MC + Inference) =====
    {
        "id": "en_reading_031",
        "subject": "english",
        "knowledge_tag": "英语阅读",
        "ability_tag": "阅读理解",
        "type": "multiple_choice",
        "question": (
            "阅读下面短文，选择正确答案。\n\n"
            "Our Earth is getting warmer. This is called global warming. Why is this happening? One reason is that "
            "people burn too much coal and oil. This sends a lot of carbon dioxide into the air. Another reason is "
            "that people cut down too many trees. Trees can absorb carbon dioxide. Without trees, there is more "
            "carbon dioxide in the air. Global warming is bad for the Earth. Ice is melting at the North and South "
            "Poles. Sea levels are rising. Some animals are losing their homes. We should do something to help. "
            "We can plant more trees. We can ride bicycles instead of driving cars. We can save water and electricity.\n\n"
            "(1) What is global warming?\n"
            "A. The Earth is getting colder. B. The Earth is getting warmer.\n"
            "C. The Earth is getting bigger. D. The Earth is getting smaller.\n\n"
            "(2) Why is global warming happening?\n"
            "A. Because people plant too many trees. B. Because people burn too much coal and oil.\n"
            "C. Because people save water. D. Because people ride bicycles.\n\n"
            "(3) What can trees do according to the passage?\n"
            "A. Produce coal B. Absorb carbon dioxide C. Burn oil D. Make electricity\n\n"
            "(4) What does the writer imply about global warming?\n"
            "A. It is not a serious problem.\n"
            "B. Only scientists can solve it.\n"
            "C. Everyone should do something to help.\n"
            "D. It will stop by itself.\n\n"
            "(5) What is NOT mentioned as a way to help?\n"
            "A. Planting trees B. Riding bicycles C. Saving water D. Recycling paper"
        ),
        "options": [],
        "answer": "(1) B (2) B (3) B (4) C (5) D",
        "analysis": (
            "【考点】本题考查环保话题的细节理解和推断题。\n"
            "【解题思路】细节题直接定位，推断题从\"We should do something to help\"推出作者观点。\n"
            "【总结】推断题（imply/infer）答案不会直接写在文中，需要根据文章整体语气和结论句推理。NOT题用排除法。"
        ),
        "difficulty": 0.5
    },

    # ===== en_reading_032 — Festivals/Mid-Autumn (medium, MC + Main Idea) =====
    {
        "id": "en_reading_032",
        "subject": "english",
        "knowledge_tag": "英语阅读",
        "ability_tag": "阅读理解",
        "type": "multiple_choice",
        "question": (
            "阅读下面短文，选择正确答案。\n\n"
            "The Mid-Autumn Festival is an important Chinese festival. It is on the 15th day of the 8th lunar "
            "month. On this day, the moon is round and bright. Families get together and have a big dinner. "
            "People eat mooncakes. Mooncakes are round, like the moon. They are sweet and delicious. Children "
            "like to play with lanterns. Some people stay up late to enjoy the moon. The Mid-Autumn Festival is "
            "a time for family reunion. People who are far from home miss their families very much on this day.\n\n"
            "(1) When is the Mid-Autumn Festival?\n"
            "A. On the 15th day of the 1st lunar month\n"
            "B. On the 15th day of the 8th lunar month\n"
            "C. On the 5th day of the 5th lunar month\n"
            "D. On the 9th day of the 9th lunar month\n\n"
            "(2) What do people eat on this festival?\n"
            "A. Dumplings B. Zongzi C. Mooncakes D. Noodles\n\n"
            "(3) What do children like to play with?\n"
            "A. Kites B. Lanterns C. Balls D. Cards\n\n"
            "(4) What is the best title for this passage?\n"
            "A. Chinese Food B. The Moon\n"
            "C. The Mid-Autumn Festival D. Family Dinner\n\n"
            "(5) How do people who are far from home feel on this day?\n"
            "A. Happy B. Excited C. They miss their families. D. Angry"
        ),
        "options": [],
        "answer": "(1) B (2) C (3) B (4) C (5) C",
        "analysis": (
            "【考点】本题考查节日文化和主旨题。\n"
            "【解题思路】主旨题看全文反复出现的主题——中秋节。细节题在文中直接定位。\n"
            "【总结】主旨题（best title）的答案要能概括全文核心内容，不能只涵盖某个细节。"
        ),
        "difficulty": 0.5
    },

    # ===== en_reading_033 — Friendship (medium, T/F + Inference) =====
    {
        "id": "en_reading_033",
        "subject": "english",
        "knowledge_tag": "英语阅读",
        "ability_tag": "阅读理解",
        "type": "multiple_choice",
        "question": (
            "阅读下面短文，完成题目。\n\n"
            "Lily and Emma are best friends. They met in Grade 3. They sit together in class. They share their "
            "lunch every day. Lily is good at math. She often helps Emma with math homework. Emma is good at "
            "drawing. She draws pictures for Lily's birthday cards. They walk home together after school. "
            "Sometimes they argue, but they always make up quickly. Last week, Emma was sick and didn't come to "
            "school for three days. Lily called her every evening to ask how she felt. When Emma came back to "
            "school, Lily brought her some fruit.\n\n"
            "判断正误。\n"
            "(1) Lily and Emma met in Grade 1. (　)\n"
            "(2) Emma is good at math. (　)\n"
            "(3) Lily called Emma when she was sick. (　)\n\n"
            "选择正确答案。\n"
            "(4) What can we learn about their friendship from the passage?\n"
            "A. They never argue.\n"
            "B. They only help each other with homework.\n"
            "C. They care about each other very much.\n"
            "D. They are not real friends.\n\n"
            "(5) What does \"make up\" mean in this passage?\n"
            "A. To put on makeup B. To become friends again after an argument\n"
            "C. To create something D. To wake up"
        ),
        "options": [],
        "answer": "(1) F (2) F (3) T (4) C (5) B",
        "analysis": (
            "【考点】本题考查友谊主题的判断、推断和词义猜测。\n"
            "【解题思路】推断题从多个细节（分享午餐、打电话、带水果）综合推理；词义猜测从上下文语境推理。\n"
            "【总结】推断题需要综合多个细节得出结论；词义猜测要结合上下文语境，不能只看字面意思。"
        ),
        "difficulty": 0.5
    },

    # ===== en_reading_034 — Technology/Robots (medium, MC + Vocab) =====
    {
        "id": "en_reading_034",
        "subject": "english",
        "knowledge_tag": "英语阅读",
        "ability_tag": "阅读理解",
        "type": "multiple_choice",
        "question": (
            "阅读下面短文，选择正确答案。\n\n"
            "Robots are very useful today. In factories, robots can do dangerous work. They can carry heavy things. "
            "They never get tired. In hospitals, robots can help doctors. Some robots can do simple operations. "
            "At home, robots can clean the floor and cook food. Some robots can even talk to people. Children like "
            "to play with robot toys. But robots cannot think like people. They can only do what people tell them to "
            "do. In the future, robots may do more things for us.\n\n"
            "(1) Where can robots do dangerous work?\n"
            "A. In schools B. In factories C. In libraries D. In parks\n\n"
            "(2) What does the passage say about robots at home?\n"
            "A. They can teach children. B. They can clean the floor and cook.\n"
            "C. They can drive cars. D. They can fix computers.\n\n"
            "(3) What does the word \"operations\" mean in this passage?\n"
            "A. Math calculations B. Business activities\n"
            "C. Medical surgeries D. Computer programs\n\n"
            "(4) What is a limitation of robots according to the passage?\n"
            "A. They cannot carry heavy things.\n"
            "B. They cannot work in factories.\n"
            "C. They cannot think like people.\n"
            "D. They cannot talk.\n\n"
            "(5) What does the writer think about the future of robots?\n"
            "A. Robots will disappear. B. Robots will do more things for us.\n"
            "C. Robots will take over the world. D. Robots will not change."
        ),
        "options": [],
        "answer": "(1) B (2) B (3) C (4) C (5) B",
        "analysis": (
            "【考点】本题考查科技话题的细节理解、词义猜测和推断。\n"
            "【解题思路】词义猜测从上下文（hospitals, doctors）推断operations为手术；推断从最后一句推理。\n"
            "【总结】词义猜测题要根据上下文语境，特别是前后出现的关联词（hospitals, doctors → operations = 手术）。"
        ),
        "difficulty": 0.5
    },

    # ===== en_reading_035 — Travel/London (medium, Short Answer) =====
    {
        "id": "en_reading_035",
        "subject": "english",
        "knowledge_tag": "英语阅读",
        "ability_tag": "阅读理解",
        "type": "multiple_choice",
        "question": (
            "阅读下面短文，用完整的英语句子回答问题。\n\n"
            "Last winter holiday, I went to London with my parents. London is the capital of the UK. We went there "
            "by plane. It took about 11 hours from Beijing. We visited many famous places. We saw Big Ben. It is a "
            "very big clock tower. We also visited the British Museum. There were many old and interesting things "
            "inside. We walked along the River Thames. The view was beautiful. We ate fish and chips. It is a "
            "famous English food. We also drank afternoon tea. I liked the tea and cakes very much. We stayed in "
            "London for a week. It was a wonderful trip.\n\n"
            "(1) What is the capital of the UK?\n"
            "________________________________________\n"
            "(2) How did they go to London?\n"
            "________________________________________\n"
            "(3) What is Big Ben?\n"
            "________________________________________\n"
            "(4) What famous English food did they eat?\n"
            "________________________________________\n"
            "(5) How long did they stay in London?\n"
            "________________________________________"
        ),
        "options": [],
        "answer": (
            "(1) London is the capital of the UK.\n"
            "(2) They went there by plane.\n"
            "(3) It is a very big clock tower.\n"
            "(4) They ate fish and chips.\n"
            "(5) They stayed in London for a week."
        ),
        "analysis": (
            "【考点】本题考查旅行类文章的信息提取。\n"
            "【解题思路】在文中逐一定位答案，用完整句子作答。\n"
            "【总结】旅行类文章注意地点、交通方式、景点名称和美食等关键信息，回答时要准确转述原文。"
        ),
        "difficulty": 0.5
    },

    # ===== en_reading_036 — Science/Water Cycle (medium, MC + Main Idea) =====
    {
        "id": "en_reading_036",
        "subject": "english",
        "knowledge_tag": "英语阅读",
        "ability_tag": "阅读理解",
        "type": "multiple_choice",
        "question": (
            "阅读下面短文，选择正确答案。\n\n"
            "Water is very important for all living things. Without water, there would be no life on Earth. Water "
            "goes around in a cycle. First, the sun heats the water in rivers, lakes, and seas. The water becomes "
            "water vapor and goes up into the sky. This is called evaporation. When the water vapor goes high up, "
            "it becomes cool and forms clouds. This is called condensation. When the clouds become heavy with "
            "water, rain or snow falls down. This is called precipitation. The water goes back into rivers and "
            "seas. Then the cycle starts again.\n\n"
            "(1) What happens when the sun heats water?\n"
            "A. It becomes ice. B. It becomes water vapor.\n"
            "C. It becomes clouds. D. It becomes rain.\n\n"
            "(2) What is the process of water vapor forming clouds called?\n"
            "A. Evaporation B. Condensation C. Precipitation D. Heating\n\n"
            "(3) What happens when clouds become heavy with water?\n"
            "A. The sun comes out. B. Rain or snow falls down.\n"
            "C. The water evaporates. D. The clouds disappear.\n\n"
            "(4) What is this passage mainly about?\n"
            "A. Why the sun is hot B. How to save water\n"
            "C. The water cycle D. Different kinds of clouds\n\n"
            "(5) What can we learn from the passage?\n"
            "A. Water only comes from rain.\n"
            "B. The water cycle never stops.\n"
            "C. Evaporation happens at night.\n"
            "D. Clouds are made of smoke."
        ),
        "options": [],
        "answer": "(1) B (2) B (3) B (4) C (5) B",
        "analysis": (
            "【考点】本题考查科普文章的细节理解和主旨题。\n"
            "【解题思路】主旨题看全文核心话题——水循环；推断从\"the cycle starts again\"推出循环不停。\n"
            "【总结】科普类文章要注意专业术语和定义的对应关系，主旨题要抓住全文反复出现的核心词（water cycle）。"
        ),
        "difficulty": 0.5
    },

    # ===== en_reading_037 — Health/Exercise (medium, T/F + MC) =====
    {
        "id": "en_reading_037",
        "subject": "english",
        "knowledge_tag": "英语阅读",
        "ability_tag": "阅读理解",
        "type": "multiple_choice",
        "question": (
            "阅读下面短文，完成题目。\n\n"
            "Exercise is very important for our health. Children should exercise for at least one hour every day. "
            "There are many kinds of exercise. Running, swimming, and playing basketball are all good exercise. "
            "Exercise makes our muscles strong. It helps us sleep better at night. It also makes us feel happy. "
            "But there are some things to remember. You should warm up before you exercise. You should drink "
            "water before and after exercise. Don't exercise right after a big meal. If you feel sick while "
            "exercising, you should stop and rest.\n\n"
            "判断正误。\n"
            "(1) Children should exercise for at least one hour every day. (　)\n"
            "(2) You should exercise right after a big meal. (　)\n\n"
            "选择正确答案。\n"
            "(3) What does exercise help us do?\n"
            "A. Sleep better B. Feel happy C. Build strong muscles D. All of the above\n\n"
            "(4) What should you do before exercising?\n"
            "A. Eat a big meal B. Warm up C. Go to sleep D. Stop and rest\n\n"
            "(5) What does the passage mainly tell us?\n"
            "A. How to play basketball B. Why exercise is important and how to do it safely\n"
            "C. How much water to drink D. When to eat meals"
        ),
        "options": [],
        "answer": "(1) T (2) F (3) D (4) B (5) B",
        "analysis": (
            "【考点】本题考查健康话题的混合题型。\n"
            "【解题思路】判断题比对原文，选择题注意All of the above选项，主旨题看全文主题。\n"
            "【总结】当所有单个选项都正确时，选\"All of the above\"。主旨题答案要涵盖全文要点。"
        ),
        "difficulty": 0.5
    },

    # ===== en_reading_038 — Holidays/Christmas (medium, Sequencing + MC) =====
    {
        "id": "en_reading_038",
        "subject": "english",
        "knowledge_tag": "英语阅读",
        "ability_tag": "阅读理解",
        "type": "multiple_choice",
        "question": (
            "阅读下面短文，完成题目。\n\n"
            "Christmas is a popular holiday in Western countries. It is on December 25th. Before Christmas, people "
            "decorate their homes with Christmas trees and lights. They buy gifts for family and friends. On "
            "Christmas Eve (December 24th), children hang stockings by the fireplace. They believe Santa Claus "
            "will come and put gifts in their stockings. On Christmas Day, families get together. They have a "
            "big dinner. They eat turkey, cake, and pudding. They open their gifts. People say \"Merry Christmas\" "
            "to each other. It is a happy time for everyone.\n\n"
            "将事件排序（1-4）。\n"
            "A. Families have a big dinner.\n"
            "B. Children hang stockings.\n"
            "C. People decorate their homes.\n"
            "D. People open their gifts.\n\n"
            "正确的顺序是：____ → ____ → ____ → ____\n\n"
            "选择正确答案。\n"
            "(5) When is Christmas?\n"
            "A. December 24th B. December 25th C. January 1st D. November 30th"
        ),
        "options": [],
        "answer": "C → B → A → D\n(5) B",
        "analysis": (
            "【考点】本题考查节日流程排序和细节理解。\n"
            "【解题思路】按时间顺序：装饰家→挂袜子→吃晚餐→拆礼物。\n"
            "【总结】节日类文章要注意节前、节中、节后的活动顺序，以及具体日期。"
        ),
        "difficulty": 0.5
    },

    # ===== en_reading_039 — Community/Library (medium, MC + Inference) =====
    {
        "id": "en_reading_039",
        "subject": "english",
        "knowledge_tag": "英语阅读",
        "ability_tag": "阅读理解",
        "type": "multiple_choice",
        "question": (
            "阅读下面短文，选择正确答案。\n\n"
            "Our city has a big public library. It is open from Tuesday to Sunday, from 9:00 am to 6:00 pm. It is "
            "closed on Mondays. The library has many books, magazines, and newspapers. You can borrow up to five "
            "books at a time. You can keep them for two weeks. If you don't return the books on time, you have to "
            "pay a fine. The library also has a reading room. It is very quiet. Many students go there to study. "
            "There is a children's corner with picture books and storybooks. Every Saturday morning, there is a "
            "storytelling activity for children. It is free. Many children enjoy it.\n\n"
            "(1) When is the library closed?\n"
            "A. On Sundays B. On Mondays C. On Saturdays D. On Tuesdays\n\n"
            "(2) How many books can you borrow at a time?\n"
            "A. Three B. Five C. Seven D. Ten\n\n"
            "(3) How long can you keep the books?\n"
            "A. One week B. Two weeks C. Three weeks D. One month\n\n"
            "(4) What happens if you return books late?\n"
            "A. Nothing happens. B. You have to pay a fine.\n"
            "C. You cannot borrow books again. D. The library calls your parents.\n\n"
            "(5) What can we infer about the library from the passage?\n"
            "A. It only has books for adults.\n"
            "B. It is not a popular place.\n"
            "C. It provides services for both adults and children.\n"
            "D. It is only open on weekdays."
        ),
        "options": [],
        "answer": "(1) B (2) B (3) B (4) B (5) C",
        "analysis": (
            "【考点】本题考查社区设施类文章的细节理解和推断。\n"
            "【解题思路】推断题从\"children's corner\"\"storytelling activity\"和\"students study\"推出同时服务成人和儿童。\n"
            "【总结】推断题答案不直接出现在文中，需要根据多个细节综合推理。"
        ),
        "difficulty": 0.5
    },

    # ===== en_reading_040 — Animals/Pandas (medium, MC + Vocab) =====
    {
        "id": "en_reading_040",
        "subject": "english",
        "knowledge_tag": "英语阅读",
        "ability_tag": "阅读理解",
        "type": "multiple_choice",
        "question": (
            "阅读下面短文，选择正确答案。\n\n"
            "Pandas are one of the most famous animals in China. They are black and white. They are very cute. "
            "Pandas live in the forests of Sichuan, Shaanxi, and Gansu. Their favorite food is bamboo. A panda "
            "can eat about 30 kilograms of bamboo every day! Pandas spend most of their time eating and sleeping. "
            "Baby pandas are very small when they are born. They are pink and weigh only about 100 grams. There are "
            "not many pandas in the world. They are endangered animals. China is working hard to protect pandas. "
            "Many nature reserves have been built for them.\n\n"
            "(1) What color are pandas?\n"
            "A. Brown and white B. Black and white C. Black and yellow D. Brown and black\n\n"
            "(2) How much bamboo can a panda eat every day?\n"
            "A. About 10 kilograms B. About 20 kilograms\n"
            "C. About 30 kilograms D. About 40 kilograms\n\n"
            "(3) What does the word \"endangered\" mean in this passage?\n"
            "A. Dangerous to people B. Very strong\n"
            "C. In danger of disappearing D. Very healthy\n\n"
            "(4) What is China doing to help pandas?\n"
            "A. Building nature reserves B. Sending them to zoos\n"
            "C. Feeding them fish D. Teaching them to swim\n\n"
            "(5) What is the best title for this passage?\n"
            "A. Animals in China B. The Cute Pandas\n"
            "C. How to Protect Animals D. Bamboo Forests"
        ),
        "options": [],
        "answer": "(1) B (2) C (3) C (4) A (5) B",
        "analysis": (
            "【考点】本题考查动物说明文的细节理解、词义猜测和主旨题。\n"
            "【解题思路】词义猜测从\"not many pandas\"和\"protect\"推出endangered为濒危的；主旨从全文核心话题判断。\n"
            "【总结】词义猜测要结合上下文线索，如\"not many\"\"protect\"暗示物种稀少需要保护。"
        ),
        "difficulty": 0.5
    },

    # ===== en_reading_041 — School Life/Clubs (medium, Short Answer) =====
    {
        "id": "en_reading_041",
        "subject": "english",
        "knowledge_tag": "英语阅读",
        "ability_tag": "阅读理解",
        "type": "multiple_choice",
        "question": (
            "阅读下面短文，用完整的英语句子回答问题。\n\n"
            "Our school has many clubs. Students can choose the club they like. The Art Club meets on Monday "
            "afternoons. Students paint and draw pictures there. The Music Club meets on Tuesdays. Students sing "
            "songs and play instruments. The Sports Club meets on Wednesdays and Fridays. Students play basketball, "
            "football, and table tennis. The Science Club meets on Thursdays. Students do interesting experiments. "
            "I joined the Art Club because I like drawing. My friend Tom joined the Science Club. He wants to be a "
            "scientist when he grows up.\n\n"
            "(1) When does the Art Club meet?\n"
            "________________________________________\n"
            "(2) What do students do in the Music Club?\n"
            "________________________________________\n"
            "(3) Which club meets on Wednesdays and Fridays?\n"
            "________________________________________\n"
            "(4) Why did the writer join the Art Club?\n"
            "________________________________________\n"
            "(5) What does Tom want to be when he grows up?\n"
            "________________________________________"
        ),
        "options": [],
        "answer": (
            "(1) The Art Club meets on Monday afternoons.\n"
            "(2) They sing songs and play instruments.\n"
            "(3) The Sports Club meets on Wednesdays and Fridays.\n"
            "(4) Because the writer likes drawing.\n"
            "(5) He wants to be a scientist."
        ),
        "analysis": (
            "【考点】本题考查学校社团活动的时间、活动和原因提取。\n"
            "【解题思路】在文中找到每个社团对应的日期、活动和原因。\n"
            "【总结】回答Why问题用Because开头；回答When问题要给出具体时间；回答What用完整描述。"
        ),
        "difficulty": 0.5
    },

    # ===== en_reading_042 — Health/Sleep (medium, T/F + Inference) =====
    {
        "id": "en_reading_042",
        "subject": "english",
        "knowledge_tag": "英语阅读",
        "ability_tag": "阅读理解",
        "type": "multiple_choice",
        "question": (
            "阅读下面短文，完成题目。\n\n"
            "Sleep is very important for children. Most children need 9 to 11 hours of sleep every night. Good sleep "
            "helps children grow and learn better. But many children do not get enough sleep. Some children stay up "
            "late playing games or watching TV. This is a bad habit. Here are some tips for good sleep. First, go "
            "to bed at the same time every night. Second, don't drink tea or cola before bed. Third, don't use "
            "phones or tablets in bed. The light from screens makes it hard to fall asleep. Fourth, read a book or "
            "listen to quiet music before sleep. These will help you relax.\n\n"
            "判断正误。\n"
            "(1) Most children need only 5 hours of sleep. (　)\n"
            "(2) Playing games before bed is a good habit. (　)\n"
            "(3) Screen light can make it hard to fall asleep. (　)\n\n"
            "选择正确答案。\n"
            "(4) What does the writer imply about phones and tablets?\n"
            "A. They are good for sleep.\n"
            "B. They are not good to use before sleep.\n"
            "C. They help children learn better.\n"
            "D. They are the same as books.\n\n"
            "(5) What is the passage mainly about?\n"
            "A. How to play games B. Why sleep is important and tips for good sleep\n"
            "C. How to use phones D. What to drink before bed"
        ),
        "options": [],
        "answer": "(1) F (2) F (3) T (4) B (5) B",
        "analysis": (
            "【考点】本题考查健康睡眠话题的判断、推断和主旨。\n"
            "【解题思路】推断从\"light from screens makes it hard to fall asleep\"推出不建议睡前用手机。\n"
            "【总结】推断题要根据文中证据推理，不能凭主观判断。主旨要概括全文两大部分：为什么重要+怎么做。"
        ),
        "difficulty": 0.5
    },

    # ===== en_reading_043 — Festivals/Spring Festival (medium, MC + Main Idea) =====
    {
        "id": "en_reading_043",
        "subject": "english",
        "knowledge_tag": "英语阅读",
        "ability_tag": "阅读理解",
        "type": "multiple_choice",
        "question": (
            "阅读下面短文，选择正确答案。\n\n"
            "The Spring Festival is the most important festival in China. It is also called Chinese New Year. It "
            "usually comes in January or February. Before the Spring Festival, people clean their houses. They buy "
            "new clothes and lots of food. On New Year's Eve, families have a big dinner together. They eat "
            "dumplings, fish, and many other dishes. After dinner, people usually watch the Spring Festival Gala "
            "on TV. Children like the Spring Festival very much because they can get red envelopes with money "
            "inside. People visit relatives and friends during the holiday. They say \"Happy New Year\" to each "
            "other. The Spring Festival usually lasts for about 15 days.\n\n"
            "(1) What is another name for the Spring Festival?\n"
            "A. Mid-Autumn Festival B. Dragon Boat Festival C. Chinese New Year D. Lantern Festival\n\n"
            "(2) What do people do before the Spring Festival?\n"
            "A. Clean their houses B. Go swimming C. Plant trees D. Fly kites\n\n"
            "(3) Why do children like the Spring Festival?\n"
            "A. Because they can swim. B. Because they can get red envelopes.\n"
            "C. Because they can plant trees. D. Because they can go to school.\n\n"
            "(4) What is the passage mainly about?\n"
            "A. Chinese food B. Chinese holidays C. Spring Festival traditions D. Family dinners\n\n"
            "(5) How long does the Spring Festival usually last?\n"
            "A. About 7 days B. About 10 days C. About 15 days D. About 30 days"
        ),
        "options": [],
        "answer": "(1) C (2) A (3) B (4) C (5) C",
        "analysis": (
            "【考点】本题考查春节文化的细节和主旨。\n"
            "【解题思路】主旨看全文核心——春节传统习俗。细节题在文中直接定位。\n"
            "【总结】主旨题的答案要涵盖文章的主要方面，不能只涵盖某个细节（如family dinners只是其中一部分）。"
        ),
        "difficulty": 0.5
    },

    # ===== en_reading_044 — Science/Plants (medium, MC + Vocab) =====
    {
        "id": "en_reading_044",
        "subject": "english",
        "knowledge_tag": "英语阅读",
        "ability_tag": "阅读理解",
        "type": "multiple_choice",
        "question": (
            "阅读下面短文，选择正确答案。\n\n"
            "Plants are very important. They give us food to eat and oxygen to breathe. Most plants have roots, "
            "stems, leaves, flowers, and fruits. Roots grow under the ground. They take in water from the soil. "
            "Stems carry water from roots to leaves. Leaves are very important because they make food for the "
            "plant. They use sunlight, water, and carbon dioxide to make food. This process is called "
            "photosynthesis. Flowers are beautiful and colorful. They attract insects. Insects help plants make "
            "seeds. Some plants grow from seeds. Some plants grow from stems or leaves.\n\n"
            "(1) What do plants give us?\n"
            "A. Water and soil B. Food and oxygen C. Sunlight and rain D. Coal and oil\n\n"
            "(2) What do roots do?\n"
            "A. They make food. B. They carry water to leaves.\n"
            "C. They take in water from the soil. D. They attract insects.\n\n"
            "(3) What does \"photosynthesis\" mean in this passage?\n"
            "A. A way plants breathe B. The process of plants making food using sunlight\n"
            "C. How plants grow from seeds D. The way flowers attract insects\n\n"
            "(4) Why are leaves important?\n"
            "A. Because they are colorful. B. Because they attract insects.\n"
            "C. Because they make food for the plant. D. Because they grow under the ground.\n\n"
            "(5) What helps plants make seeds?\n"
            "A. Wind B. Rain C. Insects D. Roots"
        ),
        "options": [],
        "answer": "(1) B (2) C (3) B (4) C (5) C",
        "analysis": (
            "【考点】本题考查植物科学知识及词义猜测。\n"
            "【解题思路】词义猜测从\"use sunlight, water, and carbon dioxide to make food\"推出photosynthesis的含义。\n"
            "【总结】科学类文章要注意定义句的格式（This process is called...），这往往是词义猜测题的线索。"
        ),
        "difficulty": 0.5
    },

    # ===== en_reading_045 — Pets/Dog (medium, MC + Inference) =====
    {
        "id": "en_reading_045",
        "subject": "english",
        "knowledge_tag": "英语阅读",
        "ability_tag": "阅读理解",
        "type": "multiple_choice",
        "question": (
            "阅读下面短文，选择正确答案。\n\n"
            "My dog Max is my best friend. He is a golden retriever. He has golden fur and big brown eyes. Every "
            "morning, Max wakes me up. He jumps on my bed and licks my face. After school, Max waits for me at the "
            "door. When I come in, he wags his tail happily. We go for a walk in the park every day. Max likes to "
            "chase balls. He can run very fast. One rainy day, I felt sad because I couldn't go out. Max came and "
            "sat next to me. He put his head on my lap. I felt much better. Max can always tell when I am sad. "
            "He is the best dog in the world.\n\n"
            "(1) What kind of dog is Max?\n"
            "A. A small white dog B. A golden retriever C. A black dog D. A brown poodle\n\n"
            "(2) What does Max do every morning?\n"
            "A. He goes for a walk alone. B. He watches TV.\n"
            "C. He wakes the writer up. D. He plays in the park.\n\n"
            "(3) What does Max do when the writer comes home?\n"
            "A. He hides under the bed. B. He wags his tail happily.\n"
            "C. He goes to sleep. D. He runs away.\n\n"
            "(4) What can we learn about Max from the passage?\n"
            "A. He only cares about food.\n"
            "B. He does not like the writer.\n"
            "C. He understands the writer's feelings.\n"
            "D. He prefers to be alone.\n\n"
            "(5) What is the best title for this passage?\n"
            "A. How to Train a Dog B. Dogs in the Park\n"
            "C. My Best Friend Max D. A Rainy Day"
        ),
        "options": [],
        "answer": "(1) B (2) C (3) B (4) C (5) C",
        "analysis": (
            "【考点】本题考查宠物类记叙文的细节理解和推断。\n"
            "【解题思路】推断从\"Max can always tell when I am sad\"推出Max能理解主人情感。\n"
            "【总结】推断题要找文中的行为描述作为证据（如舔脸、摇尾巴、把头放在腿上），从行为推理情感。"
        ),
        "difficulty": 0.5
    },

    # ===== en_reading_046 — Environment/Recycling (hard, MC + Inference + Vocab) =====
    {
        "id": "en_reading_046",
        "subject": "english",
        "knowledge_tag": "英语阅读",
        "ability_tag": "阅读理解",
        "type": "multiple_choice",
        "question": (
            "阅读下面短文，选择正确答案。\n\n"
            "Every day, people produce a lot of rubbish. Where does it all go? Most rubbish is buried in the ground "
            "in places called landfills. But landfills are getting full. We need to produce less rubbish. One way to "
            "do this is to recycle. Recycling means turning old things into new things. We can recycle paper, glass, "
            "plastic, and metal. When we recycle paper, we save trees. When we recycle glass, we save sand and "
            "energy. Recycling also helps reduce pollution. But recycling is not the only answer. We should also "
            "reduce the amount of things we use, and reuse things when possible. This is called the \"3Rs\" — "
            "Reduce, Reuse, Recycle. If everyone follows the 3Rs, our planet will be cleaner and healthier.\n\n"
            "(1) Where is most rubbish buried?\n"
            "A. In the sea B. In landfills C. In rivers D. In parks\n\n"
            "(2) What does \"recycle\" mean in this passage?\n"
            "A. To throw things away B. To buy new things\n"
            "C. To turn old things into new things D. To burn old things\n\n"
            "(3) What do we save when we recycle paper?\n"
            "A. Water B. Sand C. Trees D. Metal\n\n"
            "(4) What does the writer imply about the 3Rs?\n"
            "A. Recycling alone can solve all problems.\n"
            "B. Only adults should follow the 3Rs.\n"
            "C. All three actions are needed to protect the planet.\n"
            "D. The 3Rs are too difficult for most people.\n\n"
            "(5) What can we infer from the last sentence?\n"
            "A. The planet is already clean enough.\n"
            "B. Individual actions can make a difference to the environment.\n"
            "C. Only factories cause pollution.\n"
            "D. The 3Rs are a new idea."
        ),
        "options": [],
        "answer": "(1) B (2) C (3) C (4) C (5) B",
        "analysis": (
            "【考点】本题考查环保话题的细节理解、词义猜测和深层推断。\n"
            "【解题思路】词义猜测从后文\"turning old things into new things\"直接得出定义；推断题从\"If everyone follows\"推出个人行动的力量。\n"
            "【总结】推断题答案在文中无直接表述，需要从文章整体论证方向和结论句推理。3Rs的关系是递进的——三者缺一不可。"
        ),
        "difficulty": 0.7
    },

    # ===== en_reading_047 — Technology/Internet Safety (hard, MC + Inference + Main Idea) =====
    {
        "id": "en_reading_047",
        "subject": "english",
        "knowledge_tag": "英语阅读",
        "ability_tag": "阅读理解",
        "type": "multiple_choice",
        "question": (
            "阅读下面短文，选择正确答案。\n\n"
            "The Internet is a wonderful tool. We can learn new things, play games, and talk to friends online. But "
            "the Internet can also be dangerous, especially for children. Some strangers on the Internet may not be "
            "who they say they are. They may try to get your personal information, like your name, address, or phone "
            "number. You should never share personal information with strangers online. Also, be careful about what "
            "you post. Once something is on the Internet, it is very hard to remove. Cyberbullying is another "
            "problem. Some people write mean things online to hurt others. If someone is unkind to you online, tell "
            "a parent or teacher right away. The Internet can be safe if you use it wisely.\n\n"
            "(1) What may strangers on the Internet try to do?\n"
            "A. Help with homework B. Get your personal information\n"
            "C. Send you gifts D. Teach you new things\n\n"
            "(2) What does \"cyberbullying\" mean in this passage?\n"
            "A. Studying online B. Playing online games\n"
            "C. Hurting others by writing mean things online D. Making friends online\n\n"
            "(3) What should you do if someone is unkind to you online?\n"
            "A. Write mean things back B. Keep it a secret\n"
            "C. Tell a parent or teacher D. Stop using the Internet forever\n\n"
            "(4) What does the writer imply about things posted on the Internet?\n"
            "A. They can be easily deleted anytime.\n"
            "B. Only your friends can see them.\n"
            "C. They may stay online permanently even if you try to remove them.\n"
            "D. They are always safe.\n\n"
            "(5) What is the main idea of this passage?\n"
            "A. The Internet is only dangerous.\n"
            "B. How to play games online safely.\n"
            "C. The Internet is useful but children need to use it safely.\n"
            "D. How to make friends online."
        ),
        "options": [],
        "answer": "(1) B (2) C (3) C (4) C (5) C",
        "analysis": (
            "【考点】本题考查网络安全话题的细节理解、词义猜测、推断和主旨。\n"
            "【解题思路】词义猜测从后文解释句推出；推断从\"very hard to remove\"推出永久性；主旨从首尾句概括。\n"
            "【总结】难篇常同时出现多种题型。词义猜测看紧跟的定义句或举例句；推断题注意\"hard to remove\"的深层含义。"
        ),
        "difficulty": 0.7
    },

    # ===== en_reading_048 — Science/Space (hard, MC + Inference + Vocab) =====
    {
        "id": "en_reading_048",
        "subject": "english",
        "knowledge_tag": "英语阅读",
        "ability_tag": "阅读理解",
        "type": "multiple_choice",
        "question": (
            "阅读下面短文，选择正确答案。\n\n"
            "The solar system has eight planets. They all go around the sun. The four planets closest to the sun are "
            "Mercury, Venus, Earth, and Mars. They are called inner planets. The other four — Jupiter, Saturn, "
            "Uranus, and Neptune — are called outer planets. Jupiter is the biggest planet. Saturn has beautiful "
            "rings around it. Earth is the only planet that we know has life. It has water and air, which are "
            "necessary for living things. Mars is called the \"Red Planet\" because it looks red. Scientists have "
            "sent many spacecraft to explore Mars. They want to find out if there was ever life on Mars. Some "
            "scientists believe that humans may live on Mars in the future, but this would be very difficult.\n\n"
            "(1) How many planets are there in the solar system?\n"
            "A. Six B. Seven C. Eight D. Nine\n\n"
            "(2) Which planet is the biggest?\n"
            "A. Earth B. Mars C. Saturn D. Jupiter\n\n"
            "(3) What does \"explore\" mean in this passage?\n"
            "A. To destroy B. To study and discover C. To build D. To fly over\n\n"
            "(4) Why is Earth special among the planets?\n"
            "A. It is the biggest planet.\n"
            "B. It is the closest to the sun.\n"
            "C. It is the only planet known to have life.\n"
            "D. It has rings around it.\n\n"
            "(5) What can we infer about living on Mars in the future?\n"
            "A. It will be easy and fun.\n"
            "B. It is already happening now.\n"
            "C. It is possible but would be very challenging.\n"
            "D. Scientists have given up on the idea."
        ),
        "options": [],
        "answer": "(1) C (2) D (3) B (4) C (5) C",
        "analysis": (
            "【考点】本题考查太空科学话题的细节理解、词义猜测和推断。\n"
            "【解题思路】词义猜测从\"sent spacecraft\"\"find out\"推出explore为探索发现；推断从\"may live\"和\"very difficult\"推出。\n"
            "【总结】科普类推断题要注意情态动词（may, might）和程度副词（very difficult）的暗示，推理答案不能过于绝对。"
        ),
        "difficulty": 0.7
    },

    # ===== en_reading_049 — Reading Habits (hard, MC + Inference + Vocab + Main Idea) =====
    {
        "id": "en_reading_049",
        "subject": "english",
        "knowledge_tag": "英语阅读",
        "ability_tag": "阅读理解",
        "type": "multiple_choice",
        "question": (
            "阅读下面短文，选择正确答案。\n\n"
            "Reading is a good habit. It can help us learn new words and improve our writing. But not everyone likes "
            "reading. Some children think reading is boring. They prefer playing video games or watching videos. "
            "However, reading has many advantages that screens cannot provide. When you read a story, you use your "
            "imagination to picture the characters and places. When you watch a video, everything is shown to you. "
            "Reading also helps you concentrate better. Studies show that children who read regularly do better in "
            "school. To develop a reading habit, start with books you enjoy. You don't have to read thick books. "
            "Comic books, magazines, and storybooks are all fine. Try to read for 20 minutes before bed every "
            "night. Soon, you may find that reading is actually fun.\n\n"
            "(1) What can reading help us do?\n"
            "A. Learn new words and improve writing B. Play video games better\n"
            "C. Watch more videos D. Sleep less\n\n"
            "(2) What does \"concentrate\" mean in this passage?\n"
            "A. To forget things easily B. To focus attention on something\n"
            "C. To get tired quickly D. To move around a lot\n\n"
            "(3) What advantage does reading have over watching videos?\n"
            "A. Reading is louder. B. Reading is faster.\n"
            "C. Reading uses imagination. D. Reading has more pictures.\n\n"
            "(4) What does the writer imply about children who don't like reading?\n"
            "A. They will never learn to read.\n"
            "B. They can learn to enjoy reading if they start with what they like.\n"
            "C. They are not smart.\n"
            "D. They should be forced to read difficult books.\n\n"
            "(5) What is the main idea of this passage?\n"
            "A. Video games are bad for children.\n"
            "B. Reading is important and everyone can develop the habit.\n"
            "C. Children should only read thick books.\n"
            "D. Schools should give more homework."
        ),
        "options": [],
        "answer": "(1) A (2) B (3) C (4) B (5) B",
        "analysis": (
            "【考点】本题考查阅读习惯话题的全方位理解，包含细节、词义猜测、推断和主旨。\n"
            "【解题思路】词义从\"helps you concentrate better\"和\"do better in school\"推出；推断从\"start with books you enjoy\"推出。\n"
            "【总结】本篇为综合性高难度文章。推断题要注意文章的建议部分（\"start with books you enjoy\"），这暗示了解决方案。"
        ),
        "difficulty": 0.7
    },

    # ===== en_reading_050 — Travel/Beijing (hard, T/F + Inference + Vocab + Main Idea) =====
    {
        "id": "en_reading_050",
        "subject": "english",
        "knowledge_tag": "英语阅读",
        "ability_tag": "阅读理解",
        "type": "multiple_choice",
        "question": (
            "阅读下面短文，完成题目。\n\n"
            "Beijing is a fascinating city. It is the capital of China and has a history of over 3,000 years. Millions "
            "of tourists visit Beijing every year. The most famous place is the Great Wall. It is one of the longest "
            "walls in the world. It was built to protect China from enemies. The Forbidden City is another must-see "
            "place. It was the home of emperors for hundreds of years. Now it is a museum. You can see many "
            "treasures there. Beijing also has beautiful parks, such as the Summer Palace and the Temple of Heaven. "
            "In the old parts of Beijing, there are hutongs. These are narrow streets with traditional houses. Walking "
            "through hutongs is like traveling back in time. Beijing is a city where the ancient and modern exist "
            "side by side. You can see tall buildings and old temples next to each other.\n\n"
            "判断正误。\n"
            "(1) The Great Wall was built to welcome visitors. (　)\n"
            "(2) The Forbidden City is now a museum. (　)\n\n"
            "选择正确答案。\n"
            "(3) What does \"fascinating\" mean in this passage?\n"
            "A. Very boring B. Very interesting and attractive C. Very old and broken D. Very small\n\n"
            "(4) What can we infer about hutongs?\n"
            "A. They are new and modern.\n"
            "B. They show the traditional lifestyle of old Beijing.\n"
            "C. Nobody lives in hutongs anymore.\n"
            "D. They are the same as tall buildings.\n\n"
            "(5) What is the passage mainly about?\n"
            "A. The food in Beijing\n"
            "B. Beijing as a city rich in history and culture\n"
            "C. How to travel to Beijing\n"
            "D. Modern buildings in China"
        ),
        "options": [],
        "answer": "(1) F (2) T (3) B (4) B (5) B",
        "analysis": (
            "【考点】本题为综合性高难度文章，考查判断、词义猜测、推断和主旨。\n"
            "【解题思路】词义从后文列举众多景点推出fascinating意为迷人的；推断从\"traveling back in time\"推出胡同代表传统。\n"
            "【总结】词义猜测要看上下文的感情色彩和举例——列举众多著名景点说明fascinating是正面形容词。推断\"like traveling back in time\"暗示古老传统。"
        ),
        "difficulty": 0.7
    }
]


def main():
    # Read existing data
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Check existing IDs
    existing_ids = {item["id"] for item in data}
    expected_new_ids = {f"en_reading_{i:03d}" for i in range(21, 51)}

    # Verify no duplicates
    duplicates = existing_ids & expected_new_ids
    if duplicates:
        print(f"WARNING: Duplicate IDs found: {duplicates}")
        print("Skipping duplicate entries.")
        new_passages_filtered = [p for p in new_passages if p["id"] not in existing_ids]
    else:
        new_passages_filtered = new_passages

    # Append new passages
    data.extend(new_passages_filtered)

    # Write back
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Successfully added {len(new_passages_filtered)} new passages.")
    print(f"Total passages in file: {len(data)}")

    # Summary
    easy = sum(1 for p in new_passages_filtered if p["difficulty"] == 0.3)
    medium = sum(1 for p in new_passages_filtered if p["difficulty"] == 0.5)
    hard = sum(1 for p in new_passages_filtered if p["difficulty"] == 0.7)
    print(f"Difficulty distribution - Easy(0.3): {easy}, Medium(0.5): {medium}, Hard(0.7): {hard}")

    # Verify topics
    topics = [
        "Hobbies", "Animals/Dolphins", "Sports", "Food/Healthy Eating", "Daily Routine",
        "Family", "Weather", "Shopping", "Occupations", "Transportation",
        "Environment", "Festivals/Mid-Autumn", "Friendship", "Technology/Robots", "Travel/London",
        "Science/Water Cycle", "Health/Exercise", "Holidays/Christmas", "Community/Library", "Animals/Pandas",
        "School Life/Clubs", "Health/Sleep", "Festivals/Spring Festival", "Science/Plants", "Pets/Dog",
        "Environment/Recycling", "Technology/Internet Safety", "Science/Space", "Reading Habits", "Travel/Beijing"
    ]
    print(f"\nTopics covered ({len(topics)}):")
    for i, t in enumerate(topics, 21):
        print(f"  en_reading_{i:03d}: {t}")


if __name__ == "__main__":
    main()
