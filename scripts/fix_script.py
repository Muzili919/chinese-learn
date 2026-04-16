#!/usr/bin/env python3
# Fix gen_g8_final.py syntax errors
with open('scripts/gen_g8_final.py', 'r') as f:
    content = f.read()

# Fix line 238: 'unless':/@n'les/} -> use double quotes properly
content = content.replace(
    "'unless':/@n'les/}",
    '"unless":"/@n\'les/"'
)

with open('scripts/gen_g8_final.py', 'w') as f:
    f.write(content)
print("Fixed!")
