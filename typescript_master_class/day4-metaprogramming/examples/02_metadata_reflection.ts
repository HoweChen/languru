import "reflect-metadata";

// Example 2: Metadata Reflection (Validation)
//
// -----------------------------------------------------------------------------
// WHY USE THIS PATTERN?
// -----------------------------------------------------------------------------
// TypeScript types disappear at runtime.
// If you mark a property as `email: string`, the runtime knows nothing about it.
//
// `reflect-metadata` allows us to "attach" hidden information to classes/properties
// and read it back later.
// This is the backbone of libraries like `class-validator` and `TypeORM`.
// -----------------------------------------------------------------------------

// We use a Symbol as a unique key to store our metadata.
const REQUIRED_METADATA_KEY = Symbol("required");

// 1. Property Decorator
// Note: This uses "Legacy/Experimental" decorators (`experimentalDecorators: true`),
// because `reflect-metadata` works best with them for now.
function Required(target: any, propertyKey: string) {
  // `target` is the Class Prototype (not the instance).
  // `propertyKey` is the name of the property (e.g., "username").
  
  // We define a hidden value on the prototype:
  // "For the property 'propertyKey', set 'REQUIRED' to true"
  Reflect.defineMetadata(REQUIRED_METADATA_KEY, true, target, propertyKey);
}

// 2. Validator Function
// This is a generic validator that works on ANY object using our decorators.
function validate(obj: any) {
  const prototype = Object.getPrototypeOf(obj);
  
  // Iterate over all keys of the instance
  for (const key of Object.keys(obj)) {
    // Check if we attached any metadata to this property on the prototype.
    const isRequired = Reflect.getMetadata(REQUIRED_METADATA_KEY, prototype, key);
    
    // If tagged as required, check if it's empty.
    if (isRequired && (obj[key] === null || obj[key] === undefined || obj[key] === "")) {
      throw new Error(`Validation Failed: Property '${key}' is required.`);
    }
  }
}

// --- Usage ---

class UserProfile {
  // We tag these properties.
  // The decorator runs ONCE when the class is defined.
  @Required
  username: string = "";

  @Required
  email: string = "";

  bio: string = ""; // Not tagged, so validation skips it.
}

const p1 = new UserProfile();
p1.username = "Alice";
// p1.email is left as empty string (default)

try {
  console.log("Validating p1...");
  validate(p1); 
  console.log("✅ p1 Valid");
} catch (e: any) {
  console.log("❌ p1 Invalid:", e.message);
}

const p2 = new UserProfile();
p2.username = "Bob";
p2.email = "bob@example.com";

try {
  console.log("Validating p2...");
  validate(p2);
  console.log("✅ p2 Valid");
} catch (e: any) {
  console.log("❌ p2 Invalid:", e.message);
}
