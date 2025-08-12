# API Endpoints Documentation - Epercept

## ⚠️ RÉFÉRENCE COMPLÈTE
Documentation exhaustive de toutes les APIs Epercept.
**Alignement total** avec architecture Batch 2 et types TYPES_DEFINITIONS.md.

## 🔗 Base URLs par Environnement

```typescript
const API_BASE_URLS = {
  development: 'http://localhost:3001/api/v1',
  test: 'http://localhost:3001/api/v1',  
  production: 'https://api.epercept.fr/api/v1'  // Configuration centralisée
};

// WebSocket URLs
const WS_BASE_URLS = {
  development: 'http://localhost:3001',
  test: 'http://localhost:3001',
  production: 'https://api.epercept.fr'          // Configuration centralisée
};
```

## 🔐 Authentication Endpoints

### POST /auth/login
```typescript
// Login avec email/password
Request: {
  email: string;
  password: string;
  rememberMe?: boolean;
}

Response: ApiResponse<{
  user: AuthenticatedUser;
  accessToken: string;    // JWT 15min (ENV_VARIABLES.md)
  refreshToken: string;   // JWT 7d (ENV_VARIABLES.md)
  sessionId: string;      // Session unifiée (Batch 4)
}>

Status Codes:
- 200: Login successful
- 400: Invalid credentials  
- 429: Too many attempts
- 500: Server error

Headers Required: 
- Content-Type: application/json
```

### POST /auth/register
```typescript
// Inscription nouvelle utilisateur
Request: {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  locale?: string;        // Batch 3 multilingue
}

Response: ApiResponse<{
  user: AuthenticatedUser;
  requiresEmailVerification: boolean;
}>

Status Codes:
- 201: User created
- 400: Invalid input / Email exists
- 500: Server error
```

### OAuth Endpoints (Providers standardisés Batch 4)

#### GET /auth/oauth/google
```typescript
// Redirection vers OAuth Google
Query Parameters: {
  redirect_uri?: string;  // URL de callback
  state?: string;         // État CSRF
}

Response: 302 Redirect to Google OAuth
```

#### POST /auth/oauth/google/callback
```typescript
// Callback OAuth Google
Request: {
  code: string;           // Code d'autorisation Google
  state?: string;         // État CSRF
}

Response: ApiResponse<{
  user: AuthenticatedUser;
  accessToken: string;
  refreshToken: string;
  isNewUser: boolean;     // Première connexion
}>
```

#### GET /auth/oauth/facebook, POST /auth/oauth/facebook/callback
#### GET /auth/oauth/apple, POST /auth/oauth/apple/callback
```typescript
// Même structure que Google
// Providers dans l'ordre standardisé (Batch 4)
```

### POST /auth/refresh
```typescript
// Renouvellement token
Request: {
  refreshToken: string;
}

Response: ApiResponse<{
  accessToken: string;    // Nouveau token 15min
  expiresAt: Date;
}>

Status Codes:
- 200: Token refreshed
- 401: Invalid refresh token
- 403: Token expired
```

### POST /auth/logout
```typescript
// Déconnexion
Headers Required:
- Authorization: Bearer {accessToken}

Response: ApiResponse<{
  message: string;
}>

Status Codes:
- 200: Logout successful
- 401: Unauthorized
```

### POST /auth/convert-guest
```typescript
// Conversion invité → utilisateur (Batch 4)
Request: ConvertGuestDto & {
  email: string;
  username: string;
  password?: string;      // Si pas OAuth
  provider?: OAuthProvider; // Si OAuth
}

Headers Required:
- Authorization: Bearer {guestToken}

Response: ApiResponse<{
  user: AuthenticatedUser;
  accessToken: string;
  transferredData: {
    gamesCount: number;
    pointsTotal: number;
    milestonesCount: number;
  };
}>

Status Codes:
- 201: Conversion successful
- 400: Invalid guest session / Email exists
- 401: Invalid guest token
```

## 🎮 Game Management Endpoints

### POST /games
```typescript
// Création d'une partie
Request: {
  config: Partial<GameConfig>;  // Configuration admin
  isPrivate?: boolean;
  maxPlayers?: number;          // 3-7 (Standards Batch 1)
}

Headers Required:
- Authorization: Bearer {accessToken}

Response: ApiResponse<{
  game: GameWithDetails;
  pin: string;                  // PIN de la partie
}>

Status Codes:
- 201: Game created
- 400: Invalid configuration
- 401: Unauthorized
- 403: Max games limit reached
```

### GET /games/:gameId
```typescript
// Détails d'une partie
Parameters: {
  gameId: string;
}

Query Parameters: {
  include?: 'players' | 'rounds' | 'stats';
}

Response: ApiResponse<GameWithDetails>

Status Codes:
- 200: Game found
- 404: Game not found
- 403: Access denied (partie privée)
```

### POST /games/join
```typescript
// Rejoindre une partie via PIN
Request: {
  pin: string;
  username?: string;        // Pour invités
}

Headers Required:
- Authorization: Bearer {accessToken|guestToken}

Response: ApiResponse<{
  game: GameWithDetails;
  player: PlayerInGame;
  position: number;         // Position dans la partie
}>

Status Codes:
- 200: Joined successfully
- 400: Invalid PIN
- 404: Game not found
- 409: Game full / Already started
- 429: Rate limited
```

### POST /games/:gameId/start
```typescript
// Démarrer une partie
Parameters: {
  gameId: string;
}

Headers Required:
- Authorization: Bearer {accessToken}
- X-Creator-Only: true    // Seul créateur peut démarrer

Response: ApiResponse<{
  game: GameWithDetails;
  firstRound: RoundWithQuestion;
}>

Status Codes:
- 200: Game started
- 400: Not enough players (< 3)
- 403: Not creator / Already started
- 404: Game not found
```

### POST /games/:gameId/leave
```typescript
// Quitter une partie
Parameters: {
  gameId: string;
}

Headers Required:
- Authorization: Bearer {accessToken}

Response: ApiResponse<{
  message: string;
  gameStatus: GameStatus;   // État après départ
}>

Status Codes:
- 200: Left successfully
- 404: Game or player not found
- 400: Cannot leave (game in progress)
```

### GET /games/active
```typescript
// Liste des parties actives
Query Parameters: {
  page?: number;
  limit?: number;           // Max 50
  status?: GameStatus[];
  isJoinable?: boolean;
}

Response: ApiResponse<{
  games: GameSummary[];
  pagination: PaginationInfo;
}>

Status Codes:
- 200: Games retrieved
- 400: Invalid parameters
```

## 🎯 Gameplay Endpoints

### POST /games/:gameId/answer
```typescript
// Soumettre une réponse (phase réponse)
Parameters: {
  gameId: string;
}

Request: {
  roundId: string;
  answer: string;
  submittedAt: Date;        // Timestamp client pour latence
}

Headers Required:
- Authorization: Bearer {accessToken}

Response: ApiResponse<{
  playerAnswer: PlayerAnswer;
  isCorrect: boolean;       // Révélé immédiatement
  points?: number;          // Si applicable
}>

Status Codes:
- 201: Answer submitted
- 400: Invalid round / Already answered
- 404: Game or round not found
- 403: Not your turn / Wrong phase
```

### POST /games/:gameId/guess
```typescript
// Soumettre une devinette (phase devinettes)
Parameters: {
  gameId: string;
}

Request: {
  roundId: string;
  guess: string;
  submittedAt: Date;        // Pour calcul points vitesse
}

Headers Required:
- Authorization: Bearer {accessToken}

Response: ApiResponse<{
  playerGuess: PlayerGuess;
  isCorrect: boolean;
  points: number;           // Points obtenus (avec bonus vitesse)
  timerStarted?: boolean;   // Si première devinette (Standards Batch 1)
}>

Status Codes:
- 201: Guess submitted
- 400: Invalid round / Already guessed
- 404: Game or round not found
- 403: Wrong phase / Not allowed to guess
```

### GET /games/:gameId/state
```typescript
// État temps réel d'une partie
Parameters: {
  gameId: string;
}

Query Parameters: {
  lastUpdate?: string;      // ISO Date pour delta
}

Response: ApiResponse<{
  game: GameWithDetails;
  currentRound?: RoundWithQuestion;
  timer?: TimerState;       // État du timer (Standards Batch 1)
  leaderboard: PlayerInGame[];
  lastUpdate: Date;
}>

Status Codes:
- 200: State retrieved
- 404: Game not found
- 403: Not in game
```

### POST /games/:gameId/reconnect
```typescript
// Reconnexion après déconnexion
Parameters: {
  gameId: string;
}

Request: {
  lastKnownState?: {
    roundNumber: number;
    playerPosition: number;
  };
}

Headers Required:
- Authorization: Bearer {accessToken}

Response: ApiResponse<{
  game: GameWithDetails;
  player: PlayerInGame;
  missed: {                 // Ce qui s'est passé pendant déconnexion
    rounds: number;
    points: number;
  };
  canReconnect: boolean;    // Selon timeout 2min (Standards Batch 1)
}>

Status Codes:
- 200: Reconnected successfully
- 400: Reconnection timeout exceeded
- 404: Game not found
- 403: Player removed from game
```

## 📊 Statistics & Analytics Endpoints

### GET /users/:userId/stats
```typescript
// Statistiques utilisateur
Parameters: {
  userId: string;           // 'me' pour utilisateur courant
}

Query Parameters: {
  period?: 'day' | 'week' | 'month' | 'all';
  include?: 'games' | 'achievements' | 'rankings';
}

Headers Required:
- Authorization: Bearer {accessToken}

Response: ApiResponse<{
  stats: {
    gamesPlayed: number;
    gamesWon: number;
    totalPoints: number;
    averagePoints: number;
    bestScore: number;
    winRate: number;        // Pourcentage
    averagePosition: number;
    
    // Temps
    totalPlayTime: number;  // Minutes
    averageGameDuration: number;
    
    // Évolution
    pointsHistory: Array<{date: Date, points: number}>;
    rankingHistory: Array<{date: Date, position: number}>;
  };
  achievements?: Achievement[];
  recentGames?: GameSummary[];
}>

Status Codes:
- 200: Stats retrieved
- 404: User not found
- 403: Access denied (profil privé)
```

### GET /games/:gameId/results
```typescript
// Résultats finaux d'une partie
Parameters: {
  gameId: string;
}

Response: ApiResponse<{
  game: GameSummary;
  finalRankings: Array<{
    player: Player;
    finalScore: number;
    position: number;
    
    // Détails performance
    correctAnswers: number;
    averageResponseTime: number;
    pointsPerRound: number[];
  }>;
  gameStats: {
    duration: number;       // Minutes
    totalRounds: number;
    averageScore: number;
    fastestAnswer: {
      playerId: string;
      time: number;         // Millisecondes
    };
  };
}>

Status Codes:
- 200: Results retrieved
- 404: Game not found
- 400: Game not completed
```

### GET /leaderboard
```typescript
// Classement général
Query Parameters: {
  period?: 'day' | 'week' | 'month' | 'all';
  page?: number;
  limit?: number;           // Max 100
  category?: 'points' | 'games' | 'winrate';
}

Response: ApiResponse<{
  leaderboard: Array<{
    position: number;
    user: {
      id: string;
      username: string;
      avatar?: string;
    };
    score: number;          // Selon category
    gamesPlayed: number;
    trend: 'up' | 'down' | 'stable'; // Évolution position
  }>;
  userPosition?: {          // Position utilisateur courant
    position: number;
    score: number;
  };
}>

Status Codes:
- 200: Leaderboard retrieved
- 400: Invalid parameters
```

## 👤 User Management Endpoints

### GET /users/me
```typescript
// Profil utilisateur courant
Headers Required:
- Authorization: Bearer {accessToken}

Response: ApiResponse<{
  user: AuthenticatedUser;
  session: UserSession;     // Session unifiée (Batch 4)
  preferences: {
    locale: string;         // Batch 3
    notifications: NotificationPreferences;
    privacy: PrivacySettings;
  };
}>

Status Codes:
- 200: Profile retrieved
- 401: Unauthorized
```

### PUT /users/me
```typescript
// Mise à jour profil
Request: Partial<{
  username: string;
  firstName: string;
  lastName: string;
  bio: string;
  avatar: string;           // Base64 ou URL
  locale: string;           // Batch 3 multilingue
}>

Headers Required:
- Authorization: Bearer {accessToken}
- Content-Type: application/json

Response: ApiResponse<{
  user: AuthenticatedUser;
}>

Status Codes:
- 200: Profile updated
- 400: Invalid data / Username taken
- 401: Unauthorized
- 413: Avatar too large
```

### DELETE /users/me
```typescript
// Suppression compte utilisateur
Headers Required:
- Authorization: Bearer {accessToken}
- X-Confirm-Deletion: true

Response: ApiResponse<{
  message: string;
  deletedAt: Date;
}>

Status Codes:
- 200: Account deleted
- 401: Unauthorized
- 400: Games in progress (cannot delete)
```

## ⚙️ Configuration & Admin Endpoints

### GET /config/public
```typescript
// Configuration publique
Response: ApiResponse<{
  gameConfig: {
    minPlayers: 3;              // Standards Batch 1
    maxPlayers: 7;              // Standards Batch 1
    reconnectionTimeout: 120000; // 2 minutes (Standards Batch 1)
  };
  features: {
    oauthProviders: OAuthProvider[]; // Google, Facebook, Apple (ordre Batch 4)
    guestMode: boolean;
    multiLanguage: boolean;
    pwaSupported: boolean;
  };
  version: string;              // App version (ENV_VARIABLES.md)
}>

Status Codes:
- 200: Config retrieved
```

### GET /health
```typescript
// Health check système
Response: {
  status: 'healthy' | 'degraded' | 'critical';
  timestamp: Date;
  services: {
    database: ServiceStatus;
    redis: ServiceStatus;
    websocket: ServiceStatus;
  };
  metrics: {
    uptime: number;             // Secondes
    memory: number;             // Utilisation mémoire %
    cpu: number;                // Utilisation CPU %
  };
}

Status Codes:
- 200: System healthy
- 503: System degraded/critical
```

## 🔌 WebSocket Events

### Connection
```typescript
// Connexion WebSocket
URL: /socket.io/
Auth: ?token={accessToken}

Events émis par serveur:
- 'connect': Connexion établie
- 'disconnect': Connexion fermée  
- 'error': Erreur connexion
- 'reconnect': Reconnexion réussie

Events client vers serveur:
- 'ping': Heartbeat (25s intervals)
- 'join_game': Rejoindre room partie
- 'leave_game': Quitter room partie
```

### Game Events (Standards WebSocket Batch 2)
```typescript
// États de jeu temps réel
Server → Client:
- 'game_state_update': Nouvel état partie
- 'player_joined': Joueur rejoint
- 'player_left': Joueur parti
- 'round_started': Nouveau round
- 'round_completed': Round terminé
- 'timer_started': Timer démarré (après 1ère devinette)
- 'timer_tick': Tick du timer
- 'timer_expired': Timer expiré
- 'answer_submitted': Réponse soumise
- 'guess_submitted': Devinette soumise

Client → Server:
- 'submit_answer': Soumettre réponse
- 'submit_guess': Soumettre devinette
- 'player_presence': Mise à jour présence
```

### Presence Events
```typescript
// Présence joueurs temps réel
Server → Client:
- 'player_online': Joueur en ligne
- 'player_offline': Joueur hors ligne
- 'player_typing': Joueur tape (dans chat)
- 'player_idle': Joueur inactif

Payload: PlayerPresence
```

## 📈 Rate Limiting

### Limites par Endpoint
```typescript
const RATE_LIMITS = {
  // Auth endpoints (sécurité)
  'POST /auth/login': '5 per minute',
  'POST /auth/register': '3 per minute',
  'POST /auth/refresh': '10 per minute',
  
  // Game endpoints (gameplay)
  'POST /games': '10 per minute',
  'POST /games/join': '20 per minute',
  'POST /games/:id/answer': '1 per 5 seconds',
  'POST /games/:id/guess': '1 per second',
  
  // General API
  'GET /*': '100 per minute',        // Lecture
  'POST /*': '30 per minute',        // Écriture
  'PUT /*': '20 per minute',         // Modification
  'DELETE /*': '5 per minute',       // Suppression
};

// Headers retournés:
// X-RateLimit-Limit: Limite maximale
// X-RateLimit-Remaining: Requêtes restantes
// X-RateLimit-Reset: Timestamp reset
```

## 🔒 Security Headers

### Headers Required/Returned
```typescript
// Headers requis (requests)
Headers: {
  'Authorization': 'Bearer {accessToken}',
  'Content-Type': 'application/json',
  'X-API-Version': 'v1',
  'X-Client-Version': string,    // Version app client
  'User-Agent': string
}

// Headers sécurité (responses)
Headers: {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'",
  'X-Request-ID': string,        // Traçabilité
  'X-Response-Time': string      // Performance monitoring
}
```

## 📊 Monitoring & Metrics

### Métriques automatiques (préfixe epercept_ - Batch 4)
```typescript
// Métriques collectées automatiquement
API_METRICS = {
  // Performance
  'epercept_api_requests_total': 'Nombre total requêtes',
  'epercept_api_request_duration_seconds': 'Durée requêtes',
  'epercept_api_errors_total': 'Nombre erreurs',
  
  // Business
  'epercept_games_created_total': 'Parties créées',
  'epercept_players_joined_total': 'Joueurs ayant rejoint',
  'epercept_active_games': 'Parties actives',
  'epercept_websocket_connections': 'Connexions WebSocket',
  
  // Auth
  'epercept_user_registrations_total': 'Inscriptions',
  'epercept_oauth_logins_total': 'Connexions OAuth',
  'epercept_guest_conversions_total': 'Conversions invités'
};

// Labels automatiques:
// - endpoint: /games/:gameId/answer
// - method: POST
// - status: 200
// - provider: google (OAuth)
```

## 🔗 Références Croisées

### Cohérence architecturale
- ✅ **Types** : Tous alignés avec TYPES_DEFINITIONS.md
- ✅ **Standards Batch 1** : Timer, limites joueurs, reconnexion 2min
- ✅ **Architecture Batch 2** : WebSocket events, DTOs partagés
- ✅ **Multilingue Batch 3** : Locale dans profils, config i18n
- ✅ **Cohérence Batch 4** : Session unifié, OAuth providers ordre, métriques préfixées

### Variables d'environnement
- **Base URLs** : Référencent ENV_VARIABLES.md
- **JWT expiry** : 15min access, 7d refresh (configuration centralisée)
- **OAuth config** : Client IDs/secrets depuis variables env

### Monitoring intégration
- **Métriques** : Alignées avec 08-monitoring-observabilite.md
- **Health checks** : Compatibles Prometheus/Grafana
- **Tracing** : Headers X-Request-ID pour Jaeger

Cette documentation assure une **API cohérente** et **production-ready** pour Epercept.