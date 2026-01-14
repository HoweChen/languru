# Day 2: Functional Patterns & Type Safety

Welcome to Day 2. Today we shift focus from "How to define types" to "How to structure logic" using functional programming principles that TypeScript supports natively.

Adopting these patterns in your backend code leads to systems that are easier to test, harder to break, and explicitly handle failure cases.

## 📚 Key Concepts

### 1. Discriminated Unions (Algebraic Data Types)
The single most powerful feature for modeling state. Instead of boolean flags (`isLoading`, `isError`), we use a literal "discriminator" field (e.g., `kind` or `status`) to create disjoint types. The compiler then knows *exactly* which properties exist based on that field.

### 2. The Result Pattern (vs Exceptions)
Exceptions in TypeScript are opaque (you don't know *what* a function throws just by looking at its signature). The Result pattern treats errors as values, forcing the caller to handle them.
- **Success**: Returns a wrapped value (Ok).
- **Failure**: Returns a wrapped error (Err).

### 3. Immutability
Mutable state is the root of many backend bugs (race conditions, unexpected side effects). TypeScript provides `readonly` and `ReadonlyArray` to enforce immutability at compile time.

### 4. Composition (Pipe)
Building complex logic by combining small, pure functions. This replaces deep inheritance hierarchies or massive "God classes" with simple, testable pipelines.

---

## ✅ Dos and Don'ts

| Category | Do ✅ | Don't ❌ |
|----------|-------|----------|
| **State** | **Do** Use Discriminated Unions. <br> `type State = { status: 'loading' } \| { status: 'success', data: T };` | **Don't** use optional bags. <br> `type State = { loading: boolean, data?: T, error?: Error };` |
| **Errors** | **Do** Use Result types. <br> `fn(): Result<User, Error>` | **Don't** Throw for expected errors. <br> `if (!user) throw new Error('Not found');` |
| **Data** | **Do** Use `readonly`. <br> `const list: readonly string[]` | **Don't** Mutate arrays. <br> `list.push('item'); // ❌` |
| **Logic** | **Do** Compose pure functions. <br> `pipe(data, normalize, validate)` | **Don't** Create massive classes with `this` mutations. |
| **Control** | **Do** Exhaustive checks. <br> `const _exhaustive: never = val;` | **Don't** Use `default` to ignore cases. |

---

## 💡 Key Snippets

### The "Exhaustive Switch"
Ensures you never forget to handle a case in a union.

```typescript
type UserStatus = 'active' | 'suspended' | 'deleted';

function handleStatus(status: UserStatus) {
  switch (status) {
    case 'active': return 'User is active';
    case 'suspended': return 'User is suspended';
    case 'deleted': return 'User is deleted';
    default:
      // This line causes a compile error if a new status is added but not handled
      const _exhaustiveCheck: never = status;
      return _exhaustiveCheck;
  }
}
```

### The Result Type (Simplified)
```typescript
type Result<T, E = Error> = 
  | { success: true; value: T } 
  | { success: false; error: E };

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) return { success: false, error: "Division by zero" };
  return { success: true, value: a / b };
}

// Usage forces check
const outcome = divide(10, 0);
if (outcome.success) {
  console.log(outcome.value); // TS knows this is safe
} else {
  console.error(outcome.error); // TS knows this is the error path
}
```

---

## 🛠 Examples Explained

| File | Description |
|------|-------------|
| **[01_discriminated_unions.ts](./examples/01_discriminated_unions.ts)** | Models a payment state machine (Pending -> Success/Failed). Shows how to make "impossible states impossible". |
| **[02_result_pattern.ts](./examples/02_result_pattern.ts)** | Implementation of a `Result` class with `map` and `flatMap` for chaining operations without `try/catch`. |
| **[03_composition_pipe.ts](./examples/03_composition_pipe.ts)** | Demonstrates function composition. Transforming data through a series of pure functions (pipe). |
| **[04_immutability.ts](./examples/04_immutability.ts)** | Techniques for deep immutability, `as const`, and updating complex state safely. |
| **[05_option_pattern.ts](./examples/05_option_pattern.ts)** | Handling nullable values explicitly using an `Option/Maybe` pattern instead of `null/undefined` checks. |

## 🏃‍♀️ Running the Examples

```bash
# Run any example directly with Bun
bun run examples/01_discriminated_unions.ts
bun run examples/02_result_pattern.ts
```
