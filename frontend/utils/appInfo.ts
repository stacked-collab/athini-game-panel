function readVersionFromPackageJson(): string | null {
  const value = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__.trim() : '';
  return value || null;
}

export function getAppVersion(): string {
  return readVersionFromPackageJson() ?? '0.0.0-dev';
}

/** Uses the compatible upstream image release, with legacy builds as fallback. */
export function getGamePanelImageVersion(): string {
  const value = typeof __IMAGE_VERSION__ === 'string' ? __IMAGE_VERSION__.trim() : '';
  return value || getAppVersion();
}
