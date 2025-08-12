# Design Tokens - Source Unique de Vérité

## ⚠️ RÉFÉRENCE ABSOLUE
Ce fichier définit tous les design tokens utilisés dans l'application Epercept. 
**JAMAIS** de duplication - tous les fichiers doivent référencer ces valeurs.

## 🎨 Couleurs système

### Palette principale
```css
:root {
  /* Couleurs principales */
  --primary: #6366F1;      /* Indigo moderne - Utilisé partout */
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

## 🏗️ Applications des tokens

### HTML Meta tags
```html
<meta name="theme-color" content="var(--primary)" />
```

### PWA Manifest
```json
{
  "background_color": "var(--background)",
  "theme_color": "var(--primary)"
}
```

### Composants React/Vue
```tsx
const Button = styled.button`
  background-color: var(--primary);
  color: var(--text);
`;
```

## 📱 Composants UI Standards

### Cards
- **Ombres**: `box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1)`
- **Bordures**: `border-radius: 0.5rem`
- **Background**: `var(--surface)`

### Boutons
- **Primary**: `background: var(--primary)`
- **Secondary**: `background: var(--secondary)`
- **Success**: `background: var(--success)`
- **Error**: `background: var(--error)`
- **Hover**: `opacity: 0.9`
- **Active**: `transform: scale(0.98)`

### Inputs
- **Border**: `1px solid var(--text-muted)`
- **Focus**: `border-color: var(--primary)`
- **Error**: `border-color: var(--error)`
- **Background**: `var(--surface)`

## 💬 Système de Feedback

### Messages d'erreur
```typescript
interface ErrorMessage {
  code: string;           // Clé i18n standardisée
  level: 'info' | 'warning' | 'error' | 'success';
  color: 'var(--error)' | 'var(--success)' | etc;
  duration: number;       // ms pour auto-dismiss
}
```

### États visuels
- **Loading**: Spinner avec `var(--primary)`
- **Success**: Icône checkmark avec `var(--success)`
- **Error**: Icône X avec `var(--error)`
- **Warning**: Icône triangle avec `var(--secondary)`

### Toast System
```typescript
const ToastConfig = {
  position: 'top-right',
  duration: 4000,
  maxVisible: 3,
  styles: {
    success: { backgroundColor: 'var(--success)' },
    error: { backgroundColor: 'var(--error)' },
    info: { backgroundColor: 'var(--primary)' },
    warning: { backgroundColor: 'var(--secondary)' }
  }
};
```

## 🔄 Références croisées

### Fichiers utilisant ces tokens
- `02-ux-ui-parcours.md` : Design system et métadonnées
- `public/manifest.json` : PWA configuration
- `index.html` : Meta tags
- `src/styles/globals.css` : Variables CSS
- `src/components/**` : Tous les composants UI

### Validation
- ❌ **Jamais** de couleurs hardcodées (`#6366F1`)
- ✅ **Toujours** utiliser les variables CSS (`var(--primary)`)
- ✅ **Toujours** référencer ce fichier pour nouveaux tokens
- ✅ **Toujours** tester cohérence visuelle sur tous les devices

## 🎯 A/B Testing Framework

### Structure uniforme
```typescript
interface VariantConfig {
  name: string;
  tokens: Partial<DesignTokens>;
  messages: Record<string, string>;
  probability: number; // 0-1
}

const variants: VariantConfig[] = [
  {
    name: 'default',
    tokens: { '--primary': '#6366F1' },
    messages: { 'welcome': 'Bienvenue sur Epercept' },
    probability: 0.5
  },
  {
    name: 'variant_blue',
    tokens: { '--primary': '#3B82F6' },
    messages: { 'welcome': 'Découvrez Epercept' },
    probability: 0.5
  }
];
```

### Métriques A/B Testing
- Conversion invité → utilisateur
- Engagement parties créées
- Temps de session
- Satisfaction utilisateur (NPS)