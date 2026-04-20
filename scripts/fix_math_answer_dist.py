#!/usr/bin/env python3
"""
修复数学题库答案ABCD分布不均问题 v4（最终修正版）。
处理两种前缀格式：'B. 11/12'(有空格) 和 'B.55°'(无空格)
"""

import json
import random
import copy
import re

BASE = "/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/"

FILES = [
    ("questions_math_basic.json", "数与运算"),
    ("questions_math_junior_algebra.json", "初中整式"),
    ("questions_math_geometry.json", "图形与空间"),
    ("questions_math_junior_geo.json", "初中几何"),
]

PREFIXES = ["A. ", "B. ", "C. ", "D. "]


def get_distribution(data):
    dist = {"A": 0, "B": 0, "C": 0, "D": 0}
    for q in data:
        ans_letter = (q.get("answer") or "")[0]
        if ans_letter in dist:
            dist[ans_letter] += 1
    return dist


def print_dist(label, dist):
    total = sum(dist.values())
    parts = []
    for k in "ABCD":
        pct = dist[k] / total * 100 if total > 0 else 0
        parts.append("{}:{}({:.1f}%)".format(k, dist[k], pct))
    print("  {}: {} (total={})".format(label, " | ".join(parts), total))


def extract_answer_content(answer_full):
    s = answer_full.strip()
    # 格式1: "X. 内容" (标准格式，带空格)
    if len(s) >= 3 and s[1] == "." and s[2] == " ":
        return s[3:]
    # 格式2: "X.内容" (无空格)
    if len(s) >= 2 and s[1] == ".":
        rest = s[2:]
        if len(rest) >= 2 and rest[1] == ".":
            m = re.match(r"^[A-D]\.[A-D]\.(.+)$", s)
            if m:
                return m.group(1)
        return rest
    m = re.match(r"^[A-D]\.(\s*)(.+)$", s)
    if m:
        return m.group(2)
    return s


def fix_distribution_v4(filepath, name):
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    original_data = copy.deepcopy(data)

    total = len(data)
    print()
    print("=" * 60)
    print("=== {} ({}, {}题) ===".format(name, filepath.split("/")[-1], total))

    before_dist = get_distribution(data)
    print_dist("修复前", before_dist)

    base_count = total // 4
    remainder = total % 4
    target_counts = {"A": base_count, "B": base_count, "C": base_count, "D": base_count}
    for idx, letter in enumerate("ABCD"):
        if idx < remainder:
            target_counts[letter] += 1

    print("  目标: A:{} B:{} C:{} D:{}".format(
        target_counts["A"], target_counts["B"], target_counts["C"], target_counts["D"]))

    random.seed(42)

    # Step 1: 收集所有题目的答案信息
    questions_info = []
    for q in data:
        answer_full = q["answer"]
        answer_content = extract_answer_content(answer_full)
        wrong_contents = []
        seen_contents = set([answer_content])
        for opt in q["options"]:
            opt_content = extract_answer_content(opt)
            if opt_content != answer_content and opt_content not in seen_contents:
                wrong_contents.append(opt_content)
                seen_contents.add(opt_content)
        questions_info.append({
            "correct_content": answer_content,
            "wrong_contents": wrong_contents,
        })

    # Step 2: 分配目标答案位置
    target_positions = []
    for letter in "ABCD":
        target_positions.extend([letter] * target_counts[letter])
    assert len(target_positions) == total
    random.shuffle(target_positions)

    # Step 3: 重建每道题的 options 和 answer
    for i, q in enumerate(data):
        info = questions_info[i]
        target_letter = target_positions[i]
        target_idx = ord(target_letter) - ord("A")
        correct_content = info["correct_content"]
        wrong_contents = list(info["wrong_contents"])

        while len(wrong_contents) < 3:
            wrong_contents.append("_错误{}_".format(len(wrong_contents)+1))

        random.shuffle(wrong_contents)

        new_options = [None] * 4
        new_options[target_idx] = PREFIXES[target_idx] + correct_content

        wrong_pos = 0
        for pos in range(4):
            if pos != target_idx:
                new_options[pos] = PREFIXES[pos] + wrong_contents[wrong_pos]
                wrong_pos += 1

        q["options"] = new_options
        q["answer"] = PREFIXES[target_idx] + correct_content

    after_dist = get_distribution(data)
    print_dist("修复后", after_dist)

    max_pct = max(after_dist[k] / total * 100 for k in "ABCD")
    min_pct = min(after_dist[k] / total * 100 for k in "ABCD")
    print("  差距: {:.1f}% ~ {:.1f}% (spread={:.1f}%)".format(min_pct, max_pct, max_pct - min_pct))

    errors = verify_integrity(data)
    prefix_errors = verify_prefix_format(data)
    all_errors = errors + prefix_errors
    if all_errors:
        print("  ⚠️ 发现{}个问题!".format(len(all_errors)))
        for e in all_errors[:10]:
            print("    - {}".format(e))
    else:
        print("  ✅ 全部验证通过")

    field_errors = verify_fields_unchanged(original_data, data)
    if field_errors:
        print("  ⚠️ 字段变更: {}".format(field_errors))
    else:
        print("  ✅ 非答案字段均未变更")

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    return after_dist


def verify_integrity(data):
    errors = []
    for idx, q in enumerate(data):
        answer = q.get("answer", "")
        options = q.get("options", [])
        if not answer:
            errors.append("Q#{} 空answer".format(idx))
        elif answer not in options:
            errors.append("Q#{} answer不在options中: {}".format(idx, answer[:30]))
    return errors


def verify_prefix_format(data):
    errors = []
    for idx, q in enumerate(data):
        for j, opt in enumerate(q["options"]):
            expected_prefix = chr(ord("A") + j) + ". "
            if not opt.startswith(expected_prefix):
                tag = "Q#{} option[{}]前缀异常: {}".format(idx, j, repr(opt[:20]))
                errors.append(tag)
            if re.match(r"^[A-D]\.[A-D]\.", opt):
                tag = "Q#{} option[{}]双重前缀: {}".format(idx, j, repr(opt[:20]))
                errors.append(tag)
        ans = q.get("answer", "")
        if ans and re.match(r"^[A-D]\.[A-D]\.", ans):
            tag = "Q#{} answer双重前缀: {}".format(idx, repr(ans[:20]))
            errors.append(tag)
    return errors


def verify_fields_unchanged(original, modified):
    protected_fields = ["id", "type", "question", "analysis", "knowledge_tag", "topic", "difficulty", "grade"]
    changed = []
    for i, (o, m) in enumerate(zip(original, modified)):
        for field in protected_fields:
            if o.get(field) != m.get(field):
                changed.append("Q#.{}".format(field))
    return changed[:10]


if __name__ == "__main__":
    all_results = {}
    for fname, name in FILES:
        filepath = BASE + fname
        result = fix_distribution_v4(filepath, name)
        all_results[name] = result

    print()
    print("=" * 60)
    print("=== 最终汇总 ===")
    for name, dist in all_results.items():
        print_dist(name, dist)
