-- ============================================================
-- 邀请码系统 - Supabase 数据库迁移脚本
-- 运行方式：在 Supabase Dashboard → SQL Editor 中执行
-- ============================================================

-- Step 1: 创建邀请码表（如果不存在）
CREATE TABLE IF NOT EXISTS invitation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT,                    -- 码的名称/用途说明，如"老王家"、"一年级A班"
  max_uses INTEGER DEFAULT NULL, -- null = 不限人数
  used_count INTEGER NOT NULL DEFAULT 0,
  created_by TEXT DEFAULT 'admin',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- 确保 used_count 不为负数
  CONSTRAINT check_nonnegative_used_count CHECK (used_count >= 0)
);

-- Step 2: 插入4个初始邀请码（各自限制10人）
INSERT INTO invitation_codes (code, name, max_uses, is_active) VALUES
  ('love1234', '家庭码1', 10, true),
  ('love2234', '家庭码2', 10, true),
  ('love3234', '班级码1', 10, true),
  ('love4234', '班级码2', 10, true)
ON CONFLICT (code) DO NOTHING;  -- 防止重复执行报错

-- Step 3: 设置 RLS（行级安全策略）——允许匿名用户读取和更新
ALTER TABLE invitation_codes ENABLE ROW LEVEL SECURITY;

-- 允许任何人查询有效的邀请码（验证时需要）
CREATE POLICY "Anyone can view active invite codes"
  ON invitation_codes FOR SELECT
  USING (is_active = true);

-- 允许任何人更新使用计数
CREATE POLICY "Anyone can update usage count"
  ON invitation_codes FOR UPDATE
  USING (is_active = true)
  WITH CHECK (is_active = true);

-- ============================================================
-- 执行完成后，可以用以下命令验证：
--   SELECT * FROM invitation_codes;
-- 应该看到4条记录，每个 max_uses=10, used_count=0
-- ============================================================
