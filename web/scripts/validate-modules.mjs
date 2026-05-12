import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const webRoot = path.resolve(
  process.env.TRUEADMIN_WEB_ROOT ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '..'),
);
const requiredLocales = ['zh-CN', 'en-US'];

const failures = [];
const manifestIds = new Map();
const routePaths = new Map();

const manifestFiles = [
  ...findManifestFiles(path.join(webRoot, 'src/modules')),
  ...findManifestFiles(path.join(webRoot, 'src/plugins')),
].sort();

for (const file of manifestFiles) {
  validateManifest(file);
}

if (failures.length > 0) {
  console.error('Module manifest validation failed:');
  for (const failure of failures) {
    console.error(` - ${failure}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Module manifest validation passed (${manifestFiles.length} manifest(s)).`);
}

function validateManifest(file) {
  const sourceFile = parseSourceFile(file);
  const manifest = getDefaultManifestObject(sourceFile);
  const relative = relativePath(file);

  if (!manifest) {
    failures.push(`${relative}: missing export default defineModule({...}).`);
    return;
  }

  const id = getStringProperty(manifest, 'id');
  if (!id) {
    failures.push(`${relative}: manifest id is required.`);
    return;
  }

  recordUnique(manifestIds, id, relative, 'manifest id');
  validateManifestPathId(file, id);

  const requiredKeys = new Set();
  validateRoutes(file, manifest, requiredKeys);
  validateNoFrontendMenus(file, manifest);
  collectTransKeys(manifest, requiredKeys);
  validateLocales(file, manifest, requiredKeys);
}

function findManifestFiles(root) {
  if (!fs.existsSync(root)) {
    return [];
  }

  const files = [];
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const next = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(next);
        continue;
      }

      if (entry.isFile() && entry.name === 'manifest.ts') {
        files.push(next);
      }
    }
  }

  return files;
}

function validateManifestPathId(file, id) {
  const relative = relativePath(file);
  const parts = toPosix(path.relative(webRoot, file)).split('/');

  if (parts[0] === 'src' && parts[1] === 'modules') {
    const expected = parts[2];
    if (id !== expected) {
      failures.push(`${relative}: module id must be [${expected}].`);
    }
    return;
  }

  if (parts[0] === 'src' && parts[1] === 'plugins') {
    const expected = `${parts[2]}.${parts[3]}`;
    if (id !== expected) {
      failures.push(`${relative}: plugin module id must be [${expected}].`);
    }
  }
}

function validateRoutes(file, manifest, requiredKeys) {
  const relative = relativePath(file);
  const routes = getArrayProperty(manifest, 'routes');
  if (!routes) {
    return;
  }

  for (const route of objectElements(routes)) {
    const routePath = getStringProperty(route, 'path');
    if (!routePath) {
      failures.push(`${relative}: route path is required.`);
      continue;
    }
    if (!routePath.startsWith('/')) {
      failures.push(`${relative}: route path [${routePath}] must start with /.`);
    }
    recordUnique(routePaths, normalizeRoutePath(routePath), relative, 'route path');

    const meta = getObjectProperty(route, 'meta');
    const title = meta ? getStringProperty(meta, 'title') : undefined;
    if (title) {
      requiredKeys.add(title);
    }
  }
}

function validateNoFrontendMenus(file, manifest) {
  const relative = relativePath(file);
  if (getProperty(manifest, 'menus')) {
    failures.push(
      `${relative}: frontend menus are not allowed. Declare menus in backend resources/menus.php.`,
    );
  }
}

function validateLocales(file, manifest, requiredKeys) {
  const relative = relativePath(file);
  const locales = getObjectProperty(manifest, 'locales');
  if (!locales) {
    if (requiredKeys.size > 0) {
      failures.push(`${relative}: locales are required because manifest declares i18n keys.`);
    }
    return;
  }

  for (const locale of requiredLocales) {
    const loader = getProperty(locales, locale);
    if (!loader) {
      failures.push(`${relative}: locale [${locale}] is required.`);
      continue;
    }

    const localeFile = resolveLocaleFile(file, loader);
    if (!localeFile) {
      failures.push(`${relative}: locale [${locale}] must load a static relative file.`);
      continue;
    }
    if (!fs.existsSync(localeFile)) {
      failures.push(
        `${relative}: locale [${locale}] file is missing [${toPosix(path.relative(path.dirname(file), localeFile))}].`,
      );
      continue;
    }

    const messages = readLocaleKeys(localeFile);
    for (const key of requiredKeys) {
      if (!messages.has(key)) {
        failures.push(`${relative}: locale [${locale}] is missing key [${key}].`);
      }
    }
  }
}

function collectTransKeys(node, requiredKeys) {
  visit(node);

  function visit(current) {
    if (
      ts.isCallExpression(current) &&
      ts.isIdentifier(current.expression) &&
      current.expression.text === 'trans'
    ) {
      const key = getStringLiteralValue(current.arguments[0]);
      if (key) {
        requiredKeys.add(key);
      }
    }

    current.forEachChild(visit);
  }
}

function readLocaleKeys(file) {
  const sourceFile = parseSourceFile(file);
  const expression = getDefaultExportExpression(sourceFile);
  const localeObject = expression && skipCallExpression(expression);
  const keys = new Set();

  if (!localeObject || !ts.isObjectLiteralExpression(localeObject)) {
    failures.push(`${relativePath(file)}: locale file must export a plain object.`);
    return keys;
  }

  for (const property of localeObject.properties) {
    if (!ts.isPropertyAssignment(property)) {
      continue;
    }
    const name = getPropertyName(property.name);
    if (name) {
      keys.add(name);
    }
  }

  return keys;
}

function resolveLocaleFile(manifestFile, loader) {
  let importPath;

  if (ts.isArrowFunction(loader)) {
    importPath = getDynamicImportPath(loader.body);
  } else if (ts.isFunctionExpression(loader)) {
    const returnStatement = loader.body.statements.find(ts.isReturnStatement);
    importPath = returnStatement?.expression
      ? getDynamicImportPath(returnStatement.expression)
      : undefined;
  }

  if (!importPath?.startsWith('.')) {
    return undefined;
  }

  const resolved = path.resolve(path.dirname(manifestFile), importPath);
  return path.extname(resolved) ? resolved : `${resolved}.ts`;
}

function getDynamicImportPath(node) {
  if (
    ts.isCallExpression(node) &&
    node.expression.kind === ts.SyntaxKind.ImportKeyword &&
    node.arguments.length === 1
  ) {
    return getStringLiteralValue(node.arguments[0]);
  }

  return undefined;
}

function getDefaultManifestObject(sourceFile) {
  const expression = getDefaultExportExpression(sourceFile);
  if (!expression) {
    return undefined;
  }

  const inner = skipCallExpression(expression);
  return ts.isObjectLiteralExpression(inner) ? inner : undefined;
}

function getDefaultExportExpression(sourceFile) {
  for (const statement of sourceFile.statements) {
    if (ts.isExportAssignment(statement) && !statement.isExportEquals) {
      return statement.expression;
    }
  }

  return undefined;
}

function skipCallExpression(expression) {
  if (ts.isCallExpression(expression) && expression.arguments.length > 0) {
    return expression.arguments[0];
  }

  return expression;
}

function objectElements(array) {
  return array.elements.filter(ts.isObjectLiteralExpression);
}

function parseSourceFile(file) {
  return ts.createSourceFile(
    file,
    fs.readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
}

function getArrayProperty(object, name) {
  const value = getProperty(object, name);
  return value && ts.isArrayLiteralExpression(value) ? value : undefined;
}

function getObjectProperty(object, name) {
  const value = getProperty(object, name);
  return value && ts.isObjectLiteralExpression(value) ? value : undefined;
}

function getStringProperty(object, name) {
  const value = getProperty(object, name);
  return value ? getStringLiteralValue(value) : undefined;
}

function getProperty(object, name) {
  for (const property of object.properties) {
    if (!ts.isPropertyAssignment(property)) {
      continue;
    }

    if (getPropertyName(property.name) === name) {
      return property.initializer;
    }
  }

  return undefined;
}

function getPropertyName(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) {
    return name.text;
  }

  return undefined;
}

function getStringLiteralValue(node) {
  if (!node) {
    return undefined;
  }

  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }

  return undefined;
}

function recordUnique(registry, key, owner, label) {
  const existing = registry.get(key);
  if (existing) {
    failures.push(`${owner}: duplicate ${label} [${key}], first declared in ${existing}.`);
    return;
  }

  registry.set(key, owner);
}

function normalizeRoutePath(routePath) {
  if (routePath === '/') {
    return routePath;
  }

  return routePath.replace(/\/+$/, '');
}

function relativePath(file) {
  return toPosix(path.relative(webRoot, file));
}

function toPosix(value) {
  return value.split(path.sep).join('/');
}
