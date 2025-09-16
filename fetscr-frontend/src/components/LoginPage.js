import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPages.css";

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [resetData, setResetData] = useState({
    email: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();

  // Login form handlers
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Login failed");
      } else {
        localStorage.setItem("fetscr_token", data.token);
        localStorage.setItem("fetscr_user", JSON.stringify(data.user));
        navigate("/home");
      }
    } catch (err) {
      setError("Server error: " + err.message);
    }
  };

  // Reset form handlers
  const handleResetChange = (e) => {
    setResetData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetError("");

    const { email, newPassword, confirmPassword } = resetData;
    if (!email || !newPassword || !confirmPassword) {
      setResetError("All fields are required.");
      return;
    }
    if (newPassword.length < 6) {
      setResetError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }

    try {
      setResetLoading(true);
      const res = await fetch("http://localhost:5000/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });
      const data = await res.json();

      if (!data.success) {
        setResetError(data.error || "Reset failed");
      } else {
        alert("Password reset successful. You can now login with the new password.");
        setShowReset(false);
        setResetData({ email: "", newPassword: "", confirmPassword: "" });
      }
    } catch (err) {
      setResetError("Server error: " + err.message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="login-page">
      {!showReset ? (
        <form className="auth-card" onSubmit={handleSubmit}>
          <h2>Login</h2>
          {error && <p className="error-text">{error}</p>}

          <label>
            Email
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </label>

          <button type="submit" className="btn-primary">Login</button>

          <p className="link-row">
            <button
              type="button"
              className="link-button"
              onClick={() => {
                setShowReset(true);
                setResetError("");
              }}
            >
              Forgot password?
            </button>
          </p>
        </form>
      ) : (
        <form className="auth-card" onSubmit={handleResetSubmit}>
          <h2>Reset Password</h2>
          {resetError && <p className="error-text">{resetError}</p>}

          <label>
            Email
            <input
              type="email"
              name="email"
              value={resetData.email}
              onChange={handleResetChange}
              required
            />
          </label>

          <label>
            New Password
            <input
              type="password"
              name="newPassword"
              value={resetData.newPassword}
              onChange={handleResetChange}
              required
            />
          </label>

          <label>
            Confirm Password
            <input
              type="password"
              name="confirmPassword"
              value={resetData.confirmPassword}
              onChange={handleResetChange}
              required
            />
          </label>

          <div className="btn-row">
            <button type="submit" className="btn-primary" disabled={resetLoading}>
              {resetLoading ? "Resetting..." : "Reset Password"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setShowReset(false);
                setResetError("");
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default LoginPage;
