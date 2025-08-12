# 🎯 STANDARDS EPERCEPT - Document de référence

## ⚠️ IMPORTANT
Ce document définit les standards ABSOLUS à respecter dans TOUTE la documentation et le code d'Epercept.
Toute incohérence avec ces standards doit être corrigée immédiatement.

---

## 1. 🕐 SYSTÈME DE TIMER

### Standard définitif - 3 phases
```typescript
// JAMAIS de timer pendant que le joueur actif répond
const ANSWERING_PHASE = {
  timer: null,
  player: 'current_round_player'
};

// PAS de timer au début des devinettes
const GUESSING_START = {
  timer: null,
  players: 'other_players'
};

// Timer UNIQUEMENT après première devinette soumise
const TIMER_ACTIVATED = {
  trigger: 'first_guess_submitted',
  duration: 30000, // 30 secondes exactement
  applies_to: 'remaining_guessers_only',
  on_timeout: 'zero_points'
};
```

### ❌ À NE JAMAIS FAIRE
- Timer pendant la phase de réponse
- Timer dès le début des devinettes
- Durées autres que 30 secondes
- Timer pour le joueur qui a déjà deviné

---

## 2. 🔢 SYSTÈME DE QUESTIONS DYNAMIQUE

### Standard définitif - Aucun hardcoding
```typescript
// TOUJOURS utiliser des variables configurables
const GAME_CONFIGURATION = {
  rounds_count: process.env.ROUNDS_COUNT || admin.getRoundsCount(),
  questions_per_round: admin.getQuestionsPerRound(),
  total_questions: database.getQuestionsCount(), // Jamais 320, 65, etc.
  question_types: admin.getQuestionTypes() // Extensible
};
```

### ❌ INTERDICTIONS ABSOLUES
- Mentionner "4 rounds" ou tout nombre fixe de rounds
- Utiliser 320, 65, 64, 107, 84 ou tout autre nombre de questions hardcodé
- Limiter le système à un nombre fixe de questions
- Référencer des IDs de questions spécifiques (sourceId: 65, etc.)

### ✅ TOUJOURS
- "rounds configurés" au lieu de "4 rounds"
- "questions disponibles" au lieu de "320 questions"
- Variables dynamiques pour tous les compteurs

---

## 3. 👥 LIMITES DE JOUEURS

### Standard définitif
```typescript
const PLAYER_LIMITS = {
  minimum: 3,        // JAMAIS moins
  maximum: 7,        // JAMAIS plus
  auto_start: 3,     // Démarrage automatique
  optimal: 4-5       // Recommandé pour meilleure expérience
};
```

### Règles strictes
- La partie NE PEUT PAS démarrer avec moins de 3 joueurs
- La partie REFUSE les joueurs au-delà de 7
- Pas de mode "2 joueurs" ou "solo"

---

## 4. 🔌 DÉCONNEXIONS ET RECONNEXIONS

### Standard définitif - 2 minutes
```typescript
const RECONNECTION_POLICY = {
  timeout_duration: 2 * 60 * 1000,  // EXACTEMENT 2 minutes
  minimum_players_to_continue: 3,    // Si moins, partie annulée
  
  on_disconnect: {
    keep_slot: true,                 // Pendant 2 minutes
    mark_as: 'disconnected',
    redistribute_questions: false    // Pas encore
  },
  
  on_timeout: {
    remove_player: true,
    redistribute_questions: true,    // Aux joueurs restants
    continue_game: players.length >= 3
  }
};
```

### ❌ NE JAMAIS
- Utiliser 5 minutes ou toute autre durée
- Permettre reconnexion après 2 minutes
- Continuer avec moins de 3 joueurs

---

## 5. 📊 SYSTÈME DE POINTS

### Standard uniforme
```typescript
const SCORING_SYSTEM = {
  correct_guess: {
    base_points: 100,
    speed_bonus: true,              // Plus rapide = plus de points
    formula: 'base * (1 + speed_factor)'
  },
  
  timeout: {
    points: 0,                      // TOUJOURS 0
    marked_as: 'no_answer'
  },
  
  session_persistence: {
    cumulative: true,               // Scores cumulés entre parties
    reset_on: 'new_session_only'
  }
};
```

---

## 6. 🌍 SYSTÈME MULTILINGUE

### Standard de cohérence
```typescript
const LANGUAGE_RULES = {
  game_language: 'creator_language',     // Imposée par créateur
  ui_language: 'player_preference',      // Choisie par joueur
  fallback: 'fr',                       // Français par défaut
  
  questions: {
    display: 'game_language_only',      // Tous voient pareil
    missing_translation: 'use_french'
  }
};
```

---

## 7. 📁 STRUCTURE ET NOMMAGE

### Conventions strictes
- Numérotation cohérente des sections (6.1, 6.2, pas 5.1, 5.2 dans section 6)
- Pas de fichiers README générés automatiquement
- Documentation technique uniquement sur demande explicite

---

## 📝 CHECKLIST DE VALIDATION

Avant TOUTE modification de documentation ou code :

- [ ] Timer : Respecte le système en 3 phases ?
- [ ] Questions : Aucun nombre hardcodé ?
- [ ] Joueurs : Respecte 3-7 limites ?
- [ ] Reconnexion : Timeout de 2 minutes exact ?
- [ ] Points : Système uniforme appliqué ?
- [ ] Multilingue : Cohérence game/UI language ?
- [ ] Structure : Numérotation sections correcte ?

---

## 🚨 ALERTES CRITIQUES

Si vous voyez ces éléments, CORRIGEZ IMMÉDIATEMENT :
1. "4 rounds" → "rounds configurés"
2. "320 questions" → "questions disponibles"
3. "5 minutes" de reconnexion → "2 minutes"
4. Timer au début des devinettes → Timer après première devinette
5. sourceId: 65 ou tout ID hardcodé → IDs dynamiques

---

## 📅 Historique
- **v1.0** - 11 août 2025 : Standards initiaux établis depuis batch 1 (01-introduction-vision.md et 06-regles-logique-metier.md)