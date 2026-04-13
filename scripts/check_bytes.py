import re

with open('src/data/questions_politics_choice.json', 'rb') as f:
    content = f.read()

# Find all bytes that look like " (0x22) that might be Chinese quotes
# Check if there are any bytes between 0x80-0xBF that look like curly quotes
# Chinese left double quote " = U+201C = E2 80 9C
# Chinese right double quote " = U+201D = E2 80 9D

print("Looking for U+201C (E2 80 9C)...")
idx = 0
while True:
    pos = content.find(b'\xe2\x80\x9c', idx)
    if pos == -1:
        break
    print(f"  Found at byte {pos}, line {content[:pos].count(b'\\n')+1}")
    ctx = content[max(0,pos-10):pos+15]
    print(f"  Context bytes: {ctx}")
    idx = pos + 1

print("Looking for U+201D (E2 80 9D)...")
idx = 0
while True:
    pos = content.find(b'\xe2\x80\x9d', idx)
    if pos == -1:
        break
    print(f"  Found at byte {pos}, line {content[:pos].count(b'\\n')+1}")
    ctx = content[max(0,pos-10):pos+15]
    print(f"  Context bytes: {ctx}")
    idx = pos + 1

# Also check for actual ASCII quotes that break JSON
# Look at line 10 specifically
lines = content.split(b'\n')
print(f"\nLine 10 raw bytes:")
line10 = lines[9]
for i, b in enumerate(line10):
    if b == 0x22:  # ASCII double quote
        print(f"  col {i}: ASCII double quote")
    if b > 0x7f:
        print(f"  col {i}: byte {b:02x} (high)")
