import { useState } from 'react'
import type { GameConfig, Team } from '../../types/game'
import Avatar from '../shared/Avatar'

const TIME_PRESETS = [10, 15, 20, 30, 45, 60]
const COUNT_PRESETS = [5, 10, 15]
const MIN_SECONDS = 5
const MAX_SECONDS = 300

interface Props {
  teams: Team[]
  quizName: string
  bankSize: number
  joinUrls: string[]
  onStart: (config: GameConfig) => void
  onBack: () => void
  onEnd: () => void
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))

export default function AdminLobby({ teams, quizName, bankSize, joinUrls, onStart, onBack, onEnd }: Props) {
  const [questionCount, setQuestionCount] = useState(() => Math.min(10, bankSize))
  const [timeLimit,     setTimeLimit]     = useState(20)
  const [copied,        setCopied]        = useState(false)

  const count   = clamp(questionCount || 1, 1, Math.max(1, bankSize))
  const seconds = clamp(timeLimit || MIN_SECONDS, MIN_SECONDS, MAX_SECONDS)
  const totalMinutes = Math.max(1, Math.round((count * seconds) / 60))
  const canStart = teams.length > 0 && bankSize > 0
  const mainUrl = joinUrls[0]

  // Clipboard is only available on secure origins (localhost/https); hide the button elsewhere
  const canCopy = Boolean(mainUrl && navigator.clipboard)

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(mainUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="min-h-dvh w-full max-w-6xl mx-auto px-4 md:px-8 py-8 flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4 animate-fade-slide-up">
        <div className="flex items-center gap-4">
          <img src="/logo-escuela.png" alt="Logo de la escuela" className="w-14" />
          <h1 className="game-title text-3xl md:text-4xl">{quizName}</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={onBack} className="btn btn-sm">Cambiar quiz</button>
          <button onClick={onEnd} className="btn btn-sm">Terminar</button>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="panel p-6 flex flex-col gap-6 animate-pop-in">
          <h2 className="font-display text-2xl">Configuración</h2>

          <div>
            <div className="flex items-baseline justify-between mb-3">
              <label htmlFor="question-count">Número de preguntas</label>
              <span className="text-sm text-ink-soft">de {bankSize}</span>
            </div>
            <div className="flex items-center gap-4">
              <input
                id="question-count"
                type="range"
                min={1}
                max={Math.max(1, bankSize)}
                value={count}
                onChange={e => setQuestionCount(Number(e.target.value))}
                className="flex-1 accent-highlight h-2 cursor-pointer"
              />
              <input
                type="number"
                min={1}
                max={bankSize}
                value={questionCount}
                onChange={e => setQuestionCount(Number(e.target.value))}
                onBlur={() => setQuestionCount(count)}
                className="game-input w-20 text-center"
                aria-label="Número de preguntas"
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              {COUNT_PRESETS.filter(n => n < bankSize).map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setQuestionCount(n)}
                  className={`chip ${count === n ? 'chip-active' : ''}`}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setQuestionCount(bankSize)}
                className={`chip ${count === bankSize ? 'chip-active' : ''}`}
              >
                Todas
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="time-limit" className="block mb-3">Segundos por pregunta</label>
            <div className="flex flex-wrap items-center gap-2">
              {TIME_PRESETS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setTimeLimit(s)}
                  className={`chip ${seconds === s ? 'chip-active' : ''}`}
                >
                  {s}
                </button>
              ))}
              <input
                id="time-limit"
                type="number"
                min={MIN_SECONDS}
                max={MAX_SECONDS}
                value={timeLimit}
                onChange={e => setTimeLimit(Number(e.target.value))}
                onBlur={() => setTimeLimit(seconds)}
                className="game-input w-20 text-center ml-1"
              />
            </div>
          </div>

          <div className="rounded-2xl bg-tile px-4 py-3 text-ink-soft">
            {count} preguntas · {seconds} s cada una · unos {totalMinutes} min
          </div>

          <p className="text-sm text-ink-soft -mt-2">
            Nota: las preguntas y las respuestas se muestran en orden aleatorio.
          </p>

          <div className="mt-auto pt-2">
            <button
              onClick={() => onStart({ questionCount: count, timeLimit: seconds })}
              disabled={!canStart}
              className="btn btn-lg w-full"
            >
              Comenzar
            </button>
            {teams.length === 0 && (
              <p className="text-center text-sm text-ink-soft mt-3">
                Se necesita al menos un jugador para iniciar.
              </p>
            )}
          </div>
        </section>

        <div className="flex flex-col gap-6">
          <section className="panel p-6 animate-pop-in" style={{ animationDelay: '80ms' }}>
            <h2 className="font-display text-2xl mb-4">Cómo unirse</h2>
            {mainUrl ? (
              <div className="flex items-center gap-3 rounded-2xl bg-tile p-2 pl-4">
                <span className="flex-1 min-w-0 font-display text-2xl md:text-3xl text-highlight break-all">
                  {mainUrl}
                </span>
                {canCopy && (
                  <button onClick={copyUrl} className="btn btn-sm shrink-0">
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-ink-soft">Buscando la dirección de la red...</p>
            )}
            {joinUrls.slice(1).map(url => (
              <p key={url} className="text-sm text-ink-soft mt-2 break-all">También: {url}</p>
            ))}
            <p className="text-sm text-ink-soft mt-4">
              Nota: todos deben estar conectados a la misma red Wi-Fi.
            </p>
          </section>

          <section className="panel p-6 flex-1 animate-pop-in" style={{ animationDelay: '160ms' }}>
            <h2 className="font-display text-2xl mb-4">Jugadores ({teams.length})</h2>
            {teams.length === 0 ? (
              <div className="text-center py-10 text-ink-soft">
                <div className="text-4xl mb-3 animate-float">📱</div>
                <p>Esperando jugadores...</p>
              </div>
            ) : (
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {teams.map(t => (
                  <li
                    key={t.sessionId}
                    className="flex items-center gap-2 row-card px-2 py-2 animate-pop-in"
                  >
                    <Avatar name={t.name} colorIndex={t.joinIndex} size={32} />
                    <span className="truncate">{t.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
