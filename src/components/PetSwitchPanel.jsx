import React from 'react'

/**
 * PetSwitchPanel - 我的宠物面板
 * 包含：宠物列表/切换、抽卡入口、宠物数据总览
 */
export default function PetSwitchPanel({ state, spendableXP, onSwitchPet, onDrawCard, totalXP }) {
  const ownedPets = state.ownedPets || []
  const petPool = state.petPool || []
  const currentPet = state.currentPet || {}
  const currentPoolInfo = petPool.find(p => p.poolId === currentPet.poolId) || { name: '宠物', emoji: '🐉', rarity: 'N' }
  const inventory = state.inventory || {}

  const totalItems = (inventory.foods?.basic || 0) + (inventory.foods?.advanced || 0) +
    (inventory.cleanItems || 0) + (inventory.energyItems || 0) +
    (inventory.giftItems || 0) + (inventory.cards || 0)
  const totalAccessories = (inventory.accessories || []).length
  const allAccessories = 25 // 配饰总数（10头+8颈+7背）

  return (
    <div>
      {/* 当前宠物信息卡 */}
      <div style={{
        background: 'linear-gradient(135deg, #ede9fe, #fce7f3)',
        borderRadius: 20, padding: 20, marginBottom: 14,
        textAlign: 'center',
        boxShadow: '0 4px 16px rgba(139,92,246,0.12)',
      }}>
        <div style={{ fontSize: 56, marginBottom: 8 }}>{currentPoolInfo.emoji}</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#1f2937', marginBottom: 4 }}>
          {currentPoolInfo.name}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{
            padding: '2px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700,
            background: currentPoolInfo.rarity === 'SSR' ? '#fef3c7' : currentPoolInfo.rarity === 'SR' ? '#ede9fe' : '#dbeafe',
            color: currentPoolInfo.rarity === 'SSR' ? '#92400e' : currentPoolInfo.rarity === 'SR' ? '#6d28d9' : '#2563eb',
          }}>
            {currentPoolInfo.rarity}
          </span>
          <span style={{
            padding: '2px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600,
            background: 'white', color: '#6b7280',
          }}>
            Lv.{currentPet.level || 1}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 11, color: '#7c3aed' }}>{currentPoolInfo.desc}</p>
      </div>

      {/* 数据统计 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 14 }}>
        {[
          { label: '答题数', value: state.totalLearnQuestions || 0, icon: '📝', color: '#6366f1' },
          { label: '活跃天数', value: state.daysActive || 1, icon: '🔥', color: '#f59e0b' },
          { label: '拥有宠物', value: ownedPets.length, icon: '🐾', color: '#ec4899' },
        ].map(card => (
          <div key={card.label} style={{
            background: 'white', borderRadius: 12, padding: 12, textAlign: 'center',
            boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
          }}>
            <div style={{ fontSize: 18 }}>{card.icon}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: card.color, lineHeight: 1.2, marginTop: 2 }}>{card.value}</div>
            <div style={{ fontSize: 9, color: '#9ca3af' }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* 我的宠物列表 */}
      <div style={{ marginBottom: 14 }}>
        <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: 14, color: '#374151' }}>
          🐾 我的宠物 ({ownedPets.length})
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {petPool.map(pet => {
            const owned = ownedPets.includes(pet.poolId)
            const active = pet.poolId === currentPet.poolId
            return (
              <div key={pet.poolId} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: active ? 'linear-gradient(135deg, #ede9fe, #e0e7ff)' : 'white',
                borderRadius: 14, padding: '12px 14px',
                border: active ? '2px solid #8b5cf6' : '1px solid #f3f4f6',
                boxShadow: active ? '0 2px 12px rgba(139,92,246,0.2)' : '0 1px 4px rgba(0,0,0,0.03)',
                opacity: owned ? 1 : 0.35,
                cursor: owned && !active ? 'pointer' : 'default',
                transition: 'all 0.2s',
              }}
              onClick={() => owned && !active && onSwitchPet(pet.poolId)}
              >
                <div style={{
                  width: 50, height: 50, borderRadius: 50,
                  background: owned ? 'linear-gradient(135deg, #f3e8ff, #fce7f3)' : '#f3f4f6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28,
                }}>
                  {owned ? pet.emoji : '❓'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: owned ? '#1f2937' : '#9ca3af' }}>
                      {owned ? pet.name : '???'}
                    </span>
                    <span style={{
                      padding: '1px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700,
                      background: pet.rarity === 'SSR' ? '#fef3c7' : pet.rarity === 'SR' ? '#ede9fe' : pet.rarity === 'R' ? '#dbeafe' : '#f3f4f6',
                      color: pet.rarity === 'SSR' ? '#92400e' : pet.rarity === 'SR' ? '#6d28d9' : pet.rarity === 'R' ? '#2563eb' : '#6b7280',
                    }}>{pet.rarity}</span>
                  </div>
                  <p style={{ margin: '2px 0 0', fontSize: 10, color: '#9ca3af' }}>
                    {owned ? pet.desc : '尚未解锁'}
                  </p>
                </div>
                {active && (
                  <span style={{
                    padding: '4px 10px', borderRadius: 8,
                    background: '#6366f1', color: 'white',
                    fontSize: 10, fontWeight: 700,
                  }}>出战中</span>
                )}
                {owned && !active && (
                  <span style={{
                    padding: '4px 10px', borderRadius: 8,
                    background: '#f3f4f6', color: '#6b7280',
                    fontSize: 10, fontWeight: 600,
                  }}>切换</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* 我的收集 */}
      <div style={{ marginBottom: 14 }}>
        <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: 14, color: '#374151' }}>
          🎨 我的收集
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div style={{
            background: 'white', borderRadius: 12, padding: 12,
            border: '1px solid #f3f4f6', textAlign: 'center',
          }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>🎒</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#6366f1' }}>{totalItems}</div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>道具</div>
          </div>
          <div style={{
            background: 'white', borderRadius: 12, padding: 12,
            border: '1px solid #f3f4f6', textAlign: 'center',
          }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>👗</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#8b5cf6' }}>{totalAccessories}/{allAccessories}</div>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>配饰</div>
          </div>
        </div>
      </div>
    </div>
  )
}
