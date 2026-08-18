# gRPC Migration Checklist

- [ ] Create/confirm the migration Issue and issue-associated branch. Blocked:
      the GitHub connector lacks Issue write permission.
- [x] Add red migration guard tests for deprecated JSON-RPC usage.
- [x] Upgrade root `@mysten/sui` to 2.x and align module configuration.
- [x] Convert `SuiScriptClient` to `SuiGrpcClient` and Core API.
- [x] Migrate root object, balance, coin, metadata, and dynamic-field reads.
- [x] Migrate root simulation, execution, transaction history, and gas reads.
- [x] Migrate cleanup, security, management, and DeFi feature paths.
- [x] Replace legacy Web dApp Kit with `@mysten/dapp-kit-react`.
- [x] Migrate Web read-only flows to the gRPC/Core API.
- [x] Migrate Web signing, execution, and simulation flows.
- [x] Update endpoint configuration, README, SDK docs, and deployment docs.
- [x] Pass root tests, typecheck, build, audit, and migration guards.
- [x] Pass Web lint, typecheck, production build, and route/browser smoke tests.
- [x] Verify live testnet/mainnet gRPC reads and static absence of JSON-RPC.
- [ ] Verify a connected-wallet simulation and browser network trace in the
      release environment.
- [ ] Commit, push, create PR, pass CI/review, and merge to `main`.
- [ ] Verify Cloudflare production deployment, critical flows, and rollback.
