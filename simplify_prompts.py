#!/usr/bin/env python3
"""
Surgical fix for SelfTestPage.jsx:
- Simplify 5 AI exam prompt functions (shorter = less token usage)
- Replace problematic template literals with string concatenation
- Each replacement uses EXACT string matching on unique fragments
"""
import re

FILE = 'src/pages/SelfTestPage.jsx'

with open(FILE, 'r', encoding='utf-8') as f:
    content = f.read()

changes = 0

# ============================================================
# 1. getChineseExamPrompt (line ~66)
# Replace the ENTIRE function body between { and closing }
# ============================================================
old1_start = "function getChineseExamPrompt(grade, examType) {"
old1_end = "// ─── 小学英语 System Prompt"

idx1_s = content.find(old1_start)
idx1_e = content.find(old1_end)
if idx1_s > 0 and idx1_e > idx1_s:
    # Extract everything between start and end markers
    before = content[:idx1_s]
    after = content[idx1_e:]
    new_func1 = """function getChineseExamPrompt(grade, examType) {
  return '\\u4F60\\u662F\\u5C0F\\u5B66\\u8BED\\u6587\\u6559\\u7814\\u5458\\uFF0C\\u4E3A' + GRADE_MAP[grade] + '\\u5B66\\u751F\\u51FA' + EXAM_TYPE_MAP[examType] + '\\u8BED\\u6587\\u8BD5\\u5377(\\u4EBA\\u6559\\u7248)\\u3002\\u6EE1\\u5206100\\u5206\\uFF0C\\u4E25\\u683CJSON\\u3002\\n\\n## \\u9898\\u578B\\n\\u4E00\\u3001\\u57FA\\u7840\\u77E5\\u8BC640\\u5206(\\u770B\\u62FC\\u97F3/\\u5B57\\音/\\u6210\\u8BED/\\u53E5\\u5B50) \\n\\u4E8C\\u3001\\u79EF\\u7D2F\\u8FD0\\u752815\\u5206(\\u53E4\\u8BD7/\\u6587\\u5B66\\u5E38\\u8BC6) \\n\\u4E09\\u3001\\u9605\\u8BFB\\u7406\\u89E325\\u5206(\\u8BFE\\u5185+\\u8BBE\\5916) \\n\\u56DB\\u3001\\u4E60\\u4F5C\\u8868\\u8FBE20\\u5206\n\n## \\u89C4\\u5219\n- choice answer=0-3; TF=true/false; fill\\u9700acceptableAnswers; writing\\u970Brubric; \\u6240\\u6709\\u9898\\u8981analysis'
}

"""
    content = before + new_func1 + after
    changes += 1
    print("✓ getChineseExamPrompt simplified")
else:
    print("✗ getChineseExamPrompt not found")

# ============================================================
# 2. getEnglishExamPrompt (~line 213)
# ============================================================
old2_start = "function getEnglishExamPrompt(grade, examType) {"
old2_end = "// ─── 初中语文 System Prompt"

idx2_s = content.find(old2_start)
idx2_e = content.find(old2_end)
if idx2_s > 0 and idx2_e > idx2_s:
    before = content[:idx2_s]
    after = content[idx2_e:]
    new_func2 = """function getEnglishExamPrompt(grade, examType) {
  return 'You are an elementary English teacher. Generate ' + GRADE_MAP[grade] + ' (PEP) ' + EXAM_TYPE_MAP[examType] + ' English test. Strict JSON. 100pts.\\n\\n## Structure\\n1. Vocabulary & Phonics(30pts) 2. Grammar & Sentences(25pts) 3. Communication(15pts) 4. Reading Comprehension(15pts) 5. Writing(15pts)\\n\\n## Rules\\n- choice=index(0-3); reorder/writing=text; truefalse=boolean; passage=60-100w; Grade ' + grade + ' level'
}

"""
    content = before + new_func2 + after
    changes += 1
    print("✓ getEnglishExamPrompt simplified")
else:
    print("✗ getEnglishExamPrompt not found")

# ============================================================
# 3. getJuniorChineseExamPrompt (~line 339)
# ============================================================
old3_start = "function getJuniorChineseExamPrompt(examType) {"
old3_end = "// ─── 初中英语 System Prompt"

idx3_s = content.find(old3_start)
idx3_e = content.find(old3_end)
if idx3_s > 0 and idx3_e > idx3_s:
    before = content[:idx3_s]
    after = content[idx3_e:]
    new_func3 = """function getJuniorChineseExamPrompt(examType) {
  const examLabel = JUNIOR_EXAM_TYPE_MAP[examType] || '期末综合'
  return '\\u4F60\\u662F\\u521D\\u4E2D\\u8BED\\u6587\\u6559\\u7814\\u5458\\uFF0C\\u4E13\\u653B\\u4E2D\\u8003\\u3002\\u51FA\\u521D\\u4E8C' + '(\\u516B\\u5E74\\u7EA7)' + '\\u4EBA\\u6559\\u7248' + examLabel + '\\u8BED\\u6587\\u8BD5\\u5377\\u3002\\u6EE1\\u5206100\\u5206\\uFF0C\\u4E25\\u683CJSON\\u3002\\n\\n## \\u9898\\u578B\\n\\u4E00\\u3001\\u79EF\\u7D2F(30) \\u4E8C\\u3001\\u6587\\u8A00\\u6587(20) \\u4E09\\u3001\\u73B0\\u4EE3\\u6587(25) \\u56DB\\u3001\\u5199\\u4F5C(25)\\n\\n## \\u89C4\\u5219\\n- choice=0-3; TF=true/false; fill\\u9700acceptableAnswers; shortanswer<=50; writing\\u970Brubric; \\u6587\\u8A00\\u6587\\u5FC5\\u987B\\u771F\\u5B9E\\u8BFE\\u6587; \\u6240\\6709\\u9898\\u8981analysis'
}

"""
    content = before + new_func3 + after
    changes += 1
    print("✓ getJuniorChineseExamPrompt simplified")
else:
    print("✗ getJuniorChineseExamPrompt not found")

# ============================================================
# 4. getJuniorEnglishExamPrompt (~line 434)
# ============================================================
old4_start = "function getJuniorEnglishExamPrompt(examType) {"
old4_end = "// ─── 初中政治 System Prompt"

idx4_s = content.find(old4_start)
idx4_e = content.find(old4_end)
if idx4_s > 0 and idx4_e > idx4_s:
    before = content[:idx4_s]
    after = content[idx4_e:]
    new_func4 = """function getJuniorEnglishExamPrompt(examType) {
  const examLabel = JUNIOR_EXAM_TYPE_MAP[examType] || '期末综合'
  return 'You are a senior junior high English teacher. Generate Grade 8 PEP ' + examLabel + ' test. Strict JSON. 100pts.\\n\\n## Structure\\n1. Language Knowledge(30pts): vocab+grammar+cloze \\n2. Reading(30pts): 2 passages \\n3. Language Use(25pts): dialogue+reorder+translation \\n4. Writing(15pts)\\n\\n## Rules\\n- choice=0-3; reorder/text=answer; TF=bool; writing=rubric; shortanswer<=40w'
}

"""
    content = before + new_func4 + after
    changes += 1
    print("✓ getJuniorEnglishExamPrompt simplified")
else:
    print("✗ getJuniorEnglishExamPrompt not found")

# ============================================================
# 5. getPoliticsExamPrompt (~line 498)
# ============================================================
old5_start = "function getPoliticsExamPrompt(examType) {"
old5_end = "// ─── AI 评分 Prompt"

idx5_s = content.find(old5_start)
idx5_e = content.find(old5_end)
if idx5_s > 0 and idx5_e > idx5_s:
    before = content[:idx5_s]
    after = content[idx5_e:]
    new_func5 = """function getPoliticsExamPrompt(examType) {
  const examLabel = JUNIOR_EXAM_TYPE_MAP[examType] || '期末综合'
  return '\\u4F60\\u662F\\u521D\\u4E2D\\u9053\\u5FB7\\u4E0E\\u6CD5\\u6CBB\\u6559\\u7814\\u5458\\uFF0C\\u4E13\\u653B\\u4E2D\\u8003\\u3002\\u51FA\\u521D\\u4E8C\\u9053\\u5FB7\\u4E0E\\u6CD5\\u6CBB' + examLabel + '\\u8BD5\\u5377\\u3002\\u6EE1\\u5206100\\u5206\\uFF0C\\u4E25\\u683CJSON\\u3002\\n\\n## \\u9898\\u578B\\n\\u4E00\\u3001\\u9009\\u62E9\\u989840\\u5206(10x4) \\n\\u4E8C\\u3001\\u975E\\u9009\\u62E9\\u989860\\u5206(\\u7B80\\u7B54+\\u6750\\u6599\\u5206\\u6790+\\u63A2\\u7A76)\\n\\n## \\u89C4\\u5219\\n- choice=0-3; shortanswer=\\u8981\\u70B9; writing=rubric; \\u6240\\u6709\\u9898\\u8981analysis; \\u96BE\\u5EA6=\\u4E2D\\u8003'
}

"""
    content = before + new_func5 + after
    changes += 1
    print("✓ getPoliticsExamPrompt simplified")
else:
    print("✗ getPoliticsExamPrompt not found")

# ============================================================
# 6. Fix getScoringPrompt - the two template returns inside .map()
# ============================================================
scoring_line1_old = "return `${i + 1}. \u3010\u4f5c\u6587/\u5b9e\u8df5\u9898\u3011\uff08${q.score}\u5206\uff09\\n\u9898\u76ee\uff1a${q.stem.slice(0, 120)}\\n${promptText ? '\u9009\u4f5c\u9898\u76ee\uff1a' + promptText + '\\n' : ''}\u5b66\u751f\u7b54\u6848\uff1a${(ua?.text || '\uff08\u672a\u4f5c\u7b54\uff09').slice(0, 300)}\\n\u8bc4\u5206\u6807\u51c6\uff1a${(q.rubric || '\u65e0').slice(0, 100)}`"
scoring_line1_new = "return (i+1) + '. \\u3010\\u4f5c\\u6587/\\u5b9e\\u8df5\\u9898\\u3011\\uff08' + q.score + '\\u5206\\uff09\\n\\u9898\\u76ee\\uff1a' + q.stem.slice(0,120) + '\\n' + (promptText ? '\\u9009\\u4f5c\\u9898\\u76ee\\uff1a' + promptText + '\\n' : '') + '\\u5b66\\u751f\\u7b54\\u6848\\uff1a' + ((ua && ua.text) || '\\uff08\\u672a\\u4f5c\\u7b54\\uff09').slice(0,300) + '\\n\\u8bc4\\u5206\\u6807\\u51c6\\uff1a' + (q.rubric || '\\u65e0').slice(0,100)"

if scoring_line1_old in content:
    content = content.replace(scoring_line1_old, scoring_line1_new)
    changes += 1
    print("✓ Scoring line 1 fixed")
else:
    print("✗ Scoring line 1 not found")

scoring_line2_old = "return `${i + 1}. \u3010\u7b80\u7b54\u9898\u3011\uff08${q.score}\u5206\uff09\\n\u9898\u76ee\uff1a${q.stem.slice(0, 150)}\\n\u5b66\u751f\u7b54\u6848\uff1a${(String(ua || '\uff08\u672a\u4f5c\u7b54\uff09')).slice(0, 300)}\\n\u53c2\u8003\u7b54\u6848\u8981\u70b9\uff1a${refAnswer}`"
scoring_line2_new = "return (i+1) + '. \\u3010\\u7b80\\u7b54\\u9898\\u3011\\uff08' + q.score + '\\u5206\\uff09\\n\\u9898\\u76ee\\uff1a' + q.stem.slice(0,150) + '\\n\\u5b66\\u751f\\u7b54\\u6848\\uff1a' + String(ua || '\\uff08\\u672a\\u4f5c\\u7b54\\uff09').slice(0,300) + '\\n\\u53c2\\u8003\\u7b54\\u6848\\u8981\\u70b9\\uff1a' + refAnswer"

if scoring_line2_old in content:
    content = content.replace(scoring_line2_old, scoring_line2_new)
    changes += 1
    print("✓ Scoring line 2 fixed")
else:
    print("✗ Scoring line 2 not found")

# ============================================================
# 7. Fix getScoringPrompt main return statement
# ============================================================
old_scoring_return_1 = "  return `你是一位阅卷老师，请对以下学生的主观题进行评分。"
if old_scoring_return_1 in content:
    # Find the full return block - from "return `" to its closing `
    # We need to find the matching closing backtick
    start_idx = content.find(old_scoring_return_1)
    if start_idx >= 0:
        # Find opening backtick
        bt_open = content.find('`', start_idx)
        # Find closing backtick (the one that ends this string)
        bt_close = content.find('`', bt_open + 1)
        if bt_close > 0:
            before_block = content[:start_idx]
            after_block = content[bt_close+1:]
            
            new_return = """  return '\\u4F60\\u662F\\u4E00\\u4F4D\\u9605\\u5377\\u8001\\u5E08\\uFF0C\\u8BF7\\u5BF9\\u4EE5\\u4E0B\\u5B66\\u751F\\u7684\\u4E3B\\u89C2\\u9898\\u8FDB\\u884C\\u8BC4\\u5206\\u3002\\n\\n## \\u8BC4\\u5206\\u89C4\\u5219\\n- \\u4E25\\u683C\\u6309\\u6EE1\\u5206\\u8BC4\\u5206\\n- ' + writingRubric + '\\n- \\u7ED9\\u5206\\u5408\\u7406\\n- \\u6BCF\\u9898\\u8BC4\\u8BED(30\\u5B57\\u5185)\\n\\n## \\u9700\\u8981\\u8BC4\\u5206\\u9898\\u76EE\\n' + items + '\\n\\n## \\u8FD4\\u56DEJSON\\u683C\\u5F0F'
"""
            content = before_block + new_return + after_block
            changes += 1
            print("✓ Scoring main return fixed")
        else:
            print("✗ Could not find closing backtick for scoring return")
    else:
        print("✗ Scoring main return pattern not found")
else:
    print("✗ Scoring main return start not found")

# Write result
with open(FILE, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\n=== Total changes: {changes} ===")
