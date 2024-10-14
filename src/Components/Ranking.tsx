import { observer } from "mobx-react";
import { gameStore } from "../store";

const Ranking = observer(() => {
  const { gamePlayers } = gameStore;

  const sortedPlayers = [...gamePlayers].sort((a, b) => b.points - a.points);

  return (
    <div className="flex-column gap-2">
      <h4>Classement</h4>
      <div className="flex-column gap-2">
        {sortedPlayers.length
          ? sortedPlayers.map((player, index) => {
              return (
                <div key={player.username} className="flex-space-btw">
                  <div className="flex gap-1">
                    <p>{index + 1}</p>
                    <p>{player.username}</p>
                  </div>
                  <p>{player.points} pts</p>
                </div>
              );
            })
          : null}
      </div>
    </div>
  );
});

export default Ranking;
