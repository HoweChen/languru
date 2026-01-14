// Example 1: Domain-Driven Design (DDD) Entities
// Goal: Encapsulate business logic and state within rich Domain Models.
//
// What is an "Entity"?
// - It has a unique Identity (ID).
// - It has a Lifecycle (Created -> Updated -> Deleted).
// - It protects its invariants (rules that must always be true).
//
// Contrast with "Anemic Model":
// An Anemic model is just a DTO (Data Transfer Object) with public fields.
// Logic is scattered in "Service" classes. DDD puts logic INSIDE the entity.

// 1. Value Object: Email
// Value Objects have NO identity. They are defined by their value.
// If two Emails have the same string, they are equal.
// They are immutable.
class Email {
  // Private constructor forces use of static factory (for validation)
  private constructor(private readonly value: string) {}

  static create(email: string): Email {
    if (!email.includes("@")) throw new Error("Invalid Email Format");
    // In real apps, add regex validation here
    return new Email(email);
  }

  toString() { return this.value; }
  
  equals(other: Email) {
    return this.value === other.value;
  }
}

// 2. Aggregate Root: User
// The User entity enforces invariants (e.g., cannot change email to an invalid one).
// It acts as a transactional boundary.
class User {
  private constructor(
    public readonly id: string,
    private _email: Email,
    private _name: string,
    private _isActive: boolean
  ) {}

  // Factory method (Static Creation Method)
  // This makes the creation intent clear ("Register" vs just "new User")
  static register(id: string, emailStr: string, name: string): User {
    if (name.length < 2) throw new Error("Name too short (min 2 chars)");
    // Validating invariants BEFORE creation
    return new User(id, Email.create(emailStr), name, true);
  }

  // Domain Method (Command)
  // Encapsulates the logic of "Updating Email".
  // This is better than `user.email = '...'` because it enforces rules.
  changeEmail(newEmailStr: string) {
    if (!this._isActive) throw new Error("Cannot update inactive user");
    
    const newEmail = Email.create(newEmailStr);
    
    // Idempotency check
    if (this._email.equals(newEmail)) return;

    this._email = newEmail;
    
    // In a full event-sourced system, we would emit an event here:
    // this.events.push(new UserEmailChangedEvent(this.id, newEmail));
    console.log(`[Domain Event] User ${this.id} email changed to ${this._email}`);
  }

  deactivate() {
    this._isActive = false;
    console.log(`[Domain Event] User ${this.id} deactivated`);
  }

  // Getters (Query)
  // We expose a read-only view of the state.
  get email() { return this._email.toString(); }
  get isActive() { return this._isActive; }
  get name() { return this._name; }
}

// --- Usage ---

try {
  console.log("--- DDD Entity Demo ---");
  
  // 1. Creation
  const user = User.register("u1", "alice@example.com", "Alice");
  console.log(`User created: ${user.name} (${user.email})`);

  // 2. Business Logic Execution
  user.changeEmail("alice.new@example.com");
  console.log(`Email updated: ${user.email}`);

  // 3. Invariant Protection
  user.deactivate();
  console.log("User deactivated. Attempting to change email...");
  
  user.changeEmail("fail@example.com"); // Should throw
  
} catch (e: any) {
  console.error("Caught Expected Error:", e.message);
}

