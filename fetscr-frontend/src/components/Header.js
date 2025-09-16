// src/components/Header.js
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./Header.css";

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const isPricingPage = location.pathname === "/pricing";

  const user = JSON.parse(localStorage.getItem("fetscr_user"));
  const token = localStorage.getItem("fetscr_token");

  const getFirstLetter = (name) => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className={isPricingPage ? "header sidebar-header" : "header"}>
      <div className="header-left">
        <h2 className="logo">FETSCR</h2>
      </div>

      <nav className={isPricingPage ? "sidebar-nav" : "header-center"}>
        <Link to="/home">Home</Link>
        <Link to="/pricing">Pricing</Link>
        <a href="#community">Community</a>
        <a href="#docs">Docs</a>
      </nav>

      {!isPricingPage && (
        <div className="header-right">
          {token && user ? (
            <div
              className="profile-avatar"
              onClick={() => navigate("/profile")}
            >
              {getFirstLetter(user.name)}
            </div>
          ) : (
            <>
              <Link to="/login">
                <button className="btn-primary">Login</button>
              </Link>
              <Link to="/signup">
                <button className="btn-outline">Sign Up</button>
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
