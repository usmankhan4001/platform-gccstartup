'use client'
import { createContext, useContext, useState } from 'react'

type Toast = { id: string; message: string; type: 'success' | 'error' | 'info' }

const ToastContext = createContext<{ toast: (message: string, type?: Toast['type']) => void }>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const toast = (message: string, type: Toast['type'] = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000)
  }
  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className={`rounded-md px-4 py-2 text-sm text-white shadow-lg ${t.type === 'error' ? 'bg-danger' : t.type === 'success' ? 'bg-success' : 'bg-primary'}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}