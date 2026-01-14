import { z } from "zod";

// Example 2: Runtime Validator to Static Type Inference (Zod Pattern)
// Goal: Ensure runtime data (e.g. env vars or request body) matches compile-time types using a library like Zod.
// This is the "Runtime Foundation" part of Day 1.

// 1. Define a schema for Environment Variables
const EnvSchema = z.object({
  PORT: z.coerce.number().min(1000).default(3000), // coercion handles string -> number
  DB_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  API_KEY: z.string().min(32),
});

// 2. Derive the static TypeScript type from the runtime schema
// This guarantees that 'EnvConfig' type is ALWAYS in sync with the validation logic.
// No more "Interface says number, but runtime got string".
type EnvConfig = z.infer<typeof EnvSchema>;

// 3. A function to load and validate config
function loadConfig(processEnv: Record<string, string | undefined>): EnvConfig {
  const result = EnvSchema.safeParse(processEnv);

  if (!result.success) {
    console.error("❌ Invalid environment variables:");
    console.error(result.error.flatten().fieldErrors);
    throw new Error("Invalid Configuration");
  }

  // At this point, TS knows 'result.data' matches 'EnvConfig' exactly.
  return result.data;
}

// --- Usage ---

// Simulating process.env
const mockEnv = {
  PORT: "8080",
  DB_URL: "postgres://user:pass@localhost:5432/db",
  NODE_ENV: "production",
  API_KEY: "12345678901234567890123456789012",
};

try {
  const config = loadConfig(mockEnv);
  // config is typed as EnvConfig
  console.log(`Server starting on port ${config.PORT} in ${config.NODE_ENV} mode.`);
  // config.PORT is number, NOT string, thanks to z.coerce.number()
} catch (e) {
  process.exit(1);
}
