package optimization

import (
	"bytes"
	"fmt"
	"log/slog"
	"runtime"
	"strings"
	"sync"
	"time"
	"unsafe"
)

// RunBenchmarks demonstrates various Go optimization techniques.
func RunBenchmarks() {
	fmt.Println("=== 1. Memory Pool (sync.Pool) ===")
	demoSyncPool()

	fmt.Println("\n=== 2. Slice Pre-allocation ===")
	demoSlicePrealloc()

	fmt.Println("\n=== 3. Struct Memory Layout ===")
	demoStructAlignment()

	fmt.Println("\n=== 4. String Concatenation ===")
	demoStringConcat()
}

func demoSyncPool() {
	slog.Info("Comparing: Standard Allocation vs sync.Pool")

	// 1. Standard Allocation
	start := time.Now()
	for i := 0; i < 10000; i++ {
		var b bytes.Buffer
		b.WriteString("hello world")
		_ = b.String()
	}
	slog.Info("Standard Allocation", "duration", time.Since(start))

	// 2. sync.Pool
	pool := sync.Pool{
		New: func() interface{} {
			return new(bytes.Buffer)
		},
	}

	start = time.Now()
	for i := 0; i < 10000; i++ {
		b := pool.Get().(*bytes.Buffer)
		b.Reset() // Important: Reset state before reuse
		b.WriteString("hello world")
		_ = b.String()
		pool.Put(b)
	}
	slog.Info("sync.Pool", "duration", time.Since(start))
}

func demoSlicePrealloc() {
	const N = 100000

	// 1. Dynamic Growth (Append)
	start := time.Now()
	var s1 []int
	for i := 0; i < N; i++ {
		s1 = append(s1, i)
	}
	slog.Info("Slice Append (Dynamic)", "duration", time.Since(start))

	// 2. Pre-allocation (Cap)
	start = time.Now()
	s2 := make([]int, 0, N)
	for i := 0; i < N; i++ {
		s2 = append(s2, i)
	}
	slog.Info("Slice Append (Pre-alloc)", "duration", time.Since(start))
}

// BadStruct has poor field ordering, causing padding waste.
type BadStruct struct {
	Flag    bool    // 1 byte
	Counter int64   // 8 bytes (needs 8-byte alignment) -> 7 bytes padding after Flag
	Small   int8    // 1 byte
	Value   float64 // 8 bytes (needs 8-byte alignment) -> 7 bytes padding after Small
}

// GoodStruct reorders fields to minimize padding.
type GoodStruct struct {
	Counter int64   // 8 bytes
	Value   float64 // 8 bytes
	Flag    bool    // 1 byte
	Small   int8    // 1 byte
	// Total padding: 6 bytes at the end to align to 8-byte boundary
}

func demoStructAlignment() {
	bad := BadStruct{}
	good := GoodStruct{}

	fmt.Printf("BadStruct size: %d bytes\n", unsafe.Sizeof(bad))
	fmt.Printf("GoodStruct size: %d bytes\n", unsafe.Sizeof(good))
	fmt.Printf("Memory saved per instance: %d bytes\n", unsafe.Sizeof(bad)-unsafe.Sizeof(good))
}

func demoStringConcat() {
	n := 1000

	// 1. Bad: Using + operator in a loop
	startBad := runtime.MemStats{}
	runtime.ReadMemStats(&startBad)

	var s string
	for i := 0; i < n; i++ {
		s += "x"
	}

	endBad := runtime.MemStats{}
	runtime.ReadMemStats(&endBad)
	fmt.Printf("Bad Concat ('+') Alloc: %d bytes\n", endBad.TotalAlloc-startBad.TotalAlloc)

	// 2. Good: Using strings.Builder
	startGood := runtime.MemStats{}
	runtime.ReadMemStats(&startGood)

	var sb strings.Builder
	sb.Grow(n) // Optimization: Pre-allocate
	for i := 0; i < n; i++ {
		sb.WriteString("x")
	}
	_ = sb.String()

	endGood := runtime.MemStats{}
	runtime.ReadMemStats(&endGood)
	fmt.Printf("Good Concat (Builder) Alloc: %d bytes\n", endGood.TotalAlloc-startGood.TotalAlloc)
}
