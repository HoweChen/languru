// Example 4: Template Literal Types for Dynamic Event Systems
// Goal: Create a type-safe event emitter where event names are strictly validated based on resource names.

type Resource = "User" | "Order" | "Product";
type Action = "created" | "updated" | "deleted";

// 1. Template Literal Types: Combinatorial explosion of strings!
// This generates: "User:created" | "User:updated" | "User:deleted" | "Order:created" ...
type EventName = `${Resource}:${Action}`;

// 2. Derive Payload types based on the event name using Conditional Types
// This is simulating a complex backend event bus where each event carries specific data.
type EventPayload<T extends EventName> = 
  T extends `${infer R}:created` ? { id: string; timestamp: number; newResource: boolean } :
  T extends `${infer R}:updated` ? { id: string; changes: string[] } :
  { id: string; reason: string }; // deleted

// 3. Typed Event Bus Interface
interface EventBus {
  // The 'on' method uses the generic T to enforce that the callback 'payload' matches the 'event'
  on<T extends EventName>(event: T, callback: (payload: EventPayload<T>) => void): void;
  emit<T extends EventName>(event: T, payload: EventPayload<T>): void;
}

// 4. Implementation
class SimpleBus implements EventBus {
  on<T extends EventName>(event: T, callback: (payload: EventPayload<T>) => void): void {
    console.log(`Subscribed to ${event}`);
  }
  
  emit<T extends EventName>(event: T, payload: EventPayload<T>): void {
    console.log(`Emitting ${event}`, payload);
  }
}

// --- Usage ---

const bus = new SimpleBus();

// Correct Usage
bus.on("User:created", (payload) => {
  // TS knows payload is { id: string; timestamp: number; newResource: boolean }
  console.log(payload.newResource); 
});

bus.emit("Order:updated", {
  id: "order-1",
  changes: ["status"]
});

// Incorrect Usage (Uncomment to see errors)
// bus.emit("User:deleted", { id: "123" }); // Error: Property 'reason' is missing
// bus.on("User:exploded", () => {}); // Error: Argument of type '"User:exploded"' is not assignable to parameter of type 'EventName'.
