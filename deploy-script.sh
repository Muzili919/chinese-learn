#!/bin/bash
# 直接通过Vercel API部署

TOKEN="vcp_8Jxe8SuN1TXpXMvoQ42WFP0ePCisR0LhdS4nEs7DhIEpmbDzcn0liJlh"
PROJECT_ID="prj_CqMEvCsWUgfuqibmzFcDCjXCSfb5"
TEAM_ID="team_mumus-projects-db9952e7"

echo "开始部署..."

# 1. 创建部署
curl -X POST "https://api.vercel.com/v13/deployments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "chinese-learn",
    "project": "'$PROJECT_ID'",
    "target": "production",
    "gitSource": {
      "type": "github",
      "repo": "Muzili919/chinese-learn",
      "ref": "main"
    }
  }' 2>/dev/null | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    print('部署ID:', data.get('id', '未知'))
    print('URL:', data.get('url', '未知'))
except:
    print('API调用失败')
"

echo "部署请求已发送"
