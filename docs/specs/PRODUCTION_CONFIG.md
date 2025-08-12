# Configuration Production - Epercept

## ⚠️ CONFIGURATION PRODUCTION FINALE
Ce fichier consolide toutes les variables d'environnement et configurations pour le déploiement production d'Epercept.

## 🔧 Variables d'Environnement Production

### Application Core
```bash
# Version et environnement
APP_NAME=epercept
APP_VERSION=1.0.0
NODE_ENV=production
PORT=443

# Service naming (cohérence monitoring)
SERVICE_NAME=epercept-api
```

### Base de Données Production
```bash
# PostgreSQL principal
DATABASE_URL=postgresql://epercept_prod:${DB_PASSWORD}@prod-db:5432/epercept
DB_POOL_MIN=5
DB_POOL_MAX=20
DB_CONNECTION_TIMEOUT=10000
```

### Redis Cache & Sessions
```bash
# Configuration Redis production
REDIS_URL=redis://:${REDIS_PASSWORD}@redis-cluster:6379
REDIS_HOST=redis-cluster
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_SECURE_PASSWORD}

# Cache TTL configurables (09-performance-optimisation.md)
CACHE_QUESTIONS_TTL=86400         # 24h
CACHE_CONFIG_TTL=43200           # 12h  
CACHE_GAMESTATE_TTL=1800         # 30min
CACHE_SESSION_TTL=3600           # 1h
CACHE_LEADERBOARD_TTL=300        # 5min
CACHE_ACTIVE_TTL=60              # 1min
CACHE_PRESENCE_TTL=30            # 30s
CACHE_RATELIMIT_TTL=60           # 1min
```

### Sécurité Production
```bash
# JWT Configuration
JWT_SECRET=${JWT_PRODUCTION_SECRET}
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# HTTPS et sécurité
SSL_CERT_PATH=/etc/ssl/certs/epercept.crt
SSL_KEY_PATH=/etc/ssl/private/epercept.key
CORS_ORIGINS=https://epercept.fr,https://www.epercept.fr
```

### OAuth Production
```bash
# Google OAuth
GOOGLE_CLIENT_ID=${GOOGLE_PROD_CLIENT_ID}
GOOGLE_CLIENT_SECRET=${GOOGLE_PROD_CLIENT_SECRET}
GOOGLE_CALLBACK_URL=https://api.epercept.fr/api/v1/auth/oauth/google/callback

# Facebook OAuth
FACEBOOK_CLIENT_ID=${FACEBOOK_PROD_CLIENT_ID}
FACEBOOK_CLIENT_SECRET=${FACEBOOK_PROD_CLIENT_SECRET}
FACEBOOK_CALLBACK_URL=https://api.epercept.fr/api/v1/auth/oauth/facebook/callback

# Apple OAuth
APPLE_CLIENT_ID=${APPLE_PROD_CLIENT_ID}
APPLE_TEAM_ID=${APPLE_TEAM_ID}
APPLE_KEY_ID=${APPLE_KEY_ID}
APPLE_PRIVATE_KEY_PATH=/etc/ssl/apple/apple-private-key.p8
```

### Email Production
```bash
# SMTP Configuration
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=noreply@epercept.fr
SMTP_PASSWORD=${SMTP_PRODUCTION_PASSWORD}

# Email settings
EMAIL_FROM=noreply@epercept.fr
EMAIL_FROM_NAME=Epercept
```

### Monitoring & Observabilité
```bash
# Winston logging (08-monitoring-observabilite.md)
LOG_LEVEL=warn
LOG_FILE_ENABLED=true
LOG_FILE_PATH=/var/log/epercept/
LOG_MAX_SIZE=10485760            # 10MB
LOG_MAX_FILES=10

# Elasticsearch (logs centralisés)
ELASTICSEARCH_URL=https://elasticsearch.epercept.fr:9200
ELASTICSEARCH_USER=epercept_logs
ELASTICSEARCH_PASSWORD=${ELASTICSEARCH_PASSWORD}

# Prometheus metrics
METRICS_ENABLED=true
METRICS_PORT=9090
METRICS_PREFIX=epercept_         # Cohérence Batch 4

# Jaeger tracing
JAEGER_ENABLED=true
JAEGER_ENDPOINT=https://jaeger.epercept.fr/api/traces
JAEGER_SERVICE_NAME=epercept-api
```

### Performance & Scaling
```bash
# Load balancing
CLUSTER_MODE=true
WORKERS_COUNT=4

# Rate limiting
RATE_LIMIT_WINDOW=900000         # 15min
RATE_LIMIT_MAX=100               # Requests per window

# WebSocket settings
WS_MAX_CONNECTIONS=10000
WS_HEARTBEAT_INTERVAL=25000      # 25s
WS_TIMEOUT=5000                  # 5s
```

### Frontend Production
```bash
# Next.js variables
NEXT_PUBLIC_API_URL=https://api.epercept.fr/api/v1
NEXT_PUBLIC_WS_URL=https://api.epercept.fr
NEXT_PUBLIC_APP_NAME=Epercept
NEXT_PUBLIC_VERSION=1.0.0

# Game configuration (standards Batch 1)
NEXT_PUBLIC_MIN_PLAYERS=3
NEXT_PUBLIC_MAX_PLAYERS=7
NEXT_PUBLIC_RECONNECTION_TIMEOUT=120000  # 2min

# i18n configuration (Batch 3)
NEXT_PUBLIC_DEFAULT_LOCALE=fr
NEXT_PUBLIC_SUPPORTED_LOCALES=fr,en,es,it,pt,de
NEXT_PUBLIC_FALLBACK_LOCALE=fr

# CDN et optimisations
NEXT_PUBLIC_CDN_URL=https://cdn.epercept.fr
NEXT_PUBLIC_ANALYTICS_ID=${GOOGLE_ANALYTICS_ID}
```

## 🚀 Configuration Infrastructure

### Docker Compose Production
```yaml
version: '3.8'
services:
  api:
    image: epercept/api:${APP_VERSION}
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M
    
  frontend:
    image: epercept/frontend:${APP_VERSION}
    environment:
      - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
      - NEXT_PUBLIC_WS_URL=${NEXT_PUBLIC_WS_URL}
    deploy:
      replicas: 2
      
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    deploy:
      resources:
        limits:
          memory: 256M
          
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=epercept
      - POSTGRES_USER=epercept_prod
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    deploy:
      resources:
        limits:
          memory: 1G

volumes:
  redis_data:
  postgres_data:
```

### Nginx Configuration
```nginx
upstream api_backend {
  ip_hash;  # Sticky sessions pour WebSocket
  server api_1:3000 max_fails=3 fail_timeout=30s;
  server api_2:3000 max_fails=3 fail_timeout=30s;
  server api_3:3000 max_fails=3 fail_timeout=30s;
}

upstream frontend_backend {
  server frontend_1:3000;
  server frontend_2:3000;
}

server {
  listen 443 ssl http2;
  server_name epercept.fr www.epercept.fr;
  
  # SSL Configuration
  ssl_certificate /etc/ssl/certs/epercept.crt;
  ssl_certificate_key /etc/ssl/private/epercept.key;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_ciphers ECDHE+AESGCM:ECDHE+AES256:ECDHE+AES128:!aNULL:!MD5:!DSS;
  
  # Security headers
  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  add_header X-Frame-Options DENY always;
  add_header X-Content-Type-Options nosniff always;
  add_header Referrer-Policy strict-origin-when-cross-origin always;
  
  # Frontend
  location / {
    proxy_pass http://frontend_backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
  
  # API Backend
  location /api/ {
    proxy_pass http://api_backend;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # API optimizations
    proxy_buffering on;
    proxy_buffer_size 8k;
    proxy_buffers 32 8k;
  }
  
  # WebSocket
  location /socket.io/ {
    proxy_pass http://api_backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # WebSocket optimizations
    proxy_buffering off;
    proxy_cache off;
    proxy_read_timeout 86400s;
    proxy_send_timeout 86400s;
  }
}
```

## 📊 Monitoring Production

### Prometheus Configuration
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'epercept-api'
    static_configs:
      - targets: ['api:9090']
    metrics_path: '/metrics'
    
  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-exporter:9113']
      
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
      
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']
```

### Grafana Dashboards
- **Overview** : Métriques globales application
- **API Performance** : Latence, throughput, errors
- **WebSocket** : Connexions actives, messages/sec
- **Infrastructure** : CPU, RAM, disk, network
- **Business Metrics** : Parties créées, joueurs actifs

### Alerting Rules
```yaml
groups:
  - name: epercept_critical
    rules:
      - alert: HighErrorRate
        expr: rate(epercept_http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 2m
        annotations:
          summary: "Taux d'erreur élevé (> 5%)"
          
      - alert: DatabaseDown
        expr: up{job="postgres"} == 0
        for: 30s
        annotations:
          summary: "Base de données inaccessible"
          
      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal - node_memory_MemAvailable) / node_memory_MemTotal > 0.9
        for: 5m
        annotations:
          summary: "Utilisation mémoire > 90%"
```

## 🔒 Sécurité Production

### Checklist Sécurité
- [ ] HTTPS configuré avec certificats valides
- [ ] CORS configuré pour domaines autorisés uniquement  
- [ ] Rate limiting activé sur toutes les APIs
- [ ] Validation stricte des inputs utilisateur
- [ ] Secrets stockés dans variables d'environnement sécurisées
- [ ] Logs ne contenant aucune donnée sensible
- [ ] Backup automatique base de données
- [ ] Monitoring sécurité actif

### Variables Sensibles (à définir séparément)
```bash
# À définir dans le système de secrets (Vault, AWS Secrets Manager, etc.)
JWT_PRODUCTION_SECRET=          # 256-bit random key
REDIS_SECURE_PASSWORD=          # Strong Redis password  
DB_PASSWORD=                    # Strong database password
GOOGLE_PROD_CLIENT_SECRET=      # Google OAuth production secret
FACEBOOK_PROD_CLIENT_SECRET=    # Facebook OAuth production secret
SMTP_PRODUCTION_PASSWORD=       # SMTP password
ELASTICSEARCH_PASSWORD=         # Elasticsearch password
```

## ✅ Validation Déploiement

### Tests pré-production obligatoires
- [ ] Tests de charge : 1000+ utilisateurs simultanés
- [ ] Tests sécurité : OWASP Top 10 validés
- [ ] Tests performance : < 2s temps de chargement
- [ ] Tests monitoring : Toutes métriques remontées
- [ ] Tests backup/restore : Procédure validée
- [ ] Tests failover : Haute disponibilité confirmée

### Métriques SLA Production
- **Uptime** : 99.9% (43min downtime/mois max)
- **API Response Time** : P95 < 500ms
- **WebSocket Latency** : < 100ms
- **Error Rate** : < 1%
- **Concurrent Games** : 1000+ supportées

Cette configuration assure une mise en production robuste, scalable et sécurisée d'Epercept.