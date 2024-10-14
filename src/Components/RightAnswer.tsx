import { observer } from "mobx-react";
import { gameStore } from "../store";

const RightAnswer = observer(() => {
  const { showAnswers, currentQuestion, rightAnswer } = gameStore;

  return (
    <>
      {currentQuestion ? (
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
