import type { Team } from '../../types/game'

const CAR_COLORS = [
  '#FF4444', '#FFD700', '#4488FF', '#44FF88',
  '#FF8844', '#AA44FF', '#44FFFF', '#FF44AA',
]

const MEDALS   = { 1: '🥇', 2: '🥈', 3: '🥉' }
const HEIGHTS  = { 1: 'h-32', 2: 'h-20', 3: 'h-14' }
// Orden visual del podio: 2º izq, 1º centro, 3º der
const DISPLAY_ORDER = [1, 0, 2] as const

interface Props {
  podium: Team[]    // top 3
  all: Team[]       // todos para tabla completa
  myTeamName?: string
}

export default function Podium({ podium, all, myTeamName }: Props) {
  return (
    <div className="min-h-dvh flex flex-col items-center bg-[#0a0a0f] px-4 py-10">
      <h1 className="text-4xl font-black text-yellow-400 uppercase tracking-widest mb-1 animate-bounce-in">
        🏁 ¡Fin de Carrera!
      </h1>
      <p className="text-zinc-500 text-sm mb-10">Clasificación final</p>

      {/* Podio visual */}
      <div className="flex items-end gap-3 mb-12">
        {DISPLAY_ORDER.map(idx => {
          const team = podium[idx]
          if (!team) return null

          const rank    = (idx + 1) as 1 | 2 | 3
          const teamIdx = all.findIndex(t => t.name === team.name)
          const color   = CAR_COLORS[teamIdx % CAR_COLORS.length]
          const isMe    = team.name === myTeamName

          return (
            <div key={team.name} className="flex flex-col items-center gap-2 animate-bounce-in">
              <span className="text-3xl">{MEDALS[rank]}</span>

              <div
                className={`text-center px-3 py-1 rounded-xl text-sm font-bold ${
                  isMe ? 'ring-2 ring-white ring-offset-1 ring-offset-[#0a0a0f]' : ''
                }`}
                style={{ background: `${color}22`, color }}
              >
                {team.name}
                {isMe && <span className="text-white text-xs ml-1">(tú)</span>}
              </div>

              <span className="text-white font-black text-xl tabular-nums">
                {team.score.toFixed(1)}
                <span className="text-zinc-500 text-sm font-normal"> pts</span>
              </span>

              {/* Bloque del podio */}
              <div
                className={`w-24 ${HEIGHTS[rank]} rounded-t-xl flex items-center justify-center`}
                style={{ background: `${color}25`, border: `2px solid ${color}55` }}
              >
                <span className="text-4xl font-black" style={{ color }}>
                  {rank}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tabla completa si hay más de 3 equipos */}
      {all.length > 3 && (
        <div className="w-full max-w-sm">
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3 text-center">
            Todos los equipos
          </p>
          <div className="space-y-2">
            {all.slice(3).map((team, i) => {
              const isMe    = team.name === myTeamName
              const teamIdx = all.findIndex(t => t.name === team.name)
              const color   = CAR_COLORS[teamIdx % CAR_COLORS.length]

              return (
                <div
                  key={team.name}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
                    isMe
                      ? 'bg-yellow-400/10 border border-yellow-400/30'
                      : 'bg-[#12121a] border border-[#2a2a3a]'
                  }`}
                >
                  <span className="text-zinc-500 font-bold w-5 text-center text-sm">
                    {i + 4}
                  </span>
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className={`flex-1 font-medium text-sm ${isMe ? 'text-yellow-400' : 'text-white'}`}>
                    {team.name}
                  </span>
                  <span className="text-zinc-400 tabular-nums text-sm">
                    {team.score.toFixed(1)} pts
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
