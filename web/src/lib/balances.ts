import type { ClientWithCoreApi, SuiClientTypes } from '@mysten/sui/client'

export async function listAllBalances(
  client: ClientWithCoreApi,
  owner: string,
): Promise<SuiClientTypes.Balance[]> {
  const balances: SuiClientTypes.Balance[] = []
  let cursor: string | null = null

  while (true) {
    const page = await client.core.listBalances({
      owner,
      cursor,
      limit: 50,
    })
    balances.push(...page.balances)

    if (!page.hasNextPage) return balances
    if (!page.cursor) {
      throw new Error('gRPC balance pagination returned no cursor')
    }
    cursor = page.cursor
  }
}
