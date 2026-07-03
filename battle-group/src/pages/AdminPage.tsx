import { useCallback, useEffect, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'
import type { Bracket, Prediction } from '../types/bracket'
import { clearPredictions, deletePrediction, fetchBracket, fetchPredictions } from '../lib/api'
import { champion, resolveBracket } from '../lib/bracket'
import { withFlag } from '../constants/flags'
import BracketBoard from '../components/BracketBoard'

const CAPTURE_BG = '#0e0e15'

export default function AdminPage() {
  const [bracket, setBracket] = useState<Bracket | null>(null)
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const captureRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const load = useCallback(async () => {
    try {
      const [b, p] = await Promise.all([fetchBracket(), fetchPredictions()])
      setBracket(b)
      setPredictions(p)
    } catch (e) {
      setError((e as Error).message)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta predicción?')) return
    await deletePrediction(id)
    setPredictions(prev => prev.filter(p => p.id !== id))
  }

  const handleClearAll = async () => {
    if (!confirm(`¿Borrar las ${predictions.length} predicciones? Esto no se puede deshacer.`)) return
    await clearPredictions()
    setPredictions([])
  }

  const fileName = (pred: Prediction) =>
    (pred.groupName || pred.members.join('-') || 'grupo').replace(/\s+/g, '_')

  const downloadPng = async (pred: Prediction) => {
    const node = captureRefs.current[pred.id]
    if (!node) return
    const url = await toPng(node, { backgroundColor: CAPTURE_BG, pixelRatio: 2 })
    const a = document.createElement('a')
    a.href = url
    a.download = `${fileName(pred)}.png`
    a.click()
  }

  const downloadAllPdf = async () => {
    setBusy(true)
    try {
      let pdf: jsPDF | null = null
      for (const pred of predictions) {
        const node = captureRefs.current[pred.id]
        if (!node) continue
        const url = await toPng(node, { backgroundColor: CAPTURE_BG, pixelRatio: 2 })
        const { width, height } = await imageSize(url)
        const orientation = width >= height ? 'landscape' : 'portrait'
        if (!pdf) pdf = new jsPDF({ unit: 'px', format: [width, height], orientation })
        else pdf.addPage([width, height], orientation)
        pdf.addImage(url, 'PNG', 0, 0, width, height)
      }
      pdf?.save('predicciones-mundial-2026.pdf')
    } catch (e) {
      alert('No se pudo generar el PDF: ' + (e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (error) return <div className="p-6 text-red-400">⚠️ {error}</div>
  if (!bracket) return <div className="p-6 text-zinc-400">Cargando…</div>

  return (
    <div className="min-h-dvh p-4 md:p-6">
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Predicciones — Mundial 2026</h1>
          <p className="text-sm text-zinc-500">{predictions.length} grupo(s) enviaron su cuadro</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="rounded-lg border border-[#2a2a3a] bg-[#12121a] px-4 py-2 text-sm
                       text-zinc-300 hover:border-emerald-500/50 hover:text-emerald-400"
          >
            ↻ Actualizar
          </button>
          <button
            onClick={downloadAllPdf}
            disabled={busy || predictions.length === 0}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-black
                       hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? 'Generando…' : '⬇ Descargar todo (PDF)'}
          </button>
          <button
            onClick={handleClearAll}
            disabled={predictions.length === 0}
            className="rounded-lg border border-red-900/60 bg-[#12121a] px-4 py-2 text-sm
                       text-red-400 hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-40"
          >
            🗑 Borrar todo
          </button>
        </div>
      </header>

      {predictions.length === 0 && (
        <p className="text-zinc-500">Todavía no hay predicciones enviadas.</p>
      )}

      <div className="space-y-8">
        {predictions.map(pred => {
          const resolved = resolveBracket(bracket, pred.picks).list
          const champ = champion(resolved)
          return (
            <section key={pred.id} className="overflow-x-auto rounded-2xl border border-[#2a2a3a]">
              <div className="flex justify-end gap-3 px-4 pt-3">
                <button onClick={() => downloadPng(pred)} className="text-xs text-zinc-500 hover:text-emerald-400">
                  ⬇ PNG
                </button>
                <button onClick={() => handleDelete(pred.id)} className="text-xs text-zinc-600 hover:text-red-400">
                  Eliminar
                </button>
              </div>

              {/* Nodo capturado (a imagen/PDF) */}
              <div
                ref={el => { captureRefs.current[pred.id] = el }}
                className="inline-block min-w-full bg-[#0e0e15] p-4"
              >
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-white">
                    {pred.groupName || pred.members.join(', ')}
                  </h2>
                  <p className="text-xs text-zinc-500">
                    {pred.members.join(' · ')} · {new Date(pred.createdAt).toLocaleString()}
                  </p>
                  {champ && (
                    <p className="mt-1 text-sm text-emerald-400">Campeón: <b>{withFlag(champ)}</b> 🏆</p>
                  )}
                </div>
                <BracketBoard bracket={bracket} resolved={resolved} scroll={false} />
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

function imageSize(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = reject
    img.src = dataUrl
  })
}
