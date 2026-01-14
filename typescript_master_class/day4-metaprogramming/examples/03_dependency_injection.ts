// Example 3: Dependency Injection (DI) Container
//
// -----------------------------------------------------------------------------
// WHY USE THIS PATTERN?
// -----------------------------------------------------------------------------
// Tight coupling makes code hard to test.
// BAD: `const db = new Database()` inside your Service.
//      (How do you mock the DB during testing?)
//
// GOOD: `constructor(private db: Database) {}`
//      (You can pass a MockDatabase when testing!)
//
// A DI Container automates this wiring so you don't have to manually create
// 50 nested objects like `new Service(new Repo(new DB(new Logger())))`.
// -----------------------------------------------------------------------------

import "reflect-metadata";

// 1. Types
type Constructor<T = any> = new (...args: any[]) => T;

// 2. The Container (Singleton)
// Responsible for creating and caching class instances.
class Container {
  private static services = new Map<Constructor, any>();

  // Register a class and create its instance.
  static register<T>(target: Constructor<T>) {
    if (!this.services.has(target)) {
      // 3. Auto-wiring: Inspect constructor params!
      
      // NOTE: `design:paramtypes` is emitted by TypeScript ONLY if `emitDecoratorMetadata: true`
      // is set in tsconfig.json. When running via `bun run file.ts` without a config,
      // this metadata might be missing.
      
      // We try to get metadata, or fallback to manual injection if defined (see Inject decorator below).
      const paramTypes: Constructor[] = Reflect.getMetadata("design:paramtypes", target) || [];
      
      // Check for manually registered injections (fallback for no-metadata environments)
      const manualInjections = Reflect.getMetadata("manual:injections", target) || [];

      // Merge: Manual injections take precedence (or fill gaps)
      const finalParams = paramTypes.map((param, index) => {
        return manualInjections[index] || param;
      });
      
      if (finalParams.length === 0 && manualInjections.length > 0) {
        // If metadata failed but manual exists, use manual
        manualInjections.forEach((token: Constructor, index: number) => {
           finalParams[index] = token;
        });
      }

      // Recursively resolve dependencies
      const params = finalParams.map((param: Constructor) => {
        if (!param) {
          throw new Error(`Cannot resolve dependency at index for ${target.name}. Make sure circular dependencies are avoided and metadata is emitted.`);
        }
        return this.resolve(param);
      });
      
      // Create the instance with resolved params
      const instance = new target(...params);
      this.services.set(target, instance);
    }
  }

  // Get or Create instance
  static resolve<T>(target: Constructor<T>): T {
    if (!this.services.has(target)) {
      this.register(target);
    }
    return this.services.get(target);
  }
}

// 4. The Decorators

// @Service: Marks a class as manageable by the container
function Service() {
  return function (target: Constructor) {
    // We could eager-register here, but lazy resolution is fine too.
  };
}

// @Inject: Manual fallback for environments where emitDecoratorMetadata fails
function Inject(token: Constructor) {
  return function (target: any, _propertyKey: string | undefined, parameterIndex: number) {
    const existing = Reflect.getMetadata("manual:injections", target) || [];
    existing[parameterIndex] = token;
    Reflect.defineMetadata("manual:injections", existing, target);
  };
}

// --- Usage ---

@Service()
class Logger {
  log(msg: string) {
    console.log(`[Logger]: ${msg}`);
  }
}

@Service()
class Database {
  // Dependency Injection happens here!
  // We add @Inject(Logger) to be safe regardless of tsconfig settings.
  constructor(@Inject(Logger) private logger: Logger) {} 

  connect() {
    this.logger.log("Connecting to DB...");
    return true;
  }
}

@Service()
class AppController {
  // We just ask for Database. We don't care how it's created.
  constructor(@Inject(Database) private db: Database) {}

  start() {
    this.db.connect();
    console.log("App started.");
  }
}

// Bootstrapping
// We ask for the root component, and the container recursively builds the graph.
// AppController -> needs Database -> needs Logger
console.log("Resolving AppController...");
const app = Container.resolve(AppController);
app.start();
