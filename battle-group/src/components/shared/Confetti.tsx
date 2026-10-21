import { useState, type CSSProperties } from 'react'

const COLORS = [
  'var(--color-highlight)',
  'var(--color-pink)',
  'var(--color-sky)',
  'var(--color-lime)',
  '#a594ff',
  '#ffffff',
]

interface Piece {
  id: number
  left: number
  delay: number
  duration: number
  size: number
  drift: number
  spin: number
  color: string
}

function makePieces(count: number): Piece[] {
  return Array.from({ length: count }, (_, id) => ({
    id,
    left: Math.random() * 100,
    delay: Math.random() * 0.9,
    duration: 2.8 + Math.random() * 2.2,
    size: 7 + Math.random() * 8,
    drift: (Math.random() - 0.5) * 180,
    spin: 360 + Math.random() * 720,
    color: COLORS[id % COLORS.length],
  }))
}

export default function Confetti({ count = 140 }: { count?: number }) {
  const [pieces] = useState(() => makePieces(count))

  return (
    <div className="confetti" aria-hidden>
      {pieces.map(p => (
        <span
          key={p.id}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.45,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            '--drift': `${p.drift}px`,
            '--spin': `${p.spin}deg`,
          } as CSSProperties}
        />
      ))}
    </div>
  )
}
