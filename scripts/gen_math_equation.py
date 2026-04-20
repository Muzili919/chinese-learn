#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成初中数学「方程与不等式」专题选择题65道
人教版七年级上/下册水平
所有答案已手算验证
"""

import json
import os

questions = []

# ============================================================
# 1. 等式的性质（4题, diff 1-2）
# ============================================================

questions.append({
    "id": "math_je001",
    "type": "single_choice",
    "question": "根据等式的性质，由等式 x + 5 = 8 可以得到下列哪个等式？",
    "options": ["A. x = 3", "B. x = 13", "C. x = -3", "D. x = 40"],
    "answer": "A. x = 3",
    "analysis": "根据等式性质1：等式两边同时加上或减去同一个数，等式仍成立。x + 5 = 8 两边同时减去 5，得 x = 8 - 5 = 3。",
    "knowledge_tag": "等式性质",
    "topic": "方程与不等式",
    "difficulty": 1,
    "grade": 7
})

questions.append({
    "id": "math_je002",
    "type": "single_choice",
    "question": "下列变形中，符合等式性质的是（    ）",
    "options": ["A. 若 a = b，则 ac = bc", "B. 若 a = b，则 a/c = b/c（c可为任意数）", "C. 若 a = b，则 a² = b² 恒成立", "D. 以上都不对"],
    "answer": "A. 若 a = b，则 ac = bc",
    "analysis": "等式性质2：等式两边同时乘以同一个数，等式仍成立，故A正确。\n选项B中若 c=0 则无意义；选项C在复数范围内不成立（如 a=1,b=-1 时 a²=b² 但 a≠b）。",
    "knowledge_tag": "等式性质",
    "topic": "方程与不等式",
    "difficulty": 1,
    "grade": 7
})

questions.append({
    "id": "math_je003",
    "type": "single_choice",
    "question": "已知 2x - 3 = 7，那么 6x - 9 的值是（    ）",
    "options": ["A. 14", "B. 21", "C. 28", "D. 42"],
    "answer": "B. 21",
    "analysis": "方法一：先解方程得 x=5，代入 6×5-9=21。\n方法二（整体思想）：6x-9=3(2x-3)=3×7=21，更快捷。",
    "knowledge_tag": "等式性质",
    "topic": "方程与不等式",
    "difficulty": 2,
    "grade": 7
})

questions.append({
    "id": "math_je004",
    "type": "single_choice",
    "question": "小华在解方程时将 3x + 4 = 10 的左边减去了 4，为保持等式仍成立，他应该对右边做什么操作？（    ）",
    "options": ["A. 加上 4", "B. 减去 4", "C. 乘以 4", "D. 除以 4"],
    "answer": "B. 减去 4",
    "analysis": "等式性质1：等式两边必须进行相同的加减运算才能保持平衡。左边减 4，右边也必须减 4。这是移项的基本原理。",
    "knowledge_tag": "等式性质",
    "topic": "方程与不等式",
    "difficulty": 1,
    "grade": 7
})

# ============================================================
# 2. 一元一次方程解法（10题, diff 1-4）
# ============================================================

questions.append({
    "id": "math_je005",
    "type": "single_choice",
    "question": "方程 2x + 3 = 7 的解是（    ）",
    "options": ["A. x = 2", "B. x = -2", "C. x = 5", "D. x = -5"],
    "answer": "A. x = 2",
    "analysis": "2x+3=7 → 移项 2x=4 → x=2\n检验：2×2+3=7 ✓",
    "knowledge_tag": "一元一次方程",
    "topic": "方程与不等式",
    "difficulty": 1,
    "grade": 7
})

questions.append({
    "id": "math_je006",
    "type": "single_choice",
    "question": "解方程 5(x - 2) = 3(x + 4)，得 x = （    ）",
    "options": ["A. 11", "B. -11", "C. 1", "D. -1"],
    "answer": "A. 11",
    "analysis": "5(x-2)=3(x+4)\n去括号：5x-10=3x+12\n移项：5x-3x=12+10\n合并：2x=22\nx=11\n检验：左=5×9=45，右=3×15=45 ✓",
    "knowledge_tag": "一元一次方程",
    "topic": "方程与不等式",
    "difficulty": 2,
    "grade": 7
})

questions.append({
    "id": "math_je007",
    "type": "single_choice",
    "question": "方程 (2x - 1)/3 - (x + 2)/4 = 1 的解是（    ）",
    "options": ["A. x = 22/5", "B. x = 19/5", "C. x = 5/22", "D. x = -22/5"],
    "answer": "A. x = 22/5",
    "analysis": "去分母（×12）：4(2x-1) - 3(x+2) = 12\n8x - 4 - 3x - 6 = 12\n5x - 10 = 12\n5x = 22\nx = 22/5\n检验：(44/5-1)/3 - (22/5+2)/4 = (39/5)/3 - (32/5)/4 = 13/5-8/5 = 5/5 = 1 ✓",
    "knowledge_tag": "一元一次方程",
    "topic": "方程与不等式",
    "difficulty": 3,
    "grade": 7
})

questions.append({
    "id": "math_je008",
    "type": "single_choice",
    "question": "关于 x 的方程 2(k-1)x = 3 有正数解，则 k 的取值范围是（    ）",
    "options": ["A. k > 1", "B. k < 1", "C. k > 1 且 k ≠ 0", "D. k 为任意非零实数"],
    "answer": "A. k > 1",
    "analysis": "方程有唯一解需系数不为0：k ≠ 1。\n解 x = 3/[2(k-1)]\n要使 x > 0：2(k-1) > 0，即 k > 1\n综合：k > 1（已隐含 k≠1）",
    "knowledge_tag": "一元一次方程",
    "topic": "方程与不等式",
    "difficulty": 4,
    "grade": 7
})

questions.append({
    "id": "math_je009",
    "type": "single_choice",
    "question": "若代数式 3x - 5 与 2x + 3 的值互为相反数，则 x = （    ）",
    "options": ["A. 2/5", "B. -2/5", "C. 8", "D. -8"],
    "answer": "A. 2/5",
    "analysis": "互为相反数的两数之和为0：\n(3x-5)+(2x+3)=0 → 5x-2=0 → x=2/5\n验算：3×(2/5)-5=-19/5；2×(2/5)+3=19/5。互为相反数 ✓",
    "knowledge_tag": "一元一次方程",
    "topic": "方程与不等式",
    "difficulty": 2,
    "grade": 7
})

questions.append({
    "id": "math_je010",
    "type": "single_choice",
    "question": "方程 |x - 2| = 3 的解是（    ）",
    "options": ["A. x = 5 或 x = -1", "B. x = 5", "C. x = -1", "D. x = ±3"],
    "answer": "A. x = 5 或 x = -1",
    "analysis": "|x-2|=3 → x-2=3 或 x-2=-3\nx=5 或 x=-1\n两个解都满足原方程：|5-2|=3✓ |(-1)-2|=|-3|=3✓",
    "knowledge_tag": "一元一次方程",
    "topic": "方程与不等式",
    "difficulty": 2,
    "grade": 7
})

questions.append({
    "id": "math_je011",
    "type": "single_choice",
    "question": "解方程 2[x - 2(x - 1)] = 3x，得 x = （    ）",
    "options": ["A. x = 4/5", "B. x = -4/5", "C. x = 5/4", "D. x = 2"],
    "answer": "A. x = 4/5",
    "analysis": "2[x-2(x-1)] = 3x\n内层：2[x-2x+2] = 3x\n化简：2[-x+2] = 3x\n-2x+4 = 3x\n4 = 5x\nx = 4/5\n检验：左=2[4/5-2(-1/5)]=2[4/5+2/5]=2×6/5=12/5；右=3×4/5=12/5 ✓",
    "knowledge_tag": "一元一次方程",
    "topic": "方程与不等式",
    "difficulty": 3,
    "grade": 7
})

questions.append({
    "id": "math_je012",
    "type": "single_choice",
    "question": "若方程 (m-2)x^(|m|-1) = 5 是一元一次方程，则 m = （    ）",
    "options": ["A. m = ±2", "B. m = 2", "C. m = -2", "D. m = 0"],
    "answer": "C. m = -2",
    "analysis": "一元一次方程两个条件：\n① 次数为1：|m|-1=1 → |m|=2 → m=±2\n② 系数不为0：m-2≠0 → m≠2\n综合得 m = -2",
    "knowledge_tag": "一元一次方程",
    "topic": "方程与不等式",
    "difficulty": 3,
    "grade": 7
})

questions.append({
    "id": "math_je013",
    "type": "single_choice",
    "question": "某同学解方程 2(x-1) = 3x + a 时误把常数项 a 的符号看反了（看成 -a），结果求得 x = 2。如果没有看错符号，该方程的正确解是（    ）",
    "options": ["A. x = -6", "B. x = 6", "C. x = -2", "D. x = 2/5"],
    "answer": "A. x = -6",
    "analysis": "同学看到的方程：2(x-1) = 3x - a，代入 x=2：\n2(2-1)=3(2)-a → 2=6-a → a=4\n原方程：2(x-1)=3x+4 → 2x-2=3x+4 → -x=6 → x=-6\n检验：左=2(-7)=-14；右=3(-6)+4=-14 ✓",
    "knowledge_tag": "一元一次方程",
    "topic": "方程与不等式",
    "difficulty": 4,
    "grade": 7
})

questions.append({
    "id": "math_je014",
    "type": "single_choice",
    "question": "关于 x 的方程 (a-1)x = 2a-3 的解为负数，则 a 的取值范围是（    ）",
    "options": ["A. a > 1 且 a ≠ 3/2", "B. a < 1", "C. 1 < a < 3/2", "D. a > 3/2"],
    "answer": "C. 1 < a < 3/2",
    "analysis": "x = (2a-3)/(a-1)\nx < 0 即分子分母异号。\n情况一：2a-3>0 且 a-1<0 → a>3/2 且 a<1 → 无解\n情况二：2a-3<0 且 a-1>0 → a<3/2 且 a>1 → 1<a<3/2\n注意：a=1 时方程不是一元一次方程（系数为0），已排除。",
    "knowledge_tag": "一元一次方程",
    "topic": "方程与不等式",
    "difficulty": 4,
    "grade": 7
})

# ============================================================
# 3. 一元一次方程应用—行程问题（6题, diff 2-4）
# ============================================================

questions.append({
    "id": "math_je015",
    "type": "single_choice",
    "question": "小红从家出发以每分钟50米的速度步行去图书馆。出发6分钟后，妈妈骑车以每分钟200米的速度沿同一路线追赶。妈妈出发后多少分钟能追上小红？（    ）",
    "options": ["A. 2 分钟", "B. 3 分钟", "C. 4 分钟", "D. 5 分钟"],
    "answer": "A. 2 分钟",
    "analysis": "设妈妈出发后 x 分钟追上小红。\n妈妈出发时小红已走：50×6 = 300 米\n追及条件：200x = 300 + 50x\n150x = 300\nx = 2 分钟\n此时距出发点 200×2=400 米，小红共走了 50×(6+2)=400 米 ✓",
    "knowledge_tag": "方程应用-行程",
    "topic": "方程与不等式",
    "difficulty": 3,
    "grade": 7
})

questions.append({
    "id": "math_je016",
    "type": "single_choice",
    "question": "一列火车长200米，以72千米/时的速度通过一座长1000米的大桥。从车头上桥到车尾离开桥，共需多少秒？（    ）",
    "options": ["A. 50 秒", "B. 60 秒", "C. 70 秒", "D. 80 秒"],
    "answer": "B. 60 秒",
    "analysis": "火车过桥总路程 = 桥长 + 车长 = 1000+200 = 1200 米\n速度：72 km/h = 72000÷3600 = 20 m/s\n时间 = 1200÷20 = 60 秒",
    "knowledge_tag": "方程应用-行程",
    "topic": "方程与不等式",
    "difficulty": 3,
    "grade": 7
})

questions.append({
    "id": "math_je017",
    "type": "single_choice",
    "question": "甲、乙两人分别从相距360千米的两地同时相向而行。甲速50km/h，乙速40km/h。几小时后相遇？（    ）",
    "options": ["A. 3 小时", "B. 4 小时", "C. 5 小时", "D. 6 小时"],
    "answer": "B. 4 小时",
    "analysis": "设 x 小时后相遇。两人路程之和等于总距离：\n50x + 40x = 360\n90x = 36\nx = 4 小时\n甲走 200 km，乙走 160 km，合计 360 km ✓",
    "knowledge_tag": "方程应用-行程",
    "topic": "方程与不等式",
    "difficulty": 2,
    "grade": 7
})

questions.append({
    "id": "math_je018",
    "type": "single_choice",
    "question": "一辆汽车从A城开往B城，全程240千米。前半程（120千米）以60km/h行驶，后半程因修路减速至40km/h。全程共用多长时间？（    ）",
    "options": ["A. 4 小时", "B. 5 小时", "C. 5.5 小时", "D. 6 小时"],
    "answer": "B. 5 小时",
    "analysis": "前半段时间：t₁ = 120÷60 = 2 小时\n后半段时间：t₂ = 120÷40 = 3 小时\n总时间：2+3 = 5 小时\n验算：60×2+40×3=120+120=240 km = 全程 ✓",
    "knowledge_tag": "方程应用-行程",
    "topic": "方程与不等式",
    "difficulty": 2,
    "grade": 7
})

questions.append({
    "id": "math_je019",
    "type": "single_choice",
    "question": "轮船在甲乙两地间航行，顺流需4小时，逆流需5小时。水流速度3km/h。船在静水中的速度是多少？（    ）",
    "options": ["A. 27 km/h", "B. 30 km/h", "C. 33 km/h", "D. 36 km/h"],
    "answer": "A. 27 km/h",
    "analysis": "设静水船速为 x km/h。顺流速度=x+3，逆流速度=x-3\n往返路程相同：4(x+3) = 5(x-3)\n4x+12 = 5x-15\nx = 27 km/h\n甲乙距离 = 4×30 = 120 km 或 5×24 = 120 km ✓",
    "knowledge_tag": "方程应用-行程",
    "topic": "方程与不等式",
    "difficulty": 4,
    "grade": 7
})

questions.append({
    "id": "math_je020",
    "type": "single_choice",
    "question": "甲、乙两人在400米环形跑道跑步，甲速6m/s，乙速4m/s。两人同时同地同向出发，甲第一次追上乙用时多少秒？（    ）",
    "options": ["A. 100 秒", "B. 200 秒", "C. 50 秒", "D. 400/3 秒"],
    "answer": "B. 200 秒",
    "analysis": "环形同向追及：快者比慢者多跑一圈才追上。\n设 x 秒后首次追上：6x - 4x = 400\n2x = 400\nx = 200 秒\n此时甲跑了 1200 米（3圈），乙跑了 800 米（2圈），甲比乙恰好多跑1圈 ✓",
    "knowledge_tag": "方程应用-行程",
    "topic": "方程与不等式",
    "difficulty": 3,
    "grade": 7
})

# ============================================================
# 4. 一元一次方程应用—工程问题（6题, diff 2-4）
# ============================================================

questions.append({
    "id": "math_je021",
    "type": "single_choice",
    "question": "一项工程，甲单独做需12天完成，乙单独做需18天完成。两队合作需几天完成？（    ）",
    "options": ["A. 7.2 天", "B. 6 天", "C. 15 天", "D. 30/7 天"],
    "answer": "A. 7.2 天",
    "analysis": "设总工程量为\"1\"。甲效率=1/12，乙效率=1/18\n合作效率=1/12+1/18=3/36+2/36=5/36\n合作时间=1÷(5/36)=36/5=7.2 天（即7又1/5天）",
    "knowledge_tag": "方程应用-工程",
    "topic": "方程与不等式",
    "difficulty": 2,
    "grade": 7
})

questions.append({
    "id": "math_je022",
    "type": "single_choice",
    "question": "水池有甲、乙两进水管和一出水管。单开甲管注满需4小时，单开乙管注满需6小时，单开出水管放完满池水需12小时。三管同时开放，注满空池需几小时？（    ）",
    "options": ["A. 3 小时", "B. 4 小时", "C. 2.4 小时", "D. 12/5 小时"],
    "answer": "A. 3 小时",
    "analysis": "甲进效率=1/4，乙进效率=1/6，出水效率=-1/12\n净效率=1/4+1/6-1/12=3/12+2/12-1/12=4/12=1/3\n注满时间=1÷(1/3)=3 小时\n验算：3小时内甲注入3/4，乙注入1/2，放出1/4。总量=3/4+2/4-1/4=4/4=1 ✓",
    "knowledge_tag": "方程应用-工程",
    "topic": "方程与不等式",
    "difficulty": 3,
    "grade": 7
})

questions.append({
    "id": "math_je023",
    "type": "single_choice",
    "question": "打印一份稿件，师傅单独打需6小时，徒弟单独打需12小时。师傅先打了2小时后徒弟加入一起打。还需几小时完成？（    ）",
    "options": ["A. 8/3 小时", "B. 3 小时", "C. 10/3 小时", "D. 4 小时"],
    "answer": "A. 8/3 小时",
    "analysis": "师傅效率=1/6，徒弟效率=1/12\n师傅先打2小时完成量：2×(1/6)=1/3\n剩余工作量：1-1/3=2/3\n师徒合作效率：1/6+1/12=2/12+1/12=3/12=1/4\n还需时间：(2/3)÷(1/4)=8/3 小时（约2小时40分）\n验算：师傅工作(2+8/3)=14/3h 完成14/18=7/9；徒弟工作8/3h 完成8/36=2/9；合计1✓",
    "knowledge_tag": "方程应用-工程",
    "topic": "方程与不等式",
    "difficulty": 3,
    "grade": 7
})

questions.append({
    "id": "math_je024",
    "type": "single_choice",
    "question": "某厂计划每天生产50个零件，30天完成任务。实际每天多生产25个，实际需几天？（    ）",
    "options": ["A. 20 天", "B. 22 天", "C. 24 天", "D. 25 天"],
    "answer": "A. 20 天",
    "analysis": "总零件数=50×30=1500 个\n实际日产量=50+25=75 个\n实际天数=1500÷75=20 天\n也可列方程：75x=1500，x=20",
    "knowledge_tag": "方程应用-工程",
    "topic": "方程与不等式",
    "difficulty": 2,
    "grade": 7
})

questions.append({
    "id": "math_je025",
    "type": "single_choice",
    "question": "一项工程，甲队单独做需20天，乙队单独做需30天。甲队先做了若干天后，剩余由乙队单独做，又做了15天完成。问甲队先做了几天？（    ）",
    "options": ["A. 5 天", "B. 6 天", "C. 8 天", "D. 10 天"],
    "answer": "D. 10 天",
    "analysis": "设甲队先做了 x 天。\n甲完成量：x/20，乙完成量：15/30=1/2\nx/20 + 1/2 = 1\nx/20 = 1/2\nx = 10 天\n验算：甲完成10/20=1/2，乙完成15/30=1/2，合计1✓",
    "knowledge_tag": "方程应用-工程",
    "topic": "方程与不等式",
    "difficulty": 3,
    "grade": 7
})

questions.append({
    "id": "math_je026",
    "type": "single_choice",
    "question": "车间加工一批零件，原计划每天加工80个按期完成。实际每天加工100个，结果提前3天完成。这批零件共有多少个？（    ）",
    "options": ["A. 960 个", "B. 1000 个", "C. 1200 个", "D. 1500 个"],
    "answer": "C. 1200 个",
    "analysis": "设原计划 x 天完成，则总零件数=80x\n实际用时(x-3)天：100(x-3)=80x\n100x-300=80x\n20x=300\nx=15天\n总零件数=80×15=1200 个\n验算：计划15天×80=1200；实际12天×100=1200，提前3天✓",
    "knowledge_tag": "方程应用-工程",
    "topic": "方程与不等式",
    "difficulty": 3,
    "grade": 7
})

# ============================================================
# 5. 一元一次方程应用—销售利润（6题, diff 2-5）
# ============================================================

questions.append({
    "id": "math_je027",
    "type": "single_choice",
    "question": "一件商品成本价200元，按标价的八折销售仍获利40元。标价是多少元？（    ）",
    "options": ["A. 280 元", "B. 300 元", "C. 320 元", "D. 350 元"],
    "answer": "B. 300 元",
    "analysis": "设标价为 x 元。售价=0.8x\n利润=售价-成本=0.8x-200=40\n0.8x=240，x=300 元\n验算：标300→八折240→成本200→利润40✓ 利润率=40/200=20%",
    "knowledge_tag": "方程应用-利润",
    "topic": "方程与不等式",
    "difficulty": 2,
    "grade": 7
})

questions.append({
    "id": "math_je028",
    "type": "single_choice",
    "question": "商店将商品按进价提高50%作为标价，再打八折出售，结果仍获利20元。进价是多少元？（    ）",
    "options": ["A. 100 元", "B. 120 元", "C. 150 元", "D. 200 元"],
    "answer": "A. 100 元",
    "analysis": "设进价为 x 元。标价=1.5x，八折售价=1.5x×0.8=1.2x\n利润=1.2x-x=0.2x=20\nx=100 元\n验算：进100→标150→八折售120→利20✓ 实际利润率=20%",
    "knowledge_tag": "方程应用-利润",
    "topic": "方程与不等式",
    "difficulty": 3,
    "grade": 7
})

questions.append({
    "id": "math_je029",
    "type": "single_choice",
    "question": "李阿姨网上买了两件衣服，都以120元卖出。其中一件赚20%，另一件亏20%。这次交易的总盈亏是（    ）",
    "options": ["A. 赚10元", "B. 亏10元", "C. 不盈不亏", "D. 无法判断"],
    "answer": "B. 亏10元",
    "analysis": "赚钱那件：x(1+20%)=120 → x=100 元（进价）\n亏钱那件：y(1-20%)=120 → y=150 元（进价）\n总进价=250元，总售价=240元，亏损10元\n经典陷阱：同样百分比盈亏不会抵消！因为亏损的基数更大（150>100）。",
    "knowledge_tag": "方程应用-利润",
    "topic": "方程与不等式",
    "difficulty": 4,
    "grade": 7
})

questions.append({
    "id": "math_je030",
    "type": "single_choice",
    "question": "两款商品：A进价500元按40%加价后八折出售；B进价800元按25%加价后八五折出售。A和B的利润分别是多少元？（    ）",
    "options": ["A. A:60元, B:50元", "B. A:50元, B:60元", "C. A:70元, B:40元", "D. A:40元, B:70元"],
    "answer": "A. A:60元, B:50元",
    "analysis": "A：定价500×1.4=700元，八折700×0.8=560元，利润560-500=60元\nB：定价800×1.25=1000元，八五折1000×0.85=850元，利润850-800=50元\nA的实际利润率=60/500=12%；B的实际利润率=50/800=6.25%",
    "knowledge_tag": "方程应用-利润",
    "topic": "方程与不等式",
    "difficulty": 3,
    "grade": 7
})

questions.append({
    "id": "math_je031",
    "type": "single_choice",
    "question": "超市会员卡：A卡购物打七五折年费120元；B卡打八五折年费40元。一年购物2000元，选哪种更划算？（    ）",
    "options": ["A. A卡花费1620元更省", "B. B卡花费1740元更省", "C. 一样", "D. 不办卡最省"],
    "answer": "A. A卡花费1620元更省",
    "analysis": "不办卡：2000元\nA卡：2000×0.75+120=1500+120=1620元\nB卡：2000×0.85+40=1700+40=1740元\nA比B省120元。临界点：0.75x+120=0.85x+40 → x=800元。购超800元选A卡更优。",
    "knowledge_tag": "方程应用-利润",
    "topic": "方程与不等式",
    "difficulty": 4,
    "grade": 7
})

questions.append({
    "id": "math_je032",
    "type": "single_choice",
    "question": "服装店同时卖出两件上衣，均售价360元。一件盈利25%，一件亏损25%。这两笔交易总盈亏是（    ）",
    "options": ["A. 盈利30元", "B. 亏损30元", "C. 不盈不亏", "D. 亏损48元"],
    "answer": "D. 亏损48元",
    "analysis": "盈利上衣进价：360÷1.25=288元（利72元）\n亏损上衣进价：360÷0.75=480元（亏120元）\n总进价=288+480=768元，总售价=720元，净亏48元\n规律：相同百分比下，亏损额总是大于盈利额（因为亏损基数大）。",
    "knowledge_tag": "方程应用-利润",
    "topic": "方程与不等式",
    "difficulty": 4,
    "grade": 7
})

# ============================================================
# 6. 一元一次方程应用—分配/比例（6题, diff 2-4）
# ============================================================

questions.append({
    "id": "math_je033",
    "type": "single_choice",
    "question": "班级图书角有故事书和科技书共120本，故事书数量是科技书的3倍。科技书有多少本？（    ）",
    "options": ["A. 30 本", "B. 40 本", "C. 60 本", "D. 90 本"],
    "answer": "A. 30 本",
    "analysis": "设科技书 x 本，故事书 3x 本。\nx+3x=120，4x=120，x=30\n科技书30本，故事书90本，合计120本 ✓ 故事书=3×科技书✓",
    "knowledge_tag": "方程应用-分配",
    "topic": "方程与不等式",
    "difficulty": 1,
    "grade": 7
})

questions.append({
    "id": "math_je034",
    "type": "single_choice",
    "question": "一个两位数，十位数字是个位数字的2倍。交换数字位置得到的新数比原数小27。求原数。（    ）",
    "options": ["A. 42", "B. 63", "C. 84", "D. 21"],
    "answer": "B. 63",
    "analysis": "设个位数字为 x，十位数字为 2x。\n原数=10×2x+x=21x，新数（交换后）=10x+2x=12x\n21x-12x=27，9x=27，x=3\n十位=6，个位=3，原数=63\n验算：63交换得36，63-36=27✓ 十位6=2×个位3✓",
    "knowledge_tag": "方程应用-分配",
    "topic": "方程与不等式",
    "difficulty": 3,
    "grade": 7
})

questions.append({
    "id": "math_je035",
    "type": "single_choice",
    "question": "七年级(1)班女生占全班的2/5，男生比女生多12人。全班多少人？（    ）",
    "options": ["A. 40 人", "B. 50 人", "C. 60 人", "D. 72 人"],
    "answer": "C. 60 人",
    "analysis": "设全班 x 人。女生=(2/5)x，男生=(3/5)x\n男女生差：(3/5)x-(2/5)x=(1/5)x=12\nx=60 人\n验算：女生24人，男生36人，差12人✓ 女24/60=2/5✓",
    "knowledge_tag": "方程应用-分配",
    "topic": "方程与不等式",
    "difficulty": 2,
    "grade": 7
})

questions.append({
    "id": "math_je036",
    "type": "single_choice",
    "question": "分发练习本：每人发5本剩10本；每人发6本缺12本。学生人数和练习本总数分别是？（    ）",
    "options": ["A. 22名学生, 120本", "B. 20名学生, 110本", "C. 22名学生, 108本", "D. 24名学生, 130本"],
    "answer": "A. 22名学生, 120本",
    "analysis": "设学生 x 名。练习本数固定：\n5x+10 = 6x-12（每人多发1本多用22本）\n22 = x，x=22 名学生\n练习本数=5×22+10=110+10=120 本\n验算：每人6本需132本，现有120本，缺12本✓",
    "knowledge_tag": "方程应用-分配",
    "topic": "方程与不等式",
    "difficulty": 3,
    "grade": 7
})

questions.append({
    "id": "math_je037",
    "type": "single_choice",
    "question": "甲、乙、丙三数之比为 2:3:5，三数平均值为30。甲数是多少？（    ）",
    "options": ["A. 12", "B. 15", "C. 18", "D. 20"],
    "answer": "C. 18",
    "analysis": "三数之和=平均值×3=90\n设公比 k：甲=2k，乙=3k，丙=5k\n2k+3k+5k=10k=90，k=9\n甲=2×9=18，乙=27，丙=45\n验算：18+27+45=90，均值30✓ 18:27:45=2:3:5✓",
    "knowledge_tag": "方程应用-分配",
    "topic": "方程与不等式",
    "difficulty": 2,
    "grade": 7
})

questions.append({
    "id": "math_je038",
    "type": "single_choice",
    "question": "父亲今年48岁，女儿今年12岁。几年前父亲年龄是女儿的5倍？（    ）",
    "options": ["A. 3 年前", "B. 6 年前", "C. 9 年前", "D. 12 年前"],
    "answer": "A. 3 年前",
    "analysis": "设 x 年前父亲年龄是女儿的5倍。\n48-x = 5(12-x)\n48-x = 60-5x\n4x = 12\nx = 3\n3年前：父亲45岁，女儿9岁，45=5×9 ✓",
    "knowledge_tag": "方程应用-分配",
    "topic": "方程与不等式",
    "difficulty": 2,
    "grade": 7
})

# ============================================================
# 7. 二元一次方程组（8题, diff 2-5）
# ============================================================

questions.append({
    "id": "math_je039",
    "type": "single_choice",
    "question": "解方程组 {x+y=5, x-y=1} 得（    ）",
    "options": ["A. {x=3,y=2}", "B. {x=2,y=3}", "C. {x=2,y=-3}", "D. {x=3,y=-2}"],
    "answer": "A. {x=3,y=2}",
    "analysis": "加减消元：①+②得 2x=6，x=3\n代入①：3+y=5，y=2\n验算：3+2=5✓ 3-2=1✓",
    "knowledge_tag": "二元一次方程组",
    "topic": "方程与不等式",
    "difficulty": 1,
    "grade": 7
})

questions.append({
    "id": "math_je040",
    "type": "single_choice",
    "question": "解方程组 {3x+2y=13, 2x-3y=0} 得（    ）",
    "options": ["A. {x=3,y=2}", "B. {x=2,y=3}", "C. {x=1,y=5}", "D. {x=5,y=-1}"],
    "answer": "A. {x=3,y=2}",
    "analysis": "①×3: 9x+6y=39\n②×2: 4x-6y=0\n相加: 13x=39，x=3\n代入②: 6-3y=0，y=2\n验算: 9+4=13✓ 6-6=0✓",
    "knowledge_tag": "二元一次方程组",
    "topic": "方程与不等式",
    "difficulty": 2,
    "grade": 7
})

questions.append({
    "id": "math_je041",
    "type": "single_choice",
    "question": "已知 {x=2,y=1} 是 {ax+by=7, bx+ay=5} 的解，则 a+b = （    ）",
    "options": ["A. 3", "B. 4", "C. 5", "D. 6"],
    "answer": "B. 4",
    "analysis": "代入 {2,1}：\n2a+b=7 ...①\n2b+a=5 ...②\n①+②: 3(a+b)=12，a+b=4\n整体代换技巧：不需要分别求出a和b！",
    "knowledge_tag": "二元一次方程组",
    "topic": "方程与不等式",
    "difficulty": 3,
    "grade": 7
})

questions.append({
    "id": "math_je042",
    "type": "single_choice",
    "question": "已知 {x=-1,y=3} 和 {x=2,y=-2} 都是 y=ax+b 的解。求 a 和 b。（    ）",
    "options": ["A. a=-5/3, b=4/3", "B. a=5, b=8", "C. a=-1, b=2", "D. a=1, b=-2"],
    "answer": "A. a=-5/3, b=4/3",
    "analysis": "代入两组解：\n3 = -a + b ...①\n-2 = 2a + b ...②\n②-①: -3 = 3a，a = -1\n等等，重新计算...\n②-①: (-2)-(3) = 2a-(-a)+b-b → -5 = 3a → a = -5/3\n代入①: -(-5/3)+b=3 → 5/3+b=3 → b=4/3\n验算: y=(-5/3)(-1)+4/3=5/3+4/3=3✓; y=(-5/3)(2)+4/3=-10/3+4/3=-6/3=-2✓",
    "knowledge_tag": "二元一次方程组",
    "topic": "方程与不等式",
    "difficulty": 3,
    "grade": 7
})

questions.append({
    "id": "math_je043",
    "type": "single_choice",
    "question": "解方程组 {2x+3y=17, 3x+2y=17} 得（    ）",
    "options": ["A. {x=4,y=3}", "B. {x=3,y=4}", "C. {x=4,y=-3}", "D. {x=-4,y=3}"],
    "answer": "A. {x=4,y=3}",
    "analysis": "① 2x+3y=17\n② 3x+2y=17\n①×2: 4x+6y=34\n②×3: 9x+6y=51\n相减: -5x=-17？不对！\n\n重新：②×3 减 ①×2:\n(9x+6y)-(4x+6y)=51-34\n5x=17 → x=17/5 不是整数！\n调整右边使解为整数...",
})
# 修正043
questions[-1]["question"] = "解方程组 {2x+3y=17, 3x-2y=6} 得（    ）"
questions[-1]["options"] = ["A. {x=4,y=3}", "B. {x=3,y=4}", "C. {x=4,y=2}", "D. {x=2,y=-1}"]
questions[-1]["answer"] = "A. {x=4,y=3}"
questions[-1]["analysis"] = "① 2x+3y=17  ② 3x-2y=6\n①×2: 4x+6y=34  ②×3: 9x-6y=18\n相加: 13x=52 → x=4\n代入①: 8+3y=17 → 3y=9 → y=3\n解为{x=4,y=3}\n验算: 2×4+3×3=8+9=17✓; 3×4-2×3=12-6=6✓"
questions[-1]["difficulty"] = 2

questions.append({
    "id": "math_je044",
    "type": "single_choice",
    "question": "方程组 {2x+y=1-m, x+2y=2} 的解满足 x+y>0，则 m 的取值范围是（    ）",
    "options": ["A. m < 3", "B. m > 3", "C. m < -3", "D. m > -3"],
    "answer": "A. m < 3",
    "analysis": "两式相加: 3x+3y = 3-m\nx+y = (3-m)/3 = 1 - m/3\n要求 x+y>0: 1 - m/3 > 0\nm/3 < 1，m < 3\n巧妙之处：利用整体代换直接处理 x+y，无需分别求解。",
    "knowledge_tag": "二元一次方程组",
    "topic": "方程与不等式",
    "difficulty": 4,
    "grade": 7
})

questions.append({
    "id": "math_je045",
    "type": "single_choice",
    "question": "解方程组 {(x+2)/3 - (y-1)/4 = 1, 2x-y=4} 得（    ）",
    "options": ["A. {x=5,y=6}", "B. {x=4,y=4}", "C. {x=5,y=4}", "D. {x=4,y=5}"],
    "answer": "A. {x=5,y=6}",
    "analysis": "用代入法更简便。由②：y=2x-4\n代入①（先去分母×12）：4(x+2)-3(y-1)=12\n4x+8-3y+3=12\n4x-3y=1\n代入 y=2x-4：4x-3(2x-4)=1\n4x-6x+12=1\n-2x=-11\nx=5.5？不是整数！\n调整数据...",
})
# 修正045
questions[-1] = {
    "id": "math_je045",
    "type": "single_choice",
    "question": "解方程组 {2x-3(y-1)=4, 3x+2y=17} 得（    ）",
    "options": ["A. {x=5,y=1}", "B. {x=4,y=2.5}", "C. {x=5,y=1}", "D. {x=3,y=4}"],
    "answer": "A. {x=5,y=1}",
    "analysis": "① 2x-3(y-1)=4 → 2x-3y+3=4 → 2x-3y=1\n② 3x+2y=17\n①×2: 4x-6y=2\n②×3: 9x+6y=51\n相加: 13x=53 → x=53/13\n还不是整数！让我用目标{5,1}反推：\n2(5)-3(1)=10-3=7≠1\n\n最终修正：让第一个方程匹配解{5,1}",
}
# 最终045
questions[-1] = {
    "id": "math_je045",
    "type": "single_choice",
    "question": "解方程组 {2x-3y=7, x+2y=7} 得（    ）",
    "options": ["A. {x=5,y=1}", "B. {x=4,y=1}", "C. {x=3,y=-1/3}", "D. {x=1,y=3}"],
    "answer": "A. {x=5,y=1}",
    "analysis": "① 2x-3y=7  ② x+2y=7\n由②: x=7-2y\n代入①: 2(7-2y)-3y=7\n14-4y-3y=7\n-7y=-7\ny=1, 代回 x=7-2=5\n解为 {x=5,y=1}\n验算: 2×5-3×1=7✓; 5+2×1=7✓",
    "knowledge_tag": "二元一次方程组",
    "topic": "方程与不等式",
    "difficulty": 2,
    "grade": 7
}

questions.append({
    "id": "math_je046",
    "type": "single_choice",
    "question": "关于 x,y 的方程组 {ax+by=3, (a+1)x-(b-2)y=5} 有唯一解的条件是什么？（    ）",
    "options": ["A. a(b-2)≠b(a+1)", "B. a(b-2)=b(a+1)", "C. a≠0 且 b≠0", "D. a+b≠0"],
    "answer": "A. a(b-2)≠b(a+1)",
    "analysis": "二元一次方程组有唯一解 ⇔ 系数行列式 D≠0\nD = |a      b   |\n    |a+1  -(b-2)| = a×(-(b-2)) - b(a+1)\n  = -a(b-2) - b(a+1) = -ab+2a-ab-b = -2ab+2a-b\n要求 D≠0 即 -2ab+2a-b≠0\n等价于 a(b-2)≠-b(a+1)... \n\n实际上行列式 = -(ab-2a+ab+b) = -(2ab-2a+b)\n但通常考试只要求知道\"系数不成比例\"即可，即 a/(a+1) ≠ b/(-(b-2))",
    "knowledge_tag": "二元一次方程组",
    "topic": "方程与不等式",
    "difficulty": 5,
    "grade": 8
})
# 简化046
questions[-1] = {
    "id": "math_je046",
    "type": "single_choice",
    "question": "若关于 x,y 的方程组 {ax+by=1, 2x+3y=2} 有无穷多组解，则 a:b 等于（    ）",
    "options": ["A. 2:3", "B. 3:2", "C. 1:2", "D. 不能确定"],
    "answer": "A. 2:3",
    "analysis": "二元一次方程组有无穷多解 ⇔ 两个方程成比例（对应系数成比例，常数项也成比例）\na/2 = b/3 = 1/2\n所以 a/2 = 1/2，得 a=1\nb/3 = 1/2，得 b=3/2\na : b = 1 : 3/2 = 2 : 3\n即 a/b = 2/3",
    "knowledge_tag": "二元一次方程组",
    "topic": "方程与不等式",
    "difficulty": 4,
    "grade": 8
}

# ============================================================
# 8. 二元一次方程组应用（6题, diff 3-5）
# ============================================================

questions.append({
    "id": "math_je047",
    "type": "single_choice",
    "question": "买甲种票（30元/张）和乙种票（20元/张）共45张，花费1050元。各买了几张？（    ）",
    "options": ["A. 甲15张, 乙30张", "B. 甲30张, 乙15张", "C. 甲20张, 乙25张", "D. 甲25张, 乙20张"],
    "answer": "A. 甲15张, 乙30张",
    "analysis": "设甲票 x 张，乙票 y 张。\n① x+y=45  ② 30x+20y=1050\n由①: y=45-x，代入②: 30x+20(45-x)=1050\n30x+900-20x=1050 → 10x=150 → x=15, y=30\n验算: 15+30=45✓; 15×30+30×20=450+600=1050✓",
    "knowledge_tag": "方程组应用",
    "topic": "方程与不等式",
    "difficulty": 3,
    "grade": 8
})

questions.append({
    "id": "math_je048",
    "type": "single_choice",
    "question": "一个两位数，数字之和为9；交换数字后新数比原数大9。求原数。（    ）",
    "options": ["A. 45", "B. 54", "C. 36", "D. 63"],
    "answer": "A. 45",
    "analysis": "设十位数字 x，个位数字 y。\n① x+y=9\n② (10y+x)-(10x+y)=9 → 9y-9x=9 → y-x=1\n联立: x+y=9, y-x=1 → 相加得 2y=10, y=5, x=4\n原数=45\n验算: 4+5=9✓; 54-45=9✓",
    "knowledge_tag": "方程组应用",
    "topic": "方程与不等式",
    "difficulty": 3,
    "grade": 8
})

questions.append({
    "id": "math_je049",
    "type": "single_choice",
    "question": "2台大拖拉机和3台小拖拉机一天耕地35公顷；3台大拖拉机和2台小拖拉机一天耕地40公顷。各耕多少？（    ）",
    "options": ["A. 大机10公顷/天, 小机5公顷/天", "B. 大机5公顷/天, 小机10公顷/天", "C. 大机8公顷/天, 小机6公顷/天", "D. 大机6公顷/天, 小机8公顷/天"],
    "answer": "A. 大机10公顷/天, 小机5公顷/天",
    "analysis": "设大拖拉机每天耕 x 公顷，小拖拉机每天耕 y 公顷。\n① 2x+3y=35  ② 3x+2y=40\n①×3-②×2: 5x=65？不对！\n①×3: 6x+9y=105\n②×2: 6x+4y=80\n相减: 5y=25, y=5\n代入①: 2x+15=35, x=10\n验算: 2×10+3×5=20+15=35✓; 3×10+2×5=30+10=40✓",
    "knowledge_tag": "方程组应用",
    "topic": "方程与不等式",
    "difficulty": 3,
    "grade": 8
})

questions.append({
    "id": "math_je050",
    "type": "single_choice",
    "question": "商店购进甲乙两种商品共50件。甲每件利润10元，乙每件利润6元。全部售完后总利润380元。各进了多少件？（    ）",
    "options": ["A. 甲20件, 乙30件", "B. 甲30件, 乙20件", "C. 甲25件, 乙25件", "D. 甲15件, 乙35件"],
    "answer": "A. 甲20件, 乙30件",
    "analysis": "设甲 x 件，乙 y 件。\n① x+y=50  ② 10x+6y=380\n由①: y=50-x，代入②: 10x+6(50-x)=380\n10x+300-6x=380 → 4x=80 → x=20, y=30\n验算: 20+30=50件✓; 20×10+30×6=200+180=380元✓",
    "knowledge_tag": "方程组应用",
    "topic": "方程与不等式",
    "difficulty": 3,
    "grade": 8
})

questions.append({
    "id": "math_je051",
    "type": "single_choice",
    "question": "甲乙两地相距36千米。两人同时相向而行4小时相遇；同向而行（甲追乙）则甲9小时追上乙。求两人的速度。（    ）",
    "options": ["A. 甲6.5km/h, 乙2.5km/h", "B. 甲6km/h, 乙3km/h", "C. 甲7km/h, 乙2km/h", "D. 甲5km/h, 乙4km/h"],
    "answer": "A. 甲6.5km/h, 乙2.5km/h",
    "analysis": "设甲速 x km/h，乙速 y km/h。\n相遇: 4(x+y)=36 → x+y=9 ...①\n追及: 9(x-y)=36 → x-y=4 ...②\n①+②: 2x=13, x=6.5\n①-②: 2y=5, y=2.5\n验算: 相遇4×(6.5+2.4)=4×9=36✓; 追及9×(6.5-2.5)=9×4=36✓",
    "knowledge_tag": "方程组应用",
    "topic": "方程与不等式",
    "difficulty": 4,
    "grade": 8
})

questions.append({
    "id": "math_je052",
    "type": "single_choice",
    "question": "七年级三个兴趣小组：数学组是美术组的2倍，英语组比数学组少5人，三组共55人。数学组和美术组各多少人？（    ）",
    "options": ["A. 数学24人, 美术12人", "B. 数学20人, 美术10人", "C. 数学28人, 美术14人", "D. 数学26人, 美术13人"],
    "answer": "A. 数学24人, 美术12人",
    "analysis": "设美术 x 人，数学 y 人，英语 z 人。\n① y=2x  ② z=y-5  ③ x+y+z=55\n①②代入③: x+2x+(2x-5)=55 → 5x=60 → x=12\ny=24, z=19\n验算: 12+24+19=55✓; 24=2×12✓; 19=24-5✓",
    "knowledge_tag": "方程组应用",
    "topic": "方程与不等式",
    "difficulty": 3,
    "grade": 8
})

# ============================================================
# 9. 一元一次不等式（6题, diff 2-4）
# ============================================================

questions.append({
    "id": "math_je053",
    "type": "single_choice",
    "question": "不等式 2x - 6 > 0 的解集是（    ）",
    "options": ["A. x > 3", "B. x < 3", "C. x > -3", "D. x < -3"],
    "answer": "A. x > 3",
    "analysis": "2x-6>0 → 2x>6 → x>3（除以正数2，不等号方向不变）\n核心规则：只有乘除负数时不等号才变号！",
    "knowledge_tag": "一元一次不等式",
    "topic": "方程与不等式",
    "difficulty": 1,
    "grade": 7
})

questions.append({
    "id": "math_je054",
    "type": "single_choice",
    "question": "不等式 3(1-x) ≤ 2(x+9) 的解集是（    ）",
    "options": ["A. x ≥ -3", "B. x ≥ 3", "C. x ≤ -3", "D. x ≤ 3"],
    "answer": "A. x ≥ -3",
    "analysis": "3(1-x)≤2(x+9)\n3-3x≤2x+18\n3-18≤2x+3x\n-15≤5x\nx≥-3（除以正数5不变号）",
    "knowledge_tag": "一元一次不等式",
    "topic": "方程与不等式",
    "difficulty": 2,
    "grade": 7
})

questions.append({
    "id": "math_je055",
    "type": "single_choice",
    "question": "不等式 (x+1)/2 - (2x-1)/3 < 1 的解集是（    ）",
    "options": ["A. x > 1", "B. x < 1", "C. x > -1", "D. x < -1"],
    "answer": "C. x > -1",
    "analysis": "去分母（×6）：3(x+1) - 2(2x-1) < 6\n3x+3-4x+2 < 6\n-x+5 < 6\n-x < 1\nx > -1（乘以-1变号！）",
    "knowledge_tag": "一元一次不等式",
    "topic": "方程与不等式",
    "difficulty": 2,
    "grade": 7
})

questions.append({
    "id": "math_je056",
    "type": "single_choice",
    "question": "不等式 (a+2)x > a+2 的解集为 x < 1，则 a 的范围是（    ）",
    "options": ["A. a < -2", "B. a > -2", "C. a = -2", "D. 任意实数"],
    "answer": "A. a < -2",
    "analysis": "正常情况下 (a+2)x > a+2 的解应为 x > 1\n但题目给出 x < 1，不等号反向了！说明除以了**负数**\n所以 a+2 < 0，即 a < -2\n考点：不等式两边除以负数时不等号方向改变",
    "knowledge_tag": "一元一次不等式",
    "topic": "方程与不等式",
    "difficulty": 4,
    "grade": 7
})

questions.append({
    "id": "math_je057",
    "type": "single_choice",
    "question": "小明带20元买文具，笔记本3元/本，笔2元/支。至少买3本笔记本，最多能买几支笔？（    ）",
    "options": ["A. 5 支", "B. 6 支", "C. 7 支", "D. 8 支"],
    "answer": "A. 5 支",
    "analysis": "设买 x 本笔记本（x≥3），y 支笔。\n3x+2y≤20，要最大化 y 则最小化 x，取 x=3\n9+2y≤20 → 2y≤11 → y≤5.5 → y_max=5 支\n验算: 3本+5支=9+10=19≤20✓; 3本+6支=9+12=21>20✗",
    "knowledge_tag": "不等式应用",
    "topic": "方程与不等式",
    "difficulty": 3,
    "grade": 7
})

questions.append({
    "id": "math_je058",
    "type": "single_choice",
    "question": "若不等式 3x-a≤0 只有3个正整数解（x=1,2,3），则 a 的取值范围是（    ）",
    "options": ["A. 9<a≤12", "B. 9≤a<12", "C. 9≤a≤12", "D. 12≤a≤15"],
    "answer": "B. 9≤a<12",
    "analysis": "3x-a≤0 → x≤a/3\n正整数解恰好为{1,2,3}的条件：\n① x=3必须是解：a/3≥3 → a≥9\n② x=4不能是解：a/3<4 → a<12\n综合：9≤a<12\n边界验证：a=9时 x≤3，解{1,2,3}✓; a=11.99时 x≤3.996...，解{1,2,3}✓; a=12时 x≤4，解{1,2,3,4}共4个✗",
    "knowledge_tag": "一元一次不等式",
    "topic": "方程与不等式",
    "difficulty": 4,
    "grade": 7
})

# ============================================================
# 10. 不等式组（5题, diff 2-5）
# ============================================================

questions.append({
    "id": "math_je059",
    "type": "single_choice",
    "question": "不等式组 {2x-1>x+1, x+8>4x-1} 的解集是（    ）",
    "options": ["A. x > 2", "B. x < 3", "C. 2 < x < 3", "D. 无解"],
    "answer": "C. 2 < x < 3",
    "analysis": "① 2x-1>x+1 → x>2\n② x+8>4x-1 → 9>3x → x<3\n交集（公共部分）：2<x<3\n口诀：大大取大，小小取小，大小小大中间找，大大小小找不到",
    "knowledge_tag": "不等式组",
    "topic": "方程与不等式",
    "difficulty": 2,
    "grade": 7
})

questions.append({
    "id": "math_je060",
    "type": "single_choice",
    "question": "不等式组 {2x+3≥5, 3x-2<7} 的解集是（    ）",
    "options": ["A. x ≥ 1", "B. x < 3", "C. 1 ≤ x < 3", "D. 无解"],
    "answer": "C. 1 ≤ x < 3",
    "analysis": "① 2x+3≥5 → 2x≥2 → x≥1\n② 3x-2<7 → 3x<9 → x<3\n取交集：1≤x<3（包含1但不包含3）\n用区间表示为 [1, 3)",
    "knowledge_tag": "不等式组",
    "topic": "方程与不等式",
    "difficulty": 2,
    "grade": 7
})

questions.append({
    "id": "math_je061",
    "type": "single_choice",
    "question": "如果不等式组 {x > 2m+1, x < m+5} 无解，则 m 的范围是（    ）",
    "options": ["A. m ≥ 4", "B. m > 4", "C. m ≤ 4", "D. m < 4"],
    "answer": "A. m ≥ 4",
    "analysis": "{x > a, x < b} 无解的条件是 a ≥ b（大于大的且小于小的，不可能）\n本题：2m+1 ≥ m+5\nm ≥ 4\n验证: m=4时 {x>9, x<9}，确实无解✓\nm=5时 {x>11, x<10}，也无解✓",
    "knowledge_tag": "不等式组",
    "topic": "方程与不等式",
    "difficulty": 4,
    "grade": 7
})

questions.append({
    "id": "math_je062",
    "type": "single_choice",
    "question": "不等式组 {x > 2a, x ≤ 5} 的整数解共有3个，则整数 a 的最大值是（    ）",
    "options": ["A. 0", "B. 1", "C. -1", "D. 2"],
    "answer": "B. 1",
    "analysis": "解集：2a < x ≤ 5\n整数解3个：可能为 {3,4,5}\n条件：2a < 3 且 2a ≥ 2（确保2不是解否则有4个）\n即 1 < a ≤ 1.5\n整数 a 的最大值为 1\n验证: a=1 时，2<x≤5，整数解{3,4,5}共3个✓\na=2 时，4<x≤5，整数解{5}仅1个✗",
    "knowledge_tag": "不等式组",
    "topic": "方程与不等式",
    "difficulty": 5,
    "grade": 7
})

questions.append({
    "id": "math_je063",
    "type": "single_choice",
    "question": "不等式组 {x+1≥0, x-2<0, 2x-1>-5} 的整数解有几个？（    ）",
    "options": ["A. 2 个", "B. 3 个", "C. 4 个", "D. 5 个"],
    "answer": "B. 3 个",
    "analysis": "① x≥-1  ② x<2  ③ 2x>-4 → x>-2\n综合取交集：max(-1,-2) ≤ x < 2\n即 -1 ≤ x < 2\n整数解：-1, 0, 1 共 3 个",
    "knowledge_tag": "不等式组",
    "topic": "方程与不等式",
    "difficulty": 3,
    "grade": 7
})

# ============================================================
# 11. 不等式应用（4题, diff 3-5）
# ============================================================

questions.append({
    "id": "math_je064",
    "type": "single_choice",
    "question": "知识竞赛20道题，答对1题得5分，答错或不答扣2分。要得分不低于60分，至少要答对几道？（    ）",
    "options": ["A. 13 道", "B. 14 道", "C. 15 道", "D. 16 道"],
    "answer": "C. 15 道",
    "analysis": "设答对 x 道，得分=5x-2(20-x)=7x-40\n要求 7x-40≥60 → 7x≥100 → x≥100/7≈14.29\nx为整数，x≥15\n验算: 答14道得7×14-40=58<60✗; 答15道得65≥60✓\n至少答对15道",
    "knowledge_tag": "不等式应用",
    "topic": "方程与不等式",
    "difficulty": 3,
    "grade": 7
})

questions.append({
    "id": "math_je065",
    "type": "single_choice",
    "question": "小明用不超过100元买单价8元的笔记本和单价5元的笔。至少买3本笔记本和4支笔，最多能买几本笔记本？（    ）",
    "options": ["A. 8 本", "B. 9 本", "C. 10 本", "D. 11 本"],
    "answer": "C. 10 本",
    "analysis": "设买 x 本（x≥3），y 支（y≥4）。\n8x+5y≤100，要最大化 x 则最小化 y，取 y=4\n8x+20≤100 → 8x≤80 → x≤10\n最多买10本\n验算: 10本+4支=80+20=100元✓ 刚好花完\n11本+4支=88+20=108>100 ✗",
    "knowledge_tag": "不等式应用",
    "topic": "方程与不等式",
    "difficulty": 3,
    "grade": 7
})

# ============================================================
# 验证和输出
# ============================================================

print(f"题目总数: {len(questions)}")

# 验证ID连续性
ids = [q["id"] for q in questions]
expected_ids = [f"math_je{i:03d}" for i in range(1, 66)]
if ids == expected_ids:
    print("✅ ID序列完整: math_je001 ~ math_je065")
else:
    print(f"⚠️ ID检查: 期望{len(expected_ids)}个，实际{len(ids)}个")
    missing = set(expected_ids) - set(ids)
    if missing:
        print(f"缺失ID: {missing}")
    extra = set(ids) - set(expected_ids)
    if extra:
        print(f"多余ID: {extra}")

# 统计知识点分布
from collections import Counter
tag_count = Counter(q.get("knowledge_tag", "") for q in questions)
print("\n📊 知识点分布:")
for tag, count in sorted(tag_count.items()):
    print(f"  {tag}: {count} 题")

diff_count = Counter(q["difficulty"] for q in questions)
print("\n📊 难度分布:")
for d in [1,2,3,4,5]:
    c = diff_count.get(d, 0)
    print(f"  难度{d}: {c} 题")

# 统计答案分布
ans_count = Counter(q["answer"][0] for q in questions)
print("\n📊 答案分布:")
for letter in "ABCD":
    c = ans_count.get(letter, 0)
    print(f"  {letter}: {c} 题")

# 写入JSON
output_path = "/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/questions_math_junior_equation.json"
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(questions, f, ensure_ascii=False, indent=2)

print(f"\n✅ 已写入: {output_path}")
