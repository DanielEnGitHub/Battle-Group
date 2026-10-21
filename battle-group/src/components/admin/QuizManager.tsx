import { useEffect, useRef, useState } from 'react'
import type { Question, Quiz } from '../../types/game'
import { optionLetter } from '../../utils/format'

interface QuestionForm {
  text: string
  options: [string, string, string, string]
  correctIndex: number
  timeLimit: number
  img?: string
  topic?: string
}

const emptyQuestion = (): QuestionForm => ({
  text: '',
  options: ['', '', '', ''],
  correctIndex: 0,
  timeLimit: 20,
})

const toFourOptions = (options: unknown[]): [string, string, string, string] =>
  options.slice(0, 4).map(String).concat(['', '', '', '']).slice(0, 4) as [string, string, string, string]

const toForm = (q: Question): QuestionForm => ({
  text: q.text,
  options: toFourOptions(q.options),
  correctIndex: q.correctIndex,
  timeLimit: q.timeLimit,
  ...(q.img ? { img: q.img } : {}),
  ...(q.topic ? { topic: q.topic } : {}),
})

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
    try {
      const res  = await fetch(`${apiUrl}/quizzes`)
      setQuizzes(await res.json())
    } catch {
      setImportErr('No se pudo conectar con el servidor. ¿Está encendido?')
    }
  }

  useEffect(() => { fetchQuizzes() }, [])

  // ── Form helpers ──────────────────────────────────────────────────────────

  const openNew = () => {
    setEditingId(null); setQuizName(''); setQuestions([emptyQuestion()]); setFormOpen(true)
  }

  const openEdit = (quiz: Quiz) => {
    setEditingId(quiz.id)
    setQuizName(quiz.name)
    setQuestions(quiz.questions.map(toForm))
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

  // ── Save ──────────────────────────────────────────────────────────────────

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
      setImportErr('Error al guardar. Verifica la conexión con el servidor e inténtalo de nuevo.')
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
      setImportErr('Error al eliminar. Verifica la conexión con el servidor.')
    } finally {
      await fetchQuizzes()
    }
  }

  // ── Export ────────────────────────────────────────────────────────────────

  const handleExport = (quiz: Quiz, e: React.MouseEvent) => {
    e.stopPropagation()
    const payload = { name: quiz.name, questions: quiz.questions.map(toForm) }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${quiz.name.replace(/\s+/g, '-').toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Import ────────────────────────────────────────────────────────────────

  const parseQuizJson = (raw: string): { name: string; questions: QuestionForm[] } | null => {
    try {
      const data = JSON.parse(raw)
      if (!data.name || !Array.isArray(data.questions)) return null
      const questions: QuestionForm[] = data.questions.map((q: Record<string, unknown>) => ({
        text: String(q.text ?? ''),
        options: toFourOptions(Array.isArray(q.options) ? q.options : []),
        correctIndex: Number(q.correctIndex ?? 0),
        timeLimit: Number(q.timeLimit ?? 20),
        ...(q.img ? { img: String(q.img) } : {}),
        ...(q.topic ? { topic: String(q.topic) } : {}),
      }))
      return { name: String(data.name), questions }
    } catch {
      return null
    }
  }

  const handleImportNew = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const parsed = parseQuizJson(await file.text())
    e.target.value = ''
    if (!parsed) { setImportErr('JSON inválido. Revisa el formato.'); return }
    try {
      const res = await fetch(`${apiUrl}/quizzes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      })
      if (!res.ok) throw new Error(`Server error ${res.status}`)
      await fetchQuizzes()
    } catch {
      setImportErr('Error al importar. Verifica la conexión con el servidor e inténtalo de nuevo.')
    }
  }

  const handleImportForm = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const parsed = parseQuizJson(await file.text())
    e.target.value = ''
    if (!parsed) { setImportErr('JSON inválido. Revisa el formato.'); return }
    setImportErr(null)
    if (parsed.name && !quizName) setQuizName(parsed.name)
    setQuestions(parsed.questions)
  }

  const errorBanner = importErr && (
    <p role="alert" className="panel mb-4 px-5 py-3 text-pink text-center animate-shake">
      {importErr}
    </p>
  )

  // ── View: form ────────────────────────────────────────────────────────────

  if (formOpen) {
    return (
      <div className="min-h-dvh px-4 md:px-8 pt-8 pb-10">
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h1 className="game-title text-4xl">{editingId ? 'Editar quiz' : 'Nuevo quiz'}</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => importFormRef.current?.click()}
                className="btn btn-sm"
                title="Cargar preguntas desde un archivo JSON"
              >
                Importar preguntas
              </button>
              <input ref={importFormRef} type="file" accept=".json,application/json"
                className="hidden" onChange={handleImportForm} />
              <button onClick={closeForm} className="btn btn-sm">Volver</button>
            </div>
          </div>

          {errorBanner}

          <input
            type="text" value={quizName} onChange={e => setQuizName(e.target.value)}
            placeholder="Nombre del quiz" autoFocus
            className="game-input text-xl mb-6"
          />

          <div className="space-y-5">
            {questions.map((q, qi) => (
              <div key={qi} className="panel p-5 animate-fade-slide-up">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-display text-xl text-highlight">Pregunta {qi + 1}</span>
                  {questions.length > 1 && (
                    <button
                      onClick={() => setQuestions(prev => prev.filter((_, i) => i !== qi))}
                      className="grid place-items-center w-9 h-9 rounded-full bg-tile text-ink-soft hover:text-pink transition-colors"
                      title="Eliminar pregunta"
                    >✕</button>
                  )}
                </div>

                <input
                  type="text" value={q.text}
                  onChange={e => updateQuestion(qi, { text: e.target.value })}
                  placeholder="Escribe la pregunta"
                  className="game-input mb-3"
                />

                {q.img && <p className="text-xs text-ink-soft mb-3">Imagen: {q.img}</p>}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt, oi) => (
                    <label key={oi} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio" name={`correct_${qi}`}
                        checked={q.correctIndex === oi}
                        onChange={() => updateQuestion(qi, { correctIndex: oi })}
                        className="accent-lime w-5 h-5 shrink-0"
                        title="Marcar como correcta"
                      />
                      <span className="answer-key w-9 h-9 text-base">{optionLetter(oi)}</span>
                      <input
                        type="text" value={opt}
                        onChange={e => updateOption(qi, oi, e.target.value)}
                        placeholder={`Opción ${optionLetter(oi)}`}
                        className="game-input min-h-11 py-2 text-sm"
                      />
                    </label>
                  ))}
                </div>
                <p className="text-ink-soft text-xs mt-3">
                  Nota: marca la respuesta correcta. El tiempo se define al iniciar las preguntas.
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setQuestions(prev => [...prev, emptyQuestion()])}
            className="mt-5 w-full py-3 rounded-3xl border-4 border-dashed border-white/40 hover:border-white
                       font-display text-lg text-white/85 hover:text-white transition-colors"
          >
            + Agregar pregunta
          </button>

          <button
            onClick={handleSave}
            disabled={saving || !quizName.trim() || questions.some(q => !q.text.trim())}
            className="btn btn-lg w-full mt-5"
          >
            {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear quiz'}
          </button>
        </div>
      </div>
    )
  }

  // ── View: quiz list ───────────────────────────────────────────────────────

  return (
    <div className="min-h-dvh px-4 md:px-8 pt-8 pb-10">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 animate-fade-slide-up">
          <div className="flex items-center gap-4">
            <img src="/logo-escuela.png" alt="Logo de la escuela" className="w-14" />
            <div>
              <h1 className="game-title text-4xl md:text-5xl">Quizzes</h1>
              <p className="text-white/80">Elige un quiz para comenzar</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setImportErr(null); importNewRef.current?.click() }}
              className="btn btn-sm"
            >
              Importar
            </button>
            <input ref={importNewRef} type="file" accept=".json,application/json"
              className="hidden" onChange={handleImportNew} />
            <button onClick={openNew} className="btn btn-sm">+ Nuevo quiz</button>
          </div>
        </div>

        {errorBanner}

        {quizzes.length === 0 ? (
          <div className="panel text-center py-14 px-6">
            <p className="text-5xl mb-4">📚</p>
            <p className="font-display text-2xl">No hay quizzes</p>
            <p className="text-ink-soft mt-1">Crea uno nuevo o importa un archivo JSON.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {quizzes.map((quiz, i) => (
              <div
                key={quiz.id}
                className="row-card rounded-3xl p-3 pl-5 flex flex-wrap items-center gap-4 animate-fade-slide-up"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <div className="flex-1 min-w-[12rem]">
                  <p className="font-display text-xl text-ocean truncate">{quiz.name}</p>
                  <p className="opacity-70 text-sm">
                    {quiz.questions.length} pregunta{quiz.questions.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={e => handleExport(quiz, e)}
                    className="grid place-items-center w-10 h-10 rounded-full bg-black/5 hover:bg-black/10 transition-colors"
                    title="Exportar JSON"
                  >📤</button>
                  <button
                    onClick={() => openEdit(quiz)}
                    className="grid place-items-center w-10 h-10 rounded-full bg-black/5 hover:bg-black/10 transition-colors"
                    title="Editar"
                  >✏️</button>
                  <button
                    onClick={e => handleDelete(quiz.id, e)}
                    className="grid place-items-center w-10 h-10 rounded-full bg-black/5 hover:bg-black/10 transition-colors"
                    title="Eliminar"
                  >🗑️</button>
                  <button onClick={() => onSelectQuiz(quiz.id)} className="btn ml-2">
                    Jugar ▶
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
