import React, { useEffect, useState, useCallback } from 'react'
import Pet from './Pet'
import PetEgg from './PetEgg'
import PetSpriteAvatar from './PetSpriteAvatar'
import { isEggState } from '../utils/gamification'

/**
 * GlobalPetDock - 全局悬浮宠物窗
 * 
 * 显示在所有页面右下角的宠物小窗口
 * - dock模式：透明底、纯展示、3D悬浮
 * - 蛋态：显示小蛋 + 提示点击孵化
 * - 点击互动：每次点击切换不同表情（循环6种）
 */

// Dock点击互动表情序列（根据素材9动作匹配）
const DOCK_POSE_SEQUENCE = [
  'sleeping',   // 💤 默认：睡觉
  'happy',      // 😊 点击1次：开心（可爱）
  'wave',       // 👋 点击2次+：打招呼
  'excited',    // ✨ 点击3次+：兴奋
  'angry',      // 😠 点击4次+：生气
  'sad_cry',    // 😭 点击5次+：哭泣（再点循环回sleeping）
]

export default function GlobalPetDock({ gameState, onOpenPetPanel }) {
  const [visible, setVisible] = useState(true)
  const [tapCount, setTapCount] = useState(0)
  
  // 从游戏状态获取宠物数据
  const currentPet = gameState?.currentPet || {}
  const level = currentPet?.level || 1
  const exp = currentPet?.exp || 0

  // 是否蛋态
  const eggMode = isEggState(gameState)

  // 根据点击次数获取当前dock pose
  const dockPose = DOCK_POSE_SEQUENCE[tapCount % DOCK_POSE_SEQUENCE.length]

  // 切换可见性
  const toggleVisible = useCallback(() => {
    setVisible(v => !v)
  }, [])

  // 点击宠物 → 切换表情
  const handlePetTap = useCallback((e) => {
    e?.stopPropagation()
    setTapCount(prev => prev + 1)
  }, [])

  if (!visible) {
    return (
      <button
        onClick={toggleVisible}
        style={{
          position: 'fixed', bottom: 20, right: 20,
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
      bottom: 18,
      right: 18,
      zIndex: 9999,
      transition: 'opacity 0.4s, transform 0.4s',
    }}>
      {/* 底部紫色光晕装饰 */}
      <div style={{
        position: 'absolute', bottom: -8, left: '50%',
        transform: 'translateX(-50%)',
        width: '80%', height: 16, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(99,102,241,0.2) 0%, transparent 70%)',
        filter: 'blur(4px)',
        pointerEvents: 'none',
      }} />

      {/* 宠物主体：蛋态 vs 正常 */}
      {eggMode ? (
        /* 🥚 蛋态 Dock */
        <div 
          onClick={onOpenPetPanel}
          style={{ cursor: 'pointer', animation: 'dockEggFloat 3s ease-in-out infinite' }}
        >
          <span className="text-5xl drop-shadow-lg" role="img">🥚</span>
          {/* 小提示 */}
          <div className="text-[9px] text-center text-white/50 mt-1">点击孵化</div>
        </div>
      ) : (
        <div onClick={handlePetTap} style={{ cursor: 'pointer' }}>
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
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  )
}
