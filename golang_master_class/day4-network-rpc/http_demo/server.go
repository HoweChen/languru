package http_demo

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
)

// StartServer demonstrates Go 1.22+ ServeMux with our custom middleware.
func StartServer(addr string) error {
	mux := http.NewServeMux()

	// 1.22 Feature: Method + Path matching
	// Matches only GET requests to /posts/{id}
	mux.HandleFunc("GET /posts/{id}", func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		slog.Info("Handling GET /posts/{id}", "id", id)

		resp := map[string]string{
			"id":    id,
			"title": fmt.Sprintf("Post #%s", id),
		}
		writeJSON(w, http.StatusOK, resp)
	})

	// Matches POST requests to /posts
	mux.HandleFunc("POST /posts", func(w http.ResponseWriter, r *http.Request) {
		slog.Info("Handling POST /posts")

		// Decode JSON body (omitted for brevity, but this is where it would go)
		// var payload CreatePostRequest
		// if err := json.NewDecoder(r.Body).Decode(&payload); err != nil { ... }

		resp := map[string]string{
			"status": "created",
			"id":     "123",
		}
		writeJSON(w, http.StatusCreated, resp)
	})

	// Demonstrate Panic Recovery
	mux.HandleFunc("GET /panic", func(w http.ResponseWriter, r *http.Request) {
		panic("Simulated Server Panic!")
	})

	// Apply Middleware Chain: Recovery -> Logging -> Mux
	// The request enters Recovery, then Logging, then the Mux.
	finalHandler := Chain(mux, RecoveryMiddleware, LoggingMiddleware)

	slog.Info("Starting HTTP server on " + addr)
	return http.ListenAndServe(addr, finalHandler)
}

// writeJSON is a helper to write JSON responses
func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		slog.Error("failed to encode json", "err", err)
	}
}
