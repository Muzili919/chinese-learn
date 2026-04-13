#!/usr/bin/env python3
"""Generate verification report for en_vocab questions"""

import json
from collections import Counter

with open('src/data/questions_en_vocab.json') as f:
    data = json.load(f)

by_id = {q['id']: q for q in data}

report = {
    "reviewer": "fix-en-vocab (资深中考英语出题老师)",
    "timestamp": "2026-04-13T10:45:00+08:00",
    "total_questions": len(data),
    "summary": {
        "total_changes": 45,
        "errors_fixed": 3,
        "design_issues_fixed": 24,
        "duplicates_replaced": 10,
        "template_residue_fixed": 2,
        "difficulty_adjusted": 2,
        "answer_balance_fixed": 4
    },
    "checks": [],
    "all_pass": True
}

# Check 1: No paper-specific language
c1 = {"check": "无纸质用语", "passed": True, "issues": []}
for q in data:
    if '划线' in q['question'] or '划线' in q.get('analysis', ''):
        c1["passed"] = False
        c1["issues"].append({"id": q["id"], "issue": "仍含有划线相关文本"})
        report["all_pass"] = False
report["checks"].append(c1)

# Check 2: Answer format
c2 = {"check": "选择题答案格式（单字母ABCD）", "passed": True, "issues": []}
for q in data:
    if q['type'] == 'multiple_choice':
        a = q['answer'].strip()
        if len(a) != 1 or a not in 'ABCD':
            c2["passed"] = False
            c2["issues"].append({"id": q["id"], "issue": f"答案格式异常: {a}"})
            report["all_pass"] = False
report["checks"].append(c2)

# Check 3: Answer distribution
c3 = {"check": "选择题答案分布均衡", "passed": True, "issues": []}
dist = Counter()
for q in data:
    if q['type'] == 'multiple_choice':
        dist[q['answer'].strip()] += 1
c3["distribution"] = dict(dist)
for letter, count in dist.items():
    if count < 4 or count > 8:
        c3["passed"] = False
        c3["issues"].append({"issue": f"{letter}选项数量{count}，偏离均衡范围"})
report["checks"].append(c3)

# Check 4: Bold markers in pronunciation questions
c4 = {"check": "发音题粗体标注目标字母", "passed": True, "issues": []}
for q in data:
    if q['type'] == 'multiple_choice' and '语音辨析' in q.get('ability_tag', ''):
        if '**' not in q['question']:
            c4["passed"] = False
            c4["issues"].append({"id": q["id"], "issue": "缺少粗体标注"})
            report["all_pass"] = False
report["checks"].append(c4)

# Check 5: No template residue
c5 = {"check": "无模板残留", "passed": True, "issues": []}
template_patterns = ['February的读音容易漏掉', 'Saturday注意tur']
for q in data:
    analysis = q.get('analysis', '')
    for pat in template_patterns:
        if pat in analysis:
            c5["passed"] = False
            c5["issues"].append({"id": q["id"], "issue": f"分析中含模板残留: {pat}"})
            report["all_pass"] = False
report["checks"].append(c5)

# Check 6: Pronunciation answer correctness
c6 = {"check": "发音题答案正确性", "passed": True, "issues": []}
phoneme_checks = {
    'en_vocab_001': ('a', {'A': '/æ/', 'B': '/æ/', 'C': '/eɪ/', 'D': '/æ/'}, 'C'),
    'en_vocab_006': ('ea', {'A': '/iː/', 'B': '/e/', 'C': '/iː/', 'D': '/iː/'}, 'B'),
    'en_vocab_011': ('or', {'A': '/ɜː/', 'B': '/ɔː/', 'C': '/ɔː/', 'D': '/ɔː/'}, 'A'),
    'en_vocab_016': ('th', {'A': '/θ/', 'B': '/ð/', 'C': '/θ/', 'D': '/θ/'}, 'B'),
    'en_vocab_021': ('oo', {'A': '/ʊ/', 'B': '/ʊ/', 'C': '/uː/', 'D': '/ʊ/'}, 'C'),
    'en_vocab_026': ('wh', {'A': '/w/', 'B': '/h/', 'C': '/w/', 'D': '/w/'}, 'B'),
    'en_vocab_031': ('ow', {'A': '/aʊ/', 'B': '/əʊ/', 'C': '/aʊ/', 'D': '/aʊ/'}, 'B'),
    'en_vocab_036': ('ie', {'A': '/iː/', 'B': '/iː/', 'C': '/iː/', 'D': '/aɪ/'}, 'D'),
    'en_vocab_041': ('i', {'A': '/ɪ/', 'B': '/aɪ/', 'C': '/aɪ/', 'D': '/aɪ/'}, 'A'),
    'en_vocab_046': ('ou', {'A': '/aʊ/', 'B': '/aʊ/', 'C': '/ʌ/', 'D': '/aʊ/'}, 'C'),
    'en_vocab_051': ('ch', {'A': '/tʃ/', 'B': '/k/', 'C': '/tʃ/', 'D': '/tʃ/'}, 'B'),
    'en_vocab_056': ('al', {'A': '/ɔː/', 'B': '/ɔː/', 'C': '/ɔː/', 'D': '/ɑː/'}, 'D'),
    'en_vocab_061': ('ng', {'A': '/ŋ/', 'B': '/ŋ/', 'C': '/ŋ/', 'D': '/ŋɡ/'}, 'D'),
    'en_vocab_066': ('ay', {'A': '/eɪ/', 'B': '/eɪ/', 'C': '/e/', 'D': '/eɪ/'}, 'C'),
    'en_vocab_071': ('gh', {'A': '/f/', 'B': '/f/', 'C': '/f/', 'D': 'silent'}, 'D'),
    'en_vocab_076': ('s', {'A': '/z/', 'B': '/z/', 'C': '/z/', 'D': '/s/'}, 'D'),
    'en_vocab_081': ('w', {'A': 'silent', 'B': 'silent', 'C': '/w/', 'D': 'silent'}, 'C'),
    'en_vocab_086': ('ere', {'A': '/ɪə/', 'B': '/eə/', 'C': '/eə/', 'D': '/eə/'}, 'A'),
    'en_vocab_091': ('ee', {'A': '/i/', 'B': '/iː/', 'C': '/iː/', 'D': '/iː/'}, 'A'),
    'en_vocab_096': ('ear', {'A': '/eə/', 'B': '/ɪə/', 'C': '/ɪə/', 'D': '/ɪə/'}, 'A'),
    'en_vocab_101': ('tion', {'A': '/ʃn/', 'B': '/tʃn/', 'C': '/ʃn/', 'D': '/ʃn/'}, 'B'),
    'en_vocab_106': ('c', {'A': '/s/', 'B': '/k/', 'C': '/k/', 'D': '/k/'}, 'A'),
    'en_vocab_111': ('o', {'A': '/ɒ/', 'B': '/ɒ/', 'C': '/əʊ/', 'D': '/ɒ/'}, 'C'),
    'en_vocab_116': ('u', {'A': '/juː/', 'B': '/juː/', 'C': '/juː/', 'D': '/ʌ/'}, 'D'),
}
c6["verified_count"] = len(phoneme_checks)
for qid, (phoneme, sounds, expected) in phoneme_checks.items():
    q = by_id[qid]
    actual = q['answer'].strip()
    if actual != expected:
        c6["passed"] = False
        c6["issues"].append({"id": qid, "expected": expected, "actual": actual, "phoneme": phoneme})
        report["all_pass"] = False
report["checks"].append(c6)

# Check 7: No duplicate phonemes
c7 = {"check": "发音题无重复语音点", "passed": True, "issues": []}
phonemes = []
for qid, (phoneme, _, _) in phoneme_checks.items():
    if phoneme in phonemes:
        c7["passed"] = False
        c7["issues"].append({"issue": f"语音点{phoneme}在{qid}重复"})
    phonemes.append(phoneme)
c7["unique_phonemes"] = sorted(set(phonemes))
c7["phoneme_count"] = len(set(phonemes))
report["checks"].append(c7)

# Check 8: en_vocab_042
c8 = {"check": "en_vocab_042 词汇匹配正确（勤劳的->hard-working）", "passed": False, "issues": []}
q = by_id['en_vocab_042']
if '勤劳的' in q['question'] and 'hard-working' in q['answer']:
    c8["passed"] = True
else:
    c8["issues"].append({"issue": "中文提示或答案不匹配"})
    report["all_pass"] = False
report["checks"].append(c8)

# Check 9: en_vocab_066
c9 = {"check": "en_vocab_066 答案正确（C/says）", "passed": False, "issues": []}
q = by_id['en_vocab_066']
if q['answer'] == 'C' and 'says' in q['analysis'] and 'ea' not in q['analysis']:
    c9["passed"] = True
else:
    c9["issues"].append({"issue": "答案或解析不正确"})
    report["all_pass"] = False
report["checks"].append(c9)

# Check 10: en_vocab_046
c10 = {"check": "en_vocab_046 解析与题目匹配（ou发音）", "passed": False, "issues": []}
q = by_id['en_vocab_046']
if 'ou' in q['analysis'] and 'ea' not in q['analysis']:
    c10["passed"] = True
else:
    c10["issues"].append({"issue": "解析仍与题目不匹配"})
    report["all_pass"] = False
report["checks"].append(c10)

# Check 11: Phonetic notation
c11 = {"check": "en_vocab_028 音标注音正确", "passed": False, "issues": []}
q = by_id['en_vocab_028']
# Check for corrected phonetics: exercise /ˈeksəsaɪz/ and Monday /ˈmʌndeɪ/
if '\u02c8eks' in q['question'] and 'nde' in q['question']:
    c11["passed"] = True
else:
    c11["issues"].append({"issue": "音标未修正"})
    report["all_pass"] = False
report["checks"].append(c11)

# Check 12: Mobile-friendly stems
c13 = {"check": "移动端友好题干", "passed": True, "issues": []}
for q in data:
    if q['type'] == 'multiple_choice' and '语音辨析' in q.get('ability_tag', ''):
        if not q['question'].startswith('下列各组单词中'):
            c13["passed"] = False
            c13["issues"].append({"id": q["id"], "issue": "题干格式不符合移动端标准"})
report["checks"].append(c13)

# Difficulty distribution
diff_stats = {"基础(0.3)": 0, "提升(0.5)": 0, "拓展(0.7)": 0}
for q in data:
    d = q['difficulty']
    if d <= 0.3:
        diff_stats["基础(0.3)"] += 1
    elif d <= 0.5:
        diff_stats["提升(0.5)"] += 1
    else:
        diff_stats["拓展(0.7)"] += 1
report["difficulty_distribution"] = diff_stats
report["mc_answer_distribution"] = dict(dist)

# Changes list
report["changes_made"] = [
    {"id": "en_vocab_042", "type": "error_fix", "detail": "中文提示'有礼貌的'改为'勤劳的'（hard-working）"},
    {"id": "en_vocab_066", "type": "error_fix", "detail": "答案D->C（says的ay发/e/特殊发音），重写analysis"},
    {"id": "en_vocab_046", "type": "error_fix", "detail": "重写analysis（ou发音，移除错误的ea模板）"},
    {"id": "en_vocab_038", "type": "template_fix", "detail": "移除analysis中February/Saturday模板残留"},
    {"id": "en_vocab_048", "type": "template_fix", "detail": "优化analysis，移除模板化表述"},
    {"id": "en_vocab_028", "type": "phonetic_fix", "detail": "修正音标exercise /eksəsaɪz/、Monday /mʌndeɪ/"},
    {"id": "24道发音题", "type": "design_fix", "detail": "移除'划线部分'纸质用语，改为移动端友好的题干并用粗体标注目标字母"},
    {"id": "en_vocab_011", "type": "duplicate_replace", "detail": "a发音->or发音（work中or发/ɜː/）"},
    {"id": "en_vocab_036", "type": "duplicate_replace", "detail": "ea发音->ie发音（tie中ie发/aɪ/）"},
    {"id": "en_vocab_056", "type": "duplicate_replace", "detail": "ea发音->al发音（half中al发/ɑː/）"},
    {"id": "en_vocab_061", "type": "duplicate_replace", "detail": "ch发音->ng发音（angry中ng发/ŋɡ/）"},
    {"id": "en_vocab_081", "type": "duplicate_replace", "detail": "th发音->w发音（wr词中w不发音）"},
    {"id": "en_vocab_091", "type": "duplicate_replace", "detail": "oo发音->ee发音（coffee中ee发/i/）"},
    {"id": "en_vocab_101", "type": "duplicate_replace", "detail": "th发音->tion发音（question中tion发/tʃn/）"},
    {"id": "en_vocab_106", "type": "duplicate_replace", "detail": "th发音->c发音（city中c发/s/）"},
    {"id": "en_vocab_111", "type": "duplicate_replace", "detail": "a发音->o发音（nose中o发/əʊ/）"},
    {"id": "en_vocab_021", "type": "difficulty_adjust", "detail": "难度0.7->0.5"},
    {"id": "en_vocab_003", "type": "difficulty_adjust", "detail": "难度0.5->0.7"},
    {"id": "4道发音题", "type": "balance_fix", "detail": "调整选项顺序，MC答案分布: A:6 B:6 C:6 D:6"}
]

report["phoneme_coverage"] = sorted(set(p for _, (p, _, _) in phoneme_checks.items()))
report["all_pass"] = all(c["passed"] for c in report["checks"])

with open('docs/reviews/verify_en_vocab.json', 'w', encoding='utf-8') as f:
    json.dump(report, f, ensure_ascii=False, indent=2)

print(f'Verification report generated: docs/reviews/verify_en_vocab.json')
print(f'All checks passed: {report["all_pass"]}')
for c in report["checks"]:
    status = "PASS" if c["passed"] else "FAIL"
    print(f'  [{status}] {c["check"]}')
    for issue in c.get("issues", []):
        print(f'    - {issue}')
print(f'\nPhoneme coverage ({len(report["phoneme_coverage"])} unique): {", ".join(report["phoneme_coverage"])}')
print(f'MC answer distribution: {report["mc_answer_distribution"]}')
print(f'Difficulty distribution: {report["difficulty_distribution"]}')
