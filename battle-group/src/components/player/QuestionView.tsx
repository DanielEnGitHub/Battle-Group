import { useState } from 'react'
import type { ActiveQuestion } from '../../types/game'
import { useCountdown } from '../../hooks/useCountdown'
import { assetUrl, optionLetter } from '../../utils/format'
import TimerRing from '../shared/TimerRing'

interface Props {
  question: ActiveQuestion
  onAnswer: (optionIndex: number) => void
}

// Remount per question (key by index) so the countdown and selection reset.
export default function QuestionView({ question, onAnswer }: Props) {
  const totalMs = question.timeLimit * 1000
  const msLeft = useCountdown(question.timeLeftMs ?? totalMs)
  const [selected, setSelected] = useState<number | null>(null)

  const timeUp = msLeft === 0
  const locked = selected !== null || timeUp
  const progress = ((question.index + 1) / question.total) * 100

  const handleClick = (i: number) => {
    if (locked) return
    setSelected(i)
    onAnswer(i)
  }

  return (
    <div className="min-h-dvh w-full max-w-xl mx-auto px-4 pt-5 pb-8 flex flex-col gap-4">
      <header className="flex items-center gap-4">
        <div className="flex-1">
          <p className="font-display text-lg mb-1.5">
            Pregunta {question.index + 1} de {question.total}
          </p>
          <div className="bar-track">
            <div className="bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <TimerRing msLeft={msLeft} totalMs={totalMs} size={66} />
      </header>

      <section className="panel p-5 animate-pop-in">
        {question.img && (
          <div className="bg-white rounded-2xl p-3 mb-4">
            <img src={assetUrl(question.img)} alt="" className="max-h-40 mx-auto object-contain" />
          </div>
        )}
        <h1 className="text-xl md:text-2xl font-black leading-snug text-center">{question.text}</h1>
      </section>

      <div className="flex flex-col gap-3.5" role="group" aria-label="Respuestas">
        {question.options.map((opt, i) => {
          const isSelected = selected === i
          return (
            <div key={i} className="animate-fade-slide-up" style={{ animationDelay: `${120 + i * 70}ms` }}>
              <button
                type="button"
                onClick={() => handleClick(i)}
                disabled={locked}
                aria-pressed={isSelected}
                className={`answer ${isSelected ? 'answer-selected' : ''} ${
                  locked && !isSelected ? 'answer-dimmed' : ''
                }`}
              >
                <span className="answer-key">{optionLetter(i)}</span>
                <span className="flex-1">{opt}</span>
              </button>
            </div>
          )
        })}
      </div>

      <div className="min-h-10 flex justify-center" aria-live="polite">
        {timeUp && selected === null && (
          <span className="pill animate-shake">¡Tiempo agotado!</span>
        )}
      </div>
    </div>
  )
}
