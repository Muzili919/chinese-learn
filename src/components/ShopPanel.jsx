import React, { useState } from 'react'
import {
  SHOP_ITEMS, ACCESSORY_SHOP,
  buyItem, buyAccessory, useItemOnPet,
  equipAccessory, unequipAccessory,
  getEquippedAccessory
} from '../utils/gamification'

/**
 * ShopPanel v2 - 完整商店面板
 * 
 * 包含：
 *  - 食物/清洁/活力/道具商店（带emoji图片）
 *  - 配饰装扮商店（头部/颈部/背部三个槽位）
 *  - 已购商品使用功能
 *  - 当前装备预览
 */

const RARITY_COLORS = {
  N:   { bg: '#f3f4f6', border: '#d1d5db', text: '#6b7280' },
  R:   { bg: '#dbeafe', border: '#60a5fa', text: '#2563eb' },
  SR:  { bg: '#fef3c7', border: '#fbbf24', text: '#d97706' },
  SSR: { bg: '#ede9fe', border: '#a78bfa', text: '#7c3aed' },
}

export default function ShopPanel({ state, onBuy, onUseItem }) {
  const [activeTab, setActiveTab] = useState('items') // items | accessories | equipped
  const [selectedItemId, setSelectedItemId] = useState(null)
  const [showBuyConfirm, setShowBuyConfirm] = useState(null)
  
  const coins = state?.exp || 0
  const inventory = state?.inventory || {}
  const ownedAccessories = inventory?.accessories || []
  const equipped = state?.currentPet?.equippedAccessories || {}

  return (
    <div>
      {/* 经验值显示 */}
      <div style={{
        background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
        borderRadius: 14, padding: '12px 16px',
        marginBottom: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#5b21b6' }}>⭐ 学习经验</span>
        <span style={{ fontSize: 20, fontWeight: 800, color: '#7c3aed' }}>{coins}</span>
      </div>

      {/* Tab 切换 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {[
          { key: 'items', label: '🛒 道具店', icon: '🛒' },
          { key: 'accessories', label: '👗 装扮店', icon: '👗' },
          { key: 'equipped', label: '🎨 我的搭配', icon: '🎨' },
          { key: 'bag', label: '🎒 背包', icon: '🎒' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, padding: '8px 4px', border: 'none', borderRadius: 10,
              background: activeTab === tab.key
                ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                : 'white',
              color: activeTab === tab.key ? 'white' : '#6b7280',
              fontWeight: activeTab === tab.key ? 600 : 500,
              fontSize: 11,
              cursor: 'pointer',
              boxShadow: activeTab === tab.key
                ? '0 3px 10px rgba(99,102,241,0.3)'
                : '0 1px 3px rgba(0,0,0,0.06)',
              transition: 'all 0.2s',
            }}
          >{tab.label}</button>
        ))}
      </div>

      {/* ====== 道具店 ====== */}
      {activeTab === 'items' && SHOP_ITEMS && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10,
        }}>
          {SHOP_ITEMS.map(item => {
            const rarity = RARITY_COLORS[item.rarity] || RARITY_COLORS.N
            const canAfford = coins >= item.price

            return (
              <div key={item.id} style={{
                background: rarity.bg,
                borderRadius: 14, padding: 12,
                border: `2px solid ${rarity.border}`,
                position: 'relative',
              }}>
                {/* 稀度标签 */}
                <div style={{
                  position: 'absolute', top: 6, right: 6,
                  background: rarity.bg, color: rarity.text,
                  fontSize: 9, fontWeight: 700, padding: '2px 6px',
                  borderRadius: 4, border: `1px solid ${rarity.border}`,
                }}>{item.rarity}</div>

                {/* 商品图标/图片区 */}
                <div style={{
                  width: '100%', aspectRatio: '1',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'white', borderRadius: 10, marginBottom: 8,
                  fontSize: 40,
                }}>
                  {item.icon}
                </div>

                {/* 商品名 */}
                <div style={{
                  fontSize: 12, fontWeight: 600, color: '#374151',
                  textAlign: 'center', marginBottom: 4,
                }}>{item.name}</div>
                
                {/* 效果描述 */}
                <div style={{
                  fontSize: 10, color: '#6b7280', textAlign: 'center',
                  minHeight: 14, marginBottom: 6,
                }}>{item.desc}</div>

                {/* 价格 + 购买按钮 */}
                <button
                  onClick={() => canAfford && onBuy?.(item.id)}
                  disabled={!canAfford}
                  style={{
                    width: '100%', padding: '7px 0', borderRadius: 8,
                    border: 'none',
                    background: canAfford
                      ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                      : '#e5e7eb',
                    color: canAfford ? 'white' : '#9ca3af',
                    fontSize: 11, fontWeight: 700,
                    cursor: canAfford ? 'pointer' : 'not-allowed',
                    transition: 'all 0.15s',
                    boxShadow: canAfford ? '0 2px 8px rgba(99,102,241,0.25)' : 'none',
                  }}
                >
                  ⭐ {item.price}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* ====== 装扮店 ====== */}
      {activeTab === 'accessories' && ACCESSORY_SHOP && (
        <div>
          {/* 槽位筛选 */}
          <div style={{
            display: 'flex', gap: 6, marginBottom: 10,
            flexWrap: 'wrap',
          }}>
            {[
              { slot: 'head', label: '🎩 头部' },
              { slot: 'neck', label: '🧣 颈部' },
              { slot: 'back', label: '🎒 背部' },
            ].map(s => (
              <button key={s.slot}
                style={{
                  padding: '5px 12px', borderRadius: 8, border: 'none',
                  background: '#f3f4f6', color: '#374151',
                  fontSize: 11, fontWeight: 500, cursor: 'pointer',
                }}
              >{s.label}</button>
            ))}
          </div>

          {/* 配饰列表 */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
          }}>
            {ACCESSORY_SHOP.map(acc => {
              const rarity = RARITY_COLORS[acc.rarity] || RARITY_COLORS['N']
              const owned = ownedAccessories.includes(acc.id)
              const equippedSlot = equipped[acc.slot] === acc.id
              const canAfford = coins >= acc.price

              return (
                <div key={acc.id} style={{
                  background: owned
                    ? (equippedSlot ? '#d1fae5' : rarity.bg)
                    : '#f9fafb',
                  borderRadius: 12, padding: 10,
                  border: equippedSlot
                    ? '2px solid #34d399'
                    : owned
                      ? `2px dashed ${rarity.border}`
                      : '1px solid #f3f4f6',
                  position: 'relative',
                  textAlign: 'center',
                }}>
                  {/* 已装备标记 */}
                  {equippedSlot && (
                    <div style={{
                      position: 'absolute', top: 4, right: 4,
                      background: '#34d399', color: 'white',
                      fontSize: 8, fontWeight: 700, padding: '1px 5px',
                      borderRadius: 4,
                    }}>穿戴中</div>
                  )}

                  {/* 配饰大图 */}
                  <div style={{
                    fontSize: 36, lineHeight: 1, marginBottom: 4,
                  }}>{acc.emoji}</div>

                  <div style={{
                    fontSize: 10, fontWeight: 600, color: '#374151',
                  }}>{acc.name}</div>

                  <div style={{
                    fontSize: 9, color: '#9ca3af', marginTop: 2,
                    height: 22, overflow: 'hidden',
                  }}>{acc.desc}</div>

                  {owned ? (
                    <button
                      onClick={() => {
                        if (equippedSlot) onBuy?.(`unequip_${acc.slot}`)
                        else onBuy?.(`equip_${acc.id}`)
                      }}
                      style={{
                        width: '100%', padding: '4px 0', borderRadius: 6,
                        border: 'none',
                        background: equippedSlot
                          ? '#ef4444'
                          : '#34d399',
                        color: 'white', fontSize: 10, fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      {equippedSlot ? '脱下' : '穿上'}
                    </button>
                  ) : (
                    <button
                      onClick={() => canAfford && onBuy?.(`buy_acc_${acc.id}`)}
                      disabled={!canAfford}
                      style={{
                        width: '100%', padding: '4px 0', borderRadius: 6,
                        border: 'none',
                        background: canAfford ? rarity.bg : '#f3f4f6',
                        color: canAfford ? rarity.text : '#9ca3af',
                        fontSize: 10, fontWeight: 600,
                        cursor: canAfford ? 'pointer' : 'not-allowed',
                      }}
                    >
                      ⭐{acc.price}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ====== 我的搭配 ====== */}
      {activeTab === 'equipped' && (
        <div style={{ textAlign: 'center' }}>
          {/* 宠物预览 + 配饰叠加展示 */}
          <div style={{
            position: 'relative', width: 180, height: 200,
            margin: '0 auto 16px',
          }}>
            {/* 宠物底图 */}
            <div style={{ fontSize: 140, position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)' }}>🐉</div>
            
            {/* 各部位配饰 */}
            {['head', 'neck', 'back'].map(slot => {
              const accId = equipped[slot]
              if (!accId) return null
              const acc = ACCESSORY_SHOP.find(a => a.id === accId)
              if (!acc) return null
              
              const positions = {
                head: { top: '-2%', left: '50%', transform: 'translateX(-50%)', size: 42 },
                neck: { top: '38%', left: '50%', transform: 'translateX(-50%)', size: 32 },
                back: { top: '15%', left: '-5%', transform: '', size: 48 },
              }
              const pos = positions[slot]
              
              return (
                <div key={slot} style={{
                  position: 'absolute',
                  ...pos,
                  fontSize: pos.size,
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                }}>
                  {acc.emoji}
                </div>
              )
            })}
          </div>

          {/* 槽位列表 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { slot: 'head', label: '🎩 头部', emptyTip: '还没有头饰哦~' },
              { slot: 'neck', label: '🧣 颈部', emptyTip: '颈部空空的~' },
              { slot: 'back', label: '🎒 背部', emptyTip: '背上还缺东西~' },
            ].map(({ slot, label, emptyTip }) => {
              const accId = equipped[slot]
              const acc = accId ? ACCESSORY_SHOP.find(a => a.id === accId) : null

              return (
                <div key={slot} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'white', borderRadius: 12, padding: '10px',
                  border: '1px solid #f3f4f6',
                }}>
                  <span style={{ fontSize: 18 }}>{label.split(' ')[0]}</span>
                  
                  {acc ? (
                    <>
                      <div style={{
                        flex: 1, display: 'flex', alignItems: 'center', gap: 8,
                      }}>
                        <span style={{ fontSize: 24 }}>{acc.emoji}</span>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
                            {acc.name}
                          </div>
                          <div style={{ fontSize: 10, color: '#9ca3af' }}>
                            {RARITY_COLORS[acc.rarity]?.text && `${acc.rarity}`}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => onBuy?.(`unequip_${slot}`)}
                        style={{
                          padding: '5px 12px', borderRadius: 8, border: 'none',
                          background: '#fee2e2', color: '#dc2626',
                          fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        }}
                      >脱下</button>
                    </>
                  ) : (
                    <span style={{
                      flex: 1, fontSize: 11, color: '#9ca3af',
                      fontStyle: 'italic', textAlign: 'left',
                    }}>{emptyTip}</span>
                  )}
                </div>
              )
            })}
          </div>
          
          <p style={{ margin: '12px 0 0', fontSize: 11, color: '#9ca3af' }}>
            去装扮店购买更多配饰！
          </p>
        </div>
      )}

      {/* ====== 背包 ====== */}
      {activeTab === 'bag' && (
        <div>
          <h4 style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: '0 0 8px' }}>
            🎒 我的背包
          </h4>
          
          {/* 食物库存 */}
          <InventorySection title="🍖 食物" items={[
            { name: '普通鱼干', icon: '🐟', count: inventory.foods?.basic || 0, id: 'use_food_basic' },
            { name: '烤全鱼', icon: '🐠', count: inventory.foods?.advanced || 0, id: 'use_food_advanced' },
          ]} onUse={onUseItem} />
          
          {/* 清洁用品 */}
          <InventorySection title="🧴 清洁" items={[
            { name: '沐浴露', icon: '🧴', count: inventory.cleanItems || 0, id: 'use_clean_basic' },
          ]} onUse={onUseItem} />

          {/* 活力道具 */}
          <InventorySection title="⚡ 活力" items={[
            { name: '能量饮料', icon: '🥤', count: inventory.energyItems || 0, id: 'use_energy_drink' },
          ]} onUse={onUseItem} />

          {/* 礼物 */}
          <InventorySection title="🎁 礼物" items={[
            { name: '小玩具', icon: '🧸', count: inventory.giftItems || 0, id: 'use_gift_toy' },
          ]} onUse={onUseItem} />

          {/* 抽卡券 */}
          <InventorySection title="🃏 其他" items={[
            { name: '抽卡券', icon: '🃏', count: inventory.cards || 0, id: 'card_draw' },
          ]} onUse={onUseItem} />

          {(inventory.foods?.basic || 0) + (inventory.foods?.advanced || 0) + 
           (inventory.cleanItems || 0) + (inventory.energyItems || 0) +
           (inventory.giftItems || 0) + (inventory.cards || 0) === 0 && (
            <div style={{
              textAlign: 'center', padding: '32px 0',
              color: '#9ca3af', fontSize: 13,
            }}>
              背包空空如也~ 去商店买点东西吧!
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// 子组件：背包分类区块
function InventorySection({ title, items, onUse }) {
  const hasItems = items.some(i => i.count > 0)
  if (!hasItems) return null
  
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>
        {title}
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6,
      }}>
        {items.filter(i => i.count > 0).map(item => (
          <div key={item.id} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'white', borderRadius: 10, padding: '8px 10px',
            border: '1px solid #f3f4f6',
          }}>
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 500, color: '#374151' }}>{item.name}</div>
              <div style={{ fontSize: 10, color: '#6366f1', fontWeight: 700 }}>×{item.count}</div>
            </div>
            <button
              onClick={() => onUse?.(item.id)}
              style={{
                padding: '4px 10px', borderRadius: 6, border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: 'white', fontSize: 10, fontWeight: 600,
                cursor: 'pointer',
              }}
            >使用</button>
          </div>
        ))}
      </div>
    </div>
  )
}

export { RARITY_COLORS }
