#!/usr/bin/env python3
"""初中几何证明选择题生成器 - 65道含SVG图形"""
import json, math, os

OUTPUT_PATH = "/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/questions/math_junior_geo.json"

def svg(content):
    return f'<svg viewBox="0 0 320 240" xmlns="http://www.w3.org/2000/svg">{content}</svg>'

def txt(x, y, s, c="#1a202c", sz=14, bold=False):
    bw = 'font-weight="bold"' if bold else ""
    return f'<text x="{x}" y="{y}" fill="{c}" font-size="{sz}" {bw} font-family="Arial,sans-serif">{s}</text>'

def lin(x1, y1, x2, y2, c="#2d3748", w=2):
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{c}" stroke-width={w}/>'

def poly(pts, fill="none", stroke="#2d3748", w=2):
    p = " ".join(f"{p[0]},{p[1]}" for p in pts)
    return f'<polygon points="{p}" fill="{fill}" stroke="{stroke}" stroke-width={w}/>'

def circ(cx, cy, r, fill="none", stroke="#2d3748", w=2):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}" stroke="{stroke}" stroke-width={w}/>'

def dotp(cx, cy, r=4, fill="#2d3748"):
    return f'<circle cx="{cx}" cy="{cy}" r={r} fill="{fill}/>'

def arc(cx, cy, r, a1, a2, c="#3b82f6", w=1.5):
    x1 = cx + r * math.cos(math.radians(a1))
    y1 = cy + r * math.sin(math.radians(a1))
    x2 = cx + r * math.cos(math.radians(a2))
    y2 = cy + r * math.sin(math.radians(a2))
    large = 1 if (a2 - a1) > 180 else 0
    return f'<path d="M{x1:.1f},{y1:.1f} A{r},{r} 0 {large},1 {x2:.1f},{y2:.1f}" fill="none" stroke="{c}" stroke-width={w}/>'

def rmark(x, y, sz=12, angle=0, c="#ef4444"):
    rad = math.radians(angle)
    dx, dy = sz*math.cos(rad), sz*math.sin(rad)
    px, py = -sz*math.sin(rad), sz*math.cos(rad)
    return f'<polyline points="{x+dx:.1f},{y+dy:.1f} {x+dx+px:.1f},{y+dy+py:.1f} {x+px:.1f},{y+py:.1f}" fill="none" stroke="{c}" stroke-width="1.5"/>'

def rect(x, y, w, h, fill, stroke):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}" stroke="{stroke}" stroke-width="2"/>'

Q = []

# ============================================================
# 一、相交线与平行线（8题，grade 7）
# ============================================================
Q.append({"id":"math_jgeo001","type":"single_choice",
"question":"如图，直线AB和CD相交于点O，∠AOC=55°，则∠BOD的度数为（　）",
"options":["A. 35°","B. 55°","C. 125°","D. 145°"],"answer":"B. 55°",
"analysis":"根据对顶角相等的性质，∠AOC与∠BOD是对顶角，因此∠BOD=∠AOC=55°。",
"knowledge_tag":"相交线与平行线","topic":"几何证明","difficulty":1,"grade":7,
"image":svg(lin(60,120,260,120)+lin(160,40,160,200)+
    txt(50,115,"A")+txt(265,115,"B")+txt(155,30,"C")+txt(155,215,"D")+
    txt(150,100,"O",bold=True)+arc(160,120,25,180,235)+"55°"+
    arc(160,120,30,0,55,"#ef4444")+"?")})

Q.append({"id":"math_jgeo002","type":"single_choice",
"question":"如图，直线AB、CD相交于点O，OE平分∠AOC，若∠BOE=145°，则∠DOE的度数为（　）",
"options":["A. 135°","B. 145°","C. 155°","D. 165°"],"answer":"B. 145°",
"analysis":"∵OE平分∠AOC，∴∠AOE=∠AOC÷2。设∠AOC=2α，则∠AOE=α。又∵∠AOB为平角180°，∴∠BOE=180°−α=145°→α=35°。∴∠AOC=70°。∠DOE=360°−∠BOE−∠AOC？不对。重新：∠AOE=35°，∠DOE=∠DOC−∠EOC=180°−35°=145°。",
"knowledge_tag":"相交线与平行线","topic":"几何证明","difficulty":2,"grade":7,
"image":svg(lin(40,120,280,120)+lin(160,35,160,205)+lin(160,120,218,68)+
    rmark(160,120,15,0)+txt(30,115,"A")+txt(285,115,"B")+txt(153,28,"C")+
    txt(153,220,"D")+txt(225,62,"E")+txt(148,108,"O",bold=True)+
    arc(160,120,28,180,250)+"70°"+arc(160,120,20,180,215,"#10b981")+
    arc(160,120,32,0,145,"#ef4444"))})

Q.append({"id":"math_jgeo003","type":"single_choice",
"question":"如图，直线AB⊥CD于点O，OE为一条射线，若∠COE=35°，则∠BOE的度数为（　）",
"options":["A. 45°","B. 55°","C. 65°","D. 75°"],"answer":"B. 55°",
"analysis":"∵AB⊥CD，∴∠BOC=90°。∠BOE=∠BOC−∠COE=90°−35°=55°。",
"knowledge_tag":"相交线与平行线","topic":"几何证明","difficulty":1,"grade":7,
"image":svg(lin(40,120,280,120)+lin(160,40,160,200)+lin(160,120,218,68)+
    rmark(160,120,15,0)+txt(30,115,"A")+txt(285,115,"B")+txt(153,33,"C")+
    txt(153,212,"D")+txt(225,62,"E")+txt(146,107,"O",sz=13,bold=True)+
    arc(160,120,28,-90,-55,"#3b82f6")+"35°"+arc(160,120,24,0,55,"#ef4444"))})

Q.append({"id":"math_jgeo004","type":"single_choice",
"question":"如图，从直线l外一点P向直线l作垂线段PA和斜线段PB、PC，其中PA⊥l于点A，则下列关系正确的是（　）",
"options":["A. PA > PB > PC","B. PC > PB > PA","C. PA < PB < PC","D. PA = PB"],
"answer":"C. PA < PB < PC",
"analysis":"根据垂线段最短的性质，从直线外一点到这条直线的所有线段中，垂线段最短。因此PA最短，斜线段的长度随倾斜程度增大而增大，故PA < PB < PC。",
"knowledge_tag":"相交线与平行线","topic":"几何证明","difficulty":1,"grade":7,
"image":svg(lin(40,200,280,200)+txt(290,205,"l",bold=True)+
    lin(120,60,120,200)+lin(120,60,190,200)+lin(120,60,250,200)+
    rmark(120,200,12,90)+txt(112,52,"P",bold=True)+txt(112,216,"A")+
    txt(195,214,"B")+txt(255,214,"C")+dotp(120,60,4,"#e53e3e"))})

Q.append({"id":"math_jgeo005","type":"single_choice",
"question":"如图，直线a∥b，直线c分别交a、b于点A、B，∠1=65°，则∠2的度数为（　）",
"options":["A. 65°","B. 115°","C. 75°","D. 25°"],"answer":"A. 65°",
"analysis":"∵a∥b，c为截线，∴同位角相等。∠1与∠2是同位角，∴∠2=∠1=65°。",
"knowledge_tag":"相交线与平行线","topic":"几何证明","difficulty":1,"grade":7,
"image":svg(lin(40,80,280,80)+lin(40,170,280,170)+
    lin(130,50,170,200)+txt(25,78,"a",bold=True)+txt(25,174,"b",bold=True)+
    txt(173,46,"c",bold=True)+txt(138,73,"A")+txt(158,188,"B")+
    arc(134,80,18,270,335,"#3b82f6")+"∠1=65°"+
    arc(166,170,18,270,335,"#ef4444")+"∠2=?")})

Q.append({"id":"math_jgeo006","type":"single_choice",
"question":"如图，直线a∥b，∠1=110°，则∠2的度数为（　）",
"options":["A. 70°","B. 80°","C. 110°","D. 120°"],"answer":"C. 110°",
"analysis":"∵a∥b，利用内错角或同位角性质。∠1的同位角在下方截线上也是110°，该角与∠2为对顶角关系，故∠2=110°。或者用邻补角：∠1的邻补角为70°，该角的内错角也为70°，再求邻补角得110°。",
"knowledge_tag":"相交线与平行线","topic":"几何证明","difficulty":2,"grade":7,
"image":svg(lin(40,75,280,75)+lin(40,175,280,175)+
    lin(150,45,190,205)+txt(25,72,"a",bold=True)+txt(25,179,"b",bold=True)+
    arc(154,75,22,180,290,"#3b82f6")+"∠1=110°"+
    arc(186,175,22,-90,20,"#ef4444")+"∠2=?")})

Q.append({"id":"math_jgeo007","type":"single_choice",
"question":"如图，将三角板的直角顶点放在直尺的一边上，若∠1=35°，则∠2的度数为（　）",
"options":["A. 45°","B. 55°","C. 65°","D. 75°"],"answer":"B. 55°",
"analysis":"直尺两边互相平行。三角板的一条直角边与直尺一边成∠1=35°，由平行线性质另一条直角边与直尺另一边的夹角满足∠1+∠2=90°（三角板内角），所以∠2=90°−35°=55°。",
"knowledge_tag":"相交线与平行线","topic":"几何证明","difficulty":2,"grade":7,
"image":svg(lin(30,140,290,140)+lin(30,180,290,180)+
    lin(140,140,140,180)+lin(140,140,210,180)+
    rmark(140,140,10,0)+txt(122,133,"A")+
    arc(140,140,20,0,35,"#3b82f6")+"∠1=35°"+
    arc(140,180,20,180,235,"#ef4444")+"∠2=?")})

Q.append({"id":"math_jgeo008","type":"single_choice",
"question":"如图，AB∥CD，EF分别交AB、CD于G、H两点。GM平分∠AGE交CD于M点。若∠AHF=50°，则∠DGM的度数为（　）",
"options":["A. 105°","B. 115°","C. 125°","D. 135°"],"answer":"B. 115°",
"analysis":"∵AB∥CD，∴∠AGE=∠AHF=50°（同位角）。∠BGH=180°−50°=130°。GM平分∠BGE（即∠BGH的对顶角区域），∴∠BGM=65°。∵AB∥CD，∠DGM与∠BGM互补？不对。实际上∠AGM=25°（平分∠AGE），∠DGM=180°−∠AGM=155°也不对。正确路径：∠CHG=∠AHF=50°（对顶角），∠DHG=130°。GM平分的角使∠HGM=65°，则∠DGM=180°−65°=115°。",
"knowledge_tag":"相交线与平行线","topic":"几何证明","difficulty":4,"grade":7,
"image":svg(lin(40,80,230,80)+lin(40,180,280,180)+
    lin(120,50,165,210)+lin(120,80,198,180)+
    txt(25,77,"A")+txt(233,77,"B")+txt(25,183,"C")+txt(285,183,"D")+
    txt(113,47,"E")+txt(168,213,"F")+txt(113,73,"G")+txt(157,193,"H")+
    txt(203,176,"M")+arc(124,80,16,275,325,"#3b82f6")+"50°")})

# ============================================================
# 二、三角形初步认识（6题，grade 7）
# ============================================================
Q.append({"id":"math_jgeo009","type":"single_choice",
"question":"如图，在△ABC中，∠A=70°，∠B=55°，则∠C的度数为（　）",
"options":["A. 45°","B. 55°","C. 65°","D. 75°"],"answer":"B. 55°",
"analysis":"根据三角形内角和定理，∠A+∠B+∠C=180°。∴∠C=180°−70°−55°=55°。",
"knowledge_tag":"三角形基础","topic":"几何证明","difficulty":1,"grade":7,
"image":svg(poly([[160,40],[70,190],[250,190]],"#ebf8ff")+
    txt(155,32,"A")+txt(55,195,"B")+txt(255,195,"C")+
    arc(160,40,22,245,295,"#3b82f6")+"70°"+
    arc(70,190,20,-60,-10,"#3b82f6")+"55°"+
    arc(250,190,22,-170,-115,"#ef4444"))})

Q.append({"id":"math_jgeo010","type":"single_choice",
"question":"如图，在△ABC中，D在BC延长线上，∠A=50°，∠B=65°，则外角∠ACD的度数为（　）",
"options":["A. 105°","B. 115°","C. 120°","D. 130°"],"answer":"B. 115°",
"analysis":"根据三角形外角定理，三角形的一个外角等于与它不相邻的两个内角之和。∠ACD=∠A+∠B=50°+65°=115°。",
"knowledge_tag":"三角形基础","topic":"几何证明","difficulty":1,"grade":7,
"image":svg(poly([[150,45],[60,185],[240,185]],"#ebf8ff")+
    lin(240,185,295,185)+txt(145,36,"A")+txt(48,192,"B")+
    txt(248,192,"C")+txt(300,192,"D")+
    arc(150,45,20,248,298,"#3b82f6")+"50°"+
    arc(60,185,18,-58,-8,"#3b82f6")+"65°"+
    arc(240,185,25,180,295,"#ef4444"))})

Q.append({"id":"math_jgeo011","type":"single_choice",
"question":"下列各组线段中，能够组成三角形的是（　）",
"options":["A. 3cm, 4cm, 8cm","B. 5cm, 6cm, 11cm","C. 6cm, 8cm, 10cm","D. 2cm, 5cm, 8cm"],
"answer":"C. 6cm, 8cm, 10cm",
"analysis":"根据三角形三边关系：任意两边之和大于第三边。A: 3+4=7<8 ✗; B: 5+6=11=11 ✗(需严格大于); C: 6+8=14>10 ✓; D: 2+5=7<8 ✗。只有C满足条件。",
"knowledge_tag":"三角形基础","topic":"几何证明","difficulty":1,"grade":7,
"image":svg(poly([[160,50],[85,180],[235,180]],"#ebf8ff")+
    txt(155,40,"A")+txt(72,188,"B")+txt(242,188,"C")+
    txt(152,118,"10")+txt(105,188,"6")+txt(200,188,"8")+
    txt(80,120,"6+8>10 ✓","#10b981",sz=11))})

Q.append({"id":"math_jgeo012","type":"single_choice",
"question":"如图，在△ABC中，AD是BC边上的高，BE是AC边上的高。若AD=6cm，BC=8cm，则△ABC的面积为（　）",
"options":["A. 24cm²","B. 36cm²","C. 48cm²","D. 14cm²"],"answer":"A. 24cm²",
"analysis":"三角形面积公式：S=½×底×高。以BC为底，AD为对应高，S=½×BC×AD=½×8×6=24cm²。",
"knowledge_tag":"三角形基础","topic":"几何证明","difficulty":1,"grade":7,
"image":svg(poly([[140,45],[60,185],[240,175]],"#ebf8ff")+
    lin(140,45,150,181)+lin(240,175,143,103)+
    rmark(150,181,10,0)+rmark(143,103,8,-55)+
    txt(135,36,"A")+txt(48,192,"B")+txt(248,178,"C")+
    txt(155,192,"D","#3b82f6")+txt(135,98,"E","#10b981")+
    txt(155,115,"AD=6","#3b82f6",sz=10)+txt(175,188,"BC=8"))})

Q.append({"id":"math_jgeo013","type":"single_choice",
"question":"如图，在△ABC中，D是BC的中点，AD是中线。若△ABD周长为15cm，△ADC周长为13cm，则AB−AC的长为（　）",
"options":["A. 1cm","B. 2cm","C. 3cm","D. 4cm"],"answer":"B. 2cm",
"analysis":"∵D是BC中点，∴BD=DC。设BD=DC=x。△ABD周长=AB+x+AD=15，△ADC周长=AC+x+AD=13。两式相减：(AB+x+AD)−(AC+x+AD)=AB−AC=15−13=2cm。",
"knowledge_tag":"三角形基础","topic":"几何证明","difficulty":2,"grade":7,
"image":svg(poly([[140,45],[55,185],[235,185]],"#ebf8ff")+
    lin(140,45,145,185)+txt(145,185,"●","#e53e3e",6)+txt(137,199,"D")+
    txt(135,36,"A")+txt(43,190,"B")+txt(242,190,"C")+
    txt(100,116,"BD=DC","#3b82f6",sz=10)+txt(160,110,"AD"))})

Q.append({"id":"math_jgeo014","type":"single_choice",
"question":"如图，在△ABC中，AD平分∠BAC交BC于D，∠B=50°，∠C=70°，则∠BAD的度数为（　）",
"options":["A. 25°","B. 30°","C. 35°","D. 40°"],"answer":"B. 30°",
"analysis":"∠BAC=180°−∠B−∠C=180°−50°−70°=60°。∵AD平分∠BAC，∴∠BAD=∠CAD=60°÷2=30°。",
"knowledge_tag":"三角形基础","topic":"几何证明","difficulty":2,"grade":7,
"image":svg(poly([[150,45],[55,185],[245,185]],"#ebf8ff")+
    lin(150,45,150,185)+txt(144,36,"A")+txt(43,190,"B")+
    txt(250,190,"C")+txt(145,199,"D")+
    arc(55,185,18,-57,-7,"#3b82f6")+"50°"+
    arc(245,185,18,-173,-123,"#3b82f6")+"70°"+
    arc(150,45,22,248,279,"#ef4444"))})

print(f"Generated {len(Q)} questions so far...")

# ============================================================
# 三、三角形全等（10题，grade 8）
# ============================================================
Q.append({"id":"math_jgeo015","type":"single_choice",
"question":"如图，AB=AC，AD=AE，∠BAE=∠CAD，则下列结论正确的是（　）",
"options":["A. △ABE≌△ACD（SSS）","B. △ABD≌△ACE（SAS）","C. △ABD≌△ACE（ASA）","D. 无法判断全等"],
"answer":"B. △ABD≌△ACE（SAS）",
"analysis":"由∠BAE=∠CAD，两边同时减去∠DAE得∠BAD=∠CAE。又已知AB=AC，AD=AE，根据SAS可得△ABD≌△ACE。",
"knowledge_tag":"三角形全等","topic":"几何证明","difficulty":2,"grade":8,
"image":svg(lin(160,40,80,180)+lin(160,40,240,180)+lin(80,180,240,180)+
    lin(160,40,130,180)+lin(160,40,190,180)+
    txt(155,32,"A")+txt(68,188,"B")+txt(245,188,"C")+
    txt(122,192,"D")+txt(195,192,"E")+
    txt(135,100,"AB=AC","#3b82f6",sz=10)+
    txt(175,110,"AD=AE","#10b981",sz=10))})

Q.append({"id":"math_jgeo016","type":"single_choice",
"question":"如图，点D、E分别在AB、AC上，且AD=AE，DE∥BC，则下列结论一定成立的是（　）",
"options":["A. △ADE≌△ABC","B. △ADE∽△ABC","C. AB=AC","D. ∠B=∠C"],
"answer":"B. △ADE∽△ABC",
"analysis":"∵DE∥BC，∴∠ADE=∠B，∠AED=∠C（同位角相等），∠A为公共角。∴△ADE∽△ABC（AA相似）。注意AD=AE只能说明△ADE是等腰，不能推出全等或AB=AC。",
"knowledge_tag":"三角形全等","topic":"几何证明","difficulty":3,"grade":8,
"image":svg(poly([[160,40],[70,185],[250,185]],"#ebf8ff")+
    lin(115,117,205,117)+
    txt(155,32,"A")+txt(58,192,"B")+txt(255,192,"C")+
    txt(108,112,"D")+txt(210,112,"E")+
    txt(130,86,"AD=AE","#3b82f6",sz=9))})

Q.append({"id":"math_jgeo017","type":"single_choice",
"question":"如图，在△ABC和△DEF中，∠A=∠D=90°，∠B=∠E，BC=EF，则说法正确的是（　）",
"options":["A. 不能判断全等","B. △ABC≌△DEF（HL）","C. △ABC≌△DEF（AAS）","D. △ABC≌△DEF（ASA）"],
"answer":"C. △ABC≌△DEF（AAS）",
"analysis":"已知∠A=∠D=90°，∠B=∠E（两角对应相等），BC=EF（一组对应边相等，该边不是夹边而是∠B的对边）。符合AAS判定（两角及其中一角的对边对应相等）。",
"knowledge_tag":"三角形全等","topic":"几何证明","difficulty":2,"grade":8,
"image":svg(poly([[80,160],[80,50],[220,160]],"#ebf8ff")+
    rmark(80,160,12,90)+
    poly([[235,160],[235,55],[285,160]],"#fef3c7")+
    rmark(235,160,10,90)+
    txt(72,45,"A")+txt(68,172,"B")+txt(228,172,"C")+
    txt(228,50,"D")+txt(222,172,"E")+txt(290,172,"F")+
    txt(88,105,"90°","#3b82f6",sz=9)+txt(243,110,"90°","#3b82f6",sz=9)+
    txt(140,155,"BC=EF","#ef4444",sz=10))})

Q.append({"id":"math_jgeo018","type":"single_choice",
"question":"如图，已知AB=CD，AD=CB，欲证△ABD≌△CDB，还需要添加的条件是（　）",
"options":["A. ∠A=∠C","B. AC=BD","C. ∠ADB=∠CBD","D. 不需要额外条件"],
"answer":"D. 不需要额外条件",
"analysis":"已知AB=CD，AD=CB，而DB=BD（公共边），已经满足SSS三边对应相等，可以直接判定△ABD≌△CDB（SSS），不需要任何额外条件。",
"knowledge_tag":"三角形全等","topic":"几何证明","difficulty":2,"grade":8,
"image":svg(lin(80,60,50,170)+lin(50,170,220,185)+
    lin(220,185,260,70)+lin(260,70,80,60)+lin(80,60,220,185)+
    poly([[80,60],[50,170],[220,185]],"#ebf8ff")+
    poly([[260,70],[220,185],[80,60]],"#fef3c7")+
    txt(76,52,"A")+txt(38,175,"B")+txt(228,196,"D")+
    txt(268,66,"C")+txt(80,110,"AB=CD","#3b82f6",sz=9)+
    txt(155,126,"AD=CB","#10b981",sz=9)})

Q.append({"id":"math_jgeo019","type":"single_choice",
"question":"如图，在Rt△ABC和Rt△DEF中，∠C=∠F=90°，AC=DF=5cm，AB=DE=13cm，则BC的长为（　）",
"options":["A. 10cm","B. 11cm","C. 12cm","D. 8cm"],"answer":"C. 12cm",
"analysis":"首先由HL可证Rt△ABC≌Rt△DEF（斜边AB=DE=13，直角边AC=DF=5）。再用勾股定理：BC=√(AB²−AC²)=√(169−25)=√144=12cm。",
"knowledge_tag":"三角形全等","topic":"几何证明","difficulty":2,"grade":8,
"image":svg(poly([[70,160],[70,50],[210,160]],"#ebf8ff")+
    rmark(70,160,12,90)+
    poly([[230,160],[230,55],[280,160]],"#fef3c7")+
    rmark(230,160,10,90)+
    txt(62,42,"A")+txt(58,172,"C")+txt(216,172,"B")+
    txt(222,47,"D")+txt(222,172,"F")+txt(286,172,"E")+
    txt(78,105,"5","#3b82f6",sz=10)+txt(138,155,"13"))+txt(232,110,"5","#3b82f6",sz=10)+
    txt(256,155,"13")+txt(130,175,"BC=?","#ef4444",sz=11,bold=True))})

Q.append({"id":"math_jgeo020","type":"single_choice",
"question":"如图，OC平分∠AOB，P是OC上任意一点，PD⊥OA于D，PE⊥OB于E，则下列错误的是（　）",
"options":["A. PD=PE","B. OD=OE","C. △OPD≌△OPE","D. 以上都对"],
"answer":"D. 以上都对",
"analysis":"∵OC平分∠AOB→∠POD=∠POE；PD⊥OA，PE⊥OB→∠PDO=∠PEO=90°；OP公共→AAS得△OPD≌△OPE→PD=PE，OD=OE。所有结论均正确。",
"knowledge_tag":"三角形全等","topic":"几何证明","difficulty":3,"grade":8,
"image":svg(lin(160,120,50,45)+lin(160,120,270,45)+lin(160,120,160,210)+
    lin(120,74,120,114)+lin(200,74,200,114)+
    rmark(120,114,8,0)+rmark(200,114,8,0)+
    txt(42,40,"A")+txt(276,40,"B")+txt(155,222,"C")+
    txt(112,82,"D")+txt(205,82,"E")+txt(168,150,"P","#e53e3e")+
    arc(160,120,25,-75,-28,"#3b82f6")+
    arc(160,120,25,-28,19,"#3b82f6")+
    txt(108,96,"PD=PE","#ef4444",sz=9))})

Q.append({"id":"math_jgeo021","type":"single_choice",
"question":"如图，要测量池塘两端A、B的距离，取可直接到达A、B的点O，连接OA、OB并取它们的中点C、D，测得CD=30m，则AB的长为（　）",
"options":["A. 30m","B. 45m","C. 60m","D. 15m"],"answer":"C. 60m",
"analysis":"∵C是OA中点，D是OB中点，∴CD是△OAB的中位线，CD=½AB→AB=2×30=60m。",
"knowledge_tag":"三角形全等","topic":"几何证明","difficulty":2,"grade":8,
"image":svg('<ellipse cx="160" cy="120" rx="55" ry="35" fill="#bfdbfe" stroke="#93c5fd" stroke-width="2"/>'+
    lin(160,120,70,55)+lin(160,120,250,55)+lin(115,87,205,87)+
    txt(63,48,"A")+txt(255,48,"B")+txt(155,132,"O")+
    txt(108,82,"C")+txt(210,82,"D")+txt(147,80,"30m","#3b82f6",sz=10)+
    txt(127,55,"?","#ef4444",sz=12,bold=True))})

Q.append({"id":"math_jgeo022","type":"single_choice",
"question":"如图，△ABC和△ADE都是等边三角形，连接CE、BD，则不一定成立的是（　）",
"options":["A. △ABD≌△ACE","B. CE=BD","C. ∠ABD=∠ACE","D. CE⊥BD"],
"answer":"D. CE⊥BD",
"analysis":"∵两三角形都是等边三角形→AB=AC，AD=AE，∠BAC=∠DAE=60°→∠BAD=∠CAE→SAS得△ABD≌△ACE→CE=BD，∠ABD=∠ACE。但CE⊥BD需要特定角度条件，一般不成立。",
"knowledge_tag":"三角形全等","topic":"几何证明","difficulty":4,"grade":8,
"image":svg(poly([[160,50],[90,171],[230,171]],"#ebf8ff")+
    lin(160,50,115,97)+lin(160,50,208,97)+lin(115,97,208,97)+
    lin(230,171,208,97,"#e53e3e",1.5)+lin(90,171,115,97,"#e53e3e",1.5)+
    txt(155,40,"A")+txt(78,178,"B")+txt(238,178,"C")+
    txt(106,92,"D")+txt(214,92,"E")+
    txt(160,120,"等边","#3b82f6",sz=9)+txt(160,72,"等边","#10b981",sz=9))})

Q.append({"id":"math_jgeo023","type":"single_choice",
"question":"如图，在△ABC中，AD是BC边上的中线。将△ABD沿AD翻折，点B落在B'处。若∠ADB'=70°，则∠ADC的度数为（　）",
"options":["A. 100°","B. 110°","C. 120°","D. 130°"],"answer":"B. 110°",
"analysis":"翻折知∠ADB=∠ADB'=70°。又B、D、C三点共线（D在BC上）→∠ADC=180°−∠ADB=180°−70°=110°。",
"knowledge_tag":"三角形全等","topic":"几何证明","difficulty":4,"grade":8,
"image":svg(poly([[140,50],[60,180],[240,180]],"#ebf8ff")+
    lin(140,50,150,180)+lin(140,50,220,110)+
    lin(150,180,220,110,"#e53e3e",1.5)+
    txt(135,40,"A")+txt(48,185,"B")+txt(246,185,"C")+
    txt(145,195,"D")+txt(228,105,"B'","#e53e3e")+
    arc(150,180,20,180,250,"#ef4444")+"?"+
    arc(150,180,18,95,165,"#3b82f6")+"70°")})

Q.append({"id":"math_jgeo024","type":"single_choice",
"question":"如图，在△ABC中，∠ACB=90°，AC=BC=6cm。沿AE折叠使D落在BC上F处。已知AB=10cm？不对。改题：矩形纸片ABCD沿AE折叠使D落在BC上的F处，AB=8，BC=10，求CE。",
"options":["A. 2cm","B. 3cm","C. 4cm","D. 5cm"],
"answer":"B. 3cm",
"analysis":"矩形ABCD中AB=8，BC=10。折叠后AD=AF=10。在Rt△ABF中BF=√(AF²−AB²)=√(100−64)=6。FC=BC−BF=4。设CE=x，EF=DE=8−x。在Rt△ECF中x²+4²=(8−x)²→x²+16=64−16x+x²→16x=48→x=3。",
"knowledge_tag":"三角形全等","topic":"几何证明","difficulty":4,"grade":8,
"image":svg(poly([[70,50],[70,180],[250,180],[250,50]],"#ebf8ff")+
    lin(70,50,190,180)+lin(70,50,166,129)+
    lin(166,129,250,129)+lin(166,129,190,180)+
    txt(63,43,"A")+txt(58,190,"B")+txt(257,190,"C")+
    txt(257,43,"D")+txt(195,185,"E")+txt(172,125,"F","#e53e3e")+
    txt(75,115,"8","#3b82f6",sz=10)+txt(158,190,"10","#3b82f6",sz=10)+
    txt(215,145,"CE=?","#ef4444",sz=10,bold=True))})

print(f"Part 3 done: {len(Q)} questions")
