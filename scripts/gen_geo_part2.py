#!/usr/bin/env python3
"""生成后6道diff5几何题（第5-10题）并追加"""
import json

INPUT = 'src/data/questions_math_junior_geo.json'
OUTPUT = 'src/data/questions_math_junior_geo.json'

with open(INPUT, 'r', encoding='utf-8') as f:
    existing = json.load(f)

print(f"当前: {len(existing)}题, 最大ID: {existing[-1]['id']}")

# ========== 第5题：中线+Apollonius定理 ==========
svg5 = ('<svg viewBox="0 0 320 240" xmlns="http://www.w3.org/2000/svg">'
'<polygon points="160,50,80,180,250,170" fill="#ebf8ff" stroke="#2d3748" stroke-width="2"/>'
'<line x1="160" y1="50" x2="165" y2="175" stroke="#2d3748" stroke-width="1.5" stroke-dasharray="5,3"/>'
'<line x1="165" y1="175" x2="250" y2="230" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="3,3"/>'
'<line x1="165" y1="175" x2="80" y2="235" stroke="#94a3b8" stroke-width="1.2" stroke-dasharray="3,3"/>'
'<text x="153" y="43" fill="#1a202c" font-size="14" font-family="Arial">A</text>'
'<text x="66" y="185" fill="#1a202c" font-size="14" font-family="Arial">B</text>'
'<text x="256" y="175" fill="#1a202c" font-size="14" font-family="Arial">C</text>'
'<text x="158" y="192" fill="#1a202c" font-size="14" font-family="Arial">D</text>'
'<text x="255" y="242" fill="#94a3b8" font-size="14" font-family="Arial">E</text>'
'<text x="110" y="125" fill="#3b82f6" font-size="9" font-family="Arial">√13</text>'
'<text x="172" y="125" fill="#3b82f6" font-size="9" font-family="Arial">3</text>'
'<text x="172" y="198" fill="#3b82f6" font-size="9" font-family="Arial">2</text>'
'<text x="208" y="212" fill="#ef4444" font-size="10" font-weight="bold" font-family="Arial">BC=?</text>'
'</svg>')

q5 = {
    "id": "math_jgeo079",
    "type": "single_choice",
    "question": "如图，在△ABC中，AB=√13，AC=3。D是BC边上的中线AD=2。则BC的长为(　)",
    "options": ["A.2√3", "B.2√6", "C.2√7", "D.4√2"],
    "answer": "C.2√7",
    "analysis": "使用阿波罗尼奥斯定理（中线长公式）：m_a²=(2b²+2c²−a²)/4。\n其中a=BC（待求），b=AC=3，c=AB=√13，m_a=AD=2。\n代入：4=(2×9+2×13−BC²)/4 → 16=18+26−BC²=44−BC² → BC²=28 → BC=2√7。\n另证（倍长中线法）：延长AD至E使DE=AD=2，连接BE、CE。四边形ABEC对角线互相平分为平行四边形，由平行四边形对角线公式：AE²+BC²=2(AB²+AC²)，即16+BC²=2(13+9)=44。",
    "knowledge_tag": "中线与辅助线",
    "topic": "几何证明",
    "difficulty": 5,
    "grade": 9,
    "image": svg5
}

# ========== 第6题：角平分线+面积法 ==========
svg6 = ('<svg viewBox="0 0 320 240" xmlns="http://www.w3.org/2000/svg">'
'<polygon points="160,40,80,178.5,240,178.5" fill="#ebf8ff" stroke="#2d3748" stroke-width="2"/>'
'<line x1="160" y1="40" x2="160" y2="178.5" stroke="#2d3748" stroke-width="1.5" stroke-dasharray="5,3"/>'
'<circle cx="160" cy="110" r="3.5" fill="#e53e3e"/>'
'<line x1="160" y1="110" x2="114" y2="114" stroke="#e53e3e" stroke-width="1" stroke-dasharray="2,2"/>'
'<line x1="160" y1="110" x2="206" y2="114" stroke="#e53e3e" stroke-width="1" stroke-dasharray="2,2"/>'
'<polyline points="116,108 116,116 110,113" fill="none" stroke="#ef4444" stroke-width="1"/>'
'<polyline points="204,108 204,116 210,113" fill="none" stroke="#ef4444" stroke-width="1"/>'
'<text x="153" y="32" fill="#1a202c" font-size="14" font-family="Arial">A</text>'
'<text x="66" y="185" fill="#1a202c" font-size="14" font-family="Arial">B</text>'
'<text x="245" y="185" fill="#1a202c" font-size="14" font-family="Arial">C</text>'
'<text x="155" y="195" fill="#1a202c" font-size="14" font-family="Arial">D</text>'
'<text x="153" y="103" fill="#e53e3e" font-size="13" font-family="Arial">P</text>'
'<text x="105" y="108" fill="#e53e3e" font-size="11" font-family="Arial">E</text>'
'<text x="209" y="108" fill="#e53e3e" font-size="11" font-family="Arial">F</text>'
'<path d="M152,50 A15,15 0 0,0 167,50" fill="none" stroke="#3b82f6" stroke-width="1.2"/>'
'<text x="153" y="62" fill="#3b82f6" font-size="9" font-family="Arial">120°</text>'
'<text x="102" y="148" fill="#3b82f6" font-size="9" font-family="Arial">6</text>'
'</svg>')

q6 = {
    "id": "math_jgeo080",
    "type": "single_choice",
    "question": "如图，△ABC中AB=AC，∠BAC=120°，AD平分∠BAC交BC于D。P是AD上一动点（异于A、D），PE⊥AB于E，PF⊥AC于F。若AB=6，则PE+PF等于(　)",
    "options": ["A.2√3", "B.3", "C.3√3", "D.4"],
    "answer": "C.3√3",
    "analysis": "【面积法——核心技巧】连接PB、PC。\nS△ABP+S△ACP=S△ABC（P总在AD上，左右两三角形面积之和恒等于总面积）。\n左边=(1/2)·AB·PE+(1/2)·AC·PF=(1/2)·6(PE+PF)=3(PE+PF)（因AB=AC=6）。\n右边S△ABC：作CH⊥AB，CH=AC·sin60°=6·(√3/2)=3√3。\nS△ABC=(1/2)·AB·CH=(1/2)·6·3√3=9√3。\n故3(PE+PF)=9√3，PE+PF=3√3（定值，与P的位置无关）。\n干扰项：A=2√3漏系数；B=3缺三角因子；D=4偏离。",
    "knowledge_tag": "角平分线模型",
    "topic": "几何证明",
    "difficulty": 5,
    "grade": 9,
    "image": svg6
}

# ========== 第7题：相似多层嵌套 ==========
svg7 = ('<svg viewBox="0 0 320 240" xmlns="http://www.w3.org/2000/svg">'
'<polygon points="140,35,50,195,270,195" fill="#ebf8ff" stroke="#2d3748" stroke-width="2"/>'
'<line x1="106" y1="123" x2="194" y2="123" stroke="#2d3748" stroke-width="1.5"/>'
'<line x1="140" y1="35" x2="166" y2="171" stroke="#e53e3e" stroke-width="1.2"/>'
'<circle cx="149" cy="93" r="3" fill="#e53e3e"/>'
'<circle cx="161" cy="142" r="3" fill="#10b981"/>'
'<text x="133" y="27" fill="#1a202c" font-size="14" font-family="Arial">A</text>'
'<text x="33" y="200" fill="#1a202c" font-size="14" font-family="Arial">B</text>'
'<text x="276" y="200" fill="#1a202c" font-size="14" font-family="Arial">C</text>'
'<text x="97" y="120" fill="#1a202c" font-size="12" font-family="Arial">D</text>'
'<text x="199" y="120" fill="#1a202c" font-size="12" font-family="Arial">E</text>'
'<text x="143" y="89" fill="#e53e3e" font-size="11" font-family="Arial">G</text>'
'<text x="167" y="183" fill="#10b981" font-size="11" font-family="Arial">H</text>'
'<text x="85" y="105" fill="#3b82f6" font-size="8" font-family="Arial">2:3</text>'
'</svg>')

q7 = {
    "id": "math_jgeo081",
    "type": "single_choice",
    "question": "如图，△ABC中D、E分别在AB、AC上，且DE∥BC。直线AG交DE于G、交BC于H。已知AD:DB=2:3，AE:EC=2:3。若AG=4，则GH的长为(　)",
    "options": ["A.4", "B.6", "C.8", "D.10"],
    "answer": "B.6",
    "analysis": "【第一步】∵DE∥BC且AD:DB=2:3，∴AD:AB=AE:AC=2:5。由△ADE∽△ABC得DG:BH=AD:AB=2:5？不对，G和H在过A的直线上。\n正确关系：由△ADG∽△ABH（AA相似，∠DAG=∠BAH公共，∠ADG=∠ABH因DE∥BC）：\nAG/AH=AD/AB=2/5。\n已知AG=4，则AH=4÷(2/5)=10。GH=AH−AG=10−4=6。\n干扰项：A=4对应误认为GH=AG；C=8对应比例用反；D=10是AH值。",
    "knowledge_tag": "相似三角形综合",
    "topic": "几何证明",
    "difficulty": 5,
    "grade": 9,
    "image": svg7
}

# ========== 第8题：圆幂定理 ==========
svg8 = ('<svg viewBox="0 0 320 240" xmlns="http://www.w3.org/2000/svg">'
'<circle cx="160" cy="120" r="53" fill="#ebf8ff" stroke="#2d3748" stroke-width="2"/>'
'<line x1="290" y1="120" x2="95" y2="84" stroke="#2d3748" stroke-width="1.8"/>'
'<line x1="290" y1="120" x2="107" y2="156" stroke="#2d3748" stroke-width="1.8"/>'
'<line x1="290" y1="120" x2="194" y2="72" stroke="#e53e3e" stroke-width="2"/>'
'<circle cx="160" cy="120" r="2" fill="#2d3748"/>'
'<text x="295" y="125" fill="#1a202c" font-size="14" font-family="Arial">P</text>'
'<text x="87" y="80" fill="#1a202c" font-size="13" font-family="Arial">A</text>'
'<text x="99" y="170" fill="#1a202c" font-size="13" font-family="Arial">B</text>'
'<text x="198" y="68" fill="#e53e3e" font-size="13" font-family="Arial">T</text>'
'<text x="152" y="138" fill="#1a202c" font-size="12" font-weight="bold" font-family="Arial">O</text>'
'<polyline points="191,70 186,80 196,80" fill="none" stroke="#ef4444" stroke-width="1"/>'
'<text x="260" y="100" fill="#3b82f6" font-size="9" font-family="Arial">4</text>'
'<text x="175" y="78" fill="#3b82f6" font-size="9" font-family="Arial">5</text>'
'<text x="222" y="88" fill="#e53e3e" font-size="9" font-weight="bold" font-family="Arial">6</text>'
'<text x="225" y="135" fill="#3b82f6" font-size="9" font-family="Arial">8</text>'
'</svg>')

q8 = {
    "id": "math_jgeo082",
    "type": "single_choice",
    "question": "如图，从⊙O外一点P引切线PT（T为切点）和割线PAB（A、B在⊙O上，顺序为P-A-B）。已知PA=4，AB=5，PT=6，PO=8。则⊙O的半径R为(　)",
    "options": ["A.2√3", "B.2√7", "C.4√2", "D.5"],
    "answer": "B.2√7",
    "analysis": "【第一步-圆幂定理】PT²=PA·PB。PT=6→PT²=36。PA=4，PB=PA+AB=9。验证：4×9=36 ✓数据自洽。\n【第二步-求半径】切线性质：OT⊥PT（T为切点）。Rt△OTP中：OT²=OP²−PT²=8²−6²=64−36=28。\nR=OT=√28=2√7。\n干扰项分析：A=2√3对应OP=√(12+36)=√48的情况；C=4√2对应OP=√(32+36)=√68；D=5对应OP=√61。",
    "knowledge_tag": "圆幂定理",
    "topic": "几何证明",
    "difficulty": 5,
    "grade": 9,
    "image": svg8
}

# ========== 第9题：坐标系抛物线面积 ==========
svg9 = ('<svg viewBox="0 0 320 240" xmlns="http://www.w3.org/2000/svg">'
'<rect x="30" y="20" width="280" height="200" fill="none" stroke="#94a3b8" stroke-width="1"/>'
'<line x1="30" y1="180" x2="310" y2="180" stroke="#94a3b8" stroke-width="1"/>'
'<path d="M50,180 Q90,20 130,180 Q170,20 210,180 Q250,20 290,180" fill="none" stroke="#3b82f6" stroke-width="2"/>'
'<polygon points="80,180,110,100,160,40,240,180" fill="#d1fae5" stroke="#2d3748" stroke-width="1.5" fill-opacity="0.5"/>'
'<circle cx="80" cy="180" r="3" fill="#2d3748"/>'
'<circle cx="240" cy="180" r="3" fill="#2d3748"/>'
'<circle cx="160" cy="40" r="3" fill="#e53e3e"/>'
'<circle cx="110" cy="100" r="3" fill="#10b981"/>'
'<text x="68" y="198" fill="#1a202c" font-size="12" font-family="Arial">A</text>'
'<text x="245" y="198" fill="#1a202c" font-size="12" font-family="Arial">B</text>'
'<text x="153" y="32" fill="#e53e3e" font-size="12" font-weight="bold" font-family="Arial">M</text>'
'<text x="95" y="95" fill="#10b981" font-size="12" font-family="Arial">C</text>'
'</svg>')

q9 = {
    "id": "math_jgeo083",
    "type": "single_choice",
    "question": "如图，抛物线y=−x²+bx+c经过点A(−1,0)和B(3,0)，与y轴交于C，顶点为M。则四边形AMCB的面积为(　)（注：按凸包顶点顺序A-C-M-B计算）",
    "options": ["A.6", "B.8", "C.9", "D.12"],
    "answer": "C.9",
    "analysis": "【求解析式】代入A(−1,0)：−1−b+c=0；代入B(3,0)：−9+3b+c=0。相减：4b=8→b=2，c=3。y=−x²+2x+3=−(x−1)²+4。\n【关键点坐标】顶点M=(1,4)；C=(0,3)（y轴截距）；A=(−1,0)；B=(3,0)。\n【鞋带公式求面积】凸包顺序A(−1,0)→C(0,3)→M(1,4)→B(3,0)→A：\nΣx_i·y_{i+1}=(−1)(3)+0(4)+1(0)+3(0)=−3\nΣy_i·x_{i+1}=0(0)+3(1)+4(3)+0(−1)=15\nS=|−3−15|/2=18/2=9。",
    "knowledge_tag": "坐标系几何综合",
    "topic": "几何证明",
    "difficulty": 5,
    "grade": 9,
    "image": svg9
}

# ========== 第10题：正方形组合MN距离 ==========
# 验算: A(0,0), B(3,0), C(0,4). 正方形ABDE中心M=(1.5,1.5). 正方形ACFG中心N=(-2,2)
# MN = sqrt((3.5)^2 + (-0.5)^2) = sqrt(12.25+0.25) = sqrt(12.5) = 5*sqrt(0.5) = 5*sqrt(2)/2
svg10 = ('<svg viewBox="0 0 320 240" xmlns="http://www.w3.org/2000/svg">'
'<polygon points="100,160,190,160,190,70,100,70" fill="#ebf8ff" stroke="#2d3748" stroke-width="1.5"/>'
'<polygon points="100,160,100,50,40,50,40,160" fill="#d1fae5" stroke="#2d3748" stroke-width="1.5"/>'
'<polygon points="100,160,190,160,40,160" fill="none" stroke="#2d3748" stroke-width="2"/>'
'<circle cx="145" cy="115" r="3" fill="#e53e3e"/>'
'<circle cx="70" cy="105" r="3" fill="#10b981"/>'
'<line x1="145" y1="115" x2="70" y2="105" stroke="#e53e3e" stroke-width="1.2" stroke-dasharray="3,2"/>'
'<text x="93" y="173" fill="#1a202c" font-size="14" font-family="Arial">A</text>'
'<text x="195" y="163" fill="#1a202c" font-size="14" font-family="Arial">B</text>'
'<text x="33" y="173" fill="#1a202c" font-size="14" font-family="Arial">C</text>'
'<text x="93" y="63" fill="#1a202c" font-size="13" font-family="Arial">E</text>'
'<text x="33" y="43" fill="#1a202c" font-size="13" font-family="Arial">F</text>'
'<text x="150" y="115" fill="#e53e3e" font-size="12" font-family="Arial">M</text>'
'<text x="58" y="100" fill="#10b981" font-size="12" font-family="Arial">N</text>'
'<text x="138" y="173" fill="#3b82f6" font-size="9" font-family="Arial">3</text>'
'<text x="63" y="145" fill="#3b82f6" font-size="9" font-family="Arial">4</text>'
'</svg>')

q10 = {
    "id": "math_jgeo084",
    "type": "single_choice",
    "question": "如图，以Rt△ABC的两条直角边AB、AC为边分别向外作正方形ABDE和ACFG，M、N分别为两个正方形的中心（对角线交点）。已知AB=3，AC=4，∠BAC=90°。则MN的长为(　)",
    "options": ["A.5√2/2", "B.5/2", "C.3√2", "D.5"],
    "answer": "A.5√2/2",
    "analysis": "【建系】A(0,0)，B(3,0)，C(0,4)（∠BAC=90°）。\n【正方形中心】ABDE向外：A(0,0), B(3,0), D(3,3), E(0,3)。中心M=((0+3)/2,(0+3)/2)=(1.5,1.5)。\nACFG向外：A(0,0), C(0,4), G(−4,4), F(−4,0)。中心N=((0+(−4))/2,(0+4)/2)=(−2,2)。\n【求MN】MN=√[(1.5−(−2))²+(1.5−2)²]=√[3.5²+(−0.5)²]=√[12.25+0.25]=√12.5=√(25/2)=5/√2=5√2/2。\n干扰项：B=5/2遗漏√2；C=3√2仅用AB；D=5=BC长度。",
    "knowledge_tag": "正方形与坐标综合",
    "topic": "几何证明",
    "difficulty": 5,
    "grade": 9,
    "image": svg10
}

new_qs = [q5, q6, q7, q8, q9, q10]
existing.extend(new_qs)

with open(OUTPUT, 'w', encoding='utf-8') as f:
    json.dump(existing, f, ensure_ascii=False, indent=2)

print(f"\n=== 后6题已构建并写入 ===")
print(f"总数: {len(existing)}")
for q in new_qs:
    print(f"  {q['id']}: ans={q['answer']}, tag={q['knowledge_tag']}")
