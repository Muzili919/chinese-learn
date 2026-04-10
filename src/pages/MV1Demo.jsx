import React, { useMemo, useState, useEffect, useCallback } from 'react';
import Pet from '../components/Pet';
import {
  initGamificationState,
  gainExpForLearning,
  drawCard,
  getPetStage,
  tickPetStats,
  claimTaskReward,
  updateTaskByType,
  buyItem,
  useItemOnPet,
  buyAccessory,
  equipAccessory,
  unequipAccessory,
  SHOP_ITEMS,
  ACCESSORY_SHOP,
  DAILY_TASK_TEMPLATES,
  initDailyTasks,
} from '../utils/gamification';
import { storage, calcLevel, calcLevelProgress } from '../utils/storage';
import { fetchMV1State, upsertMV1State } from '../utils/mv1_cloud';
import ShopPanel from '../components/ShopPanel';
import DailyTasksPanel from '../components/DailyTasksPanel';

// 从今日答题记录同步每日任务进度
function syncTasksFromRecords(tasks, todayRecords) {
  if (!tasks || !todayRecords) return tasks;
  const learnCount = todayRecords.length;
  let maxStreak = 0, curStreak = 0;
  todayRecords.forEach(r => {
    if (r.correct) { curStreak++; maxStreak = Math.max(maxStreak, curStreak); }
    else curStreak = 0;
  });
  return tasks.map(t => {
    if (t.claimed) return t;
    if (t.id === 'daily_learn') {
      const progress = Math.min(learnCount, t.target);
      return { ...t, progress, completed: progress >= t.target };
    }
    if (t.id === 'daily_streak') {
      const progress = Math.min(maxStreak, t.target);
      return { ...t, progress, completed: progress >= t.target };
    }
    return t;
  });
}

export default function MV1Demo({ onBack, initialState, onStateChange }) {
  const [state, setState] = useState(() => initialState || initGamificationState());
  const [activeTab, setActiveTab] = useState('interact');
  const [levelUpAnim, setLevelUpAnim] = useState(false);

  // 初始化：云端加载 + 同步 storage XP + 同步今日任务
  useEffect(() => {
    const user = storage.getUser();
    if (!user?.id) return;

    fetchMV1State(user.id).then((cloud) => {
      const base = initGamificationState();
      const today = new Date().toDateString();
      const todayStr = new Date().toISOString().slice(0, 10);

      // 每日任务重置
      let dailyTasks = cloud?.dailyTasks || base.dailyTasks;
      if ((cloud?.dailyLastResetDate || '') !== today) {
        dailyTasks = initDailyTasks();
      }

      // 以 storage XP 为权威（答题时 storage.addXP 已实时更新）
      const storageXP = storage.getXP(user.id);

      // 同步今日答题到任务进度
      const records = storage.getRecords(user.id);
      const todayRecords = records.filter(r => r.timestamp?.startsWith(todayStr));
      dailyTasks = syncTasksFromRecords(dailyTasks, todayRecords);

      const merged = {
        ...base,
        ...(cloud || {}),
        exp: storageXP,
        petExpConsumed: cloud?.petExpConsumed || 0,
        currentPet: {
          ...base.currentPet,
          ...(cloud?.currentPet || {}),
          stats: cloud?.currentPet?.stats || base.currentPet.stats,
          equippedAccessories: cloud?.currentPet?.equippedAccessories || {},
        },
        inventory: { ...base.inventory, ...(cloud?.inventory || {}) },
        dailyTasks,
        dailyLastResetDate: today,
        taskCounters: cloud?.taskCounters || base.taskCounters,
      };
      setState(merged);
    });
  }, []);

  // 持久化
  useEffect(() => {
    const user = storage.getUser();
    if (user?.id) upsertMV1State(user.id, state);
    if (onStateChange) onStateChange(state);
  }, [state, onStateChange]);

  // 时间衰减
  useEffect(() => {
    const iv = setInterval(() => setState(s => tickPetStats(s, 5)), 30000);
    return () => clearInterval(iv);
  }, []);

  // 宠物升级（从累计经验池消耗）
  const handlePetLevelUp = useCallback(() => {
    setState(s => {
      const pet = s.currentPet;
      const petLevel = pet?.level || 1;
      const threshold = petLevel * 100;
      const totalXP = storage.getXP(storage.getUser()?.id || '') || s.exp || 0;
      const consumed = s.petExpConsumed || 0;
      const petExp = Math.max(0, totalXP - consumed);
      if (petExp < threshold) return s;

      setLevelUpAnim(true);
      setTimeout(() => setLevelUpAnim(false), 2000);

      const newPetLevel = petLevel + 1;
      return {
        ...s,
        exp: totalXP, // 同步最新 XP（不消耗玩家 XP）
        petExpConsumed: consumed + threshold, // 标记已消耗的经验量
        currentPet: {
          ...pet,
          level: newPetLevel,
          stage: getPetStage(newPetLevel),
          lastAction: 'levelUp',
        },
      };
    });
  }, []);

  // 商店购买（spendable = 当前等级内经验，不能超）
  const handleShopAction = useCallback((actionId) => {
    setState(s => {
      const lp = calcLevelProgress(s.exp || 0);
      const spendable = lp.currentExp;
      const user = storage.getUser();

      if (actionId.startsWith('buy_acc_')) {
        const accId = actionId.replace('buy_acc_', '');
        const acc = ACCESSORY_SHOP.find(a => a.id === accId);
        if (!acc || acc.price > spendable) return s;
        const newS = buyAccessory(s, accId);
        if (newS !== s && user?.id) storage.addXP(user.id, -acc.price);
        return { ...newS, exp: Math.max(0, s.exp - acc.price) };
      }
      if (actionId.startsWith('equip_')) return equipAccessory(s, actionId.replace('equip_', ''));
      if (actionId.startsWith('unequip_')) return unequipAccessory(s, actionId.replace('unequip_', ''));

      const item = SHOP_ITEMS.find(i => i.id === actionId);
      if (!item || item.price > spendable) return s;
      const newS = buyItem(s, actionId);
      if (newS !== s && user?.id) storage.addXP(user.id, -item.price);
      return { ...newS, exp: Math.max(0, s.exp - item.price) };
    });
  }, []);

  const handleUseItem = useCallback((itemId) => {
    setState(s => useItemOnPet(s, itemId));
  }, []);

  // 互动（喂食/洗澡/休息/抚摸），同步任务进度
  const handleInteract = useCallback((actionType) => {
    setState(s => {
      const inv = s.inventory || {};
      let ns = s;
      switch (actionType) {
        case 'feed': {
          if ((inv.foods?.advanced || 0) > 0) {
            ns = useItemOnPet({ ...s, inventory: { ...inv, foods: { ...inv.foods, advanced: inv.foods.advanced - 1 } } }, 'food_advanced');
          } else if ((inv.foods?.basic || 0) > 0) {
            ns = useItemOnPet({ ...s, inventory: { ...inv, foods: { ...inv.foods, basic: inv.foods.basic - 1 } } }, 'food_basic');
          } else return s;
          return updateTaskByType(ns, 'care', 1);
        }
        case 'clean': {
          if ((inv.cleanItems || 0) <= 0) return s;
          return useItemOnPet({ ...s, inventory: { ...inv, cleanItems: inv.cleanItems - 1 } }, 'clean_basic');
        }
        case 'rest': {
          if ((inv.energyItems || 0) <= 0) return s;
          return useItemOnPet({ ...s, inventory: { ...inv, energyItems: inv.energyItems - 1 } }, 'energy_drink');
        }
        case 'pet': {
          const pet = { ...s.currentPet };
          const stats = { ...(pet.stats || { hunger: 70, cleanliness: 70, energy: 80, intimacy: 30 }) };
          stats.intimacy = Math.min(stats.intimacy + 5, 100);
          pet.stats = stats;
          pet.lastAction = 'tapped';
          pet.tapCount = (pet.tapCount || 0) + 1;
          ns = { ...s, currentPet: pet };
          return updateTaskByType(ns, 'interact', 1);
        }
        default: return s;
      }
    });
  }, []);

  // 领取任务奖励（奖励 XP 同步到 storage）
  const handleClaimTask = useCallback((taskId) => {
    setState(s => {
      const task = s.dailyTasks?.find(t => t.id === taskId);
      if (!task || !task.completed || task.claimed) return s;
      const user = storage.getUser();
      if (user?.id && task.reward?.exp) storage.addXP(user.id, task.reward.exp);
      const newS = claimTaskReward(s, taskId);
      // 同步 exp 字段
      return { ...newS, exp: storage.getXP(user?.id || '') };
    });
  }, []);

  // 派生数据
  const currentPet = state.currentPet;
  const petLevel = currentPet?.level || 1;
  const petThreshold = petLevel * 100;

  // 用 storage 直接读取最新 XP，确保宠物经验池不依赖 state.exp 的时效性
  const totalXP = storage.getXP(storage.getUser()?.id || '') || state.exp || 0;
  const lp = calcLevelProgress(totalXP);
  const spendableXP = lp.currentExp; // 当前等级内可消费经验（用于商店）

  // 宠物经验 = 玩家总 XP - 已消耗在宠物升级上的 XP（持续累积，不随玩家升级重置）
  const petExpConsumed = state.petExpConsumed || 0;
  const petExp = Math.max(0, totalXP - petExpConsumed);
  const petExpPct = Math.min(100, (petExp / petThreshold) * 100);
  const canLevelUpPet = petExp >= petThreshold;

  const petStage = useMemo(() => {
    if (petLevel < 2) return '蛋';
    if (petLevel < 10) return '幼年';
    if (petLevel < 20) return '成长期';
    if (petLevel < 30) return '成熟体';
    return '完全体';
  }, [petLevel]);

  const poolInfo = (state.petPool || []).find(p => p.poolId === currentPet?.poolId)
    || { name: '无牙仔', emoji: '🐉', rarity: 'SR' };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #eef2ff 0%, #ede9fe 40%, #fce7f3 100%)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* 顶部导航 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 18px',
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(99,102,241,0.08)',
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        <button onClick={onBack} style={{
          width: 36, height: 36, borderRadius: 10, border: 'none',
          background: '#f3f4f6', fontSize: 17, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>←</button>
        <div>
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1f2937' }}>🐉 宠物互动</h1>
          <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>
            {poolInfo?.name} · {petStage} · Lv.{petLevel}
          </p>
        </div>
        {/* 玩家等级 */}
        <div style={{
          marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 10px', background: 'linear-gradient(135deg,#f3e8ff,#e0e7ff)',
          borderRadius: 8, fontSize: 11,
        }}>
          <span style={{ fontWeight: 600, color: '#7c3aed' }}>⭐ Lv.{calcLevel(totalXP)}</span>
          <div style={{ width: 60, height: 6, background: '#e5e7eb', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              width: `${Math.min(100, (lp.currentExp / lp.requiredExp) * 100)}%`,
              height: '100%', background: '#a78bfa', borderRadius: 3,
            }} />
          </div>
          <span style={{ color: '#6b7280', fontSize: 10 }}>{lp.currentExp}/{lp.requiredExp}</span>
        </div>
      </div>

      {/* Tab 栏 */}
      <div style={{ display: 'flex', padding: '0 16px', marginTop: 10, gap: 6 }}>
        {[{ key: 'interact', label: '🎮 互动' }, { key: 'tasks', label: '📋 任务' }, { key: 'shop', label: '🏪 商店' }].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            flex: 1, padding: '9px 0', border: 'none', borderRadius: 10,
            background: activeTab === tab.key ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.85)',
            color: activeTab === tab.key ? 'white' : '#6b7280',
            fontWeight: activeTab === tab.key ? 600 : 500, fontSize: 11.5, cursor: 'pointer',
            boxShadow: activeTab === tab.key ? '0 3px 12px rgba(99,102,241,0.32)' : '0 1px 3px rgba(0,0,0,0.05)',
          }}>{tab.label}</button>
        ))}
      </div>

      {/* 内容区 */}
      <div style={{ flex: 1, padding: 16, overflowY: 'auto', paddingBottom: 28 }}>

        {/* 互动 Tab */}
        {activeTab === 'interact' && (
          <>
            {/* 宠物展示 */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
              <Pet
                type="dragon" experience={petExp} level={petLevel} onGainExp={() => {}}
                mode="full" size={180}
                stats={currentPet?.stats}
                equippedAccessories={currentPet?.equippedAccessories}
                soundEnabled={state.settings?.soundEnabled !== false}
                onInteract={handleInteract}
                inventory={state.inventory}
              />
            </div>

            {/* 宠物经验 + 升级 */}
            <div style={{
              background: 'white', borderRadius: 16, padding: 14,
              boxShadow: '0 2px 12px rgba(0,0,0,0.05)', marginBottom: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>🐉 宠物成长经验</span>
                  <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 6 }}>Lv.{petLevel} · {petStage}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: canLevelUpPet ? '#7c3aed' : '#9ca3af' }}>
                  {petExp} / {petThreshold}
                  {canLevelUpPet && <span style={{ color: '#10b981', marginLeft: 4 }}>可升级!</span>}
                </span>
              </div>
              <div style={{ width: '100%', background: '#f3f4f6', borderRadius: 6, height: 10, overflow: 'hidden', marginBottom: 8 }}>
                <div style={{
                  width: `${petExpPct}%`, height: '100%', borderRadius: 6, transition: 'width 0.5s',
                  background: canLevelUpPet ? 'linear-gradient(90deg,#8b5cf6,#7c3aed)' : 'linear-gradient(90deg,#a78bfa,#8b5cf6)',
                }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>
                  宠物经验池: <strong style={{ color: '#6366f1' }}>{petExp}</strong> XP（升级需 {petThreshold}）
                </p>
                {canLevelUpPet ? (
                  <button onClick={handlePetLevelUp} style={{
                    padding: '6px 16px', border: 'none', borderRadius: 8, cursor: 'pointer',
                    background: levelUpAnim ? 'linear-gradient(135deg,#fbbf24,#f59e0b)' : 'linear-gradient(135deg,#8b5cf6,#7c3aed)',
                    color: 'white', fontSize: 12, fontWeight: 700,
                    boxShadow: '0 3px 10px rgba(139,92,246,0.4)',
                  }}>
                    {levelUpAnim ? '🎉 升级!' : '✨ 升级'}
                  </button>
                ) : (
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>继续答题获取经验</span>
                )}
              </div>
            </div>

            {/* 今日概览 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {[
                { label: '答题数', value: state.totalLearnQuestions || 0, icon: '📝', color: '#6366f1' },
                { label: '正确率', value: state.totalLearnQuestions ? `${Math.round((state.totalCorrectAnswers || 0) / state.totalLearnQuestions * 100)}%` : '-', icon: '✅', color: '#10b981' },
                { label: '活跃天数', value: state.daysActive || 1, icon: '🔥', color: '#f59e0b' },
              ].map(card => (
                <div key={card.label} style={{ background: 'white', borderRadius: 12, padding: 12, textAlign: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
                  <div style={{ fontSize: 20 }}>{card.icon}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: card.color, lineHeight: 1.2, marginTop: 2 }}>{card.value}</div>
                  <div style={{ fontSize: 9, color: '#9ca3af' }}>{card.label}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'tasks' && (
          <DailyTasksPanel state={state} onClaim={handleClaimTask} />
        )}

        {activeTab === 'shop' && (
          <ShopPanel state={state} onBuy={handleShopAction} onUseItem={handleUseItem} spendableXP={spendableXP} />
        )}
      </div>

      <style>{`
        @keyframes levelUpPop {
          0% { transform: scale(1); } 50% { transform: scale(1.15); } 100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
