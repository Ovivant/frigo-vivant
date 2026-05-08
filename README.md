# Frigo Vivant

Application web mobile-first pour gérer un inventaire alimentaire local, les repas, les courses et les préférences de Goulven, sans compte utilisateur.

## V1

- React + TypeScript + Vite
- Tailwind CSS
- Données locales dans `localStorage`
- Export / import JSON
- Navigation : Accueil, Inventaire, Repas, Courses, Profil
- Suggestions de repas qualitatives, sans score santé
- Blocage de l’avoine, du bœuf et du jambon dans les suggestions
- Espaces de stockage personnalisables, y compris congélateur masquable et réactivable

## Lancer

```bash
npm install
npm run dev
```

Puis ouvrir l’URL affichée par Vite.

## Architecture

```text
src/
  components/  composants UI réutilisables
  data/        données d’exemple
  lib/         logique métier, stockage local et points d’extension futurs
  pages/       écrans principaux
  styles/      Tailwind et styles globaux
```

Les types métier sont dans `src/types.ts`, dont `StorePriceRecord` pour préparer le suivi de prix, la comparaison par magasin et le prix au kilo ou au litre.
Les signatures de futures capacités sont regroupées dans `src/lib/futureCapabilities.ts`.

## Futures évolutions prévues

- Historique d’achats et prix par produit
- Comparaison entre Les Rayols, Biocoop et magasins en ligne
- Recherche de produits chez La Fourche ou équivalent
- Suggestions économiques
- Synchronisation iCloud
- IA locale sur iPhone
