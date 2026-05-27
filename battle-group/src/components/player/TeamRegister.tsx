import { useState } from 'react'
import type { Socket } from 'socket.io-client'
import type { SessionData } from '../../types/game'

interface Props {
  socket: Socket
  onRegistered: (session: SessionData) => void
}

export default function TeamRegister({ socket, onRegistered }: Props) {
  const [teamName, setTeamName] = useState('')
  const [error,    setError]    = useState<string | null>(null)
  const [loading,  setLoading]  = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const name = teamName.trim()
    if (!name) return

    setLoading(true)
    setError(null)

    // Generar sessionId único — persiste en localStorage para reconexiones
    const sessionId = `vs_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`

    // Limpiar listeners previos para evitar duplicados en reintentos
    socket.off('join_success')
    socket.off('join_error')

    socket.once('join_success', ({ team }) => {
      const session: SessionData = { teamName: team.name, sessionId: team.sessionId }
      localStorage.setItem('versus_session', JSON.stringify(session))
      onRegistered(session)
      setLoading(false)
    })

    socket.once('join_error', ({ message }: { message: string }) => {
      setError(message)
      setLoading(false)
    })

    socket.emit('join_room', { teamName: name, sessionId })
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-[#0a0a0f]">
      {/* Logo */}
      <div className="mb-8 text-center animate-fade-slide-up">
        <div className="text-6xl mb-3">🏎️</div>
        <h1 className="text-5xl font-black tracking-tight text-white">
          <span className="text-yellow-400">VERSUS</span>
        </h1>
        <p className="text-zinc-500 text-sm mt-2">Carrera de trivia en tiempo real</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-[#12121a] border border-[#2a2a3a] rounded-2xl p-6 animate-fade-slide-up">
        <h2 className="text-lg font-bold text-white mb-5 text-center">
          ¿Cómo se llama tu equipo?
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={teamName}
            onChange={e => { setTeamName(e.target.value); setError(null) }}
            placeholder="Nombre del equipo..."
            maxLength={24}
            autoFocus
            className="w-full px-4 py-3 bg-[#1a1a2e] border border-[#2a2a3a] rounded-xl
                       text-white placeholder-zinc-600 text-lg
                       focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/30
                       transition-colors"
          />

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={!teamName.trim() || loading}
            className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40
                       disabled:cursor-not-allowed text-black font-black text-lg rounded-xl
                       transition-all active:scale-95 uppercase tracking-widest"
          >
            {loading ? '...' : '¡UNIRSE!'}
          </button>
        </form>
      </div>
    </div>
  )
}
