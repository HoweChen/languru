// Example 5: Option Pattern (The Billion Dollar Mistake Fix)
//
// -----------------------------------------------------------------------------
// WHY USE THIS PATTERN?
// -----------------------------------------------------------------------------
// Null references are famously called the "Billion Dollar Mistake".
// In JS/TS, `undefined` often breaks code when you try to access a property on it.
//
// The Option (or Maybe) pattern acts as a SAFE container.
// It forces you to check if the value exists before using it.
// -----------------------------------------------------------------------------

// 1. Define Option Type
// Explicitly models presence ("some") or absence ("none").
type Option<T> = 
  | { kind: "some"; value: T }
  | { kind: "none" };

const some = <T>(value: T): Option<T> => ({ kind: "some", value });
const none: Option<never> = { kind: "none" };

// 2. Helper: fromNullable
// Bridges the gap between messy JS (null/undefined) and safe Options.
function fromNullable<T>(val: T | null | undefined): Option<T> {
  return val === null || val === undefined ? none : some(val);
}

// 3. Helper: mapOption
// Transform the value INSIDE the box, but only if the box is not empty.
function mapOption<T, U>(opt: Option<T>, fn: (val: T) => U): Option<U> {
  return opt.kind === "some" ? some(fn(opt.value)) : none;
}

// 4. Helper: getOrElse (Unwrap)
// The ONLY way to get the value out is to provide a fallback.
// This guarantees runtime safety (no crashes!).
function getOrElse<T>(opt: Option<T>, defaultValue: T): T {
  return opt.kind === "some" ? opt.value : defaultValue;
}

// --- Domain Logic ---

interface User {
  id: number;
  profile?: {
    bio?: string;
  };
}

const db: User[] = [
  { id: 1, profile: { bio: "TypeScript Fan" } },
  { id: 2, profile: {} }, // No bio
  { id: 3 }, // No profile
];

function findUser(id: number): Option<User> {
  // We wrap the potentially undefined result of .find() immediately.
  return fromNullable(db.find(u => u.id === id));
}

// --- Usage ---

function getUserBio(id: number): string {
  // Traditional way (The "Pyramid of Doom"): 
  // if (user && user.profile && user.profile.bio) ...
  
  // Functional way:
  const userOpt = findUser(id);
  
  // We want to access user.profile.bio.
  // We can "map" over the option. If user doesn't exist, this code NEVER runs.
  
  // NOTE: In a real functional library (fp-ts), you would use 'chain' (flatMap) here
  // because u.profile?.bio is ALSO nullable. 
  // For simplicity, we just use map and handle the null at the end.
  const bioValue = getOrElse(
    mapOption(userOpt, u => u.profile?.bio), 
    null
  );

  // Convert the result back to an Option to handle the bio being missing
  const finalBioOpt = fromNullable(bioValue);

  return getOrElse(finalBioOpt, "No Bio Available");
}

console.log("User 1:", getUserBio(1)); // "TypeScript Fan"
console.log("User 2:", getUserBio(2)); // "No Bio Available" (User exists, bio missing)
console.log("User 4:", getUserBio(4)); // "No Bio Available" (User missing)
