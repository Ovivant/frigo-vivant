import { ArrowRight, ShoppingBasket, Sparkles } from 'lucide-react';
import type { FoodItem, MealSuggestion, UserProfile } from '../types';
import { sortByExpiration } from '../lib/date';
import { foodHealthCue } from '../lib/health';
import { StatusPill } from '../components/StatusPill';

interface HomePageProps {
  profile: UserProfile;
  foods: FoodItem[];
  mealSuggestions: MealSuggestion[];
  shoppingCount: number;
  onGoInventory: () => void;
  onGoMeals: () => void;
  onGoShopping: () => void;
}

export function HomePage({ profile, foods, mealSuggestions, shoppingCount, onGoInventory, onGoMeals, onGoShopping }: HomePageProps) {
  const priorityFoods = sortByExpiration(foods).slice(0, 4);
  const ideaLabel = (type: MealSuggestion['type']) => {
    if (type === 'Repas express') return 'Rapide';
    if (type === 'Repas équilibré') return 'Équilibrée';
    return 'Anti-gaspi';
  };
  const fallbackIdeas = [
    { label: 'Rapide', title: 'Bol riz, légumes et tofu' },
    { label: 'Équilibrée', title: 'Assiette lentilles, œufs et légumes' },
    { label: 'Anti-gaspi', title: 'Poêlée de fin de frigo' },
  ];
  const ideas = mealSuggestions.length
    ? mealSuggestions.slice(0, 3).map((suggestion) => ({ label: ideaLabel(suggestion.type), title: suggestion.title }))
    : fallbackIdeas;

  return (
    <>
      <section className="app-panel overflow-hidden">
        <div className="bg-leaf-600 px-4 py-5 text-white">
          <p className="text-sm font-bold opacity-90">Bonjour {profile.name}</p>
          <h2 className="mt-1 text-2xl font-black leading-tight">On part de ce que tu as déjà.</h2>
          <p className="mt-2 text-sm leading-6 text-leaf-50">
            Une cuisine simple, locale quand c’est possible, et un frigo qui aide sans juger.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 p-4">
          <button type="button" className="secondary-button" onClick={onGoInventory}>
            Inventaire
            <ArrowRight aria-hidden className="h-4 w-4" />
          </button>
          <button type="button" className="secondary-button" onClick={onGoMeals}>
            Repas
            <ArrowRight aria-hidden className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section className="app-panel p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-stone-950">À consommer en priorité</h2>
            <p className="mt-1 text-sm text-stone-600">Les dates proches remontent en premier.</p>
          </div>
          <Sparkles aria-hidden className="h-5 w-5 text-clay-300" />
        </div>
        <div className="mt-3 space-y-3">
          {priorityFoods.map((food) => (
            <div key={food.id} className="rounded-[8px] border border-leaf-100 bg-white px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-black text-stone-900">{food.name}</p>
                  <p className="text-sm text-stone-500">
                    {food.quantity} {food.unit} · {food.expirationDate}
                  </p>
                </div>
                <StatusPill cue={foodHealthCue(food, profile)} tone={foodHealthCue(food, profile).startsWith('Attention') ? 'warning' : 'health'} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="app-panel p-4">
        <h2 className="text-lg font-black text-stone-950">3 idées de repas</h2>
        <div className="mt-3 grid gap-3">
          {ideas.map((idea) => (
            <button key={`${idea.label}-${idea.title}`} type="button" className="rounded-[8px] border border-leaf-100 bg-white p-3 text-left" onClick={onGoMeals}>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-clay-500">{idea.label}</p>
              <p className="mt-1 font-black text-stone-900">{idea.title}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="app-panel flex items-center justify-between gap-3 p-4">
        <div>
          <h2 className="text-lg font-black text-stone-950">Courses</h2>
          <p className="text-sm text-stone-600">{shoppingCount} article{shoppingCount > 1 ? 's' : ''} à prévoir</p>
        </div>
        <button type="button" className="primary-button !px-3" onClick={onGoShopping} aria-label="Voir les courses">
          <ShoppingBasket aria-hidden className="h-5 w-5" />
        </button>
      </section>
    </>
  );
}
