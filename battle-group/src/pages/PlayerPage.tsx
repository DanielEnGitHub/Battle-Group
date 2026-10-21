import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { SOCKET_URL } from '../config'
import type {
  ActiveQuestion,
  AnswerResult,
  GameStateSnapshot,
  PodiumData,
  QuestionResults,
  SessionData,
  Team,
} from '../types/game'
import TeamRegister   from '../components/player/TeamRegister'
import WaitingLobby   from '../components/player/WaitingLobby'
import QuestionView   from '../components/player/QuestionView'
import AnsweredView   from '../components/player/AnsweredView'
import Podium         from '../components/shared/Podium'

type PlayerPhase = 'register' | 'reconnecting' | 'ended' | 'lobby' | 'question' | 'answered' | 'results' | 'podium'

const SESSION_KEY = 'versus_session'

function loadSession(): SessionData | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

export default function PlayerPage() {
  // Lazy init: io() must run once, not on every render
  const [socket]         = useState(() => io(SOCKET_URL))
  const [initialSession] = useState(loadSession)
  // Ref so socket listeners read the current session without stale closures
  const sessionRef       = useRef<SessionData | null>(initialSession)

  const [phase,           setPhase]           = useState<PlayerPhase>(initialSession ? 'reconnecting' : 'register')
  const [session,         setSession]         = useState<SessionData | null>(initialSession)
  const [teams,           setTeams]           = useState<Team[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<ActiveQuestion | null>(null)
  const [answerResult,    setAnswerResult]    = useState<AnswerResult | null>(null)
  const [myAnswerIndex,   setMyAnswerIndex]   = useState<number | null>(null)
  const [correctIndex,    setCorrectIndex]    = useState<number | null>(null)
  const [podiumData,      setPodiumData]      = useState<PodiumData | null>(null)
  const [notice,          setNotice]          = useState<string | null>(null)

  const clearRound = () => {
    setAnswerResult(null)
    setMyAnswerIndex(null)
    setCorrectIndex(null)
  }

  // Forgets the session on this device and resets every game view
  const closeSession = (nextPhase: PlayerPhase) => {
    sessionRef.current = null
    setSession(null)
    localStorage.removeItem(SESSION_KEY)
    setCurrentQuestion(null)
    clearRound()
    setPodiumData(null)
    setPhase(nextPhase)
  }

  useEffect(() => {
    // Rejoins on first connect and after any network drop (socket.io rotates the socket id).
    // The server keeps an absent player for 5 minutes; after that the session is gone.
    const rejoin = () => {
      if (sessionRef.current) socket.emit('join_room', { ...sessionRef.current, resume: true })
    }
    socket.on('connect', rejoin)
    if (socket.connected) rejoin()

    socket.on('session_expired', () => {
      setNotice('Tu sesión terminó. Ingresa de nuevo para jugar.')
      closeSession('register')
    })

    socket.on('session_ended', () => closeSession('ended'))

    socket.on('game_state', (state: GameStateSnapshot) => {
      setTeams(state.teams)
      if (!sessionRef.current) return
      if (state.phase === 'podium') {
        setPhase('podium')
      } else if (state.phase === 'lobby') {
        // Initial lobby, or the admin reset the game: everyone goes back to the lobby
        setPhase('lobby')
        setCurrentQuestion(null)
        clearRound()
        setPodiumData(null)
      }
    })

    socket.on('teams_update', (updatedTeams: Team[]) => setTeams(updatedTeams))

    socket.on('question_start', (q: ActiveQuestion) => {
      setCurrentQuestion(q)
      clearRound()
      setPhase('question')
    })

    socket.on('answer_result', (result: AnswerResult) => {
      setAnswerResult(result)
      if (result.optionIndex !== undefined) setMyAnswerIndex(result.optionIndex)
      setPhase('answered')
    })

    socket.on('question_results', (results: QuestionResults) => {
      setCorrectIndex(results.correctIndex >= 0 ? results.correctIndex : null)
      setPhase('results')
    })

    socket.on('game_over', (data: PodiumData) => {
      // Session is kept: if the admin starts a new game, the player returns to the lobby
      setPodiumData(data)
      setPhase('podium')
    })

    // The admin reveals the podium step by step
    socket.on('podium_stage', (stage: number) => {
      setPodiumData(prev => (prev ? { ...prev, stage } : prev))
    })

    return () => { socket.disconnect() }
  }, [socket])

  const handleRegistered = (s: SessionData) => {
    sessionRef.current = s
    setSession(s)
    setNotice(null)
    localStorage.setItem(SESSION_KEY, JSON.stringify(s))
    setPhase('lobby')
  }

  const handleAnswer = (optionIndex: number) => {
    setMyAnswerIndex(optionIndex)
    socket.emit('submit_answer', { optionIndex })
  }

  const handleLogout = () => {
    localStorage.removeItem(SESSION_KEY)
    socket.emit('logout')
    socket.disconnect()
    window.location.reload()
  }

  const logoutButton = (label: string) => (
    <button onClick={handleLogout} className="btn btn-sm fixed bottom-5 right-5 z-40">
      {label}
    </button>
  )

  // ── Render ────────────────────────────────────────────────────────────────

  if (phase === 'register') {
    return <TeamRegister socket={socket} notice={notice} onRegistered={handleRegistered} />
  }

  if (phase === 'ended') {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center gap-4 px-5 text-center">
        <h1 className="game-title text-4xl md:text-5xl animate-bounce-in">Sesión finalizada</h1>
        <p className="text-ink-soft text-lg max-w-xs">Gracias por participar.</p>
        <button onClick={() => setPhase('register')} className="btn btn-lg mt-2">
          Ingresar de nuevo
        </button>
      </div>
    )
  }

  if (phase === 'reconnecting') {
    return (
      <>
        <div className="min-h-dvh flex flex-col items-center justify-center gap-3 px-5 text-center">
          <h1 className="game-title text-4xl">Reconectando</h1>
          <p className="text-ink-soft">{session?.teamName}</p>
          <span className="loading-dots text-highlight" aria-hidden><span /><span /><span /></span>
        </div>
        {logoutButton('Salir')}
      </>
    )
  }

  if (phase === 'podium' && podiumData) {
    // Players can only leave once the admin has revealed the whole podium
    const podiumFinished = podiumData.stage > podiumData.podium.length
    return (
      <>
        <Podium
          podium={podiumData.podium}
          stage={podiumData.stage}
          totalPoints={podiumData.totalPoints}
          myTeamName={session?.teamName}
        />
        {podiumFinished && logoutButton('Salir del juego')}
      </>
    )
  }

  if (phase === 'question' && currentQuestion) {
    return (
      <QuestionView
        key={currentQuestion.index}
        question={currentQuestion}
        onAnswer={handleAnswer}
      />
    )
  }

  if ((phase === 'answered' || phase === 'results') && currentQuestion) {
    return (
      <AnsweredView
        revealed={phase === 'results'}
        question={currentQuestion}
        result={answerResult}
        myAnswerIndex={myAnswerIndex}
        correctIndex={correctIndex}
      />
    )
  }

  return (
    <>
      <WaitingLobby teamName={session?.teamName ?? ''} teams={teams} />
      {logoutButton('Salir del juego')}
    </>
  )
}
