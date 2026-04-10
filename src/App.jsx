import { useState, useEffect } from 'react'
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
import MV1Demo from './pages/MV1Demo'
import EnglishHomePage from './pages/EnglishHomePage'
import EnglishQuizPage from './pages/EnglishQuizPage'
import WordPlanetPage from './pages/WordPlanetPage'
import AssociationPlanetPage from './pages/AssociationPlanetPage'
import { initGamificationState } from './utils/gamification'
import { fetchMV1State, upsertMV1State } from './utils/mv1_cloud'

// 底部导航栏（仅主界面可见）
function BottomNav({ activeTab, onTabChange, overdueCount }) {
  const tabs = [
    { key: 'home',   icon: '📚', label: '学习' },
    { key: 'pet',    icon: '🐉', label: '宠物' },
    { key: 'rank',   icon: '🏆', label: '排行' },
    { key: 'wrong',  icon: '💥', label: '错题' },
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
            {/* 激活指示点 */}
            {isActive && (
              <div style={{
                position: 'absolute', bottom: 0, left: '50%',
                transform: 'translateX(-50%)',
                width: 20, height: 3, borderRadius: 2,
                background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
              }} />
            )}
            {/* 错题红点 */}
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

// 排行榜占位页（即将上线）
function LeaderboardPlaceholder({ user }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 pb-24">
      <div style={{ fontSize: 72, marginBottom: 16 }}>🏆</div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1f2937', margin: '0 0 8px' }}>
        好友排行榜
      </h2>
      <p style={{ fontSize: 14, color: '#9ca3af', textAlign: 'center', lineHeight: 1.6, margin: '0 0 24px' }}>
        即将上线！到时候你可以看到好友的学习排名，互相比拼、共同进步 🚀
      </p>
      <div style={{
        background: 'linear-gradient(135deg, #f3e8ff, #e0e7ff)',
        borderRadius: 16, padding: '16px 24px',
        display: 'flex', alignItems: 'center', gap: 12,
        width: '100%', maxWidth: 280,
      }}>
        <div style={{ fontSize: 36 }}>📊</div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#4c1d95' }}>你的当前数据</div>
          <div style={{ fontSize: 11, color: '#7c3aed' }}>
            {user?.name} · 答题中...
          </div>
        </div>
      </div>
      <div style={{
        marginTop: 12,
        background: 'rgba(99,102,241,0.06)',
        borderRadius: 12, padding: '10px 20px',
        fontSize: 11, color: '#6b7280', textAlign: 'center',
      }}>
        🔔 上线时会第一时间通知你
      </div>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(() => storage.getUser())
  const [page, setPage] = useState(() => storage.getUser() ? 'home' : 'onboarding')
  const [activeTab, setActiveTab] = useState('home')
  const [sessionResult, setSessionResult] = useState(null)
  const [quizOptions, setQuizOptions] = useState(null)
  const [gameState, setGameState] = useState(() => initGamificationState())
  const [overdueCount, setOverdueCount] = useState(0)
  const [englishQuizOptions, setEnglishQuizOptions] = useState({})
  const [activeSubject, setActiveSubject] = useState('chinese')

  // 加载宠物游戏状态
  useEffect(() => {
    if (user?.id) {
      fetchMV1State(user.id).then((cloud) => {
        if (cloud) setGameState(cloud)
      })
      setOverdueCount(storage.getOverdueWrongCount(user.id))
    }
  }, [user])

  // 当回到主页时刷新积压数
  useEffect(() => {
    if (page === 'home' && user?.id) {
      setOverdueCount(storage.getOverdueWrongCount(user.id))
    }
  }, [page, user])

  function handleOnboarding(newUser) {
    storage.setUser(newUser)
    setUser(newUser)
    setPage('home')
    setActiveTab('home')
  }

  function startQuiz(opts = {}) {
    if (opts.englishTag) {
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
  }

  function handleTabChange(tab) {
    setActiveTab(tab)
    setPage('home') // 确保回到主页模式
    // 切换 tab 时重置科目到语文（避免英语主页残留在非学习tab）
    if (tab !== 'home') setActiveSubject('chinese')
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
    if (page === 'wrong_answers_quiz') return (
      <WrongAnswersPage
        user={user}
        onStartWrongQuiz={(ids) => { setQuizOptions({ wrongCardIds: ids }); setPage('quiz') }}
        onBack={goHome}
      />
    )
    if (page === 'result') return <ResultPage result={sessionResult} user={user} onHome={goHome} onRetry={() => startQuiz(quizOptions)} />
    if (page === 'report') return <ReportPage user={user} onBack={goHome} />
    if (page === 'englishQuiz' && englishQuizOptions.englishTag === 'en_words') return (
      <WordPlanetPage
        user={user}
        onFinish={(result) => { setSessionResult(result); setPage('result') }}
        onBack={() => { setPage('home'); setActiveSubject('english') }}
      />
    )
    if (page === 'englishQuiz' && englishQuizOptions.englishTag === 'en_association') return (
      <AssociationPlanetPage
        user={user}
        onFinish={(result) => { setSessionResult(result); setPage('result') }}
        onBack={() => { setPage('home'); setActiveSubject('english') }}
      />
    )
    if (page === 'englishQuiz' && englishQuizOptions.englishTag !== 'en_words' && englishQuizOptions.englishTag !== 'en_association') return (
      <EnglishQuizPage
        user={user}
        options={englishQuizOptions}
        onFinish={(result) => { setSessionResult(result); setPage('result') }}
        onBack={() => { setPage('home'); setActiveSubject('english') }}
      />
    )

    // 主页模式：根据 activeTab 渲染
    if (page === 'home') {
      if (activeTab === 'home') {
        // 英语主页
        if (activeSubject === 'english') return (
          <EnglishHomePage
            user={user}
            onStartQuiz={startQuiz}
            onBack={() => setActiveSubject('chinese')}
          />
        )
        // 语文主页（默认）
        return (
          <HomePage
            user={user}
            onStartQuiz={startQuiz}
            onReport={() => setPage('report')}
            onLogout={handleLogout}
            onSubjectChange={setActiveSubject}
            activeSubject={activeSubject}
          />
        )
      }
      if (activeTab === 'pet') return (
        <MV1Demo
          onBack={() => setActiveTab('home')}
          initialState={gameState}
          onStateChange={setGameState}
        />
      )
      if (activeTab === 'rank') return <LeaderboardPlaceholder user={user} />
      if (activeTab === 'wrong') return (
        <WrongAnswersPage
          user={user}
          subject={activeSubject}
          onStartWrongQuiz={(ids) => { setQuizOptions({ wrongCardIds: ids }); setPage('quiz') }}
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
    </div>
  )
}
