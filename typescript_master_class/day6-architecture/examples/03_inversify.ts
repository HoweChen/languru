// Example 3: Inversion of Control with InversifyJS
// Goal: Use a battle-tested DI library to manage complex dependency graphs automatically.
//
// Manual DI (Example 2) is fine for small apps.
// But what if Service A needs Service B, which needs Service C...?
// Wiring that up manually is tedious ("Dependency Hell").
// InversifyJS handles this "Auto-Wiring" for us.

import "reflect-metadata"; // REQUIRED for Inversify
import { Container, injectable, inject } from "inversify";

// 1. Interfaces (Contracts)
interface Logger {
  log(msg: string): void;
}

interface Database {
  connect(): void;
}

// 2. Types (Symbols for DI tokens)
// In TypeScript, interfaces disappear at runtime.
// We use Symbols as unique identifiers to map Interfaces -> Classes.
const TYPES = {
  Logger: Symbol.for("Logger"),
  Database: Symbol.for("Database"),
  App: Symbol.for("App"),
};

// 3. Implementations (Decorated)
// @injectable() marks the class as managed by the DI container.

@injectable()
class ConsoleLogger implements Logger {
  log(msg: string) { console.log(`[Logger] ${msg}`); }
}

@injectable()
class PostgresDB implements Database {
  // Dependencies are requested via @inject
  constructor(@inject(TYPES.Logger) private logger: Logger) {} 
  
  connect() {
    this.logger.log("Connecting to Postgres...");
    // Simulate connection
    this.logger.log("Connected!");
  }
}

@injectable()
class App {
  // App asks for Database, but doesn't know it's PostgresDB.
  // It also doesn't know that Database needs a Logger.
  // The Container figures that out recursively.
  constructor(@inject(TYPES.Database) private db: Database) {}

  start() {
    console.log("--- App Booting ---");
    this.db.connect();
    console.log("--- App Running ---");
  }
}

// 4. Composition Root (Wiring)
// This is the ONLY place where we couple Interfaces to Implementations.
// Usually done in 'index.ts' or 'inversify.config.ts'.
const container = new Container();

container.bind<Logger>(TYPES.Logger).to(ConsoleLogger).inSingletonScope(); // Shared instance
container.bind<Database>(TYPES.Database).to(PostgresDB);
container.bind<App>(TYPES.App).to(App);

// --- Usage ---

// Resolve the root object. The container creates the graph:
// App -> PostgresDB -> ConsoleLogger
const app = container.get<App>(TYPES.App);
app.start();

// Need to change Logger? Just change the binding line above.
// No other code needs to change. This is "Loose Coupling".

