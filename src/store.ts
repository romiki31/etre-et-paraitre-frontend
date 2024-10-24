import axios from "axios";
import { makeAutoObservable } from "mobx";
import { io } from "socket.io-client";
import { Game, Player, Question, Round } from "./Constantes";

const socket =
  process.env.NODE_ENV === "production" ? io("https://donska.fr") : io("/");

class GameStore {
  pin: string = "";
  gameCreator: boolean = false;
  currentPlayer: Player | null = null;
  roundPlayer: Player | null = null;
  isPinValid: boolean = false;
  currentGame: Game | null = null;
  errorMessage: string = "";
  currentRound: Round | null = null;
  currentQuestion: Question | null = null;
  rightAnswer: string | null = "";
  hasAnswered: boolean = false;
  answer: string | null = null;
  showAnswers: boolean = false;
  showRanking: boolean = false;
  showQuestion: boolean = false;
  nextTurn: boolean = false;
  allAnswered: boolean = false;
  gamePlayers: Player[] = [];
  winner: Player | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  setupSocketListeners = () => {
    socket.on("player-joined", (game) => {
      this.currentGame = game;
    });

    socket.on("game-started", (res) => {
      this.currentRound = res.currentRound;
      this.currentQuestion = res.currentQuestion;
      this.roundPlayer = res.roundPlayer;
      this.gamePlayers = res.gamePlayers;
    });

    socket.on("right-answer-submitted", (rightAnswer) => {
      this.setRightAnswer(rightAnswer);
    });

    socket.on("all-answered", (allAnswered, gamePlayers) => {
      this.setAllAnswered(allAnswered);
      this.setGamePlayers(gamePlayers);
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
    });
  };

  emitShowAnswers = () => {
    this.setShowAnswers(true);
    socket.emit("show-answers", this.pin); // Émettre à tous les joueurs
  };

  emitShowRanking = () => {
    this.setShowRanking(true);
    socket.emit("show-ranking", this.pin); // Émettre à tous les joueurs
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
      }
    } catch (error) {
      console.error("Erreur lors du passage au joueur suivant", error);
    }
  };

  setterNextTurn = (res: any) => {
    this.currentQuestion = res.currentQuestion;
    this.gamePlayers = res.gamePlayers;
    this.roundPlayer = res.roundPlayer;
    this.rightAnswer = null;
    this.hasAnswered = false;
    this.answer = null;
    this.showAnswers = false;
    this.showRanking = false;
    this.allAnswered = false;
    this.nextTurn = false;
  };

  setterNextRound = (res: any) => {
    this.currentGame = res.game;
    this.gamePlayers = res.game.players;
    this.currentRound = res.game.currentRound;
    this.rightAnswer = res.game.rightAnswer;
    this.currentQuestion = res.currentQuestion;
    this.roundPlayer = res.roundPlayer;
    this.hasAnswered = false;
    this.answer = null;
    this.showAnswers = false;
    this.showRanking = false;
    this.nextTurn = false;
    this.allAnswered = false;
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

  setCurrentRound = (currentRound: Round) => {
    this.currentRound = currentRound;
  };

  setCurrentPlayer = (currentPlayer: Player) => {
    this.currentPlayer = currentPlayer;
  };
  setRoundPlayer = (roundPlayer: Player) => {
    this.roundPlayer = roundPlayer;
  };

  setCurrentQuestion = (currentQuestion: Question) => {
    this.currentQuestion = currentQuestion;
  };

  setRightAnswer = (rightAnswer: string | null) => {
    this.rightAnswer = rightAnswer;
  };

  setHasAnswered = (hasAnswered: true | false) => {
    this.hasAnswered = hasAnswered;
  };
  setAnswer = (answer: string | null) => {
    this.answer = answer;
  };

  setAllAnswered = (allAnswered: true | false) => {
    this.allAnswered = allAnswered;
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

  setGamePlayers = (gamePlayers: Player[]) => {
    this.gamePlayers = gamePlayers;
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
    const newPin = Math.random().toString(36).substr(2, 6).toUpperCase();
    this.pin = newPin;
    this.gameCreator = true;
  };

  checkPin = async (pin: string) => {
    try {
      const formatedPin: string = pin.toUpperCase();
      const response = await axios.post("/api/check-pin", {
        pin: formatedPin,
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
      const response = await axios.post("/api/create-game", data);
      this.currentPlayer = response.data.currentPlayer;
      this.currentGame = response.data.game;
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
      this.currentPlayer = response.data.currentPlayer;

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
        this.setCurrentRound(response.data.currentRound);
        this.setCurrentQuestion(response.data.currentQuestion);
        this.setRoundPlayer(response.data.roundPlayer);
        this.setCurrentPlayer(response.data.roundPlayer);
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
        roundPlayer: this.roundPlayer,
      });
      if (response.data) {
        this.setRightAnswer(response.data.right_answer);
      }
    } catch (error) {
      console.error("Erreur lors de la soumission de la réponse", error);
    }
  };

  submitGuess = async (guessedAnswer: string) => {
    try {
      const response = await axios.post("/api/submit-guess", {
        pin: this.pin,
        playerId: this.currentPlayer?.id,
        guessedAnswer,
      });
      if (response.data.hasAnswered) {
        this.setHasAnswered(true);
        this.setAnswer(response.data.answer);
      }
    } catch (error) {
      console.error("Erreur lors de la soumission de la réponse", error);
    }
  };
}

export const gameStore = new GameStore();
