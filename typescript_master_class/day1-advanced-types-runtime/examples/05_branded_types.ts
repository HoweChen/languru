// Example 5: Opaque Types for Domain Safety (Branded Types)
// Goal: Prevent accidental mixing of compatible primitive types (e.g. passing a UserID where an OrderID is expected).
// TypeScript doesn't have nominal typing by default, but we can fake it.

// 1. Define a generic "Brand" utility
// This technique is often called "Flavoring" or "Branding".
// The `__brand` property doesn't actually exist at runtime, but TS thinks it does.
type Brand<K, T> = K & { __brand: T };

// 2. Define Domain Types
type UserId = Brand<string, "UserId">;
type OrderId = Brand<string, "OrderId">;
type Email = Brand<string, "Email">;

// 3. Validation Factories (Smart Constructors)
// We ONLY allow creation of these types through trusted functions.

function createUserId(id: string): UserId {
  // In a real app, validate UUID format here
  if (!id.startsWith("u_")) throw new Error("Invalid User ID format");
  return id as UserId;
}

function createOrderId(id: string): OrderId {
  if (!id.startsWith("o_")) throw new Error("Invalid Order ID format");
  return id as OrderId;
}

function createEmail(email: string): Email {
  if (!email.includes("@")) throw new Error("Invalid Email");
  return email as Email;
}

// 4. Domain Logic that requires specific types

function processOrder(orderId: OrderId, userId: UserId) {
  console.log(`Processing Order ${orderId} for User ${userId}`);
}

function sendEmail(to: Email, subject: string) {
  console.log(`Sending "${subject}" to ${to}`);
}

// --- Usage ---

const rawUserString = "u_12345";
const rawOrderString = "o_98765";
const rawEmailString = "alice@example.com";

// Validation phase
const userId = createUserId(rawUserString);
const orderId = createOrderId(rawOrderString);
const email = createEmail(rawEmailString);

// Correct usage
processOrder(orderId, userId);
sendEmail(email, "Your order is ready");

// Incorrect usage (Uncomment to see errors)

// processOrder(userId, orderId); 
// Error: Argument of type 'UserId' is not assignable to parameter of type 'OrderId'.

// processOrder(rawOrderString, rawUserString); 
// Error: Argument of type 'string' is not assignable to parameter of type 'OrderId'.

// This prevents the classic "swapped arguments" bug that compilers usually miss!
