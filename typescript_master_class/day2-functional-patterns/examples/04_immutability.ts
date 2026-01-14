// Example 4: Immutability with Readonly Deep & Update Patterns
//
// -----------------------------------------------------------------------------
// WHY USE THIS PATTERN?
// -----------------------------------------------------------------------------
// Mutable state is the root of many bugs:
// - "Spooky action at a distance": Object changed by a function far away.
// - Race conditions: Two async functions modifying the same object.
// - React/Redux bugs: Components not re-rendering because reference didn't change.
//
// By enforcing IMMUTABILITY:
// - We can trust that data doesn't change under our feet.
// - We can use simple `prev !== next` checks for change detection.
// -----------------------------------------------------------------------------

// 1. Recursive Readonly Type
// This utility type makes every property in a deeply nested object readonly.
// It recursively traverses the type definition.
type Immutable<T> = {
  readonly [P in keyof T]: T[P] extends object ? Immutable<T[P]> : T[P];
};

interface State {
  user: {
    name: string;
    preferences: {
      theme: string;
      notifications: boolean;
    };
  };
  counter: number;
}

// 2. Initial State (Immutable)
// We wrap State with Immutable<...> to enforce safety at compile time.
const initialState: Immutable<State> = {
  user: {
    name: "Bob",
    preferences: {
      theme: "dark",
      notifications: true,
    },
  },
  counter: 0,
};

// 3. Update Function using Spread (Copy-on-Write)
// "Mutation" is forbidden. We MUST create a new object.
// We use the Spread syntax (...) to shallow copy the parts we aren't changing.
const toggleTheme = (state: Immutable<State>): Immutable<State> => {
  // This looks verbose (Spread Pyramid of Doom), but it's pure JS/TS.
  // In production, libraries like 'Immer' handle this boilerplate automatically.
  return {
    ...state,
    user: {
      ...state.user,
      preferences: {
        ...state.user.preferences,
        theme: state.user.preferences.theme === "dark" ? "light" : "dark",
      },
    },
  };
};

// 4. Update using a lens/path utility (Conceptual)
// Functional libraries often provide helpers to update deep paths without the nesting.
// This is a simple example to show the concept (avoiding side-effects).
function updateProp<T, K extends keyof T>(obj: T, key: K, val: T[K]): T {
  return { ...obj, [key]: val };
}

// --- Usage ---

const nextState = toggleTheme(initialState);

// Compile-time Safety Check:
// initialState.counter = 1; 
// ^^^ Error: Cannot assign to 'counter' because it is a read-only property.

console.log("Initial Theme:", initialState.user.preferences.theme); // dark
console.log("Next Theme:   ", nextState.user.preferences.theme);    // light

// Reference Equality:
// Since we created a new object, this check is true.
// Frameworks like React use this to decide if re-render is needed.
console.log("Is different object?", initialState !== nextState);    // true
