import { useState, useEffect, createContext, useContext, useCallback } from 'react'

interface TransactionResult {
  id: number
  success: boolean
  digest: string
  message?: string
  duration?: number
}

interface TransactionToastContextType {
  showTransactionResult: (success: boolean, digest: string, message?: string) => void
}

const TransactionToastContext = createContext<TransactionToastContextType | null>(null)

export function useTransactionToast() {
  const context = useContext(TransactionToastContext)
  if (!context) {
    throw new Error('useTransactionToast must be used within a TransactionToastProvider')
  }
  return context
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  )
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  )
}

function TransactionToastItem({
  result,
  onClose
}: {
  result: TransactionResult
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(onClose, 300)
    }, result.duration || 8000)
    return () => clearTimeout(timer)
  }, [result.duration, onClose])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.digest)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(onClose, 300)
  }

  const explorerUrl = `https://suiscan.xyz/mainnet/tx/${result.digest}`

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl border backdrop-blur-md shadow-2xl
        transition-all duration-300 ease-out
        ${isExiting ? 'animate-slide-out opacity-0' : 'animate-slide-in'}
        ${result.success
          ? 'bg-gradient-to-br from-green-900/90 to-green-800/80 border-green-500/50'
          : 'bg-gradient-to-br from-red-900/90 to-red-800/80 border-red-500/50'
        }
      `}
      role="alert"
    >
      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-black/20">
        <div
          className={`h-full ${result.success ? 'bg-green-400' : 'bg-red-400'} animate-progress`}
          style={{ animationDuration: `${result.duration || 8000}ms` }}
        />
      </div>

      <div className="p-4 pt-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`
              flex items-center justify-center w-10 h-10 rounded-full
              ${result.success
                ? 'bg-green-500/30 ring-2 ring-green-400/50'
                : 'bg-red-500/30 ring-2 ring-red-400/50'
              }
            `}>
              {result.success ? (
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <div>
              <h3 className={`font-semibold text-lg ${result.success ? 'text-green-100' : 'text-red-100'}`}>
                {result.success ? 'Transaction Successful' : 'Transaction Failed'}
              </h3>
              {result.message && (
                <p className="text-sm text-gray-300 mt-0.5">{result.message}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Digest */}
        <div className="bg-black/30 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">Transaction Digest</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-mono text-white/90 break-all">
              {result.digest}
            </code>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className={`
              flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg
              font-medium text-sm transition-all duration-200
              ${copied
                ? 'bg-green-500/30 text-green-300 border border-green-500/50'
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30'
              }
            `}
          >
            {copied ? (
              <>
                <CheckIcon className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <CopyIcon className="w-4 h-4" />
                Copy Digest
              </>
            )}
          </button>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="
              flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg
              font-medium text-sm transition-all duration-200
              bg-sui-600/80 hover:bg-sui-500 text-white border border-sui-500/50 hover:border-sui-400
            "
          >
            <ExternalLinkIcon className="w-4 h-4" />
            View on Explorer
          </a>
        </div>
      </div>
    </div>
  )
}

export function TransactionToastProvider({ children }: { children: React.ReactNode }) {
  const [results, setResults] = useState<TransactionResult[]>([])
  let idCounter = 0

  const showTransactionResult = useCallback((success: boolean, digest: string, message?: string) => {
    const id = Date.now() + idCounter++
    setResults(prev => [...prev, { id, success, digest, message, duration: 10000 }])
  }, [])

  const removeResult = useCallback((id: number) => {
    setResults(prev => prev.filter(r => r.id !== id))
  }, [])

  return (
    <TransactionToastContext.Provider value={{ showTransactionResult }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 w-[420px] max-w-[calc(100vw-2rem)] pointer-events-none">
        {results.map(result => (
          <div key={result.id} className="pointer-events-auto">
            <TransactionToastItem result={result} onClose={() => removeResult(result.id)} />
          </div>
        ))}
      </div>
    </TransactionToastContext.Provider>
  )
}
