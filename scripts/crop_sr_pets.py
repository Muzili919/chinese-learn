#!/usr/bin/env python3
"""
SR宠物精灵表裁切脚本
将3×3精灵表大图裁切成9张单独PNG，去白底变透明背景。

输入：/Users/xiaolongmu/Downloads/文档/sr卡/{宠物名}/{阶段}.png
输出：public/pets/{spritePrefix}/{stage1,stage2,stage3}/

每个阶段图片的3×3布局（从左到右、从上到下）：
  reading | sleeping | sad_cry
  happy   | excited  | angry  
  wave    | eating   | normal

注意：不同宠物的动作排列可能略有差异，下面按实际观察结果映射。
"""

import os
import sys
from PIL import Image

# ── 配置 ──

SOURCE_DIR = "/Users/xiaolongmu/Downloads/文档/sr卡"
OUTPUT_BASE = "/Volumes/ORICO/xinwen/claudecode/chinese-learn/public/pets"

# 标准的9个动作文件名（顺序固定）
POSE_NAMES = [
    "reading", "sleeping", "sad_cry",
    "happy",   "excited",  "angry",
    "wave",    "eating",   "normal",
]

# 每个宠物的配置：(中文名, spritePrefix, 阶段文件映射)
PET_CONFIGS = [
    {
        "name": "花瓣精灵",
        "prefix": "petal_fairy",
        "emoji": "🌸",
        "rarity": "SR",
        "personality": "温柔治愈的花瓣小精灵",
        # 文件名 → stage目录
        "stages": {"1-9级.png": "stage1", "10-19级.png": "stage2", "20-40级.png": "stage3"},
        # 3×3网格位置 → 动作名（根据实际图片布局）
        # Row0: reading=看书, sleeping=闭眼, sad_cry=哭泣抱花瓣
        # Row1: happy=眯眼笑, excited=开心, sad_cry2=哭(第二张)
        # Row2: angry=生气, wave/其他=?, normal=正常
        "grid_map": [
            "reading", "sleeping", "sad_cry",   # row 0
            "happy",   "excited",  "sad_cry",    # row 1 (第6张也是悲伤表情，复用sad_cry)
            "angry",   "normal",   "happy",      # row 2
        ],
    },
    {
        "name": "机械翼龙",
        "prefix": "mecha_dragon",
        "emoji": "🤖",
        "rarity": "SR",
        "personality": "赛博机械翼龙幼崽",
        "stages": {"1-9级.png": "stage1", "10-19级.png": "stage2", "20-40级.png": "stage3"},
        # Row0: reading=看平板, sleeping=闭眼充电, normal=正常
        # Row1: happy=开心, sad_cry=流泪, angry=红眼暴走
        # Row2: wave=挥手特效, eating/思考=?, normal=?
        "grid_map": [
            "reading", "sleeping", "normal",     # row 0
            "happy",   "sad_cry",  "angry",      # row 1
            "wave",    "eating",   "excited",    # row 2
        ],
    },
    {
        "name": "小凤凰",
        "prefix": "phoenix",
        "emoji": "🔥",
        "rarity": "SR",
        "personality": "彩虹渐变小凤凰",
        "stages": {"1-9级.png": "stage1", "10-19级.png": "stage2", "20-40级.png": "stage3"},
        # Row0: reading=看书, sleeping=趴着休息, sad_cry=趴着难过
        # Row1: happy=大笑, sad_cry=大哭, angry=生气
        # Row2: eating=合爪祈祷, excited=大眼睛好奇, wave=展翅
        "grid_map": [
            "reading", "sleeping", "sad_cry",    # row 0
            "happy",   "sad_cry",  "angry",      # row 1
            "eating",  "excited",  "wave",       # row 2
        ],
    },
    {
        "name": "星光小马",
        "prefix": "starpony",
        "emoji": "🦄",
        "rarity": "SR",
        "personality": "梦幻紫粉渐变星光小马",
        "stages": {"1-9级.png": "stage1", "10-19级.png": "stage2", "20-40级.png": "stage3"},
        # Row0: reading=看星星书, sleeping=闭眼躺, excited=大笑
        # Row1: sad_cry=流泪, angry=生气皱眉, normal=好奇歪头
        # Row2: happy=吐舌笑, wink=眨眼, normal2=微笑
        "grid_map": [
            "reading", "sleeping", "excited",     # row 0
            "sad_cry", "angry",    "normal",      # row 1
            "happy",   "happy",    "normal",      # row 2
        ],
    },
]


def remove_white_background(img, threshold=240):
    """
    将白色/浅色背景变为透明。
    threshold: 高于此值的RGB通道被视为背景
    返回RGBA模式图片
    """
    if img.mode != 'RGBA':
        img = img.convert('RGBA')

    datas = img.getdata()
    newData = []
    for item in datas:
        # 如果RGB都接近白色 → 变透明
        if item[0] > threshold and item[1] > threshold and item[2] > threshold:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)

    img.putdata(newData)
    return img


def crop_sprite_sheet(image_path, grid_map, output_dir, output_size=None):
    """
    将一张3×3精灵表裁切成9张独立PNG
    
    Args:
        image_path: 精灵表路径
        grid_map: 9个元素的列表，每个元素是动作名字符串
        output_dir: 输出目录
        output_size: 可选，统一输出尺寸 (width, height)
    """
    img = Image.open(image_path)
    print(f"  📐 原图尺寸: {img.size} mode={img.mode}")

    w, h = img.size
    cell_w = w // 3
    cell_h = h // 3

    os.makedirs(output_dir, exist_ok=True)

    # 用于检测是否重复写入同一pose
    written_poses = set()

    for idx, pose_name in enumerate(grid_map):
        row = idx // 3
        col = idx % 3
        left = col * cell_w
        top = row * cell_h
        right = left + cell_w
        bottom = top + cell_h

        # 裁切
        cropped = img.crop((left, top, right, bottom))

        # 去白底
        cropped = remove_white_background(cropped)

        # 可选缩放
        if output_size:
            cropped = cropped.resize(output_size, Image.LANCZOS)

        # 保存
        out_path = os.path.join(output_dir, f"{pose_name}.png")
        
        # 如果同一pose被映射多次（如两个位置都是happy），后一个覆盖前一个
        if pose_name in written_poses:
            print(f"  ⚠️ {pose_name} 重复({idx})，覆盖已有文件")
        
        cropped.save(out_path, "PNG")
        written_poses.add(pose_name)
        print(f"  ✅ [{row},{col}] → {pose_name}.png ({cell_w}×{cell_h})")

    # 检查是否有缺失的动作
    missing = set(POSE_NAMES) - written_poses
    if missing:
        print(f"  ⚠️ 缺失动作: {missing} —— 会fallback到其他表情")

    return len(written_poses)


def main():
    print("=" * 60)
    print("🐾 SR宠物精灵表裁切工具")
    print("=" * 60)

    total_pets = 0
    total_images = 0

    for config in PET_CONFIGS:
        name = config["name"]
        prefix = config["prefix"]
        pet_dir = os.path.join(SOURCE_DIR, name)

        if not os.path.isdir(pet_dir):
            print(f"\n⚠️ 跳过 {name}: 目录不存在 {pet_dir}")
            continue

        print(f"\n{'─' * 50}")
        print(f"🌟 处理: {config['emoji']} {name} (prefix: {prefix}, rarity: {config['rarity']})")
        print(f"{'─' * 50}")

        for filename, stage_name in config["stages"].items():
            src_path = os.path.join(pet_dir, filename)
            if not os.path.exists(src_path):
                print(f"  ⚠️ 文件不存在: {filename}")
                continue

            out_dir = os.path.join(OUTPUT_BASE, prefix, stage_name)
            print(f"\n  📂 {filename} → {out_dir}")
            
            count = crop_sprite_sheet(src_path, config["grid_map"], out_dir)
            total_images += count
        
        total_pets += 1

    print(f"\n{'=' * 60}")
    print(f"✅ 完成！处理了 {total_pets} 只宠物，共 {total_images} 张图片")
    print(f"输出目录: {OUTPUT_BASE}")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
