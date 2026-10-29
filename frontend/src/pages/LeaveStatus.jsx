import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./LeaveStatus.css";

const API_URL = "http://127.0.0.1:8000";

function LeaveStatus() {
  const [leaves, setLeaves] = useState([]);
  const [balances, setBalances] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    const token =
      localStorage.getItem("access_token") ||
      localStorage.getItem("token");

    if (!token) {
      setError("Please log in to view your leave information.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [leaveResponse, balanceResponse, policyResponse] =
        await Promise.all([
          fetch(`${API_URL}/leaves/my`, { headers }),
          fetch(`${API_URL}/leave-policies/my-balance`, { headers }),
          fetch(`${API_URL}/leave-policies/`, { headers }),
        ]);

      const responses = [
        leaveResponse,
        balanceResponse,
        policyResponse,
      ];

      for (const response of responses) {
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(
            data.detail || "Failed to load leave information."
          );
        }
      }

      const [leaveData, balanceData, policyData] =
        await Promise.all(
          responses.map((response) => response.json())
        );

      setLeaves(Array.isArray(leaveData) ? leaveData : []);
      setBalances(Array.isArray(balanceData) ? balanceData : []);
      setPolicies(Array.isArray(policyData) ? policyData : []);
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <p className="leave-message">Loading leave information...</p>;
  }

  if (error) {
    return (
      <main className="leave-page">
        <p className="leave-error" role="alert">{error}</p>
        <button type="button" onClick={fetchData}>
          Try Again
        </button>
      </main>
    );
  }

  const getBalance = (leaveType) =>
    balances.find(
      (item) => item.leave_type?.toUpperCase() === leaveType
    );

  const getPolicy = (leaveType) =>
    policies.find(
      (item) => item.leave_type?.toUpperCase() === leaveType
    );

  const leaveTypes = [
    { type: "SICK", label: "Sick Leave" },
    { type: "CASUAL", label: "Casual Leave" },
    { type: "PAID", label: "Paid Leave" },
  ];

  return (
    <main className="leave-page">
      <header className="leave-header">
        <div>
          <h2>My Leave Dashboard</h2>
          <p>View your leave balances, policies and applications.</p>
        </div>

        <Link className="leave-apply-link" to="/leaves/apply">
          Apply for Leave
        </Link>
      </header>

      <section className="leave-balance-section">
        <h3>My Leave Balances</h3>

        <div className="leave-balance-grid">
          {leaveTypes.map(({ type, label }) => {
            const balance = getBalance(type);
            const policy = getPolicy(type);
            const remaining = balance?.remaining_days;
            const allowed = policy?.total_days_allowed;

            return (
              <article className="leave-balance-card" key={type}>
                <h4>{label}</h4>

                <p className="leave-balance-number">
                  {remaining ?? "—"}
                  <span> days remaining</span>
                </p>

                <p>
                  Annual allowance: {allowed ?? "Not configured"} days
                </p>

                {remaining == null && (
                  <p className="leave-note">
                    Balance not initialized.
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="leave-policy-section">
        <h3>Leave Policy Overview</h3>

        {policies.length === 0 ? (
          <p>No leave policies have been configured yet.</p>
        ) : (
          <div className="leave-policy-list">
            {policies.map((policy) => (
              <article
                className="leave-policy-card"
                key={policy.id}
              >
                <strong>
                  {policy.leave_type.replaceAll("_", " ")}
                </strong>
                <span>
                  {policy.total_days_allowed} days allowed
                </span>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="leave-history-section">
        <h3>My Leave History</h3>

        <div className="leave-summary">
          <div>
            <span>Total Applications</span>
            <strong>{leaves.length}</strong>
          </div>
          <div>
            <span>Pending</span>
            <strong>
              {leaves.filter(
                (leave) => leave.status?.toUpperCase() === "PENDING"
              ).length}
            </strong>
          </div>
          <div>
            <span>Approved</span>
            <strong>
              {leaves.filter(
                (leave) => leave.status?.toUpperCase() === "APPROVED"
              ).length}
            </strong>
          </div>
          <div>
            <span>Rejected</span>
            <strong>
              {leaves.filter(
                (leave) => leave.status?.toUpperCase() === "REJECTED"
              ).length}
            </strong>
          </div>
        </div>

        {leaves.length === 0 ? (
          <section className="leave-empty">
            <h4>No leave applications yet</h4>
            <p>Your leave requests will appear here.</p>
            <Link to="/leaves/apply">
              Submit your first application
            </Link>
          </section>
        ) : (
          <section className="leave-list">
            {leaves.map((leave) => (
              <article className="leave-card" key={leave.id}>
                <div className="leave-card-header">
                  <h4>{leave.leave_type} Leave</h4>
                  <span
                    className={`leave-status status-${String(
                      leave.status
                    ).toLowerCase()}`}
                  >
                    {leave.status}
                  </span>
                </div>

                <p><strong>Start date:</strong> {leave.start_date}</p>
                <p><strong>End date:</strong> {leave.end_date}</p>
                <p><strong>Reason:</strong> {leave.reason}</p>
              </article>
            ))}
          </section>
        )}
      </section>
    </main>
  );
}

export default LeaveStatus;
