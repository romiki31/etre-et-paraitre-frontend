import { observer } from "mobx-react-lite";
import { useState } from "react";
import { useAdminAuth } from "../hooks/useAdminAuth";

const AdminLogin = observer(() => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, error } = useAdminAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setLoading(true);
    try {
      await login(password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="login-container">
        <div className="login-header">
          <h1>Administration</h1>
          <p className="soft-text">Connectez-vous pour gérer les questions du jeu</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="password" className="input-label">
              Mot de passe administrateur
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Entrez votre mot de passe"
              className="login-input"
              disabled={loading}
              autoFocus
            />
          </div>

          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="login-button"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div className="login-footer">
          <p className="very-small-text">
            Accès réservé aux administrateurs autorisés
          </p>
        </div>
      </div>
    </div>
  );
});

export default AdminLogin;