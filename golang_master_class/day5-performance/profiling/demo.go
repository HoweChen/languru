package profiling

import (
	"log/slog"
	"math/rand"
	"net/http"
	_ "net/http/pprof"
	"runtime"
	"time"
)

// StartPprofServer starts a pprof server and runs simulation workloads.
// Access pprof at http://localhost:6060/debug/pprof/
func StartPprofServer() {
	go func() {
		slog.Info("Starting Pprof Server on :6060")
		if err := http.ListenAndServe(":6060", nil); err != nil {
			slog.Error("Pprof server failed", "err", err)
		}
	}()

	// Launch background workloads to generate profile data
	go cpuIntensiveTask()
	go memoryIntensiveTask()

	// Block forever (or until main terminates)
	select {}
}

// cpuIntensiveTask burns CPU cycles (for CPU profiling).
func cpuIntensiveTask() {
	slog.Info("Starting CPU intensive task")
	for {
		// Calculate Fibonacci numbers inefficiently
		fib(30)
		time.Sleep(100 * time.Millisecond)
	}
}

func fib(n int) int {
	if n <= 1 {
		return n
	}
	return fib(n-1) + fib(n-2)
}

// memoryIntensiveTask allocates memory periodically (for Heap profiling).
func memoryIntensiveTask() {
	slog.Info("Starting Memory intensive task")
	// Keep references to prevent GC from collecting everything immediately
	var cache [][]byte

	for {
		// Allocate 1MB chunk
		chunk := make([]byte, 1024*1024)
		// Fill with random data to ensure it's actually allocated
		rand.Read(chunk)

		cache = append(cache, chunk)

		// Clear cache periodically to prevent OOM
		if len(cache) > 50 {
			cache = nil
			runtime.GC() // Force GC for demonstration
		}

		time.Sleep(200 * time.Millisecond)
	}
}
