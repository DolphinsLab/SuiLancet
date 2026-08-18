import { fromBase64 } from "@mysten/bcs"
import type { SuiClientTypes } from "@mysten/sui/client"
import { SuiGrpcClient } from "@mysten/sui/grpc"
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519"
import { config } from "dotenv"
import { CoinObject, NetworkEnv } from "./types"
import { completionCoin } from "../common/coin"
import {
  Transaction,
  TransactionObjectArgument,
} from "@mysten/sui/transactions"

config()

/**
 * Create the only Sui transport used by SuiLancet.
 *
 * @see https://sdk.mystenlabs.com/sui/clients/grpc
 */
export function createSuiGrpcClient(
  network: NetworkEnv,
  baseUrl: string
): SuiGrpcClient {
  return new SuiGrpcClient({ network, baseUrl })
}

export class SuiScriptClient {
  public endpoint: string
  public client: SuiGrpcClient
  public walletAddress: string
  private keypair: Ed25519Keypair

  constructor(env: NetworkEnv) {
    this.endpoint =
      env === "testnet"
        ? process.env.SUI_GRPC_ENDPOINT_TESTNET!
        : env === "pre-mainnet"
        ? process.env.SUI_GRPC_ENDPOINT_PRE_MAINNET!
        : process.env.SUI_GRPC_ENDPOINT_MAINNET!

    if (!this.endpoint) {
      const envName = env.toUpperCase().replace("-", "_")
      throw new Error(`Missing SUI_GRPC_ENDPOINT_${envName}`)
    }

    this.client = createSuiGrpcClient(env, this.endpoint)
    this.keypair = this.buildAccount()
    this.walletAddress = this.keypair.getPublicKey().toSuiAddress()
    console.log(
      "Activate wallet address:",
      this.walletAddress,
      "\nActivate gRPC:",
      this.endpoint
    )
  }

  buildAccount() {
    if (process.env.SUI_WALLET_SECRET) {
      const secret = process.env.SUI_WALLET_SECRET
      const keypair = Ed25519Keypair.fromSecretKey(
        fromBase64(secret).slice(1, 33)
      )
      return keypair
    }

    if (process.env.SUI_WALLET_PHRASE) {
      const phrase = process.env.SUI_WALLET_PHRASE
      const keypair = Ed25519Keypair.deriveKeypair(phrase)
      return keypair
    }

    throw new Error("No wallet secret or phrase found")
  }

  async getAllCoins(): Promise<CoinObject[]> {
    let cursor: string | null = null
    const limit = 50
    const allCoins: CoinObject[] = []

    while (true) {
      const page: SuiClientTypes.ListOwnedObjectsResponse<{ json: true }> =
        await this.client.core.listOwnedObjects({
          owner: this.walletAddress,
          cursor,
          limit,
          include: { json: true },
        })

      for (const coin of page.objects) {
        const rawCoinType = extractCoinType(coin.type)
        if (!rawCoinType) continue
        const coinType = completionCoin(rawCoinType)
        allCoins.push({
          coinType,
          objectId: coin.objectId,
          balance: extractCoinBalance(coin.json),
        })
      }

      if (!page.hasNextPage) {
        break
      }

      if (!page.cursor) {
        throw new Error("gRPC coin pagination returned no cursor")
      }
      cursor = page.cursor
    }

    return allCoins
  }

  async getCoinsByType(coinType: string): Promise<CoinObject[]> {
    const coins = await this.getAllCoins()
    const normalizedCoinType = completionCoin(coinType)
    return coins.filter((coin) => coin.coinType === normalizedCoinType)
  }

  async getCoinsByTypeV2(coinType: string): Promise<CoinObject[]> {
    let cursor: string | null = null
    const limit = 50
    const allCoins: CoinObject[] = []

    while (true) {
      const page = await this.client.core.listCoins({
        owner: this.walletAddress,
        coinType,
        cursor,
        limit,
      })

      const coinObjects = page.objects.map((coin) => ({
        coinType,
        objectId: coin.objectId,
        balance: Number(coin.balance),
      }))
      allCoins.push(...coinObjects)

      if (!page.hasNextPage) {
        break
      }

      cursor = page.cursor
    }

    return allCoins
  }

  async buildInputCoin(
    coins: CoinObject[],
    amount: bigint,
    txb: Transaction
  ): Promise<TransactionObjectArgument> {
    if (coins.length === 0) {
      throw new Error("No coins provided")
    }

    // Sort by balance descending
    const sortedCoins = [...coins].sort(
      (a, b) => Number(b.balance) - Number(a.balance)
    )

    let selectedCoins: CoinObject[] = []
    let totalAmount = 0n

    // Select enough coins
    for (const coin of sortedCoins) {
      selectedCoins.push(coin)
      totalAmount += BigInt(coin.balance)
      if (totalAmount >= amount) {
        break
      }
    }

    if (totalAmount < amount) {
      throw new Error("Insufficient balance")
    }

    let mergedCoin: TransactionObjectArgument
    if (selectedCoins.length === 1) {
      mergedCoin = txb.object(selectedCoins[0].objectId)
    } else {
      mergedCoin = txb.mergeCoins(
        txb.object(selectedCoins[0].objectId),
        selectedCoins.slice(1).map((coin) => txb.object(coin.objectId))
      )
    }

    const splitCoin = txb.splitCoins(mergedCoin, [
      amount,
    ]) as TransactionObjectArgument

    return splitCoin
  }

  async signAndExecuteTransaction(txb: Transaction) {
    const result = await this.client.core.signAndExecuteTransaction({
      transaction: txb,
      signer: this.keypair,
      include: {
        effects: true,
        events: true,
        transaction: true,
        balanceChanges: true,
      },
    })

    if (result.FailedTransaction) {
      throw new Error(
        result.FailedTransaction.status.error?.message ??
          "Transaction execution failed"
      )
    }

    return result.Transaction
  }

  async devInspectTransactionBlock(txb: Transaction) {
    txb.setSenderIfNotSet(this.walletAddress)

    const result = await this.client.core.simulateTransaction({
      transaction: txb,
      checksEnabled: false,
      include: {
        effects: true,
        events: true,
        balanceChanges: true,
        commandResults: true,
      },
    })

    const transaction = result.Transaction ?? result.FailedTransaction
    return { ...transaction, commandResults: result.commandResults }
  }

  async sendTransaction(txb: Transaction) {
    const devInspectRes = await this.devInspectTransactionBlock(txb)
    if (!devInspectRes.effects.status.success) {
      console.log("transaction failed")
      console.log(devInspectRes)
      return
    }

    const txRes = await this.signAndExecuteTransaction(txb)
    console.log(txRes)
    return txRes
  }
}

function extractCoinType(objectType: string): string | null {
  const match = objectType.match(/::coin::Coin<(.+)>$/)
  return match?.[1] ?? null
}

function extractCoinBalance(json: Record<string, unknown> | null): number {
  const balance = json?.balance
  if (typeof balance !== "string" && typeof balance !== "number") {
    throw new Error("gRPC coin response is missing its balance")
  }
  return Number(balance)
}

export async function printTransaction(tx: Transaction, isPrint = true) {
  console.log(`inputs`, tx.getData().inputs)
  let i = 0

  tx.getData().commands.forEach((item, index) => {
    if (isPrint) {
      console.log(`transaction ${index}: `, JSON.stringify(item, null, 2))
      i++
    }
  })
}
