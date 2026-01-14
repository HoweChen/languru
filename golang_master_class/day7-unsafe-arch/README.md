# Day 7: Unsafe & Architecture

## Introduction
Day 7 explores the "dark side" of Go (`unsafe`) and the "bright side" (Clean Architecture). This duality represents the full spectrum of a Go engineer's toolkit: low-level performance hacks vs. high-level maintainability patterns.

## Core Concepts

### 1. The `unsafe` Package
-   **What is it?**: A package that allows you to bypass Go's type safety and memory safety.
-   **Why use it?**:
    -   **Zero-Copy Conversions**: Convert `string` to `[]byte` without allocating new memory.
    -   **FFI (Cgo)**: Interacting with C code often requires pointer manipulation.
    -   **Atomic Operations**: Accessing memory fields directly.
-   **Dangers**:
    -   Not portable (depends on endianness and architecture).
    -   GC unsafe (if you hold a uintptr to an object, the GC might collect it).
    -   Can crash your program (SIGSEGV) if you access invalid memory.

### 2. Hexagonal Architecture (Ports & Adapters)
-   **Concept**: Decouple your business logic (Domain) from the outside world (HTTP, DB, CLI).
-   **Layers**:
    -   **Domain**: Core entities and business rules. No dependencies.
    -   **Ports**: Interfaces defining how the outside world interacts with the Domain.
    -   **Adapters**: Implementations of Ports (e.g., PostgreSQL repository, Gin handler).

## Code Walkthrough

### `unsafe_demo/demo.go`
-   **`StringToBytes` / `BytesToString`**: Uses `unsafe.Slice` and `unsafe.String` (Go 1.20+) for high-performance zero-copy conversion.
-   **`modifyPrivateField`**: Demonstrates how to use pointer arithmetic (`uintptr`) to access and modify unexported struct fields. This is purely educational and generally **unsafe** in production code.

## Dos and Don'ts

### Unsafe
- **Do** use `unsafe.Slice/String` for hot-path optimization (e.g., JSON parsers).
  ```go
  // Good: Zero-copy conversion (Go 1.20+)
  func BytesToString(b []byte) string {
      return unsafe.String(unsafe.SliceData(b), len(b))
  }
  ```
- **Don't** use `unsafe` for regular business logic. It's not worth the risk.
- **Do** keep `unsafe` code isolated in small, well-tested functions.
- **Don't** leak `unsafe` pointers across API boundaries.

### Architecture
- **Do** define interfaces where you *use* them, not where you implement them.
  ```go
  // Good: Defined in the service package, not the DB package
  type UserRepository interface {
      Find(id int) (*User, error)
  }
  ```
- **Don't** make every struct an interface. YAGNI (You Ain't Gonna Need It).
- **Do** keep the `domain` package dependency-free.
  ```go
  // Good: Pure Go struct, no tags, no imports
  package domain

  type User struct {
      ID   int
      Name string
  }
  ```
- **Don't** import `database/sql` or `net/http` into your domain logic.

## Further Reading
-   [Go 1.20 Release Notes (unsafe)](https://go.dev/doc/go1.20#unsafe)
-   [Clean Architecture in Go](https://threedots.tech/post/introduction-to-clean-architecture/)
