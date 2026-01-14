package iterators

import (
	"fmt"
	"iter"
	"log/slog"
	"slices"
)

// RunDemo demonstrates advanced usage of Go 1.23+ iterators.
// It covers basic sequence generation, transformation adapters (Filter/Map),
// combination adapters (Zip), and a real-world pagination simulation.
func RunDemo() {
	slog.Info("=== 1. Basic Generator: Fibonacci Sequence ===")
	// Iterate using standard range loop (Push mode)
	for val := range Fibonacci(10) {
		fmt.Printf("%d ", val)
	}
	fmt.Println()

	slog.Info("=== 2. Composition: Filter + Map Chaining ===")
	nums := []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}

	// 1. Create iterator from slice
	// 2. Filter even numbers
	// 3. Map to string format
	// 4. Iterate result
	seq := Map(
		Filter(slices.Values(nums), func(i int) bool { return i%2 == 0 }),
		func(i int) string { return fmt.Sprintf("<%d>", i*i) },
	)

	for s := range seq {
		fmt.Printf("%s ", s)
	}
	fmt.Println()

	slog.Info("=== 3. Pull Mode: Zipping Sequences ===")
	// Zip requires Pull mode to control multiple iterators simultaneously
	seq1 := slices.Values([]string{"A", "B", "C", "D"})
	seq2 := Fibonacci(100) // Infinite/large sequence

	for pair := range Zip(seq1, seq2) {
		fmt.Printf("%v ", pair)
	}
	fmt.Println()

	slog.Info("=== 4. Real-world: Stream Pagination from DB ===")
	// Simulates paginated DB access exposed as a continuous stream.
	// The caller sees a unified stream, unaware of underlying pagination.
	users := StreamUsersFromDB(3) // page size = 3
	for u := range users {
		fmt.Printf("[User ID:%d Name:%s] ", u.ID, u.Name)
	}
	fmt.Println()
}

// ---------------------------------------------------------
// Basic Generators
// ---------------------------------------------------------

// Fibonacci returns an iterator that generates Fibonacci numbers up to a limit.
// iter.Seq[int] is effectively func(yield func(int) bool).
func Fibonacci(limit int) iter.Seq[int] {
	return func(yield func(int) bool) {
		a, b := 0, 1
		for a <= limit {
			// CRITICAL: We must check the return value of yield.
			// If yield returns false, the caller (loop) wants to stop.
			// We must return immediately to cleanup and exit.
			if !yield(a) {
				return
			}
			a, b = b, a+b
		}
	}
}

// ---------------------------------------------------------
// Adapters (like itertools or Stream API)
// ---------------------------------------------------------

// Filter generic adapter: keeps only elements where keep() returns true.
func Filter[V any](seq iter.Seq[V], keep func(V) bool) iter.Seq[V] {
	return func(yield func(V) bool) {
		for v := range seq {
			if keep(v) {
				if !yield(v) {
					return
				}
			}
		}
	}
}

// Map generic adapter: transforms type V to type T.
func Map[V, T any](seq iter.Seq[V], transform func(V) T) iter.Seq[T] {
	return func(yield func(T) bool) {
		for v := range seq {
			if !yield(transform(v)) {
				return
			}
		}
	}
}

// Pair holds two values, used for Zip results.
type Pair[K, V any] struct {
	First  K
	Second V
}

// Zip combines two sequences into a sequence of Pairs.
// Terminates when either sequence ends.
// Uses iter.Pull because we need to advance two iterators in lock-step.
func Zip[K, V any](seqK iter.Seq[K], seqV iter.Seq[V]) iter.Seq[Pair[K, V]] {
	return func(yield func(Pair[K, V]) bool) {
		// Initialize Pull iterators
		nextK, stopK := iter.Pull(seqK)
		defer stopK() // Ensure resources are released

		nextV, stopV := iter.Pull(seqV)
		defer stopV()

		for {
			// Pull from both
			k, okK := nextK()
			v, okV := nextV()

			// If either ends, stop
			if !okK || !okV {
				return
			}

			// Yield the pair
			if !yield(Pair[K, V]{First: k, Second: v}) {
				return
			}
		}
	}
}

// ---------------------------------------------------------
// Real-world Simulation
// ---------------------------------------------------------

type User struct {
	ID   int
	Name string
}

// StreamUsersFromDB simulates fetching data page-by-page from a DB,
// but exposing it as a seamless iterator stream.
// Ideal for batch processing to keep memory usage low.
func StreamUsersFromDB(pageSize int) iter.Seq[User] {
	return func(yield func(User) bool) {
		page := 1
		for {
			slog.Debug("DB Query", "page", page)
			// Simulate DB query
			users := fetchPage(page, pageSize)

			if len(users) == 0 {
				return // No more data
			}

			for _, u := range users {
				if !yield(u) {
					return // Caller stopped
				}
			}
			page++
		}
	}
}

// Mock DB function
func fetchPage(page, size int) []User {
	// Total 10 records
	allUsers := []User{
		{1, "Alice"}, {2, "Bob"}, {3, "Charlie"},
		{4, "Dave"}, {5, "Eve"}, {6, "Frank"},
		{7, "Grace"}, {8, "Heidi"}, {9, "Ivan"},
		{10, "Judy"},
	}

	start := (page - 1) * size
	if start >= len(allUsers) {
		return nil
	}
	end := start + size
	if end > len(allUsers) {
		end = len(allUsers)
	}
	return allUsers[start:end]
}
