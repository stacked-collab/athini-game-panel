// Athini palette customization; see NOTICE.
import { useState } from 'react';
import { ArrowUpCircle, CheckCircle2, RefreshCw, X, AlertTriangle } from 'lucide-react';
import {
  AppButton,
  AppModal,
  AppModalBody,
  AppModalContent,
  AppModalHeader,
  AppModalTitle,
} from '../src/ui/components';
import { useTheme } from '../contexts/ThemeContext';
import { useBodyScrollLock } from '../src/ui/utils/useBodyScrollLock';
import { apiClient, type PanelUpdateCheck, type ReleaseNotes } from '../utils/api';
import { Markdown } from './Markdown';

interface PanelUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  updateInfo: PanelUpdateCheck | null;
}

function ReleaseNotesBlock({ release, isDark, heading }: { release: ReleaseNotes; isDark: boolean; heading?: string }) {
  const hasMeta = heading || release.prerelease || release.htmlUrl;
  return (
    <div className="space-y-1.5">
      {hasMeta && (
        <div className="flex flex-wrap items-center gap-2">
          {heading && (
            <span className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-[#a7b6ad]'}`}>
              {heading}
            </span>
          )}
          {release.prerelease && (
            <span className="rounded-full border border-amber-500/30 bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold text-amber-400">
              pre-release
            </span>
          )}
          {release.htmlUrl && (
            <a
              href={release.htmlUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-[11px] text-[#2b5440] hover:underline"
            >
              View on GitHub
            </a>
          )}
        </div>
      )}
      {release.body
        ? <Markdown className={isDark ? 'text-slate-300' : 'text-[#52695b]'}>{release.body}</Markdown>
        : <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-[#a7b6ad]'}`}>No release notes available.</p>}
    </div>
  );
}

type ModalState = 'idle' | 'starting' | 'started' | 'error';

export function PanelUpdateModal({ isOpen, onClose, updateInfo }: PanelUpdateModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  useBodyScrollLock(isOpen);
  const [state, setState] = useState<ModalState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleClose = () => {
    setState('idle');
    setErrorMessage(null);
    onClose();
  };

  const handleUpdate = async () => {
    if (!updateInfo?.latestVersion) return;
    setState('starting');
    setErrorMessage(null);
    try {
      await apiClient.startPanelUpdate(updateInfo.latestVersion);
      setState('started');
    } catch (err: unknown) {
      const message =
        (err as any)?.response?.data?.error ??
        (err instanceof Error ? err.message : 'Failed to start update');
      setErrorMessage(message);
      setState('error');
    }
  };

  const noUpdate = updateInfo && !updateInfo.updateAvailable && updateInfo.latestVersion !== null;
  const noLatest = updateInfo?.latestVersion === null;

  return (
    <AppModal open={isOpen} closeOnInteractOutside={false} onOpenChange={(open) => !open && handleClose()}>
      <AppModalContent
        dismissible={false}
        className={`z-[61] flex max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl flex-col overflow-hidden rounded-xl border shadow-xl ${
          isDark
            ? 'border-white/10 bg-[#141f1c]'
            : 'border-[#dce5df] bg-white'
        }`}
      >
        <AppModalHeader
          className={`flex shrink-0 items-center justify-between border-b px-5 py-4 ${
            isDark ? 'border-white/10 bg-[#172320]' : 'border-[#dce5df] bg-[#fafcf8]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`rounded-full p-2 ${isDark ? 'bg-[#254c39]/20' : 'bg-blue-50'}`}>
              <ArrowUpCircle className="h-5 w-5 text-[#2b5440]" />
            </div>
            <div>
              <AppModalTitle className={`text-base font-semibold ${isDark ? 'text-white' : 'text-[#15221d]'}`}>
                Panel Update
              </AppModalTitle>
            </div>
          </div>
          <AppButton
            type="button"
            tone="ghost"
            onClick={handleClose}
            className={`rounded border-none bg-transparent p-2 transition-colors ${
              isDark
                ? 'text-gray-400 hover:bg-gray-700 hover:text-red-400'
                : 'text-[#a7b6ad] hover:bg-[#f1f5f1] hover:text-[#dc2626]'
            }`}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </AppButton>
        </AppModalHeader>

        <AppModalBody className="flex-1 overflow-y-auto px-5 py-5">
          {state === 'started' && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className={`rounded-full p-3 ${isDark ? 'bg-green-500/10' : 'bg-green-50'}`}>
                <CheckCircle2 className="h-7 w-7 text-green-400" />
              </div>
              <div className="space-y-2">
                <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#15221d]'}`}>
                  Update started
                </p>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-[#52695b]'}`}>
                  The panel may be unavailable for a few minutes.
                  <br />
                  Refresh this page after the service comes back.
                </p>
              </div>
              <AppButton
                type="button"
                tone="secondary"
                onClick={handleClose}
                className="mt-1 w-full !text-white"
              >
                Close
              </AppButton>
            </div>
          )}

          {state === 'error' && (
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div className={`shrink-0 rounded-full p-2 ${isDark ? 'bg-red-500/10' : 'bg-red-50'}`}>
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div className="space-y-1">
                  <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#15221d]'}`}>
                    Update failed to start
                  </p>
                  <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-[#52695b]'}`}>
                    {errorMessage}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <AppButton
                  type="button"
                  tone="ghost"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Close
                </AppButton>
                <AppButton
                  type="button"
                  tone="secondary"
                  onClick={() => { setState('idle'); setErrorMessage(null); }}
                  className="flex-1 !text-white"
                >
                  Try again
                </AppButton>
              </div>
            </div>
          )}

          {(state === 'idle' || state === 'starting') && (noUpdate || noLatest) && (
            <div className="flex flex-col gap-4">
              <div className={`rounded-lg border px-4 py-3 text-sm ${
                isDark ? 'border-white/10 bg-white/5 text-slate-300' : 'border-[#dce5df] bg-[#fafcf8] text-[#52695b]'
              }`}>
                {noLatest
                  ? 'Up to date — no newer release found.'
                  : `Your panel is up to date — v${updateInfo!.currentVersion}`}
              </div>

              {updateInfo?.currentRelease && (
                <ReleaseNotesBlock release={updateInfo.currentRelease} isDark={isDark} heading="What's in your version" />
              )}

              <AppButton type="button" tone="secondary" onClick={handleClose} className="self-center px-6 !text-white">
                Close
              </AppButton>
            </div>
          )}

          {(state === 'idle' || state === 'starting') && updateInfo?.updateAvailable && (
            <div className="flex flex-col gap-4">
              <div className={`rounded-lg border px-4 py-4 ${
                isDark ? 'border-white/10 bg-white/5' : 'border-[#dce5df] bg-[#fafcf8]'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-[#a7b6ad]'}`}>
                      Current version
                    </p>
                    <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#15221d]'}`}>
                      v{updateInfo.currentVersion}
                    </p>
                  </div>
                  <ArrowUpCircle className="h-5 w-5 text-[#2b5440]" />
                  <div className="space-y-0.5 text-right">
                    <p className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-[#a7b6ad]'}`}>
                      Latest version
                    </p>
                    <p className="text-sm font-semibold text-[#2b5440]">
                      v{updateInfo.latestVersion}
                    </p>
                  </div>
                </div>
              </div>

              {((updateInfo.newerReleases?.length ?? 0) > 0 || updateInfo.currentRelease) && (
                <div className="space-y-4">
                  {updateInfo.newerReleases?.length > 0 && (
                    <div className="space-y-3">
                      <p className={`text-xs font-medium uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-[#a7b6ad]'}`}>
                        What&apos;s new
                      </p>
                      {updateInfo.newerReleases.map((release) => (
                        <ReleaseNotesBlock key={release.version} release={release} isDark={isDark} />
                      ))}
                    </div>
                  )}
                  {updateInfo.currentRelease && (
                    <div className="border-t pt-3 border-white/10">
                      <ReleaseNotesBlock release={updateInfo.currentRelease} isDark={isDark} heading="What's in your version" />
                    </div>
                  )}
                </div>
              )}

              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-[#72877a]'}`}>
                The backend, frontend, and Traefik stack will restart during the update.
                HTTP requests and WebSocket connections may be interrupted. This is expected.
              </p>

              <div className="flex gap-2">
                <AppButton
                  type="button"
                  tone="ghost"
                  onClick={handleClose}
                  disabled={state === 'starting'}
                  className="flex-1"
                >
                  Cancel
                </AppButton>
                <AppButton
                  type="button"
                  tone="primary"
                  onClick={handleUpdate}
                  disabled={state === 'starting'}
                  className="flex-1 gap-2"
                >
                  {state === 'starting' ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Starting…
                    </>
                  ) : (
                    <>
                      <ArrowUpCircle className="h-4 w-4" />
                      Update to v{updateInfo.latestVersion}
                    </>
                  )}
                </AppButton>
              </div>
            </div>
          )}

          {!updateInfo && (state === 'idle' || state === 'starting') && (
            <div className="flex flex-col gap-3 py-2">
              <div className={`h-16 animate-pulse rounded-lg ${isDark ? 'bg-white/5' : 'bg-[#fafcf8]'}`} />
              <div className={`h-4 w-2/3 animate-pulse rounded ${isDark ? 'bg-white/5' : 'bg-[#fafcf8]'}`} />
            </div>
          )}
        </AppModalBody>
      </AppModalContent>
    </AppModal>
  );
}
