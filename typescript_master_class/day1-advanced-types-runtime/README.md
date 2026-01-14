# Day 1: Advanced Types & Runtime Foundation

Welcome to Day 1 of the TypeScript Master Class. Today, we focus on the intersection of **Advanced Static Typing** and **Runtime Reality**.

In backend development, relying solely on TypeScript's static checks isn't enough when dealing with external inputs (API requests, database results, environment variables). We need strategies to bridge the gap between "Compile Time" and "Run Time".

## 📚 Curriculum

1.  **Inference & Conditional Types**: How to make TypeScript work for you, not against you.
2.  **Runtime Validation**: Using Zod to infer types from runtime schemas.
3.  **Mapped Types**: Transforming types for DB patterns (Partial, Readonly, DTOs).
4.  **Template Literals**: Strong typing for string-based logic (Events, Routes).
5.  **Branded Types**: Creating nominal types to prevent domain logic errors.

## 🌟 Dos and Don'ts

| Do | Don't |
| :--- | :--- |
| **Do** Infer everything possible. <br> `type Return = Awaited<ReturnType<typeof func>>;` | **Don't** use `any`. <br> `const data: any = JSON.parse(str); // ❌` |
| **Do** Use Branded Types for IDs. <br> `type UserId = string & { __brand: 'UserId' };` | **Don't** trust external data. <br> `const user = req.body as User; // ❌` |
| **Do** Validate at the edges. <br> `const user = UserSchema.parse(req.body); // ✅` | **Don't** write huge interfaces manually. <br> `interface UpdateUser { ...duplicate... } // ❌` |

## 💡 Key Concepts & Snippets

### 1. Conditional Types for Unwrapping
Automatically extract the return type of a Promise or a Function.

```typescript
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
// If T is Promise<string>, UnwrapPromise<T> is string.
// If T is number, UnwrapPromise<T> is number.
```

### 2. Zod Pattern (Single Source of Truth)
Define the schema once, get the validation logic AND the TypeScript type for free.

```typescript
import { z } from "zod";

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
});

type User = z.infer<typeof UserSchema>;
// { id: string; email: string; }
```

### 3. Mapped Types (Deep Readonly)
Protect your internal state from accidental mutations.

```typescript
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};
```

## 🛠 Examples Explained

### [01_inference_handler.ts](./examples/01_inference_handler.ts)
A Higher-Order Function that wraps async handlers. It demonstrates `T extends Promise<infer U>` (Conditional Types) to unwrap return values automatically.

### [02_runtime_validation.ts](./examples/02_runtime_validation.ts)
Demonstrates the "Single Source of Truth" for types using `zod`. We validate `process.env` at startup and crash early if config is invalid.

### [03_mapped_types.ts](./examples/03_mapped_types.ts)
Shows how to take a single `Product` entity and derive `CreateDTO`, `UpdateDTO`, and `ReadonlyView` using Mapped Types (`[P in keyof T]`).

### [04_template_literals.ts](./examples/04_template_literals.ts)
Uses Template Literal Types (`${Resource}:${Action}`) to create a strongly-typed Event Bus. It prevents typos like `User:delteed` at compile time.

### [05_branded_types.ts](./examples/05_branded_types.ts)
Implements "Opaque Types" to prevent mixing up different ID types. This catches logic bugs where you might accidentally swap arguments.

---

## 🏃‍♀️ Running the Examples

This project uses [Bun](https://bun.sh).

```bash
# Run any example directly
bun run examples/01_inference_handler.ts
bun run examples/02_runtime_validation.ts
```
