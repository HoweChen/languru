package escape

import "log/slog"

// RunDemo demonstrates common escape analysis scenarios.
// Run with: go build -gcflags="-m -l" to see compiler decisions.
func RunDemo() {
	slog.Info("=== Escape Analysis: Stack vs Heap ===")

	// Scenario 1: No Escape (Stack Allocation)
	// 'x' is a simple value type used only within this function scope.
	// Compiler can safely allocate it on the Stack.
	x := 42
	_ = x

	// Scenario 2: Pointer Escape (Heap Allocation)
	// NewInt returns a pointer to a local variable.
	// For that data to survive after NewInt returns, it MUST be moved to the Heap.
	ptr := NewInt()
	slog.Info("Pointer value", "val", *ptr)

	// Scenario 3: Interface Escape (Heap Allocation)
	// When passing a concrete value to a function accepting 'interface{}' (or 'any'),
	// the runtime often constructs an interface wrapper on the Heap.
	// Modern Go compilers optimize some cases, but generally assume escape.
	y := 100
	slog.Info("Interface escape", "val", y)

	// Scenario 4: Closure Capture Escape
	// The variable 'counter' is captured by the closure.
	// Since the closure survives the function call, 'counter' must also survive -> Heap.
	f := closureEscape()
	slog.Info("Closure result", "res", f()) // prints 1
	slog.Info("Closure result", "res", f()) // prints 2

	// Scenario 5: Slice/Map Escape
	// Large slices or slices with unknown size at compile time often escape.
	// Pointers stored in slices/maps also often escape.
	s := makeSlice()
	slog.Info("Slice size", "len", len(s))
}

// NewInt returns a pointer to a local variable.
// Analysis: "&a escapes to heap"
func NewInt() *int {
	a := 10
	return &a
}

// closureEscape returns a function that modifies a local variable.
// Analysis: "moved to heap: x", "func literal escapes to heap"
func closureEscape() func() int {
	x := 0
	return func() int {
		x++
		return x
	}
}

// makeSlice returns a slice.
// If the slice was very large (e.g., 64KB+), the backing array would escape.
// Since we return it, the backing array escapes.
func makeSlice() []int {
	s := make([]int, 0, 10)
	s = append(s, 1)
	return s
}

// NoEscapePointer demonstrates a case where passing a pointer DOES NOT cause escape.
// This is common in "read-only" functions or functions that don't store the pointer.
// Go compiler is smart enough to see 'val' is never stored globally or returned.
func NoEscapePointer(val *int) int {
	return *val + 1
}
