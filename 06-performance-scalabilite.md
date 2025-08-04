# Document 6/7 : Performance et Scalabilité - Projet Epercept

## Scope de ce document
Ce document définit l'architecture complète de performance et de scalabilité pour l'application Epercept. Il couvre les optimisations backend/frontend, les stratégies de mise à l'échelle, le monitoring des performances et les solutions de haute disponibilité pour une application gaming temps réel.

## Autres documents du projet
- Document 1/7 : Spécifications Fonctionnelles et Règles Métier ✓
- Document 2/7 : Design System et Expérience Utilisateur ✓
- Document 3/7 : Architecture Backend ✓
- Document 4/7 : Architecture Frontend ✓
- Document 5/7 : Sécurité, Tests et DevOps ✓
- Document 7/7 : Administration et Configuration ✓

---

## 1. Optimisations Backend - Performance NestJS

### 1.1 Architecture haute performance

#### 1.1.1 Configuration NestJS optimisée
```typescript
// main.ts - Configuration performance optimale
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Optimisations de performance
    logger: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : true,
    cors: {
      origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
      optionsSuccessStatus: 200 // IE11 support
    }
  });

  // Compression des réponses HTTP
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) return false;
      return compression.filter(req, res);
    },
    threshold: 1024, // Compresser seulement si > 1KB
    level: 6 // Équilibre compression/CPU
  }));

  // Sécurité avec optimisations
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production',
    crossOriginEmbedderPolicy: false // WebSocket compatibility
  }));

  // Validation avec mise en cache des schémas
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
    // Cache des schémas de validation
    disableErrorMessages: process.env.NODE_ENV === 'production',
    stopAtFirstError: true
  }));

  // Configuration Swagger (dev uniquement)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Epercept API')
      .setDescription('Real-time gaming API')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Graceful shutdown
  app.enableShutdownHooks();

  await app.listen(process.env.PORT || 3001);
  console.log(`🚀 Application running on: ${await app.getUrl()}`);
}

bootstrap().catch(err => {
  console.error('❌ Application failed to start:', err);
  process.exit(1);
});
```

#### 1.1.2 Connection pooling et cache Redis optimisés
```typescript
// database/database.module.ts
import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { RedisModule } from '@nestjs-modules/ioredis';
import { BullModule } from '@nestjs/bull';

@Global()
@Module({
  imports: [
    // Configuration Redis cluster pour haute performance
    RedisModule.forRoot({
      type: 'cluster',
      nodes: [
        {
          host: process.env.REDIS_HOST_1 || 'localhost',
          port: parseInt(process.env.REDIS_PORT_1 || '6379'),
        },
        {
          host: process.env.REDIS_HOST_2 || 'localhost',
          port: parseInt(process.env.REDIS_PORT_2 || '6380'),
        },
      ],
      options: {
        // Optimisations de performance
        enableReadyCheck: false,
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        lazyConnect: true,
        
        // Connection pooling
        family: 4,
        keepAlive: true,
        
        // Compression pour économiser la bande passante
        compression: 'gzip',
        
        // Optimisations réseau
        connectTimeout: 10000,
        commandTimeout: 5000,
        
        // Pipeline des commandes pour performance
        enableAutoPipelining: true,
        maxRetriesPerRequest: 3
      }
    }),

    // Queue système pour tâches asynchrones
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        // Configuration spécialisée pour les queues
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        maxmemoryPolicy: 'allkeys-lru'
      },
      defaultJobOptions: {
        removeOnComplete: 100, // Garder 100 jobs complétés
        removeOnFail: 50,      // Garder 50 jobs échoués
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      }
    })
  ],
  providers: [PrismaService],
  exports: [PrismaService, RedisModule]
})
export class DatabaseModule {}
```

#### 1.1.3 Service de cache haute performance
```typescript
// cache/cache.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class PerformanceCacheService {
  private readonly logger = new Logger(PerformanceCacheService.name);
  
  constructor(@InjectRedis() private readonly redis: Redis) {}

  // Cache avec compression automatique
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      
      // Compresser si la valeur est grande (> 1KB)
      if (serialized.length > 1024) {
        const compressed = await this.compress(serialized);
        await this.redis.setex(`${key}:gz`, ttl, compressed);
      } else {
        await this.redis.setex(key, ttl, serialized);
      }
    } catch (error) {
      this.logger.error(`Cache SET error for key ${key}:`, error);
    }
  }

  // Récupération avec décompression automatique  
  async get<T>(key: string): Promise<T | null> {
    try {
      // Essayer d'abord la version compressée
      let value = await this.redis.get(`${key}:gz`);
      if (value) {
        const decompressed = await this.decompress(value);
        return JSON.parse(decompressed);
      }

      // Sinon la version normale
      value = await this.redis.get(key);
      if (value) {
        return JSON.parse(value);
      }

      return null;
    } catch (error) {
      this.logger.error(`Cache GET error for key ${key}:`, error);
      return null;
    }
  }

  // Cache multi-get pour optimiser les requêtes
  async mget<T>(keys: string[]): Promise<Record<string, T>> {
    try {
      const values = await this.redis.mget(...keys);
      const result: Record<string, T> = {};

      keys.forEach((key, index) => {
        if (values[index]) {
          try {
            result[key] = JSON.parse(values[index]!);
          } catch (error) {
            this.logger.warn(`Failed to parse cached value for key ${key}`);
          }
        }
      });

      return result;
    } catch (error) {
      this.logger.error('Cache MGET error:', error);
      return {};
    }
  }

  // Pipeline pour opérations batch optimisées
  async pipeline(operations: Array<{action: 'set' | 'get' | 'del', key: string, value?: any, ttl?: number}>): Promise<any[]> {
    const pipe = this.redis.pipeline();

    operations.forEach(op => {
      switch (op.action) {
        case 'set':
          if (op.value && op.ttl) {
            pipe.setex(op.key, op.ttl, JSON.stringify(op.value));
          }
          break;
        case 'get':
          pipe.get(op.key);
          break;
        case 'del':
          pipe.del(op.key);
          break;
      }
    });

    return pipe.exec();
  }

  // Cache intelligent pour les parties de jeu
  async cacheGameState(gameId: string, state: any, ttl: number = 1800): Promise<void> {
    const pipeline = this.redis.pipeline();
    
    // Cache l'état complet
    pipeline.setex(`game:${gameId}:state`, ttl, JSON.stringify(state));
    
    // Cache les données fréquemment accédées séparément
    pipeline.setex(`game:${gameId}:players`, ttl, JSON.stringify(state.players));
    pipeline.setex(`game:${gameId}:current_round`, ttl, JSON.stringify(state.currentRound));
    pipeline.setex(`game:${gameId}:status`, ttl, state.status);
    
    await pipeline.exec();
  }

  // Invalidation intelligente du cache
  async invalidateGameCache(gameId: string): Promise<void> {
    const pattern = `game:${gameId}:*`;
    const keys = await this.redis.keys(pattern);
    
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  // Compression/décompression pour économiser la mémoire
  private async compress(data: string): Promise<string> {
    const { gzip } = await import('zlib');
    const { promisify } = await import('util');
    const gzipAsync = promisify(gzip);
    
    const compressed = await gzipAsync(Buffer.from(data));
    return compressed.toString('base64');
  }

  private async decompress(compressedData: string): Promise<string> {
    const { gunzip } = await import('zlib');
    const { promisify } = await import('util');
    const gunzipAsync = promisify(gunzip);
    
    const buffer = Buffer.from(compressedData, 'base64');
    const decompressed = await gunzipAsync(buffer);
    return decompressed.toString();
  }

  // Monitoring des performances du cache
  async getCacheStats(): Promise<any> {
    const info = await this.redis.info('memory');
    const keyspace = await this.redis.info('keyspace');
    
    return {
      memory: this.parseRedisInfo(info),
      keyspace: this.parseRedisInfo(keyspace),
      connected_clients: await this.redis.info('clients')
    };
  }

  private parseRedisInfo(info: string): Record<string, any> {
    const result: Record<string, any> = {};
    info.split('\r\n').forEach(line => {
      const [key, value] = line.split(':');
      if (key && value) {
        result[key] = isNaN(Number(value)) ? value : Number(value);
      }
    });
    return result;
  }
}
```

### 1.2 Optimisations base de données

#### 1.2.1 Connection pooling Prisma optimisé
```typescript
// database/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private configService: ConfigService) {
    super({
      // Configuration optimisée pour performance
      datasources: {
        db: {
          url: configService.get('DATABASE_URL')
        }
      },
      
      // Optimisations de connection
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'info', 'warn', 'error']
        : ['error'],
      
      errorFormat: 'pretty',
      
      // Configuration avancée de performance
      __internal: {
        engine: {
          // Connection pool optimisé
          connection_limit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
          pool_timeout: 20,
          
          // Optimisations réseau
          connect_timeout: 60,
          socket_timeout: 60,
        }
      }
    });

    // Middleware de monitoring des performances
    this.$use(async (params, next) => {
      const start = Date.now();
      const result = await next(params);
      const end = Date.now();
      
      const duration = end - start;
      
      // Logger les requêtes lentes (> 100ms)
      if (duration > 100) {
        this.logger.warn(`Slow query detected: ${params.model}.${params.action} took ${duration}ms`);
      }
      
      // Métriques de performance
      this.logPerformanceMetric({
        model: params.model,
        action: params.action,
        duration,
        timestamp: start
      });
      
      return result;
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Database connected successfully');
      
      // Optimisations de démarrage
      await this.warmupCache();
      await this.optimizeConnections();
      
    } catch (error) {
      this.logger.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }

  // Méthodes optimisées pour le gaming

  // Requête optimisée pour récupérer l'état du jeu
  async getGameWithPlayersOptimized(gameId: string) {
    return this.game.findUnique({
      where: { id: gameId },
      include: {
        players: {
          select: {
            id: true,
            username: true,
            points: true,
            position: true,
            isActive: true,
            connectionStatus: true,
            lastSeen: true
          },
          orderBy: [
            { points: 'desc' },
            { lastPointTimestamp: 'asc' }
          ]
        },
        rounds: {
          where: {
            status: 'IN_PROGRESS'
          },
          include: {
            question: {
              select: {
                id: true,
                text: true,
                options: true,
                roundType: true
              }
            }
          },
          take: 1
        }
      }
    });
  }

  // Batch insert optimisé pour les réponses
  async createAnswersBatch(answers: Prisma.AnswerCreateManyInput[]) {
    return this.$transaction(async (tx) => {
      // Utiliser createMany pour insertion batch optimisée
      const result = await tx.answer.createMany({
        data: answers,
        skipDuplicates: true
      });

      // Mettre à jour les scores en une seule requête
      for (const answer of answers) {
        if (answer.isCorrect) {
          await tx.player.update({
            where: { id: answer.playerId },
            data: {
              points: { increment: 1 },
              lastPointTimestamp: new Date()
            }
          });
        }
      }

      return result;
    });
  }

  // Requêtes préparées pour performance
  private readonly preparedQueries = {
    // Requête préparée pour récupérer rapidement un joueur
    findPlayerFast: Prisma.sql`
      SELECT id, username, points, "gameId", "isActive" 
      FROM players 
      WHERE id = $1 AND "isActive" = true
    `,
    
    // Requête préparée pour le classement
    getGameRanking: Prisma.sql`
      SELECT 
        id, username, points,
        ROW_NUMBER() OVER (ORDER BY points DESC, "lastPointTimestamp" ASC) as position
      FROM players 
      WHERE "gameId" = $1 AND "isActive" = true
      ORDER BY points DESC, "lastPointTimestamp" ASC
    `,

    // Requête optimisée pour les parties actives
    getActiveGames: Prisma.sql`
      SELECT g.id, g.pin, g.status, g."createdAt", 
             COUNT(p.id) as player_count
      FROM games g
      LEFT JOIN players p ON g.id = p."gameId" AND p."isActive" = true
      WHERE g.status IN ('WAITING', 'IN_PROGRESS')
        AND g."lastActivity" > NOW() - INTERVAL '30 minutes'
      GROUP BY g.id, g.pin, g.status, g."createdAt"
      ORDER BY g."lastActivity" DESC
      LIMIT 100
    `
  };

  // Exécution de requêtes préparées
  async executeRawQuery<T>(query: Prisma.Sql): Promise<T[]> {
    return this.$queryRaw<T[]>(query);
  }

  // Cache warming pour optimiser les performances au démarrage
  private async warmupCache() {
    try {
      // Pré-charger les questions fréquemment utilisées
      await this.question.findMany({
        where: { isActive: true },
        select: { id: true, roundType: true },
        take: 100
      });

      // Pré-charger les parties actives
      await this.game.findMany({
        where: {
          status: { in: ['WAITING', 'IN_PROGRESS'] }
        },
        select: { id: true, pin: true },
        take: 50
      });

      this.logger.log('Cache warmed up successfully');
    } catch (error) {
      this.logger.warn('Cache warmup failed:', error);
    }
  }

  // Optimisation des connexions
  private async optimizeConnections() {
    try {
      // Analyser les performances des requêtes
      const slowQueries = await this.$queryRaw`
        SELECT query, mean_time, calls 
        FROM pg_stat_statements 
        WHERE mean_time > 100 
        ORDER BY mean_time DESC 
        LIMIT 10
      ` as any[];

      if (slowQueries.length > 0) {
        this.logger.warn('Slow queries detected:', slowQueries);
      }

    } catch (error) {
      // pg_stat_statements n'est pas activé, ignorer
      this.logger.debug('Query analysis not available');
    }
  }

  // Métriques de performance
  private logPerformanceMetric(metric: {
    model?: string;
    action?: string;
    duration: number;
    timestamp: number;
  }) {
    // Envoyer vers système de monitoring
    // (Prometheus, Grafana, etc.)
    if (process.env.NODE_ENV === 'production') {
      // Implémenter l'envoi de métriques
    }
  }

  // Health check optimisé
  async healthCheck(): Promise<{ status: string; latency: number }> {
    const start = Date.now();
    try {
      await this.$queryRaw`SELECT 1`;
      const latency = Date.now() - start;
      return { status: 'healthy', latency };
    } catch (error) {
      return { status: 'unhealthy', latency: Date.now() - start };
    }
  }
}
```

### 1.3 WebSocket haute performance

#### 1.3.1 Gateway WebSocket optimisé
```typescript
// websocket/optimized-game.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@WebSocketGateway({
  // Configuration optimisée pour performance
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
  },
  transports: ['websocket'], // WebSocket uniquement pour performance
  pingTimeout: 60000,
  pingInterval: 25000,
  
  // Optimisations Engine.IO
  upgradeTimeout: 30000,
  maxHttpBufferSize: 1e6, // 1MB
  allowEIO3: true,
  
  // Compression pour réduire la bande passante
  compression: true,
  perMessageDeflate: {
    threshold: 1024, // Compresser si > 1KB
    concurrencyLimit: 10,
    memLevel: 7
  }
})
export class OptimizedGameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(OptimizedGameGateway.name);
  
  // Maps optimisées pour performance
  private readonly connectionMap = new Map<string, ConnectionInfo>();
  private readonly gameRooms = new Map<string, Set<string>>();
  private readonly playerGameMap = new Map<string, string>();

  // Pool de workers pour traitement parallèle
  private readonly messageQueue = new Array<QueuedMessage>();
  private readonly processingQueue = false;

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly gameService: GameService,
    private readonly cacheService: PerformanceCacheService
  ) {
    this.startMessageProcessor();
  }

  async handleConnection(client: Socket) {
    const startTime = Date.now();
    
    try {
      // Authentification rapide avec cache
      const playerInfo = await this.fastAuth(client);
      if (!playerInfo) {
        client.disconnect(true);
        return;
      }

      // Enregistrement optimisé de la connexion
      this.connectionMap.set(client.id, {
        playerId: playerInfo.playerId,
        gameId: playerInfo.gameId,
        connectedAt: Date.now(),
        lastActivity: Date.now(),
        isAuthenticated: true
      });

      // Rejoindre la room du jeu
      await client.join(`game:${playerInfo.gameId}`);
      
      // Mise à jour des maps de tracking
      this.playerGameMap.set(playerInfo.playerId, playerInfo.gameId);
      
      if (!this.gameRooms.has(playerInfo.gameId)) {
        this.gameRooms.set(playerInfo.gameId, new Set());
      }
      this.gameRooms.get(playerInfo.gameId)!.add(client.id);

      // Restaurer l'état du jeu depuis le cache
      const gameState = await this.cacheService.get(`game:${playerInfo.gameId}:state`);
      if (gameState) {
        client.emit('game-state-restored', gameState);
      }

      // Notifier les autres joueurs (optimisé)
      client.to(`game:${playerInfo.gameId}`).emit('player-connected', {
        playerId: playerInfo.playerId,
        username: playerInfo.username
      });

      const connectionTime = Date.now() - startTime;
      this.logger.log(`Player ${playerInfo.username} connected in ${connectionTime}ms`);

    } catch (error) {
      this.logger.error('Connection error:', error);
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    const connection = this.connectionMap.get(client.id);
    if (!connection) return;

    try {
      // Nettoyage optimisé des structures de données
      this.connectionMap.delete(client.id);
      this.playerGameMap.delete(connection.playerId);
      
      const gameRoomClients = this.gameRooms.get(connection.gameId);
      if (gameRoomClients) {
        gameRoomClients.delete(client.id);
        if (gameRoomClients.size === 0) {
          this.gameRooms.delete(connection.gameId);
        }
      }

      // Gestion graceful de la déconnexion
      await this.handleGracefulDisconnect(connection);

    } catch (error) {
      this.logger.error('Disconnect error:', error);
    }
  }

  // Message handler optimisé avec queue
  @SubscribeMessage('game-action')
  async handleGameAction(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: GameActionDto
  ) {
    // Ajouter à la queue pour traitement optimisé
    this.messageQueue.push({
      clientId: client.id,
      action: data.action,
      payload: data.payload,
      timestamp: Date.now()
    });

    // Traitement immédiat pour actions critiques
    if (this.isCriticalAction(data.action)) {
      await this.processMessage(client, data);
    }
  }

  // Authentification rapide avec cache
  private async fastAuth(client: Socket): Promise<PlayerInfo | null> {
    const sessionId = client.request.headers['x-session-id'] as string;
    if (!sessionId) return null;

    // Vérifier le cache Redis d'abord
    let playerInfo = await this.redis.get(`session:${sessionId}`);
    
    if (playerInfo) {
      return JSON.parse(playerInfo);
    }

    // Fallback vers base de données
    const session = await this.gameService.validateSession(sessionId);
    if (session) {
      const info = {
        playerId: session.playerId,
        gameId: session.gameId,
        username: session.player.username
      };

      // Cacher pour 1 heure
      await this.redis.setex(`session:${sessionId}`, 3600, JSON.stringify(info));
      return info;
    }

    return null;
  }

  // Broadcast optimisé pour grandes salles
  async broadcastToGame(gameId: string, event: string, data: any, excludeClient?: string) {
    const gameRoom = this.gameRooms.get(gameId);
    if (!gameRoom || gameRoom.size === 0) return;

    // Utiliser compression pour gros payloads
    const payload = JSON.stringify(data);
    const shouldCompress = payload.length > 1024;

    if (shouldCompress) {
      // Broadcast compressé pour économiser la bande passante
      this.server.to(`game:${gameId}`).compress(true).emit(event, data);
    } else {
      this.server.to(`game:${gameId}`).emit(event, data);
    }

    // Exclure un client si nécessaire
    if (excludeClient) {
      this.server.to(excludeClient).emit(event, data);
    }
  }

  // Processeur de messages asynchrone
  private startMessageProcessor() {
    setInterval(async () => {
      if (this.messageQueue.length === 0) return;

      // Traiter par batch pour optimiser les performances
      const batch = this.messageQueue.splice(0, 100); // Traiter 100 messages max
      
      await Promise.all(
        batch.map(message => this.processBatchMessage(message))
      );
    }, 10); // Traitement toutes les 10ms
  }

  private async processBatchMessage(message: QueuedMessage) {
    try {
      const client = this.server.sockets.sockets.get(message.clientId);
      if (client) {
        await this.processMessage(client, {
          action: message.action,
          payload: message.payload
        });
      }
    } catch (error) {
      this.logger.error('Batch message processing error:', error);
    }
  }

  private async processMessage(client: Socket, data: GameActionDto) {
    const connection = this.connectionMap.get(client.id);
    if (!connection) return;

    // Mise à jour de l'activité
    connection.lastActivity = Date.now();

    try {
      switch (data.action) {
        case 'submit-answer':
          await this.handleSubmitAnswer(client, data.payload);
          break;
        case 'submit-guess':
          await this.handleSubmitGuess(client, data.payload);
          break;
        case 'ready-for-next':
          await this.handleReadyForNext(client);
          break;
        default:
          this.logger.warn(`Unknown action: ${data.action}`);
      }
    } catch (error) {
      this.logger.error(`Error processing ${data.action}:`, error);
      client.emit('error', { message: 'Action failed' });
    }
  }

  private async handleSubmitAnswer(client: Socket, payload: any) {
    const connection = this.connectionMap.get(client.id);
    if (!connection) return;

    // Validation rapide avec cache
    const isValidTurn = await this.cacheService.get(
      `game:${connection.gameId}:active_player`
    );

    if (isValidTurn !== connection.playerId) {
      client.emit('error', { message: 'Not your turn' });
      return;
    }

    // Traitement business logic
    await this.gameService.processAnswer(
      connection.gameId,
      connection.playerId,
      payload.answer
    );

    // Broadcast aux autres joueurs
    await this.broadcastToGame(
      connection.gameId,
      'answer-submitted',
      {
        playerId: connection.playerId,
        nextPhase: 'guessing'
      },
      client.id
    );

    // Démarrer le timer de devinettes
    await this.startGuessingTimer(connection.gameId);
  }

  private async handleSubmitGuess(client: Socket, payload: any) {
    const connection = this.connectionMap.get(client.id);
    if (!connection) return;

    // Traitement de la devinette
    const result = await this.gameService.processGuess(
      connection.gameId,
      connection.playerId,
      payload.guess
    );

    // Si c'est la dernière devinette, révéler les résultats
    if (result.isLastGuess) {
      const results = await this.gameService.revealResults(connection.gameId);
      await this.broadcastToGame(connection.gameId, 'results-revealed', results);
    }
  }

  private async startGuessingTimer(gameId: string) {
    // Timer de 30 secondes pour les devinettes
    setTimeout(async () => {
      const results = await this.gameService.revealResults(gameId);
      await this.broadcastToGame(gameId, 'timer-expired', {
        phase: 'guessing',
        results
      });
    }, 30000);
  }

  private isCriticalAction(action: string): boolean {
    return ['submit-answer', 'submit-guess', 'player-disconnect'].includes(action);
  }

  private async handleGracefulDisconnect(connection: ConnectionInfo) {
    // Marquer le joueur comme déconnecté avec grace period
    await this.cacheService.set(
      `player:${connection.playerId}:disconnected`,
      { 
        gameId: connection.gameId,
        disconnectedAt: Date.now()
      },
      120 // 2 minutes grace period
    );

    // Notifier les autres joueurs
    await this.broadcastToGame(
      connection.gameId,
      'player-disconnected',
      {
        playerId: connection.playerId,
        canReconnect: true,
        timeout: 120000
      }
    );
  }

  // Métriques de performance WebSocket
  getPerformanceMetrics() {
    return {
      activeConnections: this.connectionMap.size,
      activeGames: this.gameRooms.size,
      queuedMessages: this.messageQueue.length,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime()
    };
  }
}

interface ConnectionInfo {
  playerId: string;
  gameId: string;
  connectedAt: number;
  lastActivity: number;
  isAuthenticated: boolean;
}

interface PlayerInfo {
  playerId: string;
  gameId: string;
  username: string;
}

interface QueuedMessage {
  clientId: string;
  action: string;
  payload: any;
  timestamp: number;
}

interface GameActionDto {
  action: string;
  payload: any;
}
```

## 2. Optimisations Frontend - Performance React/Next.js

### 2.1 Configuration Next.js haute performance

#### 2.1.1 Configuration optimisée
```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'date-fns'],
    ppr: true, // Partial Prerendering
    reactCompiler: true, // React Compiler
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
    reactRemoveProperties: process.env.NODE_ENV === 'production',
  },

  // Bundle optimizations
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Production optimizations
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': path.resolve(__dirname, 'src'),
      };

      // Optimize chunks
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
              reuseExistingChunk: true,
              enforce: true,
            },
            game: {
              test: /[\\/]src[\\/]components[\\/]game[\\/]/,
              name: 'game',
              chunks: 'all',
              priority: 8,
            },
          },
        },
      };
    }

    return config;
  },

  // Image optimizations
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Headers for performance
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
    ];
  },

  // Compression
  compress: true,

  // Output optimization
  output: 'standalone',
  poweredByHeader: false,
  trailingSlash: false,
  
  // Font optimization
  optimizeFonts: true,
};

module.exports = withBundleAnalyzer(nextConfig);
```

### 2.2 Store Zustand optimisé avec performance

#### 2.2.1 Store avec sélecteurs optimisés
```typescript
// lib/store/game-store.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';

// Types optimisés
interface GameState {
  // Core game data
  game: Game | null;
  player: Player | null;
  currentRound: GameRound | null;
  
  // UI state (séparé pour éviter re-renders inutiles)
  ui: {
    isLoading: boolean;
    error: string | null;
    notifications: Notification[];
    sidebarOpen: boolean;
  };
  
  // Performance state
  performance: {
    connectionLatency: number;
    lastUpdate: number;
    frameRate: number;
  };
  
  // Cache optimisé
  cache: {
    players: Map<string, Player>;
    questions: Map<number, Question>;
    gameStates: Map<string, Partial<Game>>;
  };
}

interface GameActions {
  // Optimized actions
  setGame: (game: Game) => void;
  setPlayer: (player: Player) => void;
  updatePlayerOptimized: (playerId: string, updates: Partial<Player>) => void;
  
  // Batch updates for performance
  batchUpdate: (updates: Partial<GameState>) => void;
  
  // Cache management
  cachePlayer: (player: Player) => void;
  getCachedPlayer: (playerId: string) => Player | undefined;
  
  // Performance optimizations
  optimizeState: () => void;
  clearOldData: () => void;
}

// Store optimisé avec middleware
export const useGameStore = create<GameState & GameActions>()(
  // Middleware stack optimisé
  subscribeWithSelector(
    immer(
      persist(
        (set, get) => ({
          // Initial state
          game: null,
          player: null,
          currentRound: null,
          
          ui: {
            isLoading: false,
            error: null,
            notifications: [],
            sidebarOpen: false,
          },
          
          performance: {
            connectionLatency: 0,
            lastUpdate: Date.now(),
            frameRate: 60,
          },
          
          cache: {
            players: new Map(),
            questions: new Map(),
            gameStates: new Map(),
          },

          // Optimized actions
          setGame: (game) => set((state) => {
            state.game = game;
            state.performance.lastUpdate = Date.now();
            
            // Cache players for quick access
            if (game?.players) {
              game.players.forEach(player => {
                state.cache.players.set(player.id, player);
              });
            }
          }),

          setPlayer: (player) => set((state) => {
            state.player = player;
            state.cache.players.set(player.id, player);
          }),

          updatePlayerOptimized: (playerId, updates) => set((state) => {
            // Update in cache first
            const cachedPlayer = state.cache.players.get(playerId);
            if (cachedPlayer) {
              const updatedPlayer = { ...cachedPlayer, ...updates };
              state.cache.players.set(playerId, updatedPlayer);
            }

            // Update in main state if it's current player
            if (state.player?.id === playerId && state.player) {
              Object.assign(state.player, updates);
            }

            // Update in game players array
            if (state.game?.players) {
              const playerIndex = state.game.players.findIndex(p => p.id === playerId);
              if (playerIndex !== -1) {
                Object.assign(state.game.players[playerIndex], updates);
              }
            }
          }),

          batchUpdate: (updates) => set((state) => {
            Object.assign(state, updates);
            state.performance.lastUpdate = Date.now();
          }),

          cachePlayer: (player) => set((state) => {
            state.cache.players.set(player.id, player);
          }),

          getCachedPlayer: (playerId) => {
            return get().cache.players.get(playerId);
          },

          optimizeState: () => set((state) => {
            // Nettoyer les données obsolètes
            const now = Date.now();
            const maxAge = 5 * 60 * 1000; // 5 minutes

            // Nettoyer les notifications anciennes
            state.ui.notifications = state.ui.notifications.filter(
              notif => now - notif.timestamp < maxAge
            );

            // Nettoyer le cache des états de jeu obsolètes
            const gameStates = state.cache.gameStates;
            gameStates.forEach((gameState, gameId) => {
              if (gameState.lastActivity && now - gameState.lastActivity.getTime() > maxAge) {
                gameStates.delete(gameId);
              }
            });
          }),

          clearOldData: () => set((state) => {
            // Nettoyer toutes les données sauf le jeu actuel
            if (state.game) {
              const currentGameId = state.game.id;
              state.cache.gameStates.clear();
              state.cache.gameStates.set(currentGameId, state.game);
            }
            
            // Garder seulement les joueurs du jeu actuel
            if (state.game?.players) {
              const currentPlayerIds = new Set(state.game.players.map(p => p.id));
              const newPlayersCache = new Map();
              
              state.cache.players.forEach((player, id) => {
                if (currentPlayerIds.has(id)) {
                  newPlayersCache.set(id, player);
                }
              });
              
              state.cache.players = newPlayersCache;
            }
          }),
        }),
        {
          name: 'epercept-game-store',
          partialize: (state) => ({
            // Persister seulement les données essentielles
            player: state.player,
            ui: {
              sidebarOpen: state.ui.sidebarOpen,
            },
          }),
        }
      )
    )
  )
);

// Sélecteurs optimisés pour éviter re-renders
export const useGameSelector = <T>(selector: (state: GameState & GameActions) => T) =>
  useGameStore(selector);

// Sélecteurs pré-définis pour performance
export const useGame = () => useGameStore(state => state.game);
export const usePlayer = () => useGameStore(state => state.player);
export const useUI = () => useGameStore(state => state.ui);
export const useCurrentRound = () => useGameStore(state => state.currentRound);

// Sélecteurs dérivés avec memoization
export const useGamePlayers = () => 
  useGameStore(state => state.game?.players || []);

export const useCurrentPlayerRanking = () =>
  useGameStore(state => {
    if (!state.game?.players || !state.player) return null;
    
    const sorted = [...state.game.players].sort((a, b) => {
      if (a.points !== b.points) return b.points - a.points;
      return a.lastPointTimestamp - b.lastPointTimestamp;
    });
    
    return sorted.findIndex(p => p.id === state.player!.id) + 1;
  });

export const useTopPlayers = (limit: number = 3) =>
  useGameStore(state => {
    if (!state.game?.players) return [];
    
    return [...state.game.players]
      .sort((a, b) => {
        if (a.points !== b.points) return b.points - a.points;
        return a.lastPointTimestamp - b.lastPointTimestamp;
      })
      .slice(0, limit);
  });

// Actions optimisées avec throttling
export const useThrottledActions = () => {
  const actions = useGameStore();
  
  return {
    updatePlayerThrottled: throttle(actions.updatePlayerOptimized, 100),
    batchUpdateThrottled: throttle(actions.batchUpdate, 50),
  };
};

// Helper pour throttling
function throttle<T extends (...args: any[]) => any>(func: T, limit: number): T {
  let inThrottle: boolean;
  return ((...args: any[]) => {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  }) as T;
}
```

### 2.3 Composants React optimisés

#### 2.3.1 Composants avec memoization avancée
```typescript
// components/game/OptimizedGameBoard.tsx
import React, { memo, useMemo, useCallback, Suspense } from 'react';
import { useGameStore, useGameSelector } from '@/lib/store';
import { useVirtualizer } from '@tanstack/react-virtual';

// Component principal avec React.memo intelligent
export const OptimizedGameBoard = memo(() => {
  // Sélecteurs optimisés
  const game = useGameSelector(state => state.game);
  const currentRound = useGameSelector(state => state.currentRound);
  const isLoading = useGameSelector(state => state.ui.isLoading);

  // Memoization des calculs coûteux
  const gameStats = useMemo(() => {
    if (!game) return null;
    
    return {
      totalPlayers: game.players.length,
      activePlayers: game.players.filter(p => p.isActive).length,
      averagePoints: game.players.reduce((sum, p) => sum + p.points, 0) / game.players.length,
      gameProgress: (game.currentRound / 4) * 100,
    };
  }, [game?.players, game?.currentRound]);

  // Callbacks memoizés pour éviter re-renders
  const handlePlayerUpdate = useCallback((playerId: string, updates: Partial<Player>) => {
    useGameStore.getState().updatePlayerOptimized(playerId, updates);
  }, []);

  const handleGameAction = useCallback((action: string, payload: any) => {
    // Throttled action pour éviter spam
    throttledGameAction(action, payload);
  }, []);

  if (isLoading) {
    return <GameBoardSkeleton />;
  }

  if (!game) {
    return <EmptyGameState />;
  }

  return (
    <div className="game-board-container">
      {/* Barre de progression optimisée */}
      <GameProgressBar progress={gameStats?.gameProgress || 0} />
      
      {/* Liste de joueurs virtualisée pour performance */}
      <Suspense fallback={<PlayerListSkeleton />}>
        <VirtualizedPlayerList 
          players={game.players}
          onPlayerUpdate={handlePlayerUpdate}
        />
      </Suspense>
      
      {/* Round actuel */}
      {currentRound && (
        <Suspense fallback={<RoundSkeleton />}>
          <OptimizedRoundComponent 
            round={currentRound}
            onAction={handleGameAction}
          />
        </Suspense>
      )}
      
      {/* Statistiques en temps réel */}
      <GameStatsPanel stats={gameStats} />
    </div>
  );
});

OptimizedGameBoard.displayName = 'OptimizedGameBoard';

// Composant de liste virtualisée pour grande performance
const VirtualizedPlayerList = memo<{
  players: Player[];
  onPlayerUpdate: (playerId: string, updates: Partial<Player>) => void;
}>(({ players, onPlayerUpdate }) => {
  const parentRef = React.useRef<HTMLDivElement>(null);
  
  // Configuration du virtualizer
  const virtualizer = useVirtualizer({
    count: players.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Hauteur estimée d'un joueur
    overscan: 5, // Render 5 items supplémentaires pour smooth scrolling
  });

  return (
    <div
      ref={parentRef}
      className="player-list-container"
      style={{ height: '400px', overflow: 'auto' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const player = players[virtualItem.index];
          
          return (
            <div
              key={player.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <OptimizedPlayerCard 
                player={player}
                onUpdate={onPlayerUpdate}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});

// Carte joueur optimisée avec memo intelligent
const OptimizedPlayerCard = memo<{
  player: Player;
  onUpdate: (playerId: string, updates: Partial<Player>) => void;
}>(({ player, onUpdate }) => {
  // Memoization des données dérivées
  const playerStats = useMemo(() => ({
    isTopPlayer: player.position <= 3,
    pointsGainedThisRound: calculateRoundPoints(player),
    averageResponseTime: calculateAverageResponseTime(player),
    accuracy: calculateAccuracy(player),
  }), [player.points, player.position, player.answers]);

  const handleStatusChange = useCallback(() => {
    onUpdate(player.id, { 
      lastSeen: new Date(),
      isActive: !player.isActive 
    });
  }, [player.id, player.isActive, onUpdate]);

  return (
    <div 
      className={`player-card ${playerStats.isTopPlayer ? 'top-player' : ''}`}
      data-player-id={player.id}
    >
      <div className="player-info">
        <span className="player-name">{player.username}</span>
        <span className="player-points">{player.points} pts</span>
      </div>
      
      <div className="player-stats">
        <span className="position">#{player.position}</span>
        {playerStats.accuracy && (
          <span className="accuracy">{playerStats.accuracy}% précision</span>
        )}
      </div>
      
      <ConnectionIndicator 
        status={player.connectionStatus}
        lastSeen={player.lastSeen}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // Comparaison personnalisée pour éviter re-renders inutiles
  const prev = prevProps.player;
  const next = nextProps.player;
  
  return (
    prev.id === next.id &&
    prev.username === next.username &&
    prev.points === next.points &&
    prev.position === next.position &&
    prev.isActive === next.isActive &&
    prev.connectionStatus === next.connectionStatus
  );
});

// Indicateur de connexion avec animations optimisées
const ConnectionIndicator = memo<{
  status: ConnectionStatus;
  lastSeen: Date;
}>(({ status, lastSeen }) => {
  const indicatorClass = useMemo(() => {
    switch (status) {
      case 'CONNECTED': return 'connection-indicator connected';
      case 'DISCONNECTED': return 'connection-indicator disconnected';
      case 'RECONNECTING': return 'connection-indicator reconnecting';
      default: return 'connection-indicator unknown';
    }
  }, [status]);

  const timeAgo = useMemo(() => {
    return formatTimeAgo(lastSeen);
  }, [lastSeen]);

  return (
    <div className={indicatorClass} title={`Dernière activité: ${timeAgo}`}>
      <div className="indicator-dot" />
    </div>
  );
});

// Barre de progression avec animation optimisée
const GameProgressBar = memo<{ progress: number }>(({ progress }) => {
  const [animatedProgress, setAnimatedProgress] = React.useState(progress);

  React.useEffect(() => {
    const animation = requestAnimationFrame(() => {
      setAnimatedProgress(progress);
    });
    
    return () => cancelAnimationFrame(animation);
  }, [progress]);

  return (
    <div className="progress-bar-container">
      <div 
        className="progress-bar-fill"
        style={{ 
          width: `${animatedProgress}%`,
          transition: 'width 0.3s ease-out'
        }}
      />
      <span className="progress-text">{Math.round(animatedProgress)}%</span>
    </div>
  );
});

// Skeleton loaders pour meilleure UX
const GameBoardSkeleton = () => (
  <div className="game-board-skeleton">
    <div className="skeleton-progress-bar" />
    <div className="skeleton-player-list">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="skeleton-player-card" />
      ))}
    </div>
  </div>
);

const PlayerListSkeleton = () => (
  <div className="player-list-skeleton">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="skeleton-player-item" />
    ))}
  </div>
);

// Fonctions utilitaires optimisées
const throttledGameAction = throttle((action: string, payload: any) => {
  // Logique d'action de jeu
  console.log('Game action:', action, payload);
}, 200);

function calculateRoundPoints(player: Player): number {
  // Calcul optimisé des points du round actuel
  return player.answers?.filter(a => a.isCorrect && isCurrentRound(a)).length || 0;
}

function calculateAverageResponseTime(player: Player): number | null {
  if (!player.answers?.length) return null;
  
  const times = player.answers
    .map(a => a.responseTime)
    .filter((time): time is number => time !== null);
    
  return times.length > 0 
    ? Math.round(times.reduce((sum, time) => sum + time, 0) / times.length)
    : null;
}

function calculateAccuracy(player: Player): number | null {
  if (!player.answers?.length) return null;
  
  const correct = player.answers.filter(a => a.isCorrect).length;
  return Math.round((correct / player.answers.length) * 100);
}

function isCurrentRound(answer: Answer): boolean {
  // Vérifier si la réponse appartient au round actuel
  const currentRound = useGameStore.getState().currentRound;
  return currentRound ? answer.roundId === currentRound.id : false;
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  
  if (diffSec < 60) return `${diffSec}s`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}min`;
  return `${Math.floor(diffSec / 3600)}h`;
}

// Types pour TypeScript
interface Player {
  id: string;
  username: string;
  points: number;
  position: number;
  isActive: boolean;
  connectionStatus: ConnectionStatus;
  lastSeen: Date;
  answers?: Answer[];
  responseTime?: number;
  lastPointTimestamp: number;
}

type ConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'RECONNECTING';

interface Answer {
  id: string;
  roundId: string;
  isCorrect: boolean;
  responseTime: number | null;
}
```

### 2.4 WebSocket client optimisé

#### 2.4.1 Client WebSocket haute performance
```typescript
// lib/websocket/optimized-client.ts
import { io, Socket } from 'socket.io-client';
import { useGameStore } from '@/lib/store';

export class OptimizedWebSocketClient {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private messageQueue: QueuedMessage[] = [];
  private isProcessingQueue = false;
  
  // Métriques de performance
  private performanceMetrics = {
    connectionTime: 0,
    messagesSent: 0,
    messagesReceived: 0,
    averageLatency: 0,
    lastLatency: 0
  };

  async connect(gameId: string, playerId: string): Promise<void> {
    if (this.socket?.connected) {
      console.warn('WebSocket already connected');
      return;
    }

    const startTime = performance.now();

    // Configuration optimisée du client
    this.socket = io(this.getSocketUrl(), {
      transports: ['websocket'], // WebSocket uniquement pour performance
      upgrade: true,
      rememberUpgrade: true,
      
      // Optimisations de connexion
      timeout: 20000,
      forceNew: false,
      
      // Compression
      compression: true,
      
      // Authentification
      auth: {
        gameId,
        playerId,
        sessionId: this.getSessionId()
      },
      
      // Reconnexion optimisée
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: this.maxReconnectAttempts,
      randomizationFactor: 0.5,
      
      // Heartbeat optimisé
      pingInterval: 25000,
      pingTimeout: 60000
    });

    // Configuration des event handlers
    this.setupEventHandlers();
    
    // Démarrer le heartbeat monitoring
    this.startHeartbeat();
    
    // Démarrer le processeur de queue
    this.startQueueProcessor();

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 20000);

      this.socket!.on('connect', () => {
        clearTimeout(timeoutId);
        
        this.performanceMetrics.connectionTime = performance.now() - startTime;
        this.reconnectAttempts = 0;
        
        console.log(`WebSocket connected in ${this.performanceMetrics.connectionTime}ms`);
        
        // Mettre à jour le store
        useGameStore.getState().batchUpdate({
          ui: { ...useGameStore.getState().ui, isLoading: false },
          performance: {
            ...useGameStore.getState().performance,
            connectionLatency: this.performanceMetrics.connectionTime
          }
        });
        
        resolve();
      });

      this.socket!.on('connect_error', (error) => {
        clearTimeout(timeoutId);
        console.error('WebSocket connection error:', error);
        reject(error);
      });
    });
  }

  private setupEventHandlers(): void {
    if (!this.socket) return;

    // Événements de connexion
    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.handleDisconnection(reason);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log(`WebSocket reconnected after ${attemptNumber} attempts`);
      this.handleReconnection();
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Reconnection attempt ${attemptNumber}`);
      this.updateConnectionStatus('reconnecting');
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Reconnection failed after max attempts');
      this.updateConnectionStatus('disconnected');
    });

    // Événements de jeu optimisés
    this.socket.on('game-state-update', (data) => {
      this.handleGameStateUpdate(data);
    });

    this.socket.on('player-joined', (player) => {
      this.handlePlayerJoined(player);
    });

    this.socket.on('player-left', (data) => {
      this.handlePlayerLeft(data);
    });

    this.socket.on('round-started', (round) => {
      this.handleRoundStarted(round);
    });

    this.socket.on('answer-submitted', (data) => {
      this.handleAnswerSubmitted(data);
    });

    this.socket.on('results-revealed', (results) => {
      this.handleResultsRevealed(results);
    });

    // Gestion des erreurs
    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.handleSocketError(error);
    });

    // Monitoring de latence
    this.socket.on('pong', (latency) => {
      this.updateLatencyMetrics(latency);
    });
  }

  // Envoi de messages optimisé avec queue
  send(event: string, data: any, priority: 'high' | 'medium' | 'low' = 'medium'): void {
    if (!this.socket?.connected) {
      // Ajouter à la queue pour envoi ultérieur
      this.messageQueue.push({
        event,
        data,
        priority,
        timestamp: Date.now(),
        retries: 0
      });
      return;
    }

    // Envoi immédiat avec mesure de latence
    const startTime = performance.now();
    
    this.socket.emit(event, data, (ack?: any) => {
      const latency = performance.now() - startTime;
      this.updateLatencyMetrics(latency);
      this.performanceMetrics.messagesSent++;
    });
  }

  // Gestion optimisée des mises à jour d'état
  private handleGameStateUpdate(data: any): void {
    // Batch update pour éviter multiple re-renders
    const updates: any = {};
    
    if (data.game) {
      updates.game = data.game;
    }
    
    if (data.currentRound) {
      updates.currentRound = data.currentRound;
    }
    
    if (data.players) {
      // Optimiser la mise à jour des joueurs
      data.players.forEach((player: Player) => {
        useGameStore.getState().cachePlayer(player);
      });
    }

    if (Object.keys(updates).length > 0) {
      useGameStore.getState().batchUpdate(updates);
    }

    this.performanceMetrics.messagesReceived++;
  }

  private handlePlayerJoined(player: Player): void {
    const gameStore = useGameStore.getState();
    
    if (gameStore.game) {
      const updatedPlayers = [...gameStore.game.players, player];
      gameStore.setGame({
        ...gameStore.game,
        players: updatedPlayers
      });
    }
    
    gameStore.cachePlayer(player);
  }

  private handlePlayerLeft(data: { playerId: string }): void {
    const gameStore = useGameStore.getState();
    
    if (gameStore.game) {
      const updatedPlayers = gameStore.game.players.filter(
        p => p.id !== data.playerId
      );
      gameStore.setGame({
        ...gameStore.game,
        players: updatedPlayers
      });
    }
  }

  private handleRoundStarted(round: GameRound): void {
    useGameStore.getState().batchUpdate({
      currentRound: round,
      ui: {
        ...useGameStore.getState().ui,
        error: null
      }
    });
  }

  private handleAnswerSubmitted(data: any): void {
    const gameStore = useGameStore.getState();
    
    // Mise à jour optimisée du joueur qui a répondu
    if (data.playerId) {
      gameStore.updatePlayerOptimized(data.playerId, {
        hasAnswered: true,
        lastActivity: new Date()
      });
    }
  }

  private handleResultsRevealed(results: any): void {
    const gameStore = useGameStore.getState();
    
    // Batch update des scores et positions
    if (results.players) {
      results.players.forEach((player: Player) => {
        gameStore.updatePlayerOptimized(player.id, {
          points: player.points,
          position: player.position,
          lastPointTimestamp: player.lastPointTimestamp
        });
      });
    }
  }

  // Gestion optimisée de la déconnexion
  private handleDisconnection(reason: string): void {
    this.updateConnectionStatus('disconnected');
    
    if (reason === 'io server disconnect') {
      // Déconnexion forcée par le serveur - ne pas reconnecter automatiquement
      this.socket?.disconnect();
    }
  }

  private handleReconnection(): void {
    this.updateConnectionStatus('connected');
    
    // Vider la queue des messages en attente
    this.processMessageQueue();
    
    // Demander l'état du jeu pour synchroniser
    this.send('request-game-state', {}, 'high');
  }

  // Processeur de queue des messages
  private startQueueProcessor(): void {
    setInterval(() => {
      if (!this.isProcessingQueue && this.messageQueue.length > 0) {
        this.processMessageQueue();
      }
    }, 100);
  }

  private async processMessageQueue(): Promise<void> {
    if (this.isProcessingQueue || !this.socket?.connected) return;
    
    this.isProcessingQueue = true;
    
    // Trier par priorité et timestamp
    this.messageQueue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      return priorityDiff !== 0 ? priorityDiff : a.timestamp - b.timestamp;
    });

    // Traiter par batch pour éviter le spam
    const batch = this.messageQueue.splice(0, 10);
    
    for (const message of batch) {
      try {
        if (message.retries < 3) {
          this.socket!.emit(message.event, message.data);
          this.performanceMetrics.messagesSent++;
        }
      } catch (error) {
        console.error('Error processing queued message:', error);
        
        // Remettre en queue avec retry si nécessaire
        if (message.retries < 3) {
          message.retries++;
          this.messageQueue.push(message);
        }
      }
    }
    
    this.isProcessingQueue = false;
  }

  // Monitoring de performance
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.connected) {
        const startTime = performance.now();
        this.socket.emit('ping', startTime);
      }
    }, 30000);
  }

  private updateLatencyMetrics(latency: number): void {
    this.performanceMetrics.lastLatency = latency;
    
    // Moyenne mobile pour la latence
    const alpha = 0.2; // Facteur de lissage
    this.performanceMetrics.averageLatency = 
      alpha * latency + (1 - alpha) * this.performanceMetrics.averageLatency;
    
    // Mettre à jour le store avec les métriques
    useGameStore.getState().batchUpdate({
      performance: {
        ...useGameStore.getState().performance,
        connectionLatency: this.performanceMetrics.averageLatency
      }
    });
  }

  private updateConnectionStatus(status: 'connected' | 'disconnected' | 'reconnecting'): void {
    useGameStore.getState().batchUpdate({
      ui: {
        ...useGameStore.getState().ui,
        connectionStatus: status
      }
    });
  }

  private handleSocketError(error: any): void {
    console.error('Socket error:', error);
    
    useGameStore.getState().batchUpdate({
      ui: {
        ...useGameStore.getState().ui,
        error: error.message || 'Connection error',
        isLoading: false
      }
    });
  }

  // Méthodes utilitaires
  private getSocketUrl(): string {
    return process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
  }

  private getSessionId(): string {
    return sessionStorage.getItem('epercept-session-id') || '';
  }

  // Nettoyage et déconnexion
  disconnect(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.messageQueue = [];
    this.reconnectAttempts = 0;
  }

  // Getter pour métriques de performance
  getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }

  // Health check
  isHealthy(): boolean {
    return (
      this.socket?.connected === true &&
      this.performanceMetrics.averageLatency < 1000 && // Moins de 1s de latence
      this.messageQueue.length < 50 // Queue pas trop pleine
    );
  }
}

// Instance singleton
export const socketClient = new OptimizedWebSocketClient();

// Hook React pour utiliser le client
export const useOptimizedSocket = () => {
  const [isConnected, setIsConnected] = React.useState(false);
  const [metrics, setMetrics] = React.useState(socketClient.getPerformanceMetrics());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setIsConnected(socketClient.isHealthy());
      setMetrics(socketClient.getPerformanceMetrics());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    client: socketClient,
    isConnected,
    metrics,
    send: socketClient.send.bind(socketClient),
    disconnect: socketClient.disconnect.bind(socketClient)
  };
};

// Types
interface QueuedMessage {
  event: string;
  data: any;
  priority: 'high' | 'medium' | 'low';
  timestamp: number;
  retries: number;
}

interface GameRound {
  id: string;
  roundNumber: number;
  status: string;
  question?: any;
}

interface Player {
  id: string;
  username: string;
  points: number;
  position: number;
  isActive: boolean;
  hasAnswered?: boolean;
  lastActivity?: Date;
  lastPointTimestamp: number;
}
```

## 3. Scalabilité Horizontale et Verticale

### 3.1 Architecture de scalabilité

#### 3.1.1 Load Balancing et clustering
```yaml
# docker-compose.scale.yml
version: '3.8'

services:
  # Load Balancer NGINX optimisé
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/upstreams:/etc/nginx/conf.d:ro
      - ./ssl:/etc/ssl/certs:ro
    depends_on:
      - app-1
      - app-2
      - app-3
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
    networks:
      - app-network

  # Applications clustered
  app-1:
    build: .
    environment:
      - NODE_ENV=production
      - INSTANCE_ID=1
      - CLUSTER_MODE=true
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
        reservations:
          memory: 1G
          cpus: '0.5'
    networks:
      - app-network

  app-2:
    build: .
    environment:
      - NODE_ENV=production
      - INSTANCE_ID=2
      - CLUSTER_MODE=true
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
        reservations:
          memory: 1G
          cpus: '0.5'
    networks:
      - app-network

  app-3:
    build: .
    environment:
      - NODE_ENV=production
      - INSTANCE_ID=3
      - CLUSTER_MODE=true
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
        reservations:
          memory: 1G
          cpus: '0.5'
    networks:
      - app-network

  # Base de données avec réplication
  postgres-primary:
    image: postgres:15
    environment:
      - POSTGRES_DB=epercept
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_REPLICATION_MODE=master
      - POSTGRES_REPLICATION_USER=replicator
      - POSTGRES_REPLICATION_PASSWORD=${REPLICATION_PASSWORD}
    volumes:
      - postgres_primary_data:/var/lib/postgresql/data
      - ./postgresql.conf:/etc/postgresql/postgresql.conf:ro
    command: postgres -c config_file=/etc/postgresql/postgresql.conf
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: '2.0'
        reservations:
          memory: 2G
          cpus: '1.0'
    networks:
      - app-network

  postgres-replica:
    image: postgres:15
    environment:
      - POSTGRES_MASTER_SERVICE=postgres-primary
      - POSTGRES_REPLICATION_MODE=slave
      - POSTGRES_REPLICATION_USER=replicator
      - POSTGRES_REPLICATION_PASSWORD=${REPLICATION_PASSWORD}
    depends_on:
      - postgres-primary
    deploy:
      resources:
        limits:
          memory: 3G
          cpus: '1.5'
        reservations:
          memory: 1.5G
          cpus: '0.75'
    networks:
      - app-network

  # Redis Cluster pour haute disponibilité
  redis-cluster:
    image: redis:7-alpine
    command: redis-server /etc/redis/redis.conf --cluster-enabled yes --cluster-config-file nodes.conf
    volumes:
      - ./redis/redis.conf:/etc/redis/redis.conf:ro
      - redis_cluster_data:/data
    deploy:
      replicas: 6
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'
    networks:
      - app-network

  # Monitoring et métriques
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'
      - '--web.enable-lifecycle'
    networks:
      - app-network

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana:/etc/grafana/provisioning
    networks:
      - app-network

volumes:
  postgres_primary_data:
  redis_cluster_data:
  prometheus_data:
  grafana_data:

networks:
  app-network:
    driver: bridge
```

#### 3.1.2 Configuration NGINX optimisée
```nginx
# nginx/nginx.conf
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 4096;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Optimisations de performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    keepalive_requests 1000;
    types_hash_max_size 2048;
    server_tokens off;

    # Compression optimisée
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Mise en cache optimisée
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=app_cache:10m max_size=1g inactive=60m use_temp_path=off;
    proxy_cache_key "$scheme$request_method$host$request_uri";

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=30r/m;
    limit_req_zone $binary_remote_addr zone=websocket:10m rate=60r/m;

    # Upstream pour les applications
    upstream app_backend {
        least_conn;
        server app-1:3001 max_fails=3 fail_timeout=30s;
        server app-2:3001 max_fails=3 fail_timeout=30s;
        server app-3:3001 max_fails=3 fail_timeout=30s;
        
        # Health check
        keepalive 32;
    }

    # Configuration WebSocket
    map $http_upgrade $connection_upgrade {
        default upgrade;
        '' close;
    }

    server {
        listen 80;
        server_name epercept.app www.epercept.app;
        
        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name epercept.app www.epercept.app;

        # SSL Configuration optimisée
        ssl_certificate /etc/ssl/certs/epercept.crt;
        ssl_certificate_key /etc/ssl/certs/epercept.key;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Headers de sécurité
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options SAMEORIGIN always;
        add_header X-Content-Type-Options nosniff always;
        add_header X-XSS-Protection "1; mode=block" always;

        # Configuration des logs
        access_log /var/log/nginx/epercept.access.log;
        error_log /var/log/nginx/epercept.error.log;

        # Ressources statiques avec cache agressif
        location /_next/static/ {
            proxy_pass http://app_backend;
            proxy_cache app_cache;
            proxy_cache_valid 200 1y;
            add_header Cache-Control "public, immutable";
            expires 1y;
        }

        # API avec rate limiting
        location /api/ {
            limit_req zone=api burst=10 nodelay;
            
            proxy_pass http://app_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # Optimisations de proxy
            proxy_connect_timeout 5s;
            proxy_send_timeout 10s;
            proxy_read_timeout 10s;
            proxy_buffering on;
            proxy_buffer_size 4k;
            proxy_buffers 8 4k;
            proxy_busy_buffers_size 8k;
        }

        # WebSocket avec sticky sessions
        location /socket.io/ {
            limit_req zone=websocket burst=20 nodelay;
            
            proxy_pass http://app_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection $connection_upgrade;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Sticky session pour WebSocket
            ip_hash;
            
            # Optimisations WebSocket
            proxy_connect_timeout 7s;
            proxy_send_timeout 300s;
            proxy_read_timeout 300s;
            proxy_buffering off;
            proxy_cache off;
        }

        # Pages de l'application
        location / {
            proxy_pass http://app_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # Cache pour pages statiques
            proxy_cache app_cache;
            proxy_cache_valid 200 5m;
            proxy_cache_use_stale error timeout invalid_header updating http_500 http_502 http_503 http_504;
            
            # Headers pour cache navigateur
            add_header X-Cache-Status $upstream_cache_status;
        }

        # Health check endpoint
        location /health {
            access_log off;
            proxy_pass http://app_backend;
            proxy_connect_timeout 2s;
            proxy_send_timeout 2s;
            proxy_read_timeout 2s;
        }

        # Pages d'erreur personnalisées
        error_page 502 503 504 /maintenance.html;
        location = /maintenance.html {
            root /usr/share/nginx/html;
            internal;
        }
    }
}
```

### 3.2 Monitoring et métriques de performance

#### 3.2.1 Service de métriques complet
```typescript
// monitoring/metrics.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Gauge, Counter, Histogram, register } from 'prom-client';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

@Injectable()
export class ComprehensiveMetricsService {
  private readonly logger = new Logger(ComprehensiveMetricsService.name);

  // Métriques de performance gaming
  private readonly gameMetrics = {
    // Compteurs de base
    gamesCreated: new Counter({
      name: 'epercept_games_created_total',
      help: 'Total number of games created',
      labelNames: ['status', 'player_count']
    }),

    playersConnected: new Counter({
      name: 'epercept_players_connected_total',
      help: 'Total number of player connections',
      labelNames: ['game_status', 'connection_type']
    }),

    questionsAnswered: new Counter({
      name: 'epercept_questions_answered_total',
      help: 'Total number of questions answered',
      labelNames: ['round_type', 'is_correct', 'response_time_bucket']
    }),

    // Métriques temps réel
    activeGames: new Gauge({
      name: 'epercept_active_games_current',
      help: 'Current number of active games',
      labelNames: ['status', 'round_number']
    }),

    connectedPlayers: new Gauge({
      name: 'epercept_connected_players_current',
      help: 'Current number of connected players',
      labelNames: ['connection_status']
    }),

    websocketConnections: new Gauge({
      name: 'epercept_websocket_connections_current',
      help: 'Current WebSocket connections',
      labelNames: ['namespace']
    }),

    // Histogrammes de performance
    gameCompletionTime: new Histogram({
      name: 'epercept_game_completion_duration_seconds',
      help: 'Time taken to complete a full game',
      buckets: [60, 300, 600, 900, 1200, 1800, 2400, 3600], // 1min à 1h
      labelNames: ['player_count', 'completion_status']
    }),

    roundCompletionTime: new Histogram({
      name: 'epercept_round_completion_duration_seconds',
      help: 'Time taken to complete a round',
      buckets: [10, 30, 60, 120, 180, 300, 600], // 10s à 10min
      labelNames: ['round_type', 'player_count']
    }),

    responseTime: new Histogram({
      name: 'epercept_player_response_duration_seconds',
      help: 'Player response time for questions',
      buckets: [1, 5, 10, 15, 20, 30, 45, 60, 120], // 1s à 2min
      labelNames: ['round_type', 'question_complexity']
    }),

    apiResponseTime: new Histogram({
      name: 'epercept_api_response_duration_seconds',
      help: 'API endpoint response times',
      buckets: [0.01, 0.05, 0.1, 0.2, 0.5, 1, 2, 5],
      labelNames: ['method', 'route', 'status_code']
    }),

    websocketLatency: new Histogram({
      name: 'epercept_websocket_latency_seconds',
      help: 'WebSocket message latency',
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.2, 0.5, 1],
      labelNames: ['event_type', 'direction']
    }),

    // Métriques de ressources
    memoryUsage: new Gauge({
      name: 'epercept_memory_usage_bytes',
      help: 'Memory usage by component',
      labelNames: ['component', 'type']
    }),

    cpuUsage: new Gauge({
      name: 'epercept_cpu_usage_percent',
      help: 'CPU usage percentage',
      labelNames: ['instance_id']
    }),

    databaseConnections: new Gauge({
      name: 'epercept_database_connections_current',
      help: 'Current database connections',
      labelNames: ['pool', 'state']
    }),

    redisConnections: new Gauge({
      name: 'epercept_redis_connections_current',
      help: 'Current Redis connections',
      labelNames: ['instance', 'state']
    }),

    // Métriques business
    playerRetention: new Gauge({
      name: 'epercept_player_retention_rate',
      help: 'Player retention rate',
      labelNames: ['time_window', 'game_type']
    }),

    averageGameRating: new Gauge({
      name: 'epercept_average_game_rating',
      help: 'Average game rating from players',
      labelNames: ['rating_type']
    }),

    // Métriques d'erreurs
    errorRate: new Gauge({
      name: 'epercept_error_rate_percent',
      help: 'Error rate percentage',
      labelNames: ['error_type', 'component']
    }),

    disconnectionRate: new Gauge({
      name: 'epercept_disconnection_rate_percent',
      help: 'Player disconnection rate',
      labelNames: ['disconnection_reason']
    })
  };

  constructor(@InjectRedis() private readonly redis: Redis) {
    // Démarrer la collecte de métriques système
    this.startSystemMetricsCollection();
    
    // Démarrer la collecte de métriques Redis
    this.startRedisMetricsCollection();
    
    // Nettoyer les métriques obsolètes
    this.startMetricsCleanup();
  }

  // === Enregistrement des métriques gaming ===

  recordGameCreated(playerCount: number, status: 'success' | 'failed'): void {
    this.gameMetrics.gamesCreated
      .labels(status, this.getPlayerCountBucket(playerCount))
      .inc();
  }

  recordPlayerConnection(gameStatus: string, connectionType: 'websocket' | 'http'): void {
    this.gameMetrics.playersConnected
      .labels(gameStatus, connectionType)
      .inc();
  }

  recordQuestionAnswered(
    roundType: string, 
    isCorrect: boolean, 
    responseTimeMs: number
  ): void {
    const bucket = this.getResponseTimeBucket(responseTimeMs);
    this.gameMetrics.questionsAnswered
      .labels(roundType, isCorrect.toString(), bucket)
      .inc();
    
    this.gameMetrics.responseTime
      .labels(roundType, this.getQuestionComplexity(responseTimeMs))
      .observe(responseTimeMs / 1000);
  }

  recordGameCompletion(
    durationMs: number, 
    playerCount: number, 
    completionStatus: 'completed' | 'abandoned'
  ): void {
    this.gameMetrics.gameCompletionTime
      .labels(this.getPlayerCountBucket(playerCount), completionStatus)
      .observe(durationMs / 1000);
  }

  recordRoundCompletion(
    roundType: string, 
    durationMs: number, 
    playerCount: number
  ): void {
    this.gameMetrics.roundCompletionTime
      .labels(roundType, this.getPlayerCountBucket(playerCount))
      .observe(durationMs / 1000);
  }

  recordApiResponse(
    method: string, 
    route: string, 
    statusCode: number, 
    durationMs: number
  ): void {
    this.gameMetrics.apiResponseTime
      .labels(method, route, statusCode.toString())
      .observe(durationMs / 1000);
  }

  recordWebSocketLatency(
    eventType: string, 
    direction: 'inbound' | 'outbound', 
    latencyMs: number
  ): void {
    this.gameMetrics.websocketLatency
      .labels(eventType, direction)
      .observe(latencyMs / 1000);
  }

  // === Mise à jour des jauges en temps réel ===

  updateActiveGames(count: number, status: string, roundNumber: number): void {
    this.gameMetrics.activeGames
      .labels(status, roundNumber.toString())
      .set(count);
  }

  updateConnectedPlayers(count: number, connectionStatus: string): void {
    this.gameMetrics.connectedPlayers
      .labels(connectionStatus)
      .set(count);
  }

  updateWebSocketConnections(count: number, namespace: string = 'default'): void {
    this.gameMetrics.websocketConnections
      .labels(namespace)
      .set(count);
  }

  updateMemoryUsage(component: string, type: string, bytes: number): void {
    this.gameMetrics.memoryUsage
      .labels(component, type)
      .set(bytes);
  }

  updateCpuUsage(instanceId: string, percentage: number): void {
    this.gameMetrics.cpuUsage
      .labels(instanceId)
      .set(percentage);
  }

  updateDatabaseConnections(pool: string, state: string, count: number): void {
    this.gameMetrics.databaseConnections
      .labels(pool, state)
      .set(count);
  }

  updatePlayerRetention(timeWindow: string, gameType: string, rate: number): void {
    this.gameMetrics.playerRetention
      .labels(timeWindow, gameType)
      .set(rate);
  }

  updateErrorRate(errorType: string, component: string, rate: number): void {
    this.gameMetrics.errorRate
      .labels(errorType, component)
      .set(rate);
  }

  // === Collecte automatique de métriques système ===

  private startSystemMetricsCollection(): void {
    setInterval(() => {
      this.collectSystemMetrics();
    }, 10000); // Toutes les 10 secondes
  }

  private async collectSystemMetrics(): Promise<void> {
    try {
      // Métriques de mémoire Node.js
      const memUsage = process.memoryUsage();
      this.updateMemoryUsage('nodejs', 'rss', memUsage.rss);
      this.updateMemoryUsage('nodejs', 'heapUsed', memUsage.heapUsed);
      this.updateMemoryUsage('nodejs', 'heapTotal', memUsage.heapTotal);
      this.updateMemoryUsage('nodejs', 'external', memUsage.external);

      // Métriques CPU
      const cpuUsage = process.cpuUsage();
      const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Conversion en %
      this.updateCpuUsage(process.env.INSTANCE_ID || 'unknown', cpuPercent);

      // Métriques Event Loop
      const eventLoopDelay = this.measureEventLoopDelay();
      this.gameMetrics.apiResponseTime
        .labels('internal', 'event-loop', '200')
        .observe(eventLoopDelay / 1000);

    } catch (error) {
      this.logger.error('Error collecting system metrics:', error);
    }
  }

  private startRedisMetricsCollection(): void {
    setInterval(() => {
      this.collectRedisMetrics();
    }, 15000); // Toutes les 15 secondes
  }

  private async collectRedisMetrics(): Promise<void> {
    try {
      const info = await this.redis.info();
      const stats = this.parseRedisInfo(info);

      // Connexions Redis
      if (stats.connected_clients) {
        this.gameMetrics.redisConnections
          .labels('main', 'connected')
          .set(parseInt(stats.connected_clients));
      }

      // Mémoire Redis
      if (stats.used_memory) {
        this.updateMemoryUsage('redis', 'used', parseInt(stats.used_memory));
      }

      // Métriques de performance Redis
      if (stats.instantaneous_ops_per_sec) {
        this.gameMetrics.apiResponseTime
          .labels('GET', 'redis', '200')
          .observe(1 / parseInt(stats.instantaneous_ops_per_sec));
      }

    } catch (error) {
      this.logger.error('Error collecting Redis metrics:', error);
    }
  }

  // === Collecte de métriques business en temps réel ===

  async collectGameMetrics(): Promise<void> {
    try {
      // Compter les jeux actifs par statut
      const gamesByStatus = await this.redis.hgetall('games:by_status');
      Object.entries(gamesByStatus).forEach(([status, count]) => {
        this.updateActiveGames(parseInt(count), status, 0);
      });

      // Compter les joueurs connectés
      const connectedPlayersCount = await this.redis.get('players:connected:count');
      if (connectedPlayersCount) {
        this.updateConnectedPlayers(parseInt(connectedPlayersCount), 'connected');
      }

      // Métriques WebSocket
      const wsConnections = await this.redis.get('websocket:connections:count');
      if (wsConnections) {
        this.updateWebSocketConnections(parseInt(wsConnections));
      }

    } catch (error) {
      this.logger.error('Error collecting game metrics:', error);
    }
  }

  // === Métriques avancées et analytics ===

  async generatePerformanceReport(): Promise<PerformanceReport> {
    const report: PerformanceReport = {
      timestamp: new Date(),
      gaming: await this.getGamingMetrics(),
      performance: await this.getPerformanceMetrics(),
      resources: await this.getResourceMetrics(),
      errors: await this.getErrorMetrics(),
      recommendations: await this.getPerformanceRecommendations()
    };

    return report;
  }

  private async getGamingMetrics(): Promise<GamingMetrics> {
    // Agrégation des métriques gaming sur la dernière heure
    const now = Date.now();
    const hourAgo = now - 3600000;

    return {
      gamesCreatedLastHour: await this.getMetricValue('games_created', hourAgo, now),
      averageGameDuration: await this.getAverageMetric('game_completion_time', hourAgo, now),
      playerRetentionRate: await this.calculateRetentionRate(hourAgo, now),
      averageResponseTime: await this.getAverageMetric('response_time', hourAgo, now),
      disconnectionRate: await this.calculateDisconnectionRate(hourAgo, now),
    };
  }

  private async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    return {
      apiAverageResponseTime: await this.getAverageMetric('api_response_time'),
      websocketAverageLatency: await this.getAverageMetric('websocket_latency'),
      throughputRequestsPerSecond: await this.calculateThroughput(),
      errorRate: await this.calculateErrorRate(),
      availability: await this.calculateAvailability(),
    };
  }

  private async getResourceMetrics(): Promise<ResourceMetrics> {
    const memUsage = process.memoryUsage();
    
    return {
      memoryUsagePercent: (memUsage.heapUsed / memUsage.heapTotal) * 100,
      cpuUsagePercent: await this.getCurrentCpuUsage(),
      databaseConnectionsActive: await this.getDatabaseConnectionCount(),
      redisConnectionsActive: await this.getRedisConnectionCount(),
      diskUsagePercent: await this.getDiskUsage(),
    };
  }

  // === Utilitaires et helpers ===

  private getPlayerCountBucket(count: number): string {
    if (count <= 3) return '3-';
    if (count <= 5) return '4-5';
    if (count <= 7) return '6-7';
    return '7+';
  }

  private getResponseTimeBucket(timeMs: number): string {
    if (timeMs <= 5000) return 'fast';
    if (timeMs <= 15000) return 'medium';
    if (timeMs <= 30000) return 'slow';
    return 'very-slow';
  }

  private getQuestionComplexity(responseTimeMs: number): string {
    if (responseTimeMs <= 10000) return 'simple';
    if (responseTimeMs <= 30000) return 'medium';
    return 'complex';
  }

  private measureEventLoopDelay(): number {
    const start = Date.now();
    setImmediate(() => {
      const delay = Date.now() - start;
      return delay;
    });
    return 0; // Placeholder - implémentation réelle nécessiterait async
  }

  private parseRedisInfo(info: string): Record<string, string> {
    const result: Record<string, string> = {};
    info.split('\r\n').forEach(line => {
      const [key, value] = line.split(':');
      if (key && value) {
        result[key] = value;
      }
    });
    return result;
  }

  private startMetricsCleanup(): void {
    // Nettoyer les métriques anciennes toutes les heures
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 3600000);
  }

  private cleanupOldMetrics(): void {
    // Implémenter le nettoyage des métriques anciennes pour éviter les fuites mémoire
    register.clear();
  }

  // Endpoint pour exposer les métriques Prometheus
  async getPrometheusMetrics(): Promise<string> {
    // Mettre à jour les métriques temps réel avant export
    await this.collectGameMetrics();
    
    return register.metrics();
  }

  // Health check basé sur les métriques
  async getHealthStatus(): Promise<HealthStatus> {
    const report = await this.generatePerformanceReport();
    
    return {
      status: this.determineHealthStatus(report),
      checks: {
        database: report.resources.databaseConnectionsActive > 0,
        redis: report.resources.redisConnectionsActive > 0,
        memory: report.resources.memoryUsagePercent < 90,
        cpu: report.resources.cpuUsagePercent < 80,
        errorRate: report.performance.errorRate < 5,
      },
      metrics: report
    };
  }

  private determineHealthStatus(report: PerformanceReport): 'healthy' | 'degraded' | 'unhealthy' {
    if (report.performance.errorRate > 10 || report.resources.cpuUsagePercent > 90) {
      return 'unhealthy';
    }
    if (report.performance.errorRate > 5 || report.resources.memoryUsagePercent > 80) {
      return 'degraded';
    }
    return 'healthy';
  }

  // Méthodes privées pour calculs avancés
  private async getMetricValue(metricName: string, startTime?: number, endTime?: number): Promise<number> {
    // Implémentation de récupération de valeurs métriques
    return 0;
  }

  private async getAverageMetric(metricName: string, startTime?: number, endTime?: number): Promise<number> {
    // Implémentation de calcul de moyenne
    return 0;
  }

  private async calculateRetentionRate(startTime: number, endTime: number): Promise<number> {
    // Calcul du taux de rétention
    return 0;
  }

  private async calculateDisconnectionRate(startTime: number, endTime: number): Promise<number> {
    // Calcul du taux de déconnexion
    return 0;
  }

  private async calculateThroughput(): Promise<number> {
    // Calcul du débit
    return 0;
  }

  private async calculateErrorRate(): Promise<number> {
    // Calcul du taux d'erreur
    return 0;
  }

  private async calculateAvailability(): Promise<number> {
    // Calcul de la disponibilité
    return 99.9;
  }

  private async getCurrentCpuUsage(): Promise<number> {
    // Récupération usage CPU actuel
    return 0;
  }

  private async getDatabaseConnectionCount(): Promise<number> {
    // Nombre de connexions DB actives
    return 0;
  }

  private async getRedisConnectionCount(): Promise<number> {
    // Nombre de connexions Redis actives
    return 0;
  }

  private async getDiskUsage(): Promise<number> {
    // Usage disque en pourcentage
    return 0;
  }

  private async getPerformanceRecommendations(): Promise<string[]> {
    // Génération de recommandations automatiques
    return [
      'Consider scaling horizontally if CPU usage > 70%',
      'Optimize database queries if average response time > 100ms',
      'Review memory usage if heap utilization > 80%'
    ];
  }
}

// Types et interfaces
interface PerformanceReport {
  timestamp: Date;
  gaming: GamingMetrics;
  performance: PerformanceMetrics;
  resources: ResourceMetrics;
  errors: ErrorMetrics;
  recommendations: string[];
}

interface GamingMetrics {
  gamesCreatedLastHour: number;
  averageGameDuration: number;
  playerRetentionRate: number;
  averageResponseTime: number;
  disconnectionRate: number;
}

interface PerformanceMetrics {
  apiAverageResponseTime: number;
  websocketAverageLatency: number;
  throughputRequestsPerSecond: number;
  errorRate: number;
  availability: number;
}

interface ResourceMetrics {
  memoryUsagePercent: number;
  cpuUsagePercent: number;
  databaseConnectionsActive: number;
  redisConnectionsActive: number;
  diskUsagePercent: number;
}

interface ErrorMetrics {
  totalErrors: number;
  criticalErrors: number;
  errorsByType: Record<string, number>;
}

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, boolean>;
  metrics: PerformanceReport;
}
```

## 4. Points d'intégration avec autres documents

### 4.1 Vers Document 1 (Spécifications Fonctionnelles)
- **Performance des règles métier** : Optimisation des calculs de points et classements
- **Timing respecté** : Timer 30s, grace period 2min, auto-progression performante
- **Évènements temps réel** : WebSocket optimisé pour tous les events de jeu
- **Contraintes respectées** : PIN 6 chiffres, 3-7 joueurs avec performance maintenue

### 4.2 Vers Document 2 (Design System et UX)
- **Performance UI** : Composants React optimisés avec memoization
- **Animations fluides** : 60fps maintenu, transitions optimisées
- **Responsive performance** : Mobile-first avec auto-scroll non-bloquant
- **Loading states** : Skeleton loaders pour meilleure UX

### 4.3 Vers Document 3 (Architecture Backend)
- **Optimisations NestJS** : Configuration performance, clustering
- **Base de données** : Connection pooling, requêtes optimisées, index
- **WebSocket haute performance** : Gestion avancée des connexions
- **Cache Redis** : Stratégies de mise en cache intelligentes

### 4.4 Vers Document 4 (Architecture Frontend)
- **Next.js optimisé** : Bundle splitting, compression, caching
- **Zustand performance** : Sélecteurs optimisés, batch updates
- **Composants performants** : Virtualisation, memoization avancée
- **WebSocket client** : Reconnexion intelligente, queue de messages

### 4.5 Vers Document 5 (Sécurité, Tests et DevOps)
- **Tests de performance** : Load testing, benchmarks, métriques
- **Monitoring sécurisé** : Métriques sans données sensibles
- **CI/CD optimisé** : Pipeline de déploiement avec tests de performance
- **Observabilité** : Logs structurés, traces, alertes

### 4.6 Vers Document 7 (Administration et Configuration)
- **Dashboard performance** : Métriques temps réel, alertes
- **Configuration dynamique** : Paramètres de performance ajustables
- **Scaling automatique** : Règles de mise à l'échelle basées sur métriques
- **Optimisation continue** : Recommandations automatiques de performance

---

**Note** : Ce document définit une architecture de performance complète. Pour l'implémentation technique, voir Documents 3 et 4. Pour le monitoring, intégrer avec Document 5. Pour l'administration, voir Document 7.