#!/usr/bin/env python3
"""
宠物图片质量修复脚本
功能：
1. 去除背景（将非透明区域转为真正的透明背景）
2. 裁剪边缘空白/边角料
3. 检测并标记有文字水印的图片
4. 输出清理报告

用法：
  python scripts/fix_pet_transparency.py --pet petal_fairy --dry-run    # 先预览哪些有问题
  python scripts/fix_pet_transparency.py --pet petal_fairy             # 执行修复
  python scripts/fix_pet_transparency.py --all                         # 修复所有指定宠物
"""

import os
import sys
import argparse
from pathlib import Path
from PIL import Image, ImageChops, ImageFilter
import numpy as np

# 项目根目录
PROJECT_ROOT = Path(__file__).parent.parent
PUBLIC_PETS = PROJECT_ROOT / "public" / "pets"

# 需要修复的7只宠物
PETS_TO_FIX = [
    "petal_fairy",   # 花瓣精灵：千问AI水印 + 残影
    "starpony",      # 星光小马：残影 + 透明度差
    "kungfu",        # 功夫滚滚：背景不透明
    "mantis",        # 战镰螳螂：黑色方块残留 + 不透明
    "butterfly",     # 冰晶蝴蝶：黑色方块 + 不透明
    "fox",           # 银月狐：其他宠物残影
    "corgi",         # 小柯基：背景没去干净
]

# 9种动作表情
EMOTIONS = ["reading", "sleeping", "happy", "sad_cry", "angry", 
            "eating", "wave", "excited", "normal"]

# 3个阶段
STAGES = ["stage1", "stage2", "stage3"]


def detect_watermark(img):
    """检测图片中是否有文字水印（简单启发式）"""
    arr = np.array(img)
    # 如果是RGBA
    if arr.shape[2] == 4:
        rgb = arr[:, :, :3]
        alpha = arr[:, :, 3]
    else:
        rgb = arr
        alpha = None
    
    has_watermark = False
    
    # 检查右下角区域是否有异常颜色聚集（常见水印位置）
    h, w = rgb.shape[:2]
    bottom_right = rgb[int(h*0.7):, int(w*0.6):, :]
    
    # 检测深色像素聚集（文字通常是深色）
    dark_pixels = np.sum(np.all(bottom_right < [80, 80, 80], axis=2))
    dark_ratio = dark_pixels / bottom_right.reshape(-1, 3).shape[0]
    
    if dark_ratio > 0.03:  # 右下角深色像素超过3%
        has_watermark = True
    
    return has_watermark


def detect_background_issues(img):
    """检测背景是否真的透明或有颜色残留"""
    if img.mode != 'RGBA':
        return "not_rgba"  # 不是RGBA格式，说明没有alpha通道
    
    arr = np.array(img)
    alpha = arr[:, :, 3]
    
    # 检查边缘区域是否完全透明
    h, w = alpha.shape
    border_alpha_top = alpha[0, :]
    border_alpha_bottom = alpha[-1, :]
    border_alpha_left = alpha[:, 0]
    border_alpha_right = alpha[:, -1]
    
    avg_border = (np.mean(border_alpha_top) + np.mean(border_alpha_bottom) +
                  np.mean(border_alpha_left) + np.mean(border_alpha_right)) / 4
    
    if avg_border > 50:
        return "opaque_border"  # 边缘不透明
    
    # 检查角落区域
    corners = [
        alpha[:int(h*0.15), :int(w*0.15)],       # 左上
        alpha[:int(h*0.15), int(w*0.85):],       # 右上
        alpha[int(h*0.85):, :int(w*0.15)],       # 左下
        alpha[int(h*0.85):, int(w*0.85):],       # 右下
    ]
    
    for i, corner in enumerate(corners):
        if np.mean(corner) > 30:
            return f"corner_artifact_{i}"  # 角落有残留
    
    return None


def remove_background(img):
    """
    移除背景，使图片真正透明
    策略：找到主物体区域，其余部分设为透明
    """
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    arr = np.array(img, dtype=np.float32)
    rgb = arr[:, :, :3].copy()
    alpha = arr[:, :, 3].copy()
    
    # 方法：基于颜色的背景去除
    # 找到四角的颜色作为参考背景色
    h, w = rgb.shape[:2]
    
    # 取四个角的平均色作为背景参考
    corner_colors = [
        rgb[:5, :5].reshape(-1, 3),
        rgb[:5, -5:].reshape(-1, 3),
        rgb[-5:, :5].reshape(-1, 3),
        rgb[-5:, -5:].reshape(-1, 3),
    ]
    bg_color = np.vstack(corner_colors).mean(axis=0)
    
    # 计算每个像素与背景色的距离
    diff = np.sqrt(np.sum((rgb - bg_color) ** 2, axis=2))
    
    # 差异小的像素 → 降低其alpha值
    threshold = 35  # 可调整
    mask = diff < threshold
    
    # 渐变过渡（避免硬边缘）
    soft_mask = np.clip((diff - threshold / 2) / (threshold / 2), 0, 1).astype(np.float32)
    new_alpha = np.maximum(alpha * soft_mask, 0)
    
    # 应用新的alpha通道
    arr[:, :, 3] = new_alpha.astype(np.uint8)
    
    result = Image.fromarray(arr.astype(np.uint8), 'RGBA')
    
    # 自动裁剪透明边缘
    result = crop_transparent_edges(result)
    
    return result


def crop_transparent_edges(img):
    """裁剪四周完全透明的区域"""
    if img.mode != 'RGBA':
        return img
    
    bbox = Image.fromarray(
        (np.array(img)[:, :, 3] > 10).astype(np.uint8) * 255,
        mode='L'
    ).getbbox()
    
    if bbox:
        return img.crop(bbox)
    return img


def process_image(filepath, dry_run=False):
    """处理单张图片，返回诊断信息"""
    try:
        img = Image.open(filepath)
        
        issues = []
        
        # 检测水印
        if detect_watermark(img):
            issues.append("WATERMARK_DETECTED")
        
        # 检测背景问题
        bg_issue = detect_background_issues(img)
        if bg_issue:
            issues.append(f"BG_{bg_issue}")
        
        # 如果不是dry-run且有背景问题则修复
        if not dry_run and any(i.startswith("BG_") for i in issues):
            fixed = remove_background(img)
            
            # 备份原文件
            backup_path = filepath.with_suffix('.png.backup')
            if not backup_path.exists():
                os.replace(filepath, backup_path)
            
            fixed.save(filepath, 'PNG')
            print(f"  ✅ 已修复: {filepath.name} (问题: {', '.join(issues)})")
        elif dry_run:
            status = "🔴 需要修复" if issues else "✅ 正常"
            print(f"  {status}: {filepath.name} -> {', '.join(issues) if issues else 'OK'}")
        else:
            print(f"  ⏭️ 跳过(无BG问题或仅有水印): {filepath.name}")
        
        return {
            "file": filepath.name,
            "issues": issues,
            "size": img.size,
        }
    except Exception as e:
        print(f"  ❌ 错误: {filepath.name} -> {e}")
        return {"file": filepath.name, "issues": [f"ERROR: {e}"], "size": None}


def scan_pet(pet_name, dry_run=True):
    """扫描一只宠物的所有图片"""
    pet_dir = PUBLIC_PETS / pet_name
    if not pet_dir.exists():
        print(f"⚠️ 宠物目录不存在: {pet_dir}")
        return []
    
    results = []
    print(f"\n{'='*60}")
    print(f"🐾 宠物: {pet_name}")
    print(f"{'='*60}")
    
    for stage in STAGES:
        stage_dir = pet_dir / stage
        if not stage_dir.exists():
            print(f"\n  📁 {stage}/ (不存在)")
            continue
        
        files = list(stage_dir.glob("*.png"))
        # 过滤掉 macOS 元数据文件
        files = [f for f in files if not f.name.startswith('._')]
        
        if not files:
            print(f"\n  📁 {stage}/ (空目录)")
            continue
        
        print(f"\n  📁 {stage}/ ({len(files)} 张)")
        
        for f in sorted(files):
            r = process_image(f, dry_run=dry_run)
            results.append(r)
    
    return results


def main():
    parser = argparse.ArgumentParser(description="宠物图片质量修复工具")
    parser.add_argument("--pet", help="指定单个宠物名称")
    parser.add_argument("--all", action="store_true", help="修复所有7只问题宠物")
    parser.add_argument("--dry-run", action="store_true", default=True, 
                        help="只扫描不修改（默认开启）")
    parser.add_argument("--fix", action="store_true", 
                        help="实际执行修复（关闭dry-run模式）")
    args = parser.parse_args()
    
    if args.fix:
        args.dry_run = False
    
    pets = []
    if args.pet:
        pets = [args.pet]
    elif args.all:
        pets = PETS_TO_FIX
    else:
        # 默认扫描全部
        pets = PETS_TO_FIX
    
    print("=" * 60)
    print("🔧 宠物图片质量扫描/修复工具")
    print(f"   模式: {'仅预览' if args.dry_run else '实际修复'}")
    print(f"   目标宠物: {', '.join(pets)}")
    print("=" * 60)
    
    all_results = {}
    for pet in pets:
        results = scan_pet(pet, dry_run=args.dry_run)
        all_results[pet] = results
    
    # 汇总报告
    print("\n" + "=" * 60)
    print("📊 汇总报告")
    print("=" * 60)
    
    total = 0
    problems = 0
    watermarks = 0
    
    for pet, results in all_results.items():
        pet_problems = sum(1 for r in results if r["issues"])
        pet_watermarks = sum(1 for r in results if "WATERMARK_DETECTED" in r["issues"])
        total += len(results)
        problems += pet_problems
        watermarks += pet_watermarks
        status = "🔴 有问题" if pet_problems else "✅ 正常"
        print(f"  {status} {pet}: {len(results)}张, {pet_problems}个问题 ({pet_watermarks}张有水印)")
    
    print(f"\n  总计: {total}张图片, {problems}个问题, {watermarks}张疑似水印")
    
    if args.dry_run:
        print(f"\n💡 提示: 加上 --fix 参数可执行实际修复")
        print(f"   注意: 水印图片需要重新生成AI图片才能解决，脚本只能修复透明度")


if __name__ == "__main__":
    main()
