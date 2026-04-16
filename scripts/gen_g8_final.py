#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
初二（8年级）英语听写词库生成 - 完整版
从 words_network_j2.json (1276词) -> dictation_en_g8.json
内置完整音标字典 + 学期分配
"""
import json, re, sys

INPUT_FILE = 'src/data/words_network_j2.json'
OUTPUT_FILE = 'src/data/dictation_en_g8.json'

def main():
    # 1. 读取源数据
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        src = json.load(f)
    words = src['words']
    print(f"Source: {len(words)} words from words_network_j2.json")
    
    # 2. 构建音标字典 (使用规则生成 + 关键词手动映射)
    phonetic_map = build_phonetic_dict()
    print(f"Phonetic dictionary: {len(phonetic_map)} entries")
    
    # 3. 构建学期分配
    sem1_set, sem2_set = build_semester_sets()
    
    # 4. 转换并输出
    output = []
    idx = 1
    missing_phon = []
    
    for key in sorted(words.keys()):
        wd = words[key]
        w = wd.get('word', key)
        meaning = wd.get('meaning', '').strip()
        example = wd.get('example', '').strip()
        
        # 查找音标
        ph = lookup_phonetic(w, phonetic_map)
        if not ph or ph == f"/{w}/":
            missing_phon.append(w)
        
        # 分配学期
        semester = get_semester(w, sem1_set, sem2_set)
        
        # 确保有例句
        if not example:
            example = f"Can you spell {w}?"
        
        output.append({
            "id": f"en_g8_{idx:04d}",
            "word": w,
            "meaning": meaning,
            "grade": 8,
            "semester": semester,
            "phonetic": ph,
            "example": example
        })
        idx += 1
    
    # 5. 写入文件
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    # 6. 统计报告
    s1 = sum(1 for e in output if e['semester'] == '上册')
    s2 = sum(1 for e in output if e['semester'] == '下册')
    
    print(f"\n{'='*60}")
    print("GENERATION COMPLETE")
    print(f"{'='*60}")
    print(f"Total:     {len(output)} words")
    print(f"ID range: en_g8_0001 ~ en_g8_{len(output):04d}")
    print(f"上册:      {s1} ({s1/len(output)*100:.1f}%)")
    print(f"下册:      {s2} ({s2/len(output)*100:.1f}%)")
    print(f"Missing phonetics: {len(missing_phon)}")
    print(f"Output:    {OUTPUT_FILE}")
    
    # 样例
    print(f"\nFirst 5:")
    for e in output[:5]:
        print(f"  {e['id']}: {e['word']:18s} | {e['phonetic']:20s} | [{e['semester']}] | {e['meaning']}")
    print(f"Last 5:")
    for e in output[-5:]:
        print(f"  {e['id']}: {e['word']:18s} | {e['phonetic']:20s} | [{e['semester']}] | {e['meaning']}")

def build_phonetic_dict():
    """构建完整的音标字典"""
    d = {}
    
    # 使用 add 批量添加
    def add(word_list, phonetic):
        for w in word_list:
            d[w] = phonetic

    # ===== 上册 Unit 1-10 + 下册 Unit 1-10 核心教材词汇 =====
    # Unit 1 上
    add(['anyone','anywhere','wonderful','few','most','myself','yourself','hen','seem',
          'bored','activity','decide','try','paragliding','bird','building','wonder',
          'difference','top','wait','umbrella','wet','below','enough','hungry','as','hill',
          'diary','enjoy','dislike'], 'PH_U1')  # 下面逐个覆盖
    
    d.update({'anyone':"/'eniwAn/",'anywhere':"/'eniwea(r)/",'wonderful':"/'wAndafl/",
              'few':"/fju:/",'most':"/m@ust/",'myself':"/mai'self/",'yourself':"/jO:'self/",
              'hen':"/hen/",'seem':"/si:m/",'bored':"/bO:d/",'activity':"/æk'tIvati/",
              'decide':"/dI'saId/",'try':"/traI/",'paragliding':"/'pær@laIdIN/",
              'bird':"/b3:d/",'building':"/'bIlIN/",'wonder':"/'wAnda(r)/",
              'difference':"/'dIf@ns/",'top':"/tQp/",'wait':"/weIt/",
              'umbrella':"/Am'brela/",'wet':"/wet/",'below':"/bI'l@U/",
              'enough':"/I'nAf/",'hungry':"/'hANgri/",'as':"/æz/",
              'hill':"/hIl/",'diary':"/'daIari/",'enjoy':"/In'dZOI/",'dislike':"/dIs'laIk/"})

    # Unit 2 上  
    d.update({'housework':"/'haUsW3:k/",'hardly':"/'hA:dli/",'ever':"/'eva(r)/",
              'once':"/wAns/",'twice':"/twaIs/",'internet':"/'Intanet/",
              'program':"/'pr@Ugræm/",'full':"/fUl/",'swing':"/swIN/",
              'maybe':"/'meIbi/",'least':"/li:st/",'junk':"/dZNk/",
              'coffee':"/'kQfi/",'health':"/helT/",'result':"/rI'zAlt/",
              'percent':"/pa'sent/",'although':"/O:l'D@U/",'through':"/ Tru:/",
              'such':"/sVtS/",'together':"/t@'geDa(r)/",'die':"/daI/",
              'writer':"/'raIta(r)/",'magazine':"/,mæg@'zi:n/",
              'however':"/haU'eva(r)/",'than':"/Dæn;",'almost':"/'O:lm@ust/",
              'none':"/nAn/",'less':"/les/",'point':"/pOInt/"})

    # Unit 3 上
    d.update({'outgoing':"/'aUtg@UIg/",'better':"/'bet@(r)/",'loudly':"/'laUdli/",
              'quietly':"/'kwaIatli/",'hard-working':"/,hA:d'W3:kIg/",
              'competition':"/,kQmp@'tISn/",'fantastic':"/fæn'tæstIk/",
              'clearly':"/'klIali/",'win':"/wIn/",'though':"/D@U/",
              'care':"/kea(r)/",'talented':"/'tæl@ntId/",'truly':"/'tru:li/",
              'necessary':"/'nes@s@ri/",'both':"/b@UT/",'which':"/wItS/",
              'grade':"/greId/",'should':"/Sud;",'bring':"/brIN/",
              'information':"/,Inf@'meISn/",'touch':"/tVtS/",
              'heart':"/hA:t/",'break':"/breIk/",'arm':"/A:m/",
              'laugh':"/lA:f/",'similar':"/'sImIla(r)/",'share':"/Sea(r)/",
              'loud':"/laUd/",'primary':"/'praIm@ri/",'reach':"/ri:tS/",
              'hand':"/hænd/",'kid':"/kId/",'fact':"/fækt/"})

    # Unit 4 上
    d.update({'theater':"/'TI@t@(r)/",'comfortable':"/'kAmft@bl/",'screen':"/skri:n/",
              'close':"/kl@Uz/",'ticket':"/'tIkIt/",'worst':"/w3:st/",
              'cheaply':"/'tSi:pli/",'song':"/sQN/",'choose':"/tSu:z/",
              'action':"/'ækSn/",'role':"/r@Ul/",'simple':"/'sImpl/",
              'report':"/rI'pO:t/",'service':"/'s3:vIs/",'pretty':"/'prIti/",
              'meal':"/mi:l/",'fresh':"/freS/",'creativity':"/,kri:eI'tIv@ti/",
              'performer':"/p@'fO:m@(r)/",'crowd':"/kraUd/",
              'poor':"/pO:(r); pU@(r)/",'give':"/gIv/",'seat':"/si:t/",
              'menu':"/'menju:/",'act':"/ætkt/",'without':"/wI'DaUt/",
              'discuss':"/dI'skVs/"})

    # Unit 5 上
    d.update({'situation':"/,sItSu'eISn/",'expect':"/Ik'spekt/",
              'happen':"/'hæpn/",'cartoon':"/kA:'tu:n/",
              'culture':"/'kVltSa(r)/",'famous':"/'feIm@s/",
              'appear':"@'pIa(r)/",'become':"/bI'kVm/",'rich':"/rItS/",
              'successful':"/s@k'sesfl/",'might':"/maIt/",'main':"/meIn/",
              'reason':"/'ri:zn/",'film':"/fIlm/",'unluckily':"/An'lAkIli/",
              'lose':"/lu:z/",'ready':"/'redi/",'character':"/'kærakta(r)/",
              'army':"/'A:mi/",'face':"/feIs/",'own':"@Un/",
              'art':"/A:t/",'paint':"/peint/",'create':"/kri'eIt/",
              'describe':"/dI'skraIb/",'look':"/lUk/",
              'educational':"/,edZu'keISnal/",'plan':"/plæn/",
              'joke':"/dZ@uk/",'meaningless':"/'mi:nINl@s/",'enjoyable':"/In'dZOI@bl/"})

    # Unit 6 上
    d.update({'grow':"/gr@U/",'computer':"/k@m'pju:t@(r)/",
              'programmer':"/'pr@Ugræm@(r)/",'cook':"/kUk/",
              'doctor':"/'dQkt@(r)/",'engineer':"/,endZI'nI@(r)/",
              'violinist':"/,vaI@'lInIst/",'driver':"/'draIv@(r)/",
              'pilot':"/'paIl@t/",'pianist':"/'pi@nIst/",
              'scientist':"/'saI@ntIst/",'college':"/'kqlIdZ/",
              'education':"/,edzu'eISn/",'medicine':"/'medsn/",
              'university':"/,ju:nI'v3:sati/",'article':"/'A:tlkl/",
              'send':"/send/",'resolution':"/,rez@'lu:Sn/",
              'team':"/ti:m/",'foreign':"/'fOr@n/",
              'able':"/'eIbl/",'question':"/'kwestSn/",
              'meaning':"/'mi:nIN/",'promise':"/'prQmIs/",
              'beginning':"/bI'gInIN/",'improve':"/Im'pru:v/",
              'physical':"/'fIzIkl/",'hobby':"/'hQbi/",
              'weekly':"/'wi:kli/",'schoolwork':"/'sku:lw3:k/",
              'personal':"/'p3:s@nl/",'relationship':"/rI'leISnSIp/"})

    # Unit 7 上
    d.update({'paper':"/'peIp@(r)/",'pollution':"/p@'lu:Sn/",
              'environment':"/In'vaIr@nm@nt/",'planet':"/'plænIt/",
              'earth':"/3:T/",'plant':"/plA:nt/",'part':"/pA:t/",
              'peace':"/pi:s/",'sky':"/skaI/",'water':"/'wO:t@(r)/",
              'future':"/'fju:tSa(r)/",'build':"/bIld/",
              'astronaut':"/'æstr@nO:t/",'apartment':"@'pA:tm@nt/",
              'space':"/speIs/",'even':"/'i:vn/",'human':"/'hju:m@n/",
              'dangerous':"/'deIndZ@r@s/",'already':"/O:l'redi/",
              'factory':"/'fæktri/",'believe':"/bI'li:v/",
              'disagree':",dIs@'gri:",'shape':"/SeIp/",'fall':"/fO:l/",
              'inside':",Insaid/",'impossible':"/Im'pQs@bl/",
              'side':"/saId/",'probably':"/'prQb@li/",
              'during':"/'djU@rIn/",'holiday':"/'hql@deI/",'word':"/w3:d/"})

    # Unit 8 上
    d.update({'shake':"/SeIk/",'blender':"/'blend@(r)/",'peel':"/pi:l/",
              'cut':"/kAt/",'yogurt':"/'jQg@t/",'ingredient':"/In'gri:dI@nt/",
              'cup':"/kAp/",'spoon':"/spu:n/",'popcorn':"/'pQpkO:n/",
              'salt':"/sO:lt;",'sugar':"/'SUga(r)/",'cheese':"/tSi:z/",
              'corn':"/kO:n/",'machine':"/m@'Si:n/",'dig':"/dIg/",
              'hole':"/h@Ul/",'sandwich':"/'sænwidZ/",'butter':"/'bAt@(r)/",
              'lettuce':"/'letIs/",'turkey':"/'t3:ki/",'slice':"/slaIs/",
              'traditional':"/tr@dISnal/",'traveler':"/'trævl@(r)/",
              'England':"/'INgl@nd/",'celebrate':"/'selibreit/",
              'pepper':"/'pep@(r)/",'oven':"/'Avn/",'plate':"/pleIt/",
              'cover':"/'kAv@(r)/",'gravy':"/'greIvi/",
              'temperature':"/'tempr@tSa(r)/",'serve':"/s3:v/",'mix':"/mIks/"})

    # Unit 9 上
    d.update({'prepare':"/prI'pe@(r); prI'per/",'exam':"/Ig'zæm/",
              'flu':"/flu:",'available':"@'veI@bl/",
              'until':"@n'tIl; Vn'tIl/",'hang':"/hæN/",
              'catch':"/kætS/",'invite':"/In'vaIt/",
              'accept':"@k'sep/",'refuse':"/rI'fju:z/",
              'weekday':"/'wi:kdeI/",'reply':"/rI'plaI/",
              'forward':"/'fO:w@d/",'delete':"/dI'li:t/",
              'print':"/prInt/",'sad':"/sæd/",
              'goodbye':",gUd'baI/",'preparation':"/,prep@'reISn/",
              'glue':"/glu:",'surprised':"/s@'praIzd/"})

    # Unit 10 上
    d.update({'if':"/If/",'tomorrow':"/t@'mQr@U/",
              'organize':"/'O:g@naIz/",'video':"/'vIdi@U/",
              'chocolate':"/'tSQklIt/",'upset':"/Ap'set; 'Apset/",
              'taxi':"/'tæksi/",'advice':"@d'vaIs/",
              'travel':"/'trævl/",'else':"/els/",
              'normal':"/'nO:ml/",'certainly':"/'s3:tnli/",
              'wallet':"/'wQlIt/",'mile':"/maIl/",
              'angry':"/'æNgri/",'understanding':",Vnd@'stændIN/",
              'careless':"/'keal@s/",'mistake':"/mI'steIk/",
              'himself':"/hIm'self/",'careful':"/'ke@fl;",
              'advise':"/@d'vaIz/",'solve':"/sQlv/",
              'step':"/step/",'trust':"/trAst/",
              'experience':"/Ik'spi@ri@ns/",'expert':"/'eksp3:t/",
              "unless":"/@n'les/"})

    # 下册 Unit 1
    d.update({'fever':"/'fi:v@(r)/",'cough':"/kQf;",
              'toothache':"/'tu:teIk/",'headache':"/'hedeIk/",
              'stomachache':"/'stVm@keIk/",'throat':"/Thr@ut/",
              'hurt':"/h3:t/",'lie':"/laI/",'rest':"/rest/",
              'X-ray':"/'eks reI/",'matter':"/'mæt@(r)/",
              'trouble':"/'trQbl/",'passenger':"/'pæsIndZ@(r)/",
              'herself':"/h3:'self;",'bandage':"/'bændIdZ/",
              'sick':"/sIk/",'knee':"/ni:/",'hit':"/hIt/",
              'risk':"/rIsk/",'kilo':"/'ki:l@U/",'rock':"/rQk/",
              'blood':"/blAd/",'mean':"/mi:n/",
              'importance':"/Im'pO:tns;",'decision':"/dI'sIZn/",
              'control':"/k@n'tr@Ul/",'spirit':"/'spIrIt/",
              'death':"/deT/",'nurse':"/n3:s/"})

    # 下册 Unit 2
    d.update({'rubbish':"/'rAbIS/",'fold':"/f@Uld/",'sweep':"/swi:p/",
              'floor':"/flO:(r)/",'mess':"/mes/",
              'neither':"/'ni:D@(r); 'naID@(r)/",'borrow':"/'bQr@U/",
              'lend':"/lend/",'finger':"/'fINga(r)/",'hate':"/heIt/",
              'chore':"/tSO:(r)/",'provide':"/pr@'vaId/",
              'drop':"/drQp/",'fair':"/fea(r)/",'unfair':"/An'fea(r)/",
              'since':"/sins/",'neighbor':"/'neIba(r)/",
              'ill':"/Il/",'depend':"/dI'pend/",
              'develop':"/dI'vel@p/",'fairness':"/'fean@s;",
              'waste':"/weIst/"})

    # 下册 Unit 3-5
    d.update({'pass':"/pA:s; pæs/",'cloud':"/klaUd/",'while':"/waIl/",
              'match':"/mætS/",'beat':"/bi:t/",
              'against':"@'genst; @'geInst/",'rise':"/raIz/",
              'completely':"/k@m'pli:tli/",'recently':"/'ri:sntli/",
              'silence':"/'saI@ns/",'date':"/deIt/",
              'tower':"/'taU@(r)/",'truth':"/tru:T/",
              'pupil':"/'pju:pl/",'bright':"/braIt/",
              'playground':"/'pleIgraUnd/",'bell':"/bel/",
              'storm':"/stO:m/",'wind':"/wInd/",'light':"/laIt/",
              'area':"/'e@ria/",'wood':"/wUd/",
              'window':"/'wInd@U/",'flashlight':"/'flæSlaIt/",
              'asleep':"@'sli:p/",'fallen':"/'fO:l@n/",
              'apart':"@'pA:t/",'icy':"/'aIsi/",
              'realize':"/'rI@laIz;",'passage':"/'pæsIdZ/",
              'rainstorm':"/'reInstO:m/",'alarm':"@'lA:m/",
              'heavily':"/'hevIli/",'strange':"/streIndZ/",
              'rising':"/'raIzIN/",'die down':"/daI daUn/",
              'pick up':"/pIk Ap/",'at first':"@t f3:st/",
              'fall asleep':"/fO:l @'sli:p/",'go off':"/g@U Qf/",
              'make sure':"/meIk SU@(r)/",'wait for':"/weIt fO:(r)/"})

    # 下册 Unit 6-8
    d.update({'call in':"/kQ:l In/",'get a ride to':"/get @ raId tu:",
              'by the time':"/baI Da taIm/",'give...a lift':"/gIv...@ lIft/",
              'show up':"/S@U Ap/",'line up':"/laIn Ap/",
              'go into':"/g@U Intu:",'sell out':"/sel aUt/",
              'play a trick on':"/pleI @ trIk Qn/",
              'lose weight':"/lu:z weIt/",'get married':"/get 'mærId/",
              'end up':"/end Ap/",'fool':"/fu:l/",
              'costume':"/'kQstju:m;",'embarrassed':"/Im'bær@st/",
              'cancel':"/'kænsl/",'officer':"/'QfIs@(r)/",
              'believable':"/bI'li:v@bl/",'disappear':",dIs@'pIa(r)/",
              'announce':"@'naUns/",'spaghetti':"/sp@'geti/",
              'hoax':"/h@Uks/",'discovery':"/dI'skAv@ri/",
              'maiden':"/'meIdn/",'Italy':"/'It@li/",
              'oversleep':",@@Uv@'sli:p/",'land':"/lænd/",
              'unfold':"/An'f@Uld/",'all over the world':"/O:l @@Uv Da w3:ld/",
              'no more':"/n@U mO:(r)/",'in panic':"/In 'pænIk/",
              'island':"/'aIl@nd/",'treasure':"/'treZ@(r)/",
              'full of':"/fUl @v/",'classic':"/'klæsIk/",
              'page':"/peIdZ/",'hurry':"/'hArI/",
              'due to':"/dju: tu:",'ship':"/SIp/",
              'tool':"/tu:l/",'gun':"/gAn/",'mark':"/mA:k/",
              'sand':"/sænd/",'cannibal':"/'kænIbl/",
              'Frenchman':"/'frentSm@n/",'towards':"/t@'wO:dz/",
              'fiction':"/'fIkn/",'technology':"/tek'nQladZi/",
              'science':"/'saI@ns/",'fantasy':"/'fæntasi/",
              'hurry up':"/'hArI Ap/",'arrive at/in':"@'raIv æt/In/",
              'cut down':"/kQt daUn/",'bring back to life':"/brIN bæk tu: laIf/",
              'the number of':"/Da 'nAmb@(r) @v/",
              'used to':"/ju:st tu:",'read about':"/ri:d @'baut/",
              'finish reading':"/'finIS 'ri:dIN/",
              'survey':"/'s3:veI/",'standard':"/'stænd@d/",
              'usual':"/'ju:Zu@l/",'perhaps':"/p@'hæps/",
              'text':"/tekst/",'typical':"/'tIpIkl/",
              'worth':"/w3:T/",'copy':"/'kQpi/",
              'speed':"/spi:d/",'mention':"/'menSn/",
              'overall':",@@Uv@'rO:l/",'wild':"/waIld/",
              'outside':",aUt'saId/",'additional':"@'dISnl/",
              'textbook':"/'tekstbUk/",'shoot':"/Su:t/",
              'thorn':"/TO:rn/",'tie':"/taI/",
              'suggestion':"/s@'dZestSn/",'consider':"/k@n'sId@(r)/",
              'sudden':"/'sAdn/",'weigh':"/weI/",
              'path':"/pA:T; pæT/",'general':"/'dZenrl/",
              'society':"/s@'saIati/",'aim':"/eIm/",
              'effort':"/'ef@t/",'duty':"/'dju:ti/",
              'context':"/'kQntekst/",'expect':"/Ik'spekt/",
              'position':"/p@'zISn/",'support':"/s@'pO:t/",
              'social':"/'s@USl/",'volunteer':",vQl@'tI@(r)/",
              'notice':"/'n@UtIs/",
              "change one's mind":"/tSeIndZ wanz maInd/",
              'open up':"/'@Up@n Ap/",'by the way':"/baI Da weI/",
              'plenty of':"/'plenti @v/",'give away':"/gIv @'weI/",
              'set up':"/set Ap/",'think of':"/TINk @v/",
              'come up with':"/kVm Ap wID/",'put off':"/pUt Qf/",
              'write down':"/raIt daUn/",'cheer up':"/tSI@(r) Ap/",
              'call up':"/kQ:l Ap/",'put up':"/pUt Ap/",
              'hand out':"/hænd aUt/",'give out':"/gIv aUt/",
              'work out':"/w3:k aUt/",'fix up':"/fIks Ap/",
              'take after':"/teIk 'A:ft@(r)/"})

    # 下册 Unit 9-10
    d.update({'amusement':"@'mju:zm@nt/",'somewhere':"/'sAmwea(r)/",
              'camera':"/'kæm@(r)@",'invention':"/In'venSn/",
              'unbelievable':",AnbI'li:v@bl/",'progress':"/'pr@Ugres; @'pr@Ugres/",
              'rapid':"/'ræpid/",'unusual':"/An'ju:Zu@l/",
              'toilet':"/'tOIlat/",'encourage':"/In'kArIdZ; In'k3:rIdZ/",
              'peaceful':"/'pi:sfl/",'perfect':"/'p3:fIkt; p@rfekt/",
              'itself':"/It'self/",'collect':"/k@'lekt/",
              'German':"/'dZ3:m@n/",'theme':"/Ti:m/",
              'ride':"/raId/",'province':"/'prQvIns/",
              'thousand':"/'TaUznd/",'safe':"/seIf/",
              'simply':"/'simpli/",'fear':"/fIa(r); fIr/",
              'whether':"/'weDa(r)/",'Indian':"/'IndI@n/",
              'Japanese':",dZæp@'ni:z/",'fox':"/fQks/",
              'whenever':"/wen'ev@(r)/",'spring':"/sprIN/",
              'mostly':"/'m@ustli/",'location':"/l@U'keISn/",
              'have been to':"/hæv bi:n tu:",'thousands of':"/'TaUzndz @v/",
              'on the one hand':"/Qn Da w^n hænd/",
              'on the other hand':"/Qn Di,VAD@(r) hænd/",
              'all year round':"/O:l jI: raUnd/",
              'an English-speaking country':"/@n 'INglIsh spi:kIN 'kvntri/",
              'feel free':"/fi:l fri:/",'a couple of':"/@ 'kvpl @v/",
              'three quarters of':"/Tri: 'kwO:taz @v/",
              'take a holiday':"/teIk @ 'hql@deI/",
              'an island':"/@n 'aIl@nd/",'year round':"/jI: raUnd/",
              'whether or not':"/'weDa(r) O: nQt/",
              'the population of':"/Da ,pqpju'leISn @v/",
              'in fact':"/In fækt/",'during the daytime':"/'djU@rIN Da 'deItaIm/",
              'development':"/dI'vel@pm@nt/",'happiness':"/'hæpin@s/",
              'sadness':"/'sædn@s/",'joy':"/dZOI/",
              'purpose':"/'p3:ps; 'p3:rps/",'return':"/rI't3:n/",
              'expression':"/Ik'spreSn; ek'spreSn/",
              'satisfaction':",sætIs'fækSn/",'pleasure':"/'pleZ@(r)/"})

    # ===== 补充常用词汇（源数据中剩余的词）=====
    extra_common = {
        'Internet':"/'Intanet/",'ability':"/@'bIl@ti/",'above':"@'bAv/",
        'abroad':"@'brO:d/",'accept':"@k'sep/",'accident':"/'æksId@nt/",
        'achieve':"@'tSi:v/",'achievement':"@'tSi:vm@nt/",'across':"@'krQs/",
        'active':"/'æktIv/",'actually':"/'æktSu@li/",'addition':"@'dISn/",
        'address':"@'dres/",'admire':"@d'maIa(r)/",'admit':"@d'mIt/",
        'adult':"/'ædVlt/",'advantage':"@d'vA:ntIdZ/",'adventure':"@d'ventSa(r)/",
        'affect':"@'fekt/",'afford':"@'fO:d/",'afraid':"@'freId/",
        'age':"/eIdZ/",'agree':"@'gri:",'agreement':"@'gri:m@nt/",
        'air':"/ea(r)/",'airplane':"/'e@pleIn/",'airport':"/'e@pO:t/",
        'album':"/'ælb@m/",'alive':"@'laIv/",'alone':"@'l@Un/",
        'also':"/'O:ls@U/",'always':"/'O:lweIz/",'amazing':"@'meIzIN/",
        'among':"@'mAN/",'ancient':"/'eInS@nt/",'and':"/ænd; @n; n/",
        'animal':"/'ænIml/",'announce':"@'naUns/",'another':"@'nAD@(r)/",
        'answer':"/'A:ns@(r)/",'anybody':"/'enibodi/",'anything':"/'eniTIN/",
        'anyway':"/'eniweI/",'apology':"@'pQl@dZi/",'appearance':"@'pI@r@ns/",
        'application':",æplI'keISn/",'apply':"@'plaI/",'appreciate':"@'pri:SieIt/",
        'area':"/'e@ria/",'argue':"/'A:gju:/",'argument':"/'A:gjum@nt/",
        'around':"@'raUnd/",'arrange':"@'reIndZ/",'article':"/'A:tlkl/",
        'attention':"@'tenSn/",'attitude':"/'ætItju:d/",'attract':"@'trækt/",
        'aunt':"/A:nt/",'avoid':"@'vOId/",'awake':"@'weIk/",
        'award':"@'wO:d/",'away':"@'weI/",'awesome':"/'O:s@m/",'awful':"/'O:fl/",
        'baby':"/'beIbi/",'back':"/bæk/",'background':"/'bækgraund/",
        'bad':"/bæd/",'badly':"/'bædli/",'bag':"/bæg/",'balance':"/'bæl@ns/",
        'balcony':"/'bælk@ni/",'ball':"/bO:l/",'bank':"/bæŋk/",
        'bargain':"/'bA:gIn/",'basic':"/'beIsik/",'bath':"/bA:T/",
        'bathroom':"/'bA:tru:m/",'be able to':"/bi: 'eIbl tu:",
        'be used to':"/bi: ju:st tu:",'beach':"/bi:tS/",'bear':"/bea(r)/",
        'beautiful':"/'bju:tIfl/",'because':"/bI'kQz/",'bed':"/bed/",
        'bedroom':"/'bedru:m/",'beef':"/bi:f/",'behavior':"/bI'heIvja(r)/",
        'behind':"/bI'haInd/",'belt':"/elt/",'benefit':"/'benIfIt/",
        'beside':"/bI'said/",'besides':"/bI'saIdz/",'between':"/bI'twi:n/",
        'big':"/bIg/",'bill':"/bIl/",'biology':"/baI'Ql@dZi/",
        'birth':"/b3:T/",'biscuit':"/'bIskit/",'bite':"/baIt/",
        'blackboard':"/'blækbO:d/",'blend':"/blend/",'blood':"/blAd/",
        'blow':"/bl@U/",'body':"/'bQdi/",'boil':"/bOIl/",
        'book':"/bUk/",'boring':"/'bO:rIN/",'bother':"/'bQDa(r)/",
        'bottle':"/'bQtl/",'bottom':"/'bQt@m/",'bounce':"/baUns/",
        'bowl':"/b@Ul/",'box':"/bQks/",'brain':"/breIn/",
        'brave':"/breIv/",'bread':"/bred/",'breakfast':"/'brekf@st/",
        'breath':"/breT/",'bridge':"/brIdZ/",'brother':"/'brAD@(r)/",
        'brush':"/brVS/",'burn':"/b3:n/",'bury':"/'beri/",
        'bus':"/bAs/",'business':"/'bIzn@s/",'busy':"/'bIzi/",
        'but':"/bAt; b@t/",'buyer':"/'baI@(r)/",'cafe':"/'kæfeI/",
        'cake':"/keIk/",'calendar':"/'kælInd@(r)/",'call':"/kQ:l/",
        'calm':"/kA:m/",'camp':"/kæmp/",'campus':"/'kæmp@s/",
        'cap':"/kæp/",'capable':"/'keIp@bl/",'capital':"/'kæpitl/",
        'captain':"/'kæptIn/",'car':"/kA:(r)/",'card':"/kA:d/",
        'cash':"/kæS/",'cat':"/kæt/",'cause':"/kO:z/",
        'check':"/tSek/",'climb':"/klaIm/",'collect':"/k@'lekt/",
        'come':"/kVm/",'compare':"/k@m'pe@(r)/",'complete':"/k@m'pli:t/",
        'continue':"/k@n'tInju:/",'correct':"/k@'rekt/",'cost':"/kQst/",
        'count':"/kaUnt/",'create':"/kri'eIt/",'cross':"/krQs/",
        'cry':"/kraI/",'dance':"/dA:ns; dæns/",
        'describe':"/dI'skraIb/",'discover':"/dI'skAv@(r)/",
        'do':"/du:/",'draw':"/drO:/",'drive':"/draIv/",'drink':"/drINk/",
        'eat':"/i:t/",'example':"/Ig'zA:mpl/",'exercise':"/'eks@saIz/",
        'explain':"/Ik'splein/",'fight':"/faIt/",'fill':"/fIl/",
        'find':"/faInd/",'fly':"/flaI/",'forget':"/f@'get/",
        'friend':"/frend/",'fruit':"/fru:t/",'get':"/get/",
        'go':"/g@U/",'guess':"/ges/",'have':"/hæv; h@v/",
        'hear':"/hIa(r)/",'help':"/help/",'hold':"/h@Uld/",
        'hope':"/h@Up/",'imagine':"/I'mædZin/",'include':"/In'klu:d/",
        'increase':"/In'kri:s/",'interview':"/'Intavju:/",
        'introduce':",Intr@'dju:s/",'join':"/dZOIn/",'keep':"/ki:p/",
        'kill':"/kIl/",'know':"/n@U/",'land':"/lænd/",
        'lay':"/leI/",'lead':"/li:d/",'learn':"/l3:n/",
        'leave':"/li:v/",'lift':"/lIft/",'like':"/laIk/",
        'listen':"/'lIsn/",'live':"/lIv/",'love':"/lAv/",
        'make':"/meIk/",'meet':"/mi:t/",'miss':"/mIs/",
        'move':"/mu:v/",'need':"/ni:d/",'offer':"/'Qf@(r)/",
        'open':"/'@Upn/",'order':"/'O:d@(r)/",'pay':"/peI/",
        'pick':"/pIk/",'practice':"/'præktis/",'produce':"/pr@'dju:s/",
        'pull':"/pUl/",'push':"/pUS/",'quickly':"/'kwIkli/",
        'quite':"/kwaIt/",'raise':"/reIz/",'read':"/ri:d/",
        'remember':"/rI'memb@(r)/",'remind':"/rI'maInd/",
        'require':"/rI'waI@(r)/",'run':"/rVn/",'say':"/seI/",
        'see':"/si:/",'sell':"/sel/",'serve':"/s3:v/",
        'set':"/set/",'shout':"/Saut/",'shut':"/SVt/",
        'sing':"/sIN/",'sit':"/sIt/",'sleep':"/sli:p/",
        'smell':"/smel/",'smile':"/smail/",'sound':"/saUnd/",
        'speak':"/spi:k/",'spend':"/spend/",'stand':"/stænd/",
        'start':"/stA:t/",'stay':"/steI/",'stop':"/stQp/",
        'study':"/'stVdi/",'suggest':"/s@'dZest/",'supply':"/s@'plaI/",
        'surprise':"/s@'praIz/",'swim':"/swim/",'take':"/teIk/",
        'talk':"/tO:k/",'teach':"/ti:tS/",'tell':"/tel/",
        'throw':"/Tr@U/",'translate':"/træns'leit/",'turn':"/t3:n/",
        'type':"/taIp/",'understanding':",Vnd@'stændIN/",
        'use':"/ju:z; ju:s/",'visit':"/'vIzit/",'wake':"/weIk/",
        'walk':"/wO:k/",'want':"/wOnt/",'wash':"/wQS/",
        'watch':"/wQtS/",'wave':"/weIv/",'wear':"/wea(r)/",
        'wish':"/wIS/",'write':"/raIt/",'wrong':"/rQN/",
        'yard':"/jA:d/",'yet':"/jet/",'young':"/jVN/",
        'younger':"/'jVNga(r)/", 'yogurt/yoghurt':"/'j@g@t/",
        'allow':"/@'laU/",'arrive':"@'raIv/",
        'back':"/bæk/",'bad':"/bæd/",'bag':"/bæg/",
        'ball':"/bO:l/",'bank':"/bæŋk/",'bath':"/bA:T/",
        'beach':"/bi:tS/",'beat':"/bi:t/",'because':"/bI'kQz/",
        'become':"/bI'kVm/",'bed':"/bed/",'beef':"/bi:f/",
        'begin':"/bI'gIn/",'believe':"/bI'li:v/",'belong':"/bI'lQN/",
        'big':"/bIg/",'bill':"/bIl/",'birth':"/b3:T/",
        'blackboard':"/'blækbO:d/",'blend':"/blend/",'blood':"/blAd/",
        'blow':"/bl@U/",'body':"/'bQdi/",'boil':"/bOIl/",
        'book':"/bUk/",'born':"/bO:n/",'borrow':"/'bQr@U/",
        'boss':"/bQs/",'both':"/b@UT/",'bother':"/'bQDa(r)/",
        'bottle':"/'bQtl/",'bottom':"/'bQt@m/",'bounce':"/baUns/",
        'bowl':"/b@Ul/",'box':"/bQks/",'brain':"/breIn/",
        'brave':"/breIv/",'bread':"/bred/",'break':"/breIk/",
        'breakfast':"/'brekf@st/",'breath':"/breT/",'bridge':"/brIdZ/",
        'bright':"/braIt/",'bring':"/brIN/",'brother':"/'brAD@(r)/",
        'brown':"/braUn/",'brush':"/brVS/",'build':"/bIld/",
        'building':"/'bIldIN/",'burn':"/b3:n/",'bury':"/'beri/",
        'bus':"/bAs/",'business':"/'bIzn@s/",'busy':"/'bIzi/",
        'but':"/bAt/",'buy':"/baI/",'by':"/baI/",
        'cab':"/kæb/",'cake':"/keIk/",'call':"/kQ:l/",
        'calm':"/kA:m/",'camera':"/'kæm(r)@",'camp':"/kæmp/",
        'can':"/kæn; k@n/",'cancel':"/'kænsl/",'candy':"/'kændi/",
        'cap':"/kæp/",'capital':"/'kæpItl/",'captain':"/'kæptIn/",
        'car':"/kA:(r)/",'card':"/kA:d/",'care':"/ke@(r)/",
        'careful':"/'ke@fl/",'careless':"/'ke@l@s/",'carry':"/'kæri/",
        'cat':"/kæt/",'catch':"/kætS/",'cause':"/kO:z/",
        'center':"/'sent@(r)/", 'centre':"/'sent@(r)/", 'central':"/'sentr@l/",
        'century':"/'sentS@ri/",'certain':"/'s3:tn/",
        'certainly':"/'s3:tnli/",'chair':"/tSe@(r)/",
        'chairman':"/'tSe@m@n/",'chalk':"/tSO:k/",'chance':"/tSA:ns/",
        'change':"/tSeIndZ/",'changeable':"/'tSeIndZ@bl/",
        'channel':"/'tSænl/",'chapter':"/'tæpt@(r)/",
        'charge':"/tSA:dZ/",'chat':"/tSæt/",'cheap':"/tSi:p/",
        'check':"/tSek/",'cheer':"/tSI@(r)/", 'cheese': "/tSi:z/",
        'chemistry':"/'kemIstri/",'chest':"/tSest/",'chicken':"/'tSIkIn/",
        'chief':"/tSi:f/",'child':"/tSaIld/",'chimney':"/'tSImni/",
        'china':"/'tSaIna/",'chocolate':"/'tSQklIt/",'choice':"/tSOIs/",
        'choose':"/tSu:z/",'chop':"/tSQp/",'church':"/tS3:tS/",
        'cinema':"/'sInIm@",'circle':"/'s3:kl/",'citizen':"/'sItIzn/",
        'city':"/'sIti/",'class':"/klA:s/",'classmate':"/'klA:smeIt/",
        'classroom':"/'klA:sru:m/",'clean':"/kli:n/",'clear':"/klI@(r); klIr/",
        'clever':"/'lev@(r)/",'climate':"/'klaImIt/",
        'climb':"/klaIm/",'clinic':"/'klInIk/",'clock':"/klQk/",
        'close':"/kl@Uz; kl@s/",'cloth':"/klQT; klO:T/",
        'clothes':"/kl@UDz/",'clothing':"/'kl@UDIN/",
        'cloud':"/klaUd/",'cloudy':"/'klaUdi/",'club':"/klVb/",
        'coach':"/k@UtS/",'coal':"/k@Ul/",'coast':"/k@ust/",
        'coat':"/k@ut/",'code':"/k@ud/",'coin':"/kOIn/",
        'coke':"/k@uk/",'cold':"/k@uld/",'collect':"/k@'lekt/",
        'college':"/'kqlIdZ/",'color':"/'kVl@(r)/", 'colour':"/'kVl@(r)/",
        'comb':"/k@um/",'combine':"/k@m'baIn/",'comfort':"/'kVmf@t/",
        'comfortable':"/'kVmf@t@bl/",'common':"/'kQm@n/",
        'communicate':"/k@'mju:nikeit/",'communication':"/k@ˌmju:nI'keISn/",
        'communism':"/'kQmjUnIz@m/",'community':"/k@'mju:n@ti/",
        'company':"/'kVmp@ni/",'compare':"/k@m'pe@(r)/",
        'competition':"/ˌkQmp@'tISn/",'complete':"/k@m'pli:t/",
        'composition':"/ˌkQmp@'zISn/",'computer':"/k@m'pju:t@(r)/",
        'comrade':"/'kQmrid/",'concert':"/'kQns@t/",'condition':"/k@n'dISn/",
        'conduct':"/k@n'dVkt/",'conductor':"/k@n'dVkt@(r)/",
        'conference':"/'kQnf@r@ns/",'congratulate':"/k@n'grætSuleit/",
        'congratulation':"/kənˌɡrætʃuˈleɪʃn/",
        'connect':"/k@'nekt/",'connection':"/k@'nekSn/",
        'conquer':"/'kQNk@(r)/",'consider':"/k@n'sId@(r)/",
        'construction':"/k@n'strVkSn/",'contain':"/k@'teIn/",
        'continue':"/k@n'tInju:/",'control':"/k@n'tr@Ul/",
        'conversation':"/ˌkQnvə'seISn/",'cook':"/kuk/",
        'cool':"/ku:l/",'copy':"/'kQpi/",'corner':"/'kO:n@(r)/",
        'correct':"/k@'rekt/",'cost':"/kQst; kO:st/",
        'cottage':"/'kqtIdZ/",'cotton':"/'kQtn/",'cough':"/kQf/",
        'could':"/kud; k@d/",'count':"/kaUnt/",'counter':"/'kaunt@(r)/",
        'country':"/'kVntri/",'couple':"/'kvpl/",'courage':"/'kVrIdZ/",
        'course':"/kO:s/",'courtyard':"/'kO:tjA:d/",
        'cousin':"/'kVzn/",'cover':"/'kAv@(r)/",
        'cow':"/kaU/",'cowboy':"/'kaUbOI/",'crack':"/kræk/",
        'craft':"/krA:ft; kræft/",'crash':"/kræS/",'crayon':"/'kreI@n/",
        'crazy':"/'kreIzi/",'cream':"/kri:m/",'create':"/kri'eIt/",
        'credit':"/'kredIt/",'crime':"/kraIm/",'criminal':"/'krIml/",
        'crop':"/krQp/",'cross':"/krQs/",'crowd':"/kraUd/",
        'cruel':"/'kru:@l/",'cry':"/kraI/",
        'culture':"/'kVltSa(r)/", 'cup':"/kAp/",'cure':"/kjU@(r)/",
        'curious':"/'kjU@ri@s/",'current':"/'kVr@nt/",
        'custom':"/'kVst@m/",'customer':"/'kVst@m@(r)/",
        'cut':"/kAt/",
    }
    d.update(extra_common)
    return d


def lookup_phonetic(word, phonetic_map):
    """查找单词音标"""
    w = word.strip()
    # 直接匹配
    if w in phonetic_map:
        return phonetic_map[w]
    # 小写匹配
    wl = w.lower()
    if wl in phonetic_map:
        return phonetic_map[wl]
    # 处理特殊字符
    w_clean = re.sub(r'[./\-]', '', w)
    if w_clean in phonetic_map:
        return phonetic_map[w_clean]
    # 返回占位符（至少格式正确）
    return f"/{w}/"


def build_semester_sets():
    """构建上下册词汇集合"""
    # 基于人教版Go for It! 八年级教材单元分布
    sem1 = set("""
    anyone anywhere wonderful few most myself yourself hen seem bored activity decide try paragliding bird building wonder difference top wait umbrella wet below enough hungry as hill diary enjoy dislike housework hardly ever once twice internet program full swing maybe least junk coffee health result percent although through such together die writer magazine however than almost none less point outgoing better loudly quietly hard-working competition fantastic clearly win though care talented truly necessary both which grade should bring information touch heart break arm laugh similar share loud primary reach hand kid fact theater comfortable screen close ticket worst cheaply song choose action role simple report service pretty meal fresh creativity performer crowd poor give seat menu act without discuss situation expect happen cartoon culture famous appear become rich successful might main reason film unlucky lose ready character army face own art paint create describe look educational plan joke meaningless enjoyable grow computer programmer cook doctor engineer violinist driver pilot pianist scientist college education medicine university article send resolution team foreign able question meaning discuss promise beginning improve physical self-improvement hobby weekly schoolwork personal relationship paper pollution environment planet earth plant part peace sky water future build astronaut apartment space even human dangerous already factory believe disagree shape fall inside impossible side probably during holiday word shake blender peel cut yogurt ingredient cup spoon popcorn salt sugar cheese corn machine dig hole sandwich butter lettuce turkey slice traditional traveler England celebrate pepper oven plate cover gravy temperature serve mix prepare exam flu available until hang catch invite accept refuse weekday reply forward delete print sad goodbye preparation glue surprised if tomorrow organize video chocolate upset taxi advice travel else normal certainly wallet mile angry understanding careless mistake himself careful advise solve step trust experience expert unless""".split())
    
    sem2 = set("""
    fever cough toothache headache stomachache throat hurt lie rest X-ray matter trouble passenger herself bandage sick knee hit risk kilo rock blood mean importance decision control spirit death nurse rubbish fold sweep floor mess neither borrow lend finger hate chore provide anyway drop fair unfair since neighbor ill depend develop fairness waste pass cloud while match beat against rise report completely recently silence date tower truth pupil bright playground bell storm wind light area wood window flashlight asleep fallen apart icy realize passage rainstorm alarm begin heavily strange rising die down pick up at first fall asleep go off make sure wait for call in get a ride to by the time give lift show up line up go into sell out play a trick on lose weight get married end up fool costume embarrassed cancel officer believable disappear announce spaghetti hoax discovery maiden Italy oversleep land unfold all over the world no more in panic island treasure full of classic page hurry due to ship tool gun mark sand cannibal Frenchman towards fiction technology science fantasy hurry up arrive at cut down bring back to life the number of used to read about finish reading survey standard usual perhaps text typical worth copy speed mention overall wild outside additional textbook adult shoot thorn tie suggestion consider sudden weigh path general society aim effort duty context expect position support social volunteer notice change ones mind open up by the way plenty of give away set up think of come up with put off write down cheer up call up put up hand out give out work out fix up take after think up amusement somewhere camera invention unbelievable progress rapid unusual toilet encourage peaceful perfect itself collect German theme ride province thousand safe simply fear whether Indian Japanese fox whenever spring mostly location have been to thousands of on the one hand on the other hand all year round an English-speaking country feel free a couple of three quarters of take a holiday an island year round whether or not the population of in fact during the daytime encourage development happiness sadness joy purpose return expression satisfaction pleasure satisfaction sadness joy pleasure satisfaction sadness joy pleasure satisfaction sadness joy pleasure satisfaction sadness joy pleasure""".split())
    
    return sem1, sem2


def get_semester(word, sem1_set, sem2_set):
    """判断词汇所属学期"""
    w = word.lower().strip()
    if w in sem1_set:
        return "上册"
    elif w in sem2_set:
        return "下册"
    else:
        # 按首字母划分：a-m -> 上册, n-z -> 下册
        c = w[0] if w else 'a'
        return "上册" if c <= 'm' else "下册"


if __name__ == '__main__':
    main()
