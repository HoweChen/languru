# Day 2: Memory Model & Generics

## Introduction
Day 2 dives into the internals of Go's memory management and the powerful Generics system introduced in Go 1.18. Understanding these concepts is crucial for writing high-performance, reusable code.

We cover:
1.  **Escape Analysis**: How the Go compiler decides between Stack and Heap allocation, and why it matters for performance.
2.  **Generics**: Writing type-safe, reusable data structures and algorithms without interface{} reflection overhead.

## Core Concepts

### 1. Memory Management & Escape Analysis
-   **Stack vs. Heap**:
    -   *Stack*: Fast allocation/deallocation (LIFO). Variables die when function returns. No GC overhead.
    -   *Heap*: Slower allocation. Data persists until GC collects it. High GC pressure if overused.
-   **Escape Analysis**: The compiler's process to determine if a variable can safely stay on the stack.
    -   *Rule of Thumb*: If a reference to a variable survives the function (e.g., returned pointer, stored in global), it "escapes" to the heap.

### 2. Generics (Go 1.18+)
-   **Type Parameters**: `[T any]`, `[T comparable]`, `[T cmp.Ordered]`.
-   **Constraints**:
    -   `any`: Alias for `interface{}`.
    -   `comparable`: Types supporting `==` and `!=`.
    -   `cmp.Ordered` (Go 1.21): Types supporting `<`, `>`, etc. (numbers, strings).
-   **Benefits**: Compile-time type safety + Performance (no boxing/unboxing) vs. Runtime reflection.

## Code Walkthrough

### `escape/demo.go`
-   **`RunDemo`**: orchestrates scenarios to demonstrate stack vs. heap allocation.
-   **`NewInt`**: Returns a pointer to a local variable. This forces the variable to move to the Heap.
-   **`closureEscape`**: A closure capturing a local variable forces that variable to the Heap.
-   **Interface Escape**: Passing a value to `fmt.Println` (accepts `any`) often causes escape because the runtime needs to store the type info + value.

### `generics/demo.go`
-   **`Set[T]`**: A generic Set implementation using a map. Requires `T comparable`.
-   **`Max[T]`**: A generic algorithm working on any ordered type (int, float, string).
-   **`Option[T]`**: A monad-like structure handling presence/absence of a value safely, avoiding nil pointer dereferences.
-   **`Cache[K, V]`**: A thread-safe generic cache (LRU-like structure could be added here).

## Best Practices

### Memory
-   **Avoid Premature Optimization**: Don't obsess over every allocation unless profiling (`pprof`) shows a bottleneck.
-   **Pointer vs. Value**:
    -   Use pointers for large structs or when you need shared state.
    -   Use values for small structs (like `Time`, `Point`) to keep them on the stack.
-   **Slices**: Pre-allocate slices with `make([]T, 0, capacity)` to avoid re-allocations and copying.

### Generics
-   **Use Generics for Data Structures**: Lists, Trees, Sets, Maps are perfect candidates.
-   **Use Generics for General Algorithms**: `Map`, `Filter`, `Reduce`, `Max`, `Min`.
-   **Don't Overuse**: If you just need to print something, `interface{}` is fine. If you have specific methods, use Interfaces. Generics are for when logic is identical regardless of type.

## Dos and Don'ts

### Memory
- **Do** use `go build -gcflags="-m"` to check escape.
  ```bash
  $ go build -gcflags="-m" main.go
  # ./main.go:12:13: new(int) escapes to heap
  ```
- **Don't** return pointers to tiny structs (like `int`) just to "save memory". It often costs more.
  ```go
  // Bad: Forces 'i' to heap, increasing GC pressure for a tiny value.
  func NewInt(x int) *int {
      i := x
      return &i
  }

  // Good: Stays on stack, fast copy.
  func NewIntVal(x int) int {
      return x
  }
  ```

### Generics
- **Do** use `cmp.Ordered` for math/sorting.
  ```go
  // Good: Type-safe, works for any numeric type
  func Max[T cmp.Ordered](a, b T) T {
      if a > b { return a }
      return b
  }
  ```
- **Don't** use Generics if a simple Interface satisfies the need.
  ```go
  // Bad: Generics adds unnecessary complexity here
  func Print[T any](w io.Writer, v T) {
      fmt.Fprintln(w, v)
  }

  // Good: Standard interface usage
  func Print(w io.Writer, v any) {
      fmt.Fprintln(w, v)
  }
  ```
- **Do** use `comparable` for Map keys.
  ```go
  // Good: Ensures K can be a map key
  type Set[K comparable] map[K]struct{}
  ```
- **Don't** try to implement C++ Template Metaprogramming. Keep it simple.

### Performance
- **Do** recycle buffers (sync.Pool) for hot paths.
  ```go
  // Good: Reduces allocation churn for temporary buffers
  var bufPool = sync.Pool{
      New: func() any { return new(bytes.Buffer) },
  }
  ```
- **Don't** implement custom allocators unless necessary.


## Further Reading
-   [Go Memory Model](https://go.dev/ref/mem)
-   [Go Generics Tutorial](https://go.dev/doc/tutorial/generics)
-   [Profiling Go Programs](https://go.dev/blog/pprof)
