// Example 3: Mapped Types for Partial Updates & Readonly Views
// Goal: Manipulate existing types to create new variations for different DB operations (Create, Update, Read).

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// 1. Utility Type: Writable (removes readonly - though Product has none, good to know)
type Writable<T> = { -readonly [P in keyof T]: T[P] };

// 2. Create DTO: Omit system fields (id, dates)
type CreateProductDTO = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;

// 3. Update DTO: Make everything optional, but also prevent updating 'id' or 'createdAt'
// Partial<CreateProductDTO> would work, but let's be explicit with Mapped Types
type UpdateProductDTO = {
  [P in keyof CreateProductDTO]?: CreateProductDTO[P];
};

// 4. Readonly View: For returning to client, everything should be immutable
type ProductView = Readonly<Product>;

// 5. Deep Readonly (Recursive Mapped Type) - Advanced!
// This ensures that even nested arrays (like 'tags') cannot be pushed to.
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// --- Usage ---

function createProduct(dto: CreateProductDTO): Product {
  return {
    id: "uuid-123",
    ...dto,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function updateProduct(product: Product, changes: UpdateProductDTO): Product {
  return {
    ...product,
    ...changes,
    updatedAt: new Date(),
  };
}

const p1 = createProduct({
  name: "MacBook Pro",
  price: 2000,
  description: "Fast laptop",
  tags: ["apple", "tech"],
});

// Using DeepReadonly
const view: DeepReadonly<Product> = p1;

// view.price = 1900; // Error: Cannot assign to 'price' because it is a read-only property.
// view.tags.push("new"); // Error: Property 'push' does not exist on type 'DeepReadonly<string[]>'.

console.log("Product created:", view);
