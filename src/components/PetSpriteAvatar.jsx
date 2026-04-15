/**
 * PetSpriteAvatar - CSS sprite sheet avatar component
 * Uses real AI-generated 3×3 sprite sheets for pet_kitten and pet_toothless.
 * For all other pets, falls back to emoji display.
 *
 * Sprite layout (3×3 grid, row-major):
 *   Row 0: poses 0-2
 *   Row 1: poses 3-5
 *   Row 2: poses 6-8
 *
 * background-size: 300% 300%
 * background-position: ${col*50}% ${row*50}%
 */

import React from 'react'

// Which sheet to use based on pet level
function getKittenSheet(level) {
  if (!level || level < 10) return '/pets/kitten/sheet_s1.png'
  if (level < 20) return '/pets/kitten/sheet_s2.png'
  return '/pets/kitten/sheet_s3.png'
}

function getToothlessSheet(level) {
  // sheet_all.png has rows = stages (row0=1-9, row1=10-19, row2=20+)
  return '/pets/toothless/sheet_all.png'
}

function getToothlessRow(level) {
  if (!level || level < 10) return 0
  if (level < 20) return 1
  return 2
}

// Maps a pose index (0-8) to CSS background-position in a 3×3 grid
function spritePos(row, col) {
  return `${col * 50}% ${row * 50}%`
}

/**
 * SpriteCell - renders one cell from a 3×3 sprite sheet
 */
export function SpriteCell({ src, row = 0, col = 0, size = 50, borderRadius = '50%', style = {} }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius,
        backgroundImage: `url(${src})`,
        backgroundSize: '300% 300%',
        backgroundPosition: spritePos(row, col),
        backgroundRepeat: 'no-repeat',
        imageRendering: 'auto',
        flexShrink: 0,
        ...style,
      }}
    />
  )
}

/**
 * PetSpriteAvatar - smart avatar component that picks correct sprite sheet + cell
 *
 * Props:
 *   poolId: string (e.g. 'pet_kitten', 'pet_toothless')
 *   level: number
 *   size: number (px)
 *   pose: number 0-8 (which cell to show, default 0)
 *   emoji: string (fallback emoji if no sprite sheet)
 *   style: object (extra styles for the container)
 */
export default function PetSpriteAvatar({ poolId, level = 1, size = 50, pose = 0, emoji = '🥚', style = {} }) {
  const row = Math.floor(pose / 3)
  const col = pose % 3

  if (poolId === 'pet_kitten') {
    const src = getKittenSheet(level)
    return <SpriteCell src={src} row={row} col={col} size={size} style={style} />
  }

  if (poolId === 'pet_toothless') {
    const src = getToothlessSheet(level)
    const stageRow = getToothlessRow(level)
    // For toothless, use stageRow as the row, col = pose within that stage (0-2)
    const stageCol = col < 3 ? col : 0
    return <SpriteCell src={src} row={stageRow} col={stageCol} size={size} style={style} />
  }

  // Fallback: emoji in a circle
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
