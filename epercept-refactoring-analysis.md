# Analyse complète et plan de refactoring - Epercept (Être et Paraître)

## 1. Analyse du code existant

### 1.1 Architecture actuelle

#### Stack technique
- **Frontend**: React 18 + Vite + MobX + TypeScript
- **Backend**: Express.js + Socket.io (pas de base de données)
- **Build**: esbuild pour le serveur, Vite pour le frontend
- **Déploiement**: Production sur epercept.fr

#### Structure des dossiers
```
epercept/
├── server/             # Backend Express + Socket.io
│   ├── server.ts       # Serveur principal avec endpoints API
│   └── constantes.ts   # Questions et rounds du jeu
├── src/                # Frontend React
│   ├── Components/     # Composants React
│   ├── store.ts        # Store MobX global
│   ├── routes.tsx      # Routing custom
│   └── Interfaces.ts   # Types TypeScript
└── dist/               # Build de production
```

#### Patterns et flux de données
- **État global**: MobX store centralisé (`gameStore`)
- **Communication temps réel**: Socket.io bidirectionnel
- **Routing**: Solution custom avec `history` API
- **Gestion des erreurs**: Basique avec messages dans le store
- **Données volatiles**: Tout est en mémoire (pas de persistance)

### 1.2 Bugs critiques identifiés en production

⚠️ **Issues majeures à résoudre en priorité absolue** :

#### Problèmes de synchronisation
- **Gestion des ex aequo** : Le classement ne gère pas correctement les égalités de points
- **États incohérents** : "En attente des autres joueurs" alors que tous ont répondu
- **Reconnexion défaillante** : Rafraîchir la page peut remettre au tour précédent ou manche suivante
- **Sortie de joueur** : La déconnexion d'un joueur fait crasher toute la partie

#### Problèmes d'interface critique
- **Mini-classement biaisé** : Top 3 défaillant dès le début, trop d'égalités à gérer
- **Lisibilité** : "Mauvaise réponse" en noir sur fond bleu (première manche) illisible
- **Feedback visuel confus** : Vert et rouge simultanés lors d'erreurs au lieu de vert pour la bonne, rouge pour la fausse
- **Mobile** : Clavier virtuel masque les champs de saisie (pseudo, PIN)

#### Problèmes UX majeurs
- **Dépendance au maître de jeu** : Bloque le flow si le créateur ne clique pas "Continuer"
- **Pas de timer** : Les parties peuvent traîner indéfiniment en attente des devineurs
- **Pas de continuité** : Impossible d'enchaîner les parties avec suivi des scores

### 1.3 Logique métier

#### Concepts principaux
1. **Game**: Partie avec PIN unique, joueurs, rounds, questions
2. **Player**: ID, username, points, statut (isRoundPlayer, hasAnswered)
3. **Round**: 4 types thématiques (Personnalité, Situations, Représentations, Relations)
4. **Question**: Liées aux rounds, avec 2-4 réponses possibles

#### Flux de jeu actuel (à revoir)
1. **Création**: Génération PIN → Premier joueur crée la partie
2. **Lobby**: Autres joueurs rejoignent avec le PIN
3. **Jeu**: 
   - Tour par tour, un joueur répond à une question
   - Les autres devinent sa réponse
   - Points attribués pour les bonnes réponses
   - ⚠️ **Problème** : Maître de jeu doit cliquer "Continuer"
4. **Fin**: Après 4 rounds, affichage des gagnants

#### Événements Socket.io
- `join-game`: Rejoindre une room
- `player-joined`: Notification nouveau joueur
- `game-started`: Début de partie
- `right-answer-submitted`: Le joueur actif a répondu
- `all-answered`: Tous ont deviné
- `next-turn`: Joueur suivant
- `round-ended`: Fin de manche
- `end-game`: Fin de partie

### 1.3 Composants UI

#### Écrans principaux
1. **HomePage**: Intro, règles, création/jointure de partie
2. **LoadingRoom**: Salle d'attente avec liste des joueurs
3. **Round**: Annonce du round et du joueur actif
4. **Question**: Interface de réponse/devinette
5. **TurnEnd**: Révélation des réponses et points
6. **RoundEnded**: Fin de manche avec classement

#### Design system actuel
- **Couleurs**: 4 thèmes par round (personality, situations, representations, relations)
- **Typographie**: Font "Belanosima"
- **Composants**: Boutons custom, inputs stylisés, popups
- **Responsive**: Support mobile basique
- **Animations**: Transitions CSS simples

## 2. UX/UI et parcours utilisateur

### 2.1 Customer Journey détaillé (NOUVEAU - corrigé selon retours)

```mermaid
graph TD
    A[Page d'accueil avec logo] --> B[Introduction corrigée]
    B --> C[Règles corrigées]
    C --> D{Choix action}
    D -->|Créer partie| E[Génération PIN]
    D -->|Rejoindre| F[Saisie PIN avec auto-scroll]
    E --> G[Saisie pseudo avec auto-scroll]
    F --> G
    G --> H[Salle d'attente avec logo]
    H --> I[Début partie automatique]
    I --> J[Annonce round avec logo]
    J --> K{Rôle joueur}
    K -->|Joueur actif| L[Répondre question avec timer]
    K -->|Autres| M[Attendre avec timer 30s]
    L --> N[Attendre devinettes]
    M --> O[Deviner avec timer 30s]
    N --> P[Révélation avec question rappelée]
    O --> P
    P --> Q[Affichage participants corrects/incorrects]
    Q --> R[Nouveau classement équilibré]
    R --> S{Dernier répondant?}
    S -->|Oui| T[Auto-continue vers tour suivant]
    S -->|Non| U{Fin round?}
    U -->|Non| K
    U -->|Oui| V{Fin partie?}
    V -->|Non| J
    V -->|Oui| W[Récap scores détaillé]
    W --> X{Continuer?}
    X -->|Oui| Y[Nouvelle partie avec historique]
    X -->|Non| Z[Fin session]
```

### 2.2 Écrans et interactions (NOUVELLES SPÉCIFICATIONS)

#### Page d'accueil (CORRIGÉE)
- **Logo Percept** visible en permanence
- **État 1**: Introduction avec nouveau texte (suppression des phrases demandées)
- **État 2**: Règles corrigées du jeu + déplacement "Pourquoi vous allez adorer"
- **État 3**: Choix créer/rejoindre partie
- **Mobile**: Auto-scroll pour éviter masquage par clavier virtuel
- **Favicon**: Logo ajouté dans toutes les pages

#### Salle d'attente (AMÉLIORÉE)
- Liste des joueurs connectés en temps réel
- Code PIN affiché en grand avec logo
- **NOUVEAU**: Pas de bouton "Commencer", démarrage automatique à 3 joueurs minimum
- Indicateur visuel du nombre de joueurs
- Gestion robuste des déconnexions

#### Écran de jeu (CORRIGÉ)
- Header: Round actuel, joueur actif, **nouveau système de classement**
- **NOUVEAU**: Mini-classement remplacé par compteur points/joueurs
- **NOUVEAU**: Option dépliage classement complet au clic
- Corps: Question et options de réponse
- **Mobile**: Auto-scroll automatique pour garder la question visible
- **Timer**: 30 secondes pour les devineurs après première réponse
- Footer: Statut avec meilleur feedback visuel

#### Révélation des réponses (AMÉLIORÉE)
- **NOUVEAU**: Question rappelée en haut des résultats
- **NOUVEAU**: Bonne réponse encadrée vert uniquement
- **NOUVEAU**: Mauvaise réponse du joueur encadrée rouge uniquement (plus de vert/rouge simultané)
- **NOUVEAU**: Affichage des participants qui ont eu juste/faux
- **CORRECTION**: Lisibilité "Mauvaise réponse" sur fond bleu
- Points gagnés animés
- **NOUVEAU**: Auto-continue par dernier répondant (plus de maître de jeu)

#### Nouvelle page récap scores
- **NOUVEAU**: Page attractive de fin de partie
- Classement final détaillé
- Statistiques individuelles
- Option pour rejouer avec continuité des scores
- Historique des questions posées (éviter répétitions)

### 2.3 Design system recommandé

#### Palette de couleurs
```css
:root {
  /* Couleurs principales */
  --primary: #6366F1;      /* Indigo moderne */
  --secondary: #EC4899;    /* Rose accent */
  --success: #10B981;      /* Vert validation */
  --error: #EF4444;        /* Rouge erreur */
  
  /* Thèmes par round */
  --personality: #8B5CF6;   /* Violet */
  --situations: #3B82F6;    /* Bleu */
  --representations: #F59E0B; /* Orange */
  --relations: #EF4444;     /* Rouge */
  
  /* Neutres */
  --background: #0F172A;    /* Fond sombre */
  --surface: #1E293B;       /* Cartes */
  --text: #F8FAFC;          /* Texte principal */
  --text-muted: #94A3B8;    /* Texte secondaire */
}
```

#### Composants UI modernes
- **Cards**: Ombres douces, bordures arrondies, glassmorphism
- **Boutons**: États hover/active, ripple effect
- **Inputs**: Labels flottants, validation en temps réel
- **Animations**: Framer Motion pour transitions fluides
- **Toasts**: Notifications non-intrusives
- **Modals**: Backdrop flou, animations d'entrée/sortie

## 3. Questions et contenu

### 3.1 Structure des questions

#### Format actuel
```typescript
interface Question {
  id: number;
  round_id: 1 | 2 | 3 | 4;
  name: string;
  answer_1: string | null;
  answer_2: string | null;
  answer_3: string | null;
  answer_4: string | null;
}
```

#### Catégories
1. **Personnalité**: Questions introspectives (amis, mensonges, etc.)
2. **Situations**: Réactions dans des contextes spécifiques
3. **Représentations**: Comment on se voit/est vu
4. **Relations**: Interactions avec les autres

### 3.2 Système de réponses
- **2-4 options** par question
- **Pas de bonne/mauvaise réponse** (subjectif)
- **Points**: 1 point par bonne devinette
- **Stratégie**: Être honnête vs prévisible

## 4. Architecture technique recommandée

### 4.1 Frontend - Next.js 14

#### Pourquoi Next.js?
- **App Router**: Routing moderne avec layouts imbriqués
- **Server Components**: Meilleure performance initiale
- **API Routes**: Backend intégré pour endpoints simples
- **Optimisations**: Images, fonts, bundling automatique
- **TypeScript**: Support natif excellent

#### Structure proposée
```
apps/web/
├── app/
│   ├── (marketing)/        # Pages publiques
│   │   ├── page.tsx       # Accueil
│   │   └── layout.tsx     # Layout marketing
│   ├── game/
│   │   ├── [pin]/         # Routes dynamiques
│   │   │   ├── lobby/
│   │   │   ├── play/
│   │   │   └── results/
│   │   └── layout.tsx     # Layout jeu
│   └── api/               # API routes
├── components/
│   ├── ui/                # Composants shadcn/ui
│   ├── game/              # Composants métier
│   └── shared/            # Composants partagés
├── lib/
│   ├── store.ts           # Zustand store
│   ├── socket.ts          # Client Socket.io
│   └── utils.ts           # Helpers
└── styles/
    └── globals.css        # Tailwind + custom
```

### 4.2 Spécifications techniques critiques (NOUVELLES)

#### Résolution des bugs de synchronisation
```typescript
// Nouveau système de gestion d'état robuste
interface GameState {
  // Gestion des égalités avec timestamp pour départage
  rankings: Array<{
    playerId: string;
    points: number;
    lastPointTimestamp: number; // Pour départager les ex aequo
    position: number;
  }>;
  
  // États de synchronisation
  currentPhase: 'waiting' | 'answering' | 'guessing' | 'revealing' | 'transitioning';
  playersReady: Set<string>;
  lastRepondent: string | null; // Pour auto-continue
  
  // Gestion de la continuité
  sessionHistory: {
    gamesPlayed: number;
    cumulativeScores: Map<string, number>;
    usedQuestions: Set<number>;
  };
  
  // Reconnexion
  playerConnections: Map<string, {
    socketId: string;
    lastSeen: number;
    isOnline: boolean;
  }>;
}

// Timer automatique pour devinettes
interface TimerSystem {
  phase: 'answering' | 'guessing';
  startTime: number;
  duration: number; // 30s pour guessing
  autoAdvance: boolean;
}
```

#### Gestion mobile avec auto-scroll
```typescript
// Hook personnalisé pour auto-scroll mobile
const useAutoScroll = () => {
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      
      // Détection mobile
      if (window.innerHeight < 600 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        setTimeout(() => {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
          
          // Ajustement pour clavier virtuel
          window.scrollBy(0, -100);
        }, 300);
      }
    };
    
    document.addEventListener('focusin', handleFocusIn);
    return () => document.removeEventListener('focusin', handleFocusIn);
  }, []);
};
```

#### Nouveau système de classement équilibré
```typescript
// Composant de classement intelligent
const SmartRanking = () => {
  const [expanded, setExpanded] = useState(false);
  
  // Logique de classement avec gestion ex aequo
  const calculateRankings = (players: Player[]) => {
    return players
      .sort((a, b) => {
        if (a.points !== b.points) return b.points - a.points;
        // Départage par timestamp du dernier point
        return a.lastPointTimestamp - b.lastPointTimestamp;
      })
      .map((player, index, arr) => ({
        ...player,
        position: index === 0 || arr[index-1].points !== player.points 
          ? index + 1 
          : arr[index-1].position
      }));
  };
  
  return (
    <div className="ranking-container">
      {/* Affichage compact par défaut */}
      <div className="ranking-summary">
        Points: {currentPlayer.points} | Position: {currentPlayer.position}
      </div>
      
      {/* Classement complet dépliable */}
      {expanded && (
        <div className="ranking-expanded">
          {/* Classement détaillé */}
        </div>
      )}
    </div>
  );
};
```

### 4.3 Backend - NestJS

#### Pourquoi NestJS?
- **Architecture modulaire**: Séparation des responsabilités
- **TypeScript first**: Type-safety totale
- **Decorators**: Code expressif et maintenable
- **Built-in WebSockets**: Support Socket.io natif
- **Scalabilité**: Prêt pour la croissance
- **Gestion robuste des déconnexions**: Essentiel pour les bugs identifiés

#### Spécifications WebSocket avancées

##### Gestion des connexions robuste
```typescript
// Gateway WebSocket avec gestion avancée des déconnexions
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(GameGateway.name);
  private connectionMap = new Map<string, ConnectionInfo>();
  
  async handleConnection(client: Socket) {
    try {
      // Validation du token/session
      const player = await this.validateConnection(client);
      
      // Enregistrement de la connexion
      this.connectionMap.set(client.id, {
        playerId: player.id,
        gameId: player.gameId,
        connectedAt: Date.now(),
        lastPing: Date.now(),
        isReconnection: false
      });
      
      // Tentative de reconnexion
      await this.handleReconnection(player, client);
      
      this.logger.log(`Player ${player.username} connected to game ${player.gameId}`);
    } catch (error) {
      this.logger.error('Connection failed:', error);
      client.disconnect(true);
    }
  }
  
  async handleDisconnect(client: Socket) {
    const connection = this.connectionMap.get(client.id);
    if (!connection) return;
    
    // Marquer comme déconnecté mais garder les données 2 minutes
    await this.handlePlayerDisconnection(connection);
    
    // Nettoyer après timeout
    setTimeout(async () => {
      await this.cleanupDisconnectedPlayer(connection);
    }, 120000); // 2 minutes
    
    this.connectionMap.delete(client.id);
  }
  
  private async handleReconnection(player: Player, client: Socket) {
    // Vérifier si le joueur était dans une partie
    const activeGame = await this.gameService.findActiveGameForPlayer(player.id);
    
    if (activeGame) {
      // Rejoindre la room
      await client.join(`game-${activeGame.id}`);
      
      // Restaurer l'état du jeu
      const gameState = await this.gameService.getGameState(activeGame.id);
      client.emit('game-state-restored', gameState);
      
      // Notifier les autres joueurs
      client.to(`game-${activeGame.id}`).emit('player-reconnected', {
        playerId: player.id,
        username: player.username
      });
    }
  }
  
  private async handlePlayerDisconnection(connection: ConnectionInfo) {
    const { gameId, playerId } = connection;
    
    // Marquer le joueur comme déconnecté
    await this.gameService.markPlayerDisconnected(playerId);
    
    // Notifier les autres joueurs
    this.server.to(`game-${gameId}`).emit('player-disconnected', {
      playerId,
      canReconnect: true,
      timeout: 120000
    });
    
    // Gérer l'impact sur le jeu en cours
    const game = await this.gameService.findById(gameId);
    if (game.status === 'IN_PROGRESS') {
      await this.adjustGameForDisconnection(game, playerId);
    }
  }
}

interface ConnectionInfo {
  playerId: string;
  gameId: string;
  connectedAt: number;
  lastPing: number;
  isReconnection: boolean;
}
```

##### Events Socket.io complets
```typescript
// Événements entrants (du client)
export const SOCKET_EVENTS_IN = {
  // Connexion et parties
  JOIN_GAME: 'join-game',
  CREATE_GAME: 'create-game',
  LEAVE_GAME: 'leave-game',
  
  // Gameplay
  SUBMIT_ANSWER: 'submit-answer',
  SUBMIT_GUESS: 'submit-guess',
  READY_FOR_NEXT: 'ready-for-next',
  
  // État
  REQUEST_GAME_STATE: 'request-game-state',
  PING: 'ping',
  
  // Social
  SEND_MESSAGE: 'send-message',
  SEND_REACTION: 'send-reaction'
} as const;

// Événements sortants (vers le client)
export const SOCKET_EVENTS_OUT = {
  // État du jeu
  GAME_STATE_UPDATE: 'game-state-update',
  GAME_STATE_RESTORED: 'game-state-restored',
  
  // Joueurs
  PLAYER_JOINED: 'player-joined',
  PLAYER_LEFT: 'player-left',
  PLAYER_DISCONNECTED: 'player-disconnected',
  PLAYER_RECONNECTED: 'player-reconnected',
  
  // Phases de jeu
  GAME_STARTED: 'game-started',
  ROUND_STARTED: 'round-started',
  QUESTION_ASKED: 'question-asked',
  ANSWER_SUBMITTED: 'answer-submitted',
  ALL_GUESSES_RECEIVED: 'all-guesses-received',
  RESULTS_REVEALED: 'results-revealed',
  ROUND_ENDED: 'round-ended',
  GAME_ENDED: 'game-ended',
  
  // Timer
  TIMER_STARTED: 'timer-started',
  TIMER_UPDATE: 'timer-update',
  TIMER_EXPIRED: 'timer-expired',
  
  // Erreurs
  ERROR: 'error',
  VALIDATION_ERROR: 'validation-error',
  
  // Social
  MESSAGE_RECEIVED: 'message-received',
  REACTION_RECEIVED: 'reaction-received',
  
  // Système
  PONG: 'pong'
} as const;
```

##### Système de heartbeat et health check
```typescript
@Injectable()
export class ConnectionHealthService {
  private readonly logger = new Logger(ConnectionHealthService.name);
  private healthChecks = new Map<string, NodeJS.Timer>();
  
  startHealthCheck(clientId: string, gameId: string) {
    const interval = setInterval(async () => {
      const connection = this.getConnection(clientId);
      
      if (!connection) {
        this.stopHealthCheck(clientId);
        return;
      }
      
      // Vérifier la dernière activité
      const timeSinceLastPing = Date.now() - connection.lastPing;
      
      if (timeSinceLastPing > 60000) { // 1 minute sans ping
        this.logger.warn(`Client ${clientId} seems inactive, initiating ping`);
        await this.pingClient(clientId);
      }
      
      if (timeSinceLastPing > 120000) { // 2 minutes sans réponse
        this.logger.error(`Client ${clientId} is unresponsive, disconnecting`);
        await this.forceDisconnect(clientId);
      }
    }, 30000); // Vérification toutes les 30s
    
    this.healthChecks.set(clientId, interval);
  }
  
  stopHealthCheck(clientId: string) {
    const interval = this.healthChecks.get(clientId);
    if (interval) {
      clearInterval(interval);
      this.healthChecks.delete(clientId);
    }
  }
  
  private async pingClient(clientId: string) {
    // Implémenter ping personnalisé avec timeout
  }
  
  private async forceDisconnect(clientId: string) {
    // Forcer la déconnexion du client non-responsif
  }
}
```

#### Structure proposée
```
apps/api/
├── src/
│   ├── games/
│   │   ├── games.module.ts
│   │   ├── games.service.ts
│   │   ├── games.controller.ts
│   │   └── entities/
│   ├── rooms/
│   │   ├── rooms.module.ts
│   │   ├── rooms.service.ts
│   │   └── rooms.gateway.ts    # WebSocket gateway
│   ├── questions/
│   │   ├── questions.module.ts
│   │   └── questions.service.ts
│   ├── players/
│   │   ├── players.module.ts
│   │   └── players.service.ts
│   └── common/
│       ├── guards/             # Auth guards
│       ├── interceptors/       # Logging, transform
│       └── pipes/              # Validation
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── test/
```

### 4.4 Base de données - PostgreSQL + Prisma

#### Schéma Prisma optimisé avec index de performance

```prisma
// Schéma complet avec optimisations pour performance et scalabilité
model Game {
  id            String    @id @default(cuid())
  pin           String    @unique @db.VarChar(6) // Optimisation: taille fixe
  status        GameStatus @default(WAITING)
  currentRound  Int       @default(0) @db.SmallInt
  currentTurn   Int       @default(0) @db.SmallInt
  maxPlayers    Int       @default(7) @db.SmallInt
  minPlayers    Int       @default(3) @db.SmallInt
  
  // Métadonnées temporelles
  createdAt     DateTime  @default(now())
  startedAt     DateTime?
  endedAt       DateTime?
  lastActivity  DateTime  @default(now()) // Pour nettoyage auto
  
  // Configuration du jeu
  config        Json?     // Paramètres: timers, règles spéciales
  
  // Relations
  players       Player[]
  rounds        GameRound[]
  gameEvents    GameEvent[]
  
  // Index de performance
  @@index([pin]) // Recherche par PIN
  @@index([status, lastActivity]) // Nettoyage des parties inactives
  @@index([createdAt]) // Analytics temporelles
  @@index([status, createdAt]) // Parties actives récentes
  
  @@map("games")
}

model Player {
  id               String    @id @default(cuid())
  username         String    @db.VarChar(50)
  points           Int       @default(0)
  position         Int?      // Classement actuel
  isCreator        Boolean   @default(false)
  isActive         Boolean   @default(true)
  
  // Connexion et session
  connectionId     String?   @db.VarChar(50) // Socket.io ID
  sessionId        String?   @db.VarChar(100)
  lastSeen         DateTime  @default(now())
  connectionStatus ConnectionStatus @default(CONNECTED)
  
  // Métadonnées de reconnexion
  disconnectedAt   DateTime?
  reconnectionAttempts Int   @default(0) @db.SmallInt
  
  // Statistiques de performance
  totalAnswerTime  Int       @default(0) // En millisecondes
  averageAnswerTime Float?   // Calculé automatiquement
  
  // Relations
  gameId           String
  game             Game      @relation(fields: [gameId], references: [id], onDelete: Cascade)
  answers          Answer[]
  gameEvents       GameEvent[]
  
  // Index de performance
  @@index([gameId, isActive]) // Joueurs actifs par partie
  @@index([gameId, connectionStatus]) // État des connexions
  @@index([connectionId]) // Recherche par socket ID
  @@unique([gameId, username]) // Unicité pseudo par partie
  
  @@map("players")
}

model Question {
  id            Int       @id @default(autoincrement())
  roundType     RoundType
  text          String    @db.Text
  options       Json      // Array of options (2-4 items)
  
  // Métadonnées de contenu
  difficulty    Difficulty @default(MEDIUM)
  tags          String[]  // Pour catégorisation
  isActive      Boolean   @default(true)
  
  // Statistiques d'usage
  timesUsed     Int       @default(0)
  averageResponseTime Float?
  popularityScore Float   @default(0.0)
  
  // Audit trail
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  createdBy     String?   @db.VarChar(50) // Admin qui a créé
  
  // Relations
  gameRounds    GameRound[]
  
  // Index de performance
  @@index([roundType, isActive]) // Questions par round actives
  @@index([popularityScore]) // Questions populaires
  @@index([timesUsed]) // Questions les plus utilisées
  @@index([isActive, roundType, id]) // Sélection aléatoire optimisée
  
  @@map("questions")
}

model GameRound {
  id            String    @id @default(cuid())
  roundNumber   Int       @db.SmallInt
  turnNumber    Int       @default(0) @db.SmallInt
  status        RoundStatus @default(PENDING)
  
  // Joueur actuel et ordre
  currentPlayerId String?
  playerOrder   String[]  // Array des IDs dans l'ordre
  
  // Timer et timing
  startedAt     DateTime?
  answerDeadline DateTime?
  guessDeadline DateTime?
  
  // Métadonnées de performance
  totalPlayers  Int       @db.SmallInt
  playersAnswered Int     @default(0) @db.SmallInt
  
  // Relations
  gameId        String
  game          Game      @relation(fields: [gameId], references: [id], onDelete: Cascade)
  questionId    Int
  question      Question  @relation(fields: [questionId], references: [id])
  answers       Answer[]
  
  // Index de performance
  @@index([gameId, roundNumber]) // Recherche rounds par partie
  @@index([status]) // Rounds par statut
  @@index([gameId, status]) // Rounds actifs par partie
  @@unique([gameId, roundNumber]) // Unicité round par partie
  
  @@map("game_rounds")
}

model Answer {
  id            String    @id @default(cuid())
  value         String    @db.VarChar(200)
  answerType    AnswerType
  isCorrect     Boolean?
  
  // Timing et performance
  answeredAt    DateTime  @default(now())
  responseTime  Int?      // Temps de réponse en ms
  
  // Métadonnées de validation
  wasGuessed    Boolean   @default(false)
  confidence    Float?    // Niveau de confiance (0-1)
  
  // Relations
  playerId      String
  player        Player    @relation(fields: [playerId], references: [id], onDelete: Cascade)
  roundId       String
  round         GameRound @relation(fields: [roundId], references: [id], onDelete: Cascade)
  
  // Index de performance
  @@index([roundId, answerType]) // Réponses par round et type
  @@index([playerId, answeredAt]) // Historique joueur
  @@index([roundId, isCorrect]) // Bonnes/mauvaises réponses
  @@unique([playerId, roundId, answerType]) // Une réponse par joueur/round/type
  
  @@map("answers")
}

// Nouveau: Audit trail et événements
model GameEvent {
  id          String    @id @default(cuid())
  eventType   EventType
  data        Json      // Payload flexible
  timestamp   DateTime  @default(now())
  
  // Relations optionnelles
  gameId      String?
  game        Game?     @relation(fields: [gameId], references: [id], onDelete: Cascade)
  playerId    String?
  player      Player?   @relation(fields: [playerId], references: [id], onDelete: Cascade)
  
  // Index pour analytics et debugging
  @@index([gameId, timestamp]) // Événements par partie chronologiques
  @@index([eventType, timestamp]) // Événements par type
  @@index([playerId, timestamp]) // Actions joueur
  
  @@map("game_events")
}

// Session et cache pour reconnexions
model PlayerSession {
  id          String    @id @default(cuid())
  playerId    String    @unique
  gameState   Json      // État sauvegardé pour reconnexion
  expiresAt   DateTime
  createdAt   DateTime  @default(now())
  
  @@index([expiresAt]) // Nettoyage automatique
  @@map("player_sessions")
}

// Enums étendus
enum GameStatus {
  WAITING
  IN_PROGRESS
  PAUSED
  FINISHED
  ABANDONED
}

enum RoundStatus {
  PENDING
  ANSWERING
  GUESSING
  REVEALING
  FINISHED
  SKIPPED
}

enum RoundType {
  PERSONALITY
  SITUATIONS
  REPRESENTATIONS
  RELATIONS
}

enum ConnectionStatus {
  CONNECTED
  DISCONNECTED
  RECONNECTING
  ABANDONED
}

enum AnswerType {
  MAIN_ANSWER    // Réponse du joueur actif
  GUESS          // Devinette des autres
}

enum EventType {
  GAME_CREATED
  PLAYER_JOINED
  PLAYER_LEFT
  PLAYER_DISCONNECTED
  PLAYER_RECONNECTED
  GAME_STARTED
  ROUND_STARTED
  ANSWER_SUBMITTED
  GUESS_SUBMITTED
  ROUND_COMPLETED
  GAME_COMPLETED
  ERROR_OCCURRED
  TIMEOUT_REACHED
}

enum Difficulty {
  EASY
  MEDIUM
  HARD
}
```

#### Scripts de migration et optimisation

```sql
-- Triggers pour mise à jour automatique des statistiques
CREATE OR REPLACE FUNCTION update_question_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE questions 
  SET 
    times_used = times_used + 1,
    popularity_score = popularity_score + 0.1
  WHERE id = NEW.question_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_question_stats
  AFTER INSERT ON game_rounds
  FOR EACH ROW
  EXECUTE FUNCTION update_question_stats();

-- Index partiels pour optimisation
CREATE INDEX CONCURRENTLY idx_games_active 
  ON games (created_at DESC) 
  WHERE status IN ('WAITING', 'IN_PROGRESS');

CREATE INDEX CONCURRENTLY idx_players_online
  ON players (game_id, last_seen DESC)
  WHERE connection_status = 'CONNECTED';

-- Vues matérialisées pour analytics
CREATE MATERIALIZED VIEW game_analytics AS
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as games_created,
  AVG(EXTRACT(EPOCH FROM (ended_at - started_at))/60) as avg_duration_minutes,
  COUNT(*) FILTER (WHERE status = 'FINISHED') as completed_games
FROM games
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

-- Refresh automatique toutes les heures
CREATE OR REPLACE FUNCTION refresh_game_analytics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW game_analytics;
END;
$$ LANGUAGE plpgsql;
```

### 4.5 État management - Zustand

#### Pourquoi Zustand?
- **Simplicité**: API minimaliste vs MobX
- **Performance**: Renders optimisés
- **TypeScript**: Inférence de types excellente
- **DevTools**: Support Redux DevTools
- **Taille**: ~8KB vs ~60KB MobX

#### Store proposé
```typescript
interface GameStore {
  // État
  game: Game | null;
  player: Player | null;
  connection: ConnectionStatus;
  
  // Actions synchrones
  setGame: (game: Game) => void;
  setPlayer: (player: Player) => void;
  updatePlayerPoints: (playerId: string, points: number) => void;
  
  // Actions asynchrones
  createGame: (username: string) => Promise<void>;
  joinGame: (pin: string, username: string) => Promise<void>;
  submitAnswer: (answer: string) => Promise<void>;
  
  // WebSocket handlers
  handlePlayerJoined: (player: Player) => void;
  handleRoundStarted: (round: GameRound) => void;
  handleAnswerRevealed: (answers: Answer[]) => void;
}
```

### 4.6 API REST complète

#### Architecture API avec NestJS

```typescript
// Structure modulaire des contrôleurs API
@Controller('api/v1')
@UseGuards(ValidationGuard, RateLimitGuard)
@UseInterceptors(LoggingInterceptor, TransformInterceptor)
export class ApiController {
  // Base health check
  @Get('health')
  @Public()
  getHealth(): HealthStatus {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '1.0.0'
    };
  }
}
```

#### Endpoints de gestion des parties

```typescript
@Controller('api/v1/games')
@UseGuards(SessionGuard)
export class GamesController {
  constructor(
    private readonly gamesService: GamesService,
    private readonly validationService: ValidationService
  ) {}

  // Création d'une partie
  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async createGame(
    @Body() createGameDto: CreateGameDto,
    @Req() req: AuthenticatedRequest
  ): Promise<GameResponse> {
    const game = await this.gamesService.create({
      ...createGameDto,
      creatorId: req.sessionId
    });
    
    return {
      success: true,
      data: {
        pin: game.pin,
        gameId: game.id,
        status: game.status,
        maxPlayers: game.maxPlayers,
        createdAt: game.createdAt
      }
    };
  }

  // Rejoindre une partie
  @Post(':pin/join')
  @UsePipes(new ValidationPipe({ transform: true }))
  async joinGame(
    @Param('pin') pin: string,
    @Body() joinGameDto: JoinGameDto,
    @Req() req: AuthenticatedRequest
  ): Promise<JoinGameResponse> {
    // Validation du PIN
    await this.validationService.validatePin(pin);
    
    // Validation du pseudo
    await this.validationService.validateUsername(
      pin, 
      joinGameDto.username
    );
    
    const result = await this.gamesService.joinGame(
      pin,
      joinGameDto.username,
      req.sessionId
    );
    
    return {
      success: true,
      data: {
        gameId: result.game.id,
        playerId: result.player.id,
        gameState: result.gameState,
        players: result.game.players
      }
    };
  }

  // État d'une partie
  @Get(':gameId/state')
  async getGameState(
    @Param('gameId') gameId: string,
    @Req() req: AuthenticatedRequest
  ): Promise<GameStateResponse> {
    const gameState = await this.gamesService.getGameState(
      gameId,
      req.playerId
    );
    
    return {
      success: true,
      data: gameState
    };
  }

  // Quitter une partie
  @Delete(':gameId/leave')
  async leaveGame(
    @Param('gameId') gameId: string,
    @Req() req: AuthenticatedRequest
  ): Promise<BaseResponse> {
    await this.gamesService.leaveGame(gameId, req.playerId);
    
    return {
      success: true,
      message: 'Successfully left the game'
    };
  }

  // Commencer une partie (créateur seulement)
  @Post(':gameId/start')
  @UseGuards(GameCreatorGuard)
  async startGame(
    @Param('gameId') gameId: string,
    @Req() req: AuthenticatedRequest
  ): Promise<BaseResponse> {
    await this.gamesService.startGame(gameId);
    
    return {
      success: true,
      message: 'Game started successfully'
    };
  }
}
```

#### Endpoints de gameplay

```typescript
@Controller('api/v1/gameplay')
@UseGuards(SessionGuard, GameParticipantGuard)
export class GameplayController {
  constructor(
    private readonly gameplayService: GameplayService,
    private readonly timerService: TimerService
  ) {}

  // Soumettre une réponse (joueur actif)
  @Post('games/:gameId/answer')
  @UseGuards(ActivePlayerGuard)
  async submitAnswer(
    @Param('gameId') gameId: string,
    @Body() answerDto: SubmitAnswerDto,
    @Req() req: AuthenticatedRequest
  ): Promise<AnswerResponse> {
    const result = await this.gameplayService.submitAnswer(
      gameId,
      req.playerId,
      answerDto.answer,
      answerDto.responseTime
    );
    
    // Démarrer le timer pour les devinettes
    await this.timerService.startGuessingTimer(gameId);
    
    return {
      success: true,
      data: {
        answerId: result.id,
        nextPhase: 'guessing',
        timerDuration: 30000
      }
    };
  }

  // Soumettre une devinette
  @Post('games/:gameId/guess')
  @UseGuards(NotActivePlayerGuard)
  async submitGuess(
    @Param('gameId') gameId: string,
    @Body() guessDto: SubmitGuessDto,
    @Req() req: AuthenticatedRequest
  ): Promise<GuessResponse> {
    const result = await this.gameplayService.submitGuess(
      gameId,
      req.playerId,
      guessDto.guess,
      guessDto.responseTime
    );
    
    return {
      success: true,
      data: {
        guessId: result.id,
        isLastGuess: result.isLastGuess,
        nextPhase: result.isLastGuess ? 'revealing' : 'waiting'
      }
    };
  }

  // Passer au tour suivant
  @Post('games/:gameId/next-turn')
  @UseGuards(LastRespondentGuard) // Nouveau: seul le dernier répondant peut continuer
  async nextTurn(
    @Param('gameId') gameId: string,
    @Req() req: AuthenticatedRequest
  ): Promise<NextTurnResponse> {
    const result = await this.gameplayService.advanceToNextTurn(gameId);
    
    return {
      success: true,
      data: {
        isRoundComplete: result.isRoundComplete,
        isGameComplete: result.isGameComplete,
        nextPlayer: result.nextPlayer,
        nextQuestion: result.nextQuestion
      }
    };
  }

  // Résultats du tour actuel
  @Get('games/:gameId/results')
  async getTurnResults(
    @Param('gameId') gameId: string,
    @Req() req: AuthenticatedRequest
  ): Promise<TurnResultsResponse> {
    const results = await this.gameplayService.getTurnResults(
      gameId,
      req.playerId
    );
    
    return {
      success: true,
      data: results
    };
  }
}
```

#### Endpoints d'administration

```typescript
@Controller('api/v1/admin')
@UseGuards(AdminGuard)
@UseInterceptors(AdminAuditInterceptor)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly questionsService: QuestionsService,
    private readonly analyticsService: AnalyticsService
  ) {}

  // CRUD Questions
  @Get('questions')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getQuestions(
    @Query() queryDto: GetQuestionsDto
  ): Promise<QuestionsResponse> {
    const { questions, total, page, limit } = await this.questionsService.findMany({
      roundType: queryDto.roundType,
      difficulty: queryDto.difficulty,
      isActive: queryDto.isActive,
      search: queryDto.search,
      page: queryDto.page || 1,
      limit: queryDto.limit || 20
    });
    
    return {
      success: true,
      data: questions,
      meta: { total, page, limit, pages: Math.ceil(total / limit) }
    };
  }

  @Post('questions')
  async createQuestion(
    @Body() createQuestionDto: CreateQuestionDto,
    @Req() req: AuthenticatedRequest
  ): Promise<QuestionResponse> {
    const question = await this.questionsService.create({
      ...createQuestionDto,
      createdBy: req.adminId
    });
    
    return {
      success: true,
      data: question
    };
  }

  @Put('questions/:id')
  async updateQuestion(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateQuestionDto: UpdateQuestionDto,
    @Req() req: AuthenticatedRequest
  ): Promise<QuestionResponse> {
    const question = await this.questionsService.update(id, {
      ...updateQuestionDto,
      updatedBy: req.adminId
    });
    
    return {
      success: true,
      data: question
    };
  }

  @Delete('questions/:id')
  async deleteQuestion(
    @Param('id', ParseIntPipe) id: number
  ): Promise<BaseResponse> {
    await this.questionsService.softDelete(id);
    
    return {
      success: true,
      message: 'Question deleted successfully'
    };
  }

  // Analytics
  @Get('analytics/overview')
  async getAnalyticsOverview(
    @Query() queryDto: AnalyticsQueryDto
  ): Promise<AnalyticsResponse> {
    const analytics = await this.analyticsService.getOverview({
      startDate: queryDto.startDate,
      endDate: queryDto.endDate,
      groupBy: queryDto.groupBy || 'day'
    });
    
    return {
      success: true,
      data: analytics
    };
  }

  // Gestion des parties
  @Get('games/active')
  async getActiveGames(): Promise<ActiveGamesResponse> {
    const games = await this.adminService.getActiveGames();
    
    return {
      success: true,
      data: games
    };
  }

  @Delete('games/:gameId')
  async terminateGame(
    @Param('gameId') gameId: string,
    @Body() terminateDto: TerminateGameDto
  ): Promise<BaseResponse> {
    await this.adminService.terminateGame(gameId, terminateDto.reason);
    
    return {
      success: true,
      message: 'Game terminated successfully'
    };
  }
}
```

#### DTOs et validation

```typescript
// DTOs pour validation automatique
export class CreateGameDto {
  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(7)
  maxPlayers?: number = 7;
  
  @IsOptional()
  @IsObject()
  config?: GameConfig;
}

export class JoinGameDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9\s\u00C0-\u017F]+$/, {
    message: 'Username can only contain letters, numbers and spaces'
  })
  username: string;
}

export class SubmitAnswerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  answer: string;
  
  @IsOptional()
  @IsInt()
  @Min(0)
  responseTime?: number;
}

export class SubmitGuessDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  guess: string;
  
  @IsOptional()
  @IsInt()
  @Min(0)
  responseTime?: number;
}

export class CreateQuestionDto {
  @IsEnum(RoundType)
  roundType: RoundType;
  
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  text: string;
  
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(4)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  options: string[];
  
  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;
  
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
```

#### Types de réponse standardisés

```typescript
// Types de réponse API standardisés
export interface BaseResponse {
  success: boolean;
  message?: string;
  timestamp?: string;
}

export interface DataResponse<T> extends BaseResponse {
  data: T;
}

export interface PaginatedResponse<T> extends DataResponse<T[]> {
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ErrorResponse extends BaseResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// Réponses spécifiques
export interface GameResponse extends DataResponse<{
  pin: string;
  gameId: string;
  status: GameStatus;
  maxPlayers: number;
  createdAt: string;
}> {}

export interface JoinGameResponse extends DataResponse<{
  gameId: string;
  playerId: string;
  gameState: GameState;
  players: Player[];
}> {}

export interface GameStateResponse extends DataResponse<GameState> {}

export interface AnswerResponse extends DataResponse<{
  answerId: string;
  nextPhase: string;
  timerDuration: number;
}> {}
```

#### Middleware et Guards

```typescript
// Guards personnalisés pour la sécurité
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private sessionService: SessionService) {}
  
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const sessionId = request.headers['x-session-id'] || request.session?.id;
    
    if (!sessionId) {
      throw new UnauthorizedException('Session required');
    }
    
    const session = await this.sessionService.validate(sessionId);
    if (!session) {
      throw new UnauthorizedException('Invalid session');
    }
    
    request.sessionId = sessionId;
    request.playerId = session.playerId;
    
    return true;
  }
}

@Injectable()
export class GameParticipantGuard implements CanActivate {
  constructor(private gamesService: GamesService) {}
  
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const gameId = request.params.gameId;
    const playerId = request.playerId;
    
    const isParticipant = await this.gamesService.isPlayerInGame(
      gameId, 
      playerId
    );
    
    if (!isParticipant) {
      throw new ForbiddenException('Not a participant in this game');
    }
    
    return true;
  }
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private redis: Redis) {}
  
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const key = `rate_limit:${request.ip}:${request.route.path}`;
    
    const current = await this.redis.incr(key);
    if (current === 1) {
      await this.redis.expire(key, 60); // 1 minute window
    }
    
    if (current > 30) { // 30 requests per minute
      throw new TooManyRequestsException('Rate limit exceeded');
    }
    
    return true;
  }
}
```

### 4.7 Architecture de sécurité renforcée

#### Stratégie de sécurité multi-niveaux

##### 1. Validation et assainissement des inputs

```typescript
// Validation avançée avec Joi et class-validator
@Injectable()
export class ValidationService {
  // Validation PIN avec prévention brute-force
  async validatePin(pin: string, ip: string): Promise<void> {
    // Vérifier format PIN
    if (!/^\d{6}$/.test(pin)) {
      throw new BadRequestException('Invalid PIN format');
    }
    
    // Vérifier tentatives par IP
    const attempts = await this.redis.get(`pin_attempts:${ip}`);
    if (parseInt(attempts || '0') > 5) {
      throw new TooManyRequestsException('Too many PIN attempts');
    }
    
    // Incrémenter compteur
    await this.redis.incr(`pin_attempts:${ip}`);
    await this.redis.expire(`pin_attempts:${ip}`, 300); // 5 minutes
  }
  
  // Validation pseudo avec sanitization
  async validateUsername(pin: string, username: string): Promise<void> {
    // Sanitization
    const sanitized = username.trim().replace(/[^a-zA-Z0-9\s\u00C0-\u017F]/g, '');
    
    if (sanitized.length < 2 || sanitized.length > 50) {
      throw new BadRequestException('Username must be 2-50 characters');
    }
    
    // Vérifier unicité dans la partie
    const exists = await this.gameService.isUsernameInUse(pin, sanitized);
    if (exists) {
      throw new ConflictException('Username already taken');
    }
    
    // Filtre de mots interdits
    const profanityWords = await this.getProfanityList();
    if (profanityWords.some(word => sanitized.toLowerCase().includes(word))) {
      throw new BadRequestException('Username contains inappropriate content');
    }
  }
  
  // Validation réponses avec limites strictes
  validateAnswer(answer: string): string {
    const sanitized = answer.trim().substring(0, 200);
    
    // Empêcher injection de code
    const dangerous = /<script|javascript:|data:|vbscript:/i;
    if (dangerous.test(sanitized)) {
      throw new BadRequestException('Invalid answer content');
    }
    
    return sanitized;
  }
}
```

##### 2. Protection contre les attaques

```typescript
// Protection DDoS et limitation de débit
@Injectable()
export class SecurityService {
  private readonly rateLimiters = new Map<string, any>();
  
  // Rate limiting intelligent par endpoint
  async checkRateLimit(
    ip: string, 
    endpoint: string, 
    customLimit?: { requests: number; window: number }
  ): Promise<void> {
    const limits = {
      'create-game': { requests: 5, window: 300 }, // 5 parties/5min
      'join-game': { requests: 10, window: 60 },   // 10 tentatives/min
      'submit-answer': { requests: 100, window: 60 }, // Normal gameplay
      'default': { requests: 30, window: 60 }
    };
    
    const limit = customLimit || limits[endpoint] || limits.default;
    const key = `rate_limit:${ip}:${endpoint}`;
    
    const current = await this.redis.get(key);
    if (!current) {
      await this.redis.setex(key, limit.window, '1');
      return;
    }
    
    if (parseInt(current) >= limit.requests) {
      // Logger l'attaque potentielle
      this.logger.warn(`Rate limit exceeded for ${ip} on ${endpoint}`);
      throw new TooManyRequestsException(
        `Rate limit exceeded. Try again in ${limit.window} seconds.`
      );
    }
    
    await this.redis.incr(key);
  }
  
  // Détection d'activité suspecte
  async detectSuspiciousActivity(ip: string, patterns: ActivityPattern[]): Promise<void> {
    const suspiciousPatterns = [
      'rapid_game_creation', // Création rapide de parties
      'username_enumeration', // Test de pseudos
      'pin_bruteforce', // Force-brute PIN
      'automated_requests' // Requêtes automatisées
    ];
    
    for (const pattern of patterns) {
      if (suspiciousPatterns.includes(pattern.type)) {
        await this.quarantineIP(ip, pattern.severity);
      }
    }
  }
  
  // Quarantine IP suspecte
  private async quarantineIP(ip: string, severity: 'low' | 'medium' | 'high') {
    const durations = {
      low: 300,    // 5 minutes
      medium: 1800, // 30 minutes
      high: 3600   // 1 heure
    };
    
    await this.redis.setex(`quarantine:${ip}`, durations[severity], severity);
    this.logger.warn(`IP ${ip} quarantined for ${severity} threat`);
  }
}
```

##### 3. Authentification et sessions sécurisées

```typescript
// Gestion de sessions sécurisée
@Injectable()
export class SessionService {
  constructor(
    private readonly redis: Redis,
    private readonly crypto: CryptoService
  ) {}
  
  // Création de session sécurisée
  async createSession(gameId: string, playerId: string, ip: string): Promise<string> {
    const sessionId = this.crypto.generateSecureToken(32);
    const sessionData = {
      gameId,
      playerId,
      ip,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      isValid: true
    };
    
    // Stockage sécurisé avec expiration
    await this.redis.setex(
      `session:${sessionId}`,
      3600, // 1 heure
      JSON.stringify(sessionData)
    );
    
    // Index par joueur pour nettoyage
    await this.redis.sadd(`player_sessions:${playerId}`, sessionId);
    
    return sessionId;
  }
  
  // Validation de session avec rotation
  async validateSession(sessionId: string, ip: string): Promise<SessionData | null> {
    const data = await this.redis.get(`session:${sessionId}`);
    if (!data) return null;
    
    const session: SessionData = JSON.parse(data);
    
    // Vérifier IP (protection contre vol de session)
    if (session.ip !== ip) {
      await this.invalidateSession(sessionId);
      this.logger.warn(`Session hijacking attempt: ${sessionId} from ${ip}`);
      return null;
    }
    
    // Vérifier expiration d'inactivité
    if (Date.now() - session.lastActivity > 1800000) { // 30 min inactivité
      await this.invalidateSession(sessionId);
      return null;
    }
    
    // Mise à jour activité
    session.lastActivity = Date.now();
    await this.redis.setex(
      `session:${sessionId}`,
      3600,
      JSON.stringify(session)
    );
    
    return session;
  }
  
  // Rotation de session (sécurité renforcée)
  async rotateSession(oldSessionId: string): Promise<string> {
    const sessionData = await this.validateSession(oldSessionId, '');
    if (!sessionData) throw new UnauthorizedException();
    
    const newSessionId = await this.createSession(
      sessionData.gameId,
      sessionData.playerId,
      sessionData.ip
    );
    
    await this.invalidateSession(oldSessionId);
    return newSessionId;
  }
}
```

##### 4. Chiffrement et protection des données

```typescript
// Service de chiffrement
@Injectable()
export class CryptoService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyDerivation = 'pbkdf2';
  
  // Chiffrement des données sensibles
  encryptSensitiveData(data: string, password?: string): EncryptedData {
    const key = password ? 
      this.deriveKey(password) : 
      Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, key);
    cipher.setAAD(Buffer.from('epercept-game', 'utf8'));
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }
  
  // Génération de tokens sécurisés
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
  
  // Hachage sécurisé pour mots de passe admin
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }
  
  // Vérification de mot de passe
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
  
  // Dérivation de clé sécurisée
  private deriveKey(password: string): Buffer {
    const salt = Buffer.from(process.env.KEY_SALT!, 'hex');
    return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');
  }
}
```

##### 5. Audit et logging de sécurité

```typescript
// Service d'audit sécurité
@Injectable()
export class SecurityAuditService {
  private readonly logger = new Logger(SecurityAuditService.name);
  
  // Audit des actions sensibles
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    const auditLog = {
      timestamp: new Date().toISOString(),
      eventType: event.type,
      severity: event.severity,
      ip: event.ip,
      userAgent: event.userAgent,
      sessionId: event.sessionId,
      details: event.details,
      risk_score: this.calculateRiskScore(event)
    };
    
    // Log structuré pour analyse
    this.logger.warn('SECURITY_EVENT', auditLog);
    
    // Stockage pour investigation
    await this.redis.lpush(
      'security_events',
      JSON.stringify(auditLog)
    );
    
    // Alerte si événement critique
    if (event.severity === 'critical') {
      await this.triggerSecurityAlert(auditLog);
    }
  }
  
  // Calcul de score de risque
  private calculateRiskScore(event: SecurityEvent): number {
    let score = 0;
    
    // Facteurs de risque
    const riskFactors = {
      'multiple_failed_attempts': 30,
      'suspicious_ip': 50,
      'rate_limit_exceeded': 40,
      'invalid_session': 60,
      'brute_force_detected': 80,
      'injection_attempt': 90
    };
    
    if (event.details.factors) {
      event.details.factors.forEach((factor: string) => {
        score += riskFactors[factor] || 10;
      });
    }
    
    return Math.min(score, 100);
  }
  
  // Alertes de sécurité
  private async triggerSecurityAlert(auditLog: any): Promise<void> {
    // Notification admin (email, Slack, etc.)
    await this.notificationService.sendSecurityAlert(auditLog);
    
    // Auto-réponse si nécessaire
    if (auditLog.risk_score > 80) {
      await this.initiateEmergencyResponse(auditLog);
    }
  }
}
```

##### 6. Protection OWASP Top 10

```typescript
// Middleware de sécurité global
@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    // 1. Protection XSS
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // 2. CSP (Content Security Policy)
    res.setHeader('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data:; " +
      "connect-src 'self' wss: ws:;"
    );
    
    // 3. HSTS
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 
        'max-age=31536000; includeSubDomains');
    }
    
    // 4. Protection clickjacking
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    
    // 5. Masquage de la technologie
    res.removeHeader('X-Powered-By');
    res.setHeader('Server', 'Epercept');
    
    next();
  }
}

// Configuration Helmet.js complète
export const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "wss:", "ws:"],
      imgSrc: ["'self'", "data:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false // Pour compatibilité WebSocket
};
```

### 4.8 Infrastructure et déploiement

#### Services recommandés

**Frontend (Vercel)**
- Déploiement automatique depuis GitHub
- Edge Functions pour API routes
- Analytics intégrés
- SSL automatique
- **Coût**: Gratuit pour commencer, $20/mois Pro

**Backend (Railway)**
- PostgreSQL + Redis inclus
- Déploiement depuis GitHub
- Logs et métriques
- Scaling automatique
- **Coût**: ~$5-10/mois pour commencer

**Alternatives économiques**
- **Fly.io**: $0-5/mois, excellent pour WebSockets
- **Render**: Free tier généreux, wake up lent
- **Supabase**: PostgreSQL + Realtime gratuit

#### Configuration CI/CD
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run lint
      - run: npm run type-check

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: railwayapp/deploy-action@v1
        with:
          service: api
          token: ${{ secrets.RAILWAY_TOKEN }}
```

## 5. Nouvelles règles de jeu et logique métier

### 5.1 Flow de jeu corrigé (NOUVEAU)

#### Suppression du maître de jeu
- **Ancien système** : Le créateur doit cliquer "Continuer" à chaque étape
- **Nouveau système** : Auto-progression basée sur le dernier répondant
- **Logique** : Celui qui répond en dernier déclenche automatiquement la suite
- **Avantage** : Plus de blocage si le créateur est absent

#### Timer automatique (30 secondes)
```typescript
// Système de timer intelligent
interface GameTimer {
  phase: 'answering' | 'guessing';
  duration: 30000; // 30s en ms
  startTrigger: 'first_answer_submitted' | 'round_start';
  autoAdvance: boolean;
  
  // Gestion des retardataires
  onTimeout: () => {
    // Passage automatique à la phase suivante
    // Les joueurs n'ayant pas répondu sont marqués comme "pas de réponse"
  };
}
```

#### Continuité inter-parties
- **Session persistante** : Garder les scores cumulés entre parties
- **Historique questions** : Éviter les répétitions dans la même session
- **Statistiques** : Qui gagne le plus, questions préférées, etc.

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
  
  // Auto-nettoyage
  maxInactiveTime: 5 * 60 * 1000; // 5 minutes
}

// Quand un joueur se déconnecte :
// 1. Marquer comme "déconnecté" mais garder sa place 2 minutes
// 2. Si reconnexion : restaurer son état exact
// 3. Si pas de reconnexion : continuer sans lui mais ne pas crasher
// 4. Redistribuer ses questions aux autres joueurs
```

### 5.2 Nouvelle logique d'affichage

#### Système de feedback visuel amélioré
- **Bonne réponse** : Encadré vert uniquement sur la bonne option
- **Mauvaise réponse** : Encadré rouge uniquement sur la réponse du joueur
- **Plus de confusion** : Fini le vert+rouge simultané
- **Lisibilité** : Contraste corrigé sur tous les fonds de round

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
  totalQuestions: number;
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

## 6. Plan de migration détaillé

### Phase 0: Correction bugs critiques (2-3 jours) - PRIORITÉ ABSOLUE

#### Jour 1: Bugs de synchronisation
- [ ] **Corriger gestion ex aequo** : Implémenter système de classement avec timestamp
- [ ] **Résoudre états bloquants** : Revoir logique "En attente des autres joueurs"
- [ ] **Gestion reconnexion** : Système de récupération d'état après refresh
- [ ] **Robustesse déconnexions** : Éviter crash complet lors des sorties

#### Jour 2: Corrections UX critiques
- [ ] **Supprimer dépendance maître de jeu** : Auto-continue par dernier répondant
- [ ] **Implémenter timer 30s** : Pour phase de devinette
- [ ] **Corriger feedback visuel** : Vert pour bon, rouge pour mauvais (séparément)
- [ ] **Résoudre lisibilité** : Contraste texte sur fonds colorés

#### Jour 3: Mobile et continuité
- [ ] **Auto-scroll mobile** : Gestion clavier virtuel
- [ ] **Système continuité** : Session avec historique questions + scores cumulés
- [ ] **Logo partout** : Ajout logo + favicon sur toutes les pages
- [ ] **Corriger textes** : Appliquer modifications demandées du fondateur

### Phase 1: Foundation technique (3-5 jours)

#### Jour 4-5: Setup initial
- [ ] Créer monorepo avec Turborepo
- [ ] Initialiser Next.js 14 avec TypeScript strict
- [ ] Configurer Tailwind CSS + shadcn/ui avec corrections design
- [ ] Setup ESLint, Prettier, Husky
- [ ] Créer structure de dossiers avec nouvelles spécifications

#### Jour 6-7: Backend foundation
- [ ] Initialiser NestJS avec modules de base
- [ ] Configurer Prisma + PostgreSQL
- [ ] Créer schéma avec nouvelles spécifications (rankings, timers, sessions)
- [ ] Setup Redis pour cache/sessions + reconnexion
- [ ] Implémenter health checks et monitoring déconnexions

#### Jour 8: Types et validation
- [ ] Migrer interfaces TypeScript avec nouveaux types (GameState, TimerSystem)
- [ ] Créer schemas Zod partagés
- [ ] Setup validation pipes NestJS
- [ ] Documenter API avec Swagger

### Phase 2: Core Features (5-7 jours)

#### Jour 6-7: Game logic
- [ ] Implémenter service Games
- [ ] Créer endpoints CRUD
- [ ] Logique de création/jointure
- [ ] Gestion des rounds
- [ ] Tests unitaires

#### Jour 8-9: Realtime
- [ ] Setup Socket.io gateway
- [ ] Implémenter rooms
- [ ] Events handlers
- [ ] Reconnection logic
- [ ] Tests d'intégration

#### Jour 10-11: Frontend base
- [ ] Créer layouts Next.js
- [ ] Implémenter store Zustand
- [ ] Socket.io client hooks
- [ ] Composants UI de base
- [ ] Routing et navigation

#### Jour 12: Integration
- [ ] Connecter frontend/backend
- [ ] Tester flux complet
- [ ] Gérer erreurs edge cases
- [ ] Optimiser performances

### Phase 3: UI/UX Polish (3-4 jours)

#### Jour 13-14: Composants game
- [ ] Écran lobby avec animations
- [ ] Interface de jeu responsive
- [ ] Révélation réponses smooth
- [ ] Classements animés
- [ ] Transitions entre états

#### Jour 15: Mobile optimization
- [ ] Touch gestures
- [ ] Viewport management
- [ ] Clavier virtuel handling
- [ ] PWA configuration
- [ ] Tests sur devices

#### Jour 16: Finishing touches
- [ ] Loading states
- [ ] Error boundaries
- [ ] Toasts notifications
- [ ] Sound effects
- [ ] Animations finales

### Phase 4: Advanced Features (3-4 jours)

#### Jour 17: Persistence
- [ ] Historique des parties
- [ ] Statistiques joueurs
- [ ] Rejoin après déconnexion
- [ ] Export résultats

#### Jour 18: Social
- [ ] Chat in-game
- [ ] Reactions/emojis
- [ ] Mode spectateur
- [ ] Invitations par lien

#### Jour 19: Admin
- [ ] Dashboard analytics
- [ ] Gestion questions
- [ ] Modération
- [ ] Monitoring

#### Jour 20: Launch prep
- [ ] Tests E2E complets
- [ ] Documentation
- [ ] Setup monitoring
- [ ] Déploiement production

## 6. Stratégie de tests complète

### 6.1 Architecture de tests

#### Pyramide de tests pour Epercept

```
                    /\
                   /  \
                  / E2E \
                 /______\
                /        \
               /Integration\
              /__________\
             /            \
            /    Unit      \
           /______________\

   70% Unit | 20% Integration | 10% E2E
```

#### Configuration de base

```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
    '!src/main.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.{ts,tsx}',
    '<rootDir>/test/**/*.test.{ts,tsx}'
  ],
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts']
};
```

### 6.2 Tests unitaires

#### Services métier

```typescript
// test/unit/game.service.test.ts
describe('GameService', () => {
  let gameService: GameService;
  let mockPrisma: jest.Mocked<PrismaService>;
  let mockRedis: jest.Mocked<Redis>;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GameService,
        {
          provide: PrismaService,
          useValue: createMockPrisma()
        },
        {
          provide: 'REDIS_CLIENT',
          useValue: createMockRedis()
        }
      ]
    }).compile();
    
    gameService = module.get(GameService);
    mockPrisma = module.get(PrismaService);
    mockRedis = module.get('REDIS_CLIENT');
  });
  
  describe('createGame', () => {
    it('should create a game with unique PIN', async () => {
      // Arrange
      const createGameDto = { maxPlayers: 5 };
      const expectedGame = {
        id: 'game-1',
        pin: '123456',
        status: GameStatus.WAITING,
        createdAt: new Date()
      };
      
      mockPrisma.game.create.mockResolvedValue(expectedGame as any);
      
      // Act
      const result = await gameService.create(createGameDto, 'creator-id');
      
      // Assert
      expect(result).toEqual(expectedGame);
      expect(mockPrisma.game.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          pin: expect.stringMatching(/^\d{6}$/),
          maxPlayers: 5,
          status: GameStatus.WAITING
        })
      });
    });
    
    it('should retry PIN generation if collision occurs', async () => {
      // Test collision handling
      mockPrisma.game.create
        .mockRejectedValueOnce(new Error('Unique constraint violated'))
        .mockResolvedValueOnce({ id: 'game-1', pin: '654321' } as any);
      
      const result = await gameService.create({}, 'creator-id');
      
      expect(mockPrisma.game.create).toHaveBeenCalledTimes(2);
      expect(result.pin).toMatch(/^\d{6}$/);
    });
  });
  
  describe('joinGame', () => {
    it('should allow player to join existing game', async () => {
      // Arrange
      const pin = '123456';
      const username = 'TestPlayer';
      const existingGame = {
        id: 'game-1',
        pin,
        status: GameStatus.WAITING,
        players: [],
        maxPlayers: 7
      };
      
      mockPrisma.game.findUnique.mockResolvedValue(existingGame as any);
      mockPrisma.player.create.mockResolvedValue({
        id: 'player-1',
        username,
        gameId: 'game-1'
      } as any);
      
      // Act
      const result = await gameService.joinGame(pin, username, 'session-1');
      
      // Assert
      expect(result.player.username).toBe(username);
      expect(mockPrisma.player.create).toHaveBeenCalledWith({
        data: {
          username,
          gameId: 'game-1',
          sessionId: 'session-1'
        }
      });
    });
    
    it('should reject if game is full', async () => {
      // Test game full scenario
      const fullGame = {
        id: 'game-1',
        maxPlayers: 2,
        players: [{ id: 'p1' }, { id: 'p2' }]
      };
      
      mockPrisma.game.findUnique.mockResolvedValue(fullGame as any);
      
      await expect(
        gameService.joinGame('123456', 'NewPlayer', 'session-1')
      ).rejects.toThrow('Game is full');
    });
  });
});
```

#### Contrôleurs API

```typescript
// test/unit/games.controller.test.ts
describe('GamesController', () => {
  let controller: GamesController;
  let gameService: jest.Mocked<GamesService>;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [GamesController],
      providers: [
        {
          provide: GamesService,
          useValue: {
            create: jest.fn(),
            joinGame: jest.fn(),
            getGameState: jest.fn()
          }
        }
      ]
    }).compile();
    
    controller = module.get(GamesController);
    gameService = module.get(GamesService);
  });
  
  describe('createGame', () => {
    it('should create game and return response', async () => {
      // Arrange
      const createDto = { maxPlayers: 5 };
      const mockGame = {
        id: 'game-1',
        pin: '123456',
        status: GameStatus.WAITING,
        createdAt: new Date()
      };
      
      gameService.create.mockResolvedValue(mockGame as any);
      
      const mockRequest = {
        sessionId: 'session-1'
      } as AuthenticatedRequest;
      
      // Act
      const result = await controller.createGame(createDto, mockRequest);
      
      // Assert
      expect(result).toEqual({
        success: true,
        data: {
          pin: '123456',
          gameId: 'game-1',
          status: GameStatus.WAITING,
          maxPlayers: 7,
          createdAt: mockGame.createdAt
        }
      });
    });
  });
});
```

### 6.3 Tests d'intégration

#### Tests base de données

```typescript
// test/integration/game.integration.test.ts
describe('Game Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  
  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();
    
    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get(PrismaService);
    
    await app.init();
  });
  
  beforeEach(async () => {
    // Nettoyer la base de test
    await prisma.answer.deleteMany();
    await prisma.gameRound.deleteMany();
    await prisma.player.deleteMany();
    await prisma.game.deleteMany();
  });
  
  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });
  
  describe('Game Flow', () => {
    it('should complete full game workflow', async () => {
      // 1. Créer une partie
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/games')
        .send({ maxPlayers: 4 })
        .expect(201);
      
      const { pin, gameId } = createResponse.body.data;
      
      // 2. Ajouter des joueurs
      const players = [];
      for (let i = 1; i <= 4; i++) {
        const joinResponse = await request(app.getHttpServer())
          .post(`/api/v1/games/${pin}/join`)
          .send({ username: `Player${i}` })
          .expect(201);
        
        players.push(joinResponse.body.data);
      }
      
      // 3. Démarrer la partie
      await request(app.getHttpServer())
        .post(`/api/v1/games/${gameId}/start`)
        .set('x-session-id', players[0].sessionId)
        .expect(200);
      
      // 4. Vérifier l'état
      const stateResponse = await request(app.getHttpServer())
        .get(`/api/v1/games/${gameId}/state`)
        .set('x-session-id', players[0].sessionId)
        .expect(200);
      
      expect(stateResponse.body.data.status).toBe('IN_PROGRESS');
      expect(stateResponse.body.data.currentRound).toBe(1);
    });
  });
});
```

#### Tests WebSocket

```typescript
// test/integration/websocket.integration.test.ts
describe('WebSocket Integration', () => {
  let app: INestApplication;
  let clients: SocketIOClient.Socket[];
  
  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();
    
    app = moduleFixture.createNestApplication();
    await app.init();
    await app.listen(0);
  });
  
  beforeEach(() => {
    clients = [];
  });
  
  afterEach(() => {
    clients.forEach(client => client.disconnect());
  });
  
  afterAll(async () => {
    await app.close();
  });
  
  it('should handle real-time game events', async () => {
    // Créer des clients WebSocket
    const client1 = SocketIOClient(`http://localhost:${app.getHttpServer().address().port}`);
    const client2 = SocketIOClient(`http://localhost:${app.getHttpServer().address().port}`);
    clients.push(client1, client2);
    
    // Attendre connexion
    await Promise.all([
      new Promise(resolve => client1.on('connect', resolve)),
      new Promise(resolve => client2.on('connect', resolve))
    ]);
    
    // Test du flow temps réel
    const gameEvents: any[] = [];
    
    client1.on('player-joined', (data) => gameEvents.push({ type: 'player-joined', data }));
    client2.on('player-joined', (data) => gameEvents.push({ type: 'player-joined', data }));
    
    // Simuler jointure
    client1.emit('join-game', { pin: '123456', username: 'Player1' });
    client2.emit('join-game', { pin: '123456', username: 'Player2' });
    
    // Attendre les événements
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(gameEvents).toHaveLength(2);
    expect(gameEvents[0].data.username).toBe('Player1');
  });
});
```

### 6.4 Tests End-to-End (E2E)

#### Tests Playwright

```typescript
// test/e2e/game-flow.e2e.test.ts
import { test, expect, Page } from '@playwright/test';

test.describe('Complete Game Flow', () => {
  test('should allow multiple players to complete a full game', async ({ browser }) => {
    // Créer plusieurs pages pour simuler différents joueurs
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const context3 = await browser.newContext();
    
    const player1 = await context1.newPage();
    const player2 = await context2.newPage();
    const player3 = await context3.newPage();
    
    try {
      // Joueur 1 crée une partie
      await player1.goto('/');
      await player1.click('[data-testid="create-game-btn"]');
      await player1.fill('[data-testid="username-input"]', 'Alice');
      await player1.click('[data-testid="start-game-btn"]');
      
      // Récupérer le PIN
      const pinElement = await player1.locator('[data-testid="game-pin"]');
      const pin = await pinElement.textContent();
      
      // Joueurs 2 et 3 rejoignent
      await Promise.all([
        joinGame(player2, pin!, 'Bob'),
        joinGame(player3, pin!, 'Charlie')
      ]);
      
      // Vérifier que tous les joueurs sont dans le lobby
      await expect(player1.locator('[data-testid="player-list"]')).toContainText('Alice');
      await expect(player1.locator('[data-testid="player-list"]')).toContainText('Bob');
      await expect(player1.locator '[data-testid="player-list"]')).toContainText('Charlie');
      
      // Démarrage automatique de la partie
      await expect(player1.locator('[data-testid="game-status"]')).toContainText('Partie en cours');
      
      // Premier tour - Alice répond
      await expect(player1.locator('[data-testid="question-text"]')).toBeVisible();
      await player1.click('[data-testid="answer-option-1"]');
      await player1.click('[data-testid="submit-answer-btn"]');
      
      // Bob et Charlie devinent
      await Promise.all([
        submitGuess(player2, 1),
        submitGuess(player3, 1)
      ]);
      
      // Vérifier résultats
      await expect(player1.locator('[data-testid="results-section"]')).toBeVisible();
      await expect(player1.locator('[data-testid="correct-answer"]')).toBeVisible();
      
      // Continuer jusqu'au bout (test raccourci)
      // En vrai on testerait tous les rounds
      
    } finally {
      await context1.close();
      await context2.close();
      await context3.close();
    }
  });
  
  test('should handle disconnection and reconnection', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Démarrer une partie
    await startGame(page, 'TestPlayer');
    
    // Simuler déconnexion (fermer la page)
    await page.close();
    
    // Recréer la page (simule refresh/reconnexion)
    const newPage = await context.newPage();
    await newPage.goto('/');
    
    // Vérifier que l'état est restauré
    await expect(newPage.locator('[data-testid="reconnection-message"]')).toBeVisible();
    await expect(newPage.locator('[data-testid="game-state"]')).toContainText('En cours');
    
    await context.close();
  });
});

// Helpers
async function joinGame(page: Page, pin: string, username: string) {
  await page.goto('/');
  await page.fill('[data-testid="pin-input"]', pin);
  await page.fill('[data-testid="username-input"]', username);
  await page.click('[data-testid="join-game-btn"]');
}

async function submitGuess(page: Page, optionIndex: number) {
  await page.waitForSelector('[data-testid="guess-options"]');
  await page.click(`[data-testid="guess-option-${optionIndex}"]`);
  await page.click('[data-testid="submit-guess-btn"]');
}
```

### 6.5 Tests de performance

#### Tests de charge

```typescript
// test/performance/load.test.ts
import { check } from 'k6';
import { SocketIO } from 'k6/net/socketio';
import http from 'k6/http';

export let options = {
  stages: [
    { duration: '30s', target: 50 },   // Montée en charge
    { duration: '2m', target: 100 },   // Maintien
    { duration: '30s', target: 0 },    // Descente
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% des requêtes < 500ms
    http_req_failed: ['rate<0.1'],    // Moins de 10% d'échecs
  }
};

export default function() {
  // Test création de partie
  const createResponse = http.post(`${__ENV.API_URL}/api/v1/games`, {
    maxPlayers: 4
  });
  
  check(createResponse, {
    'game created': (r) => r.status === 201,
    'response time OK': (r) => r.timings.duration < 500
  });
  
  if (createResponse.status === 201) {
    const gameData = JSON.parse(createResponse.body);
    const pin = gameData.data.pin;
    
    // Test jointure multiple
    for (let i = 1; i <= 3; i++) {
      const joinResponse = http.post(`${__ENV.API_URL}/api/v1/games/${pin}/join`, {
        username: `LoadTestPlayer${i}_${__VU}_${__ITER}`
      });
      
      check(joinResponse, {
        'player joined': (r) => r.status === 201
      });
    }
  }
}

// Test WebSocket sous charge
export function wsTest() {
  const socket = new SocketIO(`${__ENV.WS_URL}`);
  
  socket.on('connect', () => {
    socket.emit('join-game', {
      pin: '123456',
      username: `WSUser_${__VU}`
    });
  });
  
  socket.on('player-joined', (data) => {
    check(data, {
      'valid player data': (d) => d.username !== undefined
    });
  });
  
  // Maintenir connexion 30s
  sleep(30);
  socket.close();
}
```

### 6.6 Tests de sécurité

```typescript
// test/security/security.test.ts
describe('Security Tests', () => {
  let app: INestApplication;
  
  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();
    
    app = moduleFixture.createNestApplication();
    await app.init();
  });
  
  afterAll(async () => {
    await app.close();
  });
  
  describe('Input Validation', () => {
    it('should reject SQL injection attempts', async () => {
      const maliciousInputs = [
        "'; DROP TABLE games; --",
        "1' OR '1'='1",
        "<script>alert('xss')</script>"
      ];
      
      for (const input of maliciousInputs) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/games/123456/join')
          .send({ username: input })
          .expect(400);
        
        expect(response.body.message).toContain('Invalid');
      }
    });
  });
  
  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const requests = [];
      
      // Envoyer 50 requêtes rapidement
      for (let i = 0; i < 50; i++) {
        requests.push(
          request(app.getHttpServer())
            .post('/api/v1/games')
            .send({ maxPlayers: 4 })
        );
      }
      
      const responses = await Promise.all(requests);
      const rejectedCount = responses.filter(r => r.status === 429).length;
      
      expect(rejectedCount).toBeGreaterThan(0);
    });
  });
});
```

### 6.7 Outils et configuration CI/CD

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:coverage
      
      - uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
  
  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npx prisma migrate deploy
      - run: npm run test:integration
  
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e
      
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-screenshots
          path: test-results/
```

## 7. Monitoring et observabilité avancée

### 7.1 Architecture d'observabilité

#### Stack de monitoring recommandée

```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   Application   │  │   Monitoring    │  │    Alerting     │
│                 │  │                 │  │                 │
│ • Logs          │─▶│ • Grafana       │─▶│ • PagerDuty     │
│ • Métriques      │  │ • Prometheus    │  │ • Slack         │
│ • Traces        │  │ • Jaeger        │  │ • Email         │
│ • Events        │  │ • ELK Stack     │  │ • SMS           │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### 7.2 Logging structuré

#### Configuration Winston avancée

```typescript
// src/common/logging/logger.service.ts
import { Injectable, LoggerService } from '@nestjs/common';
import { createLogger, format, transports } from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

@Injectable()
export class CustomLoggerService implements LoggerService {
  private logger: winston.Logger;
  
  constructor() {
    this.logger = createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json(),
        format.printf(({ timestamp, level, message, context, trace, ...meta }) => {
          return JSON.stringify({
            '@timestamp': timestamp,
            level,
            message,
            context,
            trace,
            service: 'epercept-api',
            version: process.env.APP_VERSION || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            ...meta
          });
        })
      ),
      transports: [
        // Console pour développement
        new transports.Console({
          format: process.env.NODE_ENV === 'development' 
            ? format.combine(format.colorize(), format.simple())
            : format.json()
        }),
        
        // Fichiers pour production
        new transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5
        }),
        
        new transports.File({
          filename: 'logs/combined.log',
          maxsize: 5242880,
          maxFiles: 5
        })
      ]
    });
    
    // Elasticsearch en production
    if (process.env.NODE_ENV === 'production' && process.env.ELASTICSEARCH_URL) {
      this.logger.add(new ElasticsearchTransport({
        level: 'info',
        clientOpts: {
          node: process.env.ELASTICSEARCH_URL,
          auth: {
            username: process.env.ELASTICSEARCH_USER!,
            password: process.env.ELASTICSEARCH_PASSWORD!
          }
        },
        index: 'epercept-logs'
      }));
    }
  }
  
  // Méthodes de logging avec contexte enrichi
  log(message: string, context?: string, meta?: any) {
    this.logger.info(message, { context, ...meta });
  }
  
  error(message: string, trace?: string, context?: string, meta?: any) {
    this.logger.error(message, { context, trace, ...meta });
  }
  
  warn(message: string, context?: string, meta?: any) {
    this.logger.warn(message, { context, ...meta });
  }
  
  debug(message: string, context?: string, meta?: any) {
    this.logger.debug(message, { context, ...meta });
  }
  
  // Logging spécialisé pour le gaming
  logGameEvent(event: GameEvent, gameId: string, playerId?: string) {
    this.logger.info('GAME_EVENT', {
      context: 'GameEventLogger',
      eventType: event.type,
      gameId,
      playerId,
      timestamp: event.timestamp,
      data: event.data,
      tags: ['game', 'event', event.type]
    });
  }
  
  logPerformanceMetric(metric: PerformanceMetric) {
    this.logger.info('PERFORMANCE_METRIC', {
      context: 'PerformanceLogger',
      metricName: metric.name,
      value: metric.value,
      unit: metric.unit,
      tags: metric.tags,
      timestamp: metric.timestamp
    });
  }
  
  logSecurityEvent(event: SecurityEvent) {
    this.logger.warn('SECURITY_EVENT', {
      context: 'SecurityLogger',
      eventType: event.type,
      severity: event.severity,
      ip: event.ip,
      userAgent: event.userAgent,
      details: event.details,
      timestamp: event.timestamp,
      tags: ['security', event.type, event.severity]
    });
  }
}
```

#### Intercepteur de logging automatique

```typescript
// src/common/interceptors/logging.interceptor.ts
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: CustomLoggerService) {}
  
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, body, query, params, ip, headers } = request;
    const userAgent = headers['user-agent'] || 'Unknown';
    const startTime = Date.now();
    
    // Log requête entrante
    const requestId = this.generateRequestId();
    request.requestId = requestId;
    
    this.logger.log('HTTP_REQUEST', 'LoggingInterceptor', {
      requestId,
      method,
      url,
      ip,
      userAgent,
      body: this.sanitizeBody(body),
      query,
      params,
      timestamp: new Date().toISOString()
    });
    
    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        
        // Log réponse réussie
        this.logger.log('HTTP_RESPONSE', 'LoggingInterceptor', {
          requestId,
          method,
          url,
          statusCode: response.statusCode,
          duration,
          dataSize: JSON.stringify(data).length,
          timestamp: new Date().toISOString()
        });
        
        // Métrique de performance
        this.logger.logPerformanceMetric({
          name: 'http_request_duration',
          value: duration,
          unit: 'ms',
          tags: {
            method,
            endpoint: url,
            status: response.statusCode.toString()
          },
          timestamp: Date.now()
        });
      }),
      catchError((error) => {
        const duration = Date.now() - startTime;
        
        // Log erreur
        this.logger.error('HTTP_ERROR', error.stack, 'LoggingInterceptor', {
          requestId,
          method,
          url,
          error: error.message,
          statusCode: error.status || 500,
          duration,
          timestamp: new Date().toISOString()
        });
        
        throw error;
      })
    );
  }
  
  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
  
  private sanitizeBody(body: any): any {
    if (!body) return body;
    
    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    const sanitized = { ...body };
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });
    
    return sanitized;
  }
}
```

### 7.3 Métriques et instrumentation

#### Service de métriques Prometheus

```typescript
// src/common/metrics/metrics.service.ts
import { Injectable } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly register: client.Registry;
  
  // Métriques business
  private readonly gamesCreatedCounter: client.Counter<string>;
  private readonly playersJoinedCounter: client.Counter<string>;
  private readonly gamesCompletedCounter: client.Counter<string>;
  private readonly activeGamesGauge: client.Gauge<string>;
  private readonly activePlayersGauge: client.Gauge<string>;
  
  // Métriques techniques
  private readonly httpRequestDuration: client.Histogram<string>;
  private readonly websocketConnections: client.Gauge<string>;
  private readonly databaseQueryDuration: client.Histogram<string>;
  private readonly redisOperationDuration: client.Histogram<string>;
  
  // Métriques de gameplay
  private readonly averageGameDuration: client.Histogram<string>;
  private readonly questionsAskedCounter: client.Counter<string>;
  private readonly answersSubmittedCounter: client.Counter<string>;
  private readonly disconnectionCounter: client.Counter<string>;
  
  constructor() {
    this.register = new client.Registry();
    
    // Métriques par défaut
    client.collectDefaultMetrics({ register: this.register });
    
    // Métriques business
    this.gamesCreatedCounter = new client.Counter({
      name: 'epercept_games_created_total',
      help: 'Total number of games created',
      labelNames: ['status'] // success, failed
    });
    
    this.playersJoinedCounter = new client.Counter({
      name: 'epercept_players_joined_total',
      help: 'Total number of players who joined games',
      labelNames: ['game_size'] // 3, 4, 5, 6, 7 players
    });
    
    this.activeGamesGauge = new client.Gauge({
      name: 'epercept_active_games',
      help: 'Number of currently active games',
      labelNames: ['status'] // waiting, in_progress
    });
    
    this.activePlayersGauge = new client.Gauge({
      name: 'epercept_active_players',
      help: 'Number of currently active players'
    });
    
    // Métriques techniques
    this.httpRequestDuration = new client.Histogram({
      name: 'epercept_http_request_duration_seconds',
      help: 'Duration of HTTP requests in seconds',
      labelNames: ['method', 'endpoint', 'status_code'],
      buckets: [0.1, 0.5, 1, 2, 5, 10]
    });
    
    this.websocketConnections = new client.Gauge({
      name: 'epercept_websocket_connections',
      help: 'Number of active WebSocket connections'
    });
    
    this.databaseQueryDuration = new client.Histogram({
      name: 'epercept_database_query_duration_seconds',
      help: 'Duration of database queries in seconds',
      labelNames: ['operation', 'table'],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2]
    });
    
    // Métriques de gameplay
    this.averageGameDuration = new client.Histogram({
      name: 'epercept_game_duration_minutes',
      help: 'Duration of completed games in minutes',
      labelNames: ['player_count'],
      buckets: [5, 10, 15, 20, 30, 45, 60]
    });
    
    this.questionsAskedCounter = new client.Counter({
      name: 'epercept_questions_asked_total',
      help: 'Total number of questions asked',
      labelNames: ['round_type'] // personality, situations, etc.
    });
    
    this.disconnectionCounter = new client.Counter({
      name: 'epercept_disconnections_total',
      help: 'Total number of player disconnections',
      labelNames: ['reason'] // timeout, voluntary, error
    });
    
    // Enregistrer toutes les métriques
    this.register.registerMetric(this.gamesCreatedCounter);
    this.register.registerMetric(this.playersJoinedCounter);
    this.register.registerMetric(this.activeGamesGauge);
    this.register.registerMetric(this.activePlayersGauge);
    this.register.registerMetric(this.httpRequestDuration);
    this.register.registerMetric(this.websocketConnections);
    this.register.registerMetric(this.databaseQueryDuration);
    this.register.registerMetric(this.averageGameDuration);
    this.register.registerMetric(this.questionsAskedCounter);
    this.register.registerMetric(this.disconnectionCounter);
  }
  
  // Méthodes d'instrumentation
  recordGameCreated(success: boolean) {
    this.gamesCreatedCounter.inc({ status: success ? 'success' : 'failed' });
  }
  
  recordPlayerJoined(gameSize: number) {
    this.playersJoinedCounter.inc({ game_size: gameSize.toString() });
  }
  
  updateActiveGames(waiting: number, inProgress: number) {
    this.activeGamesGauge.set({ status: 'waiting' }, waiting);
    this.activeGamesGauge.set({ status: 'in_progress' }, inProgress);
  }
  
  updateActivePlayersCount(count: number) {
    this.activePlayersGauge.set(count);
  }
  
  recordHttpRequest(method: string, endpoint: string, statusCode: number, duration: number) {
    this.httpRequestDuration.observe(
      { method, endpoint, status_code: statusCode.toString() },
      duration / 1000 // Convertir en secondes
    );
  }
  
  updateWebSocketConnections(count: number) {
    this.websocketConnections.set(count);
  }
  
  recordDatabaseQuery(operation: string, table: string, duration: number) {
    this.databaseQueryDuration.observe(
      { operation, table },
      duration / 1000
    );
  }
  
  recordGameCompleted(durationMinutes: number, playerCount: number) {
    this.averageGameDuration.observe(
      { player_count: playerCount.toString() },
      durationMinutes
    );
  }
  
  recordQuestionAsked(roundType: string) {
    this.questionsAskedCounter.inc({ round_type: roundType });
  }
  
  recordDisconnection(reason: string) {
    this.disconnectionCounter.inc({ reason });
  }
  
  // Endpoint pour Prometheus
  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }
}
```

#### Contrôleur de métriques

```typescript
// src/monitoring/metrics.controller.ts
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}
  
  @Get()
  @Public() // Accessible sans authentification pour Prometheus
  async getMetrics(): Promise<string> {
    return this.metricsService.getMetrics();
  }
  
  @Get('health')
  @Public()
  getHealth(): HealthCheckResult {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.APP_VERSION || '1.0.0'
    };
  }
  
  @Get('ready')
  @Public()
  async getReadiness(): Promise<ReadinessCheck> {
    // Vérifier les dépendances critiques
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkExternalAPIs()
    ]);
    
    const results = checks.map((check, index) => ({
      name: ['database', 'redis', 'external'][index],
      status: check.status === 'fulfilled' ? 'ok' : 'error',
      message: check.status === 'rejected' ? check.reason.message : 'OK'
    }));
    
    const overallStatus = results.every(r => r.status === 'ok') ? 'ready' : 'not_ready';
    
    return {
      status: overallStatus,
      checks: results,
      timestamp: new Date().toISOString()
    };
  }
}
```

### 7.4 Tracing distribué

#### Configuration Jaeger

```typescript
// src/common/tracing/tracing.service.ts
import { Injectable } from '@nestjs/common';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

@Injectable()
export class TracingService {
  private sdk: NodeSDK;
  
  constructor() {
    const jaegerExporter = new JaegerExporter({
      endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces'
    });
    
    this.sdk = new NodeSDK({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: 'epercept-api',
        [SemanticResourceAttributes.SERVICE_VERSION]: process.env.APP_VERSION || '1.0.0',
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development'
      }),
      traceExporter: jaegerExporter,
      instrumentations: [
        // Auto-instrumentation pour les frameworks courants
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-fs': {
            enabled: false // Peut être trop verbeux
          }
        })
      ]
    });
  }
  
  start() {
    this.sdk.start();
    console.log('Tracing initialized');
  }
  
  stop() {
    this.sdk.shutdown();
  }
}
```

### 7.5 Alerting intelligent

#### Service d'alertes

```typescript
// src/monitoring/alerting.service.ts
@Injectable()
export class AlertingService {
  constructor(
    private readonly logger: CustomLoggerService,
    private readonly notificationService: NotificationService
  ) {}
  
  // Seuils d'alerte configurés
  private readonly thresholds = {
    errorRate: 0.05, // 5% d'erreurs maximum
    responseTime: 2000, // 2s maximum
    activeGames: 1000, // Plus de 1000 parties simultanées
    disconnectionRate: 0.1, // 10% de déconnexions maximum
    memoryUsage: 0.8, // 80% de la mémoire maximum
    cpuUsage: 0.8 // 80% du CPU maximum
  };
  
  // Vérifications périodiques
  @Cron('*/5 * * * *') // Toutes les 5 minutes
  async checkSystemHealth() {
    const metrics = await this.gatherMetrics();
    
    // Vérifier chaque seuil
    const alerts = [];
    
    if (metrics.errorRate > this.thresholds.errorRate) {
      alerts.push({
        level: 'critical',
        message: `Error rate too high: ${(metrics.errorRate * 100).toFixed(2)}%`,
        metric: 'error_rate',
        value: metrics.errorRate,
        threshold: this.thresholds.errorRate
      });
    }
    
    if (metrics.avgResponseTime > this.thresholds.responseTime) {
      alerts.push({
        level: 'warning',
        message: `Response time too high: ${metrics.avgResponseTime}ms`,
        metric: 'response_time',
        value: metrics.avgResponseTime,
        threshold: this.thresholds.responseTime
      });
    }
    
    if (metrics.memoryUsage > this.thresholds.memoryUsage) {
      alerts.push({
        level: 'critical',
        message: `Memory usage too high: ${(metrics.memoryUsage * 100).toFixed(2)}%`,
        metric: 'memory_usage',
        value: metrics.memoryUsage,
        threshold: this.thresholds.memoryUsage
      });
    }
    
    // Envoyer les alertes
    for (const alert of alerts) {
      await this.sendAlert(alert);
    }
  }
  
  // Alerte immédiate pour événements critiques
  async sendImmediateAlert(event: CriticalEvent) {
    const alert = {
      level: 'critical',
      message: event.message,
      details: event.details,
      timestamp: new Date().toISOString(),
      source: 'immediate_event'
    };
    
    await this.sendAlert(alert);
  }
  
  private async sendAlert(alert: Alert) {
    // Logger l'alerte
    this.logger.error('SYSTEM_ALERT', undefined, 'AlertingService', alert);
    
    // Envoyer selon le niveau de criticité
    switch (alert.level) {
      case 'critical':
        await Promise.all([
          this.notificationService.sendSlackAlert(alert),
          this.notificationService.sendEmailAlert(alert),
          this.notificationService.sendPagerDutyAlert(alert)
        ]);
        break;
        
      case 'warning':
        await this.notificationService.sendSlackAlert(alert);
        break;
        
      case 'info':
        // Juste logger
        break;
    }
  }
  
  private async gatherMetrics(): Promise<SystemMetrics> {
    // Implémentation de collecte de métriques
    return {
      errorRate: await this.calculateErrorRate(),
      avgResponseTime: await this.calculateAvgResponseTime(),
      activeGames: await this.countActiveGames(),
      memoryUsage: process.memoryUsage().heapUsed / process.memoryUsage().heapTotal,
      cpuUsage: await this.getCpuUsage()
    };
  }
}
```

### 7.6 Dashboards Grafana

#### Configuration dashboard principal

```json
{
  "dashboard": {
    "title": "Epercept - Vue d'ensemble",
    "panels": [
      {
        "title": "Parties actives",
        "type": "stat",
        "targets": [{
          "expr": "epercept_active_games",
          "legendFormat": "{{status}}"
        }]
      },
      {
        "title": "Joueurs connectés",
        "type": "stat",
        "targets": [{
          "expr": "epercept_active_players"
        }]
      },
      {
        "title": "Taux d'erreur HTTP",
        "type": "stat",
        "targets": [{
          "expr": "rate(epercept_http_requests_total{status_code=~'5..'}[5m]) / rate(epercept_http_requests_total[5m]) * 100"
        }]
      },
      {
        "title": "Temps de réponse HTTP",
        "type": "graph",
        "targets": [{
          "expr": "histogram_quantile(0.95, rate(epercept_http_request_duration_seconds_bucket[5m]))",
          "legendFormat": "95th percentile"
        }]
      },
      {
        "title": "Connexions WebSocket",
        "type": "graph",
        "targets": [{
          "expr": "epercept_websocket_connections"
        }]
      },
      {
        "title": "Questions posées par type",
        "type": "piechart",
        "targets": [{
          "expr": "increase(epercept_questions_asked_total[1h])",
          "legendFormat": "{{round_type}}"
        }]
      }
    ]
  }
}
```

## 8. Plan de migration des données existantes

### 8.1 Analyse de l'existant

#### Évaluation des données actuelles

```typescript
// Analyse de la structure actuelle
interface CurrentDataStructure {
  // Données en mémoire uniquement (server/constantes.ts)
  questions: {
    id: number;
    round_id: 1 | 2 | 3 | 4;
    name: string;
    answer_1: string | null;
    answer_2: string | null;
    answer_3: string | null;
    answer_4: string | null;
  }[];
  
  // Données de session volatiles
  games: Map<string, GameSession>; // PIN -> GameSession
  players: Map<string, PlayerSession>; // Socket ID -> PlayerSession
  
  // Aucune persistance
  // Aucun historique
  // Aucune analytics
}

// Nouvelle structure cible
interface TargetDataStructure {
  // Base de données persistante
  postgresql: {
    games: GameTable[];
    players: PlayerTable[];
    questions: QuestionTable[];
    game_rounds: GameRoundTable[];
    answers: AnswerTable[];
    game_events: GameEventTable[];
  };
  
  // Cache en mémoire
  redis: {
    active_games: GameState[];
    player_sessions: PlayerSession[];
    rate_limits: RateLimitData[];
    analytics_cache: AnalyticsData[];
  };
}
```

### 8.2 Stratégie de migration progressive

#### Phase 1: Migration des questions (0 downtime)

```typescript
// Script de migration des questions
// scripts/migrate-questions.ts
import { PrismaClient } from '@prisma/client';
import { questions } from '../server/constantes';

class QuestionMigrationService {
  private prisma = new PrismaClient();
  
  async migrateQuestions() {
    console.log('Starting question migration...');
    
    try {
      // 1. Backup des données existantes
      await this.backupCurrentQuestions();
      
      // 2. Transformation des données
      const transformedQuestions = await this.transformQuestions();
      
      // 3. Validation des données
      await this.validateQuestions(transformedQuestions);
      
      // 4. Insertion en base
      await this.insertQuestions(transformedQuestions);
      
      // 5. Vérification post-migration
      await this.verifyMigration();
      
      console.log('Question migration completed successfully');
    } catch (error) {
      console.error('Migration failed:', error);
      await this.rollbackMigration();
      throw error;
    }
  }
  
  private async transformQuestions() {
    return questions.map(q => ({
      id: q.id,
      roundType: this.mapRoundType(q.round_id),
      text: q.name,
      options: this.extractOptions(q),
      difficulty: this.inferDifficulty(q),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  }
  
  private mapRoundType(roundId: number): string {
    const mapping = {
      1: 'PERSONALITY',
      2: 'SITUATIONS', 
      3: 'REPRESENTATIONS',
      4: 'RELATIONS'
    };
    return mapping[roundId];
  }
  
  private extractOptions(question: any): string[] {
    const options = [];
    if (question.answer_1) options.push(question.answer_1);
    if (question.answer_2) options.push(question.answer_2);
    if (question.answer_3) options.push(question.answer_3);
    if (question.answer_4) options.push(question.answer_4);
    return options;
  }
  
  private async backupCurrentQuestions() {
    const fs = require('fs');
    const backup = {
      timestamp: new Date().toISOString(),
      questions: questions,
      count: questions.length
    };
    
    fs.writeFileSync(
      `./backups/questions-backup-${Date.now()}.json`,
      JSON.stringify(backup, null, 2)
    );
  }
  
  private async insertQuestions(questions: any[]) {
    // Insertion par batch pour performance
    const batchSize = 50;
    
    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize);
      
      await this.prisma.question.createMany({
        data: batch,
        skipDuplicates: true
      });
      
      console.log(`Migrated ${Math.min(i + batchSize, questions.length)}/${questions.length} questions`);
    }
  }
}
```

#### Phase 2: Mise en place de la double écriture

```typescript
// Service de transition permettant double écriture
@Injectable()
export class TransitionGameService {
  constructor(
    private readonly legacyGameService: LegacyGameService,
    private readonly newGameService: NewGameService,
    private readonly logger: Logger
  ) {}
  
  async createGame(data: CreateGameDto): Promise<Game> {
    let legacyGame, newGame;
    
    try {
      // 1. Créer dans l'ancien système (référence)
      legacyGame = await this.legacyGameService.create(data);
      
      // 2. Créer dans le nouveau système
      newGame = await this.newGameService.create({
        ...data,
        pin: legacyGame.pin // Réutiliser le même PIN
      });
      
      // 3. Vérifier cohérence
      await this.validateConsistency(legacyGame, newGame);
      
      // 4. Retourner le nouveau format
      return newGame;
      
    } catch (error) {
      this.logger.error('Transition service error', error.stack);
      
      // Rollback si nécessaire
      if (newGame) {
        await this.newGameService.delete(newGame.id).catch(() => {});
      }
      if (legacyGame) {
        await this.legacyGameService.delete(legacyGame.id).catch(() => {});
      }
      
      throw error;
    }
  }
  
  async joinGame(pin: string, username: string): Promise<JoinGameResult> {
    // Mode lecture depuis nouveau système, écriture double
    const game = await this.newGameService.findByPin(pin);
    if (!game) {
      throw new NotFoundException('Game not found');
    }
    
    // Ajouter joueur dans les deux systèmes
    const [legacyResult, newResult] = await Promise.all([
      this.legacyGameService.joinGame(pin, username),
      this.newGameService.joinGame(pin, username)
    ]);
    
    // Vérifier cohérence
    await this.validatePlayerConsistency(legacyResult.player, newResult.player);
    
    return newResult;
  }
}
```

#### Phase 3: Migration progressive des parties actives

```typescript
// Service de migration en direct
@Injectable()
export class LiveMigrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: Redis,
    private readonly logger: Logger
  ) {}
  
  // Migrer les parties actives durant les périodes creuses
  @Cron('0 3 * * *') // 3h du matin
  async migrateActiveGames() {
    this.logger.log('Starting live game migration...');
    
    const activeGames = await this.getActiveGamesFromMemory();
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const game of activeGames) {
      try {
        await this.migrateGame(game);
        migratedCount++;
      } catch (error) {
        this.logger.error(`Failed to migrate game ${game.pin}`, error.stack);
        errorCount++;
      }
    }
    
    this.logger.log(`Migration complete: ${migratedCount} succeeded, ${errorCount} failed`);
  }
  
  private async migrateGame(legacyGame: LegacyGame) {
    const transaction = await this.prisma.$transaction(async (tx) => {
      // 1. Créer la partie
      const game = await tx.game.create({
        data: {
          pin: legacyGame.pin,
          status: this.mapGameStatus(legacyGame.status),
          currentRound: legacyGame.currentRound,
          maxPlayers: legacyGame.maxPlayers,
          createdAt: legacyGame.createdAt,
          startedAt: legacyGame.startedAt
        }
      });
      
      // 2. Migrer les joueurs
      for (const legacyPlayer of legacyGame.players) {
        await tx.player.create({
          data: {
            username: legacyPlayer.username,
            points: legacyPlayer.points,
            isCreator: legacyPlayer.isCreator,
            gameId: game.id,
            connectionStatus: this.mapConnectionStatus(legacyPlayer.connected)
          }
        });
      }
      
      // 3. Migrer l'historique des rounds si disponible
      if (legacyGame.roundHistory) {
        for (const round of legacyGame.roundHistory) {
          const gameRound = await tx.gameRound.create({
            data: {
              roundNumber: round.number,
              status: 'FINISHED',
              gameId: game.id,
              questionId: round.questionId
            }
          });
          
          // Migrer les réponses si disponibles
          for (const answer of round.answers || []) {
            await tx.answer.create({
              data: {
                value: answer.value,
                isCorrect: answer.isCorrect,
                answeredAt: answer.timestamp,
                playerId: answer.playerId, // Nécessite mapping
                roundId: gameRound.id
              }
            });
          }
        }
      }
      
      return game;
    });
    
    // 4. Mettre à jour le cache Redis
    await this.updateRedisCache(transaction);
    
    this.logger.log(`Successfully migrated game ${legacyGame.pin}`);
  }
}
```

### 8.3 Outils de migration et validation

#### Validation de cohérence

```typescript
// Outils de validation post-migration
export class MigrationValidator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly legacyService: LegacyGameService
  ) {}
  
  async validateQuestionsMigration(): Promise<ValidationReport> {
    const report: ValidationReport = {
      success: true,
      errors: [],
      warnings: [],
      stats: {
        totalExpected: 0,
        totalMigrated: 0,
        duplicates: 0,
        missing: []
      }
    };
    
    try {
      // 1. Compter les questions originales
      const originalQuestions = require('../server/constantes').questions;
      report.stats.totalExpected = originalQuestions.length;
      
      // 2. Compter les questions migrées
      const migratedCount = await this.prisma.question.count();
      report.stats.totalMigrated = migratedCount;
      
      // 3. Vérifier l'intégrité des données
      for (const original of originalQuestions) {
        const migrated = await this.prisma.question.findUnique({
          where: { id: original.id }
        });
        
        if (!migrated) {
          report.errors.push(`Question ${original.id} not found in new system`);
          report.stats.missing.push(original.id);
          continue;
        }
        
        // Vérifier la correspondance des données
        const validationErrors = this.validateQuestionData(original, migrated);
        report.errors.push(...validationErrors);
      }
      
      // 4. Vérifier les doublons
      const duplicateCheck = await this.prisma.$queryRaw`
        SELECT text, COUNT(*) as count 
        FROM questions 
        GROUP BY text 
        HAVING COUNT(*) > 1
      `;
      
      report.stats.duplicates = (duplicateCheck as any[]).length;
      
      if (report.errors.length === 0 && report.stats.duplicates === 0) {
        console.log('✓ Questions migration validation passed');
      } else {
        report.success = false;
        console.error('✗ Questions migration validation failed');
      }
      
    } catch (error) {
      report.success = false;
      report.errors.push(`Validation error: ${error.message}`);
    }
    
    return report;
  }
  
  private validateQuestionData(original: any, migrated: any): string[] {
    const errors = [];
    
    if (original.name !== migrated.text) {
      errors.push(`Question ${original.id}: text mismatch`);
    }
    
    const originalOptions = this.extractOptions(original);
    if (JSON.stringify(originalOptions) !== JSON.stringify(migrated.options)) {
      errors.push(`Question ${original.id}: options mismatch`);
    }
    
    return errors;
  }
}
```

#### Scripts de rollback

```typescript
// scripts/rollback-migration.ts
export class MigrationRollback {
  constructor(private readonly prisma: PrismaService) {}
  
  async rollbackToBackup(backupTimestamp: string) {
    console.log(`Rolling back to backup: ${backupTimestamp}`);
    
    try {
      // 1. Charger le backup
      const backup = this.loadBackup(backupTimestamp);
      
      // 2. Sauvegarder l'état actuel avant rollback
      await this.createEmergencyBackup();
      
      // 3. Nettoyer les données migrées
      await this.cleanMigratedData();
      
      // 4. Restaurer depuis le backup
      await this.restoreFromBackup(backup);
      
      // 5. Vérifier l'intégrité
      await this.validateRollback();
      
      console.log('✓ Rollback completed successfully');
      
    } catch (error) {
      console.error('✗ Rollback failed:', error);
      throw error;
    }
  }
  
  private async cleanMigratedData() {
    // Ordre important pour respecter les contraintes de clés étrangères
    await this.prisma.answer.deleteMany();
    await this.prisma.gameRound.deleteMany();
    await this.prisma.player.deleteMany();
    await this.prisma.game.deleteMany();
    await this.prisma.question.deleteMany();
    
    console.log('Migrated data cleaned');
  }
}
```

### 8.4 Monitoring de la migration

```typescript
// Service de monitoring spécifique à la migration
@Injectable()
export class MigrationMonitoringService {
  constructor(private readonly logger: Logger) {}
  
  private migrationMetrics = {
    questionsProcessed: 0,
    gamesProcessed: 0,
    playersProcessed: 0,
    errors: 0,
    startTime: Date.now(),
    lastUpdate: Date.now()
  };
  
  updateProgress(type: 'questions' | 'games' | 'players', count: number) {
    this.migrationMetrics[`${type}Processed`] += count;
    this.migrationMetrics.lastUpdate = Date.now();
    
    // Log progress every 100 items
    if (this.migrationMetrics[`${type}Processed`] % 100 === 0) {
      this.logProgress();
    }
  }
  
  recordError(error: Error, context: string) {
    this.migrationMetrics.errors++;
    this.logger.error(`Migration error in ${context}`, error.stack);
  }
  
  private logProgress() {
    const elapsed = Date.now() - this.migrationMetrics.startTime;
    const rate = this.getTotalProcessed() / (elapsed / 1000); // items/sec
    
    this.logger.log(`Migration progress: ${this.getTotalProcessed()} items processed, ` +
                     `${this.migrationMetrics.errors} errors, ` +
                     `${rate.toFixed(2)} items/sec`);
  }
  
  private getTotalProcessed(): number {
    return this.migrationMetrics.questionsProcessed +
           this.migrationMetrics.gamesProcessed +
           this.migrationMetrics.playersProcessed;
  }
}
```

## 9. Performance et optimisation avancée

### 9.1 Architecture de cache multicouche

#### Stratégie de cache Redis optimisée

```typescript
// Service de cache intelligent avec TTL adaptatif
@Injectable()
export class CacheService {
  constructor(
    private readonly redis: Redis,
    private readonly logger: Logger
  ) {}
  
  // Cache adapté au gaming avec TTL variables
  private readonly cacheTTL = {
    // Données statiques (longue durée)
    questions: 24 * 60 * 60, // 24h
    gameConfig: 12 * 60 * 60, // 12h
    
    // Données de jeu (durée moyenne)
    gameState: 30 * 60, // 30min
    playerSession: 60 * 60, // 1h
    leaderboard: 5 * 60, // 5min
    
    // Données temps réel (courte durée)
    activeGames: 60, // 1min
    playerPresence: 30, // 30s
    rateLimit: 60 // 1min
  };
  
  // Cache avec compression pour données volumineuses
  async setCompressed<T>(key: string, data: T, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(data);
      
      // Compresser si > 1KB
      const compressed = serialized.length > 1024 
        ? await this.compress(serialized)
        : serialized;
      
      const finalTTL = ttl || this.getCacheTTL(key);
      
      await this.redis.setex(
        key,
        finalTTL,
        compressed.length < serialized.length 
          ? `compressed:${compressed}`
          : serialized
      );
      
      this.logger.debug(`Cache SET: ${key} (${this.getDataSize(compressed)} bytes, TTL: ${finalTTL}s)`);
    } catch (error) {
      this.logger.error(`Cache SET failed for ${key}`, error.stack);
    }
  }
  
  async getCompressed<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.redis.get(key);
      if (!cached) return null;
      
      // Décompresser si nécessaire
      const data = cached.startsWith('compressed:')
        ? await this.decompress(cached.substring(11))
        : cached;
      
      this.logger.debug(`Cache HIT: ${key}`);
      return JSON.parse(data);
    } catch (error) {
      this.logger.error(`Cache GET failed for ${key}`, error.stack);
      return null;
    }
  }
  
  // Cache avec refresh automatique en arrière-plan
  async getWithRefresh<T>(
    key: string,
    refreshFunction: () => Promise<T>,
    refreshThreshold: number = 0.8
  ): Promise<T> {
    const cached = await this.getCompressed<T>(key);
    const ttl = await this.redis.ttl(key);
    
    if (cached) {
      // Refresh en arrière-plan si proche de l'expiration
      const originalTTL = this.getCacheTTL(key);
      if (ttl < originalTTL * refreshThreshold) {
        // Refresh asynchrone sans bloquer
        setImmediate(async () => {
          try {
            const fresh = await refreshFunction();
            await this.setCompressed(key, fresh);
            this.logger.debug(`Background refresh completed for ${key}`);
          } catch (error) {
            this.logger.warn(`Background refresh failed for ${key}`, error.message);
          }
        });
      }
      
      return cached;
    }
    
    // Cache miss - fetch et cache
    const fresh = await refreshFunction();
    await this.setCompressed(key, fresh);
    return fresh;
  }
  
  // Pattern cache-aside pour données de jeu
  async cacheGameState(gameId: string, state: GameState): Promise<void> {
    const pipeline = this.redis.pipeline();
    
    // Cache principal
    pipeline.setex(
      `game:${gameId}`,
      this.cacheTTL.gameState,
      JSON.stringify(state)
    );
    
    // Index pour recherches
    pipeline.sadd(`active_games`, gameId);
    pipeline.expire(`active_games`, this.cacheTTL.activeGames);
    
    // Métadonnées pour analytics
    pipeline.hset(`game_meta:${gameId}`, {
      status: state.status,
      playerCount: state.players.length,
      currentRound: state.currentRound,
      lastUpdate: Date.now()
    });
    
    await pipeline.exec();
  }
}
```

#### Optimisation des requêtes base de données

```typescript
// Repository avec optimisations avancées
@Injectable()
export class OptimizedGameRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly metrics: MetricsService
  ) {}
  
  // Requête optimisée avec eager loading intelligent
  async findGameWithDetails(gameId: string): Promise<GameWithDetails | null> {
    const startTime = Date.now();
    
    try {
      // Tentative cache d'abord
      const cached = await this.cache.getCompressed<GameWithDetails>(`game_details:${gameId}`);
      if (cached) {
        this.metrics.recordCacheHit('game_details');
        return cached;
      }
      
      // Requête optimisée avec select spécifique
      const game = await this.prisma.game.findUnique({
        where: { id: gameId },
        select: {
          id: true,
          pin: true,
          status: true,
          currentRound: true,
          currentTurn: true,
          createdAt: true,
          startedAt: true,
          
          // Relations avec filtres
          players: {
            select: {
              id: true,
              username: true,
              points: true,
              position: true,
              isCreator: true,
              connectionStatus: true,
              lastSeen: true
            },
            where: { isActive: true },
            orderBy: { position: 'asc' }
          },
          
          rounds: {
            select: {
              id: true,
              roundNumber: true,
              status: true,
              currentPlayerId: true,
              question: {
                select: {
                  id: true,
                  text: true,
                  options: true,
                  roundType: true
                }
              }
            },
            where: { status: { in: ['PENDING', 'IN_PROGRESS'] } },
            orderBy: { roundNumber: 'desc' },
            take: 1 // Seul le round actuel
          }
        }
      });
      
      if (!game) return null;
      
      // Enrichir avec données calculées
      const enriched = await this.enrichGameData(game);
      
      // Mettre en cache
      await this.cache.setCompressed(`game_details:${gameId}`, enriched, 300); // 5min
      
      this.metrics.recordCacheMiss('game_details');
      return enriched;
      
    } finally {
      const duration = Date.now() - startTime;
      this.metrics.recordDatabaseQuery('findGameWithDetails', 'game', duration);
    }
  }
  
  // Batch loading pour performances
  async findMultipleGamesOptimized(gameIds: string[]): Promise<GameSummary[]> {
    if (gameIds.length === 0) return [];
    
    // Vérifier cache pour chaque ID
    const cacheKeys = gameIds.map(id => `game_summary:${id}`);
    const cached = await this.redis.mget(...cacheKeys);
    
    const results: GameSummary[] = [];
    const missedIds: string[] = [];
    
    cached.forEach((cachedData, index) => {
      if (cachedData) {
        results[index] = JSON.parse(cachedData);
      } else {
        missedIds.push(gameIds[index]);
      }
    });
    
    // Fetch des données manquantes en batch
    if (missedIds.length > 0) {
      const freshData = await this.prisma.game.findMany({
        where: { id: { in: missedIds } },
        select: {
          id: true,
          pin: true,
          status: true,
          playerCount: true,
          createdAt: true,
          _count: {
            select: { players: true }
          }
        }
      });
      
      // Mettre en cache les nouvelles données
      const pipeline = this.redis.pipeline();
      freshData.forEach(game => {
        const summary = this.transformToSummary(game);
        pipeline.setex(`game_summary:${game.id}`, 300, JSON.stringify(summary));
        
        // Ajouter aux résultats
        const originalIndex = gameIds.indexOf(game.id);
        results[originalIndex] = summary;
      });
      
      await pipeline.exec();
    }
    
    return results.filter(Boolean); // Retirer les nulls
  }
  
  // Requête streaming pour gros volumes
  async streamActiveGames(callback: (game: GameStream) => Promise<void>): Promise<void> {
    const batchSize = 100;
    let offset = 0;
    let hasMore = true;
    
    while (hasMore) {
      const batch = await this.prisma.game.findMany({
        where: {
          status: { in: ['WAITING', 'IN_PROGRESS'] },
          lastActivity: { gte: new Date(Date.now() - 30 * 60 * 1000) } // 30min
        },
        select: {
          id: true,
          pin: true,
          status: true,
          playerCount: true,
          lastActivity: true
        },
        orderBy: { lastActivity: 'desc' },
        skip: offset,
        take: batchSize
      });
      
      if (batch.length === 0) {
        hasMore = false;
        break;
      }
      
      // Traiter le batch
      for (const game of batch) {
        await callback(game as GameStream);
      }
      
      offset += batchSize;
      hasMore = batch.length === batchSize;
      
      // Petit délai pour éviter la surcharge
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }
}
```

### 9.2 Optimisation frontend

#### Gestion d'état optimisée

```typescript
// Store Zustand avec optimisations
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface OptimizedGameStore {
  // État segmenté pour minimiser les re-renders
  ui: {
    isLoading: boolean;
    currentScreen: string;
    notifications: Notification[];
  };
  
  game: {
    current: Game | null;
    state: GameState | null;
    lastUpdate: number;
  };
  
  players: {
    current: Player | null;
    list: Player[];
    presence: Record<string, PlayerPresence>;
  };
  
  // Actions optimisées
  actions: {
    updateGameState: (state: Partial<GameState>) => void;
    updatePlayerPresence: (playerId: string, presence: PlayerPresence) => void;
    addNotification: (notification: Notification) => void;
    clearOldNotifications: () => void;
  };
}

export const useGameStore = create<OptimizedGameStore>()((
  subscribeWithSelector(
    immer((set, get) => ({
      ui: {
        isLoading: false,
        currentScreen: 'home',
        notifications: []
      },
      
      game: {
        current: null,
        state: null,
        lastUpdate: 0
      },
      
      players: {
        current: null,
        list: [],
        presence: {}
      },
      
      actions: {
        // Mise à jour différentielle pour performances
        updateGameState: (newState) => set((state) => {
          if (!state.game.state) {
            state.game.state = newState as GameState;
          } else {
            // Merge intelligent pour éviter re-renders inutiles
            Object.keys(newState).forEach(key => {
              if (JSON.stringify(state.game.state![key]) !== JSON.stringify(newState[key])) {
                state.game.state![key] = newState[key];
              }
            });
          }
          state.game.lastUpdate = Date.now();
        }),
        
        updatePlayerPresence: (playerId, presence) => set((state) => {
          state.players.presence[playerId] = presence;
        }),
        
        addNotification: (notification) => set((state) => {
          state.ui.notifications.push({
            ...notification,
            id: Math.random().toString(36),
            timestamp: Date.now()
          });
          
          // Limiter à 10 notifications max
          if (state.ui.notifications.length > 10) {
            state.ui.notifications.shift();
          }
        }),
        
        clearOldNotifications: () => set((state) => {
          const now = Date.now();
          state.ui.notifications = state.ui.notifications.filter(
            n => now - n.timestamp < 30000 // Garder 30s
          );
        })
      }
    }))))
);

// Hooks optimisés avec sélecteurs
export const useGameState = () => useGameStore(state => state.game.state);
export const usePlayerList = () => useGameStore(state => state.players.list);
export const useCurrentPlayer = () => useGameStore(state => state.players.current);
export const useNotifications = () => useGameStore(state => state.ui.notifications);

// Hook avec mémorisation pour éviter re-calculs
export const useCurrentRankings = () => {
  return useGameStore(
    useCallback(
      (state) => {
        if (!state.players.list.length) return [];
        
        return state.players.list
          .sort((a, b) => {
            if (a.points !== b.points) return b.points - a.points;
            return a.lastPointTimestamp - b.lastPointTimestamp;
          })
          .map((player, index, arr) => ({
            ...player,
            position: index === 0 || arr[index-1].points !== player.points 
              ? index + 1 
              : arr[index-1].position
          }));
      },
      []
    )
  );
};
```

#### Optimisation des composants React

```typescript
// Composant de jeu optimisé
import { memo, useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

// HOC pour optimisation automatique
function withPerformanceOptimizations<T extends Record<string, any>>(
  Component: React.ComponentType<T>
) {
  return memo(Component, (prevProps, nextProps) => {
    // Comparaison personnalisée pour éviter re-renders
    const keys = Object.keys(nextProps);
    
    for (const key of keys) {
      if (typeof nextProps[key] === 'function') {
        // Ignorer les fonctions (présumées stables avec useCallback)
        continue;
      }
      
      if (JSON.stringify(prevProps[key]) !== JSON.stringify(nextProps[key])) {
        return false; // Props changed, re-render
      }
    }
    
    return true; // No re-render needed
  });
}

// Composant principal du jeu avec optimisations
export const GameScreen = withPerformanceOptimizations<GameScreenProps>(({ gameId }) => {
  const gameState = useGameState();
  const playerList = usePlayerList();
  const currentPlayer = useCurrentPlayer();
  
  // Mémorisation des calculs coûteux
  const gameMetrics = useMemo(() => {
    if (!gameState || !playerList.length) return null;
    
    return {
      averagePoints: playerList.reduce((sum, p) => sum + p.points, 0) / playerList.length,
      leaderPoints: Math.max(...playerList.map(p => p.points)),
      roundProgress: (gameState.currentRound / 4) * 100,
      timeElapsed: Date.now() - gameState.startedAt
    };
  }, [gameState?.currentRound, playerList]);
  
  // Callbacks optimisés
  const handleAnswer = useCallback(async (answer: string) => {
    if (!currentPlayer || !gameState) return;
    
    try {
      await gameApi.submitAnswer(gameId, answer);
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }
  }, [gameId, currentPlayer?.id, gameState?.currentTurn]);
  
  const handleGuess = useCallback(async (guess: string) => {
    if (!currentPlayer || !gameState) return;
    
    try {
      await gameApi.submitGuess(gameId, guess);
    } catch (error) {
      console.error('Failed to submit guess:', error);
    }
  }, [gameId, currentPlayer?.id, gameState?.currentTurn]);
  
  // Rendu conditionnel optimisé
  if (!gameState) {
    return <GameLoadingSkeleton />;
  }
  
  return (
    <div className="game-screen">
      <GameHeader 
        round={gameState.currentRound}
        currentPlayer={gameState.currentPlayer}
        metrics={gameMetrics}
      />
      
      <GameContent
        gameState={gameState}
        currentPlayer={currentPlayer}
        onAnswer={handleAnswer}
        onGuess={handleGuess}
      />
      
      <GameFooter 
        players={playerList}
        gameState={gameState}
      />
    </div>
  );
});

// Composant de liste virtualisée pour gros volumes
export const VirtualizedPlayerList = memo<{ players: Player[] }>(({ players }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: players.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60, // Hauteur estimée par item
    overscan: 5 // Items supplémentaires pour scroll fluide
  });
  
  return (
    <div ref={parentRef} className="player-list-container">
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative'
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const player = players[virtualItem.index];
          
          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`
              }}
            >
              <PlayerCard player={player} />
            </div>
          );
        })}
      </div>
    </div>
  );
});
```

### 9.3 Optimisation WebSocket

```typescript
// Client WebSocket optimisé avec pooling et compression
export class OptimizedSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private messageQueue: QueuedMessage[] = [];
  private heartbeatInterval: NodeJS.Timer | null = null;
  
  constructor(
    private readonly url: string,
    private readonly options: SocketOptions = {}
  ) {}
  
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(this.url, {
        transports: ['websocket', 'polling'],
        upgrade: true,
        compression: true,
        
        // Optimisations de performance
        forceNew: false,
        multiplex: true,
        
        // Configuration des timeouts
        timeout: 5000,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        
        ...this.options
      });
      
      this.socket.on('connect', () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.flushMessageQueue();
        resolve();
      });
      
      this.socket.on('disconnect', (reason) => {
        console.warn('WebSocket disconnected:', reason);
        this.stopHeartbeat();
        
        if (reason === 'io server disconnect') {
          // Reconnexion manuelle si serveur ferme
          this.reconnect();
        }
      });
      
      this.socket.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
        reject(error);
      });
      
      // Gestionnaire d'erreurs générique
      this.socket.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }
  
  // Envoi avec queue en cas de déconnexion
  emit(event: string, data: any, ack?: (response: any) => void): void {
    const message: QueuedMessage = {
      event,
      data,
      ack,
      timestamp: Date.now(),
      attempts: 0
    };
    
    if (this.socket?.connected) {
      this.sendMessage(message);
    } else {
      // Ajouter à la queue avec TTL
      if (Date.now() - message.timestamp < 30000) { // 30s TTL
        this.messageQueue.push(message);
      }
    }
  }
  
  // Envoi batch pour optimiser les performances  
  emitBatch(messages: Array<{ event: string; data: any }>): void {
    if (!this.socket?.connected) {
      messages.forEach(msg => this.emit(msg.event, msg.data));
      return;
    }
    
    // Grouper par type d'événement
    const batched = messages.reduce((acc, msg) => {
      if (!acc[msg.event]) acc[msg.event] = [];
      acc[msg.event].push(msg.data);
      return acc;
    }, {} as Record<string, any[]>);
    
    // Envoyer chaque batch
    Object.entries(batched).forEach(([event, dataArray]) => {
      this.socket!.emit(`${event}_batch`, dataArray);
    });
  }
  
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit('ping', { timestamp: Date.now() });
      }
    }, 25000); // 25s
  }
  
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
  
  private async flushMessageQueue(): Promise<void> {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()!;
      
      // Vérifier TTL
      if (Date.now() - message.timestamp > 30000) {
        continue; // Message expiré
      }
      
      try {
        await this.sendMessage(message);
      } catch (error) {
        console.error('Failed to send queued message:', error);
        
        // Remettre en queue si pas trop d'essais
        if (message.attempts < 3) {
          message.attempts++;
          this.messageQueue.unshift(message);
          break; // Arrêter le flush en cas d'erreur
        }
      }
    }
  }
}
```

### 9.4 Scaling horizontal

```typescript
// Configuration pour scaling avec Redis Cluster
export class ScalingConfiguration {
  static getRedisClusterConfig() {
    return {
      nodes: [
        { host: 'redis-node-1', port: 6379 },
        { host: 'redis-node-2', port: 6379 },
        { host: 'redis-node-3', port: 6379 }
      ],
      options: {
        redisOptions: {
          password: process.env.REDIS_PASSWORD
        },
        enableOfflineQueue: false,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3
      }
    };
  }
  
  // Load balancer pour WebSocket avec sticky sessions
  static getNginxConfig() {
    return `
      upstream websocket_backend {
        ip_hash; # Sticky sessions
        server api-1:3000;
        server api-2:3000;
        server api-3:3000;
      }
      
      server {
        listen 80;
        
        location /socket.io/ {
          proxy_pass http://websocket_backend;
          proxy_http_version 1.1;
          proxy_set_header Upgrade $http_upgrade;
          proxy_set_header Connection "upgrade";
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
          
          # Optimisations WebSocket
          proxy_buffering off;
          proxy_cache off;
          proxy_read_timeout 86400s;
          proxy_send_timeout 86400s;
        }
      }
    `;
  }
}
```

## 10. Bonnes pratiques et recommandations

### 10.1 Quick wins pour amélioration immédiate
1. **PWA**: Ajout simple pour installation mobile et travail hors-ligne
2. **Analytics**: Google Analytics ou Plausible pour comprendre l'usage
3. **Sentry**: Monitoring erreurs production avec alertes temps réel
4. **Feedback widget**: Pour collecter avis utilisateurs et bugs
5. **Share buttons**: Viralité sociale avec partage de résultats
6. **Compression**: Gzip/Brotli sur toutes les ressources
7. **CDN**: Cloudflare pour accélérer le chargement global

### 10.2 Future features à considérer
1. **Modes de jeu**: Teams, tournament, speed round, custom questions
2. **Customisation**: Thèmes, avatars, sons, questions personnalisées
3. **Monétisation**: Premium features, pas de publicités, stats avancées
4. **API publique**: Pour intégrations tierces et développeurs
5. **IA**: Génération questions personnalisées selon les joueurs
6. **Réalité augmentée**: Intégration caméra pour réactions
7. **Streaming**: Intégration Twitch/YouTube pour parties publiques

### 10.3 Pièges à éviter absolument
1. **Over-engineering**: Commencer simple, itérer basé sur usage réel
2. **Premature optimization**: Mesurer avant optimiser, profiler avant accélérer
3. **Feature creep**: Focus sur core gameplay, éviter distractions
4. **Tech debt**: Refactorer régulièrement, ne pas accumuler
5. **Security neglect**: Audits réguliers, mises à jour sécurité
6. **Mobile afterthought**: Mobile-first design et développement
7. **Performance ignorance**: Monitoring continu des métriques vitales

### 10.4 Métriques de succès à suivre

#### Métriques techniques
- **Performance**: < 2s chargement initial, < 500ms réponse API
- **Fiabilité**: 99.9% uptime, < 1% error rate
- **Scalabilité**: Support 1000+ parties simultanées
- **Sécurité**: 0 incident majeur, audits réguliers

#### Métriques engagement
- **Completion rate**: 70%+ des parties finies
- **Return rate**: 30%+ des joueurs reviennent
- **Session duration**: 15-25 minutes moyenne
- **Viral coefficient**: 1.2+ invitations par joueur

#### Métriques business
- **Croissance**: 20% MoM nouveaux utilisateurs
- **Rétention**: 40% J+7, 20% J+30
- **CAC < LTV**: Coût acquisition < valeur vie client
- **Unit economics**: Positifs dès M+6

### 10.5 Stratégie de maintenance long terme

#### Efforts mensuels recommandés
- **Updates sécurité**: 4h - Patches critiques et audits
- **Bug fixes**: 8h - Résolution issues utilisateurs
- **Monitoring**: 4h - Analyse métriques et optimisations
- **Features mineures**: 16h - Améliorations UX et nouvelles questions
- **Total**: 32h/mois (2 jours/mois)

#### Coûts mensuels prévisionnels
- **Maintenance développement**: 1,600-3,200€ (selon niveau)
- **Infrastructure**: 50-500€ (selon trafic)
- **Services tiers**: 50-200€ (monitoring, analytics, etc.)
- **Total**: 1,700-3,900€/mois

#### Planning de mises à jour
- **Patch de sécurité**: Immédiat si critique
- **Bug fixes**: Hebdomadaire pour non-critiques
- **Features mineures**: Mensuel
- **Refactoring majeur**: Trimestriel
- **Migration technologique**: Annuel

### 10.6 Check-list de lancement production

#### Pré-déploiement technique
- [ ] Tests unitaires > 80% couverture
- [ ] Tests E2E complets passés
- [ ] Tests de charge réussis (1000+ utilisateurs simultacipanés)
- [ ] Sécurité auditée et validée
- [ ] Monitoring et alertes configurés
- [ ] Backup et disaster recovery testés
- [ ] CDN et optimisations activées
- [ ] SSL/HTTPS configuré partout

#### Pré-lancement business
- [ ] Analytics configurées (GA4, goals, funnels)
- [ ] Feedback system activé (Hotjar, surveys)
- [ ] Support utilisateur prêt (FAQ, contact)
- [ ] Métriques baseline définies
- [ ] Plan de communication prêt
- [ ] Tests beta avec vrais utilisateurs
- [ ] Documentation utilisateur finalisée

#### Post-lancement (J+7)
- [ ] Métriques analysées et comparées aux objectifs
- [ ] Bugs post-lancement résolus
- [ ] Feedback utilisateurs collecté et analysé
- [ ] Performance optimisée selon usage réel
- [ ] Plan d'amélioration établi pour M+1

## Conclusion finale

Ce document de refactoring Epercept est maintenant **parfaitement auto-porteur** et contient :

✅ **Architecture complète** : Frontend Next.js 14, Backend NestJS, PostgreSQL, Redis  
✅ **Sécurité entreprise** : Validation, chiffrement, audit, protection OWASP  
✅ **Tests exhaustifs** : Unité, intégration, E2E, performance, sécurité  
✅ **Monitoring avancvé** : Métriques, logs, traces, alertes intelligentes  
✅ **Migration sécurisée** : Plan par phases, validation, rollback  
✅ **Performance optimisée** : Cache multicouche, scaling, optimisations frontend  
✅ **Production-ready** : CI/CD, infrastructure, maintenance long terme

### Impact attendu de cette refonte

**Court terme (M+1-3)**
- ✨ **Correction bugs critiques** : Ex aequo, déconnexions, états bloquants résolus
- 📱 **Amélioration mobile** : Auto-scroll, UX fluid, PWA install
- 🔒 **Sécurité renforcée** : Protection contre attaques, données sécurisées
- 📈 **Observabilité totale** : Métriques, alertes, debugging facilité

**Moyen terme (M+3-12)**  
- 🚀 **Scalabilité x10** : Support 10,000+ joueurs simultancés
- ⚡ **Performance x3** : Chargement 3x plus rapide, latence divisée par 3
- 📊 **Analytics poussées** : Compréhension fine usage, optimisations data-driven
- 🎆 **Features avancées** : Modes de jeu, personnalisation, social

**Long terme (M+12+)**
- 🌍 **Expansion internationale** : Multi-langues, localisations
- 🤖 **IA intégrée** : Questions dynamiques, matching intelligent
- 💰 **Monétisation** : Modèle freemium viable et scalable
- 🏆 **Market leader** : Référence du genre party game web

### Retour sur investissement prévisionnel

**Investissement initial** : 12,000-20,000€ (développement + infrastructure)  
**Coûts mensuels** : 2,000-4,000€ (maintenance + hosting + services)

**Bénéfices attendus** :
- **Réduction bugs** : -80% tickets support, +50% satisfaction
- **Amélioration performance** : +30% conversion, +25% rétention  
- **Scalabilité** : Support croissance 10x sans refonte majeure
- **Sécurité** : Éviter coûts incidents (reputation, légal, technique)
- **Maintenance** : -60% temps débogage, +200% vélocité features

**ROI estimé** : Positif dès M+6, rentabilité x3 sur 24 mois

---

**Cette architecture moderne transforme Epercept d'un prototype fonctionnel en une application web professionnelle, scalable et maintenable. Tous les éléments sont présents pour un développement réussi from scratch qui corrige définitivement tous les problèmes identifiés tout en posant les bases d'une croissance long terme.**

### 6.1 Performance

#### Frontend
- **Code splitting**: Routes lazy-loaded
- **Image optimization**: Next/Image avec blur placeholders
- **Bundle size**: Analyse avec @next/bundle-analyzer
- **Caching**: SWR pour data fetching
- **Web Vitals**: Monitoring avec Vercel Analytics

#### Backend
- **Query optimization**: Indexes Prisma appropriés
- **Caching strategy**: Redis pour sessions et game state
- **Rate limiting**: Protection contre spam
- **Connection pooling**: PgBouncer en production
- **Compression**: Gzip/Brotli pour API responses

### 6.2 Sécurité

#### Mesures essentielles
- **Input validation**: Zod schemas stricts
- **SQL injection**: Prisma parameterized queries
- **XSS protection**: React escape par défaut
- **CSRF tokens**: Next.js CSRF protection
- **Rate limiting**: Express-rate-limit
- **Helmet.js**: Headers sécurité

#### Authentification
```typescript
// Option 1: Session-based (simple)
app.use(session({
  store: new RedisStore({ client: redis }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 // 24h
  }
}));

// Option 2: JWT (scalable)
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    });
  }
}
```

### 6.3 Scalabilité

#### Architecture horizontale
- **Load balancing**: Nginx ou Cloudflare
- **Sticky sessions**: Pour WebSocket avec Redis adapter
- **Database replicas**: Read replicas pour queries
- **CDN**: Assets statiques sur Cloudflare
- **Auto-scaling**: Railway ou Kubernetes

#### Code patterns
```typescript
// Repository pattern pour abstraction DB
@Injectable()
export class GameRepository {
  constructor(private prisma: PrismaService) {}
  
  async findByPin(pin: string): Promise<Game | null> {
    return this.prisma.game.findUnique({
      where: { pin },
      include: { players: true, rounds: true }
    });
  }
}

// Event-driven avec EventEmitter
@Injectable()
export class GameEventService {
  private emitter = new EventEmitter();
  
  emitGameStarted(gameId: string) {
    this.emitter.emit('game.started', { gameId });
  }
}
```

### 6.4 Developer Experience

#### Tooling
- **TypeScript**: Strict mode + paths aliases
- **Linting**: ESLint + Prettier + lint-staged
- **Testing**: Vitest + Testing Library + Playwright
- **Documentation**: Storybook pour composants
- **Debugging**: Chrome DevTools + Redux DevTools

#### Commandes utiles
```json
{
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "test:e2e": "playwright test",
    "lint": "turbo run lint",
    "format": "prettier --write .",
    "typecheck": "turbo run typecheck",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "analyze": "ANALYZE=true next build"
  }
}
```

## 7. Estimation budgétaire

### 7.1 Coûts de développement

#### Temps estimé
- **Phase 1**: 5 jours
- **Phase 2**: 7 jours  
- **Phase 3**: 4 jours
- **Phase 4**: 4 jours
- **Total**: 20 jours (160 heures)

#### Taux horaire
- **Junior**: 30-50€/h = 4,800-8,000€
- **Mid-level**: 50-80€/h = 8,000-12,800€
- **Senior**: 80-120€/h = 12,800-19,200€

### 7.2 Coûts d'infrastructure

#### Lancement (0-1000 users)
- **Vercel**: 0€ (free tier)
- **Railway**: 5€/mois (Postgres + Redis)
- **Domaine**: 15€/an
- **Total**: ~6€/mois

#### Croissance (1000-10k users)
- **Vercel Pro**: 20€/mois
- **Railway Scale**: 20€/mois
- **Monitoring**: 10€/mois
- **Total**: ~50€/mois

#### Scale (10k+ users)
- **Vercel Enterprise**: 150€+/mois
- **AWS/GCP**: 200€+/mois
- **CDN Premium**: 50€/mois
- **Total**: ~400€+/mois

### 7.3 Maintenance

#### Efforts mensuels
- **Updates sécurité**: 2h
- **Bug fixes**: 4h
- **Monitoring**: 2h
- **Features mineures**: 8h
- **Total**: 16h/mois

#### Coûts associés
- **Maintenance**: 800-1,920€/mois
- **Hosting**: 50-400€/mois
- **Services tiers**: 0-100€/mois
- **Total**: 850-2,420€/mois

## 8. Recommandations finales

### 8.1 Quick wins
1. **PWA**: Ajout simple pour installation mobile
2. **Analytics**: Google Analytics ou Plausible
3. **Sentry**: Monitoring erreurs production
4. **Feedback widget**: Pour collecter avis utilisateurs
5. **Share buttons**: Viralité sociale

### 8.2 Future features
1. **Modes de jeu**: Teams, tournament, speed round
2. **Customisation**: Thèmes, avatars, sons
3. **Monétisation**: Premium features, no ads
4. **API publique**: Pour intégrations tierces
5. **IA**: Génération questions personnalisées

### 8.3 Pièges à éviter
1. **Over-engineering**: Commencer simple, itérer
2. **Premature optimization**: Mesurer avant optimiser
3. **Feature creep**: Focus sur core gameplay
4. **Tech debt**: Refactorer régulièrement
5. **Security**: Audits réguliers

### 8.4 Métriques de succès
- **Technique**: <2s chargement, 99.9% uptime
- **Engagement**: 70% completion rate, 30% return rate
- **Croissance**: 20% MoM new users
- **Qualité**: <1% error rate, >4.5 app rating
- **Business**: CAC < LTV, positive unit economics

## 9. Contenu du jeu et wording

### 9.1 Textes d'interface (CORRIGÉS selon les demandes du fondateur)

#### Page d'accueil - Introduction (NOUVELLE VERSION)
"Avec Percept, plongez dans une expérience où vos perceptions et celles des autres se confrontent.

Jouez et découvrez comment vos amis vous voient et s'ils sont tels que vous les imaginez !

Si vous voulez gagner, il faudra cerner qui se cache derrière les masques que les autres joueurs portent… parfois même sans s'en apercevoir.

**Pourquoi vous allez adorer ?**
Au-delà du jeu, l'intérêt réside dans les discussions qui en découlent. Débriefez les réponses, essayez de comprendre les choix des uns et des autres, et découvrez des facettes inattendues de vos amis ou de votre famille.

À vous de jouer !"

#### Règles du jeu (VERSION CORRIGÉE)

**Le but du jeu :**
Accumulez des points en devinant les réponses des autres joueurs. Attention, pas de points en jeu pour votre propre réponse, alors soyez **honnête et spontané**.

**Comment ça marche ?**
1. À chaque tour, un joueur tire une question et y répond.
2. Les autres joueurs doivent deviner sa réponse.
3. Le questionné change à chaque tour.
4. La partie se joue en **4 manches**, chacune avec un type de question différent pour varier les surprises !

**Accordez vous sur les termes et le contexte des questions avant d'y répondre**

**Pour 4 à 7 joueurs**

#### Texte d'accueil
"Bienvenue !

Commencez une nouvelle partie ou rejoignez une partie existante en entrant le code PIN généré par le créateur de la partie"

### 9.2 Structure des questions

Le jeu contient **320 questions** réparties en 4 rounds thématiques :

1. **Round 1 - Personnalité** (65 questions) : Questions introspectives sur les valeurs, préférences et traits de caractère
2. **Round 2 - Situations** (64 questions) : Dilemmes et choix dans des situations hypothétiques
3. **Round 3 - Représentations** (107 questions) : Questions sur la perception des autres joueurs
4. **Round 4 - Relations** (84 questions) : Questions sur les relations entre les joueurs

### 9.3 Exemples de questions par round

#### Round 1 - Personnalité
- "Tes vrais amis, tu les comptes ..." (4 options)
- "À quelle fréquence tu t'observes à travers un miroir ou des photos ?" (2 options)
- "Pour toi, le sexe ..." (2 options)
- "Si tu étais un animal, tu serais ..." (3 options)
- "Tu préfères construire quelque chose de..." (3 options : Beau/Robuste/Utile)

#### Round 2 - Situations
- "Tu as une opportunité de carrière exceptionnelle à l'étranger, mais cela signifierait laisser derrière toi ta famille et tes amis proches pour une période non négligeable. Que choisis-tu ?" (Je pars/Je reste)
- "Tu es témoin d'une réprimande sévère d'un parent à son enfant dans un lieu public. Interviens-tu ?" (Oui/Non)
- "Face à un danger mortel, entre sauver un proche et un groupe d'inconnus, que ferais-tu ?" (Je sauve mon proche/Je sauve les inconnus)

#### Round 3 - Représentations
- "Qui serait le·la plus enclin·e à partir avant la fin du jeu à cause d'une réponse qui ne lui plaît pas ?"
- "Qui te semble être le·la plus intelligent·e ?"
- "Qui a traversé les épreuves les plus difficiles ?"
- "Qui masque le mieux ses peines ?"

#### Round 4 - Relations
- "La vie de quelle joueur/joueuse ne voudrais-tu pas mener ?"
- "À qui ferais-tu le moins confiance pour garder un secret ?"
- "Avec qui te sens-tu le plus en sécurité ?"
- "Qui choisirais-tu comme témoin de mariage ?"

### 9.4 Formats de réponses

- **2 options** : Questions binaires (Oui/Non, choix A/B)
- **3 options** : Questions à choix multiples
- **4 options** : Questions plus nuancées
- **Réponses nulles** : Pour les rounds 3 et 4, les réponses sont les noms des joueurs

## 10. Interface d'administration

### 10.1 Vue d'ensemble

L'interface d'administration permettra une gestion complète du contenu du jeu avec une expérience utilisateur moderne et intuitive.

#### Dashboard principal
```
┌─────────────────────────────────────────────────────────────┐
│  Epercept Admin                                    [Logout]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ 320         │ │ 47          │ │ 1,234       │           │
│  │ Questions   │ │ Parties/jour│ │ Joueurs     │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
│  ┌─────────────────────────────────────────────────┐        │
│  │ Questions par round                              │        │
│  │ ■■■■■■■■■■ Personnalité (65)                    │        │
│  │ ■■■■■■■■■■ Situations (64)                      │        │
│  │ ■■■■■■■■■■■■■■■■ Représentations (107)         │        │
│  │ ■■■■■■■■■■■■■ Relations (84)                   │        │
│  └─────────────────────────────────────────────────┘        │
│                                                             │
│  Actions rapides:                                           │
│  [+ Nouvelle question] [Import CSV] [Export] [Statistiques] │
└─────────────────────────────────────────────────────────────┘
```

### 10.2 Gestion des questions

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

### 10.3 Features avancées

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
- **A/B testing** : Test de nouvelles questions

### 10.4 Architecture technique admin

#### API endpoints
```typescript
// Questions CRUD
GET    /api/admin/questions
POST   /api/admin/questions
PUT    /api/admin/questions/:id
DELETE /api/admin/questions/:id

// Bulk operations
POST   /api/admin/questions/bulk-update
POST   /api/admin/questions/import
GET    /api/admin/questions/export

// Analytics
GET    /api/admin/analytics/questions
GET    /api/admin/analytics/games
GET    /api/admin/analytics/players

// Moderation
GET    /api/admin/moderation/queue
POST   /api/admin/moderation/approve/:id
POST   /api/admin/moderation/reject/:id
```

#### Permissions et rôles
```typescript
enum AdminRole {
  SUPER_ADMIN = 'super_admin',     // Tous les droits
  CONTENT_MANAGER = 'content_manager', // CRUD questions
  MODERATOR = 'moderator',         // Modération uniquement
  ANALYST = 'analyst'              // Lecture seule + analytics
}

@UseGuards(AdminGuard)
@Roles(AdminRole.CONTENT_MANAGER)
@Controller('admin/questions')
export class AdminQuestionsController {
  // ...
}
```

#### UI Components
```typescript
// Composants réutilisables pour l'admin
components/admin/
├── QuestionTable.tsx       // Table avec tri, filtre, pagination
├── QuestionForm.tsx        // Formulaire avec validation
├── QuestionPreview.tsx     // Prévisualisation temps réel
├── BulkActions.tsx         // Actions sur sélection multiple
├── ImportWizard.tsx        // Assistant d'import étape par étape
├── AnalyticsChart.tsx      // Graphiques interactifs
└── ModerationQueue.tsx     // File de modération
```

#### Sécurité admin
- **Authentification forte** : 2FA obligatoire
- **Audit trail** : Log de toutes les actions
- **Rate limiting** : Protection contre les abus
- **Backup** : Sauvegarde avant modifications critiques
- **Rollback** : Possibilité d'annuler les changements

### 10.5 Workflow de gestion du contenu

1. **Création** : Formulaire avec validation et prévisualisation
2. **Review** : Validation par un second admin (4-eyes principle)
3. **Test** : Période de test sur groupe restreint
4. **Déploiement** : Mise en production progressive
5. **Monitoring** : Suivi des métriques post-déploiement
6. **Itération** : Ajustements basés sur les données

## 11. Ressources et références du projet

### 11.1 Structure des fichiers du projet

#### Fichiers de documentation
- **Ce document** : `epercept-refactoring-analysis.md` - Analyse complète et spécifications techniques
- **Base de données questions** : `epercept-questions-database.md` - 320 questions détaillées organisées par rounds
- **README principal** : `README.md` - Instructions de développement et déploiement

#### Fichiers sources actuels
- **Server** : `server/server.ts` - Backend Express.js actuel
- **Questions** : `server/constantes.ts` - Données des questions (320 questions)
- **Frontend** : `src/` - Application React avec MobX
- **Composants** : `src/Components/` - 12 composants UI principaux

### 11.2 Navigation entre ressources

Pour développer la nouvelle version, consulter dans l'ordre :
1. **Ce document** pour l'architecture et les spécifications techniques
2. **epercept-questions-database.md** pour le contenu complet des questions
3. **Code source actuel** pour comprendre la logique métier existante

### 11.3 Référence rapide

#### Questions du jeu
- **Total** : 320 questions réparties en 4 rounds
- **Localisation** : `./epercept-questions-database.md`
- **Format** : Questions organisées par thématiques avec toutes les réponses
- **Usage** : Base de données pour l'interface d'administration

#### Textes d'interface
- **Localisation** : Section 9.1 de ce document
- **Statut** : Corrigés selon retours fondateur
- **Usage** : Intégrer directement dans les composants React/Next.js

## 12. Textes et messages complets du jeu

### 12.1 Messages système

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

### 12.2 Textes des états de jeu

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

### 12.3 Messages de fin de partie

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

## 13. Spécifications complètes des écrans

### 13.1 États visuels détaillés

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
    content: "Bienvenue ! Commencez une nouvelle partie...";
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

#### Écran de jeu principal
```typescript
interface GameScreenStates {
  // Header constant
  header: {
    logo: "percept_logo.svg";
    roundInfo: {
      number: number; // 1-4
      name: string; // "Personnalité", etc.
      theme: string; // Classe CSS pour couleurs
    };
    currentPlayer: string;
    smartRanking: {
      compact: {
        myPoints: number;
        myPosition: number;
        display: "Points: {points} | Position: {position}";
      };
      expanded?: {
        fullRanking: PlayerRanking[];
        visible: boolean;
      };
    };
  };
  
  // Corps principal - États mutuellement exclusifs
  answering: {
    role: "active_player" | "waiting";
    question: string;
    options: string[] | null; // null pour rounds 3-4
    timer?: {
      duration: 30000;
      remaining: number;
      visible: boolean;
    };
    state: "thinking" | "answered" | "waiting_others";
  };
  
  guessing: {
    question: string;
    correctAnswer?: string; // Visible si déjà répondu par le joueur actif
    myGuess?: string;
    timer: {
      duration: 30000;
      remaining: number;
      warning: boolean; // < 10s
    };
    state: "thinking" | "submitted" | "waiting_others";
  };
  
  revealing: {
    question: string; // Rappelé en haut
    correctAnswer: string;
    participants: {
      correct: Player[];
      incorrect: Player[];
    };
    pointsAwarded: PointsUpdate[];
    visualFeedback: {
      correctHighlight: "green_border";
      incorrectHighlight: "red_border";
      // Plus de vert+rouge simultané
    };
  };
  
  // Footer
  footer: {
    autoAdvance: {
      enabled: boolean;
      trigger: "last_respondent";
      message: "Passage automatique au tour suivant...";
    };
    manualAdvance?: {
      button: "Continuer";
      visible: boolean;
      enabledFor: "last_respondent" | "game_creator";
    };
  };
}
```

### 13.2 Gestion des erreurs et états exceptionnels

#### Reconnexion et récupération
```typescript
interface ConnectionStates {
  connected: {
    status: "online";
    latency?: number;
  };
  
  reconnecting: {
    status: "reconnecting";
    attempt: number;
    maxAttempts: 3;
    message: "Reconnexion en cours... ({attempt}/3)";
    showSpinner: true;
  };
  
  offline: {
    status: "offline";
    message: "Connexion perdue. Vérifiez votre connexion internet.";
    actions: ["Réessayer", "Quitter la partie"];
  };
  
  stateRecovered: {
    status: "recovered";
    message: "Connexion rétablie ! Synchronisation...";
    gameState: GameState; // État récupéré
  };
}
```

#### Gestion des déconnexions d'autres joueurs
```typescript
interface PlayerDisconnectionStates {
  playerLeft: {
    player: Player;
    message: "{username} s'est déconnecté(e)";
    impact: "game_continues" | "game_paused" | "game_ended";
    waitingReconnection: boolean;
    timeout: number; // 2 minutes
  };
  
  gameAdjusted: {
    message: "La partie continue sans {username}";
    redistributedQuestions: boolean;
    newPlayerOrder: Player[];
  };
  
  criticalDisconnection: {
    message: "Trop de joueurs déconnectés";
    options: ["Attendre", "Terminer la partie"];
    autoEndTimer: number; // 5 minutes
  };
}
```

## 14. Configuration technique complète

### 14.1 Variables d'environnement

#### Frontend (Next.js)
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_SOCKET_URL=http://localhost:5001
NEXT_PUBLIC_APP_NAME=Epercept
NEXT_PUBLIC_MAX_PLAYERS=7
NEXT_PUBLIC_MIN_PLAYERS=3
NEXT_PUBLIC_GAME_TIMEOUT=300000
NEXT_PUBLIC_RECONNECTION_ATTEMPTS=3

# Production
NEXT_PUBLIC_API_URL=https://api.epercept.fr
NEXT_PUBLIC_SOCKET_URL=https://api.epercept.fr
```

#### Backend (NestJS)
```bash
# .env
NODE_ENV=development
PORT=5001
DATABASE_URL=postgresql://user:password@localhost:5432/epercept
REDIS_URL=redis://localhost:6379

# JWT & Security
JWT_SECRET=your-super-secret-jwt-key
SESSION_SECRET=your-session-secret
CORS_ORIGINS=http://localhost:3000,https://epercept.fr

# Game Configuration
MAX_PLAYERS_PER_GAME=7
MIN_PLAYERS_TO_START=3
ANSWER_TIMEOUT_MS=30000
RECONNECTION_TIMEOUT_MS=120000
GAME_CLEANUP_INTERVAL_MS=300000

# Production
DATABASE_URL=postgresql://prod-user:prod-pass@prod-host:5432/epercept
REDIS_URL=redis://prod-redis:6379
```

### 14.2 Scripts et commandes

#### Package.json principal
```json
{
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "start": "turbo run start",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "test:e2e": "turbo run test:e2e",
    "typecheck": "turbo run typecheck",
    "clean": "turbo run clean",
    
    "db:migrate": "cd apps/api && npx prisma migrate dev",
    "db:generate": "cd apps/api && npx prisma generate",
    "db:studio": "cd apps/api && npx prisma studio",
    "db:seed": "cd apps/api && npx prisma db seed",
    
    "deploy:staging": "vercel --target staging",
    "deploy:production": "vercel --target production",
    
    "docker:build": "docker build -t epercept .",
    "docker:run": "docker run -p 3000:3000 -p 5001:5001 epercept"
  }
}
```

#### Scripts de déploiement
```bash
#!/bin/bash
# deploy.sh

echo "🚀 Déploiement Epercept"

# Vérifications pré-déploiement
echo "📋 Vérifications..."
npm run typecheck
npm run lint
npm run test

# Build
echo "🔨 Construction..."
npm run build

# Base de données
echo "🗄️ Migration base de données..."
npm run db:migrate

# Déploiement
echo "☁️ Déploiement cloud..."
if [ "$1" = "production" ]; then
  npm run deploy:production
else
  npm run deploy:staging
fi

echo "✅ Déploiement terminé !"
```

### 14.3 Checklist de déploiement

#### Pré-déploiement
- [ ] Tests unitaires passent (npm run test)
- [ ] Tests E2E passent (npm run test:e2e)
- [ ] Linting clean (npm run lint)
- [ ] TypeScript check (npm run typecheck)
- [ ] Build réussit (npm run build)
- [ ] Variables d'environnement configurées
- [ ] Base de données migrée
- [ ] Redis accessible

#### Post-déploiement
- [ ] Health check API répond
- [ ] WebSocket connecte correctement
- [ ] Création de partie fonctionne
- [ ] Jointure de partie fonctionne
- [ ] Flow de jeu complet testé
- [ ] Déconnexion/reconnexion testée
- [ ] Monitoring actif
- [ ] Logs disponibles

## Conclusion

Ce document contient maintenant toutes les informations nécessaires pour développer Epercept from scratch :

✅ **Analyse complète** du code existant et des bugs à corriger
✅ **Architecture moderne** recommandée avec justifications
✅ **Spécifications UX/UI** détaillées avec tous les états
✅ **Textes et messages** complets pour toutes les interfaces
✅ **Configuration technique** complète avec scripts et déploiement
✅ **Référence aux questions** (dans epercept-questions-database.md)
✅ **Plan de migration** priorisé selon les bugs critiques

Le document est maintenant entièrement auto-porteur pour recoder l'application avec une architecture moderne tout en conservant l'essence du jeu original.

Ce plan de refactoring transforme Epercept d'un prototype fonctionnel en une application web moderne, scalable et maintenable. L'architecture proposée permet une croissance organique tout en conservant l'essence du jeu original.

Les investissements en infrastructure et bonnes pratiques se rentabiliseront rapidement par:
- Réduction des bugs et temps de développement
- Meilleure expérience utilisateur
- Capacité d'évolution et nouvelles features
- Coûts d'hébergement optimisés

Le succès de cette migration repose sur une exécution méthodique, des tests rigoureux et une attention constante à l'expérience utilisateur.