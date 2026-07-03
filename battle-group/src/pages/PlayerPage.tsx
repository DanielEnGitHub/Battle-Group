import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import confetti from 'canvas-confetti'
import type { Bracket, Picks } from '../types/bracket'
import { fetchBracket, submitPrediction } from '../lib/api'
import {
  resolveBracket, champion, isPredictionComplete, isRoundComplete, roundPending,
} from '../lib/bracket'
import { withFlag } from '../constants/flags'
import GroupRegister from '../components/GroupRegister'
import MatchCard, { type Draft } from '../components/MatchCard'

type Phase = 'register' | 'predict' | 'done'

export default function PlayerPage() {
  const [bracket, setBracket] = useState<Bracket | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [phase, setPhase] = useState<Phase>('register')
  const [group, setGroup] = useState<{ groupName: string; members: string[] }>({ groupName: '', members: [] })
  const [drafts, setDrafts] = useState<Record<number, Draft>>({})
  const [roundIndex, setRoundIndex] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    fetchBracket().then(setBracket).catch(e => setLoadError(e.message))
  }, [])

  // Confetti al enviar la predicción.
  useEffect(() => {
    if (phase !== 'done') return
    confetti({ particleCount: 160, spread: 100, origin: { y: 0.6 } })
    const end = Date.now() + 1600
    let raf = 0
    const tick = () => {
      confetti({ particleCount: 5, angle: 60, spread: 65, origin: { x: 0 } })
      confetti({ particleCount: 5, angle: 120, spread: 65, origin: { x: 1 } })
      if (Date.now() < end) raf = requestAnimationFrame(tick)
    }
    tick()
    return () => cancelAnimationFrame(raf)
  }, [phase])

  // Drafts completos → picks estrictos para resolver el cuadro.
  const picks: Picks = useMemo(() => {
    const out: Picks = {}
    for (const [id, d] of Object.entries(drafts)) {
      if (d.home === '' || d.away === '') continue
      const home = Number(d.home)
      const away = Number(d.away)
      out[Number(id)] = { home, away, penWinner: home === away ? d.penWinner : null }
    }
    return out
  }, [drafts])

  const resolved = useMemo(
    () => (bracket ? resolveBracket(bracket, picks).list : []),
    [bracket, picks],
  )

  const complete = isPredictionComplete(resolved)
  const champ = champion(resolved)

  const handleChange = (matchId: number, draft: Draft) =>
    setDrafts(prev => ({ ...prev, [matchId]: draft }))

  const goToRound = (i: number) => {
    setRoundIndex(i)
    window.scrollTo({ top: 0 })
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      await submitPrediction({ ...group, picks })
      setPhase('done')
    } catch (e) {
      setSubmitError((e as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loadError) {
    return <Centered>⚠️ {loadError}</Centered>
  }

  if (!bracket) {
    return <Centered>Cargando cuadro…</Centered>
  }

  if (phase === 'register') {
    return (
      <GroupRegister
        onDone={data => { setGroup(data); setPhase('predict') }}
      />
    )
  }

  if (phase === 'done') {
    return (
      <Centered>
        <div className="animate-bounce-in text-center">
          <p className="text-5xl">✅</p>
          <h2 className="mt-3 text-2xl font-bold text-white">¡Predicción enviada!</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {group.groupName || group.members.join(', ')} — le llegó al admin.
          </p>
          {champ && <p className="mt-3 text-2xl text-emerald-400">Tu campeón: <b>{withFlag(champ)}</b> 🏆</p>}
        </div>
      </Centered>
    )
  }

  // ── phase === 'predict' ─────────────────────────────────────────────────────
  const round = bracket.rounds[roundIndex]
  const isLastRound = roundIndex === bracket.rounds.length - 1
  const roundMatches = resolved.filter(m => m.round === round.id)
  const missing = roundPending(resolved, round.id).length
  const roundReady = isRoundComplete(resolved, round.id)

  return (
    <div className="flex min-h-dvh flex-col p-4">
      <header className="mb-3 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm text-zinc-500">
            {group.groupName || 'Tu predicción'} · {group.members.join(' · ')}
          </p>
          <h1 className="text-3xl font-bold uppercase tracking-wide text-emerald-400 md:text-4xl">
            {round.name}
          </h1>
        </div>
        <p className="shrink-0 text-right text-sm text-zinc-500">
          Ronda {roundIndex + 1} de {bracket.rounds.length}
        </p>
      </header>

      <div
        className="grid flex-1 gap-4 overflow-y-auto py-2"
        style={{
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
          gridAutoRows: 'minmax(140px, 1fr)',
        }}
      >
        {roundMatches.map(match => (
          <MatchCard
            key={match.id}
            match={match}
            editable
            size="lg"
            draft={drafts[match.id]}
            onChange={d => handleChange(match.id, d)}
          />
        ))}
      </div>

      <div className="sticky bottom-0 mt-4 flex items-center justify-between gap-3
                      border-t border-[#2a2a3a] bg-[#0a0a0f]/95 py-3 backdrop-blur">
        <button
          onClick={() => goToRound(roundIndex - 1)}
          disabled={roundIndex === 0}
          className="rounded-lg border border-[#2a2a3a] px-5 py-2.5 text-base text-zinc-300
                     hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-30"
        >
          ← Atrás
        </button>

        <p className="min-w-0 flex-1 truncate text-center text-base text-zinc-400">
          {roundReady
            ? (isLastRound
                ? <>Campeón: <b className="text-emerald-400">{withFlag(champ)}</b> 🏆</>
                : 'Ronda completa')
            : `Faltan ${missing} resultado${missing === 1 ? '' : 's'}`}
        </p>

        {isLastRound ? (
          <div className="flex items-center gap-2">
            {submitError && <span className="text-xs text-red-400">{submitError}</span>}
            <button
              onClick={handleSubmit}
              disabled={!complete || submitting}
              className="rounded-lg bg-emerald-500 px-6 py-2.5 text-base font-semibold text-black
                         transition-colors hover:bg-emerald-400
                         disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? 'Enviando…' : 'Finalizar y enviar'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => goToRound(roundIndex + 1)}
            disabled={!roundReady}
            className="rounded-lg bg-emerald-500 px-6 py-2.5 text-base font-semibold text-black
                       transition-colors hover:bg-emerald-400
                       disabled:cursor-not-allowed disabled:opacity-40"
          >
            Siguiente →
          </button>
        )}
      </div>
    </div>
  )
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh items-center justify-center p-4 text-zinc-400">
      {children}
    </div>
  )
}
