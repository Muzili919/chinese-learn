#!/usr/bin/env python3
"""Build words_network_j2.json from all 4 part scripts"""
import json, sys, os

words = {}
def add(w, m, cat, tier, freq, assoc, conf, ex, tip):
    words[w] = {'word':w,'meaning':m,'category':cat,'tier':tier,'frequency':freq,'associations':assoc,'confusables':conf,'example':ex,'memory_tip':tip}

# Execute each part script in order (they all define 'entries' and use 'add')
parts = ['scripts/gen_j2_p1.py', 'scripts/gen_j2_p2.py', 'scripts/gen_j2_p3.py', 'scripts/gen_j2_p4.py']

for part_file in parts:
    with open(part_file, 'r') as f:
        content = f.read()
    
    # Extract just the entries list from each file
    # Each file has: entries = [...]
    # and calls: add(*e)
    # We need to extract entries and exec them
    
    # Remove the file I/O and other parts, keep only imports, add function def, and entries
    # Actually, simpler: just exec the whole thing but replace file writes
    content = content.replace(
        "import json",
        "import json"
    )
    
    # Replace the final file output section with a no-op for parts 1-3
    if 'part1' in part_file:
        # Part 1 saves to _part1_cache.json - redirect to global words
        content = content.replace("import os\noutpath = '/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/_part1_cache.json'\nwith open(outpath, 'w', encoding='utf-8') as f:\n    json.dump(words, f, ensure_ascii=False, indent=2)\n\nprint(f'Part 1 done: {len(words)} words saved to {outpath}')", "print(f'Part 1: {len(words)} words')")
    elif 'part2' in part_file:
        # Part 2 loads from part1 cache and adds to words
        # We need to skip the load part since words already has part1 data
        # Replace the load line
        content = content.replace("with open('/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/_part1_cache.json','r') as f:\n    words = json.load(f)", "# words already loaded from part 1")
        content = content.replace("outpath = '/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/_part2_cache.json'\nwith open(outpath, 'w', encoding='utf-8') as f:\n    json.dump(words, f, ensure_ascii=False, indent=2)\n\nprint(f'Part 2 done: {len(words)} words total')", "print(f'Part 2: {len(words)} words total')")
    elif 'part3' in part_file:
        content = content.replace("with open('/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/_part2_cache.json','r') as f:\n    words = json.load(f)", "# words already loaded from parts 1-2")
        content = content.replace("outpath = '/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/_part3_cache.json'\nwith open(outpath, 'w', encoding='utf-8') as f:\n    json.dump(words, f, ensure_ascii=False, indent=2)\n\nprint(f'Part 3 done: {len(words)} words total')", "print(f'Part 3: {len(words)} words total')")
    elif 'part4' in part_file:
        content = content.replace("with open('/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/_part3_cache.json','r') as f:\n    words = json.load(f)", "# words already loaded from parts 1-3")
        # Keep the final output section but modify it
        # Remove cleanup lines
        content = content.replace("""# Cleanup temp files
import os
for p in ['_part1_cache.json','_part2_cache.json','_part3_cache.json']:
    fp = f'/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/{p}'
    if os.path.exists(fp):
        os.remove(fp)
        print(f'Cleaned up {p}')""", "# cleanup skipped")
    
    exec(content)

print(f'\nTotal unique words: {len(words)}')

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

print(f'Written {len(words)} words to {outpath}')
