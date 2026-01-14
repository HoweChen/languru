package locking

import (
	"context"
	"fmt"
	"log/slog"
	"math/rand"
	"sync"
	"time"
)

// RunLockDemo simulates a "Thundering Herd" problem and solves it with Distributed Locking.
// Since we don't have Redis/Etcd here, we mock the lock server.
func RunLockDemo() {
	slog.Info("--- 1. Thundering Herd (No Lock) ---")
	simulateThunderingHerd()

	fmt.Println()
	slog.Info("--- 2. Distributed Lock Simulation ---")
	simulateDistributedLock()
}

// simulateThunderingHerd shows what happens when 10 workers try to rebuild a cache simultaneously.
func simulateThunderingHerd() {
	var wg sync.WaitGroup
	for i := 0; i < 5; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			// Everyone hits the database at the exact same time
			expensiveDBCall(id)
		}(i)
	}
	wg.Wait()
}

// simulateDistributedLock shows how only ONE worker rebuilds the cache, others wait.
func simulateDistributedLock() {
	locker := NewMockRedisLocker()
	var wg sync.WaitGroup

	for i := 0; i < 5; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()

			// Try to acquire lock
			ctx := context.Background()
			lockKey := "cache_rebuild_lock"

			if locker.TryLock(ctx, lockKey, id) {
				slog.Info("Worker Acquired Lock", "id", id)
				// Critical Section: Rebuild Cache
				expensiveDBCall(id)
				locker.Unlock(ctx, lockKey)
			} else {
				slog.Info("Worker Skipped (Lock held by other)", "id", id)
			}
		}(i)
	}
	wg.Wait()
}

func expensiveDBCall(id int) {
	time.Sleep(100 * time.Millisecond) // Simulate DB latency
	slog.Info("DB Query Executed", "worker_id", id)
}

// MockRedisLocker simulates a remote locking service (like Redis SETNX).
type MockRedisLocker struct {
	mu    sync.Mutex
	locks map[string]int
}

func NewMockRedisLocker() *MockRedisLocker {
	return &MockRedisLocker{
		locks: make(map[string]int),
	}
}

// TryLock returns true if lock is acquired (SETNX success).
func (m *MockRedisLocker) TryLock(ctx context.Context, key string, ownerID int) bool {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Simulate network latency
	time.Sleep(time.Duration(rand.Intn(10)) * time.Millisecond)

	if _, exists := m.locks[key]; exists {
		return false // Lock already held
	}

	m.locks[key] = ownerID
	return true
}

// Unlock releases the lock.
func (m *MockRedisLocker) Unlock(ctx context.Context, key string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.locks, key)
}
