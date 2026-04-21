"""
宠物精灵表裁切 + 去背景脚本
输入：/Users/xiaolongmu/Downloads/文档/ 下的精灵表 PNG
输出：/Volumes/ORICO/xinwen/claudecode/chinese-learn/public/pets/{prefix}/{stage1,stage2,stage3}/{emotion}.png
"""
from PIL import Image
import os

SRC_ROOT = "/Users/xiaolongmu/Downloads/文档"
DST_ROOT = "/Volumes/ORICO/xinwen/claudecode/chinese-learn/public/pets"

EMOTIONS = ["reading", "sleeping", "happy", "sad_cry", "angry", "eating", "wave", "excited", "normal"]

# 精灵表 → 宠物配置映射
# 格式：(src_folder, prefix, rarity)
# src_folder 下的每个 PNG 文件代表一个阶段，按文件名排序对应 stage1/stage2/stage3
PET_CONFIGS = [
    # === 新 SSR ===
    ("ssr/月相神王体", "lunar_king", "SSR"),
    ("ssr/星光影海兽", "star_beast", "SSR"),
    ("ssr/幽灵月夜猫", "ghost_cat", "SSR"),
    ("ssr/露奈雅来兽", "lunala_beast", "SSR"),  # 只有2张，缺第三阶段
    # === 深渊乌鸦 SR（从 SSR 改为 SR） ===
    ("sr卡/深渊乌鸦", "abyssal_raven", "SR"),
    # === 已有宠物的新图 ===
    ("sr卡/无牙仔", "toothless", "SR"),
    ("sr卡/星光小马", "starpony", "SR"),
    ("sr卡/机械翼龙", "mecha_dragon", "SR"),
    ("sr卡/花瓣精灵", "petal_fairy", "SR"),
    ("r卡/银月狐", "fox", "R"),
    ("r卡/冰晶灵蝶", "butterfly", "R"),
    ("r卡/战镰螳螂", "mantis", "R"),
    ("r卡/机械松鼠", "squirrel", "R"),
    ("r卡/功夫滚滚", "kungfu", "R"),
    # === N 卡 ===
    ("n卡/小仓鼠", "hamster", "N"),
    ("n卡/小柯基", "corgi", "N"),
    ("n卡/小黄猫", "kitten", "N"),
]


def get_stage_files(src_folder):
    """获取精灵表文件列表，按阶段排序"""
    path = os.path.join(SRC_ROOT, src_folder)
    if not os.path.isdir(path):
        return []
    files = []
    for f in os.listdir(path):
        if f.endswith('.png') and '补' not in f:
            files.append(os.path.join(path, f))
    # 按文件名排序（1-9 在前，10-19 在中，20-40 在后）
    files.sort()
    return files


def remove_background(img, tolerance=30):
    """去背景：检测背景色并设为透明"""
    if img.mode != 'RGBA':
        img = img.convert('RGBA')

    pixels = img.load()
    w, h = img.size

    # 采样四个角的像素作为背景色参考
    corners = [
        pixels[2, 2],
        pixels[w-3, 2],
        pixels[2, h-3],
        pixels[w-3, h-3],
    ]

    # 找最常见的角颜色
    from collections import Counter
    corner_colors = Counter()
    for c in corners:
        corner_colors[(c[0], c[1], c[2])] += 1
    bg_color = corner_colors.most_common(1)[0][0]

    # 遍历所有像素，与背景色相近的设为透明
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if abs(r - bg_color[0]) < tolerance and abs(g - bg_color[1]) < tolerance and abs(b - bg_color[2]) < tolerance:
                pixels[x, y] = (r, g, b, 0)

    return img


def crop_sprite_sheet(img_path, rows=3, cols=3):
    """将精灵表裁切为 rows×cols 的网格"""
    img = Image.open(img_path)
    w, h = img.size
    cell_w = w // cols
    cell_h = h // rows

    cells = []
    for row in range(rows):
        for col in range(cols):
            x1 = col * cell_w
            y1 = row * cell_h
            x2 = x1 + cell_w
            y2 = y1 + cell_h
            cell = img.crop((x1, y1, x2, y2))
            cells.append(cell)
    return cells


def process_pet(src_folder, prefix, rarity):
    """处理一只宠物的所有精灵表"""
    files = get_stage_files(src_folder)
    if not files:
        print(f"  ⚠️ {src_folder}: 没有找到文件")
        return 0

    stages = ["stage1", "stage2", "stage3"]
    count = 0

    for i, sprite_file in enumerate(files):
        if i >= 3:
            break  # 最多3个阶段

        stage = stages[i]
        stage_dir = os.path.join(DST_ROOT, prefix, stage)
        os.makedirs(stage_dir, exist_ok=True)

        # 裁切 3×3 精灵表
        cells = crop_sprite_sheet(sprite_file, rows=3, cols=3)

        for j, emotion in enumerate(EMOTIONS):
            if j < len(cells):
                cell = cells[j]
                # 去背景
                cell = remove_background(cell)
                # 保存
                out_path = os.path.join(stage_dir, f"{emotion}.png")
                cell.save(out_path, 'PNG')
                count += 1

    # 如果只有2张（如露奈雅来兽），用 stage2 复制到 stage3
    if len(files) == 2:
        src_stage2 = os.path.join(DST_ROOT, prefix, "stage2")
        dst_stage3 = os.path.join(DST_ROOT, prefix, "stage3")
        if os.path.isdir(src_stage2) and not os.path.isdir(dst_stage3):
            import shutil
            shutil.copytree(src_stage2, dst_stage3)
            count += 9
            print(f"  📋 {prefix}: stage2 → stage3 fallback（缺第三阶段原图）")

    print(f"  ✅ {prefix} ({rarity}): {len(files)} 阶段 → {count} 张PNG")
    return count


def main():
    total = 0
    print("=" * 60)
    print("宠物精灵表裁切 + 去背景")
    print("=" * 60)

    for src_folder, prefix, rarity in PET_CONFIGS:
        count = process_pet(src_folder, prefix, rarity)
        total += count

    print(f"\n{'=' * 60}")
    print(f"完成！共处理 {total} 张PNG")
    print(f"输出目录：{DST_ROOT}")


if __name__ == "__main__":
    main()
