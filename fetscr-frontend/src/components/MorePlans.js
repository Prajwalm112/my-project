import React from "react";
import { useNavigate } from "react-router-dom";
import "./MorePlans.css";

const SERVER = "http://localhost:5000";

const MorePlans = () => {
  const navigate = useNavigate();

  async function choose(planPayload) {
    try {
      const token = localStorage.getItem("fetscr_token");
      if (!token) {
        alert("Please login to choose a plan.");
        navigate("/login");
        return;
      }
      const res = await fetch(`${SERVER}/setPlan`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(planPayload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert("❌ Failed to set plan: " + (data.error || "Unknown error"));
        return;
      }
      alert(`✅ Plan activated: ${data.plan} (${data.allowed_queries} queries × ${data.results_per_query} results)`);
      navigate("/home");
    } catch (err) {
      console.error("choose plan error:", err);
      alert("❌ Failed to set plan: " + (err.message || "Unknown error"));
    }
  }

  return (
    <div className="subscription-container">
      <h1>More Pro Plans</h1>

      <div className="plans">
        {/* Sub2 */}
        <div className="plan">
          <h2>Sub2</h2>
          <p>30 Queries · 50 Results/query</p>
          <p className="price">$52.94</p>
          <button onClick={() => choose({ plan: "sub2" })}>Subscribe Sub2</button>
        </div>

        {/* Sub3 */}
        <div className="plan">
          <h2>Sub3</h2>
          <p>30 Queries · 25 Results/query</p>
          <p className="price">$26.47</p>
          <button onClick={() => choose({ plan: "sub3" })}>Subscribe Sub3</button>
        </div>

        {/* Sub4 */}
        <div className="plan">
          <h2>Sub4</h2>
          <p>20 Queries · 50 Results/query</p>
          <p className="price">$35.29</p>
          <button onClick={() => choose({ plan:  "sub4" })}>Subscribe Sub4</button>
        </div>
      </div>

      <button className="back-btn" onClick={() => navigate(-1)}>
        ⬅ Back
      </button>
    </div>
  );
};

export default MorePlans;
