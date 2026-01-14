package generics

import (
	"cmp"
	"fmt"
	"log/slog"
	"sync"
)

// RunDemo demonstrates advanced Generic patterns in Go 1.18+.
func RunDemo() {
	slog.Info("=== 1. Generic Data Structure: Set ===")
	s := NewSet(1, 2, 3)
	s.Add(4)
	slog.Info("Set contains 2?", "val", s.Contains(2))
	slog.Info("Set contains 5?", "val", s.Contains(5))
	slog.Info("Set elements", "all", s.Values())

	slog.Info("=== 2. Generic Algorithms: Max & Min ===")
	// Works with int
	maxInt := Max(10, 5, 20)
	// Works with string
	maxStr := Max("apple", "orange", "banana")
	slog.Info("Max results", "int", maxInt, "str", maxStr)

	slog.Info("=== 3. Generic Functional Patterns: Option & Map ===")
	opt := Some(42)
	if v, ok := opt.Unwrap(); ok {
		slog.Info("Option has value", "val", v)
	}

	// Transform a slice of ints to strings
	ints := []int{1, 2, 3}
	strs := Map(ints, func(i int) string {
		return fmt.Sprintf("val-%d", i)
	})
	slog.Info("Mapped slice", "result", strs)

	slog.Info("=== 4. Generic Thread-Safe Cache ===")
	cache := NewCache[string, int]()
	cache.Set("foo", 100)
	if val, found := cache.Get("foo"); found {
		slog.Info("Cache hit", "key", "foo", "val", val)
	}
}

// ---------------------------------------------------------
// 1. Generic Data Structures
// ---------------------------------------------------------

// Set is a generic set implementation based on a map.
// Constraint 'comparable' allows types that support == and !=.
type Set[T comparable] struct {
	data map[T]struct{}
}

func NewSet[T comparable](vals ...T) *Set[T] {
	s := &Set[T]{data: make(map[T]struct{})}
	for _, v := range vals {
		s.Add(v)
	}
	return s
}

func (s *Set[T]) Add(val T) {
	s.data[val] = struct{}{}
}

func (s *Set[T]) Remove(val T) {
	delete(s.data, val)
}

func (s *Set[T]) Contains(val T) bool {
	_, ok := s.data[val]
	return ok
}

func (s *Set[T]) Values() []T {
	out := make([]T, 0, len(s.data))
	for k := range s.data {
		out = append(out, k)
	}
	return out
}

// ---------------------------------------------------------
// 2. Generic Algorithms
// ---------------------------------------------------------

// Max returns the maximum value among arguments.
// Constraint 'cmp.Ordered' (Go 1.21+) includes ints, floats, and strings (supports <, >).
func Max[T cmp.Ordered](a T, b ...T) T {
	maxVal := a
	for _, v := range b {
		if v > maxVal {
			maxVal = v
		}
	}
	return maxVal
}

// Map transforms a slice of type T into a slice of type R using a transform function.
// This is a classic functional programming pattern made possible by generics.
func Map[T, R any](input []T, transform func(T) R) []R {
	result := make([]R, len(input))
	for i, v := range input {
		result[i] = transform(v)
	}
	return result
}

// ---------------------------------------------------------
// 3. Generic Functional Monads (Option)
// ---------------------------------------------------------

// Option represents an optional value, safer than nil pointers.
type Option[T any] struct {
	value *T
}

func Some[T any](v T) Option[T] {
	return Option[T]{value: &v}
}

func None[T any]() Option[T] {
	return Option[T]{value: nil}
}

func (o Option[T]) Unwrap() (T, bool) {
	if o.value == nil {
		var zero T
		return zero, false
	}
	return *o.value, true
}

// ---------------------------------------------------------
// 4. Generic Thread-Safe Structures
// ---------------------------------------------------------

// Cache is a thread-safe generic map.
type Cache[K comparable, V any] struct {
	mu   sync.RWMutex
	data map[K]V
}

func NewCache[K comparable, V any]() *Cache[K, V] {
	return &Cache[K, V]{
		data: make(map[K]V),
	}
}

func (c *Cache[K, V]) Set(key K, val V) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.data[key] = val
}

func (c *Cache[K, V]) Get(key K) (V, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	val, ok := c.data[key]
	return val, ok
}
