#!/usr/bin/env python3
"""Generate words_network_j2.json - Part 4: Final 119 words (adverbs, preps, conjunctions, pronouns, expressions, tier2/3补充)"""
import json

with open('/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/_part3_cache.json','r') as f:
    words = json.load(f)

def add(w, m, cat, tier, freq, assoc, conf, ex, tip):
    words[w] = {
        'word': w, 'meaning': m, 'category': cat,
        'tier': tier, 'frequency': freq,
        'associations': assoc, 'confusables': conf,
        'example': ex, 'memory_tip': tip
    }

A='adjective'; N='noun'; Adv='adverb'; Prep='preposition'
Conj='conjunction'; Pron='pronoun'; V='verb'
Expr='expression'

entries = [
# === ADVERBS (40) ===
("actually","实际上",Adv,1,"high",["really","in fact","truly","actually"],["actual","actually"],"Actually, I disagree with you.","actual+ly→实际上"),
("almost","几乎；差不多",Adv,1,"high",["nearly","about","hardly","most"],["almost","already"],"I almost missed the bus.","almost→几乎"),
("already","已经",Adv,1,"high",["yet","still","before","now"],["already","almost"],"She has already finished.","already→已经"),
("also","也；而且",Adv,1,"high",["too","as well","additionally","besides"],["also","although"],"I also like swimming.","also→也"),
("although","虽然；尽管",Conj,1,"high",["though","even though","but","however"],["although","already"],"Although it rained, we went out.","although→虽然"),
("always","总是",Adv,1,"high",["never","often","usually","forever"],["always","almost"],"She always gets up early.","always→总是"),
("ancient","古代的",A,2,"medium",["modern","old","history","old"],["ancient","ancient"],"China has an ancient history.","ancient→古代的"),
("anyway","无论如何",Adv,2,"medium",["anyway","regardless","anyhow","besides"],["anyway","anywhere"],"Anyway, let me help you.","anyway→无论如何"),
("around","周围；大约",Adv,1,"high",["about","near","round","here"],["around","arrive"],"There are around 30 students.","around→周围"),
("away","离开；远离",Adv,1,"high",["far","near","go","here"],["away","always"],"She walked away.","away→离开"),
("badly","糟糕地；严重地",Adv,2,"medium",["seriously","terribly","bad","well"],["bad","badly"],"He was badly hurt.","badly→糟糕地"),
("besides","此外；除了",Prep,2,"medium",["also","except","moreover","in addition"],["beside","besides"],"Besides English, I study math.","besides→此外"),
("certainly","当然",Adv,1,"high",["sure","of course","definitely","probably"],["certain","certainly"],"I will certainly come.","certainly→当然"),
("completely","完全地",Adv,2,"medium",["totally","fully","entirely","partly"],["complete","completely"],"I completely forgot about it.","completely→完全地"),
("deeply","深深地",Adv,2,"medium",["deep","profoundly","shallowly"],["deep","deeply"],"She was deeply moved.","deeply→深深地"),
("directly","直接地",Adv,2,"medium",["indirectly","straight","personally"],["direct","direction"],"Please talk to him directly.","directly→直接地"),
("especially","特别地",Adv,1,"high",["particularly","specially","mainly","mostly"],["especially","special"],"I love fruit, especially apples.","especially→特别地"),
("everywhere","到处",Adv,1,"high",["anywhere","somewhere","nowhere","here"],["every","where"],"I looked everywhere for my keys.","everywhere→到处"),
("exactly","确切地",Adv,2,"medium",["precisely","correctly","accurately","right"],["exact","example"],"What exactly do you mean?","exact+ly→确切地"),
("finally","最后；终于",Adv,1,"high",["at last","in the end","finally","lastly"],["final","finally"],"We finally arrived.","finally→最后"),
("fortunately","幸运地",Adv,2,"medium",["luckily","unfortunately","happy","sad"],["fortunate","fortunately"],"Fortunately, no one was hurt.","fortunate+ly→幸运地"),
("generally","通常；一般地",Adv,2,"medium",["usually","normally","commonly","rarely"],["general","generally"],"Generally, I agree with you.","general+ly→通常"),
("gradually","逐渐地",Adv,2,"medium",["slowly","step by step","suddenly","quickly"],["gradual","grade"],"The weather gradually got warmer.","gradual+ly→逐渐地"),
("hardly","几乎不",Adv,1,"high",["barely","almost not","scarcely","hard"],["hard","hardly"],"I can hardly believe it.","hard+ly→几乎不"),
("however","然而",Adv,1,"high",["but","although","nevertheless","yet"],["how","ever"],"However, it was not easy.","however→然而"),
("instead","代替；而不是",Adv,1,"high",["rather","in place of","instead of"],["instead","instead"],"She chose tea instead of coffee.","instead→代替"),
("lately","最近",Adv,2,"medium",["recently","lately","now","before"],["late","lately"],"Have you seen him lately?","late+ly→最近"),
("lately","近来",Adv,2,"medium",["recently","lately","now","before"],["late","lately"],"I haven't seen her lately.","late+ly→近来"),
("mainly","主要地",Adv,2,"medium",["mostly","chiefly","primarily","mainly"],["main","mainly"],"The students are mainly from China.","main+ly→主要地"),
("nearly","几乎；将近",Adv,1,"high",["almost","about","nearly","close to"],["near","nearly"],"It's nearly time to go.","near+ly→几乎"),
("never","从不",Adv,1,"high",["always","ever","not","rarely"],["never","ever"],"I have never been to Japan.","never→从不"),
("normally","通常",Adv,2,"medium",["usually","generally","regularly","normally"],["normal","normally"],"I normally go to bed at 10.","normal+ly→通常"),
("now","现在",Adv,1,"high",["then","today","present","right now"],["now","know"],"I am doing my homework now.","now→现在"),
("obviously","显然地",Adv,2,"medium",["clearly","evidently","apparently","plainly"],["obvious","obviously"],"Obviously, he was wrong.","obvious+ly→显然地"),
("perhaps","也许",Adv,1,"medium",["maybe","possibly","probably","certainly"],["perhaps","perfect"],"Perhaps it will rain.","perhaps→也许"),
("possibly","可能地",Adv,2,"medium",["maybe","perhaps","probably","possibly"],["possible","possibly"],"Could you possibly help me?","possible+ly→可能地"),
("probably","很可能",Adv,1,"high",["maybe","perhaps","possibly","likely"],["probable","probably"],"It will probably rain tomorrow.","probable+ly→很可能"),
("quickly","快速地",Adv,1,"high",["fast","rapidly","slowly","soon"],["quick","quickly"],"She ran quickly.","quick+ly→快速地"),
("really","真正地",Adv,1,"high",["truly","actually","very","really"],["real","really"],"I really like this song.","real+ly→真正地"),
("recently","最近",Adv,1,"medium",["lately","newly","now","before"],["recent","recently"],"I have been busy recently.","recent+ly→最近"),
("regularly","定期地",Adv,2,"medium",["often","usually","normally","irregularly"],["regular","regularly"],"She exercises regularly.","regular+ly→定期地"),
("suddenly","突然地",Adv,1,"high",["unexpectedly","quickly","gradually","slowly"],["sudden","suddenly"],"It suddenly started to rain.","sudden+ly→突然地"),
("truly","真正地",Adv,2,"medium",["really","actually","genuinely","truly"],["true","truly"],"She is truly beautiful.","true+ly→真正地"),
("usually","通常",Adv,1,"high",["normally","often","always","rarely"],["usual","usually"],"I usually go to school by bus.","usual+ly→通常"),
("yet","然而；还",Adv,1,"high",["but","already","still","however"],["yet","yes"],"I haven't finished yet.","yet→然而"),
# === PREPOSITIONS (20) ===
("above","在……上方",Prep,1,"high",["below","over","under","on"],["above","about"],"The bird flew above the tree.","above→在上方"),
("across","穿过",Prep,1,"high",["cross","over","through","along"],["across","cross"],"She walked across the street.","across→穿过"),
("against","反对；靠着",Prep,1,"high",["for","with","opposite","support"],["again","against"],"He leaned against the wall.","against→靠着"),
("among","在……之中",Prep,1,"high",["between","among","within","amidst"],["among","anger"],"She is popular among her classmates.","among→在之中"),
("behind","在……后面",Prep,1,"high",["in front of","after","back","before"],["behind","believe"],"The cat is behind the door.","behind→在后面"),
("below","在……下面",Prep,1,"high",["above","under","beneath","low"],["below","blow"],"The temperature is below zero.","below→在下面"),
("beside","在……旁边",Prep,1,"high",["next to","near","by","besides"],["beside","besides"],"Come and sit beside me.","beside→在旁边"),
("between","在……之间",Prep,1,"high",["among","between","within","middle"],["between","beyond"],"Between you and me...","between→在之间"),
("beyond","超越；在……之外",Prep,2,"medium",["beyond","past","outside","further"],["beyond","between"],"This is beyond my understanding.","beyond→超越"),
("during","在……期间",Prep,1,"high",["while","through","in","between"],["during","during"],"He fell asleep during class.","during→在期间"),
("except","除了",Prep,1,"high",["besides","but","except for","including"],["except","expect"],"Everyone came except Tom.","except→除了"),
("inside","在……里面",Prep,1,"high",["outside","within","into","in"],["inside","insist"],"The cat is inside the box.","inside→在里面"),
("into","进入",Prep,1,"high",["out of","in to","inside","enter"],["into","unto"],"She walked into the room.","into→进入"),
("near","在……附近",Prep,1,"high",["far","close","nearby","beside"],["near","nearly"],"The school is near my home.","near→在附近"),
("onto","到……上面",Prep,2,"medium",["on","to","upon","into"],["onto","into"],"He jumped onto the table.","onto→到上面"),
("outside","在外面",Prep,1,"high",["inside","outdoor","within","beyond"],["outside","outstanding"],"It is cold outside.","outside→在外面"),
("through","通过；穿过",Prep,1,"high",["across","by","via","during"],["through","though"],"Walk through the park.","through→穿过"),
("throughout","遍及",Prep,2,"medium",["everywhere","through","all over","across"],["through","throughout"],"It rained throughout the day.","throughout→遍及"),
("toward","朝向",Prep,1,"high",["towards","to","for","at"],["toward","tower"],"She walked toward the door.","toward→朝向"),
("without","没有",Prep,1,"high",["with","no","lack","within"],["without","within"],"I can't do it without you.","without→没有"),
# === CONJUNCTIONS (8) ===
("and","和；而且",Conj,1,"high",["also","or","but","too"],["and","ant"],"You and I are friends.","and→和"),
("as","作为；当",Conj,1,"high",["like","because","while","since"],["as","at"],"She works as a teacher.","as→作为"),
("because","因为",Conj,1,"high",["since","as","why","reason"],["because","become"],"I stayed home because it rained.","because→因为"),
("but","但是",Conj,1,"high",["however","yet","although","and"],["but","buy"],"I like it, but it's expensive.","but→但是"),
("if","如果",Conj,1,"high",["whether","when","unless","condition"],["if","in"],"If it rains, we will stay home.","if→如果"),
("or","或者；否则",Conj,1,"high",["and","either","whether","nor"],["or","of"],"Tea or coffee?","or→或者"),
("so","所以",Conj,1,"high",["therefore","because","thus","so"],["so","do"],"It was late, so I went home.","so→所以"),
("until","直到",Conj,1,"high",["till","before","by","since"],["until","unless"],"Wait here until I come back.","until→直到"),
("unless","除非",Conj,2,"medium",["if not","except","until","if"],["unless","until"],"I won't go unless you come.","unless→除非"),
("while","当……的时候",Conj,1,"high",["during","when","as","while"],["while","white"],"She read while I cooked.","while→当"),
("whether","是否",Conj,2,"medium",["if","either","or","whether"],["whether","weather"],"I wonder whether he will come.","whether→是否"),
# === PRONOUNS (10) ===
("another","另一个",Pron,1,"high",["other","one more","different"],["another","other"],"Would you like another one?","another→另一个"),
("anybody","任何人",Pron,1,"high",["anyone","somebody","nobody","everyone"],["anybody","anything"],"Does anybody know the answer?","any+body→任何人"),
("anything","任何事物",Pron,1,"high",["something","nothing","everything","anybody"],["anything","anybody"],"Is there anything I can do?","any+thing→任何事物"),
("everybody","每个人",Pron,1,"high",["everyone","somebody","anybody","all"],["everybody","everyone"],"Everybody likes music.","every+body→每个人"),
("everyone","每个人",Pron,1,"high",["everybody","each person","all"],["everyone","everybody"],"Everyone is here today.","every+one→每个人"),
("everything","一切事物",Pron,1,"high",["all","nothing","something","everybody"],["everything","everyone"],"Everything is ready.","every+thing→一切"),
("nobody","没有人",Pron,1,"high",["no one","somebody","anybody","everybody"],["nobody","nothing"],"Nobody came to the party.","no+body→没有人"),
("nothing","没有什么",Pron,1,"high",["something","anything","everything","none"],["nothing","nobody"],"I have nothing to do.","no+thing→没有什么"),
("somebody","某人",Pron,1,"high",["someone","anybody","nobody","everybody"],["somebody","something"],"Somebody is knocking at the door.","some+body→某人"),
("something","某事",Pron,1,"high",["anything","nothing","everything","somebody"],["something","sometimes"],"I want something to drink.","some+thing→某事"),
# === EXPRESSIONS/PHRASES + remaining (21) ===
("by the way","顺便说一下",Expr,2,"medium",["anyway","besides","however"],["by","way"],"By the way, where is the library?","by the way→顺便说"),
("in fact","事实上",Expr,2,"medium",["actually","really","in reality","truly"],["fact","in"],"In fact, I agree with you.","in fact→事实上"),
("of course","当然",Expr,1,"high",["certainly","sure","naturally","definitely"],["course","of"],"Of course you can come.","of course→当然"),
("at least","至少",Expr,2,"medium",["at most","minimum","least"],["at","least"],"At least we tried.","at least→至少"),
("as long as","只要",Expr,2,"medium",["if","provided that","condition","unless"],["long","as"],"As long as you study hard, you will pass.","as long as→只要"),
("as soon as","一……就",Expr,2,"medium",["when","immediately","once","as"],["as long as","as far as"],"I will call you as soon as I arrive.","as soon as→一就"),
("be able to","能够",Expr,1,"high",["can","could","able","manage"],["able","be"],"She is able to swim.","be able to→能够"),
("be used to","习惯于",Expr,2,"medium",["get used to","accustomed","familiar","habit"],["used","be"],"I am used to getting up early.","be used to→习惯于"),
("deal with","处理；对付",Expr,2,"medium",["handle","manage","solve","face"],["deal","with"],"How do you deal with stress?","deal with→处理"),
("depend on","依赖；取决于",Expr,1,"high",["rely on","need","trust","count on"],["depend","on"],"It depends on the weather.","depend on→取决于"),
("give up","放弃",Expr,1,"high",["quit","stop trying","surrender","try"],["give","up"],"Never give up!","give up→放弃"),
("go on","继续",Expr,1,"high",["continue","keep on","proceed","stop"],["go","on"],"Please go on reading.","go on→继续"),
("instead of","代替",Expr,2,"medium",["rather than","in place of","instead","replace"],["instead","of"],"She chose tea instead of coffee.","instead of→代替"),
("look forward to","期待",Expr,2,"medium",["expect","anticipate","wait for","excited"],["look","forward"],"I look forward to seeing you.","look forward to→期待"),
("make up","编造；组成",Expr,2,"medium",["invent","create","compose","lie"],["make","up"],"Don't make up stories.","make up→编造"),
("pay attention to","注意",Expr,2,"medium",["notice","focus on","care","watch"],["pay","attention"],"Please pay attention to the teacher.","pay attention to→注意"),
("pick up","捡起；接",Expr,2,"medium",["lift","collect","gather","grab"],["pick","up"],"Pick up your trash.","pick up→捡起"),
("put off","推迟",Expr,2,"medium",["delay","postpone","cancel","schedule"],["put","off"],"Don't put off until tomorrow.","put off→推迟"),
("set up","建立；设置",Expr,2,"medium",["establish","create","build","start"],["set","up"],"They set up a new company.","set up→建立"),
("take care of","照顾",Expr,1,"high",["care for","look after","protect","help"],["take","care"],"She takes care of her little brother.","take care of→照顾"),
("turn on","打开（电器）",Expr,1,"high",["switch on","start","open","begin"],["turn","on"],"Please turn on the light.","turn on→打开"),
]

for e in entries:
    add(*e)

# Build final JSON
data_out = {
    'meta': {
        'total': len(words),
        'generated_at': '2026-04-12',
        'version': 'junior2_v1'
    },
    'words': words
}

outpath = '/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/words_network_j2.json'
with open(outpath, 'w', encoding='utf-8') as f:
    json.dump(data_out, f, ensure_ascii=False, indent=2)

print(f'FINAL: {len(words)} words written to {outpath}')

# Cleanup temp files
import os
for p in ['_part1_cache.json','_part2_cache.json','_part3_cache.json']:
    fp = f'/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/{p}'
    if os.path.exists(fp):
        os.remove(fp)
        print(f'Cleaned up {p}')
