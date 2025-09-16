import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import LoginPage from "./components/LoginPage";
import SignUpPage from "./components/Signup";
import Home from "./components/Home";
import Results from "./components/Results";
import EditProfile from "./components/EditProfile"; 
import Profile from "./components/Profile";
import SubscriptionPlans from "./components/SubscriptionPlans";
import ResetPassword from "./components/ResetPassword";
import MorePlans from "./components/MorePlans";

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/results" element={<Results />} />
        <Route path="/pricing" element={<SubscriptionPlans />} />
        <Route path="/more-plans" element={<MorePlans />} />
        <Route path="/login" element={<LoginPage/>} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/signup" element={<SignUpPage/>} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/editprofile" element={<EditProfile/>} />
      </Routes>
    </Router>
  );
}

export default App;
