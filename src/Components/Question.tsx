import { observer } from "mobx-react";
import { gameStore } from "../store";
import QuestionForm from "./QuestionForm";

const Question = observer(() => {
  const {
    currentPlayer,
    roundPlayer,
    currentQuestion,
    rightAnswer,
    setRightAnswer,
    submitRightAnswer,
    submitGuess,
  } = gameStore;

  const handleSubmitAnswer = (answer: string | null) => {
    if (answer) {
      setRightAnswer(answer);
      submitRightAnswer(answer);
    }
  };

  const handleGuessAnswer = (answer: string | null) => {
    if (answer) {
      submitGuess(answer);
    }
  };

  return (
    <>
      {currentQuestion && currentPlayer ? (
        <div className="container">
          {roundPlayer?.id === currentPlayer.id ? (
            rightAnswer ? (
              <div>En attente des réponses des autres joueurs</div>
            ) : (
              <QuestionForm submitFunc={handleSubmitAnswer} />
            )
          ) : rightAnswer ? (
            <QuestionForm submitFunc={handleGuessAnswer} />
          ) : (
            <div>{roundPlayer?.username} est en train de répondre</div>
          )}
        </div>
      ) : (
        <div>Chargement</div>
      )}
    </>
  );
});

export default Question;
