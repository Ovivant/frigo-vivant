import type { HealthCue } from '../types';

interface StatusPillProps {
  cue: HealthCue | string;
  tone?: 'health' | 'info' | 'warning';
}

export function StatusPill({ cue, tone = 'health' }: StatusPillProps) {
  const styles = {
    health: 'border-leaf-200 bg-leaf-50 text-leaf-700',
    info: 'border-plum-100 bg-plum-100/60 text-stone-700',
    warning: 'border-orange-200 bg-orange-50 text-orange-800',
  }[tone];

  return <span className={`inline-flex rounded-[8px] border px-2.5 py-1 text-xs font-bold ${styles}`}>{cue}</span>;
}
