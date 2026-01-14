// Example 4: Mixins (Composable Behavior)
//
// -----------------------------------------------------------------------------
// WHY USE THIS PATTERN?
// -----------------------------------------------------------------------------
// TypeScript classes support SINGLE inheritance only (`class A extends B`).
//
// But what if you want a `User` that is both `Timestamped` AND `Activatable`?
// You can't do `class User extends Timestamped, Activatable`.
//
// Mixins solve this by "Function Composition":
// `const FinalClass = MixinA(MixinB(BaseClass));`
// -----------------------------------------------------------------------------

// 1. The Mixin Types
// This generic type represents "Any Class Constructor".
type Constructor<T = {}> = new (...args: any[]) => T;

// 2. Mixin Factories
// A Mixin is a function that:
// 1. Takes a Base class.
// 2. Returns a NEW class that extends the Base class with extra stuff.

function Timestamped<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    // New properties
    createdAt = new Date();
    updatedAt = new Date();
  };
}

function Activatable<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    // New properties & methods
    isActive = false;

    activate() {
      this.isActive = true;
      console.log("Activated!");
    }

    deactivate() {
      this.isActive = false;
      console.log("Deactivated!");
    }
  };
}

// 3. The Base Class
class User {
  constructor(public name: string) {}
}

// 4. Composing the Class
// We wrap the User class with our behaviors.
// Order matters for initialization, but usually not for logic.
const SuperUser = Timestamped(Activatable(User));

// --- Usage ---

// 'user' has ALL properties: name, createdAt, isActive, etc.
const user = new SuperUser("Alice");

console.log("Name:", user.name);
console.log("Created At:", user.createdAt); // From Timestamped
console.log("Is Active:", user.isActive);   // From Activatable

user.activate(); // Method from Activatable
console.log("Is Active:", user.isActive);
