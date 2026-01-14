// Example 2: The Result Pattern (Result<T, E>)
//
// -----------------------------------------------------------------------------
// WHY USE THIS PATTERN?
// -----------------------------------------------------------------------------
// Traditional error handling uses `try/catch`, which has downsides:
// 1. You don't know IF a function throws just by looking at the signature.
// 2. You don't know WHAT it throws.
// 3. It's easy to forget to catch, crashing your process.
//
// The Result pattern treats errors as VALUES.
// - `Result<User, DbError>` explicitly tells you it can fail.
// - You are FORCED to handle the error case to get the value.
// -----------------------------------------------------------------------------

// 1. Define the Result Type
// This is another Discriminated Union (success: true vs false).
type Result<T, E = Error> = 
  | { success: true; value: T }
  | { success: false; error: E };

// 2. Constructors
// Helpers to easily create Success (Ok) and Failure (Err) states.
const ok = <T>(value: T): Result<T, never> => ({ success: true, value });
const err = <E>(error: E): Result<never, E> => ({ success: false, error });

// 3. Functional Operations (map, flatMap/chain)
//
// "Railroad Oriented Programming"
// Think of this like two parallel tracks:
// - Green track: Success -> Success -> Success
// - Red track: Error -----------------> Error
//
// If an error happens, we switch to the Red track and skip all remaining steps.

// `map`: Applies a function if we are on the Green track.
// If we are on the Red track, it does nothing and passes the error along.
function map<T, U, E>(result: Result<T, E>, fn: (val: T) => U): Result<U, E> {
  return result.success ? ok(fn(result.value)) : result;
}

// `flatMap`: Used when the transformation function ALSO returns a Result.
// It prevents nesting like Result<Result<T>>.
function flatMap<T, U, E>(result: Result<T, E>, fn: (val: T) => Result<U, E>): Result<U, E> {
  return result.success ? fn(result.value) : result;
}

// --- Domain Logic ---

function parseInteger(input: string): Result<number, string> {
  const num = parseInt(input, 10);
  if (isNaN(num)) return err("Not a number");
  return ok(num);
}

function checkPositive(num: number): Result<number, string> {
  if (num < 0) return err("Must be positive");
  return ok(num);
}

function double(num: number): number {
  return num * 2;
}

// --- Usage ---

const inputs = ["10", "-5", "abc"];

inputs.forEach(input => {
  // Chain: parse -> check -> double
  // If any step fails, the error propagates automatically.
  // No try-catch blocks needed!
  //
  // This style creates very linear, readable code for complex logic.
  
  const result = map(
    flatMap(
      parseInteger(input), 
      checkPositive
    ), 
    double
  );

  if (result.success) {
    console.log(`✅ Success for '${input}':`, result.value);
  } else {
    console.log(`❌ Error for '${input}':`, result.error);
  }
});
