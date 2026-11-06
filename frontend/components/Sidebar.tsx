// Athini palette customization; see NOTICE.
import { useState, useRef, useEffect } from 'react';
import { KeyRound, Moon, MoreVertical, Power, Sun, X } from 'lucide-react';
import { Icon, type IconName } from '@ovhcloud/ods-react';
import { getAppVersion } from '../utils/appInfo';
import type { AuthUser } from '../utils/permissions';
import { useTheme } from '../contexts/ThemeContext';
import {
  AppButton,
  AppModal,
  AppModalBody,
  AppModalContent,
  AppModalDescription,
  AppModalHeader,
  AppModalTitle,
} from '../src/ui/components';
import { PanelUpdateModal } from './PanelUpdateModal';
import { apiClient, type PanelUpdateCheck } from '../utils/api';
import { AthiniBrand } from './AthiniBrand';
import { useBodyScrollLock } from '../src/ui/utils/useBodyScrollLock';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout?: () => void;
  onChangePassword?: () => void;
  canManageUsers?: boolean;
  staticLayout?: boolean;
  currentUser?: AuthUser | null;
}

interface UserMenuRowProps {
  currentUserInitial: string;
  currentUserLabel: string;
  isDark: boolean;
  toggleTheme: () => void;
  onChangePassword?: () => void;
  onLogout?: () => void;
}

function UserMenuRow({
  currentUserInitial,
  currentUserLabel,
  isDark,
  toggleTheme,
  onChangePassword,
  onLogout,
}: UserMenuRowProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="flex items-center gap-2 px-1 py-0.5">
      <div className="gp-user-avatar flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold border-[#3c6250] bg-[#15221d] text-[var(--color-cyan-400)]">
        {currentUserInitial}
      </div>
      <p
        className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-100"
        title={currentUserLabel}
      >
        {currentUserLabel}
      </p>
      <button
        type="button"
        onClick={toggleTheme}
        className={`cursor-pointer shrink-0 rounded-md p-1 transition-colors ${isDark ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
      </button>
      <div
        ref={ref}
        className="relative shrink-0"
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
        }}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`cursor-pointer rounded-md p-1 transition-colors ${isDark ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
          aria-label="User menu"
          aria-haspopup="menu"
          aria-expanded={open}
          title="User menu"
        >
          <MoreVertical className="h-4 w-4" />
        </button>
        {open && (
          <div role="menu"
            className={`absolute bottom-full right-0 mb-3 w-44 overflow-hidden rounded-xl border shadow-lg ${isDark ? 'border-white/10 bg-[#15221d]' : 'border-gray-200 bg-white'}`}>
            <button
              type="button"
              role="menuitem"
              onClick={() => { setOpen(false); onChangePassword?.(); }}
              className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-colors ${isDark ? 'text-[#dce5df] hover:bg-[#172320]' : 'text-gray-800 hover:bg-gray-100'}`}
            >
              <KeyRound className="h-4 w-4 text-[var(--color-cyan-400)]" />
              Change password
            </button>
            <div className={`mx-2 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`} />
            <button
              type="button"
              role="menuitem"
              onClick={() => { setOpen(false); onLogout?.(); }}
              className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-[#e86180] transition-colors ${isDark ? 'hover:bg-[#291126]' : 'hover:bg-red-50'}`}
            >
              <Power className="h-4 w-4" />
              Log out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Athini branding customization; upstream copyright and license are retained in LICENSE.
export function Sidebar({
  activeTab, onTabChange, onLogout, onChangePassword,
  canManageUsers = true, staticLayout = false, currentUser = null,
}: SidebarProps) {
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [isPanelUpdateOpen, setIsPanelUpdateOpen] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<PanelUpdateCheck | null>(null);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  useBodyScrollLock(isLegalModalOpen);
  const layoutClasses = staticLayout ? 'relative h-full' : 'fixed left-0 top-0 h-screen';
  const widthClasses = staticLayout ? 'w-full' : 'w-52';
  const currentUserLabel = currentUser?.username || 'Unknown user';
  const currentUserInitial = currentUserLabel.trim().charAt(0).toUpperCase() || '?';
  const appVersion = getAppVersion();

  useEffect(() => {
    if (!currentUser?.isRoot) return;
    apiClient.checkPanelUpdate().then(setUpdateInfo).catch(() => {});
  }, [currentUser?.isRoot]);

  const menuItems: Array<{ id: string; label: string; iconName: IconName; disabled?: boolean }> = [
    { id: 'game-servers', label: 'Game Servers', iconName: 'game-controller-alt' },
    { id: 'host-status', label: 'Host Status', iconName: 'analysis' },
    { id: 'admin-users', label: 'User Administration', iconName: 'user', disabled: !canManageUsers },
    { id: 'resources', label: 'Resources', iconName: 'book' },
  ];

  return (
    <aside className={`athini-sidebar ${widthClasses} border-r flex flex-col ${layoutClasses} overflow-y-auto`}>
      <div className="athini-sidebar__brand border-b px-4 py-4">
        <AthiniBrand />
      </div>
      <nav className="gp-sidebar-nav p-2 flex-1" aria-label="Main navigation">
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <AppButton
              key={item.id}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => { if (!item.disabled) onTabChange(item.id); }}
              disabled={Boolean(item.disabled)}
              tone={isActive ? 'secondary' : 'ghost'}
              className={`athini-sidebar__item mb-1 flex w-full items-center justify-start gap-3 rounded-lg px-4 py-3 text-left transition-colors ${isActive ? 'athini-sidebar__item--active' : ''}`}
            >
              <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center"><Icon name={item.iconName} className="text-lg leading-none" /></span>
              <span className="text-sm font-medium leading-none">{item.label}</span>
            </AppButton>
          );
        })}
      </nav>
      <div className="gp-sidebar-bottom">
        <div className="border-y bg-transparent px-2 py-2.5 border-white/10">
          <UserMenuRow currentUserInitial={currentUserInitial} currentUserLabel={currentUserLabel} isDark={isDark} toggleTheme={toggleTheme} onChangePassword={onChangePassword} onLogout={onLogout} />
        </div>
        <div className="athini-sidebar__footer flex flex-wrap items-center justify-center gap-2 px-3 py-3 text-[10px]">
          {currentUser?.isRoot ? (
            <button type="button" onClick={() => setIsPanelUpdateOpen(true)} title={updateInfo?.updateAvailable ? `Update available: v${updateInfo.latestVersion}` : 'Panel update'} className="relative rounded-sm px-1">
              v{appVersion}
              {updateInfo?.updateAvailable && <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-orange-400" />}
            </button>
          ) : <span>v{appVersion}</span>}
          <button type="button" onClick={() => setIsLegalModalOpen(true)} className="rounded-sm px-1">Legal</button>
          <a href="https://athini.host/es/support" target="_blank" rel="noopener noreferrer" className="rounded-sm px-1">Support</a>
        </div>
      </div>
      <AppModal open={isLegalModalOpen} closeOnInteractOutside={false} onOpenChange={setIsLegalModalOpen}>
        <AppModalContent dismissible={false} className="w-full max-w-2xl overflow-hidden rounded-2xl border shadow-xl">
          <AppModalHeader className="flex items-start justify-between border-b p-6">
            <div className="space-y-1"><AppModalTitle className="text-xl font-semibold">Athini Game Panel</AppModalTitle><AppModalDescription>Service information and open-source attribution</AppModalDescription></div>
            <AppButton type="button" tone="ghost" onClick={() => setIsLegalModalOpen(false)} className="rounded border-none bg-transparent p-2" aria-label="Close legal information"><X className="h-5 w-5" /></AppButton>
          </AppModalHeader>
          <AppModalBody className="space-y-4 p-6 text-sm leading-6">
            <p>This panel is the Athini customization of <a href="https://github.com/ovh/game-panel" target="_blank" rel="noopener noreferrer">OVHcloud Game Panel</a>, based on version 1.6.0.</p>
            <p>The original software is Copyright OVH 2026, licensed under the Apache License, Version 2.0. Original license and copyright notices are retained in the project.</p>
            <p>Athini branding and interface customizations are distributed with this version. Games, LinuxGSM and other included software remain subject to their respective licenses.</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <a href="https://athini.host/es/terminos" target="_blank" rel="noopener noreferrer">Athini terms</a>
              <a href="https://athini.host/es/privacidad" target="_blank" rel="noopener noreferrer">Privacy policy</a>
              <a href="https://github.com/stacked-collab/athini-game-panel/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">Software license</a>
            </div>
          </AppModalBody>
        </AppModalContent>
      </AppModal>
      <PanelUpdateModal isOpen={isPanelUpdateOpen} onClose={() => setIsPanelUpdateOpen(false)} updateInfo={updateInfo} />
    </aside>
  );
}
