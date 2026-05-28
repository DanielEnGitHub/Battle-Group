import { memo } from 'react'
import type { Team } from '../../types/game'
import cartImg from '../../assets/carts/cart.png'

const MEDALS: Record<number, string> = { 0: '🥇', 1: '🥈', 2: '🥉' }
const CAR_W = 64

const CAR_COLORS = [
  '#FF4444', '#FFD700', '#4488FF', '#44FF88',
  '#FF8844', '#AA44FF', '#44FFFF', '#FF44AA',
]

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

interface Props {
  teams: Team[]
  highlightTeam?: string
  compact?: boolean
}

export default memo(function RaceTrack({ teams, highlightTeam, compact = false }: Props) {
  if (teams.length === 0) {
    return (
      <div
        className="w-full rounded-2xl flex items-center justify-center text-zinc-600 text-sm py-10"
        style={{ background: 'linear-gradient(135deg, #111118, #1a1a2e)' }}
      >
        Esperando equipos...
      </div>
    )
  }

  const maxScore = Math.max(...teams.map(t => t.score), 0.001)
  const anyScored = teams.some(t => t.score > 0)

  const rankMap = new Map<string, number>()
  ;[...teams]
    .sort((a, b) => b.score !== a.score ? b.score - a.score : (a.totalTime ?? 0) - (b.totalTime ?? 0))
    .forEach((t, i) => rankMap.set(t.name, i))

  const lanes = [...teams].sort((a, b) => (a.joinIndex ?? 0) - (b.joinIndex ?? 0))
  const laneH = compact ? 66 : 80

  return (
    <div className="w-full space-y-2">
      {lanes.map((team, laneIdx) => {
        const isMe  = team.name === highlightTeam
        const prog  = team.score / maxScore
        const rank  = rankMap.get(team.name) ?? 0
        const color = CAR_COLORS[laneIdx % CAR_COLORS.length]
        const carLeft = `calc(${prog} * (100% - ${CAR_W + 8}px) + 4px)`

        return (
          <div key={team.name}>
            {/* Nombre + puntaje */}
            <div className="flex items-center justify-between px-1 mb-1">
              <div className="flex items-center gap-2 min-w-0">
                {isMe ? (
                  <span className="relative flex h-3 w-3 flex-shrink-0">
                    <span
                      className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-70"
                      style={{ background: color }}
                    />
                    <span
                      className="relative inline-flex h-3 w-3 rounded-full"
                      style={{ background: color }}
                    />
                  </span>
                ) : (
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                )}
                <span
                  className="text-xs font-bold truncate"
                  style={{ color: isMe ? 'white' : '#999' }}
                >
                  {team.name}
                </span>
                {isMe && (
                  <span
                    className="text-[10px] font-black px-2 py-0.5 rounded-full flex-shrink-0 uppercase tracking-wide"
                    style={{ background: color, color: '#000' }}
                  >
                    tú
                  </span>
                )}
              </div>
              <span
                className="text-[11px] tabular-nums font-bold flex-shrink-0 ml-2"
                style={{ color: isMe ? color : '#666' }}
              >
                {team.score.toFixed(1)}
                <span style={{ color: '#444', fontWeight: 400 }}> pts</span>
              </span>
            </div>

            {/* Carril */}
            <div
              className="relative w-full rounded-xl overflow-hidden"
              style={{
                height: laneH,
                background: isMe
                  ? 'linear-gradient(180deg, #1e1e2a 0%, #252535 45%, #1e1e2a 100%)'
                  : 'linear-gradient(180deg, #161616 0%, #212121 45%, #1a1a1a 100%)',
                border: isMe ? '1.5px solid rgba(255,255,255,0.15)' : '1px solid #242424',
                contain: 'layout style',
              }}
            >
              {/* Línea punteada */}
              <div style={{
                position: 'absolute',
                top: '50%', transform: 'translateY(-50%)',
                left: 0, right: 0, height: 1.5,
                background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 14px, transparent 14px, transparent 28px)',
              }} />

              {/* Línea de llegada */}
              <div style={{
                position: 'absolute', right: 0, top: 0, bottom: 0, width: 8,
                background: 'repeating-linear-gradient(180deg, rgba(255,255,255,0.17) 0px, rgba(255,255,255,0.17) 5px, rgba(0,0,0,0.22) 5px, rgba(0,0,0,0.22) 10px)',
                borderLeft: '1px solid rgba(255,255,255,0.06)',
              }} />

              {/* Auto + badge */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 4,
                  left: carLeft,
                  willChange: 'left',
                  transition: prefersReducedMotion
                    ? 'none'
                    : 'left 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                {anyScored && (
                  <div style={{ lineHeight: 1 }}>
                    {rank < 3 ? (
                      <span style={{ fontSize: compact ? 12 : 14 }}>{MEDALS[rank]}</span>
                    ) : (
                      <span style={{
                        fontSize: 9, fontWeight: 900, color: '#777',
                        background: '#1e1e1e', border: '1px solid #333',
                        borderRadius: 4, padding: '1px 3px',
                      }}>
                        #{rank + 1}
                      </span>
                    )}
                  </div>
                )}

                <img
                  src={cartImg}
                  alt=""
                  draggable={false}
                  style={{
                    width: CAR_W,
                    height: 'auto',
                    opacity: !highlightTeam || isMe ? 1 : 0.4,
                    transform: isMe ? 'scale(1.1)' : 'scale(1)',
                    transformOrigin: 'bottom center',
                    userSelect: 'none',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
})
