import { observer } from "mobx-react";
import { gameStore } from "../store";

const Ranking = observer(() => {
  const { gamePlayers } = gameStore;

  const sortedPlayers = [...gamePlayers].sort((a, b) => b.points - a.points);

  return (
    <div className="container">
      <h1>Classement</h1>
      {sortedPlayers.length
        ? sortedPlayers.map((player, index) => {
            return (
              <div key={player.username} className="flex">
                <div>{index + 1}</div>
                <div>{player.username}</div>
                <div>{player.points}</div>
              </div>
            );
          })
        : null}
    </div>
  );
});

export default Ranking;
