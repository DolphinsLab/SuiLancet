# CLI 命令清单

> CLI 版本：2.0.0
> 入口：`sui-lancet [global options] <domain> <command>`

## 1. 全局参数

| 参数 | 必填 | 默认值 | 说明 |
|---|:---:|---|---|
| `-e, --env <env>` | 否 | `mainnet` | `testnet`、`pre-mainnet`、`mainnet` |
| `-d, --debug` | 否 | false | Commander 已注册该选项，但当前业务代码未读取它 |
| `-V, --version` | 否 | — | 输出 2.0.0 |

启动任一业务命令时会读取当前网络 gRPC 地址，并从 `SUI_WALLET_SECRET` 或 `SUI_WALLET_PHRASE` 构造 Ed25519 钱包。缺少配置时命令直接退出。

## 2. Clean

### `clean destroy-zero`

批量销毁钱包中的零余额 Coin，每批最多 500 个；每批先模拟，模拟失败则跳过。

| 参数 | 必填 | 说明 |
|---|:---:|---|
| `-g, --gas-budget <amount>` | 否 | 自定义 Gas Budget |
| `--gas-object <id>` | 否 | 指定 Gas Coin Object |
| `--dry-run` | 否 | 仅返回待销毁清单，不提交交易 |

### `clean merge`

合并同类型 Coin，最多选择前 1,200 个。当前实现按 50 个分段构造同一笔交易。

| 参数 | 必填 | 说明 |
|---|:---:|---|
| `-t, --coin-type <type>` | 是 | 完整 Coin Type |
| `--gas-object <id>` | 否 | 指定 Gas Coin Object |
| `--dry-run` | 否 | 仅显示预计合并数量 |

### `clean dust`

按美元阈值扫描低价值 Coin；价格来自 DexScreener，Token decimals 来自链上 Coin Metadata。

| 参数 | 必填 | 默认值 | 说明 |
|---|:---:|---|---|
| `--threshold <usd>` | 否 | `0.01` | 低于该美元价值判定为粉尘 |
| `--include-unknown` | 否 | false | 仅把无价格且余额为 0 的 Coin 纳入处理 |
| `-g, --gas-budget <amount>` | 否 | — | 自定义 Gas Budget |
| `--gas-object <id>` | 否 | — | 指定 Gas Coin Object |
| `--dry-run` | 否 | false | 预览粉尘清单 |

安全边界：零余额 Coin 会销毁；非零粉尘当前仅转回本钱包，并不会真正销毁。

### `clean airdrop-scan`

扫描可疑 Coin Type、缺失 Metadata、异常大余额和非标准 Package ID，并输出高/中风险项。

### `clean airdrop-destroy`

先执行空投扫描，再安全销毁满足风险阈值的零余额 Coin；非零余额项始终跳过。

| 参数 | 必填 | 默认值 | 说明 |
|---|:---:|---|---|
| `--risk <level>` | 否 | `high` | 支持 `high`、`medium`；代码类型也接受 `low` |
| `--gas-object <id>` | 否 | — | 指定 Gas Coin Object |
| `--dry-run` | 否 | false | 预览将被销毁的零余额可疑 Coin |

## 3. Manage

### 转移命令

| 命令 | 必填参数 | 可选参数 | 行为 |
|---|---|---|---|
| `manage transfer` | `--coin-id`、`--recipient` | `--gas-object` | 按 Object ID 转移一个 Coin |
| `manage transfer-by-type` | `--coin-type`、`--recipient`、`--amount` | `--gas-object` | 聚合足额 Coin，拆出指定最小单位数量后转移 |
| `manage transfer-all-sui` | `--recipient` | `--gas-object` | 把 `tx.gas` 全部转给目标地址 |
| `manage batch-transfer` | `--recipient`、`--coin-type`、`--amount` | `--gas-object` | `amount` 表示转移前 N 个 Coin Object，不是 Token 数量 |
| `manage transfer-objects` | `--objects`、`--recipient` | `--gas-object` | 转移逗号分隔的多个 Object ID |

这些转移命令当前没有 `--dry-run`。

### 拆分命令

| 命令 | 必填参数 | 可选参数 | 行为 |
|---|---|---|---|
| `manage split-sui` | `--amounts <a,b,...>` | `--gas-object` | 从 Gas Coin 拆出多枚 SUI 并转回自己 |
| `manage split-coin` | `--coin-id`、`--amounts <a,b,...>` | `--gas-object` | 从指定 Coin 拆分并转回自己 |

金额均为链上最小单位；当前没有正数、上限或总余额的 CLI 层校验，也没有 `--dry-run`。

### Vault 命令

| 命令 | 必填参数 | 可选参数 | 行为 |
|---|---|---|---|
| `manage vault-deposit` | `--coin-id`、`--coin-type`、`--amount` | `--gas-object` | 调用固定 Vault 合约存入 Coin |
| `manage vault-withdraw` | `--coin-type`、`--amount`、`--recipient` | `--gas-object` | 通过固定 AdminCap/Vault 调用提取并转给目标地址 |
| `manage vault-first-aid` | `--coins <id,...>` | `--gas-object` | 对每个 Coin 调用固定合约的 `first_aid_packet` |

Vault 地址与 AdminCap 写死在 SDK 中，属于特定部署能力，不是通用 Vault 配置器。

### 钱包迁移

`manage migrate --recipient <address>` 扫描并分批迁移 Coin 与其他 Owned Object，SUI 最后转移。

| 参数 | 必填 | 默认值 | 说明 |
|---|:---:|---|---|
| `-r, --recipient <address>` | 是 | — | 目标地址 |
| `--type <type>` | 否 | `all` | `coin`、`object`、`all` |
| `--batch-size <size>` | 否 | `50` | 每批 Object 数 |
| `--exclude <types>` | 否 | — | 逗号分隔的 Coin Type 排除列表 |
| `--gas-object <id>` | 否 | — | 指定 Gas Coin Object |
| `--dry-run` | 否 | false | 生成迁移计划，不执行 |

预览会给出资产数量、批次数和粗略 Gas 估算（每批 5,000,000 MIST）。执行结果包含成功批次、失败数量和部分失败 Object ID。

### Kiosk 命令

| 命令 | 必填参数 | 可选参数 | 行为 |
|---|---|---|---|
| `manage kiosk-list` | — | — | 通过 KioskOwnerCap 列出 Kiosk、物品数和收益 |
| `manage kiosk-show` | `--kiosk-id` | — | 列出 Kiosk Dynamic Fields 中识别出的 Item |
| `manage kiosk-take` | `--kiosk-id`、`--cap-id`、`--item-id`、`--item-type` | `--gas-object` | 取出未上架物品并转回当前钱包 |
| `manage kiosk-withdraw` | `--kiosk-id`、`--cap-id` | `--gas-object` | 提取全部可用 SUI 收益并转回当前钱包 |

`kiosk-show` 当前把所有返回项的 `isListed` 标记为 false，并未真正检查 Listing Dynamic Field。

## 4. Secure

| 命令 | 必填参数 | 行为 |
|---|---|---|
| `secure simulate` | `--tx <base64>` | 模拟交易，输出状态、Gas、余额变化、Object 变化 |
| `secure scan` | — | 扫描钱包高权限对象、垃圾 Token、零余额 Coin、第三方 Object |
| `secure gas-info` | — | 输出参考 Gas Price、Checkpoint 和三档预算建议 |
| `secure gas-estimate` | `--tx <base64>` | 模拟指定交易并给出净成本 +20% 的建议预算 |

## 5. Query

| 命令 | 参数 | 默认值 | 行为 |
|---|---|---|---|
| `query wallet-info` | — | — | 显示当前钱包地址和 gRPC 地址 |
| `query balance` | `--coin-type`（可选） | 全部类型 | 汇总余额与 Coin Object 数 |
| `query find-coins` | `--min`、`--max`、`--coin-type` | — | 返回余额处于闭区间内的 Coin Object ID |
| `query history` | `--limit` 或 `--tx` | 最近 20 笔 | 查询发送交易历史，或解析指定交易 |
| `query object <objectId>` | `--dynamic-fields`、`--limit` | 动态字段 20 条 | 查看 Object 或其 Dynamic Fields |

交易历史只按 sender 查询，不包含仅作为接收方的交易。

## 6. DeFi

| 命令 | 参数 | 行为 |
|---|---|---|
| `defi positions` | `--no-price`、`--category <lending\|lp\|staking>` | 扫描全部或指定分类并输出统一组合摘要 |
| `defi lending` | — | 扫描 NAVI、Suilend、Scallop |
| `defi lp` | — | 扫描 Cetus、Turbos |
| `defi staking` | — | 扫描 haSUI、afSUI、vSUI、mSUI 与原生质押 |

USD 价格通过 DexScreener 获取，最多为一次结果中的前 20 个唯一 Coin Type 请求价格。协议请求失败会被忽略，可能返回部分结果而不报整体失败。
