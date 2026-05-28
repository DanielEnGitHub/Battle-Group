import type { Team } from '../../types/game'
import RaceTrack from '../shared/RaceTrack'
import { CAR_COLORS } from '../../constants/colors'

interface Props {
  teams: Team[]
  quizName: string
  onStart: () => void
  onBack: () => void
}

export default function AdminLobby({ teams, quizName, onStart, onBack }: Props) {
  return (
    <div className="min-h-dvh bg-[#0a0a0f] flex flex-col md:flex-row">
      {/* Panel izquierdo: control */}
      <div className="w-full md:w-96 flex-shrink-0 flex flex-col p-6 border-r border-[#2a2a3a]">
        <button
          onClick={onBack}
          className="text-zinc-500 hover:text-white text-sm mb-6 text-left transition-colors w-fit"
        >
          ← Cambiar quiz
        </button>

        <div className="mb-6">
          <h1 className="text-3xl font-black text-yellow-400">VERSUS</h1>
          <p className="text-white font-bold text-xl mt-1">{quizName}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-zinc-500 text-sm">Sala abierta</span>
          </div>
        </div>

        {/* Lista de equipos */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">
            Equipos ({teams.length})
          </p>

          {teams.length === 0 ? (
            <div className="text-center py-10 text-zinc-600">
              <div className="text-3xl mb-2 animate-bounce">📱</div>
              <p className="text-sm">Esperando jugadores...</p>
              <p className="text-xs mt-1 text-zinc-700">
                Compartí la IP de red con el grupo
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {teams.map((t, i) => (
                <div
                  key={t.sessionId || t.socketId}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl
                             bg-[#12121a] border border-[#2a2a3a] animate-fade-slide-up"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: CAR_COLORS[i % CAR_COLORS.length] }}
                  />
                  <span className="text-white text-sm font-medium">{t.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onStart}
          disabled={teams.length === 0}
          className="mt-6 w-full py-4 bg-green-500 hover:bg-green-400 disabled:opacity-30
                     disabled:cursor-not-allowed text-white font-black text-xl rounded-xl
                     uppercase tracking-widest transition-all active:scale-95 shadow-lg"
        >
          🚦 ¡INICIAR!
        </button>
      </div>

      {/* Panel derecho: preview de la carrera */}
      <div className="flex-1 p-6 flex flex-col">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4 text-center">
          Vista previa de la carrera
        </p>
        <div className="flex-1">
          <RaceTrack teams={teams} />
        </div>
      </div>
    </div>
  )
}
