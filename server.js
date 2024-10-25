const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { questions, rounds } = require("./constantes");

const app = express();
const port = process.env.PORT || 5001;
const path = require("path");

const server = http.createServer(app);
const io = new Server(server, {});
// const apiBaseUrl =
//   process.env.NODE_ENV === "production"
//     ? "https://donska.fr"
//     : "http://localhost:5001";

app.use(cors());
app.use(express.json());

let games = [];

function getRandomQuestion(game) {
  const roundQuestions = questions.filter(
    (q) =>
      q.round_id === game.currentRound.id && !game.posedQuestions.includes(q.id)
  );
  return roundQuestions[Math.floor(Math.random() * roundQuestions.length)];
}

io.on("connection", (socket) => {
  console.log("Un joueur s'est connecté : ", socket.id);

  socket.on("disconnect", () => {
    console.log("Un joueur s'est déconnecté : ", socket.id);
  });

  socket.on("join-game", (gamePin) => {
    socket.join(gamePin);
    console.log(
      `Le joueur ${socket.id} a rejoint la partie avec le PIN : ${gamePin}`
    );
  });

  socket.on("show-answers", (gamePin) => {
    io.to(gamePin).emit("show-answers");
  });

  socket.on("show-ranking", (gamePin) => {
    io.to(gamePin).emit("show-ranking");
  });

  socket.on("show-end-round", (gamePin) => {
    io.to(gamePin).emit("show-end-round");
  });
});

app.post("/api/check-pin", (req, res) => {
  const { pin } = req.body;
  const game = games.find((g) => g.pin === pin);

  if (game) {
    return res.json({ valid: true, message: "Le code PIN est valide", game });
  } else {
    return res.status(404).json({ valid: false, message: "Code PIN invalide" });
  }
});

app.post("/api/create-game", (req, res) => {
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

    const newPlayer = {
      id: game.players.length + 1,
      username: username,
      points: 0,
    };

    game.players.push(newPlayer);

    io.to(pin).emit("player-joined", game);

    return res.json({
      message: "Joueur ajouté à la partie existante",
      game,
      currentPlayer: newPlayer,
    });
  } else {
    const newPlayer = {
      id: 1,
      username: username,
      points: 0,
    };

    const newGame = {
      id: games.length + 1,
      pin: pin,
      players: [newPlayer],
      currentRound: rounds.find((round) => round.id === 1),
      posedQuestions: [],
    };

    games.push(newGame);

    io.to(pin).emit("game-created", newGame);

    return res.json({
      message: "Nouvelle partie créée",
      game: newGame,
      currentPlayer: newPlayer,
    });
  }
});

app.post("/api/start-game", (req, res) => {
  const { pin } = req.body;

  let game = games.find((g) => g.pin === pin);

  if (game) {
    const currentQuestion = getRandomQuestion(game);
    game.posedQuestions = [...game.posedQuestions, currentQuestion.id];

    const roundPlayer = game.players.find((player) => player.id === 1);

    game.players = game.players.map((player) => ({
      ...player,
      isTurn: player.id === roundPlayer.id,
    }));

    io.to(pin).emit("game-started", {
      currentQuestion,
      roundPlayer,
      currentRound: game.currentRound,
      gamePlayers: game.players,
    });

    return res.json({
      message: "Le jeu a démarré",
      currentQuestion,
      roundPlayer: roundPlayer,
      currentRound: game.currentRound,
      gamePlayers: game.players,
    });
  } else {
    return res.status(404).json({ message: "Partie non trouvée" });
  }
});

app.post("/api/submit-answer", (req, res) => {
  const { pin, rightAnswer, roundPlayer } = req.body;

  let game = games.find((g) => g.pin === pin);

  if (game) {
    game.rightAnswer = rightAnswer;
    const player = game.players.find((p) => p.id === roundPlayer.id);
    player.hasAnswered = true;
    player.answer = rightAnswer;

    io.to(pin).emit("right-answer-submitted", rightAnswer);

    return res.json({
      message: "Bonne réponse soumise",
      right_answer: rightAnswer,
    });
  } else {
    return res.status(404).json({ message: "Partie non trouvée" });
  }
});

app.post("/api/submit-guess", (req, res) => {
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

    if (allAnswered) {
      io.to(pin).emit("all-answered", true, game.players);
    }

    return res.json({
      message: isCorrect ? "Bonne réponse, points ajoutés" : "Mauvaise réponse",
      isCorrect,
      hasAnswered: true,
      answer: guessedAnswer,
    });
  } else {
    return res.status(404).json({ message: "Partie non trouvée" });
  }
});

app.post("/api/next-turn", (req, res) => {
  const { pin } = req.body;

  let game = games.find((g) => g.pin === pin);

  if (game) {
    const allPlayersPlayed = game.players.every((player) => player.isTurn);
    if (allPlayersPlayed) {
      if (game.currentRound.id === 4) {
        const winner = game.players.reduce((maxPlayer, currentPlayer) => {
          return currentPlayer.points > maxPlayer.points
            ? currentPlayer
            : maxPlayer;
        }, game.players[0]);

        io.to(pin).emit("end-game", {
          message: "Partie terminée",
          winner: winner,
        });
        return res.json({
          message: "Partie terminée",
          winner: winner,
        });
      } else {
        game.currentRound = rounds.find(
          (r) => r.id === game.currentRound.id + 1
        );
        let roundPlayer = game.players.find((player) => player.id === 1);
        game.rightAnswer = null;
        game.posedQuestions = [];
        game.players = game.players.map((p) =>
          p.id === roundPlayer.id
            ? { ...p, isTurn: true }
            : {
                ...p,
                isTurn: false,
                hasAnswered: false,
                answer: false,
              }
        );
        let currentQuestion = getRandomQuestion(game);
        game.posedQuestions = [...game.posedQuestions, currentQuestion.id];
        roundPlayer = { ...roundPlayer, isTurn: true };

        io.to(pin).emit("round-ended", {
          message: "Tous les joueurs ont joué, la manche est terminée.",
          game: game,
          roundPlayer: roundPlayer,
          currentQuestion: currentQuestion,
        });

        return res.json({
          message: "La manche est terminée.",
          gamePlayers: game.players,
          roundPlayer: roundPlayer,
          currentQuestion: currentQuestion,
        });
      }
    } else {
      const nextPlayer = game.players.filter((player) => !player.isTurn)[0];

      game.players = game.players.map((player) => ({
        ...player,
        hasAnswered: false,
        answer: "",
      }));

      game.players = game.players.map((p) =>
        p.id === nextPlayer.id ? { ...p, isTurn: true } : p
      );

      const currentQuestion = getRandomQuestion(game);
      game.posedQuestions = [...game.posedQuestions, currentQuestion.id];

      io.to(pin).emit("next-turn", {
        currentQuestion,
        roundPlayer: game.players.find((p) => p.id === nextPlayer.id),
        gamePlayers: game.players,
      });

      return res.json({
        message: "Tour suivant",
        currentQuestion,
        roundPlayer: game.players.find((p) => p.id === nextPlayer.id),
        gamePlayers: game.players,
      });
    }
  } else {
    return res.status(404).json({ message: "Partie non trouvée" });
  }
});

app.use(express.static(path.join(__dirname, "build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

server.listen(port, () => {
  console.log(`Server running on port :${port}`);
});
