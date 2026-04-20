# Part 4: 等腰三角形 (6题) + Part 5: 勾股定理 (8题)
# 追加到主脚本的数据

import math

def svg(content):
    return f'<svg viewBox="0 0 320 240" xmlns="http://www.w3.org/2000/svg">{content}</svg>'
def txt(x,y,s,c="#1a202c",sz=14,bold=False):
    bw='font-weight="bold"' if bold else ""
    return f'<text x="{x}" y="{y}" fill="{c}" font-size="{sz}" {bw} font-family="Arial,sans-serif">{s}</text>'
def lin(x1,y1,x2,y2,c="#2d3748",w=2):
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{c}" stroke-width={w}/>'

def poly(pts,fill="none",stroke="#2d3748",w=2):
    p=" ".join(f"{p[0]},{p[1]}" for p in pts)
    return f'<polygon points="{p}" fill="{fill}" stroke="{stroke}" stroke-width={w}/>'
def circ(cx,cy,r,fill="none",stroke="#2d3748",w=2):
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}" stroke="{stroke}" stroke-width={w}/>'
def dotp(cx,cy,r=4,fill="#2d3748"):
    return f'<circle cx="{cx}" cy="{cy}" r={r} fill="{fill}/>'
def arc(cx,cy,r,a1,a2,c="#3b82f6",w=1.5):
    x1=cx+r*math.cos(math.radians(a1)); y1=cy+r*math.sin(math.radians(a1))
    x2=cx+r*math.cos(math.radians(a2)); y2=cy+r*math.sin(math.radians(a2))
    lg=1 if (a2-a1)>180 else 0
    return f'<path d="M{x1:.1f},{y1:.1f} A{r},{r} 0 {lg},1 {x2:.1f},{y2:.1f}" fill="none" stroke="{c}" stroke-width={w}/>'
def rmark(x,y,sz=12,angle=0,c="#ef4444"):
    rad=math.radians(angle); dx=sz*math.cos(rad); dy=sz*math.sin(rad)
    px=-sz*math.sin(rad); py=sz*math.cos(rad)
    return f'<polyline points="{x+dx:.1f},{y+dy:.1f} {x+dx+px:.1f},{y+dy+py:.1f} {x+px:.1f},{y+py:.1f}" fill="none" stroke="{c}" stroke-width="1.5"/>'
def rect(x,y,w,h,fill,stroke):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}" stroke="{stroke}" stroke-width="2"/>'

Q = []  # will be imported and appended

# === 等腰三角形 6题 ===
Q.append({"id":"math_jgeo025","type":"single_choice",
"question":"如图，在△ABC中，AB=AC，∠A=40°，则∠B的度数为（　）",
"options":["A. 50°","B. 60°","C. 70°","D. 80°"],"answer":"C. 70°",
"analysis":"等边对等角→∠B=∠C=(180−40)/2=70°。",
"knowledge_tag":"等腰三角形","topic":"几何证明","difficulty":1,"grade":8,
"image":svg(poly([[160,45],[70,185],[250,185]],"#ebf8ff")+txt(155,35,"A")+txt(55,195,"B")+txt(255,195,"C")
    +txt(135,55,"AB=AC","#3b82f6",sz=10)+arc(160,45,22,245,295,"#3b82f6")+"40°"
    +arc(70,185,20,-58,-8,"#ef4444"))})

Q.append({"id":"math_jgeo026","type":"single_choice",
"question":"如图，在等腰△ABC中，AB=AC，AD⊥BC于D。BC=10cm，AD=12cm，则AB=（　）",
"options":["A. 11cm","B. 12cm","C. 13cm","D. 14cm"],"answer":"C. 13cm",
"analysis":"三线合一→BD=5。Rt△ABD中AB=√(12²+5²)=13。",
"knowledge_tag":"等腰三角形","topic":"几何证明","difficulty":2,"grade":8,
"image":svg(poly([[160,40],[80,180],[240,180]],"#ebf8ff")+lin(160,40,160,180)+rmark(160,180,12,0)
    +txt(155,31,"A")+txt(68,190,"B")+txt(245,190,"C")+txt(155,198,"D")
    +txt(170,110,"12","#3b82f6",sz=10)+txt(160,194,"5","#3b82f6",sz=10)+txt(105,105,"AB=?","#ef4444",sz=11,bold=True))})

Q.append({"id":"math_jgeo027","type":"single_choice",
"question":"等边△ABC边长为6cm，D在BC上且BD=2cm，则AD的长为（　）（保留根号）",
"options":["A. 2√3 cm","B. 2√7 cm","C. 4cm","D. 3√2 cm"],"answer":"B. 2√7 cm",
"analysis":"作高AE⊥BC，E为中点BE=3。AE=3√3。DE=|3−2|=1。AD=√((3√3)²+1²)=√28=2√7。",
"knowledge_tag":"等腰三角形","topic":"几何证明","difficulty":3,"grade":8,
"image":svg(poly([[160,40],[85,169],[235,169]],"#ebf8ff")+lin(160,40,160,169)+lin(160,40,135,169)+rmark(160,169,10,0)
    +txt(155,31,"A")+txt(73,178,"B")+txt(240,178,"C")+txt(128,178,"D")+txt(155,184,"E")
    +txt(168,100,"h=3√3","#3b82f6",sz=9)+txt(140,178,"1","#3b82f6",sz=9)+txt(130,110,"AD=?","#ef4444",sz=10,bold=True))})

Q.append({"id":"math_jgeo028","type":"single_choice",
"question":"等腰△ABC中，AB=AC=10cm，BC=12cm。D在BC上且BD=4cm，则AD=（　）",
"options":["A. 2√5 cm","B. 2√13 cm","C. 2√17 cm","D. 4√5 cm"],"answer":"C. 2√17 cm",
"analysis":"作AE⊥BC，E为中点→BE=6，AE=8。DE=|6−4|=2。AD=√(8²+2²)=√68=2√17。",
"knowledge_tag":"等腰三角形","topic":"几何证明","difficulty":3,"grade":8,
"image":svg(poly([[150,45],[70,180],[230,180]],"#ebf8ff")+lin(150,45,150,180)+lin(150,45,118,180)+rmark(150,180,10,0)
    +txt(144,36,"A")+txt(58,188,"B")+txt(237,188,"C")+txt(145,196,"E")+txt(108,188,"D")
    +txt(158,110,"AE=8","#3b82f6",sz=9)+txt(130,188,"2","#3b82f6",sz=9)+txt(120,115,"AD=?","#ef4444",sz=10,bold=True))})

Q.append({"id":"math_jgeo029","type":"single_choice",
"question":"等腰直角△ABC中，∠C=90°，AC=BC=4cm，D是AC中点，则BD=（　）",
"options":["A. 2√3 cm","B. 2√5 cm","C. 3cm","D. 4cm"],"answer":"B. 2√5 cm",
"analysis":"CD=2，BC=4，BD=√(4²+2²)=√20=2√5。",
"knowledge_tag":"等腰三角形","topic":"几何证明","difficulty":2,"grade":8,
"image":svg(poly([[100,160],[100,50],[220,160]],"#ebf8ff")+rmark(100,160,12,90)+lin(220,160,100,105)
    +txt(92,42,"A")+txt(88,172,"C")+txt(228,165,"B")+txt(92,108,"D","#e53e3e")
    +txt(108,108,"2","#3b82f6",sz=10)+txt(155,155,"4","#3b82f6",sz=10)+txt(165,125,"BD=?","#ef4444",sz=10,bold=True))})

Q.append({"id":"math_jgeo030","type":"single_choice",
"question":"等腰△ABC中，AB=AC，∠BAC=120°，D是BC中点，DE⊥AB于E，则AE:EB=（　）",
"options":["A. 1:1","B. 1:2","C. 1:3","D. 2:1"],"answer":"C. 1:3",
"analysis":"∠B=(180−120)/2=30°。设AB=2a。DE⊥AB→BE=AB·cos30°·cos30°？用坐标法：最终得AE=AB/4，EB=3AB/4，比值1:3。",
"knowledge_tag":"等腰三角形","topic":"几何证明","difficulty":4,"grade":8,
"image":svg(poly([[160,50],[70,180],[250,180]],"#ebf8ff")+lin(160,50,160,180)+lin(160,50,131,141)+rmark(131,141,8,-60)
    +txt(155,40,"A")+txt(58,188,"B")+txt(255,188,"C")+txt(155,195,"D")+txt(122,136,"E")
    +arc(160,50,22,230,310,"#3b82f6")+"120°"+txt(100,115,"AE:EB=?","#ef4444",sz=10,bold=True))})

# === 勾股定理 8题 ===
Q.append({"id":"math_jgeo031","type":"single_choice",
"question":"Rt△ABC中，∠C=90°，AC=3，BC=4，则斜边AB=（　）",
"options":["A. 5","B. 6","C. 7","D. 25"],"answer":"A. 5",
"analysis":"经典3-4-5直角三角形：AB=√(3²+4²)=5。",
"knowledge_tag":"勾股定理","topic":"几何证明","difficulty":1,"grade":8,
"image":svg(poly([[80,160],[80,60],[200,160]],"#ebf8ff")+rmark(80,160,12,90)+txt(72,52,"A")+txt(68,175,"C")+txt(208,165,"B")
    +txt(88,105,"3","#3b82f6",sz=11)+txt(135,155,"4","#3b82f6",sz=11)+txt(135,105,"5?","#ef4444",sz=11,bold=True))})

Q.append({"id":"math_jgeo032","type":"single_choice",
"question":"长5m的梯子斜靠墙上，底端距墙3m，顶端距地面高度为（　）",
"options":["A. 3m","B. 4m","C. 4.5m","D. 6m"],"answer":"B. 4m",
"analysis":"h=√(5²−3²)=√16=4m。",
"knowledge_tag":"勾股定理","topic":"几何证明","difficulty":1,"grade":8,
"image":svg(lin(100,40,100,200,"#94a3b8",3)+lin(80,200,280,200,"#94a3b8",3)+lin(100,80,220,200,"#d97706",3)+rmark(100,200,10,0)
    +txt(88,72,"顶端")+txt(108,140,"h=?","#ef4444",sz=11,bold=True)+txt(160,216,"3m","#3b82f6",sz=10)+txt(165,135,"5m"))})

Q.append({"id":"math_jgeo033","type":"single_choice",
"question":"下列可作为直角三角形三边的是（　）",
"options":["A. 1,2,3","B. 2,3,4","C. 5,12,13","D. 6,8,11"],
"answer":"C. 5,12,13",
"analysis":"仅5²+12²=25+144=169=13²满足勾股逆定理。",
"knowledge_tag":"勾股定理","topic":"几何证明","difficulty":1,"grade":8,
"image":svg(poly([[80,150],[80,50],[220,150]],"#ebf8ff")+rmark(80,150,12,90)+txt(72,42,"A")+txt(68,165,"C")+txt(228,155,"B")
    +txt(88,95,"5","#3b82f6",sz=11)+txt(145,145,"12","#3b82f6",sz=11)+txt(145,95,"13","#10b981",sz=11))})

Q.append({"id":"math_jgeo034","type":"single_choice",
"question":"圆柱高12cm，底面周长18cm。蚂蚁从外壁爬到内壁正对点的最短路程为（　）",
"options":["A. 12cm","B. 15cm","C. 18cm","D. 21cm"],"answer":"B. 15cm",
"analysis":"展开后水平走半周9cm，垂直走12cm→路程=√(9²+12²)=15cm。",
"knowledge_tag":"勾股定理","topic":"几何证明","difficulty":3,"grade":8,
"image":svg('<ellipse cx="110" cy="130" rx="40" ry="15" fill="none" stroke="#2d3748" stroke-width="2"/><ellipse cx="110" cy="55" rx="40" ry="15" fill="#ebf8ff" stroke="#2d3748" stroke-width="2"/>'
    +lin(70,55,70,130)+lin(150,55,150,130)+rect(200,50,90,120,"#fef3c7","#2d3748")
    +txt(100,38,"圆柱")+txt(235,40,"展开图")+txt(100,128,"A","#e53e3e",sz=12,bold=True)+txt(245,162,"B","#e53e3e",sz=12,bold=True)
    +txt(218,155,"9","#3b82f6",sz=10)+txt(295,105,"12","#3b82f6",sz=10)
    +'<line x1="209" y1="168" x2="282" y2="54" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="4,2"/>')})

Q.append({"id":"math_jgeo035","type":"single_choice",
" question":"矩形ABCD沿AE折叠使D落在BC上的F处。AB=8，BC=10，则CE=（　）",
"options":["A. 3cm","B. 4cm","C. 5cm","D. 6cm"],"answer":"A. 3cm",
"analysis":"AF=AD=10。BF=√(10²−8²)=6。FC=4。设CE=x：x²+4²=(8−x)²→x=3。",
"knowledge_tag":"勾股定理","topic":"几何证明","difficulty":3,"grade":8,
"image":svg(poly([[70,50],[70,180],[250,180],[250,50]],"#ebf8ff")+lin(70,50,190,180)+lin(70,50,166,129)+lin(166,129,250,129)+lin(166,129,190,180)
    +txt(63,43,"A")+txt(58,190,"B")+txt(257,190,"C")+txt(257,43,"D")+txt(195,185,"E")+txt(172,125,"F","#e53e3e")
    +txt(75,115,"8","#3b82f6",sz=10)+txt(158,190,"10","#3b82f6",sz=10)+txt(215,145,"CE=?","#ef4444",sz=10,bold=True))})

Q.append({"id":"math_jgeo036","type":"single_choice",
"question":"长方体长3cm、宽4cm、高12cm，体对角线长为（　）",
"options":["A. 12cm","B. 13cm","C. 15cm","D. √193 cm"],"answer":"B. 13cm",
"analysis":"d=√(3²+4²+12²)=√169=13cm。",
"knowledge_tag":"勾股定理","topic":"几何证明","difficulty":2,"grade":8,
"image":svg(poly([[80,140],[80,60],[180,40],[180,120]],"none")+
    poly([[80,60],[160,30],[260,50],[180,40]],"none")+poly([[180,120],[180,40],[260,50],[260,130]],"none")
    +poly([[80,140],[80,60],[180,40],[180,120]],"#ebf8ff")+poly([[80,60],[160,30],[260,50],[180,40]],"#d1fae5")
    +lin(80,140,260,50,"#ef4444",2,"dashed")+txt(70,148,"A")+txt(265,55,"C")+txt(110,145,"3","#3b82f6",sz=10)+txt(120,48,"4","#3b82f6",sz=10)+txt(185,85,"12","#3b82f6",sz=10)+txt(175,90,"d=?","#ef4444",sz=11,bold=True))})

Q.append({"id":"math_jgeo037","type":"single_choice",
"question":"坐标平面中A(3,4)，B(6,0)，则AB距离=（　）",
"options":["A. 4","B. 5","C. 6","D. √41"],"answer":"B. 5",
"analysis":"AB=√[(6−3)²+(0−4)²]=√(9+16)=5。",
"knowledge_tag":"勾股定理","topic":"几何证明","difficulty":2,"grade":8,
"image":svg(lin(40,200,290,200,"#94a3b8",1.5)+lin(60,220,60,30,"#94a3b8",1.5)+dotp(150,80,5,"#3b82f6")+dotp(230,140,5,"#ef4444")
    +lin(150,80,230,140)+lin(150,80,150,140,"#cbd5e1",1.5)+lin(150,140,230,140,"#cbd5e1",1.5)+rmark(150,140,8,0)
    +txt(142,73,"A(3,4)","#3b82f6",sz=11)+txt(236,145,"B(6,0)","#ef4444",sz=11)+txt(182,105,"3")+txt(158,115,"4")+txt(195,105,"AB=5?","#ef4444",sz=10))})

Q.append({"id":"math_jgeo038","type":"single_choice",
"question":"弦图中大正方形面积=13，中心小正方形面积=1，则两直角边之和a+b=（　）",
"options":["A. 4","B. 5","C. 6","D. 7"],"answer":"B. 5",
"analysis":"c²=13,(a-b)²=1,a-b=1。四三角形面积=(13-1)/4=3,ab=6。(a+b)²=a²+b²+2ab=13+12=25→a+b=5。",
"knowledge_tag":"勾股定理","topic":"几何证明","difficulty":4,"grade":8,
"image":svg(poly([[110,40],[210,40],[210,140],[110,140]],"none")
    +poly([[110,40],[160,40],[110,90]],"#ebf8ff")+poly([[160,40],[210,40],[210,90]],"#fef3c7")
    +poly([[210,90],[210,140],[160,140]],"#d1fae5")+poly([[110,90],[160,140],[110,140]],"#fce7f3")
    +poly([[110,90],[160,90],[160,140],[110,140]],"#fff")+txt(128,122,"1")+txt(148,20,"S=13","#3b82f6",sz=10)+txt(225,90,"a")+txt(160,152,"b")+txt(95,170,"a+b=?","#ef4444",sz=11,bold=True))})

print(f"Part 4+5 generated: {len(Q)} questions")
