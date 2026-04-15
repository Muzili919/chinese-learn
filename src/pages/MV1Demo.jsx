import React, { useMemo, useState, useEffect, useCallback } from 'react';
import Pet from '../components/Pet';
import PetEgg from '../components/PetEgg';
import GachaAnimation from '../components/GachaAnimation';
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
  isEggState,
  hasFreeCard,
  sellPet,
} from '../utils/gamification';
import { storage, calcLevel, calcLevelProgress } from '../utils/storage';
import { fetchMV1State, upsertMV1State, fetchUserPetPreview, sendEncouragement } from '../utils/mv1_cloud';
import { findUserByName, supabase as supabaseClient } from '../utils/sync';
import ShopPanel from '../components/ShopPanel';
import DailyTasksPanel from '../components/DailyTasksPanel';
import PetSwitchPanel from '../components/PetSwitchPanel';
import PetSpriteAvatar from '../components/PetSpriteAvatar';

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

  // 从users表批量获取用户名
  const fetchFriendNames = async (ids) => {
    if (!supabaseClient || ids.length === 0) return {};
    try {
      const { data } = await supabaseClient
        .from('users')
        .select('id, name')
        .in('id', ids);
      if (!data) return {};
      const m = {};
      data.forEach(u => { m[u.id] = u.name; });
      return m;
    } catch { return {}; }
  };

  // 加载好友预览（服务端API绕过RLS + users表补充名字）
  useEffect(() => {
    const list = state.friends || [];
    setFriends(list);
    if (list.length === 0) return;

    let cancelled = false;
    
    (async () => {
      let map = {};
      
      try {
        // === 策略1：走服务端API（绕过RLS）获取完整宠物数据 ===
        console.log('[friendPreviews] 通过服务端API查询', list.length, '个好友');
        const apiRes = await fetch('/api/friend-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: list }),
        });
        
        if (apiRes.ok) {
          const { previews } = await apiRes.json();
          console.log('[friendPreviews] 服务端返回:', previews?.length || 0, '条记录');
          (previews || []).forEach(p => { map[p.userId] = p; });
        } else {
          console.warn('[friendPreviews] 服务端API失败，降级为客户端查询', await apiRes.text());
        }
      } catch (e) {
        console.warn('[friendPreviews] 服务端API异常:', e.message, '降级处理');
      }
      
      // === 策略2：对服务端没返回的，尝试客户端直连补充（可能被RLS拦截）===
      for (const fid of list) {
        if (!map[fid]) {
          try {
            const p = await fetchUserPetPreview(fid);
            if (p?.petEmoji) map[fid] = p;
          } catch (_) {}
        }
      }
      
      // === 策略3：从users表补充用户名（兜底） ===
      const names = await fetchFriendNames(list);
      
      // 最终合并：有宠物数据直接用，没有的用名字+占位符
      for (const fid of list) {
        if (!map[fid]) {
          map[fid] = {
            userId: fid,
            petName: names[fid] || fid.slice(0, 10),
            petEmoji: '🥚',
            petLevel: null,
            petStage: '未孵化',
            totalLearnQuestions: null,
            daysActive: 0,
          };
        } else if (names[fid]) {
          // 有宠物数据但缺名字的补充名字
          if (!map[fid].petName) map[fid].petName = names[fid];
        }
      }
      
      if (!cancelled) setFriendPreviews(map);
    })();

    return () => { cancelled = true; };
  }, [state.friends]);

  // 未读鼓励
  const pending = (state.pendingEncouragements || []).filter(
    e => !e.read
  );

  // 添加好友（支持好友码/user_id 或 用户名，支持模糊搜索）
  const handleAddFriend = async () => {
    const fid = addInput.trim();
    if (!fid) return;
    if (fid === userId) { setAddStatus('不能添加自己'); return; }
    
    setAddLoading(true);
    setAddStatus('🔍 搜索中...');
    
    try {
      let targetId = null;
      let targetName = '';
      
      // === 策略1：直接当 user_id 用（输入的就是ID） ===
      console.log('[addFriend] 策略1: 尝试以user_id查询:', fid);
      const idPreview = await fetchUserPetPreview(fid);
      if (idPreview) {
        console.log('[addFriend] ✅ 在mv1_state中找到用户');
        targetId = fid;
      } else {
        console.log('[addFriend] ⚠️ mv1_state无记录，尝试users表模糊搜索...');
        
        // === 策略2：按名字查 users 表（先精确后模糊）===
        // 先用原版findUserByName（精确匹配）
        let foundUser = await findUserByName(fid);
        
        // 如果精确匹配不到，尝试模糊搜索
        if (!foundUser && supabaseClient) {
          console.log('[addFriend] 精确匹配未果，尝试模糊搜索...');
          const { data: fuzzyResults } = await supabaseClient
            .from('users')
            .select('id, name')
            .ilike('name', `%${fid}%`)
            .order('created_at', { ascending: false })
            .limit(5);
          console.log('[addFriend] 模糊搜索结果:', fuzzyResults);
          foundUser = fuzzyResults?.[0] || null;
        }
        
        if (foundUser) {
          if (foundUser.id === userId) { setAddLoading(false); setAddStatus('不能添加自己'); return; }
          if (friends.includes(foundUser.id)) { setAddLoading(false); setAddStatus('已经是好友了'); return; }
          targetId = foundUser.id;
          targetName = foundUser.name;
          console.log('[addFriend] ✅ 找到用户:', foundUser.name, 'id:', foundUser.id);
        }
      }

      // 最终判定
      if (!targetId) {
        console.error('[addFriend] ❌ 所有策略均未找到用户，输入值:', fid);
        setAddStatus(`❌ 未找到「${fid}」\n请确认对方已注册`);
        setAddLoading(false);
        return;
      }

      // 执行添加
      const displayName = targetName || targetId.slice(0, 10) + '...';
      console.log('[addFriend] 正在添加好友:', displayName, 'id:', targetId);
      
      setAddStatus(`✅ 已添加「${displayName}」为好友`);
      const newFriends = [...friends, targetId];
      setFriends(newFriends);
      setAddInput('');
      
      // 存储到云端，同时更新父组件 state（防止下次自动保存覆盖好友列表）
      const fullState = { ...state, friends: newFriends };
      await upsertMV1State(userId, fullState);
      if (onStateChange) onStateChange(fullState);
      
      // 更新预览（优先用服务端API绕过RLS）
      let preview = null;
      try {
        const apiRes = await fetch('/api/friend-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: [targetId] }),
        });
        if (apiRes.ok) {
          const { previews } = await apiRes.json();
          preview = previews?.[0] || null;
          console.log('[addFriend] 服务端预览:', preview ? '✅有数据' : '❌无数据');
        }
      } catch (e) {
        console.warn('[addFriend] 服务端预览失败:', e);
      }
      
      if (!preview) {
        preview = await fetchUserPetPreview(targetId);
      }
      
      const friendName = targetName || targetId.slice(0, 10);
      setFriendPreviews(prev => ({
        ...prev,
        [targetId]: (preview && preview.petEmoji) ? {
          ...preview,
          petName: preview.petName || friendName,
        } : {
          userId: targetId,
          petName: friendName,
          petEmoji: '🥚',
          petLevel: null,
          petStage: '未孵化',
          totalLearnQuestions: null,
          daysActive: 0,
        }
      }));
    } catch (e) {
      console.error('[addFriend] 异常:', e);
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
    if (onStateChange) onStateChange(fullState);
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
            placeholder="输入好友码或对方名字..."
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
                <PetSpriteAvatar
                  poolId={p.petPoolId || null}
                  level={p.petLevel || 1}
                  size={50}
                  emoji={p.petEmoji || '🥚'}
                />
                {/* 宠物信息 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#1f2937' }}>{p.playerName || p.petName || '加载中...'}</span>
                    <span style={{
                      padding: '1px 6px', borderRadius: 4, fontSize: 9, fontWeight: 700,
                      background: p.petRarity === 'SSR' ? '#fef3c7' : p.petRarity === 'SR' ? '#ede9fe' : '#f3f4f6',
                      color: p.petRarity === 'SSR' ? '#92400e' : p.petRarity === 'SR' ? '#6d28d9' : '#6b7280',
                    }}>{p.petRarity || 'N'}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: 11, color: '#9ca3af' }}>
                    {p.petStage || '未知'} · Lv.{p.petLevel ?? '?'} · 📝{p.totalLearnQuestions ?? 0}题 · 🔥{p.daysActive ?? 0}天
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
  // 防止初始化时的持久化 effect 用空状态覆盖云端好友数据
  const initializedRef = React.useRef(false);

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

      // 好友列表：优先用云端数据，若云端为空则保留 initialState 中的好友（避免初始化空态覆盖）
      const friends = cloud?.friends?.length
        ? cloud.friends
        : (initialState?.friends || []);

      // 宠物数据：优先级 — 云端 > initialState > 默认(蛋)
      // 关键修复：如果本地(initialState)已有宠物但云端没有，保留本地数据
      // 防止抽卡后切页面/刷新导致云端旧数据覆盖本地新宠物
      const localHasPet = (initialState?.currentPet?.poolId && initialState?.ownedPets?.length > 0)
      const cloudHasPet = cloud?.currentPet?.poolId
      const resolvedCurrentPet = (() => {
        if (cloud?.currentPet) {
          return {
            ...(initialState?.currentPet || {}),
            ...cloud.currentPet,
            stats: cloud.currentPet.stats || {},
            equippedAccessories: cloud.currentPet.equippedAccessories || {},
          }
        }
        // 云端没有宠物数据，但本地有 → 保留本地（防止变蛋）
        if (localHasPet) return initialState.currentPet
        // 都没有 → 蛋态
        return null
      })()

      const resolvedOwnedPets = (() => {
        if (cloud?.ownedPets?.length > 0) return cloud.ownedPets
        if (initialState?.ownedPets?.length > 0) return initialState.ownedPets
        return []
      })()

      const merged = {
        ...base,
        ...(cloud || {}),
        exp: storageXP,
        petExpConsumed: cloud?.petExpConsumed || 0,
        currentPet: resolvedCurrentPet,
        ownedPets: resolvedOwnedPets,
        inventory: { ...base.inventory, ...(cloud?.inventory || {}) },
        dailyTasks,
        dailyLastResetDate: today,
        taskCounters: cloud?.taskCounters || base.taskCounters,
        friends,
        pendingEncouragements: cloud?.pendingEncouragements || [],
        weeklyQuestions: cloud?.weeklyQuestions || 0,
        weeklyResetDate: cloud?.weeklyResetDate || todayStr,
      };
      initializedRef.current = true;
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

  // 持久化（跳过初始化前的渲染，防止空好友列表覆盖云端数据）
  useEffect(() => {
    if (!initializedRef.current) return;
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

  // 抽卡（支持动画）
  const [gachaResult, setGachaResult] = useState(null)  // 抽卡结果（供GachaAnimation用）
  const [showGacha, setShowGacha] = useState(false)     // 是否显示抽卡动画

  // 宠物互动页面点击切换表情（9个动作循环）
  const INTERACT_POSE_SEQUENCE = [
    'reading', 'sleeping', 'happy', 'wave', 'excited',
    'angry', 'sad_cry', 'eating', 'normal'
  ]
  const [interactTapCount, setInteractTapCount] = useState(0)
  const interactPose = INTERACT_POSE_SEQUENCE[interactTapCount % INTERACT_POSE_SEQUENCE.length]
  const handlePetInteractTap = useCallback(() => {
    setInteractTapCount(c => c + 1)
  }, [])

  const handleDrawCard = useCallback(() => {
    setState(s => {
      // 蛋态：使用免费券
      if (isEggState(s)) {
        const { state: newS, pet } = drawCard(s);
        if (!pet) return s; // 不应该发生
        setGachaResult(pet);
        setShowGacha(true);
        return newS;
      }
      
      // 正常抽卡
      const totalXP = storage.getXP(storage.getUser()?.id || '') || s.exp || 0;
      if (totalXP < 500 && !hasFreeCard(s)) return s;
      
      const { state: newS, pet } = drawCard(s);
      if (pet && newS !== s) {
        setGachaResult(pet);
        setShowGacha(true);
        if (storage.getUser()?.id && !hasFreeCard(s)) {
          storage.addXP(storage.getUser().id, -500);
          return { ...newS, exp: Math.max(0, totalXP - 500) };
        }
        return newS;
      }
      return s;
    });
  }, []);

  // 抽卡动画结束回调
  const handleGachaComplete = useCallback(() => {
    setShowGacha(false);
    setGachaResult(null);
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
              {isEggState(state) ? (
                /* 🥚 蛋态 */
                <PetEgg 
                  onDrawCard={handleDrawCard}
                  hasTicket={hasFreeCard(state)}
                />
              ) : (
                /* 🐱/🐉 宠物正常显示 */
                <Pet
                  type={currentPet?.poolId || 'pet_toothless'} experience={petExp} level={petLevel} onGainExp={() => {}}
                  mode="full" size={180}
                  pose={interactPose}
                  stats={currentPet?.stats}
                  equippedAccessories={currentPet?.equippedAccessories}
                  soundEnabled={state.settings?.soundEnabled !== false}
                  onInteract={handleInteract}
                  inventory={state.inventory}
                  onTap={handlePetInteractTap}
                />
              )}
            </div>

            {/* ✨ 抽卡动画覆盖层 */}
            <GachaAnimation
              pet={gachaResult}
              visible={showGacha}
              onComplete={handleGachaComplete}
            />

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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* 脉冲动画升级提示 badge */}
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      padding: '2px 10px', borderRadius: 12, fontSize: 11,
                      background: 'linear-gradient(135deg,#fef3c7,#fde68a)',
                      color: '#b45309', fontWeight: 700,
                      border: '1.5px solid #f59e0b',
                      boxShadow: '0 0 0 0 rgba(245,158,11,0.5)',
                      animation: 'levelUpPulse 1.5s ease-in-out infinite',
                    }}>🌟 可升级</span>
                    <button onClick={handlePetLevelUp} style={{
                      padding: '6px 16px', border: 'none', borderRadius: 8, cursor: 'pointer',
                      background: levelUpAnim ? 'linear-gradient(135deg,#fbbf24,#f59e0b)' : 'linear-gradient(135deg,#8b5cf6,#7c3aed)',
                      color: 'white', fontSize: 12, fontWeight: 700,
                      boxShadow: levelUpAnim ? '0 3px 16px rgba(251,191,36,0.5)' : '0 3px 10px rgba(139,92,246,0.4)',
                      animation: !levelUpAnim ? 'btnGlow 1.8s ease-in-out infinite' : 'none',
                    }}>
                      {levelUpAnim ? '🎉 升级!' : '✨ 升级'}
                    </button>
                  </div>
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
          <FriendsPanel state={state} userId={userId} onStateChange={setState} />
        )}

        {activeTab === 'my' && (
          <PetSwitchPanel
            state={state}
            spendableXP={spendableXP}
            onSwitchPet={handleSwitchPet}
            onDrawCard={handleDrawCard}
            totalXP={totalXP}
            onSellPet={(petPoolId) => {
              const result = sellPet(state, petPoolId);
              if (result.success) {
                setState(result.state);
              } else {
                // 可以显示toast提示
                console.warn('卖宠物失败:', result.error);
              }
            }}
          />
        )}
      </div>

      <style>{`
        @keyframes levelUpPop {
          0% { transform: scale(1); } 50% { transform: scale(1.15); } 100% { transform: scale(1); }
        }
        @keyframes levelUpPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.5); transform: scale(1); }
          50% { box-shadow: 0 0 6px 4px rgba(245,158,11,0.2); transform: scale(1.05); }
        }
        @keyframes btnGlow {
          0%, 100% { box-shadow: 0 3px 10px rgba(139,92,246,0.4); }
          50% { box-shadow: 0 3px 18px rgba(139,92,246,0.7), 0 0 12px rgba(139,92,246,0.3); }
        }
      `}</style>
    </div>
  );
}
