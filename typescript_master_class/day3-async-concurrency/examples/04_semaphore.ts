// Example 4: Concurrency Control (Semaphore Pattern)
//
// -----------------------------------------------------------------------------
// WHY USE THIS PATTERN?
// -----------------------------------------------------------------------------
// Unbounded concurrency is a common cause of production outages.
// - `Promise.all(10000_items)` -> Fires 10,000 requests instantly.
// - Database crashes (Too many connections).
// - API Rate Limit exceeded (HTTP 429).
// - Server runs out of RAM.
//
// A Semaphore acts like a bouncer at a club:
// "Only N people allowed inside at once."
// -----------------------------------------------------------------------------

class Semaphore {
  private tasks: (() => void)[] = [];
  private activeCount = 0;

  constructor(private readonly maxConcurrent: number) {}

  // "Lock"
  // If slots are full, returns a Promise that resolves ONLY when a slot opens.
  async acquire(): Promise<void> {
    if (this.activeCount < this.maxConcurrent) {
      this.activeCount++;
      return;
    }

    // Wait in queue
    // We create a "Resolver" function and push it to the queue.
    // The promise will hang here until someone calls this resolver.
    await new Promise<void>(resolve => this.tasks.push(resolve));
    
    // Once woken up, we are "active" (slot transferred from releaser to us)
    // Note: In this specific implementation, the releaser doesn't decrement if it wakes someone up.
    // But for safety and clarity in `acquire`, we can consider ourselves "active".
  }

  // "Unlock"
  // Frees a slot. If someone is waiting, let them in immediately.
  release(): void {
    if (this.tasks.length > 0) {
      // Hand over the baton to the next task.
      // We DO NOT decrement activeCount, because the next task immediately replaces us.
      const nextTask = this.tasks.shift();
      nextTask!(); 
    } else {
      // No one waiting, so we actually free up a slot.
      this.activeCount--;
    }
  }

  // High-level Helper: "Run this function while holding the lock"
  // This is the preferred way to use Semaphores (RAII pattern style).
  // It guarantees `release()` is called even if `fn()` throws.
  async runExclusive<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

// --- Usage ---

// Real World: limiting DB pool connections or 3rd party API calls.
const dbLimiter = new Semaphore(2); // Only 2 parallel queries

async function queryDB(id: number) {
  console.log(`[Task ${id}] Waiting for slot...`);
  
  // Usage is clean: "Run this block exclusively"
  await dbLimiter.runExclusive(async () => {
    console.log(`[Task ${id}] Acquired! Running...`);
    await new Promise(r => setTimeout(r, 500)); // Simulate slow query
    console.log(`[Task ${id}] Done.`);
  });
}

// Fire 5 tasks at once
// You should see only 2 running at a time.
// Log output will show pairs of tasks completing.
Promise.all([1, 2, 3, 4, 5].map(queryDB));
