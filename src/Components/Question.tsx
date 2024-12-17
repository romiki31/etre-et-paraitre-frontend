import { observer } from "mobx-react-lite";
import { useState } from "react";
import Podium from "../assets/podium.png";
import { gameStore } from "../store";
import Popup from "./Popup";
import QuestionForm from "./QuestionForm";
import Ranking from "./Ranking";

const Question = observer(() => {
  const {
    currentGame,
    currentPlayerId,
    answer,
    submitRightAnswer,
    submitGuess,
  } = gameStore;

  const [showPopup, setShowPopup] = useState(false);
  const currentQuestion = currentGame?.currentQuestion;
  const currentRound = currentGame?.currentRound;
  const roundPlayer = currentGame?.players.find((p) => p.isRoundPlayer);
  const rightAnswer = currentGame?.rightAnswer;

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
      {currentQuestion && currentPlayerId && currentRound ? (
        <div className="colmn-space-btwn">
          <div className="flex-space-btw">
            <div>
              <h4 className="text-left m-b-10">Manche {currentRound.id}</h4>
              <div className="flex gap-1">
                <p className="small-text">Tour de :</p>
                <p className="accent-text">{roundPlayer?.username}</p>
              </div>
            </div>
            <button className="img-btn" onClick={() => setShowPopup(true)}>
              <img src={Podium} alt="" />
            </button>
          </div>

          {roundPlayer?.id === currentPlayerId ? (
            rightAnswer ? (
              <>
                <p>En attente des réponses des autres joueurs</p>
                <div></div>
              </>
            ) : (
              <QuestionForm
                submitFunc={handleSubmitAnswer}
                isDisabled={false}
              />
            )
          ) : rightAnswer && !answer ? (
            <QuestionForm submitFunc={handleSubmitAnswer} isDisabled={false} />
          ) : answer ? (
            <>
              <p>En attente des réponses des autres joueurs</p>
              <div></div>
            </>
          ) : (
            <>
              {/* <div className="flex-center gap-1"> */}
              <p className="soft-text">
                {" "}
                <span className="strong">{roundPlayer?.username} </span>
                est en train de répondre à : <br />
                <br />
                <p className="strong">{currentQuestion.name}</p>
                <br />
                <QuestionForm
                  submitFunc={handleSubmitAnswer}
                  isDisabled={true}
                />
              </p>
              {/* </div> */}
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
