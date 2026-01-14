package reflection

import (
	"errors"
	"fmt"
	"log/slog"
	"reflect"
	"strings"
)

// RunDemo demonstrates advanced reflection usage: Struct Tag Parsing and Validation.
// This mirrors how libraries like 'go-playground/validator' or 'encoding/json' work.
func RunDemo() {
	slog.Info("=== Reflection Demo: Struct Tag Validation ===")

	// Case 1: Invalid User
	invalidUser := User{
		Name:  "Alice",
		Age:   150,             // Invalid: max=100
		Email: "invalid-email", // Invalid: contains=@
	}
	slog.Info("Validating Invalid User...")
	if err := Validate(invalidUser); err != nil {
		slog.Error("Validation failed (Expected)", "err", err)
	}

	// Case 2: Valid User
	validUser := User{
		Name:  "Bob",
		Age:   30,
		Email: "bob@example.com",
	}
	slog.Info("Validating Valid User...")
	if err := Validate(validUser); err != nil {
		slog.Error("Validation failed (Unexpected)", "err", err)
	} else {
		slog.Info("Validation passed")
	}

	// Case 3: Reflection Modification
	// Demonstrates modifying a value via reflection (requires pointer)
	slog.Info("=== Reflection Demo: Modifying Values ===")
	x := 10
	slog.Info("Before modification", "x", x)
	ModifyValue(&x)
	slog.Info("After modification", "x", x)
}

type User struct {
	Name  string `validate:"required,min=2"`
	Age   int    `validate:"min=18,max=100"`
	Email string `validate:"required,contains=@"`
}

// Validate validates a struct based on "validate" tags.
// It uses reflection to inspect fields and tags at runtime.
func Validate(v interface{}) error {
	val := reflect.ValueOf(v)

	// If it's a pointer, get the underlying element
	if val.Kind() == reflect.Ptr {
		val = val.Elem()
	}

	if val.Kind() != reflect.Struct {
		return errors.New("validate: expected struct")
	}

	typ := val.Type()
	for i := 0; i < val.NumField(); i++ {
		fieldVal := val.Field(i)
		fieldTyp := typ.Field(i)

		// Get the tag value
		tag := fieldTyp.Tag.Get("validate")
		if tag == "" {
			continue
		}

		// Parse and execute rules
		rules := strings.Split(tag, ",")
		for _, rule := range rules {
			if err := checkRule(fieldVal, rule, fieldTyp.Name); err != nil {
				return err
			}
		}
	}
	return nil
}

// checkRule implements the actual validation logic for a single rule.
func checkRule(v reflect.Value, rule, fieldName string) error {
	switch {
	case rule == "required":
		if v.IsZero() {
			return fmt.Errorf("%s is required", fieldName)
		}

	case strings.HasPrefix(rule, "min="):
		var minVal int
		fmt.Sscanf(rule, "min=%d", &minVal)

		switch v.Kind() {
		case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
			if int(v.Int()) < minVal {
				return fmt.Errorf("%s must be >= %d", fieldName, minVal)
			}
		case reflect.String:
			if len(v.String()) < minVal {
				return fmt.Errorf("%s length must be >= %d", fieldName, minVal)
			}
		}

	case strings.HasPrefix(rule, "max="):
		var maxVal int
		fmt.Sscanf(rule, "max=%d", &maxVal)

		if v.Kind() == reflect.Int && int(v.Int()) > maxVal {
			return fmt.Errorf("%s must be <= %d", fieldName, maxVal)
		}

	case strings.HasPrefix(rule, "contains="):
		substr := strings.TrimPrefix(rule, "contains=")
		if v.Kind() == reflect.String && !strings.Contains(v.String(), substr) {
			return fmt.Errorf("%s must contain '%s'", fieldName, substr)
		}
	}
	return nil
}

// ModifyValue sets a new value using reflection.
// Argument must be a pointer to be addressable.
func ModifyValue(p interface{}) {
	v := reflect.ValueOf(p)
	// Check if it's a pointer and not nil
	if v.Kind() != reflect.Ptr || v.IsNil() {
		slog.Warn("ModifyValue requires a non-nil pointer")
		return
	}

	// Get the element the pointer points to
	elem := v.Elem()

	// Check if we can set it
	if !elem.CanSet() {
		slog.Warn("Value is not settable")
		return
	}

	if elem.Kind() == reflect.Int {
		elem.SetInt(999) // Set new value
	}
}
