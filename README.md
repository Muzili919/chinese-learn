# Chinese Learn

给小学→初中过渡期孩子的自适应学习 Web 应用。覆盖语文、数学、英语、政治多科目，游戏化答题 + SRS 间隔复习 + 宠物养成 + 家长报告。

## 功能

### 多科目题库
- **语文**：字词、古诗词、成语、阅读理解、作文（小学 + 初中）
- **数学**：运算、图形、奥数（小学）→ 方程、函数、几何（初中）
- **英语**：词汇联想、听力、语法、阅读、写作、完形填空
- **政治**：宪法、法律、公民权利（初中道法）

### 游戏化
- 15+ 宠物收集系统（进阶形态 + 配饰商店）
- 星球打卡体系（每个学科 → 多个星球，答题解锁）
- SRS 间隔复习算法（SM-2 简化版）
- AI 口语练习（DeepSeek / 千问 / GLM 多模型切换）

### 家长端
- 学习雷达图 + 热力图 + 弱点分析
- 每日学习报告邮件（AI 生成个性化建议）
- 密码保护访问

### 技术特性
- 语音朗读（edge-tts）
- Supabase 云同步（跨设备数据恢复）
- 双环境部署（阿里云 + Vercel CDN）

## 技术栈

- React 19 + Vite + Tailwind CSS v4
- Express + PostgreSQL（后端）
- Supabase（云同步）
- DeepSeek / 千问 / GLM（AI 模型）

## 快速开始

### 前端

```bash
npm install
npm run dev
```

### 后端

```bash
cd server
cp .env.example .env
# 编辑 .env 填入数据库和 API 配置
npm install
node server.js
```

### 环境变量

参见 `server/.env.example`，需要配置：
- PostgreSQL 数据库连接
- AI 模型 API Key（至少一个：DeepSeek / 千问 / GLM）
- SMTP 邮件（可选，用于每日学习报告）

## 项目结构

```
├── src/
│   ├── pages/          # 页面组件（各科目首页、答题页、报告页等）
│   ├── components/     # 通用组件
│   ├── data/           # 题库 JSON（43+ 文件，按科目+难度分类）
│   └── lib/            # 工具库（SRS 算法、API 客户端）
├── server/             # Express 后端（AI 练习、邮件报告）
├── public/pets/        # 宠物精灵图资源
└── docs/               # 架构说明、题库文档
```

## License

[MIT](LICENSE) — 自由使用、修改、商用，保留版权声明即可。

## 支持项目

如果这个项目对你有帮助，欢迎支持：

- [爱发电](https://ifdian.net/p/455b9a1242af11f1aca05254001e7c00) 赞助
- 微信/支付宝赞赏（见 docs/ 目录）
- 给个 Star
