import cookieParser from "cookie-parser";
import express, { Request, Response } from "express";
import http from "http";
import path from "path";
import { Server, Socket } from "socket.io";
import { questions, rounds } from "./constantes";
import { emptyPlayer, Game, Player, Question } from "./src/Constantes";

const app = express();
const port = process.env.PORT || 5001;
const server = http.createServer(app);
const io = new Server(server, {});

app.use(express.json());
app.use(cookieParser());

let games: Game[] = [];

function getRandomQuestion(game: Game): Question | undefined {
  const roundQuestions = questions.filter(
    (q: Question) =>
      q.round_id === game.currentRound?.id &&
      !game.posedQuestions.includes(q.id)
  );
  return roundQuestions[Math.floor(Math.random() * roundQuestions.length)];
}

io.on("connection", (socket: Socket) => {
  console.log("Un joueur s'est connecté : ", socket.id);

  socket.on("disconnect", () => {
    console.log("Un joueur s'est déconnecté : ", socket.id);
  });

  socket.on("join-game", (gamePin: string) => {
    socket.join(gamePin);
    console.log(
      `Le joueur ${socket.id} a rejoint la partie avec le PIN : ${gamePin}`
    );
  });

  socket.on("show-answers", (gamePin: string) => {
    io.to(gamePin).emit("show-answers");
  });

  socket.on("show-ranking", (gamePin: string) => {
    io.to(gamePin).emit("show-ranking");
  });

  socket.on("show-end-round", (gamePin: string) => {
    io.to(gamePin).emit("show-end-round");
  });
});

app.get("/api/game/:pin/:currentPlayerId", (req: Request, res: Response) => {
  try {
    const { pin, currentPlayerId } = req.params;

    const game = games.find((g) => g.pin === pin);

    if (!game) {
      console.error(`Partie non trouvée pour le PIN: ${pin}`);
      return res.status(404).json({ message: "Partie non trouvée" });
    }

    console.log(`Données de la partie trouvées pour le PIN: ${pin}`);
    return res.json({ game, currentPlayerId: parseInt(currentPlayerId) });
  } catch (error) {
    console.error("Erreur dans /api/game/:pin/:currentPlayerId :", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
});

app.post("/api/check-pin", (req: Request, res: Response) => {
  const { pin } = req.body;
  const game = games.find((g) => g.pin === pin);

  if (game) {
    return res.json({ valid: true, message: "Le code PIN est valide", game });
  } else {
    return res.status(404).json({ valid: false, message: "Code PIN invalide" });
  }
});

app.post("/api/create-game", (req: Request, res: Response) => {
  const { pin, username } = req.body;

  let game = games.find((g) => g.pin === pin);

  if (game) {
    const existingPlayer = game.players.find(
      (player) => player.username === username
    );

    if (existingPlayer) {
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

    io.to(pin).emit("game-created", newGame);
    return res.json({
      message: "Nouvelle partie créée",
      game: newGame,
      currentPlayerId: newPlayer.id,
    });
  }
});

app.post("/api/start-game", (req: Request, res: Response) => {
  const { pin } = req.body;

  let game = games.find((g) => g.pin === pin);
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

    io.to(pin).emit("game-started", {
      game: game,
    });

    return res.json({
      message: "Le jeu a démarré",
      game: game,
    });
  } else {
    return res.status(404).json({ message: "Partie non trouvée" });
  }
});

app.post("/api/submit-answer", (req: Request, res: Response) => {
  const { pin, rightAnswer, roundPlayer } = req.body;

  let game = games.find((g) => g.pin === pin);

  if (game) {
    game.rightAnswer = rightAnswer;
    const player = game.players.find((p) => p.id === roundPlayer.id);

    if (player) {
      player.hasAnswered = true;
      player.isTurn = true;
      player.answer = rightAnswer;
    }

    io.to(pin).emit("right-answer-submitted", game);

    return res.json({
      message: "Bonne réponse soumise",
      game: game,
    });
  } else {
    return res.status(404).json({ message: "Partie non trouvée" });
  }
});

app.post("/api/submit-guess", (req: Request, res: Response) => {
  const { pin, playerId, guessedAnswer } = req.body;

  let game = games.find((g) => g.pin === pin);

  if (game) {
    const player = game.players.find((p) => p.id === playerId);

    if (!player) {
      return res.status(404).json({ message: "Joueur non trouvé" });
    }

    const isCorrect = guessedAnswer === game.rightAnswer;
    if (isCorrect) {
      player.points += 1;
    }

    player.hasAnswered = true;
    player.answer = guessedAnswer;

    let allAnswered = game.players.every((p) => p.hasAnswered);
    game.allAnswered = allAnswered;

    if (allAnswered) {
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

app.post("/api/next-turn", (req: Request, res: Response) => {
  const { pin } = req.body;

  let game = games.find((g) => g.pin === pin);

  if (game) {
    const allPlayersPlayed = game.players.every((player) => player.isTurn);
    if (allPlayersPlayed) {
      if (game.currentRound?.id === 4) {
        const winner = game.players.reduce((maxPlayer, player) =>
          player.points > maxPlayer.points ? player : maxPlayer
        );

        io.to(pin).emit("end-game", {
          message: "Partie terminée",
          winner: winner,
        });
        return res.json({
          message: "Partie terminée",
          winner: winner,
        });
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
        let currentQuestion = getRandomQuestion(game);
        if (currentQuestion) {
          game.posedQuestions.push(currentQuestion.id);
          game.currentQuestion = currentQuestion;
        }
        io.to(pin).emit("round-ended", {
          message: "Tous les joueurs ont joué, la manche est terminée.",
          game: game,
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
      }
    }
  } else {
    return res.status(404).json({ message: "Partie non trouvée" });
  }
});

app.use(express.static(path.join(__dirname, "build")));

app.get("*", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

server.listen(port, () => {
  console.log(`Server running on port :${port}`);
});
