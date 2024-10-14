import { observer } from "mobx-react";

const RoundEnded = observer(() => {
  return (
    <div>
      <h2>MANCHE TERMINÉE !</h2>
      <p>a remporté la manche</p>
    </div>
  );
});

export default RoundEnded;
