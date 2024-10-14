import { observer } from "mobx-react";
import { useState } from "react";
import { gameStore } from "../store";
import Popup from "./Popup";
import QuestionForm from "./QuestionForm";
import Ranking from "./Ranking";

const Question = observer(() => {
  const {
    currentPlayer,
    roundPlayer,
    currentRound,
    currentQuestion,
    rightAnswer,
    hasAnswered,
    submitRightAnswer,
    submitGuess,
  } = gameStore;

  const [showPopup, setShowPopup] = useState(false);

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
          <div className="flex-space-btw m-b-150">
            <div>
              <h4 className="m-b-10">Manche {currentRound.id}</h4>
              <div className="flex gap-1">
                <p className="small-text">Tour de :</p>
                <p className="accent-color">{roundPlayer?.username}</p>
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
          ) : rightAnswer ? (
            <QuestionForm submitFunc={handleSubmitAnswer} />
          ) : (
            <>
              <p>{roundPlayer?.username} est en train de répondre</p>
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
