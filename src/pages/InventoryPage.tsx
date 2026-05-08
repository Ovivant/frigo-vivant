import { Plus, RotateCcw, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { FoodCard } from '../components/FoodCard';
import { FoodForm } from '../components/FoodForm';
import type { FoodItem, StorageIcon, StorageLocation, UserProfile } from '../types';
import { daysUntil, sortByExpiration } from '../lib/date';

type InventoryFilter = 'Tous' | 'À manger vite' | 'Frigo' | 'Placards' | 'Bio' | 'Ouverts';

const filters: InventoryFilter[] = ['Tous', 'À manger vite', 'Frigo', 'Placards', 'Bio', 'Ouverts'];

interface InventoryPageProps {
  profile: UserProfile;
  foods: FoodItem[];
  locations: StorageLocation[];
  onSaveFood: (food: FoodItem) => void;
  onConsume: (foodId: string) => void;
  onFreeze: (foodId: string) => void;
  onDiscard: (foodId: string) => void;
  onMoveFood: (foodId: string, locationId: string) => void;
  onAddLocation: (name: string, icon?: StorageIcon) => void;
  onReactivateLocation: (locationId: string) => void;
}

export function InventoryPage({
  profile,
  foods,
  locations,
  onSaveFood,
  onConsume,
  onFreeze,
  onDiscard,
  onMoveFood,
  onAddLocation,
  onReactivateLocation,
}: InventoryPageProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<InventoryFilter>('Tous');
  const [editingFood, setEditingFood] = useState<FoodItem | undefined>();
  const [isFoodFormOpen, setIsFoodFormOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');

  const locationById = useMemo(() => new Map(locations.map((location) => [location.id, location])), [locations]);
  const hiddenLocations = locations.filter((location) => !location.visible);

  const filteredFoods = useMemo(() => {
    return sortByExpiration(foods).filter((food) => {
      const matchesSearch = [food.name, food.category, food.store, food.notes].join(' ').toLowerCase().includes(query.toLowerCase());
      const location = locationById.get(food.storageLocationId);
      const matchesFilter =
        filter === 'Tous' ||
        (filter === 'À manger vite' && daysUntil(food.expirationDate) <= 7) ||
        (filter === 'Frigo' && location?.name.toLowerCase().includes('frigo')) ||
        (filter === 'Placards' && location?.name.toLowerCase().includes('placard')) ||
        (filter === 'Bio' && food.isOrganic) ||
        (filter === 'Ouverts' && food.status !== 'fermé');

      return matchesSearch && matchesFilter;
    });
  }, [filter, foods, locationById, query]);

  const groupedFoods = useMemo(() => {
    return [...locations]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((location) => ({
        location,
        foods: filteredFoods.filter((food) => food.storageLocationId === location.id),
      }))
      .filter((group) => group.location.visible || group.foods.length > 0);
  }, [filteredFoods, locations]);

  const openAddFood = () => {
    setEditingFood(undefined);
    setIsFoodFormOpen(true);
    setIsAddMenuOpen(false);
  };

  return (
    <>
      <section className="app-panel p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black text-stone-950">Inventaire</h2>
            <p className="mt-1 text-sm leading-6 text-stone-600">{foods.length} aliment{foods.length > 1 ? 's' : ''} en local.</p>
          </div>
          <button type="button" className="primary-button !px-3" onClick={() => setIsAddMenuOpen((open) => !open)} aria-label="Ajouter">
            <Plus aria-hidden className="h-6 w-6" />
          </button>
        </div>

        {isAddMenuOpen ? (
          <div className="mt-4 grid gap-2 rounded-[8px] border border-leaf-100 bg-oat-50 p-3">
            <button type="button" className="secondary-button justify-start" onClick={openAddFood}>
              <Plus aria-hidden className="h-5 w-5" />
              Ajouter un aliment
            </button>
            <form
              className="grid gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (!newLocationName.trim()) return;
                onAddLocation(newLocationName.trim(), 'box');
                setNewLocationName('');
                setIsAddMenuOpen(false);
              }}
            >
              <input
                className="field"
                value={newLocationName}
                onChange={(event) => setNewLocationName(event.target.value)}
                placeholder="Nouvel espace de stockage"
              />
              <button type="submit" className="secondary-button justify-start">
                <Plus aria-hidden className="h-5 w-5" />
                Ajouter un espace
              </button>
            </form>

            {hiddenLocations.length ? (
              <div className="grid gap-2">
                {hiddenLocations.map((location) => (
                  <button key={location.id} type="button" className="secondary-button justify-start" onClick={() => onReactivateLocation(location.id)}>
                    <RotateCcw aria-hidden className="h-5 w-5" />
                    Réactiver {location.name}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      {isFoodFormOpen ? (
        <FoodForm
          food={editingFood}
          profile={profile}
          locations={locations}
          onCancel={() => setIsFoodFormOpen(false)}
          onSave={(food) => {
            onSaveFood(food);
            setIsFoodFormOpen(false);
            setEditingFood(undefined);
          }}
        />
      ) : null}

      <section className="space-y-3">
        <label className="relative block">
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
          <input className="field pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher un aliment" />
        </label>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {filters.map((item) => (
            <button key={item} type="button" className={`chip shrink-0 ${filter === item ? 'chip-active' : ''}`} onClick={() => setFilter(item)}>
              {item}
            </button>
          ))}
        </div>
      </section>

      {filteredFoods.length ? (
        groupedFoods.map((group) =>
          group.foods.length ? (
            <section key={group.location.id} className="space-y-3">
              <h3 className="px-1 text-sm font-black uppercase tracking-[0.12em] text-clay-500">
                {group.location.name}
                {group.location.visible ? '' : ' · masqué'}
              </h3>
              {group.foods.map((food) => (
                <FoodCard
                  key={food.id}
                  food={food}
                  profile={profile}
                  locations={locations}
                  onEdit={(item) => {
                    setEditingFood(item);
                    setIsFoodFormOpen(true);
                  }}
                  onConsume={onConsume}
                  onFreeze={onFreeze}
                  onDiscard={onDiscard}
                  onMove={onMoveFood}
                />
              ))}
            </section>
          ) : null,
        )
      ) : (
        <EmptyState title="Aucun aliment trouvé">Essaie un autre filtre ou ajoute un aliment avec le bouton +.</EmptyState>
      )}
    </>
  );
}
