#!/usr/bin/env node

/**
 * 测试千问API连接
 * 使用方法：node test-qwen.js [你的API密钥]
 */

const fs = require('fs')
const path = require('path')

// 读取环境变量
const envPath = path.join(__dirname, '.env')
let envContent = {}

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8')
  content.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/)
    if (match) {
      envContent[match[1]] = match[2]
    }
  })
}

// 获取API密钥（命令行参数优先）
const apiKey = process.argv[2] || envContent.QWEN_API_KEY
const baseUrl = envContent.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1'
const model = envContent.QWEN_MODEL || 'qwen-max'

if (!apiKey || apiKey.includes('xxxxxxxx')) {
  console.error('❌ 请提供有效的千问API密钥')
  console.error('使用方法：node test-qwen.js [你的API密钥]')
  console.error('或者更新 server/.env 文件中的 QWEN_API_KEY')
  process.exit(1)
}

console.log('🔍 测试千问API连接...')
console.log(`📡 端点: ${baseUrl}`)
console.log(`🤖 模型: ${model}`)
console.log(`🔑 API密钥: ${apiKey.substring(0, 8)}...`)

async function testQwenConnection() {
  try {
    const startTime = Date.now()
    
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
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
    console.log(`📊 使用token: ${data.usage?.total_tokens || '未知'}`)
    
    return true
  } catch (error) {
    console.error('❌ 连接测试失败:', error.message)
    return false
  }
}

// 运行测试
testQwenConnection().then(success => {
  if (success) {
    console.log('\n🎉 千问API连接测试通过！')
    console.log('💡 提示：请将 server/.env 文件中的 QWEN_API_KEY 更新为你的实际密钥')
  } else {
    console.log('\n⚠️  千问API连接测试失败')
    console.log('💡 请检查：')
    console.log('   1. API密钥是否正确')
    console.log('   2. 网络连接是否正常')
    console.log('   3. 千问API服务是否可用')
  }
  process.exit(success ? 0 : 1)
})