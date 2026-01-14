# Day 5: High-Performance IO & Streams

Welcome to Day 5. Today we separate the amateurs from the pros.
If you load a 1GB file into memory with `fs.readFileSync`, your server crashes.
If you use Streams, you can process 1TB of data on a Raspberry Pi.

Streams are the backbone of Node.js performance. They allow you to process data piece-by-piece without keeping it all in memory. This is critical for file uploads, data migrations, and high-throughput microservices.

## 📚 Curriculum

1.  **Node.js Streams**: Understanding Readable, Writable, and Transform streams.
2.  **Backpressure**: The art of saying "Stop, I'm full!" to fast producers.
3.  **Pipelines**: Composing streams safely with automatic error handling.
4.  **Binary Buffers**: Manipulating raw bytes for custom protocols.
5.  **Streaming JSON**: Parsing massive datasets item-by-item.

## 🧠 Key Concepts & Snippets

### 1. The Golden Rule: `stream.pipeline`
Never manually pipe streams (`a.pipe(b).pipe(c)`). If `b` fails, `a` keeps pumping data, and `c` hangs. `pipeline` handles cleanup for you.

```typescript
import { pipeline } from 'node:stream/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { createGzip } from 'node:zlib';

await pipeline(
  createReadStream('input.txt'),
  createGzip(),
  createWriteStream('input.txt.gz')
);
console.log('Done securely!');
```

### 2. Handling Backpressure (The "Slow Consumer" Problem)
If the writer returns `false`, the buffer is full. STOP writing and wait for `drain`.

```typescript
// Inside a Writable stream _write method
_write(chunk, encoding, callback) {
  if (isSystemOverloaded()) {
    // Hold the callback until system recovers
    setTimeout(() => {
      processChunk(chunk);
      callback(); // Signal we are ready for more
    }, 1000);
  } else {
    processChunk(chunk);
    callback();
  }
}
```

### 3. Generators as Streams
Node.js Readable streams are fully compatible with async generators. This is the modern, readable way to write streams.

```typescript
import { Readable } from 'node:stream';

async function* generateData() {
  for (let i = 0; i < 1000; i++) {
    yield `data-${i}\n`; // Yield chunks
  }
}

const readable = Readable.from(generateData());
```

## ✅ Dos and Don'ts

| Do | Don't |
| :--- | :--- |
| **Do** use `stream.pipeline` for error safety.<br> ```typescript import { pipeline } from 'stream/promises'; await pipeline(src, transform, dest); ``` | **Don't** use `.pipe()` without error handlers.<br> ```typescript // ❌ If dest fails, src keeps pumping src.pipe(dest); // No error handling! ``` |
| **Do** use `Buffer` for binary.<br> ```typescript const header = Buffer.alloc(4); header.writeUInt32BE(1024, 0); ``` | **Don't** use strings for binary data.<br> ```typescript // ❌ Corrupts images/PDFs const png = fs.read() + ""; ``` |
| **Do** respect backpressure.<br> ```typescript if (!stream.write(chunk)) { await once(stream, 'drain'); } ``` | **Don't** ignore `write()` return value.<br> ```typescript // ❌ Causes Out-Of-Memory while(true) stream.write(bigData); ``` |
| **Do** use Async Generators.<br> ```typescript Readable.from(async function*() { yield 'chunk'; }); ``` | **Don't** implement `_read` manually.<br> ```typescript // ❌ Hard to get right class MyStream extends Readable { _read() { ... } } ``` |
| **Do** use streaming JSON parsers.<br> ```typescript pipeline(fs.createReadStream('big.json'), streamJson(), ...) ``` | **Don't** parse massive JSON strings.<br> ```typescript // ❌ Crashes on 1GB files JSON.parse(fs.readFileSync('big.json')); ``` |

## 🛠 Examples Explained

### [01_basic_pipeline.ts](./examples/01_basic_pipeline.ts)
The "Hello World" of streams. Generates numbers, transforms them, and prints them.
**Key Takeaway**: Shows how to use `Readable.from` with an async generator and process it with a Transform stream.

### [02_backpressure.ts](./examples/02_backpressure.ts)
Visualizes backpressure.
**Key Takeaway**: Watch how the producer pauses automatically when the consumer gets stuck simulating a slow DB write. This prevents memory overflows.

### [03_csv_stream.ts](./examples/03_csv_stream.ts)
A real-world use case: Reading a CSV, validating rows, and transforming them.
**Key Takeaway**: This is the standard pattern for "User Bulk Upload" features. It validates line-by-line without loading the file.

### [04_buffer_binary.ts](./examples/04_buffer_binary.ts)
Shows how to parse a custom binary protocol (Header + Length + Payload).
**Key Takeaway**: Sometimes you need raw speed or need to talk to C++ services. `Buffer.readUInt16BE` etc. are your friends here.

### [05_json_stream.ts](./examples/05_json_stream.ts)
Simulates streaming a large JSON array.
**Key Takeaway**: Instead of `JSON.parse(hugeString)`, we yield objects one by one. This allows parsing multi-GB JSON files with constant memory usage.

---

## 🏃‍♀️ Running the Examples

```bash
bun run examples/01_basic_pipeline.ts
bun run examples/02_backpressure.ts
# ... and so on
```
