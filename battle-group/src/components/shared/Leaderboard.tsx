import type { Team } from '../../types/game'
import { formatScore } from '../../utils/format'
import Avatar from './Avatar'

const RANK_BADGES = [
  { bg: 'linear-gradient(180deg, #ffe27a, #ffc21e)', edge: '#c98a00', fg: '#6b4300' },
  { bg: 'linear-gradient(180deg, #f4f6fd, #c9d0e6)', edge: '#8f98b8', fg: '#3c4466' },
  { bg: 'linear-gradient(180deg, #ffc58f, #e8873c)', edge: '#a4521a', fg: '#5a2a07' },
]

interface Props {
  teams: Team[]
  highlightName?: string
  limit?: number
  title?: string
}

interface RowProps {
  team: Team
  rank: number
  isMe: boolean
  delayMs: number
}

function Row({ team, rank, isMe, delayMs }: RowProps) {
  const badge = RANK_BADGES[rank - 1]
  return (
    <li
      className={`flex items-center gap-3 pl-2 pr-4 py-2 animate-fade-slide-up ${
        isMe ? 'row-me' : 'row-card'
      }`}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <span
        className="grid place-items-center w-8 h-8 rounded-full font-display text-base shrink-0"
        style={badge
          ? { background: badge.bg, color: badge.fg, boxShadow: `0 3px 0 ${badge.edge}` }
          : { background: 'rgba(29, 53, 102, 0.1)', color: 'var(--color-card-ink)' }}
      >
        {rank}
      </span>
      <Avatar name={team.name} colorIndex={team.joinIndex} size={34} />
      <span className="flex-1 min-w-0 truncate font-extrabold">
        {team.name}
        {isMe && <span className="opacity-80 ml-1.5 text-sm">(tú)</span>}
      </span>
      <span className="row-score font-display text-lg tabular-nums">{formatScore(team.score)}</span>
    </li>
  )
}

export default function Leaderboard({ teams, highlightName, limit, title = 'Clasificación' }: Props) {
  const shown = limit ? teams.slice(0, limit) : teams
  const myIndex = highlightName ? teams.findIndex(t => t.name === highlightName) : -1
  const meOutside = myIndex >= shown.length

  return (
    <section className="panel p-4">
      <h2 className="font-display text-xl text-ink text-center mb-3">{title}</h2>
      {shown.length === 0 ? (
        <p className="text-ink-soft text-center py-6">Aún no hay jugadores</p>
      ) : (
        <ol className="space-y-2">
          {shown.map((t, i) => (
            <Row key={t.sessionId} team={t} rank={i + 1} isMe={i === myIndex} delayMs={i * 50} />
          ))}
          {meOutside && (
            <>
              <li className="text-center text-ink-soft leading-none" aria-hidden>···</li>
              <Row team={teams[myIndex]} rank={myIndex + 1} isMe delayMs={shown.length * 50} />
            </>
          )}
        </ol>
      )}
    </section>
  )
}
