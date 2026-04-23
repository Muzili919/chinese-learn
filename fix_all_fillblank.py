#!/usr/bin/env python3
"""将所有剩余 fill_blank 题转为 single_choice 或删除"""

import json, re, random, os

random.seed(42)
DATA = 'src/data'

def load(name):
    with open(f'{DATA}/{name}', encoding='utf-8') as f:
        return json.load(f)

def save(name, data):
    with open(f'{DATA}/{name}', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f'  ✓ {name}: {len(data)}题')

def make_sc(id, question, correct, distractors, analysis, difficulty=2, knowledge_tag='', ability_tag=''):
    """生成一道 single_choice 题"""
    options = [correct] + distractors[:3]
    while len(options) < 4:
        options.append(f'干扰项{len(options)}')
    random.shuffle(options)
    idx = options.index(correct)
    labels = ['A', 'B', 'C', 'D']
    return {
        'id': id,
        'type': 'single_choice',
        'question': question,
        'options': [f'{labels[i]}. {options[i]}' for i in range(4)],
        'answer': f'{labels[idx]}. {correct}',
        'analysis': analysis,
        'difficulty': difficulty,
        'knowledge_tag': knowledge_tag,
        'ability_tag': ability_tag,
    }

# ═══════════════════════════════════════════════════════════════
# 1. POETRY: 12道诗句填空 → 选择题
# ═══════════════════════════════════════════════════════════════
print('\n=== POETRY ===')
poetry = load('questions_poetry.json')

# 经典诗句配对（上句→下句）
POEM_PAIRS = {
    '野火烧不尽': '春风吹又生',
    '谁言寸草心': '报得三春晖',
    '劝君更尽一杯酒': '西出阳关无故人',
    '海内存知己': '天涯若比邻',
    '两个黄鹂鸣翠柳': '一行白鹭上青天',
    '不知细叶谁裁出': '二月春风似剪刀',
    '接天莲叶无穷碧': '映日荷花别样红',
    '大漠沙如雪': '燕山月似钩',
    '飞流直下三千尺': '疑是银河落九天',
    '两岸猿声啼不住': '轻舟已过万重山',
    '举头望明月': '低头思故乡',
    '春眠不觉晓': '处处闻啼鸟',
    '欲穷千里目': '更上一层楼',
    '黄河远上白云间': '一片孤城万仞山',
    '独在异乡为异客': '每逢佳节倍思亲',
    '明月松间照': '清泉石上流',
    '劝君更尽一杯酒': '西出阳关无故人',
    '春风又绿江南岸': '明月何时照我还',
    '墙角数枝梅': '凌寒独自开',
    '停车坐爱枫林晚': '霜叶红于二月花',
    '千里莺啼绿映红': '水村山郭酒旗风',
    '不识庐山真面目': '只缘身在此山中',
    '竹外桃花三两枝': '春江水暖鸭先知',
    '死去元知万事空': '但悲不见九州同',
    '王师北定中原日': '家祭无忘告乃翁',
    '等闲识得东风面': '万紫千红总是春',
    '问渠那得清如许': '为有源头活水来',
    '小荷才露尖尖角': '早有蜻蜓立上上头',
    '日照香炉生紫烟': '遥看瀑布挂前川',
    '好雨知时节': '当春乃发生',
    '随风潜入夜': '润物细无声',
    '月落乌啼霜满天': '江枫渔火对愁眠',
    '暖风熏得游人醉': '直把杭州作汴州',
    '我劝天公重抖擞': '不拘一格降人材',
    '落红不是无情物': '化作春泥更护花',
    '莫愁前路无知己': '天下谁人不识君',
    '月落乌啼霜满天': '江枫渔火对愁眠',
}

# 所有经典诗句下句（做干扰项池）
ALL_POEM_LINES = list(set(POEM_PAIRS.values())) + [
    '疑是银河落九天', '处处闻啼鸟', '低头思故乡', '更上一层楼',
    '春风吹又生', '报得三春晖', '天涯若比邻', '西出阳关无故人',
    '一行白鹭上青天', '二月春风似剪刀', '映日荷花别样红',
    '燕山月似钩', '轻舟已过万重山', '一片孤城万仞山',
    '每逢佳节倍思亲', '清泉石上流', '明月何时照我还',
    '凌寒独自开', '霜叶红于二月花', '水村山郭酒旗风',
    '只缘身在此山中', '春江水暖鸭先知', '但悲不见九州同',
    '家祭无忘告乃翁', '万紫千红总是春', '为有源头活水来',
    '早有蜻蜓立上头', '遥看瀑布挂前川', '当春乃发生',
    '润物细无声', '江枫渔火对愁眠', '直把杭州作汴州',
    '不拘一格降人材', '化作春泥更护花', '天下谁人不识君',
]

# 处理 poetry_wb_* 和 poetry_104
new_poetry = []
sc_count = 0

for q in poetry:
    if q.get('type') != 'fill_blank':
        new_poetry.append(q)
        continue
    
    qid = q['id']
    answer_text = q['answer']
    
    # 解析答案中的诗句
    # 格式1: （1）诗句（2）诗句...
    sub_answers = re.findall(r'[（(]\d+[）)]\s*([^（(]+?)(?:\s*[；;]|\s*$)', answer_text)
    if not sub_answers:
        sub_answers = [answer_text]
    
    # 解析题面中的上句
    question_text = q['question']
    # 找到 "____，XXX" 或 "XXX，____" 或 "XXX，________" 模式
    blanks = re.findall(r'([^\n，。；（）]+?)[，,]\s*_{2,}', question_text)
    blanks2 = re.findall(r'_{2,}\s*[，,]\s*([^\n，。；（）]+)', question_text)
    
    # 提取完整的提示信息，用来生成选择题
    # 对于 poetry_wb_* (补充诗句)：从题面提取上句，答案是下句
    # 对于 poetry_104/107-* (根据提示写诗句)：需要根据提示找诗句
    
    is_wb = 'wb' in qid or '补充' in question_text
    
    if is_wb and sub_answers:
        # 补充诗句型：拆成多道选择题
        # 从题面提取上句
        lines = question_text.split('\n')
        pairs = []  # [(上句, 下句)]
        
        for line in lines:
            # 匹配 "XXX，________。" 或 "________，XXX。"
            m = re.match(r'[（(]\d+[）)]\s*(.+?)，_{2,}', line.strip())
            if m:
                pairs.append((m.group(1).strip(), None))
            m2 = re.match(r'[（(]\d+[）)]\s*_{2,}，(.+)', line.strip())
            if m2:
                pairs.append((None, m2.group(1).strip()))
            # "XXX，________。"
            m3 = re.match(r'[（(]\d+[）)]\s*(.+?)，_{2,}[。，]?', line.strip())
            if m3:
                pairs.append((m3.group(1).strip(), None))
        
        for i, ans in enumerate(sub_answers):
            ans = ans.strip().rstrip('；;')
            if not ans:
                continue
            
            # 从答案里提取诗句（可能带作者等附加信息）
            # 如 "野火烧不尽" 或 "野火烧不尽；白居易《赋得古原草送别》"
            poem_line = ans.split('；')[0].split(';')[0].strip()
            
            if i < len(pairs) and pairs[i][0]:
                upper = pairs[i][0]
                sc = make_sc(
                    f'poetry_sc_{sc_count + 1:03d}',
                    f'"{upper}，____"，横线处应填哪句？',
                    poem_line,
                    [l for l in ALL_POEM_LINES if l != poem_line],
                    f'完整诗句为："{upper}，{poem_line}"。',
                    q.get('difficulty', 1),
                    q.get('knowledge_tag', '古诗词赏析'),
                    q.get('ability_tag', '古诗默写'),
                )
                new_poetry.append(sc)
                sc_count += 1
            elif i < len(pairs) and pairs[i][1]:
                lower = pairs[i][1]
                sc = make_sc(
                    f'poetry_sc_{sc_count + 1:03d}',
                    f'"____，{lower}"，横线处应填哪句？',
                    poem_line,
                    [l for l in ALL_POEM_LINES if l != poem_line],
                    f'完整诗句为："{poem_line}，{lower}"。',
                    q.get('difficulty', 1),
                    q.get('knowledge_tag', '古诗词赏析'),
                    q.get('ability_tag', '古诗默写'),
                )
                new_poetry.append(sc)
                sc_count += 1
            else:
                # 没有提取到上句，用答案本身作为判断题
                sc = make_sc(
                    f'poetry_sc_{sc_count + 1:03d}',
                    f'以下哪句是正确的诗句？',
                    poem_line,
                    [l for l in ALL_POEM_LINES if l != poem_line],
                    f'正确诗句为："{poem_line}"。',
                    q.get('difficulty', 1),
                    q.get('knowledge_tag', '古诗词赏析'),
                    q.get('ability_tag', '古诗默写'),
                )
                new_poetry.append(sc)
                sc_count += 1
    else:
        # 根据提示写诗句型：同样拆成选择题
        for i, ans in enumerate(sub_answers):
            ans = ans.strip().rstrip('；;')
            if not ans:
                continue
            poem_line = ans.split('；')[0].split(';')[0].strip()
            sc = make_sc(
                f'poetry_sc_{sc_count + 1:03d}',
                f'以下哪句诗句是正确的？',
                poem_line,
                [l for l in ALL_POEM_LINES if l != poem_line],
                f'正确诗句为："{poem_line}"。',
                q.get('difficulty', 2),
                q.get('knowledge_tag', '古诗词赏析'),
                q.get('ability_tag', '古诗理解'),
            )
            new_poetry.append(sc)
            sc_count += 1

print(f'  poetry: removed {len([q for q in poetry if q.get("type")=="fill_blank"])} fill_blank, added {sc_count} single_choice')
save('questions_poetry.json', new_poetry)

# ═══════════════════════════════════════════════════════════════
# 2. READING: 3道 → 选择题
# ═══════════════════════════════════════════════════════════════
print('\n=== READING ===')
reading = load('questions_reading.json')
new_reading = []
rsc = 0

for q in reading:
    if q.get('type') != 'fill_blank':
        new_reading.append(q)
        continue
    
    qid = q['id']
    ans = q['answer']
    
    if '√' in ans and '×' in ans:
        # 判断题 → 每个子题变成 single_choice A.正确 B.错误
        lines = q['question'].split('\n')
        sub_questions = []
        for line in lines:
            m = re.match(r'[（(](\d+)[）)]\s*(.+)', line.strip())
            if m:
                sub_questions.append((m.group(1), m.group(2).strip()))
        
        sub_answers = re.findall(r'[（(](\d+)[）)]\s*(√|×)', ans)
        ans_map = dict(sub_answers)
        
        for num, text in sub_questions:
            correct = ans_map.get(num, '√')
            is_correct = correct == '√'
            sc = {
                'id': f'{qid}_sub{num}',
                'type': 'single_choice',
                'question': f'判断下列说法是否正确：\n{text}',
                'options': ['A. 正确', 'B. 错误'],
                'answer': 'A. 正确' if is_correct else 'B. 错误',
                'analysis': f'该说法{"正确" if is_correct else "错误"}。',
                'difficulty': q.get('difficulty', 2),
                'knowledge_tag': q.get('knowledge_tag', '现代文阅读'),
                'ability_tag': q.get('ability_tag', '阅读理解'),
            }
            new_reading.append(sc)
            rsc += 1
    elif '→' in ans:
        # 排序题 → 转为 "以下哪个排序正确"
        # 提取事件
        events = re.findall(r'[（(](\d+)[）)]\s*(.+?)(?:\n|$)', q['question'])
        correct_order = ans.strip()
        sc = {
            'id': f'{qid}_sort',
            'type': 'single_choice',
            'question': q['question'].split('\n')[0] + '\n请选择正确的事件顺序。',
            'options': [
                f'A. {correct_order}',
                f'B. ① → ② → ③ → ④',
                f'C. ③ → ① → ② → ④',
                f'D. ④ → ③ → ② → ①',
            ],
            'answer': f'A. {correct_order}',
            'analysis': f'正确顺序为{correct_order}。',
            'difficulty': q.get('difficulty', 2),
            'knowledge_tag': q.get('knowledge_tag', '现代文阅读'),
            'ability_tag': q.get('ability_tag', '阅读理解'),
        }
        new_reading.append(sc)
        rsc += 1
    else:
        new_reading.append(q)  # keep as-is

print(f'  reading: removed fill_blank, added {rsc} single_choice')
save('questions_reading.json', new_reading)

# ═══════════════════════════════════════════════════════════════
# 3. SENTENCE: 39道 → 选择题
# ═══════════════════════════════════════════════════════════════
print('\n=== SENTENCE ===')
sentence = load('questions_sentence.json')
new_sentence = []
ssc = 0

for q in sentence:
    if q.get('type') != 'fill_blank':
        new_sentence.append(q)
        continue
    
    ans = q['answer']
    qtext = q['question']
    
    # 判断题（√/×）
    if '√' in ans and '×' in ans:
        lines = qtext.split('\n')
        sub_qs = []
        for line in lines:
            m = re.match(r'[（(](\d+)[）)]\s*(.+)', line.strip())
            if m:
                sub_qs.append((m.group(1), m.group(2).strip()))
        
        sub_as = re.findall(r'[（(](\d+)[）)]\s*(√|×)', ans)
        amap = dict(sub_as)
        
        for num, text in sub_qs:
            correct = amap.get(num, '√')
            is_ok = correct == '√'
            sc = {
                'id': f'{q["id"]}_sub{num}',
                'type': 'single_choice',
                'question': f'判断下列说法是否正确：\n{text}',
                'options': ['A. 正确', 'B. 错误'],
                'answer': 'A. 正确' if is_ok else 'B. 错误',
                'analysis': f'该说法{"正确" if is_ok else "错误"}。',
                'difficulty': q.get('difficulty', 2),
                'knowledge_tag': q.get('knowledge_tag', '句子'),
                'ability_tag': q.get('ability_tag', '病句辨析'),
            }
            new_sentence.append(sc)
            ssc += 1
        continue
    
    # 句子改写型：提取原句和改写后的答案
    # 提取子题和子答案
    sub_answers = re.findall(r'[（(](\d+)[）)]\s*(.+?)(?=\n[（(]|\n*$)', ans, re.DOTALL)
    if not sub_answers:
        sub_answers = [(1, ans)]
    
    for num, correct_ans in sub_answers:
        correct_ans = correct_ans.strip().rstrip('。')
        if not correct_ans:
            continue
        
        # 生成干扰项（在正确答案基础上做微小改动）
        distractors = []
        # 策略1：加/删"不"字
        if '不' in correct_ans:
            d = correct_ans.replace('不', '', 1)
            distractors.append(d)
        elif '没' in correct_ans:
            d = correct_ans.replace('没', '不', 1)
            distractors.append(d)
        else:
            d = correct_ans[:2] + '不' + correct_ans[2:]
            if d != correct_ans:
                distractors.append(d)
        
        # 策略2：换一种改写方式
        if '把' in correct_ans:
            d = correct_ans.replace('把', '被', 1).replace('吹倒了', '倒了')
            if d != correct_ans and d not in distractors:
                distractors.append(d)
        elif '被' in correct_ans:
            d = correct_ans.replace('被', '把', 1)
            if d != correct_ans and d not in distractors:
                distractors.append(d)
        
        if '怎么' in correct_ans:
            d = correct_ans.replace('怎么', '').replace('呢', '。')
            if d != correct_ans and d not in distractors:
                distractors.append(d)
        
        if '难道' in correct_ans:
            d = correct_ans.replace('难道', '').replace('吗', '')
            if d != correct_ans and d not in distractors:
                distractors.append(d)
        
        # 补充通用干扰项
        generic_d = ['这个句子不需要改写', '原句已经是正确的', '无法改写']
        for gd in generic_d:
            if len(distractors) < 3 and gd not in distractors:
                distractors.append(gd)
        
        distractors = distractors[:3]
        
        # 生成题面（简化原题面）
        if '反问句' in qtext and '陈述句' in qtext:
            prompt = '下列哪个是正确的改写？'
        elif '把' in qtext and '字句' in qtext:
            prompt = '下列哪个"把"字句改写正确？'
        elif '被' in qtext and '字句' in qtext:
            prompt = '下列哪个"被"字句改写正确？'
        elif '反问句' in qtext:
            prompt = '下列哪个反问句改写正确？'
        elif '陈述句' in qtext:
            prompt = '下列哪个陈述句改写正确？'
        elif '扩写' in qtext:
            prompt = '下列哪个扩写正确？'
        elif '缩写' in qtext or '缩句' in qtext:
            prompt = '下列哪个缩句正确？'
        elif '修改' in qtext:
            prompt = '下列哪个修改正确？'
        else:
            prompt = '下列哪个改写正确？'
        
        sc = make_sc(
            f'{q["id"]}_sub{num}',
            prompt + '\n（原题：' + qtext.split('\n')[0][:40] + '...）',
            correct_ans,
            distractors,
            f'正确改写：{correct_ans}',
            q.get('difficulty', 2),
            q.get('knowledge_tag', '句子'),
            q.get('ability_tag', '句子排序'),
        )
        new_sentence.append(sc)
        ssc += 1

print(f'  sentence: removed fill_blank, added {ssc} single_choice')
save('questions_sentence.json', new_sentence)

# ═══════════════════════════════════════════════════════════════
# 4. EN_WRITING: 33道 → 删除（无法手机答题）
# ═══════════════════════════════════════════════════════════════
print('\n=== EN_WRITING ===')
enw = load('questions_en_writing.json')
fills_before = len([q for q in enw if q.get('type') == 'fill_blank'])
enw = [q for q in enw if q.get('type') != 'fill_blank']
print(f'  en_writing: removed {fills_before} fill_blank, kept {len(enw)} questions')
if len(enw) == 0:
    # 如果全删了，保留为空数组
    pass
save('questions_en_writing.json', enw)

# ═══════════════════════════════════════════════════════════════
# 验证
# ═══════════════════════════════════════════════════════════════
print('\n=== 验证 ===')
check_files = [
    'questions_poetry.json', 'questions_reading.json',
    'questions_sentence.json', 'questions_en_writing.json',
]
total_remaining = 0
for f in check_files:
    data = load(f)
    fills = [q for q in data if q.get('type') == 'fill_blank']
    total_remaining += len(fills)
    types = {}
    for q in data:
        t = q.get('type', '?')
        types[t] = types.get(t, 0) + 1
    print(f'  {f}: {types}')
    if fills:
        for q in fills:
            print(f'    ⚠️  still fill_blank: {q["id"]}')

print(f'\n总剩余 fill_blank: {total_remaining}')
