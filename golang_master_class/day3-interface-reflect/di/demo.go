package di

import "log/slog"

// RunDemo demonstrates Dependency Injection (DI) and Clean Architecture patterns.
func RunDemo() {
	slog.Info("=== Building Dependency Graph (Manual Wiring) ===")

	// 1. Infrastructure Layer (Database, Config, etc.)
	// The Repository implementation knows about the DB connection.
	repo := NewUserRepository("postgres://user:pass@localhost:5432/mydb")

	// 2. Service Layer (Business Logic)
	// The Service depends on the Repository Interface, not the concrete implementation.
	svc := NewUserService(repo)

	// 3. Interface Layer (Handlers, CLI, etc.)
	// The Handler depends on the Service Interface.
	handler := NewUserHandler(svc)

	slog.Info("=== Executing Business Logic via Handler ===")
	// Simulate an HTTP request or CLI command
	handler.HandleRegister("alice")
}

// ---------------------------------------------------------
// 1. Domain Interfaces (Contracts)
// Defined in the Service layer (Consumer), not the Provider.
// ---------------------------------------------------------

type Repository interface {
	Save(name string) error
}

type Service interface {
	Register(name string) error
}

// ---------------------------------------------------------
// 2. Infrastructure / Adapters (Implementation)
// ---------------------------------------------------------

type DatabaseRepo struct {
	connStr string
}

func NewUserRepository(conn string) *DatabaseRepo {
	return &DatabaseRepo{connStr: conn}
}

func (r *DatabaseRepo) Save(name string) error {
	slog.Info("DB: Saving user to database", "name", name, "connection", r.connStr)
	// Real implementation would use SQL here
	return nil
}

// ---------------------------------------------------------
// 3. Service Layer (Business Logic)
// ---------------------------------------------------------

type UserService struct {
	repo Repository // Depends on abstraction
}

// NewUserService accepts the Repository interface.
// This allows passing a MockRepository during testing.
func NewUserService(repo Repository) *UserService {
	return &UserService{repo: repo}
}

func (s *UserService) Register(name string) error {
	slog.Info("Service: Validating and registering user", "name", name)

	// Business logic: Validation, enrichment, etc.
	if name == "" {
		slog.Error("Service: Validation failed, empty name")
		return nil // Simplified error handling
	}

	return s.repo.Save(name)
}

// ---------------------------------------------------------
// 4. Interface Layer (HTTP Handlers / CLI)
// ---------------------------------------------------------

type UserHandler struct {
	svc Service // Depends on abstraction
}

func NewUserHandler(svc Service) *UserHandler {
	return &UserHandler{svc: svc}
}

func (h *UserHandler) HandleRegister(name string) {
	slog.Info("Handler: Received registration request", "name", name)

	if err := h.svc.Register(name); err != nil {
		slog.Error("Handler: Register failed", "err", err)
	} else {
		slog.Info("Handler: Register successful", "name", name)
	}
}
