package main

import (
	"day6/circuitbreaker"
	"day6/locking"
	"log/slog"
	"os"
)

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	slog.Info("Day 6: Distributed System Primitives")

	// 1. Circuit Breaker Demo
	slog.Info("=== 1. Circuit Breaker Pattern ===")
	circuitbreaker.RunDemo()

	// 2. Distributed Locking Demo
	slog.Info("\n=== 2. Distributed Locking (Thundering Herd) ===")
	locking.RunLockDemo()

	slog.Info("Day 6 Completed")
}
