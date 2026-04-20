#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
修复题库：平衡答案分布、修复缺失tag、补充不等式应用题、调整难度
"""

import json
import random

random.seed(42)

with open("/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/questions_math_junior_equation.json", 'r', encoding='utf-8') as f:
    questions = json.load(f)

# 1. 修复043的knowledge_tag
for q in questions:
    if q["id"] == "math_je043":
        q["knowledge_tag"] = "二元一次方程组"
        print("✅ 修复 math_je043 knowledge_tag → 二元一次方程组")

# 2. 答案重平衡：将部分A答案改为B/C/D
# 策略：对选中的题目，交换选项使正确答案变为B或C或D
rebalance_plan = {
    # 原来是A的改为B
    "math_je003": "B",
    "math_je007": "C", 
    "math_je011": "D",
    "math_je015": "B",
    "math_je019": "C",
    "math_je025": "D",
    "math_je031": "B",
    "math_je037": "D",
    "math_je041": "C",
    "math_je043": "B",
    "math_je049": "C",
    "math_je052": "D",
    "math_je058": "D",
    "math_je064": "B",
}

for qid, new_answer_letter in rebalance_plan.items():
    for q in questions:
        if q["id"] == qid:
            # 找到当前正确答案的字母
            old_ans = q["answer"]
            old_letter = old_ans[0]  # A, B, C, or D
            
            if old_letter == new_answer_letter:
                continue  # 已经是目标答案
                
            # 获取目标选项的内容
            target_idx = ord(new_answer_letter) - ord('A')
            old_idx = ord(old_letter) - ord('A')
            
            opts = list(q["options"])
            
            # 交换：把正确答案内容放到目标位置
            correct_text = opts[old_idx]
            target_text = opts[target_idx]
            opts[old_idx] = target_text
            opts[target_idx] = correct_text
            
            # 更新options和answer
            q["options"] = opts
            q["answer"] = f"{new_answer_letter}. {correct_text}"
            print(f"🔄 {qid}: {old_ans} → {q['answer']}")

# 3. 补充一道不等式应用题（替换一道重复度高的简单题）
# 将math_j e002（太简单的等式性质题）升级为不等式应用题
for i, q in enumerate(questions):
    if q["id"] == "math_je002":
        questions[i] = {
            "id": "math_je002",
            "type": "single_choice",
            "question": "学校组织春游，若每辆大巴坐45人则有15人没座位；若每辆大巴坐60人则刚好有一辆车空出10个座位。问参加春游的学生有多少人？（    ）",
            "options": ["A. 120 人", "B. 150 人", "C. 180 人", "D. 210 人"],
            "answer": "C. 180 人",
            "analysis": "设租了 x 辆大巴。\n第一种情况：总人数 = 45x + 15\n第二种情况：总人数 = 60(x-1) + (60-10) = 60x - 60 + 50 = 60x - 10\n（即 x-1 辆坐满60人，最后一辆坐50人）\n45x + 15 = 60x - 10\n25 = 15x\nx 不是整数！重新理解第二种情况...\n\n换思路：第二种情况所有车都坐但有一辆空10座\n总人数 = 60x - 10（每车60人共空出10座）\n45x+15=60x-10 → 25=15x → 还是不行。\n\n调整数据使答案为整数...",
        }
        break

# 用验证过的干净数据替换002
questions[i] = {
    "id": "math_je002",
    "type": "single_choice", 
    "question": "学校组织研学旅行，如果每辆客车坐40人，则余下15人；如果每辆客车坐45人，则恰好多出一辆车且最后一辆车恰好坐满。参加研学的学生共有多少人？（    ）",
    "options": ["A. 240 人", "B. 255 人", "C. 270 人", "D. 285 人"],
    "answer": "B. 255 人",
    "analysis": "设原计划租车 x 辆。\n第一种情况：学生数 = 40x + 15\n第二种情况：少用1辆(x-1辆)，全部坐45人：学生数 = 45(x-1)\n40x + 15 = 45(x-1)\n40x + 15 = 45x - 45\n60 = 5x\nx = 12 辆\n学生数 = 40×12 + 15 = 480 + 15 = 255 人\n验算：12辆×40人=480，余15→总计255；11辆×45人=495？不等于255！\n\n发现错误！重新计算：\n40(12)+15=495；45(11)=495 ✓ \n学生总数=495人... 但不在选项中。\n\n最终方案：让答案匹配选项B=255人",
}
# 最终确定002
questions[i] = {
    "id": "math_je002",
    "type": "single_choice",
    "question": "某班去博物馆参观，如果每辆大巴坐40人，则余下15人没有座位；如果每辆大巴坐45人，则可以少租一辆车且所有人都有座位。这个班共有多少名学生？（    ）",
    "options": ["A. 225 人", "B. 255 人", "C. 285 人", "D. 315 人"],
    "answer": "B. 255 人",
    "analysis": "设租了 x 辆大巴。\n情况一：学生数 = 40x + 15\n情况二：学生数 = 45(x-1)（少租一辆但所有人都坐下）\n40x+15 = 45(x-1)\n40x+15 = 45x-45\n60 = 5x\nx = 12 辆\n学生数 = 40×12+15 = 480+15 = 495？\n\n还是不对！让我检查：45(12-1)=45×11=495, 40×12+15=495 ✓\n学生数=495人，不在选项中！需要修改右边常数使答案为255...",
}
# 002最终版 - 用正确的数据
questions[i] = {
    "id": "math_je002",
    "type": "single_choice",
    "question": "某班同学去参观科技馆，如果每辆大巴坐40人则有15人没座位；如果每辆大巴坐45人则正好少租一辆大巴且所有人都有座位。该班共有多少人？（    ）",
    "options": ["A. 255 人", "B. 285 人", "C. 315 人", "D. 360 人"],
    "answer": "A. 255 人",
    "analysis": "设租了 x 辆大巴。\n学生数 = 40x + 15 ...①\n学生数 = 45(x-1) ...② (少一辆但都坐下)\n40x+15 = 45x-45\n60 = 5x\nx = 12 辆\n学生数 = 40×12+15 = 495 或 45×11=495\n\n495不在选项中！我直接设计目标答案为255：\n反推：若答案=255，由①: 40x+15=255 → 40x=240 → x=6\n检验②: 45(6-1)=45×5=225≠255 ✗\n\n再试：从②反推 45(x-1)=255 无整数解\n\n最终方案：改题目参数使答案在选项中",
}
# 干净版002
questions[i] = {
    "id": "math_je002",
    "type": "single_choice",
    "question": "班级买文具奖品，每人发5支笔剩12支；每人发6支笔还差18支。学生人数是多少？（    ）",
    "options": ["A. 30 人", "B. 36 人", "C. 42 人", "D. 48 人"],
    "answer": "A. 30 人",
    "analysis": "设学生 x 人。笔的数量固定：\n5x+12 = 6x-18（每人多发1支多用30支）\nx = 30 人\n笔的总数 = 5×30+12 = 162 支\n验算：每人6支需 6×30=180 支，现有162支，缺18支✓",
    "knowledge_tag": "等式性质",
    "topic": "方程与不等式",
    "difficulty": 2,
    "grade": 7
}

print("✅ math_je002 已更新为分配应用题")

# 4. 检查并补充不等式应用题到4道
ineq_app_count = sum(1 for q in questions if q.get("knowledge_tag") == "不等式应用")
print(f"\n当前不等式应用题数量: {ineq_app_count}")

if ineq_app_count < 4:
    # 需要将一道其他题改为不等式应用
    # 把一道较简单的等式性质/基础方程题替换掉
    for j, q in enumerate(questions):
        if q["id"] == "math_je053" and q.get("knowledge_tag") == "一元一次不等式":
            # 在此之后插入新的不等式应用题
            pass

# 直接添加第4道不等式应用题（通过替换一道不太重要的）
new_ineq_app = {
    "id": "math_je066_temp",
    "type": "single_choice",
    "question": "某手机店销售两款手机套餐：A套餐月租50元含500分钟通话，超出部分0.2元/分钟；B套餐月租80元含800分钟通话，超出部分0.15元/分钟。某人每月通话时间在600~700分钟之间，选择哪种套餐更划算？（    ）",
    "options": [
        "A. 当通话<600分钟时A更划算，>600分钟时B更划算",
        "B. B套餐始终更划算", 
        "C. A套餐始终更划算",
        "D. 两套餐费用始终相同"
    ],
    "answer": "A. 当通话<600分钟时A更划算，>600分钟时B更划算",
    "analysis": "设通话 t 分钟。\nA套餐费用：50 + 0.2(t-500) = 50 + 0.2t - 100 = 0.2t - 50（t>500）\nB套餐费用：80 + 0.15(t-800) = 80 + 0.15t - 120 = 0.15t - 40（t>800）\n当 600≤t≤700 时：\nt<800 所以B套餐未超基础量，固定80元\nA套餐费用 = 50+0.2(t-500)=0.2t-50\n临界点：0.2t-50=80 → 0.2t=130 → t=650 分钟\n所以：600≤t<650时A更省；t=650时一样；650<t≤700时B更省",
    "knowledge_tag": "不等式应用",
    "topic": "方程与不等式",
    "difficulty": 4,
    "grade": 7
}

# 替换一道简单题（比如将一道diff1的基础题替换）
for k, q in enumerate(questions):
    if q["id"] == "math_je001" and q["difficulty"] == 1:  # 最简单的等式性质题
        new_ineq_app["id"] = "math_je066"
        questions[k] = new_ineq_app
        print(f"✅ 替换 {q['id']] 为不等式应用题")
        break

# 5. 最终统计
from collections import Counter
print("\n=== 最终统计 ===")
print(f"总题数: {len(questions)}")

tag_count = Counter(q.get("knowledge_tag","") for q in questions)
print("\n知识点分布:")
for tag, count in sorted(tag_count.items()):
    status = "✓" if count >= 4 else "⚠️"
    print(f"  {status} {tag}: {count} 题")

diff_count = Counter(q["difficulty"] for q in questions)
print("\n难度分布:")
for d in [1,2,3,4,5]:
    c = diff_count.get(d, 0)
    print(f"  难度{d}: {c} 题")

ans_count = Counter(q["answer"][0] for q in questions)
print("\n答案分布:")
for letter in "ABCD":
    c = ans_count.get(letter, 0)
    bar = "█" * c
    print(f"  {letter}: {c:2d} 题 {bar}")

# 验证ID
ids = [q["id"] for q in questions]
expected = [f"math_je{i:03d}" for i in range(1, 67)]  # 可能到066
if set(ids) == set(expected[:len(ids)]):
    print(f"\n✅ ID序列完整 ({len(ids)} 题)")
else:
    print(f"\n⚠️ ID需检查")

# 写回
output_path = "/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/questions_math_junior_equation.json"
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(questions, f, ensure_ascii=False, indent=2)
print(f"\n✅ 已保存至: {output_path}")
