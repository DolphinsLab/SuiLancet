# Linear Project Setup Guide

This guide provides step-by-step instructions for setting up SuiLancet project management in Linear.

---

## Table of Contents

1. [Create Project](#1-create-project)
2. [Configure Label System](#2-configure-label-system)
3. [Set Up Workflow States](#3-set-up-workflow-states)
4. [Create Cycles/Milestones](#4-create-cyclesmilestones)
5. [Configure Issue Templates](#5-configure-issue-templates)
6. [GitHub Integration](#6-github-integration)
7. [Create Initial Issues](#7-create-initial-issues)
8. [Daily Workflow](#8-daily-workflow)

---

## 1. Create Project

### Steps

1. Log in to [Linear](https://linear.app)
2. Click the **"+"** button in the left sidebar
3. Select **"Create project"**
4. Fill in project information:

| Field | Value |
|-------|-------|
| **Project name** | SuiLancet |
| **Project key** | SUI |
| **Icon** | 🔧 or 💼 |
| **Color** | Blue (#3B82F6) |

5. Click **"Create project"**

### Project Description (Copy & Paste)

```
Lightweight Sui blockchain multi-wallet management tool

Features:
• CLI and Web UI dual-mode interaction
• Cetus, DeepBook V3 DEX integration
• Batch coin operations and Vault management
• Unified multi-wallet management

Tech Stack: TypeScript, React, Vite, Sui SDK
```

---

## 2. Configure Label System

### Steps

1. Go to **Settings** → **Labels**
2. Delete default labels (optional)
3. Create new labels according to the tables below:

### Recommended Labels

| Label | Color Code | Purpose |
|-------|------------|---------|
| `feature` | `#22C55E` (Green) | New feature development |
| `bug` | `#EF4444` (Red) | Bug fixes |
| `refactor` | `#EAB308` (Yellow) | Code refactoring |
| `docs` | `#3B82F6` (Blue) | Documentation updates |
| `test` | `#06B6D4` (Cyan) | Test related |
| `chore` | `#6B7280` (Gray) | Build/tooling |

### Module Labels

| Label | Color Code | Purpose |
|-------|------------|---------|
| `web` | `#A855F7` (Purple) | Web UI related |
| `cli` | `#F97316` (Orange) | CLI tool related |
| `sdk` | `#64748B` (Slate) | Core SDK |
| `dex` | `#14B8A6` (Teal) | DEX integration |

### Priority Labels (Optional)

| Label | Color Code | Purpose |
|-------|------------|---------|
| `P0-critical` | `#DC2626` (Dark Red) | Urgent/Blocking |
| `P1-high` | `#F97316` (Orange) | High priority |
| `P2-medium` | `#FBBF24` (Amber) | Medium priority |
| `P3-low` | `#9CA3AF` (Gray) | Low priority |

---

## 3. Set Up Workflow States

> **Note**: Workflow states are configured in **Team Settings**, not Project Settings.

### Steps

1. Click your **Team name** in the left sidebar (e.g., "SuiLancet" or your team name)
2. Click the **gear icon ⚙️** or **"..."** menu next to the Team name
3. Select **"Team Settings"** or **"Settings"**
4. Choose **"Workflow"** from the left menu
5. You'll see a list of states where you can:
   - **Add status**: Click "Add status" button
   - **Edit status**: Click on the status name to edit
   - **Delete status**: Click the "..." menu on the right side of the status
   - **Reorder**: Drag and drop to change order

### Alternative Paths (Shortcuts)

```
Method 1: Keyboard Shortcut
Press G then S → Open settings → Select your Team → Workflow

Method 2: Command Palette
Press Cmd/Ctrl + K → Type "workflow" → Select "Go to team workflow settings"

Method 3: Direct URL
https://linear.app/[your-workspace]/settings/teams/[team-id]/workflow
```

### Recommended Status Flow

```
┌──────────┐    ┌──────┐    ┌─────────────┐    ┌───────────┐    ┌──────┐
│ Backlog  │ →  │ Todo │ →  │ In Progress │ →  │ In Review │ →  │ Done │
└──────────┘    └──────┘    └─────────────┘    └───────────┘    └──────┘
                                                                    │
                                                              ┌─────┴─────┐
                                                              │ Canceled  │
                                                              └───────────┘
```

### Status Configuration Details

| Status | Type | Color | Description |
|--------|------|-------|-------------|
| **Backlog** | Backlog | Gray | Task pool awaiting evaluation |
| **Todo** | Unstarted | Blue | Evaluated, waiting to start |
| **In Progress** | Started | Yellow | Currently being developed |
| **In Review** | Started | Purple | PR submitted, awaiting review |
| **Done** | Completed | Green | Completed and merged |
| **Canceled** | Canceled | Red | Canceled/no longer needed |

### Adding Custom Status (In Review)

Linear may not have an "In Review" status by default. Add it manually:

1. On the Workflow settings page, click **"Add status"**
2. Fill in:
   - **Name**: `In Review`
   - **Type**: Select `Started`
   - **Color**: Choose purple
   - **Description**: `PR submitted, awaiting code review`
3. Drag it between "In Progress" and "Done"
4. Click **Save**

### Status Type Definitions

| Type | Meaning | Usage |
|------|---------|-------|
| **Backlog** | Backlog pool | Unplanned tasks |
| **Unstarted** | Not started | Planned but not started |
| **Started** | In progress | Tasks being worked on |
| **Completed** | Completed | Successfully finished tasks |
| **Canceled** | Canceled | Tasks no longer needed |

---

## 4. Create Cycles/Milestones

### Steps

1. Click **"Cycles"** in the left sidebar
2. Click **"+ New cycle"**
3. Create according to the following plan:

### Cycle 1: Core Stability (Current)

**Name**: `Cycle 1: Core Stability`
**Duration**: 2 weeks
**Goals**:
```
Improve existing features and fix known issues
- Complete Swap page execution logic
- Complete Vault Deposit/Withdraw execution logic
- Implement custom RPC endpoint support
- Add unit tests (target 80% coverage)
```

### Cycle 2: Advanced Trading

**Name**: `Cycle 2: Advanced Trading`
**Duration**: 3 weeks
**Goals**:
```
Expand trading features
- Margin Trading Web UI
- Suilend lending Web UI
- Price quotes and slippage settings
- Transaction history
```

### Cycle 3: User Experience

**Name**: `Cycle 3: User Experience`
**Duration**: 2 weeks
**Goals**:
```
Enhance user experience
- Dark/light theme toggle
- Mobile responsive optimization
- User onboarding tutorial
```

---

## 5. Configure Issue Templates

### Steps

1. Go to **Settings** → **Templates**
2. Click **"+ Create template"**
3. Create the following templates:

### Template 1: Feature Request

**Template Name**: `Feature Request`

**Content**:
```markdown
## Goal
<!-- Clear description of the feature to implement -->

## Background
<!-- Why this feature is needed -->

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

## Technical Approach
<!-- Optional - Initial technical ideas -->

## Related Files
<!-- List related code file paths -->
- `path/to/file.ts`

## References
<!-- Optional - Related documentation or links -->
```

### Template 2: Bug Report

**Template Name**: `Bug Report`

**Content**:
```markdown
## Description
<!-- Brief description of the bug -->

## Steps to Reproduce
1. Step 1
2. Step 2
3. ...

## Expected Behavior
<!-- What should happen -->

## Actual Behavior
<!-- What actually happens -->

## Environment
- **Network**: mainnet / testnet / devnet
- **Browser**: Chrome / Firefox / Safari
- **Wallet**: Sui Wallet / Suiet / Ethos

## Screenshots/Logs
<!-- Optional - Attach screenshots or error logs -->

## Possible Cause
<!-- Optional - If you have an initial assessment -->
```

### Template 3: Technical Task

**Template Name**: `Technical Task`

**Content**:
```markdown
## Task Description
<!-- Specific content of the technical task -->

## Implementation Steps
- [ ] Step 1
- [ ] Step 2
- [ ] Step 3

## Impact Scope
<!-- Which modules will this change affect -->

## Test Plan
- [ ] Unit tests
- [ ] Integration tests
- [ ] Manual testing

## Related Files
- `path/to/file.ts`
```

---

## 6. GitHub Integration

### Steps

1. Go to **Settings** → **Integrations**
2. Find **GitHub** and click **"Connect"**
3. Authorize Linear to access the `DolphinsLab/SuiLancet` repository

### Configure Sync Rules

#### Branch Naming Convention

Enable automatic branch creation:
```
Format: feature/SUI-{issue-number}-{slug}
Example: feature/SUI-42-swap-execution
```

#### PR Auto-Linking

Use these formats in PR descriptions to auto-link issues:
```
Closes SUI-123
Fixes SUI-123
Resolves SUI-123
```

#### Commit Linking

Reference issues in commit messages:
```
feat(web): implement swap execution logic

SUI-123
```

### GitHub Actions Integration (Optional)

Add Linear status updates in `.github/workflows/`:

```yaml
# .github/workflows/linear-sync.yml
name: Linear Sync

on:
  pull_request:
    types: [opened, closed, merged]

jobs:
  update-linear:
    runs-on: ubuntu-latest
    steps:
      - name: Update Linear Issue
        # Linear handles this automatically through GitHub integration
        run: echo "PR status synced to Linear"
```

---

## 7. Create Initial Issues

### Issues to Create Immediately

Create the following issues in priority order:

#### High Priority (Cycle 1)

| # | Title | Labels | Priority |
|---|-------|--------|----------|
| 1 | Complete Swap page transaction execution logic | `feature`, `web`, `dex` | P1 |
| 2 | Complete Vault Deposit functionality | `feature`, `web` | P1 |
| 3 | Complete Vault Withdraw functionality | `feature`, `web` | P1 |
| 4 | Implement custom RPC endpoint support | `feature`, `web` | P2 |
| 5 | Add core SDK unit tests | `test`, `sdk` | P2 |

#### Medium Priority (Cycle 2)

| # | Title | Labels | Priority |
|---|-------|--------|----------|
| 6 | Margin Trading Web UI | `feature`, `web` | P2 |
| 7 | Suilend lending Web UI | `feature`, `web` | P2 |
| 8 | Add price quotes and slippage settings | `feature`, `web`, `dex` | P2 |
| 9 | Add transaction history page | `feature`, `web` | P3 |

#### Low Priority (Cycle 3)

| # | Title | Labels | Priority |
|---|-------|--------|----------|
| 10 | Implement dark/light theme toggle | `feature`, `web` | P3 |
| 11 | Mobile responsive optimization | `feature`, `web` | P3 |
| 12 | Update README installation and usage guide | `docs` | P3 |

### Issue Detail Example

**Issue #1 Full Content**:

```markdown
## Title
[feature][web] Complete Swap page transaction execution logic

## Goal
Connect Swap page UI with backend DEX swap logic to implement complete token swap functionality.

## Background
The Swap page UI is complete, but execution logic is not yet connected. Need to integrate Cetus and DeepBook V3 swap methods.

## Acceptance Criteria
- [ ] User can select input/output tokens
- [ ] Display real-time quotes and estimated output
- [ ] Support slippage tolerance settings
- [ ] Successfully execute swap transactions
- [ ] Display transaction result toast notifications
- [ ] Handle errors and show user-friendly messages

## Technical Approach
1. Add execution logic in `web/src/pages/Swap/`
2. Call `src/methods/cetus-swap.ts` or `src/methods/deepbookv3-swap.ts`
3. Use existing Toast component to display transaction status

## Related Files
- `web/src/pages/Swap/index.tsx`
- `src/methods/cetus-swap.ts`
- `src/methods/deepbookv3-swap.ts`
- `web/src/components/TransactionToast/`
```

---

## 8. Daily Workflow

### Developer Workflow

```
┌─────────────────────────────────────────────────────────┐
│                    Daily Development Flow               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. Review Backlog/Todo                                 │
│     └─→ Select an Issue to work on                      │
│                                                         │
│  2. Move Issue to "In Progress"                         │
│     └─→ Auto-create branch (if enabled)                 │
│                                                         │
│  3. Local Development                                   │
│     └─→ git checkout -b feature/SUI-{number}-{slug}    │
│     └─→ Write code                                      │
│     └─→ git commit -m "feat: xxx (SUI-123)"            │
│                                                         │
│  4. Create PR                                           │
│     └─→ PR description includes "Closes SUI-123"        │
│     └─→ Issue auto-moves to "In Review"                 │
│                                                         │
│  5. Code Review                                         │
│     └─→ Make changes/updates                            │
│                                                         │
│  6. Merge PR                                            │
│     └─→ Issue auto-moves to "Done"                      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Keyboard Shortcuts

| Shortcut | Function |
|----------|----------|
| `C` | Create new Issue |
| `G` + `I` | Go to Inbox |
| `G` + `B` | Go to Backlog |
| `G` + `A` | Go to Active |
| `1-4` | Set priority |
| `L` | Add label |
| `A` | Assign owner |
| `P` | Set project |
| `Cmd/Ctrl + K` | Command palette |

### View Configuration Recommendations

#### Create Custom Views

1. **My Tasks**: Filter to show tasks assigned to you
2. **Web UI Tasks**: Filter by `web` label
3. **Current Cycle**: Show all tasks in the current Cycle
4. **High Priority**: Filter P0 and P1 tasks

---

## Appendix: Quick Checklist

### Project Setup Completion Check

- [ ] Project created with Key `SUI`
- [ ] 10+ labels configured
- [ ] 6 workflow states set up
- [ ] 3 Cycles created
- [ ] 3 Issue templates configured
- [ ] GitHub integration enabled
- [ ] 5+ initial Issues created

### Daily Checklist

- [ ] Check Inbox for new notifications
- [ ] Update status of in-progress tasks
- [ ] Close completed tasks

---

## Related Links

- [Linear Documentation](https://linear.app/docs)
- [Linear GitHub Integration Guide](https://linear.app/docs/github)
- [Linear Keyboard Shortcuts](https://linear.app/docs/keyboard-shortcuts)
- [SuiLancet GitHub Repository](https://github.com/DolphinsLab/SuiLancet)

---

*Document Version: 1.0*
*Last Updated: 2026-01-22*
