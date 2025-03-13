import { toJS } from "mobx";
import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { Routes, goToWithParams } from "./routes";
import { gameStore } from "./store";

const App: React.FC = observer(() => {
  const { getBackgroundClass, currentGame, winners } = gameStore;

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
    const handleFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      setTimeout(() => {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
    };

    document.addEventListener("focusin", handleFocus);
    return () => document.removeEventListener("focusin", handleFocus);
  }, []);

  // console.log(toJS(gameStore.currentPlayerId));
  // console.log(toJS(gameStore.currentGame));

  useEffect(() => {
    if (gameStore.pin) {
      gameStore.joinSocketRoom(gameStore.pin);
    }

    let intervalId: NodeJS.Timeout | null = null;

    if (gameStore.pin && gameStore.currentPlayerId) {
      intervalId = setInterval(() => {
        if (!gameStore.winners) {
          gameStore.getCurrentGame(gameStore.pin, gameStore.currentPlayerId!);
        }
      }, 15 * 1000);
    } else if (pin && currentPlayerId) {
      gameStore.getCurrentGame(pin, parseInt(currentPlayerId));
    }
    if (gameStore.winners && intervalId) {
      clearInterval(intervalId);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
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
    console.log(toJS(gameStore.currentGame));
    if (gameStore.pin && gameStore.currentPlayerId && gameStore.currentGame) {
      if (gameStore.winners) {
        goToWithParams(
          "/round-ended",
          gameStore.pin,
          gameStore.currentPlayerId.toLocaleString()
        );
      } else if (gameStore.currentGame.allAnswered) {
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
    gameStore.winners,
    gameStore.currentGame,
    gameStore.showQuestion,
    gameStore.pin,
    gameStore.currentPlayerId,
  ]);

  return (
    <div
      className={
        currentGame?.currentRound && !winners
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
