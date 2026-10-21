export const PLAYER_COLORS = [
  '#e8467c', '#2fa8e0', '#ffa91f', '#3bbf6a',
  '#e0574f', '#8b5cc7', '#20b3a6', '#f2759f',
]

export const colorForIndex = (i: number) => PLAYER_COLORS[i % PLAYER_COLORS.length]
