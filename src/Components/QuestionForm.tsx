import { observer } from "mobx-react";
import { gameStore } from "../store";

interface QuestionFORMProps {
  submitFunc: (selectedAnswer: string | null) => void;
}

const QuestionForm: React.FC<QuestionFORMProps> = observer(({ submitFunc }) => {
  const { currentPlayer, roundPlayer, currentQuestion } = gameStore;

  return (
    <>
      {currentQuestion ? (
        <div className="colmn-space-btwn">
          <p>
            {currentPlayer?.username},
            {currentPlayer?.username !== roundPlayer?.username
              ? ` qu'a répondu ${roundPlayer?.username} à la question : `
              : null}
            {` ${currentQuestion.name}`}
          </p>
          <div className="flex-column gap-2">
            <button
              className="answer-btn"
              onClick={() => submitFunc(currentQuestion.answer_1)}
            >
              {currentQuestion.answer_1}
            </button>
            <button
              className="answer-btn"
              onClick={() => submitFunc(currentQuestion.answer_2)}
            >
              {currentQuestion.answer_2}
            </button>
            {currentQuestion.answer_3 ? (
              <button
                className="answer-btn"
                onClick={() => submitFunc(currentQuestion.answer_3)}
              >
                {currentQuestion.answer_3}
              </button>
            ) : null}
            {currentQuestion.answer_4 ? (
              <button
                className="answer-btn"
                onClick={() => submitFunc(currentQuestion.answer_4)}
              >
                {currentQuestion.answer_4}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
});

export default QuestionForm;
