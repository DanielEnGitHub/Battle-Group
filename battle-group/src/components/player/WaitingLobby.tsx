import type { Team } from '../../types/game'

const TEAM_EMOJIS = ['🔴','🟡','🔵','🟢','🟠','🟣','🩵','🩷']

interface Props {
  teamName: string
  teams: Team[]
}

export default function WaitingLobby({ teamName, teams }: Props) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 bg-[#0a0a0f]">
      {/* Status */}
      <div className="mb-8 text-center animate-fade-slide-up">
        <div className="text-5xl mb-4 animate-bounce">🏎️</div>
        <h1 className="text-2xl font-black text-yellow-400 uppercase tracking-wide">
          ¡Listo para la carrera!
        </h1>
        <p className="text-zinc-400 mt-2 text-sm">
          Hola, <span className="text-white font-bold">{teamName}</span>
        </p>
      </div>

      {/* Waiting indicator */}
      <div className="w-full max-w-sm bg-[#12121a] border border-[#2a2a3a] rounded-2xl p-5">
        <div className="flex items-center justify-center gap-2 text-zinc-400 mb-5">
          <span className="inline-block w-2 h-2 bg-yellow-400 rounded-full animate-ping" />
          <span className="text-sm">Esperando que el admin inicie...</span>
        </div>

        {teams.length > 0 && (
          <>
            <p className="text-xs text-zinc-500 uppercase tracking-widest text-center mb-3">
              Equipos en la sala ({teams.length})
            </p>
            <div className="space-y-2">
              {teams.map((t, i) => (
                <div
                  key={t.sessionId || i}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                    t.name === teamName
                      ? 'bg-yellow-400/10 border border-yellow-400/30'
                      : 'bg-[#1a1a2e]'
                  }`}
                >
                  <span className="text-base">{TEAM_EMOJIS[i % TEAM_EMOJIS.length]}</span>
                  <span className={`text-sm font-medium ${
                    t.name === teamName ? 'text-yellow-400' : 'text-white'
                  }`}>
                    {t.name}
                    {t.name === teamName && (
                      <span className="text-yellow-600 text-xs ml-2">(tú)</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
