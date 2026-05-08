import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  children: ReactNode;
}

export function EmptyState({ title, children }: EmptyStateProps) {
  return (
    <div className="app-panel px-4 py-6 text-center">
      <h3 className="text-base font-black text-stone-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-stone-600">{children}</p>
    </div>
  );
}
