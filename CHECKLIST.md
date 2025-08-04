# 🚀 Checklist de Build - Epercept From Scratch

> Guide étape par étape pour construire l'application Epercept complète à partir de zéro, basé sur les 7 documents techniques.

## 📋 Vue d'ensemble

Cette checklist suit un ordre optimal pour éviter les blocages et dépendances. Chaque étape inclut les commandes exactes et les vérifications nécessaires.

**⏱️ Temps estimé total** : 8-12 heures de développement (selon expérience)

## 🎯 Phase 1 - Setup et Environnement (30 min)

### ✅ Prérequis et outils

- [ ] **Node.js ≥ 18.0.0** installé
  ```bash
  node --version  # Vérifier ≥ 18.0.0
  npm --version   # Vérifier ≥ 8.0.0
  ```

- [ ] **Docker & Docker Compose** installés
  ```bash
  docker --version         # Vérifier installation
  docker-compose --version # Vérifier installation
  ```

- [ ] **Git** configuré
  ```bash
  git config --global user.name "Votre Nom"
  git config --global user.email "votre@email.com"
  ```

### ✅ Structure initiale du projet

- [ ] **Créer la structure racine**
  ```bash
  mkdir epercept && cd epercept
  mkdir -p apps/web apps/api docker scripts docs
  touch README.md CHECKLIST.md .gitignore
  ```

- [ ] **Initialiser Git et workspace**
  ```bash
  git init
  npm init -w apps/web -w apps/api
  ```

- [ ] **Copier les fichiers de configuration**
  ```bash
  # Copier .env.example vers .env et l'adapter
  cp .env.example .env
  # Éditer .env avec vos vraies valeurs
  ```

### ✅ Vérification Phase 1

- [ ] Structure de dossiers créée ✓
- [ ] Variables d'environnement configurées ✓
- [ ] Git initialisé ✓

---

## 🗄️ Phase 2 - Base de Données et Infrastructure (45 min)

### ✅ Services Docker (PostgreSQL + Redis)

- [ ] **Créer docker-compose.yml**
  ```yaml
  # Basé sur Document 7 - Administration
  version: '3.8'
  services:
    postgres:
      image: postgres:15
      environment:
        POSTGRES_DB: epercept
        POSTGRES_USER: epercept_user
        POSTGRES_PASSWORD: secure_password
      ports:
        - "5432:5432"
      volumes:
        - postgres_data:/var/lib/postgresql/data
    
    redis:
      image: redis:7-alpine
      ports:
        - "6379:6379"
      volumes:
        - redis_data:/data
  
  volumes:
    postgres_data:
    redis_data:
  ```

- [ ] **Démarrer les services**
  ```bash
  docker-compose up -d postgres redis
  docker-compose ps  # Vérifier que les services sont UP
  ```

### ✅ Configuration Prisma ORM

- [ ] **Initialiser Prisma dans apps/api**
  ```bash
  cd apps/api
  npm install prisma @prisma/client
  npx prisma init
  ```

- [ ] **Créer le schéma Prisma** (Document 3 - Backend)
  ```bash
  # Copier le schéma complet depuis le Document 3
  # Dans prisma/schema.prisma
  ```

- [ ] **Générer et appliquer migrations**
  ```bash
  npx prisma migrate dev --name init
  npx prisma generate
  ```

### ✅ Vérification Phase 2

- [ ] PostgreSQL accessible sur localhost:5432 ✓
- [ ] Redis accessible sur localhost:6379 ✓
- [ ] Schéma Prisma généré ✓
- [ ] Migrations appliquées ✓

```bash
# Tests de vérification
psql -h localhost -U epercept_user -d epercept -c "SELECT 1;"
redis-cli ping  # Doit retourner PONG
```

---

## 🚀 Phase 3 - Backend NestJS (2-3 heures)

### ✅ Setup NestJS

- [ ] **Installer NestJS et dépendances**
  ```bash
  cd apps/api
  npm install @nestjs/core @nestjs/common @nestjs/platform-express
  npm install @nestjs/websockets @nestjs/platform-socket.io
  npm install @nestjs/config @nestjs/jwt @nestjs/passport
  npm install socket.io redis class-validator class-transformer
  npm install --save-dev @types/node typescript ts-node
  ```

- [ ] **Structure modulaire NestJS**
  ```bash
  mkdir -p src/{games,players,questions,websocket,common,auth}
  touch src/main.ts src/app.module.ts
  ```

### ✅ Configuration principale

- [ ] **Créer main.ts** (Document 6 - Performance)
  ```typescript
  // Configuration optimisée avec compression, CORS, validation
  ```

- [ ] **Créer app.module.ts** avec tous les modules

- [ ] **Module base de données**
  ```bash
  # Créer database/database.module.ts
  # Service Prisma avec optimisations
  ```

### ✅ Modules métier

- [ ] **Module Games** (Document 3)
  - [ ] games.module.ts
  - [ ] games.service.ts (logique principale du jeu)
  - [ ] games.controller.ts (endpoints REST)
  - [ ] entities/game.entity.ts

- [ ] **Module Players**
  - [ ] players.module.ts  
  - [ ] players.service.ts
  - [ ] players.controller.ts

- [ ] **Module Questions**
  - [ ] questions.module.ts
  - [ ] questions.service.ts (320 questions du Document 1)
  - [ ] Seed des questions en base

- [ ] **Module WebSocket** (Document 3 + 6)
  - [ ] websocket/game.gateway.ts
  - [ ] Gestion connexions robuste
  - [ ] Events Socket.io complets

### ✅ Configuration avancée

- [ ] **Authentification JWT** (Document 5)
- [ ] **Guards et middlewares** de sécurité
- [ ] **Cache Redis** intégré
- [ ] **Validation des DTOs**
- [ ] **Health checks**

### ✅ Vérification Phase 3

- [ ] API démarre sur localhost:3001 ✓
- [ ] Endpoint /health répond ✓
- [ ] WebSocket accepte les connexions ✓
- [ ] Questions seed en base ✓

```bash
# Tests de vérification
curl http://localhost:3001/health
curl http://localhost:3001/api/questions/count
# Tester WebSocket avec un client simple
```

---

## 🌐 Phase 4 - Frontend Next.js (2-3 heures)

### ✅ Setup Next.js 14

- [ ] **Créer l'application Next.js**
  ```bash
  cd apps/web
  npx create-next-app@latest . --typescript --tailwind --app --src-dir
  ```

- [ ] **Installer dépendances supplémentaires**
  ```bash
  npm install zustand socket.io-client
  npm install @radix-ui/react-slot lucide-react
  npm install clsx tailwind-merge
  npm install --save-dev @types/socket.io-client
  ```

### ✅ Configuration et utils

- [ ] **shadcn/ui setup** (Document 2 - Design System)
  ```bash
  npx shadcn-ui@latest init
  npx shadcn-ui@latest add button card input toast
  ```

- [ ] **Store Zustand** (Document 4)
  - [ ] lib/store/game-store.ts
  - [ ] lib/store/player-store.ts
  - [ ] Types TypeScript

- [ ] **Client WebSocket**
  - [ ] lib/socket/socket-client.ts
  - [ ] Connexion automatique et reconnexion
  - [ ] Events handlers

### ✅ Composants UI (Document 2)

- [ ] **Composants de base**
  - [ ] components/ui/ (shadcn/ui)
  - [ ] components/game/GameCard.tsx
  - [ ] components/game/PlayerList.tsx
  - [ ] components/game/QuestionCard.tsx

- [ ] **Layout et navigation**
  - [ ] app/layout.tsx avec design system
  - [ ] components/Layout/Header.tsx
  - [ ] components/Layout/Footer.tsx

### ✅ Pages principales (Document 1 + 2)

- [ ] **Page d'accueil** - app/page.tsx
  - [ ] Introduction au jeu
  - [ ] Boutons Créer/Rejoindre partie
  - [ ] Règles du jeu

- [ ] **Pages de jeu** - app/game/[pin]/
  - [ ] lobby/page.tsx (salle d'attente)
  - [ ] play/page.tsx (jeu principal)
  - [ ] results/page.tsx (fin de partie)

- [ ] **Composants de jeu**
  - [ ] QuestionForm.tsx (répondre)
  - [ ] GuessForm.tsx (deviner)
  - [ ] Ranking.tsx (classement)
  - [ ] Timer.tsx (compte à rebours)

### ✅ Features avancées

- [ ] **Auto-scroll mobile** (Document 2)
- [ ] **PWA configuration**
- [ ] **Error boundaries**
- [ ] **Loading states**

### ✅ Vérification Phase 4

- [ ] Frontend démarre sur localhost:3000 ✓
- [ ] Pages principales accessibles ✓
- [ ] WebSocket se connecte au backend ✓
- [ ] Design system appliqué ✓

```bash
# Tests de vérification
npm run build  # Doit build sans erreurs
npm run lint   # Pas d'erreurs de lint
```

---

## 🔐 Phase 5 - Sécurité et Tests (1-2 heures)

### ✅ Sécurité Backend (Document 5)

- [ ] **Rate limiting**
  ```bash
  npm install @nestjs/throttler
  # Configuration dans app.module.ts
  ```

- [ ] **Helmet et CORS**
  ```bash
  npm install helmet
  # Configuration sécurisée
  ```

- [ ] **Validation robuste**
  - [ ] DTOs avec class-validator
  - [ ] Sanitization des inputs
  - [ ] CSRF protection

### ✅ Tests (Document 5)

- [ ] **Tests unitaires Backend**
  ```bash
  cd apps/api
  npm install --save-dev jest @nestjs/testing
  # Tests pour services principaux
  ```

- [ ] **Tests E2E Frontend**
  ```bash
  cd apps/web
  npm install --save-dev @playwright/test
  npx playwright install
  # Tests des parcours utilisateur
  ```

- [ ] **Tests d'intégration**
  - [ ] WebSocket connexion/déconnexion
  - [ ] Flux de jeu complet
  - [ ] Gestion des erreurs

### ✅ Monitoring (Document 5 + 6)

- [ ] **Logging structuré**
  ```bash
  npm install winston
  # Configuration logs JSON
  ```

- [ ] **Health checks avancés**
  - [ ] Base de données
  - [ ] Redis
  - [ ] Mémoire système

- [ ] **Métriques Prometheus** (optionnel)

### ✅ Vérification Phase 5

- [ ] Tests passent ✓
- [ ] Sécurité configurée ✓
- [ ] Logs structurés ✓
- [ ] Health checks OK ✓

```bash
# Tests de vérification
npm run test        # Backend
npm run test:e2e    # Frontend E2E
curl http://localhost:3001/health
```

---

## 📊 Phase 6 - Performance et Optimisation (1 heure)

### ✅ Optimisations Backend (Document 6)

- [ ] **Cache Redis optimisé**
  - [ ] Service de cache avec compression
  - [ ] Stratégies de cache par type de données
  - [ ] Invalidation intelligente

- [ ] **Base de données**
  - [ ] Index de performance ajoutés
  - [ ] Requêtes optimisées
  - [ ] Connection pooling configuré

- [ ] **WebSocket haute performance**
  - [ ] Compression des messages
  - [ ] Heartbeat optimisé
  - [ ] Gestion reconnexions

### ✅ Optimisations Frontend

- [ ] **Bundle optimization**
  ```bash
  # Configuration next.config.js
  # Code splitting automatique
  # Lazy loading composants
  ```

- [ ] **Images et assets**
  - [ ] next/image pour optimisation
  - [ ] Compression assets
  - [ ] CDN ready (optionnel)

### ✅ Monitoring performance

- [ ] **Métriques clés**
  - [ ] Temps de réponse API < 200ms
  - [ ] Latence WebSocket < 50ms
  - [ ] Lighthouse score > 90

### ✅ Vérification Phase 6

- [ ] Performance optimisée ✓
- [ ] Cache fonctionne ✓
- [ ] Métriques dans les cibles ✓

---

## 🚢 Phase 7 - Déploiement et Production (1 heure)

### ✅ Configuration Docker complète

- [ ] **Dockerfile Backend**
  ```dockerfile
  # Multi-stage build optimisé
  # Based on Document 7
  ```

- [ ] **Dockerfile Frontend**
  ```dockerfile
  # Build Next.js optimisé
  # Nginx pour servir les static
  ```

- [ ] **docker-compose.prod.yml**
  - [ ] Services complets
  - [ ] Réseaux isolés
  - [ ] Volumes persistants
  - [ ] Health checks

### ✅ Configuration Nginx (Document 7)

- [ ] **Reverse proxy**
  - [ ] Frontend sur /
  - [ ] API sur /api
  - [ ] WebSocket sur /socket.io

- [ ] **SSL/TLS** (production)
- [ ] **Compression gzip**
- [ ] **Caching headers**

### ✅ Scripts de déploiement

- [ ] **Script de build**
  ```bash
  #!/bin/bash
  # scripts/build.sh
  # Build complet avec vérifications
  ```

- [ ] **Script de déploiement**
  ```bash
  # scripts/deploy.sh  
  # Déploiement avec rollback
  ```

### ✅ Vérification Phase 7

- [ ] Build Docker réussit ✓
- [ ] Application accessible en prod ✓
- [ ] SSL configuré ✓
- [ ] Monitoring en place ✓

```bash
# Tests de vérification finale
docker-compose -f docker-compose.prod.yml up -d
curl https://votre-domaine.com/health
# Tester une partie complète
```

---

## 📋 Phase 8 - Configuration et Administration (30 min)

### ✅ Administration (Document 7)

- [ ] **Interface admin**
  - [ ] Dashboard système
  - [ ] Gestion utilisateurs
  - [ ] Monitoring parties

- [ ] **Scripts maintenance**
  - [ ] Sauvegarde automatique
  - [ ] Nettoyage données
  - [ ] Health checks

### ✅ Documentation

- [ ] **README.md** à jour
- [ ] **Variables d'environnement** documentées
- [ ] **API documentation** (Swagger)
- [ ] **Guide déploiement**

### ✅ Vérification finale

- [ ] Tous les documents implémentés ✓
- [ ] Application complètement fonctionnelle ✓
- [ ] Production ready ✓

---

## 🎯 Checklist de Validation Finale

### ✅ Fonctionnalités core

- [ ] **Création de partie** avec PIN unique
- [ ] **Jointure** par PIN (3-7 joueurs)
- [ ] **4 rounds thématiques** avec questions
- [ ] **Système de points** et classement
- [ ] **Reconnexion** après déconnexion
- [ ] **Responsive** mobile + desktop

### ✅ Performance

- [ ] **API** < 200ms réponse
- [ ] **WebSocket** < 50ms latence  
- [ ] **Frontend** Lighthouse > 90
- [ ] **Base de données** requêtes optimisées

### ✅ Sécurité

- [ ] **HTTPS** en production
- [ ] **Rate limiting** configuré
- [ ] **Validation** inputs stricte
- [ ] **CORS** correctement configuré

### ✅ Monitoring

- [ ] **Health checks** fonctionnels
- [ ] **Logs** structurés
- [ ] **Métriques** collectées
- [ ] **Alertes** configurées

---

## 🚨 Troubleshooting Rapide

### Problèmes courants

| Problème | Solution |
|----------|----------|
| **PostgreSQL connexion refuse** | `docker-compose restart postgres` |
| **Redis timeout** | Vérifier REDIS_URL dans .env |
| **WebSocket déconnexions** | Augmenter WS_PING_TIMEOUT |
| **Frontend build fail** | Vérifier NEXT_PUBLIC_API_URL |
| **Tests E2E échouent** | Relancer services avec `docker-compose up -d` |

### Commandes de debug

```bash
# Logs conteneurs
docker-compose logs -f postgres redis

# Vérifier variables d'environnement
cd apps/api && npm run env:check

# Reset complet base de données
cd apps/api && npx prisma migrate reset

# Tests de connexion
curl http://localhost:3001/health
redis-cli ping
```

---

## 🎉 Félicitations !

Vous avez maintenant une application **Epercept** complète et prête pour la production !

### 🔗 Ressources utiles

- **Documentation complète** : Les 9 documents techniques
- **API Reference** : http://localhost:3001/api/docs
- **Monitoring** : http://localhost:3001/admin
- **Database Studio** : `npx prisma studio`

### 🚀 Prochaines étapes

1. **Tester** avec de vrais utilisateurs
2. **Monitorer** les performances en production  
3. **Ajouter** nouvelles questions/fonctionnalités
4. **Optimiser** selon les retours utilisateurs

**Bon jeu avec Epercept ! 🎮**