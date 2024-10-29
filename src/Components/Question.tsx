import { observer } from "mobx-react";
import { useState } from "react";
import { gameStore } from "../store";
import Popup from "./Popup";
import QuestionForm from "./QuestionForm";
import Ranking from "./Ranking";

const Question = observer(() => {
  const {
    currentGame,
    currentPlayer,
    roundPlayer,
    currentQuestion,
    rightAnswer,
    answer,
    submitRightAnswer,
    submitGuess,
  } = gameStore;

  const [showPopup, setShowPopup] = useState(false);
  const currentRound = currentGame?.currentRound;

  const handleSubmitAnswer = (answer: string | null) => {
    if (answer) {
      if (rightAnswer) {
        submitGuess(answer);
      } else {
        submitRightAnswer(answer);
      }
    }
  };

  return (
    <>
      {currentQuestion && currentPlayer && currentRound ? (
        <div className="colmn-space-btwn">
          <div className="flex-space-btw">
            <div>
              <h4 className="text-left m-b-10">Manche {currentRound.id}</h4>
              <div className="flex gap-1">
                <p className="small-text">Tour de :</p>
                <p className="accent-text">{roundPlayer?.username}</p>
              </div>
            </div>
            <button
              style={{
                all: "unset",
                cursor: "pointer",
              }}
              onClick={() => setShowPopup(true)}
            >
              <img src="/assets/podium.png" alt="" />
            </button>
          </div>

          {roundPlayer?.id === currentPlayer.id ? (
            rightAnswer ? (
              <>
                <p>En attente des réponses des autres joueurs</p>
                <div></div>
              </>
            ) : (
              <QuestionForm submitFunc={handleSubmitAnswer} />
            )
          ) : rightAnswer && !answer ? (
            <QuestionForm submitFunc={handleSubmitAnswer} />
          ) : answer ? (
            <>
              <p>En attente des réponses des autres joueurs</p>
              <div></div>
            </>
          ) : (
            <>
              <div className="flex-center gap-1">
                <p className="soft-text">
                  {" "}
                  <span className="strong">{roundPlayer?.username} </span>
                  est en train de répondre à : <br />
                  <br />
                  <p className="strong">{currentQuestion.name}</p>
                </p>
              </div>
              <div></div>
            </>
          )}
          {showPopup && (
            <Popup onClose={() => setShowPopup(false)} children={<Ranking />} />
          )}
        </div>
      ) : (
        <div>Chargement</div>
      )}
    </>
  );
});

export default Question;
