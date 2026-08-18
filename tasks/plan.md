# Implementation Plan: Complete Sui gRPC Migration

## Overview

Migrate every Sui network access path in the SDK, CLI, and Web application from
the deprecated JSON-RPC stack to `SuiGrpcClient` and the Sui TypeScript SDK 2.x
Core API. Preserve existing wallet, query, simulation, transaction, portfolio,
cleanup, management, and security behavior. Prove that no JSON-RPC client or
legacy JSON-RPC-only dApp Kit remains, then release through the existing
GitHub/Cloudflare production workflow with a documented rollback.

The GitHub issue for this migration still needs to be created because the
configured GitHub connector cannot write Issues and the local `gh` login is
expired. No new branch or commit may be created until that issue number exists.

## Architecture Decisions

- Use `SuiGrpcClient` with the default gRPC-web Fetch transport in both Node and
  browsers. This keeps one transport implementation across SDK/CLI and Web and
  follows the official SDK guidance.
- Use the SDK 2.x Core API (`client.core.*`) for all high-level reads,
  simulations, signing, execution, and transaction lookups.
- Use raw gRPC service clients only when Core API does not expose the required
  value, such as ledger service information.
- Replace the legacy `@mysten/dapp-kit` package with
  `@mysten/dapp-kit-react`; the legacy package is JSON-RPC-only.
- Keep the current public `SuiScriptClient` surface where practical, but change
  its internal client type and response adapters to gRPC/Core API shapes.
- Preserve feature behavior without adding GraphQL or JSON-RPC fallbacks.
  Native stake discovery will use owned `StakedSui` objects over gRPC.
- Treat any import from `@mysten/sui/jsonRpc`, `@mysten/sui/client` runtime
  `SuiClient`, legacy `@mysten/dapp-kit`, or old JSON-RPC method name as a
  release-blocking failure.

## Official Sources

- https://sdk.mystenlabs.com/sui/migrations/sui-2.0/json-rpc-migration
- https://sdk.mystenlabs.com/sui/clients/grpc
- https://sdk.mystenlabs.com/sui/clients/core
- https://sdk.mystenlabs.com/sui/migrations/sui-2.0/dapp-kit
- https://sdk.mystenlabs.com/sui/migrations/sui-2.0/sui

## Task List

### Phase 1: Contract and Foundation

- [x] Task 1: Add failing migration guard tests
  - Assert dependency manifests contain SDK 2.x/new dApp Kit.
  - Assert source has no legacy client/package imports or JSON-RPC method calls.
  - Verify the tests fail against the current code.
- [x] Task 2: Upgrade root SDK dependencies and module output
  - Upgrade `@mysten/sui` to the current 2.x release.
  - Align TypeScript/module output with the SDK's ESM requirements.
  - Regenerate and audit the root lockfile.
- [x] Task 3: Introduce the gRPC client contract
  - Construct `SuiGrpcClient` with explicit network and base URL.
  - Move coin listing, simulation, signing, and execution to Core API.
  - Normalize Core API responses at the `SuiScriptClient` boundary.

### Checkpoint: Root Client

- [x] Migration guard tests pass for the root client.
- [x] Focused client tests pass.
- [x] Root typecheck and build pass.

### Phase 2: SDK and CLI Feature Paths

- [x] Task 4: Migrate object, coin metadata, and dynamic-field reads
  - Update common object/price helpers.
  - Update object inspector and kiosk manager.
  - Verify pagination and missing-object error behavior.
- [x] Task 5: Migrate transaction and gas feature paths
  - Replace transaction history and digest lookup with Core API.
  - Replace reference gas/checkpoint lookups with Core/gRPC services.
  - Adapt simulation and execution status/gas response shapes.
- [x] Task 6: Migrate cleanup, security, and wallet-management paths
  - Replace all direct owned-object, coin, metadata, and simulation calls.
  - Preserve batch pagination and dry-run behavior.
  - Verify transaction failure status is never treated as success.
- [x] Task 7: Migrate DeFi portfolio adapters
  - Accept `ClientWithCoreApi`/gRPC-compatible client types.
  - Move balances and owned objects to Core API.
  - Discover native `StakedSui` positions through gRPC-owned objects.

### Checkpoint: SDK/CLI Complete

- [x] Root tests, typecheck, and build pass.
- [x] CLI smoke commands construct a gRPC client.
- [x] Static scan finds no deprecated JSON-RPC runtime usage under `src/`.

### Phase 3: Web Application

- [x] Task 8: Replace the Web provider and wallet integration
  - Replace legacy dApp Kit packages and provider setup.
  - Create one `SuiGrpcClient` per supported network.
  - Migrate wallet/account/network hooks and Dolphin ID integration.
- [x] Task 9: Migrate Web read-only flows
  - Move dashboard balances, object/transaction query, portfolio, and coin
    pagination to `useCurrentClient()` plus Core API.
  - Adapt UI mapping to Core API response shapes.
  - Add focused tests for response adapters.
- [x] Task 10: Migrate Web transaction flows
  - Replace legacy mutation hooks with `useDAppKit()` actions.
  - Move dry-run to `core.simulateTransaction`.
  - Preserve progress, success, and error handling for batch operations.

### Checkpoint: Web Complete

- [x] Web lint, typecheck, and production build pass.
- [ ] Browser smoke test covers wallet UI, network selection, reads, and
  simulation without console errors.
- [ ] Network inspection shows gRPC-web requests and no Sui JSON-RPC requests.

### Phase 4: Release

- [x] Task 11: Update configuration and documentation
  - Rename endpoint labels/examples from RPC to gRPC where they describe the
    Sui transport.
  - Document Node/browser transports, environment variables, and limitations.
  - Add a production rollout and rollback checklist.
- [x] Task 12: Complete release gates
  - Run unit, integration, typecheck, lint, build, audit, and static migration
    guards.
  - Test live testnet/mainnet read-only gRPC calls.
  - Record bundle-size and dependency-audit results.
- [ ] Task 13: Publish and deploy
  - Create the issue-associated branch, atomic commits, and PR.
  - Push and wait for CI/review.
  - Merge to `main` to trigger Cloudflare Pages production deployment.
  - Verify production routes, gRPC traffic, console, critical reads, and
    rollback readiness.

### Checkpoint: Complete

- [ ] All acceptance criteria are proven by current-state evidence.
- [ ] Production is serving the gRPC build.
- [ ] No required work, unresolved failure, or unverified release gate remains.

## Local Release Evidence (2026-07-30)

- Root tests: 18 passed; the two opt-in live cases are skipped by default.
- Live gRPC: mainnet and testnet Core API/ledger reads both passed.
- Root SDK/CLI: ESM JavaScript and declarations built successfully for Node 22.
- Web: TypeScript validation and production build passed; main bundle is
  722.06 kB minified / 213.72 kB gzip.
- Dependency audits: zero known vulnerabilities in both root and Web projects.
- Browser routes: dashboard, portfolio, cleanup, management, security, query,
  and settings rendered without console errors; network selection worked.
- Remaining browser gate: connect an actual wallet, simulate a transaction, and
  inspect production gRPC-web traffic before declaring rollout complete.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| SDK 2.x response shapes differ from JSON-RPC | High | Add adapters and focused tests before migrating callers. |
| Legacy dApp Kit cannot use gRPC | High | Replace it completely with `@mysten/dapp-kit-react`. |
| Native stake query has no direct Core equivalent | Medium | List and parse owned `StakedSui` objects over gRPC; test known fixtures. |
| Transaction failure is returned as a result union | High | Require explicit `FailedTransaction` checks in all execution paths. |
| Browser endpoint lacks gRPC-web/CORS support | High | Run real browser testnet/mainnet smoke tests before release. |
| Cloudflare deployment has no application feature flag | Medium | Keep the previous production commit/deployment ready for instant rollback. |
| GitHub Issue/PR credentials unavailable | High | Complete local verified work, but do not branch/commit/push/deploy until access is restored. |

## Rollback Plan

### Trigger Conditions

- Production gRPC requests fail because of CORS, endpoint, or transport errors.
- Critical wallet reads or transaction simulations regress.
- Error rate exceeds twice baseline or P95 latency rises by more than 50%.
- Any transaction execution path reports a false success or data-integrity risk.

### Steps

1. Roll Cloudflare Pages back to the deployment for the previous `main` commit.
2. Verify the previous deployment loads and its critical wallet read flow works.
3. Keep the gRPC branch open, diagnose against testnet/staging, and redeploy only
   after the failed gate is covered by a regression test.

### Data Considerations

The migration changes client transport and response handling only. It has no
database or persistent data migration, so rollback does not require data repair.

## Open Questions

- GitHub Issue number and write authentication must be restored before branch,
  commit, push, PR, merge, or production deployment.
- The production Cloudflare project/dashboard must be reachable when release
  verification begins.
