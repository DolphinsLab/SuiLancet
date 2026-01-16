import { ReactNode, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useCurrentAccount } from '@mysten/dapp-kit'
import WalletButton from '../WalletButton'
import { isWalletAllowedForVault } from '../../config/access'

interface LayoutProps {
  children: ReactNode
}

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊', restricted: false },
  { path: '/coin', label: 'Coin', icon: '🪙', restricted: false },
  { path: '/transaction', label: 'Transaction', icon: '📝', restricted: false },
  { path: '/swap', label: 'Swap', icon: '🔄', restricted: false },
  { path: '/vault', label: 'Vault', icon: '🏦', restricted: true },
  { path: '/settings', label: 'Settings', icon: '⚙️', restricted: false },
]

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const account = useCurrentAccount()

  // Check if current wallet is allowed to access restricted pages
  const isVaultAllowed = useMemo(
    () => isWalletAllowedForVault(account?.address),
    [account?.address]
  )

  // Filter nav items based on wallet permissions
  const visibleNavItems = navItems.filter(
    (item) => !item.restricted || isVaultAllowed
  )

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🔱</span>
              <span className="text-xl font-bold text-white">SuiLancet</span>
            </div>
            <WalletButton />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-[calc(100vh-4rem)] bg-slate-800 border-r border-slate-700">
          <nav className="p-4 space-y-2">
            {visibleNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? 'bg-sui-600 text-white'
                    : 'text-gray-300 hover:bg-slate-700'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
