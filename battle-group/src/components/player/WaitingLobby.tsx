import type { Team } from '../../types/game'
import Avatar from '../shared/Avatar'

interface Props {
  teamName: string
  teams: Team[]
}

export default function WaitingLobby({ teamName, teams }: Props) {
  const me = teams.find(t => t.name === teamName)

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-5 py-10 gap-6">
      <div className="text-center animate-bounce-in">
        <div className="flex justify-center mb-4 animate-float">
          <Avatar name={teamName} colorIndex={me?.joinIndex ?? 0} size={88} />
        </div>
        <h1 className="game-title text-4xl md:text-5xl">¡Prepárate!</h1>
        <p className="text-white/85 text-lg mt-1">{teamName}</p>
      </div>

      <div className="panel w-full max-w-sm p-5 animate-pop-in" style={{ animationDelay: '120ms' }}>
        <div className="flex flex-col items-center gap-2 text-center font-display text-xl text-highlight mb-5">
          <p className="text-balance">Espera a que inicie la clase</p>
          <span className="loading-dots" aria-hidden><span /><span /><span /></span>
        </div>

        <p className="text-ink-soft text-sm text-center mb-3">Jugadores ({teams.length})</p>
        <ul className="flex flex-wrap justify-center gap-2">
          {teams.map(t => (
            <li
              key={t.sessionId}
              className={`flex items-center gap-2 pl-1 pr-3 py-1 rounded-full animate-pop-in ${
                t.name === teamName ? 'row-me' : 'row-card'
              }`}
            >
              <Avatar name={t.name} colorIndex={t.joinIndex} size={26} />
              <span className="text-sm">{t.name}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-white/75 text-sm text-center max-w-xs">
        Nota: en caso de empate, gana quien responda más rápido.
      </p>
    </div>
  )
}
