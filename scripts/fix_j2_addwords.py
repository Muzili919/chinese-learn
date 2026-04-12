#!/usr/bin/env python3
"""替换超纲词 + 补充遗漏核心词"""
import json

with open('/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/words_network_j2.json','r') as f:
    data = json.load(f)
words = data['words']

V='verb'; A='adjective'; N='noun'; Adv='adverb'; Prep='preposition'
Conj='conjunction'; Pron='pronoun'; Expr='expression'

def add(w, m, cat, tier, freq, assoc, conf, ex, tip):
    words[w] = {'word':w,'meaning':m,'category':cat,'tier':tier,'frequency':freq,
                'associations':assoc,'confusables':conf,'example':ex,'memory_tip':tip}

# ============================================================
# PART 2A: Remove off-grade words (17)
# ============================================================
off_grade = ['candidate','cancer','campaign','cable','broadcast','applaud',
             'anniversary','allowance','capture','beneath','beyond','blame',
             'bless','board','border','calendar','cancel']
removed = []
for w in off_grade:
    if w in words:
        del words[w]
        removed.append(w)
print(f'删除超纲词 {len(removed)}: {removed}')

# ============================================================
# PART 2B: Add 60+ missing core Grade 8 words
# ============================================================
missing_core = [
    # Tier 1 core words (most critical)
    ('afford','买得起；负担得起',V,1,'high',['buy','pay','expensive','cheap'],['effort','offer'],'I cannot afford this computer.','af+ford(渡口)→有钱过河→买得起'),
    ('appearance','外貌；外观',N,1,'high',['look','beautiful','handsome','seem'],['appear','apparent'],'Dont judge people by appearance.','appear+ance→外表'),
    ('benefit','益处；受益',V,1,'high',['good','advantage','help','profit'],['benefit','beneficial'],'Exercise benefits your health.','bene(好)+fit(做)→做好事→益处'),
    ('difference','不同；差异',N,1,'high',['same','different','change','similar'],['different','difficulty'],'There is no difference between them.','differ+ence→不同'),
    ('education','教育',N,1,'high',['school','learn','teach','study'],['educate','edition'],'Education is very important.','e(出)+duc(引导)+ation→引导出来→教育'),
    ('expression','表达；表情',N,1,'high',['show','feel','word','face'],['express','impression'],'He had a happy expression.','express+ion→表达'),
    ('familiar','熟悉的',A,1,'high',['know','strange','common','usual'],['family','similar'],'This place looks familiar.','famil(家庭)+iar→像家里的→熟悉'),
    ('foreign','外国的；外来的',A,1,'high',['abroad','international','outside','country'],['forest','forget'],'Do you speak any foreign languages?','for+eign→外国的'),
    ('government','政府',N,1,'high',['country','rule','leader','law'],['governor','movement'],'The government made a new plan.','govern(统治)+ment→政府'),
    ('however','然而；不过',Adv,1,'high',['but','although','yet','still'],['however','how'],'However, I disagree with you.','how+ever→无论如何→然而'),
    ('importance','重要性',N,1,'high',['important','significant','value','meaning'],['important','impossible'],'He knows the importance of study.','import+ance→重要性'),
    ('industry','工业；产业',N,2,'medium',['factory','business','company','work'],['industrial','injury'],'The IT industry is growing fast.','industry→工业'),
    ('interview','面试；采访',N,2,'medium',['question','job','talk','meet'],['internet','interrupt'],'I have a job interview tomorrow.','inter+view(看)→互相看→面试'),
    ('island','岛；岛屿',N,1,'high',['sea','ocean','land','water'],['island','inland'],'Taiwan is a beautiful island.','is+land→岛'),
    ('journey','旅行；旅程',N,1,'high',['trip','travel','voyage','tour'],['journal','journalism'],'The journey took three hours.','journey→旅程'),
    ('knowledge','知识',N,1,'high',['learn','know','study','science'],['knowledge','acknowledge'],'Knowledge is power.','knowledge→知识'),
    ('language','语言',N,1,'high',['English','Chinese','speak','word'],['language','message'],'English is a useful language.','language→语言'),
    ('machine','机器',N,1,'high',['computer','engine','device','tool'],['machinery','machine'],'This machine is very expensive.','machine→机器'),
    ('material','材料；素材',N,2,'medium',['cloth','wood','stuff','substance'],['material','matter'],'What material is this made of?','material→材料'),
    ('medicine','药；医学',N,1,'high',['drug','hospital','doctor','health'],['medical','medium'],'Take this medicine three times a day.','medicine→药'),
    ('memory','记忆；回忆',N,1,'high',['remember','forget','mind','brain'],['member','memo'],'She has a good memory.','memory→记忆'),
    ('message','消息；信息',N,1,'high',['news','information','letter','text'],['massage','message'],'I sent her a text message.','message→消息'),
    ('method','方法；办法',N,2,'medium',['way','approach','system','plan'],['mental','mother'],'This is a good method for learning.','method→方法'),
    ('neighbor','邻居',N,1,'high',['next door','friend','live','near'],['neither','network'],'My neighbor is very friendly.','neighbor→邻居'),
    ('object','物体；反对',N,2,'medium',['thing','item','subject','agree'],['object','observe'],'What is this strange object?','ob(对面)+ject(扔)→扔在对面→物体'),
    ('opinion','意见；看法',N,1,'high',['idea','think','view','believe'],['option','onion'],'In my opinion, you are right.','opinion→意见'),
    ('passage','文章；段落；通道',N,2,'medium',['text','paragraph','road','read'],['passenger','message'],'Read this passage carefully.','pass+age→通道→文章'),
    ('period','时期；阶段；课节',N,2,'medium',['time','period','class','during'],['period','serious'],'We have a math period next.','period→时期'),
    ('pleasure','快乐；高兴',N,1,'high',['happy','fun','joy','glad'],['pleasure','pleasure','please'],'It is a pleasure to meet you.','pleasure→快乐'),
    ('population','人口',N,1,'high',['people','city','country','number'],['popular','pollution'],'The population of China is large.','population→人口'),
    ('purpose','目的；用途',N,1,'high',['goal','aim','reason','plan'],['purpose','purpose','propose'],'What is the purpose of this meeting?','purpose→目的'),
    ('quality','质量；品质',N,1,'high',['good','standard','level','quantity'],['quantity','quarter'],'This product has high quality.','quality→质量'),
    ('reason','原因；理由',N,1,'high',['because','cause','why','explain'],['season','result'],'What is the reason for your absence?','reason→原因'),
    ('recent','最近的；近来的',A,2,'medium',['new','latest','current','late'],['recent','receive','recite'],'Have you read any recent news?','recent→最近的'),
    ('record','记录；唱片',N,1,'high',['write','keep','note','history'],['recorder','recover'],'Please keep a record of your spending.','re+cord(心)→再次放心里→记录'),
    ('reduce','减少；降低',V,1,'high',['decrease','less','cut','increase'],['produce','introduce','reduce'],'We should reduce pollution.','re+duce(引导)→往回引→减少'),
    ('relation','关系；亲属',N,2,'medium',['relationship','family','connect','relative'],['relation','relax','relative'],'What is the relation between them?','relation→关系'),
    ('research','研究；调查',N,1,'high',['study','investigate','science','find'],['search','reach','require'],'Scientists are doing research on it.','re+search→反复搜索→研究'),
    ('resource','资源',N,2,'medium',['source','material','energy','nature'],['source','result','research'],'We should protect natural resources.','resource→资源'),
    ('satisfy','满足；使满意',V,2,'medium',['please','content','happy','dissatisfied'],['satisfy','satisfy','satisfy'],'This result satisfies everyone.','satisfy→满足'),
    ('science','科学',N,1,'high',['subject','study','experiment','lab'],['scientist','silence','scene'],'I like science class.','science→科学'),
    ('sentence','句子；判决',N,1,'high',['word','grammar','write','phrase'],['silence','student','separate'],'Please write five sentences.','sentence→句子'),
    ('separate','分开的；分离',A,1,'high',['divide','apart','different','together'],['separate','secretary','sentence'],'They went their separate ways.','separate→分开的'),
    ('situation','情况；形势',N,2,'medium',['condition','problem','state','case'],['station','suggestion','solution'],'The situation is getting better.','situation→情况'),
    ('society','社会',N,2,'medium',['people','world','community','social'],['social','science','society'],'We live in a modern society.','society→社会'),
    ('solution','解决方法；溶液',N,2,'medium',['answer','solve','problem','result'],['suggestion','pollution','situation'],'Can you find a solution?','solution→解决方案'),
    ('strength','力量；强项',N,2,'medium',['strong','power','weakness','energy'],['stress','stretch','straight'],'Knowledge is our strength.','strength→力量'),
    ('success','成功',N,1,'high',['succeed','win','achieve','fail'],['succeed','suggest','process'],'Hard work leads to success.','success→成功'),
    ('suggestion','建议',N,1,'high',['advice','idea','opinion','recommend'],['suggest','sugar','question'],'Thank you for your suggestion.','suggestion→建议'),
    ('surface','表面',N,2,'medium',['top','outside','face','bottom'],['service','surprise','purpose'],'The surface of the water is calm.','surface→表面'),
    ('technology','技术；科技',N,1,'high',['computer','science','internet','modern'],['technique','telegram','telephone'],'Technology changes our life.','technology→技术'),
    ('temperature','温度',N,1,'high',['hot','cold','degree','weather'],['temple','temporary','attempt'],'The temperature dropped last night.','temperature→温度'),
    ('thought','想法；思想（think的过去式）',N,1,'high',['idea','think','mind','opinion'],['through','though','thousand'],'He had a good thought.','thought→想法'),
    ('tradition','传统',N,2,'medium',['custom','culture','old','history'],['traditional','traditional','traffic'],'It is a Chinese tradition.','tradition→传统'),
    ('traffic','交通；车辆',N,1,'high',['road','car','busy','street'],['tradition','travel','trouble'],'The traffic is very heavy today.','traffic→交通'),
    ('trouble','麻烦；问题',N,1,'high',['problem','difficulty','worry','help'],['travel','double','tough'],'Sorry to cause you trouble.','trouble→麻烦'),
    ('university','大学',N,2,'medium',['college','school','student','education'],['universe','unique','union'],'She goes to Peking University.','university→大学'),
    ('vacation','假期',N,2,'medium',['holiday','rest','travel','summer'],['education','location','nation'],'Where did you go for vacation?','vacation→假期'),
    ('victory','胜利',N,2,'medium',['win','success','champion','defeat'],['video','village','view'],'We celebrated the victory.','victory→胜利'),
    ('vocabulary','词汇；词汇量',N,2,'medium',['word','language','dictionary','learn'],['voice','volunteer','vegetable'],'Reading helps build vocabulary.','vocabulary→词汇'),
    ('volunteer','志愿者；自愿做',N,2,'medium',['help','offer','free','service'],['vocabulary','violate','volleyball'],'She works as a volunteer.','volunteer→志愿者'),
    # Additional important missing words
    ('effect','效果；影响',N,1,'high',['result','cause','influence','affect'],['affect','effort','offer'],'The medicine had no effect.','ef(出)+fect(做)→做出来的结果→效果'),
    ('affect','影响；感动',V,2,'medium',['effect','influence','change','impact'],['effect','afford','accept'],'The weather affects our mood.','af+fect(做)→去做→影响'),
    ('effort','努力',N,1,'high',['try','hard','work','energy'],['affect','effect','offer'],'Please make an effort to study.','ef(出)+fort(力)→出力→努力'),
    ('achieve','实现；达到',V,1,'high',['succeed','reach','goal','accomplish'],['believe','receive','achieve'],'She achieved her dream.','a+chieve→实现'),
    ('addition','增加；附加',N,2,'medium',['add','plus','extra','more'],['addition','edition','attention'],'In addition, we need more time.','addition→增加'),
    ('advantage','优势；好处',N,2,'medium',['benefit','strength','good','disadvantage'],['advice','adventure','advance'],'Learning English has many advantages.','advantage→优势'),
    ('agreement','同意；协议',N,2,'medium',['agree','deal','contract','promise'],['agreement','agreement','disagree'],'They reached an agreement.','agreement→协议'),
    ('ancient','古代的',A,2,'medium',['modern','old','history','age'],['anger','angle','answer'],'This is an ancient city.','ancient→古代的'),
    ('balance','平衡',N,2,'medium',['equal','steady','weight','level'],['ball','blind','brave'],'You need to keep your balance.','balance→平衡'),
    ('behavior','行为；举止',N,2,'medium',['act','manners','conduct','action'],['behind','believe','before'],'His behavior was excellent.','behavior→行为'),
    ('courage','勇气',N,1,'high',['brave','fear','encourage','bold'],['courage','courage','courage'],'He showed great courage.','courage→勇气'),
    ('damage','损害；损坏',N,1,'high',['break','hurt','destroy','repair'],['damage','damage','message'],'The storm caused a lot of damage.','damage→损害'),
    ('danger','危险',N,1,'high',['safe','risk','harm','afraid'],['danger','danger','anger'],'Fire is dangerous.','danger→危险'),
    ('decision','决定',N,1,'high',['decide','choice','choose','plan'],['decision','decision','vision'],'She made an important decision.','decision→决定'),
    ('direction','方向；指导',N,2,'medium',['way','north','guide','direct'],['direction','directory','director'],'Which direction should we go?','direction→方向'),
    ('discovery','发现',N,2,'medium',['discover','find','invention','research'],['discover','discuss','display'],'This was a great discovery.','discovery→发现'),
    ('disease','疾病',N,2,'medium',['sick','illness','health','hospital'],['design','discuss','disgust'],'Heart disease is common.','disease→疾病'),
    ('distance','距离',N,2,'medium',['far','near','mile','space'],['instance','distance','disturb'],'What is the distance from here to school?','distance→距离'),
    ('education','教育',N,1,'high',['school','learn','teach','study'],['edition','election','electric'],'Education is important for everyone.','education→教育'),
    ('environment','环境',N,1,'high',['nature','protect','pollution','world'],['environment','environment','enjoyment'],'We should protect the environment.','environment→环境'),
    ('excellent','优秀的',A,1,'high',['great','good','wonderful','perfect'],['except','excite','expensive'],'She is an excellent student.','excellent→优秀的'),
    ('experience','经验；经历',N,1,'high',['practice','try','feel','learn'],['experiment','explain','express'],'He has rich experience.','experience→经验'),
    ('failure','失败',N,2,'medium',['fail','success','lose','mistake'],['failure','feature','future'],'Failure is the mother of success.','failure→失败'),
    ('feature','特征；特点',N,2,'medium',['characteristic','part','quality','special'],['feature','future','failure'],'What are the features of this phone?','feature→特征'),
    ('general','一般的；总的',A,2,'medium',['usual','common','special','normal'],['generally','generation','gentle'],'I have a general idea about it.','general→一般的'),
    ('habit','习惯',N,1,'high',['custom','practice','usual','behavior'],['habit','rabbit','hobby'],'Reading is a good habit.','habit→习惯'),
    ('health','健康',N,1,'high',['healthy','sick','body','exercise'],['healthy','wealth','heavy'],'Health is more important than wealth.','health→健康'),
    ('height','高度；身高',N,2,'medium',['high','tall','top','measure'],['height','weight','eight'],'What is the height of the mountain?','height→高度'),
    ('honest','诚实的',A,1,'high',['true','trust','lie','sincere'],['honest','honor','honey'],'He is an honest person.','honest→诚实的'),
    ('humor','幽默',N,2,'medium',['funny','joke','laugh','smile'],['humor','human','humorous'],'She has a great sense of humor.','humor→幽默'),
    ('independent','独立的',A,2,'medium',['free','alone','depend','freedom'],['independent','different','incident'],'She is very independent.','independent→独立的'),
    ('intention','意图；目的',N,3,'low',['purpose','plan','goal','aim'],['intention','attention','invention'],'What is your intention?','intention→意图'),
    ('introduction','介绍；引言',N,2,'medium',['introduce','begin','welcome','present'],['introduction','instruction','invention'],'Please read the introduction first.','introduction→介绍'),
    ('invention','发明',N,2,'medium',['invent','create','discover','machine'],['invention','invention','invention'],'The computer is a great invention.','invention→发明'),
    ('lifestyle','生活方式',N,2,'medium',['life','habit','style','living'],['lifestyle','lifetime','lifestyle'],'A healthy lifestyle is important.','lifestyle→生活方式'),
    ('management','管理',N,3,'low',['manage','control','run','organize'],['manager','manner','magnet'],'Good management is important.','management→管理'),
    ('material','材料',N,2,'medium',['cloth','stuff','substance','wood'],['material','matter','mature'],'What material is this shirt made of?','material→材料'),
    ('meaning','意义；意思',N,1,'high',['mean','word','idea','sense'],['meaning','meeting','reading'],'What is the meaning of this word?','meaning→意思'),
    ('medical','医学的；医疗的',A,2,'medium',['medicine','doctor','hospital','health'],['medical','memorial','mental'],'She needs medical attention.','medical→医学的'),
    ('mention','提到；提及',V,2,'medium',['refer','say','talk about','note'],['mental','mission','mention'],'He mentioned your name.','mention→提到'),
    ('mistake','错误',N,1,'high',['error','wrong','correct','fault'],['mistake','misunderstand','mix'],'I made a mistake in the test.','mis+take(拿)→拿错了→错误'),
    ('native','本地的；本族的',A,2,'medium',['local','born','foreign','country'],['nature','national','natural'],'English is her native language.','native→本地的'),
    ('negative','消极的；否定的',A,3,'low',['positive','bad','unhappy','pessimistic'],['negative','native','nation'],'Dont be negative about life.','negative→消极的'),
    ('normal','正常的',A,1,'high',['usual','regular','strange','abnormal'],['normally','nature','notable'],'Everything is back to normal.','normal→正常的'),
    ('notebook','笔记本',N,2,'medium',['book','note','write','pen'],['notebook','nobody','nothing'],'Please bring your notebook.','notebook→笔记本'),
    ('organized','有组织的',A,2,'medium',['order','tidy','system','plan'],['organized','organize','organization'],'She is very organized.','organized→有组织的'),
    ('passenger','乘客',N,2,'medium',['travel','bus','train','seat'],['passage','pass','past'],'There are many passengers on the bus.','passenger→乘客'),
    ('patient','耐心的；病人',A,1,'high',['impatient','wait','calm','kind'],['patient','patience','pattern'],'Please be patient.','patient→耐心的'),
    ('pattern','模式；图案',N,3,'low',['design','shape','style','example'],['patient','patience','pattern'],'I can see a pattern here.','pattern→模式'),
    ('positive','积极的；肯定的',A,2,'medium',['negative','optimistic','active','sure'],['possible','position','positive'],'Stay positive and never give up.','positive→积极的'),
    ('possession','拥有；财产',N,3,'low',['own','have','property','belong'],['possession','possible','position'],'He lost all his possessions.','possession→拥有'),
    ('praise','表扬；赞扬',V,2,'medium',['encourage','criticize','compliment','pride'],['praise','practise','prayer'],'The teacher praised her homework.','praise→表扬'),
    ('presence','出席；存在',N,3,'low',['absence','present','attend','exist'],['presence','present','prevent'],'Your presence is required.','presence→出席'),
    ('pressure','压力',N,2,'medium',['stress','push','heavy','relax'],['pressure','pleasure','precious'],'She is under a lot of pressure.','pressure→压力'),
    ('principle','原则；原理',N,3,'low',['rule','belief','standard','value'],['principle','principal','prince'],'He always follows his principles.','principle→原则'),
    ('process','过程；程序',N,2,'medium',['step','method','way','progress'],['process','produce','protect'],'Learning is a long process.','process→过程'),
    ('product','产品',N,2,'medium',['goods','make','produce','sell'],['produce','program','project'],'This is a useful product.','product→产品'),
    ('program','节目；程序',N,2,'medium',['show','computer','plan','schedule'],['produce','project','progress'],'I watched a TV program.','program→节目'),
    ('progress','进步；进展',N,1,'medium',['improve','develop','advance','grow'],['process','project','produce'],'She has made great progress.','progress→进步'),
    ('project','项目；工程',N,2,'medium',['plan','work','task','program'],['produce','program','protect'],'We are working on a science project.','project→项目'),
    ('property','财产；性质',N,3,'low',['own','belong','wealth','possession'],['property','properly','probably'],'Protect your property.','property→财产'),
    ('publish','出版；发表',V,2,'medium',['print','book','write','public'],['public','punish','pull'],'She published her first book.','publish→出版'),
    ('punish','惩罚',V,2,'medium',['reward','discipline','penalty','forgive'],['publish','punish','push'],'The teacher punished him for cheating.','punish→惩罚'),
    ('quarter','四分之一；一刻钟',N,2,'medium',['fourth','half','time','piece'],['quality','quarter','queen'],'A quarter of the students passed.','quarter→四分之一'),
    ('questionnaire','问卷',N,3,'low',['question','survey','ask','answer'],['questionnaire','question','quality'],'Please fill in this questionnaire.','questionnaire→问卷'),
    ('reduce','减少',V,1,'high',['decrease','cut','less','increase'],['produce','introduce','reduce'],'We should reduce waste.','reduce→减少'),
    ('reform','改革',N,3,'low',['change','improve','system','policy'],['reform','form','refuse'],'Education reform is important.','reform→改革'),
    ('relation','关系',N,2,'medium',['relationship','family','connect','relative'],['relation','relax','relative'],'She has a good relation with her classmates.','relation→关系'),
    ('reputation','名声；声誉',N,3,'low',['name','fame','honor','respect'],['reputation','republic','require'],'He has a good reputation.','reputation→名声'),
    ('request','请求；要求',N,2,'medium',['ask','demand','require','need'],['require','question','research'],'She made a request for help.','request→请求'),
    ('responsibility','责任',N,2,'medium',['duty','job','task','role'],['response','responsible','result'],'It is our responsibility to protect the earth.','responsibility→责任'),
    ('reward','奖励；回报',N,2,'medium',['prize','award','gift','punish'],['reward','require','research'],'Hard work brings rewards.','reward→奖励'),
    ('safety','安全',N,2,'medium',['safe','danger','protect','secure'],['safety','satisfy','sake'],'Safety comes first.','safety→安全'),
    ('service','服务',N,2,'medium',['serve','help','provide','customer'],['service','serious','surface'],'The service in this restaurant is good.','service→服务'),
    ('shelter','避难所；庇护',N,3,'low',['protect','house','safe','cover'],['shell','shelter','shoulder'],'They found shelter from the rain.','shelter→避难所'),
    ('signal','信号',N,3,'low',['sign','message','mark','warning'],['signal','single','silence'],'The traffic signal turned red.','signal→信号'),
    ('silence','沉默；安静',N,2,'medium',['quiet','silent','noise','peace'],['silence','science','sentence'],'Please keep silence in the library.','silence→沉默'),
    ('smoke','吸烟；烟',V,2,'medium',['cigarette','fire','smell','stop'],['smile','smoke','snake'],'Smoking is bad for your health.','smoke→吸烟'),
    ('standard','标准',N,2,'medium',['level','quality','rule','normal'],['standard','start','stand'],'We should set high standards.','standard→标准'),
    ('stomach','胃；肚子',N,2,'medium',['food','eat','body','hungry'],['storm','stone','store'],'My stomach hurts.','stomach→胃'),
    ('strength','力量',N,2,'medium',['strong','power','energy','weakness'],['stress','stretch','straight'],'He lifted the box with great strength.','strength→力量'),
    ('suggestion','建议',N,1,'high',['advice','idea','recommend','opinion'],['suggest','sugar','subject'],'That is a good suggestion.','suggestion→建议'),
    ('system','系统；制度',N,2,'medium',['method','plan','organization','way'],['system','suggest','support'],'The school has a good system.','system→系统'),
    ('technique','技术；技巧',N,3,'low',['skill','method','way','technology'],['technology','technique','technique'],'She has a good writing technique.','technique→技巧'),
    ('temperature','温度',N,1,'high',['hot','cold','degree','weather'],['temple','temporary','attempt'],'The temperature is 30 degrees.','temperature→温度'),
    ('theory','理论',N,3,'low',['idea','science','practice','research'],['theory','their','there'],'This is just a theory.','theory→理论'),
    ('topic','话题；主题',N,2,'medium',['subject','theme','talk','discuss'],['topic','top','total'],'What is the topic of your speech?','topic→话题'),
    ('tradition','传统',N,2,'medium',['custom','culture','old','history'],['traditional','traffic','tradition'],'It is a Chinese tradition.','tradition→传统'),
    ('value','价值',N,2,'medium':['price','worth','important','good'],['value','village','various'],'This book has great value.','value→价值'),
    ('view','风景；观点',N,2,'medium',['opinion','scenery','see','sight'],['view','village','voice'],'The view from the top is beautiful.','view→风景'),
    ('violence','暴力',N,3,'low',['fight','hurt','peaceful','attack'],['violence','violin','virtual'],'We should say no to violence.','violence→暴力'),
    ('wealth','财富',N,2,'medium',['money','rich','poor','health'],['healthy','weather','wealth'],'Health is better than wealth.','wealth→财富'),
    ('weight','重量；体重',N,2,'medium',['heavy','light','weigh','mass'],['weight','height','wait'],'What is your weight?','weight→重量'),
    ('wood','木头；树木',N,1,'medium',['tree','forest','wooden','material'],['wood','would','good'],'The table is made of wood.','wood→木头'),
]

# Add missing words (skip duplicates)
added = 0
skipped = 0
for entry in missing_core:
    w = entry[0]
    if w not in words:
        add(*entry)
        added += 1
    else:
        skipped += 1

print(f'新增核心词 {added}, 跳过已存在 {skipped}')
print(f'当前总数: {len(words)}')

data['meta']['total'] = len(words)

with open('/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/words_network_j2.json','w',encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print('Saved!')
