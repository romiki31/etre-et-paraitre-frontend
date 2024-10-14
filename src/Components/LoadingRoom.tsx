import { observer } from "mobx-react";
import { gameStore } from "../store";

const LoadingRoom = observer(() => {
  const { startGame, currentPlayer } = gameStore;

  return (
    <div className="flex-column gap-5">
      {gameStore.gameCreator && (
        <div className="flex-space-btw">
          <p>Code PIN :</p>
          <h3>{gameStore.pin}</h3>
        </div>
      )}
      <p>En attente des autres joueurs...</p>
      <div className="flex-column gap-2">
        {gameStore.currentGame?.players.map((player) => {
          return (
            <h4
              key={player.id}
              className={currentPlayer?.id === player.id ? "accent-color" : ""}
            >
              {player.username}
            </h4>
          );
        })}
      </div>
      {gameStore.gameCreator &&
      gameStore.currentGame &&
      gameStore.currentGame.players.length >= 2 ? (
        <button onClick={() => startGame()}>GO !</button>
      ) : null}
    </div>
  );
});

export default LoadingRoom;
