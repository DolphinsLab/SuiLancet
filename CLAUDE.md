# CLAUDE.md - SuiLancet Project Guide

## Project Overview

SuiLancet is a lightweight personal tool for managing multiple Sui wallets and backend services in one place.

---

## Development Workflow (Issue-Driven Development)

### Core Principles

**All feature development must be driven by Issues**, following this workflow:

- **Project Management**: Linear (Team Key: `SUI`)
- **Source Control**: GitHub
- **Issue Tracking**: Linear Issues (SUI-XXX) synced with GitHub

### 1. Issue Creation Guidelines

#### Linear Issue (Preferred)

```
Title format: Short description (no prefix needed)
Labels: feature | bug | refactor | docs | test | chore + module labels
Linear ID: Auto-generated as SUI-XXX
```

#### GitHub Issue (Alternative)

```
Title format: [Type] Short description
Type labels: feature | bug | refactor | docs | test | chore
```

**Issue Template**:
- **Goal**: Clear description of what to implement
- **Background**: Why this feature is needed
- **Acceptance Criteria**: Definition of Done
- **Technical Approach**: (Optional) Initial technical ideas

### 2. Branch Management

```
Branch naming convention (with Linear):
- feature/SUI-{number}-{short-description}
- bugfix/SUI-{number}-{short-description}
- refactor/SUI-{number}-{short-description}

Branch naming convention (with GitHub Issues):
- feature/issue-{number}-{short-description}
- bugfix/issue-{number}-{short-description}
- refactor/issue-{number}-{short-description}
```

### 3. Development Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Development Workflow                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Create Issue (Linear)                                       │
│     └─→ Issue created as SUI-XXX                                │
│     └─→ Status: Backlog → Todo                                  │
│                                                                 │
│  2. Start Work                                                  │
│     └─→ Move issue to "In Progress"                             │
│     └─→ Create branch: feature/SUI-XXX-description              │
│                                                                 │
│  3. Implement                                                   │
│     └─→ Follow code standards                                   │
│     └─→ Commit with issue reference                             │
│                                                                 │
│  4. Create PR                                                   │
│     └─→ Include SUI-XXX in title or body                        │
│     └─→ GitHub Action auto-validates reference                  │
│     └─→ Issue auto-moves to "In Review"                         │
│                                                                 │
│  5. Code Review                                                 │
│     └─→ Address feedback                                        │
│                                                                 │
│  6. Merge PR                                                    │
│     └─→ Issue auto-moves to "Done"                              │
│     └─→ Branch deleted                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4. Commit Convention

```
Format: <type>(<scope>): <subject>

With Linear Issue (in commit body):
SUI-XXX

With GitHub Issue (in subject):
<type>(<scope>): <subject> (#issue-number)

Types:
- feat:     New feature
- fix:      Bug fix
- refactor: Code refactoring
- docs:     Documentation update
- test:     Test related
- chore:    Build/tool changes

Examples (Linear):
  feat(wallet): add multi-wallet support

  SUI-42

Examples (GitHub):
  feat(wallet): add multi-wallet support (#12)
  fix(backend): resolve connection timeout (#15)
```

### 5. PR Guidelines

**PR Title**: Include Linear issue ID or descriptive title
```
[SUI-123] Add multi-wallet support
feat(wallet): add multi-wallet support
```

**PR Description Template**:
```markdown
## Related Issue
SUI-XXX
<!-- or for GitHub issues: Closes #xxx -->

## Summary
Brief description of changes

## Changes
- Change 1
- Change 2

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing complete

## Screenshots/Recordings (if applicable)
```

### 6. Linear-GitHub Integration

The project uses GitHub Actions for Linear synchronization (`.github/workflows/linear-sync.yml`):

| Event | Action |
|-------|--------|
| PR opened | Validates issue reference, auto-labels based on files |
| PR ready for review | Updates Linear issue to "In Review" |
| PR merged | Updates Linear issue to "Done" |
| PR converted to draft | Updates Linear issue to "In Progress" |

**Auto-labeling Rules**:
| File Path | Label |
|-----------|-------|
| `web/*` | `web` |
| `src/cli*` | `cli` |
| `src/*` (other) | `sdk` |
| `*cetus*`, `*deepbook*` | `dex` |
| `docs/*`, `*.md` | `docs` |
| `tests/*`, `*.test.*` | `test` |

---

## Project Standards

### Tech Stack

- **Blockchain**: Sui Network
- **Primary Language**: TypeScript
- **Package Manager**: npm/pnpm

### Directory Structure

```
SuiLancet/
├── src/                    # Source code
│   ├── client.ts          # Core client
│   ├── cli.ts             # CLI tool
│   ├── common/            # Utility functions
│   ├── methods/           # Business methods
│   ├── movecall/          # Move call wrappers
│   └── types/             # Type definitions
├── tests/                  # Test files
├── docs/                   # Documentation
├── web/                    # Web UI
└── .github/               # GitHub configuration
    ├── workflows/         # CI/CD
    └── ISSUE_TEMPLATE/    # Issue templates
```

### Code Standards

1. **Naming Convention**
   - Files: `kebab-case.ts`
   - Classes: `PascalCase`
   - Functions/Variables: `camelCase`
   - Constants: `UPPER_SNAKE_CASE`

2. **Code Style**
   - Use ESLint + Prettier (TypeScript)
   - Single file should not exceed 300 lines
   - Functions should not exceed 50 lines

3. **Comments**
   - Public APIs must have JSDoc
   - Add inline comments for complex logic
   - TODO format: `// TODO(#issue): description`

### Testing Standards

- Unit test coverage target: > 80%
- Critical paths must have integration tests
- Test file naming: `*.test.ts`

### Security Guidelines

- Never hardcode private keys or mnemonics
- Use environment variables for sensitive config
- Regularly update dependencies and fix vulnerabilities

---

## Claude Collaboration Guide

### Task Processing Flow

1. **Receiving tasks**: Confirm the associated Linear Issue (SUI-XXX) or GitHub Issue (#XXX)
2. **During development**: Work on the corresponding feature branch
3. **When committing**: Reference issue in commit message or body
4. **On completion**: Create PR and link Issue (GitHub Action validates automatically)

### Issue Reference Requirements

**Always include issue reference in one of these ways**:

| Location | Linear Format | GitHub Format |
|----------|---------------|---------------|
| PR Title | `[SUI-123] Description` | `[#123] Description` |
| PR Body | `SUI-123` | `Closes #123` |
| Branch Name | `feature/SUI-123-desc` | `feature/issue-123-desc` |
| Commit Body | `SUI-123` | N/A |
| Commit Subject | N/A | `feat: desc (#123)` |

**GitHub Action will**:
- Warn if no issue reference is found
- Auto-label PR based on changed files
- Comment on linked GitHub issues

### PR Creation Requirements

**After completing any task, Claude MUST**:

1. **Commit and push** all changes to the feature branch
2. **Create a PR** using `gh pr create` command, OR
3. **Provide PR creation link** if API access is unavailable:
   ```
   https://github.com/DolphinsLab/SuiLancet/compare/main...<branch-name>?expand=1
   ```
4. **Include in PR/link**:
   - Issue reference (SUI-XXX or Closes #XXX)
   - Clear title following commit convention
   - Summary of changes
   - List of modified files
   - Test plan (if applicable)

**PR Link Format**:
```
https://github.com/DolphinsLab/SuiLancet/compare/main...<branch>?expand=1&title=<url-encoded-title>
```

**PR Body Template** (copy-paste ready):
```markdown
## Related Issue
SUI-XXX

## Summary
<!-- Brief description of what this PR does -->

## Changes
- Change 1
- Change 2

## Testing
- [ ] Unit tests pass
- [ ] Manual testing complete
```

### Code Modification Principles

- Read related code first, understand context
- Minimize changes, only make necessary modifications
- Don't introduce unnecessary refactoring or "improvements"
- Maintain code style consistency

### Prohibited Actions

- Don't commit code containing sensitive information
- Don't push directly to main branch
- Don't create feature branches without Issue association
- Don't ignore test failures

---

## Common Commands

```bash
# Development
npm run dev

# Testing
npm test

# Build
npm run build

# Linting
npm run lint
```

---

## Version Release

Follow Semantic Versioning:
- **MAJOR**: Incompatible API changes
- **MINOR**: Backward-compatible new features
- **PATCH**: Backward-compatible bug fixes

---

*Last updated: 2026-01-22*
