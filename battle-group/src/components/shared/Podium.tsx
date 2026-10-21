import { useEffect, useState } from 'react'
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
// Visual order: 2nd left, 1st center, 3rd right
const DISPLAY_ORDER: Rank[] = [2, 1, 3]
// Stage at which each rank is revealed: 3rd first, then 2nd, then 1st
const REVEAL_STAGE: Record<Rank, number> = { 3: 1, 2: 2, 1: 3 }
const STAGE_TIMES_MS = [1200, 3000, 5000, 6800]
const STAGE_CAPTIONS = ['', 'Tercer lugar', 'Segundo lugar', '¡Y el campeón es...!', '¡Buen juego a todos!']

interface Props {
  podium: Team[]
  all: Team[]
  myTeamName?: string
}

export default function Podium({ podium, all, myTeamName }: Props) {
  const [stage, setStage] = useState(0)

  useEffect(() => {
    const timers = STAGE_TIMES_MS.map((ms, i) => setTimeout(() => setStage(i + 1), ms))
    return () => timers.forEach(clearTimeout)
  }, [])

  const myRank = myTeamName ? all.findIndex(t => t.name === myTeamName) + 1 : 0
  const winnerRevealed = stage >= REVEAL_STAGE[1]
  const listVisible = stage >= STAGE_TIMES_MS.length
  const caption = STAGE_CAPTIONS[stage]

  return (
    <div className="min-h-dvh flex flex-col items-center px-4 pt-10 pb-24 overflow-hidden">
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

          const isRevealed = stage >= REVEAL_STAGE[rank]
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
                <span className="pill text-sm">{formatScore(team.score)} pts</span>
              </div>

              <div
                className={`w-full ${BLOCK_HEIGHTS[rank]} rounded-t-3xl flex justify-center pt-3 ${
                  isRevealed ? 'animate-grow-up' : 'border-4 border-dashed border-white/30'
                }`}
                style={isRevealed ? {
                  background: `linear-gradient(180deg, ${block.top}, ${block.bottom})`,
                  boxShadow: `inset 0 -10px 0 ${block.edge}, inset 0 4px 0 rgba(255,255,255,0.6), 0 14px 30px -10px rgba(20,10,70,0.5)`,
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

      {listVisible && (
        <div className="w-full max-w-md space-y-4 animate-fade-slide-up">
          {myRank > 0 && (
            <div className="panel p-5 text-center">
              <p className="text-ink-soft">Tu posición final</p>
              <p className="font-display text-5xl text-highlight mt-1">#{myRank}</p>
              <p className="text-ink-soft mt-1">de {all.length} jugadores</p>
            </div>
          )}
          <Leaderboard teams={all} highlightName={myTeamName} limit={10} title="Clasificación final" />
        </div>
      )}
    </div>
  )
}
