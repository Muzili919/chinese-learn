/**
 * PetEgg.jsx — 宠物蛋组件（无宠物时的默认状态）
 * 
 * 显示一个可爱的蛋，带呼吸动画和"抽卡"按钮
 * 点击抽卡 → 触发 GachaAnimation → 获得第一只宠物
 */
import { useState } from 'react'

export default function PetEgg({ onDrawCard, hasTicket = true }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-6">
      
      {/* 🥚 蛋本体 */}
      <div 
        className={`relative cursor-pointer transition-transform duration-300 ${isHovered ? 'scale-110' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={hasTicket ? onDrawCard : undefined}
      >
        {/* 呼吸光晕 */}
        <div 
          className="absolute inset-0 rounded-full blur-xl transition-opacity"
          style={{
            background: 'radial-gradient(circle, rgba(251,191,36,0.3) 0%, transparent 70%)',
            opacity: isHovered ? 1 : 0.5,
            animation: 'eggBreath 3s ease-in-out infinite',
          }}
        />
        
        {/* 蛋emoji */}
        <span 
          className="relative text-[100px] leading-none drop-shadow-lg select-none block"
          style={{ 
            filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.2))',
            animation: 'eggFloat 3s ease-in-out infinite',
          }}
        >
          🥚
        </span>

        {/* 悬停时显示的问号 */}
        {isHovered && (
          <div className="absolute -top-2 -right-2 text-2xl animate-bounce">❓</div>
        )}
      </div>

      {/* 文字提示 */}
      <div className="text-center">
        <p className="text-white/70 text-sm mb-3">你的宠物还在蛋里...</p>
        
        {hasTicket ? (
          <button
            onClick={onDrawCard}
            className="group relative px-6 py-3 rounded-xl font-bold text-sm
                       bg-gradient-to-r from-yellow-500 to-orange-500
                       hover:from-yellow-400 hover:to-orange-400
                       text-white shadow-lg hover:shadow-yellow-500/30
                       transform active:scale-95 transition-all duration-200
                       overflow-hidden"
          >
            {/* 闪光效果 */}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                         translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
            
            <span className="relative flex items-center gap-2">
              🎴 使用抽卡券
            </span>
          </button>
        ) : (
          <p className="text-yellow-400/60 text-xs px-4 py-2 rounded-lg bg-yellow-400/10">
            需要一张抽卡券才能孵化 🎴
          </p>
        )}
      </div>

      {/* 动画样式 */}
      <style>{`
        @keyframes eggBreath {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50%      { transform: scale(1.15); opacity: 1; }
        }
        @keyframes eggFloat {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  )
}
