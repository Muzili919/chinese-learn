#!/usr/bin/env python3
"""第二轮审查修复：o067/o073/o063/o089/o079"""
import json

with open('src/data/questions_math_olympiad_addon.json', 'r') as f:
    data = json.load(f)

qmap = {q['id']: i for i,q in enumerate(data)}

# ========== Fix o067: 答案选反了！上路18min最快，应选B ==========
idx = qmap['math_o067']
# 上路: 18/60=0.3h=18min(最快), 中路: 15/40=22.5min, 下路: 21/50=25.2min
data[idx]['answer'] = 'B. 18分钟'
data[idx]['analysis'] = '分别计算：上路18÷60=0.3h=18分钟；中路15÷40=0.375h=22.5分；下路21÷50=0.42h=25.2分。最小值18分钟走上路。【要点】路程短不一定快，需综合距离和速度判断。'
print('✅ o067 fixed: B(18分钟)，原错选D')

# ========== Fix o073: 原数据算不出选项 → 换经典中线折半模型 ==========
idx = qmap['math_o073']
data[idx] = {
    "id": "math_o073",
    "type": "single_choice",
    "question": "△ABC中，D是BC中点，E是AD中点。若△ABC面积48cm²，求△ABE面积。",
    "options": ["A. 8cm²", "B. 12cm²", "C. 16cm²", "D. 24cm²"],
    "answer": "B. 12cm²",
    "analysis": "【中线折半模型】D是BC中点→AD是中线→S△ABD=S△ACD=½S△ABC=24cm²。E是AD中点→BE将△ABD分成面积相等的两部分（等底AE=ED，共用顶点B）→S△ABE=½S△ABD=12cm²。【关键】连续两次对半：1/2×1/2=1/4→12=48/4✓。",
    "knowledge_tag": "面积模型",
    "topic": "奥数专题",
    "difficulty": 2,
    "grade": 5
}
print('✅ o073 fixed: 经典中线折半模型, answer=B(12cm²)')

# ========== Fix o063: 圆桌多解 → 改为唯一解真假话推理 ==========
idx = qmap['math_o063']
data[idx] = {
    "id": "math_o063",
    "type": "single_choice",
    "question": "四个小孩中只有一人打碎花瓶。甲说：不是我。乙说：是丙。丙说：是丁。丁说：丙冤枉我(即我没打)。已知仅一人说真话。谁打碎的？",
    "options": ["A. 甲", "B. 乙", "C. 丙", "D. 丁"],
    "answer": "A. 甲",
    "analysis": "【穷举法】假设甲真(非甲)→乙假(非丙)→丙假(非丁)→丁真(确实没打)=两人真矛盾✗。假设甲假(就是甲打的)：甲谎(说没打)✓、乙假(指丙实际没打)✓、丙假(指丁实际没打)✓、丁真(说没打是真)→仅丁一人真话✓自洽！故甲打碎的。【速记】只有一人真时，找谁说的话不牵连别人——丁只为自己辩护。",
    "knowledge_tag": "逻辑推理",
    "topic": "奥数专题",
    "difficulty": 3,
    "grade": 6
}
print('✅ o063 fixed: 改为唯一解真假话推理, answer=A(甲)')

# ========== Fix o089: 题目80%/50%但解析用40%/10% ==========
idx = qmap['math_o089']
data[idx]['analysis'] = '溶质守恒：酒精总量=200×80%+300×50%=160+150=310g。总质量=500g。混合浓度=310÷500=62%。【十字交叉法】80%与50%交叉：62%-50%=12, 80%-62%=18→比例12:18=2:3。(200:300=2:3✓)'
print('✅ o089 fixed: 解析改为匹配题目80%/50%数据')

# ========== Fix o079: 与o078高度相似 → 改为不同参数牛吃草 ==========
idx = qmap['math_o079']
data[idx] = {
    "id": "math_o079",
    "type": "single_choice",
    "question": "牧场草每天匀速生长。10头牛20天吃完，15头牛10天吃完。30头牛几天吃完？",
    "options": ["A. 3天", "B. 4天", "C. 5天", "D. 吃不完"],
    "answer": "B. 4天",
    "analysis": "【牛顿牧场问题】设原有草G，日生长g，每牛每天吃1单位。方程组：G+20g=10×20=200...(①) G+10g=15×10=150...(②) ①-②得：10g=50→g=5单位/天。代入①：G=200-100=100单位。30头牛每天净消耗30-5=25单位。天数=100÷25=4天。【本质】牛越多天数越少但非线性（草持续生长）。当牛数≤日生长量(g=5)时永远吃不完。",
    "knowledge_tag": "牛吃草",
    "topic": "奥数专题",
    "difficulty": 4,
    "grade": 6
}
print('✅ o079 fixed: 改为10牛20天/15牛10天→30牛4天')

# 保存
with open('src/data/questions_math_olympiad_addon.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print('\n========== 全部修复已保存 ==========')
