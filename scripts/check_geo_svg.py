import json

with open('src/data/questions_math_geometry_addon.json', 'r') as f:
    questions = json.load(f)

print("=" * 70)
print("第三部分：SVG手机适配性检查")
print("=" * 70)

svg_issues = []
text_issues = []
size_issues = []

for i, q in enumerate(questions):
    qid = q['id']
    svg = q.get('image', '')
    
    if not svg or '<svg' not in svg:
        svg_issues.append(f"{qid}: 无有效SVG!")
        continue
    
    # 检查1: viewBox和尺寸
    has_viewbox = 'viewBox' in svg
    has_width = 'width=' in svg
    has_height = 'height=' in svg
    
    # 检查2: 文字大小（手机上文字不能太小）
    import re
    font_sizes = re.findall(r'font-size=["\']?(\d+)["\']?', svg)
    small_fonts = [int(s) for s in font_sizes if int(s) < 10]
    
    if small_fonts:
        text_issues.append(f"{qid}: 存在font-size<10的文字: {small_fonts}")
    
    # 检查3: 固定宽高是否合理 (280x200是标准)
    w_match = re.search(r'width="(\d+)"', svg)
    h_match = re.search(r'height="(\d+)"', svg)
    
    if w_match and h_match:
        w, h = int(w_match.group(1)), int(h_match.group(1))
        if w > 350:
            size_issues.append(f"{qid}: width={w} 过宽(建议≤300)")
        if h > 250:
            size_issues.append(f"{qid}: height={h}过高(建议≤220)")
    
    # 检查4: SVG是否闭合
    if not svg.strip().endswith('</svg>'):
        svg_issues.append(f"{qid}: SVG未正确闭合")
    
    # 检查5: 是否有过于密集的内容（坐标超出viewBox）
    # 检查大坐标值
    high_coords = re.findall(r'[xy]\s*=\s*["\']?(\d{3,})["\']?', svg)
    if high_coords:
        max_coord = max(int(c) for c in high_coords)
        if max_coord > 290:
            svg_issues.append(f"{qid}: 坐标值{max_coord}可能超出viewBox范围")

# 统计问题
print(f"\n总题数: {len(questions)}")
print()

print("--- 文字大小问题 ---")
if text_issues:
    for t in text_issues[:15]:
        print(f"  ⚠️ {t}")
else:
    print("  ✅ 所有文字大小合适")

print("\n--- 尺寸问题 ---")
if size_issues:
    for s in size_issues:
        print(f"  ⚠️ {s}")
else:
    print("  ✅ SVG尺寸均在合理范围内")

print("\n--- 结构/坐标问题 ---")
if svg_issues:
    for s in svg_issues[:15]:
        print(f"  ❌ {s}")
else:
    print("  ✅ SVG结构均正常")

# 抽取3-4个典型SVG进行详细审查
print()
print("=" * 70)
print("第四部分：抽样SVG内容审查（每类选1个）")
print("=" * 70)

sample_ids = ['math_g036', 'math_g042', 'math_g048', 'math_g054', 
              'math_g060', 'math_g066', 'math_g069', 'math_g076']

for q in questions:
    if q['id'] in sample_ids:
        print(f"\n--- {q['id']} ({q['knowledge_tag']}) ---")
        print(q['image'][:200] + "..." if len(q['image']) > 200 else q['image'])
