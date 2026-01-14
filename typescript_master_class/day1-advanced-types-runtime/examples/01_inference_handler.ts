// Example 1: Type-Safe API Handler Wrapper using Conditional Types & Inference
// Goal: Create a wrapper that automatically infers the return type of a backend handler and standardizes the response.

// 1. Define a standardized API Response structure
type ApiResponse<T> = {
  success: true;
  data: T;
  timestamp: number;
} | {
  success: false;
  error: string;
  code: number;
};

// 2. Define a Handler type. It can be sync or async.
type Handler<TArgs extends any[], TReturn> = (...args: TArgs) => TReturn | Promise<TReturn>;

// 3. Conditional Type to unwrap Promise if necessary (built-in Awaited is similar, but let's build our own for learning)
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

// 4. Higher-order function to wrap handlers
// notice the Generic Type Inference happening here.
export function createSafeHandler<TArgs extends any[], TReturn>(
  fn: Handler<TArgs, TReturn>
) {
  return async (...args: TArgs): Promise<ApiResponse<UnwrapPromise<TReturn>>> => {
    try {
      // Execute the handler
      const result = await fn(...args);
      
      return {
        success: true,
        data: result as UnwrapPromise<TReturn>, // TS sometimes needs help here, but logic holds
        timestamp: Date.now(),
      };
    } catch (e: any) {
      console.error("Handler error:", e);
      return {
        success: false,
        error: e.message || "Internal Server Error",
        code: 500,
      };
    }
  };
}

// --- Usage ---

interface User {
  id: number;
  name: string;
}

// A sample backend function
const getUser = async (id: number): Promise<User> => {
  if (id < 0) throw new Error("Invalid ID");
  return { id, name: "Alice" };
};

// Wrap it
const safeGetUser = createSafeHandler(getUser);

// inferred type of safeGetUser: (id: number) => Promise<ApiResponse<User>>
async function run() {
  const result = await safeGetUser(1);
  if (result.success) {
    console.log("User:", result.data.name); // data is typed as User
  } else {
    console.error("Error:", result.error);
  }
}

run();
