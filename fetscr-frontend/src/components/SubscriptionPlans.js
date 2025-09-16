import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./plans.css";

const SERVER = "http://localhost:5000";

const SubscriptionPlans = () => {
  const [customQueries, setCustomQueries] = useState(1);
  const [customResults, setCustomResults] = useState(5);
  const [customPrice, setCustomPrice] = useState("$0");
  const navigate = useNavigate();

  useEffect(() => {
    const totalResults = customQueries * customResults;
    const priceINR = totalResults * 3;
    const priceUSD = (priceINR / 83).toFixed(2);
    setCustomPrice(`$${priceUSD}`);
  }, [customQueries, customResults]);

  // helper to call backend setPlan
  async function callSetPlan(payload) {
    try {
      const token = localStorage.getItem("fetscr_token");
      if (!token) {
        alert("Please login to choose a plan.");
        navigate("/login");
        return null;
      }

      const res = await fetch(`${SERVER}/setPlan`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert("❌ Failed to set plan: " + (data.error || "Unknown error"));
        return null;
      }
      return data;
    } catch (err) {
      console.error("setPlan error:", err);
      alert("❌ Failed to set plan: " + (err.message || "Unknown error"));
      return null;
    }
  }

  // --- Choosing Predefined Plans ---
  async function choosePlan(plan) {
    const data = await callSetPlan({ plan });
    if (!data) return;
    alert(`✅ Plan activated: ${data.plan.toUpperCase()} (${data.allowed_queries} queries × ${data.results_per_query} results)`);
    navigate("/home");
  }

  // --- Choosing Custom Plan ---
  async function chooseCustomPlan() {
    if (!customQueries || !customResults || customResults > 100) {
      alert("⚠ Please enter valid values (Max results = 100).");
      return;
    }
    const payload = {
      plan: "enterprise",
      queries: customQueries,
      results: customResults,
    };
    const data = await callSetPlan(payload);
    if (!data) return;
    alert(
      `✅ Custom Plan Activated: ${customQueries} queries × ${customResults} results/query.\nConfirmed Price: $${data.priceUSD}`
    );
    navigate("/home");
  }

  return (
    <div className="subscription-container" id="pricing">
      <h1>Choose Your Subscription Plan</h1>
      <div className="plans">
        {/* Free Plan */}
        <div className="plan">
          <h2>Base (Free)</h2>
          <p className="price">Free</p>
          <p>✔ 2 Queries</p>
          <p>✔ 5 Results per Query</p>
          <button onClick={() => choosePlan("free")}>Start Free</button>
        </div>

        {/* Enterprise Plan */}
        <div className="plan">
          <h2>Enterprise</h2>
          <p className="price" id="customPrice">{customPrice}</p>
          <label>Number of Queries</label>
          <input
            type="number"
            min="1"
            max="10000"
            value={customQueries}
            onChange={(e) => setCustomQueries(parseInt(e.target.value) || 0)}
          />
          <label>Results per Query (max 100)</label>
          <input
            type="number"
            min="1"
            max="100"
            value={customResults}
            onChange={(e) => setCustomResults(parseInt(e.target.value) || 0)}
          />
          <p>
            <small>💡 Price = $0.04 per data (result)</small>
          </p>
          <button onClick={chooseCustomPlan}>Subscribe</button>
        </div>

        {/* Pro Plan */}
        <div className="plan">
          <h2>Pro Plan</h2>
          <p className="price">Fixed Options</p>
          <div className="sub-options">
            <p>
              <b>Sub1:</b> 30 Queries · 20 Results/query · $21.18
            </p>
            <button onClick={() => choosePlan("sub1")}>Subscribe Sub1</button>

            {/* Click More inside Pro section */}
            <button
              className="click-more-btn"
              onClick={() => navigate("/more-plans")}
            >
              Click More
            </button>
          </div>
        </div>
        <button className="back-btn" onClick={() => navigate(-1)}>
        ⬅ Back
      </button>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
