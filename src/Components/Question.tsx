import { observer } from "mobx-react";

const Question = observer(() => {
  // const { currentPlayer, currentQuestion, username } = gameStore;

  // if (!currentQuestion) {
  //   gameStore.getRandomQuestion(questions);
  // }

  // if (!currentPlayer || !currentQuestion) {
  //   return <p>Chargement de la question...</p>;
  // }

  // const currentUserId = gameStore.currentGame?.players.find(
  //   (player) => player.username === currentUser
  // )?.id;

  // const isCurrentUserTurn = currentUser === currentPlayer.username;

  // if (isCurrentUserTurn && !gameStore.isCurrentPlayerAnswered) {
  //   return (
  //     <div className="container">
  //       <h3>{currentPlayer.username}, c'est votre tour de répondre !</h3>
  //       <div className="flex-column gap-1">
  //         <button
  //           className="answer"
  //           onClick={() => gameStore.setRightAnswer(currentQuestion.answer_1)}
  //         >
  //           {currentQuestion.answer_1}
  //         </button>
  //         <button
  //           className="answer"
  //           onClick={() => gameStore.setRightAnswer(currentQuestion.answer_2)}
  //         >
  //           {currentQuestion.answer_2}
  //         </button>
  //         {currentQuestion.answer_3 && (
  //           <button
  //             className="answer"
  //             onClick={() => gameStore.setRightAnswer(currentQuestion.answer_3)}
  //           >
  //             {currentQuestion.answer_3}
  //           </button>
  //         )}
  //         {currentQuestion.answer_4 && (
  //           <button
  //             className="answer"
  //             onClick={() => gameStore.setRightAnswer(currentQuestion.answer_4)}
  //           >
  //             {currentQuestion.answer_4}
  //           </button>
  //         )}
  //       </div>
  //     </div>
  //   );
  // }

  // if (!isCurrentUserTurn && !gameStore.isCurrentPlayerAnswered) {
  //   return (
  //     <div className="container">
  //       <h3>
  //         {currentPlayer.username} est en train de répondre à la question.
  //       </h3>
  //     </div>
  //   );
  // }

  return (
    <div className="container">
      {/* <h3>{currentPlayer.username} a répondu. À vous de répondre !</h3>
      <div className="flex-column gap-1">
        <button
          className="answer"
          onClick={() =>
            gameStore.submitAnswer(
              currentUserId as number,
              currentQuestion.answer_1
            )
          }
        >
          {currentQuestion.answer_1}
        </button>
        <button
          className="answer"
          onClick={() =>
            gameStore.submitAnswer(
              currentUserId as number,
              currentQuestion.answer_2
            )
          }
        >
          {currentQuestion.answer_2}
        </button>
        {currentQuestion.answer_3 && (
          <button
            className="answer"
            onClick={() =>
              gameStore.submitAnswer(
                currentUserId as number,
                currentQuestion.answer_3
              )
            }
          >
            {currentQuestion.answer_3}
          </button>
        )}
        {currentQuestion.answer_4 && (
          <button
            className="answer"
            onClick={() =>
              gameStore.submitAnswer(
                currentUserId as number,
                currentQuestion.answer_4
              )
            }
          >
            {currentQuestion.answer_4}
          </button>
        )}
      </div> */}
    </div>
  );
});

export default Question;
