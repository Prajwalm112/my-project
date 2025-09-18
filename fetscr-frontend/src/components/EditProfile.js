// src/components/EditProfile.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./EditProfile.css";

export default function EditProfile() {
  const navigate = useNavigate();

  let storedUser = {};
  try {
    storedUser = JSON.parse(localStorage.getItem("fetscr_user")) || {};
  } catch (err) {
    console.error("Invalid user data in localStorage");
  }

  const token = localStorage.getItem("fetscr_token");

  const [formData, setFormData] = useState({
    name: storedUser.name || "",
    email: storedUser.email || "",
  });

  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateForm = () => {
    if (formData.name.trim().length < 2) {
      setMessage("Name must be at least 2 characters long.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setMessage("Please enter a valid email address.");
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    // Update localStorage (replace this with API call if backend ready)
    localStorage.setItem("fetscr_user", JSON.stringify(formData));
    setMessage("✅ Profile updated successfully!");
    setTimeout(() => navigate("/home"), 1200);
  };

  return (
    <div className="edit-profile-page">
      <form className="edit-profile-form" onSubmit={handleSubmit}>
        <h2>Edit Profile</h2>

        {message && <p className="form-message">{message}</p>}

        <label>
          Name
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your name"
            required
          />
        </label>

        <label>
          Email
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
            required
          />
        </label>

        <button type="submit">Save Changes</button>
      </form>
    </div>
  );
}
