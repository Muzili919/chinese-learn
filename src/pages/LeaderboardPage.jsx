import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { fetchAllPreviews, fetchUserPetPreview, upsertMV1State, sendEncouragement } from '../utils/mv1_cloud'
import { storage } from '../utils/storage'
import { findUserByName } from '../utils/sync'
import { PET_POOL } from '../utils/gamification'
import PetSpriteAvatar from '../components/PetSpriteAvatar'

/**
 * LeaderboardPage - 排行榜 + 好友 合并页面
 * 两个 Tab：🏆 全球排行  |  👫 好友
 */
export default function LeaderboardPage({ user, gameState, onStateChange }) {
  const userId = user?.id || ''

  // ── Tab 状态 ──────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('rank')

  // ── 排行榜状态 ────────────────────────────────────────────
  const [rankings, setRankings] = useState([])
  const [rankLoading, setRankLoading] = useState(true)
  const [activeMetric, setActiveMetric] = useState('totalLearnQuestions')
  const [lastRefresh, setLastRefresh] = useState(null)

  // ── 好友状态 ──────────────────────────────────────────────
  const [friends, setFriends] = useState(gameState?.friends || [])
  const [friendPreviews, setFriendPreviews] = useState({})
  const [addInput, setAddInput] = useState('')
  const [addStatus, setAddStatus] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [encouraging, setEncouraging] = useState({})
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [friendsLoading, setFriendsLoading] = useState(false)

  // 同步 gameState.friends 到本地 friends（App.jsx 更新时）
  useEffect(() => {
    if (gameState?.friends) {
      setFriends(gameState.friends)
    }
  }, [gameState?.friends])

  // ── 加载排行榜 ─────────────────────────────────────────────
  const loadRankings = useCallback(async () => {
    setRankLoading(true)
    try {
      const previews = await fetchAllPreviews()
      const all = [...previews]

      // 插入/覆盖自己的数据（用本地最新数据）
      if (gameState && userId) {
        const pet = gameState.currentPet
        const poolInfo = PET_POOL.find(p => p.poolId === pet?.poolId) || {}
        const myPreview = {
          userId,
          playerName: user?.name || '我',
          petPoolId: pet?.poolId || null,
          petName: poolInfo.name || pet?.poolId || '我的宠物',
          petEmoji: poolInfo.emoji || '🥚',
          petRarity: poolInfo.rarity || 'N',
          petLevel: pet?.level || 1,
          totalLearnQuestions: gameState.totalLearnQuestions || 0,
          totalCorrectAnswers: gameState.totalCorrectAnswers || 0,
          daysActive: gameState.daysActive || 1,
          weeklyQuestions: gameState.weeklyQuestions || 0,
          wordCannonHighScore: gameState.gameState?.wordCannonHighScore || 0,
          isMe: true,
        }
        const myIdx = all.findIndex(p => p.userId === userId)
        if (myIdx >= 0) all[myIdx] = myPreview
        else all.push(myPreview)
      }

      // 补全好友（fetchAllPreviews 只拿100条，可能漏掉好友）
      const friendIds = friends
      const alreadyIn = new Set(all.map(p => p.userId))
      const missing = friendIds.filter(id => !alreadyIn.has(id))
      if (missing.length > 0) {
        const fetched = await Promise.all(
          missing.map(id => fetchUserPetPreview(id).catch(() => null))
        )
        fetched.forEach(p => {
          if (p?.petEmoji) all.push({ ...p, playerName: p.playerName || '好友' })
        })
      }

      setRankings(all)
      setLastRefresh(new Date())
    } catch (e) {
      console.error('Failed to load rankings', e)
    } finally {
      setRankLoading(false)
    }
  }, [userId, user, gameState, friends])

  useEffect(() => {
    if (activeTab === 'rank') loadRankings()
  }, [activeTab, friends])  // friends 变化时也重新加载，确保好友出现在排行榜

  // ── 加载好友预览 ───────────────────────────────────────────
  const loadFriendPreviews = useCallback(async (list) => {
    if (list.length === 0) { setFriendPreviews({}); return }
    setFriendsLoading(true)
    let map = {}

    // 策略1：服务端 API 绕过 RLS
    try {
      const apiRes = await fetch('/api/friend-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: list }),
      })
      if (apiRes.ok) {
        const { previews } = await apiRes.json()
        ;(previews || []).forEach(p => { map[p.userId] = p })
      }
    } catch (_) {}

    // 策略2：客户端直连补充（可能被 RLS 拦截）
    for (const fid of list) {
      if (!map[fid]) {
        try {
          const p = await fetchUserPetPreview(fid)
          if (p?.petEmoji) map[fid] = p
        } catch (_) {}
      }
    }

    // 策略3：从 API 补充用户名
    if (list.length > 0) {
      try {
        for (const fid of list) {
          if (!map[fid]) {
            const u = await findUserByName(fid).catch(() => null)
            if (u) {
              if (!map[u.id]) map[u.id] = { userId: u.id, petName: u.name || u.id.slice(0, 10), petEmoji: '🥚', petLevel: null, petStage: '未孵化', daysActive: 0 }
              else if (!map[u.id].playerName) map[u.id].playerName = u.name
            }
          }
        }
      } catch (_) {}
    }

    // 兜底：没有任何数据的好友用 ID 占位
    for (const fid of list) {
      if (!map[fid]) map[fid] = { userId: fid, petName: fid.slice(0, 10) + '...', petEmoji: '🥚', petLevel: null, petStage: '未孵化', daysActive: 0 }
    }

    setFriendPreviews(map)
    setFriendsLoading(false)
  }, [])

  useEffect(() => {
    if (activeTab === 'friends') loadFriendPreviews(friends)
  }, [activeTab, friends])

  // ── Bug D 修复：页面切回时自动刷新 ────────────────────────────
  // ★ 必须放在 loadRankings / loadFriendPreviews 声明之后，否则 let TDZ 报错
  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden) {
        if (activeTab === 'rank') loadRankings()
        else if (activeTab === 'friends') loadFriendPreviews(friends)
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    const iv = setInterval(() => {
      if (!document.hidden) {
        if (activeTab === 'rank') loadRankings()
        else if (activeTab === 'friends') loadFriendPreviews(friends)
      }
    }, 2 * 60 * 1000)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      clearInterval(iv)
    }
  // loadRankings/loadFriendPreviews 是 useCallback([]}) 稳定引用，不加入依赖避免重复注册
  }, [activeTab, friends]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── 保存好友列表到云端 ─────────────────────────────────────
  const saveFriends = useCallback(async (newList) => {
    if (!userId || !gameState) return
    const newState = { ...gameState, friends: newList }
    await upsertMV1State(userId, newState)
    if (onStateChange) onStateChange(newState)
  }, [userId, gameState, onStateChange])

  // ── 添加好友 ──────────────────────────────────────────────
  const handleAddFriend = async () => {
    const fid = addInput.trim()
    if (!fid) return
    if (fid === userId) { setAddStatus('不能添加自己'); return }
    if (friends.includes(fid)) { setAddStatus('已经是好友了'); return }

    setAddLoading(true)
    setAddStatus('🔍 搜索中...')
    try {
      let targetId = null

      // 策略1：直接当 user_id
      const idPreview = await fetchUserPetPreview(fid)
      if (idPreview) {
        targetId = fid
      } else {
        // 策略2：按名字模糊搜索（用API）
        const found = await findUserByName(fid).catch(() => null)
        if (found) {
          if (found.id === userId) { setAddStatus('不能添加自己'); setAddLoading(false); return }
          if (friends.includes(found.id)) { setAddStatus('已经是好友了'); setAddLoading(false); return }
          targetId = found.id
        }
      }

      if (!targetId) { setAddStatus(`❌ 未找到「${fid}」，请确认对方已注册`); setAddLoading(false); return }

      const newList = [...friends, targetId]
      setFriends(newList)
      setAddInput('')
      setAddStatus('✅ 添加成功！')
      await saveFriends(newList)

      // 加载该好友的预览
      const preview = await fetchUserPetPreview(targetId).catch(() => null)
      setFriendPreviews(prev => ({
        ...prev,
        [targetId]: preview?.petEmoji ? preview : { userId: targetId, petName: targetId.slice(0, 10), petEmoji: '🥚', petLevel: null, petStage: '未孵化', daysActive: 0 },
      }))
    } catch (e) {
      setAddStatus('网络错误，请重试')
    }
    setAddLoading(false)
    setTimeout(() => setAddStatus(''), 3000)
  }

  // ── 删除好友 ──────────────────────────────────────────────
  const handleDeleteFriend = async (fid) => {
    const newList = friends.filter(f => f !== fid)
    setFriends(newList)
    setConfirmDelete(null)
    setFriendPreviews(prev => { const n = { ...prev }; delete n[fid]; return n })
    await saveFriends(newList)
  }

  // ── 发送鼓励 ──────────────────────────────────────────────
  const handleEncourage = async (friendId) => {
    if (encouraging[friendId]) return
    setEncouraging(prev => ({ ...prev, [friendId]: 'loading' }))
    const name = storage.getUser()?.name || '匿名'
    const ok = await sendEncouragement(userId, name, friendId)
    setEncouraging(prev => ({ ...prev, [friendId]: ok ? 'done' : 'fail' }))
    setTimeout(() => setEncouraging(prev => ({ ...prev, [friendId]: false })), 2000)
  }

  // ── 复制好友码 ────────────────────────────────────────────
  const copyFriendCode = () => {
    navigator.clipboard?.writeText(userId || '')
    setAddStatus('好友码已复制!')
    setTimeout(() => setAddStatus(''), 2000)
  }

  // ── 排行榜排序 ────────────────────────────────────────────
  const sorted = useMemo(() =>
    [...rankings].sort((a, b) => (b[activeMetric] || 0) - (a[activeMetric] || 0)),
    [rankings, activeMetric]
  )

  const myRank = useMemo(() =>
    sorted.findIndex(r => r.userId === userId) + 1,
    [sorted, userId]
  )

  const getMedal = (rank) => {
    if (rank === 1) return { emoji: '🥇', bg: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#92400e' }
    if (rank === 2) return { emoji: '🥈', bg: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)', color: '#374151' }
    if (rank === 3) return { emoji: '🥉', bg: 'linear-gradient(135deg, #fed7aa, #fdba74)', color: '#9a3412' }
    return null
  }

  const metrics = [
    { key: 'totalLearnQuestions', label: '答题数', icon: '📝' },
    { key: 'wordCannonHighScore', label: '炮台高分', icon: '🎯' },
  ]

  // ── 渲染宠物头像 ──────────────────────────────────────────
  const renderAvatar = (entry, size = 46) => (
    <PetSpriteAvatar
      poolId={entry.poolId || entry.userId}  // 有时 poolId 不在预览里，用 userId 兜底
      level={entry.petLevel || 1}
      size={size}
      emoji={entry.petEmoji || '🥚'}
      style={{ borderRadius: '50%', flexShrink: 0 }}
    />
  )

  const pageStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #eef2ff 0%, #ede9fe 40%, #fce7f3 100%)',
    display: 'flex', flexDirection: 'column',
  }

  return (
    <div style={pageStyle}>
      {/* 顶部 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 18px',
        background: 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(99,102,241,0.08)',
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1f2937' }}>
          {activeTab === 'rank' ? '🏆 排行榜' : '👫 好友'}
        </h1>
        <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>
          {activeTab === 'rank' ? `共 ${rankings.length} 位同学` : `${friends.length} 位好友`}
        </p>
        {activeTab === 'rank' && (
          <button
            onClick={loadRankings}
            style={{
              marginLeft: 'auto', padding: '6px 12px', border: 'none', borderRadius: 8,
              background: '#f3f4f6', fontSize: 11, cursor: 'pointer', color: '#6b7280',
            }}
          >🔄 刷新</button>
        )}
        {activeTab === 'friends' && (
          <button
            onClick={() => loadFriendPreviews(friends)}
            style={{
              marginLeft: 'auto', padding: '6px 12px', border: 'none', borderRadius: 8,
              background: '#f3f4f6', fontSize: 11, cursor: 'pointer', color: '#6b7280',
            }}
          >🔄 刷新</button>
        )}
      </div>

      {/* Tab 切换 */}
      <div style={{ display: 'flex', background: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(99,102,241,0.08)' }}>
        {[
          { key: 'rank', label: '🏆 排行榜' },
          { key: 'friends', label: `👫 好友${friends.length > 0 ? ` (${friends.length})` : ''}` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            style={{
              flex: 1, padding: '10px 0', border: 'none',
              background: 'none',
              borderBottom: activeTab === t.key ? '2px solid #6366f1' : '2px solid transparent',
              color: activeTab === t.key ? '#6366f1' : '#6b7280',
              fontSize: 13, fontWeight: activeTab === t.key ? 700 : 500,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* ── 排行榜 Tab ── */}
      {activeTab === 'rank' && (
        <>
          {/* 指标切换 */}
          <div style={{ display: 'flex', gap: 6, padding: '12px 16px 8px', overflowX: 'auto' }}>
            {metrics.map(m => (
              <button
                key={m.key}
                onClick={() => setActiveMetric(m.key)}
                style={{
                  padding: '6px 14px', border: 'none', borderRadius: 20,
                  background: activeMetric === m.key ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'white',
                  color: activeMetric === m.key ? 'white' : '#6b7280',
                  fontSize: 12, fontWeight: activeMetric === m.key ? 600 : 500,
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  boxShadow: activeMetric === m.key ? '0 2px 10px rgba(99,102,241,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.2s',
                }}
              >{m.icon} {m.label}</button>
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
              }}>{myRank}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#4c1d95' }}>{user?.name || '我'}（你）</div>
                <div style={{ fontSize: 11, color: '#7c3aed' }}>
                  Lv.{gameState?.currentPet?.level || 1} · 📝{gameState?.totalLearnQuestions || 0}题
                </div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#6366f1' }}>
                {sorted.find(r => r.userId === userId)?.[activeMetric] || 0}
              </div>
            </div>
          )}

          {/* 排行列表 */}
          <div style={{ flex: 1, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 80 }}>
            {rankLoading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 32, marginBottom: 8, animation: 'spin 1s linear infinite' }}>🏆</div>
                <p style={{ color: '#9ca3af', fontSize: 13 }}>加载中...</p>
              </div>
            ) : sorted.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af', background: 'white', borderRadius: 16 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🏆</div>
                <p style={{ margin: 0, fontSize: 14 }}>暂无排行数据</p>
                <p style={{ margin: '4px 0 0', fontSize: 11 }}>开始答题，登上榜首吧！</p>
              </div>
            ) : sorted.map((entry, index) => {
              const rank = index + 1
              const medal = getMedal(rank)
              const isMe = entry.userId === userId
              const isFriend = friends.includes(entry.userId)

              return (
                <div key={entry.userId} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: isMe
                    ? 'linear-gradient(135deg, #ede9fe, #e0e7ff)'
                    : medal ? medal.bg : 'white',
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
                    {medal ? <span style={{ fontSize: 24 }}>{medal.emoji}</span> : rank}
                  </div>

                  {/* 宠物头像 */}
                  <PetSpriteAvatar
                    poolId={entry.petPoolId || null}
                    level={entry.petLevel || 1}
                    size={44}
                    emoji={entry.petEmoji || '🥚'}
                  />

                  {/* 信息 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 13, color: '#1f2937' }}>
                        {isMe ? (user?.name || '我') : (entry.playerName || '匿名同学')}
                      </span>
                      {isMe && (
                        <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 9, background: '#6366f1', color: 'white', fontWeight: 600 }}>我</span>
                      )}
                      {isFriend && !isMe && (
                        <span style={{ padding: '1px 6px', borderRadius: 4, fontSize: 9, background: '#10b981', color: 'white', fontWeight: 600 }}>好友</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                      <span style={{
                        padding: '0 5px', borderRadius: 3, fontSize: 9, fontWeight: 700,
                        background: entry.petRarity === 'SSR' ? '#fef3c7' : entry.petRarity === 'SR' ? '#ede9fe' : '#f3f4f6',
                        color: entry.petRarity === 'SSR' ? '#92400e' : entry.petRarity === 'SR' ? '#6d28d9' : '#6b7280',
                      }}>{entry.petRarity || 'N'}</span>
                      <span style={{ fontSize: 10, color: '#9ca3af' }}>
                        {entry.petName} Lv.{entry.petLevel || 1} · 🔥{entry.daysActive || 1}天
                      </span>
                    </div>
                  </div>

                  {/* 数值 */}
                  <div style={{ fontSize: 18, fontWeight: 800, color: isMe ? '#6366f1' : '#374151', flexShrink: 0 }}>
                    {entry[activeMetric] || 0}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── 好友 Tab ── */}
      {activeTab === 'friends' && (
        <div style={{ flex: 1, padding: '16px', paddingBottom: 80 }}>

          {/* 我的好友码 */}
          <div style={{
            background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
            borderRadius: 16, padding: 16, marginBottom: 14, textAlign: 'center',
            boxShadow: '0 2px 10px rgba(59,130,246,0.08)',
          }}>
            <p style={{ margin: '0 0 6px', fontSize: 12, color: '#6b7280' }}>📋 我的好友码（发给朋友让他们搜索）</p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <code style={{
                fontSize: 13, fontWeight: 700, color: '#1e40af',
                background: 'white', padding: '6px 14px', borderRadius: 10,
                letterSpacing: 1, fontFamily: 'monospace', wordBreak: 'break-all', maxWidth: '60vw',
              }}>{userId || '...'}</code>
              <button onClick={copyFriendCode} style={{
                padding: '6px 12px', border: 'none', borderRadius: 8, cursor: 'pointer',
                background: '#3b82f6', color: 'white', fontSize: 11, fontWeight: 600, flexShrink: 0,
              }}>复制</button>
            </div>
            {addStatus && (
              <p style={{ margin: '6px 0 0', fontSize: 11, color: addStatus.includes('❌') ? '#ef4444' : '#6366f1' }}>{addStatus}</p>
            )}
          </div>

          {/* 添加好友 */}
          <div style={{
            background: 'white', borderRadius: 14, padding: 14, marginBottom: 14,
            boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
          }}>
            <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: 13, color: '#374151' }}>➕ 添加好友</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={addInput}
                onChange={e => setAddInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddFriend()}
                placeholder="输入好友码或昵称..."
                style={{
                  flex: 1, padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8,
                  fontSize: 13, outline: 'none',
                }}
              />
              <button onClick={handleAddFriend} disabled={addLoading} style={{
                padding: '8px 16px', border: 'none', borderRadius: 8, cursor: 'pointer',
                background: addLoading ? '#d1d5db' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                color: 'white', fontSize: 12, fontWeight: 600, flexShrink: 0,
              }}>{addLoading ? '...' : '添加'}</button>
            </div>
          </div>

          {/* 好友列表 */}
          <p style={{ margin: '0 0 10px', fontWeight: 600, fontSize: 14, color: '#374151' }}>
            👫 我的好友 ({friends.length})
          </p>

          {friendsLoading && friends.length > 0 && (
            <div style={{ textAlign: 'center', padding: 16, color: '#9ca3af', fontSize: 12 }}>加载好友数据中...</div>
          )}

          {friends.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 30, color: '#9ca3af', background: 'white', borderRadius: 14 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🤝</div>
              <p style={{ margin: 0, fontSize: 13 }}>还没有好友</p>
              <p style={{ margin: '4px 0 0', fontSize: 11 }}>复制好友码发给朋友，或输入对方昵称添加</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {friends.map(fid => {
                const p = friendPreviews[fid] || {}
                const encouraged = encouraging[fid]
                const isConfirmingDelete = confirmDelete === fid

                return (
                  <div key={fid} style={{
                    background: 'white', borderRadius: 14, padding: 14,
                    boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    {/* 宠物头像 */}
                    <PetSpriteAvatar
                      poolId={p.petPoolId || null}
                      level={p.petLevel || 1}
                      size={50}
                      emoji={p.petEmoji || '🥚'}
                    />

                    {/* 信息 */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: '#1f2937' }}>
                          {p.playerName || p.petName || fid.slice(0, 12) + '...'}
                        </span>
                        {p.petRarity && (
                          <span style={{
                            padding: '1px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700,
                            background: p.petRarity === 'SSR' ? '#fef3c7' : p.petRarity === 'SR' ? '#ede9fe' : '#f3f4f6',
                            color: p.petRarity === 'SSR' ? '#92400e' : p.petRarity === 'SR' ? '#6d28d9' : '#6b7280',
                          }}>{p.petRarity}</span>
                        )}
                      </div>
                      <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>
                        {p.petStage || '??'} · Lv.{p.petLevel ?? '?'} · 📝{p.totalLearnQuestions ?? 0}题 · 🔥{p.daysActive ?? 0}天
                      </p>
                    </div>

                    {/* 操作 */}
                    {!isConfirmingDelete ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                        <button
                          onClick={() => handleEncourage(fid)}
                          disabled={!!encouraged}
                          style={{
                            padding: '6px 12px', border: 'none', borderRadius: 10, cursor: 'pointer',
                            background: encouraged === 'done' ? '#f3f4f6'
                              : 'linear-gradient(135deg,#fbbf24,#f59e0b)',
                            color: encouraged === 'done' ? '#9ca3af' : 'white',
                            fontSize: 11, fontWeight: 700,
                            boxShadow: encouraged ? 'none' : '0 2px 8px rgba(251,191,36,0.3)',
                          }}>
                          {encouraged === 'done' ? '✅ 已鼓励' : encouraged === 'loading' ? '...' : '🌟 鼓励'}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(fid)}
                          style={{ padding: '3px 12px', border: 'none', borderRadius: 8, background: 'none', color: '#d1d5db', fontSize: 10, cursor: 'pointer' }}>
                          删除
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                        <button onClick={() => handleDeleteFriend(fid)} style={{ padding: '4px 10px', border: 'none', borderRadius: 6, background: '#fee2e2', color: '#dc2626', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>确认</button>
                        <button onClick={() => setConfirmDelete(null)} style={{ padding: '4px 10px', border: 'none', borderRadius: 6, background: '#f3f4f6', color: '#6b7280', fontSize: 10, cursor: 'pointer' }}>取消</button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { 0%{transform:rotate(0deg)}100%{transform:rotate(360deg)} }`}</style>
    </div>
  )
}
