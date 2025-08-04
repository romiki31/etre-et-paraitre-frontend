# 🎮 Epercept - Jeu de Quiz Multijoueur Temps Réel

> **Être et Paraître** - Un jeu de société moderne où les joueurs devinent les réponses de leurs amis à des questions personnelles intrigantes.

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](./package.json)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-%3E%3D5.0.0-blue.svg)](https://www.typescriptlang.org/)

## 📋 Vue d'ensemble

Epercept est une application web moderne de jeu de quiz multijoueur en temps réel. Les joueurs rejoignent des parties via un code PIN, répondent à des questions personnelles et tentent de deviner les réponses de leurs amis pour marquer des points.

### ✨ Fonctionnalités principales

- 🎯 **Parties temps réel** avec WebSocket pour synchronisation instantanée
- 📱 **Multi-plateform** - Interface responsive web et PWA
- 🎨 **320 questions** réparties en 4 catégories thématiques 
- 🏆 **Système de points** avec classements en temps réel
- 🔄 **Reconnexion robuste** - Reprendre sa partie après déconnexion
- ⚡ **Performance optimisée** - Architecture scalable et cache intelligent
- 🔐 **Sécurité renforcée** - Protection CSRF, rate limiting, validation

### 🎮 Comment ça marche

1. **Création** - Un joueur crée une partie et reçoit un code PIN unique
2. **Jointure** - Les autres rejoignent avec le code PIN (3-7 joueurs)
3. **Jeu** - Chacun répond à tour de rôle, les autres devinent sa réponse
4. **Points** - 1 point par bonne devinette, classement en temps réel
5. **Continuité** - Possibilité d'enchaîner plusieurs parties

## 📚 Documentation Complète

Ce projet est documenté dans **9 documents techniques** couvrant tous les aspects :

### 📖 Documents principaux (7/7)

| Document | Titre | Status | Description |
|----------|-------|--------|-------------|
| **[01](./01-specifications-fonctionnelles.md)** | Spécifications Fonctionnelles | ✅ | Règles du jeu, logique métier, 320 questions |
| **[02](./02-design-system-ux.md)** | Design System & UX | ✅ | Interface utilisateur, parcours, design system |
| **[03](./03-architecture-backend.md)** | Architecture Backend | ✅ | NestJS, PostgreSQL, WebSocket, API REST |
| **[04](./04-architecture-frontend.md)** | Architecture Frontend | ✅ | Next.js 14, React, Zustand, composants |
| **[05](./05-securite-tests-devops.md)** | Sécurité & Tests | ✅ | Authentification, tests, CI/CD, monitoring |
| **[06](./06-performance-scalabilite.md)** | Performance | ✅ | Optimisations, cache, scalabilité |
| **[07](./07-administration-configuration.md)** | Administration | ✅ | Configuration, maintenance, déploiement |

### 📋 Documents annexes

| Document | Titre | Description |
|----------|-------|-------------|
| **[epercept-refactoring-analysis.md](./epercept-refactoring-analysis.md)** | **Document Master** | Analyse complète et plan de refactoring global |
| **[epercept-questions-database.md](./epercept-questions-database.md)** | Base de Questions | 320 questions complètes par catégorie |

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        🌐 FRONTEND (Next.js 14)                │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │   Game Pages    │ │   Components    │ │   Zustand       │   │
│  │   /game/[pin]   │ │   UI Library    │ │   Store         │   │
│  │   Responsive    │ │   shadcn/ui     │ │   WebSocket     │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                    │
                              ⚡ WebSocket + HTTP
                                    │
┌─────────────────────────────────────────────────────────────────┐
│                       🚀 BACKEND (NestJS)                      │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │   WebSocket     │ │   Game Logic    │ │   API REST      │   │
│  │   Gateway       │ │   Services      │ │   Controllers   │   │
│  │   Socket.io     │ │   Business      │ │   Validation    │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                                    │
                        📊 Database + Cache
                                    │
┌─────────────────────────────────────────────────────────────────┐
│                    💾 DATA LAYER                               │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐   │
│  │   PostgreSQL    │ │   Redis Cache   │ │   Prisma ORM    │   │
│  │   Persistent    │ │   Session       │ │   Migrations    │   │
│  │   Game Data     │ │   Real-time     │ │   Type Safety   │   │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 🔧 Stack Technique

| Couche | Technologies |
|--------|-------------|
| **Frontend** | Next.js 14, React 18, TypeScript, Zustand, Tailwind CSS, shadcn/ui |
| **Backend** | NestJS, Node.js, TypeScript, Socket.io, Prisma ORM |
| **Base de données** | PostgreSQL 15, Redis 7 |
| **Déploiement** | Docker, Docker Compose, Nginx |
| **Monitoring** | Sentry, Prometheus, Grafana |
| **Tests** | Jest, Playwright, K6 |

## 🚀 Quick Start

### Prérequis

- **Node.js** ≥ 18.0.0
- **npm** ou **yarn** ou **pnpm**
- **Docker** & **Docker Compose** (recommandé)
- **PostgreSQL** 15+ (si sans Docker)
- **Redis** 7+ (si sans Docker)

### 🐳 Démarrage avec Docker (Recommandé)

```bash
# 1. Cloner le repository
git clone https://github.com/votre-org/epercept.git
cd epercept

# 2. Copier la configuration d'environnement
cp .env.example .env

# 3. Démarrer tous les services
docker-compose up -d

# 4. Initialiser la base de données
docker-compose exec api npx prisma migrate dev
docker-compose exec api npx prisma db seed

# 🎉 Application accessible sur :
# Frontend: http://localhost:3000
# API: http://localhost:3001
# Admin: http://localhost:3001/admin
```

### 💻 Démarrage manuel (Développement)

```bash
# 1. Installation des dépendances
npm install

# 2. Services externes (PostgreSQL + Redis)
# Option A: Docker Compose services uniquement
docker-compose up -d postgres redis

# Option B: Installation locale (voir documentation)

# 3. Configuration
cp .env.example .env
# Editer .env avec vos configurations

# 4. Base de données
cd apps/api
npx prisma migrate dev
npx prisma db seed

# 5. Démarrage backend
npm run dev:api

# 6. Démarrage frontend (nouveau terminal)
cd apps/web
npm run dev

# 🎉 Prêt ! Frontend sur http://localhost:3000
```

### ⚡ Commandes essentielles

```bash
# Développement
npm run dev              # Démarrer frontend + backend
npm run dev:web          # Frontend uniquement
npm run dev:api          # Backend uniquement

# Base de données
npm run db:migrate       # Appliquer migrations
npm run db:seed          # Peupler données initiales
npm run db:studio        # Interface Prisma Studio
npm run db:reset         # Reset complet BDD

# Tests
npm run test             # Tests unitaires
npm run test:e2e         # Tests end-to-end
npm run test:load        # Tests de charge

# Build et déploiement
npm run build            # Build production
npm run start            # Start production
npm run lint             # Linting
npm run type-check       # Vérification TypeScript

# Docker
docker-compose up -d     # Démarrer tous services
docker-compose logs -f   # Voir logs en temps réel
docker-compose down      # Arrêter tous services
```

## 🗂️ Structure du Projet

```
epercept/
├── apps/
│   ├── web/                 # 🌐 Frontend Next.js
│   │   ├── app/             # App Router Next.js 14
│   │   ├── components/      # Composants React
│   │   ├── lib/             # Utils et stores
│   │   └── public/          # Assets statiques
│   │
│   └── api/                 # 🚀 Backend NestJS
│       ├── src/
│       │   ├── games/       # Logique de jeu
│       │   ├── players/     # Gestion joueurs
│       │   ├── websocket/   # Gateway Socket.io
│       │   └── common/      # Modules partagés
│       └── prisma/          # Schéma et migrations BDD
│
├── docs/                    # 📚 Documentation complète
│   ├── 01-specifications-fonctionnelles.md
│   ├── 02-design-system-ux.md
│   ├── 03-architecture-backend.md
│   ├── 04-architecture-frontend.md
│   ├── 05-securite-tests-devops.md
│   ├── 06-performance-scalabilite.md
│   ├── 07-administration-configuration.md
│   ├── epercept-refactoring-analysis.md
│   └── epercept-questions-database.md
│
├── docker/                  # 🐳 Configuration Docker
├── scripts/                 # 🔧 Scripts utilitaires
├── .env.example            # Template variables d'environnement
├── docker-compose.yml      # Services Docker
├── CHECKLIST.md           # Guide étape par étape
└── README.md              # Ce fichier
```

## 🎯 Par où commencer ?

### 🔍 Pour comprendre le projet
1. **Lire** ce README pour vue d'ensemble
2. **Consulter** [Document 1 - Spécifications](./01-specifications-fonctionnelles.md) pour les règles du jeu
3. **Explorer** [Document Master](./epercept-refactoring-analysis.md) pour l'analyse complète

### 👩‍💻 Pour développer
1. **Suivre** le [Quick Start](#-quick-start) ci-dessus
2. **Consulter** [CHECKLIST.md](./CHECKLIST.md) pour build from scratch
3. **Lire** [Document 3 - Backend](./03-architecture-backend.md) et [Document 4 - Frontend](./04-architecture-frontend.md)

### 🎨 Pour l'UI/UX
1. **Voir** [Document 2 - Design System](./02-design-system-ux.md)
2. **Tester** l'interface sur http://localhost:3000
3. **Consulter** le storybook des composants

### 🚀 Pour déployer
1. **Lire** [Document 7 - Administration](./07-administration-configuration.md)
2. **Suivre** [Document 5 - DevOps](./05-securite-tests-devops.md)
3. **Optimiser** avec [Document 6 - Performance](./06-performance-scalabilite.md)

## 🤝 Contribution

Nous accueillons les contributions ! Voici comment contribuer :

### 📝 Processus de contribution

1. **Fork** le repository
2. **Créer** une branche feature (`git checkout -b feature/amazing-feature`)
3. **Suivre** les standards de code (ESLint + Prettier)
4. **Écrire** des tests pour les nouvelles fonctionnalités
5. **Tester** localement avec `npm run test`
6. **Commit** avec messages conventionnels
7. **Push** et créer une Pull Request

### 🧪 Standards de qualité

- **Code** : TypeScript strict, ESLint, Prettier
- **Tests** : Couverture > 80%, tests E2E obligatoires
- **Documentation** : Commenter le code complexe
- **Performance** : Lighthouse score > 90

### 🐛 Reporting de bugs

Utiliser les [Issues GitHub](https://github.com/votre-org/epercept/issues) avec :
- **Description** détaillée du problème
- **Étapes** pour reproduire
- **Environnement** (OS, navigateur, version Node)
- **Screenshots** si pertinent

## 📊 Monitoring et Métriques

### 🔍 Monitoring en production

- **Uptime** : Status page disponible sur `/health`
- **Erreurs** : Tracking Sentry pour backend et frontend
- **Performance** : Métriques Prometheus + dashboards Grafana
- **Logs** : Centralisés avec ELK Stack

### 📈 Métriques clés

- **Latence WebSocket** < 50ms
- **Temps de réponse API** < 200ms
- **Disponibilité** > 99.9%
- **Couverture tests** > 80%

## 🔧 Maintenance et Support

### 📅 Maintenance préventive

Consultez [Document 7](./07-administration-configuration.md) pour :
- **Checklist hebdomadaire** de maintenance
- **Scripts d'administration** automatisés
- **Procédures de sauvegarde** et restauration
- **Monitoring des performances**

### 🆘 Support

- **Documentation** : Consulter les 9 documents techniques
- **Issues** : [GitHub Issues](https://github.com/votre-org/epercept/issues)
- **Discord** : Serveur communauté [lien]
- **Email** : support@epercept.com

## 📄 License

Ce projet est sous licence **MIT** - voir le fichier [LICENSE](./LICENSE) pour plus de détails.

## 🙏 Remerciements

- **Équipe de développement** pour l'architecture moderne
- **Communauté Open Source** pour les outils utilisés
- **Beta testeurs** pour les retours précieux
- **Contributeurs** qui améliorent le projet

---

<div align="center">

**🎮 Amusez-vous bien avec Epercept ! 🎮**

[🌐 Site Web](https://epercept.com) • [📖 Documentation](./docs/) • [🐛 Issues](https://github.com/votre-org/epercept/issues) • [💬 Discord](https://discord.gg/epercept)

</div>