import { observer } from "mobx-react-lite";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

// 🔓 Version temporaire sans authentification
const AdminProtectedRoute = observer(({ children }: AdminProtectedRouteProps) => {
  return <>{children}</>;
});

export default AdminProtectedRoute;
