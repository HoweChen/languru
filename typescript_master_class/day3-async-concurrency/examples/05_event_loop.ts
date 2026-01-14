// Example 5: Event Loop Blocking (and how to avoid it)
//
// -----------------------------------------------------------------------------
// WHY USE THIS PATTERN?
// -----------------------------------------------------------------------------
// Node.js is Single Threaded.
// If you run a `while(true)` loop, the ENTIRE server freezes.
// No HTTP requests, no DB callbacks, no timers. NOTHING works.
//
// To handle heavy CPU tasks (Crypto, Image Processing, Large JSON),
// you must "yield" control back to the Event Loop periodically.
// -----------------------------------------------------------------------------

import { performance } from "perf_hooks";

// 1. Heavy Blocking Task
// This simulates "Bad Code".
function blockingTask() {
  const start = performance.now();
  console.log("🔴 Blocking task started...");
  
  // Simulate heavy CPU work (e.g. crypto, large JSON parse)
  // This loop monopolizes the CPU. The Event Loop is stuck here.
  while (performance.now() - start < 1000) {
    // block for 1s
  }
  
  console.log("🔴 Blocking task finished.");
}

// 2. Non-Blocking Task (Chunked)
// We break the work into small chunks and yield to the event loop in between.
async function nonBlockingTask() {
  console.log("🟢 Non-blocking task started...");
  
  for (let i = 0; i < 10; i++) {
    // Simulate 100ms of work (small chunk)
    const chunkStart = performance.now();
    while (performance.now() - chunkStart < 100) {}
    
    // YIELD to event loop!
    // `setImmediate` puts this callback at the END of the current event loop queue.
    // This gives I/O events, timers, and incoming requests a chance to run.
    await new Promise(resolve => setTimeout(resolve, 0)); 
  }
  
  console.log("🟢 Non-blocking task finished.");
}

// --- Usage ---

async function run() {
  // Scenario: Ping interval (heartbeat)
  // This represents "Other Users" or "Health Checks".
  // If the loop is blocked, this ping won't print!
  const timer = setInterval(() => {
    console.log("   ⏰ Tick (Event Loop is alive!)");
  }, 200);

  // A. Run blocking
  console.log("\n--- A: Blocking ---");
  blockingTask();
  // RESULT: "Tick" does NOT appear during the blocking task.
  // The server effectively "died" for 1 second.

  await new Promise(r => setTimeout(r, 500)); // Cool down

  // B. Run non-blocking
  console.log("\n--- B: Non-Blocking ---");
  await nonBlockingTask();
  // RESULT: "Tick" DOES appear interleaved with the work!
  // The server remains responsive.

  clearInterval(timer);
}

run();
