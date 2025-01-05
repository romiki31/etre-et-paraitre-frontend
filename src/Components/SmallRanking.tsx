import { observer } from "mobx-react-lite";
import { gameStore } from "../store";

const SmallRanking = observer(() => {
  const { currentGame } = gameStore;

  const sortedPlayers = currentGame?.players
    .slice()
    .sort((a, b) => b.points - a.points);

  const topPlayers = sortedPlayers?.slice(0, 3);

  const getFontSize = (index: number) => {
    switch (index) {
      case 0:
        return "text-xl";
      case 1:
        return "text-lg";
      case 2:
        return "text-md";
    }
  };

  return (
    <div className="flex-column flex-center">
      {topPlayers?.length
        ? topPlayers.map((player, index) => (
            <div key={player.username} className="flex-space-btw gap-1">
              <p
                className={
                  index === 0
                    ? `${getFontSize(index)} accent-color`
                    : `${getFontSize(index)}`
                }
              >
                {index + 1} {player.username}
              </p>
            </div>
          ))
        : null}
    </div>
  );
});

export default SmallRanking;
