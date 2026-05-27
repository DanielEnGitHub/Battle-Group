import { useEffect, useState } from 'react'
import type { ActiveQuestion } from '../../types/game'

// Colores y símbolos estilo Kahoot
const OPTIONS = [
  { bg: 'bg-[#E21B3C] hover:bg-[#c01432] active:bg-[#a01028]', shape: '▲', label: 'A' },
  { bg: 'bg-[#1368CE] hover:bg-[#0f55aa] active:bg-[#0b4490]', shape: '◆', label: 'B' },
  { bg: 'bg-[#D89E00] hover:bg-[#b88300] active:bg-[#9a6e00]', shape: '●', label: 'C' },
  { bg: 'bg-[#26890C] hover:bg-[#1d6a09] active:bg-[#155007]', shape: '■', label: 'D' },
]

interface Props {
  question: ActiveQuestion
  onAnswer: (optionIndex: number) => void
  answered: boolean
}

export default function QuestionView({ question, onAnswer, answered }: Props) {
  const [timeLeft, setTimeLeft] = useState(question.timeLimit)

  // Reiniciar timer cuando cambia la pregunta
  useEffect(() => {
    setTimeLeft(question.timeLimit)
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(interval); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [question.text, question.timeLimit])

  const progress    = (timeLeft / question.timeLimit) * 100
  const timerColor  = timeLeft > 10 ? 'bg-green-400' : timeLeft > 5 ? 'bg-yellow-400' : 'bg-red-500'
  const disabled    = answered || timeLeft === 0

  return (
    <div className="min-h-dvh flex flex-col bg-[#0a0a0f]">
      {/* Header con timer */}
      <div className="bg-[#12121a] border-b border-[#2a2a3a] px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-zinc-500 uppercase tracking-widest">
            {question.index + 1} / {question.total}
          </span>
          <span className={`text-2xl font-black tabular-nums ${
            timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-white'
          }`}>
            {timeLeft}s
          </span>
        </div>
        {/* Barra de tiempo */}
        <div className="h-2 bg-[#2a2a3a] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${timerColor}`}
            style={{ width: `${progress}%` }}
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
          return (
            <button
              key={i}
              onClick={() => !disabled && onAnswer(i)}
              disabled={disabled}
              className={`${style.bg} disabled:opacity-50 disabled:cursor-not-allowed
                         rounded-xl p-4 text-white font-bold text-sm text-left
                         transition-all active:scale-95 min-h-[80px]
                         flex flex-col gap-2 shadow-lg`}
            >
              <span className="text-xl leading-none">{style.shape}</span>
              <span className="leading-snug">{opt}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
