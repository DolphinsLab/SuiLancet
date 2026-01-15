# CLAUDE.md - SuiLancet Project Guide

## Project Overview

SuiLancet is a lightweight personal tool for managing multiple Sui wallets and backend services in one place.

---

## Development Workflow (Issue-Driven Development)

### Core Principles

**All feature development must be driven by Issues**, following this workflow:

### 1. Issue Creation Guidelines

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
Branch naming convention:
- feature/issue-{number}-{short-description}
- bugfix/issue-{number}-{short-description}
- refactor/issue-{number}-{short-description}
```

### 3. Development Flow

```
1. Create Issue -> Describe requirements and acceptance criteria
2. Create Branch -> Branch from main, associate with Issue number
3. Implement -> Follow code standards
4. Commit -> Reference Issue in commit message (#123)
5. Create PR -> Link Issue, request review
6. Merge -> PR merge auto-closes Issue
```

### 4. Commit Convention

```
Format: <type>(<scope>): <subject> (#issue-number)

Types:
- feat:     New feature
- fix:      Bug fix
- refactor: Code refactoring
- docs:     Documentation update
- test:     Test related
- chore:    Build/tool changes

Examples:
- feat(wallet): add multi-wallet support (#12)
- fix(backend): resolve connection timeout (#15)
- docs(readme): update installation guide (#8)
```

### 5. PR Guidelines

**PR Title**: `[#IssueNumber] Short description`

**PR Description Template**:
```markdown
## Related Issue
Closes #xxx

## Changes
- Change 1
- Change 2

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing complete

## Screenshots/Recordings (if applicable)
```

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

1. **Receiving tasks**: First confirm the associated Issue number
2. **During development**: Work on the corresponding feature branch
3. **When committing**: Commit message must reference Issue
4. **On completion**: Create PR and link Issue

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

*Last updated: 2026-01-15*
