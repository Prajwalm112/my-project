import React from "react";
import { Routes, Route } from "react-router-dom";

// Components
import Header from "./components/Header";
import Home from "./components/Home";
import LoginPage from "./components/LoginPage";
import SignUpPage from "./components/Signup";
import Results from "./components/Results";
import EditProfile from "./components/EditProfile";
import Profile from "./components/Profile";
import SubscriptionPlans from "./components/SubscriptionPlans";
import MorePlans from "./components/MorePlans";
import ResetPassword from "./components/ResetPassword";

function App() {
  return (
    <>
      <Header />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/results" element={<Results />} />
        <Route path="/pricing" element={<SubscriptionPlans />} />
        <Route path="/more-plans" element={<MorePlans />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/editprofile" element={<EditProfile />} />
      </Routes>
    </>
  );
}

export default App;
