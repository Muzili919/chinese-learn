#!/usr/bin/env python3
"""Fix all issues in questions_en_vocab.json"""

import json

def fix():
    with open('/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/questions_en_vocab.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    by_id = {q['id']: q for q in data}
    changes = []

    # 1. FIX en_vocab_042
    q = by_id['en_vocab_042']
    q['question'] = q['question'].replace('\uff083\uff09\u6709\u793c\u8c8c\u7684', '\uff083\uff09\u52e4\u52b3\u7684')
    changes.append('en_vocab_042: \u4e2d\u6587\u63d0\u793a\u201c\u6709\u793c\u8c8c\u7684\u201d\u6539\u4e3a\u201c\u52e4\u52b3\u7684\u201d')

    # 2. FIX en_vocab_066
    q = by_id['en_vocab_066']
    q['answer'] = 'C'
    q['analysis'] = '\u672c\u9898\u8003\u67e5ay/ai\u5b57\u6bcd\u7ec4\u5408\u7684\u53d1\u97f3\u3002A. play\u4e2day\u53d1/e\u026a/\uff1bB. day\u4e2day\u53d1/e\u026a/\uff1bC. says\u662fsay\u7684\u7b2c\u4e09\u4eba\u79f0\u5355\u6570\uff0cay\u53d1/e/\uff08\u7279\u6b8a\u53d1\u97f3\uff09\uff1bD. wait\u4e2dai\u53d1/e\u026a/\u3002\u6240\u4ee5says\u7684\u53d1\u97f3\u4e0e\u5176\u4ed6\u4e09\u4e2a\u4e0d\u540c\u3002'
    changes.append('en_vocab_066: \u7b54\u6848D->C\uff0csays\u7684ay\u53d1/e/')

    # 3. FIX en_vocab_046
    q = by_id['en_vocab_046']
    q['analysis'] = '\u672c\u9898\u8003\u67e5\u5b57\u6bcd\u7ec4\u5408ou\u7684\u53d1\u97f3\u3002A. house\u4e2dou\u53d1/a\u028a/\uff1bB. mouse\u4e2dou\u53d1/a\u028a/\uff1bC. young\u4e2dou\u53d1/\u028c/\uff08\u7279\u6b8a\u53d1\u97f3\uff09\uff1bD. cloud\u4e2dou\u53d1/a\u028a/\u3002\u6ce8\u610fyoung\u3001touch\u3001enough\u4e2dou\u53d1\u7279\u6b8a\u97f3/\u028c/\u3002'
    changes.append('en_vocab_046: \u91cd\u5199analysis\uff08ou\u53d1\u97f3\uff09')

    # 4. FIX en_vocab_038
    q = by_id['en_vocab_038']
    q['analysis'] = '\u672c\u9898\u8003\u67e5\u97f3\u6807\u4e0e\u5355\u8bcd\u7684\u5bf9\u5e94\u3002country\u6ce8\u610f/t\u0283/\u548c/ri/\uff0cbeautiful\u6ce8\u610f/ju\u02d0/\u548c/\u0259/\uff0cbread\u6ce8\u610fea\u53d1/e/\uff0cwet\u662f\u7b80\u5355\u77ed\u8bcd\u3002\u6ce8\u610fbeautiful\u4e2deau\u7684\u62fc\u5199\u987a\u5e8f\u3002'
    changes.append('en_vocab_038: \u79fb\u9664\u6a21\u677f\u6b8b\u7559\uff08February/Saturday\uff09')

    # 5. FIX en_vocab_028 phonetic notation
    q = by_id['en_vocab_028']
    q['question'] = q['question'].replace('/\u02c8eks\u0259sa\u026as/', '/\u02c8eks\u0259sa\u026az/').replace('/\u02c8m\u028cn.de\u026a/', '/\u02c8m\u028cnde\u026a/')
    changes.append('en_vocab_028: \u4fee\u6b63\u97f3\u6807')

    # 6. FIX "划线部分" + add bold for all 24 pronunciation questions
    pron_fixes = {
        'en_vocab_001': 'a',
        'en_vocab_006': 'ea',
        'en_vocab_011': 'or',   # will be replaced anyway but do it for consistency
        'en_vocab_016': 'th',
        'en_vocab_021': 'oo',
        'en_vocab_026': 'wh',
        'en_vocab_031': 'ow',
        'en_vocab_036': 'ie',   # will be replaced
        'en_vocab_041': 'i',
        'en_vocab_046': 'ou',
        'en_vocab_051': 'ch',
        'en_vocab_056': 'al',   # will be replaced
        'en_vocab_061': 'ng',   # will be replaced
        'en_vocab_066': 'ay',
        'en_vocab_071': 'gh',
        'en_vocab_076': 's',
        'en_vocab_081': 'w',    # will be replaced
        'en_vocab_086': 'ere',
        'en_vocab_091': 'ee',   # will be replaced
        'en_vocab_096': 'ear',
        'en_vocab_101': 'tion', # will be replaced
        'en_vocab_106': 'c',    # will be replaced
        'en_vocab_111': 'o',    # will be replaced
        'en_vocab_116': 'u',
    }

    for qid, bold_target in pron_fixes.items():
        q = by_id[qid]
        old_question = q['question']

        lines = old_question.split('\n')
        option_lines = [l for l in lines if l.strip().startswith(('A.', 'B.', 'C.', 'D.'))]

        new_options = []
        for opt_line in option_lines:
            parts = opt_line.strip().split('. ', 1)
            if len(parts) == 2:
                letter = parts[0]
                word = parts[1]
                # Remove any existing bold markers
                word_clean = word.replace('**', '')

                # Apply bold to the target
                if bold_target == 'a':
                    new_word = word_clean.replace('a', '**a**')
                elif bold_target == 'ea':
                    new_word = word_clean.replace('ea', '**ea**')
                elif bold_target == 'th':
                    new_word = word_clean.replace('th', '**th**')
                elif bold_target == 'oo':
                    new_word = word_clean.replace('oo', '**oo**')
                elif bold_target == 'wh':
                    new_word = word_clean.replace('wh', '**wh**')
                elif bold_target == 'ow':
                    new_word = word_clean.replace('ow', '**ow**')
                elif bold_target == 'i':
                    new_word = word_clean.replace('i', '**i**')
                elif bold_target == 'ou':
                    new_word = word_clean.replace('ou', '**ou**')
                elif bold_target == 'ch':
                    new_word = word_clean.replace('ch', '**ch**')
                elif bold_target == 'ay':
                    new_word = word_clean.replace('ay', '**ay**')
                elif bold_target == 'gh':
                    new_word = word_clean.replace('gh', '**gh**')
                elif bold_target == 's':
                    new_word = word_clean.replace('s', '**s**')
                elif bold_target == 'ere':
                    if 'ere' in word_clean:
                        new_word = word_clean.replace('ere', '**ere**')
                    elif 'are' in word_clean:
                        new_word = word_clean.replace('are', '**are**')
                    else:
                        new_word = word_clean
                elif bold_target == 'ear':
                    new_word = word_clean.replace('ear', '**ear**')
                elif bold_target == 'u':
                    new_word = word_clean.replace('u', '**u**')
                elif bold_target == 'or':
                    new_word = word_clean.replace('or', '**or**')
                elif bold_target == 'ie':
                    new_word = word_clean.replace('ie', '**ie**')
                elif bold_target == 'al':
                    new_word = word_clean.replace('al', '**al**')
                elif bold_target == 'ng':
                    new_word = word_clean.replace('ng', '**ng**')
                elif bold_target == 'w':
                    new_word = word_clean.replace('w', '**w**')
                elif bold_target == 'ee':
                    new_word = word_clean.replace('ee', '**ee**')
                elif bold_target == 'tion':
                    new_word = word_clean.replace('tion', '**tion**')
                elif bold_target == 'c':
                    new_word = word_clean.replace('c', '**c**')
                elif bold_target == 'o':
                    new_word = word_clean.replace('o', '**o**')
                else:
                    new_word = word_clean

                new_options.append(f'{letter}. {new_word}')

        new_question = '\u4e0b\u5217\u5404\u7ec4\u5355\u8bcd\u4e2d\uff0c\u54ea\u4e00\u4e2a\u5b57\u6bcd\uff08\u7ec4\u5408\uff09\u7684\u53d1\u97f3\u4e0e\u5176\u4ed6\u4e0d\u540c\uff1f\n\n' + '\n'.join(new_options)
        q['question'] = new_question
        changes.append(f'{qid}: \u79fb\u9664\u201c\u5212\u7ebf\u90e8\u5206\u201d\uff0c\u52a0\u7c97\u4f53\u6807\u6ce8')

    # 7. FIX en_vocab_021 difficulty
    by_id['en_vocab_021']['difficulty'] = 0.5
    changes.append('en_vocab_021: \u96be\u5ea60.7->0.5')

    # 8. FIX en_vocab_003 difficulty
    by_id['en_vocab_003']['difficulty'] = 0.7
    changes.append('en_vocab_003: \u96be\u5ea60.5->0.7')

    # ============================================================
    # 9. REPLACE DUPLICATE QUESTIONS
    # ============================================================

    # en_vocab_011: a -> or pronunciation
    q = by_id['en_vocab_011']
    q['question'] = '\u4e0b\u5217\u5404\u7ec4\u5355\u8bcd\u4e2d\uff0c\u54ea\u4e00\u4e2a\u5b57\u6bcd\uff08\u7ec4\u5408\uff09\u7684\u53d1\u97f3\u4e0e\u5176\u4ed6\u4e0d\u540c\uff1f\n\nA. w**or**k\nB. f**or**k\nC. h**or**se\nD. sh**or**t'
    q['answer'] = 'A'
    q['analysis'] = '\u672c\u9898\u8003\u67e5\u5b57\u6bcd\u7ec4\u5408or\u7684\u53d1\u97f3\u3002A. work\u4e2dor\u53d1/\u025c\u02d0/\uff08w\u540eor\u7684\u7279\u6b8a\u53d1\u97f3\uff09\uff1bB. fork\u4e2dor\u53d1/\u0254\u02d0/\uff1bC. horse\u4e2dor\u53d1/\u0254\u02d0/\uff1bD. short\u4e2dor\u53d1/\u0254\u02d0/\u3002\u6ce8\u610fw\u540e\u9762or\u5e38\u53d1/\u025c\u02d0/\uff0c\u5982work\u3001world\u3001word\u3001worth\u3002'
    q['difficulty'] = 0.7
    changes.append('en_vocab_011: \u66ff\u6362\u91cd\u590da\u53d1\u97f3\u9898 -> or\u53d1\u97f3\u9898')

    # en_vocab_036: ea -> ie pronunciation
    q = by_id['en_vocab_036']
    q['question'] = '\u4e0b\u5217\u5404\u7ec4\u5355\u8bcd\u4e2d\uff0c\u54ea\u4e00\u4e2a\u5b57\u6bcd\uff08\u7ec4\u5408\uff09\u7684\u53d1\u97f3\u4e0e\u5176\u4ed6\u4e0d\u540c\uff1f\n\nA. th**ie**f\nB. **ie**ce\nC. ch**ie**f\nD. t**ie**'
    q['answer'] = 'D'
    q['analysis'] = '\u672c\u9898\u8003\u67e5\u5b57\u6bcd\u7ec4\u5408ie\u7684\u53d1\u97f3\u3002A. thief\u4e2die\u53d1/i\u02d0/\uff1bB. piece\u4e2die\u53d1/i\u02d0/\uff1bC. chief\u4e2die\u53d1/i\u02d0/\uff1bD. tie\u4e2die\u53d1/a\u026a/\u3002\u6ce8\u610fie\u5728\u540d\u8bcd/\u52a8\u8bcd\u672b\u5c3e\u5e38\u53d1/a\u026a/\uff08\u5982tie\u3001lie\u3001die\u3001pie\uff09\uff0c\u5728\u5176\u4ed6\u4f4d\u7f6e\u591a\u53d1/i\u02d0/\u3002'
    q['difficulty'] = 0.7
    changes.append('en_vocab_036: \u66ff\u6362\u91cd\u590dea\u53d1\u97f3\u9898 -> ie\u53d1\u97f3\u9898')

    # en_vocab_056: ea -> al pronunciation
    q = by_id['en_vocab_056']
    q['question'] = '\u4e0b\u5217\u5404\u7ec4\u5355\u8bcd\u4e2d\uff0c\u54ea\u4e00\u4e2a\u5b57\u6bcd\uff08\u7ec4\u5408\uff09\u7684\u53d1\u97f3\u4e0e\u5176\u4ed6\u4e0d\u540c\uff1f\n\nA. w**al**l\nB. t**al**l\nC. sm**al**l\nD. h**al**f'
    q['answer'] = 'D'
    q['analysis'] = '\u672c\u9898\u8003\u67e5\u5b57\u6bcd\u7ec4\u5408al\u7684\u53d1\u97f3\u3002A. wall\u4e2dal\u53d1/\u0254\u02d0/\uff1bB. tall\u4e2dal\u53d1/\u0254\u02d0/\uff1bC. small\u4e2dal\u53d1/\u0254\u02d0/\uff1bD. half\u4e2dal\u53d1/\u0251\u02d0/\u3002\u6ce8\u610fal\u5728\u5927\u591a\u6570\u5355\u8bcd\u4e2d\u53d1/\u0254\u02d0/\uff0c\u4f46\u5728half\u3001calm\u3001palm\u4e2d\u53d1/\u0251\u02d0/\u3002'
    q['difficulty'] = 0.7
    changes.append('en_vocab_056: \u66ff\u6362\u91cd\u590dea\u53d1\u97f3\u9898 -> al\u53d1\u97f3\u9898')

    # en_vocab_061: ch -> ng pronunciation
    q = by_id['en_vocab_061']
    q['question'] = '\u4e0b\u5217\u5404\u7ec4\u5355\u8bcd\u4e2d\uff0c\u54ea\u4e00\u4e2a\u5b57\u6bcd\uff08\u7ec4\u5408\uff09\u7684\u53d1\u97f3\u4e0e\u5176\u4ed6\u4e0d\u540c\uff1f\n\nA. r**ing**\nB. s**ing**\nC. th**ing**\nD. a**ng**ry'
    q['answer'] = 'D'
    q['analysis'] = '\u672c\u9898\u8003\u67e5\u5b57\u6bcd\u7ec4\u5408ng\u7684\u53d1\u97f3\u3002A. ring\u4e2dng\u53d1/\u014b/\uff1bB. sing\u4e2dng\u53d1/\u014b/\uff1bC. thing\u4e2dng\u53d1/\u014b/\uff1bD. angry\u4e2dng\u53d1/\u014bg/\u3002\u6ce8\u610fng\u5728\u8bcd\u5c3e\u5e38\u53d1/\u014b/\uff0c\u5728\u8bcd\u4e2d\u5e38\u53d1/\u014bg/\uff08\u5982angry\u3001finger\u3001English\uff09\u3002'
    q['difficulty'] = 0.5
    changes.append('en_vocab_061: \u66ff\u6362\u91cd\u590dch\u53d1\u97f3\u9898 -> ng\u53d1\u97f3\u9898')

    # en_vocab_081: th -> w silent letter pronunciation
    q = by_id['en_vocab_081']
    q['question'] = '\u4e0b\u5217\u5404\u7ec4\u5355\u8bcd\u4e2d\uff0c\u54ea\u4e00\u4e2a\u5b57\u6bcd\u7684\u53d1\u97f3\u4e0e\u5176\u4ed6\u4e0d\u540c\uff1f\n\nA. **w**rite\nB. **w**rong\nC. **w**indow\nD. **w**rap'
    q['answer'] = 'C'
    q['analysis'] = '\u672c\u9898\u8003\u67e5\u5b57\u6bcdw\u7684\u53d1\u97f3\u3002A. write\u4e2dw\u4e0d\u53d1\u97f3\uff1bB. wrong\u4e2dw\u4e0d\u53d1\u97f3\uff1bD. wrap\u4e2dw\u4e0d\u53d1\u97f3\uff1bC. window\u4e2dw\u53d1/w/\u3002\u6ce8\u610fw\u5728wr\u5f00\u5934\u7684\u8bcd\u4e2d\u4e0d\u53d1\u97f3\uff08write\u3001wrong\u3001wrap\uff09\u3002'
    q['difficulty'] = 0.5
    changes.append('en_vocab_081: \u66ff\u6362\u91cd\u590dth\u53d1\u97f3\u9898 -> w\u53d1\u97f3\u9898')

    # en_vocab_091: oo -> ee pronunciation
    q = by_id['en_vocab_091']
    q['question'] = '\u4e0b\u5217\u5404\u7ec4\u5355\u8bcd\u4e2d\uff0c\u54ea\u4e00\u4e2a\u5b57\u6bcd\uff08\u7ec4\u5408\uff09\u7684\u53d1\u97f3\u4e0e\u5176\u4ed6\u4e0d\u540c\uff1f\n\nA. c**off**ee\nB. s**ee**\nC. tr**ee**\nD. n**ee**d'
    q['answer'] = 'A'
    q['analysis'] = '\u672c\u9898\u8003\u67e5\u5b57\u6bcd\u7ec4\u5408ee\u7684\u53d1\u97f3\u3002B. see\u4e2dee\u53d1/i\u02d0/\uff1bC. tree\u4e2dee\u53d1/i\u02d0/\uff1bD. need\u4e2dee\u53d1/i\u02d0/\uff1bA. coffee\u4e2dee\u53d1/i/\uff08\u77ed\u97f3\uff09\u3002\u6ce8\u610fee\u901a\u5e38\u53d1/i\u02d0/\uff0c\u4f46\u5728coffee\u4e2d\u53d1\u77ed\u97f3/i/\u3002'
    q['difficulty'] = 0.5
    changes.append('en_vocab_091: \u66ff\u6362\u91cd\u590doo\u53d1\u97f3\u9898 -> ee\u53d1\u97f3\u9898')

    # en_vocab_101: th -> tion pronunciation
    q = by_id['en_vocab_101']
    q['question'] = '\u4e0b\u5217\u5404\u7ec4\u5355\u8bcd\u4e2d\uff0c\u54ea\u4e00\u4e2a\u5b57\u6bcd\uff08\u7ec4\u5408\uff09\u7684\u53d1\u97f3\u4e0e\u5176\u4ed6\u4e0d\u540c\uff1f\n\nA. ac**tion**\nB. na**tion**\nC. ques**tion**\nD. sta**tion**'
    q['answer'] = 'C'
    q['analysis'] = '\u672c\u9898\u8003\u67e5\u5b57\u6bcd\u7ec4\u5408tion\u7684\u53d1\u97f3\u3002A. action\u4e2dtion\u53d1/\u0283n/\uff1bB. nation\u4e2dtion\u53d1/\u0283n/\uff1bD. station\u4e2dtion\u53d1/\u0283n/\uff1bC. question\u4e2dtion\u53d1/t\u0283n/\u3002\u6ce8\u610ftion\u901a\u5e38\u53d1/\u0283n/\uff0c\u4f46\u5728question\u4e2d\u53d1/t\u0283n/\u3002'
    q['difficulty'] = 0.7
    changes.append('en_vocab_101: \u66ff\u6362\u91cd\u590dth\u53d1\u97f3\u9898 -> tion\u53d1\u97f3\u9898')

    # en_vocab_106: th -> c pronunciation
    q = by_id['en_vocab_106']
    q['question'] = '\u4e0b\u5217\u5404\u7ec4\u5355\u8bcd\u4e2d\uff0c\u54ea\u4e00\u4e2a\u5b57\u6bcd\u7684\u53d1\u97f3\u4e0e\u5176\u4ed6\u4e0d\u540c\uff1f\n\nA. **c**ity\nB. **c**at\nC. **c**up\nD. **c**lass'
    q['answer'] = 'A'
    q['analysis'] = '\u672c\u9898\u8003\u67e5\u5b57\u6bcdc\u7684\u53d1\u97f3\u3002B. cat\u4e2dc\u53d1/k/\uff1bC. cup\u4e2dc\u53d1/k/\uff1bD. class\u4e2dc\u53d1/k/\uff1bA. city\u4e2dc\u53d1/s/\u3002\u6ce8\u610fc\u5728e\u3001i\u3001y\u524d\u5e38\u53d1/s/\uff08\u5982city\u3001center\u3001cycle\uff09\uff0c\u5728a\u3001o\u3001u\u524d\u5e38\u53d1/k/\u3002'
    q['difficulty'] = 0.5
    changes.append('en_vocab_106: \u66ff\u6362\u91cd\u590dth\u53d1\u97f3\u9898 -> c\u53d1\u97f3\u9898')

    # en_vocab_111: a -> o pronunciation
    q = by_id['en_vocab_111']
    q['question'] = '\u4e0b\u5217\u5404\u7ec4\u5355\u8bcd\u4e2d\uff0c\u54ea\u4e00\u4e2a\u5b57\u6bcd\u7684\u53d1\u97f3\u4e0e\u5176\u4ed6\u4e0d\u540c\uff1f\n\nA. h**o**t\nB. d**o**g\nC. n**o**se\nD. b**o**x'
    q['answer'] = 'C'
    q['analysis'] = '本题考查元音字母o在开闭音节中的发音。A. hot中o发/ɒ/（闭音节）；B. dog中o发/ɒ/（闭音节）；D. box中o发/ɒ/（闭音节）；C. nose中o发/əʊ/（开音节）。闭音节中o发短音/ɒ/，开音节中发字母本音/əʊ/。'
    q['difficulty'] = 0.5
    changes.append('en_vocab_111: \u66ff\u6362\u91cd\u590da\u53d1\u97f3\u9898 -> o\u53d1\u97f3\u9898')

    # 10. Verify answer format
    for q in data:
        if q['type'] == 'multiple_choice':
            ans = q['answer'].strip()
            if len(ans) != 1 or ans not in 'ABCD':
                print(f"WARNING: {q['id']} answer format: '{ans}'")

    # Write output
    with open('/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/questions_en_vocab.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f'Total changes: {len(changes)}')
    for c in changes:
        print(f'  - {c}')
    print('Done!')

if __name__ == '__main__':
    fix()
