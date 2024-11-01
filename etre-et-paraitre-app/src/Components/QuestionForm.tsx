import { observer } from "mobx-react-lite";
import { gameStore } from "../store";

interface QuestionFORMProps {
  submitFunc: (selectedAnswer: string | null) => void;
}

const QuestionForm: React.FC<QuestionFORMProps> = observer(({ submitFunc }) => {
  const { currentPlayerId, currentGame } = gameStore;

  const currentRound = currentGame?.currentRound;
  const currentQuestion = currentGame?.currentQuestion;
  const roundPlayer = currentGame?.players.find((p) => p.isRoundPlayer);
  const currentPlayer = currentGame?.players.find(
    (p) => p.id === currentPlayerId
  );

  return (
    <>
      {currentRound && currentPlayer && currentQuestion ? (
        <>
          <div>
            <p className="soft-text m-b-10">
              {roundPlayer?.id !== currentPlayer?.id ? (
                <span className="accent-text">{currentPlayer?.username}</span>
              ) : null}
              {currentPlayer?.username !== roundPlayer?.username ? (
                <>
                  {", qu'a répondu "}
                  <span className="accent-text">{roundPlayer?.username}</span>
                  {" à la question : "}
                </>
              ) : null}
            </p>
            <p>
              {roundPlayer?.id === currentPlayer?.id ? (
                <>
                  <span className="accent-text">{currentPlayer?.username}</span>
                  <span>,</span>
                </>
              ) : null}
              <span className="strong">{` ${currentQuestion.name}`}</span>
            </p>
          </div>

          {currentRound.id === 3 || currentRound.id === 4 ? (
            <div className="flex-column gap-2">
              {currentGame?.players.map((p) => {
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
            <div className="flex-column gap-1">
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
