import React from "react";

interface PopupProps {
  onClose: () => void;
  children: React.ReactNode;
}

const Popup: React.FC<PopupProps> = ({ onClose, children }) => {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          background:
            "linear-gradient(0deg, rgba(61, 20, 92, 1) 0%, rgb(115, 27, 133) 80%)",
        }}
      >
        <div className="container">
          <div className="flex-end">
            <button
              className="btn-icon"
              style={{
                all: "unset",
                cursor: "pointer",
              }}
              onClick={onClose}
            >
              <img src="/assets/close.png" alt="" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Popup;
