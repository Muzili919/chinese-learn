#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate 800-word junior high year 2 vocabulary network JSON for 人教版八年级."""
import json

words = {}
def add(w, m, cat, tier, freq, assoc, conf, ex, tip):
    words[w] = {"word":w,"meaning":m,"category":cat,"tier":tier,"frequency":freq,
                "associations":assoc,"confusables":conf,"example":ex,"memory_tip":tip}

# Read tier1 verbs from source file
exec(open("/Volumes/ORICO/xinwen/claudecode/chinese-learn/scripts/gen_words_j2_part1.py").read())

# === TIER 1 ADJECTIVES ===
exec(open("/Volumes/ORICO/xinwen/claudecode/chinese-learn/scripts/gen_words_j2_part2.py").read())

# === TIER 1 NOUNS + TIER 2 + TIER 3 ===
exec(open("/Volumes/ORICO/xinwen/claudecode/chinese-learn/scripts/gen_words_j2_part3.py").read())

# Save final JSON
data_out = {"meta":{"total":len(words),"generated_at":"2026-04-12","version":"junior2_v1"},"words":words}
with open("/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/words_network_j2.json","w",encoding="utf-8") as f:
    json.dump(data_out, f, ensure_ascii=False, indent=2)
print(f"Total words: {len(words)}")
print("Saved to words_network_j2.json")
