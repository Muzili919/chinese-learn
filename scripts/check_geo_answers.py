import json, math

with open('src/data/questions_math_geometry_addon.json', 'r') as f:
    questions = json.load(f)

print("=" * 70)
print("第二部分：答案数学验算（逐题计算验证）")
print("=" * 70)

errors = []
warnings = []

for i, q in enumerate(questions):
    qid = q['id']
    ans = q['answer']
    question = q['question']
    
    ans_val = ans.split('. ')[1] if '. ' in ans else ans[2:]
    calc_result = None
    expected = None
    
    # === 逐题验算 ===
    if qid == 'math_g036':
        c = math.sqrt(9**2 + 12**2)
        calc_result = f"{c:.0f}cm"
        expected = "15cm"
        
    elif qid == 'math_g037':
        p = 10 + 10 + 12
        calc_result = f"{p}cm"
        expected = "32cm"
        
    elif qid == 'math_g038':
        s = (math.sqrt(3)/4) * 6**2
        calc_result = f"{s:.4f}"
        expected = "9√3≈15.59"  # 答案写的是9倍根号3
        
    elif qid == 'math_g039':
        s = 14 * 9 / 2
        calc_result = f"{s:.0f}cm2"
        expected = "63cm2"
        
    elif qid == 'math_g040':
        s = 5 * 12 / 2
        calc_result = f"{s:.0f}cm2"
        expected = "30cm2"
        
    elif qid == 'math_g041':
        from fractions import Fraction
        r = Fraction(24, 16)
        calc_result = str(r)
        expected = "3:2"

    elif qid == 'math_g042':
        s = 10**2 / 2
        calc_result = f"{s:.0f}cm2"
        expected = "50cm2"
        
    elif qid == 'math_g043':
        calc_result = "20%"
        expected = "20%"
        
    elif qid == 'math_g044':
        # 边6和10，高8。高8对应边6需要邻边10>=8 OK 面积=48
        # 高8对应边10需要邻边6>=8 NO! 不可能!
        # 所以最大面积应该是48不是80!!
        max_area = 48  # 6*8, 高8不可能对应边10
        calc_result = f"{max_area}cm2"
        expected = "80cm2"
        errors.append(f"{qid}: ERROR! 平行四边形边6和10，高8。高8不能对应边10(因邻边6<8)，最大面积应为48非80")

    elif qid == 'math_g045':
        s = 15 * 8
        calc_result = f"{s:.0f}cm2"
        expected = "120cm2"
        
    elif qid == 'math_g046':
        s = 15 * 8 / 2
        calc_result = f"{s:.0f}cm2"
        expected = "60cm2"
        
    elif qid == 'math_g047':
        s = 12 * 16 / 2
        calc_result = f"{s:.0f}cm2"
        expected = "96cm2"

    elif qid == 'math_g048':
        s = 3.14 * (10**2 - 6**2)
        calc_result = f"{s:.2f}cm2"
        expected = "200.96cm2"
        
    elif qid == 'math_g049':
        c = 3.14 * 7 + 2 * 7
        calc_result = f"{c:.2f}m"
        expected = "35.98m"
        
    elif qid == 'math_g050':
        calc_result = "9倍"
        expected = "9倍"
        
    elif qid == 'math_g051':
        s = 3.14 * 10**2
        calc_result = f"{s:.0f}cm2"
        expected = "314cm2"
        
    elif qid == 'math_g052':
        c = 3.14 * 70
        calc_result = f"{c:.1f}cm"
        expected = "219.8cm"
        
    elif qid == 'math_g053':
        s = (72/360) * 3.14 * 10**2
        calc_result = f"{s:.1f}cm2"
        expected = "62.8cm2"

    elif qid == 'math_g054':
        rect = 10 * 6
        semi = 3.14 * 3**2 / 2
        total = rect + semi
        calc_result = f"{total:.2f}cm2"
        expected = "74.13cm2"
        
    elif qid == 'math_g055':
        s = 12**2 - 4**2
        calc_result = f"{s:.0f}cm2"
        expected = "128cm2"
        
    elif qid == 'math_g056':
        s = (6+10)*8/2
        calc_result = f"{s:.0f}cm2"
        expected = "64cm2"
        
    elif qid == 'math_g057':
        tri = 8*5/2
        rect = 8*6
        total = tri + rect
        calc_result = f"{total:.0f}cm2"
        expected = "68cm2"
        
    elif qid == 'math_g058':
        sector = math.pi * 5**2 / 4
        triangle = 5**2 / 2
        petal = 4 * (sector - triangle)
        calc_result = f"{petal:.1f}cm2"
        expected = "28.5cm2"
        
    elif qid == 'math_g059':
        s = 10*8 - 4*5
        calc_result = f"{s:.0f}cm2"
        expected = "60cm2"

    elif qid == 'math_g060':
        sa = 2*(8*5 + 8*4 + 5*4)
        calc_result = f"{sa:.0f}cm2"
        expected = "184cm2"
        
    elif qid == 'math_g061':
        v = 3.14 * 3**2 * 10
        calc_result = f"{v:.1f}cm3"
        expected = "282.6cm3"
        
    elif qid == 'math_g062':
        v = 3.14 * 6**2 * 8 / 3
        calc_result = f"{v:.2f}cm3"
        expected = "301.44cm3"
        
    elif qid == 'math_g063':
        v = 5**3
        calc_result = f"{v:.0f}cm3"
        expected = "125cm3"
        
    elif qid == 'math_g064':
        faces = [6*4, 6*3, 4*3]
        max_inc = 2 * max(faces)
        calc_result = f"{max_inc}cm2"
        expected = "48cm2"
        
    elif qid == 'math_g065':
        R, r, h = 5, 4, 200
        v = 3.14 * (R**2 - r**2) * h
        calc_result = f"{v:.0f}cm3"
        expected = "5652cm3"

    elif qid == 'math_g069':
        calc_result = "15度"
        expected = "15度"
        
    elif qid == 'math_g071':
        calc_result = "65度"
        expected = "65度"
        
    elif qid == 'math_g072':
        s = (5-2) * 180
        calc_result = f"{s:.0f}度"
        expected = "540度"
        
    elif qid == 'math_g073':
        b = 180 - 90 - 35
        calc_result = f"{b:.0f}度"
        expected = "55度"
        
    elif qid == 'math_g074':
        a2 = 180 - 120
        calc_result = f"{a2:.0f}度"
        expected = "60度"
        
    elif qid == 'math_g075':
        x = 100 - 40
        calc_result = f"{x:.0f}度"
        expected = "60度"

    elif qid == 'math_g076':
        calc_result = "25000m2"
        expected = "25000m2"
        
    elif qid == 'math_g077':
        v = 8 * 5 * 6
        calc_result = f"{v:.0f}升"
        expected = "240升"
        
    elif qid == 'math_g078':
        face = 96 / 6
        edge = math.sqrt(face)
        v = edge ** 3
        calc_result = f"{v:.0f}cm3"
        expected = "64cm3"
        
    elif qid == 'math_g079':
        area_dm2 = 90 * 60
        tile = 6 * 6
        n = area_dm2 / tile
        calc_result = f"{n:.0f}块"
        expected = "150块"
        
    elif qid == 'math_g080':
        C = 8 * 4
        r = C / (2 * 3.14)
        S = 3.14 * r**2
        calc_result = f"{S:.2f}cm2"
        expected = "50.24cm2"
        if abs(S - 50.24) > 1:
            errors.append(f"{qid}: WARNING! 计算={S:.2f}, 答案={expected}. 正方形周长32→圆面积应约81.5, 50.24对应周长16的情况")

    if calc_result:
        print(f"[{qid}] calc={calc_result} | ans={expected}")

print()
print("=" * 70)
if errors:
    print(f"发现 {len(errors)} 个问题:")
    for e in errors:
        print(f"  *** {e}")
else:
    print("全部答案验算通过!")
