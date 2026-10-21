type Kind = 'circle' | 'square' | 'triangle' | 'cross'

interface Shape {
  kind: Kind
  top: string
  left: string
  size: number
  delay: number
  duration: number
}

const SHAPES: Shape[] = [
  { kind: 'circle',   top: '8%',  left: '6%',  size: 54, delay: 0,   duration: 13 },
  { kind: 'cross',    top: '18%', left: '84%', size: 40, delay: -3,  duration: 11 },
  { kind: 'triangle', top: '64%', left: '4%',  size: 60, delay: -6,  duration: 15 },
  { kind: 'square',   top: '78%', left: '78%', size: 56, delay: -2,  duration: 14 },
  { kind: 'circle',   top: '42%', left: '92%', size: 30, delay: -8,  duration: 12 },
  { kind: 'square',   top: '30%', left: '14%', size: 30, delay: -5,  duration: 16 },
  { kind: 'cross',    top: '88%', left: '36%', size: 32, delay: -9,  duration: 13 },
  { kind: 'triangle', top: '6%',  left: '56%', size: 36, delay: -4,  duration: 12 },
]

function ShapePath({ kind }: { kind: Kind }) {
  switch (kind) {
    case 'circle':
      return <circle cx="50" cy="50" r="38" />
    case 'square':
      return <rect x="14" y="14" width="72" height="72" rx="14" />
    case 'triangle':
      return <path d="M50 12 L88 82 L12 82 Z" strokeLinejoin="round" />
    case 'cross':
      return <path d="M50 14 V86 M14 50 H86" strokeLinecap="round" />
  }
}

export default function BackgroundShapes() {
  return (
    <div className="bg-shapes" aria-hidden>
      {SHAPES.map((s, i) => (
        <svg
          key={i}
          viewBox="0 0 100 100"
          width={s.size}
          height={s.size}
          fill="none"
          stroke="currentColor"
          strokeWidth={10}
          style={{
            top: s.top,
            left: s.left,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.duration}s`,
          }}
        >
          <ShapePath kind={s.kind} />
        </svg>
      ))}
    </div>
  )
}
