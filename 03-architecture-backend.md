# Document 3/7 : Architecture Backend - Projet Epercept

## Scope de ce document
Ce document définit l'architecture backend complète pour l'application Epercept, incluant NestJS, PostgreSQL/Prisma, WebSocket avancé et API REST. Il couvre le COMMENT technique du serveur pour implémenter la logique métier définie dans le Document 1.

## Autres documents du projet
- Document 1/7 : Spécifications Fonctionnelles et Règles Métier ✓
- Document 2/7 : Design System et Expérience Utilisateur ✓
- Document 4/7 : Architecture Frontend
- Document 5/7 : Sécurité, Tests et DevOps
- Document 6/7 : Performance et Scalabilité
- Document 7/7 : Administration et Configuration

---

## 1. NestJS - Framework Backend

### 1.1 Pourquoi NestJS?
- **Architecture modulaire** : Séparation claire des responsabilités
- **TypeScript first** : Type-safety totale pour éviter les bugs runtime
- **Decorators** : Code expressif et maintenable
- **Built-in WebSockets** : Support Socket.io natif et robuste
- **Scalabilité** : Prêt pour la croissance
- **Gestion robuste des déconnexions** : Essentiel pour résoudre les bugs identifiés

### 1.2 Structure modulaire proposée
```
api/
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

## 2. WebSocket Architecture avancée

### 2.1 Gateway principal avec gestion robuste des déconnexions

```typescript
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
    }, 120000); // 2 minutes - Document 1 spécification
    
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

### 2.2 Événements Socket.io complets

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

### 2.3 Système de heartbeat et health check

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

## 3. Base de données - PostgreSQL + Prisma

### 3.1 Schéma Prisma optimisé avec index de performance

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

### 3.2 Scripts de migration et optimisation

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

## 4. API REST complète

### 4.1 Architecture API avec NestJS

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

### 4.2 Endpoints de gestion des parties

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

### 4.3 Endpoints de gameplay

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
    
    // Démarrer le timer pour les devinettes - Document 1 spécification 30s
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

### 4.4 Endpoints d'administration

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

### 4.5 DTOs et validation

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

### 4.6 Types de réponse standardisés

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

## 5. Points d'intégration avec autres documents

### 5.1 Vers Document 1 (Spécifications Fonctionnelles)
- **Logique métier** : Implémentation directe des algorithmes de points et classement
- **États et transitions** : Gestion des statuts WAITING → IN_PROGRESS → FINISHED
- **Règles spéciales** : Grace period 2 minutes, auto-progression, ex aequo
- **Messages système** : Tous les messages d'erreur et statut intégrés

### 5.2 Vers Document 2 (Design System et UX)
- **WebSocket events** : Synchronisation des états visuels en temps réel
- **Timer backend** : Coordination avec timer frontend 30s
- **Feedback utilisateur** : API endpoints pour toutes les interactions
- **États de connexion** : Support complet reconnexion/déconnexion

### 5.3 Vers Document 4 (Architecture Frontend)
- **API REST** : Endpoints standardisés pour toutes les actions
- **Types partagés** : DTOs et interfaces communes
- **État management** : Structure de données optimisée pour Zustand
- **WebSocket client** : Événements et handlers définis

### 5.4 Vers Document 5 (Sécurité, Tests et DevOps)
- **Guards et validation** : Système de sécurité intégré
- **Logging et monitoring** : Audit trail avec GameEvent
- **Health checks** : Endpoints de monitoring
- **Session management** : PlayerSession pour state recovery

### 5.5 Vers Document 6 (Performance et Scalabilité)
- **Index de performance** : Optimisations base de données
- **Caching strategy** : PlayerSession pour reconnexions
- **Analytics** : Vues matérialisées et métriques
- **Scaling hooks** : Architecture modulaire prête pour horizontale

### 5.6 Vers Document 7 (Administration et Configuration)
- **Admin API** : CRUD questions et gestion parties
- **Analytics** : Métriques et statistiques complètes  
- **Configuration** : Variables d'environnement et paramètres
- **Content management** : Système de gestion des 320 questions

---

**Note** : Ce document définit l'architecture backend complète. Pour la logique métier, voir Document 1. Pour l'interface frontend, voir Documents 2 et 4. Pour la sécurité et les tests, voir Document 5.