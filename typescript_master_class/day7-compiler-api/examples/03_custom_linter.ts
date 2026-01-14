// Example 3: Custom Linter (AST Analysis)
// Goal: Detect code patterns that you want to forbid (e.g., using 'any').
//
// Why build your own linter?
// 1. Enforce team-specific rules ("All interfaces must start with 'I'").
// 2. Deprecate internal APIs ("Don't use LegacyAuthService").
// 3. Security audits ("Find all usage of eval()").

import * as ts from "typescript";

const code = `
function bad(arg: any) {
  const x: any = 10;
  return x;
}

function good(arg: number) {
  return arg;
}
`;

const sourceFile = ts.createSourceFile("input.ts", code, ts.ScriptTarget.Latest, true);

// 1. Lint Function
function lintNode(node: ts.Node) {
  
  // Rule 1: No 'any'
  // We check the node.kind directly.
  if (node.kind === ts.SyntaxKind.AnyKeyword) {
    reportError(node, "Usage of 'any' is forbidden. Use a specific type or 'unknown'.");
  }

  // Rule 2: Function names must be camelCase (just as an example)
  if (ts.isFunctionDeclaration(node) && node.name) {
    const name = node.name.text;
    if (/^[A-Z]/.test(name)) { // Starts with Uppercase
       reportError(node.name, `Function '${name}' should be camelCase.`);
    }
  }

  // Recurse
  node.forEachChild(lintNode);
}

// Helper to print friendly error messages
function reportError(node: ts.Node, message: string) {
  // getLineAndCharacterOfPosition is expensive, so we only call it when we find an error.
  const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
  
  // Line is 0-indexed, so we add 1 for humans
  console.error(`[Lint Error] ${sourceFile.fileName}:${line + 1}:${character + 1} - ${message}`);
  
  // print snippet
  // const snippet = node.getText();
  // console.error(`   > ${snippet}\n`);
}

// --- Usage ---

console.log("--- Starting Lint ---");
lintNode(sourceFile);

