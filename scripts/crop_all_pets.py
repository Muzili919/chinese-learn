"""
宠物精灵表裁切 V4
改进：
1. 自动检测透明/不透明背景 → 透明直接裁切，不透明裁切+flood fill去背景
2. 网格布局自动检测（行数自适应，支持透明背景alpha检测）
3. 支持精灵表和独立图片（紫柴犬）两种源格式
4. 特殊处理：无牙仔合并表、露奈雅来兽2阶段、功夫滚滚补图
"""
from PIL import Image
from collections import deque
import os
import shutil

SRC_ROOT = "/Users/xiaolongmu/Downloads/文档"
DST_ROOT = "/Volumes/ORICO/xinwen/claudecode/chinese-learn/public/pets"

EMOTIONS = ["reading", "sleeping", "happy", "sad_cry", "angry", "eating", "wave", "excited", "normal"]

# (src_folder, prefix, rarity)
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
    ("n卡/紫柴犬", "shiba", "N"),
]


def has_transparent_bg(img):
    """检查图片是否已经有透明背景"""
    if img.mode != 'RGBA':
        return False
    px = img.load()
    w, h = img.size
    corners = [px[2, 2], px[w - 3, 2], px[2, h - 3], px[w - 3, h - 3]]
    return all(c[3] == 0 for c in corners)


def detect_all_grid(img, min_gap=5, threshold=0.01):
    """自动检测行列的网格边界，支持透明和不透明背景"""
    px = img.load()
    w, h = img.size
    is_transparent = has_transparent_bg(img)

    def is_content(x, y):
        if is_transparent:
            return px[x, y][3] > 30
        else:
            r, g, b = px[x, y][:3]
            bg = px[2, 2][:3]
            return abs(r - bg[0]) > 30 or abs(g - bg[1]) > 30 or abs(b - bg[2]) > 30

    # 检测行间隙
    row_content = []
    for y in range(h):
        non_bg = 0
        step = max(1, w // 200)
        for x in range(0, w, step):
            if is_content(x, y):
                non_bg += 1
        row_content.append(non_bg / max(1, w // step))

    row_gaps = []
    in_gap = False
    gap_start = 0
    for y in range(h):
        if row_content[y] < threshold:
            if not in_gap:
                gap_start = y
                in_gap = True
        else:
            if in_gap:
                if y - gap_start >= min_gap:
                    row_gaps.append((gap_start, y))
                in_gap = False
    if in_gap and h - gap_start >= min_gap:
        row_gaps.append((gap_start, h))

    # 检测列间隙
    col_content = []
    for x in range(w):
        non_bg = 0
        step = max(1, h // 200)
        for y in range(0, h, step):
            if is_content(x, y):
                non_bg += 1
        col_content.append(non_bg / max(1, h // step))

    col_gaps = []
    in_gap = False
    gap_start = 0
    for x in range(w):
        if col_content[x] < threshold:
            if not in_gap:
                gap_start = x
                in_gap = True
        else:
            if in_gap:
                if x - gap_start >= min_gap:
                    col_gaps.append((gap_start, x))
                in_gap = False
    if in_gap and w - gap_start >= min_gap:
        col_gaps.append((gap_start, w))

    # 从间隙推导行列边界
    def gaps_to_bounds(gaps, total, min_cell=20):
        if not gaps:
            return None
        bounds = []
        if gaps[0][0] > min_cell:
            bounds.append((0, gaps[0][0]))
        for i in range(len(gaps) - 1):
            top = gaps[i][1]
            bottom = gaps[i + 1][0]
            if bottom - top > min_cell:
                bounds.append((top, bottom))
        if total - gaps[-1][1] > min_cell:
            bounds.append((gaps[-1][1], total))
        return bounds if len(bounds) >= 2 else None

    row_bounds = gaps_to_bounds(row_gaps, h)
    col_bounds = gaps_to_bounds(col_gaps, w)

    return row_bounds, col_bounds


def get_stage_files(src_folder, prefix):
    """获取阶段文件列表，处理特殊宠物"""
    path = os.path.join(SRC_ROOT, src_folder)
    if not os.path.isdir(path):
        return []

    if prefix == 'shiba':
        return ['individual']

    if prefix == 'toothless':
        # 无牙仔：stage1 用单独文件（9个动作），stage2/3 用合并表
        single_s1 = None
        combined = None
        for f in os.listdir(path):
            if not f.endswith('.png'):
                continue
            if '1-9级状态' in f:
                single_s1 = os.path.join(path, f)
            if '第一排' in f:
                combined = os.path.join(path, f)
        result = []
        result.append(single_s1 or combined)  # stage1: 优先用单独文件
        result.append(combined or single_s1)  # stage2
        result.append(combined or single_s1)  # stage3
        return [r for r in result if r]

    # 标准精灵表格式
    files = []
    for f in os.listdir(path):
        if f.endswith('.png') and '补' not in f:
            files.append(os.path.join(path, f))
    files.sort()
    return files


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


def detect_bg_type(img, cell_box):
    """检测cell的背景类型：solid(纯色) vs gradient(渐变)"""
    px = img.load()
    x1, y1, x2, y2 = cell_box
    corners = [
        px[min(x1 + 3, x2 - 1), min(y1 + 3, y2 - 1)][:3],
        px[max(x2 - 4, 0), min(y1 + 3, y2 - 1)][:3],
        px[min(x1 + 3, x2 - 1), max(y2 - 4, 0)][:3],
        px[max(x2 - 4, 0), max(y2 - 4, 0)][:3],
    ]
    max_diff = max(
        sum(abs(a - b) for a, b in zip(corners[i], corners[j]))
        for i in range(4) for j in range(i + 1, 4)
    )
    return 'gradient' if max_diff > 25 else 'solid'


def remove_bg(cell):
    """自动检测并去除cell的背景（仅对非透明背景图片）"""
    if has_transparent_bg(cell):
        return cell
    if cell.mode == 'RGBA':
        cell = cell.convert('RGB')
    w, h = cell.size
    bg_type = detect_bg_type(cell, (0, 0, w, h))
    if bg_type == 'gradient':
        return flood_fill_gradient(cell, tolerance=20)
    else:
        return flood_fill_solid(cell, tolerance=20)


def crop_sprite_sheet(img_path, stage_index=0, total_stages=1):
    """裁切精灵表为9个cell，检测失败回退均分3×3"""
    img = Image.open(img_path).convert('RGBA')
    w, h = img.size

    row_bounds, col_bounds = detect_all_grid(img)

    # 合并表处理：先选对应行，再决定是否回退
    if total_stages > 1 and row_bounds and len(row_bounds) >= total_stages:
        row_bounds = [row_bounds[stage_index]]

    # 回退：行列不足3时均分
    if not row_bounds or len(row_bounds) < 1:
        row_h = h // (total_stages if total_stages > 1 else 3)
        if total_stages > 1:
            start = stage_index * row_h
            row_bounds = [(start, start + row_h)]
        else:
            row_bounds = [(row_h * i, row_h * (i + 1)) for i in range(3)]
    elif len(row_bounds) < 3 and total_stages == 1:
        row_h = h // 3
        row_bounds = [(row_h * i, row_h * (i + 1)) for i in range(3)]

    if not col_bounds or len(col_bounds) < 3:
        col_w = w // 3
        col_bounds = [(col_w * i, col_w * (i + 1)) for i in range(3)]

    cells = []
    for row_top, row_bottom in row_bounds:
        for col_left, col_right in col_bounds:
            cell = img.crop((col_left, row_top, col_right, row_bottom))
            cell = remove_bg(cell)
            cells.append(cell)

    # 不够9个时循环填充
    while len(cells) < 9 and cells:
        cells.append(cells[len(cells) % len(cells)])

    return cells[:9]


def process_shiba(src_folder, prefix, rarity):
    """处理紫柴犬：独立图片格式，直接复制+重命名"""
    path = os.path.join(SRC_ROOT, src_folder)
    if not os.path.isdir(path):
        return 0

    stage_dirs = [
        ("1-9级", "stage1"),
        ("10-19级", "stage2"),
        ("20-40级", "stage3"),
    ]

    count = 0
    for src_stage, dst_stage in stage_dirs:
        src_path = os.path.join(path, src_stage)
        if not os.path.isdir(src_path):
            continue

        dst_path = os.path.join(DST_ROOT, prefix, dst_stage)
        os.makedirs(dst_path, exist_ok=True)

        files = sorted([f for f in os.listdir(src_path) if f.endswith('.png')])
        images = []
        for j, f in enumerate(files):
            if j >= 9:
                break
            src_file = os.path.join(src_path, f)
            img = Image.open(src_file).convert('RGBA')
            if max(img.size) > 600:
                ratio = 512 / max(img.size)
                new_size = (int(img.size[0] * ratio), int(img.size[1] * ratio))
                img = img.resize(new_size, Image.LANCZOS)
            images.append(img)

        # 不够9张时循环填充
        while len(images) < 9 and images:
            images.append(images[len(images) % len(images)])

        for j, emotion in enumerate(EMOTIONS):
            if j < len(images):
                out_path = os.path.join(dst_path, f"{emotion}.png")
                images[j].save(out_path, 'PNG')
                count += 1

    print(f"  ✅ {prefix} ({rarity}): 独立图片 → {count} 张PNG")
    return count


def process_pet(src_folder, prefix, rarity):
    """处理一只宠物（精灵表格式）"""
    files = get_stage_files(src_folder, prefix)

    if not files:
        print(f"  ⚠️ {src_folder}: 没有找到文件")
        return 0

    if files == ['individual']:
        return process_shiba(src_folder, prefix, rarity)

    stages = ["stage1", "stage2", "stage3"]
    count = 0
    is_toothless = prefix == 'toothless'

    for i, sprite_file in enumerate(files):
        if i >= 3:
            break
        stage = stages[i]
        stage_dir = os.path.join(DST_ROOT, prefix, stage)
        os.makedirs(stage_dir, exist_ok=True)

        if is_toothless and i == 0:
            # 无牙仔 stage1: 单独文件，完整3×3
            cells = crop_sprite_sheet(sprite_file)
        elif is_toothless:
            # 无牙仔 stage2/3: 合并表，只取对应行
            cells = crop_sprite_sheet(sprite_file, stage_index=i, total_stages=3)
        else:
            cells = crop_sprite_sheet(sprite_file)

        for j, emotion in enumerate(EMOTIONS):
            if j < len(cells):
                out_path = os.path.join(stage_dir, f"{emotion}.png")
                cells[j].save(out_path, 'PNG')
                count += 1

    # 露奈雅来兽只有2阶段，用stage2做stage3
    if prefix == 'lunala_beast':
        src_stage2 = os.path.join(DST_ROOT, prefix, "stage2")
        dst_stage3 = os.path.join(DST_ROOT, prefix, "stage3")
        if os.path.isdir(src_stage2) and not os.path.isdir(dst_stage3):
            shutil.copytree(src_stage2, dst_stage3)
            count += 9
            print(f"  📋 {prefix}: stage2 → stage3 fallback")

    print(f"  ✅ {prefix} ({rarity}): {len(files)} 阶段 → {count} 张PNG")
    return count


def main():
    total = 0
    print("=" * 60)
    print("宠物精灵表裁切 V4（18只宠物全覆盖）")
    print("  - 自动检测透明/不透明背景")
    print("  - 网格布局自动检测")
    print("  - 紫柴犬独立图片 + 无牙仔合并表特殊处理")
    print("=" * 60)

    for src_folder, prefix, rarity in PET_CONFIGS:
        count = process_pet(src_folder, prefix, rarity)
        total += count

    print(f"\n{'=' * 60}")
    print(f"完成！共处理 {total} 张PNG")
    print(f"输出目录：{DST_ROOT}")


if __name__ == "__main__":
    main()
