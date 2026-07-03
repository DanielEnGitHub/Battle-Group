import type { ReactNode } from 'react'
import type { ResolvedMatch, Side } from '../types/bracket'
import { withFlag } from '../constants/flags'

export interface Draft {
  home: string
  away: string
  penWinner: Side | null
}

export type MatchSize = 'sm' | 'lg'

interface Props {
  match: ResolvedMatch
  editable: boolean
  draft?: Draft
  onChange?: (draft: Draft) => void
  size?: MatchSize
}

const TBD = 'Por definir'

export default function MatchCard({ match, editable, draft, onChange, size = 'sm' }: Props) {
  const { home, away, result, winner, locked, note } = match
  const big = size === 'lg'
  const bothKnown = !!home && !!away
  const isWinner = (team: string | null) => !!team && team === winner

  // ── Bloqueado o solo lectura: muestra el resultado tal cual ────────────────
  if (!editable || locked) {
    return (
      <Shell big={big} locked={locked}>
        <Row big={big} team={home} score={result?.home} win={isWinner(home)} />
        <Row big={big} team={away} score={result?.away} win={isWinner(away)} />
        {result?.penWinner && (
          <p className={`mt-1 text-amber-400/80 ${big ? 'text-sm' : 'text-[10px]'}`}>
            Penales: gana {withFlag(result.penWinner === 'home' ? home : away)}
          </p>
        )}
        {note && <p className={`mt-1 text-zinc-500 ${big ? 'text-sm' : 'text-[10px]'}`}>{note}</p>}
        {locked && (
          <span className={`absolute right-2 top-2 text-zinc-600 ${big ? 'text-xs' : 'text-[9px]'}`}>🔒 real</span>
        )}
      </Shell>
    )
  }

  // ── Editable pero faltan los equipos previos ───────────────────────────────
  if (!bothKnown) {
    return (
      <Shell big={big}>
        <p className={`text-center text-zinc-600 ${big ? 'py-8 text-base' : 'py-3 text-xs'}`}>
          Esperando partidos previos…
        </p>
      </Shell>
    )
  }

  // ── Editable: inputs de goles + penales si hay empate ──────────────────────
  const d = draft ?? { home: '', away: '', penWinner: null }
  const set = (patch: Partial<Draft>) => onChange?.({ ...d, ...patch })

  const hg = d.home === '' ? null : Number(d.home)
  const ag = d.away === '' ? null : Number(d.away)
  const isTie = hg != null && ag != null && hg === ag

  return (
    <Shell big={big}>
      <EditRow
        big={big} team={home!} value={d.home} win={isWinner(home)}
        onChange={v => set({ home: v, penWinner: null })}
      />
      <EditRow
        big={big} team={away!} value={d.away} win={isWinner(away)}
        onChange={v => set({ away: v, penWinner: null })}
      />
      {isTie && (
        <div className={`border-t border-[#2a2a3a] ${big ? 'mt-3 pt-3' : 'mt-2 pt-2'}`}>
          <p className={`mb-1 text-amber-400/80 ${big ? 'text-sm' : 'text-[10px]'}`}>
            Empate → ¿quién gana por penales?
          </p>
          <div className="flex gap-2">
            <PenBtn big={big} label={withFlag(home)} active={d.penWinner === 'home'} onClick={() => set({ penWinner: 'home' })} />
            <PenBtn big={big} label={withFlag(away)} active={d.penWinner === 'away'} onClick={() => set({ penWinner: 'away' })} />
          </div>
        </div>
      )}
    </Shell>
  )
}

// ── Piezas internas ───────────────────────────────────────────────────────────

function Shell({ children, big, locked }: { children: ReactNode; big: boolean; locked?: boolean }) {
  return (
    <div
      className={`relative flex flex-col justify-center rounded-xl border
        ${big ? 'h-full w-full p-5 text-lg' : 'w-52 p-2.5 text-sm'}
        ${locked ? 'border-[#232330] bg-[#0e0e15] opacity-80' : 'border-[#2a2a3a] bg-[#12121a]'}`}
    >
      {children}
    </div>
  )
}

function Row({ big, team, score, win }: { big: boolean; team: string | null; score?: number; win: boolean }) {
  return (
    <div className={`flex items-center justify-between ${big ? 'py-1.5' : 'py-0.5'}
        ${win ? 'font-semibold text-emerald-400' : 'text-zinc-300'}`}>
      <span className="truncate">{team ? withFlag(team) : TBD}</span>
      <span className={`ml-2 tabular-nums text-zinc-400 ${big ? 'text-2xl' : ''}`}>{score ?? '–'}</span>
    </div>
  )
}

function EditRow({
  big, team, value, win, onChange,
}: { big: boolean; team: string; value: string; win: boolean; onChange: (v: string) => void }) {
  return (
    <div className={`flex items-center justify-between ${big ? 'py-1.5' : 'py-0.5'}
        ${win ? 'font-semibold text-emerald-400' : 'text-zinc-200'}`}>
      <span className="truncate">{withFlag(team)}</span>
      <input
        type="number"
        min={0}
        inputMode="numeric"
        value={value}
        onChange={e => onChange(e.target.value.replace(/[^0-9]/g, ''))}
        className={`ml-2 shrink-0 rounded border border-[#2a2a3a] bg-[#0a0a0f] text-center
                    tabular-nums text-white focus:border-emerald-500 focus:outline-none
                    ${big ? 'w-16 py-1 text-2xl' : 'w-10 px-1 py-0.5'}`}
      />
    </div>
  )
}

function PenBtn({ big, label, active, onClick }: { big: boolean; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 truncate rounded transition-colors
        ${big ? 'px-2 py-2 text-sm' : 'px-1.5 py-1 text-[11px]'}
        ${active
          ? 'bg-amber-500 font-semibold text-black'
          : 'border border-[#2a2a3a] text-zinc-400 hover:border-amber-500/50'}`}
    >
      {label}
    </button>
  )
}
