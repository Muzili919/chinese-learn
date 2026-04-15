#!/usr/bin/env python3
"""
宠物PNG处理脚本：
1. 去除灰白色背景 → 真正的透明通道(RGBA)
2. 裁剪左上角AI logo区域(前120px)
3. 缩放到合适尺寸(512px)
4. 重命名为标准动作名
"""

import os
import sys
import json
from pathlib import Path
from PIL import Image, ImageFilter
import numpy as np

# ============================================================
# 配置
# ============================================================
BASE_DIR = Path("/Users/xiaolongmu/Downloads/文档")
OUTPUT_DIR = Path("/Volumes/ORICO/xinwen/claudecode/chinese-learn/public/pets")

# 9个动作标准名
ACTION_NAMES = [
    "reading",      # 📖 读书 — 答题默认
    "sleeping",     # 💤 睡觉 — Dock默认
    "happy",        # 😊 开心
    "sad_cry",      # 😭 哭泣
    "angry",        # 😠 生气
    "eating",       # 🍪 吃东西
    "wave",         # 👋 招手
    "excited",      # ✨ 兴奋
    "normal",       # 😐 正常
]

# 阶段目录映射
STAGE_MAP = {
    "1-9级": "stage1",
    "10-19级": "stage2",
    "20-40级": "stage3",
}

# 宠物配置
PETS = {
    "紫柴犬": {
        "source_dir": BASE_DIR / "紫柴犬",
        "output_prefix": "shiba",
        "emoji": "🐶",
        "rarity": "N",
    },
    "小黄猫": {
        "source_dir": BASE_DIR / "小黄猫",  
        "output_prefix": "kitten",
        "emoji": "🐱",
        "rarity": "N",
    },
}


def remove_background(img, bg_color=None, tolerance=25):
    """
    将RGB图像的背景色转为透明。
    
    从四个角落采样确定背景色，然后将接近背景色的像素变为透明。
    使用边缘扩散算法处理半透明边缘。
    """
    if img.mode == 'RGBA':
        return img
    
    # 转为numpy方便操作
    data = np.array(img, dtype=np.float32)
    h, w = data.shape[:2]
    
    # 从四角采样确定背景色
    corners = [
        data[0, 0],
        data[0, w-1] if w > 1 else data[0, 0],
        data[h-1, 0] if h > 1 else data[0, 0],
        data[h-1, w-1] if h > 1 and w > 1 else data[0, 0],
    ]
    bg = np.mean(corners, axis=0)[:3]
    
    print(f"  检测到背景色: RGB({int(bg[0])},{int(bg[1])},{int(bg[2])})")
    
    # 创建alpha通道
    alpha = np.ones((h, w), dtype=np.float32)
    
    # 计算每个像素与背景色的距离
    diff = np.sqrt(np.sum((data[:, :, :3] - bg[:3]) ** 2, axis=2))
    
    # 完全透明的阈值
    hard_threshold = tolerance * 1.5
    # 开始渐变的阈值  
    soft_threshold = tolerance
    
    # 远离背景的像素完全不透明
    alpha[diff > hard_threshold] = 1.0
    
    # 在soft和hard之间的区域做平滑过渡
    mask = (diff >= soft_threshold) & (diff <= hard_threshold)
    if mask.any():
        alpha[mask] = (diff[mask] - soft_threshold) / (hard_threshold - soft_threshold)
        
    # 非常接近背景的完全透明
    alpha[diff < soft_threshold] = 0.0
    
    # 边缘羽化（让过渡更自然）
    from scipy.ndimage import binary_erosion, binary_dilation
    try:
        solid_mask = alpha > 0.8
        eroded = binary_erosion(solid_mask, iterations=2)
        edge = solid_mask & (~eroded)
        # 对边缘区域做轻微模糊
        if edge.any():
            alpha_edge = alpha.copy()
            # 简单的边缘平滑
            for dy in range(-2, 3):
                for dx in range(-2, 3):
                    shifted = np.roll(np.roll(alpha, dy, axis=0), dx, axis=1)
                    alpha_edge = np.maximum(alpha_edge, shifted * 0.3)
            alpha = np.where(edge & (alpha_edge > alpha), alpha_edge, alpha)
    except ImportError:
        pass  # scipy不可用时跳过羽化
    
    # 合成RGBA
    result = np.zeros((h, w, 4), dtype=np.uint8)
    result[:, :, :3] = data[:, :, :3].astype(np.uint8)
    result[:, :, 3] = (alpha * 255).astype(np.uint8)
    
    return Image.fromarray(result, 'RGB' if False else 'RGBA')


def crop_logo(img, crop_top=120):
    """裁剪顶部logo区域"""
    if crop_top <= 0:
        return img
    w, h = img.size
    if crop_top >= h:
        return img
    cropped = img.crop((0, crop_top, w, h))
    print(f"  裁剪顶部{crop_top}px (原{h}→现{cropped.size[1]})")
    return cropped


def resize_pet(img, max_size=1024):
    """等比缩放，保持宽高比"""
    w, h = img.size
    if max(w, h) <= max_size:
        return img
    ratio = max_size / max(w, h)
    new_size = (int(w * ratio), int(h * ratio))
    resized = img.resize(new_size, Image.LANCZOS)
    print(f"  缩放 {w}x{h} → {new_size[0]}x{new_size[1]}")
    return resized


def trim_transparent(img):
    """裁掉完全透明的边框"""
    if img.mode != 'RGBA':
        return img
    
    # 找到非透明区域的边界框
    bbox = img.getbbox()
    if bbox:
        old_w, old_h = img.size
        trimmed = img.crop(bbox)
        print(f"  裁切透明边框: {old_w}x{old_h} → {trimmed.size[0]}x{trimmed.size[1]}")
        return trimmed
    return img


def process_image(input_path, output_path, crop_top=100, max_size=1024):
    """处理单张图片：完整流程"""
    print(f"\n处理: {Path(input_path).name}")
    
    try:
        # 1. 加载原图
        img = Image.open(input_path)
        orig_mode = img.mode
        orig_size = img.size
        print(f"  原始: {orig_mode} {orig_size[0]}x{orig_size[1]}")
        
        # 如果是RGBA但实际不透明，转为RGB再处理
        if img.mode == 'RGBA':
            if img.getextrema()[3][0] >= 254:  # 完全不透明
                rgb_img = Image.new('RGB', img.size, (255,255,255))
                rgb_img.paste(img, mask=img.split()[3])
                img = rgb_img
        
        # 2. 裁剪AI logo（在去背景之前）
        img = crop_logo(img, crop_top=crop_top)
        
        # 3. 去除背景 → RGBA
        img = remove_background(img)
        
        # 4. 裁切透明边框
        img = trim_transparent(img)
        
        # 5. 缩放到合理尺寸
        img = resize_pet(img, max_size=max_size)
        
        # 6. 确保输出目录存在
        out_path = Path(output_path)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        
        # 7. 保存
        img.save(str(out_path), 'PNG', optimize=True)
        
        final_size = os.path.getsize(str(out_path))
        print(f"  ✅ 保存: {out_path.name} ({img.size[0]}x{img.size[1]}, {final_size//1024}KB)")
        return True
        
    except Exception as e:
        print(f"  ❌ 错误: {e}")
        return False


def auto_assign_actions(files):
    """
    当文件数!=9时，自动分配动作名。
    目前策略：按文件名排序后顺序分配。
    TODO: 后续可以用视觉特征分析来自动识别动作
    """
    n = len(files)
    if n == 9:
        return dict(zip(files, ACTION_NAMES))
    elif n < 9:
        # 文件不够，先分配已有的
        sorted_files = sorted(files)
        assigned = dict(zip(sorted_files, ACTION_NAMES[:n]))
        missing = ACTION_NAMES[n:]
        print(f"  ⚠️ 只有{n}张图，缺少: {', '.join(missing)}")
        return assigned
    else:
        sorted_files = sorted(files)
        return dict(zip(sorted_files, ACTION_NAMES))


def process_pet(pet_name, pet_config):
    """处理一只宠物的所有阶段"""
    source_dir = pet_config["source_dir"]
    prefix = pet_config["output_prefix"]
    
    print(f"\n{'='*60}")
    print(f"🐾 处理宠物: {pet_config['emoji']} {pet_name}")
    print(f"   源目录: {source_dir}")
    print(f"   输出前缀: {prefix}")
    print(f"{'='*60}")
    
    if not source_dir.exists():
        print(f"❌ 源目录不存在: {source_dir}")
        return {}
    
    results = {}
    
    for stage_dir_name, stage_name in STAGE_MAP.items():
        stage_source = source_dir / stage_dir_name
        if not stage_source.exists():
            print(f"\n⏭️  {stage_dir_name}/ 不存在，跳过")
            continue
        
        png_files = list(stage_source.glob("*.png"))
        jpg_files = list(stage_source.glob("*.jpg")) + list(stage_source.glob("*.jpeg"))
        all_files = png_files + jpg_files
        
        if not all_files:
            print(f"\n⚠️  {stage_dir_name}/ 下没有图片文件")
            continue
        
        print(f"\n📁 {stage_dir_name} ({stage_name}): {len(all_files)}张图片")
        
        # 自动分配动作名
        action_map = auto_assign_actions(all_files)
        
        stage_output = OUTPUT_DIR / prefix / stage_name
        stage_results = []
        
        for f, action in action_map.items():
            output_path = stage_output / f"{action}.png"
            
            # 裁剪量根据图片大小调整
            test_img = Image.open(f)
            crop_amt = min(120, int(test_img.size[0] * 0.06))  # 约6%或最多120px
            
            success = process_image(str(f), str(output_path), crop_top=crop_amt, max_size=1024)
            stage_results.append({
                "action": action,
                "source": f.name,
                "success": success,
                "output": str(output_path),
            })
        
        results[stage_name] = stage_results
    
    return results


# ============================================================
# 主流程
# ============================================================
def main():
    print("="*60)
    print("🎨 宠物PNG处理工具")
    print("   功能: 去底色 / 裁Logo / 缩放 / 重命名")
    print("="*60)
    
    # 检查numpy
    try:
        import numpy as np
        print(f"✅ numpy 可用 ({np.__version__})")
    except ImportError:
        print("❌ 需要安装 numpy: pip3 install numpy")
        sys.exit(1)
    
    total_results = {}
    
    for pet_name, pet_config in PETS.items():
        results = process_pet(pet_name, pet_config)
        total_results[pet_name] = results
    
    # 输出汇总
    print(f"\n\n{'='*60}")
    print("📊 处理汇总")
    print(f"{'='*60}")
    
    for pet_name, stages in total_results.items():
        print(f"\n{pet_name}:")
        for stage_name, files in stages.items():
            success_count = sum(1 for f in files if f["success"])
            print(f"  {stage_name}: {success_count}/{len(files)} 张成功")


if __name__ == "__main__":
    main()
