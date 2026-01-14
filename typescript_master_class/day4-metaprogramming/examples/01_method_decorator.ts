// Example 1: Basic Method Decorator (Logging)
//
// -----------------------------------------------------------------------------
// WHY USE THIS PATTERN?
// -----------------------------------------------------------------------------
// Aspect Oriented Programming (AOP).
// You want to log EVERYTHING, but you don't want to write `console.log` in 
// every single function.
//
// A Decorator wraps your function, running code "before" and "after" it.
// -----------------------------------------------------------------------------

// Note: This uses the NEW Standard Decorators (TS 5.0+ / TC39 Stage 3).
// They are different from the "experimentalDecorators" used by NestJS/Angular.

// 1. The Decorator Function
// `target`: The original method function.
// `context`: Metadata about the method (name, private/public, static, etc).
function LogExecutionTime<This, Args extends any[], Return>(
  target: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) {
  const methodName = String(context.name);

  // We return a NEW function that replaces the original one.
  return function (this: This, ...args: Args): Return {
    // "Before" Logic
    console.log(`[LOG] Starting ${methodName}...`);
    const start = performance.now();
    
    try {
      // Execute original method (using .call to preserve 'this')
      const result = target.call(this, ...args);
      
      // "After" Logic (Success)
      const end = performance.now();
      console.log(`[LOG] Finished ${methodName} in ${(end - start).toFixed(2)}ms`);
      return result;
    } catch (e) {
      // "After" Logic (Error)
      console.error(`[LOG] Error in ${methodName}:`, e);
      throw e;
    }
  };
}

// --- Usage ---

class UserService {
  // Apply the decorator.
  // Effectively: processUser = LogExecutionTime(processUser)
  @LogExecutionTime
  processUser(id: number) {
    // Simulate work (Blocking CPU)
    for (let i = 0; i < 1_000_000; i++) {} 
    return `User ${id} processed`;
  }
  
  @LogExecutionTime
  throwSomething() {
    throw new Error("Oops");
  }
}

const service = new UserService();

console.log("--- Run 1: Success ---");
service.processUser(101);

console.log("\n--- Run 2: Error ---");
try {
  service.throwSomething();
} catch {}
