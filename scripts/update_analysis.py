#!/usr/bin/env python3
"""
批量更新题目解析脚本
将现有解析格式化为初中教学标准格式
"""

import json
import os
import re
from pathlib import Path

# 解析格式化函数
def format_pronunciation_analysis(question, original_analysis):
    """格式化字音字形题解析"""
    options = question.get('options', [])
    answer = question.get('answer', '')
    
    analysis_steps = []
    for i, opt in enumerate(options):
        letter = chr(65 + i)
        is_correct = opt == answer
        if is_correct:
            analysis_steps.append(f"{letter}项'{opt}'读音正确")
        else:
            # 这里可以添加更详细的错误分析
            analysis_steps.append(f"{letter}项读音有误")
    
    return f"""【考点定位】本题考查多音字/易错字的正确读音辨析。
【解题思路】{'; '.join(analysis_steps)}
【易错警示】注意区分多音字在不同词语中的读音规律，避免凭感觉读音。
【知识拓展】初中阶段需掌握《普通话异读词审音表》中的常见多音字读音。"""

def format_idiom_analysis(question, original_analysis):
    """格式化成语理解题解析"""
    q_text = question.get('question', '')
    answer = question.get('answer', '')
    
    # 提取成语
    idiom_match = re.search(r'「(.+?)」', q_text)
    idiom = idiom_match.group(1) if idiom_match else ''
    
    # 成语出处映射
    idiom_origins = {
        '胸有成竹': '出自宋代苏轼《文与可画筼筜谷偃竹记》',
        '守株待兔': '出自《韩非子·五蠹》',
        '亡羊补牢': '出自《战国策·楚策四》',
        '画蛇添足': '出自《战国策·齐策二》',
        '掩耳盗铃': '出自《吕氏春秋·自知》',
        '刻舟求剑': '出自《吕氏春秋·察今》',
        '狐假虎威': '出自《战国策·楚策一》',
        '井底之蛙': '出自《庄子·秋水》'
    }
    
    # 成语近义词
    idiom_synonyms = {
        '胸有成竹': '心中有数、稳操胜券、十拿九稳',
        '守株待兔': '刻舟求剑、缘木求鱼、坐享其成',
        '亡羊补牢': '见兔顾犬、江心补漏',
        '画蛇添足': '多此一举、弄巧成拙',
        '掩耳盗铃': '自欺欺人'
    }
    
    # 成语反义词
    idiom_antonyms = {
        '胸有成竹': '心中无数、不知所措、毫无准备',
        '守株待兔': '随机应变、见机行事、主动进取',
        '亡羊补牢': '防患未然、未雨绸缪',
        '画蛇添足': '恰到好处、画龙点睛',
        '掩耳盗铃': '实事求是'
    }
    
    origin = idiom_origins.get(idiom, '出自古代典故，具体出处需查阅相关资料。')
    synonyms = idiom_synonyms.get(idiom, '相关近义成语')
    antonyms = idiom_antonyms.get(idiom, '相关反义成语')
    
    return f"""【成语解释】{answer}
【出处典故】{origin}
【用法示例】①使用"{idiom}"的典型句子一。②使用"{idiom}"的典型句子二。
【近义成语】{synonyms}
【反义成语】{antonyms}
【易混成语】注意区分"{idiom}"与相似成语的细微差别。"""

def format_rhetoric_analysis(question, original_analysis):
    """格式化修辞手法题解析"""
    answer = question.get('answer', '')
    
    rhetoric_effects = {
        '比喻': '使表达更加生动形象，增强语言感染力。',
        '拟人': '使事物具有人的情感，增强亲切感和表现力。',
        '夸张': '突出事物特征，增强表达效果，引起读者注意。',
        '排比': '增强语言气势，使表达更有节奏感和说服力。',
        '对偶': '使句式整齐，音韵和谐，增强表现力。',
        '反复': '强调某种情感或内容，增强感染力。'
    }
    
    effect = rhetoric_effects.get(answer, '增强表达效果，使语言更加生动有力。')
    
    return f"""【修辞判断】本题考查{answer}修辞手法的识别。
【手法分析】分析{answer}手法的具体运用方式和表达效果。
【表达效果】{effect}
【对比分析】对比其他选项，说明为什么不是其他修辞手法。
【知识要点】初中阶段需掌握比喻、拟人、夸张、排比、对偶、反复等常见修辞手法。"""

def format_poetry_analysis(question, original_analysis):
    """格式化古诗词题解析"""
    q_text = question.get('question', '')
    
    # 识别诗歌
    if '床前明月光' in q_text:
        poem_info = '李白《静夜思》'
        theme = '诗人对故乡的深切思念'
    elif '春眠不觉晓' in q_text:
        poem_info = '孟浩然《春晓》'
        theme = '诗人对春天的热爱和珍惜'
    elif '白日依山尽' in q_text:
        poem_info = '王之涣《登鹳雀楼》'
        theme = '诗人登高望远的豪迈情怀'
    else:
        poem_info = '相关诗歌'
        theme = '诗歌的主题情感'
    
    return f"""【考点定位】本题考查古诗词默写与理解。
【诗句赏析】这是{poem_info}中的名句，赏析诗句的意境和表达技巧。
【情感把握】{theme}
【手法鉴赏】分析诗歌运用的艺术手法，如借景抒情、托物言志等。
【知识拓展】掌握课内必背古诗词，理解诗歌的意境和情感。"""

def format_reading_analysis(question, original_analysis):
    """格式化阅读理解题解析"""
    q_text = question.get('question', '')
    
    method = '仔细阅读原文，准确提取信息。'
    if '中心思想' in q_text:
        method = '找首尾段落，抓关键词，概括主要内容。'
    elif '词语含义' in q_text or '词语意思' in q_text:
        method = '结合上下文，理解词语在文中的特定含义。'
    elif '作用' in q_text:
        method = '从内容、结构、情感三个方面分析作用。'
    elif '为什么' in q_text:
        method = '分析原因，结合原文内容进行解释。'
    
    return f"""【解题方法】{method}
【信息定位】在原文相关段落中找到对应信息。
【答案验证】检查答案是否与原文一致，表述是否准确完整。
【答题规范】阅读题答案要简洁准确，尽量使用原文词语。"""

def auto_format_analysis(question):
    """根据题目类型自动格式化解析"""
    knowledge_tag = question.get('knowledge_tag', '')
    ability_tag = question.get('ability_tag', '')
    original_analysis = question.get('analysis', '')
    
    # 如果已经有格式化标记，不再重复格式化
    if '【考点定位】' in original_analysis or '【解题思路】' in original_analysis:
        return original_analysis
    
    # 根据标签选择格式化函数
    if '字音' in ability_tag or '字形' in ability_tag or '多音字' in ability_tag:
        return format_pronunciation_analysis(question, original_analysis)
    
    elif knowledge_tag == '成语' or '成语' in ability_tag:
        return format_idiom_analysis(question, original_analysis)
    
    elif '修辞' in ability_tag:
        return format_rhetoric_analysis(question, original_analysis)
    
    elif knowledge_tag == '古诗词' or '诗句' in ability_tag:
        return format_poetry_analysis(question, original_analysis)
    
    elif '信息提取' in ability_tag or '阅读理解' in ability_tag:
        return format_reading_analysis(question, original_analysis)
    
    elif knowledge_tag == '句子' and '修辞' not in ability_tag:
        return f"""【考点定位】本题考查句子相关知识的理解。
【解题思路】{original_analysis}
【答题要点】注意句子结构，理解句意，准确作答。"""
    
    elif knowledge_tag == '文学常识':
        return f"""【考点定位】本题考查文学常识的掌握。
【解题思路】{original_analysis}
【知识拓展】积累文学常识，了解作家作品和文学流派。"""
    
    # 默认格式化
    return f"""【考点定位】本题考查{knowledge_tag}相关知识。
【解题思路】{original_analysis}
【答题要点】注意审题，准确作答，书写规范。"""

def process_file(file_path):
    """处理单个JSON文件"""
    print(f"处理文件: {file_path}")
    
    try:
        # 转换为字符串路径
        file_path_str = str(file_path)
        with open(file_path_str, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        if not isinstance(data, list):
            print(f"  警告: {file_path} 不是题目数组，跳过")
            return False
        
        updated_count = 0
        for i, question in enumerate(data):
            if 'analysis' in question:
                new_analysis = auto_format_analysis(question)
                if new_analysis != question['analysis']:
                    question['analysis'] = new_analysis
                    updated_count += 1
        
        if updated_count > 0:
            # 备份原文件
            backup_path = file_path_str + '.backup'
            if not os.path.exists(backup_path):
                import shutil
                shutil.copy2(file_path_str, backup_path)
            
            # 写入更新后的文件
            with open(file_path_str, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            print(f"  更新了 {updated_count}/{len(data)} 个题目的解析")
            return True
        else:
            print(f"  无需更新，所有解析已符合格式")
            return False
            
    except Exception as e:
        print(f"  处理失败: {e}")
        return False

def main():
    """主函数"""
    data_dir = Path(__file__).parent.parent / 'src' / 'data'
    
    if not data_dir.exists():
        print(f"数据目录不存在: {data_dir}")
        return
    
    # 要处理的文件列表
    target_files = [
        'questions_vocab.json',
        'questions_idiom.json',
        'questions_sentence.json',
        'questions_poetry.json',
        'questions_literature.json',
        'reading_passages.json'
    ]
    
    print("开始批量更新题目解析...")
    print("=" * 50)
    
    updated_files = []
    for filename in target_files:
        file_path = data_dir / filename
        if file_path.exists():
            if process_file(file_path):
                updated_files.append(filename)
        else:
            print(f"文件不存在: {file_path}")
    
    print("=" * 50)
    print(f"处理完成！更新了 {len(updated_files)} 个文件:")
    for f in updated_files:
        print(f"  ✓ {f}")
    
    if updated_files:
        print("\n注意：原文件已备份为 .backup 文件")
        print("建议：运行前请确保已备份重要数据")

if __name__ == '__main__':
    main()