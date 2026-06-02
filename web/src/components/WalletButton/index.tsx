import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit'
import { useDolphinId } from '../DolphinIdProvider'
import { useToast } from '../Toast'

export default function WalletButton() {
  const account = useCurrentAccount()
  const dolphinId = useDolphinId()
  const toast = useToast()

  const handleSignIn = async () => {
    try {
      const session = await dolphinId.signIn()
      toast.success('Dolphin ID Connected', session.subject)
    } catch (err: any) {
      toast.error('Dolphin ID Failed', err.message)
    }
  }

  const handleLogout = async () => {
    await dolphinId.logout()
    toast.info('Dolphin ID', 'Signed out')
  }

  return (
    <div className="flex items-center space-x-4">
      {account && (
        <div className="text-sm text-gray-300">
          <span className="text-gray-500">Connected: </span>
          <span className="font-mono">
            {account.address.slice(0, 6)}...{account.address.slice(-4)}
          </span>
        </div>
      )}
      {account && (
        dolphinId.session ? (
          <button
            type="button"
            onClick={handleLogout}
            className="btn-secondary text-sm py-1.5"
          >
            ID Signed In
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSignIn}
            disabled={dolphinId.status === 'signing' || dolphinId.status === 'restoring'}
            className="btn-secondary text-sm py-1.5 disabled:opacity-50"
          >
            {dolphinId.status === 'signing' ? 'Signing...' : 'Dolphin ID'}
          </button>
        )
      )}
      <ConnectButton
        connectText="Connect Wallet"
        className="btn-primary"
      />
    </div>
  )
}
