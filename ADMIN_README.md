# 🎮 Interface d'Administration Epercept

## Vue d'ensemble

L'interface d'administration permet de gérer dynamiquement les 620 questions du jeu sans modifier manuellement le code source. Elle offre un système complet de CRUD avec persistance serveur et interface moderne.

## 🚀 Démarrage rapide

### Configuration initiale
```bash
# 1. Installer les dépendances
npm install

# 2. Configurer l'administrateur
npm run admin:setup
# Suivre les instructions pour créer username/password

# 3. Démarrer l'application
npm run dev:full
```

### Accès à l'interface
- **URL** : `http://localhost:5173/admin`
- **Authentification** : Utiliser les identifiants configurés
- **Session** : Expiration automatique après inactivité

## 🎯 Fonctionnalités principales

### Gestion des questions
- **Recherche intelligente** : Globale ou par round
- **Édition en temps réel** : Modification inline
- **Création rapide** : Bouton "Nouvelle question"
- **Duplication** : Copie avec modification
- **Suppression** : Avec confirmation

### Persistance des données
- **Sauvegarde automatique** : Backup avant chaque modification
- **Validation** : Contrôle de la structure des données
- **Historique** : Tracking des modifications
- **Import/Export** : Fichiers JSON pour backup

### Interface utilisateur
- **Design responsive** : Mobile, tablette, desktop
- **Recherche en temps réel** : Résultats instantanés
- **Interface épurée** : Questions visibles en recherche uniquement
- **Animations fluides** : Transitions et hover effects

## 🔒 Sécurité

### Authentification
- **JWT** avec expiration automatique
- **Bcrypt** pour le hashage des mots de passe
- **Config sécurisée** : Fichiers sensibles en `.gitignore`
- **Protection des routes** : Middleware d'authentification

### Données
- **Validation stricte** : Contrôle des entrées
- **Backups automatiques** : Sauvegarde avant modifications
- **Isolation** : Modifications n'affectent que les nouvelles parties
- **Logs** : Historique des actions administrateur

## 📊 Architecture technique

### Frontend
- **React + TypeScript** : Interface moderne
- **MobX** : Gestion d'état réactive
- **CSS responsive** : Design adaptatif avec `clamp()`
- **Composants modulaires** : AnswerEditor, AdminPanel

### Backend
- **Express.js** : API REST sécurisée
- **Socket.io** : Communication temps réel
- **JWT** : Authentification stateless
- **File system** : Persistance dans `constantes.ts`

### Sécurité
- **CORS** configuré pour domaines autorisés
- **Validation** des données côté serveur
- **Hachage bcrypt** : Force 12 pour les mots de passe
- **Backup automatique** : Récupération en cas d'erreur

## 🛠 Commandes disponibles

```bash
# Administration
npm run admin:setup          # Configuration initiale admin
npm run dev:full             # Démarrage complet (frontend + backend)

# Développement
npm run dev                  # Frontend seulement
npm run dev:server           # Backend seulement
npm run build               # Build production

# Build
npm run build:frontend       # Build frontend
npm run build:server         # Build backend
```

## 📈 Roadmap

### Phase 1 : ✅ Complétée
- Interface admin complète
- Authentification sécurisée
- CRUD des questions
- Persistance serveur
- Import/Export

### Phase 2 : 🔄 En cours
- **Synchronisation temps réel** : WebSocket admin→utilisateurs
- **Système d'historique avancé** : Timestamps et versions
- **Gestion dynamique** : Suppression limite fixe 100 questions
- **UX continuité** : Modifications sans interruption

### Phase 3 : 📋 Planifiée
- **Dashboard statistiques** : Analytics des questions
- **Gestion des rounds** : Création/modification des catégories
- **Multi-admin** : Plusieurs comptes administrateur
- **Audit logs** : Journalisation complète des actions

### Phase 4 : 🚀 Optimisation
- **Cache intelligent** : Performance avec grandes données
- **Recherche avancée** : Filtres complexes et suggestions
- **Batch operations** : Modifications en lot
- **API externe** : Intégration avec systèmes tiers

## 🐛 Dépannage

### Problèmes courants
1. **Erreur de connexion** : Vérifier que les deux serveurs sont démarrés
2. **Token expiré** : Se reconnecter via `/admin`
3. **Sauvegarde échoue** : Vérifier les permissions fichiers
4. **Import échoue** : Valider le format JSON

### Logs utiles
```bash
# Logs serveur
npm run dev:server

# État des backups
ls -la server/backups/

# Historique des modifications
cat server/backups/history.json
```

## 🤝 Contribution

### Guidelines
- **Tests** : Tester toutes les fonctionnalités avant commit
- **Documentation** : Documenter les nouvelles fonctionnalités
- **Sécurité** : Pas de données sensibles dans le code
- **Performance** : Optimiser pour 620+ questions

### Structure du code
```
src/
├── Components/
│   ├── AdminPanel.tsx        # Interface principale
│   └── AnswerEditor.tsx      # Éditeur de réponses
├── hooks/
│   ├── useAdminAuth.ts       # Authentification
│   └── useAdminQuestions.ts  # Gestion des questions
└── admin.css                 # Styles responsive

server/
├── auth.ts                   # Middleware d'authentification
├── questionManager.ts        # Gestion persistance
└── server.ts                 # API endpoints
```

---

**⚠️ Important** : Cette interface est conçue pour un usage en production. Toujours tester les modifications en développement avant déploiement.