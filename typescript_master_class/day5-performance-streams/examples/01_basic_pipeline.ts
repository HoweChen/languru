// Example 1: Basic Node.js Streams (Pipeline)
// Goal: Process large data efficiently by streaming it chunk by chunk.
//
// Why Streams?
// - Low Memory Footprint: Only a small chunk is in RAM at any time.
// - Time Efficiency: Processing starts immediately (don't wait for whole file).
// - Composability: Connect small, single-purpose streams like Lego blocks.

import { pipeline } from "node:stream/promises"; // Use 'node:' prefix for explicit built-ins
import { Readable, Transform, Writable } from "node:stream";

// 1. Source (Readable): Generates numbers
// We use an async generator because it's the cleanest way to create a Readable stream in modern Node.js.
// Internally, 'Readable.from()' wraps this generator.
async function* generateNumbers() {
  console.log("Generator: Starting...");
  for (let i = 1; i <= 20; i++) {
    // Simulating some async work to generate data
    await new Promise(resolve => setTimeout(resolve, 10));
    yield String(i);
  }
}

// 2. Transform: Doubles the number
// Transform streams sit in the middle: Input -> Modify -> Output.
// 'objectMode: true' allows us to pass JS objects/strings instead of just raw Buffers.
const doubleNumbers = new Transform({
  objectMode: true, 
  transform(chunk, encoding, callback) {
    const num = parseInt(chunk.toString());
    const doubled = num * 2;
    
    // this.push() sends data to the next stream in the pipeline
    this.push(String(doubled));
    
    // callback() signals "I am done with this chunk, send me the next one"
    callback();
  },
});

// 3. Sink (Writable): Prints to console
// Writable streams are the end of the line (File, Network Socket, stdout).
const printResult = new Writable({
  objectMode: true,
  write(chunk, encoding, callback) {
    process.stdout.write(`${chunk} -> `);
    
    // Simulate slow IO (e.g., writing to a slow database).
    // The pipeline will automatically slow down the 'generateNumbers' source
    // to match this speed. This is BACKPRESSURE in action.
    setTimeout(callback, 50);
  },
});

// --- Usage ---

async function run() {
  console.log("Starting pipeline...");
  
  try {
    // Why 'pipeline' and not '.pipe()'?
    // .pipe() is unsafe. If a stream in the middle errors, streams before it
    // don't close, causing memory leaks.
    // 'pipeline' (especially the Promise version) ensures proper cleanup of ALL streams
    // if ANY stream fails or completes.
    await pipeline(
      Readable.from(generateNumbers()), // Source
      doubleNumbers,                    // Transform
      printResult                       // Destination
    );
    console.log("\nPipeline succeeded.");
  } catch (err) {
    console.error("Pipeline failed", err);
  }
}

run();
