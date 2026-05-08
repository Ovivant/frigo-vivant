import { RefreshCcw, Wand2 } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';
import { MealSuggestionCard } from '../components/MealSuggestionCard';
import type { MealSuggestion } from '../types';

interface MealsPageProps {
  suggestions: MealSuggestion[];
  onGenerate: () => void;
  onCook: (suggestion: MealSuggestion) => void;
  onAddMissing: (suggestion: MealSuggestion) => void;
  onDislike: (suggestionId: string) => void;
}

export function MealsPage({ suggestions, onGenerate, onCook, onAddMissing, onDislike }: MealsPageProps) {
  return (
    <>
      <section className="app-panel p-4">
        <div>
          <p className="text-sm font-bold text-leaf-700">Repas</p>
          <h2 className="text-2xl font-black text-stone-950">Que puis-je cuisiner ?</h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Les idées priorisent les dates proches, évitent avoine, bœuf et jambon, et restent douces sur gluten et lactose.
          </p>
        </div>
        <button type="button" className="primary-button mt-4 w-full" onClick={onGenerate}>
          {suggestions.length ? <RefreshCcw aria-hidden className="h-5 w-5" /> : <Wand2 aria-hidden className="h-5 w-5" />}
          {suggestions.length ? 'Regénérer 3 suggestions' : 'Que puis-je cuisiner ?'}
        </button>
      </section>

      {suggestions.length ? (
        <section className="grid gap-4">
          {suggestions.map((suggestion) => (
            <MealSuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onCook={onCook}
              onAddMissing={onAddMissing}
              onDislike={onDislike}
            />
          ))}
        </section>
      ) : (
        <EmptyState title="Aucune suggestion pour l’instant">
          Lance la génération pour obtenir un repas express, un repas équilibré et un repas anti-gaspi.
        </EmptyState>
      )}
    </>
  );
}
