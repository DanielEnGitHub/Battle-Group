import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { API_URL, SOCKET_URL } from '../config'
import type {
  ActiveQuestion,
  GameConfig,
  GameStateSnapshot,
  PodiumData,
  QuestionResults,
  Team,
} from '../types/game'
import QuizManager      from '../components/admin/QuizManager'
import AdminLobby       from '../components/admin/AdminLobby'
import AdminGameControl from '../components/admin/AdminGameControl'
import Podium           from '../components/shared/Podium'

type AdminPhase = 'quiz-manager' | 'lobby' | 'question' | 'results' | 'podium'

const clientPort = window.location.port ? `:${window.location.port}` : ''

export default function AdminPage() {
  const socketRef = useRef<Socket | null>(null)

  const [phase,           setPhase]           = useState<AdminPhase>('quiz-manager')
  const [quizName,        setQuizName]        = useState('')
  const [bankSize,        setBankSize]        = useState(0)
  const [teams,           setTeams]           = useState<Team[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<ActiveQuestion | null>(null)
  const [answersCount,    setAnswersCount]    = useState(0)
  const [questionResults, setQuestionResults] = useState<QuestionResults | null>(null)
  const [podiumData,      setPodiumData]      = useState<PodiumData | null>(null)
  const [joinUrls,        setJoinUrls]        = useState<string[]>([])

  useEffect(() => {
    fetch(`${API_URL}/network`)
      .then(res => res.json())
      .then(({ ips }: { ips: string[] }) => {
        setJoinUrls(ips.length ? ips.map(ip => `http://${ip}${clientPort}`) : [window.location.origin])
      })
      .catch(() => setJoinUrls([window.location.origin]))
  }, [])

  useEffect(() => {
    const socket = io(SOCKET_URL)
    socketRef.current = socket
    // Re-join the admin room after every (re)connect, otherwise a network drop silently stops updates
    socket.on('connect', () => socket.emit('admin_join'))

    socket.on('game_state', (state: GameStateSnapshot) => {
      setTeams(state.teams)
      setQuizName(state.quizName ?? '')
      setBankSize(state.bankSize)
      if (state.phase === 'lobby' && state.quizName) setPhase('lobby')
      else if (state.phase === 'question') setPhase('question')
      else if (state.phase === 'results')  setPhase('results')
      else if (state.phase === 'podium')   setPhase('podium')
    })

    socket.on('teams_update', (updatedTeams: Team[]) => setTeams(updatedTeams))

    socket.on('question_start', (q: ActiveQuestion) => {
      setCurrentQuestion(q)
      setAnswersCount(0)
      setQuestionResults(null)
      setPhase('question')
    })

    socket.on('answer_received', ({ answersCount: count }: { answersCount: number }) => {
      setAnswersCount(count)
    })

    socket.on('question_results', (results: QuestionResults) => {
      setQuestionResults(results)
      setPhase('results')
    })

    socket.on('game_over', (data: PodiumData) => {
      setPodiumData(data)
      setPhase('podium')
    })

    socket.on('podium_stage', (stage: number) => {
      setPodiumData(prev => (prev ? { ...prev, stage } : prev))
    })

    return () => { socket.disconnect() }
  }, [])

  const emit = (event: string, payload?: object) =>
    socketRef.current?.emit(event, payload)

  const handleSelectQuiz    = (quizId: string)     => emit('select_quiz', { quizId })
  const handleStart         = (config: GameConfig) => emit('start_game', config)
  const handleNextQuestion  = ()                   => emit('next_question')
  const handleRevealResults = ()                   => emit('reveal_results')
  const handlePodiumNext    = ()                   => emit('podium_next')

  const backToQuizManager = () => {
    setPhase('quiz-manager')
    setCurrentQuestion(null)
    setQuestionResults(null)
    setPodiumData(null)
    setAnswersCount(0)
  }

  // Same players, new game
  const handleReset = () => {
    emit('reset_game')
    backToQuizManager()
  }

  // Closes every player session
  const handleEnd = () => {
    if (!confirm('¿Terminar la sesión? Todos los jugadores saldrán del juego.')) return
    emit('end_session')
    backToQuizManager()
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (phase === 'podium' && podiumData) {
    // One step per podium place, plus the final step for the full table
    const podiumFinished = podiumData.stage > podiumData.podium.length
    return (
      <>
        <Podium
          podium={podiumData.podium}
          all={podiumData.all}
          stage={podiumData.stage}
          totalPoints={podiumData.totalPoints}
        />
        <div className="fixed bottom-5 right-5 z-40 flex gap-3">
          {podiumFinished ? (
            <button onClick={handleReset} className="btn">Nueva partida</button>
          ) : (
            <button onClick={handlePodiumNext} className="btn btn-lg animate-glow">Siguiente</button>
          )}
          <button onClick={handleEnd} className="btn self-end">Terminar</button>
        </div>
      </>
    )
  }

  if (phase === 'quiz-manager') {
    return <QuizManager apiUrl={API_URL} onSelectQuiz={handleSelectQuiz} />
  }

  if (phase === 'lobby') {
    return (
      <AdminLobby
        key={quizName}
        teams={teams}
        quizName={quizName}
        bankSize={bankSize}
        joinUrls={joinUrls}
        onStart={handleStart}
        onBack={handleReset}
        onEnd={handleEnd}
      />
    )
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-dvh grid place-items-center">
        <span className="flex items-center gap-3 font-display text-2xl">
          Cargando
          <span className="loading-dots" aria-hidden><span /><span /><span /></span>
        </span>
      </div>
    )
  }

  return (
    <AdminGameControl
      key={currentQuestion.index}
      phase={phase as 'question' | 'results'}
      question={currentQuestion}
      answersCount={answersCount}
      teams={teams}
      questionResults={questionResults}
      onRevealResults={handleRevealResults}
      onNextQuestion={handleNextQuestion}
      onEnd={handleEnd}
    />
  )
}
