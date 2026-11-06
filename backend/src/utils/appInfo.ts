import fs from 'fs';

interface PackageVersions {
  version?: unknown;
  gamepanelImageVersion?: unknown;
}

function readPackageVersions(): PackageVersions | null {
  try {
    const raw = fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8');
    return JSON.parse(raw) as PackageVersions;
  } catch {
    return null;
  }
}

function versionValue(value: unknown): string | null {
  return typeof value === 'string' ? value.trim() || null : null;
}

export function getAppVersion(): string {
  return versionValue(readPackageVersions()?.version) ?? '0.0.0-dev';
}

/** Athini releases may keep the upstream game and updater images unchanged. */
export function getGamePanelImageVersion(): string {
  const versions = readPackageVersions();
  return versionValue(versions?.gamepanelImageVersion)
    ?? versionValue(versions?.version)
    ?? '0.0.0-dev';
}
