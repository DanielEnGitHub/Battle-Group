import { API_URL } from '../config'
import type { Bracket, Picks, Prediction } from '../types/bracket'

export async function fetchBracket(): Promise<Bracket> {
  const res = await fetch(`${API_URL}/bracket`)
  if (!res.ok) throw new Error('No se pudo cargar el cuadro')
  return res.json()
}

export async function submitPrediction(payload: {
  groupName: string
  members: string[]
  picks: Picks
}): Promise<Prediction> {
  const res = await fetch(`${API_URL}/predictions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? 'No se pudo enviar la predicción')
  }
  return res.json()
}

export async function fetchPredictions(): Promise<Prediction[]> {
  const res = await fetch(`${API_URL}/predictions`)
  if (!res.ok) throw new Error('No se pudieron cargar las predicciones')
  return res.json()
}

export async function deletePrediction(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/predictions/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('No se pudo eliminar')
}

export async function clearPredictions(): Promise<void> {
  const res = await fetch(`${API_URL}/predictions`, { method: 'DELETE' })
  if (!res.ok) throw new Error('No se pudo limpiar la tabla')
}
