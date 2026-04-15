/**
 * PetSpriteAvatar v2 — 支持所有宠物的PNG头像组件
 *
 * 直接使用各宠物的独立PNG表情图（非精灵图裁剪）
 * 每只宠物根据等级自动选择对应阶段的 normal/happy 图作为头像
 *
 * 支持的宠物：
 *   - pet_kitten: 3阶段PNG (stage1/stage2/stage3)
 *   - pet_shiba: 3阶段PNG
 *   - pet_fox: Stage1 PNG（高等级复用）
 *   - pet_toothless: SVG精灵图（原有）
 */

import React from 'react'

// ============================================================
//  各宠物的头像图路径映射（按等级选阶段）
// ============================================================

function getKittenAvatarSrc(level = 1) {
  // 小橘猫：normal 或 happy 作为默认头像
  if (!level || level < 10) return '/pets/kitten/stage1/normal.png'
  if (level < 20) return '/pets/kitten/stage2/normal.png'
  return '/pets/kitten/stage3/normal.png'
}

function getShibaAvatarSrc(level = 1) {
  if (!level || level < 10) return '/pets/shiba/stage1/normal.png'
  if (level < 20) return '/pets/shiba/stage2/normal.png'
  return '/pets/shiba/stage3/happy.png'    // S3缺normal，用happy
}

function getFoxAvatarSrc() {
  // 银月狐只有Stage1
  return '/pets/fox/stage1/normal.png'
}

function getToothlessAvatarSrc(level = 1) {
  // 无牙仔用原有SVG等级图
  if (!level || level < 10) return '/pets/pet-level-1-10.png'
  if (level < 20) return '/pets/pet-level-11-20.png'
  return '/pets/pet-level-21-30.png'
}

/**
 * 根据poolId和等级获取头像PNG路径
 */
function getAvatarSrc(poolId, level = 1) {
  switch (poolId) {
    case 'pet_kitten':   return getKittenAvatarSrc(level)
    case 'pet_shiba':    return getShibaAvatarSrc(level)
    case 'pet_fox':      return getFoxAvatarSrc()
    case 'pet_toothless':return getToothlessAvatarSrc(level)
    default:             return null
  }
}

/**
 * SpriteCell - 用CSS background显示PNG头像（支持圆形裁切）
 */
export function SpriteCell({ src, size = 50, borderRadius = '50%', style = {} }) {
  if (!src) return null
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius,
        backgroundImage: `url(${src})`,
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        flexShrink: 0,
        ...style,
      }}
    />
  )
}

/**
 * PetSpriteAvatar - 智能头像组件
 *
 * Props:
 *   poolId: string (e.g. 'pet_kitten', 'pet_shiba', 'pet_fox', 'pet_toothless')
 *   level: number (用于选择成长阶段)
 *   size: number (px, 默认50)
 *   pose: number (保留参数，暂不影响——头像始终用normal姿态)
 *   emoji: string (完全不支持时的最终fallback)
 *   style: object (额外样式)
 */
export default function PetSpriteAvatar({ poolId, level = 1, size = 50, pose = 0, emoji = '🥚', style = {} }) {
  const src = getAvatarSrc(poolId, level)

  // 有PNG图 → 直接渲染
  if (src) {
    return <SpriteCell src={src} size={size} borderRadius="50%" style={style} />
  }

  // 最终fallback：emoji圆圈
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: 'linear-gradient(135deg, #ede9fe, #fce7f3)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: size * 0.52,
      flexShrink: 0,
      ...style,
    }}>
      {emoji}
    </div>
  )
}
