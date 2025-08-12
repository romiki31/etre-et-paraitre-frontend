# Variables d'Environnement - Configuration Technique Unifiée

## ⚠️ SOURCE UNIQUE DE VÉRITÉ
Ce fichier centralise TOUTES les variables d'environnement utilisées dans Epercept.
**Éviter duplication** - tous les services doivent référencer ces valeurs.

## 🔧 Variables Core Application

### Application Base
```bash
# Version et environnement (référencés partout)
APP_VERSION=1.0.0                    # Utilisé dans monitoring, tests, tracing
NODE_ENV=development                 # development|test|production
PORT=5001                           # Port API backend

# Nom de l'application (cohérence globale)
APP_NAME=epercept                   # Préfixe pour tous les services
SERVICE_NAME=epercept-api           # Nom service pour monitoring
```

### Base de données
```bash
# PostgreSQL principal
DATABASE_URL=postgresql://user:password@localhost:5432/epercept

# Redis pour cache et sessions  
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=                     # Vide en développement
```

### Sécurité JWT
```bash
JWT_SECRET=your-super-secret-jwt-key
JWT_ACCESS_EXPIRY=15m              # Tokens d'accès
JWT_REFRESH_EXPIRY=7d              # Tokens de refresh
```

## 🌍 Variables Multilingues

```bash
# Configuration i18n (cohérente avec 03-questions-multilangue.md)
I18N_DEFAULT_LOCALE=fr
I18N_SUPPORTED_LOCALES=fr,en,es,it,pt,de
I18N_FALLBACK_LOCALE=fr
I18N_DETECTION_COOKIE=epercept-locale
```

## 🔐 OAuth Providers

```bash
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/oauth/google/callback

# Facebook OAuth  
FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret
FACEBOOK_CALLBACK_URL=http://localhost:3000/api/auth/oauth/facebook/callback

# Apple OAuth
APPLE_CLIENT_ID=your-apple-service-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY_PATH=/path/to/apple-private-key.p8
```

## 📧 Email Configuration

```bash
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@epercept.fr
SMTP_PASSWORD=your-email-password

# Templates
EMAIL_FROM=noreply@epercept.fr
EMAIL_FROM_NAME=Epercept
```

## 📊 Monitoring & Observabilité

### Logging
```bash
# Winston configuration
LOG_LEVEL=info                      # debug|info|warn|error
LOG_FILE_ENABLED=true
LOG_FILE_PATH=logs/
LOG_MAX_SIZE=5242880                # 5MB
LOG_MAX_FILES=5
```

### Métriques Prometheus
```bash
# Prometheus endpoint
METRICS_ENABLED=true
METRICS_PORT=9090
METRICS_PREFIX=epercept_            # Cohérent avec 08-monitoring
```

### Tracing
```bash
# Jaeger distributed tracing
JAEGER_ENABLED=true
JAEGER_ENDPOINT=http://localhost:14268/api/traces
JAEGER_SERVICE_NAME=epercept-api
```

### Elasticsearch
```bash
# Pour logs centralisés (production)
ELASTICSEARCH_URL=http://localhost:9200
ELASTICSEARCH_USER=elastic
ELASTICSEARCH_PASSWORD=changeme
```

## 🧪 Tests Configuration

```bash
# Base de données de test
TEST_DATABASE_URL=postgresql://test:test@localhost:5432/epercept_test

# Redis test
TEST_REDIS_URL=redis://localhost:6379/1

# Coverage et qualité (cohérent avec 07-strategie-tests.md)
COVERAGE_THRESHOLD=80               # Seuil unifié pour branches, functions, lines, statements
```

## 🌐 Frontend Variables

```bash
# Next.js public variables
NEXT_PUBLIC_API_URL=http://localhost:5001/api/v1
NEXT_PUBLIC_WS_URL=http://localhost:5001
NEXT_PUBLIC_APP_NAME=Epercept
NEXT_PUBLIC_VERSION=1.0.0

# Configuration jeu
NEXT_PUBLIC_MIN_PLAYERS=3           # Cohérent avec standards
NEXT_PUBLIC_MAX_PLAYERS=7           # Cohérent avec standards
NEXT_PUBLIC_RECONNECTION_TIMEOUT=120000  # 2 minutes en ms

# i18n frontend
NEXT_PUBLIC_DEFAULT_LOCALE=fr
NEXT_PUBLIC_SUPPORTED_LOCALES=fr,en,es,it,pt,de
NEXT_PUBLIC_FALLBACK_LOCALE=fr
```

## 🚀 Production Overrides

```bash
# Production spécifique
NODE_ENV=production
APP_VERSION=1.2.3                  # Version déploiement
PORT=443

# Base données production
DATABASE_URL=postgresql://prod-user:secure-pass@prod-host:5432/epercept
REDIS_URL=redis://:redis-password@prod-redis:6379

# OAuth production
GOOGLE_CALLBACK_URL=https://api.epercept.fr/api/v1/auth/oauth/google/callback
FACEBOOK_CALLBACK_URL=https://api.epercept.fr/api/v1/auth/oauth/facebook/callback

# Monitoring production
LOG_LEVEL=warn
ELASTICSEARCH_URL=https://elastic.epercept.fr:9200
JAEGER_ENDPOINT=https://jaeger.epercept.fr/api/traces
```

## 🔗 Références Croisées

### Fichiers utilisant ces variables

#### Backend
- `05-architecture-backend.md` : Configuration services
- `08-monitoring-observabilite.md` : Logging, métriques, tracing
- `07-strategie-tests.md` : Configuration tests

#### Frontend  
- `04-architecture-frontend.md` : Variables publiques
- `02-ux-ui-parcours.md` : Configuration UX

#### Configuration
- `10-contenu-configuration.md` : Variables complètes
- `batch3-rapport-coherence-multilingue.md` : i18n config

### Validation

#### ✅ Standards respectés
- Préfixe `epercept_` pour toutes les métriques
- Seuils 80% pour coverage tests
- Cohérence multilingue fr,en,es,it,pt,de
- Limites joueurs 3-7
- Timeout reconnexion 2min

#### ❌ À éviter
- Variables hardcodées dans le code
- Duplication configuration dans plusieurs fichiers  
- Valeurs différentes selon environnements sans justification
- Variables non documentées dans ce fichier

## 📋 Checklist Nouvelle Variable

Avant d'ajouter une variable d'environnement :

1. [ ] Vérifier qu'elle n'existe pas déjà
2. [ ] L'ajouter dans ce fichier avec documentation
3. [ ] Mettre à jour `.env.example`
4. [ ] Documenter dans le fichier spec approprié
5. [ ] Tester sur tous les environnements
6. [ ] Valider cohérence avec autres variables