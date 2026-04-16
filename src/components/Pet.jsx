import React, { useState, useEffect, useCallback, useRef } from 'react'
import { getDialogueType, getDialogue, STAT_CONFIG } from '../utils/gamification'
import PetSvgSprite, { getPetSvgComponent } from './PetSprites'

// ============================================================
//  多宠物精灵图映射表（2026-04-15 改造：支持18只宠物动态加载）
// ============================================================
// ============================================================
//  小橘猫专用 PNG 表情映射（AI生成的精美插图）
//  三阶段成长系统，每阶段9张表情
// ============================================================
const EMOTION_NAMES = [
  'reading', 'sleeping', 'happy',     // 第1行：读书(答题) / 睡觉(Dock) / 开心
  'sad_cry', 'angry', 'eating',        // 第2行：哭泣 / 生气 / 吃东西
  'wave', 'excited', 'normal',         // 第3行：招手(洗澡) / 兴奋(升级) / 正常
];

function makeKittenStage(stageDir) {
  const map = {};
  for (const name of EMOTION_NAMES) {
    map[name] = `/pets/kitten/${stageDir ? stageDir + '/' : ''}${name}.png`;
  }
  return map;
}

// 紫柴犬：3阶段PNG表情映射（同 kitten 格式）
function makeShibaStage(stageDir) {
  const map = {};
  for (const name of EMOTION_NAMES) {
    map[name] = `/pets/shiba/${stageDir ? stageDir + '/' : ''}${name}.png`;
  }
  return map;
}

// 按等级选择阶段的情绪精灵图
function getKittenEmotion(emotionKey, level) {
  let stageDir = '';
  if (level >= 20) stageDir = 'stage3';      // 完全体：金色神圣猫
  else if (level >= 10) stageDir = 'stage2';  // 少年期：戴眼镜学童猫
  // 1-9: 幼体期，根目录（无子目录）
  
  const sprites = makeKittenStage(stageDir);
  return sprites[emotionKey] || sprites.normal;
}

// 银月狐：3阶段PNG表情映射（同 kitten/shiba 格式）
function makeFoxStage(stageDir) {
  const map = {};
  for (const name of EMOTION_NAMES) {
    map[name] = `/pets/fox/${stageDir ? stageDir + '/' : ''}${name}.png`;
  }
  return map;
}

const PET_SPRITE_MAP = (function() {
  const baseEmotions = {
    normal: '/pets/emotion-normal.png', happy: '/pets/emotion-happy.png',
    bliss: '/pets/emotion-bliss.png', laugh: '/pets/emotion-laugh.png',
    excited: '/pets/emotion-excited.png', cheer: '/pets/emotion-cheer.png',
    sad1: '/pets/emotion-sad1.png', sad2: '/pets/emotion-sad2.png', sad3: '/pets/emotion-sad3.png',
  };
  // 默认龙图（fallback）
  const dragonLevels = { 1: '/pets/pet-level-1-10.png', 11: '/pets/pet-level-11-20.png', 21: '/pets/pet-level-21-30.png' };

  // 辅助函数：生成某前缀的精灵配置
  function makePet(prefix) {
    if (!prefix) return { levelSprites: dragonLevels, emotionSprites: baseEmotions };
    return {
      levelSprites: {
        1: `/pets/${prefix}-level-1-10.png`,
        11: `/pets/${prefix}-level-11-20.png`,
        21: `/pets/${prefix}-level-21-30.png`,
      },
      emotionSprites: Object.fromEntries(
        Object.entries(baseEmotions).map(([k, v]) => [k, v.replace('/pets/', `/pets/${prefix}-`)])
      ),
    };
  }

  return {
    // === N级：小橘猫（3阶段AI精美PNG） ===
    pet_kitten: {
      levelSprites: {
        1: '/pets/kitten/normal.png',         // Stage1 (Lv1-9): 幼年橘猫
        10: '/pets/kitten/stage2/normal.png', // Stage2 (Lv10-19): 戴眼镜少年橘猫
        20: '/pets/kitten/stage3/normal.png', // Stage3 (Lv20+): 金色光环完全体
      },
      emotionSprites: makeKittenStage(''),
      hasPngEmotions: true,
      useLevelBasedEmotion: true,
    },
    // === N级：紫电柴犬（3阶段AI精美PNG）===
    pet_shiba: {
      levelSprites: {
        1: '/pets/shiba/stage1/reading.png',     // Stage1 (Lv1-9): 机械幼崽
        10: '/pets/shiba/stage2/reading.png',     // Stage2 (Lv10-19): 赛博柴犬
        20: '/pets/shiba/stage3/reading.png',     // Stage3 (Lv20+): 终极义体
      },
      // 紫电柴犬：emotionSprites 由 getEmotionSprite() 动态生成（含stage变量）
      // 这里保留 stage1 作为 fallback 基准路径（getEmotionSprite 优先级更高）
      emotionSprites: makeShibaStage('stage1'),
      hasPngEmotions: true,
      useLevelBasedEmotion: true,
    },
    // === R级：银月狐（3阶段AI精美PNG）===
    // Stage1(1-9): 白色幼狐 | Stage2(10-19): 月纹灵狐+蓝光尾 | Stage3(20+): 蓝银九尾天狐
    pet_fox: {
      levelSprites: {
        1: '/pets/fox/stage1/normal.png',     // Stage1 (Lv1-9): 白色幼年小狐狸
        10: '/pets/fox/stage2/normal.png',    // Stage2 (Lv10-19): 额生月印+蓝光尾
        20: '/pets/fox/stage3/normal.png',    // Stage3 (Lv20+): 蓝银九尾天狐完全体
      },
      emotionSprites: makeFoxStage('stage1'),
      hasPngEmotions: true,
      useLevelBasedEmotion: true,
    },
    pet_toothless: { levelSprites: dragonLevels, emotionSprites: baseEmotions },
  };
})();

/** 获取指定宠物的精灵配置（带 fallback 到 pet_toothless） */
function getPetSprites(type) {
  return PET_SPRITE_MAP[type] || PET_SPRITE_MAP.pet_toothless
}

/**
 * 根据宠物类型和等级获取外观图片URL
 * @param {number} level - 宠物等级
 * @param {string} type - 宠物类型（poolId）
 */
function getLevelSprite(level, type) {
  const sprites = getPetSprites(type)
  if (level >= 21) return sprites.levelSprites[21]
  if (level >= 11) return sprites.levelSprites[11]
  return sprites.levelSprites[1]
}

/**
 * 根据宠物类型和情绪key获取情绪图片URL
 * @param {string} emotionKey - 情绪标识
 * @param {string} type - 宠物类型
 */
function getEmotionSprite(emotionKey, type, level = 1) {
  // 小橘猫专用：根据等级自动选择成长阶段（幼体/少年/完全体）
  if (type === 'pet_kitten') {
    return getKittenEmotion(emotionKey, level)
  }
  // 紫电柴犬：同 kitten 格式，3阶段PNG
  if (type === 'pet_shiba') {
    let stageDir = ''
    if (level >= 20) stageDir = 'stage3'       // 终极义体
    else if (level >= 10) stageDir = 'stage2'   // 赛博柴犬
    // 1-9: stage1（机械幼崽）
    const sprites = makeShibaStage(stageDir)
    return sprites[emotionKey] || sprites.normal || sprites.happy
  }
  // 银月狐：3阶段PNG（同 kitten/shiba 格式）
  if (type === 'pet_fox') {
    let stageDir = ''
    if (level >= 20) stageDir = 'stage3'       // 蓝银九尾天狐
    else if (level >= 10) stageDir = 'stage2'   // 月纹灵狐
    // 1-9: stage1（白色幼狐）
    const sprites = makeFoxStage(stageDir)
    return sprites[emotionKey] || sprites.normal || sprites.happy
  }
  const sprites = getPetSprites(type)
  return sprites.emotionSprites[emotionKey] || null
}

/** 所有可用的默认精灵图（用于错误降级，取自默认宠物） */
const ALL_SPRITES = Object.values(PET_SPRITE_MAP.pet_toothless.levelSprites)

// ============================================================
//  真实精灵表系统（小橘猫 + 无牙仔）
//  CSS background-position 从 3×3 网格裁剪单格
// ============================================================

/** 获取精灵表图片路径 */
function getSpriteSheetSrc(type, level) {
  if (type === 'pet_kitten') {
    if (level < 10) return '/pets/kitten/sheet_s1.png'
    if (level < 20) return '/pets/kitten/sheet_s2.png'
    return '/pets/kitten/sheet_s3.png'
  }
  if (type === 'pet_shiba') {
    // 紫柴犬用PNG单图，不需要精灵表
    return null
  }
  if (type === 'pet_toothless') return '/pets/toothless/sheet_all.png'
  return null
}

/**
 * 情绪 → 网格坐标 [row, col]（3×3 精灵表）
 *
 * 小橘猫：每个阶段独立的 3×3 表，排列推测如下（可按实际图片调整）：
 *   (0,0)=reading  (0,1)=sleeping  (0,2)=happy
 *   (1,0)=sad_cry  (1,1)=angry     (1,2)=eating
 *   (2,0)=wave     (2,1)=excited   (2,2)=normal
 *
 * 无牙仔：sheet_all.png 行=阶段(0/1/2), 列=情绪极性(0=中性/1=正向/2=负向)
 */
function getSpriteCell(type, level, emotionKey) {
  if (type === 'pet_kitten') {
    const map = {
      reading: [0, 0], sleeping: [0, 1], happy:   [0, 2],
      sad_cry: [1, 0], angry:    [1, 1], eating:  [1, 2],
      wave:    [2, 0], excited:  [2, 1], normal:  [2, 2],
    }
    return map[emotionKey] || [2, 2]
  }
  if (type === 'pet_toothless') {
    const stageRow = level < 10 ? 0 : level < 20 ? 1 : 2
    const posEmo = ['happy', 'excited', 'cheer', 'laugh', 'bliss']
    const negEmo = ['sad_cry', 'sad1', 'sad2', 'sad3', 'angry']
    const col = posEmo.includes(emotionKey) ? 1 : negEmo.includes(emotionKey) ? 2 : 0
    return [stageRow, col]
  }
  return [0, 0]
}

/** 渲染真实精灵表格子（替代 <img> 或 SVG） */
function renderSpriteCell(type, level, emotionKey, size, style) {
  const src = getSpriteSheetSrc(type, level)
  if (!src) return null
  const [row, col] = getSpriteCell(type, level, emotionKey)
  return (
    <div style={{
      width: size,
      height: size,
      backgroundImage: `url(${src})`,
      backgroundSize: '300% 300%',
      backgroundPosition: `${col * 50}% ${row * 50}%`,
      backgroundRepeat: 'no-repeat',
      flexShrink: 0,
      ...style,
    }} />
  )
}

/**
 * 根据当前pose和状态计算情绪key
 * 
 * 小橘猫专用映射（9张AI精美PNG）：
 *   reading  → 答题/学习时默认（📖读书）
 *   sleeping → Dock常态化显示（💤睡觉）
 *   eating   → 喂食时（🍪吃东西）
 *   excited  → 升级/开心时（✨兴奋）
 *   happy    → 一般开心（😊开心）
 *   wave     → 招手互动（👋招手）
 *   normal   → 普通待机（😐正常）
 *   sad_cry  → 难过哭泣（😭哭）
 *   angry    → 生气（😠生气）
 */
function resolveEmotion(pose, stats) {
  // === 特殊动作直接映射 ===
  if (pose === 'reading' || pose === 'quiz') return 'reading'     // 📖 读书 = 答题默认
  if (pose === 'sleeping') return 'sleeping'                       // 💤 睡觉 = Dock默认
  if (pose === 'eating') return 'eating'                          // 🍪 吃东西
  if (pose === 'happy' || pose === 'upgrade' || pose === 'petting') return 'excited'
  if (pose === 'laugh') return 'happy'
  if (pose === 'bathing') return 'wave'

  // === 根据四维状态自动判断 ===
  const intimacy = stats?.intimacy ?? 50
  const energy = stats?.energy ?? 80
  const hunger = stats?.hunger ?? 70

  // ★ 任何一项低于10% → 强制哭泣（直到全部>10才恢复）
  if (hunger < 10 || energy < 10 || intimacy < 10) return 'sad_cry'
  // 状态较差：生气
  if (hunger < 35 || energy < 25 || intimacy < 35) return 'angry'
  // 状态一般：正常
  if (hunger < 50 || energy < 40) return 'normal'
  // 状态良好：开心
  if (intimacy > 70 && energy > 50 && hunger > 40) {
    return intimacy > 90 ? 'excited' : 'happy'
  }

  return 'normal'
}

// ---- 内联 SVG 资源 ----
const heartSvg = "data:image/svg+xml;utf8," + encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24'><path fill='#ff4757' d='M12 21s-7.5-4.35-9.5-9.5C-0.5 6.75 5 2 12 7c7-5 12-1.25 9.5 4.5C19.5 16.65 12 21 12 21z'/></svg>"
)
const zzzSvg = "data:image/svg+xml;utf8," + encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 24 24'><text x='4' y='18' font-size='16' fill='#93c5fd'>Z</text></svg>"
)

// ---- 图片组（已替换为精灵图系统） ----

// ---- 音效合成器（无需外部音频文件）----
function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    
    switch (type) {
      case 'tap':
        osc.frequency.setValueAtTime(600, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1)
        gain.gain.setValueAtTime(0.1, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.15)
        break
      case 'feed':
        osc.frequency.setValueAtTime(400, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.08)
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.16)
        gain.gain.setValueAtTime(0.08, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.2)
        break
      case 'levelup':
        osc.type = 'sine'
        osc.frequency.setValueAtTime(523, ctx.currentTime)
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.15)
        osc.frequency.setValueAtTime(784, ctx.currentTime + 0.3)
        gain.gain.setValueAtTime(0.12, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.5)
        break
      default:
        break
    }
  } catch (e) {
    // 静默失败 - 浏览器可能不支持
  }
}

/**
 * Pet 组件 v3 - 完整版
 *
 * mode="full"  : 完整面板（状态条+气泡+配饰）
 * mode="dock"  : 纯展示（透明底+3D悬浮）
 *
 * 新增特性:
 *   - 四维状态条（饱食度/清洁度/活力值/亲密度）
 *   - 气泡对话（状态驱动随机文案 + 可选音效）
 *   - 待机动画（呼吸/眨眼/打瞌睡/ZZZ飘出）
 *   - 配饰渲染（头部/颈部/背部三个槽位）
 *   - 三姿态触发（normal/happy/upgrade）
 */
export default function Pet({
  type = 'dragon',
  experience = 0,
  level = 1,
  onGainExp,
  mode = 'dock',
  pose = 'normal',
  onPoseChange,
  size = 160,
  stats = null,           // { hunger, cleanliness, energy, intimacy }
  equippedAccessories = {}, // { head: 'acc_xxx', neck: 'acc_yyy', back: 'acc_zzz' }
  soundEnabled = true,
  showStatsCompact = false, // dock模式下是否显示迷你状态条
  // ---- 新增：互动系统 props ----
  onInteract = null,       // (actionType: 'feed'|'clean'|'rest'|'pet') => void
  inventory = null,        // { foods: {basic, advanced}, cleanItems, energyItems, giftItems }
  reactionPose = null,     // 外部控制的反应姿态（覆盖 internalPose）
  onTap = null,             // 用户点击宠物时的回调（由父组件决定pose切换）
}) {
  const typeProp = type  // 用于对话系统区分不同宠物
  const [internalPose, setInternalPose] = useState('normal')
  const [mood, setMood] = useState(50)
  const [hearts, setHearts] = useState([])
  const [isHovered, setIsHovered] = useState(false)
  
  // P0-2: 对话气泡状态
  const [dialogue, setDialogue] = useState('')
  const [showBubble, setShowBubble] = useState(false)
  const [lastAction, setLastAction] = useState(null)
  
  // P0-3: 待机动画状态
  const [isBreathing, setIsBreathing] = useState(true)
  const [isBlinking, setIsBlinking] = useState(false)
  const [showZZZ, setShowZZZ] = useState(false)
  // 图片加载失败降级索引（用于精灵图加载失败时切换到备用图）
  const [spriteErrorIdx, setSpriteErrorIdx] = useState(0)

  // ---- 反应动画状态（互动反馈）----
  const [reaction, setReaction] = useState(null) // 'eating' | 'bathing' | 'sleeping' | 'petting' | null
  
  const bubbleTimeoutRef = useRef(null)
  const blinkIntervalRef = useRef(null)
  const dialogueTimerRef = useRef(null)

  // ⚠️ 必须先声明 currentStats，后面 resolveEmotion 要用到它（避免 TDZ）
  const currentStats = stats || { hunger: 70, cleanliness: 70, energy: 80, intimacy: 50 }

  const activePose = reactionPose || reaction || (pose !== 'normal' ? pose : internalPose)

  // 根据等级获取外观 + 根据pose/stats获取情绪（支持多宠物type参数）
  const levelSprite = getLevelSprite(level, type)
  const emotionKey = resolveEmotion(activePose, currentStats)
  const emotionSprite = getEmotionSprite(emotionKey, type, level)
  
  // 小橘猫有完整PNG表情系统 → 始终用表情图（根据等级自动选阶段）
  // 其他宠物：非normal姿态用情绪图，normal用等级外观
  const hasPngSystem = PET_SPRITE_MAP[type]?.hasPngEmotions
  const baseImg = (hasPngSystem || (activePose !== 'normal' && emotionSprite))
    ? (emotionSprite || levelSprite)
    : levelSprite
  // 有PNG系统的宠物 → 失败时用同宠物的其他表情fallback，不要显示错误的龙图
  const hasOwnPng = PET_SPRITE_MAP[type]?.hasPngEmotions
  const fallbackSprites = hasOwnPng ? getPetSprites(type)?.emotionSprites : null
  const orderedFallbacks = fallbackSprites
    ? [fallbackSprites.normal, fallbackSprites.happy, fallbackSprites.reading,
       fallbackSprites.wave, fallbackSprites.excited, fallbackSprites.eating,
       fallbackSprites.sleeping, fallbackSprites.sad_cry, fallbackSprites.angry]
         .filter(Boolean)
    : ALL_SPRITES
  const imgSrc = spriteErrorIdx > 0
    ? (orderedFallbacks[spriteErrorIdx % orderedFallbacks.length] || baseImg)
    : baseImg

  /** 处理图片加载失败 → 自动切换到备用精灵图 */
  const handleImgError = () => {
    console.error('🐱 宠物图加载失败:', {
      type, emotionKey, level, imgSrc,
      hasPngSystem: !!hasPngSystem,
      spriteErrorIdx: spriteErrorIdx + 1
    })
    setSpriteErrorIdx(i => i + 1)
  }

  // ---- 待机动画系统 ----
  useEffect(() => {
    // 眨眼：每 4-8 秒随机眨一次
    const scheduleBlink = () => {
      const delay = 4000 + Math.random() * 4000
      blinkIntervalRef.current = setTimeout(() => {
        setIsBlinking(true)
        setTimeout(() => setIsBlinking(false), 180)
        scheduleBlink()
      }, delay)
    }
    scheduleBlink()

    // ZZZ 效果：活力低于30时显示
    const zzzInterval = setInterval(() => {
      if (currentStats.energy < 30 && Math.random() > 0.5) {
        setShowZZZ(true)
        setTimeout(() => setShowZZZ(false), 1500)
      }
    }, 3000)

    return () => {
      clearTimeout(blinkIntervalRef.current)
      clearInterval(zzzInterval)
    }
  }, [currentStats.energy])

  // ---- 随机对话系统 ----
  useEffect(() => {
    let cancelled = false

    const showDialogue = () => {
      if (cancelled) return
      const type = getDialogueType(currentStats, lastAction)
      const text = getDialogue(type, typeProp)  // 传宠物type获取专属对话

      setDialogue(text)
      setShowBubble(true)

      if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current)
      bubbleTimeoutRef.current = setTimeout(() => {
        setShowBubble(false)
      }, 3000)
    }

    // 首次进入显示一条
    showDialogue()

    // 用单层 setInterval + 随机延迟，避免递归爆炸
    const scheduleNext = () => {
      if (cancelled) return
      const delay = 8000 + Math.random() * 7000
      dialogueTimerRef.current = setTimeout(() => {
        if (!cancelled) {
          showDialogue()
          scheduleNext() // 显示完一条后，再调度下一条
        }
      }, delay)
    }

    // 5秒后开始循环
    const initTimer = setTimeout(scheduleNext, 5000)

    return () => {
      cancelled = true
      clearTimeout(initTimer)
      clearTimeout(bubbleTimeoutRef.current)
      clearTimeout(dialogueTimerRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 手动触发对话（操作时调用）
  const triggerDialogue = useCallback((actionType) => {
    setLastAction(actionType)
    const text = getDialogue(actionType || getDialogueType(currentStats, actionType), typeProp)  // 传宠物type
    setDialogue(text)
    setShowBubble(true)
    if (bubbleTimeoutRef.current) clearTimeout(bubbleTimeoutRef.current)
    bubbleTimeoutRef.current = setTimeout(() => setShowBubble(false), 3000)
  }, [currentStats])

  // ---- 姿态切换 ----
  const triggerHappy = useCallback(() => {
    setInternalPose('happy')
    setMood(m => Math.min(m + 10, 100))
    if (soundEnabled) playSound('tap')
    if (onPoseChange) onPoseChange('happy')
    triggerDialogue('tapped')
    setTimeout(() => {
      setInternalPose('normal')
      if (onPoseChange) onPoseChange('normal')
    }, 1500)
  }, [onPoseChange, soundEnabled, triggerDialogue])

  const triggerUpgrade = useCallback(() => {
    setInternalPose('upgrade')
    if (soundEnabled) playSound('levelup')
    if (onPoseChange) onPoseChange('upgrade')
    triggerDialogue('levelUp')
    setTimeout(() => {
      setInternalPose('normal')
      if (onPoseChange) onPoseChange('normal')
    }, 2000)
  }, [onPoseChange, soundEnabled, triggerDialogue])

  // ============================================================
  //  互动动作系统（消耗道具 + 情绪反馈动画）
  // ============================================================
  const doInteract = useCallback((actionType) => {
    // 调用父组件的互动处理（消耗道具）
    if (onInteract) onInteract(actionType)

    // 触发对应反应动画
    setReaction(actionType)

    // 触发对话气泡
    const dialogueMap = {
      feed: 'fed',
      clean: 'cleaned',
      rest: 'rested',
      pet: 'tapped',
    }
    triggerDialogue(dialogueMap[actionType] || actionType)
    if (soundEnabled) playSound(actionType === 'feed' ? 'feed' : 'tap')

    // 反应动画持续时间后恢复
    const duration = { feed: 2000, clean: 2000, rest: 2500, pet: 1500 }
    setTimeout(() => {
      setReaction(null)
    }, duration[actionType] || 1500)
  }, [onInteract, triggerDialogue, soundEnabled])

  /** 检查是否有足够道具执行某个互动 */
  const canInteract = useCallback((actionType) => {
    if (!inventory) return false
    switch (actionType) {
      case 'feed': return (inventory.foods?.basic || 0) > 0 || (inventory.foods?.advanced || 0) > 0
      case 'clean': return (inventory.cleanItems || 0) > 0
      case 'rest': return (inventory.energyItems || 0) > 0
      case 'pet': return true // 抚摸不消耗道具
      default: return false
    }
  }, [inventory])

  // 点击 → 心形粒子 + 开心姿态
// ---- 点击处理（通知父组件，由父组件决定pose切换逻辑）----
const handleClick = useCallback((e) => {
  const rect = e.currentTarget.getBoundingClientRect()
  const x = e.clientX - rect.left - 16
  const y = e.clientY - rect.top - 16
  const id = Date.now()
  setHearts(h => [...h, { id, x, y }])
  setTimeout(() => setHearts(h => h.filter(hh => hh.id !== id)), 1000)
  // 播放音效和气泡
  if (soundEnabled) playSound('tap')
  triggerDialogue('tapped')
  // 通知父组件：被点击了！由父组件(Dock/互动页)决定如何切换pose
  if (onTap) onTap(e)
}, [soundEnabled, triggerDialogue, onTap])

  // 喂养
  const onFeed = () => {
    onGainExp?.(50)
    if (soundEnabled) playSound('feed')
    triggerDialogue('fed')
    triggerHappy()
  }

  // 宠物图片样式（根据反应状态动态调整）
  const petStyle = {
    width: size,
    height: size,
    objectFit: 'contain',
    transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
    transform: isHovered
      ? 'translateY(-8px) scale(1.08) rotateY(10deg)'
      : reaction === 'sleeping'
        ? 'scale(0.95) translateY(2px)'  // 睡觉稍微缩下沉
        : reaction === 'eating'
          ? 'scale(1.05)'               // 吃东西轻微放大晃动
          : reaction === 'bathing'
            ? 'scale(1.03) rotate(-3deg)' // 洗澡开心摇摆
            : reaction === 'petting'
              ? 'scale(1.08) translateY(-4px)' // 抚摸弹跳
              : `translateY(0) scale(1) rotateY(0deg)`,
    filter: 'drop-shadow(0 4px 12px rgba(99,102,241,0.18)) drop-shadow(0 2px 4px rgba(0,0,0,0.06))',
    cursor: 'pointer',
    animation: (!reaction && isBreathing) ? 'petBreath 3s ease-in-out infinite'
      : reaction === 'eating' ? 'eatingWiggle 0.4s ease-in-out infinite alternate'
      : reaction === 'sleeping' ? 'sleepingBobble 2s ease-in-out infinite'
      : reaction === 'bathing' ? 'bathingShake 0.5s ease-in-out infinite alternate'
      : reaction === 'petting' ? 'pettingBounce 0.3s ease-in-out infinite alternate'
      : 'none',
  }

  const moodEmoji = activePose === 'happy' ? '😊' : activePose === 'upgrade' ? '🔥' : '🙂'
  const stageLabel = level <= 10 ? '幼年' : level <= 20 ? '成长期' : '成熟体'

  // ---- 渲染配饰层 ----
  const renderAccessories = () => {
    if (!equippedAccessories || Object.keys(equippedAccessories).length === 0) return null
    
    return (
      <div style={{ position: 'absolute', top: 0, left: 0, width: size, height: size, pointerEvents: 'none' }}>
        {/* 头部配饰 */}
        {equippedAccessories.head && (
          <div style={{
            position: 'absolute', top: '-2%', left: '50%', transform: 'translateX(-50%)',
            fontSize: size * 0.28, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
          }}>
            {getAccessoryEmoji(equippedAccessories.head)}
          </div>
        )}
        {/* 颈部配饰 */}
        {equippedAccessories.neck && (
          <div style={{
            position: 'absolute', top: '38%', left: '50%', transform: 'translateX(-50%)',
            fontSize: size * 0.22, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
          }}>
            {getAccessoryEmoji(equippedAccessories.neck)}
          </div>
        )}
        {/* 背部配饰 */}
        {equippedAccessories.back && (
          <div style={{
            position: 'absolute', top: '15%', left: '-5%',
            fontSize: size * 0.3, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
          }}>
            {getAccessoryEmoji(equippedAccessories.back)}
          </div>
        )}
      </div>
    )
  }

  // ---- 渲染对话气泡 ----
  const renderBubble = () => {
    if (!showBubble || !dialogue) return null
    
    return (
      <div style={{
        position: 'absolute',
        top: -48,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'white',
        borderRadius: 14,
        padding: '8px 14px',
        fontSize: 12,
        fontWeight: 500,
        color: '#374151',
        boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
        whiteSpace: 'nowrap',
        zIndex: 10,
        animation: 'bubblePop 0.3s ease-out',
        maxWidth: size * 1.2,
      }}>
        {dialogue}
        {/* 小三角 */}
        <div style={{
          position: 'absolute', bottom: -6, left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
          width: 10, height: 10, background: 'white',
          boxShadow: '2px 2px 3px rgba(0,0,0,0.05)',
        }} />
      </div>
    )
  }

  // ---- 渲染 ZZZ 效果 ----
  const renderZZZ = () => {
    if (!showZZZ) return null
    return (
      <div style={{
        position: 'absolute', top: '-5%', right: '-5%',
        fontSize: size * 0.18, opacity: 0.8,
        animation: 'zzzFloat 1.5s ease-out forwards',
        pointerEvents: 'none',
      }}>💤</div>
    )
  }

  // ---- 渲染眨眼效果 ----
  const renderBlinkOverlay = () => {
    if (!isBlinking) return null
    return (
      <div style={{
        position: 'absolute', top: 0, left: 0, width: size, height: size,
        borderRadius: '50%', background: 'rgba(0,0,0,0.05)',
        pointerEvents: 'none',
      }} />
    )
  }

  // ============================================================
  //  DOCK 模式（纯展示，可选迷你状态条）
  // ============================================================
  if (mode === 'dock') {
    return (
      <div
        style={{ display: 'inline-block', position: 'relative' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {renderBubble()}
        <div onClick={handleClick} style={{ display: 'inline-block', position: 'relative' }}>
          {/* 有独立PNG表情系统的宠物 → 直接用<img>显示透明PNG */}
          {(PET_SPRITE_MAP[type]?.hasPngEmotion || PET_SPRITE_MAP[type]?.hasPngEmotions)
            ? <img src={imgSrc} alt="pet" style={{
                ...petStyle,
                background: 'none',   // 清除任何背景色
                objectFit: 'contain',
              }} draggable={false} onError={handleImgError} />
            : getSpriteSheetSrc(type, level)
              ? renderSpriteCell(type, level, emotionKey, size, { ...petStyle, objectFit: undefined })
              : getPetSvgComponent(type)
              ? <PetSvgSprite poolId={type} level={level} emotion={emotionKey} size={size}
                  style={{ ...petStyle, objectFit: undefined }} />
              : <img src={imgSrc} alt="pet" style={petStyle} draggable={false} onError={handleImgError} />
          }
          {renderAccessories()}
          {renderZZZ()}
          {renderBlinkOverlay()}
          
          {/* 迷你状态指示器（dock模式可选） */}
          {showStatsCompact && (
            <div style={{
              position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', gap: 3, background: 'rgba(255,255,255,0.85)',
              borderRadius: 10, padding: '2px 6px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              backdropFilter: 'blur(8px)',
            }}>
              {currentStats.hunger < 25 && <span title="饿了" style={{ fontSize: 10 }}>🍖</span>}
              {currentStats.cleanliness < 25 && <span title="脏了" style={{ fontSize: 10 }}>✨</span>}
              {currentStats.energy < 25 && <span title="累了" style={{ fontSize: 10 }}>⚡</span>}
            </div>
          )}
        </div>
        
        {/* 心形粒子 */}
        {hearts.map(h => (
          <img key={h.id} src={heartSvg} alt="" style={{
            position: 'absolute', left: h.x, top: h.y,
            width: 28, height: 28, pointerEvents: 'none',
            transform: 'translate(-50%, -50%)',
            animation: 'heartFloat 1s ease-out forwards',
          }} />
        ))}

        <style>{`
          @keyframes heartFloat {
            0% { opacity: 1; transform: translate(-50%, -50%) translateY(0) scale(1); }
            100% { opacity: 0; transform: translate(-50%, -80%) translateY(-30px) scale(1.3); }
          }
          @keyframes petBreath {
            0%, 100% { transform: translateY(0) scale(1); }
            50% { transform: translateY(-3px) scale(1.02); }
          }
          @keyframes bubblePop {
            0% { opacity: 0; transform: translateX(-50%) translateY(8px) scale(0.8); }
            100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
          }
          @keyframes zzzFloat {
            0% { opacity: 0.8; transform: translateY(0) translateX(0); }
            100% { opacity: 0; transform: translateY(-20px) translateX(10px); }
          }
        `}</style>
      </div>
    )
  }

  // ============================================================
  //  FULL 模式（完整面板）
  // ============================================================
  const renderStatBar = (statKey) => {
    const config = STAT_CONFIG[statKey]
    if (!config) return null
    const value = currentStats[statKey] ?? 50
    const isLow = value < 25
    const isIntimacy = statKey === 'intimacy'

    return (
      <div key={statKey} style={{ marginBottom: 6 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 2 }}>
          <span style={{ fontSize: 11, color: '#6b7280' }}>
            {config.icon} {config.label}
          </span>
          <span style={{ fontSize: 10, color: isLow ? '#ef4444' : '#9ca3af', fontWeight: 600 }}>
            {Math.round(value)}%
          </span>
        </div>
        <div style={{
          width: '100%', background: '#f3f4f6', borderRadius: 4,
          height: 6, overflow: 'hidden',
        }}>
          <div style={{
            width: `${isIntimacy ? value : value}%`,
            height: '100%',
            background: isLow ? config.lowColor : `linear-gradient(90deg, ${config.color}, ${config.color}dd)`,
            borderRadius: 4,
            transition: 'width 0.5s ease',
          }} />
        </div>
      </div>
    )
  }

  return (
    <div style={{
      width: 230,
      textAlign: 'center',
      position: 'relative',
      background: 'linear-gradient(135deg, rgba(255,255,255,0.92), rgba(248,250,252,0.96))',
      borderRadius: 20,
      padding: 14,
      paddingTop: 52,        /* 为气泡腾出顶部空间 */
      boxShadow: '0 8px 32px rgba(99,102,241,0.1)',
      backdropFilter: 'blur(12px)',
      overflow: 'visible',   /* 确保气泡不被裁剪 */
    }}>
      {/* 对话气泡（放在卡片顶层，不受 inline-block 限制） */}
      {showBubble && dialogue && (
        <div style={{
          position: 'absolute',
          top: 8,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'white',
          borderRadius: 14,
          padding: '7px 14px',
          fontSize: 12,
          fontWeight: 500,
          color: '#374151',
          boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
          whiteSpace: 'nowrap',
          zIndex: 20,
          animation: 'bubblePop 0.3s ease-out',
          maxWidth: 210,
        }}>
          {dialogue}
          <div style={{
            position: 'absolute', bottom: -6, left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: 10, height: 10, background: 'white',
            boxShadow: '2px 2px 3px rgba(0,0,0,0.05)',
          }} />
        </div>
      )}

      {/* 宠物图片区（含配饰） */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
        style={{ display: 'inline-block', position: 'relative', marginBottom: 10 }}
      >
        {/* 等级标签 */}
        <div style={{
          position: 'absolute', top: -4, right: -4,
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          color: 'white', fontSize: 11, fontWeight: 700,
          padding: '2px 8px', borderRadius: 10,
          boxShadow: '0 2px 8px rgba(99,102,241,0.35)', zIndex: 5,
        }}>
          Lv.{level}
        </div>

        {/* 阶段标签 */}
        <div style={{
          position: 'absolute', bottom: 0, left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255,255,255,0.85)', color: '#4b5563',
          fontSize: 10, padding: '1px 8px', borderRadius: 8, zIndex: 5,
          backdropFilter: 'blur(6px)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          {stageLabel}
        </div>

        {/* 有独立PNG表情系统的宠物 → 直接用<img>显示透明PNG */}
        {(PET_SPRITE_MAP[type]?.hasPngEmotion || PET_SPRITE_MAP[type]?.hasPngEmotions)
          ? <img src={imgSrc} alt="pet" style={{
              ...petStyle,
              background: 'none',
              objectFit: 'contain',
            }} draggable={false} onError={handleImgError} />
          : getSpriteSheetSrc(type, level)
            ? renderSpriteCell(type, level, emotionKey, size, { ...petStyle, objectFit: undefined })
            : getPetSvgComponent(type)
            ? <PetSvgSprite poolId={type} level={level} emotion={emotionKey} size={size}
                style={{ ...petStyle, objectFit: undefined }} />
            : <img src={imgSrc} alt="pet" style={petStyle} draggable={false} onError={handleImgError} />
        }
        {renderAccessories()}
        {renderZZZ()}
        {renderBlinkOverlay()}

        {/* 心形粒子 */}
        {hearts.map(h => (
          <img key={h.id} src={heartSvg} alt="" style={{
            position: 'absolute', left: h.x, top: h.y,
            width: 28, height: 28, pointerEvents: 'none',
            transform: 'translate(-50%, -50%)',
            animation: 'heartFloat 1s ease-out forwards',
          }} />
        ))}
      </div>

      {/* ====== 四维状态条 ====== */}
      <div style={{ marginBottom: 10 }}>
        <div style={{
          fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 6,
          textAlign: 'left',
        }}>
          📊 状态
        </div>
        {['hunger', 'cleanliness', 'energy', 'intimacy'].map(renderStatBar)}
      </div>

      {/* 心情快速指示 */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        marginBottom: 10,
      }}>
        <span style={{ fontSize: 12, color: '#6b7280' }}>心情</span>
        <span style={{ fontSize: 18 }}>{moodEmoji}</span>
      </div>

      {/* ====== 互动按钮区（消耗道具）====== */}
      {mode === 'full' && onInteract && (
        <>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10,
          }}>
            {[
              {
                key: 'feed', icon: '🍖', label: '喂养',
                desc: '+饱食度',
                color: '#10b981', bg: 'linear-gradient(135deg,#34d399,#10b981)',
                hasItem: canInteract('feed'),
                itemCount: (inventory?.foods?.basic || 0) + (inventory?.foods?.advanced || 0),
              },
              {
                key: 'clean', icon: '🛁', label: '洗澡',
                desc: '+清洁度',
                color: '#3b82f6', bg: 'linear-gradient(135deg,#60a5fa,#3b82f6)',
                hasItem: canInteract('clean'),
                itemCount: inventory?.cleanItems || 0,
              },
              {
                key: 'rest', icon: '💤', label: '休息',
                desc: '+活力',
                color: '#8b5cf6', bg: 'linear-gradient(135deg,#a78bfa,#8b5cf6)',
                hasItem: canInteract('rest'),
                itemCount: inventory?.energyItems || 0,
              },
              {
                key: 'pet', icon: '👋', label: '抚摸',
                desc: '+亲密度',
                color: '#ec4899', bg: 'linear-gradient(135deg,#f472b6,#ec4899)',
                hasItem: true, // 抚摸不限
                itemCount: null,
              },
            ].map(btn => (
              <button
                key={btn.key}
                onClick={() => btn.hasItem && doInteract(btn.key)}
                disabled={!btn.hasItem}
                style={{
                  padding: '10px 0',
                  background: btn.hasItem ? btn.bg : '#e5e7eb',
                  color: btn.hasItem ? 'white' : '#9ca3af',
                  border: 'none', borderRadius: 12,
                  fontSize: 12, fontWeight: 600,
                  cursor: btn.hasItem ? 'pointer' : 'not-allowed',
                  boxShadow: btn.hasItem ? `0 3px 10px ${btn.color}40` : 'none',
                  transition: 'transform 0.15s, opacity 0.2s',
                  opacity: btn.hasItem ? 1 : 0.55,
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseDown={(e) => { if (btn.hasItem) e.currentTarget.style.transform = 'scale(0.95)' }}
                onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
              >
                <div style={{ fontSize: 18 }}>{btn.icon}</div>
                <div>{btn.label}</div>
                <div style={{ fontSize: 9, opacity: 0.8 }}>
                  {btn.desc}
                  {btn.itemCount !== null && ` ×${btn.itemCount}`}
                </div>
                {!btn.hasItem && (
                  <div style={{
                    position: 'absolute', top: 4, right: 6,
                    fontSize: 10, opacity: 0.6,
                  }}>🔒</div>
                )}
              </button>
            ))}
          </div>

          {/* 反应动画状态提示 */}
          {reaction && (
            <div style={{
              textAlign: 'center', fontSize: 11, fontWeight: 600,
              padding: '4px 0', marginBottom: 6,
              color: reaction === 'eating' ? '#059669'
                : reaction === 'bathing' ? '#2563eb'
                : reaction === 'sleeping' ? '#7c3aed'
                : '#db2777',
              animation: 'reactionPulse 0.8s ease-in-out infinite alternate',
            }}>
              {{ eating: '😋 美味美味...', bathing: '✨ 好舒服~', sleeping: '💤 Zzz...', petting: '😆 嘿嘿~' }[reaction] || ''}
            </div>
          )}

          {/* 背包道具展示 */}
          {inventory && (
            <div style={{
              background: '#f9fafb', borderRadius: 12, padding: '10px',
              border: '1px solid #f3f4f6', marginBottom: 8,
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                🎒 我的背包
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[
                  { icon: '🐟', label: '鱼干', count: inventory.foods?.basic || 0, key: 'food_basic' },
                  { icon: '🐠', label: '烤鱼', count: inventory.foods?.advanced || 0, key: 'food_adv' },
                  { icon: '🧴', label: '沐浴露', count: inventory.cleanItems || 0, key: 'clean' },
                  { icon: '🥤', label: '能量饮料', count: inventory.energyItems || 0, key: 'energy' },
                  { icon: '🧸', label: '玩具', count: inventory.giftItems || 0, key: 'gift' },
                  { icon: '🃏', label: '抽卡券', count: inventory.cards || 0, key: 'card' },
                ].map(item => (
                  <div
                    key={item.key}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      background: item.count > 0 ? 'white' : '#f3f4f6',
                      borderRadius: 8, padding: '4px 8px',
                      fontSize: 10, color: item.count > 0 ? '#374151' : '#d1d5db',
                      boxShadow: item.count > 0 ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                    }}
                    title={`${item.label}: ${item.count}`}
                  >
                    <span>{item.icon}</span>
                    <span style={{ fontWeight: 700 }}>{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes heartFloat {
          0% { opacity: 1; transform: translate(-50%,-50%) translateY(0) scale(1); }
          100% { opacity: 0; transform: translate(-50%,-80%) translateY(-30px) scale(1.3); }
        }
        @keyframes petBreath {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-3px) scale(1.02); }
        }
        @keyframes bubblePop {
          0% { opacity: 0; transform: translateX(-50%) translateY(8px) scale(0.8); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
        @keyframes zzzFloat {
          0% { opacity: 0.8; transform: translateY(0) translateX(0); }
          100% { opacity: 0; transform: translateY(-20px) translateX(10px); }
        }
        @keyframes reactionPulse {
          0% { opacity: 0.6; transform: scale(0.97); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes eatingWiggle {
          0% { transform: scale(1.05) rotate(-2deg); }
          100% { transform: scale(1.05) rotate(2deg); }
        }
        @keyframes sleepingBobble {
          0%, 100% { transform: scale(0.95) translateY(2px); }
          50% { transform: scale(0.95) translateY(4px); }
        }
        @keyframes bathingShake {
          0% { transform: scale(1.03) rotate(-5deg); }
          100% { transform: scale(1.03) rotate(5deg); }
        }
        @keyframes pettingBounce {
          0% { transform: scale(1.08) translateY(-4px); }
          100% { transform: scale(1.1) translateY(-8px); }
        }
      `}</style>
    </div>
  )
}

// 辅助函数：获取配饰 emoji
function getAccessoryEmoji(accessoryId) {
  const map = {
    acc_crown: '👑', acc_glasses: '🤓', acc_cat_ears: '🐱', acc_antler: '🦌', acc_star_hat: '⭐', acc_santa: '🎅',
    acc_scarf: '🧣', acc_bowtie: '🎀', acc_necklace: '💎', acc_bell: '🔔',
    acc_wings: '🧚', acc_cape: '🦸', acc_backpack: '🎒', acc_halo: '😇',
  }
  return map[accessoryId] || '✨'
}

export function usePetTriggers() {
  return { triggerHappy: () => {}, triggerUpgrade: () => {} }
}
