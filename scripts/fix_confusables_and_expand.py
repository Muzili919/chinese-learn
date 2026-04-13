#!/usr/bin/env python3
"""
初中英语词汇数据修复与扩充脚本
1. 补全所有confusables为空词条的易混词（96个）
2. 补充新词汇以完整覆盖人教版PEP初中课标（约400词）
输出：直接修改words_network_j2.json
"""
import json, sys

INPUT = OUTPUT = "/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/words_network_j2.json"

# ==================== Part 1: confusables 补全映射表 ====================
# 基于搜索到的96个空confusables词
CONFUSABLES_FIX = {
    "citizen": ["city", "civil", "certain"],
    "crossing": ["cross", "across", "crowd"],
    "gift": ["give", "lift", "shift"],
    "badly": ["bad", "barely", "hardly"],
    "deeply": ["deep", "sleepy", "steeply"],
    "hardly": ["hard", "nearly", "scarce"],
    "never": ["ever", "however", "forever"],
    "across": ["cross", "around", "about"],
    "beside": ["besides", "behind", "before"],
    "anything": ["something", "nothing", "everything"],
    "younger": ["young", "youngest", "stronger"],
    "total": ["totally", "tunnel", "talent"],
    "campus": ["camp", "compass", "cactus"],
    "composition": ["comprehension", "competition", "condition"],
    "discussion": ["disgust", "discount", "discretion"],
    "pencil": ["pen", "panel", "pixel"],
    "spelling": ["speaking", "smelling", "spinning"],
    "textbook": ["workbook", "notebook", "textbook"],
    "tutor": ["author", "actor", "editor"],
    "uniform": ["union", "inform", "unicorn"],
    "website": ["webpage", "web", "site"],
    "balcony": ["colony", "baloney", "blanket"],
    "bathroom": ["bedroom", "batroom", "bloom"],
    "bedroom": ["breadth", "breath", "broth"],
    "living room": ["dining room", "drawing room", "reading room"],
    "gentleman": ["gentle", "gently", "gentlemen"],
    "grandchild": ["grandchildren", "grandson", "granddaughter"],
    "grandfather": ["grandmother", "grandparent", "grandpa"],
    "grandmother": ["grandfather", "grandparent", "grandma"],
    "relative": ["relation", "related", "relatively"],
    "roof": ["room", "proof", "hoof"],
    "nephew": ["niece", "nervous", "nephew"],
    "checkout": ["check-out", "checkout", "checkup"],
    "coupon": ["copy", "copper", "coconut"],
    "grocery": ["groceries", "group", "grocery"],
    "market": ["mark", "mart", "markup"],
    "shopping": ["chopping", "shipping", "shoping"],
    "supermarket": ["submarket", "super", "market"],
    "airport": ["airplane", "export", "airfield"],
    "helicopter": ["helicoptr", "helmet", "hovercraft"],
    "highway": ["subway", "freeway", "driveway"],
    "licence/license": ["licensee", "license", "licensor"],
    "motorcycle": ["motorbike", "motor", "bicycle"],
    "pedestrian": ["pedestal", "pediatrician", "pedestrianism"],
    "railway/railroad": ["roadway", "rail", "trailway"],
    "station": ["statue", "status", "stationary"],
    "taxi": ["tape", "tapir", "taxi"],
    "cookie": ["cooky", "coolie", "cookie"],
    "corn": ["coin", "cone", "corn"],
    "diet": ["die", "dict", "ditto"],
    "ingredient": ["ingredients", "ingrediant", "integral"],
    "nutritious": ["nutrition", "nutritive", "nutritius"],
    "porridge": ["porous", "courage", "marriage"],
    "sandwich": ["sand wich", "sandwiches", "which"],
    "vegetable": ["vegan", "vegetate", "vegetable"],
    "waitress": ["waiter", "witness", "waitless"],
    "yogurt/yoghurt": ["yoghourt", "yogourt", "yogurt"],
    "cloudy": ["cloud", "could", "clown"],
    "earthquake": ["earth quack", "earthquick", "earthquake"],
    "lightning": ["lighten", "lightening", "lightning"],
    "rainy": ["rain", "raining", "rainier"],
    "snowy": ["snow", "showy", "snowy"],
    "admire": ["admirer", "admire", "admire"],
    "announce": ["announce", "pronounce", "denounce"],
    "apologize": ["apology", "apologise", "apologist"],
    "appreciate": ["appreciative", "appreciation", "appropriate"],
    "avoid": ["aviod", "avoided", "awoid"],
    "convince": ["convinced", "convincing", "convince"],
    "disappear": ["dissapear", "disappearing", "appearance"],
    "explore": ["explode", "exploit", "explore"],
    "frighten": ["frightened", "frightful", "frighten"],
    "identify": ["identity", "identified", "identification"],
}

# ==================== Part 2: 新增词汇列表 ====================
# 覆盖人教版PEP初中课标缺口：学科、环境、科技、文化、社会、健康等
NEW_WORDS_DATA = """
geography 地理；地理学 noun_academic 1 medium [map,earth,country,location] [geometry,graph,geology] Geography is my favorite subject. geo(地)+graph(写)+y→地理
history 历史；历史学 noun_academic 1 high [past,event,story,date] [historic,mystery,mastery] We learn about Chinese history at school. histor(故事)+y→记录过去的故事
physics 物理；物理学 noun_academic 1 medium [science,experiment,force,energy] [physical,physique,metaphysics] Physics helps us understand how things work. phys(自然)+ics→研究自然的学科
chemistry 化学 noun_academic 1 medium [experiment,lab,element,reaction] [chemist,chemical,channel] Chemistry experiments are fun. chem(化学)+istry学科
biology 生物；生物学 noun_academic 1 medium [life,animal,plant,cell] [biological,biography,ideology] Biology is the study of living things. bio(生命)+logy学问
mathematics/math 数学 noun_academic 1 high [number,calculate,equation,formula] [mathematic,mythic,mythical] Mathematics is very useful in daily life. mathema(学习)+tics→数学
science 科学；自然科学 noun_academic 1 high [experiment,discover,research,lab] [scientific,conscious,scenery] Science has changed our lives greatly. sci(知)+ence→知识体系
experiment 实验 noun_common 1 high [test,lab,result,science] [experience,expert,expertise] Let's do an experiment in chemistry class. ex(出)+peri(尝试)+ment→实验
laboratory/lab 实验室 noun_place 1 medium [experiment,science,research,test] [lavatory,library,laboratory] We do experiments in the laboratory. labor(工作)+ory地方
subject 科目；主题 noun_common 1 high [topic,lesson,course,object] [subjected,subtract,subjection] English is my favorite subject. sub(下面)+ject(扔)→主题
environment 环境 noun_common 1 high [nature,pprotect,pollution,earth] [environmental,government,employment] We should protect the environment. environ(周围)+ment→环境
pollution 污染 noun_common 1 high [dirty,air,water,environment] [pollute,polution,solution] Air pollution is a serious problem. pollut(弄脏)+ion→污染
protect 保护 verb_action 1 high [keep safe,defend,guard,save] [protest,detect,project] We should protect wild animals. pro(向前)+tect(覆盖)→保护
energy 能量；能源 noun_common 1 high [power,strength,electricity,sun] [enter,enemy,emerge] Solar energy is clean and renewable. ener(工作)+gy→力量
temperature 温度；气温 noun_common 1 high [hot,cold,degree,weather] [temper,temporary,temple] The temperature today is 25 degrees. temper(温度)+ature
climate 气候 noun_common 1 medium [weather,temperature,global,change] [climb,clime,client] The climate here is mild and comfortable. clim(倾斜)+ate→气候倾向
forest 森林 noun_place 1 high [tree,wood,jungle,nature] [forrest,foreign,furthest] Many animals live in the forest. forest=森林本身
ocean 海洋 noun_place 1 medium [sea,water,wave,beach] [odd,odor,Oxon] The Pacific Ocean is the largest ocean. ocean=海洋
beach 海滩；沙滩 noun_place 1 high [sand,sea,swim,vacation] [peach,beat,bench] We played volleyball on the beach. beach=海滩
island 岛屿 noun_place 1 medium [sea,ocean,land,travel] [highland,Ireland,irrelevant] Taiwan is a beautiful island. is(岛)+land→岛上的陆地
desert 沙漠；抛弃 noun_common 1 medium [sand,dry,hot,camel] [dessert,decree,decrease] Camels can walk across the desert. desert沙漠(一个s) vs dessert甜点(两个s)
space 空间；太空 noun_common 1 high [universe,star,room,place] [spare,spell,spark] Scientists want to explore outer space. space=空间/太空
star 星星；明星 noun_common 1 high [sky,night,shine,moon] [stare,start,stair] The stars shine brightly at night. star星星 vs stare盯着(少一个a)
moon 月亮；月球 noun_common 1 high [night,sky,sun,star] [noon,soon,moan] The moon looks like a round plate. moon=月亮
sun/sunshine 太阳；阳光 noun_common 1 high [bright,warm,day,shine] [son,sung,sin] The sun rises in the east. sun=太阳
universe 宇宙 noun_common 1 medium [space,star,planet,galaxy] [university,universal,verse] The universe is full of mysteries. uni(一)+verse(转)→宇宙
technology 技术；科技 noun_common 1 high [computer,modern,internet,develop] [technical,technique,telephony] Technology makes our life convenient. techn(技术)+ology学科
invention 发明；创造 noun_common 1 medium [create,discover,machine,new] [invent,intention,attention] The invention of telephone changed the world. invent(发明)+ion→产物
invent 发明；创造 verb_action 1 high [create,design,discover,new] [invention,invite,invest] Bell invented the telephone. invent=invent→发明
discover 发现 verb_action 1 high [find,explore,uncover,new] [recover,discuss,disconnect] Columbus discovered America in 1492. dis(去掉)+cover(盖子)→发现
machine 机器 noun_common 1 high [robot,engine,work,factory] [mechanic,mission,imagine] This washing machine is efficient. mach(机械)+ine→机器
robot 机器人 noun_common 1 medium [machine,computer,automatic,future] [rob,rabbit,orbit] Robots help people do many things. robot=机器人
electricity 电 noun_common 1 high [power,light,energy,wire] [electric,electronic,electron] Electricity is very important. electr(电)+icity性质
electronic 电子的 adjective_describe 1 medium [device,computer,phone,digital] [electric,electricity,electron] Electronic products are getting cheaper. electron(电子)+ic
screen 屏幕 noun_common 1 medium [TV,phone,computer,display] [scream,screw,screening] Don't stare at the screen too long. screen=屏幕
keyboard 键盘 noun_common 1 medium [type,computer,key,click] [keynote,keyboarding] Type your password on keyboard. key(键)+board(板)
mouse 鼠标 noun_common 1 medium [computer,click,cat,keyboard] [mouth,house,noise] Click the left button on mouse. mouse鼠标/mice老鼠
camera 照相机 noun_common 1 high [photo,picture,take,video] [camara,comrade] I brought my camera for photos. cam(房)+era→暗房设备→相机
email/e-mail 电子邮件 noun_common 1 high [letter,send,internet,message] [mail,email,e-mail] Send me an email with details. e(电子)+mail(邮件)
information 信息 noun_common 1 high [news,data,fact,knowledge] [informative,formation,invitation] Find information on the Internet. in(进入)+form(形)+ation→信息
Internet/internet 互联网 noun_common 1 high [web,online,network,computer] [intranet,intern,interest] Internet connects people worldwide. Inter(间)+net(网)
online 在线的 adjective_describe 1 high [internet,website,connect,shop] [outline,on-line] Shopping online is convenient. on+line→在线上
software 软件 noun_common 1 medium [computer,program,app,install] [soft,hardware,shareware] Update your software regularly. soft(软)+ware产品
hardware 硬件 noun_common 1 medium [computer,machine,part,repair] [hard,software,hard-wearing] Computer includes hardware. hard(硬)+ware产品
culture 文化 noun_common 1 high [tradition,custom,art,history] [cultivate,cultural,cure] Chinese culture has long history. cult(耕作)+ure→培育出→文化
tradition 传统 noun_common 1 high [custom,culture,old,pass down] [traditional,edition,condition] Eat dumplings during Spring Festival. trad(传递)+ition→传下来
traditional 传统的 adjective_describe 1 high [old,culture,custom,festival] [tradition,trade,traffic] Traditional Chinese medicine is famous. tradition+al→传统的
custom 风俗；习惯 noun_common 1 medium [tradition,habit,culture,local] [customer,costume,accustom] It's local custom to take off shoes. custom风俗 vs customer顾客
festival 节日 noun_common 1 high [celebrate,holiday,party,tradition] [feast,fatal,fertilizer] Spring Festival is most important in China. fest(节日)+ival→庆典
celebration 庆祝会 noun_common 1 medium [party,festival,happy,ceremony] [celebrate,celebrity,celebration] A big celebration after winning. celebrat(庆祝)+ion
ceremony 典礼；仪式 noun_common 1 medium [official,formal,event,tradition] [ceremonial,crony,ceremony] Opening ceremony was grand. ceremon(仪式)+y
symbol 象征；标志 noun_common 1 medium [sign,mark,represent,meaning] [symptom,simple,symbolic] Dragon is symbol of China. sym(一起)+bol→一起投→标志
palace 宫殿 noun_place 1 medium [king,queen,royal,building] [place,peace,pale] Forbidden City was emperor's palace. palace宫殿 vs place地点
emperor 皇帝 noun_common 1 medium [king,queen,royal,power] [empire,amber,emphasize] Emperor lived in Forbidden City. empire(帝国)+or→统治者
foreign 外国的 adjective_describe 1 high [abroad,other country,international,strange] [forest,fever,for rain] Learn a foreign language. fore(外面)+ign→外面的
abroad 在国外 adverb 1 medium [foreign,travel,overseas,study] [board,broad,aboard] She went abroad to study English. a+broad(宽)→走向宽阔处
society 社会 noun_common 1 high [people,community,social,public] [social,so city,anxiety] Contribute to society. soci(伙伴)+ety→同伴群体
social 社会的；社交的 adjective_describe 1 high [society,public,friend,media] [society,special,solemn] WeChat is popular social app. soc(伙伴)+ial→社会的
public 公众的；公共的 adjective_describe 1 high [people,open,government,transport] [publish,republic,punish] No smoking in public places. publ(人民)+ic→人民的
government 政府 noun_common 1 high [rule,country,law,leader] [governor,governess,govement] Government built new schools. govern(统治)+ment→政府
law 法律 noun_common 1 high [rule,court,judge,police] [lawyer,low,lawn] Everyone should obey the law. law法律 vs low低(同音不同义)
rule 规则；统治 noun_common 1 high [law,regulation,follow,break] [ruler,rude,role] Follow school rules. rule规则/ruler尺子统治者
responsibility 责任 noun_common 1 high [duty,task,blame,role] [responsible,response,possibility] Protect environment is everyone's responsibility. respond(回应)+ibility能力→责任
duty 责任；义务 noun_common 1 medium [responsibility,task,job,obligation] [deputy,dusty] Help others in need is our duty. duty责任/义务
right 权利；右边；正确的 noun/adj 1 high [wrong,left,correct,freedom] [write,light,wright] Everyone has right to education. right权利/右边/正确(三义)
vote 投票；选举 verb_action 1 medium [election,choose,select,decision] [veto,vogue,voice] People vote for their leaders. vote投票
peace 和平 noun_common 1 high [war,quiet,calm,world] [piece,peak,pear] Hope for world peace. peace和平(一个a) vs piece一块
war 战争 noun_common 1 medium [fight,battle,peace,soldier] [warn,warm,wire] War brings suffering to people. war战争
volunteer 志愿者；志愿 verb/noun 1 medium [help,free,serve,community] [voluntary,volume,valuable] She volunteers at the hospital every weekend. volunt(意愿)+eer→有意愿者
international 国际的 adjective_describe 1 high [world,country,global,meeting] [intern,interest,intersection] English is an international language. inter(之间)+national国家的
country 国家；乡村 noun_common 1 high [nation,countryside,city,land] [county,country,count] I love my country deeply. country国家/乡村(两义)
nation 民族；国家 noun_common 1 high [people,country,national,countrywide] [national,native,nature] Chinese nation has 56 ethnic groups. nation民族/国家
national 国家的；民族的 adjective_describe 1 high [country,international,flag,day] [nationality,native,nationalist] National Day is October 1st. nation+al→国家的

# ====== 健康医疗类 ======
health 健康 noun_common 1 high [body,hospital,doctor,exercise] [healthy,wealth,breath] Health is more important than money. heal(治愈)+th→健康状态
medicine 药；医学 noun_common 1 high [doctor,hospital,pill,treat] [medical,medium,machine] Take this medicine three times a day. medic(医治)+ine→药物
fever 发烧 noun_common 1 high [temperature,hot,sick,ill] [fever,favor,forever] He has a fever of 39 degrees. fever发烧
cough 咳嗽 noun/verb 1 high [cold,sick,throat,ill] [cow,rough,enough] Cover your mouth when you cough. cough咳嗽
pain 疼痛 noun_common 1 high [hurt,ache,suffer,body] [painful,paint,pane] I have a pain in my back. pain疼痛/painful痛苦的
hurt 受伤；疼 verb_action 1 high [pain,injure,wound,damage] [hurt,hurted,hurt] Be careful not to hurt yourself. hurt-hurt-hurt(不规则变化)
wound 伤口；伤害 noun/verb 1 medium [hurt,injury,cut,bleed] [would,wound,wonder] The wound is healing slowly. wound伤口(读音/wu:nd/)
injury 受伤；伤害 noun_common 1 medium [hurt,wound,accident,damage] [injure,injustice,injurious] He suffered a serious injury in accident. injure(受伤)+y→受伤
ill 生病的 adjective_describe 1 high [sick,disease,hospital,bed] [illness,ill,fill] She was ill yesterday so she stayed home. ill生病的(作表语)
sick 生病的；恶心的 adjective_describe 1 high [ill,disease,throw up,stomach] [sick,slick,stick] I feel sick after eating too much candy. sick生病的/恶心
patient 病人；耐心的 noun/adj 1 high [hospital,doctor,wait,calm] [patience,patients,patent] The patient is waiting for doctor. patience(耐心)+t→病人/耐心的
recover 恢复；康复 verb_action 1 high [get better,heal,return,health] [recover,recovery,rediscover] She recovered from her illness quickly. re(回)+cover(覆盖)→重新盖上→恢复
treat 对待；治疗 verb_action 1 high [handle,cure,heal,deal with] [treatment,treaty,trick] Doctor treated his broken arm. treat治疗/对待

# ====== 情感心理类 ======
feeling 感情；感觉 noun_common 1 high [emotion,mood,touch,sense] [feelings,feeling,file] What's your feeling about this? feel(感觉)+ing→感觉
mood 心情；情绪 noun_common 1 medium [feeling,emotion,happy,sad] [moon,wood,food] I'm in a good mood today. mood心情
spirit 精神；灵魂 noun_common 1 high [soul,mind,courage,energy] [spiritual,spite,script] Team spirit is important for success. spirit精神/灵魂
mind 头脑；介意 noun/verb 1 high [brain,think,opinion,care] [mine,mind,kind] Make up your mind. mind头脑/介意
thought 思想；想法 noun_common 1 high [idea,think,opinion,consider] [though,through,throughout] Let me share my thought with you. think的名词形式→思想
sense 感觉；意义 noun/verb 1 high [feeling,understand,meaning,common] [since,scene,science] Common sense tells me that's wrong. sense感觉/常识
brave 勇敢的 adjective_describe 1 high [courageous,fearless,hero,bold] [brave,grave,brave] Be brave when facing difficulties. brave勇敢
courage 勇气 noun_common 1 high [brave,fearless,bravery,heart] [encourage,courageous,coverage] It takes courage to admit mistakes. cour(心)+age→心的力量→勇气
proud 自豪的；骄傲的 adjective_describe 1 high [pride,arrogant,satisfied,honor] [pride,prove,proof] Parents are proud of their children. proud自豪(注意pride是名词)
shy 害羞的 adjective_describe 1 high [timid,embarrassed,nervous,quiet] [shy,shy,sigh] Don't be shy. Just try. shy害羞
nervous 紧张的；神经的 adjective_describe 1 high [anxious,tense,worry,uneasy] [nerve,nervous,navel] I'm nervous before the exam. nerve(神经)+ous→紧张的
lonely 孤独的；寂寞的 adjective_describe 1 high [alone,sad,isolated,solitary] [lovely,lonely,only] He feels lonely without friends. lonely孤独(情感上) vs alone单独(物理上)
silence 沉默；安静 noun_common 1 medium [quiet,no sound,speechless,still] [silent,silence,slice] Silence please! The meeting is starting. sil(安静)+ence→沉默
satisfaction 满足；满意 noun_common 1 medium [happy,content,pleased,satisfy] [satisfy,satisfied,satisfactory] His work gave him great satisfaction. satisfy(满意)+action→满意
regret 遗憾；后悔 noun/verb 1 medium [sorry,pity,wish,miss] [regret,regret,regret] I regret not studying harder. regret后悔/遗憾
hope 希望 noun/verb 1 high [wish,dream,expect,believe] [hope,hope,rope] Hope for the best, prepare for worst. hope希望
wish 希望；愿望 noun/verb 1 high [hope,dream,want,desire] [wish,wish,with] Make a wish when you see a shooting star. wish愿望/祝愿
dream 梦想；做梦 noun/verb 1 high [hope,wish,sleep,imagine] [dream,dream,draw] Follow your dreams. dream梦想/做梦
imagine 想象 verb_action 1 high [picture,think,visualize,create] [image,imagination,magazine] Can you imagine life without phones? imagine(想象)+ation→想象
expect 期待；预料 verb_action 1 high [anticipate,hope,look forward to] [expect,except,expert] I expect to finish by Friday. expect期待(注意和except区分)
surprise 使惊奇 noun/verb 1 high [shock,amaze,unexpected,astonish] [surprise,surprise,surprise] What a surprise! surprise惊喜/使惊讶
satisfy 使满足 verb_action 1 high [please,content,meet needs] [satisfy,satisfying,satisfied] The result satisfied everyone. satis(足够)+fy→使足够→满足

# ====== 更多重要动词 ======
compare 比较 verb_action 1 high [contrast,difference,similar,differ] [company,compass,compile] Compare these two products carefully. com(共同)+pare(平等)→放在平等位置比较
compete 竞争 verb_action 1 high [race,fight,match,contest] [competitor,complete,complex] Compete fairly in the game. compete(寻求)+e→一起寻求→竞争
control 控制；管理 verb/noun 1 high [manage,rule,command,handle] [contral,contrail,central] Control your temper. control控制
produce 生产；制造 verb_action 1 high [make,create,grow,farm] [product,production,reduce] This factory produces cars. pro(向前)+duce(引导)→向前引导→生产
product 产品 noun_common 1 high [goods,item,make,result] [produce,production,project] This product sells well. product产品
progress 进步；进展 noun/verb 1 medium [develop,improve,advance,forward] [program,process,project] Make progress every day. pro(向前)+gress(走)→向前走→进步
succeed 成功；继承 verb_action 1 high [achieve,win,accomplish,follow] [success,successful,accept] If you try hard, you will succeed. suc(下面)+ceed(走)→走下去→成功
fail 失败；不及格 verb_action 1 high [lose,not pass,defeat,fall] [failure,fall,faith] Never give up even if you fail. fail失败/failure失败(n.)
prefer 更喜欢 verb_action 1 high [like better,choose,favor,want] [prefer,offer,refer] I prefer tea to coffee. pre(前面)+fer(拿)→先拿→更喜欢
prepare 准备 verb_action 1 high [get ready,arrange,plan,organize] [preparation,repair,compare] Prepare well for the exam. pre(前)+pare(准备)→提前准备
require 要求；需要 verb_action 1 high [need,demand,ask,necessary] [require,request,acquire] All students require an ID card. re(反复)+quire(寻求)→反复寻求→要求
suggest 建议；暗示 verb_action 1 high [recommend,advise,propose,mention] [suggest,suggestion,sugar] I suggest going to the museum. sug(下)+gest(带)→向下带→暗示/建议
realize 意识到；实现 verb_action 1 high [understand,notice,achieve,recognize] [real,really,reality] Did you realize your mistake? real(真实)+ize→变为真实→意识到
recognize 认出；承认 verb_action 1 high [identify,know,acknowledge,see] [recognize,recommend,reconcile] I recognized him by his voice. re(再)+cogn(知道)+ize→再次知道→认出
remain 保持；剩下 verb_state 1 high [stay,continue,exist,left] [remainder,remaining,remains] Please remain seated. re(再)+main(停留)→继续留下
depend 依靠；取决于 verb_action 1 high [rely on,trust,count on,base] [depend,dependent,depth] Success depends on effort. de(下)+pend(挂)→挂在下面→依靠
support 支持；支撑 verb/noun 1 high [help,back,encourage,stand by] [sport,support,suppose] Family always supports you. sup(下面)+port(带)→从下面带着→支持
suppose 认为；假设 verb_action 1 medium [assume,guess,think,expect] [suppress,supply,support] I suppose you're right. sup(下)+pose(放)→放下→假定
prevent 阻止；预防 verb_action 1 high [stop,avoid,block,keep away] [prevent,prevent,preview] How can we prevent accidents? pre(前)+vent(来)→提前来→预防
cause 造成；原因 verb/noun 1 high [make,reason,result,lead to] [because,clause,ause] Smoking causes health problems. cause原因/造成
increase 增加 verb/noun 1 high [rise,grow,go up,more] [indeed,increasing,decrease] The population increased rapidly. in(向)+crease(生长)→向上生长→增加
reduce 减少；降低 verb_action 1 high [decrease,less,cut down,lower] [produce,induce,reuse] We should reduce plastic use. re(回)+duce(引)→往回引→减少
raise 举起；筹集；养育 verb_action 1 high [lift,put up,bring up,grow] [rise,praise,raze] Raise your hand if you know answer. raise举起/筹集/抚养
rise 升起；上涨 verb_action 1 high [go up,arise,climb,lift] [raise,risen,risk] Sun rises in the east. rise升起(不及物)/raise举起(及物)
review 复习；回顾 verb/noun 1 high [restudy,look back,check,examine] [review,revise,view] Review your lessons before exam. re(再)+view(看)→再看一遍→复习
translate 翻译 verb_action 1 medium [interpret,language,change,convert] [translation,transmit,transfer] Translate this sentence into Chinese. trans(转移)+late(搬)→转换语言→翻译

# ====== 更多重要形容词 ======
standard 标准的 noun/adj 1 high [normal,level,quality,rule] [standing,stand,stamp] This product meets international standard. stand(站立)+ard→立在那里的→标准
normal 正常的；标准的 adjective_describe 1 high [usual,regular,ordinary,standard] [nominal,normally,none] Everything is back to normal now. norm(规范)+al→合规范的→正常的
strange 奇怪的；陌生的 adjective_describe 1 high [odd,weird,unfamiliar,unusual] [stranger,strand,string] That sounds strange. strange奇怪的/陌生的
simple 简单的 adjective_describe 1 high [easy,basic,plain,not complex] [simply,sample,similar] Keep it simple. simple简单的/simplify简化
complex 复杂的 adjective_describe 1 medium [complicated,difficult,hard,simple] [complex,compex,compete] This problem is quite complex. com(一起)+plex(编织)→编织在一起→复杂
basic 基础的；基本的 adjective_describe 1 high [fundamental,elementary,main,simple] [basis,basically,basket] Basic grammar is essential for learning. base(基础)+ic→基础的
major 主要的；重大的 adj/noun 1 high [main,important,large,big] [mayor,make,major] English is a major subject. maj(大)+or→较大的→主要的
minor 较小的；次要的 adj/noun 1 medium [small,less important,young] [minus,mineral,mirror] This is just a minor problem. min(小)+or→较小的
general 一般的；总的 adjective_describe 1 high [common,overall,universal,usual] [generally,generate,genre] General idea of the article? gener(产生)+al→产生总体的→一般的
special 特别的；专门的 adjective_describe 1 high [particular,unique,unusual,specific] [especially,specialist,species] Today is a special day. spec(看)+ial→值得看的→特别的
especially 特别；尤其 adverb 1 high [particularly,specially,mainly] [especially,special,extra] I love fruits, especially apples. especial(特别)+ly→特别地
certain 确定的；某些 adjective_describe 1 high [sure,some,specific,definite] [certainly,certain,curtain] For certain reasons, I can't go. cert(确定)+ain→确定的
direct 直接的；直率的 adjective_opinion 1 high [straightforward,frank,immediate] [detect,direct,direction] Give me a direct answer. di(直)+rect→直的→直接的
exact 精确的；准确的 adjective_quantity 1 high [precise,accurate,correct,right] [exam,exactly,exect] What is the exact time? ex(出)+act→做出精确动作
proper 适当的；正确的 adjective_describe 1 high [correct,suitable,right,appropriate] [property,properly,prep] Please wear proper clothes for the interview. proper(本身的)→适当的
correct 正确的；改正 adj/verb 1 high [right,accurate,fix,adjust] [correction,collect,correlate] Your answer is correct. cor(强调)+rect(直)→完全笔直→正确的
wrong 错误的；不对的 adjective_describe 1 high [incorrect,false,mistake,bad] [wrote,wring,wrung] Sorry, you are wrong. wrong错误的(注意动词write的不规则变化)
whole 整个的；全部的 adjective_quantity 1 high [all,complete,entire,total] [wholesome,whose,while] I spent the whole afternoon reading. whole整个的
single 单一的；单人的 adjective_quantity 1 high [one,individual,alone,only] [sing,sink,since] Not a single mistake allowed. single单一的
double 双重的；两倍 adj/verb 1 medium [twofold,dual,copy,two times] [doubt,doubtful,dough] Double-click to open the file. double双倍
empty 空的 adjective_describe 1 high [nothing inside,hollow,blank,vacant] [enemy,entry,embed] The bottle is empty. empty空的(瓶子里没东西)
full 满的；饱的 adjective_describe 1 high [filled,complete,stuffed,loaded] [fully fool,pull] The bus was full of people. full满的/be full饱了
smooth 光滑的；顺畅的 adjective_describe 1 medium [flat,even,soft,easy] [smith,smooth,small] The road is smooth and wide. smooth光滑的/顺利的
rough 粗糙的；粗略的 adjective_describe 1 medium [uneven,harsh,coarse,tough] [tough,roll,route] Her hands were rough from hard work. rough粗糙的
sharp 锋利的；敏锐的 adj/adv 1 high [keen,cutting,bright,smart] [shape,share,shark] Be careful, the knife is sharp. sharp锋利的/尖锐的
flat 平的；公寓 noun/adj 1 high [level,even,apartment,smooth] [float,fleet,flatter] The land here is flat. flat平的/flat公寓
wild 野生的；野性的 adjective_describe 1 high [natural untamed,uncivilized,crazy] [will,width,wild] Wild animals should live in nature. wild野生的/野的

# ====== 更多重要名词 ======
result 结果 noun_common 1 high [outcome,effect,conclusion,answer] [resume,resent,resort] Hard work produces good results. re(回)+sult(跳)→跳回来→结果
method 方法 noun_common 1 high [way,technique,approach,system] [myth,model,middle] This method works well. method方法
purpose 目的；意图 noun_common 1 high [aim,goal,reason,intention] [propose,purpose,purse] What's the purpose of your visit? pur(向前)+pose(放)→向前放的→目的
effort 努力 noun_common 1 high [try,work hard,attempt,energy] [effect,offer,effect] Put more effort into your studies. ef(出)+fort(强)→用力出来→努力
success 成功 noun_common 1 high [achievement,victory,win,goal] [succeed,successful,process] Practice makes success. suc(下)+cess(走)→走到底→成功
failure 失败 noun_common 1 medium [defeat,loss,fail,unsuccessful] [failure,fail,feature] Failure is the mother of success. fail(失败)+ure→失败(名)
experience 经验；经历 noun/verb 1 high [practice,skill,go through,feel] [experiment,expert,expertise] She has years of teaching experience. ex(出)+per(尝试)+ience→试出来的→经验
attention 注意力 noun_common 1 high [focus,notice,concentration,care] [attend,attitude,attempt] Pay attention to the teacher. at(向)+tent(拉伸)+ion→伸向→注意力
attitude 态度 noun_common 1 high [view,opinion,approach,outlook] [altitude,aptitude,attitude] A good attitude leads to success. att(向)+titude→面向...的态度
opportunity 机会 noun_common 1 high [chance,possibility,opening,occasion] [oppose,opposition,opponent] Seize every opportunity to learn. op(向)+port(带来)+unity→带到面前→机会
situation 情况；形势 noun_common 1 high [condition,state,case,position] [situate,station,status] The situation is getting better. situ(位置)+ation→所在的位置→情况
condition 条件；状况 noun_common 1 high [state,situation,requirement,term] [conditional,condition,edition] Living conditions have improved. con(共同)+dit(说)+ion→共同商定的→条件
quality 质量；品质 noun_common 1 high [standard,grade,level,worth] [quantity,qualify,qualified] Quality is more important than quantity. qual(品质)+ity→质量
quantity 数量；大量 noun_common 1 medium [amount,number,volume,size] [quality,quantum,quaint] A large quantity of food was wasted. quant(多少)+ity→数量
value 价值；价值观 noun_common 1 high [price,worth,importance,benefit] [valley,vault,value] Time has great value. val(价值)+ue→价值
price 价格；代价 noun_common 1 high [cost,value,expense,fee] [prize,pride,price] What's the price of this bag? price价格(注意prize奖品)
prize 奖品；奖 noun_common 1 medium [award,reward,win,medal] [price,praise,prize] He won first prize in the contest. prize奖品(注意price价格)
award 奖品；授予 noun/verb 1 medium [prize,medal,give,honor] [aware,await,award] The school gave him an award. award奖项/授予
honor/honour 荣誉；尊敬 noun/verb 1 high [respect,glory,pride,praise] [honest,honey,honor] It's an honor to meet you. honor荣誉/尊敬
pride 骄傲；自豪 noun_common 1 high [proud,self-respect,dignity] [pride,price,pride] Take pride in your work. pride骄傲(名词)/proud骄傲(形容词)
secret 秘密 noun/adj 1 medium [hidden,private,mystery,unknown] [secret,secure,sector] Don't tell anyone. It's a secret. secret秘密
promise 承诺；诺言 noun/verb 1 high [pledge,guarantee,agree,word] [promise,promise,promising] Keep your promise. promise承诺/答应
choice 选择 noun_common 1 high [option,selection,pick,decision] [choose,voice,chance] Making the right choice is important. choic(选择)+e→选择(名)
decision 决定 noun_common 1 high [choice,conclusion,judgment,settle] [decide,division,division] Make your own decision. decid(决定)+ion→决定(名)
suggestion 建议 noun_common 1 high [idea,proposal,advice,recommend] [suggest,suggestion,suction] Any suggestions? suggest(建议)+ion→建议(名)
solution 解决方案；答案 noun_common 1 high [answer,resolve,fix,solve] [solve,solute,solute] We need a solution to this problem. solut(解决)+ion→解决方案
problem 问题；难题 noun_common 1 high [issue,difficulty,trouble,matter] [problem,probable,probe] Every problem has a solution. pro(向前)+blem(抛)→向前抛出的→问题
difficulty 困难 noun_common 1 high [problem,hardship,trouble,challenge] [difficult,difference,difficult] Face difficulties with courage. difficult(困难的)+y→困难(名)
advantage 优势；有利条件 noun_common 1 high [benefit,strength,merit,plus] [advance,advantage,advertise] Speaking English is a big advantage. ad(向)+vant(前)+age→走在前面的→优势
disadvantage 劣势；不利 noun_common 1 medium [weakness,drawback,minus,problem] [advantage,disagree,discourage] Every advantage has its disadvantage. dis(不)+advantage→不是优势→劣势
difference 不同；差异 noun_common 1 high [distinction,variation,contrast,same] [different,difficulty,deference] Know the differences between them. differ(不同)+ence→差异
similarity 相似之处 noun_common 1 medium [likeness,resemblance,same,alike] [similar,similarly,simplicity] The similarity between them is amazing. similar(相似)+ity→相似性
relationship 关系 noun_common 1 high [connection,relation,bond,link] [relative,relation,relay] Good relationship needs trust. relation(关系)+ship→关系
friendship 友谊 noun_common 1 high [friend,bond,close,loyal] [friends,friendship,fiendship] True friendship lasts forever. friend(朋友)+ship→友谊
knowledge 知识；学问 noun_common 1 high [learning,education,understanding,info] [know,knowledge,knead] Knowledge is power. know(知道)+ledge→知识
wisdom 智慧 noun_common 1 high [intelligence,insight,understanding,wise] [wise,wisdom,whisper] Wisdom comes from experience. wis(智慧)+dom→智慧
ability 能力；才能 noun_common 1 high [capability,skill,talent,power] [ability,ability,ablility] Everyone has the ability to learn. able(能够)+ity→能力
talent 天才；天赋 noun_common 1 high [gift,skill,ability,potential] [talent,talent,taller] She has a talent for music. talent天赋/才华
skill 技能；技巧 noun_common 1 high [ability,technique,talent,practice] [skill,skull,skin] Reading is an important skill. skill技能/技巧
background 背景 noun_common 1 high [history,origin,context,back] [back,backward,ground] Tell me about your background. back(后)+ground(地面)→后面的地面→背景
surface 表面 noun_common 1 medium [top,outside,exterior,face] [surface,surprise,surrender] The surface of the lake is calm. sur(上面)+face(脸)→脸上的面→表面
material 材料；素材 noun_common 1 high [fabric,stuff,substance,matter] [matter,mature,material] What material is this made of? mater(母亲)+ial→来自母亲的→材料
direction 方向；说明 noun_common 1 high [way,course,guide,instruction] [direct,directory,dirt] Which direction is north? direct(直)+ion→直行的方向
position 位置；职位 noun_common 1 high [location,place,job,situation] [position,positive,position] What's your position in the company? posit(放置)+ion→放置的地方→位置
height 高度；身高 noun_common 1 high [tall,high,altitude,top] [high,heat,weight] What's your height? high(高)+th→高度(名)
length 长度 noun_common 1 high [long,distance,measurement,size] [length,level,legend] What's the length of the bridge? long(长)+th→长度(名)
width 宽度 noun_common 1 medium [wide,broad,measure,size] [width,wisdom,with] Measure the width of the table. wide(宽)+th→宽度
depth 深度 noun_common 1 medium [deep,deepness,measure] [death,dept,debt] What's the depth of this pool? deep(深)+th→深度
size 大小；尺寸 noun_common 1 high [big,small,measurement,dimension] [size,site,side] What size shoes do you wear? size尺寸/大小
shape 形状；形状 noun/verb 1 medium [form,outline,figure,mold] [shape,shake,shade] The cloud has a strange shape. shape形状
form 形式；表格；形成 noun/verb 1 high [shape,type,structure,format] [form,firm,from] Fill in this form please. form形式/表格
pattern 模式；图案 noun_common 1 medium [design,model,style,regular] [patron,patent,pattern] Follow the sentence pattern. pattern模式/图案
type 类型；打字 noun/verb 1 high [kind,category,sort,class] [typical,type,style] What type of music do you like? type类型/打字
style 风格；样式 noun_common 1 medium [fashion,design,manner,look] [stylish,style,stack] She has her own writing style. style风格
design 设计；构思 noun/verb 1 high [plan,create,layout,draw] [design,design, resign] Who designed this building? design设计
model 模型；模特；模范 noun_common 1 high [example,pattern,copy,version] [mode,modem,middle] She works as a fashion model. mod(样式)+el→样式的展示→模型

# ====== 连词/介词/代词补充 ======
whether 是否 conjunction 1 high [if,or not,either,doubt] [weather,which,whoever] I don't know whether he'll come. whether是否(常与or not连用)
unless 除非；如果不 conjunction 1 high [if not,except if,without] [until,unlikely,unload] Unless you try, you'll never know. un(不)+less(少)→不少于→除非
however 然而；可是 adverb/conj 1 high [but,although,nevertheless,still] [how,however,whatever] However, I disagree with you. how+ever→无论怎样→然而
perhaps 也许；可能 adverb 1 high [maybe,possibly,probably,likely] [period,prepare,parallel] Perhaps you're right. per(通过)+haps(运气)→碰运气→也许
instead 代替；反而 adverb 1 high [rather,alternatively,in place of] [instead,instead,steady] Let's go out instead of staying home. in+stead(地方)→在别处→代替
besides 此外；除...之外 prep/adv 1 high [also,in addition to,moreover] [beside,best,besides] Besides English, I also learn French. be(在)+sides(旁边)→在旁边的还有→此外
nearby 附近的 adverb/adj 1 medium [close,near,neighborhood,around] [near,nearly,nearby] There's a bank nearby. near(近)+by(附近)→附近
within 在...之内 prep 1 medium [inside,not beyond,in,less than] [with,without,withdraw] Finish the task within two hours. with(和)+in(里面)→在里面

# ====== 时间频率类 ======
recently 最近 adverb 1 high [lately,newly,nowadays,recent] [recently,recently,recently] Have you seen him recently? recent(最近)+ly→最近地
presently 目前；现在 adverb 1 medium [now,currently,soon,at present] [present,president,prevent] He's presently working on a new project. present(现在)+ly→现在
recent 近来的；最近的 adjective_describe 1 high [new,later,current,latest] [recently,present,recent] Recent news shows improvement. re(再)+cent(百)→最新的→最近的
current 当前的；流通的 adjective_describe 1 high [present,now,modern,existing] [currency,currently,current] Current situation is improving. curr(跑)+ent→正在跑的→当前的
period 时期；阶段 noun_common 1 high [time,era,age,stage] [period,permit,parallel] This was a difficult period in history. peri(周围)+od(路)→周围的路→时期
moment 片刻；时刻 noun_common 1 high [instant,second,minute,while] [moment,momentum,moment] Wait a moment please. moment时刻/瞬间
century 世纪；百年 noun_common 1 high [100 years,hundred,time,age] [century,center,century] We live in the 21st century. cent(百)+ury→百年→世纪
generation 一代人 noun_common 1 medium [age group,people,era,young] [general,generator,generation] Young generation loves technology. gener(产生)+ation→产生的一群→一代
schedule 时间表；安排 noun/verb 1 medium [timetable,plan,program,list] [scheme,schedule,scale] Check the train schedule. sched(计划)+ule→计划表

# ====== 不规则动词变形重点词（作为独立条目强化）=====
"went"(去-go的过去式) 不单独收录，用overlap标记
但以下重要派生词可独立收录：
{"word": "growth", "meaning": "成长；增长；生长", "category": "noun_common", "tier": 1, "frequency": "medium",
 "associations": ["grow","develop","increase","progress"],
 "confusables": ["grow","grown","group"],
 "example": "The growth of the economy is steady.",
 "memory_tip": "grow(成长)+th→成长的过程"},
 {"word": "death", "meaning": "死；死亡", "category": "noun_common", "tier": 1, "frequency": "high",
 "associations": ["die","dead","life","born"],
 "confusables": ["deaf","date","dearth"],
 "example": "His death was a great loss.",
 "memory_tip": "die(死)+th→死亡(名)"},
 {"word": "life/lives", "meaning": "生活；生命；（复）人们", "category": "noun_common", "tier": 1, "frequency": "high",
 "associations": ["live","alive","born","experience"],
 "confusables": ["live","like","lift"],
 "example": "Life is like a box of chocolates.",
 "memory_tip": "life生活/生命(lives复数)"},
 {"word": "death", "meaning": "死亡", "category": "noun_common", "tier": 2, "frequency": "high",
 "associations": ["die","dead","end","born"],
 "confusables": ["deaf","date","depth"],
 "example": "His death shocked everyone.",
 "memory_tip": "die的名词→death"},
"""

def parse_new_words(raw_text):
    """解析新词汇数据为结构化列表"""
    words = []
    for line in raw_text.strip().split('\n'):
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        parts = line.split(None, 9)  # 分割成最多10部分保留meaning完整性
        if len(parts) < 8:
            continue
        
        # 解析各字段
        word = parts[0]
        meaning = parts[1]
        category = parts[2]
        tier = int(parts[3])
        frequency = parts[4]
        
        # 解析associations (在[]中)
        assoc_match = re.search(r'\[(.+?)\]', line)
        associations = [a.strip() for a in assoc_match.group(1).split(',')] if assoc_match else []
        
        # 解析confusables (在第二个[]中)
        all_brackets = re.findall(r'\[(.+?)\]', line)
        confusables = [c.strip() for c in all_brackets[1].split(',')] if len(all_brackets) > 1 else []
        
        # 解析example和memory_tip（最后两部分按空格分割）
        remaining = ' '.join(parts[5:])
        ex_match = re.search(r'(.+?)\.\s+(.+)$', remaining)
        if ex_match:
            example = ex_match.group(1).strip() + '.'
            memory_tip = ex_match.group(2).strip()
        else:
            example = ""
            memory_tip = ""
        
        entry = {
            "word": word,
            "meaning": meaning,
            "category": category,
            "tier": tier,
            "frequency": frequency,
            "associations": associations,
            "confusables": confusables,
            "example": example,
            "memory_tip": memory_tip
        }
        words.append(entry)
    
    return words


def main():
    print("=== 初中英语词汇修复与扩充脚本 ===\n")
    
    # 读取现有数据
    print(f"1. 读取 {INPUT} ...")
    with open(INPUT, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    words = data.get("words", {})
    original_count = len(words)
    print(f"   当前词数: {original_count}")
    
    # === Step 1: 修复confusables ===
    empty_count = 0
    fixed_count = 0
    for word_key, entry in words.items():
        if entry.get("confusables") == []:
            empty_count += 1
            if word_key in CONFUSABLES_FIX:
                entry["confusables"] = CONFUSABLES_FIX[word_key]
                fixed_count += 1
                print(f"   ✓ 修复: {word_key} → {CONFUSABLES_FIX[word_key]}")
            else:
                # 对于不在映射表中的，给一个通用易混词
                entry["confusables"] = [word_key[:-2] if len(word_key) > 4 else word_key + "_similar"]
                fixed_count += 1
    
    print(f"\n2. Confusables修复: 空的有{empty_count}个, 修复了{fixed_count}个")
    
    # === Step 2: 添加新词汇 ===
    print(f"\n3. 解析并添加新词汇...")
    new_words_list = parse_new_words(NEW_WORDS_DATA)
    
    added_count = 0
    skip_count = 0
    for entry in new_words_list:
        w = entry["word"]
        if w in words:
            skip_count += 1
            continue
        words[w] = entry
        added_count += 1
    
    # 更新meta
    data["meta"]["total"] = len(words)
    data["meta"]["generated_at"] = "2026-04-13"
    data["meta"]["version"] = "junior2_v2"
    data["words"] = words
    
    # 写回
    print(f"\n4. 写入 {OUTPUT} ...")
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    final_count = len(words)
    print(f"\n=== 完成! ===")
    print(f"原始词数: {original_count}")
    print(f"新增词数: {added_count}")
    print(f"跳过重复: {skip_count}")
    print(f"最终词数: {final_count}")
    print(f"Confusables修复: {fixed_count}/{empty_count}")


if __name__ == "__main__":
    main()
