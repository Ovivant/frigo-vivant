import type { FoodItem, HealthCue, UserProfile } from '../types';
import { getUrgencyLevel } from './date';

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

const includesTerm = (value: string, term: string) => normalize(value).includes(normalize(term));

export const isBlockedFoodName = (name: string, profile: UserProfile) =>
  profile.forbiddenFoods.some((food) => includesTerm(name, food));

export const foodHealthCue = (food: FoodItem, profile: UserProfile): HealthCue => {
  if (includesTerm(food.name, 'avoine')) return 'Non adapté : contient de l’avoine';
  if (includesTerm(food.name, 'bœuf') || includesTerm(food.name, 'boeuf')) {
    return 'Non adapté : contient du bœuf';
  }
  if (includesTerm(food.name, 'jambon')) return 'Non adapté : contient du jambon';
  if (includesTerm(food.name, 'gluten') || includesTerm(food.name, 'pain') || includesTerm(food.name, 'pâtes')) {
    return 'Attention : contient beaucoup de gluten';
  }
  if (includesTerm(food.name, 'lait') || includesTerm(food.name, 'yaourt') || includesTerm(food.name, 'fromage')) {
    return 'Attention : contient beaucoup de lactose';
  }
  if (getUrgencyLevel(food.expirationDate) !== 'green') return 'Utilise un aliment à consommer vite';
  if (food.category === 'Fruits & légumes') return 'Bonne base végétale';
  if (food.category !== 'Protéines') return 'Pense à ajouter une protéine';
  return 'Repas simple et équilibré';
};

export const mealHealthCue = (foods: FoodItem[], missingIngredients: string[], profile: UserProfile): HealthCue => {
  const names = [...foods.map((food) => food.name), ...missingIngredients].join(' ');

  if (isBlockedFoodName(names, profile)) {
    const blocked = profile.forbiddenFoods.find((food) => includesTerm(names, food)) ?? '';
    if (includesTerm(blocked, 'avoine')) return 'Non adapté : contient de l’avoine';
    if (includesTerm(blocked, 'bœuf') || includesTerm(blocked, 'boeuf')) return 'Non adapté : contient du bœuf';
    if (includesTerm(blocked, 'jambon')) return 'Non adapté : contient du jambon';
  }

  if (includesTerm(names, 'gluten') || includesTerm(names, 'pain') || includesTerm(names, 'pâtes')) {
    return 'Attention : contient beaucoup de gluten';
  }

  if (includesTerm(names, 'lait') || includesTerm(names, 'yaourt') || includesTerm(names, 'fromage') || includesTerm(names, 'crème')) {
    return 'Attention : contient beaucoup de lactose';
  }

  if (foods.some((food) => getUrgencyLevel(food.expirationDate) !== 'green')) {
    return 'Utilise un aliment à consommer vite';
  }

  if (!foods.some((food) => food.category === 'Protéines') && !missingIngredients.some((item) => includesTerm(item, 'pois chiches'))) {
    return 'Pense à ajouter une protéine';
  }

  if (foods.some((food) => food.category === 'Fruits & légumes')) return 'Bonne base végétale';

  return 'Repas simple et équilibré';
};
