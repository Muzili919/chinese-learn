import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import Pet from '../components/Pet';
import PetEgg from '../components/PetEgg';
import GachaAnimation from '../components/GachaAnimation';

// 检查上帝模式（与App.jsx保持一致）
function isGodMode() {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.split('?')[1] || '')
  return params.get('god') === '1' || hash.get('god') === '1'
}

// ★★★ 统一经验获取函数（Bug #7a 彻底修复 + 无敌上帝模式）★★★
// ⚠️ 分支顺序至关重要：上帝模式必须最先检查！否则已登录用户的storage.getXP()会覆盖上帝模式经验
// 所有获取经验的地方都必须走这个函数，不再散落调用 storage.getXP()
function getEffectiveXP(state, user) {
  // ★ 上帝模式优先！（不管是否登录，上帝模式始终返回无限）
  if (state?._isGodMode) return Infinity;
  // 有正常登录用户 → 读 storage（真实数据源）
  if (user?.id) return storage.getXP(user.id) || state?.exp || 0;
  // 其他情况 fallback
  return state?.exp || 0;
}

// ★★★ 上帝模式检测辅助函数 ★★★
function isGodModeState(state) {
  return !!state?._isGodMode;
}
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
  ROOM_THEMES,
  FURNITURE_ITEMS,
  GAME_SHOP_ITEMS,
  initDailyTasks,
  isEggState,
  hasFreeCard,
  sellPet,
  PET_POOL,
} from '../utils/gamification';
import { storage, calcLevel, calcLevelProgress } from '../utils/storage';
import { fetchMV1State, upsertMV1State, fetchUserPetPreview, sendEncouragement } from '../utils/mv1_cloud';
import { findUserByName, supabase as supabaseClient } from '../utils/sync';
import ShopPanel from '../components/ShopPanel';
import DailyTasksPanel from '../components/DailyTasksPanel';
import PetSwitchPanel from '../components/PetSwitchPanel';
import PetSpriteAvatar from '../components/PetSpriteAvatar';
import WordCannonGame from './WordCannonGame';

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
    const list = state?.friends || [];
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
  }, [state?.friends]);

  // 未读鼓励
  const pending = (state?.pendingEncouragements || []).filter(
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
export default function MV1Demo({ onBack, initialState, onStateChange, grade, currentUserId: propUserId }) {
  // 初始状态：优先用传入的（上帝模式/缓存），否则默认
  const [state, setState] = useState(() => {
    // 如果传入的initialState有宠物，直接用它（防止刷新后变蛋）
    if (initialState?.currentPet?.poolId || initialState?.ownedPets?.length > 0) {
      return initialState;
    }
    // null表示"正在切换用户/首次登录"，让useEffect去拉云端数据
    // 不再返回空蛋态initGamificationState()！防止自动抽卡覆盖云端
    return null;
  });
  const [activeTab, setActiveTab] = useState('interact');
  const [levelUpAnim, setLevelUpAnim] = useState(false);
  // 是否已完成初始化（云端数据回来前不渲染宠物相关UI）
  const [isInitialized, setIsInitialized] = useState(false);
  // 防止初始化时的持久化 effect 用空状态覆盖云端好友数据
  const initializedRef = React.useRef(false);
  // 标记本次初始化是否成功从云端加载（false 时持久化 effect 不推送到 Supabase）
  const cloudLoadedRef = React.useRef(false);

  // ★ 用传入的 propUserId 作为用户变化信号（由 App.jsx 层保证切换账号时更新）
  // fallback 到 storage.getUser() 仅用于向后兼容（非 key 驱动挂载场景）
  const currentUserId = propUserId || storage.getUser()?.id || null

  // 初始化：云端加载 + 同步 storage XP + 同步今日任务
  // 依赖 currentUserId：当 App.jsx 切换账号导致 gameState 变化时重新拉取云端数据
  useEffect(() => {
    // 每次重新初始化时重置 cloudLoadedRef，防止上一次成功状态被沿用到新账号的错误推送
    cloudLoadedRef.current = false;
    // ★ 使用 propUserId（从 App.jsx props 传入），不再调用 storage.getUser()
    // 防止 init effect 闭包捕获到旧 userId（切换账号场景）
    const uid = currentUserId || storage.getUser()?.id || null;
    if (!uid) {
      // 没有登录用户（如god模式本地测试），直接用initialState标记初始化完成
      if (initialState) setState(initialState);
      initializedRef.current = true;
      setIsInitialized(true);
      return;
    }

    fetchMV1State(uid).then((cloud) => {
      const base = initGamificationState();
      const today = new Date().toDateString();
      const todayStr = new Date().toISOString().slice(0, 10);

      // 每日任务重置
      let dailyTasks = cloud?.dailyTasks || base.dailyTasks;
      if ((cloud?.dailyLastResetDate || '') !== today) {
        dailyTasks = initDailyTasks();
      }

      // 以 storage XP 为权威（答题时 storage.addXP 已实时更新）
      // ★ 上帝模式：不管是否登录，经验始终为无限（Infinity）
      const isGod = isGodMode()
      const storageXP = isGod ? Infinity : (uid ? storage.getXP(uid) : 0);

      // 同步今日答题到任务进度
      const records = storage.getRecords(uid);
      const todayRecords = records.filter(r => r.timestamp?.startsWith(todayStr));
      dailyTasks = syncTasksFromRecords(dailyTasks, todayRecords);

      // 好友列表：三路合并（优先级从高到低）
      //   1. localStorage 快照（LeaderboardPage 添加好友后持久化到本地，MV1Demo 可能还不知道）
      //   2. 云端数据（跨设备同步的权威源）
      //   3. initialState（App.jsx 传入的最新状态，包含 LeaderboardPage 的更新）
      // ★ Fix C: 必须取三者中最长的列表！因为 LeaderboardPage 和 FriendsPanel 都能添加好友，
      //   它们写入的位置不同（Supabase / App.gameState / localStorage），任何一个都可能比其他的新
      const localFriends = localSnapshot?.friends
      const cloudFriends = (Array.isArray(cloud?.friends) && cloud.friends.length > 0) ? cloud.friends : null
      const initFriends = (Array.isArray(initialState?.friends) && initialState.friends.length > 0) ? initialState.friends : null
      
      // 取三者中最长的（最新的）
      let friends = []
      if (localFriends?.length > friends.length) friends = localFriends
      if (cloudFriends?.length > friends.length) friends = cloudFriends
      if (initFriends?.length > friends.length) friends = initFriends

      // 宠物数据：优先级 — 上帝模式 > 云端 > initialState > 默认(蛋)
      // （isGod 已在上面 storageXP 处声明）
      const localHasPet = (initialState?.currentPet?.poolId && initialState?.ownedPets?.length > 0)
      const cloudHasPet = cloud?.currentPet?.poolId
      const resolvedCurrentPet = (() => {
        if (isGod) return initialState.currentPet  // 上帝模式：始终用本地（initGodModeState）
        if (cloud?.currentPet) {
          const merged = {
            ...(initialState?.currentPet || {}),
            ...cloud.currentPet,
            stats: cloud.currentPet.stats || {},
            equippedAccessories: cloud.currentPet.equippedAccessories || {},
          }
          // 🔧 安全保护：确保宠物等级至少为1，防止云端脏数据导致异常初始等级
          if (!merged.level || merged.level < 1) merged.level = 1
          return merged
        }
        // 云端没有宠物数据，但本地有 → 保留本地（防止变蛋）
        if (localHasPet) return initialState.currentPet
        // 都没有 → 蛋态
        return null
      })()

      const resolvedOwnedPets = (() => {
        if (isGod) return initialState.ownedPets || []  // 上帝模式：始终用本地全解锁列表
        if (cloud?.ownedPets?.length > 0) return cloud.ownedPets
        if (initialState?.ownedPets?.length > 0) return initialState.ownedPets
        return []
      })()

      // localStorage 是同步保存（始终最新），Supabase 是异步保存（可能滞后）
      // ★ 使用 storage.readPetState 自动处理新旧 key 迁移
      let localSnapshot = null;
      try {
        localSnapshot = storage.readPetState(currentUserId);
      } catch (_) {}

      const merged = {
        ...base,
        ...(cloud || {}),
        exp: storageXP,
        _isGodMode: isGod,  // ★ 上帝模式标志必须保留到merged state中！否则后续getEffectiveXP无法识别
        petExpConsumed: localSnapshot?.petExpConsumed ?? (cloud?.petExpConsumed || 0),
        currentPet: resolvedCurrentPet,
        ownedPets: resolvedOwnedPets,
        // 背包：localStorage 最新，防止刷新后数量回滚
        inventory: localSnapshot?.inventory
          ? { ...base.inventory, ...(cloud?.inventory || {}), ...localSnapshot.inventory }
          : { ...base.inventory, ...(cloud?.inventory || {}) },
        // 游戏道具背包
        gameInventory: localSnapshot?.gameInventory ?? (cloud?.gameInventory || base.gameInventory || {}),
        // 小屋主题
        ownedRoomThemes: localSnapshot?.ownedRoomThemes ?? (cloud?.ownedRoomThemes || base.ownedRoomThemes || []),
        currentRoomTheme: localSnapshot?.currentRoomTheme ?? (cloud?.currentRoomTheme || base.currentRoomTheme || 'default'),
        ownedFurniture: localSnapshot?.ownedFurniture ?? (cloud?.ownedFurniture || base.ownedFurniture || []),
        // ★ Bug#3 修复：gameState 必须从 localStorage 优先恢复（同 gameInventory 模式）
        // 原来只靠 ...base + ...(cloud||{})，导致本地最新扣减的 dailyAttempts 被云端旧数据/默认值覆盖
        // 刷新页面后次数重置回默认值的根本原因就在这里
        gameState: localSnapshot?.gameState ?? (cloud?.gameState || base.gameState || {}),
        dailyTasks,
        dailyLastResetDate: today,
        taskCounters: cloud?.taskCounters || base.taskCounters,
        friends,
        pendingEncouragements: cloud?.pendingEncouragements || [],
        weeklyQuestions: cloud?.weeklyQuestions || 0,
        weeklyResetDate: cloud?.weeklyResetDate || todayStr,
      };
      initializedRef.current = true;
      cloudLoadedRef.current = true;  // 云端加载成功，允许持久化 effect 推送 Supabase
      setState(merged);
      setIsInitialized(true);  // 标记云端数据已加载完成
    }).catch((err) => {
      console.warn('[MV1] 云端加载失败，使用本地状态:', err);
      // 云端失败也要标记初始化完成，否则页面永远转圈
      // ★ cloudLoadedRef 保持 false：catch 分支用的是 initialState 或空蛋态兜底，
      //    不能推送到 Supabase，防止网络故障时覆盖云端真实数据
      initializedRef.current = true;
      if (initialState) setState(initialState);
      else setState(initGamificationState());  // 兜底：用默认初始化状态
      setIsInitialized(true);
    });
  }, [currentUserId]);  // 切换账号时重新拉取云端宠物数据

  // 处理未读鼓励（进入宠物页时弹提示，自动标记已读）
  useEffect(() => {
    const pending = (state?.pendingEncouragements || []).filter(e => !e.read);
    if (pending.length > 0) {
      setState(s => ({
        ...s,
        pendingEncouragements: (s.pendingEncouragements || []).map(e => ({ ...e, read: true })),
      }));
    }
  }, [state?.pendingEncouragements?.length]);

  // 持久化（跳过初始化前的渲染，防止空好友列表覆盖云端数据）
  // ★ Fix C/D: 防止 MV1Demo 的旧状态覆盖 LeaderboardPage 写入的好友数据
  //   问题根因：LeaderboardPage 添加好友后通过 onStateChange 更新了 App.gameState，
  //   但 MV1Demo 有独立内部 state，不知道好友变化。MV1Demo 的 persist effect 定期触发，
  //   把内部 state（不含新好友）写入 Supabase → 覆盖掉 LeaderboardPage 刚写的好友！
  //   修复：persist 前从最新的 initialState（App.gameState）合并 friends 字段
  const latestFriendsRef = React.useRef(initialState?.friends || null)
  // 跟踪外部传入的 gameState 变化（LeaderboardPage 添加好友时会更新 App.gameState）
  React.useEffect(() => {
    if (initialState?.friends && Array.isArray(initialState.friends)) {
      latestFriendsRef.current = initialState.friends
    }
  }, [initialState?.friends])

  useEffect(() => {
    if (!initializedRef.current) return;
    const user = storage.getUser();
    // ★ 安全保护双重检查：
    //   1. state != null：防止 null 写入
    //   2. cloudLoadedRef.current：只有云端数据成功加载后才允许推送 Supabase，
    //      防止网络故障（catch 分支）时用兜底空蛋状态覆盖云端真实数据
    
    // ★ Fix C: 在持久化前，确保使用最新的好友列表
    //   如果外部(App.gameState)有比当前state更新的好友数据，优先用外部的
    let stateToPersist = state
    if (latestFriendsRef.current && Array.isArray(latestFriendsRef.current)) {
      const externalFriends = latestFriendsRef.current
      const internalFriends = state?.friends || []
      // 外部好友数更多 或 内部为空但外部不为空 → 用外部的
      if (externalFriends.length > internalFriends.length ||
          (externalFriends.length > 0 && internalFriends.length === 0)) {
        stateToPersist = { ...state, friends: externalFriends }
        console.log('[persist] 使用外部好友列表:', externalFriends.length, '个 (内部仅', internalFriends.length, '个)')
      }
    }

    if (user?.id && stateToPersist != null && cloudLoadedRef.current) upsertMV1State(user.id, stateToPersist);
    // ★ 关键：同时持久化到localStorage（key 含 userId，防止跨账号污染）
    try {
      const petKey = currentUserId ? `mv1_pet_state_${currentUserId}` : 'mv1_pet_state';
      if (stateToPersist != null) localStorage.setItem(petKey, JSON.stringify(stateToPersist));
    } catch(e) {}
    if (onStateChange) onStateChange(stateToPersist);
    // ★ Fix: currentUserId 必须在依赖数组中，否则切换账号后可能写入旧的 localStorage key
  }, [state, onStateChange, currentUserId]);

  // 时间衰减
  useEffect(() => {
    const iv = setInterval(() => setState(s => s ? tickPetStats(s, 5) : s), 30000);
    return () => clearInterval(iv);
  }, []);

  // ★★★ 强制经验同步系统（Fix #5 增强版：彻底解决学习后宠物经验不动的问题）★★★
  // 
  // 问题根因：
  //   1. MV1Demo组件卸载→重新挂载时，useState初始值用的gameState（可能过时）
  //   2. 初始化useEffect是异步的（fetchMV1State），在它回来前UI显示旧值
  //   3. 即使3秒interval更新了state.exp，useMemo依赖数组可能因React渲染优化而跳过
  //
  // 三层同步防御：
  //   L1: 3秒定时轮询（覆盖"停留在宠物页等待"的场景）
  //   L2: 页面可见性变化时立即刷新（覆盖"从答题页切回来"的场景）
  //   L3: totalXP用ref绕过useMemo缓存（确保每次渲染都读最新storage）
  useEffect(() => {
    // L1: 每3秒对比并同步
    const iv = setInterval(() => {
      setState(s => {
        if (!s) return s;
        // ★ 上帝模式无用户时跳过（getEffectiveXP 会返回 s.exp，无需同步）
        if (!storage.getUser()?.id && s._isGodMode) return s;
        const freshXP = getEffectiveXP(s, storage.getUser());
        if (freshXP !== s.exp && freshXP > 0) {
          return { ...s, exp: freshXP };
        }
        return s;
      });
    }, 3000);

    // L2: 用户从答题页切回宠物页时，立即触发一次强制刷新
    const onVisible = () => {
      if (!document.hidden) {
        setState(s => {
          if (!s) return s;
          // ★ 上帝模式无用户时跳过
          const user = storage.getUser();
          if (!user?.id && s._isGodMode) return s;
          const freshXP = getEffectiveXP(s, user);
          // 只要storage的值更大（说明刚答完题），就立即同步
          if (freshXP !== s.exp && freshXP > 0) {
            console.log('[MV1] 🔄 页面可见性切换，强制刷新XP:', s.exp, '→', freshXP);
            return { ...s, exp: freshXP };
            const xpDiff = freshXP - (s.exp || 0);
            return { ...s, exp: freshXP };
          }
          return s;
        });
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    // L3: 组件刚挂载也立即执行一次（不等3秒）
    // 用setTimeout(0)让它在初始化useEffect之后执行，作为兜底
    const t = setTimeout(() => {
      setState(s => {
        if (!s) return s;
        // ★ 上帝模式无用户时跳过
        const user = storage.getUser();
        if (!user?.id && s._isGodMode) return s;
        const freshXP = getEffectiveXP(s, user);
        if (freshXP !== s.exp && freshXP > 0) {
          console.log('[MV1] 🔥 挂载后兜底刷新XP:', s.exp, '→', freshXP);
          return { ...s, exp: freshXP };
        }
        return s;
      });
    }, 500);  // 给初始化useEffect留500ms先跑完

    return () => {
      clearInterval(iv);
      document.removeEventListener('visibilitychange', onVisible);
      clearTimeout(t);
    };
  }, []);

  // 宠物升级（从累计经验池消耗）
  const handlePetLevelUp = useCallback(() => {
    setState(s => {
      const pet = s.currentPet;
      const petLevel = pet?.level || 1;
      const threshold = petLevel * 100;
      // ★ 上帝模式：无限经验直接通过，不检查阈值
      if (!isGodModeState(s)) {
        const totalXP = getEffectiveXP(s, storage.getUser());
        const consumed = s.petExpConsumed || 0;
        const petExp = Math.max(0, totalXP - consumed);
        if (petExp < threshold) return s;
      }

      setLevelUpAnim(true);
      setTimeout(() => setLevelUpAnim(false), 2000);

      const newPetLevel = petLevel + 1;
      // ★ 变量声明移到条件外，避免上帝模式跳过if块后 consumed/totalXP 未定义
      const totalXP = getEffectiveXP(s, storage.getUser());
      const consumed = s.petExpConsumed || 0;
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

    // ★ 商店使用宠物可支配经验池（总经验-已消耗升级），不影响人物学习等级
    const handleShopAction = useCallback((actionId) => {
      // 特殊处理：抽卡券 → 商店购买（花500经验买1张卡券放入背包）
      if (actionId === 'card_draw') {
        setState(s => {
          // ★ 上帝模式免费获取，不检查
          if (!isGodModeState(s)) {
            const totalXP = getEffectiveXP(s, storage.getUser());
            const consumed = s.petExpConsumed || 0;
            const petSpendable = Math.max(0, totalXP - consumed);
            if (petSpendable < 500) return s;
          }

        // 购买成功：扣经验 + 加1张卡券到背包
        // ★ buyItem 直接返回 state 对象，不要解构 { state: xxx }
        const newS = buyItem(s, 'card_draw');
        if (newS === s) return s;  // buyItem 内部校验失败（不应该发生）
        return {
          ...newS,
          petExpConsumed: (s.petExpConsumed || consumed) + 500,
        };
      });
      return;
    }

    setState(s => {
      // ★ 上帝模式：petSpendable = Infinity，所有价格自动通过
      const totalXP = getEffectiveXP(s, storage.getUser());
      const consumed = s.petExpConsumed || 0;
      const petSpendable = isGodModeState(s) ? Infinity : Math.max(0, totalXP - consumed);

      if (actionId.startsWith('buy_acc_')) {
        const accId = actionId.replace('buy_acc_', '');
        const acc = ACCESSORY_SHOP.find(a => a.id === accId);
        if (!acc || acc.price > petSpendable) return s;
        const newS = buyAccessory(s, accId);
        return { ...newS, petExpConsumed: (newS.petExpConsumed || consumed) + acc.price };
      }
      if (actionId.startsWith('equip_')) return equipAccessory(s, actionId.replace('equip_', ''));
      if (actionId.startsWith('unequip_')) return unequipAccessory(s, actionId.replace('unequip_'));

      // 小屋主题购买
      if (actionId.startsWith('room_theme_')) {
        const themeId = actionId.replace('room_theme_', '');
        const theme = ROOM_THEMES.find(t => t.id === themeId);
        if (!theme || theme.price > petSpendable) return s;
        const ownedThemes = s.ownedRoomThemes || [];
        if (ownedThemes.includes(themeId)) return s; // 已拥有
        return {
          ...s,
          ownedRoomThemes: [...ownedThemes, themeId],
          currentRoomTheme: themeId,
          petExpConsumed: (s.petExpConsumed || consumed) + theme.price,
        };
      }

      // 家具购买（已拥有不可重复购买）
      if (actionId.startsWith('furniture_')) {
        const furnitureId = actionId.replace('furniture_', '');
        const item = FURNITURE_ITEMS.find(f => f.id === furnitureId);
        if (!item) return s;
        if (item.price > petSpendable) return s;
        const owned = s.ownedFurniture || [];
        if (owned.includes(furnitureId)) return s; // ★ 防止重复购买
        return {
          ...s,
          ownedFurniture: [...owned, furnitureId],
          petExpConsumed: (s.petExpConsumed || consumed) + item.price,
        };
      }

      // 游戏道具购买（extra_play / time_freeze / shield_potion）
      const gameItem = GAME_SHOP_ITEMS.find(i => i.id === actionId);
      if (gameItem) {
        if (gameItem.price > petSpendable) return s;
        const inv = s.gameInventory || {};
        if (actionId === 'extra_play') {
          // extra_play：直接增加 dailyAttempts
          return {
            ...s,
            gameInventory: inv,
            dailyAttempts: (s.dailyAttempts || 0) + 1,
            petExpConsumed: (s.petExpConsumed || consumed) + gameItem.price,
          };
        }
        // 其他消耗品：增加背包计数
        return {
          ...s,
          gameInventory: { ...inv, [actionId]: (inv[actionId] || 0) + 1 },
          petExpConsumed: (s.petExpConsumed || consumed) + gameItem.price,
        };
      }

      const item = SHOP_ITEMS.find(i => i.id === actionId);
      if (!item || item.price > petSpendable) return s;
      const newS = buyItem(s, actionId);
      return { ...newS, petExpConsumed: (newS.petExpConsumed || consumed) + item.price };
    });
  }, []);

  const handleUseItem = useCallback((itemId) => {
    // 抽卡券 → 使用背包中的卡券触发抽卡
    if (itemId === 'card_draw') {
      setState(s => {
        // ★ 上帝模式：卡券无限，不检查数量
        const currentCards = s.inventory?.cards || 0;
        if (!isGodModeState(s) && currentCards < 1) return s;

        // 直接触发抽卡（卡券本身已花钱买，使用时不再扣经验）
        const { state: newS, pet } = drawCard(s);
        if (!pet) return s;

        setGachaResult(pet);
        setShowGacha(true);

        // 消耗1张抽卡券
        return {
          ...newS,
          inventory: { ...(newS.inventory || {}), cards: currentCards - 1 },
        };
      });
      return;
    }

    // 背包中的 use_xxx → 对应的 SHOP_ITEMS id（去掉 use_ 前缀）
    const realId = itemId.startsWith('use_') ? itemId.slice(4) : itemId;

    setState(s => {
      const inv = { ...(s.inventory || {}) };
      // ★ 上帝模式：道具无限，不检查库存
      const _isGod = isGodModeState(s);
      // 检查库存并扣减
      if (realId === 'food_basic') {
        if (!_isGod && !inv.foods?.basic) return s;
        inv.foods = { ...inv.foods, basic: inv.foods.basic - 1 };
      } else if (realId === 'food_advanced') {
        if (!_isGod && !inv.foods?.advanced) return s;
        inv.foods = { ...inv.foods, advanced: inv.foods.advanced - 1 };
      } else if (realId === 'clean_basic') {
        if (!_isGod && !inv.cleanItems) return s;
        inv.cleanItems = inv.cleanItems - 1;
      } else if (realId === 'energy_drink') {
        if (!_isGod && !inv.energyItems) return s;
        inv.energyItems = inv.energyItems - 1;
      } else if (realId === 'gift_toy') {
        if (!_isGod && !inv.giftItems) return s;
        inv.giftItems = inv.giftItems - 1;
      } else {
        return s; // 未知道具
      }
      // 应用效果
      const afterEffect = useItemOnPet({ ...s, inventory: inv }, realId);
      return afterEffect;
    });
  }, [handleShopAction]);

  // 互动
  // 互动
  const handleInteract = useCallback((actionType) => {
    setState(s => {
      const inv = s.inventory || {};
      let ns = s;
      const _isGod = isGodModeState(s);
      switch (actionType) {
        case 'feed': {
          if ((inv.foods?.advanced || 0) > 0) {
            ns = useItemOnPet({ ...s, inventory: { ...inv, foods: { ...inv.foods, advanced: inv.foods.advanced - 1 } } }, 'food_advanced');
          } else if ((inv.foods?.basic || 0) > 0) {
            ns = useItemOnPet({ ...s, inventory: { ...inv, foods: { ...inv.foods, basic: inv.foods.basic - 1 } } }, 'food_basic');
          } else if (_isGod) {
            // ★ 上帝模式：无道具也允许喂食（直接加饱食度）
            ns = useItemOnPet(s, 'food_basic');
          } else return s;
          return updateTaskByType(ns, 'care', 1);
        }
        case 'clean': {
          if ((inv.cleanItems || 0) <= 0) {
            if (_isGod) ns = useItemOnPet(s, 'clean_basic'); // ★ 上帝模式无道具也允许
            else return s;
          } else ns = useItemOnPet({ ...s, inventory: { ...inv, cleanItems: inv.cleanItems - 1 } }, 'clean_basic');
        }
        case 'rest': {
          if ((inv.energyItems || 0) <= 0) {
            if (_isGod) ns = useItemOnPet(s, 'energy_drink'); // ★ 上帝模式无道具也允许
            else return s;
          } else ns = useItemOnPet({ ...s, inventory: { ...inv, energyItems: inv.energyItems - 1 } }, 'energy_drink');
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
      return { ...newS, exp: getEffectiveXP(newS, user) };
    });
  }, []);

  // 抽卡（支持动画）
  const [gachaResult, setGachaResult] = useState(null)  // 抽卡结果（供GachaAnimation用）
  const [showGacha, setShowGacha] = useState(false)     // 是否显示抽卡动画

  // ============================================================
  //  🎮 宠物动作状态机 v2（2026-04-16 重构）
  // ============================================================
  //
  // 规则优先级（从高到低）：
  //   P0 答题模式 → 强制锁定 reading，点击无反馈
  //   P1 低血量   → 任何属性 <10% → 强制锁定 sad_cry，点击无反馈
  //   P2 连续暴点 → 连续点击20次 → 显示 angry（持续3秒后恢复）
  //   P3 正常互动 → 随机播放 / 点击3次切换动作图片
  //
  // 可用动作池（排除特殊状态专用的）：
  //   happy, excited, wave, eating, normal, sleeping
  // ============================================================

  // ---- 状态变量 ----
  const [isQuizMode, setIsQuizMode] = useState(false)       // 是否在答题中
  const [clickCount, setClickCount] = useState(0)           // 连续点击计数
  const [showAngry, setShowAngry] = useState(false)          // 是否显示生气状态
  const [currentActionIndex, setCurrentActionIndex] = useState(0) // 当前正常动作索引
  // 宠物走动动画状态
  const [petWalkOffset, setPetWalkOffset] = useState(0);

  // 排除特殊状态的正常动作池
  const NORMAL_ACTIONS = ['happy', 'excited', 'wave', 'eating', 'normal', 'sleeping']

  // ---- 判断当前是否处于低血量状态 ----
  const isLowStat = useMemo(() => {
    if (!state?.currentPet?.stats) return false
    const s = state?.currentPet?.stats
    return (s.hunger ?? 100) < 10 || (s.cleanliness ?? 100) < 10 ||
           (s.energy ?? 100) < 10 || (s.intimacy ?? 50) < 10
  }, [state?.currentPet?.stats])

  // ---- 计算最终展示的pose ----
  const interactPose = useMemo(() => {
    // P0: 答题模式 → 锁定 reading
    if (isQuizMode) return 'reading'
    // P1: 低血量 → 锁定 sad_cry
    if (isLowStat) return 'sad_cry'
    // P2: 暴击生气 → 显示 angry
    if (showAngry) return 'angry'
    // P3: 正常动作循环
    return NORMAL_ACTIONS[currentActionIndex % NORMAL_ACTIONS.length]
  }, [isQuizMode, isLowStat, showAngry, currentActionIndex])

  // ---- 宠物是否被锁定（答题/低血量时禁止所有交互）----
  const isPetLocked = isQuizMode || isLowStat

  // ---- 点击处理：状态机驱动 ----
  const handlePetInteractTap = useCallback(() => {
    // 如果被锁定，什么都不做（Pet.jsx也会拦截）
    if (isPetLocked) return

    setClickCount(c => {
      const newCount = c + 1

      // 检查是否达到20次连续点击阈值
      if (newCount >= 20 && !showAngry) {
        setShowAngry(true)
        // 3秒后自动恢复
        setTimeout(() => {
          setShowAngry(false)
          setClickCount(0)  // 重置计数
        }, 3000)
        return newCount
      }

      // 每3次点击切换一次动作
      if (newCount % 3 === 0) {
        setCurrentActionIndex(i => i + 1)
      }

      return newCount
    })
  }, [isPetLocked, showAngry])

  // ---- 随机动作切换定时器（5-12秒随机间隔）----
  useEffect(() => {
    if (isPetLocked || showAngry) return  // 被锁定时不动

    const scheduleNext = () => {
      const delay = 5000 + Math.random() * 7000  // 5~12秒随机
      const timer = setTimeout(() => {
        if (!isPetLocked && !showAngry) {
          setCurrentActionIndex(i => i + Math.floor(Math.random() * 3))  // 随机跳1-3步
        }
        scheduleNext()
      }, delay)
      return timer
    }

    const timer = scheduleNext()
    return () => clearTimeout(timer)
  }, [isPetLocked, showAngry])

  // 宠物在小屋里左右踱步动画
  useEffect(() => {
    if (!isInitialized) return;
    const positions = [0, 30, -30, 15, -15, 0];
    let idx = 0;
    const timer = setInterval(() => {
      idx = (idx + 1) % positions.length;
      setPetWalkOffset(positions[idx]);
    }, 2200);
    return () => clearInterval(timer);
  }, [isInitialized]);

  const handleDrawCard = useCallback(() => {
    // state为null时（正在加载云端数据），不允许操作
    setState(s => {
      if (!s) return s;
      // 蛋态：使用免费券
      if (isEggState(s)) {
        const { state: newS, pet } = drawCard(s);
        if (!pet) return s; // 不应该发生
        setGachaResult(pet);
        setShowGacha(true);
        return newS;
      }
      
      // 正常抽卡
      // ★ 上帝模式：免费无限抽卡，跳过费用检查
      const _isGod = isGodModeState(s);
      if (!_isGod) {
        const totalXP = getEffectiveXP(s, storage.getUser());
        if (totalXP < 500 && !hasFreeCard(s)) return s;
      }
      
      const { state: newS, pet } = drawCard(s);
      if (pet && newS !== s) {
        setGachaResult(pet);
        setShowGacha(true);
        if (!_isGod && storage.getUser()?.id && !hasFreeCard(s)) {  // ★ 上帝模式不扣费
          storage.addXP(storage.getUser().id, -500);
          return { ...newS, exp: Math.max(0, getEffectiveXP(s, storage.getUser()) - 500) };
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

  // 派生数据（state为null时返回安全默认值，防止渲染崩溃）
  const currentPet = state?.currentPet;
  const petLevel = currentPet?.level || 1;
  const petThreshold = petLevel * 100;

  // ★ totalXP: 用 useRef 存最新值 + 强制刷新计数器
  //    解决useMemo"依赖不变就不重算"导致storage更新后仍显示旧值的问题
  const xpRefreshCounter = useState(0)[1];  // forceUpdate函数（不存state值）
  const latestXPRef = useRef(0);

  // 每次渲染都读storage，确保绝对最新
  // ★ 统一用 getEffectiveXP()（上帝模式自动走 state.exp）
  const _freshTotalXP = getEffectiveXP(state, storage.getUser());
  if (_freshTotalXP !== latestXPRef.current) {
    latestXPRef.current = _freshTotalXP;
  }
  // 用latestXPRef作为真实数据源，state.exp作为fallback
  const totalXP = Math.max(latestXPRef.current, state?.exp || 0);
  const lp = calcLevelProgress(totalXP);

  const petExpConsumed = state?.petExpConsumed || 0;
  const petExp = Math.max(0, totalXP - petExpConsumed); // 🔧 先定义
  const spendableXP = petExp; // 🔧 商店用宠物可支配经验（不是人物等级经验）
  const petExpPct = Math.min(100, (petExp / petThreshold) * 100);
  const canLevelUpPet = petExp >= petThreshold;

  const petStage = useMemo(() => {
    if (petLevel < 2) return '蛋';
    if (petLevel < 10) return '幼年';
    if (petLevel < 20) return '成长期';
    if (petLevel < 30) return '成熟体';
    return '完全体';
  }, [petLevel]);

  const poolInfo = (state?.petPool || PET_POOL).find(p => p.poolId === currentPet?.poolId)
    || { name: '无牙仔', emoji: '🐉', rarity: 'SR' };

  const tabs = [
    { key: 'interact', label: '🎮 互动' },
    { key: 'game', label: '⚔️ 游戏' },
    { key: 'tasks', label: '📋 任务' },
    { key: 'shop', label: '🏪 商店' },
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
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            flex: 1, padding: '9px 0', border: 'none', borderRadius: 10,
            background: activeTab === tab.key ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.85)',
            color: activeTab === tab.key ? 'white' : '#6b7280',
            fontWeight: activeTab === tab.key ? 600 : 500, fontSize: 11.5, cursor: 'pointer',
            boxShadow: activeTab === tab.key ? '0 3px 12px rgba(99,102,241,0.32)' : '0 1px 3px rgba(0,0,0,0.05)',
            position: 'relative',
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* 内容区 */}
      <div style={{ flex: 1, padding: 16, overflowY: 'auto', paddingBottom: 28, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {activeTab === 'interact' && (
          <>
            {/* 云端数据未加载完成时显示加载中（防止蛋态闪烁） */}
            {(() => {
              // 切换账号/首次登录时state=null，显示加载中而非蛋态（防止自动抽卡覆盖云端数据）
              if (!state || !isInitialized) return (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', padding: 40, gap: 12
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    border: '4px solid #e0e7ff', borderTopColor: '#6366f1',
                    animation: 'spin 0.8s linear infinite'
                  }} />
                  <span style={{ color: '#94a3b8', fontSize: 14 }}>正在连接云端...</span>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              )
              if (isEggState(state)) return (
                /* 🥚 蛋态 — 确认云端没有宠物后才显示 */
                <PetEgg 
                  onDrawCard={handleDrawCard}
                  hasTicket={hasFreeCard(state)}
                />
              )
              /* 🐱/🐉 宠物正常显示 */
              const roomTheme = ROOM_THEMES.find(t => t.id === state?.currentRoomTheme);
              const ownedFurniture = state?.ownedFurniture || [];
              const wallItems = FURNITURE_ITEMS.filter(f => f.zone === 'wall' && ownedFurniture.includes(f.id));
              const floorItems = FURNITURE_ITEMS.filter(f => f.zone === 'floor' && ownedFurniture.includes(f.id));
              return (
                <div style={{
                  background: roomTheme ? roomTheme.bg : 'linear-gradient(180deg,#eef2ff,#ede9fe)',
                  borderRadius: 16, margin: '0 12px 8px', overflow: 'hidden',
                  position: 'relative', transition: 'background 0.5s',
                  minHeight: 220,
                }}>
                  {/* 地板 */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: 32,
                    background: roomTheme ? roomTheme.floor : '#ddd6fe',
                    borderTop: `2px solid ${roomTheme ? roomTheme.accentColor : '#a78bfa'}`,
                    opacity: 0.85,
                  }} />
                  {/* 墙面家具层 */}
                  {wallItems.map(f => (
                    <span key={f.id} style={{
                      position: 'absolute', fontSize: f.fontSize,
                      lineHeight: 1, userSelect: 'none',
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))',
                      ...f.pos,
                    }}>{f.icon}</span>
                  ))}
                  {/* 地板家具层 */}
                  {floorItems.map(f => (
                    <span key={f.id} style={{
                      position: 'absolute', fontSize: f.fontSize,
                      lineHeight: 1, userSelect: 'none',
                      filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.2))',
                      ...f.pos,
                    }}>{f.icon}</span>
                  ))}
                  {/* 宠物（spriteWalkOffset 只移动精灵图，不动状态栏/按钮） */}
                  <Pet
                    type={currentPet?.poolId || 'pet_toothless'} experience={petExp} level={petLevel} onGainExp={() => {}}
                    mode="full" size={180}
                    pose={interactPose}
                    stats={currentPet?.stats}
                    equippedAccessories={currentPet?.equippedAccessories}
                    soundEnabled={state?.settings?.soundEnabled !== false}
                    onInteract={handleInteract}
                    inventory={state?.inventory}
                    onTap={handlePetInteractTap}
                    isLocked={isPetLocked}
                    spriteWalkOffset={petWalkOffset}
                    isGodMode={isGodModeState(state)}
                  />
                </div>
              )
            })()}

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


          </>
        )}

        {activeTab === 'tasks' && (
          <DailyTasksPanel state={state} onClaim={handleClaimTask} />
        )}

        {activeTab === 'game' && (
          <WordCannonGame
            state={state}
            grade={grade}
            onGameStateUpdate={(patch) => setState(s => s ? ({ ...s, ...patch }) : s)}
          />
        )}

        {activeTab === 'shop' && (
          <ShopPanel state={state} onBuy={handleShopAction} onUseItem={handleUseItem} spendableXP={spendableXP} />
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
