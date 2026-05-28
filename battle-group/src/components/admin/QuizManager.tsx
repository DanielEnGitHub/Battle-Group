import { useEffect, useRef, useState } from 'react'
import type { Quiz } from '../../types/game'

interface QuestionForm {
  text: string
  options: [string, string, string, string]
  correctIndex: number
  timeLimit: number
}

const emptyQuestion = (): QuestionForm => ({
  text: '',
  options: ['', '', '', ''],
  correctIndex: 0,
  timeLimit: 30,
})

const OPTION_LABELS = ['A', 'B', 'C', 'D']
const OPTION_COLORS = ['text-[#E21B3C]', 'text-[#1368CE]', 'text-[#D89E00]', 'text-[#26890C]']

interface Props {
  apiUrl: string
  onSelectQuiz: (quizId: string) => void
}

export default function QuizManager({ apiUrl, onSelectQuiz }: Props) {
  const [quizzes,   setQuizzes]   = useState<Quiz[]>([])
  const [formOpen,  setFormOpen]  = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [quizName,  setQuizName]  = useState('')
  const [questions, setQuestions] = useState<QuestionForm[]>([emptyQuestion()])
  const [saving,    setSaving]    = useState(false)
  const [importErr, setImportErr] = useState<string | null>(null)

  const importNewRef  = useRef<HTMLInputElement>(null)
  const importFormRef = useRef<HTMLInputElement>(null)

  const fetchQuizzes = async () => {
    const res  = await fetch(`${apiUrl}/quizzes`)
    const data = await res.json()
    setQuizzes(data)
  }

  useEffect(() => { fetchQuizzes() }, [])

  // ── Helpers de formulario ─────────────────────────────────────────────────

  const openNew = () => {
    setEditingId(null); setQuizName(''); setQuestions([emptyQuestion()]); setFormOpen(true)
  }

  const openEdit = (quiz: Quiz) => {
    setEditingId(quiz.id)
    setQuizName(quiz.name)
    setQuestions(quiz.questions.map(q => ({
      text: q.text,
      options: [...q.options] as [string, string, string, string],
      correctIndex: q.correctIndex,
      timeLimit: q.timeLimit,
    })))
    setFormOpen(true)
  }

  const closeForm = () => { setFormOpen(false); setEditingId(null); setImportErr(null) }

  const updateQuestion = (i: number, patch: Partial<QuestionForm>) =>
    setQuestions(prev => prev.map((q, idx) => idx === i ? { ...q, ...patch } : q))

  const updateOption = (qi: number, oi: number, value: string) =>
    setQuestions(prev => prev.map((q, idx) => {
      if (idx !== qi) return q
      const opts = [...q.options] as [string, string, string, string]
      opts[oi] = value
      return { ...q, options: opts }
    }))

  // ── Guardar ───────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!quizName.trim() || questions.some(q => !q.text.trim())) return
    setSaving(true)
    try {
      const body = JSON.stringify({ name: quizName.trim(), questions })
      const headers = { 'Content-Type': 'application/json' }
      const res = editingId
        ? await fetch(`${apiUrl}/quizzes/${editingId}`, { method: 'PUT', headers, body })
        : await fetch(`${apiUrl}/quizzes`, { method: 'POST', headers, body })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      await fetchQuizzes()
      closeForm()
    } catch {
      setImportErr('Error al guardar. Verificá la conexión con el servidor y reintentá.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('¿Eliminar este quiz?')) return
    try {
      const res = await fetch(`${apiUrl}/quizzes/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
    } catch {
      setImportErr('Error al eliminar. Verificá la conexión con el servidor.')
    } finally {
      await fetchQuizzes()
    }
  }

  // ── Export ────────────────────────────────────────────────────────────────

  const handleExport = (quiz: Quiz, e: React.MouseEvent) => {
    e.stopPropagation()
    const payload = {
      name: quiz.name,
      questions: quiz.questions.map(q => ({
        text: q.text,
        options: q.options,
        correctIndex: q.correctIndex,
        timeLimit: q.timeLimit,
      })),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${quiz.name.replace(/\s+/g, '-').toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Import: JSON completo → nueva entrada en la lista ────────────────────

  const parseQuizJson = (raw: string): { name: string; questions: QuestionForm[] } | null => {
    try {
      const data = JSON.parse(raw)
      if (!data.name || !Array.isArray(data.questions)) return null
      const questions: QuestionForm[] = data.questions.map((q: Record<string, unknown>) => ({
        text: String(q.text ?? ''),
        options: (Array.isArray(q.options) ? q.options.slice(0, 4) : ['', '', '', ''])
          .map(String)
          .concat(['', '', '', ''])
          .slice(0, 4) as [string, string, string, string],
        correctIndex: Number(q.correctIndex ?? 0),
        timeLimit: Number(q.timeLimit ?? 30),
      }))
      return { name: String(data.name), questions }
    } catch {
      return null
    }
  }

  const handleImportNew = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const parsed = parseQuizJson(text)
    e.target.value = ''
    if (!parsed) { setImportErr('JSON inválido. Revisá el formato.'); return }
    try {
      const res = await fetch(`${apiUrl}/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      await fetchQuizzes()
    } catch {
      setImportErr('Error al importar. Verificá la conexión con el servidor y reintentá.')
    }
  }

  // ── Import: JSON → pre-llenar formulario ─────────────────────────────────

  const handleImportForm = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const text = await file.text()
    const parsed = parseQuizJson(text)
    e.target.value = ''
    if (!parsed) { setImportErr('JSON inválido. Revisá el formato.'); return }
    setImportErr(null)
    if (parsed.name && !quizName) setQuizName(parsed.name)
    setQuestions(parsed.questions)
  }

  // ── Vista: Formulario ─────────────────────────────────────────────────────

  if (formOpen) {
    return (
      <div className="min-h-dvh bg-[#0a0a0f] p-4 md:p-8">
        <div className="max-w-2xl mx-auto">

          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-black text-white">
              {editingId ? '✏️ Editar Quiz' : 'Nuevo Quiz'}
            </h1>
            <div className="flex items-center gap-2">
              {/* Importar preguntas desde JSON */}
              <button
                onClick={() => importFormRef.current?.click()}
                className="text-zinc-500 hover:text-yellow-400 px-3 py-1.5 rounded-xl
                           border border-[#2a2a3a] hover:border-yellow-400/40 text-sm transition-colors"
                title="Cargar preguntas desde un archivo JSON"
              >
                📥 Importar preguntas
              </button>
              <input ref={importFormRef} type="file" accept=".json,application/json"
                className="hidden" onChange={handleImportForm} />

              <button
                onClick={closeForm}
                className="text-zinc-500 hover:text-white px-3 py-1.5 rounded-xl
                           border border-[#2a2a3a] hover:border-zinc-500 text-sm transition-colors"
              >
                ← Volver
              </button>
            </div>
          </div>

          {importErr && (
            <p className="mb-4 text-red-400 text-sm bg-red-950/30 border border-red-900/40
                           px-4 py-2 rounded-xl">{importErr}</p>
          )}

          <input
            type="text" value={quizName} onChange={e => setQuizName(e.target.value)}
            placeholder="Nombre del quiz..." autoFocus
            className="w-full px-4 py-3 bg-[#12121a] border border-[#2a2a3a] rounded-xl
                       text-white placeholder-zinc-600 text-lg mb-6
                       focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/30"
          />

          <div className="space-y-5">
            {questions.map((q, qi) => (
              <div key={qi} className="bg-[#12121a] border border-[#2a2a3a] rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-yellow-400 font-black text-xs uppercase tracking-widest">
                    Pregunta {qi + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <select
                      value={q.timeLimit}
                      onChange={e => updateQuestion(qi, { timeLimit: Number(e.target.value) })}
                      className="bg-[#1a1a2e] border border-[#2a2a3a] text-zinc-400 text-xs
                                 rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                    >
                      <option value={15}>15s</option>
                      <option value={30}>30s</option>
                      <option value={60}>60s</option>
                    </select>
                    {questions.length > 1 && (
                      <button
                        onClick={() => setQuestions(prev => prev.filter((_, i) => i !== qi))}
                        className="text-zinc-600 hover:text-red-400 text-sm px-1 transition-colors"
                      >✕</button>
                    )}
                  </div>
                </div>

                <input
                  type="text" value={q.text}
                  onChange={e => updateQuestion(qi, { text: e.target.value })}
                  placeholder="¿Cuál es la pregunta?"
                  className="w-full px-3 py-2 bg-[#0a0a0f] border border-[#2a2a3a] rounded-xl
                             text-white placeholder-zinc-600 text-sm mb-3
                             focus:outline-none focus:border-yellow-400/40"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <input type="radio" name={`correct_${qi}`}
                        checked={q.correctIndex === oi}
                        onChange={() => updateQuestion(qi, { correctIndex: oi })}
                        className="accent-yellow-400 flex-shrink-0 cursor-pointer"
                        title="Marcar como correcta"
                      />
                      <span className={`font-black text-sm flex-shrink-0 w-4 ${OPTION_COLORS[oi]}`}>
                        {OPTION_LABELS[oi]}
                      </span>
                      <input
                        type="text" value={opt}
                        onChange={e => updateOption(qi, oi, e.target.value)}
                        placeholder={`Opción ${OPTION_LABELS[oi]}...`}
                        className="flex-1 px-2 py-1.5 bg-[#0a0a0f] border border-[#2a2a3a] rounded-lg
                                   text-white placeholder-zinc-600 text-sm
                                   focus:outline-none focus:border-zinc-500"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-zinc-600 text-xs mt-2">☝️ El radio marcado indica la respuesta correcta.</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setQuestions(prev => [...prev, emptyQuestion()])}
            className="mt-4 w-full py-3 border border-dashed border-[#2a2a3a]
                       hover:border-yellow-400/40 text-zinc-600 hover:text-yellow-400
                       rounded-xl text-sm transition-colors"
          >
            + Agregar pregunta
          </button>

          <button
            onClick={handleSave}
            disabled={saving || !quizName.trim() || questions.some(q => !q.text.trim())}
            className="mt-3 w-full py-4 bg-yellow-400 hover:bg-yellow-300 disabled:opacity-40
                       disabled:cursor-not-allowed text-black font-black text-lg rounded-xl
                       uppercase tracking-widest transition-all active:scale-95"
          >
            {saving ? 'Guardando...' : editingId ? '💾 Guardar Cambios' : '💾 Crear Quiz'}
          </button>
        </div>
      </div>
    )
  }

  // ── Vista: Lista de quizzes ───────────────────────────────────────────────

  return (
    <div className="min-h-dvh bg-[#0a0a0f] p-4 md:p-8">
      <div className="max-w-2xl mx-auto">

        <div className="flex items-center justify-between mb-8 gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl font-black"><span className="text-yellow-400">VERSUS</span></h1>
            <p className="text-zinc-500 text-sm">Panel de administrador</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Importar quiz completo desde JSON */}
            <button
              onClick={() => { setImportErr(null); importNewRef.current?.click() }}
              className="px-4 py-2 text-zinc-400 hover:text-yellow-400 font-medium
                         border border-[#2a2a3a] hover:border-yellow-400/40 rounded-xl text-sm
                         transition-colors"
            >
              📥 Importar JSON
            </button>
            <input ref={importNewRef} type="file" accept=".json,application/json"
              className="hidden" onChange={handleImportNew} />

            <button
              onClick={openNew}
              className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black font-bold
                         rounded-xl text-sm transition-all active:scale-95"
            >
              + Nuevo Quiz
            </button>
          </div>
        </div>

        {importErr && (
          <p className="mb-4 text-red-400 text-sm bg-red-950/30 border border-red-900/40
                         px-4 py-2 rounded-xl">{importErr}</p>
        )}

        {quizzes.length === 0 ? (
          <div className="text-center py-20 text-zinc-600">
            <p className="text-5xl mb-4">🏁</p>
            <p className="font-medium">No hay quizzes todavía.</p>
            <p className="text-sm mt-1">Creá uno o importá un JSON para empezar.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {quizzes.map(quiz => (
              <div
                key={quiz.id}
                className="bg-[#12121a] border border-[#2a2a3a] hover:border-zinc-600
                           rounded-2xl p-4 flex items-center gap-4 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold truncate">{quiz.name}</p>
                  <p className="text-zinc-500 text-sm">
                    {quiz.questions.length} pregunta{quiz.questions.length !== 1 ? 's' : ''}
                    {' · '}Máx. 12 pts
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={e => handleExport(quiz, e)}
                    className="p-2 text-zinc-500 hover:text-green-400 transition-colors
                               rounded-lg hover:bg-green-950/30"
                    title="Exportar JSON"
                  >
                    📤
                  </button>
                  <button
                    onClick={() => openEdit(quiz)}
                    className="p-2 text-zinc-500 hover:text-yellow-400 transition-colors
                               rounded-lg hover:bg-yellow-400/10"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={e => handleDelete(quiz.id, e)}
                    className="p-2 text-zinc-600 hover:text-red-400 transition-colors
                               rounded-lg hover:bg-red-950/30"
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                  <button
                    onClick={() => onSelectQuiz(quiz.id)}
                    className="px-4 py-2 bg-yellow-400 hover:bg-yellow-300 text-black font-bold
                               rounded-xl text-sm transition-all active:scale-95"
                  >
                    ▶ Jugar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
