import { observer } from "mobx-react-lite";
import { gameStore } from "../store";
import Ranking from "./Ranking";
import RightAnswer from "./RightAnswer";

const TurnEnd = observer(() => {
  const {
    showAnswers,
    showRanking,
    // emitShowRanking,
    emitNextTurn,
    getBtnClass,
    currentGame,
    gameCreator,
  } = gameStore;

  const currentRound = currentGame?.currentRound;

  return (
    <div className="colmn-space-btwn gap-2">
      {showRanking ? null : <div></div>}
      {!showAnswers && !showRanking && <h4>TERMINÉ</h4>}
      {showRanking ? <Ranking /> : showAnswers ? <RightAnswer /> : null}
      {gameCreator ? (
        <button
          onClick={() => {
            emitNextTurn();
          }}
          className={currentRound ? `${getBtnClass(currentRound.id)}` : ""}
        >
          Suivant
        </button>
      ) : (
        <div></div>
      )}
    </div>
  );
});

export default TurnEnd;
