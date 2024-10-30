import { observer } from "mobx-react";
import { gameStore } from "../store";

const LoadingRoom = observer(() => {
  const { gameCreator, pin, currentGame, startGame, currentPlayerId } =
    gameStore;

  return (
    <div className="colmn-space-btwn">
      {gameCreator && (
        <div className="flex-space-btw">
          <p>Code PIN :</p>
          <h3>{pin}</h3>
        </div>
      )}
      <div className="flex-column gap-5">
        <p>En attente des autres joueurs...</p>
        <div className="flex-column gap-2">
          {currentGame?.players.map((player) => {
            return (
              <h4
                key={player.id}
                className={currentPlayerId === player.id ? "accent-color" : ""}
              >
                {player.username}
              </h4>
            );
          })}
        </div>
      </div>
      {gameCreator && currentGame && currentGame.players.length >= 2 ? (
        <button onClick={() => startGame()}>GO !</button>
      ) : (
        <div></div>
      )}
    </div>
  );
});

export default LoadingRoom;
