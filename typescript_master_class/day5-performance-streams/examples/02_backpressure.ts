// Example 2: Backpressure Handling
// Goal: Demonstrate what happens when the producer is faster than the consumer.
//
// What is Backpressure?
// Imagine pouring water into a funnel. If you pour too fast, it overflows (Out of Memory).
// Backpressure is the funnel telling you "Stop pouring!" until it drains a bit.
//
// In Node.js:
// 1. stream.write() returns 'false' if the buffer is full.
// 2. The writer MUST pause.
// 3. The writer waits for the 'drain' event to resume.

import { Readable, Writable } from "node:stream";

// 1. Fast Producer
// A stream that produces data as fast as CPU allows.
class FastSource extends Readable {
  private count = 0;

  _read(size: number) {
    this.count++;
    if (this.count > 100) { // Reduced to 100 for clearer demo
      this.push(null); // End of stream
      return;
    }
    
    // We create a chunk of data
    const chunk = `Data-${this.count}`;
    
    // this.push() adds data to the internal read buffer.
    // IMPORTANT: It returns FALSE if the internal buffer is full.
    // Node.js manages this automatically when you use .pipe() or stream.pipeline().
    // If we were manually writing, we'd have to check this boolean.
    const canPushMore = this.push(chunk);
    
    if (!canPushMore) {
       console.log(`[Source] Buffer full at ${this.count}! Node.js will pause me automatically.`);
    } else {
       // console.log(`[Source] Pushed ${this.count}`);
    }
  }
}

// 2. Slow Consumer
// A stream that simulates a slow operation (Disk I/O, Network request).
class SlowSink extends Writable {
  constructor() {
    // highWaterMark controls the buffer size. 
    // We set it low (16 bytes) to trigger backpressure quickly for this demo.
    super({ highWaterMark: 16 }); 
  }

  _write(chunk: any, encoding: string, callback: () => void) {
    console.log(`[Sink]   Received ${chunk.toString()}. Processing...`);
    
    // Simulate slow processing (e.g. writing to DB takes 50ms)
    setTimeout(() => {
      console.log(`[Sink]   Done with ${chunk.toString()}`);
      
      // callback() tells the stream: "I'm ready for the next chunk".
      // If the buffer was full, this triggers the 'drain' event upstream.
      callback(); 
    }, 50);
  }
}

// --- Usage ---

const source = new FastSource();
const sink = new SlowSink();

console.log("Starting Backpressure Demo...");

// We use .pipe() here to demonstrate the automatic flow control.
// 1. Source pushes data.
// 2. Sink accepts data.
// 3. Sink gets slow -> buffer fills up.
// 4. Source sees buffer full -> PAUSES generation (no more _read calls).
// 5. Sink finishes processing -> buffer empties.
// 6. 'drain' event fires -> Source RESUMES generation.
source.pipe(sink);

sink.on('finish', () => {
  console.log("\nDone. Notice how the Source paused/resumed to match the Sink's speed.");
});

