# Day 3: Async Patterns & Concurrency

Welcome to Day 3. Today we tackle the single most important aspect of Node.js/Bun backends: **Asynchrony**.

While `async/await` is easy to start with, mastering concurrency requires understanding how to process streams efficiently, limit parallelism to avoid crashing services, and cancel operations that are no longer needed.

## 📚 Key Concepts

### 1. Async Iterators (`for await...of`)
Standard arrays work for small data, but for large datasets (DB rows, file lines, API pages), you need streams. Async Generators allow you to pull data one item at a time, keeping memory usage low.

### 2. Structured Concurrency (Cancellation)
In many backends, we fire off promises and forget them. "Structured Concurrency" means managing the *lifetime* of these tasks. If a user closes the browser, we should cancel the expensive DB query they triggered. `AbortController` is the standard way to do this.

### 3. Concurrency Control (Semaphores)
Launching 10,000 DB requests in parallel with `Promise.all` will crash your database. A **Semaphore** (or Rate Limiter) restricts how many tasks run at once (e.g., "max 5 concurrent requests").

### 4. The Event Loop
JavaScript is single-threaded. CPU-intensive code blocks the *entire* server. We must learn to "yield" to the event loop so the server remains responsive.

---

## ✅ Dos and Don'ts

| Category | Do ✅ | Don't ❌ |
|----------|-------|----------|
| **Loops** | **Do** Use `for await...of` for streams. <br> `for await (const row of dbStream) { ... }` | **Don't** Load huge data into arrays. <br> `const rows = await getAll(); // OOM Risk` |
| **Parallelism** | **Do** Use concurrency limits. <br> `const limit = pLimit(5);` | **Don't** Use unbounded `Promise.all`. <br> `Promise.all(files.map(upload)); // Network flood` |
| **Errors** | **Do** Use `Promise.allSettled`. <br> `const results = await Promise.allSettled(jobs);` | **Don't** Let one failure crash the batch. <br> `Promise.all(jobs); // Fails fast` |
| **Timeouts** | **Do** Use `AbortSignal`. <br> `fetch(url, { signal: AbortSignal.timeout(5000) })` | **Don't** Let requests hang forever. |
| **Blocking** | **Do** Yield with `setImmediate`. <br> `await new Promise(setImmediate);` | **Don't** Block the main thread. <br> `while(true) {} // Freezes server` |

---

## 💡 Key Snippets

### The "Safe" Parallel Map (Semaphore)
Limits concurrency to avoid overloading downstream services.

```typescript
async function processBatch<T, R>(
  items: T[], 
  limit: number, 
  fn: (item: T) => Promise<R>
) {
  const results: Promise<R>[] = [];
  const executing: Promise<void>[] = [];

  for (const item of items) {
    const p = fn(item);
    results.push(p);

    // Keep track of executing promises
    const e: Promise<void> = p.then(() => {
      executing.splice(executing.indexOf(e), 1);
    });
    executing.push(e);

    // If we hit the limit, wait for one to finish
    if (executing.length >= limit) {
      await Promise.race(executing);
    }
  }

  return Promise.all(results);
}
```

### Async Generators (Streaming)
Perfect for paginated APIs.

```typescript
async function* fetchPages(url: string) {
  let nextUrl: string | null = url;
  while (nextUrl) {
    const response = await fetch(nextUrl);
    const data = await response.json();
    nextUrl = data.nextPage; // API specific
    
    // Yield individual items, not the whole page array
    for (const item of data.items) {
      yield item;
    }
  }
}

// Usage
for await (const item of fetchPages('/api/users')) {
  console.log(item); // Efficiently processes one by one
}
```

---

## 🛠 Examples Explained

| File | Description |
|------|-------------|
| **[01_async_iterators.ts](./examples/01_async_iterators.ts)** | Implements a simulated paginated API consumer using Async Generators. Abstracts "page fetching" logic. |
| **[02_structured_concurrency.ts](./examples/02_structured_concurrency.ts)** | Using `Promise.allSettled` to handle batch jobs where individual failures shouldn't stop the whole batch. |
| **[03_cancellation.ts](./examples/03_cancellation.ts)** | Using `AbortController` to cancel async tasks (simulating a timeout or user cancellation). |
| **[04_semaphore.ts](./examples/04_semaphore.ts)** | Implementing a Semaphore to control concurrency (e.g., max 3 active tasks). |
| **[05_event_loop.ts](./examples/05_event_loop.ts)** | A visual demonstration of blocking vs non-blocking code. Shows how to keep the "Heartbeat" alive. |

## 🏃‍♀️ Running the Examples

```bash
bun run examples/01_async_iterators.ts
bun run examples/03_cancellation.ts
bun run examples/05_event_loop.ts
```
