import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const scriptPath = fileURLToPath(new URL('./validate-modules.mjs', import.meta.url));

function makeWebRoot() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'trueadmin-module-validate-'));
}

function runValidator(webRoot) {
  return spawnSync(process.execPath, [scriptPath], {
    encoding: 'utf8',
    env: {
      ...process.env,
      TRUEADMIN_WEB_ROOT: webRoot,
    },
  });
}

function writeModule(webRoot, id, manifest, locales) {
  const moduleRoot = path.join(webRoot, 'src/modules', id);
  fs.mkdirSync(path.join(moduleRoot, 'locales'), { recursive: true });
  fs.writeFileSync(path.join(moduleRoot, 'manifest.ts'), manifest);

  for (const [locale, messages] of Object.entries(locales)) {
    fs.writeFileSync(
      path.join(moduleRoot, 'locales', `${locale}.ts`),
      `export default ${JSON.stringify(messages, null, 2)};\n`,
    );
  }
}

describe('validate-modules script', () => {
  it('passes valid module manifests', () => {
    const webRoot = makeWebRoot();
    writeModule(
      webRoot,
      'system',
      `export default defineModule({
        id: 'system',
        routes: [{ path: '/system/users', meta: { title: 'system.users.title' } }],
        locales: {
          'zh-CN': () => import('./locales/zh-CN'),
          'en-US': () => import('./locales/en-US'),
        },
      });\n`,
      {
        'zh-CN': { 'system.users.title': '成员管理' },
        'en-US': { 'system.users.title': 'Users' },
      },
    );

    const result = runValidator(webRoot);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('Module manifest validation passed (1 manifest(s)).');
    expect(result.stderr).toBe('');
  });

  it('fails duplicate routes and missing locale keys', () => {
    const webRoot = makeWebRoot();
    writeModule(
      webRoot,
      'system',
      `export default defineModule({
        id: 'system',
        routes: [{ path: '/dashboard', meta: { title: 'system.dashboard' } }],
        locales: {
          'zh-CN': () => import('./locales/zh-CN'),
          'en-US': () => import('./locales/en-US'),
        },
      });\n`,
      {
        'zh-CN': { 'system.dashboard': '工作台' },
        'en-US': { 'system.dashboard': 'Dashboard' },
      },
    );
    writeModule(
      webRoot,
      'workbench',
      `export default defineModule({
        id: 'workbench',
        routes: [{ path: '/dashboard/', meta: { title: 'workbench.dashboard' } }],
        menus: [{ code: 'workbench.dashboard', i18n: 'workbench.dashboard', path: '/dashboard' }],
        locales: {
          'zh-CN': () => import('./locales/zh-CN'),
          'en-US': () => import('./locales/en-US'),
        },
      });\n`,
      {
        'zh-CN': {},
        'en-US': { 'workbench.dashboard': 'Workbench' },
      },
    );

    const result = runValidator(webRoot);
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain('duplicate route path [/dashboard]');
    expect(output).toContain('frontend menus are not allowed');
    expect(output).toContain('locale [zh-CN] is missing key [workbench.dashboard]');
  });
});
