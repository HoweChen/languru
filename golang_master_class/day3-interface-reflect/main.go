package main

import (
	"day3/di"
	"day3/reflection"
	"log/slog"
	"os"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	slog.Info("Day 3: Interface Magic, Reflection & Dependency Injection 开始")

	// 1. 反射的高级应用 (JSON 序列化模拟)
	slog.Info("=== 1. 反射 (Reflection) 实战: 验证器 ===")
	reflection.RunDemo()

	slog.Info("=== 1.2 反射 (Reflection) 实战: Mini-ORM ===")
	reflection.RunORMDemo()

	// 2. 依赖注入 (Wire 风格的手动 DI 模式)
	slog.Info("=== 2. 依赖注入 (DI) 模式 ===")
	di.RunDemo()

	slog.Info("Day 3 学习结束")
}
