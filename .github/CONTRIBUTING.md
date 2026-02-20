# Contributing to CircleExchange

Thank you for your interest in contributing to CircleExchange! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

We are committed to providing a welcoming and inclusive environment for all contributors. Please be respectful and considerate in all interactions.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
3. **Create a feature branch** (`git checkout -b feature/your-feature-name`)
4. **Make your changes** and commit regularly
5. **Push to your fork** (`git push origin feature/your-feature-name`)
6. **Create a Pull Request** with a clear description

## Development Setup

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm start
```

### Mobile
```bash
cd mobile
npm install
npm start
```

## Coding Standards

### Style Guide
- Use **TypeScript** for type safety
- Follow **ESLint** configuration (run `npm run lint`)
- Format code with **Prettier** (run `npm run format`)
- Write **meaningful variable/function names**
- Add **comments** for complex logic

### Commit Messages
Use clear, descriptive commit messages:
```
[TYPE] Brief description

- Detailed explanation if needed
- Bullet points for multiple changes

Closes #123
```

**Types**: feat, fix, docs, style, refactor, test, chore, perf, ci

**Examples:**
```
feat: Add user profile API endpoint
fix: Resolve database connection pooling issue
docs: Update authentication documentation
test: Add unit tests for listing service
```

### Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new features
3. **Run tests locally** (`npm test`)
4. **Request code review** from team members
5. **Address feedback** promptly
6. **Ensure CI/CD passes** before merging

## Testing Requirements

- **Unit tests**: 80%+ coverage for new code
- **Integration tests**: For API endpoints
- **Manual testing**: For UI/UX changes

Run tests:
```bash
npm test
npm run test:coverage
```

## Documentation

- Update **README.md** for major changes
- Add **JSDoc comments** for functions
- Update **API documentation** for new endpoints
- Document **environment variables** in `.env.example`

## Branch Naming

Use descriptive branch names:
- `feature/user-authentication`
- `fix/message-delivery-bug`
- `docs/api-documentation`
- `refactor/database-queries`

## Common Issues

### Test Failures
- Ensure database is running
- Check environment variables
- Clear node_modules and reinstall

### Build Issues
- Run `npm clean-install`
- Check TypeScript errors: `npm run type-check`
- Verify Node.js version (18+)

## Performance Guidelines

- Use **pagination** for large datasets
- Implement **caching** where appropriate
- Optimize **database queries** with indexes
- **Lazy load** components in frontend
- Monitor **bundle size** in production

## Security Guidelines

- Never commit **secrets** or API keys
- Use **parameterized queries** to prevent SQL injection
- Validate **all user inputs**
- Follow **OWASP best practices**
- Run **security audits** regularly

## Questions or Issues?

- Check existing **issues** and **discussions**
- Read the **documentation** in `/docs`
- Ask in **GitHub Discussions**
- Contact the team leads

## Recognition

Contributors will be:
- Added to **CONTRIBUTORS.md**
- Mentioned in **release notes**
- Acknowledged in project updates

Thank you for helping make CircleExchange better! 🎉
