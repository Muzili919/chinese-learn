#!/usr/bin/env python3
"""Fix template literals in SelfTestPage.jsx that cause build errors with rolldown."""
import re

with open('src/pages/SelfTestPage.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix getJuniorChineseExamPrompt
old_jc = r'''function getJuniorChineseExamPrompt(examType) {
  const examLabel = JUNIOR_EXAM_TYPE_MAP[examType] || '期末综合'
  return `你是初中语文教研员，专攻中考。出初二(八年级)人教版${examLabel}语文试卷，中考难度。满分100分，严格JSON。

## 题型与分值
一、积累运用30分：字音字形(4选择×2)、成语运用(4选择×2)、文学常识名著(4判断×1)、古诗文默写(5填空×2)
二、文言文阅读20分：原文passage + 字词解释(4填空×2) + 句子翻译(2简答×3) + 内容理解(2选择×3)
三、现代文阅读25分：1篇300-400记叙/说明文passage + 内容理解(2选择×3) + 词句理解(2简答×4) + 主旨(1简答×5) + 赏析(1简答×6)
四、写作25分：二选一作文300-400字

## JSON
{"title":"初二语文"+examLabel+"测试","totalScore":100,"sections":[{"title":"一、积累与运用(30分)","questions":[{"id":"q1","type":"choice","score":2,"stem":"题干","options":["A","B","C","D"],"answer":0,"analysis":"解析"},{"id":"q5","type":"truefalse","score":1,"stem":"题干","answer":true,"analysis":"解析"},{"id":"q9","type":"fill","score":2,"stem":"填空题","answer":"答案","acceptableAnswers":["可接受答案"],"analysis":"解析"}]},{"title":"二、文言文阅读(20分)","subsections":[{"title":"标题","passageTitle":"课文名","passage":"真实人教版课文原文200-300字","questions":[{"id":"q14","type":"fill","score":2,"stem":"解释加点词","answer":"答案","acceptableAnswers":["变体"],"analysis":"解析"},{"id":"q16","type":"shortanswer","score":3,"stem":"句子翻译","答案":"参考答案50字内","analysis":"关键词解析"}]}]},{"title":"三、现代文阅读(25分)","subsections":[{"title":"标题","passageTitle":"标题","passage":"文章300-400字","questions":[{"id":"q19","type":"choice","score":3,"stem":"题干","options":["A","B","C","D"],"answer":1,"analysis":"解析"},{"id":"q21","type":"shortanswer","score":4,"stem":"题干","答案":"参考答案","analysis":"解析"}]}]},{"title":"四、写作(25分)","questions":[{"id":"q24","type":"writing","score":25,"stem":"二选一作文300-400字","prompts":[{"title":"题目1","hint":"提示"},{"title":"题目2","hint":"提示"}],"wordLimit":"300-400字","rubric":"切题情感40% 结构30% 语言30%"}]}]}

## 规则
- choice answer=索引0-3; truefalse=true/false; fill必须有acceptableAnswers; shortanswer≤50字; writing要rubric
- 文言文必须是人教版真实课文选段；所有题都要analysis；难度符合中考标准`}'''

new_jc = '''function getJuniorChineseExamPrompt(examType) {
  const examLabel = JUNIOR_EXAM_TYPE_MAP[examType] || '期末综合'
  return '\\u4F60\\u662F\\u521D\\u4E2D\\u8BED\\u6587\\u6559\\u7814\\u5458\\uFF0C\\u4E13\\u653B\\u4E2D\\u8003\\u3002\\u51FA\\u521D\\u4E8C(\\u516B\\u5E74\\u7EA7)\\u4EBA\\u6559\\u7248' + examLabel + '\\u8BED\\u6587\\u8BD5\\u5377\\uFF0C\\u4E2D\\u8003\\u96BE\\u5EA6\\u3002\\u6EE1\\u5206100\\u5206\\uFF0C\\u4E25\\u683CJSON\\u3002\\n\\n## \\u89C4\\u5219\\n- choice answer=\\u7D22\\u5F150-3; truefalse=true/false; fill\\u5FC5\\u987B\\u6709acceptableAnswers; shortanswer<=50\\u5B57; writing\\u8981rubric\\n- \\u6587\\u8A00\\u6587\\u5FC5\\u987B\\u662F\\u4EBA\\u6559\\u7248\\u771F\\u5B9E\\u8BED\\u6587\\u9009\\u6BB5; \\u6240\\u6709\\u9898\\u90FD\\u8981analysis; \\u96BE\\u5EA6\\u7B26\\u5408\\u4E2D\\u8003\\u6807\\u51C6'
}'''

if old_jc in content:
    content = content.replace(old_jc, new_jc)
    print('Fixed: getJuniorChineseExamPrompt')
else:
    print('WARNING: getJuniorChineseExamPrompt pattern not found')

# 2. Fix scoring prompt - the two template strings inside map callback
old_scoring1 = "return `${i + 1}. \u3010\u4f5c\u6587/\u5b9e\u8df5\u9898\u3011\uff08${q.score}\u5206\uff09\\n\u9898\u76ee\uff1a${q.stem.slice(0, 120)}\\n${promptText ? '\u9009\u4f5c\u9898\u76ee\uff1a' + promptText + '\\n' : ''}\u5b66\u751f\u7b54\u6848\uff1a${(ua?.text || '\uff08\u672a\u4f5c\u7b54\uff09').slice(0, 300)}\\n\u8bc4\u5206\u6807\u51c6\uff1a${(q.rubric || '\u65e0').slice(0, 100)}`"
new_scoring1 = "return (i+1) + '. \u3010\u4f5c\u6587/\u5b9e\u8df5\u9898\u3011\uff08' + q.score + '\u5206\uff09\\n\u9898\u76ee\uff1a' + q.stem.slice(0,120) + '\\n' + (promptText ? '\u9009\u4f5c\u9898\u76ee\uff1a' + promptText + '\\n' : '') + '\u5b66\u751f\u7b54\u6848\uff1a' + ((ua && ua.text) || '\uff08\u672a\u4f5c\u7b54\uff09').slice(0,300) + '\\n\u8bc4\u5206\u6807\u51c6\uff1a' + (q.rubric || '\u65e0').slice(0,100)"

if old_scoring1 in content:
    content = content.replace(old_scoring1, new_scoring1)
    print('Fixed: scoring prompt line 1')
else:
    print('WARNING: scoring prompt line 1 not found')

old_scoring2 = "return `${i + 1}. \u3010\u7b80\u7b54\u9898\u3011\uff08${q.score}\u5206\uff09\\n\u9898\u76ee\uff1a${q.stem.slice(0, 150)}\\n\u5b66\u751f\u7b54\u6848\uff1a${(String(ua || '\uff08\u672a\u4f5c\u7b54\uff09')).slice(0, 300)}\\n\u53c2\u8003\u7b54\u6848\u8981\u70b9\uff1a${refAnswer}`"
new_scoring2 = "return (i+1) + '. \u3010\u7b80\u7b54\u9898\u3011\uff08' + q.score + '\u5206\uff09\\n\u9898\u76ee\uff1a' + q.stem.slice(0,150) + '\\n\u5b66\u751f\u7b54\u6848\uff1a' + String(ua || '\uff08\u672a\u4f5c\u7b54\uff09').slice(0,300) + '\\n\u53c2\u8003\u7b54\u6848\u8981\u70b9\uff1a' + refAnswer"

if old_scoring2 in content:
    content = content.replace(old_scoring2, new_scoring2)
    print('Fixed: scoring prompt line 2')
else:
    print('WARNING: scoring prompt line 2 not found')

# 3. Fix the main return in getScoringPrompt  
old_scoring_return = '''  return `你是一位阅卷老师，请对以下学生的主观题进行评分。

## 评分要求
- 严格按照每道题满分给分（不得超过该题满分）
- ${writingRubric}
- 给分合理，不过于严格也不过于宽松
- 每道题给出简短点评（30字以内）

## 需要评分的题目
${items}

## 返回JSON格式（严格JSON，key为题目id）
{
  "scores": {
    "q1": { "earned": 8, "comment": "要点基本覆盖，但缺少具体论据" },
    "q2": { "earned": 5, "comment": "格式规范，内容充实" }
  }
}`'''

new_scoring_return = '''  return '\\u4F60\\u662F\\u4E00\\u4F4D\\u9605\\u5377\\u8001\\u5E08\\uFF0C\\u8BF7\\u5BF9\\u4EE5\\u4E0B\\u5B66\\u751F\\u7684\\u4E3B\\u89C2\\u9898\\u8FDB\\u884C\\u8BC4\\u5206\\u3002\\n\\n## \\u8BC4\\u5206\\u8981\\u6C42\\n- \\u4E25\\u683C\\u6309\\u7167\\u6BCF\\u9053\\u9898\\u6EE1\\u5206\\u7ED9\\u5206\\n- ' + writingRubric + '\\n- \\u7ED9\\u5206\\u5408\\u7406\\n- \\u6BCF\\u9053\\u9898\\u7ED9\\u51FA\\u7B80\\u77ED\\u70B9\\u8BC4\\n\\n## \\u9700\\u8981\\u8BC4\\u5206\\u7684\\u9898\\u76EE\\n' + items + '\\n\\n## \\u8FD4\\u56DEJSON\\u683C\\u5F0F'
'''

if old_scoring_return in content:
    content = content.replace(old_scoring_return, new_scoring_return)
    print('Fixed: scoring return statement')
else:
    print('WARNING: scoring return pattern not found')

with open('src/pages/SelfTestPage.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('All fixes applied!')
