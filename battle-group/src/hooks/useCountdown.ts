import { useEffect, useState } from 'react'

// The deadline is fixed at mount: key the consuming component by question index to restart it.
export function useCountdown(initialMs: number): number {
  const [msLeft, setMsLeft] = useState(initialMs)

  useEffect(() => {
    const deadline = Date.now() + initialMs
    const id = setInterval(() => {
      const left = Math.max(0, deadline - Date.now())
      setMsLeft(left)
      if (left === 0) clearInterval(id)
    }, 200)
    return () => clearInterval(id)
  }, [initialMs])

  return msLeft
}
