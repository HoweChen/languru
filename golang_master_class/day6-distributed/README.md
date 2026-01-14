# Day 6: Distributed Systems Primitives

## Introduction
Day 6 focuses on building resilient distributed systems. We move beyond single-process concurrency to patterns that survive network failures and massive concurrency spikes ("Thundering Herd").

We cover:
1.  **Circuit Breaker**: Preventing cascading failures when a downstream service is down.
2.  **Distributed Locking**: Coordinating access to shared resources across multiple instances (simulated).

## Core Concepts

### 1. Circuit Breaker Pattern
-   **State Machine**:
    -   **Closed**: Normal operation. Requests flow through.
    -   **Open**: Service is down. Fail fast without calling the remote service.
    -   **Half-Open**: Test the waters. Allow one request to check if the service recovered.
-   **Why it matters**: Protects your system from hanging threads and resource exhaustion when dependencies fail.

### 2. Thundering Herd & Distributed Locks
-   **Thundering Herd Problem**: When a cache key expires, thousands of requests might hit the database simultaneously to rebuild it.
-   **Solution**: Distributed Lock (Mutex). Only ONE worker rebuilds the cache; others wait or return stale data.
-   **Implementation**: Typically uses Redis (`SETNX`) or Etcd.

## Code Walkthrough

### `circuitbreaker/demo.go`
-   **`CircuitBreaker` struct**: Manages state (Closed/Open/HalfOpen) and failure counts.
-   **`Execute`**: The main wrapper. It checks the state before calling the function.
-   **`RunDemo`**: Simulates a flaky service (60% failure rate) to demonstrate the breaker opening and eventually recovering.

### `locking/demo.go`
-   **`simulateThunderingHerd`**: Shows 5 workers hitting the "DB" at once (Bad).
-   **`simulateDistributedLock`**: Shows 5 workers trying to acquire a lock. Only one succeeds (Good).
-   **`MockRedisLocker`**: A simple in-memory simulation of a Redis lock.

## Dos and Don'ts

### Resilience
- **Do** use Circuit Breakers for *all* external dependencies (DB, API, Queue).
  ```go
  // Good: Wrap external calls with a breaker
  result, err := cb.Execute(func() (any, error) {
      return apiClient.GetData()
  })
  ```
- **Don't** set infinite timeouts. Always use `context.WithTimeout`.
  ```go
  // Bad: Can hang forever
  http.Get("http://slow-service.com")

  // Good: Bound the wait time
  ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
  defer cancel()
  req, _ := http.NewRequestWithContext(ctx, "GET", url, nil)
  ```

### Locking
- **Do** set a TTL on distributed locks to prevent deadlocks if the holder crashes.
  ```go
  // Good: Lock expires automatically after 10s
  lockKey := "resource_id"
  ok := redis.SetNX(ctx, lockKey, "worker_1", 10*time.Second).Val()
  ```
- **Don't** use distributed locks for high-frequency operations (too slow).

### Recovery
- **Do** use Exponential Backoff when retrying.
  ```go
  // Good: Wait 1s, 2s, 4s...
  backoff := 1 * time.Second
  for i := 0; i < 3; i++ {
      if err := tryOp(); err == nil { break }
      time.Sleep(backoff)
      backoff *= 2
  }
  ```
- **Don't** retry immediately in a tight loop (creates a DDoS attack).

## Further Reading
-   [Microsoft Azure: Circuit Breaker Pattern](https://learn.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker)
-   [Redis Distributed Lock (Redlock)](https://redis.io/docs/manual/patterns/distributed-locks/)
-   [Sony GoBreaker (Production Ready Library)](https://github.com/sony/gobreaker)
