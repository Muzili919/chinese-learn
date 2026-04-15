/**
 * GachaAnimation.jsx — 抽卡动画组件
 * 
 * 流程：神秘卡牌 → 震动蓄力 → 3D翻转 → 粒子爆发 → 揭晓宠物
 * 
 * 稀有度特效：
 *   N级：淡蓝光 + 小粒子
 *   SR级：金色光芒 + 金粒子爆发 + 轻震屏
 *   SSR级：彩虹光 + 大量粒子 + 强震屏 + 星光闪烁
 * 
 * 用法：
 *   <GachaAnimation
 *     pet={petResult}       // { poolId, name, emoji, rarity }
 *     visible={true}        // 控制显示
 *     onComplete={() => {}} // 动画结束回调
 *   />
 */
import { useState, useEffect, useCallback } from 'react'

// ─── 稀有度配色方案 ──────────────────────────────────────
const RARITY_CONFIG = {
  N: {
    name: '普通',
    color: '#60A5FA',      // 淡蓝
    bgGradient: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
    particleColor: '#93C5FD',
    particleCount: 20,
    glowColor: 'rgba(96,165,250,0.6)',
    shakeIntensity: 0,
    labelBg: 'from-blue-500/80 to-blue-700/80',
  },
  SR: {
    name: '稀有',
    color: '#FBBF24',      // 金色
    bgGradient: 'linear-gradient(135deg, #78350f 0%, #451a03 100%)',
    particleColor: '#FCD34D',
    particleCount: 40,
    glowColor: 'rgba(251,191,36,0.7)',
    shakeIntensity: 4,
    labelBg: 'from-yellow-500/90 to-amber-600/90',
  },
  SSR: {
    name: '超稀有',
    color: '#F472B6',      // 彩虹粉（主色）
    bgGradient: 'linear-gradient(135deg, #701a75 0%, #1e0b3d 100%)',
    particleColor: '#F9A8D4',
    particleCount: 80,
    glowColor: 'rgba(244,114,182,0.8)',
    shakeIntensity: 8,
    labelBg: 'from-pink-500/90 to-purple-600/90',
    rainbow: true,
  },
}

// ─── 粒子组件 ──────────────────────────────────────────
function Particles({ count, color, active }) {
  if (!active) return null
  
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.8,
    size: 4 + Math.random() * 8,
    duration: 0.8 + Math.random() * 1.2,
    angle: -180 - Math.random() * 180, // 向上爆发
  }))
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.left}%`,
            top: '50%',
            width: p.size,
            height: p.size,
            backgroundColor: color,
            boxShadow: `0 0 ${p.size * 2}px ${color}`,
            opacity: 0,
            transform: 'translateY(0)',
            animation: `gachaParticle ${p.duration}s ${p.delay}s ease-out forwards`,
            '--particle-angle': `${p.angle}deg`,
          }}
        />
      ))}
    </div>
  )
}

// ─── 星星闪烁（SSR专用）────────────────────────────────
function StarBurst({ active }) {
  if (!active) return null
  
  return (
    <div className="absolute inset-0 pointer-events-none">
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * 360
        const dist = 120 + Math.random() * 60
        return (
          <div
            key={i}
            className="absolute text-xl"
            style={{
              left: '50%',
              top: '50%',
              opacity: 0,
              transform: 'translate(-50%, -50%)',
              animation: `starAppear 1.5s ${i * 0.08}s ease-out forwards`,
              '--star-x': `${Math.cos(angle * Math.PI / 180) * dist}px`,
              '--star-y': `${Math.sin(angle * Math.PI / 180) * dist}px`,
            }}
          >
            ✦
          </div>
        )
      })}
    </div>
  )
}

// ─── 主组件 ────────────────────────────────────────────
export default function GachaAnimation({ pet, visible = false, onComplete }) {
  const [phase, setPhase] = useState('idle') // idle | charge | flip | reveal | done
  const [showCard, setShowCard] = useState(false)
  const [showPet, setShowPet] = useState(false)
  const [showParticles, setShowParticles] = useState(false)
  const [shake, setShake] = useState(false)
  const [cardStyle, setCardStyle] = useState({})
  
  const config = pet?.rarity ? RARITY_CONFIG[pet.rarity] || RARITY_CONFIG.N : RARITY_CONFIG.N

  // 启动动画序列
  const startAnimation = useCallback(() => {
    if (!pet) { onComplete?.(); return }
    
    setPhase('charge')
    setShowCard(true)
    
    // Phase 1: 蓄力震动 (0-1500ms)
    setTimeout(() => setShake(true), 200)
    
    // Phase 2: 开始翻转 (1200ms)
    setTimeout(() => {
      setPhase('flip')
      setShake(false)
      setCardStyle({ transform: 'rotateY(180deg)' })
    }, 1200)
    
    // Phase 3: 翻转中途开始粒子 (1600ms)
    setTimeout(() => setShowParticles(true), 1600)
    
    // Phase 4: 揭晓宠物 (2000ms)
    setTimeout(() => {
      setPhase('reveal')
      setShowPet(true)
    }, 2000)
    
    // Phase 5: 完成 (3500ms)
    setTimeout(() => {
      setPhase('done')
      onComplete?.()
    }, 3500)
  }, [pet, onComplete])

  // 当visible变为true时启动
  useEffect(() => {
    if (visible && phase === 'idle' && pet) {
      const t = setTimeout(startAnimation, 300)
      return () => clearTimeout(t)
    }
  }, [visible, pet, phase, startAnimation])

  // 重置状态
  useEffect(() => {
    if (!visible) {
      setPhase('idle')
      setShowCard(false)
      setShowPet(false)
      setShowParticles(false)
      setShake(false)
      setCardStyle({})
    }
  }, [visible])

  if (!visible || !pet) return null

  const isRainbow = config.rainbow

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center ${shake ? '' : ''}`}
         style={{ background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.95) 100%)' }}>
      
      {/* 全局CSS */}
      <style>{`
        @keyframes gachaParticle {
          0%   { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(var(--particle-angle, -200px)) scale(0); }
        }
        @keyframes starAppear {
          0%   { opacity: 0; transform: translate(-50%,-50%) translate(0,0) scale(0) rotate(0deg); }
          50%  { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%,-50%) translate(var(--star-x,0),var(--star-y,0)) scale(1) rotate(180deg); }
        }
        @keyframes gachaFloat {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-12px); }
        }
        @keyframes gachaChargeShake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          10%      { transform: translateX(-${config.shakeIntensity}px) rotate(-1deg); }
          30%      { transform: translateX(${config.shakeIntensity}px) rotate(1deg); }
          50%      { transform: translateX(-${config.shakeIntensity}px) rotate(-0.5deg); }
          70%      { transform: translateX(${config.shakeIntensity}px) rotate(0.5deg); }
          90%      { transform: translateX(-${config.shakeIntensity / 2}px) rotate(0deg); }
        }
        @keyframes gachaGlowPulse {
          0%, 100% { box-shadow: 0 0 30px ${config.glowColor}, 0 0 60px ${config.glowColor}; }
          50%      { box-shadow: 0 0 50px ${config.glowColor}, 0 0 100px ${config.glowColor}; }
        }
        @keyframes gachaRevealPop {
          0%   { transform: scale(0) rotateY(180deg); opacity: 0; }
          60%  { transform: scale(1.15) rotateY(0deg); opacity: 1; }
          80%  { transform: scale(0.95) rotateY(0deg); }
          100% { transform: scale(1) rotateY(0deg); opacity: 1; }
        }
        @keyframes gachaLabelSlide {
          0%   { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        @keyframes rainbowShift {
          0%   { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }
        .gacha-card-container {
          perspective: 1200px;
          animation: ${phase === 'charge' ? `gachaChargeShake 0.15s infinite` : 'none'};
        }
        .gacha-card-inner {
          transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
          transform-style: preserve-3d;
        }
        .gacha-card-face {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .gacha-card-back {
          position: absolute;
          inset: 0;
          transform: rotateY(180deg);
        }
      `}</style>

      {/* 屏幕震动效果 */}
      <div className={`fixed inset-0 pointer-events-none transition-transform`}
           style={{ transform: shake ? `translateX(${(Math.random()-0.5)*config.shakeIntensity*2}px)` : 'none' }} />

      {/* 粒子层 */}
      <Particles count={config.particleCount} color={config.particleColor} active={showParticles} />
      
      {/* SSR星星 */}
      <StarBurst active={showParticles && isRainbow} />

      {/* ===== 卡牌区域 ===== */}
      <div className="relative flex flex-col items-center" style={{ animation: phase === 'done' || showPet ? 'gachaFloat 2s ease-in-out infinite' : 'none' }}>

        {/* 卡牌容器 */}
        <div className="gacha-card-container" style={{ width: 240, height: 300 }}>
          <div className="gacha-card-inner relative w-full h-full" style={cardStyle}>
            
            {/* 正面：神秘卡 */}
            <div className={`gacha-card-face absolute inset-0 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-opacity duration-300 ${!showPet ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                 style={{ background: config.bgGradient, border: `2px solid ${config.color}40` }}>
              
              {/* 卡背图案 */}
              <div className="text-7xl mb-3 animate-pulse">❓</div>
              <div className="text-white/40 text-sm tracking-widest">MYSTERY</div>
              <div className="absolute inset-0 rounded-2xl"
                   style={{ background: `repeating-linear-gradient(45deg, transparent, transparent 10px, ${config.color}08 10px, ${config.color}08 20px)` }} />
              <div className="absolute inset-0 rounded-2xl"
                   style={{ boxShadow: `inset 0 0 30px ${config.glowColor}` }} />
            </div>

            {/* 背面：宠物揭晓 */}
            <div className="gacha-card-back gacha-card-face rounded-2xl overflow-hidden"
                 style={{ background: config.bgGradient, border: `3px solid ${config.color}` }}>
              
              {/* 宠物图片区域 */}
              <div className={`w-full h-[220px] flex items-center justify-center relative ${showPet ? 'animate-[gachaRevealPop_0.6s_ease-out_forwards]' : 'opacity-0'}`}
                   style={showPet ? {} : { transform: 'scale(0) rotateY(180deg)' }}>
                
                {/* 光晕背景 */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full opacity-30"
                       style={{ 
                         background: `radial-gradient(circle, ${config.color} 0%, transparent 70%)`,
                         animation: showPet ? 'gachaGlowPulse 1.5s ease-in-out infinite' : 'none',
                         ...(isRainbow && showPet ? { animation: 'rainbowShift 3s linear infinite, gachaGlowPulse 1.5s ease-in-out infinite' } : {})
                       }} />
                </div>
                
                {/* 宠物emoji/图标 - 这里用emoji，实际可替换为图片 */}
                <span className="text-8xl z-10 drop-shadow-lg"
                      style={{ filter: isRainbow ? 'drop-shadow(0 0 20px rgba(255,255,255,0.5))' : undefined }}>
                  {pet.emoji || '🐱'}
                </span>
                
                {/* SSR彩虹边框 */}
                {isRainbow && showPet && (
                  <div className="absolute inset-2 rounded-xl border-2"
                       style={{ 
                         borderColor: 'transparent',
                         backgroundImage: 'linear-gradient(#fff, #fff), linear-gradient(45deg, #ff0000, #ff8800, #ffff00, #00ff00, #0088ff, #8800ff, #ff0088)',
                         backgroundOrigin: 'border-box',
                         backgroundClip: 'padding-box, border-box',
                         animation: 'rainbowShift 2s linear infinite',
                         WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
                         WebkitMaskComposite: 'xor',
                         maskComposite: 'exclude',
                       }} />
                )}
              </div>
              
              {/* 底部信息栏 */}
              <div className={`h-[80px] flex flex-col items-center justify-center px-3 bg-black/30 backdrop-blur-sm transition-all duration-500 ${showPet ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <div className={`text-sm font-bold text-white px-3 py-0.5 rounded-full mb-1 bg-gradient-to-r ${config.labelBg}`}>
                  ★{pet.rarity === 'SSR' ? '★★★' : pet.rarity === 'SR' ? '★★' : '★'} {config.name}
                </div>
                <div className="text-white font-bold text-base drop-shadow">{pet.name}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 底部提示文字 */}
        <div className={`mt-6 text-center transition-all duration-700 ${phase === 'reveal' || phase === 'done' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="text-2xl font-bold mb-1" style={{ color: config.color }}>
            {phase === 'done' ? '🎉 恭喜获得！' : ''}
          </div>
          <div className="text-white/60 text-sm">
            {phase === 'charge' ? '✨ 命运正在转动...' :
             phase === 'flip' ? '🔄 揭晓中...' :
             phase === 'reveal' ? '✨ 太棒了！' : ''}
          </div>
        </div>
      </div>

      {/* 点击跳过按钮 */}
      {(phase === 'charge' || phase === 'flip') && (
        <button onClick={() => {
          // 快速跳到最后阶段
          setPhase('reveal'); setShowPet(true); setShowParticles(true); setShake(false);
          setCardStyle({ transform: 'rotateY(180deg)' });
          setTimeout(() => { setPhase('done'); onComplete?.(); }, 800);
        }}
                className="absolute bottom-16 text-white/40 text-xs hover:text-white/70 transition-colors">
          点此跳过 →
        </button>
      )}
    </div>
  )
}
