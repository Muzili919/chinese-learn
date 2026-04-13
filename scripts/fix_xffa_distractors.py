"""
Rewrite distractors for 宪法与法律 questions to fix "choose the longest" bias.
Strategy: For each question where correct answer is longest, rewrite distractors
to match length with plausible but incorrect knowledge statements.
"""
import json
import re

def strip_prefix(opt):
    """Remove A. B. C. D. prefix, return pure text."""
    text = str(opt).strip()
    # Remove leading letter + delimiter
    text = re.sub(r'^[A-D][.．、]\s*', '', text)
    return text.strip()

def text_len(opt):
    return len(strip_prefix(opt))

def add_prefix(letter, text):
    return f"{letter}.{text}"

# Manual rewrites: {question_id: {option_letter: new_text}}
# Only distractors (wrong answers) are rewritten. Correct answers are never changed.
REWRITES = {
    "politics_choice_002": {
        "C": "各类法律效力由宪法统摄，分别调整不同的社会领域",
        "D": "民法保护财产权利，但其效力低于宪法不具有最高性",
    },
    "politics_choice_003": {
        "D": "宪法修改需由全国人大常委会提议并经全国人大表决通过",
    },
    "politics_choice_006": {
        "A": "关系密切的朋友之间也不得擅自翻看对方的私人日记",
        "B": "日记本没有上锁不代表所有人都有权随意翻阅内容",
        "C": "未成年人依法享有隐私权，不受年龄条件的限制",
    },
    "politics_choice_007": {
        "A": "即便学生本人同意，学校也不能免除义务教育的法定责任",
        "B": "家长无权代替学生做出终止义务教育阶段的决定",
        "D": "学习成绩不影响学生接受义务教育的法定权利和资格",
    },
    "politics_choice_008": {
        "B": "平等是指每个公民都平等享有法定权利并承担法定义务",
        "C": "法律面前人人平等原则适用于中国境内的一切公民",
        "D": "任何公民不论成绩好坏都不得享有超越法律的特权",
    },
    "politics_choice_009": {
        "A": "特价商品同样受消费者权益保护法的规范与约束",
        "B": "网购商品依法享有退货权利，商家不得擅自排除",
        "D": "下单时的格式条款若排除消费者权利则属于无效条款",
    },
    "politics_choice_012": {
        "C": "公民可以通过请求返还或调解等合法方式追回借出的财物",
    },
    "politics_choice_016": {
        "C": "父母不得以监护权为由随意查看子女的通信秘密内容",
        "D": "未成年人的通信自由和通信秘密同样受法律保护",
    },
    "politics_choice_017": {
        "A": "未成年人打工会影响身心发展，法律对此设有严格限制",
        "D": "只要不是重体力劳动，未成年人也应当依法获得劳动保护",
    },
    "politics_choice_018": {
        "B": "行使监督权是公民的合法权利，举报违法行为值得鼓励",
        "C": "监督权适用于一切国家机关，不限于政府行政部门",
        "D": "依法行使监督权是每个公民的权利，不限于成年人",
    },
    "politics_choice_019": {
        "A": "即使住宅内无人，未经许可也不得擅自进入查看他人住所",
        "D": "住宅权保护一切公民的合法居住空间，不以有无房产为条件",
    },
    "politics_choice_020": {
        "D": "公开发布到网络的作品依然受到著作权的法律保护",
    },
    "politics_choice_021": {
        "A": "法律对全体社会成员具有普遍约束力，不限于成年人",
        "D": "法律和道德既有联系也有区别，两者不能相互替代",
    },
    "politics_choice_022": {
        "B": "违法行为不必然构成犯罪，多数违法行为承担民事或行政责任",
        "C": "构成犯罪需要具备严重社会危害性、刑事违法性等要件",
        "D": "行政拘留是对违法行为的处罚，刑事拘留是刑事侦查措施",
    },
    "politics_choice_024": {
        "B": "行政机关的具体行政行为若违法，公民有权依法提起诉讼维权",
        "C": "行政诉讼的原告可以是公民，也可以是企业等法人组织",
        "D": "公民和企业对行政机关的违法行为都有权提起行政诉讼",
    },
    "politics_choice_026": {
        "A": "依法解决纠纷是公民维护自身合法权益的正确方式",
        "C": "依法治国要求一切组织和公民都在法律框架内行事",
        "D": "依法治国与每个公民的日常生活密切相关，不是仅限政府",
    },
    "politics_choice_027": {
        "A": "赔偿民事损失后若构成犯罪，仍需依法追究刑事责任",
        "B": "未成年人之间的权益争议同样可以通过法律途径解决",
        "D": "权利受到侵害时应主动运用法律武器维护自身合法权益",
    },
    "politics_choice_031": {
        "B": "宪法最核心的价值是通过限制公权力来保障公民基本权利",
        "C": "宪法最核心的价值是在规范国家权力运行中保障公民权利",
        "D": "宪法最核心的价值是规范国家权力运行以实现公民权利保障",
    },
    "politics_choice_033": {
        "A": "自治区、自治州、自治县都依法享有相应的民族区域自治权",
        "B": "民族区域自治是在国家统一前提下保障少数民族自治权利的制度",
        "C": "民族区域自治是各少数民族聚居地方自主管理本民族内部事务",
    },
    "politics_choice_034": {
        "B": "一国两制适用于香港、澳门和台湾，不仅限于香港地区",
        "C": "一国两制下特别行政区享有高度自治权但主权归属不变",
        "D": "一国两制是长期的基本国策，不是暂时的过渡性安排",
    },
    "politics_choice_035": {
        "A": "新法通常不适用于生效前发生的行为，但有利于公民的除外",
        "B": "新法一般不溯及既往，对生效前的行为适用行为发生时的法律",
        "D": "法律的溯及力由法律明确规定，不能由法院随意决定",
    },
    "politics_choice_036": {
        "A": "在我国，法院不能直接宣布法律违宪，违宪审查权属于全国人大",
        "B": "国务院有权监督行政法规的合宪性，但宪法监督权属于全国人大",
        "C": "我国的宪法监督制度早已建立，全国人大常委会行使监督权",
    },
    "politics_choice_037": {
        "A": "未成年人同样需要了解权利和义务的关系并自觉履行义务",
        "B": "权利和义务相互依存，没有无义务的权利也没有无权利的义务",
        "D": "权利和义务不可分割，公民在享有权利时必须同时履行义务",
    },
    "politics_choice_040": {
        "A": "宪法需要根据社会发展适时修改，但不能随意更改根本原则",
        "B": "宪法修改是为了使宪法更好地适应国家发展和社会进步的需要",
        "D": "宪法修改应审慎进行，频繁修改反而会影响宪法的稳定性和权威",
    },
    "politics_choice_041": {
        "D": "特别行政区依法保留原有法律体系，享有独立的司法权和终审权",
    },
    "politics_choice_043": {
        "B": "宪法的核心精神是通过规范国家权力运行来充分保障公民权利",
        "C": "宪法的核心精神是保障公民权利但必须通过限制国家权力来实现",
        "D": "宪法的核心精神是限制国家权力，其根本目的是保障公民基本权利",
    },
    "politics_choice_044": {
        "D": "法治与人治的根本区别在于法律是否具有至高无上的权威",
    },
    "politics_choice_045": {
        "B": "宪法修改是遵循法定程序对宪法内容进行完善的国家行为",
        "D": "宪法修改应当慎重，但合理的修改恰恰说明宪法具有适应性",
    },
    "politics_choice_046": {
        "A": "公民权利的行使有法定边界，依法合理的限制不构成侵权",
        "B": "公共利益和个人权利都应受到法律保护，不能随意牺牲任何一方",
        "C": "个人自由的行使不得损害公共利益，两者应依法保持平衡",
    },
    "politics_choice_047": {
        "A": "中国的宪法监督权由全国人大及其常委会统一行使",
        "B": "中国自现行宪法颁布以来就建立了宪法监督制度",
        "C": "中国的宪法监督由全国人大及其常委会行使，不同于美国的司法审查",
    },
    "politics_choice_048": {
        "A": "德治和法治各有侧重，二者在治理中相互补充缺一不可",
        "B": "法治和德治同等重要，国家治理需要法律规范和道德引领并重",
        "D": "法治与德治相互支撑，法律的有效实施离不开道德的社会基础",
    },
}

# Also clean up "从一定角度看" filler from distractors that don't need length adjustment
# but use obvious filler language
CLEAN_FILLER = {
    "politics_choice_001": {
        "A": "未成年人也应该学习宪法知识，宪法与公民的生活紧密相连",
    },
    "politics_choice_003": {
        "A": "宪法的修改程序比普通法律更加严格，不能随意修改",
    },
    "politics_choice_005": {
        "D": "未经法定程序授权，任何人不得搜查他人的私人物品和书包",
    },
    "politics_choice_010": {
        "A": "未经本人同意传播其照片，即使没有恶意也可能构成侵权行为",
        "B": "肖像权的保护不以是否营利为唯一标准，恶意传播也构成侵权",
        "C": "同学之间同样需要尊重对方的肖像权，不得擅自传播他人照片",
    },
    "politics_choice_012": {
        "A": "同学之间的借用关系不能免除归还义务，借东西不还属于侵占",
        "B": "无论物品价值大小，公民的合法财产权都受到法律的平等保护",
    },
    "politics_choice_013": {
        "A": "网络言论同样受法律约束，网上发布不当内容也需要承担责任",
        "C": "言论自由的行使有明确的法定边界，不得损害他人的合法权益",
        "D": "未成年人同样享有宪法赋予的言论自由权利，受法律保护",
    },
    "politics_choice_014": {
        "B": "选举权和被选举权在全国范围内有效，不分城市和农村",
        "D": "选举权是公民参与国家管理的基本途径，每个公民都应认真对待",
    },
    "politics_choice_015": {
        "A": "语言侮辱同样侵犯人格尊严权，不以是否造成身体伤害为条件",
        "B": "老师教育学生应当尊重其人格尊严，不得使用侮辱性的言辞",
        "C": "老师对学生的批评应当合理适度，超出教育范畴则可能构成侮辱",
    },
    "politics_choice_021": {
        "C": "道德具有自觉性而法律具有强制性，两者的约束机制不同",
    },
    "politics_choice_023": {
        "C": "正当防卫必须针对正在进行的不法侵害，不能仅凭主观感觉动手",
    },
    "politics_choice_028": {
        "A": "网络信息真伪难辨，应当通过正规渠道核实后再做判断",
        "B": "网络安全关系到每个人，中学生同样需要提高网络防范意识",
        "C": "陌生短信中的中奖信息多为诈骗，点击链接可能导致财产损失",
    },
    "politics_choice_029": {
        "B": "宪法宣誓不仅是庄严的仪式，更具有增强宪法意识的重要意义",
        "D": "国家工作人员就职时应当进行宪法宣誓，这是法定的重要程序",
    },
    "politics_choice_030": {
        "A": "人权是普遍的国际概念，我国法律充分尊重和保障人权",
        "B": "人权的保障水平体现在法律制度中，不取决于是否有单独立法",
        "C": "人权保障写入我国宪法，公民基本权利就是人权的重要体现",
    },
    "politics_choice_032": {
        "C": "非公有制经济是社会主义市场经济的重要组成部分，受宪法保护",
    },
    "politics_choice_039": {
        "D": "积极参与选举有助于维护自身权益，对社区治理产生实际影响",
    },
}

def main():
    with open('src/data/questions_politics_choice.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    modified_count = 0
    for q in data:
        if q.get('module') != '宪法与法律':
            continue
        
        qid = q['id']
        answer = q['answer'].strip().upper()
        correct_idx = ord(answer) - ord('A')
        options = q['options']
        
        # Apply REWRITES (length-targeted changes)
        if qid in REWRITES:
            for letter, new_text in REWRITES[qid].items():
                idx = ord(letter) - ord('A')
                if idx != correct_idx:
                    old_text = strip_prefix(options[idx])
                    if old_text != new_text:
                        options[idx] = add_prefix(letter, new_text)
                        modified_count += 1
        
        # Apply CLEAN_FILLER (remove obvious filler language)
        if qid in CLEAN_FILLER:
            for letter, new_text in CLEAN_FILLER[qid].items():
                idx = ord(letter) - ord('A')
                if idx != correct_idx:
                    old_text = strip_prefix(options[idx])
                    if old_text != new_text:
                        options[idx] = add_prefix(letter, new_text)
                        modified_count += 1
    
    with open('src/data/questions_politics_choice.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"Modified {modified_count} distractors across all 宪法与法律 questions")

if __name__ == '__main__':
    main()
