#!/usr/bin/env python3
"""扩充词汇 Part 3: 形容词、动词、短语等"""
import json

INPUT = OUTPUT = "/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/words_network_j2.json"

def e(word, meaning, cat, tier, freq, assocs, confus, ex, tip):
    return {"word":word,"meaning":meaning,"category":cat,"tier":tier,"frequency":freq,
            "associations":assocs,"confusables":confus,"example":ex,"memory_tip":tip}

NEW = []

# ====== 彩容词 (19) ======
NEW += [
e("active","积极的；活跃的","adjective_describe",1,"high",["energetic","lively","busy"],["action","act"],"Stay active and healthy.","act行动+ive→活跃"),
e("passive","被动的；消极的","adjective_describe",1,"medium",["inactive","unenthusiastic"],["pass","passage"],"Don't be passive.","pass接受+ive→被动"),
e("positive","积极的；正面的；肯定的","adjective_opinion",1,"high",["optimistic","good","certain"],["position","possible"],"Keep positive attitude.","posit位置+ive→积极"),
e("negative","消极的；负面的","adjective_opinion",1,"medium",["pessimistic","bad","uncertain"],["neglect","negotiate"],"Don't be negative about future.","neg否认+ive→否定的"),
e("native","本地的；土生的","adjective_describe",1,"medium",["local","born","indigenous"],["nation","naive","nature"],"He is native speaker English.","nat出生+ive→本地生"),
e("local","当地的；局部的","adjective_describe",1,"high",["nearby","regional","area"],["location","lock"],"Go to local hospital.","loc地方+al→地方的"),
e("physical","身体的；物理的","adjective_describe",1,"high",["body","sport","exercise","material"],["physic","physician"],"Physical education important.","phys身体+ical→身体"),
e("mental","精神的；脑力的","adjective_describe",1,"medium",["mind","brain","psychological"],["metal","mention","rental"],"Mental health important physical.","men头脑+al→精神"),
e("global","全球的；总的","adjective_describe",1,"high",["worldwide","international","planet"],["globe","general","gold"],"Global warming serious problem.","glob球+al→全球"),
e("total","总计的；完全的","adjective_quantity",1,"high",["whole","complete","all","entire"],["totally","tunnel"],"What total cost?","tot全部+al"),
e("extra","额外的；特级的","adjective_describe",1,"medium",["additional","more","special"],["extreme","export","extract"],"Want extra cheese?","ex出+tra超→额外"),
e("ordinary","普通的；平常的","adjective_describe",1,"high",["normal","common","regular","average"],["organize","origin","ornament"],"Just ordinary day.","ordin顺序+ary→普通"),
e("common","共同的；常见的","adjective_describe",1,"high",["usual","shared","general","public"],["communicate","command","comment"],"Common mistake.","com共同+mon→共有"),
e("rare","罕见的；稀少的","adjective_describe",1,"medium",["uncommon","scarce","unusual","few"],["rarely","rate","rather"],"Rare see snow here.","rare稀少"),
e("similar","相似的；类似的","adjective_describe",1,"high",["alike","same","like","resemble"],["familiar","singular","smilear"],"Two houses similar.","same相同+ilar类似"),
e("familiar","熟悉的","adjective_describe",1,"high",["known","well-known","recognized","accustomed"],["family","factory","familiar"],"His face looks familiar.","famil家庭+iar→熟悉"),
e("particular","特别的；特定的","adjective_describe",1,"high",["specific","special","certain","exact"],["particularly","particle","partner"],"Particular reason?","part部分+icular属于某部分"),
e("various","各种各样的","adjective_describe",1,"high",["different","many","diverse","several"],["variety","vary","serious"],"Various ways solve problem.","vari变化+ous多变的"),
e("obvious","明显的；显然的","adjective_describe",1,"high",["clear","evident","plain","apparent"],["obviously","object","obtain"],"Obvious he lying.","obvi阻挡+ou→挡不住→明显"),
e("main","主要的","adjective_describe",1,"high",["chief","primary","major","key"],["maintain","man","many"],"Main idea paragraph?","main主要本身"),
e("pure","纯净的；纯真的","adjective_describe",1,"medium",["clean","clear","unmixed","simple"],["purpose","price","pair"],"Air pure mountains.","pur清洁+e→纯净"),
e("steady","稳固的","adjective_describe",1,"medium",["stable","firm","constant","regular"],["instead","steedy","study"],"Make steady progress.","stead站+y→站稳→稳固"),
]

# ====== 更多动词 (25) ======
NEW += [
e("accept","接受；承认","verb_action",1,"high",["receive","take","agree","approve"],["except","expect","aspect"],"I accept apology.","accep(t)+cept反复拿→接受"),
e("refuse","拒绝","verb_action",1,"high",["reject","decline","deny","say no"],["refuse","reuse"],"He refused invitation.","re回+fuse倒→推回→拒绝"),
e("receive","收到；接待","verb_action",1,"high",["get","accept","obtain","welcome"],["believe","relieve","review"],"Receive my letter?","re回+ceive拿→拿回"),
e("describe","描述；形容","verb_action",1,"high",["explain","tell about","portray","depict"],["description","desert","described"],"Describe thief?","de下+scribe写→详细写→描述"),
e("allow","允许；准许","verb_action",1,"high",["permit","let","approve","authorize"],["almost","alone","allow"],"Parents dont allow smoke.","al向+low低→放低→允许"),
e("encourage","鼓励","verb_action",1,"high",["support","inspire","motivate","urge"],["courage","courtage"],"Teachers encourage study.","en使+courage勇气→给勇气→鼓励"),
e("remind","提醒；使想起","verb_action",1,"high",["remember","recall","notify","alert"],["mind","remove","rewrite"],"Remind me call him back.","re再+mind头脑→再想→提醒"),
e("provide","提供；供应","verb_action",1,"high",["give","supply","offer","furnish"],["prove","protect","provide"],"School provides free lunch.","pro向前+vide看→提供"),
e("offer","提供；提议","verb/noun",1,"high",["give","propose","present","suggest"],["officer","office","offer"],"They offered me job.","of向前+fer带→提供"),
e("include","包括；包含","verb_action",1,"high",["contain","have","involve","consist of"],["exclude","include","included"],"Price includes tax.","in内+clude关→关在内"),
e("cover","覆盖；涵盖；报道","verb/noun",1,"high",["hide","protect","include","report"],["discover","recover","covert"],"Snow covered ground.","cover覆盖本身"),
e("determine","决定；确定","verb_action",1,"high",["decide","figure out","resolve","conclude"],["detect","determined"],"Determine best approach.","de去掉+termine边界→定下"),
e("develop","发展；开发","verb_action",1,"high",["grow","improve","advance","create"],["development","developer","envelope"],"Country developing fast.","de向下+velop包裹展开"),
e("create","创造；创建","verb_action",1,"high",["make","produce","invent","design"],["creature","creation","creative"],"Artists create beautiful works.","crea生长+te创造"),
e("serve","服务；服役；端上","verb_action",1,"high",["help","work for","function","provide"],["service","seven","severe"],"Breakfast served 7am 10am.","serv服务+e→服务"),
e("save","拯救；节省；保存","verb/noun",1,"high",["rescue","keep store","help"],["safe","same","say"],"Save money future.","save救/省/存"),
e("spend","花费；度过","verb_action",1,"high",["pay cost","use time","waste"],["spent","spin","span"],"How much spend?","spend花费(spent-spent)"),
e("waste","浪费","verb/noun",1,"high",["squander misuse lose throw away"],["taste","waist","wave"],"Dont waste food.","waste浪费"),
e("share","分享；分担","verb/noun",1,"high",["give part distribute divide joint"],["sheer","shark","sharp"],"Share toys friends.","share分享"),
e("spread","传播；伸展","verb/noun",1,"medium",["extend scatter expand open spread"],["spring","speed","spend"],"News spread quickly.","spread传播/伸展"),
e("reach","到达；达到；伸手","verb/noun",1,"high",["arrive get attain extend stretch arm"],["react","read","reason"],"Reach airport?","reach到达/伸"),
e("touch","触摸；接触；感动","verb/noun",1,"high",["feel contact handle move emotion"],["tough","touch","much"],"Dont touch exhibits museum.","touch触摸/感动"),
e("press","按；压；逼迫；新闻","verb/noun",1,"high",["push down force print media"],["pretty","price","princess"],"Press button start machine.","press按压/新闻"),
e("shake","摇晃；握手；发抖","verb/noun",1,"high",["tremble wave hand shiver shock"],["shape","shame","share"],"Shake well before drink.","shake摇晃/握手"),
e("pull","拉；拖；拔","verb_action",1,"high",["draw tug drag attract strain"],["pool","push","full"],"Pull door open dont push.","pull拉"),
e("push","推；推动；催促","verb_action",1,"high",["shove press force drive urge"],["pull","push","rush","brushPush door opens outward.","push推"),
e("carry","携带；搬运；承载","verb_action",1,"high",["bring take hold transport support"],["catch","care","cry","curryLet me carry your bag.","carry搬运"),
e("lift","举起；抬起；电梯","verb/noun",1,"high",["raise up elevate hoist give ride"],["left","list","lightHelp lift box.","lift抬/电梯"),
e("kick","踢","verb_action",1,"medium",["strike foot hit soccer"],["pick","keep","kid","killKick ball into goal.","kick踢"),
e("beat","打败；敲打；（心）跳","verb/noun",1,"high",["hit defeat strike win pulse"],["boat","meat","seatbeatOur team beat theirs 3-1.","beat打败/敲/心跳"),
e("win","赢；获胜","verb/noun",1,"high",["victory succeed gain triumph earn"],["wind","wine","wingPractice makes perfect win.","win赢(won-won)"),
e("lose","丢失；输；迷失","verb/noun",1,"high",["misplace fail defeat miss gone loss looseDont lose hope.","lose丢/失(lost-lost)"),
e("tie","系；平局；领带","verb/noun",1,"medium",["bind knot draw equal necktie"],["time","tire","pieGame ended tie 2-2.","tie平局/系/领带"),
e("fit","适合；安装；健康的","adj/verb",1,"high",["suit match proper healthy right sizefit fix fill fist firstThese shoes dont fit me.","fit适合/装/健"),
e("match","比赛；匹配；相配","verb/noun",1,"high",["game competition pair equal suit watch catchWatch football match tonight.","match比赛/匹配"),
e("miss","想念；错过；未击中","verb/noun",1,"high",["long for fail hit lack lose missmiss I miss old friends.","miss想/过"),
e("notice","注意到；通知","verb/noun",1,"high",["observe see spot note detect pay attentionnotion nation noticeDid you notice her new haircut?","not注意+ice通知化"),
e("wonder","想知道；奇迹；纳闷","verb/noun",1,"high",["want know curious miracle amaze ponder wander wonI wonder who she is.","wonder想知道/奇迹"),
e("worry","担心；烦恼","verb/noun",1,"high",["anxious concern trouble fear upset angry wrong hurryDont worry everything fine.","worry担心/烦恼"),
]

# ====== 短语动词 (15) ======
NEW += [
e("look after","照顾；照看","verb_phrasal",1,"high",["care for take care watch protectlook ahead look outGrandma looks after grandson.","look after=照顾"),
e("look for","寻找","verb_phrasal",1,"high",["search seek hunt find look aroundlooking forIm looking for keys.","look for=寻找"),
e("look out","小心；向外看","verb_phrasal",1,"high",["be careful watch out beware look outsideLook out Car coming!","look out=小心/外看"),
e("look forward to","期待；盼望","verb_phrasal",1,"high",["anticipate expect await hope for eagerI look forward seeing you.","look forward to=期待"),
e("look up","查阅；仰望；改善","verb_phrasal",1,"medium",["search dictionary check improve respectLook up new word dictionary.","look up=查阅/仰"),
e("look through","浏览；快速查看","verb_phrasal",1,"medium",["browse scan glance review read quicklyLook through notes before exam.","look through=浏览"),
e("turn on","打开（电器）","verb_phrasal",1,"high",["switch on start power operateTurn on light please dark here.","turn on=打开"),
e("turn off","关闭（电器）","verb_phrasal",1,"high",["switch off stop power shut downTurn off TV before sleep.","turn off=关"),
e("turn down","拒绝；调小","verb_phrasal",1,"medium",["reject decline reduce volume refuseHe turned down job offer.","turn down=拒绝"),
e("turn up","出现；调大","verb_phrasal",1,"medium",["appear arrive increase volume show upHe turned up late meeting.","turn up=出现"),
e("put on","穿上；上演","verb_phrasal",1,"high",["wear dress add weight performPut on coat cold outside.","put on=穿上"),
e("take off","脱下；起飞","verb_phrasal",1,"high",["remove clothes plane depart leaveTake off soon take off taken offPlane will take off soon.","take off=脱/飞"),
e("take place","发生；举行","verb_phrasal",1,"high",["happen occur be held organizeWhen does wedding take place?","take place=发/举"),
e("break down","出故障；崩溃","verb_phrasal",1,"medium",["fail malfunction collapse separateCar broke down highway.","break down=故障/崩"),
e("carry on","继续；坚持","verb_phrasal",1,"medium",["continue persist keep going proceedCarry on despite difficulties.","carry on=继续"),
e("come across","偶然遇见；被发现","verb_phrasal",1,"medium",["meet by chance encounter findCame across old photo today.","come across=偶遇"),
e("find out","查明；发现","verb_phrasal",1,"high",["discover learn figure out determineTeacher found out who broke window.","find out=查"),
e("get along (with)","相处；进展","verb_phrasal",1,"high",["relationship progress deal copeI get along well classmates.","get along with=相处"),
e("go over","复习；仔细检查","verb_phrasal",1,"medium",["review examine check repeatGo over answers before submit.","go over=复/查"),
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
data["meta"]["version"] = "junior2_v3"
data["words"] = words

with open(OUTPUT,'w',encoding='utf-8') as f:
    json.dump(data,f,ensure_ascii=False,indent=2)

print(f"\n=== Done! Original: {orig} | Added: {added} | Skipped: {skip} | Final: {len(words)}")
