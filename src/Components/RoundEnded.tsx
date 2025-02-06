import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import WeroLogo from "../assets/wero-logo.svg";
import { gameStore } from "../store";

const RoundEnded = observer(() => {
  const { winners } = gameStore;
  const [showThankYouMessage, setShowThankYouMessage] = useState(false);

  useEffect(() => {
    if (winners) {
      const timer = setTimeout(() => {
        setShowThankYouMessage(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShowThankYouMessage(false);
    }
  }, [winners]);

  return (
    <>
      {winners ? (
        showThankYouMessage ? (
          <div className="colmn-space-btwn thank-you-container">
            <h4 className="accent-color">
              Aidez-nous à créer une fonctionnalité pour enchaîner vos parties !
              Et bien plus encore...
            </h4>
            <div className="center-text">
              <p className="accent-color">Soutenez le projet avec un don</p>
              <a
                href="https://start.wero-wallet.eu/?wero-uc=share&wero-url=https%3A%2F%2Fshare.weropay.eu%2Fp%2F1%2Fc%2F48eaVLf4kK"
                target="_blank"
              >
                <img src={WeroLogo} alt="" />
              </a>
            </div>
          </div>
        ) : (
          <div className="colmn-space-btwn">
            <div></div>
            {winners.length > 1 ? (
              <h3>
                <span className="accent-color">
                  {winners.map((winner, index) =>
                    index === winners.length - 1 && index !== 0
                      ? ` et ${winner.username}`
                      : `${index > 0 ? ", " : ""}${winner.username}`
                  )}
                </span>{" "}
                ont gagné et sont arrivés ex-aequo !
              </h3>
            ) : (
              <h3>
                <span className="accent-color">{winners[0].username}</span> a
                remporté la partie !
              </h3>
            )}

            <div></div>
          </div>
        )
      ) : (
        <div>
          <h2>MANCHE TERMINÉE !</h2>
        </div>
      )}
    </>
  );
});

export default RoundEnded;
