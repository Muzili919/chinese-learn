import React, { useState, useEffect, useMemo } from 'react'
import { fetchAllPreviews, fetchUserPetPreview } from '../utils/mv1_cloud'
import { storage, calcLevel, calcLevelProgress } from '../utils/storage'

/**
 * LeaderboardPage - 好友排行榜
 * 显示所有用户的宠物等级、答题数、活跃天数排名
 */
export default function LeaderboardPage({ user, gameState }) {
  const [rankings, setRankings] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeMetric, setActiveMetric] = useState('totalLearnQuestions')
  const [lastRefresh, setLastRefresh] = useState(null)

  const userId = user?.id || ''

  useEffect(() => {
    loadRankings()
  }, [])

  const loadRankings = async () => {
    setLoading(true)
    try {
      // 1. 全局 preview（来自 users.pet_preview，无 RLS）
      const previews = await fetchAllPreviews()
      const all = [...previews]

      // 2. 加入自己（用实际宠物数据，不用硬编码）
      if (gameState && userId) {
        const pet = gameState.currentPet
        const petPool = gameState.petPool || []
        const poolInfo = petPool.find(p => p.poolId === pet?.poolId) || {}
        const myPreview = {
          userId,
          playerName: user?.name || '我',
          petName: poolInfo.name || pet?.poolId || '我的宠物',
          petEmoji: poolInfo.emoji || '🥚',
          petRarity: poolInfo.rarity || 'N',
          petLevel: pet?.level || 1,
          totalLearnQuestions: gameState.totalLearnQuestions || 0,
          totalCorrectAnswers: gameState.totalCorrectAnswers || 0,
          daysActive: gameState.daysActive || 1,
          weeklyQuestions: gameState.weeklyQuestions || 0,
          isMe: true,
        }
        // 替换或插入自己的数据（用本地最新数据覆盖云端缓存）
        const myIdx = all.findIndex(p => p.userId === userId)
        if (myIdx >= 0) all[myIdx] = myPreview
        else all.push(myPreview)
      }

      // 3. 单独补全好友数据（fetchAllPreviews 只读100条，可能漏掉）
      const friendIds = gameState?.friends || []
      const alreadyIn = new Set(all.map(p => p.userId))
      const missingFriends = friendIds.filter(id => !alreadyIn.has(id))

      if (missingFriends.length > 0) {
        const fetched = await Promise.all(
          missingFriends.map(id => fetchUserPetPreview(id).catch(() => null))
        )
        fetched.forEach(preview => {
          if (preview?.petEmoji) all.push({ ...preview, playerName: preview.playerName || '好友' })
        })
      }

      setRankings(all)
      setLastRefresh(new Date())
    } catch (e) {
      console.error('Failed to load rankings', e)
    } finally {
      setLoading(false)
    }
  }

  const sorted = useMemo(() => {
    return [...rankings].sort((a, b) => (b[activeMetric] || 0) - (a[activeMetric] || 0))
  }, [rankings, activeMetric])

  const myRank = useMemo(() => {
    return sorted.findIndex(r => r.userId === userId) + 1
  }, [sorted, userId])

  const metrics = [
    { key: 'totalLearnQuestions', label: '答题数', icon: '📝' },
    { key: 'petLevel', label: '宠物等级', icon: '🐉' },
    { key: 'daysActive', label: '活跃天数', icon: '🔥' },
    { key: 'weeklyQuestions', label: '本周答题', icon: '📅' },
  ]

  const getMedal = (rank) => {
    if (rank === 1) return { emoji: '🥇', bg: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#92400e' }
    if (rank === 2) return { emoji: '🥈', bg: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)', color: '#374151' }
    if (rank === 3) return { emoji: '🥉', bg: 'linear-gradient(135deg, #fed7aa, #fdba74)', color: '#9a3412' }
    return null
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #eef2ff 0%, #ede9fe 40%, #fce7f3 100%)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '14px 18px', background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(99,102,241,0.08)' }}>
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1f2937' }}>🏆 排行榜</h1>
        </div>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12, animation: 'spin 1s linear infinite' }}>🏆</div>
            <p style={{ color: '#6b7280', fontSize: 14 }}>加载排行榜中...</p>
          </div>
        </div>
        <style>{`@keyframes spin { 0%{transform:rotate(0deg)}100%{transform:rotate(360deg)} }`}</style>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #eef2ff 0%, #ede9fe 40%, #fce7f3 100%)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* 顶部 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 18px',
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(99,102,241,0.08)',
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1f2937' }}>🏆 排行榜</h1>
          <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>
            共 {rankings.length} 位同学
          </p>
        </div>
        <button
          onClick={loadRankings}
          style={{
            marginLeft: 'auto', padding: '6px 12px', border: 'none', borderRadius: 8,
            background: '#f3f4f6', fontSize: 11, cursor: 'pointer', color: '#6b7280',
          }}
        >
          🔄 刷新
        </button>
      </div>

      {/* 指标切换 */}
      <div style={{ display: 'flex', gap: 6, padding: '12px 16px 8px', overflowX: 'auto' }}>
        {metrics.map(m => (
          <button
            key={m.key}
            onClick={() => setActiveMetric(m.key)}
            style={{
              padding: '6px 14px', border: 'none', borderRadius: 20,
              background: activeMetric === m.key
                ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                : 'white',
              color: activeMetric === m.key ? 'white' : '#6b7280',
              fontSize: 12, fontWeight: activeMetric === m.key ? 600 : 500,
              cursor: 'pointer', whiteSpace: 'nowrap',
              boxShadow: activeMetric === m.key
                ? '0 2px 10px rgba(99,102,241,0.3)'
                : '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'all 0.2s',
            }}
          >
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* 我的排名 */}
      {myRank > 0 && (
        <div style={{
          margin: '8px 16px 0',
          background: 'linear-gradient(135deg, #ede9fe, #e0e7ff)',
          borderRadius: 14, padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 2px 10px rgba(99,102,241,0.12)',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 50,
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: 14, fontWeight: 800,
          }}>
            {myRank}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#4c1d95' }}>
              {user?.name || '我'}（你）
            </div>
            <div style={{ fontSize: 11, color: '#7c3aed' }}>
              Lv.{gameState?.currentPet?.level || 1} · 📝{gameState?.totalLearnQuestions || 0}题
            </div>
          </div>
          <div style={{
            fontSize: 20, fontWeight: 800, color: '#6366f1',
          }}>
            {sorted.find(r => r.userId === userId)?.[activeMetric] || 0}
          </div>
        </div>
      )}

      {/* 排行列表 */}
      <div style={{ flex: 1, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 80 }}>
        {sorted.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: 40, color: '#9ca3af',
            background: 'white', borderRadius: 16,
          }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🏆</div>
            <p style={{ margin: 0, fontSize: 14 }}>暂无排行数据</p>
            <p style={{ margin: '4px 0 0', fontSize: 11 }}>开始答题，登上榜首吧！</p>
          </div>
        ) : (
          sorted.map((entry, index) => {
            const rank = index + 1
            const medal = getMedal(rank)
            const isMe = entry.userId === userId

            return (
              <div key={entry.userId} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: isMe
                  ? 'linear-gradient(135deg, #ede9fe, #e0e7ff)'
                  : medal
                    ? medal.bg
                    : 'white',
                borderRadius: 14, padding: '12px 14px',
                border: isMe ? '2px solid #8b5cf6' : '1px solid rgba(0,0,0,0.05)',
                boxShadow: isMe ? '0 2px 12px rgba(99,102,241,0.2)' : '0 1px 4px rgba(0,0,0,0.03)',
              }}>
                {/* 排名 */}
                <div style={{
                  width: 36, height: 36, borderRadius: 50,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: medal ? 0 : 14, fontWeight: 800,
                  background: medal ? 'none' : '#f3f4f6',
                  color: medal ? medal.color : '#6b7280',
                  flexShrink: 0,
                }}>
                  {medal ? (
                    <span style={{ fontSize: 24 }}>{medal.emoji}</span>
                  ) : (
                    rank
                  )}
                </div>

                {/* 宠物头像 */}
                <div style={{
                  width: 44, height: 44, borderRadius: 50,
                  background: 'linear-gradient(135deg, #f3e8ff, #fce7f3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26, flexShrink: 0,
                }}>
                  {entry.petEmoji || '🥚'}
                </div>

                {/* 信息 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 13, color: '#1f2937' }}>
                      {isMe ? `${user?.name || '我'}` : entry.playerName || '匿名同学'}
                    </span>
                    {isMe && (
                      <span style={{
                        padding: '1px 6px', borderRadius: 4, fontSize: 9,
                        background: '#6366f1', color: 'white', fontWeight: 600,
                      }}>我</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <span style={{
                      padding: '0 5px', borderRadius: 3, fontSize: 9, fontWeight: 700,
                      background: entry.petRarity === 'SSR' ? '#fef3c7' : entry.petRarity === 'SR' ? '#ede9fe' : '#f3f4f6',
                      color: entry.petRarity === 'SSR' ? '#92400e' : entry.petRarity === 'SR' ? '#6d28d9' : '#6b7280',
                    }}>
                      {entry.petRarity}
                    </span>
                    <span style={{ fontSize: 10, color: '#9ca3af' }}>
                      {entry.petName} Lv.{entry.petLevel} · 🔥{entry.daysActive}天
                    </span>
                  </div>
                </div>

                {/* 数值 */}
                <div style={{
                  fontSize: 18, fontWeight: 800, color: isMe ? '#6366f1' : '#374151',
                  flexShrink: 0,
                }}>
                  {entry[activeMetric] || 0}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
