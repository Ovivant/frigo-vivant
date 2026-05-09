import { useMemo, useState } from 'react';
import { Save, X } from 'lucide-react';
import type { FoodCategory, FoodDateType, FoodItem, FoodOwner, FoodStatus, StorageLocation, UserProfile } from '../types';
import { isoInDays } from '../lib/date';
import { newId } from '../lib/format';

const categories: FoodCategory[] = ['Fruits & légumes', 'Frais', 'Épicerie sèche', 'Protéines', 'Surgelé', 'Autre'];
const dateTypes: FoodDateType[] = ['DLC', 'DDM', 'ouverture', 'congélation'];
const statuses: FoodStatus[] = ['fermé', 'ouvert', 'entamé'];
const owners: FoodOwner[] = ['moi', 'colocataire', 'commun', 'non défini'];

interface FoodFormProps {
  food?: FoodItem;
  profile: UserProfile;
  locations: StorageLocation[];
  onCancel: () => void;
  onSave: (food: FoodItem) => void;
}

export function FoodForm({ food, profile, locations, onCancel, onSave }: FoodFormProps) {
  const visibleLocations = useMemo(() => locations.filter((location) => location.visible), [locations]);
  const fallbackLocationId = visibleLocations[0]?.id ?? locations[0]?.id ?? 'frigo';
  const [draft, setDraft] = useState<FoodItem>(
    food ?? {
      id: newId('food'),
      name: '',
      category: 'Fruits & légumes',
      quantity: 1,
      unit: 'pièce',
      storageLocationId: fallbackLocationId,
      expirationDate: isoInDays(5),
      dateType: 'DLC',
      addedAt: new Date().toISOString(),
      isOrganic: profile.preferences.organic,
      isLocal: profile.preferences.local,
      store: profile.favoriteStores[0] ?? '',
      status: 'fermé',
      owner: profile.defaultOwner,
      notes: '',
      isFavorite: false,
      reminderDaysBefore: 3,
    },
  );

  const update = <K extends keyof FoodItem>(key: K, value: FoodItem[K]) => setDraft((current) => ({ ...current, [key]: value }));

  return (
    <form
      className="app-panel space-y-4 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!draft.name.trim()) return;
        onSave({ ...draft, name: draft.name.trim() });
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-leaf-700">{food ? 'Modifier' : 'Ajouter'}</p>
          <h2 className="text-xl font-black text-stone-950">Aliment</h2>
        </div>
        <button type="button" className="secondary-button !min-h-10 !px-3" onClick={onCancel} aria-label="Fermer">
          <X aria-hidden className="h-5 w-5" />
        </button>
      </div>

      <label className="field-label">
        Nom
        <input className="field mt-1" value={draft.name} onChange={(event) => update('name', event.target.value)} placeholder="Ex. carottes" />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="field-label">
          Quantité
          <input
            className="field mt-1"
            type="number"
            min="0"
            step="0.1"
            value={draft.quantity}
            onChange={(event) => update('quantity', Number(event.target.value))}
          />
        </label>
        <label className="field-label">
          Unité
          <input className="field mt-1" value={draft.unit} onChange={(event) => update('unit', event.target.value)} />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="field-label">
          Catégorie
          <select className="field mt-1" value={draft.category} onChange={(event) => update('category', event.target.value as FoodCategory)}>
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Lieu
          <select className="field mt-1" value={draft.storageLocationId} onChange={(event) => update('storageLocationId', event.target.value)}>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
                {location.visible ? '' : ' (masqué)'}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="field-label">
          Date limite
          <input className="field mt-1" type="date" value={draft.expirationDate} onChange={(event) => update('expirationDate', event.target.value)} />
        </label>
        <label className="field-label">
          Type de date
          <select className="field mt-1" value={draft.dateType} onChange={(event) => update('dateType', event.target.value as FoodDateType)}>
            {dateTypes.map((dateType) => (
              <option key={dateType}>{dateType}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="field-label">
          Statut
          <select className="field mt-1" value={draft.status} onChange={(event) => update('status', event.target.value as FoodStatus)}>
            {statuses.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
        <label className="field-label">
          Propriétaire
          <select className="field mt-1" value={draft.owner} onChange={(event) => update('owner', event.target.value as FoodOwner)}>
            {owners.map((owner) => (
              <option key={owner}>{owner}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="field-label">
          Magasin
          <input className="field mt-1" value={draft.store} onChange={(event) => update('store', event.target.value)} list="favorite-stores" />
          <datalist id="favorite-stores">
            {profile.favoriteStores.map((store) => (
              <option key={store}>{store}</option>
            ))}
          </datalist>
        </label>
        <label className="field-label">
          Prix optionnel
          <input
            className="field mt-1"
            type="number"
            min="0"
            step="0.01"
            value={draft.purchasePrice ?? ''}
            onChange={(event) => update('purchasePrice', event.target.value ? Number(event.target.value) : undefined)}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="chip justify-start">
          <input type="checkbox" checked={draft.isOrganic} onChange={(event) => update('isOrganic', event.target.checked)} />
          Bio
        </label>
        <label className="chip justify-start">
          <input type="checkbox" checked={draft.isLocal} onChange={(event) => update('isLocal', event.target.checked)} />
          Local
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="chip justify-start">
          <input type="checkbox" checked={Boolean(draft.isFavorite)} onChange={(event) => update('isFavorite', event.target.checked)} />
          Favori
        </label>
        <label className="field-label">
          Rappel avant date
          <select
            className="field mt-1"
            value={draft.reminderDaysBefore ?? 3}
            onChange={(event) => update('reminderDaysBefore', Number(event.target.value))}
          >
            <option value={1}>1 jour</option>
            <option value={2}>2 jours</option>
            <option value={3}>3 jours</option>
            <option value={7}>7 jours</option>
            <option value={14}>14 jours</option>
          </select>
        </label>
      </div>

      <label className="field-label">
        Notes
        <textarea className="field mt-1 min-h-24 py-3" value={draft.notes} onChange={(event) => update('notes', event.target.value)} />
      </label>

      <button type="submit" className="primary-button w-full">
        <Save aria-hidden className="h-5 w-5" />
        Enregistrer
      </button>
    </form>
  );
}
