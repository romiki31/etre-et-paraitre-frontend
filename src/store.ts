import axios from "axios";
import { makeAutoObservable } from "mobx";
import { io } from "socket.io-client";
import { Game, Player } from "./Constantes";

const socket =
  process.env.NODE_ENV === "production" ? io("https://donska.fr") : io("/");

class GameStore {
  pin: string = "";
  isPinValid: boolean = false;
  gameCreator: boolean = false;
  currentGame: Game | null = null;
  currentPlayerId: number | null = null;
  answer: string | null = null;
  errorMessage: string = "";
  showAnswers: boolean = false;
  showRanking: boolean = false;
  showQuestion: boolean = false;
  nextTurn: boolean = false;
  winner: Player | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  setupSocketListeners = () => {
    socket.on("player-joined", (game) => {
      this.currentGame = game;
    });

    socket.on("game-started", (res) => {
      this.currentGame = res.game;
    });

    socket.on("right-answer-submitted", (game) => {
      this.currentGame = game;
    });

    socket.on("all-answered", (game) => {
      this.setShowQuestion(false);
      this.setCurrentGame(game);
    });

    socket.on("show-answers", () => {
      this.setShowAnswers(true);
    });

    socket.on("show-ranking", () => {
      this.setShowRanking(true);
    });

    socket.on("next-turn", (res) => {
      this.setterNextTurn(res);
    });

    socket.on("round-ended", (res) => {
      this.setterNextRound(res);
    });

    socket.on("end-game", (res) => {
      this.setWinner(res.winner);
      // this.setCurrentRound(null);
    });
  };

  emitShowAnswers = () => {
    this.setShowAnswers(true);
    socket.emit("show-answers", this.pin);
  };

  emitShowRanking = () => {
    this.setShowRanking(true);
    socket.emit("show-ranking", this.pin);
  };

  emitNextTurn = async () => {
    try {
      const response = await axios.post("/api/next-turn", {
        pin: this.pin,
      });
      if (response.data.message === "Tour suivant") {
        this.setterNextTurn(response.data);
      }
      if (response.data.message === "Partie terminée") {
        this.setWinner(response.data.winner);
        // this.setCurrentRound(null);
      }
    } catch (error) {
      console.error("Erreur lors du passage au joueur suivant", error);
    }
  };

  setterNextTurn = (res: any) => {
    this.currentGame = res.game;
    this.answer = null;
    this.showAnswers = false;
    this.showRanking = false;
    this.nextTurn = false;
  };

  setterNextRound = (res: any) => {
    this.currentGame = res.game;
    this.answer = null;
    this.showAnswers = false;
    this.showRanking = false;
    this.nextTurn = false;
    this.showQuestion = false;
  };

  getBackgroundClass = (roundId: number) => {
    switch (roundId) {
      case 1:
        return "bg-personality";
      case 2:
        return "bg-situations";
      case 3:
        return "bg-relations";
      case 4:
        return "bg-representations";
      default:
        return "bg-default";
    }
  };

  getBtnClass = (roundId: number) => {
    switch (roundId) {
      case 1:
        return "btn-personality";
      case 2:
        return "btn-situations";
      case 3:
        return "btn-relations";
      case 4:
        return "btn-representations";
      default:
        return "btn-default";
    }
  };

  joinSocketRoom = (pin: string) => {
    socket.emit("join-game", pin);
  };

  setPin = (pin: string) => {
    this.pin = pin;
  };

  setGameCreator = (gameCreator: boolean) => {
    this.gameCreator = gameCreator;
  };

  setCurrentGame = (currentGame: Game) => {
    this.currentGame = currentGame;
  };

  setCurrentPlayerId = (currentPlayerId: number) => {
    this.currentPlayerId = currentPlayerId;
  };

  setAnswer = (answer: string | null) => {
    this.answer = answer;
  };

  setShowAnswers = (showAnswers: true | false) => {
    this.showAnswers = showAnswers;
  };

  setShowRanking = (showRanking: true | false) => {
    this.showRanking = showRanking;
  };

  setShowQuestion = (showQuestion: true | false) => {
    this.showQuestion = showQuestion;
  };

  setNextTurn = (nextTurn: true | false) => {
    this.nextTurn = nextTurn;
  };

  setWinner = (winner: Player) => {
    this.winner = winner;
  };

  setErrorMessage = (message: string) => {
    this.errorMessage = message;
  };

  clearErrorMessage = () => {
    this.errorMessage = "";
  };

  generatePin = () => {
    this.clearErrorMessage();
    const newPin = Math.random().toString(36).substr(2, 6).toUpperCase();
    this.pin = newPin;
    this.gameCreator = true;
  };

  async getCurrentGame(pin: string, currentPlayerId: number) {
    try {
      const response = await axios.get(`/api/game/${pin}/${currentPlayerId}`);
      // if (response.data) {
      this.pin = pin;
      this.currentGame = await axios.get(`/api/game/${pin}/${currentPlayerId}`);
      // this.currentGame = response.data.game;
      this.currentPlayerId = currentPlayerId;
      this.gameCreator = currentPlayerId === 1 ? true : false;
      // }
    } catch (error) {
      console.error("Erreur lors de la récupération de la partie :", error);
    }
  }

  checkPin = async (pin: string) => {
    try {
      const response = await axios.post("/api/check-pin", {
        pin,
      });
      if (response.data.valid) {
        this.setPin(pin);
        this.isPinValid = true;
      }
    } catch (error) {
      this.setErrorMessage("Code PIN invalide");
    }
  };

  createGame = async (username: string) => {
    const data = {
      pin: this.pin,
      username: username,
    };
    try {
      this.setErrorMessage("");
      const response = await axios.post("/api/create-game", data);
      this.currentGame = response.data.game;
      this.currentPlayerId = response.data.currentPlayerId;
    } catch (error: any) {
      if (error.response.data.message) {
        this.setErrorMessage(error.response.data.message);
      } else {
        this.setErrorMessage("Une erreur inattendue est survenue");
      }
    }
  };

  joinGame = async (username: string) => {
    const gameData = {
      pin: this.pin,
      username: username,
    };

    try {
      const response = await axios.post("/api/create-game", gameData);

      this.currentGame = response.data.game;
      this.currentPlayerId = response.data.currentPlayerId;

      this.clearErrorMessage();
    } catch (error) {
      this.setErrorMessage("Impossible de rejoindre la partie");
    }
  };

  startGame = async () => {
    try {
      const response = await axios.post("/api/start-game", {
        pin: this.pin,
      });

      if (response.data) {
        this.setCurrentGame(response.data.game);
      }
    } catch (error) {
      console.error("Erreur lors du démarrage du jeu", error);
    }
  };

  submitRightAnswer = async (rightAnswer: string) => {
    try {
      const response = await axios.post("/api/submit-answer", {
        pin: this.pin,
        rightAnswer,
        roundPlayer: this.currentGame?.players.find((p) => p.isRoundPlayer),
      });
      if (response.data) {
        this.setCurrentGame(response.data.game);
      }
    } catch (error) {
      console.error("Erreur lors de la soumission de la réponse", error);
    }
  };

  submitGuess = async (guessedAnswer: string) => {
    try {
      const response = await axios.post("/api/submit-guess", {
        pin: this.pin,
        playerId: this.currentPlayerId,
        guessedAnswer,
      });
      if (response.data.hasAnswered) {
        this.setAnswer(response.data.answer);
      }
    } catch (error) {
      console.error("Erreur lors de la soumission de la réponse", error);
    }
  };
}

export const gameStore = new GameStore();
