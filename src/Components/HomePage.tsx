import { observer } from "mobx-react-lite";
import { useState } from "react";
import { gameStore } from "../store";
import UsernameInput from "./UsernameInput";

const HomePage = observer(() => {
  const {
    isPinValid,
    gameCreator,
    generatePin,
    checkPin,
    createGame,
    errorMessage,
    setErrorMessage,
  } = gameStore;

  const [inputPin, setInputPin] = useState("");
  const [inputUsername, setInputUsername] = useState("");

  return (
    <div className="colmn-space-btwn">
      <h1 className="title">ÊTRE ET PARAÎTRE</h1>
      {gameCreator || isPinValid ? (
        <div className="flex-column gap-1">
          <div className="flex button-slide-in">
            <UsernameInput
              value={inputUsername}
              onChange={(e) => setInputUsername(e.target.value)}
            />
            <button
              className="w-33 internal-btn"
              onClick={() => {
                if (inputUsername.trim() !== "") {
                  createGame(inputUsername);
                } else {
                  setErrorMessage("Insérez un pseudo valide");
                }
              }}
            >
              GO
            </button>
          </div>
          {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
        </div>
      ) : (
        <>
          <p className="soft-text">
            Bienvenue ! <br />
            <br />
            Commencez une nouvelle partie ou rejoignez une partie existante en
            entrant le code PIN généré par le créateur de la partie
          </p>
          <div className="flex-column gap-1">
            <button onClick={generatePin}>Créer une partie</button>
            <h4>Ou</h4>
            <div className="flex">
              <input
                className="w-66 internal-input"
                placeholder="Code PIN ..."
                value={inputPin}
                onChange={(e) => setInputPin(e.target.value)}
              />
              <button
                className="w-33 internal-btn"
                onClick={() => checkPin(inputPin.toUpperCase())}
              >
                GO
              </button>
            </div>
            {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
          </div>
        </>
      )}
    </div>
  );
});

export default HomePage;
