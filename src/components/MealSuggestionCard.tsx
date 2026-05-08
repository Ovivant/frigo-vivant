import { HeartCrack, ListPlus, Soup } from 'lucide-react';
import type { MealSuggestion } from '../types';
import { StatusPill } from './StatusPill';

interface MealSuggestionCardProps {
  suggestion: MealSuggestion;
  onCook: (suggestion: MealSuggestion) => void;
  onAddMissing: (suggestion: MealSuggestion) => void;
  onDislike: (suggestionId: string) => void;
}

export function MealSuggestionCard({ suggestion, onCook, onAddMissing, onDislike }: MealSuggestionCardProps) {
  return (
    <article className="app-panel overflow-hidden">
      <div className="border-b border-leaf-100 bg-white px-4 py-4">
        <p className="text-sm font-black uppercase tracking-[0.1em] text-clay-500">{suggestion.type}</p>
        <h3 className="mt-1 text-xl font-black text-stone-950">{suggestion.title}</h3>
        <p className="mt-1 text-sm font-semibold text-stone-600">{suggestion.prepTimeMinutes} min de préparation</p>
      </div>
      <div className="space-y-4 px-4 py-4">
        <StatusPill cue={suggestion.healthCue} tone={suggestion.healthCue.startsWith('Attention') ? 'warning' : 'health'} />

        <div>
          <h4 className="text-sm font-black text-stone-800">Aliments utilisés</h4>
          <p className="mt-1 text-sm leading-6 text-stone-600">
            {suggestion.foodsUsed.length ? suggestion.foodsUsed.join(', ') : 'Aucun aliment précis, suggestion de base.'}
          </p>
        </div>

        <div>
          <h4 className="text-sm font-black text-stone-800">Ingrédients manquants</h4>
          <p className="mt-1 text-sm leading-6 text-stone-600">
            {suggestion.missingIngredients.length ? suggestion.missingIngredients.join(', ') : 'Rien à ajouter.'}
          </p>
        </div>

        <p className="rounded-[8px] bg-oat-100 px-3 py-2 text-sm leading-6 text-stone-700">{suggestion.reason}</p>

        <div className="grid gap-2">
          <button type="button" className="primary-button" onClick={() => onCook(suggestion)}>
            <Soup aria-hidden className="h-5 w-5" />
            Je cuisine ce repas
          </button>
          <button type="button" className="secondary-button" onClick={() => onAddMissing(suggestion)} disabled={!suggestion.missingIngredients.length}>
            <ListPlus aria-hidden className="h-5 w-5" />
            Ajouter les ingrédients manquants
          </button>
          <button type="button" className="secondary-button" onClick={() => onDislike(suggestion.id)}>
            <HeartCrack aria-hidden className="h-5 w-5" />
            Je n’aime pas
          </button>
        </div>
      </div>
    </article>
  );
}
