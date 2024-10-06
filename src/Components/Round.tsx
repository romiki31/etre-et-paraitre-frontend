import { toJS } from "mobx";
import { observer } from "mobx-react";
import { gameStore } from "../store";

const Round = observer(() => {
  const { currentRound } = gameStore;

  console.log(toJS(currentRound));

  return (
    <div className="container">
      {currentRound ? (
        <>
          <h3>Manche {currentRound.id}</h3>
          <h2>{currentRound.name}</h2>
        </>
      ) : null}
    </div>
  );
});

export default Round;
