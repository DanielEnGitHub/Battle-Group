import type { ActiveQuestion, QuestionResults, Team } from '../../types/game'
import RaceTrack from '../shared/RaceTrack'

const OPTION_LABELS = ['A', 'B', 'C', 'D']
const OPTION_BASE   = [
  'bg-[#E21B3C]/15 border-[#E21B3C]/30',
  'bg-[#1368CE]/15 border-[#1368CE]/30',
  'bg-[#D89E00]/15 border-[#D89E00]/30',
  'bg-[#26890C]/15 border-[#26890C]/30',
]

interface Props {
  phase: 'question' | 'results'
  currentQuestion: ActiveQuestion | null
  answersCount: number
  totalTeams: number
  questionResults: QuestionResults | null
  racePositions: Team[]
  onRevealResults: () => void
  onNextQuestion: () => void
}

export default function AdminGameControl({
  phase,
  currentQuestion,
  answersCount,
  totalTeams,
  questionResults,
  racePositions,
  onRevealResults,
  onNextQuestion,
}: Props) {
  return (
    <div className="min-h-dvh bg-[#0a0a0f] flex flex-col md:flex-row">
      {/* Panel izquierdo: control de pregunta */}
      <div className="w-full md:w-[420px] flex-shrink-0 flex flex-col p-6 border-r border-[#2a2a3a]">

        {currentQuestion && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-zinc-500 uppercase tracking-widest">
                Pregunta {currentQuestion.index + 1} / {currentQuestion.total}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                phase === 'question'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-zinc-700/30 text-zinc-400 border border-zinc-600/30'
              }`}>
                {phase === 'question' ? '● En curso' : '✓ Revelada'}
              </span>
            </div>

            {/* Texto */}
            <div className="bg-[#12121a] border border-[#2a2a3a] rounded-2xl p-4 mb-4">
              <p className="text-white font-bold text-lg leading-relaxed">
                {currentQuestion.text}
              </p>
            </div>

            {/* Opciones */}
            <div className="space-y-2 mb-4">
              {currentQuestion.options.map((opt, i) => {
                const isCorrect = currentQuestion.correctIndex === i
                const revealed  = phase === 'results'
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm
                      ${revealed && isCorrect
                        ? 'bg-green-500/20 border-green-500/60'
                        : OPTION_BASE[i]
                      }`}
                  >
                    <span className="font-black text-zinc-400 w-4 flex-shrink-0">
                      {OPTION_LABELS[i]}
                    </span>
                    <span className={revealed && isCorrect ? 'text-green-400 font-bold' : 'text-white'}>
                      {opt}
                    </span>
                    {revealed && isCorrect && (
                      <span className="ml-auto text-green-400">✓ Correcta</span>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Contador de respuestas */}
        {phase === 'question' && (
          <div className="bg-[#12121a] border border-[#2a2a3a] rounded-xl p-4 mb-4 text-center">
            <p className="text-4xl font-black text-white tabular-nums">
              {answersCount}
              <span className="text-zinc-600 text-2xl">/{totalTeams}</span>
            </p>
            <p className="text-zinc-500 text-xs mt-1 uppercase tracking-widest">
              equipos respondieron
            </p>
            {/* Barra de progreso */}
            <div className="mt-3 h-1.5 bg-[#2a2a3a] rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                style={{ width: totalTeams > 0 ? `${(answersCount / totalTeams) * 100}%` : '0%' }}
              />
            </div>
          </div>
        )}

        {/* Resumen de resultados */}
        {phase === 'results' && questionResults && (
          <div className="bg-[#12121a] border border-[#2a2a3a] rounded-xl p-4 mb-4">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-3">
              Resultados
            </p>
            <div className="flex gap-6 justify-center">
              <div className="text-center">
                <p className="text-3xl font-black text-green-400">
                  {questionResults.answers.filter(a => a.correct).length}
                </p>
                <p className="text-xs text-zinc-500">Correctas</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-red-400">
                  {questionResults.answers.filter(a => !a.correct).length}
                </p>
                <p className="text-xs text-zinc-500">Incorrectas</p>
              </div>
            </div>

            {/* Top 3 más rápidos */}
            {questionResults.answers.filter(a => a.correct).length > 0 && (
              <div className="mt-3 pt-3 border-t border-[#2a2a3a]">
                <p className="text-xs text-zinc-600 mb-2">Más rápidos:</p>
                {questionResults.answers
                  .filter(a => a.correct)
                  .sort((a, b) => a.timeMs - b.timeMs)
                  .slice(0, 3)
                  .map((a, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-0.5">
                      <span className="text-zinc-400">{a.teamName}</span>
                      <span className="text-yellow-400 tabular-nums font-medium">
                        {(a.timeMs / 1000).toFixed(2)}s
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Botones de acción */}
        <div className="mt-auto space-y-3">
          {phase === 'question' && (
            <button
              onClick={onRevealResults}
              className="w-full py-4 bg-yellow-400 hover:bg-yellow-300 text-black font-black
                         text-lg rounded-xl uppercase tracking-widest transition-all active:scale-95"
            >
              👁️ Revelar Resultados
            </button>
          )}
          {phase === 'results' && (
            <button
              onClick={onNextQuestion}
              className="w-full py-4 bg-green-500 hover:bg-green-400 text-white font-black
                         text-lg rounded-xl uppercase tracking-widest transition-all active:scale-95"
            >
              ▶ Siguiente Pregunta
            </button>
          )}
        </div>
      </div>

      {/* Panel derecho: carrera en tiempo real */}
      <div className="flex-1 p-6 flex flex-col">
        <p className="text-xs text-zinc-500 uppercase tracking-widest mb-4 text-center">
          Carrera en tiempo real
        </p>
        <div className="flex-1">
          <RaceTrack teams={racePositions} />
        </div>
      </div>
    </div>
  )
}
