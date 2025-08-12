## 7. Stratégie de tests complète

### 7.1 Architecture de tests

**⚠️ COHÉRENCE MONITORING** : Les tests doivent valider les métriques `epercept_*` définies dans le monitoring.

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
      branches: 80,    // Standard unifié avec monitoring
      functions: 80,   // Standard unifié avec monitoring
      lines: 80,       // Standard unifié avec monitoring
      statements: 80   // Standard unifié avec monitoring
    }
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.{ts,tsx}',
    '<rootDir>/test/**/*.test.{ts,tsx}'
  ],
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts']
};
```

### 7.2 Tests unitaires

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
      const createGameDto = { maxPlayers: 7 };
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
          maxPlayers: 7,
          status: GameStatus.WAITING
        })
      });
      
      // Vérifier que métrique epercept_games_created_total sera incrémentée
      // (cohérence avec monitoring système)
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
      
      // Vérifier que métrique epercept_players_joined_total sera incrémentée
      // avec label game_size: 7 (cohérence monitoring)
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
      const createDto = { maxPlayers: 7 };
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

#### *** NOUVEAUTÉ: Tests spécifiques internationalisation ***

```typescript
// test/unit/i18n.service.test.ts
describe('I18nService', () => {
  let i18nService: I18nService;
  let mockPrisma: jest.Mocked<PrismaService>;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        I18nService,
        {
          provide: PrismaService,
          useValue: createMockPrisma()
        }
      ]
    }).compile();
    
    i18nService = module.get(I18nService);
    mockPrisma = module.get(PrismaService);
  });
  
  describe('detectLocale', () => {
    it('should detect French from Accept-Language header', () => {
      const acceptLanguage = 'fr-FR,fr;q=0.9,en;q=0.8';
      const result = i18nService.detectLocale(acceptLanguage);
      expect(result).toBe('fr');
    });
    
    it('should detect English as fallback', () => {
      const acceptLanguage = 'en-US,en;q=0.9';
      const result = i18nService.detectLocale(acceptLanguage);
      expect(result).toBe('en');
    });
    
    it('should fallback to French for unsupported languages', () => {
      const acceptLanguage = 'zh-CN,zh;q=0.9';
      const result = i18nService.detectLocale(acceptLanguage);
      expect(result).toBe('fr');
    });
  });
  
  describe('getSupportedLocales', () => {
    it('should return all supported locales with metadata', async () => {
      const mockLocales = [
        { code: 'fr', name: 'Français', completeness: 100 },
        { code: 'en', name: 'English', completeness: 0 }
      ];
      
      mockPrisma.supportedLocale.findMany.mockResolvedValue(mockLocales as any);
      
      const result = await i18nService.getSupportedLocales();
      
      expect(result).toEqual(mockLocales);
      expect(mockPrisma.supportedLocale.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { completeness: 'desc' }
      });
    });
  });
});

// test/unit/questions.service.test.ts  
describe('QuestionsService - Multilingual', () => {
  let questionsService: QuestionsService;
  let mockPrisma: jest.Mocked<PrismaService>;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        QuestionsService,
        {
          provide: PrismaService,
          useValue: createMockPrisma()
        }
      ]
    }).compile();
    
    questionsService = module.get(QuestionsService);
    mockPrisma = module.get(PrismaService);
  });
  
  describe('getQuestionsByRound', () => {
    it('should return questions in requested language', async () => {
      const mockQuestions = [
        {
          sourceId: 1,
          locale: 'en',
          text: 'Your true friends, you count them...',
          options: ['On one hand', 'On both hands']
        }
      ];
      
      mockPrisma.question.findMany.mockResolvedValue(mockQuestions as any);
      
      const result = await questionsService.getQuestionsByRound(
        RoundType.PERSONALITY,
        'en',
        []
      );
      
      expect(result).toEqual(mockQuestions);
      expect(mockPrisma.question.findMany).toHaveBeenCalledWith({
        where: {
          roundType: RoundType.PERSONALITY,
          locale: 'en',
          isActive: true,
          sourceId: { notIn: [] }
        },
        select: expect.any(Object)
      });
    });
    
    it('should fallback to French when translation incomplete', async () => {
      // Première requête: questions en anglais (insuffisantes)
      mockPrisma.question.findMany
        .mockResolvedValueOnce([]) // Aucune question en anglais
        .mockResolvedValueOnce([ // Questions en français (fallback)
          {
            sourceId: 1,
            locale: 'fr',
            text: 'Tes vrais amis, tu les comptes...',
            options: ['Sur une main', 'Sur les deux mains']
          }
        ] as any);
      
      const result = await questionsService.getQuestionsByRound(
        RoundType.PERSONALITY,
        'en',
        []
      );
      
      expect(result).toHaveLength(1);
      expect(result[0].locale).toBe('fr');
      expect(mockPrisma.question.findMany).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('getTranslations', () => {
    it('should return all translations for a source question', async () => {
      const mockTranslations = [
        { sourceId: 1, locale: 'en', text: 'English text', translationStatus: 'VALIDATED' },
        { sourceId: 1, locale: 'es', text: 'Texto español', translationStatus: 'PENDING' }
      ];
      
      mockPrisma.question.findMany.mockResolvedValue(mockTranslations as any);
      
      const result = await questionsService.getTranslations(1);
      
      expect(result).toEqual(mockTranslations);
      expect(mockPrisma.question.findMany).toHaveBeenCalledWith({
        where: {
          sourceId: 1,
          locale: { not: 'fr' } // Exclure la version source française
        }
      });
    });
  });
  
  describe('getTranslationStatistics', () => {
    it('should calculate translation completeness by locale', async () => {
      const mockStats = [
        { locale: 'en', total: 50, validated: 30 },
        { locale: 'es', total: 20, validated: 15 }
      ];
      
      // Mock de la requête agrégée Prisma
      mockPrisma.$queryRaw.mockResolvedValue(mockStats);
      
      const result = await questionsService.getTranslationStatistics();
      
      expect(result.byLocale).toHaveProperty('en');
      expect(result.byLocale.en.completeness).toBe(60); // 30/50
      expect(result.averageCompleteness).toBeCloseTo(67.5); // (60+75)/2
    });
  });
});

// test/unit/game.service.test.ts - Extension pour langue
describe('GameService - Multilingual Extensions', () => {
  let gameService: GameService;
  let mockPrisma: jest.Mocked<PrismaService>;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GameService,
        {
          provide: PrismaService,
          useValue: createMockPrisma()
        }
      ]
    }).compile();
    
    gameService = module.get(GameService);
    mockPrisma = module.get(PrismaService);
  });
  
  describe('createGame', () => {
    it('should create game with creator locale', async () => {
      const createGameDto = { maxPlayers: 7, locale: 'es' };
      const expectedGame = {
        id: 'game-1',
        pin: '123456',
        locale: 'es',
        status: GameStatus.WAITING
      };
      
      mockPrisma.game.create.mockResolvedValue(expectedGame as any);
      
      const result = await gameService.create(createGameDto, 'creator-id');
      
      expect(result.locale).toBe('es');
      expect(mockPrisma.game.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ locale: 'es' })
      });
    });
  });
  
  describe('getGameWithQuestions', () => {
    it('should preload questions in game locale', async () => {
      const gameId = 'game-1';
      const mockGame = {
        id: gameId,
        locale: 'en',
        status: GameStatus.IN_PROGRESS
      };
      
      mockPrisma.game.findUnique.mockResolvedValue(mockGame as any);
      
      const result = await gameService.getGameWithQuestions(gameId);
      
      expect(result.locale).toBe('en');
      // Vérifier que les questions sont pré-chargées dans la bonne langue
      expect(mockPrisma.question.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({ locale: 'en' })
      });
    });
  });
});
```

#### *** NOUVEAUTÉ AUTH: Tests d'authentification ***

##### Tests unitaires du service d'authentification
```typescript
// test/unit/auth.service.test.ts
describe('AuthService', () => {
  let authService: AuthService;
  let mockPrisma: jest.Mocked<PrismaService>;
  let mockJwtService: jest.Mocked<JwtService>;
  let mockEmailService: jest.Mocked<EmailService>;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: createMockPrisma() },
        { provide: JwtService, useValue: createMockJwt() },
        { provide: EmailService, useValue: createMockEmail() }
      ]
    }).compile();
    
    authService = module.get(AuthService);
    mockPrisma = module.get(PrismaService);
    mockJwtService = module.get(JwtService);
    mockEmailService = module.get(EmailService);
  });

  describe('register', () => {
    it('should create user with hashed password', async () => {
      // Arrange
      const registerData = {
        email: 'test@example.com',
        password: 'SecurePass123',
        firstName: 'John',
        lastName: 'Doe'
      };
      
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: registerData.email,
        hashedPassword: 'hashed-password',
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        emailVerificationToken: 'token-123'
      } as any);

      // Act
      const result = await authService.register(registerData);

      // Assert
      expect(result).toBeDefined();
      expect(result.email).toBe(registerData.email);
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledWith(
        registerData.email,
        'token-123'
      );
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: registerData.email,
          hashedPassword: expect.any(String),
          profile: { create: expect.any(Object) },
          statistics: { create: {} }
        }),
        include: expect.any(Object)
      });
    });

    it('should throw error if email already exists', async () => {
      // Arrange
      const registerData = { email: 'existing@example.com', password: 'pass' };
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' } as any);

      // Act & Assert
      await expect(authService.register(registerData)).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should authenticate user with valid credentials', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'ValidPass123',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent'
      };
      
      const mockUser = {
        id: 'user-1',
        email: loginData.email,
        hashedPassword: 'hashed-password',
        isActive: true
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('mock-token');

      // Act
      const result = await authService.login(loginData);

      // Assert
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { lastLoginAt: expect.any(Date) }
      });
    });

    it('should throw error for invalid credentials', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.login({
        email: 'wrong@example.com',
        password: 'wrong',
        ipAddress: '127.0.0.1',
        userAgent: 'test'
      })).rejects.toThrow('Invalid credentials');
    });
  });

  describe('convertGuestToUser', () => {
    it('should transfer guest data to new user account', async () => {
      // Arrange
      const convertData = {
        email: 'convert@example.com',
        password: 'NewPass123',
        firstName: 'Jane',
        lastName: 'Doe',
        guestSessionId: 'guest-session-123'
      };

      const mockGuestPlayers = [
        {
          id: 'player-1',
          gameId: 'game-1',
          points: 100,
          position: 2,
          answers: [{ isCorrect: true }, { isCorrect: false }],
          game: { locale: 'fr' }
        }
      ];

      mockPrisma.player.findMany.mockResolvedValue(mockGuestPlayers as any);
      mockPrisma.user.create.mockResolvedValue({ id: 'new-user' } as any);
      jest.spyOn(authService, 'register').mockResolvedValue({ id: 'new-user' } as any);

      // Act
      const result = await authService.convertGuestToUser(convertData);

      // Assert
      expect(result).toHaveProperty('transferredGamesCount', 1);
      expect(mockPrisma.player.update).toHaveBeenCalledWith({
        where: { id: 'player-1' },
        data: { userId: 'new-user', isGuest: false }
      });
      expect(mockPrisma.userGameHistory.create).toHaveBeenCalled();
    });
  });
});
```

##### Tests des guards d'authentification
```typescript
// test/unit/auth.guards.test.ts
describe('OptionalAuthGuard', () => {
  let guard: OptionalAuthGuard;
  let mockJwtService: jest.Mocked<JwtService>;
  let mockPrisma: jest.Mocked<PrismaService>;

  beforeEach(() => {
    mockJwtService = { verify: jest.fn() } as any;
    mockPrisma = { user: { findUnique: jest.fn() } } as any;
    guard = new OptionalAuthGuard(mockJwtService, mockPrisma);
  });

  it('should allow access for authenticated users', async () => {
    // Arrange
    const mockRequest = {
      headers: { authorization: 'Bearer valid-token' }
    };
    const mockContext = {
      switchToHttp: () => ({ getRequest: () => mockRequest })
    } as any;

    mockJwtService.verify.mockReturnValue({ sub: 'user-1' });
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' } as any);

    // Act
    const result = await guard.canActivate(mockContext);

    // Assert
    expect(result).toBe(true);
    expect(mockRequest.user).toBeDefined();
    expect(mockRequest.isAuthenticated).toBe(true);
  });

  it('should allow access for guests without token', async () => {
    // Arrange
    const mockRequest = {
      headers: { 'x-guest-session': 'guest-123' }
    };
    const mockContext = {
      switchToHttp: () => ({ getRequest: () => mockRequest })
    } as any;

    // Act
    const result = await guard.canActivate(mockContext);

    // Assert
    expect(result).toBe(true);
    expect(mockRequest.sessionId).toBe('guest-123');
    expect(mockRequest.isGuest).toBe(true);
  });

  it('should handle invalid tokens gracefully', async () => {
    // Arrange
    const mockRequest = {
      headers: { authorization: 'Bearer invalid-token' }
    };
    const mockContext = {
      switchToHttp: () => ({ getRequest: () => mockRequest })
    } as any;

    mockJwtService.verify.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    // Act
    const result = await guard.canActivate(mockContext);

    // Assert
    expect(result).toBe(true); // Should still allow access in guest mode
    expect(mockRequest.user).toBeUndefined();
  });
});
```

##### Tests OAuth
```typescript
// test/unit/oauth.service.test.ts
describe('OAuthService', () => {
  let oauthService: OAuthService;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockPrisma: jest.Mocked<PrismaService>;
  let mockHttpService: jest.Mocked<HttpService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        OAuthService,
        { provide: AuthService, useValue: createMockAuth() },
        { provide: PrismaService, useValue: createMockPrisma() },
        { provide: HttpService, useValue: createMockHttp() }
      ]
    }).compile();
    
    oauthService = module.get(OAuthService);
    mockAuthService = module.get(AuthService);
    mockPrisma = module.get(PrismaService);
    mockHttpService = module.get(HttpService);
  });

  describe('handleGoogleCallback', () => {
    it('should create new user for first-time Google login', async () => {
      // Arrange
      const googleProfile = {
        email: 'google@example.com',
        name: 'Google User',
        picture: 'https://photo.jpg',
        id: 'google-123'
      };

      mockPrisma.oAuthAccount.findUnique.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'new-user',
        email: googleProfile.email
      } as any);
      mockAuthService.generateTokens.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      } as any);

      // Act
      const result = await oauthService.handleGoogleCallback(googleProfile);

      // Assert
      expect(result.isNewUser).toBe(true);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: googleProfile.email,
          isEmailVerified: true,
          oauthAccounts: {
            create: expect.objectContaining({
              provider: 'google',
              providerAccountId: googleProfile.id
            })
          }
        }),
        include: expect.any(Object)
      });
    });

    it('should link OAuth account to existing user', async () => {
      // Arrange
      const googleProfile = { email: 'existing@example.com', id: 'google-123' };
      const existingUser = { id: 'existing-user', email: googleProfile.email };

      mockPrisma.oAuthAccount.findUnique.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(existingUser as any);

      // Act
      const result = await oauthService.handleGoogleCallback(googleProfile);

      // Assert
      expect(result.isNewUser).toBe(false);
      expect(mockPrisma.oAuthAccount.create).toHaveBeenCalledWith({
        data: {
          userId: existingUser.id,
          provider: 'google',
          providerAccountId: googleProfile.id,
          accessToken: expect.any(String)
        }
      });
    });
  });
});
```

### 7.3 Tests d'intégration

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
        .send({ maxPlayers: 7 })
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

### 7.4 Tests End-to-End (E2E)

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

##### *** NOUVEAUTÉ AUTH: Tests E2E d'authentification ***

```typescript
// test/e2e/auth.e2e.test.ts
import { test, expect, Browser } from '@playwright/test';

test.describe('Authentication E2E', () => {
  test('should complete full registration and login flow', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      // 1. Aller sur la page d'accueil
      await page.goto('/');
      
      // 2. Cliquer sur "Se connecter"
      await page.click('[data-testid="login-button"]');
      
      // 3. Aller sur l'onglet inscription
      await page.click('[data-testid="register-tab"]');
      
      // 4. Remplir le formulaire d'inscription
      await page.fill('[data-testid="register-firstname"]', 'John');
      await page.fill('[data-testid="register-lastname"]', 'Doe');
      await page.fill('[data-testid="register-email"]', 'john.doe.test@example.com');
      await page.fill('[data-testid="register-password"]', 'SecurePass123');
      await page.fill('[data-testid="register-password-confirm"]', 'SecurePass123');
      
      // 5. Accepter les conditions
      await page.check('[data-testid="register-terms-checkbox"]');
      
      // 6. Soumettre l'inscription
      await page.click('[data-testid="register-submit"]');
      
      // 7. Vérifier le message de confirmation
      await expect(page.locator('[data-testid="registration-success"]'))
        .toContainText('Vérifiez votre email');
      
    } finally {
      await context.close();
    }
  });

  test('should convert guest to user account after game', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      // 1. Jouer une partie en mode invité
      await page.goto('/');
      await page.click('[data-testid="create-game-btn"]');
      await page.fill('[data-testid="username-input"]', 'GuestPlayer');
      
      // Simuler la fin d'une partie avec stats
      await page.evaluate(() => {
        window.localStorage.setItem('guest-session-stats', JSON.stringify({
          gamesPlayed: 1,
          bestScore: 250,
          averagePosition: 2
        }));
      });
      
      // 2. Naviguer vers résultats → modal conversion apparaît
      await page.goto('/game/results?mock=true');
      await expect(page.locator('[data-testid="guest-conversion-modal"]')).toBeVisible();
      
      // 3. Remplir le formulaire de conversion
      await page.fill('[data-testid="conversion-firstname"]', 'Converted');
      await page.fill('[data-testid="conversion-lastname"]', 'User');
      await page.fill('[data-testid="conversion-email"]', 'converted@example.com');
      await page.fill('[data-testid="conversion-password"]', 'NewPassword123');
      await page.check('[data-testid="conversion-terms"]');
      await page.click('[data-testid="conversion-submit"]');
      
      // 4. Vérifier la redirection dashboard avec stats transférées
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('[data-testid="user-welcome"]'))
        .toContainText('Bonjour Converted');
      
    } finally {
      await context.close();
    }
  });

  test('should handle mixed guest and authenticated users', async ({ browser }) => {
    const authContext = await browser.newContext();
    const guestContext = await browser.newContext();
    
    const authPage = await authContext.newPage();
    const guestPage = await guestContext.newPage();
    
    try {
      // Utilisateur connecté crée une partie
      await authPage.goto('/login');
      await authPage.fill('[data-testid="login-email"]', 'auth@example.com');
      await authPage.fill('[data-testid="login-password"]', 'password123');
      await authPage.click('[data-testid="login-submit"]');
      
      await authPage.goto('/dashboard');
      await authPage.click('[data-testid="create-game-btn"]');
      const pin = await authPage.textContent('[data-testid="game-pin"]');
      
      // Invité rejoint la partie
      await guestPage.goto('/');
      await guestPage.fill('[data-testid="join-pin-input"]', pin!);
      await guestPage.click('[data-testid="join-game-btn"]');
      await guestPage.fill('[data-testid="username-input"]', 'GuestUser');
      
      // Vérifier que les deux joueurs coexistent
      await expect(authPage.locator('[data-testid="player-list"]'))
        .toContainText('GuestUser');
      await expect(guestPage.locator('[data-testid="player-list"]'))
        .toContainText('AuthUser');
      
    } finally {
      await authContext.close();
      await guestContext.close();
    }
  });
});
```

### 7.5 Tests de performance

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
    maxPlayers: 7
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

### 7.6 Tests de sécurité

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
            .send({ maxPlayers: 7 })
        );
      }
      
      const responses = await Promise.all(requests);
      const rejectedCount = responses.filter(r => r.status === 429).length;
      
      expect(rejectedCount).toBeGreaterThan(0);
    });
  });
});
```

### 7.7 Outils et configuration CI/CD

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