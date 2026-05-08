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
import type { AppData, AppView, FoodCategory, FoodItem, MealSuggestion, ShoppingItem, StorageIcon, UserProfile } from './types';

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
    setData((current) => ({ ...recipe(current), updatedAt: new Date().toISOString() }));
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

  const removeFood = (foodId: string) => {
    updateData((current) => ({ ...current, foods: current.foods.filter((food) => food.id !== foodId) }));
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
    setData(imported);
  };

  const resetDemoData = () => {
    setData(createDefaultData());
  };

  return (
    <Layout activeView={activeView} onChangeView={setActiveView} shoppingCount={shoppingCount}>
      {activeView === 'home' ? (
        <HomePage
          profile={data.profile}
          foods={data.foods}
          mealSuggestions={data.mealSuggestions}
          shoppingCount={shoppingCount}
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
          onConsume={removeFood}
          onFreeze={freezeFood}
          onDiscard={removeFood}
          onMoveFood={moveFood}
          onAddLocation={addLocation}
          onReactivateLocation={(locationId) => setLocationVisible(locationId, true)}
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
