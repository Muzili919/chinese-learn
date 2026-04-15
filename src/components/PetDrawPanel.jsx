import React, { useState } from 'react'
import PetSpriteAvatar from './PetSpriteAvatar'

/**
 * PetDrawPanel - 宠物抽卡面板
 * 展示抽卡动画和结果，消耗500经验抽一次
 */
export default function PetDrawPanel({ spendableXP, onDrawCard, ownedPets = [], petPool = [] }) {
  const [drawing, setDrawing] = useState(false)
  const [result, setResult] = useState(null)
  const [showResult, setShowResult] = useState(false)

  const canAfford = spendableXP >= 500

  const handleDraw = () => {
    if (!canAfford || drawing) return
    setDrawing(true)
    setShowResult(false)
    setResult(null)

    // 模拟抽卡动画
    setTimeout(() => {
      const drawn = onDrawCard()
      setDrawing(false)

      if (drawn) {
        // 重新获取当前宠物信息来判断抽到了什么
        setShowResult(true)
      }
    }, 1500)
  }

  // 根据已拥有的宠物列表和宠物池展示收集进度
  const totalPets = petPool.length
  const ownedCount = ownedPets.length
  const collectedAll = ownedCount >= totalPets

  return (
    <div>
      {/* 收集进度 */}
      <div style={{
        background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
        borderRadius: 16, padding: 16, marginBottom: 14,
        boxShadow: '0 2px 10px rgba(245,158,11,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#92400e' }}>🎴 宠物图鉴</span>
          <span style={{ fontSize: 12, color: '#b45309', fontWeight: 600 }}>
            {ownedCount}/{totalPets}
          </span>
        </div>
        <div style={{ width: '100%', background: 'rgba(255,255,255,0.6)', borderRadius: 6, height: 8, overflow: 'hidden', marginBottom: 10 }}>
          <div style={{
            width: `${totalPets > 0 ? (ownedCount / totalPets) * 100 : 0}%`,
            height: '100%', borderRadius: 6,
            background: collectedAll
              ? 'linear-gradient(90deg, #f59e0b, #ef4444)'
              : 'linear-gradient(90deg, #fbbf24, #f59e0b)',
            transition: 'width 0.5s',
          }} />
        </div>
        {collectedAll && (
          <div style={{ textAlign: 'center', fontSize: 12, color: '#92400e', fontWeight: 600 }}>
            🎉 全部收集完成！
          </div>
        )}
      </div>

      {/* 已拥有的宠物展示 */}
      <div style={{ marginBottom: 14 }}>
        <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: 13, color: '#374151' }}>✨ 已拥有</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {petPool.map(pet => {
            const owned = ownedPets.includes(pet.poolId)
            return (
              <div key={pet.poolId} style={{
                width: 80, textAlign: 'center',
                padding: '10px 4px', borderRadius: 14,
                background: owned ? 'white' : '#f9fafb',
                border: owned ? '2px solid #e5e7eb' : '2px dashed #e5e7eb',
                opacity: owned ? 1 : 0.4,
                boxShadow: owned ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                position: 'relative',
              }}>
                {owned && (
                  <div style={{
                    position: 'absolute', top: 2, right: 4,
                    fontSize: 8, color: '#10b981',
                  }}>✓</div>
                )}
                <div style={{ fontSize: 32, marginBottom: 4 }}>
                  {owned ? <PetSpriteAvatar poolId={pet.poolId} level={1} size={32} pose={2} /> : '❓'}
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, color: owned ? '#374151' : '#9ca3af' }}>
                  {owned ? pet.name : '???'}
                </div>
                <div style={{
                  fontSize: 9, fontWeight: 700, marginTop: 2,
                  color: pet.rarity === 'SSR' ? '#a855f7' : pet.rarity === 'SR' ? '#f59e0b' : pet.rarity === 'R' ? '#3b82f6' : '#6b7280',
                }}>
                  {pet.rarity}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 抽卡按钮 */}
      <div style={{ textAlign: 'center', marginTop: 16 }}>
        {!showResult && (
          <button
            onClick={handleDraw}
            disabled={!canAfford || drawing || collectedAll}
            style={{
              padding: '14px 40px', border: 'none', borderRadius: 16,
              background: canAfford && !drawing && !collectedAll
                ? 'linear-gradient(135deg, #fbbf24, #f59e0b)'
                : '#e5e7eb',
              color: canAfford && !drawing && !collectedAll ? 'white' : '#9ca3af',
              fontSize: 16, fontWeight: 800,
              cursor: canAfford && !drawing && !collectedAll ? 'pointer' : 'not-allowed',
              boxShadow: canAfford && !drawing && !collectedAll
                ? '0 6px 20px rgba(245,158,11,0.4)'
                : 'none',
              transition: 'all 0.3s',
              position: 'relative', overflow: 'hidden',
            }}
          >
            {drawing ? (
              <span style={{ animation: 'drawSpin 0.8s linear infinite' }}>🎴 抽取中...</span>
            ) : collectedAll ? (
              '🎉 已全部收集'
            ) : (
              '🎴 抽宠物 ⭐500'
            )}
          </button>
        )}
        {!canAfford && !drawing && !collectedAll && (
          <p style={{ margin: '8px 0 0', fontSize: 11, color: '#ef4444' }}>
            经验不足500，继续答题获取经验吧！
          </p>
        )}

        {/* 抽卡结果展示 */}
        {showResult && (
          <div style={{
            marginTop: 16,
            animation: 'resultPop 0.5s ease-out',
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #ede9fe, #fce7f3)',
              borderRadius: 20, padding: 24,
              boxShadow: '0 8px 32px rgba(139,92,246,0.2)',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: 12, color: '#7c3aed', margin: '0 0 8px' }}>🎊 恭喜获得！</p>
              <div style={{ fontSize: 64, marginBottom: 8 }}>
                {result?.poolId ? <PetSpriteAvatar poolId={result.poolId} level={1} size={64} pose={2} /> : (result?.emoji || '🐉')}
              </div>
              <p style={{ fontSize: 18, fontWeight: 800, color: '#1f2937', margin: '0 0 4px' }}>
                {result?.name || '无牙仔'}
              </p>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 12px' }}>
                {result?.desc || '没牙的小黑龙'}
              </p>
              <button
                onClick={() => setShowResult(false)}
                style={{
                  padding: '8px 24px', border: 'none', borderRadius: 10,
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: 'white', fontSize: 13, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                太棒了！
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 抽卡规则 */}
      <div style={{
        marginTop: 20, padding: '12px 14px',
        background: '#f9fafb', borderRadius: 12,
        fontSize: 11, color: '#6b7280', lineHeight: 1.7,
      }}>
        <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#374151' }}>📜 抽卡规则</p>
        <p style={{ margin: 0 }}>• 每次消耗 <strong>500经验</strong> 抽取一只宠物</p>
        <p style={{ margin: 0 }}>• 已拥有的宠物不会重复出现（自动替换为新宠物）</p>
        <p style={{ margin: 0 }}>• 等级越高，稀有宠物概率越大</p>
        <p style={{ margin: 0 }}>• 答题获得经验 → 来这里抽宠物吧！</p>
      </div>

      <style>{`
        @keyframes drawSpin {
          0% { opacity: 0.5; transform: scale(0.95); }
          50% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 0.5; transform: scale(0.95); }
        }
        @keyframes resultPop {
          0% { opacity: 0; transform: scale(0.5) translateY(20px); }
          60% { transform: scale(1.1) translateY(-5px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}
