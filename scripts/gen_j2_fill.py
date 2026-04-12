#!/usr/bin/env python3
"""Add remaining 17 words to reach 800"""
import json

with open('/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/words_network_j2.json','r') as f:
    data = json.load(f)

words = data['words']

def add(w, m, cat, tier, freq, assoc, conf, ex, tip):
    words[w] = {'word':w,'meaning':m,'category':cat,'tier':tier,'frequency':freq,'associations':assoc,'confusables':conf,'example':ex,'memory_tip':tip}

A='adjective'; N='noun'; Adv='adverb'; Prep='preposition'
Conj='conjunction'; Pron='pronoun'; V='verb'; Expr='expression'

# Additional 17 words (not yet in the dict)
add("accept","接受",V,1,"high",["agree","refuse","receive","take"],["except","access"],"She accepted the invitation.","ac+cept→接受")
add("address","地址；演讲",N,2,"medium",["home","street","letter","speak"],["address","add"],"What is your address?","address→地址")
add("admit","承认",V,2,"medium",["deny","confess","agree","accept"],["admit","permit"],"He admitted his mistake.","ad+mit→承认")
add("adult","成年人",N,2,"medium",["child","grown-up","mature","age"],["adult","advance"],"Only adults can enter.","adult→成年人")
add("advantage","优势；好处",N,2,"medium",["benefit","strength","disadvantage","good"],["advantage","advice"],"Learning English has many advantages.","advantage→优势")
add("airplane","飞机",N,1,"medium",["plane","fly","travel","airport"],["airplane","airport"],"I traveled by airplane.","air+plane→飞机")
add("allowance","零花钱",N,3,"low",["money","pocket money","save","spend"],["allow","allowance"],"She saves her allowance.","allowance→零花钱")
add("ancient","古代的",A,2,"medium",["modern","old","history","age"],["ancient","anger"],"This is an ancient temple.","ancient→古代的")
add("anniversary","周年纪念日",N,3,"low",["celebrate","year","birthday","memory"],["anniversary","announce"],"Today is their anniversary.","anniversary→周年纪念日")
add("apartment","公寓",N,2,"medium",["flat","house","room","live"],["apartment","apart"],"They live in a new apartment.","apartment→公寓")
add("applaud","鼓掌；赞赏",V,3,"low",["clap","praise","cheer","approve"],["applaud","apple"],"The audience applauded loudly.","applaud→鼓掌")
add("application","申请；应用",N,2,"medium",["apply","form","request","use"],["apply","apple"],"Fill in the application form.","application→申请")
add("argument","争论；论点",N,2,"medium",["argue","fight","disagree","debate"],["argue","arm"],"They had a heated argument.","argument→争论")
add("balance","平衡",N,2,"medium",["balanced","equal","steady","weight"],["balance","ball"],"You need to keep your balance.","balance→平衡")
add("bargain","便宜货；讨价还价",N,2,"medium",["cheap","deal","price","discount"],["bargain","barrier"],"This dress is a bargain.","bargain→便宜货")
add("behavior","行为；举止",N,2,"medium",["behave","action","manners","conduct"],["behavior","behind"],"His behavior was excellent.","behavior→行为")
add("belt","腰带；地带",N,2,"medium",["wear","tie","leather","waist"],["belt","bell"],"He wore a black belt.","belt→腰带")

# Check if any already existed (they shouldn't)
new_count = len(words) - len(data['words'])
print(f'Added {new_count} new words')
print(f'Total: {len(words)} words')

# Check for "lately" duplicate
if "lately" in words:
    # It was duplicated in part4, remove one
    del words["lately"]
    print(f'Removed duplicate "lately", total now: {len(words)}')

# Still need more?
need = 800 - len(words)
print(f'Still need {need} more words')

if need > 0:
    add("beneath","在……下方",Prep,3,"low",["below","under","underneath","above"],["beneath","between"],"The cat hid beneath the table.","beneath→在下方")
    add("beyond","在……之外",Prep,2,"medium",["past","outside","further","beyond"],["beyond","behind"],"This is beyond my ability.","beyond→在之外")
    add("blame","责备",V,2,"medium",["fault","accuse","criticize","responsibility"],["blame","blind"],"Don't blame others.","blame→责备")
    add("bless","祝福",V,3,"low",["blessing","wish","pray","luck"],["bless","blind"],"God bless you.","bless→祝福")
    add("board","板；董事会",N,2,"medium",["blackboard","wood","flat","piece"],["board","boat"],"Write on the board.","board→板")
    add("bone","骨头",N,3,"low",["body","dog","skeleton","hard"],["bone","born"],"The dog buried a bone.","bone→骨头")
    add("border","边界；边境",N,3,"low",["edge","boundary","country","line"],["border","bore"],"They crossed the border.","border→边界")
    add("brave","勇敢的",A,1,"high",["courageous","bold","fear","coward"],["bread","break"],"She is a brave girl.","brave→勇敢的")
    add("breath","呼吸",N,2,"medium",["breathe","air","deep","lung"],["breath","bread"],"Take a deep breath.","breath→呼吸")
    add("broadcast","广播",N,3,"low",["radio","TV","program","news"],["broadcast","broad"],"The news broadcast starts at 7.","broadcast→广播")
    add("cable","电缆；缆绳",N,3,"low",["wire","rope","connect","line"],["cable","able"],"The cable car goes up the mountain.","cable→电缆")
    add("calendar","日历",N,3,"low",["date","month","year","schedule"],["calendar","calculate"],"Look at the calendar.","calendar→日历")
    add("campaign","运动；活动",N,3,"low",["activity","movement","advertising"],["campaign","champion"],"They started a campaign.","campaign→运动")
    add("cancel","取消",V,2,"medium",["stop","call off","delete","end"],["cancer","cancel"],"They canceled the meeting.","cancel→取消")
    add("cancer","癌症",N,3,"low",["disease","illness","sick","hospital"],["cancer","cancel"],"Smoking can cause cancer.","cancer→癌症")
    add("candidate","候选人",N,3,"low",["election","vote","person","choice"],["candidate","candle"],"She is a candidate for president.","candidate→候选人")
    add("capable","有能力的",A,2,"medium",["able","skill","talent","unable"],["capable","capital"],"She is capable of leading the team.","capable→有能力的")
    add("capture","捕获",V,3,"low",["catch","seize","arrest","free"],["capture","captain"],"They captured the thief.","capture→捕获")

need = 800 - len(words)
print(f'Still need {need} more words after second batch')

# Remove any more duplicates
for dup in ["brave","breath","beneath","beyond"]:
    if need > 0 and dup in words:
        # check if it was already there
        pass

data['meta']['total'] = len(words)

with open('/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/words_network_j2.json','w',encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f'FINAL TOTAL: {len(words)} words')
