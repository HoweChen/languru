// Example 3: CSV Parsing Stream
// Goal: Parse a massive CSV file line-by-line using streams, transforming data, and validating it efficiently.
//
// Scenario:
// You have a 2GB CSV file of users to import.
// Naive Approach: Read file to string -> split by newline -> loop.
// Result: Crash (OOM).
// Stream Approach: Read chunk -> Parse line -> Transform -> Write to DB/File.
// Result: Constant memory usage (approx 10MB), regardless of file size.

import { parse } from "csv-parse";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

// 1. Mock CSV Data Generator
// In a real app, this would be fs.createReadStream('users.csv')
async function* generateCsvData() {
  console.log("Reading CSV data...");
  yield "id,name,email\n";
  yield "1,Alice,alice@example.com\n";
  yield "2,Bob,bob@example.com\n";
  yield "3,Charlie,invalid-email\n"; // Bad data
  yield "4,Dave,dave@example.com\n";
  // Imagine millions of lines here...
}

// 2. Transformer: Business Logic & Validation
// Transform streams are excellent for "ETL" (Extract, Transform, Load) pipelines.
const processUser = new Transform({
  objectMode: true, // We receive Objects from csv-parse, not Buffers
  transform(record, encoding, callback) {
    // 'record' is { id: '1', name: 'Alice', ... } thanks to csv-parse
    
    // VALIDATION STEP
    if (!record.email.includes("@")) {
      console.warn(`[WARN] Skipping invalid email for user ${record.name}`);
      callback(); // Skip this record (don't call this.push)
      return;
    }

    // TRANSFORMATION STEP
    const user = {
      id: parseInt(record.id),
      name: record.name.toUpperCase(), 
      email: record.email,
      processedAt: new Date().toISOString()
    };

    // Output valid JSON string for the next stream
    this.push(JSON.stringify(user) + "\n");
    callback();
  }
});

// --- Usage ---

async function run() {
  console.log("Starting CSV Processing Pipeline...\n");
  
  try {
    // The Pipeline:
    // Source (CSV Text) -> Parser (Raw Text to Objects) -> Logic (Objects to JSON String) -> Output (Stdout/File)
    await pipeline(
      Readable.from(generateCsvData()),
      
      // csv-parse is a stream! It accepts chunks of text and emits chunks of Objects (rows).
      // columns: true -> Use first line as header keys
      parse({ columns: true, trim: true }), 
      
      processUser,
      
      process.stdout
    );
    
    console.log("\nCSV Processing Complete.");
  } catch (error) {
    console.error("Pipeline failed:", error);
  }
}

run();
