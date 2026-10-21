import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

/**
 * Wraps a route and redirects unauthenticated users to /auth.
 */
export function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/auth" replace />;
}
