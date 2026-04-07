import React, { useState, useEffect, useCallback, useRef } from 'react'

/**
 * MiniGameCatchFood - 接食物小游戏
 * 宠物在底部左右移动接住掉落的食物
 */
const GAME_WIDTH = 320
const GAME_HEIGHT = 400
const PET_SIZE = 50
const FOOD_SIZE = 30

const FOOD_TYPES = [
  { emoji: '🐟', points: 10, speed: 2.5 },
  { emoji: '🍖', points: 15, speed: 3 },
  { emoji: '⭐', points: 25, speed: 3.5 }, // 稀有！
  { emoji: '💩', points: -10, speed: 2 },   // 躲开这个！
]

export default function MiniGameCatchFood({ onGameEnd }) {
  const [gameState, setGameState] = useState('ready') // ready | playing | ended
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [level, setLevel] = useState(1)
  const [foods, setFoods] = useState([])
  const [petX, setPetX] = useState(GAME_WIDTH / 2 - PET_SIZE / 2)
  
  const gameAreaRef = useRef(null)
  const animationRef = useRef(null)
  const foodsRef = useRef([])
  const scoreRef = useRef(0)
  const livesRef = useRef(3)
  const levelRef = useRef(1)
  const petXRef = useRef(GAME_WIDTH / 2 - PET_SIZE / 2)
  const lastSpawnRef = useRef(0)
  const gameStartTime = useRef(0)

  // 鼠标/触摸控制宠物位置
  const handleMove = useCallback((clientX) => {
    if (!gameAreaRef.current || gameState !== 'playing') return
    const rect = gameAreaRef.current.getBoundingClientRect()
    let x = clientX - rect.left - PET_SIZE / 2
    x = Math.max(0, Math.min(GAME_WIDTH - PET_SIZE, x))
    setPetX(x)
    petXRef.current = x
  }, [gameState])

  useEffect(() => {
    const handleMouseMove = (e) => handleMove(e.clientX)
    const handleTouchMove = (e) => {
      e.preventDefault()
      handleMove(e.touches[0].clientX)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
    }
  }, [handleMove])

  // 游戏主循环
  const gameLoop = useCallback(() => {
    if (gameState !== 'playing') return

    const now = Date.now()
    
    // 生成新食物（根据等级调整频率）
    const spawnInterval = Math.max(800, 1600 - levelRef.current * 150)
    if (now - lastSpawnRef.current > spawnInterval) {
      lastSpawnRef.current = now
      const type = pickFoodType()
      const newFood = {
        id: now + Math.random(),
        x: Math.random() * (GAME_WIDTH - FOOD_SIZE),
        y: -FOOD_SIZE,
        ...type,
      }
      foodsRef.current = [...foodsRef.current, newFood]
      setFoods([...foodsRef.current])
    }

    // 移动食物 & 碰撞检测
    let newFoods = []
    for (const food of foodsRef.current) {
      const newY = food.y + food.speed * (1 + levelRef.current * 0.15)
      
      // 检测碰撞（与宠物）
      const petCenterX = petXRef.current + PET_SIZE / 2
      const petY = GAME_HEIGHT - PET_SIZE - 15
      const foodCenterX = food.x + FOOD_SIZE / 2
      
      if (
        newY + FOOD_SIZE >= petY &&
        newY <= petY + PET_SIZE &&
        Math.abs(foodCenterX - petCenterX) < (PET_SIZE + FOOD_SIZE) / 2 - 5
      ) {
        // 接到了！
        if (food.points > 0) {
          scoreRef.current += food.points
          setScore(scoreRef.current)
          // 升级检测
          if (scoreRef.current > levelRef.current * 100) {
            levelRef.current += 1
            setLevel(levelRef.current)
          }
        } else {
          livesRef.current -= 1
          setLives(livesRef.current)
          if (livesRef.current <= 0) {
            endGame()
            return
          }
        }
        continue // 不保留这个食物
      }

      // 出界（掉到底部）- 好东西扣命
      if (newY > GAME_HEIGHT) {
        if (food.points > 0) {
          livesRef.current -= 1
          setLives(livesRef.current)
          if (livesRef.current <= 0) {
            endGame()
            return
          }
        }
        continue
      }

      newFoods.push({ ...food, y: newY })
    }

    foodsRef.current = newFoods
    setFoods(newFoods)
    animationRef.current = requestAnimationFrame(gameLoop)
  }, [gameState])

  const endGame = () => {
    cancelAnimationFrame(animationRef.current)
    setGameState('ended')
    onGameEnd?.({
      won: livesRef.current > 0,
      score: scoreRef.current,
      level: levelRef.current,
    })
  }

  const startGame = () => {
    setScore(0); setLives(3); setLevel(1)
    setFoods([]); setPetX(GAME_WIDTH / 2 - PET_SIZE / 2)
    scoreRef.current = 0; livesRef.current = 3; levelRef.current = 1
    petXRef.current = GAME_WIDTH / 2 - PET_SIZE / 2
    lastSpawnRef.current = Date.now()
    foodsRef.current = []
    setGameState('playing')
  }

  // 启动/停止游戏循环
  useEffect(() => {
    if (gameState === 'playing') {
      gameStartTime.current = Date.now()
      animationRef.current = requestAnimationFrame(gameLoop)
    }
    return () => cancelAnimationFrame(animationRef.current)
  }, [gameState, gameLoop]) // eslint-disable-line react-hooks/exhaustive-deps

  // 随机选择食物类型（带权重）
  function pickFoodType() {
    const r = Math.random()
    if (r < 0.45) return FOOD_TYPES[0] // 鱼 45%
    if (r < 0.75) return FOOD_TYPES[1] // 肉 30%
    if (r < 0.85) return FOOD_TYPES[2] // 星星 10%
    return FOOD_TYPES[3]               // 💩 15%
  }

  // ====== 界面渲染 ======

  // 准备界面
  if (gameState === 'ready') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '32px 16px', minHeight: 360,
      }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🍖</div>
        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#374151' }}>
          接食物挑战
        </h3>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: '#6b7280', textAlign: 'center' }}>
          左右滑动或移动鼠标控制无牙仔<br/>接到好吃的加分，躲开💩!
        </p>

        {/* 食物说明 */}
        <div style={{
          display: 'flex', gap: 12, marginTop: 16, marginBottom: 24,
        }}>
          {FOOD_TYPES.map(ft => (
            <div key={ft.emoji} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28 }}>{ft.emoji}</div>
              <div style={{ fontSize: 10, color: ft.points > 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
                {ft.points > 0 ? `+${ft.points}` : ft.points}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={startGame}
          style={{
            padding: '14px 36px',
            borderRadius: 14,
            border: 'none',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white', fontSize: 16, fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
          }}
        >
          🎮 开始游戏
        </button>
      </div>
    )
  }

  // 结束界面
  if (gameState === 'ended') {
    const stars = score >= 200 ? 3 : score >= 100 ? 2 : score >= 50 ? 1 : 0
    
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '32px 16px', minHeight: 360,
      }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>
          {lives > 0 ? '🎉' : '😢'}
        </div>
        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#374151' }}>
          {lives > 0 ? '挑战完成!' : '游戏结束'}
        </h3>
        <p style={{ margin: '6px 0 0', fontSize: 14, color: '#6b7280' }}>
          得分：{score} · 达到 Lv.{level}
        </p>
        
        <div style={{ fontSize: 28, marginTop: 8, marginBottom: 20 }}>
          {'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}
        </div>

        <div style={{
          background: '#fef3c7', borderRadius: 12, padding: '12px 20px', marginBottom: 20,
        }}>
          <span style={{ fontSize: 12, color: '#92400e', fontWeight: 600 }}>
            🎁 奖励: +{Math.round(score / 5)}exp +{score > 100 ? ' 零食×1' : ''}
          </span>
        </div>

        <button
          onClick={startGame}
          style={{
            padding: '12px 32px', borderRadius: 14, border: 'none',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
          }}
        >
          🔄 再玩一次
        </button>
      </div>
    )
  }

  // ====== 游戏进行中 ======
  return (
    <div ref={gameAreaRef}>
      {/* HUD */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', marginBottom: 8,
        padding: '0 4px',
      }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <span style={{ background: '#fef3c7', color: '#92400e', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 8 }}>
            🍖 {score}
          </span>
          <span style={{ background: '#ede9fe', color: '#6d28d9', fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 8 }}>
            Lv.{level}
          </span>
        </div>
        <div>
          {[...Array(3)].map((_, i) => (
            <span key={i} style={{ fontSize: 14, opacity: i < lives ? 1 : 0.25 }}>❤️</span>
          ))}
        </div>
      </div>

      {/* 游戏区域 */}
      <div style={{
        width: GAME_WIDTH, height: GAME_HEIGHT,
        position: 'relative', overflow: 'hidden',
        background: 'linear-gradient(180deg, #87CEEB 0%, #E0F4FF 60%, #90EE90 100%)',
        borderRadius: 16,
        border: '2px solid rgba(99,102,241,0.15)',
        touchAction: 'none',
      }}>
        {/* 云朵装饰 */}
        <div style={{ position: 'absolute', top: 30, left: 20, fontSize: 28, opacity: 0.5 }}>☁️</div>
        <div style={{ position: 'absolute', top: 50, right: 40, fontSize: 22, opacity: 0.4 }}>☁️</div>

        {/* 地面 */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 18,
          background: 'linear-gradient(180deg, #65a30d, #4d7c0f)',
          borderTop: '2px solid #84cc16',
        }} />

        {/* 食物 */}
        {foods.map(food => (
          <div key={food.id} style={{
            position: 'absolute', left: food.x, top: food.y,
            width: FOOD_SIZE, height: FOOD_SIZE,
            fontSize: FOOD_SIZE - 2, lineHeight: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            filter: food.points < 0 ? 'grayscale(0.3)' : 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
            transform: food.points < 0 ? 'rotate(15deg)' : undefined,
            transition: 'top 0.03s linear',
          }}>
            {food.emoji}
          </div>
        ))}

        {/* 宠物（底部控制角色） */}
        <div style={{
          position: 'absolute', bottom: 15,
          left: petX, width: PET_SIZE, height: PET_SIZE,
          transition: 'left 0.05s linear',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}>
          <div style={{ fontSize: PET_SIZE - 4, lineHeight: 1, filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.25))' }}>
            🐉
          </div>
        </div>
      </div>

      <p style={{ margin: '8px 0 0', fontSize: 11, color: '#9ca3af', textAlign: 'center' }}>
        👆 在区域内左右滑动控制无牙仔移动
      </p>
    </div>
  )
}
