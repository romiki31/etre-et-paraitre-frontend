# Définitions des Types TypeScript - Epercept

## ⚠️ RÉFÉRENCE CENTRALISÉE 
Ce document définit tous les types TypeScript référencés dans l'architecture et les optimisations de performance.
**Source unique de vérité** pour cohérence frontend/backend.

## 🎮 Types Core Gameplay

### Game Types
```typescript
// Type principal pour jeu complet
interface GameWithDetails {
  id: string;
  pin: string;
  status: GameStatus;
  currentRound: number;
  totalRounds: number;           // Configuration admin (non hardcodé)
  currentTurn: number;
  createdAt: Date;
  startedAt: Date | null;
  
  // Relations enrichies
  players: PlayerInGame[];
  currentPlayer: Player | null;
  rounds: RoundWithQuestion[];
  
  // Métadonnées calculées
  isActive: boolean;
  playerCount: number;
  averagePoints: number;
  leaderPoints: number;
  timeElapsed: number;
}

// Type résumé pour listes/caches
interface GameSummary {
  id: string;
  pin: string;
  status: GameStatus;
  playerCount: number;
  createdAt: Date;
  
  // Optimisé pour affichage liste
  creatorName?: string;
  isJoinable: boolean;
  estimatedDuration: number;
}

// Type streaming pour gros volumes
interface GameStream {
  id: string;
  pin: string;
  status: GameStatus;
  playerCount: number;
  lastActivity: Date;
  
  // Minimal pour performance
  priority: 'high' | 'medium' | 'low';
}

// États de jeu possibles
enum GameStatus {
  WAITING = 'WAITING',        // Attente joueurs
  IN_PROGRESS = 'IN_PROGRESS', // Partie en cours
  PAUSED = 'PAUSED',          // Partie en pause
  COMPLETED = 'COMPLETED',    // Partie terminée
  CANCELLED = 'CANCELLED'     // Partie annulée
}

// Configuration de partie
interface GameConfig {
  minPlayers: 3;              // Standards Batch 1
  maxPlayers: 7;              // Standards Batch 1
  roundsCount: number;        // Admin configurable
  questionTypes: string[];    // Admin configurable
  timerSettings: TimerConfig;
  reconnectionTimeout: 120000; // 2 minutes (Standards Batch 1)
}
```

### Player Types
```typescript
// Joueur dans une partie
interface PlayerInGame {
  id: string;
  username: string;
  points: number;
  position: number;
  isCreator: boolean;
  isActive: boolean;
  connectionStatus: ConnectionStatus;
  lastSeen: Date;
  
  // Gaming specific
  correctAnswers: number;
  averageResponseTime: number;
  hasAnsweredCurrentRound: boolean;
  lastPointTimestamp: number;  // Pour départage égalité
}

// Joueur de base
interface Player {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  isGuest: boolean;
  locale: string;              // Batch 3 multilingue
  
  // Session
  sessionId: string;           // Session unifié (Batch 4)
  lastActivity: Date;
  
  // Stats
  gamesPlayed: number;
  totalPoints: number;
  bestScore: number;
}

// Présence temps réel
interface PlayerPresence {
  playerId: string;
  status: 'online' | 'offline' | 'away' | 'reconnecting';
  lastSeen: Date;
  isTyping?: boolean;
  deviceInfo?: DeviceInfo;
}

// États de connexion
enum ConnectionStatus {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  TIMEOUT = 'timeout'           // Après 2 minutes (Standards Batch 1)
}
```

### Question & Round Types
```typescript
// Round avec question enrichie
interface RoundWithQuestion {
  id: string;
  roundNumber: number;
  status: RoundStatus;
  currentPlayerId: string | null;
  
  // Question associée
  question: QuestionInRound;
  
  // États des joueurs
  playerAnswers: PlayerAnswer[];
  playerGuesses: PlayerGuess[];
  
  // Timer (Standards Batch 1)
  timerState: TimerState | null;
  startedAt: Date | null;
}

// Question dans un round
interface QuestionInRound {
  id: string;
  text: string;                // Dans langue de la partie
  options: string[];
  correctAnswer: string;
  roundType: RoundType;
  
  // i18n (Batch 3)
  locale: string;
  translations?: Record<string, QuestionTranslation>;
}

// Types de rounds
enum RoundType {
  QUESTION_ANSWER = 'QUESTION_ANSWER',    // Question → Réponse
  GUESS_ANSWER = 'GUESS_ANSWER',          // Devinette des autres
  MIXED = 'MIXED'                         // Combiné
}

// États de round
enum RoundStatus {
  PENDING = 'PENDING',           // En attente
  ANSWERING = 'ANSWERING',       // Phase réponse (pas de timer)
  GUESSING = 'GUESSING',         // Phase devinettes (timer après 1ère)
  COMPLETED = 'COMPLETED'        // Round fini
}

// Réponse joueur
interface PlayerAnswer {
  playerId: string;
  answer: string;
  submittedAt: Date;
  responseTime: number;          // Millisecondes
  isCorrect?: boolean;           // Calculé après
}

// Devinette joueur
interface PlayerGuess {
  playerId: string;
  guess: string;
  submittedAt: Date;
  points: number;                // Calculé selon vitesse
  isCorrect: boolean;
}
```

### Timer System Types
```typescript
// Configuration timer (Standards Batch 1)
interface TimerConfig {
  answerPhase: null;             // JAMAIS de timer
  guessingStart: null;           // JAMAIS de timer au début
  guessingAfterFirst: 30000;     // 30s après 1ère devinette
}

// État du timer
interface TimerState {
  isActive: boolean;
  remainingTime: number;         // Millisecondes restantes
  startedAt: Date;
  endsAt: Date;
  triggeredBy: 'first_guess' | null;
  
  // Joueurs concernés
  applicablePlayerIds: string[]; // Exclut ceux qui ont déjà deviné
}
```

## 🔐 Types Authentification

### Auth Types
```typescript
// Utilisateur authentifié
interface AuthenticatedUser {
  id: string;
  email: string;
  username: string;
  avatar?: string;
  
  // OAuth info
  provider: OAuthProvider | null;
  providerId?: string;
  
  // Profil
  firstName?: string;
  lastName?: string;
  bio?: string;
  locale: string;
  
  // Metadata
  createdAt: Date;
  lastLoginAt: Date;
  emailVerified: boolean;
}

// Providers OAuth (ordre standardisé Batch 4)
enum OAuthProvider {
  GOOGLE = 'google',
  FACEBOOK = 'facebook', 
  APPLE = 'apple'
}

// Context d'authentification
interface AuthContext {
  user: AuthenticatedUser | null;
  sessionId: string;             // Session unifiée (Batch 4)
  isAuthenticated: boolean;
  isGuest: boolean;
  loading: boolean;
}

// Données de conversion invité
interface ConvertGuestDto {
  guestSessionId: string;
  email: string;
  username: string;
  password?: string;             // Si pas OAuth
  
  // Stats à transférer
  gamesPlayed: number;
  totalPoints: number;
  achievedMilestones: string[];
}
```

### Session Types
```typescript
// Session utilisateur (unifiée Batch 4)
interface UserSession {
  sessionId: string;             // ID unique
  userId: string | null;         // null si invité
  isGuest: boolean;
  
  // Gaming data
  currentGameId: string | null;
  gamesHistory: string[];
  
  // Stats session
  sessionStarted: Date;
  lastActivity: Date;
  gamesPlayedInSession: number;
  pointsEarnedInSession: number;
  
  // Conversion (pour invités)
  conversionPrompted: boolean;
  conversionPostponed: number;   // Nombre de fois reporté
}
```

## 📊 Types Analytics & Monitoring

### Metrics Types
```typescript
// Métriques de jeu (préfixe epercept_ - Batch 4)
interface GameMetrics {
  gamesCreated: number;          // epercept_games_created_total
  playersJoined: number;         // epercept_players_joined_total
  activeGames: number;           // epercept_active_games
  
  // Performance
  averageGameDuration: number;   // epercept_game_duration_minutes
  averagePlayerCount: number;
  completionRate: number;        // Parties finies vs abandonnées
  
  // Connexions
  websocketConnections: number;  // epercept_websocket_connections
  reconnectionRate: number;      // Taux de reconnexions réussies
}

// Événements business
interface BusinessEvent {
  type: BusinessEventType;
  gameId: string;
  playerId: string;
  timestamp: Date;
  
  // Contexte
  sessionId: string;
  metadata: Record<string, any>;
}

enum BusinessEventType {
  GAME_CREATED = 'game_created',
  GAME_STARTED = 'game_started',
  GAME_COMPLETED = 'game_completed',
  PLAYER_JOINED = 'player_joined',
  PLAYER_LEFT = 'player_left',
  ROUND_COMPLETED = 'round_completed',
  CONVERSION_GUEST_TO_USER = 'conversion_guest_to_user'
}
```

### Performance Types
```typescript
// Métriques de performance
interface PerformanceMetrics {
  // API
  apiResponseTime: number;       // P95 < 500ms
  apiErrorRate: number;          // < 1%
  
  // WebSocket
  websocketLatency: number;      // < 100ms
  messageDeliveryRate: number;   // > 99%
  
  // Base de données
  dbQueryTime: number;           // Moyenne requêtes
  dbConnectionPool: number;      // Connexions actives
  
  // Cache
  cacheHitRate: number;          // Ratio hits/misses
  cacheEvictionRate: number;     // Fréquence évictions
}

// Monitoring système
interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  uptime: number;                // Secondes
  cpuUsage: number;              // Pourcentage
  memoryUsage: number;           // Pourcentage
  diskUsage: number;             // Pourcentage
  
  // Services
  database: ServiceStatus;
  redis: ServiceStatus;
  websocket: ServiceStatus;
  
  lastChecked: Date;
}

interface ServiceStatus {
  status: 'up' | 'down' | 'degraded';
  latency: number;
  errorRate: number;
}
```

## 🌐 Types API & Communication

### API Response Types
```typescript
// Réponse API standard
interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  timestamp: Date;
  
  // Pagination
  pagination?: PaginationInfo;
  
  // Metadata
  requestId: string;
  version: string;
}

// Erreur API
interface ApiError {
  code: string;                  // Code d'erreur standardisé
  message: string;               // Message localisé
  details?: Record<string, any>; // Détails additionnels
  
  // Debug info (dev uniquement)
  stack?: string;
  context?: string;
}

// Pagination
interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
  hasPrevious: boolean;
}
```

### WebSocket Types
```typescript
// Message WebSocket
interface WebSocketMessage {
  type: WebSocketEventType;
  gameId?: string;
  playerId?: string;
  data: any;
  timestamp: Date;
  
  // Identification
  messageId: string;
  correlationId?: string;
}

// Types d'événements WebSocket (alignés frontend/backend Batch 2)
enum WebSocketEventType {
  // Connexion
  PLAYER_CONNECTED = 'player_connected',
  PLAYER_DISCONNECTED = 'player_disconnected',
  
  // Jeu
  GAME_STATE_UPDATE = 'game_state_update',
  ROUND_STARTED = 'round_started',
  ROUND_COMPLETED = 'round_completed',
  
  // Réponses
  ANSWER_SUBMITTED = 'answer_submitted',
  GUESS_SUBMITTED = 'guess_submitted',
  
  // Timer
  TIMER_STARTED = 'timer_started',
  TIMER_TICK = 'timer_tick',
  TIMER_EXPIRED = 'timer_expired',
  
  // Système
  HEARTBEAT = 'heartbeat',
  ERROR = 'error'
}
```

## 🎨 Types UI & UX

### Component Types
```typescript
// Props des composants de jeu
interface GameComponentProps {
  gameId: string;
  currentPlayer: Player;
  gameState: GameWithDetails;
  
  // Callbacks
  onAnswer: (answer: string) => Promise<void>;
  onGuess: (guess: string) => Promise<void>;
  onLeave: () => Promise<void>;
  
  // UI state
  isLoading?: boolean;
  disabled?: boolean;
}

// État UI global
interface UIState {
  currentScreen: ScreenType;
  isLoading: boolean;
  notifications: NotificationState[];
  modals: ModalState[];
  
  // Dashboard (terminologie unifiée Batch 4)
  dashboardTab: 'accueil' | 'parties' | 'stats' | 'profil';
}

enum ScreenType {
  HOME = 'home',
  DASHBOARD = 'dashboard',          // Unifiée (Batch 4)
  GAME_LOBBY = 'game_lobby',
  GAME_PLAY = 'game_play',
  GAME_RESULTS = 'game_results'
}

// Notification (système unifié - référence FEEDBACK_SYSTEM.md)
interface NotificationState {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'loading';
  message: string;
  duration: number;
  persistent: boolean;
  actions?: NotificationAction[];
}

interface NotificationAction {
  label: string;
  action: string | (() => void);
  style?: 'primary' | 'secondary';
}
```

### Device & Platform Types
```typescript
// Info appareil
interface DeviceInfo {
  type: 'desktop' | 'mobile' | 'tablet';
  os: string;
  browser: string;
  screenSize: { width: number; height: number };
  
  // Capacités
  hasTouch: boolean;
  supportsWebRTC: boolean;
  supportsWebSocket: boolean;
}

// Configuration plateforme
interface PlatformConfig {
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  
  // Features disponibles
  features: PlatformFeature[];
}

enum PlatformFeature {
  PWA_INSTALL = 'pwa_install',
  PUSH_NOTIFICATIONS = 'push_notifications',
  SHARE_API = 'share_api',
  CAMERA_ACCESS = 'camera_access'
}
```

## 🧪 Types Testing

### Test Types
```typescript
// Configuration de tests
interface TestConfig {
  coverage: {
    branches: 80;                // Standard unifié (Batch 4)
    functions: 80;
    lines: 80;
    statements: 80;
  };
  
  // Environnements
  environments: TestEnvironment[];
}

enum TestEnvironment {
  UNIT = 'unit',
  INTEGRATION = 'integration',
  E2E = 'e2e',
  LOAD = 'load',
  SECURITY = 'security'
}

// Mock pour tests
interface GameMockData {
  games: GameWithDetails[];
  players: Player[];
  sessions: UserSession[];
  
  // États spéciaux pour tests
  errorStates: ApiError[];
  loadingStates: boolean[];
}
```

## 📚 Types Configuration

### Environment Types
```typescript
// Variables d'environnement (référence ENV_VARIABLES.md)
interface EnvironmentConfig {
  // App
  NODE_ENV: 'development' | 'test' | 'production';
  APP_NAME: string;                // 'epercept'
  APP_VERSION: string;             // '1.0.0'
  
  // Base de données
  DATABASE_URL: string;
  
  // Cache Redis
  REDIS_URL: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD: string;
  
  // Cache TTL (configurables - référence 09-performance-optimisation.md)
  CACHE_QUESTIONS_TTL: number;     // 86400 (24h)
  CACHE_CONFIG_TTL: number;        // 43200 (12h)
  CACHE_GAMESTATE_TTL: number;     // 1800 (30min)
  CACHE_SESSION_TTL: number;       // 3600 (1h)
  CACHE_LEADERBOARD_TTL: number;   // 300 (5min)
  CACHE_ACTIVE_TTL: number;        // 60 (1min)
  CACHE_PRESENCE_TTL: number;      // 30 (30s)
  
  // Sécurité
  JWT_SECRET: string;
  JWT_ACCESS_EXPIRY: string;       // '15m'
  JWT_REFRESH_EXPIRY: string;      // '7d'
  
  // OAuth (providers standardisés)
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  FACEBOOK_CLIENT_ID: string;
  FACEBOOK_CLIENT_SECRET: string;
  APPLE_CLIENT_ID: string;
}
```

## 🔗 Références Croisées

### Cohérence avec Batch 1-4
- ✅ **Standards Batch 1** : Timer 3 phases, limites joueurs 3-7, reconnexion 2min
- ✅ **Architecture Batch 2** : Types partagés frontend/backend, DTOs alignés
- ✅ **Multilingue Batch 3** : Locale dans Player, QuestionTranslation, fallback
- ✅ **Cohérence Batch 4** : Session unifié, providers OAuth ordonnés, métriques préfixées

### Fichiers référencés
- `09-performance-optimisation.md` : Types GameWithDetails, GameSummary, GameStream
- `STANDARDS-EPERCEPT.md` : Timer system, limites joueurs, durées reconnexion  
- `ENV_VARIABLES.md` : Variables d'environnement et configuration
- `FEEDBACK_SYSTEM.md` : Types notifications et messages
- `DESIGN_TOKENS.md` : Styles des composants UI

### Tests validation
- **Coverage 80%** : Aligné avec standards Batch 4
- **Métriques epercept_*** : Préfixe cohérent monitoring
- **Types partagés** : Validation frontend ↔ backend

Ce document assure la **cohérence absolue** des types TypeScript dans toute l'architecture Epercept.