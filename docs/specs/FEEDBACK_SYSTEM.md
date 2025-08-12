# Système de Feedback Unifié - Messages & Notifications

## ⚠️ COHÉRENCE GLOBALE
Ce système centralise tous les feedbacks utilisateur d'Epercept.
**Unification totale** entre UX, auth, jeu, erreurs et notifications.

## 💬 Architecture Messages

### Types de feedback
```typescript
enum FeedbackType {
  SUCCESS = 'success',    // Succès actions
  ERROR = 'error',        // Erreurs système
  WARNING = 'warning',    // Avertissements
  INFO = 'info',         // Informations
  LOADING = 'loading'     // États de chargement
}

enum FeedbackContext {
  AUTH = 'auth',              // Authentification
  GAME = 'game',              // Gameplay
  DASHBOARD = 'dashboard',     // Dashboard utilisateur
  CONVERSION = 'conversion',   // Invité → Utilisateur
  SYSTEM = 'system'           // Messages système
}
```

### Structure message uniforme
```typescript
interface FeedbackMessage {
  id: string;                    // Identifiant unique
  type: FeedbackType;            // Type de feedback
  context: FeedbackContext;      // Contexte d'origine
  i18nKey: string;              // Clé de traduction
  params?: Record<string, any>;  // Paramètres i18n
  duration?: number;             // Auto-dismiss (ms)
  persistent?: boolean;          // Message permanent
  actions?: FeedbackAction[];    // Actions possibles
  metadata?: any;               // Données contextuelles
}
```

## 🔐 Messages Authentification

### Codes d'erreur standardisés
```typescript
const AUTH_MESSAGES = {
  // Connexion
  'auth.login.success': {
    type: 'success',
    duration: 3000,
    i18n: { fr: 'Connexion réussie', en: 'Login successful' }
  },
  'auth.login.invalid_credentials': {
    type: 'error', 
    duration: 5000,
    i18n: { fr: 'Email ou mot de passe incorrect', en: 'Invalid email or password' }
  },
  'auth.login.account_locked': {
    type: 'warning',
    duration: 0, // Permanent
    i18n: { fr: 'Compte temporairement verrouillé', en: 'Account temporarily locked' }
  },

  // Inscription
  'auth.register.success': {
    type: 'success',
    duration: 5000,
    i18n: { fr: 'Compte créé avec succès. Vérifiez votre email.', en: 'Account created. Check your email.' }
  },
  'auth.register.email_exists': {
    type: 'error',
    duration: 5000,
    i18n: { fr: 'Cette adresse email est déjà utilisée', en: 'This email is already in use' }
  },

  // OAuth
  'auth.oauth.google.success': {
    type: 'success',
    duration: 3000,
    i18n: { fr: 'Connexion Google réussie', en: 'Google login successful' }
  },
  'auth.oauth.google.failed': {
    type: 'error',
    duration: 0,
    i18n: { fr: 'Échec connexion Google. Réessayez.', en: 'Google login failed. Try again.' }
  },
  'auth.oauth.facebook.cancelled': {
    type: 'info',
    duration: 4000,
    i18n: { fr: 'Connexion Facebook annulée', en: 'Facebook login cancelled' }
  },

  // Sessions
  'auth.session.expired': {
    type: 'warning',
    duration: 0,
    i18n: { fr: 'Session expirée. Reconnectez-vous.', en: 'Session expired. Please log in.' }
  }
};
```

## 🎮 Messages Gameplay

```typescript
const GAME_MESSAGES = {
  // Création partie
  'game.create.success': {
    type: 'success',
    duration: 3000,
    i18n: { fr: 'Partie créée ! PIN: {{pin}}', en: 'Game created! PIN: {{pin}}' }
  },
  'game.join.success': {
    type: 'success',
    duration: 2000,
    i18n: { fr: 'Vous avez rejoint la partie', en: 'You joined the game' }
  },
  'game.join.not_found': {
    type: 'error',
    duration: 4000,
    i18n: { fr: 'Aucune partie trouvée avec ce PIN', en: 'No game found with this PIN' }
  },
  'game.join.full': {
    type: 'error',
    duration: 5000,
    i18n: { fr: 'Partie complète ({{current}}/{{max}} joueurs)', en: 'Game full ({{current}}/{{max}} players)' }
  },

  // Pendant le jeu
  'game.round.start': {
    type: 'info',
    duration: 3000,
    i18n: { fr: 'Round {{round}} : {{type}}', en: 'Round {{round}}: {{type}}' }
  },
  'game.answer.submitted': {
    type: 'success',
    duration: 2000,
    i18n: { fr: 'Réponse enregistrée', en: 'Answer submitted' }
  },
  'game.waiting.players': {
    type: 'info',
    duration: 0,
    i18n: { fr: 'En attente des autres joueurs...', en: 'Waiting for other players...' }
  },

  // Déconnexions
  'game.connection.lost': {
    type: 'warning',
    duration: 0,
    i18n: { fr: 'Connexion perdue. Reconnexion...', en: 'Connection lost. Reconnecting...' }
  },
  'game.reconnection.success': {
    type: 'success',
    duration: 3000,
    i18n: { fr: 'Reconnecté avec succès', en: 'Successfully reconnected' }
  }
};
```

## 📊 Messages Dashboard

```typescript
const DASHBOARD_MESSAGES = {
  // Stats
  'dashboard.stats.updated': {
    type: 'success',
    duration: 2000,
    i18n: { fr: 'Statistiques mises à jour', en: 'Statistics updated' }
  },
  'dashboard.stats.loading': {
    type: 'loading',
    duration: 0,
    i18n: { fr: 'Chargement des statistiques...', en: 'Loading statistics...' }
  },

  // Profil
  'dashboard.profile.saved': {
    type: 'success',
    duration: 3000,
    i18n: { fr: 'Profil sauvegardé', en: 'Profile saved' }
  },
  'dashboard.profile.avatar.uploaded': {
    type: 'success',
    duration: 3000,
    i18n: { fr: 'Photo de profil mise à jour', en: 'Profile picture updated' }
  }
};
```

## 🔄 Messages Conversion Invité

```typescript
const CONVERSION_MESSAGES = {
  // Modal conversion
  'conversion.modal.title': {
    type: 'info',
    i18n: { fr: 'Sauvegardez vos exploits !', en: 'Save your achievements!' }
  },
  'conversion.stats.session': {
    type: 'info',
    i18n: { 
      fr: '{{games}} parties jouées, meilleur score: {{score}} points', 
      en: '{{games}} games played, best score: {{score}} points' 
    }
  },
  'conversion.success': {
    type: 'success',
    duration: 4000,
    i18n: { 
      fr: 'Compte créé ! {{games}} parties transférées', 
      en: 'Account created! {{games}} games transferred' 
    }
  },
  'conversion.postponed': {
    type: 'info',
    duration: 3000,
    i18n: { 
      fr: 'Conversion reportée. Reproposition dans 3 parties', 
      en: 'Conversion postponed. Will ask again in 3 games' 
    }
  }
};
```

## 🚨 Messages Système & Erreurs

```typescript
const SYSTEM_MESSAGES = {
  // Erreurs réseau
  'system.network.error': {
    type: 'error',
    duration: 0,
    i18n: { fr: 'Erreur de connexion. Vérifiez votre réseau.', en: 'Connection error. Check your network.' }
  },
  'system.server.error': {
    type: 'error',
    duration: 0,
    i18n: { fr: 'Erreur serveur. Réessayez plus tard.', en: 'Server error. Try again later.' }
  },

  // Maintenance
  'system.maintenance.scheduled': {
    type: 'warning',
    duration: 0,
    i18n: { 
      fr: 'Maintenance programmée dans {{time}} minutes', 
      en: 'Scheduled maintenance in {{time}} minutes' 
    }
  },

  // Mises à jour
  'system.update.available': {
    type: 'info',
    duration: 0,
    actions: [{ label: 'Actualiser', action: 'reload' }],
    i18n: { fr: 'Mise à jour disponible', en: 'Update available' }
  }
};
```

## 🎯 Toast System Configuration

### Configuration globale
```typescript
const TOAST_CONFIG = {
  // Positionnement
  position: 'top-right' as const,
  offset: { x: 16, y: 16 },
  
  // Comportement
  maxVisible: 3,
  stackSpacing: 8,
  
  // Durées par type
  defaultDurations: {
    success: 3000,
    error: 5000,
    warning: 4000,
    info: 4000,
    loading: 0  // Permanent jusqu'à dismiss manuel
  },
  
  // Animations
  animations: {
    enter: { duration: 300, ease: 'easeOut' },
    exit: { duration: 200, ease: 'easeIn' },
    move: { duration: 250, ease: 'easeInOut' }
  },

  // Styles (référence Design Tokens)
  styles: {
    success: { 
      backgroundColor: 'var(--success)', 
      color: 'var(--text)',
      borderLeft: '4px solid var(--success)'
    },
    error: { 
      backgroundColor: 'var(--error)', 
      color: 'var(--text)',
      borderLeft: '4px solid var(--error)'
    },
    warning: { 
      backgroundColor: 'var(--secondary)', 
      color: 'var(--text)',
      borderLeft: '4px solid var(--secondary)'
    },
    info: { 
      backgroundColor: 'var(--primary)', 
      color: 'var(--text)',
      borderLeft: '4px solid var(--primary)'
    },
    loading: {
      backgroundColor: 'var(--surface)',
      color: 'var(--text)',
      borderLeft: '4px solid var(--primary)'
    }
  }
};
```

## 🌍 Intégration Multilingue

### Service i18n pour messages
```typescript
class FeedbackI18nService {
  constructor(private locale: string = 'fr') {}
  
  getMessage(key: string, params?: Record<string, any>): string {
    const message = ALL_MESSAGES[key];
    if (!message) return key; // Fallback
    
    let text = message.i18n[this.locale] || message.i18n.fr; // Fallback français
    
    // Remplacement paramètres {{param}}
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        text = text.replace(new RegExp(`{{${param}}}`, 'g'), String(value));
      });
    }
    
    return text;
  }
}
```

### Validation messages
```typescript
interface MessageValidation {
  hasAllLanguages: boolean;    // fr, en, es, it, pt, de
  hasValidParams: boolean;     // Paramètres {{}} cohérents
  hasUniqueKeys: boolean;      // Pas de doublons
  followsNaming: boolean;      // Convention context.action.result
}
```

## 🧪 Tests Feedback System

### Tests unitaires requis
```typescript
describe('FeedbackSystem', () => {
  test('should display success message with correct styling', () => {
    // Validation couleurs, durée, i18n
  });
  
  test('should handle i18n parameters correctly', () => {
    // Test remplacement {{param}}
  });
  
  test('should fallback to French for missing translations', () => {
    // Test fallback multilingue
  });
  
  test('should respect max visible toast limit', () => {
    // Test stack management
  });
});
```

## 🔗 Références Croisées

### Fichiers impactés
- `02-ux-ui-parcours.md` : UX feedback, OAuth, conversion
- `DESIGN_TOKENS.md` : Couleurs et styles des toasts
- `ENV_VARIABLES.md` : Configuration i18n
- `03-questions-multilangue.md` : Langues supportées

### Standards respectés
- ✅ Codes d'erreur i18n standardisés
- ✅ Durées cohérentes par type de message  
- ✅ Couleurs référencées depuis Design Tokens
- ✅ Fallback français pour toutes les langues
- ✅ Framework A/B testing pour variants de messages
- ✅ Cohérence OAuth providers (Google, Facebook, Apple)

### Métriques tracking
- Taux d'erreur par contexte
- Temps de résolution des erreurs
- Conversion modal → compte utilisateur
- Efficacité messages A/B variants