#!/usr/bin/env python3
"""将3x3宠物精灵图大图拆分为9张单独的表情图片"""

from PIL import Image
import sys, os

# 情绪名称对应位置（3行×3列）
EMOTIONS = [
    ['reading', 'sleeping', 'happy'],      # 第1行
    ['sad_cry', 'angry', 'eating'],         # 第2行
    ['wave', 'excited', 'normal'],          # 第3行]
]

def split_sprite(src_path, out_dir):
    img = Image.open(src_path)
    w, h = img.size
    cell_w = w // 3
    cell_h = h // 3
    
    print(f"📷 {os.path.basename(src_path)} → {w}x{h}, 每格 {cell_w}x{cell_h}")
    
    os.makedirs(out_dir, exist_ok=True)
    
    for row in range(3):
        for col in range(3):
            name = EMOTIONS[row][col]
            left = col * cell_w
            top = row * cell_h
            right = left + cell_w
            bottom = top + cell_h
            
            piece = img.crop((left, top, right, bottom))
            out_path = os.path.join(out_dir, f'{name}.png')
            piece.save(out_path)
            print(f"   ✅ {name}.png ({piece.size[0]}x{piece.size[1]})")
    
    print(f"   📁 已保存到 {out_dir}/\n")

BASE = '/Volumes/ORICO/xinwen/claudecode/chinese-learn/public/pets/kitten'

# Stage1: 已经拆好了，确认一下
print("=== Stage1 (1-9级 幼体期) ===")
for name in [e for row in EMOTIONS for e in row]:
    p = os.path.join(BASE, f'{name}.png')
    if os.path.exists(p):
        s = Image.open(p).size
        print(f"   ✅ {name}.png ({s[0]}x{s[1]})")
    else:
        print(f"   ❌ 缺少 {name}.png")

# Stage2: 从第二张大图拆分（戴眼镜的学童猫）
print("\n=== Stage2 (10-19级 少年期) ===")
# 需要用户提供第二张图的路径，先用占位
stage2_src = None
# 尝试常见路径
for candidate in [
    os.path.expanduser('~/Downloads/ChatGPT*17_27*'),
    os.path.expanduser('~/Desktop/ChatGPT*17_27*'),
]:
    import glob
    matches = glob.glob(candidate)
    if matches:
        stage2_src = matches[0]
        break

if stage2_src:
    split_sprite(stage2_src, os.path.join(BASE, 'stage2'))
else:
    print("   ⚠️ 请手动提供第二张图的路径")

# Stage3: 从第三张大图拆分（金色神圣猫）
print("=== Stage3 (20-40级 完全体) ===")
stage3_src = None
for candidate in [
    os.path.expanduser('~/Downloads/ChatGPT*17_32*'),
    os.path.expanduser('~/Desktop/ChatGPT*17_32*'),
]:
    import glob
    matches = glob.glob(candidate)
    if matches:
        stage3_src = matches[0]
        break

if stage3_src:
    split_sprite(stage3_src, os.path.join(BASE, 'stage3'))
else:
    print("   ⚠️ 请手动提供第三张图的路径")
