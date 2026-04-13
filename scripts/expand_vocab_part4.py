#!/usr/bin/env python3
"""扩充词汇 Part 4: 最终批次，补齐到约1600词"""
import json

INPUT = OUTPUT = "/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/words_network_j2.json"

def e(word, meaning, cat, tier, freq, assocs, confus, ex, tip):
    return {"word":word,"meaning":meaning,"category":cat,"tier":tier,"frequency":freq,
            "associations":assocs,"confusables":confus,"example":ex,"memory_tip":tip}

NEW = []

# ====== 更多名词补充 ======
NEW += [
e("schedule","时间表；日程安排","noun_common",1,"medium",["timetable","program","plan","list"],["scheme","school"],"Check train schedule.","sched计划+ule→计划表"),
e("material","材料；素材；原料","noun_common",1,"high",["fabric","stuff","substance","matter"],["matter","mature","meet"],"What material this made of?","mater母亲+ial→来自母体→材料"),
e("surface","表面；外表","noun_common",1,"medium",["top","outside","exterior","face"],["surprise","service"],"Surface of lake calm.","sur上面+face→上面的脸→表面"),
e("direction","方向；说明","noun_common",1,"high",["way","course","guide","instruction"],["direct","directory","dirt"],"Which direction north?","direct直+ion直行方向"),
e("position","位置；职位","noun_common",1,"high",["location","place","job","situation"],["positive","position"],"What position company?","posit放置+ion放置处"),
e("height","高度；身高","noun_common",1,"high",["tall","high","altitude","top"],["heat","weight"],"What height?","high高+th高度名"),
e("length","长度","noun_common",1,"high",["long","distance","measurement","size"],["level","legend"],"What length bridge?","long长+th长度名"),
e("width","宽度","noun_common",1,"medium",["wide","breadth","measure","size"],["with"],"Measure width table.","wide宽+th宽度"),
e("depth","深度","noun_common",1,"medium",["deep","deepness","measure"],["death","dept"],"What depth pool?","deep深+th深度"),
e("shape","形状；形状","noun/verb",1,"medium",["form","outline","figure","mold"],["shake","shade"],"Cloud strange shape.","shape形状"),
e("form","形式；表格；形成","noun/verb",1,"high",["shape","type","structure","format"],["firm","from","fortFill form please.","form形式/表格"),
e("pattern","模式；图案","noun_common",1,"medium",["design","model","style","regular"],["patron","patent"],"Follow sentence pattern.","pattern模式/图案"),
e("type","类型；打字","noun/verb",1,"high",["kind","category","sort","class"],["typical","style"],"What type music like?","type类型/打字"),
e("style","风格；样式","noun_common",1,"medium",["fashion","design","manner","look"],["stylish","stack","study"],"She own writing style.","style风格"),
e("design","设计；构思","noun/verb",1,"high",["plan","create","layout","draw"],"[]","Who designed building?","design设计"),
e("model","模型；模范","noun_common",1,"high",["example","pattern","copy","version"],["mode","modem","middle"],"She fashion model.","mod样式+el模型"),
e("background","背景","noun_common",1,"high",["history","origin","context","back"],["back","backward","ground"],"Tell about background.","back后+ground地面→背景"),
e("power","力量；权力；电力","noun_common",1,"high",["strength","energy","ability","force"],["powder","poor"],"Knowledge power.","pow能力+er力量"),
e("speed","速度；加速","noun/verb",1,"high",["velocity","fast","rate","quickly"],["spend","seed","spellSpeed limit 60 km/h.","spee+d速度"),
e("force","力量；强迫","noun/verb",1,"high",["power","strength","make","coerce"],["ford","forecast"],"Don't force him do it.","forc力量→强迫"),
e("level","水平；级别；楼层","noun_common",1,"high",["standard","rank","stage","grade"],["leave","lever"],"What English level?","lev举起→举到的高度→水平"),
e("quality","质量；品质","noun_common",1,"high",["standard","grade","worth","value"],"[]","Quality more important quantity.","qual品质+ity质量"),
e("quantity","数量","noun_common",1,"medium",["amount","number","volume","size"],"[]","Large quantity wasted.","quant多少+ity数量"),
e("value","价值；价值观","noun_common",1,"high",["price","worth","importance","benefit"],"[]","Time great value.","val价值+ue价值"),
e("price","价格；代价","noun_common",1,"high",["cost","expense","fee","value"],"[]","What price bag?","price价格(注意prize奖品)"),
e("prize","奖品；奖","noun_common",1,"medium",["award","reward","win","medal"],"[]","Won first prize contest.","prize奖品(vs price价)"),
e("award","奖品；授予","noun/verb",1,"medium",["prize","medal","give","honor"],"[]","School gave him award.","award奖项/授予"),
e("honor/honour","荣誉；尊敬","noun/verb",1,"high",["respect","glory","pride","pride"],"[]","Honor meet you.","honor荣誉/尊敬"),
e("pride","骄傲；自豪","noun_common",1,"high",["proud","self-respect","dignity"],"[]","Take pride your work.","pride骄傲(名词)vs proud(形容词)"),
e("secret","秘密","noun/adj",1,"medium",["hidden","private","mystery","unknown"],"[]","Dont tell anyone secret.","secret秘密"),
e("promise","承诺；诺言","noun/verb",1,"high",["pledge","guarantee","agree","word"],"[]","Keep your promise.","promise承诺/答应"),
e("choice","选择","noun_common",1,"high",["option","selection","pick","decision"],"[]","Making right choice important.","choic选择+e选择(名)"),
e("decision","决定","noun_common",1,"high",["choice","conclusion","judgment","settle"],"[]","Make own decision.","decid决定+ion决定(名)"),
e("suggestion","建议","noun_common",1,"high",["idea","proposal","advice","recommend"],"[]","Any suggestions?","suggest建议+ion建议(名)"),
e("solution","解决方案；答案","noun_common",1,"high",["answer","resolve","fix","solve"],"[]","Need solution this problem.","solut解决+ion方案"),
e("problem","问题；难题","noun_common",1,"high",["issue","difficulty","trouble","matter"],"[]","Every problem has solution.","pro向前+blem抛出→问题"),
e("difficulty","困难","noun_common",1,"high",["problem","hardship","trouble","challenge"],"[]","Face difficulties courage.","difficult困难的+y困难(名)"),
e("advantage","优势；有利条件","noun_common",1,"high",["benefit","strength","merit","plus"],"[]","Speaking English big advantage.","ad向+vant前+age走在前面→优势"),
e("disadvantage","劣势；不利","noun_common",1,"medium",["weakness","drawback","minus","problem"],"[]","Every advantage has disadvantage.","dis不+advantage非优势→劣势"),
e("difference","不同；差异","noun_common",1,"high",["distinction","variation","contrast","same"],"[]","Know differences between them.","differ不同+ence差异"),
e("relationship","关系","noun_common",1,"high",["connection","relation","bond","link"],"[]","Good relationship needs trust.","relation关系+ship关系"),
e("friendship","友谊","noun_common",1,"high",["friend","bond","close","loyal"],"[]","True friendship lasts forever.","friend朋友+ship友谊"),
e("knowledge","知识；学问","noun_common",1,"high",["learning","education","understanding","info"],"[]","Knowledge power.","know知道+ledge知识"),
e("wisdom","智慧","noun_common",1,"high",["intelligence","insight","understanding","wise"],"[]","Wisdom comes experience.","wis智慧+dom智慧"),
e("ability","能力；才能","noun_common",1,"high",["capability","skill","talent","power"],"[]","Everyone has ability learn.","able能+ity能力"),
e("talent","天才；天赋","noun_common",1,"high",["gift","skill","ability","potential"],"[]","She talent for music.","talent天赋/才华"),
e("skill","技能；技巧","noun_common",1,"high",["ability","technique","talent","practice"],"[]","Reading important skill.","skill技能/技巧"),
e("growth","成长；增长","noun_common",1,"medium",["grow","develop","increase","progress"],"[]","Growth economy steady.","grow成长+th过程"),
e("death","死；死亡","noun_common",1,"high",["die","dead","life","born"],"[]","His death great loss.","die死+th死亡(名)"),
e("life/lives","生活；生命；人们","noun_common",1,"high",["live","alive","born","experience"],"[]","Life like box chocolates.","life生活/生命lives复"),
]

# ====== 更多形容词 ======
NEW += [
e("active","积极的；活跃的","adjective_describe",1,"high",["energetic","lively","busy","dynamic"],"[]","Stay active and healthy.","act行动+ive→活跃"),
e("passive","被动的；消极的","adjective_describe",1,"medium",["inactive","unenthusiastic","quiet"],"[]","Dont be passive take action.","pass接受+ive→被动"),
e("positive","积极的；正面的；肯定的","adjective_opinion",1,"high",["optimistic","good","certain","sure"],"[]","Keep positive attitude.","posit位置+ive→摆好位置→积极"),
e("negative","消极的；负面的","adjective_opinion",1,"medium",["pessimistic","bad","uncertain","no"],"[]","Dont be negative about future.","neg否认+ive→否定的"),
e("native","本地的；土生的","adjective_describe",1,"medium",["local","born","indigenous","original"],"[]","He is native speaker English.","nat出生+ive→本地生"),
e("local","当地的；局部的","adjective_describe",1,"high",["nearby","regional","area","neighborhood"],"[]","Go to local hospital.","loc地方+al→地方的"),
e("physical","身体的；物理的","adjective_describe",1,"high",["body","sport","exercise","material"],"[]","Physical education important.","phys身体+ical→身体的"),
e("mental","精神的；脑力的","adjective_describe",1,"medium",["mind","brain","psychological","emotional"],"[]","Mental health as important physical.","men头脑+al→精神的"),
e("global","全球的；总的","adjective_describe",1,"high",["worldwide","international","planet","earth"],"[]","Global warming serious problem.","glob球+al→全球的"),
e("total","总计的；完全的","adjective_quantity",1,"high",["whole","complete","all","entire"],"[]","What total cost?","tot全部+al"),
e("extra","额外的；特级的","adjective_describe",1,"medium",["additional","more","special","bonus"],"[]","Want extra cheese?","ex出+tra超→超出→额外"),
e("ordinary","普通的；平常的","adjective_describe",1,"high",["normal","common","regular","average"],"[]","Just ordinary day.","ordin顺序+ary有顺序→普通"),
e("common","共同的；常见的","adjective_describe",1,"high",["usual","shared","general","public"],"[]","This is common mistake.","com共同+mon→共有的"),
e("rare","罕见的；稀少的","adjective_describe",1,"medium",["uncommon","scarce","unusual","few"],"[]","It is rare see snow here.","rare稀少/rarely很少"),
e("similar","相似的；类似的","adjective_describe",1,"high",["alike","same","like","resemble"],"[]","The two houses are similar.","same相同+ilar类似"),
e("familiar","熟悉的","adjective_describe",1,"high",["known","well-known","recognized","accustomed"],"[]","His face looks familiar.","famil家庭+iar→像家人→熟悉"),
e("particular","特别的；特定的","adjective_describe",1,"high",["specific","special","certain","exact"],"[]","Is there particular reason?","part部分+icular属于某部分"),
e("various","各种各样的","adjective_describe",1,"high",["different","many","diverse","several"],"[]","There are various ways to solve it.","vari变化+ous多变的"),
e("obvious","明显的；显然的","adjective_describe",1,"high",["clear","evident","plain","apparent"],"[]","It is obvious that he is lying.","obvi阻挡+ou→挡不住→明显"),
e("main","主要的","adjective_describe",1,"high",["chief","primary","major","key"],"[]","What is the main idea?","main主要本身"),
e("pure","纯净的；纯真的","adjective_describe",1,"medium",["clean","clear","unmixed","simple"],"[]","The air is pure in mountains.","pur清洁+e→纯净"),
e("steady","稳固的","adjective_describe",1,"medium",["stable","firm","constant","regular"],"[]","Make steady progress.","stead站+y→站稳→稳固"),
e("strict","严格的；严厉的","adjective_describe",1,"medium",["severe","harsh","tough","demanding"],"[]","My dad is very strict.","strict严格"),
e("gentle","温和的；温柔的；轻柔的","adjective_describe",1,"high",["soft","mild","tender","kind"],"[]","Be gentle with the cat.","gentle温柔"),
e("gentle","温和的(重复应删除)","adjective_describe",1,"high",["soft","mild","tender","kind"],[],"Be gentle with younger kids.","gentle温和"),
e("lazy","懒惰的","adjective_describe",1,"high",["idle","inactive","slow","unwilling"],"[]","Don't be lazy! Do your homework.","lazy懒"),
e("smart","聪明的；机灵的；漂亮的","adjective_describe",1,"high",["clever","intelligent","bright","wise"],"[]","She gave a smart answer.","smart聪明"),
e("stupid","愚蠢的","adjective_describe",1,"medium",["foolish","silly","dumb","idiotic"],"[]","That was a stupid mistake.","stupid愚蠢"),
e("silly","傻的；无聊的","adjective_describe",1,"medium",["foolish","crazy","funny","stupid"],"[]","Don't be silly!","silly傻"),
e("crazy","疯狂的；狂热的","adjective_describe",1,"high",["mad","insane","wild","enthusiastic"],"[]","Are you crazy?!","crazy疯狂"),
e("mad","疯的；生气的；极好的","adjective_describe",1,"high",["angry","crazy","insane","furious"],"[]","He went mad with anger.","mad疯了/生气"),
e("angry","生气的；愤怒的","adjective_describe",1,"high",["mad","furious","annoyed","upset"],"[]","Why are you so angry?","angry生气"),
e("glad","高兴的；乐意的","adjective_describe",1,"high",["happy","pleased","delighted","joyful"],"[]","I'm so glad to see you!","glad高兴"),
e("pleasant","令人愉快的；友好的","adjective_describe",1,"high",["nice","agreeable","friendly","enjoyable"],"[]","Have a pleasant journey.","pleasant令人愉快"),
e("awful","可怕的；很坏的；非常的","adjective_describe",1,"high",["terrible","horrible","bad","dreadful"],"[]","The weather is awful today.","awful糟糕/可怕"),
e("terrible","可怕的；很糟的","adjective_describe",1,"high",["awful","horrible","bad","dreadful"],"[]","I had a terrible headache.","terrible可怕的/糟"),
e("horrible","可怕的；极讨厌的","adjective_describe",1,"medium",["awful","terrible","frightening"],"[]","That movie was horrible.","horrible可怕"),
e("favorite/favourite","最喜爱的","adj/noun",1,"high",["like best","prefer","most loved"],"[]","What's your favorite color?","favor喜爱+ite最"),
e("excellent","卓越的；极好的","adjective_opinion",1,"high",["outstanding","superb","great","fine"],"[]","His work is excellent.","excel杰出+ent→杰出的"),
e("fantastic","奇异的；极好的；很大的","adjective_describe",1,"high",["wonderful","great","marvelous","imaginary"],"[]","You did a fantastic job!","fantasy幻想+tic→奇异的"),
e("specific","具体的；特定的","adjective_describe",1,"high",["particular","certain","exact","precise"],"[]","Give me specific examples.","spec看+ific→可看的→具体的"),
e("correct","正确的；改正","adj/verb",1,"high",["right","accurate","fix","adjust"],"[]","Your answer is correct.","cor强调+rect笔直→正确"),
e("direct","直接的；直率的","adjective_opinion",1,"high",["straightforward","frank","immediate"],"[]","Give me a direct answer.","di直+rect直"),
]

# ====== 更多重要动词 ======
NEW += [
e("accept","接受；承认","verb_action",1,"high",["receive","take","agree","approve"],["except","expect","aspect"],"I accept your apology.","accep反复拿→接受"),
e("refuse","拒绝","verb_action",1,"high",["reject","decline","deny","say no"],"[]","He refused my invitation.","re回+fuse推回→拒绝"),
e("receive","收到；接待","verb_action",1,"high",["get","accept","obtain","welcome"],["believe","relieve","review"],"Did you receive my letter?","re回+ceive拿回来→收到"),
e("describe","描述；形容","verb_action",1,"high",["explain","tell about","portray","depict"],"[]","Can you describe the thief?","de下+scribe详细写→描述"),
e("allow","允许；准许","verb_action",1,"high",["permit","let","approve","authorize"],"[]","My parents don't allow smoking.","al向+low低→放低门槛→允许"),
e("encourage","鼓励","verb_action",1,"high",["support","inspire","motivate","urge"],"[]","Teachers encourage us study hard.","en使+courage给勇气→鼓励"),
e("remind","提醒；使想起","verb_action",1,"high",["remember","recall","notify","alert"],"[]","Remind me to call him back.","re再+mind头脑→再想→提醒"),
e("provide","提供；供应","verb_action",1,"high",["give","supply","offer","furnish"],"[]","School provides free lunch.","pro向前+vide看→提供"),
e("offer","提供；提议","verb/noun",1,"high",["give","propose","present","suggest"],"[]","They offered me a job.","of向前+fer带→带到面前→提供"),
e("include","包括；包含","verb_action",1,"high",["contain","have","involve","consist of"],"[]","Price includes tax and service fee.","in内+clude关→关在内→包含"),
e("cover","覆盖；涵盖；报道","verb/noun",1,"high",["hide","protect","include","report"],"[]","Snow covered whole ground.","cover覆盖本身"),
e("determine","决定；确定","verb_action",1,"high",["decide","figure out","resolve","conclude"],"[]","We need to determine the best approach.","de去掉+termine边界→定下界限→决定"),
e("develop","发展；开发","verb_action",1,"high",["grow","improve","advance","create"],"[]","Country is developing fast.","de向下+velop包裹展开→发展"),
e("create","创造；创建","verb_action",1,"high",["make","produce","invent","design"],"[]","Artists create beautiful works.","crea生长+te创造出来"),
e("serve","服务；服役；端上","verb_action",1,"high",["help","work for","function","provide"],"[]","Breakfast is served from 7am to 10am.","serv服务+e→服务"),
e("save","拯救；节省；保存","verb/noun",1,"high",["rescue","keep store","help"],"[]","Save money for future.","save救/省/存"),
e("spend","花费；度过","verb_action",1,"high",["pay cost","use time","waste"],"[]","How much did you spend?","spend花费(spent-spent)"),
e("waste","浪费","verb/noun",1,"high",["squander","misuse","lose","throw away"],"[]","Don't waste food.","waste浪费"),
e("share","分享；分担","verb/noun",1,"high",["give part","distribute","divide","joint"],"[]","Share toys with friends.","share分享"),
e("spread","传播；伸展","verb/noun",1,"medium",["extend","scatter","expand","open spread"],"[]","News spreads quickly across country.","spread传播/伸展"),
e("reach","到达；达到；伸手","verb/noun",1,"high",["arrive","get","attain","extend stretch arm"],"[]","Call me when you reach the airport.","reach到达/伸到"),
e("touch","触摸；接触；感动","verb/noun",1,"high",["feel","contact","handle","move emotion"],"[]","Don't touch the exhibits in the museum.","touch触摸/触动"),
e("press","按；压；逼迫；新闻","verb/noun",1,"high",["push down","force","print","media"],"[]","Press the button to start machine.","press按压/新闻"),
e("shake","摇晃；握手；发抖","verb/noun",1,"high",["tremble","wave hand","shiver","shock"],"[]","Shake well before drinking.","shake摇晃/握手"),
e("pull","拉；拖；拔","verb_action",1,"high",["draw","tug","drag","attract strain"],"[]","Pull the door open; don't push it.","pull拉"),
e("push","推；推动；催促","verb_action",1,"high",["shove","press","force","drive urge"],"[]","Push the door and it opens outward.","push推"),
e("carry","携带；搬运；承载","verb_action",1,"high",["bring","take","hold","transport"],"[]","Let me carry your bag for you.","carry搬运/携带"),
e("lift","举起；抬起；电梯","verb/noun",1,"high",["raise up","elevate","hoist","give ride"],"[]","Can you help lift this box?","lift抬起/电梯"),
e("kick","踢","verb_action",1,"medium",["strike","foot hit","soccer ball"],"[]","He kicked the ball into the goal.","kick踢"),
e("beat","打败；敲打；（心）跳","verb/noun",1,"high",["hit","defeat","strike","win pulse"],"[]","Our team beat theirs 3 to 1.","beat打败/敲打/心跳"),
e("win","赢；获胜","verb/noun",1,"high",["victory","succeed","gain","triumph earn"],"[]","Practice makes perfect; you will win!","win赢(won-won)"),
e("lose","丢失；输；迷失","verb/noun",1,"high",["misplace","fail","defeat","miss gone loss loose"],"[]","Don't lose hope!","lose丢失/失败(lost-lost)"),
e("tie","系；平局；领带","verb/noun",1,"medium",["bind","knot","draw equal","necktie"],"[]","The game ended in a tie 2-2.","tie平局/系/领带"),
e("fit","适合；安装；健康的","adj/verb",1,"high",["suit","match","proper","healthy right size"],"[]","These shoes don't fit me well.","fit适合/安装/健康"),
e("match","比赛；匹配；相配","verb/noun",1,"high",["game","competition","pair","equal suit watch"],"[]","Watch the football match tonight.","match比赛/匹配"),
e("miss","想念；错过；未击中","verb/noun",1,"high",["long for","fail hit","lack lose miss"],"[]","I really miss my old friends.","miss想念/错过/未击中"),
e("notice","注意到；通知","verb/noun",1,"high",["observe","see spot","note","detect pay attention"],"[]","Did you notice her new haircut?","not注意+ice→通知化"),
e("wonder","想知道；奇迹；纳闷","verb/noun",1,"high",["want know","curious","miracle","amaze ponder wander won"],"[]","I wonder who she is.","wonder想知道/奇迹/纳闷"),
e("worry","担心；烦恼","verb/noun",1,"high",["anxious","concern","trouble fear upset angry wrong hurry"],"[]","Don't worry! Everything will be fine.","worry担心/烦恼/忧虑"),
]

# ====== 短语动词 ======
NEW += [
e("look after","照顾；照看","verb_phrasal",1,"high",["care for","take care of","watch protect look ahead look out"],"[]","Grandma looks after grandson.","look after=照顾"),
e("look for","寻找","verb_phrasal",1,"high",["search","seek","hunt","find look around looking for"],"[]","I'm looking for my lost keys.","look for=寻找"),
e("look out","小心；向外看","verb_phrasal",1,"high",["be careful","watch out beware look outside look out for"],"[]","Look out! A car is coming!","look out=小心/向外看"),
e("look forward to","期待；盼望","verb_phrasal",1,"high",["anticipate","expect","await hope for eager look forward looking forward to"],"[]","I look forward to seeing you again.","look forward to=期待盼望"),
e("look up","查阅；仰望；改善","verb_phrasal",1,"medium",["search dictionary check improve respect look up to look up"],"[]","Look up the new word in the dictionary.","look up=查阅/仰望"),
e("look through","浏览；快速查看","verb_phrasal",1,"medium",["browse","scan","glance review read quickly look through looked through"],"[]","Look through your notes before the exam.","look through=浏览"),
e("turn on","打开（电器）","verb_phrasal",1,"high",["switch on","start power operate turn on turn off turned on"],"[]","Turn on the light; it's too dark here.","turn on=打开电器"),
e("turn off","关闭（电器）","verb_phrasal",1,"high",["switch off","stop power shut down turn off turn on turned off"],"[]","Turn off the TV before you go to sleep.","turn off=关闭电器"),
e("turn down","拒绝；调小","verb_phrasal",1,"medium",["reject decline reduce volume refuse turn down turn up turned down"],"[]","He turned down the job offer.","turn down=拒绝/调小"),
e("turn up","出现；调大","verb_phrasal",1,"medium",["appear arrive increase volume show up turn up turn down turned up"],"[]","He turned up late for the meeting again.","turn up=出现/调大"),
e("put on","穿上；上演；增加","verb_phrasal",1,"high",["wear dress add weight perform put on put off put up put away put on"],"[]","Put on your coat; it's cold outside.","put on=穿上"),
e("take off","脱下；起飞","verb_phrasal",1,"high",["remove clothes plane depart leave take off took off taken off"],"[]","The plane will take off soon.","take off=脱下/飞机起飞"),
e("take place","发生；举行","verb_phrasal",1,"high",["happen occur be held organize take place took place taken place"],"[]","When does the wedding take place?","take place=发生/举行"),
e("break down","出故障；分解；崩溃","verb_phrasal",1,"medium",["fail malfunction collapse separate break down broke down broken down"],"[]","My car broke down on the highway.","break down=出故障/崩溃"),
e("carry on","继续；坚持","verb_phrasal",1,"medium",["continue persist keep going proceed carry on carried on carrying on"],"[]","Carry on despite all the difficulties.","carry on=继续/坚持"),
e("come across","偶然遇见；被发现","verb_phrasal",1,"medium",["meet by chance encounter find come across came across come across"],"[]","I came across an old photo today.","come across=偶然遇见"),
e("find out","查明；发现","verb_phrasal",1,"high",["discover learn figure out determine find out found out finding out"],"[]","The teacher found out who broke the window.","find out=查明/发现"),
e("get along (with)","相处；进展","verb_phrasal",1,"high",["relationship progress deal cope get along got along getting along with"],"[]","I get along well with all my classmates.","get along with=与...相处"),
e("go over","复习；仔细检查","verb_phrasal",1,"medium",["review examine check repeat go over went over going over go over"],"[]","Go over your answers before submitting them.","go over=复习/仔细检查"),
]

print(f"Reading {INPUT}...")
with open(INPUT,'r',encoding='utf-8') as f:
    data = json.load(f)

words = data["words"]
orig = len(words)
added = 0
skip = 0
for entry in NEW:
    w = entry["word"]
    if w in words:
        skip += 1
    else:
        words[w] = entry
        added += 1

data["meta"]["total"] = len(words)
data["meta"]["version"] = "junior2_v4-final"
data["words"] = words

with open(OUTPUT,'w',encoding='utf-8') as f:
    json.dump(data,f,ensure_ascii=False,indent=2)

print(f"\n=== Done! ===")
print(f"Original: {orig} | Added: {added} | Skipped(dup): {skip} | Final total: {len(words)}")
