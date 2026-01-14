package grpc_demo

import (
	"context"
	"log/slog"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
)

// RunInterceptorDemo demonstrates gRPC Server Interceptors logic.
// We simulate the gRPC handler flow without requiring .proto compilation for this demo.
func RunInterceptorDemo() {
	// 1. Define the actual Business Logic (Handler)
	mockHandler := func(ctx context.Context, req interface{}) (interface{}, error) {
		slog.Info("Executing Core Business Logic", "req", req)
		// Simulate processing time
		time.Sleep(50 * time.Millisecond)
		return "rpc_response_payload", nil
	}

	// 2. Build the Interceptor Chain
	// Order: Logging -> Auth -> Recovery -> Handler
	// Execution:
	//   Logging START
	//     Auth START (Check Token)
	//       Recovery START
	//         Handler (Business Logic)
	//       Recovery END
	//     Auth END
	//   Logging END (Measure Time)
	chain := ChainUnaryServer(
		LoggingInterceptor,
		AuthInterceptor,
		RecoveryInterceptor,
	)

	// 3. Wrap the handler
	finalHandler := chain(mockHandler)

	// 4. Simulate a Valid Request
	slog.Info("--- Case 1: Valid Request ---")
	ctxValid := metadata.NewIncomingContext(context.Background(), metadata.Pairs("token", "valid-token"))
	resp, err := finalHandler(ctxValid, "request_1")
	if err != nil {
		slog.Error("RPC Failed", "err", err)
	} else {
		slog.Info("RPC Success", "resp", resp)
	}

	// 5. Simulate an Invalid Request (Auth Failure)
	slog.Info("--- Case 2: Invalid Token ---")
	ctxInvalid := metadata.NewIncomingContext(context.Background(), metadata.Pairs("token", "bad-token"))
	_, err = finalHandler(ctxInvalid, "request_2")
	if err != nil {
		// Expected error
		slog.Error("RPC Failed (Expected)", "err", err)
	}

	// 6. Simulate Panic (Recovery)
	slog.Info("--- Case 3: Handler Panic ---")
	panicHandler := func(ctx context.Context, req interface{}) (interface{}, error) {
		panic("something went terribly wrong")
	}
	// Wrap the panic handler with our chain
	safeHandler := chain(panicHandler)
	_, err = safeHandler(ctxValid, "request_3")
	if err != nil {
		slog.Error("RPC Failed (Recovered)", "err", err)
	}
}

// Interceptor Type Definition (matches grpc.UnaryServerInterceptor)
type UnaryServerInterceptor func(ctx context.Context, req interface{}, handler grpc.UnaryHandler) (interface{}, error)

// LoggingInterceptor records RPC duration and status.
func LoggingInterceptor(ctx context.Context, req interface{}, handler grpc.UnaryHandler) (interface{}, error) {
	start := time.Now()
	slog.Info("[Middleware] Logging: Start", "req", req)

	// Call the next handler
	resp, err := handler(ctx, req)

	duration := time.Since(start)
	slog.Info("[Middleware] Logging: End", "duration", duration, "success", err == nil)
	return resp, err
}

// AuthInterceptor validates the token in metadata.
func AuthInterceptor(ctx context.Context, req interface{}, handler grpc.UnaryHandler) (interface{}, error) {
	slog.Info("[Middleware] Auth: Checking credentials")

	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return nil, status.Error(codes.Unauthenticated, "missing metadata")
	}

	tokens := md.Get("token")
	if len(tokens) == 0 || tokens[0] != "valid-token" {
		slog.Warn("[Middleware] Auth: Invalid token")
		return nil, status.Error(codes.Unauthenticated, "invalid token")
	}

	return handler(ctx, req)
}

// RecoveryInterceptor recovers from panics in the handler.
func RecoveryInterceptor(ctx context.Context, req interface{}, handler grpc.UnaryHandler) (resp interface{}, err error) {
	defer func() {
		if r := recover(); r != nil {
			slog.Error("[Middleware] Recovery: Panic recovered", "panic", r)
			err = status.Errorf(codes.Internal, "internal server error: %v", r)
		}
	}()

	return handler(ctx, req)
}

// ChainUnaryServer constructs a single handler from a chain of interceptors.
// This works exactly like grpc.ChainUnaryInterceptor.
func ChainUnaryServer(interceptors ...UnaryServerInterceptor) func(grpc.UnaryHandler) grpc.UnaryHandler {
	return func(finalHandler grpc.UnaryHandler) grpc.UnaryHandler {
		chain := finalHandler
		// Iterate backwards to wrap: last wraps final, second-last wraps last...
		for i := len(interceptors) - 1; i >= 0; i-- {
			interceptor := interceptors[i]
			next := chain
			chain = func(ctx context.Context, req interface{}) (interface{}, error) {
				return interceptor(ctx, req, next)
			}
		}
		return chain
	}
}

// Mock grpc.UnaryHandler type for local compilation without importing the massive grpc package if needed,
// but since we imported "google.golang.org/grpc", we use the real type alias:
// type UnaryHandler func(ctx context.Context, req interface{}) (interface{}, error)
// (It's already defined in the imported package)
