import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DAppKitProvider } from '@mysten/dapp-kit-react'
import App from './App'
import { DolphinIdProvider } from './components/DolphinIdProvider'
import { dAppKit } from './lib/sui-dapp'
import './index.css'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <DAppKitProvider dAppKit={dAppKit}>
        <DolphinIdProvider>
          <App />
        </DolphinIdProvider>
      </DAppKitProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)
