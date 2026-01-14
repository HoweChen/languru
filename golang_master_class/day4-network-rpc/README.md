# Day 4: Network Programming, HTTP 1.22+ & gRPC

## Introduction
Day 4 focuses on modern network service development in Go. We explore the significant enhancements to `net/http` in Go 1.22 (making external routers like `chi` or `gorilla/mux` less critical) and dive into gRPC patterns, specifically Middleware (Interceptors).

We cover:
1.  **HTTP/1.22+ Routing**: The new `ServeMux` capabilities (method matching, path variables).
2.  **Middleware Patterns**: How to write and chain HTTP middleware (Logging, Recovery) from scratch.
3.  **gRPC Interceptors**: The standard way to implement cross-cutting concerns (Auth, Logging, Metrics) in RPC services.

## Core Concepts

### 1. HTTP 1.22+ Routing (`ServeMux`)
-   **Method Matching**: Now built-in! `mux.HandleFunc("POST /items", ...)` works out of the box.
-   **Wildcards**: `{id}` matches a single segment. `{path...}` matches the rest of the URL.
-   **Precedence**: More specific patterns win (e.g., `/items/new` wins over `/items/{id}`).
-   **Why it matters**: Drastically reduces dependency bloat for standard REST APIs.

### 2. HTTP Middleware
-   **Pattern**: `func(next http.Handler) http.Handler`
-   **Chaining**: We implement a simple `Chain` function to apply multiple middlewares in order.
-   **Context**: Use `r.Context()` to pass data (user info) down the request chain.

### 3. gRPC Patterns
-   **Protobuf**: Binary serialization format. Efficient, strongly typed, language-agnostic.
-   **Service Definition**: Defining APIs in `.proto` files.
-   **Interceptors**: Middleware for gRPC.
    -   *Unary Interceptor*: Wraps single request/response calls.
    -   *Chaining*: Multiple interceptors can be composed (Log -> Auth -> RateLimit -> Handler).

## Code Walkthrough

### `http_demo/server.go` & `middleware.go`
-   **`StartServer`**: Demonstrates the new Go 1.22 `ServeMux`.
    -   Defines `GET /posts/{id}` and uses `r.PathValue("id")` to extract it.
    -   Applies a middleware chain: `Recovery -> Logging -> Handler`.
-   **`LoggingMiddleware`**: Wraps execution, captures status code via a custom `ResponseWriter` wrapper.
-   **`RecoveryMiddleware`**: Uses `defer recover()` to catch panics and return 500 errors.

### `grpc_demo/interceptor.go`
-   **Simulation**: Since we don't compile `.proto` files here, we simulate the gRPC handler signature.
-   **`LoggingInterceptor`**: Wraps execution, records duration.
-   **`AuthInterceptor`**: Checks context metadata for a token. Returns `codes.Unauthenticated` if missing.
-   **`ChainUnaryServer`**: A recursive function that combines multiple interceptors into a single handler chain.

## Best Practices

### HTTP
-   **Use Standard Lib First**: For new projects (Go 1.22+), try `http.ServeMux` before reaching for `Gin` or `Echo`. It's often enough.
-   **Middleware**: Wrap `http.Handler` for standard middleware (Logging, CORS).
-   **JSON Helpers**: Create simple helpers like `writeJSON` to standardize responses.

### gRPC
-   **Use Interceptors for Cross-Cutting Concerns**: Don't check Auth tokens in every single handler function. Do it once in an interceptor.
-   **Handle Errors Properly**: Always return `status.Error(code, msg)` so clients can react to specific error types (NotFound, PermissionDenied).
-   **Context Propagation**: Ensure `ctx` is passed through all layers. gRPC relies heavily on context for cancellation and metadata.

## Dos and Don'ts

### HTTP
- **Do** use `Method + Path` syntax in Go 1.22+.
  ```go
  mux := http.NewServeMux()
  // Good: Clear intent, method restricted
  mux.HandleFunc("POST /items", createItemHandler)
  mux.HandleFunc("GET /items/{id}", getItemHandler)
  ```
- **Don't** parse `r.URL.Path` manually for IDs anymore.
  ```go
  // Bad: Brittle, error-prone manual parsing
  func handler(w http.ResponseWriter, r *http.Request) {
      idStr := strings.TrimPrefix(r.URL.Path, "/items/")
      // ...
  }

  // Good: Built-in PathValue (Go 1.22+)
  func handler(w http.ResponseWriter, r *http.Request) {
      idStr := r.PathValue("id")
      // ...
  }
  ```
- **Do** use `slog` for structured logging.
  ```go
  // Good: Machine-parsable (JSON), searchable
  slog.Info("request started", "method", r.Method, "path", r.URL.Path)
  ```
- **Don't** use `fmt.Println` in production servers.

### gRPC
- **Do** chain interceptors using `grpc.ChainUnaryInterceptor`.
  ```go
  // Good: Clean composition of cross-cutting concerns
  server := grpc.NewServer(
      grpc.ChainUnaryInterceptor(
          loggingInterceptor,
          authInterceptor,
          recoveryInterceptor,
      ),
  )
  ```
- **Don't** perform business logic validation in interceptors (that belongs in the Service).
- **Do** use Metadata for headers (Auth tokens).
  ```go
  // Good: Extracting token from metadata
  md, ok := metadata.FromIncomingContext(ctx)
  if ok {
      token := md["authorization"]
  }
  ```
- **Don't** put sensitive info in the request body if it belongs in headers.

## Further Reading
-   [Go 1.22 Release Notes (Routing)](https://go.dev/doc/go1.22#net/http)
-   [gRPC Go: Interceptors](https://github.com/grpc/grpc-go/tree/master/examples/features/interceptor)
-   [gRPC Error Handling Best Practices](https://grpc.io/docs/guides/error/)
