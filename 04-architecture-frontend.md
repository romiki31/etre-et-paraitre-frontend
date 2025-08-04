# Document 4/7 : Architecture Frontend - Projet Epercept

## Scope de ce document
Ce document définit l'architecture frontend complète pour l'application Epercept, incluant Next.js 14, Zustand pour l'état, WebSocket client et composants React optimisés. Il couvre le COMMENT technique du client pour implémenter l'interface définie dans le Document 2.

## Autres documents du projet
- Document 1/7 : Spécifications Fonctionnelles et Règles Métier ✓
- Document 2/7 : Design System et Expérience Utilisateur ✓
- Document 3/7 : Architecture Backend ✓
- Document 5/7 : Sécurité, Tests et DevOps
- Document 6/7 : Performance et Scalabilité
- Document 7/7 : Administration et Configuration

---

## 1. Next.js 14 - Framework Frontend

### 1.1 Pourquoi Next.js 14?
- **App Router** : Routing moderne avec Server Components
- **Performance** : Optimisations automatiques (Image, Font, Bundle)
- **Real-time** : Support WebSocket intégré
- **SEO** : SSR pour page d'accueil
- **TypeScript** : Support natif excellent

### 1.2 Structure proposée
```
apps/web/
├── app/
│   ├── (marketing)/        # Pages publiques
│   │   ├── page.tsx       # Accueil
│   │   └── layout.tsx     # Layout marketing
│   ├── game/
│   │   ├── [pin]/         # Routes dynamiques
│   │   │   ├── lobby/
│   │   │   ├── play/
│   │   │   └── results/
│   │   └── layout.tsx     # Layout jeu
│   └── api/               # API routes
├── components/
│   ├── ui/                # Composants shadcn/ui
│   ├── game/              # Composants métier
│   └── shared/            # Composants partagés
├── lib/
│   ├── store.ts           # Zustand store
│   ├── socket.ts          # Client Socket.io
│   └── utils.ts           # Helpers
└── styles/
    └── globals.css        # Tailwind + custom
```

## 2. Spécifications techniques critiques

### 2.1 Résolution des bugs de synchronisation

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

### 2.2 Gestion mobile avec auto-scroll

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

### 2.3 Nouveau système de classement équilibré

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

## 3. État management - Zustand

### 3.1 Pourquoi Zustand?
- **Simplicité** : API minimaliste vs MobX
- **Performance** : Renders optimisés
- **TypeScript** : Inférence de types excellente
- **DevTools** : Support Redux DevTools
- **Taille** : ~8KB vs ~60KB MobX

### 3.2 Store principal du jeu

```typescript
interface GameStore {
  // État principal
  game: Game | null;
  player: Player | null;
  connection: ConnectionStatus;
  currentRound: GameRound | null;
  timer: TimerState | null;
  
  // État UI
  isLoading: boolean;
  error: string | null;
  notifications: Notification[];
  
  // Actions synchrones
  setGame: (game: Game) => void;
  setPlayer: (player: Player) => void;
  updatePlayerPoints: (playerId: string, points: number) => void;
  updateConnection: (status: ConnectionStatus) => void;
  updateTimer: (timer: TimerState) => void;
  
  // Actions asynchrones
  createGame: (username: string) => Promise<void>;
  joinGame: (pin: string, username: string) => Promise<void>;
  submitAnswer: (answer: string) => Promise<void>;
  submitGuess: (guess: string) => Promise<void>;
  leaveGame: () => Promise<void>;
  
  // WebSocket handlers
  handlePlayerJoined: (player: Player) => void;
  handlePlayerLeft: (playerId: string) => void;
  handleRoundStarted: (round: GameRound) => void;
  handleAnswerSubmitted: (answer: Answer) => void;
  handleAnswerRevealed: (answers: Answer[]) => void;
  handleGameEnded: (finalStats: GameStats) => void;
  handlePlayerDisconnected: (playerId: string) => void;
  handlePlayerReconnected: (playerId: string) => void;
  
  // Actions utilitaires
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
  clearError: () => void;
  resetGame: () => void;
}

// Implémentation du store
export const useGameStore = create<GameStore>((set, get) => ({
  // État initial
  game: null,
  player: null,
  connection: 'disconnected',
  currentRound: null,
  timer: null,
  isLoading: false,
  error: null,
  notifications: [],
  
  // Actions synchrones
  setGame: (game) => set({ game }),
  setPlayer: (player) => set({ player }),
  
  updatePlayerPoints: (playerId, points) => set((state) => {
    if (!state.game) return state;
    
    return {
      ...state,
      game: {
        ...state.game,
        players: state.game.players.map(p => 
          p.id === playerId 
            ? { ...p, points, lastPointTimestamp: Date.now() }
            : p
        )
      }
    };
  }),
  
  updateConnection: (status) => set({ connection: status }),
  updateTimer: (timer) => set({ timer }),
  
  // Actions asynchrones
  createGame: async (username) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch('/api/v1/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maxPlayers: 7 })
      });
      
      if (!response.ok) {
        throw new Error('Failed to create game');
      }
      
      const { data } = await response.json();
      
      // Rejoindre automatiquement la partie créée
      await get().joinGame(data.pin, username);
      
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
  
  joinGame: async (pin, username) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/v1/games/${pin}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to join game');
      }
      
      const { data } = await response.json();
      
      set({
        game: data.gameState.game,
        player: data.gameState.currentPlayer,
        isLoading: false
      });
      
      // Connecter WebSocket
      await connectSocket(data.gameId, data.playerId);
      
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
  
  submitAnswer: async (answer) => {
    const state = get();
    if (!state.game || !state.player) return;
    
    set({ isLoading: true });
    
    try {
      const response = await fetch(`/api/v1/gameplay/games/${state.game.id}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          answer,
          responseTime: state.timer ? Date.now() - state.timer.startTime : null
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit answer');
      }
      
      set({ isLoading: false });
      
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
  
  // WebSocket handlers
  handlePlayerJoined: (player) => set((state) => {
    if (!state.game) return state;
    
    return {
      ...state,
      game: {
        ...state.game,
        players: [...state.game.players, player]
      }
    };
  }),
  
  handleRoundStarted: (round) => set({ 
    currentRound: round,
    timer: round.timer ? {
      phase: 'answering',
      startTime: Date.now(),
      duration: round.timer.duration,
      remaining: round.timer.duration
    } : null
  }),
  
  handleAnswerRevealed: (answers) => set((state) => {
    // Calculer les nouveaux points et classements
    const updatedPlayers = state.game?.players.map(player => {
      const playerAnswer = answers.find(a => a.playerId === player.id);
      if (playerAnswer?.isCorrect) {
        return {
          ...player,
          points: player.points + 1,
          lastPointTimestamp: Date.now()
        };
      }
      return player;
    }) || [];
    
    // Recalculer les positions
    const rankedPlayers = calculateRankings(updatedPlayers);
    
    return {
      ...state,
      game: state.game ? {
        ...state.game,
        players: rankedPlayers
      } : null
    };
  }),
  
  // Actions utilitaires
  addNotification: (notification) => set((state) => ({
    notifications: [...state.notifications, { ...notification, id: Date.now().toString() }]
  })),
  
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),
  
  clearError: () => set({ error: null }),
  resetGame: () => set({
    game: null,
    player: null,
    currentRound: null,
    timer: null,
    error: null,
    notifications: []
  })
}));
```

## 4. WebSocket Client

### 4.1 Configuration Socket.io Client

```typescript
// lib/socket.ts
import { io, Socket } from 'socket.io-client';
import { useGameStore } from './store';

class SocketManager {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  
  async connect(gameId: string, playerId: string): Promise<void> {
    if (this.socket?.connected) {
      return;
    }
    
    this.socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001', {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      auth: {
        gameId,
        playerId
      }
    });
    
    this.setupEventHandlers();
    
    return new Promise((resolve, reject) => {
      this.socket!.on('connect', () => {
        console.log('Socket connected');
        this.reconnectAttempts = 0;
        useGameStore.getState().updateConnection('connected');
        resolve();
      });
      
      this.socket!.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        useGameStore.getState().updateConnection('disconnected');
        reject(error);
      });
    });
  }
  
  private setupEventHandlers(): void {
    if (!this.socket) return;
    
    const store = useGameStore.getState();
    
    // Événements de connexion
    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      store.updateConnection('disconnected');
      
      if (reason === 'io server disconnect') {
        // Reconnexion forcée par le serveur
        this.handleReconnection();
      }
    });
    
    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      store.updateConnection('connected');
    });
    
    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('Reconnect attempt', attemptNumber);
      store.updateConnection('reconnecting');
    });
    
    // Événements de jeu
    this.socket.on('game-state-update', (gameState) => {
      store.setGame(gameState.game);
    });
    
    this.socket.on('game-state-restored', (gameState) => {
      store.setGame(gameState.game);
      store.setPlayer(gameState.currentPlayer);
      store.addNotification({
        type: 'success',
        message: 'État du jeu restauré avec succès'
      });
    });
    
    this.socket.on('player-joined', (player) => {
      store.handlePlayerJoined(player);
      store.addNotification({
        type: 'info',
        message: `${player.username} a rejoint la partie`
      });
    });
    
    this.socket.on('player-left', ({ playerId, username }) => {
      store.handlePlayerLeft(playerId);
      store.addNotification({
        type: 'warning',
        message: `${username} a quitté la partie`
      });
    });
    
    this.socket.on('player-disconnected', ({ playerId, username, canReconnect, timeout }) => {
      store.handlePlayerDisconnected(playerId);
      store.addNotification({
        type: 'warning',
        message: canReconnect 
          ? `${username} s'est déconnecté(e). Reconnexion possible pendant ${timeout/1000}s`
          : `${username} a été déconnecté(e) définitivement`
      });
    });
    
    this.socket.on('player-reconnected', ({ playerId, username }) => {
      store.handlePlayerReconnected(playerId);
      store.addNotification({
        type: 'success',
        message: `${username} s'est reconnecté(e)`
      });
    });
    
    // Événements de gameplay
    this.socket.on('game-started', (gameData) => {
      store.setGame(gameData);
      store.addNotification({
        type: 'success',
        message: 'La partie a commencé !'
      });
    });
    
    this.socket.on('round-started', (round) => {
      store.handleRoundStarted(round);
    });
    
    this.socket.on('question-asked', (question) => {
      store.setCurrentQuestion(question);
    });
    
    this.socket.on('answer-submitted', ({ playerId, username }) => {
      if (playerId !== store.player?.id) {
        store.addNotification({
          type: 'info',
          message: `${username} a répondu`
        });
      }
    });
    
    this.socket.on('all-guesses-received', () => {
      store.addNotification({
        type: 'info',
        message: 'Toutes les devinettes ont été reçues'
      });
    });
    
    this.socket.on('results-revealed', (results) => {
      store.handleAnswerRevealed(results.answers);
    });
    
    this.socket.on('round-ended', (roundSummary) => {
      store.addNotification({
        type: 'info',
        message: `Manche ${roundSummary.roundNumber} terminée`
      });
    });
    
    this.socket.on('game-ended', (finalStats) => {
      store.handleGameEnded(finalStats);
    });
    
    // Événements de timer
    this.socket.on('timer-started', ({ phase, duration }) => {
      store.updateTimer({
        phase,
        startTime: Date.now(),
        duration,
        remaining: duration
      });
    });
    
    this.socket.on('timer-update', ({ remaining }) => {
      const currentTimer = store.timer;
      if (currentTimer) {
        store.updateTimer({
          ...currentTimer,
          remaining
        });
      }
    });
    
    this.socket.on('timer-expired', ({ phase }) => {
      store.updateTimer(null);
      store.addNotification({
        type: 'warning',
        message: phase === 'guessing' ? 'Temps écoulé pour les devinettes !' : 'Temps écoulé !'
      });
    });
    
    // Gestion des erreurs
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      store.addNotification({
        type: 'error',
        message: error.message || 'Une erreur est survenue'
      });
    });
    
    this.socket.on('validation-error', (error) => {
      store.addNotification({
        type: 'error',
        message: error.message || 'Erreur de validation'
      });
    });
  }
  
  private async handleReconnection(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      useGameStore.getState().addNotification({
        type: 'error',
        message: 'Impossible de se reconnecter. Veuillez rafraîchir la page.'
      });
      return;
    }
    
    this.reconnectAttempts++;
    useGameStore.getState().updateConnection('reconnecting');
    
    setTimeout(() => {
      this.socket?.connect();
    }, this.reconnectDelay * this.reconnectAttempts);
  }
  
  // Méthodes d'émission
  emit(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  }
  
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketManager = new SocketManager();

// Hook pour utiliser le socket dans les composants
export const useSocket = () => {
  const { connection } = useGameStore();
  
  return {
    isConnected: connection === 'connected',
    isReconnecting: connection === 'reconnecting',
    emit: (event: string, data?: any) => socketManager.emit(event, data),
    disconnect: () => socketManager.disconnect()
  };
};
```

## 5. Composants React optimisés

### 5.1 Composant Timer avec animation

```typescript
// components/game/Timer.tsx
import { useEffect, useState } from 'react';
import { useGameStore } from '@/lib/store';

interface TimerProps {
  className?: string;
}

export const Timer: React.FC<TimerProps> = ({ className }) => {
  const { timer } = useGameStore();
  const [displayTime, setDisplayTime] = useState(0);
  
  useEffect(() => {
    if (!timer) {
      setDisplayTime(0);
      return;
    }
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - timer.startTime;
      const remaining = Math.max(0, timer.duration - elapsed);
      setDisplayTime(Math.ceil(remaining / 1000));
      
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, [timer]);
  
  if (!timer) return null;
  
  const isWarning = displayTime <= 10;
  const percentage = (displayTime / (timer.duration / 1000)) * 100;
  const circumference = 2 * Math.PI * 30; // rayon de 30
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className={`relative w-16 h-16 ${className}`}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 64 64">
        {/* Cercle de fond */}
        <circle
          cx="32"
          cy="32"
          r="30"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          className="text-gray-200"
        />
        {/* Cercle de progression */}
        <circle
          cx="32"
          cy="32"
          r="30"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={`transition-all duration-300 ${
            isWarning ? 'text-red-500' : 'text-green-500'
          }`}
          style={{
            strokeLinecap: 'round'
          }}
        />
      </svg>
      
      {/* Temps affiché */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-lg font-bold ${
          isWarning ? 'text-red-500 animate-pulse' : 'text-gray-700'
        }`}>
          {displayTime}
        </span>
      </div>
    </div>
  );
};
```

### 5.2 Composant Classement intelligent

```typescript
// components/game/SmartRanking.tsx
import { useState } from 'react';
import { useGameStore } from '@/lib/store';
import { ChevronDown, ChevronUp, Trophy, Medal } from 'lucide-react';

export const SmartRanking: React.FC = () => {
  const { game, player } = useGameStore();
  const [expanded, setExpanded] = useState(false);
  
  if (!game || !player) return null;
  
  // Calcul des classements avec gestion ex aequo
  const calculateRankings = (players: Player[]) => {
    return players
      .sort((a, b) => {
        if (a.points !== b.points) return b.points - a.points;
        return a.lastPointTimestamp - b.lastPointTimestamp;
      })
      .map((p, index, arr) => ({
        ...p,
        position: index === 0 || arr[index-1].points !== p.points 
          ? index + 1 
          : arr[index-1].position
      }));
  };
  
  const rankedPlayers = calculateRankings(game.players);
  const currentPlayerRanking = rankedPlayers.find(p => p.id === player.id);
  const topThree = rankedPlayers.slice(0, 3);
  
  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1: return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2: return <Medal className="w-5 h-5 text-gray-400" />;
      case 3: return <Medal className="w-5 h-5 text-amber-600" />;
      default: return <span className="w-5 h-5 flex items-center justify-center text-sm font-semibold">{position}</span>;
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      {/* Affichage compact */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center space-x-3">
          {getPositionIcon(currentPlayerRanking?.position || 0)}
          <div>
            <div className="font-semibold text-gray-900">
              {currentPlayerRanking?.points} points
            </div>
            <div className="text-sm text-gray-500">
              {currentPlayerRanking?.position === 1 ? 'En tête' : 
               `${currentPlayerRanking?.position}e position`}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-500">
            {rankedPlayers.length} joueurs
          </div>
          {expanded ? 
            <ChevronUp className="w-5 h-5 text-gray-400" /> : 
            <ChevronDown className="w-5 h-5 text-gray-400" />
          }
        </div>
      </div>
      
      {/* Classement détaillé */}
      {expanded && (
        <div className="mt-4 pt-4 border-t space-y-2">
          {rankedPlayers.map((p, index) => (
            <div 
              key={p.id}
              className={`flex items-center justify-between p-2 rounded-lg ${
                p.id === player.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center space-x-3">
                {getPositionIcon(p.position)}
                <div className="flex items-center space-x-2">
                  <span className={`font-medium ${
                    p.id === player.id ? 'text-blue-700' : 'text-gray-900'
                  }`}>
                    {p.username}
                  </span>
                  {p.id === game.creatorId && (
                    <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                      Créateur
                    </span>
                  )}
                  {!p.isActive && (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                      Déconnecté
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className={`font-semibold ${
                  p.id === player.id ? 'text-blue-700' : 'text-gray-700'
                }`}>
                  {p.points} pts
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### 5.3 Hook Auto-scroll pour mobile

```typescript
// hooks/useAutoScroll.ts
import { useEffect } from 'react';

export const useAutoScroll = () => {
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      
      // Détection mobile avec plus de précision
      const isMobile = window.innerHeight < 600 || 
                      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
                      (window.innerWidth <= 768 && 'ontouchstart' in window);
      
      if (isMobile) {
        // Délai pour laisser le clavier s'afficher
        setTimeout(() => {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest'
          });
          
          // Ajustement supplémentaire pour iOS
          if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            window.scrollBy(0, -100);
          }
        }, 300);
      }
    };
    
    const handleFocusOut = () => {
      // Restaurer le scroll normal après fermeture du clavier
      if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 300);
      }
    };
    
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);
};
```

## 6. Pages Next.js avec App Router

### 6.1 Layout principal

```typescript
// app/layout.tsx
import type { Metadata } from 'next';
import { Belanosima } from 'next/font/google';
import './globals.css';

const belanosima = Belanosima({ 
  subsets: ['latin'],
  weights: ['400', '600', '700']
});

export const metadata: Metadata = {
  title: 'Percept - Découvrez-vous entre amis',
  description: 'Plongez dans une expérience où vos perceptions et celles des autres se confrontent.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png'
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={`${belanosima.className} antialiased`}>
        <div className="min-h-screen bg-background">
          {children}
        </div>
      </body>
    </html>
  );
}
```

### 6.2 Page d'accueil

```typescript
// app/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useGameStore } from '@/lib/store';
import { useAutoScroll } from '@/hooks/useAutoScroll';

export default function HomePage() {
  const router = useRouter();
  const { createGame, joinGame, isLoading } = useGameStore();
  const [showIntro, setShowIntro] = useState(true);
  const [showRules, setShowRules] = useState(false);
  const [pin, setPin] = useState('');
  const [username, setUsername] = useState('');
  
  useAutoScroll();
  
  const handleCreateGame = async () => {
    if (!username.trim()) return;
    
    try {
      await createGame(username);
      router.push('/game/lobby');
    } catch (error) {
      console.error('Failed to create game:', error);
    }
  };
  
  const handleJoinGame = async () => {
    if (!pin.trim() || !username.trim()) return;
    
    try {
      await joinGame(pin, username);
      router.push('/game/lobby');
    } catch (error) {
      console.error('Failed to join game:', error);
    }
  };
  
  if (showIntro) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-4">
              🎯 PERCEPT
            </h1>
          </div>
          
          <div className="prose prose-lg mx-auto mb-8">
            <p>
              Avec Percept, plongez dans une expérience où vos perceptions et celles des autres se confrontent.
            </p>
            <p>
              Jouez et découvrez comment vos amis vous voient et s'ils sont tels que vous les imaginez !
            </p>
            <p>
              Si vous voulez gagner, il faudra cerner qui se cache derrière les masques que les autres joueurs portent… parfois même sans s'en apercevoir.
            </p>
            <p className="font-semibold">
              Pourquoi vous allez adorer ?
            </p>
            <p>
              Au-delà du jeu, l'intérêt réside dans les discussions qui en découlent. Débriefez les réponses, essayez de comprendre les choix des uns et des autres, et découvrez des facettes inattendues de vos amis ou de votre famille.
            </p>
            <p className="text-center font-semibold text-xl">
              À vous de jouer !
            </p>
          </div>
          
          <div className="text-center">
            <Button 
              onClick={() => setShowIntro(false)}
              size="lg"
              className="w-full sm:w-auto"
            >
              Suivant →
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  
  if (showRules) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-2xl p-8">
          <h2 className="text-2xl font-bold mb-6">Règles du jeu</h2>
          
          <div className="prose prose-lg mx-auto mb-8">
            <p className="font-semibold">Le but du jeu :</p>
            <p>
              Accumulez des points en devinant les réponses des autres joueurs. Attention, pas de points en jeu pour votre propre réponse, alors soyez <strong>honnête et spontané</strong>.
            </p>
            
            <p className="font-semibold">Comment ça marche ?</p>
            <ol>
              <li>À chaque tour, un joueur tire une question et y répond.</li>
              <li>Les autres joueurs doivent deviner sa réponse.</li>
              <li>Le questionné change à chaque tour.</li>
              <li>La partie se joue en <strong>4 manches</strong>, chacune avec un type de question différent pour varier les surprises !</li>
            </ol>
            
            <p className="font-semibold text-center">
              Accordez vous sur les termes et le contexte des questions avant d'y répondre
            </p>
            
            <p className="text-center">
              <strong>Pour 3 à 7 joueurs</strong>
            </p>
          </div>
          
          <div className="text-center">
            <Button 
              onClick={() => setShowRules(false)}
              size="lg"
              className="w-full sm:w-auto"
            >
              Suivant →
            </Button>
          </div>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-4">
            🎯 PERCEPT
          </h1>
          <h2 className="text-xl font-semibold mb-2">Bienvenue !</h2>
          <p className="text-gray-600">
            Commencez une nouvelle partie ou rejoignez une partie existante en entrant le code PIN généré par le créateur de la partie
          </p>
        </div>
        
        <div className="space-y-6">
          <div>
            <Input
              placeholder="Votre pseudo"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={50}
              className="text-center"
            />
          </div>
          
          <Button 
            onClick={handleCreateGame}
            disabled={!username.trim() || isLoading}
            size="lg"
            className="w-full"
          >
            {isLoading ? 'Création...' : 'Créer une partie'}
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Ou
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Input
              placeholder="PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              className="text-center font-mono text-lg"
            />
            <Button 
              onClick={handleJoinGame}
              disabled={!pin.trim() || !username.trim() || pin.length !== 6 || isLoading}
              size="lg"
            >
              {isLoading ? 'Connexion...' : 'GO →'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
```

## 7. Points d'intégration avec autres documents

### 7.1 Vers Document 1 (Spécifications Fonctionnelles)
- **Logique métier frontend** : Implémentation des règles de calcul de points
- **États et transitions** : Gestion des phases waiting → answering → guessing → revealing
- **Messages textes** : Intégration de tous les textes d'interface et messages d'erreur
- **Timer 30s** : Composant Timer synchronisé avec backend

### 7.2 Vers Document 2 (Design System et UX)
- **Design tokens** : Intégration complète des variables CSS et couleurs
- **Composants UI** : Implémentation des Button, Input, Card, Timer selon spec
- **Animations** : Transitions slideIn, fadeInUp, pulse et shake
- **Auto-scroll mobile** : Hook useAutoScroll pour gestion clavier virtuel
- **Responsive** : Mobile-first avec breakpoints définis

### 7.3 Vers Document 3 (Architecture Backend)
- **API REST** : Consommation de tous les endpoints /api/v1/games et /api/v1/gameplay
- **WebSocket client** : Gestion de tous les événements Socket.io définis
- **Types partagés** : Utilisation des DTOs et interfaces communes
- **Error handling** : Gestion des ErrorResponse standardisées

### 7.4 Vers Document 5 (Sécurité, Tests et DevOps)
- **Validation côté client** : Sanitization des inputs et validation formFields
- **Error boundaries** : Gestion des erreurs React pour robustesse
- **Tests unitaires** : Composants prêts pour testing avec React Testing Library
- **Logging frontend** : Tracking des erreurs et métriques utilisateur

### 7.5 Vers Document 6 (Performance et Scalabilité)
- **Optimisations React** : Memoization, lazy loading, code splitting
- **Bundle optimization** : Next.js automatic optimizations
- **Caching strategy** : SWR/React Query pour cache API
- **WebSocket performance** : Connection pooling et reconnect logic

### 7.6 Vers Document 7 (Administration et Configuration)
- **Variables d'environnement** : Configuration API_URL, WebSocket endpoints
- **Feature flags** : Système pour activer/désactiver fonctionnalités
- **Analytics frontend** : Intégration métriques utilisateur
- **Monitoring client** : Error tracking et performance monitoring

---

**Note** : Ce document définit l'architecture frontend complète. Pour la logique métier, voir Document 1. Pour l'interface visuelle, voir Document 2. Pour l'intégration backend, voir Document 3.