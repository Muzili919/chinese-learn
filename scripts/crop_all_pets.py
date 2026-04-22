"""
宠物精灵表裁切 + 去背景脚本 V3
改进：
1. 自动检测行数（3行 vs 4行），按内容间隙裁切；检测失败回退均分
2. 自动识别背景类型（纯色/渐变），用对应策略去背景
3. 纯色背景：单色参考 + 泛洪填充
4. 渐变背景：多边缘参考色 + 泛洪填充
"""
from PIL import Image
from collections import deque
import os

SRC_ROOT = "/Users/xiaolongmu/Downloads/文档"
DST_ROOT = "/Volumes/ORICO/xinwen/claudecode/chinese-learn/public/pets"

EMOTIONS = ["reading", "sleeping", "happy", "sad_cry", "angry", "eating", "wave", "excited", "normal"]

PET_CONFIGS = [
    ("ssr/月相神王体", "lunar_king", "SSR"),
    ("ssr/星光影海兽", "star_beast", "SSR"),
    ("ssr/幽灵月夜猫", "ghost_cat", "SSR"),
    ("ssr/露奈雅来兽", "lunala_beast", "SSR"),
    ("sr卡/深渊乌鸦", "abyssal_raven", "SR"),
    ("sr卡/无牙仔", "toothless", "SR"),
    ("sr卡/星光小马", "starpony", "SR"),
    ("sr卡/机械翼龙", "mecha_dragon", "SR"),
    ("sr卡/花瓣精灵", "petal_fairy", "SR"),
    ("r卡/银月狐", "fox", "R"),
    ("r卡/冰晶灵蝶", "butterfly", "R"),
    ("r卡/战镰螳螂", "mantis", "R"),
    ("r卡/机械松鼠", "squirrel", "R"),
    ("r卡/功夫滚滚", "kungfu", "R"),
    ("n卡/小仓鼠", "hamster", "N"),
    ("n卡/小柯基", "corgi", "N"),
    ("n卡/小黄猫", "kitten", "N"),
]


def get_stage_files(src_folder):
    path = os.path.join(SRC_ROOT, src_folder)
    if not os.path.isdir(path):
        return []
    files = []
    for f in os.listdir(path):
        if f.endswith('.png') and '补' not in f:
            files.append(os.path.join(path, f))
    files.sort()
    return files


def detect_row_boundaries(img, bg_tol=30, min_gap_height=5):
    px = img.load()
    w, h = img.size
    bg = px[2, 2][:3]

    row_content = []
    for y in range(h):
        non_bg = 0
        step = max(1, w // 200)
        for x in range(0, w, step):
            r, g, b = px[x, y][:3]
            if abs(r - bg[0]) > bg_tol or abs(g - bg[1]) > bg_tol or abs(b - bg[2]) > bg_tol:
                non_bg += 1
        row_content.append(non_bg / (w // step))

    gap_ranges = []
    in_gap = False
    gap_start = 0
    for y in range(h):
        if row_content[y] < 0.01:
            if not in_gap:
                gap_start = y
                in_gap = True
        else:
            if in_gap:
                if y - gap_start >= min_gap_height:
                    gap_ranges.append((gap_start, y))
                in_gap = False
    if in_gap and h - gap_start >= min_gap_height:
        gap_ranges.append((gap_start, h))

    if not gap_ranges:
        row_h = h // 3
        return [(row_h * i, row_h * (i + 1)) for i in range(3)]

    rows = []
    if gap_ranges[0][0] > 10:
        rows.append((0, gap_ranges[0][0]))
    for i in range(len(gap_ranges) - 1):
        top = gap_ranges[i][1]
        bottom = gap_ranges[i + 1][0]
        if bottom - top > 20:
            rows.append((top, bottom))
    if h - gap_ranges[-1][1] > 20:
        rows.append((gap_ranges[-1][1], h))

    # 检测失败保护：行数 < 3 时回退均分
    if len(rows) < 3:
        row_h = h // 3
        return [(row_h * i, row_h * (i + 1)) for i in range(3)]

    return rows


def detect_bg_type(img, cell_box):
    """检测cell的背景类型：solid(纯色) vs gradient(渐变)"""
    px = img.load()
    x1, y1, x2, y2 = cell_box
    corners = [
        px[min(x1+3, x2-1), min(y1+3, y2-1)][:3],
        px[max(x2-4, 0), min(y1+3, y2-1)][:3],
        px[min(x1+3, x2-1), max(y2-4, 0)][:3],
        px[max(x2-4, 0), max(y2-4, 0)][:3],
    ]
    max_diff = max(
        sum(abs(a - b) for a, b in zip(corners[i], corners[j]))
        for i in range(4) for j in range(i + 1, 4)
    )
    return 'gradient' if max_diff > 25 else 'solid'


def flood_fill_solid(img, tolerance=20):
    """纯色背景：用最常见角颜色做泛洪填充"""
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    img = img.copy()
    px = img.load()
    w, h = img.size

    corners = [px[2, 2][:3], px[w - 3, 2][:3], px[2, h - 3][:3], px[w - 3, h - 3][:3]]
    bg = max(set(corners), key=corners.count)

    visited = [[False] * w for _ in range(h)]
    queue = deque()
    for x in range(w):
        queue.append((x, 0))
        queue.append((x, h - 1))
    for y in range(h):
        queue.append((0, y))
        queue.append((w - 1, y))

    while queue:
        x, y = queue.popleft()
        if x < 0 or x >= w or y < 0 or y >= h:
            continue
        if visited[y][x]:
            continue
        visited[y][x] = True
        r, g, b, a = px[x, y]
        if abs(r - bg[0]) <= tolerance and abs(g - bg[1]) <= tolerance and abs(b - bg[2]) <= tolerance:
            px[x, y] = (r, g, b, 0)
            queue.append((x + 1, y))
            queue.append((x - 1, y))
            queue.append((x, y + 1))
            queue.append((x, y - 1))

    return img


def flood_fill_gradient(img, tolerance=20):
    """渐变背景：用多个边缘颜色做泛洪填充参考"""
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    img = img.copy()
    px = img.load()
    w, h = img.size

    bg_refs = set()
    for x in range(min(8, w)):
        for y in range(min(8, h)):
            bg_refs.add(px[x, y][:3])
    for x in range(max(0, w - 8), w):
        for y in range(max(0, h - 8), h):
            bg_refs.add(px[x, y][:3])
    for x in range(0, w, max(1, w // 8)):
        bg_refs.add(px[x, 0][:3])
        bg_refs.add(px[x, h - 1][:3])
    for y in range(0, h, max(1, h // 8)):
        bg_refs.add(px[0, y][:3])
        bg_refs.add(px[w - 1, y][:3])

    def is_bg(r, g, b):
        for br, bg_, bb in bg_refs:
            if abs(r - br) <= tolerance and abs(g - bg_) <= tolerance and abs(b - bb) <= tolerance:
                return True
        return False

    visited = [[False] * w for _ in range(h)]
    queue = deque()
    for x in range(w):
        queue.append((x, 0))
        queue.append((x, h - 1))
    for y in range(h):
        queue.append((0, y))
        queue.append((w - 1, y))

    while queue:
        x, y = queue.popleft()
        if x < 0 or x >= w or y < 0 or y >= h:
            continue
        if visited[y][x]:
            continue
        visited[y][x] = True
        r, g, b, a = px[x, y]
        if is_bg(r, g, b):
            px[x, y] = (r, g, b, 0)
            queue.append((x + 1, y))
            queue.append((x - 1, y))
            queue.append((x, y + 1))
            queue.append((x, y - 1))

    return img


def crop_sprite_sheet(img_path):
    img = Image.open(img_path)
    w, h = img.size
    row_bounds = detect_row_boundaries(img)
    cols = 3
    cell_w = w // cols

    cells = []
    for ri, (row_top, row_bottom) in enumerate(row_bounds):
        if len(cells) >= 9:
            break
        for ci in range(cols):
            if len(cells) >= 9:
                break
            x1 = ci * cell_w
            x2 = x1 + cell_w
            cell = img.crop((x1, row_top, x2, row_bottom))

            # 自动选择去背景策略
            bg_type = detect_bg_type(img, (x1, row_top, x2, row_bottom))
            if bg_type == 'gradient':
                cell = flood_fill_gradient(cell, tolerance=20)
            else:
                cell = flood_fill_solid(cell, tolerance=20)

            cells.append(cell)

    return cells


def process_pet(src_folder, prefix, rarity):
    files = get_stage_files(src_folder)
    if not files:
        print(f"  ⚠️ {src_folder}: 没有找到文件")
        return 0

    stages = ["stage1", "stage2", "stage3"]
    count = 0

    for i, sprite_file in enumerate(files):
        if i >= 3:
            break
        stage = stages[i]
        stage_dir = os.path.join(DST_ROOT, prefix, stage)
        os.makedirs(stage_dir, exist_ok=True)

        cells = crop_sprite_sheet(sprite_file)

        for j, emotion in enumerate(EMOTIONS):
            if j < len(cells):
                out_path = os.path.join(stage_dir, f"{emotion}.png")
                cells[j].save(out_path, 'PNG')
                count += 1

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
    print("宠物精灵表裁切 V3（自适应去背景 + 行数回退保护）")
    print("=" * 60)

    for src_folder, prefix, rarity in PET_CONFIGS:
        count = process_pet(src_folder, prefix, rarity)
        total += count

    print(f"\n{'=' * 60}")
    print(f"完成！共处理 {total} 张PNG")
    print(f"输出目录：{DST_ROOT}")


if __name__ == "__main__":
    main()
