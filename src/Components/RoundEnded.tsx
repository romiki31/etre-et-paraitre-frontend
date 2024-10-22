import { toJS } from "mobx";
import { observer } from "mobx-react";
import { gameStore } from "../store";

const RoundEnded = observer(() => {
  const { winner } = gameStore;

  console.log(toJS(winner));

  return (
    <>
      {winner ? (
        <div>{winner.username} a remporté la partie !</div>
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
