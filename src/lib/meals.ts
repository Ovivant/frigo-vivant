import type { FoodCategory, FoodItem, MealSuggestion, ShoppingItem, UserProfile } from '../types';
import { sortByExpiration } from './date';
import { isBlockedFoodName, mealHealthCue } from './health';

const findFood = (foods: FoodItem[], category: FoodCategory, fallback?: (food: FoodItem) => boolean) =>
  foods.find((food) => food.category === category && (fallback ? fallback(food) : true));

const uniqueFoods = (foods: Array<FoodItem | undefined>) => {
  const byId = new Map<string, FoodItem>();
  foods.forEach((food) => {
    if (food) byId.set(food.id, food);
  });
  return Array.from(byId.values());
};

const buildSuggestion = (
  id: string,
  type: MealSuggestion['type'],
  title: string,
  prepTimeMinutes: number,
  foods: FoodItem[],
  missingIngredients: string[],
  reason: string,
  profile: UserProfile,
): MealSuggestion => ({
  id,
  type,
  title,
  prepTimeMinutes,
  foodItemIds: foods.map((food) => food.id),
  foodsUsed: foods.map((food) => food.name),
  missingIngredients,
  healthCue: mealHealthCue(foods, missingIngredients, profile),
  reason,
});

export const generateMealSuggestions = (
  allFoods: FoodItem[],
  profile: UserProfile,
  existingShoppingItems: ShoppingItem[],
): MealSuggestion[] => {
  const edibleFoods = sortByExpiration(allFoods).filter((food) => !isBlockedFoodName(food.name, profile));
  const urgentFoods = edibleFoods.slice(0, 4);
  const urgentVegetable = findFood(urgentFoods, 'Fruits & légumes') ?? findFood(edibleFoods, 'Fruits & légumes');
  const protein = findFood(edibleFoods, 'Protéines');
  const pantry = findFood(edibleFoods, 'Épicerie sèche', (food) => !isBlockedFoodName(food.name, profile));
  const fresh = findFood(edibleFoods, 'Frais', (food) => !/fromage|yaourt|lait/i.test(food.name));
  const frozen = findFood(edibleFoods, 'Surgelé');
  const shoppingNames = existingShoppingItems.map((item) => item.name.toLowerCase());

  const missingIfAbsent = (candidate: string, present: boolean) =>
    present || shoppingNames.includes(candidate.toLowerCase()) ? [] : [candidate];

  const expressFoods = uniqueFoods([urgentVegetable, protein, pantry, frozen]).slice(0, 3);
  const balancedFoods = uniqueFoods([urgentVegetable, protein, pantry]).slice(0, 3);
  const antiWasteFoods = uniqueFoods([...urgentFoods.slice(0, 3), fresh]).slice(0, 4);

  const suggestions = [
    buildSuggestion(
      'suggestion-express',
      'Repas express',
      expressFoods.length ? `Bol minute ${expressFoods[0].name.toLowerCase()}` : 'Bol minute légumes et pois chiches',
      15,
      expressFoods,
      [
        ...missingIfAbsent('pois chiches', Boolean(protein)),
        ...missingIfAbsent('citron', Boolean(pantry)),
      ],
      'Rapide, peu transformé, et basé sur ce qui demande le moins de préparation.',
      profile,
    ),
    buildSuggestion(
      'suggestion-equilibree',
      'Repas équilibré',
      balancedFoods.length ? `Assiette complète ${balancedFoods[0].name.toLowerCase()}` : 'Assiette complète légumes, riz et tofu',
      25,
      balancedFoods,
      [
        ...missingIfAbsent('herbes fraîches', false),
        ...missingIfAbsent('huile d’olive', Boolean(pantry)),
      ],
      'Combine légumes, protéine et base rassasiante, sans notation ni pression.',
      profile,
    ),
    buildSuggestion(
      'suggestion-antigaspi',
      'Repas anti-gaspi',
      antiWasteFoods.length ? `Poêlée anti-gaspi ${antiWasteFoods[0].name.toLowerCase()}` : 'Poêlée anti-gaspi de fin de frigo',
      20,
      antiWasteFoods,
      missingIfAbsent('graines de courge', false),
      'Priorise les aliments proches de leur date limite et les restes déjà ouverts.',
      profile,
    ),
  ];

  return suggestions.filter((suggestion) => !isBlockedFoodName([...suggestion.foodsUsed, ...suggestion.missingIngredients].join(' '), profile));
};
