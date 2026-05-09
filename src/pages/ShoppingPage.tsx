import { Camera, CheckCircle2, ClipboardCopy, Phone, Plus, Save, ShoppingBag, Upload, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import type { FoodCategory, FoodItem, GroceryStore, OpeningTimeRange, ShoppingItem, UserProfile, Weekday } from '../types';
import { formatCurrency, formatDecimal } from '../lib/format';
import { EmptyState } from '../components/EmptyState';
import { formatOpeningHours, getNextOpening, isFrenchPublicHoliday, isStoreOpen, weekdayLabels } from '../lib/stores';
import { parseTicketText, type ParsedTicketItem } from '../lib/ticketParser';

const categories: FoodCategory[] = ['Fruits & légumes', 'Frais', 'Épicerie sèche', 'Protéines', 'Surgelé', 'Autre'];
const priorityOrder = { haute: 0, moyenne: 1, douce: 2 };
const weekdayOrder: Weekday[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

interface ShoppingPageProps {
  profile: UserProfile;
  foods: FoodItem[];
  items: ShoppingItem[];
  stores: GroceryStore[];
  onTogglePurchased: (id: string) => void;
  onAddManualItem: (name: string, category: FoodCategory) => void;
  onAddPurchasedToInventory: () => void;
  onUpdateStoreHours: (storeId: string, day: Weekday, ranges: OpeningTimeRange[]) => void;
  onImportTicketItems: (items: ParsedTicketItem[]) => void;
}

const parseHoursInput = (value: string): OpeningTimeRange[] =>
  value
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [open, close] = part.split('-').map((item) => item.trim());
      return open && close ? { open, close } : undefined;
    })
    .filter(Boolean) as OpeningTimeRange[];

export function ShoppingPage({
  profile,
  foods,
  items,
  stores,
  onTogglePurchased,
  onAddManualItem,
  onAddPurchasedToInventory,
  onUpdateStoreHours,
  onImportTicketItems,
}: ShoppingPageProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<FoodCategory>('Fruits & légumes');
  const [copied, setCopied] = useState(false);
  const [ticketText, setTicketText] = useState('');
  const [ticketItems, setTicketItems] = useState<ParsedTicketItem[]>([]);
  const [scanMessage, setScanMessage] = useState('');
  const [isTicketPanelOpen, setIsTicketPanelOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uncheckedCount = items.filter((item) => !item.purchased).length;
  const purchasedCount = items.filter((item) => item.purchased).length;
  const inventoryNames = useMemo(() => new Set(foods.map((food) => food.name.toLowerCase())), [foods]);
  const now = new Date();
  const isHoliday = isFrenchPublicHoliday(now);
  const shoppingListText = items
    .filter((item) => !item.purchased)
    .map((item) => `- ${item.name} (${item.quantity} ${item.unit}) · ${item.suggestedStore || profile.favoriteStores[0] || 'magasin à choisir'}`)
    .join('\n');

  const copyShoppingList = async () => {
    const text = shoppingListText || 'Liste de courses vide.';
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.append(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const parseTicket = (text: string) => {
    const parsed = parseTicketText(text, profile.favoriteStores[0] ?? '');
    setTicketItems(parsed);
    setScanMessage(parsed.length ? `${parsed.length} produit${parsed.length > 1 ? 's' : ''} détecté${parsed.length > 1 ? 's' : ''}.` : 'Aucun produit détecté.');
  };

  const scanTicketImage = async (file: File) => {
    setIsTicketPanelOpen(true);
    setScanMessage('Analyse locale du ticket...');
    const imageUrl = URL.createObjectURL(file);
    const image = new Image();
    image.src = imageUrl;
    await image.decode();

    const LocalTextDetector = (window as unknown as { TextDetector?: new () => { detect: (source: HTMLImageElement) => Promise<Array<{ rawValue: string }>> } }).TextDetector;
    if (!LocalTextDetector) {
      setScanMessage('OCR local non disponible dans ce navigateur. Tu peux saisir ou coller le texte du ticket ci-dessous.');
      URL.revokeObjectURL(imageUrl);
      return;
    }

    try {
      const detector = new LocalTextDetector();
      const detections = await detector.detect(image);
      const text = detections.map((item) => item.rawValue).join('\n');
      setTicketText(text);
      parseTicket(text);
    } catch {
      setScanMessage('OCR local impossible sur cette photo. Tu peux saisir ou corriger le texte avant validation.');
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
  };

  const ticketFreshCount = ticketItems.filter((item) => ['Fruits & légumes', 'Frais', 'Protéines'].includes(item.category)).length;
  const ticketLimitedCount = ticketItems.filter((item) => item.hasGluten).length;
  const ticketTotal = ticketItems.reduce((total, item) => total + (item.purchasePrice ?? 0), 0);

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

        <button type="button" className="secondary-button mt-2 w-full" onClick={copyShoppingList}>
          <ClipboardCopy aria-hidden className="h-5 w-5" />
          {copied ? 'Liste copiée' : 'Copier la liste de courses'}
        </button>

        <button type="button" className="primary-button mt-2 w-full" onClick={() => fileInputRef.current?.click()}>
          <Camera aria-hidden className="h-5 w-5" />
          Scanner un ticket
        </button>
        <input
          ref={fileInputRef}
          className="hidden"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void scanTicketImage(file);
            event.currentTarget.value = '';
          }}
        />
      </section>

      {isTicketPanelOpen ? (
        <section className="app-panel space-y-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-leaf-700">Ticket</p>
              <h2 className="text-2xl font-black text-stone-950">Validation avant import</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">{scanMessage}</p>
            </div>
            <button type="button" className="secondary-button !min-h-10 !px-3" onClick={() => setIsTicketPanelOpen(false)} aria-label="Fermer">
              <X aria-hidden className="h-5 w-5" />
            </button>
          </div>

          <textarea
            className="field min-h-32 py-3"
            value={ticketText}
            onChange={(event) => {
              setTicketText(event.target.value);
              parseTicket(event.target.value);
            }}
            placeholder={'Texte du ticket détecté ou saisi\nEx. endives bio 0,350kg frigo DDM 6j bio Rayols prix 2,07 prixkg 5,90'}
          />

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-[8px] border border-leaf-100 bg-white p-3">
              <p className="text-xs font-bold uppercase text-stone-500">Détectés</p>
              <p className="text-xl font-black text-stone-950">{ticketItems.length}</p>
            </div>
            <div className="rounded-[8px] border border-leaf-100 bg-white p-3">
              <p className="text-xs font-bold uppercase text-stone-500">Frais</p>
              <p className="text-xl font-black text-stone-950">{ticketFreshCount}</p>
            </div>
            <div className="rounded-[8px] border border-orange-100 bg-orange-50 p-3">
              <p className="text-xs font-bold uppercase text-orange-700">À limiter</p>
              <p className="text-xl font-black text-orange-900">{ticketLimitedCount}</p>
            </div>
            <div className="rounded-[8px] border border-leaf-100 bg-white p-3">
              <p className="text-xs font-bold uppercase text-stone-500">Total ticket</p>
              <p className="text-xl font-black text-stone-950">{formatCurrency(ticketTotal)}</p>
            </div>
          </div>

          <div className="space-y-2">
            {ticketItems.map((item) => (
              <article key={item.id} className="rounded-[8px] border border-leaf-100 bg-white p-3 text-sm">
                <p className="font-black text-stone-950">{item.name}</p>
                <p className="mt-1 text-stone-600">
                  {formatDecimal(item.quantity)} {item.unit} · {item.category} · {item.storageHint}
                </p>
                <p className="mt-1 text-stone-600">
                  {item.purchasePrice ? `${formatCurrency(item.purchasePrice)} · ` : ''}
                  {item.pricePerUnit ? `${formatCurrency(item.pricePerUnit)}/${item.unit === 'L' || item.unit === 'ml' ? 'L' : 'kg'} ${item.pricePerUnitKind === 'calculé' ? '(calculé)' : ''}` : ''}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.isOrganic ? <span className="rounded-[8px] bg-leaf-50 px-2 py-1 text-xs font-bold text-leaf-700">Bio / AB</span> : null}
                  {item.hasGluten ? <span className="rounded-[8px] bg-orange-50 px-2 py-1 text-xs font-bold text-orange-800">Gluten à limiter</span> : null}
                </div>
              </article>
            ))}
          </div>

          <button
            type="button"
            className="primary-button w-full"
            disabled={!ticketItems.length}
            onClick={() => {
              onImportTicketItems(ticketItems);
              setTicketText('');
              setTicketItems([]);
              setIsTicketPanelOpen(false);
            }}
          >
            <Upload aria-hidden className="h-5 w-5" />
            Importer dans l’inventaire
          </button>
        </section>
      ) : null}

      <section className="app-panel space-y-4 p-4">
        <div>
          <p className="text-sm font-bold text-leaf-700">Magasins</p>
          <h2 className="text-2xl font-black text-stone-950">Ouverture avant de partir</h2>
          {isHoliday ? (
            <p className="mt-2 rounded-[8px] border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-bold text-orange-800">
              Attention : jour férié. Vérifie l’ouverture avant de te déplacer.
            </p>
          ) : null}
        </div>

        {stores.map((store) => {
          const open = isStoreOpen(store, now);
          const hasHours = weekdayOrder.some((day) => store.openingHours[day]?.length);
          const statusLabel = !hasHours ? 'Horaires à renseigner' : isHoliday ? 'Jour férié : à vérifier' : open ? 'Ouvert maintenant' : 'Fermé maintenant';
          return (
            <article key={store.id} className="rounded-[8px] border border-leaf-100 bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-black text-stone-950">{store.name}</h3>
                  <p className="mt-1 text-sm leading-6 text-stone-600">{store.address}</p>
                </div>
                <span className={`rounded-[8px] px-2 py-1 text-xs font-black ${open && !isHoliday ? 'bg-leaf-100 text-leaf-700' : 'bg-stone-100 text-stone-700'}`}>
                  {statusLabel}
                </span>
              </div>
              {store.notes ? <p className="mt-2 text-sm text-stone-600">{store.notes}</p> : null}
              <p className="mt-2 text-sm font-semibold text-stone-700">Prochaine ouverture : {getNextOpening(store, now)}</p>
              {store.phone ? (
                <a className="secondary-button mt-3 w-full" href={`tel:${store.phone.replace(/\s/g, '')}`}>
                  <Phone aria-hidden className="h-5 w-5" />
                  Appeler
                </a>
              ) : null}

              <div className="mt-4 space-y-2">
                {weekdayOrder.map((day) => (
                  <label key={day} className="grid grid-cols-[5.5rem_1fr_auto] items-center gap-2 text-sm">
                    <span className="font-bold text-stone-700">{weekdayLabels[day]}</span>
                    <input
                      className="field !min-h-10"
                      defaultValue={formatOpeningHours(store.openingHours[day])}
                      onBlur={(event) => onUpdateStoreHours(store.id, day, event.target.value.toLowerCase().includes('fermé') ? [] : parseHoursInput(event.target.value))}
                    />
                    <Save aria-hidden className="h-4 w-4 text-stone-400" />
                  </label>
                ))}
              </div>
            </article>
          );
        })}
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
