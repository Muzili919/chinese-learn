# 千问API接入指南

## 已完成的工作

我已经为你的chinese-learn项目集成了千问API支持，具体完成了以下工作：

### 1. 后端API改造
- ✅ 修改了 `server/index.js` 支持多模型AI调用
- ✅ 支持DeepSeek和千问模型的自动切换
- ✅ 添加了模型配置管理函数
- ✅ 更新了流式响应支持

### 2. 前端AI工具升级
- ✅ 创建了 `src/utils/ai_v3.js` 多模型AI调用工具
- ✅ 支持指定模型参数调用
- ✅ 提供了模型测试和列表功能
- ✅ 保持向后兼容性

### 3. 环境配置
- ✅ 更新了 `server/.env` 文件，添加千问API配置项
- ✅ 创建了 `server/.env.example` 示例配置文件
- ✅ 添加了默认模型配置选项

### 4. 管理工具
- ✅ 创建了 `server/test-qwen.js` 千问API测试脚本
- ✅ 创建了 `server/manage-ai.js` AI模型管理工具
- ✅ 更新了 `server/package.json` 添加管理脚本

## 使用方法

### 1. 配置千问API密钥

编辑 `server/.env` 文件，更新以下配置：

```bash
# 千问API配置（阿里云百炼）
QWEN_API_KEY=你的实际API密钥
QWEN_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QWEN_MODEL=qwen-max  # 可选：qwen-max, qwen-plus, qwen-turbo

# 默认AI模型
DEFAULT_AI_MODEL=deepseek-chat  # 或 qwen-max
```

### 2. 测试千问API连接

```bash
cd server

# 方法1：直接测试
node test-qwen.js 你的API密钥

# 方法2：使用npm脚本（需要先在.env配置密钥）
npm run test:qwen

# 方法3：使用管理工具测试
npm run ai:test qwen-max
```

### 3. 管理AI模型

```bash
cd server

# 显示当前配置
npm run ai:config

# 列出可用模型
npm run ai:list

# 测试指定模型
npm run ai:test deepseek-chat
npm run ai:test qwen-max

# 切换默认模型
npm run ai:switch qwen-max
npm run ai:switch deepseek-chat
```

### 4. 在前端使用千问模型

```javascript
// 导入新的AI工具
import { callAI, AI_MODELS, evaluateSentence } from './utils/ai_v3.js'

// 使用千问模型评估造句
const result = await evaluateSentence('美丽', '这个花园很美丽。', AI_MODELS.QWEN_MAX)

// 直接调用指定模型
const response = await callAI('系统提示', '用户问题', {
  model: AI_MODELS.QWEN_PLUS,
  temperature: 0.8,
  max_tokens: 500
})

// 测试模型连接
import { testModelConnection } from './utils/ai_v3.js'
const testResult = await testModelConnection(AI_MODELS.QWEN_MAX)
```

### 5. 重启服务器

配置更新后需要重启服务器：

```bash
cd server
# 停止当前服务器（如果有）
# 然后启动
npm start
```

## 模型对比

| 模型 | 提供商 | 特点 | 适合场景 |
|------|--------|------|----------|
| deepseek-chat | DeepSeek | 性价比高，响应快 | 日常对话、批改作业 |
| deepseek-reasoner | DeepSeek | 推理能力强 | 复杂分析、逻辑题 |
| qwen-max | 阿里云 | 性能最强，中文优化 | 高质量批改、作文评分 |
| qwen-plus | 阿里云 | 平衡性能与成本 | 一般教学任务 |
| qwen-turbo | 阿里云 | 响应最快，成本低 | 简单问答、快速反馈 |

## 故障排除

### 1. API连接失败
- 检查API密钥是否正确
- 确认网络连接正常
- 验证千问API服务状态

### 2. 模型切换无效
- 检查 `.env` 文件中的 `DEFAULT_AI_MODEL` 设置
- 确认服务器已重启
- 查看服务器日志确认使用的模型

### 3. 响应超时
- 调整 `CLIENT_TIMEOUT_MS` 超时设置
- 减少请求的token数量
- 检查网络延迟

## 下一步建议

1. **性能测试**：对比不同模型在批改作业时的响应时间和质量
2. **成本监控**：设置API使用量监控，优化成本
3. **故障转移**：实现模型失败时的自动切换
4. **用户界面**：在前端添加模型选择开关

## 注意事项

1. **API密钥安全**：不要将 `.env` 文件提交到Git仓库
2. **成本控制**：千问API可能比DeepSeek成本高，注意使用量
3. **服务可用性**：国内用户访问千问API可能更稳定
4. **兼容性**：确保前端代码兼容旧版API调用方式

如果有任何问题，可以随时查看服务器日志或运行测试脚本进行诊断。