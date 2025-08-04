# Recap - Document 1/7 : Spécifications Fonctionnelles et Règles Métier

## Ce qui a été implémenté/développé

### 1. Identification des bugs critiques à éviter
- **Synchronisation** : Gestion ex aequo, états incohérents, reconnexion, crashes
- **Interface** : Problèmes de lisibilité, feedback visuel, mobile
- **UX** : Dépendance maître de jeu, absence de timer, pas de continuité

### 2. Définition complète de la logique métier
- **Concepts** : Game, Player, Round, Question
- **Flux de jeu** : Création → Lobby → Tours → Fin de partie
- **Règles spéciales** : Déconnexions, points, auto-progression

### 3. Spécification du contenu
- 320 questions réparties en 4 rounds thématiques
- Formats de questions adaptés par round
- Référence à la base de données complète

### 4. Documentation des textes et messages
- Textes d'accueil et règles
- Messages d'erreur (14 types)
- Messages de statut (16 types)
- Libellés des boutons (17 actions)
- Messages de fin de partie

### 5. États et transitions
- 5 états de partie
- 5 états de round
- 4 états de joueur
- Transitions automatiques définies

### 6. Algorithmes métier
- Attribution des points avec timestamp
- Classement avec gestion des ex aequo
- Sélection circulaire des joueurs
- Conditions de fin de round/partie

## Décisions techniques prises

1. **PIN à 6 chiffres** pour faciliter la saisie
2. **3-7 joueurs** pour équilibre entre dynamique et gestion
3. **Timer 30 secondes** pour maintenir le rythme
4. **Grace period 2 minutes** pour les reconnexions
5. **Auto-progression** par le dernier répondant
6. **Départage ex aequo** par timestamp du dernier point

## Interfaces/APIs créées

### Concepts métier (types)
- `Game` : partie avec états et configuration
- `Player` : joueur avec points et statut connexion
- `Round` : manche avec type thématique
- `Question` : question avec options variables

### États énumérés
- `GameStatus` : WAITING, IN_PROGRESS, PAUSED, FINISHED, ABANDONED
- `RoundStatus` : PENDING, ANSWERING, GUESSING, REVEALING, FINISHED  
- `PlayerStatus` : CONNECTED, DISCONNECTED, RECONNECTING, ABANDONED
- `RoundType` : PERSONALITY, SITUATIONS, REPRESENTATIONS, RELATIONS

## Points d'intégration avec autres documents

### Vers Document 2 (Design System et UX)
- Tous les textes d'interface fournis
- États visuels à représenter
- Feedback utilisateur à implémenter

### Vers Document 3 (Architecture Backend)
- Logique métier à implémenter
- États et transitions à gérer
- Algorithmes de calcul fournis

### Vers Document 4 (Architecture Frontend)  
- Messages et textes à afficher
- États UI à gérer
- Flux utilisateur défini

### Vers Document 7 (Administration)
- Référence aux 320 questions
- Besoins de gestion du contenu

## Éléments restants à traiter

1. **Design visuel** des états et transitions (Document 2)
2. **Implémentation technique** de la logique (Documents 3 & 4)
3. **Gestion des questions** dans l'admin (Document 7)
4. **Tests** de tous les cas fonctionnels (Document 5)
5. **Optimisations** pour 1000+ parties simultanées (Document 6)

## Notes importantes

- Ce document est **100% fonctionnel**, aucune implémentation technique
- Tous les bugs de l'ancienne version sont documentés pour éviter leur reproduction
- La logique métier est complète et peut être implémentée directement
- Les textes sont finaux et validés par le fondateur