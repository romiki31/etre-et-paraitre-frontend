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
    getBtnClass,
    currentGame,
  } = gameStore;

  const currentRound = currentGame?.currentRound;

  return (
    <div className="colmn-space-btwn gap-2">
      {showRanking ? null : <div></div>}
      {!showAnswers && <h4>TERMINÉ</h4>}
      {showRanking ? <Ranking /> : showAnswers ? <RightAnswer /> : null}
      {gameCreator ? (
        showRanking ? (
          <button
            onClick={() => {
              emitNextTurn();
            }}
            className={currentRound ? `${getBtnClass(currentRound.id)}` : ""}
          >
            Suivant
          </button>
        ) : showAnswers ? (
          <button
            onClick={() => {
              emitShowRanking();
            }}
            className={currentRound ? `${getBtnClass(currentRound.id)}` : ""}
          >
            Voir le classement
          </button>
        ) : (
          <button
            onClick={() => {
              emitShowAnswers();
            }}
            className={currentRound ? `${getBtnClass(currentRound.id)}` : ""}
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
