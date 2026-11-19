import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import ts from 'typescript';

const repositoryRoot = resolve(import.meta.dirname, '..');
const simulationSourceRoot = join(repositoryRoot, 'packages/sim/src');
const forbiddenIdentifiers = new Set([
  'Audio',
  'AudioBuffer',
  'AudioContext',
  'AudioEngine',
  'HTMLCanvasElement',
  'HTMLElement',
  'OfflineAudioContext',
  'WebGL1Renderer',
  'WebGL2RenderingContext',
  'WebGLRenderer',
  'WebGLRenderingContext',
  'cancelAnimationFrame',
  'document',
  'localStorage',
  'navigator',
  'requestAnimationFrame',
  'sessionStorage',
  'window',
]);
const violations: string[] = [];

function sourceFiles(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...sourceFiles(path));
    } else if (entry.isFile() && /\.[cm]?[jt]sx?$/.test(entry.name)) {
      files.push(path);
    }
  }
  return files;
}

function isForbiddenModule(specifier: string): boolean {
  const module = specifier.toLowerCase();
  return (
    module === 'preact' ||
    module.startsWith('preact/') ||
    module === 'three/examples' ||
    module.startsWith('three/examples/') ||
    module === 'three/src/renderers' ||
    module.startsWith('three/src/renderers/') ||
    /(^|[/@])audio(?:[-/]|$)/.test(module)
  );
}

function checkFile(file: string): void {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.ES2022,
    true,
  );

  function report(node: ts.Node, message: string): void {
    const position = source.getLineAndCharacterOfPosition(
      node.getStart(source),
    );
    violations.push(
      `${relative(repositoryRoot, file)}:${position.line + 1}:${position.character + 1} ${message}`,
    );
  }

  function checkModule(node: ts.Expression): void {
    if (ts.isStringLiteralLike(node) && isForbiddenModule(node.text)) {
      report(node, `forbidden simulation import "${node.text}"`);
    }
  }

  function visit(node: ts.Node): void {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      if (node.moduleSpecifier) {
        checkModule(node.moduleSpecifier);
      }
    } else if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference)
    ) {
      checkModule(node.moduleReference.expression);
    } else if (ts.isCallExpression(node)) {
      const isDynamicImport =
        node.expression.kind === ts.SyntaxKind.ImportKeyword;
      const isRequire =
        ts.isIdentifier(node.expression) && node.expression.text === 'require';
      const firstArgument = node.arguments[0];
      if ((isDynamicImport || isRequire) && firstArgument) {
        checkModule(firstArgument);
      }
    }

    if (ts.isIdentifier(node) && forbiddenIdentifiers.has(node.text)) {
      report(node, `forbidden simulation global "${node.text}"`);
    }
    ts.forEachChild(node, visit);
  }

  visit(source);
}

for (const file of sourceFiles(simulationSourceRoot)) {
  checkFile(file);
}

if (violations.length > 0) {
  for (const violation of violations) {
    console.error(violation);
  }
  process.exitCode = 1;
} else {
  console.log('Simulation import guard passed.');
}
