package http_demo

import (
	"log/slog"
	"net/http"
	"time"
)

// Middleware defines a function that wraps an http.Handler.
type Middleware func(http.Handler) http.Handler

// Chain applies a stack of middlewares to a handler.
// The first middleware in the slice is the outer-most one (runs first).
func Chain(h http.Handler, m ...Middleware) http.Handler {
	// Apply in reverse order so the first in the list is the outer-most
	for i := len(m) - 1; i >= 0; i-- {
		h = m[i](h)
	}
	return h
}

// LoggingMiddleware logs the incoming request details and execution duration.
func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		ww := &responseWriter{ResponseWriter: w, code: http.StatusOK}

		next.ServeHTTP(ww, r)

		slog.Info("HTTP Request",
			"method", r.Method,
			"path", r.URL.Path,
			"status", ww.code,
			"remote_addr", r.RemoteAddr,
			"duration", time.Since(start),
		)
	})
}

// RecoveryMiddleware recovers from panics and returns a 500 error.
func RecoveryMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				slog.Error("Panic recovered", "error", err)
				http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			}
		}()
		next.ServeHTTP(w, r)
	})
}

// responseWriter wraps http.ResponseWriter to capture the status code.
type responseWriter struct {
	http.ResponseWriter
	code int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.code = code
	rw.ResponseWriter.WriteHeader(code)
}
