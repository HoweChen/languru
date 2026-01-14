// Example 5: Streaming JSON Parser (Simulated)
// Goal: Parse a HUGE JSON array (e.g. 10GB file) without loading the whole thing.
//
// Problem: 'JSON.parse()' requires the ENTIRE string in memory.
// Solution: Stream parsers (like 'stream-json' or 'bfj') read the file byte-by-byte
// and emit "Item Found" events.
//
// Below is a simplified simulation of how such a tokenizer works using Generators.

// 1. Tokenizer (Simulated)
// Imagine this reads from a 10GB file and yields small chunks.
async function* jsonStreamSimulator() {
  console.log("Stream: Start of array '['");
  yield "["; 
  
  // Simulate 5 items
  for (let i = 1; i <= 5; i++) {
    // In a real stream parser, this would be complex logic to detect matching braces '{...}'
    // and extract just that substring.
    const item = { id: i, value: `Data-${Math.random().toString(36).substring(7)}` };
    yield JSON.stringify(item);
    
    if (i < 5) yield ","; // Separator
  }
  
  console.log("Stream: End of array ']'");
  yield "]"; 
}

// 2. Stream Processor
// This logic consumes the stream. It never sees the full array [ ... ].
// It only sees one item at a time.
async function processLargeJson() {
  const stream = jsonStreamSimulator();
  
  console.log("--- Processing Started ---\n");
  
  for await (const chunk of stream) {
    // 1. Filter out structural characters (in a real parser, this is internal state)
    if (chunk === "[" || chunk === "]" || chunk === ",") {
      continue; 
    }
    
    // 2. We have an isolated JSON object string!
    try {
      const obj = JSON.parse(chunk);
      
      // 3. Process it immediately (e.g., Save to DB)
      // Memory usage is reset after this loop iteration.
      console.log(`[Importer] Saved Record #${obj.id}: ${obj.value}`);
      
    } catch (e) {
      console.error("Failed to parse chunk:", chunk);
    }
  }
  
  console.log("\n--- Processing Complete ---");
}

// --- Usage ---

// Note: In production, DO NOT write your own JSON tokenizer.
// Use:
// 1. 'stream-json' (popular, event-based)
// 2. 'bfj' (Big Friendly JSON, promise-based)
// 3. 'JSONStream' (classic)

console.log("Starting JSON Stream Simulation...");
processLargeJson();

