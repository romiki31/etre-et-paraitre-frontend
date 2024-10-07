import { observer } from "mobx-react";
import { gameStore } from "../store";

interface QuestionFORMProps {
  submitFunc: (selectedAnswer: string | null) => void;
}

const QuestionForm: React.FC<QuestionFORMProps> = observer(({ submitFunc }) => {
  const { currentPlayer, currentQuestion } = gameStore;
  return (
    <>
      {currentQuestion ? (
        <div className="container">
          <div>
            {currentPlayer?.username}, {currentQuestion.name}
          </div>
          <div>
            <button onClick={() => submitFunc(currentQuestion.answer_1)}>
              {currentQuestion.answer_1}
            </button>
          </div>
          <div>
            <button onClick={() => submitFunc(currentQuestion.answer_2)}>
              {currentQuestion.answer_2}
            </button>
            {currentQuestion.answer_3 ? (
              <button onClick={() => submitFunc(currentQuestion.answer_3)}>
                {currentQuestion.answer_3}
              </button>
            ) : null}
            {currentQuestion.answer_4 ? (
              <button onClick={() => submitFunc(currentQuestion.answer_4)}>
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
