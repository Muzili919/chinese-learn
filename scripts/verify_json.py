import json, re

with open('src/data/questions_politics_choice.json', 'r', encoding='utf-8') as f:
    content = f.read()

# Check for problematic characters
left_quote = '\u201c'  # "
right_quote = '\u201d'  # "

count_left = content.count(left_quote)
count_right = content.count(right_quote)
print(f'Left Chinese quotes: {count_left}')
print(f'Right Chinese quotes: {count_right}')

# These are valid inside JSON strings - let's try to parse
# If parsing fails, we need to replace them
try:
    data = json.loads(content)
    print('JSON parsed successfully')
    print(f'Total questions: {len(data)}')
except json.JSONDecodeError as e:
    print(f'JSON parse error: {e}')
    print(f'Error at line {e.lineno}, column {e.colno}')
    # Show the problematic area
    lines = content.split('\n')
    if e.lineno <= len(lines):
        line = lines[e.lineno - 1]
        start = max(0, e.colno - 30)
        end = min(len(line), e.colno + 30)
        print(f'Context: ...{line[start:end]}...')
