import cookieParser from "cookie-parser";
import express from "express";
import * as http from "http";
import * as path from "path";
import { Server, Socket } from "socket.io";
import { emptyPlayer, Game, Player, Question } from "../src/Interfaces";
import { authenticateAdmin, changeAdminPassword, loginAdmin, verifyAdminSetup } from "./auth";
import { questions, rounds } from "./constantes";

const app = express();
const port = process.env.PORT || 5001;
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://epercept.fr",
      "http://epercept.fr",
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },
});

app.use(express.json());
app.use(cookieParser());

// Configuration CORS pour les requêtes HTTP
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Répondre aux requêtes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

const games: Game[] = [];

// Fonction pour obtenir une question aléatoire
function getRandomQuestion(game: Game): Question | undefined {
  const roundQuestions = questions.filter(
    (q: Question) =>
      q.round_id === game.currentRound?.id &&
      !game.posedQuestions.includes(q.id)
  );
  const question =
    roundQuestions[Math.floor(Math.random() * roundQuestions.length)];
  // console.log("Question sélectionnée pour la manche:", question);
  return question;
}

// Gestion des connexions socket
io.on("connection", (socket: Socket) => {
  // console.log("Un joueur s'est connecté : ", socket.id);

  socket.on("disconnect", () => {
    // console.log("Un joueur s'est déconnecté : ", socket.id);
  });

  socket.on("join-game", (gamePin: string) => {
    socket.join(gamePin);
    // console.log(
    //   `Le joueur ${socket.id} a rejoint la partie avec le PIN : ${gamePin}`
    // );
  });

  // socket.on("show-answers", (gamePin: string) => {
  //   // console.log("Emission des réponses pour la partie:", gamePin);
  //   io.to(gamePin).emit("show-answers");
  // });

  socket.on("show-ranking", (gamePin: string) => {
    // console.log("Emission du classement pour la partie:", gamePin);
    io.to(gamePin).emit("show-ranking");
  });

  socket.on("show-end-round", (gamePin: string) => {
    // console.log("Fin de la manche pour la partie:", gamePin);
    io.to(gamePin).emit("show-end-round");
  });
});

// Admin authentication endpoints
app.post("/api/admin/login", loginAdmin);
app.post("/api/admin/change-password", authenticateAdmin, changeAdminPassword);
app.get("/api/admin/verify", authenticateAdmin, (req, res) => {
  res.json({ message: "Token valide", admin: true });
});
app.get("/api/admin/setup-status", verifyAdminSetup);

// Game endpoints
app.get("/api/game/:pin/:currentPlayerId", (req: any, res: any) => {
  const { pin, currentPlayerId } = req.params;
  // console.log(
  //   "Récupération de la partie pour PIN:",
  //   pin,
  //   "et Joueur ID:",
  //   currentPlayerId
  // );

  const game = games.find((g) => g.pin === pin);

  if (!game) {
    // console.log("Partie non trouvée pour le PIN:", pin);
    return res.status(404).json({ message: "Partie non trouvée" });
  }

  // console.log("Partie trouvée:", game);
  return res.json({
    message: "Partie trouvée",
    game,
    currentPlayerId: parseInt(currentPlayerId),
  });
});

app.post("/api/check-pin", (req: any, res: any) => {
  const { pin } = req.body;
  const game = games.find((g) => g.pin === pin);

  // console.log("Vérification du code PIN:", pin);
  return game
    ? res.json({ valid: true, message: "Le code PIN est valide", game })
    : res.status(404).json({ valid: false, message: "Code PIN invalide" });
});

app.post("/api/create-game", (req: any, res: any) => {
  const { pin, username } = req.body;
  // console.log(
  //   "Création ou ajout à la partie avec PIN:",
  //   pin,
  //   "et nom d'utilisateur:",
  //   username
  // );

  const game = games.find((g) => g.pin === pin);

  if (game) {
    const existingPlayer = game.players.find(
      (player) => player.username === username
    );

    if (existingPlayer) {
      // console.log("Nom d'utilisateur déjà pris:", username);
      return res.status(400).json({
        message:
          "Ce pseudo est déjà utilisé dans cette partie. Veuillez choisir un autre pseudo.",
      });
    }

    const newPlayer: Player = {
      ...emptyPlayer,
      id: game.players.length + 1,
      username: username,
      isRoundPlayer: false,
    };

    game.players.push(newPlayer);
    // console.log("Nouveau joueur ajouté:", newPlayer);
    io.to(pin).emit("player-joined", game);

    return res.json({
      message: "Joueur ajouté à la partie existante",
      game,
      currentPlayerId: newPlayer.id,
    });
  } else {
    const newPlayer: Player = {
      ...emptyPlayer,
      id: 1,
      username: username,
    };

    const newGame: Game = {
      id: games.length + 1,
      pin: pin,
      players: [newPlayer],
      currentRound: null,
      posedQuestions: [],
      rightAnswer: null,
      allAnswered: false,
      currentQuestion: null,
    };

    games.push(newGame);
    // console.log("Nouvelle partie créée:", newGame);
    io.to(pin).emit("game-created", newGame);
    return res.json({
      message: "Nouvelle partie créée",
      game: newGame,
      currentPlayerId: newPlayer.id,
    });
  }
});

app.post("/api/start-game", (req: any, res: any) => {
  const { pin } = req.body;
  // console.log("Démarrage du jeu pour la partie avec PIN:", pin);

  const game = games.find((g) => g.pin === pin);

  if (game) {
    game.currentRound = rounds[0];
    const currentQuestion = getRandomQuestion(game);
    if (currentQuestion) {
      game.posedQuestions.push(currentQuestion.id);
      game.currentQuestion = currentQuestion;
    }

    game.players = game.players.map((player) =>
      player.id === 1
        ? { ...player, isTurn: true, isRoundPlayer: true }
        : player
    );

    // console.log("Jeu démarré:", game);
    io.to(pin).emit("game-started", { game });
    return res.json({ message: "Le jeu a démarré", game });
  } else {
    return res.status(404).json({ message: "Partie non trouvée" });
  }
});

app.post("/api/submit-answer", (req: any, res: any) => {
  const { pin, rightAnswer, roundPlayer } = req.body;
  // console.log(
  //   "Soumission de la bonne réponse pour PIN:",
  //   pin,
  //   "par le joueur:",
  //   roundPlayer
  // );

  const game = games.find((g) => g.pin === pin);

  if (game) {
    game.rightAnswer = rightAnswer;
    const player = game.players.find((p) => p.id === roundPlayer.id);

    if (player) {
      player.hasAnswered = true;
      player.isTurn = true;
      player.answer = rightAnswer;
    }

    // console.log("Réponse soumise:", game);
    io.to(pin).emit("right-answer-submitted", game);

    return res.json({ message: "Bonne réponse soumise", game });
  } else {
    return res.status(404).json({ message: "Partie non trouvée" });
  }
});

app.post("/api/submit-guess", (req: any, res: any) => {
  const { pin, playerId, guessedAnswer } = req.body;
  // console.log(
  //   "Soumission d'une réponse pour PIN:",
  //   pin,
  //   "par le joueur:",
  //   playerId
  // );

  const game = games.find((g) => g.pin === pin);

  if (game) {
    const player = game.players.find((p) => p.id === playerId);

    if (!player) {
      // console.log("Joueur non trouvé pour ID:", playerId);
      return res.status(404).json({ message: "Joueur non trouvé" });
    }

    const isCorrect = guessedAnswer === game.rightAnswer;
    if (isCorrect) {
      player.points += 1;
    }

    player.hasAnswered = true;
    player.answer = guessedAnswer;
    game.allAnswered = game.players.every((p) => p.hasAnswered);

    // console.log("Réponse du joueur:", player);
    if (game.allAnswered) {
      // console.log(
      //   "Tous les joueurs ont répondu, manche terminée pour la partie:",
      //   pin
      // );
      io.to(pin).emit("all-answered", game);
    }

    return res.json({
      message: isCorrect ? "Bonne réponse, points ajoutés" : "Mauvaise réponse",
      hasAnswered: true,
      answer: guessedAnswer,
    });
  } else {
    return res.status(404).json({ message: "Partie non trouvée" });
  }
});

app.post("/api/next-turn", (req: any, res: any) => {
  const { pin } = req.body;

  const game = games.find((g) => g.pin === pin);

  if (game) {
    const allPlayersPlayed = game.players.every((player) => player.isTurn);
    if (allPlayersPlayed) {
      if (game.currentRound?.id === 4) {
        const maxPoints = Math.max(
          ...game.players.map((player) => player.points)
        );
        const winners = game.players.filter(
          (player) => player.points === maxPoints
        );
        // const winners = game.players.reduce((maxPlayer, player) =>
        //   player.points > maxPlayer.points ? player : maxPlayer
        // );

        io.to(pin).emit("end-game", { message: "Partie terminée", winners });
        return res.json({ message: "Partie terminée", winners });
      } else {
        const currentRound = rounds.find(
          (r) => r.id === (game.currentRound?.id ?? 0) + 1
        );
        if (currentRound) {
          game.currentRound = currentRound;
        }
        game.allAnswered = false;
        game.rightAnswer = null;
        game.posedQuestions = [];
        game.players = game.players.map((p) =>
          p.id === 1
            ? {
                ...p,
                isRoundPlayer: true,
                isTurn: true,
                hasAnswered: false,
                answer: "",
              }
            : {
                ...p,
                isRoundPlayer: false,
                isTurn: false,
                hasAnswered: false,
                answer: "",
              }
        );
        const currentQuestion = getRandomQuestion(game);
        if (currentQuestion) {
          game.posedQuestions.push(currentQuestion.id);
          game.currentQuestion = currentQuestion;
        }
        io.to(pin).emit("round-ended", {
          message: "Tous les joueurs ont joué, la manche est terminée.",
          game,
        });
      }
    } else {
      const nextPlayer = game.players.find((player) => !player.isTurn);
      if (nextPlayer) {
        game.players.forEach((player) => {
          player.hasAnswered = false;
          player.isRoundPlayer = false;
          player.answer = "";
        });
        nextPlayer.isTurn = true;
        nextPlayer.isRoundPlayer = true;

        game.currentQuestion = getRandomQuestion(game) ?? null;
        if (game.currentQuestion) {
          game.posedQuestions.push(game.currentQuestion.id);
        }
        game.players = game.players.map((p) =>
          p.id === nextPlayer.id ? nextPlayer : p
        );
        game.rightAnswer = "";
        game.allAnswered = false;

        io.to(pin).emit("next-turn", { game });
        return res.json({ message: "Tour suivant traité" });
      }
    }
  } else {
    return res.status(404).json({ message: "Partie non trouvée" });
  }
});

app.use(express.static(path.join(__dirname, "../dist")));

app.get("*", (req: any, res: any) => {
  res.sendFile(path.join(__dirname, "../dist", "index.html"));
});

server.listen(port, () => {
  console.log(`Server running on port :${port}`);
});
