import { observer } from "mobx-react";
import { gameStore } from "../store";

const RightAnswer = observer(() => {
  const {
    showAnswers,
    currentQuestion,
    rightAnswer,
    currentRound,
    gamePlayers,
  } = gameStore;

  return (
    <>
      {currentRound?.id === 3 || currentRound?.id === 4 ? (
        <div className="flex-column gap-2">
          {gamePlayers.map((p) => {
            return (
              <p
                key={p.id}
                className={
                  showAnswers && rightAnswer === p.username
                    ? "highlight-right-answer"
                    : ""
                }
              >
                {p.username}
              </p>
            );
          })}
        </div>
      ) : currentQuestion ? (
        <div className="flex-column gap-2">
          <p
            className={
              showAnswers && rightAnswer === currentQuestion.answer_1
                ? "highlight-right-answer"
                : ""
            }
          >
            {currentQuestion.answer_1}
          </p>
          <p
            className={
              showAnswers && rightAnswer === currentQuestion.answer_2
                ? "highlight-right-answer"
                : ""
            }
          >
            {currentQuestion.answer_2}
          </p>
          <p
            className={
              showAnswers && rightAnswer === currentQuestion.answer_3
                ? "highlight-right-answer"
                : ""
            }
          >
            {currentQuestion.answer_3}
          </p>
          <p
            className={
              showAnswers && rightAnswer === currentQuestion.answer_4
                ? "highlight-right-answer"
                : ""
            }
          >
            {currentQuestion.answer_4}
          </p>
        </div>
      ) : null}
    </>
  );
});

export default RightAnswer;
