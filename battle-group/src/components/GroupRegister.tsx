import { useState } from 'react'
import type { FormEvent } from 'react'

interface Props {
  onDone: (data: { groupName: string; members: string[] }) => void
}

export default function GroupRegister({ onDone }: Props) {
  const [groupName, setGroupName] = useState('')
  const [members, setMembers] = useState<string[]>([''])

  const setMember = (i: number, value: string) =>
    setMembers(prev => prev.map((m, idx) => (idx === i ? value : m)))

  const addMember = () => setMembers(prev => [...prev, ''])
  const removeMember = (i: number) => setMembers(prev => prev.filter((_, idx) => idx !== i))

  const clean = members.map(m => m.trim()).filter(Boolean)
  const canContinue = clean.length > 0

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!canContinue) return
    onDone({ groupName: groupName.trim(), members: clean })
  }

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <form
        onSubmit={submit}
        className="animate-fade-slide-up w-full max-w-sm rounded-2xl border border-[#2a2a3a] bg-[#12121a] p-6"
      >
        <h1 className="mb-1 text-2xl font-bold text-white">🏆 Simulador Mundial 2026</h1>
        <p className="mb-6 text-sm text-zinc-500">Registrá tu grupo para armar la predicción.</p>

        <label className="mb-1 block text-xs font-medium text-zinc-400">Nombre del grupo</label>
        <input
          value={groupName}
          onChange={e => setGroupName(e.target.value)}
          placeholder="Los cracks"
          className="mb-5 w-full rounded-lg border border-[#2a2a3a] bg-[#0a0a0f] px-3 py-2
                     text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
        />

        <label className="mb-1 block text-xs font-medium text-zinc-400">Integrantes</label>
        <div className="space-y-2">
          {members.map((m, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={m}
                onChange={e => setMember(i, e.target.value)}
                placeholder={`Integrante ${i + 1}`}
                autoFocus={i === members.length - 1}
                className="flex-1 rounded-lg border border-[#2a2a3a] bg-[#0a0a0f] px-3 py-2
                           text-white placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
              />
              {members.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMember(i)}
                  className="w-10 shrink-0 rounded-lg border border-[#2a2a3a] text-zinc-500
                             hover:border-red-900/60 hover:text-red-400"
                  aria-label="Quitar integrante"
                >
                  −
                </button>
              )}
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addMember}
          className="mt-2 text-sm text-emerald-400 hover:text-emerald-300"
        >
          + Agregar integrante
        </button>

        <button
          type="submit"
          disabled={!canContinue}
          className="mt-6 w-full rounded-lg bg-emerald-500 py-2.5 font-semibold text-black
                     transition-colors hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Continuar
        </button>
      </form>
    </div>
  )
}
