import React, { useEffect, useState, useCallback, useRef } from 'react'
import Pet from './Pet'
import PetEgg from './PetEgg'
import PetSpriteAvatar from './PetSpriteAvatar'
import { isEggState } from '../utils/gamification'
import { storage } from '../utils/storage'

/**
 * GlobalPetDock - 全局悬浮宠物窗
 *
 * 动作规则：
 *  1. isLearning=true（学习Tab）→ 固定 reading，点击无效
 *  2. 任意属性 < 10% → 固定 sad_cry，直到全部 > 10%
 *  3. 连续快速点击 20 次 → angry，5秒后自动恢复
 *  4. 其他情况 → 每3次点击切换一个动作（循环6种）
 */

// 普通点击循环的动作序列（不含 reading/sad_cry/angry）
const CYCLING_POSES = ['sleeping', 'happy', 'wave', 'excited', 'eating', 'normal']

export default function GlobalPetDock({ gameState, isLearning }) {
  const [visible, setVisible] = useState(true)
  const [tapCount, setTapCount] = useState(0)          // 累计点击（用于3次换动作）
  const [consecutiveCount, setConsecutiveCount] = useState(0) // 连续点击（用于20次生气）
  const [isAngry, setIsAngry] = useState(false)
  // ★ 经验刷新计数器：让组件能感知 storage.getXP() 的变化并重新渲染 exp 值
  // 没有 gameState 变化时（答题/刷新后），这是唯一能让 GlobalPetDock 重渲染的机制
  const [, xpTick] = useState(0)

  const resetTimerRef = useRef(null)   // 连续点击5秒无操作 → 重置
  const angryTimerRef = useRef(null)   // 生气5秒后恢复

  // ★ 每5秒强制重渲染一次，确保 exp（从storage.getXP()实时读取）保持最新
  // 这与 MV1Demo 的 L1 定时器（3秒）配合，覆盖用户在任何页面答题后的经验同步
  useEffect(() => {
    const iv = setInterval(() => xpTick(t => t + 1), 5000)
    return () => clearInterval(iv)
  }, [])

  // ★ 页面可见性变化时立即刷新（用户切回时立刻看到最新经验）
  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden) xpTick(t => t + 1)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  const currentPet = gameState?.currentPet || {}
  const level = currentPet?.level || 1
  // ★ 根治修复：统一使用共享池经验计算（与主面板MV1Demo一致）
  // 不再使用 currentPet.exp（独立内存字段，答题后永远不增长）
  // 改用 totalXP - petExpConsumed 的共享池模式（与 storage.addXP 同步）
  const totalXP = storage.getXP(storage.getUser()?.id || '') || gameState?.exp || 0
  const petExpConsumed = gameState?.petExpConsumed || 0
  const exp   = Math.max(0, totalXP - petExpConsumed)
  const stats = currentPet?.stats || {}

  const eggMode = isEggState(gameState)

  // 任意属性 < 10 → 哭泣锁定
  const isCrying = !isLearning && (
    (stats.hunger     !== undefined && stats.hunger     < 10) ||
    (stats.energy     !== undefined && stats.energy     < 10) ||
    (stats.intimacy   !== undefined && stats.intimacy   < 10)
  )

  // 计算当前显示的 pose
  const getDockPose = () => {
    if (isLearning) return 'reading'
    if (isCrying)   return 'sad_cry'
    if (isAngry)    return 'angry'
    const idx = Math.floor(tapCount / 3) % CYCLING_POSES.length
    return CYCLING_POSES[idx]
  }
  const dockPose = getDockPose()

  // 点击宠物
  const handlePetTap = useCallback((e) => {
    e?.stopPropagation()
    // 学习中 / 哭泣时 → 完全无响应
    if (isLearning || isCrying) return

    // 更新连续点击计数
    setConsecutiveCount(prev => {
      const next = prev + 1
      if (next >= 20) {
        // 触发生气
        setIsAngry(true)
        if (angryTimerRef.current) clearTimeout(angryTimerRef.current)
        angryTimerRef.current = setTimeout(() => {
          setIsAngry(false)
          setConsecutiveCount(0)
          setTapCount(0)
        }, 5000)
        return 0
      }
      return next
    })

    // 5秒无点击 → 重置连续计数
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    resetTimerRef.current = setTimeout(() => {
      setConsecutiveCount(0)
    }, 5000)

    // 累计点击（每3次切换动作）
    setTapCount(prev => prev + 1)
  }, [isLearning, isCrying])

  // 清理定时器
  useEffect(() => () => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current)
    if (angryTimerRef.current) clearTimeout(angryTimerRef.current)
  }, [])

  const toggleVisible = useCallback(() => setVisible(v => !v), [])

  if (!visible) {
    return (
      <button
        onClick={toggleVisible}
        style={{
          position: 'fixed', bottom: 90, right: 16,
          width: 48, height: 48, borderRadius: '50%',
          border: '1px solid rgba(99,102,241,0.2)',
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(12px)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22,
          boxShadow: '0 4px 16px rgba(99,102,241,0.15), 0 1px 3px rgba(0,0,0,0.05)',
          zIndex: 9998,
          transition: 'transform 0.3s ease',
        }}
      >
        <PetSpriteAvatar poolId={currentPet?.poolId} level={level} size={26} pose={0} />
      </button>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 90,   // ← 上移，避免遮住错题等底部 UI
      right: 16,
      zIndex: 9999,
      transition: 'opacity 0.4s, transform 0.4s',
    }}>
      {/* 底部紫色光晕 */}
      <div style={{
        position: 'absolute', bottom: -8, left: '50%',
        transform: 'translateX(-50%)',
        width: '80%', height: 16, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(99,102,241,0.2) 0%, transparent 70%)',
        filter: 'blur(4px)',
        pointerEvents: 'none',
      }} />

      {/* 宠物主体 */}
      {eggMode ? (
        <div
          onClick={toggleVisible}
          style={{ cursor: 'pointer', animation: 'dockEggFloat 3s ease-in-out infinite' }}
        >
          <span className="text-5xl drop-shadow-lg" role="img">🥚</span>
          <div className="text-[9px] text-center text-white/50 mt-1">点击孵化</div>
        </div>
      ) : (
        <div>
          <Pet
            type={currentPet?.poolId || 'pet_toothless'}
            experience={exp}
            level={level}
            mode="dock"
            size={90}
            pose={dockPose}
            stats={currentPet.stats}
            equippedAccessories={currentPet.equippedAccessories}
            soundEnabled={gameState?.settings?.soundEnabled !== false}
            showStatsCompact={true}
            onTap={handlePetTap}
            isGodMode={!!gameState?._isGodMode}
          />
        </div>
      )}

      {/* 最小化按钮 */}
      <button
        onClick={toggleVisible}
        style={{
          position: 'absolute', top: -4, right: -4,
          width: 22, height: 22, borderRadius: '50%',
          border: '1px solid rgba(0,0,0,0.06)',
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(8px)',
          color: '#9ca3af', fontSize: 11, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          lineHeight: 1, padding: 0,
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          transition: 'background 0.2s',
        }}
      >−</button>

      <style>{`
        @keyframes dockEggFloat {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  )
}
