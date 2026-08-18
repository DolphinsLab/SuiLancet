import { useCallback, useEffect, useState } from 'react'
import Layout from './components/Layout'
import { ToastProvider } from './components/Toast'
import { TransactionToastProvider } from './components/TransactionToast'
import Dashboard from './pages/Dashboard'
import Portfolio from './pages/Portfolio'
import Clean from './pages/Clean'
import Manage from './pages/Manage'
import Secure from './pages/Transaction'
import Query from './pages/Query'
import Settings from './pages/Settings'

function App() {
  const [pathname, setPathname] = useState(window.location.pathname)

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = useCallback((path: string) => {
    if (path === window.location.pathname) return
    window.history.pushState(null, '', path)
    setPathname(path)
  }, [])

  return (
    <ToastProvider>
      <TransactionToastProvider>
        <Layout pathname={pathname} onNavigate={navigate}>
          {renderPage(pathname)}
        </Layout>
      </TransactionToastProvider>
    </ToastProvider>
  )
}

function renderPage(pathname: string) {
  switch (pathname) {
    case '/portfolio':
      return <Portfolio />
    case '/clean':
      return <Clean />
    case '/manage':
      return <Manage />
    case '/secure':
      return <Secure />
    case '/query':
      return <Query />
    case '/settings':
      return <Settings />
    default:
      return <Dashboard />
  }
}

export default App
