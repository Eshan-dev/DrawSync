import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { AuthPage } from "./components/AuthPage/AuthPage";
import { CanvasDashboard } from "./components/CanvasDashboard/CanvasDashboard";
import { DrawPage } from "./components/DrawPage/DrawPage";
import { PrivateRoute } from "./components/PrivateRoute/PrivateRoute";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public auth route */}
          <Route path="/auth" element={<AuthPage />} />

          {/* Protected dashboard – canvas list */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <CanvasDashboard />
              </PrivateRoute>
            }
          />

          {/* Protected whiteboard route with canvas ID */}
          <Route
            path="/draw/:canvasId"
            element={
              <PrivateRoute>
                <DrawPage />
              </PrivateRoute>
            }
          />

          {/* Legacy /draw without ID redirects to dashboard */}
          <Route
            path="/draw"
            element={
              <PrivateRoute>
                <Navigate to="/dashboard" replace />
              </PrivateRoute>
            }
          />

          {/* Redirect root to /auth */}
          <Route path="/" element={<Navigate to="/auth" replace />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/auth" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
