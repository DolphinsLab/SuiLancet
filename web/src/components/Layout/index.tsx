import { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import WalletButton from '../WalletButton'

interface LayoutProps {
  children: ReactNode
}

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/portfolio', label: 'DeFi', icon: '💰' },
  { path: '/clean', label: 'Clean', icon: '🧹' },
  { path: '/manage', label: 'Manage', icon: '📦' },
  { path: '/secure', label: 'Secure', icon: '🛡️' },
  { path: '/query', label: 'Query', icon: '🔍' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
]

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 h-14">
        <div className="flex items-center h-full">
          {/* Logo area - aligned with sidebar width */}
          <div className="w-64 flex items-center px-6 border-r border-slate-700 h-full">
            <Link to="/" className="flex items-center space-x-2">
              <span className="text-xl">🔱</span>
              <span className="text-lg font-bold text-white tracking-tight">SuiLancet</span>
            </Link>
          </div>
          {/* Header right - aligned with main content */}
          <div className="flex-1 flex items-center justify-between px-6">
            <span className="text-sm text-gray-500">Sui On-Chain Toolkit</span>
            <WalletButton />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-[calc(100vh-3.5rem)] bg-slate-800 border-r border-slate-700">
          <nav className="p-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? 'bg-sui-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-y-auto max-h-[calc(100vh-3.5rem)]">
          <div className="max-w-5xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
