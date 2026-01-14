// Example 5: Type Checker API (Semantic Analysis)
// Goal: Use the Type Checker to infer types of variables programmatically.
//
// AST vs TypeChecker:
// AST: "I see a variable named 'x' assigned '42'" (Syntax)
// TypeChecker: "I know 'x' is a 'number' because 42 is a number" (Semantics)

import * as ts from "typescript";
import * as fs from "node:fs";

// We need a real file for the Program to resolve properly (often)
const fileName = "temp_check.ts";
const code = `
  const x = 42;
  const y = "hello";
  const z = x + 10; // Inferred as number
  
  interface Point { x: number; y: number }
  const p: Point = { x: 1, y: 2 };
`;

// Write temp file
fs.writeFileSync(fileName, code);

// 1. Create Program
// The 'Program' creates the TypeChecker. It acts like a compiler instance.
const program = ts.createProgram([fileName], {});
const checker = program.getTypeChecker();
const sourceFile = program.getSourceFile(fileName)!;

// 2. Visit and Check Types
function visit(node: ts.Node) {
  // We want to inspect Variable Declarations (const x = ...)
  if (ts.isVariableDeclaration(node) && node.name) {
    
    // 1. Get the Symbol (The unique identity of 'x')
    // A Symbol connects declarations (AST nodes) to meanings.
    const symbol = checker.getSymbolAtLocation(node.name);
    
    if (symbol) {
      // 2. Get the Type (The shape of data)
      const type = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration!);
      
      // 3. Convert Type to String
      const typeString = checker.typeToString(type);
      
      console.log(`Variable '${node.name.getText()}' \t inferred as: '${typeString}'`);
    }
  }

  ts.forEachChild(node, visit);
}

// --- Usage ---

console.log("--- Type Inference Analysis ---");
visit(sourceFile);

// Cleanup
fs.unlinkSync(fileName);

