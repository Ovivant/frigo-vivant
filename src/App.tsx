import { useEffect, useMemo, useState } from 'react';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { InventoryPage } from './pages/InventoryPage';
import { MealsPage } from './pages/MealsPage';
import { ProfilePage } from './pages/ProfilePage';
import { ShoppingPage } from './pages/ShoppingPage';
import { createDefaultData } from './data/defaultData';
import { isoInDays } from './lib/date';
import { newId } from './lib/format';
import { generateMealSuggestions } from './lib/meals';
import { exportAppData, loadAppData, parseImportedAppData, saveAppData } from './lib/storage';
import type {
  AppData,
  AppView,
  ConsumptionAction,
  ConsumptionHistoryItem,
  FoodCategory,
  FoodItem,
  MealSuggestion,
  ShoppingItem,
  StorageIcon,
  UserProfile,
} from './types';

const categoryFromIngredient = (name: string): FoodCategory => {
  const lower = name.toLowerCase();
  if (/pois|œuf|oeuf|tofu|lentille|poisson|poulet/.test(lower)) return 'Protéines';
  if (/huile|riz|pâte|quinoa|graine|bocal/.test(lower)) return 'Épicerie sèche';
  if (/fromage|yaourt|crème/.test(lower)) return 'Frais';
  return 'Fruits & légumes';
};

const unitFromCategory = (category: FoodCategory) => {
  if (category === 'Fruits & légumes') return 'pièce';
  if (category === 'Épicerie sèche') return 'paquet';
  if (category === 'Protéines') return 'portion';
  return 'article';
};

const defaultExpirationDays = (category: FoodCategory) => {
  if (category === 'Épicerie sèche') return 120;
  if (category === 'Surgelé') return 90;
  if (category === 'Fruits & légumes') return 6;
  return 7;
};

function App() {
  const [activeView, setActiveView] = useState<AppView>('home');
  const [data, setData] = useState<AppData>(() => loadAppData());

  useEffect(() => {
    saveAppData(data);
  }, [data]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }
  }, []);

  const shoppingCount = useMemo(() => data.shoppingItems.filter((item) => !item.purchased).length, [data.shoppingItems]);

  const updateData = (recipe: (current: AppData) => AppData) => {
    setData((current) => saveAppData(recipe(current)));
  };

  const saveFood = (food: FoodItem) => {
    updateData((current) => {
      const exists = current.foods.some((item) => item.id === food.id);
      return {
        ...current,
        foods: exists ? current.foods.map((item) => (item.id === food.id ? food : item)) : [food, ...current.foods],
      };
    });
  };

  const recordFoodAction = (foodId: string, action: ConsumptionAction, reason?: string) => {
    updateData((current) => {
      const food = current.foods.find((item) => item.id === foodId);
      if (!food) return current;

      const historyItem: ConsumptionHistoryItem = {
        id: newId('history'),
        foodName: food.name,
        category: food.category,
        quantity: food.quantity,
        unit: food.unit,
        action,
        owner: food.owner,
        happenedAt: new Date().toISOString(),
        reason,
      };

      return {
        ...current,
        foods: current.foods.filter((item) => item.id !== foodId),
        consumptionHistory: [historyItem, ...current.consumptionHistory].slice(0, 80),
      };
    });
  };

  const duplicateFood = (food: FoodItem) => {
    saveFood({
      ...food,
      id: newId('food'),
      addedAt: new Date().toISOString(),
      notes: food.notes ? `${food.notes} Copié depuis un favori ou un achat récent.` : 'Copié depuis un aliment existant.',
    });
  };

  const toggleFavorite = (foodId: string) => {
    updateData((current) => ({
      ...current,
      foods: current.foods.map((food) => (food.id === foodId ? { ...food, isFavorite: !food.isFavorite } : food)),
    }));
  };

  const adjustQuantity = (foodId: string, delta: number) => {
    updateData((current) => ({
      ...current,
      foods: current.foods.map((food) =>
        food.id === foodId ? { ...food, quantity: Math.max(0, Math.round((food.quantity + delta) * 10) / 10) } : food,
      ),
    }));
  };

  const createQuickFood = (name: string): FoodItem => {
    const category = categoryFromIngredient(name);
    const storage = data.storageLocations.find((location) => location.id === (category === 'Épicerie sèche' ? 'placards' : 'frigo')) ?? data.storageLocations[0];

    return {
      id: newId('food'),
      name,
      category,
      quantity: 1,
      unit: unitFromCategory(category),
      storageLocationId: storage?.id ?? 'frigo',
      expirationDate: isoInDays(defaultExpirationDays(category)),
      dateType: category === 'Épicerie sèche' ? 'DDM' : 'DLC',
      addedAt: new Date().toISOString(),
      isOrganic: data.profile.preferences.organic,
      isLocal: data.profile.preferences.local,
      store: data.profile.favoriteStores[0] ?? '',
      status: 'fermé',
      owner: data.profile.defaultOwner,
      notes: 'Ajout rapide V2.1.',
      isFavorite: false,
      reminderDaysBefore: category === 'Épicerie sèche' ? 10 : 3,
    };
  };

  const addQuickFood = (name: string) => {
    saveFood(createQuickFood(name));
  };

  const addFoodsFromManualScan = (rawText: string) => {
    const foods = rawText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const date = line.match(/\d{4}-\d{2}-\d{2}/)?.[0];
        const quantity = Number(line.match(/(?:^|\s)(\d+(?:[,.]\d+)?)(?:\s|$)/)?.[1]?.replace(',', '.') ?? 1);
        const lowerLine = line.toLowerCase();
        const location = data.storageLocations.find((item) => lowerLine.includes(item.name.toLowerCase())) ?? data.storageLocations.find((item) => item.id === 'frigo') ?? data.storageLocations[0];
        const cleanedName = line
          .replace(/\d{4}-\d{2}-\d{2}/g, '')
          .replace(/(?:^|\s)\d+(?:[,.]\d+)?(?:\s|$)/, ' ')
          .replace(new RegExp(data.storageLocations.map((item) => item.name).join('|'), 'gi'), '')
          .trim();
        const food = createQuickFood(cleanedName || line);

        return {
          ...food,
          quantity,
          storageLocationId: location?.id ?? food.storageLocationId,
          expirationDate: date ?? food.expirationDate,
          notes: 'Ajout via scan manuel simplifié.',
        };
      });

    updateData((current) => ({ ...current, foods: [...foods, ...current.foods] }));
  };

  const freezeFood = (foodId: string) => {
    updateData((current) => {
      const freezer = current.storageLocations.find((location) => location.id === 'congelateur') ?? current.storageLocations.find((location) => /cong/i.test(location.name));
      if (!freezer) return current;

      return {
        ...current,
        storageLocations: current.storageLocations.map((location) => (location.id === freezer.id ? { ...location, visible: true } : location)),
        foods: current.foods.map((food) =>
          food.id === foodId
            ? {
                ...food,
                storageLocationId: freezer.id,
                dateType: 'congélation',
                expirationDate: isoInDays(90),
                status: 'fermé',
                notes: food.notes ? `${food.notes} Congelé aujourd’hui.` : 'Congelé aujourd’hui.',
              }
            : food,
        ),
      };
    });
  };

  const moveFood = (foodId: string, locationId: string) => {
    updateData((current) => ({
      ...current,
      foods: current.foods.map((food) => (food.id === foodId ? { ...food, storageLocationId: locationId } : food)),
    }));
  };

  const addLocation = (name: string, icon: StorageIcon = 'box') => {
    updateData((current) => ({
      ...current,
      storageLocations: [
        ...current.storageLocations,
        {
          id: newId('storage'),
          name,
          visible: true,
          sortOrder: Math.max(0, ...current.storageLocations.map((location) => location.sortOrder)) + 1,
          isDefault: false,
          icon,
        },
      ],
    }));
  };

  const setLocationVisible = (id: string, visible: boolean) => {
    updateData((current) => ({
      ...current,
      storageLocations: current.storageLocations.map((location) => (location.id === id ? { ...location, visible } : location)),
    }));
  };

  const renameLocation = (id: string, name: string) => {
    updateData((current) => ({
      ...current,
      storageLocations: current.storageLocations.map((location) => (location.id === id ? { ...location, name } : location)),
    }));
  };

  const moveLocation = (id: string, direction: 'up' | 'down') => {
    updateData((current) => {
      const sorted = [...current.storageLocations].sort((a, b) => a.sortOrder - b.sortOrder);
      const index = sorted.findIndex((location) => location.id === id);
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (index < 0 || targetIndex < 0 || targetIndex >= sorted.length) return current;

      const currentLocation = sorted[index];
      const targetLocation = sorted[targetIndex];

      return {
        ...current,
        storageLocations: current.storageLocations.map((location) => {
          if (location.id === currentLocation.id) return { ...location, sortOrder: targetLocation.sortOrder };
          if (location.id === targetLocation.id) return { ...location, sortOrder: currentLocation.sortOrder };
          return location;
        }),
      };
    });
  };

  const generateSuggestions = () => {
    updateData((current) => ({
      ...current,
      mealSuggestions: generateMealSuggestions(current.foods, current.profile, current.shoppingItems),
    }));
  };

  const addMissingToShopping = (suggestion: MealSuggestion) => {
    updateData((current) => {
      const inventoryNames = new Set(current.foods.map((food) => food.name.toLowerCase()));
      const shoppingNames = new Set(current.shoppingItems.map((item) => item.name.toLowerCase()));

      const newItems: ShoppingItem[] = suggestion.missingIngredients
        .filter((name) => !inventoryNames.has(name.toLowerCase()) && !shoppingNames.has(name.toLowerCase()))
        .map((name) => {
          const category = categoryFromIngredient(name);
          return {
            id: newId('shop'),
            name,
            category,
            quantity: 1,
            unit: unitFromCategory(category),
            priority: 'moyenne',
            suggestedStore: current.profile.favoriteStores[0] ?? '',
            organicRecommended: current.profile.preferences.organic,
            reason: `Manquant pour ${suggestion.title}.`,
            purchased: false,
            createdAt: new Date().toISOString(),
          };
        });

      return { ...current, shoppingItems: [...current.shoppingItems, ...newItems] };
    });
    setActiveView('shopping');
  };

  const cookMeal = (suggestion: MealSuggestion) => {
    updateData((current) => ({
      ...current,
      foods: current.foods.filter((food) => !suggestion.foodItemIds.includes(food.id)),
      mealSuggestions: current.mealSuggestions.filter((item) => item.id !== suggestion.id),
      consumptionHistory: [
        ...current.foods
          .filter((food) => suggestion.foodItemIds.includes(food.id))
          .map((food) => ({
            id: newId('history'),
            foodName: food.name,
            category: food.category,
            quantity: food.quantity,
            unit: food.unit,
            action: 'cuisiné' as const,
            owner: food.owner,
            happenedAt: new Date().toISOString(),
            reason: suggestion.title,
          })),
        ...current.consumptionHistory,
      ].slice(0, 80),
      mealPlan: [
        {
          id: newId('meal'),
          mealType: 'dîner',
          title: suggestion.title,
          plannedFor: new Date().toISOString().slice(0, 10),
          foodItemIds: suggestion.foodItemIds,
          notes: suggestion.reason,
          cookedAt: new Date().toISOString(),
        },
        ...current.mealPlan,
      ],
    }));
    setActiveView('home');
  };

  const dislikeMeal = (suggestionId: string) => {
    updateData((current) => ({
      ...current,
      mealSuggestions: current.mealSuggestions.filter((suggestion) => suggestion.id !== suggestionId),
    }));
  };

  const toggleShoppingPurchased = (id: string) => {
    updateData((current) => ({
      ...current,
      shoppingItems: current.shoppingItems.map((item) => (item.id === id ? { ...item, purchased: !item.purchased } : item)),
    }));
  };

  const addManualShoppingItem = (name: string, category: FoodCategory) => {
    updateData((current) => {
      const inventoryNames = new Set(current.foods.map((food) => food.name.toLowerCase()));
      const shoppingNames = new Set(current.shoppingItems.map((item) => item.name.toLowerCase()));
      if (inventoryNames.has(name.toLowerCase()) || shoppingNames.has(name.toLowerCase())) return current;

      return {
        ...current,
        shoppingItems: [
          ...current.shoppingItems,
          {
            id: newId('shop'),
            name,
            category,
            quantity: 1,
            unit: unitFromCategory(category),
            priority: 'douce',
            suggestedStore: current.profile.favoriteStores[0] ?? '',
            organicRecommended: current.profile.preferences.organic,
            reason: 'Ajout manuel.',
            purchased: false,
            createdAt: new Date().toISOString(),
          },
        ],
      };
    });
  };

  const addPurchasedToInventory = () => {
    updateData((current) => {
      const fridge = current.storageLocations.find((location) => location.id === 'frigo') ?? current.storageLocations[0];
      const cupboard = current.storageLocations.find((location) => location.id === 'placards') ?? fridge;
      const purchased = current.shoppingItems.filter((item) => item.purchased);
      const existingNames = new Set(current.foods.map((food) => food.name.toLowerCase()));
      const newFoods: FoodItem[] = purchased
        .filter((item) => !existingNames.has(item.name.toLowerCase()))
        .map((item) => {
          const location = item.category === 'Épicerie sèche' ? cupboard : fridge;
          return {
            id: newId('food'),
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit,
            storageLocationId: location.id,
            expirationDate: isoInDays(item.category === 'Épicerie sèche' ? 120 : 7),
            dateType: item.category === 'Épicerie sèche' ? 'DDM' : 'DLC',
            addedAt: new Date().toISOString(),
            isOrganic: item.organicRecommended,
            isLocal: current.profile.preferences.local,
            store: item.suggestedStore,
            status: 'fermé',
            owner: current.profile.defaultOwner,
            purchasePrice: item.price,
            notes: item.reason,
          };
        });

      return {
        ...current,
        foods: [...newFoods, ...current.foods],
        shoppingItems: current.shoppingItems.filter((item) => !item.purchased),
      };
    });
    setActiveView('inventory');
  };

  const updateProfile = (profile: UserProfile) => {
    updateData((current) => ({ ...current, profile }));
  };

  const importData = async (file: File) => {
    const imported = await parseImportedAppData(file);
    setData(saveAppData(imported));
  };

  const resetDemoData = () => {
    setData(saveAppData(createDefaultData()));
  };

  return (
    <Layout activeView={activeView} onChangeView={setActiveView} shoppingCount={shoppingCount}>
      {activeView === 'home' ? (
        <HomePage
          profile={data.profile}
          foods={data.foods}
          mealSuggestions={data.mealSuggestions}
          shoppingCount={shoppingCount}
          consumptionHistory={data.consumptionHistory}
          onGoInventory={() => setActiveView('inventory')}
          onGoMeals={() => setActiveView('meals')}
          onGoShopping={() => setActiveView('shopping')}
        />
      ) : null}

      {activeView === 'inventory' ? (
        <InventoryPage
          profile={data.profile}
          foods={data.foods}
          locations={data.storageLocations}
          onSaveFood={saveFood}
          onConsume={(foodId) => recordFoodAction(foodId, 'consommé')}
          onFreeze={freezeFood}
          onDiscard={(foodId) => recordFoodAction(foodId, 'jeté')}
          onMoveFood={moveFood}
          onDuplicateFood={duplicateFood}
          onToggleFavorite={toggleFavorite}
          onAdjustQuantity={adjustQuantity}
          onQuickAddFood={addQuickFood}
          onManualScan={addFoodsFromManualScan}
          onAddLocation={addLocation}
          onReactivateLocation={(locationId) => setLocationVisible(locationId, true)}
          consumptionHistory={data.consumptionHistory}
        />
      ) : null}

      {activeView === 'meals' ? (
        <MealsPage
          suggestions={data.mealSuggestions}
          onGenerate={generateSuggestions}
          onCook={cookMeal}
          onAddMissing={addMissingToShopping}
          onDislike={dislikeMeal}
        />
      ) : null}

      {activeView === 'shopping' ? (
        <ShoppingPage
          profile={data.profile}
          foods={data.foods}
          items={data.shoppingItems}
          onTogglePurchased={toggleShoppingPurchased}
          onAddManualItem={addManualShoppingItem}
          onAddPurchasedToInventory={addPurchasedToInventory}
        />
      ) : null}

      {activeView === 'profile' ? (
        <>
          <ProfilePage
            profile={data.profile}
            locations={data.storageLocations}
            onUpdateProfile={updateProfile}
            onRenameLocation={renameLocation}
            onToggleLocationVisible={setLocationVisible}
            onMoveLocation={moveLocation}
            onExport={() => exportAppData(data)}
            onImport={importData}
          />
          <button type="button" className="secondary-button w-full" onClick={resetDemoData}>
            Réinitialiser les données d’exemple
          </button>
        </>
      ) : null}
    </Layout>
  );
}

export default App;
