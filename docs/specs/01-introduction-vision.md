# Spécifications techniques - Epercept (Être et Paraître)

## 1. Introduction et vision du projet

Epercept est un jeu social en ligne où les joueurs apprennent à mieux se connaître en répondant à des questions personnelles et en devinant les réponses des autres. Le jeu se déroule en temps réel avec une interface moderne et engageante.

### Objectifs principaux
- Créer une expérience de jeu fluide et intuitive
- Permettre des parties multi-joueurs en temps réel
- Offrir une interface moderne et responsive
- Assurer une architecture scalable et maintenable

## 2. Exigences fonctionnelles

### 2.1 Concepts métier

#### Entités principales
1. **Game**: Partie avec PIN unique, 3-7 joueurs, rounds configurables dynamiquement, questions gérées par admin, **locale** (langue imposée par créateur)
2. **Player**: ID, username, points, statut (isRoundPlayer, hasAnswered), preferredLocale, timeout de reconnexion (2 minutes)
3. **Round**: Types thématiques configurables (Personnalité, Situations, Représentations, Relations, extensibles)
4. **Question**: Questions source avec traductions multiples, gérées dynamiquement sans IDs hardcodés, avec 2-4 réponses possibles
5. **Locale**: Configuration multilingue (fr, en, es, it, pt, de)
6. **QuestionTranslation**: Traductions des questions avec référence à la question source
7. **GameLocale**: Gestion de la langue par partie héritée du créateur
8. **GameConfig**: Configuration dynamique (nombre de rounds, questions par round, timer settings)

### 2.2 Flux de jeu

1. **Création**: Génération PIN → Premier joueur crée la partie (devient hôte)
2. **Lobby**: Autres joueurs rejoignent avec le PIN (3 minimum, 7 maximum)
3. **Jeu**: 
   - Tour par tour, un joueur répond à une question (pas de timer)
   - Les autres devinent sa réponse
   - Dès la première devinette soumise → timer 30s pour les autres devineurs
   - Points attribués pour les bonnes réponses (système uniforme)
   - Progression automatique sans intervention manuelle
4. **Fin**: Après tous les rounds configurés dynamiquement, affichage des gagnants avec option de rejouer

<!-- STANDARD ÉTABLI: Système entièrement dynamique - nombre de rounds et questions configurables via interface admin, aucun nombre hardcodé -->

### 2.3 Exigences critiques de synchronisation

#### Le système DOIT :
- **Gérer correctement les égalités de points** dans le classement
- **Maintenir la cohérence des états** entre tous les joueurs (3-7 joueurs par partie)
- **Permettre la reconnexion** dans un délai de 2 minutes sans perdre la progression
- **Gérer la déconnexion d'un joueur** sans faire crasher la partie (redistribution des questions si nécessaire)
- **Implémenter le système de timer en 3 phases** :
  - Phase 1: Joueur actif répond → AUCUN timer
  - Phase 2: Autres joueurs devinent → PAS de timer initial
  - Phase 3: Dès première devinette soumise → timer 30s pour tous les autres devineurs
  - Timeout: Non-répondants après 30s → 0 point

<!-- STANDARD TIMER: Système en 3 phases clairement défini, déclenché uniquement après première devinette -->
- **Permettre l'enchaînement des parties** avec conservation des scores cumulés
- **Charger les questions dynamiquement** depuis la base de données configurable (pas de limite hardcodée)
- **Assurer la cohérence linguistique** : tous les joueurs voient les questions dans la langue du créateur
- **Gérer le fallback linguistique** : français par défaut si traduction manquante
- **Supporter la configuration dynamique** : nombre de rounds, questions par round, types de questions ajustables

### 2.4 Exigences d'interface

#### Le système DOIT :
- **Éviter les problèmes de lisibilité** (contraste suffisant entre texte et fond)
- **Afficher clairement les feedbacks** (vert pour correct, rouge pour incorrect, jamais les deux)
- **Gérer le clavier mobile** avec auto-scroll pour éviter le masquage des champs
- **Remplacer le mini-classement** par un système plus clair (compteur points/joueurs)
- **Afficher le logo** sur toutes les pages
- **Détecter automatiquement la langue** du navigateur (Accept-Language headers)
- **Afficher un sélecteur de langue** accessible depuis toutes les pages
- **Présenter les questions traduites** selon la langue de la partie, pas du joueur individuel
- **Adapter les textes d'interface** selon la langue sélectionnée par l'utilisateur
- **Gérer les spécificités linguistiques** (pluriels, genres, formats de date/heure)

### 2.5 Événements temps réel

Le système doit gérer les événements Socket.io suivants :
- `join-game`: Rejoindre une room (avec locale du joueur)
- `player-joined`: Notification joueur rejoint (avec support multilingue)
- `game-started`: Début de partie (questions pré-chargées dans langue partie)
- `right-answer-submitted`: Le joueur actif a répondu
- `all-answered`: Tous ont deviné
- `next-turn`: Joueur suivant
- `round-ended`: Fin de manche
- `end-game`: Fin de partie
- `question-data`: Questions et traductions envoyées selon langue partie
- `locale-changed`: Changement langue interface utilisateur (pas questions)
- `translation-fallback`: Notification fallback français utilisé