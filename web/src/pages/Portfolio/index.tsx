import { useState, useCallback } from 'react'
import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit'
import { useToast } from '../../components/Toast'

// --- Types ---
interface LendingAsset {
  coinType: string
  symbol: string
  amount: number
  decimals: number
  valueUsd?: number
}

interface LendingPosition {
  protocol: string
  objectId?: string
  deposits: LendingAsset[]
  borrows: LendingAsset[]
}

interface LPPosition {
  protocol: string
  objectId?: string
  poolId: string
  tokenA: { coinType: string; symbol: string; amount: number; decimals: number }
  tokenB: { coinType: string; symbol: string; amount: number; decimals: number }
  liquidity: string
  tickLower?: number
  tickUpper?: number
  valueUsd?: number
}

interface StakingPosition {
  protocol: string
  objectId?: string
  symbol: string
  amount: number
  decimals: number
  valueUsd?: number
}

interface Portfolio {
  lending: LendingPosition[]
  lp: LPPosition[]
  staking: StakingPosition[]
}

// --- Constants ---
const NAVI_PACKAGE = '0xd899cf7d2b5db716bd2cf55599fb0d5ee38a3061e7b013b9ca1571f3e3b0c44'
const SUILEND_PACKAGE = '0xf95b06141ed4a174f239417323bde3f209b972f5930d8521ea38a52aff3a6ddf'
const SCALLOP_PACKAGE = '0xefe8b36d5b2e43728cc323298626b83177803521d195cfb11e15b910e892fddf'
const CETUS_PACKAGE = '0x1eabed72c53feb467b37d9c2d1a2d8be8a3cc0e63db0b3f7ee8af0c2b5e9e3a0'
const CETUS_CLMM = '0x996c4d9480708fb8b92aa7acf819571f420e5c4e58c31e3ab1cddff15f252832'
const TURBOS_PACKAGE = '0x91bfbc386a41afcfd9b2533058d7e915a1d3829089cc268ff4333d54d6339ca1'

const LST_TOKENS: Record<string, { symbol: string; protocol: string }> = {
  '0xbde4ba4c2e274a60ce15c1cfff9e5c42e136785241d58ef4c4343ab52e063455::hasui::HASUI': { symbol: 'haSUI', protocol: 'Haedal' },
  '0xf325ce1300e8dac124071d3152c5c5ee6174914f8bc2161e88329cf579246efc::afsui::AFSUI': { symbol: 'afSUI', protocol: 'Aftermath' },
  '0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55::cert::CERT': { symbol: 'vSUI', protocol: 'Volo' },
  '0x83556891f4a0f233ce7b05cfe7f957d4020492a34f5405b2cb9377d060bef4bf::msui::MSUI': { symbol: 'mSUI', protocol: 'Momentum' },
}

// --- Helper Functions ---
function extractSymbol(coinType: string): string {
  if (!coinType) return 'Unknown'
  return coinType.split('::').pop() || 'Unknown'
}

function extractTypeParams(typeStr: string): string[] {
  const match = typeStr.match(/<(.+)>/)
  if (!match) return []
  const inner = match[1]
  const params: string[] = []
  let depth = 0
  let current = ''
  for (const char of inner) {
    if (char === '<') depth++
    if (char === '>') depth--
    if (char === ',' && depth === 0) {
      params.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  if (current.trim()) params.push(current.trim())
  return params
}

function formatAmount(amount: number, decimals: number): string {
  const value = amount / Math.pow(10, decimals)
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(2)}K`
  if (value >= 1) return value.toFixed(2)
  return value.toFixed(4)
}

function shortenId(id: string): string {
  if (!id || id.length < 10) return id
  return `${id.slice(0, 6)}...${id.slice(-4)}`
}

// --- Data Fetching ---
async function fetchPortfolio(client: any, address: string): Promise<Portfolio> {
  const lending: LendingPosition[] = []
  const lp: LPPosition[] = []
  const staking: StakingPosition[] = []

  // Scan all owned objects
  let cursor: string | null | undefined = null
  let hasNext = true

  while (hasNext) {
    const ownedObjects: any = await client.getOwnedObjects({
      owner: address,
      cursor: cursor ?? undefined,
      options: { showType: true, showContent: true },
      limit: 50,
    })

    for (const obj of ownedObjects.data) {
      if (!obj.data?.type) continue
      const typeStr = obj.data.type as string

      // NAVI Obligation
      if (typeStr.includes(NAVI_PACKAGE) && typeStr.includes('::lending::Obligation')) {
        const pos = parseLendingObligation(obj.data, 'NAVI Protocol')
        if (pos) lending.push(pos)
      }
      // Suilend Obligation
      else if (typeStr.includes(SUILEND_PACKAGE) && typeStr.includes('::obligation::Obligation')) {
        const pos = parseLendingObligation(obj.data, 'Suilend')
        if (pos) lending.push(pos)
      }
      // Scallop Obligation
      else if (typeStr.includes(SCALLOP_PACKAGE) && typeStr.includes('::obligation::Obligation')) {
        const pos = parseLendingObligation(obj.data, 'Scallop')
        if (pos) lending.push(pos)
      }
      // Cetus Position
      else if (
        (typeStr.includes(CETUS_PACKAGE) || typeStr.includes(CETUS_CLMM)) &&
        typeStr.includes('::position::Position')
      ) {
        const pos = parseLPPosition(obj.data, 'Cetus')
        if (pos) lp.push(pos)
      }
      // Turbos Position
      else if (typeStr.includes(TURBOS_PACKAGE) && typeStr.includes('::position_nft::')) {
        const pos = parseLPPosition(obj.data, 'Turbos Finance')
        if (pos) lp.push(pos)
      }
    }

    hasNext = ownedObjects.hasNextPage
    cursor = ownedObjects.nextCursor
  }

  // Fetch LST balances
  const allBalances = await client.getAllBalances({ owner: address })
  for (const balance of allBalances) {
    const lstKey = Object.keys(LST_TOKENS).find(
      (key) => balance.coinType.toLowerCase() === key.toLowerCase()
    )
    if (lstKey) {
      const amount = Number(balance.totalBalance)
      if (amount > 0) {
        staking.push({
          protocol: LST_TOKENS[lstKey].protocol,
          symbol: LST_TOKENS[lstKey].symbol,
          amount,
          decimals: 9,
        })
      }
    }
  }

  // Fetch native staking
  try {
    const stakes = await client.getStakes({ owner: address })
    for (const validatorStake of stakes) {
      for (const stake of validatorStake.stakes) {
        const amount = Number(stake.principal)
        if (amount > 0) {
          staking.push({
            protocol: 'Sui Native Staking',
            objectId: stake.stakedSuiId,
            symbol: 'SUI',
            amount,
            decimals: 9,
          })
        }
      }
    }
  } catch {
    // Native staking may not be available on all networks
  }

  return { lending, lp, staking }
}

function parseLendingObligation(objectData: any, protocol: string): LendingPosition | null {
  const content = objectData.content
  if (!content || content.dataType !== 'moveObject') return null
  const fields = content.fields as any
  if (!fields) return null

  const deposits: LendingAsset[] = []
  const borrows: LendingAsset[] = []

  // Parse deposits/collaterals
  const depositData = fields.deposits || fields.collaterals
  if (depositData) {
    const list = Array.isArray(depositData) ? depositData : depositData?.fields?.contents || []
    for (const item of list) {
      const f = item?.fields || item
      const coinType = f?.coin_type?.fields?.name || f?.type?.fields?.name || ''
      const amount = Number(f?.amount || f?.deposited_ctoken_amount || f?.value || 0)
      if (amount > 0 || coinType) {
        deposits.push({ coinType, symbol: extractSymbol(coinType), amount, decimals: 9 })
      }
    }
  }

  // Parse borrows/debts
  const borrowData = fields.borrows || fields.debts
  if (borrowData) {
    const list = Array.isArray(borrowData) ? borrowData : borrowData?.fields?.contents || []
    for (const item of list) {
      const f = item?.fields || item
      const coinType = f?.coin_type?.fields?.name || f?.type?.fields?.name || ''
      const amount = Number(f?.amount || f?.borrowed_amount || f?.value || 0)
      if (amount > 0 || coinType) {
        borrows.push({ coinType, symbol: extractSymbol(coinType), amount, decimals: 9 })
      }
    }
  }

  if (deposits.length === 0 && borrows.length === 0) return null

  return { protocol, objectId: objectData.objectId, deposits, borrows }
}

function parseLPPosition(objectData: any, protocol: string): LPPosition | null {
  const content = objectData.content
  if (!content || content.dataType !== 'moveObject') return null
  const fields = content.fields as any
  if (!fields) return null

  const typeParams = extractTypeParams(objectData.type)
  const liquidity = fields.liquidity?.toString() || '0'
  if (liquidity === '0') return null

  return {
    protocol,
    objectId: objectData.objectId,
    poolId: fields.pool || fields.pool_id || '',
    tokenA: {
      coinType: typeParams[0] || '',
      symbol: extractSymbol(typeParams[0] || ''),
      amount: Number(fields.coin_a || 0),
      decimals: 9,
    },
    tokenB: {
      coinType: typeParams[1] || '',
      symbol: extractSymbol(typeParams[1] || ''),
      amount: Number(fields.coin_b || 0),
      decimals: 9,
    },
    liquidity,
    tickLower: Number(fields.tick_lower_index?.fields?.bits ?? fields.tick_lower ?? 0),
    tickUpper: Number(fields.tick_upper_index?.fields?.bits ?? fields.tick_upper ?? 0),
  }
}

// --- Component ---
export default function Portfolio() {
  const account = useCurrentAccount()
  const client = useSuiClient()
  const toast = useToast()
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)

  const handleRefresh = useCallback(async () => {
    if (!account) return
    setIsLoading(true)
    try {
      const data = await fetchPortfolio(client, account.address)
      setPortfolio(data)
      setLastUpdated(Date.now())
      const total = data.lending.length + data.lp.length + data.staking.length
      if (total > 0) {
        toast.success('Portfolio Updated', `Found ${total} DeFi position(s)`)
      } else {
        toast.info('No Positions', 'No DeFi positions found in this wallet')
      }
    } catch (err: any) {
      toast.error('Scan Failed', err.message)
    } finally {
      setIsLoading(false)
    }
  }, [account, client, toast])

  if (!account) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-white mb-4">DeFi Portfolio</h1>
        <p className="text-gray-400">Connect your wallet to view DeFi positions</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">DeFi Portfolio</h1>
          <p className="text-sm text-gray-400 mt-1">
            Track positions across NAVI, Suilend, Scallop, Cetus, Turbos & staking
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="btn-primary disabled:opacity-50"
        >
          {isLoading ? 'Scanning...' : 'Scan Positions'}
        </button>
      </div>

      {lastUpdated && (
        <div className="text-xs text-gray-500">
          Last updated: {new Date(lastUpdated).toLocaleString()}
        </div>
      )}

      {/* Summary Cards */}
      {portfolio && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard
            title="Lending"
            count={portfolio.lending.length}
            subtitle="NAVI / Suilend / Scallop"
            color="blue"
          />
          <SummaryCard
            title="Liquidity Pools"
            count={portfolio.lp.length}
            subtitle="Cetus / Turbos"
            color="purple"
          />
          <SummaryCard
            title="Staking"
            count={portfolio.staking.length}
            subtitle="LST / Native Staking"
            color="green"
          />
        </div>
      )}

      {/* Lending Positions */}
      {portfolio && portfolio.lending.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Lending Positions</h2>
          <div className="space-y-4">
            {portfolio.lending.map((pos, i) => (
              <LendingCard key={i} position={pos} />
            ))}
          </div>
        </div>
      )}

      {/* LP Positions */}
      {portfolio && portfolio.lp.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">LP Positions</h2>
          <div className="space-y-4">
            {portfolio.lp.map((pos, i) => (
              <LPCard key={i} position={pos} />
            ))}
          </div>
        </div>
      )}

      {/* Staking Positions */}
      {portfolio && portfolio.staking.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Staking Positions</h2>
          <div className="space-y-3">
            {portfolio.staking.map((pos, i) => (
              <StakingCard key={i} position={pos} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {portfolio && portfolio.lending.length === 0 && portfolio.lp.length === 0 && portfolio.staking.length === 0 && (
        <div className="card text-center py-8">
          <p className="text-gray-400">No DeFi positions found in this wallet.</p>
          <p className="text-gray-500 text-sm mt-2">
            Positions from NAVI, Suilend, Scallop, Cetus, Turbos, and liquid staking will appear here.
          </p>
        </div>
      )}

      {/* Initial State */}
      {!portfolio && !isLoading && (
        <div className="card text-center py-12">
          <p className="text-gray-300 text-lg mb-2">Click "Scan Positions" to discover your DeFi portfolio</p>
          <p className="text-gray-500 text-sm">
            We'll scan your wallet for lending, LP, and staking positions across major Sui protocols.
          </p>
        </div>
      )}
    </div>
  )
}

// --- Sub Components ---

function SummaryCard({ title, count, subtitle, color }: {
  title: string
  count: number
  subtitle: string
  color: 'blue' | 'purple' | 'green'
}) {
  const colorClasses = {
    blue: 'border-blue-500/30 bg-blue-500/5',
    purple: 'border-purple-500/30 bg-purple-500/5',
    green: 'border-green-500/30 bg-green-500/5',
  }
  const countColors = {
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    green: 'text-green-400',
  }

  return (
    <div className={`rounded-lg border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        </div>
        <span className={`text-2xl font-bold ${countColors[color]}`}>{count}</span>
      </div>
    </div>
  )
}

function LendingCard({ position }: { position: LendingPosition }) {
  return (
    <div className="bg-slate-700/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-semibold text-white">{position.protocol}</span>
          {position.objectId && (
            <span className="text-xs text-gray-500 font-mono">{shortenId(position.objectId)}</span>
          )}
        </div>
      </div>

      {position.deposits.length > 0 && (
        <div className="mb-2">
          <p className="text-xs text-green-400 font-medium mb-1">Deposits</p>
          <div className="space-y-1">
            {position.deposits.map((dep, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-300">{dep.symbol}</span>
                <span className="text-white font-mono">{formatAmount(dep.amount, dep.decimals)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {position.borrows.length > 0 && (
        <div>
          <p className="text-xs text-red-400 font-medium mb-1">Borrows</p>
          <div className="space-y-1">
            {position.borrows.map((bor, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-300">{bor.symbol}</span>
                <span className="text-red-300 font-mono">{formatAmount(bor.amount, bor.decimals)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function LPCard({ position }: { position: LPPosition }) {
  return (
    <div className="bg-slate-700/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-semibold text-white">{position.protocol}</span>
          <span className="text-sm text-purple-400">
            {position.tokenA.symbol}/{position.tokenB.symbol}
          </span>
        </div>
        {position.objectId && (
          <span className="text-xs text-gray-500 font-mono">{shortenId(position.objectId)}</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-gray-400">Liquidity</p>
          <p className="text-white font-mono">{Number(position.liquidity).toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Tick Range</p>
          <p className="text-white font-mono text-xs">
            [{position.tickLower}, {position.tickUpper}]
          </p>
        </div>
        {(position.tokenA.amount > 0 || position.tokenB.amount > 0) && (
          <>
            <div>
              <p className="text-xs text-gray-400">{position.tokenA.symbol}</p>
              <p className="text-white font-mono">
                {formatAmount(position.tokenA.amount, position.tokenA.decimals)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">{position.tokenB.symbol}</p>
              <p className="text-white font-mono">
                {formatAmount(position.tokenB.amount, position.tokenB.decimals)}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function StakingCard({ position }: { position: StakingPosition }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0">
      <div className="flex items-center space-x-3">
        <div>
          <span className="text-sm text-white font-medium">{position.symbol}</span>
          <span className="text-xs text-gray-500 ml-2">{position.protocol}</span>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm text-white font-mono">{formatAmount(position.amount, position.decimals)}</p>
        {position.objectId && (
          <p className="text-xs text-gray-500 font-mono">{shortenId(position.objectId)}</p>
        )}
      </div>
    </div>
  )
}
