#!/bin/bash
# ═══════════════════════════════════════════════════════════
# 一键部署：本地构建 → Aliyun（nginx静态） + GitHub（触发Vercel）
#
# 解决"两套代码必须同步"问题：
#   - 构建只跑一次（dist/ 是唯一真相来源）
#   - rsync 增量同步到阿里云，秒级完成
#   - git push 触发 Vercel 自动部署
#
# 用法：./deploy-all.sh
#       ./deploy-all.sh --skip-vercel   仅部署阿里云
#       ./deploy-all.sh --skip-aliyun   仅触发 Vercel
# ═══════════════════════════════════════════════════════════

set -e  # 任何命令失败立即退出

ALIYUN_HOST="admin@47.108.174.249"
ALIYUN_PATH="/var/www/chinese-learn"
SKIP_VERCEL=false
SKIP_ALIYUN=false

for arg in "$@"; do
  [[ "$arg" == "--skip-vercel" ]] && SKIP_VERCEL=true
  [[ "$arg" == "--skip-aliyun" ]] && SKIP_ALIYUN=true
done

echo "🚀 chinese-learn 一键部署"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Step 1: 构建 ──────────────────────────────────────────
echo "📦 Step 1/3  构建项目..."
npm run build
echo "✅ 构建完成（dist/ 已生成）"
echo ""

# ── Step 2: 同步阿里云 ────────────────────────────────────
if [ "$SKIP_ALIYUN" = false ]; then
  echo "🌏 Step 2/3  同步到阿里云..."

  # 打包 + scp 传输（Aliyun 没有 rsync，用 tar 方式）
  TMPTAR="/tmp/cl_dist_$(date +%s).tar.gz"
  echo "   打包 dist/..."
  # --exclude=*.map 减小包体积（线上不需要 sourcemap）
  tar czf "${TMPTAR}" -C dist --exclude='*.map' .
  echo "   上传到 ${ALIYUN_HOST}..."
  scp "${TMPTAR}" "${ALIYUN_HOST}:/tmp/cl_dist.tar.gz"
  rm -f "${TMPTAR}"

  echo "   解压到 ${ALIYUN_PATH}..."
  ssh "${ALIYUN_HOST}" "sudo tar xzf /tmp/cl_dist.tar.gz -C ${ALIYUN_PATH}/ && rm -f /tmp/cl_dist.tar.gz && sudo chmod -R 755 ${ALIYUN_PATH} && sudo chown -R nginx:nginx ${ALIYUN_PATH} && echo 'aliyun OK'"

  # 验证部署（检查 index.html 修改时间）
  REMOTE_DATE=$(ssh "${ALIYUN_HOST}" "sudo stat -c '%y' ${ALIYUN_PATH}/index.html 2>/dev/null || echo '无法访问'")
  echo "✅ 阿里云同步完成  index.html 修改时间: ${REMOTE_DATE}"
  echo "   🔗 http://47.108.174.249"
  echo ""
else
  echo "⏭️  Step 2/3  跳过阿里云部署"
  echo ""
fi

# ── Step 3: GitHub push → 触发 Vercel ─────────────────────
if [ "$SKIP_VERCEL" = false ]; then
  echo "📤 Step 3/3  推送到 GitHub..."

  # 检查是否有未提交的改动
  if git diff --quiet && git diff --staged --quiet; then
    echo "   （无本地改动，仅触发 push）"
  else
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
    git add -A
    git commit -m "🚀 deploy: ${TIMESTAMP}"
  fi

  git push origin main
  echo "✅ GitHub 推送完成，Vercel 将在 1~2 分钟内自动部署"
  echo "   🔗 https://chinese-learn.vercel.app（或你的自定义域名）"
  echo ""
else
  echo "⏭️  Step 3/3  跳过 Vercel 部署"
  echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 部署完成！"
echo ""
echo "注意："
echo "  - 阿里云即时生效（rsync 增量，通常 < 10秒）"
echo "  - Vercel 需要 1~2 分钟构建（GitHub Actions 触发）"
