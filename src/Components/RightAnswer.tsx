import { observer } from "mobx-react";
import { Question } from "../Constantes";
import { gameStore } from "../store";

const RightAnswer = observer(() => {
  const {
    showAnswers,
    currentQuestion,
    answer,
    rightAnswer,
    roundPlayer,
    currentPlayer,
    currentGame,
  } = gameStore;

  const currentRound = currentGame?.currentRound;

  return (
    <>
      <h4>La bonne réponse est ...</h4>
      {currentRound?.id === 3 || currentRound?.id === 4 ? (
        <>
          <div className="flex-column gap-2">
            {currentGame?.players.map((p) => {
              const isRightAnswer = rightAnswer === p.username;
              const isWrongAnswer =
                answer === p.username && answer !== rightAnswer;

              return (
                <p
                  key={p.id}
                  className={`${
                    showAnswers && isRightAnswer
                      ? "highlight-right-answer"
                      : showAnswers && isWrongAnswer
                      ? "highlight-wrong-answer"
                      : ""
                  }`}
                >
                  {p.username}
                </p>
              );
            })}
          </div>
        </>
      ) : currentQuestion ? (
        <div className="flex-column gap-2">
          {[1, 2, 3, 4].map((num) => {
            const currentAnswer =
              currentQuestion[`answer_${num}` as keyof Question];
            if (!currentAnswer) return null;

            const isRightAnswer = rightAnswer === currentAnswer;
            const isWrongAnswer =
              answer === currentAnswer && answer !== rightAnswer;

            return (
              <p
                key={num}
                className={`${
                  showAnswers && isRightAnswer
                    ? "highlight-right-answer"
                    : showAnswers && isWrongAnswer
                    ? "highlight-wrong-answer"
                    : ""
                }`}
              >
                {currentAnswer}
              </p>
            );
          })}
        </div>
      ) : null}
      {roundPlayer?.id !== currentPlayer?.id ? (
        rightAnswer === answer ? (
          <h3 className="accent-text">Bien joué !</h3>
        ) : (
          <h3 className="accent-text">Mauvaise réponse...</h3>
        )
      ) : null}
    </>
  );
});

export default RightAnswer;
