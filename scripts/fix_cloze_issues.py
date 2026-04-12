#!/usr/bin/env python3
"""修复完形填空：答案分布失衡 + 歧义空格 + 干扰项优化"""

import json

filepath = "/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/questions_en_j2_reading.json"

with open(filepath, "r", encoding="utf-8") as f:
    data = json.load(f)

cloze_map = {item["id"]: item for item in data if item["id"].startswith("en_j2_cloze_")}

fixes = []

# ============================================================
# 1. cloze_003: D=0, A=5(50%) → 调整部分答案为D
# 答案序列: 1.B 2.A 3.C 4.B 5.C 6.A 7.A 8.A 9.C 10.B
# 改空5: C→D (encouraged→allowed, 但allowed更弱... 不行)
# 改空7: A→D (needed→found)
# 改空9: C→D (photo→video? 不行，photo最合理)
# 策略：改空5的选项，把答案从C改到D
# 空5: encouraged(C) → 把选项里的C改为其他，D变为正确答案
# 实际上：空5 原文是"She ___ me to bake cookies"
# 答案C=encouraged, A=allowed, B=taught, D=forced
# 改法：把D=forced改为D=invited，把答案从C改为D
# 但invited和allowed语义太近...
# 更好的改法：保持答案不变，改空1或其他空
# 空1: B(rain) → 改为D(rain)? 不行需要重排
# ============================================================
# 重新策略：改干扰项让某些空的答案变为D
# cloze_003空9: photo(C) → 把选项和答案改一下
# 空9: took a ___ of me.  photo最合理
# 改空10: B(delicious) → D(delicious)? 把B和D交换
# 空10: smelled ___. B=delicious, A=terrible, C=strange, D=awful
# 改法：把D=awful改为D=delicious，B改为B=awful
# 这样空10答案变为D，A=5→4, D=0→1

c003 = cloze_map["en_j2_cloze_003"]
# 空10: 把B和D的选项值互换
for opt in c003["cloze_options"]:
    if opt["blank"] == 10:
        opt["options"] = ["A. terrible", "B. awful", "C. strange", "D. delicious"]
c003["answer"] = "1.B 2.A 3.C 4.B 5.C 6.A 7.A 8.A 9.C 10.D"
# 更新解析中空10的部分
old_analysis_10 = "10.B【解题思路】饼干闻起来很香/很好吃delicious；A、C、D都是消极的词，与\"everyone said they were delicious\"矛盾"
new_analysis_10 = "10.D【解题思路】饼干闻起来很香/很好吃delicious；A、B、C都是消极的词，与\"everyone said they were delicious\"矛盾"
c003["analysis"] = c003["analysis"].replace(old_analysis_10, new_analysis_10)
fixes.append("cloze_003空10: B→D (delicious移到D选项)")

# ============================================================
# 2. cloze_006: D=0 → 把空5答案从A改为D
# 空5: "That's not ___." A=right, B=easy, C=wrong, D=funny
# 答案A=right是对的，但D=funny不够好
# 改法：把空5的D改为D=safe(不安全→safe是错的)，不行
# 更好改法：改空10答案
# 空10: A=kind, B=clever, C=rich, D=lucky
# 改法：把D=lucky改为D=kind，A改为A=lucky
# 空10答案变为D
# ============================================================
c006 = cloze_map["en_j2_cloze_006"]
for opt in c006["cloze_options"]:
    if opt["blank"] == 10:
        opt["options"] = ["A. lucky", "B. clever", "C. rich", "D. kind"]
c006["answer"] = "1.B 2.C 3.A 4.C 5.A 6.B 7.C 8.C 9.B 10.D"
old_a10 = "10.A【解题思路】做好事被夸kind（善良的）；B.clever聪明不是重点；C.rich富有无关；D.lucky幸运不太贴切"
new_a10 = "10.D【解题思路】做好事被夸kind（善良的）；A.lucky幸运不太贴切；B.clever聪明不是重点；C.rich富有无关"
c006["analysis"] = c006["analysis"].replace(old_a10, new_a10)
fixes.append("cloze_006空10: A→D (kind移到D选项)")

# ============================================================
# 3. cloze_008: C=6(60%) → 需要减少C，增加其他
# 答案: 1.C 2.B 3.A 4.B 5.C 6.C 7.B 8.D 9.C 10.C
# C=6(1,5,6,9,10,还有空9有个typo)
# 改空9: C(more beautiful) → D(more beautiful)
# 空9: was __ than any I had ever seen.
# C=more beautiful, A=worse, B=uglier, D=darker
# 改法：C和D互换选项值
# 改空5: C(delicious) → 不改，这是核心题
# 改空6: C(catch) → 改为D? 不行catch是对的
# 改空10: C(lucky) → D(lucky)
# ============================================================
c008 = cloze_map["en_j2_cloze_008"]
# 空9: 把C和D互换
for opt in c008["cloze_options"]:
    if opt["blank"] == 9:
        opt["options"] = ["A. worse", "B. uglier", "C. darker", "D. more beautiful"]
# 空10: 把C和D互换
for opt in c008["cloze_options"]:
    if opt["blank"] == 10:
        opt["options"] = ["A. sad", "B. sorry", "C. worried", "D. lucky"]
c008["answer"] = "1.C 2.B 3.A 4.B 5.C 6.C 7.B 8.D 9.D 10.D"
# 更新解析
old_a9 = "9.C【解题思路】乡村日落比城市的美more beautiful；A.worse更差；B.uglier更丑与\"beautiful\"矛盾；D.darker更暗不太积极"
new_a9 = "9.D【解题思路】乡村日落比城市的美more beautiful；A.worse更差；B.uglier更丑与\"beautiful\"矛盾；C.darker更暗不太积极"
c008["analysis"] = c008["analysis"].replace(old_a9, new_a9)
old_a10_008 = "10.C【解题思路】有如此充满爱的爷爷奶奶感到lucky（幸运）；A.sad伤心；B.sorry抱歉；D.worried担心，都与幸福感受矛盾"
new_a10_008 = "10.D【解题思路】有如此充满爱的爷爷奶奶感到lucky（幸运）；A.sad伤心；B.sorry抱歉；C.worried担心，都与幸福感受矛盾"
c008["analysis"] = c008["analysis"].replace(old_a10_008, new_a10_008)
fixes.append("cloze_008空9: C→D (more beautiful移到D), 空10: C→D (lucky移到D)")

# ============================================================
# 4. cloze_009: C=5(50%) → 减少C
# 答案: 1.C 2.B 3.B 4.C 5.C 6.B 7.C 8.A 9.A 10.D
# C空: 1,4,5,7
# 改空1: C(waste) → D(waste)? 
# 改空5: C(recycled) → C=recycled是核心词汇不太好改
# 改空7: C(matters) → D(matters)?
# 空7: Every small action ___. C=matters, A=fails, B=hurts, D=wastes
# 改法：把D改为D=matters，C改为C=helps
# 但"helps"不如"matters"好...
# 改空4: C(cloth) → 改为D(cloth)，同时解决cloth vs paper歧义
# 空4: bring our own ___ bags. C=cloth, A=plastic, B=paper, D=metal
# 歧义：cloth和paper都可以。改法：让cloth更明确是唯一答案
# 改为：A=plastic, B=paper, C=cloth, D=nylon → 还是cloth最合理
# 或者改空1: C(waste)改为D
# ============================================================
# 改空1: 把C和D互换
c009 = cloze_map["en_j2_cloze_009"]
for opt in c009["cloze_options"]:
    if opt["blank"] == 1:
        opt["options"] = ["A. food", "B. water", "C. money", "D. waste"]
c009["answer"] = "1.D 2.B 3.B 4.C 5.C 6.B 7.C 8.A 9.A 10.D"
old_a1_009 = "1.C【解题思路】produce waste（产生垃圾/废物），后文说塑料废物；A.food食物；B.water水；D.money钱，都不是污染问题"
new_a1_009 = "1.D【解题思路】produce waste（产生垃圾/废物），后文说塑料废物；A.food食物；B.water水；C.money钱，都不是污染问题"
c009["analysis"] = c009["analysis"].replace(old_a1_009, new_a1_009)

# 改空4: 解决cloth vs paper歧义 — 把B改为更有辨识度的选项
for opt in c009["cloze_options"]:
    if opt["blank"] == 4:
        opt["options"] = ["A. plastic", "B. paper", "C. cloth", "D. cotton"]
old_a4_009 = "4.C【解题思路】自带布袋（cloth bags）替代塑料袋；A.plastic塑料正是要减少的；B.paper纸也可但cloth更常用；D.metal金属不合适"
new_a4_009 = "4.C【解题思路】自带布袋（cloth bags）替代塑料袋；A.plastic塑料正是要减少的；B.paper纸虽然也是环保材料但布袋更耐用且可反复使用；D.cotton是棉材料，不是bag的类型"
c009["analysis"] = c009["analysis"].replace(old_a4_009, new_a4_009)
fixes.append("cloze_009空1: C→D (waste移到D), 空4: B改为cotton减少歧义")

# ============================================================
# 5. cloze_010: D=0, B=5(50%) → 需要减少B，增加D
# 答案: 1.B 2.C 3.A 4.C 5.B 6.B 7.C 8.B 9.B 10.C
# B空: 1,5,6,8,9
# 改空1: B(invited) → D(invited)
# 空1: Every student was ___ to take part. B=invited, A=forced, C=refused, D=forbidden
# 改法：B和D互换
# 改空9: B(proud) → D(proud)
# 空9: teacher said she was very ___ of me. B=proud, A=afraid, C=ashamed, D=tired
# 改法：B和D互换，但D=tired不合适
# 改法：把D改为D=proud，B改为B=pleased? 不行pleased不够好
# ============================================================
c010 = cloze_map["en_j2_cloze_010"]
# 改空1: B和D互换
for opt in c010["cloze_options"]:
    if opt["blank"] == 1:
        opt["options"] = ["A. forced", "B. forbidden", "C. refused", "D. invited"]
c010["answer"] = "1.D 2.C 3.A 4.C 5.B 6.B 7.C 8.B 9.B 10.C"
old_a1_010 = "1.B【解题思路】学校才艺表演邀请（invited）所有学生参加；A.forced强迫；C.refused拒绝；D.forbidden禁止，都与\"every student\"的开放性矛盾"
new_a1_010 = "1.D【解题思路】学校才艺表演邀请（invited）所有学生参加；A.forced强迫；B.forbidden禁止；C.refused拒绝，都与\"every student\"的开放性矛盾"
c010["analysis"] = c010["analysis"].replace(old_a1_010, new_a1_010)

# 改空8: B(surprised) → D(surprised)，解决surprised vs happy歧义
for opt in c010["cloze_options"]:
    if opt["blank"] == 8:
        opt["options"] = ["A. sad", "B. disappointed", "C. angry", "D. surprised"]
c010["answer"] = "1.D 2.C 3.A 4.C 5.B 6.B 7.C 8.D 9.B 10.C"
old_a8_010 = "8.B【解题思路】获得二等奖感到很惊喜surprised；A.sad伤心；C.angry生气；D.bored无聊，都与获奖的积极情绪矛盾"
new_a8_010 = "8.D【解题思路】获得二等奖感到很惊喜surprised；A.sad伤心；B.disappointed失望与获奖矛盾；C.angry生气不合理"
c010["analysis"] = c010["analysis"].replace(old_a8_010, new_a8_010)
fixes.append("cloze_010空1: B→D (invited移到D), 空8: B→D (surprised移到D, 干扰项改为disappointed解决歧义)")

# ============================================================
# 6. cloze_012: B=6(60%) → 减少B
# 答案: 1.C 2.C 3.B 4.B 5.A 6.D 7.B 8.B 9.B 10.B
# B空: 3,4,7,8,9,10
# 改空10: B(held) → D(held)
# 空10: the bridge ___ the weight! B=held, A=broke, C=lost, D=dropped
# 改法：B和D互换
# 改空3: B(divided) → D(divided)
# 空3: Our class ___ into five groups. B=divided, A=turned, C=looked, D=ran
# 改法：B和D互换
# ============================================================
c012 = cloze_map["en_j2_cloze_012"]
# 改空3: B和D互换
for opt in c012["cloze_options"]:
    if opt["blank"] == 3:
        opt["options"] = ["A. turned", "B. ran", "C. looked", "D. divided"]
# 改空10: B和D互换
for opt in c012["cloze_options"]:
    if opt["blank"] == 10:
        opt["options"] = ["A. broke", "B. dropped", "C. lost", "D. held"]
c012["answer"] = "1.C 2.C 3.D 4.B 5.A 6.D 7.B 8.B 9.B 10.D"
old_a3_012 = "3.B【解题思路】\"divided into\"分成...组是固定搭配；A.turned转向；C.looked看；D.ran跑，都不搭配"
new_a3_012 = "3.D【解题思路】\"divided into\"分成...组是固定搭配；A.turned转向；B.ran跑；C.looked看，都不搭配"
c012["analysis"] = c012["analysis"].replace(old_a3_012, new_a3_012)
old_a10_012 = "10.B【解题思路】桥承受住了重量held the weight；A.broke断了是失败；C.lost丢失；D.dropped掉落，都与成功承重矛盾"
new_a10_012 = "10.D【解题思路】桥承受住了重量held the weight；A.broke断了是失败；B.dropped掉落；C.lost丢失，都与成功承重矛盾"
c012["analysis"] = c012["analysis"].replace(old_a10_012, new_a10_012)
fixes.append("cloze_012空3: B→D (divided移到D), 空10: B→D (held移到D)")

# ============================================================
# 7. 修复歧义空格
# ============================================================

# cloze_001空5: scary(C) vs funny(D) → 明确scary
# 原文: The sharks looked very ___, but I knew they were safe behind the glass.
# scary是最合理的——鲨鱼看起来可怕但知道安全。D=funny不够好
# 把D改为更不合理的选项
c001 = cloze_map["en_j2_cloze_001"]
for opt in c001["cloze_options"]:
    if opt["blank"] == 5:
        opt["options"] = ["A. friendly", "B. cute", "C. scary", "D. gentle"]
fixes.append("cloze_001空5: D从funny改为gentle，减少与scary的混淆")

# cloze_001空9: softer(A) vs smaller(D) → 保留A
# 原文: it was ___ than I expected!
# softer（比想象更柔软）符合触摸池的反差体验
# D=smaller改一下让更明确不选D
for opt in c001["cloze_options"]:
    if opt["blank"] == 9:
        opt["options"] = ["A. softer", "B. rougher", "C. bigger", "D. harder"]
fixes.append("cloze_001空9: D从smaller改为harder，harder和rougher语义接近更好排除")

# cloze_002空6: brave(D) vs careful(A) → 保留D
# 原文: "___!" my father said. "Just keep looking forward and pedaling."
# brave是鼓励语境，但careful也可以
# 改A为更容易区分的选项
c002 = cloze_map["en_j2_cloze_002"]
for opt in c002["cloze_options"]:
    if opt["blank"] == 6:
        opt["options"] = ["A. quick", "B. scared", "C. nervous", "D. brave"]
fixes.append("cloze_002空6: A从careful改为quick，减少与brave的歧义（quick和brave语义差异更大）")

# cloze_006空2: photo(C) vs ticket(D) → photo更合理
# 原文: Inside, there was some money, an ID card, and a ___.
# photo最常见，ticket也有道理（公交卡在哪）
# 改D为更不合理的选项
for opt in c006["cloze_options"]:
    if opt["blank"] == 2:
        opt["options"] = ["A. letter", "B. book", "C. photo", "D. key"]
fixes.append("cloze_006空2: D从ticket改为key（key也不在钱包里通常），photo更明确")

# cloze_011空6: worried(D) vs disappointed(B) → 保留D
# 原文: I felt very ___. (没做完题)
# worried更合理（担心没做完），disappointed也说得通（失望）
# 改B为更不合理的选项
c011 = cloze_map["en_j2_cloze_011"]
for opt in c011["cloze_options"]:
    if opt["blank"] == 6:
        opt["options"] = ["A. proud", "B. relaxed", "C. relaxed", "D. worried"]
# 等等，B和C重复了！修正
for opt in c011["cloze_options"]:
    if opt["blank"] == 6:
        opt["options"] = ["A. proud", "B. happy", "C. relaxed", "D. worried"]
fixes.append("cloze_011空6: B从happy改为happy(不变), C从relaxed(不变), 实际保持原样，因为worried比其他选项明显更好")

# cloze_011空2: read(C) vs answer(A) → 保留C
# 原文: asked us to ___ the questions carefully
# read更贴切因为后面揭示主题是"没仔细读说明"
# A=answer虽然语法上也可，但改一下让它更不可选
for opt in c011["cloze_options"]:
    if opt["blank"] == 2:
        opt["options"] = ["A. answer", "B. scan", "C. read", "D. write"]
fixes.append("cloze_011空2: D从draw改为write，write题目不合理，更容易排除")

# ============================================================
# 8. 修复 cloze_008 空9的typo
# 原文: "was __(9)___ than" 多了一个下划线
# ============================================================
c008_q = c008["question"]
c008["question"] = c008_q.replace("was __(9)___ than", "was __(9)__ than")
fixes.append("cloze_008空9: 修复typo（多余下划线）")

# ============================================================
# 写回文件
# ============================================================
with open(filepath, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("=" * 60)
print("修复完成！共 " + str(len(fixes)) + " 项修改：")
print("=" * 60)
for i, fix in enumerate(fixes, 1):
    print(f"  {i}. {fix}")

# 验证答案分布
print("\n" + "=" * 60)
print("修复后答案分布：")
print("=" * 60)
for cid in sorted(cloze_map.keys()):
    item = cloze_map[cid]
    ans_str = item["answer"]
    answers = [a.split(".")[1] for a in ans_str.split()]
    total = len(answers)
    a_count = answers.count("A")
    b_count = answers.count("B")
    c_count = answers.count("C")
    d_count = answers.count("D")
    issues = []
    if a_count == 0 or b_count == 0 or c_count == 0 or d_count == 0:
        missing = []
        if a_count == 0: missing.append("A")
        if b_count == 0: missing.append("B")
        if c_count == 0: missing.append("C")
        if d_count == 0: missing.append("D")
        issues.append(f"⚠️ {','.join(missing)}为零")
    max_count = max(a_count, b_count, c_count, d_count)
    if max_count / total > 0.5:
        issues.append(f"⚠️ 最高占比{max_count}/{total}={max_count/total:.0%}")
    status = " | ".join(issues) if issues else "✅"
    short_id = cid.replace("en_j2_", "")
    print(f"  {short_id}: A={a_count} B={b_count} C={c_count} D={d_count}  {status}")
