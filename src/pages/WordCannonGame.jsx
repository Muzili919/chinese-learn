/**
 * WordCannonGame - 单词炮台游戏
 *
 * 玩法：单词气泡从顶部落下，点击正确中文翻译消除气泡
 * 宠物稀有度决定血量和技能，等级加成属性
 * 每日次数限制，激励养成
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import wordDataPrimary from '../data/words_network.json';
import wordDataJunior from '../data/words_network_j2.json';
import { PET_POOL } from '../utils/gamification';

/* ═════════════════════ 常量定义（先于所有函数） ═════════════════════ */

// 词库按学段区分：primary=小学, j1/j2=初中
// grade 值参考 App.jsx：'primary' | 'j1' | 'j2'
const WORD_LIST_PRIMARY = Object.values(wordDataPrimary.words);
const WORD_LIST_JUNIOR  = Object.values(wordDataJunior.words);
function getWordList(grade) {
  return (grade === 'j1' || grade === 'j2') ? WORD_LIST_JUNIOR : WORD_LIST_PRIMARY;
}
const BASE_FALL_SPEED = 0.55; // px/frame (60fps)
const SPEED_INCREMENT = 0.06; // 每波加速
const BUBBLE_SPAWN_INTERVAL = 3000; // ms — 每隔3秒出一个新气泡
const SPAWN_INTERVAL_DECREASE = 150;
const MIN_SPAWN_INTERVAL = 1400;
const ANSWER_FEEDBACK_DELAY = 800; // ms — 点击后短暂反馈
const WORD_TIMEOUT = 8000; // ms — 每个单词8秒答题时间
const GAME_AREA_HEIGHT = 520;
const BUBBLE_SIZE_MIN = 52;
const BUBBLE_SIZE_MAX = 68;

// ★ 底部阈值改为动态函数（不再用固定常量）
// 注意：bubbleMovement等闭包中通过 gameAreaHeightRef.current 获取实时高度

// 称号系统
const TITLE_MAP = [
  { min: 0, title: '🎯 新兵射手', color: '#94a3b8' },
  { min: 30, title: '🔥 熟练猎手', color: '#3b82f6' },
  { min: 80, title: '⚡ 弹幕大师', color: '#a855f7' },
  { min: 150, title: '🌟 神枪手', color: '#f59e0b' },
  { min: 250, title: '💎 传奇炮王', color: '#ef4444' },
  { min: 400, title: '👑 单词之神', color: '#ec4899' },
];

// 稀有度基础属性
const RARITY_BASE_HP = { N: 3, R: 4, SR: 5, SSR: 6 };
// 技能冷却基础时间(秒)
const SKILL_BASE_COOLDOWN = { slow: 15, shield: 20, clearAll: 30 };

function getTitle(totalCleared) {
  let t = TITLE_MAP[0];
  for (const entry of TITLE_MAP) {
    if (totalCleared >= entry.min) t = entry;
  }
  return t.title;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getPetInfo(poolId) {
  return PET_POOL.find(p => p.poolId === poolId) || PET_POOL[0];
}

function getStage(level) {
  return level < 10 ? 'stage1' : level < 20 ? 'stage2' : 'stage3';
}

/* ═════════════════════ 主组件 ═════════════════════ */

export default function WordCannonGame({ state, onGameStateUpdate, grade }) {
  /* ── 引用 ── */
  const rafRef = useRef(null);
  const gameAreaRef = useRef(null);
  const bubblesRef = useRef([]);       // 当前活跃气泡 [{ id, wordKey, left, top, size, speed }]
  const optionsRef = useRef([]);        // 当前选项 [{ key, text, isCorrect }]
  const activeBubbleRef = useRef(null); // 正在答题的目标气泡ID
  const waveRef = useRef(1);
  const questionInWaveRef = useRef(0);
  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const maxComboRef = useRef(0);
  const hpRef = useRef(3);
  const totalClearedRef = useRef(0);
  const sessionClearedRef = useRef(0);
  const spawnTimerRef = useRef(null);
  const wordTimerRef = useRef(null);   // 单词8秒倒计时
  const [timeLeft, setTimeLeft] = useState(8); // 显示剩余秒数
  const timeLeftRef = useRef(8);
  const usedWordsRef = useRef(new Set());
  const shieldActiveRef = useRef(false);
  const slowModeActiveRef = useRef(false);
  const slowTimerRef = useRef(null);
  const doubleFireRef = useRef(false);

  // 技能冷却
  const skillCooldownsRef = useRef({ slow: 0, shield: 0, clearAll: 0 });
  const cooldownIntervalRef = useRef(null);
  const shakeRef = useRef(false);
  const flashRedRef = useRef(false);
  // ★ 动态游戏区域高度（替代固定GAME_AREA_HEIGHT常量）
  const gameAreaHeightRef = useRef(GAME_AREA_HEIGHT);

  /* ── 状态 ── */
  const [phase, setPhase] = useState('idle'); // idle | playing | paused | gameOver
  const phaseRef = useRef('idle'); // 同步版 phase，供 rAF 回调读取（避免 stale closure）
  const setPhaseSync = (p) => { phaseRef.current = p; setPhase(p); };
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [hp, setHp] = useState(3);
  const [wave, setWave] = useState(1);
  const [bubbles, setBubbles] = useState([]);
  const [options, setOptions] = useState([]);
  const [hasTarget, setHasTarget] = useState(false);
  const [answerFeedback, setAnswerFeedback] = useState(null); // { chosen: key, correct: bool }
  const answeringRef = useRef(false); // 防止反馈期间重复点击
  const [particles, setParticles] = useState([]); // 爆炸粒子
  const [screenShake, setScreenShake] = useState(false);
  const [flashRed, setFlashRed] = useState(false);
  const [bottomFlash, setBottomFlash] = useState(false);
  const [dailyAttempts, setDailyAttempts] = useState(5);
  const dailyAttemptsRef = useRef(5); // ★ 始终同步最新值，供 endGame 闭包读取
  const [highScore, setHighScore] = useState(0);
  const [totalBubblesCleared, setTotalBubblesCleared] = useState(0);
  const [skillCooldowns, setSkillCooldowns] = useState({ slow: 0, shield: 0, clearAll: 0 });
  const [slowMode, setSlowMode] = useState(false);
  const [shieldActive, setShieldActive] = useState(false);
  const [gameOverData, setGameOverData] = useState(null);
  const [petReady, setPetReady] = useState(false); // 宠物图加载完成

  /* ── 宠物信息计算 ── */
  const petInfo = useMemo(() => {
    const cp = state?.currentPet;
    if (!cp) return getPetInfo('pet_kitten');
    return getPetInfo(cp.poolId);
  }, [state?.currentPet?.poolId]);

  const petLevel = state?.currentPet?.level || 1;
  const rarity = petInfo.rarity || 'N';
  const spritePrefix = petInfo.spritePrefix || 'kitten';
  const stage = getStage(petLevel);

  // 计算属性加成
  const levelBonusHP = petLevel >= 30 ? 3 : petLevel >= 20 ? 2 : petLevel >= 10 ? 1 : 0;
  const levelCDReduce = petLevel >= 30 ? 0.6 : petLevel >= 20 ? 0.4 : petLevel >= 10 ? 0.2 : 0;

  const maxHp = (RARITY_BASE_HP[rarity] || 3) + levelBonusHP;

  const rarityBonusAttempts = rarity === 'SSR' ? 3 : rarity === 'SR' ? 2 : rarity === 'R' ? 1 : 0;
  const baseAttempts = petLevel < 10 ? 3 : petLevel < 20 ? 5 : 8;
  const maxDailyAttempts = baseAttempts + rarityBonusAttempts;

  // 宠物技能可用性
  const hasSlowSkill = rarity === 'R' || rarity === 'SR' || rarity === 'SSR';
  const hasShieldSkill = rarity === 'SR' || rarity === 'SSR';
  const hasClearAllSkill = rarity === 'SSR';
  const hasAnySkill = hasSlowSkill || hasShieldSkill || hasClearAllSkill;

  // 宠物图片URL
  const petImgUrl = `/pets/${spritePrefix}/${stage}/reading.png`;

  /* ── 初始化每日次数 ── */
  useEffect(() => {
    const gs = state?.gameState;
    const today = new Date().toDateString();
    // ★ Bug#3 修复：兼容两种日期字段名（_wordCannonDate / dailyGameDate）
    // 历史数据用 dailyGameDate，新版本写入 _wordCannonDate
    const savedDate = gs?._wordCannonDate || gs?.dailyGameDate || null;

    // ★ 核心逻辑：
    //   1. 有保存的 dailyAttempts 且同一天 → 直接用它（保持扣减状态）
    //   2. 有保存日期但跨天了 → 重置为满额
    //   3. 完全没有 gameState 数据（首次/未加载）→ 用默认值 maxDailyAttempts
    let attempts;

    if (gs && typeof gs.dailyAttempts === 'number') {
      // 有 gameState 数据
      if (savedDate && savedDate !== today) {
        // 跨天重置
        attempts = maxDailyAttempts;
      } else {
        // 同一天内，使用已保存的值
        attempts = gs.dailyAttempts;
      }
    } else {
      // 无 gameState 数据：给满额（新用户首次进入应该能玩）
      attempts = maxDailyAttempts;
    }

    setDailyAttempts(attempts);
    dailyAttemptsRef.current = attempts; // ★ 同步 ref
    setHighScore(gs?.wordCannonHighScore || 0);
    setTotalBubblesCleared(gs?.totalBubblesCleared || 0);
    setPetReady(true);
  // ★ Bug#3 修复：依赖必须包含 gameState + 当前宠物信息
  // 因为 maxDailyAttempts 由 petLevel + rarity 动态计算，
  // 切换宠物后需要重新评估（如低级宠玩完→换高级宠应恢复更多次数）
  }, [state?.gameState, state?.currentPet?.level, state?.currentPet?.poolId]);

  /* ── 动态测量游戏区域高度 ── */
  useEffect(() => {
    const el = gameAreaRef.current;
    if (!el) return;

    const measure = () => {
      // 找到实际的游戏区域DOM（.gameArea样式对应的div）
      const areaEl = el.querySelector('[style*="flex: 1"]') || el;
      if (areaEl?.clientHeight && areaEl.clientHeight > 150) {
        gameAreaHeightRef.current = areaEl.clientHeight;
      }
    };

    // 初始测量 + 延迟测量（等布局完成）
    measure();
    const t1 = setTimeout(measure, 100);
    const t2 = setTimeout(measure, 500);

    // ResizeObserver 实时追踪
    let ro;
    try {
      ro = new ResizeObserver(measure);
      ro.observe(el);
    } catch (_) { /* ResizeObserver not available */ }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      ro?.disconnect();
    };
  }, [state?.gameState, phase]);

  /* ── 生成题目选项 ── */
  const generateOptions = useCallback((correctWord) => {
    const wordList = getWordList(grade);
    const correctMeaning = correctWord.meaning;
    const others = wordList.filter(w => w.word !== correctWord.word);
    const shuffledOthers = shuffle(others).slice(0, 3);
    const opts = [
      { key: correctWord.word, text: correctMeaning, isCorrect: true },
      ...shuffledOthers.map(w => ({ key: w.word, text: w.meaning, isCorrect: false })),
    ];
    return shuffle(opts);
  }, [grade]);

  /* ── 启动单词倒计时（8秒） ── */
  const startWordTimer = useCallback((bubbleId) => {
    if (wordTimerRef.current) clearInterval(wordTimerRef.current);
    timeLeftRef.current = Math.round(WORD_TIMEOUT / 1000);
    setTimeLeft(timeLeftRef.current);

    wordTimerRef.current = setInterval(() => {
      timeLeftRef.current -= 1;
      setTimeLeft(timeLeftRef.current);
      if (timeLeftRef.current <= 0) {
        clearInterval(wordTimerRef.current);
        wordTimerRef.current = null;
        // 超时：移除气泡，扣血，进下一题
        if (phaseRef.current !== 'playing') return;
        if (!shieldActiveRef.current) {
          hpRef.current -= 1;
          setHp(hpRef.current);
        }
        bubblesRef.current = bubblesRef.current.filter(b => b.id !== bubbleId);
        setBubbles([...bubblesRef.current]);
        activeBubbleRef.current = null;
        answeringRef.current = false;
        setHasTarget(false);
        setOptions([]);
        setAnswerFeedback(null);
        comboRef.current = 0;
        setCombo(0);
        if (hpRef.current <= 0) { endGame(); return; }
        // 队列里还有气泡就直接激活，否则等新气泡
        if (bubblesRef.current.length > 0) activateNextBubble();
        else setTimeout(() => spawnBubble(), 400);
      }
    }, 1000);
  }, []); // eslint-disable-line

  /* ── 激活队列中第一个未答气泡为当前目标 ── */
  const activateNextBubble = useCallback(() => {
    const next = bubblesRef.current[0];
    if (!next) return;
    activeBubbleRef.current = next.id;
    const wordList = getWordList(grade);
    const wordObj = wordList.find(w => w.word === next.wordKey) || { word: next.wordKey, meaning: next.wordKey };
    optionsRef.current = generateOptions(wordObj);
    setOptions(optionsRef.current);
    setHasTarget(true);
    startWordTimer(next.id);
  }, [generateOptions, grade, startWordTimer]);

  /* ── 生成新气泡（只负责把气泡加入队列） ── */
  const spawnBubble = useCallback(() => {
    const wordList = getWordList(grade);
    let available = wordList.filter(w => !usedWordsRef.current.has(w.word));
    if (available.length < 4) {
      usedWordsRef.current.clear();
      available = wordList;
    }
    const chosen = available[Math.floor(Math.random() * available.length)];
    usedWordsRef.current.add(chosen.word);

    const size = BUBBLE_SIZE_MIN + Math.random() * (BUBBLE_SIZE_MAX - BUBBLE_SIZE_MIN);
    const areaWidth = gameAreaRef.current?.clientWidth || 340;
    const left = 10 + Math.random() * (areaWidth - size - 20);
    const currentSpeed = BASE_FALL_SPEED + (waveRef.current - 1) * SPEED_INCREMENT;
    const speedMult = slowModeActiveRef.current ? 0.45 : 1;

    const bubble = {
      id: Date.now() + Math.random(),
      wordKey: chosen.word,
      displayWord: chosen.word,
      left,
      top: -size,
      size,
      speed: currentSpeed * speedMult,
    };

    bubblesRef.current.push(bubble);
    setBubbles([...bubblesRef.current]);

    // 如果当前没有活跃题目，立刻激活这个
    if (!activeBubbleRef.current && !answeringRef.current) {
      activeBubbleRef.current = bubble.id;
      optionsRef.current = generateOptions(chosen);
      setOptions(optionsRef.current);
      setHasTarget(true);
      startWordTimer(bubble.id);
    }

    questionInWaveRef.current += 1;
  }, [generateOptions, grade, startWordTimer]);

  /* ── 游戏主循环 ── */
  const gameLoop = useCallback(() => {
    if (phaseRef.current !== 'playing') return;

    const slowMult = slowModeActiveRef.current ? 0.45 : 1;
    let needUpdate = false;
    let hitBottom = null;

    const updated = [];
    for (const b of bubblesRef.current) {
      const newTop = b.top + b.speed * slowMult;
      if (newTop > (gameAreaHeightRef.current - 60)) {
        // 落底
        hitBottom = b.id;
      } else {
        updated.push({ ...b, top: newTop });
        needUpdate = true;
      }
    }

    if (hitBottom) {
      // 移除落底气泡
      bubblesRef.current = updated;
      setBubbles([...updated]);
      needUpdate = true;

      // 扣血
      if (!shieldActiveRef.current) {
        hpRef.current -= 1;
        setHp(hpRef.current);
        setBottomFlash(true);
        setTimeout(() => setBottomFlash(false), 400);
      } else {
        shieldActiveRef.current = false;
        setShieldActive(false);
      }

      // 重置连击
      comboRef.current = 0;
      setCombo(0);
      activeBubbleRef.current = null;
      setHasTarget(false);
      setOptions([]);

      if (hpRef.current <= 0) {
        endGame();
        return;
      }

      // 生成下一题
      setTimeout(() => spawnBubble(), 600);
    } else if (needUpdate) {
      bubblesRef.current = updated;
      setBubbles([...updated]);
    }

    rafRef.current = requestAnimationFrame(gameLoop);
  }, [spawnBubble]);

  /* ── 创建爆炸粒子 ── */
  const createParticles = useCallback((x, y, color) => {
    const newParticles = [];
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 / 12) * i;
      const dist = 25 + Math.random() * 35;
      newParticles.push({
        id: `p${Date.now()}-${i}`,
        x: x + Math.cos(angle) * dist * 0.3,
        y: y + Math.sin(angle) * dist * 0.3,
        dx: Math.cos(angle) * (2 + Math.random() * 3),
        dy: Math.sin(angle) * (2 + Math.random() * 3),
        color,
        life: 1,
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
    setTimeout(() => {
      setParticles(prev => prev.filter(p =>
        !newParticles.some(np => np.id === p.id)
      ));
    }, 700);
  }, []);

  /* ── 处理答案选择 ── */
  const handleAnswer = useCallback((opt) => {
    if (phaseRef.current !== 'playing' || !activeBubbleRef.current) return;
    if (answeringRef.current) return; // 反馈期间锁定
    answeringRef.current = true;

    const targetId = activeBubbleRef.current;
    const targetBubble = bubblesRef.current.find(b => b.id === targetId);
    if (!targetBubble) { answeringRef.current = false; return; }

    // 显示反馈（高亮选项）
    setAnswerFeedback({ chosen: opt.key, correct: opt.isCorrect });

    if (opt.isCorrect) {
      // ✅ 正确
      comboRef.current += 1;
      maxComboRef.current = Math.max(maxComboRef.current, comboRef.current);

      let points = 10;
      if (comboRef.current >= 5) points = 20;
      else if (comboRef.current >= 3) points = 15;

      scoreRef.current += points;
      totalClearedRef.current += 1;
      sessionClearedRef.current += 1;
      setScore(scoreRef.current);
      setCombo(comboRef.current);

      // 爆炸效果
      createParticles(
        targetBubble.left + targetBubble.size / 2,
        Math.min(targetBubble.top + targetBubble.size / 2, gameAreaHeightRef.current - 40),
        '#22c55e'
      );

      // 双发模式：再消一个
      if (doubleFireRef.current && bubblesRef.current.length > 1) {
        doubleFireRef.current = false;
        const extraBubble = bubblesRef.current.find(b => b.id !== targetId);
        if (extraBubble) {
          scoreRef.current += points;
          totalClearedRef.current += 1;
          sessionClearedRef.current += 1;
          setScore(scoreRef.current);
          createParticles(
            extraBubble.left + extraBubble.size / 2,
            Math.min(extraBubble.top + extraBubble.size / 2, gameAreaHeightRef.current - 40),
            '#3b82f6'
          );
          bubblesRef.current = bubblesRef.current.filter(b => b.id !== extraBubble.id);
        }
      }

      // 移除目标气泡
      bubblesRef.current = bubblesRef.current.filter(b => b.id !== targetId);
      setBubbles([...bubblesRef.current]);

      // 波次检查
      if (questionInWaveRef.current >= 10) {
        waveRef.current += 1;
        questionInWaveRef.current = 0;
        setWave(waveRef.current);
      }

      // 停止倒计时，反馈后激活下一个（或等新气泡）
      if (wordTimerRef.current) { clearInterval(wordTimerRef.current); wordTimerRef.current = null; }
      setTimeout(() => {
        activeBubbleRef.current = null;
        setHasTarget(false);
        setOptions([]);
        setAnswerFeedback(null);
        answeringRef.current = false;
        if (bubblesRef.current.length > 0) activateNextBubble();
        else spawnBubble();
      }, ANSWER_FEEDBACK_DELAY);

    } else {
      // ❌ 错误
      if (!shieldActiveRef.current) {
        hpRef.current -= 1;
        setHp(hpRef.current);
      } else {
        shieldActiveRef.current = false;
        setShieldActive(false);
      }

      comboRef.current = 0;
      setCombo(0);

      // 错误特效
      setFlashRed(true);
      setScreenShake(true);
      setTimeout(() => { setFlashRed(false); setScreenShake(false); }, 350);

      if (hpRef.current <= 0) {
        setAnswerFeedback(null);
        answeringRef.current = false;
        endGame();
        return;
      }

      // 答错：移除气泡，激活下一个（或等新气泡）
      if (wordTimerRef.current) { clearInterval(wordTimerRef.current); wordTimerRef.current = null; }
      bubblesRef.current = bubblesRef.current.filter(b => b.id !== targetId);
      setBubbles([...bubblesRef.current]);

      setTimeout(() => {
        activeBubbleRef.current = null;
        setHasTarget(false);
        setOptions([]);
        setAnswerFeedback(null);
        answeringRef.current = false;
        if (bubblesRef.current.length > 0) activateNextBubble();
        else spawnBubble();
      }, ANSWER_FEEDBACK_DELAY);
    }
  }, [spawnBubble, activateNextBubble, createParticles]);

  /* ── 结束游戏 ── */
  const endGame = useCallback(() => {
    setPhaseSync('gameOver');

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
    if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
    if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    if (wordTimerRef.current) { clearInterval(wordTimerRef.current); wordTimerRef.current = null; }

    const finalScore = scoreRef.current;
    const cleared = totalClearedRef.current;
    const prevHigh = highScore;
    const newHigh = Math.max(finalScore, prevHigh);
    const newTotalCleared = totalBubblesCleared + sessionClearedRef.current;
    // ★ Bug#3 修复：remaining 直接取当前 dailyAttempts（已在 startGame 时扣减过，不再重复扣）
    const remaining = dailyAttempts;
    const title = getTitle(newTotalCleared);

    setGameOverData({
      score: finalScore,
      highScore: newHigh,
      isNewRecord: finalScore > prevHigh,
      cleared: sessionClearedRef.current,
      totalCleared: newTotalCleared,
      maxCombo: maxComboRef.current,
      title,
      remaining,
    });

    // 回调更新状态（用 onGameStateUpdate 函数式写法，避免旧闭包覆盖 dailyAttempts）
    if (onGameStateUpdate) {
      onGameStateUpdate({
        gameState: {
          // ★ 不依赖闭包里可能已过期的 state.gameState，改用函数式更新
          // 通过 dailyAttemptsRef.current 读取最新次数，防止 endGame 旧闭包把已扣的次数覆盖回去
          _wordCannonDate: new Date().toDateString(),
          dailyAttempts: dailyAttemptsRef.current,
          wordCannonHighScore: newHigh,
          totalBubblesCleared: newTotalCleared,
        },
        _gameStatePartial: true, // 标记：父组件需用 merge 而非覆盖
      });
    }
  }, [highScore, totalBubblesCleared, onGameStateUpdate]);

  /* ── 开始游戏 ── */
  const startGame = useCallback(() => {
    // ★ Bug#3 修复：次数检查 — 没有剩余次数则拒绝开始
    // ★ 上帝模式：无限次数，跳过检查
    if (dailyAttempts <= 0 && !state?._isGodMode) return;

    // ★ Bug#3 修复：开始时立即扣减一次次数（而非等到结束时才扣）
    // 这样即使中途刷新/崩溃，次数也已消耗
    // ★ 上帝模式：不扣减次数
    const newAttempts = state?._isGodMode ? dailyAttempts : (dailyAttempts - 1);
    setDailyAttempts(newAttempts);
    dailyAttemptsRef.current = Math.max(0, newAttempts); // ★ 立即同步 ref
    if (onGameStateUpdate) {
      onGameStateUpdate({
        gameState: {
          ...(state.gameState || {}),
          _wordCannonDate: new Date().toDateString(),
          dailyAttempts: Math.max(0, newAttempts),
        },
      });
    }

    // 重置所有状态
    bubblesRef.current = [];
    optionsRef.current = [];
    activeBubbleRef.current = null;
    waveRef.current = 1;
    questionInWaveRef.current = 0;
    scoreRef.current = 0;
    comboRef.current = 0;
    maxComboRef.current = 0;
    hpRef.current = maxHp;
    totalClearedRef.current = totalBubblesCleared;
    sessionClearedRef.current = 0;
    usedWordsRef.current.clear();
    shieldActiveRef.current = false;
    slowModeActiveRef.current = false;
    doubleFireRef.current = false;
    skillCooldownsRef.current = { slow: 0, shield: 0, clearAll: 0 };
    shakeRef.current = false;
    flashRedRef.current = false;

    setScore(0);
    setCombo(0);
    setHp(maxHp);
    setWave(1);
    setBubbles([]);
    setOptions([]);
    setHasTarget(false);
    setAnswerFeedback(null);
    answeringRef.current = false;
    setParticles([]);
    setScreenShake(false);
    setFlashRed(false);
    setBottomFlash(false);
    setSkillCooldowns({ slow: 0, shield: 0, clearAll: 0 });
    setSlowMode(false);
    setShieldActive(false);
    setGameOverData(null);
    setPhaseSync('playing');

    // 启动冷却倒计时
    cooldownIntervalRef.current = setInterval(() => {
      const cd = skillCooldownsRef.current;
      let changed = false;
      for (const k of ['slow', 'shield', 'clearAll']) {
        if (cd[k] > 0) { cd[k] -= 1; changed = true; }
      }
      if (changed) {
        setSkillCooldowns({ ...cd });
      }
    }, 1000);

    // 立刻出第一个
    setTimeout(() => spawnBubble(), 300);

    // 定时持续出气泡（制造紧迫感）
    const spawnInterval = Math.max(MIN_SPAWN_INTERVAL, BUBBLE_SPAWN_INTERVAL - (waveRef.current - 1) * SPAWN_INTERVAL_DECREASE);
    spawnTimerRef.current = setInterval(() => {
      if (phaseRef.current === 'playing' && bubblesRef.current.length < 6) {
        spawnBubble();
      }
    }, spawnInterval);

    // 启动游戏循环
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [dailyAttempts, maxHp, totalBubblesCleared, spawnBubble, gameLoop, onGameStateUpdate, state?.gameState]);

  /* ── 技能：时间减速 ── */
  const useSlowSkill = useCallback(() => {
    if (skillCooldownsRef.current.slow > 0) return;
    slowModeActiveRef.current = true;
    setSlowMode(true);
    const baseCd = SKILL_BASE_COOLDOWN.slow;
    skillCooldownsRef.current.slow = Math.ceil(baseCd * (1 - levelCDReduce));
    setSkillCooldowns({ ...skillCooldownsRef.current });

    slowTimerRef.current = setTimeout(() => {
      slowModeActiveRef.current = false;
      setSlowMode(false);
    }, 5000);
  }, [levelCDReduce]);

  /* ── 技能：护盾 ── */
  const useShieldSkill = useCallback(() => {
    if (skillCooldownsRef.current.shield > 0) return;
    shieldActiveRef.current = true;
    setShieldActive(true);
    const baseCd = SKILL_BASE_COOLDOWN.shield;
    skillCooldownsRef.current.shield = Math.ceil(baseCd * (1 - levelCDReduce));
    setSkillCooldowns({ ...skillCooldownsRef.current });
  }, [levelCDReduce]);

  /* ── 技能：清屏大招 ── */
  const useClearAllSkill = useCallback(() => {
    if (skillCooldownsRef.current.clearAll > 0) return;
    const baseCd = SKILL_BASE_COOLDOWN.clearAll;
    skillCooldownsRef.current.clearAll = Math.ceil(baseCd * (1 - levelCDReduce));
    setSkillCooldowns({ ...skillCooldownsRef.current });

    // 清除所有气泡并加分
    for (const b of bubblesRef.current) {
      createParticles(b.left + b.size / 2, Math.min(b.top + b.size / 2, gameAreaHeightRef.current - 40), '#f59e0b');
      scoreRef.current += 5;
      totalClearedRef.current += 1;
      sessionClearedRef.current += 1;
    }
    scoreRef.current = scoreRef.current; // trigger re-render via ref pattern

    // 屏幕震动
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 500);

    bubblesRef.current = [];
    setBubbles([]);
    activeBubbleRef.current = null;
    setHasTarget(false);
    setOptions([]);
    setScore(scoreRef.current);

    setTimeout(() => spawnBubble(), 800);
  }, [levelCDReduce, spawnBubble, createParticles]);

  /* ── 清理 ── */
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
      if (cooldownIntervalRef.current) clearInterval(cooldownIntervalRef.current);
      if (slowTimerRef.current) clearTimeout(slowTimerRef.current);
    };
  }, []);

  /* ═════════════════════ 渲染 ═════════════════════ */

  // 待机/结束界面
  if (phase === 'idle' || phase === 'gameOver') {
    const canPlay = dailyAttempts > 0;
    return (
      <div style={styles.container}>
        {/* 星空背景 */}
        <div style={styles.starsBg} />

        <div style={styles.centerContent}>
          {/* 标题 */}
          <h2 style={styles.title}>⚔️ 单词炮台</h2>
          <p style={styles.subtitle}>
            消灭下落的单词气泡！
          </p>

          {/* 统计卡片 */}
          <div style={styles.statCard}>
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 28 }}>🏆</span>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#fbbf24', marginTop: 4 }}>
                {highScore}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>最高分</div>
            </div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <div style={styles.statItem}>
                <span style={{ fontSize: 18 }}>💫</span>
                <div style={styles.statNum}>{totalBubblesCleared}</div>
                <div style={styles.statLabel}>总消灭</div>
              </div>
              <div style={styles.statItem}>
                <span style={{ fontSize: 18 }}>📅</span>
                <div style={styles.statNum}>{dailyAttempts}</div>
                <div style={styles.statLabel}>剩余次数</div>
              </div>
              <div style={styles.statItem}>
                <span style={{ fontSize: 18 }}>❤️</span>
                <div style={styles.statNum}>{maxHp}</div>
                <div style={styles.statLabel}>最大血量</div>
              </div>
            </div>

            {totalBubblesCleared > 0 && (
              <div style={{
                marginTop: 10, padding: '6px 14px',
                background: 'rgba(255,255,255,0.08)', borderRadius: 16,
                display: 'inline-block', marginLeft: '50%', transform: 'translateX(-50%)',
              }}>
                <span style={{ fontSize: 13, color: '#c084fc' }}>
                  🎖️ 当前称号：{getTitle(totalBubblesCleared)}
                </span>
              </div>
            )}
          </div>

          {/* 游戏结束数据 */}
          {gameOverData && (
            <div style={styles.resultCard}>
              <h3 style={{ margin: '0 0 10px', color: '#fff', fontSize: 18 }}>
                🎯 本局成绩
              </h3>
              <div style={styles.resultRow}>
                <span>得分</span><strong style={{ color: '#fbbf24', fontSize: 22 }}>{gameOverData.score}</strong>
              </div>
              <div style={styles.resultRow}>
                <span>消灭</span><strong>{gameOverData.cleared}个</strong>
              </div>
              <div style={styles.resultRow}>
                <span>最高连击</span><strong style={{ color: '#f97316' }}>x{gameOverData.maxCombo}</strong>
              </div>
              {gameOverData.isNewRecord && (
                <div style={{
                  color: '#fbbf24', fontSize: 14, marginTop: 6,
                  animation: 'pulse 1s infinite',
                }}>
                  🎉 打破最高记录！
                </div>
              )}
              <div style={{
                marginTop: 10, padding: '6px 14px',
                background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(236,72,153,0.2))',
                borderRadius: 16, display: 'inline-block', marginLeft: '50%',
                transform: 'translateX(-50%)',
              }}>
                <span style={{ fontSize: 13, color: '#e879f9' }}>
                  获得称号：{gameOverData.title}
                </span>
              </div>
            </div>
          )}

          {/* 开始按钮 */}
          {canPlay ? (
            <button onClick={startGame} style={styles.startBtn}>
              🚀 开始战斗！
            </button>
          ) : (
            <button disabled style={styles.startBtnDisabled}>
              🔒 明日再来（{maxDailyAttempts}次/日）
            </button>
          )}

          {/* 宠物信息 */}
          <div style={{ marginTop: 18, textAlign: 'center' }}>
            {petReady && (
              <img
                src={petImgUrl}
                alt={petInfo.name}
                style={{
                  width: 70, height: 70, objectFit: 'contain',
                  filter: 'drop-shadow(0 0 12px rgba(168,85,247,0.5))',
                  marginBottom: 6,
                }}
              />
            )}
            <div style={{ fontSize: 13, color: '#a5b4fc' }}>
              {petInfo.emoji} {petInfo.name} · {rarity} · Lv.{petLevel}
            </div>
            {hasAnySkill && (
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                {hasSlowSkill && '⏱️减速 '}
                {hasShieldSkill && '🛡️护盾 '}
                {hasClearAllSkill && '💥清屏'}
              </div>
            )}
            {!hasAnySkill && (
              <div style={{ fontSize: 10, color: '#475569', marginTop: 4, background: 'rgba(255,255,255,0.05)', padding: '3px 8px', borderRadius: 8 }}>
                🎁 R级以上宠物解锁技能
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ═════════════════════ 游戏中界面 ═════════════════════ */
  return (
    <div style={styles.container} ref={gameAreaRef}>
      {/* 星空背景 */}
      <div style={styles.starsBg} />

      {/* 红色闪屏 */}
      {flashRed && <div style={styles.flashOverlay} />}

      {/* 底部红线闪烁（落底警告） */}
      {bottomFlash && <div style={styles.bottomWarning} />}

      {/* 顶部信息栏 */}
      <div style={styles.infoBar}>
        <div style={styles.infoItem}>
          <span style={styles.infoLabel}>分数</span>
          <strong style={{ color: '#fbbf24' }}>{score}</strong>
        </div>
        <div style={styles.infoItem}>
          <span style={styles.infoLabel}>连击</span>
          <strong style={{
            color: combo >= 5 ? '#ef4444' : combo >= 3 ? '#f97316' : '#fff',
            fontSize: combo >= 3 ? 18 : 15,
          }}>
            ×{combo}
          </strong>
        </div>
        <div style={styles.infoItem}>
          <span style={styles.infoLabel}>血量</span>
          <strong style={{ color: hp <= 1 ? '#ef4444' : '#ff6b9d' }}>
            {'❤️'.repeat(Math.max(0, hp))}
          </strong>
        </div>
        <div style={styles.infoItem}>
          <span style={styles.infoLabel}>波次</span>
          <strong>{wave}</strong>
        </div>
      </div>

      {/* 8秒倒计时进度条 */}
      {hasTarget && (
        <div style={{ padding: '0 12px 4px', position: 'relative' }}>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 2,
              width: `${(timeLeft / 8) * 100}%`,
              background: timeLeft <= 3 ? '#ef4444' : timeLeft <= 5 ? '#f97316' : '#22c55e',
              transition: 'width 0.9s linear, background 0.3s',
            }} />
          </div>
          <span style={{ position: 'absolute', right: 14, top: -1, fontSize: 10, color: timeLeft <= 3 ? '#ef4444' : '#94a3b8' }}>
            {timeLeft}s
          </span>
        </div>
      )}

      {/* 减速模式指示器 */}
      {slowMode && (
        <div style={styles.slowIndicator}>
          ⏱️ 时间减速中...
        </div>
      )}

      {/* 护盾指示器 */}
      {shieldActive && (
        <div style={getShieldIndicator(slowMode)}>
          🛡️ 护盾激活
        </div>
      )}

      {/* 游戏区域 */}
      <div
        style={{
          ...styles.gameArea,
          transform: screenShake ? 'translateX(4px)' : 'translateX(0)',
          transition: screenShake ? 'none' : 'transform 0.05s',
        }}
      >
        {/* 气泡们 */}
        {bubbles.map(b => (
          <div
            key={b.id}
            style={{
              ...styles.bubble,
              width: b.size,
              height: b.size,
              left: b.left,
              top: b.top,
              fontSize: Math.max(11, b.size * 0.28),
              boxShadow: b.id === activeBubbleRef.current
                ? `0 0 18px 4px rgba(251,191,36,0.7), 0 0 30px rgba(251,191,36,0.3)`
                : styles.bubble.boxShadow,
              border: b.id === activeBubbleRef.current
                ? '2px solid #fbbf24'
                : styles.bubble.border,
              zIndex: b.id === activeBubbleRef.current ? 10 : 1,
            }}
          >
            {b.displayWord}
          </div>
        ))}

        {/* 粒子效果 */}
        {particles.map(p => (
          <div
            key={p.id}
            style={{
              position: 'absolute',
              left: p.x,
              top: p.y,
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: p.color,
              pointerEvents: 'none',
              opacity: p.life,
              transition: 'all 0.7s ease-out',
              transform: `translate(${p.dx * 20}px, ${p.dy * 20}px)`,
            }}
          />
        ))}
      </div>

      {/* 选项按钮区 */}
      <div style={styles.optionsArea}>
        {options.length > 0 ? (
          options.map(opt => {
            // 反馈阶段：给已选项和正确项上色
            let feedback = null;
            if (answerFeedback) {
              if (opt.isCorrect) feedback = 'correct';
              else if (opt.key === answerFeedback.chosen && !opt.isCorrect) feedback = 'wrong';
            }
            return (
              <button
                key={opt.key}
                onClick={() => handleAnswer(opt)}
                disabled={!!answerFeedback}
                style={{
                  ...styles.optionBtn,
                  ...(feedback === 'correct' ? {
                    background: 'linear-gradient(135deg,#16a34a,#22c55e)',
                    color: '#fff', borderColor: '#16a34a',
                    transform: 'scale(1.04)',
                  } : feedback === 'wrong' ? {
                    background: 'linear-gradient(135deg,#dc2626,#ef4444)',
                    color: '#fff', borderColor: '#dc2626',
                  } : {}),
                }}
              >
                {feedback === 'correct' ? `✓ ${opt.text}` : feedback === 'wrong' ? `✗ ${opt.text}` : opt.text}
              </button>
            );
          })
        ) : (
          <div style={{ color: '#64748b', fontSize: 13, height: 44, lineHeight: '44px' }}>
            选择正确翻译...
          </div>
        )}
      </div>

      {/* 技能按钮栏 */}
      {hasAnySkill && phase === 'playing' && (
        <div style={styles.skillBar}>
          {hasSlowSkill && (
            <button
              onClick={useSlowSkill}
              disabled={skillCooldowns.slow > 0}
              style={{
                ...(skillCooldowns.slow > 0 ? styles.skillBtnDisabled : styles.skillBtnSlow),
                opacity: skillCooldowns.slow > 0 ? 0.5 : 1,
              }}
            >
              {skillCooldowns.slow > 0 ? `⏱️ ${skillCooldowns.slow}s` : '⏱️ 减速'}
            </button>
          )}

          {(rarity === 'SR' || rarity === 'SSR') && (
            <button
              onClick={useShieldSkill}
              disabled={skillCooldowns.shield > 0}
              style={{
                ...(skillCooldowns.shield > 0 ? styles.skillBtnDisabled : styles.skillBtnShield),
                opacity: skillCooldowns.shield > 0 ? 0.5 : 1,
              }}
            >
              {skillCooldowns.shield > 0 ? `🛡️ ${skillCooldowns.shield}s` : '🛡️ 护盾'}
            </button>
          )}

          {rarity === 'SSR' && (
            <button
              onClick={useClearAllSkill}
              disabled={skillCooldowns.clearAll > 0}
              style={{
                ...(skillCooldowns.clearAll > 0 ? styles.skillBtnDisabled : styles.skillBtnUlt),
                opacity: skillCooldowns.clearAll > 0 ? 0.5 : 1,
              }}
            >
              {skillCooldowns.clearAll > 0 ? `💥 ${skillCooldowns.clearAll}s` : '💥 清屏'}
            </button>
          )}
        </div>
      )}

      {/* 宠物（炮台角色） */}
      <div style={styles.petContainer}>
        <div style={styles.petGlow} />
        {petReady && (
          <img
            src={petImgUrl}
            alt={petInfo.name}
            style={styles.petImage}
          />
        )}
      </div>
    </div>
  );
}

/* ═════════════════════ 样式常量（避免每次渲染重建） ═════════════════════ */

const container = {
  position: 'relative',
  width: '100%',
  maxWidth: 420,
  margin: '0 auto',
  // ★ 填满父容器（父容器 flex:1 撑满剩余高度），不再用 100dvh（会超出 tab 内容区）
  flex: '1 1 0',
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
  background: 'linear-gradient(180deg, #0f0c29 0%, #1a1a3e 35%, #24243e 70%, #302b63 100%)',
  borderRadius: 0,
  overflow: 'hidden',
};

const starsBg = {
  position: 'absolute',
  inset: 0,
  backgroundImage: `
    radial-gradient(1px 1px at 10% 10%, white 100%, transparent),
    radial-gradient(1px 1px at 20% 50%, rgba(255,255,255,0.8) 100%, transparent),
    radial-gradient(1.5px 1.5px at 30% 20%, white 100%, transparent),
    radial-gradient(1px 1px at 40% 60%, rgba(255,255,255,0.6) 100%, transparent),
    radial-gradient(1.5px 1.5px at 55% 15%, white 100%, transparent),
    radial-gradient(1px 1px at 65% 45%, rgba(255,255,255,0.7) 100%, transparent),
    radial-gradient(1px 1px at 75% 75%, rgba(255,255,255,0.5) 100%, transparent),
    radial-gradient(1.5px 1.5px at 85% 30%, white 100%, transparent),
    radial-gradient(1px 1px at 90% 65%, rgba(255,255,255,0.6) 100%, transparent),
    radial-gradient(1px 1px at 95% 40%, white 100%, transparent)
  `,
  backgroundSize: '100% 100%',
  pointerEvents: 'none',
  zIndex: 0,
};

const infoBar = {
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
  padding: '8px 12px',
  background: 'rgba(0,0,0,0.35)',
  backdropFilter: 'blur(8px)',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
  zIndex: 10,
  position: 'relative',
  flexShrink: 0,
};

const infoItem = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 1,
};

const infoLabel = {
  fontSize: 10,
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: 1,
};

const gameArea = {
  position: 'relative',
  width: '100%',
  // ★ 改为flex填充剩余空间（不再固定520px）
  flex: '1 1 0',
  minHeight: 200, // 最小高度保证游戏可玩性
  overflow: 'hidden',
  zIndex: 1,
};

const bubble = {
  position: 'absolute',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, rgba(99,102,241,0.75), rgba(139,92,246,0.6))',
  border: '1.5px solid rgba(167,139,250,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  fontFamily: "'Segoe UI','PingFang SC',sans-serif",
  fontWeight: 600,
  cursor: 'default',
  userSelect: 'none',
  boxShadow: '0 0 12px rgba(139,92,246,0.4), inset 0 0 8px rgba(255,255,255,0.1)',
  textShadow: '0 1px 3px rgba(0,0,0,0.5)',
  transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
};

const optionsArea = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 8,
  padding: '10px 12px',
  background: 'rgba(0,0,0,0.3)',
  borderTop: '1px solid rgba(255,255,255,0.04)',
  zIndex: 10,
  position: 'relative',
  flexShrink: 0,
};

const optionBtn = {
  height: 48,
  minWidth: 44,
  borderRadius: 12,
  border: '1.5px solid rgba(167,139,250,0.3)',
  background: 'linear-gradient(135deg, rgba(30,27,75,0.9), rgba(45,35,90,0.85))',
  color: '#e0d4fc',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
  transition: 'all 0.15s ease',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  padding: '4px 8px',
  lineHeight: 1.3,
  ':hover': {
    background: 'linear-gradient(135deg, rgba(59,36,116,0.95), rgba(79,56,140,0.9))',
    borderColor: 'rgba(167,139,250,0.6)',
    transform: 'scale(1.03)',
  },
  ':active': {
    transform: 'scale(0.96)',
  },
};

const skillBar = {
  display: 'flex',
  gap: 8,
  justifyContent: 'center',
  padding: '8px 12px',
  background: 'rgba(0,0,0,0.2)',
  borderTop: '1px solid rgba(255,255,255,0.03)',
  zIndex: 10,
  position: 'relative',
  flexShrink: 0,
};

const skillBtnSlow = {
  padding: '6px 14px',
  borderRadius: 10,
  border: '1px solid rgba(59,130,246,0.5)',
  background: 'linear-gradient(135deg, rgba(29,78,216,0.7), rgba(37,99,235,0.5))',
  color: '#93c5fd',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s',
};

const skillBtnShield = {
  padding: '6px 14px',
  borderRadius: 10,
  border: '1px solid rgba(34,197,94,0.5)',
  background: 'linear-gradient(135deg, rgba(21,128,61,0.7), rgba(22,163,74,0.5))',
  color: '#86efac',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.15s',
};

const skillBtnUlt = {
  padding: '6px 14px',
  borderRadius: 10,
  border: '1px solid rgba(245,158,11,0.6)',
  background: 'linear-gradient(135deg, rgba(180,83,9,0.8), rgba(217,119,6,0.6))',
  color: '#fcd34d',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'all 0.15s',
  animation: 'glowPulse 2s infinite',
};

const skillBtnDisabled = {
  padding: '6px 14px',
  borderRadius: 10,
  border: '1px solid rgba(100,116,139,0.3)',
  background: 'rgba(51,65,85,0.5)',
  color: '#64748b',
  fontSize: 12,
  cursor: 'not-allowed',
};

const petContainer = {
  position: 'relative',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-end',
  paddingBottom: 8,
  paddingTop: 4,
  zIndex: 5,
  height: 84,
  background: 'linear-gradient(180deg, transparent 0%, rgba(15,12,41,0.6) 100%)',
  flexShrink: 0,
};

const petGlow = {
  position: 'absolute',
  bottom: 4,
  width: 90,
  height: 20,
  borderRadius: '50%',
  background: 'radial-gradient(ellipse, rgba(168,85,247,0.35) 0%, transparent 70%)',
  filter: 'blur(4px)',
};

const petImage = {
  width: 76,
  height: 76,
  objectFit: 'contain',
  position: 'relative',
  zIndex: 2,
  filter: 'drop-shadow(0 0 14px rgba(168,85,247,0.45)) drop-shadow(0 0 28px rgba(139,92,246,0.2))',
};

// 待机界面样式
const centerContent = {
  position: 'relative',
  zIndex: 5,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px 20px',
  // ★ 首页也用flex填满容器，不再固定minHeight
  flex: '1 1 0',
  overflowY: 'auto',
};

const title = {
  fontSize: 26,
  fontWeight: 'bold',
  color: '#fff',
  margin: '0 0 6px',
  textShadow: '0 0 20px rgba(168,85,247,0.6), 0 2px 8px rgba(0,0,0,0.5)',
};

const subtitle = {
  fontSize: 14,
  color: '#a5b4fc',
  margin: '0 0 24px',
};

const statCard = {
  width: '100%',
  maxWidth: 300,
  background: 'rgba(15,12,41,0.7)',
  border: '1px solid rgba(167,139,250,0.15)',
  borderRadius: 16,
  padding: '18px 16px',
  marginBottom: 20,
  backdropFilter: 'blur(8px)',
};

const statItem = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 2,
};

const statNum = {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#e0d4fc',
};

const statLabel = {
  fontSize: 11,
  color: '#64748b',
};

const resultCard = {
  width: '100%',
  maxWidth: 280,
  background: 'linear-gradient(135deg, rgba(30,27,75,0.85), rgba(45,35,90,0.8))',
  border: '1px solid rgba(167,139,250,0.2)',
  borderRadius: 14,
  padding: '16px 18px',
  marginBottom: 18,
  textAlign: 'center',
  backdropFilter: 'blur(8px)',
};

const resultRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '4px 0',
  fontSize: 14,
  color: '#cbd5e1',
};

const startBtn = {
  padding: '14px 42px',
  borderRadius: 16,
  border: 'none',
  background: 'linear-gradient(135deg, #6d28d9, #7c3aed, #8b5cf6)',
  color: '#fff',
  fontSize: 17,
  fontWeight: 'bold',
  cursor: 'pointer',
  boxShadow: '0 4px 20px rgba(124,58,237,0.4), 0 0 40px rgba(124,58,237,0.15)',
  transition: 'all 0.2s',
  ':hover': {
    transform: 'scale(1.05) translateY(-1px)',
    boxShadow: '0 6px 28px rgba(124,58,237,0.5), 0 0 50px rgba(124,58,237,0.2)',
  },
  ':active': {
    transform: 'scale(0.98)',
  },
};

const startBtnDisabled = {
  padding: '14px 42px',
  borderRadius: 16,
  border: '1px solid rgba(71,85,105,0.3)',
  background: 'rgba(51,65,85,0.4)',
  color: '#64748b',
  fontSize: 15,
  cursor: 'not-allowed',
};

const flashOverlay = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(220,38,38,0.25)',
  zIndex: 999,
  pointerEvents: 'none',
  animation: 'fadeOut 0.35s forwards',
};

const bottomWarning = {
  position: 'absolute',
  bottom: 88,
  left: 0, right: 0,
  height: 4,
  background: 'linear-gradient(90deg, transparent, #ef4444, transparent)',
  zIndex: 20,
  animation: 'bottomPulse 0.4s ease-in-out 2',
  pointerEvents: 'none',
};

const slowIndicator = {
  position: 'absolute',
  top: 46,
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'rgba(59,130,246,0.2)',
  border: '1px solid rgba(59,130,246,0.4)',
  color: '#93c5fd',
  fontSize: 12,
  padding: '3px 14px',
  borderRadius: 12,
  zIndex: 15,
  whiteSpace: 'nowrap',
};

const getShieldIndicator = (slowMode) => ({
  position: 'absolute',
  top: slowMode ? 72 : 46,
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'rgba(34,197,94,0.2)',
  border: '1px solid rgba(34,197,94,0.4)',
  color: '#86efac',
  fontSize: 12,
  padding: '3px 14px',
  borderRadius: 12,
  zIndex: 15,
  whiteSpace: 'nowrap',
});

const styles = {
  container, starsBg, centerContent, title, subtitle,
  statCard, statItem, statNum, statLabel,
  resultCard, resultRow, startBtn, startBtnDisabled,
  flashOverlay, bottomWarning, slowIndicator,
  infoBar, infoItem, infoLabel, gameArea, bubble,
  optionsArea, optionBtn, skillBar,
  skillBtnSlow, skillBtnShield, skillBtnUlt, skillBtnDisabled,
  petContainer, petGlow, petImage,
}
