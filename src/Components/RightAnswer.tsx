import { observer } from "mobx-react";
import { gameStore } from "../store";

const RightAnswer = observer(() => {
  const { showAnswers, currentQuestion, rightAnswer } = gameStore;

  return (
    <div className="container">
      {currentQuestion ? (
        <div>
          <div
            className={
              showAnswers && rightAnswer === currentQuestion.answer_1
                ? "highlight-right-answer"
                : ""
            }
          >
            {currentQuestion.answer_1}
          </div>
          <div
            className={
              showAnswers && rightAnswer === currentQuestion.answer_2
                ? "highlight-right-answer"
                : ""
            }
          >
            {currentQuestion.answer_2}
          </div>
          <div
            className={
              showAnswers && rightAnswer === currentQuestion.answer_3
                ? "highlight-right-answer"
                : ""
            }
          >
            {currentQuestion.answer_3}
          </div>
          <div
            className={
              showAnswers && rightAnswer === currentQuestion.answer_4
                ? "highlight-right-answer"
                : ""
            }
          >
            {currentQuestion.answer_4}
          </div>
        </div>
      ) : null}
    </div>
  );
});

export default RightAnswer;
