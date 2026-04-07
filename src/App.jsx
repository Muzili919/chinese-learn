import { useState, useEffect } from 'react'
import { storage } from './utils/storage'
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
import GlobalPetDock from './components/GlobalPetDock'
import { initGamificationState } from './utils/gamification'
import { fetchMV1State, upsertMV1State } from './utils/mv1_cloud'

export default function App() {
  const [page, setPage] = useState('onboarding')
  const [user, setUser] = useState(null)
  const [sessionResult, setSessionResult] = useState(null)
  const [quizOptions, setQuizOptions] = useState(null)
  const [gameState, setGameState] = useState(() => initGamificationState())

  // 加载宠物游戏状态
  useEffect(() => {
    if (user?.id) {
      fetchMV1State(user.id).then((cloud) => {
        if (cloud) setGameState(cloud)
      })
    }
  }, [user])

  function handleOnboarding(newUser) {
    storage.setUser(newUser)
    setUser(newUser)
    setPage('home')
  }

  function startQuiz(opts = {}) {
    setQuizOptions(opts)
    if (opts.reading) setPage('reading')
    else if (opts.sentencePractice) setPage('sentence_practice')
    else if (opts.essay) setPage('essay')
    else if (opts.wrongReview) setPage('wrong_answers')
    else setPage('quiz')
  }

  function finishQuiz(result) {
    setSessionResult(result)
    setPage('result')
  }

  function goHome() {
    setPage('home')
    setSessionResult(null)
    setQuizOptions(null)
  }

  function handleLogout() {
    storage.logout()
    setUser(null)
    setPage('onboarding')
    setSessionResult(null)
    setQuizOptions(null)
  }

  const pages = {
    onboarding: <OnboardingPage onDone={handleOnboarding} />,
    home: <HomePage user={user} onStartQuiz={startQuiz} onReport={() => setPage('report')} onLogout={handleLogout} onOpenMV1={() => setPage('mv1_demo')} />,
    mv1_demo: <MV1Demo onBack={goHome} initialState={gameState} onStateChange={setGameState} />,
    quiz: <QuizPage user={user} options={quizOptions} onFinish={finishQuiz} onBack={goHome} />,
    reading: <ReadingPage user={user} onFinish={finishQuiz} onBack={goHome} />,
    sentence_practice: <SentencePracticePage user={user} onBack={goHome} />,
    essay: <EssayPage user={user} onBack={goHome} />,
    wrong_answers: <WrongAnswersPage user={user} onStartWrongQuiz={(ids) => { setQuizOptions({ wrongCardIds: ids }); setPage('quiz') }} onBack={goHome} />,
    result: <ResultPage result={sessionResult} user={user} onHome={goHome} onRetry={() => startQuiz(quizOptions)} />,
    report: <ReportPage user={user} onBack={goHome} />,
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-purple-50" style={{ position: 'relative' }}>
      <GlobalPetDock gameState={gameState} />
      <div className="max-w-md mx-auto min-h-screen">
        {pages[page]}
      </div>
    </div>
  )
}
