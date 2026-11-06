import { getGamePanelImageVersion } from './appInfo.js';

const GAMEPANEL_IMAGE_REGISTRY = 'ovhcom';

export function gamePanelImageTag(): string {
    return getGamePanelImageVersion().replace(/^v/, '');
}

export function gamePanelImage(name: string): string {
    return `${GAMEPANEL_IMAGE_REGISTRY}/${name}:${gamePanelImageTag()}`;
}
