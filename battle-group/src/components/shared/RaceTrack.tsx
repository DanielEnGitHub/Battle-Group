import type { Team } from '../../types/game'

export const CAR_COLORS = [
  '#FF4444', // rojo
  '#FFD700', // amarillo
  '#4488FF', // azul
  '#44FF88', // verde
  '#FF8844', // naranja
  '#AA44FF', // violeta
  '#44FFFF', // cyan
  '#FF44AA', // rosa
]

const MEDALS: Record<number, string> = { 0: '🥇', 1: '🥈', 2: '🥉' }

// ── Auto F1 vista lateral ─────────────────────────────────────────────────────
export function CarSide({ color, glow }: { color: string; glow: boolean }) {
  return (
    <div style={{ position: 'relative', width: 64, height: 38, flexShrink: 0 }}>

      {/* Líneas de velocidad */}
      <div style={{ position: 'absolute', right: '100%', top: 13, marginRight: 4,  width: 12, height: 2,   background: `${color}55`, borderRadius: 2 }} />
      <div style={{ position: 'absolute', right: '100%', top: 18, marginRight: 8,  width: 18, height: 1.5, background: `${color}33`, borderRadius: 2 }} />
      <div style={{ position: 'absolute', right: '100%', top: 23, marginRight: 2,  width: 8,  height: 1.5, background: `${color}22`, borderRadius: 2 }} />

      {/* Alerón trasero — blade */}
      <div style={{
        position: 'absolute', left: 2, bottom: 24,
        width: 15, height: 3,
        background: `linear-gradient(90deg, ${color}, ${color}bb)`,
        borderRadius: '2px 2px 0 0',
        boxShadow: glow ? `0 0 10px ${color}88` : 'none',
      }} />
      {/* Soporte */}
      <div style={{ position: 'absolute', left: 8, bottom: 14, width: 2, height: 11, background: `${color}88` }} />
      {/* End plate */}
      <div style={{ position: 'absolute', left: 1, bottom: 14, width: 2, height: 13, background: `${color}66`, borderRadius: 1 }} />

      {/* Carrocería */}
      <div style={{
        position: 'absolute',
        bottom: 10, left: 4, right: 8,
        height: 12,
        background: `linear-gradient(175deg, ${color} 0%, ${color}f0 45%, ${color}cc 100%)`,
        borderRadius: '1px 6px 2px 2px',
        boxShadow: glow
          ? `0 0 16px ${color}aa, 0 0 32px ${color}44, 0 3px 10px rgba(0,0,0,0.9)`
          : `0 3px 8px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)`,
        border: `1.5px solid ${glow ? 'rgba(255,255,255,0.6)' : color + '44'}`,
      }}>
        <div style={{ position: 'absolute', top: 2, left: 8, right: 16, height: 2.5, background: 'rgba(255,255,255,0.22)', borderRadius: 2 }} />
        <div style={{ position: 'absolute', bottom: 2, left: 4, right: 4, height: 1, background: 'rgba(0,0,0,0.25)', borderRadius: 2 }} />
      </div>

      {/* Cabina swept-back */}
      <div style={{
        position: 'absolute',
        bottom: 22, left: 18, right: 22,
        height: 13,
        background: `linear-gradient(150deg, ${color}ee 0%, ${color}99 100%)`,
        clipPath: 'polygon(10% 100%, 0% 0%, 90% 0%, 100% 100%)',
        borderRadius: '5px 3px 0 0',
      }}>
        <div style={{
          position: 'absolute', top: 2, left: 4, right: 4, bottom: 0,
          background: 'linear-gradient(135deg, rgba(120,200,255,0.55) 0%, rgba(20,70,160,0.75) 100%)',
          borderRadius: '3px 2px 0 0',
        }} />
        <div style={{
          position: 'absolute', top: 2, left: 4, width: 4, height: 5,
          background: 'rgba(255,255,255,0.2)', borderRadius: '2px 0 0 0', transform: 'skewX(-8deg)',
        }} />
      </div>

      {/* Nariz cónica */}
      <div style={{
        position: 'absolute', bottom: 12, right: 2,
        width: 16, height: 8,
        background: `linear-gradient(90deg, ${color} 0%, ${color}99 100%)`,
        clipPath: 'polygon(0 5%, 100% 38%, 100% 62%, 0 95%)',
      }} />

      {/* Alerón delantero */}
      <div style={{
        position: 'absolute', bottom: 8, right: -2,
        width: 16, height: 2.5,
        background: `linear-gradient(90deg, ${color}cc, ${color}66)`,
        borderRadius: '0 2px 2px 0',
        boxShadow: glow ? `0 0 6px ${color}55` : 'none',
      }} />
      <div style={{ position: 'absolute', bottom: 6, right: 0, width: 10, height: 1.5, background: `${color}44`, borderRadius: '0 2px 2px 0' }} />

      {/* Rueda trasera */}
      <div style={{
        position: 'absolute', bottom: 0, left: 5,
        width: 17, height: 17, borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 30%, #3c3c3c, #0c0c0c)',
        border: '2.5px solid #3a3a3a',
        boxShadow: '0 2px 8px rgba(0,0,0,0.9)',
      }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 8, height: 8, borderRadius: '50%', background: 'radial-gradient(circle at 40% 35%, #555, #222)', border: '1.5px solid #666' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 3, height: 3, borderRadius: '50%', background: '#888' }} />
      </div>

      {/* Rueda delantera */}
      <div style={{
        position: 'absolute', bottom: 1, right: 8,
        width: 14, height: 14, borderRadius: '50%',
        background: 'radial-gradient(circle at 35% 30%, #3c3c3c, #0c0c0c)',
        border: '2.5px solid #3a3a3a',
        boxShadow: '0 2px 8px rgba(0,0,0,0.9)',
      }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 6, height: 6, borderRadius: '50%', background: 'radial-gradient(circle at 40% 35%, #555, #222)', border: '1.5px solid #666' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 2.5, height: 2.5, borderRadius: '50%', background: '#888' }} />
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

interface Props {
  teams: Team[]
  highlightTeam?: string
  compact?: boolean
}

export default function RaceTrack({ teams, highlightTeam, compact = false }: Props) {
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

  // Calcular ranking actual (por score) → para el badge encima del auto
  const rankMap = new Map<string, number>()
  ;[...teams]
    .sort((a, b) => b.score !== a.score ? b.score - a.score : (a.totalTime ?? 0) - (b.totalTime ?? 0))
    .forEach((t, i) => rankMap.set(t.name, i))

  // Ordenar por joinIndex (carril fijo) — el servidor ya lo manda así,
  // pero lo garantizamos también en el cliente.
  const lanes = [...teams].sort((a, b) => (a.joinIndex ?? 0) - (b.joinIndex ?? 0))

  const laneH = compact ? 66 : 80

  return (
    <div className="w-full space-y-2">
      {lanes.map((team, origIdx) => {
        const color = CAR_COLORS[origIdx % CAR_COLORS.length]
        const isMe  = team.name === highlightTeam
        const prog  = team.score / maxScore
        const rank  = rankMap.get(team.name) ?? origIdx

        // car = 64px + 8px margen = reservar 72px en el extremo derecho
        const carLeft = `calc(${prog} * (100% - 72px) + 8px)`

        return (
          <div key={team.name}>

            {/* Header: nombre + puntaje */}
            <div className="flex items-center justify-between px-1 mb-1">
              <div className="flex items-center gap-2 min-w-0">

                {isMe ? (
                  /* Ping animado para el usuario */
                  <span className="relative flex h-3 w-3 flex-shrink-0">
                    <span
                      className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-70"
                      style={{ background: color }}
                    />
                    <span
                      className="relative inline-flex h-3 w-3 rounded-full"
                      style={{ background: color, boxShadow: `0 0 6px ${color}` }}
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
                    style={{
                      background: color,
                      color: '#000',
                    }}
                  >
                    tú
                  </span>
                )}
              </div>

              <span className="text-[11px] tabular-nums font-bold flex-shrink-0 ml-2" style={{ color: isMe ? color : '#666' }}>
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
                  ? `linear-gradient(180deg, #1c1410 0%, ${color}18 45%, #181210 100%)`
                  : 'linear-gradient(180deg, #161616 0%, #212121 45%, #1a1a1a 100%)',
                border: isMe ? `1.5px solid ${color}88` : '1px solid #242424',
                boxShadow: isMe
                  ? `0 0 24px ${color}33, inset 0 0 40px ${color}08`
                  : 'none',
              }}
            >
              {/* Barra lateral izquierda — solo en el carril del usuario */}
              {isMe && (
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, zIndex: 2,
                  background: `linear-gradient(180deg, ${color}aa 0%, ${color} 50%, ${color}aa 100%)`,
                  boxShadow: `2px 0 8px ${color}66`,
                }} />
              )}

              {/* Franja superior */}
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: isMe ? 4 : 3,
                background: isMe
                  ? `linear-gradient(90deg, ${color}66 0%, ${color}99 30%, ${color}66 70%, transparent 100%)`
                  : `linear-gradient(90deg, transparent 0%, ${color}44 25%, ${color}22 70%, transparent 100%)`,
              }} />
              {/* Franja inferior */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: isMe ? 4 : 3,
                background: isMe
                  ? `linear-gradient(90deg, ${color}44 0%, ${color}66 30%, ${color}44 70%, transparent 100%)`
                  : `linear-gradient(90deg, transparent 0%, ${color}22 25%, ${color}11 70%, transparent 100%)`,
              }} />

              {/* Trail detrás del auto */}
              {prog > 0.03 && (
                <div style={{
                  position: 'absolute', top: 3, bottom: 3, left: 0,
                  width: carLeft,
                  background: `linear-gradient(90deg, transparent 0%, ${color}08 55%, ${color}1c 100%)`,
                  pointerEvents: 'none',
                }} />
              )}

              {/* Líneas punteadas */}
              <div style={{
                position: 'absolute',
                top: '50%', transform: 'translateY(-50%)',
                left: 0, right: 0, height: 1.5,
                background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 14px, transparent 14px, transparent 28px)',
              }} />

              {/* Finish line */}
              <div style={{
                position: 'absolute', right: 0, top: 0, bottom: 0, width: 8,
                background: 'repeating-linear-gradient(180deg, rgba(255,255,255,0.17) 0px, rgba(255,255,255,0.17) 5px, rgba(0,0,0,0.22) 5px, rgba(0,0,0,0.22) 10px)',
                borderLeft: '1px solid rgba(255,255,255,0.06)',
              }} />

              {/* ── Auto + badge de posición (se mueven juntos) ── */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 6,
                  left: carLeft,
                  transition: 'left 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                {/* Badge de posición — aparece encima del auto al empezar */}
                {anyScored && (
                  <div style={{ lineHeight: 1 }}>
                    {rank < 3 ? (
                      <span style={{ fontSize: compact ? 12 : 14 }}>{MEDALS[rank]}</span>
                    ) : (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 900,
                          color: '#777',
                          background: '#1e1e1e',
                          border: '1px solid #333',
                          borderRadius: 4,
                          padding: '1px 3px',
                        }}
                      >
                        #{rank + 1}
                      </span>
                    )}
                  </div>
                )}

                <CarSide color={color} glow={isMe} />
              </div>
            </div>

          </div>
        )
      })}
    </div>
  )
}
