import { fromBase64 } from "@mysten/bcs"
import { SuiClient } from "@mysten/sui/client"
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519"
import { config } from "dotenv"
import { CoinObject } from "./types"
import { completionCoin } from "../common"
import {
  Transaction,
  TransactionObjectArgument,
} from "@mysten/sui/transactions"

config()

export class SuiScriptClient {
  public endpoint: string
  public client: SuiClient
  public walletAddress: string
  private keypair: Ed25519Keypair

  constructor(env: "testnet" | "pre-mainnet" | "mainnet") {
    this.endpoint =
      env === "testnet"
        ? process.env.SUI_ENDPOINT_TESTNET!
        : env === "pre-mainnet"
        ? process.env.SUI_ENDPOINT_PRE_MAINNET!
        : process.env.SUI_ENDPOINT_MAINNET!

    if (!this.endpoint) {
      throw new Error(`Missing SUI_ENDPOINT_${env.toUpperCase()}`)
    }

    this.client = new SuiClient({ url: this.endpoint })
    this.keypair = this.buildAccount()
    this.walletAddress = this.keypair.getPublicKey().toSuiAddress()
    console.log(
      "Activate wallet address:",
      this.walletAddress,
      "\nActivate rpc:",
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
    let cursor = null
    let limit = 50
    const allCoins: CoinObject[] = []
    while (true) {
      const gotAllCoins = await this.client.getAllCoins({
        owner: this.walletAddress,
        cursor,
        limit,
      })
      for (const coin of gotAllCoins.data) {
        const coinType = completionCoin(coin.coinType)
        allCoins.push({
          coinType: coinType,
          objectId: coin.coinObjectId,
          balance: Number(coin.balance),
        })
      }
      if (!gotAllCoins.hasNextPage) {
        break
      }
      cursor = gotAllCoins.nextCursor
    }
    return allCoins
  }

  async getCoinsByType(coinType: string): Promise<CoinObject[]> {
    const coins = await this.getAllCoins()
    return coins.filter((coin) => coin.coinType === coinType)
  }

  async getCoinsByTypeV2(coinType: string): Promise<CoinObject[]> {
    let cursor = null
    let limit = 50
    const allCoins: CoinObject[] = []
    while (true) {
      const coins = await this.client.getCoins({
        owner: this.walletAddress,
        coinType,
        cursor,
        limit,
      })
      const coinObjects = coins.data.map((coin) => ({
        coinType: coin.coinType,
        objectId: coin.coinObjectId,
        balance: Number(coin.balance),
      }))
      allCoins.push(...coinObjects)
      if (!coins.hasNextPage) {
        break
      }
      cursor = coins.nextCursor
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
    const res = await this.client.signAndExecuteTransaction({
      transaction: txb,
      signer: this.keypair,
      options: {
        showEffects: true,
        showEvents: true,
        showInput: true,
        showBalanceChanges: true,
      },
    })
    return res
  }

  async devInspectTransactionBlock(txb: Transaction) {
    const res = await this.client.devInspectTransactionBlock({
      transactionBlock: txb,
      sender: this.walletAddress,
    })

    return res
  }

  async sendTransaction(txb: Transaction) {
    const devInspectRes = await this.devInspectTransactionBlock(txb)
    if (devInspectRes.effects.status.status !== "success") {
      console.log("transaction failed")
      console.log(devInspectRes)
      return
    }

    const txRes = await this.signAndExecuteTransaction(txb)
    console.log(txRes)
    return txRes
  }
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
