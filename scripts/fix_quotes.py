#!/usr/bin/env python3
"""Fix unescaped ASCII double quotes inside JSON string values."""
import json

with open('src/data/questions_politics_choice.json', 'r', encoding='utf-8') as f:
    raw = f.read()

# Find all raw double quotes that are problematic
# A proper JSON double quote at the start of a string is preceded by:
#   - beginning of file
#   - whitespace after : , [ {
# A proper JSON double quote at the end of a string is followed by:
#   - : , } ] whitespace (and then one of these)
#   - end of file

# We'll do a character-by-character scan
# State machine:
#   OUTSIDE: not in a string
#   INSIDE: in a string, between opening and closing quotes

result = []
i = 0
n = len(raw)
state = 'OUTSIDE'  # OUTSIDE or INSIDE

while i < n:
    ch = raw[i]
    
    if state == 'OUTSIDE':
        if ch == '"':
            # Opening a JSON string
            result.append(ch)
            state = 'INSIDE'
        else:
            result.append(ch)
    
    elif state == 'INSIDE':
        if ch == '\\' and i + 1 < n:
            # Escape sequence - output both chars
            result.append(ch)
            result.append(raw[i+1])
            i += 2
            continue
        elif ch == '"':
            # Potential closing quote or unescaped inline quote
            # Look ahead to determine
            j = i + 1
            while j < n and raw[j] in (' ', '\t'):
                j += 1
            
            if j >= n or raw[j] in (',', '}', ']', ':'):
                # This is a proper closing quote
                result.append(ch)
                state = 'OUTSIDE'
            else:
                # This is an unescaped quote inside the string value
                result.append('\\"')
        else:
            result.append(ch)
    
    i += 1

fixed = ''.join(result)

# Count differences
orig_quotes = raw.count('"')
fixed_quotes = fixed.count('"')
print(f'Original quote count: {orig_quotes}')
print(f'Fixed quote count: {fixed_quotes}')
print(f'Net change: {fixed_quotes - orig_quotes}')

with open('src/data/questions_politics_choice.json', 'w', encoding='utf-8') as f:
    f.write(fixed)

# Verify
try:
    data = json.loads(fixed)
    print(f'JSON valid! {len(data)} questions loaded.')
except json.JSONDecodeError as e:
    print(f'Still invalid at line {e.lineno}, col {e.colno}: {e.msg}')
    error_lines = fixed.split('\n')
    if e.lineno <= len(error_lines):
        eline = error_lines[e.lineno - 1]
        start = max(0, e.colno - 50)
        end = min(len(eline), e.colno + 50)
        print(f'Context: ...{eline[start:end]}...')
