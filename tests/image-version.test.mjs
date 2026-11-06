import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL, fileURLToPath } from 'node:url';
import vm from 'node:vm';
import test from 'node:test';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const ts = require('../frontend/node_modules/typescript');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const bash = process.platform === 'win32' ? 'C:/Program Files/Git/bin/bash.exe' : 'bash';
const versionsScript = path.join(root, 'deploy/lib/versions.sh').replaceAll('\\', '/');
const transpile = (name, module) => ts.transpileModule(read(name), {
  compilerOptions: { module, target: ts.ScriptTarget.ES2022 }, fileName: name,
}).outputText;

async function backendFixture(manifest, run) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'athini-image-version-'));
  try {
    const backend = path.join(dir, 'backend');
    const utils = path.join(backend, 'dist/utils');
    fs.mkdirSync(utils, { recursive: true });
    fs.writeFileSync(path.join(backend, 'package.json'), JSON.stringify({ type: 'module', ...manifest }));
    for (const name of ['appInfo', 'images']) {
      fs.writeFileSync(path.join(utils, name + '.js'), transpile('backend/src/utils/' + name + '.ts', ts.ModuleKind.ES2022));
    }
    const app = await import(pathToFileURL(path.join(utils, 'appInfo.js')).href);
    const images = await import(pathToFileURL(path.join(utils, 'images.js')).href);
    await run({ app, images });
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

function frontendFixture(appVersion, imageVersion, includeImageVersion = true) {
  const context = { exports: {}, __APP_VERSION__: appVersion };
  if (includeImageVersion) context.__IMAGE_VERSION__ = imageVersion;
  vm.runInNewContext(transpile('frontend/utils/appInfo.ts', ts.ModuleKind.CommonJS), context);
  return context.exports;
}

function shellFixture(backend, frontend) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'athini-shell-version-'));
  try {
    for (const [area, value] of [['backend', backend], ['frontend', frontend]]) {
      fs.mkdirSync(path.join(dir, area));
      fs.writeFileSync(path.join(dir, area, 'package.json'), JSON.stringify(value, null, 2) + '\n');
    }
    return spawnSync(bash, ['-c', `set -euo pipefail; die() { printf '%s\\n' "$*" >&2; exit 19; }; source "$1"; assert_app_versions_match "$2"; printf '%s|%s' "$(read_app_version "$2")" "$(read_image_version "$2")"`, 'version-fixture', versionsScript, dir.replaceAll('\\', '/')], { encoding: 'utf8' });
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

test('panel and image metadata match between packages and lock root versions', () => {
  const manifests = ['backend', 'frontend'].map(area => JSON.parse(read(area + '/package.json')));
  assert.equal(manifests[0].version, manifests[1].version);
  assert.equal(typeof manifests[0].gamepanelImageVersion, 'string');
  assert.ok(manifests[0].gamepanelImageVersion.trim().length > 0);
  assert.equal(manifests[0].gamepanelImageVersion, manifests[1].gamepanelImageVersion);
  for (let i = 0; i < manifests.length; i++) {
    const area = ['backend', 'frontend'][i];
    const lock = JSON.parse(read(area + '/package-lock.json'));
    assert.equal(lock.version, manifests[i].version);
    assert.equal(lock.packages[''].version, manifests[i].version);
  }
});

test('backend panel release 1.6.1 continues to use existing game and updater images 1.6.0', async () => {
  await backendFixture({ version: '1.6.1', gamepanelImageVersion: '1.6.0' }, ({ app, images }) => {
    assert.equal(app.getAppVersion(), '1.6.1');
    assert.equal(app.getGamePanelImageVersion(), '1.6.0');
    assert.equal(images.gamePanelImage('gamepanel-updater'), 'ovhcom/gamepanel-updater:1.6.0');
    assert.equal(images.gamePanelImage('gamepanel-minecraft-java-edition-java21'), 'ovhcom/gamepanel-minecraft-java-edition-java21:1.6.0');
  });
});

test('backend legacy packages without image metadata preserve their old image version', async () => {
  await backendFixture({ version: '1.5.0' }, ({ app, images }) => {
    assert.equal(app.getAppVersion(), '1.5.0');
    assert.equal(app.getGamePanelImageVersion(), '1.5.0');
    assert.equal(images.gamePanelImage('gamepanel-updater'), 'ovhcom/gamepanel-updater:1.5.0');
  });
});

test('backend empty metadata uses the panel version and image tags keep legacy v normalization', async () => {
  await backendFixture({ version: '1.5.0', gamepanelImageVersion: '' }, ({ images }) => {
    assert.equal(images.gamePanelImageTag(), '1.5.0');
  });
  await backendFixture({ version: '1.6.1', gamepanelImageVersion: ' v1.6.0 ' }, ({ images }) => {
    assert.equal(images.gamePanelImageTag(), '1.6.0');
  });
});

test('frontend version and every game catalog image use independent injected versions', () => {
  const app = frontendFixture('1.6.1', '1.6.0');
  assert.equal(app.getAppVersion(), '1.6.1');
  assert.equal(app.getGamePanelImageVersion(), '1.6.0');
  const catalog = { exports: {}, require: name => { assert.equal(name, './appInfo'); return app; } };
  vm.runInNewContext(transpile('frontend/utils/ovhcloudCatalog.ts', ts.ModuleKind.CommonJS), catalog);
  assert.ok(catalog.exports.OVHCLOUD_IMAGES.length > 20);
  assert.ok(catalog.exports.OVHCLOUD_IMAGES.every(image => image.dockerImage.startsWith('ovhcom/') && image.dockerImage.endsWith(':1.6.0')));
});

test('frontend legacy builds without the new constant fall back without throwing', () => {
  const app = frontendFixture('1.5.0', undefined, false);
  assert.equal(app.getGamePanelImageVersion(), '1.5.0');
  assert.equal(frontendFixture('1.5.0', '').getGamePanelImageVersion(), '1.5.0');
});

test('shell deployment reads panel 1.6.1 and compatible image 1.6.0', () => {
  const metadata = { version: '1.6.1', gamepanelImageVersion: '1.6.0' };
  const result = shellFixture(metadata, metadata);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '1.6.1|1.6.0');
});

test('shell image metadata uses the same trimmed tag normalization as the runtime', () => {
  const metadata = { version: '1.6.1', gamepanelImageVersion: ' v1.6.0 ' };
  const result = shellFixture(metadata, metadata);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '1.6.1|1.6.0');
});

test('shell legacy packages without metadata use their original image version', () => {
  const result = shellFixture({ version: '1.5.0' }, { version: '1.5.0' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, '1.5.0|1.5.0');
});

test('shell blocks mismatched panel or image versions before deployment', () => {
  const imageMismatch = shellFixture({ version: '1.6.1', gamepanelImageVersion: '1.6.0' }, { version: '1.6.1', gamepanelImageVersion: '1.5.0' });
  assert.equal(imageMismatch.status, 19);
  assert.match(imageMismatch.stderr, /Image version mismatch/);
  const appMismatch = shellFixture({ version: '1.6.1', gamepanelImageVersion: '1.6.0' }, { version: '1.6.0', gamepanelImageVersion: '1.6.0' });
  assert.equal(appMismatch.status, 19);
  assert.match(appMismatch.stderr, /Version mismatch/);
});

for (const script of ['deploy/lib/versions.sh', 'deploy/lib/common.sh', 'deploy/lib/update-common.sh', 'deploy/install.sh', 'deploy/update.sh', 'deploy/rollback.sh']) {
  test('shell syntax ' + script, () => execFileSync(bash, ['-n', path.join(root, script)]));
}
