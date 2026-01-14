// Example 3: Function Composition (Pipe)
//
// -----------------------------------------------------------------------------
// WHY USE THIS PATTERN?
// -----------------------------------------------------------------------------
// "Composition over Inheritance" is a key software principle.
// Instead of creating massive classes with many methods, we create small,
// single-purpose functions and "compose" them together.
//
// This makes testing trivial: you test 'trim' once, and reuse it everywhere.
// -----------------------------------------------------------------------------

// 1. A Simple Pipe implementation
//
// The 'pipe' function takes an initial value and flows it through a list of functions.
// Output of fn1 -> Input of fn2 -> Input of fn3...
//
// Note: We use Function Overloads here to preserve type safety for the chain.
// Without overloads, TypeScript wouldn't know that the output of fn1 must match input of fn2.

function pipe<A, B>(val: A, fn1: (a: A) => B): B;
function pipe<A, B, C>(val: A, fn1: (a: A) => B, fn2: (b: B) => C): C;
function pipe<A, B, C, D>(val: A, fn1: (a: A) => B, fn2: (b: B) => C, fn3: (c: C) => D): D;
// In production, you might want support for more arguments or use 'fp-ts'.
function pipe(val: any, ...fns: Function[]) {
  return fns.reduce((acc, fn) => fn(acc), val);
}

// 2. Pure Functions (Business Logic)
// These functions are "Pure":
// - Depends ONLY on input.
// - No side effects (doesn't change global state).
// - Deterministic (same input = same output).

const trim = (s: string) => s.trim();
const toLower = (s: string) => s.toLowerCase();
const slugify = (s: string) => s.replace(/\s+/g, '-');

// "Currying" / Higher-Order Function
// Returns a function that takes a string.
// This allows us to configure behavior ('posts') before using it in the pipe.
const addPrefix = (prefix: string) => (s: string) => `${prefix}/${s}`;

// --- Usage ---

const rawInput = "  My Cool Blog Post  ";

// Imperative style (Hard to read "inside-out"):
// const slug = addPrefix("posts")(slugify(toLower(trim(rawInput))));

// Functional style (Readable pipeline "top-to-bottom"):
const slug = pipe(
  rawInput,
  trim,               // "  My Cool Blog Post  " -> "My Cool Blog Post"
  toLower,            // -> "my cool blog post"
  slugify,            // -> "my-cool-blog-post"
  addPrefix("posts")  // -> "posts/my-cool-blog-post"
);

console.log(`Original: "${rawInput}"`);
console.log(`Slug:     "${slug}"`);
