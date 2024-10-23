import { observer } from "mobx-react";
import { gameStore } from "../store";

interface QuestionFORMProps {
  submitFunc: (selectedAnswer: string | null) => void;
}

const QuestionForm: React.FC<QuestionFORMProps> = observer(({ submitFunc }) => {
  const {
    currentPlayer,
    roundPlayer,
    currentQuestion,
    currentRound,
    gamePlayers,
  } = gameStore;

  return (
    <>
      {currentQuestion ? (
        <>
          <p>
            <span className="accent-text">{currentPlayer?.username}</span>
            {currentPlayer?.username !== roundPlayer?.username
              ? ` qu'a répondu ${roundPlayer?.username} à la question : `
              : null}
            <span className="strong">{` ${currentQuestion.name}`}</span>
          </p>

          {currentRound?.id === 3 || currentRound?.id === 4 ? (
            <div className="flex-column gap-2">
              {gamePlayers.map((p) => {
                return (
                  <button
                    key={p.id}
                    className="answer-btn"
                    onClick={() => submitFunc(p.username)}
                  >
                    {p.username}
                  </button>
                );
              })}
            </div>
          ) : (
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
          )}
        </>
      ) : null}
    </>
  );
});

export default QuestionForm;
