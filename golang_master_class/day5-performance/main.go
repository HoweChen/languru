package main

import (
	"day5/optimization"
	"day5/profiling"
	"log/slog"
	"os"
	"time"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	slog.Info("Day 5: Performance Tuning (Pprof, Trace, GOGC) 开始")

	// 1. Pprof 与 GOGC 调优
	// 注意：pprof 需要长时间运行的程序来采样，这里我们演示开启和关键概念
	go func() {
		slog.Info("=== 1. Pprof Server 启动 ===")
		profiling.StartPprofServer()
	}()

	// 2. 内存优化技巧 (sync.Pool, 预分配)
	slog.Info("=== 2. 内存优化技巧 ===")
	optimization.RunBenchmarks()

	// 模拟程序运行，以便可以访问 pprof (如果用户想看的话)
	// 实际教学中可以指导用户访问 http://localhost:6060/debug/pprof/
	slog.Info("程序将持续运行 5 秒以供观察...")
	time.Sleep(5 * time.Second)
	slog.Info("Day 5 学习结束")
}
