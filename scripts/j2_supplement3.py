#!/usr/bin/env python3
import json
with open('src/data/words_network_j2.json') as f:
    data = json.load(f)
extras = [
('basic','基本的；基础的','adjective_opinion',1,'high',['fundamental','elementary','simple'],['base'],'You need to learn basic grammar first.','bas(基础)+ic'),
('correct','正确的；恰当的；改正','adjective_opinion',1,'high',['right','accurate','proper'],['connect'],'Your answer is correct.','cor(正确)+rect'),
('direct','直接的；直率的','adjective_opinion',1,'high',['straightforward','immediate','frank'],['detect'],'He gave me a direct answer.','di(直)+rect'),
('exact','精确的；准确的','adjective_quantity',1,'high',['precise','accurate','correct'],['exam'],'What is the exact time?','ex(出)+act'),
('foreign','外国的；外交的','adjective_quantity',1,'medium',['alien','external','overseas'],['forest'],'English is a foreign language for us.','for(外面)+eign'),
('human','人类的；人性的','adjective_quantity',1,'high',['humane','mankind','people'],['humans'],'We should respect human rights.','human本身'),
('male','男性的；雄性的','adjective_describe',1,'medium',['masculine','manly'],['mail'],'Male students are in the majority.','male本身'),
('female','女性的；雌性的','adjective_describe',1,'medium',['feminine','womanly'],['fee'],'Female students are fewer here.','fem(女)+ale'),
('natural','自然的；天然的','adjective_describe',1,'high',['organic','innate','normal'],['nation'],'We should eat natural food.','natur(自然)+al'),
('official','官方的；正式的','noun_academic',1,'medium',['formal','authorized','public'],['office'],'This is an official announcement.','offic(职务)+ial'),
('safety','安全；安全性','noun_academic',1,'high',['security','protection','safe'],['safe'],'Safety comes first!','safe(安全)+ty'),
('society','社会；协会','noun_academic',1,'high',['community','association','group'],['social'],'We live in a modern society.','soci(同伴)+ety'),
('subject','科目；主题；主语','noun_academic',1,'high',['topic','course','theme'],['object'],'Math is my favorite subject.','sub(下面)+ject'),
('truth','真相；真理','noun_academic',1,'high',['fact','reality','honesty'],['true'],'Tell me the truth.','tru(e真实)+th'),
('wealth','财富；丰富','noun_academic',1,'high',['riches','fortune','money'],['health'],'Health is more than wealth.','weal(福利)+th'),
('wisdom','智慧；明智','noun_academic',1,'high',['intelligence','knowledge','insight'],['wise'],'Wisdom comes from experience.','wis(智慧)+dom'),
('value','价值；价值观','noun_academic',1,'high',['worth','importance','price'],['valuable'],'Time has great value.','valu(值)+e'),
('power','力量；权力','noun_academic',1,'high',['strength','energy','ability'],['powder'],'Knowledge is power.','power本身'),
('mind','头脑；心思','noun_academic',1,'high',['brain','thought','opinion'],['mine'],'Keep this in mind.','mind本身'),
]
added=dup=0
for e in extras:
    w=e[0].lower()
    if w not in data['words']:
        data['words'][w]={'word':w,'meaning':e[1],'category':e[2],'tier':e[3],
            'frequency':e[4],'associations':e[5],'confusables':e[6],
            'example':e[7],'memory_tip':e[8]}
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
