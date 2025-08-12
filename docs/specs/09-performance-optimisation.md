## 9. Performance et optimisation avancée

### 9.1 Architecture de cache multicouche

**⚠️ CONFIGURATION CENTRALISÉE** : Toutes les variables Redis/cache référencent ENV_VARIABLES.md pour cohérence globale.

#### Stratégie de cache Redis optimisée

```typescript
// Service de cache intelligent avec TTL adaptatif
@Injectable()
export class CacheService {
  constructor(
    private readonly redis: Redis,
    private readonly logger: Logger
  ) {}
  
  // Cache adapté au gaming avec TTL configurables (référence ENV_VARIABLES.md)
  private readonly cacheTTL = {
    // Données statiques (longue durée)
    questions: parseInt(process.env.CACHE_QUESTIONS_TTL) || 24 * 60 * 60, // Configurable
    gameConfig: parseInt(process.env.CACHE_CONFIG_TTL) || 12 * 60 * 60, // Configurable
    
    // Données de jeu (durée moyenne)  
    gameState: parseInt(process.env.CACHE_GAMESTATE_TTL) || 30 * 60, // Configurable
    playerSession: parseInt(process.env.CACHE_SESSION_TTL) || 60 * 60, // Configurable
    leaderboard: parseInt(process.env.CACHE_LEADERBOARD_TTL) || 5 * 60, // Configurable
    
    // Données temps réel (courte durée)
    activeGames: parseInt(process.env.CACHE_ACTIVE_TTL) || 60, // Configurable
    playerPresence: parseInt(process.env.CACHE_PRESENCE_TTL) || 30, // Configurable
    rateLimit: parseInt(process.env.CACHE_RATELIMIT_TTL) || 60 // Configurable
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

**⚠️ TYPES RÉFÉRENCÉS** : Tous types utilisés sont définis dans l'architecture Batch 2 (04-architecture-frontend.md, 05-architecture-backend.md).

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
  // GameWithDetails: voir architecture backend types (Batch 2)
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
            take: 1 // Seul le round en cours
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
  // GameSummary: voir architecture backend types (Batch 2)
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
      
      // Mettre en cache les données
      const pipeline = this.redis.pipeline();
      freshData.forEach(game => {
        const summary = this.convertToSummary(game);
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
  // GameStream: voir architecture backend types (Batch 2)
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

**⚠️ DESIGN SYSTEM RÉFÉRENCÉ** : Tous styles et composants référencent DESIGN_TOKENS.md (Batch 4) pour cohérence visuelle.

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
      roundProgress: (gameState.currentRound / gameState.totalRounds) * 100, // Configuration admin
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
    <div className="game-screen"> {/* Styles: référence DESIGN_TOKENS.md */}
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
    <div ref={parentRef} className="player-list-container"> {/* Styles: référence DESIGN_TOKENS.md */}
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
          password: process.env.REDIS_PASSWORD, // Référence ENV_VARIABLES.md
          host: process.env.REDIS_HOST || 'localhost', // Config centralisée
          port: parseInt(process.env.REDIS_PORT) || 6379 // Config centralisée
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

### 10.1 Fonctionnalités prioritaires
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
- **Croissance**: 20% MoM utilisateurs supplémentaires
- **Rétention**: 40% J+7, 20% J+30
- **CAC < LTV**: Coût acquisition < valeur vie client
- **Unit economics**: Positifs dès M+6

### 10.5 Stratégie de maintenance long terme

#### Efforts mensuels recommandés
- **Updates sécurité**: 4h - Patches critiques et audits
- **Bug fixes**: 8h - Résolution issues utilisateurs
- **Monitoring**: 4h - Analyse métriques et optimisations
- **Features mineures**: 16h - Optimisations UX et questions supplémentaires
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
- [ ] Plan d'évolution établi pour les prochaines versions