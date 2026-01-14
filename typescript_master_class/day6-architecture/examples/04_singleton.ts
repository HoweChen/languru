// Example 4: Singleton Pattern (The Classical Approach)
// Goal: Ensure only one instance of a class exists.
//
// Modern Advice:
// In modern TypeScript/Node.js, we rarely write Singletons like this manually.
// Why?
// 1. It's hard to test (global state is sticky).
// 2. Node.js modules are already singletons (cached by 'require'/'import').
// 3. DI Containers (like Inversify) handle '.inSingletonScope()' better.
//
// However, it's a classic pattern you will see in older codebases or specific
// system-level components (Database Connection Pools, Loggers).

class ConfigService {
  private static instance: ConfigService;
  
  public readonly apiUrl: string;
  public readonly dbUrl: string;

  // Private constructor prevents direct instantiation with 'new'
  private constructor() {
    console.log("ConfigService: Loading environment variables...");
    this.apiUrl = process.env.API_URL || "http://localhost:3000";
    this.dbUrl = process.env.DB_URL || "postgres://localhost:5432/mydb";
  }

  // Global Access Point
  // Lazy Initialization: Instance is created only when first requested.
  static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }
}

// --- Usage ---

console.log("--- Singleton Demo ---");

// 1. First call creates the instance
const config1 = ConfigService.getInstance();
console.log(`Config 1 API: ${config1.apiUrl}`);

// 2. Second call returns the SAME instance
const config2 = ConfigService.getInstance();

// Verification
const isSameInstance = config1 === config2;
console.log(`Are they the same instance? ${isSameInstance}`); // true

if (isSameInstance) {
  console.log("Singleton Pattern Verified: Constructor was called only once.");
}

