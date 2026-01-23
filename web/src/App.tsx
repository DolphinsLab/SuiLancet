import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import { ToastProvider } from './components/Toast'
import { TransactionToastProvider } from './components/TransactionToast'
import Dashboard from './pages/Dashboard'
import Clean from './pages/Clean'
import Manage from './pages/Manage'
import Secure from './pages/Transaction'
import Query from './pages/Query'
import Settings from './pages/Settings'

function App() {
  return (
    <ToastProvider>
      <TransactionToastProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clean" element={<Clean />} />
            <Route path="/manage" element={<Manage />} />
            <Route path="/secure" element={<Secure />} />
            <Route path="/query" element={<Query />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </TransactionToastProvider>
    </ToastProvider>
  )
}

export default App
