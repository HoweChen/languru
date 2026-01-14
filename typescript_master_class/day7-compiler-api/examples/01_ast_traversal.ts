// Example 1: Basic AST Traversal (Scanner)
// Goal: Parse TypeScript code into an Abstract Syntax Tree (AST) and inspect its nodes.
//
// What is AST?
// It's the tree representation of your code.
// const x = 1; -> VariableStatement -> VariableDeclarationList -> VariableDeclaration
//
// Why learn this?
// 1. Build custom ESLint rules.
// 2. Build code generators (e.g., Generate API clients from Backend code).
// 3. Understand how TypeScript actually "sees" your code.

import * as ts from "typescript";

const code = `
interface User {
  id: number;
  name: string;
}

function getUser(id: number): User {
  return { id, name: "Alice" };
}
`;

// 1. Create a SourceFile
// This is the root node of the AST.
// It parses the string 'code' but DOES NOT check types (that requires a Program).
const sourceFile = ts.createSourceFile(
  "example.ts",
  code,
  ts.ScriptTarget.Latest,
  true // setParentNodes: True is useful for crawling UP the tree
);

// 2. Traversal Function (Visitor Pattern)
function printNode(node: ts.Node, indent: number = 0) {
  // Convert enum ID (e.g., 259) to string name (e.g., "FunctionDeclaration")
  const syntaxKind = ts.SyntaxKind[node.kind];
  const padding = "  ".repeat(indent);
  
  // Extract extra info for specific node types
  let extraInfo = "";
  
  // If it's an Identifier (variable/function name), show the text
  if (ts.isIdentifier(node)) {
    extraInfo = ` [Text: "${node.text}"]`;
  }
  // If it's a Keyword (string, number, return), show which one
  else if (node.kind >= ts.SyntaxKind.FirstKeyword && node.kind <= ts.SyntaxKind.LastKeyword) {
     extraInfo = ` [Keyword]`;
  }

  console.log(`${padding}${syntaxKind}${extraInfo}`);

  // Recursively visit children
  // ts.forEachChild is optimized for traversing the tree.
  node.forEachChild(child => printNode(child, indent + 1));
}

// --- Usage ---

console.log("--- AST Structure Dump ---");
printNode(sourceFile);

