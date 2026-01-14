package unsafe_demo

import (
	"fmt"
	"log/slog"
	"unsafe"
)

// RunDemo demonstrates dangerous but powerful usages of the unsafe package.
// WARNING: Do not use this in production unless absolutely necessary.
func RunDemo() {
	slog.Info("=== 1. Zero-Copy String/Byte Conversion ===")

	s := "Hello, Go Master!"
	b := StringToBytes(s)
	slog.Info("String -> Bytes (Zero Copy)", "bytes", b)

	s2 := BytesToString(b)
	slog.Info("Bytes -> String (Zero Copy)", "str", s2)

	// WARNING: Strings are immutable in Go.
	// Modifying the underlying byte array of a string literal will cause a runtime panic (SIGSEGV).
	// b[0] = 'h' // <--- THIS WILL CRASH THE PROGRAM

	slog.Info("\n=== 2. Modifying Private Struct Fields ===")
	u := user{name: "Alice", age: 30}
	fmt.Printf("Before: %+v\n", u)

	modifyPrivateField(&u)
	fmt.Printf("After: %+v\n", u)
}

// StringToBytes converts string to []byte without allocation.
// Uses unsafe.Slice (Go 1.20+).
func StringToBytes(s string) []byte {
	return unsafe.Slice(unsafe.StringData(s), len(s))
}

// BytesToString converts []byte to string without allocation.
// Uses unsafe.String (Go 1.20+).
func BytesToString(b []byte) string {
	return unsafe.String(unsafe.SliceData(b), len(b))
}

type user struct {
	name string
	age  int
}

// modifyPrivateField uses pointer arithmetic to access unexported fields.
func modifyPrivateField(u *user) {
	// 1. Get the base pointer of the struct
	basePtr := unsafe.Pointer(u)

	// 2. Calculate offset of 'age'.
	// We know 'age' is after 'name'.
	// offset = Sizeof(string) + padding (if any)
	// For this simple struct, unsafe.Offsetof is safer if we had access to the type definition.
	// Since we are inside the package, we cheat slightly, but the pointer math is:
	// Address(u) + Sizeof(u.name)

	nameSize := unsafe.Sizeof(u.name)

	// Convert to uintptr to do math, then back to Pointer, then to *int
	agePtr := (*int)(unsafe.Pointer(uintptr(basePtr) + nameSize))

	*agePtr = 100 // Hack the age!
}
