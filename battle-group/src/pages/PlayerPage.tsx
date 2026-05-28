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

type PlayerPhase = 'register' | 'lobby' | 'question' | 'answered' | 'results' | 'podium'

const INACTIVITY_MS = 3 * 60 * 1000

export default function PlayerPage() {
  const socketRef       = useRef(io(SOCKET_URL))
  const socket          = socketRef.current
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Ref para acceder a la sesión dentro de listeners sin stale closure
  const sessionRef      = useRef<SessionData | null>(null)

  const [phase,           setPhase]           = useState<PlayerPhase>('register')
  const [session,         setSession]         = useState<SessionData | null>(null)
  const [teams,           setTeams]           = useState<Team[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<ActiveQuestion | null>(null)
  const [answerResult,    setAnswerResult]    = useState<AnswerResult | null>(null)
  const [racePositions,   setRacePositions]   = useState<Team[]>([])
  const [podiumData,      setPodiumData]      = useState<PodiumData | null>(null)

  const resetInactivityTimer = () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    inactivityTimer.current = setTimeout(() => {
      localStorage.removeItem('versus_session')
      window.location.reload()
    }, INACTIVITY_MS)
  }

  const registerSession = (s: SessionData) => {
    sessionRef.current = s
    setSession(s)
  }

  useEffect(() => {
    // ── Reconexión automática al reconectar el socket ─────────────────────
    // socket.io cambia el socket ID en cada reconexión. Sin esto, el servidor
    // no encuentra al jugador en game.teams y no aparece en el listado.
    socket.on('connect', () => {
      if (sessionRef.current) {
        socket.emit('join_room', sessionRef.current)
      }
    })

    socket.on('game_state', (state: GameStateSnapshot) => {
      setTeams(state.teams)
      if (state.phase === 'podium') {
        setPhase('podium')
      } else if (state.phase === 'lobby' && sessionRef.current) {
        // Admin reinició la partida → todos vuelven al lobby
        setPhase('lobby')
        setCurrentQuestion(null)
        setAnswerResult(null)
        setRacePositions([])
        setPodiumData(null)
      }
    })

    socket.on('teams_update', (updatedTeams: Team[]) => {
      setTeams(updatedTeams)
    })

    socket.on('question_start', (q: ActiveQuestion) => {
      setCurrentQuestion(q)
      setAnswerResult(null)
      setRacePositions([])
      setPhase('question')
      resetInactivityTimer()
    })

    socket.on('answer_result', (result: AnswerResult) => {
      setAnswerResult(result)
      setPhase('answered')
    })

    socket.on('race_update', (positions: Team[]) => {
      setRacePositions(positions)
    })

    socket.on('question_results', (results: QuestionResults) => {
      setRacePositions(results.leaderboard)
      setPhase('results')
    })

    socket.on('game_over', (data: PodiumData) => {
      setPodiumData(data)
      setPhase('podium')
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
      // No borramos localStorage: si admin resetea, el jugador vuelve al lobby
      // automáticamente sin necesidad de recargar
    })

    // ── Primera carga: reconectar desde localStorage ───────────────────────
    // El evento 'connect' de arriba maneja las reconexiones posteriores.
    // Este bloque solo aplica al cargar la página por primera vez.
    const saved = localStorage.getItem('versus_session')
    if (saved) {
      try {
        const savedSession: SessionData = JSON.parse(saved)
        registerSession(savedSession)
        socket.emit('join_room', savedSession)
        socket.once('join_error', () => {
          sessionRef.current = null
          setSession(null)
          localStorage.removeItem('versus_session')
          setPhase('register')
        })
      } catch {
        localStorage.removeItem('versus_session')
      }
    }

    return () => {
      socket.disconnect()
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    }
  }, [socket])

  const handleRegistered = (s: SessionData) => {
    registerSession(s)
    setPhase('lobby')
    resetInactivityTimer()
  }

  const handleAnswer = (optionIndex: number) => {
    socket.emit('submit_answer', { optionIndex })
    resetInactivityTimer()
  }

  const handleLogout = () => {
    localStorage.removeItem('versus_session')
    socket.emit('logout')
    socket.disconnect()
    window.location.reload()
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (phase === 'register') {
    return <TeamRegister socket={socket} onRegistered={handleRegistered} />
  }

  if (phase === 'podium' && podiumData) {
    return (
      <div className="relative">
        <Podium podium={podiumData.podium} all={podiumData.all} myTeamName={session?.teamName} />
        <button
          onClick={handleLogout}
          className="fixed bottom-4 right-4 text-xs text-zinc-500 hover:text-red-400
                     px-3 py-2 rounded-lg border border-[#2a2a3a] hover:border-red-900/50
                     transition-colors bg-[#12121a]"
        >
          Salir del juego
        </button>
      </div>
    )
  }

  if (phase === 'question' && currentQuestion) {
    return (
      <QuestionView
        question={currentQuestion}
        onAnswer={handleAnswer}
      />
    )
  }

  if ((phase === 'answered' || phase === 'results') && currentQuestion) {
    return (
      <AnsweredView
        result={answerResult}
        racePositions={racePositions}
        teamName={session?.teamName ?? ''}
      />
    )
  }

  return (
    <div className="relative">
      <WaitingLobby
        teamName={session?.teamName ?? ''}
        teams={teams}
      />
      <button
        onClick={handleLogout}
        className="fixed bottom-4 right-4 text-xs text-zinc-600 hover:text-red-400
                   px-3 py-2 rounded-lg border border-[#2a2a3a] hover:border-red-900/50
                   transition-colors bg-[#12121a]"
      >
        Salir
      </button>
    </div>
  )
}
