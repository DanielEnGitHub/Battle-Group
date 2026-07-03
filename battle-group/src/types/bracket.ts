export type RoundId = 'R32' | 'R16' | 'QF' | 'SF' | 'TP' | 'F'

export type Side = 'home' | 'away'

export interface RoundInfo {
  id: RoundId
  name: string
}

export interface MatchResult {
  home: number
  away: number
  /** Solo si terminó empatado: quién gana por penales. */
  penWinner: Side | null
}

/** Partido tal como viene del cuadro semilla (server). */
export interface SeedMatch {
  id: number
  round: RoundId
  /** R32: equipos fijos. Rondas siguientes: null (se resuelven por `*Source`). */
  home?: string | null
  away?: string | null
  /** Id del partido cuyo ganador/perdedor llena este slot. */
  homeSource?: number | null
  awaySource?: number | null
  homeSourceType?: 'winner' | 'loser'
  awaySourceType?: 'winner' | 'loser'
  /** Partido ya jugado: resultado real, no editable. */
  locked: boolean
  result: MatchResult | null
  note?: string
}

export interface Bracket {
  tournament: string
  rounds: RoundInfo[]
  matches: SeedMatch[]
}

/** Lo que el jugador carga por cada partido editable, indexado por match id. */
export type Picks = Record<number, MatchResult>

/** Partido ya resuelto (equipos concretos + resultado si existe). */
export interface ResolvedMatch {
  id: number
  round: RoundId
  home: string | null
  away: string | null
  result: MatchResult | null
  winner: string | null
  loser: string | null
  locked: boolean
  note?: string
}

export interface Prediction {
  id: string
  groupName: string
  members: string[]
  picks: Picks
  createdAt: string
}
