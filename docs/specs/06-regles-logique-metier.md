## 6. Nouvelles règles de jeu et logique métier

### 6.1 Flow de jeu

#### Suppression du maître de jeu
- **Ancien système** : Le créateur doit cliquer "Continuer" à chaque étape
- **Nouveau système** : Auto-progression basée sur le dernier répondant
- **Logique** : Celui qui répond en dernier déclenche automatiquement la suite
- **Avantage** : Plus de blocage si le créateur est absent

#### Timer automatique en 3 phases
```typescript
// Système de timer intelligent - STANDARD DÉFINITIF
interface GameTimer {
  // Phase 1: Joueur actif répond
  answeringPhase: {
    hasTimer: false; // AUCUN timer pour le joueur qui répond
  };
  
  // Phase 2: Début des devinettes
  guessingPhase: {
    initialTimer: false; // PAS de timer au début
  };
  
  // Phase 3: Timer déclenché après première devinette
  activatedTimer: {
    trigger: 'first_guess_submitted';
    duration: 30000; // 30 secondes pour tous les autres
    appliesTo: 'remaining_guessers';
    onTimeout: () => {
      // Les non-répondants reçoivent 0 point
      // Passage automatique à la phase suivante
    };
  };
}
```

#### Continuité inter-parties
- **Session persistante** : Garder les scores cumulés entre parties
- **Historique questions** : Éviter les répétitions dans la même session
- **Statistiques** : Qui gagne le plus, questions préférées, etc.
- **Configuration dynamique** : Nombre de rounds et questions ajustables via admin
- **Limites de joueurs** : 3 minimum, 7 maximum par partie

#### Gestion robuste des déconnexions
```typescript
// Système de reconnexion
interface PlayerConnection {
  playerId: string;
  socketId: string;
  lastSeen: number;
  reconnectionAttempts: number;
  
  // États de récupération
  canReconnect: boolean;
  gameStateSnapshot: GameState;
  
  // Auto-nettoyage - STANDARD: 2 minutes
  maxInactiveTime: 2 * 60 * 1000; // 2 minutes (cohérent avec 01-introduction-vision.md)
}

// Quand un joueur se déconnecte - STANDARD DÉFINITIF :
// 1. Marquer comme "déconnecté" mais garder sa place 2 minutes exactement
// 2. Si reconnexion dans les 2 minutes : restaurer son état exact
// 3. Si pas de reconnexion après 2 minutes : continuer sans lui
// 4. Redistribuer ses questions aux autres joueurs (min 3 joueurs actifs requis)
```

### 6.2 Nouvelle logique d'affichage

#### Système de feedback visuel
- **Bonne réponse** : Encadré vert uniquement sur la bonne option
- **Mauvaise réponse** : Encadré rouge uniquement sur la réponse du joueur
- **Plus de confusion** : Fini le vert+rouge simultané
- **Lisibilité** : Contraste optimal sur tous les fonds de round

#### Affichage des résultats enrichi
```typescript
interface EnhancedResults {
  // Question rappelée en haut
  question: string;
  correctAnswer: string;
  
  // Qui a eu juste/faux
  correctGuessers: Player[];
  incorrectGuessers: Player[];
  
  // Points distribués
  pointsAwarded: Array<{
    playerId: string;
    pointsGained: number;
    newTotal: number;
  }>;
  
  // Nouveau classement
  updatedRankings: PlayerRanking[];
}
```

#### Page récap de fin de partie
```typescript
interface GameSummary {
  // Résultats finaux
  finalRankings: PlayerRanking[];
  totalQuestions: number; // Dynamique, pas hardcodé
  gameDuration: number;
  
  // Statistiques par joueur
  playerStats: Array<{
    playerId: string;
    correctGuesses: number;
    accuracyRate: number;
    averageResponseTime: number;
    favoriteRoundType: string;
  }>;
  
  // Options de continuation
  canContinue: boolean;
  sessionStats: {
    gamesPlayed: number;
    cumulativeScores: PlayerScore[];
  };
}
```