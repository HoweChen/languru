package circuitbreaker

import (
	"errors"
	"fmt"
	"log/slog"
	"math/rand"
	"sync"
	"time"
)

// State represents the current state of the Circuit Breaker.
type State int

const (
	StateClosed State = iota
	StateOpen
	StateHalfOpen
)

// CircuitBreaker protects your system from cascading failures.
type CircuitBreaker struct {
	mu               sync.Mutex
	state            State
	failureCount     int
	failureThreshold int
	resetTimeout     time.Duration
	lastFailure      time.Time
}

// NewCircuitBreaker creates a new CB instance.
func NewCircuitBreaker(threshold int, timeout time.Duration) *CircuitBreaker {
	return &CircuitBreaker{
		state:            StateClosed,
		failureThreshold: threshold,
		resetTimeout:     timeout,
	}
}

// Execute wraps a function call with circuit breaker logic.
func (c *CircuitBreaker) Execute(req func() error) error {
	c.mu.Lock()
	if c.state == StateOpen {
		if time.Since(c.lastFailure) > c.resetTimeout {
			c.state = StateHalfOpen
			slog.Info("Circuit Breaker -> HalfOpen (Trial)")
		} else {
			c.mu.Unlock()
			return errors.New("circuit breaker is open")
		}
	}
	c.mu.Unlock()

	// Execute the actual request
	err := req()

	c.mu.Lock()
	defer c.mu.Unlock()

	if err != nil {
		c.handleFailure()
		return err
	}

	c.handleSuccess()
	return nil
}

func (c *CircuitBreaker) handleFailure() {
	c.failureCount++
	c.lastFailure = time.Now()

	if c.state == StateHalfOpen {
		c.state = StateOpen
		slog.Warn("Circuit Breaker -> OPEN (Trial Failed)")
		return
	}

	if c.failureCount >= c.failureThreshold {
		c.state = StateOpen
		slog.Warn("Circuit Breaker -> OPEN (Threshold Reached)")
	}
}

func (c *CircuitBreaker) handleSuccess() {
	if c.state == StateHalfOpen {
		c.state = StateClosed
		c.failureCount = 0
		slog.Info("Circuit Breaker -> CLOSED (Recovered)")
	} else {
		// In a real implementation, you might want a sliding window here
		// instead of resetting on every success.
		c.failureCount = 0
	}
}

// RunDemo triggers a series of simulated requests to show state transitions.
func RunDemo() {
	cb := NewCircuitBreaker(3, 2*time.Second)

	for i := 0; i < 20; i++ {
		err := cb.Execute(func() error {
			// Simulate 60% failure rate
			if rand.Float32() < 0.6 {
				return errors.New("remote service error")
			}
			return nil
		})

		state := cb.StateName()
		if err != nil {
			fmt.Printf("Req #%d: FAILED (%s) | State: %s\n", i, err, state)
		} else {
			fmt.Printf("Req #%d: SUCCESS | State: %s\n", i, state)
		}

		time.Sleep(300 * time.Millisecond)
	}
}

func (c *CircuitBreaker) StateName() string {
	c.mu.Lock()
	defer c.mu.Unlock()
	switch c.state {
	case StateClosed:
		return "CLOSED"
	case StateOpen:
		return "OPEN"
	case StateHalfOpen:
		return "HALF_OPEN"
	default:
		return "UNKNOWN"
	}
}
