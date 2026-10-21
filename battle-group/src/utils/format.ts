export const formatScore = (n: number) => Number(n.toFixed(2)).toString()

export const formatSeconds = (ms: number) => `${(ms / 1000).toFixed(1)}s`

export const optionLetter = (i: number) => String.fromCharCode(65 + i)

export const assetUrl = (path: string) =>
  /^(https?:)?\//.test(path) ? path : `/${path}`
