# Contributing to eTunda Platform

We love your input! We want to make contributing to eTunda Platform as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features

---

## 📋 Code of Conduct

Be respectful, inclusive, and professional in all interactions.

---

## 🛠️ Development Process

### Getting Started

1. **Fork the repository**
   ```bash
   Click "Fork" on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR-USERNAME/etunda-platform.git
   cd etunda-platform
   ```

3. **Add upstream remote**
   ```bash
   git remote add upstream https://github.com/SOTWke/etunda-platform.git
   ```

4. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or for bug fixes
   git checkout -b fix/bug-name
   ```

---

## 💻 Making Changes

### Setup Development Environment

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Start local development
docker-compose up -d  # or run services individually
```

### Code Style

- **Use TypeScript** for type safety
- **Follow existing patterns** in the codebase
- **Write meaningful variable names**
- **Add comments for complex logic**
- **Keep functions small and focused**

### Before Committing

```bash
# Format code
npm run format

# Run linter
npm run lint

# Run tests
npm run test

# Build to check for errors
npm run build
```

---

## 📝 Commit Messages

Use conventional commits format:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Test changes or additions
- `refactor:` Code refactoring
- `chore:` Dependency updates, configuration changes
- `ci:` CI/CD configuration changes

### Examples
```
feat: add product filtering by category
fix: resolve login token expiration issue
docs: update API endpoint documentation
test: add unit tests for order service
```

---

## 🧪 Testing

All new features and bug fixes should include tests:

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

---

## 🔄 Pull Request Process

1. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Open a Pull Request**
   - Go to GitHub and click "New Pull Request"
   - Provide a clear description of your changes
   - Reference any related issues (e.g., "Fixes #123")

3. **Ensure CI passes**
   - Wait for GitHub Actions to complete
   - All checks must pass before merge

4. **Address feedback**
   - Respond to review comments
   - Push additional commits as needed
   - Re-request review when ready

5. **Merge**
   - Maintainers will merge when approved
   - Delete the feature branch after merge

---

## 📋 Pull Request Checklist

- [ ] Branch created from `main` or `develop`
- [ ] Code follows project style guidelines
- [ ] Changes include tests/test updates
- [ ] Documentation has been updated (if needed)
- [ ] Commit messages follow conventional format
- [ ] No breaking changes (or documented with reasoning)
- [ ] All CI checks pass
- [ ] No merge conflicts

---

## 🐛 Reporting Issues

When reporting bugs, include:

```markdown
**Description**
Clear description of the issue

**Steps to Reproduce**
1. Step one
2. Step two
3. Step three

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- OS: [e.g., Ubuntu 22.04]
- Node version: [e.g., 20.8.0]
- npm version: [e.g., 9.8.0]

**Screenshots/Logs**
If applicable, add screenshots or error logs
```

---

## 💡 Suggesting Features

When suggesting features:

```markdown
**Description**
Clear description of the feature

**Motivation**
Why should this feature exist?

**Proposed Solution**
How should it work?

**Alternative Approaches**
Any other ways to solve this?

**Additional Context**
Any other information
```

---

## 📚 Project Structure Review

Before contributing, familiarize yourself with:

- `packages/backend/` - Express.js API server
- `packages/frontend/` - React.js web application
- `packages/shared/` - Shared TypeScript types
- `.github/workflows/` - CI/CD pipelines
- `SETUP.md` - Development setup guide

---

## 🎯 Priority Areas for Contribution

We especially welcome contributions in these areas:

1. **Backend Features**
   - User authentication
   - Database models and queries
   - API endpoints implementation
   - Input validation

2. **Frontend Features**
   - UI components
   - Pages and views
   - Form handling
   - State management

3. **Testing**
   - Unit tests
   - Integration tests
   - E2E tests

4. **Documentation**
   - API documentation
   - Setup guides
   - Deployment guides

5. **DevOps**
   - CI/CD improvements
   - Docker optimization
   - Deployment automation

---

## 🤔 Questions?

Feel free to:
- Open a GitHub discussion
- Comment on related issues
- Create a new issue to ask questions
- Reach out to maintainers

---

## 📄 License

By contributing to eTunda Platform, you agree that your contributions will be licensed under its MIT License.

---

**Thank you for contributing to eTunda! 🌱**
