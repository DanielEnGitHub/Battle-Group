import type { Bracket, Picks, ResolvedMatch, MatchResult, Side, RoundId } from '../types/bracket'

function winnerSide(result: MatchResult): Side | null {
  if (result.home > result.away) return 'home'
  if (result.away > result.home) return 'away'
  return result.penWinner // empate → definido por penales (o null si falta elegir)
}

/**
 * Resuelve el cuadro completo a partir de la semilla y las predicciones del jugador.
 * Los partidos se procesan por id ascendente: como cada slot depende de partidos
 * con id menor, al llegar a uno sus fuentes ya están resueltas.
 */
export function resolveBracket(bracket: Bracket, picks: Picks): {
  list: ResolvedMatch[]
  byId: Map<number, ResolvedMatch>
} {
  const byId = new Map<number, ResolvedMatch>()
  const matches = [...bracket.matches].sort((a, b) => a.id - b.id)

  const teamFor = (source: number | null | undefined, type: 'winner' | 'loser' = 'winner') => {
    if (source == null) return null
    const src = byId.get(source)
    if (!src) return null
    return type === 'loser' ? src.loser : src.winner
  }

  for (const m of matches) {
    const home = m.home ?? teamFor(m.homeSource, m.homeSourceType ?? 'winner')
    const away = m.away ?? teamFor(m.awaySource, m.awaySourceType ?? 'winner')
    const result: MatchResult | null = m.locked ? m.result : (picks[m.id] ?? null)

    let winner: string | null = null
    let loser: string | null = null
    if (result && home && away) {
      const side = winnerSide(result)
      if (side === 'home') { winner = home; loser = away }
      else if (side === 'away') { winner = away; loser = home }
    }

    byId.set(m.id, {
      id: m.id,
      round: m.round,
      home,
      away,
      result,
      winner,
      loser,
      locked: m.locked,
      note: m.note,
    })
  }

  return { list: matches.map(m => byId.get(m.id)!), byId }
}

/** Un partido editable está "completo" si tiene ganador definido. */
export function isMatchComplete(rm: ResolvedMatch): boolean {
  return rm.winner != null
}

/** Partidos editables (no bloqueados) cuyos dos equipos ya se conocen. */
export function editableReadyMatches(list: ResolvedMatch[]): ResolvedMatch[] {
  return list.filter(rm => !rm.locked && rm.home && rm.away)
}

/**
 * ¿La predicción está completa? Sin partidos pendientes: como cada slot depende
 * de partidos previos, cero pendientes implica todo el cuadro lleno (incluido el
 * tercer puesto, que no está en el camino a la final).
 */
export function isPredictionComplete(list: ResolvedMatch[]): boolean {
  return pendingCount(list) === 0
}

/** Campeón predicho (o null si falta completar). */
export function champion(list: ResolvedMatch[]): string | null {
  return list.find(rm => rm.round === 'F')?.winner ?? null
}

/** Cuenta partidos editables listos que aún no tienen ganador. */
export function pendingCount(list: ResolvedMatch[]): number {
  return editableReadyMatches(list).filter(rm => !isMatchComplete(rm)).length
}

/** Partidos de una ronda que todavía no tienen ganador definido. */
export function roundPending(list: ResolvedMatch[], round: RoundId): ResolvedMatch[] {
  return list.filter(rm => rm.round === round && rm.winner == null)
}

/** Una ronda está completa cuando todos sus partidos tienen ganador. */
export function isRoundComplete(list: ResolvedMatch[], round: RoundId): boolean {
  const matches = list.filter(rm => rm.round === round)
  return matches.length > 0 && matches.every(rm => rm.winner != null)
}
