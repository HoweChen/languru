# Day 7: The Compiler API & AST

Welcome to Day 7, the Final Frontier.
Today, you stop being a user of TypeScript and start becoming a toolmaker.
We will use the TypeScript Compiler API to read, analyze, and modify TypeScript code itself.

The Compiler API is the engine behind VS Code's Intellisense, ESLint rules, and automated refactoring tools. Mastering it gives you superpowers to automate large-scale codebase changes.

## 📚 Curriculum

1.  **AST Traversal**: Parsing code into a syntax tree and walking through it.
2.  **Code Transformation (Codemods)**: Automatically rewriting code (e.g., refactoring tools).
3.  **Custom Linters**: Writing your own rules to enforce team standards.
4.  **Documentation Extraction**: Generating API docs by parsing JSDoc and signatures.
5.  **Type Checking API**: Asking the compiler "What type is this variable?" at runtime (build time).

## 🧠 Key Concepts & Snippets

### 1. Abstract Syntax Tree (AST)
Code is just a tree of nodes.
`const x = 1;` becomes:
- `VariableStatement`
  - `VariableDeclarationList`
    - `VariableDeclaration` (name: "x")
      - `NumericLiteral` (value: "1")

### 2. Creating a Program
To analyze code properly (including types), you need a `Program`.

```typescript
import * as ts from "typescript";

const program = ts.createProgram(["file.ts"], {});
const checker = program.getTypeChecker();
const sourceFile = program.getSourceFile("file.ts");
```

### 3. Visiting Nodes
The core pattern is the "Visitor Pattern". You visit a node, do something, and then visit its children.

```typescript
function visit(node: ts.Node) {
  if (ts.isFunctionDeclaration(node)) {
    console.log("Found function:", node.name?.text);
  }
  ts.forEachChild(node, visit);
}
```

## ✅ Dos and Don'ts

| Do | Don't |
| :--- | :--- |
| **Do** use `ts.is...` guards.<br> ```typescript if (ts.isIdentifier(node)) { console.log(node.text); } ``` | **Don't** use magic numbers.<br> ```typescript // ❌ Fragile! Values change between TS versions. if (node.kind === 79) { ... } ``` |
| **Do** use `TypeChecker` for semantics.<br> ```typescript const type = checker.getTypeAtLocation(node); console.log(checker.typeToString(type)); ``` | **Don't** guess types from text.<br> ```typescript // ❌ Fails on type aliases/imports if (node.getText() === 'User') { ... } ``` |
| **Do** use `Printer` to generate code.<br> ```typescript const result = printer.printNode( ts.EmitHint.Unspecified, node, file ); ``` | **Don't** concat strings.<br> ```typescript // ❌ Prone to syntax errors return "function " + name + "() {}"; ``` |
| **Do** handle anonymous nodes.<br> ```typescript const name = node.name ? node.name.text : "anonymous"; ``` | **Don't** assume names exist.<br> ```typescript // ❌ Crashes on `export default function() {}` console.log(node.name.text); ``` |

## 🛠 Examples Explained

### [01_ast_traversal.ts](./examples/01_ast_traversal.ts)
A simple "Scanner" that prints the structure of a TypeScript file.
**Key Takeaway**: Use `ts.forEachChild` to recursively walk the tree. This is the foundation of all analysis tools.

### [02_code_transformer.ts](./examples/02_code_transformer.ts)
A "Codemod" that replaces `console.log` with `console.warn` automatically.
**Key Takeaway**: Transformers are used by build tools (like Webpack/Vite loaders) to compile TS to JS, or to apply custom macros.

### [03_custom_linter.ts](./examples/03_custom_linter.ts)
A mini-ESLint. It scans the AST for specific patterns (like using the `any` keyword) and reports errors.
**Key Takeaway**: You can write custom rules for your team (e.g., "All interfaces must start with I") in 50 lines of code.

### [04_doc_extractor.ts](./examples/04_doc_extractor.ts)
Parses a file, finds function declarations, and extracts their JSDoc comments.
**Key Takeaway**: This is how tools like TypeDoc work. They extract comments and type signatures to generate HTML documentation.

### [05_type_checker.ts](./examples/05_type_checker.ts)
Goes beyond syntax. It asks the Type Checker for the *inferred type* of a variable.
**Key Takeaway**: The AST tells you what the code *looks* like. The Type Checker tells you what the code *means*. It knows that `const x = 1` makes `x` a `number`.

---

## 🏃‍♀️ Running the Examples

```bash
bun run examples/01_ast_traversal.ts
bun run examples/05_type_checker.ts
```
