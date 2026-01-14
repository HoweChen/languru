# Day 5: Performance Engineering

## Introduction
Day 5 is all about writing efficient Go code. Go is fast by default, but understanding how to measure and optimize that performance is what separates intermediate developers from experts.

We cover:
1.  **Optimization Techniques**: Practical patterns to reduce allocations and memory usage.
2.  **Profiling (pprof)**: The standard tool for identifying bottlenecks (CPU, Memory, Goroutines).

## Core Concepts

### 1. Memory Optimization
-   **Struct Alignment**: Reordering struct fields to minimize padding can save significant memory (e.g., placing `int64` before `bool`).
-   **Pre-allocation**: Always use `make([]T, 0, capacity)` when the size is known. Avoids costly re-allocations during `append`.
-   **String Concatenation**: Use `strings.Builder` instead of `+` inside loops to avoid O(N²) allocation behavior.
-   **sync.Pool**: Reuse heavy objects (like buffers) to relieve pressure on the Garbage Collector (GC).

### 2. Profiling (`net/http/pprof`)
-   **CPU Profile**: Where is the application spending its time?
-   **Heap Profile**: Where is memory being allocated? (in-use vs allocated)
-   **Goroutine Profile**: Are there leaked goroutines?
-   **Trace**: Visual timeline of goroutine scheduling and GC events.

## Code Walkthrough

### `optimization/demo.go`
-   **`demoStructAlignment`**: Compares `BadStruct` (wasted padding) vs `GoodStruct` (optimized layout).
-   **`demoStringConcat`**: Benchmarks `+` vs `strings.Builder`.
-   **`demoSlicePrealloc`**: Benchmarks `append` vs `make` with capacity.
-   **`demoSyncPool`**: Shows how to recycle `bytes.Buffer` to reduce allocations.

### `profiling/demo.go`
-   **`StartPprofServer`**: Launches a dedicated HTTP server on `:6060` for profiling tools.
-   **`cpuIntensiveTask`**: Calculates Fibonacci numbers recursively to simulate high CPU load.
-   **`memoryIntensiveTask`**: Allocates 1MB chunks periodically to simulate memory churn.

## How to Profile (The Lab)

1.  **Start the Server**:
    ```bash
    go run main.go
    # (Ensure the main.go in day5 calls profiling.StartPprofServer)
    ```

2.  **Run CPU Profiling**:
    ```bash
    # Collect 10 seconds of CPU samples
    go tool pprof http://localhost:6060/debug/pprof/profile?seconds=10
    
    # Inside pprof interactive shell:
    (pprof) top      # See top CPU consumers
    (pprof) web      # Open visualization in browser (requires graphviz)
    ```

3.  **Run Heap Profiling**:
    ```bash
    go tool pprof http://localhost:6060/debug/pprof/heap
    
    (pprof) top
    (pprof) list memoryIntensiveTask  # See line-by-line allocation
    ```

## Dos and Don'ts

### Allocations
- **Do** pre-allocate slices/maps when size is known.
  ```go
  // Good: Single allocation, no resizing overhead
  data := make([]int, 0, 1000)
  for i := 0; i < 1000; i++ {
      data = append(data, i)
  }
  ```
- **Don't** optimize prematurely. Measure first!

### Structs
- **Do** order fields from largest (64-bit) to smallest (bool).
  ```go
  // Good: 24 bytes (on 64-bit machine)
  type Optimized struct {
      A int64   // 8 bytes
      B *string // 8 bytes
      C bool    // 1 byte (+7 padding)
  }

  // Bad: 32 bytes (extra padding between A and B)
  type Wasteful struct {
      C bool    // 1 byte (+7 padding)
      A int64   // 8 bytes
      B *string // 8 bytes
  }
  ```
- **Don't** manually pad structs unless you know exactly why (cache lines).

### Profiling
- **Do** run pprof in production (it's low overhead, < 5%).
  ```go
  import _ "net/http/pprof"

  func main() {
      // Expose pprof on localhost only or behind auth
      go func() {
          log.Println(http.ListenAndServe("localhost:6060", nil))
      }()
      // ... app logic
  }
  ```
- **Don't** leave `debug/pprof` exposed to the public internet.

### Strings
- **Do** use `strings.Builder` for loops.
  ```go
  // Good: O(N) allocation
  var sb strings.Builder
  for i := 0; i < 1000; i++ {
      sb.WriteString("data")
  }
  result := sb.String()
  ```
- **Don't** use `fmt.Sprintf` for simple concatenations (it's slow).
  ```go
  // Bad: Reflection overhead for simple tasks
  s := fmt.Sprintf("%s%s", "a", "b")

  // Good: Simple +
  s := "a" + "b"
  ```

## Further Reading
-   [Go Profiling Guide (Official)](https://go.dev/doc/diagnostics)
-   [High Performance Go Workshop (Dave Cheney)](https://dave.cheney.net/high-performance-go-workshop/gophercon-2019.html)
