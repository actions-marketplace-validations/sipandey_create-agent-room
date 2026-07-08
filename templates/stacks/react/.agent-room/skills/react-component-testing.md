---
name: react-component-testing
description: "React component testing with React Testing Library: user-centric tests, async, and mocking"
---

# React Component Testing

## Testing user interactions, not implementation

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('submits form when user clicks button', async () => {
  const user = userEvent.setup();
  const handleSubmit = jest.fn();

  render(<MyForm onSubmit={handleSubmit} />);

  const input = screen.getByLabelText('Name');
  await user.type(input, 'John');

  const button = screen.getByRole('button', { name: /submit/i });
  await user.click(button);

  expect(handleSubmit).toHaveBeenCalledWith('John');
});
```

## Async patterns

```typescript
test('displays data after loading', async () => {
  render(<DataComponent />);

  // Component starts with loading state
  expect(screen.getByText(/loading/i)).toBeInTheDocument();

  // Wait for data to appear
  const element = await screen.findByText('Data loaded');
  expect(element).toBeInTheDocument();
});
```

## Mocking hooks and context

```typescript
jest.mock('./hooks', () => ({
  useCustomHook: () => ({ data: 'mocked' })
}));

test('uses mocked hook', () => {
  render(<ComponentUsingHook />);
  expect(screen.getByText('mocked')).toBeInTheDocument();
});
```

## Avoid testing implementation details

- ❌ Testing internal state directly
- ❌ Testing component hierarchy
- ❌ Querying by TestID (except as last resort)
- ✅ Query by accessible roles, labels, text

## Red-Green-Refactor

1. Write test that describes user behavior (red)
2. Implement component to pass test (green)
3. Refactor component for clarity (refactor)

```bash
npm test -- --watch
npm test -- --coverage
```

Target >80% coverage, prioritizing critical user flows.
