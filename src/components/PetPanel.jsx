import React, { useState, useEffect } from 'react';
import { getCurrentPet, getPetPool, feedPet, tapPet, resetPetMood } from '../utils/gamification';
import PetSpriteAvatar from './PetSpriteAvatar';

// Simple PetPanel to display and interact with the current pet
// Props: state (gamification state), onFeed (optional custom feed handler)
export default function PetPanel({ state, onFeed, onPetTap, onSwitchPet }) {
  const pet = state?.currentPet || { poolId: 'pet_toothless', level: 1, exp: 0, mood: 'neutral', tapCount: 0 };
  const pool = state?.petPool || [];
  const poolMap = pool.reduce((m, p) => { m[p.poolId] = p; return m; }, {});
  const poolInfo = poolMap[pet.poolId] || { name: '宠物', emoji: '🐾', rarity: 'N' };
  const [heartVisible, setHeartVisible] = useState(false);
  const stageLabel = (() => {
    const lvl = pet.level || 1;
    if (lvl < 2) return '蛋';
    if (lvl < 10) return '幼年';
    if (lvl < 20) return '成长期';
    if (lvl < 30) return '成熟体';
    return '完全体';
  })();

  // Show heart for a short time whenever user taps the pet
  const handleTap = () => {
    // Trigger the interaction in state (mood + tapCount) if a handler is provided by parent
    // Here we attempt to mutate via a callback onTap if provided in a connected MV1 flow
  };

  // Local click on pet image to simulate interaction (tap)
  const onPetClick = () => {
    // Trigger visual heart
    setHeartVisible(true);
    setTimeout(() => setHeartVisible(false), 1200);
    // Notify parent interaction if provided
    if (typeof onPetTap === 'function') onPetTap();
  };

  // Feed action shim
  const onFeedClick = () => {
    // If parent provides onFeed, call it; otherwise, do nothing in demo
    if (typeof onFeed === 'function') onFeed();
  };

  // Mood indicator text/icon based on pet.mood
  const moodIcon = pet.mood === 'happy' ? '❤️' : pet.mood === 'angry' ? '😤' : '🙂';

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 12, width: 260 }}>
      <div style={{ textAlign: 'center', position: 'relative', height: 120 }}>
        <div
          onClick={onPetClick}
          style={{ cursor: 'pointer', display: 'inline-block' }}
          aria-label={poolInfo.name}
        >
          <PetSpriteAvatar poolId={pet.poolId} level={pet.level || 1} size={64} pose={1} />
        </div>
        {heartVisible && (
          <span style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', fontSize: 32 }}>
            ❤️
          </span>
        )}
        {pet.mood === 'angry' && (
          <span style={{ position: 'absolute', bottom: 8, right: 8, fontSize: 20 }}>😠</span>
        )}
      </div>
      <div style={{ textAlign: 'center', marginTop: 6 }}>
        <div style={{ fontWeight: 700 }}>{poolInfo.name}</div>
        <div>等级 {pet.level ?? 1} • 阶段 {stageLabel}</div>
        <div>宠物 exp {pet.exp ?? 0}/100</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 10 }}>
        <button onClick={onFeedClick} style={{ padding: '6px 12px' }}>喂养 +10 XP</button>
        <button onClick={onPetClick} style={{ padding: '6px 12px' }}>喂喂？</button>
      </div>
      <div style={{ textAlign: 'center', marginTop: 6, fontSize: 12, color: '#555' }}>
        状态：{moodIcon}
      </div>
      <div style={{ textAlign: 'center', marginTop: 6, fontSize: 12, color: '#666' }}>
        拥有宠物: { ((state?.ownedPets) || []).length }
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 8 }}>
        {(state?.petPool || []).map((p) => {
          const owned = (state.ownedPets || []).includes(p.poolId)
          const active = p.poolId === state.currentPet?.poolId
          return (
            <button key={p.poolId} onClick={() => onSwitchPet?.(p.poolId)} disabled={!owned} style={{ opacity: owned ? 1 : 0.4, borderRadius: 6, padding: 6, border: 'none', background: 'none', cursor: owned ? 'pointer' : 'default' }}>
              {owned ? <PetSpriteAvatar poolId={p.poolId} level={pet.level || 1} size={24} pose={1} /> : <span style={{ fontSize: 18 }}>❓</span>}
            </button>
          )
        })}
      </div>
    </div>
  );
}
