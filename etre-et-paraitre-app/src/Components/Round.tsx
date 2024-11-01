import { observer } from "mobx-react-lite";
import { gameStore } from "../store";

const Round = observer(() => {
  const { currentGame } = gameStore;

  const currentRound = currentGame?.currentRound;

  return (
    <>
      {currentRound ? (
        <div className="colmn-center gap-2">
          <h4>Manche {currentRound.id}</h4>
          <h2 className="uppercase">{currentRound.name}</h2>
        </div>
      ) : null}
    </>
  );
});

export default Round;
