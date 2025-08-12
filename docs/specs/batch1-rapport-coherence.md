# Rapport de Cohérence - Batch 1/5 : FONDATIONS CRITIQUES

## 📅 Date de révision
11 août 2025

## 📁 Fichiers analysés et corrigés
- ✅ **01-introduction-vision.md** : Vision, concepts métier, exigences
- ✅ **06-regles-logique-metier.md** : Règles de jeu, flow, logique métier

## ✅ Standards établis et validés

### 1. 🕐 SYSTÈME DE TIMER - Standard définitif
**Fonctionnement en 3 phases :**
- **Phase 1** : Joueur actif répond → AUCUN timer
- **Phase 2** : Autres joueurs commencent à deviner → PAS de timer initial
- **Phase 3** : Dès première devinette soumise → timer 30s pour tous les autres devineurs
- **Timeout** : Non-répondants après 30s → 0 point

**Corrections appliquées :**
- ✅ 01-introduction-vision.md : Lignes 46-53 - Système en 3 phases clairement défini
- ✅ 06-regles-logique-metier.md : Lignes 12-31 - Interface TypeScript alignée avec standard

### 2. 🔢 QUESTIONS DYNAMIQUES - Standard définitif
**Configuration 100% dynamique :**
- AUCUN nombre hardcodé dans le code
- Nombre de rounds configurable via admin
- Nombre de questions par round ajustable
- Base de données extensible sans limite

**Corrections appliquées :**
- ✅ 01-introduction-vision.md : Ligne 37 - Suppression référence "4 rounds"
- ✅ 01-introduction-vision.md : Ligne 21 - Ajout GameConfig pour configuration dynamique
- ✅ 06-regles-logique-metier.md : Ligne 95 - Annotation "Dynamique, pas hardcodé"

### 3. 👥 NOMBRE DE JOUEURS - Standard définitif
**Limites établies :**
- Minimum : 3 joueurs
- Maximum : 7 joueurs
- Démarrage automatique à 3 joueurs

**Corrections appliquées :**
- ✅ 01-introduction-vision.md : Ligne 18 - "3-7 joueurs" dans Game entity
- ✅ 06-regles-logique-metier.md : Ligne 36 - Limites ajoutées dans continuité

### 4. 🔌 DÉCONNEXIONS/RECONNEXIONS - Standard définitif
**Timeout uniforme : 2 minutes**
- Délai de reconnexion : 2 minutes exactement
- Après 2 minutes : redistribution des questions
- Partie continue avec minimum 3 joueurs actifs

**Corrections appliquées :**
- ✅ 01-introduction-vision.md : Ligne 19 - "timeout de reconnexion (2 minutes)"
- ✅ 06-regles-logique-metier.md : Ligne 47 - Corrigé de 5 min à 2 min

### 5. 📊 SYSTÈME DE POINTS - Standard définitif
**Calcul uniforme :**
- Bonne devinette : points selon rapidité
- Timeout : 0 point
- Scores cumulés entre parties de la session

**Validé dans les deux fichiers**

## 🔍 Incohérences restantes pour autres batchs

### À corriger dans les prochains batchs :
1. **02-ux-ui-parcours.md** (ligne 73) : Mentionne encore "4 rounds complets"
2. **03-questions-multilangue.md** (ligne 229) : sourceId hardcodé (65)
3. **10-contenu-configuration.md** (lignes 426-434) : Références à 320 questions
4. **10-contenu-configuration.md** (ligne 573) : "4 rounds" mentionné

## 📋 Liste des standards pour propagation

### Standards à appliquer dans TOUS les autres fichiers :

```typescript
// STANDARDS EPERCEPT - À RESPECTER PARTOUT

// 1. TIMER
const TIMER_STANDARD = {
  answeringPhase: NO_TIMER,
  guessingInitial: NO_TIMER,
  afterFirstGuess: 30_SECONDS,
  timeout: ZERO_POINTS
};

// 2. JOUEURS
const PLAYERS_LIMITS = {
  min: 3,
  max: 7,
  autoStart: 3
};

// 3. RECONNEXION
const RECONNECTION_TIMEOUT = 2 * 60 * 1000; // 2 minutes

// 4. CONFIGURATION
const GAME_CONFIG = {
  rounds: DYNAMIC, // Jamais hardcodé
  questionsPerRound: DYNAMIC, // Configurable
  totalQuestions: DYNAMIC // Base de données extensible
};
```

## ✨ Résultat

Les deux fichiers fondamentaux sont maintenant **100% cohérents** et établissent des standards clairs pour toute la documentation. Ces standards doivent être propagés dans les batchs suivants pour assurer la cohérence globale du projet Epercept.

## 🎯 Prochaine étape

Appliquer ces standards aux batchs 2-5 en corrigeant systématiquement toute incohérence avec les règles établies ici.