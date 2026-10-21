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
  maxScore: number
  title: string
}

export default function Leaderboard({ teams, maxScore, title }: Props) {
  return (
    <section className="panel p-4">
      <h2 className="font-display text-xl text-ink text-center mb-3">{title}</h2>
      {teams.length === 0 ? (
        <p className="text-ink-soft text-center py-6">Aún no hay jugadores</p>
      ) : (
        <ol className="space-y-2">
          {teams.map((team, i) => {
            const badge = RANK_BADGES[i]
            return (
              <li
                key={team.sessionId}
                className="row-card flex items-center gap-3 pl-2 pr-4 py-2 animate-fade-slide-up"
                style={{ animationDelay: `${Math.min(i, 12) * 50}ms` }}
              >
                <span
                  className="grid place-items-center w-8 h-8 rounded-full font-display text-base shrink-0"
                  style={badge
                    ? { background: badge.bg, color: badge.fg, boxShadow: `0 3px 0 ${badge.edge}` }
                    : { background: 'rgba(29, 53, 102, 0.1)', color: 'var(--color-card-ink)' }}
                >
                  {i + 1}
                </span>
                <Avatar name={team.name} colorIndex={team.joinIndex} size={34} />
                <span className="flex-1 min-w-0 truncate font-extrabold">{team.name}</span>
                <span className="row-score font-display text-lg tabular-nums">
                  {formatScore(team.score)}
                  <span className="text-sm opacity-70"> / {formatScore(maxScore)}</span>
                </span>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
