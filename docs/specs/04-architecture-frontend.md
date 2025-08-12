## 4. Architecture Frontend - Next.js 14

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
// ALIGNÉ AVEC BACKEND - Types partagés
interface AuthContextType {
  user: User | null; // User du schéma Prisma backend
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (data: RegisterDto) => Promise<AuthResponse>; // DTO du backend
  logout: () => Promise<void>;
  refreshToken: () => Promise<AuthResponse>;
  convertGuest: (data: ConvertGuestDto) => Promise<ConversionResponse>; // DTO du backend
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
  onConvert: (data: ConvertGuestDto) => void; // Aligné avec backend DTO
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
  title: 'Epercept - Découvrez-vous entre amis',
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
    title: 'Epercept - Découvrez-vous entre amis',
    description: 'Plongez dans une expérience où vos perceptions et celles des autres se confrontent.',
    url: 'https://epercept.app',
    siteName: 'Epercept',
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
    title: 'Epercept - Découvrez-vous entre amis',
    description: 'Plongez dans une expérience où vos perceptions et celles des autres se confrontent.',
    images: ['/epercept_logo.png']
  },
  
  // Mobile et PWA
  themeColor: '#6366F1',
  viewport: 'width=device-width, initial-scale=1',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Epercept'
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
├── epercept_logo.svg          # Existant - icône vectorielle
├── epercept_logo.png          # Existant - source haute résolution
├── manifest.json              # Web App Manifest
└── robots.txt                 # SEO
```

**Script de génération automatique des icônes :**
```typescript
// scripts/generate-icons.ts
import sharp from 'sharp';
import { writeFileSync } from 'fs';

async function generateIcons() {
  const source = './public/epercept_logo.png';
  
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

### 4.1 Spécifications techniques critiques

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

// Timer automatique en 3 phases - ALIGNÉ AVEC STANDARDS
interface TimerSystem {
  // Phase 1: Réponse du joueur actif - PAS de timer
  answeringPhase: {
    hasTimer: false;
  };
  
  // Phase 2: Début des devinettes - PAS de timer initial
  guessingPhase: {
    initialTimer: false;
  };
  
  // Phase 3: Timer déclenché après première devinette
  activatedTimer: {
    trigger: 'first_guess_submitted';
    duration: 30000; // 30 secondes exactement
    appliesTo: 'remaining_guessers';
    autoAdvance: true;
  };
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

### 4.2 Types partagés Frontend/Backend

#### Interfaces d'authentification
```typescript
// shared/types/auth.types.ts
interface AuthResponse {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
  message?: string;
}

interface ConversionResponse extends AuthResponse {
  transferredData: TransferResult;
}

interface SafeUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt: Date | null;
  profile?: UserProfile;
  statistics?: UserStatistics;
}

interface TransferResult {
  gamesCount: number;
  statsTransferred: boolean;
  transferredGames: string[];
}
```

#### Interfaces de session
```typescript
// shared/types/session.types.ts
interface GuestSessionStats {
  gamesPlayed: number;
  bestScore: number;
  averagePosition: number;
  totalPoints: number;
  winRate: number;
  favoriteRoundType?: string;
}

interface GuestSession {
  sessionId: string;
  locale: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
}

interface AuthenticatedUser extends SafeUser {
  userId: string;
  avatar?: string;
}
```

#### DTOs partagés
```typescript
// shared/dto/auth.dto.ts
interface RegisterDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  acceptTerms: boolean;
}

interface LoginDto {
  email: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

interface ConvertGuestDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  guestSessionId: string;
  acceptTerms: boolean;
}

interface ResetPasswordDto {
  token: string;
  newPassword: string;
}
```

#### Interfaces de jeu
```typescript
// shared/types/game.types.ts
interface GameResponse {
  game: Game;
  player: Player;
}

interface JoinGameResponse extends GameResponse {
  rejoined: boolean;
}

interface GameStateResponse {
  game: {
    id: string;
    pin: string;
    status: GameStatus;
    currentRound: number;
    currentTurn: number;
    locale: string;
    maxPlayers: number;
    startedAt: Date | null;
    lastActivity: Date;
  };
  players: Player[];
  currentPlayer: Player;
  currentQuestion: Question | null;
  canAdvance: boolean;
  isMyTurn: boolean;
}

interface CreateGameDto {
  maxPlayers?: number; // Défaut: 7
  locale?: string; // Défaut: 'fr'
  allowGuests?: boolean; // Défaut: true
  gameMode?: GameMode; // Défaut: 'CLASSIC'
  username?: string; // Pour invités
  settings?: any;
}

interface JoinGameDto {
  username: string;
  locale?: string;
}
```