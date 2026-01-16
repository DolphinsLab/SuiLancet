import { useState, useEffect, createContext, useContext, useCallback } from 'react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: number
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string, duration?: number) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

const icons: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
}

const colors: Record<ToastType, string> = {
  success: 'bg-green-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
  warning: 'bg-yellow-500',
}

const bgColors: Record<ToastType, string> = {
  success: 'bg-green-500/10 border-green-500/30',
  error: 'bg-red-500/10 border-red-500/30',
  info: 'bg-blue-500/10 border-blue-500/30',
  warning: 'bg-yellow-500/10 border-yellow-500/30',
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, toast.duration || 5000)
    return () => clearTimeout(timer)
  }, [toast.duration, onClose])

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border backdrop-blur-sm shadow-lg animate-slide-in ${bgColors[toast.type]}`}
      role="alert"
    >
      <div className={`flex-shrink-0 w-6 h-6 rounded-full ${colors[toast.type]} flex items-center justify-center text-white text-sm font-bold`}>
        {icons[toast.type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium">{toast.title}</p>
        {toast.message && (
          <p className="text-gray-400 text-sm mt-1 break-words">{toast.message}</p>
        )}
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-gray-400 hover:text-white transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  let idCounter = 0

  const showToast = useCallback((type: ToastType, title: string, message?: string, duration?: number) => {
    const id = Date.now() + idCounter++
    setToasts(prev => [...prev, { id, type, title, message, duration }])
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const success = useCallback((title: string, message?: string) => showToast('success', title, message), [showToast])
  const error = useCallback((title: string, message?: string) => showToast('error', title, message), [showToast])
  const info = useCallback((title: string, message?: string) => showToast('info', title, message), [showToast])
  const warning = useCallback((title: string, message?: string) => showToast('warning', title, message), [showToast])

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onClose={() => removeToast(toast.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
