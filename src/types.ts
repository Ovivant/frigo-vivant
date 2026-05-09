export type AppView = 'home' | 'inventory' | 'meals' | 'shopping' | 'profile';

export type FoodCategory =
  | 'Fruits & légumes'
  | 'Frais'
  | 'Épicerie sèche'
  | 'Protéines'
  | 'Surgelé'
  | 'Autre';

export type FoodDateType = 'DLC' | 'DDM' | 'ouverture' | 'congélation';
export type FoodStatus = 'fermé' | 'ouvert' | 'entamé';
export type FoodOwner = 'moi' | 'colocataire' | 'commun' | 'non défini';
export type ShoppingPriority = 'haute' | 'moyenne' | 'douce';
export type StorageIcon = 'fridge' | 'shelves' | 'jar' | 'snowflake' | 'box';
export type InventorySort = 'intelligent' | 'date' | 'nom' | 'favoris' | 'ajout récent';
export type ConsumptionAction = 'consommé' | 'jeté' | 'cuisiné';
export type Weekday = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface OpeningTimeRange {
  open: string;
  close: string;
}

export interface GroceryStore {
  id: string;
  name: string;
  shortName: string;
  address?: string;
  phone?: string;
  email?: string;
  openingHours: Record<Weekday, OpeningTimeRange[]>;
  notes?: string;
}

export type HealthCue =
  | 'Repas simple et équilibré'
  | 'Bonne base végétale'
  | 'Pense à ajouter une protéine'
  | 'Utilise un aliment à consommer vite'
  | 'Attention : contient beaucoup de gluten'
  | 'Attention : contient beaucoup de lactose'
  | 'Non adapté : contient de l’avoine'
  | 'Non adapté : contient du bœuf'
  | 'Non adapté : contient du jambon';

export interface UserProfile {
  id: string;
  name: string;
  cooksPerWeek: number;
  cookingStyle: string;
  managedMeals: string[];
  dietNotes: string;
  forbiddenFoods: string[];
  limitedFoods: string[];
  goals: string[];
  preferences: {
    organic: boolean;
    local: boolean;
    shortSupplyChain: boolean;
    minimallyProcessed: boolean;
  };
  favoriteStores: string[];
  roommateStatus: 'à définir' | 'seul' | 'partagé';
  defaultOwner: FoodOwner;
}

export interface StorageLocation {
  id: string;
  name: string;
  visible: boolean;
  sortOrder: number;
  isDefault: boolean;
  icon: StorageIcon;
}

export interface FoodItem {
  id: string;
  name: string;
  category: FoodCategory;
  quantity: number;
  unit: string;
  storageLocationId: string;
  expirationDate: string;
  dateType: FoodDateType;
  addedAt: string;
  isOrganic: boolean;
  isLocal: boolean;
  store: string;
  status: FoodStatus;
  owner: FoodOwner;
  purchasePrice?: number;
  pricePerUnit?: number;
  pricePerUnitKind?: 'ticket' | 'calculé' | 'manuel';
  notes: string;
  isFavorite?: boolean;
  reminderDaysBefore?: number;
}

export interface ConsumptionHistoryItem {
  id: string;
  foodName: string;
  category: FoodCategory;
  quantity: number;
  unit: string;
  action: ConsumptionAction;
  owner: FoodOwner;
  happenedAt: string;
  reason?: string;
}

export interface MealSuggestion {
  id: string;
  title: string;
  type: 'Repas express' | 'Repas équilibré' | 'Repas anti-gaspi';
  prepTimeMinutes: number;
  foodItemIds: string[];
  foodsUsed: string[];
  missingIngredients: string[];
  healthCue: HealthCue;
  reason: string;
}

export interface ShoppingItem {
  id: string;
  name: string;
  category: FoodCategory;
  quantity: number;
  unit: string;
  priority: ShoppingPriority;
  suggestedStore: string;
  organicRecommended: boolean;
  reason: string;
  price?: number;
  purchased: boolean;
  createdAt: string;
}

export interface MealPlanItem {
  id: string;
  mealType: 'déjeuner' | 'dîner' | 'collation';
  title: string;
  plannedFor: string;
  foodItemIds: string[];
  notes: string;
  cookedAt?: string;
}

export interface StorePriceRecord {
  id: string;
  productName: string;
  store: string;
  price: number;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  purchaseDate: string;
  isOrganic: boolean;
  isLocal: boolean;
  source: 'manuel' | 'ticket' | 'import' | 'futur-connecteur';
}

export interface AppData {
  profile: UserProfile;
  foods: FoodItem[];
  storageLocations: StorageLocation[];
  mealSuggestions: MealSuggestion[];
  shoppingItems: ShoppingItem[];
  mealPlan: MealPlanItem[];
  consumptionHistory: ConsumptionHistoryItem[];
  stores: GroceryStore[];
  storePriceRecords: StorePriceRecord[];
  updatedAt: string;
}
