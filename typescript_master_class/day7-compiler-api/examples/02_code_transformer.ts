// Example 2: AST Transformer (Codemod)
// Goal: Automatically modify code. Here, we'll transform all `console.log` calls to `console.warn`.
//
// This is how tools like Babel, swc, and jscodeshift work internally.
// We are "mutating" the AST before printing it back to string.

import * as ts from "typescript";

const code = `
function main() {
  console.log("Hello");
  console.log("World");
  const x = 10;
  console.error("This stays");
}
`;

// 1. The Transformer Factory
// A TransformerFactory takes a 'TransformationContext' and returns a 'Transformer'.
// A Transformer is a function that takes a Node and returns a Node.
const transformer: ts.TransformerFactory<ts.SourceFile> = (context) => {
  
  // Visitor function traverses the AST
  const visitor: ts.Visitor = (node) => {
    
    // Pattern Matching: Finding `console.log`
    // Structure: PropertyAccessExpression
    //   expression: Identifier ("console")
    //   name: Identifier ("log")
    if (ts.isPropertyAccessExpression(node) &&
        node.expression.getText() === "console" &&
        node.name.getText() === "log") {
      
      console.log("-> Found console.log, replacing with console.warn");

      // Replace "log" with "warn"
      // context.factory is the standard way to CREATE new nodes.
      return context.factory.updatePropertyAccessExpression(
        node,
        node.expression, // Keep "console"
        context.factory.createIdentifier("warn") // Replace "log"
      );
    }

    // Continue traversing children
    return ts.visitEachChild(node, visitor, context);
  };

  return (rootNode) => ts.visitNode(rootNode, visitor) as ts.SourceFile;
};

// --- Usage ---

const sourceFile = ts.createSourceFile("input.ts", code, ts.ScriptTarget.Latest);

console.log("--- Transformation Start ---");

// Apply transformation
// ts.transform creates a new transformed AST. It does NOT modify the original in-place.
const result = ts.transform(sourceFile, [transformer]);

// Print result (AST -> String)
const printer = ts.createPrinter();
const transformedSource = printer.printFile(result.transformed[0]);

console.log("\nOriginal Code:");
console.log(code);
console.log("\nTransformed Code:");
console.log(transformedSource);

// Cleanup
result.dispose();

