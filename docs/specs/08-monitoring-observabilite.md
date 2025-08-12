## 8. Monitoring et observabilité avancée

### 8.1 Architecture d'observabilité

**⚠️ CONFIGURATION CENTRALISÉE** : Variables NODE_ENV, APP_VERSION et endpoints référencent la configuration technique unifiée (voir 10-contenu-configuration.md).

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

### 8.2 Logging structuré

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
      level: process.env.LOG_LEVEL || 'info', // Référence config centralisée
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
            version: process.env.APP_VERSION || '1.0.0', // Config centralisée
            environment: process.env.NODE_ENV || 'development', // Config centralisée
            ...meta
          });
        })
      ),
      transports: [
        // Console pour développement
        new transports.Console({
          format: process.env.NODE_ENV === 'development' // Réf config centralisée 
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
    if (process.env.NODE_ENV === 'production' && process.env.ELASTICSEARCH_URL) { // Config centralisée
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

### 8.3 Métriques et instrumentation

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
      version: process.env.APP_VERSION || '1.0.0' // Config centralisée
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

### 8.4 Tracing distribué

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
        [SemanticResourceAttributes.SERVICE_VERSION]: process.env.APP_VERSION || '1.0.0', // Config centralisée
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development' // Config centralisée
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

### 8.5 Alerting intelligent

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

### 8.6 Dashboards Grafana

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