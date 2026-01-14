package main

import (
	"day4/grpc_demo"
	"day4/http_demo"
	"log/slog"
	"os"
	"time"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	slog.Info("Day 4: Network Programming, HTTP/1.22+ Routing & RPC 开始")

	// 1. Go 1.22+ 标准库 HTTP 路由
	// 由于这会阻塞主 goroutine，我们放在 goroutine 中运行
	go func() {
		slog.Info("=== 1. 启动 HTTP Server (Go 1.22+ New Mux) ===")
		if err := http_demo.StartServer(":8080"); err != nil {
			slog.Error("HTTP Server Error", "err", err)
		}
	}()

	// 等待一会确保 HTTP server 启动
	time.Sleep(500 * time.Millisecond)

	// 2. gRPC 概念验证 (模拟调用)
	// 完整的 gRPC 需要 protoc 编译，为了教学简便，这里展示服务端拦截器和核心概念
	slog.Info("=== 2. gRPC 拦截器与核心模式 ===")
	grpc_demo.RunInterceptorDemo()

	// 阻塞以保持服务运行一段时间用于演示
	slog.Info("Server 运行中... 按 Ctrl+C 停止 (本演示 3秒后自动结束)")
	time.Sleep(3 * time.Second)
}
