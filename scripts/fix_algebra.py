#!/usr/bin/env python3
"""精确修复整式运算题库: 统一^为Unicode上标 + 修复2道数学错误"""
import json

with open('src/data/questions_math_junior_algebra.json', 'r') as f:
    data = json.load(f)

qmap = {q['id']: q for q in data}

# --- ja010: x^(2m-1) → x²ᵐ⁻¹ ---
q = qmap['math_ja010']
q['question'] = "若3x²ᵐ⁻¹y³与-2x⁵yⁿ是同类项，m+n=（）"
q['options'] = [
    "A. x³ⁿ⁻¹",
    "B. x³ⁿ⁺¹",
    "C. xⁿ⁻¹",
    "D. xⁿ²⁺ⁿ⁻²"
]
q['answer'] = q['options'][0]

# --- ja022: x^(2n+1)·x^(n-2) → x²ⁿ⁺¹·xⁿ⁻² ---
q = qmap['math_ja022']
q['question'] = "x²ⁿ⁺¹·xⁿ⁻²(n>2)=（）"
q['options'] = [
    "A. x³ⁿ⁻¹",
    "B. x³ⁿ⁺¹",
    "C. xⁿ⁻¹",
    "D. xⁿ²⁺ⁿ⁻²"
]
q['answer'] = q['options'][0]
q['analysis'] = "指数相加: (2n+1)+(n-2)=3n-1。"

# --- ja024: 3^m → 3ᵐ, 3^n → 3ⁿ, 3^(m+n) → 3ᵐ⁺ⁿ ---
q = qmap['math_ja024']
q['question'] = "若3ᵐ=5,3ⁿ=7，则3ᵐ⁺ⁿ=（）"
q['options'] = ["A. 12", "B. 35", "C. 2", "D. 5/7"]
q['answer'] = "B. 35"
q['analysis'] = "=3ᵐ×3ⁿ=5×7=35。幂乘法逆用。"

# --- ja030: (2^a)^b → (2ᵃ)ᵇ ---
q = qmap['math_ja030']
q['question'] = "若(2ᵃ)ᵇ=64且a·b=6，不可能的是（）"
q['options'] = ["A. a=1,b=6", "B. a=2,b=3", "C. a=3,b=2", "D. a=4,b=1"]
q['answer'] = "D. a=4,b=1"
q['analysis'] = "2ᵃᵇ=64=2⁶，需ab=6。D中4×1=4≠6。"

# --- ja058: 修复多项式除法余式错误 ---
q = qmap['math_ja058']
q['question'] = "(2x³-6x²+5x-3)÷(x²-2x)=（）"
q['analysis'] = ("第1步：2x³/x²=2x，被除式减去2x(x²-2x)=2x³-4x²得余式"
                 "-2x²+5x-3；第2步：-2x²/x²=-2，余式减(-2)(x²-2x)"
                 "得x-3(次数<2停止)。商2x-2，余x-3。")

# --- ja060: 修复逻辑矛盾 ---
q = qmap['math_ja060']
q['question'] = "若x²+y²+z²=xy+yz+zx，则下列一定正确的是（）"
q['options'] = ["A. x=y=z", "B. x=-y=z", "C. xyz=1", "D. x+y+z=0"]
q['answer'] = "A. x=y=z"
q['analysis'] = ("移项得2x²+2y²+2z²-2xy-2yz-2zx=0→"
                "(x-y)²+(y-z)²+(z-x)²=0。三个非负数之和为0"
                "则每个均为0，故x=y=z。")

with open('src/data/questions_math_junior_algebra.json', 'w') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

# === 验证 ===
with open('src/data/questions_math_junior_algebra.json', 'r') as f:
    content = f.read()

caret_count = content.count('^')
fresh_data = json.loads(content)

print(f"=== 最终验证 ===")
print(f"^ 残留: {caret_count} {'✅' if caret_count==0 else '❌'}")
print(f"总题数: {len(fresh_data)}")

ok = True
for q in fresh_data:
    for k in ['id','type','question','options','answer','analysis','knowledge_tag','topic','difficulty','grade']:
        if k not in q:
            print(f"❌ {q.get('id')} missing {k}")
            ok = False
if ok:
    print("✅ 字段完整性: 全部通过")

print("\n关键题抽查:")
for tid in ['math_ja010','math_ja022','math_ja024','math_ja030','math_ja058','math_ja060']:
    q = next(x for x in fresh_data if x['id']==tid)
    print(f"  {tid}: {q['question']} | A:{q['answer'][:25]}")
