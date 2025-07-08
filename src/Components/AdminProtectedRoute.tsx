import { observer } from "mobx-react-lite";
import { useEffect } from "react";
import { useAdminAuth } from "../hooks/useAdminAuth";
import { goToUrl } from "../routes";
import AdminLogin from "./AdminLogin";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute = observer(({ children }: AdminProtectedRouteProps) => {
  const { isAuthenticated, loading } = useAdminAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      goToUrl('/admin/login');
    }
  }, [loading, isAuthenticated]);

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-container">
          <h2>Vérification de l'authentification...</h2>
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  return <>{children}</>;
});

export default AdminProtectedRoute;