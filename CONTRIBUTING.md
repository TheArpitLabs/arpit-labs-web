# Contributing to Arpit Labs

Thank you for your interest in contributing to Arpit Labs! This guide will help you get started with contributing to the project.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Setup](#development-setup)
3. [Project Structure](#project-structure)
4. [Coding Standards](#coding-standards)
5. [Testing](#testing)
6. [Submitting Changes](#submitting-changes)
7. [Code Review Process](#code-review-process)
8. [Getting Help](#getting-help)

---

## Getting Started

### Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Git**: 2.x or higher
- **Code Editor**: VS Code (recommended) with extensions

### Required VS Code Extensions

- ESLint
- Prettier
- TypeScript Vue Plugin (Volar)
- Tailwind CSS IntelliSense
- GitLens

---

## Development Setup

### 1. Fork and Clone the Repository

```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/YOUR_USERNAME/arpit-labs.git
cd arpit-labs

# Add the original repository as upstream
git remote add upstream https://github.com/arpitlabs/arpit-labs.git
```

### 2. Install Dependencies

```bash
# Install npm dependencies
npm install

# Install Husky git hooks
npm run prepare
```

### 3. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# Required variables:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
```

### 4. Run Development Server

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

### 5. Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

---

## Project Structure

```
arpit_labs/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth routes
│   │   ├── (dashboard)/       # Dashboard routes
│   │   ├── admin/             # Admin routes
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   ├── ui/               # Reusable UI components
│   │   ├── admin/            # Admin components
│   │   └── ai/               # AI components
│   ├── lib/                  # Core utilities
│   │   ├── constants.ts      # Configuration
│   │   ├── logger.ts         # Logging
│   │   ├── errors.ts         # Error handling
│   │   ├── cache.ts          # Caching
│   │   └── ...               # Other utilities
│   ├── hooks/                # Custom React hooks
│   └── __tests__/            # Test files
├── public/                   # Static assets
├── supabase/                 # Database migrations
└── scripts/                  # Utility scripts
```

---

## Coding Standards

### TypeScript Guidelines

- **No `any` types**: Use proper TypeScript types
- **Interface over type**: Use interfaces for object shapes
- **Strict mode**: Follow strict TypeScript rules
- **JSDoc comments**: Document public APIs

```typescript
// ❌ Bad
const data: any = fetchData();

// ✅ Good
interface UserData {
  id: string;
  name: string;
  email: string;
}
const data: UserData = fetchData();
```

### React Best Practices

- **Functional components**: Use functional components with hooks
- **Props interfaces**: Define prop interfaces
- **Memoization**: Use `useMemo` and `useCallback` appropriately
- **Error boundaries**: Wrap components with error boundaries

```typescript
// ✅ Good
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ label, onClick, disabled }) => {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
};
```

### Code Organization

- **Single responsibility**: Each file/module should have one purpose
- **Barrel exports**: Use index files for clean imports
- **Utility functions**: Keep utilities in `src/lib/`
- **Components**: Organize by feature/domain

### Naming Conventions

- **Files**: kebab-case (`user-profile.tsx`)
- **Components**: PascalCase (`UserProfile`)
- **Functions**: camelCase (`getUserData`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Interfaces**: PascalCase (`UserData`)

### Git Commit Messages

Follow conventional commits format:

```
type(scope): subject

body

footer
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Examples:
```bash
git commit -m "feat(auth): add OAuth2 support"
git commit -m "fix(api): resolve rate limiting issue"
git commit -m "docs(readme): update setup instructions"
```

---

## Testing

### Unit Tests

Write unit tests for utilities and pure functions:

```typescript
import { describe, it, expect } from 'vitest';
import { classifyError } from '@/lib/errors';

describe('classifyError', () => {
  it('should classify database errors', () => {
    const error = new Error('Database connection failed');
    const classified = classifyError(error);
    expect(classified).toBeInstanceOf(DatabaseError);
  });
});
```

### Integration Tests

Write integration tests for API routes and services:

```typescript
import { describe, it, expect } from 'vitest';
import { rateLimiter } from '@/lib/rate-limit';

describe('Rate Limiting', () => {
  it('should enforce rate limits', async () => {
    const result = await rateLimiter.check('test', 'user1', {
      limit: 2,
      window: 60000,
    });
    expect(result.allowed).toBe(true);
  });
});
```

### Test Coverage

- Aim for >70% code coverage
- Test critical paths and edge cases
- Mock external dependencies
- Keep tests fast and isolated

---

## Submitting Changes

### 1. Create a Branch

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Or fix branch
git checkout -b fix/your-fix-name
```

### 2. Make Changes

- Write clean, documented code
- Add/update tests
- Update documentation if needed
- Follow coding standards

### 3. Commit Changes

```bash
# Stage changes
git add .

# Commit with conventional commit message
git commit -m "feat(component): add new button component"
```

### 4. Push to Your Fork

```bash
# Push to your fork
git push origin feature/your-feature-name
```

### 5. Create Pull Request

- Go to the original repository on GitHub
- Click "New Pull Request"
- Select your branch
- Fill out the PR template
- Link related issues
- Request reviewers

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project guidelines
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] No console errors
- [ ] Responsive design checked
```

---

## Code Review Process

### Review Guidelines

- **Be constructive**: Provide helpful feedback
- **Be respectful**: Treat all contributors with respect
- **Be thorough**: Review code carefully
- **Be timely**: Respond to reviews promptly

### Common Review Points

- Code quality and style
- Test coverage
- Documentation
- Performance implications
- Security considerations
- Accessibility

### Addressing Feedback

- Respond to all review comments
- Make requested changes
- Ask for clarification if needed
- Update PR description if scope changes

---

## Getting Help

### Documentation

- **Developer Guide**: `DEVELOPER_GUIDE.md`
- **API Documentation**: `API_DOCUMENTATION.md`
- **Code Comments**: Inline JSDoc comments

### Communication Channels

- **GitHub Issues**: Report bugs and request features
- **GitHub Discussions**: Ask questions and discuss ideas
- **Discord**: Join our community server

### Common Issues

#### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run build
```

#### Test Failures

```bash
# Run tests in verbose mode
npm test -- --reporter=verbose

# Update snapshots if needed
npm test -- -u
```

#### Type Errors

```bash
# Check TypeScript errors
npm run type-check

# Fix with ESLint
npm run lint -- --fix
```

---

## Recognition

Contributors are recognized in:
- `CONTRIBUTORS.md` file
- Release notes
- Project README
- Annual contributor highlights

---

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on what is best for the community
- Show empathy towards other community members

---

**Thank you for contributing to Arpit Labs!** 🚀

For questions, contact: dev@arpitlabs.com
