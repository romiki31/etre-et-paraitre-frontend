import { observer } from "mobx-react";
import { gameStore } from "../store";

const CreateGame = observer(() => {
  const { startGame } = gameStore;

  return (
    <div className="container">
      {gameStore.gameCreator && (
        <div className="flex-space-btw">
          <p>Code PIN :</p>
          <h3>{gameStore.pin}</h3>
        </div>
      )}
      <div>
        <p>En attente des autres joueurs...</p>
        {gameStore.currentGame?.players.map((player) => {
          return <h3 key={player.id}>{player.username}</h3>;
        })}
        {gameStore.gameCreator &&
        gameStore.currentGame &&
        gameStore.currentGame.players.length >= 2 ? (
          <button onClick={() => startGame()}>GO !</button>
        ) : null}
      </div>
    </div>
  );
});

export default CreateGame;
