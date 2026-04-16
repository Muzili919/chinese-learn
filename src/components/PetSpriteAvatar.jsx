/**
 * PetSpriteAvatar v3 — 支持所有11只宠物的PNG头像组件
 *
 * 直接使用各宠物的独立PNG表情图（非精灵图裁剪）
 * 每只宠物根据等级自动选择对应阶段的图片作为头像
 *
 * 支持的宠物：
 *   - pet_kitten: 3阶段PNG (stage1/stage2/stage3) - 9动作
 *   - pet_shiba: 3阶段PNG - 9动作
 *   - pet_hamster: 3阶段PNG - 9动作
 *   - pet_corgi: 3阶段PNG - 9动作
 *   - pet_fox: 3阶段PNG - 9动作
 *   - pet_butterfly: 3阶段PNG - 9动作
 *   - pet_mantis: 3阶段PNG - 9动作
 *   - pet_squirrel: 3阶段PNG - 9动作
 *   - pet_kungfu: 3阶段PNG - 9动作
 *   - pet_toothless: 3阶段PNG - 9动作
 *
 * pose映射: 0=reading 1=sleeping/happy 2=normal 3=excited 4=random_cute
 */

import React from 'react'

// ============================================================
//  所有宠物的prefix映射
// ============================================================
const PET_PREFIX_MAP = {
  pet_kitten: 'kitten',
  pet_shiba: 'shiba',
  pet_hamster: 'hamster',
  pet_corgi: 'corgi',
  pet_fox: 'fox',
  pet_butterfly: 'butterfly',
  pet_mantis: 'mantis',
  pet_squirrel: 'squirrel',
  pet_kungfu: 'kungfu',
  pet_toothless: 'toothless',
}

// 根据等级获取stage目录
function getStageDir(level) {
  if (!level || level < 10) return 'stage1'
  if (level < 20) return 'stage2'
  return 'stage3'
}

// pose数字→emotion名称的映射
const POSE_TO_EMOTION = [
  'reading',    // 0: 答题/学习
  'happy',      // 1: 开心
  'normal',     // 2: 正常
  'excited',    // 3: 兴奋
]

// 可爱的随机动作池（用于抽卡展示等场景）
const CUTE_POSES = ['happy', 'excited', 'wave', 'normal']

/**
 * 获取任意宠物的指定pose PNG路径
 */
function getPetSpriteSrc(poolId, level = 1, pose = 0) {
  const prefix = PET_PREFIX_MAP[poolId]
  if (!prefix) return null

  const stageDir = getStageDir(level)

  // pose >= 100 表示随机选一个可爱动作（用于抽卡展示）
  if (pose >= 100) {
    const cutePose = CUTE_POSES[Math.floor(Math.random() * CUTE_POSES.length)]
    return `/pets/${prefix}/${stageDir}/${cutePose}.png`
  }

  const emotionName = POSE_TO_EMOTION[pose] || 'normal'
  return `/pets/${prefix}/${stageDir}/${emotionName}.png`
}

/**
 * 根据poolId、等级和pose获取头像PNG路径
 */
function getAvatarSrc(poolId, level = 1, pose = 0) {
  return getPetSpriteSrc(poolId, level, pose)
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
  const src = getAvatarSrc(poolId, level, pose)

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
