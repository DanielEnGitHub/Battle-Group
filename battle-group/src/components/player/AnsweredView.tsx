import type { AnswerResult, Team } from '../../types/game'
import RaceTrack from '../shared/RaceTrack'

interface Props {
  result: AnswerResult | null
  racePositions: Team[]
  teamName: string
}

export default function AnsweredView({ result, racePositions, teamName }: Props) {
  return (
    <div className="min-h-dvh flex flex-col bg-[#0a0a0f]">
      {/* Resultado de la respuesta */}
      <div className={`p-5 text-center border-b border-[#2a2a3a] ${
        result
          ? result.correct ? 'bg-green-950/40' : 'bg-red-950/40'
          : 'bg-[#12121a]'
      }`}>
        {result ? (
          <div className="flex flex-col items-center gap-1 animate-bounce-in">
            <span className="text-4xl">{result.correct ? '✅' : '❌'}</span>
            <span className={`font-black text-xl ${
              result.correct ? 'text-green-400' : 'text-red-400'
            }`}>
              {result.correct ? `+${result.points.toFixed(1)} pts` : 'Sin puntos'}
            </span>
            <span className="text-zinc-500 text-xs">
              Respondiste en {(result.timeMs / 1000).toFixed(2)}s
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-zinc-400 text-sm">
            <span className="animate-spin">⏳</span>
            Esperando resultados...
          </div>
        )}
      </div>

      {/* Carrera en vivo */}
      <div className="flex-1 p-4 flex flex-col">
        <p className="text-xs text-zinc-500 uppercase tracking-widest text-center mb-3">
          Carrera en vivo
        </p>
        {racePositions.length > 0 ? (
          <div className="flex-1">
            <RaceTrack teams={racePositions} highlightTeam={teamName} compact />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-700 text-sm">
            Esperando que otros equipos respondan...
          </div>
        )}
      </div>
    </div>
  )
}
