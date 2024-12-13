import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { Routes, goToWithParams } from "./routes";
import { gameStore } from "./store";

const App: React.FC = observer(() => {
  const { getBackgroundClass, currentGame } = gameStore;

  const [pin, setPin] = useState<string | null>(null);
  const [currentPlayerId, setCurrentPlayerId] = useState<string | null>(null);

  useEffect(() => {
    gameStore.setupSocketListeners();
    const urlPath = window.location.pathname;
    const pathSegments = urlPath.split("/");
    if (pathSegments.length >= 2) {
      setPin(pathSegments.slice(-2)[0]);
      setCurrentPlayerId(pathSegments.slice(-1)[0]);
    }
  }, []);

  console.log(toJS(gameStore.currentPlayerId));
  console.log(toJS(gameStore.currentGame));

  useEffect(() => {
    if (gameStore.pin) {
      gameStore.joinSocketRoom(gameStore.pin);
    }
    if (gameStore.pin && gameStore.currentPlayerId) {
      gameStore.getCurrentGame(gameStore.pin, gameStore.currentPlayerId);
    } else if (pin && currentPlayerId) {
      gameStore.getCurrentGame(pin, parseInt(currentPlayerId));
    }
  }, [pin, currentPlayerId, gameStore.pin, gameStore.currentPlayerId]);

  useEffect(() => {
    if (
      gameStore.currentGame?.currentRound &&
      gameStore.pin &&
      gameStore.currentPlayerId
    ) {
      const timer = setTimeout(() => {
        gameStore.setShowQuestion(true);
        goToWithParams(
          "/question",
          gameStore.pin,
          gameStore.currentPlayerId!.toLocaleString()
        );
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [
    gameStore.currentGame?.currentRound,
    gameStore.pin,
    gameStore.currentPlayerId,
  ]);

  useEffect(() => {
    if (gameStore.pin && gameStore.currentPlayerId) {
      if (gameStore.winner) {
        goToWithParams(
          "/round-ended",
          gameStore.pin,
          gameStore.currentPlayerId.toLocaleString()
        );
      } else if (gameStore.currentGame?.allAnswered) {
        goToWithParams(
          "/turn-end",
          gameStore.pin,
          gameStore.currentPlayerId.toLocaleString()
        );
      } else if (gameStore.showQuestion) {
        goToWithParams(
          "/question",
          gameStore.pin,
          gameStore.currentPlayerId.toLocaleString()
        );
      } else if (gameStore.currentGame?.currentRound) {
        goToWithParams(
          "/round",
          gameStore.pin,
          gameStore.currentPlayerId.toLocaleString()
        );
      } else if (gameStore.currentGame) {
        goToWithParams(
          "/loading-room",
          gameStore.pin,
          gameStore.currentPlayerId.toLocaleString()
        );
      }
    }
  }, [
    gameStore.winner,
    gameStore.currentGame,
    gameStore.showQuestion,
    gameStore.pin,
    gameStore.currentPlayerId,
  ]);

  return (
    <div
      className={
        currentGame?.currentRound
          ? `main-container ${getBackgroundClass(currentGame.currentRound.id)}`
          : "main-container"
      }
    >
      <div className="container">
        <Routes />
      </div>
    </div>
  );
});

export default App;
