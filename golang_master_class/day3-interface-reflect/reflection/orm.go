package reflection

import (
	"fmt"
	"log/slog"
	"reflect"
	"strings"
)

// RunORMDemo demonstrates a mini-ORM that generates SQL statements using reflection.
func RunORMDemo() {
	slog.Info("=== Reflection Demo: Mini-ORM (SQL Generator) ===")

	user := User{
		Name:  "Charlie",
		Age:   25,
		Email: "charlie@example.com",
	}

	sql, args := InsertSQL(user)
	slog.Info("Generated SQL", "sql", sql, "args", args)

	product := struct {
		ID    int    `db:"id"`
		Title string `db:"title"`
		Price int    `db:"price"`
	}{
		ID:    101,
		Title: "Golang Book",
		Price: 50,
	}

	sql2, args2 := InsertSQL(product)
	slog.Info("Generated SQL", "sql", sql2, "args", args2)
}

// InsertSQL generates a SQL INSERT statement for any struct.
// It looks for "db" tags to determine column names.
// If no tag is present, it uses the field name (lowercased).
func InsertSQL(v interface{}) (string, []interface{}) {
	val := reflect.ValueOf(v)
	if val.Kind() == reflect.Ptr {
		val = val.Elem()
	}

	if val.Kind() != reflect.Struct {
		return "", nil
	}

	typ := val.Type()
	var columns []string
	var placeholders []string
	var args []interface{}

	for i := 0; i < val.NumField(); i++ {
		fieldTyp := typ.Field(i)
		fieldVal := val.Field(i)

		// Skip unexported fields
		if fieldTyp.PkgPath != "" {
			continue
		}

		// Get column name from tag or default to struct field name
		colName := fieldTyp.Tag.Get("db")
		if colName == "" {
			colName = strings.ToLower(fieldTyp.Name)
		}

		// Handle "validate" tag fields that might not be DB columns
		// In a real ORM, we'd strict check tags. Here we assume all exported fields are columns
		// unless explicitly ignored (e.g. db:"-")
		if colName == "-" {
			continue
		}

		columns = append(columns, colName)
		placeholders = append(placeholders, "?")
		args = append(args, fieldVal.Interface())
	}

	tableName := strings.ToLower(typ.Name())
	if tableName == "" {
		// Handle anonymous structs
		tableName = "anonymous_table"
	}

	query := fmt.Sprintf("INSERT INTO %s (%s) VALUES (%s)",
		tableName,
		strings.Join(columns, ", "),
		strings.Join(placeholders, ", "),
	)

	return query, args
}
