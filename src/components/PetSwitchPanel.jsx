import React, { useState } from 'react'
import PetSpriteAvatar from './PetSpriteAvatar'
import { PET_POOL } from '../utils/gamification'

/**
 * PetSwitchPanel - 我的宠物面板
 * 包含：宠物列表/切换、抽卡入口、宠物数据总览、卖宠物功能
 *
 * 卖宠物: 非当前出战的重复宠物可卖掉 → 获得250宠物成长经验
 */
export default function PetSwitchPanel({ state, spendableXP, onSwitchPet, onDrawCard, totalXP, onSellPet }) {
  const [confirmSellId, setConfirmSellId] = useState(null)
  const ownedPets = state.ownedPets || []
  const petPool = PET_POOL
  const currentPet = state.currentPet || {}
  const currentPoolInfo = petPool.find(p => p.poolId === currentPet.poolId) || { name: '宠物', emoji: '🐉', rarity: 'N' }
  const inventory = state.inventory || {}
  // 抽卡券（整数部分 + 小数部分）
  const cardFragments = state.cardFragments || 0  // 0.5 的倍数

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
        {/* 用PNG宠物图替代emoji */}
        <PetSpriteAvatar poolId={currentPet.poolId} level={currentPet.level || 1} size={72} pose={1} />
        <div style={{ fontSize: 18, fontWeight: 800, color: '#1f2937', marginBottom: 4, marginTop: 4 }}>
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
                  {owned ? (
                    <PetSpriteAvatar poolId={pet.poolId} level={(state.currentPet?.level || 1)} size={46} pose={1} />
                  ) : '❓'}
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
                  <div style={{ display: 'flex', gap: 4 }}>
                    {/* 检测是否重复（同类型有2只以上） */}
                    {ownedPets.filter(id => id === pet.poolId).length > 1 ? (
                      <>
                        {confirmSellId === pet.poolId ? (
                          <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); if (onSellPet) onSellPet(pet.poolId); setConfirmSellId(null); }}
                              onMouseDown={e => e.stopPropagation()}
                              style={{ padding: '3px 8px', borderRadius: 6, background: '#ef4444', color: 'white', fontSize: 9, fontWeight: 700, border: 'none', cursor: 'pointer' }}
                            >✅ 确认卖</button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setConfirmSellId(null); }}
                              onMouseDown={e => e.stopPropagation()}
                              style={{ padding: '3px 6px', borderRadius: 6, background: '#d1d5db', color: '#374151', fontSize: 9, fontWeight: 600, border: 'none', cursor: 'pointer' }}
                            >✕</button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmSellId(pet.poolId); }}
                            style={{
                              padding: '4px 10px', borderRadius: 8,
                              background: '#fef2f2', color: '#ef4444',
                              fontSize: 9, fontWeight: 700, border: '1px solid #fecaca', cursor: 'pointer'
                            }}>💰 +250经验</button>
                        )}
                      </>
                    ) : null}
                    <span
                      style={{ padding: '4px 10px', borderRadius: 8, background: '#f3f4f6', color: '#6b7280', fontSize: 10, fontWeight: 600 }}
                      onClick={() => onSwitchPet(pet.poolId)}
                    >切换</span>
                  </div>
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
