# Day 4: Metaprogramming & Reflection

Welcome to Day 4. Today we unlock the "Black Magic" level of TypeScript: **Metaprogramming**.

Metaprogramming allows your code to inspect, modify, and generate other code at runtime. This is the foundation of frameworks like NestJS, TypeORM, and Angular.

## 📚 Key Concepts

### 1. Decorators (AOP)
Decorators allow you to wrap existing logic with "Cross-Cutting Concerns" like logging, caching, validation, or authentication.

**Important**: There are TWO decorator standards in TypeScript:
- **Standard Decorators** (TC39 Stage 3, TS 5.0+): Used in `01_method_decorator.ts`
- **Experimental Decorators** (`experimentalDecorators: true`): Used by NestJS, Angular, and `reflect-metadata`

This course shows BOTH approaches for completeness.

### 2. Reflection (`reflect-metadata`)
TypeScript types are erased at runtime. Reflection allows us to "keep" some information (like constructor parameter types) so we can inspect them later. This is crucial for **Dependency Injection**.

### 3. Dependency Injection (DI)
Instead of classes creating their own dependencies (`new Database()`), they ask for them in the constructor. A generic "Container" figures out how to create and provide those objects.

### 4. Proxies
The `Proxy` object enables you to create a wrapper for another object and intercept operations like reading/writing properties. Useful for "Magic" APIs or change tracking.

---

## ✅ Dos and Don'ts

| Category | Do ✅ | Don't ❌ |
|----------|-------|----------|
| **Decorators** | **Do** Use for generic logic. <br> `@Log`, `@Cache`, `@Auth` | **Don't** Hide business logic. <br> `@CalculateTax // Logic hidden` |
| **Usage** | **Do** Stack clearly. <br> `@Post('/users') @Auth('admin')` | **Don't** Couple decorators. <br> `@A` must run before `@B` implicitly. |
| **DI** | **Do** Inject Services. <br> `constructor(private db: Database) {}` | **Don't** Inject DTOs. <br> `constructor(user: UserDTO) {} // ❌` |
| **Reflection** | **Do** Build frameworks. <br> `Reflect.getMetadata(...)` | **Don't** Use in hot paths. <br> Reflection is slow. |
| **Proxies** | **Do** Use for dynamic behavior. <br> `new Proxy(target, handler)` | **Don't** Overuse. <br> Hard to debug. |

---

## 💡 Key Snippets

### The "Log Execution Time" Decorator
Wraps a method to measure how long it takes.

```typescript
function LogTime(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: any[]) {
    const start = performance.now();
    const result = originalMethod.apply(this, args);
    const end = performance.now();
    console.log(`${propertyKey} took ${(end - start).toFixed(2)}ms`);
    return result;
  };

  return descriptor;
}

class UserService {
  @LogTime
  getUsers() {
    // ... expensive DB call ...
  }
}
```

### Dependency Injection (Conceptual)
How NestJS works under the hood.

```typescript
// 1. Mark a class as Injectable
@Injectable()
class Logger {}

// 2. Ask for it in Constructor
@Injectable()
class UserService {
  // TypeScript emits metadata about 'Logger' type here!
  constructor(private logger: Logger) {}
}

// 3. Container resolves it
const service = Container.resolve(UserService);
// Container sees UserService needs Logger -> creates Logger -> injects it.
```

---

## 🛠 Examples Explained

| File | Description |
|------|-------------|
| **[01_method_decorator.ts](./examples/01_method_decorator.ts)** | A standard logging decorator. Measures execution time and logs arguments. |
| **[02_metadata_reflection.ts](./examples/02_metadata_reflection.ts)** | Implements a **Validation System** (like `class-validator`). Uses decorators to mark fields as `@Required` and checks them at runtime. |
| **[03_dependency_injection.ts](./examples/03_dependency_injection.ts)** | Builds a mini **IoC Container**. Shows how to use `reflect-metadata` to automatically inject class dependencies. |
| **[04_mixins.ts](./examples/04_mixins.ts)** | Implements **Multiple Inheritance** via Mixins. Combines `Timestamped` and `Activatable` behaviors into one class. |
| **[05_proxies.ts](./examples/05_proxies.ts)** | Creates a "Magic" API Client that generates methods on the fly (e.g., `client.getUsers()`) using `Proxy`. |

## 🏃‍♀️ Running the Examples

```bash
bun run examples/01_method_decorator.ts
bun run examples/03_dependency_injection.ts
```
