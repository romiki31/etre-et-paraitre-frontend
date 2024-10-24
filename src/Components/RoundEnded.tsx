import { observer } from "mobx-react";
import { gameStore } from "../store";

const RoundEnded = observer(() => {
  const { winner } = gameStore;

  return (
    <>
      {winner ? (
        <div className="colmn-space-btwn">
          <div></div>
          <h3>{winner.username} a remporté la partie !</h3>
          <div></div>
        </div>
      ) : (
        <div>
          <h2>MANCHE TERMINÉE !</h2>
          <p>a remporté la manche</p>
        </div>
      )}
    </>
  );
});

export default RoundEnded;
