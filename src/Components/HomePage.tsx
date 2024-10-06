import { observer } from "mobx-react";
import { useState } from "react";
import { gameStore } from "../store";
import UsernameInput from "./UsernameInput";

const HomePage = observer(() => {
  const {
    isPinValid,
    gameCreator,
    generatePin,
    checkPin,
    joinGame,
    createGame,
    errorMessage,
  } = gameStore;

  const [inputPin, setInputPin] = useState("");
  const [inputUsername, setInputUsername] = useState("");

  // Étape 1: Vérifier le code PIN
  const handleCheckPin = async () => {
    await checkPin(inputPin);
  };

  // Étape 2: Ajouter le joueur après vérification du PIN
  const handleJoinGame = async () => {
    await joinGame(inputUsername);
  };

  return (
    <>
      <h1>ÊTRE ET PARAÎTRE</h1>
      {gameCreator || isPinValid ? (
        <>
          {gameCreator && (
            <p className="center-text">
              Code PIN en cours de téléchargement ...
            </p>
          )}
          <div className="flex">
            <UsernameInput
              value={inputUsername}
              onChange={(e) => setInputUsername(e.target.value)}
            />
            <button onClick={() => createGame(inputUsername)}>GO</button>
          </div>
        </>
      ) : (
        <div>
          <button onClick={generatePin}>Créer une partie</button>
          <h3>Ou</h3>
          <div className="flex">
            <input
              placeholder="Code PIN ..."
              value={inputPin}
              onChange={(e) => setInputPin(e.target.value)}
            />
            <button onClick={handleCheckPin}>Vérifier le PIN</button>
          </div>
          {isPinValid && (
            <div className="flex">
              <input
                placeholder="Pseudo ..."
                value={inputUsername}
                onChange={(e) => setInputUsername(e.target.value)}
              />
              <button onClick={handleJoinGame}>Rejoindre la partie</button>
            </div>
          )}
          {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
        </div>
      )}
    </>
  );
});

export default HomePage;
