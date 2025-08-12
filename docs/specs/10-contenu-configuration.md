## 10. Contenu multilingue complet et système de traduction

### 10.1 Architecture des textes multilingues

#### Structure JSON hiérarchique des traductions d'interface

```json
{
  "metadata": {
    "version": "1.0.0",
    "defaultLocale": "fr",
    "supportedLocales": ["fr", "en", "es", "it", "pt", "de"],
    "lastUpdated": "2024-01-15T00:00:00Z"
  },
  
  "translations": {
    "fr": {
      "common": {
        "buttons": {
          "start": "Commencer",
          "join": "Rejoindre",
          "create": "Créer une partie",
          "continue": "Continuer",
          "quit": "Quitter",
          "next": "Suivant",
          "previous": "Précédent",
          "validate": "Valider",
          "cancel": "Annuler"
        },
        "loading": {
          "generic": "Chargement...",
          "joining": "Connexion en cours...",
          "starting": "Lancement de la partie...",
          "questions": "Préparation des questions..."
        },
        "errors": {
          "network": "Erreur de connexion",
          "invalid_pin": "Code de partie invalide",
          "game_full": "Partie complète",
          "username_taken": "Pseudo déjà pris",
          "disconnected": "Connexion perdue"
        }
      },
      
      "homepage": {
        "title": "Epercept - Découvrez-vous à travers le regard des autres",
        "introduction": "Avec Epercept, plongez dans une expérience où vos perceptions et celles des autres se confrontent.",
        "subtitle": "Jeu social multijoueurs en temps réel",
        "features": [
          "Questions personnalisées pour mieux vous connaître",
          "Devinettes interactives avec vos amis",
          "Révélations surprenantes sur vos relations",
          "Interface moderne et intuitive"
        ],
        "cta": {
          "create": "Créer une nouvelle partie",
          "join": "Rejoindre une partie existante"
        }
      },
      
      "game": {
        "lobby": {
          "title": "Salle d'attente",
          "waiting_for_players": "En attente de joueurs...",
          "players_count": "{count} joueur(s) connecté(s)",
          "min_players": "Minimum {min} joueurs requis",
          "game_code": "Code de la partie",
          "starting_soon": "La partie va bientôt commencer",
          "language_info": "Langue de la partie : {language}"
        },
        
        "rounds": {
          "personality": "Personnalité",
          "situations": "Situations", 
          "representations": "Représentations",
          "relations": "Relations"
        },
        
        "gameplay": {
          "your_turn": "À votre tour !",
          "waiting_for": "En attente de {player}...",
          "time_remaining": "Temps restant : {seconds}s",
          "submit_answer": "Valider votre réponse",
          "make_guess": "Devinez la réponse de {player}",
          "correct_answer": "Bonne réponse !",
          "wrong_answer": "Mauvaise réponse",
          "points_earned": "+{points} points"
        },
        
        "results": {
          "round_results": "Résultats du round",
          "final_results": "Résultats finaux",
          "winner": "Gagnant : {player}",
          "your_score": "Votre score : {score} points",
          "play_again": "Rejouer",
          "new_game": "Nouvelle partie"
        }
      },
      
      "questions": {
        "loading": "Chargement de la question...",
        "fallback_notice": "Question affichée en français (traduction non disponible)"
      },
      
      "settings": {
        "language": "Langue",
        "change_language": "Changer la langue",
        "language_note": "La langue des questions dépend du créateur de la partie"
      }
    },
    
    "en": {
      "common": {
        "buttons": {
          "start": "Start",
          "join": "Join",
          "create": "Create Game",
          "continue": "Continue",
          "quit": "Quit",
          "next": "Next",
          "previous": "Previous",
          "validate": "Submit",
          "cancel": "Cancel"
        },
        "loading": {
          "generic": "Loading...",
          "joining": "Joining game...",
          "starting": "Starting game...",
          "questions": "Loading questions..."
        },
        "errors": {
          "network": "Connection error",
          "invalid_pin": "Invalid game code",
          "game_full": "Game is full",
          "username_taken": "Username already taken",
          "disconnected": "Connection lost"
        }
      },
      
      "homepage": {
        "title": "Epercept - Discover yourself through others' eyes",
        "introduction": "With Epercept, dive into an experience where your perceptions and those of others collide.",
        "subtitle": "Real-time multiplayer social game",
        "features": [
          "Personalized questions to know yourself better",
          "Interactive guessing with your friends",
          "Surprising revelations about your relationships",
          "Modern and intuitive interface"
        ],
        "cta": {
          "create": "Create a new game",
          "join": "Join an existing game"
        }
      },
      
      "game": {
        "lobby": {
          "title": "Waiting Room",
          "waiting_for_players": "Waiting for players...",
          "players_count": "{count} player(s) connected",
          "min_players": "Minimum {min} players required",
          "game_code": "Game Code",
          "starting_soon": "Game starting soon",
          "language_info": "Game language: {language}"
        },
        
        "rounds": {
          "personality": "Personality",
          "situations": "Situations",
          "representations": "Representations", 
          "relations": "Relations"
        },
        
        "gameplay": {
          "your_turn": "Your turn!",
          "waiting_for": "Waiting for {player}...",
          "time_remaining": "Time remaining: {seconds}s",
          "submit_answer": "Submit your answer",
          "make_guess": "Guess {player}'s answer",
          "correct_answer": "Correct!",
          "wrong_answer": "Wrong answer",
          "points_earned": "+{points} points"
        },
        
        "results": {
          "round_results": "Round Results",
          "final_results": "Final Results",
          "winner": "Winner: {player}",
          "your_score": "Your score: {score} points",
          "play_again": "Play Again",
          "new_game": "New Game"
        }
      },
      
      "questions": {
        "loading": "Loading question...",
        "fallback_notice": "Question displayed in French (translation not available)"
      },
      
      "settings": {
        "language": "Language",
        "change_language": "Change Language",
        "language_note": "Question language depends on the game creator"
      }
    },
    
    "es": {
      "common": {
        "buttons": {
          "start": "Comenzar",
          "join": "Unirse",
          "create": "Crear Partida",
          "continue": "Continuar",
          "quit": "Salir",
          "next": "Siguiente",
          "previous": "Anterior",
          "validate": "Validar",
          "cancel": "Cancelar"
        }
        // ... resto de traducciones en español
      }
      // ... estructuras similaires pour español
    },
    
    "it": {
      // ... traducciones en italiano
    },
    
    "pt": {  
      // ... traducciones en portugués
    },
    
    "de": {
      // ... traducciones en alemán
    }
  }
}
```

### 10.2 Textes d'interface par composant

#### Page d'accueil - Introduction (NOUVELLE VERSION)
"Avec Epercept, plongez dans une expérience où vos perceptions et celles des autres se confrontent.

Jouez et découvrez comment vos amis vous voient et s'ils sont tels que vous les imaginez !

Si vous voulez gagner, il faudra cerner qui se cache derrière les masques que les autres joueurs portent… parfois même sans s'en apercevoir.

**Pourquoi vous allez adorer ?**
Au-delà du jeu, l'intérêt réside dans les discussions qui en découlent. Débriefez les réponses, essayez de comprendre les choix des uns et des autres, et découvrez des facettes inattendues de vos amis ou de votre famille.

À vous de jouer !"

#### Règles du jeu

**Le but du jeu :**
Accumulez des points en devinant les réponses des autres joueurs. Attention, pas de points en jeu pour votre propre réponse, alors soyez **honnête et spontané**.

**Comment ça marche ?**
1. À chaque tour, un joueur tire une question et y répond.
2. Les autres joueurs doivent deviner sa réponse.
3. Le questionné change à chaque tour.
4. La partie se joue selon la **configuration admin**, chacune avec un type de question différent pour varier les surprises !

**Accordez vous sur les termes et le contexte des questions avant d'y répondre**

**Pour 3 à 7 joueurs** (selon standards établis)

#### Texte d'accueil
"Bienvenue !

Commencez une partie ou rejoignez-en une en entrant le code PIN généré par le créateur"

### 10.3 Interface d'administration multilingue

#### Vue d'ensemble avec gestion des traductions

L'interface d'administration intègre une gestion complète du contenu multilingue avec workflow de traduction, validation et déploiement.

#### Dashboard principal étendu pour i18n
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Epercept Admin - Multilingual                                   [🌐FR][Logout]│
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ {{DYNAMIC}} │ │ 47          │ │ 1,234       │ │ 6 🌐        │           │
│  │ Questions   │ │ Parties/jour│ │ Joueurs     │ │ Langues     │           │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ Complétude des traductions                                              │ │
│  │ 🇫🇷 Français    ████████████████████████████████████████████████ 100%  │ │
│  │ 🇬🇧 English     ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0%  │ │
│  │ 🇪🇸 Español     ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0%  │ │
│  │ 🇮🇹 Italiano    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0%  │ │
│  │ 🇵🇹 Português   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0%  │ │
│  │ 🇩🇪 Deutsch     ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0%  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ Questions par round & Statut traduction                                 │ │
│  │ ████████ Personnalité ({{P_COUNT}}) - 🇫🇷✓ 🇬🇧⏳ 🇪🇸⏳ 🇮🇹⏳ 🇵🇹⏳ 🇩🇪⏳      │ │
│  │ ████████ Situations ({{S_COUNT}}) - 🇫🇷✓ 🇬🇧⏳ 🇪🇸⏳ 🇮🇹⏳ 🇵🇹⏳ 🇩🇪⏳        │ │
│  │ ████████ Représentations ({{R_COUNT}}) - 🇫🇷✓ 🇬🇧⏳ 🇪🇸⏳ 🇮🇹⏳ 🇵🇹⏳ 🇩🇪⏳  │ │
│  │ ████████ Relations ({{REL_COUNT}}) - 🇫🇷✓ 🇬🇧⏳ 🇪🇸⏳ 🇮🇹⏳ 🇵🇹⏳ 🇩🇪⏳       │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  Actions rapides:                                                           │
│  [+ Nouvelle question] [🌐 Gérer traductions] [📊 Stats i18n] [📤 Export]    │
│  [📥 Import traductions] [✅ Valider traductions] [🚀 Déployer langue]       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 13.2 *** NOUVEAUTÉ: Gestion complète des traductions ***

#### Centre de traduction unifié

Interface centralisée pour gérer l'ensemble du processus de traduction de toutes les questions sources.

```typescript
interface TranslationCenter {
  // Vue d'ensemble par langue
  overview: {
    locale: SupportedLocale;
    completeness: number; // Pourcentage de traduction
    validatedCount: number;
    pendingCount: number;
    lastUpdate: Date;
  }[];
  
  // Workflow de traduction par étapes
  workflow: {
    currentStep: 'export' | 'translation' | 'validation' | 'deployment';
    nextActions: string[];
    blockers: string[];
  };
  
  // Métriques qualité
  quality: {
    averageScore: number;
    consistencyCheck: boolean;
    culturalReview: boolean;
  };
}
```

#### Interface de traduction question par question

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ Traduction Question #1 - Personnalité                           [EN] 🇬🇧       │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│ 🇫🇷 FRANÇAIS (Source)                                                         │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ Tes vrais amis, tu les comptes ...                                         │ │
│ │                                                                             │ │
│ │ Options:                                                                    │ │
│ │ • Sur les doigts d'une main                                                 │ │
│ │ • Sur les deux mains                                                        │ │ 
│ │ • Tu n'as pas assez de doigts pour les compter                             │ │
│ │ • Tu n'en as pas                                                            │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│ 📝 NOTES CULTURELLES                                                         │
│ Expression idiomatique avec les doigts - adapter selon culture anglophone    │
│                                                                               │
│ 🇬🇧 ANGLAIS (Traduction)                        Status: ⏳ En attente        │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ Your true friends, you count them ...                      [Focus]         │ │
│ │                                                                             │ │
│ │ Options:                                                                    │ │
│ │ • On the fingers of one hand                               [Focus]         │ │
│ │ • On both hands                                            [Focus]         │ │
│ │ • You don't have enough fingers to count them             [Focus]         │ │
│ │ • You don't have any                                       [Focus]         │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│ 💬 ADAPTATION CULTURELLE                                                     │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ Expression "count on fingers" bien comprise en anglais. Maintenir le       │ │
│ │ sens littéral tout en gardant la fluidité naturelle.                       │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│ Actions: [💾 Sauvegarder] [👁️ Prévisualiser] [✅ Marquer prêt] [❌ Rejeter]    │
│         [⬅️ Précédent] [➡️ Suivant] [📋 Export pour validation externe]       │
└───────────────────────────────────────────────────────────────────────────────┘
```

#### Outils d'assistance à la traduction

```typescript
interface TranslationAssistance {
  // Détection d'incohérences
  consistencyCheck: {
    termVariations: string[]; // Termes traduits différemment
    lengthWarnings: string[]; // Traductions trop longues/courtes  
    missingTranslations: number[];
  };
  
  // Suggestions automatiques
  suggestions: {
    machineTranslation: string; // Traduction automatique de base
    contextualHints: string[]; // Indices contextuels
    culturalNotes: string; // Notes d'adaptation culturelle
  };
  
  // Validation temps réel
  validation: {
    grammarCheck: boolean;
    spellingCheck: boolean;
    culturalReview: boolean;
    gameplayTest: boolean; // Test en conditions réelles
  };
}
```

#### Workflow de validation multi-étapes

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Validation des traductions - Anglais 🇬🇧                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ ✅ Étape 1: Traduction complète ({{DYNAMIC_COUNT}} questions)                     │
│ ⏳ Étape 2: Révision linguistique (En cours - {{DYNAMIC_VALIDATED}}/{{DYNAMIC_TOTAL}})                   │
│ ⏸️  Étape 3: Validation culturelle (En attente)                         │
│ ⏸️  Étape 4: Tests gameplay (En attente)                                │
│ ⏸️  Étape 5: Déploiement production (En attente)                        │
│                                                                         │
│ 👤 Réviseur actuel: sarah.johnson@translationteam.com                   │
│ 📅 Échéance: 15 février 2024                                            │
│ 🎯 Progression: {{DYNAMIC_PERCENTAGE}}% ({{DYNAMIC_VALIDATED}}/{{DYNAMIC_TOTAL}} questions validées)                         │
│                                                                         │
│ 📊 Métriques qualité actuelles:                                         │
│ • Cohérence terminologique: 92%                                         │
│ • Adaptation culturelle: 88%                                            │
│ • Fluidité gameplay: 95%                                                │
│ • Temps de réponse moyen: 2.3s                                          │
│                                                                         │
│ Actions: [📧 Notifier réviseur] [📈 Rapport détaillé] [⚡ Accélérer]     │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Export/Import pour traducteurs externes

```typescript
// Export pour traducteurs
interface TranslationExport {
  format: 'csv' | 'xliff' | 'json' | 'gettext';
  locale: SupportedLocale;
  includeContext: boolean;
  includeMetadata: boolean;
  
  // Configuration CSV
  csvConfig?: {
    delimiter: ',' | ';' | '\t';
    encoding: 'utf-8' | 'utf-16';
    includeHeaders: boolean;
  };
  
  // Configuration XLIFF (standard industrie)
  xliffConfig?: {
    version: '1.2' | '2.0';
    includeNotes: boolean;
    segmentationMode: 'sentence' | 'paragraph';
  };
}

// Structure d'export CSV
interface TranslationCSVRow {
  sourceId: number;
  context: string; // "personality", "situations", etc.
  sourceText: string;
  sourceOptions: string; // JSON array ou séparé par |
  targetText: string; // Vide pour nouvelles traductions
  targetOptions: string;
  translationNotes: string;
  culturalContext: string;
  difficulty: string;
  status: TranslationStatus;
  translatedBy: string;
  validatedBy: string;
  lastModified: string;
}
```

### 13.3 Gestion des questions (étendue pour multilingue)

#### Liste des questions
- **Filtres avancés** : Par round, nombre de réponses, date d'ajout, popularité
- **Recherche** : Full-text search dans les questions
- **Actions bulk** : Activer/désactiver, supprimer, exporter
- **Statistiques** : Taux de réponse, distribution des choix

#### Formulaire d'édition
```typescript
interface QuestionForm {
  round_id: 1 | 2 | 3 | 4;
  name: string;
  answers: {
    answer_1: string | null;
    answer_2: string | null;
    answer_3: string | null;
    answer_4: string | null;
  };
  metadata: {
    tags: string[];
    difficulty: 'easy' | 'medium' | 'hard';
    isActive: boolean;
    createdBy: string;
    lastModified: Date;
  };
}
```

#### Prévisualisation en temps réel
- Affichage de la question comme elle apparaîtra en jeu
- Simulation des différents états (joueur actif/autres joueurs)
- Test de lisibilité mobile

### 13.4 Features avancées

#### Gestion des rounds
- Personnalisation des noms et descriptions
- Configuration des couleurs et thèmes visuels
- Ordre d'apparition des rounds
- Règles spécifiques par round

#### Import/Export
- **Import CSV** : Template fourni, validation des données
- **Export** : JSON, CSV, Excel avec filtres
- **Backup automatique** : Sauvegarde quotidienne
- **Versioning** : Historique des modifications

#### Analytics
- **Questions populaires** : Les plus/moins jouées
- **Taux d'abandon** : Questions qui font quitter les joueurs
- **Distribution des réponses** : Équilibre des choix
- **Feedback joueurs** : Notes et commentaires

#### Modération
- **File d'attente** : Questions soumises par la communauté
- **Validation** : Workflow d'approbation
- **Signalements** : Gestion des questions problématiques
- **A/B testing** : Test de questions alternatives

## 14. Ressources et références du projet

### 14.1 Structure des fichiers du projet

#### Fichiers de documentation
- **Ce document** : Spécifications techniques complètes d'Epercept
- **Base de données questions** : `epercept-questions-database.md` - Questions détaillées organisées par rounds
- **README principal** : `README.md` - Instructions de développement et déploiement

#### Références techniques
- **Questions** : Questions réparties en 4 catégories thématiques
- **Composants UI** : 12 écrans principaux définis
- **Architecture** : Stack Next.js + NestJS + PostgreSQL

### 14.2 Navigation entre ressources

Pour développer l'application, consulter dans l'ordre :
1. **Ce document** pour l'architecture et les spécifications techniques
2. **epercept-questions-database.md** pour le contenu complet des questions
3. **Spécifications détaillées** dans ce document

### 14.3 Référence rapide

#### Questions du jeu
- **Total** : Questions réparties dynamiquement selon configuration admin
- **Localisation** : `./epercept-questions-database.md`
- **Format** : Questions organisées par thématiques avec toutes les réponses
- **Usage** : Base de données pour l'interface d'administration

#### Textes d'interface
- **Localisation** : Section 9.1 de ce document
- **Statut** : Corrigés selon retours fondateur
- **Usage** : Intégrer directement dans les composants React/Next.js

## 15. Textes et messages complets du jeu

### 15.1 Messages système

#### Messages d'erreur
```typescript
const ERROR_MESSAGES = {
  // Connexion et PIN
  INVALID_PIN: "Code PIN invalide",
  GAME_NOT_FOUND: "Partie non trouvée",
  USERNAME_TAKEN: "Ce pseudo est déjà utilisé dans cette partie. Veuillez choisir un autre pseudo.",
  INVALID_USERNAME: "Insérez un pseudo valide",
  
  // Connexion réseau
  CONNECTION_LOST: "Connexion perdue. Reconnexion en cours...",
  RECONNECTION_FAILED: "Impossible de se reconnecter. Veuillez rafraîchir la page.",
  SERVER_ERROR: "Une erreur inattendue est survenue",
  
  // Gameplay
  GAME_FULL: "Cette partie est complète (7 joueurs maximum)",
  GAME_IN_PROGRESS: "Cette partie a déjà commencé",
  NOT_ENOUGH_PLAYERS: "Il faut au moins 3 joueurs pour commencer",
  ANSWER_TIMEOUT: "Temps écoulé ! Votre réponse n'a pas été prise en compte",
  
  // Déconnexions
  PLAYER_DISCONNECTED: "{username} s'est déconnecté(e)",
  WAITING_RECONNECTION: "En attente de la reconnexion de {username}...",
  GAME_ABANDONED: "Trop de joueurs déconnectés. Partie annulée."
};
```

#### Messages de statut
```typescript
const STATUS_MESSAGES = {
  // Phases de jeu
  WAITING_PLAYERS: "En attente des autres joueurs...",
  WAITING_ANSWER: "{username} est en train de répondre...",
  WAITING_GUESSES: "En attente des devinettes...",
  REVEALING_ANSWERS: "Révélation des réponses...",
  CALCULATING_SCORES: "Calcul des scores...",
  
  // Transitions
  NEXT_ROUND: "Manche suivante dans 3 secondes...",
  NEXT_TURN: "Tour suivant...",
  GAME_ENDING: "Fin de partie...",
  
  // Timer
  TIME_REMAINING: "Temps restant : {seconds}s",
  LAST_CHANCE: "Plus que 10 secondes !",
  TIMES_UP: "Temps écoulé !",
  
  // Résultats
  CORRECT_ANSWER: "Bonne réponse ! +1 point",
  WRONG_ANSWER: "Mauvaise réponse",
  NO_ANSWER: "Pas de réponse",
  PERFECT_ROUND: "Tous ont trouvé ! Manche parfaite !",
};
```

#### Textes des boutons et actions
```typescript
const BUTTON_TEXTS = {
  // Navigation
  START_GAME: "Commencer la partie",
  JOIN_GAME: "Rejoindre",
  CREATE_GAME: "Créer une partie",
  NEXT: "Suivant",
  CONTINUE: "Continuer",
  BACK: "Retour",
  
  // Gameplay
  SUBMIT_ANSWER: "Valider ma réponse",
  SUBMIT_GUESS: "Valider ma devinette",
  SHOW_RESULTS: "Voir les résultats",
  NEXT_TURN: "Tour suivant",
  NEXT_ROUND: "Manche suivante",
  
  // Fin de partie
  PLAY_AGAIN: "Rejouer",
  NEW_GAME: "Nouvelle partie",
  VIEW_STATS: "Voir les statistiques",
  SHARE_RESULTS: "Partager les résultats",
  
  // Admin et options
  LEAVE_GAME: "Quitter la partie",
  SHOW_RANKING: "Voir le classement",
  HIDE_RANKING: "Masquer le classement",
  TOGGLE_SOUND: "Son ON/OFF",
};
```

### 15.2 Textes des états de jeu

#### Écran de chargement
```typescript
const LOADING_TEXTS = {
  JOINING_GAME: "Connexion à la partie...",
  LOADING_QUESTIONS: "Préparation des questions...",
  SYNCHRONIZING: "Synchronisation avec les autres joueurs...",
  CALCULATING_RESULTS: "Calcul des résultats...",
  PREPARING_NEXT_ROUND: "Préparation de la manche suivante...",
};
```

#### Aide et tooltips
```typescript
const HELP_TEXTS = {
  PIN_INPUT: "Saisissez le code à 6 chiffres fourni par le créateur de la partie",
  USERNAME_INPUT: "Choisissez un pseudo unique pour cette partie",
  QUESTION_ANSWERING: "Répondez honnêtement, vous ne gagnez pas de points pour votre propre réponse",
  GUESSING_PHASE: "Devinez ce que {username} a répondu à cette question",
  TIMER_WARNING: "Le timer démarre dès que le premier joueur répond",
  RANKING_EXPLANATION: "Classement basé sur le nombre de bonnes devinettes",
};
```

### 15.3 Messages de fin de partie

#### Résultats et classements
```typescript
const END_GAME_TEXTS = {
  // Podium
  WINNER_SINGLE: "🏆 {username} remporte la partie !",
  WINNER_MULTIPLE: "🏆 Égalité ! {usernames} remportent la partie !",
  FINAL_RANKING: "Classement final",
  PERSONAL_STATS: "Vos statistiques",
  
  // Statistiques
  QUESTIONS_ANSWERED: "Questions posées : {count}",
  CORRECT_GUESSES: "Bonnes devinettes : {count}/{total}",
  ACCURACY_RATE: "Taux de réussite : {percentage}%",
  FAVORITE_ROUND: "Manche préférée : {roundName}",
  BEST_GUESSER: "Meilleur devineur : {username}",
  MOST_PREDICTABLE: "Plus prévisible : {username}",
  MOST_SURPRISING: "Plus surprenant : {username}",
  
  // Options de continuation
  SESSION_STATS: "Statistiques de la session",
  GAMES_PLAYED: "Parties jouées : {count}",
  CUMULATIVE_SCORE: "Score cumulé : {score} points",
  CONTINUE_SESSION: "Continuer la session",
  END_SESSION: "Terminer la session",
};
```

## 16. Spécifications complètes des écrans

### 16.1 États visuels détaillés

#### Page d'accueil
```typescript
interface HomePageStates {
  intro: {
    title: "PERCEPT";
    logo: "percept_logo.svg";
    content: string; // Texte section 9.1
    action: "Suivant";
  };
  
  rules: {
    title: "Règles du jeu";
    content: string; // Règles section 9.1
    action: "Suivant";
  };
  
  main: {
    title: "PERCEPT";
    logo: "percept_logo.svg";
    content: "Bienvenue ! Commencez une partie ou rejoignez-en une...";
    actions: ["Créer une partie", "Code PIN + GO"];
  };
  
  // États d'erreur
  error: {
    message: string;
    type: "invalid_pin" | "connection_error" | "server_error";
    recoverable: boolean;
  };
  
  // État de chargement
  loading: {
    message: "Connexion en cours...";
    spinner: true;
  };
}
```

#### Lobby/Salle d'attente
```typescript
interface LobbyStates {
  waiting: {
    header: {
      logo: "percept_logo.svg";
      pin: string; // Code PIN en grand
      title: "En attente des joueurs";
    };
    
    playersList: Player[];
    minPlayers: 3;
    maxPlayers: 7;
    
    footer: {
      status: `${currentPlayers}/${maxPlayers} joueurs`;
      autoStart: boolean; // Démarre auto à 3 joueurs
    };
  };
  
  starting: {
    countdown: number; // 3, 2, 1...
    message: "La partie commence !";
  };
  
  error: {
    type: "player_limit" | "disconnection" | "timeout";
    message: string;
    recoverable: boolean;
  };
}
```

## 17. Configuration technique complète avec support multilingue

### 17.1 Variables d'environnement complètes (i18n + authentification)

#### Frontend (Next.js) avec internationalisation et authentification
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_SOCKET_URL=http://localhost:5001
NEXT_PUBLIC_APP_NAME=Epercept
NEXT_PUBLIC_MAX_PLAYERS=7
NEXT_PUBLIC_MIN_PLAYERS=3
NEXT_PUBLIC_GAME_TIMEOUT=300000
NEXT_PUBLIC_RECONNECTION_ATTEMPTS=3

# *** NOUVEAUTÉ: Configuration multilingue ***
NEXT_PUBLIC_DEFAULT_LOCALE=fr
NEXT_PUBLIC_SUPPORTED_LOCALES=fr,en,es,it,pt,de
NEXT_PUBLIC_ENABLE_LOCALE_DETECTION=true
NEXT_PUBLIC_FALLBACK_LOCALE=fr
NEXT_PUBLIC_TRANSLATION_API_KEY=your-translation-api-key

# *** NOUVEAUTÉ AUTH: Configuration authentification frontend ***
NEXT_PUBLIC_AUTH_ENABLED=true
NEXT_PUBLIC_GUEST_MODE_ENABLED=true
NEXT_PUBLIC_OAUTH_ENABLED=true

# OAuth Providers (publics - client IDs seulement)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
NEXT_PUBLIC_FACEBOOK_APP_ID=your-facebook-app-id
NEXT_PUBLIC_APPLE_CLIENT_ID=your.apple.service.id

# Auth Configuration
NEXT_PUBLIC_JWT_TOKEN_STORAGE=localStorage # ou sessionStorage
NEXT_PUBLIC_SESSION_TIMEOUT_WARNING=60000 # 1 minute avant expiration
NEXT_PUBLIC_CONVERSION_MODAL_DELAY=3000 # 3 secondes après résultats
NEXT_PUBLIC_CONVERSION_RETRY_AFTER_GAMES=3 # Reproposer après 3 parties

# Analytics et A/B Testing
NEXT_PUBLIC_ANALYTICS_ID=GA_MEASUREMENT_ID
NEXT_PUBLIC_AB_TEST_CONVERSION_ENABLED=true

# Production
NEXT_PUBLIC_API_URL=https://api.epercept.fr
NEXT_PUBLIC_SOCKET_URL=https://api.epercept.fr
NEXT_PUBLIC_GOOGLE_CLIENT_ID=prod-google-client-id.apps.googleusercontent.com
NEXT_PUBLIC_FACEBOOK_APP_ID=prod-facebook-app-id
NEXT_PUBLIC_APPLE_CLIENT_ID=prod.apple.service.id
```

#### Backend (NestJS) avec internationalisation et authentification
```bash
# .env
NODE_ENV=development
PORT=5001
DATABASE_URL=postgresql://user:password@localhost:5432/epercept
REDIS_URL=redis://localhost:6379

# *** JWT & Security (ÉTENDU) ***
JWT_ACCESS_SECRET=your-super-secret-jwt-access-key-minimum-32-chars
JWT_REFRESH_SECRET=your-different-refresh-secret-minimum-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
SESSION_SECRET=your-session-secret-minimum-32-chars
ENCRYPTION_KEY=your-hex-encryption-key-32-bytes
KEY_SALT=your-hex-salt-32-bytes

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,https://epercept.fr
CORS_CREDENTIALS=true

# *** NOUVEAUTÉ AUTH: Configuration OAuth ***
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5001/api/v1/auth/oauth/google/callback

# Facebook OAuth  
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_CALLBACK_URL=http://localhost:5001/api/v1/auth/oauth/facebook/callback

# Apple OAuth
APPLE_CLIENT_ID=your.apple.service.id
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY_PATH=/path/to/apple-private-key.p8
APPLE_CALLBACK_URL=http://localhost:5001/api/v1/auth/oauth/apple/callback

# *** Email Service Configuration ***
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=noreply@epercept.fr
SMTP_FROM_NAME=Epercept

# Email Templates
EMAIL_TEMPLATES_DIR=./src/email/templates
EMAIL_BASE_URL=http://localhost:3000

# *** Rate Limiting & Security ***
RATE_LIMIT_WINDOW_MS=900000 # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=true

# Brute Force Protection
LOGIN_ATTEMPTS_LIMIT=5
LOGIN_ATTEMPTS_WINDOW_MS=900000 # 15 minutes
LOGIN_LOCKOUT_DURATION_MS=3600000 # 1 hour

# Password Policy
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBERS=true
PASSWORD_REQUIRE_SYMBOLS=false

# Game Configuration
MAX_PLAYERS_PER_GAME=7
MIN_PLAYERS_TO_START=3
ANSWER_TIMEOUT_MS=30000
RECONNECTION_TIMEOUT_MS=120000
GAME_CLEANUP_INTERVAL_MS=300000

# *** Configuration i18n Backend ***
I18N_DEFAULT_LOCALE=fr
I18N_SUPPORTED_LOCALES=fr,en,es,it,pt,de
I18N_FALLBACK_LOCALE=fr
I18N_ENABLE_DETECTION=true
I18N_CACHE_TTL=3600
TRANSLATION_SERVICE_URL=https://translate.googleapis.com/v2
TRANSLATION_VALIDATION_WEBHOOK=https://api.epercept.fr/webhooks/translation-validation

# *** Guest Session Management ***
GUEST_SESSION_DURATION_MS=86400000 # 24 hours
GUEST_DATA_RETENTION_HOURS=24
CONVERSION_REMINDER_INTERVAL_GAMES=3

# *** Monitoring & Analytics ***
ENABLE_AUTH_AUDIT=true
AUTH_AUDIT_RETENTION_DAYS=90
SECURITY_ALERT_WEBHOOK=https://hooks.slack.com/your-security-webhook
ANALYTICS_TRACKING_ID=your-analytics-id

# Production Overrides
DATABASE_URL=postgresql://prod-user:secure-pass@prod-host:5432/epercept
REDIS_URL=redis://:redis-password@prod-redis:6379
GOOGLE_CALLBACK_URL=https://api.epercept.fr/api/v1/auth/oauth/google/callback
FACEBOOK_CALLBACK_URL=https://api.epercept.fr/api/v1/auth/oauth/facebook/callback
APPLE_CALLBACK_URL=https://api.epercept.fr/api/v1/auth/oauth/apple/callback
EMAIL_BASE_URL=https://epercept.fr
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

## Conclusion

Ce document fournit toutes les spécifications nécessaires pour développer Epercept from scratch :

✅ **Spécifications fonctionnelles complètes** avec exigences de robustesse
✅ **Architecture technique moderne** (Next.js + NestJS + PostgreSQL)
✅ **Parcours utilisateur détaillé** avec tous les écrans et interactions
✅ **Design system complet** avec composants et thèmes
✅ **Spécifications de performance** et monitoring intégré
✅ **Tests exhaustifs** pour assurer la qualité
✅ **Configuration de déploiement** production-ready

### Vision du produit

Epercept est conçu comme un jeu social moderne qui permet aux joueurs de mieux se connaître à travers des questions personnelles et des devinettes en temps réel. L'application vise à créer des moments de connexion authentique entre amis, famille ou collègues.

### Avantages de l'architecture proposée

**Robustesse** : Gestion native de la synchronisation temps réel, reconnexion automatique, cohérence des états

**Scalabilité** : Architecture microservices permettant de supporter des milliers de joueurs simultanés

**Maintenabilité** : Code TypeScript strict, tests automatisés, monitoring intégré

**Expérience utilisateur** : Interface responsive, feedback visuel clair, progression fluide

### Recommandations pour le développement

Le succès du projet repose sur :
- Développement itératif avec MVP fonctionnel rapide
- Tests rigoureux à chaque étape
- Monitoring proactif dès la mise en production
- Attention constante à l'expérience utilisateur temps réel