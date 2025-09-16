// src/components/Profile.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";   // ⬅ import navigate
import "./Profile.css";

export default function Profile() {
  const storedUser = JSON.parse(localStorage.getItem("fetscr_user"));
  const [user, setUser] = useState(storedUser);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();   // ⬅ setup navigate

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });

  if (!user) {
    return (
      <div className="profile-container">
        <h2>User not found</h2>
        <p>Please login again.</p>
      </div>
    );
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = () => {
    const updatedUser = { ...user, ...formData };
    localStorage.setItem("fetscr_user", JSON.stringify(updatedUser));
    setUser(updatedUser);
    setIsEditing(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("fetscr_user");
    localStorage.removeItem("fetscr_token");
    navigate("/login");
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-avatar-large">
          {user.name ? user.name.charAt(0).toUpperCase() : "?"}
        </div>

        {!isEditing ? (
          <>
            <h2>{user.name}</h2>
            <p>Email: {user.email || "Not provided"}</p>

            <div className="profile-actions">
              <button className="btn-primary" onClick={() => setIsEditing(true)}>
                Edit Profile
              </button>
              <button className="btn-outline logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </>
        ) : (
          <>
            <h2>Edit Profile</h2>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              className="profile-input"
            />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="profile-input"
            />
            <div className="edit-actions">
              <button className="btn-primary" onClick={handleSave}>
                Save
              </button>
              <button className="btn-outline" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
