import { observer } from "mobx-react";
import React, { useEffect, useState } from "react";
import HomePage from "./Components/HomePage";
import LoadingRoom from "./Components/LoadingRoom";
import Question from "./Components/Question";
import Round from "./Components/Round";
import TurnEnd from "./Components/TurnEnd";
import { gameStore } from "./store";

const App: React.FC = () => {
  const { currentGame, currentRound, allAnswered, showAnswers } = gameStore;
  const [showQuestion, setShowQuestion] = useState(false);

  useEffect(() => {
    gameStore.setupSocketListeners();

    if (gameStore.pin) {
      gameStore.joinSocketRoom(gameStore.pin);
    }
  }, [gameStore.pin]);

  useEffect(() => {
    if (currentRound) {
      const timer = setTimeout(() => {
        setShowQuestion(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [currentRound]);

  return (
    <div className="container">
      {allAnswered ? (
        <TurnEnd />
      ) : showQuestion ? (
        <Question />
      ) : currentRound ? (
        <Round />
      ) : currentGame ? (
        <LoadingRoom />
      ) : (
        <HomePage />
      )}
    </div>
  );
};

export default observer(App);
