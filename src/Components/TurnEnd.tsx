import { observer } from "mobx-react";
import { gameStore } from "../store";
import Ranking from "./Ranking";
import RightAnswer from "./RightAnswer";

const TurnEnd = observer(() => {
  const {
    gameCreator,
    showAnswers,
    showRanking,
    emitShowAnswers,
    emitShowRanking,
    emitNextTurn,
  } = gameStore;

  return (
    <div className="colmn-space-btwn gap-2">
      <div></div>
      {!showAnswers && <h4>TERMINÉ</h4>}
      {showRanking ? <Ranking /> : showAnswers ? <RightAnswer /> : null}
      {gameCreator ? (
        showRanking ? (
          <button
            onClick={() => {
              emitNextTurn();
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
      ) : (
        <div></div>
      )}
    </div>
  );
});

export default TurnEnd;
