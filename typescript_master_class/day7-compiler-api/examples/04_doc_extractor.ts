// Example 4: Extracting Documentation (JSDoc Parser)
// Goal: Programmatically extract comments and signatures from code to generate docs.
//
// This is exactly how TypeDoc or Swagger generators work:
// 1. Read AST.
// 2. Find exported functions/classes.
// 3. Read associated JSDoc comments.
// 4. Output JSON/HTML.

import * as ts from "typescript";

const code = `
/**
 * Calculates the area of a circle.
 * @param radius The radius of the circle
 * @returns The area
 */
function calculateArea(radius: number): number {
  return Math.PI * radius * radius;
}

/**
 * Greets a user.
 */
function greet(name: string) {
  console.log("Hello " + name);
}
`;

const sourceFile = ts.createSourceFile("doc.ts", code, ts.ScriptTarget.Latest, true);

function extractDocs(node: ts.Node) {
  if (ts.isFunctionDeclaration(node)) {
    const name = node.name?.text;
    
    // Get JSDoc tags
    // The Compiler API for JSDoc is a bit "hidden" but powerful.
    // 'ts.getJSDocTags' is the modern API, but accessing the node properties directly is common too.
    const jsDocs = (node as any).jsDoc as ts.JSDoc[];
    
    if (jsDocs && jsDocs.length > 0) {
      const comment = jsDocs[0].comment;
      
      console.log(`\nFunction: ${name}`);
      console.log(`Summary:  ${comment}`);
      
      // We can also extract tags like @param
      if (jsDocs[0].tags) {
        jsDocs[0].tags.forEach(tag => {
          const tagName = tag.tagName.text;
          const tagComment = tag.comment;
          console.log(`   @${tagName}: ${tagComment}`);
        });
      }
    } else {
        console.log(`\nFunction: ${name} (Undocumented)`);
    }
  }

  node.forEachChild(extractDocs);
}

// --- Usage ---

console.log("--- Generating Documentation ---");
extractDocs(sourceFile);

