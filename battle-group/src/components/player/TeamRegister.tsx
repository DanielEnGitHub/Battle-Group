import { useEffect, useRef, useState } from 'react'
import type { Socket } from 'socket.io-client'
import type { SessionData, Team } from '../../types/game'

interface Props {
  socket: Socket
  notice?: string | null
  onRegistered: (session: SessionData) => void
}

type JoinHandlers = {
  success: (payload: { team: Team }) => void
  error: (payload: { message: string }) => void
}

export default function TeamRegister({ socket, notice, onRegistered }: Props) {
  const [teamName, setTeamName] = useState('')
  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)
  const pending = useRef<JoinHandlers | null>(null)

  // Remove only this form's listeners; other components listen to the same events
  const clearPending = () => {
    if (!pending.current) return
    socket.off('join_success', pending.current.success)
    socket.off('join_error', pending.current.error)
    pending.current = null
  }

  useEffect(() => clearPending, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const name = teamName.trim()
    if (!name) return

    setLoading(true)
    setError(null)
    clearPending()

    // Identifies the player across reloads so the server can restore their progress
    const sessionId = `vs_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`

    const handlers: JoinHandlers = {
      success: ({ team }) => {
        clearPending()
        onRegistered({ teamName: team.name, sessionId: team.sessionId })
      },
      error: ({ message }) => {
        clearPending()
        setError(message)
        setLoading(false)
      },
    }
    pending.current = handlers
    socket.on('join_success', handlers.success)
    socket.on('join_error', handlers.error)

    socket.emit('join_room', { teamName: name, sessionId })
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-5 py-10">
      <img
        src="/logo-escuela.png"
        alt="Logo de la escuela"
        className="w-24 mb-5 drop-shadow-[0_6px_0_rgba(43,33,97,0.25)] animate-float"
      />
      <h1 className="game-title text-5xl md:text-6xl text-center leading-none mb-8 animate-bounce-in">
        ¿Listo para<br />comenzar?
      </h1>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-5 animate-pop-in"
        style={{ animationDelay: '150ms' }}
      >
        {notice && (
          <p role="status" className="panel px-4 py-3 text-center text-highlight">{notice}</p>
        )}
        <label htmlFor="player-name" className="block text-white text-center text-lg">
          Ingresa tu nombre
        </label>
        <input
          id="player-name"
          type="text"
          value={teamName}
          onChange={e => { setTeamName(e.target.value); setError(null) }}
          placeholder="Tu nombre"
          maxLength={24}
          autoFocus
          autoComplete="off"
          className="game-input text-xl text-center"
        />

        {error && (
          <p role="alert" className="text-pink text-center animate-shake">{error}</p>
        )}

        <button
          type="submit"
          disabled={!teamName.trim() || loading}
          className="btn btn-lg w-full"
        >
          {loading ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}
