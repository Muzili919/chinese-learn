#!/usr/bin/env node

/**
 * AI模型管理工具
 * 用于切换和测试不同的AI模型
 */

const fs = require('fs')
const path = require('path')
const readline = require('readline')

const ENV_FILE = path.join(__dirname, '.env')

// 支持的模型配置
const MODEL_CONFIGS = {
  'deepseek-chat': {
    name: 'DeepSeek Chat',
    provider: 'DeepSeek',
    envKey: 'DEEPSEEK_API_KEY',
    defaultBaseUrl: 'https://api.deepseek.com'
  },
  'deepseek-reasoner': {
    name: 'DeepSeek Reasoner',
    provider: 'DeepSeek',
    envKey: 'DEEPSEEK_API_KEY',
    defaultBaseUrl: 'https://api.deepseek.com'
  },
  'qwen-max': {
    name: '通义千问 Max',
    provider: '阿里云',
    envKey: 'QWEN_API_KEY',
    defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
  },
  'qwen-plus': {
    name: '通义千问 Plus',
    provider: '阿里云',
    envKey: 'QWEN_API_KEY',
    defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
  },
  'qwen-turbo': {
    name: '通义千问 Turbo',
    provider: '阿里云',
    envKey: 'QWEN_API_KEY',
    defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
  }
}

// 读取环境变量
function readEnv() {
  const env = {}
  if (fs.existsSync(ENV_FILE)) {
    const content = fs.readFileSync(ENV_FILE, 'utf8')
    content.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/)
      if (match) {
        env[match[1]] = match[2]
      }
    })
  }
  return env
}

// 写入环境变量
function writeEnv(env) {
  const lines = []
  for (const [key, value] of Object.entries(env)) {
    lines.push(`${key}=${value}`)
  }
  fs.writeFileSync(ENV_FILE, lines.join('\n'))
  console.log(`✅ 已更新 ${ENV_FILE}`)
}

// 测试模型连接
async function testModel(modelName) {
  const config = MODEL_CONFIGS[modelName]
  if (!config) {
    console.error(`❌ 不支持的模型: ${modelName}`)
    return false
  }

  const env = readEnv()
  const apiKey = env[config.envKey]
  const baseUrl = env[`${config.envKey.split('_')[0]}_BASE_URL`] || config.defaultBaseUrl

  if (!apiKey || apiKey.includes('xxxxxxxx')) {
    console.error(`❌ ${config.name} API密钥未配置`)
    console.error(`   请在 ${ENV_FILE} 中设置 ${config.envKey}`)
    return false
  }

  console.log(`🔍 测试 ${config.name} 连接...`)
  console.log(`📡 端点: ${baseUrl}`)
  console.log(`🤖 模型: ${modelName}`)
  console.log(`🔑 API密钥: ${apiKey.substring(0, 8)}...`)

  try {
    const startTime = Date.now()
    
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: '你是一个测试助手' },
          { role: 'user', content: '请回复"OK"表示连接正常' }
        ],
        temperature: 0.7,
        max_tokens: 10,
      }),
    })

    const responseTime = Date.now() - startTime
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ API请求失败 (${response.status}):`, errorText.slice(0, 200))
      return false
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    
    console.log(`✅ 连接成功！响应时间: ${responseTime}ms`)
    console.log(`📝 响应内容: ${content}`)
    
    return true
  } catch (error) {
    console.error('❌ 连接测试失败:', error.message)
    return false
  }
}

// 切换默认模型
function switchDefaultModel(modelName) {
  if (!MODEL_CONFIGS[modelName]) {
    console.error(`❌ 不支持的模型: ${modelName}`)
    console.log('可用模型:')
    Object.keys(MODEL_CONFIGS).forEach(key => {
      console.log(`  - ${key} (${MODEL_CONFIGS[key].name})`)
    })
    return false
  }

  const env = readEnv()
  env.DEFAULT_AI_MODEL = modelName
  writeEnv(env)
  
  console.log(`✅ 已切换默认模型为: ${MODEL_CONFIGS[modelName].name}`)
  return true
}

// 显示当前配置
function showConfig() {
  const env = readEnv()
  
  console.log('📋 当前AI模型配置:')
  console.log(`默认模型: ${env.DEFAULT_AI_MODEL || '未设置'}`)
  console.log('')
  
  console.log('🔑 API密钥状态:')
  Object.entries(MODEL_CONFIGS).forEach(([modelId, config]) => {
    const apiKey = env[config.envKey]
    const status = apiKey && !apiKey.includes('xxxxxxxx') ? '✅ 已配置' : '❌ 未配置'
    console.log(`  ${config.name}: ${status}`)
  })
}

// 主函数
async function main() {
  const command = process.argv[2]
  
  switch (command) {
    case 'test':
      const modelToTest = process.argv[3] || 'deepseek-chat'
      await testModel(modelToTest)
      break
      
    case 'switch':
      const modelToSwitch = process.argv[3]
      if (!modelToSwitch) {
        console.error('❌ 请指定要切换的模型')
        console.error('使用方法: node manage-ai.js switch [模型名称]')
        console.error('可用模型: deepseek-chat, deepseek-reasoner, qwen-max, qwen-plus, qwen-turbo')
        break
      }
      switchDefaultModel(modelToSwitch)
      break
      
    case 'config':
      showConfig()
      break
      
    case 'list':
      console.log('📋 可用AI模型:')
      Object.entries(MODEL_CONFIGS).forEach(([modelId, config]) => {
        console.log(`  ${modelId} - ${config.name} (${config.provider})`)
      })
      break
      
    default:
      console.log('🤖 AI模型管理工具')
      console.log('使用方法: node manage-ai.js [命令] [参数]')
      console.log('')
      console.log('命令:')
      console.log('  test [模型]     测试指定模型的连接')
      console.log('  switch [模型]   切换默认AI模型')
      console.log('  config          显示当前配置')
      console.log('  list            列出可用模型')
      console.log('')
      console.log('示例:')
      console.log('  node manage-ai.js test qwen-max')
      console.log('  node manage-ai.js switch deepseek-chat')
      console.log('  node manage-ai.js config')
  }
}

// 运行主函数
if (require.main === module) {
  main().catch(console.error)
}

module.exports = {
  testModel,
  switchDefaultModel,
  showConfig
}