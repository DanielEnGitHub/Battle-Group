interface Props {
  msLeft: number
  totalMs: number
  size?: number
}

export default function TimerRing({ msLeft, totalMs, size = 72 }: Props) {
  const stroke = Math.max(5, Math.round(size / 10))
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const ratio = totalMs > 0 ? msLeft / totalMs : 0
  const seconds = Math.ceil(msLeft / 1000)
  const urgent = seconds > 0 && seconds <= 5
  const inner = size - stroke * 2 - 6

  return (
    <div
      role="timer"
      aria-label={`${seconds} segundos restantes`}
      className={`relative grid place-items-center shrink-0 ${urgent ? 'animate-pulse-soft' : ''}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90 absolute inset-0">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={stroke}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="var(--color-highlight)" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          style={{ transition: 'stroke-dashoffset 0.2s linear' }}
        />
      </svg>
      <span
        className="grid place-items-center rounded-full font-display text-white"
        style={{
          width: inner,
          height: inner,
          fontSize: inner * 0.5,
          background: 'linear-gradient(180deg, #ff7fa3, var(--color-pink))',
          boxShadow: 'inset 0 -4px 0 var(--color-pink-dark)',
          textShadow: '0 2px 0 rgba(0,0,0,0.2)',
        }}
      >
        {seconds}
      </span>
    </div>
  )
}
