import { observer } from "mobx-react";
import { useState } from "react";
import { gameStore } from "../store";
import Popup from "./Popup";
import QuestionForm from "./QuestionForm";
import Ranking from "./Ranking";

const Question = observer(() => {
  const {
    currentRound,
    currentPlayer,
    roundPlayer,
    currentQuestion,
    rightAnswer,
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
          <div className="flex-space-btw">
            <div>
              <h4 className="text-left m-b-10">Manche {currentRound.id}</h4>
              <div className="flex gap-1">
                <p className="small-text">Tour de :</p>
                <p className="third-color">{roundPlayer?.username}</p>
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
              <div className="flex-center gap-1">
                <p className="third-color">{roundPlayer?.username}</p>
                <p>est en train de répondre</p>
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
