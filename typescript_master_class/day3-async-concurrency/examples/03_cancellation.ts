// Example 3: AbortController for Cancellation
//
// -----------------------------------------------------------------------------
// WHY USE THIS PATTERN?
// -----------------------------------------------------------------------------
// "Fire and Forget" is dangerous in backends.
// - User clicks "Search", then changes mind and clicks "Home".
// - The backend is still searching.
// - Multiply by 10k users = Server Overload.
//
// `AbortController` is the STANDARD web API (Browser + Node/Bun) to stop work.
// ALWAYS pass `signal` to async functions.
// -----------------------------------------------------------------------------

import fetch from "node-fetch";

// 1. Cancellable Task
// This function accepts an `AbortSignal`. It is responsible for checking it.
async function expensiveCalculation(signal: AbortSignal): Promise<string> {
  console.log("Calculation started...");
  
  // Simulation: A loop checking signal
  for (let i = 0; i < 10; i++) {
    
    // CHECKPOINT:
    // Ideally, check `signal.aborted` before every heavy operation or await.
    if (signal.aborted) {
      console.log("Cleanup: closing database connections...");
      // Throwing 'Aborted' allows the caller to distinguish cancellation from crash.
      throw new Error("Aborted");
    }
    
    await new Promise(r => setTimeout(r, 100));
    process.stdout.write(".");
  }
  
  console.log(" Done!");
  return "42";
}

// 2. Integration with fetch (The most common use case)
// Fetch natively supports AbortSignal. This effectively implements a Request Timeout.
async function fetchWithTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController();
  
  // If X ms passes, abort the controller.
  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    // Pass the signal to fetch.
    // If aborted, fetch throws an 'AbortError' immediately.
    const response = await fetch(url, { signal: controller.signal as any }); 
    return await response.text();
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error("\nRequest timed out!");
    } else {
      console.error("\nRequest failed:", error.message);
    }
  } finally {
    // CRITICAL: Clear the timeout if the request succeeds!
    // Otherwise, the timer keeps the process alive (in Node).
    clearTimeout(timeout);
  }
}

// --- Usage ---

async function run() {
  // Scenario A: Manual Cancel
  const ac = new AbortController();
  
  console.log("--- Scenario A: Manual Cancel ---");
  const task = expensiveCalculation(ac.signal);
  
  // Simulate user clicking "Cancel" button after 300ms
  setTimeout(() => {
    console.log("\nCancelling task...");
    ac.abort(); // Triggers signal.aborted = true
  }, 300);

  try {
    await task;
  } catch (e: any) {
    console.log("Task result:", e.message);
  }

  // Scenario B: Timeout
  // console.log("\n--- Scenario B: Fetch Timeout ---");
  // await fetchWithTimeout("https://httpbin.org/delay/5", 1000); // Should timeout
}

run();
