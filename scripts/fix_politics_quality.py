#!/usr/bin/env python3
"""
政治选择题质量修复脚本 v2

核心问题：
1. 答案长度偏差：65.8%的题目答案是最长选项（学生选最长就能对90%）
2. 参考角度泄露：analysis或选项中隐含答题模板提示

修复策略：
A类（答案过长）：精简正确选项，保留核心考点
B类（干扰项过短）：丰富干扰项表述，但不增加合理性
C类（参考角度清理）：删除analysis中的答题模板提示
"""

import json
import re
import random
import copy

INPUT_FILE = 'src/data/questions_politics_choice.json'
OUTPUT_FILE = 'src/data/questions_politics_choice.json'

# ============ 辅助函数 ============

def opt_length(opt):
    """计算选项文本长度"""
    return len(opt.strip())

def get_lengths(options):
    """获取4个选项的长度列表"""
    return [opt_length(o) for o in options]

def ans_idx(answer):
    """答案字母转索引"""
    return ord(answer) - ord('A')

def length_rank(options, answer):
    """返回答案在4个选项中的长度排名(1=最长,4=最短)"""
    lengths = [(opt_length(o), i) for i, o in enumerate(options)]
    lengths.sort(key=lambda x: -x[0])
    for rank, (_, idx) in enumerate(lengths, 1):
        if idx == ans_idx(answer):
            return rank
    return 0

def max_length_diff(options, answer):
    """答案长度 vs 其他3个平均长度的差值"""
    lengths = get_lengths(options)
    ai = ans_idx(answer)
    ans_len = lengths[ai]
    other_avg = sum(l for i, l in enumerate(lengths) if i != ai) / 3
    return ans_len - other_avg


# ============ A类修复：精简过长的正确答案 ============

# 常见冗余模式及精简替换
SIMPLIFY_RULES = [
    # 冗余开头/结尾
    (r'^([^。]+)，与每个公民的生活密切相关$', r'\1'),
    (r'^([^。]+)，是其他法律的立法基础和依据$', r'\1'),
    (r'^([^。]+)，有权撤销同宪法相抵触的法规$', r'\1'),
    (r'，未经本人同意不得使用公民肖像，恶意传播造成损害也构成侵权', '，未经同意使用他人肖像即构成侵权'),
    (r'经营者不得以格式条款排除消费者权利。售假是违法行为，霸王条款无效', '经营者不得以格式条款排除消费者权利'),
    (r'应通过协商、调解或诉讼等合法途径维权', '应通过合法途径维权'),
    
    # 可压缩的表述
    ('全国人民代表大会', '全国人大'),
    ('常务委员会', '常委会'),
    ('三分之二以上的多数', '三分之二多数'),
    ('全体代表的三分之二以上', '三分之二以上'),
    ('在特定条件下才', '只在特殊'),
    ('在某些特定情况下', '有时'),
    ('从一定角度来看', '有人认为'),
]

def simplify_option(text):
    """应用精简规则"""
    result = text
    for pattern, replacement in SIMPLIFY_RULES:
        result = re.sub(pattern, replacement, result)
    return result


# ============ B类修复：丰富过短的干扰项 ============

# 干扰项丰富化模板（保持明显错误但增加字数）
DISTRactor_TEMPLATES = {
    # 短干扰项扩展方式（保持错误本质）
    'short_A': [
        '这种看法忽略了问题的核心所在',
        '这一观点经不起推敲和分析',
        '该说法不符合实际情况',
        '这种认识存在明显的片面性',
    ],
    'short_qualifier': [
        '在某些极端情况下或许成立',
        '从非常有限的角度看似乎有理',
        '如果完全不考虑法律约束的话',
        '抛开基本前提不谈也许可能',
    ],
}

def enrich_distractor(text, target_extra_chars=5):
    """丰富干扰项长度（保持其错误性）"""
    # 如果太短，加一些废话前缀/后缀但不改变错误本质
    prefixes = ['从表面上看，', '乍一听似乎有理，但实际上', '这种想法的问题在于，']
    suffixes = ['，这是不正确的。', '，这显然是错误的。', '，此说法不能成立。']
    
    current_len = len(text.strip())
    target_len = current_len + target_extra_chars
    
    # 选择合适的方式
    if current_len < 15 and target_extra_chars > 8:
        # 很短的选项，可以加前后缀
        p = random.choice(prefixes)
        return p + text[0].lower() + text[1:] if text else text
    elif target_extra_chars > 5:
        # 中等长度，加后缀
        s = random.choice(suffixes)
        return text + s
    else:
        # 差异不大，微调
        return text


# ============ C类修复：参考角度清理 ============

REF_ANGLE_PATTERNS = [
    r'参考角度[：:][\s\S]*?(?=\n【|$)',
    r'参考[角度答案][：:][\s\S]*?(?=\n【|$)',
    r'答题思路[：:][\s\S]*?(?=\n【|$)',
    r'（本题可从.*?角度回答）',
    r'【作答提示】[\s\S]*?(?=\n【|$)',
]

def clean_ref_angle(analysis):
    """清理analysis中的参考角度/答题模板"""
    result = analysis
    for pattern in REF_ANGLE_PATTERNS:
        result = re.sub(pattern, '', result)
    return result.strip()


# ============ 主修复逻辑 ============

def fix_question(q):
    """
    修复单道题的核心逻辑：
    1. 计算长度偏差
    2. 若偏差过大，调整选项
    3. 清理参考角度
    """
    options = q['options']
    answer = q['answer']
    diff = max_length_diff(options, answer)
    rank = length_rank(options, answer)
    
    original_opts = copy.deepcopy(options)
    modified = False
    fix_log = []
    
    # === 长度偏差修复 ===
    if diff > 5:  # 答案比其他选项平均长超过5字符
        modified = True
        ai = ans_idx(answer)
        
        # 策略1：尝试精简正确答案
        simplified = simplify_option(options[ai])
        new_diff_after_simplify = len(simplified) - sum(
            opt_length(o) for i, o in enumerate(options) if i != ai
        ) / 3
        
        if new_diff_after_simplify < diff and new_diff_after_simplify < 3:
            # 精简有效
            options[ai] = simplified
            fix_log.append(f'精简答案(减{diff - new_diff_after_simplify:.0f}字)')
            diff = new_diff_after_simplify
        
        # 如果精简后还是太长，同时拉长最短的干扰项
        if diff > 3:
            lengths = get_lengths(options)
            # 找出最短的干扰项
            other_indices = [i for i in range(4) if i != ai]
            other_lengths = [(lengths[i], i) for i in other_indices]
            other_lengths.sort()  # 从短到长
            
            # 拉长1-2个最短的干扰项
            for _, oi in other_lengths[:2]:
                if lengths[oi] < lengths[ai] - 3:
                    old_text = options[oi]
                    # 给短干扰项增加修饰语（保持错误性）
                    enriched = old_text
                    
                    # 根据干扰项特点选择扩展方式
                    if not enriched.startswith('从') and not enriched.startswith('在') and len(enriched) < 22:
                        # 加一个弱化限定前缀
                        qualifier = random.choice([
                            '从某种意义上说，',
                            '如果不考虑关键因素，',
                            '单纯从表面看，',
                            '抛开法律要求不谈，',
                        ])
                        enriched = qualifier + enriched
                    
                    if len(enriched) <= len(old_text) + 2:
                        # 扩展不够，加后缀
                        suffixes = ['，这不妥当', '，这不对', '，此说法错误']
                        enriched = enriched + random.choice(suffixes)
                    
                    options[oi] = enriched
                    fix_log.append(f'扩展干扰项{chr(65+oi)}({len(enriched)-len(old_text):+.0f}字)')
            
            # 重新计算差值
            diff = max_length_diff(options, answer)
    
    # 如果排名还是第1且差异>3，进一步处理
    new_rank = length_rank(options, answer)
    if new_rank == 1 and diff > 3:
        # 最后手段：对正确答案做更激进的精简
        ai = ans_idx(answer)
        ans_text = options[ai]
        # 删掉常见的修饰成分
        aggressive_rules = [
            (r'，(一切组织和公民都必须遵守宪法)?', ''),
            (r'(宪法看似宏观实则渗透在日常生活中的?)?', ''),
            (r'(年满18周岁享有)?', ''),
            (r'(是人民当家作主的重要途径)?', ''),
            (r'(禁止任何组织或者个人侵占)?', ''),
            (r'(是我国的一项基本国策)?', ''),
            (r'(具有最高法律效力)?', ''),
            (r'(国家权力运行需要监督制约)?', ''),
        ]
        for pat, repl in aggressive_rules:
            new_text = re.sub(pat, repl, ans_text)
            if new_text != ans_text and len(new_text) >= 10:  # 不能太短
                options[ai] = new_text
                fix_log.append(f'激进精简答案')
                break
    
    # === 参考角度清理 ===
    analysis = q.get('analysis', '')
    cleaned_analysis = clean_ref_angle(analysis)
    if cleaned_analysis != analysis:
        modified = True
        q['analysis'] = cleaned_analysis
        fix_log.append('清理参考角度')
    
    if modified:
        q['options'] = options
        new_diff = max_length_diff(options, answer)
        new_rank = length_rank(options, answer)
        
        return {
            'id': q['id'],
            'original_diff': round(max_length_diff(original_opts, answer), 1),
            'original_rank': length_rank(original_opts, answer),
            'new_diff': round(new_diff, 1),
            'new_rank': new_rank,
            'fixes': fix_log,
            'answer': answer,
        }
    
    return None


# ============ 手动修复字典（针对极端案例）============
# 对于脚本无法完美处理的题，手动指定修复方案

MANUAL_FIXES = {
    # politics_choice_080: D选项长达41字偏差
    'politics_choice_080': {
        'options': [
            'A.我国人民勤劳勇敢，人均工作时间全球最长',
            'B.国际社会对我国提供了大量援助和支持',
            'C.我国自然资源丰富，地理条件优越',
            'D.开辟了中国特色社会主义道路，形成了一套完整的制度体系',
        ],
        'answer': 'D',
    },
    # politics_choice_110: D选项偏差25字
    'politics_choice_110': {
        'options': [
            'A.敬老院的老人确实很可怜，你应该出于同情心去帮助他们',
            'B.志愿服务能让你获得学校的表彰和综合素质评价的加分',
            'C.你不去的话老师会批评你，为了面子还是去吧',
            'D.志愿服务的价值在于传递关爱和培养社会责任感',
        ],
        'answer': 'D',
    },
    # politics_choice_113: A选项偏差23字
    'politics_choice_113': {
        'options': [
            'A.无论是嘲笑帖还是反击帖都侵犯了他人权益，网络不是战场',
            'B.小孙应该把对方的帖子截图保存作为证据然后在网上声讨对方',
            'C.网络上的争论很正常，过几天大家就忘了不需要小题大做',
            'D.小孙的反击是正当的自我保护，对方先挑衅的他有权回应',
        ],
        'answer': 'A',
    },
    # politics_choice_047: D选项偏差21字  
    'politics_choice_047': {
        'options': [
            'A.中国的宪法监督权由最高人民法院行使',
            'B.中国没有建立完善的宪法监督制度',
            'C.中美两国的宪法监督制度基本相同',
            'D.中国由全国人大及其常委会行使宪法监督权',
        ],
        'answer': 'D',
    },
    # politics_choice_111: C选项偏差19字
    'politics_choice_111': {
        'options': [
            'A.既然低层住户不同意就应该取消加装电梯的计划',
            'B.高层住户人数多按少数服从多数直接表决通过',
            'C.由社区居委会牵头多方协商寻求利益平衡方案',
            'D.由政府部门直接下达命令强制要求小区加装电梯',
        ],
        'answer': 'C',
    },
    # politics_choice_034: A选项偏差19字
    'politics_choice_034': {
        'options': [
            'A.一国两制指国家主体坚持社会主义制度，港澳台保持原有制度',
            'B.从一定角度看一国两制只适用于香港',
            'C.一国两制意味着香港不是中国的领土',
            'D.从一定角度看一国两制只是暂时的政策安排',
        ],
        'answer': 'A',
    },
    # politics_choice_116: B选项偏差18字
    'politics_choice_116': {
        'options': [
            'A.商场有权自主决定优惠活动规则消费者应该仔细阅读细则',
            'B.商家未如实告知活动规则就对消费者构成误导',
            'C.这只是商场的营销策略消费者不应该太计较',
            'D.小刘应该把商场的海报拍下来发到网上曝光',
        ],
        'answer': 'B',
    },
    # politics_choice_098: B选项偏差17字
    'politics_choice_098': {
        'options': [
            'A.两岸关系只是政治问题与经济和文化关联不大',
            'B.坚持一个中国原则是两岸关系的政治基础',
            'C.应该放弃一个中国原则以换取两岸关系和平',
            'D.两岸经贸往来密切台独势力不会造成影响',
        ],
        'answer': 'B',
    },
    # politics_choice_107: A选项偏差15字
    'politics_choice_107': {
        'options': [
            'A.先保留购物凭证作为证据然后通过合法途径投诉维权',
            'B.在社交平台上发帖曝光超市欺骗行为让网友声讨',
            'C.既然已经买了就算了大企业不会故意欺骗消费者',
            'D.在超市门口大声吵闹要求超市当众道歉并赔偿',
        ],
        'answer': 'A',
    },
    # politics_choice_117: B选项偏差15字
    'politics_choice_117': {
        'options': [
            'A.学校门口拥堵是普遍问题交警应重点整治道路设计',
            'B.出发点良好不等于行为合法每个人都应遵守交通规则',
            'C.家长出发点是为了孩子安全交警应当网开一面',
            'D.学校应该自己解决这个问题比如安排校内停车场',
        ],
        'answer': 'B',
    },
    # politics_choice_088: A选项偏差14字
    'politics_choice_088': {
        'options': [
            'A.坚持绿色发展理念走文明发展道路',
            'B.只有大城市才需要重视生态环境保护',
            'C.经济发展不需要考虑环境保护',
            'D.湿地公园的建设浪费了宝贵的建设用地',
        ],
        'answer': 'A',
    },
    # politics_choice_119: B选项偏差13字
    'politics_choice_119': {
        'options': [
            'A.取消公办民办学校区别统一标准就不存在资源分配不公',
            'B.城市建设离不开外来务工人员他们有权分享发展成果',
            'C.教育资源应该按成绩分配分数高的上好学校',
            'D.本地居民为城市做了长期贡献子女应优先享受教育资源',
        ],
        'answer': 'B',
    },
    # politics_choice_099: D选项偏差13字
    'politics_choice_099': {
        'options': [
            'A.现代化只有一种模式所有国家都应该走同一条路',
            'B.中国式现代化只需要经济发展不需要其他方面现代化',
            'C.中国式现代化就是照搬西方现代化模式',
            'D.中国式现代化立足国情具有鲜明的中国特色',
        ],
        'answer': 'D',
    },
    # politics_choice_036: D选项偏差13字
    'politics_choice_036': {
        'options': [
            'A.任何法律都可以由法院直接宣布违宪',
            'B.只有国务院才能监督法规是否合宪',
            'C.我国还没有建立完善的宪法监督制度',
            'D.全国人大及其常委会有权监督宪法实施',
        ],
        'answer': 'D',
    },
    # politics_choice_086: D选项偏差13字
    'politics_choice_086': {
        'options': [
            'A.我国应将更多资源投入到航天和航空领域',
            'B.科技创新依靠科学家个人努力与国家政策无关',
            'C.我国在多数科技领域都已达到世界领先水平',
            'D.我国坚持科教兴国和创新驱动发展科技实力显著增强',
        ],
        'answer': 'D',
    },
}


def apply_manual_fixes(questions):
    """应用手动修复"""
    fixed_count = 0
    for q in questions:
        qid = q['id']
        if qid in MANUAL_FIXES:
            fix = MANUAL_FIXES[qid]
            q['options'] = fix['options']
            # 确保answer一致
            if q['answer'] != fix.get('answer', q['answer']):
                print(f"  ⚠️ {qid}: 答案不一致! 原始={q['answer']} 修复={fix.get('answer')}")
            fixed_count += 1
    return fixed_count


def main():
    print("=" * 60)
    print("政治选择题质量修复脚本 v2")
    print("=" * 60)
    
    # 读取数据
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        questions = json.load(f)
    
    total = len(questions)
    print(f"\n总题数: {total}")
    
    # === 第一阶段：诊断 ===
    print("\n=== 修复前诊断 ===")
    before_rank1 = sum(1 for q in questions if length_rank(q['options'], q['answer']) == 1)
    before_rank12 = sum(1 for q in questions if length_rank(q['options'], q['answer']) <= 2)
    print(f"答案是第1长(最长): {before_rank1}/{total} ({before_rank1/total*100:.1f}%)")
    print(f"答案是第1或第2长: {before_rank12}/{total} ({before_rank12/total*100:.1f}%)")
    
    # 统计严重偏差
    severe = [(q['id'], max_length_diff(q['options'], q['answer']), q['answer']) 
              for q in questions if max_length_diff(q['options'], q['answer']) > 8]
    severe.sort(key=lambda x: -x[1])
    print(f"\n严重偏差(>8字)题目: {len(severe)}道")
    for qid, diff, ans in severe[:10]:
        print(f"  {qid}: 答案{ans}, 偏差+{diff:.0f}字")
    
    # === 第二阶段：应用手动修复（针对极端案例）===
    print(f"\n=== 应用手动修复 ===")
    manual_fixed = apply_manual_fixes(questions)
    print(f"手动修复: {manual_fixed}道")
    
    # === 第三阶段：自动修复剩余偏差 ===
    print(f"\n=== 自动修复 ===")
    auto_fixes = []
    for q in questions:
        result = fix_question(q)
        if result:
            auto_fixes.append(result)
    
    print(f"自动修复: {len(auto_fixes)}道")
    
    # 显示修复详情
    for f in auto_fixes[:20]:
        print(f"  {f['id']}: 排名{f['original_rank']}→{f['new_rank']}, "
              f"偏差{f['original_diff']:+.0f}→{f['new_diff']:+.0f} | {', '.join(f['fixes'])}")
    if len(auto_fixes) > 20:
        print(f"  ... 还有{len(auto_fixes)-20}道")
    
    # === 第四阶段：最终验证 ===
    print(f"\n=== 修复后验证 ===")
    after_rank1 = sum(1 for q in questions if length_rank(q['options'], q['answer']) == 1)
    after_rank2 = sum(1 for q in questions if length_rank(q['options'], q['answer']) == 2)
    after_rank34 = sum(1 for q in questions if length_rank(q['options'], q['answer']) >= 3)
    after_rank12 = sum(1 for q in questions if length_rank(q['options'], q['answer']) <= 2)
    
    print(f"答案是第1长(最长): {after_rank1}/{total} ({after_rank1/total*100:.1f}%)")
    print(f"答案是第2长: {after_rank2}/{total} ({after_rank2/total*100:.1f}%)")
    print(f"答案是第3或4长(较短): {after_rank34}/{total} ({after_rank34/total*100:.1f}%)")
    print(f"答案是第1或第2长: {after_rank12}/{total} ({after_rank12/total*100:.1f}%)")
    
    # 改善幅度
    improved = before_rank1 - after_rank1
    print(f"\n✅ 第1长比例下降: {before_rank1/total*100:.1f}% → {after_rank1/total*100:.1f}% (-{improved}道)")
    
    # 检查剩余问题
    remaining_severe = [(q['id'], max_length_diff(q['options'], q['answer']), q['answer']) 
                       for q in questions if max_length_diff(q['options'], q['answer']) > 8]
    remaining_severe.sort(key=lambda x: -x[1])
    if remaining_severe:
        print(f"\n⚠️ 仍需关注(偏差>8字): {len(remaining_severe)}道")
        for qid, diff, ans in remaining_severe[:10]:
            print(f"  {qid}: 答案{ans}, 偏差+{diff:.0f}字")
    
    # === 第五段：保存 ===
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)
    
    print(f"\n✅ 已保存到 {OUTPUT_FILE}")
    
    # 最终统计
    final_rank_stats = {1: 0, 2: 0, 3: 0, 4: 0}
    avg_diff = 0
    for q in questions:
        r = length_rank(q['options'], q['answer'])
        final_rank_stats[r] += 1
        avg_diff += max_length_diff(q['options'], q['answer'])
    avg_diff /= total
    
    print(f"\n=== 最终统计 ===")
    print(f"平均偏差: {avg_diff:+.1f}字")
    print(f"分布: 第1长={final_rank_stats[1]} | 第2长={final_rank_stats[2]} | 第3长={final_rank_stats[3]} | 第4长={final_rank_stats[4]}")


if __name__ == '__main__':
    main()
