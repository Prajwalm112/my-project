// src/components/Signup.js
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./Signup.css";

const SignUpPage = () => {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:5000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Signup failed");
      } else {
        alert("Signup successful! Please login.");
        navigate("/login");
      }
    } catch (err) {
      setError("Server error: " + err.message);
    }
  };

  return (
    <div className="signup-page">
      <form className="signup-form" onSubmit={handleSubmit}>
        <h2>Sign Up</h2>

        {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

        <label>
          Name
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        </label>

        <label>
          Email
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />
        </label>

        <label>
          Password
          <input type="password" name="password" value={formData.password} onChange={handleChange} required />
        </label>

        <button type="submit">Sign Up</button>

        <p>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </form>
    </div>
  );
};

export default SignUpPage;
