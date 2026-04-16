import { useState, useEffect, useCallback, useMemo } from 'react'
import { storage, calcLevel, calcLevelProgress } from './utils/storage'
import OnboardingPage from './pages/OnboardingPage'
import HomePage from './pages/HomePage'
import QuizPage from './pages/QuizPage'
import ResultPage from './pages/ResultPage'
import ReportPage from './pages/ReportPage'
import ReadingPage from './pages/ReadingPage'
import SentencePracticePage from './pages/SentencePracticePage'
import EssayPage from './pages/EssayPage'
import WrongAnswersPage from './pages/WrongAnswersPage'
import VariantTrainingPage from './pages/VariantTrainingPage'
import MV1Demo from './pages/MV1Demo'
import EnglishHomePage from './pages/EnglishHomePage'
import EnglishQuizPage from './pages/EnglishQuizPage'
import AssociationPlanetPage from './pages/AssociationPlanetPage'
import WordPlanetPage from './pages/WordPlanetPage'
import DictationPage from './pages/DictationPage'
import SelfTestPage from './pages/SelfTestPage'
import LightningQuizPage from './pages/LightningQuizPage'
import PoliticsHomePage from './pages/PoliticsHomePage'
import PoliticsQuizPage from './pages/PoliticsQuizPage'
import { initGamificationState, initGodModeState } from './utils/gamification'
import { fetchMV1State, upsertMV1State } from './utils/mv1_cloud'
import { pullFromCloud } from './utils/sync'
import { unlockAudio } from './utils/tts'

// 检查上帝模式：URL 带 ?god=1 或 #god=1
function isGodMode() {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.split('?')[1] || '')
  return params.get('god') === '1' || hash.get('god') === '1'
}
import LeaderboardPage from './pages/LeaderboardPage'
import GlobalPetDock from './components/GlobalPetDock'

// 科目配置（按学段）
const SUBJECTS_BY_GRADE = {
  primary: [
    { id: 'chinese', label: '语文', emoji: '📖', available: true },
    { id: 'english',  label: '英语', emoji: '🌎', available: true },
  ],
  junior2: [
    { id: 'english',  label: '英语', emoji: '🌎', available: true },
    { id: 'politics', label: '道法', emoji: '⚖️', available: true },
    { id: 'math',     label: '数学', emoji: '🔢', available: false },
  ],
}

// 底部导航栏（仅主界面可见）
function BottomNav({ activeTab, onTabChange, overdueCount }) {
  const tabs = [
    { key: 'home',  icon: '📚', label: '学习' },
    { key: 'pet',   icon: '🐉', label: '宠物' },
    { key: 'rank',  icon: '🏆', label: '排行' },
    { key: 'wrong', icon: '💥', label: '错题' },
  ]
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 448,
      background: 'rgba(255,255,255,0.95)',
      backdropFilter: 'blur(16px)',
      borderTop: '1px solid rgba(0,0,0,0.06)',
      display: 'flex',
      zIndex: 40,
      paddingBottom: 'env(safe-area-inset-bottom, 8px)',
    }}>
      {tabs.map(tab => {
        const isActive = activeTab === tab.key
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              padding: '10px 0 6px', border: 'none', background: 'none',
              cursor: 'pointer', position: 'relative',
              transition: 'all 0.2s',
            }}
          >
            <span style={{
              fontSize: 22,
              filter: isActive ? 'none' : 'grayscale(60%) opacity(0.7)',
              transform: isActive ? 'scale(1.15)' : 'scale(1)',
              transition: 'all 0.2s',
              display: 'block',
            }}>{tab.icon}</span>
            <span style={{
              fontSize: 10, marginTop: 2, fontWeight: isActive ? 700 : 400,
              color: isActive ? '#6366f1' : '#9ca3af',
            }}>{tab.label}</span>
            {isActive && (
              <div style={{
                position: 'absolute', bottom: 0, left: '50%',
                transform: 'translateX(-50%)',
                width: 20, height: 3, borderRadius: 2,
                background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
              }} />
            )}
            {tab.key === 'wrong' && overdueCount > 0 && (
              <div style={{
                position: 'absolute', top: 6, right: '22%',
                background: '#ef4444', color: 'white',
                fontSize: 9, fontWeight: 700,
                minWidth: 16, height: 16, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 3px',
                boxShadow: '0 1px 4px rgba(239,68,68,0.5)',
              }}>{overdueCount > 99 ? '99+' : overdueCount}</div>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ===== 主页顶部栏（科目切换区）=====
// 独立组件，切换科目时不卸载，只切换下方星球内容区
function HomeHeader({ user, grade, activeSubject, onSubjectChange, onGradeChange, onReport, onLogout }) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
  const [subjectToast, setSubjectToast] = useState(null)

  const SUBJECTS = SUBJECTS_BY_GRADE[grade] || SUBJECTS_BY_GRADE.primary
  const xp = storage.getXP(user.id)
  const level = calcLevel(xp)
  const levelProgress = calcLevelProgress(xp)
  const streak = storage.getStreak(user.id)
  const records = storage.getRecords(user.id)

  const todayCorrect = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    const todayR = records.filter(r => r.timestamp?.startsWith(today))
    if (todayR.length === 0) return null
    return Math.round(todayR.filter(r => r.correct).length / todayR.length * 100)
  }, [records])

  const totalAccuracy = records.length > 0
    ? Math.round(records.filter(r => r.correct).length / records.length * 100)
    : 0

  const xpPct = Math.min(100, (levelProgress.currentExp / levelProgress.requiredExp) * 100)

  const handleSubjectClick = useCallback((subject) => {
    if (subject.available) {
      onSubjectChange(subject.id)
    } else {
      setSubjectToast(subject.label)
      setTimeout(() => setSubjectToast(null), 2500)
    }
  }, [onSubjectChange])

  const handleExport = useCallback(() => {
    const { exportAll } = require('./utils/storage')
    const data = exportAll(user.id)
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chinese-learn-export-${user.name}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }, [user])

  return (
    <div className="bg-white shadow-sm" style={{ paddingTop: 'env(safe-area-inset-top, 36px)' }}>
      {/* 学段切换 */}
      <div className="px-4 pt-3 flex items-center justify-between">
        <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>📚 学习阶段</span>
        <div className="flex bg-gray-100 rounded-xl p-0.5">
          {[
            { id: 'primary', label: '小学', emoji: '🏫' },
            { id: 'junior2', label: '初二', emoji: '🎓' },
          ].map(g => (
            <button
              key={g.id}
              onClick={() => onGradeChange(g.id)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                grade === g.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              <span>{g.emoji}</span>
              <span>{g.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 科目切换 */}
      <div className="px-4 pt-3 pb-2 flex items-center gap-2">
        <div className="flex gap-2 flex-1">
          {SUBJECTS.map(s => (
            <button
              key={s.id}
              onClick={() => handleSubjectClick(s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                activeSubject === s.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : s.available
                    ? 'bg-gray-100 text-gray-600'
                    : 'bg-gray-50 text-gray-300'
              }`}
            >
              <span>{s.emoji}</span>
              <span>{s.label}</span>
              {!s.available && <span className="text-[10px] opacity-60">🔒</span>}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onReport}
            className="w-8 h-8 flex items-center justify-center bg-indigo-50 rounded-xl text-base"
          >📊</button>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-xl text-base"
          >👤</button>
          <button
            onClick={handleExport}
            className="w-8 h-8 flex items-center justify-center bg-gray-50 rounded-xl text-base"
          >💾</button>
        </div>
      </div>

      {/* 用户打招呼 */}
      <div className="px-4 pb-1">
        <h1 className="text-xl font-bold text-gray-800">
          {user.name} 同学，加油！👋
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">
          {streak.count > 0 ? `已连续学习 ${streak.count} 天 🔥` : '今天开始第一天打卡吧！'}
        </p>
      </div>

      {/* 三个核心数据卡 */}
      <div className="flex gap-2 px-4 pb-3 mt-2">
        <div className="flex-1 rounded-2xl p-3 text-center"
          style={{ background: 'linear-gradient(135deg, #fff7ed, #fed7aa)' }}>
          <div className="text-2xl font-extrabold text-orange-500">{streak.count}</div>
          <div className="text-[10px] text-orange-400 font-medium mt-0.5">连续天数 🔥</div>
        </div>
        <div className="flex-1 rounded-2xl p-3"
          style={{ background: 'linear-gradient(135deg, #f5f3ff, #ddd6fe)' }}>
          <div className="flex items-baseline gap-1 justify-center">
            <span className="text-2xl font-extrabold text-indigo-600">Lv.{level}</span>
          </div>
          <div className="w-full bg-indigo-100 rounded-full h-1.5 mt-1.5">
            <div className="bg-gradient-to-r from-indigo-400 to-purple-500 h-1.5 rounded-full transition-all"
              style={{ width: `${xpPct}%` }} />
          </div>
          <div className="text-[9px] text-indigo-400 text-center mt-0.5">
            {levelProgress.currentExp}/{levelProgress.requiredExp} XP
          </div>
        </div>
        <div className="flex-1 rounded-2xl p-3 text-center"
          style={{ background: 'linear-gradient(135deg, #f0fdf4, #bbf7d0)' }}>
          <div className="text-2xl font-extrabold text-green-600">
            {todayCorrect !== null ? `${todayCorrect}%` : `${totalAccuracy}%`}
          </div>
          <div className="text-[10px] text-green-500 font-medium mt-0.5">
            {todayCorrect !== null ? '今日正确率' : '总正确率'} ✅
          </div>
        </div>
      </div>

      {/* 科目锁定Toast */}
      {subjectToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white text-sm px-5 py-2.5 rounded-2xl shadow-xl"
          style={{ animation: 'fadeInDown 0.3s ease-out' }}>
          {subjectToast}即将开放，敬请期待 🚀
        </div>
      )}

      {/* 退出确认弹窗 */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xs shadow-xl">
            <h2 className="text-lg font-bold text-gray-800 mb-2">切换账号？</h2>
            <p className="text-sm text-gray-500 mb-5">退出后可以重新输入昵称登录，本机数据不会丢失。</p>
            <button
              onClick={() => { onLogout(); setShowLogoutConfirm(false) }}
              className="w-full bg-red-500 text-white font-semibold py-3 rounded-xl mb-2"
            >确认退出</button>
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="w-full text-gray-400 py-2 text-sm"
            >取消</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translate(-50%, -8px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(() => storage.getUser())
  const [page, setPage] = useState(() => storage.getUser() ? 'home' : 'onboarding')
  const [activeTab, setActiveTab] = useState('home')
  const [sessionResult, setSessionResult] = useState(null)
  const [quizOptions, setQuizOptions] = useState(null)
  // 宠物状态：优先读本地缓存（防止刷新后变蛋），其次用上帝模式/默认
  const [gameState, setGameState] = useState(() => {
    // 上帝模式始终用满级数据
    if (isGodMode()) return initGodModeState()
    // 尝试从 localStorage 恢复上次的宠物状态（key 含 userId，防止跨用户污染）
    try {
      const currentUser = storage.getUser()
      const petKey = currentUser?.id ? `mv1_pet_state_${currentUser.id}` : 'mv1_pet_state'
      const cached = localStorage.getItem(petKey)
      if (cached) {
        const parsed = JSON.parse(cached)
        // 只有确认有宠物数据才用缓存
        if (parsed?.currentPet?.poolId || (parsed?.ownedPets?.length > 0)) {
          return parsed
        }
      }
    } catch (e) { /* 缓存无效，用默认 */ }
    return initGamificationState()
  })
  const [overdueCount, setOverdueCount] = useState(0)
  const [englishQuizOptions, setEnglishQuizOptions] = useState({})
  const [grade, setGrade] = useState(() => storage.getGrade())
  const [variantQuestion, setVariantQuestion] = useState(null)

  // 科目状态（切换时只更新内容区，HomeHeader 不卸载）
  const [activeSubject, setActiveSubject] = useState(() => {
    const available = (SUBJECTS_BY_GRADE[grade] || SUBJECTS_BY_GRADE.primary).filter(s => s.available)
    return available[0]?.id || 'chinese'
  })

  // 学段变化时自动切到该学段的第一个可用科目
  useEffect(() => {
    const available = (SUBJECTS_BY_GRADE[grade] || SUBJECTS_BY_GRADE.primary).filter(s => s.available)
    setActiveSubject(available[0]?.id || 'chinese')
  }, [grade])

  const handleGradeChange = useCallback((newGrade) => {
    setGrade(newGrade)
    storage.setGrade(newGrade)
  }, [])

  const handleSubjectChange = useCallback((subjectId) => {
    setActiveSubject(subjectId)
  }, [])

  // 加载宠物游戏状态 + 跨设备同步学习数据
  // ★ 依赖 user?.id（字符串），不依赖 user 对象引用，防止 setUser({...u}) 触发二次拉取
  useEffect(() => {
    if (!user?.id) return
    const uid = user.id

    // 1. 从云端拉取宠物状态（仅用于初始化，MV1Demo 自己也会拉取并做更细致的合并）
    fetchMV1State(uid).then((cloud) => {
      if (!cloud) return
      setGameState(prev => {
        // 如果本地已有宠物数据，保留本地更完整的字段（petExpConsumed/inventory/furniture 等）
        // 云端只用于补充没有的字段（跨设备场景：本地为 null）
        if (prev?.currentPet?.poolId) {
          // 本地有宠物，只补充本地没有的字段，不覆盖本地进度
          return {
            ...cloud,                              // 云端做底
            petExpConsumed: prev.petExpConsumed ?? cloud.petExpConsumed,
            inventory:      prev.inventory      ?? cloud.inventory,
            ownedFurniture: prev.ownedFurniture ?? cloud.ownedFurniture,
            ownedRoomThemes:prev.ownedRoomThemes ?? cloud.ownedRoomThemes,
            currentRoomTheme: prev.currentRoomTheme ?? cloud.currentRoomTheme,
            gameInventory:  prev.gameInventory  ?? cloud.gameInventory,
            currentPet:     prev.currentPet,       // 始终保留本地宠物
            ownedPets:      prev.ownedPets?.length > 0 ? prev.ownedPets : cloud.ownedPets,
          }
        }
        // 本地没有宠物（新设备/刚登录），完全使用云端数据
        return cloud
      })
    })

    // 2. 跨设备同步学习数据（答题记录/SRS/XP/streak）写入 localStorage
    // 完成后 setUser({...u}) 触发重渲染，让 HomeHeader 读到最新 XP
    // 因为依赖是 user?.id（字符串），setUser({...u}) 不会再次触发本 effect
    pullFromCloud(uid).then(() => {
      setUser(u => u ? { ...u } : u)
    }).catch(function(err) {
      console.warn('Cloud pull failed (non-fatal):', err.message)
    })

    setOverdueCount(storage.getOverdueWrongCount(uid))
  }, [user?.id])   // ← 只依赖 userId 字符串，不依赖 user 对象引用

  // 当回到主页时刷新积压数
  useEffect(() => {
    if (page === 'home' && user?.id) {
      setOverdueCount(storage.getOverdueWrongCount(user.id))
    }
  }, [page, user])

  // 移动端音频解锁：首次用户交互时激活 AudioContext
  // iOS Safari / Android Chrome 要求音频必须在用户手势上下文内启动
  useEffect(() => {
    const handler = () => { unlockAudio() }
    window.addEventListener('touchstart', handler, { once: true, passive: true })
    window.addEventListener('click', handler, { once: true })
    return () => {
      window.removeEventListener('touchstart', handler)
      window.removeEventListener('click', handler)
    }
  }, [])

  function handleOnboarding(newUser) {
    storage.setUser(newUser)
    // 同设备切换账号：先尝试从 localStorage 恢复该用户宠物状态，避免短暂蛋态
    // 新设备/首次登录：localStorage 没有该用户数据，设 null 让云端异步恢复
    let restoredPetState = null
    try {
      const petKey = newUser.id ? `mv1_pet_state_${newUser.id}` : null
      if (petKey) {
        const cached = localStorage.getItem(petKey)
        if (cached) {
          const parsed = JSON.parse(cached)
          if (parsed?.currentPet?.poolId || parsed?.ownedPets?.length > 0) {
            restoredPetState = parsed
          }
        }
      }
    } catch (_) {}
    setGameState(restoredPetState)
    setUser(newUser)
    setPage('home')
    setActiveTab('home')
  }

  function startQuiz(opts = {}) {
    if (opts.selfTest) {
      setQuizOptions(opts)
      setPage('self_test')
    } else if (opts.politicsTag) {
      setQuizOptions(opts)
      setPage('politicsQuiz')
    } else if (opts.englishTag) {
      setEnglishQuizOptions(opts)
      setPage('englishQuiz')
    } else if (opts.reading) {
      setQuizOptions(opts)
      setPage('reading')
    } else if (opts.sentencePractice) {
      setQuizOptions(opts)
      setPage('sentence_practice')
    } else if (opts.essay) {
      setQuizOptions(opts)
      setPage('essay')
    } else if (opts.dictation) {
      setQuizOptions(opts)
      setPage('dictation')
    } else if (opts.lightningQuiz) {
      setQuizOptions(opts)
      setPage('lightning_quiz')
    } else if (opts.wrongReview) {
      setQuizOptions(opts)
      setPage('wrong_answers_quiz')
    } else {
      setQuizOptions(opts)
      setPage('quiz')
    }
  }

  function finishQuiz(result) {
    setSessionResult(result)
    setPage('result')
  }

  function goHome() {
    setPage('home')
    setSessionResult(null)
    setQuizOptions(null)
    setEnglishQuizOptions({})
    if (user?.id) setOverdueCount(storage.getOverdueWrongCount(user.id))
  }

  function handleLogout() {
    storage.logout()
    setUser(null)
    setPage('onboarding')
    setSessionResult(null)
    setQuizOptions(null)
    setActiveTab('home')
    // 清空宠物状态，防止下一个登录用户看到上一个用户的宠物
    setGameState(null)
  }

  function handleTabChange(tab) {
    setActiveTab(tab)
    setPage('home')
  }

  function startVariantTraining(question) {
    setVariantQuestion(question)
    setPage('variant_training')
  }

  // 是否显示底部导航（仅主界面）
  const showBottomNav = page === 'home' && user

  // 主页面内容
  const mainContent = () => {
    if (page === 'onboarding') return <OnboardingPage onDone={handleOnboarding} />
    if (page === 'quiz') return <QuizPage user={user} options={quizOptions} onFinish={finishQuiz} onBack={goHome} />
    if (page === 'reading') return <ReadingPage user={user} onFinish={finishQuiz} onBack={goHome} />
    if (page === 'sentence_practice') return <SentencePracticePage user={user} onBack={goHome} />
    if (page === 'essay') return <EssayPage user={user} onBack={goHome} />
    if (page === 'dictation') return <DictationPage user={user} subject={quizOptions?.dictationSubject} onBack={goHome} />
    if (page === 'lightning_quiz') return (
      <LightningQuizPage
        user={user}
        onFinish={(result) => { setSessionResult(result); setPage('result') }}
        onBack={() => { setPage('home'); setActiveSubject('english') }}
      />
    )
    if (page === 'self_test') return (
      <SelfTestPage
        user={user}
        subject={quizOptions?.selfTestSubject || 'chinese'}
        grade={grade}
        onBack={goHome}
      />
    )
    if (page === 'variant_training') return (
      <VariantTrainingPage
        question={variantQuestion}
        user={user}
        onBack={goHome}
      />
    )
    if (page === 'politics_home') return (
      <PoliticsHomePage
        user={user}
        onStartQuiz={startQuiz}
        onBack={() => { setPage('home'); setActiveSubject('politics') }}
      />
    )
    if (page === 'politicsQuiz') return (
      <PoliticsQuizPage
        user={user}
        options={quizOptions}
        onFinish={(result) => { setSessionResult(result); setPage('result'); setActiveSubject('politics') }}
        onBack={() => { setPage('home'); setActiveSubject('politics') }}
      />
    )
    if (page === 'wrong_answers_quiz') return (
      <WrongAnswersPage
        user={user}
        subject={activeSubject}
        onStartWrongQuiz={(ids) => { setQuizOptions({ wrongCardIds: ids }); setPage('quiz') }}
        onVariantTraining={startVariantTraining}
        onBack={goHome}
      />
    )
    if (page === 'result') return <ResultPage result={sessionResult} user={user} onHome={goHome} onRetry={() => startQuiz(quizOptions)} />
    if (page === 'report') return <ReportPage user={user} onBack={goHome} />
    if (page === 'englishQuiz' && englishQuizOptions.englishTag === 'en_association') return (
      <AssociationPlanetPage
        user={user}
        grade={grade}
        onFinish={(result) => { setSessionResult(result); setPage('result') }}
        onBack={() => { setPage('home'); setActiveSubject('english') }}
        onRetry={() => startQuiz({ ...englishQuizOptions, englishTag: 'en_association' })}
      />
    )
    if (page === 'englishQuiz' && englishQuizOptions.englishTag === 'en_association_j2') return (
      <WordPlanetPage
        user={user}
        grade="j2"
        onFinish={(result) => { setSessionResult(result); setPage('result') }}
        onBack={() => { setPage('home'); setActiveSubject('english') }}
        onRetry={() => startQuiz({ ...englishQuizOptions, englishTag: 'en_association_j2' })}
      />
    )
    if (page === 'englishQuiz' && englishQuizOptions.englishTag !== 'en_association') return (
      <EnglishQuizPage
        user={user}
        options={{ ...englishQuizOptions, grade }}
        onFinish={(result) => { setSessionResult(result); setPage('result') }}
        onBack={() => { setPage('home'); setActiveSubject('english') }}
      />
    )

    // 主页模式
    if (page === 'home') {
      if (activeTab === 'home' && user) {
        return (
          <>
            {/* 顶部栏：固定不动，只切换下方星球内容 */}
            <HomeHeader
              user={user}
              grade={grade}
              activeSubject={activeSubject}
              onSubjectChange={handleSubjectChange}
              onGradeChange={handleGradeChange}
              onReport={() => setPage('report')}
              onLogout={handleLogout}
            />

            {/* 星球内容区：按科目条件渲染，切换时只有这里变化 */}
            <div className="bg-gradient-to-b from-indigo-50 to-purple-50">
              {activeSubject === 'chinese' && (
                <HomePage
                  user={user}
                  onStartQuiz={startQuiz}
                  hideHeader
                  activeSubject={activeSubject}
                  grade={grade}
                />
              )}
              {activeSubject === 'english' && (
                <EnglishHomePage
                  user={user}
                  grade={grade}
                  onStartQuiz={startQuiz}
                />
              )}
              {activeSubject === 'politics' && (
                <PoliticsHomePage
                  user={user}
                  onStartQuiz={startQuiz}
                />
              )}
            </div>
          </>
        )
      }
      if (activeTab === 'pet') return (
        <MV1Demo
          key={user?.id || 'no-user'}
          onBack={() => setActiveTab('home')}
          initialState={gameState}
          onStateChange={setGameState}
          grade={grade}
        />
      )
      if (activeTab === 'rank') return <LeaderboardPage user={user} gameState={gameState} onStateChange={setGameState} />
      if (activeTab === 'wrong') return (
        <WrongAnswersPage
          user={user}
          subject={activeSubject}
          onStartWrongQuiz={(ids) => { setQuizOptions({ wrongCardIds: ids }); setPage('quiz') }}
          onVariantTraining={startVariantTraining}
          onBack={() => setActiveTab('home')}
        />
      )
    }
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-50" style={{ position: 'relative' }}>
      <div className="max-w-md mx-auto min-h-screen">
        <div style={{ paddingBottom: showBottomNav ? 64 : 0 }}>
          {mainContent()}
        </div>
      </div>
      {showBottomNav && (
        <BottomNav
          activeTab={activeTab}
          onTabChange={handleTabChange}
          overdueCount={overdueCount}
        />
      )}
      {showBottomNav && activeTab !== 'pet' && (
        <GlobalPetDock gameState={gameState} isLearning={activeTab === 'home'} />
      )}
    </div>
  )
}
