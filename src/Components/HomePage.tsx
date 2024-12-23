import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
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
  const [isIntro, setIsIntro] = useState(true);
  const [isRules, setIsRules] = useState(false);

  useEffect(() => {
    if (isRules) {
      setIsIntro(false);
    }
  }, [isRules]);

  useEffect(() => {
    if (isPinValid) {
      setErrorMessage("");
    }
  }, [isPinValid]);

  return (
    <div className="colmn-space-btwn">
      {isRules ? null : <h1 className="title">PERCEPT</h1>}
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
      ) : isIntro ? (
        <>
          <p className="soft-text">
            Avec Percept, plongez dans une expérience où vos perceptions et
            celles des autres se confrontent. <br />
            Jouez et découvrez comment vos amis vous voient et si vous êtes
            celui ou celle qu'ils croient ! <br />
            Si vous voulez gagner, il faudra cerner qui se cache derrière les
            masques que les autres joueurs portent… parfois même sans s’en
            apercevoir. <br /> <br />
            Alors, connaissez-vous vraiment vos partenaires de jeu ? Sont-ils
            ceux que vous pensez ? Percept vous offrira l’opportunité que vous
            attendiez pour vous découvrir ou vous redécouvrir. À vous de jouer !
          </p>
          <button onClick={() => setIsRules(true)}>Suivant</button>
        </>
      ) : isRules ? (
        <div className="flex-column gap-1">
          <h3>Règles du jeu</h3>
          <p className="very-small-text">
            <p>Comment ça marche ?</p>
            1. À chaque tour, un joueur tire une question et y répond. <br />
            2. Les autres doivent deviner sa réponse : qu’aurait-il ou elle pu
            dire ? <br />
            3. Le rôle du "questionné" change à chaque nouvelle question. <br />
            4. La partie se joue en <span className="strong">4 manches</span>,
            chacune avec un type de question différent pour varier les surprises
            ! <br />
            <i>
              <u>
                {" "}
                <span className="strong">
                  *Si besoin : accordez vous sur les termes et/ou le contexte de
                  la question avant d’y répondre
                </span>
              </u>
            </i>{" "}
            <br />
            <br />
            <p>Le but du jeu :</p>
            Accumulez des points en devinant les réponses des autres joueurs.
            Attention, pas de points en jeu pour votre propre réponse, alors
            soyez <span className="strong">honnête et spontané</span>. <br />
            <br />
            <p>Pourquoi vous allez adorer ?</p>
            Au-delà du jeu, l’intérêt réside dans les discussions qui en
            découlent. Débriefez les réponses, essayez de comprendre les choix
            des uns et des autres, et découvrez des facettes inattendues de vos
            amis ou de votre famille. <br />
            <br />
            <p>Infos pratiques :</p>
            Pour 4 à 7 joueurs
            <br />
            Idéal pour des soirées pleines de rires, de débats, et de
            découvertes.
            <br />
            Celui ou celle qui aura deviné le plus de réponses remporte la
            partie ! <br />
            <br />
            <i>
              <span className="strong">
                Un jeu simple à prendre en main, mais riche en surprises et en
                émotions.
              </span>
            </i>
          </p>
          <button onClick={() => setIsRules(false)}>Suivant</button>
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
                type="number"
                inputMode="numeric"
                pattern="\d{6}"
                minLength={6}
                maxLength={6}
                className="w-66 internal-input"
                placeholder="Code PIN ..."
                value={inputPin}
                onChange={(e) => setInputPin(e.target.value)}
              />
              <button
                className="w-33 internal-btn"
                onClick={() => checkPin(inputPin)}
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
