import { toJS } from "mobx";
import { observer } from "mobx-react";
import React, { useEffect } from "react";
import { goToUrl, Routes } from "./routes";
import { gameStore } from "./store";

const App: React.FC = observer(() => {
  const {
    currentGame,
    showQuestion,
    showAnswers,
    setShowQuestion,
    getBackgroundClass,
    winner,
  } = gameStore;

  const currentRound = currentGame?.currentRound;
  const allAnswered = currentGame?.allAnswered;

  console.log(toJS(currentGame));
  // console.log("showQuestion", toJS(showQuestion));
  // console.log("showAnswer", toJS(showAnswers));
  // console.log("allAnswered", toJS(allAnswered));

  // useEffect(() => {
  //   gameStore.getCurrentGame();
  // }, []);

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
        goToUrl("/question");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [currentRound]);

  useEffect(() => {
    if (winner) {
      goToUrl("/round-ended");
    } else if (allAnswered) {
      goToUrl("/turn-end");
    } else if (showQuestion) {
      goToUrl("/question");
    } else if (currentRound) {
      goToUrl("/round");
    } else if (currentGame) {
      goToUrl("/loading-room");
    } else {
      goToUrl("/");
    }
  }, [winner, allAnswered, showQuestion, currentRound, currentGame]);

  return (
    <div
      className={
        currentRound
          ? `main-container ${getBackgroundClass(currentRound.id)}`
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
