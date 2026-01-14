# Day 1: Modern Foundations & Concurrency

## Introduction
Welcome to the first day of the **Golang Master Class**. Today, we lay the groundwork by exploring modern Go features (Go 1.21+) and advanced concurrency patterns. This module is designed to transition you from basic syntax to professional-grade engineering practices.

We focus on two critical pillars:
1.  **Iterators (Go 1.23+)**: A unified way to traverse sequences, simplifying data processing pipelines.
2.  **Advanced Concurrency**: Moving beyond simple `go func()`, we master `context`, `errgroup`, and structured concurrency to build robust systems.

## Core Concepts

### 1. Go 1.23 Iterators (`iter` package)
-   **Push vs. Pull Iterators**:
    -   *Push (Rangefunc)*: `func(yield func(V) bool)` - The standard for `for-range` loops. Efficient and idiomatic.
    -   *Pull*: `next, stop := iter.Pull(seq)` - Manual control, useful for zipping sequences or complex state machines.
-   **Generic Adapters**: Creating reusable logic like `Filter`, `Map`, `Reduce` that works on any iterator.

### 2. Structured Concurrency
-   **Context Propagation**: Using `context` to manage cancellation, timeouts, and request-scoped values.
-   **`context.AfterFunc` (Go 1.21)**: Efficiently scheduling cleanup actions when a context ends, avoiding "goroutine leaks" common with watcher goroutines.
-   **`errgroup`**: Synchronizing multiple goroutines, propagating the first error encountered, and cancelling the group context automatically.

## Code Walkthrough

### `iterators/demo.go`
-   **`Fibonacci`**: Demonstrates a custom infinite sequence generator using the `iter.Seq` signature.
-   **`Filter`**: A higher-order function (adapter) that takes a sequence and returns a filtered sequence.
-   **`RunDemo`**: Shows both `for-range` usage (Push) and `iter.Pull` usage.

### `concurrency/demo.go`
-   **`PipelineDemo`**: A multi-stage concurrent pipeline (Producer -> Workers).
    -   Uses `errgroup` to manage lifecycle.
    -   Handles graceful shutdown via context propagation.
    -   Simulates real-world failure scenarios.
-   **`RunAdvancedPatterns`**: Demonstrates `context.AfterFunc` for resource cleanup.

## Best Practices

### Iterators
-   **Prefer Push (`range`)**: Use `for v := range seq` whenever possible. It's cleaner and less error-prone than manual Pull.
-   **Check `yield` Return**: In custom iterators, ALWAYS check if `yield(v)` returns `false`. If so, return immediately to stop iteration.
-   **Naming**: Suffix iterator-returning functions with `Seq` or keep them descriptive (e.g., `All()`, `Backward()`) if they are methods.

### Concurrency
-   **Pass Context Explicitly**: `ctx` should be the first argument of any long-running or cancellable function.
-   **Never Ignore Cancellation**: In loops or blocking operations, always check `ctx.Done()`.
-   **Use `errgroup` for Fan-Out**: Don't manually manage `sync.WaitGroup` + error channels if `errgroup` fits. It's safer.
-   **Avoid Goroutine Leaks**: Ensure every `go func()` has a definite exit condition (usually via Context or Channel close).

## Dos and Don'ts

### Iterators
- **Do** use `iter.Seq` for custom collections.
  ```go
  // Good: Standard iterator signature (Go 1.23+)
  // Efficient and works with standard library helpers
  func Fibonacci() iter.Seq[int] {
      return func(yield func(int) bool) {
          a, b := 0, 1
          for {
              if !yield(a) { // Always check return value to handle 'break'
                  return
              }
              a, b = b, a+b
          }
      }
  }
  ```
- **Don't** use `chan` for simple iteration (too slow).
  ```go
  // Bad: High overhead (locking, allocation) for simple iteration
  func FibonacciChan() <-chan int {
      ch := make(chan int)
      go func() {
          defer close(ch)
          // ... logic
      }()
      return ch
  }
  ```

### Context
- **Do** use `context.AfterFunc` for cleanup (Go 1.21+).
  ```go
  // Good: Efficiently schedules cleanup without an extra goroutine
  stop := context.AfterFunc(ctx, func() {
      conn.Close()
      fmt.Println("Connection closed")
  })
  // If the operation finishes before context cancel, unregister the cleanup
  defer stop()
  ```
- **Don't** start a goroutine just to wait on `ctx.Done()`.
  ```go
  // Bad: Costs ~2KB stack + scheduler overhead just to wait
  go func() {
      <-ctx.Done()
      conn.Close()
  }()
  ```

### Concurrency
- **Do** use structured concurrency (`errgroup`).
  ```go
  // Good: Coordinates goroutines, propagates first error, cancels on failure
  g, gCtx := errgroup.WithContext(ctx)
  g.Go(func() error {
      return processPart1(gCtx)
  })
  g.Go(func() error {
      return processPart2(gCtx)
  })
  if err := g.Wait(); err != nil {
      return fmt.Errorf("pipeline failed: %w", err)
  }
  ```
- **Don't** leave "fire-and-forget" goroutines running.
  ```go
  // Bad: No way to stop it, no way to know if it panicked
  go func() {
      processForever()
  }()
  ```

### Errors
- **Do** return context errors.
  ```go
  // Good: Propagate why the operation was stopped (Canceled or DeadlineExceeded)
  if ctx.Err() != nil {
      return ctx.Err()
  }
  ```
- **Don't** swallow errors in concurrent workers.
  ```go
  // Bad: Failures are silent, making debugging impossible
  go func() {
      if err := doWork(); err != nil {
          // ignoring error...
      }
  }()
  ```

## Further Reading
-   [Go Wiki: Rangefunc Experiment](https://go.dev/wiki/RangefuncExperiment)
-   [Go Concurrency Patterns: Pipelines and cancellation](https://go.dev/blog/pipelines)
-   [Package context documentation](https://pkg.go.dev/context)
