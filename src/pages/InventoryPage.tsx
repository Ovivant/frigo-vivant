import { ClipboardList, Plus, RotateCcw, Search, Sparkles, Zap } from 'lucide-react';
import { useMemo, useState } from 'react';
import { EmptyState } from '../components/EmptyState';
import { FoodCard } from '../components/FoodCard';
import { FoodForm } from '../components/FoodForm';
import type { ConsumptionHistoryItem, FoodItem, InventorySort, StorageIcon, StorageLocation, UserProfile } from '../types';
import { daysUntil, sortByExpiration } from '../lib/date';

type InventoryFilter = 'Tous' | 'À manger vite' | 'Frigo' | 'Placards' | 'Bio' | 'Ouverts' | 'Favoris' | 'Rappels';

const filters: InventoryFilter[] = ['Tous', 'À manger vite', 'Frigo', 'Placards', 'Bio', 'Ouverts', 'Favoris', 'Rappels'];
const sortOptions: Array<{ id: InventorySort; label: string }> = [
  { id: 'intelligent', label: 'Tri intelligent' },
  { id: 'date', label: 'Date' },
  { id: 'nom', label: 'Nom' },
  { id: 'favoris', label: 'Favoris' },
  { id: 'ajout récent', label: 'Ajout récent' },
];
const quickSuggestions = ['Œufs', 'Pommes', 'Tofu', 'Courgettes', 'Riz complet', 'Lentilles'];

interface InventoryPageProps {
  profile: UserProfile;
  foods: FoodItem[];
  locations: StorageLocation[];
  onSaveFood: (food: FoodItem) => void;
  onConsume: (foodId: string) => void;
  onFreeze: (foodId: string) => void;
  onDiscard: (foodId: string) => void;
  onMoveFood: (foodId: string, locationId: string) => void;
  onDuplicateFood: (food: FoodItem) => void;
  onToggleFavorite: (foodId: string) => void;
  onAdjustQuantity: (foodId: string, delta: number) => void;
  onQuickAddFood: (name: string) => void;
  onManualScan: (rawText: string) => void;
  onAddLocation: (name: string, icon?: StorageIcon) => void;
  onReactivateLocation: (locationId: string) => void;
  consumptionHistory: ConsumptionHistoryItem[];
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
  onDuplicateFood,
  onToggleFavorite,
  onAdjustQuantity,
  onQuickAddFood,
  onManualScan,
  onAddLocation,
  onReactivateLocation,
  consumptionHistory,
}: InventoryPageProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<InventoryFilter>('Tous');
  const [sort, setSort] = useState<InventorySort>('intelligent');
  const [editingFood, setEditingFood] = useState<FoodItem | undefined>();
  const [isFoodFormOpen, setIsFoodFormOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [scanText, setScanText] = useState('');
  const [newLocationName, setNewLocationName] = useState('');

  const locationById = useMemo(() => new Map(locations.map((location) => [location.id, location])), [locations]);
  const hiddenLocations = locations.filter((location) => !location.visible);

  const reminderFoods = useMemo(
    () => sortByExpiration(foods).filter((food) => daysUntil(food.expirationDate) <= (food.reminderDaysBefore ?? 3)),
    [foods],
  );

  const filteredFoods = useMemo(() => {
    const sortedFoods = [...foods].sort((a, b) => {
      if (sort === 'nom') return a.name.localeCompare(b.name, 'fr');
      if (sort === 'favoris') return Number(Boolean(b.isFavorite)) - Number(Boolean(a.isFavorite)) || daysUntil(a.expirationDate) - daysUntil(b.expirationDate);
      if (sort === 'ajout récent') return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();

      const urgencySort = daysUntil(a.expirationDate) - daysUntil(b.expirationDate);
      if (sort === 'date') return urgencySort;
      return (
        Number(Boolean(b.isFavorite)) - Number(Boolean(a.isFavorite)) ||
        urgencySort ||
        Number(a.status === 'fermé') - Number(b.status === 'fermé')
      );
    });

    return sortedFoods.filter((food) => {
      const matchesSearch = [food.name, food.category, food.store, food.notes].join(' ').toLowerCase().includes(query.toLowerCase());
      const location = locationById.get(food.storageLocationId);
      const matchesFilter =
        filter === 'Tous' ||
        (filter === 'À manger vite' && daysUntil(food.expirationDate) <= 7) ||
        (filter === 'Frigo' && location?.name.toLowerCase().includes('frigo')) ||
        (filter === 'Placards' && location?.name.toLowerCase().includes('placard')) ||
        (filter === 'Bio' && food.isOrganic) ||
        (filter === 'Ouverts' && food.status !== 'fermé') ||
        (filter === 'Favoris' && food.isFavorite) ||
        (filter === 'Rappels' && daysUntil(food.expirationDate) <= (food.reminderDaysBefore ?? 3));

      return matchesSearch && matchesFilter;
    });
  }, [filter, foods, locationById, query, sort]);

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
            <form
              className="grid gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (!quickName.trim()) return;
                onQuickAddFood(quickName.trim());
                setQuickName('');
                setIsAddMenuOpen(false);
              }}
            >
              <label className="field-label">
                Ajout ultra rapide
                <div className="mt-1 grid grid-cols-[1fr_auto] gap-2">
                  <input className="field" value={quickName} onChange={(event) => setQuickName(event.target.value)} placeholder="Ex. tomates" />
                  <button type="submit" className="primary-button !px-3" aria-label="Ajouter rapidement">
                    <Zap aria-hidden className="h-5 w-5" />
                  </button>
                </div>
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {quickSuggestions.map((name) => (
                  <button key={name} type="button" className="chip shrink-0" onClick={() => onQuickAddFood(name)}>
                    {name}
                  </button>
                ))}
              </div>
            </form>

            <form
              className="grid gap-2 rounded-[8px] border border-leaf-100 bg-white p-3"
              onSubmit={(event) => {
                event.preventDefault();
                if (!scanText.trim()) return;
                onManualScan(scanText);
                setScanText('');
                setIsAddMenuOpen(false);
              }}
            >
              <label className="field-label">
                Scan manuel simplifié
                <textarea
                  className="field mt-1 min-h-24 py-3"
                  value={scanText}
                  onChange={(event) => setScanText(event.target.value)}
                  placeholder={'Une ligne par aliment\nEx. tomates 4 frigo 2026-05-15'}
                />
              </label>
              <button type="submit" className="secondary-button justify-start">
                <ClipboardList aria-hidden className="h-5 w-5" />
                Ajouter les lignes
              </button>
            </form>

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
        {reminderFoods.length ? (
          <div className="app-panel border-orange-200 bg-orange-50/80 p-3">
            <div className="flex items-center gap-2 text-orange-800">
              <Sparkles aria-hidden className="h-4 w-4" />
              <p className="text-sm font-black">
                {reminderFoods.length} rappel{reminderFoods.length > 1 ? 's' : ''} péremption
              </p>
            </div>
            <p className="mt-1 text-sm text-orange-800">
              {reminderFoods.slice(0, 3).map((food) => food.name).join(', ')}
              {reminderFoods.length > 3 ? '…' : ''}
            </p>
          </div>
        ) : null}

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

        <select className="field" value={sort} onChange={(event) => setSort(event.target.value as InventorySort)} aria-label="Tri de l’inventaire">
          {sortOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
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
                  onDuplicate={onDuplicateFood}
                  onToggleFavorite={onToggleFavorite}
                  onAdjustQuantity={onAdjustQuantity}
                />
              ))}
            </section>
          ) : null,
        )
      ) : (
        <EmptyState title="Aucun aliment trouvé">Essaie un autre filtre ou ajoute un aliment avec le bouton +.</EmptyState>
      )}

      {consumptionHistory.length ? (
        <section className="app-panel p-4">
          <h3 className="text-lg font-black text-stone-950">Historique récent</h3>
          <div className="mt-3 space-y-2">
            {consumptionHistory.slice(0, 5).map((item) => (
              <p key={item.id} className="rounded-[8px] border border-leaf-100 bg-white px-3 py-2 text-sm text-stone-700">
                <span className="font-black">{item.foodName}</span> · {item.action} · {new Date(item.happenedAt).toLocaleDateString('fr-FR')}
              </p>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
