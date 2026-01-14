# Day 3: Interface Magic, Reflection & Dependency Injection

## Introduction
Day 3 explores Go's powerful type system features: Interfaces and Reflection. These are the tools that allow libraries like `encoding/json`, `gorm`, and `gin` to work their magic. We also cover Dependency Injection (DI), a critical pattern for building testable and maintainable applications using Interfaces.

We cover:
1.  **Reflection (`reflect` package)**: Inspecting and manipulating types at runtime. Used for serialization, validation, and ORMs.
2.  **Dependency Injection (DI)**: Using interfaces to decouple components ("Dependency Inversion Principle"), enabling easy testing and swapping of implementations.

## Core Concepts

### 1. Interfaces & Dependency Inversion
-   **Implicit Implementation**: Types implement interfaces just by having the methods. No `implements` keyword.
-   **Accept Interfaces, Return Structs**: A key Go proverb. Functions should ask for the behavior they need (Interface) but return the concrete data they created (Struct).
-   **Dependency Injection**: Instead of creating dependencies inside a component (`NewService() { repo = NewDB() }`), pass them in (`NewService(repo Repository)`).

### 2. Reflection (`reflect`)
-   **`reflect.Type`**: Metadata about the type (name, fields, methods).
-   **`reflect.Value`**: The actual data. Can be read or modified (if addressable).
-   **Struct Tags**: Metadata attached to struct fields (e.g., `json:"name"`, `validate:"required"`). Accessible via reflection.
-   **Performance Cost**: Reflection is slower and less safe than static typing. Use it sparingly (e.g., framework code), not in hot paths.

## Code Walkthrough

### `reflection/demo.go`
-   **`Validate`**: A custom struct validator built from scratch.
    -   Iterates over struct fields using `reflect`.
    -   Parses `validate:"..."` tags.
    -   Checks values dynamically (e.g., `min=18`, `required`).
-   **Struct Tags**: Demonstrates how to define rules like `min=18,max=100` in tags.

### `di/demo.go`
-   **Clean Architecture Layers**:
    -   `Repository` (Interface): Data access.
    -   `Service` (Interface): Business logic.
    -   `Handler` (Struct): HTTP/CLI entry point.
-   **Manual Wiring**: In `RunDemo`, we create the DB, inject it into Service, and inject Service into Handler.
    -   `repo := NewUserRepository(...)`
    -   `svc := NewUserService(repo)`
    -   `handler := NewUserHandler(svc)`

## Best Practices

### Interfaces
-   **Keep Interfaces Small**: `Reader`, `Writer`, `Closer`. Single-method interfaces are powerful.
-   **Define Interfaces Where Used**: Don't define a `UserRepo` interface in the `database` package. Define it in the `service` package that uses it.
-   **Don't Export Interfaces for Everything**: Start with structs. Extract interfaces only when you have multiple implementations or need mocking for tests.

### Reflection
-   **Avoid if Possible**: If you can use Generics or Interfaces, do that instead.
-   **Cache Type Info**: Reflection type inspection is slow. Frameworks often cache `reflect.Type` results to speed up subsequent calls.
-   **Check `CanSet()`**: Before modifying a `reflect.Value`, check if it's settable (must be a pointer).

## Dos and Don'ts

### Interfaces
- **Do** accept interfaces in function arguments.
  ```go
  // Good: Decouples function from specific implementation
  func SaveData(w io.Writer, data []byte) error {
      _, err := w.Write(data)
      return err
  }
  ```
- **Don't** return interfaces from constructors (usually). Return the concrete type (pointer).
  ```go
  // Bad: Limits user's ability to access extra methods on *MyClient
  func NewClient() ClientInterface {
      return &MyClient{}
  }

  // Good: Return concrete type, let caller wrap in interface if needed
  func NewClient() *MyClient {
      return &MyClient{}
  }
  ```

### Dependency Injection
- **Do** use constructor injection (`New(dep)`).
  ```go
  // Good: Dependencies are explicit
  func NewService(db Database, cache Cache) *Service {
      return &Service{db: db, cache: cache}
  }
  ```
- **Don't** use global variables for dependencies.
  ```go
  // Bad: Hidden dependency, hard to test
  var DB *sql.DB

  func (s *Service) GetUser(id int) {
      DB.Query(...) // Uses global
  }
  ```

### Reflection
- **Do** use it for generic tools (serialization).
- **Don't** use it for business logic flow control.
  ```go
  // Bad: Using reflection for simple type checks or flow
  if reflect.TypeOf(x).Kind() == reflect.Int {
      // ...
  }

  // Good: Type switch
  switch v := x.(type) {
  case int:
      // ...
  }
  ```

### Tags
- **Do** use standard formats (key:"val").
  ```go
  type User struct {
      Name string `json:"name" validate:"required,min=2"`
  }
  ```
- **Don't** put complex logic in tags.

## Further Reading
-   [The Laws of Reflection](https://go.dev/blog/laws-of-reflection)
-   [Go Wiki: InterfaceSlice](https://github.com/golang/go/wiki/InterfaceSlice)
-   [Wire: Automated Initialization in Go](https://github.com/google/wire)
