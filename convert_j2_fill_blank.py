#!/usr/bin/env python3
"""
Convert fill_blank questions in questions_en_j2_grammar.json to multiple_choice.
25 fill_blank questions -> 4-option multiple choice with plausible distractors.
"""

import json
import random

INPUT_FILE = "/Volumes/ORICO/xinwen/claudecode/chinese-learn/src/data/questions_en_j2_grammar.json"

random.seed(42)


def make_options(correct_answer, distractors):
    """Shuffle correct + 3 distractors into A/B/C/D format."""
    assert len(distractors) == 3
    entries = [correct_answer] + distractors
    indices = list(range(4))
    random.shuffle(indices)
    options = []
    correct_letter = None
    for i, idx in enumerate(indices):
        letter = chr(ord('A') + i)
        options.append(f"{letter}. {entries[idx]}")
        if idx == 0:
            correct_letter = letter
    return options, correct_letter


# keyed by question id
CONVERSIONS = {
    "en_j2_grammar_003": (
        "lost; couldn't; Have; found",
        ["losed; can't; Did; find", "lose; couldn't; Have; found", "lost; can't; Have; find"],
    ),
    "en_j2_grammar_005": (
        "went",
        ["goed", "go", "gone"],
    ),
    "en_j2_grammar_008": (
        "Did; visit",
        ["Did; visited", "Do; visit", "Were; visiting"],
    ),
    "en_j2_grammar_012": (
        "didn't do",
        ["didn't did", "didn't done", "don't do"],
    ),
    "en_j2_grammar_015": (
        "bought",
        ["buyed", "buy", "buys"],
    ),
    "en_j2_grammar_019": (
        "lived",
        ["live", "lives", "liveed"],
    ),
    "en_j2_grammar_024": (
        "won't come",
        ["will not coming", "doesn't come", "didn't come"],
    ),
    "en_j2_grammar_028": (
        "will be",
        ["will have", "is", "was"],
    ),
    "en_j2_grammar_032": (
        "Is; going to go",
        ["Will; going to go", "Does; go", "Is; going go"],
    ),
    "en_j2_grammar_038": (
        "are playing",
        ["is playing", "play", "are play"],
    ),
    "en_j2_grammar_042": (
        "Were; studying",
        ["Did; studying", "Was; studying", "Are; studying"],
    ),
    "en_j2_grammar_052": (
        "written",
        ["wrote", "write", "writing"],
    ),
    "en_j2_grammar_057": (
        "eaten",
        ["ate", "eat", "eating"],
    ),
    "en_j2_grammar_064": (
        "will be built",
        ["will build", "is built", "was built"],
    ),
    "en_j2_grammar_068": (
        "is spoken",
        ["is speaking", "spoke", "was spoken"],
    ),
    "en_j2_grammar_073": (
        "Was; finished",
        ["Did; finish", "Did; finished", "Is; finished"],
    ),
    "en_j2_grammar_081": (
        "should listen",
        ["should to listen", "must listening", "should listened"],
    ),
    "en_j2_grammar_086": (
        "have to finish",
        ["must finishing", "has to finish", "have finish"],
    ),
    "en_j2_grammar_088": (
        "was reading; called; had lost; could; haven't seen",
        [
            "read; called; lost; could; didn't see",
            "was reading; was calling; has lost; can; haven't seen",
            "am reading; called; lost; could; don't see",
        ],
    ),
    "en_j2_grammar_094": (
        "when",
        ["what", "where", "that"],
    ),
    "en_j2_grammar_099": (
        "whose",
        ["who", "which", "whom"],
    ),
    "en_j2_grammar_103": (
        "what",
        ["that", "which", "how"],
    ),
    "en_j2_grammar_108": (
        "studies",
        ["study", "will study", "studied"],
    ),
    "en_j2_grammar_114": (
        "How",
        ["What", "What a", "What an"],
    ),
    "en_j2_grammar_119": (
        "shall we",
        ["will you", "do we", "don't we"],
    ),
}


def main():
    with open(INPUT_FILE, "r", encoding="utf-8") as f:
        questions = json.load(f)

    converted = 0
    errors = 0

    for q in questions:
        if q["type"] != "fill_blank":
            continue

        qid = q["id"]
        if qid not in CONVERSIONS:
            print(f"WARNING: No rule for {qid}, skipping")
            errors += 1
            continue

        correct, distractors = CONVERSIONS[qid]

        if correct != q["answer"]:
            print(f"ERROR: Answer mismatch for {qid}: script says '{correct}', file has '{q['answer']}'")
            errors += 1
            continue

        options, letter = make_options(correct, distractors)

        q["type"] = "multiple_choice"
        q["answer"] = letter
        q["options"] = options

        converted += 1
        print(f"OK  {qid}: '{correct}' -> {letter} | {options}")

    with open(INPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(questions, f, ensure_ascii=False, indent=2)

    print(f"\nConverted: {converted}, Errors: {errors}")
    # Verify no fill_blank remain
    remaining = sum(1 for q in questions if q["type"] == "fill_blank")
    print(f"Remaining fill_blank: {remaining}")


if __name__ == "__main__":
    main()
