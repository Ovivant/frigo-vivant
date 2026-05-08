import { ArrowDown, ArrowUp, Eye, EyeOff, RotateCcw, Save } from 'lucide-react';
import { useState } from 'react';
import type { StorageLocation } from '../types';

interface StorageLocationManagerProps {
  locations: StorageLocation[];
  onRename: (id: string, name: string) => void;
  onToggleVisible: (id: string, visible: boolean) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
}

export function StorageLocationManager({ locations, onRename, onToggleVisible, onMove }: StorageLocationManagerProps) {
  const [draftNames, setDraftNames] = useState<Record<string, string>>(() =>
    Object.fromEntries(locations.map((location) => [location.id, location.name])),
  );
  const sorted = [...locations].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <section className="app-panel space-y-3 p-4">
      <div>
        <h2 className="text-lg font-black text-stone-950">Espaces de stockage</h2>
        <p className="mt-1 text-sm leading-6 text-stone-600">
          Le congélateur peut être masqué et réactivé plus tard depuis le bouton + ou le profil.
        </p>
      </div>

      <div className="space-y-3">
        {sorted.map((location, index) => (
          <div key={location.id} className="rounded-[8px] border border-leaf-100 bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <input
                className="field min-h-11 flex-1"
                value={draftNames[location.id] ?? location.name}
                onChange={(event) => setDraftNames((current) => ({ ...current, [location.id]: event.target.value }))}
              />
              <button
                type="button"
                className="secondary-button !min-h-11 !px-3"
                onClick={() => onRename(location.id, (draftNames[location.id] ?? location.name).trim() || location.name)}
                aria-label="Enregistrer le nom"
              >
                <Save aria-hidden className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2">
              <button
                type="button"
                className="secondary-button !min-h-10 !px-2"
                onClick={() => onMove(location.id, 'up')}
                disabled={index === 0}
                aria-label="Monter"
              >
                <ArrowUp aria-hidden className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="secondary-button !min-h-10 !px-2"
                onClick={() => onMove(location.id, 'down')}
                disabled={index === sorted.length - 1}
                aria-label="Descendre"
              >
                <ArrowDown aria-hidden className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="secondary-button col-span-2 !min-h-10 !text-sm"
                onClick={() => onToggleVisible(location.id, !location.visible)}
              >
                {location.visible ? <EyeOff aria-hidden className="h-4 w-4" /> : <Eye aria-hidden className="h-4 w-4" />}
                {location.visible ? 'Masquer' : 'Réactiver'}
              </button>
            </div>

            {!location.visible ? (
              <p className="mt-2 flex items-center gap-2 text-xs font-bold text-stone-500">
                <RotateCcw aria-hidden className="h-3.5 w-3.5" />
                Espace masqué, toujours disponible dans les données.
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
