import { observer } from "mobx-react-lite";
import { gameStore } from "../store";

interface QuestionFORMProps {
  submitFunc: (selectedAnswer: string | null) => void;
  isDisabled: boolean;
}

const QuestionForm: React.FC<QuestionFORMProps> = observer(
  ({ submitFunc, isDisabled }) => {
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
            {!isDisabled ? (
              <div>
                {" "}
                <p className="soft-text m-b-10">
                  {roundPlayer?.id !== currentPlayer?.id ? (
                    <span className="accent-text">
                      {currentPlayer?.username}
                    </span>
                  ) : null}
                  {currentPlayer?.username !== roundPlayer?.username ? (
                    <>
                      {", qu'a répondu "}
                      <span className="accent-text">
                        {roundPlayer?.username}
                      </span>
                      {" à la question : "}
                    </>
                  ) : null}
                </p>
                <p>
                  {roundPlayer?.id === currentPlayer?.id ? (
                    <>
                      <span className="accent-text">
                        {currentPlayer?.username}
                      </span>
                      <span>,</span>
                    </>
                  ) : null}
                  <span className="strong">{` ${currentQuestion.name}`}</span>
                </p>
              </div>
            ) : null}

            {currentRound.id === 3 || currentRound.id === 4 ? (
              <div className="flex-column gap-2">
                {currentGame?.players.map((p) => {
                  if (currentRound.id === 4 && p.id === roundPlayer?.id) {
                    return <></>;
                  } else {
                    return (
                      <button
                        key={p.id}
                        className={isDisabled ? "disabled-btn" : "answer-btn"}
                        onClick={() => submitFunc(p.username)}
                        disabled={isDisabled ?? false}
                      >
                        {p.username}
                      </button>
                    );
                  }
                })}
              </div>
            ) : (
              <div className="flex-column gap-1">
                <button
                  className={isDisabled ? "disabled-btn" : "answer-btn"}
                  onClick={() => submitFunc(currentQuestion.answer_1)}
                  disabled={isDisabled ?? false}
                >
                  {currentQuestion.answer_1}
                </button>
                <button
                  className={isDisabled ? "disabled-btn" : "answer-btn"}
                  onClick={() => submitFunc(currentQuestion.answer_2)}
                  disabled={isDisabled ?? false}
                >
                  {currentQuestion.answer_2}
                </button>
                {currentQuestion.answer_3 ? (
                  <button
                    className={isDisabled ? "disabled-btn" : "answer-btn"}
                    onClick={() => submitFunc(currentQuestion.answer_3)}
                    disabled={isDisabled ?? false}
                  >
                    {currentQuestion.answer_3}
                  </button>
                ) : null}
                {currentQuestion.answer_4 ? (
                  <button
                    className={isDisabled ? "disabled-btn" : "answer-btn"}
                    onClick={() => submitFunc(currentQuestion.answer_4)}
                    disabled={isDisabled ?? false}
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
  }
);

export default QuestionForm;
