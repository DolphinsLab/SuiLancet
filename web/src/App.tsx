import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import { ToastProvider } from './components/Toast'
import { TransactionToastProvider } from './components/TransactionToast'
import Dashboard from './pages/Dashboard'
import Coin from './pages/Coin'
import Transaction from './pages/Transaction'
import Swap from './pages/Swap'
import Vault from './pages/Vault'
import Settings from './pages/Settings'

function App() {
  return (
    <ToastProvider>
      <TransactionToastProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/coin" element={<Coin />} />
            <Route path="/transaction" element={<Transaction />} />
            <Route path="/swap" element={<Swap />} />
            <Route path="/vault" element={<Vault />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </TransactionToastProvider>
    </ToastProvider>
  )
}

export default App
