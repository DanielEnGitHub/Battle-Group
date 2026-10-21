import type { ActiveQuestion, AnswerResult, Team } from '../../types/game'
import { formatScore, formatSeconds } from '../../utils/format'
import Leaderboard from '../shared/Leaderboard'

interface Props {
  revealed: boolean
  question: ActiveQuestion
  result: AnswerResult | null
  myAnswerIndex: number | null
  correctIndex: number | null
  leaderboard: Team[]
  teamName: string
}

type Outcome = 'correct' | 'wrong' | 'missed'

const OUTCOME_UI: Record<Outcome, { icon: string; title: string; badge: string }> = {
  correct: { icon: '✓', title: '¡Correcto!',       badge: 'linear-gradient(180deg, #6fdc93, var(--color-lime))' },
  wrong:   { icon: '✕', title: '¡Incorrecto!',     badge: 'linear-gradient(180deg, #ff7aa3, var(--color-pink))' },
  missed:  { icon: '!', title: '¡Tiempo agotado!', badge: 'linear-gradient(180deg, #b6e2ff, var(--color-highlight-dark))' },
}

export default function AnsweredView({
  revealed,
  question,
  result,
  myAnswerIndex,
  correctIndex,
  leaderboard,
  teamName,
}: Props) {
  const myAnswer = myAnswerIndex !== null ? question.options[myAnswerIndex] : undefined

  if (!revealed) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-5 py-10">
        <h1 className="game-title text-4xl md:text-5xl text-center mb-6 animate-bounce-in">
          Respuesta enviada
        </h1>
        <div className="panel w-full max-w-sm p-6 text-center animate-pop-in">
          {myAnswer && (
            <>
              <p className="text-ink-soft text-sm mb-2">Tu respuesta</p>
              <div className="answer answer-static answer-selected text-base">
                <span className="flex-1 text-center">{myAnswer}</span>
              </div>
            </>
          )}
          {result && (
            <p className="text-ink-soft text-sm mt-3">Respondiste en {formatSeconds(result.timeMs)}</p>
          )}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-highlight">
            <span className="font-display text-lg">Esperando el resultado</span>
            <span className="loading-dots" aria-hidden><span /><span /><span /></span>
          </div>
        </div>
      </div>
    )
  }

  const outcome: Outcome = !result ? 'missed' : result.correct ? 'correct' : 'wrong'
  const ui = OUTCOME_UI[outcome]
  const myRank = leaderboard.findIndex(t => t.name === teamName) + 1
  const correctText = correctIndex !== null ? question.options[correctIndex] : undefined

  return (
    <div className="min-h-dvh flex flex-col items-center px-5 pt-10 pb-8 gap-5">
      <div className="text-center animate-bounce-in">
        <div
          className="mx-auto mb-3 grid place-items-center w-24 h-24 rounded-full border-[5px] border-white font-display text-5xl text-white"
          style={{ background: ui.badge, boxShadow: '0 6px 0 rgba(10, 20, 60, 0.3)', textShadow: '0 3px 0 rgba(0,0,0,0.2)' }}
        >
          {ui.icon}
        </div>
        <h1 className="game-title text-5xl">{ui.title}</h1>
        {outcome === 'correct' && result && (
          <p className="pill mt-3 text-lg">+{formatScore(result.points)} puntos</p>
        )}
      </div>

      <div className={`panel w-full max-w-md p-5 ${outcome === 'correct' ? 'animate-pop-in' : 'animate-shake'}`}>
        {outcome !== 'correct' && correctText && (
          <div className="mb-4">
            <p className="text-ink-soft text-sm text-center mb-2">La respuesta correcta era</p>
            <div className="answer answer-static answer-correct text-base">
              <span className="flex-1 text-center">{correctText}</span>
            </div>
          </div>
        )}
        {myRank > 0 && (
          <p className="text-center text-ink-soft">
            Posición actual:{' '}
            <span className="font-display text-3xl text-highlight align-middle">#{myRank}</span>
            {' '}de {leaderboard.length}
          </p>
        )}
      </div>

      <div className="w-full max-w-md animate-fade-slide-up" style={{ animationDelay: '200ms' }}>
        <Leaderboard teams={leaderboard} highlightName={teamName} limit={5} />
      </div>
    </div>
  )
}
