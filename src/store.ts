import axios from "axios";
import { makeAutoObservable } from "mobx";
import { io } from "socket.io-client";
import { Game, Player, Question, Round } from "./Constantes";

// Initialiser la connexion avec le serveur Socket.IO
const socket = io("http://localhost:5000");

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

  constructor() {
    makeAutoObservable(this);
  }

  setupSocketListeners = () => {
    socket.on("player-joined", (game) => {
      console.log(game);

      this.currentGame = game;
      console.log("Un nouveau joueur a rejoint la partie", game);
    });

    socket.on("game-started", (res) => {
      this.currentRound = res.currentRound;
      this.currentQuestion = res.currentQuestion;
      this.roundPlayer = res.roundPlayer;
      console.log("La partie a démarré, Manche 1");
    });

    socket.on("right-answer-submitted", (rightAnswer) => {
      this.setRightAnswer(rightAnswer);
      console.log("La bonne réponse a été soumise : ", rightAnswer);
    });
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
      const response = await axios.post("http://localhost:5000/check-pin", {
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
      const response = await axios.post(
        "http://localhost:5000/create-game",
        data
      );
      this.currentPlayer = response.data.currentPlayer;
      this.currentGame = response.data.game;
    } catch (error) {
      this.setErrorMessage("Erreur lors de la création de la partie");
    }
  };

  joinGame = async (username: string) => {
    const gameData = {
      pin: this.pin,
      username: username,
    };

    try {
      const response = await axios.post(
        "http://localhost:5000/create-game",
        gameData
      );

      this.currentGame = response.data.game;
      this.currentPlayer = response.data.currentPlayer;

      this.clearErrorMessage();
    } catch (error) {
      this.setErrorMessage("Impossible de rejoindre la partie");
    }
  };

  startGame = async () => {
    try {
      const response = await axios.post("http://localhost:5000/start-game", {
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
      const response = await axios.post("http://localhost:5000/submit-answer", {
        pin: this.pin,
        rightAnswer,
      });
      console.log(response.data.message);
    } catch (error) {
      console.error("Erreur lors de la soumission de la réponse", error);
    }
  };

  submitGuess = async (guessedAnswer: string) => {
    try {
      const response = await axios.post("http://localhost:5000/submit-guess", {
        pin: this.pin,
        playerId: this.currentPlayer?.id,
        guessedAnswer,
      });
      console.log(response.data.message);
    } catch (error) {
      console.error("Erreur lors de la soumission de la réponse", error);
    }
  };
}

export const gameStore = new GameStore();
