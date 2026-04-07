import React, { useMemo, useState, useEffect, useCallback } from 'react';
import Pet from '../components/Pet';
import {
  initGamificationState,
  gainExpForLearning,
  drawCard,
  getPetStage,
  tickPetStats,
  claimTaskReward,
  updateTaskProgress,
  buyItem,
  useItemOnPet,
  buyAccessory,
  equipAccessory,
  unequipAccessory,
  SHOP_ITEMS,
  DAILY_TASK_TEMPLATES,
} from '../utils/gamification';
import { storage, calcLevel, calcLevelProgress } from '../utils/storage';
import { fetchMV1State, upsertMV1State } from '../utils/mv1_cloud';
import ShopPanel from '../components/ShopPanel';
import DailyTasksPanel from '../components/DailyTasksPanel';

/**
 * 宠物互动页面 v4 - 修复版
 *
 * Tab 布局:
 *   🎮 互动 - 大号宠物展示 + 状态条 + 气泡对话 + 抚摸/喂养/洗澡/休息
 *   📋 任务 - 每日任务系统（简化版）
 *   🏪 商店 - 道具店 / 装扮店 / 背包 / 我的搭配
 * 
 * 修复内容:
 *   - 删除"学习"栏目（无用，答题在主页进行）
 *   - 简化每日任务设计
 *   - 分离宠物等级和用户等级
 *   - 用户经验系统和升级功能
 */
export default function MV1Demo({ onBack, initialState, onStateChange }) {
  const [state, setState] = useState(() => initialState || initGamificationState());
  const [activeTab, setActiveTab] = useState('interact');
  const [gameResult, setGameResult] = useState(null);
  
  // 初始化：从云端/本地加载状态
  useEffect(() => {
    const user = storage.getUser();
    if (user && user.id) {
      fetchMV1State(user.id).then((cloud) => {
        if (cloud) {
          // 合并新字段（向后兼容）
          const base = initGamificationState();
          
          // 🔧 修复：检查每日任务是否需要重置
          let dailyTasks = cloud.dailyTasks || base.dailyTasks;
          const today = new Date().toDateString();
          if (cloud.dailyLastResetDate !== today) {
            dailyTasks = initDailyTasks();
          }
          
          const merged = {
            ...base,
            ...cloud,
            // 确保新字段存在
            currentPet: {
              ...base.currentPet,
              ...(cloud.currentPet || {}),
              stats: cloud.currentPet?.stats || base.currentPet.stats,
              equippedAccessories: cloud.currentPet?.equippedAccessories || {},
            },
            inventory: {
              ...base.inventory,
              ...(cloud.inventory || {}),
            },
            dailyTasks,
            dailyLastResetDate: cloud.dailyLastResetDate || today,
            taskCounters: cloud.taskCounters || base.taskCounters,
          };
          setState(merged);
        }
      });
    }
  }, []);

  // 持久化：每次状态变化保存到云端和父组件
  useEffect(() => {
    const user = storage.getUser();
    if (user && user.id) upsertMV1State(user.id, state);
    else storage.setMV1State(null, state);
    
    // 同步到父组件，确保全局状态一致
    if (onStateChange) {
      onStateChange(state);
    }
  }, [state, onStateChange]);

  // ---- 时间流逝（每30秒模拟5分钟游戏时间）----
  useEffect(() => {
    const interval = setInterval(() => {
      setState(s => tickPetStats(s, 5));
    }, 30000); // 每30秒衰减一次
    return () => clearInterval(interval);
  }, []);

  // ================================================================
  //  操作函数
  // ================================================================

  const doLearn = (accuracy) => {
    setState((s) => gainExpForLearning(s, accuracy));
    
    // 🔧 新增：将学习经验同步到用户账号
    const user = storage.getUser();
    if (user) {
      // 计算获得的经验值
      const expGain = accuracy >= 0.8 ? 20 : 10;
      const newTotalExp = (user.totalExperience || 0) + expGain;
      storage.setUser({
        ...user,
        totalExperience: newTotalExp,
      });
    }
  };

  const handlePetExpGain = (delta) => {
    setState((s) => {
      // 🔧 修复：宠物等级独立，不与用户等级相通
      let ns = { ...s };
      
      // 只增加宠物经验，不影响用户等级
      if (delta && ns.currentPet) {
        const petExp = (ns.currentPet.exp || 0) + delta;
        let petLevel = ns.currentPet.level || 1;
        let remainingExp = petExp;
        
        // 检查宠物是否需要升级
        while (remainingExp >= petLevel * 100) {
          remainingExp -= petLevel * 100;
          petLevel += 1;
        }
        
        ns.currentPet = { 
          ...ns.currentPet, 
          exp: remainingExp, 
          level: petLevel, 
          stage: getPetStage(petLevel), 
          lastAction: petLevel > (ns.currentPet.level || 1) ? 'levelUp' : 'expGain'
        };
      }
      
      // 更新任务进度（学习相关任务）
      ns = updateTaskProgress(ns, 'learn', 1);
      
      return ns;
    });
  };

  // 商店操作
  const handleShopAction = useCallback((actionId) => {
    setState(s => {
      if (actionId.startsWith('buy_acc_')) {
        const accId = actionId.replace('buy_acc_', '');
        return buyAccessory(s, accId);
      }
      if (actionId.startsWith('equip_')) {
        const accId = actionId.replace('equip_', '');
        return equipAccessory(s, accId);
      }
      if (actionId.startsWith('unequip_')) {
        const slot = actionId.replace('unequip_', '');
        return unequipAccessory(s, slot);
      }
      
      // 默认购买道具
      return buyItem(s, actionId);
    });
  }, []);
  
  // 使用背包物品
  const handleUseItem = useCallback((itemId) => {
    setState(s => useItemOnPet(s, itemId));
  }, []);

  // ---- 互动动作处理（消耗道具 + 宠物反馈）----
  const handleInteract = useCallback((actionType) => {
    setState(s => {
      const inv = s.inventory || {};
      switch (actionType) {
        case 'feed': {
          // 优先用高级食物，没有再用基础
          if ((inv.foods?.advanced || 0) > 0) {
            return useItemOnPet({ ...s, inventory: { ...inv, foods: { ...inv.foods, advanced: inv.foods.advanced - 1 } } }, 'food_advanced');
          }
          if ((inv.foods?.basic || 0) > 0) {
            return useItemOnPet({ ...s, inventory: { ...inv, foods: { ...inv.foods, basic: inv.foods.basic - 1 } } }, 'food_basic');
          }
          return s; // 没有食物
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
          // 抚摸不消耗道具，直接增加亲密度
          const pet = { ...s.currentPet };
          const stats = { ...(pet.stats || { hunger: 70, cleanliness: 70, energy: 80, intimacy: 30 }) };
          stats.intimacy = Math.min(stats.intimacy + 5, 100);
          pet.stats = stats;
          pet.lastAction = 'tapped';
          pet.tapCount = (pet.tapCount || 0) + 1;
          return { ...s, currentPet: pet };
        }
        default:
          return s;
      }
    });
  }, []);

  // 领取任务奖励
  const handleClaimTask = useCallback((taskId) => {
    setState(s => claimTaskReward(s, taskId));
  }, []);

  // 小游戏结束奖励
  const handleGameEnd = useCallback((result) => {
    setGameResult(result);
    setState(s => {
      const expGain = result.won ? Math.round(result.score / 5 || 50) : Math.round(result.matches * 10);
      let newS = { ...s };
      newS.exp = (newS.exp || 0) + expGain;
      
      // 奖励物品
      if (result.score > 100 || result.won) {
        newS.inventory = { ...newS.inventory };
        newS.inventory.foods = { 
          ...newS.inventory.foods, 
          basic: (newS.inventory.foods?.basic || 0) + 1 
        };
      }
      
      // 加亲密度
      if (newS.currentPet?.stats) {
        newS.currentPet = {
          ...newS.currentPet,
          stats: {
            ...newS.currentPet.stats,
            intimacy: Math.min(newS.currentPet.stats.intimacy + 10, 100),
          },
          lastAction: 'happy',
        };
      }
      
      return newS;
    });
    
    // 3秒后自动清除结果提示
    setTimeout(() => setGameResult(null), 3000);
  }, []);

  // ================================================================
  //  派生数据
  // ================================================================

  const currentPet = state.currentPet;
  const currentPetPool = state.petPool || [];
  const poolInfo = currentPetPool.find(p => p.poolId === currentPet?.poolId)
    || { name: '无牙仔', emoji: '🐉', rarity: 'SR' };

  const petStage = useMemo(() => {
    const lvl = currentPet?.level ?? 1;
    if (lvl < 2) return '蛋';
    if (lvl < 10) return '幼年';
    if (lvl < 20) return '成长期';
    if (lvl < 30) return '成熟体';
    return '完全体';
  }, [currentPet]);

  const sampleActions = [0.65, 0.75, 0.92, 1.0];

  // ================================================================
  //  渲染
  // ================================================================

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #eef2ff 0%, #ede9fe 40%, #fce7f3 100%)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* ====== 顶部导航栏 ====== */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 18px',
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(99,102,241,0.08)',
        position: 'sticky', top: 0, zIndex: 20,
      }}>
        <button
          onClick={onBack}
          style={{
            width: 36, height: 36, borderRadius: 10, border: 'none',
            background: '#f3f4f6', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', fontSize: 17,
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}
        >←</button>

        <div>
          <h1 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1f2937' }}>
            🐉 宠物互动
          </h1>
          <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>
            {poolInfo?.name} · {petStage} · Lv.{currentPet?.level || 1}
          </p>
        </div>

        {/* 用户经验和升级按钮 */}
        {(() => {
          const user = storage.getUser();
          if (!user) return null;
          const { level: userLevel, totalExperience = 0, nextLevelExp = 100 } = user;
          const currentExp = calcLevelProgress(totalExperience);
          const canLevelUp = totalExperience >= nextLevelExp;
          
          return (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8,
              marginLeft: 'auto',
              padding: '4px 10px',
              background: 'linear-gradient(135deg, #f3e8ff, #e0e7ff)',
              borderRadius: 8,
              fontSize: 11,
            }}>
              <span style={{ fontWeight: 600, color: '#7c3aed' }}>
                ⭐ Lv.{userLevel}
              </span>
              <div style={{ 
                width: 60, 
                height: 6, 
                background: '#e5e7eb', 
                borderRadius: 3,
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${Math.min(100, (currentExp.currentExp / currentExp.requiredExp) * 100)}%`,
                  height: '100%',
                  background: canLevelUp ? '#8b5cf6' : '#a78bfa',
                  borderRadius: 3,
                  transition: 'width 0.3s ease',
                }} />
              </div>
              <span style={{ color: '#6b7280', fontSize: 10 }}>
                {currentExp.currentExp}/{nextLevelExp}
              </span>
              {canLevelUp && (
                <button
                  onClick={() => {
                    const u = storage.getUser();
                    if (u && u.level && u.nextLevelExp) {
                      // 检查是否可以升级
                      if (u.totalExperience >= u.nextLevelExp) {
                        const newLevel = u.level + 1;
                        const newNextExp = Math.round(u.nextLevelExp * 1.2);
                        storage.setUser({
                          ...u,
                          level: newLevel,
                          nextLevelExp: newNextExp,
                        });
                        // 刷新页面
                        window.location.reload();
                      }
                    }
                  }}
                  style={{
                    padding: '2px 8px',
                    border: 'none',
                    borderRadius: 4,
                    background: '#8b5cf6',
                    color: 'white',
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  升级
                </button>
              )}
            </div>
          );
        })()}

        {/* 游戏结果浮动通知 */}
        {gameResult && (
          <div style={{
            marginLeft: 'auto',
            background: gameResult.won ? '#d1fae5' : '#fee2e2',
            color: gameResult.won ? '#065f46' : '#991b1b',
            fontSize: 11, fontWeight: 700, padding: '4px 10px',
            borderRadius: 8,
            animation: 'resultPop 0.3s ease-out',
          }}>
            {gameResult.won ? `🎉 +${Math.round(gameResult.score / 5 || 50)}exp!` : `💪 再接再厉!`}
          </div>
        )}
      </div>

      {/* ====== Tab 切换栏 ====== */}
      <div style={{ display: 'flex', padding: '0 16px', marginTop: 10, gap: 6 }}>
        {[
          { key: 'interact', label: '🎮 互动' },
          { key: 'tasks', label: '📋 任务' },
          { key: 'shop', label: '🏪 商店' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              flex: 1, padding: '9px 0', border: 'none', borderRadius: 10,
              background: activeTab === tab.key
                ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                : 'rgba(255,255,255,0.85)',
              color: activeTab === tab.key ? 'white' : '#6b7280',
              fontWeight: activeTab === tab.key ? 600 : 500,
              fontSize: 11.5,
              cursor: 'pointer',
              boxShadow: activeTab === tab.key
                ? '0 3px 12px rgba(99,102,241,0.32)'
                : '0 1px 3px rgba(0,0,0,0.05)',
              transition: 'all 0.25s ease',
            }}
          >{tab.label}</button>
        ))}
      </div>

      {/* ====== 主内容区 ====== */}
      <div style={{ flex: 1, padding: '16px', overflowY: 'auto', paddingBottom: 28 }}>

        {/* ========== 🎮 互动 Tab ========== */}
        {activeTab === 'interact' && (
          <>
            {/* 宠物大展示区 */}
            <div style={{
              display: 'flex', justifyContent: 'center', marginBottom: 16,
            }}>
              <Pet
                type="dragon"
                experience={currentPet?.exp || 0}
                level={state.totalStars || currentPet?.level || 1}
                onGainExp={handlePetExpGain}
                mode="full"
                size={180}
                stats={currentPet?.stats}
                equippedAccessories={currentPet?.equippedAccessories}
                soundEnabled={state.settings?.soundEnabled !== false}
                onInteract={handleInteract}
                inventory={state.inventory}
              />
            </div>

            {/* 抽卡区域 */}
            <div style={{
              background: 'white', borderRadius: 16, padding: 14,
              boxShadow: '0 2px 12px rgba(0,0,0,0.05)', marginBottom: 16,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>✨ 抽卡获取新宠物</span>
                <button
                  onClick={() => setState((s) => drawCard(s))}
                  style={{
                    padding: '6px 14px', borderRadius: 8, border: 'none',
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    color: '#78350f', fontWeight: 700, fontSize: 11.5,
                    cursor: 'pointer', boxShadow: '0 2px 8px rgba(245,158,11,0.3)',
                  }}
                >🃏 抽一次 (500⭐)</button>
              </div>
              <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>
                已拥有：{state.ownedPets?.map(pid => {
                  const p = state.petPool?.find(pp => pp.poolId === pid);
                  return p ? `${p.emoji}${p.name}` : pid;
                }).join(', ') || '暂无'}
              </p>
            </div>

            {/* 今日概览小卡片 */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8,
            }}>
              {[
                { label: '答题数', value: state.totalLearnQuestions || 0, icon: '📝', color: '#6366f1' },
                { label: '正确率', value: state.totalLearnQuestions
                  ? `${Math.round((state.totalCorrectAnswers || 0) / state.totalLearnQuestions * 100)}%`
                  : '-', icon: '✅', color: '#10b981' },
                { label: '活跃天数', value: state.daysActive || 1, icon: '🔥', color: '#f59e0b' },
              ].map(card => (
                <div key={card.label} style={{
                  background: 'white', borderRadius: 12, padding: 12,
                  textAlign: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
                }}>
                  <div style={{ fontSize: 20 }}>{card.icon}</div>
                  <div style={{
                    fontSize: 18, fontWeight: 800, color: card.color,
                    lineHeight: 1.2, marginTop: 2,
                  }}>{card.value}</div>
                  <div style={{ fontSize: 9, color: '#9ca3af' }}>{card.label}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ========== 📋 任务 Tab ========== */}
        {activeTab === 'tasks' && (
          <DailyTasksPanel
            state={state}
            onClaim={handleClaimTask}
          />
        )}

        {/* ========== 🏪 商店 Tab ========== */}
        {activeTab === 'shop' && (
          <ShopPanel
            state={state}
            onBuy={handleShopAction}
            onUseItem={handleUseItem}
          />
        )}
      </div>

      {/* 全局动画定义 */}
      <style>{`
        @keyframes resultPop {
          0% { opacity: 0; transform: scale(0.8) translateY(-10px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

