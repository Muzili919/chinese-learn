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
import { fetchMV1State, upsertMV1State, fetchUserPetPreview, sendEncouragement } from '../utils/mv1_cloud';
import ShopPanel from '../components/ShopPanel';
import DailyTasksPanel from '../components/DailyTasksPanel';
import PetSwitchPanel from '../components/PetSwitchPanel';

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

// ====== 好友面板组件 ======
function FriendsPanel({ state, userId, onStateChange }) {
  const [friends, setFriends] = useState([]);
  const [friendPreviews, setFriendPreviews] = useState({});
  const [addInput, setAddInput] = useState('');
  const [addStatus, setAddStatus] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [encouraging, setEncouraging] = useState({});
  const [showEncouragements, setShowEncouragements] = useState(false);
  const [activeEncouragement, setActiveEncouragement] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // 加载好友预览
  useEffect(() => {
    const list = state.friends || [];
    setFriends(list);
    if (list.length === 0) return;
    Promise.all(
      list.map(async (fid) => {
        const preview = await fetchUserPetPreview(fid);
        return { id: fid, ...preview };
      })
    ).then(results => {
      const map = {};
      results.forEach(r => { if (r.petEmoji) map[r.id] = r; });
      setFriendPreviews(map);
    });
  }, [state.friends]);

  // 未读鼓励
  const pending = (state.pendingEncouragements || []).filter(
    e => !e.read
  );

  // 添加好友
  const handleAddFriend = async () => {
    const fid = addInput.trim();
    if (!fid) return;
    if (fid === userId) { setAddStatus('不能添加自己'); return; }
    if (friends.includes(fid)) { setAddStatus('已经是好友了'); return; }
    setAddLoading(true);
    setAddStatus('验证中...');
    try {
      const preview = await fetchUserPetPreview(fid);
      if (!preview?.petEmoji) {
        setAddStatus('未找到该用户，请检查好友码');
        setAddLoading(false);
        return;
      }
      // 通过验证，添加好友
      const newFriends = [...friends, fid];
      setFriends(newFriends);
      setAddStatus('');
      setAddInput('');
      // 更新state（通过parent callback）
      const fullState = { ...state, friends: newFriends };
      await upsertMV1State(userId, fullState);
      // 同时更新本地preview
      setFriendPreviews(prev => ({ ...prev, [fid]: preview }));
    } catch (e) {
      setAddStatus('网络错误，请重试');
    }
    setAddLoading(false);
  };

  // 发送鼓励
  const handleEncourage = async (friendId) => {
    if (encouraging[friendId]) return;
    setEncouraging(prev => ({ ...prev, [friendId]: true }));
    const userName = storage.getUser()?.name || '匿名';
    const ok = await sendEncouragement(userId, userName, friendId);
    if (ok) {
      setEncouraging(prev => ({ ...prev, [friendId]: 'done' }));
    } else {
      setEncouraging(prev => ({ ...prev, [friendId]: 'fail' }));
    }
    setTimeout(() => setEncouraging(prev => ({ ...prev, [friendId]: false })), 2000);
  };

  // 复制自己的好友码
  const copyFriendCode = () => {
    navigator.clipboard?.writeText(userId || '');
    setAddStatus('好友码已复制!');
    setTimeout(() => setAddStatus(''), 2000);
  };

  // 删除好友
  const handleDeleteFriend = async (friendId) => {
    const newFriends = friends.filter(f => f !== friendId);
    setFriends(newFriends);
    setConfirmDelete(null);
    setFriendPreviews(prev => {
      const next = { ...prev };
      delete next[friendId];
      return next;
    });
    const fullState = { ...state, friends: newFriends };
    await upsertMV1State(userId, fullState);
  };

  return (
    <div>
      {/* 我的好友码 */}
      <div style={{
        background: 'linear-gradient(135deg, #f0f9ff, #e0f2fe)',
        borderRadius: 16, padding: 16, marginBottom: 16, textAlign: 'center',
        boxShadow: '0 2px 10px rgba(59,130,246,0.08)',
      }}>
        <p style={{ margin: '0 0 4px', fontSize: 12, color: '#6b7280' }}>我的好友码</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <code style={{
            fontSize: 16, fontWeight: 800, color: '#1e40af',
            background: 'white', padding: '6px 16px', borderRadius: 10,
            letterSpacing: 1, fontFamily: 'monospace',
          }}>{userId || '...'}</code>
          <button onClick={copyFriendCode} style={{
            padding: '6px 12px', border: 'none', borderRadius: 8, cursor: 'pointer',
            background: '#3b82f6', color: 'white', fontSize: 11, fontWeight: 600,
          }}>复制</button>
        </div>
        <p style={{ margin: '6px 0 0', fontSize: 10, color: '#9ca3af' }}>📋 推荐点击「复制」后发送给朋友，或让对方也点「复制」再粘贴添加</p>
      </div>

      {/* 未读鼓励弹窗 */}
      {pending.length > 0 && !showEncouragements && (
        <div onClick={() => setShowEncouragements(true)} style={{
          background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
          borderRadius: 14, padding: 14, marginBottom: 14, cursor: 'pointer',
          boxShadow: '0 2px 10px rgba(245,158,11,0.15)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 28 }}>🌟</span>
          <div>
            <p style={{ margin: 0, fontWeight: 700, color: '#92400e', fontSize: 14 }}>
              收到 {pending.length} 条新鼓励!
            </p>
            <p style={{ margin: 0, fontSize: 11, color: '#b45309' }}>点击查看详情</p>
          </div>
        </div>
      )}

      {/* 鼓励详情 */}
      {showEncouragements && pending.length > 0 && (
        <div style={{
          background: 'white', borderRadius: 16, padding: 16, marginBottom: 14,
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#374151' }}>🌟 鼓励墙</span>
            <button onClick={() => setShowEncouragements(false)} style={{
              padding: '4px 12px', border: 'none', borderRadius: 6, background: '#f3f4f6',
              fontSize: 11, cursor: 'pointer', color: '#6b7280',
            }}>关闭</button>
          </div>
          {pending.map((e, i) => (
            <div key={i} style={{
              padding: '10px 0', borderBottom: i < pending.length - 1 ? '1px solid #f3f4f6' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 18 }}>🌟</span>
                <span style={{ fontWeight: 600, fontSize: 13, color: '#374151' }}>{e.name}</span>
                <span style={{ fontSize: 10, color: '#9ca3af' }}>{new Date(e.time).toLocaleDateString()}</span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6366f1' }}>
                为你加油打气! 宠物亲密度 +2 💕
              </p>
            </div>
          ))}
        </div>
      )}

      {/* 添加好友 */}
      <div style={{
        background: 'white', borderRadius: 14, padding: 14, marginBottom: 14,
        boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
      }}>
        <p style={{ margin: '0 0 8px', fontWeight: 600, fontSize: 13, color: '#374151' }}>➕ 添加好友</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={addInput}
            onChange={e => setAddInput(e.target.value)}
            placeholder="输入好友码..."
            style={{
              flex: 1, padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8,
              fontSize: 13, outline: 'none',
            }}
          />
          <button onClick={handleAddFriend} disabled={addLoading} style={{
            padding: '8px 16px', border: 'none', borderRadius: 8, cursor: 'pointer',
            background: addLoading ? '#d1d5db' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            color: 'white', fontSize: 12, fontWeight: 600,
          }}>{addLoading ? '...' : '添加'}</button>
        </div>
        {addStatus && (
          <p style={{ margin: '6px 0 0', fontSize: 11, color: addStatus.includes('未找到') || addStatus.includes('自己') || addStatus.includes('已') ? '#ef4444' : '#6366f1' }}>
            {addStatus}
          </p>
        )}
      </div>

      {/* 好友列表 */}
      <p style={{ margin: '0 0 10px', fontWeight: 600, fontSize: 14, color: '#374151' }}>
        👫 我的好友 ({friends.length})
      </p>
      {friends.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: 30, color: '#9ca3af',
          background: 'white', borderRadius: 14,
        }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🤝</div>
          <p style={{ margin: 0, fontSize: 13 }}>还没有好友</p>
          <p style={{ margin: '4px 0 0', fontSize: 11 }}>分享好友码，添加第一个好友吧!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {friends.map(fid => {
            const p = friendPreviews[fid] || {};
            const today = new Date().toISOString().slice(0, 10);
            const alreadyEncouraged = encouraging[fid] === 'done';
            const isConfirmingDelete = confirmDelete === fid;
            return (
              <div key={fid} style={{
                background: 'white', borderRadius: 14, padding: 14,
                boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
                display: 'flex', alignItems: 'center', gap: 12,
                position: 'relative',
              }}>
                {/* 宠物头像 */}
                <div style={{
                  width: 50, height: 50, borderRadius: 50,
                  background: 'linear-gradient(135deg, #ede9fe, #fce7f3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, flexShrink: 0,
                }}>
                  {p.petEmoji || '🥚'}
                </div>
                {/* 宠物信息 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#1f2937' }}>{p.petName || '加载中...'}</span>
                    <span style={{
                      padding: '1px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700,
                      background: p.petRarity === 'SSR' ? '#fef3c7' : p.petRarity === 'SR' ? '#ede9fe' : '#f3f4f6',
                      color: p.petRarity === 'SSR' ? '#92400e' : p.petRarity === 'SR' ? '#6d28d9' : '#6b7280',
                    }}>{p.petRarity || 'N'}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>
                    {p.petStage || '?'} · Lv.{p.petLevel || 0} · 📝{p.totalLearnQuestions || 0}题 · 🔥{p.daysActive || 1}天
                  </p>
                </div>
                {/* 操作按钮 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                  {!isConfirmingDelete && (
                    <button
                      onClick={() => handleEncourage(fid)}
                      disabled={alreadyEncouraged}
                      style={{
                        padding: '6px 14px', border: 'none', borderRadius: 10, cursor: 'pointer',
                        background: alreadyEncouraged
                          ? '#f3f4f6'
                          : 'linear-gradient(135deg,#fbbf24,#f59e0b)',
                        color: alreadyEncouraged ? '#9ca3af' : 'white',
                        fontSize: 11, fontWeight: 700,
                        boxShadow: alreadyEncouraged ? 'none' : '0 2px 8px rgba(251,191,36,0.3)',
                      }}>
                      {alreadyEncouraged ? '✅ 已鼓励' : '🌟 鼓励'}
                    </button>
                  )}
                  {!isConfirmingDelete && (
                    <button
                      onClick={() => setConfirmDelete(fid)}
                      style={{
                        padding: '4px 14px', border: 'none', borderRadius: 8,
                        background: 'none', color: '#d1d5db', fontSize: 10,
                        cursor: 'pointer',
                      }}>
                      删除
                    </button>
                  )}
                  {isConfirmingDelete && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        onClick={() => handleDeleteFriend(fid)}
                        style={{
                          padding: '4px 10px', border: 'none', borderRadius: 6,
                          background: '#fee2e2', color: '#dc2626',
                          fontSize: 10, fontWeight: 600, cursor: 'pointer',
                        }}>确认</button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        style={{
                          padding: '4px 10px', border: 'none', borderRadius: 6,
                          background: '#f3f4f6', color: '#6b7280',
                          fontSize: 10, cursor: 'pointer',
                        }}>取消</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ====== 主组件 ======
export default function MV1Demo({ onBack, initialState, onStateChange }) {
  const [state, setState] = useState(() => initialState || initGamificationState());
  const [activeTab, setActiveTab] = useState('interact');
  const [levelUpAnim, setLevelUpAnim] = useState(false);

  const userId = useMemo(() => storage.getUser()?.id || '', []);
  const userName = useMemo(() => storage.getUser()?.name || '', []);

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
        friends: cloud?.friends || [],
        pendingEncouragements: cloud?.pendingEncouragements || [],
        weeklyQuestions: cloud?.weeklyQuestions || 0,
        weeklyResetDate: cloud?.weeklyResetDate || todayStr,
      };
      setState(merged);
    });
  }, []);

  // 处理未读鼓励（进入宠物页时弹提示，自动标记已读）
  useEffect(() => {
    const pending = (state.pendingEncouragements || []).filter(e => !e.read);
    if (pending.length > 0) {
      setState(s => ({
        ...s,
        pendingEncouragements: (s.pendingEncouragements || []).map(e => ({ ...e, read: true })),
      }));
    }
  }, [state.pendingEncouragements?.length]);

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
        exp: totalXP,
        petExpConsumed: consumed + threshold,
        currentPet: {
          ...pet,
          level: newPetLevel,
          stage: getPetStage(newPetLevel),
          lastAction: 'levelUp',
        },
      };
    });
  }, []);

  // 商店购买
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

  // 互动
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

  // 领取任务奖励
  const handleClaimTask = useCallback((taskId) => {
    setState(s => {
      const task = s.dailyTasks?.find(t => t.id === taskId);
      if (!task || !task.completed || task.claimed) return s;
      const user = storage.getUser();
      if (user?.id && task.reward?.exp) storage.addXP(user.id, task.reward.exp);
      const newS = claimTaskReward(s, taskId);
      return { ...newS, exp: storage.getXP(user?.id || '') };
    });
  }, []);

  // 抽卡
  const handleDrawCard = useCallback(() => {
    setState(s => {
      const totalXP = storage.getXP(storage.getUser()?.id || '') || s.exp || 0;
      if (totalXP < 500) return s;
      const newS = drawCard(s);
      if (newS !== s && storage.getUser()?.id) {
        storage.addXP(storage.getUser().id, -500);
        return { ...newS, exp: Math.max(0, totalXP - 500) };
      }
      return s;
    });
  }, []);

  // 切换宠物
  const handleSwitchPet = useCallback((poolId) => {
    setState(s => {
      const owned = s.ownedPets || [];
      if (!owned.includes(poolId)) return s;
      const pet = s.currentPet || {};
      return {
        ...s,
        currentPet: {
          poolId,
          level: pet.level || 1,
          exp: pet.exp || 0,
          mood: 'neutral',
          tapCount: 0,
          stats: pet.stats || { hunger: 80, cleanliness: 80, energy: 90, intimacy: 30 },
          equippedAccessories: pet.equippedAccessories || {},
          lastAction: 'switched',
          lastFeedTime: Date.now(),
        },
      };
    });
  }, []);

  // 派生数据
  const currentPet = state.currentPet;
  const petLevel = currentPet?.level || 1;
  const petThreshold = petLevel * 100;

  const totalXP = storage.getXP(storage.getUser()?.id || '') || state.exp || 0;
  const lp = calcLevelProgress(totalXP);
  const spendableXP = lp.currentExp;

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

  const tabs = [
    { key: 'interact', label: '🎮 互动' },
    { key: 'tasks', label: '📋 任务' },
    { key: 'shop', label: '🏪 商店' },
    { key: 'friends', label: '👫 好友' },
    { key: 'my', label: '🐾 我的' },
  ];

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
        {/* 未读鼓励角标 */}
        {activeTab !== 'friends' && (state.pendingEncouragements || []).some(e => !e.read) && (
          <div
            onClick={() => setActiveTab('friends')}
            style={{
              marginLeft: 'auto', width: 32, height: 32, borderRadius: 50,
              background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative',
            }}
          >
            <span style={{ fontSize: 16 }}>🌟</span>
            <span style={{
              position: 'absolute', top: -2, right: -2,
              width: 14, height: 14, borderRadius: 50,
              background: '#ef4444', color: 'white', fontSize: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
            }}>
              {(state.pendingEncouragements || []).filter(e => !e.read).length}
            </span>
          </div>
        )}
        {/* 玩家等级 */}
        {!activeTab || activeTab !== 'friends' || !(state.pendingEncouragements || []).some(e => !e.read) ? (
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
        ) : null}
      </div>

      {/* Tab 栏 */}
      <div style={{ display: 'flex', padding: '0 16px', marginTop: 10, gap: 6 }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            flex: 1, padding: '9px 0', border: 'none', borderRadius: 10,
            background: activeTab === tab.key ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.85)',
            color: activeTab === tab.key ? 'white' : '#6b7280',
            fontWeight: activeTab === tab.key ? 600 : 500, fontSize: tab.key === 'friends' ? 10.5 : 11.5, cursor: 'pointer',
            boxShadow: activeTab === tab.key ? '0 3px 12px rgba(99,102,241,0.32)' : '0 1px 3px rgba(0,0,0,0.05)',
            position: 'relative',
          }}>
            {tab.label}
            {tab.key === 'friends' && (state.pendingEncouragements || []).some(e => !e.read) && (
              <span style={{
                position: 'absolute', top: 2, right: '20%',
                width: 8, height: 8, borderRadius: 50, background: '#ef4444',
              }} />
            )}
          </button>
        ))}
      </div>

      {/* 内容区 */}
      <div style={{ flex: 1, padding: 16, overflowY: 'auto', paddingBottom: 28 }}>

        {activeTab === 'interact' && (
          <>
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

        {activeTab === 'friends' && (
          <FriendsPanel state={state} userId={userId} />
        )}

        {activeTab === 'my' && (
          <PetSwitchPanel
            state={state}
            spendableXP={spendableXP}
            onSwitchPet={handleSwitchPet}
            onDrawCard={handleDrawCard}
            totalXP={totalXP}
          />
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
