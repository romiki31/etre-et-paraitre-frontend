import { observer } from "mobx-react";
import { gameStore } from "../store";
import Ranking from "./Ranking";
import RightAnswer from "./RightAnswer";

const RoundEnd = observer(() => {
  const {
    gameCreator,
    showAnswers,
    showRanking,
    showEndRound,
    emitShowAnswers,
    emitShowRanking,
    emitShowEndRound,
  } = gameStore;

  return (
    <div className="container">
      {!showAnswers && <h3>Terminé</h3>}
      {showEndRound ? (
        <RoundEnd />
      ) : showRanking ? (
        <Ranking />
      ) : showAnswers ? (
        <RightAnswer />
      ) : null}
      {gameCreator ? (
        showRanking ? (
          <button
            onClick={() => {
              emitShowEndRound();
            }}
          >
            Suivant
          </button>
        ) : showAnswers ? (
          <button
            onClick={() => {
              emitShowRanking();
            }}
          >
            Voir le classement
          </button>
        ) : (
          <button
            onClick={() => {
              emitShowAnswers();
            }}
          >
            Voir la réponse
          </button>
        )
      ) : null}
    </div>
  );
});

export default RoundEnd;
