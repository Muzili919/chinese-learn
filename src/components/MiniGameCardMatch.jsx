import React, { useState, useCallback, useEffect } from 'react'

/**
 * MiniGameCardMatch - 翻牌配对小游戏
 * 经典记忆配对游戏，用emoji作为卡面
 */
const CARD_EMOJIS = ['🐉', '⚡', '🌟', '🔥', '💎', '🎵', '🌈', '🍀']
const GRID_SIZE = 4 // 4x4 = 16张牌 = 8对
const GAME_DURATION = 30 // 秒

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function MiniGameCardMatch({ onGameEnd }) {
  // 创建配对（每种2张）
  const allCards = shuffleArray([...CARD_EMOJIS, ...CARD_EMOJIS])
  
  const [cards, setCards] = useState(() => allCards.map((emoji, i) => ({
    id: i, emoji, flipped: false, matched: false,
  })))
  const [flippedIds, setFlippedIds] = useState([])
  const [moves, setMoves] = useState(0)
  const [matches, setMatches] = useState(0)
  const [gameState, setGameState] = useState('playing') // playing | won | timeout
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [showCombo, setShowCombo] = useState(null)

  // 计时器
  useEffect(() => {
    if (gameState !== 'playing') return
    if (timeLeft <= 0) {
      setGameState('timeout')
      onGameEnd?.({ won: false, moves, matches, totalPairs: CARD_EMOJIS.length })
      return
    }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(timer)
  }, [timeLeft, gameState]) // eslint-disable-line react-hooks/exhaustive-deps

  // 翻牌处理
  const handleFlip = useCallback((id) => {
    if (gameState !== 'playing') return
    if (flippedIds.length >= 2) return
    
    const card = cards.find(c => c.id === id)
    if (!card || card.flipped || card.matched) return

    const newFlipped = [...flippedIds, id]
    setFlippedIds(newFlipped)
    setCards(prev => prev.map(c =>
      c.id === id ? { ...c, flipped: true } : c
    ))

    if (newFlipped.length === 2) {
      setMoves(m => m + 1)
      const [first, second] = newFlipped.map(fid => cards.find(c => c.id === fid))
      
      if (first.emoji === second.emoji) {
        // 配对成功！
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            newFlipped.includes(c.id) ? { ...c, matched: true } : c
          ))
          setMatches(m => {
            const newM = m + 1
            // 显示连击提示
            if (newM > 1 && newM <= 5) setShowCombo(`${newM}连击! 🔥`)
            else if (newM > 5) setShowCombo(`超神!! ⭐`)
            setTimeout(() => setShowCombo(null), 1200)
            
            if (newM >= CARD_EMOJIS.length) {
              // 胜利！
              setGameState('won')
              onGameEnd?.({ won: true, moves: moves + 1, matches: newM, totalPairs: CARD_EMOJIS.length })
            }
            return newM
          })
          setFlippedIds([])
        }, 500)
      } else {
        // 不匹配，翻回去
        setTimeout(() => {
          setCards(prev => prev.map(c =>
            newFlipped.includes(c.id) ? { ...c, flipped: false } : c
          ))
          setFlippedIds([])
        }, 800)
      }
    }
  }, [cards, flippedIds, gameState, moves, onGameEnd])

  // 重置游戏
  const resetGame = () => {
    const shuffled = shuffleArray([...CARD_EMOJIS, ...CARD_EMOJIS])
    setCards(shuffled.map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false })))
    setFlippedIds([])
    setMoves(0)
    setMatches(0)
    setGameState('playing')
    setTimeLeft(GAME_DURATION)
    setShowCombo(null)
  }

  // 游戏结束界面
  if (gameState !== 'playing') {
    const isWin = gameState === 'won'
    const stars = isWin
      ? (moves <= 12 ? 3 : moves <= 18 ? 2 : 1)
      : 0
    
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '32px 16px',
        minHeight: 320,
      }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>
          {isWin ? '🏆' : '⏰'}
        </div>
        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#374151' }}>
          {isWin ? '恭喜过关！' : '时间到!'}
        </h3>
        <p style={{ margin: '6px 0 0', fontSize: 14, color: '#6b7280' }}>
          {isWin 
            ? `用了 ${moves} 步完成配对` 
            : `找到了 ${matches}/${CARD_EMOJIS.length} 对`
          }
        </p>
        
        {/* 星星评分 */}
        <div style={{ fontSize: 28, marginTop: 8, marginBottom: 20 }}>
          {'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}
        </div>

        {/* 奖励预览 */}
        <div style={{
          background: '#fef3c7', borderRadius: 12, padding: '12px 20px',
          marginBottom: 20,
        }}>
          <span style={{ fontSize: 12, color: '#92400e', fontWeight: 600 }}>
            🎁 奖励: +{(isWin ? 50 : matches * 10)}exp 
            {(isWin || matches > 3) ? ' + 零食×1' : ''}
          </span>
        </div>

        <button
          onClick={resetGame}
          style={{
            padding: '12px 32px',
            borderRadius: 14,
            border: 'none',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white', fontSize: 15, fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
          }}
        >
          🔄 再玩一次
        </button>
      </div>
    )
  }

  // 游戏进行中
  return (
    <div>
      {/* 游戏头部信息 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{
            background: white, borderRadius: 10, padding: '6px 12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)', textAlign: 'center',
          }}>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>步数</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#6366f1' }}>{moves}</div>
          </div>
          <div style={{
            background: 'white', borderRadius: 10, padding: '6px 12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)', textAlign: 'center',
          }}>
            <div style={{ fontSize: 10, color: '#9ca3af' }}>配对</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#10b981' }}>{matches}/{CARD_EMOJIS.length}</div>
          </div>
        </div>
        
        {/* 倒计时 */}
        <div style={{
          background: timeLeft <= 10 ? '#fef2f2' : '#f0fdf4',
          borderRadius: 10, padding: '6px 12px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)', textAlign: 'center',
        }}>
          <div style={{ fontSize: 10, color: timeLeft <= 10 ? '#dc2626' : '#16a34a' }}>时间</div>
          <div style={{
            fontSize: 16, fontWeight: 700,
            color: timeLeft <= 10 ? '#dc2626' : '#16a34a',
          }}>⏱️ {timeLeft}s</div>
        </div>
      </div>

      {/* 连击提示 */}
      {showCombo && (
        <div style={{
          textAlign: 'center', marginBottom: 8,
          animation: 'comboPop 0.4s ease-out',
        }}>
          <span style={{
            background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
            color: '#78350f', fontSize: 14, fontWeight: 800,
            padding: '4px 16px', borderRadius: 20,
            textShadow: '0 1px 2px rgba(0,0,0,0.1)',
          }}>{showCombo}</span>
        </div>
      )}

      {/* 卡片网格 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
        gap: 8,
        perspective: '600px',
      }}>
        {cards.map(card => (
          <div
            key={card.id}
            onClick={() => handleFlip(card.id)}
            style={{
              aspectRatio: '1',
              cursor: card.matched || card.flipped ? 'default' : 'pointer',
              position: 'relative',
              transformStyle: 'preserve-3d',
              transition: 'transform 0.4s ease',
              transform: card.flipped || card.matched ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* 背面 */}
            <div style={{
              position: 'absolute', inset: 0,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(99,102,241,0.25)',
              fontSize: 22,
            }}>❓</div>
            
            {/* 正面 */}
            <div style={{
              position: 'absolute', inset: 0,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              background: card.matched
                ? 'linear-gradient(135deg, #d1fae5, #a7f3d0)'
                : 'white',
              borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              opacity: card.matched ? 0.85 : 1,
              border: card.matched ? '2px solid #34d399' : '1px solid #e5e7eb',
            }}>
              {card.emoji}
            </div>
          </div>
        ))}
      </div>

      <p style={{ margin: '10px 0 0', fontSize: 11, color: '#9ca3af', textAlign: 'center' }}>
        💡 翻开两张相同的卡片即可配对，在时间内找出所有8对！
      </p>

      <style>{`@keyframes comboPop { 0%{transform:scale(0.5);opacity:0} 60%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }`}</style>
    </div>
  )
}
