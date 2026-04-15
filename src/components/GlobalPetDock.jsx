import React, { useEffect, useState, useCallback } from 'react'
import Pet from './Pet'

/**
 * GlobalPetDock - 全局悬浮宠物窗
 * 
 * 显示在所有页面右下角的宠物小窗口
 * - dock模式：透明底、纯展示、3D悬浮
 * - 可选迷你状态条显示低属性警告
 */
export default function GlobalPetDock({ gameState }) {
  const [visible, setVisible] = useState(true)
  
  // 从游戏状态获取宠物数据
  const currentPet = gameState?.currentPet || {}
  const level = currentPet?.level || 1
  const exp = currentPet?.exp || 0

  // 自动隐藏逻辑（可选）
  useEffect(() => {
    // 如果在宠物互动页，可以隐藏dock
    // 这里保持始终显示
  }, [])

  // 切换可见性
  const toggleVisible = useCallback(() => {
    setVisible(v => !v)
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
      >🐉</button>
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

      {/* 宠物主体 */}
      <Pet
        type={currentPet?.poolId || 'pet_toothless'}
        experience={exp}
        level={level}
        mode="dock"
        size={90}
        pose="sleeping"
        stats={currentPet.stats}
        equippedAccessories={currentPet.equippedAccessories}
        soundEnabled={gameState?.settings?.soundEnabled !== false}
        showStatsCompact={true}
      />
      
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
    </div>
  )
}
