import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { API_URL, SOCKET_URL } from '../config'
import type {
  ActiveQuestion,
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

export default function AdminPage() {
  const socketRef = useRef<Socket | null>(null)

  const [phase,           setPhase]           = useState<AdminPhase>('quiz-manager')
  const [quizName,        setQuizName]        = useState('')
  const [teams,           setTeams]           = useState<Team[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<ActiveQuestion | null>(null)
  const [answersCount,    setAnswersCount]    = useState(0)
  const [questionResults, setQuestionResults] = useState<QuestionResults | null>(null)
  const [racePositions,   setRacePositions]   = useState<Team[]>([])
  const [podiumData,      setPodiumData]      = useState<PodiumData | null>(null)

  useEffect(() => {
    const socket = io(SOCKET_URL)
    socketRef.current = socket
    socket.emit('admin_join')

    socket.on('game_state', (state: GameStateSnapshot) => {
      setTeams(state.teams)
      setQuizName(state.quizName ?? '')
      if (state.phase === 'lobby' && state.quizName) setPhase('lobby')
      else if (state.phase === 'question') setPhase('question')
      else if (state.phase === 'results')  setPhase('results')
      else if (state.phase === 'podium')   setPhase('podium')
    })

    socket.on('teams_update', (updatedTeams: Team[]) => setTeams(updatedTeams))

    socket.on('question_start', (q: ActiveQuestion) => {
      setCurrentQuestion(q)
      setAnswersCount(0)
      setPhase('question')
    })

    socket.on('answer_received', ({ answersCount: count }: { answersCount: number }) => {
      setAnswersCount(count)
    })

    socket.on('race_update', (positions: Team[]) => setRacePositions(positions))

    socket.on('question_results', (results: QuestionResults) => {
      setQuestionResults(results)
      setRacePositions(results.leaderboard)
      setPhase('results')
    })

    socket.on('game_over', (data: PodiumData) => {
      setPodiumData(data)
      setPhase('podium')
    })

    return () => socket.disconnect()
  }, [])

  const emit = (event: string, payload?: object) =>
    socketRef.current?.emit(event, payload)

  const handleSelectQuiz  = (quizId: string) => emit('select_quiz', { quizId })
  const handleNextQuestion = ()               => emit('next_question')
  const handleRevealResults = ()              => emit('reveal_results')
  const handleReset = () => {
    emit('reset_game')
    setPhase('quiz-manager')
    setCurrentQuestion(null)
    setRacePositions([])
    setPodiumData(null)
    setAnswersCount(0)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (phase === 'podium' && podiumData) {
    return (
      <div className="relative">
        <Podium podium={podiumData.podium} all={podiumData.all} />
        <button
          onClick={handleReset}
          className="fixed bottom-4 right-4 px-4 py-2 bg-[#12121a] border border-[#2a2a3a]
                     hover:border-yellow-400/50 text-white rounded-xl text-sm transition-colors"
        >
          🔄 Nueva Partida
        </button>
      </div>
    )
  }

  if (phase === 'quiz-manager') {
    return <QuizManager apiUrl={API_URL} onSelectQuiz={handleSelectQuiz} />
  }

  if (phase === 'lobby') {
    return (
      <AdminLobby
        teams={teams}
        quizName={quizName}
        onStart={handleNextQuestion}
        onBack={handleReset}
      />
    )
  }

  // question + results
  return (
    <AdminGameControl
      phase={phase as 'question' | 'results'}
      currentQuestion={currentQuestion}
      answersCount={answersCount}
      totalTeams={teams.length}
      questionResults={questionResults}
      racePositions={racePositions}
      onRevealResults={handleRevealResults}
      onNextQuestion={handleNextQuestion}
    />
  )
}
