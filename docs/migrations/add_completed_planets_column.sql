-- ============================================================
-- 星球打卡数据云同步 - 数据库 Schema 迁移
-- 文件: docs/migrations/add_completed_planets_column.sql
-- 说明: 为 users 表新增 completed_planets 列（JSONB 类型）
--       用于存储用户星球打卡数据，支持跨设备同步
--
-- 执行方式: 在 Supabase SQL Editor 中运行此脚本
-- ============================================================

-- 检查并添加 completed_planets 列（如果不存在）
DO $$
BEGIN
    -- 如果 users 表不存在 completed_planets 列则添加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'completed_planets'
    ) THEN
        ALTER TABLE users ADD COLUMN completed_planets JSONB DEFAULT '{}';
        
        RAISE NOTICE '✅ 已成功添加 completed_planets 列 (JSONB)';
    ELSE
        RAISE NOTICE 'ℹ️  completed_planets 列已存在，无需操作';
    END IF;
END $$;

-- 验证结果
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name IN ('xp', 'streak_count', 'completed_planets');
