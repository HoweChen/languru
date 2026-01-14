package main

import (
	"context"
	"day1/concurrency"
	"day1/iterators"
	"log/slog"
	"os"
	"time"
)

func main() {
	// 设置结构化日志 (Go 1.21+)
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	slog.Info("Day 1: Modern Foundations & Concurrency 开始")

	// 1. Go 1.23+ 迭代器模式 (Iterators)
	slog.Info("=== 1. 深入理解 Iterators (Go 1.23+) ===")
	iterators.RunDemo()

	// 2. 高级并发与 Context (Context AfterFunc, ErrGroup)
	slog.Info("=== 2. 高级并发模式 ===")
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	concurrency.RunAdvancedPatterns(ctx)

	slog.Info("Day 1 学习结束")
}
