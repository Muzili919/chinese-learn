#!/usr/bin/env python3
"""初中几何证明选择题生成器 - 主脚本
合并所有部分并输出最终JSON: 65道选择题含SVG图形"""
import json, math, sys

OUTPUT = "/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/questions/math_junior_geo.json"

# ============================================================
# SVG工具函数
# ============================================================
def svg(c):
    return f'<svg viewBox="0 0 320 240" xmlns="http://www.w3.org/2000/svg">{c}</svg>'
def t(x,y,s,c="#1a202c",sz=14,b=False):
    return f'<text x="{x}" y="{y}" fill="{c}" font-size="{sz}" {"font-weight="bold" if b else ""} font-family="Arial,sans-serif">{s}</text>'
def l(x1,y1,x2,y2,c="#2d3748",w=2):
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{c}" stroke-width={w}/>'
def p(pts,f="none",s="#2d3748",w=2):
    return '<polygon points="'+' '.join(f'{p[0]},{p[1]}' for p in pts)+f'" fill="{f}" stroke="{s}" stroke-width={w}/>'
def ci(cx,cy,r,f="none",s="#2d3748",w=2):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{f}" stroke="{s}" stroke-width={w}/>'
def dt(cx,cy,r=4,f="#2d3748"):
    return f'<circle cx="{cx}" cy="{cy}" r={r} fill="{f}/>'
def ar(cx,cy,r,a1,a2,c="#3b82f6",w=1.5):
    x1,y1=cx+r*math.cos(math.radians(a1)),cy+r*math.sin(math.radians(a1))
    x2,y2=cx+r*math.cos(math.radians(a2)),cy+r*math.sin(math.radians(a2))
    lg=1 if (a2-a1)>180 else 0
    return f'<path d="M{x1:.1f},{y1:.1f} A{r},{r} 0 {lg},1 {x2:.1f},{y2:.1f}" fill="none" stroke="{c}" stroke-width={w}/>'
def rm(x,y,sz=12,a=0,c="#ef4444"):
    d=sz*math.cos(math.radians(a));e=sz*math.sin(a);p=-sz*math.sin(a);q=sz*math.cos(a)
    return f'<polyline points="{x+d:.1f},{y+e:.1f} {x+d+p:.1f},{y+e+q:.1f} {x+p:.1f},{y+q:.1f}" fill="none" stroke="{c}" stroke-width="1.5"/>'
def rc(x,y,w,h,f,st):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{f}" stroke="{st}" stroke-width="2"/>'

Q = []

# ==================== Part 1: 相交线与平行线 (8题) ====================

Q.append({"id":"math_jgeo001","type":"single_choice",
"question":"如图，直线AB和CD相交于点O，∠AOC=55°，则∠BOD的度数为（　）",
"options":["A. 35°","B. 55°","C. 125°","D. 145°"],"answer":"B. 55°",
"analysis":"对顶角相等：∠BOD=∠AOC=55°。",
"knowledge_tag":"相交线与平行线","topic":"几何证明","difficulty":1,"grade":7,
"image":svg(l(60,120,260,120)+l(160,40,160,200)+t(50,115,"A")+t(265,115,"B")+t(155,30,"C")+t(155,215,"D")
    +t(150,100,"O",True)+ar(160,120,25,180,235)+"55°"+ar(160,120,30,0,55,"#ef4444"))})

Q.append({"id":"math_jgeo002","type":"single_choice",
"question":"直线AB、CD相交于O，OE平分∠AOC，若∠BOE=145°，则∠DOE=（　）",
"options":["A. 135°","B. 145°","C. 155°","D. 165°"],"answer":"B. 145°",
"analysis":"∠AOE=180−145=35°。OE平分∠AOC→∠AOC=70°。∠DOE=∠DOC−∠EOC=180−35=145°。",
"knowledge_tag":"相交线与平行线","topic":"几何证明","difficulty":2,"grade":7,
"image":svg(l(40,120,280,120)+l(160,35,160,205)+l(160,120,218,68)+rm(160,120,15,0)
    +t(30,115,"A")+t(285,115,"B")+t(153,28,"C")+t(153,220,"D")+t(225,62,"E")+t(148,108,"O",True)
    +ar(160,120,28,180,250)+"70°"+ar(160,120,20,180,215,"#10b981")+ar(160,120,32,0,145,"#ef4444"))})

Q.append({"id":"math_jgeo003","type":"single_choice",
"question":"AB⊥CD于O，射线OE使∠COE=35°，则∠BOE=（　）",
"options":["A. 45°","B. 55°","C. 65°","D. 75°"],"answer":"B. 55°",
"analysis":"AB⊥CD→∠BOC=90°。∠BOE=90−35=55°。",
"knowledge_tag":"相交线与平行线","topic":"几何证明","difficulty":1,"grade":7,
"image":svg(l(40,120,280,120)+l(160,40,160,200)+l(160,120,218,68)+rm(160,120,15,0)
    +t(30,115,"A")+t(285,115,"B")+t(153,33,"C")+t(153,212,"D")+t(225,62,"E")+t(146,107,"O",sz=13,True)
    +ar(160,120,28,-90,-55,"#3b82f6")+"35°"+ar(160,120,24,0,55,"#ef4444"))})

Q.append({"id":"math_jgeo004","type":"single_choice",
"question":"从直线外一点P作垂线段PA和斜线段PB、PC（PA⊥l），则（　）",
"options":["A. PA>PB>PC","B. PC>PB>PA","C. PA<PB<PC","D. PA=PB"],
"answer":"C. PA<PB<PC",
"analysis":"垂线段最短→PA最短，斜线越长倾斜越大。",
"knowledge_tag":"相交线与平行线","topic":"几何证明","difficulty":1,"grade":7,
"image":svg(l(40,200,280,200)+t(290,205,"l",True)+l(120,60,120,200)+l(120,60,190,200)+l(120,60,250,200)
    +rm(120,200,12,90)+t(112,52,"P",True)+t(112,216,"A")+t(195,214,"B")+t(255,214,"C")+dt(120,60,4,"#e53e3e"))})

Q.append({"id":"math_jgeo005","type":"single_choice",
"question":"a∥b，截线c交a、b于A、B，∠1=65°（同位角），则∠2=（　）",
"options":["A. 65°","B. 115°","C. 75°","D. 25°"],"answer":"A. 65°",
"analysis":"平行线同位角相等。",
"knowledge_tag":"相交线与平行线","topic":"几何证明","difficulty":1,"grade":7,
"image":svg(l(40,80,280,80)+l(40,170,280,170)+l(130,50,170,200)
    +t(25,78,"a",True)+t(25,174,"b",True)+t(173,46,"c",True)+t(138,73,"A")+t(158,188,"B")
    +ar(134,80,18,270,335,"#3b82f6")+"65°"+ar(166,170,18,270,335,"#ef4444"))})

Q.append({"id":"math_jgeo006","type":"single_choice",
"question":"a∥b，∠1=110°，则内错角∠2=（　）",
"options":["A. 70°","B. 80°","C. 110°","D. 120°"],"answer":"C. 110°",
"analysis":"内错角相等或通过邻补角推导均得∠2=110°。",
"knowledge_tag":"相交线与平行线","topic":"几何证明","difficulty":2,"grade":7,
"image":svg(l(40,75,280,75)+l(40,175,280,175)+l(150,45,190,205)
    +t(25,72,"a",True)+t(25,179,"b",True)+ar(154,75,22,180,290,"#3b82f6")+"110°"
    +ar(186,175,22,-90,20,"#ef4444"))})

Q.append({"id":"math_jgeo007","type":"single_choice",
"question":"三角板直角顶点在直尺上，∠1=35°，则∠2=（　）",
"options":["A. 45°","B. 55°","C. 65°","D. 75°"],"answer":"B. 55°",
"analysis":"直尺两边平行，三角板两直角边互余→∠2=90−35=55°。",
"knowledge_tag":"相交线与平行线","topic":"几何证明","difficulty":2,"grade":7,
"image":svg(l(30,140,290,140)+l(30,180,290,180)+l(140,140,140,180)+l(140,140,210,180)
    +rm(140,140,10,0)+t(122,133,"A")+ar(140,140,20,0,35,"#3b82f6")+"35°"
    +ar(140,180,20,180,235,"#ef4444"))})

Q.append({"id":"math_jgeo008","type":"single_choice",
"question":"AB∥CD，EF交AB、CD于G、H。GM平分∠AGE交CD于M。∠AHF=50°，则∠DGM=（　）",
"options":["A. 105°","B. 115°","C. 125°","D. 135°"],"answer":"B. 115°",
"analysis":"∠AGE=∠AHF=50°（同位角）。GM平分∠AGE的对顶补角区域→相关角为65°。由互补关系∠DGM=180−65=115°。",
"knowledge_tag":"相交线与平行线","topic":"几何证明","difficulty":4,"grade":7,
"image":svg(l(40,80,230,80)+l(40,180,280,180)+l(120,50,165,210)+l(120,80,198,180)
    +t(25,77,"A")+t(233,77,"B")+t(25,183,"C")+t(285,183,"D")+t(113,47,"E")+t(168,213,"F")
    +t(113,73,"G")+t(157,193,"H")+t(203,176,"M")+ar(124,80,16,275,325,"#3b82f6")+"50°")})

print(f"Part 1 done: {len(Q)}")

# ==================== Part 2: 三角形初步 (6题) ====================
Q.append({"id":"math_jgeo009","type":"single_choice","question":"△ABC中∠A=70°，∠B=55°，则∠C=（　）",
"options":["A. 45°","B. 55°","C. 65°","D. 75°"],"answer":"B. 55°",
"analysis":"内角和180°→∠C=180−70−55=55°。",
"knowledge_tag":"三角形基础","topic":"几何证明","difficulty":1,"grade":7,
"image":svg(p([[160,40],[70,190],[250,190]],"#ebf8ff")+t(155,32,"A")+t(55,195,"B")+t(255,195,"C")
    +ar(160,40,22,245,295,"#3b82f6")+"70°"+ar(70,190,20,-60,-10,"#3b82f6")+"55°"
    +ar(250,190,22,-170,-115,"#ef4444"))})

Q.append({"id":"math_jgeo010","type":"single_choice","question":"△ABC中D在BC延长线上，∠A=50°，∠B=65°，则外角∠ACD=（　）",
"options":["A. 105°","B. 115°","C. 120°","D. 130°"],"answer":"B. 115°",
"analysis":"外角=不相邻两内角和=50+65=115°。",
"knowledge_tag":"三角形基础","topic":"几何证明","difficulty":1,"grade":7,
"image":svg(p([[150,45],[60,185],[240,185]],"#ebf8ff")+l(240,185,295,185)
    +t(145,36,"A")+t(48,192,"B")+t(248,192,"C")+t(300,192,"D")
    +ar(150,45,20,248,298,"#3b82f6")+"50°"+ar(60,185,18,-58,-8,"#3b82f6")+"65°"
    +ar(240,185,25,180,295,"#ef4444"))})

Q.append({"id":"math_jgeo011","type":"single_choice","question":"能组成三角形的三边是（　）",
"options":["A. 3,4,8","B. 5,6,11","C. 6,8,10","D. 2,5,8"],
"answer":"C. 6,8,10",
"analysis":"仅6+8>14满足三边关系。6-8-10是勾股数。",
"knowledge_tag":"三角形基础","topic":"几何证明","difficulty":1,"grade":7,
"image":svg(p([[160,50],[85,180],[235,180]],"#ebf8ff")+t(155,40,"A")+t(72,188,"B")+t(242,188,"C")
    +t(152,118,"10")+t(105,188,"6")+t(200,188,"8")+t(80,120,"✓","#10b981",11))})

Q.append({"id":"math_jgeo012","type":"single_choice","question":"△ABC中AD是BC边上的高，AD=6，BC=8，面积=（　）",
"options":["A. 24cm²","B. 36cm²","C. 48cm²","D. 14cm²"],"answer":"A. 24cm²",
"analysis":"S=½×底×高=½×8×6=24。",
"knowledge_tag":"三角形基础","topic":"几何证明","difficulty":1,"grade":7,
"image":svg(p([[140,45],[60,185],[240,175]],"#ebf8ff")+l(140,45,150,181)+l(240,175,143,103)
    +rm(150,181,10,0)+rm(143,103,8,-55)+t(135,36,"A")+t(48,192,"B")+t(248,178,"C")
    +t(155,192,"D","#3b82f6")+t(135,98,"E","#10b981")+t(155,115,"AD=6","#3b82f6",10))})

Q.append({"id":"math_jgeo013","type":"single_choice","question":"D是BC中点（中线），△ABD周长15，△ADC周长13，则AB−AC=（　）",
"options":["A. 1cm","B. 2cm","C. 3cm","D. 4cm"],"answer":"B. 2cm",
"analysis":"BD=DC=x。两式相减：(AB+x+AD)−(AC+x+AD)=15−13=2。",
"knowledge_tag":"三角形基础","topic":"几何证明","difficulty":2,"grade":7,
"image":svg(p([[140,45],[55,185],[235,185]],"#ebf8ff")+l(140,45,145,185)
    +t(145,185,"●","#e53e3e",6)+t(137,199,"D")+t(135,36,"A")+t(43,190,"B")+t(242,190,"C")
    +t(100,116,"BD=DC","#3b82f6",10)+t(160,110,"AD"))})

Q.append({"id":"math_jgeo014","type":"single_choice","question":"AD平分∠BAC，∠B=50°，∠C=70°，则∠BAD=（　）",
"options":["A. 25°","B. 30°","C. 35°","D. 40°"],"answer":"B. 30°",
"analysis":"∠BAC=180−50−70=60°。平分→∠BAD=30°。",
"knowledge_tag":"三角形基础","topic":"几何证明","difficulty":2,"grade":7,
"image":svg(p([[150,45],[55,185],[245,185]],"#ebf8ff")+l(150,45,150,185)
    +t(144,36,"A")+t(43,190,"B")+t(250,190,"C")+t(145,199,"D")
    +ar(55,185,18,-57,-7,"#3b82f6")+"50°"+ar(245,185,18,-173,-123,"#3b82f6")+"70°"
    +ar(150,45,22,248,279,"#ef4444"))})

print(f"Part 2 done: {len(Q)}")

# ==================== Part 3: 全等三角形 (10题) ====================
Q.append({"id":"math_jgeo015","type":"single_choice","question":"AB=AC，AD=AE，∠BAE=∠CAD，正确的是（　）",
"options":["A. △ABE≌△ACD(SSS)","B. △ABD≌△ACE(SAS)","C. △ABD≌△ACE(ASA)","D. 无法判断"],
"answer":"B. △ABD≌△ACE（SAS）",
"analysis":"∠BAD=∠CAE（等式性质），AB=AC，AD=AE→SAS全等。",
"knowledge_tag":"三角形全等","topic":"几何证明","difficulty":2,"grade":8,
"image":svg(l(160,40,80,180)+l(160,40,240,180)+l(80,180,240,180)+l(160,40,130,180)+l(160,40,190,180)
    +t(155,32,"A")+t(68,188,"B")+t(245,188,"C")+t(122,192,"D")+t(195,192,"E")
    +t(135,100,"AB=AC","#3b82f6",10)+t(175,110,"AD=AE","#10b981",10))})

Q.append({"id":"math_jgeo016","type":"single_choice","question":"D、E分别在AB、AC上，AD=AE，DE∥BC，一定成立的是（　）",
"options":["A. △ADE≌△ABC","B. △ADE∽△ABC","C. AB=AC","D. ∠B=∠C"],
"answer":"B. △ADE∽△ABC",
"analysis":"DE∥BC→同位角相等→AA相似。AD=AE只说明△ADE等腰。",
"knowledge_tag":"三角形全等","topic":"几何证明","difficulty":3,"grade":8,
"image":svg(p([[160,40],[70,185],[250,185]],"#ebf8ff")+l(115,117,205,117)
    +t(155,32,"A")+t(58,192,"B")+t(255,192,"C")+t(108,112,"D")+t(210,112,"E")
    +t(130,86,"AD=AE","#3b82f6",9))})

Q.append({"id":"math_jgeo017","type":"single_choice","question":"∠A=∠D=90°，∠B=∠E，BC=EF，判定方法（　）",
"options":["A. 不能判断","B. HL","C. AAS","D. ASA"],
"answer":"C. AAS",
"analysis":"两角及一角对边对应相等→AAS。",
"knowledge_tag":"三角形全等","topic":"几何证明","difficulty":2,"grade":8,
"image":svg(p([[80,160],[80,50],[220,160]],"#ebf8ff")+rm(80,160,12,90)
    +p([[235,160],[235,55],[285,160]],"#fef3c7")+rm(235,160,10,90)
    +t(72,45,"A")+t(68,172,"C")+t(228,172,"B")+t(228,50,"D")+t(222,172,"E")+t(290,172,"F")
    +t(88,105,"90°","#3b82f6",9)+t(243,110,"90°","#3b82f6",9))})

Q.append({"id":"math_jgeo018","type":"single_choice","question":"AB=CD，AD=CB，证△ABD≌△CDB还需（　）",
"options":["A. ∠A=∠C","B. AC=BD","C. ∠ADB=∠CBD","D. 不需要"],
"answer":"D. 不需要额外条件",
"analysis":"已有SSS：AB=CD，AD=CB，DB公共。",
"knowledge_tag":"三角形全等","topic":"几何证明","difficulty":2,"grade":8,
"image":svg(l(80,60,50,170)+l(50,170,220,185)+l(220,185,260,70)+l(260,70,80,60)+l(80,60,220,185)
    +p([[80,60],[50,170],[220,185]],"#ebf8ff")+p([[260,70],[220,185],[80,60]],"#fef3c7")
    +t(76,52,"A")+t(38,175,"B")+t(228,196,"D")+t(268,66,"C")+t(80,110,"AB=CD","#3b82f6",9))})

Q.append({"id":"math_jgeo019","type":"single_choice","question":"Rt△ABC和Rt△DEF中，∠C=∠F=90°，AC=DF=5，AB=DE=13，BC=（　）",
"options":["A. 10","B. 11","C. 12","D. 8"],"answer":"C. 12",
"analysis":"HL全等后勾股定理：BC=√(13²−5²)=12。",
"knowledge_tag":"三角形全等","topic":"几何证明","difficulty":2,"grade":8,
"image":svg(p([[70,160],[70,50],[210,160]],"#ebf8ff")+rm(70,160,12,90)
    +p([[230,160],[230,55],[280,160]],"#fef3c7")+rm(230,160,10,90)
    +t(62,42,"A")+t(58,172,"C")+t(216,172,"B")+t(222,47,"D")+t(222,172,"F")+t(286,172,"E")
    +t(78,105,"5","#3b82f6",10)+t(138,155,"13")+t(232,110,"5","#3b82f6",10)+t(256,155,"13"))})

Q.append({"id":"math_jgeo020","type":"single_choice","question":"OC平分∠AOB，P在OC上，PD⊥OA，PE⊥OB。错误的是（　）",
"options":["A. PD=PE","B. OD=OE","C. △OPD≌△OPE","D. 以上都对"],
"answer":"D. 以上都对",
"analysis":"全部正确：AAS全等→所有结论都成立。",
"knowledge_tag":"三角形全等","topic":"几何证明","difficulty":3,"grade":8,
"image":svg(l(160,120,50,45)+l(160,120,270,45)+l(160,120,160,210)
    +l(120,74,120,114)+l(200,74,200,114)+rm(120,114,8,0)+rm(200,114,8,0)
    +t(42,40,"A")+t(276,40,"B")+t(155,222,"C")+t(112,82,"D")+t(205,82,"E")+t(168,150,"P","#e53e3e")
    +ar(160,120,25,-75,-28,"#3b82f6")+ar(160,120,25,-28,19,"#3b82f6")+t(108,96,"PD=PE","#ef4444",9))})

Q.append({"id":"math_jgeo021","type":"single_choice"," question":"测池塘两端A、B距离。取O点，OA、OB中点为C、D，CD=30m，则AB=（　）",
"options":["A. 30m","B. 45m","C. 60m","D. 15m"],"answer":"C. 60m",
"analysis":"中位线定理：AB=2×CD=60m。",
"knowledge_tag":"三角形全等","topic":"几何证明","difficulty":2,"grade":8,
"image":svg('<ellipse cx="160" cy="120" rx="55" ry="35" fill="#bfdbfe" stroke="#93c5fd" stroke-width="2"/>'
    +l(160,120,70,55)+l(160,120,250,55)+l(115,87,205,87)
    +t(63,48,"A")+t(255,48,"B")+t(155,132,"O")+t(108,82,"C")+t(210,82,"D")
    +t(147,80,"30m","#3b82f6",10)+t(127,55,"?","#ef4444",12,True))})

Q.append({"id":"math_jgeo022","type":"single_choice","question":"△ABC和△ADE都是等边三角形，连接CE、BD。不一定成立的是（　）",
"options":["A. △ABD≌△ACE","B. CE=BD","C. ∠ABD=∠ACE","D. CE⊥BD"],
"answer":"D. CE⊥BD",
"analysis":"SAS可证前三个。CE⊥BD需特殊角度，一般不成立。",
"knowledge_tag":"三角形全等","topic":"几何证明","difficulty":4,"grade":8,
"image":svg(p([[160,50],[90,171],[230,171]],"#ebf8ff")
    +l(160,50,115,97)+l(160,50,208,97)+l(115,97,208,97)
    +l(230,171,208,97,"#e53e3e",1.5)+l(90,171,115,97,"#e53e3e",1.5)
    +t(155,40,"A")+t(78,178,"B")+t(238,178,"C")+t(106,92,"D")+t(214,92,"E")
    +t(160,120,"等边","#3b82f6",9)+t(160,72,"等边","#10b981",9))})

Q.append({"id":"math_jgeo023","type":"single_choice"," question":"AD是BC的中线，沿AD翻折B到B'，∠ADB'=70°，则∠ADC=（　）",
"options":["A. 100°","B. 110°","C. 120°","D. 130°"],"answer":"B. 110°",
"analysis":"翻折→∠ADB=∠ADB'=70°。B-D-C共线→∠ADC=180−70=110°。",
"knowledge_tag":"三角形全等","topic":"几何证明","difficulty":4,"grade":8,
"image":svg(p([[140,50],[60,180],[240,180]],"#ebf8ff")+l(140,50,150,180)+l(140,50,220,110)+l(150,180,220,110,"#e53e3e",1.5)
    +t(135,40,"A")+t(48,185,"B")+t(246,185,"C")+t(145,195,"D")+t(228,105,"B'","#e53e3e")
    +ar(150,180,20,180,250,"#ef4444"))+ar(150,180,18,95,165,"#3b82f6")+"70°")})

Q.append({"id":"math_jgeo024","type":"single_choice"," question":"矩形ABCD沿AE折叠使D落在BC上的F处。AB=8，BC=10，CE=（　）",
"options":["A. 3cm","B. 4cm","C. 5cm","D. 6cm"],"answer":"A. 3cm",
"analysis":"AF=AD=10。Rt△ABF中BF=6→FC=4。设CE=x：(8-x)²=x²+4²→x=3。",
"knowledge_tag":"三角形全等","topic":"几何证明","difficulty":3,"grade":8,
"image":svg(p([[70,50],[70,180],[250,180],[250,50]],"#ebf8ff")
    +l(70,50,190,180)+l(70,50,166,129)+l(166,129,250,129)+l(166,129,190,180)
    +t(63,43,"A")+t(58,190,"B")+t(257,190,"C")+t(257,43,"D")+t(195,185,"E")+t(172,125,"F","#e53e3e")
    +t(75,115,"8","#3b82f6",10)+t(158,190,"10","#3b82f6",10)+t(215,145,"CE=?","#ef4444",10,True))})

print(f"Part 3 done: {len(Q)}")

# ====== 继续Part 4-9将在下一批次写入 ======
with open("/tmp/geo_part123.json", "w") as f:
    json.dump(Q[:], f, ensure_ascii=False, indent=2)

print(f"\nSaved {len(Q)} questions to /tmp/geo_part123.json")
print("Need to run gen_geo_full.py to generate complete 65-question set")
