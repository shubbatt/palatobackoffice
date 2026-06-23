'use client';

import { type TrafficLight, type CheckResult } from '@/types';
import { clsx } from 'clsx';

// ── Badge ─────────────────────────────────────────────────────────
const BADGE_STYLES: Record<string, string> = {
  green:   'bg-green-dim  text-palato-green',
  amber:   'bg-amber-dim  text-palato-amber',
  red:     'bg-red-dim    text-palato-red',
  pass:    'bg-green-dim  text-palato-green',
  pending: 'bg-[#1a1f2e]  text-muted',
};

const DOT_STYLES: Record<string, string> = {
  green:   'bg-palato-green',
  amber:   'bg-palato-amber',
  red:     'bg-palato-red',
  pass:    'bg-palato-green',
  pending: 'bg-muted',
};

export function Badge({
  status,
  children,
  className,
}: {
  status: TrafficLight | CheckResult | 'pending' | string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-bold tracking-wide uppercase',
        BADGE_STYLES[status] ?? 'bg-[#1a1f2e] text-muted',
        className
      )}
    >
      <span
        className={clsx(
          'inline-block h-1.5 w-1.5 rounded-full shrink-0',
          DOT_STYLES[status] ?? 'bg-muted'
        )}
      />
      {children ?? status.toUpperCase()}
    </span>
  );
}

// ── Card ──────────────────────────────────────────────────────────
export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        'rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-md hover:shadow-black/20',
        className
      )}
    >
      {children}
    </div>
  );
}

// ── Btn ───────────────────────────────────────────────────────────
type BtnVariant = 'default' | 'ghost' | 'danger' | 'success' | 'amber';

const BTN_VARIANTS: Record<BtnVariant, string> = {
  default: 'bg-accent text-bg hover:opacity-90',
  ghost:   'border border-border text-muted hover:border-accent hover:text-text',
  danger:  'bg-red-dim border border-palato-red text-palato-red hover:bg-palato-red hover:text-bg',
  success: 'bg-green-dim border border-palato-green text-palato-green hover:bg-palato-green hover:text-bg',
  amber:   'bg-amber-dim border border-palato-amber text-palato-amber hover:bg-palato-amber hover:text-bg',
};

export function Btn({
  children,
  onClick,
  variant = 'default',
  size = 'md',
  disabled,
  loading,
  icon,
  type = 'button',
  className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: BtnVariant;
  size?: 'sm' | 'md';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  type?: 'button' | 'submit';
  className?: string;
}) {
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={clsx(
        'inline-flex items-center gap-2 rounded-md font-semibold transition-all',
        size === 'sm' ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-sm',
        BTN_VARIANTS[variant],
        isDisabled && 'cursor-not-allowed opacity-40',
        className
      )}
    >
      {loading ? (
        <span
          className={clsx(
            'inline-block animate-spin rounded-full border-2 border-current border-t-transparent',
            size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
          )}
        />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}

// ── Field (input/select wrapper) ──────────────────────────────────
export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-widest text-muted">
        {label}
      </label>
      {children}
      {error && <span className="text-xs text-palato-red">{error}</span>}
    </div>
  );
}

export const inputCls =
  'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text placeholder-muted focus:border-accent focus:outline-none transition-colors';

// ── SectionHead ───────────────────────────────────────────────────
export function SectionHead({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between border-b border-border pb-2">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted">
        {children}
      </span>
      {action && <div>{action}</div>}
    </div>
  );
}

// ── KPI card ──────────────────────────────────────────────────────
const KPI_BORDER: Record<string, string> = {
  green: 'border-t-palato-green',
  amber: 'border-t-palato-amber',
  red:   'border-t-palato-red',
};

export function KpiCard({
  label,
  value,
  sub,
  status,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  status?: TrafficLight;
  icon?: React.ReactNode;
}) {
  const valueColor =
    status === 'red' ? 'text-palato-red' :
    status === 'amber' ? 'text-palato-amber' :
    status === 'green' ? 'text-palato-green' : 'text-text';

  const topBorder = status ? KPI_BORDER[status] : 'border-t-border';

  return (
    <div
      className={clsx(
        'rounded-lg border border-border bg-card p-4 border-t-[3px] transition-shadow hover:shadow-md hover:shadow-black/20',
        topBorder
      )}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-muted">{label}</div>
        {icon && <div className="text-muted shrink-0">{icon}</div>}
      </div>
      <div className={clsx('text-2xl font-bold tabular-nums', valueColor)}>{value}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  );
}

// ── Alert banner ──────────────────────────────────────────────────
export function AlertBanner({
  severity,
  children,
}: {
  severity: TrafficLight;
  children: React.ReactNode;
}) {
  const styles: Record<TrafficLight, string> = {
    red:   'border-palato-red   bg-red-dim   text-palato-red',
    amber: 'border-palato-amber bg-amber-dim text-palato-amber',
    green: 'border-palato-green bg-green-dim text-palato-green',
  };
  return (
    <div className={clsx('flex items-center gap-3 rounded-lg border px-4 py-3', styles[severity])}>
      <span className="text-lg">{severity === 'red' ? '⚠' : severity === 'amber' ? '!' : '✓'}</span>
      <div className="text-sm font-semibold">{children}</div>
    </div>
  );
}

// ── Spinner ───────────────────────────────────────────────────────
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return (
    <div
      className={clsx(
        'animate-spin rounded-full border-[3px] border-border border-t-accent',
        size === 'sm' ? 'h-4 w-4' : 'h-8 w-8'
      )}
    />
  );
}

// ── Empty state ───────────────────────────────────────────────────
export function EmptyState({ icon = '📋', message }: { icon?: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border py-14 text-muted">
      <span className="text-3xl">{icon}</span>
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────────
export function ProgressBar({
  value,
  max,
  color = 'accent',
}: {
  value: number;
  max: number;
  color?: 'accent' | 'green' | 'amber' | 'red';
}) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const colorMap = {
    accent: 'bg-accent',
    green:  'bg-palato-green',
    amber:  'bg-palato-amber',
    red:    'bg-palato-red',
  };
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
      <div
        className={clsx('h-full rounded-full transition-all', colorMap[color])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ── Page Header ───────────────────────────────────────────────────
export function PageHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("mb-6 flex items-start justify-between", className)}>
      <div>
        <h1 className="text-2xl font-bold text-text">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ── Data Table ────────────────────────────────────────────────────
type ColAlign = 'left' | 'right' | 'center';

const ALIGN_CLS: Record<ColAlign, string> = {
  left:   'text-left',
  right:  'text-right',
  center: 'text-center',
};

export function DataTable<T>({
  columns,
  headers,
  rows,
  keyExtractor,
  renderRow,
}: {
  columns?: { key: string; label: string; align?: ColAlign }[];
  headers?: string[];
  rows: T[];
  keyExtractor?: (item: T) => string | number;
  renderRow?: (item: T) => React.ReactNode;
}) {
  if (rows.length === 0) {
    return <EmptyState message="No data to display" />;
  }
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-surface">
            {columns ? (
              columns.map((col) => (
                <th
                  key={col.key}
                  className={clsx(
                    'px-4 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted',
                    ALIGN_CLS[col.align ?? 'left']
                  )}
                >
                  {col.label}
                </th>
              ))
            ) : (
              headers?.map((h, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest text-muted"
                >
                  {h}
                </th>
              ))
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={keyExtractor ? keyExtractor(row) : i}
              className="border-t border-border transition-colors hover:bg-surface/50"
            >
              {renderRow ? (
                renderRow(row)
              ) : (
                columns?.map((col) => (
                  <td
                    key={col.key}
                    className={clsx(
                      'px-4 py-3 text-sm',
                      ALIGN_CLS[col.align ?? 'left']
                    )}
                  >
                    {(row as any)[col.key]}
                  </td>
                ))
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
