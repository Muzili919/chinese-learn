#!/usr/bin/env python3
# 生成音标JSON文件 - 最简方式
import json

ph = {}

# A
words_a = """ability above abroad accept accident achieve across action active activity actually add address admire admit adult advantage adventure advise affect afford afraid after afternoon again against age ago agree ahead air airplane airport alarm album alive all allow almost alone along aloud already also although always amazing among amount an and angry animal another answer any anyone anything anywhere anyway appear apple April area argue arm around arrive art article as Asian ask asleep at attention August aunt autumn avoid awake away""".split()

for w in words_a:
    ph[w] = f"/{w}/"  # 占位符，后续替换

print(f"Built {len(ph)} entries (A)")
with open('scripts/phonetics_g8.json', 'w') as f:
    json.dump(ph, f, ensure_ascii=False)
print("Saved to scripts/phonetics_g8.json")
