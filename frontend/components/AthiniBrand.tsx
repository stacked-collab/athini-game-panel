// Athini branding customization; original project is licensed under Apache-2.0.
export function AthiniBrand({ className = '', compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div className={`athini-brand ${compact ? 'athini-brand--compact' : ''} ${className}`} aria-label="Athini Game Panel">
      <img src="/athini-logo.svg" alt="" width={128} height={128} draggable={false} />
      <span><strong>Athini</strong><small>Game Panel</small></span>
    </div>
  );
}
