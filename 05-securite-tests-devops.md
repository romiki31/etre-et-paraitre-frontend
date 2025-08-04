# Document 5/7 : Sécurité, Tests et DevOps - Projet Epercept

## Scope de ce document
Ce document définit l'architecture complète de sécurité, la stratégie de tests et l'infrastructure DevOps pour l'application Epercept. Il couvre les aspects défensifs, les bonnes pratiques de sécurité, la stratégie de tests multi-niveaux et l'automatisation CI/CD.

## Autres documents du projet
- Document 1/7 : Spécifications Fonctionnelles et Règles Métier ✓
- Document 2/7 : Design System et Expérience Utilisateur ✓
- Document 3/7 : Architecture Backend ✓
- Document 4/7 : Architecture Frontend ✓
- Document 6/7 : Performance et Scalabilité ✓
- Document 7/7 : Administration et Configuration ✓

---

## 1. Architecture de sécurité renforcée

### 1.1 Stratégie de sécurité multi-niveaux

#### 1. Validation et assainissement des inputs

```typescript
// Validation avancée avec prévention brute-force
@Injectable()
export class ValidationService {
  constructor(
    private readonly redis: Redis,
    private readonly gameService: GamesService
  ) {}
  
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
  
  private async getProfanityList(): Promise<string[]> {
    // Charger depuis cache ou base de données
    const cached = await this.redis.get('profanity_words');
    return cached ? JSON.parse(cached) : [];
  }
}
```

#### 2. Protection contre les attaques

```typescript
// Protection DDoS et limitation de débit
@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);
  
  constructor(private readonly redis: Redis) {}
  
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

interface ActivityPattern {
  type: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: number;
  metadata?: any;
}
```

#### 3. Guards et middleware de sécurité

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

#### 4. Chiffrement et protection des données

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

interface EncryptedData {
  encrypted: string;
  iv: string;
  authTag: string;
}
```

#### 5. Protection OWASP Top 10

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

#### 6. Audit et logging de sécurité

```typescript
// Service d'audit sécurité
@Injectable()
export class SecurityAuditService {
  private readonly logger = new Logger(SecurityAuditService.name);
  
  constructor(
    private readonly redis: Redis,
    private readonly notificationService: NotificationService
  ) {}
  
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
  
  private async initiateEmergencyResponse(auditLog: any): Promise<void> {
    // Mesures d'urgence : bloquer IP, invalider sessions, etc.
    this.logger.error('EMERGENCY_RESPONSE_TRIGGERED', auditLog);
  }
}

interface SecurityEvent {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip: string;
  userAgent: string;
  sessionId?: string;
  details: {
    factors?: string[];
    [key: string]: any;
  };
}
```

## 2. Stratégie de tests complète

### 2.1 Architecture de tests

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

### 2.2 Tests unitaires

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

### 2.3 Tests d'intégration

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

### 2.4 Tests End-to-End (E2E)

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
      await expect(player1.locator('[data-testid="player-list"]')).toContainText('Charlie');
      
      // Démarrage automatique de la partie
      await expect(player1.locator('[data-testid="game-status"]')).toContainText('Partie en cours');
      
      // Premier tour - Alice répond
      await expect(player1.locator('[data-testid="question-text"]')).toBeVisible();
      await player1.click('[data-testid="answer-option-1"]');
      await player1.click('[data-testid="submit-answer-btn"]');
      
      // Bob et Charlie devinent
      await Promise.all([
        submitGuess(player2, 1),
        submitGuess(player3, 2)
      ]);
      
      // Vérifier révélation
      await expect(player1.locator('[data-testid="results-screen"]')).toBeVisible();
      
    } finally {
      await context1.close();
      await context2.close();
      await context3.close();
    }
  });
});

async function joinGame(page: Page, pin: string, username: string) {
  await page.goto('/');
  await page.fill('[data-testid="pin-input"]', pin);
  await page.fill('[data-testid="username-input"]', username);
  await page.click('[data-testid="join-game-btn"]');
}

async function submitGuess(page: Page, optionIndex: number) {
  await page.click(`[data-testid="guess-option-${optionIndex}"]`);
  await page.click('[data-testid="submit-guess-btn"]');
}
```

### 2.5 Tests de sécurité

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
  
  describe('Authentication', () => {
    it('should require valid session for protected endpoints', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/games/fake-id/state')
        .expect(401);
    });
    
    it('should validate session integrity', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/games/fake-id/state')
        .set('x-session-id', 'invalid-session')
        .expect(401);
    });
  });
});
```

## 3. Pipeline DevOps et CI/CD

### 3.1 Configuration CI/CD GitHub Actions

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
  
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm audit --audit-level high
      - run: npm run test:security
```

### 3.2 Logging structuré et monitoring

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

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  tags: { [key: string]: string };
  timestamp: number;
}
```

## 4. Points d'intégration avec autres documents

### 4.1 Vers Document 1 (Spécifications Fonctionnelles)
- **Validation métier** : Tests de toutes les règles de jeu et contraintes
- **États et transitions** : Tests des workflows complets de parties
- **Edge cases** : Tests des scénarios de déconnexion et erreurs
- **Messages d'erreur** : Validation de tous les messages système

### 4.2 Vers Document 2 (Design System et UX)
- **Tests visuels** : Validation des composants selon design system
- **Responsive testing** : Tests cross-browser et devices
- **Accessibility testing** : Validation WCAG et screen readers
- **Performance UX** : Tests de fluidité animations et interactions

### 4.3 Vers Document 3 (Architecture Backend)
- **API testing** : Tests de tous les endpoints REST et WebSocket
- **Database testing** : Tests d'intégrité et performance des requêtes
- **Security testing** : Tests des guards, validation et rate limiting
- **Integration testing** : Tests des services et contrôleurs

### 4.4 Vers Document 4 (Architecture Frontend)
- **Component testing** : Tests unitaires des composants React
- **Hook testing** : Tests des hooks personnalisés (useAutoScroll, useSocket)
- **Store testing** : Tests du store Zustand et actions
- **E2E testing** : Tests des flows utilisateur complets

### 4.5 Vers Document 6 (Performance et Scalabilité)
- **Load testing** : Tests de charge et stress avec k6
- **Performance testing** : Tests de métriques et optimisations
- **Memory testing** : Tests de fuites mémoire et garbage collection
- **WebSocket testing** : Tests de performance temps réel

### 4.6 Vers Document 7 (Administration et Configuration)
- **Configuration testing** : Tests des variables d'environnement
- **Admin testing** : Tests des interfaces d'administration
- **Monitoring testing** : Tests des métriques et alertes
- **Deployment testing** : Tests des pipelines de déploiement

---

**Note** : Ce document définit la sécurité et la qualité complètes. Pour la logique métier, voir Document 1. Pour l'implémentation technique, voir Documents 3 et 4. Pour la performance, voir Document 6.