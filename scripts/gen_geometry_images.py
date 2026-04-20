#!/usr/bin/env python3
"""
几何题SVG配图生成器
为questions_math_geometry.json中的每道题生成内嵌SVG配图
"""

import json
import math
import re
import sys

INPUT_FILE = 'src/data/questions_math_geometry.json'
OUTPUT_FILE = 'src/data/questions_math_geometry.json'

# ─── SVG 工具函数 ─────────────────────────────────────

def svg_header(w=280, h=200):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">'

def svg_footer():
    return '</svg>'

def make_svg(*elements, w=280, h=200):
    parts = [svg_header(w, h)]
    parts.extend(elements)
    parts.append(svg_footer())
    return '\n  '.join(parts)

# 颜色方案（教育风格，清晰明亮）
C = {
    'stroke': '#2d3748',      # 深灰线条
    'fill_light': '#ebf8ff',   # 浅蓝填充
    'fill_accent': '#fef3c7',  # 浅黄填充
    'fill_green': '#d1fae5',   # 浅绿填充
    'fill_red': '#fee2e2',     # 浅红填充
    'fill_purple': '#e9d5ff',  # 浅紫填充
    'highlight': '#ef4444',    # 红色高亮
    'accent': '#3b82f6',       # 蓝色强调
    'text': '#374151',         # 文字颜色
    'text_light': '#6b7280',   # 浅文字
    'grid': '#f3f4f6',         # 网格线
    'dashed': '#9ca3af',       # 虚线
}

# 基础图形生成器
def rect(x, y, w, h, fill='none', stroke=C['stroke'], sw=2, rx=0, dashed=None, label=None, label_pos=None):
    dash = f' stroke-dasharray="{dashed}"' if dashed else ''
    rxf = f' rx="{rx}"' if rx else ''
    s = f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{dash}{rxf}/>'
    if label and label_pos:
        s += text(label, label_pos[0], label_pos[1])
    return s

def circle(cx, cy, r, fill='none', stroke=C['stroke'], sw=2, dashed=None, label=None):
    dash = f' stroke-dasharray="{dashed}"' if dashed else ''
    s = f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"{dash}/>'
    if label:
        s += text(label, cx, cy + r + 16)
    return s

def ellipse(cx, cy, rx, ry, fill='none', stroke=C['stroke'], sw=2):
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>'

def line(x1, y1, x2, y2, stroke=C['stroke'], sw=2, dashed=None):
    dash = f' stroke-dasharray="{dashed}"' if dashed else ''
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{stroke}" stroke-width="{sw}"{dash}/>'

def polyline(points, fill='none', stroke=C['stroke'], sw=2, closed=False):
    pts = ' '.join(f'{x},{y}' for x, y in points)
    tag = 'polygon' if closed else 'polyline'
    return f'<{tag} points="{pts}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>'

def polygon(points, fill='none', stroke=C['stroke'], sw=2):
    pts = ' '.join(f'{x},{y}' for x, y in points)
    return f'<polygon points="{pts}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>'

def text(t, x, y, size=14, fill=C['text'], anchor='middle', bold=False):
    fw = ' font-weight="bold"' if bold else ''
    # 转义XML特殊字符
    t = t.replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    return f'<text x="{x}" y="{y}" font-size="{size}" fill="{fill}" text-anchor="{anchor}"{fw}>{t}</text>'

def right_angle_mark(x, y, size=12):
    """直角标记"""
    sc = C['stroke']
    pts = f"{x+size},{y} {x+size},{y-size} {x},{y-size}"
    return '<polyline points="' + pts + '" fill="none" stroke="' + sc + '" stroke-width="1.5"/>'

def dimension_line(x1, y1, x2, y2, label, offset=15, orient='h'):
    """尺寸标注线（水平或垂直）"""
    if orient == 'h':
        ly = y1 + offset
        parts = [
            line(x1, y1, x1, ly, sw=1, stroke=C['text_light']),
            line(x2, y2, x2, ly, sw=1, stroke=C['text_light']),
            line(x1, ly, x2, ly, sw=1, stroke=C['dashed']),
            text(label, (x1+x2)/2, ly + 14, size=12, fill=C['text_light'])
        ]
    else:
        lx = x1 + offset
        parts = [
            line(x1, y1, lx, y1, sw=1, stroke=C['text_light']),
            line(x2, y2, lx, y2, sw=1, stroke=C['text_light']),
            line(lx, y1, lx, y2, sw=1, stroke=C['dashed']),
            text(label, lx + 4, (y1+y2)/2 + 5, size=12, fill=C['text_light'], anchor='start')
        ]
    return '\n    '.join(parts)

def arc(cx, cy, r, start_deg, end_deg, fill='none', stroke=C['stroke'], sw=2):
    """弧线"""
    start_rad = math.radians(start_deg)
    end_rad = math.radians(end_deg)
    x1 = cx + r * math.cos(start_rad)
    y1 = cy + r * math.sin(start_rad)
    x2 = cx + r * math.cos(end_rad)
    y2 = cy + r * math.sin(end_deg)
    large_arc = 1 if (end_deg - start_deg) > 180 else 0
    return (f'<path d="M {x1:.1f} {y1:.1f} A {r} {r} 0 {large_arc} 1 {x2:.1f} {y2:.1f}" '
            f'fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>')

def angle_arc(cx, cy, r, start_deg, end_deg, label=None, label_r=None):
    """角度标记弧"""
    lr = label_r or (r + 14)
    a = arc(cx, cy, r, start_deg, end_deg, stroke=C['accent'], sw=1.5)
    mid_rad = math.radians((start_deg + end_deg) / 2)
    if label:
        lx = cx + lr * math.cos(mid_rad)
        ly = cy + lr * math.sin(mid_rad)
        a += text(label, lx, ly + 4, size=12, fill=C['accent'])
    return a


# ─── 每道题的配图生成函数 ──────────────────────────────

# g001: 三角形内角比1:2:3 → 直角三角形(30°,60°,90°)
def img_g001():
    # 30-60-90三角形，底边水平
    A = (40, 160)   # 左下30°
    B = (220, 160)  # 右下
    C = (140, 62)   # 上方90°顶点
    return make_svg(
        polygon([A, B, C], fill=C['fill_light'], sw=2),
        right_angle_mark(C[0], C[1]+18, size=14),
        text('A', A[0]-14, A[1]+8, size=13, fill=C['accent']),
        text('B', B[0]+14, B[1]+8, size=13, fill=C['accent']),
        text('C', C[0], C[1]-12, size=13, fill=C['accent']),
        angle_arc(A[0], A[1], 28, -150, -120, '30°'),
        angle_arc(B[0], B[1], 28, -60, -30, '60°'),
        text('1:2:3', 130, 190, size=12, fill=C['text_light']),
    )

# g002: 平行四边形 底8 高5
def img_g002():
    return make_svg(
        polygon([(50,150), (210,150), (250,70), (90,70)], fill=C['fill_light'], sw=2),
        # 高（虚线）
        line(90, 70, 90, 150, dashed='6,4', stroke=C['highlight']),
        dimension_line(50, 165, 210, 165, '底 8cm', offset=10),
        text('高 5cm', 75, 115, size=11, fill=C['highlight'], anchor='end'),
        text('h', 96, 115, size=11, fill=C['highlight']),
    )

# g003: 梯形 上4 下8 高6
def img_g003():
    return make_svg(
        polygon([(80,140), (200,140), (240,60), (120,60)], fill=C['fill_accent'], sw=2),
        line(120, 60, 120, 140, dashed='5,3', stroke=C['highlight']),
        dimension_line(80, 155, 200, 155, '下底 8cm', offset=8),
        dimension_line(120, 48, 240, 48, '上底 4cm', offset=-12),
        text('高\n6cm', 105, 105, size=11, fill=C['highlight'], anchor='end'),
    )

# g004: 圆 半径5cm
def img_g004():
    cx, cy, r = 140, 105, 65
    return make_svg(
        circle(cx, cy, r, fill=C['fill_light'], sw=2.5),
        line(cx, cy, cx+r, cy, stroke=C['accent'], sw=2),  # 半径
        line(cx, cy, cx, cy, stroke=C['stroke'], sw=1.5),   # 圆心点
        circle(cx, cy, 3, fill=C['stroke']),                  # 圆心
        text('O', cx-10, cy-8, size=13, fill=C['accent']),
        text('r = 5cm', cx + r/2, cy - 10, size=13, fill=C['accent'], bold=True),
        text('πr² = ?', cx, cy + 40, size=14, fill=C['text'], bold=True),
    )

# g005: 圆 直径10cm 求周长
def img_g005():
    cx, cy, r = 140, 100, 55
    return make_svg(
        circle(cx, cy, r, fill=C['fill_green'], sw=2.5),
        line(cx-r, cy, cx+r, cy, stroke=C['accent'], sw=2),  # 直径
        circle(cx, cy, 3, fill=C['stroke']),
        text('O', cx+6, cy-8, size=13, fill=C['accent']),
        text('d = 10cm', cx, cy-20, size=13, fill=C['accent'], bold=True),
        text('C = πd = ?', cx, cy + 38, size=14, fill=C['text'], bold=True),
    )

# g006: 三角形底12高6 与平行四边形等面积
def img_g006():
    return make_svg(
        text('等面积 = 36 cm²', 140, 25, size=14, bold=True, fill=C['accent']),
        # 三角形
        text('三角形', 70, 50, size=12, fill=C['text'], bold=True),
        polygon([(30,145), (110,145), (70,75)], fill=C['fill_light'], sw=2),
        dimension_line(30, 155, 110, 155, '底 12cm', offset=8),
        text('高 6cm', 112, 115, size=10, fill=C['text_light']),
        # 平行四边形
        text('平行四边形', 195, 50, size=12, fill=C['text'], bold=True),
        polygon([(160,145), (236,145), (256,95), (180,95)], fill=C['fill_accent'], sw=2),
        dimension_line(160, 155, 236, 155, '底 9cm', offset=8),
        text('高 = ?', 258, 125, size=11, fill=C['highlight'], bold=True),
        w=270, h=185,
    )

# g007: 长8宽5 求周长
def img_g007():
    return make_svg(
        rect(70, 60, 140, 100, fill=C['fill_light'], sw=2.5),
        dimension_line(70, 175, 210, 175, '长 8cm', offset=8),
        dimension_line(215, 60, 215, 100, '宽 5cm', offset=8, orient='v'),
        text('周长 = ?', 140, 45, size=14, bold=True, fill=C['accent']),
    )

# g008: 正方形边长6 面积和周长
def img_g008():
    return make_svg(
        rect(85, 50, 110, 110, fill=C['fill_green'], sw=2.5),
        dimension_line(85, 170, 195, 170, '边长 6cm', offset=8),
        text('S = 6² = ?  |  C = 4×6 = ?', 140, 32, size=13, bold=True, fill=C['accent']),
    )

# g009: 环形草坪半径7m 路1m宽
def img_g009():
    cx, cy = 140, 105
    return make_svg(
        circle(cx, cy, 70, fill=C['fill_green'], sw=2),     # 内圆(草坪)
        circle(cx, cy, 84, fill='none', stroke=C['accent'], sw=2.5, dashed='6,3'), # 外圆
        line(cx, cy, cx+84, cy, stroke=C['text_light'], sw=1),
        circle(cx, cy, 3, fill=C['stroke']),
        text('O', cx-10, cy-8, size=12, fill=C['accent']),
        text('r=7m', cx+30, cy-6, size=11, fill=C['accent']),
        text('路宽1m', cx+68, cy-14, size=10, fill=C['highlight']),
        text('小路面积=?', cx, cy+100, size=13, bold=True, fill=C['highlight']),
    )

# g010: 长方体 6×4×3 求体积
def img_g010():
    # 斜二测画法
    f = lambda p: (p[0] - p[2]*0.4, p[1] - p[2]*0.35)
    p0 = f((70, 140, 0)); p1 = f((190, 140, 0))
    p2 = f((190, 90, 0));  p3 = f((70, 90, 0))
    p4 = f((70, 140, 35)); p5 = f((190, 140, 35))
    p6 = f((190, 90, 35));  p7 = f((70, 90, 35))
    return make_svg(
        # 后面（虚）
        polyline([p4, p5, p6, p7], fill='none', stroke=C['dashed'], sw=1.5),
        line(p4[0], p4[1], p0[0], p0[1], stroke=C['dashed'], sw=1.5),
        line(p7[0], p7[1], p3[0], p3[1], stroke=C['dashed'], sw=1.5),
        # 前面（实）
        polygon([p0, p1, p2, p3], fill=C['fill_light'], sw=2),
        line(p1[0], p1[1], p5[0], p5[1], stroke=C['stroke'], sw=2),
        line(p2[0], p2[1], p6[0], p6[1], stroke=C['stroke'], sw=2),
        # 标注
        text('6cm', (p0[0]+p1[0])/2, p0[1]+16, size=12, fill=C['text']),
        text('3cm', p1[0]+12, (p1[1]+p2[1])/2, size=12, fill=C['text']),
        text('4cm', p0[0]-18, (p0[1]+p3[1])/2+4, size=12, fill=C['text']),
        text('V = 6×4×3 = ?', 140, 24, size=14, bold=True, fill=C['accent']),
    )

# g011: 正方体棱长4 求表面积
def img_g011():
    f = lambda p: (p[0] - p[2]*0.4, p[1] - p[2]*0.35)
    s = 72
    p0 = f((84, 140, 0)); p1 = f((84+s, 140, 0))
    p2 = f((84+s, 140-s, 0)); p3 = f((84, 140-s, 0))
    p4 = f((84, 140, s*0.7)); p5 = f((84+s, 140, s*0.7))
    p6 = f((84+s, 140-s, s*0.7)); p7 = f((84, 140-s, s*0.7))
    return make_svg(
        polyline([p4, p5, p6, p7], fill='none', stroke=C['dashed'], sw=1.5),
        line(p4[0], p4[1], p0[0], p0[1], stroke=C['dashed'], sw=1.5),
        line(p7[0], p7[1], p3[0], p3[1], stroke=C['dashed'], sw=1.5),
        polygon([p0, p1, p2, p3], fill=C['fill_accent'], sw=2),
        line(p1[0], p1[1], p5[0], p5[1], stroke=C['stroke'], sw=2),
        line(p2[0], p2[1], p6[0], p6[1], stroke=C['stroke'], sw=2),
        text('a = 4cm', 140, 22, size=13, bold=True, fill=C['accent']),
        text('表面积 = 6a² = ?', 140, 192, size=13, bold=True, fill=C['highlight']),
    )

# g012: 圆柱 r=3 h=10 求体积
def img_g012():
    cx, cy = 100, 110
    top_cx = cx + 55
    return make_svg(
        # 底椭圆
        ellipse(cx, cy+50, 50, 18, fill=C['fill_light'], sw=2),
        # 侧面
        line(cx-50, cy+50, cx-50, cy-30, stroke=C['stroke'], sw=2),
        line(cx+50, cy+50, cx+50, cy-30, stroke=C['stroke'], sw=2),
        # 顶椭圆
        ellipse(top_cx, cy-30, 50, 18, fill=C['fill_accent'], sw=2),
        # 标注
        text('r = 3cm', top_cx, cy-55, size=12, fill=C['accent'], bold=True),
        text('h = 10cm', cx+58, cy+10, size=12, fill=C['text'], bold=True),
        line(cx+52, cy-28, cx+52, cy+48, stroke=C['text_light'], sw=1, dashed='4,3'),
        text('V = πr²h = ?', top_cx, cy+82, size=14, bold=True, fill=C['highlight']),
    )

# g013: 圆锥 r=6 h=10 求体积
def img_g013():
    cx, cy = 100, 135
    tx = cx + 55
    ty = cy - 90
    return make_svg(
        ellipse(cx, cy, 55, 18, fill=C['fill_light'], sw=2),
        line(cx-55, cy, tx, ty, stroke=C['stroke'], sw=2),
        line(cx+55, cy, tx, ty, stroke=C['stroke'], sw=2),
        # 顶弧（前半）
        arc(tx, ty-5, 55, 180, 360, fill='none', stroke=C['stroke'], sw=2),
        # 顶虚线（后半）
        arc(tx, ty-5, 55, 0, 180, fill='none', stroke=C['dashed'], sw=1.5),
        text('r = 6cm', cx, cy+22, size=12, fill=C['accent'], bold=True),
        text('h = 10cm', tx+10, ty+45, size=12, fill=C['text'], bold=True),
        text('V = ⅓πr²h = ?', tx, cy+55, size=14, bold=True, fill=C['highlight']),
    )

# g014: 等底等高圆柱圆锥体积比
def img_g014():
    # 左边圆柱
    c1x = 65
    c2x = 195
    return make_svg(
        # 圆柱
        ellipse(c1x, 140, 40, 14, fill=C['fill_light'], sw=2),
        line(c1x-40, 140, c1x-40, 65, sw=2),
        line(c1x+40, 140, c1x+40, 65, sw=2),
        ellipse(c1x+30, 65, 40, 14, fill=C['fill_light'], sw=2),
        text('圆柱 V=60', c1x, 168, size=12, bold=True, fill=C['accent']),
        # 右边圆锥
        ellipse(c2x, 140, 40, 14, fill=C['fill_accent'], sw=2),
        line(c2x-40, 140, c2x+30, 65, sw=2),
        line(c2x+40, 140, c2x+30, 65, sw=2),
        arc(c2x+30, 58, 40, 180, 360, fill='none', sw=2),
        arc(c2x+30, 58, 40, 0, 180, fill='none', stroke=C['dashed'], sw=1.5),
        text('圆锥 V=?', c2x, 168, size=12, bold=True, fill=C['highlight']),
        text('等底等高', 140, 188, size=12, fill=C['text_light']),
        w=260, h=205,
    )

# g015: 圆柱侧面展开
def img_015():
    return make_svg(
        # 左侧圆柱示意
        ellipse(60, 100, 30, 12, fill=C['fill_light'], sw=2),
        line(30, 100, 30, 55, sw=2),
        line(90, 100, 90, 55, sw=2),
        ellipse(80, 55, 30, 12, fill=C['fill_light'], sw=2),
        text('圆柱', 60, 128, size=11),
        # 展开箭头
        text('→', 118, 88, size=22, fill=C['accent'], bold=True),
        # 右侧展开的长方形
        rect(142, 42, 110, 116, fill=C['fill_accent'], sw=2.5),
        text('展开图', 197, 30, size=12, fill=C['text']),
        text('长 = 底面周长', 197, 172, size=12, fill=C['accent'], bold=True),
        text('宽 = h', 197, 26, size=11, fill=C['text_light']),
        w=268, h=190,
    )

# g016-g019: 单位换算（信息图表风格）
def _unit_chart(title, conversions, color=None):
    lines = [f'<rect x="0" y="0" width="280" height="{30+len(conversions)*36}" rx="12" fill="#f8fafc" stroke="#e2e8f0"/>']
    lines.append(text(title, 140, 24, size=15, bold=True, fill=C['accent']))
    for i, (from_u, to_u, val) in enumerate(conversions):
        y = 50 + i * 36
        lines.append(rect(15, y-14, 250, 30, fill='#ffffff', stroke='#e5e7eb', sw=1, rx=8))
        lines.append(text(from_u, 60, y+5, size=14, fill=C['text']))
        lines.append(text('=', 115, y+5, size=14, fill=C['text_light']))
        lines.append(text(to_u, 165, y+5, size=14, bold=True, fill=C['accent']))
        lines.append(text(val, 225, y+5, size=13, fill=C['text_light']))
    h = 30+len(conversions)*36
    return make_svg(*lines, w=280, h=h)

def img_g016(): return _unit_chart('长度单位进率', [('1 米 (m)', '100 厘米 (cm)', '10²'), ('1 分米 (dm)', '10 厘米 (cm)', '10¹')])
def img_g017(): return _unit_chart('面积单位进率', [('1 m²', '100 dm²', '10²'), ('1 dm²', '100 cm²', '10²'), ('注意：长度进率的平方！', '', '')])
def img_g018(): return _unit_chart('容积与体积对应', [('1 升 (L)', '1 立方分米 (dm³)', '='), ('1 毫升 (mL)', '1 立方厘米 (cm³)', '='), ('1 L', '1000 mL', '10³')])
def img_g019(): return _unit_chart('土地面积单位', [('1 km²', '100 公顷 (ha)', ''), ('1 公顷', '10000 m²', '100×100m'), ('2.5 km²', '? 公顷', '')])

# g020: 长方体表面积 6×4×3
def img_g020():
    f = lambda p: (p[0] - p[2]*0.4, p[1] - p[2]*0.35)
    p0 = f((70, 140, 0)); p1 = f((190, 140, 0))
    p2 = f((190, 90, 0));  p3 = f((70, 90, 0))
    p4 = f((70, 140, 35)); p5 = f((190, 140, 35))
    p6 = f((190, 90, 35));  p7 = f((70, 90, 35))
    return make_svg(
        polyline([p4, p5, p6, p7], fill='none', stroke=C['dashed'], sw=1.5),
        line(p4[0], p4[1], p0[0], p0[1], stroke=C['dashed'], sw=1.5),
        line(p7[0], p7[1], p3[0], p3[1], stroke=C['dashed'], sw=1.5),
        polygon([p0, p1, p2, p3], fill=C['fill_light'], sw=2),
        line(p1[0], p1[1], p5[0], p5[1], sw=2),
        line(p2[0], p2[1], p6[0], p6[1], sw=2),
        text('S表 = 2(lw+lh+wh) = ?', 140, 24, size=13, bold=True, fill=C['accent']),
        text('6个面！', 140, 196, size=12, fill=C['highlight']),
    )

# g021: 对称轴数量比较
def img_g021():
    return make_svg(
        text('对称轴数量对比', 140, 22, size=14, bold=True, fill=C['accent']),
        # 等腰三角形
        text('① 等腰△', 45, 48, size=11, fill=C['text']),
        polygon([(45, 130), (15, 90), (75, 90)], fill=C['fill_light'], sw=2),
        line(45, 130, 45, 90, stroke=C['accent'], sw=1.5, dashed='4,2'),
        text('1条', 45, 148, size=12, bold=True, fill=C['accent']),
        # 正方形
        text('② 正方形', 140, 48, size=11, fill=C['text']),
        rect(115, 70, 50, 50, fill=C['fill_green'], sw=2),
        line(115, 95, 165, 95, stroke=C['accent'], sw=1, dashed='3,2'),
        line(140, 70, 140, 120, stroke=C['accent'], sw=1, dashed='3,2'),
        text('4条', 140, 138, size=12, bold=True, fill=C['accent']),
        # 圆
        text('③ 圆', 235, 48, size=11, fill=C['text']),
        circle(235, 95, 25, fill=C['fill_red'], sw=2),
        line(235, 70, 235, 120, stroke=C['accent'], sw=1, dashed='3,2'),
        line(210, 95, 260, 95, stroke=C['accent'], sw=1, dashed='3,2'),
        text('无数条', 235, 138, size=12, bold=True, fill=C['accent']),
        w=280, h=165,
    )

# g022: 三角形三边关系 5, 8, ?
def img_g022():
    return make_svg(
        text('三角形三边关系定理', 140, 24, size=14, bold=True, fill=C['accent']),
        # 两边固定
        line(40, 130, 180, 130, stroke=C['stroke'], sw=2.5),
        text('5cm', 110, 146, size=12, bold=True),
        text('8cm', 195, 122, size=12, bold=True),
        # 第三边范围示意（弧）
        arc(40, 130, 100, -30, 30, fill='none', stroke=C['dashed'], sw=1.5),
        text('|8-5| < 第3边 < 8+5', 140, 78, size=13, fill=C['text']),
        text('3 < 第三边 < 13', 140, 100, size=14, bold=True, fill=C['highlight']),
        text('整数最小值：4cm ✓', 140, 170, size=13, bold=True, fill=C['accent']),
    )

# g023: 半圆周长 直径10cm
def img_g023():
    cx, cy, r = 140, 110, 55
    return make_svg(
        # 半圆
        arc(cx, cy+r, r, 0, 180, fill=C['fill_light'], stroke=C['stroke'], sw=2.5),
        line(cx-r, cy+r, cx+r, cy+r, stroke=C['stroke'], sw=2.5),
        # 弧长标注
        text('半圆弧长', cx, cy+10, size=11, fill=C['accent']),
        text('πd÷2 = 15.7cm', cx, cy+26, size=11, fill=C['accent']),
        # 直径标注
        text('+ 直径 d = 10cm', cx, cy+r+22, size=12, fill=C['text']),
        # 结果
        text('半圆周长 = 15.7 + 10 = 25.7cm', cx, cy+r+50, size=14, bold=True, fill=C['highlight']),
    )

# g024: 正方形剪四角折成纸盒
def img_g024():
    return make_svg(
        text('剪去四角各1cm正方形 → 折成无盖盒', 140, 22, size=13, bold=True, fill=C['accent']),
        # 展开图
        rect(70, 45, 140, 140, fill=C['fill_light'], sw=2),
        # 四角标记剪去
        rect(70, 45, 20, 20, fill=C['fill_red'], sw=1.5, dashed='4,2'),
        rect(190, 45, 20, 20, fill=C['fill_red'], sw=1.5, dashed='4,2'),
        rect(70, 165, 20, 20, fill=C['fill_red'], sw=1.5, dashed='4,2'),
        rect(190, 165, 20, 20, fill=C['fill_red'], sw=1.5, dashed='4,2'),
        text('1cm', 82, 62, size=9, fill=C['highlight']),
        text('原边长6cm', 140, 200, size=12, fill=C['text']),
        text('底面 = (6-2)² = 16cm²', 140, 218, size=12, bold=True, fill=C['accent']),
        text('容积 = 16 × 1 = 16cm³', 140, 236, size=13, bold=True, fill=C['highlight']),
        w=280, h=255,
    )

# g025: 铁丝弯成正方形再改圆形
def img_025():
    return make_svg(
        text('等周长变形：正方形 → 圆', 140, 22, size=14, bold=True, fill=C['accent']),
        # 正方形
        text('周长 = 4×8 = 32cm', 70, 50, size=11, fill=C['text']),
        rect(30, 65, 80, 80, fill=C['fill_light'], sw=2.5),
        text('边长 8cm', 70, 158, size=12, fill=C['text']),
        # 箭头
        text('→ 改弯成圆 →', 140, 115, size=14, fill=C['text_light']),
        # 圆
        text('周长 = 2πr = 32cm', 210, 50, size=11, fill=C['text']),
        circle(210, 108, 42, fill=C['fill_accent'], sw=2.5),
        text('r ≈ 5.1cm', 210, 162, size=12, bold=True, fill=C['accent']),
        w=280, h=185,
    )

# g026: 360cm → ?m
def img_g026(): return _unit_chart('小单位→大单位（除以进率）', [('360 cm', '÷ 100', ''), ('小数点左移2位', '', ''), ('= 3.6 m', '', '✓')])

# g027: 1公顷 = ?平方米
def img_g027(): return _unit_chart('公顷与平方米', [('1 公顷 (ha)', '= 10000 m²', ''), ('即：100m × 100m', '的正方形', ''), ('记忆：1km² = 100 ha', '', '')])

# g028: 圆柱水桶 d=40 h=50 求装水量
def img_g028():
    cx, cy = 100, 120
    return make_svg(
        ellipse(cx, cy+40, 50, 17, fill=C['fill_light'], sw=2),
        line(cx-50, cy+40, cx-50, cy-35, sw=2),
        line(cx+50, cy+40, cx+50, cy-35, sw=2),
        ellipse(cx+45, cy-35, 50, 17, fill=C['fill_accent'], sw=2),
        text('d = 40cm → r = 20cm', cx+45, cy-56, size=11, fill=C['accent'], bold=True),
        text('h = 50cm', cx+55, cy+8, size=11, fill=C['text'], bold=True),
        text('V = π×20²×50 = 62800cm³', cx, cy+75, size=12, fill=C['text']),
        text('=? 升 (1L=1000cm³)', cx, cy+93, size=13, bold=True, fill=C['highlight']),
        text('🪣 水桶', cx-55, cy+50, size=16),
    )

# g029: 两个相同直角三角形拼合
def img_g029():
    return make_svg(
        text('两个全等的直角三角形', 140, 22, size=13, bold=True, fill=C['accent']),
        # 拼成长方形
        text('斜边对齐 → 长方形', 70, 46, size=11, fill=C['text']),
        polygon([(30,130), (110,130), (110,70), (30,70)], fill=C['fill_light'], sw=2),
        line(30, 70, 110, 130, stroke=C['accent'], sw=1, dashed='3,2'),
        # 拼成平行四边形
        text('斜边对齐 → 平行四边形', 190, 46, size=11, fill=C['text']),
        polygon([(160,130), (240,130), (210,70), (130,70)], fill=C['fill_accent'], sw=2),
        line(130, 70, 210, 130, stroke=C['accent'], sw=1, dashed='3,2'),
        text('✓ 两种都能拼！', 140, 155, size=13, bold=True, fill=C['accent']),
        w=275, h=170,
    )

# g030: 哪个立体有且只有两个圆形面？
def img_g030():
    return make_svg(
        text('哪个只有2个圆形面？', 140, 20, size=14, bold=True, fill=C['accent']),
        # 圆锥
        text('A. 圆锥', 40, 44, size=11, fill=C['text']),
        ellipse(40, 90, 25, 9, fill=C['fill_light'], sw=1.5),
        line(15, 90, 55, 55, sw=1.5), line(65, 90, 55, 55, sw=1.5),
        text('1个圆面', 40, 112, size=10, fill=C['text_light']),
        # 球
        text('B. 球', 110, 44, size=11, fill=C['text']),
        circle(110, 77, 20, fill=C['fill_green'], sw=1.5),
        text('0个平面', 110, 112, size=10, fill=C['text_light']),
        # 圆柱（答案）
        text('C. 圆柱 ✄', 180, 44, size=11, fill=C['accent'], bold=True),
        ellipse(180, 92, 28, 10, fill=C['fill_accent'], sw=2),
        line(152, 92, 152, 55, sw=2), line(208, 92, 208, 55, sw=2),
        ellipse(198, 55, 28, 10, fill=C['fill_accent'], sw=2),
        text('2个圆面 ✓', 180, 117, size=11, bold=True, fill=C['accent']),
        # 正方体
        text('D. 正方体', 245, 44, size=11, fill=C['text']),
        rect(228, 57, 34, 34, fill=C['fill_light'], sw=1.5),
        text('6个方面', 245, 102, size=10, fill=C['text_light']),
        w=285, h=135,
    )

# g031: 绕轴旋转得什么？
def img_031():
    return make_svg(
        text('绕轴旋转一周的旋转体', 140, 20, size=14, bold=True, fill=C['accent']),
        # 长方形 → 圆柱
        text('长方形', 55, 46, size=11, fill=C['text']),
        rect(35, 55, 50, 70, fill=C['fill_light'], sw=2),
        line(35, 55, 35, 40, stroke=C['dashed'], sw=1.5),
        text('轴', 35, 33, size=9, fill=C['dashed']),
        text('↓ 旋转', 60, 143, size=11, fill=C['accent']),
        # 圆柱结果
        ellipse(175, 85, 28, 10, fill=C['fill_accent'], sw=2),
        line(147, 85, 147, 50, sw=2), line(203, 85, 203, 50, sw=2),
        ellipse(196, 50, 28, 10, fill=C['fill_accent'], sw=2),
        text('= 圆柱 ✓', 175, 113, size=12, bold=True, fill=C['accent']),
        w=245, h=160,
    )

# g032: 梯形面积反求下底 S=60 h=6 上底=7
def img_032():
    return make_svg(
        polygon([(70,130), (200,130), (230,60), (100,60)], fill=C['fill_accent'], sw=2.5),
        line(100, 60, 100, 130, dashed='5,3', stroke=C['highlight']),
        dimension_line(70, 145, 200, 145, '上底 7cm', offset=8),
        dimension_line(100, 48, 230, 48, '下底 ? cm', offset=-12),
        text('高 6cm', 88, 100, size=11, fill=C['highlight'], anchor='end'),
        text('面积 = 60cm²', 150, 175, size=13, bold=True, fill=C['accent']),
    )

# g033: 圆柱表面积公式选择
def img_033():
    cx, cy = 100, 105
    tx = cx + 50
    return make_svg(
        ellipse(cx, cy+45, 45, 16, fill=C['fill_light'], sw=2),
        line(cx-45, cy+45, cx-45, cy-25, sw=2),
        line(cx+45, cy+45, cx+45, cy-25, sw=2),
        ellipse(tx, cy-25, 45, 16, fill=C['fill_accent'], sw=2),
        # 标注各部分
        text('上底 πr²', tx, cy-45, size=10, fill=C['accent']),
        text('下底 πr²', cx, cy+70, size=10, fill=C['accent']),
        text('侧面积 2πrh', cx+52, cy+12, size=10, fill=C['highlight']),
        text('S表 = 2πr² + 2πrh', 140, 182, size=14, bold=True, fill=C['highlight']),
    )

# g034: 15000m² = ?公顷
def img_034(): return _unit_chart('大面积换算', [('15000 m²', '÷ 10000', ''), ('小数点左移4位', '', ''), ('= 1.5 公顷 (ha)', '', '✓')])

# g035: 正方体体对角线 棱长4
def img_035():
    f = lambda p: (p[0] - p[2]*0.45, p[1] - p[2]*0.35)
    s = 76
    p0 = f((82, 150, 0)); p1 = f((82+s, 150, 0))
    p2 = f((82+s, 150-s, 0)); p3 = f((82, 150-s, 0))
    p4 = f((82, 150, s*0.8)); p5 = f((82+s, 150, s*0.8))
    p6 = f((82+s, 150-s, s*0.8)); p7 = f((82, 150-s, s*0.8))
    return make_svg(
        polyline([p4, p5, p6, p7], fill='none', stroke=C['dashed'], sw=1.5),
        line(p4[0], p4[1], p0[0], p0[1], stroke=C['dashed'], sw=1.5),
        line(p7[0], p7[1], p3[0], p3[1], stroke=C['dashed'], sw=1.5),
        polygon([p0, p1, p2, p3], fill=C['fill_purple'], sw=2),
        line(p1[0], p1[1], p5[0], p5[1], sw=2),
        line(p2[0], p2[1], p6[0], p6[1], sw=2),
        # 体对角线（红色粗线）
        line(p0[0], p0[1], p6[0], p6[1], stroke=C['highlight'], sw=3),
        text('体对角线', (p0[0]+p6[0])/2+8, (p0[1]+p6[1])/2-5, size=11, fill=C['highlight'], bold=True),
        text('a = 4cm', 140, 24, size=13, bold=True, fill=C['accent']),
        text('d = √3 · a = √3 × 4 ≈ ?', 140, 202, size=13, bold=True, fill=C['highlight']),
    )


# ─── 主程序 ─────────────────────────────────────────────

IMAGE_GEN = {
    'math_g001': img_g001,
    'math_g002': img_g002,
    'math_g003': img_g003,
    'math_g004': img_g004,
    'math_g005': img_g005,
    'math_g006': img_g006,
    'math_g007': img_g007,
    'math_g008': img_g008,
    'math_g009': img_g009,
    'math_g010': img_g010,
    'math_g011': img_g011,
    'math_g012': img_g012,
    'math_g013': img_g013,
    'math_g014': img_g014,
    'math_g015': img_015,
    'math_g016': img_g016,
    'math_g017': img_g017,
    'math_g018': img_g018,
    'math_g019': img_g019,
    'math_g020': img_g020,
    'math_g021': img_g021,
    'math_g022': img_g022,
    'math_g023': img_g023,
    'math_g024': img_g024,
    'math_g025': img_025,
    'math_g026': img_g026,
    'math_g027': img_g027,
    'math_g028': img_g028,
    'math_g029': img_g029,
    'math_g030': img_g030,
    'math_g031': img_031,
    'math_g032': img_032,
    'math_g033': img_g033,
    'math_g034': img_g034,
    'math_g035': img_g035,
}


def main():
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    count = 0
    for q in data:
        qid = q.get('id')
        gen_fn = IMAGE_GEN.get(qid)
        if gen_fn:
            q['image'] = gen_fn()
            count += 1
            print(f'  ✓ {qid}: image generated ({len(q["image"])} chars)')
        else:
            print(f'  ⚠ {qid}: no generator found')

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f'\nDone! {count}/{len(data)} questions have SVG images.')
    print(f'Output: {OUTPUT_FILE}')


if __name__ == '__main__':
    main()
