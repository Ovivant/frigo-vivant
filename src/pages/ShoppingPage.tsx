import { CheckCircle2, Plus, ShoppingBag } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { FoodCategory, FoodItem, ShoppingItem, UserProfile } from '../types';
import { formatCurrency } from '../lib/format';
import { EmptyState } from '../components/EmptyState';

const categories: FoodCategory[] = ['Fruits & légumes', 'Frais', 'Épicerie sèche', 'Protéines', 'Surgelé', 'Autre'];
const priorityOrder = { haute: 0, moyenne: 1, douce: 2 };

interface ShoppingPageProps {
  profile: UserProfile;
  foods: FoodItem[];
  items: ShoppingItem[];
  onTogglePurchased: (id: string) => void;
  onAddManualItem: (name: string, category: FoodCategory) => void;
  onAddPurchasedToInventory: () => void;
}

export function ShoppingPage({ profile, foods, items, onTogglePurchased, onAddManualItem, onAddPurchasedToInventory }: ShoppingPageProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<FoodCategory>('Fruits & légumes');
  const uncheckedCount = items.filter((item) => !item.purchased).length;
  const purchasedCount = items.filter((item) => item.purchased).length;
  const inventoryNames = useMemo(() => new Set(foods.map((food) => food.name.toLowerCase())), [foods]);

  return (
    <>
      <section className="app-panel p-4">
        <p className="text-sm font-bold text-leaf-700">Courses</p>
        <h2 className="text-2xl font-black text-stone-950">Liste intelligente</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Les doublons avec l’inventaire sont évités au moment de l’ajout. Les magasins favoris restent en priorité.
        </p>

        <form
          className="mt-4 grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim()) return;
            onAddManualItem(name.trim(), category);
            setName('');
          }}
        >
          <input className="field" value={name} onChange={(event) => setName(event.target.value)} placeholder="Ajouter un article" />
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <select className="field" value={category} onChange={(event) => setCategory(event.target.value as FoodCategory)}>
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <button type="submit" className="primary-button !px-3" aria-label="Ajouter aux courses">
              <Plus aria-hidden className="h-5 w-5" />
            </button>
          </div>
        </form>

        <button type="button" className="secondary-button mt-4 w-full" onClick={onAddPurchasedToInventory} disabled={!purchasedCount}>
          <ShoppingBag aria-hidden className="h-5 w-5" />
          Ajouter les courses achetées à l’inventaire
        </button>
      </section>

      {items.length ? (
        categories.map((group) => {
          const groupItems = items.filter((item) => item.category === group).sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
          if (!groupItems.length) return null;

          return (
            <section key={group} className="space-y-3">
              <h3 className="px-1 text-sm font-black uppercase tracking-[0.12em] text-clay-500">{group}</h3>
              {groupItems.map((item) => {
                const duplicate = inventoryNames.has(item.name.toLowerCase());
                return (
                  <article key={item.id} className={`app-panel p-4 ${item.purchased ? 'opacity-70' : ''}`}>
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        className={`mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-[8px] border ${
                          item.purchased ? 'border-leaf-400 bg-leaf-100 text-leaf-700' : 'border-leaf-200 bg-white text-stone-400'
                        }`}
                        onClick={() => onTogglePurchased(item.id)}
                        aria-label={item.purchased ? 'Marquer non acheté' : 'Marquer acheté'}
                      >
                        <CheckCircle2 aria-hidden className="h-5 w-5" />
                      </button>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h4 className="text-lg font-black text-stone-950">{item.name}</h4>
                            <p className="text-sm font-semibold text-stone-600">
                              {item.quantity} {item.unit} · priorité {item.priority}
                            </p>
                          </div>
                          {item.organicRecommended ? (
                            <span className="rounded-[8px] border border-leaf-200 bg-leaf-50 px-2 py-1 text-xs font-bold text-leaf-700">Bio</span>
                          ) : null}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-stone-600">
                          {item.reason}
                          {duplicate ? ' Déjà présent dans l’inventaire.' : ''}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-stone-700">
                          {item.suggestedStore || profile.favoriteStores[0] || 'Magasin à choisir'}
                          {item.price ? ` · ${formatCurrency(item.price)}` : ''}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>
          );
        })
      ) : (
        <EmptyState title="Liste vide">Ajoute les ingrédients manquants depuis une suggestion de repas ou saisis un article.</EmptyState>
      )}

      <p className="px-1 text-center text-sm text-stone-500">
        {uncheckedCount} article{uncheckedCount > 1 ? 's' : ''} restant{uncheckedCount > 1 ? 's' : ''}.
      </p>
    </>
  );
}
