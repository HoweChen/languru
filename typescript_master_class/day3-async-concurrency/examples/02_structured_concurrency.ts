// Example 2: Structured Concurrency with Promise.allSettled
//
// -----------------------------------------------------------------------------
// WHY USE THIS PATTERN?
// -----------------------------------------------------------------------------
// Problem: `Promise.all([p1, p2, p3])` is "fail-fast".
// If p2 fails, the whole operation throws immediately.
//
// Real World Scenario:
// You are sending emails to 10 users.
// If User #5's email is invalid, you DON'T want to crash the whole batch.
// You want to send the other 9, and log the error for #5.
//
// Solution: `Promise.allSettled` waits for ALL tasks to finish (success or fail).
// -----------------------------------------------------------------------------

interface Result {
  id: number;
  status: string;
}

// 1. Task Simulation: Sometimes fails
async function performTask(id: number): Promise<Result> {
  const duration = Math.random() * 200;
  await new Promise(r => setTimeout(r, duration));
  
  // Simulate 30% failure rate
  if (Math.random() > 0.7) {
    throw new Error(`Task ${id} blew up!`);
  }
  
  return { id, status: "completed" };
}

async function runBatch() {
  const ids = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  console.log("Starting batch...");

  // 2. Parallel Execution
  // `Promise.allSettled` returns an array of objects:
  // { status: 'fulfilled', value: T } OR { status: 'rejected', reason: any }
  const results = await Promise.allSettled(ids.map(performTask));

  // 3. Post-processing
  // We need to separate successes from failures.
  
  // TypeScript Magic: Type Guard
  // `r is PromiseFulfilledResult<Result>` tells TS that if status === 'fulfilled',
  // then `r.value` exists and is of type `Result`.
  const successful = results
    .filter((r): r is PromiseFulfilledResult<Result> => r.status === "fulfilled")
    .map(r => r.value);
    
  const failed = results
    .filter((r): r is PromiseRejectedResult => r.status === "rejected")
    .map(r => r.reason.message);

  console.log(`\nSummary:`);
  console.log(`✅ Success: ${successful.length}`);
  console.log(`❌ Failed:  ${failed.length}`);
  
  if (failed.length > 0) {
    console.log("Failures:", failed);
    // Real-world: Push these failed IDs to a Dead Letter Queue (DLQ) or retry later.
  }
}

runBatch();
