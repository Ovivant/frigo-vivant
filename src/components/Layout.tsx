import type { ReactNode } from 'react';
import { Leaf } from 'lucide-react';
import { BottomNav } from './BottomNav';
import type { AppView } from '../types';

interface LayoutProps {
  activeView: AppView;
  onChangeView: (view: AppView) => void;
  shoppingCount: number;
  children: ReactNode;
}

export function Layout({ activeView, onChangeView, shoppingCount, children }: LayoutProps) {
  return (
    <div className="min-h-screen pb-24 text-stone-800">
      <header className="sticky top-0 z-30 border-b border-leaf-100/80 bg-oat-50/90 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between pb-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-[8px] bg-leaf-100 text-leaf-700">
              <Leaf aria-hidden className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-clay-500">Frigo Vivant</p>
              <h1 className="text-xl font-black text-stone-900">Cuisine locale, sans pression</h1>
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-md flex-col gap-4 px-4 py-4">{children}</main>
      <BottomNav activeView={activeView} onChange={onChangeView} shoppingCount={shoppingCount} />
    </div>
  );
}
