import { Download, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { StorageLocationManager } from '../components/StorageLocationManager';
import type { FoodOwner, StorageLocation, UserProfile } from '../types';

const splitList = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

interface ProfilePageProps {
  profile: UserProfile;
  locations: StorageLocation[];
  onUpdateProfile: (profile: UserProfile) => void;
  onRenameLocation: (id: string, name: string) => void;
  onToggleLocationVisible: (id: string, visible: boolean) => void;
  onMoveLocation: (id: string, direction: 'up' | 'down') => void;
  onExport: () => void;
  onImport: (file: File) => Promise<void>;
}

export function ProfilePage({
  profile,
  locations,
  onUpdateProfile,
  onRenameLocation,
  onToggleLocationVisible,
  onMoveLocation,
  onExport,
  onImport,
}: ProfilePageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importMessage, setImportMessage] = useState('');

  const update = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => onUpdateProfile({ ...profile, [key]: value });

  return (
    <>
      <section className="app-panel p-4">
        <p className="text-sm font-bold text-leaf-700">Profil</p>
        <h2 className="text-2xl font-black text-stone-950">Préférences de Goulven</h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Tout reste local sur l’appareil. L’export JSON prépare la future migration vers une app iPhone locale.
        </p>
      </section>

      <section className="app-panel space-y-4 p-4">
        <h3 className="text-lg font-black text-stone-950">Alimentation</h3>
        <label className="field-label">
          Nom
          <input className="field mt-1" value={profile.name} onChange={(event) => update('name', event.target.value)} />
        </label>
        <label className="field-label">
          Régime alimentaire
          <textarea className="field mt-1 min-h-24 py-3" value={profile.dietNotes} onChange={(event) => update('dietNotes', event.target.value)} />
        </label>
        <label className="field-label">
          Aliments interdits
          <input
            className="field mt-1"
            value={profile.forbiddenFoods.join(', ')}
            onChange={(event) => update('forbiddenFoods', splitList(event.target.value))}
          />
        </label>
        <label className="field-label">
          Aliments à limiter
          <input
            className="field mt-1"
            value={profile.limitedFoods.join(', ')}
            onChange={(event) => update('limitedFoods', splitList(event.target.value))}
          />
        </label>
        <label className="field-label">
          Objectifs
          <textarea
            className="field mt-1 min-h-24 py-3"
            value={profile.goals.join(', ')}
            onChange={(event) => update('goals', splitList(event.target.value))}
          />
        </label>
      </section>

      <section className="app-panel space-y-4 p-4">
        <h3 className="text-lg font-black text-stone-950">Bio, local et magasins</h3>
        <div className="grid gap-2">
          <label className="chip justify-start">
            <input
              type="checkbox"
              checked={profile.preferences.organic}
              onChange={(event) => update('preferences', { ...profile.preferences, organic: event.target.checked })}
            />
            Bio recommandé
          </label>
          <label className="chip justify-start">
            <input
              type="checkbox"
              checked={profile.preferences.local}
              onChange={(event) => update('preferences', { ...profile.preferences, local: event.target.checked })}
            />
            Local recommandé
          </label>
          <label className="chip justify-start">
            <input
              type="checkbox"
              checked={profile.preferences.shortSupplyChain}
              onChange={(event) => update('preferences', { ...profile.preferences, shortSupplyChain: event.target.checked })}
            />
            Circuits courts
          </label>
          <label className="chip justify-start">
            <input
              type="checkbox"
              checked={profile.preferences.minimallyProcessed}
              onChange={(event) => update('preferences', { ...profile.preferences, minimallyProcessed: event.target.checked })}
            />
            Peu transformé
          </label>
        </div>

        <label className="field-label">
          Magasins favoris
          <input
            className="field mt-1"
            value={profile.favoriteStores.join(', ')}
            onChange={(event) => update('favoriteStores', splitList(event.target.value))}
          />
        </label>
      </section>

      <section className="app-panel space-y-4 p-4">
        <h3 className="text-lg font-black text-stone-950">Colocation</h3>
        <label className="field-label">
          Statut
          <select
            className="field mt-1"
            value={profile.roommateStatus}
            onChange={(event) => update('roommateStatus', event.target.value as UserProfile['roommateStatus'])}
          >
            <option>à définir</option>
            <option>seul</option>
            <option>partagé</option>
          </select>
        </label>
        <label className="field-label">
          Propriétaire par défaut
          <select className="field mt-1" value={profile.defaultOwner} onChange={(event) => update('defaultOwner', event.target.value as FoodOwner)}>
            <option>moi</option>
            <option>colocataire</option>
            <option>commun</option>
            <option>non défini</option>
          </select>
        </label>
      </section>

      <StorageLocationManager
        locations={locations}
        onRename={onRenameLocation}
        onToggleVisible={onToggleLocationVisible}
        onMove={onMoveLocation}
      />

      <section className="app-panel space-y-3 p-4">
        <h3 className="text-lg font-black text-stone-950">Export / import JSON</h3>
        <p className="text-sm leading-6 text-stone-600">
          Utile pour sauvegarder, tester, ou migrer plus tard vers une app iPhone avec stockage local et IA embarquée.
        </p>
        <button type="button" className="secondary-button w-full" onClick={onExport}>
          <Download aria-hidden className="h-5 w-5" />
          Exporter mes données
        </button>
        <button type="button" className="secondary-button w-full" onClick={() => fileInputRef.current?.click()}>
          <Upload aria-hidden className="h-5 w-5" />
          Importer un JSON
        </button>
        <input
          ref={fileInputRef}
          className="hidden"
          type="file"
          accept="application/json"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            try {
              await onImport(file);
              setImportMessage('Import réussi.');
            } catch (error) {
              setImportMessage(error instanceof Error ? error.message : 'Import impossible.');
            } finally {
              event.currentTarget.value = '';
            }
          }}
        />
        {importMessage ? <p className="text-sm font-bold text-leaf-700">{importMessage}</p> : null}
      </section>
    </>
  );
}
