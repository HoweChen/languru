package main

import (
	"day7/unsafe_demo"
	"log/slog"
	"os"
)

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	slog.Info("Day 7: Unsafe & Architecture Patterns")

	// 1. Unsafe Operations
	slog.Info("=== 1. Unsafe Pointer Magic ===")
	unsafe_demo.RunDemo()

	// 2. Architecture & Summary
	slog.Info("\n=== 2. Course Conclusion ===")
	slog.Info("For Clean Architecture examples, review the 'DI' section in Day 3.")
	slog.Info("Remember: Premature optimization is the root of all evil.")
	slog.Info("Congratulations on completing the Go Master Class!")
}
