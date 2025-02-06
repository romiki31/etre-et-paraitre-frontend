import axios from "axios";
import { makeAutoObservable, runInAction } from "mobx";
import { io } from "socket.io-client";
import { Game, Player } from "./Interfaces";
import { goToUrl } from "./routes";

const socket =
  process.env.NODE_ENV === "production"
    ? io("https://epercept.fr")
    : io("http://localhost:5001");

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
  winners: Player[] | null = null;

  constructor() {
    makeAutoObservable(this);
  }

  setupSocketListeners = () => {
    console.log("Création des écouteurs de sockets");

    socket.on("player-joined", (game) => {
      runInAction(() => {
        this.currentGame = game;
      });
    });

    socket.on("game-started", (res) => {
      runInAction(() => {
        this.currentGame = res.game;
      });
    });

    socket.on("right-answer-submitted", (game) => {
      runInAction(() => {
        this.currentGame = game;
      });
    });

    socket.on("all-answered", (game) => {
      runInAction(() => {
        this.setShowQuestion(false);
        this.setCurrentGame(game);
        this.setShowAnswers(true);
      });
    });

    // socket.on("show-answers", () => {
    //   this.setShowAnswers(true);
    // });

    socket.on("show-ranking", () => {
      this.setShowRanking(true);
    });

    socket.on("next-turn", (res) => {
      runInAction(() => {
        this.setterNextTurn(res);
      });
    });

    socket.on("round-ended", (res) => {
      runInAction(() => {
        this.setterNextRound(res);
      });
    });

    socket.on("end-game", (res) => {
      runInAction(() => {
        this.setWinners(res.winners);
      });
    });
  };

  // emitShowAnswers = () => {
  //   this.setShowAnswers(true);
  //   socket.emit("show-answers", this.pin);
  // };

  emitShowRanking = () => {
    this.setShowRanking(true);
    socket.emit("show-ranking", this.pin);
  };

  emitNextTurn = async () => {
    try {
      const response = await axios.post("/api/next-turn", {
        pin: this.pin,
      });
      if (response) {
        runInAction(() => {
          if (response.data.message === "Tour suivant") {
            this.setterNextTurn(response.data);
          }
          if (response.data.message === "Partie terminée") {
            this.setWinners(response.data.winners);
          }
        });
      }
    } catch (error) {
      console.error("Erreur lors du passage au joueur suivant", error);
    }
  };

  setterNextTurn = (res: any) => {
    runInAction(() => {
      this.currentGame = res.game;
      this.answer = null;
      this.showAnswers = false;
      this.showRanking = false;
      this.nextTurn = false;
    });
  };

  setterNextRound = (res: any) => {
    runInAction(() => {
      this.currentGame = res.game;
      this.answer = null;
      this.showAnswers = false;
      this.showRanking = false;
      this.nextTurn = false;
      this.showQuestion = false;
    });
  };

  getBackgroundClass = (roundId: number) => {
    switch (roundId) {
      case 1:
        return "bg-personality";
      case 2:
        return "bg-situations";
      case 3:
        return "bg-representations";
      case 4:
        return "bg-relations";
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

  setShowAnswers = (showAnswers: boolean) => {
    this.showAnswers = showAnswers;
  };

  setShowRanking = (showRanking: boolean) => {
    this.showRanking = showRanking;
  };

  setShowQuestion = (showQuestion: boolean) => {
    this.showQuestion = showQuestion;
  };

  setNextTurn = (nextTurn: boolean) => {
    this.nextTurn = nextTurn;
  };

  setWinners = (winners: Player[]) => {
    this.winners = winners;
  };

  setErrorMessage = (message: string) => {
    this.errorMessage = message;
  };

  clearErrorMessage = () => {
    this.errorMessage = "";
  };

  generatePin = () => {
    this.clearErrorMessage();
    const newPin = Math.floor(100000 + Math.random() * 900000).toString();
    runInAction(() => {
      this.pin = newPin;
      this.gameCreator = true;
    });
  };

  async getCurrentGame(pin: string, currentPlayerId: number) {
    try {
      const response = await axios.get(`/api/game/${pin}/${currentPlayerId}`);
      runInAction(() => {
        if (response.data) {
          this.pin = pin;
          this.currentPlayerId = currentPlayerId;
          this.gameCreator = currentPlayerId === 1;
          if (
            !this.currentGame ||
            response.data.game.currentRound?.id !==
              this.currentGame.currentRound?.id
          ) {
            this.currentGame = {
              ...response.data.game,
              currentRound: response.data.game.currentRound,
            };
          } else {
            this.currentGame = {
              ...this.currentGame,
              ...response.data.game,
              currentRound: this.currentGame.currentRound,
            };
          }
        }
      });
    } catch (error) {
      goToUrl("/");
      console.error("Erreur lors de la récupération de la partie :", error);
    }
  }

  checkPin = async (pin: string) => {
    try {
      const response = await axios.post("/api/check-pin", {
        pin,
      });
      runInAction(() => {
        if (response.data.valid) {
          this.setPin(pin);
          this.isPinValid = true;
        }
      });
    } catch (error) {
      console.log(error);
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
      runInAction(() => {
        this.currentGame = response.data.game;
        this.currentPlayerId = response.data.currentPlayerId;
      });
    } catch (error: any) {
      if (error.response?.data.message) {
        this.setErrorMessage(error.response.data.message);
      } else {
        console.error(error);
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
      runInAction(() => {
        this.currentGame = response.data.game;
        this.currentPlayerId = response.data.currentPlayerId;
        this.clearErrorMessage();
      });
    } catch (error) {
      console.log(error);
      this.setErrorMessage("Impossible de rejoindre la partie");
    }
  };

  startGame = async () => {
    try {
      const response = await axios.post("/api/start-game", {
        pin: this.pin,
      });
      runInAction(() => {
        if (response.data) {
          this.setCurrentGame(response.data.game);
        }
      });
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
      runInAction(() => {
        if (response.data) {
          this.setCurrentGame(response.data.game);
        }
      });
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
      runInAction(() => {
        if (response.data.hasAnswered) {
          this.setAnswer(response.data.answer);
        }
      });
    } catch (error) {
      console.error("Erreur lors de la soumission de la réponse", error);
    }
  };
}

export const gameStore = new GameStore();
