package main

import (
	"day2/escape"
	"day2/generics"
	"log/slog"
	"os"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	slog.Info("Day 2: Memory Model, Generics & Escape Analysis 开始")

	// 1. 逃逸分析深入
	slog.Info("=== 1. 逃逸分析 (Escape Analysis) ===")
	// 我们不会直接运行逃逸分析的“结果”，而是通过代码演示触发逃逸的场景
	// 并建议用户使用 go build -gcflags="-m -l" 查看
	escape.RunDemo()

	// 2. 泛型实战
	slog.Info("=== 2. 泛型 (Generics) 高级模式 ===")
	generics.RunDemo()

	slog.Info("Day 2 学习结束")
}
