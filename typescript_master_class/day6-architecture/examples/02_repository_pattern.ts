// Example 2: Repository Pattern (Separation of Concerns)
// Goal: Decouple the Domain Model (User) from the persistence mechanism (DB).
//
// Why?
// 1. Testability: We can mock the DB easily.
// 2. Flexibility: We can switch from Postgres to Mongo without changing business logic.
// 3. Clarity: The interface documents exactly what data access we need.

// 1. Domain Entities (Simplified for demo)
// In a real DDD approach, this would be a class with methods.
// For this repository demo, we use an interface but note that
// the service layer is responsible for maintaining invariants.
interface User {
  id: string;
  name: string;
}

// 2. Repository Interface (Port)
// This belongs to the DOMAIN layer.
// It says: "I need a way to save and find users."
// It does NOT say "I need a SQL database."
interface IUserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
}

// 3. Implementation (Adapter)
// This belongs to the INFRASTRUCTURE layer.
// This is the ONLY place that knows we are using an in-memory Map (or SQL, or Redis).
class InMemoryUserRepository implements IUserRepository {
  private db = new Map<string, User>();

  async findById(id: string): Promise<User | null> {
    console.log(`[Repo] Finding user ${id}`);
    return this.db.get(id) || null;
  }

  async save(user: User): Promise<void> {
    console.log(`[Repo] Saving user ${user.id} to Map DB...`);
    this.db.set(user.id, user);
  }
}

// 4. Service Layer (Application Service)
// It orchestrates the flow.
// Notice it depends on the INTERFACE (IUserRepository), not the class (InMemoryUserRepository).
// This is Dependency Injection (DI) in action.
class UserService {
  constructor(private repo: IUserRepository) {}

  async renameUser(id: string, newName: string) {
    const user = await this.repo.findById(id);
    if (!user) throw new Error("User not found");
    
    console.log(`[Service] Renaming ${user.name} to ${newName}`);
    user.name = newName;
    
    await this.repo.save(user);
    console.log("[Service] Transaction complete.");
  }
}

// --- Usage ---

async function run() {
  console.log("--- Repository Pattern Demo ---");

  // 1. Assemble Dependencies
  // We can easily swap 'new InMemoryUserRepository()' with 'new PostgresUserRepository()'
  const repo = new InMemoryUserRepository();
  const service = new UserService(repo);

  // 2. Seed Data
  await repo.save({ id: "1", name: "Old Name" });

  // 3. Execute Business Logic
  await service.renameUser("1", "New Name");
}

run();
