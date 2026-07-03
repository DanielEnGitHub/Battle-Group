// Mapa nombre (como viene en worldcup2026.json) → emoji de bandera.
// Nota: en Windows los emojis de bandera no renderizan (muestran las siglas).
const FLAGS: Record<string, string> = {
  'Canadá': '🇨🇦',
  'Sudáfrica': '🇿🇦',
  'Brasil': '🇧🇷',
  'Japón': '🇯🇵',
  'Alemania': '🇩🇪',
  'Paraguay': '🇵🇾',
  'Países Bajos': '🇳🇱',
  'Marruecos': '🇲🇦',
  'Noruega': '🇳🇴',
  'Costa de Marfil': '🇨🇮',
  'Francia': '🇫🇷',
  'Suecia': '🇸🇪',
  'México': '🇲🇽',
  'Ecuador': '🇪🇨',
  'Inglaterra': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  'RD Congo': '🇨🇩',
  'Bélgica': '🇧🇪',
  'Senegal': '🇸🇳',
  'Estados Unidos': '🇺🇸',
  'Bosnia y Herzegovina': '🇧🇦',
  'Suiza': '🇨🇭',
  'Argelia': '🇩🇿',
  'España': '🇪🇸',
  'Austria': '🇦🇹',
  'Colombia': '🇨🇴',
  'Ghana': '🇬🇭',
  'Argentina': '🇦🇷',
  'Cabo Verde': '🇨🇻',
  'Portugal': '🇵🇹',
  'Croacia': '🇭🇷',
  'Australia': '🇦🇺',
  'Egipto': '🇪🇬',
}

export function flag(team: string | null | undefined): string {
  return team ? (FLAGS[team] ?? '') : ''
}

/** "🇦🇷 Argentina" (o solo el nombre si no hay bandera / equipo). */
export function withFlag(team: string | null | undefined): string {
  if (!team) return ''
  const f = FLAGS[team]
  return f ? `${f} ${team}` : team
}
