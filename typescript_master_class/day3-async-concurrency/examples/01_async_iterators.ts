// Example 1: Async Iterators (for await...of)
//
// -----------------------------------------------------------------------------
// WHY USE THIS PATTERN?
// -----------------------------------------------------------------------------
// Imagine fetching 1,000,000 rows from a DB or API.
// ❌ Naive approach: Fetch all, store in array, loop. (Crash due to Out Of Memory)
// ✅ Async Iterator: Fetch 1 page, yield items 1-by-1, fetch next page ONLY when needed.
//
// This separates "How to get data" (Generator) from "What to do with it" (Consumer).
// -----------------------------------------------------------------------------

interface Page {
  nextCursor?: string;
  items: string[];
}

// 1. Simulator: A fake paginated API
// Simulates a service that returns data in chunks (pages).
async function fetchPage(cursor?: string): Promise<Page> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));

  if (!cursor) return { nextCursor: "page-2", items: ["A", "B"] };
  if (cursor === "page-2") return { nextCursor: "page-3", items: ["C", "D"] };
  if (cursor === "page-3") return { items: ["E"] }; // No next cursor = end
  return { items: [] };
}

// 2. The Async Generator (function*)
// Key Keyword: `async function*`
// This function returns an `AsyncIterable`.
// It maintains its own internal state (cursor) between calls.
async function* itemStream() {
  let cursor: string | undefined = undefined;
  
  while (true) {
    console.log(`\nFetching page with cursor: ${cursor || "START"}`);
    const page: Page = await fetchPage(cursor);
    
    // YIELD keyword:
    // Pauses this function execution and gives a value to the caller.
    // When the caller asks for "next", this function resumes right here.
    
    // We can yield items one by one.
    // The consumer treats this as a flat stream of items, ignoring page boundaries.
    for (const item of page.items) {
      yield item;
    }

    if (!page.nextCursor) break;
    cursor = page.nextCursor;
  }
}

// --- Usage ---

async function consume() {
  console.log("Starting processing...");

  // "for await...of" is the specialized loop for AsyncIterables.
  // It effectively:
  // 1. Calls generator.next()
  // 2. Awaits the promise
  // 3. Gives you the value
  // 4. Repeats until generator is done
  
  for await (const item of itemStream()) {
    process.stdout.write(`Processing item: ${item} -> `);
    // Simulate work
    await new Promise(r => setTimeout(r, 50));
    console.log("Done");
  }
  console.log("\nAll items processed.");
}

consume();
