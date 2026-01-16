# CLI Guide

Complete reference for the SuiLancet command-line interface.

---

## Overview

The CLI provides full access to SuiLancet features from the terminal.

```bash
npm run cli -- [options] [command]
```

---

## Global Options

| Option | Description | Default |
|--------|-------------|---------|
| `-e, --env <env>` | Network environment | `mainnet` |
| `-d, --debug` | Enable debug output | `false` |
| `-V, --version` | Show version | - |
| `-h, --help` | Show help | - |

### Environment Values

| Value | Network |
|-------|---------|
| `testnet` | Sui Testnet |
| `pre-mainnet` | Pre-mainnet staging |
| `mainnet` | Sui Mainnet |

**Example:**
```bash
npm run cli -- -e testnet query wallet-info
```

---

## Commands

### Coin Commands

Manage coins in your wallet.

#### `coin destroy-zero`

Batch destroy zero-balance coins.

```bash
npm run cli -- coin destroy-zero [options]
```

| Option | Description |
|--------|-------------|
| `-g, --gas-budget <amount>` | Gas budget limit |
| `--gas-object <id>` | Specific gas object ID |

**Example:**
```bash
npm run cli -- coin destroy-zero -g 50000000
```

---

#### `coin split-sui`

Split SUI into multiple coins.

```bash
npm run cli -- coin split-sui -a <amounts>
```

| Option | Description | Required |
|--------|-------------|----------|
| `-a, --amounts <amounts>` | Comma-separated amounts | Yes |

**Example:**
```bash
# Split into 3 coins of 1 SUI each
npm run cli -- coin split-sui -a 1000000000,1000000000,1000000000
```

---

#### `coin split-coin`

Split a specific coin into multiple coins.

```bash
npm run cli -- coin split-coin -i <coinId> -a <amounts>
```

| Option | Description | Required |
|--------|-------------|----------|
| `-i, --coin-id <id>` | Coin object ID | Yes |
| `-a, --amounts <amounts>` | Comma-separated amounts | Yes |

**Example:**
```bash
npm run cli -- coin split-coin \
  -i 0x123...abc \
  -a 500000000,500000000
```

---

#### `coin merge`

Merge all coins of a type into one.

```bash
npm run cli -- coin merge -t <coinType>
```

| Option | Description | Required |
|--------|-------------|----------|
| `-t, --coin-type <type>` | Full coin type | Yes |

**Example:**
```bash
npm run cli -- coin merge -t "0x2::sui::SUI"
```

> **Note:** Supports up to 2048 coins per transaction. For larger sets, run multiple times.

---

#### `coin transfer`

Transfer a specific coin by object ID.

```bash
npm run cli -- coin transfer -i <coinId> -r <recipient>
```

| Option | Description | Required |
|--------|-------------|----------|
| `-i, --coin-id <id>` | Coin object ID | Yes |
| `-r, --recipient <address>` | Recipient address | Yes |

---

#### `coin transfer-by-type`

Transfer coins by type and amount.

```bash
npm run cli -- coin transfer-by-type -t <type> -r <recipient> -a <amount>
```

| Option | Description | Required |
|--------|-------------|----------|
| `-t, --coin-type <type>` | Coin type | Yes |
| `-r, --recipient <address>` | Recipient address | Yes |
| `-a, --amount <amount>` | Amount to transfer | Yes |

---

#### `coin transfer-all-sui`

Transfer all SUI to an address.

```bash
npm run cli -- coin transfer-all-sui -r <recipient>
```

| Option | Description | Required |
|--------|-------------|----------|
| `-r, --recipient <address>` | Recipient address | Yes |

---

#### `coin batch-transfer`

Batch transfer coins of a type.

```bash
npm run cli -- coin batch-transfer -r <recipient> -t <type> -a <amount>
```

---

#### `coin get-special-amount`

Find coins within a balance range.

```bash
npm run cli -- coin get-special-amount --min <amount> --max <amount> -t <type>
```

| Option | Description | Required |
|--------|-------------|----------|
| `--min <amount>` | Minimum balance | Yes |
| `--max <amount>` | Maximum balance | Yes |
| `-t, --coin-type <type>` | Coin type | Yes |

---

### Vault Commands

Manage vault operations.

#### `vault withdraw`

Withdraw coins from vault.

```bash
npm run cli -- vault withdraw -t <coinType> -a <amount>
```

| Option | Description | Required |
|--------|-------------|----------|
| `-t, --coin-type <type>` | Coin type | Yes |
| `-a, --amount <amount>` | Amount to withdraw | Yes |

---

#### `vault first-aid`

First aid packet operation (batch vault processing).

```bash
npm run cli -- vault first-aid -c <coins> [--gas-object <id>]
```

| Option | Description | Required |
|--------|-------------|----------|
| `-c, --coins <coins>` | Comma-separated coin IDs | Yes |
| `--gas-object <id>` | Gas object ID | No |

---

### Object Commands

Manage Sui objects.

#### `object transfer`

Transfer multiple objects.

```bash
npm run cli -- object transfer -o <objects> -r <recipient>
```

| Option | Description | Required |
|--------|-------------|----------|
| `-o, --objects <objects>` | Comma-separated object IDs | Yes |
| `-r, --recipient <address>` | Recipient address | Yes |

---

### Query Commands

Query blockchain data.

#### `query wallet-info`

Display wallet information.

```bash
npm run cli -- query wallet-info
```

**Output:**
```
Wallet address: 0x1234...abcd
RPC endpoint: https://fullnode.mainnet.sui.io:443
```

---

#### `query balance`

Query coin balances.

```bash
npm run cli -- query balance [-t <coinType>]
```

| Option | Description | Required |
|--------|-------------|----------|
| `-t, --coin-type <type>` | Specific coin type | No |

**Examples:**

```bash
# All balances
npm run cli -- query balance

# Specific token
npm run cli -- query balance -t "0x2::sui::SUI"
```

---

## Usage Examples

### Complete Workflow: Clean Up Wallet

```bash
# 1. Check current state
npm run cli -- query balance

# 2. Destroy zero-balance coins
npm run cli -- coin destroy-zero

# 3. Merge remaining coins
npm run cli -- coin merge -t "0x2::sui::SUI"

# 4. Verify cleanup
npm run cli -- query balance
```

### Transfer All Assets

```bash
# Transfer all SUI to new wallet
npm run cli -- coin transfer-all-sui -r 0xNEW_WALLET_ADDRESS
```

### Working with Testnet

```bash
# All commands with testnet
npm run cli -- -e testnet query wallet-info
npm run cli -- -e testnet query balance
npm run cli -- -e testnet coin merge -t "0x2::sui::SUI"
```

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Missing SUI_ENDPOINT_*` | Missing env var | Add to `.env` |
| `No wallet secret or phrase found` | Missing wallet config | Add `SUI_WALLET_SECRET` or `SUI_WALLET_PHRASE` |
| `Insufficient balance` | Not enough funds | Check balance first |
| `Transaction failed` | Simulation failure | Check error details |

### Debug Mode

Enable debug output for troubleshooting:

```bash
npm run cli -- -d coin merge -t "0x2::sui::SUI"
```

---

*See also: [[SDK Reference]] for programmatic usage*
