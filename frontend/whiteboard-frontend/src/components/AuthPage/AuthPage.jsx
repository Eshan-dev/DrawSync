import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "./AuthPage.css";

export function AuthPage() {
  const [tab, setTab] = useState("login");
  const navigate = useNavigate();
  const { login, register, loading } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setError("");
    setSuccess("");
    setShowPassword(false);
  };

  const switchTab = (t) => {
    setTab(t);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (tab === "register") {
      const result = await register(name, email, password);
      if (result.success) {
        setSuccess("Account created successfully. Please sign in.");
        switchTab("login");
      } else {
        setError(result.error);
      }
    } else {
      const result = await login(email, password);
      if (result.success) {
        navigate("/dashboard");
      } else {
        setError(result.error);
      }
    }
  };

  /* Inline SVG icons to avoid emoji usage */
  const iconPen = (
    <svg viewBox="0 0 24 24">
      <path d="M12 19l7-7 3 3-7 7-3-3z" />
      <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
      <path d="M2 2l7.586 7.586" />
      <circle cx="11" cy="11" r="2" />
    </svg>
  );

  const iconUser = (
    <svg viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );

  const iconMail = (
    <svg viewBox="0 0 24 24">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );

  const iconLock = (
    <svg viewBox="0 0 24 24">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );

  const iconEye = (
    <svg viewBox="0 0 24 24">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );

  const iconEyeOff = (
    <svg viewBox="0 0 24 24">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="m1 1 22 22" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
    </svg>
  );

  return (
    <div className="auth-bg">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <span className="auth-logo-icon">{iconPen}</span>
          <h1 className="auth-logo-text">DrawSync</h1>
        </div>
        <p className="auth-tagline">Collaborate. Draw. Create.</p>

        {/* Tab switcher */}
        <div className="auth-tabs">
          <button
            id="tab-login"
            className={`auth-tab ${tab === "login" ? "active" : ""}`}
            onClick={() => switchTab("login")}
          >
            Sign In
          </button>
          <button
            id="tab-register"
            className={`auth-tab ${tab === "register" ? "active" : ""}`}
            onClick={() => switchTab("register")}
          >
            Register
          </button>
          <span
            className="auth-tab-indicator"
            style={{ left: tab === "login" ? "0%" : "50%" }}
          />
        </div>

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {tab === "register" && (
            <div className="auth-field" style={{ animationDelay: "0ms" }}>
              <label htmlFor="input-name" className="auth-label">
                Full Name
              </label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">{iconUser}</span>
                <input
                  id="input-name"
                  className="auth-input"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="input-email" className="auth-label">
              Email Address
            </label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">{iconMail}</span>
              <input
                id="input-email"
                className="auth-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="input-password" className="auth-label">
              Password
            </label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">{iconLock}</span>
              <input
                id="input-password"
                className="auth-input"
                type={showPassword ? "text" : "password"}
                placeholder={
                  tab === "register"
                    ? "Min 8 chars, uppercase, symbol..."
                    : "Your password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={
                  tab === "register" ? "new-password" : "current-password"
                }
              />
              <button
                type="button"
                className="auth-toggle-pass"
                onClick={() => setShowPassword((v) => !v)}
                aria-label="Toggle password visibility"
                id="btn-toggle-password"
              >
                {showPassword ? iconEyeOff : iconEye}
              </button>
            </div>
            {tab === "register" && (
              <p className="auth-hint">
                Must contain uppercase, number &amp; special character.
              </p>
            )}
          </div>

          {/* Error / Success */}
          {error && (
            <div className="auth-alert auth-alert-error" role="alert">
              {error}
            </div>
          )}
          {success && (
            <div className="auth-alert auth-alert-success" role="alert">
              {success}
            </div>
          )}

          <button
            id="btn-auth-submit"
            className="auth-btn"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <span className="auth-spinner" />
            ) : tab === "login" ? (
              "Sign In"
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="auth-footer">
          {tab === "login"
            ? "Don't have an account? "
            : "Already have an account? "}
          <button
            id="btn-switch-tab"
            className="auth-footer-link"
            onClick={() =>
              switchTab(tab === "login" ? "register" : "login")
            }
          >
            {tab === "login" ? "Register here" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
