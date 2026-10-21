import type { Team } from '../../types/game'
import { formatScore } from '../../utils/format'
import Avatar from './Avatar'
import Confetti from './Confetti'
import Leaderboard from './Leaderboard'

type Rank = 1 | 2 | 3

const BLOCK_HEIGHTS: Record<Rank, string> = { 1: 'h-48 md:h-56', 2: 'h-36 md:h-40', 3: 'h-28 md:h-32' }
const BLOCKS: Record<Rank, { top: string; bottom: string; edge: string; fg: string }> = {
  1: { top: '#ffe27a', bottom: '#ffb21e', edge: '#c47a00', fg: '#7a4700' },
  2: { top: '#f4f6fd', bottom: '#c3cbe3', edge: '#8a93b5', fg: '#434b6e' },
  3: { top: '#ffc58f', bottom: '#e8833a', edge: '#9c4a14', fg: '#5a2a07' },
}
const RANK_CAPTIONS: Record<Rank, string> = {
  3: 'Tercer lugar',
  2: 'Segundo lugar',
  1: '¡Y el campeón es...!',
}
// Visual order: 2nd left, 1st center, 3rd right
const DISPLAY_ORDER: Rank[] = [2, 1, 3]

interface Props {
  podium: Team[]
  stage: number // controlled by the admin, synced to every device
  totalPoints: number
  standings?: Team[] // full table, admin only (used to record grades)
  myTeamName?: string
}

export default function Podium({ podium, stage, totalPoints, standings, myTeamName }: Props) {
  // Places are revealed from the lowest present rank up to 1st, then the final step
  const places = podium.length
  const revealStageOf = (rank: Rank) => places - rank + 1
  const winnerRevealed = places > 0 && stage >= revealStageOf(1)
  const finished = stage > places
  const lastRevealed = (places - stage + 1) as Rank

  const caption = stage === 0
    ? 'Preparando el podio...'
    : finished ? '¡Buen juego a todos!' : RANK_CAPTIONS[lastRevealed]

  return (
    <div className="min-h-dvh flex flex-col items-center px-4 pt-10 pb-28 overflow-hidden">
      {winnerRevealed && <Confetti />}

      <header className="text-center mb-8 animate-bounce-in">
        <h1 className="game-title text-5xl md:text-7xl">Resultados</h1>
        <p key={stage} className="font-display text-2xl text-highlight mt-2 h-8 animate-pop-in">
          {caption}
        </p>
      </header>

      <div className="relative flex items-end justify-center gap-3 md:gap-6 w-full max-w-2xl mb-12">
        {winnerRevealed && <div className="winner-rays" aria-hidden />}

        {DISPLAY_ORDER.map(rank => {
          const team = podium[rank - 1]
          if (!team) return <div key={rank} className="w-24 md:w-40" />

          const isRevealed = stage >= revealStageOf(rank)
          const isMe = team.name === myTeamName
          const block = BLOCKS[rank]

          return (
            <div key={rank} className="relative flex flex-col items-center w-24 md:w-40">
              <div
                className={`flex flex-col items-center gap-1 mb-3 text-center ${
                  isRevealed ? 'animate-bounce-in' : 'invisible'
                }`}
              >
                {rank === 1 && (
                  <span className="text-gold text-2xl md:text-3xl tracking-wider animate-wiggle" aria-hidden>
                    ★★★
                  </span>
                )}
                <Avatar name={team.name} colorIndex={team.joinIndex} size={rank === 1 ? 72 : 56} />
                <span
                  className={`font-display leading-tight break-words max-w-full ${
                    rank === 1 ? 'text-xl md:text-2xl' : 'text-base md:text-lg'
                  }`}
                >
                  {team.name}{isMe && ' (tú)'}
                </span>
                <span className="pill text-sm">
                  {formatScore(team.score)} / {formatScore(totalPoints)} pts
                </span>
              </div>

              <div
                className={`w-full ${BLOCK_HEIGHTS[rank]} rounded-t-3xl flex justify-center pt-3 ${
                  isRevealed ? 'animate-grow-up' : 'border-4 border-dashed border-white/30'
                }`}
                style={isRevealed ? {
                  background: `linear-gradient(180deg, ${block.top}, ${block.bottom})`,
                  boxShadow: `inset 0 -10px 0 ${block.edge}, inset 0 4px 0 rgba(255,255,255,0.6), 0 14px 30px -10px rgba(10,20,60,0.5)`,
                } : undefined}
              >
                <span
                  className={`font-display text-5xl md:text-7xl ${isRevealed ? '' : 'text-white/40 animate-pulse'}`}
                  style={isRevealed ? { color: block.fg, textShadow: '0 3px 0 rgba(255,255,255,0.5)' } : undefined}
                >
                  {isRevealed ? rank : '?'}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {finished && standings && (
        <div className="w-full max-w-md animate-fade-slide-up">
          <Leaderboard teams={standings} maxScore={totalPoints} title="Clasificación final" />
        </div>
      )}
    </div>
  )
}
