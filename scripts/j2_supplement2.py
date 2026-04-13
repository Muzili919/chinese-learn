#!/usr/bin/env python3
import json
with open('src/data/words_network_j2.json') as f:
    data = json.load(f)

extras = [
    ('wonderful', '精彩的；奇妙的', 'adjective_opinion', 1, 'high',
     ['amazing', 'fantastic', 'marvelous'], ['wonder'],
     'The concert was wonderful!', 'wonder(奇迹)+ful'),
    ('terrible', '可怕的；很糟的', 'adjective_opinion', 1, 'high',
     ['awful', 'horrible', 'dreadful'], [],
     'The food was terrible.', 'terr(恐惧)+ible'),
    ('pleasant', '令人愉快的；舒适的', 'adjective_opinion', 1, 'medium',
     ['enjoyable', 'nice', 'agreeable'], ['please'],
     'We had a pleasant walk.', 'pleas(取悦)+ant'),
    ('polite', '有礼貌的；客气的', 'adjective_opinion', 1, 'high',
     ['courteous', 'mannerly'], ['police'],
     'Be polite to your elders.', 'poli(磨光)+te'),
    ('patient', '耐心的；病人(名)', 'adjective_opinion', 1, 'high',
     ['tolerant', 'calm'], ['patent'],
     'Be patient, it takes time.', 'pati(忍受)+ent'),
    ('active', '积极的；活跃的', 'adjective_opinion', 1, 'high',
     ['energetic', 'lively', 'busy'], ['activity'],
     'He is active in sports.', 'act(行动)+ive'),
    ('simple', '简单的；朴素的', 'adjective_opinion', 1, 'high',
     ['easy', 'basic', 'uncomplicated'], ['sample'],
     'The answer is simple.', 'simp(单一)+le'),
    ('special', '特别的；特殊的', 'adjective_opinion', 1, 'high',
     ['particular', 'unique', 'extraordinary'], ['species'],
     'Today is a special day.', 'speci(种类)+al'),
    ('usual', '通常的；平常的', 'adjective_opinion', 1, 'high',
     ['common', 'normal', 'regular'], ['unusually'],
     'As usual, he was late.', 'us(用)+ual'),
    ('nervous', '紧张的；焦虑的', 'adjective_opinion', 1, 'medium',
     ['anxious', 'tense', 'worried'], ['nerve'],
     'I am nervous about the exam.', 'nerve(神经)+ous'),
    ('proud', '骄傲的；自豪的', 'adjective_opinion', 1, 'high',
     ['honored', 'pleased'], ['produce'],
     'She is proud of her son.', 'prou(d骄傲)'),
    ('strict', '严格的；严厉的', 'adjective_opinion', 1, 'medium',
     ['severe', 'harsh', 'demanding'], [],
     'Our teacher is very strict.', 'stric(拉紧)+t'),
    ('straight', '直的；直接的；坦率的', 'adjective_describe', 1, 'medium',
     ['direct', 'upright', 'linear'], [],
     'Go straight at the crossing.', 'straight本身'),
    ('smooth', '光滑的；平稳的', 'adjective_describe', 1, 'medium',
     ['even', 'flat', 'sleek'], [],
     'The road is smooth here.', 'smoo(滑)+th'),
    ('soft', '软的；温柔的', 'adjective_describe', 1, 'high',
     ['tender', 'gentle', 'not hard'], ['shift'],
     'This bed is soft and comfortable.', 'soft本身'),
    ('tall', '高的（身材）', 'adjective_describe', 1, 'high',
     ['high', 'long'], ['talk'],
     'He is very tall for his age.', 'tall本身'),
    ('thin', '薄的；瘦的', 'adjective_describe', 1, 'medium',
     ['slim', 'skinny'], ['thing'],
     'She is too thin.', 'thin本身'),
    ('thick', '厚的；浓密的', 'adjective_describe', 1, 'medium',
     ['fat', 'dense'], ['sick'],
     'The book is thick with 500 pages.', 'thick本身'),
    ('narrow', '窄的；狭窄的', 'adjective_describe', 1, 'medium',
     ['tight', 'slim'], ['arrow'],
     'The street is too narrow for cars.', 'narr(狭窄)+ow'),
    ('fresh', '新鲜的；清新的', 'adjective_describe', 1, 'high',
     ['new', 'recent'], ['flesh'],
     'These vegetables are fresh.', 'fre(自由)+sh'),
    ('dirty', '脏的；肮脏的', 'adjective_describe', 1, 'medium',
     ['unclean', 'filthy'], ['dirt'],
     'Your hands are dirty.', 'dirt(脏)+y'),
    ('dry', '干的；干旱的', 'adjective_describe', 1, 'medium',
     ['not wet'], [],
     'The weather is hot and dry.', 'dry本身'),
    ('wet', '湿的；下雨的', 'adjective_describe', 1, 'medium',
     ['damp', 'moist'], ['wait'],
     'Do not sit on the wet grass.', 'wet本身'),
    ('full', '满的；完全的；饱的', 'adjective_quantity', 1, 'high',
     ['filled', 'complete', 'not hungry'], ['pull'],
     'The bottle is full of water.', 'full本身'),
    ('single', '单一的；单身的', 'adjective_quantity', 1, 'medium',
     ['one only', 'individual', 'unmarried'], ['sing'],
     'A single ticket, please.', 'sing(单个)+le'),
    ('total', '总的；完全的', 'adjective_quantity', 1, 'medium',
     ['overall', 'complete', 'whole'], [],
     'What is the total cost?', 'tot(全部)+al'),
    ('standard', '标准的；规范的', 'noun_academic', 1, 'medium',
     ['norm', 'criterion', 'level'], [],
     'You must meet the standard.', 'stand(站立)+ard'),
    ('knowledge', '知识；学问；了解', 'noun_academic', 1, 'high',
     ['understanding', 'learning', 'information'], ['know'],
     'Knowledge is power.', 'know(知道)+ledge'),
]

added=0; dup=0
for e in extras:
    w=e[0].lower()
    if w not in data['words']:
        data['words'][w]={
            'word':w,'meaning':e[1],'category':e[2],'tier':e[3],
            'frequency':e[4],'associations':e[5],'confusables':e[6],
            'example':e[7],'memory_tip':e[8]
        }
        added+=1
    else: dup+=1

for w,obj in data['words'].items():
    ass=set(obj.get('associations',[]) or [])
    conf=set(obj.get('confusables',[]) or [])
    obj['associations']=[a for a in ass if a!=w]
    obj['confusables']=[c for c in conf if c!=w and c not in obj['associations']]

with open('src/data/words_network_j2.json','w',encoding='utf-8') as f:
    json.dump(data,f,ensure_ascii=False,indent=2)
print(f'新增:{added} 跳过重复:{dup} 总计:{len(data["words"])}')
