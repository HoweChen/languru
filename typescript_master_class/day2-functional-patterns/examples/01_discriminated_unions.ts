// Example 1: Discriminated Unions (Algebraic Data Types)
//
// -----------------------------------------------------------------------------
// WHY USE THIS PATTERN?
// -----------------------------------------------------------------------------
// A common anti-pattern in state management is "Boolean Soup":
//   `{ isLoading: boolean, error: Error | null, data: T | null }`
//
// This allows impossible states like:
//   - `isLoading: true` AND `error: Error` (Are we loading or did it fail?)
//   - `isLoading: false` AND `data: null` AND `error: null` (What state is this?)
//
// Discriminated Unions fix this by making states MUTUALLY EXCLUSIVE.
// -----------------------------------------------------------------------------

// 1. Define the possible states
// The literal type "status" is the DISCRIMINATOR.
// TypeScript uses this field to narrow down the type automatically.

interface LoadingState {
  status: "loading"; // <--- The Discriminator
  startedAt: number;
}

interface SuccessState<T> {
  status: "success";
  data: T;
  cached: boolean;
}

interface ErrorState {
  status: "error";
  error: Error;
  retryCount: number;
}

// 2. The Union Type
// This type represents the sum of all possible states.
// A variable of this type can only be ONE of these shapes at a time.
type RemoteData<T> = LoadingState | SuccessState<T> | ErrorState;

// 3. Pattern Matching Helper
//
// Real-world context:
// In functional languages (like Haskell/OCaml), pattern matching is a native feature.
// In TypeScript, we simulate it with switch statements or object literals.
//
// This helper enforces EXHAUSTIVENESS:
// If you add a "idle" state to RemoteData but forget to handle it here,
// TypeScript will throw a compile-time error.
function match<T, R>(
  state: RemoteData<T>,
  patterns: {
    loading: (s: LoadingState) => R;
    success: (s: SuccessState<T>) => R;
    error: (s: ErrorState) => R;
  }
): R {
  switch (state.status) {
    case "loading": 
      // TS knows 'state' is LoadingState here
      return patterns.loading(state);
    case "success": 
      // TS knows 'state' is SuccessState<T> here
      return patterns.success(state);
    case "error": 
      // TS knows 'state' is ErrorState here
      return patterns.error(state);
    default: 
      // The 'never' type is how we prove to the compiler we've covered everything.
      // If 'state' can still be something (like a new "idle" state),
      // assignment to 'never' fails.
      const _exhaustiveCheck: never = state;
      return _exhaustiveCheck;
  }
}

// --- Usage ---

const currentState: RemoteData<string> = {
  status: "success",
  data: "User Data Loaded",
  cached: true
};

// Using the matcher ensures we handle failures and loading states UI logic.
// This is heavily used in React (Redux/Zustand) and robust backend state machines.
const uiMessage = match(currentState, {
  loading: () => "Spinner...",
  success: (s) => `Data: ${s.data} (Cached: ${s.cached})`,
  error: (s) => `Failed: ${s.error.message}, Retrying... (${s.retryCount})`
});

console.log(uiMessage);
