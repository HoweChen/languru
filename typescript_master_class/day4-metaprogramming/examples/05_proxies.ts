// Example 5: Proxies for Dynamic interception
//
// -----------------------------------------------------------------------------
// WHY USE THIS PATTERN?
// -----------------------------------------------------------------------------
// Sometimes you don't know the method names at compile time.
//
// Examples:
// - ORMs (`findByName`, `findByEmail`) - methods generated from column names.
// - RPC Clients - converting method calls to network requests.
// - Mocking libraries - recording all calls made to an object.
//
// A Proxy sits between you and the object, intercepting EVERY operation.
// -----------------------------------------------------------------------------

interface APIClient {
  // Index signature telling TS: "This object has any string property, which is an async function"
  [endpoint: string]: () => Promise<string>;
}

// 1. The Proxy Handler
// We want to create an API client where `client.getUsers()` automatically triggers a fetch to `/getUsers`.
// No need to define every method manually!

const dynamicClient = new Proxy({} as APIClient, {
  // Trap for "Property Access" (get)
  get(target, prop, receiver) {
    // 'prop' is the name of the property being accessed (e.g., "getUsers")
    
    // Safety check: avoid intercepting Symbols or non-string keys
    if (typeof prop === "string") {
      console.log(`[Proxy] Intercepted access to: ${prop}`);
      
      // Instead of returning a value, we return a FUNCTION.
      // This is what makes `client.getUsers()` work.
      return async () => {
        console.log(`[Proxy] Simulating fetch to /api/${prop}`);
        return `Response from ${prop}`;
      };
    }
    
    // Default behavior for everything else (toString, valueOf, etc)
    return Reflect.get(target, prop, receiver);
  },
});

// --- Usage ---

async function run() {
  // We never defined 'getUsers' or 'getOrders' on an object, but they exist!
  // The Proxy "magically" handles them.
  
  console.log("Calling getUsers...");
  const users = await dynamicClient.getUsers();
  console.log("Result:", users);
  
  console.log("\nCalling getOrders...");
  const orders = await dynamicClient.getOrders();
  console.log("Result:", orders);
}

run();
