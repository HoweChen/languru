# Day 6: Enterprise Architecture & Patterns

Welcome to Day 6. Today we stop writing "scripts" and start building "systems".
Spaghetti code works for 100 lines. It fails at 100,000 lines. Architecture is what keeps big projects sane.

In enterprise TypeScript, we value **maintainability** over speed of writing code. We separate concerns so that changing the database doesn't break the API, and changing the API doesn't break the business logic.

## 📚 Curriculum

1.  **Domain-Driven Design (DDD)**: Creating rich models that enforce business rules.
2.  **Repository Pattern**: Decoupling your code from the database (Postgres, Mongo, etc.).
3.  **Inversion of Control (IoC)**: Using `InversifyJS` for automatic dependency injection.
4.  **Singleton Pattern**: Managing shared resources safely.
5.  **Factory Pattern**: Centralizing object creation logic.

## 🧠 Key Concepts & Snippets

### 1. The Domain Entity
An Entity is not just a type; it's an object with behavior. It protects its own state.

```typescript
class User {
  // Private state - immutable from outside
  private constructor(private readonly id: string, private email: string) {}

  // Public Factory
  static create(email: string): User {
    if (!email.includes('@')) throw new Error("Invalid email");
    return new User(crypto.randomUUID(), email);
  }

  // Business Logic
  changeEmail(newEmail: string) {
    if (this.email === newEmail) return; // Idempotent
    if (!newEmail.includes('@')) throw new Error("Invalid");
    this.email = newEmail;
  }
}
```

### 2. Dependency Injection (The "Hollywood Principle")
Don't call us, we'll call you. Don't `new Database()` inside your service. Ask for it.

```typescript
// BAD: Tight Coupling
class Service {
  db = new Database(); // Hard dependency
}

// GOOD: Dependency Injection
class Service {
  constructor(private readonly db: DatabaseInterface) {} // Testable!
}
```

### 3. Hexagonal Architecture (Ports & Adapters)
- **Port**: Interface defined by the Domain (`interface Logger { log(msg: string): void }`)
- **Adapter**: Implementation defined by Infrastructure (`class ConsoleLogger implements Logger`)

## ✅ Dos and Don'ts

| Do | Don't |
| :--- | :--- |
| **Do** use `private` properties to protect state.<br> ```typescript class User { constructor(private balance: number) {} deposit(amount: number) { this.balance += amount; } } ``` | **Don't** make everything `public`.<br> ```typescript // ❌ Anemic Domain Model class User { public balance: number; // Anyone can mutate this directly! } ``` |
| **Do** define interfaces for external services.<br> ```typescript interface IRepo { save(u: User): Promise<void>; } class PGRepo implements IRepo { ... } ``` | **Don't** couple business logic to tools.<br> ```typescript // ❌ Hard dependency on 'pg' import { Client } from 'pg'; class Service { db = new Client(); } ``` |
| **Do** use Dependency Injection.<br> ```typescript class Service { constructor(private readonly db: IRepo) {} } ``` | **Don't** use global singletons for state.<br> ```typescript // ❌ Hard to test/mock export const db = new Database(); ``` |
| **Do** keep domain logic pure.<br> ```typescript class Order { calculateTotal() { return this.items.sum(); } } ``` | **Don't** leak HTTP details into Domain.<br> ```typescript // ❌ Tying domain to Express class Order { calculate(req: Request) { ... } } ``` |

## 🛠 Examples Explained

### [01_ddd_entity.ts](./examples/01_ddd_entity.ts)
A rich `User` entity that protects its invariants.
**Key Takeaway**: Validation belongs in the Entity, not in the Controller. An Entity should never be in an invalid state.

### [02_repository_pattern.ts](./examples/02_repository_pattern.ts)
Shows how to hide the database behind an interface.
**Key Takeaway**: The `UserService` interacts with `IUserRepository`. It doesn't know if the backing store is an in-memory Map, Postgres, or Firebase. This makes unit testing trivial.

### [03_inversify.ts](./examples/03_inversify.ts)
Uses `inversify`, the industry-standard DI container for TypeScript.
**Key Takeaway**: While manual DI works for small apps, a container helps manage complex dependency graphs and lifecycles (Singleton vs Transient) automatically.

### [04_singleton.ts](./examples/04_singleton.ts)
A Singleton implementation for configuration.
**Key Takeaway**: Use Singletons sparingly (mostly for Config, Logger, Connections). In modern TS, usually a module-level export or a DI container-managed Singleton is preferred over the classical `getInstance()` pattern.

### [05_factory.ts](./examples/05_factory.ts)
A simple factory to decide which `PaymentProcessor` to instantiate.
**Key Takeaway**: Use factories when the exact class to instantiate is determined at runtime (e.g., Stripe vs PayPal based on user country).

---

## 🏃‍♀️ Running the Examples

```bash
bun run examples/01_ddd_entity.ts
bun run examples/03_inversify.ts
```
