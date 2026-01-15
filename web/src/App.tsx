import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Coin from './pages/Coin'
import Transaction from './pages/Transaction'
import Swap from './pages/Swap'
import Vault from './pages/Vault'
import Settings from './pages/Settings'

function App() {
  return (
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
  )
}

export default App
