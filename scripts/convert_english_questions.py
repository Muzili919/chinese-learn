#!/usr/bin/env python3
"""
英语题库转换脚本
将 /Users/xiaolongmu/Documents/英语题库/*.json 的 markdown+JSON 混合格式
转换为 App 标准 JSON 格式，输出到 src/data/
"""
import re
import json
import os
import sys

SRC_DIR = "/Users/xiaolongmu/Documents/英语题库"
DST_DIR = "/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data"

# 文件映射配置
FILE_CONFIG = [
    {
        "src": "词汇星球.json",
        "dst": "questions_en_vocab.json",
        "id_prefix": "en_vocab",
        "knowledge_tag": "英语词汇",
    },
    {
        "src": "听力星球.json",
        "dst": "questions_en_listen.json",
        "id_prefix": "en_listen",
        "knowledge_tag": "英语听力",
    },
    {
        "src": "语法星球.json",
        "dst": "questions_en_grammar.json",
        "id_prefix": "en_grammar",
        "knowledge_tag": "英语语法",
    },
    {
        "src": "阅读星球.json",
        "dst": "questions_en_reading.json",
        "id_prefix": "en_reading",
        "knowledge_tag": "英语阅读",
    },
    {
        "src": "写作星球.json",
        "dst": "questions_en_writing.json",
        "id_prefix": "en_writing",
        "knowledge_tag": "英语写作",
    },
]

# 题型名称 -> type 映射
TYPE_MAP = {
    "辨音题": "multiple_choice",
    "英汉互译": "fill_blank",
    "单词拼写": "fill_blank",
    "补全单词": "fill_blank",
    "选词填空": "fill_blank",
    "词组搭配": "fill_blank",
    "连线题": "fill_blank",
    "判断题": "multiple_choice",
    "听音排序": "fill_blank",
    "写作": "open_ended",
    "作文": "open_ended",
    "情景对话填空": "fill_blank",
    "阅读理解": "multiple_choice",
    "单项选择": "multiple_choice",
    "选择题": "multiple_choice",
    "听音选图": "multiple_choice",
    "听音选词": "multiple_choice",
    "听对话判断": "multiple_choice",
    "听音排序": "fill_blank",
    "用所给词适当形式填空": "fill_blank",
    "情景交际": "multiple_choice",
    "连词成句": "fill_blank",
    "按要求改写句子": "fill_blank",
    "阅读短文": "multiple_choice",
    "补全对话": "fill_blank",
    "完型填空": "multiple_choice",
}

# 题型名称 -> ability_tag 映射
ABILITY_MAP = {
    "辨音题": "语音辨析",
    "英汉互译": "词汇翻译",
    "单词拼写": "单词拼写",
    "补全单词": "单词拼写",
    "选词填空": "词汇运用",
    "词组搭配": "词组搭配",
    "连线题": "词组搭配",
    "判断题": "判断理解",
    "听音排序": "听力排序",
    "写作": "写作表达",
    "作文": "写作表达",
    "情景对话填空": "情景对话",
    "阅读理解": "阅读理解",
    "单项选择": "语法选择",
    "选择题": "语法选择",
    "听音选图": "听力辨识",
    "听音选词": "听力辨识",
    "听对话判断": "听力判断",
    "听音排序": "听力排序",
    "用所给词适当形式填空": "词形变换",
    "情景交际": "情景交际",
    "连词成句": "句子重组",
    "按要求改写句子": "句式转换",
    "阅读短文": "阅读理解",
    "补全对话": "情景对话",
    "完型填空": "语篇理解",
}


def get_type_and_ability(question_type_name):
    """根据题型名称返回 (type, ability_tag)"""
    # 尝试精确匹配
    for key in TYPE_MAP:
        if key in question_type_name:
            q_type = TYPE_MAP[key]
            ability = ABILITY_MAP.get(key, question_type_name)
            return q_type, ability

    # 默认根据关键词判断
    name = question_type_name
    if "选择" in name or "辨音" in name or "判断" in name:
        return "multiple_choice", name
    elif "写作" in name or "作文" in name or "连词成句" in name:
        return "open_ended", name
    else:
        return "fill_blank", name


def parse_options(options_raw):
    """将 {"A":"..","B":"..","C":"..","D":".."} 转为 ["A. ..", "B. ..", ...]"""
    if not options_raw or not isinstance(options_raw, dict):
        return []
    result = []
    for key in sorted(options_raw.keys()):
        result.append(f"{key}. {options_raw[key]}")
    return result


def build_analysis(explanation):
    """将 explanation 对象拼成分析字符串"""
    if not explanation:
        return ""
    parts = []
    if explanation.get("考点"):
        parts.append(f"【考点】{explanation['考点']}")
    if explanation.get("解题思路"):
        parts.append(f"【解题思路】{explanation['解题思路']}")
    if explanation.get("总结"):
        parts.append(f"【总结】{explanation['总结']}")
    return "\n".join(parts)


def extract_listening_text(question_str):
    """
    从 question 字符串中提取听力文本
    返回 (clean_question, listening_text_or_None)
    """
    # 匹配 "听力文本：..." 部分（到字符串结尾或下一个换行段落）
    pattern = r'\n\n听力文本[：:]([\s\S]+?)$'
    m = re.search(pattern, question_str)
    if m:
        listening_text = m.group(1).strip()
        clean_question = question_str[:m.start()].strip()
        return clean_question, listening_text

    # 也尝试 "听力文本：" 后直接跟内容（不一定有双换行）
    pattern2 = r'\n听力文本[：:]([\s\S]+?)$'
    m2 = re.search(pattern2, question_str)
    if m2:
        listening_text = m2.group(1).strip()
        clean_question = question_str[:m2.start()].strip()
        return clean_question, listening_text

    return question_str, None


def parse_file(src_path, id_prefix, knowledge_tag):
    """解析一个混合格式文件，返回题目列表"""
    with open(src_path, 'r', encoding='utf-8') as f:
        content = f.read()

    questions = []
    # 匹配 "第N题（题型名）" + 后面的 json 代码块
    # 支持: ```json ... ``` 或者 json\n{...}

    # 先尝试找所有 "第N题（xxx）" 标记及其后面的 JSON
    # 格式1: 第N题（题型）\n```json\n{...}\n```
    # 格式2: ### 第N题（题型）\n\n```json\n{...}\n```
    # 格式3: 第N题（题型）\njson\n{...}\n

    # 统一找所有题目块
    # 分割成题目块
    # 匹配题目标题行
    title_pattern = re.compile(
        r'(?:###\s*)?第\s*(\d+)\s*题[（(]([^）)]+)[）)]',
        re.MULTILINE
    )

    titles = list(title_pattern.finditer(content))

    for i, title_match in enumerate(titles):
        q_num = int(title_match.group(1))
        q_type_name = title_match.group(2).strip()

        # 提取这道题的内容（到下一道题或结尾）
        start = title_match.end()
        end = titles[i + 1].start() if i + 1 < len(titles) else len(content)
        block = content[start:end]

        # 从 block 中提取 JSON
        json_data = None

        # 尝试 ```json ... ``` 格式
        json_block_match = re.search(r'```json\s*([\s\S]+?)\s*```', block)
        if json_block_match:
            json_str = json_block_match.group(1).strip()
            try:
                json_data = json.loads(json_str)
            except json.JSONDecodeError as e:
                print(f"[WARN] 第{q_num}题 JSON解析失败（```json格式）: {e}")
                continue
        else:
            # 尝试裸 json\n{...} 格式（不带反引号）
            bare_json_match = re.search(r'json\s*(\{[\s\S]+?\})\s*$', block, re.MULTILINE)
            if bare_json_match:
                json_str = bare_json_match.group(1).strip()
                try:
                    json_data = json.loads(json_str)
                except json.JSONDecodeError as e:
                    # 尝试找最后一个完整的 { } 块
                    brace_match = re.search(r'(\{[\s\S]+\})', block)
                    if brace_match:
                        try:
                            json_data = json.loads(brace_match.group(1))
                        except:
                            print(f"[WARN] 第{q_num}题 JSON解析失败（裸json格式）: {e}")
                            continue
                    else:
                        print(f"[WARN] 第{q_num}题 未找到JSON内容")
                        continue
            else:
                # 尝试直接找 { } 块
                brace_match = re.search(r'(\{[\s\S]+\})', block)
                if brace_match:
                    try:
                        json_data = json.loads(brace_match.group(1))
                    except json.JSONDecodeError as e:
                        print(f"[WARN] 第{q_num}题 JSON解析失败（直接brace）: {e}")
                        continue
                else:
                    print(f"[WARN] 第{q_num}题 未找到JSON内容，跳过")
                    continue

        if not json_data:
            continue

        # 处理字段
        raw_question = json_data.get("question", "")
        raw_options = json_data.get("options", {})
        raw_answer = json_data.get("answer", "")
        raw_explanation = json_data.get("explanation", {})

        # 提取听力文本（听力题专用）
        listening_text = None
        if knowledge_tag == "英语听力":
            raw_question, listening_text = extract_listening_text(raw_question)

        # 转换 options
        options_list = parse_options(raw_options)

        # 获取 type 和 ability_tag
        q_type, ability_tag = get_type_and_ability(q_type_name)

        # 写作/开放题特殊处理
        if "写作" in q_type_name or "作文" in q_type_name or "连词成句" in q_type_name or "按要求改写" in q_type_name:
            q_type = "open_ended"
            if "连词成句" in q_type_name:
                ability_tag = "句子重组"
            elif "按要求改写" in q_type_name:
                ability_tag = "句式转换"
            elif "写作" in q_type_name or "作文" in q_type_name:
                ability_tag = "写作表达"

        # 判断题特殊处理：T/F 选项
        if "判断" in q_type_name and not options_list:
            options_list = ["A. T（正确）", "B. F（错误）"]

        # 构建 analysis
        analysis = build_analysis(raw_explanation)

        # 构建题目 ID
        q_id = f"{id_prefix}_{q_num:03d}"

        item = {
            "id": q_id,
            "subject": "english",
            "knowledge_tag": knowledge_tag,
            "ability_tag": ability_tag,
            "type": q_type,
            "question": raw_question,
            "options": options_list,
            "answer": str(raw_answer),
            "analysis": analysis,
            "difficulty": 0.5,
        }

        if listening_text:
            item["listening_text"] = listening_text

        questions.append(item)

    return questions


def main():
    os.makedirs(DST_DIR, exist_ok=True)

    for cfg in FILE_CONFIG:
        src_path = os.path.join(SRC_DIR, cfg["src"])
        dst_path = os.path.join(DST_DIR, cfg["dst"])

        if not os.path.exists(src_path):
            print(f"[ERROR] 源文件不存在: {src_path}")
            continue

        print(f"\n处理: {cfg['src']} ...")
        questions = parse_file(src_path, cfg["id_prefix"], cfg["knowledge_tag"])

        with open(dst_path, 'w', encoding='utf-8') as f:
            json.dump(questions, f, ensure_ascii=False, indent=2)

        print(f"  -> 输出 {len(questions)} 道题到 {cfg['dst']}")

    print("\n全部转换完成！")


if __name__ == "__main__":
    main()
