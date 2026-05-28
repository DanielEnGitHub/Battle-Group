import { useEffect, useState } from 'react'
import type { ActiveQuestion } from '../../types/game'

const OPTIONS = [
  { bg: 'bg-[#E21B3C]', selectedBg: 'bg-[#a01028]', shape: '▲', label: 'A' },
  { bg: 'bg-[#1368CE]', selectedBg: 'bg-[#0b4490]', shape: '◆', label: 'B' },
  { bg: 'bg-[#D89E00]', selectedBg: 'bg-[#9a6e00]', shape: '●', label: 'C' },
  { bg: 'bg-[#26890C]', selectedBg: 'bg-[#155007]', shape: '■', label: 'D' },
]

interface Props {
  question: ActiveQuestion
  onAnswer: (optionIndex: number) => void
}

export default function QuestionView({ question, onAnswer }: Props) {
  const initialTime = question.timeLeftMs !== undefined
    ? Math.ceil(question.timeLeftMs / 1000)
    : question.timeLimit

  const [timeLeft, setTimeLeft] = useState(initialTime)
  const [selected, setSelected] = useState<number | null>(null)

  useEffect(() => {
    const initial = question.timeLeftMs !== undefined
      ? Math.ceil(question.timeLeftMs / 1000)
      : question.timeLimit
    setTimeLeft(initial)
    setSelected(null)

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [question.text, question.timeLimit, question.timeLeftMs])

  const progress = (timeLeft / question.timeLimit) * 100
  const timerColor = timeLeft > 10 ? 'bg-green-400' : timeLeft > 5 ? 'bg-yellow-400' : 'bg-red-500'
  const isLocked = selected !== null || timeLeft === 0

  const handleClick = (i: number) => {
    if (isLocked) return
    setSelected(i)
    onAnswer(i)
  }

  return (
    <div className="min-h-dvh flex flex-col bg-[#0a0a0f]">
      {/* Header con timer */}
      <div className="bg-[#12121a] border-b border-[#2a2a3a] px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-zinc-500 uppercase tracking-widest">
            {question.index + 1} / {question.total}
          </span>
          <span className={`text-2xl font-black tabular-nums ${timeLeft <= 5 ? 'text-red-400' : 'text-white'}`}>
            {timeLeft}s
          </span>
        </div>
        <div className="h-2 bg-[#2a2a3a] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full ${timerColor}`}
            style={{ width: `${progress}%`, transition: 'width 1s linear' }}
          />
        </div>
      </div>

      {/* Texto de la pregunta */}
      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <p className="text-white text-xl font-bold text-center leading-relaxed max-w-sm">
          {question.text}
        </p>
      </div>

      {/* Grilla de opciones 2x2 */}
      <div className="grid grid-cols-2 gap-3 p-4 pb-8">
        {question.options.map((opt, i) => {
          const style = OPTIONS[i] ?? OPTIONS[0]
          const isSelected = selected === i
          const isDimmed = selected !== null && !isSelected

          return (
            <button
              key={i}
              onClick={() => handleClick(i)}
              disabled={isLocked}
              className={`
                ${isSelected ? style.selectedBg : style.bg}
                ${isDimmed ? 'opacity-40' : ''}
                rounded-xl p-4 text-white font-bold text-sm text-left
                min-h-[80px] flex flex-col gap-2 shadow-lg
                disabled:cursor-not-allowed
                ${isSelected ? 'ring-4 ring-white/60 scale-95' : 'active:scale-95'}
              `}
              style={{ transition: 'transform 0.1s, opacity 0.15s' }}
            >
              <span className="text-xl leading-none">{style.shape}</span>
              <span className="leading-snug">{opt}</span>
            </button>
          )
        })}
      </div>

      {selected !== null && (
        <p className="text-center text-zinc-500 text-xs pb-6">
          Esperando que termine el tiempo...
        </p>
      )}
    </div>
  )
}
