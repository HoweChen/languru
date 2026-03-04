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

---

## 🎓 Advanced Unsafe Patterns (Deep Dive)

> ⚠️ **WARNING**: The following patterns are for educational purposes. Most should NOT be used in production unless you fully understand the risks.

### 1. uintptr and GC Dangers

The most dangerous mistake with `unsafe` is storing a `uintptr` for later use.

```go
// ❌ DANGEROUS: Storing uintptr
type Data struct { Value int }
d := &Data{Value: 42}

ptr := uintptr(unsafe.Pointer(d))  // Convert to uintptr
// ... some code ...
// ☠️ If GC runs here, 'd' might be moved or collected!
value := *(*Data)(unsafe.Pointer(ptr))  // POTENTIAL CRASH!
```

**Why is this dangerous?**
- Go's GC is a moving collector - objects can be relocated in memory
- `uintptr` is just an integer, not a pointer - GC doesn't know about it
- When GC moves the object, your `uintptr` points to invalid memory

**The Safe Pattern**: Convert back to `unsafe.Pointer` in the same expression:

```go
// ✅ SAFE: All in one expression
d := &Data{Value: 42}
value := *(*int)(unsafe.Pointer(
    uintptr(unsafe.Pointer(d)) + unsafe.Offsetof(d.Value),
))
```

**Rule**: If you convert `unsafe.Pointer` to `uintptr`, you must convert back in the same expression. Never store `uintptr` across statements.

### 2. Memory Alignment

Go aligns struct fields automatically, but understanding alignment is crucial when using `unsafe`.

```go
// ❌ BAD: Wastes memory due to padding
type BadAlignment struct {
    A byte    // 1 byte + 7 bytes padding
    B int64   // 8 bytes (needs 8-byte alignment)
    C byte    // 1 byte + 7 bytes padding
}
// Total: 24 bytes on 64-bit

// ✅ GOOD: Fields ordered by size
type GoodAlignment struct {
    B int64   // 8 bytes
    A byte    // 1 byte
    C byte    // 1 byte + 6 bytes padding
}
// Total: 16 bytes on 64-bit
```

**Alignment Rules:**
- `int64`, `float64` need 8-byte alignment
- `int32`, `float32` need 4-byte alignment
- `bool`, `byte` need 1-byte alignment

**DANGER on ARM/MIPS** (works on x86):
```go
var good GoodAlignment
// Creating a misaligned pointer crashes on ARM!
misaligned := (*int64)(unsafe.Pointer(
    uintptr(unsafe.Pointer(&good)) + 1,  // offset 1 = not 8-byte aligned
))
_ = *misaligned  // 💥 SIGBUS on ARM, undefined on x86
```

### 3. Interface Internals

An `interface{}` is internally a two-word structure:

```go
// interface{} internal representation (simplified)
type iface struct {
    tab  *itab      // 1st word: type information + method table
    data unsafe.Pointer  // 2nd word: pointer to actual data
}
```

**Inspection example:**
```go
var i interface{} = 42

// Peek at internal structure
iface := (*[2]uintptr)(unsafe.Pointer(&i))
typePtr := iface[0]  // Pointer to type info
dataPtr := iface[1]  // Pointer to the int 42

fmt.Printf("type: %x, data: %x\n", typePtr, dataPtr)
```

**Why this matters:**
- Explains why `interface{}` allocation has overhead
- Explains the `nil` interface trap:
  ```go
  var p *int = nil
  var i interface{} = p
  fmt.Println(i == nil)  // false! i has type info for *int
  ```

### 4. Slice Internals

A slice is a three-word structure:

```go
// slice internal representation
type slice struct {
    ptr unsafe.Pointer  // 1st word: backing array
    len int             // 2nd word: length
    cap int             // 3rd word: capacity
}
```

**Inspection example:**
```go
s := make([]int, 5, 10)

header := (*struct {
    ptr unsafe.Pointer
    len int
    cap int
})(unsafe.Pointer(&s))

fmt.Printf("data: %v, len: %d, cap: %d\n",
    header.ptr, header.len, header.cap)
```

**DANGEROUS trick** - never do this:
```go
// ❌ NEVER: Modifying slice length without reallocation
unsafeSlice := (*reflect.SliceHeader)(unsafe.Pointer(&s))
unsafeSlice.Len = 1000  // Out-of-bounds access waiting to happen!
```

### 5. String Immutability Violation

Strings in Go are immutable for good reasons. `unsafe` can break this:

```go
// ⚠️ DANGEROUS: Violates string immutability
func StringToBytes(s string) []byte {
    return unsafe.Slice(unsafe.StringData(s), len(s))
}

s := "hello"
b := StringToBytes(s)
b[0] = 'H'  // 💥 SIGSEGV - string literals are in read-only memory!
```

**Even with heap strings, this breaks:**
1. String hash tables will have wrong values
2. If string is interned, you affect all references
3. Breaks Go's fundamental guarantee

**Rule**: Only use zero-copy string↔[]byte when you control the lifetime AND won't modify.

### 6. When unsafe is Actually Necessary

**Valid use cases:**

1. **Zero-copy parsing** (JSON, protobuf):
   ```go
   // In hot paths where allocation matters
   func BytesToString(b []byte) string {
       return unsafe.String(unsafe.SliceData(b), len(b))
   }
   ```

2. **CGO interop**:
   ```go
   /*
   typedef struct { int x; int y; } Point;
   */
   import "C"

   cPoint := C.Point{x: 10, y: 20}
   goPoint := (*Point)(unsafe.Pointer(&cPoint))
   ```

3. **Memory-mapped files**:
   ```go
   // Direct access to file contents via mmap
   data, _ := syscall.Mmap(fd, 0, size, syscall.PROT_READ, syscall.MAP_SHARED)
   slice := unsafe.Slice((*byte)(unsafe.Pointer(&data[0])), size)
   ```

**Never use for:**
- Business logic
- Regular data structures
- "Performance" without benchmarks proving the need
- Avoiding the type system for convenience

---

## 📋 Unsafe Safety Checklist

Before using `unsafe`, verify:

- [ ] Is there a safe alternative? (reflect, generics, interfaces)
- [ ] Have you benchmarked to prove the performance gain?
- [ ] Is the unsafe code isolated in a small function?
- [ ] Are all invariants documented?
- [ ] Have you tested on multiple architectures (amd64, arm64)?
- [ ] Is the code reviewed by experienced Go developers?

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
