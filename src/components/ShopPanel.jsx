import React, { useState } from 'react'
import {
  SHOP_ITEMS, GAME_SHOP_ITEMS, ROOM_THEMES, FURNITURE_ITEMS,
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

export default function ShopPanel({ state, onBuy, onUseItem, spendableXP }) {
  const [activeTab, setActiveTab] = useState('items') // items | house | game_items | bag
  const [selectedItemId, setSelectedItemId] = useState(null)
  const [showBuyConfirm, setShowBuyConfirm] = useState(null)

  // 使用 spendableXP（当前等级内可消费经验）如果传入，否则回退到 state.exp
  const coins = spendableXP !== undefined ? spendableXP : (state?.exp || 0)
  const inventory = state?.inventory || {}

  return (
    <div>
      {/* 经验值显示 */}
      <div style={{
        background: 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
        borderRadius: 14, padding: '12px 16px',
        marginBottom: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#5b21b6' }}>🐱 可支配经验</span>
        <span style={{ fontSize: 20, fontWeight: 800, color: '#7c3aed' }}>{coins}</span>
      </div>

      {/* Tab 切换 */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {[
          { key: 'items', label: '🛒 道具店', icon: '🛒' },
          { key: 'house', label: '🏠 小屋装饰', icon: '🏠' },
          { key: 'game_items', label: '⚡ 游戏道具', icon: '⚡' },
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

      {/* ====== 小屋装饰 ====== */}
      {activeTab === 'house' && (
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#4c1d95', marginBottom: 10 }}>🏠 选择小屋主题</h3>
          {/* 当前主题预览 */}
          {state?.currentRoomTheme && (() => {
            const theme = ROOM_THEMES.find(t => t.id === state.roomTheme);
            if (!theme) return null;
            return (
              <div style={{
                background: theme.bg, borderRadius: 12, padding: 20,
                marginBottom: 12, minHeight: 100, position: 'relative',
                display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', top: 8, left: 10,
                  background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                  padding: '4px 10px', borderRadius: 20, fontSize: 11, color: 'white',
                  fontWeight: 600,
                }}>
                  当前：{theme.name}
                </div>
                {/* 地板 */}
                <div style={{
                  width: '100%', height: 30, background: theme.floor,
                  borderTop: `2px solid ${theme.accentColor}`, opacity: 0.8,
                }} />
              </div>
            );
          })()}
          
          {/* 主题列表 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {ROOM_THEMES.map(theme => {
              const owned = (state?.ownedRoomThemes || []).includes(theme.id);
              const active = state?.currentRoomTheme === theme.id;
              const canAfford = coins >= theme.price;
              return (
                <button
                  key={theme.id}
                  onClick={() => !active && (owned || canAfford) && onBuy(`room_theme_${theme.id}`)}
                  disabled={active}
                  style={{
                    border: active ? `2px solid ${theme.accentColor}` : '1px solid #e5e7eb',
                    borderRadius: 10, padding: 8,
                    cursor: active ? 'default' : (owned || canAfford) ? 'pointer' : 'not-allowed',
                    background: owned ? theme.bg : '#f9fafb',
                    opacity: active ? 1 : (owned || canAfford) ? 0.9 : 0.5,
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ fontSize: 18, marginBottom: 2 }}>{theme.name.split(' ')[0]}</div>
                  <div style={{ fontSize: 10, color: active ? theme.accentColor : '#6b7280', fontWeight: 600 }}>
                    {active ? '✓ 使用中' : owned ? '已拥有' : `${theme.price} 经验`}
                  </div>
                  <div style={{ fontSize: 9, color: '#9ca3af', marginTop: 2 }}>{theme.desc}</div>
                </button>
              )
            })}
          </div>

          {/* 家具列表 */}
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#4c1d95', margin: '14px 0 8px' }}>🛋️ 购买家具</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {FURNITURE_ITEMS.map(item => {
              const owned = (state?.ownedFurniture || []).includes(item.id);
              const canAfford = coins >= item.price;
              return (
                <button
                  key={item.id}
                  onClick={() => !owned && canAfford && onBuy(`furniture_${item.id}`)}
                  disabled={owned}
                  style={{
                    border: owned ? '2px solid #6366f1' : '1px solid #e5e7eb',
                    borderRadius: 10, padding: '8px 4px',
                    cursor: owned ? 'default' : canAfford ? 'pointer' : 'not-allowed',
                    background: owned ? '#eef2ff' : '#f9fafb',
                    opacity: owned ? 1 : canAfford ? 1 : 0.5,
                    transition: 'all 0.2s',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                  }}
                >
                  <span style={{ fontSize: 26 }}>{item.icon}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#374151' }}>{item.name}</span>
                  <span style={{ fontSize: 9, color: owned ? '#6366f1' : canAfford ? '#6b7280' : '#d1d5db', fontWeight: 600 }}>
                    {owned ? '✓ 已放置' : `${item.price} 经验`}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ====== 游戏道具 ====== */}
      {activeTab === 'game_items' && (
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#4c1d95', marginBottom: 10 }}>⚡ 游戏道具</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {GAME_SHOP_ITEMS.map(item => {
              const owned = (state?.gameInventory?.[item.id] || 0);
              const canBuy = coins >= item.price;
              const isMaxed = item.maxStack && owned >= item.maxStack;
              return (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'white', borderRadius: 10, padding: '10px 12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                }}>
                  <span style={{ fontSize: 24 }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{item.name}</div>
                    <div style={{ fontSize: 10, color: '#9caaf' }}>{item.desc}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {owned > 0 && (
                      <span style={{
                        fontSize: 12, fontWeight: 700, color: '#059669',
                        background: '#d1fae5', padding: '2px 8px', borderRadius: 10,
                      }}>×{owned}</span>
                    )}
                    {!isMaxed && (
                      <button
                        onClick={() => onBuy(item.id)}
                        disabled={!canBuy}
                        style={{
                          padding: '5px 12px', borderRadius: 8, border: 'none',
                          background: canBuy ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#e5e7eb',
                          color: canBuy ? 'white' : '#9caaf', fontSize: 11, fontWeight: 600,
                          cursor: canBuy ? 'pointer' : 'not-allowed',
                        }}
                      >{item.price}💰</button>
                    )}
                    {isMaxed && <span style={{ fontSize: 10, color: '#f59e0b' }}>已满</span>}
                  </div>
                </div>
              )
            })}
          </div>
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
