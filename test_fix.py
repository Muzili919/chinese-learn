#!/usr/bin/env python3

def calculate_next_level_exp(current_level, current_next_exp):
    """计算下一级所需经验"""
    if current_level == 1:
        return 100
    else:
        return int(current_next_exp * 1.2)

def test_level_progression():
    """测试等级经验递增"""
    print("等级经验递增测试:")
    current_exp = 100
    for level in range(1, 6):
        if level == 1:
            next_exp = 100
        else:
            next_exp = int(current_exp * 1.2)
        print(f"等级 {level} -> {level + 1}: {next_exp} XP")
        current_exp = next_exp

def test_user_data_structure():
    """测试用户数据结构"""
    user = {
        "name": "test_user",
        "id": "test_id",
        "level": 1,
        "experience": 0,
        "totalExperience": 0,
        "nextLevelExp": 100
    }
    print("\n用户数据结构测试:")
    print(f"初始等级: {user['level']}")
    print(f"当前经验: {user['experience']}")
    print(f"总经验: {user['totalExperience']}")
    print(f"升级所需: {user['nextLevelExp']}")

if __name__ == "__main__":
    test_level_progression()
    test_user_data_structure()