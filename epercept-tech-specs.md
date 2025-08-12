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
1. **Game**: Partie avec PIN unique, joueurs, rounds, questions, **locale** (langue imposée par créateur)
2. **Player**: ID, username, points, statut (isRoundPlayer, hasAnswered), preferredLocale
3. **Round**: 4 types thématiques (Personnalité, Situations, Représentations, Relations)
4. **Question**: Questions source avec traductions multiples, liées aux rounds, avec 2-4 réponses possibles
5. **Locale**: Configuration multilingue (fr, en, es, it, pt, de)
6. **QuestionTranslation**: Traductions des questions avec référence à la question source
7. **GameLocale**: Gestion de la langue par partie héritée du créateur

### 2.2 Flux de jeu

1. **Création**: Génération PIN → Premier joueur crée la partie
2. **Lobby**: Autres joueurs rejoignent avec le PIN
3. **Jeu**: 
   - Tour par tour, un joueur répond à une question
   - Les autres devinent sa réponse
   - Points attribués pour les bonnes réponses
   - Progression automatique sans intervention manuelle
4. **Fin**: Après tous les rounds configurés, affichage des gagnants avec option de rejouer

<!-- CORRIGÉ: Suppression du hardcodage "4 rounds" pour permettre une configuration dynamique via l'interface d'administration -->

### 2.3 Exigences critiques de synchronisation

#### Le système DOIT :
- **Gérer correctement les égalités de points** dans le classement
- **Maintenir la cohérence des états** entre tous les joueurs
- **Permettre la reconnexion** sans perdre la progression de la partie
- **Gérer la déconnexion d'un joueur** sans faire crasher la partie
- **Implémenter des timers automatiques** (30 secondes pour les devineurs, déclenchés après la première devinette soumise)

<!-- CORRIGÉ: Précision du fonctionnement exact du timer selon les spécifications : pas de timer pendant la réponse du joueur actif, timer de 30s pour tous les autres joueurs dès que le premier soumet sa devinette -->
- **Permettre l'enchaînement des parties** avec conservation des scores
- **Charger les questions dans la langue de la partie** sans latence perceptible
- **Assurer la cohérence linguistique** : tous les joueurs voient les questions dans la langue du créateur
- **Gérer le fallback linguistique** : français par défaut si traduction manquante

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

## 3. UX/UI et parcours utilisateur

### 3.1 Customer Journey détaillé (ÉTENDU avec authentification)

```mermaid
graph TD
    A[Page d'accueil avec logo] --> B{Utilisateur connecté?}
    B -->|Oui| B1[Dashboard personnel]
    B -->|Non| C[Introduction et règles]
    
    B1 --> D1[Choix: Créer/Rejoindre/Voir stats]
    C --> D{Choix action}
    
    D1 -->|Créer partie| E[Génération PIN]
    D1 -->|Rejoindre| F[Saisie PIN]
    D1 -->|Stats| STATS[Dashboard statistiques]
    
    D -->|Créer partie| E
    D -->|Rejoindre| F
    D -->|Se connecter| AUTH[Page connexion/inscription]
    
    AUTH --> AUTH1{Action auth}
    AUTH1 -->|Connexion| AUTH2[Login email/password]
    AUTH1 -->|Inscription| AUTH3[Register + vérification email]
    AUTH1 -->|OAuth| AUTH4[Google/Facebook/Apple]
    AUTH1 -->|Continuer invité| C
    
    AUTH2 --> B1
    AUTH3 --> B1
    AUTH4 --> B1
    
    E --> G[Saisie pseudo]
    F --> G
    G --> H[Salle d'attente avec distinction invité/connecté]
    H --> I[Début partie automatique]
    I --> J[Rounds de jeu identiques pour tous]
    
    J --> GAME[...Gameplay inchangé...]
    GAME --> W{Fin de partie}
    
    W --> W1{Type utilisateur}
    W1 -->|Connecté| W2[Stats sauvegardées automatiquement]
    W1 -->|Invité| W3[Modal conversion avec stats temporaires]
    
    W2 --> W4[Récap scores + lien dashboard]
    W3 --> W5{Choix invité}
    
    W5 -->|Créer compte| CONVERT[Conversion invité → compte]
    W5 -->|Plus tard| W6[Fermer modal - reproposer dans 3 parties]
    W5 -->|Continuer invité| W7[Fermer modal - stats perdues]
    
    CONVERT --> CONVERT1[Formulaire simplifié]
    CONVERT1 --> CONVERT2[Transfert automatique des stats]
    CONVERT2 --> B1[Redirection dashboard]
    
    W4 --> X{Continuer?}
    W6 --> X
    W7 --> X
    
    X -->|Nouvelle partie| Y[Rejouer avec même groupe]
    X -->|Accueil| Z1{Type utilisateur}
    
    Z1 -->|Connecté| B1
    Z1 -->|Invité| A
    
    Y --> E
```

#### *** NOUVEAUTÉ: Parcours de conversion invité → compte ***

##### Déclenchement automatique
1. **Fin de partie** : Modal s'affiche automatiquement pour tous les invités
2. **Conditions** : Après chaque partie terminée (4 rounds complets)
3. **Fréquence** : Reproposé toutes les 3 parties si refusé avec "Plus tard"
4. **Abandon** : Si "Continuer en invité" → pas de reproposition dans la session

##### Contenu persuasif de la modal
```
🎯 Sauvegardez vos exploits !

Cette session:
• 2 parties jouées
• Meilleur score: 847 points  
• Position moyenne: 2ème/4

Créez votre compte pour:
✅ Historique permanent de toutes vos parties
✅ Statistiques détaillées et graphiques d'évolution  
✅ Dashboard personnel avec vos performances
✅ Classement et comparaisons avec d'autres joueurs

[Formulaire: Prénom | Nom | Email | Mot de passe]
□ J'accepte les conditions d'utilisation

[🔥 Créer mon compte]    [⏰ Plus tard]    [📝 Continuer en invité]
```

##### Processus de conversion technique
1. **Collecte données** : Récupération automatique stats session invité
2. **Création compte** : Email/password + profil basique
3. **Transfert** : Migration des parties jouées vers historique utilisateur
4. **Recalcul** : Mise à jour statistiques agrégées automatique
5. **Confirmation** : Animation succès + redirection dashboard

##### Points d'optimisation UX
- **Timing** : Modal apparaît 3 secondes après affichage des résultats
- **Persistance** : Données temporaires sauvées 24h pour conversion ultérieure
- **A/B Testing** : Variations de messages et couleurs testables
- **Analytics** : Tracking taux conversion par variante

### 3.2 Écrans et interactions

#### Page d'accueil
- **Logo Percept** visible en permanence
- **État 1**: Introduction et présentation du jeu
- **État 2**: Règles du jeu et avantages
- **État 3**: Choix créer/rejoindre partie
- **Mobile**: Auto-scroll pour éviter masquage par clavier virtuel
- **Favicon et métadonnées**: Icônes complètes pour tous les appareils et plateformes

#### 3.2.1 Métadonnées et icônes (NOUVEAU)

**Icônes et favicon pour tous les appareils :**
- **favicon.ico** (généré depuis percept_logo.png) : 16x16, 32x32, 48x48 pour navigateurs classiques
- **apple-touch-icon.png** : 180x180 pour écrans d'accueil iOS (depuis percept_logo.png)
- **android-chrome-192x192.png** et **android-chrome-512x512.png** : pour Android et PWA
- **percept_logo.svg** : icône vectorielle moderne pour navigateurs compatibles

**Métadonnées HTML pour SEO et mobile :**
```html
<!-- Dans index.html ou app/layout.tsx -->
<link rel="icon" type="image/svg+xml" href="/percept_logo.svg" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.json" />

<!-- Open Graph pour résultats Google et réseaux sociaux -->
<meta property="og:title" content="Percept - Découvrez-vous entre amis" />
<meta property="og:description" content="Plongez dans une expérience où vos perceptions et celles des autres se confrontent." />
<meta property="og:image" content="/percept_logo.png" />
<meta property="og:type" content="website" />

<!-- Mobile et PWA -->
<meta name="theme-color" content="#6366F1" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="Percept" />
```

**Manifest.json pour PWA et écrans d'accueil Android :**
```json
{
  "name": "Percept - Être et Paraître",
  "short_name": "Percept",
  "description": "Découvrez-vous entre amis avec ce jeu social interactif",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0F172A",
  "theme_color": "#6366F1",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/android-chrome-512x512.png", 
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/percept_logo.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any"
    }
  ],
  "categories": ["games", "social"],
  "lang": "fr"
}
```

**Génération des icônes depuis les assets existants :**
1. **Source** : Utiliser `/public/percept_logo.png` (haute résolution)
2. **Conversion** : Générer automatiquement toutes les tailles avec un script ou service
3. **Formats** : PNG pour compatibilité, SVG pour qualité vectorielle
4. **Optimisation** : Compression lossless pour réduire la taille

**Tests de validation :**
- **iOS Safari** : Vérifier l'apparence sur écran d'accueil
- **Android Chrome** : Tester l'installation PWA et l'icône
- **Recherche Google** : Contrôler l'affichage du logo dans les résultats
- **Navigateurs desktop** : Valider favicon dans onglets

#### *** NOUVEAUTÉ AUTH: Écrans d'authentification ***

##### Page de connexion/inscription
- **Design unifié** : Un seul écran avec onglets "Connexion" / "Inscription"
- **Logo Percept** : Visible en haut de page pour cohérence
- **Formulaires optimisés** :
  - Connexion : Email + mot de passe + bouton "Se connecter"
  - Inscription : Prénom + nom + email + mot de passe + confirmation
  - Lien "Mot de passe oublié" sous le formulaire de connexion
- **OAuth intégré** : Boutons Google, Facebook, Apple avec design cohérent
- **Validation temps réel** : Messages d'erreur instantanés sous chaque champ
- **États visuels** : Loading, succès, erreur avec animations fluides
- **Lien retour** : "Continuer en invité" pour préserver l'expérience actuelle
- **Mobile first** : Auto-scroll et gestion clavier virtuel
- **Accessibilité** : ARIA labels, navigation clavier, contraste élevé

##### Dashboard utilisateur personnel
- **Navigation principale** : Sidebar ou tabs (Accueil, Historique, Statistiques, Profil)
- **Vue d'ensemble** :
  - Statistiques clés : Parties jouées, victoires, score moyen
  - Graphique d'évolution des performances (7/30 derniers jours)
  - Parties récentes avec résultats
  - Badge/niveau basé sur l'expérience
- **Actions rapides** :
  - "Créer une partie" (bouton CTA principal)
  - "Rejoindre une partie" avec champ PIN
  - "Inviter des amis" (partage lien/QR code)
- **Personnalisation** :
  - Avatar/photo de profil
  - Pseudo d'affichage
  - Préférences de langue
- **Responsive** : Layout adaptatif mobile/desktop
- **Cohérence** : Design system identique au jeu principal

##### Historique des parties
- **Liste chronologique** : Parties triées par date (plus récentes en premier)
- **Informations par partie** :
  - Date et heure de la partie
  - Nombre de joueurs total
  - Position finale et score
  - Durée de la partie
  - Langue de la partie
  - Aperçu des autres joueurs (pseudos)
- **Filtres et recherche** :
  - Par période (dernière semaine, mois, année)
  - Par langue de partie
  - Par nombre de joueurs
  - Par résultat (victoires, top 3, etc.)
- **Détail d'une partie** : Modal/page avec statistiques détaillées
- **Pagination** : Chargement par lot de 20 parties
- **États vides** : Message encourageant si aucune partie

##### Statistiques détaillées
- **Métriques globales** :
  - Nombre total de parties, victoires, podiums
  - Temps de jeu total et moyenne par partie
  - Score moyen et meilleur score
  - Temps de réponse moyen
- **Graphiques visuels** :
  - Évolution du score dans le temps (line chart)
  - Répartition des performances par type de round (bar chart)
  - Heatmap des jours/heures de jeu préférés
  - Comparaison avec moyennes globales
- **Statistiques par round** :
  - Performance par type (Personnalité, Situations, Représentations, Relations)
  - Questions favorites et moins réussies
  - Temps de réponse par catégorie
- **Tendances** :
  - Progression/régression récente
  - Série de victoires actuelle
  - Objectifs personnels et jalons atteints

##### Profil utilisateur et paramètres
- **Informations personnelles** :
  - Photo/avatar avec upload/crop
  - Nom d'affichage public
  - Bio courte (optionnelle)
  - Date d'inscription et dernière connexion
- **Préférences de jeu** :
  - Langue préférée pour les parties
  - Type de round favori
  - Style de jeu (compétitif, décontracté, social)
- **Confidentialité** :
  - Visibilité du profil (public, amis, privé)
  - Affichage des statistiques
  - Affichage de l'historique
- **Sécurité** :
  - Changement de mot de passe
  - Sessions actives avec révocation
  - Comptes OAuth liés
  - Suppression de compte
- **Notifications** :
  - Email de résumé hebdomadaire
  - Notifications de nouvelles fonctionnalités

##### Modal de conversion invité → compte
- **Déclenchement** : Affiché automatiquement à la fin des parties pour les invités
- **Design persuasif** :
  - Titre accrocheur : "Sauvegardez vos exploits !"
  - Récapitulatif de la session : parties jouées, meilleur score, position
  - Liste des bénéfices : historique, statistiques, dashboard, etc.
- **Formulaire simplifié** :
  - Prénom + nom (pré-remplis si possible)
  - Email + mot de passe
  - Case "J'accepte les conditions" avec lien
- **Options** :
  - Bouton principal "Créer mon compte" (conversion)
  - Lien discret "Continuer en invité" (ferme la modal)
  - Bouton "Plus tard" (ferme mais repropose dans 3 parties)
- **Feedback** : Animation de succès + redirection vers dashboard
- **A/B testing ready** : Variations de textes/couleurs testables

##### Écrans OAuth spécifiques
- **Pages de redirection** : Loading avec logo pendant l'authentification
- **Gestion des erreurs** : Messages clairs en cas d'échec OAuth
- **Premier connexion OAuth** : Modal de completion de profil si nécessaire
- **Linking accounts** : Interface pour lier/délier comptes sociaux

#### Salle d'attente (AMÉLIORÉE avec support auth)
- **Liste des joueurs** : Affichage temps réel avec distinction visuelle invité/connecté
  - Icône subtile ou badge pour les utilisateurs connectés
  - Pseudos identiques pour tous (pas de discrimination visible)
- **Code PIN** : Affiché en grand avec logo Percept
- **Démarrage automatique** : À 3 joueurs minimum (pas de bouton manuel)
- **Indicateur** : Nombre de joueurs avec progression visuelle
- **Gestion des déconnexions** : Reconnexion automatique pour les connectés
- **Invite auth** : Pour les invités, lien discret "Se connecter" dans le coin
  - N'interrompt pas l'expérience de jeu
  - Accessible mais non intrusif

#### Écran de jeu
- Header: Round en cours, joueur actif, système de classement
- Mini-classement remplacé par compteur points/joueurs
- Option dépliage classement complet au clic
- Corps: Question et options de réponse
- **Mobile**: Auto-scroll automatique pour garder la question visible
- **Timer**: 30 secondes pour les devineurs après première réponse
- Footer: Statut avec meilleur feedback visuel

#### Révélation des réponses
- Question rappelée en haut des résultats
- Bonne réponse encadrée vert uniquement
- Mauvaise réponse du joueur encadrée rouge uniquement
- Affichage des participants qui ont eu juste/faux
- Lisibilité "Mauvaise réponse" sur fond bleu assurée
- Points gagnés animés
- Auto-continue par dernier répondant

#### Page récap scores (AMÉLIORÉE avec auth)
- **Page attractive** : Design célébrant la fin de partie
- **Classement final** : Positions et scores détaillés pour tous
- **Statistiques individuelles** : Performance par round, temps de réponse
- **Différenciation par type d'utilisateur** :
  - **Invités** : Modal de conversion automatique avec stats temporaires
  - **Connectés** : Message "Stats sauvegardées" + lien vers dashboard
- **Actions de fin** :
  - Bouton "Rejouer" (nouvelle partie avec même groupe)
  - Bouton "Accueil" (retour page principale)
  - Pour connectés : "Voir mes statistiques" (lien dashboard)
- **Partage** : Résultats partageables sur réseaux sociaux (optionnel)
- **Historique** : Questions posées évitées dans prochaines parties

### 3.3 Design system recommandé

#### Palette de couleurs
```css
:root {
  /* Couleurs principales */
  --primary: #6366F1;      /* Indigo moderne */
  --secondary: #EC4899;    /* Rose accent */
  --success: #10B981;      /* Vert validation */
  --error: #EF4444;        /* Rouge erreur */
  
  /* Thèmes par round */
  --personality: #8B5CF6;   /* Violet */
  --situations: #3B82F6;    /* Bleu */
  --representations: #F59E0B; /* Orange */
  --relations: #EF4444;     /* Rouge */
  
  /* Neutres */
  --background: #0F172A;    /* Fond sombre */
  --surface: #1E293B;       /* Cartes */
  --text: #F8FAFC;          /* Texte principal */
  --text-muted: #94A3B8;    /* Texte secondaire */
}
```

#### Composants UI modernes
- **Cards**: Ombres douces, bordures arrondies, glassmorphism
- **Boutons**: États hover/active, ripple effect
- **Inputs**: Labels flottants, validation en temps réel
- **Animations**: Framer Motion pour transitions fluides
- **Toasts**: Notifications non-intrusives
- **Modals**: Backdrop flou, animations d'entrée/sortie

## 4. Questions et contenu multilingue

### 4.1 Architecture multilingue des questions

#### Format des questions multilingues
```typescript
// Question source (référence principale)
interface SourceQuestion {
  id: number;
  sourceId: number; // Pour questions originales = id
  locale: string; // 'fr' pour questions sources
  roundType: 'personality' | 'situations' | 'representations' | 'relations';
  text: string;
  options: string[] | null; // null pour rounds 3-4 (noms joueurs)
  category: string;
  isActive: boolean;
  metadata: {
    culturalContext?: string;
    translationNotes?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
  };
  createdAt: Date;
  updatedAt: Date;
}

// Traduction d'une question
interface QuestionTranslation {
  id: number;
  sourceId: number; // Référence vers question source
  locale: string; // 'en', 'es', 'it', 'pt', 'de'
  text: string;
  options: string[] | null;
  translationStatus: 'pending' | 'translated' | 'validated' | 'rejected';
  translatedBy?: string;
  validatedBy?: string;
  translationNotes?: string;
  culturalAdaptation?: string; // Adaptations culturelles spécifiques
  createdAt: Date;
  updatedAt: Date;
}

// Vue unifiée pour l'API
interface LocalizedQuestion {
  sourceId: number;
  locale: string;
  text: string;
  options: string[] | null;
  roundType: string;
  category: string;
}
```

#### Langues supportées et configuration
```typescript
const SUPPORTED_LOCALES = {
  'fr': {
    name: 'Français',
    nativeName: 'Français',
    flag: '🇫🇷',
    isDefault: true,
    isComplete: true // Base de questions complète
  },
  'en': {
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    isDefault: false,
    isComplete: false // Traductions en cours
  },
  'es': {
    name: 'Español',
    nativeName: 'Español',
    flag: '🇪🇸',
    isDefault: false,
    isComplete: false
  },
  'it': {
    name: 'Italiano', 
    nativeName: 'Italiano',
    flag: '🇮🇹',
    isDefault: false,
    isComplete: false
  },
  'pt': {
    name: 'Português',
    nativeName: 'Português',
    flag: '🇵🇹',
    isDefault: false,
    isComplete: false
  },
  'de': {
    name: 'Deutsch',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    isDefault: false,
    isComplete: false
  }
} as const;

type SupportedLocale = keyof typeof SUPPORTED_LOCALES;
```

### 4.2 Système de sélection des questions par langue

#### Logique de sélection et fallback
```typescript
class QuestionService {
  async getQuestionsByRound(
    roundType: RoundType, 
    locale: SupportedLocale, 
    excludeIds: number[] = []
  ): Promise<LocalizedQuestion[]> {
    
    // 1. Tenter questions dans la langue demandée
    let questions = await this.getTranslatedQuestions(roundType, locale, excludeIds);
    
    // 2. Si insuffisant, compléter avec français (fallback)
    if (questions.length < REQUIRED_QUESTIONS_PER_ROUND) {
      const fallbackQuestions = await this.getTranslatedQuestions(
        roundType, 
        'fr', 
        [...excludeIds, ...questions.map(q => q.sourceId)]
      );
      
      questions = [...questions, ...fallbackQuestions]
        .slice(0, REQUIRED_QUESTIONS_PER_ROUND);
      
      // Logger pour monitoring
      logger.warn(`Fallback to French for ${locale}, round ${roundType}`, {
        requestedLocale: locale,
        availableCount: questions.length,
        fallbackCount: fallbackQuestions.length
      });
    }
    
    return this.shuffleQuestions(questions);
  }
  
  private async getTranslatedQuestions(
    roundType: RoundType,
    locale: SupportedLocale,
    excludeIds: number[]
  ): Promise<LocalizedQuestion[]> {
    
    return await prisma.question.findMany({
      where: {
        roundType,
        locale,
        isActive: true,
        sourceId: { notIn: excludeIds }
      },
      select: {
        sourceId: true,
        locale: true,
        text: true,
        options: true,
        roundType: true,
        category: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}
```

### 4.3 Base de données questions multilingues

#### Structure du fichier epercept-questions-database.md transformé

**Nouveau format JSON hiérarchique par langue :**

```json
{
  "metadata": {
    "version": "2.0.0",
    "languages": ["fr", "en", "es", "it", "pt", "de"],
    "defaultLanguage": "fr",
    "totalSourceQuestions": "{{DYNAMIC_TOTAL}}", <!-- CORRIGÉ: Nombre dynamique calculé depuis la base de données plutôt que hardcodé -->
    "translationCompleteness": {
      "fr": "100%",
      "en": "0%",
      "es": "0%",
      "it": "0%",
      "pt": "0%",
      "de": "0%"
    },
    "lastUpdated": "2024-01-15T00:00:00Z",
    "rounds": {
      "personality": "{{DYNAMIC_PERSONALITY_COUNT}}", <!-- CORRIGÉ: Nombre dynamique depuis DB -->
      "situations": "{{DYNAMIC_SITUATIONS_COUNT}}", <!-- CORRIGÉ: Nombre dynamique depuis DB -->
      "representations": "{{DYNAMIC_REPRESENTATIONS_COUNT}}", <!-- CORRIGÉ: Nombre dynamique depuis DB -->
      "relations": "{{DYNAMIC_RELATIONS_COUNT}}" <!-- CORRIGÉ: Nombre dynamique depuis DB -->
    }
  },
  
  "questions": {
    "fr": {
      "personality": [
        {
          "sourceId": 1,
          "text": "Tes vrais amis, tu les comptes ...",
          "options": [
            "Sur les doigts d'une main",
            "Sur les deux mains", 
            "Tu n'as pas assez de doigts pour les compter",
            "Tu n'en as pas"
          ],
          "category": "relations-amitie",
          "metadata": {
            "culturalContext": "Question sur la perception de l'amitié en français",
            "difficulty": "easy"
          }
        },
        {
          "sourceId": 2,
          "text": "À quelle fréquence tu t'observes à travers un miroir ou des photos ?",
          "options": [
            "Plus souvent que la plupart des gens",
            "Moins souvent que la plupart des gens"
          ],
          "category": "perception-soi",
          "metadata": {
            "difficulty": "medium"
          }
        }
      ],
      "situations": [
        {
          "sourceId": 65,
          "text": "Tu as une opportunité de carrière exceptionnelle à l'étranger, mais cela signifierait laisser derrière toi ta famille et tes amis proches pour une période non négligeable. Que choisis-tu ?",
          "options": [
            "Je pars",
            "Je reste"
          ],
          "category": "dilemmes-carriere",
          "metadata": {
            "culturalContext": "Dilemme carrière vs famille",
            "difficulty": "hard"
          }
        }
      ],
      "representations": [
        {
          "sourceId": 131,
          "text": "Qui serait le·la plus enclin·e à partir avant la fin du jeu à cause d'une réponse qui ne lui plaît pas ?",
          "options": null,
          "category": "traits-negatifs",
          "metadata": {
            "specialBehavior": "playerNames",
            "difficulty": "medium"
          }
        }
      ],
      "relations": [
        {
          "sourceId": 247,
          "text": "La vie de quelle joueur/joueuse ne voudrais-tu pas mener ?",
          "options": null, 
          "category": "questions-negatives",
          "metadata": {
            "specialBehavior": "playerNames",
            "difficulty": "hard",
            "culturalContext": "Question potentiellement sensible"
          }
        }
      ]
    },
    
    "en": {
      "personality": [
        {
          "sourceId": 1,
          "text": "Your true friends, you count them ...",
          "options": [
            "On the fingers of one hand",
            "On both hands",
            "You don't have enough fingers to count them",
            "You don't have any"
          ],
          "category": "relations-amitie",
          "translationNotes": "Adapted for English-speaking cultural context",
          "translatedBy": "translator@example.com",
          "translationStatus": "validated"
        }
      ],
      "situations": [],
      "representations": [],
      "relations": []
    },
    
    "es": {
      "personality": [],
      "situations": [],
      "representations": [],
      "relations": []
    },
    
    "it": {
      "personality": [],
      "situations": [],
      "representations": [],
      "relations": []
    },
    
    "pt": {
      "personality": [],
      "situations": [],
      "representations": [],
      "relations": []
    },
    
    "de": {
      "personality": [],
      "situations": [],
      "representations": [],
      "relations": []
    }
  }
}
```

### 4.4 Processus de traduction et validation

#### Workflow de traduction
```typescript
enum TranslationStatus {
  PENDING = 'pending',
  TRANSLATED = 'translated', 
  VALIDATED = 'validated',
  REJECTED = 'rejected'
}

interface TranslationWorkflow {
  // 1. Export questions sources pour traducteurs
  exportForTranslation(locale: SupportedLocale): Promise<TranslationExport>;
  
  // 2. Import traductions depuis fichiers externes
  importTranslations(file: TranslationImport): Promise<ImportResult>;
  
  // 3. Validation par locuteurs natifs
  validateTranslation(questionId: number, locale: SupportedLocale): Promise<void>;
  
  // 4. Publication des traductions validées
  publishTranslations(locale: SupportedLocale): Promise<void>;
}
```

#### Scripts de migration des questions existantes

<!-- CORRIGÉ: Suppression du nombre hardcodé pour permettre une architecture flexible -->
```typescript
// Script de transformation format actuel → multilingue
async function migrateExistingQuestions() {
  const existingQuestions = await loadExistingQuestions();
  
  for (const question of existingQuestions) {
    // Créer question source en français
    await prisma.question.create({
      data: {
        sourceId: question.id,
        locale: 'fr',
        text: question.name,
        options: [
          question.answer_1,
          question.answer_2, 
          question.answer_3,
          question.answer_4
        ].filter(Boolean),
        roundType: mapRoundId(question.round_id),
        category: inferCategory(question),
        isActive: true,
        metadata: {
          migratedFrom: 'legacy',
          originalId: question.id
        }
      }
    });
  }
  
  logger.info('Migration completed', { 
    questionsCount: existingQuestions.length 
  });
}
```

### 4.5 Cohérence culturelle et qualité

#### Principes de traduction
- **Adaptation culturelle** : Pas de traduction littérale, adaptation au contexte
- **Cohérence terminologique** : Glossaire partagé entre traducteurs
- **Validation native** : Chaque langue validée par locuteur natif
- **Tests utilisateurs** : Validation auprès de groupes cibles par langue

#### Métriques qualité
```typescript
interface TranslationQuality {
  completeness: number; // % questions traduites
  validationRate: number; // % questions validées
  userFeedback: number; // Note moyenne utilisateurs
  culturalRelevance: number; // Pertinence culturelle
  consistency: number; // Cohérence terminologique
}
```

## 5. Architecture technique recommandée

### 5.1 Frontend - Next.js 14

#### Pourquoi Next.js?
- **App Router**: Routing moderne avec layouts imbriqués
- **Server Components**: Meilleure performance initiale
- **API Routes**: Backend intégré pour endpoints simples
- **Optimisations**: Images, fonts, bundling automatique
- **TypeScript**: Support natif excellent

#### Structure proposée (étendue avec authentification)
```
apps/web/
├── app/
│   ├── (marketing)/        # Pages publiques
│   │   ├── page.tsx       # Accueil (avec auth optionnelle)
│   │   └── layout.tsx     # Layout marketing
│   ├── (auth)/            # *** NOUVEAUTÉ: Pages d'authentification ***
│   │   ├── login/
│   │   │   └── page.tsx   # Page connexion/inscription unifiée
│   │   ├── verify-email/
│   │   │   └── page.tsx   # Vérification email
│   │   ├── reset-password/
│   │   │   └── page.tsx   # Reset mot de passe
│   │   └── layout.tsx     # Layout auth (centré, logo)
│   ├── dashboard/         # *** NOUVEAUTÉ: Pages utilisateur connecté ***
│   │   ├── page.tsx       # Dashboard principal
│   │   ├── history/
│   │   │   └── page.tsx   # Historique des parties
│   │   ├── statistics/
│   │   │   └── page.tsx   # Statistiques détaillées
│   │   ├── profile/
│   │   │   └── page.tsx   # Profil et paramètres
│   │   └── layout.tsx     # Layout avec navigation sidebar
│   ├── game/
│   │   ├── [pin]/         # Routes dynamiques (auth optionnelle)
│   │   │   ├── lobby/
│   │   │   ├── play/
│   │   │   └── results/   # Modifié pour conversion invité
│   │   └── layout.tsx     # Layout jeu (auth-aware)
│   └── api/               # API routes Next.js (proxy vers NestJS)
├── components/
│   ├── ui/                # Composants shadcn/ui de base
│   ├── auth/              # *** NOUVEAUTÉ: Composants d'authentification ***
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── OAuthButtons.tsx
│   │   ├── ForgotPasswordForm.tsx
│   │   ├── ResetPasswordForm.tsx
│   │   ├── GuestConversionModal.tsx
│   │   └── AuthProvider.tsx
│   ├── dashboard/         # *** NOUVEAUTÉ: Composants dashboard ***
│   │   ├── DashboardLayout.tsx
│   │   ├── StatsOverview.tsx
│   │   ├── GameHistoryList.tsx
│   │   ├── PerformanceChart.tsx
│   │   ├── ProfileForm.tsx
│   │   └── NavigationSidebar.tsx
│   ├── game/              # Composants métier (modifiés pour auth)
│   │   ├── GameLobby.tsx  # Avec distinction invité/connecté
│   │   ├── GameResults.tsx # Avec modal conversion
│   │   ├── PlayerList.tsx # Avec badges auth
│   │   └── GameHeader.tsx # Avec statut utilisateur
│   └── shared/            # Composants partagés
│       ├── ProtectedRoute.tsx
│       ├── OptionalAuthWrapper.tsx
│       └── UserAvatar.tsx
├── lib/
│   ├── auth/              # *** NOUVEAUTÉ: Utilities d'authentification ***
│   │   ├── auth-context.tsx
│   │   ├── auth-config.ts
│   │   ├── session-manager.ts
│   │   └── guest-converter.ts
│   ├── api/               # *** NOUVEAUTÉ: Clients API ***
│   │   ├── auth-client.ts
│   │   ├── user-client.ts
│   │   ├── game-client.ts
│   │   └── api-config.ts
│   ├── store/             # Stores Zustand étendus
│   │   ├── auth-store.ts  # État d'authentification
│   │   ├── user-store.ts  # Données utilisateur
│   │   ├── game-store.ts  # État de jeu (existant)
│   │   └── index.ts       # Store combiné
│   ├── hooks/             # *** NOUVEAUTÉ: Hooks personnalisés ***
│   │   ├── useAuth.ts
│   │   ├── useUser.ts
│   │   ├── useGuestSession.ts
│   │   └── useConversion.ts
│   ├── socket.ts          # Client Socket.io (modifié pour auth)
│   └── utils.ts           # Helpers généraux
├── middleware.ts          # *** NOUVEAUTÉ: Middleware Next.js pour auth ***
└── styles/
    └── globals.css        # Tailwind + custom
```

#### *** NOUVEAUTÉ AUTH: Composants React clés ***

##### AuthProvider - Context d'authentification
```typescript
// lib/auth/auth-context.tsx
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  convertGuest: (data: ConvertGuestData) => Promise<void>;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Gestion des tokens, refresh automatique, logout sur expiration
  // Intégration avec le store Zustand pour la persistance
  
  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, ... }}>
      {children}
    </AuthContext.Provider>
  );
};
```

##### GuestConversionModal - Modal de conversion
```typescript
// components/auth/GuestConversionModal.tsx
interface GuestConversionModalProps {
  isOpen: boolean;
  guestStats: GuestSessionStats;
  onConvert: (data: ConvertGuestData) => void;
  onLater: () => void;
  onSkip: () => void;
}

export const GuestConversionModal: React.FC<GuestConversionModalProps> = ({
  isOpen, guestStats, onConvert, onLater, onSkip
}) => {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="max-w-md">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">🎯 Sauvegardez vos exploits !</h2>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Cette session:</h3>
            <ul className="text-sm space-y-1">
              <li>• {guestStats.gamesPlayed} parties jouées</li>
              <li>• Meilleur score: {guestStats.bestScore} points</li>
              <li>• Position moyenne: {guestStats.averagePosition}</li>
            </ul>
          </div>
          
          <div className="text-left space-y-2">
            <p className="font-semibold">Créez votre compte pour:</p>
            <ul className="text-sm space-y-1">
              <li>✅ Historique permanent de toutes vos parties</li>
              <li>✅ Statistiques détaillées et graphiques</li>
              <li>✅ Dashboard personnel avec performances</li>
              <li>✅ Classements et comparaisons</li>
            </ul>
          </div>
          
          <ConversionForm onSubmit={onConvert} />
          
          <div className="flex gap-2 pt-4">
            <Button onClick={onConvert} className="flex-1">
              🔥 Créer mon compte
            </Button>
            <Button variant="outline" onClick={onLater}>
              ⏰ Plus tard
            </Button>
            <Button variant="ghost" onClick={onSkip} className="text-xs">
              📝 Continuer en invité
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

##### OptionalAuthWrapper - Wrapper auth optionnelle
```typescript
// components/shared/OptionalAuthWrapper.tsx
interface OptionalAuthWrapperProps {
  children: React.ReactNode;
  guestFallback?: React.ReactNode;
  loadingFallback?: React.ReactNode;
}

export const OptionalAuthWrapper: React.FC<OptionalAuthWrapperProps> = ({
  children, guestFallback, loadingFallback
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return loadingFallback || <LoadingSpinner />;
  }
  
  // Rendre le contenu pour utilisateurs connectés ET invités
  // Permet la différenciation UI basée sur isAuthenticated
  return (
    <div data-auth-status={isAuthenticated ? 'authenticated' : 'guest'}>
      {children}
    </div>
  );
};
```

##### DashboardLayout - Layout dashboard utilisateur
```typescript
// components/dashboard/DashboardLayout.tsx
interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  action?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children, title, action
}) => {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationSidebar />
      <div className="lg:pl-64">
        <header className="bg-white shadow-sm border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              <p className="text-gray-600">Bonjour {user?.firstName} 👋</p>
            </div>
            {action}
          </div>
        </header>
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
```

##### Middleware Next.js pour l'authentification
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from './lib/auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Routes protégées (nécessitent une authentification)
  const protectedRoutes = ['/dashboard'];
  
  // Routes d'authentification (redirections si déjà connecté)
  const authRoutes = ['/login', '/register'];
  
  const token = request.cookies.get('auth-token')?.value;
  
  // Vérifier l'authentification pour les routes protégées
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    
    try {
      await verifyJWT(token);
    } catch (error) {
      // Token invalide, rediriger vers login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth-token');
      return response;
    }
  }
  
  // Rediriger vers dashboard si déjà connecté et sur page auth
  if (authRoutes.some(route => pathname.startsWith(route)) && token) {
    try {
      await verifyJWT(token);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } catch (error) {
      // Token invalide, continuer vers la page auth
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register']
};
```

#### Configuration des métadonnées et icônes dans Next.js

**Layout principal avec métadonnées complètes :**
```typescript
// app/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Percept - Découvrez-vous entre amis',
  description: 'Plongez dans une expérience où vos perceptions et celles des autres se confrontent.',
  
  // Icônes
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/percept_logo.svg', type: 'image/svg+xml' }
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }
    ],
    other: [
      { rel: 'mask-icon', url: '/percept_logo.svg', color: '#6366F1' }
    ]
  },
  
  // Web App Manifest
  manifest: '/manifest.json',
  
  // Open Graph
  openGraph: {
    title: 'Percept - Découvrez-vous entre amis',
    description: 'Plongez dans une expérience où vos perceptions et celles des autres se confrontent.',
    url: 'https://percept.app',
    siteName: 'Percept',
    images: [
      {
        url: '/percept_logo.png',
        width: 1200,
        height: 630,
        alt: 'Logo Percept'
      }
    ],
    locale: 'fr_FR',
    type: 'website'
  },
  
  // Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Percept - Découvrez-vous entre amis',
    description: 'Plongez dans une expérience où vos perceptions et celles des autres se confrontent.',
    images: ['/percept_logo.png']
  },
  
  // Mobile et PWA
  themeColor: '#6366F1',
  viewport: 'width=device-width, initial-scale=1',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Percept'
  }
};
```

**Structure des assets requis dans /public/ :**
```
public/
├── favicon.ico                 # Généré depuis percept_logo.png
├── favicon-16x16.png          # 16x16 optimisé
├── favicon-32x32.png          # 32x32 optimisé  
├── apple-touch-icon.png       # 180x180 pour iOS
├── android-chrome-192x192.png # 192x192 pour Android
├── android-chrome-512x512.png # 512x512 pour Android
├── percept_logo.svg           # Existant - icône vectorielle
├── percept_logo.png           # Existant - source haute résolution
├── manifest.json              # Web App Manifest
└── robots.txt                 # SEO
```

**Script de génération automatique des icônes :**
```typescript
// scripts/generate-icons.ts
import sharp from 'sharp';
import { writeFileSync } from 'fs';

async function generateIcons() {
  const source = './public/percept_logo.png';
  
  // Générer toutes les tailles d'icônes
  const sizes = [16, 32, 180, 192, 512];
  
  for (const size of sizes) {
    await sharp(source)
      .resize(size, size)
      .png({ quality: 95, compressionLevel: 9 })
      .toFile(`./public/${getIconName(size)}`);
  }
  
  // Générer favicon.ico multi-tailles
  await sharp(source)
    .resize(32, 32)
    .toFormat('ico')
    .toFile('./public/favicon.ico');
}

function getIconName(size: number): string {
  switch (size) {
    case 16: return 'favicon-16x16.png';
    case 32: return 'favicon-32x32.png';
    case 180: return 'apple-touch-icon.png';
    case 192: return 'android-chrome-192x192.png';
    case 512: return 'android-chrome-512x512.png';
    default: return `icon-${size}x${size}.png`;
  }
}
```

### 5.2 Spécifications techniques critiques

#### Résolution des bugs de synchronisation
```typescript
// Nouveau système de gestion d'état robuste
interface GameState {
  // Gestion des égalités avec timestamp pour départage
  rankings: Array<{
    playerId: string;
    points: number;
    lastPointTimestamp: number; // Pour départager les ex aequo
    position: number;
  }>;
  
  // États de synchronisation
  currentPhase: 'waiting' | 'answering' | 'guessing' | 'revealing' | 'transitioning';
  playersReady: Set<string>;
  lastRepondent: string | null; // Pour auto-continue
  
  // Gestion de la continuité
  sessionHistory: {
    gamesPlayed: number;
    cumulativeScores: Map<string, number>;
    usedQuestions: Set<number>;
  };
  
  // Reconnexion
  playerConnections: Map<string, {
    socketId: string;
    lastSeen: number;
    isOnline: boolean;
  }>;
}

// Timer automatique pour devinettes
interface TimerSystem {
  phase: 'answering' | 'guessing';
  startTime: number;
  duration: number; // 30s pour guessing
  autoAdvance: boolean;
}
```

#### Gestion mobile avec auto-scroll
```typescript
// Hook personnalisé pour auto-scroll mobile
const useAutoScroll = () => {
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      
      // Détection mobile
      if (window.innerHeight < 600 || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
        setTimeout(() => {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
          
          // Ajustement pour clavier virtuel
          window.scrollBy(0, -100);
        }, 300);
      }
    };
    
    document.addEventListener('focusin', handleFocusIn);
    return () => document.removeEventListener('focusin', handleFocusIn);
  }, []);
};
```

#### Nouveau système de classement équilibré
```typescript
// Composant de classement intelligent
const SmartRanking = () => {
  const [expanded, setExpanded] = useState(false);
  
  // Logique de classement avec gestion ex aequo
  const calculateRankings = (players: Player[]) => {
    return players
      .sort((a, b) => {
        if (a.points !== b.points) return b.points - a.points;
        // Départage par timestamp du dernier point
        return a.lastPointTimestamp - b.lastPointTimestamp;
      })
      .map((player, index, arr) => ({
        ...player,
        position: index === 0 || arr[index-1].points !== player.points 
          ? index + 1 
          : arr[index-1].position
      }));
  };
  
  return (
    <div className="ranking-container">
      {/* Affichage compact par défaut */}
      <div className="ranking-summary">
        Points: {currentPlayer.points} | Position: {currentPlayer.position}
      </div>
      
      {/* Classement complet dépliable */}
      {expanded && (
        <div className="ranking-expanded">
          {/* Classement détaillé */}
        </div>
      )}
    </div>
  );
};
```

### 5.3 Backend - NestJS

#### Pourquoi NestJS?
- **Architecture modulaire**: Séparation des responsabilités
- **TypeScript first**: Type-safety totale
- **Decorators**: Code expressif et maintenable
- **Built-in WebSockets**: Support Socket.io natif
- **Scalabilité**: Prêt pour la croissance
- **Gestion robuste des déconnexions**: Essentiel pour les bugs identifiés

#### Spécifications WebSocket avancées

##### Gestion des connexions robuste
```typescript
// Gateway WebSocket avec gestion avancée des déconnexions
@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(GameGateway.name);
  private connectionMap = new Map<string, ConnectionInfo>();
  
  async handleConnection(client: Socket) {
    try {
      // Validation du token/session
      const player = await this.validateConnection(client);
      
      // Enregistrement de la connexion
      this.connectionMap.set(client.id, {
        playerId: player.id,
        gameId: player.gameId,
        connectedAt: Date.now(),
        lastPing: Date.now(),
        isReconnection: false
      });
      
      // Tentative de reconnexion
      await this.handleReconnection(player, client);
      
      this.logger.log(`Player ${player.username} connected to game ${player.gameId}`);
    } catch (error) {
      this.logger.error('Connection failed:', error);
      client.disconnect(true);
    }
  }
  
  async handleDisconnect(client: Socket) {
    const connection = this.connectionMap.get(client.id);
    if (!connection) return;
    
    // Marquer comme déconnecté mais garder les données 2 minutes
    await this.handlePlayerDisconnection(connection);
    
    // Nettoyer après timeout
    setTimeout(async () => {
      await this.cleanupDisconnectedPlayer(connection);
    }, 120000); // 2 minutes
    
    this.connectionMap.delete(client.id);
  }
  
  private async handleReconnection(player: Player, client: Socket) {
    // Vérifier si le joueur était dans une partie
    const activeGame = await this.gameService.findActiveGameForPlayer(player.id);
    
    if (activeGame) {
      // Rejoindre la room
      await client.join(`game-${activeGame.id}`);
      
      // Restaurer l'état du jeu
      const gameState = await this.gameService.getGameState(activeGame.id);
      client.emit('game-state-restored', gameState);
      
      // Notifier les autres joueurs
      client.to(`game-${activeGame.id}`).emit('player-reconnected', {
        playerId: player.id,
        username: player.username
      });
    }
  }
  
  private async handlePlayerDisconnection(connection: ConnectionInfo) {
    const { gameId, playerId } = connection;
    
    // Marquer le joueur comme déconnecté
    await this.gameService.markPlayerDisconnected(playerId);
    
    // Notifier les autres joueurs
    this.server.to(`game-${gameId}`).emit('player-disconnected', {
      playerId,
      canReconnect: true,
      timeout: 120000
    });
    
    // Gérer l'impact sur le jeu en cours
    const game = await this.gameService.findById(gameId);
    if (game.status === 'IN_PROGRESS') {
      await this.adjustGameForDisconnection(game, playerId);
    }
  }
}

interface ConnectionInfo {
  playerId: string;
  gameId: string;
  connectedAt: number;
  lastPing: number;
  isReconnection: boolean;
}
```

##### Events Socket.io complets
```typescript
// Événements entrants (du client)
export const SOCKET_EVENTS_IN = {
  // Connexion et parties
  JOIN_GAME: 'join-game',
  CREATE_GAME: 'create-game',
  LEAVE_GAME: 'leave-game',
  
  // Gameplay
  SUBMIT_ANSWER: 'submit-answer',
  SUBMIT_GUESS: 'submit-guess',
  READY_FOR_NEXT: 'ready-for-next',
  
  // État
  REQUEST_GAME_STATE: 'request-game-state',
  PING: 'ping',
  
  // Social
  SEND_MESSAGE: 'send-message',
  SEND_REACTION: 'send-reaction'
} as const;

// Événements sortants (vers le client)
export const SOCKET_EVENTS_OUT = {
  // État du jeu
  GAME_STATE_UPDATE: 'game-state-update',
  GAME_STATE_RESTORED: 'game-state-restored',
  
  // Joueurs
  PLAYER_JOINED: 'player-joined',
  PLAYER_LEFT: 'player-left',
  PLAYER_DISCONNECTED: 'player-disconnected',
  PLAYER_RECONNECTED: 'player-reconnected',
  
  // Phases de jeu
  GAME_STARTED: 'game-started',
  ROUND_STARTED: 'round-started',
  QUESTION_ASKED: 'question-asked',
  ANSWER_SUBMITTED: 'answer-submitted',
  ALL_GUESSES_RECEIVED: 'all-guesses-received',
  RESULTS_REVEALED: 'results-revealed',
  ROUND_ENDED: 'round-ended',
  GAME_ENDED: 'game-ended',
  
  // Timer
  TIMER_STARTED: 'timer-started',
  TIMER_UPDATE: 'timer-update',
  TIMER_EXPIRED: 'timer-expired',
  
  // Erreurs
  ERROR: 'error',
  VALIDATION_ERROR: 'validation-error',
  
  // Social
  MESSAGE_RECEIVED: 'message-received',
  REACTION_RECEIVED: 'reaction-received',
  
  // Système
  PONG: 'pong'
} as const;
```

##### Système de heartbeat et health check
```typescript
@Injectable()
export class ConnectionHealthService {
  private readonly logger = new Logger(ConnectionHealthService.name);
  private healthChecks = new Map<string, NodeJS.Timer>();
  
  startHealthCheck(clientId: string, gameId: string) {
    const interval = setInterval(async () => {
      const connection = this.getConnection(clientId);
      
      if (!connection) {
        this.stopHealthCheck(clientId);
        return;
      }
      
      // Vérifier la dernière activité
      const timeSinceLastPing = Date.now() - connection.lastPing;
      
      if (timeSinceLastPing > 60000) { // 1 minute sans ping
        this.logger.warn(`Client ${clientId} seems inactive, initiating ping`);
        await this.pingClient(clientId);
      }
      
      if (timeSinceLastPing > 120000) { // 2 minutes sans réponse
        this.logger.error(`Client ${clientId} is unresponsive, disconnecting`);
        await this.forceDisconnect(clientId);
      }
    }, 30000); // Vérification toutes les 30s
    
    this.healthChecks.set(clientId, interval);
  }
  
  stopHealthCheck(clientId: string) {
    const interval = this.healthChecks.get(clientId);
    if (interval) {
      clearInterval(interval);
      this.healthChecks.delete(clientId);
    }
  }
  
  private async pingClient(clientId: string) {
    // Implémenter ping personnalisé avec timeout
  }
  
  private async forceDisconnect(clientId: string) {
    // Forcer la déconnexion du client non-responsif
  }
}
```

#### Structure proposée (étendue avec authentification)
```
apps/api/
├── src/
│   ├── auth/                   # *** NOUVEAUTÉ: Module d'authentification ***
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── auth.controller.ts
│   │   ├── oauth.controller.ts
│   │   ├── strategies/
│   │   │   ├── jwt.strategy.ts
│   │   │   ├── google.strategy.ts
│   │   │   ├── facebook.strategy.ts
│   │   │   └── apple.strategy.ts
│   │   ├── guards/
│   │   │   ├── auth.guard.ts
│   │   │   ├── optional-auth.guard.ts
│   │   │   └── oauth.guards.ts
│   │   └── dto/
│   │       ├── register.dto.ts
│   │       ├── login.dto.ts
│   │       └── oauth.dto.ts
│   ├── users/                  # *** NOUVEAUTÉ: Module utilisateurs ***
│   │   ├── users.module.ts
│   │   ├── users.service.ts
│   │   ├── users.controller.ts
│   │   ├── user-statistics.service.ts
│   │   └── dto/
│   │       ├── update-profile.dto.ts
│   │       └── change-password.dto.ts
│   ├── email/                  # *** NOUVEAUTÉ: Service d'email ***
│   │   ├── email.module.ts
│   │   ├── email.service.ts
│   │   └── templates/
│   │       ├── welcome.hbs
│   │       ├── verify-email.hbs
│   │       └── reset-password.hbs
│   ├── games/
│   │   ├── games.module.ts
│   │   ├── games.service.ts
│   │   ├── games.controller.ts
│   │   └── entities/
│   ├── rooms/
│   │   ├── rooms.module.ts
│   │   ├── rooms.service.ts
│   │   └── rooms.gateway.ts    # WebSocket gateway (modifié pour auth)
│   ├── questions/
│   │   ├── questions.module.ts
│   │   └── questions.service.ts
│   ├── players/
│   │   ├── players.module.ts
│   │   └── players.service.ts
│   └── common/
│       ├── guards/             # Guards étendus pour auth mixte
│       │   ├── session.guard.ts
│       │   ├── game-participant.guard.ts
│       │   └── rate-limit.guard.ts
│       ├── interceptors/       # Logging, transform
│       │   ├── auth.interceptor.ts
│       │   └── locale.interceptor.ts
│       ├── pipes/              # Validation
│       └── decorators/         # *** NOUVEAUTÉ: Décorateurs auth ***
│           ├── current-user.decorator.ts
│           ├── optional-auth.decorator.ts
│           └── guest-session.decorator.ts
├── prisma/
│   ├── schema.prisma          # Étendu avec modèles auth
│   └── migrations/
└── test/
    ├── auth/                  # *** NOUVEAUTÉ: Tests d'authentification ***
    ├── users/
    └── integration/
```

#### *** NOUVEAUTÉ AUTH: Services d'authentification détaillés ***

##### Service d'authentification principal
```typescript
// src/auth/auth.service.ts
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private configService: ConfigService,
    private redisService: RedisService
  ) {}

  // Inscription email/mot de passe
  async register(registerData: RegisterData): Promise<User> {
    const { email, password, firstName, lastName, preferredLocale } = registerData;
    
    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Token de vérification email
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    
    // Créer l'utilisateur avec profil
    const user = await this.prisma.user.create({
      data: {
        email,
        hashedPassword,
        firstName,
        lastName,
        preferredLocale,
        emailVerificationToken,
        profile: {
          create: {
            displayName: `${firstName} ${lastName}`.trim(),
            profileVisibility: 'public'
          }
        },
        statistics: {
          create: {} // Statistiques vides
        }
      },
      include: {
        profile: true,
        statistics: true
      }
    });
    
    return user;
  }

  // Connexion email/mot de passe
  async login(loginData: LoginData): Promise<LoginResult> {
    const { email, password, ipAddress, userAgent } = loginData;
    
    // Trouver l'utilisateur
    const user = await this.prisma.user.findUnique({
      where: { email, isActive: true },
      include: { profile: true }
    });
    
    if (!user || !user.hashedPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    // Créer les tokens
    const tokens = await this.generateTokens(user);
    
    // Créer la session
    await this.createUserSession(user.id, tokens.refreshToken, { ipAddress, userAgent });
    
    // Mettre à jour lastLoginAt
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });
    
    return {
      user: this.sanitizeUser(user),
      ...tokens
    };
  }

  // OAuth (Google, Facebook, Apple)
  async handleOAuthCallback(provider: string, oauthData: OAuthData): Promise<LoginResult> {
    const { providerAccountId, email, firstName, lastName, accessToken } = oauthData;
    
    // Chercher un compte OAuth existant
    let oauthAccount = await this.prisma.oAuthAccount.findUnique({
      where: {
        provider_providerAccountId: {
          provider,
          providerAccountId
        }
      },
      include: { user: { include: { profile: true } } }
    });
    
    let user: User;
    
    if (oauthAccount) {
      // Utilisateur existant - mettre à jour les tokens
      user = oauthAccount.user;
      await this.prisma.oAuthAccount.update({
        where: { id: oauthAccount.id },
        data: {
          accessToken,
          lastUsedAt: new Date()
        }
      });
    } else {
      // Nouvel utilisateur ou linking à un compte existant
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
        include: { profile: true }
      });
      
      if (existingUser) {
        // Lier le compte OAuth à l'utilisateur existant
        user = existingUser;
        await this.prisma.oAuthAccount.create({
          data: {
            userId: user.id,
            provider,
            providerAccountId,
            accessToken
          }
        });
      } else {
        // Créer un nouvel utilisateur avec OAuth
        user = await this.prisma.user.create({
          data: {
            email,
            firstName,
            lastName,
            isEmailVerified: true, // OAuth emails sont pré-vérifiés
            profile: {
              create: {
                displayName: `${firstName} ${lastName}`.trim()
              }
            },
            statistics: {
              create: {}
            },
            oauthAccounts: {
              create: {
                provider,
                providerAccountId,
                accessToken
              }
            }
          },
          include: { profile: true }
        });
      }
    }
    
    // Générer les tokens JWT
    const tokens = await this.generateTokens(user);
    
    return {
      user: this.sanitizeUser(user),
      ...tokens,
      isNewUser: !oauthAccount
    };
  }

  // Conversion invité → utilisateur connecté
  async convertGuestToUser(convertData: ConvertGuestData): Promise<ConversionResult> {
    const { email, password, firstName, lastName, guestSessionId } = convertData;
    
    // Créer le nouvel utilisateur
    const user = await this.register({
      email,
      password,
      firstName,
      lastName,
      preferredLocale: 'fr'
    });
    
    // Récupérer les parties de l'invité
    const guestPlayers = await this.prisma.player.findMany({
      where: { sessionId: guestSessionId, isGuest: true },
      include: { game: true, answers: true }
    });
    
    // Transférer les données vers l'utilisateur
    const transferredGames = [];
    for (const player of guestPlayers) {
      // Mettre à jour le player pour le lier à l'utilisateur
      await this.prisma.player.update({
        where: { id: player.id },
        data: {
          userId: user.id,
          isGuest: false
        }
      });
      
      // Créer l'entrée dans l'historique
      await this.prisma.userGameHistory.create({
        data: {
          userId: user.id,
          gameId: player.gameId,
          finalScore: player.points,
          finalPosition: player.position,
          totalPlayers: await this.countPlayersInGame(player.gameId),
          gameLocale: player.game.locale,
          wasGameCreator: player.isCreator,
          totalAnswers: player.answers.length,
          correctAnswers: player.answers.filter(a => a.isCorrect).length
        }
      });
      
      transferredGames.push(player.game);
    }
    
    // Recalculer les statistiques
    await this.recalculateUserStatistics(user.id);
    
    // Générer les tokens
    const tokens = await this.generateTokens(user);
    
    return {
      user: this.sanitizeUser(user),
      ...tokens,
      transferredGamesCount: transferredGames.length
    };
  }

  // Génération des tokens JWT
  private async generateTokens(user: User): Promise<TokenPair> {
    const payload = {
      sub: user.id,
      email: user.email,
      emailVerified: user.isEmailVerified
    };
    
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m' // Token court pour sécurité
    });
    
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d' // Token long pour UX
    });
    
    return {
      accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000) // 15 minutes
    };
  }

  // Rafraîchir les tokens
  async refreshTokens(refreshData: RefreshData): Promise<TokenPair> {
    const { refreshToken, ipAddress, userAgent } = refreshData;
    
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub, isActive: true }
      });
      
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      
      // Vérifier que le refresh token existe en DB
      const session = await this.prisma.userSession.findFirst({
        where: {
          userId: user.id,
          refreshToken,
          isActive: true,
          expiresAt: { gt: new Date() }
        }
      });
      
      if (!session) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      
      // Générer de nouveaux tokens
      const newTokens = await this.generateTokens(user);
      
      // Mettre à jour la session
      await this.prisma.userSession.update({
        where: { id: session.id },
        data: {
          refreshToken: newTokens.refreshToken,
          expiresAt: newTokens.expiresAt,
          lastActivityAt: new Date()
        }
      });
      
      return newTokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // Déconnexion
  async logout(userId: string, sessionId?: string): Promise<void> {
    if (sessionId) {
      // Déconnexion d'une session spécifique
      await this.prisma.userSession.update({
        where: { id: sessionId, userId },
        data: { isActive: false }
      });
    } else {
      // Déconnexion de toutes les sessions
      await this.prisma.userSession.updateMany({
        where: { userId },
        data: { isActive: false }
      });
    }
  }

  // Vérification d'email
  async verifyEmail(token: string): Promise<User> {
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        isActive: true
      }
    });
    
    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }
    
    // Marquer l'email comme vérifié
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerified: new Date()
      }
    });
    
    return updatedUser;
  }

  // Reset mot de passe
  async initiatePasswordReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email, isActive: true }
    });
    
    if (!user) {
      // Ne pas révéler si l'email existe ou non
      return;
    }
    
    // Générer un token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpiresAt: resetExpiresAt
      }
    });
    
    // Envoyer l'email de reset
    await this.emailService.sendPasswordResetEmail(user.email, resetToken);
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiresAt: { gt: new Date() },
        isActive: true
      }
    });
    
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }
    
    // Hash du nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        hashedPassword,
        passwordResetToken: null,
        passwordResetExpiresAt: null
      }
    });
    
    // Invalider toutes les sessions existantes
    await this.prisma.userSession.updateMany({
      where: { userId: user.id },
      data: { isActive: false }
    });
  }

  private sanitizeUser(user: any): SafeUser {
    const { hashedPassword, emailVerificationToken, passwordResetToken, ...safeUser } = user;
    return safeUser;
  }
}
```

##### Guard d'authentification optionnelle
```typescript
// src/common/guards/optional-auth.guard.ts
@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Essayer d'extraire le token JWT
    const token = this.extractTokenFromHeader(request);
    
    if (token) {
      try {
        // Vérifier le token JWT
        const payload = this.jwtService.verify(token);
        const user = await this.prisma.user.findUnique({
          where: { id: payload.sub, isActive: true },
          include: { profile: true }
        });
        
        if (user) {
          request.user = user;
          request.isAuthenticated = true;
        }
      } catch (error) {
        // Token invalide, continuer en mode invité
      }
    }
    
    // Essayer d'extraire la session invité
    const guestSessionId = request.headers['x-guest-session'] || request.sessionId;
    if (guestSessionId) {
      request.sessionId = guestSessionId;
      request.isGuest = !request.user;
    }
    
    // Toujours autoriser (invité ou connecté)
    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

### 5.4 Base de données - PostgreSQL + Prisma avec support multilingue

#### Schéma Prisma étendu pour l'internationalisation

```prisma
// Schéma complet avec support multilingue et optimisations performance
model Game {
  id            String    @id @default(cuid())
  pin           String    @unique @db.VarChar(6) // Optimisation: taille fixe
  status        GameStatus @default(WAITING)
  currentRound  Int       @default(0) @db.SmallInt
  currentTurn   Int       @default(0) @db.SmallInt
  maxPlayers    Int       @default(7) @db.SmallInt
  minPlayers    Int       @default(3) @db.SmallInt
  
  // *** NOUVEAUTÉ i18n: Langue de la partie ***
  locale        String    @default("fr") @db.VarChar(2) // Langue imposée par créateur
  
  // *** NOUVEAUTÉ AUTH: Support créateur utilisateur connecté ***
  creatorUserId String?   // null pour parties créées par invités
  creatorUser   User?     @relation("UserCreatedGames", fields: [creatorUserId], references: [id])
  
  // Métadonnées temporelles
  createdAt     DateTime  @default(now())
  startedAt     DateTime?
  endedAt       DateTime?
  lastActivity  DateTime  @default(now()) // Pour nettoyage auto
  
  // Configuration du jeu
  config        Json?     // Paramètres: timers, règles spéciales
  
  // Relations
  players       Player[]
  rounds        GameRound[]
  gameEvents    GameEvent[]
  userGameHistory UserGameHistory[]
  
  // Index de performance étendus pour i18n et auth
  @@index([pin]) // Recherche par PIN
  @@index([status, lastActivity]) // Nettoyage des parties inactives
  @@index([createdAt]) // Analytics temporelles
  @@index([status, createdAt]) // Parties actives récentes
  @@index([locale, status]) // Parties par langue
  @@index([locale, createdAt]) // Analytics multilingues
  @@index([creatorUserId, createdAt]) // Parties par créateur utilisateur
  
  @@map("games")
}

model Player {
  id               String    @id @default(cuid())
  username         String    @db.VarChar(50)
  points           Int       @default(0)
  position         Int?      // Position dans le classement
  isCreator        Boolean   @default(false)
  isActive         Boolean   @default(true)
  
  // *** NOUVEAUTÉ AUTH: Support modes invité et connecté ***
  userId           String?   // null pour invités, rempli pour utilisateurs connectés
  isGuest          Boolean   @default(true) // true pour invités, false pour users connectés
  guestSessionData Json?     // Données temporaires pour conversion invité → user
  
  // *** NOUVEAUTÉ i18n: Préférences linguistiques ***
  preferredLocale  String    @default("fr") @db.VarChar(2) // Langue préférée interface
  
  // Connexion et session
  connectionId     String?   @db.VarChar(50) // Socket.io ID
  sessionId        String?   @db.VarChar(100)
  lastSeen         DateTime  @default(now())
  connectionStatus ConnectionStatus @default(CONNECTED)
  
  // Métadonnées de reconnexion
  disconnectedAt   DateTime?
  reconnectionAttempts Int   @default(0) @db.SmallInt
  
  // Statistiques de performance
  totalAnswerTime  Int       @default(0) // En millisecondes
  averageAnswerTime Float?   // Calculé automatiquement
  
  // Relations
  gameId           String
  game             Game      @relation(fields: [gameId], references: [id], onDelete: Cascade)
  user             User?     @relation("UserPlayers", fields: [userId], references: [id])
  answers          Answer[]
  gameEvents       GameEvent[]
  
  // Index de performance étendus pour i18n et auth
  @@index([gameId, isActive]) // Joueurs actifs par partie
  @@index([gameId, connectionStatus]) // État des connexions
  @@index([connectionId]) // Recherche par socket ID
  @@index([preferredLocale]) // Statistiques par langue préférée
  @@index([userId, gameId]) // Parties par utilisateur connecté
  @@index([isGuest, gameId]) // Filtrage invités/connectés
  @@unique([gameId, username]) // Unicité pseudo par partie
  
  @@map("players")
}

// *** NOUVEAUTÉ: Architecture multilingue pour questions ***
model Question {
  id            Int       @id @default(autoincrement())
  sourceId      Int?      // Référence à la question source (null pour questions sources)
  locale        String    @db.VarChar(2) // Code langue (fr, en, es, it, pt, de)
  roundType     RoundType
  text          String    @db.Text
  options       Json?     // Array options ou null pour rounds 3-4 (noms joueurs)
  category      String    @db.VarChar(100) // Catégorie thématique
  
  // Métadonnées de contenu
  difficulty    Difficulty @default(MEDIUM)
  tags          String[]  // Pour catégorisation
  isActive      Boolean   @default(true)
  
  // *** Métadonnées spécifiques traduction ***
  translationStatus TranslationStatus @default(VALIDATED) // Pour questions sources
  translatedBy      String?   @db.VarChar(100) // Email traducteur
  validatedBy       String?   @db.VarChar(100) // Email validateur
  translationNotes  String?   @db.Text // Notes pour traducteurs
  culturalContext   String?   @db.Text // Adaptations culturelles
  
  // Statistiques d'usage multilingues
  timesUsed         Int     @default(0)
  averageResponseTime Float?
  popularityScore   Float   @default(0.0)
  
  // Audit trail
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  createdBy     String?   @db.VarChar(50) // Admin qui a créé
  
  // Relations étendues pour traductions
  sourceQuestion Question? @relation("QuestionTranslations", fields: [sourceId], references: [id])
  translations   Question[] @relation("QuestionTranslations")
  gameRounds     GameRound[]
  auditLog       TranslationAudit[] @relation("QuestionAudit")
  
  // Index de performance optimisés pour multilingue
  @@index([locale, roundType, isActive]) // Questions par langue et round
  @@index([sourceId, locale]) // Traductions d'une question source
  @@index([locale, translationStatus]) // État traductions par langue  
  @@index([popularityScore, locale]) // Questions populaires par langue
  @@index([timesUsed, locale]) // Usage par langue
  @@index([isActive, roundType, locale, id]) // Sélection aléatoire multilingue
  @@index([category, locale]) // Questions par catégorie et langue
  
  // Contraintes d'intégrité multilingue
  @@unique([sourceId, locale]) // Une seule traduction par langue
  
  @@map("questions")
}

// *** NOUVEAUTÉ: Table de métadonnées des langues supportées ***
model SupportedLocale {
  code          String    @id @db.VarChar(2) // fr, en, es, it, pt, de
  name          String    @db.VarChar(50)    // "Français", "English"
  nativeName    String    @db.VarChar(50)    // Nom dans la langue native
  flag          String    @db.VarChar(10)    // Emoji drapeau
  isDefault     Boolean   @default(false)    // Langue par défaut
  isActive      Boolean   @default(true)     // Langue activée
  completeness  Float     @default(0.0)      // % traductions complètes
  
  // Métadonnées culturelles
  dateFormat    String    @default("DD/MM/YYYY") @db.VarChar(20)
  timeFormat    String    @default("HH:mm") @db.VarChar(10)
  numberFormat  String    @default("fr-FR") @db.VarChar(10)
  
  // Statistiques
  gamesCount    Int       @default(0) // Nombre parties dans cette langue
  playersCount  Int       @default(0) // Joueurs avec cette préférence
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@map("supported_locales")
}

// *** NOUVEAUTÉ: Audit des traductions ***
model TranslationAudit {
  id            String    @id @default(cuid())
  questionId    Int
  locale        String    @db.VarChar(2)
  action        String    @db.VarChar(20) // CREATE, UPDATE, VALIDATE, REJECT
  
  // Détails de l'action
  oldValue      Json?     // Ancienne valeur
  newValue      Json?     // Nouvelle valeur
  reason        String?   @db.Text // Raison du changement
  
  // Métadonnées d'audit
  performedBy   String    @db.VarChar(100) // Email utilisateur
  performedAt   DateTime  @default(now())
  ipAddress     String?   @db.VarChar(45) // IPv4/IPv6
  userAgent     String?   @db.Text
  
  // Relations
  question      Question  @relation("QuestionAudit", fields: [questionId], references: [id], onDelete: Cascade)
  
  // Index pour recherche audit
  @@index([questionId, locale]) // Audit par question/langue
  @@index([performedBy, performedAt]) // Actions par utilisateur
  @@index([action, performedAt]) // Actions par type
  
  @@map("translation_audit")
}

model GameRound {
  id            String    @id @default(cuid())
  roundNumber   Int       @db.SmallInt
  turnNumber    Int       @default(0) @db.SmallInt
  status        RoundStatus @default(PENDING)
  
  // Joueur en cours et ordre
  currentPlayerId String?
  playerOrder   String[]  // Array des IDs dans l'ordre
  
  // Timer et timing
  startedAt     DateTime?
  answerDeadline DateTime?
  guessDeadline DateTime?
  
  // Métadonnées de performance
  totalPlayers  Int       @db.SmallInt
  playersAnswered Int     @default(0) @db.SmallInt
  
  // Relations
  gameId        String
  game          Game      @relation(fields: [gameId], references: [id], onDelete: Cascade)
  questionId    Int
  question      Question  @relation(fields: [questionId], references: [id])
  answers       Answer[]
  
  // Index de performance
  @@index([gameId, roundNumber]) // Recherche rounds par partie
  @@index([status]) // Rounds par statut
  @@index([gameId, status]) // Rounds actifs par partie
  @@unique([gameId, roundNumber]) // Unicité round par partie
  
  @@map("game_rounds")
}

model Answer {
  id            String    @id @default(cuid())
  value         String    @db.VarChar(200)
  answerType    AnswerType
  isCorrect     Boolean?
  
  // Timing et performance
  answeredAt    DateTime  @default(now())
  responseTime  Int?      // Temps de réponse en ms
  
  // Métadonnées de validation
  wasGuessed    Boolean   @default(false)
  confidence    Float?    // Niveau de confiance (0-1)
  
  // Relations
  playerId      String
  player        Player    @relation(fields: [playerId], references: [id], onDelete: Cascade)
  roundId       String
  round         GameRound @relation(fields: [roundId], references: [id], onDelete: Cascade)
  
  // Index de performance
  @@index([roundId, answerType]) // Réponses par round et type
  @@index([playerId, answeredAt]) // Historique joueur
  @@index([roundId, isCorrect]) // Bonnes/mauvaises réponses
  @@unique([playerId, roundId, answerType]) // Une réponse par joueur/round/type
  
  @@map("answers")
}

// Nouveau: Audit trail et événements
model GameEvent {
  id          String    @id @default(cuid())
  eventType   EventType
  data        Json      // Payload flexible
  timestamp   DateTime  @default(now())
  
  // Relations optionnelles
  gameId      String?
  game        Game?     @relation(fields: [gameId], references: [id], onDelete: Cascade)
  playerId    String?
  player      Player?   @relation(fields: [playerId], references: [id], onDelete: Cascade)
  
  // Index pour analytics et debugging
  @@index([gameId, timestamp]) // Événements par partie chronologiques
  @@index([eventType, timestamp]) // Événements par type
  @@index([playerId, timestamp]) // Actions joueur
  
  @@map("game_events")
}

// Session et cache pour reconnexions
model PlayerSession {
  id          String    @id @default(cuid())
  playerId    String    @unique
  gameState   Json      // État sauvegardé pour reconnexion
  expiresAt   DateTime
  createdAt   DateTime  @default(now())
  
  @@index([expiresAt]) // Nettoyage automatique
  @@map("player_sessions")
}

// *** NOUVEAUTÉ AUTH: Modèles d'authentification utilisateur ***

// Modèle utilisateur principal
model User {
  id              String    @id @default(cuid())
  email           String    @unique @db.VarChar(255)
  emailVerified   DateTime? // null = non vérifié
  hashedPassword  String?   @db.VarChar(255) // null pour comptes OAuth uniquement
  
  // Informations de base
  username        String?   @db.VarChar(50) // Peut être différent du pseudo de jeu
  firstName       String?   @db.VarChar(100)
  lastName        String?   @db.VarChar(100)
  avatarUrl       String?   @db.VarChar(500)
  
  // Préférences utilisateur
  preferredLocale String    @default("fr") @db.VarChar(2)
  timezone        String    @default("Europe/Paris") @db.VarChar(50)
  
  // Statut du compte
  isActive        Boolean   @default(true)
  isEmailVerified Boolean   @default(false)
  emailVerificationToken String? @unique @db.VarChar(100)
  
  // Reset mot de passe
  passwordResetToken String? @unique @db.VarChar(100)
  passwordResetExpiresAt DateTime?
  
  // Métadonnées
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  lastLoginAt     DateTime?
  
  // Relations
  profile         UserProfile?
  oauthAccounts   OAuthAccount[]
  sessions        UserSession[]
  players         Player[]    @relation("UserPlayers")
  createdGames    Game[]      @relation("UserCreatedGames")
  gameHistory     UserGameHistory[]
  statistics      UserStatistics?
  
  // Index de performance
  @@index([email]) // Recherche par email
  @@index([emailVerificationToken]) // Vérification email
  @@index([passwordResetToken]) // Reset password
  @@index([isActive, createdAt]) // Utilisateurs actifs
  @@index([lastLoginAt]) // Analytics connexions
  
  @@map("users")
}

// Profil utilisateur étendu
model UserProfile {
  id              String    @id @default(cuid())
  userId          String    @unique
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Informations personnelles étendues
  displayName     String?   @db.VarChar(100) // Nom d'affichage public
  bio             String?   @db.Text
  website         String?   @db.VarChar(255)
  location        String?   @db.VarChar(100)
  
  // Préférences de jeu
  favoriteRoundType RoundType?
  playStyle       String?   @db.VarChar(50) // "competitive", "casual", "social"
  
  // Confidentialité
  profileVisibility String  @default("public") @db.VarChar(20) // "public", "friends", "private"
  showStatistics  Boolean   @default(true)
  showGameHistory Boolean   @default(true)
  
  // Métadonnées
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  @@map("user_profiles")
}

// Comptes OAuth (Google, Facebook, Apple)
model OAuthAccount {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Informations OAuth
  provider        String    @db.VarChar(50) // "google", "facebook", "apple"
  providerAccountId String  @db.VarChar(255) // ID chez le provider
  
  // Tokens OAuth
  accessToken     String?   @db.Text
  refreshToken    String?   @db.Text
  expiresAt       DateTime?
  tokenType       String?   @db.VarChar(50)
  scope           String?   @db.Text
  
  // Métadonnées du provider
  providerData    Json?     // Données supplémentaires du provider
  
  // Audit
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  lastUsedAt      DateTime?
  
  // Contraintes
  @@unique([provider, providerAccountId])
  @@index([userId, provider])
  
  @@map("oauth_accounts")
}

// Sessions utilisateur persistantes
model UserSession {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Token de session
  sessionToken    String    @unique @db.VarChar(255)
  refreshToken    String?   @unique @db.VarChar(255)
  
  // Informations de session
  expiresAt       DateTime
  refreshExpiresAt DateTime?
  
  // Métadonnées de connexion
  ipAddress       String?   @db.VarChar(45) // IPv4/IPv6
  userAgent       String?   @db.Text
  device          String?   @db.VarChar(100)
  location        String?   @db.VarChar(100)
  
  // État de la session
  isActive        Boolean   @default(true)
  lastActivityAt  DateTime  @default(now())
  
  // Audit
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  // Index de performance
  @@index([userId, isActive])
  @@index([sessionToken])
  @@index([refreshToken])
  @@index([expiresAt]) // Nettoyage automatique
  
  @@map("user_sessions")
}

// Historique des parties utilisateur
model UserGameHistory {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  gameId          String
  game            Game      @relation(fields: [gameId], references: [id], onDelete: Cascade)
  
  // Résultats de la partie
  finalScore      Int       @default(0)
  finalPosition   Int?      // Position finale dans le classement
  totalPlayers    Int       @db.SmallInt
  
  // Statistiques de performance
  totalAnswerTime Int       @default(0) // Temps total de réponse en ms
  averageAnswerTime Float?
  correctAnswers  Int       @default(0)
  totalAnswers    Int       @default(0)
  
  // Métadonnées de la partie
  gameLocale      String    @db.VarChar(2) // Langue de la partie
  gameDuration    Int?      // Durée en secondes
  wasGameCreator  Boolean   @default(false)
  
  // Données enrichies pour statistiques
  roundsCompleted Int       @default(0) @db.SmallInt
  bestRoundType   RoundType?
  worstRoundType  RoundType?
  
  // Audit
  createdAt       DateTime  @default(now()) // Date de fin de partie
  
  // Index de performance
  @@index([userId, createdAt]) // Historique chronologique par utilisateur
  @@index([gameId])
  @@index([userId, gameLocale]) // Parties par langue
  @@index([userId, finalPosition]) // Classements utilisateur
  
  @@map("user_game_history")
}

// Statistiques agrégées utilisateur (calculées périodiquement)
model UserStatistics {
  id                    String    @id @default(cuid())
  userId                String    @unique
  user                  User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Statistiques générales
  totalGamesPlayed      Int       @default(0)
  totalWins             Int       @default(0)
  totalScore            Int       @default(0)
  averageScore          Float     @default(0)
  averagePosition       Float?
  
  // Statistiques de temps
  totalPlayTime         Int       @default(0) // En secondes
  averageGameDuration   Float?    // En minutes
  fastestAnswer         Int?      // En millisecondes
  averageAnswerTime     Float?    // En millisecondes
  
  // Statistiques par type de round
  personalityRoundWins  Int       @default(0)
  situationsRoundWins   Int       @default(0)
  representationsRoundWins Int    @default(0)
  relationsRoundWins    Int       @default(0)
  
  // Statistiques sociales
  gamesAsCreator        Int       @default(0)
  favoritePlaymates     String[]  // IDs des utilisateurs favoris
  
  // Tendances (sur 30 derniers jours)
  recentGamesCount      Int       @default(0)
  recentAverageScore    Float     @default(0)
  improvementTrend      Float?    // Évolution du score (-1.0 à 1.0)
  
  // Métadonnées
  lastCalculatedAt      DateTime  @default(now())
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  @@map("user_statistics")
}

// Enums étendus avec support multilingue
enum GameStatus {
  WAITING
  IN_PROGRESS
  PAUSED
  FINISHED
  ABANDONED
}

// *** NOUVEAUTÉ: Enum pour statut des traductions ***
enum TranslationStatus {
  PENDING      // En attente de traduction
  TRANSLATED   // Traduit mais non validé
  VALIDATED    // Validé par locuteur natif
  REJECTED     // Rejeté, nécessite correction
}

enum RoundStatus {
  PENDING
  ANSWERING
  GUESSING
  REVEALING
  FINISHED
  SKIPPED
}

enum RoundType {
  PERSONALITY
  SITUATIONS
  REPRESENTATIONS
  RELATIONS
}

enum ConnectionStatus {
  CONNECTED
  DISCONNECTED
  RECONNECTING
  ABANDONED
}

enum AnswerType {
  MAIN_ANSWER    // Réponse du joueur actif
  GUESS          // Devinette des autres
}

enum EventType {
  GAME_CREATED
  PLAYER_JOINED
  PLAYER_LEFT
  PLAYER_DISCONNECTED
  PLAYER_RECONNECTED
  GAME_STARTED
  ROUND_STARTED
  ANSWER_SUBMITTED
  GUESS_SUBMITTED
  ROUND_COMPLETED
  GAME_COMPLETED
  ERROR_OCCURRED
  TIMEOUT_REACHED
}

enum Difficulty {
  EASY
  MEDIUM
  HARD
}
```

#### Scripts d'initialisation et optimisation

```sql
-- Triggers pour mise à jour automatique des statistiques
CREATE OR REPLACE FUNCTION update_question_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE questions 
  SET 
    times_used = times_used + 1,
    popularity_score = popularity_score + 0.1
  WHERE id = NEW.question_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_question_stats
  AFTER INSERT ON game_rounds
  FOR EACH ROW
  EXECUTE FUNCTION update_question_stats();

-- Index partiels pour optimisation
CREATE INDEX CONCURRENTLY idx_games_active 
  ON games (created_at DESC) 
  WHERE status IN ('WAITING', 'IN_PROGRESS');

CREATE INDEX CONCURRENTLY idx_players_online
  ON players (game_id, last_seen DESC)
  WHERE connection_status = 'CONNECTED';

-- Vues matérialisées pour analytics
CREATE MATERIALIZED VIEW game_analytics AS
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as games_created,
  AVG(EXTRACT(EPOCH FROM (ended_at - started_at))/60) as avg_duration_minutes,
  COUNT(*) FILTER (WHERE status = 'FINISHED') as completed_games
FROM games
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour DESC;

-- Refresh automatique toutes les heures
CREATE OR REPLACE FUNCTION refresh_game_analytics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW game_analytics;
END;
$$ LANGUAGE plpgsql;
```

### 5.5 État management - Zustand

#### Pourquoi Zustand?
- **Simplicité**: API minimaliste vs MobX
- **Performance**: Renders optimisés
- **TypeScript**: Inférence de types excellente
- **DevTools**: Support Redux DevTools
- **Taille**: ~8KB vs ~60KB MobX

#### Store proposé
```typescript
interface GameStore {
  // État
  game: Game | null;
  player: Player | null;
  connection: ConnectionStatus;
  
  // Actions synchrones
  setGame: (game: Game) => void;
  setPlayer: (player: Player) => void;
  updatePlayerPoints: (playerId: string, points: number) => void;
  
  // Actions asynchrones
  createGame: (username: string) => Promise<void>;
  joinGame: (pin: string, username: string) => Promise<void>;
  submitAnswer: (answer: string) => Promise<void>;
  
  // WebSocket handlers
  handlePlayerJoined: (player: Player) => void;
  handleRoundStarted: (round: GameRound) => void;
  handleAnswerRevealed: (answers: Answer[]) => void;
}
```

### 5.6 API REST complète avec support multilingue

#### Architecture API avec NestJS et internationalisation

```typescript
// Structure modulaire des contrôleurs API avec détection de langue
@Controller('api/v1')
@UseGuards(ValidationGuard, RateLimitGuard)
@UseInterceptors(LoggingInterceptor, TransformInterceptor, LocaleInterceptor)
export class ApiController {
  constructor(private readonly i18nService: I18nService) {}

  // Base health check avec informations multilingues
  @Get('health')
  @Public()
  getHealth(@Headers('accept-language') acceptLanguage?: string): HealthStatus {
    const locale = this.i18nService.detectLocale(acceptLanguage);
    
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '1.0.0',
      supportedLocales: Object.keys(SUPPORTED_LOCALES),
      detectedLocale: locale
    };
  }

  // *** NOUVEAUTÉ: Informations sur les langues supportées ***
  @Get('locales')
  @Public()
  async getSupportedLocales(): Promise<LocaleInfoResponse> {
    const locales = await this.i18nService.getSupportedLocales();
    
    return {
      success: true,
      data: {
        locales,
        defaultLocale: 'fr',
        completeness: await this.i18nService.getTranslationCompleteness()
      }
    };
  }
}

// *** NOUVEAUTÉ: Intercepteur de détection de langue ***
@Injectable()
export class LocaleInterceptor implements NestInterceptor {
  constructor(private readonly i18nService: I18nService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const acceptLanguage = request.headers['accept-language'];
    
    // Détecter et stocker la langue dans la requête
    request.locale = this.i18nService.detectLocale(acceptLanguage);
    
    return next.handle();
  }
}
```

#### *** NOUVEAUTÉ AUTH: Endpoints d'authentification ***

```typescript
// *** Contrôleur d'authentification principal ***
@Controller('api/v1/auth')
@UseGuards(RateLimitGuard) // Protection contre les attaques par force brute
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService
  ) {}

  // Inscription par email/mot de passe
  @Post('register')
  @UsePipes(new ValidationPipe({ transform: true }))
  async register(@Body() registerDto: RegisterDto, @Req() req: Request): Promise<AuthResponse> {
    const { email, password, firstName, lastName, preferredLocale } = registerDto;
    
    // Vérifier si l'email existe déjà
    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }
    
    // Créer l'utilisateur avec email non vérifié
    const user = await this.authService.register({
      email,
      password,
      firstName,
      lastName,
      preferredLocale,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    // Envoyer l'email de vérification
    await this.emailService.sendVerificationEmail(user.email, user.emailVerificationToken);
    
    return {
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      data: {
        userId: user.id,
        email: user.email,
        emailVerified: false
      }
    };
  }

  // Connexion par email/mot de passe
  @Post('login')
  @UsePipes(new ValidationPipe({ transform: true }))
  async login(@Body() loginDto: LoginDto, @Req() req: Request): Promise<AuthResponse> {
    const { email, password } = loginDto;
    
    const result = await this.authService.login({
      email,
      password,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    return {
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresAt: result.expiresAt
      }
    };
  }

  // Vérification d'email
  @Post('verify-email')
  async verifyEmail(@Body() verifyDto: VerifyEmailDto): Promise<AuthResponse> {
    const { token } = verifyDto;
    
    const user = await this.authService.verifyEmail(token);
    
    return {
      success: true,
      message: 'Email verified successfully',
      data: { userId: user.id, emailVerified: true }
    };
  }

  // Renvoyer l'email de vérification
  @Post('resend-verification')
  async resendVerification(@Body() resendDto: ResendVerificationDto): Promise<AuthResponse> {
    const { email } = resendDto;
    
    await this.authService.resendVerificationEmail(email);
    
    return {
      success: true,
      message: 'Verification email sent'
    };
  }

  // Mot de passe oublié
  @Post('forgot-password')
  async forgotPassword(@Body() forgotDto: ForgotPasswordDto): Promise<AuthResponse> {
    const { email } = forgotDto;
    
    await this.authService.initiatePasswordReset(email);
    
    return {
      success: true,
      message: 'Password reset email sent if email exists'
    };
  }

  // Réinitialiser le mot de passe
  @Post('reset-password')
  async resetPassword(@Body() resetDto: ResetPasswordDto): Promise<AuthResponse> {
    const { token, newPassword } = resetDto;
    
    await this.authService.resetPassword(token, newPassword);
    
    return {
      success: true,
      message: 'Password reset successful'
    };
  }

  // Rafraîchir le token
  @Post('refresh')
  async refresh(@Body() refreshDto: RefreshTokenDto, @Req() req: Request): Promise<AuthResponse> {
    const { refreshToken } = refreshDto;
    
    const result = await this.authService.refreshTokens({
      refreshToken,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    return {
      success: true,
      data: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresAt: result.expiresAt
      }
    };
  }

  // Déconnexion
  @Post('logout')
  @UseGuards(AuthGuard)
  async logout(@Req() req: AuthenticatedRequest): Promise<AuthResponse> {
    await this.authService.logout(req.user.id, req.sessionId);
    
    return {
      success: true,
      message: 'Logout successful'
    };
  }

  // Déconnexion de toutes les sessions
  @Post('logout-all')
  @UseGuards(AuthGuard)
  async logoutAll(@Req() req: AuthenticatedRequest): Promise<AuthResponse> {
    await this.authService.logoutAll(req.user.id);
    
    return {
      success: true,
      message: 'Logged out from all devices'
    };
  }
}

// *** Contrôleur OAuth ***
@Controller('api/v1/auth/oauth')
export class OAuthController {
  constructor(
    private readonly oauthService: OAuthService,
    private readonly authService: AuthService
  ) {}

  // Connexion Google
  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  async googleAuth() {
    // Redirection automatique vers Google
  }

  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  async googleCallback(@Req() req: any): Promise<AuthResponse> {
    const result = await this.oauthService.handleGoogleCallback(req.user);
    
    return {
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        isNewUser: result.isNewUser
      }
    };
  }

  // Connexion Facebook
  @Get('facebook')
  @UseGuards(FacebookOAuthGuard)
  async facebookAuth() {
    // Redirection automatique vers Facebook
  }

  @Get('facebook/callback')
  @UseGuards(FacebookOAuthGuard)
  async facebookCallback(@Req() req: any): Promise<AuthResponse> {
    const result = await this.oauthService.handleFacebookCallback(req.user);
    
    return {
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        isNewUser: result.isNewUser
      }
    };
  }

  // Connexion Apple
  @Post('apple')
  async appleAuth(@Body() appleDto: AppleAuthDto): Promise<AuthResponse> {
    const result = await this.oauthService.handleAppleCallback(appleDto);
    
    return {
      success: true,
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        isNewUser: result.isNewUser
      }
    };
  }
}

// *** Contrôleur de gestion utilisateur ***
@Controller('api/v1/users')
@UseGuards(AuthGuard) // Toutes les routes nécessitent une authentification
export class UsersController {
  constructor(
    private readonly userService: UserService,
    private readonly statisticsService: UserStatisticsService
  ) {}

  // Profil utilisateur actuel
  @Get('me')
  async getCurrentUser(@Req() req: AuthenticatedRequest): Promise<UserResponse> {
    const user = await this.userService.findByIdWithProfile(req.user.id);
    
    return {
      success: true,
      data: user
    };
  }

  // Mettre à jour le profil
  @Put('me')
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateProfile(
    @Req() req: AuthenticatedRequest,
    @Body() updateDto: UpdateProfileDto
  ): Promise<UserResponse> {
    const user = await this.userService.updateProfile(req.user.id, updateDto);
    
    return {
      success: true,
      data: user
    };
  }

  // Changer le mot de passe
  @Put('me/password')
  async changePassword(
    @Req() req: AuthenticatedRequest,
    @Body() changePasswordDto: ChangePasswordDto
  ): Promise<AuthResponse> {
    await this.userService.changePassword(
      req.user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword
    );
    
    return {
      success: true,
      message: 'Password changed successfully'
    };
  }

  // Dashboard - statistiques personnelles
  @Get('me/dashboard')
  async getDashboard(@Req() req: AuthenticatedRequest): Promise<DashboardResponse> {
    const dashboard = await this.statisticsService.getDashboardData(req.user.id);
    
    return {
      success: true,
      data: dashboard
    };
  }

  // Historique des parties
  @Get('me/games')
  async getGameHistory(
    @Req() req: AuthenticatedRequest,
    @Query() paginationDto: PaginationDto
  ): Promise<GameHistoryResponse> {
    const history = await this.userService.getGameHistory(req.user.id, paginationDto);
    
    return {
      success: true,
      data: history
    };
  }

  // Statistiques détaillées
  @Get('me/statistics')
  async getStatistics(@Req() req: AuthenticatedRequest): Promise<StatisticsResponse> {
    const stats = await this.statisticsService.getUserStatistics(req.user.id);
    
    return {
      success: true,
      data: stats
    };
  }

  // Conversion invité → compte utilisateur
  @Post('convert-guest')
  async convertGuestToUser(
    @Body() convertDto: ConvertGuestDto,
    @Req() req: Request
  ): Promise<AuthResponse> {
    const result = await this.authService.convertGuestToUser({
      ...convertDto,
      guestSessionId: req.headers['x-guest-session'] as string,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    return {
      success: true,
      message: 'Guest account converted successfully',
      data: {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        transferredGamesCount: result.transferredGamesCount
      }
    };
  }

  // Sessions actives
  @Get('me/sessions')
  async getSessions(@Req() req: AuthenticatedRequest): Promise<SessionsResponse> {
    const sessions = await this.userService.getActiveSessions(req.user.id);
    
    return {
      success: true,
      data: sessions
    };
  }

  // Révoquer une session
  @Delete('me/sessions/:sessionId')
  async revokeSession(
    @Req() req: AuthenticatedRequest,
    @Param('sessionId') sessionId: string
  ): Promise<AuthResponse> {
    await this.userService.revokeSession(req.user.id, sessionId);
    
    return {
      success: true,
      message: 'Session revoked successfully'
    };
  }

  // Supprimer le compte
  @Delete('me')
  async deleteAccount(@Req() req: AuthenticatedRequest): Promise<AuthResponse> {
    await this.userService.deleteAccount(req.user.id);
    
    return {
      success: true,
      message: 'Account deleted successfully'
    };
  }
}
```

#### Endpoints de gestion des parties

```typescript
@Controller('api/v1/games')
@UseGuards(OptionalAuthGuard) // Support invité ET utilisateur connecté
export class GamesController {
  constructor(
    private readonly gamesService: GamesService,
    private readonly validationService: ValidationService
  ) {}

  // *** MODIFIÉ: Création d'une partie avec support auth mixte ***
  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async createGame(
    @Body() createGameDto: CreateGameDto,
    @Req() req: OptionalAuthRequest // Support invité ET utilisateur connecté
  ): Promise<GameResponse> {
    const game = await this.gamesService.create({
      ...createGameDto,
      creatorId: req.sessionId,
      creatorUserId: req.user?.id || null, // null pour invités, userId pour connectés
      locale: req.locale || createGameDto.locale || 'fr' // Langue imposée par créateur
    });
    
    return {
      success: true,
      data: {
        pin: game.pin,
        gameId: game.id,
        status: game.status,
        maxPlayers: game.maxPlayers,
        locale: game.locale, // Langue de la partie
        createdAt: game.createdAt,
        // Indication si l'utilisateur peut sauvegarder ses stats
        canSaveStats: !!req.user
      }
    };
  }

  // *** MODIFIÉ: Rejoindre une partie avec support auth mixte ***
  @Post(':pin/join')
  @UsePipes(new ValidationPipe({ transform: true }))
  async joinGame(
    @Param('pin') pin: string,
    @Body() joinGameDto: JoinGameDto,
    @Req() req: OptionalAuthRequest // Support invité ET utilisateur connecté
  ): Promise<JoinGameResponse> {
    // Validation du PIN
    await this.validationService.validatePin(pin);
    
    // Validation du pseudo
    await this.validationService.validateUsername(
      pin, 
      joinGameDto.username
    );
    
    const result = await this.gamesService.joinGame({
      pin,
      username: joinGameDto.username,
      sessionId: req.sessionId,
      userId: req.user?.id || null, // null pour invités, userId pour connectés
      isGuest: !req.user // true pour invités, false pour connectés
    });
    
    return {
      success: true,
      data: {
        gameId: result.game.id,
        playerId: result.player.id,
        gameState: result.gameState,
        players: result.game.players,
        playerType: req.user ? 'authenticated' : 'guest', // Indique le type
        canSaveStats: !!req.user // Possibilité de sauvegarder
      }
    };
  }

  // État d'une partie
  @Get(':gameId/state')
  async getGameState(
    @Param('gameId') gameId: string,
    @Req() req: AuthenticatedRequest
  ): Promise<GameStateResponse> {
    const gameState = await this.gamesService.getGameState(
      gameId,
      req.playerId
    );
    
    return {
      success: true,
      data: gameState
    };
  }

  // Quitter une partie
  @Delete(':gameId/leave')
  async leaveGame(
    @Param('gameId') gameId: string,
    @Req() req: AuthenticatedRequest
  ): Promise<BaseResponse> {
    await this.gamesService.leaveGame(gameId, req.playerId);
    
    return {
      success: true,
      message: 'Successfully left the game'
    };
  }

  // Commencer une partie (créateur seulement)
  @Post(':gameId/start')
  @UseGuards(GameCreatorGuard)
  async startGame(
    @Param('gameId') gameId: string,
    @Req() req: OptionalAuthRequest
  ): Promise<BaseResponse> {
    await this.gamesService.startGame(gameId);
    
    return {
      success: true,
      message: 'Game started successfully'
    };
  }

  // *** NOUVEAUTÉ AUTH: Résultats de fin de partie avec proposition conversion ***
  @Get(':gameId/final-results')
  async getFinalResults(
    @Param('gameId') gameId: string,
    @Req() req: OptionalAuthRequest
  ): Promise<FinalResultsResponse> {
    const results = await this.gamesService.getFinalResults(gameId, req.playerId);
    
    // Pour les invités : proposer la conversion + stats temporaires à sauvegarder
    if (!req.user && req.playerId) {
      const guestStats = await this.gamesService.getGuestSessionStats(req.playerId);
      
      return {
        success: true,
        data: {
          ...results,
          // Données spécifiques aux invités
          guestConversionOffer: {
            canConvert: true,
            temporaryStats: guestStats,
            benefits: [
              'Sauvegarde permanente de vos statistiques',
              'Historique complet de vos parties',
              'Dashboard personnel avec métriques détaillées',
              'Classements et évolution de vos performances'
            ]
          }
        }
      };
    }
    
    // Pour les utilisateurs connectés : sauvegarde automatique effectuée
    return {
      success: true,
      data: {
        ...results,
        statsSaved: true,
        message: 'Vos statistiques ont été automatiquement sauvegardées'
      }
    };
  }
}
```

#### *** NOUVEAUTÉ: Endpoints questions multilingues ***

```typescript
@Controller('api/v1/questions')
@UseGuards(SessionGuard)
export class QuestionsController {
  constructor(
    private readonly questionsService: QuestionsService,
    private readonly i18nService: I18nService
  ) {}

  // Questions pour une partie (dans la langue de la partie)
  @Get('game/:gameId')
  async getGameQuestions(
    @Param('gameId') gameId: string,
    @Query('round') round: number,
    @Query('exclude') excludeIds: string = ''
  ): Promise<QuestionsResponse> {
    const game = await this.gamesService.findOne(gameId);
    const excludeList = excludeIds ? excludeIds.split(',').map(Number) : [];
    
    const questions = await this.questionsService.getQuestionsByRound(
      this.mapRoundNumber(round),
      game.locale, // Langue imposée par la partie
      excludeList
    );
    
    return {
      success: true,
      data: {
        questions,
        locale: game.locale,
        fallbackUsed: questions.some(q => q.locale !== game.locale)
      }
    };
  }

  // Traductions d'une question spécifique
  @Get(':sourceId/translations')
  async getQuestionTranslations(
    @Param('sourceId') sourceId: number,
    @Query('includeStatus') includeStatus?: string
  ): Promise<TranslationsResponse> {
    const translations = await this.questionsService.getTranslations(
      sourceId,
      includeStatus?.split(',') as TranslationStatus[]
    );
    
    return {
      success: true,
      data: {
        sourceId,
        translations,
        completeness: this.calculateCompleteness(translations)
      }
    };
  }

  // Questions par langue (pour admin/debug)
  @Get('locale/:locale')
  @UseGuards(AdminGuard)
  async getQuestionsByLocale(
    @Param('locale') locale: SupportedLocale,
    @Query('round') round?: string,
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50
  ): Promise<LocalizedQuestionsResponse> {
    const filters = {
      roundType: round as RoundType,
      translationStatus: status as TranslationStatus,
      locale
    };
    
    const result = await this.questionsService.findByLocale(
      filters,
      { page, limit }
    );
    
    return {
      success: true,
      data: result,
      meta: {
        currentPage: page,
        totalPages: Math.ceil(result.total / limit),
        hasNext: page * limit < result.total
      }
    };
  }

  // Statistiques de traduction par langue
  @Get('stats/translation')
  @UseGuards(AdminGuard)  
  async getTranslationStats(): Promise<TranslationStatsResponse> {
    const stats = await this.questionsService.getTranslationStatistics();
    
    return {
      success: true,
      data: {
        byLocale: stats.byLocale,
        byRound: stats.byRound,
        overall: {
          totalSourceQuestions: stats.totalSources,
          totalTranslations: stats.totalTranslations,
          averageCompleteness: stats.averageCompleteness
        },
        lastUpdated: new Date().toISOString()
      }
    };
  }

  private calculateCompleteness(translations: QuestionTranslation[]): number {
    const supportedLocales = Object.keys(SUPPORTED_LOCALES).length - 1; // -1 pour français
    return (translations.length / supportedLocales) * 100;
  }

  private mapRoundNumber(round: number): RoundType {
    const mapping = {
      1: RoundType.PERSONALITY,
      2: RoundType.SITUATIONS, 
      3: RoundType.REPRESENTATIONS,
      4: RoundType.RELATIONS
    };
    return mapping[round] || RoundType.PERSONALITY;
  }
}
```

#### Endpoints de gameplay

```typescript
@Controller('api/v1/gameplay')
@UseGuards(SessionGuard, GameParticipantGuard)
export class GameplayController {
  constructor(
    private readonly gameplayService: GameplayService,
    private readonly timerService: TimerService
  ) {}

  // Soumettre une réponse (joueur actif)
  @Post('games/:gameId/answer')
  @UseGuards(ActivePlayerGuard)
  async submitAnswer(
    @Param('gameId') gameId: string,
    @Body() answerDto: SubmitAnswerDto,
    @Req() req: AuthenticatedRequest
  ): Promise<AnswerResponse> {
    const result = await this.gameplayService.submitAnswer(
      gameId,
      req.playerId,
      answerDto.answer,
      answerDto.responseTime
    );
    
    // Démarrer le timer pour les devinettes
    await this.timerService.startGuessingTimer(gameId);
    
    return {
      success: true,
      data: {
        answerId: result.id,
        nextPhase: 'guessing',
        timerDuration: 30000
      }
    };
  }

  // Soumettre une devinette
  @Post('games/:gameId/guess')
  @UseGuards(NotActivePlayerGuard)
  async submitGuess(
    @Param('gameId') gameId: string,
    @Body() guessDto: SubmitGuessDto,
    @Req() req: AuthenticatedRequest
  ): Promise<GuessResponse> {
    const result = await this.gameplayService.submitGuess(
      gameId,
      req.playerId,
      guessDto.guess,
      guessDto.responseTime
    );
    
    return {
      success: true,
      data: {
        guessId: result.id,
        isLastGuess: result.isLastGuess,
        nextPhase: result.isLastGuess ? 'revealing' : 'waiting'
      }
    };
  }

  // Passer au tour suivant
  @Post('games/:gameId/next-turn')
  @UseGuards(LastRespondentGuard) // Nouveau: seul le dernier répondant peut continuer
  async nextTurn(
    @Param('gameId') gameId: string,
    @Req() req: AuthenticatedRequest
  ): Promise<NextTurnResponse> {
    const result = await this.gameplayService.advanceToNextTurn(gameId);
    
    return {
      success: true,
      data: {
        isRoundComplete: result.isRoundComplete,
        isGameComplete: result.isGameComplete,
        nextPlayer: result.nextPlayer,
        nextQuestion: result.nextQuestion
      }
    };
  }

  // Résultats du tour en cours
  @Get('games/:gameId/results')
  async getTurnResults(
    @Param('gameId') gameId: string,
    @Req() req: AuthenticatedRequest
  ): Promise<TurnResultsResponse> {
    const results = await this.gameplayService.getTurnResults(
      gameId,
      req.playerId
    );
    
    return {
      success: true,
      data: results
    };
  }
}
```

#### Endpoints d'administration

```typescript
@Controller('api/v1/admin')
@UseGuards(AdminGuard)
@UseInterceptors(AdminAuditInterceptor)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly questionsService: QuestionsService,
    private readonly analyticsService: AnalyticsService
  ) {}

  // CRUD Questions
  @Get('questions')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getQuestions(
    @Query() queryDto: GetQuestionsDto
  ): Promise<QuestionsResponse> {
    const { questions, total, page, limit } = await this.questionsService.findMany({
      roundType: queryDto.roundType,
      difficulty: queryDto.difficulty,
      isActive: queryDto.isActive,
      search: queryDto.search,
      page: queryDto.page || 1,
      limit: queryDto.limit || 20
    });
    
    return {
      success: true,
      data: questions,
      meta: { total, page, limit, pages: Math.ceil(total / limit) }
    };
  }

  @Post('questions')
  async createQuestion(
    @Body() createQuestionDto: CreateQuestionDto,
    @Req() req: AuthenticatedRequest
  ): Promise<QuestionResponse> {
    const question = await this.questionsService.create({
      ...createQuestionDto,
      createdBy: req.adminId
    });
    
    return {
      success: true,
      data: question
    };
  }

  @Put('questions/:id')
  async updateQuestion(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateQuestionDto: UpdateQuestionDto,
    @Req() req: AuthenticatedRequest
  ): Promise<QuestionResponse> {
    const question = await this.questionsService.update(id, {
      ...updateQuestionDto,
      updatedBy: req.adminId
    });
    
    return {
      success: true,
      data: question
    };
  }

  @Delete('questions/:id')
  async deleteQuestion(
    @Param('id', ParseIntPipe) id: number
  ): Promise<BaseResponse> {
    await this.questionsService.softDelete(id);
    
    return {
      success: true,
      message: 'Question deleted successfully'
    };
  }

  // Analytics
  @Get('analytics/overview')
  async getAnalyticsOverview(
    @Query() queryDto: AnalyticsQueryDto
  ): Promise<AnalyticsResponse> {
    const analytics = await this.analyticsService.getOverview({
      startDate: queryDto.startDate,
      endDate: queryDto.endDate,
      groupBy: queryDto.groupBy || 'day'
    });
    
    return {
      success: true,
      data: analytics
    };
  }

  // Gestion des parties
  @Get('games/active')
  async getActiveGames(): Promise<ActiveGamesResponse> {
    const games = await this.adminService.getActiveGames();
    
    return {
      success: true,
      data: games
    };
  }

  @Delete('games/:gameId')
  async terminateGame(
    @Param('gameId') gameId: string,
    @Body() terminateDto: TerminateGameDto
  ): Promise<BaseResponse> {
    await this.adminService.terminateGame(gameId, terminateDto.reason);
    
    return {
      success: true,
      message: 'Game terminated successfully'
    };
  }
}
```

#### DTOs et validation

```typescript
// DTOs pour validation automatique
export class CreateGameDto {
  @IsOptional()
  @IsInt()
  @Min(3)
  @Max(7)
  maxPlayers?: number = 7;
  
  @IsOptional()
  @IsObject()
  config?: GameConfig;
}

export class JoinGameDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9\s\u00C0-\u017F]+$/, {
    message: 'Username can only contain letters, numbers and spaces'
  })
  username: string;
}

export class SubmitAnswerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  answer: string;
  
  @IsOptional()
  @IsInt()
  @Min(0)
  responseTime?: number;
}

export class SubmitGuessDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  guess: string;
  
  @IsOptional()
  @IsInt()
  @Min(0)
  responseTime?: number;
}

export class CreateQuestionDto {
  @IsEnum(RoundType)
  roundType: RoundType;
  
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  text: string;
  
  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(4)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  options: string[];
  
  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;
  
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}
```

#### Types de réponse standardisés

```typescript
// Types de réponse API standardisés
export interface BaseResponse {
  success: boolean;
  message?: string;
  timestamp?: string;
}

export interface DataResponse<T> extends BaseResponse {
  data: T;
}

export interface PaginatedResponse<T> extends DataResponse<T[]> {
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ErrorResponse extends BaseResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// Réponses spécifiques
export interface GameResponse extends DataResponse<{
  pin: string;
  gameId: string;
  status: GameStatus;
  maxPlayers: number;
  createdAt: string;
}> {}

export interface JoinGameResponse extends DataResponse<{
  gameId: string;
  playerId: string;
  gameState: GameState;
  players: Player[];
}> {}

export interface GameStateResponse extends DataResponse<GameState> {}

export interface AnswerResponse extends DataResponse<{
  answerId: string;
  nextPhase: string;
  timerDuration: number;
}> {}
```

#### Middleware et Guards

```typescript
// Guards personnalisés pour la sécurité
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private sessionService: SessionService) {}
  
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const sessionId = request.headers['x-session-id'] || request.session?.id;
    
    if (!sessionId) {
      throw new UnauthorizedException('Session required');
    }
    
    const session = await this.sessionService.validate(sessionId);
    if (!session) {
      throw new UnauthorizedException('Invalid session');
    }
    
    request.sessionId = sessionId;
    request.playerId = session.playerId;
    
    return true;
  }
}

@Injectable()
export class GameParticipantGuard implements CanActivate {
  constructor(private gamesService: GamesService) {}
  
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const gameId = request.params.gameId;
    const playerId = request.playerId;
    
    const isParticipant = await this.gamesService.isPlayerInGame(
      gameId, 
      playerId
    );
    
    if (!isParticipant) {
      throw new ForbiddenException('Not a participant in this game');
    }
    
    return true;
  }
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(private redis: Redis) {}
  
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const key = `rate_limit:${request.ip}:${request.route.path}`;
    
    const current = await this.redis.incr(key);
    if (current === 1) {
      await this.redis.expire(key, 60); // 1 minute window
    }
    
    if (current > 30) { // 30 requests per minute
      throw new TooManyRequestsException('Rate limit exceeded');
    }
    
    return true;
  }
}
```

### 5.7 Architecture de sécurité renforcée

#### Stratégie de sécurité multi-niveaux

##### *** NOUVEAUTÉ AUTH: Sécurité OAuth et authentification ***

###### Configuration OAuth sécurisée
```typescript
// Configuration OAuth avec bonnes pratiques de sécurité
@Injectable()
export class OAuthSecurityConfig {
  // Configuration Google OAuth
  static readonly GOOGLE_CONFIG = {
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    scope: ['email', 'profile'], // Permissions minimales requises
    // Protection CSRF avec state parameter
    passReqToCallback: true,
    // Validation du domaine autorisé
    hostedDomains: [], // Vide = tous domaines
  };

  // Validation sécurisée des tokens OAuth
  async validateOAuthToken(provider: string, token: string): Promise<OAuthProfile> {
    switch (provider) {
      case 'google':
        return this.validateGoogleToken(token);
      case 'facebook':
        return this.validateFacebookToken(token);
      case 'apple':
        return this.validateAppleToken(token);
      default:
        throw new UnauthorizedException('Unsupported OAuth provider');
    }
  }

  private async validateGoogleToken(token: string): Promise<OAuthProfile> {
    try {
      // Vérification avec les serveurs Google
      const response = await this.httpService.get(
        `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`
      ).toPromise();

      const { email, verified_email, name, picture } = response.data;
      
      // Validation email vérifié
      if (!verified_email) {
        throw new UnauthorizedException('Email not verified by OAuth provider');
      }

      return { email, name, picture, provider: 'google' };
    } catch (error) {
      throw new UnauthorizedException('Invalid OAuth token');
    }
  }
}
```

###### Sécurisation des sessions utilisateur
```typescript
// Gestion sécurisée des sessions JWT
@Injectable()
export class JWTSecurityService {
  constructor(
    private jwtService: JwtService,
    private redisService: RedisService,
    private configService: ConfigService
  ) {}

  // Génération sécurisée des tokens avec refresh rotation
  async generateSecureTokenPair(user: User): Promise<TokenPair> {
    const payload = {
      sub: user.id,
      email: user.email,
      type: 'access',
      iat: Math.floor(Date.now() / 1000)
    };

    // Access token court (15 minutes)
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      algorithm: 'HS256'
    });

    // Refresh token long (7 jours) avec rotation
    const refreshPayload = { ...payload, type: 'refresh' };
    const refreshToken = this.jwtService.sign(refreshPayload, {
      expiresIn: '7d',
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      algorithm: 'HS256'
    });

    // Stockage sécurisé du refresh token
    await this.storeRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      tokenType: 'Bearer'
    };
  }

  // Protection contre le vol de tokens
  async validateTokenSecurity(token: string, request: Request): Promise<boolean> {
    try {
      const payload = this.jwtService.verify(token);
      
      // Vérifier que le token n'est pas révoqué
      const isRevoked = await this.redisService.get(`revoked:${token}`);
      if (isRevoked) {
        throw new UnauthorizedException('Token has been revoked');
      }

      // Vérifier la cohérence IP (optionnel pour UX)
      const storedIP = await this.redisService.get(`session:${payload.sub}:ip`);
      const currentIP = request.ip;
      
      if (storedIP && storedIP !== currentIP) {
        // Log sécurité sans bloquer (UX mobile)
        this.auditService.logSuspiciousActivity({
          userId: payload.sub,
          event: 'IP_CHANGE',
          oldIP: storedIP,
          newIP: currentIP,
          timestamp: new Date()
        });
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  // Révocation sécurisée des tokens
  async revokeAllUserTokens(userId: string): Promise<void> {
    // Ajouter tous les tokens actifs à la blacklist
    const sessions = await this.prisma.userSession.findMany({
      where: { userId, isActive: true }
    });

    const revokePromises = sessions.map(session => 
      this.redisService.set(
        `revoked:${session.sessionToken}`,
        'true',
        'EX',
        7 * 24 * 60 * 60 // 7 jours
      )
    );

    await Promise.all(revokePromises);

    // Marquer les sessions comme inactives
    await this.prisma.userSession.updateMany({
      where: { userId },
      data: { isActive: false }
    });
  }
}
```

###### Protection CSRF et CORS
```typescript
// Configuration sécurisée CORS et CSRF
@Injectable()
export class WebSecurityConfig {
  // Configuration CORS restrictive
  static readonly CORS_CONFIG = {
    origin: (origin: string, callback: Function) => {
      const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [
        'http://localhost:3000',
        'https://percept.app'
      ];
      
      // Permettre les requêtes sans origine (mobile apps)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Nécessaire pour les cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Guest-Session']
  };

  // Middleware de protection CSRF
  static csrfProtection = csurf({
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    },
    // Ignorer CSRF pour les endpoints OAuth (gérés différemment)
    ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
    skip: (req) => {
      return req.path.startsWith('/api/v1/auth/oauth');
    }
  });
}
```

###### Audit et monitoring de sécurité avancé
```typescript
// Service d'audit spécialisé pour l'authentification
@Injectable()
export class AuthSecurityAuditService {
  private readonly logger = new Logger(AuthSecurityAuditService.name);

  // Logging des événements d'authentification
  async logAuthEvent(event: AuthEventType, data: AuthEventData): Promise<void> {
    const auditEntry = {
      event,
      userId: data.userId,
      email: data.email,
      ip: data.ip,
      userAgent: data.userAgent,
      success: data.success,
      provider: data.provider, // OAuth provider
      timestamp: new Date(),
      riskScore: this.calculateAuthRiskScore(data)
    };

    // Stockage en base pour compliance
    await this.prisma.authAuditLog.create({ data: auditEntry });

    // Alertes temps réel pour événements à risque
    if (auditEntry.riskScore > 70) {
      await this.triggerSecurityAlert(auditEntry);
    }

    this.logger.log(`Auth event: ${event}`, auditEntry);
  }

  // Calcul du score de risque d'authentification
  private calculateAuthRiskScore(data: AuthEventData): number {
    let score = 0;

    // Tentatives de connexion échouées
    if (!data.success) score += 30;

    // Nouvelle IP pour cet utilisateur
    if (data.isNewIP) score += 20;

    // Tentatives multiples rapides
    if (data.recentAttempts > 3) score += 25;

    // Connexion depuis un pays inhabituel
    if (data.isUnusualLocation) score += 35;

    // User-Agent suspect
    if (data.isSuspiciousUserAgent) score += 15;

    return Math.min(score, 100);
  }

  // Détection de patterns suspects
  async detectSuspiciousAuthPatterns(userId: string): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = [];
    const timeWindow = 24 * 60 * 60 * 1000; // 24h
    const now = new Date();
    const since = new Date(now.getTime() - timeWindow);

    // Récupérer les événements récents
    const recentEvents = await this.prisma.authAuditLog.findMany({
      where: {
        userId,
        timestamp: { gte: since }
      }
    });

    // Pattern 1: Trop de tentatives échouées
    const failedAttempts = recentEvents.filter(e => !e.success).length;
    if (failedAttempts > 5) {
      alerts.push({
        type: 'EXCESSIVE_FAILED_LOGINS',
        severity: 'HIGH',
        description: `${failedAttempts} failed login attempts in 24h`
      });
    }

    // Pattern 2: Connexions depuis plusieurs pays
    const uniqueCountries = new Set(recentEvents.map(e => e.country)).size;
    if (uniqueCountries > 2) {
      alerts.push({
        type: 'MULTIPLE_COUNTRIES',
        severity: 'MEDIUM',
        description: `Login attempts from ${uniqueCountries} different countries`
      });
    }

    // Pattern 3: Changements fréquents de mot de passe
    const passwordChanges = recentEvents.filter(e => e.event === 'PASSWORD_CHANGE').length;
    if (passwordChanges > 2) {
      alerts.push({
        type: 'FREQUENT_PASSWORD_CHANGES',
        severity: 'MEDIUM',
        description: `${passwordChanges} password changes in 24h`
      });
    }

    return alerts;
  }
}
```

##### 1. Validation et assainissement des inputs

```typescript
// Validation avançée avec Joi et class-validator
@Injectable()
export class ValidationService {
  // Validation PIN avec prévention brute-force
  async validatePin(pin: string, ip: string): Promise<void> {
    // Vérifier format PIN
    if (!/^\d{6}$/.test(pin)) {
      throw new BadRequestException('Invalid PIN format');
    }
    
    // Vérifier tentatives par IP
    const attempts = await this.redis.get(`pin_attempts:${ip}`);
    if (parseInt(attempts || '0') > 5) {
      throw new TooManyRequestsException('Too many PIN attempts');
    }
    
    // Incrémenter compteur
    await this.redis.incr(`pin_attempts:${ip}`);
    await this.redis.expire(`pin_attempts:${ip}`, 300); // 5 minutes
  }
  
  // Validation pseudo avec sanitization
  async validateUsername(pin: string, username: string): Promise<void> {
    // Sanitization
    const sanitized = username.trim().replace(/[^a-zA-Z0-9\s\u00C0-\u017F]/g, '');
    
    if (sanitized.length < 2 || sanitized.length > 50) {
      throw new BadRequestException('Username must be 2-50 characters');
    }
    
    // Vérifier unicité dans la partie
    const exists = await this.gameService.isUsernameInUse(pin, sanitized);
    if (exists) {
      throw new ConflictException('Username already taken');
    }
    
    // Filtre de mots interdits
    const profanityWords = await this.getProfanityList();
    if (profanityWords.some(word => sanitized.toLowerCase().includes(word))) {
      throw new BadRequestException('Username contains inappropriate content');
    }
  }
  
  // Validation réponses avec limites strictes
  validateAnswer(answer: string): string {
    const sanitized = answer.trim().substring(0, 200);
    
    // Empêcher injection de code
    const dangerous = /<script|javascript:|data:|vbscript:/i;
    if (dangerous.test(sanitized)) {
      throw new BadRequestException('Invalid answer content');
    }
    
    return sanitized;
  }
}
```

##### 2. Protection contre les attaques

```typescript
// Protection DDoS et limitation de débit
@Injectable()
export class SecurityService {
  private readonly rateLimiters = new Map<string, any>();
  
  // Rate limiting intelligent par endpoint
  async checkRateLimit(
    ip: string, 
    endpoint: string, 
    customLimit?: { requests: number; window: number }
  ): Promise<void> {
    const limits = {
      'create-game': { requests: 5, window: 300 }, // 5 parties/5min
      'join-game': { requests: 10, window: 60 },   // 10 tentatives/min
      'submit-answer': { requests: 100, window: 60 }, // Normal gameplay
      'default': { requests: 30, window: 60 }
    };
    
    const limit = customLimit || limits[endpoint] || limits.default;
    const key = `rate_limit:${ip}:${endpoint}`;
    
    const current = await this.redis.get(key);
    if (!current) {
      await this.redis.setex(key, limit.window, '1');
      return;
    }
    
    if (parseInt(current) >= limit.requests) {
      // Logger l'attaque potentielle
      this.logger.warn(`Rate limit exceeded for ${ip} on ${endpoint}`);
      throw new TooManyRequestsException(
        `Rate limit exceeded. Try again in ${limit.window} seconds.`
      );
    }
    
    await this.redis.incr(key);
  }
  
  // Détection d'activité suspecte
  async detectSuspiciousActivity(ip: string, patterns: ActivityPattern[]): Promise<void> {
    const suspiciousPatterns = [
      'rapid_game_creation', // Création rapide de parties
      'username_enumeration', // Test de pseudos
      'pin_bruteforce', // Force-brute PIN
      'automated_requests' // Requêtes automatisées
    ];
    
    for (const pattern of patterns) {
      if (suspiciousPatterns.includes(pattern.type)) {
        await this.quarantineIP(ip, pattern.severity);
      }
    }
  }
  
  // Quarantine IP suspecte
  private async quarantineIP(ip: string, severity: 'low' | 'medium' | 'high') {
    const durations = {
      low: 300,    // 5 minutes
      medium: 1800, // 30 minutes
      high: 3600   // 1 heure
    };
    
    await this.redis.setex(`quarantine:${ip}`, durations[severity], severity);
    this.logger.warn(`IP ${ip} quarantined for ${severity} threat`);
  }
}
```

##### 3. Authentification et sessions sécurisées

```typescript
// Gestion de sessions sécurisée
@Injectable()
export class SessionService {
  constructor(
    private readonly redis: Redis,
    private readonly crypto: CryptoService
  ) {}
  
  // Création de session sécurisée
  async createSession(gameId: string, playerId: string, ip: string): Promise<string> {
    const sessionId = this.crypto.generateSecureToken(32);
    const sessionData = {
      gameId,
      playerId,
      ip,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      isValid: true
    };
    
    // Stockage sécurisé avec expiration
    await this.redis.setex(
      `session:${sessionId}`,
      3600, // 1 heure
      JSON.stringify(sessionData)
    );
    
    // Index par joueur pour nettoyage
    await this.redis.sadd(`player_sessions:${playerId}`, sessionId);
    
    return sessionId;
  }
  
  // Validation de session avec rotation
  async validateSession(sessionId: string, ip: string): Promise<SessionData | null> {
    const data = await this.redis.get(`session:${sessionId}`);
    if (!data) return null;
    
    const session: SessionData = JSON.parse(data);
    
    // Vérifier IP (protection contre vol de session)
    if (session.ip !== ip) {
      await this.invalidateSession(sessionId);
      this.logger.warn(`Session hijacking attempt: ${sessionId} from ${ip}`);
      return null;
    }
    
    // Vérifier expiration d'inactivité
    if (Date.now() - session.lastActivity > 1800000) { // 30 min inactivité
      await this.invalidateSession(sessionId);
      return null;
    }
    
    // Mise à jour activité
    session.lastActivity = Date.now();
    await this.redis.setex(
      `session:${sessionId}`,
      3600,
      JSON.stringify(session)
    );
    
    return session;
  }
  
  // Rotation de session (sécurité renforcée)
  async rotateSession(oldSessionId: string): Promise<string> {
    const sessionData = await this.validateSession(oldSessionId, '');
    if (!sessionData) throw new UnauthorizedException();
    
    const newSessionId = await this.createSession(
      sessionData.gameId,
      sessionData.playerId,
      sessionData.ip
    );
    
    await this.invalidateSession(oldSessionId);
    return newSessionId;
  }
}
```

##### 4. Chiffrement et protection des données

```typescript
// Service de chiffrement
@Injectable()
export class CryptoService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyDerivation = 'pbkdf2';
  
  // Chiffrement des données sensibles
  encryptSensitiveData(data: string, password?: string): EncryptedData {
    const key = password ? 
      this.deriveKey(password) : 
      Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
    
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, key);
    cipher.setAAD(Buffer.from('epercept-game', 'utf8'));
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }
  
  // Génération de tokens sécurisés
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
  
  // Hachage sécurisé pour mots de passe admin
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }
  
  // Vérification de mot de passe
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
  
  // Dérivation de clé sécurisée
  private deriveKey(password: string): Buffer {
    const salt = Buffer.from(process.env.KEY_SALT!, 'hex');
    return crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha512');
  }
}
```

##### 5. Audit et logging de sécurité

```typescript
// Service d'audit sécurité
@Injectable()
export class SecurityAuditService {
  private readonly logger = new Logger(SecurityAuditService.name);
  
  // Audit des actions sensibles
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    const auditLog = {
      timestamp: new Date().toISOString(),
      eventType: event.type,
      severity: event.severity,
      ip: event.ip,
      userAgent: event.userAgent,
      sessionId: event.sessionId,
      details: event.details,
      risk_score: this.calculateRiskScore(event)
    };
    
    // Log structuré pour analyse
    this.logger.warn('SECURITY_EVENT', auditLog);
    
    // Stockage pour investigation
    await this.redis.lpush(
      'security_events',
      JSON.stringify(auditLog)
    );
    
    // Alerte si événement critique
    if (event.severity === 'critical') {
      await this.triggerSecurityAlert(auditLog);
    }
  }
  
  // Calcul de score de risque
  private calculateRiskScore(event: SecurityEvent): number {
    let score = 0;
    
    // Facteurs de risque
    const riskFactors = {
      'multiple_failed_attempts': 30,
      'suspicious_ip': 50,
      'rate_limit_exceeded': 40,
      'invalid_session': 60,
      'brute_force_detected': 80,
      'injection_attempt': 90
    };
    
    if (event.details.factors) {
      event.details.factors.forEach((factor: string) => {
        score += riskFactors[factor] || 10;
      });
    }
    
    return Math.min(score, 100);
  }
  
  // Alertes de sécurité
  private async triggerSecurityAlert(auditLog: any): Promise<void> {
    // Notification admin (email, Slack, etc.)
    await this.notificationService.sendSecurityAlert(auditLog);
    
    // Auto-réponse si nécessaire
    if (auditLog.risk_score > 80) {
      await this.initiateEmergencyResponse(auditLog);
    }
  }
}
```

##### 6. Protection OWASP Top 10

```typescript
// Middleware de sécurité global
@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    // 1. Protection XSS
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // 2. CSP (Content Security Policy)
    res.setHeader('Content-Security-Policy', 
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline'; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' data:; " +
      "connect-src 'self' wss: ws:;"
    );
    
    // 3. HSTS
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 
        'max-age=31536000; includeSubDomains');
    }
    
    // 4. Protection clickjacking
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    
    // 5. Masquage de la technologie
    res.removeHeader('X-Powered-By');
    res.setHeader('Server', 'Epercept');
    
    next();
  }
}

// Configuration Helmet.js complète
export const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "wss:", "ws:"],
      imgSrc: ["'self'", "data:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false // Pour compatibilité WebSocket
};
```

### 5.8 Infrastructure et déploiement

#### Services recommandés

**Frontend (Vercel)**
- Déploiement automatique depuis GitHub
- Edge Functions pour API routes
- Analytics intégrés
- SSL automatique
- **Coût**: Gratuit pour commencer, $20/mois Pro

**Backend (Railway)**
- PostgreSQL + Redis inclus
- Déploiement depuis GitHub
- Logs et métriques
- Scaling automatique
- **Coût**: ~$5-10/mois pour commencer

**Alternatives économiques**
- **Fly.io**: $0-5/mois, excellent pour WebSockets
- **Render**: Free tier généreux, wake up lent
- **Supabase**: PostgreSQL + Realtime gratuit

#### Configuration CI/CD
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run lint
      - run: npm run type-check

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: vercel/action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: railwayapp/deploy-action@v1
        with:
          service: api
          token: ${{ secrets.RAILWAY_TOKEN }}
```

## 6. Nouvelles règles de jeu et logique métier

### 5.1 Flow de jeu

#### Suppression du maître de jeu
- **Ancien système** : Le créateur doit cliquer "Continuer" à chaque étape
- **Nouveau système** : Auto-progression basée sur le dernier répondant
- **Logique** : Celui qui répond en dernier déclenche automatiquement la suite
- **Avantage** : Plus de blocage si le créateur est absent

#### Timer automatique (30 secondes)
```typescript
// Système de timer intelligent
interface GameTimer {
  phase: 'answering' | 'guessing';
  duration: 30000; // 30s en ms
  startTrigger: 'first_answer_submitted' | 'round_start';
  autoAdvance: boolean;
  
  // Gestion des retardataires
  onTimeout: () => {
    // Passage automatique à la phase suivante
    // Les joueurs n'ayant pas répondu sont marqués comme "pas de réponse"
  };
}
```

#### Continuité inter-parties
- **Session persistante** : Garder les scores cumulés entre parties
- **Historique questions** : Éviter les répétitions dans la même session
- **Statistiques** : Qui gagne le plus, questions préférées, etc.

#### Gestion robuste des déconnexions
```typescript
// Système de reconnexion
interface PlayerConnection {
  playerId: string;
  socketId: string;
  lastSeen: number;
  reconnectionAttempts: number;
  
  // États de récupération
  canReconnect: boolean;
  gameStateSnapshot: GameState;
  
  // Auto-nettoyage
  maxInactiveTime: 5 * 60 * 1000; // 5 minutes
}

// Quand un joueur se déconnecte :
// 1. Marquer comme "déconnecté" mais garder sa place 2 minutes
// 2. Si reconnexion : restaurer son état exact
// 3. Si pas de reconnexion : continuer sans lui mais ne pas crasher
// 4. Redistribuer ses questions aux autres joueurs
```

### 5.2 Nouvelle logique d'affichage

#### Système de feedback visuel
- **Bonne réponse** : Encadré vert uniquement sur la bonne option
- **Mauvaise réponse** : Encadré rouge uniquement sur la réponse du joueur
- **Plus de confusion** : Fini le vert+rouge simultané
- **Lisibilité** : Contraste optimal sur tous les fonds de round

#### Affichage des résultats enrichi
```typescript
interface EnhancedResults {
  // Question rappelée en haut
  question: string;
  correctAnswer: string;
  
  // Qui a eu juste/faux
  correctGuessers: Player[];
  incorrectGuessers: Player[];
  
  // Points distribués
  pointsAwarded: Array<{
    playerId: string;
    pointsGained: number;
    newTotal: number;
  }>;
  
  // Nouveau classement
  updatedRankings: PlayerRanking[];
}
```

#### Page récap de fin de partie
```typescript
interface GameSummary {
  // Résultats finaux
  finalRankings: PlayerRanking[];
  totalQuestions: number;
  gameDuration: number;
  
  // Statistiques par joueur
  playerStats: Array<{
    playerId: string;
    correctGuesses: number;
    accuracyRate: number;
    averageResponseTime: number;
    favoriteRoundType: string;
  }>;
  
  // Options de continuation
  canContinue: boolean;
  sessionStats: {
    gamesPlayed: number;
    cumulativeScores: PlayerScore[];
  };
}
```

## 7. Stratégie de tests complète

### 6.1 Architecture de tests

#### Pyramide de tests pour Epercept

```
                    /\
                   /  \
                  / E2E \
                 /______\
                /        \
               /Integration\
              /__________\
             /            \
            /    Unit      \
           /______________\

   70% Unit | 20% Integration | 10% E2E
```

#### Configuration de base

```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
    '!src/main.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.test.{ts,tsx}',
    '<rootDir>/test/**/*.test.{ts,tsx}'
  ],
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts']
};
```

### 6.2 Tests unitaires

#### Services métier

```typescript
// test/unit/game.service.test.ts
describe('GameService', () => {
  let gameService: GameService;
  let mockPrisma: jest.Mocked<PrismaService>;
  let mockRedis: jest.Mocked<Redis>;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GameService,
        {
          provide: PrismaService,
          useValue: createMockPrisma()
        },
        {
          provide: 'REDIS_CLIENT',
          useValue: createMockRedis()
        }
      ]
    }).compile();
    
    gameService = module.get(GameService);
    mockPrisma = module.get(PrismaService);
    mockRedis = module.get('REDIS_CLIENT');
  });
  
  describe('createGame', () => {
    it('should create a game with unique PIN', async () => {
      // Arrange
      const createGameDto = { maxPlayers: 5 };
      const expectedGame = {
        id: 'game-1',
        pin: '123456',
        status: GameStatus.WAITING,
        createdAt: new Date()
      };
      
      mockPrisma.game.create.mockResolvedValue(expectedGame as any);
      
      // Act
      const result = await gameService.create(createGameDto, 'creator-id');
      
      // Assert
      expect(result).toEqual(expectedGame);
      expect(mockPrisma.game.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          pin: expect.stringMatching(/^\d{6}$/),
          maxPlayers: 5,
          status: GameStatus.WAITING
        })
      });
    });
    
    it('should retry PIN generation if collision occurs', async () => {
      // Test collision handling
      mockPrisma.game.create
        .mockRejectedValueOnce(new Error('Unique constraint violated'))
        .mockResolvedValueOnce({ id: 'game-1', pin: '654321' } as any);
      
      const result = await gameService.create({}, 'creator-id');
      
      expect(mockPrisma.game.create).toHaveBeenCalledTimes(2);
      expect(result.pin).toMatch(/^\d{6}$/);
    });
  });
  
  describe('joinGame', () => {
    it('should allow player to join existing game', async () => {
      // Arrange
      const pin = '123456';
      const username = 'TestPlayer';
      const existingGame = {
        id: 'game-1',
        pin,
        status: GameStatus.WAITING,
        players: [],
        maxPlayers: 7
      };
      
      mockPrisma.game.findUnique.mockResolvedValue(existingGame as any);
      mockPrisma.player.create.mockResolvedValue({
        id: 'player-1',
        username,
        gameId: 'game-1'
      } as any);
      
      // Act
      const result = await gameService.joinGame(pin, username, 'session-1');
      
      // Assert
      expect(result.player.username).toBe(username);
      expect(mockPrisma.player.create).toHaveBeenCalledWith({
        data: {
          username,
          gameId: 'game-1',
          sessionId: 'session-1'
        }
      });
    });
    
    it('should reject if game is full', async () => {
      // Test game full scenario
      const fullGame = {
        id: 'game-1',
        maxPlayers: 2,
        players: [{ id: 'p1' }, { id: 'p2' }]
      };
      
      mockPrisma.game.findUnique.mockResolvedValue(fullGame as any);
      
      await expect(
        gameService.joinGame('123456', 'NewPlayer', 'session-1')
      ).rejects.toThrow('Game is full');
    });
  });
});
```

#### Contrôleurs API

```typescript
// test/unit/games.controller.test.ts
describe('GamesController', () => {
  let controller: GamesController;
  let gameService: jest.Mocked<GamesService>;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [GamesController],
      providers: [
        {
          provide: GamesService,
          useValue: {
            create: jest.fn(),
            joinGame: jest.fn(),
            getGameState: jest.fn()
          }
        }
      ]
    }).compile();
    
    controller = module.get(GamesController);
    gameService = module.get(GamesService);
  });
  
  describe('createGame', () => {
    it('should create game and return response', async () => {
      // Arrange
      const createDto = { maxPlayers: 5 };
      const mockGame = {
        id: 'game-1',
        pin: '123456',
        status: GameStatus.WAITING,
        createdAt: new Date()
      };
      
      gameService.create.mockResolvedValue(mockGame as any);
      
      const mockRequest = {
        sessionId: 'session-1'
      } as AuthenticatedRequest;
      
      // Act
      const result = await controller.createGame(createDto, mockRequest);
      
      // Assert
      expect(result).toEqual({
        success: true,
        data: {
          pin: '123456',
          gameId: 'game-1',
          status: GameStatus.WAITING,
          maxPlayers: 7,
          createdAt: mockGame.createdAt
        }
      });
    });
  });
});
```

#### *** NOUVEAUTÉ: Tests spécifiques internationalisation ***

```typescript
// test/unit/i18n.service.test.ts
describe('I18nService', () => {
  let i18nService: I18nService;
  let mockPrisma: jest.Mocked<PrismaService>;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        I18nService,
        {
          provide: PrismaService,
          useValue: createMockPrisma()
        }
      ]
    }).compile();
    
    i18nService = module.get(I18nService);
    mockPrisma = module.get(PrismaService);
  });
  
  describe('detectLocale', () => {
    it('should detect French from Accept-Language header', () => {
      const acceptLanguage = 'fr-FR,fr;q=0.9,en;q=0.8';
      const result = i18nService.detectLocale(acceptLanguage);
      expect(result).toBe('fr');
    });
    
    it('should detect English as fallback', () => {
      const acceptLanguage = 'en-US,en;q=0.9';
      const result = i18nService.detectLocale(acceptLanguage);
      expect(result).toBe('en');
    });
    
    it('should fallback to French for unsupported languages', () => {
      const acceptLanguage = 'zh-CN,zh;q=0.9';
      const result = i18nService.detectLocale(acceptLanguage);
      expect(result).toBe('fr');
    });
  });
  
  describe('getSupportedLocales', () => {
    it('should return all supported locales with metadata', async () => {
      const mockLocales = [
        { code: 'fr', name: 'Français', completeness: 100 },
        { code: 'en', name: 'English', completeness: 0 }
      ];
      
      mockPrisma.supportedLocale.findMany.mockResolvedValue(mockLocales as any);
      
      const result = await i18nService.getSupportedLocales();
      
      expect(result).toEqual(mockLocales);
      expect(mockPrisma.supportedLocale.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        orderBy: { completeness: 'desc' }
      });
    });
  });
});

// test/unit/questions.service.test.ts  
describe('QuestionsService - Multilingual', () => {
  let questionsService: QuestionsService;
  let mockPrisma: jest.Mocked<PrismaService>;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        QuestionsService,
        {
          provide: PrismaService,
          useValue: createMockPrisma()
        }
      ]
    }).compile();
    
    questionsService = module.get(QuestionsService);
    mockPrisma = module.get(PrismaService);
  });
  
  describe('getQuestionsByRound', () => {
    it('should return questions in requested language', async () => {
      const mockQuestions = [
        {
          sourceId: 1,
          locale: 'en',
          text: 'Your true friends, you count them...',
          options: ['On one hand', 'On both hands']
        }
      ];
      
      mockPrisma.question.findMany.mockResolvedValue(mockQuestions as any);
      
      const result = await questionsService.getQuestionsByRound(
        RoundType.PERSONALITY,
        'en',
        []
      );
      
      expect(result).toEqual(mockQuestions);
      expect(mockPrisma.question.findMany).toHaveBeenCalledWith({
        where: {
          roundType: RoundType.PERSONALITY,
          locale: 'en',
          isActive: true,
          sourceId: { notIn: [] }
        },
        select: expect.any(Object)
      });
    });
    
    it('should fallback to French when translation incomplete', async () => {
      // Première requête: questions en anglais (insuffisantes)
      mockPrisma.question.findMany
        .mockResolvedValueOnce([]) // Aucune question en anglais
        .mockResolvedValueOnce([ // Questions en français (fallback)
          {
            sourceId: 1,
            locale: 'fr',
            text: 'Tes vrais amis, tu les comptes...',
            options: ['Sur une main', 'Sur les deux mains']
          }
        ] as any);
      
      const result = await questionsService.getQuestionsByRound(
        RoundType.PERSONALITY,
        'en',
        []
      );
      
      expect(result).toHaveLength(1);
      expect(result[0].locale).toBe('fr');
      expect(mockPrisma.question.findMany).toHaveBeenCalledTimes(2);
    });
  });
  
  describe('getTranslations', () => {
    it('should return all translations for a source question', async () => {
      const mockTranslations = [
        { sourceId: 1, locale: 'en', text: 'English text', translationStatus: 'VALIDATED' },
        { sourceId: 1, locale: 'es', text: 'Texto español', translationStatus: 'PENDING' }
      ];
      
      mockPrisma.question.findMany.mockResolvedValue(mockTranslations as any);
      
      const result = await questionsService.getTranslations(1);
      
      expect(result).toEqual(mockTranslations);
      expect(mockPrisma.question.findMany).toHaveBeenCalledWith({
        where: {
          sourceId: 1,
          locale: { not: 'fr' } // Exclure la version source française
        }
      });
    });
  });
  
  describe('getTranslationStatistics', () => {
    it('should calculate translation completeness by locale', async () => {
      const mockStats = [
        { locale: 'en', total: 50, validated: 30 },
        { locale: 'es', total: 20, validated: 15 }
      ];
      
      // Mock de la requête agrégée Prisma
      mockPrisma.$queryRaw.mockResolvedValue(mockStats);
      
      const result = await questionsService.getTranslationStatistics();
      
      expect(result.byLocale).toHaveProperty('en');
      expect(result.byLocale.en.completeness).toBe(60); // 30/50
      expect(result.averageCompleteness).toBeCloseTo(67.5); // (60+75)/2
    });
  });
});

// test/unit/game.service.test.ts - Extension pour langue
describe('GameService - Multilingual Extensions', () => {
  let gameService: GameService;
  let mockPrisma: jest.Mocked<PrismaService>;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GameService,
        {
          provide: PrismaService,
          useValue: createMockPrisma()
        }
      ]
    }).compile();
    
    gameService = module.get(GameService);
    mockPrisma = module.get(PrismaService);
  });
  
  describe('createGame', () => {
    it('should create game with creator locale', async () => {
      const createGameDto = { maxPlayers: 5, locale: 'es' };
      const expectedGame = {
        id: 'game-1',
        pin: '123456',
        locale: 'es',
        status: GameStatus.WAITING
      };
      
      mockPrisma.game.create.mockResolvedValue(expectedGame as any);
      
      const result = await gameService.create(createGameDto, 'creator-id');
      
      expect(result.locale).toBe('es');
      expect(mockPrisma.game.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ locale: 'es' })
      });
    });
  });
  
  describe('getGameWithQuestions', () => {
    it('should preload questions in game locale', async () => {
      const gameId = 'game-1';
      const mockGame = {
        id: gameId,
        locale: 'en',
        status: GameStatus.IN_PROGRESS
      };
      
      mockPrisma.game.findUnique.mockResolvedValue(mockGame as any);
      
      const result = await gameService.getGameWithQuestions(gameId);
      
      expect(result.locale).toBe('en');
      // Vérifier que les questions sont pré-chargées dans la bonne langue
      expect(mockPrisma.question.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({ locale: 'en' })
      });
    });
  });
});
```

#### *** NOUVEAUTÉ AUTH: Tests d'authentification ***

##### Tests unitaires du service d'authentification
```typescript
// test/unit/auth.service.test.ts
describe('AuthService', () => {
  let authService: AuthService;
  let mockPrisma: jest.Mocked<PrismaService>;
  let mockJwtService: jest.Mocked<JwtService>;
  let mockEmailService: jest.Mocked<EmailService>;
  
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: createMockPrisma() },
        { provide: JwtService, useValue: createMockJwt() },
        { provide: EmailService, useValue: createMockEmail() }
      ]
    }).compile();
    
    authService = module.get(AuthService);
    mockPrisma = module.get(PrismaService);
    mockJwtService = module.get(JwtService);
    mockEmailService = module.get(EmailService);
  });

  describe('register', () => {
    it('should create user with hashed password', async () => {
      // Arrange
      const registerData = {
        email: 'test@example.com',
        password: 'SecurePass123',
        firstName: 'John',
        lastName: 'Doe'
      };
      
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'user-1',
        email: registerData.email,
        hashedPassword: 'hashed-password',
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        emailVerificationToken: 'token-123'
      } as any);

      // Act
      const result = await authService.register(registerData);

      // Assert
      expect(result).toBeDefined();
      expect(result.email).toBe(registerData.email);
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalledWith(
        registerData.email,
        'token-123'
      );
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: registerData.email,
          hashedPassword: expect.any(String),
          profile: { create: expect.any(Object) },
          statistics: { create: {} }
        }),
        include: expect.any(Object)
      });
    });

    it('should throw error if email already exists', async () => {
      // Arrange
      const registerData = { email: 'existing@example.com', password: 'pass' };
      mockPrisma.user.findUnique.mockResolvedValue({ id: 'existing' } as any);

      // Act & Assert
      await expect(authService.register(registerData)).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('should authenticate user with valid credentials', async () => {
      // Arrange
      const loginData = {
        email: 'test@example.com',
        password: 'ValidPass123',
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent'
      };
      
      const mockUser = {
        id: 'user-1',
        email: loginData.email,
        hashedPassword: 'hashed-password',
        isActive: true
      };

      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('mock-token');

      // Act
      const result = await authService.login(loginData);

      // Assert
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { lastLoginAt: expect.any(Date) }
      });
    });

    it('should throw error for invalid credentials', async () => {
      // Arrange
      mockPrisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.login({
        email: 'wrong@example.com',
        password: 'wrong',
        ipAddress: '127.0.0.1',
        userAgent: 'test'
      })).rejects.toThrow('Invalid credentials');
    });
  });

  describe('convertGuestToUser', () => {
    it('should transfer guest data to new user account', async () => {
      // Arrange
      const convertData = {
        email: 'convert@example.com',
        password: 'NewPass123',
        firstName: 'Jane',
        lastName: 'Doe',
        guestSessionId: 'guest-session-123'
      };

      const mockGuestPlayers = [
        {
          id: 'player-1',
          gameId: 'game-1',
          points: 100,
          position: 2,
          answers: [{ isCorrect: true }, { isCorrect: false }],
          game: { locale: 'fr' }
        }
      ];

      mockPrisma.player.findMany.mockResolvedValue(mockGuestPlayers as any);
      mockPrisma.user.create.mockResolvedValue({ id: 'new-user' } as any);
      jest.spyOn(authService, 'register').mockResolvedValue({ id: 'new-user' } as any);

      // Act
      const result = await authService.convertGuestToUser(convertData);

      // Assert
      expect(result).toHaveProperty('transferredGamesCount', 1);
      expect(mockPrisma.player.update).toHaveBeenCalledWith({
        where: { id: 'player-1' },
        data: { userId: 'new-user', isGuest: false }
      });
      expect(mockPrisma.userGameHistory.create).toHaveBeenCalled();
    });
  });
});
```

##### Tests des guards d'authentification
```typescript
// test/unit/auth.guards.test.ts
describe('OptionalAuthGuard', () => {
  let guard: OptionalAuthGuard;
  let mockJwtService: jest.Mocked<JwtService>;
  let mockPrisma: jest.Mocked<PrismaService>;

  beforeEach(() => {
    mockJwtService = { verify: jest.fn() } as any;
    mockPrisma = { user: { findUnique: jest.fn() } } as any;
    guard = new OptionalAuthGuard(mockJwtService, mockPrisma);
  });

  it('should allow access for authenticated users', async () => {
    // Arrange
    const mockRequest = {
      headers: { authorization: 'Bearer valid-token' }
    };
    const mockContext = {
      switchToHttp: () => ({ getRequest: () => mockRequest })
    } as any;

    mockJwtService.verify.mockReturnValue({ sub: 'user-1' });
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'user-1' } as any);

    // Act
    const result = await guard.canActivate(mockContext);

    // Assert
    expect(result).toBe(true);
    expect(mockRequest.user).toBeDefined();
    expect(mockRequest.isAuthenticated).toBe(true);
  });

  it('should allow access for guests without token', async () => {
    // Arrange
    const mockRequest = {
      headers: { 'x-guest-session': 'guest-123' }
    };
    const mockContext = {
      switchToHttp: () => ({ getRequest: () => mockRequest })
    } as any;

    // Act
    const result = await guard.canActivate(mockContext);

    // Assert
    expect(result).toBe(true);
    expect(mockRequest.sessionId).toBe('guest-123');
    expect(mockRequest.isGuest).toBe(true);
  });

  it('should handle invalid tokens gracefully', async () => {
    // Arrange
    const mockRequest = {
      headers: { authorization: 'Bearer invalid-token' }
    };
    const mockContext = {
      switchToHttp: () => ({ getRequest: () => mockRequest })
    } as any;

    mockJwtService.verify.mockImplementation(() => {
      throw new Error('Invalid token');
    });

    // Act
    const result = await guard.canActivate(mockContext);

    // Assert
    expect(result).toBe(true); // Should still allow access in guest mode
    expect(mockRequest.user).toBeUndefined();
  });
});
```

##### Tests OAuth
```typescript
// test/unit/oauth.service.test.ts
describe('OAuthService', () => {
  let oauthService: OAuthService;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockPrisma: jest.Mocked<PrismaService>;
  let mockHttpService: jest.Mocked<HttpService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        OAuthService,
        { provide: AuthService, useValue: createMockAuth() },
        { provide: PrismaService, useValue: createMockPrisma() },
        { provide: HttpService, useValue: createMockHttp() }
      ]
    }).compile();
    
    oauthService = module.get(OAuthService);
    mockAuthService = module.get(AuthService);
    mockPrisma = module.get(PrismaService);
    mockHttpService = module.get(HttpService);
  });

  describe('handleGoogleCallback', () => {
    it('should create new user for first-time Google login', async () => {
      // Arrange
      const googleProfile = {
        email: 'google@example.com',
        name: 'Google User',
        picture: 'https://photo.jpg',
        id: 'google-123'
      };

      mockPrisma.oAuthAccount.findUnique.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 'new-user',
        email: googleProfile.email
      } as any);
      mockAuthService.generateTokens.mockResolvedValue({
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      } as any);

      // Act
      const result = await oauthService.handleGoogleCallback(googleProfile);

      // Assert
      expect(result.isNewUser).toBe(true);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: googleProfile.email,
          isEmailVerified: true,
          oauthAccounts: {
            create: expect.objectContaining({
              provider: 'google',
              providerAccountId: googleProfile.id
            })
          }
        }),
        include: expect.any(Object)
      });
    });

    it('should link OAuth account to existing user', async () => {
      // Arrange
      const googleProfile = { email: 'existing@example.com', id: 'google-123' };
      const existingUser = { id: 'existing-user', email: googleProfile.email };

      mockPrisma.oAuthAccount.findUnique.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(existingUser as any);

      // Act
      const result = await oauthService.handleGoogleCallback(googleProfile);

      // Assert
      expect(result.isNewUser).toBe(false);
      expect(mockPrisma.oAuthAccount.create).toHaveBeenCalledWith({
        data: {
          userId: existingUser.id,
          provider: 'google',
          providerAccountId: googleProfile.id,
          accessToken: expect.any(String)
        }
      });
    });
  });
});
```

### 6.3 Tests d'intégration

#### Tests base de données

```typescript
// test/integration/game.integration.test.ts
describe('Game Integration Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  
  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();
    
    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get(PrismaService);
    
    await app.init();
  });
  
  beforeEach(async () => {
    // Nettoyer la base de test
    await prisma.answer.deleteMany();
    await prisma.gameRound.deleteMany();
    await prisma.player.deleteMany();
    await prisma.game.deleteMany();
  });
  
  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });
  
  describe('Game Flow', () => {
    it('should complete full game workflow', async () => {
      // 1. Créer une partie
      const createResponse = await request(app.getHttpServer())
        .post('/api/v1/games')
        .send({ maxPlayers: 4 })
        .expect(201);
      
      const { pin, gameId } = createResponse.body.data;
      
      // 2. Ajouter des joueurs
      const players = [];
      for (let i = 1; i <= 4; i++) {
        const joinResponse = await request(app.getHttpServer())
          .post(`/api/v1/games/${pin}/join`)
          .send({ username: `Player${i}` })
          .expect(201);
        
        players.push(joinResponse.body.data);
      }
      
      // 3. Démarrer la partie
      await request(app.getHttpServer())
        .post(`/api/v1/games/${gameId}/start`)
        .set('x-session-id', players[0].sessionId)
        .expect(200);
      
      // 4. Vérifier l'état
      const stateResponse = await request(app.getHttpServer())
        .get(`/api/v1/games/${gameId}/state`)
        .set('x-session-id', players[0].sessionId)
        .expect(200);
      
      expect(stateResponse.body.data.status).toBe('IN_PROGRESS');
      expect(stateResponse.body.data.currentRound).toBe(1);
    });
  });
});
```

#### Tests WebSocket

```typescript
// test/integration/websocket.integration.test.ts
describe('WebSocket Integration', () => {
  let app: INestApplication;
  let clients: SocketIOClient.Socket[];
  
  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();
    
    app = moduleFixture.createNestApplication();
    await app.init();
    await app.listen(0);
  });
  
  beforeEach(() => {
    clients = [];
  });
  
  afterEach(() => {
    clients.forEach(client => client.disconnect());
  });
  
  afterAll(async () => {
    await app.close();
  });
  
  it('should handle real-time game events', async () => {
    // Créer des clients WebSocket
    const client1 = SocketIOClient(`http://localhost:${app.getHttpServer().address().port}`);
    const client2 = SocketIOClient(`http://localhost:${app.getHttpServer().address().port}`);
    clients.push(client1, client2);
    
    // Attendre connexion
    await Promise.all([
      new Promise(resolve => client1.on('connect', resolve)),
      new Promise(resolve => client2.on('connect', resolve))
    ]);
    
    // Test du flow temps réel
    const gameEvents: any[] = [];
    
    client1.on('player-joined', (data) => gameEvents.push({ type: 'player-joined', data }));
    client2.on('player-joined', (data) => gameEvents.push({ type: 'player-joined', data }));
    
    // Simuler jointure
    client1.emit('join-game', { pin: '123456', username: 'Player1' });
    client2.emit('join-game', { pin: '123456', username: 'Player2' });
    
    // Attendre les événements
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(gameEvents).toHaveLength(2);
    expect(gameEvents[0].data.username).toBe('Player1');
  });
});
```

### 6.4 Tests End-to-End (E2E)

#### Tests Playwright

```typescript
// test/e2e/game-flow.e2e.test.ts
import { test, expect, Page } from '@playwright/test';

test.describe('Complete Game Flow', () => {
  test('should allow multiple players to complete a full game', async ({ browser }) => {
    // Créer plusieurs pages pour simuler différents joueurs
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const context3 = await browser.newContext();
    
    const player1 = await context1.newPage();
    const player2 = await context2.newPage();
    const player3 = await context3.newPage();
    
    try {
      // Joueur 1 crée une partie
      await player1.goto('/');
      await player1.click('[data-testid="create-game-btn"]');
      await player1.fill('[data-testid="username-input"]', 'Alice');
      await player1.click('[data-testid="start-game-btn"]');
      
      // Récupérer le PIN
      const pinElement = await player1.locator('[data-testid="game-pin"]');
      const pin = await pinElement.textContent();
      
      // Joueurs 2 et 3 rejoignent
      await Promise.all([
        joinGame(player2, pin!, 'Bob'),
        joinGame(player3, pin!, 'Charlie')
      ]);
      
      // Vérifier que tous les joueurs sont dans le lobby
      await expect(player1.locator('[data-testid="player-list"]')).toContainText('Alice');
      await expect(player1.locator('[data-testid="player-list"]')).toContainText('Bob');
      await expect(player1.locator '[data-testid="player-list"]')).toContainText('Charlie');
      
      // Démarrage automatique de la partie
      await expect(player1.locator('[data-testid="game-status"]')).toContainText('Partie en cours');
      
      // Premier tour - Alice répond
      await expect(player1.locator('[data-testid="question-text"]')).toBeVisible();
      await player1.click('[data-testid="answer-option-1"]');
      await player1.click('[data-testid="submit-answer-btn"]');
      
      // Bob et Charlie devinent
      await Promise.all([
        submitGuess(player2, 1),
        submitGuess(player3, 1)
      ]);
      
      // Vérifier résultats
      await expect(player1.locator('[data-testid="results-section"]')).toBeVisible();
      await expect(player1.locator('[data-testid="correct-answer"]')).toBeVisible();
      
      // Continuer jusqu'au bout (test raccourci)
      // En vrai on testerait tous les rounds
      
    } finally {
      await context1.close();
      await context2.close();
      await context3.close();
    }
  });
  
  test('should handle disconnection and reconnection', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Démarrer une partie
    await startGame(page, 'TestPlayer');
    
    // Simuler déconnexion (fermer la page)
    await page.close();
    
    // Recréer la page (simule refresh/reconnexion)
    const newPage = await context.newPage();
    await newPage.goto('/');
    
    // Vérifier que l'état est restauré
    await expect(newPage.locator('[data-testid="reconnection-message"]')).toBeVisible();
    await expect(newPage.locator('[data-testid="game-state"]')).toContainText('En cours');
    
    await context.close();
  });
});

// Helpers
async function joinGame(page: Page, pin: string, username: string) {
  await page.goto('/');
  await page.fill('[data-testid="pin-input"]', pin);
  await page.fill('[data-testid="username-input"]', username);
  await page.click('[data-testid="join-game-btn"]');
}

async function submitGuess(page: Page, optionIndex: number) {
  await page.waitForSelector('[data-testid="guess-options"]');
  await page.click(`[data-testid="guess-option-${optionIndex}"]`);
  await page.click('[data-testid="submit-guess-btn"]');
}
```

##### *** NOUVEAUTÉ AUTH: Tests E2E d'authentification ***

```typescript
// test/e2e/auth.e2e.test.ts
import { test, expect, Browser } from '@playwright/test';

test.describe('Authentication E2E', () => {
  test('should complete full registration and login flow', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      // 1. Aller sur la page d'accueil
      await page.goto('/');
      
      // 2. Cliquer sur "Se connecter"
      await page.click('[data-testid="login-button"]');
      
      // 3. Aller sur l'onglet inscription
      await page.click('[data-testid="register-tab"]');
      
      // 4. Remplir le formulaire d'inscription
      await page.fill('[data-testid="register-firstname"]', 'John');
      await page.fill('[data-testid="register-lastname"]', 'Doe');
      await page.fill('[data-testid="register-email"]', 'john.doe.test@example.com');
      await page.fill('[data-testid="register-password"]', 'SecurePass123');
      await page.fill('[data-testid="register-password-confirm"]', 'SecurePass123');
      
      // 5. Accepter les conditions
      await page.check('[data-testid="register-terms-checkbox"]');
      
      // 6. Soumettre l'inscription
      await page.click('[data-testid="register-submit"]');
      
      // 7. Vérifier le message de confirmation
      await expect(page.locator('[data-testid="registration-success"]'))
        .toContainText('Vérifiez votre email');
      
    } finally {
      await context.close();
    }
  });

  test('should convert guest to user account after game', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      // 1. Jouer une partie en mode invité
      await page.goto('/');
      await page.click('[data-testid="create-game-btn"]');
      await page.fill('[data-testid="username-input"]', 'GuestPlayer');
      
      // Simuler la fin d'une partie avec stats
      await page.evaluate(() => {
        window.localStorage.setItem('guest-session-stats', JSON.stringify({
          gamesPlayed: 1,
          bestScore: 250,
          averagePosition: 2
        }));
      });
      
      // 2. Naviguer vers résultats → modal conversion apparaît
      await page.goto('/game/results?mock=true');
      await expect(page.locator('[data-testid="guest-conversion-modal"]')).toBeVisible();
      
      // 3. Remplir le formulaire de conversion
      await page.fill('[data-testid="conversion-firstname"]', 'Converted');
      await page.fill('[data-testid="conversion-lastname"]', 'User');
      await page.fill('[data-testid="conversion-email"]', 'converted@example.com');
      await page.fill('[data-testid="conversion-password"]', 'NewPassword123');
      await page.check('[data-testid="conversion-terms"]');
      await page.click('[data-testid="conversion-submit"]');
      
      // 4. Vérifier la redirection dashboard avec stats transférées
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('[data-testid="user-welcome"]'))
        .toContainText('Bonjour Converted');
      
    } finally {
      await context.close();
    }
  });

  test('should handle mixed guest and authenticated users', async ({ browser }) => {
    const authContext = await browser.newContext();
    const guestContext = await browser.newContext();
    
    const authPage = await authContext.newPage();
    const guestPage = await guestContext.newPage();
    
    try {
      // Utilisateur connecté crée une partie
      await authPage.goto('/login');
      await authPage.fill('[data-testid="login-email"]', 'auth@example.com');
      await authPage.fill('[data-testid="login-password"]', 'password123');
      await authPage.click('[data-testid="login-submit"]');
      
      await authPage.goto('/dashboard');
      await authPage.click('[data-testid="create-game-btn"]');
      const pin = await authPage.textContent('[data-testid="game-pin"]');
      
      // Invité rejoint la partie
      await guestPage.goto('/');
      await guestPage.fill('[data-testid="join-pin-input"]', pin!);
      await guestPage.click('[data-testid="join-game-btn"]');
      await guestPage.fill('[data-testid="username-input"]', 'GuestUser');
      
      // Vérifier que les deux joueurs coexistent
      await expect(authPage.locator('[data-testid="player-list"]'))
        .toContainText('GuestUser');
      await expect(guestPage.locator('[data-testid="player-list"]'))
        .toContainText('AuthUser');
      
    } finally {
      await authContext.close();
      await guestContext.close();
    }
  });
});
```

### 6.5 Tests de performance

#### Tests de charge

```typescript
// test/performance/load.test.ts
import { check } from 'k6';
import { SocketIO } from 'k6/net/socketio';
import http from 'k6/http';

export let options = {
  stages: [
    { duration: '30s', target: 50 },   // Montée en charge
    { duration: '2m', target: 100 },   // Maintien
    { duration: '30s', target: 0 },    // Descente
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% des requêtes < 500ms
    http_req_failed: ['rate<0.1'],    // Moins de 10% d'échecs
  }
};

export default function() {
  // Test création de partie
  const createResponse = http.post(`${__ENV.API_URL}/api/v1/games`, {
    maxPlayers: 4
  });
  
  check(createResponse, {
    'game created': (r) => r.status === 201,
    'response time OK': (r) => r.timings.duration < 500
  });
  
  if (createResponse.status === 201) {
    const gameData = JSON.parse(createResponse.body);
    const pin = gameData.data.pin;
    
    // Test jointure multiple
    for (let i = 1; i <= 3; i++) {
      const joinResponse = http.post(`${__ENV.API_URL}/api/v1/games/${pin}/join`, {
        username: `LoadTestPlayer${i}_${__VU}_${__ITER}`
      });
      
      check(joinResponse, {
        'player joined': (r) => r.status === 201
      });
    }
  }
}

// Test WebSocket sous charge
export function wsTest() {
  const socket = new SocketIO(`${__ENV.WS_URL}`);
  
  socket.on('connect', () => {
    socket.emit('join-game', {
      pin: '123456',
      username: `WSUser_${__VU}`
    });
  });
  
  socket.on('player-joined', (data) => {
    check(data, {
      'valid player data': (d) => d.username !== undefined
    });
  });
  
  // Maintenir connexion 30s
  sleep(30);
  socket.close();
}
```

### 6.6 Tests de sécurité

```typescript
// test/security/security.test.ts
describe('Security Tests', () => {
  let app: INestApplication;
  
  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();
    
    app = moduleFixture.createNestApplication();
    await app.init();
  });
  
  afterAll(async () => {
    await app.close();
  });
  
  describe('Input Validation', () => {
    it('should reject SQL injection attempts', async () => {
      const maliciousInputs = [
        "'; DROP TABLE games; --",
        "1' OR '1'='1",
        "<script>alert('xss')</script>"
      ];
      
      for (const input of maliciousInputs) {
        const response = await request(app.getHttpServer())
          .post('/api/v1/games/123456/join')
          .send({ username: input })
          .expect(400);
        
        expect(response.body.message).toContain('Invalid');
      }
    });
  });
  
  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const requests = [];
      
      // Envoyer 50 requêtes rapidement
      for (let i = 0; i < 50; i++) {
        requests.push(
          request(app.getHttpServer())
            .post('/api/v1/games')
            .send({ maxPlayers: 4 })
        );
      }
      
      const responses = await Promise.all(requests);
      const rejectedCount = responses.filter(r => r.status === 429).length;
      
      expect(rejectedCount).toBeGreaterThan(0);
    });
  });
});
```

### 6.7 Outils et configuration CI/CD

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:coverage
      
      - uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
  
  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npx prisma migrate deploy
      - run: npm run test:integration
  
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e
      
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-screenshots
          path: test-results/
```

## 8. Monitoring et observabilité avancée

### 7.1 Architecture d'observabilité

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

### 7.2 Logging structuré

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
      level: process.env.LOG_LEVEL || 'info',
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
            version: process.env.APP_VERSION || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            ...meta
          });
        })
      ),
      transports: [
        // Console pour développement
        new transports.Console({
          format: process.env.NODE_ENV === 'development' 
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
    if (process.env.NODE_ENV === 'production' && process.env.ELASTICSEARCH_URL) {
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

### 7.3 Métriques et instrumentation

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
      version: process.env.APP_VERSION || '1.0.0'
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

### 7.4 Tracing distribué

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
        [SemanticResourceAttributes.SERVICE_VERSION]: process.env.APP_VERSION || '1.0.0',
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV || 'development'
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

### 7.5 Alerting intelligent

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

### 7.6 Dashboards Grafana

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

## 9. Performance et optimisation avancée

### 9.1 Architecture de cache multicouche

#### Stratégie de cache Redis optimisée

```typescript
// Service de cache intelligent avec TTL adaptatif
@Injectable()
export class CacheService {
  constructor(
    private readonly redis: Redis,
    private readonly logger: Logger
  ) {}
  
  // Cache adapté au gaming avec TTL variables
  private readonly cacheTTL = {
    // Données statiques (longue durée)
    questions: 24 * 60 * 60, // 24h
    gameConfig: 12 * 60 * 60, // 12h
    
    // Données de jeu (durée moyenne)
    gameState: 30 * 60, // 30min
    playerSession: 60 * 60, // 1h
    leaderboard: 5 * 60, // 5min
    
    // Données temps réel (courte durée)
    activeGames: 60, // 1min
    playerPresence: 30, // 30s
    rateLimit: 60 // 1min
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
      roundProgress: (gameState.currentRound / 4) * 100,
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
    <div className="game-screen">
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
    <div ref={parentRef} className="player-list-container">
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
          password: process.env.REDIS_PASSWORD
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

## 11. Recommandations finales

### 8.1 Fonctionnalités prioritaires
1. **PWA**: Ajout simple pour installation mobile
2. **Analytics**: Google Analytics ou Plausible
3. **Sentry**: Monitoring erreurs production
4. **Feedback widget**: Pour collecter avis utilisateurs
5. **Share buttons**: Viralité sociale

### 8.2 Future features
1. **Modes de jeu**: Teams, tournament, speed round
2. **Customisation**: Thèmes, avatars, sons
3. **Monétisation**: Premium features, no ads
4. **API publique**: Pour intégrations tierces
5. **IA**: Génération questions personnalisées

### 8.3 Pièges à éviter
1. **Over-engineering**: Commencer simple, itérer
2. **Premature optimization**: Mesurer avant optimiser
3. **Feature creep**: Focus sur core gameplay
4. **Tech debt**: Refactorer régulièrement
5. **Security**: Audits réguliers

### 8.4 Métriques de succès
- **Technique**: <2s chargement, 99.9% uptime
- **Engagement**: 70% completion rate, 30% return rate
- **Croissance**: 20% MoM new users
- **Qualité**: <1% error rate, >4.5 app rating
- **Business**: CAC < LTV, positive unit economics

## 12. Contenu multilingue complet et système de traduction

### 12.1 Architecture des textes multilingues

#### Structure JSON hiérarchique des traductions d'interface

```json
{
  "metadata": {
    "version": "1.0.0",
    "defaultLocale": "fr",
    "supportedLocales": ["fr", "en", "es", "it", "pt", "de"],
    "lastUpdated": "2024-01-15T00:00:00Z"
  },
  
  "translations": {
    "fr": {
      "common": {
        "buttons": {
          "start": "Commencer",
          "join": "Rejoindre",
          "create": "Créer une partie",
          "continue": "Continuer",
          "quit": "Quitter",
          "next": "Suivant",
          "previous": "Précédent",
          "validate": "Valider",
          "cancel": "Annuler"
        },
        "loading": {
          "generic": "Chargement...",
          "joining": "Connexion en cours...",
          "starting": "Lancement de la partie...",
          "questions": "Préparation des questions..."
        },
        "errors": {
          "network": "Erreur de connexion",
          "invalid_pin": "Code de partie invalide",
          "game_full": "Partie complète",
          "username_taken": "Pseudo déjà pris",
          "disconnected": "Connexion perdue"
        }
      },
      
      "homepage": {
        "title": "Percept - Découvrez-vous à travers le regard des autres",
        "introduction": "Avec Percept, plongez dans une expérience où vos perceptions et celles des autres se confrontent.",
        "subtitle": "Jeu social multijoueurs en temps réel",
        "features": [
          "Questions personnalisées pour mieux vous connaître",
          "Devinettes interactives avec vos amis",
          "Révélations surprenantes sur vos relations",
          "Interface moderne et intuitive"
        ],
        "cta": {
          "create": "Créer une nouvelle partie",
          "join": "Rejoindre une partie existante"
        }
      },
      
      "game": {
        "lobby": {
          "title": "Salle d'attente",
          "waiting_for_players": "En attente de joueurs...",
          "players_count": "{count} joueur(s) connecté(s)",
          "min_players": "Minimum {min} joueurs requis",
          "game_code": "Code de la partie",
          "starting_soon": "La partie va bientôt commencer",
          "language_info": "Langue de la partie : {language}"
        },
        
        "rounds": {
          "personality": "Personnalité",
          "situations": "Situations", 
          "representations": "Représentations",
          "relations": "Relations"
        },
        
        "gameplay": {
          "your_turn": "À votre tour !",
          "waiting_for": "En attente de {player}...",
          "time_remaining": "Temps restant : {seconds}s",
          "submit_answer": "Valider votre réponse",
          "make_guess": "Devinez la réponse de {player}",
          "correct_answer": "Bonne réponse !",
          "wrong_answer": "Mauvaise réponse",
          "points_earned": "+{points} points"
        },
        
        "results": {
          "round_results": "Résultats du round",
          "final_results": "Résultats finaux",
          "winner": "Gagnant : {player}",
          "your_score": "Votre score : {score} points",
          "play_again": "Rejouer",
          "new_game": "Nouvelle partie"
        }
      },
      
      "questions": {
        "loading": "Chargement de la question...",
        "fallback_notice": "Question affichée en français (traduction non disponible)"
      },
      
      "settings": {
        "language": "Langue",
        "change_language": "Changer la langue",
        "language_note": "La langue des questions dépend du créateur de la partie"
      }
    },
    
    "en": {
      "common": {
        "buttons": {
          "start": "Start",
          "join": "Join",
          "create": "Create Game",
          "continue": "Continue",
          "quit": "Quit",
          "next": "Next",
          "previous": "Previous",
          "validate": "Submit",
          "cancel": "Cancel"
        },
        "loading": {
          "generic": "Loading...",
          "joining": "Joining game...",
          "starting": "Starting game...",
          "questions": "Loading questions..."
        },
        "errors": {
          "network": "Connection error",
          "invalid_pin": "Invalid game code",
          "game_full": "Game is full",
          "username_taken": "Username already taken",
          "disconnected": "Connection lost"
        }
      },
      
      "homepage": {
        "title": "Percept - Discover yourself through others' eyes",
        "introduction": "With Percept, dive into an experience where your perceptions and those of others collide.",
        "subtitle": "Real-time multiplayer social game",
        "features": [
          "Personalized questions to know yourself better",
          "Interactive guessing with your friends",
          "Surprising revelations about your relationships",
          "Modern and intuitive interface"
        ],
        "cta": {
          "create": "Create a new game",
          "join": "Join an existing game"
        }
      },
      
      "game": {
        "lobby": {
          "title": "Waiting Room",
          "waiting_for_players": "Waiting for players...",
          "players_count": "{count} player(s) connected",
          "min_players": "Minimum {min} players required",
          "game_code": "Game Code",
          "starting_soon": "Game starting soon",
          "language_info": "Game language: {language}"
        },
        
        "rounds": {
          "personality": "Personality",
          "situations": "Situations",
          "representations": "Representations", 
          "relations": "Relations"
        },
        
        "gameplay": {
          "your_turn": "Your turn!",
          "waiting_for": "Waiting for {player}...",
          "time_remaining": "Time remaining: {seconds}s",
          "submit_answer": "Submit your answer",
          "make_guess": "Guess {player}'s answer",
          "correct_answer": "Correct!",
          "wrong_answer": "Wrong answer",
          "points_earned": "+{points} points"
        },
        
        "results": {
          "round_results": "Round Results",
          "final_results": "Final Results",
          "winner": "Winner: {player}",
          "your_score": "Your score: {score} points",
          "play_again": "Play Again",
          "new_game": "New Game"
        }
      },
      
      "questions": {
        "loading": "Loading question...",
        "fallback_notice": "Question displayed in French (translation not available)"
      },
      
      "settings": {
        "language": "Language",
        "change_language": "Change Language",
        "language_note": "Question language depends on the game creator"
      }
    },
    
    "es": {
      "common": {
        "buttons": {
          "start": "Comenzar",
          "join": "Unirse",
          "create": "Crear Partida",
          "continue": "Continuar",
          "quit": "Salir",
          "next": "Siguiente",
          "previous": "Anterior",
          "validate": "Validar",
          "cancel": "Cancelar"
        }
        // ... resto de traducciones en español
      }
      // ... estructuras similares para español
    },
    
    "it": {
      // ... traducciones en italiano
    },
    
    "pt": {  
      // ... traducciones en portugués
    },
    
    "de": {
      // ... traducciones en alemán
    }
  }
}
```

### 12.2 Textes d'interface par composant

#### Page d'accueil - Introduction (NOUVELLE VERSION)
"Avec Percept, plongez dans une expérience où vos perceptions et celles des autres se confrontent.

Jouez et découvrez comment vos amis vous voient et s'ils sont tels que vous les imaginez !

Si vous voulez gagner, il faudra cerner qui se cache derrière les masques que les autres joueurs portent… parfois même sans s'en apercevoir.

**Pourquoi vous allez adorer ?**
Au-delà du jeu, l'intérêt réside dans les discussions qui en découlent. Débriefez les réponses, essayez de comprendre les choix des uns et des autres, et découvrez des facettes inattendues de vos amis ou de votre famille.

À vous de jouer !"

#### Règles du jeu

**Le but du jeu :**
Accumulez des points en devinant les réponses des autres joueurs. Attention, pas de points en jeu pour votre propre réponse, alors soyez **honnête et spontané**.

**Comment ça marche ?**
1. À chaque tour, un joueur tire une question et y répond.
2. Les autres joueurs doivent deviner sa réponse.
3. Le questionné change à chaque tour.
4. La partie se joue en **4 manches**, chacune avec un type de question différent pour varier les surprises !

**Accordez vous sur les termes et le contexte des questions avant d'y répondre**

**Pour 4 à 7 joueurs**

#### Texte d'accueil
"Bienvenue !

Commencez une partie ou rejoignez-en une en entrant le code PIN généré par le créateur"

### 9.2 Structure des questions

Le jeu contient un ensemble de questions réparties en plusieurs rounds thématiques configurables via l'interface d'administration :

1. **Round Personnalité** : Questions introspectives sur les valeurs, préférences et traits de caractère
2. **Round Situations** : Dilemmes et choix dans des situations hypothétiques
3. **Round Représentations** : Questions sur la perception des autres joueurs
4. **Round Relations** : Questions sur les relations entre les joueurs

<!-- CORRIGÉ: Suppression de tous les nombres hardcodés (320, 65, 64, 107, 84) et du nombre fixe de rounds pour permettre une configuration dynamique par les administrateurs. Les nombres exacts sont gérés par la base de données et l'interface d'administration -->

### 9.3 Exemples de questions par round

#### Round 1 - Personnalité
- "Tes vrais amis, tu les comptes ..." (4 options)
- "À quelle fréquence tu t'observes à travers un miroir ou des photos ?" (2 options)
- "Pour toi, le sexe ..." (2 options)
- "Si tu étais un animal, tu serais ..." (3 options)
- "Tu préfères construire quelque chose de..." (3 options : Beau/Robuste/Utile)

#### Round 2 - Situations
- "Tu as une opportunité de carrière exceptionnelle à l'étranger, mais cela signifierait laisser derrière toi ta famille et tes amis proches pour une période non négligeable. Que choisis-tu ?" (Je pars/Je reste)
- "Tu es témoin d'une réprimande sévère d'un parent à son enfant dans un lieu public. Interviens-tu ?" (Oui/Non)
- "Face à un danger mortel, entre sauver un proche et un groupe d'inconnus, que ferais-tu ?" (Je sauve mon proche/Je sauve les inconnus)

#### Round 3 - Représentations
- "Qui serait le·la plus enclin·e à partir avant la fin du jeu à cause d'une réponse qui ne lui plaît pas ?"
- "Qui te semble être le·la plus intelligent·e ?"
- "Qui a traversé les épreuves les plus difficiles ?"
- "Qui masque le mieux ses peines ?"

#### Round 4 - Relations
- "La vie de quelle joueur/joueuse ne voudrais-tu pas mener ?"
- "À qui ferais-tu le moins confiance pour garder un secret ?"
- "Avec qui te sens-tu le plus en sécurité ?"
- "Qui choisirais-tu comme témoin de mariage ?"

### 9.4 Formats de réponses

- **2 options** : Questions binaires (Oui/Non, choix A/B)
- **3 options** : Questions à choix multiples
- **4 options** : Questions plus nuancées
- **Réponses nulles** : Pour les rounds 3 et 4, les réponses sont les noms des joueurs

## 13. Interface d'administration multilingue

### 13.1 Vue d'ensemble avec gestion des traductions

L'interface d'administration intègre une gestion complète du contenu multilingue avec workflow de traduction, validation et déploiement.

#### Dashboard principal étendu pour i18n
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Epercept Admin - Multilingual                                   [🌐FR][Logout]│
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ {{TOTAL_Q}} │ │ 47          │ │ 1,234       │ │ 6 🌐        │           │
<!-- CORRIGÉ: Nombre de questions dynamique plutôt que hardcodé -->
│  │ Questions   │ │ Parties/jour│ │ Joueurs     │ │ Langues     │           │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ Complétude des traductions                                              │ │
│  │ 🇫🇷 Français    ████████████████████████████████████████████████ 100%  │ │
│  │ 🇬🇧 English     ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0%  │ │
│  │ 🇪🇸 Español     ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0%  │ │
│  │ 🇮🇹 Italiano    ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0%  │ │
│  │ 🇵🇹 Português   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0%  │ │
│  │ 🇩🇪 Deutsch     ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0%  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ Questions par round & Statut traduction                                 │ │
│  │ ████████ Personnalité ({{P_COUNT}}) - 🇫🇷✓ 🇬🇧⏳ 🇪🇸⏳ 🇮🇹⏳ 🇵🇹⏳ 🇩🇪⏳      │ │
│  │ ████████ Situations ({{S_COUNT}}) - 🇫🇷✓ 🇬🇧⏳ 🇪🇸⏳ 🇮🇹⏳ 🇵🇹⏳ 🇩🇪⏳        │ │
│  │ ████████ Représentations ({{R_COUNT}}) - 🇫🇷✓ 🇬🇧⏳ 🇪🇸⏳ 🇮🇹⏳ 🇵🇹⏳ 🇩🇪⏳  │ │
│  │ ████████ Relations ({{REL_COUNT}}) - 🇫🇷✓ 🇬🇧⏳ 🇪🇸⏳ 🇮🇹⏳ 🇵🇹⏳ 🇩🇪⏳       │ │

<!-- CORRIGÉ: Remplacement des nombres hardcodés par des variables dynamiques et normalisation des barres de progression -->
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
│  Actions rapides:                                                           │
│  [+ Nouvelle question] [🌐 Gérer traductions] [📊 Stats i18n] [📤 Export]    │
│  [📥 Import traductions] [✅ Valider traductions] [🚀 Déployer langue]       │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 13.2 *** NOUVEAUTÉ: Gestion complète des traductions ***

#### Centre de traduction unifié

Interface centralisée pour gérer l'ensemble du processus de traduction de toutes les questions sources.

<!-- CORRIGÉ: Suppression du nombre hardcodé pour plus de flexibilité -->

```typescript
interface TranslationCenter {
  // Vue d'ensemble par langue
  overview: {
    locale: SupportedLocale;
    completeness: number; // Pourcentage de traduction
    validatedCount: number;
    pendingCount: number;
    lastUpdate: Date;
  }[];
  
  // Workflow de traduction par étapes
  workflow: {
    currentStep: 'export' | 'translation' | 'validation' | 'deployment';
    nextActions: string[];
    blockers: string[];
  };
  
  // Métriques qualité
  quality: {
    averageScore: number;
    consistencyCheck: boolean;
    culturalReview: boolean;
  };
}
```

#### Interface de traduction question par question

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ Traduction Question #1 - Personnalité                           [EN] 🇬🇧       │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│ 🇫🇷 FRANÇAIS (Source)                                                         │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ Tes vrais amis, tu les comptes ...                                         │ │
│ │                                                                             │ │
│ │ Options:                                                                    │ │
│ │ • Sur les doigts d'une main                                                 │ │
│ │ │ • Sur les deux mains                                                      │ │ 
│ │ • Tu n'as pas assez de doigts pour les compter                             │ │
│ │ • Tu n'en as pas                                                            │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│ 📝 NOTES CULTURELLES                                                         │
│ Expression idiomatique avec les doigts - adapter selon culture anglophone    │
│                                                                               │
│ 🇬🇧 ANGLAIS (Traduction)                        Status: ⏳ En attente        │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ Your true friends, you count them ...                      [Focus]         │ │
│ │                                                                             │ │
│ │ Options:                                                                    │ │
│ │ • On the fingers of one hand                               [Focus]         │ │
│ │ • On both hands                                            [Focus]         │ │
│ │ • You don't have enough fingers to count them             [Focus]         │ │
│ │ • You don't have any                                       [Focus]         │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│ 💬 ADAPTATION CULTURELLE                                                     │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ Expression "count on fingers" bien comprise en anglais. Maintenir le       │ │
│ │ sens littéral tout en gardant la fluidité naturelle.                       │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│ Actions: [💾 Sauvegarder] [👁️ Prévisualiser] [✅ Marquer prêt] [❌ Rejeter]    │
│         [⬅️ Précédent] [➡️ Suivant] [📋 Export pour validation externe]       │
└───────────────────────────────────────────────────────────────────────────────┘
```

#### Outils d'assistance à la traduction

```typescript
interface TranslationAssistance {
  // Détection d'incohérences
  consistencyCheck: {
    termVariations: string[]; // Termes traduits différemment
    lengthWarnings: string[]; // Traductions trop longues/courtes  
    missingTranslations: number[];
  };
  
  // Suggestions automatiques
  suggestions: {
    machineTranslation: string; // Traduction automatique de base
    contextualHints: string[]; // Indices contextuels
    culturalNotes: string; // Notes d'adaptation culturelle
  };
  
  // Validation temps réel
  validation: {
    grammarCheck: boolean;
    spellingCheck: boolean;
    culturalReview: boolean;
    gameplayTest: boolean; // Test en conditions réelles
  };
}
```

#### Workflow de validation multi-étapes

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Validation des traductions - Anglais 🇬🇧                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ ✅ Étape 1: Traduction complète (320/320 questions)                     │
│ ⏳ Étape 2: Révision linguistique (En cours - 45/320)                   │
│ ⏸️  Étape 3: Validation culturelle (En attente)                         │
│ ⏸️  Étape 4: Tests gameplay (En attente)                                │
│ ⏸️  Étape 5: Déploiement production (En attente)                        │
│                                                                         │
│ 👤 Réviseur actuel: sarah.johnson@translationteam.com                   │
│ 📅 Échéance: 15 février 2024                                            │
│ 🎯 Progression: 14% (45/320 questions validées)                         │
│                                                                         │
│ 📊 Métriques qualité actuelles:                                         │
│ • Cohérence terminologique: 92%                                         │
│ • Adaptation culturelle: 88%                                            │
│ • Fluidité gameplay: 95%                                                │
│ • Temps de réponse moyen: 2.3s                                          │
│                                                                         │
│ Actions: [📧 Notifier réviseur] [📈 Rapport détaillé] [⚡ Accélérer]     │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Export/Import pour traducteurs externes

```typescript
// Export pour traducteurs
interface TranslationExport {
  format: 'csv' | 'xliff' | 'json' | 'gettext';
  locale: SupportedLocale;
  includeContext: boolean;
  includeMetadata: boolean;
  
  // Configuration CSV
  csvConfig?: {
    delimiter: ',' | ';' | '\t';
    encoding: 'utf-8' | 'utf-16';
    includeHeaders: boolean;
  };
  
  // Configuration XLIFF (standard industrie)
  xliffConfig?: {
    version: '1.2' | '2.0';
    includeNotes: boolean;
    segmentationMode: 'sentence' | 'paragraph';
  };
}

// Structure d'export CSV
interface TranslationCSVRow {
  sourceId: number;
  context: string; // "personality", "situations", etc.
  sourceText: string;
  sourceOptions: string; // JSON array ou séparé par |
  targetText: string; // Vide pour nouvelles traductions
  targetOptions: string;
  translationNotes: string;
  culturalContext: string;
  difficulty: string;
  status: TranslationStatus;
  translatedBy: string;
  validatedBy: string;
  lastModified: string;
}
```

### 13.3 Gestion des questions (étendue pour multilingue)

#### Liste des questions
- **Filtres avancés** : Par round, nombre de réponses, date d'ajout, popularité
- **Recherche** : Full-text search dans les questions
- **Actions bulk** : Activer/désactiver, supprimer, exporter
- **Statistiques** : Taux de réponse, distribution des choix

#### Formulaire d'édition
```typescript
interface QuestionForm {
  round_id: 1 | 2 | 3 | 4;
  name: string;
  answers: {
    answer_1: string | null;
    answer_2: string | null;
    answer_3: string | null;
    answer_4: string | null;
  };
  metadata: {
    tags: string[];
    difficulty: 'easy' | 'medium' | 'hard';
    isActive: boolean;
    createdBy: string;
    lastModified: Date;
  };
}
```

#### Prévisualisation en temps réel
- Affichage de la question comme elle apparaîtra en jeu
- Simulation des différents états (joueur actif/autres joueurs)
- Test de lisibilité mobile

### 10.3 Features avancées

#### Gestion des rounds
- Personnalisation des noms et descriptions
- Configuration des couleurs et thèmes visuels
- Ordre d'apparition des rounds
- Règles spécifiques par round

#### Import/Export
- **Import CSV** : Template fourni, validation des données
- **Export** : JSON, CSV, Excel avec filtres
- **Backup automatique** : Sauvegarde quotidienne
- **Versioning** : Historique des modifications

#### Analytics
- **Questions populaires** : Les plus/moins jouées
- **Taux d'abandon** : Questions qui font quitter les joueurs
- **Distribution des réponses** : Équilibre des choix
- **Feedback joueurs** : Notes et commentaires

#### Modération
- **File d'attente** : Questions soumises par la communauté
- **Validation** : Workflow d'approbation
- **Signalements** : Gestion des questions problématiques
- **A/B testing** : Test de questions alternatives

### 10.4 Architecture technique admin

#### API endpoints
```typescript
// Questions CRUD
GET    /api/admin/questions
POST   /api/admin/questions
PUT    /api/admin/questions/:id
DELETE /api/admin/questions/:id

// Bulk operations
POST   /api/admin/questions/bulk-update
POST   /api/admin/questions/import
GET    /api/admin/questions/export

// Analytics
GET    /api/admin/analytics/questions
GET    /api/admin/analytics/games
GET    /api/admin/analytics/players

// Moderation
GET    /api/admin/moderation/queue
POST   /api/admin/moderation/approve/:id
POST   /api/admin/moderation/reject/:id
```

#### Permissions et rôles
```typescript
enum AdminRole {
  SUPER_ADMIN = 'super_admin',     // Tous les droits
  CONTENT_MANAGER = 'content_manager', // CRUD questions
  MODERATOR = 'moderator',         // Modération uniquement
  ANALYST = 'analyst'              // Lecture seule + analytics
}

@UseGuards(AdminGuard)
@Roles(AdminRole.CONTENT_MANAGER)
@Controller('admin/questions')
export class AdminQuestionsController {
  // ...
}
```

#### UI Components
```typescript
// Composants réutilisables pour l'admin
components/admin/
├── QuestionTable.tsx       // Table avec tri, filtre, pagination
├── QuestionForm.tsx        // Formulaire avec validation
├── QuestionPreview.tsx     // Prévisualisation temps réel
├── BulkActions.tsx         // Actions sur sélection multiple
├── ImportWizard.tsx        // Assistant d'import étape par étape
├── AnalyticsChart.tsx      // Graphiques interactifs
└── ModerationQueue.tsx     // File de modération
```

#### Sécurité admin
- **Authentification forte** : 2FA obligatoire
- **Audit trail** : Log de toutes les actions
- **Rate limiting** : Protection contre les abus
- **Backup** : Sauvegarde avant modifications critiques
- **Rollback** : Possibilité d'annuler les changements

### 10.5 Workflow de gestion du contenu

1. **Création** : Formulaire avec validation et prévisualisation
2. **Review** : Validation par un second admin (4-eyes principle)
3. **Test** : Période de test sur groupe restreint
4. **Déploiement** : Mise en production progressive
5. **Monitoring** : Suivi des métriques post-déploiement
6. **Itération** : Ajustements basés sur les données

## 14. Ressources et références du projet

### 11.1 Structure des fichiers du projet

#### Fichiers de documentation
- **Ce document** : Spécifications techniques complètes d'Epercept
- **Base de données questions** : `epercept-questions-database.md` - 320 questions détaillées organisées par rounds
- **README principal** : `README.md` - Instructions de développement et déploiement

#### Références techniques
- **Questions** : 320 questions réparties en 4 catégories thématiques
- **Composants UI** : 12 écrans principaux définis
- **Architecture** : Stack Next.js + NestJS + PostgreSQL

### 11.2 Navigation entre ressources

Pour développer l'application, consulter dans l'ordre :
1. **Ce document** pour l'architecture et les spécifications techniques
2. **epercept-questions-database.md** pour le contenu complet des questions
3. **Spécifications détaillées** dans ce document

### 11.3 Référence rapide

#### Questions du jeu
- **Total** : 320 questions réparties en 4 rounds
- **Localisation** : `./epercept-questions-database.md`
- **Format** : Questions organisées par thématiques avec toutes les réponses
- **Usage** : Base de données pour l'interface d'administration

#### Textes d'interface
- **Localisation** : Section 9.1 de ce document
- **Statut** : Corrigés selon retours fondateur
- **Usage** : Intégrer directement dans les composants React/Next.js

## 15. Textes et messages complets du jeu

### 12.1 Messages système

#### Messages d'erreur
```typescript
const ERROR_MESSAGES = {
  // Connexion et PIN
  INVALID_PIN: "Code PIN invalide",
  GAME_NOT_FOUND: "Partie non trouvée",
  USERNAME_TAKEN: "Ce pseudo est déjà utilisé dans cette partie. Veuillez choisir un autre pseudo.",
  INVALID_USERNAME: "Insérez un pseudo valide",
  
  // Connexion réseau
  CONNECTION_LOST: "Connexion perdue. Reconnexion en cours...",
  RECONNECTION_FAILED: "Impossible de se reconnecter. Veuillez rafraîchir la page.",
  SERVER_ERROR: "Une erreur inattendue est survenue",
  
  // Gameplay
  GAME_FULL: "Cette partie est complète (7 joueurs maximum)",
  GAME_IN_PROGRESS: "Cette partie a déjà commencé",
  NOT_ENOUGH_PLAYERS: "Il faut au moins 3 joueurs pour commencer",
  ANSWER_TIMEOUT: "Temps écoulé ! Votre réponse n'a pas été prise en compte",
  
  // Déconnexions
  PLAYER_DISCONNECTED: "{username} s'est déconnecté(e)",
  WAITING_RECONNECTION: "En attente de la reconnexion de {username}...",
  GAME_ABANDONED: "Trop de joueurs déconnectés. Partie annulée."
};
```

#### Messages de statut
```typescript
const STATUS_MESSAGES = {
  // Phases de jeu
  WAITING_PLAYERS: "En attente des autres joueurs...",
  WAITING_ANSWER: "{username} est en train de répondre...",
  WAITING_GUESSES: "En attente des devinettes...",
  REVEALING_ANSWERS: "Révélation des réponses...",
  CALCULATING_SCORES: "Calcul des scores...",
  
  // Transitions
  NEXT_ROUND: "Manche suivante dans 3 secondes...",
  NEXT_TURN: "Tour suivant...",
  GAME_ENDING: "Fin de partie...",
  
  // Timer
  TIME_REMAINING: "Temps restant : {seconds}s",
  LAST_CHANCE: "Plus que 10 secondes !",
  TIMES_UP: "Temps écoulé !",
  
  // Résultats
  CORRECT_ANSWER: "Bonne réponse ! +1 point",
  WRONG_ANSWER: "Mauvaise réponse",
  NO_ANSWER: "Pas de réponse",
  PERFECT_ROUND: "Tous ont trouvé ! Manche parfaite !",
};
```

#### Textes des boutons et actions
```typescript
const BUTTON_TEXTS = {
  // Navigation
  START_GAME: "Commencer la partie",
  JOIN_GAME: "Rejoindre",
  CREATE_GAME: "Créer une partie",
  NEXT: "Suivant",
  CONTINUE: "Continuer",
  BACK: "Retour",
  
  // Gameplay
  SUBMIT_ANSWER: "Valider ma réponse",
  SUBMIT_GUESS: "Valider ma devinette",
  SHOW_RESULTS: "Voir les résultats",
  NEXT_TURN: "Tour suivant",
  NEXT_ROUND: "Manche suivante",
  
  // Fin de partie
  PLAY_AGAIN: "Rejouer",
  NEW_GAME: "Nouvelle partie",
  VIEW_STATS: "Voir les statistiques",
  SHARE_RESULTS: "Partager les résultats",
  
  // Admin et options
  LEAVE_GAME: "Quitter la partie",
  SHOW_RANKING: "Voir le classement",
  HIDE_RANKING: "Masquer le classement",
  TOGGLE_SOUND: "Son ON/OFF",
};
```

### 12.2 Textes des états de jeu

#### Écran de chargement
```typescript
const LOADING_TEXTS = {
  JOINING_GAME: "Connexion à la partie...",
  LOADING_QUESTIONS: "Préparation des questions...",
  SYNCHRONIZING: "Synchronisation avec les autres joueurs...",
  CALCULATING_RESULTS: "Calcul des résultats...",
  PREPARING_NEXT_ROUND: "Préparation de la manche suivante...",
};
```

#### Aide et tooltips
```typescript
const HELP_TEXTS = {
  PIN_INPUT: "Saisissez le code à 6 chiffres fourni par le créateur de la partie",
  USERNAME_INPUT: "Choisissez un pseudo unique pour cette partie",
  QUESTION_ANSWERING: "Répondez honnêtement, vous ne gagnez pas de points pour votre propre réponse",
  GUESSING_PHASE: "Devinez ce que {username} a répondu à cette question",
  TIMER_WARNING: "Le timer démarre dès que le premier joueur répond",
  RANKING_EXPLANATION: "Classement basé sur le nombre de bonnes devinettes",
};
```

### 12.3 Messages de fin de partie

#### Résultats et classements
```typescript
const END_GAME_TEXTS = {
  // Podium
  WINNER_SINGLE: "🏆 {username} remporte la partie !",
  WINNER_MULTIPLE: "🏆 Égalité ! {usernames} remportent la partie !",
  FINAL_RANKING: "Classement final",
  PERSONAL_STATS: "Vos statistiques",
  
  // Statistiques
  QUESTIONS_ANSWERED: "Questions posées : {count}",
  CORRECT_GUESSES: "Bonnes devinettes : {count}/{total}",
  ACCURACY_RATE: "Taux de réussite : {percentage}%",
  FAVORITE_ROUND: "Manche préférée : {roundName}",
  BEST_GUESSER: "Meilleur devineur : {username}",
  MOST_PREDICTABLE: "Plus prévisible : {username}",
  MOST_SURPRISING: "Plus surprenant : {username}",
  
  // Options de continuation
  SESSION_STATS: "Statistiques de la session",
  GAMES_PLAYED: "Parties jouées : {count}",
  CUMULATIVE_SCORE: "Score cumulé : {score} points",
  CONTINUE_SESSION: "Continuer la session",
  END_SESSION: "Terminer la session",
};
```

## 16. Spécifications complètes des écrans

### 13.1 États visuels détaillés

#### Page d'accueil
```typescript
interface HomePageStates {
  intro: {
    title: "PERCEPT";
    logo: "percept_logo.svg";
    content: string; // Texte section 9.1
    action: "Suivant";
  };
  
  rules: {
    title: "Règles du jeu";
    content: string; // Règles section 9.1
    action: "Suivant";
  };
  
  main: {
    title: "PERCEPT";
    logo: "percept_logo.svg";
    content: "Bienvenue ! Commencez une partie ou rejoignez-en une...";
    actions: ["Créer une partie", "Code PIN + GO"];
  };
  
  // États d'erreur
  error: {
    message: string;
    type: "invalid_pin" | "connection_error" | "server_error";
    recoverable: boolean;
  };
  
  // État de chargement
  loading: {
    message: "Connexion en cours...";
    spinner: true;
  };
}
```

#### Lobby/Salle d'attente
```typescript
interface LobbyStates {
  waiting: {
    header: {
      logo: "percept_logo.svg";
      pin: string; // Code PIN en grand
      title: "En attente des joueurs";
    };
    
    playersList: Player[];
    minPlayers: 3;
    maxPlayers: 7;
    
    footer: {
      status: `${currentPlayers}/${maxPlayers} joueurs`;
      autoStart: boolean; // Démarre auto à 3 joueurs
    };
  };
  
  starting: {
    countdown: number; // 3, 2, 1...
    message: "La partie commence !";
  };
  
  error: {
    type: "player_limit" | "disconnection" | "timeout";
    message: string;
    recoverable: boolean;
  };
}
```

#### Écran de jeu principal
```typescript
interface GameScreenStates {
  // Header constant
  header: {
    logo: "percept_logo.svg";
    roundInfo: {
      number: number; // 1-4
      name: string; // "Personnalité", etc.
      theme: string; // Classe CSS pour couleurs
    };
    currentPlayer: string;
    smartRanking: {
      compact: {
        myPoints: number;
        myPosition: number;
        display: "Points: {points} | Position: {position}";
      };
      expanded?: {
        fullRanking: PlayerRanking[];
        visible: boolean;
      };
    };
  };
  
  // Corps principal - États mutuellement exclusifs
  answering: {
    role: "active_player" | "waiting";
    question: string;
    options: string[] | null; // null pour rounds 3-4
    timer?: {
      duration: 30000;
      remaining: number;
      visible: boolean;
    };
    state: "thinking" | "answered" | "waiting_others";
  };
  
  guessing: {
    question: string;
    correctAnswer?: string; // Visible si déjà répondu par le joueur actif
    myGuess?: string;
    timer: {
      duration: 30000;
      remaining: number;
      warning: boolean; // < 10s
    };
    state: "thinking" | "submitted" | "waiting_others";
  };
  
  revealing: {
    question: string; // Rappelé en haut
    correctAnswer: string;
    participants: {
      correct: Player[];
      incorrect: Player[];
    };
    pointsAwarded: PointsUpdate[];
    visualFeedback: {
      correctHighlight: "green_border";
      incorrectHighlight: "red_border";
      // Plus de vert+rouge simultané
    };
  };
  
  // Footer
  footer: {
    autoAdvance: {
      enabled: boolean;
      trigger: "last_respondent";
      message: "Passage automatique au tour suivant...";
    };
    manualAdvance?: {
      button: "Continuer";
      visible: boolean;
      enabledFor: "last_respondent" | "game_creator";
    };
  };
}
```

### 13.2 Gestion des erreurs et états exceptionnels

#### Reconnexion et récupération
```typescript
interface ConnectionStates {
  connected: {
    status: "online";
    latency?: number;
  };
  
  reconnecting: {
    status: "reconnecting";
    attempt: number;
    maxAttempts: 3;
    message: "Reconnexion en cours... ({attempt}/3)";
    showSpinner: true;
  };
  
  offline: {
    status: "offline";
    message: "Connexion perdue. Vérifiez votre connexion internet.";
    actions: ["Réessayer", "Quitter la partie"];
  };
  
  stateRecovered: {
    status: "recovered";
    message: "Connexion rétablie ! Synchronisation...";
    gameState: GameState; // État récupéré
  };
}
```

#### Gestion des déconnexions d'autres joueurs
```typescript
interface PlayerDisconnectionStates {
  playerLeft: {
    player: Player;
    message: "{username} s'est déconnecté(e)";
    impact: "game_continues" | "game_paused" | "game_ended";
    waitingReconnection: boolean;
    timeout: number; // 2 minutes
  };
  
  gameAdjusted: {
    message: "La partie continue sans {username}";
    redistributedQuestions: boolean;
    newPlayerOrder: Player[];
  };
  
  criticalDisconnection: {
    message: "Trop de joueurs déconnectés";
    options: ["Attendre", "Terminer la partie"];
    autoEndTimer: number; // 5 minutes
  };
}
```

## 17. Configuration technique complète avec support multilingue

### 17.1 Variables d'environnement complètes (i18n + authentification)

#### Frontend (Next.js) avec internationalisation et authentification
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:5001
NEXT_PUBLIC_SOCKET_URL=http://localhost:5001
NEXT_PUBLIC_APP_NAME=Epercept
NEXT_PUBLIC_MAX_PLAYERS=7
NEXT_PUBLIC_MIN_PLAYERS=3
NEXT_PUBLIC_GAME_TIMEOUT=300000
NEXT_PUBLIC_RECONNECTION_ATTEMPTS=3

# *** NOUVEAUTÉ: Configuration multilingue ***
NEXT_PUBLIC_DEFAULT_LOCALE=fr
NEXT_PUBLIC_SUPPORTED_LOCALES=fr,en,es,it,pt,de
NEXT_PUBLIC_ENABLE_LOCALE_DETECTION=true
NEXT_PUBLIC_FALLBACK_LOCALE=fr
NEXT_PUBLIC_TRANSLATION_API_KEY=your-translation-api-key

# *** NOUVEAUTÉ AUTH: Configuration authentification frontend ***
NEXT_PUBLIC_AUTH_ENABLED=true
NEXT_PUBLIC_GUEST_MODE_ENABLED=true
NEXT_PUBLIC_OAUTH_ENABLED=true

# OAuth Providers (publics - client IDs seulement)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
NEXT_PUBLIC_FACEBOOK_APP_ID=your-facebook-app-id
NEXT_PUBLIC_APPLE_CLIENT_ID=your.apple.service.id

# Auth Configuration
NEXT_PUBLIC_JWT_TOKEN_STORAGE=localStorage # ou sessionStorage
NEXT_PUBLIC_SESSION_TIMEOUT_WARNING=60000 # 1 minute avant expiration
NEXT_PUBLIC_CONVERSION_MODAL_DELAY=3000 # 3 secondes après résultats
NEXT_PUBLIC_CONVERSION_RETRY_AFTER_GAMES=3 # Reproposer après 3 parties

# Analytics et A/B Testing
NEXT_PUBLIC_ANALYTICS_ID=GA_MEASUREMENT_ID
NEXT_PUBLIC_AB_TEST_CONVERSION_ENABLED=true

# Production
NEXT_PUBLIC_API_URL=https://api.epercept.fr
NEXT_PUBLIC_SOCKET_URL=https://api.epercept.fr
NEXT_PUBLIC_GOOGLE_CLIENT_ID=prod-google-client-id.apps.googleusercontent.com
NEXT_PUBLIC_FACEBOOK_APP_ID=prod-facebook-app-id
NEXT_PUBLIC_APPLE_CLIENT_ID=prod.apple.service.id
```

#### Backend (NestJS) avec internationalisation et authentification
```bash
# .env
NODE_ENV=development
PORT=5001
DATABASE_URL=postgresql://user:password@localhost:5432/epercept
REDIS_URL=redis://localhost:6379

# *** JWT & Security (ÉTENDU) ***
JWT_ACCESS_SECRET=your-super-secret-jwt-access-key-minimum-32-chars
JWT_REFRESH_SECRET=your-different-refresh-secret-minimum-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
SESSION_SECRET=your-session-secret-minimum-32-chars
ENCRYPTION_KEY=your-hex-encryption-key-32-bytes
KEY_SALT=your-hex-salt-32-bytes

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,https://epercept.fr
CORS_CREDENTIALS=true

# *** NOUVEAUTÉ AUTH: Configuration OAuth ***
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5001/api/v1/auth/oauth/google/callback

# Facebook OAuth  
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_CALLBACK_URL=http://localhost:5001/api/v1/auth/oauth/facebook/callback

# Apple OAuth
APPLE_CLIENT_ID=your.apple.service.id
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY_PATH=/path/to/apple-private-key.p8
APPLE_CALLBACK_URL=http://localhost:5001/api/v1/auth/oauth/apple/callback

# *** Email Service Configuration ***
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM_EMAIL=noreply@epercept.fr
SMTP_FROM_NAME=Epercept

# Email Templates
EMAIL_TEMPLATES_DIR=./src/email/templates
EMAIL_BASE_URL=http://localhost:3000

# SendGrid Alternative (production)
# SENDGRID_API_KEY=your-sendgrid-api-key

# *** Rate Limiting & Security ***
RATE_LIMIT_WINDOW_MS=900000 # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=true

# Brute Force Protection
LOGIN_ATTEMPTS_LIMIT=5
LOGIN_ATTEMPTS_WINDOW_MS=900000 # 15 minutes
LOGIN_LOCKOUT_DURATION_MS=3600000 # 1 hour

# Password Policy
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBERS=true
PASSWORD_REQUIRE_SYMBOLS=false

# Game Configuration
MAX_PLAYERS_PER_GAME=7
MIN_PLAYERS_TO_START=3
ANSWER_TIMEOUT_MS=30000
RECONNECTION_TIMEOUT_MS=120000
GAME_CLEANUP_INTERVAL_MS=300000

# *** Configuration i18n Backend ***
I18N_DEFAULT_LOCALE=fr
I18N_SUPPORTED_LOCALES=fr,en,es,it,pt,de
I18N_FALLBACK_LOCALE=fr
I18N_ENABLE_DETECTION=true
I18N_CACHE_TTL=3600
TRANSLATION_SERVICE_URL=https://translate.googleapis.com/v2
TRANSLATION_VALIDATION_WEBHOOK=https://api.epercept.fr/webhooks/translation-validation

# *** Guest Session Management ***
GUEST_SESSION_DURATION_MS=86400000 # 24 hours
GUEST_DATA_RETENTION_HOURS=24
CONVERSION_REMINDER_INTERVAL_GAMES=3

# *** Monitoring & Analytics ***
ENABLE_AUTH_AUDIT=true
AUTH_AUDIT_RETENTION_DAYS=90
SECURITY_ALERT_WEBHOOK=https://hooks.slack.com/your-security-webhook
ANALYTICS_TRACKING_ID=your-analytics-id

# Production Overrides
DATABASE_URL=postgresql://prod-user:secure-pass@prod-host:5432/epercept
REDIS_URL=redis://:redis-password@prod-redis:6379
GOOGLE_CALLBACK_URL=https://api.epercept.fr/api/v1/auth/oauth/google/callback
FACEBOOK_CALLBACK_URL=https://api.epercept.fr/api/v1/auth/oauth/facebook/callback
APPLE_CALLBACK_URL=https://api.epercept.fr/api/v1/auth/oauth/apple/callback
EMAIL_BASE_URL=https://epercept.fr
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### 14.2 Scripts et commandes

#### Package.json principal
```json
{
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "start": "turbo run start",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "test:e2e": "turbo run test:e2e",
    "typecheck": "turbo run typecheck",
    "clean": "turbo run clean",
    
    "db:migrate": "cd apps/api && npx prisma migrate dev",
    "db:generate": "cd apps/api && npx prisma generate",
    "db:studio": "cd apps/api && npx prisma studio",
    "db:seed": "cd apps/api && npx prisma db seed",
    
    "deploy:staging": "vercel --target staging",
    "deploy:production": "vercel --target production",
    
    "docker:build": "docker build -t epercept .",
    "docker:run": "docker run -p 3000:3000 -p 5001:5001 epercept"
  }
}
```

#### Scripts de déploiement
```bash
#!/bin/bash
# deploy.sh

echo "🚀 Déploiement Epercept"

# Vérifications pré-déploiement
echo "📋 Vérifications..."
npm run typecheck
npm run lint
npm run test

# Build
echo "🔨 Construction..."
npm run build

# Base de données
echo "🗄️ Migration base de données..."
npm run db:migrate

# Déploiement
echo "☁️ Déploiement cloud..."
if [ "$1" = "production" ]; then
  npm run deploy:production
else
  npm run deploy:staging
fi

echo "✅ Déploiement terminé !"
```

### 14.3 Checklist de déploiement

#### Pré-déploiement
- [ ] Tests unitaires passent (npm run test)
- [ ] Tests E2E passent (npm run test:e2e)
- [ ] Linting clean (npm run lint)
- [ ] TypeScript check (npm run typecheck)
- [ ] Build réussit (npm run build)
- [ ] Variables d'environnement configurées
- [ ] Base de données migrée
- [ ] Redis accessible

#### Post-déploiement
- [ ] Health check API répond
- [ ] WebSocket connecte correctement
- [ ] Création de partie fonctionne
- [ ] Jointure de partie fonctionne
- [ ] Flow de jeu complet testé
- [ ] Déconnexion/reconnexion testée
- [ ] Monitoring actif
- [ ] Logs disponibles

## Conclusion

Ce document fournit toutes les spécifications nécessaires pour développer Epercept from scratch :

✅ **Spécifications fonctionnelles complètes** avec exigences de robustesse
✅ **Architecture technique moderne** (Next.js + NestJS + PostgreSQL)
✅ **Parcours utilisateur détaillé** avec tous les écrans et interactions
✅ **Design system complet** avec composants et thèmes
✅ **Spécifications de performance** et monitoring intégré
✅ **Tests exhaustifs** pour assurer la qualité
✅ **Configuration de déploiement** production-ready

### Vision du produit

Epercept est conçu comme un jeu social moderne qui permet aux joueurs de mieux se connaître à travers des questions personnelles et des devinettes en temps réel. L'application vise à créer des moments de connexion authentique entre amis, famille ou collègues.

### Avantages de l'architecture proposée

**Robustesse** : Gestion native de la synchronisation temps réel, reconnexion automatique, cohérence des états

**Scalabilité** : Architecture microservices permettant de supporter des milliers de joueurs simultanés

**Maintenabilité** : Code TypeScript strict, tests automatisés, monitoring intégré

**Expérience utilisateur** : Interface responsive, feedback visuel clair, progression fluide

### Recommandations pour le développement

Le succès du projet repose sur :
- Développement itératif avec MVP fonctionnel rapide
- Tests rigoureux à chaque étape
- Monitoring proactif dès la mise en production
- Attention constante à l'expérience utilisateur temps réel

Cette architecture moderne permet de créer une application web professionnelle, évolutive et engageante qui répond aux attentes actuelles des utilisateurs en matière de jeu social en ligne.