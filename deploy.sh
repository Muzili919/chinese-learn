#!/bin/bash
echo "🚀 开始部署 chinese-learn 到 Vercel..."

# 1. 确保构建成功
echo "📦 构建项目..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 构建失败"
    exit 1
fi

echo "✅ 构建成功"

# 2. 推送到 GitHub
echo "📤 推送到 GitHub..."
git add .
git commit -m "🚀 部署更新: $(date '+%Y-%m-%d %H:%M:%S')" || true
git push origin main

echo "✅ 代码已推送到 GitHub"

# 3. 通过 Vercel CLI 部署
echo "🌐 部署到 Vercel..."
vercel --prod --yes

if [ $? -eq 0 ]; then
    echo "🎉 部署成功！"
    echo "🔗 生产环境地址: https://chinese-learn-*.vercel.app"
else
    echo "⚠️  Vercel CLI 部署失败，尝试通过 GitHub 集成部署"
    echo "📋 手动部署步骤:"
    echo "   1. 访问 https://vercel.com"
    echo "   2. 点击 'New Project'"
    echo "   3. 导入 GitHub 仓库: Muzili919/chinese-learn"
    echo "   4. 点击 'Deploy'"
fi

echo "📊 部署完成！"