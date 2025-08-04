# Document 1/7 : Spécifications Fonctionnelles et Règles Métier - Projet Epercept

## Scope de ce document
Ce document contient toutes les spécifications fonctionnelles, règles métier, contenus textuels et logique de jeu nécessaires pour développer l'application Epercept from scratch. Il définit CE QUE l'application doit faire, sans détailler le COMMENT technique.

## Autres documents du projet
- Document 2/7 : Design System et Expérience Utilisateur
- Document 3/7 : Architecture Backend  
- Document 4/7 : Architecture Frontend
- Document 5/7 : Sécurité, Tests et DevOps
- Document 6/7 : Performance et Scalabilité
- Document 7/7 : Administration et Configuration

---

## 1. Bugs critiques à NE PAS reproduire

### ⚠️ Problèmes de synchronisation
- **Gestion des ex aequo** : Le classement doit gérer correctement les égalités de points avec un système de départage (timestamp du dernier point)
- **États incohérents** : Ne jamais afficher "En attente des autres joueurs" si tous ont déjà répondu
- **Reconnexion défaillante** : La reconnexion doit restaurer l'état exact du jeu, pas revenir en arrière
- **Sortie de joueur** : La déconnexion d'un joueur ne doit JAMAIS faire crasher la partie

### ⚠️ Problèmes d'interface critique
- **Mini-classement biaisé** : Afficher correctement le Top 3 même avec des égalités
- **Lisibilité** : Garantir le contraste des textes sur tous les fonds colorés
- **Feedback visuel confus** : Séparer clairement les feedbacks : vert pour bonne réponse, rouge pour mauvaise (jamais les deux)
- **Mobile** : Implémenter un auto-scroll pour éviter que le clavier masque les champs

### ⚠️ Problèmes UX majeurs
- **Dépendance au maître de jeu** : Le dernier joueur à répondre déclenche automatiquement la suite
- **Pas de timer** : Timer de 30 secondes pour la phase de devinettes
- **Pas de continuité** : Permettre d'enchaîner les parties avec conservation des scores

## 2. Logique métier et concepts principaux

### 2.1 Concepts de base

#### Game (Partie)
- PIN unique à 6 chiffres pour rejoindre
- 3 à 7 joueurs maximum
- 4 rounds thématiques
- Statuts : WAITING, IN_PROGRESS, FINISHED

#### Player (Joueur)
- Username unique dans la partie
- Points accumulés
- Position/classement
- États : connecté, déconnecté (avec grace period 2 min), abandonné

#### Round (Manche)
4 types thématiques dans l'ordre :
1. **Personnalité** : Questions introspectives
2. **Situations** : Réactions dans des contextes
3. **Représentations** : Comment on se voit/est vu  
4. **Relations** : Interactions avec les autres

#### Question
- 2 à 4 options de réponse
- Pas de bonne/mauvaise réponse (subjectif)
- Liées à un type de round

### 2.2 Flux de jeu complet

#### Phase 1 : Création et lobby
1. Un joueur crée une partie → génération PIN 6 chiffres
2. Créateur saisit son pseudo
3. Autres joueurs rejoignent avec PIN + pseudo
4. Démarrage automatique à 3 joueurs minimum
5. Maximum 7 joueurs

#### Phase 2 : Déroulement d'un tour
1. Un joueur est désigné "joueur actif" pour ce tour
2. Il voit une question et choisit sa réponse (pas de timer)
3. Les autres joueurs voient la question et devinent sa réponse
4. Timer de 30s démarre après la première devinette soumise
5. Révélation : affichage de la bonne réponse et qui a trouvé
6. Attribution des points : +1 par bonne devinette
7. Le dernier à répondre déclenche automatiquement le tour suivant

#### Phase 3 : Fin de partie
1. Après 4 rounds complets (tous les joueurs ont répondu)
2. Classement final avec gestion des ex aequo
3. Options : rejouer avec mêmes joueurs ou terminer

### 2.3 Règles spéciales

#### Gestion des déconnexions
- Joueur déconnecté garde sa place 2 minutes
- Peut se reconnecter avec le même pseudo
- Après 2 minutes : considéré comme abandonné
- La partie continue sans lui (redistribution des questions)

#### Système de points
- 1 point par bonne devinette
- Pas de points pour sa propre réponse
- En cas d'égalité : départage par timestamp du dernier point gagné

#### Auto-progression
- Plus de "maître de jeu"
- Le dernier joueur à soumettre déclenche la suite
- Si timer expire : passage automatique

## 3. Contenu du jeu et questions

### 3.1 Vue d'ensemble
- **Total** : 320 questions réparties en 4 rounds
- **Distribution** :
  - Round 1 (Personnalité) : 65 questions
  - Round 2 (Situations) : 64 questions  
  - Round 3 (Représentations) : 107 questions
  - Round 4 (Relations) : 84 questions

### 3.2 Format des questions

#### Round 1 - Personnalité
Questions sur les valeurs, préférences et traits de caractère.
- Format : 2-4 options
- Exemple : "Tes vrais amis, tu les comptes..."
  - Sur les doigts d'une main
  - Sur les doigts de deux mains
  - Il m'en faut pas mal pour faire le tri
  - Ils sont légion

#### Round 2 - Situations  
Dilemmes et choix dans des situations hypothétiques.
- Format : Principalement 2 options (binaire)
- Exemple : "Tu as une opportunité de carrière exceptionnelle à l'étranger, mais cela signifierait laisser derrière toi ta famille et tes amis proches. Que choisis-tu ?"
  - Je pars
  - Je reste

#### Round 3 - Représentations
Questions sur la perception des autres joueurs.
- Format : Réponses = noms des joueurs
- Exemple : "Qui serait le·la plus enclin·e à partir avant la fin du jeu à cause d'une réponse qui ne lui plaît pas ?"

#### Round 4 - Relations
Questions sur les relations entre les joueurs.
- Format : Réponses = noms des joueurs
- Exemple : "Avec qui te sens-tu le plus en sécurité ?"

### 3.3 Base de données des questions
Les 320 questions complètes sont disponibles dans le fichier `epercept-questions-database.md` (voir Document 7/7 pour référence).

## 4. Textes d'interface et wording

### 4.1 Page d'accueil

#### Introduction
"Avec Percept, plongez dans une expérience où vos perceptions et celles des autres se confrontent.

Jouez et découvrez comment vos amis vous voient et s'ils sont tels que vous les imaginez !

Si vous voulez gagner, il faudra cerner qui se cache derrière les masques que les autres joueurs portent… parfois même sans s'en apercevoir.

**Pourquoi vous allez adorer ?**
Au-delà du jeu, l'intérêt réside dans les discussions qui en découlent. Débriefez les réponses, essayez de comprendre les choix des uns et des autres, et découvrez des facettes inattendues de vos amis ou de votre famille.

À vous de jouer !"

#### Règles du jeu
"**Le but du jeu :**
Accumulez des points en devinant les réponses des autres joueurs. Attention, pas de points en jeu pour votre propre réponse, alors soyez **honnête et spontané**.

**Comment ça marche ?**
1. À chaque tour, un joueur tire une question et y répond.
2. Les autres joueurs doivent deviner sa réponse.
3. Le questionné change à chaque tour.
4. La partie se joue en **4 manches**, chacune avec un type de question différent pour varier les surprises !

**Accordez vous sur les termes et le contexte des questions avant d'y répondre**

**Pour 4 à 7 joueurs**"

#### Texte d'accueil principal
"Bienvenue !

Commencez une nouvelle partie ou rejoignez une partie existante en entrant le code PIN généré par le créateur de la partie"

### 4.2 Messages système

#### Messages d'erreur
```
INVALID_PIN: "Code PIN invalide"
GAME_NOT_FOUND: "Partie non trouvée"
USERNAME_TAKEN: "Ce pseudo est déjà utilisé dans cette partie. Veuillez choisir un autre pseudo."
INVALID_USERNAME: "Insérez un pseudo valide"
CONNECTION_LOST: "Connexion perdue. Reconnexion en cours..."
RECONNECTION_FAILED: "Impossible de se reconnecter. Veuillez rafraîchir la page."
SERVER_ERROR: "Une erreur inattendue est survenue"
GAME_FULL: "Cette partie est complète (7 joueurs maximum)"
GAME_IN_PROGRESS: "Cette partie a déjà commencé"
NOT_ENOUGH_PLAYERS: "Il faut au moins 3 joueurs pour commencer"
ANSWER_TIMEOUT: "Temps écoulé ! Votre réponse n'a pas été prise en compte"
PLAYER_DISCONNECTED: "{username} s'est déconnecté(e)"
WAITING_RECONNECTION: "En attente de la reconnexion de {username}..."
GAME_ABANDONED: "Trop de joueurs déconnectés. Partie annulée."
```

#### Messages de statut
```
WAITING_PLAYERS: "En attente des autres joueurs..."
WAITING_ANSWER: "{username} est en train de répondre..."
WAITING_GUESSES: "En attente des devinettes..."
REVEALING_ANSWERS: "Révélation des réponses..."
CALCULATING_SCORES: "Calcul des scores..."
NEXT_ROUND: "Manche suivante dans 3 secondes..."
NEXT_TURN: "Tour suivant..."
GAME_ENDING: "Fin de partie..."
TIME_REMAINING: "Temps restant : {seconds}s"
LAST_CHANCE: "Plus que 10 secondes !"
TIMES_UP: "Temps écoulé !"
CORRECT_ANSWER: "Bonne réponse ! +1 point"
WRONG_ANSWER: "Mauvaise réponse"
NO_ANSWER: "Pas de réponse"
PERFECT_ROUND: "Tous ont trouvé ! Manche parfaite !"
```

#### Boutons et actions
```
START_GAME: "Commencer la partie"
JOIN_GAME: "Rejoindre"
CREATE_GAME: "Créer une partie"
NEXT: "Suivant"
CONTINUE: "Continuer"
BACK: "Retour"
SUBMIT_ANSWER: "Valider ma réponse"
SUBMIT_GUESS: "Valider ma devinette"
SHOW_RESULTS: "Voir les résultats"
NEXT_TURN: "Tour suivant"
NEXT_ROUND: "Manche suivante"
PLAY_AGAIN: "Rejouer"
NEW_GAME: "Nouvelle partie"
VIEW_STATS: "Voir les statistiques"
SHARE_RESULTS: "Partager les résultats"
LEAVE_GAME: "Quitter la partie"
SHOW_RANKING: "Voir le classement"
HIDE_RANKING: "Masquer le classement"
TOGGLE_SOUND: "Son ON/OFF"
```

### 4.3 Messages de fin de partie

#### Résultats
```
WINNER_SINGLE: "🏆 {username} remporte la partie !"
WINNER_MULTIPLE: "🏆 Égalité ! {usernames} remportent la partie !"
FINAL_RANKING: "Classement final"
PERSONAL_STATS: "Vos statistiques"
QUESTIONS_ANSWERED: "Questions posées : {count}"
CORRECT_GUESSES: "Bonnes devinettes : {count}/{total}"
ACCURACY_RATE: "Taux de réussite : {percentage}%"
FAVORITE_ROUND: "Manche préférée : {roundName}"
BEST_GUESSER: "Meilleur devineur : {username}"
MOST_PREDICTABLE: "Plus prévisible : {username}"
MOST_SURPRISING: "Plus surprenant : {username}"
SESSION_STATS: "Statistiques de la session"
GAMES_PLAYED: "Parties jouées : {count}"
CUMULATIVE_SCORE: "Score cumulé : {score} points"
CONTINUE_SESSION: "Continuer la session"
END_SESSION: "Terminer la session"
```

## 5. États et transitions du jeu

### 5.1 États d'une partie
1. **WAITING** : En attente de joueurs (3 minimum)
2. **IN_PROGRESS** : Partie en cours
3. **PAUSED** : En pause (trop de déconnexions)
4. **FINISHED** : Partie terminée
5. **ABANDONED** : Partie abandonnée

### 5.2 États d'un round
1. **PENDING** : En attente de démarrage
2. **ANSWERING** : Joueur actif répond
3. **GUESSING** : Autres joueurs devinent (timer 30s)
4. **REVEALING** : Révélation des résultats
5. **FINISHED** : Round terminé

### 5.3 États d'un joueur
1. **CONNECTED** : Joueur actif
2. **DISCONNECTED** : Déconnecté temporairement (2 min grace)
3. **RECONNECTING** : En cours de reconnexion
4. **ABANDONED** : A quitté définitivement

## 6. Règles de calcul et algorithmes

### 6.1 Attribution des points
```
SI joueur a deviné correctement la réponse du joueur actif
ALORS joueur.points += 1
     joueur.lastPointTimestamp = maintenant()
```

### 6.2 Classement avec gestion ex aequo
```
TRIER joueurs PAR :
  1. points DESC
  2. SI points égaux : lastPointTimestamp ASC
  
POUR chaque joueur :
  SI joueur.points != joueurPrécédent.points
  ALORS joueur.position = index + 1
  SINON joueur.position = joueurPrécédent.position
```

### 6.3 Sélection du prochain joueur
```
ordre_joueurs = joueurs triés par ordre de jointure
tour_actuel = numéro du tour dans le round
prochain_joueur = ordre_joueurs[tour_actuel % nombre_joueurs]
```

### 6.4 Conditions de fin
```
Fin de round : tous les joueurs ont été "joueur actif" une fois
Fin de partie : 4 rounds complets terminés
```

## 7. Contraintes fonctionnelles

### 7.1 Limites
- PIN : 6 chiffres exactement
- Pseudo : 2-50 caractères, alphanumérique + espaces
- Joueurs : minimum 3, maximum 7
- Timer devinettes : 30 secondes fixes
- Reconnexion : fenêtre de 2 minutes
- Questions : pas de répétition dans une même session

### 7.2 Règles métier strictes
- Un joueur ne peut pas gagner de points sur sa propre question
- Le dernier répondant déclenche toujours la progression
- Pas de modification des réponses une fois soumises
- Les déconnexions ne bloquent jamais la partie
- L'ordre des rounds est toujours : Personnalité → Situations → Représentations → Relations

### 7.3 Comportements automatiques
- Démarrage automatique à 3 joueurs
- Passage automatique si timer expire
- Redistribution des tours si un joueur abandonne
- Sauvegarde de l'état pour reconnexion
- Nettoyage des parties inactives après 30 minutes

---

**Note** : Ce document se concentre uniquement sur les spécifications fonctionnelles. Pour l'implémentation technique, se référer aux documents 3 (Backend) et 4 (Frontend). Pour l'interface utilisateur, voir le document 2 (Design System et UX).