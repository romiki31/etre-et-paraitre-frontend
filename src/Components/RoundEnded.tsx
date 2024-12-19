import { observer } from "mobx-react-lite";
import { useEffect, useState } from "react";
import WeroLogo from "../assets/wero-logo.svg";
import { gameStore } from "../store";

const RoundEnded = observer(() => {
  const { winner } = gameStore;
  const [showThankYouMessage, setShowThankYouMessage] = useState(false);

  useEffect(() => {
    if (winner) {
      const timer = setTimeout(() => {
        setShowThankYouMessage(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShowThankYouMessage(false);
    }
  }, [winner]);

  return (
    <>
      {winner ? (
        showThankYouMessage ? (
          <div className="colmn-space-btwn thank-you-container">
            <h4 className="accent-color">
              On construit ce jeu à deux, mais avec votre aide (même la plus
              modeste) il peut devenir bien plus
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
            <h3>
              <span className="accent-color">{winner.username}</span> a remporté
              la partie !
            </h3>
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
