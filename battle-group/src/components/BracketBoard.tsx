import type { Bracket, ResolvedMatch } from '../types/bracket'
import MatchCard, { type Draft } from './MatchCard'

interface Props {
  bracket: Bracket
  resolved: ResolvedMatch[]
  /** Si se omite → tablero de solo lectura (admin). */
  editable?: boolean
  drafts?: Record<number, Draft>
  onChange?: (matchId: number, draft: Draft) => void
  /** false → sin scroll horizontal propio (para captura / cuando el contenedor scrollea). */
  scroll?: boolean
}

export default function BracketBoard({
  bracket, resolved, editable = false, drafts, onChange, scroll = true,
}: Props) {
  const byRound = (roundId: string) => resolved.filter(m => m.round === roundId)

  return (
    <div className={`flex gap-6 pb-4 ${scroll ? 'overflow-x-auto' : 'w-max'}`}>
      {bracket.rounds.map(round => (
        <div key={round.id} className="flex shrink-0 flex-col gap-3">
          <h3 className="sticky top-0 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            {round.name}
          </h3>
          {byRound(round.id).map(match => (
            <MatchCard
              key={match.id}
              match={match}
              editable={editable}
              draft={drafts?.[match.id]}
              onChange={d => onChange?.(match.id, d)}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
