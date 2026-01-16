# Contributing

Guidelines for contributing to SuiLancet.

---

## Development Workflow

SuiLancet follows **Issue-Driven Development**. All changes must be associated with a GitHub Issue.

### Workflow Steps

```
1. Create Issue     -> Describe the feature/bug
2. Create Branch    -> Branch from main
3. Implement        -> Follow code standards
4. Commit           -> Reference Issue number
5. Create PR        -> Link to Issue
6. Review & Merge   -> Auto-closes Issue
```

---

## Creating Issues

### Issue Types

| Type | Label | Description |
|------|-------|-------------|
| Feature | `feature` | New functionality |
| Bug | `bug` | Something broken |
| Refactor | `refactor` | Code improvements |
| Docs | `docs` | Documentation updates |
| Test | `test` | Test coverage |
| Chore | `chore` | Build/tooling changes |

### Issue Template

```markdown
## Goal
Clear description of what needs to be done.

## Background
Why this change is needed.

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Technical Approach (Optional)
Initial implementation ideas.
```

---

## Branch Naming

```
feature/issue-{number}-{short-description}
bugfix/issue-{number}-{short-description}
refactor/issue-{number}-{short-description}
```

**Examples**:
- `feature/issue-12-multi-wallet-support`
- `bugfix/issue-15-connection-timeout`
- `refactor/issue-20-simplify-coin-logic`

---

## Commit Convention

### Format

```
<type>(<scope>): <subject> (#issue-number)
```

### Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code refactoring |
| `docs` | Documentation |
| `test` | Test changes |
| `chore` | Build/tool changes |

### Examples

```bash
feat(wallet): add multi-wallet support (#12)
fix(backend): resolve connection timeout (#15)
docs(readme): update installation guide (#8)
refactor(coin): simplify merge logic (#20)
test(client): add unit tests for getAllCoins (#25)
```

---

## Pull Requests

### PR Title Format

```
[#IssueNumber] Short description
```

### PR Template

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

## Screenshots (if applicable)
```

---

## Code Standards

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `process-coin.ts` |
| Classes | PascalCase | `SuiScriptClient` |
| Functions | camelCase | `getAllCoins` |
| Constants | UPPER_SNAKE | `MAX_MERGE_PER_TX` |

### Code Style

- Use ESLint + Prettier
- Max file length: 300 lines
- Max function length: 50 lines
- Add JSDoc for public APIs

### Comments

```typescript
// Good: Explains why
// Rate limit to 50 requests per second to avoid API throttling
await sleep(20)

// Bad: Explains what (obvious from code)
// Sleep for 20ms
await sleep(20)
```

### TODO Format

```typescript
// TODO(#123): Implement batch processing for large coin sets
```

---

## Testing

### Requirements

- Unit test coverage: > 80%
- Critical paths must have integration tests
- Test file naming: `*.test.ts`

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- coin.test.ts

# Run with coverage
npm test -- --coverage
```

---

## Security Guidelines

### Do

- Use environment variables for secrets
- Validate all user inputs
- Keep dependencies updated
- Review security advisories

### Don't

- Hardcode private keys or mnemonics
- Commit `.env` files
- Ignore security warnings
- Use deprecated packages

---

## Local Development

### Setup

```bash
# Clone repository
git clone https://github.com/YourUsername/SuiLancet.git
cd SuiLancet

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Run tests
npm test

# Start CLI
npm run dev
```

### Web Development

```bash
cd web
npm install
npm run dev
```

---

## Getting Help

- Check existing issues before creating new ones
- Use discussions for questions
- Tag maintainers for urgent issues

---

*Thank you for contributing to SuiLancet!*
