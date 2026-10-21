import type { ActiveQuestion, QuestionResults, Team } from '../../types/game'
import { useCountdown } from '../../hooks/useCountdown'
import { assetUrl, formatSeconds, optionLetter } from '../../utils/format'
import Avatar from '../shared/Avatar'
import Leaderboard from '../shared/Leaderboard'
import TimerRing from '../shared/TimerRing'

interface Props {
  phase: 'question' | 'results'
  question: ActiveQuestion
  answersCount: number
  totalTeams: number
  questionResults: QuestionResults | null
  leaderboard: Team[]
  onRevealResults: () => void
  onNextQuestion: () => void
  onEnd: () => void
}

function ResultTile({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="rounded-2xl bg-tile py-4 text-center">
      <p className="font-display text-5xl" style={{ color }}>{value}</p>
      <p className="text-sm text-ink-soft mt-1">{label}</p>
    </div>
  )
}

// Remount per question (key by index) so the countdown restarts.
export default function AdminGameControl({
  phase,
  question,
  answersCount,
  totalTeams,
  questionResults,
  leaderboard,
  onRevealResults,
  onNextQuestion,
  onEnd,
}: Props) {
  const totalMs = question.timeLimit * 1000
  const msLeft = useCountdown(question.timeLeftMs ?? totalMs)

  const revealed = phase === 'results'
  const everyoneAnswered = totalTeams > 0 && answersCount >= totalTeams
  const readyToReveal = everyoneAnswered || msLeft === 0
  const isLast = question.index + 1 >= question.total
  const progress = ((question.index + 1) / question.total) * 100

  const answers = questionResults?.answers ?? []
  const correctAnswers = answers.filter(a => a.correct)
  const missedCount = Math.max(0, totalTeams - answers.length)
  const fastest = [...correctAnswers].sort((a, b) => a.timeMs - b.timeMs).slice(0, 3)
  const joinIndexOf = (name: string) => leaderboard.find(t => t.name === name)?.joinIndex ?? 0

  return (
    <div className="min-h-dvh w-full max-w-7xl mx-auto px-4 md:px-8 py-6 flex flex-col gap-5">
      <header className="flex items-center gap-5">
        <div className="flex-1 min-w-0">
          <p className="font-display text-2xl mb-2">
            Pregunta {question.index + 1} de {question.total}
          </p>
          <div className="bar-track max-w-lg">
            <div className="bar-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
        {!revealed && <TimerRing msLeft={msLeft} totalMs={totalMs} size={92} />}
        <button onClick={onEnd} className="btn btn-sm self-start">Terminar</button>
      </header>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-5">
          <section className="panel p-6 md:p-8 animate-pop-in">
            {question.img && (
              <div className="bg-white rounded-2xl p-4 mb-6">
                <img src={assetUrl(question.img)} alt="" className="max-h-56 mx-auto object-contain" />
              </div>
            )}
            <h1 className="text-2xl md:text-4xl font-black leading-tight text-center">{question.text}</h1>
          </section>

          <div className="grid gap-4 md:grid-cols-2">
            {question.options.map((opt, i) => {
              const isCorrect = question.correctIndex === i
              return (
                <div key={i} className="animate-fade-slide-up" style={{ animationDelay: `${120 + i * 80}ms` }}>
                  <div
                    className={`answer answer-static text-lg md:text-xl min-h-20 ${
                      revealed ? (isCorrect ? 'answer-correct' : 'answer-dimmed') : ''
                    }`}
                  >
                    <span className="answer-key">{optionLetter(i)}</span>
                    <span className="flex-1">{opt}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {revealed && questionResults && (
            <section className="panel p-5 animate-fade-slide-up">
              <div className="grid grid-cols-3 gap-3">
                <ResultTile value={correctAnswers.length} label="Correctas" color="var(--color-lime)" />
                <ResultTile value={answers.length - correctAnswers.length} label="Incorrectas" color="var(--color-pink)" />
                <ResultTile value={missedCount} label="Sin responder" color="var(--color-ink-soft)" />
              </div>
              {fastest.length > 0 && (
                <div className="mt-5">
                  <p className="text-ink-soft text-sm mb-3">Los más rápidos</p>
                  <div className="flex flex-wrap gap-2">
                    {fastest.map((a, i) => (
                      <span
                        key={a.teamName}
                        className="flex items-center gap-2 pl-1 pr-3 py-1 row-card rounded-full animate-pop-in"
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        <Avatar name={a.teamName} colorIndex={joinIndexOf(a.teamName)} size={28} />
                        <span>{a.teamName}</span>
                        <span className="opacity-70 text-sm tabular-nums">{formatSeconds(a.timeMs)}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}
        </div>

        <aside className="flex flex-col gap-5">
          {!revealed && (
            <section className="panel p-5 text-center">
              <p className="text-ink-soft">Respuestas</p>
              <p className="font-display text-6xl text-highlight mt-1">
                {answersCount}
                <span className="text-ink-soft text-3xl"> / {totalTeams}</span>
              </p>
              <p className={`mt-2 ${readyToReveal ? 'text-highlight' : 'text-ink-soft'}`}>
                {everyoneAnswered
                  ? '¡Todos respondieron!'
                  : msLeft === 0 ? '¡Tiempo agotado!' : 'Esperando respuestas...'}
              </p>
            </section>
          )}

          {revealed ? (
            <button
              onClick={onNextQuestion}
              className="btn btn-lg w-full"
            >
              {isLast ? 'Ver podio' : 'Siguiente pregunta'}
            </button>
          ) : (
            <button
              onClick={onRevealResults}
              className={`btn btn-lg w-full ${readyToReveal ? 'animate-glow' : ''}`}
            >
              Revelar respuesta
            </button>
          )}

          <Leaderboard teams={leaderboard} limit={8} />
        </aside>
      </div>
    </div>
  )
}
