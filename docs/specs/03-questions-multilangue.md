## 3. Questions et contenu multilingue

### 3.1 Architecture multilingue des questions

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

### 3.2 Système de sélection des questions par langue

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

### 3.3 Base de données questions multilingues

#### Structure du fichier epercept-questions-database.md transformé

**Nouveau format JSON hiérarchique par langue :**

```json
{
  "metadata": {
    "version": "2.0.0",
    "languages": ["fr", "en", "es", "it", "pt", "de"],
    "defaultLanguage": "fr",
    "totalSourceQuestions": "{{DYNAMIC_TOTAL}}", // Calculé dynamiquement depuis DB
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
      "personality": "{{DYNAMIC_PERSONALITY_COUNT}}", // Calculé depuis DB
      "situations": "{{DYNAMIC_SITUATIONS_COUNT}}", // Calculé depuis DB
      "representations": "{{DYNAMIC_REPRESENTATIONS_COUNT}}", // Calculé depuis DB
      "relations": "{{DYNAMIC_RELATIONS_COUNT}}" // Calculé depuis DB
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
          "sourceId": 2, // CORRIGÉ: Éviter IDs hardcodés spécifiques
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

### 3.4 Processus de traduction et validation

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

### 3.5 Cohérence culturelle et qualité

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