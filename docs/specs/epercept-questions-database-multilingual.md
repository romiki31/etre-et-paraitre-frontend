# Base de données multilingue des questions Epercept

## Métadonnées générales

```json
{
  "metadata": {
    "version": "2.0.0",
    "format": "multilingual-hierarchical",
    "languages": ["fr", "en", "es", "it", "pt", "de"],
    "defaultLanguage": "fr",
    "totalSourceQuestions": 320,
    "translationCompleteness": {
      "fr": 100.0,
      "en": 0.0,
      "es": 0.0, 
      "it": 0.0,
      "pt": 0.0,
      "de": 0.0
    },
    "lastUpdated": "2024-01-15T00:00:00Z",
    "rounds": {
      "personality": 65,
      "situations": 64,
      "representations": 107,
      "relations": 84
    },
    "translationWorkflow": {
      "status": "initialization",
      "priorityLanguages": ["en", "es"],
      "translationPartners": [],
      "validationRequired": true
    }
  }
}
```

## Structure multilingue des questions

### Questions source (Français - 100% complet)

#### Round 1 - Personnalité (65 questions)

```json
{
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
      "difficulty": "easy",
      "metadata": {
        "culturalContext": "Question sur la perception de l'amitié en contexte français",
        "translationNotes": "Attention aux expressions idiomatiques avec les doigts",
        "tags": ["amitié", "social", "quantification"]
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
      "difficulty": "medium",
      "metadata": {
        "culturalContext": "Introspection sur le rapport à l'image de soi",
        "translationNotes": "Garder la nuance comparative",
        "tags": ["image", "introspection", "comparaison"]
      }
    },
    {
      "sourceId": 3,
      "text": "Mens-tu ?",
      "options": [
        "Plus que la plupart des gens",
        "Moins que la plupart des gens"
      ],
      "category": "morale-ethique",
      "difficulty": "hard",
      "metadata": {
        "culturalContext": "Question directe sur l'honnêteté personnelle",
        "translationNotes": "Verbe 'mentir' peut avoir des connotations différentes selon les cultures",
        "tags": ["honnêteté", "morale", "comparaison"],
        "sensitivityLevel": "medium"
      }
    }
    // ... 62 questions supplémentaires
  ]
}
```

#### Round 2 - Situations (64 questions)

```json
{
  "situations": [
    {
      "sourceId": 65,
      "text": "Tu as une opportunité de carrière exceptionnelle à l'étranger, mais cela signifierait laisser derrière toi ta famille et tes amis proches pour une période non négligeable. Que choisis-tu ?",
      "options": [
        "Je pars",
        "Je reste"
      ],
      "category": "dilemmes-carriere",
      "difficulty": "hard",
      "metadata": {
        "culturalContext": "Dilemme carrière vs famille, sensible aux valeurs culturelles",
        "translationNotes": "Adapter selon les normes de mobilité professionnelle locales",
        "tags": ["carrière", "famille", "sacrifice", "décision"],
        "sensitivityLevel": "high"
      }
    },
    {
      "sourceId": 66,
      "text": "Ton ami(e) a une altercation avec des inconnus. Prends-tu instinctivement son parti sachant qu'il/elle peut être en tort ?",
      "options": [
        "Je prends son parti",
        "Je reste en retrait"
      ],
      "category": "loyaute-amitie",
      "difficulty": "medium",
      "metadata": {
        "culturalContext": "Question sur la loyauté aveugle vs jugement moral",
        "translationNotes": "Expression 'prendre le parti' à adapter",
        "tags": ["loyauté", "amitié", "conflit", "moral"]
      }
    }
    // ... 62 questions supplémentaires
  ]
}
```

#### Round 3 - Représentations (107 questions)

```json
{
  "representations": [
    {
      "sourceId": 131,
      "text": "Qui serait le·la plus enclin·e à partir avant la fin du jeu à cause d'une réponse qui ne lui plaît pas ?",
      "options": null,
      "category": "traits-negatifs",
      "difficulty": "medium",
      "metadata": {
        "specialBehavior": "playerNames",
        "culturalContext": "Perception des réactions émotionnelles",
        "translationNotes": "Attention à l'écriture inclusive et à la notion de susceptibilité",
        "tags": ["émotions", "réactions", "abandon", "frustration"]
      }
    },
    {
      "sourceId": 140,
      "text": "Qui te semble être le·la plus satisfait·e de sa vie ?",
      "options": null,
      "category": "bien-etre",
      "difficulty": "easy",
      "metadata": {
        "specialBehavior": "playerNames",
        "culturalContext": "Perception du bonheur et de la satisfaction",
        "translationNotes": "Concept de satisfaction peut varier culturellement",
        "tags": ["bonheur", "satisfaction", "positivité"]
      }
    }
    // ... 105 questions supplémentaires
  ]
}
```

#### Round 4 - Relations (84 questions)

```json
{
  "relations": [
    {
      "sourceId": 247,
      "text": "La vie de quelle joueur/joueuse ne voudrais-tu pas mener ?",
      "options": null,
      "category": "questions-negatives",
      "difficulty": "hard",
      "metadata": {
        "specialBehavior": "playerNames",
        "culturalContext": "Question potentiellement sensible sur les choix de vie",
        "translationNotes": "Formuler avec tact pour éviter l'offense",
        "tags": ["choix-vie", "jugement", "négativité"],
        "sensitivityLevel": "very_high",
        "warningRequired": true
      }
    },
    {
      "sourceId": 263,
      "text": "Avec qui as-tu le plus de chances d'avoir encore des relations dans vingt ans ?",
      "options": null,
      "category": "questions-positives",
      "difficulty": "medium",
      "metadata": {
        "specialBehavior": "playerNames",
        "culturalContext": "Projection sur la durabilité des relations",
        "translationNotes": "Notion de 'relations' peut être ambiguë selon les langues",
        "tags": ["durabilité", "amitié", "futur", "prédiction"]
      }
    }
    // ... 82 questions supplémentaires
  ]
}
```

### Traductions (0% complet - Templates pour traducteurs)

#### Anglais (English) - 0% complet

```json
{
  "en": {
    "personality": [
      {
        "sourceId": 1,
        "text": "[À TRADUIRE] Tes vrais amis, tu les comptes ...",
        "options": [
          "[À TRADUIRE] Sur les doigts d'une main",
          "[À TRADUIRE] Sur les deux mains",
          "[À TRADUIRE] Tu n'as pas assez de doigts pour les compter",
          "[À TRADUIRE] Tu n'en as pas"
        ],
        "translationStatus": "pending",
        "translationNotes": "Expression idiomatique avec les doigts - adapter culturellement",
        "translatedBy": null,
        "validatedBy": null,
        "culturalAdaptation": "Vérifier l'usage des expressions avec 'fingers' en anglais"
      }
      // ... templates pour toutes les questions de personnalité
    ],
    "situations": [
      // ... templates pour les situations
    ],
    "representations": [
      // ... templates pour les représentations
    ],
    "relations": [
      // ... templates pour les relations
    ]
  }
}
```

#### Espagnol (Español) - 0% complet

```json
{
  "es": {
    "personality": [
      {
        "sourceId": 1,
        "text": "[POR TRADUCIR] Tes vrais amis, tu les comptes ...",
        "options": [
          "[POR TRADUCIR] Sur les doigts d'une main",
          "[POR TRADUCIR] Sur les deux mains",
          "[POR TRADUCIR] Tu n'as pas assez de doigts pour les compter",
          "[POR TRADUCIR] Tu n'en as pas"
        ],
        "translationStatus": "pending",
        "translationNotes": "Expresión idiomática con dedos - adaptar culturalmente",
        "translatedBy": null,
        "validatedBy": null,
        "culturalAdaptation": "Verificar uso de expresiones con 'dedos' en español"
      }
      // ... templates pour toutes les questions
    ]
    // ... autres rounds
  }
}
```

#### Italien (Italiano) - 0% complet
#### Portugais (Português) - 0% complet  
#### Allemand (Deutsch) - 0% complet

```json
{
  "it": { /* templates italien */ },
  "pt": { /* templates portugais */ },
  "de": { /* templates allemand */ }
}
```

## Workflow de traduction

### Étapes de traduction par langue

1. **Phase 1 - Export pour traducteurs**
   - Génération fichiers CSV/XLIFF par langue
   - Instructions contextuelles incluses
   - Métadonnées culturelles fournies

2. **Phase 2 - Traduction**
   - Traduction par locuteurs natifs
   - Adaptation culturelle (pas traduction littérale)
   - Respect des contraintes de longueur

3. **Phase 3 - Validation**
   - Révision par second locuteur natif
   - Tests de cohérence avec questions similaires
   - Validation gameplay (fluidité, compréhension)

4. **Phase 4 - Intégration**
   - Import dans base de données
   - Tests automatisés format et contraintes
   - Déploiement progressif par rounds

### Scripts de migration

```sql
-- Migration des questions existantes vers structure multilingue
INSERT INTO questions (sourceId, locale, text, options, roundType, category, isActive, translationStatus)
SELECT 
  id as sourceId,
  'fr' as locale,
  name as text,
  ARRAY[answer_1, answer_2, answer_3, answer_4]::json as options,
  CASE round_id 
    WHEN 1 THEN 'PERSONALITY'
    WHEN 2 THEN 'SITUATIONS' 
    WHEN 3 THEN 'REPRESENTATIONS'
    WHEN 4 THEN 'RELATIONS'
  END as roundType,
  'migrated' as category,
  true as isActive,
  'VALIDATED' as translationStatus
FROM legacy_questions
WHERE name IS NOT NULL;

-- Création des templates de traduction
INSERT INTO questions (sourceId, locale, text, options, roundType, category, isActive, translationStatus)
SELECT 
  sourceId,
  locale,
  '[À TRADUIRE] ' + text as text,
  options,
  roundType,
  category,
  false as isActive, -- Désactivé jusqu'à traduction
  'PENDING' as translationStatus
FROM questions q
CROSS JOIN (VALUES ('en'), ('es'), ('it'), ('pt'), ('de')) as locales(locale)
WHERE q.locale = 'fr';
```

### Outils de gestion des traductions

#### Export pour traducteurs
```bash
# Export CSV par langue et round
npm run translations:export --locale=en --round=personality --format=csv

# Export XLIFF complet
npm run translations:export --locale=es --format=xliff --include-context
```

#### Validation automatique
```bash
# Validation format et cohérence
npm run translations:validate --locale=en

# Test gameplay avec nouvelles traductions
npm run test:gameplay --locale=en --questions-only
```

#### Import traductions
```bash
# Import depuis fichier CSV
npm run translations:import --file=translations_en.csv --locale=en --validate

# Import avec approbation automatique
npm run translations:import --file=translations_es.csv --locale=es --auto-approve
```

## Métriques de qualité

### Indicateurs de complétude par langue

- **Français** : 320/320 questions (100%)
- **Anglais** : 0/320 questions (0%)
- **Espagnol** : 0/320 questions (0%)
- **Italien** : 0/320 questions (0%)
- **Portugais** : 0/320 questions (0%)
- **Allemand** : 0/320 questions (0%)

### Standards de qualité requis

1. **Précision linguistique** : 95% minimum
2. **Adaptation culturelle** : Validation par locuteurs natifs
3. **Cohérence terminologique** : Glossaire partagé entre traducteurs
4. **Fluidité gameplay** : Tests utilisateurs par langue
5. **Temps de réponse** : < 500ms pour chargement questions traduites

## Extensibilité future

### Ajout de nouvelles langues

La structure permet l'ajout facilité de nouvelles langues :

1. Ajout dans `SUPPORTED_LOCALES`
2. Génération automatique des templates
3. Workflow de traduction standardisé
4. Tests automatisés pour chaque nouvelle langue

### Gestion des variantes régionales

Possibilité d'ajouter des variantes (ex: en-US, en-GB, es-ES, es-MX) avec adaptations culturelles spécifiques.

---

**Note importante** : Ce document représente la structure cible pour le système multilingue d'Epercept. Les traductions seront ajoutées progressivement selon la demande utilisateur et les ressources de traduction disponibles.