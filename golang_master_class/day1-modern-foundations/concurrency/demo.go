package concurrency

import (
	"context"
	"errors"
	"log/slog"
	"math/rand"
	"sync"
	"time"

	"golang.org/x/sync/errgroup"
)

// RunAdvancedPatterns demonstrates professional-grade concurrency patterns.
// It covers:
// 1. Context Awareness (AfterFunc)
// 2. Bounded Concurrency (Worker Pool)
// 3. Robust Pipeline with Error Propagation
// 4. Heartbeat Pattern for Long-running Tasks
//
// These comments are educational and necessary for the Master Class curriculum.
func RunAdvancedPatterns(ctx context.Context) {
	slog.Info("=== 1. Context AfterFunc (Go 1.21+) ===")
	// context.AfterFunc is more efficient than a goroutine waiting on ctx.Done()
	stop := context.AfterFunc(ctx, func() {
		slog.Info("Clean-up: Context cancelled or timed out")
	})
	defer stop()

	slog.Info("=== 2. ErrGroup Pipeline with Rate Limiting ===")
	if err := PipelineDemo(ctx); err != nil {
		slog.Error("Pipeline failed", "err", err)
	} else {
		slog.Info("Pipeline completed successfully")
	}

	slog.Info("=== 3. Heartbeat Pattern ===")
	// Create a separate context for this demo to control its lifecycle independently
	hbCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	const pulseInterval = 500 * time.Millisecond
	heartbeat, results := StartHeartbeatTask(hbCtx, pulseInterval)

	// Monitor heartbeats in background
	go func() {
		for range heartbeat {
			slog.Debug("Pulse received")
		}
	}()

	// Consume results until channel closes
	for res := range results {
		slog.Info("Task result", "result", res)
	}
}

// PipelineDemo simulates a 3-stage pipeline: Generate -> Process -> Aggregate.
// It uses errgroup to manage the lifecycle of all stages.
func PipelineDemo(ctx context.Context) error {
	// Create an errgroup. If any goroutine returns an error,
	// the group context is cancelled, signaling all others to stop.
	g, gCtx := errgroup.WithContext(ctx)

	// Set concurrency limit for the group (Go 1.20+)
	// This prevents spawning too many goroutines if we were adding them dynamically.
	g.SetLimit(10)

	// Channels for data flow
	// Buffer size 5 to allow some burstiness without blocking
	jobs := make(chan int, 5)
	results := make(chan int, 5)

	// --- Stage 1: Generator ---
	g.Go(func() error {
		defer close(jobs) // Close jobs when generator is done
		slog.Info("Generator started")

		for i := 1; i <= 10; i++ {
			select {
			case <-gCtx.Done():
				return gCtx.Err() // Propagate cancellation
			case jobs <- i:
				// Simulate production effort
				time.Sleep(50 * time.Millisecond)
			}
		}
		slog.Info("Generator finished")
		return nil
	})

	// --- Stage 2: Processor Pool (3 workers) ---
	// We need to close 'results' channel ONLY when ALL workers are done.
	// We use a WaitGroup for this specific synchronization logic.
	var workersWg sync.WaitGroup
	workersWg.Add(3)

	// Launch a closer goroutine that waits for workers to finish
	// This runs inside the errgroup so it respects the group's lifecycle implicitly
	g.Go(func() error {
		workersWg.Wait()
		close(results)
		return nil
	})

	for i := 0; i < 3; i++ {
		id := i
		g.Go(func() error {
			defer workersWg.Done()
			slog.Debug("Worker started", "id", id)

			for job := range jobs {
				// Check for cancellation before processing
				select {
				case <-gCtx.Done():
					return gCtx.Err()
				default:
				}

				// Simulate processing
				res, err := processJob(id, job)
				if err != nil {
					return err // This triggers gCtx cancellation
				}

				// Send result
				select {
				case <-gCtx.Done():
					return gCtx.Err()
				case results <- res:
				}
			}
			return nil
		})
	}

	// --- Stage 3: Aggregator (Consumer) ---
	// Runs in the same errgroup to ensure any error here also cancels the pipeline
	g.Go(func() error {
		sum := 0
		for res := range results {
			sum += res
		}
		slog.Info("Aggregation complete", "total_sum", sum)
		return nil
	})

	// Wait for all stages to complete or fail
	return g.Wait()
}

// processJob simulates work and random errors.
// Educational note: Separate pure logic from concurrency control.
func processJob(workerID, job int) (int, error) {
	// Simulate work
	time.Sleep(time.Duration(rand.Intn(100)) * time.Millisecond)

	// Simulate occasional fatal error
	// In a real app, you might distinguish between retryable and fatal errors
	if job == 999 { // Magic number to trigger error (disabled for now)
		return 0, errors.New("critical processing failure")
	}

	return job * 2, nil
}

// StartHeartbeatTask runs a task that reports its pulse.
// Returns a channel for pulses (struct{}) and a channel for results.
// This pattern is crucial for detecting stuck goroutines in distributed systems.
func StartHeartbeatTask(ctx context.Context, interval time.Duration) (<-chan struct{}, <-chan int) {
	heartbeat := make(chan struct{})
	results := make(chan int)

	go func() {
		defer close(heartbeat)
		defer close(results)

		pulse := time.NewTicker(interval)
		defer pulse.Stop()

		// Work simulates a task that might be slower than the heartbeat
		work := time.NewTicker(2 * interval)
		defer work.Stop()

		for {
			select {
			case <-ctx.Done():
				return // Cancellation

			case <-pulse.C:
				select {
				case heartbeat <- struct{}{}:
				default:
					// Fallback if receiver is slow, don't block heartbeat
					// This ensures the heartbeat signal is "best effort" and non-blocking
				}

			case t := <-work.C:
				// Send result
				select {
				case results <- t.Second():
				case <-ctx.Done():
					return
				}
			}
		}
	}()

	return heartbeat, results
}
