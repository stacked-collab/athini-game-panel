// Athini customization: branded logo; provider identifiers are unchanged. See NOTICE.
import type { CSSProperties } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface ProviderBadgeProps {
  provider?: string;
}

function AthiniEmblem({ style }: { style?: CSSProperties }) {
  return <img src="/athini-logo.svg" alt="Athini" style={{ height: 20, width: 20, display: 'block', ...style }} />;
}

export function ProviderLogo({ provider, height = 22 }: { provider?: string; height?: number }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  if (provider === 'ovhcloud') {
    return <AthiniEmblem style={{ height, width: 'auto', flexShrink: 0 }} />;
  }
  if (provider === 'linuxgsm') {
    return (
      <img
        src={isDark ? '/LinuxGSM_colour_white_logo.svg' : '/LinuxGSM_colour_black_logo.svg'}
        alt="LinuxGSM"
        style={{ height, width: 'auto', flexShrink: 0 }}
      />
    );
  }
  if (provider === 'external') {
    return (
      <span style={{
        fontSize: Math.round(height * 0.55),
        fontWeight: 600,
        color: isDark ? '#9ca3af' : '#6b7280',
        border: `1px solid ${isDark ? '#6b7280' : '#9ca3af'}`,
        borderRadius: 4,
        padding: '1px 5px',
        letterSpacing: '0.04em',
        flexShrink: 0,
        lineHeight: 1.4,
      }}>
        External
      </span>
    );
  }
  return null;
}

const BADGE_SLOT = 36;

export function ProviderBadge({ provider }: ProviderBadgeProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const slot: CSSProperties = {
    width: BADGE_SLOT,
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  if (provider === 'ovhcloud') {
    return (
      <div style={slot}>
        <AthiniEmblem />
      </div>
    );
  }

  if (provider === 'linuxgsm') {
    return (
      <div style={slot}>
        <img
          src={isDark ? '/LinuxGSM_colour_white_logo.svg' : '/LinuxGSM_colour_black_logo.svg'}
          alt="LinuxGSM"
          style={{ height: 28, width: 'auto', maxWidth: BADGE_SLOT }}
        />
      </div>
    );
  }

  if (provider === 'external') {
    return (
      <div style={slot}>
        <span style={{
          fontSize: 9,
          fontWeight: 700,
          color: isDark ? '#9ca3af' : '#6b7280',
          border: `1px solid ${isDark ? '#6b7280' : '#9ca3af'}`,
          borderRadius: 3,
          padding: '1px 4px',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          lineHeight: 1.4,
        }}>
          Ext
        </span>
      </div>
    );
  }

  return null;
}
