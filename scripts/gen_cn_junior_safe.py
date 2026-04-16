#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成初中语文（7-9年级）听写词库 - 安全版本
所有字符串使用ASCII引号，内部引号已处理
"""
import json
import re

def parse_original_file():
    """从原始文件提取数据（处理中文引号问题）"""
    result = {}
    current_key = None
    
    with open("/Volumes/ORICO/xinwen/claudecode/chinese-learn/scripts/generate_cn_junior_dictation.py", "r", encoding="utf-8") as f:
        content = f.read()
    
    lines = content.split("\n")
    
    for line in lines:
        stripped = line.strip()
        
        # Detect list start
        if re.match(r'^g[789]_s[12]\s*=\s*\[', stripped):
            current_key = stripped.split('=')[0].strip()
            result[current_key] = []
            continue
        
        # Detect data lines like: ("word", "pinyin", "example with quotes"),
        if current_key and stripped.startswith('("'):
            # Remove trailing comma and closing paren if present
            clean = stripped.rstrip(',')
            if clean.endswith(')'):
                clean = clean[:-1]
            
            # Extract using a more robust method
            # Find all string contents between quotes
            # Strategy: split by quote, take pairs
            parts = clean.split('"')
            # parts[0] should be "(" (before first ")
            # parts[1] = word
            # parts[2] = ", "
            # parts[3] = pinyin  
            # parts[4] = ", "
            # parts[5:] = example content (may contain quotes!)
            
            if len(parts) >= 6:
                word = parts[1]
                pinyin = parts[3]
                # Everything from part 5 onwards is the example (minus trailing )
                example_parts = parts[5:]
                example = '"'.join(example_parts)
                # Clean up any trailing paren or comma
                example = example.rstrip(',)').strip()
                
                result[current_key].append((word, pinyin, example))
    
    return result


def generate_words():
    """Generate all words for grades 7-9"""
    all_words = []
    
    data = parse_original_file()
    
    grade_map = {
        'g7_s1': (7, "上册"),
        'g7_s2': (7, "下册"),
        'g8_s1': (8, "上册"),
        'g8_s2': (8, "下册"),
        'g9_s1': (9, "上册"),
        'g9_s2': (9, "下册"),
    }
    
    counters = {}  # Track per-grade counters
    
    for key in ['g7_s1', 'g7_s2', 'g8_s1', 'g8_s2', 'g9_s1', 'g9_s2']:
        if key not in data:
            print(f"WARNING: {key} not found in parsed data!")
            continue
            
        grade, semester = grade_map[key]
        grade_prefix = f"cn_g{grade}_"
        
        # Initialize counter for this grade
        if grade not in counters:
            counters[grade] = 0
        
        items = data[key]
        print(f"{key}: {len(items)} words")
        
        for word, pinyin, example in items:
            counters[grade] += 1
            entry = {
                "id": f"{grade_prefix}{counters[grade]:03d}",
                "word": word,
                "pinyin": pinyin,
                "grade": grade,
                "semester": semester,
                "example": example
            }
            all_words.append(entry)
    
    return all_words


def merge_with_existing(new_words):
    """Merge new words into existing file"""
    existing_path = "/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/dictation_cn_words.json"
    
    with open(existing_path, "r", encoding="utf-8") as f:
        existing = json.load(f)
    
    print(f"\nExisting words: {len(existing)}")
    print(f"New words to add: {len(new_words)}")
    
    # Merge
    merged = existing + new_words
    
    # Write back
    with open(existing_path, "w", encoding="utf-8") as f:
        json.dump(merged, f, ensure_ascii=False, indent=2)
    
    print(f"Total after merge: {len(merged)}")
    return merged


def main():
    print("=" * 50)
    print("Generating Junior High Chinese Dictation Words")
    print("=" * 50)
    
    new_words = generate_words()
    
    print(f"\nTotal new words generated: {len(new_words)}")
    
    # Stats by grade
    grade_stats = {}
    sem_stats = {}
    for w in new_words:
        g = w["grade"]
        s = w["semester"]
        grade_stats[g] = grade_stats.get(g, 0) + 1
        sem_stats[f"{g}{s}"] = sem_stats.get(f"{g}{s}", 0) + 1
    
    print("\nBy grade:")
    for g in sorted(grade_stats):
        print(f"  Grade {g}: {grade_stats[g]}")
    
    print("\nBy semester:")
    for s in sorted(sem_stats):
        print(f"  {s}: {sem_stats[s]}")
    
    # Merge with existing file
    print("\n" + "=" * 50)
    print("Merging with existing file...")
    print("=" * 50)
    
    merged = merge_with_existing(new_words)
    
    # Verify
    print("\nVerification:")
    ids = [w["id"] for w in merged]
    unique_ids = set(ids)
    print(f"  Total entries: {len(merged)}")
    print(f"  Unique IDs: {len(unique_ids)}")
    if len(ids) != len(unique_ids):
        print("  WARNING: Duplicate IDs found!")
        from collections import Counter
        dupes = [k for k, v in Counter(ids).items() if v > 1]
        print(f"  Duplicates: {dupes}")
    else:
        print("  All IDs are unique.")
    
    # Show ID range
    print(f"\nID range: {ids[0]} to {ids[-1]}")
    
    print("\nDone!")


if __name__ == "__main__":
    main()
