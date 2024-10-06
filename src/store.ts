import axios from "axios";
import { makeAutoObservable } from "mobx";
import { io } from "socket.io-client";
import { Game, Round } from "./Constantes";

// Initialiser la connexion avec le serveur Socket.IO
const socket = io("http://localhost:5000");

class GameStore {
  pin: string = "";
  gameCreator: boolean = false;
  username: string = "";
  isPinValid: boolean = false;
  currentGame: Game | null = null;
  errorMessage: string = "";
  currentRound: Round | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  setupSocketListeners = () => {
    socket.on("player-joined", (game) => {
      this.currentGame = game;
      console.log("Un nouveau joueur a rejoint la partie", game);
    });

    socket.on("game-started", (currentRound) => {
      this.currentRound = currentRound;
      console.log("La partie a démarré, Manche 1");
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

  setUsername = (username: string) => {
    this.username = username;
  };

  setCurrentGame = (currentGame: Game) => {
    this.currentGame = currentGame;
  };

  setCurrentRound = (currentRound: Round) => {
    this.currentRound = currentRound;
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
    this.username = username;

    const newGame = {
      pin: this.pin,
      player: this.username,
    };

    try {
      const response = await axios.post(
        "http://localhost:5000/create-game",
        newGame
      );
      this.currentGame = response.data.game;
    } catch (error) {
      this.setErrorMessage("Erreur lors de la création de la partie");
    }
  };

  joinGame = async (username: string) => {
    this.username = username;

    const gameData = {
      pin: this.pin,
      player: this.username,
    };

    try {
      const response = await axios.post(
        "http://localhost:5000/create-game",
        gameData
      );
      this.currentGame = response.data.game;
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

      if (response.data.currentRound) {
        this.setCurrentRound(response.data.currentRound);
      }
    } catch (error) {
      console.error("Erreur lors du démarrage du jeu", error);
    }
  };
}

export const gameStore = new GameStore();
