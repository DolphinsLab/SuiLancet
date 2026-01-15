import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit'

export default function WalletButton() {
  const account = useCurrentAccount()

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
      <ConnectButton
        connectText="Connect Wallet"
        className="btn-primary"
      />
    </div>
  )
}
