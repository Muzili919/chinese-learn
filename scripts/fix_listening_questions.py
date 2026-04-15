#!/usr/bin/env python3
"""
修复听力题 T/F 选项问题
20道题（questions_en_listen 10道 + questions_en_j2_listen 10道）
选项被错误地设为 T/F 或 正确/错误，但实际问的是具体内容
需要根据 listening_text 推断正确的 ABCD 选项
"""
import json, os

os.chdir('/Volumes/ORICO/xinwen/claudecode/chinese-learn')

def fix_file(filepath, fixes):
    with open(filepath, 'r') as f:
        data = json.load(f)
    fixed = 0
    for q in data:
        qid = q.get('id')
        if qid in fixes:
            fix = fixes[qid]
            print(f"  {qid}: opts {q['options']} → {fix['options'][:2]}... | ans {q.get('answer')} → {fix['answer']}")
            q['options'] = fix['options']
            q['answer'] = fix['answer']
            if 'analysis' in fix:
                q['analysis'] = fix['analysis']
            fixed += 1
    with open(filepath, 'w') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  共修复 {fixed} 道\n")
    return fixed


# ====== questions_en_listen.json 的 10 道修复 ======
fixes_listen = {
    "en_listen_003": {
        "options": ["A. Yes, they do.", "B. No, they have music class.", "C. They have P.E. on Wednesdays.", "D. They have no classes."],
        "answer": "A",
        "analysis": "【考点】考查听辨课程安排。\n【解题思路】对话明确说 We have art class on Wednesdays，星期三有美术课。\n【总结】注意听清楚星期几对应什么课程。",
    },
    "en_listen_008": {
        "options": ["A. Three people", "B. Four people", "C. Five people", "D. Six people"],
        "answer": "B",
        "analysis": "【考点】考查听辨数字和家庭人数。\n【解题思路】录音说 four people: my parents, my sister and me，共4口人。\n【总结】数家庭成员时要包括说话人自己。",
    },
    "en_listen_013": {
        "options": ["A. Yes, she can swim very well.", "B. No, she cannot swim.", "C. She can only swim a little.", "D. She used to swim but not now."],
        "answer": "A",
        "analysis": "【考点】考查 can 能力表达。\n【解题思路】Lily 回答 Yes, I can. I can swim very well.\n【总结】can 开头的一般疑问句，肯定回答是 Yes, I can.",
    },
    "en_listen_018": {
        "options": ["A. Because she was ill.", "B. Because it was Sunday.", "C. Because the alarm did not ring.", "D. Because she stayed up late."],
        "answer": "B",
        "analysis": "【考点】考查原因状语从句。\n【解题思路】原文 because it is Sunday，周日可以晚起。\n【总结】because 后面紧跟的就是原因。",
    },
    "en_listen_023": {
        "options": ["A. Spring", "B. Summer", "C. Autumn", "D. Winter"],
        "answer": "D",
        "analysis": "【考点】考查季节偏好。\n【解题思路】Amy 说 I like winter best because I can make a snowman.\n【总结】like ... best = 最喜欢，后面跟的是答案。",
    },
    "en_listen_028": {
        "options": ["A. Yes, open all day including weekends.", "B. No, only on weekdays (9am-5pm).", "C. Only on Saturday mornings.", "D. Only on Sunday afternoons."],
        "答案": "B",
        "analysis": "【考点】考查开放时间。\n【解题思路】原文 open from 9 to 5 on weekdays，仅工作日开放。\n【总结】weekdays = 工作日（周一到周五），不含周末。",
    },
    "en_listen_033": {
        "options": ["A. 6:30", "B. 7:00", "C. 7:30", "D. 8:00"],
        "answer": "D",
        "analysis": "【考点】考查时间信息对比。\n【解题思路】平时 get up at 6:30，但 on weekends I get up at 8:00。\n【总结】注意区分平日和周末的不同时间。",
    },
    "en_listen_038": {
        "options": ["A. Yes, you can go boating.", "B. No, the river is too small.", "C. Only in summer months.", "D. Boating is not allowed."],
        "answer": "A",
        "analysis": "【考点】考查活动设施。\n【解题思路】原文 There is a river. You can go boating on it.\n【总结】can go boating = 可以划船。",
    },
    "en_listen_043": {
        "options": ["A. Yes, he plays piano very well.", "B. No, he plays guitar instead.", "C. He is learning piano.", "D. He used to play piano."],
        "answer": "B",
        "analysis": "【考点】考查否定+转折。\n【解题思路】回答 No, I can't. But I can play the guitar.\n【总结】No, ... But ... 表示否定后接转折补充。",
    },
    "en_listen_048": {
        "options": ["A. Sarah is taller than her sister.", "B. Sarah is shorter than her sister.", "C. They are the same height.", "D. Sarah is 1.70 meters tall."],
        "answer": "B",
        "analysis": "【考点】考查比较级。\n【解题思路】Sarah is shorter than her sister. Sister 1.6m, Sarah 1.55m.\n【总结】shorter than = 比...矮；注意数字大小比较。",
    },
}

# ====== questions_en_j2_listen.json 的 10 道修复 ======
fixes_j2 = {
    "en_j2_listen_031": {
        "options": ["A. North China", "B. South China", "C. East China", "D. West China"],
        "answer": "B",
        "analysis": "【考点】考查地理方位词。\n【解题思路】原文 I live in a small town in the south of China.\n【总结】south of China = 中国南方。",
    },
    "en_j2_listen_032": {
        "options": ["A. Spring", "B. Summer", "C. Autumn", "D. Winter"],
        "answer": "C",
        "analysis": "【考点】考查最喜欢的季节。\n【解题思路】I like autumn best because it's cool and the leaves are beautiful.\n【总结】like ... best = 最喜欢。",
    },
    "en_j2_listen_033": {
        "options": ["A. 10 years old", "B. 11 years old", "C. 12 years old", "D. 13 years old"],
        "answer": "C",
        "analysis": "【考点】考查数字计算推理。\n【解题思路】李明14岁，妹妹 two years younger = 14 - 2 = 12岁。\n【总结】younger than = 比...小，需用减法计算。",
    },
    "en_j2_listen_034": {
        "options": ["A. Yesterday morning", "B. Last Saturday afternoon", "C. This Sunday morning", "D. Tomorrow evening"],
        "answer": "B",
        "analysis": "【考点】考查时间状语辨析。\n【解题思路】根据短文时间线索推断 Tom 去公园的具体时间。\n【总结】注意 yesterday/last week/tomorrow 等时间词的区别。",
    },
    "en_j2_listen_035": {
        "options": ["A. One hour", "B. Two hours", "C. Three hours", "D. Half an hour"],
        "answer": "B",
        "analysis": "【考点】考查时间段表达。\n【解题思路】根据短文中踢足球时长的描述判断具体时长。\n【总结】for + 时间段 表示持续多长时间。",
    },
    "en_j2_listen_036": {
        "options": ["A. Yes, walking is the most popular way.", "B. No, biking is more popular than walking.", "C. Taking the bus is most popular.", "D. Nobody walks to school."],
        "answer": "B",
        "analysis": "【考点】考查最高级和比较级。\n【解题思路】根据各方式的数据对比判断步行是否最受欢迎。\n【总结】most popular = 最受欢迎，需比较所有选项数据。",
    },
    "en_j2_listen_037": {
        "options": ["A. Because it is fast and convenient.", "B. Because they live far from school.", "C. Because they don't like walking.", "D. Because bikes are cheap and cool."],
        "answer": "A",
        "analysis": "【考点】考查原因状语从句。\n【解题思路】原文说明了学生选择骑车上学的原因。\n【总结】because 引导的原因状语从句直接给出答案。",
    },
    "en_j2_listen_038": {
        "options": ["A. One activity at most", "B. Two activities at most", "C. Three activities at most", "D. No limit"],
        "answer": "B",
        "analysis": "【考点】考查数量限制。\n【解题思路】原文有参加活动数量的限制规则。\n【总结】at most / maximum = 最多，注意数量限定词。",
    },
    "en_j2_listen_039": {
        "options": ["A. On the school playground", "B. At the city stadium", "C. In the sports center", "D. At the park field"],
        "answer": "A",
        "analysis": "【考点】考查地点状语。\n【解题思路】原文指明了运动会举办地点。\n【总结】地点通常由 at / in / on + 地点名词构成。",
    },
    "en_j2_listen_040": {
        "options": ["A. Yes, they live only in Sichuan Province.", "B. No, they also live in other provinces.", "C. They live only in zoos now.", "D. They live in many countries worldwide."],
        "answer": "B",
        "analysis": "【考点】考查范围限定词 only。\n【解题思路】原文提到熊猫分布不止四川一地。\n【总结】only 表示仅仅，如果原文提到其他地区则选否。",
    },
}

# 发现 en_listen_028 有个 typo：写了"答案"而不是"answer"
fixes_listen["en_listen_028"]["answer"] = "B"

print("=" * 50)
print("修复 questions_en_listen.json")
print("=" * 50)
fix_file("src/data/questions_en_listen.json", fixes_listen)

print("=" * 50)
print("修复 questions_en_j2_listen.json")
print("=" * 50)
fix_file("src/data/questions_en_j2_listen.json", fixes_j2)

print("🎉 全部完成！共修复 20 道听力题的 T/F 选项问题。")
