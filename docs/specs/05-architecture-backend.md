## 5. Architecture Backend - NestJS + PostgreSQL

#### Architecture générale

**Stack technique :**
- **Framework** : NestJS (TypeScript)
- **Base de données** : PostgreSQL avec Prisma ORM
- **Cache** : Redis pour sessions et performance
- **WebSocket** : Socket.IO pour temps réel
- **Authentification** : JWT + OAuth2 (Google, Facebook, Apple)
- **Monitoring** : Prometheus + Grafana
- **Validation** : class-validator + class-transformer

#### Structure du projet backend
```
apps/api/
├── src/
│   ├── auth/                  # *** NOUVEAUTÉ: Module authentification complet ***
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   └── oauth.controller.ts
│   │   ├── services/
│   │   │   ├── auth.service.ts
│   │   │   ├── jwt.service.ts
│   │   │   ├── oauth.service.ts
│   │   │   └── email.service.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   ├── optional-auth.guard.ts
│   │   │   └── guest-session.guard.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   ├── google.strategy.ts
│   │   │   ├── facebook.strategy.ts
│   │   │   └── apple.strategy.ts
│   │   ├── dto/
│   │   │   ├── login.dto.ts
│   │   │   ├── register.dto.ts
│   │   │   ├── reset-password.dto.ts
│   │   │   └── guest-conversion.dto.ts
│   │   └── auth.module.ts
│   ├── users/                 # *** NOUVEAUTÉ: Module utilisateurs ***
│   │   ├── controllers/user.controller.ts
│   │   ├── services/user.service.ts
│   │   ├── dto/update-profile.dto.ts
│   │   └── users.module.ts
│   ├── games/
│   │   ├── controllers/
│   │   │   ├── games.controller.ts
│   │   │   └── game-websocket.gateway.ts
│   │   ├── services/
│   │   │   ├── games.service.ts
│   │   │   └── game-state.service.ts
│   │   ├── dto/
│   │   │   ├── create-game.dto.ts
│   │   │   ├── join-game.dto.ts
│   │   │   └── game-action.dto.ts
│   │   └── games.module.ts
│   ├── questions/             # *** ÉTENDU: Support multilingue ***
│   │   ├── controllers/questions.controller.ts
│   │   ├── services/
│   │   │   ├── questions.service.ts
│   │   │   ├── translation.service.ts
│   │   │   └── i18n.service.ts
│   │   ├── dto/
│   │   │   ├── question.dto.ts
│   │   │   └── translation.dto.ts
│   │   └── questions.module.ts
│   ├── admin/                 # Interface d'administration
│   │   ├── controllers/
│   │   │   ├── admin-games.controller.ts
│   │   │   ├── admin-questions.controller.ts
│   │   │   ├── admin-users.controller.ts
│   │   │   └── admin-translation.controller.ts
│   │   ├── services/
│   │   │   ├── admin.service.ts
│   │   │   └── analytics.service.ts
│   │   └── admin.module.ts
│   ├── common/
│   │   ├── decorators/
│   │   │   ├── public.decorator.ts
│   │   │   ├── optional-auth.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   ├── filters/
│   │   │   ├── http-exception.filter.ts
│   │   │   └── websocket-exception.filter.ts
│   │   ├── guards/
│   │   │   ├── throttler.guard.ts
│   │   │   └── admin.guard.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   └── response.interceptor.ts
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   └── middleware/
│   │       └── session.middleware.ts
│   ├── database/
│   │   ├── migrations/
│   │   ├── seeds/
│   │   └── prisma.service.ts
│   ├── config/
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   ├── auth.config.ts
│   │   └── app.config.ts
│   └── main.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── test/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── docker/
    ├── Dockerfile
    └── docker-compose.yml
```

### 5.1 Modèle de données Prisma étendu

#### Schema Prisma complet avec authentification et i18n
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// *** NOUVEAUTÉ AUTH: Modèles utilisateur complets ***
model User {
  id                    String       @id @default(cuid())
  email                 String       @unique
  hashedPassword        String?      // Null pour OAuth-only users
  firstName             String
  lastName              String
  isActive              Boolean      @default(true)
  isEmailVerified       Boolean      @default(false)
  emailVerificationToken String?     @unique
  passwordResetToken     String?     @unique
  passwordResetExpiresAt DateTime?
  lastLoginAt           DateTime?
  createdAt             DateTime     @default(now())
  updatedAt             DateTime     @updatedAt

  // Relations
  profile               UserProfile?
  statistics            UserStatistics?
  oauthAccounts         OAuthAccount[]
  players               Player[]     // Pour parties jouées
  gameHistory           UserGameHistory[]
  auditLogs             AuditLog[]

  @@map("users")
}

model UserProfile {
  id                    String       @id @default(cuid())
  userId                String       @unique
  avatar                String?
  timezone              String       @default("Europe/Paris")
  language              String       @default("fr")
  isProfilePublic       Boolean      @default(false)
  bio                   String?
  location              String?
  birthDate             DateTime?
  createdAt             DateTime     @default(now())
  updatedAt             DateTime     @updatedAt

  // Relations
  user                  User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_profiles")
}

model UserStatistics {
  id                    String       @id @default(cuid())
  userId                String       @unique
  totalGamesPlayed      Int          @default(0)
  totalGamesWon         Int          @default(0)
  totalPointsScored     Int          @default(0)
  averageScore          Float        @default(0)
  averagePosition       Float        @default(0)
  bestScore             Int          @default(0)
  winRate               Float        @default(0)
  favoriteRoundType     String?
  streakCurrent         Int          @default(0)
  streakBest            Int          @default(0)
  lastGameAt            DateTime?
  createdAt             DateTime     @default(now())
  updatedAt             DateTime     @updatedAt

  // Relations
  user                  User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_statistics")
}

model OAuthAccount {
  id                    String       @id @default(cuid())
  userId                String
  provider              String       // google, facebook, apple
  providerAccountId     String
  accessToken           String?
  refreshToken          String?
  expiresAt             Int?
  tokenType             String?
  scope                 String?
  idToken               String?
  sessionState          String?
  createdAt             DateTime     @default(now())
  updatedAt             DateTime     @updatedAt

  // Relations
  user                  User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("oauth_accounts")
}

model UserGameHistory {
  id                    String       @id @default(cuid())
  userId                String
  gameId                String
  playerId              String
  finalScore            Int
  finalPosition         Int
  isWinner              Boolean
  correctGuesses        Int
  totalQuestions        Int
  averageResponseTime   Float
  gameLocale            String       @default("fr")
  playedAt              DateTime
  createdAt             DateTime     @default(now())

  // Relations
  user                  User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  game                  Game         @relation(fields: [gameId], references: [id], onDelete: Cascade)
  player                Player       @relation(fields: [playerId], references: [id], onDelete: Cascade)

  @@map("user_game_history")
}

model AuditLog {
  id                    String       @id @default(cuid())
  userId                String?
  action                String       // LOGIN, LOGOUT, REGISTER, PASSWORD_RESET, etc.
  details               Json?
  ipAddress             String?
  userAgent             String?
  success               Boolean      @default(true)
  errorMessage          String?
  createdAt             DateTime     @default(now())

  // Relations
  user                  User?        @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@map("audit_logs")
}

// Modèles de jeu existants étendus
model Game {
  id                    String       @id @default(cuid())
  pin                   String       @unique @db.Char(6)
  status                GameStatus   @default(WAITING)
  maxPlayers            Int          @default(7)
  currentRound          Int          @default(1)
  currentTurn           Int          @default(1)
  locale                String       @default("fr") // *** NOUVEAUTÉ: Langue de la partie ***
  creatorId             String?      // *** NOUVEAUTÉ: Créateur authentifié ***
  isGuestAllowed        Boolean      @default(true) // *** NOUVEAUTÉ: Autoriser invités ***
  gameMode              GameMode     @default(CLASSIC)
  settings              Json?        // Configuration avancée
  startedAt             DateTime?
  endedAt               DateTime?
  lastActivity          DateTime     @default(now())
  createdAt             DateTime     @default(now())
  updatedAt             DateTime     @updatedAt

  // Relations
  creator               User?        @relation(fields: [creatorId], references: [id], onDelete: SetNull)
  players               Player[]
  rounds                GameRound[]
  gameHistory           UserGameHistory[]

  @@map("games")
}

model Player {
  id                    String       @id @default(cuid())
  gameId                String
  userId                String?      // *** NOUVEAUTÉ: Lien optionnel vers User ***
  sessionId             String       // Pour invités et utilisateurs
  username              String
  points                Int          @default(0)
  position              Int?
  isCreator             Boolean      @default(false)
  isActive              Boolean      @default(true)
  isGuest               Boolean      @default(true) // *** NOUVEAUTÉ: Distinguer invités ***
  connectionStatus      ConnectionStatus @default(CONNECTED)
  avatar                String?      // *** NOUVEAUTÉ: Avatar utilisateur ou par défaut ***
  lastSeen              DateTime     @default(now())
  joinedAt              DateTime     @default(now())
  createdAt             DateTime     @default(now())
  updatedAt             DateTime     @updatedAt

  // Relations
  game                  Game         @relation(fields: [gameId], references: [id], onDelete: Cascade)
  user                  User?        @relation(fields: [userId], references: [id], onDelete: SetNull)
  answers               Answer[]
  gameHistory           UserGameHistory[]

  @@unique([gameId, username])
  @@map("players")
}

// *** NOUVEAUTÉ I18N: Système de questions multilingues ***
model Question {
  id                    String       @id @default(cuid())
  sourceId              Int          // ID de la question source
  locale                String       // Code langue (fr, en, es, etc.)
  roundType             RoundType
  text                  String
  options               String[]     // Null pour rounds 3-4
  category              String?      // Catégorie thématique
  isActive              Boolean      @default(true)
  translationStatus     TranslationStatus @default(VALIDATED) // Pour fr, PENDING pour autres
  translatedBy          String?      // Email du traducteur
  validatedBy           String?      // Email du validateur
  translationNotes      String?      // Notes de traduction
  culturalContext       String?      // Contexte culturel
  difficulty            Difficulty   @default(MEDIUM)
  usageCount            Int          @default(0) // Compteur d'utilisation
  lastUsedAt            DateTime?    // Dernière utilisation
  createdAt             DateTime     @default(now())
  updatedAt             DateTime     @updatedAt

  // Relations
  rounds                GameRound[]

  @@unique([sourceId, locale]) // Une seule traduction par langue
  @@index([locale, roundType, isActive])
  @@index([translationStatus])
  @@map("questions")
}

model SupportedLocale {
  code                  String       @id // fr, en, es, etc.
  name                  String       // English, Français, etc.
  nativeName            String       // English, Français, etc.
  flag                  String       // Emoji drapeau
  isActive              Boolean      @default(true)
  isDefault             Boolean      @default(false)
  completeness          Float        @default(0) // % de traduction
  lastUpdated           DateTime     @default(now())
  createdAt             DateTime     @default(now())
  updatedAt             DateTime     @updatedAt

  @@map("supported_locales")
}

model TranslationStats {
  id                    String       @id @default(cuid())
  locale                String
  roundType             RoundType
  totalQuestions        Int          @default(0)
  translatedQuestions   Int          @default(0)
  validatedQuestions    Int          @default(0)
  rejectedQuestions     Int          @default(0)
  completeness          Float        @default(0)
  lastCalculated        DateTime     @default(now())
  createdAt             DateTime     @default(now())
  updatedAt             DateTime     @updatedAt

  @@unique([locale, roundType])
  @@map("translation_stats")
}

// Autres modèles existants...
model GameRound {
  id                    String       @id @default(cuid())
  gameId                String
  questionId            String
  roundNumber           Int
  currentPlayerId       String?
  status                RoundStatus  @default(PENDING)
  startedAt             DateTime?
  endedAt               DateTime?
  createdAt             DateTime     @default(now())
  updatedAt             DateTime     @updatedAt

  // Relations
  game                  Game         @relation(fields: [gameId], references: [id], onDelete: Cascade)
  question              Question     @relation(fields: [questionId], references: [id])
  answers               Answer[]

  @@unique([gameId, roundNumber])
  @@map("game_rounds")
}

model Answer {
  id                    String       @id @default(cuid())
  roundId               String
  playerId              String
  type                  AnswerType   // PLAYER_ANSWER ou GUESS
  value                 String?      // Réponse ou null si pas répondu
  isCorrect             Boolean?     // Pour les devinettes
  submittedAt           DateTime?
  createdAt             DateTime     @default(now())
  updatedAt             DateTime     @updatedAt

  // Relations
  round                 GameRound    @relation(fields: [roundId], references: [id], onDelete: Cascade)
  player                Player       @relation(fields: [playerId], references: [id], onDelete: Cascade)

  @@unique([roundId, playerId, type])
  @@map("answers")
}

// Enums
enum GameStatus {
  WAITING
  IN_PROGRESS
  PAUSED
  FINISHED
  CANCELLED
}

enum GameMode {
  CLASSIC
  QUICK
  TOURNAMENT
  CUSTOM
}

enum ConnectionStatus {
  CONNECTED
  DISCONNECTED
  RECONNECTING
}

enum RoundType {
  PERSONALITY
  SITUATIONS
  REPRESENTATIONS
  RELATIONS
}

enum TranslationStatus {
  PENDING
  TRANSLATED
  VALIDATED
  REJECTED
}

enum Difficulty {
  EASY
  MEDIUM
  HARD
}

enum RoundStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  SKIPPED
}

enum AnswerType {
  PLAYER_ANSWER
  GUESS
}
```

### 5.2 Services authentification complets

#### Service principal d'authentification
```typescript
// src/auth/services/auth.service.ts
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private configService: ConfigService,
    private logger: Logger
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, password, firstName, lastName } = registerDto;
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      throw new ConflictException('Un compte existe déjà avec cette adresse email');
    }
    
    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Générer token de vérification email
    const emailVerificationToken = this.generateRandomToken();
    
    // Créer l'utilisateur avec profil et statistiques
    const user = await this.prisma.user.create({
      data: {
        email,
        hashedPassword,
        firstName,
        lastName,
        emailVerificationToken,
        profile: {
          create: {
            language: 'fr', // Par défaut
            timezone: 'Europe/Paris'
          }
        },
        statistics: {
          create: {} // Valeurs par défaut
        }
      },
      include: {
        profile: true,
        statistics: true
      }
    });
    
    // Envoyer email de vérification
    await this.emailService.sendVerificationEmail(
      email, 
      emailVerificationToken
    );
    
    // Logger l'événement
    await this.logAuditEvent(user.id, 'REGISTER', {
      method: 'email',
      firstName: user.firstName
    });
    
    // Générer les tokens JWT
    const tokens = await this.generateTokens(user.id);
    
    return {
      user: this.sanitizeUser(user),
      ...tokens,
      message: 'Compte créé avec succès. Vérifiez votre email pour activer votre compte.'
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password, ipAddress, userAgent } = loginDto;
    
    // Trouver l'utilisateur
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        statistics: true
      }
    });
    
    if (!user) {
      await this.logAuditEvent(null, 'LOGIN_FAILED', {
        email,
        reason: 'user_not_found',
        ipAddress,
        userAgent
      });
      throw new UnauthorizedException('Identifiants invalides');
    }
    
    // Vérifier le mot de passe
    if (!user.hashedPassword) {
      throw new UnauthorizedException('Compte OAuth uniquement. Utilisez la connexion sociale.');
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);
    if (!isPasswordValid) {
      await this.logAuditEvent(user.id, 'LOGIN_FAILED', {
        reason: 'invalid_password',
        ipAddress,
        userAgent
      }, false);
      throw new UnauthorizedException('Identifiants invalides');
    }
    
    // Vérifier si le compte est actif
    if (!user.isActive) {
      throw new UnauthorizedException('Compte désactivé');
    }
    
    // Mettre à jour lastLoginAt
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });
    
    // Logger le succès
    await this.logAuditEvent(user.id, 'LOGIN_SUCCESS', {
      ipAddress,
      userAgent
    });
    
    // Générer les tokens
    const tokens = await this.generateTokens(user.id);
    
    return {
      user: this.sanitizeUser(user),
      ...tokens
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET')
      });
      
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          profile: true,
          statistics: true
        }
      });
      
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Token invalide');
      }
      
      const tokens = await this.generateTokens(user.id);
      
      return {
        user: this.sanitizeUser(user),
        ...tokens
      };
    } catch (error) {
      throw new UnauthorizedException('Token de rafraîchissement invalide');
    }
  }

  async convertGuestToUser(conversionDto: ConvertGuestDto): Promise<ConversionResponse> {
    const { email, password, firstName, lastName, guestSessionId } = conversionDto;
    
    // Vérifier que l'email n'existe pas déjà
    const existingUser = await this.prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      throw new ConflictException('Un compte existe déjà avec cette adresse email');
    }
    
    // Trouver les données de l'invité
    const guestPlayers = await this.prisma.player.findMany({
      where: {
        sessionId: guestSessionId,
        isGuest: true
      },
      include: {
        game: true,
        answers: true
      }
    });
    
    if (guestPlayers.length === 0) {
      throw new NotFoundException('Aucune donnée de session invité trouvée');
    }
    
    // Créer le nouvel utilisateur
    const user = await this.register({
      email,
      password,
      firstName,
      lastName
    });
    
    // Transférer toutes les données de l'invité
    const transferResults = await this.transferGuestData(user.user.id, guestPlayers);
    
    // Logger la conversion
    await this.logAuditEvent(user.user.id, 'GUEST_CONVERSION', {
      guestSessionId,
      transferredGames: transferResults.gamesCount,
      transferredStats: transferResults.statsTransferred
    });
    
    return {
      ...user,
      transferredData: transferResults,
      message: 'Compte créé et données transférées avec succès !'
    };
  }

  private async transferGuestData(userId: string, guestPlayers: any[]): Promise<TransferResult> {
    const transferredGames: string[] = [];
    let totalPoints = 0;
    let totalGames = 0;
    const roundTypeStats = new Map<string, number>();
    
    for (const player of guestPlayers) {
      // Lier le joueur au nouveau compte utilisateur
      await this.prisma.player.update({
        where: { id: player.id },
        data: {
          userId: userId,
          isGuest: false
        }
      });
      
      // Créer un historique de jeu
      await this.prisma.userGameHistory.create({
        data: {
          userId,
          gameId: player.gameId,
          playerId: player.id,
          finalScore: player.points,
          finalPosition: player.position || 0,
          isWinner: player.position === 1,
          correctGuesses: player.answers.filter(a => a.isCorrect).length,
          totalQuestions: player.answers.length,
          averageResponseTime: 0, // À calculer si nécessaire
          gameLocale: player.game.locale,
          playedAt: player.game.endedAt || player.game.createdAt
        }
      });
      
      transferredGames.push(player.gameId);
      totalPoints += player.points;
      totalGames += 1;
    }
    
    // Mettre à jour les statistiques utilisateur
    if (totalGames > 0) {
      await this.prisma.userStatistics.update({
        where: { userId },
        data: {
          totalGamesPlayed: totalGames,
          totalPointsScored: totalPoints,
          averageScore: totalPoints / totalGames,
          lastGameAt: new Date()
        }
      });
    }
    
    return {
      gamesCount: totalGames,
      statsTransferred: true,
      transferredGames
    };
  }

  private async generateTokens(userId: string): Promise<TokenPair> {
    const payload = { sub: userId };
    
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get('JWT_ACCESS_EXPIRES_IN', '15m')
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d')
      })
    ]);
    
    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: any): SafeUser {
    const { hashedPassword, emailVerificationToken, passwordResetToken, ...safeUser } = user;
    return safeUser;
  }

  private generateRandomToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private async logAuditEvent(
    userId: string | null, 
    action: string, 
    details: any, 
    success: boolean = true
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action,
          details,
          success,
          ipAddress: details.ipAddress,
          userAgent: details.userAgent,
          errorMessage: success ? null : details.error
        }
      });
    } catch (error) {
      this.logger.error('Failed to log audit event', error.stack);
    }
  }
}
```

### 5.3 Service de jeu étendu pour authentification

#### GameService avec support auth mixte
```typescript
// src/games/services/games.service.ts
@Injectable()
export class GamesService {
  constructor(
    private prisma: PrismaService,
    private redis: Redis,
    private questionsService: QuestionsService,
    private logger: Logger
  ) {}

  async create(
    createGameDto: CreateGameDto, 
    creatorInfo: AuthenticatedUser | GuestSession
  ): Promise<GameResponse> {
    
    // Générer PIN unique
    let pin: string;
    let attempts = 0;
    const maxAttempts = 10;
    
    do {
      pin = this.generateGamePin();
      attempts++;
      
      const existingGame = await this.prisma.game.findUnique({
        where: { pin }
      });
      
      if (!existingGame) break;
      
      if (attempts >= maxAttempts) {
        throw new InternalServerErrorException('Impossible de générer un PIN unique');
      }
    } while (true);
    
    // Déterminer les propriétés du créateur
    const isAuthenticated = 'userId' in creatorInfo;
    const creatorId = isAuthenticated ? creatorInfo.userId : null;
    const locale = createGameDto.locale || creatorInfo.locale || 'fr';
    
    // Créer la partie
    const game = await this.prisma.game.create({
      data: {
        pin,
        maxPlayers: createGameDto.maxPlayers || 7,
        locale,
        creatorId,
        isGuestAllowed: createGameDto.allowGuests ?? true,
        gameMode: createGameDto.gameMode || 'CLASSIC',
        settings: createGameDto.settings
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profile: {
              select: { avatar: true }
            }
          }
        }
      }
    });
    
    // Créer le joueur créateur
    const creatorPlayer = await this.prisma.player.create({
      data: {
        gameId: game.id,
        userId: creatorId,
        sessionId: creatorInfo.sessionId,
        username: isAuthenticated 
          ? `${creatorInfo.firstName} ${creatorInfo.lastName}` 
          : createGameDto.username || 'Créateur',
        isCreator: true,
        isGuest: !isAuthenticated,
        avatar: isAuthenticated ? creatorInfo.avatar : null
      }
    });
    
    // Logger la création
    this.logger.log('Game created', {
      gameId: game.id,
      pin: game.pin,
      creator: isAuthenticated ? 'authenticated' : 'guest',
      locale: game.locale
    });
    
    return {
      game: this.sanitizeGameForResponse(game),
      player: this.sanitizePlayerForResponse(creatorPlayer)
    };
  }

  async joinGame(
    pin: string, 
    joinGameDto: JoinGameDto, 
    playerInfo: AuthenticatedUser | GuestSession
  ): Promise<JoinGameResponse> {
    
    // Trouver la partie
    const game = await this.prisma.game.findUnique({
      where: { pin },
      include: {
        players: {
          where: { isActive: true }
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    if (!game) {
      throw new NotFoundException('Partie non trouvée');
    }
    
    if (game.status !== 'WAITING') {
      throw new BadRequestException('Cette partie a déjà commencé');
    }
    
    if (game.players.length >= game.maxPlayers) {
      throw new BadRequestException(`Cette partie est complète (${game.maxPlayers} joueurs maximum)`);
    }
    
    // Vérifier que l'utilisateur n'est pas déjà dans la partie
    const existingPlayer = game.players.find(p => 
      ('userId' in playerInfo && p.userId === playerInfo.userId) ||
      p.sessionId === playerInfo.sessionId ||
      p.username === joinGameDto.username
    );
    
    if (existingPlayer) {
      if (existingPlayer.isActive) {
        throw new BadRequestException('Vous êtes déjà dans cette partie');
      }
      
      // Réactiver le joueur si déconnecté
      const reactivatedPlayer = await this.prisma.player.update({
        where: { id: existingPlayer.id },
        data: {
          isActive: true,
          connectionStatus: 'CONNECTED',
          lastSeen: new Date()
        }
      });
      
      return {
        game: this.sanitizeGameForResponse(game),
        player: this.sanitizePlayerForResponse(reactivatedPlayer),
        rejoined: true
      };
    }
    
    // Vérifier les permissions pour les invités
    const isAuthenticated = 'userId' in playerInfo;
    if (!isAuthenticated && !game.isGuestAllowed) {
      throw new ForbiddenException('Cette partie n\'autorise que les utilisateurs connectés');
    }
    
    // Créer le nouveau joueur
    const newPlayer = await this.prisma.player.create({
      data: {
        gameId: game.id,
        userId: isAuthenticated ? playerInfo.userId : null,
        sessionId: playerInfo.sessionId,
        username: joinGameDto.username,
        isGuest: !isAuthenticated,
        avatar: isAuthenticated ? playerInfo.avatar : null
      }
    });
    
    // Mettre à jour l'activité de la partie
    await this.prisma.game.update({
      where: { id: game.id },
      data: { lastActivity: new Date() }
    });
    
    // Logger la jointure
    this.logger.log('Player joined game', {
      gameId: game.id,
      playerId: newPlayer.id,
      username: newPlayer.username,
      playerType: isAuthenticated ? 'authenticated' : 'guest',
      totalPlayers: game.players.length + 1
    });
    
    return {
      game: this.sanitizeGameForResponse(game),
      player: this.sanitizePlayerForResponse(newPlayer),
      rejoined: false
    };
  }

  async getGameState(
    gameId: string, 
    requesterId: string
  ): Promise<GameStateResponse> {
    
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      include: {
        players: {
          where: { isActive: true },
          orderBy: { position: 'asc' }
        },
        rounds: {
          where: {
            status: { in: ['IN_PROGRESS', 'COMPLETED'] }
          },
          include: {
            question: true,
            answers: true
          },
          orderBy: { roundNumber: 'desc' },
          take: 1
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
    
    if (!game) {
      throw new NotFoundException('Partie non trouvée');
    }
    
    // Vérifier que le demandeur fait partie de la partie
    const requesterPlayer = game.players.find(p => 
      p.userId === requesterId || p.sessionId === requesterId
    );
    
    if (!requesterPlayer) {
      throw new ForbiddenException('Vous ne faites pas partie de cette partie');
    }
    
    // Construire la réponse selon l'état du jeu
    const gameState: GameStateResponse = {
      game: {
        id: game.id,
        pin: game.pin,
        status: game.status,
        currentRound: game.currentRound,
        currentTurn: game.currentTurn,
        locale: game.locale,
        maxPlayers: game.maxPlayers,
        startedAt: game.startedAt,
        lastActivity: game.lastActivity
      },
      players: game.players.map(this.sanitizePlayerForResponse),
      currentPlayer: requesterPlayer,
      currentQuestion: null,
      canAdvance: false,
      isMyTurn: false
    };
    
    // Ajouter les détails du round actuel si en cours
    if (game.status === 'IN_PROGRESS' && game.rounds.length > 0) {
      const currentRound = game.rounds[0];
      
      gameState.currentQuestion = {
        id: currentRound.question.id,
        text: currentRound.question.text,
        options: currentRound.question.options,
        roundType: currentRound.question.roundType,
        category: currentRound.question.category
      };
      
      // Déterminer qui peut avancer et si c'est le tour du joueur
      const myAnswer = currentRound.answers.find(a => 
        a.playerId === requesterPlayer.id && a.type === 'PLAYER_ANSWER'
      );
      const allAnswers = currentRound.answers.filter(a => a.type === 'PLAYER_ANSWER');
      const allGuesses = currentRound.answers.filter(a => a.type === 'GUESS');
      
      gameState.isMyTurn = requesterPlayer.id === currentRound.currentPlayerId;
      gameState.canAdvance = this.canPlayerAdvanceGame(requesterPlayer, currentRound, allAnswers, allGuesses);
    }
    
    return gameState;
  }

  private canPlayerAdvanceGame(
    player: any, 
    round: any, 
    answers: any[], 
    guesses: any[]
  ): boolean {
    // Logique d'auto-avancement : le dernier à répondre peut faire avancer
    if (round.status === 'IN_PROGRESS') {
      // Phase de réponse : le joueur actif a-t-il répondu ?
      if (player.id === round.currentPlayerId) {
        const myAnswer = answers.find(a => a.playerId === player.id);
        return !!myAnswer;
      }
      
      // Phase de devinette : ai-je deviné et suis-je le dernier ?
      const myGuess = guesses.find(g => g.playerId === player.id);
      if (myGuess) {
        const totalPlayersWhoShouldGuess = round.game.players.length - 1; // Sauf celui qui répond
        return guesses.length === totalPlayersWhoShouldGuess;
      }
    }
    
    return false;
  }

  private sanitizeGameForResponse(game: any): any {
    return {
      id: game.id,
      pin: game.pin,
      status: game.status,
      maxPlayers: game.maxPlayers,
      locale: game.locale,
      createdAt: game.createdAt,
      startedAt: game.startedAt,
      creator: game.creator ? {
        firstName: game.creator.firstName,
        lastName: game.creator.lastName
      } : null
    };
  }

  private sanitizePlayerForResponse(player: any): any {
    return {
      id: player.id,
      username: player.username,
      points: player.points,
      position: player.position,
      isCreator: player.isCreator,
      isGuest: player.isGuest,
      connectionStatus: player.connectionStatus,
      avatar: player.avatar,
      joinedAt: player.joinedAt
    };
  }

  private generateGamePin(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
```

### 5.4 Guards d'authentification flexibles

#### OptionalAuthGuard - Support auth mixte
```typescript
// src/auth/guards/optional-auth.guard.ts
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private logger: Logger
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Extraire le token d'authentification
    const token = this.extractTokenFromHeader(request);
    
    if (token) {
      try {
        // Tenter l'authentification JWT
        const payload = this.jwtService.verify(token);
        const user = await this.prisma.user.findUnique({
          where: { id: payload.sub },
          include: {
            profile: true,
            statistics: true
          }
        });
        
        if (user && user.isActive) {
          // Utilisateur authentifié
          request.user = user;
          request.isAuthenticated = true;
          request.userId = user.id;
          request.sessionId = request.headers['x-session-id'] || `auth_${user.id}`;
          
          this.logger.debug(`Authenticated user: ${user.email}`);
          return true;
        }
      } catch (error) {
        this.logger.debug('JWT verification failed, treating as guest', error.message);
      }
    }
    
    // Mode invité - extraire session ID
    const guestSessionId = request.headers['x-guest-session'] || 
                          request.headers['x-session-id'] ||
                          this.generateGuestSessionId();
    
    // Configuration invité
    request.isAuthenticated = false;
    request.isGuest = true;
    request.sessionId = guestSessionId;
    request.guestSession = {
      sessionId: guestSessionId,
      locale: request.headers['accept-language']?.split(',')[0]?.substring(0, 2) || 'fr',
      userAgent: request.headers['user-agent'],
      ipAddress: request.ip,
      createdAt: new Date()
    };
    
    this.logger.debug(`Guest session: ${guestSessionId}`);
    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private generateGuestSessionId(): string {
    return `guest_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }
}
```

### 5.5 Configuration et déploiement

#### Configuration Redis pour sessions et cache
```typescript
// src/config/redis.config.ts
import { ConfigService } from '@nestjs/config';
import { RedisOptions } from 'ioredis';

export const getRedisConfig = (configService: ConfigService): RedisOptions => {
  const redisUrl = configService.get<string>('REDIS_URL');
  
  if (redisUrl) {
    return {
      host: new URL(redisUrl).hostname,
      port: parseInt(new URL(redisUrl).port) || 6379,
      password: new URL(redisUrl).password || undefined,
      db: 0,
      retryDelayOnFailover: 100,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    };
  }
  
  return {
    host: configService.get<string>('REDIS_HOST', 'localhost'),
    port: configService.get<number>('REDIS_PORT', 6379),
    password: configService.get<string>('REDIS_PASSWORD'),
    db: 0,
    retryDelayOnFailover: 100,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 3,
    lazyConnect: true
  };
};
```

#### Module principal étendu
```typescript
// src/app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env']
    }),
    
    DatabaseModule,
    RedisModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getRedisConfig
    }),
    
    // *** NOUVEAUTÉ: Modules d'authentification ***
    AuthModule,
    UsersModule,
    
    // Modules existants étendus
    GamesModule,
    QuestionsModule,
    AdminModule,
    
    // Modules de surveillance
    MonitoringModule,
    
    // Throttling global
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ttl: config.get<number>('RATE_LIMIT_WINDOW_MS', 60000),
        limit: config.get<number>('RATE_LIMIT_MAX_REQUESTS', 100)
      })
    })
  ],
  
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor
    }
  ]
})
export class AppModule {}
```

### 5.6 Types et interfaces de réponse

#### Interfaces de réponse API
```typescript
// src/common/interfaces/auth-responses.interface.ts
export interface AuthResponse {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
  message?: string;
}

export interface ConversionResponse extends AuthResponse {
  transferredData: TransferResult;
}

export interface SafeUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt: Date | null;
  profile?: UserProfile;
  statistics?: UserStatistics;
}

export interface TransferResult {
  gamesCount: number;
  statsTransferred: boolean;
  transferredGames: string[];
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
```

#### Interfaces de session
```typescript
// src/common/interfaces/session.interface.ts
export interface GuestSessionStats {
  gamesPlayed: number;
  bestScore: number;
  averagePosition: number;
  totalPoints: number;
  winRate: number;
  favoriteRoundType?: string;
}

export interface GuestSession {
  sessionId: string;
  locale: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
}

export interface AuthenticatedUser extends SafeUser {
  userId: string;
  avatar?: string;
}
```

#### Interfaces de jeu
```typescript
// src/common/interfaces/game-responses.interface.ts
export interface GameResponse {
  game: Game;
  player: Player;
}

export interface JoinGameResponse extends GameResponse {
  rejoined: boolean;
}

export interface GameStateResponse {
  game: {
    id: string;
    pin: string;
    status: GameStatus;
    currentRound: number;
    currentTurn: number;
    locale: string;
    maxPlayers: number;
    startedAt: Date | null;
    lastActivity: Date;
  };
  players: Player[];
  currentPlayer: Player;
  currentQuestion: Question | null;
  canAdvance: boolean;
  isMyTurn: boolean;
}
```

### 5.7 Endpoints API REST complets

#### Authentification
```typescript
// src/auth/controllers/auth.controller.ts
@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @HttpCode(201)
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDto: LoginDto, @Req() req): Promise<AuthResponse> {
    return this.authService.login({
      ...loginDto,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body('refreshToken') refreshToken: string): Promise<AuthResponse> {
    return this.authService.refreshToken(refreshToken);
  }

  @Post('convert-guest')
  @HttpCode(201)
  async convertGuest(@Body() convertDto: ConvertGuestDto): Promise<ConversionResponse> {
    return this.authService.convertGuestToUser(convertDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async logout(@Req() req): Promise<void> {
    await this.authService.logout(req.user.id);
  }

  @Post('verify-email/:token')
  @HttpCode(200)
  async verifyEmail(@Param('token') token: string): Promise<{ message: string }> {
    await this.authService.verifyEmail(token);
    return { message: 'Email vérifié avec succès' };
  }

  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body('email') email: string): Promise<{ message: string }> {
    await this.authService.forgotPassword(email);
    return { message: 'Email de réinitialisation envoyé' };
  }

  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() resetDto: ResetPasswordDto): Promise<{ message: string }> {
    await this.authService.resetPassword(resetDto);
    return { message: 'Mot de passe réinitialisé avec succès' };
  }
}
```

#### Jeux
```typescript
// src/games/controllers/games.controller.ts
@Controller('api/games')
export class GamesController {
  constructor(private gamesService: GamesService) {}

  @Post('create')
  @UseGuards(OptionalAuthGuard)
  @HttpCode(201)
  async create(
    @Body() createGameDto: CreateGameDto,
    @Req() req
  ): Promise<GameResponse> {
    const creatorInfo = req.user || req.guestSession;
    return this.gamesService.create(createGameDto, creatorInfo);
  }

  @Post(':pin/join')
  @UseGuards(OptionalAuthGuard)
  @HttpCode(200)
  async join(
    @Param('pin') pin: string,
    @Body() joinGameDto: JoinGameDto,
    @Req() req
  ): Promise<JoinGameResponse> {
    const playerInfo = req.user || req.guestSession;
    return this.gamesService.joinGame(pin, joinGameDto, playerInfo);
  }

  @Get(':id/state')
  @UseGuards(OptionalAuthGuard)
  async getState(
    @Param('id') gameId: string,
    @Req() req
  ): Promise<GameStateResponse> {
    const requesterId = req.user?.id || req.sessionId;
    return this.gamesService.getGameState(gameId, requesterId);
  }

  @Post(':id/start')
  @UseGuards(OptionalAuthGuard)
  @HttpCode(200)
  async start(
    @Param('id') gameId: string,
    @Req() req
  ): Promise<{ success: boolean }> {
    await this.gamesService.startGame(gameId, req.user?.id || req.sessionId);
    return { success: true };
  }

  @Get('active')
  @UseGuards(JwtAuthGuard)
  async getActiveGames(@Req() req): Promise<Game[]> {
    return this.gamesService.getUserActiveGames(req.user.id);
  }
}
```