import { useState, useCallback } from 'react'

export function useConfirm() {
  const [pending, setPending] = useState(false)
  const confirm = useCallback(async (action: () => Promise<void>) => {
    setPending(true)
    try { await action() } finally { setPending(false) }
  }, [])
  return { confirm, pending }
}