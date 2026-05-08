import { Check, Edit3, MoveRight, Snowflake, Trash2 } from 'lucide-react';
import type { FoodItem, StorageLocation } from '../types';
import { getUrgencyLabel, getUrgencyLevel, urgencyClasses } from '../lib/date';
import { foodHealthCue } from '../lib/health';
import { formatCurrency, formatQuantity } from '../lib/format';
import type { UserProfile } from '../types';
import { StatusPill } from './StatusPill';

interface FoodCardProps {
  food: FoodItem;
  profile: UserProfile;
  locations: StorageLocation[];
  onEdit: (food: FoodItem) => void;
  onConsume: (foodId: string) => void;
  onFreeze: (foodId: string) => void;
  onDiscard: (foodId: string) => void;
  onMove: (foodId: string, locationId: string) => void;
}

export function FoodCard({ food, profile, locations, onEdit, onConsume, onFreeze, onDiscard, onMove }: FoodCardProps) {
  const location = locations.find((item) => item.id === food.storageLocationId);
  const urgency = getUrgencyLevel(food.expirationDate);
  const cue = foodHealthCue(food, profile);

  return (
    <article className="app-panel overflow-hidden">
      <div className={`border-b px-4 py-3 ${urgencyClasses[urgency]}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-stone-950">{food.name}</h3>
            <p className="mt-1 text-sm font-semibold">
              {formatQuantity(food.quantity, food.unit)} · {food.category}
            </p>
          </div>
          <span className="rounded-[8px] bg-white/70 px-2 py-1 text-xs font-black">{getUrgencyLabel(food.expirationDate)}</span>
        </div>
      </div>

      <div className="space-y-3 px-4 py-3">
        <div className="grid grid-cols-2 gap-2 text-sm text-stone-600">
          <p>
            <span className="font-bold text-stone-800">Lieu</span>
            <br />
            {location?.name ?? 'Non défini'}
          </p>
          <p>
            <span className="font-bold text-stone-800">Date</span>
            <br />
            {food.dateType} · {food.expirationDate}
          </p>
          <p>
            <span className="font-bold text-stone-800">Statut</span>
            <br />
            {food.status}
          </p>
          <p>
            <span className="font-bold text-stone-800">Propriétaire</span>
            <br />
            {food.owner}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {food.isOrganic ? <StatusPill cue="Bio" /> : null}
          {food.isLocal ? <StatusPill cue="Local" /> : null}
          <StatusPill cue={cue} tone={cue.startsWith('Attention') || cue.startsWith('Non adapté') ? 'warning' : 'health'} />
        </div>

        <p className="text-sm leading-6 text-stone-600">
          {food.store ? `Acheté chez ${food.store}` : 'Magasin non renseigné'}
          {food.purchasePrice ? ` · ${formatCurrency(food.purchasePrice)}` : ''}
          {food.notes ? ` · ${food.notes}` : ''}
        </p>

        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="secondary-button !min-h-11 !text-sm" onClick={() => onEdit(food)}>
            <Edit3 aria-hidden className="h-4 w-4" />
            Modifier
          </button>
          <button type="button" className="secondary-button !min-h-11 !text-sm" onClick={() => onConsume(food.id)}>
            <Check aria-hidden className="h-4 w-4" />
            Consommé
          </button>
          <button type="button" className="secondary-button !min-h-11 !text-sm" onClick={() => onFreeze(food.id)}>
            <Snowflake aria-hidden className="h-4 w-4" />
            Congeler
          </button>
          <button type="button" className="danger-button" onClick={() => onDiscard(food.id)}>
            <Trash2 aria-hidden className="h-4 w-4" />
            Jeter
          </button>
        </div>

        <label className="field-label flex items-center gap-2">
          <MoveRight aria-hidden className="h-4 w-4" />
          Déplacer
          <select className="field mt-1" value={food.storageLocationId} onChange={(event) => onMove(food.id, event.target.value)}>
            {locations.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
                {item.visible ? '' : ' (masqué)'}
              </option>
            ))}
          </select>
        </label>
      </div>
    </article>
  );
}
