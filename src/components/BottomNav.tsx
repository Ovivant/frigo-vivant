import { Home, PackageSearch, ShoppingBasket, UserRound, Utensils } from 'lucide-react';
import type { AppView } from '../types';

const navItems: Array<{ id: AppView; label: string; Icon: typeof Home }> = [
  { id: 'home', label: 'Accueil', Icon: Home },
  { id: 'inventory', label: 'Inventaire', Icon: PackageSearch },
  { id: 'meals', label: 'Repas', Icon: Utensils },
  { id: 'shopping', label: 'Courses', Icon: ShoppingBasket },
  { id: 'profile', label: 'Profil', Icon: UserRound },
];

interface BottomNavProps {
  activeView: AppView;
  onChange: (view: AppView) => void;
  shoppingCount: number;
}

export function BottomNav({ activeView, onChange, shoppingCount }: BottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-leaf-100 bg-oat-50/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-2 backdrop-blur">
      <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
        {navItems.map(({ id, label, Icon }) => {
          const active = activeView === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`relative flex min-h-14 flex-col items-center justify-center rounded-[8px] px-1 text-[0.72rem] font-bold transition ${
                active ? 'bg-leaf-100 text-leaf-700' : 'text-stone-500'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <Icon aria-hidden className="mb-1 h-5 w-5" strokeWidth={2.2} />
              <span>{label}</span>
              {id === 'shopping' && shoppingCount > 0 ? (
                <span className="absolute right-2 top-1 rounded-full bg-clay-300 px-1.5 text-[0.65rem] leading-5 text-white">
                  {shoppingCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
