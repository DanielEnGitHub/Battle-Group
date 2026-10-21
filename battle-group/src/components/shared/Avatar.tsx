import { colorForIndex } from '../../constants/colors'

interface Props {
  name: string
  colorIndex: number
  size?: number
}

export default function Avatar({ name, colorIndex, size = 36 }: Props) {
  const color = colorForIndex(colorIndex)
  return (
    <span
      aria-hidden
      className="grid place-items-center rounded-full font-display text-white shrink-0"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.46,
        background: color,
        border: `${Math.max(2, Math.round(size / 14))}px solid white`,
        boxShadow: `0 ${Math.max(2, Math.round(size / 12))}px 0 rgba(43, 33, 97, 0.2), inset 0 -${Math.round(size / 10)}px 0 rgba(0, 0, 0, 0.12)`,
        textShadow: '0 2px 0 rgba(0, 0, 0, 0.2)',
      }}
    >
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  )
}
