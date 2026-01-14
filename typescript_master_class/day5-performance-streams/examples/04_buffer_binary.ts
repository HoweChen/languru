// Example 4: Buffer Manipulation (Binary Protocol)
// Goal: Parse a custom binary protocol manually using Buffers.
//
// Why Binary?
// JSON is verbose. {"type":"PING"} is 15 bytes. 
// A binary PING might be just 1 byte (0x01).
// High-performance systems (Game Servers, IoT, Finance) use binary protocols.
//
// Protocol Format:
// [Header: 1 byte (type)] [Length: 2 bytes (uint16 big-endian)] [Payload: N bytes]

import { Buffer } from "node:buffer";

// 1. Packet Types
const PACKET_TYPE = {
  PING: 0x01,
  MSG: 0x02,
};

// 2. Decoder Function
// This simulates a TCP stream parser. It looks at a buffer and tries to
// extract complete messages.
function decodePacket(buf: Buffer) {
  let offset = 0;
  
  while (offset < buf.length) {
    // Check 1: Do we have enough bytes for the header? (Type + Length = 3 bytes)
    if (buf.length - offset < 3) {
      console.log("-> Waiting for more data (Incomplete Header)...");
      break; 
    }
    
    // Read Type (1 byte)
    const type = buf.readUInt8(offset);
    
    // Read Length (2 bytes, Big Endian)
    // Big Endian is standard for network protocols.
    const length = buf.readUInt16BE(offset + 1);
    
    // Check 2: Do we have the full payload?
    const packetEnd = offset + 3 + length;
    if (buf.length < packetEnd) {
      console.log("-> Waiting for more data (Incomplete Payload)...");
      break; 
    }
    
    // Extract Payload (Zero-copy slice if possible)
    // .subarray returns a view of the same memory (fast!)
    const payload = buf.subarray(offset + 3, packetEnd);
    
    // Move offset for next iteration
    offset = packetEnd;
    
    // Handle Packet
    if (type === PACKET_TYPE.PING) {
      console.log(`[Packet] PING (Len: ${length})`);
    } else if (type === PACKET_TYPE.MSG) {
      console.log(`[Packet] MSG: "${payload.toString('utf-8')}"`);
    } else {
      console.log(`[Packet] Unknown Type: ${type}`);
    }
  }
}

// --- Usage ---

console.log("Building Binary Packets...");

// We allocate a fixed buffer. In real streams, chunks come in dynamically.
const buffer = Buffer.alloc(100);
let writeOffset = 0;

// Write Packet 1: PING
// [0x01] [0x00, 0x00]
buffer.writeUInt8(PACKET_TYPE.PING, writeOffset++);
buffer.writeUInt16BE(0, writeOffset); 
writeOffset += 2;

// Write Packet 2: MSG "Hello"
// [0x02] [0x00, 0x05] [H, e, l, l, o]
const msg = "Hello";
const msgLen = Buffer.byteLength(msg);

buffer.writeUInt8(PACKET_TYPE.MSG, writeOffset++);
buffer.writeUInt16BE(msgLen, writeOffset); 
writeOffset += 2;
buffer.write(msg, writeOffset); 
writeOffset += msgLen;

// Pass the raw buffer to decoder
console.log(`\nRaw Buffer Content (<Buffer ${buffer.subarray(0, writeOffset).toString('hex')}>)`);
decodePacket(buffer.subarray(0, writeOffset));

